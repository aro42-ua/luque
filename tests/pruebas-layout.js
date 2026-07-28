describe('posicionesCompactas', function () {
  prueba('devuelve una posición por proyecto', function () {
    igual(LayoutFiltrado.posicionesCompactas(3).length, 3);
    igual(LayoutFiltrado.posicionesCompactas(9).length, 9);
  });

  prueba('es determinista', function () {
    igual(LayoutFiltrado.posicionesCompactas(4), LayoutFiltrado.posicionesCompactas(4));
  });

  prueba('las seis primeras son las seis ranuras', function () {
    igual(LayoutFiltrado.posicionesCompactas(6), LayoutFiltrado.RANURAS);
  });

  prueba('ninguna de las seis primeras comparte posición', function () {
    var vistas = {};
    LayoutFiltrado.posicionesCompactas(6).forEach(function (p) {
      var clave = p.x + ',' + p.y;
      cierto(!vistas[clave], 'posición repetida en ' + clave);
      vistas[clave] = true;
    });
  });

  prueba('todas caben en el ancho del lienzo filtrado', function () {
    LayoutFiltrado.posicionesCompactas(6).forEach(function (p) {
      cierto(p.x + p.w <= LayoutFiltrado.ANCHO, 'se sale por la derecha: ' + p.x);
    });
  });

  prueba('la séptima repite la primera una vuelta más abajo', function () {
    var pos = LayoutFiltrado.posicionesCompactas(7);
    igual(pos[6].x, pos[0].x);
    igual(pos[6].w, pos[0].w);
    cierto(pos[6].y > pos[0].y, 'la séptima debería quedar por debajo');
  });
});

describe('altoLienzoFiltrado', function () {
  prueba('con tres proyectos vale 67', function () {
    igual(LayoutFiltrado.altoLienzoFiltrado(3), 67);
  });

  prueba('con siete proyectos vale 126', function () {
    igual(LayoutFiltrado.altoLienzoFiltrado(7), 126);
  });

  prueba('nunca decrece al añadir proyectos', function () {
    var previo = 0;
    for (var i = 1; i <= 12; i++) {
      var alto = LayoutFiltrado.altoLienzoFiltrado(i);
      cierto(alto >= previo, 'decreció al pasar a ' + i);
      previo = alto;
    }
  });
});
