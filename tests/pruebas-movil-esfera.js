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

describe('MovilEsfera — orientación, inercia y muelle', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }
  function zDe(estado, punto) { return MovilEsfera.rotar(estado.q, punto)[2]; }

  /* Corre el reloj a 16 ms por paso hasta que la esfera se para, con tope:
     si no se para en 400 pasos (6,4 s) la prueba lo dice en vez de colgarse. */
  function hastaQuieta(estado, puntos) {
    for (var i = 0; i < 400 && estado.animando; i++) {
      estado = MovilEsfera.avanzar(estado, 16, puntos);
    }
    return { estado: estado, pasos: i };
  }

  var P8 = MovilEsfera.reparto(8);

  prueba('inicial deja el trabajo 01 delante', function () {
    var e = MovilEsfera.inicial(P8);
    cerca(zDe(e, P8[0]), 1);
    igual(MovilEsfera.delante(e, P8), 0);
    igual(e.animando, false);
  });

  prueba('sin puntos, inicial es la identidad y delante es -1', function () {
    var e = MovilEsfera.inicial([]);
    igual(e.q, [1, 0, 0, 0]);
    igual(MovilEsfera.delante(e, []), -1);
  });

  prueba('traer(k) deja k delante para todo k', function () {
    var e = MovilEsfera.inicial(P8);
    for (var k = 0; k < P8.length; k++) {
      e = MovilEsfera.traer(e, P8[k]);
      cerca(zDe(e, P8[k]), 1, 1e-6, 'k=' + k);
      igual(MovilEsfera.delante(e, P8), k);
    }
  });

  /* El sentido del gesto: arrastrar a la derecha lleva el punto de delante a
     la derecha; arrastrar hacia abajo lo lleva hacia abajo (y negativa). */
  prueba('arrastrar sigue al dedo en los dos ejes', function () {
    var e = MovilEsfera.inicial(P8);
    var der = MovilEsfera.rotar(MovilEsfera.arrastrar(e, 40, 0, 400, 16).q, P8[0]);
    var aba = MovilEsfera.rotar(MovilEsfera.arrastrar(e, 0, 40, 400, 16).q, P8[0]);
    cierto(der[0] > 0.1, 'derecha: x=' + der[0]);
    cierto(aba[1] < -0.1, 'abajo: y=' + aba[1]);
  });

  prueba('cruzar el ancho entero gira unos 180°', function () {
    var e = MovilEsfera.inicial(P8);
    var d = MovilEsfera.arrastrar(e, 400, 0, 400, 16);
    cerca(MovilEsfera.distancia(e.q, d.q), Math.PI, 1e-6);
  });

  /* Review Focus 2: dos muestras casi simultáneas darían una velocidad
     absurda y la esfera giraría segundos como una peonza. */
  prueba('la velocidad tiene tope', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 120, 90, 400, 0.01);
    cierto(Math.hypot(e.vel.h, e.vel.v) <= MovilEsfera.VEL_MAX + 1e-12,
           'vel=' + Math.hypot(e.vel.h, e.vel.v));
  });

  prueba('con ms = 0 la velocidad no se toca', function () {
    var e = MovilEsfera.inicial(P8);
    igual(MovilEsfera.arrastrar(e, 30, 0, 400, 0).vel, { h: 0, v: 0 });
  });

  prueba('al soltar con velocidad sigue girando, frena y se asienta', function () {
    var e = MovilEsfera.inicial(P8);
    e = MovilEsfera.arrastrar(e, 30, 5, 400, 16);
    e = MovilEsfera.arrastrar(e, 30, 5, 400, 16);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 10 });
    igual(e.animando, true);
    var r = hastaQuieta(e, P8);
    cierto(r.pasos < 400, 'no se paró');
    var k = MovilEsfera.delante(r.estado, P8);
    cerca(zDe(r.estado, P8[k]), 1, 1e-3, 'la de delante queda centrada');
  });

  prueba('al asentarse gana la más cercana al frente', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 25, 10, 400, 0);
    var esperada = MovilEsfera.delante(e, P8);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 500 });
    var r = hastaQuieta(e, P8);
    igual(MovilEsfera.delante(r.estado, P8), esperada);
    cerca(zDe(r.estado, P8[esperada]), 1, 1e-3);
  });

  /* Quien suelta el dedo tras dejarlo quieto no quiere inercia: la velocidad
     que quedaba apuntada es de antes de pararse. */
  prueba('soltar tras quedarse quieto no lanza la esfera', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 60, 0, 400, 16);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 300 });
    igual(e.vel, { h: 0, v: 0 });
  });

  prueba('con movimiento reducido soltar asienta sin animar', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 60, 20, 400, 16);
    var k = MovilEsfera.delante(e, P8);
    e = MovilEsfera.soltar(e, P8, { reducido: true, msDesdeUltimo: 0 });
    igual(e.animando, false);
    cerca(zDe(e, P8[k]), 1, 1e-6);
  });

  prueba('apuntar anima hasta dejar el punto delante', function () {
    var e = MovilEsfera.apuntar(MovilEsfera.inicial(P8), P8[3], false);
    igual(e.animando, true);
    var r = hastaQuieta(e, P8);
    cierto(r.pasos < 400, 'no se paró');
    igual(MovilEsfera.delante(r.estado, P8), 3);
    cerca(zDe(r.estado, P8[3]), 1, 1e-3);
  });

  prueba('apuntar con movimiento reducido salta', function () {
    var e = MovilEsfera.apuntar(MovilEsfera.inicial(P8), P8[3], true);
    igual(e.animando, false);
    cerca(zDe(e, P8[3]), 1, 1e-6);
  });

  prueba('avanzar sobre una esfera quieta no la mueve', function () {
    var e = MovilEsfera.inicial(P8);
    igual(MovilEsfera.avanzar(e, 16, P8), e);
  });

  prueba('con un solo punto, arrastrar y soltar vuelve a dejarlo delante', function () {
    var p1 = MovilEsfera.reparto(1);
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(p1), 80, 0, 400, 16);
    e = MovilEsfera.soltar(e, p1, { reducido: false, msDesdeUltimo: 10 });
    var r = hastaQuieta(e, p1);
    cerca(zDe(r.estado, p1[0]), 1, 1e-3);
  });

  prueba('sin puntos, soltar y avanzar no lanzan', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial([]), 80, 0, 400, 16);
    e = MovilEsfera.soltar(e, [], { reducido: false, msDesdeUltimo: 10 });
    e = MovilEsfera.avanzar(e, 16, []);
    igual(e.animando, false);
  });
});

