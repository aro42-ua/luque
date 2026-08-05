# Estado conocido de la web

Recogido al integrar la rama del visor y la galería filtrable (agosto de 2026).
No son tareas pendientes urgentes: son cosas sabidas, decididas a conciencia o
aplazadas, que conviene tener a mano antes de tocar el código.

## Contenido de relleno

Los doce proyectos de `js/datos.js` son de ejemplo: imágenes de picsum, títulos y
fichas técnicas inventadas. Los archivos `video/*.mp4` no existen todavía, así que
los proyectos de videoclip y cortometraje muestran el póster sin poder reproducir.
Es la conducta esperada hasta que entre el trabajo real del estudio.

Añadir un proyecto real consiste en añadir un objeto a `js/datos.js` y nada más.
Las portadas se piden a 800×1000 y las piezas interiores a 2400×3000: la lupa
necesita que la pieza sea bastante mayor que la pantalla para tener recorrido, y
la portada solo se ve pequeña en la galería.

## Una cosa que conviene saber

**El código ya no depende de la red.** GSAP era la última librería y se eliminó al
rehacer la entrada del hero: solo quedaba usándose para dos fundidos del preloader,
que ahora son transiciones de CSS. Lo único que se sigue pidiendo fuera son las doce
fotografías de relleno de picsum, así que abrir el archivo sin conexión da una web
que funciona entera pero con todas las fotos rotas. Esa dependencia desaparece sola
en cuanto entren los archivos reales del estudio.

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

`tests/test.html` se abre con doble clic y ejecuta 51 comprobaciones sobre la
lógica pura: el enrutado, la validación de datos, el cálculo de la composición
filtrada, la máquina de estado del visor y el salto del hero. No hace falta Node
ni servidor.

Lo que ese arnés **no** puede ver, por diseño: nada que se mueva. Las
transiciones, el vuelo del visor, la recomposición del filtrado y el paneo con
inercia solo se pueden juzgar mirándolos en un navegador de verdad.

## Estructura

El código está repartido en módulos de una responsabilidad cada uno, ninguno por
encima de 300 líneas. `js/datos.js` es el único sitio donde vive el contenido.
`js/router.js` es la única fuente de verdad sobre qué está abierto: la galería y
el visor reaccionan a él y no se llaman entre sí.

Un aviso para quien amplíe el visor: la navegación directa por hash entre
proyectos **no** pasa por el desmontaje (`rematar()`). Cualquier estado nuevo que
dependa del modo (foto o vídeo, ficha, lupa) tiene que auto-curarse en
`renderizar()`, como ya hacen la lupa, la ficha y el indicador de carga. Tres
fallos del desarrollo salieron de olvidar esto.
