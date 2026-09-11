# Visor móvil, bloque 4g: el pellizco y el encuadre que se adapta al brillo

> **Para quien lo ejecute con agentes:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementar este plan tarea a tarea. Los
> pasos llevan casilla (`- [ ]`) para poder marcarlos.

**Objetivo:** cerrar las tres cosas que los bloques 4a–4f apartaron a propósito
—ampliar la foto pellizcando, medir el brillo de la foto y pintar el encuadre de
cuatro esquinas que se tiñe según esa medida—, dejando `Brillo` con consumidor
por primera vez desde que se escribió en el bloque 4c.

**Arquitectura:** un módulo puro nuevo (`MovilZoom`) que guarda escala y
desplazamiento y no toca el DOM, un módulo nuevo (`MovilBrillo`) que aporta la
función `medir` que `Brillo.decidir` lleva esperando desde el 4c, y el cableado
de los dos en `js/movil-visor.js`, que es el único sitio que toca nodos. El
encuadre son cuatro elementos en `index.html` y un juego de reglas en
`css/luque.css` calcado del `.visor-esquina` del escritorio; el tratamiento se
comunica con una clase en la raíz del visor y no elemento a elemento.

**Pila:** HTML, CSS y JavaScript ES5 escritos a mano. Sin framework, sin paso de
compilación, sin gestor de paquetes, sin dependencias. Patrón `window.Nombre`
con IIFE, como todo `js/`.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md` — en concreto la
línea «**Ampliar:** pellizcando con dos dedos, hasta los 2400px reales del
archivo», la sección «Las esquinas se adaptan al brillo de la foto» y la fila
«No se puede medir el brillo → Esquinas con halo oscuro. Se registra» de la
tabla de fallos.

**Estado de partida:** rama `claude/plan-4g-mobile-implementation-86cbec` sobre
`main` en `a2ca4c0`, con los bloques 4a–4f y el contenido real fusionados.
Medido el 2026-09-10 antes de empezar: **464 comprobaciones, 0 fallos** en
`tests/test.html`, y **52 comprobaciones, 0 fallos** en
`node tests/prueba-borrador.js`.

## Restricciones globales

Vinculan a todas las tareas.

- **ES5 a mano.** Nada de `let`, `const`, funciones flecha, plantillas de
  cadena, clases ni `async//await`. Los módulos son
  `window.Nombre = (function () { … })();`.
- **Sin dependencias nuevas.** No hay `package.json` para el sitio; lo único que
  se ejecuta con `node` es `tests/prueba-borrador.js`, que no cambia aquí.
- **Un archivo, una responsabilidad.** Los módulos puros no tocan el DOM; el que
  toca nodos es `js/movil-visor.js`. Si una tarea pide meter un lienzo en un
  módulo puro, es que la tarea está mal leída.
- **Los comentarios explican POR QUÉ, no qué.** Es la convención de todo `js/`:
  cada decisión no obvia lleva su párrafo, con la medida o el fallo concreto que
  la motivó. Un comentario que repite el código sobra.
- **Mensajes de commit en castellano y en frase**, como el historial:
  «El hueco de la ficha se ve: `######` donde falta un dato». Nada de `feat:` ni
  `fix:`. Cada commit termina con:

  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

- **Las dos suites se ejecutan enteras antes de cada commit.**
  `tests/test.html` se abre servido (`python -m http.server` desde la raíz del
  repositorio; con doble clic las secciones que usan iframes fallan a
  propósito), y `node tests/prueba-borrador.js` desde la raíz.
- **Un archivo nuevo en `js/` no existe hasta que está en un `<script>`.**
  `tests/test.html` para poder probarlo, `index.html` para que llegue al sitio.
  El orden importa: los módulos puros van antes que quien los consume.
- **Los colores salen de las variables que ya hay**: `var(--yellow)` y
  `var(--black)`. No se introduce ningún color nuevo en la paleta; la spec lo
  prohíbe explícitamente al descartar el velo blanco.
- **No se despliega.** Desplegar es a mano y con permiso explícito; este bloque
  termina en la rama.

---

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `js/movil-zoom.js` | Estado puro del zoom: escala, desplazamiento, tope y acotado. Sin DOM. |
| `js/movil-brillo.js` | La aritmética de la luminancia (pura) y el medidor de lienzo que `Brillo.decidir` recibe como argumento. |
| `tests/pruebas-movil-zoom.js` | Pruebas puras de `MovilZoom`. |
| `tests/pruebas-movil-brillo.js` | Pruebas puras de la luminancia, más el camino de degradación y dos fotos de verdad generadas en un lienzo. |
| `tests/pruebas-movil-visor-zoom.js` | Pruebas DOM del cableado del pellizco en el visor. |
| `tests/pruebas-movil-visor-esquinas.js` | Pruebas DOM del tratamiento del encuadre. |

**Se modifican:**

| Archivo | Qué cambia |
|---|---|
| `js/movil-visor.js` | Cablea `MovilZoom` (Tarea 2) y `MovilBrillo` (Tarea 4). Es el único archivo que toca las dos cosas. |
| `js/brillo.js` | Sólo el comentario de cabecera: cuenta una historia de CORS y `picsum` que dejó de ser cierta con el contenido real (Tarea 3). |
| `index.html` | Los `<script>` nuevos y los cuatro elementos del encuadre dentro de `.mvisor`. |
| `css/luque.css` | `.mvisor-esquina` y los tres tratamientos. |
| `tests/test.html` | Los seis `<script>` nuevos. |
| `tests/pruebas-movil-visor.js` | `MV_MARCADO` gana las cuatro esquinas, para que los arneses de todas las pruebas del visor tengan el mismo marcado que el sitio. |
| `docs/estado-conocido.md` | Tres afirmaciones que este bloque deja falsas, y lo que queda sin verificar (Tarea 5). |

**Orden y por qué:** la Tarea 1 no depende de nada; la 2 consume la 1; la 3 no
depende de ninguna de las dos y podría hacerse antes; la 4 consume la 3 y toca
el mismo archivo que la 2, así que va después para no cruzarse con ella en
`js/movil-visor.js`; la 5 cierra la documentación cuando ya no puede cambiar
nada de lo escrito.

---

## Tarea 1: `MovilZoom`, el estado del zoom sin DOM

**Archivos:**
- Crear: `js/movil-zoom.js`
- Crear: `tests/pruebas-movil-zoom.js`
- Modificar: `tests/test.html` (dos `<script>`)

**Interfaces:**
- Consume: nada.
- Produce, y la Tarea 2 consume exactamente esto:
  - `MovilZoom.inicial()` → `{escala: 1, x: 0, y: 0}`
  - `MovilZoom.maxEscala(natural, pintado)` → número ≥ 1
  - `MovilZoom.pellizcar(base, d0, d, max, caja)` → estado nuevo
  - `MovilZoom.arrastrar(estado, dx, dy, caja)` → estado nuevo
  - `MovilZoom.ampliado(estado)` → booleano
  - `MovilZoom.distancia(a, b)` → número, con `a` y `b` de la forma `{x, y}`
  - `MovilZoom.transformar(estado)` → cadena para `style.transform`
  - `caja` es siempre `{ancho, alto}` en píxeles CSS de la foto **pintada**, no
    del archivo ni de la pantalla.

- [ ] **Paso 1: escribir las pruebas, que fallan**

Crea `tests/pruebas-movil-zoom.js`:

