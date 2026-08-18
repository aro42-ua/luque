# Bloque 2 — El contenido deja de estar escrito a mano

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development
> (recomendada) o superpowers:executing-plans para implementar tarea por tarea.
> Los pasos usan casillas (`- [ ]`) para marcar el avance.

**Objetivo:** Que los proyectos de la web vengan de un `contenido.json` en lugar de estar
escritos a mano en `js/datos.js`, y que su posición en el lienzo la genere un único sistema
de ranuras en lugar de coordenadas puestas a dedo.

**Arquitectura:** Un módulo nuevo `Composicion` genera posiciones deterministas a partir del
número de proyectos, en dos densidades: `amplio` para el lienzo explorable y `compacto` para
la vista filtrada. `Contenido` pide `/contenido.json` al arrancar y se lo entrega a `Datos`,
que pasa de contener los proyectos a custodiarlos. El arranque se vuelve asíncrono.

**Tech Stack:** HTML, CSS y JavaScript ES5 clásico. Sin compilación, sin dependencias, sin
Node en tiempo de ejecución. Desplegado como Worker de Cloudflare con recursos estáticos.

**Spec:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`

## Restricciones globales

- **Ningún archivo de `js/` supera las 300 líneas.** `galeria.js` está hoy en 294: por eso la
  Tarea 2 lo parte antes de que ninguna otra le añada nada.
- **Sin paso de compilación y sin dependencias.** Nada de npm en tiempo de ejecución.
- **ES5 clásico:** `window.Nombre = (function () { ... })()` y `<script src>`. Nada de
  módulos ES, `import`, `export` ni `type="module"`.
- **Comentarios, identificadores y mensajes en español.**
- **Animar sólo** `transform`, `opacity`, `filter`, `color` y `background-color`. Nunca
  `width`, `height`, `left` ni `top`: son propiedades de layout.
- **Curva y duración de las transiciones existentes:** `cubic-bezier(.2,.7,.2,1)`, 620 ms.
- **La composición debe ser determinista.** Nada de `Math.random()`: dos cargas de la misma
  lista tienen que dar exactamente el mismo lienzo.
- **Dos proyectos no pueden solaparse nunca**, sea cual sea su número.
- El arnés es `tests/test.html` y **lo ejecuta el controlador**, no los subagentes.
  Los subagentes sí pueden ejecutar `python tests/auditar_rutas.py`.

## Aviso: el aspecto del lienzo va a cambiar

Al sustituir las coordenadas a mano por ranuras generadas, la composición sin filtrar dejará
de ser la que hay hoy. Está aceptado en la especificación y es el precio de que el panel
pueda añadir proyectos sin pedirle a nadie que invente coordenadas. **La Tarea 4 es el
momento en que cambia, y necesita ojos humanos.**

## Estructura de archivos

```
js/composicion.js      NUEVO   el sistema único de ranuras (sustituye layout-filtrado.js)
js/galeria-paneo.js    NUEVO   medir, inercia, ratón, táctil y centrado
js/galeria.js          PARTE   se queda con construir, filtrar y el navbar
js/contenido.js        NUEVO   pide /contenido.json y valida lo que llega
js/datos.js            CAMBIA  deja de contener proyectos; los custodia
contenido.json         NUEVO   los doce proyectos migrados
index.html             CAMBIA  arranque asíncrono
css/luque.css          CAMBIA  quita el tamaño de lienzo de la consulta de móvil
tests/pruebas-composicion.js  NUEVO
tests/pruebas-contenido.js    NUEVO
tests/pruebas-layout.js       SE BORRA (lo sustituye pruebas-composicion.js)
```

---

### Tarea 1: El sistema único de ranuras

**Archivos:**
- Crear: `js/composicion.js`
- Crear: `tests/pruebas-composicion.js`
- Modificar: `tests/test.html` (añadir los dos `<script>`)

**Interfaces:**
- Consume: nada.
- Produce:
  - `window.Composicion.disponer(cantidad, modo)` → array de `{x, y, w}` en vw, longitud `cantidad`
  - `window.Composicion.tamano(cantidad, modo)` → `{ancho, alto}` en vw
  - `modo` es `'amplio'` o `'compacto'`. Cualquier otro valor lanza `Error`.

**Por qué dos modos y no uno.** El lienzo sin filtrar mide hoy 240vw de ancho y es lo que
hace que la galería sea un espacio que se recorre. Si se generase con las ranuras compactas
pasaría a 100vw, cabría entero en pantalla y **desaparecería el paneo**, que es la galería
entera. Un solo generador, dos densidades.

**Cómo se garantiza que nada se solapa.** Cada proyecto vive dentro de una celda de una
rejilla, y su caja nunca se sale de su celda. Como las celdas son disjuntas, el no solape es
una propiedad de la construcción, no algo que haya que comprobar caso por caso. La
irregularidad la dan seis anchos y seis sesgos deterministas que se repiten cíclicamente.

- [ ] **Paso 1: Escribe la prueba que falla**

Crea `tests/pruebas-composicion.js`:

```js
describe('Composicion.disponer', function () {
  prueba('devuelve una posición por proyecto', function () {
    igual(Composicion.disponer(3, 'amplio').length, 3);
    igual(Composicion.disponer(12, 'amplio').length, 12);
    igual(Composicion.disponer(5, 'compacto').length, 5);
  });

  prueba('es determinista: dos llamadas dan lo mismo', function () {
    igual(Composicion.disponer(9, 'amplio'), Composicion.disponer(9, 'amplio'));
  });

  prueba('no depende de cuántos vengan detrás', function () {
    var pocos = Composicion.disponer(3, 'amplio');
    var muchos = Composicion.disponer(30, 'amplio');
    igual(pocos[0], muchos[0]);
    igual(pocos[2], muchos[2]);
  });

  prueba('el modo amplio da un lienzo de 240vw y el compacto de 100vw', function () {
    igual(Composicion.tamano(12, 'amplio').ancho, 240);
    igual(Composicion.tamano(12, 'compacto').ancho, 100);
  });

  prueba('el lienzo crece con el número de proyectos', function () {
    cierto(Composicion.tamano(24, 'amplio').alto > Composicion.tamano(6, 'amplio').alto);
  });

  prueba('un modo desconocido es un error, no un lienzo raro', function () {
    var hubo = false;
    try { Composicion.disponer(3, 'mediano'); } catch (e) { hubo = true; }
    cierto(hubo);
  });

  prueba('todo cabe dentro del lienzo', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 1; n <= 40; n++) {
        var t = Composicion.tamano(n, modo);
        Composicion.disponer(n, modo).forEach(function (r) {
          cierto(r.x >= 0);
          cierto(r.y >= 0);
          cierto(r.x + r.w <= t.ancho + 0.001);
          cierto(r.y + r.w * 1.25 <= t.alto + 0.001);
        });
      }
    });
  });

  prueba('NINGÚN par se solapa, con cualquier número de proyectos', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 2; n <= 40; n++) {
        var rs = Composicion.disponer(n, modo);
        for (var i = 0; i < rs.length; i++) {
          for (var j = i + 1; j < rs.length; j++) {
            var a = rs[i], b = rs[j];
            var separados =
              a.x + a.w <= b.x + 0.001 || b.x + b.w <= a.x + 0.001 ||
              a.y + a.w * 1.25 <= b.y + 0.001 || b.y + b.w * 1.25 <= a.y + 0.001;
            cierto(separados);
          }
        }
      }
    });
  });

  prueba('las cajas no son todas iguales: la composición es irregular', function () {
    var anchos = {};
    Composicion.disponer(12, 'amplio').forEach(function (r) { anchos[r.w] = true; });
    cierto(Object.keys(anchos).length >= 4);
  });
});
```

Añade a `tests/test.html`, justo donde hoy está `layout-filtrado.js`:

```html
<script src="../js/composicion.js"></script>
```

y donde hoy está `pruebas-layout.js`:

```html
<script src="pruebas-composicion.js"></script>
```

Deja de momento `layout-filtrado.js` y `pruebas-layout.js` en su sitio: los borra la Tarea 4,
cuando ya nadie los use.

- [ ] **Paso 2: Comprueba que la prueba falla**

Pide al controlador que ejecute el arnés. Esperado: fallan las nueve pruebas nuevas con
`Composicion is not defined`.

- [ ] **Paso 3: Escribe `js/composicion.js`**

```js
window.Composicion = (function () {
  /* Las fotos son 4:5, así que el alto de una caja es su ancho por 1,25.
     El resto del sitio da esa proporción por supuesta (.proj usa
     aspect-ratio:4/5), así que aquí no se inventa: se respeta. */
  var PROPORCION = 1.25;

  /* La irregularidad es lo que hace que el espacio se sienta explorable y no
     tabulado. Sale de estas tres listas, que se recorren cíclicamente: nada de
     Math.random(), porque la composición tiene que ser idéntica en cada carga.
     Son fracciones del ancho y del alto de la celda. */
  var ANCHOS  = [0.62, 0.50, 0.56, 0.44, 0.60, 0.48];
  var SESGO_X = [0.06, 0.28, 0.14, 0.34, 0.02, 0.22];
  var SESGO_Y = [0.10, 0.02, 0.26, 0.14, 0.32, 0.06];

  /* amplio: el lienzo que se recorre con el ratón. 4 x 60 = 240vw, que es
     exactamente el ancho que tiene hoy el lienzo hecho a mano.
     compacto: la vista filtrada. 2 x 50 = 100vw, el ancho que ya usaba. */
  var MODOS = {
    amplio:   { columnas: 4, anchoCelda: 60 },
    compacto: { columnas: 2, anchoCelda: 50 }
  };

  /* El alto de celda no se elige a ojo: se calcula para que la caja más alta
     que puede caer en una celda quepa dentro con su sesgo incluido. Así el no
     solape es una propiedad de la construcción y no algo que haya que vigilar
     cada vez que alguien toque las listas de arriba. */
  function altoDeCelda(anchoCelda) {
    var maximo = 0;
    for (var i = 0; i < ANCHOS.length; i++) {
      var necesario = anchoCelda * ANCHOS[i] * PROPORCION / (1 - SESGO_Y[i]);
      if (necesario > maximo) maximo = necesario;
    }
    return Math.ceil(maximo);
  }

  function config(modo) {
    var m = MODOS[modo];
    if (!m) throw new Error('Modo de composición desconocido: ' + modo);
    return { columnas: m.columnas, anchoCelda: m.anchoCelda, altoCelda: altoDeCelda(m.anchoCelda) };
  }

  function disponer(cantidad, modo) {
    var c = config(modo);
    var salida = [];
    for (var i = 0; i < cantidad; i++) {
      var v = i % ANCHOS.length;
      var columna = i % c.columnas;
      var fila = Math.floor(i / c.columnas);
      salida.push({
        x: columna * c.anchoCelda + c.anchoCelda * SESGO_X[v],
        y: fila    * c.altoCelda  + c.altoCelda  * SESGO_Y[v],
        w: c.anchoCelda * ANCHOS[v]
      });
    }
    return salida;
  }

  function tamano(cantidad, modo) {
    var c = config(modo);
    var filas = Math.max(1, Math.ceil(cantidad / c.columnas));
    return { ancho: c.columnas * c.anchoCelda, alto: filas * c.altoCelda };
  }

  return { disponer: disponer, tamano: tamano };
})();
```

- [ ] **Paso 4: Comprueba que la prueba pasa**

Pide al controlador que ejecute el arnés. Esperado: las nueve nuevas pasan y las 51 anteriores
siguen pasando.

- [ ] **Paso 5: Commit**

```bash
git add js/composicion.js tests/pruebas-composicion.js tests/test.html
git commit -m "Generar la composicion con un solo sistema de ranuras"
```

---

### Tarea 2: Partir `galeria.js` antes de tocarlo

**Archivos:**
- Crear: `js/galeria-paneo.js`
- Modificar: `js/galeria.js`
- Modificar: `index.html` (añadir el `<script>` antes de `galeria.js`)

**Interfaces:**
- Consume: nada nuevo.
- Produce: `window.GaleriaPaneo` con
  - `init(escenario, lienzo)` — guarda las referencias y arranca el bucle
  - `medir()` — recalcula tamaños y límites; deja el lienzo en reposo
  - `centrarEn(elemento)` — centra el lienzo sobre ese elemento
  - `congelar()` / `descongelar()`
  - `estaCongelado()` → boolean

**Esta tarea no cambia ni un comportamiento.** Es una mudanza. `galeria.js` está en 294 líneas
de un máximo de 300, así que cualquier añadido de las tareas siguientes lo rompería. Se parte
por responsabilidades: **mover el lienzo** por un lado, **componerlo y filtrarlo** por otro.

- [ ] **Paso 1: Crea `js/galeria-paneo.js`**

Mueve a este archivo, **sin cambiar su lógica**, lo siguiente de `js/galeria.js`:
`stage`, `canvas`, `stageW`, `stageH`, `canvasW`, `canvasH`, `minX`, `minY`, `curX`, `curY`,
`targetX`, `targetY`, `raf`, `paneoCongelado`, `clamp`, `measure`, `loop`, `centrarEn`, y los
manejadores de `mousemove`, `mouseleave`, `pointerdown`, `pointermove`, `pointerup` y
`pointercancel` con su detección `isFinePointer`.

El esqueleto, con los nombres que las demás tareas esperan:

```js
window.GaleriaPaneo = (function () {
  var stage = null, canvas = null;
  var stageW = 0, stageH = 0, canvasW = 0, canvasH = 0;
  var minX = 0, minY = 0;
  var curX = 0, curY = 0, targetX = 0, targetY = 0;
  var raf = null;
  var congelado = false;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function medir() { /* el cuerpo de measure(), tal cual */ }
  function loop()  { /* el cuerpo de loop(), tal cual */ }
  function centrarEn(el) { /* el cuerpo de centrarEn(), tal cual */ }

  function congelar()      { congelado = true; }
  function descongelar()   { congelado = false; }
  function estaCongelado() { return congelado; }

  function init(escenario, lienzo) {
    stage = escenario; canvas = lienzo;
    window.addEventListener('resize', medir);
    medir();
    loop();
    /* aquí van los manejadores de ratón y táctil, tal cual estaban,
       cambiando `paneoCongelado` por `congelado` */
  }

  return {
    init: init, medir: medir, centrarEn: centrarEn,
    congelar: congelar, descongelar: descongelar, estaCongelado: estaCongelado
  };
})();
```

- [ ] **Paso 2: Adelgaza `js/galeria.js`**

Quita de `galeria.js` todo lo movido. Donde llamaba a `measure()`, llama a
`window.GaleriaPaneo.medir()`; donde usaba `paneoCongelado = true/false`, llama a
`congelar()`/`descongelar()` de `GaleriaPaneo`; donde llamaba a `centrarEn`, usa el de
`GaleriaPaneo`.

En `init()` de `galeria.js`, sustituye el bloque de medición y manejadores por:

```js
    stage  = document.getElementById('spatialStage');
    canvas = document.getElementById('spatialCanvas');
    if (!stage || !canvas) return;

    window.GaleriaPaneo.init(stage, canvas);

    // El foco llega por clic, restauración o el tabulador (GaleriaTeclado);
    // en todos los casos basta centrar el lienzo, sin tocar el scroll.
    stage.addEventListener('focusin', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (!boton) return;
      window.GaleriaPaneo.centrarEn(boton);
    });
    window.GaleriaTeclado.init(stage, window.GaleriaPaneo.centrarEn);
