window.Cursor = (function () {
  var cursorEl = null;
  var cursorMarca = null;
  var bboxImg = null;

  var DEFAULT_SIZE = 34;
  var NAV_HOVER_SIZE = 50;
  var LERP = 0.18;

  var mouseX = 0, mouseY = 0;
  var curX = 0, curY = 0, curW = DEFAULT_SIZE, curH = DEFAULT_SIZE;
  var started = false;

  // Estado actual: 'default' | 'nav-hover' | 'bbox'
  var state = 'default';

  var NAV_SELECTOR  = '.navbar .nav-svg a';
  var PROJ_SELECTOR = '.proj';

  function raf(){
    let targetW, targetH, targetX, targetY;

    if (state === 'bbox' && bboxImg){
      // [NUEVO] Bounding box exacto de la imagen del proyecto,
      // recalculado cada frame (la galería espacial puede seguir
      // desplazándose bajo el cursor mientras está enfocada).
      const r = bboxImg.getBoundingClientRect();
      targetX = r.left;
      targetY = r.top;
      targetW = r.width;
      targetH = r.height;
    } else {
      targetW = (state === 'nav-hover') ? NAV_HOVER_SIZE : DEFAULT_SIZE;
      targetH = targetW;
      // en modo normal, (mouseX,mouseY) es el CENTRO del cursor
      targetX = mouseX - targetW / 2;
      targetY = mouseY - targetH / 2;
    }

    curX += (targetX - curX) * LERP;
    curY += (targetY - curY) * LERP;
    curW += (targetW - curW) * LERP;
    curH += (targetH - curH) * LERP;

    cursorEl.style.width  = curW + 'px';
    cursorEl.style.height = curH + 'px';
    cursorEl.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;

    requestAnimationFrame(raf);
  }

  function init() {
    /* ================================================================
       5) CURSOR PERSONALIZADO
       [MODIFICADO] Ahora .custom-cursor tiene TRES estados:
         - normal: sigue al ratón, muestra cursor-1.svg (34px).
         - hover navbar: sigue al ratón, muestra cursor-2.svg (50px).
           (comportamiento anterior, ahora limitado solo al navbar)
         - [NUEVO] bbox sobre .proj: la imagen SVG se oculta y el
           propio elemento hace snap exacto al bounding box de la
           <img> del proyecto enfocado (efecto "marco"/bounding box).
       Para que el snap y el seguimiento normal compartan el mismo
       código sin saltos, TODO el posicionamiento se expresa siempre
       como esquina superior-izquierda (left/top) + ancho/alto, y se
       interpola (lerp) cada frame hacia el "target" correspondiente
       al estado activo. Como los proyectos se mueven con el pan de la
       galería espacial, el bounding box se recalcula en cada frame
       mientras el ratón permanece encima (no solo al entrar).
       ================================================================ */
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    cursorEl   = document.getElementById('customCursor');
    cursorMarca = document.getElementById('cursorMarca');
    if(!cursorEl || !cursorMarca) return;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if(!started){ curX = mouseX; curY = mouseY; started = true; }
      cursorEl.classList.add('active');
    });
    document.addEventListener('mouseleave', () => cursorEl.classList.remove('active'));

    raf();

    document.addEventListener('mouseover', (e) => {
      const projEl = e.target.closest && e.target.closest(PROJ_SELECTOR);
      const navEl  = e.target.closest && e.target.closest(NAV_SELECTOR);

      if (projEl){
        // [NUEVO] modo bbox: engancha al <img> real del proyecto
        bboxImg = projEl.querySelector('img') || projEl;
        state = 'bbox';
        cursorEl.classList.add('bbox');
        cursorEl.classList.remove('hover');
      } else if (navEl){
        state = 'nav-hover';
        bboxImg = null;
        cursorEl.classList.add('hover');
        cursorEl.classList.remove('bbox');
        // El intercambio a cursor-2.svg lo hace ahora el CSS con la clase
        // .hover (--marca): así la ruta se declara en la hoja de estilos,
        // que es donde el ../ es correcto. Ver css/luque.css.
      }
    });

    document.addEventListener('mouseout', (e) => {
      const toEl = e.relatedTarget;
      const stillInProj = toEl && toEl.closest && toEl.closest(PROJ_SELECTOR);
      const stillInNav  = toEl && toEl.closest && toEl.closest(NAV_SELECTOR);

      if (e.target.closest && e.target.closest(PROJ_SELECTOR) && !stillInProj){
        state = 'default';
        bboxImg = null;
        cursorEl.classList.remove('bbox');
      }
      if (e.target.closest && e.target.closest(NAV_SELECTOR) && !stillInNav){
        if (state === 'nav-hover') state = 'default';
        cursorEl.classList.remove('hover');
      }
    });
  }

  // cursorEl es null en táctil (init() sale antes de crearlo): sin guarda,
  // abrir/cerrar el visor en un dispositivo sin cursor fino lanzaría y
  // dejaría la galería congelada, el fallo más caro de esta tarea.
  function ocultar() { if (cursorEl) cursorEl.style.display = 'none'; }
  function mostrar() { if (cursorEl) cursorEl.style.display = ''; }

  /* Saca al cursor del modo encuadre a la fuerza. El visor se abre por
     encima de la foto, así que el mouseout que normalmente devolvería el
     cursor a su estado normal nunca llega. */
  function restablecer() {
    if (!cursorEl) return;
    state = 'default';
    bboxImg = null;
    cursorEl.classList.remove('bbox', 'hover');
  }

  return { init: init, ocultar: ocultar, mostrar: mostrar, restablecer: restablecer };
})();
