/* Las tres piezas sin DOM de `panel/js/lista.js`. `pintar` no se prueba aquí:
   necesita el <ol> del panel. Se prueba en `tests/pruebas-lista-pintar.js`,
   con `ArnesDom.conElemento`.

   Por qué existen estas pruebas. `Orden.mover` NO se queja de un índice que no
   sea un número: `Math.max(0, NaN)` da `NaN` y `splice(NaN, …)` lo trata como
   0, así que reordena de verdad y en silencio. Y reordenar aquí es componer
   —`js/composicion.js` reparte las ranuras por índice—, de modo que un índice
   mal calculado recoloca la galería del estudio sin dar ningún error visible.
   Estas dos funciones son las que calculan ese índice a partir del DOM. */

describe('Lista.indiceValido', function () {
  prueba('convierte en número el texto que viene del dataset', function () {
    igual(window.Lista.indiceValido('0'), 0);
    igual(window.Lista.indiceValido('3'), 3);
    igual(window.Lista.indiceValido('12'), 12);
  });

  /* El cero es el índice de la primera fila y además es falso en un `if`. Si
     alguien cambiara la comprobación de `=== null` por un `if (!indice)`, la
     primera fila dejaría de poder arrastrarse y nada más se rompería: es el
     tipo de fallo que se descubre en producción y en una sola fila. */
  prueba('el cero es válido y no se confunde con la ausencia de índice', function () {
    igual(window.Lista.indiceValido('0'), 0);
    cierto(window.Lista.indiceValido('0') !== null, 'el cero tiene que ser un índice válido');
  });

  /* Un negativo es un índice válido para esta función: recortarlo es trabajo
     de `Orden.mover`, que ya tiene su propia prueba de que lo hace. */
  prueba('los negativos pasan; recortarlos es cosa de Orden.mover', function () {
    igual(window.Lista.indiceValido('-1'), -1);
  });

  /* Lo importante no es sólo que devuelva algo falso, es que NUNCA devuelva
     NaN: un NaN sí llegaría hasta `Orden.mover` y allí movería la fila al
     principio de la lista como si nada.

     Ojo con cómo se comprueba: aquí NO vale `igual`, porque compara con
     JSON.stringify y `JSON.stringify(NaN)` es la cadena "null", exactamente
     la misma que `JSON.stringify(null)`. Con `igual`, esta prueba —la única
     que vigila que el NaN no se escape— pasaría aunque la función devolviera
     NaN. Está comprobado mutando la función: con `igual` la mutación
     sobrevivía y con la identidad estricta de abajo cae. */
  prueba('lo que no es un número da null, nunca NaN', function () {
    var casos = [undefined, null, '', '   ', 'hola', 'abc12', {}, []];
    for (var i = 0; i < casos.length; i++) {
      var r = window.Lista.indiceValido(casos[i]);
      cierto(r === null,
             'con ' + JSON.stringify(casos[i]) + ' esperaba null y recibió ' + r);
    }
  });
});

