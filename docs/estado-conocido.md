# Estado conocido de la web

Recogido al integrar la rama del visor y la galería filtrable (agosto de 2026).
No son tareas pendientes urgentes: son cosas sabidas, decididas a conciencia o
aplazadas, que conviene tener a mano antes de tocar el código.

## El contenido

**El contenido ya no está en `js/datos.js`, sino en `contenido.json`.** `js/datos.js`
pasó de contenerlo a custodiarlo: `js/contenido.js` pide el JSON, lo valida y se lo
entrega con `Datos.establecer()`. Si el archivo no llega o no valida, la galería sale
vacía con un aviso en pantalla (`Galeria.mostrarError`) en vez de callarse.

**El contenido ya no es de relleno: son los ocho proyectos de Lidia**, con sus 65
piezas, entrados en el bloque del contenido real (spec y plan del 2026-09-10). Se
acabaron los doce de picsum con fichas inventadas.

El orden de la galería es el que Lidia numeró en sus `TEXTOS.docx`, no el
alfabético, y por eso vive escrito a mano en `herramientas/proyectos.json`.

`contenido.json` **no se edita a mano**: lo genera
`herramientas/derivar_imagenes.py --contenido` mezclando los datos humanos de
`herramientas/proyectos.json` con las fotos que hay en disco. Las 195 rutas se
generan a propósito: una ruta mal escrita sigue siendo una ruta válida y la
validación no la atrapa.

**Dos categorías se quedan vacías, y sus celdas del menú no se pulsan.**
`cortometraje` y `foto-stills` están declaradas en `CATEGORIAS` y no tienen ni un
proyecto. Pulsarlas dejaba la rejilla en blanco; ahora `Galeria.marcarVacias()`
les quita el ratón y atenúa **sus letras** (`.navbar .nav-svg a.vacia g`), y un
enlace escrito a mano a `#/cortometraje` se va a «todos» en vez de pintar el
vacío. Que se atenúe el `<g>` y no el `<a>` entero no es un detalle: cada celda
del SVG lleva dentro medio corchete del marco de la barra, así que bajarle la
opacidad al `<a>` dejaba el marco a medio pintar y la barra parecía rota en vez
de tener dos categorías apagadas. Se calcula
del contenido, así que el día que entre un cortometraje la celda se enciende
sola. Sigue sin decidirse si además deberían enseñar algo —un aviso, un «muy
pronto»—: es la tercera de las tres preguntas que la spec dejó abiertas para
Lidia, y esto es sólo el suelo para que no se vea rota mientras se decide.

**Las celdas del menú apuntaban a la categoría equivocada.** El SVG de la barra
dibuja, por orden, Editorial, Videoclip, Cortometraje y Foto Stills, pero los
`data-cat` de sus `<a>` iban corridos un puesto: pulsar «Editorial» filtraba
`foto-stills` —vacía, rejilla en blanco— y pulsar «Cortometraje» enseñaba los
videoclips. Corregido en `index.html`. Si alguien vuelve a tocar ese SVG, que
compruebe que cada `<a href>` es el de las letras que hay DENTRO de él: no hay
prueba automática que lo ate, porque las letras son `<path>` y no texto.

**Cada foto se guarda en tres medidas, y no es capricho.** Cada una se pide donde
se ve, porque la diferencia entre la mayor y la menor es de casi cuarenta veces:

La medida es **el lado largo**, no una caja de proporción fija. El material real
es 2:3, 3:2 y 16:9 a la vez: con una caja 4:5 las horizontales salían un 20% peor
que las verticales sin ninguna razón. Los pesos son la media medida sobre las 65
fotos reales.

| Campo | Lado largo | Dónde se ve | Peso medio |
|---|---|---|---|
| `portada` | 1500 | la galería, ocho a la vez | 159 KB |
| `piezas[].url` | 3000 | la foto grande del visor y la lupa | 520 KB |
| `piezas[].miniatura` | 250 | la tira del visor, a 52 px | 8 KB |

**Quince piezas van recortadas, y con otra llave.** Son capturas de vídeo de los
videoclips con bandas negras de lado a lado —vídeo vertical dentro de un cuadro
16:9, sobre todo— que en el visor se veían como bordes negros. La herramienta
las recorta del original (franja negra de lado a lado, umbral 32/255, mínimo
4 px, y nunca más de la mitad de un eje) y la pieza sale con el sufijo `-r`
en la llave: `/img/*` se sirve como inmutable con un año de caché, así que
pisar la llave vieja no llegaría a quien ya la tuviera. Las llaves viejas
siguen en el bucket sin que nada las nombre. Decidido por Ángel el 2026-09-11
tras ver la hoja de contacto antes/después.

`piezas[].url` es la única que se guarda a tamaño completo, y no se toca: la lupa
necesita que la pieza sea bastante mayor que la pantalla para tener recorrido, y en
un estudio de fotografía la calidad de lo que se mira es el producto.

Las otras dos existen para no pagar esa calidad donde no se aprecia. El bloque 2 las
perdió al migrar —la galería acabó pidiendo doce piezas enteras, 8,7 MB en vez de
0,8— y por eso la portada volvió a tener imagen propia en vez de ser un índice a las
piezas, como ya decía la especificación.

**La composición ya no está escrita a mano.** `js/composicion.js` la genera a partir
del **orden de la lista**: reordenar los proyectos en `contenido.json` recompone la
galería, sin tocar ni una coordenada. No hay `x`/`y` que mantener.

**Filtrar ya no cambia el tamaño de las fotos.** El modo `compacto` tenía la celda
a 50 vw y el `amplio` a 30, así que pulsar una categoría multiplicaba cada caja por
1,67 y las fotos crecían de golpe. Ahora los dos modos comparten celda y `disponer`
acepta un tercer argumento, `variantes`, con el que `Galeria.aplicarFiltro` le pide
a cada hueco la MISMA caja del ciclo que el proyecto tenía sin filtrar: la escala
que se aplica es 1 clavada y filtrar sólo recoloca.

Aquella celda de 50 estaba puesta para que el lienzo filtrado no bajase de 100 vw
de ancho, porque un lienzo más estrecho que la pantalla se quedaba pegado a la
izquierda con media pantalla amarilla. Eso lo arregla `GaleriaPaneo.medir()`, que
ahora **centra** el lienzo cuando es más pequeño que el escenario en vez de dejarlo
en el origen: los límites del paneo pasaron de `[minX, 0]` a `[minX, maxX]`, que
valen lo mismo cuando no hay recorrido. De paso, `medir()` ignora un escenario a
0x0 —galería todavía en `display:none`—, porque con los límites centrados esa
medida falsa dejaba el lienzo medio fuera de la pantalla en vez de sólo descolocado.

**Las dos calles anchas del lienzo son conocidas y están aceptadas.** El ciclo de
variantes tiene seis entradas y el modo amplio cuatro columnas; como comparten el
divisor 2, las columnas pares reciben siempre las cajas anchas pegadas a la izquierda
y las impares las estrechas empujadas a la derecha. Eso deja dos franjas verticales de
31,2 vw por las que se puede pasear sin que aparezca nada:

```
col 0: ocupa   1,2 → 42,0     calle antes:  1,2 vw
col 1: ocupa  73,2 → 106,8    calle antes: 31,2 vw
col 2: ocupa 121,2 → 162,0    calle antes: 14,4 vw
col 3: ocupa 193,2 → 226,8    calle antes: 31,2 vw
```

Se midió, se miró en pantalla y **se decidió dejarlo**: sobre el lienzo real no se
percibe como una rejilla. Queda escrito para que nadie lo tome por un fallo nuevo. Si
algún día molesta, basta con que el número de variantes sea coprimo con 4 y con 2
—cinco o siete— y las calles quedan todas en 14,4 vw; está comprobado que ni el no
solape ni el determinismo se ven afectados.

## Desplegada

**La web está publicada en `https://lidialuque.com`.** No es un proyecto de
Cloudflare Pages —la cuenta no tiene ninguno—, sino un Worker de Cloudflare
con recursos estáticos, desplegado con `wrangler`. El motivo del cambio de
plan y el procedimiento completo están en `docs/despliegue.md`.

**`workers.dev` está apagado a propósito, y no hay que volver a encenderlo.**
Antes de la Tarea 7 del bloque 3b la web respondía también en
`luque.angelrubioortiz2005.workers.dev`; esa dirección ya no contesta porque,
desde que este Worker sirve `/panel` —la única superficie de escritura del
sitio—, dejarla encendida lo dejaría alcanzable sin que Cloudflare Access
pueda ponerse delante (Access sólo cubre nombres de host de una zona propia,
no `workers.dev`). El razonamiento completo está en `docs/despliegue.md`.

Sigue **cerrada a los buscadores** por `robots.txt` y por la cabecera
`X-Robots-Tag: noindex`. De los dos motivos que la mantenían cerrada, el del
contenido de relleno ya no vale: las fotos son las de Lidia. Queda el otro, y
basta por sí solo: **las tipografías siguen siendo Trial**.

**Las tres tipografías son versiones Trial y su licencia probablemente no
cubre el uso público.** `ABCFavorit-Regular-Trial.otf`,
`ABCFavorit-Bold-Trial.otf` y `ABCFavorit-BoldItalic-Trial.otf` se distribuyen
para evaluación, no para un sitio público y menos aún el de un estudio
comercial. Hay que comprar la licencia web en Dinamo o sustituirlas antes de
anunciar la web. Es deuda conocida, no un descuido.

## Una cosa que conviene saber

**El código ya no depende de la red, y desde el contenido real las fotos tampoco
vienen de fuera.** GSAP era la última librería y se eliminó al rehacer la entrada
del hero: solo quedaba usándose para dos fundidos del preloader, que ahora son
transiciones de CSS. Las fotos de picsum eran lo último que se pedía fuera y ya no
están: `contenido.json` apunta a `/img/...`, o sea al mismo origen —el bucket de R2
en producción, y el directorio `img/` generado al probar en local—.

Ojo con lo que eso NO arregla: **abrir `index.html` con doble clic sigue sin
funcionar**, y ahora por otro motivo. Bajo `file://` el `fetch` de
`contenido.json` no llega, así que la galería sale vacía con su aviso. Se prueba
con `python -m http.server`, que además es como se prueba en un móvil de verdad.

Con una excepción que conviene conocer: **sin conexión, un enlace directo a un
proyecto deja el visor a medias.** `js/visor-transicion.js:48-49` espera a que la
portada esté cargada (`img.complete` o su evento `load`) antes de volar la foto
hasta el visor. Si la portada no llega nunca, `volar()` no se ejecuta, así
que abrir `#/la-boquerona` sin servidor deja un diálogo abierto con opacidad 0 y el foco
sin llegar a su botón de cerrar. Es anterior a rehacer la entrada del hero y queda
fuera de su alcance —la especificación deja el visor explícitamente fuera—, y
desaparece sola con las fotografías reales, igual que las fotos rotas.

**Las fuentes se cargan desde el CSS.** Comprobado que funcionan abriendo el
archivo con doble clic. Si algún día se mueve `css/luque.css` de carpeta, hay que
revisar los `../` de las tres reglas `@font-face`: se resuelven contra la hoja de
estilos, no contra el HTML.

## La regla que más veces se ha roto

**Nada de recursos externos referenciados desde el CSS.** Bajo `file://` el
navegador trata cada archivo como un origen opaco y los bloquea. Ocurrió dos veces
durante el desarrollo: un SVG externo usado como máscara CSS (que dejó el cursor
completamente invisible, porque una máscara que no carga enmascara el elemento
entero) y un `url()` dentro de una propiedad personalizada puesta en línea (que se
resuelve contra el documento y se salía de la raíz del sitio). Las dos se veían
perfectas sirviendo por HTTP.

Si hace falta una forma, va incrustada en el marcado y se colorea con
`currentColor`. Así están el cursor y las esquinas del hero. (Las cuatro del
visor de escritorio se quitaron el 2026-09-11, a petición de Ángel.)

## Detalles menores aplazados

Ninguno bloquea nada. Se anotan para que no se descubran dos veces:

- ~~La rueda del ratón no está limitada en el visor: un gesto de trackpad puede
  avanzar más de una pieza.~~ **Cerrado el 2026-09-11**: `js/visor-rueda.js`
  lee la rueda por gestos: en el trackpad, un paso por gesto —umbral de 50 px
  acumulados, silencio de 150 ms—; en el ratón, **una pieza por muesca,
  siempre** (un evento de 80 px o más, o `deltaMode` líneas/páginas; decisión
  de Ángel). Ignora el pellizco (`ctrlKey`) y el desplazamiento horizontal.
  Precio conocido: un manotazo muy fuerte al trackpad puede empezar por encima
  de 80 px y contar como muesca. Medido antes del arreglo: 20 eventos de una inercia saltaban
  nueve piezas, y un pellizco de zoom en el trackpad pasaba de pieza solo.
- La ficha técnica muestra «Piezas: 1» en proyectos de vídeo.
- Al cerrar el visor, el nodo `<video>` permanece en la escena oculta, pausado.
- `renderizar()` recrea el `<video>` en cada llamada, así que recoger la ficha con
  `Esc` sobre un vídeo reinicia la reproducción.
