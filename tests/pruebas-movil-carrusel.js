/* MovilCarrusel es puro: la física del visor móvil (spec
   docs/superpowers/specs/2026-09-30-visor-premium-design.md). Se prueba con
   números. Convención: `dx` y `dy` son lo que se ha movido el dedo desde que
   se apoyó (dy positivo = hacia abajo); `v` su velocidad en px/ms con el
   mismo signo. */
describe('MovilCarrusel — la física del visor', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-9)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }

  prueba('eje: nada hasta 10 px; luego gana el dominante', function () {
    igual([MovilCarrusel.eje(6, 5), MovilCarrusel.eje(20, 4), MovilCarrusel.eje(-3, 30)],
          [null, 'x', 'y']);
  });

  prueba('arrastre: libre en medio, con resistencia en los extremos', function () {
    igual(MovilCarrusel.arrastre(-100, 390, 3, 10), -100);
    cerca(MovilCarrusel.arrastre(100, 390, 0, 10), 35);
    cerca(MovilCarrusel.arrastre(-100, 390, 9, 10), -35);
    igual(MovilCarrusel.arrastre(-100, 390, 0, 10), -100);
  });

  prueba('arrastre: con una sola foto se resiste en los dos sentidos', function () {
    cerca(MovilCarrusel.arrastre(80, 390, 0, 1), 28);
    cerca(MovilCarrusel.arrastre(-80, 390, 0, 1), -28);
  });

  prueba('destino: pasa con más de un 30 % del ancho', function () {
    igual([MovilCarrusel.destino(-130, 0, 390, 3, 10),
           MovilCarrusel.destino(130, 0, 390, 3, 10),
           MovilCarrusel.destino(-100, 0, 390, 3, 10)], [4, 2, 3]);
  });

  prueba('destino: un golpe rápido pasa aunque el arrastre sea corto', function () {
    igual([MovilCarrusel.destino(-40, -0.8, 390, 3, 10),
           MovilCarrusel.destino(40, 0.8, 390, 3, 10)], [4, 2]);
  });

  prueba('destino: manda la velocidad cuando contradice a la distancia', function () {
    igual(MovilCarrusel.destino(-150, 0.9, 390, 3, 10), 2);
  });

  prueba('destino: nunca se sale de la serie', function () {
    igual([MovilCarrusel.destino(200, 1, 390, 0, 10),
           MovilCarrusel.destino(-200, -1, 390, 9, 10),
           MovilCarrusel.destino(-200, -1, 390, 0, 1)], [0, 9, 0]);
  });

  prueba('duración: entre 180 y 380 ms, menos cuanto más rápido', function () {
    var lenta = MovilCarrusel.duracion(300, 0);
    var rapida = MovilCarrusel.duracion(300, 2);
    igual([lenta, MovilCarrusel.duracion(10, 0)], [380, 180]);
    cierto(rapida < lenta && rapida >= 180, 'rápida ' + rapida);
  });

  prueba('cierre: encoge hasta el 75 % y apaga el fondo con la bajada', function () {
    var nada = MovilCarrusel.cierre(0, 800);
    var medio = MovilCarrusel.cierre(200, 800);
    var todo = MovilCarrusel.cierre(900, 800);
    igual([nada.escala, nada.fondo], [1, 1]);
    cerca(medio.escala, 0.875); cerca(medio.fondo, 0.5);
    igual([todo.escala, todo.fondo], [0.75, 0]);
    igual(MovilCarrusel.cierre(-50, 800).escala, 1);
  });

  prueba('se cierra pasado un 15 % del alto o con un golpe hacia abajo', function () {
    igual([MovilCarrusel.seCierra(130, 0, 800), MovilCarrusel.seCierra(100, 0, 800),
           MovilCarrusel.seCierra(40, 0.7, 800), MovilCarrusel.seCierra(-200, 0, 800)],
          [true, false, true, false]);
  });

  prueba('ficha: sube con el dedo y se abre pasado un 20 % o con un golpe', function () {
    cerca(MovilCarrusel.ficha(-240, 800), 0.5);
    igual([MovilCarrusel.ficha(50, 800), MovilCarrusel.ficha(-900, 800)], [0, 1]);
    igual([MovilCarrusel.seAbreFicha(-170, 0, 800), MovilCarrusel.seAbreFicha(-100, 0, 800),
           MovilCarrusel.seAbreFicha(-30, -0.7, 800), MovilCarrusel.seAbreFicha(100, 0, 800)],
          [true, false, true, false]);
  });

  prueba('doble toque: amplía dejando quieto el punto tocado', function () {
    var z = MovilCarrusel.dobleToque({ x: 100, y: 200 }, { x: 195, y: 406 }, 2.5);
    igual(z.escala, 2.5);
    /* El punto tocado, tras translate(x,y) scale(e) desde el centro, cae
       donde estaba: c + (x,y) + e·(p − c) = p. */
    cerca(195 + z.x + 2.5 * (100 - 195), 100, 1e-9, 'x');
    cerca(406 + z.y + 2.5 * (200 - 406), 200, 1e-9, 'y');
  });
});
