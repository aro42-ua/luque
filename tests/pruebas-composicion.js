describe('Composicion.disponer', function () {
  prueba('devuelve una posición por proyecto', function () {
    igual(Composicion.disponer(3, 'amplio').length, 3);
    igual(Composicion.disponer(12, 'amplio').length, 12);
    igual(Composicion.disponer(5, 'compacto').length, 5);
  });

  prueba('es determinista: dos llamadas dan lo mismo', function () {
    igual(Composicion.disponer(9, 'amplio'), Composicion.disponer(9, 'amplio'));
  });

  prueba('no depende de cuántos vengan detrás', function () {
    var pocos = Composicion.disponer(3, 'amplio');
    var muchos = Composicion.disponer(30, 'amplio');
    igual(pocos[0], muchos[0]);
    igual(pocos[2], muchos[2]);
  });

  prueba('el modo amplio da un lienzo de 240vw y el compacto de 100vw', function () {
    igual(Composicion.tamano(12, 'amplio').ancho, 240);
    igual(Composicion.tamano(12, 'compacto').ancho, 100);
  });

  prueba('el lienzo crece con el número de proyectos', function () {
    cierto(Composicion.tamano(24, 'amplio').alto > Composicion.tamano(6, 'amplio').alto);
  });

  prueba('un modo desconocido es un error, no un lienzo raro', function () {
    var hubo = false;
    try { Composicion.disponer(3, 'mediano'); } catch (e) { hubo = true; }
    cierto(hubo);
  });

  prueba('todo cabe dentro del lienzo', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 1; n <= 40; n++) {
        var t = Composicion.tamano(n, modo);
        Composicion.disponer(n, modo).forEach(function (r) {
          cierto(r.x >= 0);
          cierto(r.y >= 0);
          cierto(r.x + r.w <= t.ancho + 0.001);
          cierto(r.y + r.w * 1.25 <= t.alto + 0.001);
        });
      }
    });
  });

  prueba('NINGÚN par se solapa, con cualquier número de proyectos', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 2; n <= 40; n++) {
        var rs = Composicion.disponer(n, modo);
        for (var i = 0; i < rs.length; i++) {
          for (var j = i + 1; j < rs.length; j++) {
            var a = rs[i], b = rs[j];
            var separados =
              a.x + a.w <= b.x + 0.001 || b.x + b.w <= a.x + 0.001 ||
              a.y + a.w * 1.25 <= b.y + 0.001 || b.y + b.w * 1.25 <= a.y + 0.001;
            cierto(separados);
          }
        }
      }
    });
  });

  prueba('las cajas no son todas iguales: la composición es irregular', function () {
    var anchos = {};
    Composicion.disponer(12, 'amplio').forEach(function (r) { anchos[r.w] = true; });
    cierto(Object.keys(anchos).length >= 4);
  });
});
