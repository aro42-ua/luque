# El tacto del móvil

Diseño aprobado el 2026-09-03. Continúa `2026-08-28-movil-design.md`, que sigue
siendo la autoridad sobre qué es la versión móvil; esto corrige tres sitios donde
lo construido responde como una web que se pulsa y no como una que se toca.

## Por qué

El bloque 4d dejó la portada móvil en pie y se comprobó en un teléfono real el
2026-09-03. La comprobación sacó tres defectos, y los tres tienen la misma forma:
**el dedo hace algo, y la pantalla contesta después en vez de contestar
mientras.** Una interfaz táctil que solo responde al soltar se siente como un
mando a distancia.

Uno de los tres, además, no es un defecto de acabado sino un callejón sin salida:
quien abre el panel informativo desde un teléfono no puede volver.

## Lo que se construye

### 1. El hero se levanta con el dedo

Hoy el amarillo de la portada se va **al soltar**: `MovilGestos` decide si el
arrastre fue un deslizamiento hacia arriba y, si lo fue, la clase `.fuera` lo
desvanece mientras lo sube 28px (`css/luque.css`, la regla `.hoja-hero.fuera`).
Mientras el dedo se mueve no pasa absolutamente nada.

Pasa a **seguir al dedo**: la hoja se levanta tanto como se ha arrastrado, y al
soltar termina de salirse por arriba o vuelve a su sitio.

**Qué se ve por debajo:** la rejilla, quieta, descubriéndose. No sube con la
hoja y la hoja no se transparenta. La metáfora es levantar una hoja de papel de
una mesa, y una mesa no se mueve ni el papel se vuelve translúcido.

**Qué decide al soltar.** Dos ramas, en este orden — es la forma que usa el
`ViewPager` de Android, y se copia la forma y no solo los números:

1. **Manda el golpe.** Si el recorrido llegó al menos a **24px** *y* la
   velocidad al soltar supera **0,4 px/ms**, la hoja se va.
2. **Si no, manda la posición.** La hoja se va si se levantó más de **1/4 del
   alto de la ventana**; si no, vuelve.

La primera rama existe porque en un teléfono se pasa página de un golpe corto y
seco, y exigir un cuarto de pantalla haría que ese golpe no hiciera nada —se
siente como que la web no te ha hecho caso—. El mínimo de 24px dentro de esa
misma rama existe para lo contrario: sin él, un temblor rápido de 6px al apoyar
el dedo echaría la puerta sin que nadie la empujara. Por eso las dos condiciones
de la rama 1 van con **`&&` y no con `||`**.

**De dónde salen los tres números.** No son de mi criterio; el criterio ya estaba
puesto y lo cambié después de mirar fuera:

| | Aquí | Referencia |
|---|---|---|
| Distancia mínima del golpe | 24px | `MIN_DISTANCE_FOR_FLING = 25` dip (ViewPager de Android); `threshold: 10` px (Hammer.js) |
| Velocidad mínima | 0,4 px/ms | `MIN_FLING_VELOCITY = 400` dip/s (ViewPager); `velocity: 0.3` px/ms (Hammer.js) |
| Fracción de pantalla | 0,25 | `0.4f` (ViewPager); `longSwipesRatio: 0.5` (Swiper.js); ~0,2 es lo que se pide para las hojas inferiores de Material |

**La equivalencia entre `dip` y píxel CSS merece una nota, porque la cuenta
ingenua sale mal.** Por definición un `dip` es 1/160 de pulgada y un píxel CSS es
1/96, lo que daría 25 dip = 15 px CSS. Esa conversión no vale en un teléfono: la
ventana móvil no se escala a 96 por pulgada. Un iPhone 12 declara 390px CSS de
ancho sobre una pantalla de 64,2mm, o sea unos **154 píxeles CSS por pulgada**,
frente a los 160 dip por pulgada de Android. Con eso, **1 dip ≈ 1,04 px CSS** y
los números de Android se trasladan casi uno a uno: 25 dip ≈ 24px, y 400 dip/s ≈
0,385 px/ms, que se redondea a 0,4.

La fracción de 0,25 es la única que se aparta a propósito de su referencia, y por
un motivo: el 0,4 de `ViewPager` decide un **cambio de página**, donde
equivocarse te lleva a otro sitio. Aquí decide una **puerta que se cruza una vez
y no vuelve**. Equivocarse por exceso cuesta poco —te ahorras el amarillo, que
era el destino de todos modos— así que el umbral debe ser más generoso que el de
cambiar de página, no igual.

**La hoja no se mueve hasta que el dedo recorre 10px.** Sin ese margen, apoyar el
dedo para leer la pantalla ya la desplaza dos o tres píxeles y parece que la web
tiembla. Los 10px son a la vez el `threshold` por defecto de Hammer.js y el
`TOQUE` que este repositorio ya tiene escrito en `js/movil-gestos.js`, así que no
es un número nuevo. **Al cruzarlos, el recorrido se cuenta desde ahí y no desde
el punto de apoyo**, o la hoja pegaría un salto de 10px justo al empezar.

