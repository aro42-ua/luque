# Bloque 4a — El arnés de DOM y la deuda que salda

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al arnés del navegador la capacidad de probar código que toca el
DOM, y usarla inmediatamente para cubrir `Lista.pintar` y `panel/js/panel.js`,
que hoy no tienen ni una prueba.

**Architecture:** Dos niveles, porque son dos problemas distintos.
`Lista.pintar(contenedor, …)` recibe su contenedor como parámetro, así que basta
con un nodo dentro del documento. `panel/js/panel.js` es una IIFE que llama a
`init()` al cargarse y no expone nada, así que hay que **cargarlo dentro de un
iframe** con su HTML y sus dependencias falsas puestas de antemano. Todo se
apoya en el arnés que ya existe (`tests/arnes.js`), sin sustituirlo.

**Tech Stack:** JavaScript ES5 con el patrón `window.Nombre`, sin dependencias ni
paso de compilación. El arnés corre en un navegador de verdad abriendo
`tests/test.html`. Promesas para lo asíncrono, con `describeAsync`, que ya
existe.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md` (commit `b38dd61`),
sección «El arnés de DOM entra en este trabajo».

## Por qué este bloque va primero y solo

La especificación describe un trabajo grande y pide partirlo. Este es el primer
trozo y **no contiene una sola línea de móvil**: es la herramienta que permitirá
probar `movil-hoja.js` y `movil-visor.js`, y de paso salda la deuda que ya
existía. Tiene valor aunque la versión móvil se cancelara mañana.

Los bloques siguientes, que se planificarán por separado cuando éste esté
fusionado:

- **4b — los cimientos:** el segundo tramo del router (`#/bruma/3`) y los módulos
  puros `movil-recorrido.js`, `movil-gestos.js`, `brillo.js`.
- **4c — la pantalla:** `movil-hoja.js`, `movil-visor.js`, el hero fundido y la
  convención `######` en los dos dispositivos.

## Global Constraints

- **Techo de 300 líneas** por archivo en `js/`, `panel/js/` y `tests/`.
- **ES5 con `window.Nombre`**: nada de `const`, `let`, funciones flecha, clases
  ni módulos ES en `js/`, `panel/js/` ni `tests/`. `var` y `function`.
- **Sin dependencias nuevas.** Ni npm, ni CDN, ni paso de compilación.
- **Nada de credenciales en el repositorio.**
- **Los comentarios explican por qué, no qué.** Es el estilo del repositorio.
- **Los mensajes de error que ve una persona van en castellano**, sin jerga del
  motor.
- Al terminar cada tarea, `node tests/prueba-borrador.js` sigue dando **52/52** y
  `python tests/auditar_rutas.py` sigue dando OK.

## Verificado antes de escribir este plan

La técnica del iframe **no es una suposición**: se ejecutó en un navegador contra
este repositorio. Resultado: `Borrador` falso visto por `panel.js`, 4 opciones en
el `<select>`, 2 filas pintadas, `«Niebla · Editorial»` en la primera, «subir»
deshabilitado en la primera fila, y **`window.Borrador` sigue sin definirse en la
ventana padre**, es decir, el iframe no se filtra. Cero iframes huérfanos tras
limpiar.

Lo que **no** está verificado y la Tarea 2 tiene que comprobar: si el nivel del
iframe funciona abriendo `test.html` con doble clic (`file://`). Puede que no, y
si no funciona, tiene que decirlo con un mensaje claro en vez de fallar de forma
confusa.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `tests/arnes-dom.js` *(nuevo)* | Los dos niveles de fijación: `conElemento` y `conDocumento`. No conoce ningún módulo concreto |
| `tests/pruebas-arnes-dom.js` *(nuevo)* | Prueba el propio arnés: que mete el nodo en el documento, que limpia siempre, que no se filtra |
| `tests/pruebas-lista-pintar.js` *(nuevo)* | `Lista.pintar` sobre un `<ol>` real |
| `tests/pruebas-panel.js` *(nuevo)* | `panel/js/panel.js` dentro de un iframe |
| `tests/test.html` *(modificar)* | Cargar los cuatro archivos nuevos |
| `docs/estado-conocido.md` *(modificar)* | Decir qué ha dejado de estar sin cubrir |

`tests/pruebas-lista.js` **no se toca**: cubre las tres piezas sin DOM y sigue
siendo correcto.

---

## Task 1: El nivel barato — `conElemento`

