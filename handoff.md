# Handoff — LUQUE! panel, bloques 3c y 3d

Escrito el 2026-09-11 al cerrar una sesión por tamaño de contexto. Pégalo
entero en la siguiente sesión con cualquier asistente.

---

## Contexto

Repositorio: la web de fotografía `lidialuque.com` (Lidia Luque). El trabajo
va en el **worktree**
`C:\Users\angel\OneDrive\Documentos\LIDIA\LIDIA\luque\.claude\worktrees\bloques-3c-3d-6acff7`,
rama `claude/bloques-3c-3d-6acff7`, creada desde `main` en `8980c04`. Todos los
comandos desde ahí; no hagas `cd` al repositorio principal. No uses `git
stash` a secas (la pila es compartida entre worktrees).

Usuario: Ángel (pronombre neutro si hace falta). Habla en **castellano**.
Comentarios, textos de interfaz y mensajes de commit en castellano, con la voz
del repositorio: razonada, con el porqué, sin adornos.

**Objetivo:** implementar los bloques **3c** (la pantalla de un proyecto:
ficha, subir fotos reducidas en el navegador, ordenarlas, elegir portada,
quitar) y **3d** (la pantalla de publicar: qué cambia respecto a la web, qué
falta, y el botón) del panel de administración. Especificación:
`docs/superpowers/specs/2026-08-17-panel-contenido-design.md`. Contexto
imprescindible: `docs/estado-conocido.md` (sección «Cada foto se guarda en
tres medidas» y «Cómo se prueba») y los planes previos
`docs/superpowers/plans/2026-08-19-worker-acceso-bloque-3a.md` y
`2026-08-25-panel-lista-bloque-3b.md`.

## Estado real del worktree (comprobado con `git status`)

- **Sin commitear, únicos cambios:** dos planes nuevos y completos, con el
  código de cada tarea:
  - `docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md` (2892
    líneas, 10 tareas).
  - `docs/superpowers/plans/2026-09-11-panel-publicar-bloque-3d.md` (1182
    líneas, 6 tareas; **depende del 3c ejecutado entero**).
  Los dos están ya repasados (recuentos de pruebas corregidos, una aserción
  falsa corregida, una línea con `.sort()` corregida).
- **Ningún código del panel se ha tocado todavía.** `panel/js/` sigue con los
  cinco módulos del 3b: `borrador.js`, `identificador.js`, `lista.js`,
  `orden.js`, `panel.js`.
- **Pendiente y denegado una vez:** 4 pruebas del Worker fallan **ya en
  `main`** (`worker/test/publicar.test.js`: «un borrador valido no da
  problemas», «publicar copia el borrador válido…», «POST /api/publicar con un
  borrador válido da 200…», «un borrador guardado con la versión como cadena
  se puede publicar»). Causa: el bloque del contenido real hizo obligatorios
  `ficha.anio` y `ficha.papel` en `js/reglas-contenido.js`, y las 11 fixtures
  del Worker con `tipo: 'fotos', portada: 'p.jpg'` no llevan `ficha`, así que
  publicar devuelve 422. Arreglo: añadirles `ficha: { anio: 2025, papel:
  'DoP' }`. **Ángel denegó el `sed -i` que lo hacía**: no lo repitas como
  comando de shell; hazlo con la herramienta de edición de archivos, o
  pregunta si prefiere dejarlo para otra rama. Comprobado que
  `grep -c "ficha: { anio: 2025" worker/test/publicar.test.js` da 0.

## Herramientas y cómo se prueba

- **Node** está en `C:\nvm4w\nodejs` (nvm para Windows, v24.21.0). Las
  terminales no lo ven porque el PATH del sistema lo referencia como
  `%NVM_HOME%` y `%NVM_SYMLINK%` sin resolver: antepón esa carpeta al PATH de
  la sesión (`$env:Path = "C:\nvm4w\nodejs;" + $env:Path` en PowerShell,
  `export PATH="/c/nvm4w/nodejs:$PATH"` en bash). `wrangler` no está.
- `node tests/prueba-borrador.js` → 52/52 en verde (comprobado).
- `cd worker && node --test` → 4 fallos, los de arriba (comprobado).
- Arnés del navegador: `python -m http.server 8000` desde la raíz del
  worktree y abrir `http://localhost:8000/tests/test.html`; ≈468
  comprobaciones en verde antes de este trabajo. Para medir sin ojos: Chrome
  headless con `--virtual-time-budget=15000 --dump-dom`.
- `python tests/auditar_rutas.py` antes de cada commit que toque HTML/CSS/JS.

## Decisiones clave (tomadas y escritas en los planes; no reabrir)

