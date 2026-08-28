describe('ArnesDom.conElemento', function () {

  prueba('pasa a fn el primer elemento del html', function () {
    var etiqueta = ArnesDom.conElemento('<ol id="x"></ol>', function (el) {
      return el.tagName;
    });
    igual(etiqueta, 'OL');
  });

  /* Los nodos de prueba tienen que estar DENTRO del documento, no sueltos:
     focus() no hace nada sobre un nodo desconectado y getBoundingClientRect()
     devuelve ceros. panel.js devuelve el foco tras repintar y lista.js mide la
     caja de la fila para decidir si se suelta antes o después, así que un nodo
     suelto daría verde sin comprobar nada de eso. */
  prueba('el elemento está conectado al documento mientras corre fn', function () {
    var conectado = ArnesDom.conElemento('<ol></ol>', function (el) {
      return document.contains(el);
    });
    cierto(conectado, 'sin esto, focus() y las medidas no funcionan');
  });

  prueba('tiene medidas reales, no ceros', function () {
    var ancho = ArnesDom.conElemento('<ol style="width:120px"></ol>', function (el) {
      return el.getBoundingClientRect().width;
    });
    cierto(ancho > 0, 'un nodo suelto mediría 0 y las pruebas de arrastre serían falsas');
  });

  prueba('se puede enfocar un botón de dentro', function () {
    var enfocado = ArnesDom.conElemento('<div><button id="b">x</button></div>', function (el) {
      var b = el.querySelector('#b');
      b.focus();
      return document.activeElement === b;
    });
    cierto(enfocado, 'sin esto no se puede probar la vuelta del foco de panel.js');
  });

  prueba('quita el contenedor al terminar', function () {
    ArnesDom.conElemento('<ol class="rastro"></ol>', function () {});
    igual(document.querySelectorAll('.rastro').length, 0);
  });

  /* La limpieza en `finally` es lo que impide que una prueba que falla deje
     basura en el documento y contamine a las siguientes. */
  prueba('quita el contenedor aunque fn lance', function () {
    var hubo = false;
    try {
      ArnesDom.conElemento('<ol class="rastro2"></ol>', function () {
        throw new Error('a propósito');
      });
    } catch (e) { hubo = true; }
    cierto(hubo, 'el error tiene que propagarse, no tragarse');
    igual(document.querySelectorAll('.rastro2').length, 0);
  });

  prueba('devuelve lo que devuelve fn', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function () { return 42; }), 42);
  });
});