```

`Galeria` mantiene su API pública actual (`congelar`, `descongelar`, `centrarEn`, `activar`,
…) delegando en `GaleriaPaneo`, para que `visor.js`, `cursor.js` y `galeria-teclado.js` no se
enteren de la mudanza:

```js
  function congelar()    { window.GaleriaPaneo.congelar(); }
  function descongelar() { window.GaleriaPaneo.descongelar(); }
  function centrarEn(el) { window.GaleriaPaneo.centrarEn(el); }
```

- [ ] **Paso 3: Añade el script a `index.html`**

`galeria-paneo.js` va **antes** que `galeria.js`:

```html
  <script src="js/galeria-paneo.js"></script>
  <script src="js/galeria.js"></script>
```

- [ ] **Paso 4: Comprueba que no has roto nada**

```bash
wc -l js/galeria.js js/galeria-paneo.js
python tests/auditar_rutas.py
```

Esperado: los dos por debajo de 300, y el auditor en `OK`. Pide además al controlador que
ejecute el arnés (deben seguir pasando todas) y que compruebe en el navegador que el lienzo
sigue moviéndose con el ratón, que `Tab` sigue centrando proyectos y que el filtrado sigue
funcionando. **Es una mudanza: si algo cambia de comportamiento, está mal.**

- [ ] **Paso 5: Commit**

```bash
git add js/galeria.js js/galeria-paneo.js index.html
git commit -m "Separar el paneo del lienzo de su composicion"
```

---

### Tarea 3: `contenido.json` y su cargador

**Archivos:**
- Crear: `contenido.json` (en la raíz del repositorio, para que se sirva en `/contenido.json`)
- Crear: `js/contenido.js`
- Crear: `tests/pruebas-contenido.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Consume: nada.
- Produce:
  - `window.Contenido.cargar(alTerminar)` — pide `/contenido.json` y llama a
    `alTerminar(proyectos, error)`. `proyectos` es siempre un array (vacío si hubo error) y
    `error` es `null` o un string en español explicando qué pasó.
  - `window.Contenido.validar(datos)` → array de strings con los problemas (vacío si todo bien)