- Con ocho o más piezas y una ventana muy estrecha (375 px), la tira de miniaturas
  se envuelve y solapa unos 20 px con la foto.
- El indicador de carga se dibuja por encima de la interfaz.
- El paneo con ratón sigue interpolando aunque el sistema pida movimiento
  reducido; el centrado por teclado sí lo respeta.
- **En el visor móvil, `pointercancel` decide intención y navega.** `soltarEn`
  (`js/movil-visor.js`) no distingue soltar de que te quiten el gesto, así que
  el sistema llevándose el dedo cuenta como un deslizamiento terminado.
  Reproducido: `pointerdown` en (300,400), `pointermove` a (300,200),
  `pointercancel` en (300,200) → el router recibe la pieza 2. Donde se nota es
  en el caso que la propia spec anticipa —el gesto de «atrás» del navegador
  desde el borde—, que da **doble navegación**: la del navegador y la del
  visor. Viene del bloque 4f, no del 4g; el comentario que hay junto a los
  oyentes sólo razona sobre el contador de dedos, no sobre esto. Lo cierra un
  `soltarEn(e, cancelado)` que reinicie el gesto sin decidir intención.
  **Sigue abierto** tras la revisión final de la ficha y la tira: lo que esa
  ronda cerró es que la tira dejara de ser uno de sus disparadores (filtro
  por origen en `engancharGestos`, ver más arriba), no el defecto de fondo.

## Sin resolver: la barra tapa fotos, y la regla evidente es la contraria

Está pedido que la barra de categorías «desaparezca al subir el cursor, para
que no moleste a la vista de las imágenes». **Medido, esa regla haría lo
contrario de lo que busca**, así que se aparcó sin implementar en vez de
implementarla mal.

Cuánto de cada foto tapa la barra según dónde esté el cursor, a 1440x900:

| cursor | fotos tapadas |
|---|---|
| arriba (fy 0 – 0,2) | **nada** |
| centro (0,3 – 0,5)  | `arena` 34%, `vidrio` 30% |
| abajo (0,6 – 1,0)   | `oleaje` 35%, `reflejo` 27% |

El motivo es que el paneo va invertido: al subir el cursor el lienzo baja y se
ve la parte de ARRIBA del lienzo, que es donde están los 8vw de margen de
`composicion.js`. Por eso arriba no estorba. Al bajar el cursor las fotos suben
y se meten bajo la barra, que es `position:fixed`.

En pantallas estrechas la holgura de arriba se encoge, porque el margen va en
vw y la barra en píxeles: a 1280x720 el margen son 102px y la barra llega a
112, así que roza `arena` un 1%. Sigue sin ser comparable al 38% del centro.

Las tres salidas que se plantearon, para no volver a razonarlas desde cero:
mostrar la barra **sólo** con el cursor arriba (encaja con lo medido y la deja
alcanzable, porque para usarla subes el cursor); hacerlo literal como se pidió;
o esconderla siempre y devolverla sólo al filo superior, que es lo que menos
estorba pero lo que peor deja la descubribilidad de las categorías.

Falta decidir cuál. Antes de decidir, conviene mirarlo en la pantalla de quien
lo pidió: puede que ahí se vea distinto de lo que sale medido aquí.

## La portada móvil (bloque 4d) y el visor móvil (bloque 4f)

**El visor de la portada móvil ya no es el de escritorio.** Hasta el bloque
4f, tocar un trabajo en la rejilla abría `js/visor.js`, pensado para un ratón.
Desde el bloque 4f el móvil tiene su propio marco, `js/movil-visor.js`
(`window.MovilVisor`), con su propia escena, su propio HUD y sus propios
gestos de dedo. **El visor de escritorio sigue vivo e intacto**: la guarda de
lado hace que los dos convivan suscritos a la misma ruta sin pisarse (ver la
sección de abajo).

**De los tres módulos puros del bloque 4c, dos ya están cableados y uno
sigue sin consumidor.** `MovilRecorrido` y `MovilGestos` los usa
`js/movil-visor.js`: `MovilVisor.siguienteRuta` le pasa el gesto que decide
`MovilGestos.soltar` a `MovilRecorrido.mover`, y el `pointerdown`/`pointerup`/
`pointercancel` de la raíz del visor los alimenta. `Brillo` sigue **sin
ningún consumidor**: comprobado buscando `window.Brillo` y el nombre
`Brillo` en todos los `.js` y `.html` del repositorio fuera de su propio
archivo y de sus pruebas — la única otra aparición es un comentario de
`js/movil.js` que lo cita como ejemplo de argumento inyectado, no una
llamada. No es un olvido de este bloque: sus esquinas adaptativas al brillo
de la foto eran trabajo del bloque 4g.

**Y desde el 2026-09-11 ese destino ya no existe en escritorio.** Ángel pidió
quitar las cuatro esquinas del visor, y se quitaron con todo lo que las
animaba. Lo que el bloque 4g tenía que teñir según el brillo de la foto ya no
está en la pantalla. **Decidido por Ángel el 2026-09-11: `Brillo` se retira.**
`js/brillo.js` y `tests/pruebas-brillo.js` ya no existen; lo que sigue diciendo
este documento sobre ellos es historia de por qué nunca llegó a funcionar, y se
deja porque explica decisiones que sí siguen en pie (las fotos del mismo
origen, la caída al «halo»).

**Lo que el bloque 4g sí trajo, ya sin brillo ni esquinas, es el pellizco.**
`js/movil-zoom.js` (`window.MovilZoom`) es un cuarto módulo puro —escala y
desplazamiento, acotados contra la pantalla y no contra la foto— y
`js/movil-visor.js` lo cablea: dos dedos amplían hasta 1:1 con los píxeles del
archivo (con tope de 6×), y con la foto ampliada un dedo la pasea en vez de
cambiar de parada. Cada parada empieza encajada.


**Y desde el contenido real, `visor-video.js` está igual: sin ningún
consumidor.** Los vídeos se alcanzan con el botón que construye
`js/plataforma.js`, que abre YouTube o Vimeo en otra pestaña, y no con un
`<video>` incrustado. La rama `tipo === 'video'` de `ReglasContenido.validar`
sigue escrita y ya no tiene contenido que validar: los ocho proyectos son de
`tipo: 'fotos'`.

**Lo que sí cambió a mejor con el contenido real es el obstáculo del lienzo.**
Hasta ahora, medir el brillo era imposible porque las fotos venían de picsum y
ningún `<img>` las pedía en modo CORS. Las rutas de `contenido.json` son ahora
relativas (`/img/...`), o sea **mismo origen**, y un lienzo con una imagen del
mismo origen no se mancha. El bloque 4g se encuentra el camino despejado; lo
que sigue sin comprobar es que la medición dé un número correcto sobre una
foto de verdad.

Los dos que se cablearon están escritos y probados desde el bloque 4c y no
tuvieron que reescribirse: **son las piezas del visor móvil de dos ejes**,
que hasta el bloque 4f no tenía quien las llamara. Cuando se cablearon,
`MovilVisor.ordenDe` hizo la conversión que ya pedía por escrito el
comentario de `js/movil-recorrido.js`: **`MovilRecorrido` necesita `piezas`
como NÚMERO y no como array**; el porqué y lo que cuesta equivocarse está más
abajo en este mismo documento, en la sección «Cómo se prueba», en la entrada
sobre `MovilRecorrido.paradas`.

**La comprobación en un teléfono real YA SE HIZO, el 2026-09-03.** Ángel la
dio por hecha sobre su propio teléfono, con el sitio servido desde la red
local. Los resultados punto por punto no quedaron registrados —sólo el hecho
de que la comprobación ocurrió—, pero sacó **tres defectos**, que son trabajo
del bloque siguiente y están descritos justo debajo, en «Lo que encontró la
comprobación en el teléfono».

Para llegar al servidor desde el teléfono hizo falta pelearse con dos cosas de
la máquina, y conviene no volver a diagnosticarlas desde cero: el adaptador de
NordVPN estaba activo, y la Wi-Fi de casa estaba clasificada por Windows como
red **pública**, que es el perfil en el que el cortafuegos bloquea por defecto
todo lo entrante. El servidor en sí estaba bien —`0.0.0.0:8000`, HTTP 200
desde la propia máquina en su IP de la Wi-Fi—, así que si vuelve a pasar, el
sospechoso no es el código. La IP pública no sirve: sin abrir puertos en el
router no llega a la máquina.

## Lo que encontró la comprobación en el teléfono (bloque 4e, resuelto)

Los tres los vio Ángel en pantalla real durante el bloque 4d. Las causas que se
razonaron entonces quedan sustituidas aquí por las medidas al arreglar cada
una en el bloque 4e; donde una medición contradijo lo razonado, se dice.

1. **El hero se retiraba de golpe. Resuelto.** `js/movil-arrastre.js` es un
   módulo puro nuevo —sin DOM y sin reloj, el tiempo entra como argumento— que
   decide cuánto se ha levantado la hoja en cada `pointermove` y si al soltar
   se va o vuelve. `js/movil-puerta.js` lo cablea: `pointerdown` empieza el
   arrastre, `pointermove` pinta `translateY` en vivo salvo con
   `prefers-reduced-motion: reduce`, y `pointerup`/`pointercancel` deciden con
   la misma regla que el `determineTargetPage` del `ViewPager` de Android —
   golpe (recorrido y velocidad juntos) o posición (un cuarto de pantalla
   levantado)—. Los cuatro números y su procedencia están más abajo, en «De
   dónde salen los cuatro umbrales del arrastre».

2. **Las fotos aparecían de la nada. Resuelto, y la causa medida no fue la
   razonada.** Lo que se sospechó en el bloque 4d —animar desde el rectángulo
   de la miniatura— ya era lo que `js/visor.js` intentaba: `abrir()` le
   preguntaba a `Galeria.elementoDe(id)`, que en móvil sí devuelve un botón de
   verdad, sólo que uno que vive dentro de `.gallery`, a la que el CSS de
   `body.es-movil` le pone `display:none`. El rectángulo de un elemento con
   `display:none` es todo ceros, así que el vuelo salía desde `{0,0,0,0}` y no
   desde ningún sitio erróneo por falta de medición: la medición ya estaba,
   apuntaba al elemento equivocado. Medido el 2026-09-03 contra la celda
   `niebla` con Chrome headless en modo móvil de verdad
   (`Emulation.setDeviceMetricsOverride` con `mobile:true` a 390×844; con
   `--window-size` a secas el ancho sale mentiroso, ver más abajo): el
   rectángulo de escritorio (`Galeria.elementoDe('niebla')`) da
   `{x:0,y:0,w:0,h:0}` y el de la celda móvil da
   `{x:24,y:24,w:166,h:207.5}` — el ancho de esa medición importa y por eso se
   dice: **390 CSS px**; véase el aviso del final de este apartado.

   Quien decide a qué portada preguntarle el origen del vuelo es
   **`VisorOrigen.elemento(id)`**, en `js/visor-origen.js`: pregunta a
   `window.Movil.actual()` cuál es la portada puesta y sólo entonces se dirige a
   `MovilHoja.elementoDe` o a `Galeria.elementoDe`. De `js/visor.js` cambió
   **una sola línea**, la que hoy dice
   `elementoQueAbrio = window.VisorOrigen.elemento(id)`. El plan del bloque
   proponía una función `elementoQueAbre(id)` dentro de `js/visor.js`, y **ese
   nombre no existe en el código**: el fichero estaba a una línea del techo de
   300 y la función salió fuera con otro nombre. Si lo buscas, no lo vas a
   encontrar.

   Esto destapó un segundo defecto, no descrito en el bloque 4d porque nadie
   había medido el enlace en frío: `Router.init()` avisa de forma síncrona y
   corría **antes** que `Movil.init()`, así que al entrar por una URL con
   `#/<id>` `Movil.actual()` todavía valía `null` y la pregunta caía siempre en
   `Galeria`. Medido contra el commit anterior a este arreglo, en móvil:
   `MovilHoja.elementoDe` se llamaba cero veces, el vuelo salía de
   `{x:-304,y:-25}` y el foco al cerrar caía en `BODY`. El orden se invirtió
   —`Movil.init` antes que `Router.init`— y con el mismo caso se mide
   `MovilHoja.elementoDe` llamado una vez, **el mismo rectángulo de arriba**
   —`{x:24,y:24,w:166,h:207.5}` a 390×844— y el foco de vuelta en la celda.

   **Sobre ese rectángulo, porque aquí llegó a haber dos cifras distintas para
   la misma celda.** La buena es `{x:24,y:24,w:166,h:207.5}` y corresponde a un
   viewport de **390×844 CSS px** con `mobile:true`; vuelta a medir el
   2026-09-04 en la ronda de arreglos de la revisión final, sobre `#/niebla`,
   y sale idéntica para el `<li>`, el `.hoja-boton` y la `<img>` de la celda.
   El 166 se comprueba con el CSS a mano: `390 − 48` de `padding` menos los
   `10` de `gap`, entre dos columnas, son 166; y `166 × 1,25` —la primera de
   `MovilHoja.PROPORCIONES`— son los 207,5 de alto.

   El `216×269` que circuló **no es de este ancho**: medido, sale a un viewport
   de **490px** (`(490 − 48 − 10) / 2 = 216`, y `216 × 1,25 = 270`). O sea que
   entró de una medición hecha con la ventana más ancha de lo que se creía,
   exactamente la trampa que este documento avisa dos apartados más abajo. Si
   vuelves a medir y te sale 216, lo primero que hay que mirar no es el código
   sino el ancho real del viewport.

