window.Movil = (function () {

  /* El interruptor es el ANCHO y no el dedo. Una ventana de escritorio
     estrechada a 700px tampoco puede alojar un lienzo de 120vw: el problema es
     el espacio, no el puntero. El tipo de puntero decide otra cosa —qué gestos
     se enganchan— y eso no se mira aquí. Consecuencia que hay que tener
     presente aguas abajo: por esta consulta pasa un escritorio con ratón y
     teclado y sin pantalla táctil. */
  var CONSULTA = '(max-width: 860px)';

  var actual = null;

  function lado(coincide) { return coincide ? 'movil' : 'escritorio'; }

  /* Sólo hay cruce cuando el lado cambia de verdad. Sin esta comprobación,
     cualquier `change` repintaría, y repintar cuesta la posición del recorrido
     —lo que la spec pide conservar al girar el móvil— a cambio de nada. */
  function cruza(anterior, nuevo) { return anterior !== nuevo; }

  function llamar(lados) {
    var fn = lados[actual];
    /* Un lado sin función es legítimo: quien cablea puede querer sólo uno. Lo
       que no puede es que la falta tire abajo el interruptor entero. */
    if (fn) fn();
  }

  /* `consulta` se recibe y no se construye aquí, por el mismo motivo por el
     que `Brillo.decidir` recibe `medir` (js/brillo.js): lo que se inyecta se
     puede falsificar, y lo que se puede falsificar se puede probar. Una
     `window.matchMedia` de verdad exigiría redimensionar la ventana desde una
     prueba, que no se puede hacer. En producción se le pasa
     `window.matchMedia(Movil.CONSULTA)`. */
  function init(consulta, lados) {
    actual = lado(consulta.matches);
    llamar(lados);
    consulta.addEventListener('change', function (e) {
      var nuevo = lado(e.matches);
      if (!cruza(actual, nuevo)) return;
      actual = nuevo;
      llamar(lados);
    });
  }

  return {
    CONSULTA: CONSULTA,
    lado: lado,
    cruza: cruza,
    init: init,
    actual: function () { return actual; }
  };
})();
