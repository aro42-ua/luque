# La portada móvil (bloque 4d) — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendada) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los
> pasos usan casillas (`- [ ]`) para llevar la cuenta.

**Objetivo:** que un móvil de 390px enseñe la portada real —una rejilla
irregular de dos columnas con los 12 trabajos numerados, y el amarillo con
LUQUE! encima que se va al deslizar hacia arriba— en vez del lienzo espacial de
escritorio encogido.

**Arquitectura:** dos módulos nuevos y un arranque bifurcado. `js/movil.js` es
el interruptor: mira una consulta de medios que recibe como argumento —no la
construye— y llama a un lado o a otro. `js/movil-hoja.js` pinta la rejilla y
gobierna el hero fundido. El escritorio no se toca: `galeria*.js` y `visor*.js`
quedan intactos, `index.html` construye las dos portadas y el CSS decide cuál se
ve. Tocar un trabajo llama a `Router.ir('proyecto', id)`, así que **hasta el
bloque 4e el visor que se abre sigue siendo el de escritorio**; la URL ya es la
correcta y 4e lo sustituye sin cambiar este cableado.

**Tecnologías:** HTML, CSS y JavaScript ES5 escritos a mano. Sin framework, sin
compilación, sin gestor de paquetes, sin dependencias. Las pruebas corren en
`tests/test.html` sobre `tests/arnes.js` y `tests/arnes-dom.js`.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md` — paso 4 de su
sección «Sobre el tamaño de esto» («lo que pinta: hoja, visor, hero fundido»),
**partido a propósito: aquí van la hoja y el hero fundido; el visor es el bloque
4e.** La partición la decidió Ángel el 2026-09-01 para tener un resultado
visible antes de construir lo caro.

**Estado de partida:** 4a (arnés de DOM), 4b (segundo tramo del router) y 4c
(módulos puros `movil-recorrido.js`, `movil-gestos.js`, `brillo.js`) están
fusionados en `main` (`6c50ab9`). La suite da **271 comprobaciones en verde**.
Ninguno de los tres módulos de 4c está cableado todavía; este bloque cablea el
primero de ellos, `MovilGestos`.

## Restricciones globales

Valen para todas las tareas, aunque la tarea no las repita.

- **Nada de credenciales en el repositorio.** Ni claves, ni tokens, ni cuentas.
- **ES5 estricto**, con el patrón que usa el resto de `js/`:
  `window.Nombre = (function () { … }())`. Nada de `let`, `const`, flechas,
  plantillas ni clases en los archivos nuevos.
- **Techo de 300 líneas por archivo.**
- **El escritorio no se toca:** `js/galeria.js`, `js/galeria-paneo.js`,
  `js/galeria-teclado.js`, `js/composicion.js` y todos los `js/visor*.js`
  quedan como están, salvo la única adición que la Tarea 5 autoriza por su
  nombre (`Galeria.remedir`).
- **El interruptor es el ancho, no el dedo:** `(max-width: 860px)`, literal.
  Una ventana de escritorio estrechada a 700px se lleva la portada móvil, con
  ratón y teclado y sin pantalla táctil. Todo lo que sólo se pueda hacer
  deslizando el dedo deja fuera a esa ventana.
- **Las piezas se numeran desde 1.**
- **`overscroll-behavior-y: contain`** en el contenedor desplazable, obligatorio:
  sin él, tirar hacia abajo recarga la página en Chrome de Android.
- **Ningún control en los ~20px de los bordes laterales:** esa franja se la
  queda el navegador para su gesto de «atrás».
- **Todo en castellano**, código y comentarios incluidos, como el resto del
  repositorio.
- **La suite parte de 271 en verde y no puede bajar de ahí.** Se corre con
  `python -m http.server` y abriendo `/tests/test.html`; el recuento sale al
  final de la página.
- **Ni una afirmación sin medir.** Este es el defecto que este proyecto ha
  cazado cuatro rondas seguidas: escribir en un comentario o en la
  documentación algo más fuerte de lo que se comprobó. Si escribes «no aparece
  en ningún sitio», el grep que lo demuestra va sin `grep -v` y sobre el
  repositorio entero.

---

## Estructura de archivos

| Archivo | De qué responde |
|---|---|
| `js/movil.js` **(nuevo)** | El interruptor. Decide el lado por una consulta de medios **que recibe como argumento** y avisa al cruzar. Cero DOM: no toca `document` ni una vez. |
| `js/movil-hoja.js` **(nuevo)** | La portada móvil: numeración, proporciones de la rejilla, pintado, filtrado por categoría y el hero fundido. |
| `js/hero.js` **(modificado, Tarea 5)** | Gana un argumento opcional en `init` para que el móvil pueda quedarse con la retirada del preloader sin duplicar sus tiempos. |
| `js/galeria.js` **(modificado, Tarea 5)** | Gana `remedir()`, tres líneas, para que el lienzo se vuelva a medir al cruzar el umbral de ancho. |
| `index.html` **(modificado, Tareas 5)** | El marcado de la hoja, los tres `<script>` nuevos y el arranque bifurcado. |
| `css/luque.css` **(modificado, Tareas 5 y 6)** | T5 sólo esconde la hoja en escritorio; T6 le da su aspecto en móvil. |
| `tests/pruebas-movil.js` **(nuevo)** | El interruptor. Sin navegador que redimensionar: la consulta se falsifica. |
| `tests/pruebas-movil-hoja.js` **(nuevo)** | La rejilla y el hero, con `ArnesDom.conElemento`. |
| `tests/test.html` **(modificado)** | Registra los módulos y las pruebas nuevas. |
| `docs/estado-conocido.md` **(modificado, Tarea 7)** | Lo que queda sin verificar y lo que el móvil real dijo. |

**Por qué `movil.js` no toca el DOM:** para que se pueda probar de verdad. Es
el mismo motivo por el que `Brillo.decidir` recibe `medir` como argumento en vez
de medir él —`js/brillo.js`—: lo que se inyecta se puede falsificar, y lo que se
puede falsificar se puede comprobar. Una consulta de medios real necesitaría
redimensionar la ventana desde una prueba, que no se puede.

---

### Tarea 1: `js/movil.js` — el interruptor

**Archivos:**
- Crear: `js/movil.js`
- Crear: `tests/pruebas-movil.js`
- Modificar: `tests/test.html` (dos líneas de registro)

**Interfaces:**
- Consume: nada. Este módulo no depende de ningún otro.
- Produce, y las tareas 5 y 6 dependen de estos nombres exactos:
  - `Movil.CONSULTA` → la cadena `'(max-width: 860px)'`
  - `Movil.lado(coincide)` → `'movil'` si `coincide` es cierto, `'escritorio'` si no
  - `Movil.cruza(anterior, nuevo)` → booleano
  - `Movil.init(consulta, lados)` → `undefined`. `consulta` es un objeto con
    `.matches` (booleano) y `.addEventListener('change', fn)`; en producción,
    `window.matchMedia(Movil.CONSULTA)`. `lados` es `{movil: fn, escritorio: fn}`.
  - `Movil.actual()` → `'movil'` | `'escritorio'` | `null` (antes de `init`)

- [ ] **Paso 1: escribir las pruebas que fallan**

Crea `tests/pruebas-movil.js` con esto tal cual:

```js
/* El interruptor de ancho. No toca el DOM a propósito, así que esto no
   necesita el arnés de DOM: la consulta de medios se falsifica y se dispara a
   mano, que es la única forma de comprobar un cruce sin poder redimensionar
   la ventana desde una prueba. */
