window.Galeria = (function () {
  var stage = null;
  var canvas = null;

  var porElemento = {};

  var categoria = null;
  var temporizadorRecomposicion = null;
  var DURACION_MS = 620;

  var ETIQUETAS = {
    'foto-stills': 'Foto Stills',
    'editorial': 'Editorial',
    'videoclip': 'Videoclip',
    'cortometraje': 'Cortometraje'
  };

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

  function conRecomposicion(fn) {
    var canvas = document.getElementById('spatialCanvas');
    if (temporizadorRecomposicion) clearTimeout(temporizadorRecomposicion);
    canvas.classList.add('recomponiendo');
    canvas.offsetHeight;   // fuerza el reflujo: sin esto la transición no arranca
    fn(canvas);
    temporizadorRecomposicion = setTimeout(function () {
      temporizadorRecomposicion = null;
      canvas.classList.remove('recomponiendo');
      window.GaleriaPaneo.medir();
      window.GaleriaPaneo.descongelar();
    }, DURACION_MS);
  }

  function aplicarFiltro(nueva) {
    categoria = nueva; window.GaleriaPaneo.congelar();

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
    categoria = null; window.GaleriaPaneo.congelar();

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

  function congelar()    { window.GaleriaPaneo.congelar(); }
  function descongelar() { window.GaleriaPaneo.descongelar(); }
  function centrarEn(el) { window.GaleriaPaneo.centrarEn(el); }

  /* Activa la galería como estado visible. Su trabajo real es revelar el
     navbar; el medir() es solo una remedida barata por si el viewport
     cambió mientras el hero estaba delante. No arregla rectángulos a cero:
     visibility:hidden conserva la caja de layout, así que las medidas que
     tomó init() ya eran correctas. */
  function activar() {
    var navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.add('visible');
    window.GaleriaPaneo.medir();
  }

  function init() {
    var problemas = window.Datos.validarDatos(window.Datos.PROYECTOS, window.Datos.CATEGORIAS);
    if (problemas.length) console.warn('Problemas en los datos:\n' + problemas.join('\n'));
    construir();

    stage  = document.getElementById('spatialStage');
    canvas = document.getElementById('spatialCanvas');
    if (!stage || !canvas) return;

    window.GaleriaPaneo.init(stage, canvas);

    // El foco llega por clic, restauración o el tabulador (GaleriaTeclado);
    // en todos los casos basta centrar el lienzo, sin tocar el scroll.
    stage.addEventListener('focusin', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (!boton) return;
      window.GaleriaPaneo.centrarEn(boton);
    });
    window.GaleriaTeclado.init(stage, window.GaleriaPaneo.centrarEn);

    // Navegación desde el menú: recompone el lienzo con la categoría pulsada
    document.querySelectorAll('.navbar .nav-svg a[data-cat]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = a.dataset.cat;
        if (categoria === cat) window.Router.ir('todos');
        else window.Router.ir('categoria', cat);
      });
    });

    window.Router.alCambiar(function (ruta) {
      // 'proyecto' se ignora: abrir un proyecto no dice nada del filtro.
      if (ruta.tipo === 'categoria') {
        if (categoria !== ruta.valor) aplicarFiltro(ruta.valor);
      } else if (ruta.tipo === 'todos' && categoria !== null) {
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
    centrarEn: centrarEn,
    activar: activar
  };
})();
