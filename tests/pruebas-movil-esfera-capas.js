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
