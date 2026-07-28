window.LayoutFiltrado = (function () {
  var ANCHO = 100;
  var SALTO_Y = 78;
  var PROPORCION = 1.25;

  var RANURAS = [
    { x: 6,  y: 10, w: 22 },
    { x: 38, y: 34, w: 18 },
    { x: 66, y: 6,  w: 20 },
    { x: 12, y: 52, w: 19 },
    { x: 44, y: 72, w: 17 },
    { x: 72, y: 46, w: 21 }
  ];

  function posicionesCompactas(cantidad) {
    var salida = [];
    for (var i = 0; i < cantidad; i++) {
      var base = RANURAS[i % RANURAS.length];
      var vuelta = Math.floor(i / RANURAS.length);
      salida.push({ x: base.x, y: base.y + vuelta * SALTO_Y, w: base.w });
    }
    return salida;
  }

  function altoLienzoFiltrado(cantidad) {
    var maximo = 0;
    posicionesCompactas(cantidad).forEach(function (p) {
      var abajo = p.y + p.w * PROPORCION;
      if (abajo > maximo) maximo = abajo;
    });
    return Math.ceil(maximo + 10);
  }

  return {
    ANCHO: ANCHO,
    RANURAS: RANURAS,
    posicionesCompactas: posicionesCompactas,
    altoLienzoFiltrado: altoLienzoFiltrado
  };
})();
