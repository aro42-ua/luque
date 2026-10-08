window.MovilModos = (function () {

  /* El selector de categorías de la esfera móvil (spec
     docs/superpowers/specs/2026-10-08-esfera-categorias-design.md): una fila
     que se desliza bajo una marca fija, como el selector de modos de una
     cámara —y Lidia es directora de fotografía—. La categoría que queda bajo
     la marca es la activa.

     La fila la mueve este módulo y no el desplazamiento del navegador: vive
     dentro de `.esfera`, que lleva `touch-action:pinch-zoom`, y ahí el
     navegador no desplaza nada en horizontal.

     Este módulo no navega: avisa con `alElegir(id)` sólo cuando la categoría
     CAMBIA, y quien lo usa (`MovilGlobo`) pide la ruta. Cuando la ruta cambia
     por otro lado, `poner` lo deja donde diga. */

  /* Cuánto se proyecta la velocidad del dedo al soltar: un golpe llega más
     lejos que su arrastre. */
  var PROYECCION = 150;
  var UMBRAL = 8;
  var ENCAJE_MS = 320;
  var CURVA = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* El índice cuyo centro queda más cerca de la marca (`mitad`) con la pista
     desplazada `offset` y proyectada por la velocidad. Puro. */
  function destino(offset, v, centros, mitad) {
    var p = offset + v * PROYECCION;
    var mejor = 0, distancia = Infinity;
    for (var k = 0; k < centros.length; k++) {
      var d = Math.abs(centros[k] + p - mitad);
      if (d < distancia) { distancia = d; mejor = k; }
    }
    return mejor;
  }

  function crear(nav, categorias, opciones) {
    opciones = opciones || {};
    var alElegir = opciones.alElegir || function () {};
    var ahora = opciones.ahora || function () { return performance.now(); };
    var reducido = opciones.reducido !== undefined
      ? opciones.reducido
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    nav.innerHTML = '';
    var pista = document.createElement('div');
    pista.className = 'esfera-modos-pista';
    nav.appendChild(pista);
    var botones = categorias.map(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'esfera-modo';
      b.dataset.id = c.id;
      b.textContent = c.nombre;
      b.setAttribute('aria-pressed', 'false');
      pista.appendChild(b);
      return b;
    });

    var activo = 0;
    var offset = 0;
    var gesto = null;

    /* Los centros se miden respecto a la propia pista, así que no dependen
       de dónde esté colocada ahora. */
    function centros() {
      var r = pista.getBoundingClientRect();
      return botones.map(function (b) {
        var c = b.getBoundingClientRect();
        return c.left - r.left + c.width / 2;
      });
    }
    function mitad() { return nav.clientWidth / 2; }
    function offsetDe(k) { return mitad() - centros()[k]; }

    function colocar(o, animado) {
      offset = o;
      pista.style.transition = animado && !reducido
        ? 'transform ' + ENCAJE_MS + 'ms ' + CURVA : 'none';
      pista.style.transform = 'translate3d(' + o.toFixed(1) + 'px,0px,0px)';
    }

    function marcar(k) {
      activo = k;
      botones.forEach(function (b, j) {
        b.setAttribute('aria-pressed', j === k ? 'true' : 'false');
        b.classList.toggle('activo', j === k);
      });
    }

    function elegir(k) {
      k = Math.max(0, Math.min(botones.length - 1, k));
      var cambia = k !== activo;
      marcar(k);
      colocar(offsetDe(k), true);
      if (cambia) alElegir(categorias[k].id);
    }

    function indice(id) {
      for (var k = 0; k < categorias.length; k++) if (categorias[k].id === id) return k;
      return -1;
    }

    function botonDe(e) {
      var b = e.target && e.target.closest ? e.target.closest('button.esfera-modo') : null;
      return b && pista.contains(b) ? botones.indexOf(b) : -1;
    }

    nav.addEventListener('pointerdown', function (e) {
      var t = ahora();
      gesto = { id: e.pointerId, x0: e.clientX, x: e.clientX, t: t, v: 0,
                base: offset, movido: false, k: botonDe(e) };
      try { nav.setPointerCapture(e.pointerId); } catch (sinPunteroActivo) {}
    });

    nav.addEventListener('pointermove', function (e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var dx = e.clientX - gesto.x0;
      if (!gesto.movido && Math.abs(dx) < UMBRAL) return;
      gesto.movido = true;
      var t = ahora();
      gesto.v = 0.6 * (e.clientX - gesto.x) / Math.max(1, t - gesto.t) + 0.4 * gesto.v;
      gesto.x = e.clientX;
      gesto.t = t;
      colocar(gesto.base + dx, false);
    });

    function soltar(e, cancelado) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var g = gesto;
      gesto = null;
      if (!g.movido) {
        if (!cancelado && g.k >= 0) elegir(g.k);
        return;
      }
      elegir(cancelado ? activo : destino(offset, g.v, centros(), mitad()));
    }
    nav.addEventListener('pointerup', function (e) { soltar(e, false); });
    nav.addEventListener('pointercancel', function (e) { soltar(e, true); });

    /* Sólo el clic de TECLADO (Intro o espacio) trae `detail` 0; el del dedo
       ya lo atendió `pointerup`. */
    nav.addEventListener('click', function (e) {
      if (e.detail !== 0) return;
      var k = botonDe(e);
      if (k >= 0) elegir(k);
    });

    nav.addEventListener('keydown', function (e) {
      var paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!paso) return;
      e.preventDefault();
      elegir(activo + paso);
      botones[activo].focus({ preventScroll: true });
    });

    function poner(id, animado) {
      var k = indice(id);
      if (k < 0) k = 0;
      marcar(k);
      colocar(offsetDe(k), !!animado);
    }

    return {
      poner: poner,
      activo: function () { return categorias[activo].id; },
      /* La esfera tiene que saber medir el selector cuando el lado móvil se
         enciende (antes, con `.hoja` apagada, todo mide 0). */
      recolocar: function () { colocar(offsetDe(activo), false); }
    };
  }

  return { destino: destino, crear: crear };
})();
