window.Galeria = (function () {
  var stage = null;
  var canvas = null;
  var stageW = 0, stageH = 0, canvasW = 0, canvasH = 0;
  var minX = 0, minY = 0; // límites (siempre <= 0)
  var curX = 0, curY = 0, targetX = 0, targetY = 0;
  var raf = null;

  var porElemento = {};

  var categoria = null;
  var paneoCongelado = false;
  var temporizadorRecomposicion = null;
  var DURACION_MS = 620;

  var ETIQUETAS = {
    'foto-stills': 'Foto Stills',
    'editorial': 'Editorial',
    'videoclip': 'Videoclip',
    'cortometraje': 'Cortometraje'
  };

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

  function colocar(elemento, x, y, escala) {
    elemento.style.transform =
      'translate3d(' + x + 'vw, ' + y + 'vw, 0) scale(' + escala + ')';
  }

  function elementoDe(id) { return porElemento[id] || null; }

  function construir() {
    var canvas = document.getElementById('spatialCanvas');
    if (!canvas) return;

    window.Datos.PROYECTOS.forEach(function (p) {
      var boton = document.createElement('button');
      boton.className = 'proj';
      boton.type = 'button';
      boton.dataset.id = p.id;
      boton.dataset.cat = p.categoria;
      boton.style.width = p.pos.w + 'vw';
      boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

      var interior = document.createElement('div');
      interior.className = 'proj-inner';

      var img = document.createElement('img');
      img.src = p.portada;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';

      var etiqueta = document.createElement('span');
      etiqueta.className = 'tag';
      etiqueta.textContent = ETIQUETAS[p.categoria] || p.categoria;

      interior.appendChild(img);
      interior.appendChild(etiqueta);
      boton.appendChild(interior);
      canvas.appendChild(boton);

      porElemento[p.id] = boton;
      colocar(boton, p.pos.x, p.pos.y, 1);
    });
  }

  function measure(){
    const r = stage.getBoundingClientRect();
    stageW = r.width; stageH = r.height; canvasW = canvas.offsetWidth; canvasH = canvas.offsetHeight;
    minX = Math.min(0, stageW - canvasW); minY = Math.min(0, stageH - canvasH);
    // posición de reposo: lienzo centrado en el escenario
    targetX = minX / 2; targetY = minY / 2;
    curX = targetX; curY = targetY;
    canvas.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
  }

  function loop(){
    curX += (targetX - curX) * 0.07; curY += (targetY - curY) * 0.07;
    canvas.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    raf = requestAnimationFrame(loop);
  }

  // Centra el lienzo sobre el elemento que recibe el foco (tabulador). Se
  // trabaja con deltas entre rectángulos, no con coordenadas absolutas: así
  // funciona igual con el lienzo filtrado y sin filtrar.
  function centrarEn(el) {
    var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    targetX = clamp(targetX + (s.left + stageW / 2) - (r.left + r.width  / 2), minX, 0);
    targetY = clamp(targetY + (s.top  + stageH / 2) - (r.top  + r.height / 2), minY, 0);
  }

  function conRecomposicion(fn) {
    var canvas = document.getElementById('spatialCanvas');
    if (temporizadorRecomposicion) clearTimeout(temporizadorRecomposicion);
    canvas.classList.add('recomponiendo');
    canvas.offsetHeight;   // fuerza el reflujo: sin esto la transición no arranca
    fn(canvas);
    temporizadorRecomposicion = setTimeout(function () {
      temporizadorRecomposicion = null;
      canvas.classList.remove('recomponiendo');
      measure();
      paneoCongelado = false;
    }, DURACION_MS);
  }

  function aplicarFiltro(nueva) {
    categoria = nueva; paneoCongelado = true;

    var dentro = window.Datos.porCategoria(nueva);
    var ranuras = window.LayoutFiltrado.posicionesCompactas(dentro.length);

    conRecomposicion(function (canvas) {
      window.Datos.PROYECTOS.forEach(function (p) {
        var el = elementoDe(p.id);
        var indice = dentro.indexOf(p);
        if (indice === -1) {
          el.classList.add('apagado');
          el.setAttribute('tabindex', '-1');
          el.setAttribute('aria-hidden', 'true');
        } else {
          var r = ranuras[indice];
          el.classList.remove('apagado');
          el.removeAttribute('tabindex');
          el.removeAttribute('aria-hidden');
          colocar(el, r.x, r.y, r.w / p.pos.w);
        }
      });

      canvas.style.width = window.LayoutFiltrado.ANCHO + 'vw';
      canvas.style.height = window.LayoutFiltrado.altoLienzoFiltrado(dentro.length) + 'vw';
    });

    marcarNavbar(nueva);
  }

  function quitarFiltro() {
    categoria = null; paneoCongelado = true;

    conRecomposicion(function (canvas) {
      window.Datos.PROYECTOS.forEach(function (p) {
        var el = elementoDe(p.id);
        el.classList.remove('apagado');
        el.removeAttribute('tabindex');
        el.removeAttribute('aria-hidden');
        colocar(el, p.pos.x, p.pos.y, 1);
      });

      canvas.style.width = '';
      canvas.style.height = '';
    });

    marcarNavbar(null);
  }

  function marcarNavbar(activa) {
    document.querySelectorAll('.navbar .nav-svg a[data-cat]').forEach(function (a) {
      a.classList.toggle('activa', a.dataset.cat === activa);
    });
  }

  function categoriaActiva() { return categoria; }

  function congelar()    { paneoCongelado = true;  }
  function descongelar() { paneoCongelado = false; }

  function init() {
    var problemas = window.Datos.validarDatos(window.Datos.PROYECTOS, window.Datos.CATEGORIAS);
    if (problemas.length) console.warn('Problemas en los datos:\n' + problemas.join('\n'));
    construir();

    /* ================================================================
       3) STICKY NAVBAR REVEAL
       ================================================================ */
    const navbar = document.getElementById('navbar');

    ScrollTrigger.create({
      trigger: '#gallery',
      start: 'top 85%',
      end: 'bottom bottom',
      onEnter:     () => navbar.classList.add('visible'),
      onLeaveBack: () => navbar.classList.remove('visible'),
      onLeave:     () => navbar.classList.remove('visible'),
      onEnterBack: () => navbar.classList.add('visible')
    });

    /* ================================================================
       4) GALERÍA — NAVEGACIÓN ESPACIAL 2D
       - El lienzo (.spatial-canvas) es mucho más grande que el
         "escenario" visible (.spatial-stage).
       - Con ratón: el lienzo se desplaza en dirección OPUESTA a la
         posición del cursor dentro del escenario (offset respecto al
         centro), con una interpolación (lerp) para dar inercia.
       - Con touch: se sustituye por arrastre (drag) directo, con la
         misma inercia al soltar.
       - Los enlaces del menú centran la categoría correspondiente
         animando el mismo sistema de coordenadas.
       ================================================================ */
    stage  = document.getElementById('spatialStage');
    canvas = document.getElementById('spatialCanvas');
    if(!stage || !canvas) return;

    const isFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    window.addEventListener('resize', measure);
    measure();
    loop();

    // El foco llega por clic, restauración o el tabulador (GaleriaTeclado);
    // en todos los casos basta centrar el lienzo, sin tocar el scroll.
    stage.addEventListener('focusin', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null; if (!boton) return;
      centrarEn(boton);
    });
    window.GaleriaTeclado.init(stage, centrarEn);

    if (isFinePointer){
      const STRENGTH = 0.9; // 0-1, cuánto "empuja" el cursor el lienzo

      stage.addEventListener('mousemove', (e) => {
        if (paneoCongelado) return;
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / stageW;       // 0..1
        const py = (e.clientY - r.top) / stageH;        // 0..1
        const cxN = (px - 0.5) * 2;                       // -1..1
        const cyN = (py - 0.5) * 2;                       // -1..1

        const restX = minX / 2, restY = minY / 2;
        const rangeX = Math.abs(minX) / 2;
        const rangeY = Math.abs(minY) / 2;

        // El lienzo se mueve en dirección OPUESTA al cursor
        targetX = clamp(restX - cxN * rangeX * STRENGTH, minX, 0);
        targetY = clamp(restY - cyN * rangeY * STRENGTH, minY, 0);
      });

      stage.addEventListener('mouseleave', () => {
        targetX = minX / 2; targetY = minY / 2;
      });
    } else {
      // Fallback táctil: arrastre directo con inercia
      let dragging = false;
      let startPX = 0, startPY = 0, startTX = 0, startTY = 0;

      stage.addEventListener('pointerdown', (e) => {
        if (paneoCongelado) return;
        dragging = true; startPX = e.clientX; startPY = e.clientY;
        startTX = targetX; startTY = targetY;
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', (e) => {
        if (paneoCongelado) return;
        if(!dragging) return;
        const dx = e.clientX - startPX, dy = e.clientY - startPY;
        targetX = clamp(startTX + dx, minX, 0);
        targetY = clamp(startTY + dy, minY, 0);
      });
      stage.addEventListener('pointerup',   () => { dragging = false; });
      stage.addEventListener('pointercancel', () => { dragging = false; });
    }

    // Navegación desde el menú: recompone el lienzo con la categoría pulsada
    document.querySelectorAll('.navbar .nav-svg a[data-cat]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = a.dataset.cat;
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
        if (categoria === cat) window.Router.ir('todos');
        else window.Router.ir('categoria', cat);
      });
    });

    window.Router.alCambiar(function (ruta) {
      if (ruta.tipo === 'categoria') {
        if (categoria !== ruta.valor) aplicarFiltro(ruta.valor);
      } else if (categoria !== null) {
        quitarFiltro();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (document.body.classList.contains('visor-abierto')) return;
      if (categoria !== null) window.Router.ir('todos');
    });
  }

  return {
    init: init,
    colocar: colocar,
    elementoDe: elementoDe,
    aplicarFiltro: aplicarFiltro,
    quitarFiltro: quitarFiltro,
    categoriaActiva: categoriaActiva,
    congelar: congelar,
    descongelar: descongelar,
    centrarEn: centrarEn
  };
})();
