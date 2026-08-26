describe('El arnés', function () {
  prueba('igual acepta valores idénticos', function () {
    igual(2 + 2, 4);
  });

  prueba('igual compara en profundidad', function () {
    igual({ x: 1, y: [2, 3] }, { x: 1, y: [2, 3] });
  });

  prueba('igual rechaza valores distintos', function () {
    var lanzo = false;
    try { igual(1, 2); } catch (e) { lanzo = true; }
    cierto(lanzo, 'igual debería haber lanzado');
  });

  /* Las cinco de abajo vigilan el `replacer` de arnes.js. Sin él,
     `JSON.stringify` escribe `NaN`, `Infinity` y `-Infinity` como `null`, y
     entonces `igual(NaN, null)` pasa: cualquier prueba que compruebe «esto
     devuelve null cuando no hay resultado» seguiría en verde con el código
     devolviendo NaN. Ya ocurrió una vez, en una prueba de
     `Lista.indiceValido`, y sólo se vio al mutar la función.
     Si alguien quita el `replacer`, estas cinco caen. */
  function rechaza(actual, esperado) {
    try { igual(actual, esperado); } catch (e) { return true; }
    return false;
  }

  prueba('igual distingue NaN de null', function () {
    cierto(rechaza(NaN, null), 'NaN y null no son lo mismo');
  });

  prueba('igual distingue Infinity y -Infinity de null', function () {
    cierto(rechaza(Infinity, null), 'Infinity y null no son lo mismo');
    cierto(rechaza(-Infinity, null), '-Infinity y null no son lo mismo');
  });

  /* Anidado es donde nadie miraría, y es donde más fácil se cuela: basta con
     que una función devuelva una lista de coordenadas con una cuenta rota. */
  prueba('igual distingue los no finitos dentro de un array', function () {
    cierto(rechaza([NaN], [null]), '[NaN] y [null] no son lo mismo');
    cierto(rechaza([1, Infinity, 3], [1, null, 3]), 'en medio de un array');
  });

  prueba('igual distingue los no finitos dentro de un objeto', function () {
    cierto(rechaza({ x: NaN }, { x: null }), '{x:NaN} y {x:null} no son lo mismo');
    cierto(rechaza({ a: { b: -Infinity } }, { a: { b: null } }), 'anidado dos niveles');
  });

  /* La otra mitad del contrato: distinguirlos de `null` no puede costar que
     dejen de ser iguales a sí mismos, o el arreglo rompería comparaciones
     legítimas. */
  prueba('igual sigue dando por iguales dos no finitos iguales', function () {
    igual(NaN, NaN);
    igual(Infinity, Infinity);
    igual([NaN, 1], [NaN, 1]);
    cierto(rechaza(Infinity, -Infinity), 'Infinity y -Infinity son distintos');
  });
});