3. **Del panel informativo no se podía salir. Resuelto, y la sospecha del
   bloque 4d era cierta.** `#visorFicha` gana un botón propio, «Cerrar la
   ficha», cableado al mismo `alAlternar` que el botón «Ficha»
   (`js/visor-ficha.js`, `init`); visible sólo bajo 860px.

   **Lo que saca el panel cerrado del orden de tabulación es `visibility:hidden`,
   y sólo eso.** `translateX(-100%)` nunca lo sacó: el panel cerrado sigue
   RENDERIZADO, sólo que a `left:-340px`, y `aria-hidden` tampoco saca del
   tabulador — es justamente por eso por lo que hubo que añadir la
   `visibility`, y el comentario de `css/luque.css` sobre `.visor-ficha` lo dice
   con todas las letras. **Y el retardo de 0,45s no tiene nada que ver con el
   tabulador**: existe porque `visibility` no interpola, salta; sin retardarla
   hasta el final, el panel se volvería invisible en el primer fotograma y el
   deslizamiento de salida que la línea de al lado se molesta en animar no se
   vería nunca. La rama abierta pone ese retardo a cero, porque al abrir tiene
   que ser visible ya. Quien «simplifique» quitando el retardo creyendo que es
   accesibilidad, lo que rompe es la animación de salida.

   Y un aviso que costó una regresión: el filtro del envolvente de foco del
   visor (`atraparFoco`, `js/visor.js`) mira `offsetParent`, que `display:none`
   anula pero `visibility:hidden` **no**. Ese botón nuevo entraba en la lista de
   focos siendo inenfocable y el Tab se escapaba del diálogo a ≤860px; se
   arregló en la ronda de la revisión final añadiendo la visibilidad a la
   condición, y lo cubre `tests/pruebas-visor-foco.js`.

   Medido con la misma emulación móvil de verdad: antes del arreglo, `elementFromPoint` en
   el punto del antiguo botón «Ficha» con el panel abierto devolvía `#fichaCat`,
   confirmando la sospecha del bloque 4d. El arreglo mismo escondía un
   defecto que la medición cazó antes de darlo por bueno: en el CENTRO del
   botón nuevo, `elementFromPoint` devolvía `fichaCat` y no `fichaCerrar` —
   `.visor-ficha-cat` tiene `opacity:0.55`, que le abre su propio contexto de
   apilamiento aunque no esté posicionada, y por orden de DOM ese contexto
   pintaba por encima del botón absoluto sin `z-index` explícito. Un
   `z-index:1` en `.visor-ficha-cerrar` lo corrige. Vuelto a medir tras el
   arreglo: el punto del botón resuelve dentro de `#fichaCerrar` y pulsarlo
   quita la clase `ficha-abierta` del visor.

### De dónde salen los cuatro umbrales del arrastre

`js/movil-arrastre.js` no declara sus cuatro números en el mismo sitio: dos son
nuevos y dos son préstamos.

- **`FRACCION` (0,25)** — qué fracción de pantalla hay que levantar para que la
  hoja se vaya sola. Viene del `0,4f` del `determineTargetPage` del
  `ViewPager` de Android, con el número bajado: allí equivocarse te lleva a
  otra página, aquí es una puerta que se cruza una vez y no vuelve, y
  equivocarse por exceso sólo te ahorra un amarillo que era el destino de
  todos modos.
- **`VELOCIDAD` (0,4 px/ms)** — el `MIN_FLING_VELOCITY` de Android, 400 dip/s,
  trasladado a píxeles CSS. Hammer.js usa 0,3 para lo mismo.
- **`MovilGestos.TOQUE` (10) y `MovilGestos.UMBRAL` (24)** — no son nuevos: son
  los mismos umbrales que ya cableaba el hero fundido desde el bloque 4c
  (margen antes de moverse y mínimo del golpe), y `MovilArrastre` los
  reutiliza en vez de copiarlos. **Desde este bloque están compartidos entre
  dos comportamientos**: cambiar `MovilGestos.TOQUE` o `MovilGestos.UMBRAL`
  mueve a la vez la zona muerta del deslizamiento de la rejilla Y el arrastre
  de la hoja, no sólo el primero.

**Aviso sobre la conversión dip↔px:** no es la de la definición —1/160" contra
1/96", que daría 15px por cada 16dip—. En la pantalla de un teléfono normal 1
dip son aproximadamente 1,04px CSS, casi la misma unidad, y es esa
aproximación la que se usó para trasladar los números de Android.

### Dónde vive ahora la puerta del hero

**La puerta del hero —el amarillo con LUQUE!— vive en `js/movil-puerta.js`
desde el bloque 4e**, no en `js/movil-hoja.js`. Salió de allí porque el
cableado del arrastre no cabía bajo el techo de 300 líneas: `movil-hoja.js`
quedó con la rejilla —numeración, proporciones, pintado, filtrado— y
`movil-puerta.js` con la puerta que se cruza una vez por visita. Quien busque
«hero» en `movil-hoja.js` a partir de ahora no encuentra nada, y no es un
descuido.

### Qué sigue sin poder certificar la suite

No hay pruebas de CSS computado en este repositorio, así que cuatro cosas del
bloque 4e sólo las puede juzgar quien las mire en un teléfono: el aspecto del
panel al deslizarse, que el `touch-action` del hero baste para que Chrome de
Android no confunda el arrastre con un *pull-to-refresh*, que **el pellizco
amplíe** sobre ese mismo hero, y que el arrastre se sienta bien al dedo.

Las dos del medio cuelgan de la MISMA declaración y tiran en sentidos
contrarios, así que conviene mirarlas juntas: ver el punto 10 de la lista de
abajo.

**El aviso viejo, ya cumplido:** la spec decía
con todas las letras que dos cosas de esta portada no se pueden comprobar en
un navegador de escritorio estrechado por mucho que se le dé el ancho que
dispara el interruptor: el deslizamiento desde el borde, que se queda el
gesto de «atrás» del navegador, y el *pull-to-refresh* al tirar hacia abajo
(`docs/superpowers/specs/2026-08-28-movil-design.md`, sección «Dos cosas del
sistema operativo», sobre las líneas 286-300). Ésta fue la lista que se le
pasó a Ángel, y se conserva porque es la que hay que volver a recorrer cada
vez que la portada móvil cambie —los puntos 3 y 4 en particular no los puede
sustituir ninguna medición de escritorio—:

1. Que se vea el amarillo con LUQUE! al abrir la portada en el móvil.
2. Que deslizar el dedo hacia arriba sobre el amarillo lo retire y aparezca
   la rejilla, y si el tiempo se siente bien o mal.
3. Que tirar con fuerza hacia abajo desde lo alto de la rejilla NO recargue
   la página. La regla que debería impedirlo, `overscroll-behavior-y:contain`
   sobre `body.es-movil .hoja` —el contenedor que se desplaza—
   (`css/luque.css`, sobre la línea 1038), está puesta; que baste en Chrome de
   Android es justo lo que no se puede comprobar sin el teléfono.
4. Que deslizar desde el borde izquierdo de la pantalla dispare el gesto de
   «atrás» del navegador y no algo del sitio, y que no estorbe.
5. Que recorrer la rejilla arriba y abajo vaya suave y no dé tirones.
6. Que los números se lean sobre fotos claras y sobre fotos oscuras. La
   geometría a 860px de ancho está verificada por aritmética sobre el CSS —
   dos columnas con `gap:10px` y `padding:24px` a los lados dejan baldosas de
   401px, con `aspect-ratio` de respaldo 1.25 eso da 501px de alto, y
   `.hoja-numero{font-size:1.45rem}` son 23,2px (`css/luque.css`, sobre las
   líneas 1080-1088 y 1133-1140)—, pero el contraste del número sobre una
   foto concreta (razonado, no medido por mí en esta tarea: la cifra que
   circula en el trabajo previo del bloque es 1,07–1,28:1 sostenido por la
   sombra del texto) sólo lo puede juzgar quien lo mire en pantalla, y con
   las fotos reales del estudio ese número cambiará de todos modos.
7. Que tocar un trabajo abra el visor de escritorio —es lo esperado en este
   bloque— y que la URL de arriba pase a `#/<id>`.
8. Que girar el teléfono a horizontal y volver a vertical no pierda el sitio
   por el que se iba.
9. Que abrir `#/editorial` directamente muestre sólo los trabajos de esa
   categoría, numerados 04, 05 y 06, sin el amarillo por delante. Comprobado
   en `contenido.json`: `editorial` son, en el orden de la lista, `bruma`
   (posición 4), `salitre` (5) y `oleaje` (6), y `MovilHoja` no renumera al
   filtrar (`tests/pruebas-movil-hoja-filtrar.js`, «filtrar NO renumera: bruma
   sigue
   siendo el 02» prueba lo mismo sobre otra categoría), así que el número que
   verá Ángel en cada tarjeta filtrada es el de su posición en la lista
   completa de doce.
10. **Que el pellizco de dos dedos AMPLÍE sobre el amarillo**, y que tirar
    hacia abajo sobre él siga sin recargar. Añadido en la ronda de arreglos de
    la revisión final del bloque 4e; va al final para no correr la numeración
    de los nueve de arriba, que están citados por su número más de una vez.

    Las dos cosas cuelgan de la misma declaración, `touch-action` sobre
    `body.es-movil .hoja-hero` (`css/luque.css`, sobre la línea 1235), que pasó
    de `none` a `pinch-zoom` justamente para devolver el zoom sin devolver el
    tirón: `none` declina TODOS los gestos del navegador, y ese elemento es
    `position:fixed; inset:0`, o sea la pantalla entera mientras la puerta está
    puesta, así que apagaba también el ampliar — que es una necesidad de
    accesibilidad, no un capricho.

    **El cambio se aplicó sin poder verificarlo aquí, y por eso está en esta
    lista y no dado por bueno.** `Input.synthesizePinchGesture` no mueve el
    `pageScale` en Chrome headless bajo emulación ni siquiera sobre una página
    sin `touch-action` ninguno: el control falla, así que la medición no vale
    para nada y no hay forma de comprobarlo sin un teléfono. Cuidado con la
    trampa que ya engañó una vez a quien lo midió: si la sonda hace un
    `Emulation.setPageScaleFactor` antes del pellizco, lo que se lee después es
    el valor forzado y parece que el pellizco funcionó. Si el pellizco no
    amplía, la sospechosa es esa línea del CSS y no el JavaScript.

Para repetirla: exponer el servidor a la red local
(`python -m http.server 8000 --bind 0.0.0.0`) y darle a Ángel
`http://<ip de la máquina en la red local>:8000/`. Si el teléfono no llega,
el sospechoso es el cortafuegos de Windows: dilo, no lo desactives.

**Aviso para quien mida el ancho del interruptor con Chrome headless en vez
de un teléfono:** `window.innerWidth` miente con la ventana emulada a móvil
—razonado, no medido de nuevo por mí en esta tarea, pero sí en el trabajo
previo de este bloque: con `Emulation.setDeviceMetricsOverride` a 390px de
ancho, `innerWidth` da 1204—. La causa buena es el `mobile:true` de esa
llamada, no el `devicePixelRatio`: un diagnóstico que circuló durante este
bloque atribuía la trampa al DPI y proponía `--force-device-scale-factor=1`
como arreglo, y era falso —`devicePixelRatio` vale 1 con y sin ese flag, e
`innerWidth` miente igual en los dos casos—. `matchMedia`, `clientWidth` y
`getBoundingClientRect` sí dan el valor correcto bajo la misma emulación. Lo
que sí comprobé yo en esta tarea: no es un problema del repositorio,
`innerWidth` no se usa en ningún `.js` ni `.html` del sitio (búsqueda sobre
todo el repositorio), así que ninguna medición de este bloque quedó
invalidada por esto; es sólo una trampa para quien mida el interruptor de
ancho (`js/movil.js`) sin un teléfono delante.

**La misma trampa, medida de nuevo en el bloque 4e con `--window-size` en vez
de `Emulation.setDeviceMetricsOverride`:** `chrome --headless
--window-size=390,844` **no** activa `mobile:true`. Con esa bandera sola,
medido contra `_medir.html` (borrador local, no en el repositorio), la ventana
sale a 504px de ancho —ni 390 ni el 1204 del aviso de arriba: otro número
falso, mayor que el pedido, distinto según lo que la página tenga cargado—, y
`getBoundingClientRect().right` de un botón con `right:18px` puesto por CSS
daba negativo. La única combinación que dio medidas de fiar en este bloque fue
CDP a mano —`ws = new WebSocket(...)` del propio Node 24, sin dependencias,
hablando `Emulation.setDeviceMetricsOverride({mobile:true, width:390,
height:844, ...})` seguido de `Page.navigate`— con `Network.setCacheDisabled`
puesto: sin eso, `python -m http.server` no manda `Cache-Control` (aviso 2 de
la cabecera del plan del bloque) y una segunda medición en la misma pestaña
recicla el CSS de la primera.

