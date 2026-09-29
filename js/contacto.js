window.Contacto = (function () {

  /* La hoja de contacto es una capa amarilla, la misma en los dos lados:

     En ESCRITORIO es una capa amarilla que se pone delante de la galería
     cuando la ruta es `#/contacto`, y se quita cuando deja de serlo. No es
     un diálogo modal y no lo finge. La barra superior sigue delante (z-index
     500 contra los 400 de la hoja) y sigue funcionando: «Contacto» vuelve a
     pulsarse para cerrar —el mismo gesto que ya tiene una categoría activa—,
     la marca lleva a la portada y una categoría filtra la galería y cierra la
     hoja al mismo tiempo. Por eso el foco no se atrapa dentro: la salida
     natural por tabulador es, precisamente, la barra. Lo que sí se hace es
     que la galería de detrás deje de existir para el tabulador y para el
     lector de pantalla mientras la hoja está delante: eso es cosa de
     css/luque.css (`body.contacto-abierto .gallery`).

     En el MÓVIL es la MISMA capa, abierta desde la pastilla «Contacto» que
     flota sobre la esfera (index.html, `.esfera-contacto`). Hasta el
     2026-09-29 se mudaba al pie de la rejilla, porque la portada era scroll;
     la esfera ocupa la pantalla entera y ya no hay pie al que bajar.

     Quién manda en escritorio: el Router, igual que en la galería y el visor.
     Este módulo no decide si está abierto; se lo dice la ruta. Abrir es
     `Router.ir('contacto')` y cerrar es volver a la categoría activa o a la
     portada, exactamente lo que hace `cerrar` en js/visor.js: así la hoja
     respeta el filtro que había puesto quien la abrió. */

  var raiz = null;
  var enlaces = [];
  var abierto = false;
  var quienAbrio = null;
  var ganchos = { congelar: function () {}, descongelar: function () {} };

  /* Guarda las referencias sin tocar el DOM ni suscribirse a nada: es lo que
     las pruebas llaman en vez de `init`, para ejercitar `aplicar` sobre un
     marcado propio. `enlaces` son los que abren la hoja desde fuera —la barra
     en escritorio, la pastilla de la esfera en el móvil—: se marcan como
     activos mientras está abierta, como la categoría activa de la barra. */
  function preparar(nodo, opciones) {
    raiz = nodo;
    enlaces = Array.prototype.slice.call(
      document.querySelectorAll('a[href="#/contacto"]'));
    ganchos = { congelar: function () {}, descongelar: function () {} };
    if (opciones) {
      if (opciones.congelar)    ganchos.congelar    = opciones.congelar;
      if (opciones.descongelar) ganchos.descongelar = opciones.descongelar;
    }
    abierto = false;
  }

  function marcarEnlaces(activa) {
    enlaces.forEach(function (a) {
      a.classList.toggle('activa', activa);
      if (activa) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* La única transición de estado. Es idempotente a propósito: el Router
     avisa en cada cambio de ruta, también en los que no tienen que ver con
     la hoja, y volver a aplicar el mismo estado no debe mover el foco ni
     congelar dos veces. */
  function aplicar(ruta) {
    if (!raiz) return;
    var quiere = ruta.tipo === 'contacto';

    if (quiere === abierto) return;
    abierto = quiere;

    document.body.classList.toggle('contacto-abierto', quiere);
    raiz.setAttribute('aria-hidden', quiere ? 'false' : 'true');
    marcarEnlaces(quiere);

    if (quiere) {
      quienAbrio = document.activeElement;
      ganchos.congelar();
      /* El título recibe el foco para que el lector de pantalla lea la hoja
         desde el principio; lleva tabindex="-1" en el marcado, así que el
         tabulador no vuelve a pararse en él. `preventScroll`: la hoja es una
         capa fija, no hay nada que desplazar. */
      var titulo = raiz.querySelector('[tabindex="-1"]');
      if (titulo) titulo.focus({ preventScroll: true });
    } else {
      ganchos.descongelar();
      /* Devuelve el foco a quien abrió si sigue en la página; si no —se abrió
         desde un enlace en frío—, al primer enlace visible que abre la hoja.
         `offsetParent` es nulo con `display:none`. */
      var destino = (quienAbrio && document.contains(quienAbrio) && quienAbrio !== document.body)
        ? quienAbrio
        : enlaces.filter(function (a) { return a.offsetParent !== null; })[0];
      if (destino && destino.focus) destino.focus({ preventScroll: true });
      quienAbrio = null;
    }
  }

  function estaAbierto() { return abierto; }

  function abrir() { window.Router.ir('contacto'); }

  /* Cerrar es volver a donde se estaba: la categoría activa si la había, la
     portada si no. La misma regla que `cerrar` en js/visor.js, y por la misma
     razón: la hoja no debe deshacer el filtro que había debajo. */
  function cerrar() {
    var cat = window.Galeria && window.Galeria.categoriaActiva
      ? window.Galeria.categoriaActiva() : null;
    if (cat) window.Router.ir('categoria', cat);
    else window.Router.ir('todos');
  }

  function alPulsarTecla(e) {
    if (!abierto || e.key !== 'Escape') return;
    e.preventDefault();
    cerrar();
  }

  function init() {
    var nodo = document.getElementById('contacto');
    if (!nodo) return;
    preparar(nodo, {
      congelar:    function () { window.Galeria.congelar(); window.MovilGlobo.congelar(); },
      descongelar: function () { window.Galeria.descongelar(); window.MovilGlobo.descongelar(); }
    });

    /* Los enlaces que abren la hoja alternan, como una categoría: pulsado
       con la hoja abierta, cierra. preventDefault porque `Router.ir` es quien
       escribe el hash, y decide si empuja o reemplaza. */
    enlaces.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (abierto) cerrar(); else abrir();
      });
    });

    Array.prototype.forEach.call(
      nodo.querySelectorAll('[data-contacto-cerrar]'),
      function (b) { b.addEventListener('click', cerrar); });

    document.addEventListener('keydown', alPulsarTecla);

    /* Se suscribe ANTES de `Router.init()` —index.html lo garantiza—: el
       Router avisa de forma síncrona al arrancar, y un enlace en frío a
       `#/contacto` tiene que encontrar a alguien escuchando. */
    window.Router.alCambiar(aplicar);
  }

  return {
    preparar: preparar,
    aplicar: aplicar,
    abierto: estaAbierto,
    abrir: abrir,
    cerrar: cerrar,
    init: init
  };
})();
