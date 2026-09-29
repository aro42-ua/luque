# La esfera de la portada móvil — diseño

Fecha: 2026-09-29. Rama: `claude/mobile-3d-sphere-gallery-719d99`.

## Qué se busca

Ángel encuentra la portada móvil «demasiado simple»: hoy, al cruzar la puerta
amarilla, aparece una rejilla vertical de trabajos que se recorre con el scroll.
Quiere una galería que **simule 3D**: las portadas colocadas sobre una esfera
que el dedo hace girar, de modo que la que queda delante pasa a primer plano.

**Lo que dijo Ángel** (en la conversación del 2026-09-29):

- Van en la esfera **sólo las portadas**, una por trabajo. Vendrán más trabajos
  pronto, así que la esfera no se rellena con repeticiones ni con fotos
  interiores: se llenará sola a medida que haya más.
- **Esfera libre**: se gira en cualquier dirección, no es un anillo ni un
  tambor.
- Tocar la portada de delante **abre el visor de dos ejes de ahora**, que no
  cambia.
- El **contacto** pasa a ser un botón fijo que abre la hoja amarilla.
- Aprobó el reparto en dos módulos (cálculo puro + cableado), el gesto con
  inercia y asiento, y el aspecto descritos abajo.

**Lo que se supuso y nadie ha corregido:** la puerta amarilla sigue delante,
igual que hoy; el escritorio no se toca; sin librerías ni build, como todo el
sitio.

**Éxito:** la portada móvil se lee como una pieza de estudio y no como una
plantilla, el giro va fluido en un teléfono de gama media, y todo lo que hoy
funciona (visor, filtro por categoría, contacto, volver con el foco donde
estaba) sigue funcionando.

## El recorrido

1. **La puerta**, igual que hoy (`js/movil-puerta.js`). Al levantarla ya no
   descubre la rejilla sino la esfera, sobre negro. El corte del amarillo al
   negro es el único momento orquestado de la entrada; no hay más animaciones
   de aparición.
2. **La esfera** ocupa la pantalla entera, fija y sin scroll. Arranca con el
   trabajo 01 delante.
3. **Tocar la portada de delante** abre `#/proyecto/<id>`, y lo pinta el visor
   de dos ejes (`js/movil-visor.js`), sin cambios en el visor.
4. **Al cerrar el visor** se vuelve a la esfera con el trabajo que estaba
   abierto delante —aunque el visor se haya movido a otro trabajo por el eje
   horizontal— y el foco vuelve a su tesela.
5. **El botón de contacto**, fijo arriba a la derecha, abre `#/contacto`.

## El gesto

- **Arrastrar** con un dedo (o con el ratón, en una ventana de escritorio
  estrechada) gira la esfera siguiendo el dedo: el punto de la esfera que hay
  bajo el dedo se queda bajo el dedo. Cruzar la pantalla de lado a lado gira
  unos 180°.
- **Al soltar** sigue girando con la velocidad que llevaba el dedo, frena por
  rozamiento y, cuando baja de un umbral, **se asienta con un muelle corto** en
  la portada más cercana al centro. Siempre termina con una portada delante.
- **Un toque sin arrastre** (menos de ~8 px de recorrido) sobre la portada de
  delante la abre. Sobre una portada lateral, la **gira hasta delante** sin
  abrirla: así nunca se abre por accidente algo que se veía pequeño y de lado.
- El toque se decide con `pointerdown`/`pointerup` sobre la raíz de la esfera y
  no con `click`: el diagnóstico de la rejilla (`js/diagnostico-toques.js`) se
  escribió justo porque un `down` y un `up` sobre elementos distintos pierden
  el `click`, y una esfera que se mueve bajo el dedo lo provocaría a menudo.
- **Rueda del ratón**: gira en vertical; con mayúsculas, en horizontal.
- **Teclado**: flechas a la portada vecina en esa dirección, Intro o espacio
  abre la de delante, Tab recorre las portadas del hemisferio visible.
- **`prefers-reduced-motion`**: sin inercia ni muelle. Arrastrar sigue
  girando, pero al soltar salta directamente a la portada más cercana, y las
  flechas saltan sin animar.

## La geometría

- **Reparto**: espiral de Fibonacci sobre la esfera unidad, calculada a partir
  del número de trabajos. Con 8 queda abierta; con 20 ya se ve llena. Con un
  solo trabajo, está delante y el arrastre se resiste y vuelve. Con cero, la
  esfera no se pinta y en su lugar dice «Todavía no hay trabajos publicados.»,
  con el botón de contacto visible.
- **Orientación**: un cuaternión. «Traer la portada *k* delante» es la rotación
  de arco mínimo que lleva su punto al eje que mira a la pantalla.