```js
describe('MovilZoom', function () {

  /* La caja es la de la foto PINTADA, no la de la pantalla ni la del archivo:
     con `object-fit: contain` la foto deja franjas, y acotar contra la pantalla
     dejaría despegarse el borde justo el ancho de esas franjas. */
  var CAJA = { ancho: 400, alto: 500 };

  function p(x, y) { return { x: x, y: y }; }

  // ---- El punto de partida ----------------------------------------

  prueba('el estado inicial es el encaje: escala 1 y sin desplazar', function () {
    igual(MovilZoom.inicial(), { escala: 1, x: 0, y: 0 });
  });

  prueba('el encaje no cuenta como ampliado', function () {
    igual(MovilZoom.ampliado(MovilZoom.inicial()), false);
  });

  // ---- El tope ----------------------------------------------------

  /* «Hasta los píxeles reales del archivo» de la spec: el tope natural es
     cuántas veces cabe la foto pintada dentro del archivo. */
  prueba('el tope es 1:1 con los pixeles del archivo', function () {
    igual(MovilZoom.maxEscala(1200, 400), 3);
  });

  /* Con los archivos de 3000px del contenido real y un movil de 390px salen
     7,7x, y a esa escala el gesto no tiene final util: la foto se pierde. */
  prueba('el tope no pasa de 6x aunque el archivo de para mas', function () {
    igual(MovilZoom.maxEscala(3000, 390), 6);
  });

  prueba('una foto mas pequena que su caja no se puede ampliar', function () {
    igual(MovilZoom.maxEscala(200, 400), 1);
  });

  /* Una <img> sin cargar tiene naturalWidth 0, y una escena oculta mide 0 de
     ancho. Sin esta guarda saldria Infinity o NaN, y `Math.min(NaN, 6)` es NaN:
     la foto se quedaria con un transform invalido y sin un solo error. */
  prueba('medidas imposibles dan el tope 1, no NaN ni Infinity', function () {
    igual([MovilZoom.maxEscala(3000, 0), MovilZoom.maxEscala(0, 400)], [1, 1]);
  });

  // ---- El pellizco ------------------------------------------------

  prueba('separar los dedos al doble amplia al doble', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 200, 4, CAJA).escala, 2);
  });

  prueba('el pellizco no pasa del tope', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 1000, 4, CAJA).escala, 4);
  });

  /* Por debajo de 1 no se encoge: la foto ya esta encajada en la pantalla y
     empequenecerla dejaria un marco negro que nadie ha pedido. */
  prueba('juntar los dedos no encoge por debajo del encaje', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 200, 20, 4, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('una distancia de cero no mueve el estado ni lo ensucia', function () {
    var base = { escala: 2, x: 10, y: 10 };
    igual(MovilZoom.pellizcar(base, 0, 100, 4, CAJA), base);
  });

  // ---- El paseo ---------------------------------------------------

  prueba('ampliada, el dedo pasea la foto', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 30, -40, CAJA),
          { escala: 2, x: 30, y: -40 });
  });

  /* Al doble, sobra la mitad de la caja: 400*2-400 = 400, repartidos entre los
     dos lados son 200. Un dedo que empuje mas alla de eso despegaria el borde
     de la foto del marco, y el visor ensenaria fondo negro por un lado. */
  prueba('el paseo no despega el borde de la foto del marco', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 9999, 9999, CAJA),
          { escala: 2, x: 200, y: 250 });
  });

  prueba('sin ampliar el dedo no pasea: ese gesto es para navegar', function () {
    igual(MovilZoom.arrastrar(MovilZoom.inicial(), 50, 50, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('volver al encaje olvida el paseo', function () {
    igual(MovilZoom.pellizcar({ escala: 3, x: 120, y: 90 }, 300, 10, 4, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  // ---- Lo que consume quien pinta ---------------------------------

  prueba('la distancia entre dos dedos es la euclidea', function () {
    igual(MovilZoom.distancia(p(0, 0), p(3, 4)), 5);
  });

  /* El orden importa y es el que espera el CSS: primero traslada en pixeles
     sin escalar, luego escala. Al reves, el desplazamiento se multiplicaria
     por la escala y el acotado de arriba estaria midiendo otra cosa. */
  prueba('el transform traslada antes de escalar', function () {
    igual(MovilZoom.transformar({ escala: 2, x: 30, y: -40 }),
          'translate(30px, -40px) scale(2)');
  });
});
```

Registra los dos `<script>` en `tests/test.html`. El módulo, junto a los otros
puros del móvil (después de la línea de `js/movil-gestos.js`):

```html
<script src="../js/movil-zoom.js"></script>
```

Y las pruebas, después de `pruebas-movil-gestos.js`:

```html
<script src="pruebas-movil-zoom.js"></script>
```

**Todavía NO se toca `index.html`.** El módulo no tiene consumidor hasta la
Tarea 2, y cargarlo antes en el sitio sería peso muerto en el móvil de alguien.
La Tarea 2 lo añade en el mismo commit que lo cablea.

- [ ] **Paso 2: ejecutar y ver que falla**

Arranca el servidor desde la raíz del repositorio y abre
`http://localhost:8765/tests/test.html`.

Esperado: la sección `MovilZoom` en rojo, con `MovilZoom is not defined` en las
dieciséis líneas.

- [ ] **Paso 3: escribir el módulo**

Crea `js/movil-zoom.js`:

```js
window.MovilZoom = (function () {

  /* El tope natural es 1:1 con los pixeles del archivo —«hasta los pixeles
     reales» de la spec—, pero las piezas del contenido real son de 3000px de
     lado largo y un movil ronda los 390 de ancho: 7,7x. A esa escala se ve un
     trozo de foto del tamano de una una y el gesto deja de servir para mirar.
     Se acota aqui y no en quien pinta, porque es una decision sobre el gesto y
     no sobre la pantalla. */
  var TOPE = 6;

  function inicial() { return { escala: 1, x: 0, y: 0 }; }

  function ampliado(estado) { return estado.escala > 1; }

  /* `natural` es el ancho del archivo y `pintado` el de la foto en pantalla.
     La guarda cubre a la <img> que aun no ha cargado (naturalWidth 0) y a la
     escena que aun no mide (clientWidth 0): sin ella saldria Infinity o NaN, y
     NaN no da error, sino un transform invalido y silencioso. */
  function maxEscala(natural, pintado) {
    if (!(natural > 0) || !(pintado > 0)) return 1;
    var veces = natural / pintado;
    if (veces < 1) return 1;
    return Math.min(veces, TOPE);
  }

  function distancia(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* Lo que sobra de la foto ampliada por cada lado. Al doble, una caja de 400
     ocupa 800 y sobran 400 repartidos entre izquierda y derecha: 200. Ese es
     justo el desplazamiento maximo antes de que el borde se despegue. */
  function margen(lado, escala) {
    return Math.max(0, (lado * escala - lado) / 2);
  }

  function acotar(v, limite) {
    return Math.max(-limite, Math.min(limite, v));
  }

  /* El unico sitio donde se normaliza un estado, y por eso el unico que puede
     decidir que volver por debajo de 1 borra tambien el paseo: si no lo
     borrara, soltar la foto encajada la dejaria descentrada sin que nada
     explicara por que. */
  function encajar(estado, caja) {
    if (estado.escala <= 1) return inicial();
    return {
      escala: estado.escala,
      x: acotar(estado.x, margen(caja.ancho, estado.escala)),
      y: acotar(estado.y, margen(caja.alto, estado.escala))
    };
  }

  /* `base` es el estado con el que EMPEZO el pellizco, no el de la ultima
     llamada, y `d0` la distancia entre dedos en ese mismo instante. Acumulando
     sobre el estado anterior, cada `pointermove` multiplicaria otra vez y el
     mismo gesto daria escalas distintas segun cuantos eventos mandara el
     sistema —que es una cifra del navegador y del dispositivo, no del dedo. */
  function pellizcar(base, d0, d, max, caja) {
    if (!(d0 > 0) || !(d > 0)) return base;
    var escala = base.escala * (d / d0);
    if (escala < 1) escala = 1;
    if (escala > max) escala = max;
    return encajar({ escala: escala, x: base.x, y: base.y }, caja);
  }

  /* Sin ampliar devuelve el estado TAL CUAL, y eso es lo que le dice al visor
     que ese dedo no estaba paseando sino navegando. La decision de navegar o
     no la toma quien pinta preguntando por `ampliado`; aqui solo se garantiza
     que arrastrar sobre una foto encajada no puede moverla. */
  function arrastrar(estado, dx, dy, caja) {
    if (!ampliado(estado)) return estado;
    return encajar({ escala: estado.escala, x: estado.x + dx, y: estado.y + dy }, caja);
  }

  function transformar(estado) {
    return 'translate(' + estado.x + 'px, ' + estado.y + 'px) scale('
      + estado.escala + ')';
  }

  return {
    TOPE: TOPE,
    inicial: inicial, ampliado: ampliado, maxEscala: maxEscala,
    distancia: distancia, pellizcar: pellizcar, arrastrar: arrastrar,
    transformar: transformar
  };
})();
```

