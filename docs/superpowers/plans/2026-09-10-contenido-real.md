# El contenido real — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendada) o
> superpowers:executing-plans para ejecutar este plan tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** sustituir los doce proyectos de relleno por los ocho reales de
Lidia Luque, servidos desde R2 en el mismo origen, con la ficha ajustada a lo
que la artista cuenta y un botón que lleva al vídeo donde esté publicado.

**Arquitectura:** nada aguas arriba de `contenido.json` se entera. La galería,
el visor, el router y el móvil ya leen de ahí. Cambian tres cosas en tres capas
que no se conocen entre sí: una herramienta local que deriva las tres medidas de
cada original, la subida manual a R2, y el esquema de la ficha en los cuatro
sitios que lo tocan. Se añade un módulo puro nuevo, `Plataforma`, porque el
nombre de la plataforma de vídeo se deduce de la URL en vez de guardarse.

**Pila:** HTML, CSS y JavaScript ES5 escritos a mano, patrón `window.Nombre` con
IIFE. Sin framework, sin paso de compilación, sin gestor de paquetes. La
herramienta de derivación es Python con Pillow y **no se sirve nunca**.

**Spec:** `docs/superpowers/specs/2026-09-10-contenido-real-design.md`

**Estado de partida:** `main` en `56804b2`, con los bloques 4a a 4f fusionados.
Suite: **422 comprobaciones, 0 fallos** en `tests/test.html`, más 52 en
`node tests/prueba-borrador.js`.

## Restricciones globales

Vinculan a todas las tareas. Los valores están copiados de la spec y del
repositorio, no reescritos de memoria.

- **Todo en español**, incluidos los comentarios, los nombres de función y los
  textos de prueba.
- **ES5 y `window.Nombre`** en `js/`: nada de `let`, `const`, funciones flecha,
  clases, plantillas de cadena ni `async/await`. El sitio se sirve tal cual.
- **El sitio no tiene ni una dependencia, y sigue sin tenerla.** Pillow se
  permite **sólo** en `herramientas/`, que nunca se despliega. Ver la sección
  «La herramienta de derivación entra al repositorio» de la spec.
- **Techo de 300 líneas por archivo de código.**
- **Ninguna línea nueva por encima de 90 caracteres.**
- **Nada de recursos externos referenciados desde el CSS.** Bajo `file://` el
  navegador los bloquea. Si hace falta una forma, va incrustada en el marcado y
  se colorea con `currentColor`.
- **Las citas van ancladas a funciones o secciones, nunca a números de línea.**
  Convención del repositorio: los números se desplazan y la cita queda mintiendo.
- **Nada de credenciales en el repositorio.** La subida usa `npx wrangler`, que
  reutiliza la sesión ya iniciada; `rclone` queda descartado porque exigiría
  fichas de API S3 nuevas.
- **Los originales de cámara NO se modifican, NO se mueven y NO se suben.** La
  herramienta sólo lee de su directorio.
- **No se despliega.** Desplegar y subir a R2 son actos manuales de Ángel, con
  permiso explícito en el momento. Ninguna tarea de este plan los ejecuta.
- **La ficha es `cliente` / `anio` / `papel` / `enlace`.** `camara` y `optica`
  desaparecen del esquema.
- **`enlace` es un control, no un dato**: si falta, no se pinta el botón. No se
  marca con `######`, que es lo que le pasa a los otros tres.

## El punto ciego que este plan tiene que esquivar

`tests/test.html` carga sus propias etiquetas `<script>`. Un módulo nuevo
añadido ahí y **olvidado en `index.html`** da una suite entera en verde y un
`TypeError` en producción. Está documentado en `docs/estado-conocido.md` y ya ha
mordido una vez.

La Tarea 3 añade `js/plataforma.js` a **los dos** archivos, y su prueba de
regresión comprueba que el módulo existe al cargar la página real, no sólo el
arnés.

## Estructura de archivos

| Archivo | Qué hace | Tarea |
|---|---|---|
| `js/plataforma.js` | **nuevo.** Deduce la plataforma de una URL y construye el botón | 1 |
| `tests/pruebas-plataforma.js` | **nuevo.** Sus pruebas | 1 |
| `js/reglas-contenido.js` | valida los campos de ficha nuevos | 2 |
| `js/visor-ficha.js` | las filas de `pintar()` y el botón, en escritorio | 3 |
| `index.html`, `tests/test.html` | la etiqueta `<script>` de `plataforma.js` | 3 |
| `css/luque.css` | el botón, reutilizando la pastilla amarilla | 3 |
| `js/movil-ficha.js` | lo mismo en el móvil | 4 |
| `panel/` | los campos del formulario de edición | 5 |
| `herramientas/derivar_imagenes.py` | **nuevo.** Deriva las tres medidas | 6 |
| `herramientas/proyectos.json` | **nuevo.** Los datos humanos de los ocho | 6 |
| `.gitignore` | `img/`, que es generado y pesa 43,7 MB | 6 |
| `contenido.json` | los ocho proyectos reales | 7 |
| `tests/pesar_imagenes.py` | mide contra las URLs reales | 7 |
| `docs/estado-conocido.md`, `docs/despliegue.md` | lo que queda dicho | 8 |

---

### Tarea 1: El módulo puro de la plataforma

`Plataforma` deduce el nombre de la plataforma de vídeo a partir del anfitrión
de la URL, y construye el botón. Se guarda **el enlace y nada más**: un campo
`plataforma` escrito a mano podría contradecir al `enlace` que tiene al lado, y
una frase que el dato de al lado desmiente es el fallo característico de este
proyecto.

El módulo mezcla dos funciones puras y una que toca el DOM, y eso es
deliberado: `rel="noopener noreferrer"` tiene que escribirse **en un solo
sitio**. Escrito en `visor-ficha.js` y otra vez en `movil-ficha.js` serían dos
copias que se separan, y la que se separe se lleva por delante una garantía de
seguridad.

