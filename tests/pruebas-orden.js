describe('Orden.mover', function () {
  function lista() { return ['a', 'b', 'c', 'd']; }

  prueba('mueve hacia abajo', function () {
    igual(Orden.mover(lista(), 0, 2), ['b', 'c', 'a', 'd']);
  });

  prueba('mueve hacia arriba', function () {
    igual(Orden.mover(lista(), 3, 1), ['a', 'd', 'b', 'c']);
  });

  prueba('mover a la misma posición no cambia nada', function () {
    igual(Orden.mover(lista(), 2, 2), ['a', 'b', 'c', 'd']);
  });

  /* La lista que se recibe no se toca: quien la pasó puede seguir usándola
     para comparar contra lo guardado y saber si hay cambios sin guardar. */
  prueba('no modifica la lista que recibe', function () {
    var original = lista();
    Orden.mover(original, 0, 3);
    igual(original, ['a', 'b', 'c', 'd']);
  });

  prueba('recorta los índices fuera de rango en vez de romperse', function () {
    igual(Orden.mover(lista(), 0, 99), ['b', 'c', 'd', 'a']);
    igual(Orden.mover(lista(), -5, 1), ['b', 'a', 'c', 'd']);
  });

  /* `desde` pasado del final se comprueba aparte porque es el único caso que
     `splice` NO salva por su cuenta: los dos de arriba pasarían aunque no se
     recortara nada. Con un `desde` en o por encima de `length`, `splice` no
     saca ningún elemento y devuelve `[]`, así que lo que se reinserta es
     `undefined` — la lista crece con un hueco fantasma en vez de reordenarse.
     Eso es corrupción silenciosa: la Tarea 4 compara la lista de trabajo con
     la guardada, y un hueco ahí no da error, da un proyecto sin identificador. */
  prueba('un `desde` en o pasado el final saca el último, no un hueco', function () {
    igual(Orden.mover(lista(), 99, 1), ['a', 'd', 'b', 'c']);
    igual(Orden.mover(lista(), 4, 1), ['a', 'd', 'b', 'c']);
  });

  prueba('una lista de uno o de ninguno no se rompe', function () {
    igual(Orden.mover(['solo'], 0, 1), ['solo']);
    igual(Orden.mover([], 0, 1), []);
  });
});

describe('Reordenar es componer', function () {
  /* El orden de la lista ES la composición: js/composicion.js reparte las
     ranuras por índice. Si alguien cambiara Orden.mover, la galería se
     recompondría sin que ninguna prueba de las dos piezas por separado se
     enterara — cada una seguiría siendo correcta por su cuenta. */
  function ranuraDe(lista, id) {
    var ranuras = window.Composicion.disponer(lista.length, 'amplio');
    return ranuras[lista.indexOf(id)];
  }

  prueba('mover un proyecto le cambia la ranura, y le da la del que ocupaba su sitio', function () {
    var antes = ['a', 'b', 'c', 'd'];
    var despues = window.Orden.mover(antes, 0, 3);
    igual(despues, ['b', 'c', 'd', 'a']);

    /* 'a' tenía la primera ranura y pasa a tener la cuarta: la misma que antes
       ocupaba 'd'. Son ranuras distintas —si no, mover no significaría nada—. */
    igual(ranuraDe(despues, 'a'), ranuraDe(antes, 'd'));
    cierto(ranuraDe(antes, 'a').x !== ranuraDe(despues, 'a').x ||
           ranuraDe(antes, 'a').y !== ranuraDe(despues, 'a').y,
           'si la ranura no cambia, reordenar no recompone nada');
  });

  prueba('lo que no se mueve conserva su ranura', function () {
    var antes = ['a', 'b', 'c', 'd'];
    var despues = window.Orden.mover(antes, 2, 3);   // sólo se cruzan c y d
    igual(ranuraDe(despues, 'a'), ranuraDe(antes, 'a'));
    igual(ranuraDe(despues, 'b'), ranuraDe(antes, 'b'));
  });
});
