/* MovilEsfera es puro —sin DOM y sin reloj—, así que se prueba con números.
   `cerca` compara con tolerancia: los cuaterniones acumulan errores de coma
   flotante del orden de 1e-12 y `igual` exigiría la igualdad exacta. */
describe('MovilEsfera — números, cuaterniones y reparto', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }
  function cercaVec(a, b, tol, msg) {
    for (var i = 0; i < b.length; i++) cerca(a[i], b[i], tol, msg);
  }
  function largo(v) { return Math.hypot(v[0], v[1], v[2]); }

  prueba('numero da dos cifras desde 01', function () {
    igual([MovilEsfera.numero(0), MovilEsfera.numero(8), MovilEsfera.numero(11)],
          ['01', '09', '12']);
  });

  prueba('reparto(0) está vacío', function () {
    igual(MovilEsfera.reparto(0), []);
  });

  prueba('reparto(1) deja el único punto delante', function () {
    var p = MovilEsfera.reparto(1);
    igual(p.length, 1);
    cercaVec(p[0], [0, 0, 1]);
  });

  prueba('reparto(n) da n puntos sobre la esfera unidad, sin repetir', function () {
    [8, 20].forEach(function (n) {
      var p = MovilEsfera.reparto(n);
      igual(p.length, n);
      p.forEach(function (v) { cerca(largo(v), 1, 1e-9, 'largo'); });
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          var d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]);
          cierto(d > 0.2, 'los puntos ' + i + ' y ' + j + ' casi coinciden (' + d + ')');
        }
      }
    });
  });

  prueba('rotar con la identidad no mueve nada', function () {
    cercaVec(MovilEsfera.rotar([1, 0, 0, 0], [0.3, 0.4, 0.5]), [0.3, 0.4, 0.5]);
  });

  prueba('arco lleva un punto al frente', function () {
    var a = [0.6, 0, 0.8];
    cercaVec(MovilEsfera.rotar(MovilEsfera.arco(a, MovilEsfera.FRENTE), a), [0, 0, 1]);
  });

  /* El caso degenerado: el punto está justo detrás. Sin la rama especial,
     el producto vectorial es cero y el cuaternión sale NaN. */
  prueba('arco lleva al frente un punto que está justo detrás', function () {
    var q = MovilEsfera.arco([0, 0, -1], MovilEsfera.FRENTE);
    cercaVec(MovilEsfera.rotar(q, [0, 0, -1]), [0, 0, 1]);
  });

  prueba('slerp va de un extremo al otro y distancia mide el ángulo', function () {
    var a = [1, 0, 0, 0];
    var b = MovilEsfera.arco([1, 0, 0], MovilEsfera.FRENTE);   // 90° sobre Y
    cerca(MovilEsfera.distancia(a, b), Math.PI / 2);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 0), a), 0);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 1), b), 0);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 0.5), a), Math.PI / 4);
  });
});