## El cuarto defecto del teléfono: el visor tardaba en abrirse (resuelto)

Lo vio Ángel el 2026-09-04, en la comprobación de la rama del 4e: el vuelo
salía de la miniatura correcta —eso sí lo arregló el bloque— pero **tardaba
tanto en arrancar que se perdía toda la fluidez**.

**No lo rompió el 4e.** `git log` sobre `js/visor-transicion.js` confirma que
la rama no tocó ese fichero; el parón viene de cuando se añadió la lupa. Lo
que hizo el 4e fue destaparlo: antes el vuelo móvil salía de un elemento con
`display:none` y rectángulo `{0,0,0,0}`, así que no había fluidez que echar de
menos. Esto último es razonado, no medido.

**La causa, medida.** `VisorTransicion.volar` no arrancaba el vuelo hasta que
la `<img>` de la escena estaba completa, y esa `<img>` pedía la foto a tamaño
completo — una URL que no está en ninguna caché, porque la rejilla enseña la
portada (`1200x1500`, 171 KB) y el visor pedía la pieza (`2400x3000`, 763 KB):
misma foto, URL distinta. Los 763 KB coinciden con la cifra que ya había
medida en el comentario de `js/visor.js` sobre la tira de miniaturas.

Medido con CDP a mano en móvil de verdad (`mobile:true`, 390x844) sobre
`#/niebla`, contando de `Visor.abrir` a la clase `viajando` en `#visor`:

| árbol | móvil 390x844 | escritorio 1280x800 |
|---|---|---|
| antes | 3439 y 3282 ms | 970 ms |
| después | 5 y 7 ms | 19 ms |

Las dos cifras de móvil son las dos corridas, en los dos órdenes y con perfil
de Chrome nuevo cada vez: sin perfil nuevo la segunda medición hereda las
fotos de la caché de la primera y el A/B no vale nada. Que la espera era la
causa se ve además en que el arranque del vuelo iba pegado al final de la
descarga: 1371 ms contra 1362 en la primera sonda.

**El arreglo** está en `js/visor-carga.js`: `vistaPrevia()` elige una URL que
el navegador YA tiene —la portada para la primera pieza, la miniatura de la
tira para las demás— y se pinta ésa; `relevar()` descarga la grande aparte y
la pone cuando llega. Sin ninguna de las dos, todo sigue como antes.

**Condición sobre el CONTENIDO, no sobre el código:** la previa y la plena
tienen que ser la misma foto en la MISMA PROPORCIÓN. `.visor-escena img` usa
`object-fit:contain` con `max-width/max-height:100%`, así que la caja pintada
la decide la proporción de la imagen: si no coinciden, el relevo da un salto a
mitad del vuelo. Desde el contenido real **lo garantiza la herramienta**:
`herramientas/derivar_imagenes.py` escala por el lado largo y NO recorta, así
que la portada y la pieza de una misma foto salen con la proporción del
original, la misma para las dos. La condición se cumple por construcción, no
por cuidado de quien genere los recortes.

**Comprobado en el teléfono de Ángel el 2026-09-04:** el vuelo arranca en el
acto y el relevo no se nota. Queda por tanto cerrado lo que la suite no podía
certificar sobre el parón.

**El indicador ya no se dibuja sobre una vista previa, y es la misma
comprobación quien lo pidió.** Ángel lo vio y le sobraba. Ahora el indicador
sigue a la `<img> DE LA ESCENA` y no a la descarga de la foto entera: se
enciende sólo mientras no hay nada que enseñar y se apaga en cuanto lo hay, así
que el relevo ocurre por debajo de una imagen ya visible sin taparla.
`relevar()` no toca el indicador a propósito. Lo fija
`tests/pruebas-visor-carga.js`, leyendo la clase SÍNCRONAMENTE después de
`pintar` con la previa precalentada — y comprobando antes que la previa esté de
verdad decodificada, porque si no lo estuviera no habría nada que tapar y la
prueba no mediría nada.

**Trampa que cazó a esta misma medición**, hermana de la del `display:none` de
más arriba: la sonda comprobaba que la rejilla estuviera cargada con
`document.querySelector('.hoja-celda img, .proj img')`. Una lista de selectores
devuelve el primero en ORDEN DEL DOCUMENTO, y las `.proj img` de la galería de
escritorio van antes; en móvil viven bajo `display:none`, no cargan nunca y
`complete` es falso para siempre. La sonda decía «rejilla sin cargar» en las
cuatro corridas y era mentira: inspeccionando el DOM hay 12 celdas con sus 12
`<img>`, y la primera da `complete:true` y `naturalWidth:1200`.

## El visor móvil de dos ejes (bloque 4f)

**La guarda de lado tiene dos mitades, una en cada visor.** Desde este bloque
hay dos suscriptores a `Router.alCambiar` compitiendo por la misma ruta: el
de `Visor.init` (`js/visor.js`) y `MovilVisor.aplicar` (`js/movil-visor.js`).
Cada uno mira `window.Movil.actual()` y se calla si no es su lado —el de
escritorio si vale `'movil'`, el móvil si no vale `'movil'`—, así que sólo
responde uno de los dos por cada cambio de ruta.

Que `Movil.actual()` ya tenga valor cuando las dos guardas corren no es
casualidad: en `index.html`, `window.Movil.init(...)` se llama ANTES que
`window.Router.init()`, y `Router.init()` avisa a sus suscriptores de forma
SÍNCRONA. Si el orden estuviera al revés, la primera ruta llegaría con
`Movil.actual()` a `null` y ninguna de las dos guardas la reconocería como
propia. Es la misma dependencia de orden que ya explica `js/visor-origen.js`
para el vuelo del visor, y que se repite aquí sin cambios: ordenar
`Movil.init` antes que `Router.init` es una condición que hay que conservar
si algún día se reordena `index.html`.

**La escena móvil no reutiliza `js/visor-carga.js`.** Aquel módulo resuelve el
mismo problema —pintar la portada ya cacheada antes de que llegue la pieza
grande— pero guarda su raíz en una variable de módulo propia. Llamarlo desde
la escena móvil la reapuntaría a ese marco, y el visor de escritorio se
quedaría con el indicador de carga atado a un elemento que ya no se ve en
cuanto se cruza el umbral de ancho con el visor abierto: el fallo concreto es
girar una tableta con el visor abierto, cruzando los 860px con la pieza a
medio cargar. `js/movil-visor.js` repite las mismas quince líneas en vez de
compartirlas, y lo dice en su propio comentario.

**La condición sobre el contenido, no sobre el código:** la portada y la
pieza tienen que ser la misma foto en la MISMA PROPORCIÓN. `.mvisor-foto`
usa `object-fit:contain`, así que la caja pintada la decide la proporción de
la imagen que hay dentro; si la portada y la pieza no comparten proporción,
el cambio de una a otra da un salto visible a mitad del vuelo. En el
contenido real la igualdad la garantiza `herramientas/derivar_imagenes.py`,
que escala por el lado largo y no recorta: las tres medidas de una foto salen
con la proporción del original. Ver la misma condición explicada arriba para
el visor de escritorio.

**Las dos cosas del sistema operativo, en `css/luque.css`:**

- La franja de los bordes que se queda el navegador. El HUD lleva
  `padding:1rem 24px` y no es decorativo: en Safari de iOS, arrastrar desde
  el borde izquierdo hacia dentro vuelve a la página anterior, y en Chrome de
  Android ocurre en los dos bordes; un control dentro de esa franja de ~20px
  sería imposible de pulsar sin que el navegador se llevara el gesto por
  delante. Los 24px dan margen sobre los 20.
- `overscroll-behavior-y:contain` sobre `.mvisor`. El gesto «foto anterior»
  empieza deslizando hacia abajo desde arriba, que es el mismo gesto que
  dispara el «tirar para recargar» de Chrome en Android; sin esto, el
  recorrido se interrumpiría con una recarga a mitad. Va acompañado de
  `touch-action:none` sobre el mismo elemento, para que el navegador no se
  quede con el desplazamiento ni el zoom por su cuenta dentro del visor —los
  dos ejes los interpreta `js/movil-gestos.js`— sin apagarlos fuera de él,
  donde la rejilla de la portada sí tiene que poder desplazarse con el dedo.

**Dos ganchos de clase que el HTML/JS ponen y que ningún CSS usa todavía**,
cotejadas todas las clases entre JavaScript y CSS en las dos direcciones:

- `mvisor-abierto`, que `js/movil-visor.js` añade a `<body>` al abrir el
  visor móvil y quita al cerrarlo. Se llama casi igual que `visor-abierto` del
  escritorio, que sí tiene reglas —esconde la barra de navegación—, así que
  conviene decirlo aquí para que nadie dé por hecho que ésta también hace
  algo. El candidato natural es bloquear el desplazamiento del cuerpo
  mientras el visor está abierto; queda sin decidir a propósito porque eso
  cambia la posición de desplazamiento al cerrar y el comportamiento de la
  barra de direcciones de una forma que sólo se puede juzgar en un teléfono
  de verdad, y esa comprobación está pendiente.
- `preloader-done`, anterior a este bloque: la pone `js/hero.js` al retirar el
  preloader, ningún CSS la usa, y lo único que la mira es
  `tests/pruebas-hero.js`, comprobando sólo que se pone. Queda fuera del
  alcance de este bloque, pero se anota aquí porque es el mismo patrón que
  `mvisor-abierto` y conviene no descubrirlo dos veces por separado.

### Lo que la suite no puede certificar sobre este bloque

No hay pruebas de CSS computado ni de gesto táctil en este repositorio, así
que lo que sigue sólo lo puede juzgar el estudio en un móvil real: **el
tacto de los gestos** —si el umbral de deslizamiento responde como se
espera al dedo—, **si 3 segundos es el plazo correcto** para ocultar el HUD,
y **si ese ocultado se siente elegante o se siente como que la web se apaga
sola**. Ninguna prueba puede decir ninguna de las tres.

Propias de este bloque, además:

- **La franja de los bordes hay que probarla en un iPhone de verdad.** En un
  navegador de escritorio encogido a 390px de ancho el gesto de «atrás» del
  sistema no existe, así que ese navegador no puede confirmar ni desmentir
  que los 24px de margen bastan; daríamos por buena una cifra que sólo se
  puede medir en el dispositivo real.
- **Girar el móvil con el visor abierto debe conservar la posición**: mismo
  proyecto, misma foto. En un teléfono de 390×844 girar a apaisado no cruza
  el umbral de 860px de `Movil.CONSULTA`, así que no se reconstruye nada y no
  hay nada que perder. En una tableta girar sí puede cruzar ese umbral —de
  vertical, bajo 860px, a apaisado, por encima—, y ahí la posición está sin
  comprobar: no hay un teléfono de prueba con esa anchura a mano, y ningún
  test de esta suite simula el cruce del interruptor con el visor móvil
  abierto.

### Una propiedad permanente del arnés de pruebas, no una anécdota de este bloque

**La suite no puede ver que falte un `<script>` en `index.html`.**
`tests/test.html` carga su propio juego de `<script>` —incluido
`js/movil-recorrido.js`— por su cuenta, así que una suite en verde no dice
nada sobre qué scripts carga `index.html` de verdad. Pasó de hecho en este
bloque: el primer commit de la Tarea 3 cableó `MovilRecorrido` al router sin
añadir su `<script>` a `index.html`, y la suite seguía dando verde porque
`tests/test.html` ya lo tenía cargado por su lado. En un móvil
real ese estado habría lanzado un `TypeError` en cuanto el dedo llamara a
`window.MovilRecorrido`. El segundo commit de la Tarea 3 añadió la línea que
faltaba. Es una propiedad de cómo está montado el arnés, no un descuido
puntual: cualquier bloque futuro que cablee un módulo nuevo tiene que
acordarse de `index.html` a mano, porque la suite no se lo va a recordar.

## El botón de ficha y la tira (bloque de la ficha y la tira)

**La ficha ya se puede pedir.** Hasta este bloque `js/movil-ficha.js` existía y
se pintaba, pero la única forma de llegar era deslizar hasta el final del eje
vertical: diez gestos en `la-boquerona`. Ahora hay una pastilla «Ficha» en el
HUD que llama a `MovilRecorrido.alternarFicha`, la función pura que decide a
qué parada lleva en cada sentido. **Quien recuerda la pieza de la que saliste
es `MovilVisor` (`piezaRecordada`), no `MovilRecorrido`**, que es puro y la
recibe como argumento.

La guarda que menos se ve y más importa de `alternarFicha`: `indexOf('ficha')`
NO es -1, porque 'ficha' es una parada del eje como cualquier otra. Sin tratar
ese caso aparte, una recordada de 'ficha' devolvería la ficha estando ya en la
ficha y el botón quedaría muerto. Tiene prueba propia.

**La tira de miniaturas vive en `js/movil-tira.js` y no comparte código con la
del escritorio.** Aquélla (`construirTira`, en `js/visor.js`) se despierta con
`mouseenter` y mide con el ratón encima, que en un dedo no existe.

