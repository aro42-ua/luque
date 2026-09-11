/* panel/js/panel.js entero, dentro de un iframe. Es una IIFE que llama a init()
   al cargarse y no expone nada, así que no hay ninguna función a la que llamar
   desde fuera: la única forma de ejercitarlo es cargarlo con su HTML y sus
   dependencias puestas, y mirar el DOM resultante.

   Sólo se dobla `Borrador` —lo que habla con la red— y `confirm`. Lista, Orden,
   Identificador y ReglasContenido van de verdad: probar el panel contra dobles
   de sus propias piezas comprobaría el doble, no el panel. */
/* El marcado, los modulos y el doble de Borrador viven fuera de la seccion
   para que las dos —el panel de siempre y las tres pantallas del bloque 3c—
   los compartan. Escritos dos veces serian dos paneles que se separan. */
var HTML =
  '<main class="panel">' +
  '<section id="pantallaLista"><h1>Proyectos</h1>' +
  '<p id="aviso" role="status" aria-live="polite"></p>' +
  '<ol id="lista"></ol>' +
  '<form id="nuevo">' +
  '<input id="titulo" type="text"><select id="categoria"></select>' +
  '<input id="fichaCliente" type="text"><input id="fichaAnio" type="number">' +
  '<input id="fichaPapel" type="text"><input id="fichaEnlace" type="url">' +
  '<button type="submit">Crear</button></form>' +
  '<button id="guardar" type="button">Guardar</button>' +
  '<button id="irAPublicar" type="button">Publicar…</button></section>' +
  '<section id="pantallaProyecto" hidden>' +
  '<button id="pVolver" type="button">Volver</button>' +
  '<h2 id="pTitulo"></h2><p id="pAviso" role="status" aria-live="polite"></p>' +
  '<input id="pNombre" type="text"><select id="pCategoria"></select>' +
  '<input id="pCliente" type="text"><input id="pAnio" type="number">' +
  '<input id="pPapel" type="text"><input id="pEnlace" type="url">' +
  '<div id="pSoltar"><input id="pArchivos" type="file" multiple></div>' +
  '<p id="pProgreso" role="status" aria-live="polite"></p>' +
  '<ol id="pFotos"></ol><p id="pProblemas"></p></section>' +
  '<section id="pantallaPublicar" hidden>' +
  '<button id="qVolver" type="button">Volver</button>' +
  '<p id="qCambios"></p><p id="qFalta"></p>' +
  '<p id="qAviso" role="status" aria-live="polite"></p>' +
  '<button id="qPublicar" type="button">Publicar ahora</button></section>' +
  '</main>';