**Files:**
- Create: `js/plataforma.js`
- Create: `tests/pruebas-plataforma.js`

**Interfaces:**
- Consumes: nada.
- Produces: `window.Plataforma` con
  - `nombreDe(url)` → `'YouTube'`, `'Vimeo'` o `null`
  - `etiquetaDe(url)` → `'Ver en YouTube'` o `'Ver el vídeo'`
  - `boton(url)` → un `HTMLAnchorElement`, o `null` si no hay `url`

- [ ] **Paso 1: Escribir las pruebas que fallan**

En `tests/pruebas-plataforma.js`:

```js
describe('Plataforma', function () {

  // ---- Deducir el nombre --------------------------------------------

  prueba('reconoce los dos anfitriones de YouTube', function () {
    igual(Plataforma.nombreDe('https://youtu.be/IcFvvXAZMqs'), 'YouTube');
    igual(Plataforma.nombreDe('https://www.youtube.com/watch?v=abc'), 'YouTube');
  });

  prueba('reconoce Vimeo', function () {
    igual(Plataforma.nombreDe('https://vimeo.com/123456'), 'Vimeo');
  });

  /* Un anfitrión desconocido no es un error: es una plataforma que todavía no
     está en la lista. El botón tiene que seguir llevando a alguna parte. */
  prueba('un anfitrion desconocido no tiene nombre, pero no revienta', function () {
    igual(Plataforma.nombreDe('https://filmin.es/algo'), null);
  });

  prueba('lo que no es una URL no tiene nombre', function () {
    igual(Plataforma.nombreDe(''), null);
    igual(Plataforma.nombreDe(null), null);
    igual(Plataforma.nombreDe('vete a saber'), null);
  });

  /* El anfitrion se compara ENTERO, no por trozos: sin esto,
     "youtube.com.malo.example" pasaria por YouTube. */
  prueba('un anfitrion que solo CONTIENE el nombre no cuenta', function () {
    igual(Plataforma.nombreDe('https://youtube.com.malo.example/x'), null);
  });

  // ---- La etiqueta ---------------------------------------------------

  prueba('la etiqueta nombra la plataforma cuando se conoce', function () {
    igual(Plataforma.etiquetaDe('https://youtu.be/x'), 'Ver en YouTube');
  });

  prueba('y cae en algo generico cuando no', function () {
    igual(Plataforma.etiquetaDe('https://filmin.es/x'), 'Ver el vídeo');
  });

  // ---- El botón ------------------------------------------------------

  prueba('sin enlace no hay boton, y no hay hueco', function () {
    igual(Plataforma.boton(''), null);
    igual(Plataforma.boton(null), null);
  });

  prueba('el boton es un enlace, no un boton', function () {
    igual(Plataforma.boton('https://youtu.be/x').tagName, 'A');
  });

  prueba('el boton lleva a donde dice el enlace y se ve lo que dice', function () {
    var a = Plataforma.boton('https://youtu.be/x');
    igual(a.getAttribute('href'), 'https://youtu.be/x');
    igual(a.textContent, 'Ver en YouTube');
  });

  /* Esto es una comprobacion de SEGURIDAD, no de estilo. Sin `noopener`, la
     pagina de destino recibe una referencia a la nuestra por window.opener y
     puede redirigirla. Se prueba en vez de confiarlo a la revision. */
  prueba('el boton abre fuera y corta la referencia a esta pagina', function () {
    var a = Plataforma.boton('https://youtu.be/x');
    igual(a.getAttribute('target'), '_blank');
    igual(a.getAttribute('rel'), 'noopener noreferrer');
  });

  prueba('el boton lleva la clase de la pastilla amarilla', function () {
    igual(Plataforma.boton('https://youtu.be/x').className, 'pastilla-enlace');
  });
});
```

- [ ] **Paso 2: Ejecutar la suite y comprobar que falla**

Levantar el servidor y ejecutar:

```bash
python -m http.server 8010 &
chrome --headless --disable-gpu --no-sandbox \
  --virtual-time-budget=15000 --dump-dom http://localhost:8010/tests/test.html
```

Esperado: **`Plataforma is not defined`** en las once pruebas nuevas.

**Comprobar que el registro del servidor CRECE.** En Windows se puede enlazar
el mismo puerto dos veces sin error, y entonces se está midiendo un servidor
viejo que sirve código viejo. Si el registro no crece, el puerto está ocupado.

- [ ] **Paso 3: Escribir el módulo**

En `js/plataforma.js`:

```js
window.Plataforma = (function () {

  /* El anfitrión, y no la URL entera, porque es la única parte que no puede
     falsificar quien escribe el enlace en el panel: el camino y la consulta
     los pone quien quiera. */
  var NOMBRES = {
    'youtu.be': 'YouTube',
    'youtube.com': 'YouTube',
    'www.youtube.com': 'YouTube',
    'vimeo.com': 'Vimeo',
    'www.vimeo.com': 'Vimeo'
  };

  /* A mano y no con `new URL()`, y no por nostalgia: `new URL` lanza ante una
     cadena que no sea una URL, y aquí lo que llega es un campo de texto que
     rellena una persona. Devolver null es la respuesta correcta a "esto no es
     una dirección", y envolverlo en un try/catch para conseguir lo mismo sería
     más código que la expresión. */
  function anfitrionDe(url) {
    var m = /^https?:\/\/([^\/?#]+)/i.exec(String(url || ''));
    if (!m) return null;
    /* El puerto fuera: `youtu.be:443` es el mismo anfitrión. */
    return m[1].split(':')[0].toLowerCase();
  }

  /* La comparación es contra el anfitrión ENTERO. Con un `indexOf` bastaba
     `youtube.com.malo.example` para hacerse pasar por YouTube, que es la forma
     clásica de este fallo. */
  function nombreDe(url) {
    var a = anfitrionDe(url);
    return (a && NOMBRES[a]) || null;
  }

  function etiquetaDe(url) {
    var n = nombreDe(url);
    return n ? 'Ver en ' + n : 'Ver el vídeo';
  }

  /* Toca el DOM, a diferencia de las dos de arriba, y vive aquí a propósito:
     `rel="noopener noreferrer"` tiene que estar escrito UNA vez. Repetido en
     `visor-ficha.js` y en `movil-ficha.js` serían dos copias que se separan, y
     la que se separe se lleva por delante una garantía de seguridad, no un
     detalle de estilo. */
  function boton(url) {
    if (!url) return null;
    var a = document.createElement('a');
    a.className = 'pastilla-enlace';
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = etiquetaDe(url);
    return a;
  }

  return { nombreDe: nombreDe, etiquetaDe: etiquetaDe, boton: boton };
})();
```

