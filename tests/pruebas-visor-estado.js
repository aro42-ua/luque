describe('VisorEstado', function () {
  function abierto() { return VisorEstado.abrir(VisorEstado.inicial(), 'bruma', 4); }

  prueba('el estado inicial está cerrado', function () {
    igual(VisorEstado.inicial(),
          { abierto: false, id: null, indice: 0, total: 0, lupa: false, ficha: false });
  });

  prueba('abrir empieza por la primera pieza', function () {
    igual(abierto(),
          { abierto: true, id: 'bruma', indice: 0, total: 4, lupa: false, ficha: false });
  });

  prueba('siguiente avanza una pieza', function () {
    igual(VisorEstado.siguiente(abierto()).indice, 1);
  });

  prueba('siguiente se detiene en la última y no da la vuelta', function () {
    var e = VisorEstado.irA(abierto(), 3);
    igual(VisorEstado.siguiente(e).indice, 3);
  });

  prueba('anterior se detiene en la primera', function () {
    igual(VisorEstado.anterior(abierto()).indice, 0);
  });

  prueba('irA recorta por debajo y por encima', function () {
    igual(VisorEstado.irA(abierto(), -5).indice, 0);
    igual(VisorEstado.irA(abierto(), 99).indice, 3);
  });

  prueba('con la lupa abierta no se navega', function () {
    var e = VisorEstado.alternarLupa(abierto());
    igual(VisorEstado.siguiente(e).indice, 0);
    igual(VisorEstado.anterior(VisorEstado.irA(e, 2)).indice, 2);
  });

  prueba('escapar sale primero de la lupa', function () {
    var e = VisorEstado.alternarFicha(VisorEstado.alternarLupa(abierto()));
    var tras = VisorEstado.escapar(e);
    igual(tras.lupa, false);
    igual(tras.ficha, true, 'la ficha debería seguir abierta');
    igual(tras.abierto, true, 'el visor debería seguir abierto');
  });

  prueba('escapar cierra después la ficha', function () {
    var e = VisorEstado.alternarFicha(abierto());
    var tras = VisorEstado.escapar(e);
    igual(tras.ficha, false);
    igual(tras.abierto, true, 'el visor debería seguir abierto');
  });

  prueba('escapar cierra el visor cuando no hay nada más', function () {
    igual(VisorEstado.escapar(abierto()), VisorEstado.inicial());
  });

  prueba('escapar sobre un visor cerrado no hace nada raro', function () {
    igual(VisorEstado.escapar(VisorEstado.inicial()), VisorEstado.inicial());
  });

  prueba('ninguna función modifica el estado que recibe', function () {
    var e = abierto();
    var copia = JSON.parse(JSON.stringify(e));
    VisorEstado.siguiente(e);
    VisorEstado.anterior(e);
    VisorEstado.irA(e, 2);
    VisorEstado.alternarLupa(e);
    VisorEstado.alternarFicha(e);
    VisorEstado.escapar(e);
    igual(e, copia, 'el estado original ha cambiado');
  });

  prueba('con el visor cerrado, ninguna función lo mueve', function () {
    var c = VisorEstado.inicial();
    igual(VisorEstado.siguiente(c), c);
    igual(VisorEstado.anterior(c), c);
    igual(VisorEstado.irA(c, 2), c);
    igual(VisorEstado.alternarLupa(c), c);
    igual(VisorEstado.alternarFicha(c), c);
  });
});
