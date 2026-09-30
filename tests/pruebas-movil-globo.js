/* La esfera en el DOM. Va sobre `ArnesDom.conElemento`, dentro del documento,
   para que medir y enfocar funcionen. Dos cosas se inyectan siempre:
   - `fotograma` que no hace nada: el reloj lo mueve la prueba con
     `g.avanzar(ms)`, así ninguna prueba depende de `requestAnimationFrame`.
   - `medir` fijo a un teléfono de 390×844, para que la geometría no dependa
     del tamaño de la caja del arnés. */
function globoProyectos() {
  return [
    { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial', portadaUrl: 'x-niebla-1500.jpg', piezas: [{ url: 'x-niebla-p1-3000.jpg', miniatura: 'x-niebla-p1-250.jpg' }, { url: 'x-niebla-p2-3000.jpg', miniatura: 'x-niebla-p2-250.jpg' }, { url: 'x-niebla-p3-3000.jpg', miniatura: 'x-niebla-p3-250.jpg' }, { url: 'x-niebla-p4-3000.jpg', miniatura: 'x-niebla-p4-250.jpg' }, { url: 'x-niebla-p5-3000.jpg', miniatura: 'x-niebla-p5-250.jpg' }] },
    { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial', portadaUrl: 'x-bruma-1500.jpg', piezas: [{ url: 'x-bruma-p1-3000.jpg', miniatura: 'x-bruma-p1-250.jpg' }, { url: 'x-bruma-p2-3000.jpg', miniatura: 'x-bruma-p2-250.jpg' }, { url: 'x-bruma-p3-3000.jpg', miniatura: 'x-bruma-p3-250.jpg' }] },
    { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'videoclip', portadaUrl: 'x-oleaje-1500.jpg', piezas: [{ url: 'x-oleaje-p1-3000.jpg', miniatura: 'x-oleaje-p1-250.jpg' }, { url: 'x-oleaje-p2-3000.jpg', miniatura: 'x-oleaje-p2-250.jpg' }, { url: 'x-oleaje-p3-3000.jpg', miniatura: 'x-oleaje-p3-250.jpg' }] },
    { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip', portadaUrl: 'x-reflejo-1500.jpg', piezas: [{ url: 'x-reflejo-p1-3000.jpg', miniatura: 'x-reflejo-p1-250.jpg' }, { url: 'x-reflejo-p2-3000.jpg', miniatura: 'x-reflejo-p2-250.jpg' }, { url: 'x-reflejo-p3-3000.jpg', miniatura: 'x-reflejo-p3-250.jpg' }] },
    { id: 'marea',   titulo: 'Marea',   categoria: 'editorial', portadaUrl: 'x-marea-1500.jpg', piezas: [{ url: 'x-marea-p1-3000.jpg', miniatura: 'x-marea-p1-250.jpg' }, { url: 'x-marea-p2-3000.jpg', miniatura: 'x-marea-p2-250.jpg' }, { url: 'x-marea-p3-3000.jpg', miniatura: 'x-marea-p3-250.jpg' }] },
    { id: 'salitre', titulo: 'Salitre', categoria: 'videoclip', portadaUrl: 'x-salitre-1500.jpg', piezas: [{ url: 'x-salitre-p1-3000.jpg', miniatura: 'x-salitre-p1-250.jpg' }, { url: 'x-salitre-p2-3000.jpg', miniatura: 'x-salitre-p2-250.jpg' }, { url: 'x-salitre-p3-3000.jpg', miniatura: 'x-salitre-p3-250.jpg' }] },
    { id: 'espuma',  titulo: 'Espuma',  categoria: 'editorial', portadaUrl: 'x-espuma-1500.jpg', piezas: [{ url: 'x-espuma-p1-3000.jpg', miniatura: 'x-espuma-p1-250.jpg' }, { url: 'x-espuma-p2-3000.jpg', miniatura: 'x-espuma-p2-250.jpg' }, { url: 'x-espuma-p3-3000.jpg', miniatura: 'x-espuma-p3-250.jpg' }] },
    { id: 'resaca',  titulo: 'Resaca',  categoria: 'videoclip', portadaUrl: 'x-resaca-1500.jpg', piezas: [{ url: 'x-resaca-p1-3000.jpg', miniatura: 'x-resaca-p1-250.jpg' }, { url: 'x-resaca-p2-3000.jpg', miniatura: 'x-resaca-p2-250.jpg' }, { url: 'x-resaca-p3-3000.jpg', miniatura: 'x-resaca-p3-250.jpg' }] }
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
      alAbrir: function (id, pieza) { abiertos.push(pieza == null ? id : id + '/' + pieza); },
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

  /* Medido en el panel: `MovilGlobo.init` corre en index.html ANTES de que
     `Movil.init` ponga `body.es-movil`, así que la primera vez la raíz mide
     0×0. Con eso escrito, las teselas se quedaban a 0 px para siempre. */
  prueba('con la raíz sin medidas no escribe tamaños a cero, y redibujar los pone', function () {
    var medidas = { ancho: 0, alto: 0 };
    conGlobo(function (g, marco) {
      var li = teselaDe(marco, 'niebla');
      igual(li.style.width, '');
      medidas = { ancho: 390, alto: 844 };
      MovilGlobo.redibujar();
      cierto(parseFloat(li.style.width) > 100, 'ancho ' + li.style.width);
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

describe('MovilGlobo — dedo, rueda y teclado', function () {

  function puntero(el, tipo, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true }));
  }
  function botonDe(marco, id) { return teselaDe(marco, id).querySelector('button'); }
  function lateralVisible(g) {
    var delante = g.delante();
    return g.proyeccion().filter(function (p) { return p.visible && p.id !== delante; })[0];
  }

  prueba('un toque en la de delante abre su corona', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  /* Review Focus 1: con la captura de puntero, el `pointerup` llega a la
     raíz y no al botón. La tesela se decide en el `pointerdown`. */
  prueba('un pointerup que llega a la raíz abre igual', function () {
    conGlobo(function (g, marco, abiertos) {
      puntero(botonDe(marco, 'niebla'), 'pointerdown', 195, 380);
      puntero(marco.querySelector('#e'), 'pointerup', 196, 381);
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  prueba('un toque en una lateral no la abre: la trae delante', function () {
    conGlobo(function (g, marco, abiertos) {
      var lat = lateralVisible(g);
      cierto(lat, 'con 8 tiene que haber alguna lateral visible');
      var b = botonDe(marco, lat.id);
      puntero(b, 'pointerdown', 300, 300);
      puntero(b, 'pointerup', 300, 300);
      igual(abiertos, []);
      cierto(hastaQuieto(g) < 400, 'no se paró');
      igual(g.delante(), lat.id);
    });
  });

  prueba('arrastrar gira sin abrir, y al soltar se asienta en una portada', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      var antes = g.estado().q;
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 245, 380);
      puntero(b, 'pointermove', 320, 390);
      puntero(b, 'pointerup', 320, 390);
      igual(abiertos, []);
      cierto(MovilEsfera.distancia(antes, g.estado().q) > 0.3, 'no giró');
      cierto(hastaQuieto(g) < 400, 'no se paró');
      var alante = g.proyeccion().filter(function (p) { return p.id === g.delante(); })[0];
      cierto(Math.abs(alante.luz - 1) < 1e-3, 'la de delante no quedó centrada');
    });
  });

  prueba('un temblor por debajo del umbral sigue siendo un toque', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 199, 383);
      puntero(b, 'pointerup', 199, 383);
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  /* Medido en el panel: la pastilla «Contacto» vive dentro de la raíz, y el
     `pointerdown` de la esfera capturaba el puntero y se quedaba el clic. Un
     gesto que empieza en un enlace o botón ajeno a las teselas no es de la
     esfera. */
  prueba('un gesto que empieza en la pastilla de contacto no es de la esfera', function () {
    conGlobo(function (g, marco) {
      var a = document.createElement('a');
      a.href = '#/contacto';
      a.textContent = 'Contacto';
      marco.querySelector('#e').appendChild(a);
      var q = g.estado().q;
      puntero(a, 'pointerdown', 350, 30);
      puntero(a, 'pointermove', 200, 300);
      puntero(a, 'pointerup', 200, 300);
      igual(g.estado().q, q);
    });
  });

  /* Revisión final: tocar para FRENAR una esfera que gira por inercia es el
     gesto de cualquier lista con inercia, y no puede abrir la portada que
     pasaba por delante en ese instante. */
  prueba('tocar para frenar una esfera que gira no abre nada, sólo la asienta', function () {
    conGlobo(function (g, marco, abiertos) {
      var raiz = marco.querySelector('#e');
      puntero(raiz, 'pointerdown', 100, 400);
      puntero(raiz, 'pointermove', 200, 400);
      puntero(raiz, 'pointermove', 300, 400);
      puntero(raiz, 'pointerup', 300, 400);
      igual([g.estado().animando, g.estado().objetivo], [true, null]);
      var b = botonDe(marco, g.delante());
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual(abiertos, []);
      cierto(hastaQuieto(g) < 400, 'no se paró');
    });
  });

  /* Revisión final: con dos dedos, cada `pointermove` alternaba entre los
     dos y la esfera daba tirones de lado a lado. El gesto es del PRIMER
     dedo; el segundo se ignora. */
  function punteroDe(el, tipo, x, y, id) {
    el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, pointerId: id, bubbles: true }));
  }
  prueba('un segundo dedo no mueve la esfera ni roba el toque del primero', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      var q = g.estado().q;
      punteroDe(b, 'pointerdown', 195, 380, 1);
      punteroDe(b, 'pointerdown', 300, 380, 2);
      punteroDe(b, 'pointermove', 340, 300, 2);
      punteroDe(b, 'pointerup', 340, 300, 2);
      igual(g.estado().q, q);
      punteroDe(b, 'pointerup', 195, 380, 1);
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  prueba('pointercancel no abre nunca', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointercancel', 195, 380);
      igual(abiertos, []);
    });
  });

  prueba('con movimiento reducido, soltar asienta sin animar', function () {
    conGlobo(function (g, marco) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 320, 380);
      puntero(b, 'pointerup', 320, 380);
      igual(g.estado().animando, false);
    }, { reducido: true });
  });

  /* Un clic de ratón o de dedo trae `detail` ≥ 1 y ya lo atendió el
     `pointerup`; sólo el de teclado (Intro, espacio) trae `detail` 0. */
  prueba('Intro sobre la de delante abre su corona; un clic de puntero no la abre dos veces', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      igual(abiertos, []);
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  prueba('la flecha derecha trae la vecina de la derecha', function () {
    conGlobo(function (g, marco) {
      var antes = g.proyeccion();
      var xDelante = antes.filter(function (p) { return p.id === 'niebla'; })[0].x;
      marco.querySelector('#e').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      var nueva = g.delante();
      cierto(nueva !== 'niebla', 'no cambió');
      var xNueva = antes.filter(function (p) { return p.id === nueva; })[0].x;
      cierto(xNueva > xDelante, 'la nueva no estaba a la derecha');
      igual(document.activeElement, botonDe(marco, nueva));
    }, { reducido: true });
  });

  prueba('la rueda gira la esfera', function () {
    conGlobo(function (g, marco) {
      var antes = g.estado().q;
      marco.querySelector('#e').dispatchEvent(
        new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
      cierto(MovilEsfera.distancia(antes, g.estado().q) > 0.01, 'no giró');
    });
  });

  prueba('congelada no atiende toques; al descongelar vuelve', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      MovilGlobo.congelar();
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual(abiertos, []);
      MovilGlobo.descongelar();
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual([abiertos, g.corona()], [[], 'niebla']);
    });
  });

  prueba('con un solo trabajo, arrastrar y soltar vuelve a dejarlo delante', function () {
    conGlobo(function (g, marco) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 300, 380);
      puntero(b, 'pointerup', 300, 380);
      hastaQuieto(g);
      var p = g.proyeccion()[0];
      cierto(Math.abs(p.luz - 1) < 1e-3, 'luz ' + p.luz);
    }, {}, globoProyectos().slice(0, 1));
  });
});