**Tres reglas del CSS del visor la habrían dejado muerta**, y las tres se
contradicen en `.mvisor-tira` y sólo ahí: el `touch-action:none` que interpreta
el resto del visor (se devuelve `pan-x`), el `pointer-events:none` de
`.mvisor-hud` (se devuelve `auto`) y el encadenado del desplazamiento con el
gesto de «atrás» al llegar al final (`overscroll-behavior-x:contain`). El
`touch-action:none` de la primera vivía entero en `.mvisor` cuando se escribió
este párrafo; la ronda de la revisión final lo repartió entre los
descendientes que sí reciben el dedo, porque un `none` en `.mvisor` se
intersecaba con el `pan-x` de la tira y ganaba él. Ver la sección «El
`touch-action` se interseca con el de los ancestros», más abajo, con la
cadena medida.

**Y destapó un defecto que ya estaba:** `.mvisor-hud.dormido` sólo ponía
`opacity:0`, así que las pastillas del HUD dormido se podían pulsar sin verse.
Con una tira de miniaturas eso pasaba de rareza a trampa. Corregido con
`body.es-movil .mvisor-hud.dormido *{ pointer-events:none; }` — **en los
descendientes, no en el contenedor**: el contenedor ya lo tenía en `none` y un
hijo con `auto` lo recibe igual por mucho que el padre diga lo contrario. Con
el toque fuera de alcance cae en la raíz del visor, que es quien despierta el
HUD.

**`MovilTira.pintar` se llama en CADA parada pero sólo reconstruye al cambiar
de proyecto.** No es una optimización opcional: reconstruir en cada
deslizamiento tiraría las diez `<img>` ya descargadas para volver a pedirlas.
(No es, en cambio, que además se perdería el desplazamiento horizontal que el
dedo hubiera dejado puesto: `marcar` llama a `centrar` en cada parada y le
sobrescribe `scrollLeft` justo después, así que ese desplazamiento se pierde
igual, reconstruya o no. La razón que sostiene esto es sólo la de las
`<img>`.) Lo fija `tests/pruebas-movil-tira.js` por identidad de nodo, que es
lo único que distingue «sigue siendo el mismo botón» de «es otro botón
igual».

**`MovilTira.centrar` mide contra la caja de la TIRA y no con `offsetLeft`.**
El `offsetParent` de una miniatura no es la tira —que es `position:static`—
sino el HUD, que es absoluto; medido, eso metía un desfase constante de 24px,
el padding lateral del HUD (la octava miniatura de `la-boquerona` daba
`offsetLeft` 430 estando en realidad a 406 de la tira). Corregido con
`getBoundingClientRect()` sobre el botón y sobre la propia tira, que no
depende de quién sea el `offsetParent`.

**`MovilTira.centrar` escribe `scrollLeft` y no usa `scrollIntoView`**, a
propósito: aquél sólo puede mover la tira, y éste puede además desplazar el
documento entero. Dentro de un visor a pantalla completa eso se ve como que la
página salta sola.

**La tira metió sus botones en el ciclo del tabulador del visor, y eso rompió
dos pruebas preexistentes del atrapa-foco.** Las dos
(`tests/pruebas-movil-visor.js`, bloque «MovilVisor — el foco del diálogo
(VisorFoco)») clavaban `refs.cerrar` como «el último control», y con la tira
dentro del HUD, tras el botón de cerrar, el último pasó a ser la última
miniatura. **Se decidió que los botones de la tira SÍ tienen que estar en el
ciclo** —son la única forma de saltar a una pieza con teclado, y sacarlos
habría sido una regresión de accesibilidad—, así que lo que se arregló fueron
las pruebas: ahora calculan el último del DOM en vez de nombrarlo, con el
mismo selector Y el mismo filtro de visibilidad que `VisorFoco.enfocables`
(`js/visor-foco.js:52-59`), y con una aserción extra (`ultimoNoEsCerrar`) que
existe para que la prueba siga demostrando algo si algún día la tira saliera
del ciclo. Nombrar el último era fijar un dato incidental del marcado, y esas
dos pruebas se rompían cada vez que el HUD ganaba un control.

**Comprobación hecha en un NAVEGADOR DE ESCRITORIO con el viewport emulado
a 375×812, no en un teléfono**, sobre `#/la-boquerona`. Se dice con todas
las letras porque este documento avisa dos veces de lo que esa diferencia
cuesta: lo medido aquí son cajas, clases computadas y `elementFromPoint`,
que sí se pueden dar por buenos; el tacto del dedo y los gestos del sistema
no, y siguen enteros en la lista de más abajo. Lo medido: las 10
miniaturas salen, la actual con contorno `rgb(255,255,0)` y las demás con el
contorno transparente. Pulsar la octava navega a `#/la-boquerona/8`, el
contador pasa a `08/10`, la marca se mueve y **la tira NO se reconstruye** (el
nodo del primer botón es el mismo). `touch-action:pan-x`,
`overscroll-behavior-x:contain`, y `scrollWidth > clientWidth`, o sea que hay
recorrido que desplazar. **Con el HUD dormido**, `elementFromPoint` sobre una
miniatura devuelve `.mvisor-escena`: el toque atraviesa el HUD y cae en la
raíz del visor, que es quien lo despierta. **Con el HUD despierto** devuelve
la `<img>` de la miniatura. O sea que el defecto preexistente del
`opacity:0` queda cerrado y medido. El botón de ficha: ida y vuelta desde la
pieza 4 devuelve a la pieza 4, `aria-pressed` alterna, y las tres pastillas de
arriba no se pisan (24-109, 181-246, 317-351 a 375px de ancho, con los 24px de
margen a los bordes intactos).

### La ronda de la revisión final: la tira no se podía desplazar, y podía cambiar de trabajo

Dos hallazgos «Importante» de la revisión final de este bloque, los dos
medidos y cerrados.

**1. La tira no se podía desplazar con el dedo — cerrado.** El `touch-action`
efectivo de un punto se interseca con el de TODOS sus ancestros, y
`.mvisor` llevaba `touch-action:none`. Medido sobre `#/la-boquerona` a
375×812, antes del arreglo, la cadena hacia la tira era `pan-x` (tira) `∩
auto` (`.mvisor-hud-abajo`) `∩ auto` (`.mvisor-hud`) `∩ none` (`.mvisor`) =
`none`: la tira, con 574px de pista en un marco de 327, no se desplazaba con
el dedo y sólo se alcanzaban unas 5 de las 10 piezas.

El arreglo quita el `none` de `.mvisor` y lo reparte en cada descendiente
que SÍ recibe el dedo: `.mvisor-escena`, `.mvisor-hud-arriba` y
`.mvisor-hud-pie`. Los que se quedan en `auto` (`.mvisor`, `.mvisor-hud`,
`.mvisor-hud-abajo`) nunca ven un toque: `.mvisor-escena` cubre `.mvisor`
entero y se lleva el impacto primero, y `.mvisor-hud` y `.mvisor-hud-abajo`
son `pointer-events:none`. Medido tras el arreglo, con
Chrome headless en modo móvil de verdad (375×812) sobre `#/la-boquerona`:

| elemento | `touch-action` computado |
|---|---|
| `.mvisor` | `auto` |
| `.mvisor-hud` | `auto` |
| `.mvisor-hud-abajo` | `auto` |
| `.mvisor-escena` | `none` |
| `.mvisor-hud-arriba` | `none` |
| `.mvisor-hud-pie` | `none` |
| `.mvisor-tira` | `pan-x` |

La cadena de la tira ya no tiene ningún `none` por encima: `pan-x ∩ auto ∩
auto ∩ auto = pan-x`. `overscroll-behavior-y:contain` de `.mvisor` se deja
donde estaba: ésa no se interseca con los ancestros, así que no formaba
parte del problema.

**2. Arrastrar la tira podía colarse como cambio de proyecto — cerrado.**
`soltarEn` trata `pointercancel` como un deslizamiento terminado y navega
(defecto preexistente, ver «En el visor móvil, `pointercancel` decide
intención y navega», más abajo). Desplazar la tira es justamente lo que hace
que el navegador se quede el gesto y dispare ese `pointercancel`, así que la
tira convertía un defecto raro en uno cotidiano. **El arreglo no es el
`stopPropagation` que la spec proponía** —eso dejaría pasar el `pointerup`/
`pointercancel` y descuadraría el contador de dedos de `MovilGestos`, que es
peor que el problema que arregla—: `engancharGestos`
(`js/movil-visor.js`) filtra por ORIGEN en los cuatro oyentes de la raíz. Un
dedo cuyo `pointerdown` cae dentro de `.mvisor-tira` se marca en un mapa de
módulo (`deLaTira`) y ni entra en `punteros` (el mapa del pellizco) ni en
`MovilGestos`; su `pointerup`/`pointercancel` sólo borra la marca, sin llamar
a `soltarEn`. Cubierto por dos pruebas nuevas en
`tests/pruebas-movil-visor.js` que despachan `pointerdown` + `pointerup` (y,
por separado, `pointerdown` + `pointercancel`) sobre un botón de la tira con
un recorrido que sobre la foto navegaría, y comprueban que el router no
recibe nada.

El defecto de fondo de `soltarEn` —que sigue sin distinguir soltar de que el
sistema quite el gesto— NO se arregla aquí: sigue abierto y documentado más
abajo. Lo que se cierra es que la tira ya no sea uno de sus disparadores.

### Lo que la suite no puede certificar de este bloque

No hay pruebas de CSS computado ni de gesto táctil, así que esto sólo lo puede
juzgar quien lo mire en un teléfono de verdad:

1. Si una tira de miniaturas sobre la foto se siente útil o se siente como que
   tapa el trabajo. Es un estudio de fotografía: los píxeles que tapan la foto
   se pagan caros, y esta decisión es de Lidia y de Ángel.
2. Que el botón de ficha esté donde la mano lo busca, y que las tres pastillas
   de arriba no se aprieten en un teléfono estrecho.

## El panel tiene tres pantallas (bloques 3c y 3d)

**Desde el PR #13 (2026-09-11) el panel tiene tres pantallas y no una:** la
lista de proyectos (bloque 3b), la pantalla de un proyecto (3c) y la de
publicar (3d). Cuál se ve lo decide `panel/js/rutas.js` a partir del fragmento
(`#/proyecto/<id>`, `#/publicar`), y `panel/js/pantallas.js` esconde las
otras con `hidden`. Los planes están en
`docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md` y
`…-panel-publicar-bloque-3d.md`, y los dos anotan al final lo que salió
distinto al ejecutarlos.

**Las pruebas del panel llevan su propia copia del marcado** (la constante
`HTML` de `tests/pruebas-panel.js`), con sólo los `id`. Un nodo nuevo que
`panel.js` busque al arrancar va en DOS sitios, `panel/index.html` y esa
copia; sin el segundo, la sección entera del panel cae en el iframe. La suite
en verde no demuestra que `panel/index.html` tenga el nodo.

**Las dos comprobaciones manuales en producción siguen pendientes:** la Tarea 9
del plan 3c (16 puntos: subir 40 MB, girar, teclado, portada…) y la Tarea 5 del
3d (publicar). Son de Ángel.

## La pantalla del proyecto, vestida (bloque de la pantalla del proyecto)

**La pantalla de un proyecto del panel existe desde el bloque 3c y hace todo lo
que el spec pedía; hasta este bloque no tenía diseño.** El formulario de la
ficha no tenía ni una regla de CSS —sólo las tenía el de crear—, la portada se
marcaba con un borde amarillo sobre una página amarilla, y desde dentro de un
proyecto no había botón de guardar: había que volver a la lista.

**Ahora hay dos botones de guardar y son el mismo `guardar()`.** `#guardar` en
la lista y `#pGuardar` en la barra fija al pie de la pantalla del proyecto, y
`panel.js` los apaga y los enciende a la vez con `guardarActivo` —al arrancar y
tras un conflicto de versiones—. Quien añada un tercer camino que toque
`disabled` en uno de ellos tiene que pasar por esa función.

**El aviso de la pantalla del proyecto (`#pAviso`) vive en esa barra**, no en la
cabecera: en un teléfono, mientras se ordena la rejilla, arriba no se veía.

**La celda de la rejilla es una rejilla de cuatro columnas** (`44px 1fr 1fr
44px`) repartida por `grid-template-areas` según el `data-accion` de cada
botón. Los cuatro botones siguen siendo hijos directos del `<li>`, que es lo
que pulsan las pruebas. Quien añada un quinto control tiene que darle su área.

**El `<input type="file">` está oculto a la vista y NO al tabulador.** Se
esconde con el patrón de «visualmente oculto» (`.visualmente-oculto`) y la
etiqueta hace de botón; `display:none` lo sacaría del recorrido con Tab y la
subida dejaría de existir sin ratón, que es el criterio de aceptación 6.

**Los botones de la celda miden 44px en todas las anchuras**, no sólo en el
teléfono. Lidia sube desde el ordenador y retoca desde el móvil, y el arrastre
nativo (`draggable`) que usa `fotos.js` no funciona con el dedo: en el teléfono
‹ › no son el atajo, son el único camino. El arrastre táctil propio se
descartó a propósito (spec, «Lo que este bloque NO hace»).

