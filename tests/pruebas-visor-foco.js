/* El envolvente de foco del visor (`VisorFoco.atrapar`, js/visor-foco.js), que
   hasta el bloque 4e no tenía ninguna prueba y que este bloque rompió sin
   enterarse.

   Se ejercita a través de `js/visor.js`, que es quien lo llama, y no llamando a
   `VisorFoco.atrapar` a pelo: lo que se rompió no fue la función suelta sino el
   diálogo entero, y probarla aislada obligaría a construir a mano la lista de
   focos, o sea a comprobar el escenario en vez del visor.

   POR QUÉ ESTA PRUEBA EXISTE. El envolvente decide quién es el `primero` y el
   `ultimo` foco del diálogo, y hasta esta ronda filtraba sólo por
   `offsetParent !== null`. Ese filtro ve UNA de las dos formas de esconder:
   `display:none` anula
   `offsetParent`, `visibility:hidden` NO. El botón «Cerrar la ficha» que añadió
   este bloque se esconde de las dos maneras según el ancho —`display:none` en
   escritorio, `visibility:hidden` heredada del panel a ≤860px—, así que a
   anchura de móvil entraba en la lista siendo inenfocable, quedaba de `ultimo`,
   y el envolvente no cerraba: medido con Tab nativo por CDP a 800px, el foco se
   escapaba del `role="dialog" aria-modal="true"` a los botones de la rejilla que
   están DETRÁS. Y no es sólo cosa de teléfonos: el interruptor de este proyecto
   es el ANCHO y no el dedo (js/movil.js), así que por aquí pasa una ventana de
   escritorio estrechada a 700px, con teclado.

   POR QUÉ CON EL MARCADO Y EL CSS DE VERDAD. El defecto no está en el
   JavaScript solo ni en el CSS solo: está en el encuentro de los dos. Un
   marcado copiado a mano aquí dejaría de reproducirlo en cuanto index.html
   cambiara, y un CSS falso no lo reproduciría nunca. Por eso el `#visor` se
   saca de `index.html` en vivo y la hoja es `css/luque.css`.

   POR QUÉ NO SE TABULA DE VERDAD. Un `KeyboardEvent` sintético no mueve el foco
   —eso lo hace el navegador, no el evento—, así que lo que se comprueba es lo
   único que el envolvente hace de su parte: que al llegar al extremo llame a
   `focus()` sobre el otro extremo y consuma el evento. Es exactamente la mitad
   que se rompía: con el defecto, `activeElement === ultimo` era inalcanzable,
   no se llamaba a nadie y el evento salía sin consumir — que en un navegador de
   verdad es el Tab escapándose. El comportamiento con Tab nativo está medido
   aparte, por CDP, en el informe de esta ronda.

   Sólo Galeria, Cursor y Movil van doblados, y los tres por lo mismo: son la
   portada, que aquí no existe. Todo lo que el visor usa de sí mismo va de
   verdad. Necesita servidor, como `pruebas-contenido-real.js`: bajo file:// el
   `fetch` de index.html no llega. */