describe('Movil — el interruptor', function () {

  /* Una consulta de medios de mentira, con la misma superficie que la de
     verdad: `.matches` y `addEventListener('change', fn)`. `emitir` es lo que
     `window.matchMedia` haría al cambiar el ancho de la ventana. */
  function consultaFalsa(coincideAlPrincipio) {
    var oyentes = [];
    return {
      matches: coincideAlPrincipio,
      addEventListener: function (nombre, fn) {
        if (nombre === 'change') oyentes.push(fn);
      },
      emitir: function (coincide) {
        this.matches = coincide;
        oyentes.forEach(function (fn) { fn({ matches: coincide }); });
      },
      cuantosOyentes: function () { return oyentes.length; }
    };
  }

  function contador() {
    var c = { movil: 0, escritorio: 0 };
    c.lados = {
      movil: function () { c.movil++; },
      escritorio: function () { c.escritorio++; }
    };
    return c;
  }

  prueba('la consulta es exactamente la que dice la spec', function () {
    igual(Movil.CONSULTA, '(max-width: 860px)');
  });

  prueba('lado() traduce el booleano de la consulta', function () {
    igual([Movil.lado(true), Movil.lado(false)], ['movil', 'escritorio']);
  });

  prueba('cruza() sólo es cierto cuando el lado cambia', function () {
    igual([Movil.cruza('movil', 'escritorio'),
           Movil.cruza('movil', 'movil'),
           Movil.cruza('escritorio', 'escritorio')], [true, false, false]);
  });

  prueba('init llama al lado que toca, y sólo a ese', function () {
    var c = contador();
    Movil.init(consultaFalsa(true), c.lados);
    igual([c.movil, c.escritorio], [1, 0]);
  });

  prueba('init arrancando ancho llama al escritorio', function () {
    var c = contador();
    Movil.init(consultaFalsa(false), c.lados);
    igual([c.movil, c.escritorio], [0, 1]);
  });

  prueba('cruzar el umbral llama al otro lado', function () {
    var c = contador(), q = consultaFalsa(false);
    Movil.init(q, c.lados);
    q.emitir(true);
    igual([c.movil, c.escritorio], [1, 1]);
  });

  /* La razón de ser de `cruza`: un `change` que no cambia de lado no puede
     repintar, porque repintar perdería la posición del recorrido — que es
     justo lo que la spec pide conservar al girar el móvil. */
  prueba('un change que no cambia de lado no llama a nadie', function () {
    var c = contador(), q = consultaFalsa(true);
    Movil.init(q, c.lados);
    q.emitir(true);
    igual([c.movil, c.escritorio], [1, 0]);
  });

  prueba('ir y volver llama a cada lado las veces que toca', function () {
    var c = contador(), q = consultaFalsa(true);
    Movil.init(q, c.lados);
    q.emitir(false);
    q.emitir(true);
    igual([c.movil, c.escritorio], [2, 1]);
  });

  prueba('actual() dice de qué lado estamos', function () {
    var q = consultaFalsa(true);
    Movil.init(q, contador().lados);
    var alPrincipio = Movil.actual();
    q.emitir(false);
    igual([alPrincipio, Movil.actual()], ['movil', 'escritorio']);
  });

  /* Un lado sin función no es un error: la Tarea 5 podría querer cablear sólo
     uno. Lo que no puede es tirar la sesión abajo. */
  prueba('un lado sin función no lanza', function () {
    var q = consultaFalsa(true);
    Movil.init(q, {});
    q.emitir(false);
    cierto(true);
  });

  prueba('init se suscribe una sola vez', function () {
    var q = consultaFalsa(true);
    Movil.init(q, contador().lados);
    igual(q.cuantosOyentes(), 1);
  });
});
```

- [ ] **Paso 2: registrar las pruebas y comprobar que fallan**

En `tests/test.html`, añade el módulo junto a los otros `js/` (después de la
línea de `../js/brillo.js`) y las pruebas junto a las otras (después de la línea
de `pruebas-brillo.js`):

```html
<script src="../js/movil.js"></script>
```
```html
<script src="pruebas-movil.js"></script>
```

Arranca `python -m http.server` desde la raíz del repositorio y abre
`http://localhost:8000/tests/test.html`.
Esperado: la sección «Movil — el interruptor» en rojo, con `Movil is not
defined` o equivalente. En números: **las 271 pasadas se mantienen y aparecen
11 nuevas en rojo**, para un total de 282 registradas. Las pasadas no bajan de
271, porque ninguna prueba anterior depende de `Movil`.

**Cuidado con la caché:** `python -m http.server` no manda `Cache-Control`.
Si ves resultados que no cuadran con lo que acabas de escribir, recarga con
Ctrl+Shift+R. A este proyecto ya le ha pasado tres veces.

- [ ] **Paso 3: escribir el módulo**

Crea `js/movil.js`:

```js
window.Movil = (function () {

  /* El interruptor es el ANCHO y no el dedo. Una ventana de escritorio
     estrechada a 700px tampoco puede alojar un lienzo de 120vw: el problema es
     el espacio, no el puntero. El tipo de puntero decide otra cosa —qué gestos
     se enganchan— y eso no se mira aquí. Consecuencia que hay que tener
     presente aguas abajo: por esta consulta pasa un escritorio con ratón y
     teclado y sin pantalla táctil. */
  var CONSULTA = '(max-width: 860px)';

  var actual = null;

  function lado(coincide) { return coincide ? 'movil' : 'escritorio'; }

  /* Sólo hay cruce cuando el lado cambia de verdad. Sin esta comprobación,
     cualquier `change` repintaría, y repintar cuesta la posición del recorrido
     —lo que la spec pide conservar al girar el móvil— a cambio de nada. */
  function cruza(anterior, nuevo) { return anterior !== nuevo; }

  function llamar(lados) {
    var fn = lados[actual];
    /* Un lado sin función es legítimo: quien cablea puede querer sólo uno. Lo
       que no puede es que la falta tire abajo el interruptor entero. */
    if (fn) fn();
  }

  /* `consulta` se recibe y no se construye aquí, por el mismo motivo por el
     que `Brillo.decidir` recibe `medir` (js/brillo.js): lo que se inyecta se
     puede falsificar, y lo que se puede falsificar se puede probar. Una
     `window.matchMedia` de verdad exigiría redimensionar la ventana desde una
     prueba, que no se puede hacer. En producción se le pasa
     `window.matchMedia(Movil.CONSULTA)`. */
  function init(consulta, lados) {
    actual = lado(consulta.matches);
    llamar(lados);
    consulta.addEventListener('change', function (e) {
      var nuevo = lado(e.matches);
      if (!cruza(actual, nuevo)) return;
      actual = nuevo;
      llamar(lados);
    });
  }

  return {
    CONSULTA: CONSULTA,
    lado: lado,
    cruza: cruza,
    init: init,
    actual: function () { return actual; }
  };
})();
```

- [ ] **Paso 4: comprobar que pasan**

Recarga `tests/test.html` con Ctrl+Shift+R.
Esperado: las 11 comprobaciones de «Movil — el interruptor» en verde y el total
en **282**, sin ninguna en rojo.

- [ ] **Paso 5: comprobar que las pruebas no son de mentira**

Rompe el módulo a propósito, una cosa cada vez, y anota cuántas se ponen en
rojo. Copia `js/movil.js` a un archivo aparte antes de tocarlo y déjalo como
estaba al terminar — **no dejes el módulo roto**.

1. Cambia `'(max-width: 860px)'` por `'(max-width: 760px)'` → tiene que caer al
   menos «la consulta es exactamente la que dice la spec».
2. Cambia `return anterior !== nuevo;` por `return true;` → tienen que caer al
   menos «cruza() sólo es cierto cuando el lado cambia» y «un change que no
   cambia de lado no llama a nadie».
3. Cambia `coincide ? 'movil' : 'escritorio'` por `coincide ? 'escritorio' :
   'movil'` → tienen que caer varias.

Si alguna mutación deja la suite entera en verde, la prueba que faltaba se
escribe antes de seguir. Si crees que una mutación es equivalente —que no puede
cambiar el comportamiento—, **escribe por qué en el informe con el razonamiento
completo, no la borres en silencio.**

- [ ] **Paso 6: commit**

```bash
git add js/movil.js tests/pruebas-movil.js tests/test.html
git commit -m "Anadir el interruptor de ancho, con la consulta inyectada"
```

---

### Tarea 2: `js/movil-hoja.js` — la rejilla numerada

**Archivos:**
- Crear: `js/movil-hoja.js`
- Crear: `tests/pruebas-movil-hoja.js`
- Modificar: `tests/test.html` (dos líneas de registro)

**Interfaces:**
- Consume: nada todavía. La Tarea 4 le añadirá `MovilGestos` y `Hero`.
- Produce, y las tareas 3, 4, 5 y 6 dependen de estos nombres exactos:
  - `MovilHoja.PROPORCIONES` → `[1.25, 1, 1.5, 1, 1.5, 1.25]`
  - `MovilHoja.proporcion(indice)` → número
  - `MovilHoja.numero(indice)` → cadena de dos cifras: `'01'` … `'12'`
  - `MovilHoja.pintar(contenedor, proyectos, alAbrir)` → `undefined`.
    `contenedor` es el `<ol id="hojaRejilla">`; `proyectos` es
    `Datos.PROYECTOS` **entero**, sin filtrar; `alAbrir` recibe el `id` del
    proyecto tocado.

**Lo que el marcado tiene que producir**, porque la Tarea 6 escribe el CSS
contra estas clases exactas:

```html
<li class="hoja-celda" data-id="niebla" data-cat="foto-stills" style="--proporcion:1.25">
  <button type="button" class="hoja-boton" aria-label="Abrir el proyecto Niebla">
    <img src="…" alt="" loading="lazy" decoding="async">
    <span class="hoja-numero" aria-hidden="true">01</span>
  </button>
</li>
```

Tres detalles del marcado que no son estéticos:

1. **El número es hermano de la imagen, no hijo.** Si fuera hijo desaparecería
   con ella, y la spec pide que una foto que no carga deje «su marco con su
   número»: un hueco numerado se lee como «falta esa», no como «la web está
   rota».
2. **El número lleva `aria-hidden`.** El nombre accesible del botón ya es
   `aria-label`; leer además «cero uno» sería ruido.
3. **`--proporcion` va en el `<li>` y no en el `<button>`,** porque la Tarea 6
   lo usa para el `aspect-ratio` y quien filtra (Tarea 3) esconde el `<li>`.

- [ ] **Paso 1: escribir las pruebas que fallan**

Crea `tests/pruebas-movil-hoja.js` con esto tal cual:

```js
/* La portada móvil. Toca el DOM, así que va sobre `ArnesDom.conElemento`: el
   contenedor vive dentro del documento —fuera de la pantalla, no con
   display:none— para que medir y enfocar funcionen de verdad. */
describe('MovilHoja — la rejilla', function () {

  /* Cuatro proyectos y no doce: bastan para comprobar el ciclo de
     proporciones, dos categorías y el aviso al tocar, y una lista corta se lee
     de un vistazo cuando una prueba se pone en rojo. */
  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'foto-stills',
        portadaUrl: 'x-niebla.jpg' },
      { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial',
        portadaUrl: 'x-bruma.jpg' },
      { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'editorial',
        portadaUrl: 'x-oleaje.jpg' },
      { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip',
        portadaUrl: 'x-reflejo.jpg' }
    ];
  }

  function enUnaRejilla(fn, alAbrir) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), alAbrir || function () {});
      return fn(ol);
    });
  }

  prueba('pinta una celda por proyecto', function () {
    igual(enUnaRejilla(function (ol) {
      return ol.querySelectorAll('li.hoja-celda').length;
    }), 4);
  });

  prueba('cada celda guarda su id y su categoría', function () {
    igual(enUnaRejilla(function (ol) {
      var c = ol.querySelectorAll('li.hoja-celda');
      return [c[0].dataset.id, c[0].dataset.cat, c[3].dataset.id];
    }), ['niebla', 'foto-stills', 'reflejo']);
  });

  prueba('los números van desde 01 y con dos cifras', function () {
    igual(enUnaRejilla(function (ol) {
      var n = ol.querySelectorAll('.hoja-numero');
      return [n[0].textContent, n[3].textContent];
    }), ['01', '04']);
  });

  /* El salto de 09 a 10 no cabe con cuatro proyectos, y es el caso que
     importa: se prueba sobre la función pura. */
  prueba('numero() rellena hasta 09 y deja de rellenar en 10', function () {
    igual([MovilHoja.numero(0), MovilHoja.numero(8),
           MovilHoja.numero(9), MovilHoja.numero(11)],
          ['01', '09', '10', '12']);
  });

  prueba('las proporciones son un ciclo fijo, no un azar', function () {
    var largo = MovilHoja.PROPORCIONES.length;
    igual([MovilHoja.proporcion(0), MovilHoja.proporcion(largo),
           MovilHoja.proporcion(largo + 1)],
          [MovilHoja.PROPORCIONES[0], MovilHoja.PROPORCIONES[0],
           MovilHoja.PROPORCIONES[1]]);
  });

  /* Dos pintados seguidos tienen que dar lo mismo. Si alguien mete un
     Math.random() en las proporciones, la portada cambiaría entre dos cargas y
     nadie podría decir «la tercera de la izquierda» en una revisión. */
  prueba('dos pintados dan exactamente la misma rejilla', function () {
    var a = enUnaRejilla(function (ol) { return ol.innerHTML; });
    var b = enUnaRejilla(function (ol) { return ol.innerHTML; });
    igual(a, b);
  });

  prueba('la proporción va en el li, como variable CSS', function () {
    igual(enUnaRejilla(function (ol) {
      return ol.querySelector('li.hoja-celda')
               .style.getPropertyValue('--proporcion').trim();
    }), String(MovilHoja.PROPORCIONES[0]));
  });

  prueba('la imagen sale de portadaUrl y es perezosa', function () {
    igual(enUnaRejilla(function (ol) {
      var img = ol.querySelector('.hoja-boton img');
      return [img.getAttribute('src'), img.getAttribute('loading'),
              img.getAttribute('alt')];
    }), ['x-niebla.jpg', 'lazy', '']);
  });

  /* El nombre accesible lo pone el botón; el número es decoración. Sin el
     aria-hidden, un lector de pantalla diría «cero uno» antes de cada
     trabajo. */
  prueba('el botón se nombra con el título y el número no se lee', function () {
    igual(enUnaRejilla(function (ol) {
      var b = ol.querySelector('.hoja-boton');
      return [b.getAttribute('aria-label'),
              ol.querySelector('.hoja-numero').getAttribute('aria-hidden')];
    }), ['Abrir el proyecto Niebla', 'true']);
  });

  /* Hermano y no hijo: es lo que hace que el número sobreviva a la foto que no
     carga. La Tarea 3 comprueba el efecto; esto fija la causa, que es lo que
     un refactor podría deshacer sin enterarse. */
  prueba('el número es hermano de la imagen, no hijo', function () {
    cierto(enUnaRejilla(function (ol) {
      var num = ol.querySelector('.hoja-numero');
      return num.parentNode.classList.contains('hoja-boton') &&
             num.querySelector('img') === null;
    }), 'el número tiene que colgar del botón, al lado de la imagen');
  });

  prueba('tocar un trabajo avisa con su id', function () {
    var vistos = [];
    enUnaRejilla(function (ol) {
      ol.querySelectorAll('.hoja-boton')[2].click();
      return null;
    }, function (id) { vistos.push(id); });
    igual(vistos, ['oleaje']);
  });

  /* Pintar dos veces sobre el mismo contenedor no puede acumular. El caso
     llega solo: la Tarea 5 pinta al arrancar y nada impide otra llamada. */
  prueba('pintar dos veces no acumula celdas', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), function () {});
      MovilHoja.pintar(ol, proyectos(), function () {});
      return ol.querySelectorAll('li.hoja-celda').length;
    }), 4);
  });

  prueba('una lista vacía deja la rejilla vacía y no lanza', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, [], function () {});
      return ol.children.length;
    }), 0);
  });
});
```

- [ ] **Paso 2: registrar las pruebas y comprobar que fallan**

En `tests/test.html`, después de la línea de `../js/movil.js`:

```html
<script src="../js/movil-hoja.js"></script>
```

y después de la línea de `pruebas-movil.js`:

```html
<script src="pruebas-movil-hoja.js"></script>
```

Recarga con Ctrl+Shift+R.
Esperado: la sección «MovilHoja — la rejilla» en rojo con `MovilHoja is not
defined`. En números: **las 282 pasadas se mantienen y aparecen 13 nuevas en
rojo**, para un total de 295 registradas. Las pasadas no bajan de 282, porque
ninguna prueba anterior depende de `MovilHoja`; si alguna baja, has roto algo
que ya funcionaba y eso hay que mirarlo antes de seguir.

- [ ] **Paso 3: escribir el módulo**

Crea `js/movil-hoja.js`:

```js
window.MovilHoja = (function () {

  /* Las proporciones de la rejilla —alto = ancho x proporción—, en ciclo fijo
     y NO al azar. Dos motivos, y ninguno es estético: una portada que cambia
     entre dos cargas impide decir «la tercera de la izquierda» en una
     revisión, y un azar en el pintado haría que una prueba de igualdad fallara
     una vez de cada tantas sin que nadie sepa por qué. Irregular no quiere
     decir impredecible. */
  var PROPORCIONES = [1.25, 1, 1.5, 1, 1.5, 1.25];

  function proporcion(indice) {
    return PROPORCIONES[indice % PROPORCIONES.length];
  }

  /* Dos cifras, desde 01. El número identifica el TRABAJO y no su sitio en
     pantalla: sale del índice en la lista COMPLETA, así que filtrar por
     categoría no lo cambia. Quien llame a `pintar` con una lista ya filtrada
     rompe esa promesa sin que nada avise. */
  function numero(indice) {
    var n = indice + 1;
    return (n < 10 ? '0' : '') + n;
  }

  function celdaDe(p, indice, alAbrir) {
    var celda = document.createElement('li');
    celda.className = 'hoja-celda';
    celda.dataset.id = p.id;
    celda.dataset.cat = p.categoria;
    celda.style.setProperty('--proporcion', proporcion(indice));

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'hoja-boton';
    boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

    var img = document.createElement('img');
    /* `portadaUrl` y no `portada`: lo resuelve `Datos.establecer`
       (js/datos.js), que ya elige el póster en los proyectos de vídeo. */
    img.src = p.portadaUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    /* El número cuelga del BOTÓN, al lado de la imagen y no dentro: es lo que
       hace que sobreviva a una foto que no carga. */
    var num = document.createElement('span');
    num.className = 'hoja-numero';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = numero(indice);

    boton.appendChild(img);
    boton.appendChild(num);
    celda.appendChild(boton);

    boton.addEventListener('click', function () { alAbrir(p.id); });
    return celda;
  }

  /* `proyectos` es la lista COMPLETA, sin filtrar. El filtrado es cosa de
     `filtrar()`, que esconde en vez de repintar justamente para no renumerar. */
  function pintar(contenedor, proyectos, alAbrir) {
    contenedor.innerHTML = '';
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(celdaDe(p, i, alAbrir));
    });
  }

  return {
    PROPORCIONES: PROPORCIONES,
    proporcion: proporcion,
    numero: numero,
    pintar: pintar
  };
})();
```

- [ ] **Paso 4: comprobar que pasan**

Recarga con Ctrl+Shift+R.
Esperado: las 13 comprobaciones de «MovilHoja — la rejilla» en verde y el total
en **295**, sin ninguna en rojo.

- [ ] **Paso 5: comprobar que las pruebas no son de mentira**

Sobre una copia del módulo, una mutación cada vez, devolviéndolo a su sitio al
terminar:

1. `numero`: cambia `indice + 1` por `indice` → tienen que caer «los números van
   desde 01…» y «numero() rellena hasta 09…».
2. `numero`: quita el relleno (`return '' + n;`) → tiene que caer al menos una.
3. `proporcion`: cambia `indice % PROPORCIONES.length` por `0` → tiene que caer
   «las proporciones son un ciclo fijo…».
4. `celdaDe`: quita `boton.appendChild(num)` → tienen que caer varias.
5. `pintar`: quita `contenedor.innerHTML = '';` → tiene que caer «pintar dos
   veces no acumula celdas».

Cualquier mutación que deje la suite entera en verde exige una prueba nueva, o
un razonamiento escrito de por qué es equivalente. **No borres la mutación en
silencio.**

- [ ] **Paso 6: commit**

```bash
git add js/movil-hoja.js tests/pruebas-movil-hoja.js tests/test.html
git commit -m "Anadir la rejilla numerada de la portada movil"
```

---

### Tarea 3: el filtrado por categoría y la foto que no carga

**Archivos:**
- Modificar: `js/movil-hoja.js` (dos funciones nuevas y una línea dentro de `celdaDe`)
- Modificar: `tests/pruebas-movil-hoja.js` (una sección nueva al final)

**Interfaces:**
- Consume: `MovilHoja.pintar(contenedor, proyectos, alAbrir)` de la Tarea 2.
- Produce, y las tareas 5 y 6 dependen de estos nombres exactos:
  - `MovilHoja.filtrar(contenedor, categoria)` → `undefined`. `categoria` es
    una de las cuatro cadenas de `Datos.CATEGORIAS`, o **`null` para enseñarlo
    todo**.