- [ ] **Paso 4: ejecutar y ver que pasa**

Recarga `tests/test.html`. Esperado: **480 pasan, 0 fallan** (464 + 16).
Si el número no sube exactamente en 16, falta o sobra una prueba.

- [ ] **Paso 5: commit**

```bash
git add js/movil-zoom.js tests/pruebas-movil-zoom.js tests/test.html
git commit -m "$(cat <<'EOF'
El estado del zoom, acotado y sin tocar un solo nodo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Tarea 2: el pellizco cableado en el visor

**Archivos:**
- Modificar: `js/movil-visor.js` (la sección `engancharGestos`/`soltarEn` y `pintar`)
- Modificar: `index.html` (un `<script>`)
- Crear: `tests/pruebas-movil-visor-zoom.js`
- Modificar: `tests/test.html` (un `<script>`)

**Interfaces:**
- Consume: las siete funciones de `MovilZoom` de la Tarea 1, y lo que ya hay en
  el archivo: `MovilGestos.presionar/soltar`, `MovilHud.despertar`,
  `Router.ir`.
- Produce: nada público nuevo. `MovilVisor` sigue exportando
  `ordenDe`, `init`, `aplicar`, `estado`, `siguienteRuta`.

- [ ] **Paso 1: escribir las pruebas, que fallan**

Crea `tests/pruebas-movil-visor-zoom.js`:

```js
/* El cableado del pellizco, que es lo unico de este bloque que no se puede
   probar sin DOM: hace falta que unos punteros de verdad entren por los
   oyentes de la raiz.

   Reutiliza `MV_MARCADO`, `mvRefsDesde` y `conLado` de
   `tests/pruebas-movil-visor.js`, que son globales porque los scripts del
   arnes comparten ventana. Por eso este archivo va DESPUES de aquel en
   test.html. */
describe('MovilVisor: el pellizco', function () {

  var MVZ_PROYECTO = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Direccion de arte' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  /* `conLado` se repite en cada sección de `pruebas-movil-visor.js` porque es
     local a cada `describe`, no global como `MV_MARCADO` y `conVisorSobre`.
     Copiarla es lo que hace el archivo de al lado y no hay motivo para
     apartarse: son cuatro líneas y sacarlas a un global obligaría a tocar seis
     secciones que hoy funcionan. */
  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* Se apoya en `conVisorSobre`, que ya monta el marcado, llama a
     `MovilVisor.init` y falsea `window.Datos`. Lo único que añade es el
     `Router` de mentira: el de verdad escribe en `location.hash` del documento
     de las pruebas, y una sola llamada movería la URL del arnés y dejaría a las
     demás secciones empezando desde otra ruta. Aquí lo que se comprueba es
     justo si se le llama o no, así que basta con contar. */
  function conVisorYRouter(fn) {
    return conVisorSobre(MVZ_PROYECTO, function (refs) {
      var routerAntes = window.Router;
      var llamadas = [];
      window.Router = { ir: function (t, v, p) { llamadas.push([t, v, p]); } };
      try {
        conLado('movil', function () {
          MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        });
        return fn(refs, llamadas);
      } finally {
        window.Router = routerAntes;
      }
    });
  }

  /* Una <img> sin cargar mide 0 de ancho natural, y `MovilZoom.maxEscala`
     devuelve entonces 1: sin falsear las medidas no habria nada que ampliar y
     todas las pruebas de abajo pasarian por el camino de «no se puede». Se
     define la propiedad sobre la instancia, que tapa el getter del prototipo. */
  function falsearMedidas(img, natural, pintado) {
    Object.defineProperty(img, 'naturalWidth', { value: natural, configurable: true });
    Object.defineProperty(img, 'clientWidth',  { value: pintado, configurable: true });
    Object.defineProperty(img, 'clientHeight', { value: pintado, configurable: true });
  }

  function dedo(el, tipo, id, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, {
      pointerId: id, clientX: x, clientY: y, bubbles: true
    }));
  }

  prueba('separar dos dedos amplia la foto', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      return refs.escena.querySelector('img').style.transform;
    }), 'translate(0px, 0px) scale(2)');
  });

  prueba('el pellizco no pasa del tope 1:1 del archivo', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 200, 300);
      dedo(refs.raiz, 'pointerdown', 2, 210, 300);
      dedo(refs.raiz, 'pointermove', 2, 1210, 300);
      return refs.escena.querySelector('img').style.transform;
    }), 'translate(0px, 0px) scale(3)');
  });

  /* La mitad que hace util el pellizco: ampliada, el dedo mira la esquina de
     la foto en vez de cambiar de parada. Sin esto, ampliar y querer moverse
     por la foto te saca de la pieza.

     El paseo es un gesto NUEVO, con los dos dedos del pellizco ya levantados:
     asi `MovilGestos` empieza limpio y ese dedo solo habria dado 'arriba' —o
     sea, habria navegado— si no fuera por la guarda. Paseando con el segundo
     dedo aun puesto, `MovilGestos` devolveria 'pellizco' y la prueba pasaria
     igual con la guarda quitada: no comprobaria nada. */
  prueba('ampliada, un dedo pasea la foto y no cambia de parada', function () {
    igual(conVisorYRouter(function (refs, llamadas) {
      var img = refs.escena.querySelector('img');
      falsearMedidas(img, 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 1, 300, 400);
      dedo(refs.raiz, 'pointermove', 1, 300, 200);
      dedo(refs.raiz, 'pointerup', 1, 300, 200);
      return { transform: img.style.transform, llamadas: llamadas.length };
    }), { transform: 'translate(0px, -200px) scale(2)', llamadas: 0 });
  });

  /* La otra mitad, que es la regresion que mas duele: si el pellizco dejara el
     visor sordo, el recorrido de dos ejes del bloque 4f se quedaria muerto y
     ninguna prueba de aquel bloque lo notaria.

     El gesto es VERTICAL porque el horizontal cambia de trabajo y aqui solo hay
     uno: deslizar a la izquierda se quedaria en la misma parada, `siguienteRuta`
     devolveria null y no habria llamada al router que contar, con guarda o sin
     ella. 'arriba' baja una parada —los nombres son los del DEDO, y la
     inversion vive en `movil-recorrido.js`—, asi que de la pieza 1 se va a la 2. */
  prueba('sin ampliar, el mismo deslizamiento sigue cambiando de parada', function () {
    igual(conVisorYRouter(function (refs, llamadas) {
      dedo(refs.raiz, 'pointerdown', 1, 300, 400);
      dedo(refs.raiz, 'pointerup', 1, 300, 200);
      return llamadas;
    }), [['proyecto', 'niebla', 2]]);
  });

  prueba('cambiar de parada devuelve la foto a su encaje', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 1, 150, 300);
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return refs.escena.querySelector('img').style.transform;
    }), '');
  });
});
```

Regístralo en `tests/test.html`, **después** de `pruebas-movil-visor.js`:

```html
<script src="pruebas-movil-visor-zoom.js"></script>
```

- [ ] **Paso 2: ejecutar y ver que falla**

Recarga `tests/test.html`. Esperado: la sección `MovilVisor: el pellizco` en
rojo. Las tres primeras fallan porque el `transform` sale vacío (nadie amplía);
la cuarta pasa ya —es la regresión, y que pase ahora es correcto—; la quinta
pasa por el mismo motivo que las primeras fallan. **Comprueba que fallan tres y
pasan dos**: si fallaran las cinco, es que el arnés está mal montado y no que
falte el código.

- [ ] **Paso 3: cablearlo en `js/movil-visor.js`**

Añade el `<script>` en `index.html`, antes de `js/movil-visor.js`:

```html
<script src="js/movil-zoom.js"></script>
```

En `js/movil-visor.js`, junto a `var gesto = null;`, añade el estado del zoom:

```js
  /* El estado del zoom vive aqui y no en `MovilZoom`, que es puro y no guarda
     nada entre llamadas. `punteros` es cuantos dedos hay y donde, indexado por
     `pointerId`: hace falta el mapa entero y no una cuenta, porque el pellizco
     necesita las dos posiciones a la vez y el paseo necesita saber de donde
     venia ESE dedo y no el otro.

     `base` y `d0` se congelan al posarse el segundo dedo y no se tocan hasta
     que se levanta: el porque esta en `MovilZoom.pellizcar`. */
  var zoom = null, base = null, d0 = 0, punteros = {}, tope = 1, elFoto = null;
