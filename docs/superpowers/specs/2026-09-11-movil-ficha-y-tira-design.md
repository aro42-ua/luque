# La ficha y la tira en el visor móvil

Diseño aprobado el 2026-09-11. Continúa `2026-08-28-movil-design.md`, que sigue
siendo la autoridad sobre qué es la versión móvil, y toca lo que el bloque 4f
dejó construido en `js/movil-visor.js`.

## Por qué

Ángel señaló que al visor móvil le faltan opciones que el de escritorio sí
tiene, y puso como ejemplo abrir la ficha de un trabajo.

**La ficha móvil existe desde el bloque 4f** (`js/movil-ficha.js`), y enseña las
mismas cuatro filas que la de escritorio. Lo que no existe es forma de
**pedirla**: es la última parada del eje vertical
(`MovilRecorrido.paradas`), así que llegar a ella cuesta tantos gestos como
piezas tenga el proyecto. En `la-boquerona`, que tiene diez, son diez
deslizamientos para leer el año y el cliente. En escritorio es un botón.

El mismo eje tiene el mismo problema para lo contrario: **no hay forma de saltar
a una pieza concreta.** Escritorio tiene la tira de miniaturas (`#visorTira`);
móvil tiene el contador `03/10`, que informa pero no lleva a ningún sitio.

Una aclaración, porque durante el diseño circuló la idea equivocada: `#visorLinea`
**no es un navegador de piezas.** Es la barra de tiempo de un `<video>`
(`js/visor-video.js`), y ese módulo no tiene hoy ningún consumidor, porque los
ocho proyectos son `tipo: 'fotos'`. No hay ninguna línea de progreso que portar
al móvil; habría que inventarla, y no se inventa.

## Lo que se construye

### 1. El botón de ficha

Una pastilla nueva, «Ficha», en `mvisor-hud-arriba`, entre el desplegable de
categoría y la ✕. Mismo estilo amarillo sobre negro que las demás pastillas del
HUD, y por el mismo motivo: 17,6:1 de contraste pase lo que pase con la foto,
porque el fondo del texto deja de ser la foto.

**A dónde lleva lo decide una función pura nueva en `js/movil-recorrido.js`**,
que es el módulo dueño del eje vertical y el único sitio donde hoy se sabe qué
paradas tiene un proyecto:

```
MovilRecorrido.alternarFicha(estado, orden, recordada)
  → si estado.pieza !== 'ficha':  {proyecto, 'ficha'}
  → si estado.pieza === 'ficha':  {proyecto, recordada}
```

`recordada` es la última parada que no era la ficha. Si no la hay, o si no es
una parada válida de ese proyecto, se cae a `paradas()[0]` —la primera pieza en
un proyecto de fotos, el vídeo en uno de vídeo—. Ese caso no es hipotético: se
entra en él al abrir `#/la-boquerona/ficha` desde un enlace directo, donde nunca
hubo pieza anterior.

**Quién recuerda.** `MovilVisor` guarda una variable, `piezaRecordada`, que se
actualiza en `aplicar()` en cada parada que no sea la ficha, y se pone a `null`
al cambiar de proyecto. No vive en `MovilRecorrido`, que es puro y no guarda
nada entre llamadas; el módulo recibe el valor como argumento, igual que recibe
`orden`.

**El botón no pinta nada.** Llama a `Router.ir`, exactamente igual que un
deslizamiento, y es el suscriptor de siempre quien repinta. Es lo que impide
que la pantalla y la URL discrepen, que es la regla que ya sostiene todo el
visor: `js/router.js` es la única fuente de verdad sobre qué está abierto.

De regalo, moverse a la ficha **reemplaza** en el historial en vez de apilar
(`js/router.js:77`: moverse dentro del mismo proyecto reemplaza), así que abrir
y cerrar la ficha seis veces no deja seis entradas que deshacer con el botón de
atrás del teléfono.

**La animación de entrada.** Pulsar un botón no es un dedo deslizando, pero la
ficha está *abajo* del eje y eso ya se enseñó. Ir a la ficha entra como si se
hubiera deslizado `'arriba'`, y volver como `'abajo'` —los nombres son los del
dedo, ver la cabecera de `MovilRecorrido.mover`—. Sin esto la parada aparecería
de golpe y el botón contradiría el modelo espacial que el eje construye en cada
gesto.

