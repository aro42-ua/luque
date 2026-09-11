# La pantalla del proyecto, para que se vea y se use bien — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea a tarea. Los pasos llevan casilla (`- [ ]`) para ir marcándolos.

**Meta:** Que la pantalla de un proyecto del panel —la que añade, quita y ordena las fotos— se vea como una herramienta acabada y se pueda usar desde un teléfono, incluido guardar sin salir de ella.

**Arquitectura:** No cambia lo que la pantalla hace. Se conservan todos los `id` y los `data-accion`, que es lo que enlaza el JS y lo que pulsan las pruebas; se añade estructura y clases alrededor. Dos cambios de JS, pequeños y probados: un segundo botón «Guardar» en una barra fija al pie de la pantalla, cableado al mismo `guardar()`; y el número «n/N» y la etiqueta «Portada» visibles en cada celda. El resto es marcado y CSS, que la suite no puede ver y se comprueba en el navegador.

**Tecnologías:** JavaScript ES5 sin librerías (IIFE, un `window.X` por módulo), CSS a mano en `panel/css/panel.css`, pruebas en `tests/test.html` con los arneses del repositorio (`tests/arnes-dom.js`, `conDocumento` carga `panel.js` entero en un iframe).

**Spec:** `docs/superpowers/specs/2026-09-11-panel-proyecto-diseno-design.md`

## Restricciones globales

- **Ningún `id` cambia ni desaparece.** `Proyecto.recoger` enlaza por `id` y las pruebas llevan una copia mínima del marcado con sólo los `id`. Se añade estructura alrededor, nunca se renombra.
- **Ningún `data-accion` cambia.** Las pruebas pulsan `#pFotos > li [data-accion="…"]`. Los cuatro botones de la celda siguen siendo hijos directos del `<li>`, con las mismas acciones.
- **ES5.** Nada de `const`, `let`, arrow functions, template literals ni `class`.
- **Sin dependencias externas.** Nada de npm, CDN, ni `url()` a un archivo externo desde el CSS.
- **Techo de 300 líneas por archivo** en `panel/js/`. `panel.js` está en 267 y `fotos.js` en 145; esta rama los deja en torno a 277 y 152.
- **Comentarios en castellano**, explicando el porqué, en el tono de los ficheros de al lado.
- **Un nodo nuevo que `panel.js` busque al arrancar va en DOS sitios:** `panel/index.html` y la constante `HTML` de `tests/pruebas-panel.js`. Sin el segundo, `getElementById` devuelve `null` en el iframe y la sección entera del panel cae. La suite en verde NO demuestra que `panel/index.html` tenga el nodo.
- **`tests/test.html` no carga `panel/css/panel.css`.** Nada del CSS lo ve la suite; se comprueba en el navegador.
- **La trampa del arnés:** `prueba()` es SÍNCRONA; una prueba que devuelva una promesa sale en verde sin comprobar nada. Las secciones del panel son `describeAsync` con `conPanel(...).then(...)`: las `prueba(...)` van DENTRO del `then`, síncronas, como las que ya hay.
- **Los botones de la celda miden 44px de alto como mínimo** en todas las anchuras, no sólo en el móvil.

## Cómo se ejecutan las pruebas

Con un servidor sirviendo la raíz del repositorio (`python -m http.server 8000`), abrir `http://localhost:8000/tests/test.html`. Sin ventana, este ayudante cuenta los PASA/FALLA directamente (la línea de resumen del arnés espera a las secciones asíncronas y no siempre llega al volcado):

```bash
PYTHONIOENCODING=utf-8 python "<scratchpad>/suite.py" http://127.0.0.1:8000/tests/test.html
```

El controlador da la ruta exacta de `suite.py` en cada encargo. **Baseline al empezar: `668 pasan, 0 fallan`.** Hay una prueba intermitente conocida y anterior a esta rama («cambiar de sitio sí añade una entrada al historial», en `tests/pruebas-router-ir.js`): si sale UNA en rojo y es ésa, repetir la pasada antes de buscar culpables.

## Estructura de ficheros

| Fichero | Responsabilidad | Estado |
|---|---|---|
| `panel/js/panel.js` | El arranque del panel y el enrutado de sus tres pantallas | `guardarActivo` y el segundo botón |
| `panel/js/fotos.js` | Pintar la rejilla de fotos y sus acciones | `celda-num` y `celda-etiqueta` |
| `panel/index.html` | El marcado de las tres pantallas | la pantalla del proyecto gana estructura |
| `panel/css/panel.css` | Todo el estilo del panel | la pantalla del proyecto, la rejilla, la barra, el `@media` |
| `tests/pruebas-panel.js` | `panel.js` entero en un iframe | `#pGuardar` en el marcado y sus pruebas |
| `tests/pruebas-proyecto.js` | `Proyecto.pintar` y la rejilla | las pruebas del número y la etiqueta |
| `docs/estado-conocido.md` | Lo que conviene saber antes de tocar el código | este bloque, y los 3c/3d que faltaban |