**Un `grid-column: span 2` sobre una rejilla de una columna NO es inofensivo.**
La spec y el plan afirmaban que «no hace nada»; medido a 375px, `.ficha`
computaba `222px 222px` y la página desbordaba en horizontal: el `span`
obliga a crear una segunda columna implícita, dimensionada por el contenido
(los `<input>` miden ~220px como mínimo). El arreglo es
`.campo--ancho{ grid-column: auto; }` dentro del `@media (max-width: 600px)`.
Es exactamente el tipo de trampa que este documento existe para no
descubrir dos veces.

**Dos `box-shadow` de la misma especificidad no se suman.** `.celda--portada`
(anillo doble) y `.celda--marca-antes`/`.celda--marca-despues` (marca de
inserción) podían coincidir en la misma celda al arrastrar sobre la portada, y
la marca borraba el anillo. Se resolvió con `.celda--portada.celda--marca-antes`
y `.celda--portada.celda--marca-despues`, que escriben las sombras juntas.

### Lo que la suite no puede certificar de este bloque

`tests/test.html` no carga `panel/css/panel.css`. Comprobado por el controlador
en un navegador de escritorio con el viewport emulado a 1100 y a 375px, con las
diez fotos de `la-boquerona` inyectadas y sin imágenes (en local no hay
`img/`): lo medido son cajas y estilos computados, no tacto ni aspecto real; lo
que sólo puede juzgar quien lo abra en producción, y va a la misma lista que
dejó el bloque 3c (su Tarea 9):

1. Que la barra fija no tape la última fila de fotos al llegar abajo.
2. Que en un teléfono de verdad quepan dos columnas con los cuatro botones
   pulsables sin acertar de milagro.
3. Que la portada se distinga a un golpe de vista, con fotos claras y oscuras.
4. Que la zona de soltar se entienda como tal sin leerla.
5. Que el foco con Tab se vea en cada botón de la celda negra.

## Cómo se prueba

`tests/test.html` ejecuta **672 comprobaciones** (medido tras el bloque de la
pantalla del proyecto vestida: eran 668 antes de la rama, y este bloque
añadió 4). Antes de esa cuenta, la de 522 era la medida tras la ronda de la
revisión final del bloque de la ficha y la tira: las 3 nuevas de esa ronda son
las de `engancharGestos` filtrando por origen y la guarda «ya estoy aquí» de la
tira, descritas más arriba. El 519 de antes de esa ronda, y el 468 de este
párrafo —medido el 2026-09-11 tras retirar las 18 de `brillo.js`— ya estaba
obsoleto antes de que ese bloque tocara nada: la suite arrancó en 491, no en
468, así que la diferencia con las 519 no la trae este bloque entero; lo que
sí trae son 28, entre `tests/pruebas-movil-tira.js`
y el resto del cableado del botón de ficha. No restes 519−468 y creas que
salen 51: la cuenta de 468 llevaba tiempo sin actualizarse. La lógica pura (el enrutado,
la validación de datos, el cálculo de la composición filtrada, la máquina de
estado del visor, el salto del hero, el identificador que se saca del título,
el reordenado de la lista), desde el bloque 4a el panel entero — lo que antes
quedaba fuera por tocar el DOM —, desde el bloque 4b la capa impura de
`Router.ir`, que hasta entonces no tenía ninguna prueba, desde el bloque 4c
los tres módulos puros del móvil, desde el bloque 4d el interruptor de ancho
(`js/movil.js`) y la hoja móvil —rejilla y filtrado, en
`tests/pruebas-movil-hoja-*.js`—, desde el bloque 4e el arrastre de la hoja
(`tests/pruebas-movil-arrastre.js`) y la puerta del hero, que se mudó de
`movil-hoja.js` a `js/movil-puerta.js` con sus pruebas
(`tests/pruebas-movil-puerta.js` y `tests/pruebas-movil-puerta-async.js`,
antes `...-hoja-hero...`), y desde la ronda de arreglos de la revisión final
del 4e el envolvente de foco del visor (`tests/pruebas-visor-foco.js`, la única
sección que carga `js/visor.js`) y las dos que fijan que al soltar el dedo no
quede estilo en línea clavando la hoja, y desde el arreglo del parón al abrir
el visor las siete de `tests/pruebas-visor-carga.js`. Y desde el bloque 4f, el
visor móvil de dos ejes: `tests/pruebas-movil-visor.js` (27 comprobaciones,
`js/movil-visor.js`: `ordenDe`, `aplicar` con su guarda de lado y
`siguienteRuta`) y `tests/pruebas-movil-hud.js` (11 comprobaciones,
`js/movil-hud.js`: el contador, la categoría activa y el ocultado a los
3000ms). Y desde el bloque de la ficha y la tira, `tests/pruebas-movil-tira.js`
(`js/movil-tira.js`: pintar, reconstruir sólo al cambiar de proyecto, centrar
la miniatura activa) y las pruebas nuevas de `alternarFicha` sobre
`js/movil-recorrido.js`. Y desde el contenido real, el botón que lleva al vídeo
(`tests/pruebas-plataforma.js`), el hueco de la ficha
(`tests/pruebas-ficha-dato.js`) y el `contenido.json` de verdad
(`tests/pruebas-contenido-real.js`, que lo pide por `fetch` y lo pasa por su
propia validación, así que necesita servidor).

**Histórico, del 2026-09-10 — no es la cuenta vigente; la vigente es la de
más arriba (672).** Queda por lo que explica del método de medir, no por la
cifra: medido ese día con Chrome headless (`--virtual-time-budget=15000
--dump-dom`) contra `tests/test.html` servido por `python -m http.server`,
con el registro CRECIENDO antes de medir, la línea final decía «464 pasan, 0
fallan». La cuenta anterior a ésa, del 2026-09-05, era 400.

**Y hay tres pruebas que NO están aquí, porque son Python y se lanzan a
mano:** `tests/prueba_derivar.py` (las partes puras de la herramienta de
derivación), `tests/prueba_auditar_rutas.py` y `tests/pesar_imagenes.py`, que
mide contra un servidor de verdad y por eso necesita `--origen`.

**Divergencia declarada, no arreglada:** el techo de 300 líneas por archivo no
se respeta en `tests/`. `tests/pruebas-movil-visor.js` tiene 641,
`tests/prueba-borrador.js` 523 y `tests/pruebas-panel.js` 422. Se decidió
dejarlo: partir uno solo de los tres no arregla nada y el techo se pensó para
el código del sitio, que sí lo cumple.

### La trampa del arnés que da PASA sin comprobar nada

**`prueba()` es SÍNCRONA.** Llama a su función dentro de un `try` y apunta PASA
en cuanto vuelve (`tests/arnes.js`). Si esa función **devuelve una promesa**, lo
que se compruebe dentro de su `.then` no lo ve el arnés: la promesa se cae al
suelo, y su fallo se pierde como rechazo no gestionado. La prueba sale en verde
con el código roto, y encima cuenta como comprobación.

Ocurrió de verdad. Las dos pruebas asíncronas de `tests/pruebas-visor-carga.js`
—el relevo y la huérfana— se escribieron así el 2026-09-04, y **no comprobaban
nada**: daban PASA antes y después del arreglo. Se descubrió porque una prueba
nueva del indicador, escrita para fallar, salió en verde. El arreglo del visor
era bueno igualmente —lo respalda el A/B y la comprobación en el teléfono—,
pero su red de seguridad tenía dos agujeros.

**La forma correcta**, la de `tests/pruebas-movil-puerta-async.js` y ahora
también la de `tests/pruebas-visor-carga.js`: la espera va **fuera** de
`prueba()`, y `prueba()` se llama **dentro** del `.then` con la comprobación ya
síncrona. Regla para reconocerlo de un vistazo: **si ves un `return` de una
promesa dentro de `prueba(...)`, esa prueba no comprueba nada.**

Si las cuentas con `grep -c "prueba("` te van a salir **407**, no 400. La
diferencia son siete coincidencias que no llegan a ejecutarse como prueba —el
mismo recuento que ya daba esta diferencia antes del bloque 4f, porque
ninguno de sus dos archivos nuevos añade una coincidencia que no se ejecute—:
dos viven en `tests/pruebas-arnes-dom.js`, en la rama de éxito de dos cargas
que están diseñadas para fallar —nunca se ejecutan; están ahí para que la
sección se ponga en rojo si algún día la carga deja de fallar—; tres viven en
`tests/arnes.js` —un comentario que menciona `prueba()`, la línea
`function prueba(nombre, fn) {` que define la propia función, y una llamada
de repliegue que sólo corre si una sección `describeAsync` lanza, cosa que no
pasa con la suite en verde—; una es un comentario de
`tests/pruebas-galeria.js` que también nombra `prueba()`; y la séptima es el
aviso sobre `prueba()` de la sección de arriba, escrito en
`tests/pruebas-visor-carga.js`. El número que cuenta es el que imprime la
suite al pie.

**Lo que comprueba cada uno de los tres módulos del móvil (72 comprobaciones,
bloque 4c):**

- **`movil-recorrido.js` (32 pruebas)** — que en un proyecto de vídeo bajar
  llegue a la ficha en un solo gesto y no en dos; que en el último proyecto
  seguir deslizando hacia delante no salga al vacío, y en el primero, hacia
  atrás; que un gesto que no es ninguna de las cuatro direcciones deje el
  estado intacto; que `desdeRuta` y `aRuta` se deshagan la una a la otra sobre
  cinco estados distintos (la ida y vuelta con el router no pierde nada); que
  ni `mover` —en las cuatro direcciones— ni `aRuta` modifiquen el estado que
  reciben; y, en una prueba aparte con su propia lista, que `inicial`, `mover`
  y `desdeRuta` no modifiquen el orden. Dos pruebas de borde, añadidas en la
  revisión final del bloque: `paradas(1)` —el proyecto de una sola foto que la
  rejilla de pruebas nunca había ejercitado— da `[1, 'ficha']` y no
  `[null, 'ficha']`; y con una rejilla cuyo primer proyecto es de vídeo,
  `inicial` da su vídeo (`pieza: null`), no la pieza `1` que daría siempre en
  la rejilla habitual, que empieza por un proyecto de fotos.
- **`movil-gestos.js` (22 pruebas)** — la zona muerta: 12px en diagonal no es
  un deslizamiento. Dos pruebas de borde fijan la **geometría** alrededor de
  cada número —justo en `UMBRAL` hay deslizamiento y un píxel por debajo no;
  justo en `TOQUE` hay toque y un píxel por encima no—, pero conviene saber
  qué protegen y qué no: están escritas contra `MovilGestos.UMBRAL` y
  `MovilGestos.TOQUE` en vivo, así que se adaptan solas al valor que tengan.
  Comprobado mutando el módulo: con `UMBRAL` en 30 en vez de 24, y con `TOQUE`
  en 14 en vez de 10, las dos siguen pasando. **Lo que impide mover esos
  números sin querer es otra prueba distinta**, «los tres números están
  expuestos y son los que dice el plan», que los clava con literales
  (`igual(MovilGestos.UMBRAL, 24)`). Avisa en las dos mutaciones, y en la de
  `UMBRAL` es la única que lo hace: corriendo las 22 a mano, `UMBRAL` de 24 a
  30 deja en rojo sólo ésa, mientras que `TOQUE` de 10 a 14 deja dos —también
  «el radio del toque es un círculo, no un cuadrado», que usa el punto literal
  `(208, 308)`, de hipotenusa 11,31, y con `TOQUE` en 14 pasa a caer dentro
  del radio—. Si algún día la de los literales parece redundante al lado de
  las de borde y alguien la borra, para `UMBRAL` no queda nada. Además: que un
  segundo dedo a mitad de arrastre cancele el deslizamiento en curso y lo
  convierta en pellizco, y que soltar sin haber presionado no invente una
  intención.
- **`brillo.js` (18 pruebas; RETIRADO el 2026-09-11, ver arriba)** — el umbral, con el mismo reparto de papeles que
  en `movil-gestos.js` y por la misma razón: una prueba de borde escrita contra
  `Brillo.UMBRAL` que fija la geometría (justo en el umbral es oscuro, justo
  por encima claro) y se adapta sola, y otra aparte, «el umbral está en la
  mitad, y eso queda fijado aquí», que lo clava con literales
  (`igual(Brillo.UMBRAL, 0.5)`, más `0.6` y `0.4` a pelo). Comprobado mutando
  el módulo y corriendo las dieciocho a mano: con `UMBRAL` en 0,8 la de borde
  sigue pasando y la de literales es la única de las dieciocho que se pone en
  rojo — que es justo lo que su propio comentario en `tests/pruebas-brillo.js`
  ya avisaba. Y el camino de degradación: que una medición que lanza (el caso
  real de hoy, un lienzo manchado) o que devuelve un número inservible caiga a
  `'halo'` sin propagar la excepción, que ese fallo quede registrado con el
  mensaje original y con qué se hizo en su lugar, y que si el propio registro
  también lanza, la decisión no se vea arrastrada. Dos pruebas de borde,
  añadidas en la revisión final del bloque: con una medición que da
  exactamente `0` sale `'oscuro'` y con una que da exactamente `1` sale
  `'claro'`, y en ninguno de los dos casos se registra nada — sin esto,
  `v >= 0 -> v > 0` y `v <= 1 -> v < 1` en `utilizable` sobrevivían, y una foto
  de negro puro habría disparado el halo con un aviso de fallo sobre una
  medición perfectamente correcta.

