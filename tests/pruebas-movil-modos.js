/* El selector de categorías de la esfera (spec
   docs/superpowers/specs/2026-10-08-esfera-categorias-design.md): una fila que
   se desliza bajo una marca fija, como el selector de modos de una cámara. */
describe('MovilModos — en qué categoría encaja', function () {

  /* Cinco categorías cuyos centros, con la pista en 0, están a 50, 150, 250,
     350 y 450 px; la marca, a 150. */
  var CENTROS = [50, 150, 250, 350, 450];

  prueba('quieta, encaja en la que tiene más cerca de la marca', function () {
    igual([MovilModos.destino(0, 0, CENTROS, 150),
           MovilModos.destino(-90, 0, CENTROS, 150),
           MovilModos.destino(-160, 0, CENTROS, 150)], [1, 2, 3]);
  });

  prueba('un golpe proyecta la velocidad y llega más lejos', function () {
    igual([MovilModos.destino(-10, -0.6, CENTROS, 150),
           MovilModos.destino(-10, 0.6, CENTROS, 150)], [2, 0]);
  });

  prueba('nunca se sale de la fila', function () {
    igual([MovilModos.destino(-2000, -3, CENTROS, 150),
           MovilModos.destino(2000, 3, CENTROS, 150)], [4, 0]);
  });
});

describe('MovilModos — el selector en la página', function () {

  var CATEGORIAS = [
    { id: 'todos', nombre: 'Todo' },
    { id: 'editorial', nombre: 'Editorial' },
    { id: 'videoclip', nombre: 'Videoclip' },
    { id: 'cortometraje', nombre: 'Cortometraje' },
    { id: 'foto-stills', nombre: 'Foto Stills' }
  ];

  /* El reloj inyectado, como en el visor: 1000 ms entre eventos es un
     arrastre lento; 10 ms, un golpe. */
  function conSelector(fn, paso) {
    return ArnesDom.conElemento(
      '<nav style="position:relative;width:300px;overflow:hidden;white-space:nowrap"></nav>',
      function (nav) {
        var elegidas = [];
        var t = 0;
        var s = MovilModos.crear(nav, CATEGORIAS, {
          alElegir: function (id) { elegidas.push(id); },
          ahora: function () { return (t += (paso || 1000)); },
          reducido: true
        });
        return fn(s, nav, elegidas);
      });
  }

  function boton(nav, id) { return nav.querySelector('button[data-id="' + id + '"]'); }
  function centroEnNav(nav, id) {
    var b = boton(nav, id).getBoundingClientRect();
    return b.left + b.width / 2 - nav.getBoundingClientRect().left;
  }
  function dedo(el, tipo, x) {
    el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: 10, pointerId: 1, bubbles: true }));
  }

  prueba('pinta un botón por categoría, con su nombre', function () {
    conSelector(function (s, nav) {
      igual(Array.prototype.map.call(nav.querySelectorAll('button'), function (b) {
        return b.textContent;
      }), ['Todo', 'Editorial', 'Videoclip', 'Cortometraje', 'Foto Stills']);
    });
  });

  prueba('poner marca la activa y la deja bajo la marca del centro', function () {
    conSelector(function (s, nav) {
      s.poner('videoclip', false);
      igual([boton(nav, 'videoclip').getAttribute('aria-pressed'),
             boton(nav, 'todos').getAttribute('aria-pressed')], ['true', 'false']);
      cierto(Math.abs(centroEnNav(nav, 'videoclip') - 150) < 1, 'centro ' + centroEnNav(nav, 'videoclip'));
    });
  });

  prueba('tocar una categoría la elige y la centra', function () {
    conSelector(function (s, nav, elegidas) {
      s.poner('todos', false);
      var b = boton(nav, 'editorial');
      dedo(b, 'pointerdown', 100);
      dedo(b, 'pointerup', 100);
      igual([elegidas, b.getAttribute('aria-pressed')], [['editorial'], 'true']);
      cierto(Math.abs(centroEnNav(nav, 'editorial') - 150) < 1, 'no se centró');
    });
  });

  prueba('tocar la que ya está activa no elige nada', function () {
    conSelector(function (s, nav, elegidas) {
      s.poner('todos', false);
      dedo(boton(nav, 'todos'), 'pointerdown', 150);
      dedo(boton(nav, 'todos'), 'pointerup', 150);
      igual(elegidas, []);
    });
  });

  prueba('arrastrar despacio y soltar encaja en la más cercana', function () {
    conSelector(function (s, nav, elegidas) {
      s.poner('todos', false);
      var hasta = centroEnNav(nav, 'videoclip') - centroEnNav(nav, 'todos');
      dedo(nav, 'pointerdown', 250);
      dedo(nav, 'pointermove', 250 - hasta / 2);
      dedo(nav, 'pointermove', 250 - hasta);
      dedo(nav, 'pointerup', 250 - hasta);
      igual(elegidas, ['videoclip']);
    });
  });

  prueba('un golpe corto llega más allá de la vecina', function () {
    conSelector(function (s, nav, elegidas) {
      s.poner('todos', false);
      dedo(nav, 'pointerdown', 250);
      dedo(nav, 'pointermove', 230);
      dedo(nav, 'pointermove', 200);
      dedo(nav, 'pointerup', 200);
      cierto(elegidas.length === 1 && elegidas[0] !== 'todos' && elegidas[0] !== 'editorial',
             'eligió ' + elegidas.join(','));
    }, 10);
  });

  prueba('Intro sobre un botón lo elige, y las flechas pasan a la vecina', function () {
    conSelector(function (s, nav, elegidas) {
      s.poner('todos', false);
      boton(nav, 'cortometraje').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      igual(elegidas, ['cortometraje', 'foto-stills']);
    });
  });
});
