/* La lupa cuenta con que, en modo lupa, la <img> nace en la esquina superior
   izquierda de la escena: `js/visor-lupa.js` trata x=0 como "borde izquierdo
   pegado" y calcula el centrado y los límites del arrastre a partir de ahí.

   ESO ERA FALSO. `.visor-escena` es un flex centrado, y una imagen a tamaño
   natural —más grande que la caja— queda centrada por layout ANTES de que la
   lupa aplique su translate. Medido el 2026-09-11 con una foto de 2000×3000 en
   una escena de 1312×700: `offsetLeft: -344, offsetTop: -1150`, y encima el
   módulo ponía `translate3d(-344px, -1150px)`. El mismo desplazamiento DOS
   veces: la vista arrancaba en la mitad inferior-derecha y la mitad
   superior-izquierda de la foto era inalcanzable arrastrando.

   La prueba fija la premisa del módulo con la hoja de verdad, no con una copia:
   si `css/luque.css` vuelve a centrar la escena en modo lupa, esto cae. La
   imagen lleva medidas en línea en vez de cargarse, porque lo que se mide es
   dónde la coloca el layout, no qué píxeles trae. */
describeAsync('VisorLupa — la escena no centra la foto en modo lupa', function () {

  var MARCADO =
    '<div class="visor lupa" style="position:relative;width:500px;height:300px">' +
    '<div class="visor-escena">' +
    /* min-* y no solo width/height: un <img> sin cargar no tiene tamaño
       intrínseco y el flex lo encogería hasta caber, que es justo lo que a una
       foto real —con su tamaño natural— no le pasa. */
    '<img alt="" style="width:2000px;height:3000px;min-width:2000px;min-height:3000px">' +
    '</div></div>';

  function conLaHoja(d) {
    return new Promise(function (ok, mal) {
      var l = d.createElement('link');
      l.rel = 'stylesheet';
      l.href = '../css/luque.css';
      l.onload = function () { ok(); };
      l.onerror = function () {
        mal(new Error('el arnés no pudo cargar css/luque.css. Esta sección '
          + 'necesita un servidor: python -m http.server'));
      };
      d.head.appendChild(l);
    });
  }

  return ArnesDom.conDocumento({ html: MARCADO }, function (w, d) {
    return conLaHoja(d).then(function () {
      var img = d.querySelector('.visor-escena img');
      var escena = d.querySelector('.visor-escena');

      prueba('la premisa: la imagen es mas grande que la escena', function () {
        cierto(img.offsetWidth > escena.clientWidth, 'la foto no desborda en ancho');
        cierto(img.offsetHeight > escena.clientHeight, 'la foto no desborda en alto');
      });

      prueba('en modo lupa la <img> nace en 0,0 de la escena', function () {
        igual([img.offsetLeft, img.offsetTop], [0, 0]);
      });
    });
  });
});
