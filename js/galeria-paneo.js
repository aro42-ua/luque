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
      /* Este número decide cuánta pantalla hay que recorrer para llegar al
         tope del paneo. El recorrido que alcanza es
         [minX/2 - |minX|/2·S, minX/2 + |minX|/2·S], recortado a [minX, 0].

         Valía 0,9, y con eso NO llegaba al tope: el recorrido salía
         [0,95·minX, 0,05·minX], una banda muerta del 5% de |minX| en cada
         borde. A 1440x900 eran 14px por los lados y 28px arriba y abajo, y
         dentro caían tres fotos —arena, salitre y raíz— que no había forma de
         ver enteras con el ratón. Se notaba en que con el tabulador sí: la
         asimetría entre ratón y teclado era la pista, porque `centrarEn` usa
         [minX, 0] entero.

         Con S=1 el tope se alcanza, pero SÓLO en el borde exacto de la
         pantalla. Y eso no basta: una foto pegada al borde del lienzo está
         entera en una única posición del paneo, así que había que clavar el
         ratón en el píxel justo. Medido sobre las doce fotos, la más difícil
         estaba entera en el 0,8% de las posiciones del ratón.

         Con S>1 el cálculo satura ANTES de llegar al borde —en la fracción
         (1 ± 1/S)/2—, así que el tope se alcanza desde una banda ancha en vez
         de desde una línea. Con S=2 satura en 0,25 y 0,75: el cuarto exterior
         de cada lado ya vale, y esa foto pasa del 0,8% al 8,7%. Once veces más
         fácil.

         Lo que se paga: el cuarto exterior de cada lado deja de mover nada, y
         en la mitad central el lienzo va al doble de velocidad. Subir más lo
         hace más fácil todavía (S=3 da 13,2%) pero también más brusco, porque
         cada vez queda menos pantalla haciendo todo el recorrido.

         Lo que NO arregla esto es agrandar el lienzo: la banda muerta del 0,9
         era un PORCENTAJE de |minX|, así que un lienzo mayor la agrandaba. */
      const STRENGTH = 2;

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
