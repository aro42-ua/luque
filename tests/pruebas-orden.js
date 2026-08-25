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