describe('MovilGlobo — la ruta', function () {

  var TODOS = { tipo: 'todos', valor: null, pieza: null };
  function categoria(c) { return { tipo: 'categoria', valor: c, pieza: null }; }
  function proyecto(id) { return { tipo: 'proyecto', valor: id, pieza: 1 }; }
  function enLaEsfera(marco) {
    return Array.prototype.filter.call(marco.querySelectorAll('li.esfera-tesela'),
      function (li) { return !li.hidden; }).map(function (li) { return li.dataset.id; });
  }

  prueba('una categoría deja sólo las suyas y conserva los números', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(enLaEsfera(marco), ['oleaje', 'reflejo', 'salitre', 'resaca']);
      igual(teselaDe(marco, 'oleaje').querySelector('.esfera-numero').textContent, '03');
      igual(g.delante(), 'oleaje');
      igual(marco.querySelector('#m').textContent, 'videoclip 03/08');
    });
  });

  prueba('las de la categoría se reparten por toda la esfera', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.proyeccion().length, 4);
    });
  });

  prueba('volver a todos las devuelve todas', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      MovilGlobo.aplicar(TODOS);
      igual(enLaEsfera(marco).length, 8);
    });
  });

  /* Review Focus 4. */
  prueba('una categoría sin trabajos deja la esfera vacía sin lanzar', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('cortometraje'));
      igual(enLaEsfera(marco), []);
      igual(g.delante(), null);
      igual(marco.querySelector('#t').textContent, '');
    });
  });

  prueba('una categoría con un solo trabajo lo deja delante', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.delante(), 'oleaje');
    }, {}, globoProyectos().slice(0, 3));
  });

  prueba('abrir un proyecto no toca el filtro ni la esfera', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      var q = g.estado().q;
      MovilGlobo.aplicar(proyecto('reflejo'));
      igual(enLaEsfera(marco).length, 4);
      igual(g.estado().q, q);
    });
  });

  prueba('el contacto no toca el filtro', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      MovilGlobo.aplicar({ tipo: 'contacto', valor: null, pieza: null });
      igual(enLaEsfera(marco).length, 4);
    });
  });

  /* Review Focus 5: quien llega por un enlace a un trabajo, o se mueve de
     trabajo dentro del visor, al cerrar lo encuentra delante. */
  prueba('al salir del visor trae delante el último trabajo abierto', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(proyecto('bruma'));
      MovilGlobo.aplicar(proyecto('marea'));
      MovilGlobo.aplicar(TODOS);
      igual(g.delante(), 'marea');
      igual(g.estado().animando, false);
    });
  });

  prueba('si el último abierto no es de la categoría, delante queda la primera', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(proyecto('bruma'));
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.delante(), 'oleaje');
    });
  });

  prueba('al volver, si el foco estaba en la esfera pasa a la de delante', function () {
    conGlobo(function (g, marco) {
      teselaDe(marco, 'niebla').querySelector('button').focus();
      MovilGlobo.aplicar(proyecto('marea'));
      MovilGlobo.aplicar(TODOS);
      igual(document.activeElement, teselaDe(marco, 'marea').querySelector('button'));
    });
  });
});

