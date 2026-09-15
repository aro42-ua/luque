window.GaleriaPaneo = (function () {
  var stage = null;
  var canvas = null;
  var stageW = 0, stageH = 0, canvasW = 0, canvasH = 0;
  /* Límites del recorrido del lienzo. Cuando el lienzo es MÁS GRANDE que el
     escenario —el caso normal— van de un negativo a 0, como siempre. Cuando
     es más pequeño no hay recorrido: los dos extremos valen lo mismo, la
     posición que lo deja centrado, y el lienzo se queda ahí.

     Antes sólo existía `minX = Math.min(0, stageW - canvasW)`, o sea que un
     lienzo más estrecho que la pantalla se quedaba clavado en 0 —pegado
     arriba y a la izquierda, con el resto de la pantalla amarillo—. Era la
     razón por la que la vista filtrada tenía que agrandar sus fotos para que
     el lienzo no bajase de 100vw de ancho; con esto, ya no. */
  var minX = 0, minY = 0, maxX = 0, maxY = 0;
  var curX = 0, curY = 0, targetX = 0, targetY = 0;
  var raf = null;
  var congelado = false;
  /* La barra superior y la posición del lienzo a partir de la cual su franja
     queda despejada. Ver `medirBarra`. */
  var barra = null;
  var topeBarra = 0;

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

  // El punto medio del recorrido, que es donde el lienzo queda centrado tanto
  // si sobra escenario como si sobra lienzo.
  function reposoX(){ return (minX + maxX) / 2; }
  function reposoY(){ return (minY + maxY) / 2; }

  function medir(){
    const r = stage.getBoundingClientRect();
    /* Un escenario a 0x0 no es una medida: es que la galería todavía está en
       `display:none` —con el hero delante, o cruzando el umbral de móvil—.
       Medir contra él dejaba el lienzo en una posición inventada, y con los
       límites centrados esa posición es media pantalla fuera. Se ignora y ya
       volverá a medirse: `Galeria.activar()` mide al revelar la galería y
       `Galeria.remedir()` al volver de móvil (ver js/galeria.js). */
    if (r.width === 0 || r.height === 0) return;
    stageW = r.width; stageH = r.height; canvasW = canvas.offsetWidth; canvasH = canvas.offsetHeight;
    var sobraX = stageW - canvasW, sobraY = stageH - canvasH;
    if (sobraX < 0) { minX = sobraX; maxX = 0; } else { minX = maxX = sobraX / 2; }
    if (sobraY < 0) { minY = sobraY; maxY = 0; } else { minY = maxY = sobraY / 2; }
    // posición de reposo: lienzo centrado en el escenario
    targetX = reposoX(); targetY = reposoY();
    curX = targetX; curY = targetY;
    canvas.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    medirBarra();
  }

  /* `topeBarra` es la posición vertical MÍNIMA del lienzo que deja la franja
     de la barra superior sin una sola foto debajo: por encima de ella el
     lienzo ha bajado lo bastante como para que su foto más alta empiece por
     debajo de la barra. Se mide, no se estima, porque depende del aire que
     `Composicion.MARGEN` deja arriba del lienzo, del alto de la barra y del
     tamaño de la ventana, y las tres cosas cambian.

     Se toma el borde inferior de la barra Y el de sus enlaces: «Contacto» y
     las categorías llevan relleno con margen negativo (ver css/luque.css),
     así que su zona de clic sobresale de la caja de la barra. Es esa zona
     —la que el ratón pisa— la que tiene que quedar despejada.

     De las fotos se ignoran las apagadas: en la vista filtrada siguen en el
     lienzo, pero con `opacity:0`. Estorbarían la medida sin verse. */
  function medirBarra() {
    topeBarra = minY;
    if (!barra) return;

    var borde = barra.getBoundingClientRect().bottom;
    var enlaces = barra.querySelectorAll('a');
    for (var i = 0; i < enlaces.length; i++) {
      borde = Math.max(borde, enlaces[i].getBoundingClientRect().bottom);
    }

    var lienzo = canvas.getBoundingClientRect();
    var arriba = Infinity;
    for (var j = 0; j < canvas.children.length; j++) {
      var foto = canvas.children[j];
      if (foto.classList.contains('apagado')) continue;
      arriba = Math.min(arriba, foto.getBoundingClientRect().top - lienzo.top);
    }
    if (arriba === Infinity) return;

    topeBarra = clamp(borde - arriba, minY, maxY);
  }

  /* Baja el lienzo lo justo para que no quede nada debajo de la barra, y sólo
     si hace falta: viniendo de la galería el paneo ya suele estar arriba del
     todo —el ratón cerca del borde superior satura el eje Y— y entonces esto
     no mueve nada. Lo que sí arregla es llegar a la barra sin pasar por la
     galería, que es como se llega volviendo de las pestañas del navegador. */
  function despejarBarra() {
    if (congelado) return;
    if (targetY < topeBarra) targetY = topeBarra;
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
    targetX = clamp(targetX + (s.left + stageW / 2) - (r.left + r.width  / 2), minX, maxX);
    targetY = clamp(targetY + (s.top  + stageH / 2) - (r.top  + r.height / 2), minY, maxY);
    // Con movimiento reducido no hay paneo animado: se salta al objetivo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      curX = targetX; curY = targetY;
      canvas.style.transform = 'translate3d(' + curX + 'px, ' + curY + 'px, 0)';
    }
  }

  function congelar()      { congelado = true; }
  function descongelar()   { congelado = false; }
  function estaCongelado() { return congelado; }

  /* `barraSuperior` es opcional: sin ella el paneo funciona igual que
     siempre, sólo que nada protege la franja de arriba. */
  function init(escenario, lienzo, barraSuperior) {
    stage  = escenario;
    canvas = lienzo;
    barra  = barraSuperior || null;

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

        const restX = reposoX(), restY = reposoY();
        const rangeX = (maxX - minX) / 2;
        const rangeY = (maxY - minY) / 2;

        // El lienzo se mueve en dirección OPUESTA al cursor. Si en un eje no
        // hay recorrido, su rango es 0 y el `clamp` lo deja donde reposa.
        targetX = clamp(restX - cxN * rangeX * STRENGTH, minX, maxX);
        targetY = clamp(restY - cyN * rangeY * STRENGTH, minY, maxY);
      });

      /* Salir del escenario devuelve el lienzo al reposo... salvo si se sale
         por arriba, hacia la barra. Subir a pulsar «Contacto» disparaba este
         `mouseleave` —la barra no es hija del escenario— y el lienzo se iba
         al centro justo mientras el ratón llegaba al enlace: la galería se
         movía sola y acababa con una foto debajo del botón, que es la
         posición de reposo de siempre. Yendo a la barra no se ha salido de
         la galería, así que el paneo se queda donde estaba. */
      stage.addEventListener('mouseleave', (e) => {
        if (barra && e.relatedTarget && barra.contains(e.relatedTarget)) {
          despejarBarra();
          return;
        }
        targetX = reposoX(); targetY = reposoY();
      });

      if (barra) barra.addEventListener('mouseenter', despejarBarra);
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
        targetX = clamp(startTX + dx, minX, maxX);
        targetY = clamp(startTY + dy, minY, maxY);
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
