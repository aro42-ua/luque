# Categorías en la esfera móvil — plan

**Spec:** `docs/superpowers/specs/2026-10-08-esfera-categorias-design.md`.
Ejecución directa con TDD en cada tarea (prueba que falla, código, suite entera
en verde servida sin caché en pestaña nueva) y revisión independiente al final.
Hereda las restricciones de siempre: español, sin dependencias, mismo orden de
`<script>` en `index.html` y `tests/test.html`, escritorio intacto.

## Tarea 1 — `MovilModos`

- `js/movil-modos.js` + `tests/pruebas-movil-modos.js`, cargados antes de
  `movil-globo.js`.
- `destino(offset, v, centros, mitad)`: proyecta `offset + v·150` y devuelve
  el índice cuyo centro queda más cerca de `mitad`.
- `crear(nav, categorias, opciones)`: pinta una pista con un botón por
  categoría; `poner(id, animado)` centra y marca con `aria-pressed`; arrastre
  con el dedo y encaje con transición CSS de 320 ms; tocar elige; flechas.
  `opciones.alElegir(id)` sólo cuando cambia.

## Tarea 2 — La absorción en `MovilGlobo`

- `opciones.animar` inyectable (por omisión, Web Animations API con retardo y
  `fill:'both'`); `reconstruir(cat, animado)` apunta los estilos de antes,
  reparte, dibuja y anima salidas, permanencias y entradas; bloquea gestos
  mientras dura; anuncia al terminar; reducido = fundido.
- `aplicar` reconstruye animado salvo la primera vez.

## Tarea 3 — El selector en la esfera

- `nodos.modos` y `nodos.categorias`: se crea el selector; `aplicar` lo pone;
  `esAjeno` y el teclado ignoran el selector. Marcado y CSS en `index.html` y
  `css/luque.css`; las categorías salen de `a[data-cat]` de la barra.
- Comprobación en el panel a 375×812 y anotación en `docs/estado-conocido.md`
  y `docs/comprobaciones-en-produccion.md`.

## Tarea 4 — Revisión final

- Revisor independiente de la rama; arreglos con prueba que falla primero.