```

Sustituye `engancharGestos` y `soltarEn` por esto, y deja el resto del archivo
como está:

```js
  function cajaDeLaFoto() {
    return { ancho: elFoto.clientWidth, alto: elFoto.clientHeight };
  }

  function dosDedos() {
    var ids = Object.keys(punteros);
    return ids.length === 2 ? [punteros[ids[0]], punteros[ids[1]]] : null;
  }

  /* El transform se QUITA al volver al encaje en vez de escribir la identidad,
     y no es cosmetica: `MovilAnimacion.aplicar` entra la escena con una
     animacion CSS que tambien es un transform, y un estilo en linea puesto ahi
     se queda peleando con ella en cada parada. Sin ampliar no hay nada que
     escribir, asi que no se escribe. */
  function pintarZoom() {
    if (!elFoto) return;
    elFoto.style.transform = window.MovilZoom.ampliado(zoom)
      ? window.MovilZoom.transformar(zoom)
      : '';
  }

  function engancharGestos() {
    gesto = window.MovilGestos.inicial();
    zoom = window.MovilZoom.inicial();

    raiz.addEventListener('pointerdown', function (e) {
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      gesto = window.MovilGestos.presionar(gesto, { x: e.clientX, y: e.clientY });
      var par = dosDedos();
      if (par && elFoto) {
        base = zoom;
        d0 = window.MovilZoom.distancia(par[0], par[1]);
        tope = window.MovilZoom.maxEscala(elFoto.naturalWidth, elFoto.clientWidth);
      }
    });

    raiz.addEventListener('pointermove', function (e) {
      var antes = punteros[e.pointerId];
      if (!antes) return;                 /* un dedo que no se poso aqui */
      var ahora = { x: e.clientX, y: e.clientY };
      punteros[e.pointerId] = ahora;
      if (!elFoto) return;

      var par = dosDedos();
      if (par && base) {
        zoom = window.MovilZoom.pellizcar(base, d0,
          window.MovilZoom.distancia(par[0], par[1]), tope, cajaDeLaFoto());
        pintarZoom();
        return;
      }
      if (!par && window.MovilZoom.ampliado(zoom)) {
        zoom = window.MovilZoom.arrastrar(zoom, ahora.x - antes.x,
          ahora.y - antes.y, cajaDeLaFoto());
        pintarZoom();
      }
    });

    raiz.addEventListener('pointerup', function (e) { soltarEn(e); });

    raiz.addEventListener('pointercancel', function (e) { soltarEn(e); });
  }

  function soltarEn(e) {
    delete punteros[e.pointerId];
    if (!dosDedos()) base = null;

    var r = window.MovilGestos.soltar(gesto, { x: e.clientX, y: e.clientY });
    gesto = r.estado;
    if (r.intencion === null) return;

    /* El toque despierta el HUD y no navega. Que no navegue es lo que hace
       posible volver a encenderlo sin cambiar de foto, y por eso sigue
       funcionando tambien con la foto ampliada: mirar una esquina de cerca y
       querer leer el titulo no son cosas incompatibles. */
    if (r.intencion === 'toque') { window.MovilHud.despertar(); return; }

    /* Ampliada, el dedo estaba paseando la foto y no pidiendo otra parada. La
       intencion se consume aqui y se tira: llegar al router con ella sacaria
       del trabajo a quien solo queria mirar la esquina de la imagen. */
    if (window.MovilZoom.ampliado(zoom)) return;

    var ruta = siguienteRuta(aqui, r.intencion, orden);
    if (!ruta) return;
    direccionPendiente = r.intencion;
    window.Router.ir(ruta.tipo, ruta.valor, ruta.pieza);
  }
```

Y en `pintar()`, justo después de `escena.appendChild(nodo);`, añade el reseteo:

```js
    /* Cada parada empieza encajada. Arrastrar el zoom de una foto a la
       siguiente dejaria la nueva ampliada por un trozo cualquiera, sin que
       nadie lo hubiera pedido y sin forma evidente de deshacerlo. */
    elFoto = (nodo.tagName === 'IMG') ? nodo : null;
    zoom = window.MovilZoom.inicial();
    base = null;
    punteros = {};
    pintarZoom();
```

- [ ] **Paso 4: ejecutar y ver que pasa**

Recarga `tests/test.html`. Esperado: **485 pasan, 0 fallan** (480 + 5).
Ejecuta también `node tests/prueba-borrador.js`: **52 pasan, 0 fallan** (no lo
toca este bloque, y comprobarlo es lo que descubre si se rompió por otro lado).

- [ ] **Paso 5: commit**

```bash
git add js/movil-visor.js index.html tests/pruebas-movil-visor-zoom.js tests/test.html
git commit -m "$(cat <<'EOF'
Pellizcar amplia la foto, y ampliada el dedo pasea en vez de navegar

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Tarea 3: `MovilBrillo`, la medición que a `Brillo` le faltaba

