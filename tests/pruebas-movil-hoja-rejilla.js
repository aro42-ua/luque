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

  /* Devuelve el BOTÓN y no el `<li>`, y no es un detalle: al cerrar el visor,
     `js/visor.js` le hace `focus()` al elemento que lo abrió, y un `<li>` no
     recibe foco. Devolver la celda dejaría el foco en el `body` al volver. */
  prueba('elementoDe devuelve el botón de esa celda', function () {
    igual(enUnaRejilla(function (ol) {
      var el = MovilHoja.elementoDe(ol, 'bruma');
      return [el.tagName, el.className, el.parentNode.dataset.id];
    }), ['BUTTON', 'hoja-boton', 'bruma']);
  });

  /* El visor pregunta por cualquier id, también por uno que la rejilla no
     tenga. Devolver `null` es lo que hace que caiga en su rama sin vuelo en vez
     de reventar. */
  prueba('elementoDe devuelve null si ese trabajo no está', function () {
    igual(enUnaRejilla(function (ol) {
      return MovilHoja.elementoDe(ol, 'no-existe');
    }), null);
  });

  /* Filtrar esconde con `hidden`, no borra: la celda sigue EN EL DOM y
     `elementoDe` tiene que seguir encontrándola. Eso es lo único que esta
     prueba fija, y es lo que hace que el visor caiga en su rama sin vuelo en
     vez de reventar al abrir un trabajo que el filtro tapa.

     Lo que NO hay que creerse —lo decía este mismo comentario y era falso— es
     que una celda escondida «conserve su sitio». Medido al filtrar por
     'videoclip' en una rejilla de cuatro: `bruma` pasa de `{x:250,y:24,w:216,
     h:269}` a `{0,0,0,0}`, porque `display:none` no deja caja; y `reflejo`, que
     sobrevive al filtro, REFLOTA de `{x:250,y:303}` a `{x:24,y:24}` al
     recolocarse las que quedan. O sea que esconder una celda mueve a las demás.
     Quien decide qué hacer con un rectángulo en ceros es el visor, no esto. */
  prueba('elementoDe encuentra también una celda escondida por el filtro', function () {
    igual(enUnaRejilla(function (ol) {
      MovilHoja.filtrar(ol, 'videoclip');
      return MovilHoja.elementoDe(ol, 'bruma') !== null;
    }), true);
  });
});
