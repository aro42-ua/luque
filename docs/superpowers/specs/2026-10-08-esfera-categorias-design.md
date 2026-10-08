# Categorías en la esfera móvil — diseño

Fecha: 2026-10-08. Rama: `claude/esfera-categorias`. Sigue a
`docs/superpowers/specs/2026-09-29-esfera-movil-design.md`.

## Qué se busca

Ángel quiere elegir categoría en el móvil, y que al hacerlo **los trabajos que
no pertenecen sean «absorbidos» hacia el centro de la esfera** mientras **los
que pertenecen se reubican** en ella. Hoy la ruta `#/editorial`… ya filtra la
esfera, pero de golpe y sin ningún control en el móvil que la pida. Con el
contenido de octubre hay doce trabajos: editorial 4, videoclip 5, foto stills
2, cortometraje 1.

**Decidido por Ángel (2026-10-08):**

- **Selector de modos**, como el de la cámara: una fila de categorías bajo el
  pie que se desliza de lado y encaja; la centrada es la activa.
- **Absorbe al encajar**: la animación arranca cuando el selector se asienta
  en una categoría, no siguiendo al dedo.

## El selector

- Bajo el título y la meta del pie: «Todo» y las categorías en el orden de la
  barra de escritorio (Editorial, Videoclip, Cortometraje, Foto Stills), con
  sus nombres. Las categorías sin trabajos no aparecen.
- Una marca fija en el centro —raya negra corta— y la fila desliza por debajo.
  La activa, negro en negrita; las demás, negro al 45 %, fundiéndose hacia los
  bordes. Sin mayúsculas forzadas.
- Se arrastra con el dedo (lo mueve el JS: la esfera lleva
  `touch-action:pinch-zoom` y dentro no hay desplazamiento nativo); al soltar
  encaja en la más cercana a la marca, proyectando la velocidad para que un
  golpe llegue más lejos. Tocar una categoría la lleva a la marca.
- Al encajar en otra categoría navega (`Router.ir('categoria', id)`, o
  `'todos'`); manda la ruta, y un enlace a `#/videoclip` deja el selector en
  Videoclip.
- Es una navegación de botones con `aria-pressed`; con el foco dentro, las
  flechas izquierda/derecha cambian de categoría. Un gesto o una tecla que
  empiezan en el selector no giran la esfera.

## La absorción

Cuando la ruta cambia de categoría con la esfera ya pintada:

- **Las que salen** encogen al 10 % y viajan hasta el nudo, fundiéndose en el
  amarillo; su rama se recoge hacia el nudo. 450 ms,
  `cubic-bezier(0.5, 0, 0.75, 0)` (acelera hacia dentro).
- **Las que se quedan** van de su sitio viejo al nuevo reparto. 600 ms,
  `cubic-bezier(0.16, 1, 0.3, 1)`, con 120 ms de retardo.
- **Las que entran** (al volver a «Todo» o cambiar de categoría) salen del nudo
  hasta su sitio, 600 ms con la misma curva, 150 ms de retardo más 30 ms por
  cada una.
- La corona, si estaba abierta, se cierra antes. Mientras dura, la esfera no
  atiende gestos. El pie se actualiza al terminar.
- Con `prefers-reduced-motion`, un fundido de 150 ms. La primera vez que se
  pinta (carga con un enlace ya filtrado), sin animación.

## Arquitectura

- **`js/movil-modos.js` (`window.MovilModos`)**: lo puro —`destino(offset, v,
  centros, mitad)`, en qué categoría encaja— y el selector en el DOM:
  `crear(nav, categorias, opciones)` → `{ poner(id, animado) }`, con
  `opciones.alElegir(id)`.
- **`js/movil-globo.js`**: `reconstruir(cat, animado)` con la absorción (la
  función de animar inyectable, como en el visor); el selector se crea si llega
  `nodos.modos`; `esAjeno` y el teclado ignoran lo que empieza en el selector;
  `aplicar` coloca el selector.
- **`index.html`**: el `<nav>` del selector dentro de `.esfera`, y las
  categorías leídas de la barra de escritorio (`a[data-cat]`).

## Pruebas

- `MovilModos.destino`: la más cercana, la velocidad que lleva más lejos, los
  extremos.
- El selector: pinta «Todo» y las categorías con trabajos; `poner` marca la
  activa; tocar una llama a `alElegir`; arrastrar y soltar encaja.
- La esfera: al cambiar de categoría, las que salen se animan hacia el centro y
  se esconden al acabar, las que se quedan van del sitio viejo al nuevo, las
  que entran salen del centro; reducido es un fundido; un gesto en el selector
  no gira la esfera; la ruta pone el selector.
