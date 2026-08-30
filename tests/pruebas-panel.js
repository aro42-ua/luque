/* panel/js/panel.js entero, dentro de un iframe. Es una IIFE que llama a init()
   al cargarse y no expone nada, así que no hay ninguna función a la que llamar
   desde fuera: la única forma de ejercitarlo es cargarlo con su HTML y sus
   dependencias puestas, y mirar el DOM resultante.

   Sólo se dobla `Borrador` —lo que habla con la red— y `confirm`. Lista, Orden,
   Identificador y ReglasContenido van de verdad: probar el panel contra dobles
   de sus propias piezas comprobaría el doble, no el panel. */
describeAsync('panel.js', function () {

  var HTML =
    '<main class="panel"><h1>Proyectos</h1>' +
    '<p id="aviso" role="status" aria-live="polite"></p>' +
    '<ol id="lista"></ol>' +
    '<form id="nuevo">' +
    '<input id="titulo" type="text"><select id="categoria"></select>' +
    '<button type="submit">Crear</button></form>' +
    '<button id="guardar" type="button">Guardar</button></main>';

  var MODULOS = ['../js/reglas-contenido.js', '../panel/js/identificador.js',
                 '../panel/js/orden.js', '../panel/js/lista.js',
                 '../panel/js/panel.js'];

  /* El doble de Borrador. `cargar` responde en el acto por omisión; con
     `diferido: true` guarda la respuesta y la suelta cuando la prueba quiera,
     que es la única forma de mirar el estado de arranque antes de que llegue
     el borrador. */
  function borradorFalso(opciones) {
    var o = opciones || {};
    var doble = {
      guardadas: [],
      soltarCarga: null,
      cargar: function (cb) {
        var responder = function () {
          cb(o.errorAlCargar ? null : (o.datos || { version: 3, proyectos: [] }),
             o.errorAlCargar || null);
        };
        if (o.diferido) { doble.soltarCarga = responder; return; }
        responder();
      },
      guardar: function (trabajo, cb) {
        doble.guardadas.push(JSON.parse(JSON.stringify(trabajo)));
        cb(o.respuestaAlGuardar || { version: trabajo.version + 1 },
           o.errorAlGuardar || null);
      }
    };
    return doble;
  }

  function dosProyectos() {
    return { version: 3, proyectos: [
      { id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'fotos', ficha: {}, piezas: [] },
      { id: 'arena',  titulo: 'Arena',  categoria: 'videoclip', tipo: 'video', ficha: {}, piezas: [] }
    ] };
  }

  /* Sólo para el bloque de «no va a <body>» de más abajo. Con dos proyectos,
     cualquier movimiento deja a la fila movida en un extremo —arriba, donde
     «subir» se deshabilita, o abajo, donde se deshabilita «bajar»— así que el
     botón que se acaba de pulsar es siempre el que queda inservible después.
     Probar que el foco vuelve a ESE MISMO botón exige una fila intermedia de
     verdad, y eso pide un tercer proyecto. */
  function tresProyectos() {
    return { version: 3, proyectos: [
      { id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'fotos', ficha: {}, piezas: [] },
      { id: 'arena',  titulo: 'Arena',  categoria: 'videoclip', tipo: 'video', ficha: {}, piezas: [] },
      { id: 'bruma',  titulo: 'Bruma',  categoria: 'editorial', tipo: 'fotos', ficha: {}, piezas: [] }
    ] };
  }

  function conPanel(doble, fn, confirmar) {
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Borrador: doble, confirm: confirmar || function () { return true; } },
      scripts: MODULOS
    }, fn);
  }

  // ---- Arranque -------------------------------------------------------

  return conPanel(borradorFalso({ diferido: true }), function (w, d) {

    /* Los cuatro controles que toca `activarControles`, no sólo tres: al
       botón de crear (`#nuevo button[type="submit"]`) le faltaba comprobación
       y quedaba fuera de esta lista. */
    prueba('arranca con los controles deshabilitados, antes de que llegue el borrador', function () {
      igual([d.getElementById('titulo').disabled,
             d.getElementById('categoria').disabled,
             d.querySelector('#nuevo button[type="submit"]').disabled,
             d.getElementById('guardar').disabled], [true, true, true, true]);
    });

    /* No basta con el número de opciones: rellenarlo con el número correcto
       de opciones equivocadas pasaría igual. Se compara también el `value`
       de cada opción (las CATEGORIAS, en orden) y el texto visible (lo que da
       Lista.ETIQUETAS, ver panel.js:136-141). */
    prueba('el desplegable se llena con las categorías de ReglasContenido', function () {
      var opciones = d.getElementById('categoria').options;
      igual([].map.call(opciones, function (o) { return o.value; }),
            w.ReglasContenido.CATEGORIAS);
      igual([].map.call(opciones, function (o) { return o.textContent; }),
            w.ReglasContenido.CATEGORIAS.map(function (c) {
              return w.Lista.ETIQUETAS[c] || c;
            }));
    });

  }).then(function () {

    // ---- La carga falla ----------------------------------------------

    return conPanel(borradorFalso({ errorAlCargar: 'No se ha podido cargar el contenido.' }),
      function (w, d) {
        prueba('si la carga falla, lo dice', function () {
          igual(d.getElementById('aviso').textContent,
                'No se ha podido cargar el contenido.');
        });
        /* El caso real: la sesión de Access caducó de un día para otro. Si los
           controles se quedaran activos, la primera pulsación reventaría contra
           un `trabajo` que sigue siendo null. */
        /* El nombre es plural: los cuatro controles que toca
           `activarControles` (panel.js:14-19), no sólo Guardar. */
        prueba('y los controles se quedan apagados', function () {
          igual([d.getElementById('titulo').disabled,
                 d.getElementById('categoria').disabled,
                 d.querySelector('#nuevo button[type="submit"]').disabled,
                 d.getElementById('guardar').disabled], [true, true, true, true]);
        });
      });

  }).then(function () {

    // ---- Carga correcta ----------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      prueba('pinta una fila por proyecto', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      /* Mismos cuatro controles que arriba: el nombre promete «los
         controles», no sólo título y guardar. */
      prueba('y activa los controles', function () {
        igual([d.getElementById('titulo').disabled,
               d.getElementById('categoria').disabled,
               d.querySelector('#nuevo button[type="submit"]').disabled,
               d.getElementById('guardar').disabled], [false, false, false, false]);
      });
    });

  }).then(function () {

    // ---- Crear --------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.getElementById('titulo').value = 'Salitre';
      d.getElementById('categoria').value = 'editorial';
      d.getElementById('nuevo').dispatchEvent(new w.Event('submit', { cancelable: true }));

      prueba('crear añade una fila', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 3);
      });
      prueba('y recuerda que hay que guardar', function () {
        cierto(d.getElementById('aviso').textContent.indexOf('Recuerda guardar') !== -1,
               d.getElementById('aviso').textContent);
      });
      prueba('y vacía el campo para el siguiente', function () {
        igual(d.getElementById('titulo').value, '');
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.getElementById('titulo').value = 'Niebla';   // ya existe
      d.getElementById('categoria').value = 'editorial';
      d.getElementById('nuevo').dispatchEvent(new w.Event('submit', { cancelable: true }));

      prueba('un título que repite identificador no crea nada', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      /* Tal como estaba en el plan, esto sólo comprobaba que el aviso no
         estuviera vacío: pasaría igual de verde si crear() avisara «Proyecto
         creado» a pesar de no haber creado nada. Se comprueba el mensaje
         exacto que da Identificador.problema para un id repetido. */
      prueba('y el aviso explica por qué', function () {
        igual(d.getElementById('aviso').textContent,
              'Ya hay un proyecto con el identificador «niebla».');
      });
    });

  }).then(function () {

    // ---- Borrar -------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelector('#lista li.fila [data-accion="borrar"]').click();
      /* No basta con el recuento: si panel.js borrara por índice, o siempre
         la última, en vez de por `id`, el recuento pasaría igual de 2 a 1 y
         esto seguiría en verde. Se comprueba también cuál queda. */
      prueba('borrar quita la fila cuando se confirma', function () {
        var filas = d.querySelectorAll('#lista li.fila');
        igual(filas.length, 1);
        igual(filas[0].dataset.id, 'arena');
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelector('#lista li.fila [data-accion="borrar"]').click();
      prueba('y no la quita cuando se cancela', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
    }, function () { return false; });

  }).then(function () {

    // ---- El foco tras mover -------------------------------------------
    /* Lo que nunca ha tenido cobertura y por lo que existe este arnés. Tras
       mover, Lista.pintar reconstruye el <ol> entero: el botón que tenía el
       foco deja de existir y el navegador lo manda a <body>. panel.js lo
       devuelve buscando por id de proyecto. */

    return conPanel(borradorFalso({ datos: tresProyectos() }), function (w, d) {
      // 'bruma' está en el medio (índice 2 de 3): subir la deja en el índice
      // 1, que no es ningún extremo, así que su botón «subir» sigue activo
      // y el foco tiene dónde volver de verdad.
      d.querySelectorAll('#lista li.fila')[2].querySelector('[data-accion="subir"]').click();

      prueba('mover cambia el orden', function () {
        igual([].map.call(d.querySelectorAll('#lista li.fila'),
                          function (f) { return f.dataset.id; }),
              ['niebla', 'bruma', 'arena']);
      });

      prueba('el foco vuelve al mismo botón de la misma fila, no a <body>', function () {
        var activo = d.activeElement;
        cierto(activo && activo.dataset.accion === 'subir',
               'foco en ' + (activo ? activo.tagName + '/' + activo.dataset.accion : 'nada'));
        igual(activo.closest('li.fila').dataset.id, 'bruma');
      });
    });

  }).then(function () {

    /* El borde: al subir a la primera posición, «subir» queda deshabilitado, y
       un botón deshabilitado no puede recibir el foco. panel.js usa el otro
       botón de la misma fila. Sin esta prueba, el foco se perdería en
       silencio justo en el movimiento más común. */
    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      d.querySelectorAll('#lista li.fila')[1].querySelector('[data-accion="subir"]').click();
      prueba('si el botón queda deshabilitado, el foco va al otro de esa fila', function () {
        igual(d.activeElement.dataset.accion, 'bajar');
      });
    });

  }).then(function () {

    // ---- Guardar y el conflicto ---------------------------------------

    var alGuardar = borradorFalso({ datos: dosProyectos() });
    return conPanel(alGuardar, function (w, d) {
      d.getElementById('guardar').click();

      prueba('guardar manda el trabajo entero, con su versión', function () {
        igual(alGuardar.guardadas.length, 1);
        igual(alGuardar.guardadas[0].version, 3);
        igual(alGuardar.guardadas[0].proyectos.map(function (p) { return p.id; }),
              ['niebla', 'arena']);
      });
      prueba('y avisa de que se guardó', function () {
        igual(d.getElementById('aviso').textContent, 'Guardado.');
      });
      prueba('y se queda con la versión nueva que devuelve el servidor', function () {
        d.getElementById('guardar').click();
        igual(alGuardar.guardadas[1].version, 4,
              'si no se actualizara, el segundo guardado mandaría la versión vieja '
              + 'y el servidor contestaría 409 sin motivo');
      });
    });

  }).then(function () {

    var doble = borradorFalso({ datos: dosProyectos(),
                                respuestaAlGuardar: { conflicto: true, guardada: 9 } });
    return conPanel(doble, function (w, d) {
      d.getElementById('guardar').click();

      /* Si «Guardar» siguiera activo, volver a pulsarlo mandaría la misma
         versión vieja y el servidor contestaría 409 en bucle. */
      prueba('un conflicto deshabilita Guardar', function () {
        igual(d.getElementById('guardar').disabled, true);
      });
      prueba('y el aviso dice la versión del servidor y que hay que recargar', function () {
        var t = d.getElementById('aviso').textContent;
        cierto(t.indexOf('9') !== -1, t);
        cierto(t.toLowerCase().indexOf('recarga') !== -1, t);
      });
    });
  });
});
