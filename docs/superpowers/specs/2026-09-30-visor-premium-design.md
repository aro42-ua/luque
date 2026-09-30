# El visor móvil premium y la cascada de la corona — diseño

Fecha: 2026-09-30. Rama: `claude/visor-premium`. Sigue a
`docs/superpowers/specs/2026-09-29-esfera-movil-design.md` y
`docs/superpowers/specs/2026-09-30-esfera-corona-design.md`.

## Qué se busca

Ángel encuentra el visor móvil «muy rudimentario» y quiere uno «mucho más
fluido y que dé sensación premium»; y que las fotos de la corona salgan «en
cascada, no a la vez». Criterios de movimiento tomados de la skill
`impeccable` (modo *animate*): el movimiento explica estado y relación; un solo
momento principal cuidado; salidas más rápidas que entradas; deceleración
natural (`cubic-bezier(0.16, 1, 0.3, 1)`), sin rebotes; sólo `transform` y
`opacity` en lo que se mueve a cada fotograma; camino propio para
`prefers-reduced-motion`; nada de librerías (el proyecto no tiene
dependencias).

**Decidido por Ángel (2026-09-30):**

- **Carrusel de un solo trabajo.** El visor recorre las fotos del trabajo
  abierto; para cambiar de trabajo se vuelve a la esfera. Desaparece el eje
  horizontal entre trabajos.
- **Fondo negro**, tipo sala de cine; el amarillo queda para los controles.
- **Controles mínimos que se esconden**: arriba título y ×; abajo una línea de
  progreso y `03 / 10`. Sin tira de miniaturas.

## 1. La cascada de la corona

- Cada foto tarda **480 ms** con `cubic-bezier(0.16, 1, 0.3, 1)` y arranca
  **45 ms** después de la anterior (con 10 fotos, la cascada entera cabe en
  menos de un segundo). Al cerrar vuelven en orden **inverso** en 260 ms, con
  25 ms entre una y otra.
- Salen **de detrás** de la portada: la capa de la corona pasa a estar justo
  por debajo de la portada abierta en el orden de pintado, y por encima del
  resto de la esfera.

## 2. El visor: comportamiento

- **Carrusel.** La foto sigue al dedo en horizontal; la anterior y la siguiente
  están colocadas a los lados y asoman al arrastrar. Al soltar decide la
  distancia (más de un 30 % del ancho) o la velocidad (más de 0,45 px/ms): pasa
  a la vecina o vuelve. En la primera y la última, el arrastre se resiste
  (factor 0,35).
- **Deslizar hacia abajo** cierra: la foto sigue al dedo, encoge hasta un 75 %
  y el negro se transparenta. Suelta pasado un 15 % del alto (o con 0,5 px/ms
  hacia abajo) y se cierra; si no, vuelve.
- **Deslizar hacia arriba** sube la ficha (título, cliente, año, papel, fotos y
  el botón de la plataforma cuando lo hay) como un panel desde abajo;
  `#/trabajo/ficha` la abre directamente. Bajarla, tocar fuera de ella o su
  botón la cierran y vuelven a la foto que había.
- **Un toque** muestra u oculta los controles; **dos toques** amplían al 2,5×
  (o al máximo de la foto, si es menor) en el punto tocado, y dos toques más
  vuelven al encaje. **El pellizco** sigue como hoy (`MovilZoom`). Ampliada, un
  dedo pasea la foto y no mueve el carrusel.
- Un botón **Ficha** discreto junto al contador, para quien no descubra el
  gesto y para el teclado.
- **Teclado:** flechas izquierda/derecha pasan de foto, flecha arriba abre la
  ficha, Escape cierra (primero la ficha si está abierta), Tab queda atrapado
  en el diálogo (`VisorFoco`).
- **Rutas sin cambios:** `#/trabajo/n`, `#/trabajo/ficha`; Atrás del navegador
  funciona igual. Un trabajo sin fotos abre directamente la ficha.