**Hay dos arneses.** `tests/arnes.js` es el de siempre, para funciones puras.
`tests/arnes-dom.js` es el segundo, con tres niveles:

- `ArnesDom.conElemento(html, fn)` — mete `html` en un `<div>` fuera de
  pantalla (conectado al documento, no suelto: `focus()` y las medidas sólo
  funcionan así) y pasa su primer elemento a `fn`. Lo usa `Lista.pintar`
  (`tests/pruebas-lista-pintar.js`), que recibe su contenedor como parámetro y
  no necesita más.
- `ArnesDom.conDocumento(opciones, fn)` — para lo que no expone nada y se
  ejecuta al cargarse, como `panel/js/panel.js`: una IIFE que llama a `init()`
  en su última línea. Escribe `opciones.html` en un iframe, pone
  `opciones.globales` en su `window` **antes** de cargar ningún script —
  `panel.js` llama a `Borrador.cargar()` durante su propia carga, así que un
  doble puesto después llegaría tarde—, carga `opciones.scripts` en orden
  esperando a cada uno y llama a `fn(ventana, documento)`. Lo usa
  `tests/pruebas-panel.js`, que carga el panel entero con `Borrador` y
  `confirm` doblados y con `Lista`, `Orden`, `Identificador` y
  `ReglasContenido` de verdad — probar el panel contra dobles de sus propias
  piezas comprobaría el doble, no el panel.
- `ArnesDom.conPagina(opciones, fn)` — el tercero, del bloque 4b, para el
  código que mira la URL. `conDocumento` no sirve ahí: escribe el documento con
  `document.write`, y `document.open()` navega a `about:blank`, lo que borra el
  fragmento y además hace que `history.replaceState` lance. `conPagina` carga un
  archivo de verdad (`tests/fijaciones/pagina-vacia.html`) con el hash puesto en
  el `src` **antes** de insertar el iframe: así el documento tiene URL propia, el
  hash llega, `replaceState` funciona y la primera carga no añade ninguna entrada
  al historial. Lo usa `tests/pruebas-router-ir.js`.

  **Las dos hermanas conviven a propósito**; no las unifiques sin revalidar las
  21 pruebas del panel, que dependen del camino de `conDocumento`.

Los niveles segundo y tercero son asíncronos (cargan scripts de verdad), así que
`tests/pruebas-panel.js`, `tests/pruebas-arnes-dom.js` y
`tests/pruebas-router-ir.js` usan `describeAsync` en vez de `describe`; el
recuento final espera a que todas las secciones asíncronas terminen. Ninguno
necesita Node.

**Lo que cubre `tests/pruebas-panel.js` (21 comprobaciones):** que arranca con
los controles deshabilitados antes de que llegue el borrador y se queda así si
la carga falla; que pinta una fila por proyecto y activa los controles cuando
llega; crear (con éxito, y rechazando un identificador repetido, con el
mensaje exacto); borrar (confirmado y cancelado); guardar (con su versión, el
aviso de éxito, y que se queda con la versión que devuelve el servidor) y el
conflicto (que desactiva "Guardar" y explica por qué). Y la que más faltaba:
que tras mover una fila el foco vuelve al mismo botón de la misma fila y no a
`<body>` — `Lista.pintar` reconstruye el `<ol>` entero, así que el nodo que
tenía el foco ya no existe —, con su borde: si ese botón queda deshabilitado
por llegar al extremo, el foco va al otro botón de la misma fila.

**Lo que sigue sin cubrirse, y por qué:**

- El camino que llama a `calcularHasta` desde un `drop` real sí está probado
  (`tests/pruebas-lista-pintar.js`, disparando `dragstart`+`drop` con
  `clientY` sobre la caja medida de la fila). Lo que ningún arnés de esta
  rama dispara es `dragover`, así que `marcar` — la marca visual de dónde
  caería la fila mientras se arrastra, antes de soltar — no se ejercita
  nunca.
- La guarda que evita apilar un oyente de `dragleave` en cada repintado
  (`vigilarSalidaDeLaLista`).
- El reinicio del estado de arrastre (`origenArrastre`, `filaMarcada`) en cada
  `pintar`.
- El fallback de categoría desconocida en `Lista.pintar` (cuando una fila trae
  una categoría que no está en `ETIQUETAS`).
- **La normalización `pieza === undefined ? null : pieza`, en el cuerpo de
  `Router.ir` (`js/router.js`, sobre la línea 128), no la protege ninguna
  prueba**, y se decidió a sabiendas no escribirle una.
  Cambiarla por `pieza || null` deja la suite entera en verde, porque para
  distinguir las dos formas hay que pasarle un valor *falsy* —`0`, `''`,
  `false`, `NaN`— y de todos ellos el único que un llamador razonable escribiría
  es `0`, que además no es una pieza válida: se cuentan desde 1, igual que el
  contador `02 / 08`. Ninguna prueba pasa ninguno de los cuatro. Escribir una
  prueba con `0` obligaría a afirmar que `#/bruma/0` es una URL correcta, que es
  precisamente lo que no queremos. Así que la línea la defiende su comentario y
  nada más, y queda anotado aquí para que quien la «simplifique» sepa que la
  suite no le va a avisar. Si algún bloque futuro admite la pieza `0`, esto pasa
  de nota a fallo.
- **Nadie prueba que `galeria.js` y `visor.js` sigan hablando bien con el
  router.** Los dos llaman a `Router.ir` —`galeria.js` en el clic del menú de
  categorías y en el `Escape`, ambos dentro de `Galeria.init` (sobre las
  líneas 231-232 y 248), `visor.js:41,129,130`— y se suscriben con
  `Router.alCambiar`, y de ese empalme sigue sin haber ni una comprobación.

  Lo que ha cambiado desde la ronda de arreglos de la revisión final del bloque
  4e, para no dejar la frase más gorda de lo que es: `js/visor.js` **ya no está
  entero sin cobertura**. `tests/pruebas-visor-foco.js` lo carga de verdad —con
  el `#visor` sacado de `index.html` en vivo y `css/luque.css` puesta— y ejerce
  `init`, `abrir` y el envolvente de foco. Lo que sigue sin probarse es
  precisamente el empalme con el router: esa sección dobla la portada y nunca
  llega a `Router.ir`. `js/galeria.js` sí sigue entero sin cobertura.

  `hero.js` es el caso distinto, y conviene no confundirlo. Toca al router en un
  solo sitio, `js/hero.js:33`, y es **el único archivo del sitio que llama a
  `Router.rutaActual`**. Lo que hace con lo que recibe —`Hero.debeSaltarse`— sí
  está cubierto, con 5 comprobaciones en `tests/pruebas-hero.js`. Lo que no
  cubre nadie es el empalme: que `rutaActual()` le siga entregando un objeto con
  la forma que `debeSaltarse` espera.

  Por eso, en el bloque 4b se comprobaron a mano, una vez, con esta lista de
  seis, corriendo cada una en el código nuevo y en `c3dd54d` —el estado anterior
  al bloque— para comparar en vez de fiarse de la memoria:

  1. Filtrar por categoría (`js/galeria.js`, el clic del menú de categorías en
     `Galeria.init`, sobre las líneas 231-232): pulsar «editorial» deja la
     URL en `#/editorial` y la categoría activa; pulsarla otra vez vuelve a todos
     y deja la URL desnuda. **Idéntico en los dos.**
  2. Abrir un proyecto (`js/visor.js:41`): pulsar la tarjeta de *bruma* deja la
     URL en `#/bruma` y abre el visor. **Idéntico.**
  3. Cerrar el visor con una categoría activa (`js/visor.js:129-130`): vuelve a
     `#/editorial`, no a todos. **Idéntico.**
  4. El hero (`js/hero.js:33`): recargar con `#/bruma` salta la portada y abre el
     proyecto en `01 / 08`. **Idéntico.**
  5. El botón «atrás» dos veces: deshace el proyecto y luego el filtro, y no
     añade entradas al deshacer. **Idéntico, entrada por entrada.**
  6. `#/bruma/3`: **la única diferencia, y es la que el bloque existe para
     producir.** Antes la ruta no se entendía y caía a la portada general, con
     hero incluido; ahora abre *bruma* por su portada (`01 / 08`), sin error ni
     pantalla en blanco. Esa URL no la genera ninguna parte de la interfaz: sólo
     se llega a ella escribiéndola.

  Si algún día alguien repite esta comprobación, que repita **esta** lista y no
  una parecida.
- **El escritorio no lee el campo `pieza`.** `parsearRuta` sí lo analiza y lo
  transporta —`#/bruma/3` da `{tipo:'proyecto', valor:'bruma', pieza:3}`—, pero
  ningún consumidor de escritorio lo mira, así que la URL abre el proyecto por su
  portada. Es deliberado: la spec dice que el escritorio «podrá aprovecharlo» más
  adelante, y hacerlo en el bloque 4b habría cambiado comportamiento ya
  publicado.
- **La suite añade 1 entrada al historial del navegador por corrida** (medido:
  11 → 12 → 13 en tres corridas seguidas). Viene de la única prueba que navega de
  verdad —la de empujar, en `tests/pruebas-router-ir.js`— y no se puede evitar
  sin dejar de cubrir ese camino: el historial de un iframe *es* el de la página
  que lo contiene, y quitar el iframe no devuelve la entrada. Chrome tope el
  `history.length` en unas 50 por pestaña, así que no crece sin límite, pero sí
  ensucia el botón «atrás» de quien corre la suite muchas veces.
- **(Retirado el 2026-09-11; queda como historia.) El camino automático del brillo sigue sin verificarse, y nadie ha
  comprobado todavía que llegue a funcionar.** Medir la luminancia de verdad
  obliga a dibujar la foto en un `<canvas>` y leer el píxel con
  `getImageData`, y si el lienzo está manchado eso lanza una excepción de
  seguridad, que es el caso que `decidir` resuelve devolviendo `'halo'`. Lo
  que sí comprueban las pruebas de `brillo.js` —nueve de las dieciocho— es
  **la caída**: que ante esa excepción (o ante un número que no sirve)
  `decidir` devuelve `'halo'` y el fallo queda registrado. Lo que **no**
  comprueba ninguna es que la medición llegue a dar un número correcto sobre
  una foto de verdad. Y conviene ser exactos sobre cómo llega la medición en
  las dieciocho: cinco (`tests/pruebas-brillo.js:10, 14, 19, 28, 34`) no
  reciben ninguna medición — llaman a `Brillo.tratamiento` directamente, sin
  pasar por `decidir` —, otra le pasa `null` y `undefined` como `medir`
  (línea 89), y las doce restantes sí reciben la medición como una función
  sintética. En ninguna de las dieciocho se toca un lienzo.

  **El obstáculo del lienzo desapareció con el contenido real, y conviene no
  arrastrar el motivo viejo.** Todo este párrafo hablaba de CORS: que picsum
  mandaba `Access-Control-Allow-Origin` pero que ningún `<img>` del sitio pedía
  la imagen en modo CORS, y que por eso el lienzo se manchaba igual. Ya da
  igual: las rutas de `contenido.json` son relativas (`/img/...`), o sea del
  **mismo origen**, y una imagen del mismo origen no mancha el lienzo, con CORS
  o sin él. La cabecera de `js/brillo.js` sigue contando la historia vieja y
  hay que corregirla cuando el bloque 4g la toque.

  Lo que sigue sin comprobarse es lo otro, y es lo importante: que la medición
  dé un número correcto sobre una foto de verdad.

  Lo que eso deja abierto, y **no** he comprobado: si bastaría con poner
  `crossorigin="anonymous"` para poder medir ya, sin esperar a las fotos del
  estudio. Requiere probarlo en un navegador de verdad, y hoy no hay nada que
  probar: **ninguna llamada a `getImageData` llega a ejecutarse en el sitio**
  —el nombre sale dos veces, en el comentario de cabecera de `decidir`
  (`js/brillo.js`, sobre la línea 32) y en el de la prueba «un lienzo manchado
  da el halo en vez de propagar la excepción» (`tests/pruebas-brillo.js`,
  sobre la línea 71), y las dos son comentarios—, y al módulo no lo
  llama nadie (ver la entrada siguiente). La corrección de la cabecera de
  `js/brillo.js` queda para la ola que toque los `.js`.

  Nada de esto cambia la conclusión, que es la contramedida que la spec pide
  por escrito (`docs/superpowers/specs/2026-08-28-movil-design.md`, sección
  «Las esquinas se adaptan al brillo de la foto», el párrafo que empieza «El
  riesgo de esto», sobre las líneas 98-101): el camino automático
  está sin verificar, y sin esta anotación el halo puede quedarse puesto meses
  en producción sin que nadie note que la medición nunca llegó a funcionar.
