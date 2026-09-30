# La corona de fotos de la esfera — plan

**Spec:** `docs/superpowers/specs/2026-09-30-esfera-corona-design.md`.
Ejecución directa en la sesión, con TDD en cada tarea, igual que el plan de la
esfera (`docs/superpowers/plans/2026-09-29-esfera-movil.md`), de cuyas
restricciones globales hereda todo: español, sin dependencias, orden de
`<script>` en `index.html` y `tests/test.html`, escritorio intacto, suite entera
en verde al cerrar cada tarea (servida sin caché desde el worktree, en pestaña
nueva).

## Tarea 1 — `MovilCorona.colocar`

- Crear `js/movil-corona.js` y `tests/pruebas-movil-corona.js`; cargarlos en
  `tests/test.html` antes de `movil-globo.js` / sus pruebas.
- Pruebas primero (rojo): n = 0 da `fotos: []`; n = 1, 5, 10 a 390×844 y
  320×568 caben en pantalla con 16 px de margen; ninguna foto se cruza con la
  portada encogida ni con su vecina (a 390×844); la primera tiene `y` menor que
  la de la portada y `x` igual a su centro; la portada encogida mide el 70 %.
- Implementación: portada ×0,7; foto de ancho `clamp(0,4 × portada.ancho, 48,
  84)` y alto ×1,25; cada centro en la dirección de su ángulo `−π/2 + 2πk/n`,
  en el borde de la portada ampliada (`portada/2 + 14 + foto/2`); centro
  acotado a la pantalla con el margen. (Una elipse pisaba las esquinas.)

## Tarea 2 — La corona en `MovilGlobo`

- Pruebas primero: las de la spec, sección «Pruebas», para `MovilGlobo`. Las
  pruebas existentes que esperaban que un toque en la de delante abriera el
  visor pasan a esperar la corona abierta. `alAbrir` en `conGlobo` apunta
  `id` o `id/pieza`. El juego de proyectos de prueba gana `piezas`.
- Implementación: capa `.esfera-corona` (hermana de la lista) con un botón
  `.esfera-foto[data-pieza]` por pieza; estado `abierta`; `abrirCorona` /
  `cerrarCorona(animar)`; reparto de toques en `pointerup` y en el clic de
  teclado; cierre en `pointermove` al empezar a arrastrar, en rueda, flechas,
  Escape, `reconstruir` y `aplicar` de un proyecto; `esAjeno` no cuenta la
  capa de la corona como ajena.

## Tarea 3 — CSS, arranque y comprobación

- `css/luque.css`: capa (z-index 2500, entre teselas y pie), fotos, transición
  con retardo por `--i`, `.esfera.con-corona` que apaga el resto, sin
  transiciones con `prefers-reduced-motion`.
- `index.html`: `<script src="js/movil-corona.js">` antes de `movil-globo.js`;
  `alAbrir: function (id, pieza) { Router.ir('proyecto', id, pieza); }`.
- Suite en verde; mirar en el panel a 375×812: abrir la corona, tocar una
  foto, volver, cerrar tocando el fondo y arrastrando.
