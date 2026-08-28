/* El pintado de la lista del panel. Las tres piezas sin DOM de lista.js se
   prueban en pruebas-lista.js; esto es lo otro, que hasta ahora no tenía nada
   y es donde se construyen las filas y se enganchan los botones. */
describe('Lista.pintar', function () {

  function proyectos() {
    return [
      { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial' },
      { id: 'arena',   titulo: 'Arena',   categoria: 'videoclip' },
      { id: 'vidrio',  titulo: 'Vidrio',  categoria: 'foto-stills' }
    ];
  }

  function pintarEn(lista, alMover, alBorrar) {
    return function (ol) {
      Lista.pintar(ol, lista, alMover || function () {}, alBorrar || function () {});
      return ol;
    };
  }

  prueba('pinta una fila por proyecto', function () {
    var n = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelectorAll('li.fila').length;
    });
    igual(n, 3);
  });

  prueba('el título lleva la etiqueta de la categoría, no su identificador', function () {
    var texto = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelector('.fila-titulo').textContent;
    });
    igual(texto, 'Niebla · ' + Lista.ETIQUETAS['editorial']);
  });

  prueba('cada fila guarda su id y su índice', function () {
    var datos = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelectorAll('li.fila');
      return [f[0].dataset.id, f[0].dataset.indice, f[2].dataset.id, f[2].dataset.indice];
    });
    igual(datos, ['niebla', '0', 'vidrio', '2']);
  });

  /* Los extremos. Sin esto, «subir» en la primera fila llamaría a mover(0, -1)
     y el orden se corrompería en silencio. */
  prueba('subir está deshabilitado en la primera y bajar en la última', function () {
    var estados = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelectorAll('li.fila');
      return {
        subirPrimera: f[0].querySelector('[data-accion="subir"]').disabled,
        bajarPrimera: f[0].querySelector('[data-accion="bajar"]').disabled,
        subirUltima:  f[2].querySelector('[data-accion="subir"]').disabled,
        bajarUltima:  f[2].querySelector('[data-accion="bajar"]').disabled
      };
    });
    igual(estados, { subirPrimera: true, bajarPrimera: false,
                     subirUltima: false, bajarUltima: true });
  });

  prueba('con un solo proyecto, subir y bajar están los dos deshabilitados', function () {
    var estados = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn([{ id: 'solo', titulo: 'Solo', categoria: 'editorial' }])(ol);
      return [ol.querySelector('[data-accion="subir"]').disabled,
              ol.querySelector('[data-accion="bajar"]').disabled];
    });
    igual(estados, [true, true]);
  });

  /* Los aria-label nombran el proyecto: sin ellos, un lector de pantalla lee
     tres botones «flecha arriba» seguidos y no dice de qué fila son. */
  prueba('los botones se anuncian con el nombre del proyecto', function () {
    var etiquetas = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      var f = ol.querySelector('li.fila');
      return [f.querySelector('[data-accion="subir"]').getAttribute('aria-label'),
              f.querySelector('[data-accion="borrar"]').getAttribute('aria-label')];
    });
    igual(etiquetas, ['Subir Niebla', 'Borrar Niebla']);
  });

  prueba('pulsar bajar pide mover de su índice al siguiente', function () {
    var visto = null;
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos(), function (desde, hasta) { visto = [desde, hasta]; })(ol);
      ol.querySelectorAll('li.fila')[1].querySelector('[data-accion="bajar"]').click();
    });
    igual(visto, [1, 2]);
  });

  prueba('pulsar borrar pide borrar ese id, con su título para el aviso', function () {
    var visto = null;
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos(), null, function (id, titulo) { visto = [id, titulo]; })(ol);
      ol.querySelectorAll('li.fila')[2].querySelector('[data-accion="borrar"]').click();
    });
    igual(visto, ['vidrio', 'Vidrio']);
  });

  /* Repintar es la operación normal del panel: cada movimiento reconstruye el
     <ol> entero. Si no vaciara, las filas se acumularían. */
  prueba('repintar reemplaza las filas, no las acumula', function () {
    var n = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      pintarEn(proyectos())(ol);
      return ol.querySelectorAll('li.fila').length;
    });
    igual(n, 3);
  });

  prueba('una lista vacía deja el contenedor vacío', function () {
    var html = ArnesDom.conElemento('<ol><li>basura previa</li></ol>', function (ol) {
      pintarEn([])(ol);
      return ol.innerHTML;
    });
    igual(html, '');
  });

  prueba('las filas se pueden arrastrar', function () {
    var arrastrable = ArnesDom.conElemento('<ol></ol>', function (ol) {
      pintarEn(proyectos())(ol);
      return ol.querySelector('li.fila').draggable;
    });
    cierto(arrastrable);
  });
});
