/* La puerta amarilla tiene que tapar la esfera SIEMPRE, también antes de que
   `MovilPuerta.entrada` ponga `con-hero`.

   Pasó en producción el 2026-09-29, recién desplegada la esfera: al entrar se
   veían las portadas un momento y luego aparecía la puerta. Las teselas llevan
   `z-index` de hasta 1000 (`MovilEsfera.proyectar`), y `.esfera` no formaba
   contexto de apilamiento propio, así que competían de tú a tú con
   `.hoja-hero` y su `z-index:10`, dentro del contexto de `.hoja`, y le ganaban.
   `con-hero` —que esconde la esfera— sólo llega cuando el preloader termina de
   desvanecerse, y durante ese fundido se veía lo que había debajo: la esfera
   por encima del amarillo. Medido en lidialuque.com: quitando `con-hero` con la
   puerta puesta, `elementFromPoint` en el centro daba la tesela de La
   Boquerona.

   Con la hoja de verdad y SIN `con-hero`, a propósito: lo que se fija es que el
   orden de capas no dependa de esa clase. */
describeAsync('La esfera — la puerta la tapa aunque no haya `con-hero`', function () {

  var MARCADO =
    '<section class="hoja" id="hoja">' +
      '<div class="hoja-hero" id="hojaHero"></div>' +
      '<div class="esfera" id="esfera"><ul class="esfera-lista">' +
        '<li class="esfera-tesela" style="width:200px;height:250px;' +
          'transform:translate3d(200px,75px,0);z-index:1000">' +
          '<button class="esfera-boton" type="button"></button></li>' +
      '</ul>' +
      '<p class="esfera-pie"><span class="esfera-titulo">Niebla</span></p>' +
      '<a class="esfera-contacto" href="#/contacto">Contacto</a></div>' +
    '</section>';

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

  function quienEsta(d, x, y) {
    var el = d.elementFromPoint(x, y);
    if (!el) return null;
    if (el.closest('#hojaHero')) return 'puerta';
    if (el.closest('.esfera')) return 'esfera';
    return el.tagName;
  }

  return ArnesDom.conDocumento({ html: MARCADO }, function (w, d) {
    d.body.className = 'es-movil';
    return conLaHoja(d).then(function () {
      prueba('la premisa: sin la puerta, en el centro está la tesela', function () {
        var hero = d.getElementById('hojaHero');
        hero.style.display = 'none';
        var r = quienEsta(d, 300, 200);
        hero.style.display = '';
        igual(r, 'esfera');
      });

      prueba('con la puerta puesta, en el centro está la puerta', function () {
        igual(quienEsta(d, 300, 200), 'puerta');
      });

      prueba('el pie y la pastilla tampoco asoman por encima de la puerta', function () {
        var pie = d.querySelector('.esfera-titulo').getBoundingClientRect();
        var pastilla = d.querySelector('.esfera-contacto').getBoundingClientRect();
        igual([quienEsta(d, pie.left + 5, pie.top + 5),
               quienEsta(d, pastilla.left + 5, pastilla.top + 5)], ['puerta', 'puerta']);
      });
    });
  });
});

/* Los colores de la esfera sobre fondo amarillo (petición de Ángel,
   2026-09-29): ramas y nudo negros, el pie en negro, la pastilla invertida y
   el velo de la profundidad en AMARILLO —las de atrás se funden con el fondo
   en vez de oscurecerse, decisión de Ángel—. Con la hoja de verdad, porque
   todo esto vive sólo en css/luque.css. */
describeAsync('La esfera — fondo amarillo y ramas negras', function () {

  var AMARILLO = 'rgb(255, 255, 0)';
  var NEGRO = 'rgb(10, 10, 10)';

  var MARCADO =
    '<section class="hoja">' +
      '<div class="esfera">' +
        '<div class="esfera-ramas"><span class="esfera-nudo"></span>' +
          '<span class="esfera-rama"></span></div>' +
        '<ul class="esfera-lista"><li class="esfera-tesela">' +
          '<button class="esfera-boton" type="button"><span class="esfera-velo"></span></button>' +
        '</li></ul>' +
        '<p class="esfera-pie"><span class="esfera-titulo">Niebla</span></p>' +
        '<a class="esfera-contacto" href="#/contacto">Contacto</a>' +
      '</div>' +
    '</section>';

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

  return ArnesDom.conDocumento({ html: MARCADO }, function (w, d) {
    d.body.className = 'es-movil';
    return conLaHoja(d).then(function () {
      function css(sel, prop) { return w.getComputedStyle(d.querySelector(sel))[prop]; }

      prueba('el fondo de la esfera es amarillo', function () {
        igual(css('.hoja', 'backgroundColor'), AMARILLO);
      });

      prueba('las ramas y el nudo son negros', function () {
        igual([css('.esfera-rama', 'backgroundColor'), css('.esfera-nudo', 'backgroundColor')],
              [NEGRO, NEGRO]);
      });

      prueba('las de atrás se funden hacia amarillo', function () {
        igual(css('.esfera-velo', 'backgroundColor'), AMARILLO);
      });

      prueba('el pie se lee en negro y la pastilla va invertida', function () {
        igual([css('.esfera-pie', 'color'),
               css('.esfera-contacto', 'backgroundColor'), css('.esfera-contacto', 'color')],
              [NEGRO, NEGRO, AMARILLO]);
      });
    });
  });
});

/* Las fotos de la corona salen DE DETRÁS de la portada abierta (2026-09-30):
   la capa va por debajo de la portada de delante —que asentada lleva
   `z-index` 2001 (`MovilGlobo`, impares para las teselas)— y por encima de
   cualquier otra tesela (1999 como mucho). */
describeAsync('La corona — sale de detrás de la portada', function () {
  var MARCADO = '<section class="hoja"><div class="esfera"><div class="esfera-corona"></div></div></section>';
  function conLaHoja(d) {
    return new Promise(function (ok, mal) {
      var l = d.createElement('link');
      l.rel = 'stylesheet';
      l.href = '../css/luque.css';
      l.onload = function () { ok(); };
      l.onerror = function () { mal(new Error('el arnés no pudo cargar css/luque.css')); };
      d.head.appendChild(l);
    });
  }
  return ArnesDom.conDocumento({ html: MARCADO }, function (w, d) {
    d.body.className = 'es-movil';
    return conLaHoja(d).then(function () {
      prueba('la capa de la corona queda entre la portada de delante y el resto', function () {
        var z = Number(w.getComputedStyle(d.querySelector('.esfera-corona')).zIndex);
        cierto(z < 2001 && z > 1999, 'z-index ' + z);
      });
    });
  });
});