---

## Tarea 1: Guardar desde dentro del proyecto

El segundo botón, cableado al mismo `guardar()`, y apagado y encendido a la vez que el de la lista.

**Ficheros:**
- Modificar: `panel/js/panel.js`
- Modificar: `panel/index.html` (la barra al pie de `#pantallaProyecto`)
- Modificar: `tests/pruebas-panel.js`

**Interfaces:**
- Consume: `guardar()` y `activarControles(activo)`, privadas de `panel.js`.
- Produce: en el DOM, `#pGuardar` (un `<button type="button">`) dentro de `.proyecto-barra`, al final de `#pantallaProyecto`, con `#pAviso` movido dentro de esa barra. En `panel.js`, la función privada `guardarActivo(activo)`.

- [ ] **Paso 1: Escribir las pruebas que fallan**

En `tests/pruebas-panel.js`, en la constante `HTML`, sustituir la línea

```js
  '<h2 id="pTitulo"></h2><p id="pAviso" role="status" aria-live="polite"></p>' +
```

por

```js
  '<h2 id="pTitulo"></h2>' +
```

y sustituir la línea

```js
  '<ol id="pFotos"></ol><p id="pProblemas"></p></section>' +
```

por

```js
  '<ol id="pFotos"></ol><p id="pProblemas"></p>' +
  '<div class="proyecto-barra"><p id="pAviso" role="status" aria-live="polite"></p>' +
  '<button id="pGuardar" type="button">Guardar</button></div></section>' +
```

En `estadoControles`, el comentario dice «ocho controles». Pasa a nueve: sustituir la función y su ayudante por

```js
  /* El estado de los nueve controles que toca `activarControles`
     (panel.js), en este orden: título, categoría, los cuatro campos de
     la ficha, el botón de crear, el de guardar de la lista y el de guardar
     de la pantalla del proyecto. Se mira la lista entera y no un par de
     ellos: un control que se quedara fuera de `activarControles` seguiría
     activo delante de un `trabajo` que todavía es null. */
  function estadoControles(d) {
    var ids = ['titulo', 'categoria', 'fichaCliente', 'fichaAnio',
               'fichaPapel', 'fichaEnlace'];
    return ids.map(function (id) { return d.getElementById(id).disabled; })
      .concat([d.querySelector('#nuevo button[type="submit"]').disabled,
               d.getElementById('guardar').disabled,
               d.getElementById('pGuardar').disabled]);
  }

  function nueveIguales(valor) {
    return [valor, valor, valor, valor, valor, valor, valor, valor, valor];
  }
```

y cambiar cada llamada a `ochoIguales(` por `nueveIguales(` en el fichero (hay que buscarlas: `grep -n ochoIguales tests/pruebas-panel.js`).

En la sección «Guardar y el conflicto», justo ANTES del bloque `var doble = borradorFalso({ datos: dosProyectos(), respuestaAlGuardar: { conflicto: true, guardada: 9 } });`, añadir un bloque nuevo:

```js
  }).then(function () {

    /* El Guardar de la pantalla del proyecto es el MISMO guardar: manda el
       trabajo entero con su versión, igual que el de la lista. Un botón que
       guardara «sólo este proyecto» sería otra cosa, y no existe. */
    var desdeProyecto = borradorFalso({ datos: dosProyectos() });
    return conPanel(desdeProyecto, function (w, d) {
      d.getElementById('pGuardar').click();

      prueba('el Guardar de la pantalla del proyecto guarda lo mismo que el de la lista', function () {
        igual(desdeProyecto.guardadas.length, 1);
        igual(desdeProyecto.guardadas[0].version, 3);
        igual(d.getElementById('aviso').textContent, 'Guardado.');
      });
    });

```

(El `}).then(function () {` inicial cierra el bloque anterior y abre éste; el bloque del conflicto que ya existe empieza con su propio `}).then(function () {`, así que la cadena queda entera.)

Y dentro del bloque del conflicto, después de la prueba `'un conflicto deshabilita Guardar'`, añadir:

```js
      /* Los dos botones son el mismo peligro: si el de la pantalla del
         proyecto siguiera activo, desde allí se mandaría la misma versión
         vieja y el servidor contestaría 409 en bucle. */
      prueba('y también el Guardar de la pantalla del proyecto', function () {
        igual(d.getElementById('pGuardar').disabled, true);
      });
```

- [ ] **Paso 2: Ejecutar para verificar que fallan**

