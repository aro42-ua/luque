# La pantalla de un proyecto — plan del bloque 3c

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** la segunda pantalla del panel. La fotógrafa abre un proyecto de
la lista, corrige su ficha, **sube fotos** —que el navegador reduce a las tres
medidas de la web antes de mandarlas—, las ordena, elige cuál es la portada y
quita las que sobren. Con eso un proyecto creado en el bloque 3b deja de nacer
impublicable: tiene forma de recibir sus fotos.

**Arquitectura:** la misma aplicación estática de `/panel` (bloque 3b), que
gana un enrutador de fragmento propio —`#/`, `#/proyecto/<id>`, `#/publicar`—
para repartir tres pantallas sobre un solo estado en memoria (`trabajo`). Las
imágenes se reducen con un `<canvas>` en el navegador y se suben una a una por
`POST /api/imagen` (bloque 3a). La lógica que se puede probar sin red ni DOM
—medidas, nombres de archivo, las ediciones de un proyecto, las rutas— vive en
módulos puros; lo que toca la red o la pantalla, aparte.

**Tecnologías:** HTML, CSS y JavaScript servidos tal cual, sin compilar. ES5 y
`window.Nombre` en `panel/js/` (decisión 1 del bloque 3b). Arnés de siempre
(`tests/test.html`), incluidos sus dos niveles de DOM (`ArnesDom.conElemento` y
`ArnesDom.conDocumento`).

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`
—léela entera, con **Correcciones tras implementar los bloques 1 y 2**— y, para
las medidas de las imágenes, la sección «Cada foto se guarda en tres medidas»
de `docs/estado-conocido.md`, que **corrige** a la especificación: la medida es
el **lado largo** (1500 / 3000 / 250), no una caja de proporción fija.

**Lo que ya existe y este bloque consume:**

| Pieza | Qué hace |
|---|---|
| `POST /api/imagen?nombre=…` con el cuerpo binario | guarda bajo `img/<nombre>` y devuelve `{url: "/img/<nombre>"}`. **409** si ya existe (nunca pisa), **413** si pasa de 5 MB, **415** si no es jpg/png/webp/avif/gif, **400** sin nombre o nombre de más de 200 caracteres. Sólo ASCII `[a-zA-Z0-9._-]` sobrevive en el nombre. |
| `GET` / `PUT /api/borrador` | ya los usa `panel/js/borrador.js`; no cambian. |
| `window.Identificador.desde(titulo)` | el saneado del título; aquí se reutiliza para el nombre de archivo. |
| `window.Orden.mover(lista, desde, hasta)` | lista nueva con el elemento movido; aquí ordena las fotos. |
| `window.ReglasContenido.validar(datos, categorias)` | avisa en pantalla de lo que le falta a un proyecto para publicarse. |
| `window.Lista`, `panel/js/panel.js` | la lista y el arranque del bloque 3b, con sus 21 pruebas en `tests/pruebas-panel.js`. |

## Restricciones globales

- **Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.**
  Criterio de aceptación 11. `panel/js/panel.js` está en 209 y crece aquí: la
  Tarea 7 le saca una función antes de añadirle otras.
- **`panel/js/` en ES5 estricto y patrón `window.Nombre`**: nada de `let`,
  `const`, funciones flecha ni módulos. Métodos de tiempo de ejecución modernos
  (`createImageBitmap`, `canvas.toBlob`, `Promise`, `fetch`) sí valen, igual que
  `normalize` en el bloque 3b: son API, no sintaxis.
- **Todo lo que se hace arrastrando se puede hacer con teclado.** Criterio 6.
  Ordenar fotos, elegir portada, quitar y subir tienen botón o control propio;
  arrastrar es un atajo.
- **Ninguna imagen subida supera su cota y ninguna sale deformada.** Criterio 7,
  con la corrección de `estado-conocido.md`: lado largo 1500 (portada), 3000
  (pieza) y 250 (miniatura), proporción original siempre.
- **Una subida que falla no arrastra a las demás.** Criterio 10: cada archivo
  se sube por separado y el panel dice cuáles quedaron fuera.
- **Borrar no borra de R2.** Quitar una foto de un proyecto deja sus tres
  archivos en el bucket, como decide la especificación. Aquí no hay `DELETE`.
- El panel se parece a LUQUE! y se comporta como una herramienta: cursor del
  sistema, anillos de foco visibles, `prefers-reduced-motion` respetado.
- Comentarios, textos de interfaz y mensajes **en castellano**. Nada de
  credenciales en el repositorio.
- **Node lo pone nvm para Windows en `C:\nvm4w\nodejs`** (v24.21.0,
  comprobado el 2026-09-11). El PATH del sistema lo referencia como
  `%NVM_HOME%` y `%NVM_SYMLINK%`, y una terminal abierta antes de instalarlo
  no las resuelve: si `node` no aparece, antepón esa carpeta al PATH de la
  sesión. Este plan no toca `worker/` ni `panel/js/borrador.js`, así que sus
  pruebas de Node (`cd worker && node --test`, `node tests/prueba-borrador.js`)
  no cambian; todo lo nuevo se prueba en el arnés del navegador. Se corren
  igualmente al final (Tarea 9) como comprobación de que nada se movió.

---

## Cuatro decisiones, razonadas

### 1. Tres medidas por foto, siempre, y cada pieza recuerda su portada

La portada de un proyecto es «una de las piezas, elegida» (spec). Para poder
elegirla **después** de subir —y cambiar de opinión— hace falta la medida de
1500 de **cada** foto, no sólo de la que se elija al subir: el archivo original
se queda en el disco de la fotógrafa y el panel no lo vuelve a ver.

Así que cada foto sube en sus tres medidas y la pieza guarda las tres rutas:

```json
{ "url": "/img/bruma-img-0001-l2k9x-3000.jpg",
  "miniatura": "/img/bruma-img-0001-l2k9x-250.jpg",
  "portada": "/img/bruma-img-0001-l2k9x-1500.jpg" }
```

`piezas[].portada` es **nuevo** y aditivo: la galería lee `url` y `miniatura`,
`ReglasContenido.validar` no rechaza claves de más, y el Worker publica el
borrador tal cual. Marcar la portada del proyecto es copiar la `portada` de la
pieza elegida a `proyecto.portada`. Las 65 piezas que entraron con
`herramientas/derivar_imagenes.py` no traen esa clave, pero la herramienta
escribió las tres medidas de cada foto con los mismos sufijos `-1500`/`-3000`/
`-250`, así que para ellas se deduce del sufijo (`Edicion.portadaDe`). Es la
misma convención escrita en los dos sitios que la producen, y queda anotada en
`estado-conocido.md` en la Tarea 10.

El precio: unos 160 KB más de subida por foto. Aceptado.

### 2. Los nombres llevan un sello para no chocar con el 409

`POST /api/imagen` **rechaza** en vez de pisar. Sin más, subir dos veces
`IMG_0001.jpg` —o volver a subir una foto que se quitó, cuyos archivos siguen
en R2— daría un 409 y el panel tendría que inventar otro nombre. Se evita de
raíz: la raíz del nombre es `<id-proyecto>-<nombre-saneado>-<sello>`, con el
sello en base 36 del instante de la subida. Ver `Subida.nombres`.

### 3. Una sola página con tres pantallas, no tres páginas

`trabajo` vive en memoria con cambios sin guardar. Si la pantalla de un
proyecto fuera otra página, navegar perdería lo no guardado o exigiría guardar
en cada cambio de pantalla. Se queda una página con un enrutador de fragmento
mínimo (`panel/js/rutas.js`) y tres `<section>` que se muestran y esconden. La
tercera ruta, `#/publicar`, la rellena el bloque 3d; aquí queda declarada para
que la pantalla de la lista ya la enlace.

### 4. Tipo `video` con identificador de Vimeo: no se implementa

La especificación describía proyectos de `tipo: 'video'` con `vimeo` y póster.
El bloque del contenido real (2026-09-10) lo dejó atrás: los ocho proyectos son
`tipo: 'fotos'` y el vídeo es **un enlace en la ficha** (`ficha.enlace`) que
abre `js/plataforma.js` en otra pestaña. La pantalla de este bloque edita eso
—el enlace— y nada más. El bloque 4 (el vídeo por Vimeo) decidirá si el tipo
`video` vuelve; hasta entonces no se le da pantalla a algo que la web no usa.

---

## Estructura de archivos

| Archivo | De qué responde |
|---|---|
| `panel/js/rutas.js` | Leer el fragmento de la URL y escribirlo. **Puro.** |
| `panel/js/imagenes.js` | `medidas` (puro) y `derivar`: las tres medidas de un archivo con un `<canvas>`. |
| `panel/js/subida.js` | `nombres` (puro) y subir a `/api/imagen`, uno a uno, con sus finales. |
| `panel/js/edicion.js` | Las ediciones de un proyecto —ficha, añadir, quitar, mover, portada—. **Puro**, devuelve copias. |
| `panel/js/fotos.js` | Pintar la rejilla de fotos con sus botones y el arrastre. |
| `panel/js/proyecto.js` | La pantalla: formulario de la ficha, zona de subida, rejilla. |
| `panel/js/pantallas.js` | Mostrar una `<section>` y esconder las demás, llevando el foco. |
| `panel/js/lista.js` | Gana el enlace «Editar» y el retorno de foco que estaba en `panel.js`. |
| `panel/js/panel.js` | El arranque, el estado, la lista y ahora el enrutado. |
| `panel/index.html`, `panel/css/panel.css` | Marcado y estilos de las tres pantallas. |
| `tests/pruebas-rutas.js`, `-imagenes.js`, `-subida.js`, `-edicion.js`, `-fotos.js` | Nuevas, en el arnés. |
| `tests/pruebas-lista-pintar.js`, `tests/pruebas-panel.js`, `tests/test.html` | Se amplían. |
| `docs/estado-conocido.md`, `docs/despliegue.md` | Lo que este bloque deja sabido. |

---

### Tarea 1: Las rutas del panel

**Archivos:**
- Crear: `panel/js/rutas.js`, `tests/pruebas-rutas.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Rutas.leer(hash)` → `{pantalla: 'lista'}` |
  `{pantalla: 'proyecto', id}` | `{pantalla: 'publicar'}`, y
  `window.Rutas.a(pantalla, id)` → cadena con `#` delante.
- Consume: nada.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-rutas.js`:

```js
/* El enrutador del panel, que no es el de la web: js/router.js resuelve
   categorías y piezas, éste sólo reparte tres pantallas. Vive aparte a
   propósito —el panel no comparte código con la galería— y es puro para que
   se pueda probar sin tocar location. */
describe('Rutas.leer', function () {
  prueba('sin fragmento, o con la raíz, es la lista', function () {
    igual(Rutas.leer(''), { pantalla: 'lista' });
    igual(Rutas.leer('#'), { pantalla: 'lista' });
    igual(Rutas.leer('#/'), { pantalla: 'lista' });
    igual(Rutas.leer(undefined), { pantalla: 'lista' });
  });

  prueba('#/proyecto/<id> abre ese proyecto', function () {
    igual(Rutas.leer('#/proyecto/bruma'), { pantalla: 'proyecto', id: 'bruma' });
  });

  /* El id sale de Identificador.desde y es ASCII, pero la URL la puede
     escribir alguien a mano: si viene codificada, se descodifica. */
  prueba('descodifica el id por si llega escapado', function () {
    igual(Rutas.leer('#/proyecto/la%2Dboquerona'), { pantalla: 'proyecto', id: 'la-boquerona' });
  });

  prueba('#/publicar es la pantalla de publicar', function () {
    igual(Rutas.leer('#/publicar'), { pantalla: 'publicar' });
  });

  prueba('lo que no se entiende cae a la lista, no revienta', function () {
    igual(Rutas.leer('#/otra-cosa'), { pantalla: 'lista' });
    igual(Rutas.leer('#/proyecto/'), { pantalla: 'lista' });
    igual(Rutas.leer('#/proyecto/a/b'), { pantalla: 'lista' });
  });
});

describe('Rutas.a', function () {
  prueba('escribe las tres formas, y Rutas.leer las entiende de vuelta', function () {
    igual(Rutas.a('lista'), '#/');
    igual(Rutas.a('publicar'), '#/publicar');
    igual(Rutas.a('proyecto', 'bruma'), '#/proyecto/bruma');
    igual(Rutas.leer(Rutas.a('proyecto', 'bruma')), { pantalla: 'proyecto', id: 'bruma' });
  });

  prueba('una pantalla desconocida lleva a la lista', function () {
    igual(Rutas.a('inventada'), '#/');
  });
});
```

En `tests/test.html`, **antes** de `<script src="../panel/js/lista.js">`
(la Tarea 7 hace que `lista.js` lo use):

```html
<script src="../panel/js/rutas.js"></script>
```

y junto a `pruebas-orden.js`:

```html
<script src="pruebas-rutas.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Sirve la raíz del repositorio y abre el arnés:

```bash
python -m http.server 8000
```

`http://localhost:8000/tests/test.html`. Esperado: la sección «Rutas.leer»
en rojo con `Rutas is not defined`.

- [ ] **Paso 3: Escribe `panel/js/rutas.js`**

```js
window.Rutas = (function () {
  /* Tres pantallas sobre un solo estado en memoria. Es un fragmento y no una
     página por pantalla porque `trabajo` guarda cambios sin guardar: navegar
     entre páginas los perdería, o exigiría guardar en cada cambio de vista. */
  function leer(hash) {
    var camino = String(hash || '').replace(/^#\/?/, '');
    if (!camino) return { pantalla: 'lista' };
    if (camino === 'publicar') return { pantalla: 'publicar' };
    var m = /^proyecto\/([^\/]+)$/.exec(camino);
    if (m) {
      try {
        return { pantalla: 'proyecto', id: decodeURIComponent(m[1]) };
      } catch (e) {
        /* Un %-escape roto lanza URIError: se trata como ruta desconocida. */
      }
    }
    return { pantalla: 'lista' };
  }

  function a(pantalla, id) {
    if (pantalla === 'proyecto') return '#/proyecto/' + encodeURIComponent(id);
    if (pantalla === 'publicar') return '#/publicar';
    return '#/';
  }

  return { leer: leer, a: a };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Recarga el arnés: las siete nuevas en verde, el recuento total sube en siete y
ninguna anterior cambia.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/rutas.js tests/pruebas-rutas.js tests/test.html
git commit -m "Leer y escribir las rutas de las tres pantallas del panel"
```

---

### Tarea 2: Las medidas de una imagen, y reducirla en el navegador

**Archivos:**
- Crear: `panel/js/imagenes.js`, `tests/pruebas-imagenes.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce:
  - `window.Imagenes.LADOS` → `{portada: 1500, pieza: 3000, miniatura: 250}`.
  - `window.Imagenes.medidas(ancho, alto, lado)` → `{ancho, alto}` que cabe en
    `lado` de lado largo, sin ampliar nunca. **Puro.**
  - `window.Imagenes.esImagen(archivo)` → booleano por el `type` del `File`.
  - `window.Imagenes.derivar(archivo, alTerminar)` → `alTerminar({portada,
    pieza, miniatura}, null)` con tres `Blob` JPEG, o `alTerminar(null,
    'texto en castellano')`. Nunca lanza.
- Consume: nada.

**Por qué el lado largo y no la caja.** `estado-conocido.md` lo midió: el
material real es 2:3, 3:2 y 16:9 a la vez, y con una caja 4:5 las horizontales
salían un 20% peor sin motivo. `herramientas/derivar_imagenes.py` usa
`MEDIDAS = [(1500, 82), (3000, 82), (250, 80)]` por el lado largo; el panel
tiene que producir lo mismo, porque una foto subida desde aquí y una derivada
con la herramienta se ven en los mismos sitios.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-imagenes.js`:

```js
describe('Imagenes.medidas', function () {
  prueba('reduce por el lado largo conservando la proporción', function () {
    igual(Imagenes.medidas(6000, 4000, 3000), { ancho: 3000, alto: 2000 });
    igual(Imagenes.medidas(4000, 6000, 3000), { ancho: 2000, alto: 3000 });
    igual(Imagenes.medidas(3840, 2160, 1500), { ancho: 1500, alto: 844 });
  });

  /* Ampliar no mejora nada y pesa más: una foto más pequeña que la cota se
     queda como está. */
  prueba('no amplía lo que ya cabe', function () {
    igual(Imagenes.medidas(800, 600, 1500), { ancho: 800, alto: 600 });
    igual(Imagenes.medidas(250, 250, 250), { ancho: 250, alto: 250 });
  });

  prueba('nunca da cero: una tira muy alargada conserva al menos un píxel', function () {
    igual(Imagenes.medidas(10000, 2, 250), { ancho: 250, alto: 1 });
  });

  prueba('las tres cotas son las del sitio, por el lado largo', function () {
    igual(Imagenes.LADOS, { portada: 1500, pieza: 3000, miniatura: 250 });
  });
});

describe('Imagenes.esImagen', function () {
  prueba('mira el tipo del archivo', function () {
    cierto(Imagenes.esImagen({ type: 'image/jpeg' }));
    cierto(Imagenes.esImagen({ type: 'image/png' }));
    cierto(!Imagenes.esImagen({ type: 'text/plain' }));
    cierto(!Imagenes.esImagen({ type: '' }));
    cierto(!Imagenes.esImagen(null));
  });
});

/* Lo que sí toca el navegador: un lienzo de verdad, un File de verdad. Se
   fabrica una imagen con canvas, se deriva, y se vuelven a medir los blobs
   que salen. Es asíncrono, así que va en describeAsync. */
describeAsync('Imagenes.derivar', function () {
  function archivo(ancho, alto, nombre, tipo) {
    return new Promise(function (ok) {
      var c = document.createElement('canvas');
      c.width = ancho; c.height = alto;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#c00'; ctx.fillRect(0, 0, ancho, alto);
      c.toBlob(function (b) { ok(new File([b], nombre, { type: tipo })); }, tipo);
    });
  }
  function medir(blob) {
    return createImageBitmap(blob).then(function (m) {
      var r = { ancho: m.width, alto: m.height };
      m.close();
      return r;
    });
  }
  function derivar(f) {
    return new Promise(function (ok) {
      Imagenes.derivar(f, function (d, e) { ok({ derivadas: d, error: e }); });
    });
  }

  return archivo(1800, 1200, 'foto.png', 'image/png').then(derivar).then(function (r) {
    prueba('devuelve las tres medidas y ningún error', function () {
      igual(r.error, null);
      igual(Object.keys(r.derivadas).sort(), ['miniatura', 'pieza', 'portada']);
    });
    prueba('las tres salen como JPEG', function () {
      igual([r.derivadas.portada.type, r.derivadas.pieza.type, r.derivadas.miniatura.type],
            ['image/jpeg', 'image/jpeg', 'image/jpeg']);
    });
    return Promise.all([medir(r.derivadas.portada), medir(r.derivadas.pieza), medir(r.derivadas.miniatura)]);
  }).then(function (m) {
    prueba('la portada cabe en 1500 de lado largo, en proporción', function () {
      igual(m[0], { ancho: 1500, alto: 1000 });
    });
    prueba('la pieza no se amplía: 1800 cabe en 3000 y se queda', function () {
      igual(m[1], { ancho: 1800, alto: 1200 });
    });
    prueba('la miniatura cabe en 250, en proporción', function () {
      igual(m[2], { ancho: 250, alto: 167 });
    });
  }).then(function () {
    return derivar(new File(['hola'], 'nota.txt', { type: 'text/plain' }));
  }).then(function (r) {
    prueba('un archivo que no es imagen da error en castellano y ninguna derivada', function () {
      igual(r.derivadas, null);
      cierto(r.error.indexOf('nota.txt') !== -1 && r.error.indexOf('no es una imagen') !== -1, r.error);
    });
  });
});
```

En `tests/test.html`, junto a `rutas.js`:

```html
<script src="../panel/js/imagenes.js"></script>
```

y junto a `pruebas-rutas.js`:

```html
<script src="pruebas-imagenes.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Recarga el arnés. Esperado: `Imagenes is not defined`.

- [ ] **Paso 3: Escribe `panel/js/imagenes.js`**

```js
window.Imagenes = (function () {
  /* Las tres medidas de la web, por el LADO LARGO y no por una caja fija: el
     material real es 2:3, 3:2 y 16:9 a la vez, y con una caja 4:5 las
     horizontales salían un 20% peor (estado-conocido.md). Son las mismas que
     escribe herramientas/derivar_imagenes.py (MEDIDAS) y tienen que seguir
     siéndolo: una foto subida desde el panel y una derivada con la
     herramienta se ven en los mismos sitios. */
  var LADOS = { portada: 1500, pieza: 3000, miniatura: 250 };
  var CALIDAD = 0.82;   // la misma que la herramienta (82)

  /* Reduce hasta que el lado largo quepa en `lado`, conservando la proporción.
     Nunca amplía: inventar píxeles no mejora nada y pesa más. */
  function medidas(ancho, alto, lado) {
    var mayor = Math.max(ancho, alto);
    if (!(mayor > lado)) return { ancho: ancho, alto: alto };
    var factor = lado / mayor;
    return { ancho: Math.max(1, Math.round(ancho * factor)),
             alto: Math.max(1, Math.round(alto * factor)) };
  }

  function esImagen(archivo) {
    return !!archivo && typeof archivo.type === 'string' && archivo.type.indexOf('image/') === 0;
  }

  function nombreDe(archivo) { return archivo && archivo.name ? archivo.name : 'el archivo'; }

  /* Decodifica respetando la orientación EXIF: la cámara guarda el sensor en
     horizontal y anota «gírala», y sin `from-image` la mitad de las
     verticales saldrían tumbadas. Es lo que hace `abrir_derecha` en la
     herramienta. Devuelve algo que `drawImage` acepte. */
  function decodificar(archivo, alTerminar) {
    if (!esImagen(archivo)) {
      return alTerminar(null, '«' + nombreDe(archivo) + '» no es una imagen.');
    }
    var noSePudo = 'No se ha podido leer «' + nombreDe(archivo) + '».';
    if (typeof window.createImageBitmap === 'function') {
      window.createImageBitmap(archivo, { imageOrientation: 'from-image' })
        .then(function (mapa) { alTerminar(mapa, null); },
              function () { alTerminar(null, noSePudo); });
      return;
    }
    var url = URL.createObjectURL(archivo);
    var img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); alTerminar(img, null); };
    img.onerror = function () { URL.revokeObjectURL(url); alTerminar(null, noSePudo); };
    img.src = url;
  }

  function anchoDe(imagen) { return imagen.naturalWidth || imagen.width; }
  function altoDe(imagen) { return imagen.naturalHeight || imagen.height; }

  function reducir(imagen, lado, alTerminar) {
    var m = medidas(anchoDe(imagen), altoDe(imagen), lado);
    var lienzo = document.createElement('canvas');
    lienzo.width = m.ancho;
    lienzo.height = m.alto;
    var ctx = lienzo.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imagen, 0, 0, m.ancho, m.alto);
    lienzo.toBlob(function (blob) { alTerminar(blob); }, 'image/jpeg', CALIDAD);
  }

  /* Las tres medidas de un archivo, como blobs JPEG: {portada, pieza,
     miniatura}. `alTerminar(derivadas, error)`; nunca lanza. Se decodifica
     una vez y se reduce tres veces desde el original, no en cadena: reducir
     la miniatura desde la pieza ya reducida acumularía dos remuestreos. */
  function derivar(archivo, alTerminar) {
    decodificar(archivo, function (imagen, error) {
      if (error) return alTerminar(null, error);
      var claves = Object.keys(LADOS), salida = {}, i = 0;
      (function siguiente() {
        if (i === claves.length) {
          if (imagen.close) imagen.close();   // libera el ImageBitmap
          return alTerminar(salida, null);
        }
        var clave = claves[i++];
        reducir(imagen, LADOS[clave], function (blob) {
          if (!blob) return alTerminar(null, 'No se ha podido reducir «' + nombreDe(archivo) + '».');
          salida[clave] = blob;
          siguiente();
        });
      })();
    });
  }

  return { LADOS: LADOS, CALIDAD: CALIDAD, medidas: medidas, esImagen: esImagen, derivar: derivar };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Recarga el arnés: las once nuevas en verde (cuatro de `medidas`, una de
`esImagen`, seis de `derivar`). Si «la miniatura cabe en 250» da `{250, 167}`
contra otro alto, revisa `Math.round`: 1200 × 250 / 1800 = 166,67.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/imagenes.js tests/pruebas-imagenes.js tests/test.html
git commit -m "Reducir una foto en el navegador a las tres medidas de la web"
```

---

### Tarea 3: Subir las tres medidas, con sus finales

**Archivos:**
- Crear: `panel/js/subida.js`, `tests/pruebas-subida.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce:
  - `window.Subida.nombres(idProyecto, nombreArchivo, sello)` →
    `{portada, pieza, miniatura}` con los tres nombres de archivo. **Puro.**
  - `window.Subida.subirDerivadas(nombres, derivadas, alTerminar)` →
    `alTerminar({url, miniatura, portada}, null)` o `alTerminar(null, texto)`.
  - `window.Subida.subir(idProyecto, archivo, alTerminar)` → deriva y sube.
  - `window.Subida.subirVarios(idProyecto, archivos, alCadaUno, alTerminar)`
    → uno detrás de otro; `alCadaUno(archivo, pieza, error)` según termina
    cada uno y `alTerminar(fallos)` con `[{nombre, motivo}]`.
- Consume: `Identificador.desde`, `Imagenes.derivar`, `POST /api/imagen`.

**Los finales que hay que distinguir**, porque el Worker ya los distingue:

| Del servidor | Qué pasó | Qué debe leer quien sube |
|---|---|---|
| **200** `{url}` | guardada | nada: la pieza se añade al proyecto |
| **409 / 413 / 415 / 400** `{error}` | el Worker la rechazó y dice por qué, en castellano | su `error`, tal cual |
| cuerpo que no es JSON | la sesión de Access caducó y llegó la página de entrada | «la sesión ha caducado…» |
| red caída | ni siquiera llegó | «no se ha podido contactar con el servidor» |

Los mensajes del motor («Failed to fetch») no salen a la pantalla: van al
registro, como hace `borrador.js`.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-subida.js`:

```js
describe('Subida.nombres', function () {
  prueba('la raíz es id-nombre-sello y los sufijos son los de la herramienta', function () {
    igual(Subida.nombres('bruma', 'IMG_0001.JPG', 'l2k9x'), {
      portada: 'bruma-img-0001-l2k9x-1500.jpg',
      pieza: 'bruma-img-0001-l2k9x-3000.jpg',
      miniatura: 'bruma-img-0001-l2k9x-250.jpg'
    });
  });

  /* nombreSeguro en el Worker convertiría cualquier no-ASCII en un guion y
     dejaría «Monstruaci-n»; se sanea aquí con la misma regla que el id. */
  prueba('sanea el nombre como un identificador: sin acentos, espacios ni mayúsculas', function () {
    igual(Subida.nombres('bruma', 'Sesión final (2).jpeg', 's').pieza, 'bruma-sesion-final-2-s-3000.jpg');
  });

  prueba('un nombre sin nada aprovechable se llama foto', function () {
    igual(Subida.nombres('bruma', '¡¿!.jpg', 's').pieza, 'bruma-foto-s-3000.jpg');
  });

  /* El Worker corta a 200 caracteres el nombre entero. */
  prueba('recorta un nombre larguísimo y no deja un guion colgando', function () {
    var largo = new Array(50).join('abcde-') + 'z.jpg';   // más de 200 caracteres
    var n = Subida.nombres('bruma', largo, 's').pieza;
    cierto(n.length < 120, 'mide ' + n.length);
    cierto(n.indexOf('--') === -1 && n.indexOf('bruma-abcde') === 0, n);
  });

  prueba('todo sale como .jpg, sea cual sea la extensión de entrada', function () {
    igual(Subida.nombres('bruma', 'a.png', 's').miniatura, 'bruma-a-s-250.jpg');
    igual(Subida.nombres('bruma', 'sin-extension', 's').miniatura, 'bruma-sin-extension-s-250.jpg');
  });
});

/* Lo que habla con la red. `conDocumento` pone `fetch` en la ventana del
   iframe ANTES de cargar subida.js, así que el módulo real llama al doble sin
   saberlo: es la misma técnica que usa pruebas-panel.js con Borrador, y
   evita necesitar Node como tests/prueba-borrador.js. */
describeAsync('Subida.subirDerivadas', function () {
  var MODULOS = ['../panel/js/identificador.js', '../panel/js/imagenes.js', '../panel/js/subida.js'];
  var NOMBRES = { portada: 'p-1500.jpg', pieza: 'p-3000.jpg', miniatura: 'p-250.jpg' };
  function derivadas() {
    return { portada: new Blob(['P'], { type: 'image/jpeg' }),
             pieza: new Blob(['G'], { type: 'image/jpeg' }),
             miniatura: new Blob(['m'], { type: 'image/jpeg' }) };
  }
  function respuesta(estado, texto) {
    return Promise.resolve({ status: estado, text: function () { return Promise.resolve(texto); } });
  }
  /* `contestar(nombre)` decide qué devuelve el servidor a cada nombre. */
  function servidor(contestar) {
    var registro = [];
    var doble = function (url, opciones) {
      var nombre = decodeURIComponent(String(url).split('nombre=')[1]);
      registro.push({ nombre: nombre, metodo: opciones.method, tipo: opciones.headers['content-type'],
                      cuerpo: opciones.body });
      return contestar(nombre);
    };
    doble.registro = registro;
    return doble;
  }
  function subir(doble, fn) {
    return ArnesDom.conDocumento({ globales: { fetch: doble }, scripts: MODULOS }, function (w) {
      return new Promise(function (ok) {
        w.Subida.subirDerivadas(NOMBRES, derivadas(), function (pieza, error) {
          ok({ pieza: pieza, error: error });
        });
      }).then(function (r) { fn(r, w); });
    });
  }

  var bien = servidor(function (nombre) {
    return respuesta(200, JSON.stringify({ url: '/img/' + nombre }));
  });
  return subir(bien, function (r) {
    prueba('sube las tres medidas por POST, como image/jpeg, y devuelve la pieza', function () {
      igual(r.error, null);
      igual(r.pieza, { url: '/img/p-3000.jpg', miniatura: '/img/p-250.jpg', portada: '/img/p-1500.jpg' });
      igual(bien.registro.map(function (x) { return x.nombre; }), ['p-3000.jpg', 'p-250.jpg', 'p-1500.jpg']);
      igual(bien.registro.map(function (x) { return x.metodo + ' ' + x.tipo; }),
            ['POST image/jpeg', 'POST image/jpeg', 'POST image/jpeg']);
    });
    prueba('el cuerpo que manda es el blob, no otra cosa', function () {
      cierto(bien.registro[0].cuerpo instanceof Blob && bien.registro[0].cuerpo.size === 1);
    });
  }).then(function () {
    var rechaza = servidor(function (nombre) {
      return nombre === 'p-250.jpg'
        ? respuesta(409, JSON.stringify({ error: 'ya hay una imagen guardada como p-250.jpg: elige otro nombre' }))
        : respuesta(200, JSON.stringify({ url: '/img/' + nombre }));
    });
    return subir(rechaza, function (r) {
      prueba('si el Worker rechaza una medida, no hay pieza y se enseña SU mensaje', function () {
        igual(r.pieza, null);
        igual(r.error, 'ya hay una imagen guardada como p-250.jpg: elige otro nombre');
      });
      prueba('y no sigue subiendo las medidas que quedaban', function () {
        igual(rechaza.registro.length, 2);
      });
    });
  }).then(function () {
    var sesion = servidor(function () { return respuesta(200, '<!doctype html><title>Sign in</title>'); });
    return subir(sesion, function (r) {
      prueba('un cuerpo que no es JSON es la sesión caducada, y se dice', function () {
        igual(r.pieza, null);
        cierto(r.error.indexOf('sesión') !== -1, r.error);
        cierto(!/unexpected|token|json/i.test(r.error), 'nada del motor en pantalla: ' + r.error);
      });
    });
  }).then(function () {
    var caida = servidor(function () { return Promise.reject(new TypeError('Failed to fetch')); });
    return subir(caida, function (r) {
      prueba('la red caída da el aviso nuestro, no el TypeError', function () {
        igual(r.pieza, null);
        cierto(r.error.indexOf('no se ha podido contactar') !== -1, r.error);
        cierto(r.error.indexOf('Failed') === -1, r.error);
      });
    });
  });
});

