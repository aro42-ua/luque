# Visor móvil de dos ejes (bloque 4f) — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendada) o
> superpowers:executing-plans para ejecutar este plan tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** sustituir en el móvil el visor de escritorio encogido por un visor
propio de dos ejes —horizontal cambia de trabajo, vertical baja por las fotos
hasta la ficha— con su HUD de pastillas amarillas que se oculta a los 3
segundos.

**Arquitectura:** tres módulos puros ya escritos y probados —`MovilRecorrido`,
`MovilGestos`, `Brillo`— llevan cinco bloques sin un solo consumidor: son las
piezas de éste. Este bloque añade lo que toca el DOM (`js/movil-visor.js` y
`js/movil-hud.js`), los cablea al `Router` —que ya entiende el segundo tramo
desde el bloque 4b— y deja al visor de escritorio intacto detrás de una guarda
de lado. Nada aguas arriba de `movil.js` se entera de que existe un móvil.

**Pila:** HTML, CSS y JavaScript ES5 escritos a mano. Sin framework, sin paso de
compilación, sin gestor de paquetes, sin dependencias. Patrón `window.Nombre`
con IIFE, como todo `js/`.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md`

**Estado de partida:** `main` en `839e56e`, con los bloques 4a, 4b, 4c, 4d y 4e
fusionados y desplegados en producción. Suite: **362 comprobaciones, 0 fallos**
en `tests/test.html`, más 52 en `node tests/prueba-borrador.js`.

## Alcance: qué NO entra en este bloque

Se aparta a un futuro bloque 4g, y no por olvido. Cada una de estas tres es una
mejora sobre un visor que ya sirve, ninguna bloquea a las otras, y meterlas aquí
haría un bloque mayor que el 4d y el 4e juntos:

- **El pellizco para ampliar.** `MovilGestos` ya devuelve la intención
  `'pellizco'` y este bloque la recibe y la ignora a propósito (Tarea 3).
- **Las esquinas que se adaptan al brillo de la foto.** `Brillo` sigue sin
  cablear al terminar este bloque. La spec ya avisa de que hoy no puede
  funcionar con `picsum` y sólo se puede ejercitar el camino de degradación.
- **La convención `######` de la ficha.** Es compartida con el escritorio y es
  pequeña; no depende de nada de aquí.

- **El encuadre de cuatro esquinas.** La spec lo nombra junto al visor —«pantalla
  completa con el encuadre de cuatro esquinas»— así que dejarlo fuera es una
  decisión y hay que justificarla: **las esquinas existen para adaptarse al
  brillo**, y pintarlas aquí con el halo fijo obligaría a escribirlas dos veces,
  una ahora y otra al cablear `Brillo`. Van enteras en el 4g, con su medición y
  su camino de degradación. El visor de este bloque es la foto a pantalla
  completa sin marco, que es lo que un estudio de fotografía quiere de todas
  formas mientras las esquinas no puedan decidirse solas.

Al terminar el 4f, `MovilRecorrido` y `MovilGestos` quedan cableados y `Brillo`
sigue sin consumidor. **`docs/estado-conocido.md` tiene que decirlo** (Tarea 6):
la frase que hoy afirma que los tres están sin cablear se quedaría falsa, que es
el fallo característico de este proyecto.

## Restricciones globales

Vinculan a todas las tareas. Los valores están copiados de la spec y del
repositorio, no reescritos de memoria.

- **Todo en español**, incluidos los comentarios, los nombres de función y los
  textos de prueba.
- **ES5 y `window.Nombre`**: nada de `let`, `const`, funciones flecha, clases,
  plantillas de cadena ni `async/await` en `js/`. El resto de `js/` es ES5 y el
  sitio se sirve tal cual.
- **Sin dependencias, sin build, sin npm.** No se añade ninguna librería.
- **Techo de 300 líneas por archivo de código.**
- **Ninguna línea nueva por encima de 90 caracteres.**
- **Nada de recursos externos referenciados desde el CSS.** Bajo `file://` el
  navegador los bloquea. Si hace falta una forma, va incrustada en el marcado y
  se colorea con `currentColor`.
- **Las citas van ancladas a funciones o secciones, nunca a números de línea.**
  Convención del repositorio: los números se desplazan y la cita queda mintiendo.
- **`(max-width: 860px)`** es el interruptor, expuesto como `Movil.CONSULTA`.
- **El HUD se oculta a los 3000 ms**, no a los 2000 del escritorio.
- **Las piezas se numeran desde 1**, igual que el contador `02/08`.
- **Historial: se EMPUJA al cambiar de proyecto y se REEMPLAZA al cambiar de
  foto.** Ya lo resuelve `Router.decidir`; este bloque sólo llama a `Router.ir`
  y no vuelve a decidirlo.
- **El escritorio no se toca** salvo la guarda de lado de la Tarea 1, que es una
  línea y va justificada en el código.
- **Nada de credenciales en el repositorio.**
- **No desplegar.** Publicar es un gesto aparte que pide Ángel en el momento.

### La trampa del arnés: `prueba()` es SÍNCRONA

**Vinculante para toda prueba de este bloque.** `prueba()` llama a su función
dentro de un `try` y apunta PASA en cuanto vuelve (`tests/arnes.js`). Si esa
función **devuelve una promesa**, lo que se compruebe en su `.then` no lo ve el
arnés y su fallo se pierde como rechazo no gestionado: la prueba sale verde con
el código roto.

**Regla para reconocerlo de un vistazo: si ves un `return` de una promesa dentro
de `prueba(...)`, esa prueba no comprueba nada.**

La forma correcta —la de `tests/pruebas-movil-puerta-async.js` y
`tests/pruebas-visor-carga.js`— es: la espera va **fuera** de `prueba()`, dentro
del cuerpo de `describeAsync`, y `prueba()` se llama **dentro** del `.then` con
la comprobación ya síncrona.

```js
describeAsync('Sección', function () {
  return esperarAlgo().then(function (resultado) {
    prueba('lo que se afirma', function () {
      igual(resultado, esperado);
    });
  });
});
```

### Cómo se corre la suite

```
python -m http.server 8551
```

y luego, sin depender de abrir el navegador a mano:

```
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --no-sandbox --virtual-time-budget=15000 --user-data-dir="$TEMP/chr-4f" \
  --dump-dom "http://127.0.0.1:8551/tests/test.html" | grep -o "———[^<]*———"
```

`--virtual-time-budget` es obligatorio: sin él el volcado sale antes de que
corran las secciones asíncronas. **Windows deja atar el mismo puerto dos veces
sin error**, así que antes de fiarte de una medición comprueba que el registro
del servidor CRECE.

Y las dos que van aparte:

```
node tests/prueba-borrador.js
python tests/auditar_rutas.py
```

---

## Estructura de archivos

| Archivo | Responsabilidad | Estado |
|---|---|---|
| `js/movil-visor.js` | **Nuevo.** El marco: abre y cierra por ruta, pinta la escena con carga progresiva, y traduce gestos a movimientos del recorrido | Crear, ≤300 líneas |
| `js/movil-hud.js` | **Nuevo.** Las pastillas amarillas: título, contador, categorías, cerrar, y el ocultado a los 3 s | Crear, ≤150 líneas |
| `js/movil-recorrido.js` | Los dos ejes. **Ya escrito y probado**; este bloque sólo lo consume | Sin tocar |
| `js/movil-gestos.js` | Punteros → intenciones. **Ya escrito y probado**; este bloque sólo lo consume | Sin tocar |
| `js/visor.js` | El visor de escritorio | Una línea: la guarda de lado |
| `index.html` | El marcado del visor móvil y el cableado del arranque | Modificar |
| `css/luque.css` | El visor móvil, bajo `body.es-movil` | Modificar |
| `tests/pruebas-movil-visor.js` | **Nuevo.** Cobertura de `MovilVisor` | Crear |
| `tests/pruebas-movil-hud.js` | **Nuevo.** Cobertura de `MovilHud` | Crear |
| `tests/test.html` | Cargar los dos módulos y sus dos archivos de prueba | Modificar |
| `docs/estado-conocido.md` | Lo que queda sin verificar y lo que deja de ser cierto | Modificar |

**Por qué el HUD es su propio archivo:** el marco y el HUD cambian por motivos
distintos. El marco cambia si cambia la navegación; el HUD, si cambia lo que se
enseña encima de la foto. Juntos pasarían del techo de 300 líneas y ninguno se
podría leer entero de una vez.

**Por qué NO se generaliza `VisorChrome`:** su despertar está atado a
`mouseenter`/`mouseleave` sobre la tira de miniaturas, que en móvil no existe, y
el plazo es distinto (3000 frente a 2000). La spec lo decide explícitamente:
tocar un módulo que funciona en producción para compartir un temporizador de
tres líneas es mal negocio. Se duplica el temporizador y se escribe el motivo.

---

## Tarea 1: `ordenDe` y el marco que abre y cierra por ruta

**Archivos:**
- Crear: `js/movil-visor.js`
- Crear: `tests/pruebas-movil-visor.js`
- Modificar: `tests/test.html` (cargar el módulo y su archivo de pruebas)
- Modificar: `js/visor.js` (la guarda de lado, en el suscriptor de `Visor.init`)
- Modificar: `index.html` (el marcado de `#movilVisor` y el cableado)

**Interfaces:**
- Consume: `Router.alCambiar(fn)`, `Router.ir(tipo, valor, pieza)`,
  `Datos.PROYECTOS`, `Datos.porId(id)`, `Movil.actual()`,
  `MovilRecorrido.desdeRuta(ruta, orden)`, `MovilRecorrido.inicial(orden)`.
- Produce, para las Tareas 2, 3 y 4:
  - `MovilVisor.ordenDe(proyectos)` → array de `{id: String, piezas: Number}`
  - `MovilVisor.init(refs, proyectos)` → `undefined`. `refs` es
    `{raiz, escena}`; en la Tarea 4 crecerá con las del HUD.
  - `MovilVisor.aplicar(ruta)` → `undefined`. El suscriptor del router.
  - `MovilVisor.estado()` → `{proyecto, pieza}` o `null` si está cerrado.

### Por qué `ordenDe` existe y es lo primero

`MovilRecorrido` lleva escrito un aviso en su propio código, sobre
`indiceDeProyecto`: en el `orden` que recibe, **`piezas` es un NÚMERO**, no el
array que ese mismo nombre designa en `contenido.json` y en `Datos.PROYECTOS`.
Y dice por qué importa: con un array en vez de un número,
`array >= 1` da `NaN >= 1`, o sea `false`, y **todo proyecto de fotos se
trataría como vídeo sin que nada avise**. Un fallo silencioso que se vería como
que el eje vertical no baja por las fotos.

`ordenDe` es esa conversión, en un solo sitio y con prueba propia. Es la primera
pieza del bloque justamente porque es la que más barato sale equivocar.

- [ ] **Paso 1: escribir la prueba que falla**

Crea `tests/pruebas-movil-visor.js`:

```js
/* Lo que se fija aquí es la conversión que `js/movil-recorrido.js` avisa por
   escrito que hace falta, en el comentario sobre `indiceDeProyecto`: en el
   `orden` que ese módulo consume, `piezas` es un NÚMERO —cuántas tiene el
   proyecto— y no el array que el mismo nombre designa en `contenido.json` y en
   `Datos.PROYECTOS`.

   Equivocarse no da error: `array >= 1` es `NaN >= 1`, o sea `false`, y
   `paradas()` trataría como vídeo a todo proyecto de fotos. El eje vertical
   dejaría de bajar por las fotos y bajaría directo a la ficha, en los doce
   trabajos, sin una sola excepción en consola. Por eso la conversión vive en
   una función con nombre y con prueba, y no suelta dentro de `init`. */

var MV_PROYECTOS = [
  { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial',
    tipo: 'foto',  piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] },
  { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'cortometraje',
    tipo: 'video', piezas: [] },
  { id: 'salitre', titulo: 'Salitre', categoria: 'editorial',
    tipo: 'video' }
];

describe('MovilVisor — el orden que consume MovilRecorrido', function () {

  prueba('convierte piezas a NÚMERO, que es lo que espera MovilRecorrido', function () {
    igual(MovilVisor.ordenDe(MV_PROYECTOS), [
      { id: 'niebla',  piezas: 3 },
      { id: 'oleaje',  piezas: 0 },
      { id: 'salitre', piezas: 0 }
    ]);
  });

  /* La red de seguridad de la conversión: un proyecto SIN el campo `piezas`
     —los de vídeo de `contenido.json` lo traen vacío, pero nada garantiza que
     esté— tiene que dar 0 y no `undefined`. Con `undefined`, `paradas()` haría
     `undefined >= 1`, que también es `false`, así que hoy acertaría por
     casualidad; se fija el 0 para que siga acertando cuando el criterio
     cambie. */
  prueba('un proyecto sin el campo piezas cuenta 0, no undefined', function () {
    igual(MovilVisor.ordenDe([{ id: 'x' }]), [{ id: 'x', piezas: 0 }]);
  });

  prueba('una lista vacía da un orden vacío, no revienta', function () {
    igual(MovilVisor.ordenDe([]), []);
  });

  /* Que el orden sea el de la lista es lo que hace que el eje horizontal
     recorra los trabajos en el mismo orden en que se ven en la rejilla. Si
     `ordenDe` reordenara, deslizar iría a un trabajo que no es el de al
     lado. */
  prueba('respeta el orden de la lista, que es el de la rejilla', function () {
    var ids = MovilVisor.ordenDe(MV_PROYECTOS).map(function (o) { return o.id; });
    igual(ids, ['niebla', 'oleaje', 'salitre']);
  });
});
```

- [ ] **Paso 2: correrla y ver que falla**

Añade a `tests/test.html`, junto a los demás módulos del móvil (después de
`<script src="../js/movil-hoja.js"></script>`):

```html
<!-- movil-visor.js no toca el DOM al cargarse: sólo define window.MovilVisor.
     `ordenDe` es pura y se prueba sola; lo que sí construye nodos —`aplicar`,
     que pinta la escena— recibe su contenedor del arnés de DOM.
     Ver pruebas-movil-visor.js. -->
<script src="../js/movil-visor.js"></script>
```

y el archivo de pruebas, después de `pruebas-movil-hoja-filtrar.js`:

```html
<script src="pruebas-movil-visor.js"></script>
```

Corre la suite. Esperado: **4 fallos**, todos con `MovilVisor is not defined`.

- [ ] **Paso 3: escribir `ordenDe`**

Crea `js/movil-visor.js`:

```js
window.MovilVisor = (function () {

  /* La conversión que `js/movil-recorrido.js` pide por escrito en el
     comentario sobre `indiceDeProyecto`: allí `piezas` es un NÚMERO, aquí
     arriba es un array. Equivocarse no da error —`array >= 1` es `NaN >= 1`,
     `false`— y trataría como vídeo a todo proyecto de fotos, sin que nada
     avise. Por eso la conversión tiene nombre, un solo sitio y prueba propia.

     El `|| 0` cubre al proyecto que llega sin el campo: hoy los de vídeo lo
     traen vacío, pero eso lo garantiza `contenido.json` y no este módulo. */
  function ordenDe(proyectos) {
    return proyectos.map(function (p) {
      return { id: p.id, piezas: (p.piezas && p.piezas.length) || 0 };
    });
  }

  return { ordenDe: ordenDe };
})();
```

- [ ] **Paso 4: correr las pruebas y verlas pasar**

Esperado: **366 pasan, 0 fallan** (362 de antes más 4).

- [ ] **Paso 5: comprobar que las pruebas no son de mentira**

Rompe `ordenDe` a propósito, cambiando `(p.piezas && p.piezas.length) || 0` por
`p.piezas`, y corre la suite. Esperado: al menos las dos primeras pruebas en
rojo. Deshaz el cambio. Es la comprobación que pide la spec en «Cómo se prueba»:
romper cada módulo a propósito y contar cuántas se ponen en rojo.

- [ ] **Paso 6: el marcado del visor móvil**

En `index.html`, justo DESPUÉS del bloque `<div class="visor" id="visor" ...>`
que termina en su `</div>` de cierre, añade:

```html
  <!-- El visor móvil es un bloque APARTE del `#visor` de escritorio, y no una
       variante suya con clases. Los dos tienen marco, escena y controles, pero
       ni el marcado ni los gestos coinciden: aquí no hay tira de miniaturas, ni
       lupa, ni línea de progreso, y sí hay dos ejes de deslizamiento. Fundirlos
       en un solo árbol obligaría a que cada regla de CSS y cada oyente
       preguntara de qué lado está, que es justo el `if` repartido por todas
       partes que `js/movil.js` existe para evitar.

       Cuál de los dos responde lo decide la guarda de lado del suscriptor de
       `Visor.init` (js/visor.js) y la simétrica de `MovilVisor.aplicar`. -->
  <div class="mvisor" id="movilVisor" role="dialog" aria-modal="true"
       aria-label="Visor de trabajos" hidden>
    <div class="mvisor-escena" id="movilVisorEscena"></div>
  </div>
```

- [ ] **Paso 7: la guarda de lado en el visor de escritorio**

En `js/visor.js`, dentro de `Visor.init`, el suscriptor del router pasa de:

```js
    window.Router.alCambiar(function (ruta) {
      if (ruta.tipo === 'proyecto') abrir(ruta.valor);
      else if (estado.abierto) cerrarSinTocarLaRuta();
    });
```

a:

```js
    window.Router.alCambiar(function (ruta) {
      /* La guarda de lado. Desde el bloque 4f hay DOS visores suscritos a la
         misma ruta, y sin esto los dos abrirían el mismo trabajo a la vez.
         Responde el del lado en que estamos y el otro se queda quieto; la
         guarda simétrica está en `MovilVisor.aplicar`.

         Que `Movil.actual()` ya tenga valor cuando esto corre no es
         casualidad ni suerte: `index.html` llama a `Movil.init` ANTES de
         `Router.init`, y `Router.init` avisa a sus suscriptores de forma
         SÍNCRONA. Es la misma dependencia de orden de la que ya vive
         `js/visor-origen.js`, y allí está explicada con la evidencia de lo
         que pasaba cuando estaba al revés: un enlace en frío a un trabajo en
         el móvil volaba desde un rectángulo fuera de pantalla. */
      if (window.Movil.actual() === 'movil') return;
      if (ruta.tipo === 'proyecto') abrir(ruta.valor);
      else if (estado.abierto) cerrarSinTocarLaRuta();
    });
```

- [ ] **Paso 8: escribir `init`, `aplicar` y `estado`**

Añade a `js/movil-visor.js`, dentro del IIFE y antes del `return`:

```js
  var raiz = null, escena = null, orden = [], aqui = null;

  /* `estado` es `null` cuando el visor está cerrado, y `{proyecto, pieza}`
     cuando está abierto. No se usa el `{proyecto: null}` de
     `MovilRecorrido.inicial` para representar «cerrado»: ese valor significa
     «no hay ningún trabajo», que es otra cosa, y confundirlos dejaría el visor
     abierto sobre nada cuando la lista viniera vacía. */
  function estado() { return aqui; }

  function init(refs, proyectos) {
    raiz = refs.raiz;
    escena = refs.escena;
    orden = ordenDe(proyectos);
    aqui = null;
  }

  /* El suscriptor del router, y la guarda simétrica a la de `js/visor.js`. */
  function aplicar(ruta) {
    if (window.Movil.actual() !== 'movil') return;
    if (ruta.tipo !== 'proyecto') { cerrar(); return; }

    var nuevo = window.MovilRecorrido.desdeRuta(ruta, orden);
    if (nuevo.proyecto === null) { cerrar(); return; }

    aqui = nuevo;
    raiz.hidden = false;
    document.body.classList.add('mvisor-abierto');
    pintar();
  }

  function cerrar() {
    if (!aqui) return;
    aqui = null;
    raiz.hidden = true;
    document.body.classList.remove('mvisor-abierto');
    escena.innerHTML = '';
  }

  /* En la Tarea 2 esto pinta la pieza de verdad. Aquí sólo deja constancia de
     dónde estamos, que es lo que la Tarea 1 puede comprobar sin escena. */
  function pintar() {
    escena.dataset.proyecto = aqui.proyecto;
    escena.dataset.pieza = String(aqui.pieza);
  }
```

y cambia el `return` por:

```js
  return {
    ordenDe: ordenDe,
    init: init,
    aplicar: aplicar,
    estado: estado
  };
```

- [ ] **Paso 9: escribir las pruebas de `aplicar`**

Añade a `tests/pruebas-movil-visor.js`:

```js
/* `aplicar` toca el DOM y pregunta por `Movil.actual()`, así que necesita un
   contenedor y un lado. El contenedor lo da el arnés de DOM; el lado se falsea
   sustituyendo `window.Movil` y devolviéndolo al terminar.

   Se falsea en vez de llamar a `Movil.init` con una consulta de mentira porque
   `Movil.init` engancha un oyente `change` que no se puede desenganchar: cada
   prueba dejaría uno vivo, y la siguiente correría con los de todas las
   anteriores encima. */
