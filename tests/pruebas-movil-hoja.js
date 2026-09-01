/* La portada móvil. Toca el DOM, así que va sobre `ArnesDom.conElemento`: el
   contenedor vive dentro del documento —fuera de la pantalla, no con
   display:none— para que medir y enfocar funcionen de verdad. */
describe('MovilHoja — la rejilla', function () {

  /* Cuatro proyectos y no doce: bastan para comprobar el ciclo de
     proporciones, dos categorías y el aviso al tocar, y una lista corta se lee
     de un vistazo cuando una prueba se pone en rojo. */
  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'foto-stills',
        portadaUrl: 'x-niebla.jpg' },
      { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial',
        portadaUrl: 'x-bruma.jpg' },
      { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'editorial',
        portadaUrl: 'x-oleaje.jpg' },
      { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip',
        portadaUrl: 'x-reflejo.jpg' }
    ];
  }

  function enUnaRejilla(fn, alAbrir) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), alAbrir || function () {});
      return fn(ol);
    });
  }

  prueba('pinta una celda por proyecto', function () {
    igual(enUnaRejilla(function (ol) {
      return ol.querySelectorAll('li.hoja-celda').length;
    }), 4);
  });

  prueba('cada celda guarda su id y su categoría', function () {
    igual(enUnaRejilla(function (ol) {
      var c = ol.querySelectorAll('li.hoja-celda');
      return [c[0].dataset.id, c[0].dataset.cat, c[3].dataset.id];
    }), ['niebla', 'foto-stills', 'reflejo']);
  });

  prueba('los números van desde 01 y con dos cifras', function () {
    igual(enUnaRejilla(function (ol) {
      var n = ol.querySelectorAll('.hoja-numero');
      return [n[0].textContent, n[3].textContent];
    }), ['01', '04']);
  });

  /* El salto de 09 a 10 no cabe con cuatro proyectos, y es el caso que
     importa: se prueba sobre la función pura. */
  prueba('numero() rellena hasta 09 y deja de rellenar en 10', function () {
    igual([MovilHoja.numero(0), MovilHoja.numero(8),
           MovilHoja.numero(9), MovilHoja.numero(11)],
          ['01', '09', '10', '12']);
  });

  prueba('las proporciones son un ciclo fijo, no un azar', function () {
    var largo = MovilHoja.PROPORCIONES.length;
    igual([MovilHoja.proporcion(0), MovilHoja.proporcion(largo),
           MovilHoja.proporcion(largo + 1)],
          [MovilHoja.PROPORCIONES[0], MovilHoja.PROPORCIONES[0],
           MovilHoja.PROPORCIONES[1]]);
  });

  /* Dos pintados seguidos tienen que dar lo mismo. Si alguien mete un
     Math.random() en las proporciones, la portada cambiaría entre dos cargas y
     nadie podría decir «la tercera de la izquierda» en una revisión. */
  prueba('dos pintados dan exactamente la misma rejilla', function () {
    var a = enUnaRejilla(function (ol) { return ol.innerHTML; });
    var b = enUnaRejilla(function (ol) { return ol.innerHTML; });
    igual(a, b);
  });

  prueba('la proporción va en el li, como variable CSS', function () {
    igual(enUnaRejilla(function (ol) {
      return ol.querySelector('li.hoja-celda')
               .style.getPropertyValue('--proporcion').trim();
    }), String(MovilHoja.PROPORCIONES[0]));
  });

  prueba('la imagen sale de portadaUrl y es perezosa', function () {
    igual(enUnaRejilla(function (ol) {
      var img = ol.querySelector('.hoja-boton img');
      return [img.getAttribute('src'), img.getAttribute('loading'),
              img.getAttribute('alt')];
    }), ['x-niebla.jpg', 'lazy', '']);
  });

  /* El nombre accesible lo pone el botón; el número es decoración. Sin el
     aria-hidden, un lector de pantalla diría «cero uno» antes de cada
     trabajo. */
  prueba('el botón se nombra con el título y el número no se lee', function () {
    igual(enUnaRejilla(function (ol) {
      var b = ol.querySelector('.hoja-boton');
      return [b.getAttribute('aria-label'),
              ol.querySelector('.hoja-numero').getAttribute('aria-hidden')];
    }), ['Abrir el proyecto Niebla', 'true']);
  });

  /* Hermano y no hijo: es lo que hace que el número sobreviva a la foto que no
     carga. La Tarea 3 comprueba el efecto; esto fija la causa, que es lo que
     un refactor podría deshacer sin enterarse. */
  prueba('el número es hermano de la imagen, no hijo', function () {
    cierto(enUnaRejilla(function (ol) {
      var num = ol.querySelector('.hoja-numero');
      return num.parentNode.classList.contains('hoja-boton') &&
             num.querySelector('img') === null;
    }), 'el número tiene que colgar del botón, al lado de la imagen');
  });

  prueba('tocar un trabajo avisa con su id', function () {
    var vistos = [];
    enUnaRejilla(function (ol) {
      ol.querySelectorAll('.hoja-boton')[2].click();
      return null;
    }, function (id) { vistos.push(id); });
    igual(vistos, ['oleaje']);
  });

  /* Pintar dos veces sobre el mismo contenedor no puede acumular. El caso
     llega solo: la Tarea 5 pinta al arrancar y nada impide otra llamada. */
  prueba('pintar dos veces no acumula celdas', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), function () {});
      MovilHoja.pintar(ol, proyectos(), function () {});
      return ol.querySelectorAll('li.hoja-celda').length;
    }), 4);
  });

  prueba('una lista vacía deja la rejilla vacía y no lanza', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, [], function () {});
      return ol.children.length;
    }), 0);
  });
});

