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

/* El argumento opcional de la Tarea 5. Aquí sólo se prueba la rama
   `alCargar`, y conviene ser exacto sobre por qué, porque lo que había
   escrito antes en este hueco no era cierto:

   La rama por defecto NO revienta en esta página. Medido: en `test.html` no
   hay fragmento, así que `Router.rutaActual()` da `{tipo:'todos'}`,
   `debeSaltarse` es `false` (js/hero.js:41) y la rama se va por
   `mostrarFaseA()` → `mostrarFaseB()` sin tocar `Galeria` en ningún momento.
   Llamando a `Hero.init()` sin argumento en esta misma página: no lanza, y
   4,2 s después `heroMain` tiene la clase `visible` y el botón está
   habilitado, con cero errores de consola.

   Donde sí reventaría es más allá: `Galeria.activar()` —al que sólo se
   llega pulsando ENTRAR, o con una ruta de proyecto o de categoría— llama a
   `window.GaleriaPaneo.medir()` (js/galeria.js:170), y `js/galeria-paneo.js`
   no se carga en esta página (ver tests/test.html, que sí carga
   `js/galeria.js` para las pruebas de `remedir()`, pero no el resto del
   escenario espacial). Comprobado aquí mismo: `window.Galeria.activar()` →
   `TypeError: Cannot read properties of undefined (reading 'medir')`.

   O sea: las fases A y B SÍ serían probables en esta página y hoy no las
   prueba nadie — es un hueco de cobertura abierto, no una puerta cerrada.
   La parte que de verdad no se puede ejercitar aquí es la de después de
   ENTRAR, y ésa se comprueba a mano en el Paso 7 del brief.

   Va en `describeAsync` porque `retirarPreloader` corre sobre `setTimeout`
   de verdad: no hay reloj inyectable en `hero.js` (sus 1200ms mínimos y su
   fundido de 700ms son las constantes que este módulo existe para no
   duplicar en ningún otro sitio, ver el comentario de `hero.js`). El margen
   es holgado sobre el mínimo teórico (1200 + 700 = 1900ms) porque lo que se
   fija es que el aviso LLEGA, no cuándo exactamente. */
describeAsync('Hero.init — el argumento opcional de la Tarea 5', function () {

  /* Los cinco ids que `Hero.init` busca con `getElementById`, más el
     `#gallery` que `rematarEntrada` enfoca (lo usa la tercera prueba). Van
     sueltos en el documento y no dentro de un contenedor propio: `hero.js`
     no recibe una raíz, siempre mira `document` entero. Por lo mismo no
     sirve `ArnesDom.conElemento`: es síncrono a propósito, y aquí hace falta
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
      '</div>' +
      '<div id="gallery" tabindex="-1"></div>';
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

    /* La red que le faltaba al arreglo del cruce de umbral de la Tarea 5.
       `index.html` llama a `Hero.rematar()` cuando la ventana cruza a
       escritorio habiendo entrado por la puerta móvil, y ese camino puede
       recorrerse más de una vez si el ancho oscila alrededor del umbral. Sin
       la guarda `rematada`, el segundo cruce vuelve a robar el foco a
       `#gallery`.

       Antes de esta prueba, las dos mutaciones que destruyen el arreglo
       dejaban la suite ENTERA en verde (medido, 323/0 las dos): quitar la
       guarda (`if (rematada)` → `if (false)`) y vaciar el export
       (`rematar: rematarEntrada` → `rematar: function () {}`).

       Va aquí dentro, y no en un `describe` aparte, por dos motivos de
       orden que no son cosméticos: `rematada` es estado de módulo sin forma
       de reiniciarse —así que esta prueba tiene que ser la última de las de
       `Hero`—, y dos bloques `describeAsync` hermanos arrancarían a la vez
       (`arnes.js` los encadena con `Promise.resolve()`, no uno tras otro),
       de modo que sus dos `Hero.init` se pisarían el `heroEl` del módulo.
       Aquí el `heroEl` que hay puesto es el de la llamada de arriba, que es
       justo el que hace falta.

       `Galeria` y `Visor` se falsifican porque los dos hacen falta y
       ninguno sirve tal cual en esta página: `Galeria.activar()` revienta
       (`GaleriaPaneo` no se carga aquí) y `window.Visor` directamente no
       existe. */
    prueba('rematar dos veces activa la galería una sola vez', function () {
      var galeriaOriginal = window.Galeria;
      var visorOriginal = window.Visor;
      var activaciones = 0;
      try {
        window.Galeria = { activar: function () { activaciones++; } };
        window.Visor = { estaAbierto: function () { return false; } };

        Hero.rematar();
        igual(activaciones, 1);
        igual(document.getElementById('hero').hidden, true);
        cierto(document.body.classList.contains('galeria-activa'),
               'el primer remate tiene que dejar la galería activa');

        /* La aserción que mata las dos mutaciones: sin la guarda vale 2, y
           con `rematar` vaciado vale 0 (y `hidden` seguiría en false). */
        Hero.rematar();
        igual(activaciones, 1);
      } finally {
        window.Galeria = galeriaOriginal;
        window.Visor = visorOriginal;
      }
    });
  }).then(function (r) {
    /* Limpieza en las dos ramas, y las clases de `document.body` también:
       a diferencia del contenedor, ese nodo es compartido con el resto de
       la suite y con la propia página de pruebas. */
    if (caja.parentNode) caja.parentNode.removeChild(caja);
    document.body.classList.remove('preloader-done');
    document.body.classList.remove('galeria-activa');
    return r;
  }, function (e) {
    if (caja.parentNode) caja.parentNode.removeChild(caja);
    document.body.classList.remove('preloader-done');
    document.body.classList.remove('galeria-activa');
    throw e;
  });
});