describe('MovilVisor — abre y cierra según la ruta', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  function conVisor(fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var raiz = caja.querySelector('#mvRaiz');
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: raiz, escena: escena }, MV_PROYECTOS);
        try { return fn(raiz, escena); }
        finally { document.body.classList.remove('mvisor-abierto'); }
      });
  }

  var RUTA_NIEBLA = { tipo: 'proyecto', valor: 'niebla', pieza: null };
  var RUTA_TODOS  = { tipo: 'todos', valor: null, pieza: null };

  prueba('una ruta de proyecto abre el visor', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return raiz.hidden;
    }), false);
  });

  prueba('y deja el recorrido en la primera pieza de ese proyecto', function () {
    igual(conVisor(function () {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return MovilVisor.estado();
    }), { proyecto: 'niebla', pieza: 1 });
  });

  /* Un proyecto de vídeo no tiene piezas: su primera parada es `null`, la del
     propio vídeo. Que salga `null` y no 1 es lo que hace que bajar llegue a la
     ficha en un solo gesto, que es la razón entera de que el eje vertical
     signifique «más sobre este trabajo» y no «más fotos». */
  prueba('en un proyecto de vídeo la primera parada es el vídeo, no una pieza', function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return MovilVisor.estado();
    }), { proyecto: 'oleaje', pieza: null });
  });

  prueba('el segundo tramo de la ruta lleva a esa pieza', function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 3 });
      });
      return MovilVisor.estado();
    }), { proyecto: 'niebla', pieza: 3 });
  });

  prueba('una ruta que no es de proyecto lo cierra', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_NIEBLA);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      return { oculto: raiz.hidden, estado: MovilVisor.estado() };
    }), { oculto: true, estado: null });
  });

  /* La guarda de lado, que es la mitad móvil de la pareja: la otra mitad está
     en el suscriptor de `Visor.init` (js/visor.js). Sin las dos, los dos
     visores abrirían el mismo trabajo a la vez sobre la misma pantalla. */
  prueba('en escritorio no responde, aunque la ruta sea de proyecto', function () {
    igual(conVisor(function (raiz) {
      conLado('escritorio', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return { oculto: raiz.hidden, estado: MovilVisor.estado() };
    }), { oculto: true, estado: null });
  });

  /* Cerrar dos veces seguidas pasa de verdad: llegar a la portada desde la
     portada avisa igual, porque `Router.decidir` devuelve 'avisar' cuando el
     hash no cambia. Tiene que ser inofensivo. */
  prueba('cerrar estando ya cerrado no rompe nada', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_TODOS);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      return raiz.hidden;
    }), true);
  });
});
```

- [ ] **Paso 10: correr la suite entera**

Esperado: **373 pasan, 0 fallan** (366 más 7).

- [ ] **Paso 11: cablear el arranque en `index.html`**

Dentro del callback de `window.Contenido.cargar`, DESPUÉS del bloque de
`MovilHoja.pintar` y del `Router.alCambiar` que filtra la rejilla, y **ANTES**
de `window.Movil.init(...)`, añade:

```js
    /* El visor móvil se suscribe aquí, y aquí quiere decir ANTES de
       `Router.init()`, por el mismo motivo que ya obligó a subir a
       `MovilHoja.pintar` y a `Movil.init`: `Router.init()` avisa a sus
       suscriptores de forma SÍNCRONA, así que quien se suscribe después se
       pierde la ruta inicial y un enlace en frío a un trabajo no abriría
       nada.

       Va después de `Movil.init` en el ORDEN DE EJECUCIÓN aunque esté escrito
       antes de él, porque lo que corre en el aviso inicial es `aplicar`, no
       `init`, y para entonces `Movil.actual()` ya tiene valor. */
    window.MovilVisor.init({
      raiz:   document.getElementById('movilVisor'),
      escena: document.getElementById('movilVisorEscena')
    }, window.Datos.PROYECTOS);
    window.Router.alCambiar(function (ruta) {
      window.MovilVisor.aplicar(ruta);
    });
```

Y añade el `<script>` del módulo junto a los demás del móvil, antes del bloque
de arranque:

```html
  <script src="js/movil-visor.js"></script>
```

- [ ] **Paso 12: comprobar a mano que el escritorio no se ha movido**

Sirve el sitio y ábrelo en una ventana ANCHA (más de 860px). Comprueba que
`#/niebla` sigue abriendo el visor de escritorio con su vuelo, su tira de
miniaturas y su lupa. La guarda del Paso 7 no debe haber cambiado nada de eso.

- [ ] **Paso 13: el auditor de rutas**

```
python tests/auditar_rutas.py
```

Esperado: `OK: todas las rutas locales existen con las mayusculas exactas`. El
`<script src="js/movil-visor.js">` nuevo es justo lo que este auditor existe
para vigilar: en Windows una mayúscula equivocada funciona y en Cloudflare da
404.

- [ ] **Paso 14: commit**

```bash
git add js/movil-visor.js tests/pruebas-movil-visor.js tests/test.html \
        js/visor.js index.html
git commit -m "Abrir y cerrar el visor movil segun la ruta

ordenDe convierte piezas a numero, que es lo que MovilRecorrido pide por
escrito: con el array, todo proyecto de fotos se trataria como video sin
que nada avise.

Dos visores estan ahora suscritos a la misma ruta, asi que cada uno lleva
su guarda de lado. La de escritorio va en el suscriptor de Visor.init.

373 pasan, 0 fallan."
```

---

## Tarea 2: la escena — la foto, el vídeo y la ficha, con carga progresiva

**Archivos:**
- Modificar: `js/movil-visor.js` (sustituir el `pintar()` provisional)
- Modificar: `tests/pruebas-movil-visor.js`

**Interfaces:**
- Consume: `MovilVisor.estado()` y las variables de módulo `raiz`, `escena`,
  `orden` de la Tarea 1; `Datos.porId(id)`.
- Produce, para la Tarea 3: nada nuevo en la API. `pintar()` sigue siendo
  privada y se sigue llamando desde `aplicar`.

### Las tres paradas, y por qué la ficha es una de ellas

El eje vertical de `MovilRecorrido.paradas` devuelve, de arriba abajo,
`[1, 2, …, n, 'ficha']` para un proyecto de fotos y `[null, 'ficha']` para uno
de vídeo. Este módulo tiene que saber pintar **las tres formas** que puede tomar
`aqui.pieza`:

| `aqui.pieza` | Qué se pinta |
|---|---|
| un número desde 1 | la foto, con carga progresiva |
| `null` | el vídeo del proyecto |
| `'ficha'` | la ficha técnica, que es el fondo del eje |

Que la ficha sea una parada del eje y no un panel que se despliega es la
decisión que hace que **el gesto nunca se quede sin respuesta**: seis de los doce
proyectos son de vídeo y tienen cero piezas, así que un eje que significara «más
fotos» no haría nada en la mitad del portafolio.

### La carga progresiva no es una optimización, es un requisito medido

La spec lo exige: «Al entrar en un proyecto la portada ya está en caché porque
venías de verla en la rejilla; se muestra esa mientras llega la de 746 KB y se
cambia al terminar. Sin eso, cada deslizamiento en 4G es un segundo de negro.»

Y hay una medida propia que lo respalda, del 2026-09-04, hecha sobre el visor de
ESCRITORIO en móvil: pedir directamente la pieza entera daba **1371 ms** hasta
que la imagen aparecía, contra **4 ms** con una URL ya descargada. La técnica y
la condición que impone están escritas en `js/visor-carga.js`, en los
comentarios de `vistaPrevia` y `relevar`.

**No se reutiliza `VisorCarga`, y es deliberado.** Ese módulo guarda la raíz del
visor de escritorio en una variable de módulo (`VisorCarga.init`), y llamarlo
desde aquí la reapuntaría al marco móvil. Mientras sólo un visor esté vivo eso
funciona; en cuanto se cruza el umbral de ancho con el visor abierto, el
indicador de carga del escritorio quedaría atado a un elemento que ya no se ve.
Se copian las quince líneas de la técnica y se escribe este motivo, que es más
barato que un fallo que sólo aparece girando una tableta.

**CONDICIÓN SOBRE EL CONTENIDO, no sobre este código:** la portada y la pieza
tienen que ser la misma foto **en la misma proporción**. La escena usa
`object-fit: contain`, así que la caja pintada la decide la proporción de la
imagen: si no coinciden, el cambio da un salto. En el relleno coinciden (portada
1200×1500 y pieza 2400×3000, las dos 4:5). Quien genere los recortes del estudio
tiene que mantenerlo.

- [ ] **Paso 1: escribir las pruebas que fallan**

Añade a `tests/pruebas-movil-visor.js`, reutilizando `conVisor` y `conLado` de
la Tarea 1:

```js
describe('MovilVisor — qué pinta cada parada del eje', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* Estos proyectos llevan `portadaUrl` porque es lo que `Datos.establecer`
     resuelve y lo que la rejilla ya tiene cargado; es la vista previa de la
     carga progresiva. Se usan URLs de mentira y no `data:` porque aquí no se
     espera a ningún evento de carga: sólo se mira QUÉ se pide primero. */
  var MV_CON_FOTOS = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', camara: 'Mamiya', optica: '80mm' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  function conEscena(proyectos, fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var raiz = caja.querySelector('#mvRaiz');
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: raiz, escena: escena }, proyectos);
        /* `Datos.porId` es a quien `pintar` le pide el proyecto entero, porque
           `orden` sólo guarda `{id, piezas}`. Se falsea sobre la lista de la
           prueba para no depender del contenido real. */
        var antes = window.Datos;
        window.Datos = {
          porId: function (id) {
            for (var i = 0; i < proyectos.length; i++) {
              if (proyectos[i].id === id) return proyectos[i];
            }
            return null;
          }
        };
        try { return fn(escena); }
        finally {
          window.Datos = antes;
          document.body.classList.remove('mvisor-abierto');
        }
      });
  }

  /* La mitad que importa de la carga progresiva: lo PRIMERO que se pide es la
     portada, que la rejilla ya tiene descargada. Medido el 2026-09-04 sobre el
     visor de escritorio: pedir la pieza entera de primeras eran 1371 ms de
     espera contra 4 ms con la imagen ya en caché. */
  prueba('la foto arranca con la portada, que la rejilla ya tiene cargada', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
      });
      return escena.querySelector('img').getAttribute('src');
    }), 'portada-niebla.jpg');
  });

  prueba('la foto lleva texto alternativo con el trabajo y la pieza', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return escena.querySelector('img').alt;
    }), 'Niebla, pieza 2 de 2');
  });

  /* La ficha es el FONDO del eje vertical, no un panel aparte, así que se pinta
     en la misma escena y sustituye a la foto. */
  prueba('la parada ficha pinta la ficha técnica, no una foto', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return { fichas: escena.querySelectorAll('.mvisor-ficha').length,
               fotos:  escena.querySelectorAll('img').length };
    }), { fichas: 1, fotos: 0 });
  });

  prueba('la ficha lleva los cuatro campos y el recuento de piezas', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      var dts = escena.querySelectorAll('dt');
      var out = [];
      for (var i = 0; i < dts.length; i++) out.push(dts[i].textContent);
      return out;
    }), ['Cliente', 'Año', 'Cámara', 'Óptica', 'Piezas']);
  });

  /* Cambiar de parada VACÍA la escena antes de pintar. Sin esto, deslizar
     acumularía una <img> encima de otra y la memoria crecería con cada gesto. */
  prueba('cambiar de parada no acumula nodos en la escena', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return escena.childNodes.length;
    }), 1);
  });
});
```

Y para el vídeo, un `describe` propio porque su lista de proyectos es otra:

