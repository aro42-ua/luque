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

/* El hero fundido: la puerta de entrada de la portada móvil. */
describe('MovilHoja — el hero fundido', function () {

  var MARCO =
    '<div>' +
      '<div class="hoja-hero" id="h"></div>' +
      '<ol class="hoja-rejilla" id="r"></ol>' +
    '</div>';

  function conElHero(ruta, fn) {
    return ArnesDom.conElemento(MARCO, function (raiz) {
      var hero = raiz.querySelector('#h');
      var rejilla = raiz.querySelector('#r');
      MovilHoja.entrada(hero, raiz, rejilla, ruta);
      return fn(hero, raiz, rejilla);
    });
  }

  function rutaPortada()  { return { tipo: 'todos', valor: null, pieza: null }; }
  function rutaProyecto() { return { tipo: 'proyecto', valor: 'bruma', pieza: 3 }; }
  function rutaCategoria(){ return { tipo: 'categoria', valor: 'editorial', pieza: null }; }

  /* Un deslizamiento hacia arriba de verdad: 90px de recorrido vertical, muy
     por encima de los 24 de MovilGestos.UMBRAL y sin componente horizontal que
     lo convierta en diagonal. Los eventos se sintetizan porque un navegador de
     escritorio no genera toques. */
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 300, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 210, bubbles: true }));
  }

  function deslizarAbajo(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 210, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 300, bubbles: true }));
  }

  prueba('en la portada, el hero se queda', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      return !MovilHoja.heroIdo() && !hero.classList.contains('fuera');
    }), 'con la ruta vacía el hero tiene que verse');
  });

  /* «Quien llegue por un enlace profundo no lo ve en absoluto»: el enlace
     pedía un trabajo concreto y anteponerle una portada sería desobedecerlo. */
  prueba('un enlace a un proyecto se salta el hero', function () {
    cierto(conElHero(rutaProyecto(), function () {
      return MovilHoja.heroIdo();
    }), 'con #/bruma/3 el hero no puede aparecer');
  });

  prueba('un enlace a una categoría también se lo salta', function () {
    cierto(conElHero(rutaCategoria(), function () {
      return MovilHoja.heroIdo();
    }), 'con #/editorial el hero no puede aparecer');
  });

  prueba('deslizar hacia arriba se lleva el hero', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarArriba(hero);
      return MovilHoja.heroIdo() && hero.classList.contains('fuera');
    }), 'el deslizamiento hacia arriba tiene que cerrar la puerta');
  });

  /* La spec dice «se va al deslizar hacia ARRIBA». Hacia abajo no es la
     puerta: sin esta prueba, cualquier deslizamiento la abriría. */
  prueba('deslizar hacia abajo no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarAbajo(hero);
      return !MovilHoja.heroIdo() && !hero.classList.contains('fuera');
    }), 'hacia abajo no es el gesto');
  });

  /* Un toque tampoco: la spec dice «sin botón», y un toque que cerrara la
     puerta convertiría toda la pantalla en un botón. */
  prueba('un toque no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new PointerEvent('pointerdown',
        { clientX: 100, clientY: 300, bubbles: true }));
      hero.dispatchEvent(new PointerEvent('pointerup',
        { clientX: 102, clientY: 301, bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'un toque no es un deslizamiento');
  });

  /* El interruptor es el ancho: por aquí pasa un escritorio de 700px con
     ratón y sin pantalla táctil. Sin la rueda se queda encerrado. */
  prueba('la rueda hacia abajo se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilHoja.heroIdo();
    }), 'sin la rueda, una ventana estrecha con ratón no puede entrar');
  });

  prueba('la rueda hacia arriba no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'rodar hacia arriba no avanza');
  });

  /* Y sin el teclado se queda encerrado quien no usa ratón ni dedo. */
  prueba('el teclado también abre la puerta', function () {
    ['Enter', ' ', 'ArrowDown', 'PageDown', 'End'].forEach(function (tecla) {
      cierto(conElHero(rutaPortada(), function () {
        document.dispatchEvent(new KeyboardEvent('keydown',
          { key: tecla, bubbles: true }));
        return MovilHoja.heroIdo();
      }), 'la tecla ' + tecla + ' tiene que abrir la puerta');
    });
  });

  prueba('una tecla cualquiera no la abre', function () {
    cierto(conElHero(rutaPortada(), function () {
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'a', bubbles: true }));
      return !MovilHoja.heroIdo();
    }), 'escribir una letra no es cruzar la puerta');
  });

  /* «Una puerta que se cruza dos veces deja de ser una puerta.» El nodo se
     quita del documento, no se esconde: escondido seguiría en el tabulador. */
  prueba('cruzada la puerta, el nodo se va del documento', function () {
    cierto(conElHero(rutaPortada(), function (hero, raiz) {
      deslizarArriba(hero);
      MovilHoja.retirarYa();
      return raiz.querySelector('.hoja-hero') === null;
    }), 'el hero tiene que salir del documento, no quedarse escondido');
  });

  prueba('cruzarla dos veces no lanza', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarArriba(hero);
      deslizarArriba(hero);
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilHoja.heroIdo();
    }), 'el segundo gesto tiene que ser inofensivo');
  });

  /* Mientras el hero está delante, la rejilla no puede leerse por detrás. */
  prueba('con el hero puesto, la rejilla queda oculta al lector', function () {
    igual(conElHero(rutaPortada(), function (hero, raiz, rejilla) {
      var antes = rejilla.getAttribute('aria-hidden');
      deslizarArriba(hero);
      return [antes, rejilla.getAttribute('aria-hidden')];
    }), ['true', null]);
  });
});