- [ ] **Paso 4: Añadir el `<script>` al arnés y ejecutar**

En `tests/test.html`, junto a los demás módulos puros:

```html
<script src="../js/plataforma.js"></script>
<script src="pruebas-plataforma.js"></script>
```

Ejecutar como en el Paso 2. Esperado: **433 comprobaciones, 0 fallos.**

- [ ] **Paso 5: Commit**

```bash
git add js/plataforma.js tests/pruebas-plataforma.js tests/test.html
git commit -m "Deducir la plataforma del video en vez de guardarla"
```

---

### Tarea 2: La ficha nueva en las reglas de validación

`ReglasContenido.validar` es el sitio correcto para esta regla porque ya lo es:
existe para que el navegador y el Worker no validen distinto, que fue el fallo
del bloque 2.

**Files:**
- Modify: `js/reglas-contenido.js` (función `validar`)
- Modify: `tests/pruebas-datos.js` y cualquier fixture con `camara`/`optica`
- Test: `tests/pruebas-datos.js`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `validar` exige `ficha.papel` y `ficha.anio`; tolera `ficha.cliente`
  y `ficha.enlace` ausentes.

- [ ] **Paso 1: Escribir las pruebas que fallan**

Añadir a `tests/pruebas-datos.js`:

```js
  function proyectoValido(extra) {
    var p = {
      id: 'x', titulo: 'X', categoria: 'editorial', tipo: 'fotos',
      portada: '/img/x-1500.jpg',
      piezas: [{ url: '/img/x-3000.jpg' }],
      ficha: { cliente: 'C', anio: 2026, papel: 'DoP' }
    };
    if (extra) { for (var k in extra) p.ficha[k] = extra[k]; }
    return { proyectos: [p] };
  }

  prueba('una ficha con cliente, ano y papel vale', function () {
    igual(ReglasContenido.validar(
      proyectoValido(), ReglasContenido.CATEGORIAS).length, 0);
  });

  /* El papel es lo que la artista eligio contar de su trabajo: si falta, la
     ficha no dice nada del proyecto. */
  prueba('sin papel no vale', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.papel;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });

  prueba('sin ano tampoco', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.anio;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });

  /* Conejita Playboy no trae cliente, y es contenido legitimo: sale como
     ###### en la ficha, no como un error de publicacion. */
  prueba('sin cliente SI vale: sale como ###### y no es un fallo', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.cliente;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 0);
  });

  prueba('sin enlace tambien vale: es un control, no un dato', function () {
    igual(ReglasContenido.validar(
      proyectoValido(), ReglasContenido.CATEGORIAS).length, 0);
  });

  /* Sin la ficha entera no se puede pintar nada, y `p.ficha.papel` lanzaria. */
  prueba('sin ficha no vale, y no revienta la validacion', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });
```

- [ ] **Paso 2: Ejecutar y comprobar que fallan**

Esperado: las seis nuevas en rojo. **Y probablemente otras ya existentes**, las
que construyen fixtures con `camara` y `optica`. Eso es la red funcionando: cada
fallo señala un sitio que hay que tocar. Anotar la lista antes de seguir.

- [ ] **Paso 3: Cambiar la validación**

En `js/reglas-contenido.js`, dentro de `validar`, tras la comprobación de
categoría:

```js
      /* La ficha es cliente / anio / papel / enlace desde que entro el
         contenido real (spec 2026-09-10). `camara` y `optica` salieron porque
         no aparecian en ninguno de los ocho proyectos de Lidia; `papel` entro
         porque aparece en los ocho.

         Se exigen `anio` y `papel` y NO `cliente` ni `enlace`, y la asimetria
         es deliberada: los dos primeros los tiene todo trabajo, mientras que
         Conejita Playboy no tiene cliente y los cuatro editoriales no tienen
         enlace. Exigirlos convertiria contenido legitimo en un 422. */
      var f = p.ficha;
      if (!f || typeof f !== 'object') {
        problemas.push(donde + ': sin ficha');
      } else {
        if (!f.anio)  problemas.push(donde + ': la ficha no trae año');
        if (!f.papel) problemas.push(donde + ': la ficha no trae papel');
      }
```

- [ ] **Paso 4: Reparar las fixtures que la red ha señalado**

Sustituir `camara`/`optica` por `papel` en cada fixture de la lista del Paso 2.
No añadir `enlace` salvo donde la prueba trate del botón.

- [ ] **Paso 5: Ejecutar y comprobar que pasa todo**

Esperado: **439 comprobaciones, 0 fallos.**

- [ ] **Paso 6: Commit**

```bash
git add js/reglas-contenido.js tests/
git commit -m "La ficha pasa a cliente, ano, papel y enlace"
```

---

### Tarea 3: El botón y las filas en el escritorio

**Files:**
- Modify: `js/visor-ficha.js` (función `pintar`)
- Modify: `index.html` y `tests/test.html` (la etiqueta `<script>`)
- Modify: `css/luque.css`
- Test: `tests/pruebas-visor-ficha.js`

