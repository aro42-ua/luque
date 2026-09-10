/* El contrato entre el JavaScript y el CSS del encuadre es UNA clase en la
   raiz, y por eso es lo unico que se comprueba aqui: los cuatro elementos no
   se tocan nunca desde el codigo, los pinta el CSS. Reutiliza `MV_MARCADO`,
   `mvRefsDesde` y `conLado` de `pruebas-movil-visor.js`, asi que va despues de
   aquel en test.html. */
describe('MovilVisor: el encuadre', function () {

  var MVE_PROYECTO = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Direccion de arte' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  /* Local, como en cada sección de `pruebas-movil-visor.js`: `conLado` vive
     dentro de cada `describe` y no es global, al contrario que `MV_MARCADO`,
     `mvRefsDesde` y `conVisorSobre`. */
  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  function conVisor(fn) {
    return conVisorSobre(MVE_PROYECTO, fn);
  }

  function tratamiento(raiz) {
    var clases = ['brillo-claro', 'brillo-oscuro', 'brillo-halo'];
    return clases.filter(function (c) { return raiz.classList.contains(c); });
  }

  /* Una foto con una URL de mentira nunca carga, que es exactamente el caso
     que la spec obliga a cubrir: el halo es feo al lado de lo automatico y
     correcto siempre. */
  prueba('una foto que no ha cargado deja el encuadre en halo', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
      });
      return tratamiento(refs.raiz);
    }), ['brillo-halo']);
  });

  /* La ficha no es una foto: no hay nada que medir, y medir el fondo del visor
     seria contestar por una foto que no esta. */
  prueba('la ficha lleva el encuadre en halo', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return tratamiento(refs.raiz);
    }), ['brillo-halo']);
  });

  prueba('nunca hay dos tratamientos puestos a la vez', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return tratamiento(refs.raiz).length;
    }), 1);
  });

  prueba('cerrar el visor se lleva el tratamiento con el', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'todos', valor: null });
      });
      return tratamiento(refs.raiz);
    }), []);
  });
});

/* El marcado del sitio, que ninguna prueba de DOM alcanza porque los arneses
   montan el suyo. Sin esto, `MV_MARCADO` podria llevar las cuatro esquinas e
   `index.html` no llevar ninguna, y las cuatro pruebas de arriba seguirian en
   verde sobre un visor sin encuadre. */
describeAsync('El encuadre del movil en index.html', function () {
  return fetch('../index.html').then(function (r) { return r.text(); })
    .then(function (html) {
      prueba('index.html lleva las cuatro esquinas del visor movil', function () {
        var cuantas = html.split('mvisor-esquina').length - 1;
        igual(cuantas, 4);
      });
    });
});
