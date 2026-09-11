window.VisorTransicion = (function () {
  function volar(ctx, origen) {
    var raiz = ctx.raiz, escena = ctx.escena, chrome = ctx.chrome, elCerrar = ctx.elCerrar;
    // Puede ser la <img> de una foto o el <video> de un videoclip: en
    // ambos casos es el único hijo de la escena y el vuelo es idéntico,
    // así que basta con no fijar la etiqueta.
    var el = escena.querySelector('img, video');
    chrome.classList.add('oculto');

    function arrancar() {
      var destino = el.getBoundingClientRect();
      var ex = origen.width  / destino.width;
      var ey = origen.height / destino.height;
      var dx = origen.left - destino.left;
      var dy = origen.top  - destino.top;

      el.style.transition = 'none';
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + ex + ',' + ey + ')';
      el.style.filter = 'grayscale(35%) contrast(1.05)';

      raiz.offsetHeight;                 // fuerza el reflujo antes de animar
      raiz.classList.remove('entrando');
      raiz.classList.add('viajando');

      el.style.transition = '';
      el.style.transform = 'none';
      el.style.filter = 'none';

      setTimeout(function () {
        raiz.classList.remove('viajando');
        window.Cursor.mostrar();
        elCerrar.focus({ preventScroll: true });
        ctx.alTerminar();
      }, 640);
    }

    // Un <video> no tiene .complete: su póster ya se pinta en cuanto se
    // añade al DOM, así que el vuelo puede arrancar en el siguiente frame
    // sin esperar ningún evento de carga.
    if (el.tagName === 'VIDEO' || el.complete) requestAnimationFrame(arrancar);
    else el.addEventListener('load', function () { requestAnimationFrame(arrancar); }, { once: true });
  }

  return { volar: volar };
})();