Nada de esto se enchufa todavía: la Tarea 4 lo conecta.

**El modelo de datos**, de la especificación:

```json
{
  "version": 1,
  "proyectos": [
    {
      "id": "bruma",
      "titulo": "Bruma",
      "categoria": "editorial",
      "ficha": { "cliente": "Vogue ES", "anio": 2025,
                 "camara": "Alexa Mini", "optica": "Zeiss Super Speed" },
      "tipo": "fotos",
      "portada": 0,
      "piezas": [ { "url": "https://picsum.photos/seed/luque4_1/2400/3000" } ]
    }
  ]
}
```

- **Sin `ancho`/`alto` en las piezas, a diferencia de la especificación.** La especificación
  los pide para cuando lleguen fotografías reales de proporción variable. En este bloque las
  piezas siguen siendo picsum a tamaño fijo, y `js/visor-lupa.js:21-22,43-44` ya lee
  `img.naturalWidth`/`naturalHeight` de la imagen cargada, no de ningún dato — añadir esos
  campos ahora sería un dato que nadie lee. Se incorporan cuando el panel del bloque 3
  permita subir fotos de proporción arbitraria.
- `portada` es el **índice** de la pieza que hace de portada, no una URL.
- `tipo` vale `"fotos"` o `"video"`. Los de `video` llevan `vimeo` y `poster` en vez de
  `piezas`; en este bloque se migran con el `poster` que ya tienen y `vimeo: null`, porque
  el vídeo es el bloque 4.
