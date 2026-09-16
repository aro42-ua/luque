/* Las flechas laterales del visor móvil. Lo que se puede comprobar sin un dedo
   y sin fotos: que cada salida enciende el chevrón del borde CONTRARIO, y que
   la que no lleva a ninguna parte se apaga.

   La prueba que más importa es la de la inversión. Un signo cambiado no da
   error, no rompe ninguna otra prueba y no se ve en local —donde toda foto da
   404—: se ve en producción, como un visor que señala hacia donde no hay
   nada. */

describe('MovilFlechas', function () {

  var MARCADO =
    '<div>' +
    '<div id="flIzquierda" hidden></div>' +
    '<div id="flDerecha" hidden></div>' +
    '</div>';

  function con(fn) {
    return ArnesDom.conElemento(MARCADO, function (caja) {
      var refs = {
        izquierda: caja.querySelector('#flIzquierda'),
        derecha:   caja.querySelector('#flDerecha')
      };
      MovilFlechas.init(refs);
      return fn(refs);
    });
  }

  /* Qué chevrones se ven, por su posición en la pantalla. */
  function visibles(refs) {
    return { izquierda: !refs.izquierda.hidden, derecha: !refs.derecha.hidden };
  }

  function salidas(cambios) {
    var s = { arriba: false, abajo: false, izquierda: false, derecha: false };
    Object.keys(cambios).forEach(function (k) { s[k] = cambios[k]; });
    return s;
  }

  // ---- La inversión -----------------------------------------------

  /* Deslizar a la izquierda trae el trabajo siguiente, así que el chevrón va
     en el borde DERECHO: apunta a donde está el contenido, como cualquier
     carrusel. */
  prueba('la salida «izquierda» enciende el chevrón de la derecha', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({ izquierda: true }));
      return visibles(refs);
    }), { izquierda: false, derecha: true });
  });

  prueba('la salida «derecha» enciende el chevrón de la izquierda', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({ derecha: true }));
      return visibles(refs);
    }), { izquierda: true, derecha: false });
  });

  /* La tabla, de una sola vez. Con los dos pares copiados mal igual, las dos
     fijaciones de arriba pasarían y ésta no. */
  prueba('los dos pares son contrarios', function () {
    igual(MovilFlechas.CONTRARIO, { izquierda: 'derecha', derecha: 'izquierda' });
  });

  /* El eje vertical no se pinta: las piezas ya las cuentan el contador y la
     tira. Si alguien añadiera claves al módulo sin añadir nodos, esto lo
     dejaría por escrito antes de que se colara media flecha. */
  prueba('el eje vertical no enciende ninguna flecha', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({ arriba: true, abajo: true }));
      return visibles(refs);
    }), { izquierda: false, derecha: false });
  });

  // ---- Encender y apagar ------------------------------------------

  prueba('en medio del portafolio se ven las dos', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({ izquierda: true, derecha: true }));
      return visibles(refs);
    }), { izquierda: true, derecha: true });
  });

  prueba('sin salidas no se ve ninguna', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({}));
      return visibles(refs);
    }), { izquierda: false, derecha: false });
  });

  /* Repintar es lo normal: el visor llama en CADA parada. Una flecha que se
     enciende y no se vuelve a apagar al llegar al extremo es exactamente la
     que miente. */
  prueba('lo que se encendió en una parada se apaga en la siguiente', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(salidas({ izquierda: true, derecha: true }));
      MovilFlechas.pintar(salidas({ derecha: true }));
      return visibles(refs);
    }), { izquierda: true, derecha: false });
  });

  /* Guarda de arranque: el visor pinta en cuanto se abre, y si algo llegara
     sin salidas el módulo no debe tirar la parada entera. */
  prueba('sin salidas que pintar no se cae', function () {
    igual(con(function (refs) {
      MovilFlechas.pintar(null);
      return visibles(refs);
    }), { izquierda: false, derecha: false });
  });
});