describeAsync('Subida.subirVarios', function () {
  var MODULOS = ['../panel/js/identificador.js', '../panel/js/imagenes.js', '../panel/js/subida.js'];
  function imagen(nombre) {
    return new Promise(function (ok) {
      var c = document.createElement('canvas'); c.width = 20; c.height = 10;
      c.getContext('2d').fillRect(0, 0, 20, 10);
      c.toBlob(function (b) { ok(new File([b], nombre, { type: 'image/png' })); }, 'image/png');
    });
  }
  return Promise.all([imagen('a.png'), imagen('b.png')]).then(function (archivos) {
    var pedidos = [];
    var doble = function (url) {
      var nombre = decodeURIComponent(String(url).split('nombre=')[1]);
      pedidos.push(nombre);
      /* La segunda foto falla en su miniatura; la primera y el archivo de
         texto no llegan a tocar la red por motivos distintos. */
      var estado = nombre.indexOf('bruma-b-') === 0 && /-250\.jpg$/.test(nombre) ? 413 : 200;
      var cuerpo = estado === 200 ? { url: '/img/' + nombre } : { error: 'la imagen supera el tamaño máximo de 5 MB' };
      return Promise.resolve({ status: estado, text: function () { return Promise.resolve(JSON.stringify(cuerpo)); } });
    };
    var lote = archivos.concat([new File(['x'], 'nota.txt', { type: 'text/plain' })]);
    return ArnesDom.conDocumento({ globales: { fetch: doble }, scripts: MODULOS }, function (w) {
      var vistos = [];
      return new Promise(function (ok) {
        w.Subida.subirVarios('bruma', lote, function (archivo, pieza, error) {
          vistos.push({ nombre: archivo.name, hayPieza: !!pieza, error: error });
        }, ok);
      }).then(function (fallos) {
        prueba('avisa de cada archivo según termina, con su pieza o su motivo', function () {
          igual(vistos.map(function (v) { return v.nombre + ':' + v.hayPieza; }), ['a.png:true', 'b.png:false', 'nota.txt:false']);
          cierto(vistos[1].error.indexOf('5 MB') !== -1, vistos[1].error);
          cierto(vistos[2].error.indexOf('no es una imagen') !== -1, vistos[2].error);
        });
        prueba('y al final dice cuáles quedaron fuera, y sólo ésos', function () {
          igual(fallos.map(function (f) { return f.nombre; }), ['b.png', 'nota.txt']);
        });
        /* Criterio 10: la que falla no arrastra a las demás. */
        prueba('un fallo no impide que se intenten las siguientes', function () {
          cierto(pedidos.filter(function (n) { return n.indexOf('bruma-a-') === 0; }).length === 3, pedidos.join(' '));
        });
        prueba('la raíz del nombre lleva el id del proyecto y el archivo saneado', function () {
          cierto(/^bruma-a-[a-z0-9]+-3000\.jpg$/.test(pedidos[0]), pedidos[0]);
        });
      });
    });
  });
});
```

En `tests/test.html`, tras `imagenes.js`:

```html
<script src="../panel/js/subida.js"></script>
```

y tras `pruebas-imagenes.js`:

```html
<script src="pruebas-subida.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Recarga. Esperado: `Subida is not defined` en la primera sección y las dos
`describeAsync` caídas enteras.

- [ ] **Paso 3: Escribe `panel/js/subida.js`**

```js
window.Subida = (function () {
  var RUTA = '/api/imagen';

  /* Cuántos caracteres del nombre original sobreviven en la llave. El Worker
     corta a 200 el nombre entero (TOPE_NOMBRE); con el id del proyecto, el
     sello y el sufijo de medida alrededor, 60 deja margen de sobra. */
  var TOPE_BASE = 60;

  /* Las tres llaves de una foto comparten raíz, y la raíz lleva:
       - el id del proyecto, para poder leer el bucket por proyectos;
       - el nombre del archivo pasado por Identificador.desde —sin acentos,
         espacios ni mayúsculas—, porque nombreSeguro en el Worker convertiría
         cualquier no-ASCII en un guion;
       - un sello (quien llama pasa Date.now().toString(36)), porque el Worker
         responde 409 antes que pisar una imagen: sin sello, subir dos veces
         «IMG_0001.jpg», o volver a subir una que se quitó, chocaría.
     Los sufijos -1500/-3000/-250 son los mismos que escribe
     herramientas/derivar_imagenes.py: Edicion.portadaDe cuenta con ellos para
     las piezas antiguas. Todo sale .jpg porque el lienzo escribe JPEG. */
  function nombres(idProyecto, nombreArchivo, sello) {
    var sinExtension = String(nombreArchivo || '').replace(/\.[^.]+$/, '');
    var base = window.Identificador.desde(sinExtension).slice(0, TOPE_BASE).replace(/-+$/, '') || 'foto';
    var raiz = idProyecto + '-' + base + '-' + sello;
    return { portada: raiz + '-1500.jpg', pieza: raiz + '-3000.jpg', miniatura: raiz + '-250.jpg' };
  }

  /* Los mismos dos avisos que borrador.js, y por el mismo motivo: lo que
     llega del motor está en inglés y no dice nada a quien sube fotos. */
  var SIN_RED = 'no se ha podido contactar con el servidor';
  var SESION = 'la sesión ha caducado: vuelve a entrar en otra pestaña y repite la subida';

  /* Marca «este mensaje lo escribimos nosotros»: es lo único que se enseña.
     Cualquier otra excepción sale como SIN_RED y su detalle al registro. */
  function Legible(mensaje) { this.mensaje = mensaje; }

  function leer(r) {
    return r.text().then(function (texto) {
      try {
        return { estado: r.status, cuerpo: JSON.parse(texto) };
      } catch (e) {
        console.error('Subida: el servidor respondió ' + r.status + ' con algo que no es JSON: '
          + String(texto).slice(0, 200));
        throw new Legible(SESION);
      }
    });
  }

  /* Sube UN blob con su nombre. alTerminar(url, error). */
  function subirUna(nombre, blob, alTerminar) {
    fetch(RUTA + '?nombre=' + encodeURIComponent(nombre), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'image/jpeg' },
      body: blob
    })
      .then(leer)
      .then(function (res) {
        var cuerpo = res.cuerpo || {};
        if (res.estado === 200 && cuerpo.url) return cuerpo.url;
        /* El Worker ya explica en castellano el 409, el 413, el 415 y el
           400: se enseña tal cual, que es la única frase que dice qué pasó. */
        console.error('Subida: POST ' + nombre + ' respondió ' + res.estado + ': ' + cuerpo.error);
        throw new Legible(cuerpo.error || 'el servidor respondió ' + res.estado);
      })
      .then(
        function (url) { alTerminar(url, null); },
        /* Dos argumentos y no .catch(): que un fallo dentro de alTerminar no
           vuelva a llamarlo con un error de red inventado (borrador.js, C1). */
        function (e) {
          if (e instanceof Legible) return alTerminar(null, e.mensaje);
          console.error('Subida: la petición no llegó a completarse: ' + (e && e.message));
          alTerminar(null, SIN_RED);
        }
      );
  }

  /* Las tres medidas ya derivadas, en este orden: pieza, miniatura, portada.
     Si una falla, las ya subidas quedan huérfanas en R2, igual que las de un
     proyecto borrado: es recuperable y limpiar es una acción aparte (spec). */
  function subirDerivadas(nombres, derivadas, alTerminar) {
    var claves = ['pieza', 'miniatura', 'portada'], urls = {}, i = 0;
    (function siguiente() {
      if (i === claves.length) {
        return alTerminar({ url: urls.pieza, miniatura: urls.miniatura, portada: urls.portada }, null);
      }
      var clave = claves[i++];
      subirUna(nombres[clave], derivadas[clave], function (url, error) {
        if (error) return alTerminar(null, error);
        urls[clave] = url;
        siguiente();
      });
    })();
  }

  /* Un archivo entero: derivar y subir. alTerminar(pieza, error). */
  function subir(idProyecto, archivo, alTerminar) {
    window.Imagenes.derivar(archivo, function (derivadas, error) {
      if (error) return alTerminar(null, error);
      subirDerivadas(nombres(idProyecto, archivo.name, Date.now().toString(36)), derivadas, alTerminar);
    });
  }

  /* Varios archivos, UNO DETRÁS DE OTRO. alCadaUno(archivo, pieza, error)
     según termina cada uno —quien llama añade la pieza al proyecto en el
     acto, así que un fallo en el tercero no se lleva los dos primeros—, y al
     final alTerminar(fallos) con [{nombre, motivo}]. Criterio 10. */
  function subirVarios(idProyecto, archivos, alCadaUno, alTerminar) {
    var lista = [].slice.call(archivos), fallos = [], i = 0;
    (function siguiente() {
      if (i === lista.length) return alTerminar(fallos);
      var archivo = lista[i++];
      subir(idProyecto, archivo, function (pieza, error) {
        if (error) fallos.push({ nombre: archivo.name, motivo: error });
        alCadaUno(archivo, pieza, error);
        siguiente();
      });
    })();
  }

  return { RUTA: RUTA, nombres: nombres, subirDerivadas: subirDerivadas,
           subir: subir, subirVarios: subirVarios };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Recarga: cinco de `nombres`, seis de `subirDerivadas`, cuatro de
`subirVarios`, todas en verde. Y:

```bash
wc -l panel/js/subida.js
python tests/auditar_rutas.py
```

- [ ] **Paso 5: Commit**

```bash
git add panel/js/subida.js tests/pruebas-subida.js tests/test.html
git commit -m "Subir las tres medidas de cada foto, una a una y diciendo cual fallo"
```

---

### Tarea 4: Las ediciones de un proyecto, puras

**Archivos:**
- Crear: `panel/js/edicion.js`, `tests/pruebas-edicion.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce `window.Edicion` con, todas devolviendo un **proyecto nuevo**:
  - `aplicarFicha(p, campos)` con `campos = {titulo, categoria, cliente, anio,
    papel, enlace}` (cadenas del formulario).
  - `anadirPieza(p, pieza)`, `quitarPieza(p, indice)`, `moverPieza(p, desde,
    hasta)`, `marcarPortada(p, indice)`.
  - `portadaDe(pieza)` → ruta de la medida de 1500; `esPortada(p, pieza)`.
  - `reemplazar(proyectos, p)` → lista nueva con `p` en el sitio del que tenga
    su id.
  - `avisosDe(p)` → lo que le falta a ese proyecto para publicarse, sin el
    prefijo del id.
- Consume: `Orden.mover`, `ReglasContenido.validar`.

**Por qué copias y no mutación.** Lo mismo que `Orden.mover`: `panel.js`
compara el trabajo contra lo último guardado para saber si hay cambios
pendientes (Tarea 8), y eso deja de funcionar en cuanto alguien toca el objeto
guardado.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-edicion.js`:

```js
describe('Edicion', function () {
  function proyecto() {
    return { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
             ficha: { anio: 2025, papel: 'DoP' },
             portada: '/img/bruma-a-1500.jpg',
             piezas: [{ url: '/img/bruma-a-3000.jpg', miniatura: '/img/bruma-a-250.jpg', portada: '/img/bruma-a-1500.jpg' },
                      { url: '/img/bruma-b-3000.jpg', miniatura: '/img/bruma-b-250.jpg', portada: '/img/bruma-b-1500.jpg' }] };
  }
  var nueva = { url: '/img/bruma-c-3000.jpg', miniatura: '/img/bruma-c-250.jpg', portada: '/img/bruma-c-1500.jpg' };

  prueba('aplicarFicha cambia título, categoría y ficha, y no el id', function () {
    var n = Edicion.aplicarFicha(proyecto(), { titulo: '  Bruma marina ', categoria: 'videoclip',
      cliente: 'Vogue', anio: '2026', papel: 'Gaffer', enlace: 'https://youtu.be/x' });
    igual(n.id, 'bruma');
    igual(n.titulo, 'Bruma marina');
    igual(n.categoria, 'videoclip');
    igual(n.ficha, { cliente: 'Vogue', anio: 2026, papel: 'Gaffer', enlace: 'https://youtu.be/x' });
  });

  /* Las mismas reglas que el formulario de crear (panel.js): lo opcional en
     blanco no entra, el año es número. */
  prueba('lo que se deja en blanco no entra en la ficha, y el año va como número', function () {
    var n = Edicion.aplicarFicha(proyecto(), { titulo: 'B', categoria: 'editorial', cliente: '', anio: '2024', papel: 'DoP', enlace: '  ' });
    igual(n.ficha, { anio: 2024, papel: 'DoP' });
    igual(typeof n.ficha.anio, 'number');
  });

  prueba('un año en blanco o que no es número se queda fuera, para que validar lo diga', function () {
    igual(Edicion.aplicarFicha(proyecto(), { titulo: 'B', categoria: 'editorial', anio: '', papel: 'DoP' }).ficha, { papel: 'DoP' });
    igual(Edicion.aplicarFicha(proyecto(), { titulo: 'B', categoria: 'editorial', anio: 'ayer', papel: 'DoP' }).ficha, { papel: 'DoP' });
  });

  prueba('ninguna edición toca el proyecto que recibe', function () {
    var p = proyecto();
    Edicion.aplicarFicha(p, { titulo: 'Otro', categoria: 'videoclip', anio: '1', papel: 'x' });
    Edicion.anadirPieza(p, nueva);
    Edicion.quitarPieza(p, 0);
    Edicion.moverPieza(p, 0, 1);
    Edicion.marcarPortada(p, 1);
    igual(p, proyecto());
  });

  prueba('anadirPieza la pone al final', function () {
    var n = Edicion.anadirPieza(proyecto(), nueva);
    igual(n.piezas.length, 3);
    igual(n.piezas[2], nueva);
    igual(n.portada, '/img/bruma-a-1500.jpg', 'la portada no cambia si ya había');
  });

  prueba('la primera foto de un proyecto sin portada se hace portada sola', function () {
    var p = proyecto(); p.piezas = []; delete p.portada;
    igual(Edicion.anadirPieza(p, nueva).portada, '/img/bruma-c-1500.jpg');
  });

  prueba('quitarPieza quita esa y sólo esa', function () {
    var n = Edicion.quitarPieza(proyecto(), 0);
    igual(n.piezas.map(function (x) { return x.url; }), ['/img/bruma-b-3000.jpg']);
  });

  /* Sin esto, quitar la foto de portada dejaría el proyecto apuntando a una
     imagen que ya no es suya: se publicaría y la galería la enseñaría igual. */
  prueba('quitar la portada pasa la portada a la primera que quede', function () {
    igual(Edicion.quitarPieza(proyecto(), 0).portada, '/img/bruma-b-1500.jpg');
  });

  prueba('quitar la última foto deja el proyecto sin portada', function () {
    var n = Edicion.quitarPieza(Edicion.quitarPieza(proyecto(), 0), 0);
    igual(n.piezas, []);
    cierto(!('portada' in n), 'la clave tiene que desaparecer, no quedarse en null');
  });

  prueba('quitar un índice que no existe no cambia nada', function () {
    igual(Edicion.quitarPieza(proyecto(), 7), proyecto());
  });

  prueba('moverPieza usa Orden.mover', function () {
    igual(Edicion.moverPieza(proyecto(), 0, 1).piezas.map(function (x) { return x.url; }),
          ['/img/bruma-b-3000.jpg', '/img/bruma-a-3000.jpg']);
  });

  prueba('marcarPortada copia la portada de esa pieza al proyecto', function () {
    var n = Edicion.marcarPortada(proyecto(), 1);
    igual(n.portada, '/img/bruma-b-1500.jpg');
    cierto(Edicion.esPortada(n, n.piezas[1]));
    cierto(!Edicion.esPortada(n, n.piezas[0]));
  });

  /* Las 65 piezas que entraron con la herramienta no traen `portada`, pero
     la herramienta escribió -1500 para cada una con la misma raíz. */
  prueba('portadaDe deduce el -1500 de una pieza antigua por el sufijo', function () {
    igual(Edicion.portadaDe({ url: '/img/editorial-la-boquerona-img_5635-3000.jpg' }),
          '/img/editorial-la-boquerona-img_5635-1500.jpg');
    igual(Edicion.portadaDe({ url: '/img/x-3000.jpg', portada: '/img/otra.jpg' }), '/img/otra.jpg', 'si la trae, manda');
  });

  prueba('una url sin sufijo conocido hace de portada ella misma', function () {
    igual(Edicion.portadaDe({ url: '/img/foto.jpg' }), '/img/foto.jpg');
  });

  prueba('reemplazar cambia el proyecto con ese id y respeta el orden', function () {
    var lista = [{ id: 'a', titulo: 'A' }, { id: 'b', titulo: 'B' }];
    igual(Edicion.reemplazar(lista, { id: 'b', titulo: 'Be' }), [{ id: 'a', titulo: 'A' }, { id: 'b', titulo: 'Be' }]);
    igual(lista[1].titulo, 'B', 'la lista original no se toca');
  });

  prueba('avisosDe dice qué falta para publicar, sin el prefijo del id', function () {
    var p = proyecto(); p.piezas = []; delete p.portada; p.ficha = { papel: 'DoP' };
    igual(Edicion.avisosDe(p), ['la ficha no trae año', 'sin piezas', 'sin portada']);
    igual(Edicion.avisosDe(proyecto()), []);
  });
});
```

En `tests/test.html`, tras `subida.js` (necesita `orden.js` y
`reglas-contenido.js`, que ya van antes):

```html
<script src="../panel/js/edicion.js"></script>
```

y tras `pruebas-subida.js`:

```html
<script src="pruebas-edicion.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Edicion is not defined`.