**El estado se dice con `aria-pressed`**, no cambiando el rótulo. El botón se
llama «Ficha» siempre; en la parada de la ficha vale `true`. Es lo que ya hace
el desplegable de categorías de al lado con `aria-expanded`, y lo que hace el
botón de escritorio.

### 2. La tira de miniaturas

Un módulo nuevo, **`js/movil-tira.js`** (`window.MovilTira`). No se mete en
`js/movil-visor.js`, y no es preferencia: ese fichero está en **390 líneas**,
muy por encima del techo de 300 que declara `docs/estado-conocido.md` en su
sección «Estructura». El cableado que le toca a `movil-visor.js` en este bloque
son las tres o cuatro líneas de llamar al módulo nuevo, y nada más.

- Un `<button>` por pieza, con un `<img>` a su `piezas[].miniatura`. Esas
  miniaturas son de 250 px de lado largo y pesan 8 KB de media, y existen
  exactamente para esto: la tira del visor de escritorio ya las usa a 52 px.
- Vive dentro de `mvisor-hud-abajo`, encima del título y el contador.
- Pulsar una llama a `Router.ir('proyecto', id, n)`. Igual que el botón de
  ficha: no pinta, navega.
- **Sólo piezas.** No lleva entrada para la ficha, porque la ficha ya tiene su
  propio botón arriba y dos caminos al mismo sitio en la misma pantalla se leen
  como que hacen cosas distintas.
- **Un proyecto de vídeo no tiene tira.** Cero piezas, nada que enseñar; la tira
  se queda oculta en vez de aparecer vacía.

**Se reconstruye al cambiar de PROYECTO, no en cada parada.** Al cambiar de
pieza sólo se mueve la marca del actual y se le hace `scrollIntoView({inline:
'center', block: 'nearest'})`. Esto no es una optimización opcional: `pintar()`
vacía la escena en cada parada, y si la tira siguiera ese mismo camino,
cada deslizamiento tiraría las diez `<img>` de `la-boquerona` y volvería a pedirlas, además de
perder el desplazamiento horizontal que el dedo hubiera dejado puesto.

**La pieza actual se marca con `aria-current="true"`** más un contorno amarillo.
El contorno y no un cambio de opacidad de las demás: atenuar las otras nueve
para destacar una las hace ilegibles todas.

### 3. Los tres escollos del CSS que hay que resolver a propósito

La tira no es un componente suelto: cae dentro de un visor cuyo CSS está puesto
para que el dedo hable sólo con `js/movil-gestos.js`. Tres reglas existentes la
dejarían muerta, y las tres hay que contradecirlas **en la tira y sólo en la
tira**:

1. **`touch-action:none` sobre `.mvisor`** (`css/luque.css`, sobre la línea
   1422). Está puesto para que el navegador no se quede con el desplazamiento
   ni el zoom dentro del visor. Efecto colateral: el desplazamiento horizontal
   de la tira tampoco ocurriría. Se corrige con `touch-action:pan-x` sobre
   `.mvisor-tira`, que devuelve un solo eje y deja el resto declinado.

2. **Los oyentes `pointer*` están en la RAÍZ del visor** (`engancharGestos`, en
   `js/movil-visor.js`), no en la escena, a propósito, porque la escena se vacía
   en cada parada. Eso significa que arrastrar la tira llegaría también a
   `MovilGestos` y se leería como «proyecto siguiente». Se corrige con
   `stopPropagation()` en el `pointerdown` de la tira. **No `preventDefault()`**:
   eso mataría también el desplazamiento que el punto 1 acaba de devolver.

3. **`.mvisor-hud` es `pointer-events:none`** (sobre la línea 1506) para que el
   deslizamiento atraviese el HUD, y cada botón lo recupera uno a uno. La tira
   tiene que recuperarlo igual.

### 4. Un defecto que ya existe y que la tira empeoraría

`.mvisor-hud.dormido` sólo pone `opacity:0` (sobre la línea 1511). Un elemento
con opacidad cero **sigue recibiendo el dedo**: hoy eso significa que las
pastillas del HUD dormido se pueden pulsar sin verse. Con una tira de diez
miniaturas ocupando una franja ancha de la pantalla, eso pasa de rareza a
trampa: tocar para despertar el HUD abriría una pieza al azar.