**Interfaces:**
- Consumes: `Plataforma.boton(url)` de la Tarea 1.
- Produces: `VisorFicha.pintar(proyecto, total)` sin cambio de firma.

- [ ] **Paso 1: Escribir las pruebas que fallan**

```js
  var MARCADO =
    '<div><dl id="fichaDatos"></dl><div id="fichaEnlace"></div></div>';

  function proyecto(enlace) {
    return {
      categoria: 'videoclip', titulo: 'X',
      ficha: { cliente: 'C', anio: 2026, papel: 'Gaffer', enlace: enlace }
    };
  }

  prueba('la ficha pinta cliente, ano, papel y piezas', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      VisorFicha.pintar(proyecto(null), 6);
      var dt = raiz.querySelectorAll('#fichaDatos dt');
      igual(dt.length, 4);
      igual(dt[2].textContent, 'Papel');
    });
  });

  prueba('con enlace aparece el boton', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      VisorFicha.pintar(proyecto('https://youtu.be/x'), 6);
      var a = raiz.querySelector('#fichaEnlace a');
      igual(a.textContent, 'Ver en YouTube');
      igual(a.getAttribute('rel'), 'noopener noreferrer');
    });
  });

  /* Un control que no lleva a ninguna parte no se ensena apagado: se omite.
     Y no deja hueco, que es distinto de un dato ausente. */
  prueba('sin enlace no hay boton ni hueco', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      VisorFicha.pintar(proyecto(null), 6);
      igual(raiz.querySelector('#fichaEnlace').children.length, 0);
    });
  });

  /* Repintar sin limpiar dejaba DOS botones al pasar de un videoclip a otro. */
  prueba('repintar no acumula botones', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      VisorFicha.pintar(proyecto('https://youtu.be/x'), 6);
      VisorFicha.pintar(proyecto('https://youtu.be/y'), 6);
      igual(raiz.querySelectorAll('#fichaEnlace a').length, 1);
    });
  });
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

- [ ] **Paso 3: Añadir el contenedor al marcado**

En `index.html`, dentro del panel de la ficha, tras `<dl id="fichaDatos">`:

```html
<div id="fichaEnlace" class="ficha-enlace"></div>
```

- [ ] **Paso 4: Cambiar `pintar`**

En `js/visor-ficha.js`, dentro de `init` añadir `elEnlace` a las referencias
(`elEnlace = document.getElementById('fichaEnlace');`) y en `pintar`:

```js
    var filas = [
      ['Cliente', proyecto.ficha.cliente],
      ['Año',     proyecto.ficha.anio],
      ['Papel',   proyecto.ficha.papel],
      ['Piezas',  total]
    ];
```

y al final de la función:

```js
    /* Se vacia antes de pintar: sin esto, pasar de un videoclip a otro dejaba
       los dos botones puestos, y el de arriba llevaba al video anterior. */
    elEnlace.innerHTML = '';
    var boton = Plataforma.boton(proyecto.ficha.enlace);
    if (boton) elEnlace.appendChild(boton);
```

- [ ] **Paso 5: Añadir el `<script>` a `index.html`**

**Este paso es el punto ciego del proyecto.** `tests/test.html` ya lo tiene
desde la Tarea 1; `index.html` no, y sin él `Plataforma` llega `undefined` en
producción con la suite entera en verde.

En `index.html`, antes de `js/visor-ficha.js`:

```html
<script src="js/plataforma.js"></script>
```

- [ ] **Paso 6: El CSS del botón**

En `css/luque.css`, junto a las demás pastillas:

```css
/* La misma pastilla amarilla de la navbar y del HUD movil, y a proposito: el
   sitio tiene UN lenguaje visual y un boton con aspecto propio seria un
   tercero. El contraste del negro sobre --yellow ya esta razonado arriba.

   Sin logotipo de la plataforma: la restriccion global prohibe recursos
   externos desde el CSS, porque bajo file:// el navegador los bloquea. */
.pastilla-enlace {
    display: inline-block;
    background: var(--yellow);
    color: var(--black);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 700;
}

.pastilla-enlace:hover,
.pastilla-enlace:focus-visible {
    background: var(--black);
    color: var(--yellow);
}
```

- [ ] **Paso 7: Ejecutar y comprobar que pasa**

Esperado: **443 comprobaciones, 0 fallos.**

- [ ] **Paso 8: Comprobar que el módulo llega a la página real**

Que la suite esté verde no demuestra que `index.html` cargue el módulo:

```bash
chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
  --dump-dom http://localhost:8010/ | grep -c "js/plataforma.js"
```

Esperado: **1**. Si sale 0, falta el Paso 5.

- [ ] **Paso 9: Commit**

```bash
git add js/visor-ficha.js index.html tests/ css/luque.css
git commit -m "El boton del video en la ficha de escritorio"
```

---

### Tarea 4: El botón y las filas en el móvil

`MovilFicha.de` construye un nodo suelto y no guarda estado, así que se prueba
sin arnés: se le pide el nodo y se mira.

**Files:**
- Modify: `js/movil-ficha.js` (función `de`)
- Test: `tests/pruebas-movil-ficha.js`

**Interfaces:**
- Consumes: `Plataforma.boton(url)`.
- Produces: `MovilFicha.de(p)` sin cambio de firma.

- [ ] **Paso 1: Escribir las pruebas que fallan**

```js
  function proyecto(enlace) {
    return {
      titulo: 'X', piezas: [{}, {}, {}],
      ficha: { cliente: 'C', anio: 2026, papel: 'Gaffer', enlace: enlace }
    };
  }

  /* Los rotulos son los mismos que los del escritorio a proposito: es la misma
     ficha vista en otra pantalla, no otra ficha. */
  prueba('la ficha movil ensena las mismas cuatro filas', function () {
    var dt = MovilFicha.de(proyecto(null)).querySelectorAll('dt');
    igual(dt.length, 4);
    igual(dt[2].textContent, 'Papel');
  });

  prueba('con enlace aparece el boton, y abre fuera', function () {
    var a = MovilFicha.de(proyecto('https://youtu.be/x')).querySelector('a');
    igual(a.textContent, 'Ver en YouTube');
    igual(a.getAttribute('rel'), 'noopener noreferrer');
  });

  prueba('sin enlace no hay boton', function () {
    igual(MovilFicha.de(proyecto(null)).querySelector('a'), null);
  });
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