describeAsync('Visor — el envolvente de foco del diálogo', function () {

  /* Un GIF de 1×1 en línea. Las piezas y las miniaturas se pintan de verdad
     (`VisorCarga.pintar` crea la <img>), así que con URLs reales esta sección
     saldría a la red doce veces por corrida. */
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  var PROYECTO = {
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'fotos',
    portada: PIXEL,
    /* Lleva `enlace` a propósito: el botón del vídeo es un `<a href>` visible
       dentro del diálogo, o sea un elemento enfocable más en el ciclo. Este
       fichero existe porque el envolvente de foco ya se rompió una vez al
       añadir un control nuevo; sin el enlace en la fijación, el único sitio
       que ejercita el ciclo con el marcado de verdad nunca vería el botón. */
    ficha: { cliente: 'Ninguno', anio: '2026', papel: 'Fotografía',
             enlace: 'https://vimeo.com/1' },
    piezas: [{ url: PIXEL, miniatura: PIXEL },
             { url: PIXEL, miniatura: PIXEL },
             { url: PIXEL, miniatura: PIXEL }]
  };

  /* El visor entero, en el orden en que index.html los carga. Ninguno toca el
     DOM al definirse, así que basta con que estén todos antes de `init()`. */
  var MODULOS = ['../js/reglas-contenido.js', '../js/datos.js', '../js/router.js',
                 '../js/visor-estado.js', '../js/visor-transicion.js',
                 '../js/visor-lupa.js',
                 /* plataforma.js va ANTES de visor-ficha.js, que lo usa en
                    `pintar()` para el botón del vídeo, igual que index.html. */
                 '../js/plataforma.js', '../js/visor-ficha.js', '../js/visor-video.js',
                 '../js/visor-carga.js', '../js/visor-chrome.js',
                 '../js/visor-origen.js', '../js/visor-foco.js',
                 '../js/visor.js'];

  function dobles() {
    return {
      Galeria: { congelar: function () {}, descongelar: function () {},
                 elementoDe: function () { return null; },
                 categoriaActiva: function () { return null; } },
      Cursor:  { ocultar: function () {}, mostrar: function () {}, restablecer: function () {} },
      Movil:   { actual: function () { return 'escritorio'; } }
    };
  }

  /* El `#visor` tal cual está en index.html. Si algún día deja de existir con
     ese id, esto falla alto en vez de probar un marcado inventado. */
  function marcadoDelVisor() {
    return fetch('../index.html', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('index.html respondió ' + r.status);
        return r.text();
      })
      .then(function (texto) {
        var doc = new DOMParser().parseFromString(texto, 'text/html');
        var visor = doc.getElementById('visor');
        if (!visor) throw new Error('no encontré #visor en index.html');
        return visor.outerHTML;
      });
  }

  /* La hoja se engancha desde aquí y no desde el HTML del arnés para poder
     ESPERAR a que cargue: sin el `load`, la primera medición de
     `getComputedStyle` leería el documento sin estilos y las dos ramas de
     ancho darían lo mismo — la prueba pasaría sin haber probado nada. */
  function conLaHoja(d) {
    return new Promise(function (ok, mal) {
      var l = d.createElement('link');
      l.rel = 'stylesheet';
      l.href = '../css/luque.css';
      l.onload = function () { ok(); };
      l.onerror = function () {
        mal(new Error('el arnés no pudo cargar css/luque.css. Esta sección '
          + 'necesita un servidor: python -m http.server'));
      };
      d.head.appendChild(l);
    });
  }

  /* El ancho del IFRAME es el viewport que ven las media queries de dentro, y
     es el interruptor de todo esto: 800 cae bajo los 860px del `@media` que
     enciende el botón, 1000 no. Se lee `clientWidth` después de asignarlo para
     forzar el recálculo antes de preguntar nada. */
  function conVisorA(ancho, html, fn) {
    return ArnesDom.conDocumento({
      html: html, globales: dobles(), scripts: MODULOS
    }, function (w, d) {
      w.frameElement.style.width = ancho + 'px';
      return conLaHoja(d).then(function () {
        if (d.documentElement.clientWidth !== ancho) {
          throw new Error('el iframe no midió ' + ancho + ' sino '
            + d.documentElement.clientWidth);
        }
        w.Datos.establecer([PROYECTO]);
        w.Visor.init();
        w.Visor.abrir('niebla');
        return fn(w, d);
      });
    });
  }

  function id(el) { return el ? (el.id || el.className || el.tagName) : 'ninguno'; }
  function enFoco(d) { return id(d.activeElement); }

  function tabular(w, d, conShift) {
    var e = new w.KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: !!conShift, bubbles: true, cancelable: true
    });
    d.dispatchEvent(e);
    return e.defaultPrevented;
  }

  function ultimaMiniatura(d) {
    var t = d.querySelectorAll('#visorTira .visor-miniatura');
    return t[t.length - 1];
  }

  return marcadoDelVisor().then(function (html) {

    // ---- Anchura de móvil, la que se rompía ---------------------------

    return conVisorA(800, html, function (w, d) {
      var cerrar = d.getElementById('fichaCerrar');

      /* La premisa del defecto. Si algún día el CSS esconde el panel de otra
         forma, esta prueba cae y avisa de que las tres de abajo han dejado de
         ejercitar lo que creen ejercitar. */
      prueba('a ≤860px el botón de cerrar la ficha se esconde con visibility, que NO anula offsetParent', function () {
        igual([w.matchMedia('(max-width: 860px)').matches,
               w.getComputedStyle(cerrar).display,
               w.getComputedStyle(cerrar).visibility,
               cerrar.offsetParent !== null],
              [true, 'block', 'hidden', true]);
      });

      /* El defecto exacto: con el filtro viejo, `ultimo` era ese botón
         invisible, `activeElement === ultimo` no se cumplía nunca, y el evento
         salía sin consumir — o sea, el Tab fuera del diálogo. */
      prueba('con la ficha cerrada, el Tab desde el último foco visible vuelve al primero', function () {
        ultimaMiniatura(d).focus();
        var consumido = tabular(w, d, false);
        igual([consumido, enFoco(d)], [true, 'visorInfo']);
      });

      /* La otra mitad, que se rompía en silencio: `ultimo.focus()` sobre un
         elemento invisible no hace nada, así que Shift+Tab dejaba el foco
         quieto en el primero. */
      prueba('y Shift+Tab desde el primero llega al último VISIBLE, no al botón invisible', function () {
        d.getElementById('visorInfo').focus();
        var consumido = tabular(w, d, true);
        igual([consumido, d.activeElement === ultimaMiniatura(d)], [true, true]);
      });

      /* Y que el filtro nuevo no se pase de celoso: con la ficha ABIERTA ese
         mismo botón es visible, es lo primero que se ve al abrir el panel, y
         tiene que seguir dentro del ciclo. */
      prueba('con la ficha abierta el botón sí entra en el ciclo, y cierra por él', function () {
        d.getElementById('visorInfo').click();
        var cerrarVisible = w.getComputedStyle(cerrar).visibility;
        cerrar.focus();
        var consumido = tabular(w, d, false);
        igual([cerrarVisible, consumido, enFoco(d)], ['visible', true, 'visorInfo']);
      });
    });

  }).then(function () {

    // ---- Escritorio: lo que ya funcionaba, y que no se movió ----------

    return marcadoDelVisor().then(function (html) {
      return conVisorA(1000, html, function (w, d) {
        var cerrar = d.getElementById('fichaCerrar');

        prueba('en escritorio el mismo botón es display:none, y ahí offsetParent ya bastaba', function () {
          igual([w.matchMedia('(max-width: 860px)').matches,
                 w.getComputedStyle(cerrar).display,
                 cerrar.offsetParent === null],
                [false, 'none', true]);
        });

        prueba('y el envolvente cierra igual que antes del arreglo', function () {
          ultimaMiniatura(d).focus();
          var consumido = tabular(w, d, false);
          igual([consumido, enFoco(d)], [true, 'visorInfo']);
        });
      });
    });
  });
});
