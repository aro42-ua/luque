/* El interruptor de ancho. No toca el DOM a propósito, así que esto no
   necesita el arnés de DOM: la consulta de medios se falsifica y se dispara a
   mano, que es la única forma de comprobar un cruce sin poder redimensionar
   la ventana desde una prueba. */
describe('Movil — el interruptor', function () {

  /* Una consulta de medios de mentira, con la misma superficie que la de
     verdad: `.matches` y `addEventListener('change', fn)`. `emitir` es lo que
     `window.matchMedia` haría al cambiar el ancho de la ventana. */
  function consultaFalsa(coincideAlPrincipio) {
    var oyentes = [];
    return {
      matches: coincideAlPrincipio,
      addEventListener: function (nombre, fn) {
        if (nombre === 'change') oyentes.push(fn);
      },
      emitir: function (coincide) {
        this.matches = coincide;
        oyentes.forEach(function (fn) { fn({ matches: coincide }); });
      },
      cuantosOyentes: function () { return oyentes.length; }
    };
  }

  function contador() {
    var c = { movil: 0, escritorio: 0 };
    c.lados = {
      movil: function () { c.movil++; },
      escritorio: function () { c.escritorio++; }
    };
    return c;
  }

  prueba('la consulta es exactamente la que dice la spec', function () {
    igual(Movil.CONSULTA, '(max-width: 860px)');
  });

  prueba('lado() traduce el booleano de la consulta', function () {
    igual([Movil.lado(true), Movil.lado(false)], ['movil', 'escritorio']);
  });

  prueba('cruza() sólo es cierto cuando el lado cambia', function () {
    igual([Movil.cruza('movil', 'escritorio'),
           Movil.cruza('movil', 'movil'),
           Movil.cruza('escritorio', 'escritorio')], [true, false, false]);
  });

  prueba('init llama al lado que toca, y sólo a ese', function () {
    var c = contador();
    Movil.init(consultaFalsa(true), c.lados);
    igual([c.movil, c.escritorio], [1, 0]);
  });

  prueba('init arrancando ancho llama al escritorio', function () {
    var c = contador();
    Movil.init(consultaFalsa(false), c.lados);
    igual([c.movil, c.escritorio], [0, 1]);
  });

  prueba('cruzar el umbral llama al otro lado', function () {
    var c = contador(), q = consultaFalsa(false);
    Movil.init(q, c.lados);
    q.emitir(true);
    igual([c.movil, c.escritorio], [1, 1]);
  });

  /* La razón de ser de `cruza`: un `change` que no cambia de lado no puede
     repintar, porque repintar perdería la posición del recorrido — que es
     justo lo que la spec pide conservar al girar el móvil. */
  prueba('un change que no cambia de lado no llama a nadie', function () {
    var c = contador(), q = consultaFalsa(true);
    Movil.init(q, c.lados);
    q.emitir(true);
    igual([c.movil, c.escritorio], [1, 0]);
  });

  prueba('ir y volver llama a cada lado las veces que toca', function () {
    var c = contador(), q = consultaFalsa(true);
    Movil.init(q, c.lados);
    q.emitir(false);
    q.emitir(true);
    igual([c.movil, c.escritorio], [2, 1]);
  });

  prueba('actual() dice de qué lado estamos', function () {
    var q = consultaFalsa(true);
    Movil.init(q, contador().lados);
    var alPrincipio = Movil.actual();
    q.emitir(false);
    igual([alPrincipio, Movil.actual()], ['movil', 'escritorio']);
  });

  /* Un lado sin función no es un error: la Tarea 5 podría querer cablear sólo
     uno. Lo que no puede es tirar la sesión abajo. */
  prueba('un lado sin función no lanza', function () {
    var q = consultaFalsa(true);
    Movil.init(q, {});
    q.emitir(false);
    cierto(true);
  });

  prueba('init se suscribe una sola vez', function () {
    var q = consultaFalsa(true);
    Movil.init(q, contador().lados);
    igual(q.cuantosOyentes(), 1);
  });
});
