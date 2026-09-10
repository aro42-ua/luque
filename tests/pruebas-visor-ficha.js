describe('VisorFicha — la ficha del escritorio', function () {

  /* Los SEIS elementos que busca `init`, y no sólo los dos que toca esta
     tarea: `pintar` usa las referencias que guarda `init`, así que un marcado
     incompleto no falla donde se lee —en `init`— sino después, sobre
     `undefined`, y el error no nombraría al que falta. */
  var MARCADO =
    '<div>' +
    '<aside id="visorFicha"><button id="fichaCerrar"></button>' +
    '<p id="fichaCat"></p><p id="fichaTitulo"></p>' +
    '<dl id="fichaDatos"></dl><div id="fichaEnlace"></div>' +
    '</aside><button id="visorInfo"></button>' +
    '</div>';

  function proyecto(enlace) {
    return {
      categoria: 'videoclip', titulo: 'X',
      ficha: { cliente: 'C', anio: 2026, papel: 'Gaffer', enlace: enlace }
    };
  }

  /* `init` antes que `pintar` SIEMPRE: es quien guarda las referencias. El
     manejador es un vacío porque aquí no se prueba el alternar. */
  function preparar() {
    VisorFicha.init(function () {});
  }

  prueba('la ficha pinta cliente, ano, papel y piezas', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      preparar();
      VisorFicha.pintar(proyecto(null), 6);
      var dt = raiz.querySelectorAll('#fichaDatos dt');
      igual(dt.length, 4);
      igual(dt[2].textContent, 'Papel');
    });
  });

  prueba('con enlace aparece el boton', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      preparar();
      VisorFicha.pintar(proyecto('https://youtu.be/x'), 6);
      var a = raiz.querySelector('#fichaEnlace a');
      igual(a.textContent, 'Ver en YouTube');
      igual(a.getAttribute('rel'), 'noopener noreferrer');
    });
  });

  /* Un control que no lleva a ninguna parte no se ensena apagado: se omite.
     Y no deja hueco, que es distinto de un dato ausente. */
  prueba('sin enlace no hay boton ni hueco', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      preparar();
      VisorFicha.pintar(proyecto(null), 6);
      igual(raiz.querySelector('#fichaEnlace').children.length, 0);
    });
  });

  /* Repintar sin limpiar dejaba DOS botones al pasar de un videoclip a otro. */
  prueba('repintar no acumula botones', function () {
    ArnesDom.conElemento(MARCADO, function (raiz) {
      preparar();
      VisorFicha.pintar(proyecto('https://youtu.be/x'), 6);
      VisorFicha.pintar(proyecto('https://youtu.be/y'), 6);
      igual(raiz.querySelectorAll('#fichaEnlace a').length, 1);
    });
  });

});