```js
describe('MovilVisor — el proyecto de vídeo', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* `vimeo: null` es el estado REAL de los seis proyectos de vídeo de
     `contenido.json` hasta que el estudio suba los suyos, así que el camino de
     degradación es hoy el camino normal y merece prueba antes que el otro. */
  var MV_VIDEO = [{
    id: 'oleaje', titulo: 'Oleaje', categoria: 'cortometraje', tipo: 'video',
    portadaUrl: 'poster-oleaje.jpg', vimeo: null,
    ficha: { cliente: 'Estudio', anio: '2026', camara: 'Arri', optica: '35mm' },
    piezas: []
  }];

  function conEscena(fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: caja.querySelector('#mvRaiz'), escena: escena },
                        MV_VIDEO);
        var antes = window.Datos;
        window.Datos = { porId: function () { return MV_VIDEO[0]; } };
        try { return fn(escena); }
        finally {
          window.Datos = antes;
          document.body.classList.remove('mvisor-abierto');
        }
      });
  }

  prueba('sin vimeo se ve el póster, no un rectángulo negro', function () {
    igual(conEscena(function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return escena.querySelector('img').getAttribute('src');
    }), 'poster-oleaje.jpg');
  });

  prueba('y no se cuela ningún iframe cuando no hay vídeo que enseñar', function () {
    igual(conEscena(function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return escena.querySelectorAll('iframe').length;
    }), 0);
  });
});
```

- [ ] **Paso 2: correrlas y verlas fallar**

Esperado: **7 fallos**. Los de la foto y el vídeo por no encontrar `img`
(`pintar` sólo escribe `dataset`), y los de la ficha por no encontrar
`.mvisor-ficha` ni `dt`.

- [ ] **Paso 3: sustituir el `pintar()` provisional**

En `js/movil-visor.js`, cambia la función `pintar` de la Tarea 1 por esto:

```js
  /* Vacía la escena antes de cada parada: sin esto, deslizar acumularía una
     <img> encima de otra y la memoria crecería con cada gesto. */
  function pintar() {
    var p = window.Datos.porId(aqui.proyecto);
    if (!p) { cerrar(); return; }

    escena.innerHTML = '';
    if (aqui.pieza === 'ficha')     escena.appendChild(fichaDe(p));
    else if (aqui.pieza === null)   escena.appendChild(videoDe(p));
    else                            escena.appendChild(fotoDe(p, aqui.pieza));
  }

  /* La foto, con carga progresiva. Se pinta primero la PORTADA —que la rejilla
     ya tiene descargada, porque venías de verla— y se cambia a la pieza entera
     cuando llega. Medido el 2026-09-04 sobre el visor de escritorio en móvil:
     pedir la pieza de primeras eran 1371 ms hasta ver algo, contra 4 ms con la
     imagen ya en caché. Sin esto, cada deslizamiento en 4G es un segundo de
     negro.

     CONDICIÓN SOBRE EL CONTENIDO, no sobre este código: la portada y la pieza
     tienen que ser la misma foto EN LA MISMA PROPORCIÓN. La escena usa
     `object-fit:contain` (css/luque.css), así que la caja pintada la decide la
     proporción de la imagen: si no coinciden, el cambio da un salto. En el
     relleno coinciden (las dos 4:5); quien genere los recortes de las fotos del
     estudio tiene que mantenerlo.

     No se reutiliza `js/visor-carga.js`, que hace esto mismo para el
     escritorio: aquel módulo guarda su raíz en una variable de módulo, y
     llamarlo desde aquí la reapuntaría al marco móvil, dejando el indicador del
     escritorio atado a un elemento que ya no se ve en cuanto se cruza el umbral
     de ancho con el visor abierto. Quince líneas repetidas salen más baratas
     que un fallo que sólo aparece girando una tableta. */
  function fotoDe(p, numero) {
    var plena = p.piezas[numero - 1].url;
    var img = document.createElement('img');
    img.className = 'mvisor-foto';
    img.src = p.portadaUrl || plena;
    img.alt = p.titulo + ', pieza ' + numero + ' de ' + p.piezas.length;
    img.decoding = 'async';
    if (p.portadaUrl && p.portadaUrl !== plena) relevar(img, plena);
    return img;
  }

  /* Cambia a la foto entera cuando está descargada y decodificada, así que el
     cambio no parpadea. El fallo NO releva a propósito: dejar la portada buena
     en pantalla es mejor que cambiarla por una imagen rota. Y comprueba
     `parentNode` porque el dedo puede haber deslizado a otra parada mientras
     tanto, y esta <img> ya no estar en ninguna escena. */
  function relevar(img, plena) {
    var grande = new Image();
    grande.addEventListener('load', function () {
      if (img.parentNode) img.src = plena;
    }, { once: true });
    grande.src = plena;
  }

  /* Sin `vimeo` se enseña el póster y no un rectángulo negro, que es lo que la
     spec pide en «Cuando algo falla». Hoy es el camino NORMAL y no el de
     excepción: los seis proyectos de vídeo de `contenido.json` llevan
     `vimeo: null` hasta que el estudio suba los suyos. */
  function videoDe(p) {
    if (!p.vimeo) {
      var poster = document.createElement('img');
      poster.className = 'mvisor-foto';
      poster.src = p.portadaUrl;
      poster.alt = p.titulo + ', fotograma del vídeo';
      poster.decoding = 'async';
      return poster;
    }
    var marco = document.createElement('iframe');
    marco.className = 'mvisor-video';
    marco.src = 'https://player.vimeo.com/video/' + p.vimeo;
    marco.title = p.titulo;
    marco.setAttribute('allow', 'fullscreen; picture-in-picture');
    marco.setAttribute('allowfullscreen', '');
    return marco;
  }

  /* La ficha es el FONDO del eje vertical, no un panel que se despliega encima:
     por eso se pinta en la misma escena y sustituye a la foto. Las cinco filas
     son las mismas que enseña el escritorio en `VisorFicha.pintar`
     (js/visor-ficha.js), y con los mismos rótulos, porque es la misma ficha
     vista en otra pantalla. */
  function fichaDe(p) {
    var caja = document.createElement('div');
    caja.className = 'mvisor-ficha';

    var h = document.createElement('h2');
    h.className = 'mvisor-ficha-titulo';
    h.textContent = p.titulo;
    caja.appendChild(h);

    var lista = document.createElement('dl');
    lista.className = 'mvisor-ficha-datos';
    [['Cliente', p.ficha.cliente],
     ['Año',     p.ficha.anio],
     ['Cámara',  p.ficha.camara],
     ['Óptica',  p.ficha.optica],
     ['Piezas',  p.piezas.length]].forEach(function (f) {
      var fila = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd);
      lista.appendChild(fila);
    });
    caja.appendChild(lista);
    return caja;
  }
```

- [ ] **Paso 4: correr las pruebas y verlas pasar**

Esperado: **380 pasan, 0 fallan** (373 más 7).

- [ ] **Paso 5: comprobar que las pruebas no son de mentira**

Rompe la carga progresiva cambiando `img.src = p.portadaUrl || plena;` por
`img.src = plena;` y corre la suite. Esperado: la prueba «la foto arranca con la
portada» en rojo, y sólo ésa. Deshaz el cambio.

Rompe después el vaciado, quitando `escena.innerHTML = '';`. Esperado: la prueba
«cambiar de parada no acumula nodos» en rojo. Deshaz el cambio.

- [ ] **Paso 6: comprobar el techo de líneas y el ancho**

```bash
wc -l js/movil-visor.js
git diff --unified=0 js/movil-visor.js | grep "^+" | awk 'length>91'
```

Esperado: por debajo de 300 líneas, y la segunda orden sin salida.

- [ ] **Paso 7: commit**

```bash
git add js/movil-visor.js tests/pruebas-movil-visor.js
git commit -m "Pintar la foto, el video y la ficha en la escena movil

Las tres formas que puede tomar una parada del eje vertical de
MovilRecorrido: un numero, null para el video, y ficha para el fondo.

La foto arranca con la portada que la rejilla ya tiene descargada y cambia
a la pieza entera cuando llega. Medido el 2026-09-04 sobre el visor de
escritorio: 1371 ms contra 4 ms. No se reutiliza VisorCarga porque guarda
su raiz en una variable de modulo; el motivo esta escrito en el codigo.

380 pasan, 0 fallan."
```

---

## Tarea 3: los dos ejes — el dedo movido al router

**Archivos:**
- Modificar: `js/movil-visor.js`
- Modificar: `tests/pruebas-movil-visor.js`
- Modificar: `css/luque.css` (sólo `touch-action` y `overscroll-behavior-y`; el
  resto del CSS es la Tarea 5)

**Interfaces:**
- Consume: `MovilGestos.inicial()`, `.presionar(estado, punto)`,
  `.soltar(estado, punto)`; `MovilRecorrido.mover(estado, gesto, orden)`,
  `.aRuta(estado)`; `Router.ir(tipo, valor, pieza)`.
- Produce, para la Tarea 4:
  - `MovilVisor.siguienteRuta(aqui, intencion, orden)` → la ruta a la que
    navegar, o `null` si esa intención no mueve.

### Dónde vive la inversión, y por qué aquí no

`MovilRecorrido.mover` lleva escrito en su comentario que los nombres son **los
del DEDO**: `'izquierda'` significa «he deslizado a la izquierda» y trae el
proyecto SIGUIENTE. Y dice por qué esa inversión vive allí y en ningún otro
sitio: si viviera en quien pinta, cada pantalla nueva podría equivocarse de
signo por su cuenta, «y ese es justo el error que no da error: se ve como que
los gestos van al revés».

**Este módulo no invierte nada.** Pasa la intención tal cual sale de
`MovilGestos` a `MovilRecorrido.mover`. Si alguien siente que los gestos van al
revés, el sitio donde mirar es `movil-recorrido.js`, no éste.

### Por qué se navega por el router y no se pinta directo

Sería más corto llamar a `pintar()` con el estado nuevo. No se hace: la URL
tiene que seguir al dedo, porque es lo que permite compartir un enlace a una
foto concreta (`#/bruma/3`) y lo que hace que el botón «atrás» del navegador
signifique algo.

Y la regla del historial ya está resuelta y probada en `Router.decidir`
(bloque 4b): **empuja al cambiar de proyecto y reemplaza al cambiar de foto.**
Sin eso, salir de un proyecto de ocho fotos exigiría pulsar «atrás» ocho veces.
Este módulo llama a `Router.ir` y no vuelve a decidirlo.

### El pellizco se recibe y se ignora, a propósito

`MovilGestos.soltar` puede devolver `'pellizco'`. Este bloque no amplía —eso es
el 4g—, pero la intención **tiene que consumirse sin hacer nada**: lo que no
puede pasar es que un pellizco se cuele como deslizamiento y cambie de trabajo
mientras alguien intenta ampliar. `MovilGestos` ya lo garantiza cancelando el
deslizamiento en cuanto hay un segundo dedo; aquí sólo hay que no tratar
`'pellizco'` como dirección.

