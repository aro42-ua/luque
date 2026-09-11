describe('Proyecto.pintar', function () {
  var HTML =
    '<div>' +
    '<h2 id="pTitulo"></h2><p id="pAviso" role="status" aria-live="polite"></p>' +
    '<input id="pNombre" type="text"><select id="pCategoria"></select>' +
    '<input id="pCliente" type="text"><input id="pAnio" type="number">' +
    '<input id="pPapel" type="text"><input id="pEnlace" type="url">' +
    '<div id="pSoltar"><input id="pArchivos" type="file" multiple></div>' +
    '<ol id="pFotos"></ol><p id="pProblemas"></p>' +
    '</div>';

  function elementos(d) {
    return { titulo: d.querySelector('#pTitulo'), aviso: d.querySelector('#pAviso'),
             nombre: d.querySelector('#pNombre'), categoria: d.querySelector('#pCategoria'),
             cliente: d.querySelector('#pCliente'), anio: d.querySelector('#pAnio'),
             papel: d.querySelector('#pPapel'), enlace: d.querySelector('#pEnlace'),
             soltar: d.querySelector('#pSoltar'), archivos: d.querySelector('#pArchivos'),
             fotos: d.querySelector('#pFotos'), problemas: d.querySelector('#pProblemas') };
  }

  function proyecto() {
    return { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
             ficha: { cliente: 'Vogue ES', anio: 2025, papel: 'DoP' },
             portada: '/img/a-1500.jpg',
             piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg',
                        portada: '/img/a-1500.jpg' }] };
  }

  function nada() {
    return { alCambiar: function () {}, alSubir: function () {}, alVolver: function () {} };
  }

  function conPantalla(fn, p, acciones) {
    return window.ArnesDom.conElemento(HTML, function (caja) {
      var els = elementos(caja);
      window.Proyecto.pintar(els, p || proyecto(), acciones || nada());
      return fn(els, caja);
    });
  }

  prueba('el encabezado dice qué proyecto es', function () {
    conPantalla(function (els) { igual(els.titulo.textContent, 'Bruma'); });
  });

  prueba('la ficha llega escrita en el formulario', function () {
    conPantalla(function (els) {
      igual(els.nombre.value, 'Bruma');
      igual(els.cliente.value, 'Vogue ES');
      igual(els.anio.value, '2025');
      igual(els.papel.value, 'DoP');
    });
  });

  /* Un campo opcional que no está en la ficha se pinta vacío, no como
     «undefined». Es lo que pasaría al leer directamente ficha.enlace de un
     editorial, que no tiene. */
  prueba('un campo que la ficha no trae sale vacío', function () {
    conPantalla(function (els) { igual(els.enlace.value, ''); });
  });

  prueba('la categoría trae sus cuatro opciones y la suya elegida', function () {
    conPantalla(function (els) {
      igual(els.categoria.options.length, 4);
      igual(els.categoria.value, 'editorial');
    });
  });

  prueba('la rejilla pinta las fotos', function () {
    conPantalla(function (els) { igual(els.fotos.children.length, 1); });
  });

  /* Escribir en la ficha cambia el borrador en memoria, no guarda. El
     borrador se guarda con el botón de siempre. */
  prueba('escribir en la ficha avisa con el proyecto nuevo', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.papel.value = 'Fotografía';
      els.papel.dispatchEvent(new Event('input', { bubbles: true }));
      igual(cambios.length, 1);
      igual(cambios[0].ficha.papel, 'Fotografía');
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  /* El título sí se puede cambiar; el id NO se recalcula. Va en la URL
     pública, así que se congela al crear: renombrar no puede romper un
     enlace que la fotógrafa ya mandó a un cliente. */
  prueba('cambiar el título no cambia el identificador', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.nombre.value = 'Bruma Marina';
      els.nombre.dispatchEvent(new Event('input', { bubbles: true }));
      igual(cambios[0].titulo, 'Bruma Marina');
      igual(cambios[0].id, 'bruma');
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  /* `cliente` y `enlace` vacíos salen de la ficha en vez de guardarse como
     cadena vacía, igual que hace panel.js al crear: la forma de decir que un
     trabajo no tiene cliente es que la clave no esté. */
  prueba('vaciar un campo opcional lo quita de la ficha', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.cliente.value = '';
      els.cliente.dispatchEvent(new Event('input', { bubbles: true }));
      igual(Object.prototype.hasOwnProperty.call(cambios[0].ficha, 'cliente'), false);
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  prueba('mover una foto avisa con el proyecto reordenado', function () {
    var dos = proyecto();
    dos.piezas.push({ url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg',
                      portada: '/img/b-1500.jpg' });
    var cambios = [];
    conPantalla(function (els) {
      els.fotos.children[0].querySelector('[data-accion="siguiente"]').click();
      igual(cambios[0].piezas[0].url, '/img/b-3000.jpg');
    }, dos, { alCambiar: function (p) { cambios.push(p); },
              alSubir: function () {}, alVolver: function () {} });
  });

  /* Quitar una foto es irreversible dentro de la sesión —no hay deshacer— y
     además es lo único de esta pantalla que destruye trabajo. Se pregunta,
     igual que se pregunta al borrar un proyecto. */
  prueba('quitar una foto pregunta antes', function () {
    var cambios = [], preguntado = false;
    var confirmDeVerdad = window.confirm;
    window.confirm = function () { preguntado = true; return false; };
    try {
      conPantalla(function (els) {
        els.fotos.children[0].querySelector('[data-accion="quitar"]').click();
        igual(preguntado, true);
        igual(cambios.length, 0, 'si se dice que no, no se quita');
      }, null, { alCambiar: function (p) { cambios.push(p); },
                 alSubir: function () {}, alVolver: function () {} });
    } finally {
      window.confirm = confirmDeVerdad;
    }
  });

  /* Los problemas se enseñan ANTES de intentar publicar, que es donde el
     Worker los diría con un 422. Enterarse en la pantalla donde se arreglan
     es la diferencia entre un aviso y un callejón. */
  prueba('un proyecto sin fotos dice qué le falta para publicarse', function () {
    conPantalla(function (els) {
      cierto(els.problemas.textContent.indexOf('piezas') !== -1
          || els.problemas.textContent.indexOf('fotos') !== -1,
        'decía: ' + els.problemas.textContent);
    }, { id: 'x', titulo: 'X', categoria: 'editorial', tipo: 'fotos',
         ficha: { anio: 2025, papel: 'DoP' }, portada: null, piezas: [] });
  });

  prueba('un proyecto completo no enseña problemas', function () {
    conPantalla(function (els) { igual(els.problemas.textContent, ''); });
  });

  prueba('elegir archivos llama a alSubir con ellos', function () {
    var subidos = [];
    conPantalla(function (els) {
      /* No se puede poner `files` en un input desde una prueba, así que se
         emite el evento y se mira que la pantalla pregunte por los archivos
         del input — que es lo que hace en producción. */
      Object.defineProperty(els.archivos, 'files', { value: ['a', 'b'], configurable: true });
      els.archivos.dispatchEvent(new Event('change', { bubbles: true }));
      igual(subidos.length, 1);
      igual(subidos[0].length, 2);
    }, null, { alCambiar: function () {}, alVolver: function () {},
               alSubir: function (fs) { subidos.push(fs); } });
  });

  prueba('soltar archivos encima llama a alSubir', function () {
    var subidos = [];
    conPantalla(function (els) {
      var e = new Event('drop', { bubbles: true, cancelable: true });
      e.dataTransfer = { files: ['a'] };
      els.soltar.dispatchEvent(e);
      igual(subidos.length, 1);
    }, null, { alCambiar: function () {}, alVolver: function () {},
               alSubir: function (fs) { subidos.push(fs); } });
  });

  /* Sin esto, el navegador abre la foto soltada en la pestaña y el panel
     desaparece con los cambios sin guardar dentro. */
  prueba('soltar no deja que el navegador abra la foto', function () {
    conPantalla(function (els) {
      var e = new Event('drop', { bubbles: true, cancelable: true });
      e.dataTransfer = { files: ['a'] };
      els.soltar.dispatchEvent(e);
      igual(e.defaultPrevented, true);
    });
  });
});