**Files:**
- Create: `tests/arnes-dom.js`
- Create: `tests/pruebas-arnes-dom.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: `window.Arnes` (`describe`, `prueba`, `igual`, `cierto`) de
  `tests/arnes.js`, ya cargado.
- Produces: `window.ArnesDom.conElemento(html, fn)`. Crea los nodos de `html`
  dentro de un contenedor **conectado al documento** pero fuera de la pantalla,
  llama a `fn(primerElemento, contenedor)`, devuelve lo que devuelva `fn` y
  **quita el contenedor pase lo que pase**, incluso si `fn` lanza.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crea `tests/pruebas-arnes-dom.js` con este contenido exacto:

```js
describe('ArnesDom.conElemento', function () {

  prueba('pasa a fn el primer elemento del html', function () {
    var etiqueta = ArnesDom.conElemento('<ol id="x"></ol>', function (el) {
      return el.tagName;
    });
    igual(etiqueta, 'OL');
  });

  /* Los nodos de prueba tienen que estar DENTRO del documento, no sueltos:
     focus() no hace nada sobre un nodo desconectado y getBoundingClientRect()
     devuelve ceros. panel.js devuelve el foco tras repintar y lista.js mide la
     caja de la fila para decidir si se suelta antes o después, así que un nodo
     suelto daría verde sin comprobar nada de eso. */
  prueba('el elemento está conectado al documento mientras corre fn', function () {
    var conectado = ArnesDom.conElemento('<ol></ol>', function (el) {
      return document.contains(el);
    });
    cierto(conectado, 'sin esto, focus() y las medidas no funcionan');
  });

  prueba('tiene medidas reales, no ceros', function () {
    var ancho = ArnesDom.conElemento('<ol style="width:120px"></ol>', function (el) {
      return el.getBoundingClientRect().width;
    });
    cierto(ancho > 0, 'un nodo suelto mediría 0 y las pruebas de arrastre serían falsas');
  });

  prueba('se puede enfocar un botón de dentro', function () {
    var enfocado = ArnesDom.conElemento('<div><button id="b">x</button></div>', function (el) {
      var b = el.querySelector('#b');
      b.focus();
      return document.activeElement === b;
    });
    cierto(enfocado, 'sin esto no se puede probar la vuelta del foco de panel.js');
  });

  prueba('quita el contenedor al terminar', function () {
    ArnesDom.conElemento('<ol class="rastro"></ol>', function () {});
    igual(document.querySelectorAll('.rastro').length, 0);
  });

  /* La limpieza en `finally` es lo que impide que una prueba que falla deje
     basura en el documento y contamine a las siguientes. */
  prueba('quita el contenedor aunque fn lance', function () {
    var hubo = false;
    try {
      ArnesDom.conElemento('<ol class="rastro2"></ol>', function () {
        throw new Error('a propósito');
      });
    } catch (e) { hubo = true; }
    cierto(hubo, 'el error tiene que propagarse, no tragarse');
    igual(document.querySelectorAll('.rastro2').length, 0);
  });

  prueba('devuelve lo que devuelve fn', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function () { return 42; }), 42);
  });
});
```

- [ ] **Step 2: Añadirlas a `tests/test.html` y ver que fallan**

En `tests/test.html`, añade `arnes-dom.js` justo después de `arnes.js`, y
`pruebas-arnes-dom.js` como primera de las pruebas nuevas:

```html
<script src="arnes.js"></script>
<script src="arnes-dom.js"></script>
```

y en el bloque de pruebas, después de `pruebas-arnes.js`:

```html
<script src="pruebas-arnes-dom.js"></script>
```

Abre `tests/test.html` en el navegador.
Esperado: **7 rojas** con `ArnesDom is not defined`.

- [ ] **Step 3: Escribir `tests/arnes-dom.js`**

```js
/* Segundo arnés, para lo que toca el DOM. El de al lado (`arnes.js`) prueba
   funciones puras; éste da el terreno donde ejercitar código que construye
   nodos, mueve el foco y mide cajas.

   Dos niveles porque son dos problemas distintos:
     - `conElemento`, para lo que recibe su contenedor como parámetro
       —`Lista.pintar(contenedor, …)`—, que se prueba con un nodo y ya está.
     - `conDocumento`, para lo que no expone nada y se ejecuta al cargarse
       —`panel/js/panel.js` es una IIFE que llama a init() en su última línea—,
       que hay que cargar dentro de un iframe con sus dependencias ya puestas. */
window.ArnesDom = (function () {

  /* El contenedor va DENTRO del documento, no suelto: focus() no hace nada
     sobre un nodo desconectado y getBoundingClientRect() devuelve ceros. Se
     esconde moviéndolo fuera de la pantalla y NO con display:none, que sí
     rompería el foco y las medidas —que es justo lo que venimos a probar—. */
  function caja() {
    var c = document.createElement('div');
    c.className = 'arnes-dom-caja';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:400px';
    document.body.appendChild(c);
    return c;
  }

  function conElemento(html, fn) {
    var c = caja();
    c.innerHTML = html;
    /* finally y no un remove() al final: si fn lanza, el contenedor tiene que
       desaparecer igual. Si no, una prueba en rojo deja basura en el documento
       y las siguientes empiezan sucias, que es peor que el fallo original. */
    try {
      return fn(c.firstElementChild, c);
    } finally {
      c.parentNode.removeChild(c);
    }
  }

  return { conElemento: conElemento };
})();
```

- [ ] **Step 4: Ver que pasan**

Recarga `tests/test.html` con **Ctrl+Shift+R** (el servidor de pruebas de Python
no manda `Cache-Control` y Chrome se inventa una frescura propia; sin el recargado
duro verás el archivo viejo).

Esperado: **108 pasan, 0 fallan** (101 de antes + 7 nuevas).

- [ ] **Step 5: Comprobar que las pruebas no son de mentira**

Rompe el arnés a propósito y comprueba que las pruebas lo notan. Cambia en
`arnes-dom.js` la línea `document.body.appendChild(c);` por nada (bórrala),
recarga, y anota cuántas se ponen en rojo.

Esperado: al menos **3 rojas** (conectado al documento, medidas reales, enfocar).
Si sólo se pone una en rojo, las pruebas no cubren lo que dicen cubrir.

**Deshaz el cambio** y confirma que vuelven a pasar las 108.

- [ ] **Step 6: Commit**

```bash
git add tests/arnes-dom.js tests/pruebas-arnes-dom.js tests/test.html
git commit -m "Arnes de DOM: el nivel para lo que recibe su contenedor