/* Filtrar y fallar: las dos cosas que le pasan a una rejilla ya pintada. */
describe('MovilHoja — filtrar y la foto que falta', function () {

  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'foto-stills',
        portadaUrl: 'x-niebla.jpg' },
      { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial',
        portadaUrl: 'x-bruma.jpg' },
      { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'editorial',
        portadaUrl: 'x-oleaje.jpg' },
      { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip',
        portadaUrl: 'x-reflejo.jpg' }
    ];
  }

  function pintada(fn) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      MovilHoja.pintar(ol, proyectos(), function () {});
      return fn(ol);
    });
  }

  function visibles(ol) {
    var fuera = [];
    var celdas = ol.querySelectorAll('li.hoja-celda');
    for (var i = 0; i < celdas.length; i++) {
      if (!celdas[i].hidden) fuera.push(celdas[i].dataset.id);
    }
    return fuera;
  }

  prueba('filtrar deja sólo los de la categoría', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      return visibles(ol);
    }), ['bruma', 'oleaje']);
  });

  /* Lo que la spec pide con todas las letras: «los números no cambian». */
  prueba('filtrar NO renumera: bruma sigue siendo el 02', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      var b = ol.querySelector('li[data-id="bruma"] .hoja-numero');
      var o = ol.querySelector('li[data-id="oleaje"] .hoja-numero');
      return [b.textContent, o.textContent];
    }), ['02', '03']);
  });

  prueba('filtrar con null lo enseña todo otra vez', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      MovilHoja.filtrar(ol, null);
      return visibles(ol);
    }), ['niebla', 'bruma', 'oleaje', 'reflejo']);
  });

  prueba('cambiar de categoría no deja escondidos los de antes', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      MovilHoja.filtrar(ol, 'videoclip');
      return visibles(ol);
    }), ['reflejo']);
  });

  /* Una categoría sin trabajos no es un error: la rejilla se queda vacía y el
     filtro sigue funcionando después. Que no lance es la mitad importante. */
  prueba('una categoría sin trabajos deja la rejilla vacía sin lanzar', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'cortometraje');
      return visibles(ol);
    }), []);
  });

  /* Lo escondido no puede seguir siendo alcanzable con el tabulador ni
     legible por un lector de pantalla: `hidden` se encarga de las dos cosas a
     la vez, y por eso se usa el atributo y no una clase. */
  prueba('lo escondido lo está con el atributo hidden, no con una clase', function () {
    cierto(pintada(function (ol) {
      MovilHoja.filtrar(ol, 'editorial');
      var n = ol.querySelector('li[data-id="niebla"]');
      return n.hidden === true;
    }), 'las celdas fuera del filtro tienen que llevar hidden');
  });

  prueba('una foto que no carga marca su celda', function () {
    cierto(pintada(function (ol) {
      var celda = ol.querySelector('li[data-id="bruma"]');
      celda.querySelector('img').dispatchEvent(new Event('error'));
      return celda.classList.contains('sin-foto');
    }), 'la celda tiene que ganar la clase sin-foto');
  });

  prueba('la celda sin foto conserva su número', function () {
    igual(pintada(function (ol) {
      var celda = ol.querySelector('li[data-id="oleaje"]');
      celda.querySelector('img').dispatchEvent(new Event('error'));
      cierto(celda.classList.contains('sin-foto'),
             'precondición: la celda tiene que quedar sin-foto');
      return celda.querySelector('.hoja-numero').textContent;
    }), '03');
  });

  prueba('una foto que falla no afecta a las demás', function () {
    igual(pintada(function (ol) {
      ol.querySelector('li[data-id="bruma"] img').dispatchEvent(new Event('error'));
      return ol.querySelectorAll('li.sin-foto').length;
    }), 1);
  });
});
