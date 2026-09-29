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

  /* Los números del movimiento. Afinarlos es trabajo de teléfono, no de
     suite: las pruebas fijan la forma (frena, se para, gana la más cercana),
     no estos valores.
     - TAU_INERCIA: cuánto tarda la velocidad en caer a un 37 %. 325 ms es la
       constante que usa el desplazamiento de iOS, y se siente familiar.
     - TAU_MUELLE: lo mismo para el asiento en la portada; corto para que se
       note como un encaje y no como una segunda inercia.
     - VEL_MAX: tope de giro (Review Focus 2). 0,02 rad/ms son ~1,1° por ms,
       un golpe de dedo enérgico; por encima sólo hay ruido de muestreo.
     - QUIETO_MS: si el dedo lleva este tiempo parado al soltar, no se lanza. */
  var TAU_INERCIA = 325;
  var TAU_MUELLE = 90;
  var UMBRAL_VEL = 0.0004;
  var UMBRAL_ANG = 0.001;
  var VEL_MAX = 0.02;
  var QUIETO_MS = 80;
  var QUIETA = { h: 0, v: 0 };

  function estado(q, vel, objetivo, animando) {
    return { q: q, vel: vel, objetivo: objetivo, animando: animando };
  }

  /* Gira alrededor de los ejes de la PANTALLA y no de los de la esfera: por
     eso la rotación nueva se multiplica por la izquierda. Si se multiplicara
     por la derecha, tras medio giro arrastrar a la derecha movería la esfera
     hacia la izquierda. */
  function girar(q, h, v) {
    return normalizar(mult(mult(eje(1, 0, 0, v), eje(0, 1, 0, h)), q));
  }

  function delante(e, puntos) {
    var mejor = -1;
    var mejorZ = -Infinity;
    for (var i = 0; i < puntos.length; i++) {
      var z = rotar(e.q, puntos[i])[2];
      if (z > mejorZ) { mejorZ = z; mejor = i; }
    }
    return mejor;
  }

  function traer(e, punto) {
    var p = rotar(e.q, punto);
    return estado(normalizar(mult(arco(p, FRENTE), e.q)), QUIETA, null, false);
  }

  function inicial(puntos) {
    var e = estado([1, 0, 0, 0], QUIETA, null, false);
    return puntos.length ? traer(e, puntos[0]) : e;
  }

  function apuntar(e, punto, reducido) {
    if (reducido) return traer(e, punto);
    return estado(e.q, QUIETA, traer(e, punto).q, true);
  }

  function acotar(vel) {
    var r = Math.hypot(vel.h, vel.v);
    if (r <= VEL_MAX) return vel;
    return { h: vel.h * VEL_MAX / r, v: vel.v * VEL_MAX / r };
  }

  /* Cruzar el ancho entero gira media vuelta (π). La velocidad se suaviza
     con la anterior porque las muestras de un dedo vienen con ruido, y con
     `ms = 0` —dos eventos en el mismo instante— no se toca: dividir por cero
     da Infinity, y un Infinity en la velocidad es un NaN en la esfera. */
  function arrastrar(e, dx, dy, ancho, ms) {
    var k = Math.PI / Math.max(ancho, 1);
    var h = dx * k;
    var v = dy * k;
    var vel = e.vel;
    if (ms > 0) {
      vel = acotar({ h: 0.7 * h / ms + 0.3 * e.vel.h, v: 0.7 * v / ms + 0.3 * e.vel.v });
    }
    return estado(girar(e.q, h, v), vel, null, false);
  }

  function asentar(e, puntos) {
    var i = delante(e, puntos);
    var quieta = estado(e.q, QUIETA, null, false);
    return i < 0 ? quieta : traer(quieta, puntos[i]);
  }

  function soltar(e, puntos, opciones) {
    if (!puntos.length) return estado(e.q, QUIETA, null, false);
    if (opciones.reducido) return asentar(e, puntos);
    var vel = opciones.msDesdeUltimo > QUIETO_MS ? QUIETA : e.vel;
    return estado(e.q, vel, null, true);
  }

  /* Un paso del reloj. Dos fases: primero la inercia, que frena por
     rozamiento; cuando la velocidad cae bajo el umbral, se fija como objetivo
     la portada más cercana y el muelle la encaja. Termina siempre con una
     portada exactamente delante. */
  function avanzar(e, ms, puntos) {
    if (!e.animando) return e;
    if (!puntos.length) return estado(e.q, QUIETA, null, false);
    if (e.objetivo === null) {
      if (Math.hypot(e.vel.h, e.vel.v) > UMBRAL_VEL) {
        var f = Math.exp(-ms / TAU_INERCIA);
        return estado(girar(e.q, e.vel.h * ms, e.vel.v * ms),
                      { h: e.vel.h * f, v: e.vel.v * f }, null, true);
      }
      e = estado(e.q, QUIETA, asentar(e, puntos).q, true);
    }
    var q = slerp(e.q, e.objetivo, 1 - Math.exp(-ms / TAU_MUELLE));
    if (distancia(q, e.objetivo) < UMBRAL_ANG) return estado(e.objetivo, QUIETA, null, false);
    return estado(q, QUIETA, e.objetivo, true);
  }

  /* Dónde y cómo de grande. El lado de referencia es el corto, con el alto
     rebajado a tres cuartos para dejar sitio al pie: así en apaisado la
     tesela de delante (alto = 1,25 × ancho) sigue cabiendo. El centro va un
     poco por encima de la mitad por la misma razón.
     PERSPECTIVA es la distancia del ojo en radios: con 3, la de delante sale
     a 1,5 veces su tamaño plano y la de detrás a 0,75, o sea que la de
     detrás mide la mitad que la de delante. */
  var PERSPECTIVA = 3;

  function geometria(medidas) {
    var lado = Math.min(medidas.ancho, medidas.alto * 0.75);
    return {
      radio: lado * 0.62,
      tesela: lado * 0.56,
      cx: medidas.ancho / 2,
      cy: medidas.alto * 0.45
    };
  }

  function acotar1(n) { return Math.max(-1, Math.min(1, n)); }
  function grados(rad) { return rad * 180 / Math.PI; }

  /* La luz es lineal por tramos y no una curva: 1 delante, 0,5 en el
     ecuador, 0,15 detrás, que es lo que dice la spec, y se lee sin
     calculadora. La inclinación es la mitad del ángulo real de la cara:
     entera, las teselas del borde se verían de canto y dejarían de ser
     fotos. */
  function proyectar(e, puntos, medidas) {
    var g = geometria(medidas);
    var sFrente = PERSPECTIVA / (PERSPECTIVA - 1);
    return puntos.map(function (punto) {
      var p = rotar(e.q, punto);
      var s = PERSPECTIVA / (PERSPECTIVA - p[2]);
      return {
        x: g.cx + p[0] * g.radio * s,
        y: g.cy - p[1] * g.radio * s,
        escala: s / sFrente,
        luz: p[2] >= 0 ? 0.5 + 0.5 * p[2] : 0.5 + 0.35 * p[2],
        z: Math.round((acotar1(p[2]) + 1) * 500),
        inclinacion: {
          x: grados(Math.asin(acotar1(p[1]))) * 0.5,
          y: grados(Math.asin(acotar1(p[0]))) * 0.5
        },
        visible: p[2] > 0
      };
    });
  }

  var DIRECCIONES = {
    derecha: [1, 0], izquierda: [-1, 0], arriba: [0, 1], abajo: [0, -1]
  };

  /* La vecina en una dirección, para las flechas del teclado y la rueda con
     movimiento reducido: de las que caen dentro de un cono de 60° hacia ese
     lado, la más cercana al frente. Se aceptan también las de detrás: son la
     siguiente en esa dirección siguiendo la esfera. */
  function vecina(e, puntos, direccion) {
    var i = delante(e, puntos);
    var d = DIRECCIONES[direccion];
    if (i < 0 || !d) return i;
    var mejor = i;
    var mejorAngulo = Infinity;
    for (var j = 0; j < puntos.length; j++) {
      if (j === i) continue;
      var p = rotar(e.q, puntos[j]);
      var l = Math.hypot(p[0], p[1]);
      if (l < 1e-6) continue;
      if ((p[0] * d[0] + p[1] * d[1]) / l < 0.5) continue;
      var angulo = Math.acos(acotar1(p[2]));
      if (angulo < mejorAngulo) { mejorAngulo = angulo; mejor = j; }
    }
    return mejor;
  }

  return {
    FRENTE: FRENTE,
    VEL_MAX: VEL_MAX,
    numero: numero,
    reparto: reparto,
    mult: mult,
    normalizar: normalizar,
    eje: eje,
    rotar: rotar,
    arco: arco,
    slerp: slerp,
    distancia: distancia,
    inicial: inicial,
    delante: delante,
    traer: traer,
    apuntar: apuntar,
    arrastrar: arrastrar,
    soltar: soltar,
    avanzar: avanzar,
    geometria: geometria,
    proyectar: proyectar,
    vecina: vecina
  };
})();