Lista.pintar(contenedor, ...) recibe el <ol> como parametro, asi que
para probarlo basta un nodo. conElemento lo crea, se lo pasa y lo
quita en un finally -- si fn lanza, el contenedor desaparece igual;
si no, una prueba en rojo deja basura y ensucia a las siguientes.

El nodo va DENTRO del documento y escondido fuera de pantalla, no
suelto ni con display:none: focus() no hace nada sobre un nodo
desconectado y getBoundingClientRect() devuelve ceros. Como lo que
viene a probarse es justo la vuelta del foco de panel.js y la medida
de la caja de lista.js, un nodo suelto daria verde sin comprobar nada.

Tres de las siete pruebas se ponen en rojo al quitar el appendChild,
comprobado.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: El nivel caro — `conDocumento`

**Files:**
- Modify: `tests/arnes-dom.js`
- Modify: `tests/pruebas-arnes-dom.js`

**Interfaces:**
- Consumes: `window.ArnesDom.conElemento` de la Tarea 1; `describeAsync` de
  `tests/arnes.js`.
- Produces: `window.ArnesDom.conDocumento(opciones, fn)` → **Promesa**.
  `opciones` es `{ html: String, globales: Object, scripts: Array<String> }`.
  Escribe `html` en un iframe, **asigna `globales` sobre su `window` antes de
  cargar nada**, carga los `scripts` en orden esperando a cada uno, llama a
  `fn(ventana, documento)` y quita el iframe pase lo que pase.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `tests/pruebas-arnes-dom.js`:

```js
/* describeAsync porque cargar scripts en un iframe es asíncrono. Ya existe en
   arnes.js: pinta el titular cuando llega el dato y el recuento final espera a
   que todas las secciones asíncronas terminen. */
describeAsync('ArnesDom.conDocumento', function () {

  var HTML = '<main><ol id="lista"></ol><button id="b">x</button></main>';

  /* La que más importa: los globales tienen que estar puestos ANTES de que
     corra el primer script, porque panel.js llama a Borrador.cargar() en su
     propia carga. Si se inyectaran después, panel.js habría reventado ya. */
  return ArnesDom.conDocumento({
    html: HTML,
    globales: { Testigo: { visto: false } },
    scripts: []
  }, function (w, d) {

    prueba('el html llega al documento del iframe', function () {
      cierto(d.getElementById('lista') !== null);
    });

    prueba('los globales están puestos en la ventana del iframe', function () {
      cierto(w.Testigo && w.Testigo.visto === false);
    });

    prueba('el documento del iframe no es el de las pruebas', function () {
      cierto(d !== document, 'si fueran el mismo, no habría aislamiento ninguno');
    });

  }).then(function () {

    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Marca: 1 },
      scripts: []
    }, function () { return true; });

  }).then(function () {

    prueba('quita el iframe al terminar', function () {
      igual(document.querySelectorAll('.arnes-dom-caja').length, 0);
    });

    prueba('no contamina la ventana de las pruebas', function () {
      igual(typeof window.Testigo, 'undefined');
      igual(typeof window.Marca, 'undefined');
    });

    /* Si un script no carga, el error tiene que decir qué hacer. El caso real
       es abrir test.html con doble clic: bajo file:// puede que el navegador
       no deje al iframe cargar scripts, y sin este mensaje el fallo parecería
       un error del código que se está probando. */
    return ArnesDom.conDocumento({
      html: HTML, globales: {}, scripts: ['no-existe-a-proposito.js']
    }, function () { return 'no debería llegar aquí'; })
      .then(function (r) {
        prueba('un script que no carga es un error', function () {
          cierto(false, 'tenía que haber fallado y devolvió ' + r);
        });
      }, function (e) {
        prueba('un script que no carga da un error que nombra el archivo', function () {
          cierto(e.message.indexOf('no-existe-a-proposito.js') !== -1, e.message);
        });
        prueba('y sugiere el servidor, que es la causa probable', function () {
          cierto(e.message.toLowerCase().indexOf('servidor') !== -1, e.message);
        });
        prueba('y limpia el iframe aunque haya fallado', function () {
          igual(document.querySelectorAll('.arnes-dom-caja').length, 0);
        });
      });
  });
});
```

- [ ] **Step 2: Ver que fallan**

Recarga `tests/test.html` con Ctrl+Shift+R.
Esperado: la sección entera cae con `ArnesDom.conDocumento is not a function`
(`describeAsync` la captura y la pinta como «la sección entera se cayó»).

- [ ] **Step 3: Implementar `conDocumento`**

En `tests/arnes-dom.js`, añade antes del `return` final:

```js
  /* El iframe se escribe a mano, así que no tiene una URL propia desde la que
     resolver los `src` relativos. Se le da la carpeta de test.html, que sirve
     igual servida por http que abierta con doble clic. */
  function carpetaDeLasPruebas() {
    return new URL('.', location.href).href;
  }

  function unScript(d, src) {
    return new Promise(function (ok, mal) {
      var s = d.createElement('script');
      s.src = src;
      s.onload = function () { ok(); };
      s.onerror = function () {
        mal(new Error('El arnés no pudo cargar «' + src + '». Si has abierto '
          + 'test.html con doble clic, esta sección necesita un servidor: '
          + 'arráncalo con «python -m http.server» y abre /tests/test.html.'));
      };
      d.body.appendChild(s);
    });
  }

  function conDocumento(opciones, fn) {
    var c = caja();
    var marco = document.createElement('iframe');
    marco.style.cssText = 'width:600px;height:400px;border:0';
    c.appendChild(marco);

    var d = marco.contentDocument;
    var w = marco.contentWindow;

    d.open();
    d.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">'
      + '<base href="' + carpetaDeLasPruebas() + '"></head><body>'
      + (opciones.html || '') + '</body></html>');
    d.close();

    /* Antes de cargar un solo script: panel.js llama a Borrador.cargar() en su
       propia carga, así que un doble inyectado después llegaría tarde. */
    var globales = opciones.globales || {};
    Object.keys(globales).forEach(function (k) { w[k] = globales[k]; });

    function limpiar() { if (c.parentNode) c.parentNode.removeChild(c); }

    var cadena = (opciones.scripts || []).reduce(function (antes, src) {
      return antes.then(function () { return unScript(d, src); });
    }, Promise.resolve());

    /* La forma de dos argumentos y no .catch(): así el fallo de `fn` no se
       confunde con el fallo de la limpieza, y el error original se relanza tal
       cual en vez de envolverse. */
    return cadena
      .then(function () { return fn(w, d); })
      .then(function (r) { limpiar(); return r; },
            function (e) { limpiar(); throw e; });
  }
```

Y cambia el `return` final por:

```js
  return { conElemento: conElemento, conDocumento: conDocumento };
```

- [ ] **Step 4: Ver que pasan**

Recarga con Ctrl+Shift+R.
Esperado: **116 pasan, 0 fallan** (108 + 8 nuevas).

El archivo contiene **nueve** llamadas a `prueba(`, pero sólo ocho se ejecutan:
la novena —`'un script que no carga es un error'`— vive en la rama de éxito de
una promesa que tiene que fracasar, así que sólo corre si `conDocumento` deja
pasar un script inexistente. Si ves 117, no es que sobre una prueba: es que el
manejo del error no funciona.

- [ ] **Step 5: Comprobar el caso de `file://`**

Abre `tests/test.html` con **doble clic** desde el explorador de archivos, no por
el servidor. Anota qué pasa con la sección `ArnesDom.conDocumento`.

- Si pasa: perfecto, no hay nada que hacer.
- Si falla: **es aceptable**, pero tiene que fallar con el mensaje que nombra el
  servidor, no con un error críptico. Comprueba que ese mensaje sale. Y añade en
  `tests/test.html`, justo encima del `<script src="pruebas-panel.js">` de la
  Tarea 4, un comentario diciendo que esa sección necesita servidor.

Anota el resultado: la Tarea 4 y la documentación dependen de él.

- [ ] **Step 6: Commit**

```bash
git add tests/arnes-dom.js tests/pruebas-arnes-dom.js
git commit -m "Arnes de DOM: el nivel para lo que no expone nada

panel/js/panel.js es una IIFE que llama a init() en su ultima linea y
no devuelve un solo simbolo a window: no se le puede llamar a nada
desde fuera. La unica forma de ejercitarlo es cargarlo entero en un
iframe con su HTML y sus dependencias ya puestas.

Los globales se asignan ANTES de cargar el primer script, y eso no es
un detalle de orden: panel.js llama a Borrador.cargar() durante su
propia carga, asi que un doble inyectado despues llegaria tarde.

El <base> sale de la carpeta de test.html en vez de una ruta absoluta,
para que valga tanto servido por http como abierto con doble clic. Si
aun asi un script no carga, el error nombra el archivo y sugiere
arrancar un servidor -- sin eso, el fallo de file:// pareceria un
error del codigo que se esta probando.

Comprobado ademas que el iframe no filtra sus globales a la ventana de
las pruebas, y que limpia tambien cuando fn lanza.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Cubrir `Lista.pintar`

**Files:**
- Create: `tests/pruebas-lista-pintar.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: `ArnesDom.conElemento` (Tarea 1);
  `window.Lista.pintar(contenedor, proyectos, alMover, alBorrar)` y
  `window.Lista.ETIQUETAS`, que `test.html` ya carga desde `panel/js/lista.js`.
- Produces: nada. Es cobertura.

**Contexto que el implementador necesita:** `Lista.pintar` vacía el contenedor
con `innerHTML = ''` y reconstruye. Cada fila es un `<li class="fila">` con
`data-id` y `data-indice`, y dentro un `<span class="fila-titulo">` con
`«Título · Etiqueta»` y tres botones con `data-accion` `subir`, `bajar` y
`borrar`. «Subir» está deshabilitado en la primera fila y «bajar» en la última.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crea `tests/pruebas-lista-pintar.js`:

```js
/* El pintado de la lista del panel. Las tres piezas sin DOM de lista.js se
   prueban en pruebas-lista.js; esto es lo otro, que hasta ahora no tenía nada
   y es donde se construyen las filas y se enganchan los botones. */
describe('Lista.pintar', function () {

  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial' },
      { id: 'arena',   titulo: 'Arena',   categoria: 'videoclip' },
      { id: 'vidrio',  titulo: 'Vidrio',  categoria: 'foto-stills' }
    ];
  }

  function pintarEn(lista, alMover, alBorrar) {
    return function (ol) {
      Lista.pintar(ol, lista, alMover || function () {}, alBorrar || function () {});
      return ol;
    };
  }

  prueba('pinta una fila por proyecto', function () {
    var n = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelectorAll('li.fila').length;
    });
    igual(n, 3);
  });

  prueba('el título lleva la etiqueta de la categoría, no su identificador', function () {
    var texto = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelector('.fila-titulo').textContent;
    });
    igual(texto, 'Niebla · ' + Lista.ETIQUETAS['editorial']);
  });

  prueba('cada fila guarda su id y su índice', function () {
    var datos = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelectorAll('li.fila');
      return [f[0].dataset.id, f[0].dataset.indice, f[2].dataset.id, f[2].dataset.indice];
    });
    igual(datos, ['niebla', '0', 'vidrio', '2']);
  });

  /* Los extremos. Sin esto, «subir» en la primera fila llamaría a mover(0, -1)
     y el orden se corrompería en silencio. */
  prueba('subir está deshabilitado en la primera y bajar en la última', function () {
    var estados = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelectorAll('li.fila');
      return {
        subirPrimera: f[0].querySelector('[data-accion="subir"]').disabled,
        bajarPrimera: f[0].querySelector('[data-accion="bajar"]').disabled,
        subirUltima:  f[2].querySelector('[data-accion="subir"]').disabled,
        bajarUltima:  f[2].querySelector('[data-accion="bajar"]').disabled
      };
    });
    igual(estados, { subirPrimera: true, bajarPrimera: false,
                     subirUltima: false, bajarUltima: true });
  });

  prueba('con un solo proyecto, subir y bajar están los dos deshabilitados', function () {
    var estados = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn([{ id: 'solo', titulo: 'Solo', categoria: 'editorial' }])(ol);
      return [ol.querySelector('[data-accion="subir"]').disabled,
              ol.querySelector('[data-accion="bajar"]').disabled];
    });
    igual(estados, [true, true]);
  });

  /* Los aria-label nombran el proyecto: sin ellos, un lector de pantalla lee
     tres botones «flecha arriba» seguidos y no dice de qué fila son. */
  prueba('los botones se anuncian con el nombre del proyecto', function () {
    var etiquetas = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelector('li.fila');
      return [f.querySelector('[data-accion="subir"]').getAttribute('aria-label'),
              f.querySelector('[data-accion="borrar"]').getAttribute('aria-label')];
    });
    igual(etiquetas, ['Subir Niebla', 'Borrar Niebla']);
  });

  prueba('pulsar bajar pide mover de su índice al siguiente', function () {
    var visto = null;
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos(), function (desde, hasta) { visto = [desde, hasta]; })(ol);
      ol.querySelectorAll('li.fila')[1].querySelector('[data-accion="bajar"]').click();
    });
    igual(visto, [1, 2]);
  });

  prueba('pulsar borrar pide borrar ese id, con su título para el aviso', function () {
    var visto = null;
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos(), null, function (id, titulo) { visto = [id, titulo]; })(ol);
      ol.querySelectorAll('li.fila')[2].querySelector('[data-accion="borrar"]').click();
    });
    igual(visto, ['vidrio', 'Vidrio']);
  });

  /* Repintar es la operación normal del panel: cada movimiento reconstruye el
     <ol> entero. Si no vaciara, las filas se acumularían. */
  prueba('repintar reemplaza las filas, no las acumula', function () {
    var n = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      pintarEn(proyectos())(ol);
      return ol.querySelectorAll('li.fila').length;
    });
    igual(n, 3);
  });

  prueba('una lista vacía deja el contenedor vacío', function () {
    var html = ArnesDom.conElemento('<ol><li>basura previa</li></ol>', function (ol) {
      pintarEn([])(ol);
      return ol.innerHTML;
    });
    igual(html, '');
  });

  prueba('las filas se pueden arrastrar', function () {
    var arrastrable = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelector('li.fila').draggable;
    });
    cierto(arrastrable);
  });
});
```

- [ ] **Step 2: Añadir a `tests/test.html` y ver que fallan**

Añade después de `pruebas-lista.js`:

```html
<script src="pruebas-lista-pintar.js"></script>
```

Recarga con Ctrl+Shift+R.
Esperado: **11 rojas** — no porque el código esté mal, sino porque hasta ahora
nadie había mirado. Si alguna sale verde a la primera, léela: puede que esté
comprobando menos de lo que dice.

- [ ] **Step 3: Arreglar lo que se rompa**

Es cobertura de código que ya funciona en producción, así que lo esperable es que
las 11 pasen sin tocar `lista.js`. **Si alguna falla de verdad, has encontrado un
defecto**: párate, dilo, y arréglalo en un commit aparte del de las pruebas, con
el fallo descrito en el mensaje.

- [ ] **Step 4: Ver que pasan**

Esperado: **127 pasan, 0 fallan** (116 + 11).

- [ ] **Step 5: Comprobar que no son de mentira**

Rompe `panel/js/lista.js` de tres maneras, una a una, recargando entre cada una,
y anota cuántas se ponen en rojo:

1. En `fila()`, cambia `subir.disabled = indice === 0;` por `subir.disabled = false;`
2. En `pintar()`, borra la línea `contenedor.innerHTML = '';`
3. En `fila()`, cambia `nombre.textContent = p.titulo + ' · ' + (ETIQUETAS[p.categoria] || p.categoria);` por `nombre.textContent = p.titulo;`

Esperado: cada rotura pone en rojo **al menos una** prueba, y ninguna las pone
todas en verde. **Deshaz las tres** y confirma las 127.

- [ ] **Step 6: Commit**

```bash
git add tests/pruebas-lista-pintar.js tests/test.html
git commit -m "Cubrir Lista.pintar, que no tenia ni una prueba

Es donde se construyen las filas del panel y se enganchan los botones,
y hasta ahora solo estaban cubiertas las tres piezas sin DOM del mismo
archivo. Once comprobaciones: una fila por proyecto, la etiqueta de la
categoria en el titulo, data-id y data-indice, los dos extremos
(subir deshabilitado en la primera, bajar en la ultima), el caso de un
solo proyecto con los dos apagados, los aria-label que nombran el
proyecto, que pulsar llame a alMover y alBorrar con lo que toca, que
repintar reemplace en vez de acumular, y que las filas se arrastren.

Los extremos son los que mas valen: sin ellos, "subir" en la primera
fila llamaria a mover(0, -1) y el orden se corromperia sin dar ningun
error visible.

Comprobado que no son de mentira rompiendo lista.js de tres maneras
--quitar el disabled del extremo, quitar el innerHTML='' del repintado
y quitar la etiqueta del titulo--: cada rotura deja pruebas en rojo.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Cubrir `panel/js/panel.js`

**Files:**
- Create: `tests/pruebas-panel.js`
- Modify: `tests/test.html`
- Modify: `docs/estado-conocido.md`

**Interfaces:**
- Consumes: `ArnesDom.conDocumento` (Tarea 2); `describeAsync` de `arnes.js`.
- Produces: nada. Es cobertura, y cierra la deuda que la especificación señalaba.

**Contexto que el implementador necesita.** `panel/js/panel.js` es una IIFE que
llama a `init()` al final. `init()` busca por id `lista`, `aviso`, `titulo`,
`categoria` y `guardar`, más `#nuevo button[type="submit"]`; deja los controles
deshabilitados, rellena el `<select>` desde `ReglasContenido.CATEGORIAS` y llama
a `Borrador.cargar`. Necesita en `window`: `ReglasContenido`, `Identificador`,
`Orden`, `Lista` y `Borrador`. Los cuatro primeros son reales; **`Borrador` es el
que se dobla**. Borrar pasa por `window.confirm`, que también hay que doblar.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crea `tests/pruebas-panel.js`:

```js
/* panel/js/panel.js entero, dentro de un iframe. Es una IIFE que llama a init()
   al cargarse y no expone nada, así que no hay ninguna función a la que llamar
   desde fuera: la única forma de ejercitarlo es cargarlo con su HTML y sus
   dependencias puestas, y mirar el DOM resultante.

   Sólo se dobla `Borrador` —lo que habla con la red— y `confirm`. Lista, Orden,
   Identificador y ReglasContenido van de verdad: probar el panel contra dobles
   de sus propias piezas comprobaría el doble, no el panel. */
describeAsync('panel.js', function () {

  var HTML =
    '<main class="panel"><h1>Proyectos</h1>' +
    '<p id="aviso" role="status" aria-live="polite"></p>' +
    '<ol id="lista"></ol>' +
    '<form id="nuevo">' +
    '<input id="titulo" type="text"><select id="categoria"></select>' +
    '<button type="submit">Crear</button></form>' +
    '<button id="guardar" type="button">Guardar</button></main>';

  var MODULOS = ['../js/reglas-contenido.js', '../panel/js/identificador.js',
                 '../panel/js/orden.js', '../panel/js/lista.js',
                 '../panel/js/panel.js'];

  /* El doble de Borrador. `cargar` responde en el acto por omisión; con
     `diferido: true` guarda la respuesta y la suelta cuando la prueba quiera,
     que es la única forma de mirar el estado de arranque antes de que llegue
     el borrador. */
  function borradorFalso(opciones) {
    var o = opciones || {};
    var doble = {
      guardadas: [],
      soltarCarga: null,
      cargar: function (cb) {
        var responder = function () {
          cb(o.errorAlCargar ? null : (o.datos || { version: 3, proyectos: [] }),
             o.errorAlCargar || null);
        };
        if (o.diferido) { doble.soltarCarga = responder; return; }
        responder();
      },
      guardar: function (trabajo, cb) {
        doble.guardadas.push(JSON.parse(JSON.stringify(trabajo)));
        cb(o.respuestaAlGuardar || { version: trabajo.version + 1 },
           o.errorAlGuardar || null);
      }
    };
    return doble;
  }

  function dosProyectos() {
    return { version: 3, proyectos: [
      { id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'fotos', ficha: {}, piezas: [] },
      { id: 'arena',  titulo: 'Arena',  categoria: 'videoclip', tipo: 'video', ficha: {}, piezas: [] }
    ] };
  }

  function conPanel(doble, fn, confirmar) {
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Borrador: doble, confirm: confirmar || function () { return true; } },
      scripts: MODULOS
    }, fn);
  }

  // ---- Arranque -------------------------------------------------------

  return conPanel(borradorFalso({ diferido: true }), function (w, d) {

    prueba('arranca con los controles deshabilitados, antes de que llegue el borrador', function () {
      igual([d.getElementById('titulo').disabled,
             d.getElementById('categoria').disabled,
             d.getElementById('guardar').disabled], [true, true, true]);
    });

    prueba('el desplegable se llena con las categorías de ReglasContenido', function () {
      igual(d.getElementById('categoria').options.length,
            w.ReglasContenido.CATEGORIAS.length);
    });

  }).then(function () {

    // ---- La carga falla ----------------------------------------------

    return conPanel(borradorFalso({ errorAlCargar: 'No se ha podido cargar el contenido.' }),
      function (w, d) {
        prueba('si la carga falla, lo dice', function () {
          igual(d.getElementById('aviso').textContent,
                'No se ha podido cargar el contenido.');
        });
        /* El caso real: la sesión de Access caducó de un día para otro. Si los
           controles se quedaran activos, la primera pulsación reventaría contra
           un `trabajo` que sigue siendo null. */
        prueba('y los controles se quedan apagados', function () {
          igual(d.getElementById('guardar').disabled, true);
        });
      });

  }).then(function () {

    // ---- Carga correcta ----------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      prueba('pinta una fila por proyecto', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      prueba('y activa los controles', function () {
        igual([d.getElementById('titulo').disabled,
               d.getElementById('guardar').disabled], [false, false]);
      });
    });

  }).then(function () {

    // ---- Crear --------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.getElementById('titulo').value = 'Salitre';
      d.getElementById('categoria').value = 'editorial';
      d.getElementById('nuevo').dispatchEvent(new w.Event('submit', { cancelable: true }));

      prueba('crear añade una fila', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 3);
      });
      prueba('y recuerda que hay que guardar', function () {
        cierto(d.getElementById('aviso').textContent.indexOf('Recuerda guardar') !== -1,
               d.getElementById('aviso').textContent);
      });
      prueba('y vacía el campo para el siguiente', function () {
        igual(d.getElementById('titulo').value, '');
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.getElementById('titulo').value = 'Niebla';   // ya existe
      d.getElementById('categoria').value = 'editorial';
      d.getElementById('nuevo').dispatchEvent(new w.Event('submit', { cancelable: true }));

      prueba('un título que repite identificador no crea nada', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      prueba('y el aviso explica por qué', function () {
        cierto(d.getElementById('aviso').textContent.length > 0);
      });
    });

  }).then(function () {

    // ---- Borrar -------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelector('#lista li.fila [data-accion="borrar"]').click();
      prueba('borrar quita la fila cuando se confirma', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 1);
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelector('#lista li.fila [data-accion="borrar"]').click();
      prueba('y no la quita cuando se cancela', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
    }, function () { return false; });

  }).then(function () {

    // ---- El foco tras mover -------------------------------------------
    /* Lo que nunca ha tenido cobertura y por lo que existe este arnés. Tras
       mover, Lista.pintar reconstruye el <ol> entero: el botón que tenía el
       foco deja de existir y el navegador lo manda a <body>. panel.js lo
       devuelve buscando por id de proyecto. */

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelectorAll('#lista li.fila')[1].querySelector('[data-accion="subir"]').click();

      prueba('mover cambia el orden', function () {
        igual([].map.call(d.querySelectorAll('#lista li.fila'),
                          function (f) { return f.dataset.id; }),
              ['arena', 'niebla']);
      });

      prueba('el foco vuelve al mismo botón de la misma fila, no a <body>', function () {
        var activo = d.activeElement;
        cierto(activo && activo.dataset.accion === 'subir',
               'foco en ' + (activo ? activo.tagName + '/' + activo.dataset.accion : 'nada'));
        igual(activo.closest('li.fila').dataset.id, 'arena');
      });
    });

  }).then(function () {

    /* El borde: al subir a la primera posición, «subir» queda deshabilitado, y
       un botón deshabilitado no puede recibir el foco. panel.js usa el otro
       botón de la misma fila. Sin esta prueba, el foco se perdería en
       silencio justo en el movimiento más común. */
    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelectorAll('#lista li.fila')[1].querySelector('[data-accion="subir"]').click();
      prueba('si el botón queda deshabilitado, el foco va al otro de esa fila', function () {
        igual(d.activeElement.dataset.accion, 'bajar');
      });
    });

  }).then(function () {

    // ---- Guardar y el conflicto ---------------------------------------

    var alGuardar = borradorFalso({ datos: dosProyectos() });
    return conPanel(alGuardar, function (w, d) {
      d.getElementById('guardar').click();

      prueba('guardar manda el trabajo entero, con su versión', function () {
        igual(alGuardar.guardadas.length, 1);
        igual(alGuardar.guardadas[0].version, 3);
        igual(alGuardar.guardadas[0].proyectos.map(function (p) { return p.id; }),
              ['niebla', 'arena']);
      });
      prueba('y avisa de que se guardó', function () {
        igual(d.getElementById('aviso').textContent, 'Guardado.');
      });
      prueba('y se queda con la versión nueva que devuelve el servidor', function () {
        d.getElementById('guardar').click();
        igual(alGuardar.guardadas[1].version, 4,
              'si no se actualizara, el segundo guardado mandaría la versión vieja '
              + 'y el servidor contestaría 409 sin motivo');
      });
    });

  }).then(function () {

    var doble = borradorFalso({ datos: dosProyectos(),
                                respuestaAlGuardar: { conflicto: true, guardada: 9 } });
    return conPanel(doble, function (w, d) {
      d.getElementById('guardar').click();

      /* Si «Guardar» siguiera activo, volver a pulsarlo mandaría la misma
         versión vieja y el servidor contestaría 409 en bucle. */
      prueba('un conflicto deshabilita Guardar', function () {
        igual(d.getElementById('guardar').disabled, true);
      });
      prueba('y el aviso dice la versión del servidor y que hay que recargar', function () {
        var t = d.getElementById('aviso').textContent;
        cierto(t.indexOf('9') !== -1, t);
        cierto(t.toLowerCase().indexOf('recarga') !== -1, t);
      });
    });
  });
});
```

