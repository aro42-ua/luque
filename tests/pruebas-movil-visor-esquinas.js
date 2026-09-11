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

  /* Antes esta prueba nunca dejaba llegar el `load` de la foto huerfana, y por
     eso pasaba comparando trivialmente `[]` contra `[]` sin cazar nada: el
     `load` no desengancharse en `cerrar` no se notaba porque nada lo disparaba.
     Aqui se guarda la <img> ANTES de cerrar —sigue siendo un nodo valido
     aunque `escena.innerHTML = ''` lo haya desconectado— y se le dispara el
     `load` a mano despues: si `cerrar` no hubiera quitado el oyente,
     `tenirEncuadre` volveria a poner una clase de brillo sobre `raiz` justo
     despues de que `cerrar` las hubiera quitado todas. */
  prueba('cerrar el visor se lleva el tratamiento con el', function () {
    igual(conVisor(function (refs) {
      var img;
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        img = refs.escena.querySelector('img');
        MovilVisor.aplicar({ tipo: 'todos', valor: null });
      });
      img.dispatchEvent(new Event('load'));
      return tratamiento(refs.raiz);
    }), []);
  });

  /* La contramedida obligatoria de la spec —«el fallo se registra»— tiene que
     gastarse en un fallo de verdad y no en la medida sincrona que `pintar`
     hace justo despues de crear la `<img>`, cuando esta casi nunca esta
     `complete` todavia: eso es el estado PROVISIONAL correcto, no un fallo.
     `avisado` es un cerrojo de una sola vez por sesion (ver `js/movil-visor.js`),
     asi que esta prueba tiene que ser la UNICA de toda la suite que fuerza un
     aviso real, o dejaria a cualquier otra que dependiera de el en falso.

     El fallo real se fuerza parcheando `drawImage` para que lance, y no
     dejandolo en manos de si el navegador trata una <img> rota como
     excepcion o como lienzo transparente —eso varia y no es lo que aqui se
     comprueba—. `complete` y `naturalWidth` se falsean aparte, con la misma
     tecnica que usa `pruebas-movil-visor-zoom.js` para el tope, para pasar
     la guarda de `medidorDe` y llegar de verdad hasta el `drawImage`
     parcheado. */
  prueba('la medida sincrona no consume el aviso; una medida real que falla si', function () {
    igual(conVisor(function (refs) {
      var avisos = [];
      var antesWarn = console.warn;
      var antesDrawImage = CanvasRenderingContext2D.prototype.drawImage;
      console.warn = function (m) { avisos.push(m); };
      try {
        conLado('movil', function () {
          MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        });
        var img = refs.escena.querySelector('img');
        var trasSincrona = avisos.length;

        Object.defineProperty(img, 'complete', { value: true, configurable: true });
        Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
        CanvasRenderingContext2D.prototype.drawImage = function () {
          throw new Error('lienzo manchado (simulado para esta prueba)');
        };
        img.dispatchEvent(new Event('load'));

        return { trasSincrona: trasSincrona, trasCargada: avisos.length };
      } finally {
        console.warn = antesWarn;
        CanvasRenderingContext2D.prototype.drawImage = antesDrawImage;
      }
    }), { trasSincrona: 0, trasCargada: 1 });
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
