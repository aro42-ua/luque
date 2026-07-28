window.Visor = (function () {
  var estado = null;
  var proyecto = null;
  var elementoQueAbrio = null;

  var raiz, escena, chrome, tira, elTitulo, elCat, elContador, elCerrar;
  var temporizador = null;
  var sobreLaTira = false;
  var OCULTAR_TRAS = 2000;

  var CLAVES = ['tl', 'tr', 'bl', 'br'];

  function init() {
    estado = window.VisorEstado.inicial();

    raiz       = document.getElementById('visor');
    escena     = document.getElementById('visorEscena');
    chrome     = document.getElementById('visorChrome');
    tira       = document.getElementById('visorTira');
    elTitulo   = document.getElementById('visorTitulo');
    elCat      = document.getElementById('visorCat');
    elContador = document.getElementById('visorContador');
    elCerrar   = document.getElementById('visorCerrar');

    elCerrar.addEventListener('click', cerrar);
    document.addEventListener('keydown', alPulsarTecla);
    raiz.addEventListener('mousemove', despertarChrome);
    raiz.addEventListener('wheel', alRodar, { passive: true });
    tira.addEventListener('mouseenter', function () {
      sobreLaTira = true;
      chrome.classList.remove('oculto');
      pararTemporizador();
    });
    tira.addEventListener('mouseleave', function () {
      sobreLaTira = false;
      despertarChrome();
    });

    document.addEventListener('click', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (boton) window.Router.ir('proyecto', boton.dataset.id);
    });

    window.Router.alCambiar(function (ruta) {
      if (ruta.tipo === 'proyecto') abrir(ruta.valor);
      else if (estado.abierto) cerrarSinTocarLaRuta();
    });
  }

  function piezas() {
    return proyecto && proyecto.piezas ? proyecto.piezas : [];
  }

  function movimientoReducido() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function abrir(id) {
    var p = window.Datos.porId(id);
    if (!p || !p.piezas) return;

    proyecto = p;
    elementoQueAbrio = window.Galeria.elementoDe(id);
    estado = window.VisorEstado.abrir(estado, id, p.piezas.length);

    var imgOrigen = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
    var origen = (imgOrigen && !movimientoReducido()) ? imgOrigen.getBoundingClientRect() : null;

    window.Galeria.congelar();
    window.Cursor.ocultar();

    construirTira();
    raiz.hidden = false;
    raiz.classList.add('entrando');
    document.body.classList.add('visor-abierto');
    renderizar();

    if (!origen) {
      // Sin viaje (sin elemento de origen, o movimiento reducido): la
      // clase 'entrando' se añade y se quita en el mismo tick, así que
      // sin un reflujo forzado entre medias el navegador las agrupa en
      // un solo recálculo y el fundido de opacidad nunca llega a verse.
      raiz.offsetHeight;                // fuerza el reflujo antes del fundido
      raiz.classList.remove('entrando');
      window.Cursor.mostrar();
      elCerrar.focus();
      despertarChrome();
      return;
    }

    volar(origen);
  }

  function volar(origen) {
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

      prepararEsquinas(origen);

      raiz.offsetHeight;                 // fuerza el reflujo antes de animar
      raiz.classList.remove('entrando');
      raiz.classList.add('viajando');

      img.style.transition = '';
      img.style.transform = 'none';
      img.style.filter = 'none';
      soltarEsquinas();

      setTimeout(function () {
        raiz.classList.remove('viajando');
        window.Cursor.mostrar();
        elCerrar.focus();
        despertarChrome();
      }, 640);
    }

    if (img.complete) requestAnimationFrame(arrancar);
    else img.addEventListener('load', function () { requestAnimationFrame(arrancar); }, { once: true });
  }

  function prepararEsquinas(origen) {
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

  function soltarEsquinas() {
    CLAVES.forEach(function (clave) {
      var el = raiz.querySelector('.visor-esquina.' + clave);
      el.style.transition = '';
      el.style.transform = 'none';
      el.style.color = '';
    });
  }

  function cerrar() { window.Router.ir('todos'); }

  function cerrarSinTocarLaRuta() {
    var imgDestino = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
    var destino = (imgDestino && !movimientoReducido()) ? imgDestino.getBoundingClientRect() : null;

    pararTemporizador();
    chrome.classList.add('oculto');
    window.Cursor.ocultar();

    function rematar() {
      estado = window.VisorEstado.inicial();
      raiz.hidden = true;
      raiz.classList.remove('viajando', 'entrando');
      raiz.style.opacity = '';
      var img = escena.querySelector('img');
      if (img) { img.style.transform = ''; img.style.filter = ''; img.style.transition = ''; }
      CLAVES.forEach(function (c) {
        var el = raiz.querySelector('.visor-esquina.' + c);
        el.style.transition = ''; el.style.transform = ''; el.style.color = '';
      });
      document.body.classList.remove('visor-abierto');
      sobreLaTira = false;
      window.Galeria.descongelar();
      window.Cursor.mostrar();
      if (elementoQueAbrio) elementoQueAbrio.focus();
      elementoQueAbrio = null;
      proyecto = null;
    }

    if (!destino) { rematar(); return; }

    var img = escena.querySelector('img');
    var actual = img.getBoundingClientRect();
    raiz.classList.add('viajando');
    img.style.transform = 'translate(' + (destino.left - actual.left) + 'px,' +
                                         (destino.top - actual.top) + 'px) scale(' +
                          (destino.width / actual.width) + ',' +
                          (destino.height / actual.height) + ')';
    img.style.filter = 'grayscale(35%) contrast(1.05)';
    prepararEsquinasHacia(destino);
    raiz.style.opacity = '0';

    setTimeout(rematar, 640);
  }

  function prepararEsquinasHacia(destino) {
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

  function construirTira() {
    tira.innerHTML = '';
    piezas().forEach(function (ruta, i) {
      var b = document.createElement('button');
      b.className = 'visor-miniatura';
      b.type = 'button';
      b.setAttribute('aria-label', 'Pieza ' + (i + 1) + ' de ' + piezas().length);
      var img = document.createElement('img');
      img.src = ruta;
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
      b.addEventListener('click', function () {
        estado = window.VisorEstado.irA(estado, i);
        renderizar();
      });
      tira.appendChild(b);
    });
  }

  function renderizar() {
    if (!estado.abierto) return;

    elTitulo.textContent = proyecto.titulo;
    elCat.textContent = proyecto.categoria.replace('-', ' ');
    elContador.textContent = pad(estado.indice + 1) + ' / ' + pad(estado.total);

    escena.innerHTML = '';
    var img = document.createElement('img');
    img.src = piezas()[estado.indice];
    img.alt = proyecto.titulo + ', pieza ' + (estado.indice + 1) + ' de ' + estado.total;
    escena.appendChild(img);

    Array.prototype.forEach.call(tira.children, function (b, i) {
      b.setAttribute('aria-current', i === estado.indice ? 'true' : 'false');
    });
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function alPulsarTecla(e) {
    if (!estado.abierto) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      var tras = window.VisorEstado.escapar(estado);
      if (!tras.abierto) cerrar();
      else { estado = tras; renderizar(); }
      return;
    }

    if (e.key === 'ArrowRight') { e.preventDefault(); estado = window.VisorEstado.siguiente(estado); renderizar(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); estado = window.VisorEstado.anterior(estado);  renderizar(); }
    if (e.key === 'Tab') atraparFoco(e);

    despertarChrome();
  }

  function alRodar(e) {
    if (!estado.abierto || estado.lupa) return;
    estado = (e.deltaY > 0) ? window.VisorEstado.siguiente(estado)
                            : window.VisorEstado.anterior(estado);
    renderizar();
    despertarChrome();
  }

  function atraparFoco(e) {
    var focos = raiz.querySelectorAll('button:not([disabled])');
    if (!focos.length) return;
    var primero = focos[0];
    var ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  function despertarChrome() {
    chrome.classList.remove('oculto');
    pararTemporizador();
    if (sobreLaTira) return;   // la tira no se desvanece bajo el cursor
    temporizador = setTimeout(function () { chrome.classList.add('oculto'); }, OCULTAR_TRAS);
  }

  function pararTemporizador() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  }

  function estaAbierto() { return estado && estado.abierto; }

  return { init: init, abrir: abrir, cerrar: cerrar, estaAbierto: estaAbierto };
})();
