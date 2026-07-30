window.Visor = (function () {
  var estado = null;
  var proyecto = null;
  var elementoQueAbrio = null;

  var raiz, escena, chrome, tira, elTitulo, elCat, elContador, elCerrar;
  var abiertoConRaton = false, pendienteConRaton = false;

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

    window.VisorFicha.init(alternarFicha); window.VisorVideo.init(window.VisorChrome.despertar); window.VisorCarga.init(raiz);
    window.VisorChrome.init(chrome, tira, function () { return estado.ficha; });
    elCerrar.addEventListener('click', cerrar);
    document.addEventListener('keydown', alPulsarTecla);
    raiz.addEventListener('mousemove', window.VisorChrome.despertar);
    raiz.addEventListener('wheel', alRodar, { passive: true });

    escena.addEventListener('click', function () {
      if (!estado.abierto) return;
      // El navegador dispara click al soltar un arrastre, así que sin esta
      // guarda cada paneo de la lupa la cerraría al terminar.
      if (estado.lupa && window.VisorLupa.huboArrastre()) return;
      if (window.VisorVideo.activo()) window.VisorVideo.alternarReproduccion(); else alternarLupa();
    });

    document.addEventListener('click', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (!boton) return;
      // detail===0 en el click sintético de Enter/Espacio; >0 con el ratón. abrir() lo consume.
      pendienteConRaton = e.detail > 0;
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
    var p = window.Datos.porId(id); if (!p) return;

    abiertoConRaton = pendienteConRaton; pendienteConRaton = false; // se consume: solo para esta apertura
    proyecto = p; elementoQueAbrio = window.Galeria.elementoDe(id);
    estado = window.VisorEstado.abrir(estado, id, p.video ? 1 : p.piezas.length); raiz.classList.toggle('video', !!p.video);

    var enVuelo = raiz.classList.contains('viajando'); // vuelo en marcha: se monta directo, sin solapar un segundo
    var imgOrigen = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
    var origen = (imgOrigen && !movimientoReducido() && !enVuelo) ? imgOrigen.getBoundingClientRect() : null;

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
      window.Cursor.mostrar(); elCerrar.focus({ preventScroll: true });
      window.VisorChrome.despertar();
      return;
    }

    window.VisorTransicion.volar({
      raiz: raiz, escena: escena, chrome: chrome, elCerrar: elCerrar,
      alTerminar: window.VisorChrome.despertar
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
    window.VisorChrome.despertar();
  }

  function alternarFicha() {
    estado = window.VisorEstado.alternarFicha(estado);
    window.VisorFicha.aplicar(raiz, estado.ficha); window.VisorChrome.despertar();
  }

  // cerrar: vuelve a la categoría activa de la galería si la había, no siempre a 'todos'.
  function cerrar() {
    var cat = window.Galeria.categoriaActiva();
    if (cat) window.Router.ir('categoria', cat);
    else window.Router.ir('todos');
  }

  function cerrarSinTocarLaRuta() {
    var imgDestino = elementoQueAbrio ? elementoQueAbrio.querySelector('img') : null;
    var destino = (imgDestino && !movimientoReducido()) ? imgDestino.getBoundingClientRect() : null;

    window.VisorChrome.pararTemporizador();
    chrome.classList.add('oculto');
    window.Cursor.ocultar();

    function rematar() {
      window.VisorVideo.detener(); raiz.classList.remove('video');
      estado = window.VisorEstado.inicial();
      raiz.hidden = true;
      raiz.classList.remove('viajando', 'entrando');
      raiz.style.opacity = '';
      var elLienzo = escena.querySelector('img, video');
      if (elLienzo) { elLienzo.style.transform = ''; elLienzo.style.filter = ''; elLienzo.style.transition = ''; }
      window.VisorTransicion.CLAVES.forEach(function (c) {
        var el = raiz.querySelector('.visor-esquina.' + c);
        el.style.transition = ''; el.style.transform = ''; el.style.color = '';
      });
      document.body.classList.remove('visor-abierto');
      window.VisorFicha.aplicar(raiz, false);
      window.VisorChrome.olvidarTira();
      window.Galeria.descongelar();
      window.Cursor.mostrar();
      window.Cursor.restablecer();
      // preventScroll: aunque la página ya no se desplaza, el navegador
      // intentaría igualmente traer el botón a la vista al enfocarlo.
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

    var elLienzo = escena.querySelector('img, video');
    var actual = elLienzo.getBoundingClientRect();
    raiz.classList.add('viajando');
    raiz.offsetHeight;                 // fuerza el reflujo antes de animar la vuelta
    elLienzo.style.transform = 'translate(' + (destino.left - actual.left) + 'px,' +
                                         (destino.top - actual.top) + 'px) scale(' +
                          (destino.width / actual.width) + ',' +
                          (destino.height / actual.height) + ')';
    elLienzo.style.filter = 'grayscale(35%) contrast(1.05)';
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

    if (raiz.classList.contains('lupa') && !estado.lupa) { window.VisorLupa.salir(escena); raiz.classList.remove('lupa'); }
    // La ficha se recoge igual que la lupa: un salto directo por hash no pasa por rematar()
    if (raiz.classList.contains('ficha-abierta') && !estado.ficha) window.VisorFicha.aplicar(raiz, false);

    elTitulo.textContent = proyecto.titulo;
    elCat.textContent = proyecto.categoria.replace('-', ' ');

    escena.innerHTML = '';
    window.VisorCarga.limpiar();
    if (!window.VisorVideo.pintar(escena, proyecto)) {
      window.VisorCarga.pintar(escena, proyecto, estado, piezas());
    }
    elContador.textContent = proyecto.video ? '' : pad(estado.indice + 1) + ' / ' + pad(estado.total);

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
      else { estado = tras; renderizar(); window.VisorChrome.despertar(); }
      return;
    }

    if (window.VisorFicha.esTeclaAlternar(e, 'i')) { e.preventDefault(); alternarFicha(); return; }

    // l de "lupa": mismo hueco y guarda que i, único camino de teclado hasta ahora.
    if (window.VisorFicha.esTeclaAlternar(e, 'l') && !window.VisorVideo.activo()) { e.preventDefault(); alternarLupa(); return; }

    if (estado.lupa && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
                        e.key === 'ArrowUp'    || e.key === 'ArrowDown')) {
      e.preventDefault();
      var dx = (e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0);
      var dy = (e.key === 'ArrowUp'   ? 1 : e.key === 'ArrowDown'  ? -1 : 0);
      window.VisorLupa.desplazar(dx, dy);
      window.VisorChrome.despertar();
      return;
    }

    if (window.VisorVideo.alPulsarTecla(e)) return;

    if (e.key === 'ArrowRight' && !window.VisorVideo.activo()) { e.preventDefault(); estado = window.VisorEstado.siguiente(estado); renderizar(); }
    if (e.key === 'ArrowLeft'  && !window.VisorVideo.activo()) { e.preventDefault(); estado = window.VisorEstado.anterior(estado);  renderizar(); }
    if (e.key === 'Tab') atraparFoco(e);

    window.VisorChrome.despertar();
  }

  function alRodar(e) {
    if (!estado.abierto || estado.lupa || window.VisorVideo.activo()) return;
    estado = (e.deltaY > 0) ? window.VisorEstado.siguiente(estado)
                            : window.VisorEstado.anterior(estado);
    renderizar();
    window.VisorChrome.despertar();
  }

  function atraparFoco(e) {
    var focos = Array.prototype.filter.call(raiz.querySelectorAll('button:not([disabled]), [role="slider"]'),
      function (el) { return el.offsetParent !== null; });   // offsetParent nulo con display:none: fuera la línea en modo foto
    if (!focos.length) return;
    var primero = focos[0], ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  function estaAbierto() { return estado && estado.abierto; }

  return { init: init, abrir: abrir, cerrar: cerrar, estaAbierto: estaAbierto };
})();