**Archivos:**
- Crear: `js/movil-brillo.js`
- Crear: `tests/pruebas-movil-brillo.js`
- Modificar: `js/brillo.js` (sólo el comentario sobre `decidir`)
- Modificar: `tests/test.html` (dos `<script>`)

**Interfaces:**
- Consume: `Brillo.decidir(medir, registrar)` → `'claro' | 'oscuro' | 'halo'`,
  ya escrito y probado desde el bloque 4c.
- Produce, y la Tarea 4 consume:
  - `MovilBrillo.luminanciaDe(datos)` → número de 0 a 1, o `null`
  - `MovilBrillo.promedio(valores)` → número, o `null` si alguno no sirve
  - `MovilBrillo.tratamientoDe(img, registrar)` → `'claro' | 'oscuro' | 'halo'`

- [ ] **Paso 1: escribir las pruebas, que fallan**

Crea `tests/pruebas-movil-brillo.js`:

```js
/* Lo que este archivo prueba de verdad es la aritmetica, que es pura y no
   necesita navegador. El lienzo aparece solo en las dos ultimas, y con fotos
   fabricadas aqui mismo: el bloque 4c no pudo probar esto porque el lienzo se
   manchaba con las imagenes de picsum, y desde el contenido real las fotos son
   del mismo origen y ya no mancha. */
describe('MovilBrillo', function () {

  function rgba(lista) { return new Uint8ClampedArray(lista); }

  prueba('un pixel blanco da luminancia 1', function () {
    igual(MovilBrillo.luminanciaDe(rgba([255, 255, 255, 255])), 1);
  });

  prueba('un pixel negro da luminancia 0', function () {
    igual(MovilBrillo.luminanciaDe(rgba([0, 0, 0, 255])), 0);
  });

  /* Los coeficientes son los de BT.709, los mismos que usa el calculo de
     contraste de WCAG. Que el verde pese diez veces mas que el azul no es un
     detalle: con una media plana, un cielo azul saldria «claro» y el texto
     negro encima seria ilegible. */
  prueba('el verde pesa mucho mas que el azul', function () {
    igual([MovilBrillo.luminanciaDe(rgba([0, 255, 0, 255])),
           MovilBrillo.luminanciaDe(rgba([0, 0, 255, 255]))],
          [0.7152, 0.0722]);
  });

  prueba('la media de dos pixeles es la media de sus luminancias', function () {
    igual(MovilBrillo.luminanciaDe(rgba([255, 255, 255, 255, 0, 0, 0, 255])), 0.5);
  });

  /* Un bloque vacio no vale 0: valdria «negro», y las esquinas saldrian
     amarillas sobre una foto de la que no sabemos nada. Devolver null es lo
     que hace que `Brillo.decidir` caiga al halo. */
  prueba('un bloque vacio no da un numero inventado', function () {
    igual(MovilBrillo.luminanciaDe(rgba([])), null);
  });

  prueba('el promedio de las cuatro zonas es un solo veredicto', function () {
    igual(MovilBrillo.promedio([0.2, 0.4, 0.6, 0.8]), 0.5);
  });

  /* Si una sola zona no se pudo medir, el promedio de las otras tres seria una
     respuesta a una pregunta distinta. Mejor el halo. */
  prueba('una zona que no se pudo medir tumba el promedio entero', function () {
    igual(MovilBrillo.promedio([0.5, 0.5, null, 0.5]), null);
  });

  prueba('un promedio sin valores es null y no NaN', function () {
    igual(MovilBrillo.promedio([]), null);
  });

  // ---- El camino de degradacion -----------------------------------

  /* La contramedida obligatoria de la spec: el fallo se registra. Sin esto, el
     halo puede quedarse puesto meses en produccion sin que nadie note que la
     medicion nunca llego a funcionar. */
  prueba('una foto sin cargar da el halo y deja aviso', function () {
    var avisos = [];
    var img = new Image();
    var t = MovilBrillo.tratamientoDe(img, function (m) { avisos.push(m); });
    igual({ tratamiento: t, avisos: avisos.length }, { tratamiento: 'halo', avisos: 1 });
  });

  prueba('sin nada que medir tampoco revienta', function () {
    igual(MovilBrillo.tratamientoDe(null, null), 'halo');
  });
});

/* Las dos unicas pruebas de este bloque que dibujan de verdad en un lienzo.
   Las fotos se fabrican con un canvas y `toDataURL` en vez de pegar aqui un
   base64 a mano: asi se ve que color son leyendo el codigo, y una data: URI no
   mancha el lienzo, igual que no lo mancha una foto de lidialuque.com. */
describeAsync('MovilBrillo sobre fotos de verdad', function () {

  function fotoDeColor(color) {
    var c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    var ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    return new Promise(function (ok) {
      var img = new Image();
      img.addEventListener('load', function () { ok(img); }, { once: true });
      img.src = c.toDataURL();
    });
  }

  return Promise.all([fotoDeColor('#ffffff'), fotoDeColor('#000000')])
    .then(function (fotos) {
      prueba('una foto clara pide esquinas oscuras', function () {
        igual(MovilBrillo.tratamientoDe(fotos[0], null), 'claro');
      });
      prueba('una foto oscura pide esquinas amarillas', function () {
        igual(MovilBrillo.tratamientoDe(fotos[1], null), 'oscuro');
      });
    });
});
```

Regístralo en `tests/test.html`. El módulo, **después** de `js/brillo.js`
(lo consume):

```html
<script src="../js/movil-brillo.js"></script>
```

Y las pruebas, después de `pruebas-brillo.js`:

```html
<script src="pruebas-movil-brillo.js"></script>
```

- [ ] **Paso 2: ejecutar y ver que falla**

Recarga `tests/test.html`. Esperado: las dos secciones de `MovilBrillo` en rojo
con `MovilBrillo is not defined`.

- [ ] **Paso 3: escribir el módulo**

Crea `js/movil-brillo.js`:

```js
window.MovilBrillo = (function () {

  /* La foto se dibuja reducida a este lado antes de leerla. 64x64 son 4.096
     pixeles en vez de los 9.000.000 de una pieza de 3000x3000: el navegador
     hace el remuestreo, que es justo lo que se quiere —una media— y lo hace en
     el compositor en vez de en un bucle de JavaScript. */
  var LADO = 64;

  /* Cuanto del lado ocupa la zona que se mira en cada esquina. Un cuarto de 64
     son 16px del lienzo reducido, o sea la cuarta parte de la foto por lado.
     Es lo que hay DEBAJO de las esquinas del encuadre, que es lo que decide si
     se leen; la media de la foto entera responderia a otra pregunta y una foto
     de contraste alto —cielo blanco, primer plano negro— la responderia mal. */
  var ZONA = 0.25;

  /* Coeficientes de BT.709, los mismos del calculo de contraste de WCAG. La
     media plana de R, G y B no vale: el ojo no ve igual los tres canales, y un
     azul saturado saldria mas claro de lo que se ve. */
  function luminanciaDe(datos) {
    if (!datos || !datos.length) return null;
    var suma = 0, n = 0;
    for (var i = 0; i + 3 < datos.length; i += 4) {
      suma += (0.2126 * datos[i] + 0.7152 * datos[i + 1] + 0.0722 * datos[i + 2]) / 255;
      n++;
    }
    return n === 0 ? null : suma / n;
  }

  /* Un solo veredicto para las cuatro esquinas: dos negras y dos amarillas se
     leen como un fallo del sitio y no como una decision. Y si una sola zona no
     se pudo medir, el promedio de las otras tres contestaria a una pregunta
     distinta de la que se hizo, asi que se cae al halo. */
  function promedio(valores) {
    if (!valores || !valores.length) return null;
    var suma = 0;
    for (var i = 0; i < valores.length; i++) {
      var v = valores[i];
      if (typeof v !== 'number' || !isFinite(v)) return null;
      suma += v;
    }
    return suma / valores.length;
  }

  /* El unico sitio de todo el repositorio que toca un lienzo. Devuelve la
     funcion `medir` que `Brillo.decidir` lleva esperando desde el bloque 4c:
     alli se decidio recibirla como argumento para poder probar el camino de
     degradacion sin fotos, y esta es la implementacion de verdad.

     La guarda de `complete`/`naturalWidth` LANZA en vez de devolver null a
     proposito. `drawImage` con una imagen a medio cargar no lanza: no dibuja
     nada, y entonces `getImageData` devuelve un lienzo transparente cuya
     luminancia es 0 —«foto oscura»— y las esquinas saldrian amarillas con toda
     confianza sobre una foto de la que no se sabe nada. Lanzando, el caso cae
     donde tiene que caer: en el halo, y con aviso. */
  function medidorDe(img) {
    return function () {
      if (!img || !img.complete || !img.naturalWidth) {
        throw new Error('la foto todavia no esta cargada');
      }
      var lienzo = document.createElement('canvas');
      lienzo.width = LADO;
      lienzo.height = LADO;
      var ctx = lienzo.getContext('2d');
      ctx.drawImage(img, 0, 0, LADO, LADO);

      var z = Math.max(1, Math.round(LADO * ZONA));
      var esquinas = [[0, 0], [LADO - z, 0], [0, LADO - z], [LADO - z, LADO - z]];
      var medidas = esquinas.map(function (e) {
        return luminanciaDe(ctx.getImageData(e[0], e[1], z, z).data);
      });
      return promedio(medidas);
    };
  }

  /* `registrar` es opcional y quien pinta decide como avisa. Este modulo no
     escribe en consola por su cuenta: en `js/` no hay ni una llamada a
     `console`, y meterla aqui la colaria en el unico camino que se ejecuta en
     cada foto del recorrido. */
  function tratamientoDe(img, registrar) {
    return window.Brillo.decidir(medidorDe(img), registrar);
  }

  return {
    LADO: LADO, ZONA: ZONA,
    luminanciaDe: luminanciaDe, promedio: promedio, tratamientoDe: tratamientoDe
  };
})();
```

- [ ] **Paso 4: corregir la cabecera de `js/brillo.js`**

`docs/estado-conocido.md` lo tiene apuntado por escrito: el comentario sobre
`decidir` cuenta la historia de picsum y CORS, que dejó de ser cierta con el
contenido real, y «hay que corregirla cuando el bloque 4g la toque». Sustituye
los dos primeros párrafos de ese comentario (desde «`medir` se pasa como
argumento» hasta «…que el estudio suba las suyas.») por:

```js
  /* `medir` se pasa como argumento y no se llama a un lienzo aquí dentro. El
     motivo original era que las fotos venían de picsum y el lienzo se manchaba
     —ningún `<img>` del sitio las pedía en modo CORS—, así que la medición de
     verdad no podía ni escribirse. Eso se acabó: desde el contenido real las
     rutas de `contenido.json` son relativas (`/img/…`), o sea del mismo
     origen, y un lienzo con una imagen del mismo origen no se mancha. El
     medidor de verdad vive en `js/movil-brillo.js` desde el bloque 4g.

     La inyección se mantiene por lo que resultó ser su mejor razón: este
     módulo decide, y decidir se prueba sin navegador. El camino de
     degradación —lo que pasa cuando medir falla— se ejercita con una función
     sintética que lanza, y eso seguirá haciendo falta el día que una foto
     llegue de otro sitio.
```

- [ ] **Paso 5: ejecutar y ver que pasa**

Recarga `tests/test.html`. Esperado: **497 pasan, 0 fallan** (485 + 12).
Comprueba además que la sección `Brillo` de siempre sigue entera en verde: el
comentario que se ha tocado documenta a `decidir`, y si alguien se llevó por
delante una línea de código al editarlo, es ahí donde se ve.

- [ ] **Paso 6: commit**

```bash
git add js/movil-brillo.js js/brillo.js tests/pruebas-movil-brillo.js tests/test.html
git commit -m "$(cat <<'EOF'
La medicion que a Brillo le faltaba desde el bloque 4c

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Tarea 4: el encuadre de cuatro esquinas

**Archivos:**
- Modificar: `index.html` (los cuatro elementos dentro de `.mvisor`, y un `<script>`)
- Modificar: `css/luque.css` (al final del bloque `body.es-movil .mvisor…`)
- Modificar: `js/movil-visor.js` (`pintar` y una función nueva)
- Modificar: `tests/pruebas-movil-visor.js` (`MV_MARCADO`)
- Crear: `tests/pruebas-movil-visor-esquinas.js`
- Modificar: `tests/test.html` (un `<script>`)

**Interfaces:**
- Consume: `MovilBrillo.tratamientoDe(img, registrar)` de la Tarea 3.
- Produce: una clase en la raíz del visor —`brillo-claro`, `brillo-oscuro` o
  `brillo-halo`—, que es todo el contrato entre el JavaScript y el CSS. Los
  cuatro elementos del encuadre no se tocan desde JavaScript nunca.

- [ ] **Paso 1: escribir las pruebas, que fallan**

Primero, en `tests/pruebas-movil-visor.js`, añade las cuatro esquinas a
`MV_MARCADO` para que el arnés tenga el mismo marcado que el sitio:

```js
var MV_MARCADO =
  '<div><div id="mvRaiz" hidden><div id="mvEscena"></div>' +
  '<span class="mvisor-esquina tl" aria-hidden="true"><i></i></span>' +
  '<span class="mvisor-esquina tr" aria-hidden="true"><i></i></span>' +
  '<span class="mvisor-esquina bl" aria-hidden="true"><i></i></span>' +
  '<span class="mvisor-esquina br" aria-hidden="true"><i></i></span>' +
  '<div id="mvHud"><button id="mvCat"></button><ul id="mvCats"></ul>' +
  '<button id="mvCerrar"></button><p id="mvTitulo"></p>' +
  '<span id="mvContador"></span></div></div></div>';
```

Crea `tests/pruebas-movil-visor-esquinas.js`:

```js
/* El contrato entre el JavaScript y el CSS del encuadre es UNA clase en la
   raiz, y por eso es lo unico que se comprueba aqui: los cuatro elementos no
   se tocan nunca desde el codigo, los pinta el CSS. Reutiliza `MV_MARCADO`,
   `mvRefsDesde` y `conLado` de `pruebas-movil-visor.js`, asi que va despues de
   aquel en test.html. */