- **No hay `pos`.** La posición sale del orden.

- [ ] **Paso 1: Escribe la prueba que falla**

Crea `tests/pruebas-contenido.js`:

```js
describe('Contenido.validar', function () {
  function base() {
    return {
      version: 1,
      proyectos: [
        { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
          portada: 0, ficha: {}, piezas: [{ url: 'a.jpg' }] }
      ]
    };
  }

  prueba('un contenido correcto no da problemas', function () {
    igual(Contenido.validar(base()), []);
  });

  prueba('exige que haya lista de proyectos', function () {
    cierto(Contenido.validar({ version: 1 }).length > 0);
    cierto(Contenido.validar(null).length > 0);
  });

  prueba('detecta identificadores repetidos', function () {
    var d = base();
    d.proyectos.push({ id: 'bruma', titulo: 'Otro', categoria: 'editorial',
                       tipo: 'fotos', portada: 0, ficha: {}, piezas: [{ url: 'b.jpg' }] });
    cierto(Contenido.validar(d).join(' ').indexOf('bruma') !== -1);
  });

  prueba('rechaza un id que choca con una categoría', function () {
    var d = base();
    d.proyectos[0].id = 'editorial';
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('rechaza una categoría desconocida', function () {
    var d = base();
    d.proyectos[0].categoria = 'pintura';
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de fotos sin piezas es un problema', function () {
    var d = base();
    d.proyectos[0].piezas = [];
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('la portada tiene que apuntar a una pieza que existe', function () {
    var d = base();
    d.proyectos[0].portada = 3;
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de video necesita poster', function () {
    var d = base();
    d.proyectos[0] = { id: 'humo', titulo: 'Humo', categoria: 'videoclip',
                       tipo: 'video', ficha: {}, vimeo: null };
    cierto(Contenido.validar(d).length > 0);
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../js/contenido.js"></script>
...
<script src="pruebas-contenido.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Pide el arnés al controlador. Esperado: las ocho fallan con `Contenido is not defined`.

Coloca el nuevo `<script>` **después** de `js/datos.js` y **antes** de `pruebas-contenido.js`:
`Contenido.validar` lee `window.Datos.CATEGORIAS`, así que si se cargara antes que `datos.js`
la validación fallaría con `Cannot read properties of undefined` en cuanto arrancase la
página, no sólo en la prueba.

```html
<script src="../js/datos.js"></script>
...
<script src="../js/contenido.js"></script>
```

- [ ] **Paso 3: Escribe `js/contenido.js`**

```js
window.Contenido = (function () {
  var RUTA = 'contenido.json';

  function validar(datos) {
    var problemas = [];
    if (!datos || Object.prototype.toString.call(datos.proyectos) !== '[object Array]') {
      return ['el contenido no trae una lista de proyectos'];
    }
    var cats = window.Datos.CATEGORIAS;
    var vistos = {};
    datos.proyectos.forEach(function (p, i) {
      var donde = p && p.id ? p.id : 'el proyecto n.º ' + (i + 1);
      if (!p.id)      problemas.push(donde + ': sin identificador');
      if (!p.titulo)  problemas.push(donde + ': sin título');
      if (vistos[p.id]) problemas.push('identificador repetido: ' + p.id);
      vistos[p.id] = true;
      if (cats.indexOf(p.id) !== -1) problemas.push('el id choca con una categoría: ' + p.id);
      if (cats.indexOf(p.categoria) === -1) problemas.push(donde + ': categoría desconocida: ' + p.categoria);
      if (p.tipo === 'fotos') {
        if (!p.piezas || !p.piezas.length) problemas.push(donde + ': sin piezas');
        else if (typeof p.portada !== 'number' || p.portada < 0 || p.portada >= p.piezas.length) {
          problemas.push(donde + ': la portada no apunta a ninguna pieza');
        }
      } else if (p.tipo === 'video') {
        if (!p.poster) problemas.push(donde + ': un proyecto de vídeo necesita poster');
      } else {
        problemas.push(donde + ': tipo desconocido: ' + p.tipo);
      }
    });
    return problemas;
  }

  /* Pide el contenido y NUNCA lanza: el que llama recibe siempre una lista y,
     si algo fue mal, un motivo en castellano que se pueda enseñar en pantalla.
     Una galería a medias sería peor que una galería vacía y honesta. */
  function cargar(alTerminar) {
    fetch(RUTA, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('el servidor respondió ' + r.status);
        return r.json();
      })
      .then(function (datos) {
        var problemas = validar(datos);
        if (problemas.length) {
          alTerminar([], 'El contenido tiene errores: ' + problemas.join('; '));
        } else {
          alTerminar(datos.proyectos, null);
        }
      })
      .catch(function (e) {
        alTerminar([], 'No se ha podido cargar el contenido: ' + e.message);
      });
  }

  return { cargar: cargar, validar: validar, RUTA: RUTA };
})();
```

- [ ] **Paso 4: Escribe `contenido.json`**

Migra los doce proyectos de `js/datos.js` conservando **id, titulo, categoria y ficha tal
cual**, y **en el mismo orden en que están hoy**. Reglas de conversión:

- Los que hoy tienen `piezas`: `tipo: "fotos"`, `piezas` como array de `{ "url": ... }` con
  las mismas URLs que genera hoy `serie()`, y `portada: 0`.
- Los que hoy tienen `video`: `tipo: "video"`, `poster` con la URL del póster actual, y
  `vimeo: null` — el vídeo real llega en el bloque 4.
- **Ningún proyecto lleva `pos`.**

Las URLs de las piezas hoy salen de `serie(semilla, cuantas)`, que produce
`https://picsum.photos/seed/<semilla><i>/2400/3000` para `i` de 1 a `cuantas`. Escríbelas
desarrolladas en el JSON: el objetivo del bloque es que el contenido sea datos, no código.

