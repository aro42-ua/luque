# Estado conocido de la web

Recogido al integrar la rama del visor y la galería filtrable (agosto de 2026).
No son tareas pendientes urgentes: son cosas sabidas, decididas a conciencia o
aplazadas, que conviene tener a mano antes de tocar el código.

## Contenido de relleno

**El contenido ya no está en `js/datos.js`, sino en `contenido.json`.** `js/datos.js`
pasó de contenerlo a custodiarlo: `js/contenido.js` pide el JSON, lo valida y se lo
entrega con `Datos.establecer()`. Si el archivo no llega o no valida, la galería sale
vacía con un aviso en pantalla (`Galeria.mostrarError`) en vez de callarse.

Los doce proyectos siguen siendo de ejemplo: imágenes de picsum, títulos y fichas
técnicas inventadas. Los proyectos de vídeo llevan `vimeo: null` hasta el bloque 4,
así que se ven con su póster y sin reproducción posible. Es la conducta esperada
hasta que entre el trabajo real del estudio.

Añadir un proyecto real consiste en añadir un objeto a la lista `proyectos` de
`contenido.json` y nada más.

**Cada foto se guarda en tres medidas, y no es capricho.** Cada una se pide donde
se ve, porque la diferencia entre la mayor y la menor es de casi cuarenta veces:

| Campo | Medida | Dónde se ve | Peso |
|---|---|---|---|
| `portada` | 1200×1500 | la galería, doce a la vez | 167 KB |
| `piezas[].url` | 2400×3000 | la foto grande del visor y la lupa | 746 KB |
| `piezas[].miniatura` | 200×250 | la tira del visor, a 52 px | 19 KB |

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
`X-Robots-Tag: noindex`, mientras el contenido siga siendo de relleno y las
tipografías sigan siendo Trial. Las fotos, como ya se dice arriba, siguen
siendo de picsum.

**Las tres tipografías son versiones Trial y su licencia probablemente no
cubre el uso público.** `ABCFavorit-Regular-Trial.otf`,
`ABCFavorit-Bold-Trial.otf` y `ABCFavorit-BoldItalic-Trial.otf` se distribuyen
para evaluación, no para un sitio público y menos aún el de un estudio
comercial. Hay que comprar la licencia web en Dinamo o sustituirlas antes de
anunciar la web. Es deuda conocida, no un descuido.

## Una cosa que conviene saber

**El código ya no depende de la red.** GSAP era la última librería y se eliminó al
rehacer la entrada del hero: solo quedaba usándose para dos fundidos del preloader,
que ahora son transiciones de CSS. Lo único que se sigue pidiendo fuera son las doce
fotografías de relleno de picsum, así que abrir el archivo sin conexión da una web
que funciona entera pero con todas las fotos rotas. Esa dependencia desaparece sola
en cuanto entren los archivos reales del estudio.

Con una excepción que conviene conocer: **sin conexión, un enlace directo a un
proyecto deja el visor a medias.** `js/visor-transicion.js:48-49` espera a que la
portada esté cargada (`img.complete` o su evento `load`) antes de volar la foto
hasta el visor. Si la imagen de picsum no llega nunca, `volar()` no se ejecuta, así
que abrir `#/bruma` sin conexión deja un diálogo abierto con opacidad 0 y el foco
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
`currentColor`. Así están el cursor y las cuatro esquinas.

## Detalles menores aplazados

Ninguno bloquea nada. Se anotan para que no se descubran dos veces:

- La rueda del ratón no está limitada en el visor: un gesto de trackpad puede
  avanzar más de una pieza.
- La ficha técnica muestra «Piezas: 1» en proyectos de vídeo.
- Al cerrar el visor, el nodo `<video>` permanece en la escena oculta, pausado.
- `renderizar()` recrea el `<video>` en cada llamada, así que recoger la ficha con
  `Esc` sobre un vídeo reinicia la reproducción.
- Con ocho o más piezas y una ventana muy estrecha (375 px), la tira de miniaturas
  se envuelve y solapa unos 20 px con la foto.
- El indicador de carga se dibuja por encima de la interfaz y de las esquinas.
- El paneo con ratón sigue interpolando aunque el sistema pida movimiento
  reducido; el centrado por teclado sí lo respeta.

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

## Cómo se prueba

`tests/test.html` ejecuta **271 comprobaciones**: la lógica pura (el enrutado,
la validación de datos, el cálculo de la composición filtrada, la máquina de
estado del visor, el salto del hero, el identificador que se saca del título,
el reordenado de la lista), desde el bloque 4a el panel entero — lo que antes
quedaba fuera por tocar el DOM —, desde el bloque 4b la capa impura de
`Router.ir`, que hasta entonces no tenía ninguna prueba, y desde el bloque 4c
los tres módulos puros del móvil.

