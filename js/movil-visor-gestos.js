window.MovilVisorGestos = (function () {

  /* Los gestos del visor móvil (spec
     docs/superpowers/specs/2026-09-30-visor-premium-design.md). Vive aparte de
     `js/movil-visor.js` para que aquél se quede en «qué se pinta según la
     ruta» y éste en «qué hace el dedo»; se hablan sólo por la `api` que
     `MovilVisor` le pasa al engancharlo.

     Todo lo que decide números —cuánto se mueve, adónde va, cuánto tarda— es
     de `MovilCarrusel`; el pellizco y el paseo de la foto ampliada, de
     `MovilZoom`. Aquí se leen los punteros y se escriben estilos.

     Los gestos NAVEGAN como los botones: al terminar de pasar de foto se pide
     la ruta, y `MovilVisor.aplicar` repinta con la pista en su sitio. Como la
     diapositiva que queda delante es la misma que acaba de entrar —y ya está
     cargada—, el relevo no se ve. */

  /* Un toque es poco recorrido y poco tiempo; dos toques, dos toques cerca y
     seguidos. El toque simple espera lo que tardaría el segundo en llegar,
     para no alternar los controles justo antes de ampliar. */
  var TOQUE_PX = 10;
  var DOBLE_PX = 30;
  var DOBLE_MS = 300;
  var ESPERA_SIMPLE = 280;
  var ESCALA_DOBLE = 2.5;
  var ZOOM_MS = 300;

  function enganchar(v) {
    var refs = v.refs();
    var o = v.opciones();
    var dedos = {};          // pointerId → {x, y}: los que hay en pantalla
    var g = null;            // el gesto de UN dedo, el primero
    var zoom = window.MovilZoom.inicial();
    var zoomDe = null;       // la <img> a la que pertenece `zoom`
    var base = null, d0 = 0, pareja = null, tope = 1;
    var ultimoToque = null;
    var toqueSimple = null;
    var cortarVuelta = null; // la animación de «vuelve a su sitio», interrumpible

    function medidas() { return o.medir(); }
    function img() { var d = v.diapo(); return d ? d.querySelector('img') : null; }

    /* El zoom es de UNA foto: si la de delante ya no es la misma (pasaste de
       foto, cambió la ruta), empieza encajado. */
    function zoomActual() {
      var i = img();
      if (i !== zoomDe) { zoom = window.MovilZoom.inicial(); zoomDe = i; }
      return zoom;
    }

    /* La foto ocupa la diapositiva entera con `object-fit:contain`, así que la
       caja que pasea `MovilZoom` es la de la pantalla. */
    function medidasPaseo() {
      var m = medidas();
      return { foto: { ancho: m.ancho, alto: m.alto }, marco: { ancho: m.ancho, alto: m.alto } };
    }

    function pintarZoom(animado) {
      var i = img();
      if (!i) return;
      /* El `filter` se conserva: es el relevo de la miniatura desenfocada a
         la foto grande (css/luque.css, `.mvisor-foto`). */
      i.style.transition = animado && !o.reducido
        ? 'transform ' + ZOOM_MS + 'ms ' + v.CURVA + ', filter 250ms ease'
        : 'filter 250ms ease';
      i.style.transform = window.MovilZoom.ampliado(zoom) ? window.MovilZoom.transformar(zoom) : '';
    }

    function dosDedos() {
      var ids = Object.keys(dedos);
      return ids.length === 2 ? [dedos[ids[0]], dedos[ids[1]]] : null;
    }

    function empezarPellizco() {
      var par = dosDedos();
      var quienes = Object.keys(dedos).sort().join('/');
      if (!par) { base = null; pareja = null; return; }
      if (quienes === pareja) return;
      pareja = quienes;
      base = zoomActual();
      d0 = window.MovilZoom.distancia(par[0], par[1]);
      var i = img();
      tope = window.MovilZoom.maxEscala(i ? i.naturalWidth : 0, medidas().ancho);
    }

    function esDeUnControl(e) {
      var el = e.target && e.target.closest ? e.target.closest('button, a') : null;
      return !!el;
    }

    function cortarTodo() {
      v.cortarPista();
      if (cortarVuelta) { cortarVuelta(); cortarVuelta = null; }
    }

    function pistaAhora() {
      var m = /translate3d\(\s*(-?[\d.]+)px/.exec(refs.pista.style.transform || '');
      return m ? Number(m[1]) : 0;
    }

    refs.raiz.addEventListener('pointerdown', function (e) {
      var aqui = v.aqui();
      if (!aqui || esDeUnControl(e)) return;
      cortarTodo();
      dedos[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(dedos).length >= 2) {
        /* Un segundo dedo: el gesto de un dedo se abandona —la pista vuelve a
           su sitio si se había movido— y empieza el pellizco. */
        if (g && g.eje === 'x') v.moverPista(pistaAhora(), 0, 0);
        g = null;
        empezarPellizco();
        return;
      }
      var t = o.ahora();
      g = {
        id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
        t0: t, t: t, vx: 0, vy: 0, eje: null,
        base: pistaAhora(),
        panel: aqui.ficha
      };
      try { refs.raiz.setPointerCapture(e.pointerId); } catch (sinPunteroActivo) {}
    });

    refs.raiz.addEventListener('pointermove', function (e) {
      if (!dedos[e.pointerId]) return;
      dedos[e.pointerId] = { x: e.clientX, y: e.clientY };
      var par = dosDedos();
      if (par && base) {
        zoom = window.MovilZoom.pellizcar(base, d0, window.MovilZoom.distancia(par[0], par[1]),
                                          tope, medidasPaseo());
        pintarZoom(false);
        return;
      }
      if (!g || e.pointerId !== g.id) return;
      var t = o.ahora();
      var dt = Math.max(1, t - g.t);
      g.vx = 0.6 * (e.clientX - g.x) / dt + 0.4 * g.vx;
      g.vy = 0.6 * (e.clientY - g.y) / dt + 0.4 * g.vy;
      var pasoX = e.clientX - g.x, pasoY = e.clientY - g.y;
      g.x = e.clientX; g.y = e.clientY; g.t = t;
      var dx = g.x - g.x0, dy = g.y - g.y0;

      /* Ampliada, el dedo pasea la foto y no pide otra. */
      if (!g.panel && window.MovilZoom.ampliado(zoomActual())) {
        g.eje = g.eje || (Math.hypot(dx, dy) >= TOQUE_PX ? 'paseo' : null);
        if (!g.eje) return;
        zoom = window.MovilZoom.arrastrar(zoom, pasoX, pasoY, medidasPaseo());
        pintarZoom(false);
        return;
      }

      if (!g.eje) {
        g.eje = g.panel ? (Math.hypot(dx, dy) >= TOQUE_PX ? 'y' : null)
                        : window.MovilCarrusel.eje(dx, dy);
        if (!g.eje) return;
      }
      var aqui = v.aqui();
      var m = medidas();
      if (g.panel) {
        refs.ficha.style.transition = 'none';
        refs.ficha.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
        return;
      }
      if (g.eje === 'x') {
        if (!aqui.pieza) return;
        var off = g.base + window.MovilCarrusel.arrastre(dx, m.ancho, aqui.pieza - 1,
                                                         v.proyecto().piezas.length);
        refs.pista.style.transform = 'translate3d(' + off + 'px,0px,0px)';
        return;
      }
      if (dy >= 0) {
        var c = window.MovilCarrusel.cierre(dy, m.alto);
        var d = v.diapo();
        if (d) d.style.transform = 'translate3d(' + (dx * 0.5).toFixed(1) + 'px,' + dy.toFixed(1) +
          'px,0px) scale(' + c.escala.toFixed(4) + ')';
        refs.fondo.style.opacity = c.fondo.toFixed(3);
        if (!aqui.pieza) return;
      } else {
        var p = window.MovilCarrusel.ficha(dy, m.alto);
        refs.ficha.classList.add('arrastrando');
        refs.ficha.style.transition = 'none';
        refs.ficha.style.transform = 'translateY(' + ((1 - p) * 100).toFixed(2) + '%)';
      }
    });

    function soltar(e, cancelado) {
      if (!dedos[e.pointerId]) return;
      delete dedos[e.pointerId];
      if (Object.keys(dedos).length < 2) {
        base = null; pareja = null;
        if (zoom.escala <= 1.01 && window.MovilZoom.ampliado(zoom)) {
          zoom = window.MovilZoom.inicial();
          pintarZoom(true);
        }
      }
      if (!g || e.pointerId !== g.id) return;
      var gg = g;
      g = null;
      var dx = gg.x - gg.x0, dy = gg.y - gg.y0;
      if (!cancelado && !gg.eje && Math.hypot(e.clientX - gg.x0, e.clientY - gg.y0) < TOQUE_PX) {
        toque({ x: e.clientX, y: e.clientY });
        return;
      }
      if (gg.eje === 'paseo' || !gg.eje) return;
      var aqui = v.aqui();
      if (!aqui) return;
      var m = medidas();

      if (gg.panel) {
        refs.ficha.style.transition = '';
        refs.ficha.style.transform = '';
        if (!cancelado && dy > 0 && (dy > m.alto * 0.15 || gg.vy > 0.5)) v.cerrarFicha();
        return;
      }

      if (gg.eje === 'x') {
        if (!aqui.pieza) return;
        var total = v.proyecto().piezas.length;
        var i = aqui.pieza - 1;
        var desde = pistaAhora();
        var destino = cancelado ? i
          : window.MovilCarrusel.destino(desde, gg.vx, m.ancho, i, total);
        var hasta = (i - destino) * m.ancho;
        var ms = o.reducido ? 0 : window.MovilCarrusel.duracion(hasta - desde, gg.vx);
        v.moverPista(desde, hasta, ms, destino !== i ? function () { v.irA(destino + 1); } : null);
        return;
      }

      if (dy >= 0) {
        if (!cancelado && window.MovilCarrusel.seCierra(dy, gg.vy, m.alto)) { v.salir(); return; }
        volverASuSitio();
        return;
      }
      refs.ficha.classList.remove('arrastrando');
      refs.ficha.style.transition = '';
      refs.ficha.style.transform = '';
      if (!cancelado && window.MovilCarrusel.seAbreFicha(dy, gg.vy, m.alto)) v.pedirFicha();
    }

    /* Bajar poco y soltar: la foto vuelve a su sitio y el negro a su luz. */
    function volverASuSitio() {
      var d = v.diapo();
      var ms = o.reducido ? 0 : 260;
      o.animar(refs.fondo, { opacity: refs.fondo.style.opacity || '1' }, { opacity: '1' }, ms, v.CURVA);
      if (!d) return;
      cortarVuelta = o.animar(d, { transform: d.style.transform || 'translate3d(0px,0px,0px) scale(1)' },
        { transform: 'translate3d(0px,0px,0px) scale(1)' }, ms, v.CURVA,
        function () { cortarVuelta = null; });
    }

    /* Un toque espera al posible segundo: si llega, amplía (o encaja); si no,
       alterna los controles. */
    function toque(p) {
      var t = o.ahora();
      if (ultimoToque && t - ultimoToque.t <= DOBLE_MS &&
          Math.hypot(p.x - ultimoToque.p.x, p.y - ultimoToque.p.y) < DOBLE_PX) {
        ultimoToque = null;
        if (toqueSimple !== null) { o.cancelar(toqueSimple); toqueSimple = null; }
        if (!v.aqui().ficha) dobleToque(p);
        return;
      }
      ultimoToque = { t: t, p: p };
      if (toqueSimple !== null) o.cancelar(toqueSimple);
      toqueSimple = o.temporizar(function () {
        toqueSimple = null;
        v.alternarControles();
      }, ESPERA_SIMPLE);
    }

    function dobleToque(p) {
      var i = img();
      if (!i) return;
      if (window.MovilZoom.ampliado(zoomActual())) {
        zoom = window.MovilZoom.inicial();
        pintarZoom(true);
        return;
      }
      /* Hasta el 2,5×, o hasta donde la foto da píxeles si es menos. Sin la
         foto cargada no se sabe, y se deja el 2,5×. */
      var topeFoto = i.naturalWidth
        ? window.MovilZoom.maxEscala(i.naturalWidth, medidas().ancho) : ESCALA_DOBLE;
      var escala = Math.min(ESCALA_DOBLE, topeFoto);
      if (escala <= 1) return;
      var r = refs.raiz.getBoundingClientRect();
      var m = medidas();
      var centro = { x: r.left + m.ancho / 2, y: r.top + m.alto / 2 };
      zoom = window.MovilZoom.encajar(window.MovilCarrusel.dobleToque(p, centro, escala),
                                      medidasPaseo());
      pintarZoom(true);
    }

    refs.raiz.addEventListener('pointerup', function (e) { soltar(e, false); });
    /* Una llamada entrante o el gesto de sistema se quedan el dedo: nunca es
       un toque, y lo que se estuviera moviendo vuelve a su sitio. */
    refs.raiz.addEventListener('pointercancel', function (e) { soltar(e, true); });
  }

  return { enganchar: enganchar };
})();
