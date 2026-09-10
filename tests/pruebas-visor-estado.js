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

  /* DEVUELVE EL MISMO OBJETO, y no uno nuevo con el mismo indice. No es una
     sutileza: `js/visor.js` hacia `estado = siguiente(estado); renderizar();`
     sin mirar, y `renderizar` vacia la escena con `innerHTML = ''` y vuelve a
     construir la <img>. En la ultima pieza, pulsar la flecha derecha
     reconstruia la MISMA foto desde cero y se veia PARPADEAR. La identidad es
     lo que permite a quien llama saber que no hay nada que repintar; el modulo
     ya usaba este idioma con el visor cerrado, mas abajo. */
  prueba('en la ultima, siguiente devuelve el mismo objeto', function () {
    var e = VisorEstado.irA(abierto(), 3);
    cierto(VisorEstado.siguiente(e) === e, 'ha devuelto un objeto nuevo');
  });

  prueba('en la primera, anterior devuelve el mismo objeto', function () {
    var e = abierto();
    cierto(VisorEstado.anterior(e) === e, 'ha devuelto un objeto nuevo');
  });

  prueba('irA al indice en el que ya se esta devuelve el mismo objeto', function () {
    var e = VisorEstado.irA(abierto(), 2);
    cierto(VisorEstado.irA(e, 2) === e, 'ha devuelto un objeto nuevo');
  });

  /* Y cuando SI cambia, un objeto nuevo: el estado es inmutable y quien lo
     tenga guardado no debe ver cambiar el suyo bajo los pies. */
  prueba('cuando el indice cambia, el objeto es otro', function () {
    var e = abierto();
    cierto(VisorEstado.siguiente(e) !== e, 'ha devuelto el mismo objeto');
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
