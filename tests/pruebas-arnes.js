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
});