- **La corona sigue abierta detrás del visor** si es del mismo trabajo, para que
  la foto pueda volver a su hueco al cerrar. Abrir el visor de otro trabajo (un
  enlace) sí la cierra.

## 3. El visor: aspecto y movimiento

- **Momento principal: la foto que crece.** Al abrir, la foto sale del
  rectángulo de lo que se tocó (la foto de la corona, o la portada) y crece
  hasta su sitio mientras el fondo pasa de transparente a negro: **420 ms**,
  `cubic-bezier(0.16, 1, 0.3, 1)`. Al cerrar, el camino inverso hacia la foto
  de la corona que corresponde a la que se está viendo (o la portada), en
  **300 ms**.
- **Carga:** se pinta al instante la miniatura (ya descargada por la corona),
  ligeramente desenfocada; la foto de 1500 entra con un fundido de 250 ms al
  llegar. Se piden por adelantado la anterior y la siguiente.
- **Pasar de foto:** la pista se anima desde donde la dejó el dedo hasta su
  sitio con la misma curva, en un tiempo que depende de lo que falta y de la
  velocidad (entre 180 y 380 ms). Interrumpible: un dedo nuevo la para donde
  esté.
- **Controles:** tipografía de la casa sobre negro; título a la izquierda, ×
  amarilla a la derecha; abajo, línea de progreso amarilla de 2 px y
  `03 / 10`. Aparecen con la foto y se desvanecen (200 ms) a los 2,5 s sin
  tocar; vuelven con un toque o con el foco del teclado.
- **Movimiento reducido:** la foto sigue al dedo (es manipulación directa),
  pero al soltar salta a su sitio; la foto que crece se sustituye por un
  fundido de 150 ms; la cascada de la corona aparece sin desplazamiento.

## Arquitectura

- **`js/movil-carrusel.js` (`window.MovilCarrusel`), puro:** `eje(dx, dy)`,
  `arrastre(dx, ancho, indice, total)`, `destino(dx, v, ancho, indice,
  total)`, `duracion(distancia, v)`, `cierre(dy, alto)`,
  `seCierra(dy, v, alto)`, `ficha(dy, alto)`, `seAbreFicha(dy, v, alto)`,
  `dobleToque(p, centro, escala)` (el estado de zoom que deja fijo el punto
  tocado).
- **`js/movil-visor.js` reescrito** (misma API pública: `init(refs,
  proyectos)`, `aplicar(ruta)`, `estado()`), con el marcado nuevo de
  `#movilVisor`. Las animaciones, con la Web Animations API; la función de
  animar se inyecta para que las pruebas no dependan del reloj.
- **`js/movil-globo.js`:** `origenDe(id, pieza)` (la foto de la corona si está
  abierta para ese trabajo, si no la portada) y la corona que sobrevive al
  visor del mismo trabajo.
- **Se conservan:** `MovilZoom`, `MovilFicha` (el contenido de la ficha),
  `MovilRecorrido` (sólo su `desdeRuta`), `VisorFoco`, y todo el escritorio.
- **Se retiran**, con sus pruebas: `MovilHud`, `MovilTira`, `MovilFlechas`,
  `MovilCartel`, `MovilAnimacion` y `MovilGestos`.

## Pruebas

- `MovilCarrusel`: todas sus funciones con números, incluidos los extremos
  (primera, última, un trabajo de una foto) y las velocidades.
- `MovilVisor`: abre y cierra por la ruta; pinta la foto de la pieza con su
  vecina a cada lado; contador y progreso; el carrusel pasa de foto y la ruta
  cambia; en el extremo no pasa; deslizar abajo cierra y poco no; arriba abre
  la ficha; toque alterna los controles; doble toque amplía en el punto;
  ampliada no pasa de foto; teclado (flechas, Escape, Tab atrapado); trabajo
  sin fotos abre la ficha; el foco vuelve al cerrar.
- `MovilGlobo`: `origenDe`; la corona sigue abierta con el visor del mismo
  trabajo y se cierra con el de otro.
- Panel del navegador a 375×812; lo demás (fluidez real, fotos reales),
  desplegado.