describe('MovilVisor: el encuadre', function () {

  var MVE_PROYECTO = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Direccion de arte' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  /* Local, como en cada sección de `pruebas-movil-visor.js`: `conLado` vive
     dentro de cada `describe` y no es global, al contrario que `MV_MARCADO`,
     `mvRefsDesde` y `conVisorSobre`. */
  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  function conVisor(fn) {
    return conVisorSobre(MVE_PROYECTO, fn);
  }

  function tratamiento(raiz) {
    var clases = ['brillo-claro', 'brillo-oscuro', 'brillo-halo'];
    return clases.filter(function (c) { return raiz.classList.contains(c); });
  }

  /* Una foto con una URL de mentira nunca carga, que es exactamente el caso
     que la spec obliga a cubrir: el halo es feo al lado de lo automatico y
     correcto siempre. */
  prueba('una foto que no ha cargado deja el encuadre en halo', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
      });
      return tratamiento(refs.raiz);
    }), ['brillo-halo']);
  });

  /* La ficha no es una foto: no hay nada que medir, y medir el fondo del visor
     seria contestar por una foto que no esta. */
  prueba('la ficha lleva el encuadre en halo', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return tratamiento(refs.raiz);
    }), ['brillo-halo']);
  });

  prueba('nunca hay dos tratamientos puestos a la vez', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return tratamiento(refs.raiz).length;
    }), 1);
  });

  prueba('cerrar el visor se lleva el tratamiento con el', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'todos', valor: null });
      });
      return tratamiento(refs.raiz);
    }), []);
  });
});

/* El marcado del sitio, que ninguna prueba de DOM alcanza porque los arneses
   montan el suyo. Sin esto, `MV_MARCADO` podria llevar las cuatro esquinas e
   `index.html` no llevar ninguna, y las cuatro pruebas de arriba seguirian en
   verde sobre un visor sin encuadre. */
describeAsync('El encuadre del movil en index.html', function () {
  return fetch('../index.html').then(function (r) { return r.text(); })
    .then(function (html) {
      prueba('index.html lleva las cuatro esquinas del visor movil', function () {
        var cuantas = html.split('mvisor-esquina').length - 1;
        igual(cuantas, 4);
      });
    });
});
```

Regístralo en `tests/test.html`, después de `pruebas-movil-visor-zoom.js`:

```html
<script src="pruebas-movil-visor-esquinas.js"></script>
```

- [ ] **Paso 2: ejecutar y ver que falla**

Recarga `tests/test.html`. Esperado: las cinco nuevas en rojo —las cuatro
primeras porque nadie pone la clase, y la quinta porque `index.html` no tiene
todavía las esquinas.

- [ ] **Paso 3: el marcado y las reglas**

En `index.html`, dentro de `.mvisor` y **entre** la escena y el HUD:

```html
    <!-- El encuadre de la camara, que es la imagen que la spec conserva del
         lienzo viejo. Se tine segun el brillo de la foto: negro sobre foto
         clara, amarillo sobre foto oscura, y amarillo con sombra —el halo—
         cuando la medicion no se puede hacer. La clase la pone
         `js/movil-visor.js` en la raiz; estos cuatro no se tocan nunca desde
         el codigo.

         `aria-hidden` porque no dicen nada que no diga ya la foto: para un
         lector de pantalla son cuatro eles decorativas. -->
    <span class="mvisor-esquina tl" aria-hidden="true"><i></i></span>
    <span class="mvisor-esquina tr" aria-hidden="true"><i></i></span>
    <span class="mvisor-esquina bl" aria-hidden="true"><i></i></span>
    <span class="mvisor-esquina br" aria-hidden="true"><i></i></span>
```

Y el `<script>` del módulo nuevo, antes de `js/movil-visor.js` y después de
`js/brillo.js` —que hoy **no está en `index.html`** y hay que añadir también,
porque hasta ahora sólo lo cargaba `tests/test.html`:

```html
  <script src="js/brillo.js"></script>
  <script src="js/movil-brillo.js"></script>
```

En `css/luque.css`, después del bloque de `body.es-movil .mvisor-foto`:

```css
/* Las cuatro eles del encuadre, calcadas de `.visor-esquina` del escritorio:
   el mismo dibujo con dos pseudoelementos y la misma vuelta con `scale`, para
   que el visor de la camara se vea igual en los dos lados. Lo que cambia es de
   donde sale el color, que aqui lo decide el brillo de la foto. */
body.es-movil .mvisor-esquina{
  position:absolute;
  width:26px; height:26px;
  z-index:1;
  pointer-events:none;
  color:var(--yellow);
}
body.es-movil .mvisor-esquina i{
  position:absolute; inset:0;
  display:block;
}
body.es-movil .mvisor-esquina i::before,
body.es-movil .mvisor-esquina i::after{
  content:'';
  position:absolute;
  background:currentColor;
}
body.es-movil .mvisor-esquina i::before{ top:0; left:0; width:100%; height:3px; }
body.es-movil .mvisor-esquina i::after{  top:0; left:0; width:3px;  height:100%; }

/* Los mismos 22px del escritorio, y por el mismo motivo que el HUD deja libre
   la franja de los bordes: ahi manda el gesto de «atras» del navegador. */
body.es-movil .mvisor-esquina.tl{ top:22px;    left:22px;  }
body.es-movil .mvisor-esquina.tr{ top:22px;    right:22px; }
body.es-movil .mvisor-esquina.bl{ bottom:22px; left:22px;  }
body.es-movil .mvisor-esquina.br{ bottom:22px; right:22px; }

body.es-movil .mvisor-esquina.tr i{ transform:scaleX(-1); }
body.es-movil .mvisor-esquina.bl i{ transform:scaleY(-1); }
body.es-movil .mvisor-esquina.br i{ transform:scale(-1,-1); }

/* Los tres tratamientos. Sobre foto clara, negras; sobre foto oscura,
   amarillas. El halo es el camino de degradacion que la spec exige: amarillo
   con una sombra oscura tenue, legible sobre cualquier fondo. Feo al lado de
   lo automatico, correcto siempre. */
body.es-movil .mvisor.brillo-claro  .mvisor-esquina{ color:var(--black); }
body.es-movil .mvisor.brillo-oscuro .mvisor-esquina{ color:var(--yellow); }
body.es-movil .mvisor.brillo-halo   .mvisor-esquina{
  color:var(--yellow);
  filter:drop-shadow(0 0 2px rgba(0,0,0,.9));
}

/* El cambio de color se acompana, para que relevar la portada por la pieza
   entera no de un parpadeo de esquinas. Quien haya pedido menos movimiento no
   lo tiene. */
body.es-movil .mvisor-esquina{ transition:color .3s ease; }

@media (prefers-reduced-motion: reduce){
  body.es-movil .mvisor-esquina{ transition:none; }
}
```

- [ ] **Paso 4: cablear el tratamiento en `js/movil-visor.js`**

Añade la función, junto a `pintarZoom`:

```js
  var TRATAMIENTOS = ['brillo-claro', 'brillo-oscuro', 'brillo-halo'];

  /* La contramedida que la spec exige por escrito: «el fallo se registra».
     Sin ella, el halo puede quedarse puesto meses en produccion porque nadie
     note que la medicion nunca llego a funcionar, que es el riesgo que la
     propia spec nombra al elegir el camino de degradacion.

     Avisa UNA VEZ por sesion y no una por foto: el recorrido mide en cada
     parada y en cada relevo de portada por pieza, asi que un aviso por medida
     llenaria la consola de la misma linea y taparia lo demas. Y es la primera
     llamada a `console` de todo `js/`, que hasta hoy no tenia ninguna: se
     acepta porque el aviso es el requisito, no un apano de depuracion. */
  var avisado = false;

  function registrarBrillo(mensaje) {
    if (avisado) return;
    avisado = true;
    if (window.console && console.warn) console.warn(mensaje);
  }

  /* La foto se mide DOS veces por parada y no una, y es a proposito: la escena
     arranca con la portada que la rejilla ya tiene descargada y la releva por
     la pieza entera cuando llega (ver `fotoDe`). Midiendo solo al principio,
     una portada aun sin cargar dejaria el halo puesto para siempre en esa
     parada; midiendo tambien en cada `load`, la primera medida es la de la
     portada —que es la misma foto— y la segunda la confirma.

     `pintar` limpia siempre los tres antes de poner uno: sin eso, pasar de una
     foto clara a una oscura dejaria las dos clases puestas y ganaria la que el
     CSS declare mas abajo, que es una forma silenciosa de tener el encuadre
     equivocado. */
  function tenirEncuadre() {
    var tratamiento = elFoto
      ? window.MovilBrillo.tratamientoDe(elFoto, registrarBrillo)
      : 'halo';
    TRATAMIENTOS.forEach(function (c) { raiz.classList.remove(c); });
    raiz.classList.add('brillo-' + tratamiento);
  }
