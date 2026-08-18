window.Composicion = (function () {
  /* Las fotos son 4:5, así que el alto de una caja es su ancho por 1,25.
     El resto del sitio da esa proporción por supuesta (.proj usa
     aspect-ratio:4/5), así que aquí no se inventa: se respeta. */
  var PROPORCION = 1.25;

  /* La irregularidad es lo que hace que el espacio se sienta explorable y no
     tabulado. Sale de estas tres listas, que se recorren cíclicamente: nada de
     Math.random(), porque la composición tiene que ser idéntica en cada carga.
     Son fracciones del ancho y del alto de la celda. */
  var ANCHOS  = [0.62, 0.50, 0.56, 0.44, 0.60, 0.48];
  var SESGO_X = [0.06, 0.28, 0.14, 0.34, 0.02, 0.22];
  var SESGO_Y = [0.10, 0.02, 0.26, 0.14, 0.32, 0.06];

  /* amplio: el lienzo que se recorre con el ratón. 4 x 60 = 240vw, que es
     exactamente el ancho que tiene hoy el lienzo hecho a mano.
     compacto: la vista filtrada. 2 x 50 = 100vw, el ancho que ya usaba. */
  var MODOS = {
    amplio:   { columnas: 4, anchoCelda: 60 },
    compacto: { columnas: 2, anchoCelda: 50 }
  };

  /* El alto de celda no se elige a ojo: se calcula para que la caja más alta
     que puede caer en una celda quepa dentro con su sesgo incluido. Así el no
     solape es una propiedad de la construcción y no algo que haya que vigilar
     cada vez que alguien toque las listas de arriba. */
  function altoDeCelda(anchoCelda) {
    var maximo = 0;
    for (var i = 0; i < ANCHOS.length; i++) {
      var necesario = anchoCelda * ANCHOS[i] * PROPORCION / (1 - SESGO_Y[i]);
      if (necesario > maximo) maximo = necesario;
    }
    return Math.ceil(maximo);
  }

  function config(modo) {
    var m = MODOS[modo];
    if (!m) throw new Error('Modo de composición desconocido: ' + modo);
    return { columnas: m.columnas, anchoCelda: m.anchoCelda, altoCelda: altoDeCelda(m.anchoCelda) };
  }

  function disponer(cantidad, modo) {
    var c = config(modo);
    var salida = [];
    for (var i = 0; i < cantidad; i++) {
      var v = i % ANCHOS.length;
      var columna = i % c.columnas;
      var fila = Math.floor(i / c.columnas);
      salida.push({
        x: columna * c.anchoCelda + c.anchoCelda * SESGO_X[v],
        y: fila    * c.altoCelda  + c.altoCelda  * SESGO_Y[v],
        w: c.anchoCelda * ANCHOS[v]
      });
    }
    return salida;
  }

  function tamano(cantidad, modo) {
    var c = config(modo);
    var filas = Math.max(1, Math.ceil(cantidad / c.columnas));
    return { ancho: c.columnas * c.anchoCelda, alto: filas * c.altoCelda };
  }

  return { disponer: disponer, tamano: tamano };
})();
