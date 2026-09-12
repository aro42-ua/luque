/* La hoja de contacto (js/contacto.js). Se ejercita `aplicar` sobre un marcado
   propio, con `preparar` en vez de `init`: `init` se suscribe al Router y
   escucha el teclado del documento, y eso dejaría oyentes vivos entre
   pruebas. Los ganchos de congelar y descongelar se sustituyen por
   contadores, que es lo que el módulo hace con la galería sin tener que
   cargar el escenario espacial entero. */
describe('Contacto — la hoja de contacto', function () {

  var MARCADO =
    '<div>' +
    '<a class="navbar-contacto" href="#/contacto">Contacto</a>' +
    '<section id="contactoPrueba" aria-hidden="true">' +
    '<h2 tabindex="-1">¿Hablamos?</h2>' +
    '<a href="mailto:x@y.z">x@y.z</a>' +
    '</section>' +
    '</div>';

  function conHoja(fn) {
    return ArnesDom.conElemento(MARCADO, function (raiz) {
      var cuenta = { congelar: 0, descongelar: 0 };
      Contacto.preparar(raiz.querySelector('#contactoPrueba'), {
        congelar:    function () { cuenta.congelar++; },
        descongelar: function () { cuenta.descongelar++; }
      });
      try {
        return fn(raiz, cuenta);
      } finally {
        /* La clase vive en el body, fuera de la caja del arnés: se limpia
           aquí o la siguiente prueba empieza con la hoja «abierta». */
        Contacto.aplicar({ tipo: 'todos', valor: null, pieza: null });
        document.body.classList.remove('contacto-abierto');
      }
    });
  }

  var CONTACTO = { tipo: 'contacto', valor: null, pieza: null };
  var TODOS    = { tipo: 'todos', valor: null, pieza: null };
  var CATEGORIA = { tipo: 'categoria', valor: 'editorial', pieza: null };

  prueba('nace cerrada', function () {
    conHoja(function (raiz) {
      igual(Contacto.abierto(), false);
      igual(raiz.querySelector('section').getAttribute('aria-hidden'), 'true');
    });
  });

  prueba('la ruta de contacto la abre: clase en el body, aria-hidden fuera', function () {
    conHoja(function (raiz) {
      Contacto.aplicar(CONTACTO);
      igual(Contacto.abierto(), true);
      igual(document.body.classList.contains('contacto-abierto'), true);
      igual(raiz.querySelector('section').getAttribute('aria-hidden'), 'false');
    });
  });

  prueba('al abrir marca activo el enlace que la abre, como una categoría', function () {
    conHoja(function (raiz) {
      Contacto.aplicar(CONTACTO);
      var a = raiz.querySelector('.navbar-contacto');
      igual(a.classList.contains('activa'), true);
      igual(a.getAttribute('aria-current'), 'page');
      Contacto.aplicar(TODOS);
      igual(a.classList.contains('activa'), false);
      igual(a.hasAttribute('aria-current'), false);
    });
  });

  prueba('al abrir el foco va al título, para que el lector empiece por él', function () {
    conHoja(function (raiz) {
      Contacto.aplicar(CONTACTO);
      igual(document.activeElement, raiz.querySelector('h2'));
    });
  });

  prueba('al cerrar devuelve el foco a quien la abrió', function () {
    conHoja(function (raiz) {
      var a = raiz.querySelector('.navbar-contacto');
      a.focus();
      Contacto.aplicar(CONTACTO);
      Contacto.aplicar(TODOS);
      igual(document.activeElement, a);
    });
  });

  prueba('congela la galería al abrir y la suelta al cerrar, una vez cada una', function () {
    conHoja(function (raiz, cuenta) {
      Contacto.aplicar(CONTACTO);
      Contacto.aplicar(CONTACTO);   // el Router avisa en cada cambio de ruta
      igual(cuenta, { congelar: 1, descongelar: 0 });
      Contacto.aplicar(CATEGORIA);
      Contacto.aplicar(TODOS);
      igual(cuenta, { congelar: 1, descongelar: 1 });
    });
  });

  /* Es lo que hace que una categoría de la barra cierre la hoja además de
     filtrar, sin que la barra sepa nada de la hoja. */
  prueba('cualquier otra ruta la cierra', function () {
    conHoja(function () {
      Contacto.aplicar(CONTACTO);
      Contacto.aplicar({ tipo: 'proyecto', valor: 'bruma', pieza: 2 });
      igual(Contacto.abierto(), false);
      igual(document.body.classList.contains('contacto-abierto'), false);
    });
  });

  /* El lado móvil: la sección se muda al pie de la portada y deja de ser
     una capa. `colocar` la mueve y la ruta ya no abre nada. */
  var MARCADO_MOVIL =
    '<div>' +
    '<a class="navbar-contacto" href="#/contacto">Contacto</a>' +
    '<section id="hojaPrueba"><ol></ol></section>' +
    '<section id="contactoPrueba" aria-hidden="true"><h2 tabindex="-1">¿Hablamos?</h2></section>' +
    '</div>';

  function conLados(fn) {
    return ArnesDom.conElemento(MARCADO_MOVIL, function (raiz) {
      Contacto.preparar(raiz.querySelector('#contactoPrueba'),
                        { hoja: raiz.querySelector('#hojaPrueba') });
      try { return fn(raiz); }
      finally {
        Contacto.colocar('escritorio');
        Contacto.aplicar(TODOS);
        document.body.classList.remove('contacto-abierto');
      }
    });
  }

  prueba('en el móvil la sección se cuelga al final de la portada', function () {
    conLados(function (raiz) {
      Contacto.colocar('movil');
      var hoja = raiz.querySelector('#hojaPrueba');
      igual(hoja.lastElementChild.id, 'contactoPrueba');
      igual(hoja.querySelector('#contactoPrueba').getAttribute('aria-hidden'), 'false');
    });
  });

  prueba('al volver a escritorio la sección vuelve a donde nació, escondida', function () {
    conLados(function (raiz) {
      Contacto.colocar('movil');
      Contacto.colocar('escritorio');
      var s = raiz.querySelector('#contactoPrueba');
      igual(s.parentNode, raiz);
      igual(s.previousElementSibling.id, 'hojaPrueba');
      igual(s.getAttribute('aria-hidden'), 'true');
    });
  });

  prueba('en el móvil la ruta de contacto no abre ninguna capa', function () {
    conLados(function () {
      Contacto.colocar('movil');
      Contacto.aplicar(CONTACTO);
      igual(Contacto.abierto(), false);
      igual(document.body.classList.contains('contacto-abierto'), false);
    });
  });

  prueba('cruzar a móvil con la hoja abierta la desmonta', function () {
    conLados(function (raiz) {
      Contacto.aplicar(CONTACTO);
      igual(Contacto.abierto(), true);
      Contacto.colocar('movil');
      igual(Contacto.abierto(), false);
      igual(document.body.classList.contains('contacto-abierto'), false);
      igual(raiz.querySelector('.navbar-contacto').classList.contains('activa'), false);
    });
  });

  prueba('sin preparar no hace nada ni lanza', function () {
    Contacto.preparar(null);
    Contacto.aplicar(CONTACTO);
    igual(Contacto.abierto(), false);
  });
});