Comprueba que el JSON es válido y que el validador lo acepta:

```bash
python -c "import json;d=json.load(open('contenido.json',encoding='utf-8'));print(len(d['proyectos']),'proyectos')"
```

Esperado: `12 proyectos`.

- [ ] **Paso 5: Comprueba que las pruebas pasan**

Pide el arnés al controlador. Esperado: todas en verde.

- [ ] **Paso 6: Commit**

```bash
git add contenido.json js/contenido.js tests/pruebas-contenido.js tests/test.html
git commit -m "Mover los proyectos a contenido.json y validarlos al cargarlos"
```

---

### Tarea 4: El cambio — la galería se compone sola

**Archivos:**
- Modificar: `js/datos.js`
- Modificar: `js/galeria.js`
- Modificar: `index.html`
- Modificar: `css/luque.css`
- Modificar: `tests/pruebas-datos.js`
- Borrar: `js/layout-filtrado.js`, `tests/pruebas-layout.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Consume: `Composicion.disponer/tamano` (Tarea 1), `Contenido.cargar/validar` (Tarea 3),
  `GaleriaPaneo.medir` (Tarea 2).
- Produce: `window.Datos.establecer(proyectos)` y `window.Datos.PROYECTOS` poblado en tiempo
  de ejecución.

**Ésta es la tarea que cambia el aspecto del lienzo.**

**Sobre `Datos.validarDatos`.** La Tarea 3 creó `Contenido.validar`, que cubre el mismo
terreno con el modelo nuevo (id, categoría, piezas/portada) y es el que de verdad se ejecuta
antes de que ningún proyecto llegue a `Datos`. Mantener los dos sería duplicar la misma
comprobación con dos redacciones distintas — la próxima vez que cambiara una regla de
validación, alguien tendría que acordarse de tocarla en dos sitios. `validarDatos` se retira
en esta tarea junto con la llamada que le quedaba en `galeria.js:184`, que además avisaría de
un problema falso en cada arranque: se ejecuta antes de que `Datos.establecer()` haya puesto
nada, así que `Datos.PROYECTOS` estaría vacío en ese instante.

- [ ] **Paso 1: `js/datos.js` deja de contener proyectos**

Quita el array `PROYECTOS` literal, la función `serie()` y la función `validarDatos` (y su
`return`). Deja `CATEGORIAS`, `porId` y `porCategoria`, y añade:

```js
  var PROYECTOS = [];

  /* Los proyectos ya no viven aquí: llegan de contenido.json. Este módulo pasa
     de contenerlos a custodiarlos, que es lo que permite que el panel de
     administración los cambie sin tocar código. */
  function establecer(proyectos) {
    PROYECTOS.length = 0;
    proyectos.forEach(function (p) { PROYECTOS.push(p); });
    /* La portada es un índice dentro de piezas, no una URL: se resuelve una
       sola vez aquí para que el resto del sitio siga leyendo p.portadaUrl. */
    PROYECTOS.forEach(function (p) {
      p.portadaUrl = (p.tipo === 'video') ? p.poster : p.piezas[p.portada].url;
    });
  }