- [ ] **Paso 3: Cambiar `de`**

En `js/movil-ficha.js`, sustituir la lista de filas por:

```js
    [['Cliente', p.ficha.cliente],
     ['Año',     p.ficha.anio],
     ['Papel',   p.ficha.papel],
     ['Piezas',  p.piezas.length]].forEach(function (f) {
```

y tras `caja.appendChild(lista);`:

```js
    /* El mismo boton que el escritorio, del mismo sitio: `Plataforma.boton`
       existe para que el `rel="noopener noreferrer"` no esté escrito dos veces.
       Aquí no hace falta vaciar nada antes, a diferencia del escritorio: la
       escena móvil se reconstruye entera en cada parada. */
    var boton = Plataforma.boton(p.ficha.enlace);
    if (boton) caja.appendChild(boton);
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

Esperado: **446 comprobaciones, 0 fallos.**

- [ ] **Paso 5: Commit**

```bash
git add js/movil-ficha.js tests/pruebas-movil-ficha.js
git commit -m "El boton del video en la ficha movil"
```

---

### Tarea 5: Los campos del formulario del panel

El panel es donde el estudio edita la ficha. Si sigue pidiendo cámara y óptica,
escribe un `contenido.json` que la validación de la Tarea 2 rechaza con un 422.

**Files:**
- Modify: `panel/index.html` (los campos del formulario)
- Modify: `panel/js/panel.js` (leer y escribir los campos)
- Test: `tests/pruebas-panel.js`

**Interfaces:**
- Consumes: el esquema de la Tarea 2.
- Produces: un borrador con `ficha.papel` y `ficha.enlace`.

- [ ] **Paso 1: Escribir la prueba que falla**

```js
  prueba('el panel guarda papel y enlace, y ya no camara ni optica', function () {
    ArnesDom.conElemento(MARCADO_PANEL, function (raiz) {
      Panel.init(raiz);
      raiz.querySelector('#fichaPapel').value = 'DoP';
      raiz.querySelector('#fichaEnlaceCampo').value = 'https://youtu.be/x';
      var p = Panel.proyectoDelFormulario();
      igual(p.ficha.papel, 'DoP');
      igual(p.ficha.enlace, 'https://youtu.be/x');
      igual(p.ficha.camara, undefined);
    });
  });
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

- [ ] **Paso 3: Cambiar el formulario**

En `panel/index.html`, sustituir los campos de cámara y óptica por:

```html
<label for="fichaPapel">Papel</label>
<input id="fichaPapel" name="papel" type="text">

<label for="fichaEnlaceCampo">Enlace al vídeo (opcional)</label>
<input id="fichaEnlaceCampo" name="enlace" type="url"
       placeholder="https://youtu.be/…">
```

`type="url"` y no `text`: el navegador avisa de una dirección mal escrita antes
de que llegue a `contenido.json`, donde ya sólo se nota al pulsar el botón.

- [ ] **Paso 4: Cambiar la lectura y la escritura en `panel/js/panel.js`**

Sustituir las referencias a `camara` y `optica` por `papel` y `enlace`, con el
mismo patrón que ya usan los otros campos.

- [ ] **Paso 5: Ejecutar la suite y las pruebas del borrador**

```bash
node tests/prueba-borrador.js
```

Esperado: la suite del navegador en verde y las 52 del borrador también.

- [ ] **Paso 6: Commit**

```bash
git add panel/ tests/pruebas-panel.js
git commit -m "El panel edita papel y enlace"
```

---

### Tarea 6: La herramienta de derivación

Convierte originales de cámara en las tres medidas de la web. **Nunca escribe
sobre los originales y nunca sube nada**: deriva a `img/` y ahí acaba.

Los datos humanos de los ocho proyectos viven en `herramientas/proyectos.json`,
escritos una vez. Las 195 rutas se generan. Teclear a mano 195 rutas es
garantizar una errata que la validación no atrapa, porque una ruta mal escrita
sigue siendo una ruta válida.

**Files:**
- Create: `herramientas/derivar_imagenes.py`
- Create: `herramientas/proyectos.json`
- Create: `tests/prueba_derivar.py`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: un directorio de originales, pasado por línea de comandos.
- Produces: `img/<llave>-<lado>.jpg` y, en la Tarea 7, `contenido.json`.

- [ ] **Paso 1: Escribir las pruebas que fallan**

En `tests/prueba_derivar.py`:

```python
# -*- coding: utf-8 -*-
"""Pruebas de las partes puras de la herramienta de derivacion.

Aparte del arnes del navegador y por el mismo motivo que
`tests/pesar_imagenes.py`: esto es Python y se lanza a mano.
"""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', 'herramientas'))
from derivar_imagenes import llave, medidas_de


class PruebaLlave(unittest.TestCase):

    def test_aplana_la_ruta_entera(self):
        self.assertEqual(llave(os.path.join('EDITORIAL', 'La Boquerona',
                                            'IMG_5637.JPG')),
                         'editorial-la-boquerona-img_5637')

    def test_translitera_los_acentos(self):
        """nombreSeguro del Worker convertiria la o acentuada en un guion."""
        self.assertEqual(llave(os.path.join('EDITORIAL', 'Monstruación',
                                            'a.jpg')),
                         'editorial-monstruacion-a')

    def test_seis_portadas_con_el_mismo_nombre_no_colisionan(self):
        """Seis de los ocho proyectos llaman a su portada ESTA PORTADA.jpg.
        Con solo el nombre del archivo colisionarian seis de ocho."""
        a = llave(os.path.join('EDITORIAL', 'La Boquerona', 'ESTA PORTADA.jpg'))
        b = llave(os.path.join('VIDEOCLIP', 'TUKATU', 'ESTA PORTADA.jpg'))
        self.assertNotEqual(a, b)

    def test_todo_en_minusculas(self):
        """Las llaves de R2 distinguen mayusculas y este proyecto ya se quemo
        con eso: el auditor de rutas del bloque 1 existe por ese motivo."""
        self.assertEqual(llave('A/B.JPG'), 'a-b')


class PruebaMedidas(unittest.TestCase):
    """La medida es EL LADO LARGO, no una caja de proporcion fija."""

    def test_una_vertical_topa_por_el_alto(self):
        self.assertEqual(medidas_de((4000, 6000), 3000), (2000, 3000))

    def test_una_horizontal_topa_por_el_ancho(self):
        """Con una caja 2400x3000 esta se quedaba en 2400x1600: un 20% menos
        de lado largo que una vertical, sin ninguna razon."""
        self.assertEqual(medidas_de((5760, 3840), 3000), (3000, 2000))

    def test_una_foto_mas_pequena_que_la_caja_no_se_agranda(self):
        self.assertEqual(medidas_de((800, 600), 3000), (800, 600))


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

```bash
python tests/prueba_derivar.py
```

Esperado: `ModuleNotFoundError: No module named 'derivar_imagenes'`.

- [ ] **Paso 3: Escribir los datos humanos**

En `herramientas/proyectos.json`. **El orden de la lista es el orden de la
galería**, y es el que Lidia numeró en sus `TEXTOS.docx`, no el alfabético:

```json
{
  "proyectos": [
    { "id": "la-boquerona", "carpeta": "EDITORIAL/La Boquerona",
      "titulo": "La Boquerona", "categoria": "editorial", "tipo": "fotos",
      "ficha": { "cliente": "Harper's Bazaar", "anio": 2026, "papel": "DoP" } },
    { "id": "la-rosa-roja-de-zamarrilla",
      "carpeta": "EDITORIAL/La Rosa Roja de Zamarrilla",
      "titulo": "La Rosa Roja de Zamarrilla", "categoria": "editorial",
      "tipo": "fotos",
      "ficha": { "cliente": "Overdue Magazine, Issue 08 «Myth»",
                 "anio": 2026, "papel": "DoP" } },
    { "id": "the-in-between", "carpeta": "EDITORIAL/The In-Between",
      "titulo": "The In-Between", "categoria": "editorial", "tipo": "fotos",
      "ficha": { "cliente": "New Wave Magazine", "anio": 2025,
                 "papel": "Gaffer" } },
    { "id": "monstruacion", "carpeta": "EDITORIAL/Monstruación",
      "titulo": "Monstruación", "categoria": "editorial", "tipo": "fotos",
      "ficha": { "cliente": "Fashion Film", "anio": 2025, "papel": "1AC" } },
    { "id": "nuncaestuvetan-carmona",
      "carpeta": "VIDEOCLIP/Nuncaestuvetan- CARMONA",
      "titulo": "Nuncaestuvetan · Carmona", "categoria": "videoclip",
      "tipo": "fotos",
      "ficha": { "anio": 2026, "papel": "Grabación y edición",
                 "enlace": "https://youtu.be/IcFvvXAZMqs" } },
    { "id": "tukatu-noche-absoluta", "carpeta": "VIDEOCLIP/TUKATU",
      "titulo": "TUKATU · Noche absoluta ft. Alandes",
      "categoria": "videoclip", "tipo": "fotos",
      "ficha": { "anio": 2025, "papel": "Gaffer",
                 "enlace": "https://youtu.be/F32_IfzN84g" } },
    { "id": "momento-magico", "carpeta": "VIDEOCLIP/Momento Mágico",
      "titulo": "Momento mágico · TG&SOA", "categoria": "videoclip",
      "tipo": "fotos",
      "ficha": { "anio": 2026, "papel": "Grabación y edición del lyrics video",
                 "enlace": "https://youtu.be/uOMDWnIyQr0" } },
    { "id": "conejita-playboy", "carpeta": "VIDEOCLIP/Conejita Playboy",
      "titulo": "Conejita Playboy", "categoria": "videoclip", "tipo": "fotos",
      "ficha": { "anio": 2026, "papel": "Grabación y edición" } }
  ]
}
```

`conejita-playboy` no lleva `cliente` y los cuatro editoriales no llevan
`enlace`: **es correcto y no se rellena**. El primero sale como `######`; los
segundos, sin botón.

- [ ] **Paso 4: Escribir la herramienta**

En `herramientas/derivar_imagenes.py`. Las partes puras (`llave`, `medidas_de`)
van arriba y sin tocar disco, que es lo que las hace probables:

