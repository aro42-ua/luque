describe('Hero.debeSaltarse', function () {
  prueba('un proyecto se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'proyecto', valor: 'bruma' }), true);
  });

  prueba('una categoría se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'categoria', valor: 'editorial' }), true);
  });

  prueba('sin ruta se muestra el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'todos', valor: null }), false);
  });

  prueba('no se rompe sin argumento', function () {
    igual(Hero.debeSaltarse(undefined), false);
    igual(Hero.debeSaltarse(null), false);
  });

  prueba('un tipo desconocido no se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'inventado', valor: 'x' }), false);
  });
});

/* El argumento opcional de la Tarea 5. Sólo se prueba la rama `alCargar`: la
   rama por defecto acaba llamando a `window.Galeria.activar()`, y
   `js/galeria.js` no se carga en esta página de pruebas —no hay ninguna
   prueba de Galeria en la suite—, así que ejercitarla aquí dispararía un
   error asíncrono sin relación con lo que se quiere comprobar. Esa rama, la
   que ya está en producción, se comprueba a mano en el Paso 7 del brief.

   Va en `describeAsync` porque `retirarPreloader` corre sobre `setTimeout`
   de verdad: no hay reloj inyectable en `hero.js` (sus 1200ms mínimos y su
   fundido de 700ms son las constantes que este módulo existe para no
   duplicar en ningún otro sitio, ver el comentario de `hero.js`). El margen
   es holgado sobre el mínimo teórico (1200 + 700 = 1900ms) porque lo que se
   fija es que el aviso LLEGA, no cuándo exactamente. */
describeAsync('Hero.init — el argumento opcional de la Tarea 5', function () {

  /* Los cinco ids que `Hero.init` busca con `getElementById`. Van sueltos en
     el documento y no dentro de un contenedor propio: `hero.js` no recibe
     una raíz, siempre mira `document` entero. Por lo mismo no sirve
     `ArnesDom.conElemento`: es síncrono a propósito, y aquí hace falta
     esperar de verdad a que pasen los milisegundos del preloader. */
  function montar() {
    var c = document.createElement('div');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0';
    c.innerHTML =
      '<div id="preloader"></div>' +
      '<div id="hero">' +
      '  <div id="heroIntro"></div>' +
      '  <div id="heroMain"><button id="heroBoton" type="button"></button></div>' +
      '</div>';
    document.body.appendChild(c);
    return c;
  }

  function esperar(ms) {
    return new Promise(function (ok) { setTimeout(ok, ms); });
  }

  var caja = montar();
  var llamadas = 0;

  Hero.init({ alCargar: function () { llamadas++; } });

  return esperar(1200 + 700 + 700).then(function () {
    prueba('alCargar se llama exactamente una vez, no la ruta por defecto', function () {
      igual(llamadas, 1);
    });

    prueba('el preloader queda retirado, como en el camino de siempre', function () {
      igual(document.getElementById('preloader').style.display, 'none');
      cierto(document.body.classList.contains('preloader-done'),
             'la clase que marca la carga terminada tiene que ponerse igual');
    });
  }).then(function (r) {
    /* Limpieza en las dos ramas, y la clase de `document.body` también:
       a diferencia del contenedor, ese nodo es compartido con el resto de
       la suite y con la propia página de pruebas. */
    if (caja.parentNode) caja.parentNode.removeChild(caja);
    document.body.classList.remove('preloader-done');
    return r;
  }, function (e) {
    if (caja.parentNode) caja.parentNode.removeChild(caja);
    document.body.classList.remove('preloader-done');
    throw e;
  });
});
