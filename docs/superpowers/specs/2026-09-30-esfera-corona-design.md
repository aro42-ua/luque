# La corona de fotos de la esfera — diseño

Fecha: 2026-09-30. Rama: `claude/esfera-corona`. Parte de
`docs/superpowers/specs/2026-09-29-esfera-movil-design.md`.

## Qué se busca

Ángel quiere que, al tocar una portada de la esfera, **las fotos de ese trabajo
salgan de detrás de la portada y se coloquen a su alrededor**, y que tocar
cualquiera de ellas lleve al visor en esa foto.

**Lo que decidió Ángel (2026-09-30):**

- **Corona plana:** las fotos en un círculo alrededor de la portada, todas del
  mismo tamaño, sin 3D.
- **Se cierra** tocando el fondo o empezando a girar la esfera (el gesto que la
  cierra sigue girándola). No se engancha al botón Atrás.
- **Tocar la portada** con la corona abierta abre el visor en la foto 1.

## Comportamiento

- Tocar la portada **de delante** abre la corona; ya no abre el visor.
- Tocar una foto de la corona abre `#/<proyecto>/<n>`.
- Tocar la portada con la corona abierta abre `#/<proyecto>/1`.
- Tocar el fondo, u otra portada, cierra la corona.
- Empezar a arrastrar la cierra y la esfera sigue el dedo en el mismo gesto; la
  rueda y las flechas también la cierran antes de girar.
- Tocar una portada lateral con la corona cerrada la sigue trayendo delante.
- Un trabajo **sin fotos** no tiene corona: tocar su portada abre el visor como
  antes.
- La corona se cierra, sin animar, al filtrar por categoría y al abrirse el
  visor por la ruta; al volver del visor está cerrada.
- Teclado: las fotos son botones «Abrir la foto *n* de *Título*», en el orden
  de la corona; Intro sobre la portada de delante abre la corona y enfoca la
  primera foto; Escape la cierra y devuelve el foco a la portada.

## Aspecto

- Al abrirse, la portada encoge al **70 %** y las demás portadas y ramas se
  apagan más hacia el amarillo, para que mande el trabajo abierto.
- Las fotos son las miniaturas de 250, en **4:5**, de un ancho del orden del
  40 % de la portada encogida (entre 48 y 84 px). Se colocan en una **elipse**
  alrededor de la portada encogida, empezando **arriba** y en el sentido de las
  agujas del reloj, sin salirse de la pantalla (margen 16 px). Sin marco ni
  sombra, como las teselas.
- **Movimiento:** cada foto sale del centro de la portada, pequeña (30 %) y
  transparente, hasta su sitio en 320 ms, con 20 ms de escalonado entre una y
  la siguiente; al cerrar hacen el camino inverso. Con
  `prefers-reduced-motion`, sin transiciones.

## Arquitectura

- **`js/movil-corona.js` (`window.MovilCorona`), puro.**
  `colocar(n, portada, medidas)` → `{ portada: {x, y, ancho, alto},
  fotos: [{x, y, ancho, alto}] }`. `portada` es el rectángulo de la portada de
  delante en reposo (centro y medidas); devuelve el de la portada encogida y el
  de cada foto (centro y medidas).
- **`js/movil-globo.js`:** guarda qué trabajo tiene la corona abierta; pinta las
  fotos en una capa `.esfera-corona` por encima de las teselas y por debajo del
  pie; reparte los toques. `alAbrir(id)` pasa a `alAbrir(id, pieza)`.
- **`index.html`:** `alAbrir` llama a `Router.ir('proyecto', id, pieza)`; carga
  `js/movil-corona.js` antes de `js/movil-globo.js` (y lo mismo en
  `tests/test.html`).
- **`css/luque.css`:** la capa, las fotos, sus transiciones y el apagado del
  resto.

## Pruebas

- `MovilCorona`: n = 0, 1, 5, 10; ninguna foto sale de la pantalla (también en
  320×568); ninguna pisa la portada encogida ni a su vecina; la primera va
  arriba y centrada.
- `MovilGlobo`: el primer toque abre la corona y no el visor; hay una foto por
  pieza con su etiqueta; tocar una foto abre esa pieza; tocar la portada abre
  la 1; tocar el fondo la cierra; arrastrar la cierra y gira; Escape la cierra
  y devuelve el foco; Intro sobre una foto la abre; filtrar y abrir por ruta la
  cierran; un trabajo sin fotos abre el visor directamente.
- En el panel del navegador a 375×812. Cómo se ven las fotos reales, sólo
  desplegado.
