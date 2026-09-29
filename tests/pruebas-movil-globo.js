/* La esfera en el DOM. Va sobre `ArnesDom.conElemento`, dentro del documento,
   para que medir y enfocar funcionen. Dos cosas se inyectan siempre:
   - `fotograma` que no hace nada: el reloj lo mueve la prueba con
     `g.avanzar(ms)`, así ninguna prueba depende de `requestAnimationFrame`.
   - `medir` fijo a un teléfono de 390×844, para que la geometría no dependa
     del tamaño de la caja del arnés. */
function globoProyectos() {
  return [
    { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial', portadaUrl: 'x-niebla-1500.jpg' },
    { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial', portadaUrl: 'x-bruma-1500.jpg' },
    { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'videoclip', portadaUrl: 'x-oleaje-1500.jpg' },
    { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip', portadaUrl: 'x-reflejo-1500.jpg' },
    { id: 'marea',   titulo: 'Marea',   categoria: 'editorial', portadaUrl: 'x-marea-1500.jpg' },
    { id: 'salitre', titulo: 'Salitre', categoria: 'videoclip', portadaUrl: 'x-salitre-1500.jpg' },
    { id: 'espuma',  titulo: 'Espuma',  categoria: 'editorial', portadaUrl: 'x-espuma-1500.jpg' },
    { id: 'resaca',  titulo: 'Resaca',  categoria: 'videoclip', portadaUrl: 'x-resaca-1500.jpg' }
  ];
}

var GLOBO_MARCO =
  '<div style="position:relative;width:390px;height:844px">' +
    '<div class="esfera" id="e"><ul id="l"></ul>' +
    '<p><span id="t"></span><span id="m"></span></p></div>' +
  '</div>';

function conGlobo(fn, opciones, lista) {
  return ArnesDom.conElemento(GLOBO_MARCO, function (marco) {
    var abiertos = [];
    var o = {
      alAbrir: function (id) { abiertos.push(id); },
      fotograma: function () {},
      reducido: false,
      medir: function () { return { ancho: 390, alto: 844 }; }
    };
    Object.keys(opciones || {}).forEach(function (k) { o[k] = opciones[k]; });
    var g = MovilGlobo.init({
      raiz: marco.querySelector('#e'),
      lista: marco.querySelector('#l'),
      titulo: marco.querySelector('#t'),
      meta: marco.querySelector('#m')
    }, lista || globoProyectos(), o);
    return fn(g, marco, abiertos);
  });
}

function teselaDe(marco, id) { return marco.querySelector('li.esfera-tesela[data-id="' + id + '"]'); }

function hastaQuieto(g) {
  for (var i = 0; i < 400 && g.estado().animando; i++) g.avanzar(16);
  return i;
}

describe('MovilGlobo — teselas, dibujo y carga', function () {

  prueba('miniaturaDe cambia la de 1500 por la de 250 y deja el resto', function () {
    igual([MovilGlobo.miniaturaDe('/img/a-portada-1500.jpg'),
           MovilGlobo.miniaturaDe('/img/a-1500.webp'),
           MovilGlobo.miniaturaDe('/img/poster.jpg')],
          ['/img/a-portada-250.jpg', '/img/a-250.webp', '/img/poster.jpg']);
  });

  prueba('pinta una tesela por trabajo, con su id, su índice y su etiqueta', function () {
    conGlobo(function (g, marco) {
      var lis = marco.querySelectorAll('li.esfera-tesela');
      igual(lis.length, 8);
      igual([lis[2].dataset.id, lis[2].dataset.indice], ['oleaje', '2']);
      igual(lis[2].querySelector('button').getAttribute('aria-label'),
            'Abrir el proyecto Oleaje');
      igual(lis[2].querySelector('.esfera-numero').textContent, '03');
    });
  });

  prueba('arranca con el 01 delante y el pie lo nombra', function () {
    conGlobo(function (g, marco) {
      igual(g.delante(), 'niebla');
      igual(marco.querySelector('#t').textContent, 'Niebla');
      igual(marco.querySelector('#m').textContent, 'editorial 01/08');
    });
  });

  prueba('la de delante pide la de 1500 con prioridad y las de detrás la de 250', function () {
    conGlobo(function (g, marco) {
      var img = teselaDe(marco, 'niebla').querySelector('img');
      igual(img.getAttribute('src'), 'x-niebla-1500.jpg');
      igual(img.getAttribute('fetchpriority'), 'high');
      var detras = marco.querySelector('li.esfera-tesela.detras');
      cierto(detras, 'con 8 alguna tiene que quedar detrás');
      cierto(/-250\.jpg$/.test(detras.querySelector('img').getAttribute('src')),
             detras.querySelector('img').getAttribute('src'));
    });
  });

  prueba('las de detrás no se tocan, no se tabulan y el lector no las lee', function () {
    conGlobo(function (g, marco) {
      var detras = marco.querySelector('li.esfera-tesela.detras');
      var b = detras.querySelector('button');
      igual([b.getAttribute('aria-hidden'), b.tabIndex], ['true', -1]);
      var alante = teselaDe(marco, 'niebla').querySelector('button');
      igual([alante.getAttribute('aria-hidden'), alante.tabIndex], [null, 0]);
    });
  });

  prueba('la de delante está más arriba en el orden y sin velo', function () {
    conGlobo(function (g, marco) {
      var alante = teselaDe(marco, 'niebla');
      var detras = marco.querySelector('li.esfera-tesela.detras');
      cierto(Number(alante.style.zIndex) > Number(detras.style.zIndex), 'z-index');
      igual(Number(alante.querySelector('.esfera-velo').style.opacity), 0);
      cierto(Number(detras.querySelector('.esfera-velo').style.opacity) > 0.5, 'velo detrás');
    });
  });

  prueba('una foto que falla deja la tesela marcada sin foto', function () {
    conGlobo(function (g, marco) {
      var li = teselaDe(marco, 'bruma');
      li.querySelector('img').dispatchEvent(new Event('error'));
      cierto(li.classList.contains('sin-foto'));
    });
  });

  prueba('elementoDe da el botón del trabajo, y null si no existe', function () {
    conGlobo(function (g, marco) {
      igual(MovilGlobo.elementoDe('bruma'),
            teselaDe(marco, 'bruma').querySelector('button'));
      igual(MovilGlobo.elementoDe('no-existe'), null);
    });
  });

  /* Review Focus 3: girar el teléfono. */
  prueba('redibujar usa las medidas nuevas y conserva la de delante', function () {
    var medidas = { ancho: 390, alto: 844 };
    conGlobo(function (g, marco) {
      var antes = teselaDe(marco, 'niebla').style.width;
      medidas = { ancho: 844, alto: 390 };
      MovilGlobo.redibujar();
      cierto(teselaDe(marco, 'niebla').style.width !== antes, 'no cambió de tamaño');
      igual(g.delante(), 'niebla');
    }, { medir: function () { return medidas; } });
  });

  prueba('sin trabajos no pinta teselas, no lanza y delante es null', function () {
    conGlobo(function (g, marco) {
      igual(marco.querySelectorAll('li').length, 0);
      igual(g.delante(), null);
      igual(marco.querySelector('#t').textContent, '');
      MovilGlobo.redibujar();
    }, {}, []);
  });
});
