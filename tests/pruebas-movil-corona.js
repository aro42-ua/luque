/* MovilCorona es puro: dónde va cada foto de la corona alrededor de la portada
   de delante (spec docs/superpowers/specs/2026-09-30-esfera-corona-design.md).
   Se prueba con rectángulos: los centros y medidas que devuelve. */
describe('MovilCorona — dónde va cada foto', function () {

  var MARGEN = 16;

  /* La portada de delante en reposo, como la deja la esfera: centrada en
     (cx, cy) con el ancho de `MovilEsfera.geometria`. */
  function portadaEn(medidas) {
    var g = MovilEsfera.geometria(medidas);
    return { x: g.cx, y: g.cy, ancho: g.tesela, alto: g.tesela * 1.25 };
  }

  function caja(r) {
    return { izq: r.x - r.ancho / 2, der: r.x + r.ancho / 2,
             arr: r.y - r.alto / 2, aba: r.y + r.alto / 2 };
  }
  function seCruzan(a, b) {
    var p = caja(a), q = caja(b);
    return p.izq < q.der && q.izq < p.der && p.arr < q.aba && q.arr < p.aba;
  }

  var MOVIL = { ancho: 390, alto: 844 };
  var PEQUENO = { ancho: 320, alto: 568 };

  prueba('sin fotos no hay corona', function () {
    igual(MovilCorona.colocar(0, portadaEn(MOVIL), MOVIL).fotos, []);
  });

  prueba('la portada encoge al 70 % sin moverse', function () {
    var p = portadaEn(MOVIL);
    var r = MovilCorona.colocar(5, p, MOVIL).portada;
    igual([r.x, r.y], [p.x, p.y]);
    cierto(Math.abs(r.ancho - p.ancho * 0.7) < 1e-9 && Math.abs(r.alto - p.alto * 0.7) < 1e-9,
           r.ancho + '×' + r.alto);
  });

  prueba('da una foto por pieza, en 4:5', function () {
    var f = MovilCorona.colocar(10, portadaEn(MOVIL), MOVIL).fotos;
    igual(f.length, 10);
    f.forEach(function (x) { cierto(Math.abs(x.alto - x.ancho * 1.25) < 1e-9, 'proporción'); });
  });

  prueba('ninguna foto se sale de la pantalla, tampoco en una pequeña', function () {
    [MOVIL, PEQUENO].forEach(function (m) {
      [1, 5, 10].forEach(function (n) {
        MovilCorona.colocar(n, portadaEn(m), m).fotos.forEach(function (f, k) {
          var c = caja(f);
          cierto(c.izq >= MARGEN - 1e-9 && c.der <= m.ancho - MARGEN + 1e-9 &&
                 c.arr >= MARGEN - 1e-9 && c.aba <= m.alto - MARGEN + 1e-9,
                 m.ancho + '×' + m.alto + ' n=' + n + ' foto ' + k);
        });
      });
    });
  });

  prueba('ninguna foto pisa la portada ni a su vecina', function () {
    [1, 5, 10].forEach(function (n) {
      var r = MovilCorona.colocar(n, portadaEn(MOVIL), MOVIL);
      r.fotos.forEach(function (f, k) {
        cierto(!seCruzan(f, r.portada), 'n=' + n + ' foto ' + k + ' pisa la portada');
        if (n > 1) {
          var sig = r.fotos[(k + 1) % n];
          cierto(!seCruzan(f, sig), 'n=' + n + ' fotos ' + k + ' y ' + ((k + 1) % n));
        }
      });
    });
  });

  prueba('la primera va arriba, centrada sobre la portada', function () {
    var p = portadaEn(MOVIL);
    var f = MovilCorona.colocar(8, p, MOVIL).fotos[0];
    cierto(f.y < p.y, 'y ' + f.y);
    cierto(Math.abs(f.x - p.x) < 1e-6, 'x ' + f.x);
  });

  prueba('siguen el sentido de las agujas del reloj', function () {
    var f = MovilCorona.colocar(4, portadaEn(MOVIL), MOVIL).fotos;
    cierto(f[1].x > f[0].x && f[2].y > f[1].y && f[3].x < f[2].x, JSON.stringify(f));
  });
});