Esperado: la sección `panel.js` en rojo. Las de `estadoControles` fallan porque `pGuardar` sí existe en el marcado de prueba pero `activarControles` no lo apaga (esperaba `false`/`true` en la novena posición); las dos nuevas fallan porque nadie escucha el botón ni lo apaga.

- [ ] **Paso 3: Escribir la implementación**

En `panel/js/panel.js`:

La declaración `var elLista, elAviso, elTitulo, elCategoria, elCrear, elGuardar;` pasa a:

```js
  var elLista, elAviso, elTitulo, elCategoria, elCrear, elGuardar, elGuardarProyecto;
```

Justo ANTES de `function activarControles(activo) {`, añadir:

```js
  /* Los dos botones de guardar —el de la lista y el de la pantalla del
     proyecto— son el mismo `guardar()` y tienen que apagarse y encenderse a
     la vez: al arrancar, hasta que llega el borrador, y tras un conflicto de
     versiones, donde el aviso dice que «Guardar» se ha desactivado y el
     botón tiene que parecerlo. Un solo sitio para el `disabled`, para que el
     segundo botón no se quede encendido por olvido en un camino nuevo. */
  function guardarActivo(activo) {
    elGuardar.disabled = !activo;
    elGuardarProyecto.disabled = !activo;
  }
```

Dentro de `activarControles`, la línea `elGuardar.disabled = !activo;` pasa a:

```js
    guardarActivo(activo);
```

En `guardar()`, en la rama del conflicto, la línea `elGuardar.disabled = true;` pasa a:

```js
        guardarActivo(false);
```

En `init`, después de `elGuardar = document.getElementById('guardar');`, añadir:

```js
    elGuardarProyecto = document.getElementById('pGuardar');
```

y después de `elGuardar.addEventListener('click', guardar);`, añadir:

```js
    elGuardarProyecto.addEventListener('click', guardar);
```

Comprobar con `grep -n "elGuardar.disabled" panel/js/panel.js` que no queda ninguna asignación suelta fuera de `guardarActivo`.

En `panel/index.html`, en `#pantallaProyecto`: quitar la línea

```html
      <p id="pAviso" role="status" aria-live="polite" class="aviso"></p>
```

de debajo del `<h2 id="pTitulo">`, y añadir al final de la sección, después de `<p id="pProblemas" class="problemas"></p>`:

```html
      <!-- La barra fija al pie. El aviso vive aquí y no arriba: en un
           teléfono, mientras se ordena la rejilla, un «Cambiado. Recuerda
           guardar.» en la cabecera queda fuera de la vista. Y el botón es el
           mismo guardar() que el de la lista: panel.js los apaga y los
           enciende a la vez (`guardarActivo`). -->
      <div class="proyecto-barra">
        <p id="pAviso" role="status" aria-live="polite" class="aviso"></p>
        <button id="pGuardar" type="button">Guardar</button>
      </div>
```

- [ ] **Paso 4: Ejecutar para verificar que pasan**

Esperado: **670 pasan, 0 fallan** (668 + 2).

- [ ] **Paso 5: Commit**

```bash
git add panel/js/panel.js panel/index.html tests/pruebas-panel.js
git commit -m "Guardar desde dentro del proyecto, apagado y encendido a la vez que el de la lista"
```

---

## Tarea 2: El número y la etiqueta de portada en cada celda

**Ficheros:**
- Modificar: `panel/js/fotos.js`
- Modificar: `tests/pruebas-proyecto.js`

**Interfaces:**
- Consume: `celda(pieza, i, total, esPortada, acciones)`, privada de `fotos.js`.
- Produce: en cada `<li class="celda">`, un `<span class="celda-num">` con el texto `n/N` (desde 1), entre los botones ‹ y ›; y sólo en la portada, un `<span class="celda-etiqueta">Portada</span>` justo después de la `<img>`.

- [ ] **Paso 1: Escribir las pruebas que fallan**

En `tests/pruebas-proyecto.js`, dentro del `describe('Proyecto.pintar', ...)`, después de la función `proyecto()`, añadir un fixture de tres piezas:

```js
  /* Tres piezas y la portada en la del medio, para que las pruebas del
     número y de la etiqueta no puedan acertar por casualidad con la primera. */
  function tresPiezas() {
    return { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
             ficha: { cliente: 'Vogue ES', anio: 2025, papel: 'DoP' },
             portada: '/img/b-1500.jpg',
             piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' },
                      { url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg', portada: '/img/b-1500.jpg' },
                      { url: '/img/c-3000.jpg', miniatura: '/img/c-250.jpg', portada: '/img/c-1500.jpg' }] };
  }
```

Y al final del mismo `describe`, antes de su `});` de cierre:

```js
  /* El número va visible y no sólo en el `alt`: en una rejilla de diez fotos
     casi iguales, «mover la 7 antes de la 4» necesita ver los números. */
  prueba('cada celda enseña su número, desde 1', function () {
    conPantalla(function (els) {
      var nums = Array.prototype.map.call(els.fotos.querySelectorAll('.celda-num'),
        function (s) { return s.textContent; });
      igual(nums, ['1/3', '2/3', '3/3']);
    }, tresPiezas());
  });

  /* Hasta este bloque la portada sólo se distinguía por una clase en el <li>,
     cuyo borde era amarillo sobre una página amarilla: invisible. */
  prueba('sólo la portada lleva la etiqueta', function () {
    conPantalla(function (els) {
      var celdas = els.fotos.children;
      var etiquetas = Array.prototype.map.call(celdas, function (li) {
        var e = li.querySelector('.celda-etiqueta');
        return e ? e.textContent : null;
      });
      igual(etiquetas, [null, 'Portada', null]);
    }, tresPiezas());
  });
```

- [ ] **Paso 2: Ejecutar para verificar que fallan**

Esperado: las dos nuevas en rojo — `[]` en vez de los tres números, y `[null, null, null]` en vez de la etiqueta.

- [ ] **Paso 3: Escribir la implementación**

En `panel/js/fotos.js`, dentro de `celda(...)`, justo después de `li.appendChild(img);`, añadir:

```js
    /* La portada lleva su etiqueta encima de la foto. Hasta este bloque se
       distinguía sólo por `celda--portada`, cuyo borde era amarillo sobre una
       página amarilla, o sea invisible. La etiqueta se lee, y el botón
       «Portada» apagado de abajo lo confirma. */
    if (esPortada) {
      var etiqueta = document.createElement('span');
      etiqueta.className = 'celda-etiqueta';
      etiqueta.textContent = 'Portada';
      li.appendChild(etiqueta);
    }
```

Y entre el botón `'anterior'` y el botón `'siguiente'` —es decir, después de la llamada `li.appendChild(boton('anterior', ...));` y antes de `li.appendChild(boton('siguiente', ...));`— añadir:

```js
    /* El número entre ‹ y › se lee como un control de posición, y es lo que
       permite «mover la 7 antes de la 4» en diez fotos casi iguales. Hasta
       ahora sólo estaba en el `alt`. */
    var num = document.createElement('span');
    num.className = 'celda-num';
    num.textContent = (i + 1) + '/' + total;
    li.appendChild(num);
```

- [ ] **Paso 4: Ejecutar para verificar que pasan**

Esperado: **672 pasan, 0 fallan** (670 + 2). Las pruebas que ya había de la rejilla siguen en verde: pulsan por `[data-accion]`, que no cambia.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/fotos.js tests/pruebas-proyecto.js
git commit -m "La rejilla ensena el numero de cada foto y cual es la portada"
```

---

## Tarea 3: La ficha, la zona de subir y la barra

Marcado y CSS. La suite no lo ve; se comprueba en el navegador.

**Ficheros:**
- Modificar: `panel/index.html` (`#pantallaProyecto`)
- Modificar: `panel/css/panel.css`

**Interfaces:**
- Consume: la barra `.proyecto-barra` con `#pAviso` y `#pGuardar`, de la Tarea 1.
- Produce: las clases `proyecto-titulo`, `ficha`, `campo`, `campo--ancho`, `soltar-boton`, `visualmente-oculto`, `progreso`, y las reglas de `.proyecto-barra`.

- [ ] **Paso 1: El marcado**

En `panel/index.html`, sustituir el contenido de `#pantallaProyecto` desde `<button id="pVolver"` hasta `<p id="pProblemas" class="problemas"></p>` (la barra de la Tarea 1 se queda debajo, sin tocar) por:

