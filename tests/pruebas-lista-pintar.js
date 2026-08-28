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

  /* Los eventos de arrastre sintéticos no traen `dataTransfer`, y tanto
     `dragstart` como `drop` lo tocan. Se le pone uno de mentira que sólo tiene
     lo que el código usa. El `clientY` va en el constructor y no asignado
     después: en un evento ya construido es de sólo lectura, y la asignación se
     perdería sin dar error, dejando el cálculo de la mitad siempre en 0. */
  function arrastrar(li, tipo, y) {
    var e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientY: y || 0 });
    e.dataTransfer = { effectAllowed: '', dropEffect: '',
                       setData: function () {}, getData: function () { return ''; } };
    li.dispatchEvent(e);
    return e;
  }

  /* Un punto en la mitad de arriba o en la de abajo de la fila, medido sobre su
     caja de verdad. Es la razón de que el arnés cuelgue el contenedor del
     documento: sobre un nodo suelto getBoundingClientRect() daría todo ceros y
     las dos mitades saldrían en el mismo sitio. */
  function mitad(li, arriba) {
    var caja = li.getBoundingClientRect();
    return caja.top + caja.height * (arriba ? 0.25 : 0.75);
  }

  /* El camino que corrompe el orden en silencio. `calcularHasta` ya está
     probado como función pura en pruebas-lista.js, pero hasta aquí nadie
     comprobaba que `drop` la llame bien: con los oyentes desenganchados, las
     filas seguirían teniendo draggable=true y arrastrar no movería nada. */
  prueba('soltar una fila sobre otra pide moverla al hueco que dice el ratón', function () {
    var movimientos = ArnesDom.conElemento('<ol></ol>', function (ol) {
      var vistos = [];
      pintarEn(proyectos(), function (desde, hasta) { vistos.push([desde, hasta]); })(ol);
      var f = ol.querySelectorAll('li.fila');
      cierto(f[0].draggable, 'sin draggable el navegador no empezaría el arrastre');

      // La primera a la mitad de abajo de la última: se va al final.
      arrastrar(f[0], 'dragstart');
      arrastrar(f[2], 'drop', mitad(f[2], false));

      // La primera a la mitad de arriba de la última: queda justo antes de ella.
      arrastrar(f[0], 'dragstart');
      arrastrar(f[2], 'drop', mitad(f[2], true));
      return vistos;
    });
    igual(movimientos, [[0, 2], [0, 1]]);
  });

  /* Soltar donde ya estaba no es un movimiento de cero: `Orden.mover` con esos
     índices sí reordenaría, y el panel guardaría un cambio que nadie pidió. */
  prueba('soltar una fila sobre sí misma no pide ningún movimiento', function () {
    var movimientos = ArnesDom.conElemento('<ol></ol>', function (ol) {
      var vistos = [];
      pintarEn(proyectos(), function (desde, hasta) { vistos.push([desde, hasta]); })(ol);
      var f = ol.querySelectorAll('li.fila');
      arrastrar(f[1], 'dragstart');
      arrastrar(f[1], 'drop', mitad(f[1], false));
      return vistos;
    });
    igual(movimientos, []);
  });
});
