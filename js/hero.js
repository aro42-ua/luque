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

  /* Quien llega por un enlace a un trabajo concreto no quiere una portada:
     el preloader hace su trabajo y de ahí se pasa directo a la galería. */
  function debeSaltarse(ruta) {
    if (!ruta) return false;
    return ruta.tipo === 'proyecto' || ruta.tipo === 'categoria';
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
        if (debeSaltarse(window.Router.rutaActual())) rematarEntrada();
        else mostrarFaseA();
      }, 700);
    }, restante);
  }

  /* Fase A: el logo de fin de carga. Se sostiene y avanza sola.
     Las dos fases se plantan si la salida ya ha empezado: un temporizador
     rezagado no debe devolver la clase `visible` a un hero que ya se ha ido
     ni pedir el foco para un nodo con `display:none`. */
  function mostrarFaseA() {
    if (saliendo) return;
    intro.classList.add('visible');
    setTimeout(mostrarFaseB, SOSTEN_FASE_A);
  }

  /* Fase B: el logotipo grande con los roles, y el botón debajo. */
  function mostrarFaseB() {
    if (saliendo) return;
    intro.classList.remove('visible');
    principal.classList.add('visible');
    setTimeout(function () {
      if (saliendo) return;
      /* El botón se habilita en el mismo instante en que aparece, no antes:
         deshabilitado no es enfocable, así que hasta aquí el tabulador no
         puede llegar a él ni se puede pulsar el hueco donde estará. */
      boton.disabled = false;
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
    /* En un enlace directo a un proyecto el visor ya se ha abierto y ha puesto
       el foco dentro de su diálogo, donde lo atrapa. Robárselo dejaría la
       trampa sin efecto y un Tab se escaparía por detrás del diálogo abierto. */
    if (!window.Visor.estaAbierto()) {
      document.getElementById('gallery').focus({ preventScroll: true });
    }
  }

  function init() {
    preloader  = document.getElementById('preloader');
    heroEl     = document.getElementById('hero');
    intro      = document.getElementById('heroIntro');
    principal  = document.getElementById('heroMain');
    boton      = document.getElementById('heroBoton');

    /* Nace deshabilitado: mientras es invisible no debe poder pulsarse ni
       recibir el foco. Lo habilita la fase B al mostrarlo. */
    boton.disabled = true;
    boton.addEventListener('click', entrar);

    /* El preloader está en el marcado, así que se ve desde el primer byte: su
       tiempo mínimo se cuenta desde que se pintó la página, no desde este
       init(), que ahora espera al contenido. Contándolo desde aquí, la espera
       de la red se sumaría entera al mínimo en vez de contar para él. */
    arranque = Date.now() - performance.now();

    /* Y por lo mismo, init() ya no corre durante el parseo: puede llegar
       después del load. Suscribirse a un evento que ya se disparó dejaría el
       preloader puesto para siempre, que es justo lo que se venía a evitar. */
    if (document.readyState === 'complete') retirarPreloader();
    else window.addEventListener('load', retirarPreloader);
  }

  return { init: init, debeSaltarse: debeSaltarse };
})();
