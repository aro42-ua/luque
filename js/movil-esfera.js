window.MovilEsfera = (function () {

  /* La esfera de la portada móvil, en números. Puro: sin DOM y sin reloj —el
     tiempo entra como argumento, igual que en `js/movil-arrastre.js`—, así que
     todo lo que decide cómo gira se prueba sin un navegador que mueva nada.

     Convenio de ejes, el mismo en todo el módulo: `x` a la derecha, `y` hacia
     ARRIBA (al revés que la pantalla) y `z` hacia quien mira. El frente de la
     esfera es `[0, 0, 1]`. Los cuaterniones van como `[w, x, y, z]`. */

  var FRENTE = [0, 0, 1];
  var AUREO = Math.PI * (3 - Math.sqrt(5));

  /* Dos cifras, desde 01. Venía de `MovilHoja.numero`, que se retira con la
     rejilla: el número identifica el TRABAJO en la lista completa, no su
     sitio en la esfera, así que filtrar no lo cambia. */
  function numero(indice) {
    var n = indice + 1;
    return (n < 10 ? '0' : '') + n;
  }

  /* Espiral de Fibonacci: n puntos casi equidistantes sobre la esfera unidad.
     Se calcula del número de trabajos y no de una tabla, porque vendrán más
     y la esfera tiene que llenarse sola (decisión de Ángel, 2026-09-29).
     El ángulo empieza en 0 con coseno, así que con n = 1 el único punto cae
     justo delante y no hace falta girar nada. */
  function reparto(n) {
    var puntos = [];
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var t = i * AUREO;
      puntos.push([Math.sin(t) * r, y, Math.cos(t) * r]);
    }
    return puntos;
  }

  function mult(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]
    ];
  }

  function normalizar(q) {
    var l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  }

  function eje(ax, ay, az, angulo) {
    var s = Math.sin(angulo / 2);
    return [Math.cos(angulo / 2), ax * s, ay * s, az * s];
  }

  function rotar(q, v) {
    var p = mult(mult(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]);
    return [p[1], p[2], p[3]];
  }

  function cruz(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /* La rotación de arco mínimo que lleva el vector unidad `a` al `b`. El
     caso opuesto (a = −b) va aparte: ahí el producto vectorial es cero, el
     eje queda indefinido y la fórmula general daría un cuaternión nulo, que
     al normalizar se convierte en NaN. Cualquier eje perpendicular sirve. */
  function arco(a, b) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    if (d > 0.999999) return [1, 0, 0, 0];
    if (d < -0.999999) {
      var c = Math.abs(a[0]) < 0.9 ? cruz(a, [1, 0, 0]) : cruz(a, [0, 1, 0]);
      var l = Math.hypot(c[0], c[1], c[2]);
      return [0, c[0] / l, c[1] / l, c[2] / l];
    }
    var x = cruz(a, b);
    return normalizar([1 + d, x[0], x[1], x[2]]);
  }

  function slerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = [-b[0], -b[1], -b[2], -b[3]]; d = -d; }
    if (d > 0.9995) {
      return normalizar([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t,
                         a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]);
    }
    var th = Math.acos(d);
    var s = Math.sin(th);
    var wa = Math.sin((1 - t) * th) / s;
    var wb = Math.sin(t * th) / s;
    return [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1],
            wa * a[2] + wb * b[2], wa * a[3] + wb * b[3]];
  }

  /* El ángulo de giro que separa dos orientaciones. `q` y `−q` son la misma,
     de ahí el valor absoluto. */
  function distancia(a, b) {
    var d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
    return 2 * Math.acos(Math.min(1, d));
  }

  return {
    FRENTE: FRENTE,
    numero: numero,
    reparto: reparto,
    mult: mult,
    normalizar: normalizar,
    eje: eje,
    rotar: rotar,
    arco: arco,
    slerp: slerp,
    distancia: distancia
  };
})();
