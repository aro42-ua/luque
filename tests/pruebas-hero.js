describe('Hero.debeSaltarse', function () {
  prueba('un proyecto se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'proyecto', valor: 'bruma' }), true);
  });

  prueba('una categoría se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'categoria', valor: 'editorial' }), true);
  });

  prueba('sin ruta se muestra el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'todos', valor: null }), false);
  });

  prueba('no se rompe sin argumento', function () {
    igual(Hero.debeSaltarse(undefined), false);
    igual(Hero.debeSaltarse(null), false);
  });

  prueba('un tipo desconocido no se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'inventado', valor: 'x' }), false);
  });
});
