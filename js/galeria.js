window.Galeria = (function () {
  var stage = null;
  var canvas = null;
  var stageW = 0, stageH = 0, canvasW = 0, canvasH = 0;
  var minX = 0, minY = 0; // límites (siempre <= 0)
  var curX = 0, curY = 0, targetX = 0, targetY = 0;
  var raf = null;

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

  function measure(){
    const r = stage.getBoundingClientRect();
    stageW = r.width;
    stageH = r.height;
    canvasW = canvas.offsetWidth;
    canvasH = canvas.offsetHeight;
    minX = Math.min(0, stageW - canvasW);
    minY = Math.min(0, stageH - canvasH);
    // posición de reposo: lienzo centrado en el escenario
    targetX = minX / 2;
    targetY = minY / 2;
    curX = targetX;
    curY = targetY;
    canvas.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
  }

  function loop(){
    curX += (targetX - curX) * 0.07;
    curY += (targetY - curY) * 0.07;
    canvas.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    raf = requestAnimationFrame(loop);
  }

  function init() {
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

    if (isFinePointer){
      const STRENGTH = 0.9; // 0-1, cuánto "empuja" el cursor el lienzo

      stage.addEventListener('mousemove', (e) => {
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
        targetX = minX / 2;
        targetY = minY / 2;
      });
    } else {
      // Fallback táctil: arrastre directo con inercia
      let dragging = false;
      let startPX = 0, startPY = 0, startTX = 0, startTY = 0;

      stage.addEventListener('pointerdown', (e) => {
        dragging = true;
        startPX = e.clientX; startPY = e.clientY;
        startTX = targetX; startTY = targetY;
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', (e) => {
        if(!dragging) return;
        const dx = e.clientX - startPX;
        const dy = e.clientY - startPY;
        targetX = clamp(startTX + dx, minX, 0);
        targetY = clamp(startTY + dy, minY, 0);
      });
      stage.addEventListener('pointerup',   () => { dragging = false; });
      stage.addEventListener('pointercancel', () => { dragging = false; });
    }

    // Navegación desde el menú: centra la categoría pulsada
    function focusCategory(catId){
      const el = document.querySelector(`.proj[data-cat="${catId}"]`);
      if(!el) return;
      const elCenterX = el.offsetLeft + el.offsetWidth / 2;
      const elCenterY = el.offsetTop + el.offsetHeight / 2;
      targetX = clamp(stageW / 2 - elCenterX, minX, 0);
      targetY = clamp(stageH / 2 - elCenterY, minY, 0);
    }

    document.querySelectorAll('.navbar .nav-svg a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
        // pequeño margen para que el scroll haya llegado antes de medir
        setTimeout(() => { measure(); focusCategory(id); }, 350);
      });
    });
  }

  return { init: init };
})();