```

Exporta `establecer` y mantén `PROYECTOS` en el objeto devuelto.

- [ ] **Paso 2: Quita de `js/galeria.js` la llamada a `validarDatos`**

En `init()`, borra estas dos líneas — la validación ya la hizo `Contenido.validar` antes de
que `Galeria.init()` llegara a ejecutarse:

```js
    var problemas = window.Datos.validarDatos(window.Datos.PROYECTOS, window.Datos.CATEGORIAS);
    if (problemas.length) console.warn('Problemas en los datos:\n' + problemas.join('\n'));
```

- [ ] **Paso 3: `js/galeria.js` usa `Composicion` en lugar de `pos`**

En `construir()`, sustituye las líneas que leen `p.pos`:

```js
  function construir() {
    var canvas = document.getElementById('spatialCanvas');
    if (!canvas) return;

    var ranuras = window.Composicion.disponer(window.Datos.PROYECTOS.length, 'amplio');
    var tam = window.Composicion.tamano(window.Datos.PROYECTOS.length, 'amplio');
    canvas.style.width  = tam.ancho + 'vw';
    canvas.style.height = tam.alto  + 'vw';

    window.Datos.PROYECTOS.forEach(function (p, i) {
      var r = ranuras[i];
      /* El ancho se fija una vez y no se vuelve a tocar: filtrar cambia el
         tamaño con transform:scale, porque animar width está prohibido. */
      anchoBase[p.id] = r.w;
      var boton = document.createElement('button');
      boton.className = 'proj';
      boton.type = 'button';
      boton.dataset.id = p.id;
      boton.dataset.cat = p.categoria;
      boton.style.width = r.w + 'vw';
      boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

      var interior = document.createElement('div');
      interior.className = 'proj-inner';

      var img = document.createElement('img');
      img.src = p.portadaUrl;
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
      colocar(boton, r.x, r.y, 1);
    });
  }
