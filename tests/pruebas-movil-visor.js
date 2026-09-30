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

/* Los gestos (js/movil-visor-gestos.js). El reloj va inyectado —`ahora`—
   porque la velocidad del dedo decide adónde va la foto, y los eventos
   sintéticos de una prueba llegan casi en el mismo milisegundo: con su
   `timeStamp` todo sería un golpe rapidísimo. `paso` es cuánto avanza el
   reloj entre un evento y el siguiente: 1000 ms es un arrastre lento (sólo
   decide la distancia), 10 ms un golpe. */
describe('MovilVisor — los gestos', function () {

  function conGestos(fn, extra) {
    var reloj = { t: 0, paso: 1000 };
    var o = { ahora: function () { reloj.t += reloj.paso; return reloj.t; } };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return conVisor(function (v) { v.reloj = reloj; return fn(v); }, o);
  }

  function dedo(v, tipo, x, y, id) {
    v.refs.raiz.dispatchEvent(new PointerEvent(tipo,
      { clientX: x, clientY: y, pointerId: id || 1, bubbles: true }));
  }
  function arrastrar(v, x0, y0, x1, y1) {
    dedo(v, 'pointerdown', x0, y0);
    dedo(v, 'pointermove', (x0 + x1) / 2, (y0 + y1) / 2);
    dedo(v, 'pointermove', x1, y1);
    dedo(v, 'pointerup', x1, y1);
  }
  function tocar(v, x, y) { dedo(v, 'pointerdown', x, y); dedo(v, 'pointerup', x, y); }
  function pista(v) { return v.refs.pista.style.transform.replace(/\s/g, ''); }
  function foto(v) {
    return v.refs.pista.querySelector('.mvisor-diapo[aria-hidden="false"] img');
  }

  prueba('mientras se arrastra, la pista sigue al dedo', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      dedo(v, 'pointerdown', 300, 400);
      dedo(v, 'pointermove', 250, 400);
      dedo(v, 'pointermove', 200, 402);
      igual(pista(v), 'translate3d(-100px,0px,0px)');
      dedo(v, 'pointerup', 200, 402);
    });
  });

  prueba('arrastrar más de un 30 % a la izquierda pasa a la siguiente', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 150, 400);
      igual(v.rutas, [['proyecto', 'niebla', 3]]);
    });
  });

  prueba('y a la derecha, a la anterior', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 100, 400, 250, 400);
      igual(v.rutas, [['proyecto', 'niebla', 1]]);
    });
  });

  prueba('un arrastre corto y lento vuelve sin cambiar de foto', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 240, 400);
      igual([v.rutas, pista(v)], [[], 'translate3d(0px,0px,0px)']);
    });
  });

  prueba('un golpe corto y rápido pasa igual', function () {
    conGestos(function (v) {
      v.reloj.paso = 10;
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 260, 400);
      igual(v.rutas, [['proyecto', 'niebla', 3]]);
    });
  });

  prueba('en la primera, arrastrar a la derecha se resiste y no pasa', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 1));
      dedo(v, 'pointerdown', 100, 400);
      dedo(v, 'pointermove', 200, 400);
      dedo(v, 'pointermove', 300, 400);
      var tirando = pista(v);
      dedo(v, 'pointerup', 300, 400);
      igual([tirando, v.rutas], ['translate3d(70px,0px,0px)', []]);
    });
  });

  prueba('bajar la foto la encoge y apaga el fondo mientras se arrastra', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      dedo(v, 'pointerdown', 200, 300);
      dedo(v, 'pointermove', 200, 400);
      dedo(v, 'pointermove', 200, 511);
      var diapo = foto(v).parentNode;
      /* 211 px de 844: medio camino hasta el cierre total, escala 0,875. */
      cierto(/scale\(0\.87/.test(diapo.style.transform), diapo.style.transform);
      cierto(Number(v.refs.fondo.style.opacity) < 0.6, 'fondo ' + v.refs.fondo.style.opacity);
      dedo(v, 'pointerup', 200, 511);
    });
  });

  prueba('bajar más de un 15 % del alto cierra el visor', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 200, 300, 200, 500);
      igual(v.rutas, [['todos', null, undefined]]);
    });
  });

  prueba('bajar poco devuelve la foto a su sitio', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 200, 300, 200, 360);
      var diapo = foto(v).parentNode;
      igual([v.rutas, v.refs.fondo.style.opacity], [[], '1']);
      cierto(/scale\(1\)/.test(diapo.style.transform), diapo.style.transform);
    });
  });

  prueba('subir abre la ficha', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 200, 600, 200, 350);
      igual(v.rutas, [['proyecto', 'niebla', 'ficha']]);
    });
  });

  prueba('con la ficha abierta, bajarla vuelve a la foto', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      arrastrar(v, 200, 500, 200, 700);
      igual(v.rutas, [['proyecto', 'niebla', 2]]);
    });
  });

  prueba('un toque alterna los controles, después de esperar al doble toque', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      v.correr();                                   // se duermen
      tocar(v, 200, 400);
      var antes = v.refs.controles.classList.contains('dormidos');
      v.correr();                                   // vence la espera del toque simple
      igual([antes, v.refs.controles.classList.contains('dormidos')], [true, false]);
    });
  });

  prueba('dos toques amplían en el punto y no alternan los controles', function () {
    conGestos(function (v) {
      v.reloj.paso = 50;
      MovilVisor.aplicar(mvRuta('niebla', 2));
      v.correr();
      tocar(v, 100, 200);
      tocar(v, 100, 200);
      v.correr();
      cierto(/scale\(2\.5\)/.test(foto(v).style.transform), foto(v).style.transform);
      igual(v.refs.controles.classList.contains('dormidos'), true);
    });
  });

  prueba('ampliada, un dedo la pasea y no pasa de foto; dos toques más la encajan', function () {
    conGestos(function (v) {
      v.reloj.paso = 50;
      MovilVisor.aplicar(mvRuta('niebla', 2));
      tocar(v, 150, 300);
      tocar(v, 150, 300);
      var ampliada = foto(v).style.transform;
      v.reloj.paso = 1000;
      /* Hacia la derecha y abajo: la caja del arnés vive fuera de pantalla, así
         que el doble toque deja la foto acotada contra el borde izquierdo y
         el de arriba, y sólo en este sentido le queda camino. */
      arrastrar(v, 250, 380, 300, 400);
      var paseada = foto(v).style.transform;
      v.reloj.paso = 50;
      tocar(v, 150, 300);
      tocar(v, 150, 300);
      igual(v.rutas, []);
      cierto(paseada !== ampliada, 'no se paseó: ' + paseada);
      igual(foto(v).style.transform, '');
    });
  });

  prueba('un segundo dedo no mueve el carrusel', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      dedo(v, 'pointerdown', 150, 400, 1);
      dedo(v, 'pointerdown', 250, 400, 2);
      dedo(v, 'pointermove', 100, 400, 1);
      dedo(v, 'pointermove', 300, 400, 2);
      dedo(v, 'pointerup', 300, 400, 2);
      dedo(v, 'pointerup', 100, 400, 1);
      igual([v.rutas, pista(v)], [[], 'translate3d(0px,0px,0px)']);
    });
  });

  prueba('un dedo nuevo corta la animación en curso', function () {
    var cortadas = 0;
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 150, 400);
      dedo(v, 'pointerdown', 200, 400);
      dedo(v, 'pointerup', 200, 400);
      igual([cortadas > 0, v.rutas], [true, []]);
    }, { animar: function () { return function () { cortadas++; }; } });
  });

  prueba('un gesto que empieza en la × no es del carrusel', function () {
    conGestos(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      v.refs.cerrar.dispatchEvent(new PointerEvent('pointerdown',
        { clientX: 370, clientY: 30, pointerId: 1, bubbles: true }));
      v.refs.cerrar.dispatchEvent(new PointerEvent('pointermove',
        { clientX: 200, clientY: 30, pointerId: 1, bubbles: true }));
      igual(pista(v), 'translate3d(0px,0px,0px)');
    });
  });
});

