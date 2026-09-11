describe('Fotos.pintar', function () {
  function proyecto() {
    return { id: 'bruma', portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' },
      { url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg', portada: '/img/b-1500.jpg' },
      { url: '/img/c-3000.jpg', miniatura: '/img/c-250.jpg', portada: '/img/c-1500.jpg' }
    ] };
  }

  function nada() {
    return { alMover: function () {}, alQuitar: function () {},
             alMarcarPortada: function () {} };
  }

  function conRejilla(fn, acciones) {
    return window.ArnesDom.conElemento('<ol></ol>', function (ol) {
      window.Fotos.pintar(ol, proyecto(), acciones || nada());
      return fn(ol);
    });
  }

  prueba('una celda por pieza', function () {
    conRejilla(function (ol) { igual(ol.children.length, 3); });
  });

  /* La miniatura y no la pieza: la rejilla enseña varias a la vez, y pedir
     ahí los 3000 px costaría un megabyte por foto para verla a 120. Es el
     mismo motivo por el que la tira del visor tiene su propia medida. */
  prueba('cada celda enseña la miniatura, no la pieza', function () {
    conRejilla(function (ol) {
      igual(ol.querySelector('img').getAttribute('src'), '/img/a-250.jpg');
    });
  });

  /* Sin texto alternativo, un lector de pantalla lee la url. Con el número,
     al menos se sabe cuál de las tres es. */
  prueba('cada imagen dice qué número de foto es', function () {
    conRejilla(function (ol) {
      igual(ol.querySelector('img').getAttribute('alt'), 'Foto 1 de 3');
    });
  });

  prueba('la celda de la portada se marca', function () {
    conRejilla(function (ol) {
      igual(ol.children[1].classList.contains('celda--portada'), true);
      igual(ol.children[0].classList.contains('celda--portada'), false);
    });
  });

  /* Criterio de aceptación 6: todo lo que se hace arrastrando se hace con
     teclado. Cuatro botones por celda, y todos con etiqueta. */
  prueba('cada celda trae sus cuatro botones', function () {
    conRejilla(function (ol) {
      var acciones = Array.prototype.map.call(
        ol.children[0].querySelectorAll('button'),
        function (b) { return b.dataset.accion; });
      igual(acciones, ['anterior', 'siguiente', 'portada', 'quitar']);
    });
  });

  prueba('los botones dicen de qué foto son', function () {
    conRejilla(function (ol) {
      igual(ol.children[0].querySelector('[data-accion="quitar"]')
        .getAttribute('aria-label'), 'Quitar la foto 1');
    });
  });

  prueba('la primera no puede ir hacia atrás y la última hacia delante', function () {
    conRejilla(function (ol) {
      igual(ol.children[0].querySelector('[data-accion="anterior"]').disabled, true);
      igual(ol.children[2].querySelector('[data-accion="siguiente"]').disabled, true);
      igual(ol.children[1].querySelector('[data-accion="anterior"]').disabled, false);
    });
  });

  /* Marcar como portada la que ya lo es no hace nada, y un botón que no hace
     nada tiene que decirlo antes de que lo pulsen. */
  prueba('la portada no se puede volver a marcar', function () {
    conRejilla(function (ol) {
      igual(ol.children[1].querySelector('[data-accion="portada"]').disabled, true);
      igual(ol.children[0].querySelector('[data-accion="portada"]').disabled, false);
    });
  });

  prueba('los botones de mover llaman con los dos índices', function () {
    var movidos = [];
    conRejilla(function (ol) {
      ol.children[1].querySelector('[data-accion="siguiente"]').click();
      igual(movidos, [[1, 2]]);
    }, { alMover: function (d, h) { movidos.push([d, h]); },
         alQuitar: function () {}, alMarcarPortada: function () {} });
  });

  prueba('quitar llama con el índice', function () {
    var quitados = [];
    conRejilla(function (ol) {
      ol.children[2].querySelector('[data-accion="quitar"]').click();
      igual(quitados, [2]);
    }, { alMover: function () {}, alQuitar: function (i) { quitados.push(i); },
         alMarcarPortada: function () {} });
  });

  prueba('marcar portada llama con el índice', function () {
    var marcados = [];
    conRejilla(function (ol) {
      ol.children[0].querySelector('[data-accion="portada"]').click();
      igual(marcados, [0]);
    }, { alMover: function () {}, alQuitar: function () {},
         alMarcarPortada: function (i) { marcados.push(i); } });
  });

  prueba('repintar no apila celdas', function () {
    window.ArnesDom.conElemento('<ol></ol>', function (ol) {
      window.Fotos.pintar(ol, proyecto(), nada());
      window.Fotos.pintar(ol, proyecto(), nada());
      igual(ol.children.length, 3);
    });
  });

  prueba('un proyecto sin fotos deja la rejilla vacía', function () {
    window.ArnesDom.conElemento('<ol></ol>', function (ol) {
      window.Fotos.pintar(ol, { id: 'x', portada: null, piezas: [] }, nada());
      igual(ol.children.length, 0);
    });
  });
});

describe('Fotos.enfocar', function () {
  /* El mismo problema que Lista.enfocar y por el mismo motivo: tras repintar,
     los nodos son nuevos. Aquí el ancla es el índice y no el id, porque una
     foto no tiene id — y el índice es justamente lo que cambia al mover, así
     que quien llama pasa el índice de DESPUÉS del movimiento. */
  var HTML =
    '<ol><li data-indice="0"><button data-accion="anterior" disabled>‹</button>' +
    '<button data-accion="siguiente">›</button></li>' +
    '<li data-indice="1"><button data-accion="anterior">‹</button>' +
    '<button data-accion="siguiente" disabled>›</button></li></ol>';

  prueba('enfoca el botón de la celda que se le pide', function () {
    window.ArnesDom.conElemento(HTML, function (ol) {
      window.Fotos.enfocar(ol, { indice: 1, accion: 'anterior' });
      igual(document.activeElement.dataset.accion, 'anterior');
    });
  });

  prueba('si quedó deshabilitado, usa el contrario de la misma celda', function () {
    window.ArnesDom.conElemento(HTML, function (ol) {
      window.Fotos.enfocar(ol, { indice: 0, accion: 'anterior' });
      igual(document.activeElement.dataset.accion, 'siguiente');
    });
  });

  prueba('una celda que ya no existe no revienta', function () {
    window.ArnesDom.conElemento(HTML, function (ol) {
      window.Fotos.enfocar(ol, { indice: 9, accion: 'anterior' });
      igual(document.activeElement.tagName, 'BODY');
    });
  });
});
