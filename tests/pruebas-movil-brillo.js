/* Lo que este archivo prueba de verdad es la aritmetica, que es pura y no
   necesita navegador. El lienzo aparece solo en las dos ultimas, y con fotos
   fabricadas aqui mismo: el bloque 4c no pudo probar esto porque el lienzo se
   manchaba con las imagenes de picsum, y desde el contenido real las fotos son
   del mismo origen y ya no mancha. */
describe('MovilBrillo', function () {

  function rgba(lista) { return new Uint8ClampedArray(lista); }

  prueba('un pixel blanco da luminancia 1', function () {
    igual(MovilBrillo.luminanciaDe(rgba([255, 255, 255, 255])), 1);
  });

  prueba('un pixel negro da luminancia 0', function () {
    igual(MovilBrillo.luminanciaDe(rgba([0, 0, 0, 255])), 0);
  });

  /* Los coeficientes son los de BT.709, los mismos que usa el calculo de
     contraste de WCAG. Que el verde pese diez veces mas que el azul no es un
     detalle: con una media plana, un cielo azul saldria «claro» y el texto
     negro encima seria ilegible. */
  prueba('el verde pesa mucho mas que el azul', function () {
    igual([MovilBrillo.luminanciaDe(rgba([0, 255, 0, 255])),
           MovilBrillo.luminanciaDe(rgba([0, 0, 255, 255]))],
          [0.7152, 0.0722]);
  });

  prueba('la media de dos pixeles es la media de sus luminancias', function () {
    igual(MovilBrillo.luminanciaDe(rgba([255, 255, 255, 255, 0, 0, 0, 255])), 0.5);
  });

  /* Un bloque vacio no vale 0: valdria «negro», y las esquinas saldrian
     amarillas sobre una foto de la que no sabemos nada. Devolver null es lo
     que hace que `Brillo.decidir` caiga al halo. */
  prueba('un bloque vacio no da un numero inventado', function () {
    igual(MovilBrillo.luminanciaDe(rgba([])), null);
  });

  prueba('el promedio de las cuatro zonas es un solo veredicto', function () {
    igual(MovilBrillo.promedio([0.2, 0.4, 0.6, 0.8]), 0.5);
  });

  /* Si una sola zona no se pudo medir, el promedio de las otras tres seria una
     respuesta a una pregunta distinta. Mejor el halo. */
  prueba('una zona que no se pudo medir tumba el promedio entero', function () {
    igual(MovilBrillo.promedio([0.5, 0.5, null, 0.5]), null);
  });

  prueba('un promedio sin valores es null y no NaN', function () {
    igual(MovilBrillo.promedio([]), null);
  });

  // ---- El camino de degradacion -----------------------------------

  /* La contramedida obligatoria de la spec: el fallo se registra. Sin esto, el
     halo puede quedarse puesto meses en produccion sin que nadie note que la
     medicion nunca llego a funcionar. */
  prueba('una foto sin cargar da el halo y deja aviso', function () {
    var avisos = [];
    var img = new Image();
    var t = MovilBrillo.tratamientoDe(img, function (m) { avisos.push(m); });
    igual({ tratamiento: t, avisos: avisos.length }, { tratamiento: 'halo', avisos: 1 });
  });

  prueba('sin nada que medir tampoco revienta', function () {
    igual(MovilBrillo.tratamientoDe(null, null), 'halo');
  });
});

/* Las dos unicas pruebas de este bloque que dibujan de verdad en un lienzo.
   Las fotos se fabrican con un canvas y `toDataURL` en vez de pegar aqui un
   base64 a mano: asi se ve que color son leyendo el codigo, y una data: URI no
   mancha el lienzo, igual que no lo mancha una foto de lidialuque.com. */
describeAsync('MovilBrillo sobre fotos de verdad', function () {

  function fotoDeColor(color) {
    var c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    var ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    return new Promise(function (ok) {
      var img = new Image();
      img.addEventListener('load', function () { ok(img); }, { once: true });
      img.src = c.toDataURL();
    });
  }

  return Promise.all([fotoDeColor('#ffffff'), fotoDeColor('#000000')])
    .then(function (fotos) {
      prueba('una foto clara pide esquinas oscuras', function () {
        igual(MovilBrillo.tratamientoDe(fotos[0], null), 'claro');
      });
      prueba('una foto oscura pide esquinas amarillas', function () {
        igual(MovilBrillo.tratamientoDe(fotos[1], null), 'oscuro');
      });
    });
});