```html
      <button id="pVolver" type="button" class="volver">‹ Volver a los proyectos</button>
      <h2 id="pTitulo" class="proyecto-titulo"></h2>

      <!-- Los seis campos comparten el estilo del formulario de crear (la
           regla `.nuevo input` gana el selector `.ficha input` en el CSS), en
           dos columnas de ancho y una en el teléfono. Ningún `id` cambia:
           Proyecto.recoger enlaza por ellos. -->
      <div class="ficha">
        <div class="campo campo--ancho">
          <label for="pNombre">Título</label>
          <input id="pNombre" type="text" autocomplete="off">
        </div>
        <div class="campo">
          <label for="pCategoria">Categoría</label>
          <select id="pCategoria"></select>
        </div>
        <div class="campo">
          <label for="pAnio">Año</label>
          <input id="pAnio" type="number">
        </div>
        <div class="campo">
          <label for="pCliente">Cliente (opcional)</label>
          <input id="pCliente" type="text" autocomplete="off">
        </div>
        <div class="campo">
          <label for="pPapel">Papel</label>
          <input id="pPapel" type="text" autocomplete="off">
        </div>
        <div class="campo campo--ancho">
          <label for="pEnlace">Enlace al vídeo (opcional)</label>
          <input id="pEnlace" type="url" placeholder="https://vimeo.com/…">
        </div>
      </div>

      <!-- El selector de archivos va SIEMPRE, no sólo como alternativa a
           soltar: la especificación lo pide («toda subida ofrece un selector
           de archivos además de soltar») y soltar no existe con teclado. El
           <input> está oculto a la vista pero NO con display:none, que lo
           sacaría del tabulador; la etiqueta hace de botón y recibe el anillo
           de foco por :focus-within. -->
      <div id="pSoltar" class="soltar">
        <label for="pArchivos" class="soltar-boton">Elegir archivos</label>
        <input id="pArchivos" type="file" accept="image/*" multiple class="visualmente-oculto">
        <p class="soltar-pista">o suéltalas aquí</p>
      </div>

      <p id="pProgreso" role="status" aria-live="polite" class="progreso"></p>
      <ol id="pFotos" class="fotos"></ol>
      <p id="pProblemas" class="problemas"></p>
```

Comprobar que los trece `id` de `Proyecto.recoger` siguen todos: `grep -oE 'id="p[A-Z][A-Za-z]+"' panel/index.html | sort` tiene que listar `pAnio pArchivos pAviso pCategoria pCliente pEnlace pFotos pGuardar pNombre pPapel pProblemas pProgreso pSoltar pTitulo pVolver`.

- [ ] **Paso 2: El CSS de la ficha y la cabecera**

En `panel/css/panel.css`, en la regla que empieza `.nuevo input,` (sobre la línea 203), ampliar la lista de selectores a:

```css
.nuevo input,
.nuevo select,
.ficha input,
.ficha select{
```

y en la de `:disabled` que va justo debajo:

```css
.nuevo input:disabled,
.nuevo select:disabled,
.ficha input:disabled,
.ficha select:disabled{
```

Sustituir la cabecera `/* LA PANTALLA DE UN PROYECTO (bloque 3c) */` y todo lo que hay hasta la regla `.fotos{` (exclusive) por:

```css
/* ============================================================
   LA PANTALLA DE UN PROYECTO (bloque 3c; vestida en el bloque
   de la pantalla del proyecto)
============================================================ */

.volver{
  font-family: var(--ff);
  font-size: 1rem;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  margin-bottom: 1.5rem;
}

/* Un escalón por debajo del h1 de la lista: es el título de UNA cosa. */
.proyecto-titulo{
  font-weight: 700;
  font-size: clamp(1.4rem, 3vw, 2rem);
  letter-spacing: var(--kerning);
  margin-bottom: 1.5rem;
}

/* Dos columnas en ancho, una en el teléfono (ver el @media del final). Los
   dos campos anchos llevan `span 2`, que sobre una rejilla de una columna no
   hace nada, así que en el móvil no hay nada que deshacer. */
.ficha{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  margin-bottom: 2rem;
}
.campo{ display: flex; flex-direction: column; gap: 0.35rem; }
.campo label{ font-weight: 700; }
.campo--ancho{ grid-column: span 2; }
```

- [ ] **Paso 3: El CSS de la zona de subir y la barra**

Sustituir las reglas `.soltar{...}`, `.soltar--encima{...}` y `.soltar-pista{...}` que ya existen por:

```css
/* La zona de soltar se entiende sin leerla: borde discontinuo, altura, y una
   etiqueta con aspecto de botón en medio. Al arrastrar encima se invierte,
   igual que hacen los botones al pasar el ratón. */
.soltar{
  border: 2px dashed var(--black);
  border-radius: 4px;
  padding: 1.5rem 1rem;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.soltar--encima{
  border-style: solid;
  background: var(--black);
  color: var(--yellow);
}
.soltar-pista{ opacity: .7; font-size: .9em; }

.soltar-boton{
  display: inline-block;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.6rem 1.25rem;
  border: 2px solid var(--black);
  border-radius: 4px;
  background: var(--black);
  color: var(--yellow);
  cursor: pointer;
}
.soltar--encima .soltar-boton{ background: var(--yellow); color: var(--black); }

/* Oculto a la vista, no al tabulador: `display:none` sacaría el <input> del
   recorrido con Tab y la subida dejaría de existir sin ratón. El foco lo
   recibe la etiqueta, que es lo que se ve. */
.visualmente-oculto{
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.soltar:focus-within .soltar-boton{
  outline: 3px solid var(--black);
  outline-offset: 2px;
}

.progreso{ min-height: 1.5em; font-weight: 700; margin-bottom: 0.75rem; }

/* La barra fija al pie: el aviso y Guardar siempre a la vista, también con
   la rejilla desplazada. `sticky` y no `fixed` para que siga el ancho de la
   columna del panel y no tape nada fuera de ella. */
.proyecto-barra{
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 0.75rem 0;
  background: var(--yellow);
  border-top: 2px solid var(--black);
}
.proyecto-barra .aviso{ margin: 0; flex: 1 1 auto; }
```