describe('Lista.calcularHasta', function () {
  var LISTA = ['a', 'b', 'c', 'd', 'e'];

  /* Oráculo independiente: NO usa calcularHasta. Dice qué lista debe salir
     partiendo sólo del significado del gesto —«soltar antes/después de esta
     fila»—: se quita la fila movida, se busca dónde quedó el ancla y se
     inserta a un lado o al otro. Si calcularHasta y esto coinciden en las 40
     combinaciones, la aritmética es la correcta. */
  function esperado(lista, origen, destino, antes) {
    var movido = lista[origen];
    var ancla = lista[destino];
    var resto = lista.filter(function (x) { return x !== movido; });
    var pos = resto.indexOf(ancla);
    resto.splice(antes ? pos : pos + 1, 0, movido);
    return resto;
  }

  function alSoltar(lista, origen, destino, antes) {
    return window.Orden.mover(lista, origen, window.Lista.calcularHasta(origen, destino, antes));
  }

  /* 5 orígenes x 5 destinos x 2 mitades, menos los 10 casos de soltar sobre
     uno mismo (que `drop` descarta antes de llegar aquí) = 40. */
  prueba('las 40 combinaciones de una lista de cinco caen donde dice el ratón', function () {
    var combinaciones = 0;
    for (var origen = 0; origen < LISTA.length; origen++) {
      for (var destino = 0; destino < LISTA.length; destino++) {
        if (origen === destino) continue;
        for (var m = 0; m < 2; m++) {
          var antes = m === 0;
          combinaciones++;
          igual(alSoltar(LISTA, origen, destino, antes),
                esperado(LISTA, origen, destino, antes),
                'soltando la fila ' + origen + ' en la mitad de ' +
                (antes ? 'arriba' : 'abajo') + ' de la fila ' + destino);
        }
      }
    }
    igual(combinaciones, 40, 'tienen que salir 40 combinaciones');
  });

  /* El atajo del ratón y el camino de teclado tienen que llevar al mismo
     sitio: si divergen, el panel haría dos cosas distintas según cómo se
     pida la misma. */
  prueba('soltar en la mitad de abajo de la fila siguiente == botón bajar', function () {
    for (var i = 0; i < LISTA.length - 1; i++) {
      igual(alSoltar(LISTA, i, i + 1, false), window.Orden.mover(LISTA, i, i + 1),
            'en la fila ' + i);
    }
  });

  prueba('soltar en la mitad de arriba de la fila anterior == botón subir', function () {
    for (var i = 1; i < LISTA.length; i++) {
      igual(alSoltar(LISTA, i, i - 1, true), window.Orden.mover(LISTA, i, i - 1),
            'en la fila ' + i);
    }
  });

  prueba('arrastre largo hacia abajo: la primera fila al final', function () {
    igual(alSoltar(LISTA, 0, 4, false), ['b', 'c', 'd', 'e', 'a']);
    igual(alSoltar(LISTA, 0, 4, true), ['b', 'c', 'd', 'a', 'e']);
  });

  prueba('arrastre largo hacia arriba: la última fila al principio', function () {
    igual(alSoltar(LISTA, 4, 0, true), ['e', 'a', 'b', 'c', 'd']);
    igual(alSoltar(LISTA, 4, 0, false), ['a', 'e', 'b', 'c', 'd']);
  });

  /* Los dos gestos que apuntan al hueco que la fila ya ocupa. `drop` los corta
     comparando `hasta` con `origen`, pero la aritmética tiene que decirlo
     bien para que esa comparación signifique algo. */
  prueba('soltar en el hueco que la fila ya ocupaba la deja igual', function () {
    igual(window.Lista.calcularHasta(2, 1, false), 2, 'justo debajo de la fila de arriba');
    igual(window.Lista.calcularHasta(2, 3, true), 2, 'justo encima de la fila de abajo');
    igual(alSoltar(LISTA, 2, 1, false), LISTA);
    igual(alSoltar(LISTA, 2, 3, true), LISTA);
  });
});

describe('Lista.dentroDeLaCaja', function () {
  /* El rectángulo del <ol> del panel: va dentro de .panel{padding:2.5rem 1.5rem},
     debajo del <h1> y del aviso. */
  var OL = { left: 24, right: 424, top: 120, bottom: 222 };

  prueba('un punto en el centro está dentro', function () {
    cierto(window.Lista.dentroDeLaCaja(OL, 200, 170));
  });

  prueba('un punto fuera por cada uno de los cuatro lados', function () {
    cierto(!window.Lista.dentroDeLaCaja(OL, 10, 170), 'por la izquierda');
    cierto(!window.Lista.dentroDeLaCaja(OL, 500, 170), 'por la derecha');
    cierto(!window.Lista.dentroDeLaCaja(OL, 200, 40), 'por arriba');
    cierto(!window.Lista.dentroDeLaCaja(OL, 200, 400), 'por abajo');
  });

  /* Es la razón de ser de la comprobación por coordenadas: cuando el puntero
     sale de la ventana el navegador manda (0,0) y `relatedTarget` en null, y
     la marca de inserción tiene que limpiarse. Cae fuera por el eje X —el <ol>
     nunca empieza antes de los 24px por el padding del panel—. */
  prueba('el (0,0) de salir de la ventana cae fuera del <ol> del panel', function () {
    cierto(!window.Lista.dentroDeLaCaja(OL, 0, 0));
  });
});