/* Las ramas: del centro de la esfera sale una línea hasta cada portada, y todas
   se juntan en un nudo (petición de Ángel, 2026-09-29). Cada rama va JUSTO
   por debajo de su propia portada en el orden de pintado, para que la de una
   portada de delante pase por encima de las de detrás y se esconda bajo la
   suya, como en 3D. Con `medir` fijo a 390×844 el centro es (195, 379.8). */
describe('MovilGlobo — las ramas', function () {

  function ramaDe(marco, id) {
    return marco.querySelector('.esfera-rama[data-id="' + id + '"]');
  }
  function visibles(marco, sel) {
    return Array.prototype.filter.call(marco.querySelectorAll(sel),
      function (el) { return !el.hidden; });
  }

  prueba('hay una rama por portada, fuera del lector de pantalla', function () {
    conGlobo(function (g, marco) {
      igual(visibles(marco, '.esfera-rama').length, 8);
      igual(marco.querySelector('.esfera-ramas').getAttribute('aria-hidden'), 'true');
    });
  });

  /* El navegador reescribe los números al leer `style.transform` (195.0px
     vuelve como 195px), así que se extraen y se comparan con tolerancia. */
  function origen(el) {
    var m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }
  function enElCentro(el) {
    var o = origen(el);
    return !!o && Math.abs(o[0] - 195) < 0.1 && Math.abs(o[1] - 379.8) < 0.1;
  }

  prueba('todas salen del centro de la esfera', function () {
    conGlobo(function (g, marco) {
      visibles(marco, '.esfera-rama').forEach(function (r) {
        cierto(enElCentro(r), r.dataset.id + ': ' + r.style.transform);
      });
    });
  });

  prueba('cada rama llega al centro de su portada', function () {
    conGlobo(function (g, marco) {
      var p = g.proyeccion().filter(function (x) { return x.id === 'bruma'; })[0];
      var r = ramaDe(marco, 'bruma');
      var largo = Math.hypot(p.x - 195, p.y - 379.8);
      cierto(Math.abs(parseFloat(r.style.width) - largo) < 0.2,
             r.style.width + ' contra ' + largo);
    });
  });

  prueba('cada rama va justo por debajo de su portada', function () {
    conGlobo(function (g, marco) {
      ['niebla', 'bruma', 'resaca'].forEach(function (id) {
        igual(Number(ramaDe(marco, id).style.zIndex),
              Number(teselaDe(marco, id).style.zIndex) - 1, id);
      });
    });
  });

  prueba('el nudo está en el centro', function () {
    conGlobo(function (g, marco) {
      var n = marco.querySelector('.esfera-nudo');
      cierto(n, 'no hay nudo');
      cierto(enElCentro(n), n.style.transform);
    });
  });

  prueba('con una categoría sólo quedan las ramas de sus portadas', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar({ tipo: 'categoria', valor: 'videoclip', pieza: null });
      igual(visibles(marco, '.esfera-rama').map(function (r) { return r.dataset.id; }),
            ['oleaje', 'reflejo', 'salitre', 'resaca']);
    });
  });
});

