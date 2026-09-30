/* El visor móvil (spec docs/superpowers/specs/2026-09-30-visor-premium-design.md):
   un carrusel de las fotos de UN trabajo, sobre negro, con la ficha como panel
   que sube desde abajo. Va sobre `ArnesDom.conElemento`, dentro del documento,
   con tres cosas falsificadas para que ninguna prueba dependa del reloj ni de
   la ruta de verdad:

   - `animar` termina al instante: escribe el fotograma final y avisa.
   - `temporizar` guarda las esperas (dormir los controles, el toque simple)
     y la prueba las corre cuando quiere con `correr()`.
   - `Router.ir` sólo apunta adónde se quiso ir; la prueba llama a
     `MovilVisor.aplicar` a mano cuando quiere simular que la ruta cambió.

   `Movil.actual` se fija en 'movil' mientras dura cada prueba. */
var MV_PROYECTOS = [
  { id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'fotos',
    portadaUrl: 'x-niebla-p1-1500.jpg',
    piezas: [{ url: 'x-niebla-p1-3000.jpg', miniatura: 'x-niebla-p1-250.jpg' },
             { url: 'x-niebla-p2-3000.jpg', miniatura: 'x-niebla-p2-250.jpg' },
             { url: 'x-niebla-p3-3000.jpg', miniatura: 'x-niebla-p3-250.jpg' }],
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Dirección de fotografía' } },
  { id: 'oleaje', titulo: 'Oleaje', categoria: 'videoclip', tipo: 'fotos',
    portadaUrl: 'x-oleaje-1500.jpg', piezas: [],
    ficha: { cliente: 'Marca Norte', anio: '2025', papel: 'Operadora de cámara' } }
];

var MV_MARCADO =
  '<div style="position:relative;width:390px;height:844px">' +
  '<div id="mvRaiz" hidden>' +
    '<div id="mvFondo"></div>' +
    '<div id="mvPista"></div>' +
    '<div id="mvControles">' +
      '<p id="mvTitulo"></p><button id="mvCerrar" type="button">×</button>' +
      '<div><span id="mvProgreso"></span></div>' +
      '<span id="mvContador"></span><button id="mvVerFicha" type="button">Ficha</button>' +
    '</div>' +
    '<section id="mvFicha" aria-hidden="true"></section>' +
  '</div></div>';

function mvRuta(valor, pieza) { return { tipo: 'proyecto', valor: valor, pieza: pieza }; }
var MV_TODOS = { tipo: 'todos', valor: null, pieza: null };

function conVisor(fn, opciones) {
  return ArnesDom.conElemento(MV_MARCADO, function (caja) {
    var rutas = [];
    var pendientes = [];
    var antes = { actual: window.Movil.actual, ir: window.Router.ir, datos: window.Datos };
    window.Movil.actual = function () { return 'movil'; };
    window.Router.ir = function (tipo, valor, pieza) { rutas.push([tipo, valor, pieza]); };
    window.Datos = {
      porId: function (id) {
        return MV_PROYECTOS.filter(function (p) { return p.id === id; })[0] || null;
      }
    };
    var refs = {
      raiz: caja.querySelector('#mvRaiz'),
      fondo: caja.querySelector('#mvFondo'),
      pista: caja.querySelector('#mvPista'),
      controles: caja.querySelector('#mvControles'),
      titulo: caja.querySelector('#mvTitulo'),
      cerrar: caja.querySelector('#mvCerrar'),
      progreso: caja.querySelector('#mvProgreso'),
      contador: caja.querySelector('#mvContador'),
      verFicha: caja.querySelector('#mvVerFicha'),
      ficha: caja.querySelector('#mvFicha')
    };
    var o = {
      animar: function (el, desde, hasta, ms, curva, alTerminar) {
        Object.keys(hasta).forEach(function (k) { el.style[k] = hasta[k]; });
        if (alTerminar) alTerminar();
        return function () {};
      },
      medir: function () { return { ancho: 390, alto: 844 }; },
      reducido: false,
      origen: function () { return null; },
      temporizar: function (f) { pendientes.push(f); return pendientes.length; },
      cancelar: function (id) { pendientes[id - 1] = null; }
    };
    Object.keys(opciones || {}).forEach(function (k) { o[k] = opciones[k]; });
    MovilVisor.init(refs, MV_PROYECTOS, o);
    try {
      return fn({
        caja: caja, refs: refs, rutas: rutas,
        correr: function () {
          var p = pendientes.slice();
          pendientes.length = 0;
          p.forEach(function (f) { if (f) f(); });
        }
      });
    } finally {
      MovilVisor.aplicar(MV_TODOS);
      window.Movil.actual = antes.actual;
      window.Router.ir = antes.ir;
      window.Datos = antes.datos;
    }
  });
}

function mvDiapos(refs) {
  return Array.prototype.map.call(refs.pista.querySelectorAll('.mvisor-diapo'), function (d) {
    return d.dataset.pieza;
  });
}

function mvTecla(refs, key) {
  refs.raiz.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
}

describe('MovilVisor — abre, pinta y cierra según la ruta', function () {

  prueba('empieza cerrado y una ruta de proyecto lo abre en esa foto', function () {
    conVisor(function (v) {
      igual(v.refs.raiz.hidden, true);
      MovilVisor.aplicar(mvRuta('niebla', 2));
      igual([v.refs.raiz.hidden, MovilVisor.estado()],
            [false, { proyecto: 'niebla', pieza: 2, ficha: false }]);
    });
  });

  prueba('una ruta sin pieza abre en la primera', function () {
    conVisor(function () {
      MovilVisor.aplicar(mvRuta('niebla', null));
      igual(MovilVisor.estado().pieza, 1);
    });
  });

  prueba('pinta la foto con su vecina a cada lado', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      igual(mvDiapos(v.refs), ['1', '2', '3']);
      var t = Array.prototype.map.call(v.refs.pista.querySelectorAll('.mvisor-diapo'),
        function (d) { return d.style.transform.replace(/\s/g, ''); });
      igual(t, ['translate3d(-390px,0px,0px)', 'translate3d(0px,0px,0px)',
                'translate3d(390px,0px,0px)']);
    });
  });

  prueba('en la primera sólo hay siguiente, y en la última sólo anterior', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      var primera = mvDiapos(v.refs);
      MovilVisor.aplicar(mvRuta('niebla', 3));
      igual([primera, mvDiapos(v.refs)], [['1', '2'], ['2', '3']]);
    });
  });

  prueba('la foto arranca con su miniatura, marcada como previa', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var img = v.refs.pista.querySelector('.mvisor-diapo[data-pieza="2"] img');
      igual([img.getAttribute('src'), img.classList.contains('previa'), img.alt],
            ['x-niebla-p2-250.jpg', true, 'Niebla, foto 2 de 3']);
    });
  });

  prueba('título, contador y línea de progreso', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      igual([v.refs.titulo.textContent, v.refs.contador.textContent],
            ['Niebla', '02 / 03']);
      cierto(Math.abs(parseFloat(v.refs.progreso.style.width) - 66.667) < 0.01,
             v.refs.progreso.style.width);
    });
  });

  prueba('al abrir enfoca la ×, y al cerrar devuelve el foco a quien lo tenía', function () {
    conVisor(function (v) {
      var antes = document.createElement('button');
      v.caja.appendChild(antes);
      antes.focus();
      MovilVisor.aplicar(mvRuta('niebla', 1));
      var dentro = document.activeElement;
      MovilVisor.aplicar(MV_TODOS);
      igual([dentro, v.refs.raiz.hidden, document.activeElement],
            [v.refs.cerrar, true, antes]);
    });
  });

  prueba('fuera del lado móvil no hace nada', function () {
    conVisor(function (v) {
      window.Movil.actual = function () { return 'escritorio'; };
      MovilVisor.aplicar(mvRuta('niebla', 1));
      igual(v.refs.raiz.hidden, true);
    });
  });

  prueba('un trabajo que no existe no lo abre', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('no-existe', 1));
      igual(v.refs.raiz.hidden, true);
    });
  });
});