```

En `pintar()`, justo después del bloque del zoom que añadió la Tarea 2:

```js
    tenirEncuadre();
    if (elFoto) elFoto.addEventListener('load', tenirEncuadre);
```

Y en `cerrar()`, después de `escena.innerHTML = '';`:

```js
    /* El encuadre se apaga con el visor: la portada no lo lleva, y una clase
       de brillo sobreviviendo al cierre teniria la siguiente foto con el
       veredicto de la anterior. */
    TRATAMIENTOS.forEach(function (c) { raiz.classList.remove(c); });
    elFoto = null;
```

- [ ] **Paso 5: ejecutar y ver que pasa**

Recarga `tests/test.html`. Esperado: **502 pasan, 0 fallan** (497 + 5).

- [ ] **Paso 6: mirarlo con los ojos**

Esto no lo cubre el arnés y es la mitad del bloque. Con el servidor levantado,
abre el sitio en un navegador estrechado a 390px de ancho (o en un teléfono de
la red local) y comprueba, sobre las fotos reales de `contenido.json`:

1. Las cuatro esquinas se ven en las cuatro esquinas de la pantalla, sin cortar.
2. Sobre una foto clara salen negras; sobre una oscura, amarillas. Si salieran
   siempre amarillas con sombra, la medición está cayendo al halo: mira la
   consola, que `Brillo` registra el motivo —pásale un `registrar` temporal si
   hace falta.
3. Pellizcando, la foto amplía y no se despega del marco por ningún lado.
4. Ampliada, arrastrar mueve la foto y **no** cambia de trabajo; volver al
   encaje devuelve la navegación.
5. Deslizar sin ampliar sigue cambiando de pieza y de trabajo como en el 4f.

Anota lo que salga mal; si algo de esto falla, es un fallo de este bloque y se
arregla aquí, no en la Tarea 5.

- [ ] **Paso 7: commit**

```bash
git add index.html css/luque.css js/movil-visor.js tests/pruebas-movil-visor.js tests/pruebas-movil-visor-esquinas.js tests/test.html
git commit -m "$(cat <<'EOF'
El encuadre de cuatro esquinas, tenido por el brillo de la foto

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Tarea 5: decir la verdad en `docs/estado-conocido.md`

**Archivos:**
- Modificar: `docs/estado-conocido.md`

Es el fallo característico de este proyecto y por eso tiene tarea propia: el
documento afirma hoy tres cosas que este bloque deja falsas.

- [ ] **Paso 1: localizar las tres afirmaciones**

```bash
grep -n "sin ningún consumidor\|sin ninguna mención\|la cabecera de .js/brillo.js. sigue contando" docs/estado-conocido.md
grep -n "bloque 4g" docs/estado-conocido.md
```

Son tres sitios, alrededor de las líneas 208, 1001 y 1035 del documento actual:

1. La sección del visor móvil, donde dice que `Brillo` sigue **sin ningún
   consumidor** y que sus esquinas adaptativas «son trabajo del bloque 4g».
2. La entrada «El camino automático del brillo sigue sin verificarse», donde
   dice que la cabecera de `js/brillo.js` cuenta la historia vieja y «hay que
   corregirla cuando el bloque 4g la toque».
3. La entrada que dice que sólo `brillo.js` sigue sin que lo cargue ni lo llame
   ningún código, y que «hoy no podrían funcionar de todos modos porque ningún
   `<img>` del sitio pide la foto en modo CORS».

- [ ] **Paso 2: reescribirlas con lo que este bloque deja hecho**

Cada una pasa a decir, en el mismo tono del documento:

1. `Brillo` **ya tiene consumidor**: `js/movil-brillo.js` le da la función
   `medir` que le faltaba desde el 4c, y `js/movil-visor.js` tiñe el encuadre
   con lo que devuelve. Los tres módulos puros del 4c están cableados.
2. La cabecera de `js/brillo.js` **ya está corregida** (Tarea 3): dice por qué
   se mantiene la inyección ahora que el obstáculo del lienzo desapareció.
3. `brillo.js` y `movil-brillo.js` están en `index.html` y en `tests/test.html`.
   El módulo que ya no tiene consumidor sigue siendo `visor-video.js`, y ése no
   lo toca este bloque.

- [ ] **Paso 3: añadir lo que este bloque NO puede verificar**

Es lo que sostiene la contramedida de la spec, y sin ello el halo puede quedarse
puesto meses sin que nadie lo note. Añade, en la sección de lo que está sin
verificar:

- **Que la medición dé el veredicto correcto sobre las fotos reales en un
  teléfono real.** Las pruebas miden fotos fabricadas en un lienzo —blanco puro
  y negro puro—, que confirman la aritmética y el camino del lienzo, no el
  criterio. Que una foto de estudio a contraluz pida esquinas negras o amarillas
  sólo se sabe mirándola.
- **Que las esquinas se apoyen sobre la foto y no sobre las franjas.** La escena
  usa `object-fit: contain`, así que una foto que no llene la pantalla deja
  franjas del fondo negro del visor justo donde van las esquinas. La medición
  mira las esquinas de la FOTO, no las de la pantalla. Sobre franja negra el
  amarillo se lee y el negro no: si en el teléfono se ve una esquina negra
  perdida sobre la franja, la respuesta es medir contra el fondo cuando hay
  franja, y eso es un cambio, no un ajuste.
- **Que el pellizco se sienta bien.** El tope de 6× y que soltar por debajo de
  1× vuelva al encaje son decisiones tomadas sobre el papel.

- [ ] **Paso 4: ejecutar las dos suites por última vez**

```bash
node tests/prueba-borrador.js
```

Esperado: **52 pasan, 0 fallan**. Y en el navegador, `tests/test.html`:
**502 pasan, 0 fallan**.

- [ ] **Paso 5: commit**

```bash
git add docs/estado-conocido.md
git commit -m "$(cat <<'EOF'
Brillo ya tiene consumidor, y el documento tiene que decirlo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Lo que este bloque deja fuera

- **Desplegar.** El sitio vivo es el del bloque 3b y desplegar es a mano y con
  permiso explícito. Este bloque termina en la rama.
- **La clase `mvisor-abierto` sin reglas.** Sigue puesta y sigue sin CSS; la
  decisión de bloquear el desplazamiento del cuerpo depende de una comprobación
  en un teléfono de verdad que sigue pendiente, y no es de este bloque.
- **`visor-video.js` sin consumidor.** Lo dejó así el contenido real al mandar
  los vídeos a la plataforma externa. No se toca aquí.
- **El doble toque para ampliar.** La spec dice «pellizcando con dos dedos» y
  con eso basta; añadir un segundo gesto para lo mismo es lenguaje de más.