**Las dos reglas que esta tarea implementa, con su porqué:**

1. **Filtrar esconde, no repinta.** La spec dice que el número «identifica el
   trabajo, no su posición en pantalla: no cambia al filtrar». Repintar sólo
   con los de la categoría los renumeraría de 01 en adelante, que es
   exactamente lo prohibido. Esconder conserva el índice de origen sin tener
   que guardarlo en ningún sitio aparte.
2. **La foto que no carga deja su marco con su número.** La celda gana la clase
   `sin-foto` en el evento `error` de la imagen. La Tarea 6 la usa para
   esconder la `<img>` rota y dejar el fondo oscuro; el número ya sobrevive
   porque es hermano y no hijo (Tarea 2).

- [ ] **Paso 1: escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-hoja.js`, **fuera** del `describe`
anterior y como sección propia:

```js
/* Filtrar y fallar: las dos cosas que le pasan a una rejilla ya pintada. */
describe('MovilHoja — filtrar y la foto que falta', function () {

  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'foto-stills',
        portadaUrl: 'x-niebla.jpg' },
      { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial',
        portadaUrl: 'x-bruma.jpg' },
      { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'editorial',
        portadaUrl: 'x-oleaje.jpg' },
      { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip',
        portadaUrl: 'x-reflejo.jpg' }
    ];
  }

  function pintada(fn) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), function () {});
      return fn(ol);
    });
  }

  function visibles(ol) {
    var fuera = [];
    var celdas = ol.querySelectorAll('li.hoja-celda');
    for (var i = 0; i < celdas.length; i++) {
      if (!celdas[i].hidden) fuera.push(celdas[i].dataset.id);
    }
    return fuera;
  }

  prueba('filtrar deja sólo los de la categoría', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      return visibles(ol);
    }), ['bruma', 'oleaje']);
  });

  /* Lo que la spec pide con todas las letras: «los números no cambian». */
  prueba('filtrar NO renumera: bruma sigue siendo el 02', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      var b = ol.querySelector('li[data-id="bruma"] .hoja-numero');
      var o = ol.querySelector('li[data-id="oleaje"] .hoja-numero');
      return [b.textContent, o.textContent];
    }), ['02', '03']);
  });

  prueba('filtrar con null lo enseña todo otra vez', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      MovilHoja.filtrar(ol, null);
      return visibles(ol);
    }), ['niebla', 'bruma', 'oleaje', 'reflejo']);
  });

  prueba('cambiar de categoría no deja escondidos los de antes', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      MovilHoja.filtrar(ol, 'videoclip');
      return visibles(ol);
    }), ['reflejo']);
  });

  /* Una categoría sin trabajos no es un error: la rejilla se queda vacía y el
     filtro sigue funcionando después. Que no lance es la mitad importante. */
  prueba('una categoría sin trabajos deja la rejilla vacía sin lanzar', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'cortometraje');
      return visibles(ol);
    }), []);
  });

  /* Lo escondido no puede seguir siendo alcanzable con el tabulador ni
     legible por un lector de pantalla: `hidden` se encarga de las dos cosas a
     la vez, y por eso se usa el atributo y no una clase. */
  prueba('lo escondido lo está con el atributo hidden, no con una clase', function () {
    cierto(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      var n = ol.querySelector('li[data-id="niebla"]');
      return n.hidden === true;
    }), 'las celdas fuera del filtro tienen que llevar hidden');
  });

  prueba('una foto que no carga marca su celda', function () {
    cierto(pintada(function (ol) {
      var celda = ol.querySelector('li[data-id="bruma"]');
      celda.querySelector('img').dispatchEvent(new Event('error'));
      return celda.classList.contains('sin-foto');
    }), 'la celda tiene que ganar la clase sin-foto');
  });

  prueba('la celda sin foto conserva su número', function () {
    igual(pintada(function (ol) {
      var celda = ol.querySelector('li[data-id="oleaje"]');
      celda.querySelector('img').dispatchEvent(new Event('error'));
      return celda.querySelector('.hoja-numero').textContent;
    }), '03');
  });

  prueba('una foto que falla no afecta a las demás', function () {
    igual(pintada(function (ol) {
      ol.querySelector('li[data-id="bruma"] img').dispatchEvent(new Event('error'));
      return ol.querySelectorAll('li.sin-foto').length;
    }), 1);
  });
});
```

- [ ] **Paso 2: comprobar que fallan**

Recarga `tests/test.html` con Ctrl+Shift+R.
Esperado: las 9 comprobaciones de «MovilHoja — filtrar y la foto que falta» en
rojo (`MovilHoja.filtrar is not a function` en las seis primeras, y la clase
`sin-foto` ausente en las tres últimas).

- [ ] **Paso 3: escribir las dos piezas**

En `js/movil-hoja.js`, dentro de `celdaDe`, justo después de las cuatro líneas
que configuran `img` (`img.decoding = 'async';`), añade:

```js
    /* Si la foto no llega, el marco se queda con su número: un hueco numerado
       se lee como «falta esa», no como «la web está rota». La clase la usa el
       CSS para esconder la imagen rota; el número sobrevive solo, porque
       cuelga del botón y no de la imagen. */
    img.addEventListener('error', function () {
      celda.classList.add('sin-foto');
    });
```

Y antes del `return`, añade la función nueva:

```js
  /* Esconde en vez de repintar, y no es una optimización: los números salen
     del índice en la lista completa, así que repintar sólo con los de la
     categoría los renumeraría de 01 en adelante — justo lo que la spec
     prohíbe cuando dice que el número identifica el trabajo y no su sitio.

     `hidden` y no una clase: el atributo saca la celda del tabulador y del
     lector de pantalla a la vez, que es lo que hace falta. La Tarea 6 añade
     `.hoja-celda[hidden]{display:none}` porque la regla de rejilla que le da
     `display` a la celda ganaría al `display:none` del navegador. */
  function filtrar(contenedor, categoria) {
    var celdas = contenedor.querySelectorAll('li.hoja-celda');
    for (var i = 0; i < celdas.length; i++) {
      celdas[i].hidden = !(categoria === null || celdas[i].dataset.cat === categoria);
    }
  }
```

Y añade `filtrar: filtrar,` al objeto que se devuelve, después de `numero:
numero,`.

- [ ] **Paso 4: comprobar que pasan**

Recarga con Ctrl+Shift+R.
Esperado: las 9 comprobaciones nuevas en verde y el total en **304**, sin
ninguna en rojo.

- [ ] **Paso 5: comprobar que las pruebas no son de mentira**

Sobre una copia, una mutación cada vez:

1. `filtrar`: quita el `categoria === null ||` → tiene que caer «filtrar con
   null lo enseña todo otra vez».
2. `filtrar`: cambia `celdas[i].hidden = !(…)` por `celdas[i].hidden = false` →
   tienen que caer varias.
3. `filtrar`: cambia el bucle para que empiece en `i = 1` → tiene que caer al
   menos «filtrar deja sólo los de la categoría».
4. `celdaDe`: quita el `addEventListener('error', …)` → tienen que caer las
   tres de la foto que falta.
5. **La mutación que importa de verdad:** cambia `filtrar` por una versión que
   repinte —`pintar(contenedor, proyectos.filter(…), …)`— y comprueba que cae
   «filtrar NO renumera: bruma sigue siendo el 02». Si no cae, esa prueba no
   está haciendo su trabajo y hay que arreglarla antes de seguir. Es la única
   que protege el requisito literal de la spec.

- [ ] **Paso 6: commit**

```bash
git add js/movil-hoja.js tests/pruebas-movil-hoja.js
git commit -m "Filtrar sin renumerar, y conservar el numero cuando la foto no llega"
```

---

### Tarea 4: el hero fundido

**Archivos:**
- Modificar: `js/movil-hoja.js` (la sección del hero, al final del módulo)
- Modificar: `tests/pruebas-movil-hoja.js` (una sección nueva al final)

**Interfaces:**
- Consume:
  - `MovilGestos.inicial()`, `MovilGestos.presionar(estado, punto)`,
    `MovilGestos.soltar(estado, punto)` de `js/movil-gestos.js` (bloque 4c).
    `presionar` y `punto` esperan `{x, y}`. `soltar` devuelve
    `{estado, intencion}`, donde `intencion` es `'izquierda'`, `'derecha'`,
    `'arriba'`, `'abajo'`, `'toque'`, `'pellizco'` o `null`.
  - `Hero.debeSaltarse(ruta)` de `js/hero.js` (ya existe y está probado).
- Produce, y las tareas 5 y 6 dependen de estos nombres exactos:
  - `MovilHoja.entrada(hero, hoja, rejilla, ruta)` → `undefined`
  - `MovilHoja.heroIdo()` → booleano

**Las cuatro reglas que esta tarea implementa:**

1. **Se va al deslizar hacia arriba, sin botón.** El gesto lo reconoce
   `MovilGestos`, que es lo que el bloque 4c construyó y hasta ahora no tenía
   ni un solo consumidor. `'arriba'` en `MovilGestos` significa «he deslizado
   el dedo hacia arriba» (`js/movil-gestos.js`, `intencionDe`: `dy < 0`), que
   es literalmente lo que la spec pide.
2. **Y no vuelve.** El nodo se quita del documento, no se esconde: escondido
   seguiría siendo alcanzable con el tabulador y un lector de pantalla lo
   leería por detrás de una rejilla que ya está delante. «Una puerta que se
   cruza dos veces deja de ser una puerta.»
3. **Quien llega por un enlace profundo no lo ve en absoluto.** La regla ya
   está escrita y probada en `Hero.debeSaltarse`; se reutiliza. Escribirla otra
   vez es como empezó la deuda que pagó `js/reglas-contenido.js`: la misma
   regla en dos sitios que podían divergir.
4. **Hay tres formas de cruzar la puerta, y las tres hacen falta.** El
   interruptor es el ANCHO: por esta portada pasa una ventana de escritorio
   estrechada a 700px, con ratón y teclado y **sin pantalla táctil**. Sin la
   rueda y sin el teclado, esa ventana se queda encerrada en el amarillo sin
   forma de salir. Una puerta que sólo se abre con el dedo no es una puerta
   para todo el mundo.

**Aviso sobre el techo de 300 líneas:** la spec pone el hero fundido dentro de
`movil-hoja.js` («la portada: rejilla irregular, numerada, con el hero fundido
encima»). Sigue esa decisión. **Si al terminar el archivo pasa de 300 líneas,
saca la sección del hero a `js/movil-hoja-entrada.js` con el mismo patrón
`window.MovilHojaEntrada`, dilo en el informe y ajusta las tareas 5 y 6 con un
`<script>` más.** Cuenta las líneas antes de dar la tarea por hecha: `wc -l
js/movil-hoja.js`.

- [ ] **Paso 1: escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-hoja.js`, como sección propia:

```js
/* El hero fundido: la puerta de entrada de la portada móvil. */
describe('MovilHoja — el hero fundido', function () {

  var MARCO =
    '<div>' +
      '<div class="hoja-hero" id="h"></div>' +
      '<ol class="hoja-rejilla" id="r"></ol>' +
    '</div>';

  function conElHero(ruta, fn) {
    return ArnesDom.conElemento(MARCO, function (raiz) {
      var hero = raiz.querySelector('#h');
      var rejilla = raiz.querySelector('#r');
      MovilHoja.entrada(hero, raiz, rejilla, ruta);
      return fn(hero, raiz, rejilla);
    });
  }

  function rutaPortada()  { return { tipo: 'todos', valor: null, pieza: null }; }
  function rutaProyecto() { return { tipo: 'proyecto', valor: 'bruma', pieza: 3 }; }
  function rutaCategoria(){ return { tipo: 'categoria', valor: 'editorial', pieza: null }; }

  /* Un deslizamiento hacia arriba de verdad: 90px de recorrido vertical, muy
     por encima de los 24 de MovilGestos.UMBRAL y sin componente horizontal que
     lo convierta en diagonal. Los eventos se sintetizan porque un navegador de
     escritorio no genera toques. */
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 300, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 210, bubbles: true }));
  }

  function deslizarAbajo(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 210, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 300, bubbles: true }));
  }

  prueba('en la portada, el hero se queda', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      return !MovilHoja.heroIdo() && !hero.classList.contains('fuera');
    }), 'con la ruta vacía el hero tiene que verse');
  });

  /* «Quien llegue por un enlace profundo no lo ve en absoluto»: el enlace
     pedía un trabajo concreto y anteponerle una portada sería desobedecerlo. */
  prueba('un enlace a un proyecto se salta el hero', function () {
    cierto(conElHero(rutaProyecto(), function () {
      return MovilHoja.heroIdo();
    }), 'con #/bruma/3 el hero no puede aparecer');
  });

  prueba('un enlace a una categoría también se lo salta', function () {
    cierto(conElHero(rutaCategoria(), function () {
      return MovilHoja.heroIdo();
    }), 'con #/editorial el hero no puede aparecer');
  });

  prueba('deslizar hacia arriba se lleva el hero', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarArriba(hero);
      return MovilHoja.heroIdo() && hero.classList.contains('fuera');
    }), 'el deslizamiento hacia arriba tiene que cerrar la puerta');
  });

  /* La spec dice «se va al deslizar hacia ARRIBA». Hacia abajo no es la
     puerta: sin esta prueba, cualquier deslizamiento la abriría. */
  prueba('deslizar hacia abajo no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarAbajo(hero);
      return !MovilHoja.heroIdo() && !hero.classList.contains('fuera');
    }), 'hacia abajo no es el gesto');
  });

  /* Un toque tampoco: la spec dice «sin botón», y un toque que cerrara la
     puerta convertiría toda la pantalla en un botón. */
  prueba('un toque no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new PointerEvent('pointerdown',
        { clientX: 100, clientY: 300, bubbles: true }));
      hero.dispatchEvent(new PointerEvent('pointerup',
        { clientX: 102, clientY: 301, bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'un toque no es un deslizamiento');
  });

  /* El interruptor es el ancho: por aquí pasa un escritorio de 700px con
     ratón y sin pantalla táctil. Sin la rueda se queda encerrado. */
  prueba('la rueda hacia abajo se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilHoja.heroIdo();
    }), 'sin la rueda, una ventana estrecha con ratón no puede entrar');
  });

  prueba('la rueda hacia arriba no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'rodar hacia arriba no avanza');
  });

  /* Y sin el teclado se queda encerrado quien no usa ratón ni dedo. */
  prueba('el teclado también abre la puerta', function () {
    ['Enter', ' ', 'ArrowDown', 'PageDown', 'End'].forEach(function (tecla) {
      cierto(conElHero(rutaPortada(), function () {
        document.dispatchEvent(new KeyboardEvent('keydown',
          { key: tecla, bubbles: true }));
        return MovilHoja.heroIdo();
      }), 'la tecla ' + tecla + ' tiene que abrir la puerta');
    });
  });

  prueba('una tecla cualquiera no la abre', function () {
    cierto(conElHero(rutaPortada(), function () {
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'a', bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'escribir una letra no es cruzar la puerta');
  });

  /* «Una puerta que se cruza dos veces deja de ser una puerta.» El nodo se
     quita del documento, no se esconde: escondido seguiría en el tabulador. */
  prueba('cruzada la puerta, el nodo se va del documento', function () {
    cierto(conElHero(rutaPortada(), function (hero, raiz) {
      deslizarArriba(hero);
      MovilHoja.retirarYa();
      return raiz.querySelector('.hoja-hero') === null;
    }), 'el hero tiene que salir del documento, no quedarse escondido');
  });

  prueba('cruzarla dos veces no lanza', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarArriba(hero);
      deslizarArriba(hero);
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilHoja.heroIdo();
    }), 'el segundo gesto tiene que ser inofensivo');
  });

  /* Mientras el hero está delante, la rejilla no puede leerse por detrás. */
  prueba('con el hero puesto, la rejilla queda oculta al lector', function () {
    igual(conElHero(rutaPortada(), function (hero, raiz, rejilla) {
      var antes = rejilla.getAttribute('aria-hidden');
      deslizarArriba(hero);
      return [antes, rejilla.getAttribute('aria-hidden')];
    }), ['true', null]);
  });
});
```

- [ ] **Paso 2: comprobar que fallan**

Recarga `tests/test.html` con Ctrl+Shift+R.
Esperado: la sección «MovilHoja — el hero fundido» en rojo con
`MovilHoja.entrada is not a function`.

- [ ] **Paso 3: escribir la sección del hero**

Añade a `js/movil-hoja.js`, antes del `return`:

```js
  /* ----------------------------------------------------------------
     EL HERO FUNDIDO
     El amarillo con LUQUE! que hay antes de la rejilla. Se va al deslizar
     hacia arriba, sin botón, y no vuelve.
     ---------------------------------------------------------------- */

  /* Cuánto tarda el fundido de salida. Tiene que casar con la transición que
     la Tarea 6 le pone a `.hoja-hero` en el CSS: si aquí fuera menos, el nodo
     desaparecería de golpe a mitad del fundido. */
  var SALIDA_MS = 380;

  var ido = false;

  /* Cuál de las llamadas a `entrada()` es la vigente. En producción sólo hay
     una y esto sobra; en la suite hay trece en menos de 380ms, y sin este
     número las de antes se pisarían con la de ahora. El porqué exacto está en
     `cerrarPuerta`. */
  var generacion = 0;

  var retirarElHero = function () {};

  function heroIdo() { return ido; }

  /* Quita el nodo del documento en el acto, sin esperar al fundido: las
     pruebas no pueden esperar 380ms. Lo que retira lo fija la última llamada a
     `entrada()`. */
  function retirarYa() { retirarElHero(); }

  function entrada(hero, hoja, rejilla, ruta) {
    var mia = ++generacion;
    var cerrada = false;
    ido = false;

    function quitarNodo() {
      if (hero.parentNode) hero.parentNode.removeChild(hero);
    }
    retirarElHero = quitarNodo;

    /* Quien llega por un enlace a un trabajo concreto no quiere una portada:
       el enlace pedía ese trabajo y anteponerle una portada sería
       desobedecerlo. La regla ya está escrita y probada en
       `Hero.debeSaltarse` (js/hero.js); se reutiliza en vez de copiarla,
       porque dos copias de una regla es como empezó la deuda que pagó
       `js/reglas-contenido.js`. */
    if (window.Hero.debeSaltarse(ruta)) {
      ido = true;
      quitarNodo();
      return;
    }

    hoja.classList.add('con-hero');
    rejilla.setAttribute('aria-hidden', 'true');

    /* La puerta se cruza una vez.

       `cerrada` es LOCAL y `ido` es del módulo, y la diferencia es lo que hace
       que la suite no mienta. Cada llamada a `entrada()` deja vivo un oyente
       de teclado en `document`, y en la suite hay trece llamadas seguidas. Con
       una sola bandera compartida, el oyente de una prueba anterior atendería
       la tecla de la prueba de ahora, pondría la bandera, y la prueba actual
       vería «puerta cerrada» sin que su propio hero se hubiera movido: pasaría
       en verde por el motivo equivocado. Con `cerrada` local, cada oyente sólo
       puede cerrar SU puerta; y con `mia === generacion`, sólo la entrada
       vigente toca lo que `heroIdo()` responde. */
    function cerrarPuerta() {
      if (cerrada) return;
      cerrada = true;
      document.removeEventListener('keydown', alTeclado);
      if (mia === generacion) ido = true;
      hero.classList.add('fuera');
      rejilla.removeAttribute('aria-hidden');
      /* El nodo se QUITA, no se esconde: escondido seguiría siendo alcanzable
         con el tabulador y un lector de pantalla lo leería por detrás de una
         rejilla que ya está delante. */
      setTimeout(quitarNodo, SALIDA_MS);
    }

    /* TRES FORMAS DE CRUZAR LA PUERTA, y las tres hacen falta.
       El interruptor es el ANCHO y no el dedo (js/movil.js): por esta portada
       pasa una ventana de escritorio estrechada a 700px, con ratón y teclado y
       SIN pantalla táctil. Sin la rueda y sin el teclado, esa ventana se queda
       encerrada en el amarillo sin forma de salir. */

    /* 1. El dedo. `MovilGestos` es quien decide si un arrastre fue un
          deslizamiento: aquí no se mide nada, sólo se le pasan los puntos. */
    var gesto = window.MovilGestos.inicial();
    hero.addEventListener('pointerdown', function (e) {
      gesto = window.MovilGestos.presionar(gesto, { x: e.clientX, y: e.clientY });
    });
    hero.addEventListener('pointerup', function (e) {
      var r = window.MovilGestos.soltar(gesto, { x: e.clientX, y: e.clientY });
      gesto = r.estado;
      /* 'arriba' en MovilGestos es el DEDO subiendo (`dy < 0`), que es
         literalmente lo que pide la spec: «se va al deslizar hacia arriba». */
      if (r.intencion === 'arriba') cerrarPuerta();
    });

    /* 2. La rueda, para el ratón de una ventana estrecha. */
    hero.addEventListener('wheel', function (e) {
      if (e.deltaY > 0) cerrarPuerta();
    }, { passive: true });

    /* 3. El teclado, para quien no usa ni dedo ni ratón. Va en `document` y no
          en el hero para no depender de que el hero tenga el foco: no es un
          botón y no debe pedirlo. Se da de baja al cerrar, que es lo que
          impide que se acumulen. */
    function alTeclado(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' ||
          e.key === 'PageDown' || e.key === 'End') {
        cerrarPuerta();
      }
    }
    document.addEventListener('keydown', alTeclado);
  }
```