describe('MovilVisor — controles, ficha y teclado', function () {

  prueba('la × vuelve a la portada', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      v.refs.cerrar.click();
      igual(v.rutas, [['todos', null, undefined]]);
    });
  });

  prueba('los controles se duermen solos y vuelven con el foco', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      var despiertos = !v.refs.controles.classList.contains('dormidos');
      v.correr();
      var dormidos = v.refs.controles.classList.contains('dormidos');
      /* `focusin` a mano: el navegador no lo dispara si su ventana no tiene
         el foco del sistema, que es lo normal mientras corre la suite. */
      v.refs.verFicha.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      igual([despiertos, dormidos, v.refs.controles.classList.contains('dormidos')],
            [true, true, false]);
    });
  });

  prueba('el botón Ficha pide la ficha', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      v.refs.verFicha.click();
      igual(v.rutas, [['proyecto', 'niebla', 'ficha']]);
    });
  });

  prueba('la ruta de ficha abre el panel sobre la foto que había', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      igual([v.refs.ficha.classList.contains('abierta'), v.refs.ficha.getAttribute('aria-hidden'),
             v.refs.ficha.querySelector('.mvisor-ficha-titulo').textContent,
             MovilVisor.estado()],
            [true, 'false', 'Niebla', { proyecto: 'niebla', pieza: 2, ficha: true }]);
    });
  });

  prueba('volver de la ficha regresa a la foto que había', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      v.refs.ficha.querySelector('[data-volver]').click();
      igual(v.rutas, [['proyecto', 'niebla', 2]]);
    });
  });

  prueba('un enlace directo a la ficha la abre sobre la primera foto', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      igual([MovilVisor.estado().pieza, mvDiapos(v.refs)], [1, ['1', '2']]);
    });
  });

  prueba('un trabajo sin fotos abre la ficha, y volver cierra el visor', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('oleaje', null));
      var abierta = v.refs.ficha.classList.contains('abierta');
      v.refs.ficha.querySelector('[data-volver]').click();
      igual([abierta, mvDiapos(v.refs), v.rutas], [true, [], [['todos', null, undefined]]]);
    });
  });

  prueba('las flechas pasan de foto y no se salen de la serie', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      mvTecla(v.refs, 'ArrowLeft');
      mvTecla(v.refs, 'ArrowRight');
      igual(v.rutas, [['proyecto', 'niebla', 2]]);
    });
  });

  prueba('flecha arriba abre la ficha', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      mvTecla(v.refs, 'ArrowUp');
      igual(v.rutas, [['proyecto', 'niebla', 'ficha']]);
    });
  });

  prueba('Escape cierra la ficha si está abierta, y si no el visor', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      mvTecla(v.refs, 'Escape');
      MovilVisor.aplicar(mvRuta('niebla', 2));
      mvTecla(v.refs, 'Escape');
      igual(v.rutas, [['proyecto', 'niebla', 2], ['todos', null, undefined]]);
    });
  });

  prueba('Tab queda atrapado en el diálogo (VisorFoco)', function () {
    var llamadas = 0;
    var antes = window.VisorFoco.atrapar;
    window.VisorFoco.atrapar = function () { llamadas++; };
    try {
      conVisor(function (v) {
        MovilVisor.aplicar(mvRuta('niebla', 1));
        mvTecla(v.refs, 'Tab');
      });
    } finally { window.VisorFoco.atrapar = antes; }
    igual(llamadas, 1);
  });
});
