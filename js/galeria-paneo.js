window.GaleriaPaneo = (function () {
  var stage = null;
  var canvas = null;
  var stageW = 0, stageH = 0, canvasW = 0, canvasH = 0;
  var minX = 0, minY = 0; // límites (siempre <= 0)
  var curX = 0, curY = 0, targetX = 0, targetY = 0;
  var raf = null;
  var congelado = false;

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

  function medir(){
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
    // Con movimiento reducido no hay paneo animado: se salta al objetivo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      curX = targetX; curY = targetY;
      canvas.style.transform = 'translate3d(' + curX + 'px, ' + curY + 'px, 0)';
    }
  }

  function congelar()      { congelado = true; }
  function descongelar()   { congelado = false; }
  function estaCongelado() { return congelado; }

  function init(escenario, lienzo) {
    stage  = escenario;
    canvas = lienzo;

    const isFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    window.addEventListener('resize', medir);
    medir();
    loop();

    if (isFinePointer){
      /* 1 y no 0,9, y no es una preferencia estética. El recorrido que este
         cálculo alcanza es [minX/2 - |minX|/2·S, minX/2 + |minX|/2·S], o sea
         [(1-S)/2·... ] —con S=0,9 sale [0,95·minX, 0,05·minX]—: una banda
         muerta del 5% de |minX| en CADA borde a la que el ratón no llegaba
         nunca. A 1440x900 eran 14px por los lados y 28px arriba y abajo, y ahí
         caían tres fotos —arena, salitre y raíz— que no se podían ver enteras.

         Se notaba en que con el tabulador sí se veían: `centrarEn` usa el
         recorrido completo [minX, 0]. Esa asimetría entre ratón y teclado era
         la pista.

         Subirlo no es lo mismo que agrandar el lienzo: la banda muerta era un
         PORCENTAJE de |minX|, así que un lienzo mayor la habría agrandado. */
      const STRENGTH = 1; // 0-1, cuánto "empuja" el cursor el lienzo

      stage.addEventListener('mousemove', (e) => {
        if (congelado) return;
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
        if (congelado) return;
        dragging = true; startPX = e.clientX; startPY = e.clientY;
        startTX = targetX; startTY = targetY;
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', (e) => {
        if (congelado) return;
        if(!dragging) return;
        const dx = e.clientX - startPX, dy = e.clientY - startPY;
        targetX = clamp(startTX + dx, minX, 0);
        targetY = clamp(startTY + dy, minY, 0);
      });
      stage.addEventListener('pointerup',   () => { dragging = false; });
      stage.addEventListener('pointercancel', () => { dragging = false; });
    }
  }

  return {
    init: init, medir: medir, centrarEn: centrarEn,
    congelar: congelar, descongelar: descongelar, estaCongelado: estaCongelado
  };
})();