- [ ] **Paso 1: escribir las pruebas que fallan**

`siguienteRuta` es puro y se prueba sin DOM ni arnés. Añade a
`tests/pruebas-movil-visor.js`:

```js
describe('MovilVisor — del dedo a la ruta', function () {

  var MV_ORDEN = [
    { id: 'niebla',  piezas: 3 },
    { id: 'oleaje',  piezas: 0 },
    { id: 'salitre', piezas: 2 }
  ];

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  /* Deslizar a la izquierda trae el trabajo SIGUIENTE: los nombres son los del
     dedo, no los del contenido, y la inversión vive en `MovilRecorrido.mover`.
     Aquí sólo se comprueba que este módulo no la duplique ni la deshaga. */
  prueba('deslizar a la izquierda lleva al trabajo siguiente, por su portada', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'izquierda', MV_ORDEN),
          { tipo: 'proyecto', valor: 'oleaje', pieza: null });
  });

  prueba('deslizar arriba baja una parada dentro del mismo trabajo', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'arriba', MV_ORDEN),
          { tipo: 'proyecto', valor: 'niebla', pieza: 2 });
  });

  /* En un proyecto de vídeo la única parada antes de la ficha es el propio
     vídeo, así que bajar llega a los créditos en UN gesto. Es la razón entera
     de que el eje vertical signifique «más sobre este trabajo»: seis de los
     doce proyectos son de vídeo, y un eje que significara «más fotos» no haría
     nada en la mitad del portafolio. */
  prueba('en un vídeo, bajar llega a la ficha en un solo gesto', function () {
    igual(MovilVisor.siguienteRuta(en('oleaje', null), 'arriba', MV_ORDEN),
          { tipo: 'proyecto', valor: 'oleaje', pieza: 'ficha' });
  });

  /* Recortar en vez de dar la vuelta: al llegar al final la serie se detiene,
     para que no se confunda dónde termina. `mover` devuelve el MISMO estado, y
     este módulo lo traduce a `null` para no llamar al router sin necesidad. */
  prueba('en el último trabajo, seguir deslizando no sale al vacío', function () {
    igual(MovilVisor.siguienteRuta(en('salitre', 1), 'izquierda', MV_ORDEN), null);
  });

  prueba('en la primera parada, subir no sale del trabajo', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'abajo', MV_ORDEN), null);
  });

  /* El toque no navega: en la Tarea 4 despierta el HUD. Lo que no puede es
     moverse por la rejilla, porque entonces sería imposible volver a encender
     el HUD sin cambiar de foto. */
  prueba('un toque no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'toque', MV_ORDEN), null);
  });

  /* El pellizco se recibe y no mueve. Este bloque no amplía —eso es el 4g—,
     pero lo que no puede pasar es que se cuele como deslizamiento y cambie de
     trabajo mientras alguien intenta ampliar. */
  prueba('un pellizco no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'pellizco', MV_ORDEN), null);
  });

  /* `MovilGestos.soltar` devuelve `null` para la zona muerta: el arrastre corto
     o diagonal que no quiso tocar ni quiso deslizar. */
  prueba('la zona muerta no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), null, MV_ORDEN), null);
  });

  prueba('con el visor cerrado no hay ruta a la que ir', function () {
    igual(MovilVisor.siguienteRuta(null, 'izquierda', MV_ORDEN), null);
  });
});
```

- [ ] **Paso 2: correrlas y verlas fallar**

Esperado: **9 fallos**, todos con
`MovilVisor.siguienteRuta is not a function`.

- [ ] **Paso 3: escribir `siguienteRuta`**

Añade a `js/movil-visor.js`:

```js
  /* Del dedo a la ruta. Devuelve `null` cuando la intención no mueve —el toque,
     el pellizco, la zona muerta, y el borde de la serie— para no llamar al
     router sin necesidad: `Router.decidir` trataría ese destino como «avisar» y
     volveríamos a pintar la misma parada por nada.

     Este módulo NO invierte las direcciones. `MovilRecorrido.mover` lleva
     escrito que los nombres son los del DEDO y que la inversión vive allí y en
     ningún otro sitio, porque si viviera en quien pinta, cada pantalla nueva
     podría equivocarse de signo por su cuenta. Si algún día los gestos se
     sienten al revés, el sitio donde mirar es `movil-recorrido.js`. */
  function siguienteRuta(aqui, intencion, orden) {
    if (!aqui) return null;
    if (intencion !== 'izquierda' && intencion !== 'derecha'
        && intencion !== 'arriba' && intencion !== 'abajo') return null;

    var destino = window.MovilRecorrido.mover(aqui, intencion, orden);
    if (destino.proyecto === aqui.proyecto && destino.pieza === aqui.pieza) {
      return null;
    }
    return window.MovilRecorrido.aRuta(destino);
  }
```

y expórtala en el `return`:

```js
    siguienteRuta: siguienteRuta,
```

- [ ] **Paso 4: correr las pruebas y verlas pasar**

Esperado: **389 pasan, 0 fallan** (380 más 9).

- [ ] **Paso 5: enganchar los punteros**

Añade a `js/movil-visor.js`, y llama a `engancharGestos()` desde el final de
`init`:

```js
  var gesto = null;

  /* Los oyentes van en la RAÍZ y no en la escena: la escena la vacía `pintar`
     en cada parada, así que un oyente puesto allí se iría con el primer
     deslizamiento y el segundo no haría nada. La raíz sobrevive a todo el
     recorrido.

     `pointer*` y no `touch*`: es lo que ya usa el resto del móvil
     (`js/movil-puerta.js`) y lo que permite probar el gesto con un ratón en el
     escritorio mientras se desarrolla.

     `pointercancel` cuenta como soltar. El sistema lo dispara cuando se lleva
     el gesto —una llamada entrante, el gesto de «atrás» del navegador desde el
     borde— y sin tratarlo el contador de dedos de `MovilGestos` se quedaría en
     uno para siempre, dejando el visor sordo hasta recargar. */
  function engancharGestos() {
    gesto = window.MovilGestos.inicial();

    raiz.addEventListener('pointerdown', function (e) {
      gesto = window.MovilGestos.presionar(gesto, { x: e.clientX, y: e.clientY });
    });

    raiz.addEventListener('pointerup', function (e) {
      soltarEn(e);
    });

    raiz.addEventListener('pointercancel', function (e) {
      soltarEn(e);
    });
  }

  function soltarEn(e) {
    var r = window.MovilGestos.soltar(gesto, { x: e.clientX, y: e.clientY });
    gesto = r.estado;
    if (r.intencion === null) return;

    /* En la Tarea 4 el toque despierta el HUD. Aquí se consume sin hacer nada,
       que es lo correcto mientras no haya HUD que despertar. */
    var ruta = siguienteRuta(aqui, r.intencion, orden);
    if (!ruta) return;
    window.Router.ir(ruta.tipo, ruta.valor, ruta.pieza);
  }
```

- [ ] **Paso 6: las dos cosas del sistema operativo, en el CSS**

En `css/luque.css`, al final, añade:

```css
/* Dos cosas que no salen del código de este repositorio sino del
   comportamiento de los móviles, y que sin ponerlas a propósito rompen el
   recorrido en el dispositivo real aunque en un navegador de escritorio
   encogido no se note.

   `overscroll-behavior-y: contain` apaga el «tirar para recargar» de Chrome en
   Android. El gesto «foto anterior» empieza deslizando hacia abajo desde
   arriba, que es exactamente el gesto que recarga la página: sin esto, el
   recorrido se interrumpe con una recarga a mitad.

   `touch-action: none` le dice al navegador que no se quede con el
   desplazamiento ni el zoom por su cuenta dentro del visor, porque aquí los
   dos ejes los interpreta `js/movil-gestos.js`. Fuera del visor NO se pone: la
   rejilla de la portada sí tiene que poder desplazarse con el dedo. */
body.es-movil .mvisor{
  overscroll-behavior-y:contain;
  touch-action:none;
}
```

- [ ] **Paso 7: comprobar que las pruebas no son de mentira**

Rompe `siguienteRuta` quitando la comparación de igualdad —el bloque
`if (destino.proyecto === aqui.proyecto && ...) return null;`— y corre la suite.
Esperado: las dos pruebas del borde de la serie en rojo. Deshaz el cambio.

Rompe después la lista de intenciones, dejando pasar `'toque'`, y corre la
suite. Esperado: la prueba del toque en rojo. Deshaz el cambio.

- [ ] **Paso 8: commit**

```bash
git add js/movil-visor.js tests/pruebas-movil-visor.js css/luque.css
git commit -m "Cablear los dos ejes del visor movil al router

siguienteRuta traduce la intencion de MovilGestos a un movimiento de
MovilRecorrido y de ahi a una ruta. Devuelve null cuando la intencion no
mueve: el toque, el pellizco, la zona muerta y el borde de la serie.

Se navega por el router y no se pinta directo, para que la URL siga al dedo
y el boton atras signifique algo. La regla de empujar-o-reemplazar ya la
resolvio el bloque 4b en Router.decidir y aqui no se vuelve a decidir.

overscroll-behavior-y contain apaga el tirar-para-recargar de Chrome, que
si no interrumpe el gesto de foto anterior con una recarga.

389 pasan, 0 fallan."
```

---

## Tarea 4: el HUD y el ocultado a los 3 segundos

**Archivos:**
- Crear: `js/movil-hud.js`
- Crear: `tests/pruebas-movil-hud.js`
- Modificar: `tests/test.html`
- Modificar: `index.html` (el marcado del HUD dentro de `#movilVisor`)
- Modificar: `js/movil-visor.js` (pintar el HUD en cada parada; el toque lo
  despierta)

**Interfaces:**
- Consume: `Datos.CATEGORIAS`, `Router.ir(tipo, valor, pieza)`.
- Produce:
  - `MovilHud.OCULTAR_TRAS` → `3000`
  - `MovilHud.contador(pieza, total)` → `'02/08'`, o `''` cuando no procede
  - `MovilHud.init(refs, alElegirCategoria, alCerrar)` → `undefined`
  - `MovilHud.pintar(proyecto, pieza, total)` → `undefined`
  - `MovilHud.despertar()` → `undefined`. Enseña el HUD y reinicia el plazo.
  - `MovilHud.visible()` → `Boolean`

### Por qué 3 segundos y no 2

El escritorio oculta a los 2000 ms (`js/visor-chrome.js`, la constante
`OCULTAR_TRAS`), pero allí el chrome se despierta con cualquier movimiento del
ratón: gratis y constante. **En táctil hay que tocar a propósito**, así que
despertar cuesta más y el plazo se alarga para compensar.

**`VisorChrome` no se generaliza**, y la spec lo decide explícitamente: su
despertar está atado a `mouseenter`/`mouseleave` sobre la tira de miniaturas,
que en móvil no existe. Tocar un módulo que funciona en producción para
compartir un temporizador de tres líneas es mal negocio. Se duplica el
temporizador y se escribe el motivo, que es esto.