/* Las transiciones de abrir y cerrar: la foto sale del rectángulo de lo que
   se tocó —la foto de la corona o la portada (`MovilGlobo.origenDe`)— y vuelve
   a él al cerrar, mientras el fondo pasa a negro y de vuelta. Se apunta cada
   llamada a `animar` para leer desde dónde y hasta dónde va cada cosa. */
describe('MovilVisor — la foto que crece y vuelve', function () {

  function conOrigen(fn, extra) {
    var llamadas = [];
    var origen = document.createElement('button');
    origen.style.cssText = 'position:absolute;left:40px;top:100px;width:80px;height:100px';
    var o = {
      animar: function (el, desde, hasta, ms, curva, fin) {
        llamadas.push({ el: el, desde: desde, hasta: hasta, ms: ms });
        Object.keys(hasta).forEach(function (k) { el.style[k] = hasta[k]; });
        if (fin) fin();
        return function () {};
      },
      origen: function () { return origen; }
    };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return conVisor(function (v) {
      v.caja.appendChild(origen);
      return fn(v, llamadas);
    }, o);
  }

  function de(llamadas, el) { return llamadas.filter(function (l) { return l.el === el; }); }

  prueba('al abrir, la foto crece desde el origen hasta su sitio', function () {
    conOrigen(function (v, llamadas) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var diapo = v.refs.pista.querySelector('.mvisor-diapo[data-pieza="2"]');
      var l = de(llamadas, diapo)[0];
      cierto(l, 'la diapositiva no se animó');
      cierto(/scale\(0\.\d+\)/.test(l.desde.transform), 'desde: ' + l.desde.transform);
      igual([l.hasta.transform, l.ms], ['translate3d(0px,0px,0px)', 420]);
    });
  });

  prueba('al abrir, el fondo se funde a negro a la vez', function () {
    conOrigen(function (v, llamadas) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var l = de(llamadas, v.refs.fondo)[0];
      igual([l.desde.opacity, l.hasta.opacity, l.ms], ['0', '1', 420]);
    });
  });

  prueba('al cerrar, la foto vuelve al origen, más deprisa, y el visor se esconde', function () {
    conOrigen(function (v, llamadas) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var diapo = v.refs.pista.querySelector('.mvisor-diapo[data-pieza="2"]');
      llamadas.length = 0;
      MovilVisor.aplicar(MV_TODOS);
      var l = de(llamadas, diapo)[0];
      cierto(l && /scale\(0\.\d+\)/.test(l.hasta.transform), 'hasta: ' + (l && l.hasta.transform));
      igual([l.ms, de(llamadas, v.refs.fondo)[0].hasta.opacity, v.refs.raiz.hidden],
            [300, '0', true]);
    });
  });

  prueba('sin origen, entra y sale con un fundido del visor entero', function () {
    conOrigen(function (v, llamadas) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var entrada = de(llamadas, v.refs.raiz)[0];
      MovilVisor.aplicar(MV_TODOS);
      var salida = de(llamadas, v.refs.raiz)[1];
      igual([entrada.hasta.opacity, salida.hasta.opacity], ['1', '0']);
    }, { origen: function () { return null; } });
  });

  prueba('con movimiento reducido, sólo un fundido corto', function () {
    conOrigen(function (v, llamadas) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      var diapo = v.refs.pista.querySelector('.mvisor-diapo[data-pieza="2"]');
      var entrada = de(llamadas, v.refs.raiz)[0];
      igual([de(llamadas, diapo).length, entrada.ms], [0, 150]);
    }, { reducido: true });
  });

  prueba('reabrir mientras sale corta la salida y no lo deja escondido', function () {
    var cortes = 0;
    conOrigen(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(MV_TODOS);            // la salida queda en curso
      MovilVisor.aplicar(mvRuta('niebla', 3));
      igual([v.refs.raiz.hidden, cortes > 0, MovilVisor.estado().pieza], [false, true, 3]);
    }, { animar: function (el, desde, hasta, ms, curva, fin) {
      Object.keys(hasta).forEach(function (k) { el.style[k] = hasta[k]; });
      return function () { cortes++; };
    } });
  });
});

