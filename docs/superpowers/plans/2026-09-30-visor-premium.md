# El visor móvil premium y la cascada de la corona — plan

**Spec:** `docs/superpowers/specs/2026-09-30-visor-premium-design.md`.

Ejecución directa en esta sesión con TDD en cada tarea (prueba que falla, código,
suite entera en verde servida sin caché desde el worktree en pestaña nueva) y
una revisión independiente de la rama entera al final. Hereda las restricciones
del plan de la esfera (`docs/superpowers/plans/2026-09-29-esfera-movil.md`):
español, sin dependencias, orden de `<script>` igual en `index.html` y
`tests/test.html`, escritorio intacto.

## Tarea 1 — La cascada de la corona

- `css/luque.css`: `.esfera-foto` a 480 ms con `cubic-bezier(0.16,1,0.3,1)` y
  retardo `--i × 45 ms`; `.esfera-foto.saliendo` a 260 ms con retardo
  `(total − 1 − i) × 25 ms` (variable `--j` que pone el JS).
- `js/movil-globo.js`: `CORONA_MS`/`CORONA_PASO` a juego; `--j` al cerrar; la
  capa de la corona con `z-index` justo por debajo de la portada abierta (el
  JS lo escribe: `2·z` de la portada) para que las fotos salgan de detrás.
- Pruebas: `--j` inverso al cerrar; el `z-index` de la capa queda por debajo
  del de la portada abierta y por encima del de la siguiente tesela.

## Tarea 2 — `MovilCarrusel`

- `js/movil-carrusel.js` + `tests/pruebas-movil-carrusel.js`, cargados antes de
  `movil-visor.js`.
- Constantes: umbral de eje 10 px; paso 30 % del ancho o 0,45 px/ms;
  resistencia 0,35; cierre 15 % del alto o 0,5 px/ms, escala mínima 0,75;
  ficha 20 % del alto o 0,5 px/ms; duración 180–380 ms; doble toque 2,5×.

## Tarea 3 — `MovilGlobo` para el visor

- `origenDe(id, pieza)`; `aplicar` de un proyecto ya no cierra la corona si es
  del mismo trabajo. Pruebas: las de la spec; la de «abrir un proyecto por la
  ruta la cierra» pasa a hacerlo sólo con otro trabajo.

## Tarea 4 — El visor: estructura, ruta, controles, ficha y teclado

- Marcado nuevo de `#movilVisor` en `index.html` (fondo, pista, panel de ficha,
  controles) y su CSS; `js/movil-visor.js` reescrito sin gestos todavía:
  `aplicar` abre/cierra/pinta, tres diapositivas (anterior, actual,
  siguiente), carga con previa desenfocada y relevo, precarga de vecinas,
  contador y progreso, controles que se duermen, panel de ficha, teclado y
  foco. `refs` nuevas en `index.html`.
- `tests/pruebas-movil-visor.js` reescrito para el visor nuevo.
- Se retiran `movil-hud`, `movil-tira`, `movil-flechas`, `movil-cartel`,
  `movil-animacion`, `movil-gestos`, sus pruebas, sus `<script>` y su CSS; y
  `tests/pruebas-movil-visor-zoom.js` (el pellizco se prueba en la tarea 5).

## Tarea 5 — El visor: gestos

- Arrastre del carrusel con la pista siguiendo al dedo; al soltar, animación
  hasta la vecina (y cambio de ruta al terminar) o de vuelta; resistencia en
  los extremos; deslizar abajo para cerrar; arriba para la ficha; toque y
  doble toque; pellizco y paseo con `MovilZoom`; un dedo nuevo interrumpe la
  animación en curso. La función de animar inyectable (`opciones.animar`) para
  que las pruebas terminen al instante.

## Tarea 6 — Transiciones y acabado

- La foto que crece al abrir y vuelve al cerrar (`MovilGlobo.origenDe`), el
  fondo a negro, el camino de movimiento reducido; comprobar a 375×812 en el
  panel.
- Anotar en `docs/estado-conocido.md` (visor nuevo, módulos retirados) y en
  `docs/comprobaciones-en-produccion.md` (lo que sólo se ve en un teléfono).

## Tarea 7 — Revisión final

- Un revisor independiente sobre la rama entera; arreglos de lo que encuentre
  con prueba que falla primero.
