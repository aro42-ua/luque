# Visor de proyecto y galería filtrable — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir cada foto de la galería espacial en un proyecto que se abre a pantalla completa, se recorre y se amplía, y convertir el menú de categorías en un filtro que recompone el lienzo.

**Architecture:** El `index.html` monolítico se parte en módulos de una responsabilidad cada uno, cargados con etiquetas `<script src>` clásicas. Cada módulo separa su lógica pura (calculable, comprobable) de su capa de DOM, que solo se toca desde un `init()` explícito. Un router mínimo sobre el fragmento de la URL es la única fuente de verdad sobre qué está abierto; la galería y el visor reaccionan a él y nunca se llaman entre sí.

**Tech Stack:** HTML, CSS y JavaScript sin transpilar. GSAP 3.12.5 y ScrollTrigger por CDN (ya presentes). Sin Node, sin npm, sin proceso de build.

## Global Constraints

- **Sin servidor.** La web debe funcionar abriendo `index.html` con doble clic. Prohibido `fetch`, `import`/`export` y `type="module"`: el navegador los bloquea sobre `file://`.
- **Sin dependencias nuevas.** Solo GSAP y ScrollTrigger, ya cargados por CDN.
- **JavaScript ES5-compatible en los módulos de lógica pura** (`datos.js`, `router.js`, `layout-filtrado.js`, `visor-estado.js`) para que el arnés pueda cargarlos sin sorpresas. En los módulos de DOM se permite sintaxis moderna.
- **Ningún archivo de `js/` supera las 300 líneas.** Si `visor.js` las rebasa, la lupa sale a `js/visor-lupa.js`.
- **Animar solo `transform` y `opacity`.** Nunca `left`, `top`, `width` ni `height` en transiciones.
- **Idioma del código en español**, igual que los comentarios actuales del archivo: `proyectos`, `posicionesCompactas`, `abrirVisor`.
- **Paleta fija:** amarillo `#FFFF00`, negro `#0a0a0a`, gris oscuro `#1c1c1c`. Ya están como variables CSS `--yellow`, `--black`, `--grey-dark`.
- **Curva y tempo:** `cubic-bezier(.2,.7,.2,1)`. La transición del visor dura 620 ms.
- **`prefers-reduced-motion: reduce`** sustituye cualquier desplazamiento o escalado por un fundido de 200 ms.
- **Categorías válidas**, exactamente estas cuatro cadenas: `foto-stills`, `editorial`, `videoclip`, `cortometraje`.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Solo marcado. Sin `<style>` ni `<script>` en línea salvo las etiquetas de carga. |
| `css/luque.css` | Todos los estilos, los actuales y los nuevos. |
| `js/datos.js` | El array `PROYECTOS`, la lista `CATEGORIAS` y `validarDatos()`. Sin DOM. |
| `js/router.js` | `parsearRuta()` pura, más un `Router` con suscriptores. |
| `js/layout-filtrado.js` | `posicionesCompactas()` y `altoLienzoFiltrado()`. Sin DOM. |
| `js/visor-estado.js` | Máquina de estado del visor: capas de `Esc`, índice anterior y siguiente. Sin DOM. |
| `js/galeria.js` | Construye el lienzo desde los datos, el paneo y el filtrado. |
| `js/visor.js` | El visor: marco, navegación, ficha, vídeo y transición. |
| `js/visor-lupa.js` | La lupa, si `visor.js` se acerca al límite de líneas. |
| `js/cursor.js` | El cursor-visor y la cesión de sus esquinas al visor. |
| `js/hero.js` | Preloader y secuencia de entrada. |
| `tests/test.html` | Arnés de pruebas. Se abre con doble clic. |
| `tests/arnes.js` | `describe`, `prueba`, `igual`, `cierto` y el resumen final. |
| `tests/pruebas-*.js` | Un archivo por módulo de lógica pura. |

Orden de carga en `index.html`: `datos.js`, `router.js`, `layout-filtrado.js`, `visor-estado.js`, `cursor.js`, `galeria.js`, `visor.js`, `hero.js`. Cada módulo se expone como un objeto global (`window.Datos`, `window.Galeria`…) y ninguno hace nada al cargarse salvo definir cosas.

---

### Task 1: Andamiaje — partir el monolito y montar el arnés

Esta tarea no cambia ni un píxel de lo que se ve. Su entregable es el mismo sitio web, reorganizado, con un arnés de pruebas que funciona.

**Files:**
- Create: `css/luque.css`, `js/hero.js`, `js/cursor.js`, `js/galeria.js`
- Create: `tests/test.html`, `tests/arnes.js`, `tests/pruebas-arnes.js`
- Modify: `index.html` (eliminar el bloque `<style>` de las líneas 7-466 y el bloque `<script>` de las líneas 753-1090)

**Interfaces:**
- Consumes: nada.
- Produces: `window.Arnes` con `describe(nombre, fn)`, `prueba(nombre, fn)`, `igual(actual, esperado, mensaje)`, `cierto(valor, mensaje)`. Los tres módulos de DOM exponen `window.Hero.init()`, `window.Cursor.init()` y `window.Galeria.init()`.

- [ ] **Step 1: Escribir el arnés de pruebas**

Crear `tests/arnes.js`:

```js
(function (global) {
  var salida = null;
  var pasadas = 0;
  var fallidas = 0;

  function asegurarSalida() {
    if (!salida) salida = document.getElementById('salida');
    return salida;
  }

  function describe(nombre, fn) {
    var h = document.createElement('h2');
    h.textContent = nombre;
    asegurarSalida().appendChild(h);
    fn();
  }

  function prueba(nombre, fn) {
    var linea = document.createElement('div');
    try {
      fn();
      linea.className = 'ok';
      linea.textContent = 'PASA   ' + nombre;
      pasadas++;
    } catch (e) {
      linea.className = 'fallo';
      linea.textContent = 'FALLA  ' + nombre + ' — ' + e.message;
      fallidas++;
    }
    asegurarSalida().appendChild(linea);
  }

  function igual(actual, esperado, mensaje) {
    var a = JSON.stringify(actual);
    var e = JSON.stringify(esperado);
    if (a !== e) {
      throw new Error((mensaje ? mensaje + ': ' : '') + 'esperaba ' + e + ' y recibió ' + a);
    }
  }

  function cierto(valor, mensaje) {
    if (!valor) throw new Error(mensaje || 'esperaba un valor verdadero');
  }

  function resumen() {
    var p = document.createElement('p');
    p.className = fallidas === 0 ? 'ok' : 'fallo';
    p.textContent = '——— ' + pasadas + ' pasan, ' + fallidas + ' fallan ———';
    asegurarSalida().appendChild(p);
  }

  global.Arnes = { describe: describe, prueba: prueba, igual: igual, cierto: cierto, resumen: resumen };
  global.describe = describe;
  global.prueba = prueba;
  global.igual = igual;
  global.cierto = cierto;
})(window);
```

- [ ] **Step 2: Escribir la página del arnés y una prueba que compruebe el propio arnés**

Crear `tests/test.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Pruebas — LUQUE!</title>
<style>
  body{ font-family:ui-monospace,Consolas,monospace; background:#0a0a0a; color:#ddd; padding:2rem; line-height:1.7; }
  h1{ color:#FFFF00; font-size:16px; }
  h2{ color:#FFFF00; font-size:13px; margin:1.6rem 0 .4rem; }
  .ok{ color:#7CFC00; }
  .fallo{ color:#FF5555; }
  p{ margin-top:1.6rem; font-weight:bold; }
</style>
</head>
<body>
<h1>Pruebas — LUQUE!</h1>
<div id="salida"></div>

<script src="arnes.js"></script>
<script src="pruebas-arnes.js"></script>
<script>window.Arnes.resumen();</script>
</body>
</html>
```

Crear `tests/pruebas-arnes.js`:

```js
describe('El arnés', function () {
  prueba('igual acepta valores idénticos', function () {
    igual(2 + 2, 4);
  });

  prueba('igual compara en profundidad', function () {
    igual({ x: 1, y: [2, 3] }, { x: 1, y: [2, 3] });
  });

  prueba('igual rechaza valores distintos', function () {
    var lanzo = false;
    try { igual(1, 2); } catch (e) { lanzo = true; }
    cierto(lanzo, 'igual debería haber lanzado');
  });
});
```

- [ ] **Step 3: Abrir el arnés y comprobar que las tres pruebas pasan**

Abrir `tests/test.html` con doble clic.
Esperado: tres líneas verdes bajo «El arnés» y el resumen `——— 3 pasan, 0 fallan ———`.

- [ ] **Step 4: Extraer el CSS**

Mover el contenido íntegro del bloque `<style>` de `index.html` (líneas 7-466, sin las etiquetas `<style>` y `</style>`) a `css/luque.css`, sin tocar ni una regla. En `index.html`, sustituir todo el bloque por:

```html
<link rel="stylesheet" href="css/luque.css">
```

- [ ] **Step 5: Extraer el JavaScript en tres módulos**

Del bloque `<script>` de `index.html` (líneas 753-1090), repartir:

- Secciones 1 y 2 (preloader, secuencia del hero, snap) → `js/hero.js`
- Sección 4 (`initSpatialGallery`) → `js/galeria.js`
- Sección 5 (`initCustomCursor`) → `js/cursor.js`
- Sección 3 (revelado del navbar) → `js/galeria.js`

Cada archivo envuelve su contenido en un objeto global con un `init()` explícito:

```js
window.Cursor = (function () {
  var cursorEl = null;
  var bboxImg = null;
  var estado = 'default';

  function raf() { /* … */ }

  function init() {
    cursorEl = document.getElementById('customCursor');
    // … solo búsqueda de elementos y enganche de eventos
  }

  return { init: init };
})();
```

**Esto no es cosmético y condiciona todas las tareas siguientes.** Las variables de estado y las funciones auxiliares van al ámbito del módulo, **no dentro de `init()`**. En `init()` solo queda buscar elementos del DOM y enganchar eventos.

En concreto, al mover `initSpatialGallery` a `galeria.js` hay que sacar del `init()` y subir al ámbito del módulo: `stage`, `canvas`, `stageW`, `stageH`, `canvasW`, `canvasH`, `minX`, `minY`, `curX`, `curY`, `targetX`, `targetY`, `clamp()`, `measure()` y `loop()`. Las Tasks 6, 9 y 14 añaden funciones nuevas que necesitan verlas. Y en `cursor.js`, `cursorEl` y `bboxImg` tienen que quedar accesibles para las funciones que añade la Task 9.

Si se deja todo dentro de `init()`, esas tareas fallarán con errores de variable no definida y habrá que rehacer esta separación a mitad del trabajo.

Al final de `index.html`, después de las etiquetas de GSAP, sustituir el bloque `<script>` completo por:

```html
<script src="js/hero.js"></script>
<script src="js/cursor.js"></script>
<script src="js/galeria.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);
  window.Hero.init();
  window.Cursor.init();
  window.Galeria.init();
</script>
```

La llamada a `gsap.registerPlugin` sale de `hero.js` y sube aquí, porque ahora la comparten varios módulos.

- [ ] **Step 6: Verificar a mano que nada ha cambiado**

Abrir `index.html` con doble clic y comprobar, en este orden:

1. El logo de carga salta entre cuatro fotogramas durante algo más de un segundo.
2. Al desaparecer, aparece el logo «Fin de carga» con la palabra SCROLL debajo.
3. Al bajar, ese logo se funde en el logotipo grande de LUQUE!.
4. Al seguir bajando, la galería sube y tapa el hero por completo, sin que se vean las dos secciones cortadas a la vez.
5. La píldora del navbar aparece al llegar a la galería.
6. El cursor del sistema no se ve; en su lugar hay un visor pequeño.
7. Al pasar sobre una foto, las cuatro esquinas se abren y encuadran esa foto.
8. Al mover el ratón por la galería, el lienzo se desplaza en dirección contraria con inercia.
9. La consola del navegador no muestra ningún error.

Si algo de esto falla, la extracción está mal: comparar con `git show HEAD:index.html`.

- [ ] **Step 7: Commit**

```bash
git add css js tests index.html
git commit -m "Partir el index.html en módulos y añadir el arnés de pruebas

Los estilos pasan a css/luque.css y el JavaScript se reparte en
js/hero.js, js/cursor.js y js/galeria.js, cada uno con un init()
explícito. Se añade tests/test.html, que corre en el navegador sin
necesidad de Node.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: El modelo de datos

**Files:**
- Create: `js/datos.js`, `tests/pruebas-datos.js`
- Modify: `tests/test.html` (añadir las dos etiquetas `<script>`)

**Interfaces:**
- Consumes: `window.Arnes` de la Task 1.
- Produces: `window.Datos` con:
  - `Datos.CATEGORIAS` → `['foto-stills','editorial','videoclip','cortometraje']`
  - `Datos.PROYECTOS` → array de objetos `{ id, titulo, categoria, portada, ficha:{cliente,anio,camara,optica}, piezas?, video?, pos:{x,y,w} }`
  - `Datos.validarDatos(proyectos, categorias)` → array de cadenas; vacío si todo está bien
  - `Datos.porId(id)` → el proyecto o `null`
  - `Datos.porCategoria(categoria)` → array de proyectos

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-datos.js`:

```js
describe('validarDatos', function () {
  var CATS = ['foto-stills', 'editorial'];

  function base(extra) {
    var p = { id: 'uno', titulo: 'Uno', categoria: 'editorial', portada: 'a.jpg',
              piezas: ['a.jpg'], pos: { x: 1, y: 1, w: 10 } };
    for (var k in extra) p[k] = extra[k];
    return p;
  }

  prueba('un proyecto correcto no da problemas', function () {
    igual(Datos.validarDatos([base()], CATS), []);
  });

  prueba('detecta identificadores duplicados', function () {
    var r = Datos.validarDatos([base(), base()], CATS);
    igual(r.length, 1);
    cierto(r[0].indexOf('duplicado') !== -1, 'debería mencionar el duplicado');
  });

  prueba('detecta un id que choca con una categoría', function () {
    var r = Datos.validarDatos([base({ id: 'editorial' })], CATS);
    cierto(r[0].indexOf('choca') !== -1, 'debería avisar del choque');
  });

  prueba('detecta una categoría desconocida', function () {
    var r = Datos.validarDatos([base({ categoria: 'boda' })], CATS);
    cierto(r[0].indexOf('desconocida') !== -1, 'debería avisar de la categoría');
  });

  prueba('detecta piezas y video a la vez', function () {
    var r = Datos.validarDatos([base({ video: { src: 'v.mp4' } })], CATS);
    cierto(r[0].indexOf('a la vez') !== -1, 'debería avisar del conflicto');
  });

  prueba('detecta un proyecto sin piezas ni video', function () {
    var p = base();
    delete p.piezas;
    var r = Datos.validarDatos([p], CATS);
    cierto(r[0].indexOf('sin piezas') !== -1, 'debería avisar de que está vacío');
  });
});

describe('Los datos reales', function () {
  prueba('no tienen ningún problema', function () {
    igual(Datos.validarDatos(Datos.PROYECTOS, Datos.CATEGORIAS), []);
  });

  prueba('hay doce proyectos', function () {
    igual(Datos.PROYECTOS.length, 12);
  });

  prueba('hay tres por categoría', function () {
    Datos.CATEGORIAS.forEach(function (c) {
      igual(Datos.porCategoria(c).length, 3, c);
    });
  });

  prueba('porId encuentra y devuelve null si no existe', function () {
    igual(Datos.porId(Datos.PROYECTOS[0].id).id, Datos.PROYECTOS[0].id);
    igual(Datos.porId('no-existe'), null);
  });
});
```

- [ ] **Step 2: Añadir los scripts al arnés y comprobar que las pruebas fallan**

En `tests/test.html`, antes de `pruebas-arnes.js`, añadir `<script src="../js/datos.js"></script>`, y después de él `<script src="pruebas-datos.js"></script>`.

Abrir `tests/test.html`.
Esperado: las pruebas de datos fallan con `Datos is not defined`.

- [ ] **Step 3: Escribir `js/datos.js`**

Las doce posiciones se copian tal cual del `index.html` actual (líneas 695-733). Los títulos y fichas son de relleno hasta que haya trabajo real; las rutas apuntan a picsum igual que ahora.

```js
window.Datos = (function () {
  var CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

  function serie(semilla, cuantas) {
    var piezas = [];
    for (var i = 1; i <= cuantas; i++) {
      piezas.push('https://picsum.photos/seed/' + semilla + i + '/1600/2000');
    }
    return piezas;
  }

  var PROYECTOS = [
    { id:'niebla',   titulo:'Niebla',   categoria:'foto-stills',  pos:{x:4,   y:8,   w:20},
      ficha:{cliente:'Personal',   anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      piezas: serie('luque1', 6) },
    { id:'arena',    titulo:'Arena',    categoria:'foto-stills',  pos:{x:30,  y:55,  w:16},
      ficha:{cliente:'Personal',   anio:2024, camara:'Alexa Mini', optica:'Cooke S4'},
      piezas: serie('luque2', 5) },
    { id:'vidrio',   titulo:'Vidrio',   categoria:'foto-stills',  pos:{x:58,  y:14,  w:19},
      ficha:{cliente:'Personal',   anio:2024, camara:'Sony FX3',   optica:'Zeiss Super Speed'},
      piezas: serie('luque3', 7) },

    { id:'bruma',    titulo:'Bruma',    categoria:'editorial',    pos:{x:88,  y:40,  w:17},
      ficha:{cliente:'Vogue ES',   anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      piezas: serie('luque4', 8) },
    { id:'salitre',  titulo:'Salitre',  categoria:'editorial',    pos:{x:118, y:70,  w:20},
      ficha:{cliente:'Neo2',       anio:2025, camara:'Sony FX3',   optica:'Sigma Art'},
      piezas: serie('luque5', 6) },
    { id:'oleaje',   titulo:'Oleaje',   categoria:'editorial',    pos:{x:148, y:10,  w:16},
      ficha:{cliente:'Metal',      anio:2023, camara:'Alexa Mini', optica:'Cooke S4'},
      piezas: serie('luque6', 5) },

    { id:'reflejo',  titulo:'Reflejo',  categoria:'videoclip',    pos:{x:176, y:48,  w:19},
      ficha:{cliente:'Amaia',      anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      video: { src:'video/reflejo.mp4', poster:'https://picsum.photos/seed/luque7/1600/900' } },
    { id:'estatica', titulo:'Estática', categoria:'videoclip',    pos:{x:8,   y:95,  w:18},
      ficha:{cliente:'Rusowsky',   anio:2024, camara:'Sony FX3',   optica:'Sigma Art'},
      video: { src:'video/estatica.mp4', poster:'https://picsum.photos/seed/luque8/1600/900' } },
    { id:'humo',     titulo:'Humo',     categoria:'videoclip',    pos:{x:206, y:85,  w:17},
      ficha:{cliente:'Ralphie',    anio:2024, camara:'Alexa Mini', optica:'Cooke S4'},
      video: { src:'video/humo.mp4', poster:'https://picsum.photos/seed/luque9/1600/900' } },

    { id:'ceniza',   titulo:'Ceniza',   categoria:'cortometraje', pos:{x:46,  y:100, w:20},
      ficha:{cliente:'ECAM',       anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      video: { src:'video/ceniza.mp4', poster:'https://picsum.photos/seed/luque10/1600/900' } },
    { id:'raiz',     titulo:'Raíz',     categoria:'cortometraje', pos:{x:96,  y:120, w:16},
      ficha:{cliente:'Autofinanciado', anio:2023, camara:'Sony FX3', optica:'Sigma Art'},
      video: { src:'video/raiz.mp4', poster:'https://picsum.photos/seed/luque11/1600/900' } },
    { id:'litoral',  titulo:'Litoral',  categoria:'cortometraje', pos:{x:168, y:110, w:19},
      ficha:{cliente:'Canal Sur',  anio:2022, camara:'Alexa Mini', optica:'Cooke S4'},
      video: { src:'video/litoral.mp4', poster:'https://picsum.photos/seed/luque12/1600/900' } }
  ];

  PROYECTOS.forEach(function (p) {
    if (!p.portada) p.portada = p.piezas ? p.piezas[0] : p.video.poster;
  });

  function validarDatos(proyectos, categorias) {
    var problemas = [];
    var vistos = {};
    proyectos.forEach(function (p) {
      if (vistos[p.id]) problemas.push('id duplicado: ' + p.id);
      vistos[p.id] = true;
      if (categorias.indexOf(p.id) !== -1) problemas.push('el id choca con una categoría: ' + p.id);
      if (categorias.indexOf(p.categoria) === -1) problemas.push('categoría desconocida en ' + p.id + ': ' + p.categoria);
      if (p.piezas && p.video) problemas.push('piezas y video a la vez en ' + p.id);
      if (!p.piezas && !p.video) problemas.push('sin piezas ni video: ' + p.id);
    });
    return problemas;
  }

  function porId(id) {
    for (var i = 0; i < PROYECTOS.length; i++) {
      if (PROYECTOS[i].id === id) return PROYECTOS[i];
    }
    return null;
  }

  function porCategoria(categoria) {
    return PROYECTOS.filter(function (p) { return p.categoria === categoria; });
  }

  return {
    CATEGORIAS: CATEGORIAS,
    PROYECTOS: PROYECTOS,
    validarDatos: validarDatos,
    porId: porId,
    porCategoria: porCategoria
  };
})();
```

- [ ] **Step 4: Volver a abrir el arnés y comprobar que pasa todo**

Abrir `tests/test.html`.
Esperado: `——— 13 pasan, 0 fallan ———`.

- [ ] **Step 5: Commit**