Si las cuentas con `grep -c "prueba("` te van a salir **273**, no 271: dos de
esas llamadas viven en `tests/pruebas-arnes-dom.js`, en la rama de éxito de dos
cargas que están diseñadas para fallar. Nunca se ejecutan; están ahí para que la
sección se ponga en rojo si algún día la carga deja de fallar. El número que
cuenta es el que imprime la suite al pie.

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
- **`brillo.js` (18 pruebas)** — el umbral, con el mismo reparto de papeles que
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
- **`js/router.js:127`, la normalización `pieza === undefined ? null : pieza`,
  no la protege ninguna prueba**, y se decidió a sabiendas no escribirle una.
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
  router.** Los dos llaman a `Router.ir` —`galeria.js:196,197,213`,
  `visor.js:41,129,130`— y se suscriben con `Router.alCambiar`, y de eso no hay
  ni una comprobación: los dos archivos están enteros sin cobertura.

  `hero.js` es el caso distinto, y conviene no confundirlo. Toca al router en un
  solo sitio, `js/hero.js:33`, y es **el único archivo del sitio que llama a
  `Router.rutaActual`**. Lo que hace con lo que recibe —`Hero.debeSaltarse`— sí
  está cubierto, con 5 comprobaciones en `tests/pruebas-hero.js`. Lo que no
  cubre nadie es el empalme: que `rutaActual()` le siga entregando un objeto con
  la forma que `debeSaltarse` espera.

  Por eso, en el bloque 4b se comprobaron a mano, una vez, con esta lista de
  seis, corriendo cada una en el código nuevo y en `c3dd54d` —el estado anterior
  al bloque— para comparar en vez de fiarse de la memoria:

  1. Filtrar por categoría (`js/galeria.js:196-197`): pulsar «editorial» deja la
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
- **El camino automático del brillo sigue sin verificarse, y nadie ha
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

  **Cuidado con el motivo que se ha venido dando**, porque medido no se
  sostiene tal cual. Se ha escrito —en la cabecera de `js/brillo.js` y hasta
  ahora también aquí— que las fotos de picsum vienen «sin
  `Access-Control-Allow-Origin`». **Picsum sí lo manda**: pidiendo
  `https://picsum.photos/seed/luque11/200/250` con una cabecera `Origin`,
  responde `Access-Control-Allow-Origin: *`, tanto en el 302 como en la
  respuesta final de `fastly.picsum.photos`. Lo que de verdad mancharía el
  lienzo hoy es otra cosa: **ningún `<img>` del sitio pide la imagen en modo
  CORS** —buscando `crossorigin` y `crossOrigin` en todos los `.js` y `.html`
  del repositorio no sale ni una vez, ni como atributo del marcado ni como
  propiedad puesta desde JavaScript—, y sin eso el navegador ni siquiera hace
  la petición con CORS, así que el lienzo se mancha aunque el servidor lo
  hubiera permitido.

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
- **A los tres módulos del bloque 4c no los carga ni los llama ningún código
  todavía.** `movil-recorrido.js`, `movil-gestos.js` y `brillo.js` se cargan
  sólo desde `tests/test.html`: `index.html` no los nombra, y en `js/` y
  `panel/js/` no hay una sola mención fuera de los propios tres archivos
  (comprobado buscando los nombres de archivo y los globales
  `MovilRecorrido`, `MovilGestos` y `Brillo` en todos los `.js` y `.html` del
  repositorio; sólo salen ellos, sus tres archivos de pruebas y `test.html`).
  La spec y los planes de los bloques anteriores sí los nombran, como es
  normal, pero eso es prosa: no carga nada. Es deliberado: este bloque
  construye lo puro y el que sigue lo cablea a la pantalla. Mientras tanto el
  móvil sigue viendo exactamente lo mismo que antes, y una suite en verde aquí
  no dice nada sobre lo que se ve en un teléfono.
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
  que un evento de giro tampoco movería la posición. Lo
  que ninguna prueba comprueba —porque todavía no existe el archivo que lo
  haría: `js/movil-hoja.js`, `js/movil-visor.js` y `js/movil.js` no están en
  el repositorio— es que
  quien repinte tras el giro vuelva a *leer* ese estado en vez de
  reconstruirlo desde cero: eso es del bloque que pinta, y hasta entonces el
  requisito de «que girar no mueva la posición»
  (`docs/superpowers/specs/2026-08-28-movil-design.md`, sección «Cómo se
  prueba», en la viñeta de `movil-recorrido.js`, sobre la línea 308) está
  cubierto sólo por su mitad.
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

El código está repartido en módulos de una responsabilidad cada uno, ninguno por
encima de 300 líneas. `contenido.json` es el único sitio donde vive el contenido, y
`js/datos.js` el único que lo custodia en memoria.
`js/router.js` es la única fuente de verdad sobre qué está abierto: la galería y
el visor reaccionan a él y no se llaman entre sí.

Un aviso para quien amplíe el visor: la navegación directa por hash entre
proyectos **no** pasa por el desmontaje (`rematar()`). Cualquier estado nuevo que
dependa del modo (foto o vídeo, ficha, lupa) tiene que auto-curarse en
`renderizar()`, como ya hacen la lupa, la ficha y el indicador de carga. Tres
fallos del desarrollo salieron de olvidar esto.
