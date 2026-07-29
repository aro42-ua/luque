window.Visor = (function () {
  var estado = null;
  var proyecto = null;
  var elementoQueAbrio = null;

  var raiz, escena, chrome, tira, elTitulo, elCat, elContador, elCerrar;
  var temporizador = null;
  var sobreLaTira = false;
  var abiertoConRaton = false;
  var OCULTAR_TRAS = 2000;

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

    window.VisorFicha.init(alternarFicha);
    elCerrar.addEventListener('click', cerrar);
    document.addEventListener('keydown', alPulsarTecla);
    raiz.addEventListener('mousemove', despertarChrome);
    raiz.addEventListener('wheel', alRodar, { passive: true });
    tira.addEventListener('mouseenter', function () {
      sobreLaTira = true; chrome.classList.remove('oculto'); pararTemporizador();
    });
    tira.addEventListener('mouseleave', function () { sobreLaTira = false; despertarChrome(); });

    escena.addEventListener('click', function () {
      if (!estado.abierto) return;
      // El navegador dispara click al soltar un arrastre, así que sin esta
      // guarda cada paneo de la lupa la cerraría al terminar.
      if (estado.lupa && window.VisorLupa.huboArrastre()) return;
      alternarLupa();
    });

    document.addEventListener('click', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (!boton) return;
      // detail === 0 en el click sintético de Enter/Espacio; >0 con el ratón
      abiertoConRaton = e.detail > 0;
      window.Router.ir('proyecto', boton.dataset.id);
    });

    window.Router.alCambiar(function (ruta) {
      if (ruta.tipo === 'proyecto') abrir(ruta.valor);
      else if (estado.abierto) cerrarSinTocarLaRuta();
    });
  }

  function piezas() { return proyecto && proyecto.piezas ? proyecto.piezas : []; }

  function movimientoReducido() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

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
    window.Cursor.restablecer();

    construirTira();
    window.VisorFicha.pintar(proyecto, estado.total);
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
      elCerrar.focus({ preventScroll: true });
      despertarChrome();
      return;
    }

    window.VisorTransicion.volar({
      raiz: raiz, escena: escena, chrome: chrome, elCerrar: elCerrar,
      alTerminar: despertarChrome
    }, origen);
  }

  function alternarLupa() {
    var img = escena.querySelector('img');
    if (!estado.lupa && !window.VisorLupa.puedeAmpliar(img)) return;

    estado = window.VisorEstado.alternarLupa(estado);

    if (estado.lupa) {
      raiz.classList.add('lupa');
      if (!window.VisorLupa.entrar(escena)) {
        estado = window.VisorEstado.alternarLupa(estado);
        raiz.classList.remove('lupa');
      }
    } else {
      window.VisorLupa.salir(escena);
      raiz.classList.remove('lupa');
    }
    despertarChrome();
  }

  function alternarFicha() {
    estado = window.VisorEstado.alternarFicha(estado);
    window.VisorFicha.aplicar(raiz, estado.ficha); despertarChrome();
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
      window.VisorTransicion.CLAVES.forEach(function (c) {
        var el = raiz.querySelector('.visor-esquina.' + c);
        el.style.transition = ''; el.style.transform = ''; el.style.color = '';
      });
      document.body.classList.remove('visor-abierto');
      window.VisorFicha.aplicar(raiz, false);
      sobreLaTira = false;
      window.Galeria.descongelar();
      window.Cursor.mostrar();
      window.Cursor.restablecer();
      // preventScroll: sin esto el navegador arrastra la página para traer el
      // botón a la vista, y como el lienzo es enorme y scroll-behavior es smooth,
      // la página se va al hero durante un segundo.
      var origen = elementoQueAbrio;
      if (origen) {
        // El anillo de foco se suprime solo si se abrió con el ratón, y solo
        // para esta restauración: se quita al perder el foco o al tocar el
        // teclado, así que nunca puede ocultárselo a quien navega con teclado.
        if (abiertoConRaton) {
          origen.classList.add('sin-anillo');
          var limpiar = function () { origen.classList.remove('sin-anillo'); };
          origen.addEventListener('blur', limpiar, { once: true });
          document.addEventListener('keydown', limpiar, { once: true });
        }
        origen.focus({ preventScroll: true });
      }
      elementoQueAbrio = null;
      proyecto = null;
    }

    if (!destino) { rematar(); return; }

    var img = escena.querySelector('img');
    var actual = img.getBoundingClientRect();
    raiz.classList.add('viajando');
    raiz.offsetHeight;                 // fuerza el reflujo antes de animar la vuelta
    img.style.transform = 'translate(' + (destino.left - actual.left) + 'px,' +
                                         (destino.top - actual.top) + 'px) scale(' +
                          (destino.width / actual.width) + ',' +
                          (destino.height / actual.height) + ')';
    img.style.filter = 'grayscale(35%) contrast(1.05)';
    window.VisorTransicion.prepararEsquinasHacia(raiz, destino);
    raiz.style.opacity = '0';

    setTimeout(rematar, 640);
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
        // irA no toca la lupa: si seguía puesta, se suelta aquí para que
        // cambiar de pieza sea también una forma de salir de la lupa.
        if (estado.lupa) estado = window.VisorEstado.alternarLupa(estado);
        renderizar();
      });
      tira.appendChild(b);
    });
  }

  function renderizar() {
    if (!estado.abierto) return;

    if (raiz.classList.contains('lupa') && !estado.lupa) {
      window.VisorLupa.salir(escena);
      raiz.classList.remove('lupa');
    }

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
      if (estado.lupa && !tras.lupa) { window.VisorLupa.salir(escena); raiz.classList.remove('lupa'); }
      if (estado.ficha && !tras.ficha) window.VisorFicha.aplicar(raiz, false);
      if (!tras.abierto) cerrar();
      else { estado = tras; renderizar(); despertarChrome(); }
      return;
    }

    if (window.VisorFicha.esTeclaAlternar(e)) { e.preventDefault(); alternarFicha(); return; }

    if (estado.lupa && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
                        e.key === 'ArrowUp'    || e.key === 'ArrowDown')) {
      e.preventDefault();
      var dx = (e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0);
      var dy = (e.key === 'ArrowUp'   ? 1 : e.key === 'ArrowDown'  ? -1 : 0);
      window.VisorLupa.desplazar(dx, dy);
      despertarChrome();
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
    if (sobreLaTira || estado.ficha) return;   // la tira bajo el cursor y la ficha abierta no se desvanecen
    temporizador = setTimeout(function () { chrome.classList.add('oculto'); }, OCULTAR_TRAS);
  }

  function pararTemporizador() { if (temporizador) { clearTimeout(temporizador); temporizador = null; } }

  function estaAbierto() { return estado && estado.abierto; }

  return { init: init, abrir: abrir, cerrar: cerrar, estaAbierto: estaAbierto };
})();