### Por qué el texto va en negro sobre pastilla amarilla

Medido en la spec: el amarillo suelto sobre una foto clara da 1,07:1 de
contraste, y el negro suelto sobre una foto oscura da ~1,2:1. **El mismo fallo
cambiado de lado**, y como las fotos las sube el estudio no se puede apostar por
ninguno de los dos. La pastilla amarilla con texto negro da **17,6:1 pase lo que
pase con la foto**, porque el fondo del texto deja de ser la foto.

### Las categorías viven aquí

Consecuencia de que la portada lleve sólo el número: desde la rejilla no se
distingue un editorial de un corto. La pastilla desplegable de arriba es donde
se recuperan.

- [ ] **Paso 1: escribir las pruebas que fallan**

Crea `tests/pruebas-movil-hud.js`:

```js
/* El HUD del visor móvil. Lo que se puede probar sin un dedo es: cómo se
   formatea el contador, qué se enseña en cada parada, y que el plazo de
   ocultado sea el que la spec decidió y no el del escritorio.

   El plazo se comprueba contra la CONSTANTE en vivo (`MovilHud.OCULTAR_TRAS`)
   y no contra un 3000 escrito a mano en cada prueba, para que las pruebas se
   adapten solas si el estudio pide otro plazo tras verlo en un móvil. La única
   que fija el número es la de abajo, que existe justamente para que cambiarlo
   sea una decisión y no un descuido. */

describe('MovilHud — el contador', function () {

  /* Dos cifras, igual que la rejilla de la portada y que el contador del
     escritorio: `02/08` y no `2/8`. Que no baile el ancho al pasar de la 9 a
     la 10 es la razón. */
  prueba('rellena con cero a la izquierda, en los dos lados', function () {
    igual(MovilHud.contador(2, 8), '02/08');
  });

  prueba('con dos cifras no rellena de más', function () {
    igual(MovilHud.contador(10, 12), '10/12');
  });

  /* La ficha es una parada del eje, pero no es una pieza: enseñar `06/05` allí
     sería mentir sobre dónde estás. */
  prueba('en la ficha no hay contador', function () {
    igual(MovilHud.contador('ficha', 8), '');
  });

  /* Un proyecto de vídeo tiene cero piezas y su parada es `null`. Un `00/00`
     no dice nada y ocupa sitio sobre la foto. */
  prueba('en el vídeo no hay contador', function () {
    igual(MovilHud.contador(null, 0), '');
  });
});

describe('MovilHud — el plazo de ocultado', function () {

  /* Esta prueba fija el NÚMERO, y es la única que lo hace. Existe para que
     cambiar el plazo sea una decisión deliberada y no un descuido: el
     escritorio oculta a los 2000 (`js/visor-chrome.js`, la constante
     `OCULTAR_TRAS`) y aquí son 3000, porque allí el chrome se despierta con
     cualquier movimiento del ratón —gratis y constante— y en táctil hay que
     tocar a propósito. */
  prueba('son 3 segundos, no los 2 del escritorio', function () {
    igual(MovilHud.OCULTAR_TRAS, 3000);
  });
});
```

Y la parte que toca el DOM, con el arnés:

```js
describe('MovilHud — qué se enseña en cada parada', function () {

  var HUD_MARCADO =
    '<div>' +
    '  <div id="hudRaiz">' +
    '    <button id="hudCat" type="button"></button>' +
    '    <ul id="hudCats"></ul>' +
    '    <button id="hudCerrar" type="button"></button>' +
    '    <p id="hudTitulo"></p>' +
    '    <span id="hudContador"></span>' +
    '  </div>' +
    '</div>';

  var HUD_PROYECTO = {
    id: 'niebla', titulo: 'Niebla', categoria: 'foto-stills',
    piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }]
  };

  function conHud(fn) {
    return ArnesDom.conElemento(HUD_MARCADO, function (caja) {
      var antes = window.Datos;
      /* Las cuatro de verdad, copiadas de `js/reglas-contenido.js`, que es su
         única fuente. Inventarse una lista más corta aquí dejaría la prueba
         del desplegable contando un número que no es el de producción. */
      window.Datos = {
        CATEGORIAS: ['editorial', 'foto-stills', 'cortometraje', 'videoclip']
      };
      var refs = {
        raiz:     caja.querySelector('#hudRaiz'),
        cat:      caja.querySelector('#hudCat'),
        cats:     caja.querySelector('#hudCats'),
        cerrar:   caja.querySelector('#hudCerrar'),
        titulo:   caja.querySelector('#hudTitulo'),
        contador: caja.querySelector('#hudContador')
      };
      MovilHud.init(refs, function () {}, function () {});
      try { return fn(refs); } finally { window.Datos = antes; }
    });
  }

  prueba('el título es el del trabajo', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.titulo.textContent;
    }), 'Niebla');
  });

  /* La categoría se enseña con el guion cambiado por un espacio, igual que ya
     hace el escritorio en `VisorFicha.pintar`: `foto-fija` es un
     identificador de URL, no algo que se le enseñe a nadie. */
  prueba('la categoría se lee, no se enseña su identificador', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.cat.textContent;
    }), 'foto stills');
  });

  prueba('el contador dice en qué pieza estás', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.contador.textContent;
    }), '02/03');
  });

  prueba('el desplegable trae las cuatro categorías más «todos»', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.cats.querySelectorAll('button').length;
    }), 5);
  });

  /* Pintar dos veces no acumula: deslizar repinta el HUD en cada parada, y sin
     vaciar el desplegable crecería con cada gesto. */
  prueba('repintar no acumula categorías', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 1, 3);
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      MovilHud.pintar(HUD_PROYECTO, 3, 3);
      return refs.cats.querySelectorAll('button').length;
    }), 5);
  });

  /* Al pintar una parada nueva el HUD se despierta: acabas de moverte, así que
     quieres saber dónde has caído. El plazo vuelve a correr desde cero. */
  prueba('pintar despierta el HUD', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return { visible: MovilHud.visible(),
               clase: refs.raiz.classList.contains('dormido') };
    }), { visible: true, clase: false });
  });
});
```

- [ ] **Paso 2: cargar el módulo y sus pruebas**

En `tests/test.html`, junto a los demás del móvil:

```html
<!-- movil-hud.js no toca el DOM al cargarse: sólo define window.MovilHud.
     `contador` y `OCULTAR_TRAS` se prueban solos; `pintar` e `init`, que sí
     construyen nodos, reciben sus elementos del arnés de DOM.
     Ver pruebas-movil-hud.js. -->
<script src="../js/movil-hud.js"></script>
```

y

```html
<script src="pruebas-movil-hud.js"></script>
```

Corre la suite. Esperado: **11 fallos**, todos con `MovilHud is not defined`.

- [ ] **Paso 3: escribir `js/movil-hud.js`**

```js
window.MovilHud = (function () {

  /* Tres segundos, y no los dos del escritorio (`js/visor-chrome.js`, la
     constante `OCULTAR_TRAS`). Allí el chrome se despierta con cualquier
     movimiento del ratón: gratis y constante. En táctil hay que tocar a
     propósito, así que despertar cuesta más y el plazo se alarga para
     compensar.

     `VisorChrome` no se generaliza para compartir esto, y es una decisión de la
     spec, no un descuido: su despertar está atado a `mouseenter`/`mouseleave`
     sobre la tira de miniaturas, que en móvil no existe. Tocar un módulo que
     funciona en producción para compartir un temporizador de tres líneas es mal
     negocio. Se duplica el temporizador y se escribe el motivo, que es éste. */
  var OCULTAR_TRAS = 3000;

  var refs = null, reloj = null, despierto = false;
  var alElegirCategoria = null, alCerrar = null;

  /* Dos cifras en los dos lados, igual que la rejilla de la portada: `02/08` y
     no `2/8`, para que el ancho no baile al pasar de la 9 a la 10.

     Devuelve cadena vacía en las dos paradas que no son una pieza: la ficha
     —donde `06/05` sería mentir sobre dónde estás— y el vídeo, que tiene cero
     piezas y donde un `00/00` no dice nada y ocupa sitio sobre la foto. */
  function contador(pieza, total) {
    if (typeof pieza !== 'number') return '';
    return dos(pieza) + '/' + dos(total);
  }

  function dos(n) { return (n < 10 ? '0' : '') + n; }

  function init(elementos, alCategoria, alCerrarVisor) {
    refs = elementos;
    alElegirCategoria = alCategoria;
    alCerrar = alCerrarVisor;
    refs.cerrar.addEventListener('click', function () { alCerrar(); });
    refs.cat.addEventListener('click', function () {
      refs.cats.hidden = !refs.cats.hidden;
      refs.cat.setAttribute('aria-expanded', refs.cats.hidden ? 'false' : 'true');
      despertar();
    });
  }

  function pintar(proyecto, pieza, total) {
    refs.titulo.textContent = proyecto.titulo;
    /* El guion cambiado por espacio, igual que ya hace `VisorFicha.pintar`
       (js/visor-ficha.js): `foto-fija` es un identificador de URL y no algo
       que se le enseñe a nadie. */
    refs.cat.textContent = proyecto.categoria.replace('-', ' ');
    refs.contador.textContent = contador(pieza, total);
    pintarCategorias();
    /* Al llegar a una parada nueva el HUD se despierta: acabas de moverte, así
       que quieres saber dónde has caído. El plazo vuelve a correr desde cero. */
    despertar();
  }

  /* Se vacía antes de rellenar: deslizar repinta el HUD en cada parada, y sin
     esto el desplegable crecería con cada gesto. */
  function pintarCategorias() {
    refs.cats.innerHTML = '';
    refs.cats.hidden = true;
    refs.cat.setAttribute('aria-expanded', 'false');
    var todas = ['todos'].concat(window.Datos.CATEGORIAS);
    todas.forEach(function (c) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mvisor-cat-opcion';
      b.textContent = c === 'todos' ? 'todos' : c.replace('-', ' ');
      b.addEventListener('click', function () { alElegirCategoria(c); });
      li.appendChild(b);
      refs.cats.appendChild(li);
    });
  }

  /* El plazo se reinicia entero en cada despertar. `clearTimeout` sobre `null`
     es inofensivo, así que no hace falta guarda. */
  function despertar() {
    despierto = true;
    refs.raiz.classList.remove('dormido');
    refs.raiz.setAttribute('aria-hidden', 'false');
    clearTimeout(reloj);
    reloj = setTimeout(dormir, OCULTAR_TRAS);
  }

  function dormir() {
    despierto = false;
    refs.raiz.classList.add('dormido');
    /* `aria-hidden` y no `hidden`: el HUD dormido sigue ocupando su sitio y se
       va con una transición de opacidad. Con `hidden` desaparecería de golpe y
       la transición no se vería. */
    refs.raiz.setAttribute('aria-hidden', 'true');
    refs.cats.hidden = true;
    refs.cat.setAttribute('aria-expanded', 'false');
  }

  function visible() { return despierto; }

  return {
    OCULTAR_TRAS: OCULTAR_TRAS,
    contador: contador,
    init: init,
    pintar: pintar,
    despertar: despertar,
    visible: visible
  };
})();
```