- **Las teselas son siempre derechas**: miran a la pantalla y no giran sobre sí
  mismas, aunque la esfera acumule giro. Una foto boca abajo no se lee.
- **Proyección**: perspectiva simple sobre el radio. Por cada tesela, el
  cálculo devuelve `x`, `y`, `escala`, `luz` (1 delante, ~0,5 en el ecuador,
  ~0,15 detrás), `z` para el orden de pintado, una inclinación pequeña
  (`rotateY`/`rotateX` según su posición) que curva los bordes, y si está
  **en el hemisferio visible**.
- Las teselas del hemisferio de detrás no reciben toques
  (`pointer-events: none`), no están en el tabulador y van con `aria-hidden`.

## El aspecto

Dentro de la identidad que ya tiene el sitio: amarillo `#FFFF00`, negro,
Space Grotesk. Lo atrevido es la esfera; lo que la rodea se queda quieto.

- **Fondo negro** a pantalla completa. Las fotos son lo único con luz.
- **Teselas 4:5**, todas iguales, foto recortada con `object-fit: cover`. Sin
  radio, sin sombra, sin marco: una esfera de formatos distintos se lee como un
  montón, no como una superficie.
- **La profundidad es escala y luz**, no desenfoque: `filter: blur` sobre
  varias imágenes en movimiento es lo que da tirones en un teléfono. La luz se
  aplica como un velo negro por encima de la foto (opacidad), no con
  `filter: brightness`, por el mismo motivo.
- **El pie**, abajo a la izquierda: el título del trabajo de delante en grande
  y, debajo y en pequeño, la categoría y el número (`03/08`), con el mismo
  formato de dos cifras de hoy. Cambia sin animación cuando la esfera se
  asienta: el movimiento ya lo pone el giro. Mientras gira, el pie se queda con
  el último trabajo asentado.
- **El botón de contacto** es la pastilla amarilla del HUD del visor
  (`--pill-bg-yellow`), arriba a la derecha, con el texto «Contacto».
- Si en esta pantalla aparece la marca, es `logo-luque.svg`, nunca la palabra
  escrita.

## Carga de las fotos

`contenido.json` da tres tamaños de cada portada: 250, 1500 y 3000 px.

- Todas las teselas nacen con la de **250** (`miniatura`), que es casi gratis.
- Al cruzar la puerta, la de delante pide la de **1500** (`portadaUrl`) con
  `fetchpriority="high"`.
- Cada tesela cambia a la de 1500 **la primera vez que su luz pasa de ~0,7**,
  es decir, cuando se acerca al frente. No vuelve a bajar.
- La de 3000 no se usa en la esfera.
- **Si una foto falla**, la tesela se queda en gris oscuro (`--grey-dark`) con
  su número encima. Un hueco numerado se lee como «falta esa», no como «la web
  está rota» — la misma regla que tiene hoy la rejilla.

## Categorías

Hoy la rejilla responde a `#/categoria/<nombre>` escondiendo las celdas de las
otras categorías, sin renumerar. **Decisión tomada al escribir esta spec, para
que Ángel la revise:** la esfera hace lo mismo. Las portadas de otras
categorías salen de la esfera, las que quedan se **reparten de nuevo** por toda
la superficie (si no, quedarían islas y medio globo vacío), y **conservan su
número** de la lista completa. Al cambiar de filtro, la esfera se reconstruye
con la primera portada de la categoría delante, sin animar el reparto.

## Accesibilidad

- La esfera es una lista (`<ul>`) de botones, uno por trabajo, con
  `aria-label="Abrir el proyecto <título>"`, igual que hoy la rejilla.
- La portada de delante se anuncia: el pie es una región `aria-live="polite"`
  que cambia al asentarse.
- Foco visible con el mismo contorno que el resto del sitio.

## Arquitectura

Dos módulos nuevos, IIFE colgados de `window`, como el resto:

**`js/movil-esfera.js` — `window.MovilEsfera`.** Puro: sin DOM y sin reloj; el
tiempo entra como argumento, igual que en `MovilArrastre`. Contiene:

- `reparto(n)` → puntos de Fibonacci.
- El estado de orientación (cuaternión) y velocidad, como un valor que entra y
  sale, no como estado de módulo.
- `arrastrar(estado, dx, dy, ancho)`, `soltar(estado, velocidad)`,
  `avanzar(estado, ms)` (inercia, rozamiento, muelle), `traer(estado, k)`.
- `delante(estado, puntos)` → índice de la portada más cercana al frente.
- `proyectar(estado, puntos, medidas)` → por tesela `{x, y, escala, luz, z,
  inclinacion, visible}`.
- `vecina(estado, puntos, direccion)` → para las flechas del teclado.

**`js/movil-globo.js` — `window.MovilGlobo`.** El cableado:

- `pintar(raiz, proyectos, alAbrir)` construye la lista de teselas.
- Engancha puntero, rueda y teclado; mueve `MovilEsfera` con
  `requestAnimationFrame` y sólo mientras hay movimiento (quieta, no gasta
  fotogramas).
- Aplica cada proyección con `transform` en una sola escritura por tesela
  (`translate`, `scale`, `perspective(...) rotateY rotateX`, sin
  `preserve-3d` anidado) y la luz como opacidad del velo.
- Cambia la miniatura por la de 1500 según la luz.
- `filtrarDesdeRuta(ruta)`, con la misma regla que tiene hoy
  `MovilHoja.filtrarDesdeRuta`: `proyecto` y `contacto` no tocan el filtro.
- `elementoDe(id)` → el botón de esa tesela, que es lo que `js/visor-origen.js`
  le pregunta a la portada móvil para volar la foto y para devolver el foco.
- `traer(id)` sin animar, para dejar delante el trabajo que tenía el visor al
  cerrarse.

## Lo que cambia en lo que ya existe

- **`index.html`**: `#hojaRejilla` se sustituye por la raíz de la esfera, el
  pie y el botón de contacto. Los dos `<script>` nuevos van antes de
  `movil-puerta.js`, `movil-esfera.js` antes que `movil-globo.js`, y **en el
  mismo orden relativo en `tests/test.html`**.
- **`js/movil-hoja.js`** y sus pruebas (`tests/pruebas-movil-hoja-*.js`) se
  retiran: toda su razón de ser es la rejilla. `numero()` pasa a
  `MovilEsfera`, que la necesita para el pie y las teselas.
- **`js/movil-puerta.js`**: la puerta descubre la raíz de la esfera donde hoy
  descubre la rejilla (`aria-hidden` y demás).
- **`js/visor-origen.js`**: la rama móvil pregunta a `MovilGlobo.elementoDe`.
- **`js/contacto.js`**: en móvil deja de mudarse al pie de `.hoja` y vuelve a
  ser una capa que abre la ruta `#/contacto`, como en escritorio.
  `Contacto.colocar` se simplifica en consecuencia. `congelar`/`descongelar`
  paran también la esfera mientras la hoja está abierta.
- **`js/diagnostico-toques.js`** se retira con la rejilla: el fallo que caza
  (el primer toque tras la puerta) vive en la rejilla, que deja de existir.
  Su lección se conserva en el diseño del toque de la esfera (ver «El
  gesto»). Esto también salda la deuda anotada el 2026-09-16.
- **`css/luque.css`**: salen las reglas de `.hoja-rejilla` y `.hoja-celda`
  (unas 34 líneas); entran las de la esfera, el pie y el botón.
- **El escritorio no cambia.** Todo lo nuevo vive detrás de
  `Movil.CONSULTA` (`max-width: 860px`).
- **`docs/estado-conocido.md`**: una sección nueva para la esfera, y la de la
  portada móvil pasa a decir que la rejilla ya no existe.

## Pruebas

**En el arnés (`tests/test.html`):**

- `MovilEsfera`: el reparto para n = 0, 1, 8 y 20 (puntos sobre la esfera
  unidad, sin repetir); `traer(k)` deja *k* delante para todo *k*; la inercia
  frena y se detiene en un tiempo finito; al asentarse gana la más cercana; la
  proyección ordena `z` y luz con la profundidad; las teselas no rotan en el
  plano de la pantalla aunque la esfera acumule giro; con reducción de
  movimiento `soltar` asienta sin inercia; `vecina` en las cuatro direcciones.
- `MovilGlobo`: toque contra arrastre por el umbral; tocar la de delante llama
  a `alAbrir` con su id; tocar una lateral no abre y la trae; las del
  hemisferio de detrás no se tocan ni se tabulan; flechas e Intro; el filtro
  por ruta reparte de nuevo y conserva los números; `elementoDe`; el cambio a
  la de 1500 por luz; la tesela sin foto se queda con su número; cero trabajos
  muestra el texto de vacío.
- Las pruebas de la puerta, del origen del visor y del contacto se actualizan a
  la esfera.
- Toda la suite en verde, incluidas las de escritorio que no se tocan.

**En local, en el panel del navegador a tamaño móvil:** la geometría, el giro,
la inercia, el asiento y el toque, con las teselas en gris porque en local
todas las fotos dan 404, y eso es lo correcto.

**Sólo desplegado** (se anota en `docs/comprobaciones-en-produccion.md`, a
cargo de Ángel): cómo se ven las portadas reales sobre la esfera, la fluidez en
su teléfono, y que el primer toque tras la puerta abre a la primera.

## Fuera de esta spec

- El visor de dos ejes y todo el escritorio.
- Fotos interiores o repeticiones en la esfera.
- Cualquier dependencia nueva (WebGL, Three.js, librerías de gestos).
