window.Galeria = (function () {
  var stage = null;
  var canvas = null;

  var porElemento = {};
  var anchoBase = {};

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

    var ranuras = window.Composicion.disponer(window.Datos.PROYECTOS.length, 'amplio');
    var tam = window.Composicion.tamano(window.Datos.PROYECTOS.length, 'amplio');
    canvas.style.width  = tam.ancho + 'vw';
    canvas.style.height = tam.alto  + 'vw';

    window.Datos.PROYECTOS.forEach(function (p, i) {
      var r = ranuras[i];
      /* El ancho se fija una vez y no se vuelve a tocar: filtrar cambia el
         tamaño con transform:scale, porque animar width está prohibido. */
      anchoBase[p.id] = r.w;
      var boton = document.createElement('button');
      boton.className = 'proj';
      boton.type = 'button';
      boton.dataset.id = p.id;
      boton.dataset.cat = p.categoria;
      boton.style.width = r.w + 'vw';
      boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

      var interior = document.createElement('div');
      interior.className = 'proj-inner';

      var img = document.createElement('img');
      img.src = p.portadaUrl;
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
      colocar(boton, r.x, r.y, 1);
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
    /* Cada proyecto se lleva al lienzo filtrado la MISMA caja del ciclo que
       tenía sin filtrar. Sin esto, el hueco n.º 0 del filtrado le daba la caja
       n.º 0 a un proyecto que quizá era el n.º 3, y la foto cambiaba de tamaño
       sólo por haber pulsado una categoría. Con la variante propia —y con la
       celda ya igualada en `composicion.js`— el `r.w / anchoBase[p.id]` de
       abajo da 1 clavado: filtrar recoloca, no redimensiona. */
    var variantes = dentro.map(function (p) {
      return window.Datos.PROYECTOS.indexOf(p);
    });
    var ranuras = window.Composicion.disponer(dentro.length, 'compacto', variantes);
    var tam = window.Composicion.tamano(dentro.length, 'compacto');

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
          colocar(el, r.x, r.y, r.w / anchoBase[p.id]);
        }
      });

      canvas.style.width  = tam.ancho + 'vw';
      canvas.style.height = tam.alto  + 'vw';
    });

    marcarNavbar(nueva);
  }

  function quitarFiltro() {
    categoria = null; window.GaleriaPaneo.congelar();

    var ranuras = window.Composicion.disponer(window.Datos.PROYECTOS.length, 'amplio');
    var tam = window.Composicion.tamano(window.Datos.PROYECTOS.length, 'amplio');

    conRecomposicion(function (canvas) {
      window.Datos.PROYECTOS.forEach(function (p, i) {
        var el = elementoDe(p.id);
        el.classList.remove('apagado');
        el.removeAttribute('tabindex');
        el.removeAttribute('aria-hidden');
        colocar(el, ranuras[i].x, ranuras[i].y, 1);
      });
      canvas.style.width  = tam.ancho + 'vw';
      canvas.style.height = tam.alto  + 'vw';
    });

    marcarNavbar(null);
  }

  /* Si el contenido no llega, la galería queda vacía. Callar sería peor: quien
     entre tiene que saber que el fallo es nuestro y no de su conexión, y el
     estudio tiene que poder verlo sin abrir la consola. */
  function mostrarError(mensaje) {
    var escenario = document.getElementById('spatialStage');
    if (!escenario) return;
    var aviso = document.createElement('p');
    aviso.className = 'galeria-vacia';
    aviso.setAttribute('role', 'status');
    aviso.textContent = mensaje;
    escenario.appendChild(aviso);
  }

  /* Una categoría sin proyectos no se puede pulsar. Se marcaba como cualquier
     otra y al pulsarla la galería se quedaba en blanco, que es exactamente lo
     que le pasaba a quien entraba: hoy `contenido.json` sólo trae editorial y
     videoclip, así que dos de las cuatro celdas del menú no llevaban a ningún
     sitio. No se esconden —la barra sigue diciendo qué hace el estudio—:
     se atenúan y dejan de responder.

     Se calcula del contenido y no de una lista escrita a mano, así que el día
     que entre un cortometraje la celda se enciende sola. */
  function marcarVacias() {
    document.querySelectorAll('.navbar a[data-cat]').forEach(function (a) {
      var vacia = window.Datos.porCategoria(a.dataset.cat).length === 0;
      a.classList.toggle('vacia', vacia);
      if (vacia) a.setAttribute('aria-disabled', 'true');
      else a.removeAttribute('aria-disabled');
    });
  }

  function marcarNavbar(activa) {
    document.querySelectorAll('.navbar a[data-cat]').forEach(function (a) {
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

  /* Volver a medir al cruzar el umbral de ancho, DESPUÉS de que `es-movil` se
     haya quitado. `medir()` YA corre en cada `resize` de la ventana (el
     `addEventListener('resize', medir)` del cuerpo de `GaleriaPaneo.init`,
     `js/galeria-paneo.js`, sobre la línea 52) — no es la falta de llamadas
     el problema.
     Medido con Chrome real instrumentando los dos eventos: el `resize`
     nativo se dispara ANTES que el `change` de `matchMedia` que quita
     `es-movil`. Al volver de móvil a escritorio, ese `resize` llega con
     `es-movil` todavía puesto, `.gallery` todavía en `display:none` y
     `#spatialStage` a 0×0, así que ese `medir()` mide contra un escenario que
     no existe y deja el lienzo en una posición de reposo que no es la que le
     toca — comprobado neutralizando esta función: sin ella el paneo se queda
     clavado ahí. `remedir()` mide otra vez
     DESPUÉS de que `Movil.init` ya haya quitado `es-movil`, deshaciendo esa
     medida equivocada.

     Sobre el `requestAnimationFrame`, y con la medición delante: NO se ha
     encontrado ningún caso en que haga falta. Sustituirlo por una llamada
     síncrona a `medir()` deja el mismo `transform` correcto en el recorrido
     real (medido: `getBoundingClientRect` fuerza su propio recálculo de
     layout, así que aquí no hay nada que esperar). Se conserva sólo por
     cautela, para el caso en que alguien meta dentro algo que sí dependa de
     que el navegador haya pintado — no porque hoy sea necesario.

     Lo que sí está fijado es que esta línea PROGRAMA el fotograma en vez de
     medir en el acto: lo cubre la tercera prueba de
     `tests/pruebas-galeria.js`, que muere si se cambia por la llamada
     síncrona («esperaba 1 y recibió 0», verificado mutando). Antes de esa
     prueba esta rama no la cubría nadie: las otras dos se paran en la guarda
     de abajo y esperan cero fotogramas, y un espía que cuenta cero sigue
     contando cero aunque la línea espiada desaparezca. */
  function remedir() {
    if (!stage || !canvas) return;
    requestAnimationFrame(function () { window.GaleriaPaneo.medir(); });
  }

  function init() {
    construir();

    stage  = document.getElementById('spatialStage');
    canvas = document.getElementById('spatialCanvas');
    if (!stage || !canvas) return;

    window.GaleriaPaneo.init(stage, canvas);
    marcarVacias();

    // El foco llega por clic, restauración o el tabulador (GaleriaTeclado);
    // en todos los casos basta centrar el lienzo, sin tocar el scroll.
    stage.addEventListener('focusin', function (e) {
      var boton = e.target.closest ? e.target.closest('.proj') : null;
      if (!boton) return;
      window.GaleriaPaneo.centrarEn(boton);
    });
    window.GaleriaTeclado.init(stage, window.GaleriaPaneo.centrarEn);

    // Navegación desde el menú: recompone el lienzo con la categoría pulsada
    document.querySelectorAll('.navbar a[data-cat]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (a.classList.contains('vacia')) return;
        var cat = a.dataset.cat;
        if (categoria === cat) window.Router.ir('todos');
        else window.Router.ir('categoria', cat);
      });
    });

    window.Router.alCambiar(function (ruta) {
      // 'proyecto' se ignora: abrir un proyecto no dice nada del filtro.
      if (ruta.tipo === 'categoria') {
        /* El clic ya no llega aquí con una categoría vacía, pero un enlace
           escrito a mano —o guardado en favoritos antes de que se vaciara—
           sí. Se manda a «todos» en vez de pintar el vacío. */
        if (!window.Datos.porCategoria(ruta.valor).length) {
          window.Router.ir('todos');
          return;
        }
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
    marcarVacias: marcarVacias,
    categoriaActiva: categoriaActiva,
    congelar: congelar,
    descongelar: descongelar,
    centrarEn: centrarEn,
    activar: activar,
    remedir: remedir,
    mostrarError: mostrarError
  };
})();