**Los 24px del golpe y los 10px del margen se miden distinto, y la diferencia
importa.** El mínimo del golpe se compara contra el **recorrido del dedo**
—porque los 25 dip de `ViewPager` son recorrido del dedo—, mientras que la
fracción de pantalla se compara contra lo **levantado**, que es el recorrido
menos el margen: es lo que el ojo ve. Son diez píxeles de diferencia sobre
umbrales de veinte y de doscientos, así que no cambia el comportamiento; se
escribe porque un implementador que use la misma medida para las dos cosas no
estará equivocándose, y quien lo revise después no debería tener que deducir
cuál era la intención.

**La velocidad se mide entre las dos últimas muestras del dedo**, no sobre el
gesto entero. La diferencia importa y es lo que separa los dos gestos que la
gente hace de verdad: quien arrastra despacio y remata con un golpe seco sí echa
la puerta, y quien arranca rápido y se detiene a mitad no la echa. Promediando el
gesto entero, los dos saldrían al revés.

**Cuando la salida se completa, la hoja termina de subir hasta salirse por
arriba en los `SALIDA_MS` que ya existen** (380ms). Esa constante no cambia: hoy
ya se exporta desde `js/movil-hoja.js` para que el CSS mida su transición contra
ella en vez de contra una copia.

Arrastrar **hacia abajo** no hace nada: el recorrido se fija en cero por abajo.
La hoja no se puede hundir.

**El movimiento reducido conserva el comportamiento de hoy, entero:** se decide
al soltar, la hoja se desvanece, y el dedo no arrastra nada. No es una excepción
por comodidad, son dos razones. La preferencia pide menos movimiento, y una hoja
atada al dedo es movimiento continuo. Y hay una trampa concreta: la salida nueva
es un deslizamiento **sin fundido**, mientras que la regla de movimiento reducido
de hoy es `transform:none`. Juntarlas sin pensar deja al teléfono con movimiento
reducido con el hero **visible y quieto** hasta que el nodo se retira solo — una
pantalla muerta durante 200ms.

**Las otras dos salidas no cambian.** La rueda y el teclado siguen cerrando la
puerta de golpe. Por esta portada pasa una ventana de escritorio estrechada a
700px, con ratón y teclado y sin pantalla táctil; sin ellas esa ventana se queda
encerrada en el amarillo. El razonamiento entero está en el comentario «TRES
FORMAS DE CRUZAR LA PUERTA», hoy en `js/movil-hoja.js` y que se muda con la
puerta a `js/movil-puerta.js` (ver más abajo); sigue vigente palabra por palabra,
y lo único que cambia es que la primera de las tres pasa a ser continua.

### 2. Las fotos se amplían desde su miniatura

Hoy, al abrir un trabajo desde la rejilla móvil, la foto **crece desde un punto
de tamaño cero pegado a la esquina superior izquierda.**

La causa no es que falte el vuelo. `VisorTransicion.volar()` lleva bloques
haciendo exactamente esta transición en escritorio, de ida y de vuelta. Lo que
pasa es que `js/visor.js` pregunta el origen a `Galeria.elementoDe(id)` —la
galería de **escritorio**—, y `Galeria.init()` se llama también en móvil, así
que devuelve un botón de verdad. Ese botón vive dentro de `.gallery`, y el CSS
móvil le pone `display:none !important`. El rectángulo de un elemento con
`display:none` es todo ceros, y de ahí sale el punto en la esquina.

**Esto está leído del código y del CSS, no medido en un navegador. Medirlo es
parte del trabajo, no un supuesto que se da por bueno.**

Pasa a: **el visor le pregunta el origen a la portada que está puesta.** En
móvil, la celda de la rejilla; en escritorio, la caja del lienzo, como hoy. Sirve
para abrir y para cerrar sin tocar nada más, porque el camino de vuelta ya usa
ese mismo elemento.

### 3. Del panel informativo se puede salir

Por debajo de 860px el panel de la ficha se hace `width:100%` y, con su
`z-index:4` dentro de un `.visor-chrome` cuya cabecera no lleva ninguno, **tapa
la cabecera entera**: el botón «Ficha» que lo cerraría y también la equis que
cierra el visor. En escritorio no ocurre porque ahí el panel mide 340px y deja la
cabecera a la vista.

**Esto también está razonado leyendo el CSS y no medido. Se mide.**

Pasa a: **el panel lleva su propio botón de cerrar dentro**, visible solo por
debajo de 860px. El amarillo a sangre se conserva —es una decisión de diseño de
la spec de agosto, no un accidente— y la salida deja de ser invisible.

