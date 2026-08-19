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

## Desplegada

**La web está publicada en `https://luque.angelrubioortiz2005.workers.dev`.**
No es un proyecto de Cloudflare Pages —la cuenta no tiene ninguno—, sino un
Worker de Cloudflare con recursos estáticos, desplegado con `wrangler`. El
motivo del cambio de plan y el procedimiento completo están en
`docs/despliegue.md`.

Sigue **cerrada a los buscadores** por `robots.txt` y por la cabecera
`X-Robots-Tag: noindex`, y sin dominio propio, mientras el contenido siga
siendo de relleno y las tipografías sigan siendo Trial. Las fotos, como ya se
dice arriba, siguen siendo de picsum.

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

`tests/test.html` se abre con doble clic y ejecuta 53 comprobaciones sobre la
lógica pura: el enrutado, la validación de datos, el cálculo de la composición
filtrada, la máquina de estado del visor y el salto del hero. No hace falta Node
ni servidor.

Lo que ese arnés **no** puede ver, por diseño: nada que se mueva. Las
transiciones, el vuelo del visor, la recomposición del filtrado y el paneo con
inercia solo se pueden juzgar mirándolos en un navegador de verdad.

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