Se añade `pointer-events:none` a `.mvisor-hud.dormido`. El toque cae entonces en
la raíz del visor, que es justamente quien despierta el HUD
(`soltarEn`, la rama `r.intencion === 'toque'`), así que el primer toque despierta
y el segundo ya pulsa lo que se ve. Es el comportamiento que el HUD ya pretendía
tener.

No se usa `visibility:hidden`, que también sacaría del tabulador, porque
`visibility` no interpola y se llevaría por delante la transición de opacidad de
0,35s — el mismo razonamiento, con el mismo precio, que ya está escrito para
`.visor-ficha` en el escritorio.

## Los ficheros

| Fichero | Qué le pasa |
|---|---|
| `js/movil-recorrido.js` | `alternarFicha`, función pura nueva |
| `js/movil-hud.js` | referencia al botón nuevo y un callback más en `init` |
| `js/movil-tira.js` | **nuevo** |
| `js/movil-visor.js` | `piezaRecordada` y el cableado de los dos, y nada más |
| `index.html` | el botón, el contenedor de la tira, el `<script>` nuevo |
| `css/luque.css` | `.mvisor-tira`, y el `pointer-events` de `.dormido` |

Aviso para quien toque `index.html`: el `<script>` de `js/movil-tira.js` va
**antes** de `js/movil-visor.js`, su consumidor. Y hay una trampa conocida que
no lo atrapa: `tests/test.html` carga su propio juego de `<script>`, así que
**la suite en verde no demuestra que el `<script>` esté en `index.html`**.

## Cómo se prueba

- `tests/pruebas-movil-recorrido.js`: casos nuevos de `alternarFicha` —ida
  desde una pieza cualquiera, vuelta a la recordada, vuelta sin recordada, y
  vuelta con una `recordada` que no es parada de ese proyecto—.
- `tests/pruebas-movil-tira.js`, nuevo, sobre el arnés de DOM: pinta N botones
  para N piezas, marca el actual, **no reconstruye al cambiar de pieza dentro
  del mismo proyecto** y sí al cambiar de proyecto, y no se pinta con cero
  piezas.
- `tests/pruebas-movil-hud.js`: que el botón nuevo llame a su callback.

## Lo que la suite NO puede certificar

No hay pruebas de CSS computado ni de gesto táctil en este repositorio, así que
esto sólo lo puede juzgar quien lo mire en un teléfono de verdad:

1. Que `touch-action:pan-x` baste para que Chrome de Android desplace la tira
   con el dedo, estando dentro de un contenedor con `touch-action:none`.
2. Que arrastrar la tira no se cuele como cambio de proyecto pese al
   `stopPropagation()`.
3. Si una tira de miniaturas sobre la foto se siente útil o se siente como que
   tapa el trabajo. Es un estudio de fotografía: los píxeles que tapan la foto
   se pagan caros, y esta decisión es de Lidia y de Ángel, no mía.
4. Que el botón de ficha esté donde la mano lo busca, y que las tres pastillas
   de arriba no se aprieten unas contra otras en un teléfono estrecho.

Los cuatro se miran sirviendo el sitio a la red local
(`python -m http.server 8000 --bind 0.0.0.0`). Si el teléfono no llega al
servidor, los sospechosos son el adaptador de NordVPN y el perfil de red
«pública» de Windows, no el código; está contado en `docs/estado-conocido.md`.

## Lo que este bloque NO hace

- **No toca el visor de escritorio.** Ni un fichero de `js/visor*.js`.
- **No resucita `js/visor-video.js`** ni la línea de tiempo de `#visorLinea`.
  Siguen sin consumidor, y el motivo —los ocho proyectos son de fotos— no lo
  cambia este bloque.
- **No arregla el `pointercancel` que decide intención y navega**
  (`soltarEn`, en `js/movil-visor.js`), el defecto pendiente que da doble
  navegación con el gesto de «atrás» del navegador. Es del bloque 4f, tiene su
  entrada propia en `docs/estado-conocido.md` y su propio arreglo
  —`soltarEn(e, cancelado)`—, y mezclarlo aquí haría que un bloque sobre dos
  controles nuevos cambiara además cómo se interpretan los gestos de todos.
- **No decide qué hace `mvisor-abierto`**, el gancho de clase sin CSS. Sigue sin
  decidirse, y por el mismo motivo de siempre: sólo se puede juzgar en un
  teléfono.