- [ ] **Paso 4: correr las pruebas y verlas pasar**

Esperado: **400 pasan, 0 fallan** (389 más 11).

- [ ] **Paso 5: el marcado del HUD**

En `index.html`, dentro de `<div class="mvisor" id="movilVisor" ...>` y DESPUÉS
de la escena, añade:

```html
    <!-- Pastillas amarillas con texto negro. Medido en la spec: el amarillo
         suelto sobre una foto clara da 1,07:1 de contraste y el negro suelto
         sobre una foto oscura ~1,2:1 — el mismo fallo cambiado de lado, y como
         las fotos las sube el estudio no se puede apostar por ninguno. La
         pastilla da 17,6:1 pase lo que pase, porque el fondo del texto deja de
         ser la foto.

         Ningún control queda en los ~20px de los bordes laterales: esa franja
         se la queda el gesto de «atrás» del navegador (Safari en el borde
         izquierdo, Chrome en los dos) y no se puede desactivar desde la web.
         Lo impone `.mvisor-hud` en css/luque.css. -->
    <div class="mvisor-hud" id="movilVisorHud" aria-hidden="false">
      <div class="mvisor-hud-arriba">
        <button class="mvisor-cat" id="movilVisorCat" type="button"
                aria-expanded="false" aria-haspopup="true"></button>
        <ul class="mvisor-cats" id="movilVisorCats" hidden></ul>
        <button class="mvisor-cerrar" id="movilVisorCerrar" type="button"
                aria-label="Volver a la portada">&times;</button>
      </div>
      <div class="mvisor-hud-abajo">
        <p class="mvisor-titulo" id="movilVisorTitulo"></p>
        <span class="mvisor-contador" id="movilVisorContador"></span>
      </div>
    </div>
```

Y el `<script>`, junto a los demás del móvil y **antes** de
`js/movil-visor.js`:

```html
  <script src="js/movil-hud.js"></script>
```

- [ ] **Paso 6: cablear el HUD desde el visor**

En `js/movil-visor.js`:

En `init`, después de `orden = ordenDe(proyectos);`, añade:

```js
    window.MovilHud.init({
      raiz:     refs.hud,
      cat:      refs.cat,
      cats:     refs.cats,
      cerrar:   refs.cerrar,
      titulo:   refs.titulo,
      contador: refs.contador
    }, function (categoria) {
      /* Elegir una categoría cierra el visor y deja la portada filtrada: es
         una petición sobre QUÉ trabajos ver, y contestarla sin salir del
         trabajo abierto dejaría la pantalla diciendo una cosa y la URL otra. */
      if (categoria === 'todos') window.Router.ir('todos', null);
      else window.Router.ir('categoria', categoria);
    }, function () {
      window.Router.ir('todos', null);
    });
```

Al final de `pintar()`, añade:

```js
    window.MovilHud.pintar(p, aqui.pieza, p.piezas.length);
```

Y en `soltarEn`, sustituye el comentario provisional de la Tarea 3 por el
despertar de verdad:

```js
    /* El toque despierta el HUD y no navega. Que no navegue es lo que hace
       posible volver a encenderlo sin cambiar de foto. */
    if (r.intencion === 'toque') { window.MovilHud.despertar(); return; }
```

justo antes de la línea `var ruta = siguienteRuta(...)`.

- [ ] **Paso 7: pasar las referencias nuevas en `index.html`**

La llamada a `MovilVisor.init` de la Tarea 1 crece:

```js
    window.MovilVisor.init({
      raiz:     document.getElementById('movilVisor'),
      escena:   document.getElementById('movilVisorEscena'),
      hud:      document.getElementById('movilVisorHud'),
      cat:      document.getElementById('movilVisorCat'),
      cats:     document.getElementById('movilVisorCats'),
      cerrar:   document.getElementById('movilVisorCerrar'),
      titulo:   document.getElementById('movilVisorTitulo'),
      contador: document.getElementById('movilVisorContador')
    }, window.Datos.PROYECTOS);
```

- [ ] **Paso 8: actualizar las pruebas de la Tarea 1 y 2**

`MovilVisor.init` ahora llama a `MovilHud.init`, que necesita sus seis
elementos. Los ayudantes `conVisor`, `conEscena` de las Tareas 1 y 2 tienen que
incluirlos en su marcado y en las refs, o `init` lanzará sobre `undefined`.

Amplía el marcado de los tres ayudantes a:

```js
    '<div><div id="mvRaiz" hidden><div id="mvEscena"></div>' +
    '<div id="mvHud"><button id="mvCat"></button><ul id="mvCats"></ul>' +
    '<button id="mvCerrar"></button><p id="mvTitulo"></p>' +
    '<span id="mvContador"></span></div></div></div>'
```

y sus refs a:

```js
        MovilVisor.init({
          raiz:     caja.querySelector('#mvRaiz'),
          escena:   caja.querySelector('#mvEscena'),
          hud:      caja.querySelector('#mvHud'),
          cat:      caja.querySelector('#mvCat'),
          cats:     caja.querySelector('#mvCats'),
          cerrar:   caja.querySelector('#mvCerrar'),
          titulo:   caja.querySelector('#mvTitulo'),
          contador: caja.querySelector('#mvContador')
        }, proyectos);
```

Los ayudantes que falsean `window.Datos` tienen que añadirle `CATEGORIAS`,
porque `MovilHud.pintar` las lee:

```js
        window.Datos = {
          CATEGORIAS: ['editorial', 'foto-fija', 'cortometraje'],
          porId: function (id) { /* … igual que antes … */ }
        };
```

Y el de la Tarea 1, que no falsea `Datos` porque no pinta escena, ahora sí lo
necesita: `aplicar` llama a `pintar`, y `pintar` llama al HUD.

- [ ] **Paso 9: correr la suite entera**

Esperado: **400 pasan, 0 fallan**. Si alguna de las Tareas 1 y 2 falla con
`Cannot read properties of undefined`, es que a un ayudante le falta una de las
referencias del Paso 8.

- [ ] **Paso 10: comprobar que las pruebas no son de mentira**

Cambia `OCULTAR_TRAS` a `2000` y corre la suite. Esperado: exactamente una
prueba en rojo, la que fija el número. Deshaz el cambio.

Quita `refs.cats.innerHTML = '';` de `pintarCategorias` y corre la suite.
Esperado: la prueba «repintar no acumula categorías» en rojo. Deshaz el cambio.

- [ ] **Paso 11: commit**

```bash
git add js/movil-hud.js tests/pruebas-movil-hud.js tests/pruebas-movil-visor.js \
        tests/test.html js/movil-visor.js index.html
git commit -m "El HUD del visor movil, con su ocultado a los 3 segundos

Pastillas amarillas con texto negro: 17,6:1 de contraste pase lo que pase
con la foto, porque el fondo del texto deja de ser la foto.

Tres segundos y no los dos del escritorio: alli el chrome se despierta con
cualquier movimiento del raton, y en tactil hay que tocar a proposito.
VisorChrome no se generaliza; el motivo esta escrito en el codigo.

Las categorias viven aqui, que es la consecuencia de que la portada lleve
solo el numero.

400 pasan, 0 fallan."
```

---

## Tarea 5: el CSS del visor móvil

**Archivos:**
- Modificar: `css/luque.css` (al final, junto al bloque de la portada móvil)

**Interfaces:**
- Consume: las clases que pintan las Tareas 1 a 4 — `.mvisor`,
  `.mvisor-escena`, `.mvisor-foto`, `.mvisor-video`, `.mvisor-ficha`,
  `.mvisor-ficha-titulo`, `.mvisor-ficha-datos`, `.mvisor-hud`,
  `.mvisor-hud-arriba`, `.mvisor-hud-abajo`, `.mvisor-cat`, `.mvisor-cats`,
  `.mvisor-cat-opcion`, `.mvisor-cerrar`, `.mvisor-titulo`,
  `.mvisor-contador`, y el estado `.dormido`.
- Produce: nada que consuma JavaScript.

### Tres reglas que no son estéticas

**La franja de los bordes.** En Safari de iOS, arrastrar desde el borde
izquierdo hacia dentro vuelve a la página anterior; en Chrome de Android ocurre
en los dos bordes. **No se puede desactivar desde la web.** No es fatal —es con
lo que vive cualquier carrusel— pero obliga a que **ningún control quede en esa
franja**, porque un botón ahí sería imposible de pulsar sin que el navegador se
lleve el gesto. De ahí el `padding` lateral del HUD, que no es margen decorativo.

**`object-fit: contain`.** Es lo que hace que la caja pintada la decida la
proporción de la imagen, y por eso la Tarea 2 impone que la portada y la pieza
compartan proporción. Si esto se cambiara a `cover`, la condición sobre el
contenido dejaría de hacer falta pero se recortarían las fotos del estudio, que
es exactamente lo que un estudio de fotografía no quiere.

**El movimiento reducido.** El sitio ya respeta `prefers-reduced-motion` en el
centrado por teclado de la galería. El HUD que se va con una transición de
opacidad tiene que respetarlo también: con movimiento reducido desaparece sin
transición, no se queda puesto.

- [ ] **Paso 1: escribir el CSS**

Al final de `css/luque.css`, después del bloque de la portada móvil y de las dos
reglas de `touch-action`/`overscroll-behavior` que puso la Tarea 3:

```css
/* ── El visor móvil (bloque 4f) ─────────────────────────────────────────────
   Sólo existe bajo `body.es-movil`. En escritorio el marcado está en el DOM
   pero con `hidden`, igual que la rejilla de la portada: es lo que permite
   cruzar el umbral de ancho sin reconstruir nada. */

.mvisor{ display:none; }

body.es-movil .mvisor{
  display:block;
  position:fixed; inset:0;
  z-index:60;
  background:var(--black);
}

body.es-movil .mvisor[hidden]{ display:none; }

/* La escena ocupa todo, y la foto se centra dentro sin recortarse.
   `object-fit:contain` es lo que hace que la caja pintada la decida la
   proporción de la imagen — de ahí la condición de la Tarea 2 sobre que la
   portada y la pieza compartan proporción. Con `cover` no haría falta esa
   condición, pero se recortarían las fotos del estudio. */
body.es-movil .mvisor-escena{
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
}

body.es-movil .mvisor-foto{
  max-width:100%; max-height:100%;
  object-fit:contain;
  /* La foto no se arrastra ni se selecciona: el dedo que la toca está
     deslizando, y el «arrastrar imagen» del navegador se comería el gesto. */
  -webkit-user-drag:none; user-select:none;
}

body.es-movil .mvisor-video{
  width:100%; aspect-ratio:16/9; border:0;
}

/* La ficha es el fondo del eje vertical, así que ocupa la escena entera y no
   flota encima de nada. */
body.es-movil .mvisor-ficha{
  padding:2rem 1.6rem;
  max-width:34rem;
  color:var(--yellow);
}

body.es-movil .mvisor-ficha-titulo{
  font-size:1.6rem; line-height:1.1; margin:0 0 1.4rem;
}

body.es-movil .mvisor-ficha-datos div{
  display:flex; justify-content:space-between; gap:1rem;
  padding:.55rem 0;
  border-bottom:1px solid rgba(255,255,0,.25);
}

body.es-movil .mvisor-ficha-datos dt{ opacity:.7; }
body.es-movil .mvisor-ficha-datos dd{ margin:0; text-align:right; }

/* ── El HUD ────────────────────────────────────────────────────────────────
   El padding lateral de 24px NO es decorativo. En Safari de iOS, arrastrar
   desde el borde izquierdo hacia dentro vuelve a la página anterior, y en
   Chrome de Android ocurre en los dos bordes; no se puede desactivar desde la
   web. Un control dentro de esa franja de ~20px sería imposible de pulsar sin
   que el navegador se lleve el gesto. Los 24 dan margen sobre los 20. */
body.es-movil .mvisor-hud{
  position:absolute; inset:0;
  padding:1rem 24px;
  display:flex; flex-direction:column; justify-content:space-between;
  /* El HUD no intercepta el dedo: el deslizamiento tiene que pasar a través.
     Los botones lo recuperan uno a uno, más abajo. */
  pointer-events:none;
  opacity:1;
  transition:opacity .35s ease;
}

body.es-movil .mvisor-hud.dormido{ opacity:0; }

body.es-movil .mvisor-hud-arriba,
body.es-movil .mvisor-hud-abajo{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:.6rem;
}

/* Las pastillas: amarillo con texto negro, 17,6:1 de contraste pase lo que
   pase con la foto, porque el fondo del texto deja de ser la foto. Medido en
   la spec: el amarillo suelto sobre foto clara da 1,07:1 y el negro suelto
   sobre foto oscura ~1,2:1 — el mismo fallo cambiado de lado. */
body.es-movil .mvisor-cat,
body.es-movil .mvisor-cerrar,
body.es-movil .mvisor-titulo,
body.es-movil .mvisor-contador,
body.es-movil .mvisor-cat-opcion{
  background:var(--yellow);
  color:var(--black);
  border:0;
  padding:.4rem .8rem;
  font:inherit;
  line-height:1.2;
  margin:0;
}

body.es-movil .mvisor-cat,
body.es-movil .mvisor-cerrar,
body.es-movil .mvisor-cat-opcion{
  pointer-events:auto;
  cursor:pointer;
}

body.es-movil .mvisor-cerrar{
  font-size:1.3rem; line-height:1; padding:.35rem .7rem;
}

body.es-movil .mvisor-cats{
  position:absolute; top:3rem; left:24px;
  list-style:none; margin:0; padding:0;
  display:flex; flex-direction:column; gap:.3rem;
  pointer-events:auto;
}

body.es-movil .mvisor-cats[hidden]{ display:none; }

body.es-movil .mvisor-titulo{ max-width:70%; }

body.es-movil .mvisor :focus-visible{
  outline:2px solid var(--yellow); outline-offset:4px;
}

/* Con movimiento reducido el HUD desaparece sin transición en vez de quedarse
   puesto: lo que se pide es menos movimiento, no menos función. Es la misma
   regla que el sitio ya aplica al centrado por teclado de la galería. */
@media (prefers-reduced-motion: reduce){
  body.es-movil .mvisor-hud{ transition:none; }
}
```

- [ ] **Paso 2: correr la suite**

Esperado: **400 pasan, 0 fallan**. El CSS no debería mover ninguna prueba; si
alguna cambia, es que una regla nueva pisa al escritorio y hay que acotarla con
`body.es-movil`.

- [ ] **Paso 3: comprobar que el escritorio no se ha movido**

Sirve el sitio, ábrelo en una ventana de más de 860px y comprueba a ojo la
portada, la galería con su paneo, y el visor de escritorio con su tira y su
lupa. Todas las reglas nuevas van bajo `body.es-movil`, así que no debería
cambiar nada; esto es la comprobación de que efectivamente es así.

- [ ] **Paso 4: el auditor de rutas**

```
python tests/auditar_rutas.py
```

Esperado: OK. Ninguna regla nueva referencia un recurso externo —está prohibido
por las restricciones globales, porque bajo `file://` el navegador los bloquea—
pero el auditor es quien lo confirma.

- [ ] **Paso 5: commit**

```bash
git add css/luque.css
git commit -m "El CSS del visor movil

Todo bajo body.es-movil, asi que el escritorio no se mueve.

El padding lateral de 24px del HUD no es decorativo: la franja de ~20px de
los bordes se la queda el gesto de atras del navegador —Safari en el
izquierdo, Chrome en los dos— y no se puede desactivar desde la web, asi
que ningun control puede quedar ahi.

object-fit contain es lo que hace que la caja la decida la proporcion de la
imagen, y por eso la portada y la pieza tienen que compartirla."
```

---

## Tarea 6: `docs/estado-conocido.md`

**Archivos:**
- Modificar: `docs/estado-conocido.md`

**Interfaces:** ninguna. Es la tarea que impide que el documento quede mintiendo.

### Qué deja de ser cierto al terminar este bloque

Estas frases del documento **serán falsas** en cuanto se fusione, y corregirlas
es el entregable de esta tarea. Es el fallo característico de este proyecto —una
frase que el código contradice— y ya ha pasado dos veces con este mismo párrafo:

1. **«Los TRES módulos puros del bloque 4c siguen sin cablear»**. Al terminar,
   `MovilRecorrido` y `MovilGestos` sí lo están; **`Brillo` sigue sin
   consumidor**, y hay que decir por qué: sus esquinas adaptativas son del
   bloque 4g, y la spec ya explica que hoy no pueden funcionar con `picsum`
   porque ningún `<img>` del sitio pide la foto en modo CORS.

2. **«El visor de la portada móvil sigue siendo el de escritorio»** y **«la
   mitad de la experiencia móvil es la de escritorio encogida»**. Dejan de
   serlo. Hay que decir además que **el visor de escritorio sigue vivo e
   intacto** detrás de la guarda de lado, y dónde están las dos mitades de esa
   guarda.

3. El recuento de comprobaciones: **362 → 400**, la línea del `grep -c
   "prueba("`, y la lista de qué cubre cada archivo.

- [ ] **Paso 1: corregir las tres frases falsas**

Reescribe el párrafo de los módulos sin cablear para que diga qué quedó
cableado, qué no, y por qué. Reescribe la sección de la portada móvil para que
diga que el visor móvil ya existe.

- [ ] **Paso 2: añadir la sección del bloque**

Añade una sección nueva, antes de «Cómo se prueba», con:

- **La guarda de lado**, sus dos mitades (el suscriptor de `Visor.init` y
  `MovilVisor.aplicar`) y por qué `Movil.actual()` ya tiene valor cuando corren:
  `Movil.init` va antes de `Router.init` en `index.html`, y `Router.init` avisa
  de forma síncrona. Es la misma dependencia de orden de `js/visor-origen.js`.
- **Por qué no se reutiliza `VisorCarga`** en la escena móvil, y qué fallo
  concreto evita (girar una tableta con el visor abierto).
- **La condición sobre el contenido**: portada y pieza en la misma proporción,
  y qué pasa si no la comparten.
- **Las dos cosas del sistema operativo**: la franja de los bordes que se queda
  el navegador, y el `overscroll-behavior-y: contain`.

- [ ] **Paso 3: escribir lo que la suite NO puede certificar**

Es la parte que más vale de esta tarea. Copiado de la spec, sección «Lo que sólo
puede juzgar el estudio, en un móvil real»: **el tacto de los gestos, si 3
segundos es el plazo correcto, si el ocultado se siente elegante o se siente
como que la web se apaga sola.** Ninguna prueba puede decirlo.

Y añade, porque es propio de este bloque:

- **La franja de los bordes hay que probarla en un iPhone de verdad.** En un
  navegador de escritorio encogido no ocurre, y daríamos por bueno algo que
  falla en el dispositivo real.
- **Girar el móvil dentro del visor** debe conservar la posición: mismo
  proyecto, misma foto. En un teléfono de 390×844 girar no cruza el umbral de
  860px, así que no se reconstruye nada; en una tableta sí puede cruzarlo, y ahí
  está sin comprobar.

- [ ] **Paso 4: actualizar los recuentos**

Corre la suite y copia el número que imprime al pie. Actualiza también la línea
del `grep -c "prueba("`, contando las coincidencias que no llegan a ejecutarse:

```bash
grep -rc "prueba(" tests/*.js | awk -F: '{s+=$2} END {print s}'
```

- [ ] **Paso 5: commit**

```bash
git add docs/estado-conocido.md
git commit -m "Registrar el bloque 4f en el estado conocido

Tres frases dejan de ser ciertas al fusionar: los modulos sin cablear ya no
son tres sino uno, y el visor movil ya no es el de escritorio encogido.

Queda escrito lo que la suite no puede certificar: el tacto de los gestos,
si tres segundos es el plazo correcto, y la franja de los bordes, que en un
navegador de escritorio encogido no ocurre y hay que probar en un iPhone."
```

---

## Comprobación final de la rama

Antes de dar el bloque por terminado, y **sobre el árbol que se va a fusionar**:

```bash
python tests/auditar_rutas.py
node tests/prueba-borrador.js
wc -l js/movil-visor.js js/movil-hud.js
git diff main --unified=0 -- js/ | grep "^+" | awk 'length>91'
```

Esperado: auditor OK; 52/0 en Node; los dos módulos por debajo de 300 líneas; y
la última orden sin salida.

Y la suite del navegador con la orden de las restricciones globales:
**400 pasan, 0 fallan**.

## Lo que hace falta pedirle a Ángel al terminar

Este bloque **no se puede cerrar sin un teléfono real**. La lista, para que la
comprobación no sea «mira a ver si va»:

1. Que deslizar a los lados cambie de trabajo y arriba/abajo baje por las fotos.
2. Que en un proyecto de vídeo bajar llegue a la ficha en **un** gesto.
3. Que un arrastre corto o en diagonal **no** haga nada.
4. Que el HUD se vaya solo y un toque lo devuelva. **Y si 3 segundos es el
   plazo correcto**, que es lo que sólo se puede decir mirándolo.
5. Que el deslizamiento **desde el borde izquierdo** no se lo quede el
   navegador de forma que rompa el recorrido. **En un iPhone**, no en una
   ventana encogida.
6. Que tirar hacia abajo desde arriba **no recargue** la página.
7. Que la foto aparezca **al instante** al entrar en un trabajo, y que el cambio
   a la calidad máxima no se note.
8. Que girar el teléfono dentro del visor conserve el trabajo y la foto.
9. Que el botón de cerrar y la pastilla de categorías se puedan pulsar sin que
   el navegador se lleve el gesto.