- [ ] **Paso 3: Escribe `panel/js/edicion.js`**

```js
window.Edicion = (function () {
  /* Todo devuelve un proyecto NUEVO y no toca el que recibe, por lo mismo que
     Orden.mover: panel.js compara el trabajo contra lo último guardado para
     saber si hay cambios pendientes. Son datos llanos —lo que va al JSON—,
     así que copiar por JSON es exacto. */
  function copia(p) { return JSON.parse(JSON.stringify(p)); }

  /* La portada de una pieza es su medida de 1500 de lado largo. Las que sube
     el panel la traen escrita (Subida.subirDerivadas); las 65 que entraron
     con herramientas/derivar_imagenes.py no, pero la herramienta escribió las
     tres medidas de cada foto con los mismos sufijos, así que se deduce. Si
     la url no lleva sufijo conocido, la propia pieza hace de portada: más
     pesada, pero válida. */
  function portadaDe(pieza) {
    if (!pieza) return null;
    if (pieza.portada) return pieza.portada;
    return String(pieza.url || '').replace(/-3000(\.[a-z0-9]+)$/i, '-1500$1') || null;
  }

  function esPortada(p, pieza) {
    return !!p.portada && portadaDe(pieza) === p.portada;
  }

  /* Las mismas reglas que fichaDelFormulario en panel.js: lo opcional en
     blanco no entra —la forma de decir que un trabajo no tiene cliente o no
     tiene vídeo es que la clave no esté—, y el año va como número, que es
     como está en contenido.json. Un año en blanco o ilegible tampoco entra:
     así `avisosDe` dice «la ficha no trae año» en vez de guardar NaN. */
  function aplicarFicha(p, campos) {
    var n = copia(p);
    n.titulo = String(campos.titulo || '').trim();
    n.categoria = campos.categoria;
    var ficha = {};
    var cliente = String(campos.cliente || '').trim();
    if (cliente) ficha.cliente = cliente;
    var textoAnio = String(campos.anio === undefined || campos.anio === null ? '' : campos.anio).trim();
    if (textoAnio && !isNaN(Number(textoAnio))) ficha.anio = Number(textoAnio);
    var papel = String(campos.papel || '').trim();
    if (papel) ficha.papel = papel;
    var enlace = String(campos.enlace || '').trim();
    if (enlace) ficha.enlace = enlace;
    n.ficha = ficha;
    return n;
  }

  function anadirPieza(p, pieza) {
    var n = copia(p);
    n.piezas = (n.piezas || []).concat([copia(pieza)]);
    if (!n.portada) n.portada = portadaDe(pieza);
    return n;
  }

  /* Quitar la foto que era portada deja el proyecto apuntando a una imagen
     que ya no es suya, y eso se publicaría sin que validar lo notara: la
     portada pasa a la primera que quede, o desaparece si no queda ninguna. */
  function quitarPieza(p, indice) {
    var n = copia(p);
    var piezas = n.piezas || [];
    if (indice < 0 || indice >= piezas.length) return n;
    var quitada = piezas[indice];
    n.piezas = piezas.filter(function (_, i) { return i !== indice; });
    if (esPortada(n, quitada)) {
      if (n.piezas.length) n.portada = portadaDe(n.piezas[0]);
      else delete n.portada;
    }
    return n;
  }

  function moverPieza(p, desde, hasta) {
    var n = copia(p);
    n.piezas = window.Orden.mover(n.piezas || [], desde, hasta);
    return n;
  }

  function marcarPortada(p, indice) {
    var n = copia(p);
    var pieza = (n.piezas || [])[indice];
    if (pieza) n.portada = portadaDe(pieza);
    return n;
  }

  function reemplazar(proyectos, p) {
    return proyectos.map(function (x) { return x.id === p.id ? p : x; });
  }

  /* Lo que le falta a ESTE proyecto para publicarse, con las mismas reglas
     que aplicará el Worker. Sin el prefijo «id: », que en su pantalla sobra. */
  function avisosDe(p) {
    var prefijo = p.id + ': ';
    return window.ReglasContenido.validar({ proyectos: [p] }, window.ReglasContenido.CATEGORIAS)
      .map(function (t) { return t.indexOf(prefijo) === 0 ? t.slice(prefijo.length) : t; });
  }

  return { aplicarFicha: aplicarFicha, anadirPieza: anadirPieza, quitarPieza: quitarPieza,
           moverPieza: moverPieza, marcarPortada: marcarPortada, portadaDe: portadaDe,
           esPortada: esPortada, reemplazar: reemplazar, avisosDe: avisosDe };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Las dieciséis en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/edicion.js tests/pruebas-edicion.js tests/test.html
git commit -m "Las ediciones de un proyecto como funciones puras que devuelven copias"
```

---

### Tarea 5: La rejilla de fotos

**Archivos:**
- Crear: `panel/js/fotos.js`, `tests/pruebas-fotos.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce:
  - `window.Fotos.pintar(contenedor, proyecto, acciones)` con
    `acciones = {alMover(desde, hasta), alQuitar(indice), alMarcarPortada(indice)}`.
  - `window.Fotos.enfocar(contenedor, indice, accion)` → `true` si encontró
    un botón al que devolver el foco.
- Consume: `Edicion.esPortada`.

Cada foto lleva **cuatro botones** —adelantar, retrasar, portada, quitar— y
ésos son el camino principal. Arrastrar es el atajo, con una regla más simple
que la de la lista: **soltar sobre una foto la pone en su sitio** (la
arrastrada pasa a ocupar ese índice y las demás se corren). En una rejilla que
envuelve, «antes o después» por mitades no tiene una lectura clara.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-fotos.js`:

```js
describe('Fotos.pintar', function () {
  function proyecto() {
    return { id: 'bruma', portada: '/img/b-1500.jpg',
             piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' },
                      { url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg', portada: '/img/b-1500.jpg' },
                      { url: '/img/c-3000.jpg', miniatura: '/img/c-250.jpg', portada: '/img/c-1500.jpg' }] };
  }
  function nada() { return { alMover: function () {}, alQuitar: function () {}, alMarcarPortada: function () {} }; }
  function con(acciones, fn) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      Fotos.pintar(ol, proyecto(), acciones || nada());
      return fn(ol);
    });
  }

  prueba('pinta una tarjeta por pieza, con su miniatura y su índice', function () {
    con(null, function (ol) {
      var tarjetas = ol.querySelectorAll('li.foto');
      igual(tarjetas.length, 3);
      igual([].map.call(tarjetas, function (li) { return li.dataset.indice; }), ['0', '1', '2']);
      igual(tarjetas[0].querySelector('img').getAttribute('src'), '/img/a-250.jpg');
    });
  });

  prueba('la portada se distingue y su botón está pulsado', function () {
    con(null, function (ol) {
      var tarjetas = ol.querySelectorAll('li.foto');
      igual([].map.call(tarjetas, function (li) { return li.classList.contains('foto--portada'); }), [false, true, false]);
      igual([].map.call(tarjetas, function (li) { return li.querySelector('[data-accion="portada"]').getAttribute('aria-pressed'); }),
            ['false', 'true', 'false']);
    });
  });

  prueba('adelantar está deshabilitado en la primera y retrasar en la última', function () {
    con(null, function (ol) {
      var t = ol.querySelectorAll('li.foto');
      igual([t[0].querySelector('[data-accion="antes"]').disabled, t[2].querySelector('[data-accion="despues"]').disabled], [true, true]);
      igual([t[1].querySelector('[data-accion="antes"]').disabled, t[1].querySelector('[data-accion="despues"]').disabled], [false, false]);
    });
  });

  prueba('los botones se anuncian con el número de la foto', function () {
    con(null, function (ol) {
      var t = ol.querySelectorAll('li.foto')[1];
      igual(t.querySelector('[data-accion="quitar"]').getAttribute('aria-label'), 'Quitar la foto 2');
      igual(t.querySelector('img').getAttribute('alt'), 'Foto 2, portada');
    });
  });

  prueba('pulsar los botones pide la acción con el índice correcto', function () {
    var visto = [];
    var acciones = { alMover: function (d, h) { visto.push('mover ' + d + '>' + h); },
                     alQuitar: function (i) { visto.push('quitar ' + i); },
                     alMarcarPortada: function (i) { visto.push('portada ' + i); } };
    con(acciones, function (ol) {
      var t = ol.querySelectorAll('li.foto')[1];
      t.querySelector('[data-accion="antes"]').click();
      t.querySelector('[data-accion="despues"]').click();
      t.querySelector('[data-accion="quitar"]').click();
      ol.querySelectorAll('li.foto')[2].querySelector('[data-accion="portada"]').click();
    });
    igual(visto, ['mover 1>0', 'mover 1>2', 'quitar 1', 'portada 2']);
  });

  /* Un DataTransfer de mentira con lo justo, como en pruebas-lista-pintar. */
  function arrastrar(li, tipo) {
    var e = new Event(tipo, { bubbles: true, cancelable: true });
    e.dataTransfer = { effectAllowed: '', dropEffect: '', setData: function () {} };
    li.dispatchEvent(e);
  }

  prueba('soltar sobre otra foto pide moverla a ESE índice', function () {
    var visto = [];
    var acciones = nada(); acciones.alMover = function (d, h) { visto.push([d, h]); };
    con(acciones, function (ol) {
      var t = ol.querySelectorAll('li.foto');
      arrastrar(t[0], 'dragstart'); arrastrar(t[2], 'drop');
      arrastrar(t[2], 'dragstart'); arrastrar(t[0], 'drop');
    });
    igual(visto, [[0, 2], [2, 0]]);
  });

  prueba('soltar sobre sí misma no mueve nada', function () {
    var visto = [];
    var acciones = nada(); acciones.alMover = function (d, h) { visto.push([d, h]); };
    con(acciones, function (ol) {
      var t = ol.querySelectorAll('li.foto');
      arrastrar(t[1], 'dragstart'); arrastrar(t[1], 'drop');
    });
    igual(visto, []);
  });

  prueba('repintar reemplaza las tarjetas, no las acumula', function () {
    con(null, function (ol) {
      Fotos.pintar(ol, proyecto(), nada());
      igual(ol.querySelectorAll('li.foto').length, 3);
    });
  });
});

describe('Fotos.enfocar', function () {
  function proyecto() {
    return { id: 'x', portada: '/img/a-1500.jpg',
             piezas: [{ url: '/img/a-3000.jpg', portada: '/img/a-1500.jpg' }, { url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }] };
  }
  function nada() { return { alMover: function () {}, alQuitar: function () {}, alMarcarPortada: function () {} }; }
  function con(fn) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      Fotos.pintar(ol, proyecto(), nada());
      return fn(ol);
    });
  }

  prueba('devuelve el foco al botón pedido de esa tarjeta', function () {
    con(function (ol) {
      cierto(Fotos.enfocar(ol, 1, 'quitar'));
      igual(document.activeElement.dataset.accion, 'quitar');
      igual(document.activeElement.closest('li.foto').dataset.indice, '1');
    });
  });

  /* El mismo borde que en la lista: al llegar al extremo, el botón que se
     acaba de pulsar queda deshabilitado y no puede recibir el foco. */
  prueba('si ese botón quedó deshabilitado, va al otro de mover', function () {
    con(function (ol) {
      cierto(Fotos.enfocar(ol, 0, 'antes'));
      igual(document.activeElement.dataset.accion, 'despues');
    });
  });

  prueba('si la tarjeta ya no existe, va a la última que quede', function () {
    con(function (ol) {
      cierto(Fotos.enfocar(ol, 5, 'quitar'));
      igual(document.activeElement.closest('li.foto').dataset.indice, '1');
    });
  });

  prueba('con la rejilla vacía dice que no encontró dónde', function () {
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      cierto(!Fotos.enfocar(ol, 0, 'quitar'));
    });
  });
});
```

En `tests/test.html`, tras `edicion.js`:

```html
<!-- fotos.js no toca el DOM al cargarse: sólo define window.Fotos. `pintar`
     recibe su <ol> del arnés de DOM. Ver pruebas-fotos.js. -->
<script src="../panel/js/fotos.js"></script>
```

y tras `pruebas-edicion.js`:

```html
<script src="pruebas-fotos.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Fotos is not defined`.

- [ ] **Paso 3: Escribe `panel/js/fotos.js`**