En escritorio no aparece. Un segundo control para cerrar algo que ya se cierra
desde una cabecera visible es ruido, y el escritorio es el único camino que hoy
funciona en producción.

Esta elección no es solo gusto: la guía de Material para las hojas inferiores
nombra las tres salidas de un panel de este tipo y **una de ellas es
literalmente «un control explícito, como una equis en la barra superior»**. Un
panel que solo se cierra con un gesto que nadie te ha enseñado no cumple ni
siquiera la referencia más permisiva.

## Decisiones, y qué se descartó

### El arrastre vive en un módulo nuevo, no dentro de `MovilGestos`

`js/movil-gestos.js` ya está ahí y ya recibe los puntos del dedo. Ampliarlo era
lo barato.

Se descarta porque ese módulo tiene escrito, en el comentario de `soltar`, que
«la intención sólo se decide cuando se levanta el ÚLTIMO» dedo. Meterle estado
continuo convierte esa frase en falsa. **Una frase de comentario que el código
contradice es el modo de fallo característico de este proyecto** —diez casos solo
en el bloque 4d, dos de ellos introducidos dentro del comentario que se estaba
reescribiendo para arreglar otra frase falsa—. Un módulo nuevo con una
responsabilidad cuesta menos que un módulo veterano con dos.

`js/movil-arrastre.js` es puro: sin DOM y sin reloj. **El tiempo entra siempre
como argumento**, desde `e.timeStamp`, y nunca se lee dentro. Sin eso, la
velocidad no se puede probar sin falsificar un reloj, y falsificar un reloj es
fijar la implementación en vez del comportamiento.

### Los dos umbrales no se copian: ya están escritos en `MovilGestos`

Al mapear las referencias apareció algo que no se buscaba. Las constantes que
este diseño saca de Hammer.js y de `ViewPager` **ya existen en el repositorio con
esos mismos valores**, puestas en el bloque 4c sin conocer ninguna de las dos
fuentes:

- `MovilGestos.TOQUE = 10` — «por debajo de esto el dedo no se ha movido».
  Es el `threshold` de Hammer.js, y es el margen que necesita este arrastre.
- `MovilGestos.UMBRAL = 24` — «el eje dominante tiene que recorrer al menos
  esto». Es el `MIN_DISTANCE_FOR_FLING` de Android, y es el mínimo del golpe.

Así que **`js/movil-arrastre.js` los lee de `MovilGestos` en vez de declararlos
otra vez.** No es una optimización: son literalmente la misma pregunta con la
misma respuesta, y dos copias de un umbral son dos sitios donde cambiarlo y uno
donde olvidarse. La lectura es perezosa —dentro de las funciones, no al definir
el módulo—, así que no impone ningún orden de carga entre los dos.

Esto **disuelve un problema que este mismo documento daba por hecho** en su
primera versión: que `MovilGestos` se quedaría sin consumidores al sustituirle
el arrastre la única llamada que tenía, y que habría que anotarlo para que
ninguna revisión lo tirara por huérfano. Sigue teniendo consumidor, y ahora dos:
sus constantes aquí, y su decisión de dirección al soltar cuando exista el visor
móvil de dos ejes que describe la spec de agosto.

### La puerta se muda a su propio fichero

`js/movil-hoja.js` tiene hoy 267 líneas y el techo del proyecto son 300. El
cableado del arrastre —tres oyentes de puntero, la captura, el pintado del
`transform` y la limpieza al soltar, con los comentarios que este repositorio
escribe— no cabe en 33 líneas.

Así que la sección del hero sale de `movil-hoja.js` a **`js/movil-puerta.js`**:
`entrada`, `heroIdo`, `SALIDA_MS` y el cableado nuevo. Lo que queda en
`movil-hoja.js` es la rejilla —`pintar`, `filtrar`, `filtrarDesdeRuta`,
`numero`, `proporcion`, `elementoDe`—, que es una responsabilidad y no dos.

**Esto no es una limpieza oportunista.** Es el techo de 300 líneas obligando a
una división que el fichero ya pedía: hoy lleva dentro dos cosas sin relación
—una rejilla numerada y una puerta que se cruza una vez— unidas solo por
haberse escrito en el mismo bloque. El bloque 4d ya partió
`tests/pruebas-movil-hoja.js` en cuatro por la misma regla.

### El visor pregunta al interruptor, y aprende la palabra «móvil»

La alternativa limpia era que la portada activa se registrara en el visor,
dejándolo ciego al aparato.

Se descarta por YAGNI. Hay exactamente dos portadas, el interruptor de
`js/movil.js` ya es el sitio designado del proyecto para «en qué mundo estamos»,
y una indirección con ciclo de vida es una cosa más que puede quedarse
desincronizada. El precio se nombra en voz alta y se acepta: **`js/visor.js`
aprende la palabra «móvil» por primera vez.** Si algún día hay una tercera
portada, ese es el momento de la indirección y no antes.

