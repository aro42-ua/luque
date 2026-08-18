window.VisorVideo = (function () {
  var video = null;
  var linea, hecho, marca;
  var alDespertarChrome = null;

  // init: cachea los elementos de la línea de tiempo y engancha sus
  // manejadores de puntero y teclado, una sola vez. alDespertarChrome es
  // el callback de js/visor.js que rearma el temporizador de desvanecimiento
  // del chrome; este módulo no conoce el resto del estado del visor.
  function init(alDespertar) {
    alDespertarChrome = alDespertar;
    linea = document.getElementById('visorLinea');
    hecho = document.getElementById('visorLineaHecho');
    marca = document.getElementById('visorLineaMarca');

    var buscando = false;

    function buscarEn(clientX) {
      var r = linea.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if (video && video.duration) video.currentTime = pct * video.duration;
    }

    linea.onpointerdown = function (e) { buscando = true; linea.setPointerCapture(e.pointerId); buscarEn(e.clientX); };
    linea.onpointermove = function (e) { if (buscando) buscarEn(e.clientX); };
    linea.onpointerup   = function () { buscando = false; };
    linea.onkeydown = function (e) {
      if (!video || !video.duration) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); }
    };
  }

  // pintar: si el proyecto es de vídeo crea el <video>, lo conecta a la
  // línea de tiempo y lo añade a la escena; devuelve true. Si no, suelta
  // el vídeo que hubiera y devuelve false para que js/visor.js pinte la
  // <img> de siempre. Este módulo decide el "cómo" (qué elemento crear,
  // cómo cablearlo); js/visor.js sigue decidiendo el "cuándo".
  function pintar(escena, proyecto) {
    if (proyecto.tipo !== 'video') {
      detener();          // una navegación directa por hash no pasa por rematar():
      return false;       // sin esto, activo() seguiría respondiendo true y las
    }                     // guardas del modo vídeo matarían las flechas sobre la foto
    var v = document.createElement('video');
    /* vimeo llega null hasta el bloque 4: sin fuente, el <video> se queda en su
       poster en vez de pedir una URL que no existe. Asignar null a src lo
       convertiría en la cadena "null" y el navegador pediría /null. */
    if (proyecto.vimeo) v.src = proyecto.vimeo;
    v.poster = proyecto.poster;
    v.preload = 'metadata';
    v.playsInline = true;
    v.setAttribute('aria-label', proyecto.titulo);
    escena.appendChild(v);
    conectar(v);
    return true;
  }

  function conectar(v) {
    video = v;
    // Sin archivo real (video/*.mp4 no existen todavía) duration nunca
    // llega: la línea se queda quieta en 0, sin error ni parpadeo.
    hecho.style.width = '0%';
    marca.style.left = '0%';
    linea.setAttribute('aria-valuenow', '0');

    v.addEventListener('timeupdate', function () {
      if (!v.duration) return;
      var pct = (v.currentTime / v.duration) * 100;
      hecho.style.width = pct + '%';
      marca.style.left = pct + '%';
      linea.setAttribute('aria-valuenow', Math.round(pct));
    });
  }

  function alternarReproduccion() {
    if (!video) return;
    // Sin los mp4 reales la promesa de play() se rechaza; el catch vacío evita que algunas consolas la muestren.
    if (video.paused) video.play().catch(function () {}); else video.pause();
    if (alDespertarChrome) alDespertarChrome();
  }

  // alPulsarTecla: intercepta la barra espaciadora cuando hay un vídeo
  // activo y devuelve true si la ha consumido. preventDefault() evita que
  // el navegador la interprete como clic del botón de cerrar (que tiene el
  // foco al abrir el visor) o como scroll de página.
  function alPulsarTecla(e) {
    if (!video || e.key !== ' ') return false;
    e.preventDefault();
    alternarReproduccion();
    return true;
  }

  function activo() { return !!video; }

  // detener: para el vídeo y suelta la referencia para que no siga sonando
  // sobre la galería. Lo llama rematar() en js/visor.js al cerrar el visor.
  function detener() {
    if (video) { video.pause(); video = null; }
  }

  return {
    init: init,
    pintar: pintar,
    activo: activo,
    alternarReproduccion: alternarReproduccion,
    alPulsarTecla: alPulsarTecla,
    detener: detener
  };
})();