```bash
git add js/datos.js tests/pruebas-datos.js tests/test.html
git commit -m "Añadir el modelo de datos de los proyectos

Los doce proyectos pasan a js/datos.js con categoría, ficha técnica,
serie o vídeo y su posición en el lienzo. validarDatos avisa de ids
duplicados, choques con nombres de categoría y proyectos vacíos.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: El enrutado

**Files:**
- Create: `js/router.js`, `tests/pruebas-router.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: `Datos.CATEGORIAS`.
- Produces: `window.Router` con:
  - `Router.parsearRuta(fragmento, categorias, ids)` → `{ tipo:'todos'|'categoria'|'proyecto', valor:string|null }`
  - `Router.rutaActual()` → el mismo objeto, leyendo `location.hash`
  - `Router.ir(tipo, valor)` → escribe `location.hash`; `ir('todos')` lo vacía
  - `Router.alCambiar(fn)` → registra un suscriptor; se le llama con la ruta en cada cambio
  - `Router.init()` → engancha `hashchange` y avisa una vez con la ruta inicial

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-router.js`:

```js
describe('parsearRuta', function () {
  var CATS = ['editorial', 'videoclip'];
  var IDS = ['bruma', 'humo'];

  function r(f) { return Router.parsearRuta(f, CATS, IDS); }

  prueba('sin fragmento devuelve todos', function () {
    igual(r(''), { tipo: 'todos', valor: null });
  });

  prueba('un fragmento vacío devuelve todos', function () {
    igual(r('#'), { tipo: 'todos', valor: null });
    igual(r('#/'), { tipo: 'todos', valor: null });
  });

  prueba('reconoce una categoría', function () {
    igual(r('#/editorial'), { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('reconoce un proyecto', function () {
    igual(r('#/bruma'), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('tolera que falte la barra', function () {
    igual(r('#editorial'), { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('tolera que falte la almohadilla', function () {
    igual(r('bruma'), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('la categoría gana al proyecto con el mismo nombre', function () {
    igual(Router.parsearRuta('#/editorial', ['editorial'], ['editorial']),
          { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('un fragmento desconocido cae en todos', function () {
    igual(r('#/inventado'), { tipo: 'todos', valor: null });
  });

  prueba('ignora espacios sobrantes', function () {
    igual(r('#/  bruma  '), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('no se rompe con null ni undefined', function () {
    igual(r(null), { tipo: 'todos', valor: null });
    igual(r(undefined), { tipo: 'todos', valor: null });
  });
});
```

- [ ] **Step 2: Añadir los scripts al arnés y comprobar que fallan**

En `tests/test.html`, añadir `<script src="../js/router.js"></script>` tras `datos.js`, y `<script src="pruebas-router.js"></script>` tras `pruebas-datos.js`.

Abrir `tests/test.html`.
Esperado: las diez pruebas del router fallan con `Router is not defined`.

- [ ] **Step 3: Escribir `js/router.js`**

```js
window.Router = (function () {
  var suscriptores = [];

  function parsearRuta(fragmento, categorias, ids) {
    var limpio = String(fragmento == null ? '' : fragmento).replace(/^#/, '').replace(/^\//, '').trim();
    if (!limpio) return { tipo: 'todos', valor: null };
    if (categorias.indexOf(limpio) !== -1) return { tipo: 'categoria', valor: limpio };
    if (ids.indexOf(limpio) !== -1) return { tipo: 'proyecto', valor: limpio };
    return { tipo: 'todos', valor: null };
  }

  function idsProyecto() {
    return window.Datos.PROYECTOS.map(function (p) { return p.id; });
  }

  function rutaActual() {
    return parsearRuta(location.hash, window.Datos.CATEGORIAS, idsProyecto());
  }

  function ir(tipo, valor) {
    var destino = (tipo === 'todos') ? ' ' : '#/' + valor;
    if (tipo === 'todos') {
      history.replaceState(null, '', location.pathname + location.search);
      avisar();
    } else if (location.hash !== destino) {
      location.hash = destino;
    } else {
      avisar();
    }
  }

  function avisar() {
    var ruta = rutaActual();
    suscriptores.forEach(function (fn) { fn(ruta); });
  }

  function alCambiar(fn) { suscriptores.push(fn); }

  function init() {
    window.addEventListener('hashchange', avisar);
    avisar();
  }

  return {
    parsearRuta: parsearRuta,
    rutaActual: rutaActual,
    ir: ir,
    alCambiar: alCambiar,
    init: init
  };
})();
```

Nota sobre `ir('todos')`: se usa `history.replaceState` en lugar de vaciar `location.hash`, porque asignar una cadena vacía al hash deja una almohadilla suelta en la barra de direcciones y no dispara `hashchange` de forma fiable. Por eso se avisa a mano.

- [ ] **Step 4: Volver a abrir el arnés y comprobar que pasa todo**

Abrir `tests/test.html`.
Esperado: `——— 23 pasan, 0 fallan ———`.

- [ ] **Step 5: Commit**

```bash
git add js/router.js tests/pruebas-router.js tests/test.html
git commit -m "Añadir el enrutado por fragmento de URL

parsearRuta traduce el fragmento a todos, categoría o proyecto, dando
prioridad a las categorías para que un id que choque nunca gane.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: El cálculo de la composición filtrada

**Files:**
- Create: `js/layout-filtrado.js`, `tests/pruebas-layout.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: nada.
- Produces: `window.LayoutFiltrado` con:
  - `LayoutFiltrado.RANURAS` → array de seis `{x,y,w}` en unidades `vw`
  - `LayoutFiltrado.ANCHO` → `100`, el ancho en `vw` del lienzo mientras hay filtro
  - `LayoutFiltrado.posicionesCompactas(cantidad)` → array de `{x,y,w}`, uno por proyecto
  - `LayoutFiltrado.altoLienzoFiltrado(cantidad)` → alto del lienzo en `vw`

La tabla de ranuras es fija y asimétrica a propósito: es la que conserva el desorden compuesto de la galería cuando esta se recoge. Al séptimo proyecto la tabla se repite desplazada hacia abajo.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-layout.js`:

```js
describe('posicionesCompactas', function () {
  prueba('devuelve una posición por proyecto', function () {
    igual(LayoutFiltrado.posicionesCompactas(3).length, 3);
    igual(LayoutFiltrado.posicionesCompactas(9).length, 9);
  });

  prueba('es determinista', function () {
    igual(LayoutFiltrado.posicionesCompactas(4), LayoutFiltrado.posicionesCompactas(4));
  });

  prueba('las seis primeras son las seis ranuras', function () {
    igual(LayoutFiltrado.posicionesCompactas(6), LayoutFiltrado.RANURAS);
  });

  prueba('ninguna de las seis primeras comparte posición', function () {
    var vistas = {};
    LayoutFiltrado.posicionesCompactas(6).forEach(function (p) {
      var clave = p.x + ',' + p.y;
      cierto(!vistas[clave], 'posición repetida en ' + clave);
      vistas[clave] = true;
    });
  });

  prueba('todas caben en el ancho del lienzo filtrado', function () {
    LayoutFiltrado.posicionesCompactas(6).forEach(function (p) {
      cierto(p.x + p.w <= LayoutFiltrado.ANCHO, 'se sale por la derecha: ' + p.x);
    });
  });

  prueba('la séptima repite la primera una vuelta más abajo', function () {
    var pos = LayoutFiltrado.posicionesCompactas(7);
    igual(pos[6].x, pos[0].x);
    igual(pos[6].w, pos[0].w);
    cierto(pos[6].y > pos[0].y, 'la séptima debería quedar por debajo');
  });
});

describe('altoLienzoFiltrado', function () {
  prueba('con tres proyectos vale 67', function () {
    igual(LayoutFiltrado.altoLienzoFiltrado(3), 67);
  });

  prueba('con siete proyectos vale 126', function () {
    igual(LayoutFiltrado.altoLienzoFiltrado(7), 126);
  });

  prueba('nunca decrece al añadir proyectos', function () {
    var previo = 0;
    for (var i = 1; i <= 12; i++) {
      var alto = LayoutFiltrado.altoLienzoFiltrado(i);
      cierto(alto >= previo, 'decreció al pasar a ' + i);
      previo = alto;
    }
  });
});
```

- [ ] **Step 2: Añadir los scripts al arnés y comprobar que fallan**

En `tests/test.html`, añadir `<script src="../js/layout-filtrado.js"></script>` y `<script src="pruebas-layout.js"></script>`.

Abrir `tests/test.html`.
Esperado: las nueve pruebas fallan con `LayoutFiltrado is not defined`.

- [ ] **Step 3: Escribir `js/layout-filtrado.js`**

```js
window.LayoutFiltrado = (function () {
  var ANCHO = 100;
  var SALTO_Y = 78;
  var PROPORCION = 1.25;

  var RANURAS = [
    { x: 6,  y: 10, w: 22 },
    { x: 38, y: 34, w: 18 },
    { x: 66, y: 6,  w: 20 },
    { x: 12, y: 52, w: 19 },
    { x: 44, y: 72, w: 17 },
    { x: 72, y: 46, w: 21 }
  ];

  function posicionesCompactas(cantidad) {
    var salida = [];
    for (var i = 0; i < cantidad; i++) {
      var base = RANURAS[i % RANURAS.length];
      var vuelta = Math.floor(i / RANURAS.length);
      salida.push({ x: base.x, y: base.y + vuelta * SALTO_Y, w: base.w });
    }
    return salida;
  }

  function altoLienzoFiltrado(cantidad) {
    var maximo = 0;
    posicionesCompactas(cantidad).forEach(function (p) {
      var abajo = p.y + p.w * PROPORCION;
      if (abajo > maximo) maximo = abajo;
    });
    return Math.ceil(maximo + 10);
  }

  return {
    ANCHO: ANCHO,
    RANURAS: RANURAS,
    posicionesCompactas: posicionesCompactas,
    altoLienzoFiltrado: altoLienzoFiltrado
  };
})();
```

`PROPORCION` es 1.25 porque las fotos llevan `aspect-ratio:4/5`: el alto de una pieza es su ancho por cinco cuartos.

- [ ] **Step 4: Volver a abrir el arnés y comprobar que pasa todo**

Abrir `tests/test.html`.
Esperado: `——— 32 pasan, 0 fallan ———`.

- [ ] **Step 5: Commit**

```bash
git add js/layout-filtrado.js tests/pruebas-layout.js tests/test.html
git commit -m "Añadir el cálculo de la composición del lienzo filtrado

Una tabla fija de seis ranuras asimétricas que se repite desplazada
hacia abajo a partir del séptimo proyecto, para que el resultado sea
el mismo en cada visita.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Construir el lienzo desde los datos

El entregable es una galería visualmente idéntica a la actual, pero generada desde `Datos.PROYECTOS` en vez de escrita a mano, y colocada con `transform` para que la Task 6 pueda animarla.

**Files:**
- Modify: `index.html` (borrar los doce `<div class="proj">`, líneas 695-733 del archivo original)
- Modify: `js/galeria.js`
- Modify: `css/luque.css` (regla `.proj`)

**Interfaces:**
- Consumes: `Datos.PROYECTOS`, `Datos.CATEGORIAS`, `Datos.validarDatos`.
- Produces: `Galeria.elementoDe(id)` devuelve el botón de ese proyecto, y `Galeria.colocar(elemento, x, y, escala)` lo sitúa. Cada proyecto queda en el DOM como `<button class="proj" data-id="bruma" data-cat="editorial">` con un `<div class="proj-inner">` dentro que contiene `<img>` y `<span class="tag">`.

- [ ] **Step 1: Vaciar el lienzo en el marcado**

En `index.html`, dentro de `<div class="spatial-canvas" id="spatialCanvas">`, borrar los doce bloques `<div class="proj">`. El contenedor queda vacío; lo llena el JavaScript.

- [ ] **Step 2: Cambiar el posicionamiento a transform en el CSS**

En `css/luque.css`, sustituir la regla `.proj` entera por:

```css
.proj{
  position:absolute;
  top:0; left:0;
  transform-origin:0 0;
  aspect-ratio:4/5;
  padding:0;
  border:none;
  background:none;
  font:inherit;
  color:inherit;
  text-align:left;
  will-change:transform;
}

.proj:focus-visible{
  outline:2px solid var(--black);
  outline-offset:6px;
}
```

El paso de `<div>` a `<button>` obliga a neutralizar los estilos que el navegador da a los botones: de ahí `padding`, `border`, `background`, `font`, `color` y `text-align`.

- [ ] **Step 3: Generar los proyectos en `js/galeria.js`**

Dentro del módulo `Galeria`, junto al resto de funciones internas:

```js
var porElemento = {};

var ETIQUETAS = {
  'foto-stills': 'Foto Stills',
  'editorial': 'Editorial',
  'videoclip': 'Videoclip',
  'cortometraje': 'Cortometraje'
};

function colocar(elemento, x, y, escala) {
  elemento.style.transform =
    'translate3d(' + x + 'vw, ' + y + 'vw, 0) scale(' + escala + ')';
}

function elementoDe(id) { return porElemento[id] || null; }

function construir() {
  var canvas = document.getElementById('spatialCanvas');
  if (!canvas) return;

  window.Datos.PROYECTOS.forEach(function (p) {
    var boton = document.createElement('button');
    boton.className = 'proj';
    boton.type = 'button';
    boton.dataset.id = p.id;
    boton.dataset.cat = p.categoria;
    boton.style.width = p.pos.w + 'vw';
    boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

    var interior = document.createElement('div');
    interior.className = 'proj-inner';

    var img = document.createElement('img');
    img.src = p.portada;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    var etiqueta = document.createElement('span');
    etiqueta.className = 'tag';
    etiqueta.textContent = ETIQUETAS[p.categoria] || p.categoria;

    interior.appendChild(img);
    interior.appendChild(etiqueta);
    boton.appendChild(interior);
    canvas.appendChild(boton);

    porElemento[p.id] = boton;
    colocar(boton, p.pos.x, p.pos.y, 1);
  });
}
```

- [ ] **Step 4: Llamar a `construir()` y avisar de los datos malos**

Las dos primeras líneas del `init()` de `Galeria`:

```js
var problemas = window.Datos.validarDatos(window.Datos.PROYECTOS, window.Datos.CATEGORIAS);
if (problemas.length) console.warn('Problemas en los datos:\n' + problemas.join('\n'));
construir();
```

Y añadir `colocar` y `elementoDe` al objeto que devuelve el módulo.

- [ ] **Step 5: Cargar los módulos nuevos en `index.html`**

En el bloque de etiquetas del final, antes de `js/cursor.js`:

```html
<script src="js/datos.js"></script>
<script src="js/router.js"></script>
<script src="js/layout-filtrado.js"></script>
```

- [ ] **Step 6: Verificar a mano**

Abrir `index.html` y comprobar:

1. Se ven doce fotos repartidas por el lienzo, en las mismas posiciones que antes.
2. Cada una lleva su etiqueta de categoría abajo a la izquierda.
3. Al pasar el ratón por encima, la foto hace zoom y las esquinas del cursor la encuadran.
4. Con el tabulador se salta de foto en foto y aparece un contorno negro alrededor de la enfocada.
5. La consola no muestra ningún aviso de problemas de datos.

El punto 3 es el más frágil: `cursor.js` busca `.proj` y ahora eso es un `<button>`. Si el encuadre falla, comprobar que el selector sigue encontrando el elemento y que `querySelector('img')` sigue devolviendo la imagen.

- [ ] **Step 7: Commit**

```bash
git add index.html js/galeria.js css/luque.css
git commit -m "Generar la galería desde los datos en vez de a mano

Los doce proyectos salen del marcado y los construye galeria.js. Cada
uno pasa a ser un botón enfocable, colocado con transform para que el
filtrado pueda animarlo sin tocar el layout.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: El filtrado por categoría

Toda la lógica de cálculo ya está probada en las Tasks 3 y 4. Esta tarea es el cableado: conectar el router a la galería y al navbar. La verificación es a ojo porque lo que se comprueba es una animación.

**Files:**
- Modify: `index.html` (los cuatro `<a>` del navbar)
- Modify: `css/luque.css` (estado activo del navbar, atenuación de proyectos)
- Modify: `js/galeria.js`

**Interfaces:**
- Consumes: `Router.alCambiar`, `Router.ir`, `Router.init`, `LayoutFiltrado.posicionesCompactas`, `LayoutFiltrado.altoLienzoFiltrado`, `LayoutFiltrado.ANCHO`, `Datos.porCategoria`, `Galeria.colocar`, `Galeria.elementoDe`.
- Produces: `Galeria.aplicarFiltro(categoria)`, `Galeria.quitarFiltro()`, `Galeria.categoriaActiva()` → cadena o `null`.

- [ ] **Step 1: Apuntar los enlaces del navbar a las rutas nuevas**

En `index.html`, en cada uno de los cuatro `<a>` del SVG del navbar, cambiar el `href` y añadir `data-cat`:

```html
<a href="#/foto-stills"   data-cat="foto-stills"   aria-label="Foto Stills">
<a href="#/editorial"     data-cat="editorial"     aria-label="Editorial">
<a href="#/videoclip"     data-cat="videoclip"     aria-label="Videoclip">
<a href="#/cortometraje"  data-cat="cortometraje"  aria-label="Cortometraje">
```

- [ ] **Step 2: Estilar el estado activo y la atenuación**

Añadir al final de `css/luque.css`:

```css
/* Celda activa del navbar: se invierte por completo. El rect .nav-hit
   se pinta primero, así que hace de fondo negro y las letras y las
   esquinas pasan a amarillo encima. */
.navbar .nav-svg a.activa .nav-hit{ fill:var(--black); }
.navbar .nav-svg a.activa path,
.navbar .nav-svg a.activa polygon{ fill:var(--yellow); }

/* Proyecto que no pertenece a la categoría filtrada */
.proj.apagado{
  opacity:0;
  pointer-events:none;
}

.spatial-canvas{
  transition:width 0.62s cubic-bezier(.2,.7,.2,1),
             height 0.62s cubic-bezier(.2,.7,.2,1);
}

@media (prefers-reduced-motion: reduce){
  .spatial-canvas{ transition:none; }
}
```

- [ ] **Step 3: Escribir el filtrado en `js/galeria.js`**

Añadir dentro del módulo. `paneoCongelado` es una bandera nueva que el bucle de `mousemove` debe respetar: en el manejador de `mousemove` del ratón, salir con `if (paneoCongelado) return;` como primera línea.

```js
var categoria = null;
var paneoCongelado = false;

var DURACION = 0.62;
var CURVA = 'power2.out';

function movimientoReducido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animarA(elemento, x, y, escala) {
  if (movimientoReducido()) {
    colocar(elemento, x, y, escala);
    return;
  }
  gsap.to(elemento, {
    duration: DURACION,
    ease: CURVA,
    x: x + 'vw',
    y: y + 'vw',
    scale: escala,
    overwrite: 'auto'
  });
}

function aplicarFiltro(nueva) {
  categoria = nueva;
  paneoCongelado = true;

  var dentro = window.Datos.porCategoria(nueva);
  var ranuras = window.LayoutFiltrado.posicionesCompactas(dentro.length);

  window.Datos.PROYECTOS.forEach(function (p) {
    var el = elementoDe(p.id);
    var indice = dentro.indexOf(p);
    if (indice === -1) {
      el.classList.add('apagado');
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    } else {
      var r = ranuras[indice];
      el.classList.remove('apagado');
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
      animarA(el, r.x, r.y, r.w / p.pos.w);
    }
  });

  var canvas = document.getElementById('spatialCanvas');
  canvas.style.width = window.LayoutFiltrado.ANCHO + 'vw';
  canvas.style.height = window.LayoutFiltrado.altoLienzoFiltrado(dentro.length) + 'vw';

  marcarNavbar(nueva);
  setTimeout(function () { measure(); paneoCongelado = false; }, DURACION * 1000);
}

function quitarFiltro() {
  categoria = null;
  paneoCongelado = true;

  window.Datos.PROYECTOS.forEach(function (p) {
    var el = elementoDe(p.id);
    el.classList.remove('apagado');
    el.removeAttribute('tabindex');
    el.removeAttribute('aria-hidden');
    animarA(el, p.pos.x, p.pos.y, 1);
  });

  var canvas = document.getElementById('spatialCanvas');
  canvas.style.width = '';
  canvas.style.height = '';

  marcarNavbar(null);
  setTimeout(function () { measure(); paneoCongelado = false; }, DURACION * 1000);
}

function marcarNavbar(activa) {
  document.querySelectorAll('.navbar .nav-svg a[data-cat]').forEach(function (a) {
    a.classList.toggle('activa', a.dataset.cat === activa);
  });
}

function categoriaActiva() { return categoria; }
```

Vaciar `canvas.style.width` en vez de asignarle `240vw` es deliberado: así vuelve al valor del CSS, incluida la variante de la media query de móvil.

- [ ] **Step 4: Sustituir el manejador de clic del navbar**

En `js/galeria.js`, reemplazar el bloque actual que recorre `.navbar .nav-svg a[href^="#"]` por:

```js
document.querySelectorAll('.navbar .nav-svg a[data-cat]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    var cat = a.dataset.cat;
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
    if (categoria === cat) window.Router.ir('todos');
    else window.Router.ir('categoria', cat);
  });
});
```

La función `focusCategory` deja de usarse y se borra: ahora la categoría no se centra, se recompone.

- [ ] **Step 5: Suscribirse al router y atender a `Esc`**

Al final del `init()` de `Galeria`:

```js
window.Router.alCambiar(function (ruta) {
  if (ruta.tipo === 'categoria') {
    if (categoria !== ruta.valor) aplicarFiltro(ruta.valor);
  } else if (categoria !== null) {
    quitarFiltro();
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (document.body.classList.contains('visor-abierto')) return;
  if (categoria !== null) window.Router.ir('todos');
});
```

La comprobación de `visor-abierto` es la que garantiza que, con el visor abierto, `Esc` lo consume él. La clase la pondrá la Task 8.

- [ ] **Step 6: Arrancar el router en `index.html`**

En el bloque de arranque, después de `window.Galeria.init()`:

```js
window.Router.init();
```

Va el último a propósito: `Router.init()` avisa una vez con la ruta inicial, y para entonces la galería ya debe estar suscrita.

- [ ] **Step 7: Verificar a mano**

Abrir `index.html` y comprobar:

1. Pulsar «Editorial»: los otros nueve proyectos se desvanecen y los tres de editorial viajan a una composición que cabe en pantalla.
2. La celda «Editorial» del navbar queda en negativo, con fondo negro y letras amarillas.
3. La barra de direcciones muestra `#/editorial`.
4. El lienzo ya no se puede desplazar más allá de esos tres proyectos.
5. Pulsar «Editorial» otra vez: los doce vuelven a sus posiciones originales y el navbar se apaga.
6. Con un filtro puesto, `Esc` lo quita.
7. Pulsar «Videoclip» estando en «Editorial» pasa de una a otra sin estados intermedios raros.
8. Recargar con `#/videoclip` en la URL abre la web ya filtrada por videoclip.
9. Repetir el punto 1 con el sistema en modo de movimiento reducido: los proyectos se recolocan de golpe, sin viaje.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/galeria.js
git commit -m "Añadir el filtrado real por categoría

El navbar deja de centrar la vista y pasa a recomponer el lienzo: los
proyectos de otras categorías se apagan y los que quedan viajan a una
composición compacta. La celda activa se invierte y la categoría queda
en la URL.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: La máquina de estado del visor

Todo el comportamiento del visor que se puede razonar sin mirar la pantalla vive aquí, aislado y comprobado: en qué pieza estamos, si la lupa está abierta, si la ficha está desplegada y qué cierra `Esc`. La Task 8 solo tendrá que pintar lo que diga este módulo.

**Files:**
- Create: `js/visor-estado.js`, `tests/pruebas-visor-estado.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: nada.
- Produces: `window.VisorEstado`, con funciones que reciben un estado y devuelven **uno nuevo**, sin modificar el que reciben:
  - `inicial()` → `{ abierto:false, id:null, indice:0, total:0, lupa:false, ficha:false }`
  - `abrir(estado, id, total)`
  - `siguiente(estado)` · `anterior(estado)` · `irA(estado, indice)`
  - `alternarLupa(estado)` · `alternarFicha(estado)`
  - `escapar(estado)`

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-visor-estado.js`:

```js
describe('VisorEstado', function () {
  function abierto() { return VisorEstado.abrir(VisorEstado.inicial(), 'bruma', 4); }

  prueba('el estado inicial está cerrado', function () {
    igual(VisorEstado.inicial(),
          { abierto: false, id: null, indice: 0, total: 0, lupa: false, ficha: false });
  });

  prueba('abrir empieza por la primera pieza', function () {
    igual(abierto(),
          { abierto: true, id: 'bruma', indice: 0, total: 4, lupa: false, ficha: false });
  });

  prueba('siguiente avanza una pieza', function () {
    igual(VisorEstado.siguiente(abierto()).indice, 1);
  });

  prueba('siguiente se detiene en la última y no da la vuelta', function () {
    var e = VisorEstado.irA(abierto(), 3);
    igual(VisorEstado.siguiente(e).indice, 3);
  });

  prueba('anterior se detiene en la primera', function () {
    igual(VisorEstado.anterior(abierto()).indice, 0);
  });

  prueba('irA recorta por debajo y por encima', function () {
    igual(VisorEstado.irA(abierto(), -5).indice, 0);
    igual(VisorEstado.irA(abierto(), 99).indice, 3);
  });

  prueba('con la lupa abierta no se navega', function () {
    var e = VisorEstado.alternarLupa(abierto());
    igual(VisorEstado.siguiente(e).indice, 0);
    igual(VisorEstado.anterior(VisorEstado.irA(e, 2)).indice, 2);
  });

  prueba('escapar sale primero de la lupa', function () {
    var e = VisorEstado.alternarFicha(VisorEstado.alternarLupa(abierto()));
    var tras = VisorEstado.escapar(e);
    igual(tras.lupa, false);
    igual(tras.ficha, true, 'la ficha debería seguir abierta');
    igual(tras.abierto, true, 'el visor debería seguir abierto');
  });

  prueba('escapar cierra después la ficha', function () {
    var e = VisorEstado.alternarFicha(abierto());
    var tras = VisorEstado.escapar(e);
    igual(tras.ficha, false);
    igual(tras.abierto, true, 'el visor debería seguir abierto');
  });

  prueba('escapar cierra el visor cuando no hay nada más', function () {
    igual(VisorEstado.escapar(abierto()), VisorEstado.inicial());
  });

  prueba('escapar sobre un visor cerrado no hace nada raro', function () {
    igual(VisorEstado.escapar(VisorEstado.inicial()), VisorEstado.inicial());
  });

  prueba('ninguna función modifica el estado que recibe', function () {
    var e = abierto();
    var copia = JSON.parse(JSON.stringify(e));
    VisorEstado.siguiente(e);
    VisorEstado.anterior(e);
    VisorEstado.irA(e, 2);
    VisorEstado.alternarLupa(e);
    VisorEstado.alternarFicha(e);
    VisorEstado.escapar(e);
    igual(e, copia, 'el estado original ha cambiado');
  });
});
```

- [ ] **Step 2: Añadir los scripts al arnés y comprobar que fallan**

En `tests/test.html`, añadir `<script src="../js/visor-estado.js"></script>` y `<script src="pruebas-visor-estado.js"></script>`.

Abrir `tests/test.html`.
Esperado: las doce pruebas fallan con `VisorEstado is not defined`.

- [ ] **Step 3: Escribir `js/visor-estado.js`**

```js
window.VisorEstado = (function () {

  function copiaCon(estado, cambios) {
    var nuevo = {
      abierto: estado.abierto,
      id: estado.id,
      indice: estado.indice,
      total: estado.total,
      lupa: estado.lupa,
      ficha: estado.ficha
    };
    for (var clave in cambios) nuevo[clave] = cambios[clave];
    return nuevo;
  }

  function inicial() {
    return { abierto: false, id: null, indice: 0, total: 0, lupa: false, ficha: false };
  }

  function abrir(estado, id, total) {
    return { abierto: true, id: id, indice: 0, total: total, lupa: false, ficha: false };
  }

  function recortar(indice, total) {
    if (indice < 0) return 0;
    if (indice > total - 1) return Math.max(0, total - 1);
    return indice;
  }

  function irA(estado, indice) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { indice: recortar(indice, estado.total) });
  }

  function siguiente(estado) {
    if (!estado.abierto || estado.lupa) return estado;
    return irA(estado, estado.indice + 1);
  }

  function anterior(estado) {
    if (!estado.abierto || estado.lupa) return estado;
    return irA(estado, estado.indice - 1);
  }

  function alternarLupa(estado) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { lupa: !estado.lupa });
  }

  function alternarFicha(estado) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { ficha: !estado.ficha });
  }

  function escapar(estado) {
    if (!estado.abierto) return inicial();
    if (estado.lupa) return copiaCon(estado, { lupa: false });
    if (estado.ficha) return copiaCon(estado, { ficha: false });
    return inicial();
  }

  return {
    inicial: inicial,
    abrir: abrir,
    irA: irA,
    siguiente: siguiente,
    anterior: anterior,
    alternarLupa: alternarLupa,
    alternarFicha: alternarFicha,
    escapar: escapar
  };
})();
```

- [ ] **Step 4: Volver a abrir el arnés y comprobar que pasa todo**

Abrir `tests/test.html`.
Esperado: `——— 44 pasan, 0 fallan ———`.

- [ ] **Step 5: Commit**

```bash
git add js/visor-estado.js tests/pruebas-visor-estado.js tests/test.html
git commit -m "Añadir la máquina de estado del visor

Aísla en funciones puras qué pieza está activa, si hay lupa o ficha y
qué cierra Esc en cada capa. La serie no da la vuelta al llegar al
final, a propósito.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: El marco del visor

El visor abre y cierra sin animación, de golpe. Esa es exactamente la ruta que ya necesitan el movimiento reducido y la entrada por URL, así que no es trabajo desechable: la Task 9 solo añade el viaje por encima.

Fuera de esta tarea, a propósito: la transición, la lupa, la ficha, el vídeo y el estado de carga.

**Files:**
- Modify: `index.html` (marcado del visor, antes de `<footer>`)
- Modify: `css/luque.css`
- Create: `js/visor.js`

**Interfaces:**
- Consumes: `VisorEstado.*`, `Datos.porId`, `Router.alCambiar`, `Router.ir`.
- Produces: `Visor.init()`, `Visor.abrir(id)`, `Visor.cerrar()`, `Visor.estaAbierto()`. Mientras está abierto, `document.body` lleva la clase `visor-abierto`.

- [ ] **Step 1: Añadir el marcado del visor**

En `index.html`, justo antes de `<footer>`:

```html
<div class="visor" id="visor" role="dialog" aria-modal="true"
     aria-labelledby="visorTitulo" hidden>

  <span class="visor-esquina tl" aria-hidden="true"></span>
  <span class="visor-esquina tr" aria-hidden="true"></span>
  <span class="visor-esquina bl" aria-hidden="true"></span>
  <span class="visor-esquina br" aria-hidden="true"></span>

  <div class="visor-chrome" id="visorChrome">
    <header class="visor-cabecera">
      <p class="visor-titulo"><span id="visorTitulo"></span><span class="visor-cat" id="visorCat"></span></p>
      <div class="visor-acciones">
        <span class="visor-contador" id="visorContador"></span>
        <button class="visor-cerrar" id="visorCerrar" type="button" aria-label="Cerrar el visor">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.4L5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12z"/>
          </svg>
        </button>
      </div>
    </header>
    <nav class="visor-tira" id="visorTira" aria-label="Piezas del proyecto"></nav>
  </div>

  <div class="visor-escena" id="visorEscena"></div>
</div>
```

Las cuatro esquinas van sueltas y no dentro de `.visor-chrome` porque no se desvanecen con el resto de la interfaz: son el marco, no un control.

- [ ] **Step 2: Escribir el CSS del visor**

Añadir al final de `css/luque.css`:

```css
/* ============================================================
   VISOR DE PROYECTO
============================================================ */
.visor{
  position:fixed; inset:0;
  z-index:900;
  background:var(--black);
  display:flex;
  align-items:center;
  justify-content:center;
}
.visor[hidden]{ display:none; }

body.visor-abierto{ overflow:hidden; }
body.visor-abierto .navbar{ opacity:0; pointer-events:none; }

.visor-esquina{
  position:absolute;
  width:26px; height:26px;
  z-index:3;
  pointer-events:none;
}
.visor-esquina::before,
.visor-esquina::after{
  content:'';
  position:absolute;
  background:var(--yellow);
}
.visor-esquina::before{ top:0; left:0; width:100%; height:3px; }
.visor-esquina::after{  top:0; left:0; width:3px;  height:100%; }

.visor-esquina.tl{ top:22px;    left:22px;  }
.visor-esquina.tr{ top:22px;    right:22px; transform:scaleX(-1); }
.visor-esquina.bl{ bottom:22px; left:22px;  transform:scaleY(-1); }
.visor-esquina.br{ bottom:22px; right:22px; transform:scale(-1,-1); }

.visor-escena{
  position:absolute;
  inset:82px 64px 118px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.visor-escena img{
  max-width:100%;
  max-height:100%;
  object-fit:contain;
  display:block;
}

.visor-chrome{
  position:absolute; inset:0;
  z-index:2;
  opacity:1;
  transition:opacity 0.45s ease;
  pointer-events:none;
}
.visor-chrome > *{ pointer-events:auto; }
.visor-chrome.oculto{ opacity:0; pointer-events:none; }

.visor-cabecera{
  position:absolute; top:32px; left:60px; right:60px;
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:24px;
  color:var(--yellow);
}

.visor-titulo{
  font-size:clamp(1rem, 2vw, 1.5rem);
  font-weight:700;
  letter-spacing:-0.04em;
}
.visor-cat{
  display:block;
  font-size:0.68rem;
  font-weight:500;
  letter-spacing:0.18em;
  text-transform:uppercase;
  opacity:0.55;
  margin-top:4px;
}

.visor-acciones{ display:flex; align-items:center; gap:20px; }

.visor-contador{
  font-size:0.68rem;
  font-weight:700;
  letter-spacing:0.18em;
}

.visor-cerrar{
  width:26px; height:26px;
  padding:0; border:none; background:none;
  color:var(--yellow);
  cursor:none;
}
.visor-cerrar svg{ width:100%; height:100%; display:block; fill:currentColor; }
.visor-cerrar:hover{ opacity:0.5; }

.visor-tira{
  position:absolute; bottom:44px; left:0; right:0;
  display:flex; gap:8px; justify-content:center;
  padding:0 60px;
  flex-wrap:wrap;
}

.visor-miniatura{
  width:52px; height:42px;
  padding:0; border:none; background:none;
  opacity:0.35;
  transition:opacity 0.25s ease;
  cursor:none;
  position:relative;
}
.visor-miniatura img{ width:100%; height:100%; object-fit:cover; display:block; }
.visor-miniatura:hover{ opacity:0.7; }

.visor-miniatura[aria-current="true"]{ opacity:1; }
.visor-miniatura[aria-current="true"]::before,
.visor-miniatura[aria-current="true"]::after{
  content:'';
  position:absolute;
  width:9px; height:9px;
  border:2px solid var(--yellow);
}
.visor-miniatura[aria-current="true"]::before{
  top:-5px; left:-5px; border-right:none; border-bottom:none;
}
.visor-miniatura[aria-current="true"]::after{
  bottom:-5px; right:-5px; border-left:none; border-top:none;
}

.visor :focus-visible{ outline:2px solid var(--yellow); outline-offset:4px; }

@media (max-width: 720px){
  .visor-escena{ inset:76px 24px 104px; }
  .visor-cabecera{ left:26px; right:26px; top:26px; }
  .visor-tira{ padding:0 20px; bottom:32px; }
}
```

- [ ] **Step 3: Escribir `js/visor.js`**

```js
window.Visor = (function () {
  var estado = null;
  var proyecto = null;
  var elementoQueAbrio = null;

  var raiz, escena, chrome, tira, elTitulo, elCat, elContador, elCerrar;
  var temporizador = null;
  var OCULTAR_TRAS = 2000;

  function init() {
    estado = window.VisorEstado.inicial();

    raiz       = document.getElementById('visor');
    escena     = document.getElementById('visorEscena');
    chrome     = document.getElementById('visorChrome');
    tira       = document.getElementById('visorTira');
    elTitulo   = document.getElementById('visorTitulo');
    elCat      = document.getElementById('visorCat');
    elContador = document.getElementById('visorContador');
    elCerrar   = document.getElementById('visorCerrar');

    elCerrar.addEventListener('click', cerrar);
    document.addEventListener('keydown', alPulsarTecla);
    raiz.addEventListener('mousemove', despertarChrome);
    raiz.addEventListener('wheel', alRodar, { passive: true });
    tira.addEventListener('mouseenter', pararTemporizador);
    tira.addEventListener('mouseleave', despertarChrome);

    document.addEventListener('click', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (boton) window.Router.ir('proyecto', boton.dataset.id);
    });

    window.Router.alCambiar(function (ruta) {
      if (ruta.tipo === 'proyecto') abrir(ruta.valor);
      else if (estado.abierto) cerrarSinTocarLaRuta();
    });
  }

  function piezas() {
    return proyecto && proyecto.piezas ? proyecto.piezas : [];
  }

  function abrir(id) {
    var p = window.Datos.porId(id);
    if (!p || !p.piezas) return;

    proyecto = p;
    elementoQueAbrio = window.Galeria.elementoDe(id);
    estado = window.VisorEstado.abrir(estado, id, p.piezas.length);

    construirTira();
    raiz.hidden = false;
    document.body.classList.add('visor-abierto');
    renderizar();
    elCerrar.focus();
    despertarChrome();
  }

  function cerrar() { window.Router.ir('todos'); }

  function cerrarSinTocarLaRuta() {
    estado = window.VisorEstado.inicial();
    raiz.hidden = true;
    document.body.classList.remove('visor-abierto');
    pararTemporizador();
    if (elementoQueAbrio) elementoQueAbrio.focus();
    elementoQueAbrio = null;
    proyecto = null;
  }

  function construirTira() {
    tira.innerHTML = '';
    piezas().forEach(function (ruta, i) {
      var b = document.createElement('button');
      b.className = 'visor-miniatura';
      b.type = 'button';
      b.setAttribute('aria-label', 'Pieza ' + (i + 1) + ' de ' + piezas().length);
      var img = document.createElement('img');
      img.src = ruta;
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
      b.addEventListener('click', function () {
        estado = window.VisorEstado.irA(estado, i);
        renderizar();
      });
      tira.appendChild(b);
    });
  }

  function renderizar() {
    if (!estado.abierto) return;

    elTitulo.textContent = proyecto.titulo;
    elCat.textContent = proyecto.categoria.replace('-', ' ');
    elContador.textContent = pad(estado.indice + 1) + ' / ' + pad(estado.total);

    escena.innerHTML = '';
    var img = document.createElement('img');
    img.src = piezas()[estado.indice];
    img.alt = proyecto.titulo + ', pieza ' + (estado.indice + 1) + ' de ' + estado.total;
    escena.appendChild(img);

    Array.prototype.forEach.call(tira.children, function (b, i) {
      b.setAttribute('aria-current', i === estado.indice ? 'true' : 'false');
    });
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function alPulsarTecla(e) {
    if (!estado.abierto) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      var tras = window.VisorEstado.escapar(estado);
      if (!tras.abierto) cerrar();
      else { estado = tras; renderizar(); }
      return;
    }

    if (e.key === 'ArrowRight') { e.preventDefault(); estado = window.VisorEstado.siguiente(estado); renderizar(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); estado = window.VisorEstado.anterior(estado);  renderizar(); }
    if (e.key === 'Tab') atraparFoco(e);

    despertarChrome();
  }

  function alRodar(e) {
    if (!estado.abierto || estado.lupa) return;
    estado = (e.deltaY > 0) ? window.VisorEstado.siguiente(estado)
                            : window.VisorEstado.anterior(estado);
    renderizar();
    despertarChrome();
  }

  function atraparFoco(e) {
    var focos = raiz.querySelectorAll('button:not([disabled])');
    if (!focos.length) return;
    var primero = focos[0];
    var ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  function despertarChrome() {
    chrome.classList.remove('oculto');
    pararTemporizador();
    temporizador = setTimeout(function () { chrome.classList.add('oculto'); }, OCULTAR_TRAS);
  }

  function pararTemporizador() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  }

  function estaAbierto() { return estado && estado.abierto; }

  return { init: init, abrir: abrir, cerrar: cerrar, estaAbierto: estaAbierto };
})();
```

- [ ] **Step 4: Cargar y arrancar el visor**

En `index.html`, añadir `<script src="js/visor-estado.js"></script>` junto a los otros módulos puros y `<script src="js/visor.js"></script>` después de `js/galeria.js`. En el bloque de arranque, entre `Galeria.init()` y `Router.init()`:

```js
window.Visor.init();
```

- [ ] **Step 5: Verificar a mano**

Abrir `index.html`, bajar hasta la galería y comprobar:

1. Hacer clic en una foto de Foto Stills o Editorial abre el visor a pantalla completa sobre negro.
2. Hay cuatro esquinas amarillas en las esquinas de la pantalla.
3. Arriba a la izquierda, el título y la categoría; arriba a la derecha, el contador y la cruz.
4. Abajo, las miniaturas de la serie, con la activa a plena opacidad y enmarcada por dos esquinitas.
5. Las flechas del teclado y la rueda cambian de pieza; el contador y la miniatura activa lo acompañan.
6. Al llegar a la última pieza, seguir avanzando no hace nada; no vuelve a la primera.
7. Dos segundos sin mover el ratón: título, contador, cruz y miniaturas se desvanecen. La foto no.
8. Cualquier movimiento o tecla los devuelve.
9. Con el ratón sobre las miniaturas no se desvanecen nunca.
10. El tabulador solo recorre elementos de dentro del visor; no se escapa a la página de debajo.
11. `Esc` o la cruz cierran, la URL vuelve a quedar limpia y el foco regresa a la foto desde la que se abrió.
12. Abrir la web directamente con `#/bruma` en la URL monta el visor ya abierto.
13. Hacer clic en un videoclip o un cortometraje todavía no hace nada. Es lo esperado hasta la Task 12.

- [ ] **Step 6: Commit**

```bash
git add index.html css/luque.css js/visor.js
git commit -m "Añadir el marco del visor de proyecto

Escenario negro a pantalla completa con las esquinas amarillas, tira de
miniaturas, contador y navegación por teclado y rueda. La interfaz se
retira a los dos segundos y la foto nunca se atenúa. Abre y cierra sin
animación; el viaje llega en la tarea siguiente.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: La transición de apertura y cierre

**Dos decisiones de implementación que conviene entender antes de empezar.**

*Primera: se usan transiciones de CSS, no GSAP.* La restricción global fija la curva en `cubic-bezier(.2,.7,.2,1)`, y la compilación gratuita de GSAP que carga la web no incluye `CustomEase`: solo tiene curvas con nombre como `power2.out`, que se le parece pero no es. Una transición de CSS acepta la curva exacta y no necesita nada más.

*Segunda: las esquinas del visor no son literalmente los mismos nodos del DOM que las del cursor.* La especificación dice que son las mismas, y para el ojo lo son: las del visor arrancan exactamente donde están las del cursor y las del cursor se apagan en ese mismo fotograma. Lo que se evita así es que el módulo del cursor tenga que ser dueño de elementos que viven dentro del visor. El resultado visual es idéntico y los dos módulos siguen sin conocerse.

**Files:**
- Modify: `index.html` (estructura de las cuatro esquinas)
- Modify: `css/luque.css`
- Modify: `js/cursor.js`, `js/galeria.js`, `js/visor.js`

**Interfaces:**
- Consumes: lo de la Task 8.
- Produces: `Galeria.congelar()`, `Galeria.descongelar()`, `Cursor.ocultar()`, `Cursor.mostrar()`, `Cursor.rectanguloEnfocado()` → el `DOMRect` de la imagen que el cursor está encuadrando, o `null`.

- [ ] **Step 1: Sacar el espejado de las esquinas al hijo**

El elemento exterior de cada esquina no puede llevar `transform` propio, porque el viaje se lo va a escribir encima. En `index.html`, sustituir las cuatro esquinas por:

```html
<span class="visor-esquina tl" aria-hidden="true"><i></i></span>
<span class="visor-esquina tr" aria-hidden="true"><i></i></span>
<span class="visor-esquina bl" aria-hidden="true"><i></i></span>
<span class="visor-esquina br" aria-hidden="true"><i></i></span>
```

Y en `css/luque.css`, sustituir el bloque `.visor-esquina` de la Task 8 por:

```css
.visor-esquina{
  position:absolute;
  width:26px; height:26px;
  z-index:3;
  pointer-events:none;
  color:var(--yellow);
}
.visor-esquina i{
  position:absolute; inset:0;
  display:block;
}
.visor-esquina i::before,
.visor-esquina i::after{
  content:'';
  position:absolute;
  background:currentColor;
}
.visor-esquina i::before{ top:0; left:0; width:100%; height:3px; }
.visor-esquina i::after{  top:0; left:0; width:3px;  height:100%; }

.visor-esquina.tl{ top:22px;    left:22px;  }
.visor-esquina.tr{ top:22px;    right:22px; }
.visor-esquina.bl{ bottom:22px; left:22px;  }
.visor-esquina.br{ bottom:22px; right:22px; }

.visor-esquina.tr i{ transform:scaleX(-1); }
.visor-esquina.bl i{ transform:scaleY(-1); }
.visor-esquina.br i{ transform:scale(-1,-1); }

.visor.viajando .visor-esquina{
  transition:transform 0.62s cubic-bezier(.2,.7,.2,1),
             color 0.62s cubic-bezier(.2,.7,.2,1);
}
```

`background:currentColor` en los pseudoelementos es lo que permite animar el color de negro a amarillo con una sola propiedad.

- [ ] **Step 2: Añadir el resto del CSS de la transición**

```css
.visor{ transition:opacity 0.34s ease; }
.visor.entrando{ opacity:0; }

.visor.viajando .visor-escena img{
  transition:transform 0.62s cubic-bezier(.2,.7,.2,1),
             filter 0.62s cubic-bezier(.2,.7,.2,1);
}

.visor-escena img{ transform-origin:0 0; }

.visor .visor-chrome{ transition:opacity 0.3s ease 0.42s; }

@media (prefers-reduced-motion: reduce){
  .visor{ transition:opacity 0.2s ease; }
  .visor.viajando .visor-esquina,
  .visor.viajando .visor-escena img{ transition:none; }
  .visor .visor-chrome{ transition:opacity 0.2s ease; }
}
```

El retardo de `0.42s` en el chrome es lo que hace que la interfaz entre después de que la foto aterrice.

- [ ] **Step 3: Exponer el congelado en `js/galeria.js`**

La bandera `paneoCongelado` ya existe desde la Task 6. Añadir al objeto devuelto:

```js
function congelar()    { paneoCongelado = true;  }
function descongelar() { paneoCongelado = false; }
```

- [ ] **Step 4: Exponer el apagado del cursor en `js/cursor.js`**

`cursorEl` ya está en el ámbito del módulo desde la Task 1. Añadir:

```js
function ocultar() { cursorEl.style.display = 'none'; }
function mostrar() { cursorEl.style.display = ''; }
```

Y añadir las dos al objeto que devuelve el módulo.

El visor no necesita preguntarle al cursor dónde está encuadrando: lee el rectángulo directamente de la `<img>` del proyecto que va a abrir, que es la misma que el cursor tenía enmarcada. Así el visor sigue funcionando igual cuando no hay cursor, que es justo lo que pasa en táctil y al abrir con el teclado.

- [ ] **Step 5: Escribir la apertura animada en `js/visor.js`**

Sustituir el cuerpo de `abrir(id)` por:

```js
function movimientoReducido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function abrir(id) {
  var p = window.Datos.porId(id);
  if (!p || !p.piezas) return;

  proyecto = p;
  elementoQueAbrio = window.Galeria.elementoDe(id);
  estado = window.VisorEstado.abrir(estado, id, p.piezas.length);

  var imgOrigen = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
  var origen = (imgOrigen && !movimientoReducido()) ? imgOrigen.getBoundingClientRect() : null;

  window.Galeria.congelar();
  window.Cursor.ocultar();

  construirTira();
  raiz.hidden = false;
  raiz.classList.add('entrando');
  document.body.classList.add('visor-abierto');
  renderizar();

  if (!origen) {
    raiz.classList.remove('entrando');
    window.Cursor.mostrar();
    elCerrar.focus();
    despertarChrome();
    return;
  }

  volar(origen);
}
```

El cursor solo se apaga durante el viaje, nunca durante toda la sesión: el CSS pone `cursor:none` en el `body`, así que dejarlo oculto con el visor abierto dejaría al usuario sin puntero de ninguna clase. Por eso vuelve en cuanto la foto aterriza.

```js

function volar(origen) {
  var img = escena.querySelector('img');
  chrome.classList.add('oculto');

  function arrancar() {
    var destino = img.getBoundingClientRect();
    var ex = origen.width  / destino.width;
    var ey = origen.height / destino.height;
    var dx = origen.left - destino.left;
    var dy = origen.top  - destino.top;

    img.style.transition = 'none';
    img.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + ex + ',' + ey + ')';
    img.style.filter = 'grayscale(35%) contrast(1.05)';

    prepararEsquinas(origen);

    raiz.offsetHeight;                 // fuerza el reflujo antes de animar
    raiz.classList.remove('entrando');
    raiz.classList.add('viajando');

    img.style.transition = '';
    img.style.transform = 'none';
    img.style.filter = 'none';
    soltarEsquinas();

    setTimeout(function () {
      raiz.classList.remove('viajando');
      window.Cursor.mostrar();
      elCerrar.focus();
      despertarChrome();
    }, 640);
  }

  if (img.complete) requestAnimationFrame(arrancar);
  else img.addEventListener('load', function () { requestAnimationFrame(arrancar); }, { once: true });
}

var CLAVES = ['tl', 'tr', 'bl', 'br'];

function prepararEsquinas(origen) {
  var margen = 9;
  var puntos = {
    tl: { x: origen.left  - margen, y: origen.top    - margen },
    tr: { x: origen.right + margen, y: origen.top    - margen },
    bl: { x: origen.left  - margen, y: origen.bottom + margen },
    br: { x: origen.right + margen, y: origen.bottom + margen }
  };

  CLAVES.forEach(function (clave) {
    var el = raiz.querySelector('.visor-esquina.' + clave);
    el.style.transition = 'none';
    el.style.transform = 'none';
    var r = el.getBoundingClientRect();
    var anclaX = (clave === 'tl' || clave === 'bl') ? r.left : r.right;
    var anclaY = (clave === 'tl' || clave === 'tr') ? r.top  : r.bottom;
    el.style.transform = 'translate(' + (puntos[clave].x - anclaX) + 'px,' +
                                        (puntos[clave].y - anclaY) + 'px)';
    el.style.color = '#0a0a0a';
  });
}

function soltarEsquinas() {
  CLAVES.forEach(function (clave) {
    var el = raiz.querySelector('.visor-esquina.' + clave);
    el.style.transition = '';
    el.style.transform = 'none';
    el.style.color = '';
  });
}
```

- [ ] **Step 6: Escribir el cierre animado**

Sustituir `cerrarSinTocarLaRuta()` por:

```js
function cerrarSinTocarLaRuta() {
  var imgDestino = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
  var destino = (imgDestino && !movimientoReducido()) ? imgDestino.getBoundingClientRect() : null;

  pararTemporizador();
  chrome.classList.add('oculto');
  window.Cursor.ocultar();

  function rematar() {
    estado = window.VisorEstado.inicial();
    raiz.hidden = true;
    raiz.classList.remove('viajando', 'entrando');
    raiz.style.opacity = '';
    var img = escena.querySelector('img');
    if (img) { img.style.transform = ''; img.style.filter = ''; img.style.transition = ''; }
    CLAVES.forEach(function (c) {
      var el = raiz.querySelector('.visor-esquina.' + c);
      el.style.transition = ''; el.style.transform = ''; el.style.color = '';
    });
    document.body.classList.remove('visor-abierto');
    window.Galeria.descongelar();
    window.Cursor.mostrar();
    if (elementoQueAbrio) elementoQueAbrio.focus();
    elementoQueAbrio = null;
    proyecto = null;
  }

  if (!destino) { rematar(); return; }

  var img = escena.querySelector('img');
  var actual = img.getBoundingClientRect();
  raiz.classList.add('viajando');
  img.style.transform = 'translate(' + (destino.left - actual.left) + 'px,' +
                                       (destino.top - actual.top) + 'px) scale(' +
                        (destino.width / actual.width) + ',' +
                        (destino.height / actual.height) + ')';
  img.style.filter = 'grayscale(35%) contrast(1.05)';
  prepararEsquinasHacia(destino);
  raiz.style.opacity = '0';

  setTimeout(rematar, 640);
}

function prepararEsquinasHacia(destino) {
  var margen = 9;
  var puntos = {
    tl: { x: destino.left  - margen, y: destino.top    - margen },
    tr: { x: destino.right + margen, y: destino.top    - margen },
    bl: { x: destino.left  - margen, y: destino.bottom + margen },
    br: { x: destino.right + margen, y: destino.bottom + margen }
  };
  CLAVES.forEach(function (clave) {
    var el = raiz.querySelector('.visor-esquina.' + clave);
    var r = el.getBoundingClientRect();
    var anclaX = (clave === 'tl' || clave === 'bl') ? r.left : r.right;
    var anclaY = (clave === 'tl' || clave === 'tr') ? r.top  : r.bottom;
    el.style.transform = 'translate(' + (puntos[clave].x - anclaX) + 'px,' +
                                        (puntos[clave].y - anclaY) + 'px)';
    el.style.color = '#0a0a0a';
  });
}
```

El rectángulo de destino se lee aquí, en el momento de cerrar, y no se guarda el de la apertura: es lo que garantiza que la foto vuelva a su sitio aunque el lienzo se haya movido.

- [ ] **Step 7: Verificar a mano**

1. Al hacer clic en una foto, esa misma foto crece desde su posición hasta el centro. No aparece de golpe ni parpadea.
2. Durante el viaje, el fondo pasa de amarillo a negro.
3. Las cuatro esquinas salen del contorno de la foto y llegan a las esquinas de la pantalla, cambiando de negro a amarillo.
4. La foto recupera el color: entra desaturada y aterriza a plena saturación.
5. El título, el contador y las miniaturas aparecen **después** de que la foto se detenga, no a la vez.
6. Mientras el visor está abierto, mover el ratón no desplaza la galería de debajo.
7. Al cerrar, la foto vuelve exactamente a su hueco en el lienzo, no a otro sitio.
8. Desplazar el lienzo, abrir una foto, cerrarla: vuelve al hueco correcto, no al que ocupaba antes de desplazar.
9. Con movimiento reducido activado, no hay viaje: fundido de 200 ms y ya.
10. Desde el móvil o con el ratón desactivado, abrir una foto funciona igual aunque las esquinas no viajen.
11. Con el visor ya abierto y quieto, el cursor-visor pequeño se ve y sigue al ratón. No debe desaparecer el puntero.
12. Abrir y cerrar diez veces seguidas deprisa no deja el cursor oculto ni la galería congelada.

Los puntos 11 y 12 son los que detectan los dos fallos más caros de esta tarea. Si la galería se queda muerta, revisar que `descongelar()` y `Cursor.mostrar()` estén dentro de `rematar()`, que se ejecuta siempre.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/cursor.js js/galeria.js js/visor.js
git commit -m "Añadir la transición de apertura y cierre del visor

La foto del lienzo crece hasta el visor recuperando su color mientras
las esquinas viajan a los bordes de la pantalla y el fondo pasa de
amarillo a negro. El destino del cierre se recalcula en el momento, así
que la foto vuelve a su hueco aunque el lienzo se haya movido.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: La lupa

Un solo nivel de aumento, el nativo de la imagen. Sin rueda, sin porcentajes: o se ve la composición o se ve el grano.

**Files:**
- Create: `js/visor-lupa.js`
- Modify: `css/luque.css`, `js/visor.js`, `index.html`

**Interfaces:**
- Consumes: `VisorEstado.alternarLupa`.
- Produces: `VisorLupa.entrar(escena)`, `VisorLupa.salir(escena)`, `VisorLupa.puedeAmpliar(img)`, `VisorLupa.desplazar(dx, dy)`.

- [ ] **Step 1: Escribir el CSS de la lupa**

```css
.visor.lupa .visor-escena{ overflow:hidden; }

.visor.lupa .visor-escena img{
  max-width:none; max-height:none;
  width:auto; height:auto;
  transform-origin:0 0;
  transition:none;
}
```

- [ ] **Step 2: Escribir `js/visor-lupa.js`**

```js
window.VisorLupa = (function () {
  var x = 0, y = 0;
  var arrastrando = false;
  var px = 0, py = 0;
  var img = null;
  var escena = null;
  var PASO_TECLADO = 80;

  function puedeAmpliar(imagen) {
    if (!imagen || !imagen.naturalWidth) return false;
    return imagen.naturalWidth  > imagen.clientWidth  + 40 ||
           imagen.naturalHeight > imagen.clientHeight + 40;
  }

  function limites() {
    var r = escena.getBoundingClientRect();
    return {
      minX: Math.min(0, r.width  - img.naturalWidth),
      minY: Math.min(0, r.height - img.naturalHeight)
    };
  }

  function recortar() {
    var l = limites();
    x = Math.max(l.minX, Math.min(0, x));
    y = Math.max(l.minY, Math.min(0, y));
  }

  function pintar() {
    img.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  }

  function entrar(escenaEl) {
    escena = escenaEl;
    img = escena.querySelector('img');
    if (!img) return false;

    // centra la vista en el mismo punto que se estaba viendo
    var r = escena.getBoundingClientRect();
    x = (r.width  - img.naturalWidth)  / 2;
    y = (r.height - img.naturalHeight) / 2;
    recortar();
    pintar();

    escena.addEventListener('pointerdown', alBajar);
    escena.addEventListener('pointermove', alMover);
    escena.addEventListener('pointerup', alSubir);
    escena.addEventListener('pointercancel', alSubir);
    return true;
  }

  function salir(escenaEl) {
    if (!escena) return;
    escena.removeEventListener('pointerdown', alBajar);
    escena.removeEventListener('pointermove', alMover);
    escena.removeEventListener('pointerup', alSubir);
    escena.removeEventListener('pointercancel', alSubir);
    if (img) img.style.transform = '';
    arrastrando = false;
    img = null;
    escena = null;
  }

  function alBajar(e) {
    arrastrando = true;
    px = e.clientX; py = e.clientY;
    escena.setPointerCapture(e.pointerId);
  }

  function alMover(e) {
    if (!arrastrando) return;
    x += e.clientX - px;
    y += e.clientY - py;
    px = e.clientX; py = e.clientY;
    recortar();
    pintar();
  }

  function alSubir() { arrastrando = false; }

  function desplazar(dx, dy) {
    if (!img) return;
    x += dx * PASO_TECLADO;
    y += dy * PASO_TECLADO;
    recortar();
    pintar();
  }

  return { entrar: entrar, salir: salir, puedeAmpliar: puedeAmpliar, desplazar: desplazar };
})();
```

- [ ] **Step 3: Conectarla desde `js/visor.js`**

Añadir al `init()`:

```js
escena.addEventListener('click', function () {
  if (!estado.abierto) return;
  alternarLupa();
});
```

Y las funciones:

```js
function alternarLupa() {
  var img = escena.querySelector('img');
  if (!estado.lupa && !window.VisorLupa.puedeAmpliar(img)) return;

  estado = window.VisorEstado.alternarLupa(estado);

  if (estado.lupa) {
    raiz.classList.add('lupa');
    if (!window.VisorLupa.entrar(escena)) {
      estado = window.VisorEstado.alternarLupa(estado);
      raiz.classList.remove('lupa');
    }
  } else {
    window.VisorLupa.salir(escena);
    raiz.classList.remove('lupa');
  }
  despertarChrome();
}
```

En `alPulsarTecla`, antes de las flechas, añadir el desvío para la lupa:

```js
if (estado.lupa && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
                    e.key === 'ArrowUp'    || e.key === 'ArrowDown')) {
  e.preventDefault();
  var dx = (e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0);
  var dy = (e.key === 'ArrowUp'   ? 1 : e.key === 'ArrowDown'  ? -1 : 0);
  window.VisorLupa.desplazar(dx, dy);
  despertarChrome();
  return;
}
```

En la rama de `Escape`, cuando el estado que devuelve `escapar` ya no tiene lupa pero el anterior sí, hay que soltar la lupa además de repintar:

```js
if (e.key === 'Escape') {
  e.preventDefault();
  var tras = window.VisorEstado.escapar(estado);
  if (estado.lupa && !tras.lupa) { window.VisorLupa.salir(escena); raiz.classList.remove('lupa'); }
  if (!tras.abierto) cerrar();
  else { estado = tras; renderizar(); }
  return;
}
```

Y en `renderizar()`, como primera línea, salir de la lupa si estaba puesta al cambiar de pieza:

```js
if (raiz.classList.contains('lupa') && !estado.lupa) {
  window.VisorLupa.salir(escena);
  raiz.classList.remove('lupa');
}
```

- [ ] **Step 4: Cargar el módulo**

En `index.html`, `<script src="js/visor-lupa.js"></script>` antes de `js/visor.js`.

- [ ] **Step 5: Verificar a mano**

1. Un clic sobre la foto la lleva a resolución nativa y el ratón la arrastra.
2. La imagen no se puede arrastrar más allá de sus bordes: no aparece fondo negro por los lados.
3. Las flechas del teclado la desplazan en las cuatro direcciones.
4. Estando en lupa, las flechas **no** cambian de pieza.
5. Un segundo clic, o `Esc`, sale de la lupa y deja el visor abierto.
6. Un segundo `Esc` ya cierra el visor.
7. Con una imagen más pequeña que el hueco, el clic no hace nada y no queda ningún estado a medias.

- [ ] **Step 6: Commit**

```bash
git add index.html css/luque.css js/visor-lupa.js js/visor.js
git commit -m "Añadir la lupa del visor

Un clic sobre la foto la lleva a resolución nativa y se arrastra para
recorrerla, con un solo nivel de aumento. Se recorta a los bordes de la
imagen y con lupa puesta las flechas desplazan en vez de cambiar de
pieza.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: La ficha técnica

**Files:**
- Modify: `index.html`, `css/luque.css`, `js/visor.js`

**Interfaces:**
- Consumes: `VisorEstado.alternarFicha`, `Datos.porId().ficha`.
- Produces: nada nuevo hacia fuera.

- [ ] **Step 1: Añadir el marcado**

Dentro de `.visor-chrome`, después de `<nav class="visor-tira">`:

```html
<aside class="visor-ficha" id="visorFicha" aria-hidden="true">
  <p class="visor-ficha-cat" id="fichaCat"></p>
  <p class="visor-ficha-titulo" id="fichaTitulo"></p>
  <dl class="visor-ficha-datos" id="fichaDatos"></dl>
</aside>
```

Y en `.visor-acciones`, antes del contador:

```html
<button class="visor-info" id="visorInfo" type="button"
        aria-expanded="false" aria-controls="visorFicha">Ficha</button>
```

- [ ] **Step 2: Escribir el CSS**

```css
.visor-ficha{
  position:absolute; top:0; bottom:0; left:0;
  width:340px;
  background:var(--yellow);
  color:var(--black);
  padding:32px 28px;
  transform:translateX(-100%);
  transition:transform 0.45s cubic-bezier(.2,.7,.2,1);
  z-index:4;
  overflow-y:auto;
}
.visor.ficha-abierta .visor-ficha{ transform:translateX(0); }
.visor.ficha-abierta .visor-escena{ left:404px; }

.visor-escena{ transition:left 0.45s cubic-bezier(.2,.7,.2,1); }

.visor-ficha-cat{
  font-size:0.68rem; font-weight:500;
  letter-spacing:0.18em; text-transform:uppercase;
  opacity:0.55;
}
.visor-ficha-titulo{
  font-size:2.4rem; font-weight:700;
  letter-spacing:-0.05em; line-height:0.95;
  margin:14px 0 22px;
}
.visor-ficha-datos{ font-size:0.8rem; }
.visor-ficha-datos div{
  display:flex; justify-content:space-between; gap:16px;
  padding:9px 0;
  border-top:1px solid rgba(10,10,10,0.25);
}
.visor-ficha-datos div:last-child{ border-bottom:1px solid rgba(10,10,10,0.25); }
.visor-ficha-datos dt{ opacity:0.6; }
.visor-ficha-datos dd{ text-align:right; }

.visor-info{
  border:none; background:none; padding:0;
  color:var(--yellow);
  font:inherit;
  font-size:0.68rem; font-weight:700;
  letter-spacing:0.18em; text-transform:uppercase;
  cursor:none;
}
.visor-info:hover{ opacity:0.5; }

@media (max-width: 860px){
  .visor-ficha{ width:100%; }
  .visor.ficha-abierta .visor-escena{ left:64px; opacity:0; }
}

@media (prefers-reduced-motion: reduce){
  .visor-ficha, .visor-escena{ transition:none; }
}
```

- [ ] **Step 3: Conectarla desde `js/visor.js`**

```js
var elFicha, elInfo;
// en init():
elFicha = document.getElementById('visorFicha');
elInfo  = document.getElementById('visorInfo');
elInfo.addEventListener('click', alternarFicha);

function alternarFicha() {
  estado = window.VisorEstado.alternarFicha(estado);
  raiz.classList.toggle('ficha-abierta', estado.ficha);
  elFicha.setAttribute('aria-hidden', estado.ficha ? 'false' : 'true');
  elInfo.setAttribute('aria-expanded', estado.ficha ? 'true' : 'false');
  despertarChrome();
}

function pintarFicha() {
  document.getElementById('fichaCat').textContent = proyecto.categoria.replace('-', ' ');
  document.getElementById('fichaTitulo').textContent = proyecto.titulo;
  var dl = document.getElementById('fichaDatos');
  dl.innerHTML = '';
  var filas = [
    ['Cliente', proyecto.ficha.cliente],
    ['Año',     proyecto.ficha.anio],
    ['Cámara',  proyecto.ficha.camara],
    ['Óptica',  proyecto.ficha.optica],
    ['Piezas',  estado.total]
  ];
  filas.forEach(function (f) {
    var fila = document.createElement('div');
    var dt = document.createElement('dt'); dt.textContent = f[0];
    var dd = document.createElement('dd'); dd.textContent = f[1];
    fila.appendChild(dt); fila.appendChild(dd);
    dl.appendChild(fila);
  });
}
```

Llamar a `pintarFicha()` desde `abrir()`, justo después de `construirTira()`.

En `alPulsarTecla`, añadir antes de las flechas:

```js
if (e.key === 'i' || e.key === 'I') { e.preventDefault(); alternarFicha(); return; }
```

En la rama de `Escape`, cerrar también la clase cuando la ficha se recoge:

```js
if (estado.ficha && !tras.ficha) raiz.classList.remove('ficha-abierta');
```

Y en `cerrarSinTocarLaRuta`, dentro de `rematar()`, añadir `raiz.classList.remove('ficha-abierta');`.

- [ ] **Step 4: Verificar a mano**

1. La tecla `i` o el botón «Ficha» despliegan un panel amarillo desde la izquierda.
2. La foto se recoloca a la derecha en lugar de quedar tapada.
3. Los cinco datos aparecen con el mismo aspecto de la maqueta: etiqueta apagada a la izquierda, valor a la derecha, filetes finos entre filas.
4. Pulsar `i` otra vez la recoge.
5. Con la ficha abierta, `Esc` la cierra y deja el visor abierto; un segundo `Esc` ya cierra el visor.
6. Cerrar el visor con la ficha abierta y volver a abrir otro proyecto: la ficha aparece recogida.
7. En una ventana estrecha, la ficha ocupa todo el ancho y la foto se aparta.

- [ ] **Step 5: Commit**

```bash
git add index.html css/luque.css js/visor.js
git commit -m "Añadir la ficha técnica desplegable del visor

La tecla i despliega desde la izquierda un panel amarillo con cliente,
año, cámara y óptica, y la foto se recoloca en lugar de quedar tapada.
Nunca aparece por defecto.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: El modo vídeo

Mismo marco exacto. Solo cambian dos cosas: la escena lleva un `<video>` en vez de un `<img>`, y la tira de miniaturas se sustituye por la línea de tiempo.

**Files:**
- Modify: `index.html`, `css/luque.css`, `js/visor.js`

**Interfaces:**
- Consumes: `Datos.porId().video`.
- Produces: nada nuevo hacia fuera.

- [ ] **Step 1: Añadir el marcado de la línea de tiempo**

Dentro de `.visor-chrome`, junto a `<nav class="visor-tira">`:

```html
<div class="visor-linea" id="visorLinea" role="slider" tabindex="0"
     aria-label="Posición del vídeo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <span class="visor-linea-hecho" id="visorLineaHecho"></span>
  <span class="visor-linea-marca" id="visorLineaMarca"><i></i><i></i></span>
</div>
```

- [ ] **Step 2: Escribir el CSS**

```css
.visor-linea{ display:none; }
.visor.video .visor-tira{ display:none; }
.visor.video .visor-linea{
  display:block;
  position:absolute; bottom:52px; left:60px; right:60px;
  height:3px;
  background:rgba(255,255,0,0.25);
  cursor:none;
}
.visor-linea-hecho{
  position:absolute; top:0; left:0; height:100%;
  width:0;
  background:var(--yellow);
}
.visor-linea-marca{
  position:absolute; top:50%; left:0;
  width:0; height:0;
  transform:translateY(-50%);
}
.visor-linea-marca i{
  position:absolute;
  width:9px; height:9px;
  border:2px solid var(--yellow);
}
.visor-linea-marca i:first-child{ top:-11px; left:-5px; border-right:none; border-bottom:none; }
.visor-linea-marca i:last-child{  top:2px;   left:-5px; border-right:none; border-top:none; }

.visor-escena video{
  max-width:100%; max-height:100%;
  object-fit:contain;
  display:block;
  transform-origin:0 0;
}

.visor.video .visor-escena{ inset:82px 64px 104px; }

@media (max-width: 720px){
  .visor.video .visor-linea{ left:26px; right:26px; bottom:40px; }
}
```

- [ ] **Step 3: Aceptar proyectos de vídeo en `js/visor.js`**

En `abrir(id)`, sustituir la comprobación de entrada:

```js
var p = window.Datos.porId(id);
if (!p) return;
var esVideo = !!p.video;
```

y el cálculo del total:

```js
estado = window.VisorEstado.abrir(estado, id, esVideo ? 1 : p.piezas.length);
raiz.classList.toggle('video', esVideo);
```

La imagen de origen del vuelo sigue siendo la del lienzo, que en un proyecto de vídeo es el `poster`. La transición no cambia en nada.

- [ ] **Step 4: Pintar el vídeo en `renderizar()`**

Sustituir el bloque que construye la `<img>` por:

```js
escena.innerHTML = '';

if (proyecto.video) {
  var v = document.createElement('video');
  v.src = proyecto.video.src;
  v.poster = proyecto.video.poster;
  v.preload = 'metadata';
  v.playsInline = true;
  v.setAttribute('aria-label', proyecto.titulo);
  escena.appendChild(v);
  conectarVideo(v);
  elContador.textContent = '';
} else {
  var img = document.createElement('img');
  img.src = piezas()[estado.indice];
  img.alt = proyecto.titulo + ', pieza ' + (estado.indice + 1) + ' de ' + estado.total;
  escena.appendChild(img);
  elContador.textContent = pad(estado.indice + 1) + ' / ' + pad(estado.total);
}
```

Y proteger el bucle de las miniaturas, que en modo vídeo no tiene nada que recorrer:

```js
Array.prototype.forEach.call(tira.children, function (b, i) {
  b.setAttribute('aria-current', i === estado.indice ? 'true' : 'false');
});
```

queda igual: `construirTira()` no crea nada cuando `piezas()` devuelve un array vacío.

- [ ] **Step 5: Escribir el control del vídeo**

```js
var video = null;

function conectarVideo(v) {
  video = v;
  var linea  = document.getElementById('visorLinea');
  var hecho  = document.getElementById('visorLineaHecho');
  var marca  = document.getElementById('visorLineaMarca');

  v.addEventListener('timeupdate', function () {
    if (!v.duration) return;
    var pct = (v.currentTime / v.duration) * 100;
    hecho.style.width = pct + '%';
    marca.style.left = pct + '%';
    linea.setAttribute('aria-valuenow', Math.round(pct));
  });

  var buscando = false;

  function buscarEn(clientX) {
    var r = linea.getBoundingClientRect();
    var pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    if (v.duration) v.currentTime = pct * v.duration;
  }

  linea.onpointerdown = function (e) { buscando = true; linea.setPointerCapture(e.pointerId); buscarEn(e.clientX); };
  linea.onpointermove = function (e) { if (buscando) buscarEn(e.clientX); };
  linea.onpointerup   = function () { buscando = false; };
  linea.onkeydown = function (e) {
    if (!v.duration) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 5); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); }
  };
}

function alternarReproduccion() {
  if (!video) return;
  if (video.paused) video.play(); else video.pause();
  despertarChrome();
}
```

En `alPulsarTecla`, antes de las flechas:

```js
if (e.key === ' ' && video) { e.preventDefault(); alternarReproduccion(); return; }
```

Y en el manejador de clic de la escena que puso la Task 10, desviar según el tipo:

```js
escena.addEventListener('click', function () {
  if (!estado.abierto) return;
  if (video) alternarReproduccion();
  else alternarLupa();
});
```

En `rematar()` de `cerrarSinTocarLaRuta`, parar el vídeo para que no siga sonando:

```js
if (video) { video.pause(); video = null; }
raiz.classList.remove('video');
```

- [ ] **Step 6: Crear la carpeta de vídeos**

Los cuatro proyectos de vídeo apuntan a `video/*.mp4`, que todavía no existen. Crear la carpeta `video/` y dejar dentro un `LEEME.txt` explicando que ahí van los archivos. Hasta que estén, el reproductor mostrará el póster y no reproducirá nada: es lo esperado.

- [ ] **Step 7: Verificar a mano**

1. Hacer clic en un videoclip o un cortometraje abre el visor con la misma transición que una foto.
2. Abajo hay una línea de tiempo fina en vez de miniaturas, con las mismas esquinas marcando la posición.
3. El contador de arriba a la derecha está vacío en modo vídeo.
4. Con un archivo real en `video/`, el espacio y el clic reproducen y pausan.
5. Arrastrar sobre la línea busca en el vídeo y la marca acompaña.
6. Con la línea enfocada por teclado, las flechas saltan cinco segundos.
7. Al cerrar el visor, el vídeo deja de sonar.
8. Abrir después una foto: vuelven las miniaturas y el contador, sin rastro del modo vídeo.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/visor.js video
git commit -m "Añadir el modo vídeo del visor

Los videoclips y cortometrajes abren en el mismo marco: el reproductor
ocupa el hueco de la foto y la tira de miniaturas se sustituye por una
línea de tiempo dibujada con las mismas esquinas. Sin controles del
navegador.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: La carga

**Files:**
- Modify: `index.html`, `css/luque.css`, `js/visor.js`

**Interfaces:**
- Consumes: los símbolos SVG `#carga-1` a `#carga-4`, que ya existen en `index.html`.
- Produces: nada nuevo hacia fuera.

- [ ] **Step 1: Añadir el indicador al marcado del visor**

Dentro de `.visor`, después de `.visor-escena`:

```html
<div class="visor-cargando" id="visorCargando" aria-hidden="true">
  <div class="brand-frames">
    <div class="frame"><svg viewBox="0 0 290 290"><use href="#carga-1" width="290" height="290"/></svg></div>
    <div class="frame"><svg viewBox="0 0 290 290"><use href="#carga-2" width="290" height="290"/></svg></div>
    <div class="frame"><svg viewBox="0 0 290 290"><use href="#carga-3" width="290" height="290"/></svg></div>
    <div class="frame"><svg viewBox="0 0 290 290"><use href="#carga-4" width="290" height="290"/></svg></div>
  </div>
</div>
```

- [ ] **Step 2: Escribir el CSS**

```css
.visor-cargando{
  position:absolute; inset:0;
  display:none;
  align-items:center; justify-content:center;
  z-index:5;
  pointer-events:none;
  color:var(--yellow);
}
.visor.cargando .visor-cargando{ display:flex; }
.visor-cargando .brand-frames{ width:min(20vw, 110px); }
.visor-cargando svg{ fill:currentColor; }
```

Los símbolos vienen sin `fill` propio, así que heredan el `currentColor` amarillo. Es el mismo mecanismo que usa el navbar.

- [ ] **Step 3: Mostrar y ocultar el indicador**

En `js/visor.js`:

```js
function marcarCargando(si) {
  raiz.classList.toggle('cargando', si);
}
```

En `renderizar()`, tras crear la `<img>`:

```js
if (!img.complete) {
  marcarCargando(true);
  img.addEventListener('load',  function () { marcarCargando(false); }, { once: true });
  img.addEventListener('error', function () { marcarCargando(false); }, { once: true });
} else {
  marcarCargando(false);
}
```

El manejador de `error` es tan importante como el de `load`: sin él, una ruta rota dejaría el indicador girando para siempre.

- [ ] **Step 4: Precargar la pieza siguiente**

```js
function precargar(indice) {
  var lista = piezas();
  if (indice < 0 || indice >= lista.length) return;
  var i = new Image();
  i.src = lista[indice];
}
```

Al final de `renderizar()`, en la rama de fotos:

```js
precargar(estado.indice + 1);
precargar(estado.indice - 1);
```

- [ ] **Step 5: Verificar a mano**

1. Abrir un proyecto con conexión lenta simulada desde las herramientas del navegador: aparece la secuencia de cuatro fotogramas en amarillo sobre negro mientras carga la foto.
2. Al terminar, desaparece y se ve la imagen.
3. Cambiar de pieza con la flecha derecha va casi instantáneo, porque ya estaba precargada.
4. Apuntar a mano una pieza a una ruta inexistente en `datos.js`: el indicador desaparece igualmente y no se queda colgado. Deshacer el cambio después.
5. En el lienzo, las fotos de abajo del todo no se descargan hasta acercarse a ellas: comprobarlo en la pestaña de red del navegador.

- [ ] **Step 6: Commit**

```bash
git add index.html css/luque.css js/visor.js
git commit -m "Añadir el estado de carga y la precarga del visor

Reutiliza la secuencia de cuatro fotogramas del preloader, en amarillo
sobre negro, mientras carga una pieza, y precarga la anterior y la
siguiente. El manejador de error evita que una ruta rota deje el
indicador girando para siempre.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: El teclado en el lienzo, y el repaso final

Los proyectos ya son botones enfocables desde la Task 5, pero al tabular hacia uno que está fuera de la pantalla el lienzo no se mueve: el foco se va a un elemento invisible. Esta tarea lo arregla y cierra el trabajo comprobando el plan contra los criterios de aceptación de la especificación.

**Files:**
- Modify: `js/galeria.js`, `index.html`, `css/luque.css`
- Modify: `docs/superpowers/specs/2026-07-28-visor-galeria-design.md` solo si algún criterio ha cambiado por el camino

**Interfaces:**
- Consumes: `clamp`, `targetX`, `targetY`, `minX`, `minY`, `stageW`, `stageH`, ya existentes en `galeria.js`.
- Produces: `Galeria.centrarEn(elemento)`.

- [ ] **Step 1: Centrar el lienzo sobre el proyecto que recibe el foco**

En `js/galeria.js`, dentro de `init()`:

```js
function centrarEn(el) {
  var r = el.getBoundingClientRect();
  var s = stage.getBoundingClientRect();
  targetX = clamp(targetX + (s.left + stageW / 2) - (r.left + r.width  / 2), minX, 0);
  targetY = clamp(targetY + (s.top  + stageH / 2) - (r.top  + r.height / 2), minY, 0);
}

stage.addEventListener('focusin', function (e) {
  var boton = e.target.closest ? e.target.closest('.proj') : null;
  if (!boton) return;
  document.getElementById('gallery').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  centrarEn(boton);
});
```

Se trabaja con deltas entre rectángulos en lugar de recalcular coordenadas absolutas: así funciona igual con el lienzo sin filtrar y con el filtrado, sin conocer las escalas de cada pieza.

Añadir `centrarEn` al objeto que devuelve el módulo.

- [ ] **Step 2: Decir que se puede usar el teclado**

El texto de la pista dice hoy «Mueve el ratón para explorar», que es falso para quien no usa ratón. En `index.html`:

```html
<span class="spatial-hint">Mueve el ratón o usa el tabulador para explorar</span>
```

- [ ] **Step 3: Verificar el teclado**

1. Cargar la web, bajar a la galería y pulsar el tabulador repetidamente: el foco recorre los doce proyectos.
2. Cada vez que el foco llega a uno que estaba fuera de la vista, el lienzo se desplaza para centrarlo.
3. El contorno negro de foco se ve con claridad sobre el amarillo.
4. `Enter` o `Espacio` sobre un proyecto enfocado abre el visor.
5. Al cerrar el visor, el foco vuelve a ese mismo proyecto y el lienzo sigue donde estaba.
6. Con una categoría filtrada, el tabulador solo recorre los proyectos visibles; los apagados se saltan.

- [ ] **Step 4: Repasar los criterios de aceptación de la especificación**

Abrir `docs/superpowers/specs/2026-07-28-visor-galeria-design.md` y comprobar los ocho criterios uno a uno, anotando el resultado:

1. Clic en cualquier proyecto abre el visor con la transición, y cerrarlo devuelve la foto a su hueco exacto.
2. Añadir un proyecto es añadir un objeto a `js/datos.js` y nada más. Probarlo de verdad: añadir uno, comprobar que aparece en el lienzo y se abre, y quitarlo después.
3. Pulsar una categoría desvanece el resto y recompone el lienzo; volver a pulsarla lo restaura.
4. `#/bruma` abre la web con el visor de ese proyecto ya montado.
5. La web funciona abriendo `index.html` con doble clic, sin servidor. Comprobarlo cerrando cualquier servidor local.
6. El visor completo es operable solo con teclado y `Esc` sale capa a capa: lupa, ficha, visor.
7. Con `prefers-reduced-motion: reduce` no hay desplazamientos ni escalados en ningún sitio.
8. Ningún archivo de `js/` supera las 300 líneas. Comprobarlo:

```bash
wc -l js/*.js | sort -n
```

Si `visor.js` las rebasa, sacar la ficha técnica a `js/visor-ficha.js` con el mismo patrón que `visor-lupa.js`.

- [ ] **Step 5: Pasar el arnés una última vez**

Abrir `tests/test.html`.
Esperado: `——— 44 pasan, 0 fallan ———`, sin ninguna línea roja.

- [ ] **Step 6: Commit**

```bash
git add index.html css/luque.css js/galeria.js
git commit -m "Permitir explorar el lienzo con el teclado

Al tabular hacia un proyecto que está fuera de la vista, el lienzo se
desplaza para centrarlo. La pista deja de prometer solo el ratón.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Notas del repaso del plan

Al revisar el plan contra la especificación aparecieron cuatro cosas que conviene tener presentes durante la implementación.

**El cursor no puede apagarse durante toda la sesión del visor.** El CSS pone `cursor:none` en el `body`, así que ocultar el cursor personalizado mientras el visor está abierto dejaría al usuario sin puntero de ninguna clase. Solo se apaga durante los 620 ms del viaje. Está resuelto en la Task 9, pero es el tipo de detalle que se rompe con facilidad al refactorizar.

**La deformación durante el vuelo.** La foto del lienzo va recortada a 4:5 con `object-fit:cover` y la del visor va entera con `contain`, así que el vuelo usa una escala distinta en cada eje y la imagen se deforma ligeramente durante los 620 ms. A esa velocidad no debería notarse. Si al verlo resulta molesto, la solución es envolver la imagen del visor en un contenedor con `aspect-ratio:4/5` y `overflow:hidden` que vuele con escala uniforme, y fundir a la imagen contenida al aterrizar. No se ha incluido de entrada porque duplica el código de la transición para resolver algo que puede no ser un problema.

**GSAP no llega a la curva pedida.** La compilación gratuita que carga la web no trae `CustomEase`, así que la restricción de `cubic-bezier(.2,.7,.2,1)` solo se puede cumplir con transiciones de CSS. Por eso la Task 6 anima el filtrado con GSAP usando `power2.out`, que es una aproximación, mientras que la Task 9 anima la transición del visor con CSS y la curva exacta. Si la diferencia entre ambos movimientos se nota, pasar el filtrado también a transiciones de CSS.

**La mitigación del riesgo de la lupa no se puede aplicar tal cual.** La especificación propone cargar la versión de resolución completa solo al entrar en la lupa y liberarla al salir, pero eso da por supuesto que cada pieza existe en dos resoluciones, y el modelo de datos tiene una sola URL por pieza. La Task 10 amplía la imagen que ya está cargada, que es lo único posible con los datos actuales. Si con fotos reales muy grandes la memoria se resiente, la solución es añadir a `datos.js` un campo `piezasGrandes` paralelo a `piezas` y que `VisorLupa.entrar()` intercambie el `src` al entrar y lo devuelva al salir. No se ha incluido de entrada porque duplicaría el mantenimiento de cada proyecto para resolver algo que quizá no ocurra.

**Lo que el arnés no cubre.** Las 44 pruebas comprueban el enrutado, la validación de datos, el cálculo de la composición filtrada y las capas de `Esc`. No comprueban nada visual: ni la transición, ni el encuadre de las esquinas, ni el desvanecimiento de la interfaz. Esa parte va a ojo, con las listas de verificación de cada tarea, y es donde hay que mirar con más cuidado.