### `MovilHoja.elementoDe` recibe el contenedor y devuelve el botón

Recibe el contenedor porque todo `MovilHoja` es así —`pintar(contenedor, ...)`,
`filtrar(contenedor, ...)`—. La simetría con `Galeria.elementoDe(id)`, que sí
guarda un mapa de módulo, se pierde a propósito: mantener a `MovilHoja` sin
estado vale más que las dos firmas iguales.

Devuelve el **botón** y no el `<li>` porque al cerrar el visor le hace `focus()`
al elemento que lo abrió, y un `<li>` no recibe foco.

## Lo que hay que hacer bien y es fácil de olvidar

Cuatro cosas concretas. Las cuatro son silenciosas: ninguna rompe una prueba.

- **`touch-action:none` en el hero.** Sin eso el navegador se queda el gesto
  vertical, y en Chrome de Android eso es el «tirar para recargar». El
  `overscroll-behavior-y:contain` que ya existe está en `.hoja` y no cubre esto.
- **`setPointerCapture`** al empezar el arrastre, para que sobreviva a que el
  dedo se salga del hero.
- **Limpiar el `transform` y el `transition` en línea al soltar, en las dos
  ramas.** El estilo en línea gana a la clase `.fuera`, así que dejarlo puesto
  clava la hoja a medio camino.
- **El botón nuevo del panel es tabulable con el panel cerrado.** El panel
  cerrado sigue renderizado (`translateX(-100%)`), y `aria-hidden` **no** saca
  del orden de tabulación. Ese agujero exacto ya se abrió en el bloque 4d y se
  cerró con `visibility:hidden`; aquí se reabre si nadie lo mira.

## Qué se prueba y qué no

`js/movil-arrastre.js` es puro y se cubre entero: el umbral por distancia, el
umbral por velocidad, el mínimo de 24px que impide el falso positivo, el
arrastre hacia abajo fijado en cero, y **el caso de dos eventos en el mismo
milisegundo**, que sin guarda divide por cero al calcular la velocidad.

`MovilHoja.elementoDe` es una prueba de DOM directa. La elección de portada de
`js/visor.js` necesita el arnés con el interruptor arrancado.

**Lo que la suite no puede certificar**, y se dice por delante: que el panel deje
de tapar la cabecera, que `touch-action` impida el tirón de recarga, y que el
arrastre se sienta bien. No hay pruebas de CSS computado en este repositorio —ya
está anotado como deuda en `docs/estado-conocido.md`—. Eso se verifica midiendo
en el navegador, y lo último solo en un teléfono de verdad.

## De dónde se copiaron los números

Consultado el 2026-09-03. Se anota la fuente porque un umbral sin procedencia
es una opinión, y dentro de seis meses nadie sabrá si el 0,4 se midió, se copió
o se inventó.

- **Hammer.js, reconocedor `swipe`** — `threshold: 10` px, `velocity: 0.3` px/ms.
  <https://hammerjs.github.io/recognizer-swipe/>
- **`ViewPager` de Android (AOSP)** — `MIN_DISTANCE_FOR_FLING = 25` dip,
  `MIN_FLING_VELOCITY = 400` dip, y en `determineTargetPage` la condición del
  golpe es `Math.abs(deltaX) > mFlingDistance && Math.abs(velocity) >
  mMinimumVelocity`, con un `truncator` de `0.4f` hacia delante cuando no hay
  golpe. **De aquí sale la forma de dos ramas, no solo los números.**
  <https://chromium.googlesource.com/android_tools/+/refs/heads/master/sdk/sources/android-25/android/support/v4/view/ViewPager.java>
- **Swiper.js** — `longSwipesRatio: 0.5`, `longSwipesMs: 300`,
  `shortSwipes: true`. <https://swiperjs.com/swiper-api>
- **Material Design, hojas inferiores** — las salidas de un panel, incluida la
  equis explícita. <https://m3.material.io/components/bottom-sheets/guidelines>

## Restricciones globales

- **ES5 a mano.** Sin framework, sin paso de compilación, sin gestor de paquetes
  y sin dependencias. `var`, `function`, nada de `const`, `let` ni flechas.
- **Todo en español**, incluidos los comentarios y los nombres.
- **El escritorio no se mueve.** Es el único camino que hoy funciona en
  producción. Cualquier cambio que lo toque se verifica aparte.
- **Nada de credenciales en el repositorio.**
- **Los comentarios no pueden afirmar lo que el código no hace.** Una cita a otro
  fichero se ancla a su sección o a su función, nunca solo a un número de línea.
- **Ningún fichero pasa de 300 líneas.**
- **Una medición que no se ha hecho se llama «razonada», no «medida».**
