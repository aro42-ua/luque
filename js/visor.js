window.Visor = (function () {
  var estado = null;
  var proyecto = null;
  var elementoQueAbrio = null;

  var raiz, escena, chrome, tira, elTitulo, elCat, elContador, elCerrar;
  var temporizador = null;
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

    elCerrar.addEventListener('click', cerrar);
    document.addEventListener('keydown', alPulsarTecla);
    raiz.addEventListener('mousemove', despertarChrome);
    raiz.addEventListener('wheel', alRodar, { passive: true });
    tira.addEventListener('mouseenter', pararTemporizador);
    tira.addEventListener('mouseleave', despertarChrome);

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

  function abrir(id) {
    var p = window.Datos.porId(id);
    if (!p || !p.piezas) return;

    proyecto = p;
    elementoQueAbrio = window.Galeria.elementoDe(id);
    estado = window.VisorEstado.abrir(estado, id, p.piezas.length);

    construirTira();
    raiz.hidden = false;
    document.body.classList.add('visor-abierto');
    renderizar();
    elCerrar.focus();
    despertarChrome();
  }

  function cerrar() { window.Router.ir('todos'); }

  function cerrarSinTocarLaRuta() {
    estado = window.VisorEstado.inicial();
    raiz.hidden = true;
    document.body.classList.remove('visor-abierto');
    pararTemporizador();
    if (elementoQueAbrio) elementoQueAbrio.focus();
    elementoQueAbrio = null;
    proyecto = null;
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
    temporizador = setTimeout(function () { chrome.classList.add('oculto'); }, OCULTAR_TRAS);
  }

  function pararTemporizador() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  }

  function estaAbierto() { return estado && estado.abierto; }

  return { init: init, abrir: abrir, cerrar: cerrar, estaAbierto: estaAbierto };
})();