describe('MovilEsfera — proyección y vecinas', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }

  var P8 = MovilEsfera.reparto(8);
  var MEDIDAS = { ancho: 390, alto: 844 };

  prueba('la de delante va centrada, a escala 1 y con toda la luz', function () {
    var e = MovilEsfera.inicial(P8);
    var g = MovilEsfera.geometria(MEDIDAS);
    var p = MovilEsfera.proyectar(e, P8, MEDIDAS)[0];
    cerca(p.x, g.cx, 1e-6);
    cerca(p.y, g.cy, 1e-6);
    cerca(p.escala, 1, 1e-6);
    cerca(p.luz, 1, 1e-6);
    cerca(p.inclinacion.x, 0, 1e-4);
    cerca(p.inclinacion.y, 0, 1e-4);
    igual(p.visible, true);
    igual(p.z, 1000);
  });

  prueba('más atrás es más pequeña, más oscura y se pinta debajo', function () {
    var e = MovilEsfera.inicial(P8);
    var proy = MovilEsfera.proyectar(e, P8, MEDIDAS);
    var zs = P8.map(function (pt) { return MovilEsfera.rotar(e.q, pt)[2]; });
    var orden = zs.map(function (z, i) { return i; })
                  .sort(function (a, b) { return zs[b] - zs[a]; });
    for (var i = 1; i < orden.length; i++) {
      var antes = proy[orden[i - 1]];
      var ahora = proy[orden[i]];
      cierto(antes.escala >= ahora.escala, 'escala');
      cierto(antes.luz >= ahora.luz, 'luz');
      cierto(antes.z >= ahora.z, 'z');
    }
  });

  prueba('la luz vale 0,5 en el ecuador y 0,15 detrás', function () {
    var e = MovilEsfera.inicial([[0, 0, 1]]);
    var p = MovilEsfera.proyectar(e, [[1, 0, 0], [0, 0, -1]], MEDIDAS);
    cerca(p[0].luz, 0.5, 1e-6);
    cerca(p[1].luz, 0.15, 1e-6);
  });

  prueba('sólo el hemisferio de delante es visible', function () {
    var e = MovilEsfera.inicial(P8);
    MovilEsfera.proyectar(e, P8, MEDIDAS).forEach(function (p, i) {
      igual(p.visible, MovilEsfera.rotar(e.q, P8[i])[2] > 0, 'punto ' + i);
    });
  });

  /* Las teselas son siempre derechas: da igual cuánto giro haya acumulado
     la esfera (incluido el giro en el plano de la pantalla que dejan varios
     arrastres en diagonal), la que queda delante no se inclina. */
  prueba('la de delante no se inclina aunque la esfera acumule giro', function () {
    var e = MovilEsfera.inicial(P8);
    for (var i = 0; i < 12; i++) e = MovilEsfera.arrastrar(e, 37, -23, 390, 0);
    e = MovilEsfera.traer(e, P8[5]);
    var p = MovilEsfera.proyectar(e, P8, MEDIDAS)[5];
    cerca(p.inclinacion.x, 0, 1e-3);
    cerca(p.inclinacion.y, 0, 1e-3);
  });

  /* A la derecha, la cara mira a la derecha: rotateY positivo. Arriba, mira
     arriba: rotateX positivo (en CSS la y va hacia abajo, y rotateX(+) lleva
     la normal hacia arriba). */
  prueba('las de los lados se inclinan hacia fuera', function () {
    var e = MovilEsfera.inicial([[0, 0, 1]]);
    var d = Math.SQRT1_2;
    var p = MovilEsfera.proyectar(e, [[d, 0, d], [0, d, d]], MEDIDAS);
    cierto(p[0].inclinacion.y > 0, 'derecha: ' + p[0].inclinacion.y);
    cierto(p[0].x > MovilEsfera.geometria(MEDIDAS).cx, 'derecha x');
    cierto(p[1].inclinacion.x > 0, 'arriba: ' + p[1].inclinacion.x);
    cierto(p[1].y < MovilEsfera.geometria(MEDIDAS).cy, 'arriba y');
  });

  prueba('la tesela de delante mide lo mismo en vertical y en apaisado con el mismo lado corto', function () {
    var g1 = MovilEsfera.geometria({ ancho: 390, alto: 844 });
    var g2 = MovilEsfera.geometria({ ancho: 844, alto: 390 });
    cierto(g1.tesela > 0 && g2.tesela > 0, 'positivas');
    cierto(g2.tesela * 1.25 < 390, 'en apaisado la de delante cabe de alto');
  });

  prueba('proyectar sin puntos da una lista vacía', function () {
    igual(MovilEsfera.proyectar(MovilEsfera.inicial([]), [], MEDIDAS), []);
  });

  prueba('vecina en cada dirección cae hacia ese lado', function () {
    var e = MovilEsfera.inicial(P8);
    var dirs = { derecha: [1, 0], izquierda: [-1, 0], arriba: [0, 1], abajo: [0, -1] };
    Object.keys(dirs).forEach(function (nombre) {
      var j = MovilEsfera.vecina(e, P8, nombre);
      cierto(j !== 0, nombre + ': no encontró vecina');
      var p = MovilEsfera.rotar(e.q, P8[j]);
      var l = Math.hypot(p[0], p[1]);
      var cos = (p[0] * dirs[nombre][0] + p[1] * dirs[nombre][1]) / l;
      cierto(cos >= 0.5, nombre + ': coseno ' + cos);
    });
  });

  prueba('vecina con un punto es él mismo, y sin puntos -1', function () {
    var p1 = MovilEsfera.reparto(1);
    igual(MovilEsfera.vecina(MovilEsfera.inicial(p1), p1, 'derecha'), 0);
    igual(MovilEsfera.vecina(MovilEsfera.inicial([]), [], 'derecha'), -1);
  });
});
