window.MovilVisor = (function () {

  /* El visor móvil (spec docs/superpowers/specs/2026-09-30-visor-premium-design.md).
     Sustituye al visor de dos ejes del bloque 4f: ahora es un carrusel de las
     fotos de UN trabajo, sobre negro —para cambiar de trabajo se vuelve a la
     esfera—, con la ficha como panel que sube desde abajo.

     Quién hace qué: `MovilCarrusel` (js/movil-carrusel.js) decide la física
     —cuánto se mueve la foto con el dedo, adónde va al soltar, cuánto
     tarda—; `MovilZoom`, el pellizco; `MovilFicha`, el contenido de la ficha;
     `VisorFoco`, el tabulador atrapado. Aquí sólo se cablea.

     Manda la ruta, como en todo el sitio: los gestos y los botones NAVEGAN
     (`Router.ir`) y `aplicar` pinta lo que diga la ruta. Así la pantalla y la
     URL nunca dicen cosas distintas, y Atrás funciona sin código propio. */

  var CURVA = 'cubic-bezier(0.16, 1, 0.3, 1)';
  /* Los controles se duermen a los 2,5 s sin tocar. */
  var DORMIR_MS = 2500;
  var ENTRADA_MS = 420;
  var SALIDA_MS = 300;
  var FUNDIDO_REDUCIDO_MS = 150;

  var refs = null;
  var opciones = null;
  /* `aqui` es null con el visor cerrado, y `{proyecto, pieza, ficha}` abierto.
     `pieza` es un número (desde 1), o null en un trabajo sin fotos. */
  var aqui = null;
  var proyecto = null;
  var diapos = {};          // pieza → elemento `.mvisor-diapo`
  var elFocoDeAntes = null;
  var dormir = null;        // id del temporizador de los controles
  var cierreEnCurso = null; // cancela la animación de salida si se reabre

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function porDefecto(o) {
    o = o || {};
    return {
      animar: o.animar || animarDeVerdad,
      medir: o.medir || function () {
        var r = refs.raiz.getBoundingClientRect();
        return { ancho: r.width || window.innerWidth, alto: r.height || window.innerHeight };
      },
      reducido: o.reducido !== undefined
        ? o.reducido
        : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      origen: o.origen || function (id, pieza) {
        return window.MovilGlobo && window.MovilGlobo.origenDe
          ? window.MovilGlobo.origenDe(id, pieza) : null;
      },
      temporizar: o.temporizar || function (f, ms) { return setTimeout(f, ms); },
      cancelar: o.cancelar || function (id) { clearTimeout(id); }
    };
  }

  /* La animación de verdad, con la Web Animations API: interrumpible y sin
     librerías. `desde` y `hasta` son estilos (`transform`, `opacity`). Al
     terminar deja `hasta` escrito en línea y suelta la animación, para que el
     siguiente gesto parta de un estilo que se puede leer. Devuelve una
     función que la corta DONDE ESTÉ, dejando escrito ese punto. */
  function animarDeVerdad(el, desde, hasta, ms, curva, alTerminar) {
    if (!(ms > 0) || !el.animate) {
      escribir(el, hasta);
      if (alTerminar) alTerminar();
      return function () {};
    }
    var a = el.animate([desde, hasta], { duration: ms, easing: curva || CURVA, fill: 'forwards' });
    var hecha = false;
    a.onfinish = function () {
      hecha = true;
      escribir(el, hasta);
      a.cancel();
      if (alTerminar) alTerminar();
    };
    return function () {
      if (hecha) return;
      var c = window.getComputedStyle(el);
      var ahora = {};
      Object.keys(hasta).forEach(function (k) { ahora[k] = c[k]; });
      escribir(el, ahora);
      a.cancel();
    };
  }

  function escribir(el, estilos) {
    Object.keys(estilos).forEach(function (k) { el.style[k] = estilos[k]; });
  }

  function init(r, proyectos, o) {
    refs = r;
    opciones = porDefecto(o);
    aqui = null;
    proyecto = null;
    diapos = {};
    refs.pista.innerHTML = '';
    refs.ficha.innerHTML = '';
    refs.cerrar.addEventListener('click', salir);
    refs.verFicha.addEventListener('click', function () { pedirFicha(); });
    /* Con el foco del teclado en un control, los controles no se duermen. */
    refs.controles.addEventListener('focusin', despertar);
    if (window.MovilVisorGestos) window.MovilVisorGestos.enganchar(api());
  }

  function estado() {
    return aqui ? { proyecto: aqui.proyecto, pieza: aqui.pieza, ficha: aqui.ficha } : null;
  }

  function aplicar(ruta) {
    if (!refs || window.Movil.actual() !== 'movil') return;
    if (ruta.tipo !== 'proyecto') { cerrar(); return; }
    var p = window.Datos.porId(ruta.valor);
    if (!p) { cerrar(); return; }

    var n = (p.piezas && p.piezas.length) || 0;
    var abriendo = aqui === null;
    var cambia = abriendo || aqui.proyecto !== p.id;
    var ficha = ruta.pieza === 'ficha' || n === 0;
    var pieza = null;
    if (n > 0) {
      if (typeof ruta.pieza === 'number' && ruta.pieza >= 1 && ruta.pieza <= n) pieza = ruta.pieza;
      else if (!cambia && aqui.pieza) pieza = aqui.pieza;     // la ficha, sobre la foto que había
      else pieza = 1;
    }
    if (abriendo) elFocoDeAntes = document.activeElement;
    if (cierreEnCurso) { cierreEnCurso(); cierreEnCurso = null; }
    if (cambia) { proyecto = p; montar(p); }
    aqui = { proyecto: p.id, pieza: pieza, ficha: ficha };

    pintarDiapos();
    pintarControles();
    pintarFicha();

    if (abriendo) {
      refs.raiz.hidden = false;
      document.body.classList.add('mvisor-abierto');
      document.addEventListener('keydown', alTeclado);
      entrar();
      refs.cerrar.focus({ preventScroll: true });
    }
    despertar();
  }

  /* Un trabajo nuevo: se vacía la pista y la ficha se rehace. */
  function montar(p) {
    refs.pista.innerHTML = '';
    diapos = {};
    refs.pista.style.transform = '';
    refs.titulo.textContent = p.titulo;
    refs.ficha.innerHTML = '';
    refs.ficha.appendChild(window.MovilFicha.de(p));
    var volver = document.createElement('button');
    volver.type = 'button';
    volver.className = 'mvisor-ficha-volver';
    volver.setAttribute('data-volver', '');
    volver.textContent = (p.piezas && p.piezas.length) ? 'Volver a las fotos' : 'Cerrar';
    volver.addEventListener('click', cerrarFicha);
    refs.ficha.appendChild(volver);
  }

  /* La foto de la pieza y su vecina a cada lado, colocadas a un ancho de
     distancia. Se reutilizan las que ya estaban (su <img> ya cargada) y se
     quitan las que se quedan lejos: la memoria no crece con el recorrido. */
  function pintarDiapos() {
    var n = aqui.pieza;
    var ancho = opciones.medir().ancho;
    var quiero = {};
    if (n) [n - 1, n, n + 1].forEach(function (k) {
      if (k >= 1 && k <= proyecto.piezas.length) quiero[k] = true;
    });
    Object.keys(diapos).forEach(function (k) {
      if (!quiero[k]) { diapos[k].parentNode.removeChild(diapos[k]); delete diapos[k]; }
    });
    Object.keys(quiero).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
      if (!diapos[k]) diapos[k] = crearDiapo(k);
      var d = diapos[k];
      d.style.transform = 'translate3d(' + ((k - n) * ancho) + 'px,0px,0px)';
      d.setAttribute('aria-hidden', k === n ? 'false' : 'true');
      refs.pista.appendChild(d);   // mantiene el orden del DOM
    });
    refs.pista.style.transform = 'translate3d(0px,0px,0px)';
    precargar(n + 1);
    precargar(n - 1);
  }

  /* La foto, con carga progresiva: primero su miniatura —ya descargada por la
     corona—, desenfocada (`.previa`), y la de 1500 encima cuando llega. El
     fallo no releva: mejor la miniatura que una imagen rota. */
  function crearDiapo(k) {
    var pieza = proyecto.piezas[k - 1];
    var d = document.createElement('div');
    d.className = 'mvisor-diapo';
    d.dataset.pieza = String(k);
    var img = document.createElement('img');
    img.className = 'mvisor-foto';
    img.alt = proyecto.titulo + ', foto ' + k + ' de ' + proyecto.piezas.length;
    img.decoding = 'async';
    img.draggable = false;
    var previa = pieza.miniatura;
    img.src = previa || pieza.url;
    if (previa && previa !== pieza.url) {
      img.classList.add('previa');
      var grande = new Image();
      grande.addEventListener('load', function () {
        if (!img.parentNode) return;
        img.src = pieza.url;
        img.classList.remove('previa');
      }, { once: true });
      grande.src = pieza.url;
    }
    d.appendChild(img);
    return d;
  }

  function precargar(k) {
    if (!proyecto || k < 1 || k > proyecto.piezas.length) return;
    var i = new Image();
    i.src = proyecto.piezas[k - 1].url;
  }

  function pintarControles() {
    var total = proyecto.piezas.length;
    refs.verFicha.hidden = total === 0;
    if (!aqui.pieza) {
      refs.contador.textContent = '';
      refs.progreso.style.width = '0%';
      return;
    }
    refs.contador.textContent = pad(aqui.pieza) + ' / ' + pad(total);
    refs.progreso.style.width = (aqui.pieza / total * 100).toFixed(3) + '%';
  }

  function pintarFicha() {
    refs.ficha.classList.toggle('abierta', aqui.ficha);
    refs.ficha.setAttribute('aria-hidden', aqui.ficha ? 'false' : 'true');
    refs.ficha.style.transform = '';
    refs.raiz.classList.toggle('con-ficha', aqui.ficha);
  }

  function despertar() {
    refs.controles.classList.remove('dormidos');
    if (dormir !== null) opciones.cancelar(dormir);
    /* Sin guarda de «con el foco dentro no se duermen»: al abrir, el foco va
       a la × —dentro de los controles— y en un teléfono no se dormirían
       nunca. Quien navega con teclado los despierta con cada `focusin`. */
    dormir = opciones.temporizar(function () {
      dormir = null;
      refs.controles.classList.add('dormidos');
    }, DORMIR_MS);
  }

  function alternarControles() {
    if (refs.controles.classList.contains('dormidos')) despertar();
    else {
      if (dormir !== null) { opciones.cancelar(dormir); dormir = null; }
      refs.controles.classList.add('dormidos');
    }
  }

  /* NAVEGAR. Nada de lo que sigue pinta: pide la ruta y `aplicar` pinta. */
  function irA(pieza) {
    if (!aqui) return;
    window.Router.ir('proyecto', aqui.proyecto, pieza);
  }

  function pedirFicha() {
    if (!aqui || aqui.ficha) return;
    window.Router.ir('proyecto', aqui.proyecto, 'ficha');
  }

  function cerrarFicha() {
    if (!aqui) return;
    if (aqui.pieza) irA(aqui.pieza);
    else salir();
  }

  /* Salir del visor es volver a la esfera. */
  function salir() {
    window.Router.ir('todos', null);
  }

  function alTeclado(e) {
    if (!aqui) return;
    if (e.key === 'Tab') { window.VisorFoco.atrapar(refs.raiz, e); return; }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (aqui.ficha && aqui.pieza) cerrarFicha(); else salir();
      return;
    }
    if (aqui.ficha || !aqui.pieza) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); pedirFicha(); return; }
    var paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    pasar(paso);
  }

  /* Pasar de foto con la pista animada: la vecina entra desde su lado y, al
     llegar, se pide su ruta. En el extremo no pasa nada. */
  function pasar(paso) {
    var destino = aqui.pieza + paso;
    if (destino < 1 || destino > proyecto.piezas.length) return;
    var ancho = opciones.medir().ancho;
    moverPista(0, -paso * ancho, opciones.reducido ? 0 : window.MovilCarrusel.duracion(ancho, 0),
               function () { irA(destino); });
  }

  var cortarPista = null;
  function moverPista(desde, hasta, ms, alTerminar) {
    if (cortarPista) cortarPista();
    cortarPista = opciones.animar(refs.pista,
      { transform: 'translate3d(' + desde + 'px,0px,0px)' },
      { transform: 'translate3d(' + hasta + 'px,0px,0px)' },
      ms, CURVA, function () { cortarPista = null; if (alTerminar) alTerminar(); });
  }

  /* LA ENTRADA: la foto crece desde lo que se tocó —la foto de la corona, o
     la portada— hasta su sitio, mientras el fondo se funde a negro. Es el
     momento principal del visor. Con movimiento reducido, un fundido corto. */
  function entrar() {
    var diapo = aqui.pieza ? diapos[aqui.pieza] : null;
    var desde = diapo ? rectanguloDe(opciones.origen(aqui.proyecto, aqui.pieza)) : null;
    if (opciones.reducido || !desde) {
      opciones.animar(refs.raiz, { opacity: '0' }, { opacity: '1' },
                      opciones.reducido ? FUNDIDO_REDUCIDO_MS : ENTRADA_MS / 2, 'ease');
      return;
    }
    refs.raiz.style.opacity = '';
    opciones.animar(refs.fondo, { opacity: '0' }, { opacity: '1' }, ENTRADA_MS, CURVA);
    opciones.animar(diapo, { transform: hacia(desde, diapo) },
                    { transform: 'translate3d(0px,0px,0px)' }, ENTRADA_MS, CURVA);
  }

  /* LA SALIDA: el camino inverso, hacia la foto de la corona que corresponde a
     la que se está viendo (o la portada), más rápido que la entrada. */
  function cerrar() {
    if (!aqui) return;
    var pieza = aqui.pieza;
    var id = aqui.proyecto;
    var diapo = pieza ? diapos[pieza] : null;
    aqui = null;
    document.removeEventListener('keydown', alTeclado);
    if (dormir !== null) { opciones.cancelar(dormir); dormir = null; }
    var hasta = diapo ? rectanguloDe(opciones.origen(id, pieza)) : null;
    var terminado = false;
    function acabar() {
      if (terminado) return;
      terminado = true;
      cierreEnCurso = null;
      if (aqui) return;             // se reabrió mientras salía
      refs.raiz.hidden = true;
      refs.raiz.style.opacity = '';
      refs.fondo.style.opacity = '';
      refs.pista.innerHTML = '';
      refs.pista.style.transform = '';
      diapos = {};
      proyecto = null;
      refs.raiz.classList.remove('con-ficha', 'cerrando');
      document.body.classList.remove('mvisor-abierto');
      if (elFocoDeAntes && document.contains(elFocoDeAntes)) {
        elFocoDeAntes.focus({ preventScroll: true });
      }
      elFocoDeAntes = null;
    }
    refs.raiz.classList.add('cerrando');
    if (opciones.reducido || !hasta || !diapo) {
      var cortar = opciones.animar(refs.raiz, { opacity: '1' }, { opacity: '0' },
        opciones.reducido ? FUNDIDO_REDUCIDO_MS : SALIDA_MS, 'ease', acabar);
      if (!terminado) cierreEnCurso = function () { cortar(); acabar(); };
      return;
    }
    var actual = diapo.style.transform || 'translate3d(0px,0px,0px)';
    opciones.animar(refs.fondo, { opacity: refs.fondo.style.opacity || '1' }, { opacity: '0' },
                    SALIDA_MS, CURVA);
    var cortarDiapo = opciones.animar(diapo, { transform: actual }, { transform: hacia(hasta, diapo) },
                                      SALIDA_MS, CURVA, acabar);
    if (!terminado) cierreEnCurso = function () { cortarDiapo(); acabar(); };
  }

  function rectanguloDe(el) {
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }

  /* El `transform` que lleva la diapositiva (a pantalla completa, con la foto
     en `contain`) a cubrir el rectángulo `r`: se escala por el ANCHO de la
     foto pintada y se centra en el de `r`. */
  function hacia(r, diapo) {
    var m = opciones.medir();
    var img = diapo.querySelector('img');
    var prop = (img && img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight : r.width / r.height;
    var anchoFoto = Math.min(m.ancho, m.alto * prop);
    var raiz = refs.raiz.getBoundingClientRect();
    var dx = (r.left + r.width / 2) - (raiz.left + m.ancho / 2);
    var dy = (r.top + r.height / 2) - (raiz.top + m.alto / 2);
    return 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0px) scale(' +
      (r.width / anchoFoto).toFixed(4) + ')';
  }

  /* Lo que necesitan los gestos (js/movil-visor-gestos.js, Tarea 5), en un
     solo sitio para que el otro módulo no toque el estado de éste. */
  function api() {
    return {
      refs: function () { return refs; },
      opciones: function () { return opciones; },
      aqui: function () { return aqui; },
      proyecto: function () { return proyecto; },
      diapo: function () { return aqui && aqui.pieza ? diapos[aqui.pieza] : null; },
      irA: irA, pedirFicha: pedirFicha, cerrarFicha: cerrarFicha, salir: salir,
      moverPista: moverPista, alternarControles: alternarControles, despertar: despertar,
      cortarPista: function () { if (cortarPista) { cortarPista(); cortarPista = null; } },
      CURVA: CURVA
    };
  }

  return {
    init: init,
    aplicar: aplicar,
    estado: estado
  };
})();