- [ ] **Step 2: Añadir a `tests/test.html` y ver que fallan**

Añade como última línea de pruebas, antes de `pruebas-contenido-real.js`:

```html
<script src="pruebas-panel.js"></script>
```

Recarga con Ctrl+Shift+R. Esperado: la sección entera en rojo.

- [ ] **Step 3: Hacerlas pasar**

Es cobertura de código en producción: lo esperable es que pasen sin tocar
`panel.js`. **Si alguna falla de verdad, es un defecto encontrado**: párate,
dilo, y arréglalo en un commit aparte con el fallo descrito.

Esperado al terminar: **148 pasan, 0 fallan** (127 + 21). Anota el número exacto: hace falta
para la documentación del paso siguiente.

- [ ] **Step 4: Comprobar que no son de mentira**

Rompe `panel/js/panel.js` de tres maneras, una a una:

1. En `init()`, borra la línea `activarControles(false);`
2. En `enfocarTrasRepintar()`, borra el bloque `if (boton && !boton.disabled) { boton.focus(); return; }`
3. En `guardar()`, borra la línea `elGuardar.disabled = true;` del conflicto

Esperado: cada rotura deja al menos una prueba en rojo. **Deshaz las tres.**

- [ ] **Step 5: Actualizar `docs/estado-conocido.md`**

En la sección «Cómo se prueba», sustituye el párrafo que dice que
`panel/js/panel.js` no tiene ninguna prueba automática. Escribe lo que ahora es
cierto: cuántas comprobaciones corre `tests/test.html`, que `Lista.pintar` y
`panel.js` ya están cubiertos con el arnés de DOM, y **qué sigue sin cubrirse** —
el arrastrar y soltar de verdad, que necesita eventos de arrastre reales del
navegador, y lo que sólo se juzga mirando.

Si en la Tarea 2, paso 5, viste que el nivel del iframe no funciona con doble
clic, dilo aquí: que esa sección necesita servidor y cómo arrancarlo.

- [ ] **Step 6: Commit**

```bash
git add tests/pruebas-panel.js tests/test.html docs/estado-conocido.md
git commit -m "Cubrir panel.js, que era el ultimo sin ninguna prueba

Es la pieza que cose el panel entero -- el estado, el repintado y la
vuelta del foco -- y no tenia cobertura porque es una IIFE que llama a
init() al cargarse y no expone nada. Ahora se carga entera en un
iframe con su HTML y con Borrador y confirm doblados; Lista, Orden,
Identificador y ReglasContenido van de verdad, porque probar el panel
contra dobles de sus propias piezas comprobaria el doble y no el panel.

La que mas falta hacia: que tras mover una fila el foco vuelva al mismo
boton de la misma fila. Lista.pintar reconstruye el <ol> entero, asi
que el boton que tenia el foco deja de existir y el navegador lo manda
a <body>. Y el borde de al lado: al subir a la primera posicion ese
boton queda deshabilitado y no puede recibir el foco, asi que panel.js
usa el otro de la misma fila. Sin prueba, el foco se perdia en
silencio justo en el movimiento mas comun.

Tambien el arranque deshabilitado antes de que llegue el borrador, el
fallo de carga que deja los controles apagados, crear con id repetido,
borrar confirmado y cancelado, y el conflicto que apaga Guardar.

Comprobado que no son de mentira rompiendo panel.js de tres maneras.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-review de este plan

**Cobertura de la especificación.** Este plan cubre una sola frase de la
especificación —«El arnés de DOM entra en este trabajo»— y la deuda que nombra
(`Lista.pintar` y `panel/js/panel.js`). Todo lo demás de la especificación queda
explícitamente para 4b y 4c, listados arriba. **No hay ningún requisito de este
bloque sin tarea.**

**Consistencia de nombres.** `ArnesDom.conElemento(html, fn)` y
`ArnesDom.conDocumento(opciones, fn)` se definen en las Tareas 1 y 2 y se usan
con esas firmas exactas en las Tareas 3 y 4. `opciones` es siempre
`{ html, globales, scripts }`.

**Riesgo conocido.** El paso 5 de la Tarea 2 puede descubrir que el nivel del
iframe no funciona con `file://`. Si es así, no invalida el plan, pero sí obliga
a documentarlo: el arnés dejaría de abrirse entero con doble clic, que es como
`docs/estado-conocido.md` dice hoy que se prueba.