/* Lo que encontró la revisión final de la rama (2026-09-30). Cada prueba
   reproduce un hallazgo; la animación de verdad escribe al cortarse lo que
   devuelve `getComputedStyle`, que para un `transform` es SIEMPRE una
   `matrix(...)`, y eso es lo que simula el `animar` de las dos primeras. */
describe('MovilVisor — lo que encontró la revisión final', function () {

  function dedo(v, tipo, x, y, id, el) {
    (el || v.refs.raiz).dispatchEvent(new PointerEvent(tipo,
      { clientX: x, clientY: y, pointerId: id || 1, bubbles: true }));
  }
  function arrastrar(v, x0, y0, x1, y1) {
    dedo(v, 'pointerdown', x0, y0);
    dedo(v, 'pointermove', (x0 + x1) / 2, (y0 + y1) / 2);
    dedo(v, 'pointermove', x1, y1);
    dedo(v, 'pointerup', x1, y1);
  }

  /* El primer paso de la pista se queda a medias y, al cortarlo, deja la
     `matrix` que dejaría el navegador; todo lo demás termina al instante. */
  function conPasoCortado(fn) {
    var reloj = { t: 0 };
    var cortado = false;
    return conVisor(fn, {
      ahora: function () { reloj.t += 1000; return reloj.t; },
      animar: function (el, desde, hasta, ms, curva, fin) {
        if (el.id === 'mvPista' && !cortado) {
          cortado = true;
          return function () { el.style.transform = 'matrix(1, 0, 0, 1, -180, 0)'; };
        }
        Object.keys(hasta).forEach(function (k) { el.style[k] = hasta[k]; });
        if (fin) fin();
        return function () {};
      }
    });
  }

  prueba('tocar mientras pasa de foto termina el paso en vez de dejarla a medias', function () {
    conPasoCortado(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 150, 400);
      dedo(v, 'pointerdown', 200, 400);
      dedo(v, 'pointerup', 200, 400);
      igual(v.rutas, [['proyecto', 'niebla', 3]]);
    });
  });

  prueba('un arrastre nuevo a mitad del paso parte de donde está la pista', function () {
    conPasoCortado(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      arrastrar(v, 300, 400, 150, 400);
      dedo(v, 'pointerdown', 300, 400);
      dedo(v, 'pointermove', 280, 400);
      igual(v.refs.pista.style.transform.replace(/\s/g, ''), 'translate3d(-200px,0px,0px)');
      dedo(v, 'pointerup', 280, 400);
    });
  });

  prueba('subir y volver a bajar deja el panel de la ficha limpio', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      dedo(v, 'pointerdown', 200, 600);
      dedo(v, 'pointermove', 200, 500);
      dedo(v, 'pointermove', 200, 660);
      dedo(v, 'pointerup', 200, 660);
      igual([v.refs.ficha.classList.contains('arrastrando'), v.refs.ficha.style.transition,
             v.refs.ficha.style.transform], [false, '', '']);
    }, { ahora: (function () { var t = 0; return function () { return (t += 1000); }; })() });
  });

  prueba('con la ficha abierta, tocar fuera de ella la cierra', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      dedo(v, 'pointerdown', 200, 100);
      dedo(v, 'pointerup', 200, 100);
      igual(v.rutas, [['proyecto', 'niebla', 2]]);
    });
  });

  prueba('tocar dentro de la ficha no la cierra', function () {
    conVisor(function (v) {
      MovilVisor.aplicar(mvRuta('niebla', 2));
      MovilVisor.aplicar(mvRuta('niebla', 'ficha'));
      dedo(v, 'pointerdown', 200, 700, 1, v.refs.ficha);
      dedo(v, 'pointerup', 200, 700, 1, v.refs.ficha);
      igual(v.rutas, []);
    });
  });

  prueba('si el visor se cierra con el dedo en pantalla, moverlo no lanza', function () {
    var errores = 0;
    function contar() { errores++; }
    window.addEventListener('error', contar);
    try {
      conVisor(function (v) {
        MovilVisor.aplicar(mvRuta('niebla', 2));
        dedo(v, 'pointerdown', 300, 400);
        dedo(v, 'pointermove', 250, 400);
        MovilVisor.aplicar(MV_TODOS);
        dedo(v, 'pointermove', 200, 400);
        dedo(v, 'pointerup', 200, 400);
      });
    } finally { window.removeEventListener('error', contar); }
    igual(errores, 0);
  });
});
