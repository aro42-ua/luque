window.Hero = (function () {
  var preloader = null;
  var heroEl = null;
  var intro = null;
  var principal = null;
  var boton = null;

  var MIN_PRELOADER = 1200;   // ms que el preloader se ve como mínimo
  var SOSTEN_FASE_A = 900;    // ms que se sostiene el logo de fin de carga
  var arranque = 0;
  var saliendo = false;

  function movimientoReducido() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* Retira el preloader respetando su tiempo mínimo y encadena la fase A. */
  function retirarPreloader() {
    var transcurrido = Date.now() - arranque;
    var restante = Math.max(0, MIN_PRELOADER - transcurrido);
    setTimeout(function () {
      preloader.classList.add('fuera');
      setTimeout(function () {
        preloader.style.display = 'none';
        document.body.classList.add('preloader-done');
        mostrarFaseA();
      }, 700);
    }, restante);
  }

  /* Fase A: el logo de fin de carga. Se sostiene y avanza sola. */
  function mostrarFaseA() {
    intro.classList.add('visible');
    setTimeout(mostrarFaseB, SOSTEN_FASE_A);
  }

  /* Fase B: el logotipo grande con los roles, y el botón debajo. */
  function mostrarFaseB() {
    intro.classList.remove('visible');
    principal.classList.add('visible');
    setTimeout(function () {
      boton.classList.add('visible');
      boton.focus();
    }, 400);
  }

  /* Pulsar el botón dispara la secuencia. La galería se hace visible ya,
     aunque esté tapada por el hero opaco, para que al volverse transparente
     el fondo en el paso 3 no haya nada que montar: solo aparece. */
  function entrar() {
    if (saliendo) return;
    saliendo = true;
    boton.disabled = true;
    document.body.classList.add('entrando');

    if (movimientoReducido()) {
      heroEl.classList.add('saliendo');
      setTimeout(rematarEntrada, 200);
      return;
    }

    heroEl.addEventListener('animationend', function alTerminar(e) {
      if (e.target !== heroEl) return;   // solo la del propio hero, no las de los hijos
      heroEl.removeEventListener('animationend', alTerminar);
      rematarEntrada();
    });
    heroEl.classList.add('saliendo');
  }

  function rematarEntrada() {
    heroEl.hidden = true;
    document.body.classList.remove('entrando');
    document.body.classList.add('galeria-activa');
    window.Galeria.activar();
  }

  function init() {
    preloader  = document.getElementById('preloader');
    heroEl     = document.getElementById('hero');
    intro      = document.getElementById('heroIntro');
    principal  = document.getElementById('heroMain');
    boton      = document.getElementById('heroBoton');

    boton.addEventListener('click', entrar);

    arranque = Date.now();
    window.addEventListener('load', retirarPreloader);
  }

  return { init: init };
})();