var MODULOS = ['../js/reglas-contenido.js', '../panel/js/identificador.js',
               '../panel/js/orden.js', '../panel/js/rutas.js',
               '../panel/js/edicion.js', '../panel/js/imagenes.js',
               '../panel/js/subida.js', '../panel/js/lista.js',
               '../panel/js/fotos.js', '../panel/js/proyecto.js',
               '../panel/js/subir.js', '../panel/js/pantallas.js',
               '../panel/js/cambios.js', '../panel/js/pantalla-publicar.js',
               '../panel/js/nuevo.js', '../panel/js/publicar.js',
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


/* `extra` lo añadió el bloque 3d, para poder doblar también `Publicacion` sin
   tocar a quien ya llamaba con dos o tres argumentos. */
function conPanel(doble, fn, confirmar, extra) {
  var globales = { Borrador: doble,
                   confirm: confirmar || function () { return true; } };
  Object.keys(extra || {}).forEach(function (k) { globales[k] = extra[k]; });
  return ArnesDom.conDocumento({ html: HTML, globales: globales, scripts: MODULOS }, fn);
}


describeAsync('panel.js', function () {


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

  /* El estado de los ocho controles que toca `activarControles`
     (panel.js:15-25), en este orden: título, categoría, los cuatro campos de
     la ficha, el botón de crear y el de guardar. Se mira la lista entera y no
     un par de ellos: un control que se quedara fuera de `activarControles`
     seguiría activo delante de un `trabajo` que todavía es null. */
  function estadoControles(d) {
    var ids = ['titulo', 'categoria', 'fichaCliente', 'fichaAnio',
               'fichaPapel', 'fichaEnlace'];
    return ids.map(function (id) { return d.getElementById(id).disabled; })
      .concat([d.querySelector('#nuevo button[type="submit"]').disabled,
               d.getElementById('guardar').disabled]);
  }

  function ochoIguales(valor) {
    return [valor, valor, valor, valor, valor, valor, valor, valor];
  }

  /* Rellena el formulario entero. Los campos que la prueba no nombre se
     quedan vacíos, que es justo lo que hace el estudio con los opcionales. */
  function rellenar(d, campos) {
    d.getElementById('titulo').value = campos.titulo || '';
    d.getElementById('categoria').value = campos.categoria || '';
    d.getElementById('fichaCliente').value = campos.cliente || '';
    d.getElementById('fichaAnio').value = campos.anio || '';
    d.getElementById('fichaPapel').value = campos.papel || '';
    d.getElementById('fichaEnlace').value = campos.enlace || '';
  }

  function enviar(w, d) {
    d.getElementById('nuevo')
      .dispatchEvent(new w.Event('submit', { cancelable: true }));
  }

  // ---- Arranque -------------------------------------------------------

  return conPanel(borradorFalso({ diferido: true }), function (w, d) {

    prueba('arranca con los controles deshabilitados, antes de que llegue el borrador', function () {
      igual(estadoControles(d), ochoIguales(true));
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
        /* El nombre es plural: todos los controles que toca
           `activarControles`, no sólo Guardar. */
        prueba('y los controles se quedan apagados', function () {
          igual(estadoControles(d), ochoIguales(true));
        });
      });

  }).then(function () {

    // ---- Carga correcta ----------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      prueba('pinta una fila por proyecto', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      /* Los mismos controles que arriba: el nombre promete «los controles»,
         no sólo título y guardar. */
      prueba('y activa los controles', function () {
        igual(estadoControles(d), ochoIguales(false));
      });
    });

  }).then(function () {

    // ---- Crear --------------------------------------------------------

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      rellenar(d, { titulo: 'Salitre', categoria: 'editorial',
                    anio: '2024', papel: 'Dirección de foto' });
      enviar(w, d);

      prueba('crear añade una fila', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 3);
      });
      prueba('y recuerda que hay que guardar', function () {
        cierto(d.getElementById('aviso').textContent.indexOf('Recuerda guardar') !== -1,
               d.getElementById('aviso').textContent);
      });
      /* El formulario entero, no sólo el título: si los campos de la ficha
         se quedaran escritos, el siguiente proyecto nacería con el cliente y
         el papel del anterior sin que nadie lo pidiera, y eso no da error en
         ningún sitio — se publica y ya está. */
      prueba('y vacía los campos para el siguiente', function () {
        igual([d.getElementById('titulo').value,
               d.getElementById('fichaCliente').value,
               d.getElementById('fichaAnio').value,
               d.getElementById('fichaPapel').value,
               d.getElementById('fichaEnlace').value], ['', '', '', '', '']);
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      rellenar(d, { titulo: 'Niebla', categoria: 'editorial',   // ya existe
                    anio: '2024', papel: 'Dirección de foto' });
      enviar(w, d);

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

    // ---- La ficha del proyecto nuevo ----------------------------------
    /* `trabajo` vive dentro de la IIFE y no sale a ningún sitio, así que la
       ficha del proyecto recién creado se mira donde de verdad importa: en lo
       que se manda a guardar. */

    var conFicha = borradorFalso({ datos: dosProyectos() });
    return conPanel(conFicha, function (w, d) {
      rellenar(d, { titulo: 'Salitre', categoria: 'videoclip',
                    cliente: 'Sony Music', anio: '2024',
                    papel: 'Dirección de foto',
                    enlace: 'https://youtu.be/abc' });
      enviar(w, d);
      d.getElementById('guardar').click();
      var nuevo = conFicha.guardadas[0].proyectos[2];

      prueba('crear mete cliente, año, papel y enlace en la ficha', function () {
        igual(nuevo.ficha, { cliente: 'Sony Music', anio: 2024,
                             papel: 'Dirección de foto',
                             enlace: 'https://youtu.be/abc' });
      });
      /* El año va como número y no como cadena porque así está escrito en
         contenido.json, y una ficha del panel que no se parezca a las que ya
         hay es una divergencia esperando a que alguien compare. */
      prueba('y el año va como número, igual que en contenido.json', function () {
        igual(typeof nuevo.ficha.anio, 'number');
      });
      /* El agujero que cierra esta tarea: desde que la validación exige año y
         papel, un proyecto nacido con `ficha: {}` no se podía publicar nunca,
         y no hay ninguna pantalla donde rellenarlos después. */
      prueba('y la ficha ya no es la que impedía publicar', function () {
        var problemas = w.ReglasContenido.validar({ proyectos: [nuevo] },
                                                  w.ReglasContenido.CATEGORIAS);
        igual(problemas.filter(function (t) {
          return t.indexOf('ficha') !== -1;
        }), []);
      });
    });

  }).then(function () {

    var sinOpcionales = borradorFalso({ datos: dosProyectos() });
    return conPanel(sinOpcionales, function (w, d) {
      rellenar(d, { titulo: 'Salitre', categoria: 'editorial',
                    anio: '2024', papel: 'Estilismo' });
      enviar(w, d);
      d.getElementById('guardar').click();

      /* `cliente` y `enlace` son opcionales: ReglasContenido.validar no los
         exige. Dejarlos en blanco tiene que significar que no están, y no una
         cadena vacía que diga que sí están sin decir nada. La comparación es
         contra la ficha entera y no contra `ficha.cliente`: un `cliente: ''`
         es indistinguible de la ausencia si sólo se mira si es falsy. */
      prueba('un campo opcional en blanco no entra en la ficha', function () {
        igual(sinOpcionales.guardadas[0].proyectos[2].ficha,
              { anio: 2024, papel: 'Estilismo' });
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      rellenar(d, { titulo: 'Salitre', categoria: 'editorial', papel: 'Foto' });
      enviar(w, d);

      /* `required` en el formulario sólo frena el envío del navegador. Ésta es
         la comprobación que impide crear un proyecto que nadie podrá publicar
         ni arreglar, porque el panel no tiene pantalla para editar la ficha de
         un proyecto que ya existe. */
      prueba('sin año no se crea nada', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
      });
      prueba('y el aviso dice qué falta', function () {
        igual(d.getElementById('aviso').textContent,
              'El año y el papel hacen falta para poder publicar.');
      });
    });

  }).then(function () {

    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      rellenar(d, { titulo: 'Salitre', categoria: 'editorial', anio: '2024' });
      enviar(w, d);

      prueba('sin papel tampoco', function () {
        igual(d.querySelectorAll('#lista li.fila').length, 2);
        igual(d.getElementById('aviso').textContent,
              'El año y el papel hacen falta para poder publicar.');
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

/* Las tres pantallas, desde fuera: se pide un destino con Panel.ir y se mira
   qué sección queda visible. Se ejercita el panel entero dentro del iframe,
   con Borrador doblado, igual que la sección de arriba.

   `Panel.ir` existe porque panel.js es una IIFE que no devuelve nada: sin esa
   costura, pedirle desde fuera que cambie de pantalla obligaría a simular
   eventos de hashchange, que es probar el navegador. */
describeAsync('panel.js · tres pantallas', function () {

  function unProyecto() {
    return { version: 3, proyectos: [
      { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/a-1500.jpg',
        piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg',
                   portada: '/img/a-1500.jpg' }] } ] };
  }

  function visible(d, cual) {
    return !d.getElementById(cual).hidden;
  }

  return conPanel(borradorFalso({ datos: unProyecto() }), function (w, d) {
    prueba('arranca en la lista', function () {
      igual(visible(d, 'pantallaLista'), true);
      igual(visible(d, 'pantallaProyecto'), false);
    });

    prueba('ir a un proyecto enseña su pantalla y esconde la lista', function () {
      w.Panel.ir('proyecto', 'bruma');
      igual(visible(d, 'pantallaProyecto'), true);
      igual(visible(d, 'pantallaLista'), false);
      igual(d.getElementById('pTitulo').textContent, 'Bruma');
    });

    /* El fragmento se actualiza para que la dirección sea compartible y el
       botón de atrás del navegador haga lo que se espera. */
    prueba('el fragmento sigue a la pantalla', function () {
      igual(w.location.hash, '#/proyecto/bruma');
    });

    prueba('volver a la lista la enseña otra vez', function () {
      w.Panel.ir('lista');
      igual(visible(d, 'pantallaLista'), true);
      igual(visible(d, 'pantallaProyecto'), false);
    });

    /* Un id que no está en el borrador no puede dejar una pantalla en blanco
       con el encabezado del proyecto anterior. */
    prueba('un proyecto que no existe vuelve a la lista y lo dice', function () {
      w.Panel.ir('proyecto', 'fantasma');
      igual(visible(d, 'pantallaLista'), true);
      cierto(d.getElementById('aviso').textContent.indexOf('fantasma') !== -1,
        'decía: ' + d.getElementById('aviso').textContent);
    });
  }).then(function () {
    return conPanel(borradorFalso({ datos: unProyecto() }), function (w, d) {
      prueba('cada fila de la lista abre su proyecto', function () {
        d.querySelector('[data-accion="abrir"]').click();
        igual(visible(d, 'pantallaProyecto'), true);
      });

      /* hayCambios es lo que el aviso de salir necesita saber. Nada más
         cargar no hay ninguno: el borrador de la pantalla es el del
         servidor. */
      prueba('recién cargado no hay cambios pendientes', function () {
        igual(w.Panel.hayCambios(), false);
      });

      prueba('editar la ficha deja cambios pendientes', function () {
        var papel = d.getElementById('pPapel');
        papel.value = 'Fotografía';
        papel.dispatchEvent(new w.Event('input', { bubbles: true }));
        igual(w.Panel.hayCambios(), true);
      });

      /* El cambio tiene que estar en el borrador que se mandaría, no sólo en
         la caja de texto: si la pantalla escribiera en una copia suya, el
         estudio vería su cambio y guardaría el de antes. */
      prueba('el cambio llega al borrador que se guarda', function () {
        d.getElementById('guardar').click();
        igual(w.Borrador.guardadas[0].proyectos[0].ficha.papel, 'Fotografía');
      });
    });
  });
});

/* Publicar, desde fuera. `Publicacion` se dobla porque es lo que habla con la
   red; `Cambios` y `PantallaPublicar` van de verdad, con el mismo criterio de
   siempre: probar el panel contra dobles de sus propias piezas comprobaría el
   doble. */
describeAsync('panel.js · publicar', function () {

  function publicacionFalsa(o) {
    var opciones = o || {};
    var doble = {
      publicados: [],
      publicado: function (cb) { cb(opciones.publicado || { proyectos: [] }, null); },
      publicar: function (version, cb) {
        doble.publicados.push(version);
        cb(opciones.respuesta || { version: version }, opciones.error || null);
      }
    };
    return doble;
  }

  function listo() {
    return { version: 4, proyectos: [
      { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/a-1500.jpg',
        piezas: [{ url: '/img/a-3000.jpg' }] } ] };
  }

  function conPublicar(opciones, fn) {
    var pub = publicacionFalsa(opciones.publicacion);
    return conPanel(borradorFalso({ datos: listo() }),
      function (w, d) { return fn(w, d, pub); },
      opciones.confirm, { Publicacion: pub });
  }

  return conPublicar({}, function (w, d, pub) {
    w.Panel.ir('publicar');

    prueba('la pantalla de publicar se ve y las otras no', function () {
      igual(d.getElementById('pantallaPublicar').hidden, false);
      igual(d.getElementById('pantallaLista').hidden, true);
    });

    prueba('el resumen dice que entra el proyecto', function () {
      cierto(d.getElementById('qCambios').textContent.indexOf('bruma') !== -1,
        d.getElementById('qCambios').textContent);
    });

    prueba('publicar manda la versión del borrador guardado', function () {
      d.getElementById('qPublicar').click();
      igual(pub.publicados, [4]);
    });

    prueba('y lo dice cuando sale bien', function () {
      cierto(d.getElementById('qAviso').textContent.indexOf('ublicad') !== -1,
        d.getElementById('qAviso').textContent);
    });
  }).then(function () {
    /* Se pregunta SIEMPRE. Es la única acción del panel que se ve desde fuera
       y la única sin deshacer. */
    return conPublicar({ confirm: function () { return false; } }, function (w, d, pub) {
      w.Panel.ir('publicar');
      d.getElementById('qPublicar').click();
      prueba('si se dice que no, no se publica', function () {
        igual(pub.publicados, []);
      });
    });
  }).then(function () {
    return conPublicar({ publicacion: { respuesta: { conflicto: true, guardada: 9 } } },
      function (w, d) {
        w.Panel.ir('publicar');
        d.getElementById('qPublicar').click();
        /* El mismo criterio que al guardar. Reintentar mandaría la misma
           versión vieja y volvería a chocar, en bucle. */
        prueba('un conflicto apaga el botón hasta recargar', function () {
          igual(d.getElementById('qPublicar').disabled, true);
        });
        prueba('y el aviso dice por dónde va el servidor', function () {
          cierto(d.getElementById('qAviso').textContent.indexOf('9') !== -1,
            d.getElementById('qAviso').textContent);
        });
      });
  }).then(function () {
    return conPublicar({ publicacion: { respuesta: { problemas: ['bruma: sin portada'] } } },
      function (w, d) {
        w.Panel.ir('publicar');
        d.getElementById('qPublicar').click();
        /* Un 422 que el panel no había previsto —porque valida con las mismas
           reglas, pero el Worker manda— se enseña entero. Que el botón siga
           activo es lo correcto: se arregla y se reintenta. */
        prueba('un 422 se enseña con sus problemas', function () {
          cierto(d.getElementById('qAviso').textContent.indexOf('sin portada') !== -1,
            d.getElementById('qAviso').textContent);
          igual(d.getElementById('qPublicar').disabled, false);
        });
      });
  });
});