Y en la regla de los botones grandes que empieza `.nuevo button,` con `#guardar` (tres reglas: la base, el `:hover` y el `:disabled`), añadir `#pGuardar` a cada lista de selectores:

```css
.nuevo button,
#guardar,
#pGuardar{
```

```css
.nuevo button:hover:not(:disabled),
#guardar:hover:not(:disabled),
#pGuardar:hover:not(:disabled){
```

```css
.nuevo button:disabled,
#guardar:disabled,
#pGuardar:disabled{
```

En la regla base, `align-self: flex-start;` y `margin-top: 0.75rem;` valen para el formulario de crear; para que no descoloquen el botón dentro de la barra, añadir justo debajo de esas tres reglas:

```css
#pGuardar{ align-self: auto; margin-top: 0; flex: 0 0 auto; }
```

- [ ] **Paso 4: La suite sigue igual**

Esperado: **672 pasan, 0 fallan**. El CSS no lo ve; lo que se comprueba es que el marcado nuevo no rompió ningún `id`.

- [ ] **Paso 5: Comprobar en el navegador**

Lo hace el controlador con el panel servido en local y las diez fotos de `la-boquerona` inyectadas (`Proyecto.pintar(Proyecto.recoger(document), proyecto, …)` sobre `#/la-boquerona`), a 1100px y a 375px de ancho:
- la ficha en dos columnas / una columna, con etiquetas encima;
- la zona de soltar con su botón centrado, y el anillo de foco en la etiqueta al tabular hasta el `input`;
- la barra al pie, pegada abajo al desplazar, con el aviso a la izquierda y Guardar a la derecha.

- [ ] **Paso 6: Commit**

```bash
git add panel/index.html panel/css/panel.css
git commit -m "La ficha, la zona de subir y la barra de la pantalla del proyecto"
```

---

## Tarea 4: La rejilla y el teléfono

**Ficheros:**
- Modificar: `panel/css/panel.css`

**Interfaces:**
- Consume: la estructura de la celda de la Tarea 2 — `<li class="celda">` con `img.celda-img`, `span.celda-etiqueta` (sólo la portada), y los cuatro `button.celda-boton[data-accion]` con `span.celda-num` entre `anterior` y `siguiente`.
- Produce: sólo CSS.

- [ ] **Paso 1: La rejilla y la celda**

Sustituir el bloque que va desde `.fotos{` hasta `.celda--arrastrando{ … }` inclusive por:

```css
/* ============================================================
   LA REJILLA DE FOTOS
============================================================ */

.fotos{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: .75rem;
  list-style: none;
  padding: 0;
}

/* La celda es negra con texto amarillo, como las filas de la lista: es el
   lenguaje que el panel ya tiene, y las fotos destacan sobre negro. Dentro,
   una rejilla de cuatro columnas —44px, 1fr, 1fr, 44px— para que ‹ y ›
   midan lo que un dedo y «Portada» y «Quitar» se repartan el resto:

     img  img  img  img
     ant  num  num  sig
     por  por  qui  qui

   Los cuatro botones son hijos directos del <li>, como los pulsan las
   pruebas; las áreas las reparte el data-accion. */
.celda{
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr 1fr 44px;
  grid-template-areas:
    "img img img img"
    "ant num num sig"
    "por por qui qui";
  gap: 4px;
  padding: 4px;
  background: var(--black);
  color: var(--yellow);
  border-radius: 4px;
  cursor: grab;
}
.celda:active{ cursor: grabbing; }

/* La portada, además de su etiqueta, lleva un anillo doble: amarillo pegado
   a la celda y negro por fuera. Uno solo amarillo se confundiría con la
   página; uno solo negro, con la celda. */
.celda--portada{
  box-shadow: 0 0 0 3px var(--yellow), 0 0 0 6px var(--black);
}

/* La misma proporcion y el mismo recorte que la galeria: lo que se ve aqui es
   lo que se vera en el lienzo, y elegir portada mirando otra cosa seria
   elegir a ciegas. */
.celda-img{
  grid-area: img;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  display: block;
}

.celda-etiqueta{
  position: absolute;
  top: 10px; left: 10px;
  padding: 0.2rem 0.5rem;
  background: var(--yellow);
  color: var(--black);
  font-weight: 700;
  font-size: 0.8rem;
  border-radius: 3px;
}

.celda-num{
  grid-area: num;
  align-self: center;
  text-align: center;
  font-weight: 700;
}

/* 44px de alto como mínimo en TODAS las anchuras, no sólo en el teléfono:
   son el camino principal en táctil, donde el arrastre nativo no funciona, y
   tener dos rejillas según el ancho sería mantener dos. */
.celda-boton{
  min-height: 44px;
  border: 2px solid var(--yellow);
  background: transparent;
  color: var(--yellow);
  font-family: var(--ff);
  font-weight: 700;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.celda-boton:hover:not(:disabled){ background: var(--yellow); color: var(--black); }
.celda-boton:disabled{ opacity: 0.35; cursor: not-allowed; }
.celda-boton[data-accion="anterior"]{ grid-area: ant; }
.celda-boton[data-accion="siguiente"]{ grid-area: sig; }
.celda-boton[data-accion="portada"]{ grid-area: por; }
.celda-boton[data-accion="quitar"]{ grid-area: qui; border-color: var(--grey-mid); }
.celda-boton[data-accion="quitar"]:hover:not(:disabled){ background: var(--grey-mid); color: var(--yellow); }

/* De que lado caeria la foto al soltarla. En la lista la marca es horizontal
   porque es vertical; aqui es al reves. Sombra interior amarilla, que sobre
   la celda negra se ve. */
.celda--marca-antes{ box-shadow: inset 3px 0 0 var(--yellow); }
.celda--marca-despues{ box-shadow: inset -3px 0 0 var(--yellow); }

/* La unica animacion de esta pantalla. La apaga la regla de movimiento
   reducido de mas abajo, que es global: un parpadeo al arrastrar treinta
   fotos es justo lo que molesta a quien la tiene puesta. */
.celda--arrastrando{ opacity: .4; transition: opacity .12s; }
```

Y en la regla `.fila :focus-visible{ outline-color: var(--yellow); }`, ampliar el selector:

```css
.fila :focus-visible,
.celda :focus-visible{
  outline-color: var(--yellow);
}
```

- [ ] **Paso 2: El teléfono**

Justo ANTES de `@media (prefers-reduced-motion: reduce){`, añadir:

```css
/* ============================================================
   EL TELÉFONO — Lidia sube desde el ordenador y retoca desde el
   móvil: reordenar, cambiar la portada, quitar una.
============================================================ */
@media (max-width: 600px){
  .panel{ padding: 1.5rem 1rem 4rem; }
  .ficha{ grid-template-columns: 1fr; }
  /* Dos columnas a 375px son celdas de ~160px, donde caben «Portada» y
     «Quitar» uno al lado del otro a 44px de alto. */
  .fotos{ grid-template-columns: repeat(2, 1fr); }
  /* Que la barra no quede bajo la barra de gestos del sistema. */
  .proyecto-barra{ padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)); }
}
```

- [ ] **Paso 3: La suite sigue igual**

Esperado: **672 pasan, 0 fallan**.

- [ ] **Paso 4: Comprobar en el navegador**

Lo hace el controlador, con la misma inyección de `la-boquerona`, a 1100px y a 375px:
- celdas negras, la portada con anillo doble y etiqueta; ‹ n/N › en la primera fila y Portada/Quitar en la segunda, todos de 44px o más (`getBoundingClientRect().height >= 44` en los cuatro);
- a 375px, dos columnas y ninguna celda desborda (`scrollWidth === clientWidth` en `#pFotos`);
- la barra no tapa la última fila al llegar abajo (desplazar al final y comprobar que el último `li` queda por encima del `top` de la barra);
- el anillo de foco amarillo al tabular por los botones de una celda.

- [ ] **Paso 5: Commit**

```bash
git add panel/css/panel.css
git commit -m "La rejilla de fotos: celdas negras, botones de 44px y dos columnas en el telefono"
```

---

## Tarea 5: Lo que hay que dejar escrito

**Ficheros:**
- Modificar: `docs/estado-conocido.md`

- [ ] **Paso 1: Medir**

```bash
wc -l panel/js/panel.js panel/js/fotos.js js/movil-visor.js
```

Los dos primeros tienen que estar por debajo de 300. El tercero es de la rama anterior y hoy el documento dice **428** donde el fichero tiene **463**: se corrige de paso, con el número medido.

- [ ] **Paso 2: Contar**

La suite: se esperan **672 pasan, 0 fallan**.

- [ ] **Paso 3: Escribir**

Tres cosas, en el tono del documento:

**a)** Una sección nueva, después de la del botón de ficha y la tira:

```
## La pantalla del proyecto, vestida (bloque de la pantalla del proyecto)

**La pantalla de un proyecto del panel existe desde el bloque 3c y hace todo lo
que el spec pedía; hasta este bloque no tenía diseño.** El formulario de la
ficha no tenía ni una regla de CSS —sólo las tenía el de crear—, la portada se
marcaba con un borde amarillo sobre una página amarilla, y desde dentro de un
proyecto no había botón de guardar: había que volver a la lista.

**Ahora hay dos botones de guardar y son el mismo `guardar()`.** `#guardar` en
la lista y `#pGuardar` en la barra fija al pie de la pantalla del proyecto, y
`panel.js` los apaga y los enciende a la vez con `guardarActivo` —al arrancar y
tras un conflicto de versiones—. Quien añada un tercer camino que toque
`disabled` en uno de ellos tiene que pasar por esa función.

**El aviso de la pantalla del proyecto (`#pAviso`) vive en esa barra**, no en la
cabecera: en un teléfono, mientras se ordena la rejilla, arriba no se veía.

**La celda de la rejilla es una rejilla de cuatro columnas** (`44px 1fr 1fr
44px`) repartida por `grid-template-areas` según el `data-accion` de cada
botón. Los cuatro botones siguen siendo hijos directos del `<li>`, que es lo
que pulsan las pruebas. Quien añada un quinto control tiene que darle su área.

**El `<input type="file">` está oculto a la vista y NO al tabulador.** Se
esconde con el patrón de «visualmente oculto» (`.visualmente-oculto`) y la
etiqueta hace de botón; `display:none` lo sacaría del recorrido con Tab y la
subida dejaría de existir sin ratón, que es el criterio de aceptación 6.

**Los botones de la celda miden 44px en todas las anchuras**, no sólo en el
teléfono. Lidia sube desde el ordenador y retoca desde el móvil, y el arrastre
nativo (`draggable`) que usa `fotos.js` no funciona con el dedo: en el teléfono
‹ › no son el atajo, son el único camino. El arrastre táctil propio se
descartó a propósito (spec, «Lo que este bloque NO hace»).

### Lo que la suite no puede certificar de este bloque

`tests/test.html` no carga `panel/css/panel.css`. Comprobado por el controlador
en un navegador de escritorio con el viewport emulado a 1100 y a 375px, con las
diez fotos de `la-boquerona` inyectadas; lo que sólo puede juzgar quien lo abra
en producción, y va a la misma lista que dejó el bloque 3c (su Tarea 9):

1. Que la barra fija no tape la última fila de fotos al llegar abajo.
2. Que en un teléfono de verdad quepan dos columnas con los cuatro botones
   pulsables sin acertar de milagro.
3. Que la portada se distinga a un golpe de vista, con fotos claras y oscuras.
4. Que la zona de soltar se entienda como tal sin leerla.
5. Que el foco con Tab se vea en cada botón de la celda negra.
```

**b)** Una sección para los bloques 3c y 3d, que el PR #13 fusionó sin escribir nada aquí. Corta, apuntando a sus planes, y con lo que no se deduce del código:

```
## El panel tiene tres pantallas (bloques 3c y 3d)

**Desde el PR #13 (2026-09-11) el panel tiene tres pantallas y no una:** la
lista de proyectos (bloque 3b), la pantalla de un proyecto (3c) y la de
publicar (3d). Cuál se ve lo decide `panel/js/rutas.js` a partir del fragmento
(`#/proyecto/<id>`, `#/publicar`), y `panel/js/pantallas.js` esconde las
otras con `hidden`. Los planes están en
`docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md` y
`…-panel-publicar-bloque-3d.md`, y los dos anotan al final lo que salió
distinto al ejecutarlos.

**Las pruebas del panel llevan su propia copia del marcado** (la constante
`HTML` de `tests/pruebas-panel.js`), con sólo los `id`. Un nodo nuevo que
`panel.js` busque al arrancar va en DOS sitios, `panel/index.html` y esa
copia; sin el segundo, la sección entera del panel cae en el iframe. La suite
en verde no demuestra que `panel/index.html` tenga el nodo.

**Las dos comprobaciones manuales en producción siguen pendientes:** la Tarea 9
del plan 3c (16 puntos: subir 40 MB, girar, teclado, portada…) y la Tarea 5 del
3d (publicar). Son de Ángel.
```

**c)** En la sección «Estructura», donde dice `js/movil-visor.js`: 428, poner el número medido en el Paso 1. Y en «Cómo se prueba», la cuenta pasa a la del Paso 2, nombrando que este bloque añadió 4.

- [ ] **Paso 4: Commit**

```bash
git add docs/estado-conocido.md
git commit -m "Estado conocido: la pantalla del proyecto vestida, y los bloques 3c y 3d que faltaban"
```