Y añade al objeto que se devuelve, después de `filtrar: filtrar,`:

```js
    entrada: entrada,
    heroIdo: heroIdo,
    retirarYa: retirarYa,
```

- [ ] **Paso 4: comprobar que pasan**

Recarga con Ctrl+Shift+R.
Esperado: las 13 comprobaciones de «MovilHoja — el hero fundido» en verde y el
total en **317**, sin ninguna en rojo.

- [ ] **Paso 5: contar las líneas**

```bash
wc -l js/movil-hoja.js
```

Si pasa de 300, saca la sección del hero a `js/movil-hoja-entrada.js` como dice
el aviso de arriba y **dilo en el informe**, porque las tareas 5 y 6 tienen que
añadir un `<script>` más.

- [ ] **Paso 6: comprobar que las pruebas no son de mentira**

Sobre una copia, una mutación cada vez:

1. `cerrarPuerta`: quita el `if (cerrada) return;` → tiene que caer «cruzarla
   dos veces no lanza».
2. `pointerup`: cambia `'arriba'` por `'abajo'` → tienen que caer «deslizar
   hacia arriba se lleva el hero» y «deslizar hacia abajo no se lo lleva».
3. `wheel`: cambia `e.deltaY > 0` por `e.deltaY !== 0` → tiene que caer «la
   rueda hacia arriba no se lo lleva».
4. `entrada`: quita la rama de `Hero.debeSaltarse` → tienen que caer las dos de
   los enlaces profundos.
5. `retirarYa`: cambia el `removeChild` por `heroEl.hidden = true` → tiene que
   caer «cruzada la puerta, el nodo se va del documento».
6. `keydown`: quita `'ArrowDown'` de la lista → tiene que caer «el teclado
   también abre la puerta».
7. **La mutación que protege el aislamiento entre pruebas:** cambia
   `if (cerrada) return;` por `if (ido) return;` y `if (mia === generacion) ido
   = true;` por `ido = true;` —es decir, vuelve a una sola bandera compartida—
   y comprueba si la suite sigue en verde. **Si sigue en verde, dilo en el
   informe:** significa que las pruebas del teclado están pasando por el
   trabajo de un oyente de una prueba anterior y no por el suyo propio, y hace
   falta una prueba que distinga las dos cosas. El diseño con `cerrada` local
   y `generacion` existe precisamente para eso; el comentario del código lo
   explica.

**Sobre los oyentes de teclado:** cada `entrada()` suscribe uno a `document`, y
`cerrarPuerta` lo da de baja. Los que quedan vivos son los de las pruebas donde
la puerta **no** se cruza, y por eso cada oyente sólo puede cerrar su propia
puerta. Si aun así ves comprobaciones que fallan **según el orden en que se
ejecutan**, ese es el sospechoso: dilo en el informe con el síntoma exacto en
vez de arreglarlo a ojo.

- [ ] **Paso 7: commit**

```bash
git add js/movil-hoja.js tests/pruebas-movil-hoja.js
git commit -m "El hero fundido: se va al deslizar arriba, con la rueda o con el teclado"
```

---

### Tarea 5: el arranque bifurcado

Hasta aquí no hay nada cableado: tres módulos con 46 comprobaciones y ni una
línea que los llame. Esta tarea los enchufa **sin cambiar todavía el aspecto de
nada**: el CSS que añade sólo esconde la hoja en escritorio. Al terminar, el
escritorio tiene que verse exactamente igual que antes y el móvil tiene que
pintar la rejilla, fea pero funcionando.

**Archivos:**
- Modificar: `js/hero.js` (un argumento opcional y una rama)
- Modificar: `js/galeria.js` (una función de tres líneas)
- Modificar: `index.html` (marcado, tres `<script>` y el arranque)
- Modificar: `css/luque.css` (cuatro reglas, sólo para esconder)

**Interfaces:**
- Consume: `Movil.CONSULTA`, `Movil.init`, `Movil.actual` (T1);
  `MovilHoja.pintar`, `MovilHoja.filtrar` (T2, T3); `MovilHoja.entrada` (T4).
- Produce: `Galeria.remedir()` y `Hero.init(opciones)` con `opciones` opcional.

**El problema que esta tarea resuelve, y que no es evidente:** hoy quien retira
el preloader es `Hero.init()` — y sólo él, con su `MIN_PRELOADER = 1200` y su
fundido de 700ms. Si en móvil no llamamos a `Hero.init()`, **el preloader se
queda puesto para siempre y la web no arranca**. Copiar esos tiempos al módulo
móvil sería duplicar la única pieza que hoy los conoce. La salida es al revés:
`hero.js` sigue siendo el dueño del preloader y gana un argumento para que otro
decida qué pasa cuando se retira.

- [ ] **Paso 1: darle a `hero.js` el argumento opcional**

En `js/hero.js`, añade una variable junto a las otras de arriba:

```js
  var alTerminarLaCarga = null;
```

Cambia el cuerpo del `setTimeout` interior de `retirarPreloader` para que la
rama nueva vaya primero:

```js
      setTimeout(function () {
        preloader.style.display = 'none';
        document.body.classList.add('preloader-done');
        /* La portada móvil se queda con lo que pasa después. El preloader
           sigue siendo de este módulo —sus 1200ms mínimos y su fundido viven
           aquí y en ningún otro sitio—, pero quién entra por la puerta lo
           decide quien arranca. Sin esto, el móvil tendría que copiar esos
           tiempos, y una constante copiada es una constante que diverge. */
        if (alTerminarLaCarga) { alTerminarLaCarga(); return; }
        if (debeSaltarse(window.Router.rutaActual())) rematarEntrada();
        else mostrarFaseA();
      }, 700);
```

Y en `init`, acepta el argumento:

```js
  function init(opciones) {
    alTerminarLaCarga = (opciones && opciones.alCargar) || null;

    preloader  = document.getElementById('preloader');
```

El resto de `init` se queda como está. Fíjate en que **no** hay que tocar las
fases A y B: en móvil no se llega a ellas.

- [ ] **Paso 2: darle a `galeria.js` su remedida**

En `js/galeria.js`, añade justo después de la función `activar()`:

```js
  /* Volver a medir al cruzar el umbral de ancho. `medir()` sólo se llamaba al
     activar la galería, así que un lienzo que cambia de tamaño con la ventana
     se quedaba con las medidas de antes y el paneo apuntaba a un sitio que ya
     no existía. El `requestAnimationFrame` no es adorno: el cruce llega con el
     CSS ya aplicado pero antes de que el navegador haya recalculado las cajas,
     y medir en ese instante mide lo viejo. */
  function remedir() {
    if (!stage || !canvas) return;
    requestAnimationFrame(function () { window.GaleriaPaneo.medir(); });
  }
```

Y añade `remedir: remedir,` al objeto que se devuelve, después de
`activar: activar,`.

- [ ] **Paso 3: el marcado de la hoja**

En `index.html`, justo después de la etiqueta `</section>` que cierra
`<section class="gallery" id="gallery">` y antes del comentario del VISOR,
añade:

```html
  <!-- ============================================================
       PORTADA MÓVIL — la hoja
       Está siempre en el marcado y el CSS decide si se ve: el
       interruptor de js/movil.js es el ancho, y construir las dos
       portadas una sola vez evita reconstruir al girar el móvil,
       que es lo que costaría la posición del recorrido.
       Las imágenes son loading="lazy", así que en escritorio —donde
       este bloque va con display:none— el navegador no las pide.
  ============================================================ -->
  <section class="hoja" id="hoja" aria-label="Trabajo seleccionado">
    <div class="hoja-hero" id="hojaHero">
      <img class="logo-mark" src="logo-luque.svg" alt="LUQUE!">
      <div class="roles">
        <span>Dirección de fotografía</span>
        <span>Operadora de cámara</span>
      </div>
      <span class="hoja-pista" aria-hidden="true">Desliza hacia arriba</span>
    </div>
    <ol class="hoja-rejilla" id="hojaRejilla"></ol>
  </section>
```

- [ ] **Paso 4: los tres `<script>`**

En `index.html`, después de `<script src="js/visor.js"></script>`:

```html
  <script src="js/movil-gestos.js"></script>
  <script src="js/movil.js"></script>
  <script src="js/movil-hoja.js"></script>
```

**Sólo esos tres.** `js/movil-recorrido.js` y `js/brillo.js` son del visor y
entran en el bloque 4e; añadirlos ahora sería cargar código que nadie llama.

- [ ] **Paso 5: el arranque**

Sustituye el bloque `window.Contenido.cargar(...)` del final de `index.html`
por este, dejando el comentario largo que ya está encima:

```js
  window.Cursor.init();
  window.Contenido.cargar(function (proyectos, error) {
    window.Datos.establecer(proyectos);
    window.Galeria.init();
    window.Visor.init();
    window.Router.init();

    /* Fallar y no tener nada son cosas distintas y merecen frases distintas:
       una lista vacía es contenido legítimo de un estudio que aún no ha subido
       su trabajo, no un error que haya que confesar. */
    var aviso = null;
    if (error) aviso = error;
    else if (!proyectos.length) aviso = 'Todavía no hay proyectos que enseñar.';
    if (aviso) {
      window.Galeria.mostrarError(aviso);
      /* El MISMO aviso, también en la portada móvil, y no uno nuevo.
         `Galeria.mostrarError` escribe dentro de `#spatialStage`, que en móvil
         va con display:none: sin esta copia el fallo sería invisible justo en
         el dispositivo por el que entra más gente, y quien lo viera pensaría
         que la culpa es de su conexión. */
      var p = document.createElement('p');
      p.className = 'galeria-vacia';
      p.setAttribute('role', 'status');
      p.textContent = aviso;
      document.getElementById('hoja').appendChild(p);
    }

    /* La portada móvil se construye siempre, aunque estemos en escritorio: es
       lo que permite cruzar el umbral de ancho sin reconstruir nada y sin
       perder la posición. Sus imágenes son perezosas y el bloque va con
       display:none en escritorio, así que el navegador no las pide. */
    var rejilla = document.getElementById('hojaRejilla');
    window.MovilHoja.pintar(rejilla, window.Datos.PROYECTOS, function (id) {
      /* Hasta el bloque 4e el visor que se abre es el de escritorio. La URL ya
         es la correcta, así que 4e lo sustituye sin tocar esta línea. */
      window.Router.ir('proyecto', id);
    });
    window.Router.alCambiar(function (ruta) {
      window.MovilHoja.filtrar(rejilla, ruta.tipo === 'categoria' ? ruta.valor : null);
    });

    window.Movil.init(window.matchMedia(window.Movil.CONSULTA), {
      movil: function () { document.body.classList.add('es-movil'); },
      escritorio: function () {
        document.body.classList.remove('es-movil');
        window.Galeria.remedir();
      }
    });

    /* La puerta de entrada se elige UNA vez y no se vuelve a elegir. El hero
       es una entrada por visita, no una sección: estrechar la ventana a mitad
       de sesión cambia la portada, pero no reabre la puerta del otro lado. */
    if (window.Movil.actual() === 'movil') {
      window.Hero.init({ alCargar: function () {
        window.MovilHoja.entrada(document.getElementById('hojaHero'),
                                 document.getElementById('hoja'),
                                 rejilla,
                                 window.Router.rutaActual());
      } });
    } else {
      window.Hero.init();
    }
  });
```

- [ ] **Paso 6: el CSS mínimo, sólo para esconder**

Al final de `css/luque.css`, antes del bloque
`@media (prefers-reduced-motion: reduce)`:

```css
/* ============================================================
   EL INTERRUPTOR — ver js/movil.js
   Aquí sólo se decide QUÉ se ve. El aspecto de la hoja va más
   abajo, y lo escribe la Tarea 6 del bloque 4d.
============================================================ */
.hoja{ display:none; }

body.es-movil .hoja{ display:block; }
body.es-movil .gallery,
body.es-movil .hero,
body.es-movil .navbar{ display:none !important; }
```

- [ ] **Paso 7: comprobar que el escritorio NO se ha movido**

Esta es la mitad importante de la tarea. Con `python -m http.server` en marcha:

1. Abre `http://localhost:8000/` en una ventana **ancha** (más de 860px).
   Esperado: preloader, logo de fin de carga, LUQUE! grande con los roles y el
   botón ENTRAR. Pulsa ENTRAR: aparece la barra de categorías y el lienzo
   espacial. Mueve el ratón: el lienzo panea.
2. Pulsa una categoría. Esperado: el lienzo se recompone y la URL pasa a
   `#/foto-stills` (o la que sea).
3. Abre `http://localhost:8000/#/niebla/1` en una ventana ancha. Esperado: se
   salta la portada y abre el visor en la primera pieza.
4. Abre la consola del navegador. Esperado: **cero errores**.
5. Corre la suite: `http://localhost:8000/tests/test.html`. Esperado: **317 en
   verde, 0 en rojo**.
6. `node tests/prueba-borrador.js` → «TODO EN VERDE».
7. `python tests/auditar_rutas.py` → «OK: todas las rutas locales existen con
   las mayusculas exactas».

Si el punto 1 o el 3 fallan, **para y dilo**: significa que el argumento
opcional de `hero.js` ha roto el camino de escritorio, que es el que está en
producción.

- [ ] **Paso 8: comprobar que el móvil arranca**

Estrecha la ventana por debajo de 860px y recarga con Ctrl+Shift+R.
Esperado: **sin preloader colgado**; el amarillo con LUQUE! ocupando la
pantalla; y al deslizar hacia arriba con el ratón sobre el amarillo —o al girar
la rueda hacia abajo— aparecen las 12 celdas numeradas, en una lista vertical
sin estilo. **Fea es lo correcto en esta tarea**: el aspecto lo pone la Tarea 6.

Comprueba también `http://localhost:8000/#/editorial` estrecho: no tiene que
verse el amarillo, y sólo tienen que quedar las celdas 04, 05 y 06.

Y comprueba el aviso de contenido caído, que es la única rama de fallo que este
bloque toca. Renombra el archivo un momento, recarga estrecho, y devuélvelo:

```bash
mv contenido.json contenido.json.guardado
# recarga el navegador estrecho: tiene que salir el aviso, no una pantalla en blanco
mv contenido.json.guardado contenido.json
```

Esperado: el texto «No se ha podido cargar el contenido: …» **visible en la
portada móvil**. Si no se ve nada, la copia del aviso a `#hoja` no está
funcionando: en móvil `#spatialStage` va con `display:none` y el aviso original
cae dentro. **Devuelve el archivo a su sitio antes de seguir** y comprueba con
`git status` que el árbol está limpio.

- [ ] **Paso 9: commit**

```bash
git add js/hero.js js/galeria.js index.html css/luque.css
git commit -m "Bifurcar el arranque: el ancho decide que portada se monta"
```

---

### Tarea 6: el aspecto de la portada móvil

Aquí es donde el bloque se ve por primera vez.

**Archivos:**
- Modificar: `css/luque.css` (una sección nueva, al final)

**Interfaces:**
- Consume las clases que pintan las tareas 2, 3 y 4: `.hoja`, `.hoja-hero`,
  `.hoja-hero.fuera`, `.hoja-pista`, `.hoja-rejilla`, `.hoja-celda`,
  `.hoja-celda[hidden]`, `.hoja-celda.sin-foto`, `.hoja-boton`, `.hoja-numero`,
  la variable `--proporcion` y la clase `.con-hero` sobre `#hoja`.
- Produce: nada que consuma código.

- [ ] **Paso 1: escribir el CSS**

Sustituye el bloque «EL INTERRUPTOR» que dejó la Tarea 5 por esto, que lo
incluye y lo continúa:

```css
/* ============================================================
   EL INTERRUPTOR — ver js/movil.js
============================================================ */
.hoja{ display:none; }

body.es-movil .hoja{ display:block; }
body.es-movil .gallery,
body.es-movil .hero,
body.es-movil .navbar{ display:none !important; }

/* ============================================================
   PORTADA MÓVIL — la hoja
============================================================ */
body.es-movil .hoja{
  position:fixed; inset:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
  /* OBLIGATORIO. Sin esto, tirar hacia abajo desde lo alto dispara el
     pull-to-refresh de Chrome de Android y la web se recarga en mitad del
     recorrido. Por omisión la web se recarga: hay que apagarlo a propósito. */
  overscroll-behavior-y:contain;
  background:var(--yellow);
  z-index:5;
}

/* Mientras el hero está delante, la rejilla no se desplaza por detrás. */
.hoja.con-hero{ overflow:hidden; }

.hoja-rejilla{
  list-style:none;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  /* 24px a los lados a propósito: ningún control puede caer en la franja de
     unos 20px que el navegador se queda para su gesto de «atrás». Los 72 de
     abajo dejan sitio al indicador de inicio de iOS. */
  padding:24px 24px 72px;
}

.hoja-celda{ position:relative; }

/* El atributo `hidden` del navegador es `display:none`, pero la regla que le
   da display a la celda como hija de la rejilla le ganaría por especificidad.
   Sin esta línea, filtrar no escondería nada. */
.hoja-celda[hidden]{ display:none; }

.hoja-boton{
  display:block; width:100%; padding:0; border:0;
  position:relative; overflow:hidden;
  background:var(--grey-dark);
  /* La proporción la pone `MovilHoja.proporcion` celda a celda: es lo que hace
     la rejilla irregular. El 1.25 es sólo el respaldo si faltara. */
  aspect-ratio:1 / var(--proporcion, 1.25);
  cursor:pointer;
}

.hoja-boton img{
  display:block; width:100%; height:100%;
  object-fit:cover;
}

/* La foto que no llega deja su marco oscuro con su número dentro: un hueco
   numerado se lee como «falta esa», no como «la web está rota». */
.hoja-celda.sin-foto img{ display:none; }

/* Amarillo con sombra, y no una pastilla: aquí el número va sobre la foto,
   así que la sombra es lo que lo sostiene sobre una foto clara. En el visor
   —bloque 4e— el texto sí va en pastilla, porque allí hay que leer palabras
   y no dos cifras. */
.hoja-numero{
  position:absolute; top:8px; left:10px;
  font-size:1.45rem; font-weight:700; line-height:1;
  letter-spacing:var(--kerning);
  color:var(--yellow);
  text-shadow:0 1px 5px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.9);
  pointer-events:none;
}

.hoja-boton:focus-visible{ outline:3px solid var(--black); outline-offset:3px; }

/* ------------------------------------------------------------
   EL HERO FUNDIDO
   Ocupa la pantalla entera por encima de la rejilla y se va al
   deslizar hacia arriba. Los 380ms casan con SALIDA_MS de
   js/movil-hoja.js: si no casaran, el nodo desaparecería de
   golpe a mitad del fundido.
------------------------------------------------------------ */
.hoja-hero{
  position:fixed; inset:0; z-index:10;
  background:var(--yellow);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:22px;
  padding:0 24px;
  transition:opacity 380ms ease, transform 380ms ease;
}

.hoja-hero.fuera{
  opacity:0;
  transform:translateY(-28px);
  pointer-events:none;
}

.hoja-hero .logo-mark{ width:min(76vw, 420px); height:auto; }

.hoja-hero .roles{
  text-align:center;
  font-size:0.95rem; line-height:1.65;
  display:flex; flex-direction:column;
}

.hoja-pista{
  font-size:0.62rem; font-weight:700;
  letter-spacing:0.22em; text-transform:uppercase;
  opacity:0.5;
}

@media (prefers-reduced-motion: reduce){
  .hoja-hero{ transition:opacity 0.2s ease; }
  .hoja-hero.fuera{ transform:none; }
}
```

- [ ] **Paso 2: mirarlo**

Con el servidor en marcha, estrecha la ventana a **390px** y recarga con
Ctrl+Shift+R. Comprueba, uno a uno:

1. El amarillo llena la pantalla, con LUQUE! centrado, los dos roles debajo y
   «DESLIZA HACIA ARRIBA» pequeño abajo.
2. Rueda hacia abajo: el amarillo se funde hacia arriba y aparece la rejilla.
3. Dos columnas, con las celdas de alturas distintas siguiendo el ciclo
   `1.25, 1, 1.5, 1, 1.5, 1.25`.
4. Cada celda lleva sus dos cifras amarillas arriba a la izquierda, legibles
   tanto sobre una foto clara como sobre una oscura.
5. Se desplaza hasta abajo del todo y se ve la celda 12 entera.
6. Rueda hacia arriba desde lo alto de la rejilla: **el amarillo no vuelve.**
7. `#/editorial` estrecho: sin amarillo, y sólo las celdas **04, 05 y 06**, con
   esos números y no renumeradas a 01, 02, 03.
8. Vuelve a ensanchar por encima de 860px sin recargar: aparece el lienzo de
   escritorio, panea bien con el ratón y **no** reaparece el hero.
9. Consola del navegador: cero errores.

- [ ] **Paso 3: correr todo**

- `http://localhost:8000/tests/test.html` → **317 en verde, 0 en rojo**
- `node tests/prueba-borrador.js` → «TODO EN VERDE»
- `python tests/auditar_rutas.py` → «OK: todas las rutas locales existen con las
  mayusculas exactas»

- [ ] **Paso 4: commit**

```bash
git add css/luque.css
git commit -m "Vestir la portada movil: rejilla de dos columnas y hero fundido"
```

---

### Tarea 7: la comprobación en un móvil de verdad, y lo que queda sin verificar

Dos cosas de esta portada **no se pueden comprobar en un navegador de
escritorio estrechado**, y la spec lo dice con todas las letras: el
deslizamiento desde el borde que se queda el navegador, y el pull-to-refresh al
tirar hacia abajo. Esta tarea las pone delante de Ángel, que las probará en su
teléfono, y escribe en `docs/estado-conocido.md` lo que quede sin verificar.

**Archivos:**
- Modificar: `docs/estado-conocido.md`

- [ ] **Paso 1: exponer el servidor a la red local**

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Y averigua la IP de la máquina en la red local:

```bash
ipconfig | grep -A4 "Wi-Fi\|Ethernet" | grep IPv4
```

La URL que hay que darle a Ángel es `http://<esa-ip>:8000/`. Si el teléfono no
llega, el sospechoso es el cortafuegos de Windows: **dilo, no lo desactives.**

- [ ] **Paso 2: escribir la lista de lo que hay que mirar**

Prepara esta lista tal cual, para que Ángel la conteste punto por punto:

```
1. Abre http://<ip>:8000/ en el móvil.
   ¿Sale el amarillo con LUQUE! ocupando la pantalla?

2. Desliza el dedo hacia arriba sobre el amarillo.
   ¿Se va y aparece la rejilla? ¿Cuesta más o menos de lo que esperabas?

3. Desde lo alto de la rejilla, tira del dedo hacia ABAJO con fuerza.
   ¿Se recarga la página? (Tiene que NO recargarse.)

4. Desliza el dedo empezando desde el borde izquierdo de la pantalla.
   ¿Vuelve atrás el navegador? ¿Te ha estorbado?

5. Recorre la rejilla arriba y abajo.
   ¿Va suave o da tirones?

6. ¿Se leen los números sobre las fotos claras? ¿Y sobre las oscuras?

7. Toca un trabajo. Se abrirá el visor VIEJO, el de escritorio: es lo
   esperado en este bloque, lo sustituye el siguiente. Lo único que hay
   que mirar es si la URL de arriba pasa a #/<algo>.

8. Gira el teléfono a horizontal y vuelve a vertical.
   ¿Se pierde el sitio por el que ibas?

9. Abre http://<ip>:8000/#/editorial directamente.
   ¿Te ahorra el amarillo y enseña sólo tres trabajos, numerados 04, 05 y 06?
```

- [ ] **Paso 3: pasarle la lista y esperar**

Dásela a Ángel y **espera su respuesta antes de seguir.** Esta es una de las
cuatro cosas que paran la ejecución: no se puede adivinar lo que hace un
teléfono que no tenemos delante.

- [ ] **Paso 4: escribir lo que se sepa y lo que no**

En `docs/estado-conocido.md`, en la sección de lo que queda sin verificar, añade
una entrada por cada punto que Ángel **no** haya podido confirmar, y actualiza
el recuento de la sección «Cómo se prueba» de 271 a **317**.

Escribe además, sin falta, estas dos:

```markdown
- **El visor de la portada móvil sigue siendo el de escritorio.** Tocar un
  trabajo en la rejilla llama a `Router.ir('proyecto', id)`
  (`index.html`, en el arranque), y quien responde es `js/visor.js`, que se
  diseñó para un ratón: su lupa es «mantén y arrastra» y su tira de miniaturas
  no cabe. La URL que produce ya es la definitiva, así que el bloque 4e
  sustituye el visor sin tocar ese cableado. Hasta entonces, **la mitad de la
  experiencia móvil es la de escritorio encogida.**
- **`MovilRecorrido` y `Brillo` siguen sin cablear.** Este bloque cableó
  `MovilGestos` —lo consume el hero fundido, en `MovilHoja.entrada`— pero
  `js/movil-recorrido.js` y `js/brillo.js` siguen sin un solo consumidor: son
  del visor. Cuando se cableen, **`MovilRecorrido` necesita `piezas` como
  NÚMERO y no como array**; el porqué y lo que cuesta equivocarse está más
  arriba en este mismo documento.
```

**Y la regla que este proyecto ha tenido que aprender cuatro veces:** no
escribas una frase más fuerte de lo que mediste. Si Ángel dice «no me ha
recargado» no escribas «el pull-to-refresh está desactivado»; escribe «Ángel
comprobó en su teléfono el <fecha> que tirar hacia abajo no recarga», y di qué
teléfono y qué navegador.

- [ ] **Paso 5: commit**

```bash
git add docs/estado-conocido.md
git commit -m "Anotar lo comprobado en un movil real y lo que sigue sin verificarse"
```

---

## Cuando el bloque termine

Usa `superpowers:finishing-a-development-branch`. **La fusión y la publicación
son decisión de Ángel:** `main` va más de 76 commits por delante de
`origin/main` y sin subir a propósito, porque si Cloudflare Pages sigue
conectado al repositorio un `git push` publica el sitio — y el sitio todavía
tiene fuentes de prueba sin licenciar y proyectos de relleno.
