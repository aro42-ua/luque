window.VisorLupa = (function () {
  var x = 0, y = 0;
  var arrastrando = false;
  var px = 0, py = 0;
  var ox = 0, oy = 0;        // punto donde empezó el arrastre, no se actualiza al mover
  var movio = false;
  var UMBRAL_ARRASTRE = 4;   // px: por debajo de esto lo tratamos como un clic
  var img = null;
  var escena = null;
  var PASO_TECLADO = 80;

  function puedeAmpliar(imagen) {
    if (!imagen || !imagen.naturalWidth) return false;
    return imagen.naturalWidth  > imagen.clientWidth  + 40 ||
           imagen.naturalHeight > imagen.clientHeight + 40;
  }

  function limites() {
    var r = escena.getBoundingClientRect();
    return {
      minX: Math.min(0, r.width  - img.naturalWidth),
      minY: Math.min(0, r.height - img.naturalHeight)
    };
  }

  function recortar() {
    var l = limites();
    x = Math.max(l.minX, Math.min(0, x));
    y = Math.max(l.minY, Math.min(0, y));
  }

  function pintar() {
    img.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  }

  function entrar(escenaEl) {
    escena = escenaEl;
    img = escena.querySelector('img');
    if (!img) return false;

    // centra la vista en el mismo punto que se estaba viendo
    var r = escena.getBoundingClientRect();
    x = (r.width  - img.naturalWidth)  / 2;
    y = (r.height - img.naturalHeight) / 2;
    recortar();
    pintar();

    escena.addEventListener('pointerdown', alBajar);
    escena.addEventListener('pointermove', alMover);
    escena.addEventListener('pointerup', alSubir);
    escena.addEventListener('pointercancel', alSubir);
    return true;
  }

  function salir(escenaEl) {
    if (!escena) return;
    escena.removeEventListener('pointerdown', alBajar);
    escena.removeEventListener('pointermove', alMover);
    escena.removeEventListener('pointerup', alSubir);
    escena.removeEventListener('pointercancel', alSubir);
    if (img) img.style.transform = '';
    arrastrando = false;
    movio = false;
    img = null;
    escena = null;
  }

  function alBajar(e) {
    arrastrando = true;
    movio = false;
    px = e.clientX; py = e.clientY;
    ox = e.clientX; oy = e.clientY;
    escena.setPointerCapture(e.pointerId);
  }

  function alMover(e) {
    if (!arrastrando) return;
    // El umbral se mide contra el punto de partida, no contra el movimiento
    // anterior: si no, un arrastre lento nunca lo superaría.
    if (Math.abs(e.clientX - ox) > UMBRAL_ARRASTRE ||
        Math.abs(e.clientY - oy) > UMBRAL_ARRASTRE) movio = true;
    x += e.clientX - px;
    y += e.clientY - py;
    px = e.clientX; py = e.clientY;
    recortar();
    pintar();
  }

  function alSubir() { arrastrando = false; }

  function huboArrastre() { return movio; }

  function desplazar(dx, dy) {
    if (!img) return;
    x += dx * PASO_TECLADO;
    y += dy * PASO_TECLADO;
    recortar();
    pintar();
  }

  return {
    entrar: entrar,
    salir: salir,
    puedeAmpliar: puedeAmpliar,
    desplazar: desplazar,
    huboArrastre: huboArrastre
  };
})();