/* La corona: al tocar la portada de delante, sus fotos salen de detrás y se
   colocan alrededor (spec docs/superpowers/specs/2026-09-30-esfera-corona-design.md).
   En el juego de prueba Niebla tiene cinco piezas y las demás tres. */
describe('MovilGlobo — la corona', function () {

  function puntero(el, tipo, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true }));
  }
  function tocar(el, x, y) { puntero(el, 'pointerdown', x, y); puntero(el, 'pointerup', x, y); }
  function botonDe(marco, id) { return teselaDe(marco, id).querySelector('button'); }
  function fotos(marco) { return marco.querySelectorAll('.esfera-foto:not(.saliendo)'); }
  function abrir(marco) { tocar(botonDe(marco, 'niebla'), 195, 380); }

  prueba('el primer toque abre la corona con una foto por pieza, y no el visor', function () {
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      igual([g.corona(), fotos(marco).length, abiertos], ['niebla', 5, []]);
    });
  });

  prueba('cada foto lleva su etiqueta y su miniatura', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      var f = fotos(marco)[2];
      igual([f.getAttribute('aria-label'), f.querySelector('img').getAttribute('src')],
            ['Abrir la foto 3 de Niebla', 'x-niebla-p3-250.jpg']);
    });
  });

  prueba('con la corona abierta la portada encoge', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      cierto(teselaDe(marco, 'niebla').classList.contains('en-corona'), 'sin en-corona');
      cierto(/scale\(0\.7/.test(teselaDe(marco, 'niebla').style.transform),
             teselaDe(marco, 'niebla').style.transform);
    });
  });

  prueba('tocar una foto abre el visor en esa foto', function () {
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      tocar(fotos(marco)[2], 60, 60);
      igual(abiertos, ['niebla/3']);
    });
  });

  prueba('tocar la portada con la corona abierta abre la foto 1', function () {
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      abrir(marco);
      igual(abiertos, ['niebla/1']);
    });
  });

  prueba('tocar el fondo la cierra sin abrir nada', function () {
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      tocar(marco.querySelector('#e'), 20, 800);
      igual([g.corona(), fotos(marco).length, abiertos], [null, 0, []]);
    });
  });

  prueba('arrastrar la cierra y la esfera gira', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      var q = g.estado().q;
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 260, 380);
      puntero(b, 'pointermove', 320, 380);
      puntero(b, 'pointerup', 320, 380);
      igual(g.corona(), null);
      cierto(MovilEsfera.distancia(q, g.estado().q) > 0.3, 'no giró');
    });
  });

  prueba('Intro abre la corona con el foco en la primera foto, y Escape la cierra', function () {
    conGlobo(function (g, marco) {
      var b = botonDe(marco, 'niebla');
      b.focus();
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      igual(g.corona(), 'niebla');
      igual(document.activeElement, fotos(marco)[0]);
      marco.querySelector('#e').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      igual(g.corona(), null);
      igual(document.activeElement, b);
    });
  });

  prueba('Intro sobre una foto abre esa foto', function () {
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      fotos(marco)[1].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      igual(abiertos, ['niebla/2']);
    });
  });

  prueba('filtrar por categoría la cierra', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      MovilGlobo.aplicar({ tipo: 'categoria', valor: 'editorial', pieza: null });
      igual([g.corona(), fotos(marco).length], [null, 0]);
    });
  });

  prueba('abrir un proyecto por la ruta la cierra', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      MovilGlobo.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 3 });
      igual(g.corona(), null);
    });
  });

  /* Visto en el panel: sin esto, una miniatura que no llega enseña el icono
     de imagen rota del navegador. Queda el hueco gris, como en las teselas. */
  prueba('una foto que no carga deja el hueco sin el icono roto', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      var f = fotos(marco)[0];
      f.querySelector('img').dispatchEvent(new Event('error'));
      cierto(f.classList.contains('sin-foto'));
    });
  });

  /* La cascada (2026-09-30): al cerrar, vuelven en orden INVERSO, así que la
     última en salir es la primera en volver. `--j` es su turno de vuelta. */
  prueba('al cerrar vuelven en orden inverso', function () {
    conGlobo(function (g, marco) {
      abrir(marco);
      var todas = Array.prototype.slice.call(marco.querySelectorAll('.esfera-foto'));
      tocar(marco.querySelector('#e'), 20, 800);
      igual(todas.map(function (b) { return b.style.getPropertyValue('--j'); }),
            ['4', '3', '2', '1', '0']);
    });
  });

  prueba('un trabajo sin fotos abre el visor directamente', function () {
    var lista = globoProyectos();
    lista[0].piezas = [];
    conGlobo(function (g, marco, abiertos) {
      abrir(marco);
      igual([abiertos, g.corona()], [['niebla'], null]);
    }, {}, lista);
  });
});