- **Desde el bloque 4f esto ya no es cierto para dos de los tres: sólo
  `brillo.js` sigue sin que lo cargue ni lo llame ningún código** (y desde el
  2026-09-11 tampoco existe: retirado). Hasta el
  bloque 4f, `movil-recorrido.js`, `movil-gestos.js` y `brillo.js` se
  cargaban sólo desde `tests/test.html`. Ahora `index.html` nombra a
  `js/movil-recorrido.js` y `js/movil-gestos.js`, y `js/movil-visor.js` los
  llama de verdad: `MovilVisor.siguienteRuta` pasa por
  `MovilRecorrido.mover`, y `pointerdown`/`pointerup`/`pointercancel` sobre la
  raíz del visor alimentan `MovilGestos.presionar`/`soltar`. `brillo.js`
  sigue sin ninguna mención fuera de su propio archivo y de sus pruebas
  (comprobado buscando el nombre de archivo y el global `Brillo` en todos los
  `.js` y `.html` del repositorio); la razón está más arriba, en la sección
  del visor móvil, y en «El camino automático del brillo sigue sin
  verificarse»: sus esquinas adaptativas eran del bloque 4g. (Desde el
  contenido real las fotos son del mismo origen y el lienzo ya no se mancha;
  y desde el 2026-09-11 el visor de escritorio no tiene esquinas que teñir.
  Las dos cosas están dichas más arriba, en la sección del visor móvil.)
  El cuarto módulo puro del móvil, `js/movil-zoom.js`, nació ya cableado en el
  bloque 4g: lo nombran `index.html` y `tests/test.html`, y `js/movil-visor.js`
  lo llama en `pointerdown`/`pointermove` para el pellizco y el paseo.
- **Que el pellizco se sienta bien en un dedo de verdad sigue sin
  comprobarse.** Todo lo que ejercitan `tests/pruebas-movil-zoom.js` y el
  arnés de `movil-visor.js` son eventos de puntero sintéticos: ningún gesto de
  este bloque —pellizcar, pasear la foto ampliada, deslizar entre piezas— se
  ha probado con un dedo real. El tope de 6× (`MovilZoom.maxEscala`) y que
  soltar por debajo de 1× vuelva al encaje son decisiones tomadas sobre el
  papel, no medidas sobre un teléfono.
- **`MovilRecorrido.paradas` lee `piezas` como una cuenta, y en todo el resto
  del repositorio `piezas` es un array.** En `contenido.json`, en
  `Datos.PROYECTOS` y en lo que consume `Router.piezasPorId`
  (`js/router.js:96`, que hace `p.piezas.length`), `piezas` es la lista de
  piezas del proyecto. Dentro de `orden`, la lista `[{id, piezas}, …]` que
  recibe `movil-recorrido.js`, `piezas` es cuántas tiene: el número que ya
  espera `paradas()`. El contrato es correcto —está documentado en el propio
  `js/movil-recorrido.js`, justo donde se define la forma de `orden`—, pero
  nada obliga a quien cablee este módulo a convertir antes de pasar los datos.

  **El fallo, si no se convierte, es silencioso.** Pasando objetos con la
  forma real de `Datos.PROYECTOS` (`piezas` como array), `[objeto, objeto, …]
  >= 1` es `NaN >= 1`, `false`: `paradas()` trata cualquier proyecto de fotos
  como si fuera de vídeo. Los doce proyectos se convertirían en proyectos de
  vídeo, `#/bruma/3` abriría el vídeo en vez de la pieza 3, y **la suite de
  este bloque seguiría dando 271 (más las que se añadan) en verde**, porque
  todas sus pruebas pasan ya el número correcto a mano. Es exactamente el tipo
  de fallo que este proyecto vigila: pasa desapercibido y ninguna prueba se
  entera. Quien construya el bloque que cablea `MovilRecorrido` a
  `Datos.PROYECTOS` tiene que convertir explícitamente (`piezas.length`, no
  `piezas`) al construir `orden`.
- **Que girar el móvil no mueva la posición está probado sólo a medias.** Lo
  que `movil-recorrido.js` garantiza es la mitad genérica: la prueba «un gesto
  que no se reconoce no mueve nada» (`tests/pruebas-movil-recorrido.js`) le
  pasa a `mover` dos gestos que no son ninguna de las cuatro direcciones
  —`'diagonal'` y la cadena vacía— y comprueba que devuelve el estado intacto.
  No son todos los valores posibles, pero el código no tiene más ramas: lo que
  no cae en las cuatro direcciones sale por el `return estado` del final, así
  que un evento de giro tampoco movería la posición.

  **Esto ya no es del todo cierto: desde el bloque 4f `js/movil-visor.js`
  existe y sí guarda el estado (`aqui`) en vez de reconstruirlo en cada
  parada**, así que la mitad que faltaba —quien repinte tras el giro vuelve a
  *leer* el estado— está cubierta mientras el giro no cruce el interruptor de
  ancho: `MovilVisor.aplicar` sólo se llama desde `Router.alCambiar`, y girar
  el teléfono no cambia la ruta. Lo que sigue sin cubrir, y sin ninguna
  prueba que lo ejercite, es el caso de una tableta girando con el visor
  abierto y cruzando los 860px de `Movil.CONSULTA` a mitad de gesto: ni
  `Movil.init` ni `index.html` vuelven a llamar a `MovilVisor` al cruzar el
  interruptor de lado (revisado el cuerpo de las dos ramas, `movil` y
  `escritorio`, en `window.Movil.init` dentro de `index.html`), así que ese
  caso concreto sigue exactamente donde lo dejaba esta entrada: sin
  comprobar. El requisito de «que girar no mueva la posición»
  (`docs/superpowers/specs/2026-08-28-movil-design.md`, sección «Cómo se
  prueba», en la viñeta de `movil-recorrido.js`, sobre la línea 308) está
  cubierto para el caso normal —un teléfono, que nunca cruza el umbral al
  girar— y sin comprobar para el caso raro de una tableta que sí lo cruza.
- **`movil-gestos.js` no tiene todavía lo que hace falta para un acercamiento
  continuo.** Hoy sólo expone `presionar` y `soltar`: el pellizco llega como
  una etiqueta (`'pellizco'`) al levantar el último dedo, un instante único,
  no una distancia que crezca mientras los dos dedos se separan. La spec pide
  «acercamiento **continuo**, no un salto fijo» en su sección «Ampliar es
  pellizcar, no la lupa», sobre la línea 126, hasta los 2400px que da su
  sección «Lo que se construye», sobre la línea 57; y eso necesita la
  distancia entre los dos dedos **durante** el movimiento —no sólo al final—,
  que hoy no se guarda en ningún sitio:
  `presionar` no registra la posición del segundo dedo, y no existe ningún
  `mover`/`arrastrar` que la vaya actualizando. Lo mismo le falta para seguir
  el dedo durante un deslizamiento en curso, en vez de decidir la intención
  sólo al soltar. No es un defecto de este bloque —construye lo puro, y lo
  continuo es cosa de quien pinta—, pero es lo primero que se va a echar en
  falta al empezar el bloque que cablea el móvil.

  **Ese bloque ya llegó, y el acercamiento continuo se resolvió, pero no por
  aquí.** El bloque 4g añadió `js/movil-zoom.js` (módulo puro, la distancia y
  la escala) y el seguimiento de `pointermove` en `js/movil-visor.js`, que lo
  llama en cada movimiento mientras hay dos dedos en pantalla —sin tocar
  `movil-gestos.js`, que sigue exactamente como describe este párrafo—. Quien
  lea sólo este párrafo hoy concluiría que el pellizco continuo todavía no
  existe en el sitio; sí existe, sólo que vive en otro archivo.
- **Lo que ninguna prueba de este bloque puede decir, y que sólo puede juzgar
  el estudio en un móvil de verdad:** si los umbrales de gesto tienen el tacto
  correcto —si 24px (`MovilGestos.UMBRAL`) es el punto justo entre «no me
  responde» y «se me dispara solo»— y si el eje vertical se siente natural o
  como que el teléfono se resiste. El caso que sí está fijado por una prueba es
  el que la spec pone como ejemplo literal: 12px en diagonal no es un
  deslizamiento (`tests/pruebas-movil-gestos.js`, «un arrastre de 12px en
  diagonal NO es un deslizamiento»). Pero ese caso valida la geometría del
  umbral, no el tacto: que el número sea el correcto para un dedo de verdad no
  lo puede decir ninguna prueba escrita.
- **La rama `estado.proyecto === null` de `aRuta`
  (`js/movil-recorrido.js`, primera línea del cuerpo de `aRuta`, sobre la
  línea 83) no la ejercita ninguna prueba.** `aRuta` no se nombra en ningún
  otro archivo de `tests/`; dentro de `tests/pruebas-movil-recorrido.js` se
  llama desde cuatro sitios —las dos llamadas de «aRuta devuelve la forma
  exacta que entiende el router», la del bucle de «aRuta y desdeRuta se
  deshacen la una a la otra» y la de «ninguna función modifica el estado que
  recibe», sobre las líneas 165, 167, 178 y 210—,
  que son ocho llamadas contando el bucle de cinco estados de la ida y vuelta,
  y las ocho pasan un estado con `proyecto` puesto; en `en('reflejo', null)` el
  `null` es la *pieza*, no el proyecto. Ninguna llama a `aRuta(null)` ni a
  `aRuta({proyecto: null, ...})`. Comprobado instrumentando la rama sobre una
  copia del módulo y reproduciendo las ocho llamadas: se entra en ella cero
  veces. Es código de producción sin cobertura, no
  una prueba mentirosa: la rama existe para cuando `MovilRecorrido.inicial([])`
  devuelve `en(null, null)` con una lista de proyectos vacía, un caso que hoy no
  se llega a probar en `aRuta` aunque sí en `inicial`.

No hace falta cubrirlos para que el bloque cumpla su propósito, pero tampoco
hay que fingir que lo están.

**`file://` — un nivel comprobado, el otro no.** Que un script real se cargue
y ejecute dentro del iframe de `ArnesDom.conDocumento` bajo `file://` está
comprobado. Que la cadena completa de `panel.js` —cinco scripts encadenados—
haga lo mismo entera **no se ha podido comprobar** con las herramientas
disponibles para esta tarea: la navegación a `file://` quedó bloqueada en el
navegador usado para verificar. No es un fallo conocido, es una comprobación
pendiente — hay un aviso al lado de `<script src="pruebas-panel.js">` en
`tests/test.html` para quien lo descubra abriendo el archivo con doble clic.
Si esa sección no pinta nada, arranca un servidor y prueba por ahí:

```
python -m http.server 8000
```

y abre `http://localhost:8000/tests/test.html`.

Lo que ningún arnés puede ver, por diseño: nada que se mueva. Las
transiciones, el vuelo del visor, la recomposición del filtrado y el paneo con
inercia solo se pueden juzgar mirándolos en un navegador de verdad.

El arnés del navegador tampoco puede ver lo que habla con la red. `panel/js/borrador.js` necesita que
`fetch` esté sustituido, y eso el arnés del navegador no lo hace, así que su
prueba va aparte y sí necesita Node:

```
node tests/prueba-borrador.js
```

Son 15 escenarios y 52 comprobaciones sobre los cuatro finales de un guardado
—guardado, conflicto, petición mal formada y red caída—, sobre que el callback
de quien llama se invoque una sola vez aunque lance, sobre que ningún mensaje
en inglés del motor llegue a la pantalla, y sobre que el aviso de «no se ha
podido contactar con el servidor» nombre también la sesión caducada, que desde
el navegador es indistinguible de la red caída. Se le puede pasar otro archivo
como argumento para comprobar que las propias pruebas caen cuando el código
está roto; el porqué de todo esto está explicado en la cabecera del archivo.

## Estructura

El código está repartido en módulos de una responsabilidad cada uno, casi
ninguno por encima de 300 líneas. **La excepción, desde este bloque, es
`js/visor.js`: 303.** La guarda de lado de la Tarea 1 —comentario incluido—
lo subió desde 290; el propio comentario explica por qué la guarda hace
falta y no se acorta más sin perder esa explicación. No se sacó a otro
archivo porque son tres líneas y el resto del fichero es del visor de
escritorio, no del móvil; queda anotado aquí para que la próxima mano que
toque `js/visor.js` sepa que ya no hay margen y cualquier añadido nuevo
tiene que sacar algo primero.

**Y desde el bloque de la ficha y la tira, `js/movil-visor.js`: 463** (número
medido; el documento decía 428, desfasado). Ya
estaba en 390 antes de este bloque —el pellizco del 4g lo dejó así— y el
cableado de los dos controles nuevos lo sube. Se decidió **no partirlo en este
bloque**: la spec lo declara fuera de alcance y sacó la tira a
`js/movil-tira.js` precisamente para no añadirle más. Quien lo toque a
continuación tiene que partirlo antes de añadir nada; el candidato evidente es
el pellizco —`zoom`, `base`, `punteros`, `refrescarPar`, `medidasDelPaseo`,
`pintarZoom`—, que son unas ochenta líneas con estado propio y ninguna
relación con el router.

`contenido.json` es el único sitio donde vive
el contenido, y `js/datos.js` el único que lo custodia en memoria.
`js/router.js` es la única fuente de verdad sobre qué está abierto: la galería y
el visor reaccionan a él y no se llaman entre sí.

Un aviso para quien amplíe el visor: la navegación directa por hash entre
proyectos **no** pasa por el desmontaje (`rematar()`). Cualquier estado nuevo que
dependa del modo (foto o vídeo, ficha, lupa) tiene que auto-curarse en
`renderizar()`, como ya hacen la lupa, la ficha y el indicador de carga. Tres
fallos del desarrollo salieron de olvidar esto.