```

Declara `var anchoBase = {};` junto a `porElemento`.

En `aplicarFiltro()`, sustituye `window.LayoutFiltrado` por `window.Composicion` y la escala
por la relación entre el ancho compacto y el ancho base:

```js
    var dentro = window.Datos.porCategoria(nueva);
    var ranuras = window.Composicion.disponer(dentro.length, 'compacto');
    var tam = window.Composicion.tamano(dentro.length, 'compacto');

    conRecomposicion(function (canvas) {
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
          colocar(el, r.x, r.y, r.w / anchoBase[p.id]);
        }
      });

      canvas.style.width  = tam.ancho + 'vw';
      canvas.style.height = tam.alto  + 'vw';
    });
```

- [ ] **Paso 4: Reescribe `tests/pruebas-datos.js`**

Este archivo prueba dos cosas que ya no existen: `Datos.validarDatos` (retirada en el Paso 1)
y un bloque «Los datos reales» que asume que `Datos.PROYECTOS` ya tiene los doce proyectos en
el momento en que se carga el arnés. Eso dejó de ser cierto: `Datos.PROYECTOS` empieza vacío
y sólo se llena cuando algo llama a `Datos.establecer()`, que ahora ocurre de forma asíncrona
tras pedir `contenido.json`. Sustitúyelo entero por:

```js
describe('Datos.establecer', function () {
  function proyectoDeFotos(id) {
    return { id: id, titulo: id, categoria: 'editorial',
             tipo: 'fotos', portada: 1,
             piezas: [{ url: 'a.jpg' }, { url: 'b.jpg' }] };
  }
  function proyectoDeVideo(id) {
    return { id: id, titulo: id, categoria: 'videoclip',
             tipo: 'video', poster: 'p.jpg', vimeo: null };
  }

  prueba('puebla PROYECTOS con lo que se le pasa', function () {
    Datos.establecer([proyectoDeFotos('a'), proyectoDeFotos('b')]);
    igual(Datos.PROYECTOS.length, 2);
  });

  prueba('resuelve portadaUrl a partir del índice de portada', function () {
    Datos.establecer([proyectoDeFotos('a')]);
    igual(Datos.PROYECTOS[0].portadaUrl, 'b.jpg');
  });

  prueba('en un proyecto de vídeo, portadaUrl es el poster', function () {
    Datos.establecer([proyectoDeVideo('humo')]);
    igual(Datos.PROYECTOS[0].portadaUrl, 'p.jpg');
  });

  prueba('una llamada posterior reemplaza a la anterior, no se acumula', function () {
    Datos.establecer([proyectoDeFotos('a'), proyectoDeFotos('b')]);
    Datos.establecer([proyectoDeFotos('c')]);
    igual(Datos.PROYECTOS.length, 1);
    igual(Datos.PROYECTOS[0].id, 'c');
  });

  prueba('porId y porCategoria trabajan sobre lo último establecido', function () {
    Datos.establecer([proyectoDeFotos('unico')]);
    igual(Datos.porId('unico').id, 'unico');
    igual(Datos.porCategoria('editorial').length, 1);
    igual(Datos.porId('no-existe'), null);
  });
});
```

- [ ] **Paso 5: En `quitarFiltro()`, vuelve a las ranuras amplias en lugar de a `p.pos`**

```js
    var ranuras = window.Composicion.disponer(window.Datos.PROYECTOS.length, 'amplio');
    var tam = window.Composicion.tamano(window.Datos.PROYECTOS.length, 'amplio');

    conRecomposicion(function (canvas) {
      window.Datos.PROYECTOS.forEach(function (p, i) {
        var el = elementoDe(p.id);
        el.classList.remove('apagado');
        el.removeAttribute('tabindex');
        el.removeAttribute('aria-hidden');
        colocar(el, ranuras[i].x, ranuras[i].y, 1);
      });
      canvas.style.width  = tam.ancho + 'vw';
      canvas.style.height = tam.alto  + 'vw';
    });
```

- [ ] **Paso 6: Arranque asíncrono en `index.html`**

Quita `<script src="js/layout-filtrado.js"></script>` y añade `composicion.js` y
`contenido.js`. Sustituye el bloque de arranque por:

```html
  <script>
  /* El contenido llega por red, así que la galería no puede construirse hasta
     que esté. El preloader ya está en pantalla desde el marcado, así que la
     espera no se ve. Hero.init() va primero porque es quien lo gobierna. */
  window.Hero.init();
  window.Cursor.init();
  window.Contenido.cargar(function (proyectos, error) {
    window.Datos.establecer(proyectos);
    window.Galeria.init();
    window.Visor.init();
    window.Router.init();
    if (error) window.Galeria.mostrarError(error);
  });
  </script>