1. **Tres medidas por foto, por el lado largo**: 1500 portada, 3000 pieza,
   250 miniatura, JPEG a calidad 0,82, iguales a
   `herramientas/derivar_imagenes.py`. Reducción en el navegador con
   `createImageBitmap(archivo, {imageOrientation: 'from-image'})` y
   `canvas.toBlob`. Nunca se amplía.
2. **Cada pieza subida guarda su `portada`**: `{url, miniatura, portada}`,
   campo nuevo y aditivo (la galería no lo lee, validar no lo rechaza). Para
   las 65 piezas antiguas, `Edicion.portadaDe` deduce el `-1500` del sufijo
   `-3000`. Marcar portada = copiar la `portada` de la pieza a
   `proyecto.portada`.
3. **Nombres en R2:** `<id>-<archivo saneado con Identificador.desde>-<sello
   base36 de Date.now()>-<lado>.jpg`. El sello evita el 409 del Worker, que
   rechaza antes que pisar.
4. **Una sola página con tres pantallas** por fragmento: `#/`,
   `#/proyecto/<id>`, `#/publicar` (`panel/js/rutas.js` y `pantallas.js`).
   `window.Panel = {ir(hash), hayCambios()}` como costura para las pruebas;
   `ir` enruta síncrono y recuerda el hash pedido para ignorar el
   `hashchange` duplicado.
5. **El tipo `video`/Vimeo de la spec no se implementa**: desde el contenido
   real el vídeo es `ficha.enlace`; queda para el bloque 4.
6. **Publicar** compara contra `/contenido.json` (ruta pública, sin Access),
   **no publica con cambios sin guardar** (se publica lo guardado en R2),
   pide `confirm` siempre, y un 409 deshabilita el botón igual que en
   Guardar.
7. Módulos nuevos. 3c: `rutas`, `imagenes`, `subida`, `edicion` (puro,
   devuelve copias), `fotos`, `proyecto`, `pantallas`; `lista.js` gana el
   enlace «Editar» y `Lista.enfocar` (mudado desde `panel.js` para que éste
   no pase de 300 líneas). 3d: `cambios` (puro), `publicacion`,
   `pantalla-publicar`; `panel.js` sólo gana seis líneas.
8. Los módulos de red (`subida.js`, `publicacion.js`) se prueban en el arnés
   doblando `fetch` en el iframe de `ArnesDom.conDocumento` (globales antes
   de cargar scripts), no con Node.

## Restricciones que no se negocian

- ES5 estricto y patrón `window.Nombre` en `panel/js/`; **nada supera 300
  líneas** en `js/`, `panel/js/`, `worker/`.
- Todo lo que se arrastra tiene botón equivalente; el panel es operable sin
  ratón; `prefers-reduced-motion`.
- `js/reglas-contenido.js` se carga desde `../js/`, nunca se copia al panel.
- No tocar Access ni el Worker de la API: `POST /api/imagen`, `POST
  /api/publicar?version=N`, `GET/PUT /api/borrador` existen desde el 3a.
- Quitar una foto no borra nada de R2 (spec); no hay `DELETE /api/imagen`.
- **Desplegar lo hace Ángel**, no el asistente: `git archive HEAD | tar -x -C
  <tmp>` y `wrangler deploy --config worker/estatico/wrangler.toml --assets
  <tmp>`. Las comprobaciones manuales están en las tablas de la Tarea 9 del
  3c y la Tarea 5 del 3d.
- Skills: el repo usa `superpowers`. Los planes exigen ejecutarse con
  `superpowers:subagent-driven-development` (recomendada) o
  `superpowers:executing-plans`, tarea a tarea, prueba primero, un commit por
  tarea. Antes de decir «hecho», `superpowers:verification-before-completion`.
- Cierre de cada commit: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Siguiente paso inmediato, en orden

1. Con la herramienta de edición (no `sed`), añadir `ficha: { anio: 2025,
   papel: 'DoP' }` a las 11 fixtures de `worker/test/publicar.test.js`
   (patrón `tipo: 'fotos', portada: 'p.jpg'` → `tipo: 'fotos', ficha: {
   anio: 2025, papel: 'DoP' }, portada: 'p.jpg'`). Correr `cd worker && node
   --test`: todo en verde. Commit: `Poner ficha a las fixtures del Worker,
   que validar exige desde el contenido real`.
2. Commit de los planes: `git add docs/superpowers/plans/2026-09-11-panel-*.md
   handoff.md`, mensaje `Planes de los bloques 3c y 3d del panel`.
3. Invocar `superpowers:subagent-driven-development` y ejecutar el plan del
   **3c** desde la Tarea 1 (rutas) hasta la 10; después el del **3d**. Marcar
   las casillas del plan al pasar cada paso. Las tareas desplegadas se dejan
   a Ángel con su tabla.