```js
window.Fotos = (function () {
  /* Estado del arrastre en curso: sólo hay uno, y `pintar` lo reinicia porque
     los nodos viejos desaparecen con el innerHTML. */
  var origen = null;
  var marcada = null;

  function indice(li) {
    var n = parseInt(li.dataset.indice, 10);
    return isNaN(n) ? null : n;
  }

  function desmarcar() {
    if (marcada) { marcada.classList.remove('foto--destino'); marcada = null; }
  }

  function boton(texto, accion, etiqueta) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'foto-boton';
    b.textContent = texto;
    b.dataset.accion = accion;
    b.setAttribute('aria-label', etiqueta);
    return b;
  }

  /* Cada foto trae sus cuatro botones —adelantar, retrasar, portada, quitar—
     y ése es el camino principal: sin ratón se hace todo con ellos. El
     arrastrar de más abajo es un atajo. */
  function tarjeta(pieza, i, total, esPortada, acciones) {
    var li = document.createElement('li');
    li.className = 'foto' + (esPortada ? ' foto--portada' : '');
    li.dataset.indice = String(i);
    li.draggable = true;
    var cual = 'la foto ' + (i + 1);

    var img = document.createElement('img');
    img.src = pieza.miniatura || pieza.url;
    img.alt = 'Foto ' + (i + 1) + (esPortada ? ', portada' : '');
    img.draggable = false;   // que se arrastre la tarjeta entera, no la imagen suelta
    li.appendChild(img);

    var antes = boton('←', 'antes', 'Adelantar ' + cual);
    antes.disabled = i === 0;
    antes.addEventListener('click', function () { acciones.alMover(i, i - 1); });

    var despues = boton('→', 'despues', 'Retrasar ' + cual);
    despues.disabled = i === total - 1;
    despues.addEventListener('click', function () { acciones.alMover(i, i + 1); });

    var portada = boton('Portada', 'portada', (esPortada ? 'Es la portada: ' : 'Hacer portada ') + cual);
    portada.setAttribute('aria-pressed', esPortada ? 'true' : 'false');
    portada.addEventListener('click', function () { acciones.alMarcarPortada(i); });

    var quitar = boton('Quitar', 'quitar', 'Quitar ' + cual);
    quitar.addEventListener('click', function () { acciones.alQuitar(i); });

    [antes, despues, portada, quitar].forEach(function (b) { li.appendChild(b); });

    li.addEventListener('dragstart', function (e) {
      origen = indice(li);
      if (origen === null) { e.preventDefault(); return; }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(origen));
      li.classList.add('foto--arrastrando');
    });

    li.addEventListener('dragover', function (e) {
      if (origen === null) return;
      var destino = indice(li);
      if (destino === null || destino === origen) { desmarcar(); return; }
      e.preventDefault();               // obligatorio para que 'drop' llegue a disparar
      e.dataTransfer.dropEffect = 'move';
      if (marcada !== li) { desmarcar(); li.classList.add('foto--destino'); marcada = li; }
    });

    /* Soltar sobre una foto la pone EN SU SITIO: la arrastrada pasa a ocupar
       ese índice y las demás se corren. Es la semántica de Orden.mover
       (desde, hasta) sin mitades de fila, que en una rejilla que envuelve no
       tienen una lectura clara. */
    li.addEventListener('drop', function (e) {
      e.preventDefault();
      var desde = origen, hasta = indice(li);
      desmarcar();
      origen = null;
      if (desde === null || hasta === null || desde === hasta) return;
      acciones.alMover(desde, hasta);   // el mismo alMover que usan las flechas
    });

    li.addEventListener('dragend', function () {
      li.classList.remove('foto--arrastrando');
      desmarcar();
      origen = null;
    });

    return li;
  }

  function pintar(contenedor, proyecto, acciones) {
    contenedor.innerHTML = '';
    origen = null;
    marcada = null;
    var piezas = proyecto.piezas || [];
    piezas.forEach(function (pieza, i) {
      contenedor.appendChild(
        tarjeta(pieza, i, piezas.length, window.Edicion.esPortada(proyecto, pieza), acciones));
    });
  }

  /* Tras un repintado los nodos son nuevos y el foco caería a <body>. Se
     busca la tarjeta `i` —o la última, si se quitó la última— y en ella el
     botón `accion`; si quedó deshabilitado (mover en un extremo), el otro de
     mover; y si no, el de portada, que siempre está activo. */
  function enfocar(contenedor, i, accion) {
    var tarjetas = contenedor.querySelectorAll('li.foto');
    if (!tarjetas.length) return false;
    var li = tarjetas[Math.min(i, tarjetas.length - 1)];
    var candidatos = [accion, accion === 'antes' ? 'despues' : 'antes', 'portada'];
    for (var k = 0; k < candidatos.length; k++) {
      var b = li.querySelector('[data-accion="' + candidatos[k] + '"]');
      if (b && !b.disabled) { b.focus(); return true; }
    }
    return false;
  }

  return { pintar: pintar, enfocar: enfocar };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Las doce en verde (ocho de `pintar`, cuatro de `enfocar`).

- [ ] **Paso 5: Commit**

```bash
git add panel/js/fotos.js tests/pruebas-fotos.js tests/test.html
git commit -m "Pintar la rejilla de fotos con sus botones y el arrastre como atajo"
```

---

### Tarea 6: Las pantallas y el marcado

**Archivos:**
- Crear: `panel/js/pantallas.js`
- Modificar: `panel/index.html`, `panel/css/panel.css`

**Interfaces:**
- Produce: `window.Pantallas.init(nombres)`, `window.Pantallas.mostrar(nombre)`
  → la `<section>` mostrada, y `window.Pantallas.visible()` → el nombre.
- Consume: los `<section id="pantalla-…">` del marcado.

No tiene prueba propia: son cuatro líneas de DOM que `tests/pruebas-panel.js`
ejercita enteras en la Tarea 8 (navegar y comprobar qué sección queda
visible).

- [ ] **Paso 1: `panel/js/pantallas.js`**

```js
window.Pantallas = (function () {
  var secciones = {};

  function init(nombres) {
    nombres.forEach(function (n) { secciones[n] = document.getElementById('pantalla-' + n); });
  }

  function visible() {
    var nombres = Object.keys(secciones);
    for (var i = 0; i < nombres.length; i++) {
      if (!secciones[nombres[i]].hidden) return nombres[i];
    }
    return null;
  }

  /* Muestra una y esconde las demás. Al cambiar de pantalla el foco va al
     título de la nueva: si se quedara en el enlace que la abrió —que ahora
     está oculto— el siguiente Tab saldría de cualquier parte, y un lector de
     pantalla no se enteraría de que ha cambiado algo. Si ya era la visible
     no se toca el foco, para no robárselo a quien estaba escribiendo. */
  function mostrar(nombre) {
    var cambia = visible() !== nombre;
    Object.keys(secciones).forEach(function (n) { secciones[n].hidden = n !== nombre; });
    var titulo = secciones[nombre] && secciones[nombre].querySelector('h2');
    if (cambia && titulo) titulo.focus();
    return secciones[nombre] || null;
  }

  return { init: init, mostrar: mostrar, visible: visible };
})();
```

- [ ] **Paso 2: `panel/index.html`**

Sustituye el `<body>` entero por éste. Lo que cambia respecto al bloque 3b: la
cabecera con la navegación y «Guardar» pasa fuera de las pantallas, porque se
guarda desde cualquiera; el formulario de crear se queda igual dentro de la
pantalla de la lista; y aparecen las secciones del proyecto y de publicar (la
de publicar la rellena el bloque 3d; aquí sólo tiene el título).

```html
<body>

  <header class="cabecera">
    <h1>Panel — LUQUE!</h1>
    <nav aria-label="Pantallas del panel">
      <a href="#/">Proyectos</a>
      <a href="#/publicar">Publicar</a>
    </nav>
    <button id="guardar" type="button">Guardar</button>
  </header>

  <p id="aviso" role="status" aria-live="polite" class="aviso"></p>

  <main class="panel">

    <!-- Los h2 llevan tabindex="-1" para que Pantallas.mostrar pueda darles el
         foco al cambiar de pantalla, sin meterlos en el orden del Tab. -->
    <section id="pantalla-lista">
      <h2 tabindex="-1">Proyectos</h2>

      <ol id="lista" class="lista"></ol>

      <form id="nuevo" class="nuevo">
        <label for="titulo">Título del proyecto nuevo</label>
        <input id="titulo" name="titulo" type="text" autocomplete="off" required>

        <label for="categoria">Categoría</label>
        <select id="categoria" name="categoria"></select>

        <label for="fichaCliente">Cliente (opcional)</label>
        <input id="fichaCliente" name="cliente" type="text" autocomplete="off">

        <!-- Año y papel llevan `required` porque ReglasContenido.validar los
             exige. Desde el bloque 3c hay pantalla para corregirlos después,
             pero un proyecto nuevo sigue pidiéndolos: es más fácil escribirlos
             ahora que acordarse luego. La comprobación de verdad está en crear(). -->
        <label for="fichaAnio">Año</label>
        <input id="fichaAnio" name="anio" type="number" required>

        <label for="fichaPapel">Papel</label>
        <input id="fichaPapel" name="papel" type="text" autocomplete="off" required>

        <!-- type="url" y no text: el navegador avisa de una dirección mal
             escrita antes de que llegue a contenido.json. -->
        <label for="fichaEnlace">Enlace al vídeo (opcional)</label>
        <input id="fichaEnlace" name="enlace" type="url"
               placeholder="https://youtu.be/…">

        <button type="submit">Crear</button>
      </form>
    </section>

    <section id="pantalla-proyecto" hidden>
      <h2 tabindex="-1">Proyecto</h2>

      <!-- El id se enseña y no se edita: va en la URL pública (#/bruma) y
           cambiarlo rompería los enlaces que la fotógrafa ya haya mandado. -->
      <p class="identificador">Identificador: <code id="proyecto-id"></code>
        <span class="nota">(va en la dirección pública y no cambia)</span></p>

      <form id="ficha" class="nuevo">
        <label for="proyecto-titulo">Título</label>
        <input id="proyecto-titulo" name="titulo" type="text" autocomplete="off" required>

        <label for="proyecto-categoria">Categoría</label>
        <select id="proyecto-categoria" name="categoria"></select>

        <label for="proyecto-cliente">Cliente (opcional)</label>
        <input id="proyecto-cliente" name="cliente" type="text" autocomplete="off">

        <label for="proyecto-anio">Año</label>
        <input id="proyecto-anio" name="anio" type="number">

        <label for="proyecto-papel">Papel</label>
        <input id="proyecto-papel" name="papel" type="text" autocomplete="off">

        <label for="proyecto-enlace">Enlace al vídeo (opcional)</label>
        <input id="proyecto-enlace" name="enlace" type="url" placeholder="https://youtu.be/…">
      </form>

      <h3 id="proyecto-avisos-titulo" hidden>Para poder publicarlo falta</h3>
      <ul id="proyecto-avisos" class="avisos" hidden></ul>

      <h3>Fotos</h3>
      <!-- La etiqueta ES la zona de soltar, y apunta al selector de archivos:
           soltar y elegir son el mismo camino con dos entradas (spec,
           Accesibilidad: toda subida ofrece un selector además de soltar). -->
      <label id="zona" class="zona" for="subir">
        Suelta aquí las fotos, o pulsa para elegirlas. Se reducen en tu
        navegador antes de subirse, así que puedes soltar los originales.
      </label>
      <input id="subir" type="file" accept="image/*" multiple>

      <ol id="fotos" class="fotos" aria-label="Fotos del proyecto"></ol>
    </section>

    <section id="pantalla-publicar" hidden>
      <h2 tabindex="-1">Publicar</h2>
    </section>

  </main>

  <!-- Orden importante: cada módulo tiene que existir antes de quien lo usa,
       y panel.js, que arranca todo, va el último. reglas-contenido.js se carga
       desde la web pública (../js/) y no se copia aquí: es el mismo archivo que
       comparten la galería y el Worker, y duplicarlo reabriría el agujero que
       cerró el bloque 3a. -->
  <script src="../js/reglas-contenido.js"></script>
  <script src="js/identificador.js"></script>
  <script src="js/orden.js"></script>
  <script src="js/rutas.js"></script>
  <script src="js/imagenes.js"></script>
  <script src="js/subida.js"></script>
  <script src="js/edicion.js"></script>
  <script src="js/borrador.js"></script>
  <script src="js/lista.js"></script>
  <script src="js/fotos.js"></script>
  <script src="js/proyecto.js"></script>
  <script src="js/pantallas.js"></script>
  <script src="js/panel.js"></script>
</body>
```

`proyecto.js` no existe todavía —lo escribe la Tarea 8— así que hasta
entonces el panel dará un error de carga en consola. Es aceptable dentro de la
misma rama; no despliegues entre esta tarea y la 8.

- [ ] **Paso 3: `panel/css/panel.css`**

Añade al final, antes del bloque de `prefers-reduced-motion`:

```css
/* ============================================================
   CABECERA Y PANTALLAS (bloque 3c). Tres <section> que se muestran y
   esconden con el atributo `hidden`. El !important es a propósito:
   .lista y .fotos declaran display, y un `display:flex` gana al
   `display:none` de [hidden] del navegador.
============================================================ */
[hidden]{ display:none !important; }

.cabecera{
  max-width: 44rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
}
.cabecera h1{ margin: 0; flex: 1 1 auto; }
.cabecera nav{ display: flex; gap: 1rem; font-weight: 700; }
.cabecera #guardar{ margin-top: 0; }

/* El aviso vive ahora fuera de <main>, así que se alinea con él a mano. */
.aviso{
  max-width: 44rem;
  margin: 1rem auto 0;
  padding-left: calc(1.5rem + 0.75rem);
  margin-left: auto;
}

.panel{ padding-top: 1.5rem; }

h2{
  font-weight: 700;
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  margin-bottom: 1rem;
}
h2:focus{ outline: none; }   /* el foco programático de Pantallas no necesita anillo */
h3{ font-weight: 700; margin: 1.5rem 0 0.5rem; }

.identificador{ margin-bottom: 1rem; }
.identificador code{ font-family: ui-monospace, Consolas, monospace; font-weight: 700; }
.identificador .nota{ opacity: 0.7; }

.avisos{
  list-style: none;
  border-left: 4px solid var(--black);
  padding-left: 0.75rem;
  margin-bottom: 1rem;
}

/* ============================================================
   SUBIDA. La etiqueta es la zona de soltar; el <input type=file> queda
   visible debajo, como camino de teclado y para quien no arrastre.
============================================================ */
.zona{
  display: block;
  border: 3px dashed var(--black);
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.zona--encima{ background: var(--black); color: var(--yellow); }
#subir{ margin-bottom: 1.5rem; font-family: var(--ff); }
#subir:disabled{ opacity: 0.35; cursor: not-allowed; }

/* ============================================================
   REJILLA DE FOTOS
============================================================ */
.fotos{
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.foto{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  background: var(--black);
  color: var(--yellow);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: grab;
  transition: box-shadow 0.1s ease;
}
.foto:active{ cursor: grabbing; }
.foto img{
  grid-column: 1 / -1;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  display: block;
  background: var(--grey-dark);
}
.foto--portada{ box-shadow: 0 0 0 4px var(--black), 0 0 0 7px var(--yellow); }
.foto--arrastrando{ opacity: 0.4; }
.foto--destino{ box-shadow: 0 0 0 4px var(--yellow); }

.foto-boton{
  border: 2px solid var(--yellow);
  background: transparent;
  color: var(--yellow);
  font-family: var(--ff);
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0.4rem 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.foto-boton:hover:not(:disabled){ background: var(--yellow); color: var(--black); }
.foto-boton:disabled{ opacity: 0.35; cursor: not-allowed; }
.foto-boton[aria-pressed="true"]{ background: var(--yellow); color: var(--black); }
/* Fondo negro: el anillo pasa a amarillo, como en .fila. */
.foto :focus-visible{ outline-color: var(--yellow); }

/* El enlace de editar se viste como los botones de la fila. */
.fila-editar{ text-decoration: none; }
```

- [ ] **Paso 4: Comprueba y commitea**

```bash
python tests/auditar_rutas.py
git add panel/js/pantallas.js panel/index.html panel/css/panel.css
git commit -m "Marcado y estilos de las tres pantallas del panel"
```

---

### Tarea 7: La lista enlaza a cada proyecto y se queda el retorno de foco

**Archivos:**
- Modificar: `panel/js/lista.js`, `tests/pruebas-lista-pintar.js`

**Interfaces:**
- Produce: cada fila lleva `<a class="fila-boton fila-editar"
  href="#/proyecto/<id>" data-accion="editar">Editar</a>`; y
  `window.Lista.enfocar(contenedor, foco, alternativo)`, que es la
  `enfocarTrasRepintar` de `panel.js` mudada aquí para que `panel.js` tenga
  sitio (está en 209 líneas y la Tarea 8 le añade el enrutado).
- Consume: `Rutas.a`.

`Lista.pintar` **no cambia de firma**: el enlace no necesita callback, porque
la navegación la hace el propio `href` y `panel.js` escucha `hashchange`.

- [ ] **Paso 1: Las pruebas que fallan**

Añade a `tests/pruebas-lista-pintar.js`, dentro de `describe('Lista.pintar')`,
al final:

```js
  /* Un enlace y no un botón con callback: la navegación la hace el href y
     panel.js escucha hashchange. Así también funciona abrir en otra pestaña. */
  prueba('cada fila enlaza a la pantalla de su proyecto', function () {
    var hrefs = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return [].map.call(ol.querySelectorAll('li.fila a[data-accion="editar"]'), function (a) {
        return a.getAttribute('href') + ' | ' + a.getAttribute('aria-label');
      });
    });
    igual(hrefs, ['#/proyecto/niebla | Editar Niebla', '#/proyecto/arena | Editar Arena',
                  '#/proyecto/vidrio | Editar Vidrio']);
  });
```

Y una sección nueva al final del archivo:

```js
describe('Lista.enfocar', function () {
  function tres() {
    return [{ id: 'a', titulo: 'A', categoria: 'editorial' }, { id: 'b', titulo: 'B', categoria: 'editorial' },
            { id: 'c', titulo: 'C', categoria: 'editorial' }];
  }
  function con(fn) {
    return ArnesDom.conElemento('<div><ol></ol><input id="alt"></div>', function (div) {
      var ol = div.querySelector('ol');
      Lista.pintar(ol, tres(), function () {}, function () {});
      return fn(ol, div.querySelector('#alt'));
    });
  }

  prueba('devuelve el foco al botón pedido de la fila con ese id', function () {
    con(function (ol, alt) {
      Lista.enfocar(ol, { id: 'b', accion: 'borrar' }, alt);
      igual(document.activeElement.dataset.accion, 'borrar');
      igual(document.activeElement.closest('li.fila').dataset.id, 'b');
    });
  });

  prueba('si ese botón está deshabilitado, va al otro de mover', function () {
    con(function (ol, alt) {
      Lista.enfocar(ol, { id: 'a', accion: 'subir' }, alt);
      igual(document.activeElement.dataset.accion, 'bajar');
    });
  });

  prueba('con {titulo:true} va al elemento alternativo', function () {
    con(function (ol, alt) {
      Lista.enfocar(ol, { titulo: true }, alt);
      igual(document.activeElement, alt);
    });
  });

  prueba('sin foco que devolver, o con un id que no existe, no hace nada', function () {
    con(function (ol, alt) {
      alt.focus();
      Lista.enfocar(ol, null, alt);
      Lista.enfocar(ol, { id: 'zzz', accion: 'borrar' }, alt);
      igual(document.activeElement, alt);
    });
  });
});
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: la del enlace recibe `[]`; las de `enfocar`, `Lista.enfocar is not
a function`.

- [ ] **Paso 3: Modifica `panel/js/lista.js`**

Dentro de `fila()`, tras crear `borrar` y antes de los `addEventListener` de
arrastre, añade:

```js
    /* Un enlace y no un botón: la navegación la hace el href (Rutas.a) y
       panel.js escucha hashchange. Vale también para abrir en otra pestaña. */
    var editar = document.createElement('a');
    editar.className = 'fila-boton fila-editar';
    editar.href = window.Rutas.a('proyecto', p.id);
    editar.textContent = 'Editar';
    editar.setAttribute('aria-label', 'Editar ' + p.titulo);
    editar.dataset.accion = 'editar';
```

y en los `appendChild` del final de `fila()`, `editar` va **antes** que
`subir`:

```js
    li.appendChild(nombre);
    li.appendChild(editar);
    li.appendChild(subir);
    li.appendChild(bajar);
    li.appendChild(borrar);
```

Añade, antes de `function pintar`, la función mudada desde `panel.js`
(cámbiale sólo la firma: recibe el contenedor y el alternativo en vez de
leerlos del ámbito):

```js
  /* Tras un repintado los nodos del <ol> son todos nuevos —pintar hace
     innerHTML = '' y reconstruye—, así que el elemento que tenía el foco ya
     no existe y el navegador lo manda a <body>. Lo único que sobrevive al
     repintado es el `id` del proyecto, así que es lo que se usa para
     encontrar dónde debe volver el foco.

     `foco` es opcional:
       - { id, accion: 'subir'|'bajar'|'borrar' } para el botón de esa fila.
         Si ese botón ha quedado deshabilitado por llegar al extremo, se usa
         el otro botón de mover de la misma fila, que sigue siendo útil.
       - { titulo: true } para `alternativo` (el campo de título del
         formulario), cuando la lista se ha quedado vacía. */
  function enfocar(contenedor, foco, alternativo) {
    if (!foco) return;
    if (foco.titulo) { alternativo.focus(); return; }
    var fila = contenedor.querySelector('[data-id="' + foco.id + '"]');
    if (!fila) return;
    var boton = fila.querySelector('[data-accion="' + foco.accion + '"]');
    if (boton && !boton.disabled) { boton.focus(); return; }
    var otraAccion = foco.accion === 'subir' ? 'bajar' : 'subir';
    var alternativa = fila.querySelector('[data-accion="' + otraAccion + '"]');
    if (alternativa) alternativa.focus();
  }
```

y expórtala:

```js
  return { pintar: pintar, enfocar: enfocar, ETIQUETAS: ETIQUETAS,
           indiceValido: indiceValido, calcularHasta: calcularHasta,
           dentroDeLaCaja: dentroDeLaCaja };
```

**Todavía no toques `panel.js`**: hasta la Tarea 8 sigue con su copia y las
21 pruebas del panel siguen en verde con ella.

- [ ] **Paso 4: Comprueba que pasa**

Las cinco nuevas en verde, las once anteriores de `Lista.pintar` intactas, y:

```bash
wc -l panel/js/lista.js
```

Por debajo de 300 (queda en torno a 245).

- [ ] **Paso 5: Commit**

```bash
git add panel/js/lista.js tests/pruebas-lista-pintar.js
git commit -m "Cada fila de la lista enlaza a su proyecto, y el retorno de foco pasa a Lista"
```

---

### Tarea 8: La pantalla del proyecto y el enrutado en `panel.js`

**Archivos:**
- Crear: `panel/js/proyecto.js`
- Modificar: `panel/js/panel.js`, `tests/pruebas-panel.js`

**Interfaces:**
- Produce:
  - `window.Proyecto.init(contexto)` con `contexto = {porId(id), reemplazar(p),
    avisar(texto)}`, y `window.Proyecto.mostrar(proyecto)`.
  - `window.Panel = {ir(hash), hayCambios()}`: `ir` cambia de pantalla
    **síncronamente** (las pruebas lo usan; en la página real lo dispara
    también `hashchange`), `hayCambios` dice si el trabajo difiere de lo
    último cargado o guardado.
- Consume: todo lo anterior.

**Lo que cambia en `panel.js`**, y por qué:

1. **El enrutado.** `enrutar(hash)` lee la ruta con `Rutas.leer`, muestra la
   sección con `Pantallas.mostrar` y, si es un proyecto, se lo da a
   `Proyecto.mostrar`. Un id que no existe vuelve a la lista con aviso. Al
   cargar el borrador se enruta una vez, para que un enlace directo a
   `#/proyecto/bruma` funcione.
2. **`ir(hash)` enruta en el acto y además escribe `location.hash`.** El
   `hashchange` que eso provoca llega después y **no debe enrutar dos
   veces** —repintaría la pantalla del proyecto en mitad de una edición—, así
   que se recuerda qué hash se acaba de pedir y ese `hashchange` se ignora.
3. **Cambios pendientes.** `guardadoComo` guarda el JSON de `proyectos` tal
   como se cargó o se guardó; `hayCambios()` compara. Lo usa el bloque 3d
   para no publicar con cambios sin guardar, y aquí `beforeunload` para que
   el navegador pregunte antes de cerrar con trabajo perdido.
4. **`porId` y `reemplazar`** son lo que la pantalla del proyecto necesita
   del estado: leer un proyecto y sustituirlo por su copia editada.
5. **`enfocarTrasRepintar` se va** (Tarea 7): `repintar` llama a
   `Lista.enfocar(elLista, foco, elTitulo)`.

- [ ] **Paso 1: Las pruebas que fallan**

En `tests/pruebas-panel.js`:

**(a)** Sustituye `HTML` por el marcado de las tres pantallas (lo mismo que
`panel/index.html` pero sin etiquetas ni textos):

```js
  var HTML =
    '<header><h1>Panel</h1><nav><a href="#/">Proyectos</a><a href="#/publicar">Publicar</a></nav>' +
    '<button id="guardar" type="button">Guardar</button></header>' +
    '<p id="aviso" role="status" aria-live="polite"></p>' +
    '<main class="panel">' +
    '<section id="pantalla-lista"><h2 tabindex="-1">Proyectos</h2><ol id="lista"></ol>' +
    '<form id="nuevo">' +
    '<input id="titulo" type="text"><select id="categoria"></select>' +
    '<input id="fichaCliente" type="text"><input id="fichaAnio" type="number">' +
    '<input id="fichaPapel" type="text"><input id="fichaEnlace" type="url">' +
    '<button type="submit">Crear</button></form></section>' +
    '<section id="pantalla-proyecto" hidden><h2 tabindex="-1">Proyecto</h2>' +
    '<code id="proyecto-id"></code>' +
    '<form id="ficha"><input id="proyecto-titulo" type="text"><select id="proyecto-categoria"></select>' +
    '<input id="proyecto-cliente" type="text"><input id="proyecto-anio" type="number">' +
    '<input id="proyecto-papel" type="text"><input id="proyecto-enlace" type="url"></form>' +
    '<h3 id="proyecto-avisos-titulo" hidden></h3><ul id="proyecto-avisos" hidden></ul>' +
    '<label id="zona" for="subir"></label><input id="subir" type="file" multiple>' +
    '<ol id="fotos"></ol></section>' +
    '<section id="pantalla-publicar" hidden><h2 tabindex="-1">Publicar</h2></section>' +
    '</main>';
```

**(b)** Amplía `MODULOS` con los módulos nuevos, en el orden de
`panel/index.html`. `Subida` **no** va: se dobla, como `Borrador`, porque
habla con la red.

```js
  var MODULOS = ['../js/reglas-contenido.js', '../panel/js/identificador.js',
                 '../panel/js/orden.js', '../panel/js/rutas.js', '../panel/js/edicion.js',
                 '../panel/js/lista.js', '../panel/js/fotos.js', '../panel/js/proyecto.js',
                 '../panel/js/pantallas.js', '../panel/js/panel.js'];
```

**(c)** Un doble de `Subida` junto a `borradorFalso`. Contesta en el acto,
sin red ni lienzo; `piezas` es lo que «sube» cada archivo, por nombre, y los
que no estén ahí fallan:

```js
  /* El doble de Subida. `subirVarios` es lo único que usa proyecto.js. Cada
     archivo cuyo nombre esté en `piezas` sube con esa pieza; los demás fallan
     con `motivo`. Responde en el acto, como borradorFalso. */
  function subidaFalsa(piezas, motivo) {
    var doble = {
      pedidas: [],
      subirVarios: function (idProyecto, archivos, alCadaUno, alTerminar) {
        var fallos = [];
        [].slice.call(archivos).forEach(function (a) {
          doble.pedidas.push(idProyecto + '/' + a.name);
          if (piezas[a.name]) return alCadaUno(a, piezas[a.name], null);
          fallos.push({ nombre: a.name, motivo: motivo });
          alCadaUno(a, null, motivo);
        });
        alTerminar(fallos);
      }
    };
    return doble;
  }

  /* Un <input type=file> no deja escribir `files` a mano, pero sí asignarle
     el FileList de un DataTransfer. Los archivos son de mentira: el doble de
     Subida no los abre. */
  function elegirArchivos(w, d, nombres) {
    var dt = new w.DataTransfer();
    nombres.forEach(function (n) { dt.items.add(new w.File(['x'], n, { type: 'image/jpeg' })); });
    var input = d.getElementById('subir');
    input.files = dt.files;
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
  }

  function cambiarCampo(w, d, id, valor) {
    var campo = d.getElementById(id);
    campo.value = valor;
    campo.dispatchEvent(new w.Event('change', { bubbles: true }));
  }
```

**(d)** `conPanel` acepta el doble de subida como global:

```js
  function conPanel(doble, fn, confirmar, subida) {
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Borrador: doble, Subida: subida || subidaFalsa({}, 'sin red'),
                  confirm: confirmar || function () { return true; } },
      scripts: MODULOS
    }, fn);
  }
```

**(e)** Y al final de la cadena de `.then`, tras el bloque del conflicto,
añade estas secciones (cada `return conPanel(…)` encadenado con `.then` como
los anteriores):

```js
  }).then(function () {

    // ---- Navegar --------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      prueba('arranca en la lista', function () {
        igual([d.getElementById('pantalla-lista').hidden, d.getElementById('pantalla-proyecto').hidden], [false, true]);
      });

      w.Panel.ir('#/proyecto/niebla');
      prueba('ir a un proyecto enseña su pantalla y esconde la lista', function () {
        igual([d.getElementById('pantalla-lista').hidden, d.getElementById('pantalla-proyecto').hidden], [true, false]);
      });
      prueba('con su id, su título y su categoría puestos', function () {
        igual(d.getElementById('proyecto-id').textContent, 'niebla');
        igual(d.getElementById('proyecto-titulo').value, 'Niebla');
        igual(d.getElementById('proyecto-categoria').value, 'editorial');
      });
      /* Criterio 6: al cambiar de pantalla con el teclado, el foco no puede
         quedarse en un enlace que ya no se ve. */
      prueba('y el foco va al título de la pantalla', function () {
        igual(d.activeElement, d.querySelector('#pantalla-proyecto h2'));
      });

      w.Panel.ir('#/proyecto/no-existe');
      prueba('un id que no existe vuelve a la lista y lo dice', function () {
        igual(d.getElementById('pantalla-lista').hidden, false);
        cierto(d.getElementById('aviso').textContent.indexOf('no-existe') !== -1, d.getElementById('aviso').textContent);
      });
    });

  }).then(function () {

    // ---- Editar la ficha ---------------------------------------------

    var alEditar = borradorFalso({ datos: dosProyectos() });
    return conPanel(alEditar, function (w, d) {
      w.Panel.ir('#/proyecto/niebla');
      cambiarCampo(w, d, 'proyecto-titulo', 'Niebla espesa');
      cambiarCampo(w, d, 'proyecto-anio', '2026');
      cambiarCampo(w, d, 'proyecto-papel', 'DoP');
      d.getElementById('guardar').click();
      var guardado = alEditar.guardadas[0].proyectos[0];

      prueba('cambiar un campo cambia el proyecto, y el id se queda', function () {
        igual([guardado.id, guardado.titulo, guardado.ficha], ['niebla', 'Niebla espesa', { anio: 2026, papel: 'DoP' }]);
      });
      prueba('y la lista enseña el título nuevo', function () {
        igual(d.querySelector('#lista li.fila .fila-titulo').textContent, 'Niebla espesa · Editorial');
      });
      prueba('hayCambios vuelve a ser falso tras guardar', function () {
        igual(w.Panel.hayCambios(), false);
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      w.Panel.ir('#/proyecto/niebla');
      prueba('un proyecto sin fotos avisa de lo que le falta para publicarse', function () {
        var avisos = [].map.call(d.querySelectorAll('#proyecto-avisos li'), function (li) { return li.textContent; });
        cierto(avisos.indexOf('sin piezas') !== -1 && avisos.indexOf('sin portada') !== -1, avisos.join(' | '));
        igual(d.getElementById('proyecto-avisos').hidden, false);
      });

      cambiarCampo(w, d, 'proyecto-titulo', '   ');
      prueba('un título en blanco no se aplica, se repone y se avisa', function () {
        igual(d.getElementById('proyecto-titulo').value, 'Niebla');
        cierto(d.getElementById('aviso').textContent.indexOf('título') !== -1);
      });
    });

  }).then(function () {

    // ---- Subir fotos ----------------------------------------------------

    var alSubir = borradorFalso({ datos: dosProyectos() });
    var subida = subidaFalsa({
      'a.jpg': { url: '/img/niebla-a-1-3000.jpg', miniatura: '/img/niebla-a-1-250.jpg', portada: '/img/niebla-a-1-1500.jpg' },
      'b.jpg': { url: '/img/niebla-b-1-3000.jpg', miniatura: '/img/niebla-b-1-250.jpg', portada: '/img/niebla-b-1-1500.jpg' }
    }, 'la imagen supera el tamaño máximo de 5 MB');
    return conPanel(alSubir, function (w, d) {
      w.Panel.ir('#/proyecto/niebla');
      elegirArchivos(w, d, ['a.jpg', 'grande.jpg', 'b.jpg']);
      d.getElementById('guardar').click();
      var guardado = alSubir.guardadas[0].proyectos[0];

      prueba('cada foto que sube entra en el proyecto abierto, en orden', function () {
        igual(subida.pedidas, ['niebla/a.jpg', 'niebla/grande.jpg', 'niebla/b.jpg']);
        igual(guardado.piezas.map(function (p) { return p.url; }), ['/img/niebla-a-1-3000.jpg', '/img/niebla-b-1-3000.jpg']);
        igual(d.querySelectorAll('#fotos li.foto').length, 2);
      });
      prueba('la primera se hace portada sola', function () {
        igual(guardado.portada, '/img/niebla-a-1-1500.jpg');
        igual(d.querySelector('#fotos li.foto').classList.contains('foto--portada'), true);
      });
      /* Criterio 10: la que falla no arrastra a las demás, y se dice cuál. */
      prueba('el aviso final cuenta las subidas y nombra la que falló, con su motivo', function () {
        var t = d.getElementById('aviso').textContent;
        cierto(t.indexOf('2 fotos subidas') !== -1, t);
        cierto(t.indexOf('grande.jpg') !== -1 && t.indexOf('5 MB') !== -1, t);
      });
      prueba('y el selector queda libre para volver a intentarlo', function () {
        igual(d.getElementById('subir').disabled, false);
      });
    }, null, subida);

  }).then(function () {

    // ---- Ordenar, portada y quitar ------------------------------------

    var conFotos = dosProyectos();
    conFotos.proyectos[0].portada = '/img/a-1500.jpg';
    conFotos.proyectos[0].piezas = [
      { url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' },
      { url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg', portada: '/img/b-1500.jpg' },
      { url: '/img/c-3000.jpg', miniatura: '/img/c-250.jpg', portada: '/img/c-1500.jpg' }
    ];
    var alOrdenar = borradorFalso({ datos: conFotos });
    return conPanel(alOrdenar, function (w, d) {
      w.Panel.ir('#/proyecto/niebla');
      function urls() { return [].map.call(d.querySelectorAll('#fotos li.foto img'), function (i) { return i.getAttribute('src'); }); }

      d.querySelectorAll('#fotos li.foto')[2].querySelector('[data-accion="antes"]').click();
      prueba('adelantar una foto la mueve y el foco vuelve a su botón', function () {
        igual(urls(), ['/img/a-250.jpg', '/img/c-250.jpg', '/img/b-250.jpg']);
        igual(d.activeElement.dataset.accion, 'antes');
        igual(d.activeElement.closest('li.foto').dataset.indice, '1');
      });

      d.querySelectorAll('#fotos li.foto')[1].querySelector('[data-accion="portada"]').click();
      prueba('marcar portada cambia la del proyecto', function () {
        igual(d.querySelectorAll('#fotos li.foto')[1].querySelector('[data-accion="portada"]').getAttribute('aria-pressed'), 'true');
        d.getElementById('guardar').click();
        igual(alOrdenar.guardadas[0].proyectos[0].portada, '/img/c-1500.jpg');
      });

      d.querySelectorAll('#fotos li.foto')[1].querySelector('[data-accion="quitar"]').click();
      prueba('quitar la portada la pasa a la primera que queda', function () {
        igual(urls(), ['/img/a-250.jpg', '/img/b-250.jpg']);
        d.getElementById('guardar').click();
        igual(alOrdenar.guardadas[1].proyectos[0].portada, '/img/a-1500.jpg');
      });
      prueba('y el foco va a la tarjeta que ocupa ahora ese sitio', function () {
        igual(d.activeElement.closest('li.foto').dataset.indice, '1');
      });
      prueba('hayCambios es cierto después de editar sin guardar', function () {
        d.querySelectorAll('#fotos li.foto')[0].querySelector('[data-accion="despues"]').click();
        igual(w.Panel.hayCambios(), true);
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: (function () {
      var t = dosProyectos();
      t.proyectos[0].piezas = [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' }];
      t.proyectos[0].portada = '/img/a-1500.jpg';
      return t;
    })() }), function (w, d) {
      w.Panel.ir('#/proyecto/niebla');
      d.querySelector('#fotos li.foto [data-accion="quitar"]').click();
      prueba('quitar pide confirmación, y si se cancela no quita nada', function () {
        igual(d.querySelectorAll('#fotos li.foto').length, 1);
      });
    }, function () { return false; });
  });
```

Ojo con el cierre: la cadena original termina en `});` tras el bloque del
conflicto y luego `});` de `describeAsync`. Los bloques nuevos se insertan
entre esos dos cierres, y el último `});` de arriba cierra la cadena.

- [ ] **Paso 2: Comprueba que falla**

Recarga. Esperado: la sección «panel.js» cae entera —`proyecto.js` no existe
y `conDocumento` rechaza al no poder cargarlo—.

- [ ] **Paso 3: Escribe `panel/js/proyecto.js`**

```js
window.Proyecto = (function () {
  var ctx;                 // { porId, reemplazar, avisar }
  var el = {};
  var idAbierto = null;
  var subiendo = false;

  var CAMPOS = ['titulo', 'categoria', 'cliente', 'anio', 'papel', 'enlace'];

  /* Siempre se relee del estado por id, nunca se guarda una referencia: cada
     edición devuelve una copia (Edicion) y la anterior queda vieja. */
  function actual() { return idAbierto ? ctx.porId(idAbierto) : null; }

  function leerFormulario() {
    var campos = {};
    CAMPOS.forEach(function (c) { campos[c] = el[c].value; });
    return campos;
  }

  function rellenar(p) {
    el.id.textContent = p.id;
    el.titulo.value = p.titulo || '';
    el.categoria.value = p.categoria;
    var f = p.ficha || {};
    el.cliente.value = f.cliente || '';
    el.anio.value = f.anio === undefined ? '' : f.anio;
    el.papel.value = f.papel || '';
    el.enlace.value = f.enlace || '';
  }

  /* Lo que le falta a este proyecto para publicarse, en su propia lista y
     no en el aviso general: cambia con cada edición y no es una noticia,
     es un estado. Publicar (bloque 3d) volverá a decirlo todo junto. */
  function pintarAvisos(p) {
    var avisos = window.Edicion.avisosDe(p);
    el.avisos.innerHTML = '';
    avisos.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      el.avisos.appendChild(li);
    });
    el.avisos.hidden = avisos.length === 0;
    el.avisosTitulo.hidden = avisos.length === 0;
  }

  function repintar(foco) {
    var p = actual();
    if (!p) return;
    window.Fotos.pintar(el.fotos, p, acciones);
    pintarAvisos(p);
    /* Si no queda tarjeta a la que volver, al selector de archivos: es lo
       siguiente que se querrá hacer con una rejilla vacía. */
    if (foco && !window.Fotos.enfocar(el.fotos, foco.indice, foco.accion)) el.subir.focus();
  }

  function cambiar(nuevo, foco, mensaje) {
    ctx.reemplazar(nuevo);
    repintar(foco);
    ctx.avisar(mensaje + ' Recuerda guardar.');
  }

  var acciones = {
    alMover: function (desde, hasta) {
      cambiar(window.Edicion.moverPieza(actual(), desde, hasta),
              { indice: hasta, accion: hasta < desde ? 'antes' : 'despues' },
              'Orden de las fotos cambiado.');
    },
    alMarcarPortada: function (i) {
      cambiar(window.Edicion.marcarPortada(actual(), i), { indice: i, accion: 'portada' }, 'Portada cambiada.');
    },
    alQuitar: function (i) {
      /* Destructivo dentro del borrador, aunque la imagen siga en R2 (spec:
         borrar no borra del bucket; limpiar es una acción aparte). */
      if (!window.confirm('¿Quitar la foto ' + (i + 1) + ' de este proyecto? La imagen sigue guardada en el servidor.')) return;
      cambiar(window.Edicion.quitarPieza(actual(), i), { indice: i, accion: 'quitar' }, 'Foto quitada.');
    }
  };

  /* Se aplica en cada `change`, no con un botón: la ficha son seis campos y
     un «Aplicar» sería un paso más que olvidar antes de «Guardar». El título
     es lo único que no puede quedar vacío —es lo que enseña la lista—, así
     que en blanco se repone el anterior y se avisa. */
  function alCambiarFicha() {
    var p = actual();
    if (!p) return;
    var campos = leerFormulario();
    if (!String(campos.titulo).trim()) {
      el.titulo.value = p.titulo;
      return ctx.avisar('El título no puede quedar vacío.');
    }
    ctx.reemplazar(window.Edicion.aplicarFicha(p, campos));
    pintarAvisos(actual());
    ctx.avisar('Ficha cambiada. Recuerda guardar.');
  }

  function subirArchivos(archivos) {
    var p = actual();
    if (!p || subiendo || !archivos || !archivos.length) return;
    var id = p.id, total = archivos.length, hechas = 0;
    subiendo = true;
    el.subir.disabled = true;
    ctx.avisar('Subiendo 1 de ' + total + '…');

    window.Subida.subirVarios(id, archivos, function (archivo, pieza) {
      hechas++;
      if (pieza) {
        /* Al proyecto por su id y no al «actual»: si mientras subía se
           navegó a otro, la foto tiene que caer en el suyo. Y si ese
           proyecto se borró entretanto, la pieza queda huérfana en R2, que
           es recuperable. */
        var dueno = ctx.porId(id);
        if (dueno) ctx.reemplazar(window.Edicion.anadirPieza(dueno, pieza));
        if (idAbierto === id) repintar();
      }
      if (hechas < total) ctx.avisar('Subiendo ' + (hechas + 1) + ' de ' + total + '…');
    }, function (fallos) {
      subiendo = false;
      el.subir.disabled = false;
      el.subir.value = '';   // que volver a elegir el mismo archivo dispare `change`
      var bien = total - fallos.length;
      var texto = bien === 1 ? '1 foto subida.' : bien + ' fotos subidas.';
      if (fallos.length) {
        /* Criterio 10: se dice cuáles quedaron fuera y por qué. */
        texto += ' No se han podido subir: ' + fallos.map(function (f) {
          return f.nombre + ' (' + f.motivo + ')';
        }).join('; ') + '. Vuelve a intentarlo con ésas.';
      }
      if (bien) texto += ' Recuerda guardar.';
      ctx.avisar(texto);
    });
  }

  function init(contexto) {
    ctx = contexto;
    ['id'].concat(CAMPOS).forEach(function (c) { el[c] = document.getElementById('proyecto-' + c); });
    el.fotos = document.getElementById('fotos');
    el.subir = document.getElementById('subir');
    el.zona = document.getElementById('zona');
    el.avisos = document.getElementById('proyecto-avisos');
    el.avisosTitulo = document.getElementById('proyecto-avisos-titulo');

    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      el.categoria.appendChild(o);
    });

    /* Enter en un campo no debe recargar la página. */
    document.getElementById('ficha').addEventListener('submit', function (e) { e.preventDefault(); });
    CAMPOS.forEach(function (c) { el[c].addEventListener('change', alCambiarFicha); });

    el.subir.addEventListener('change', function () { subirArchivos(el.subir.files); });
    el.zona.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      el.zona.classList.add('zona--encima');
    });
    el.zona.addEventListener('dragleave', function () { el.zona.classList.remove('zona--encima'); });
    el.zona.addEventListener('drop', function (e) {
      e.preventDefault();
      el.zona.classList.remove('zona--encima');
      subirArchivos(e.dataTransfer.files);
    });
  }

  function mostrar(p) {
    idAbierto = p.id;
    rellenar(p);
    repintar();
  }

  return { init: init, mostrar: mostrar };
})();
```

- [ ] **Paso 4: Reescribe `panel/js/panel.js`**

Éste es el archivo entero como queda. Lo que no se nombra en la lista de
cambios de arriba está copiado tal cual de la versión del bloque 3b.

```js
(function () {
  var trabajo = null;      // { version, proyectos }
  /* JSON de trabajo.proyectos tal como se cargó o se guardó por última vez.
     Compararlo contra el actual dice si hay cambios pendientes: es lo que
     avisa antes de cerrar la pestaña y lo que impide publicar (bloque 3d). */
  var guardadoComo = null;
  var elLista, elAviso, elTitulo, elCategoria, elCrear, elGuardar;
  var elCliente, elAnio, elPapel, elEnlace;

  function avisar(texto) { elAviso.textContent = texto; }

  /* Activa o desactiva lo que necesita `trabajo`. Se llama deshabilitado
     desde el arranque, antes de que Borrador.cargar resuelva: el caso más
     probable en producción —la sesión de Access caducó de un día para otro—
     dejaría el formulario activo delante de un `trabajo` null. */
  function activarControles(activo) {
    elTitulo.disabled = !activo;
    elCategoria.disabled = !activo;
    elCliente.disabled = !activo;
    elAnio.disabled = !activo;
    elPapel.disabled = !activo;
    elEnlace.disabled = !activo;
    elCrear.disabled = !activo;
    elGuardar.disabled = !activo;
  }

  function porId(id) {
    for (var i = 0; trabajo && i < trabajo.proyectos.length; i++) {
      if (trabajo.proyectos[i].id === id) return trabajo.proyectos[i];
    }
    return null;
  }

  function reemplazar(p) {
    trabajo.proyectos = window.Edicion.reemplazar(trabajo.proyectos, p);
    window.Lista.pintar(elLista, trabajo.proyectos, alMover, alBorrar);
  }

  function hayCambios() {
    return !!trabajo && JSON.stringify(trabajo.proyectos) !== guardadoComo;
  }

  function fijarGuardado() { guardadoComo = JSON.stringify(trabajo.proyectos); }

  /* Tras borrar, el foco vuelve a la fila que ocupa ahora ese sitio, o a la
     anterior si se borró la última; si no queda ninguna, al título. */
  function focoTrasBorrar(indiceBorrado) {
    if (trabajo.proyectos.length === 0) return { titulo: true };
    var indice = Math.min(indiceBorrado, trabajo.proyectos.length - 1);
    return { id: trabajo.proyectos[indice].id, accion: 'borrar' };
  }

  function alMover(desde, hasta) {
    var id = trabajo.proyectos[desde].id;
    var accion = hasta < desde ? 'subir' : 'bajar';
    trabajo.proyectos = window.Orden.mover(trabajo.proyectos, desde, hasta);
    repintar({ id: id, accion: accion });
    avisar('Orden cambiado. Recuerda guardar.');
  }

  function alBorrar(id, titulo) {
    if (!window.confirm('¿Borrar «' + titulo + '»? No se puede deshacer sin recargar.')) return;
    var indice = -1, i;
    for (i = 0; i < trabajo.proyectos.length; i++) {
      if (trabajo.proyectos[i].id === id) { indice = i; break; }
    }
    trabajo.proyectos = trabajo.proyectos.filter(function (p) { return p.id !== id; });
    repintar(focoTrasBorrar(indice));
    avisar('Proyecto borrado. Recuerda guardar.');
  }

  function repintar(foco) {
    window.Lista.pintar(elLista, trabajo.proyectos, alMover, alBorrar);
    window.Lista.enfocar(elLista, foco, elTitulo);
  }

  /* La ficha que escribe el formulario. `cliente` y `enlace` sólo entran si
     el estudio los ha escrito: la forma de decir que un trabajo no tiene
     cliente o no tiene vídeo es que la clave no esté (ver reglas-contenido.js).
     El año va como número porque así está en contenido.json. */
  function fichaDelFormulario() {
    var ficha = {};
    var cliente = elCliente.value.trim();
    if (cliente) ficha.cliente = cliente;
    ficha.anio = Number(elAnio.value);
    ficha.papel = elPapel.value.trim();
    var enlace = elEnlace.value.trim();
    if (enlace) ficha.enlace = enlace;
    return ficha;
  }

  function crear(titulo, categoria, ficha) {
    if (!trabajo) return;
    var id = window.Identificador.desde(titulo);
    var ids = trabajo.proyectos.map(function (p) { return p.id; });
    var problema = window.Identificador.problema(id, ids, window.ReglasContenido.CATEGORIAS);
    if (problema) return avisar(problema);

    /* El `required` del formulario sólo frena por el camino del navegador.
       Desde el bloque 3c hay pantalla para corregir la ficha, pero pedirlo
       aquí sigue siendo más fácil que acordarse luego. */
    if (!ficha.anio || !ficha.papel) {
      return avisar('El año y el papel hacen falta para poder publicar.');
    }

    /* Nace sin piezas ni portada: se le ponen en su pantalla (#/proyecto/id).
       Hasta entonces no se puede publicar, y eso es correcto. */
    trabajo.proyectos.push({ id: id, titulo: titulo, categoria: categoria,
                             tipo: 'fotos', ficha: ficha, piezas: [] });
    repintar();
    avisar('Proyecto «' + titulo + '» creado. Ábrelo para subirle fotos, y recuerda guardar.');
  }

  function guardar() {
    if (!trabajo) return;
    window.Borrador.guardar(trabajo, function (resultado, error) {
      if (error) return avisar(error);
      if (resultado.conflicto) {
        /* Si «Guardar» siguiera activo, volver a pulsarlo repetiría el 409 en
           bucle. Y no se actualiza `trabajo.version` a la del servidor:
           un segundo intento «con éxito» pisaría en silencio el trabajo de
           la otra persona. Recargar trae los datos, no sólo el número. */
        elGuardar.disabled = true;
        return avisar('Alguien ha guardado mientras editabas (el servidor va por la versión '
          + resultado.guardada + '). Si guardaras ahora, sobrescribirías su trabajo: por eso '
          + '«Guardar» se ha desactivado. Recarga la página para ver lo último — recargar '
          + 'descarta los cambios que tú no hayas guardado todavía, así que cópialos antes si '
          + 'los necesitas.');
      }
      trabajo.version = resultado.version;
      fijarGuardado();
      avisar('Guardado.');
    });
  }

  /* Las tres pantallas comparten el estado de este archivo y se reparten la
     URL (Rutas): #/ la lista, #/proyecto/<id> un proyecto, #/publicar
     publicar. Se enruta al arrancar —para que un enlace directo funcione—,
     en cada hashchange, y desde ir(). */
  function enrutar(hash) {
    var r = window.Rutas.leer(hash === undefined ? location.hash : hash);
    if (r.pantalla === 'proyecto') {
      var p = porId(r.id);
      if (!p) {
        avisar(trabajo ? 'No hay ningún proyecto con el identificador «' + r.id + '».'
                       : 'Espera a que cargue el contenido.');
        return ir('#/');
      }
      window.Proyecto.mostrar(p);
    }
    window.Pantallas.mostrar(r.pantalla);
  }

  /* `ir` enruta en el acto y además escribe la URL. El hashchange que eso
     provoca llega después y NO debe enrutar otra vez —repintaría la pantalla
     del proyecto en mitad de una edición—, así que se recuerda qué hash se
     acaba de pedir y ese aviso se ignora. Escribir el hash puede lanzar en un
     documento sin URL propia (el iframe de las pruebas): se enruta igual. */
  var hashPedido = null;
  function ir(hash) {
    hashPedido = hash;
    try { location.hash = hash; } catch (e) { /* about:blank */ }
    enrutar(hash);
  }

  function init() {
    elLista = document.getElementById('lista');
    elAviso = document.getElementById('aviso');
    elTitulo = document.getElementById('titulo');
    elCategoria = document.getElementById('categoria');
    elCliente = document.getElementById('fichaCliente');
    elAnio = document.getElementById('fichaAnio');
    elPapel = document.getElementById('fichaPapel');
    elEnlace = document.getElementById('fichaEnlace');
    elCrear = document.querySelector('#nuevo button[type="submit"]');
    elGuardar = document.getElementById('guardar');

    activarControles(false);   // todavía no hay `trabajo`

    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      elCategoria.appendChild(o);
    });

    document.getElementById('nuevo').addEventListener('submit', function (e) {
      e.preventDefault();
      crear(elTitulo.value.trim(), elCategoria.value, fichaDelFormulario());
      /* El formulario entero, no sólo el título: si la ficha se quedara
         escrita, el siguiente proyecto nacería con el cliente del anterior
         sin que nadie lo pidiera, y eso no da error en ningún sitio. */
      elTitulo.value = '';
      elCliente.value = '';
      elAnio.value = '';
      elPapel.value = '';
      elEnlace.value = '';
    });

    elGuardar.addEventListener('click', guardar);

    window.Pantallas.init(['lista', 'proyecto', 'publicar']);
    window.Proyecto.init({ porId: porId, reemplazar: reemplazar, avisar: avisar });

    window.addEventListener('hashchange', function () {
      if (location.hash === hashPedido) { hashPedido = null; return; }   // ya enrutado por ir()
      hashPedido = null;
      enrutar();
    });

    /* Que el navegador pregunte antes de cerrar con trabajo sin guardar. El
       texto lo pone él; `returnValue` es lo que activa la pregunta. */
    window.addEventListener('beforeunload', function (e) {
      if (!hayCambios()) return;
      e.preventDefault();
      e.returnValue = '';
    });

    window.Borrador.cargar(function (datos, error) {
      if (error) return avisar(error);
      trabajo = datos;
      fijarGuardado();
      activarControles(true);
      repintar();
      enrutar();
    });
  }

  init();

  /* Para las pruebas y para quien quiera navegar desde consola. `ir` es
     síncrono a propósito: el hashchange no lo es, y en el iframe del arnés
     ni siquiera es seguro que llegue. */
  window.Panel = { ir: ir, hayCambios: hayCambios };
})();
```

- [ ] **Paso 5: Comprueba que pasa**

Recarga el arnés. **Las 21 pruebas anteriores de «panel.js» siguen en verde**
—incluidas las del foco tras mover y borrar, que ahora pasan por
`Lista.enfocar`— y las 20 nuevas también. Y:

```bash
wc -l panel/js/panel.js panel/js/proyecto.js
python tests/auditar_rutas.py
```

Los dos por debajo de 300. Si `panel.js` se pasa, lo primero que sobra son
comentarios repetidos de `guardar`; no le quites funciones.

- [ ] **Paso 6: Commit**

```bash
git add panel/js/proyecto.js panel/js/panel.js tests/pruebas-panel.js
git commit -m "La pantalla de un proyecto: ficha, subir fotos, ordenarlas, portada y quitar"
```

---

### Tarea 9: Comprobarlo con ojos, desplegado y sin ratón

Nada de esto lo ve el arnés: el arrastre real, la reducción de un original de
30 MB, el 409 del Worker, Access. **Lo hace el controlador**, con sesión de
Access iniciada, siguiendo el procedimiento del bloque 3b (Tarea 7):

```
git archive HEAD | tar -x -C <directorio-temporal>
wrangler deploy --config worker/estatico/wrangler.toml --assets <directorio-temporal>
```

**No hay que tocar Access ni el Worker de la API**: `/panel` ya está detrás
de la aplicación que cubre `/api`, y `POST /api/imagen` existe desde el
bloque 3a.

- [ ] **Paso 1: Lo que debe funcionar**

| Prueba | Esperado |
|---|---|
| Entrar en `lidialuque.com/panel` | la lista, con «Editar» en cada fila |
| Pulsar «Editar» en un proyecto de Lidia | su ficha rellena, sus fotos en la rejilla con la portada marcada, la URL en `#/proyecto/<id>` |
| Recargar con esa URL | abre directamente ese proyecto |
| Soltar **un original de cámara** (20–50 MB) en la zona | «Subiendo 1 de 1…», y en unos segundos la foto en la rejilla; en Red, tres `POST /api/imagen` de **menos de 1 MB cada uno** |
| Abrir la `url` de la pieza subida | se ve, con lado largo 3000; la miniatura, 250; la portada, 1500. Una foto vertical sale vertical |
| Soltar cinco a la vez, una de ellas un `.txt` | cuatro suben, el aviso nombra el `.txt` y su motivo, el selector queda activo |
| Soltar **la misma foto otra vez** | sube (nombre distinto por el sello), sin 409 |
| Cambiar el título y Guardar; recargar | el título nuevo en la lista y en la ficha; el id igual |
| Marcar otra portada, Guardar, ir a Publicar del 3d (o esperar al 3d) | — |
| Cerrar la pestaña con cambios sin guardar | el navegador pregunta |
| Cerrar la pestaña **sin** cambios | no pregunta |

- [ ] **Paso 2: Sin ratón** (criterio 6)

Con el teclado solo, desde la lista: Tab hasta «Editar» de un proyecto, Enter
—el foco tiene que aparecer en el título «Proyecto»—; Tab por la ficha;
Tab hasta el selector de archivos y Enter abre el diálogo del sistema; en la
rejilla, adelantar una foto con ← y comprobar que **el foco sigue en esa
misma foto**; marcar portada con Enter; quitar con Enter y confirmar; volver a
la lista con el enlace «Proyectos» de la cabecera.

- [ ] **Paso 3: Lo que NO debe pasar**

| Prueba | Esperado |
|---|---|
| `GET lidialuque.com/borrador.json` | 404, como siempre |
| Un tercer correo en `/panel` | no pasa de Access, como en el 3b |
| La web pública | **sin cambios**: nada se publica hasta el bloque 3d |

- [ ] **Paso 4: Las pruebas de Node, para confirmar que nada se movió**

```bash
cd worker && node --test
cd .. && node tests/prueba-borrador.js
```

Esperado: todo en verde, con los mismos recuentos que antes de este bloque
(este plan no toca ni el Worker ni `borrador.js`). Si `node` no aparece,
antepón `C:\nvm4w\nodejs` al PATH de la sesión.

Si algo de lo anterior falla, se arregla en esta rama antes de la Tarea 10.

---

### Tarea 10: Dejarlo escrito

**Archivos:**
- Modificar: `docs/estado-conocido.md`, `docs/despliegue.md`

- [ ] **Paso 1: `docs/estado-conocido.md`**

Añade una sección **«El panel (bloques 3b y 3c)»** antes de «Cómo se prueba»,
con estos puntos, escritos con el detalle de las secciones vecinas:

- Las tres pantallas y sus rutas (`#/`, `#/proyecto/<id>`, `#/publicar`), y
  que `#/publicar` está vacía hasta el bloque 3d.
- **Cada pieza que sube el panel lleva `portada`** (su medida de 1500), además
  de `url` y `miniatura`; las 65 de la herramienta no la llevan y
  `Edicion.portadaDe` deduce el `-1500` por el sufijo. Que la convención de
  sufijos `-1500/-3000/-250` está escrita en dos sitios —`Subida.nombres` y
  `MEDIDAS` de `derivar_imagenes.py`— y tienen que seguir coincidiendo.
- Los nombres en R2: `<id>-<archivo-saneado>-<sello>-<lado>.jpg`, y por qué
  el sello (el 409 del Worker).
- Que la reducción se hace con `createImageBitmap` + `canvas.toBlob` a
  calidad 0,82, **sin recorte de franjas negras**: eso lo hace sólo la
  herramienta, y una captura de vídeo con bandas subida desde el panel sale
  con ellas. Es deuda conocida.
- Que quitar una foto no borra nada de R2 (spec), y que sigue sin haber
  `DELETE /api/imagen`.
- Actualiza el recuento de comprobaciones del arnés en «Cómo se prueba» con
  el número que salga, y la fecha, y anota qué cubren las pruebas nuevas.

- [ ] **Paso 2: `docs/despliegue.md`**

En la sección del panel: que el despliegue del bloque 3c no toca Access ni
la API, y que la comprobación de la Tarea 9 es la que hay que repetir tras
cada despliegue del panel.

- [ ] **Paso 3: Commit**

```bash
git add docs/estado-conocido.md docs/despliegue.md
git commit -m "Documentar la pantalla de un proyecto y la convencion de las tres medidas"
```

---

## Quién consume lo que aquí se toca

| Lo que cambia | Quién lo lee |
|---|---|
| `piezas[].portada` (Tareas 3, 4, 8) | nadie en la web pública todavía —lee `url` y `miniatura`—; `Edicion.esPortada` y el bloque 3d al comparar |
| `proyecto.portada` | `js/datos.js` la convierte en `portadaUrl` para la galería: una portada mal apuntada se ve en la galería tras publicar |
| `Lista.pintar` (Tarea 7) | `panel.js` y `tests/pruebas-lista-pintar.js`; la firma no cambia |
| `tests/pruebas-panel.js` (Tarea 8) | carga `panel.js` entero: su `HTML` y `MODULOS` tienen que ir a la par de `panel/index.html` |
| `window.Panel.ir` (Tarea 8) | las pruebas; el bloque 3d lo usa para llegar a `#/publicar` |
| `Panel.hayCambios` (Tarea 8) | el bloque 3d, que no publica con cambios sin guardar |
| `panel/index.html` (Tarea 6) | `worker/estatico` lo sirve tal cual; `_headers` no lo cachea distinto de `/` |

## Lo que este bloque deja preparado y no usa

- La sección `#pantalla-publicar` y su ruta, vacías.
- `Panel.hayCambios()`, que aquí sólo alimenta `beforeunload`.
- `Subida.RUTA` y el patrón de `Legible` para los finales de red, que el 3d
  repite para `POST /api/publicar`.