```python
# -*- coding: utf-8 -*-
"""Deriva las tres medidas de la web a partir de los originales de camara.

NO toca los originales, NO sube nada. Escribe en img/, que esta en .gitignore
porque son 43,7 MB generados: se sirven desde R2 en produccion y desde este
mismo directorio al probar en local.

Uso:  python herramientas/derivar_imagenes.py <directorio-de-originales>

Requiere Pillow. Es la unica dependencia del repositorio y vive aqui a
proposito: `herramientas/` no se despliega nunca. El SITIO sigue sin ninguna.
"""
import json, os, re, sys, unicodedata
from PIL import Image, ImageOps

# El lado largo, no una caja de proporcion fija. Ver la spec, seccion "La
# medida es el lado largo": el material real es 2:3, 3:2 y 16:9, y con una
# caja 4:5 las horizontales salian un 20% peor que las verticales.
MEDIDAS = [('portada', 1500, 82), ('pieza', 3000, 82), ('miniatura', 250, 80)]
EXTENSIONES = ('.jpg', '.jpeg', '.png')


def sin_acentos(s):
    """La o acentuada -> o. `nombreSeguro` del Worker convertiria cualquier
    no-ASCII en un guion y dejaria "Monstruaci-n"."""
    return ''.join(c for c in unicodedata.normalize('NFKD', s)
                   if not unicodedata.combining(c))


def llave(ruta_relativa):
    """Ruta relativa -> llave plana de R2, sin la extension.

    Misma regla que `nombreSeguro` en worker/src/publicar.js, mas
    transliteracion y minusculas. Se aplana la RUTA ENTERA y no solo el nombre
    del archivo: seis de los ocho proyectos llaman a su portada
    "ESTA PORTADA.jpg", asi que con el nombre solo colisionarian seis de ocho.

    Minusculas porque las llaves de R2 distinguen mayusculas, y este proyecto
    ya se quemo con eso en el bloque 1.
    """
    base = os.path.splitext(sin_acentos(ruta_relativa.replace(os.sep, '/')))[0]
    limpio = re.sub(r'[^a-zA-Z0-9._-]+', '-', base)
    limpio = re.sub(r'^[-.]+', '', limpio)
    return re.sub(r'-+', '-', limpio).strip('-').lower()


def medidas_de(tamano, lado):
    """(ancho, alto) que resultan de encajar `tamano` en un cuadrado de `lado`.

    Nunca agranda: una foto mas pequena que la caja se queda como esta.
    """
    ancho, alto = tamano
    if ancho <= lado and alto <= lado:
        return (ancho, alto)
    escala = float(lado) / max(ancho, alto)
    return (int(round(ancho * escala)), int(round(alto * escala)))


def derivar(origen, destino, lado, calidad):
    with Image.open(origen) as im:
        # La orientacion EXIF no es opcional: sin esto la mitad de los
        # verticales salen tumbados, porque la camara guarda el sensor en
        # horizontal y anota "girala" en el EXIF.
        im = ImageOps.exif_transpose(im)
        icc = im.info.get('icc_profile')
        if im.mode not in ('RGB', 'L'):
            im = im.convert('RGB')
        im = im.resize(medidas_de(im.size, lado), Image.LANCZOS)
        opciones = {'quality': calidad, 'optimize': True, 'progressive': True}
        if icc:
            opciones['icc_profile'] = icc
        im.save(destino, 'JPEG', **opciones)
        return im.size
```

Y el recorrido, que ordena las fotos por nombre dentro de cada carpeta y trata
la marcada como portada:

```python
def fotos_de(raiz, carpeta):
    """Las fotos de un proyecto, ordenadas por nombre.

    La portada la eligio la artista marcandola en el nombre del archivo
    ("ESTA PORTADA.jpg", "ESTE PORTADA.jpg"), y va la primera. El resto en
    orden alfabetico, que es como salen de la camara.
    """
    d = os.path.join(raiz, carpeta.replace('/', os.sep))
    nombres = [f for f in sorted(os.listdir(d))
               if os.path.splitext(f)[1].lower() in EXTENSIONES]
    portadas = [f for f in nombres if 'portada' in f.lower()]
    resto = [f for f in nombres if f not in portadas]
    return portadas + resto, portadas[0] if portadas else None
```

- [ ] **Paso 5: Ignorar `img/`**

En `.gitignore`:

```
# Lo genera herramientas/derivar_imagenes.py: 43,7 MB de imagenes derivadas.
# En produccion se sirven desde R2 (el Worker fuerza /img/* contra el bucket);
# aqui viven solo para poder probar el sitio en local antes de subirlas.
img/
```

- [ ] **Paso 6: Ejecutar las pruebas y la herramienta**

```bash
python tests/prueba_derivar.py
python herramientas/derivar_imagenes.py \
  "C:/Users/angel/Documents/LIDIA/PORTFOLIO-20260910T111338Z-1-001/PORTFOLIO"
```

Esperado: las diez pruebas en verde, e `img/` con **195 archivos y 43,7 MB**.
Comprobar además que el directorio de originales **no ha cambiado de tamaño**.

- [ ] **Paso 7: Commit**

```bash
git add herramientas/ tests/prueba_derivar.py .gitignore
git commit -m "La herramienta que deriva las tres medidas"
```

---

### Tarea 7: `contenido.json` real

**Files:**
- Modify: `herramientas/derivar_imagenes.py` (generar el JSON)
- Modify: `contenido.json`
- Modify: `tests/pesar_imagenes.py`

**Interfaces:**
- Consumes: `herramientas/proyectos.json` y el `img/` de la Tarea 6.
- Produces: un `contenido.json` que `ReglasContenido.validar` acepta.

- [ ] **Paso 1: Generar el JSON desde la herramienta**

Añadir a `derivar_imagenes.py`:

```python
def contenido(raiz, meta):
    """Mezcla los datos humanos con lo que hay en disco.

    Las rutas son RELATIVAS -/img/...- y no absolutas: asi el sitio funciona
    servido por `python -m http.server` en la red local, que es como se prueba
    en un movil real, y son mismo origen, que es lo que permite medir el brillo
    (bloque 4g) sin que el lienzo se manche.
    """
    salida = []
    for p in meta['proyectos']:
        nombres, portada = fotos_de(raiz, p['carpeta'])
        if not portada:
            raise SystemExit('%s no tiene portada marcada' % p['carpeta'])
        k = lambda f: llave(os.path.join(p['carpeta'].replace('/', os.sep), f))
        salida.append({
            'id': p['id'], 'titulo': p['titulo'],
            'categoria': p['categoria'], 'tipo': p['tipo'],
            'ficha': p['ficha'],
            'portada': '/img/%s-1500.jpg' % k(portada),
            'piezas': [{'url': '/img/%s-3000.jpg' % k(f),
                        'miniatura': '/img/%s-250.jpg' % k(f)}
                       for f in nombres]
        })
    return {'version': 2, 'proyectos': salida}
```

