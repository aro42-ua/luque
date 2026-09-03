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

**Qué decide al soltar.** Se va si se cumple cualquiera de las dos:

- el recorrido hacia arriba supera **1/4 del alto de la ventana**, o
- la velocidad al soltar supera **0,5 px/ms** y el recorrido llegó al menos a
  **24px**.

El segundo criterio existe porque en un teléfono se pasa página de un golpe
corto y seco, y exigir un cuarto de pantalla haría que ese golpe no hiciera nada
—que se siente como que la web no te ha hecho caso—. El mínimo de 24px del
segundo criterio existe para lo contrario: sin él, un temblor rápido de 6px al
apoyar el dedo echaría la puerta sin que nadie la empujara.

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

### `MovilGestos` se queda, y deja de usarlo el hero

Hoy `js/movil-gestos.js` tiene **un solo consumidor**: la puerta del hero. Si el
arrastre continuo la sustituye, el módulo se queda sin nadie que lo llame.

No se borra, y hay que decir por qué para que nadie lo tome por código muerto en
una revisión: la spec de agosto describe un visor móvil con dos ejes de
deslizamiento —horizontal cambia de trabajo, vertical baja por las piezas hasta
la ficha— que todavía no está construido, y ese visor es exactamente para lo que
`MovilGestos` decide una dirección al soltar. Sigue siendo el módulo correcto
para su trabajo; lo que pasa es que su trabajo aún no ha llegado.

Queda anotado en `docs/estado-conocido.md`: **`MovilGestos` sin consumidores
hasta el visor móvil.** Sin esa nota, la próxima revisión que barra código
huérfano lo encuentra y lo tira.

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
