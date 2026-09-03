/* Filtrar y fallar: las dos cosas que le pasan a una rejilla ya pintada. Va
   sobre `ArnesDom.conElemento` igual que pruebas-movil-hoja-rejilla.js: el
   contenedor vive dentro del documento —fuera de la pantalla, no con
   display:none— para que medir y enfocar funcionen de verdad. */
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

  /* La regla que traduce una ruta a filtro tiene que ser la MISMA que la del
     suscriptor de escritorio (js/galeria.js, el suscriptor que arma
     `Galeria.init()`): 'proyecto' se ignora, porque abrir un proyecto no dice
     nada del filtro. Sin esta guarda, `filtrarDesdeRuta` traducía 'proyecto'
     a `null` y deshacía el filtro de categoría que ya había. */
  prueba('una ruta de proyecto no toca el filtro que ya había', function () {
    igual(pintada(function (ol) {
      MovilHoja.filtrarDesdeRuta(ol, { tipo: 'categoria', valor: 'editorial', pieza: null });
      MovilHoja.filtrarDesdeRuta(ol, { tipo: 'proyecto', valor: 'niebla', pieza: null });
      return visibles(ol);
    }), ['bruma', 'oleaje']);
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
