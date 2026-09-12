window.Contacto = (function () {

  /* La hoja de contacto tiene dos vidas, y la decide el lado (js/movil.js):

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

     En el MÓVIL no es una hoja: es el final del recorrido. Como la portada
     es scroll, el contacto va debajo de las imágenes —decisión de Ángel,
     2026-09-12—, sin enlace ni página aparte. `colocar` mueve la MISMA
     sección dentro de `.hoja`, detrás de la rejilla, y el CSS le quita todo
     lo de capa. La ruta `#/contacto` en ese lado no abre nada: baja hasta la
     sección, que ya está a la vista, y se queda ahí.

     Quién manda en escritorio: el Router, igual que en la galería y el visor.
     Este módulo no decide si está abierto; se lo dice la ruta. Abrir es
     `Router.ir('contacto')` y cerrar es volver a la categoría activa o a la
     portada, exactamente lo que hace `cerrar` en js/visor.js: así la hoja
     respeta el filtro que había puesto quien la abrió. */

  var raiz = null;
  var enlaces = [];
  var abierto = false;
  var quienAbrio = null;
  var lado = 'escritorio';
  var sitioOriginal = null;   // { padre, siguiente } de donde nació la sección
  var ganchos = { congelar: function () {}, descongelar: function () {} };

  /* Guarda las referencias sin tocar el DOM ni suscribirse a nada: es lo que
     las pruebas llaman en vez de `init`, para ejercitar `aplicar` y `colocar`
     sobre un marcado propio. `enlaces` son los que abren la hoja desde fuera
     —hoy sólo el de la barra—: se marcan como activos mientras está abierta,
     como la categoría activa de la barra. `opciones.hoja` es el contenedor
     móvil al que se muda la sección; sin él, `colocar` no mueve nada. */
  function preparar(nodo, opciones) {
    raiz = nodo;
    enlaces = Array.prototype.slice.call(
      document.querySelectorAll('a[href="#/contacto"]'));
    ganchos = { congelar: function () {}, descongelar: function () {} };
    ganchos.hoja = null;
    if (opciones) {
      if (opciones.congelar)    ganchos.congelar    = opciones.congelar;
      if (opciones.descongelar) ganchos.descongelar = opciones.descongelar;
      if (opciones.hoja)        ganchos.hoja        = opciones.hoja;
    }
    abierto = false;
    lado = 'escritorio';
    sitioOriginal = raiz && raiz.parentNode
      ? { padre: raiz.parentNode, siguiente: raiz.nextSibling } : null;
  }

  /* Muda la sección al lado que toca. Lo llama index.html desde las dos
     ramas de `Movil.init`, que corren de forma síncrona al arrancar y cada
     vez que el ancho cruza el umbral: al pasar a móvil la sección se cuelga
     al final de `.hoja`; al volver, a donde nació. Mover un nodo conserva
     sus oyentes, así que no hay nada que volver a cablear.

     Cruzar a móvil con la hoja abierta la cierra sin tocar la ruta: en ese
     lado no hay capa que cerrar, y dejar `body.contacto-abierto` puesto
     escondería la portada entera (`body.contacto-abierto .hoja`). */
  function colocar(nuevoLado) {
    lado = nuevoLado;
    if (!raiz) return;
    if (lado === 'movil') {
      if (abierto) desmontar();
      raiz.setAttribute('aria-hidden', 'false');
      if (ganchos.hoja && raiz.parentNode !== ganchos.hoja) ganchos.hoja.appendChild(raiz);
    } else {
      if (!abierto) raiz.setAttribute('aria-hidden', 'true');
      if (sitioOriginal && raiz.parentNode !== sitioOriginal.padre) {
        sitioOriginal.padre.insertBefore(raiz, sitioOriginal.siguiente);
      }
    }
  }

  function marcarEnlaces(activa) {
    enlaces.forEach(function (a) {
      a.classList.toggle('activa', activa);
      if (activa) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function desmontar() {
    abierto = false;
    document.body.classList.remove('contacto-abierto');
    marcarEnlaces(false);
    ganchos.descongelar();
    quienAbrio = null;
  }

  /* La única transición de estado. Es idempotente a propósito: el Router
     avisa en cada cambio de ruta, también en los que no tienen que ver con
     la hoja, y volver a aplicar el mismo estado no debe mover el foco ni
     congelar dos veces. */
  function aplicar(ruta) {
    if (!raiz) return;
    var quiere = ruta.tipo === 'contacto';

    /* En el móvil la sección ya está a la vista, al pie de la portada: la
       ruta sólo baja hasta ella. Nada de clases ni de foco. */
    if (lado === 'movil') {
      if (quiere && raiz.scrollIntoView) raiz.scrollIntoView({ block: 'start' });
      return;
    }

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
      hoja:        document.getElementById('hoja'),
      congelar:    function () { window.Galeria.congelar(); },
      descongelar: function () { window.Galeria.descongelar(); }
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
       `#/contacto` tiene que encontrar a alguien escuchando. `Movil.init`
       también corre antes, así que `colocar` ya ha decidido el lado. */
    window.Router.alCambiar(aplicar);
  }

  return {
    preparar: preparar,
    colocar: colocar,
    aplicar: aplicar,
    abierto: estaAbierto,
    abrir: abrir,
    cerrar: cerrar,
    init: init
  };
})();