```

- [ ] **Paso 7: Quita el tamaño de lienzo de la consulta de móvil**

En `css/luque.css`, dentro de `@media (max-width: 720px)`, borra la línea
`.spatial-canvas{ width:320vw; height:230vw; }`. El tamaño lo fija ahora siempre el
JavaScript, así que esa regla ya no se aplicaría nunca y quedaría como código muerto que
engaña a quien lo lea.

- [ ] **Paso 8: Borra lo que ya no usa nadie**

```bash
git rm js/layout-filtrado.js tests/pruebas-layout.js
```

Quita sus dos `<script>` de `tests/test.html`. Comprueba que no queda ninguna referencia:

```bash
grep -rn "LayoutFiltrado\|layout-filtrado" . --include=*.js --include=*.html --include=*.md
```

Esperado: sólo apariciones en `docs/`, que son históricas y no se tocan.

- [ ] **Paso 9: Comprueba**

```bash
wc -l js/*.js
python tests/auditar_rutas.py
```

Esperado: ninguno por encima de 300, auditor en `OK`. Pide al controlador el arnés (deben
seguir pasando las pruebas de `Datos.establecer` del Paso 4 y las de `Composicion`/`Contenido`
de las tareas 1 y 3) y una comprobación en el navegador: que los doce proyectos aparecen, que
el lienzo se recorre, que filtrar recompone y que `Esc` vuelve a la vista completa.

- [ ] **Paso 10: Commit**

```bash
git add -A
git commit -m "Componer la galeria desde contenido.json en vez de coordenadas a mano"
```

---

### Tarea 5: El estado vacío honesto

**Archivos:**
- Modificar: `js/galeria.js`
- Modificar: `css/luque.css`
- Modificar: `docs/estado-conocido.md`

**Interfaces:**
- Consume: el `error` que entrega `Contenido.cargar`.
- Produce: `window.Galeria.mostrarError(mensaje)`.

Si `contenido.json` no carga, la web no puede quedarse con una galería a medias y sin
explicación. La especificación pide un estado vacío honesto.

- [ ] **Paso 1: Añade `mostrarError` a `js/galeria.js`**

```js
  /* Si el contenido no llega, la galería queda vacía. Callar sería peor: quien
     entre tiene que saber que el fallo es nuestro y no de su conexión, y el
     estudio tiene que poder verlo sin abrir la consola. */
  function mostrarError(mensaje) {
    var escenario = document.getElementById('spatialStage');
    if (!escenario) return;
    var aviso = document.createElement('p');
    aviso.className = 'galeria-vacia';
    aviso.setAttribute('role', 'status');
    aviso.textContent = mensaje;
    escenario.appendChild(aviso);
  }
```

Expórtala en el objeto devuelto.

- [ ] **Paso 2: Dale estilo en `css/luque.css`**

Junto a `.spatial-hint`, con el mismo tratamiento tipográfico:

```css
  .galeria-vacia{
    position:absolute;
    left:50%; top:50%;
    transform:translate(-50%, -50%);
    max-width:min(80vw, 560px);
    text-align:center;
    font-size:0.78rem;
    font-weight:700;
    letter-spacing:0.12em;
    text-transform:uppercase;
    line-height:1.8;
    z-index:6;
  }
```

- [ ] **Paso 3: Compruébalo de verdad**

Pide al controlador que provoque el fallo —renombrando `contenido.json` temporalmente o
interceptando la petición— y confirme que aparece el aviso, que el hero sigue funcionando y
que no hay excepciones en la consola. **Un estado de error que nadie ha visto fallar no está
comprobado.**

- [ ] **Paso 4: Anota el cambio en `docs/estado-conocido.md`**

Deja escrito que el contenido ya no está en `js/datos.js` sino en `contenido.json`, que la
composición del lienzo la genera `js/composicion.js` a partir del orden de la lista, y que
por tanto **reordenar la lista recompone la galería**. Menciona que las fotos siguen siendo
de picsum y que los proyectos de vídeo llevan `vimeo: null` hasta el bloque 4.

- [ ] **Paso 5: Commit**

```bash
git add -A
git commit -m "Decir que la galeria esta vacia en vez de fingir que no pasa nada"
```

---

## Después del plan

La especificación avisa de que **el aspecto del lienzo cambia** y de que eso sólo se juzga
mirándolo. Al terminar, antes de fusionar, hay que pedir al estudio que mire:

- Si la composición generada se sostiene o si pierde respecto a la de hoy.
- Si el paneo se siente igual de explorable con el lienzo generado.
- Cómo queda en móvil, ahora que el lienzo ya no mide 320vw allí.

Si la composición empeora lo que había, la salida acordada en la especificación **no** es
maquillar el patrón de ranuras, sino adelantar el compositor visual del bloque 3.
