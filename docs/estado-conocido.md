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
- `router.js` calcula una variable que no se usa en la rama de «todos».
- El paneo con ratón sigue interpolando aunque el sistema pida movimiento
  reducido; el centrado por teclado sí lo respeta.

## Cómo se prueba

`tests/test.html` ejecuta **150 comprobaciones**: la lógica pura (el enrutado,
la validación de datos, el cálculo de la composición filtrada, la máquina de
estado del visor, el salto del hero, el identificador que se saca del título,
el reordenado de la lista) y, desde el bloque 4a, el panel entero — lo que
antes quedaba fuera por tocar el DOM.

**Hay dos arneses.** `tests/arnes.js` es el de siempre, para funciones puras.
`tests/arnes-dom.js` es el segundo, con dos niveles:

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

Ese segundo nivel es asíncrono (carga scripts de verdad), así que
`tests/pruebas-panel.js` y `tests/pruebas-arnes-dom.js` usan `describeAsync` en
vez de `describe`; el recuento final espera a que todas las secciones
asíncronas terminen. Ninguno de los dos necesita Node.

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

- El arrastrar y soltar de verdad (`dragstart`/`dragover`/`drop` con
  coordenadas de ratón) necesita eventos de arrastre reales del navegador, que
  ningún arnés de esta rama dispara. `calcularHasta`, la aritmética que
  traduce ese gesto a un índice, sí está probada — sin DOM, con números a
  mano —, pero el camino que la llama desde un `drop` real no.
- La guarda que evita apilar un oyente de `dragleave` en cada repintado
  (`vigilarSalidaDeLaLista`).
- El reinicio del estado de arrastre (`origenArrastre`, `filaMarcada`) en cada
  `pintar`.
- El `aria-label` de "bajar" en cada fila.
- El fallback de categoría desconocida en `Lista.pintar` (cuando una fila trae
  una categoría que no está en `ETIQUETAS`).

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

**Un par de comprobaciones del propio arnés parpadean en rojo alguna vez, sin
motivo de `panel.js`.** `tests/pruebas-arnes-dom.js` comprueba que
`ArnesDom.conDocumento` no deja ningún iframe suyo en el documento al
terminar, contando `.arnes-dom-caja` en todo el documento. Esa cuenta es
global, no de su propia sección: si otra sección `describeAsync` —como
`pruebas-panel.js`, que abre diez iframes seguidos— tiene uno abierto en el
instante exacto en que se hace la cuenta, sale en rojo sin que el panel tenga
ningún defecto. Ocurre porque `pruebas-panel.js` es la primera sección, aparte
de las pruebas del propio arnés, que usa `conDocumento`: antes nunca había
nadie más con quien coincidir. Queda anotado para quien toque
`tests/arnes-dom.js` o `tests/pruebas-arnes-dom.js`: esa comprobación debería
mirar sólo lo que ella misma creó, no todo el documento.

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