- [ ] **Paso 2: Generar y validar**

```bash
python herramientas/derivar_imagenes.py "<originales>" --contenido
```

Comprobar a mano que salen **8 proyectos y 65 piezas**, que el primero es
`la-boquerona` y el quinto `nuncaestuvetan-carmona` —el orden de Lidia, no el
alfabético—, y que `conejita-playboy` **no** tiene `ficha.cliente`.

- [ ] **Paso 3: Ejecutar la suite**

Las pruebas que cargan `contenido.json` real van a ver ocho proyectos donde
había doce. Esperado: **rojo en las que cuentan proyectos**. Ajustarlas a ocho.

- [ ] **Paso 4: Apuntar `pesar_imagenes.py` a lo real**

`PRESUPUESTO_GALERIA` sigue en 3 MB y no se toca. Lo que cambia es que las URLs
son relativas: hay que anteponerles el origen del servidor local.

```bash
python -m http.server 8010 &
python tests/pesar_imagenes.py --origen http://localhost:8010
```

Esperado: **ocho portadas, 1.169 KB de 3.072**, código de salida 0.

- [ ] **Paso 5: Mirarlo con los ojos**

Abrir `http://localhost:8010/` y comprobar la galería, un editorial y un
videoclip con su botón. **Esto no lo puede hacer el arnés**: si las fotos se ven
como Lidia quiere que se vean sólo lo juzga quien las mire.

- [ ] **Paso 6: Commit**

```bash
git add herramientas/derivar_imagenes.py contenido.json tests/
git commit -m "Los ocho proyectos reales en contenido.json"
```

---

### Tarea 8: Lo que queda dicho

Tres frases del repositorio quedan falsas al terminar este bloque, y una
frase que el código contradice es el fallo característico de este proyecto.

**Files:**
- Modify: `docs/estado-conocido.md`
- Modify: `docs/despliegue.md`

- [ ] **Paso 1: Corregir `docs/estado-conocido.md`**

Tres cosas, cada una donde le toca:

1. **La tabla de las tres medidas** dice 1200×1500, 2400×3000 y 200×250, que
   suponen 4:5. Pasa a ser el lado largo: 1500, 3000 y 250. Los pesos reales
   medidos son 159 KB, 520 KB y 8 KB de media.
2. **`js/visor-video.js` se queda sin ningún consumidor**, igual que `Brillo`.
   Los vídeos se alcanzan con el botón de `Plataforma`, no con el `<video>`. La
   rama `tipo === 'video'` de `ReglasContenido.validar` queda sin contenido que
   validar.
3. **Los proyectos ya no son de ejemplo.** La sección que dice que la galería
   lleva contenido de relleno hasta que el estudio meta su trabajo real deja de
   ser cierta: son los ocho proyectos de Lidia.

Y una que se añade: **`cortometraje` y `foto-stills` no tienen ningún
proyecto**, y está pendiente decidir qué se ve al pulsarlas.

- [ ] **Paso 2: Documentar la subida a R2 en `docs/despliegue.md`**

**Este paso escribe el procedimiento; no lo ejecuta.** Subir es un acto manual
de Ángel.

```markdown
## Subir las imágenes derivadas a R2

Con `img/` ya generado por `herramientas/derivar_imagenes.py`:

```bash
for f in img/*.jpg; do
  npx wrangler r2 object put "luque-contenido/img/$(basename "$f")" \
    --file "$f" --content-type image/jpeg
done
```

Se usa wrangler y no `rclone` porque wrangler reutiliza la sesión ya iniciada:
`rclone` exigiría crear fichas de API S3 de R2, o sea **credenciales nuevas que
guardar**, y la restricción global dice que no hay credenciales en el
repositorio.

Las imágenes son inmutables: `guardarImagen` responde 409 en vez de
sobrescribir. Repetir la subida sobre una llave ya publicada no la pisa, la
rechaza. Para corregir una foto se sube con otra llave.
```

- [ ] **Paso 3: Commit**

```bash
git add docs/
git commit -m "Cerrar en la documentacion lo que el contenido real cambia"
```

---

## Autorrevisión

**Cobertura de la spec.** Las tres capas de la arquitectura tienen tarea:
derivar (6), subir (8, documentada), describir (2, 3, 4, 5, 7). El botón está
en las tareas 1, 3 y 4 con sus cuatro rasgos —`<a>`, `noopener`, plataforma
deducida, sin logotipo—. La ficha nueva está en 2, 3, 4 y 5. Las cuatro
categorías se conservan sin tocar `CATEGORIAS`, que ya las declara.

**Sin marcadores de posición.** Todos los pasos de código llevan el código.
`herramientas/proyectos.json` va con los ocho proyectos escritos.

**Consistencia de tipos.** `Plataforma.boton(url)` devuelve un nodo o `null`, y
las tres consumidoras —tarea 3, tarea 4 y sus pruebas— comprueban `null` antes
de añadir. `llave()` y `medidas_de()` se llaman igual en la herramienta y en
sus pruebas.

**Dos huecos que este plan NO cierra, y hay que decirlo:**

1. **Las tres preguntas para Lidia siguen abiertas** —los títulos definitivos,
   dónde va cada proyecto, y qué se ve al pulsar una categoría vacía—. Las dos
   primeras están escritas en `herramientas/proyectos.json` como propuesta y se
   cambian ahí en una línea. La tercera no la toca ninguna tarea: la barra de
   filtros se queda como está y las dos categorías vacías darán rejilla en
   blanco hasta que se decida.
2. **La cuenta de comprobaciones de cada tarea es una previsión, no una
   medida.** Las tareas 2 y 7 rompen fixtures existentes a propósito y no se
   sabe cuántas hasta ejecutarlas. Los números —433, 439, 443, 446— son el
   suelo, no la cifra exacta; el criterio es **cero fallos**, no llegar a un
   número.
