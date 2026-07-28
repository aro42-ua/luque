window.VisorTransicion = (function () {
  var CLAVES = ['tl', 'tr', 'bl', 'br'];

  function volar(ctx, origen) {
    var raiz = ctx.raiz, escena = ctx.escena, chrome = ctx.chrome, elCerrar = ctx.elCerrar;
    var img = escena.querySelector('img');
    chrome.classList.add('oculto');

    function arrancar() {
      var destino = img.getBoundingClientRect();
      var ex = origen.width  / destino.width;
      var ey = origen.height / destino.height;
      var dx = origen.left - destino.left;
      var dy = origen.top  - destino.top;

      img.style.transition = 'none';
      img.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + ex + ',' + ey + ')';
      img.style.filter = 'grayscale(35%) contrast(1.05)';

      prepararEsquinas(raiz, origen);

      raiz.offsetHeight;                 // fuerza el reflujo antes de animar
      raiz.classList.remove('entrando');
      raiz.classList.add('viajando');

      img.style.transition = '';
      img.style.transform = 'none';
      img.style.filter = 'none';
      soltarEsquinas(raiz);

      setTimeout(function () {
        raiz.classList.remove('viajando');
        window.Cursor.mostrar();
        elCerrar.focus({ preventScroll: true });
        ctx.alTerminar();
      }, 640);
    }

    if (img.complete) requestAnimationFrame(arrancar);
    else img.addEventListener('load', function () { requestAnimationFrame(arrancar); }, { once: true });
  }

  function prepararEsquinas(raiz, origen) {
    var margen = 9;
    var puntos = {
      tl: { x: origen.left  - margen, y: origen.top    - margen },
      tr: { x: origen.right + margen, y: origen.top    - margen },
      bl: { x: origen.left  - margen, y: origen.bottom + margen },
      br: { x: origen.right + margen, y: origen.bottom + margen }
    };

    CLAVES.forEach(function (clave) {
      var el = raiz.querySelector('.visor-esquina.' + clave);
      el.style.transition = 'none';
      el.style.transform = 'none';
      var r = el.getBoundingClientRect();
      var anclaX = (clave === 'tl' || clave === 'bl') ? r.left : r.right;
      var anclaY = (clave === 'tl' || clave === 'tr') ? r.top  : r.bottom;
      el.style.transform = 'translate(' + (puntos[clave].x - anclaX) + 'px,' +
                                          (puntos[clave].y - anclaY) + 'px)';
      el.style.color = '#0a0a0a';
    });
  }

  function soltarEsquinas(raiz) {
    CLAVES.forEach(function (clave) {
      var el = raiz.querySelector('.visor-esquina.' + clave);
      el.style.transition = '';
      el.style.transform = 'none';
      el.style.color = '';
    });
  }

  function prepararEsquinasHacia(raiz, destino) {
    var margen = 9;
    var puntos = {
      tl: { x: destino.left  - margen, y: destino.top    - margen },
      tr: { x: destino.right + margen, y: destino.top    - margen },
      bl: { x: destino.left  - margen, y: destino.bottom + margen },
      br: { x: destino.right + margen, y: destino.bottom + margen }
    };
    CLAVES.forEach(function (clave) {
      var el = raiz.querySelector('.visor-esquina.' + clave);
      var r = el.getBoundingClientRect();
      var anclaX = (clave === 'tl' || clave === 'bl') ? r.left : r.right;
      var anclaY = (clave === 'tl' || clave === 'tr') ? r.top  : r.bottom;
      el.style.transform = 'translate(' + (puntos[clave].x - anclaX) + 'px,' +
                                          (puntos[clave].y - anclaY) + 'px)';
      el.style.color = '#0a0a0a';
    });
  }

  return {
    CLAVES: CLAVES,
    volar: volar,
    prepararEsquinasHacia: prepararEsquinasHacia
  };
})();
