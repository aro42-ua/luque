describe('parsearRuta', function () {
  var CATS = ['editorial', 'videoclip'];
  var IDS = ['bruma', 'humo'];

  function r(f) { return Router.parsearRuta(f, CATS, IDS); }

  prueba('sin fragmento devuelve todos', function () {
    igual(r(''), { tipo: 'todos', valor: null });
  });

  prueba('un fragmento vacío devuelve todos', function () {
    igual(r('#'), { tipo: 'todos', valor: null });
    igual(r('#/'), { tipo: 'todos', valor: null });
  });

  prueba('reconoce una categoría', function () {
    igual(r('#/editorial'), { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('reconoce un proyecto', function () {
    igual(r('#/bruma'), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('tolera que falte la barra', function () {
    igual(r('#editorial'), { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('tolera que falte la almohadilla', function () {
    igual(r('bruma'), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('la categoría gana al proyecto con el mismo nombre', function () {
    igual(Router.parsearRuta('#/editorial', ['editorial'], ['editorial']),
          { tipo: 'categoria', valor: 'editorial' });
  });

  prueba('un fragmento desconocido cae en todos', function () {
    igual(r('#/inventado'), { tipo: 'todos', valor: null });
  });

  prueba('ignora espacios sobrantes', function () {
    igual(r('#/  bruma  '), { tipo: 'proyecto', valor: 'bruma' });
  });

  prueba('no se rompe con null ni undefined', function () {
    igual(r(null), { tipo: 'todos', valor: null });
    igual(r(undefined), { tipo: 'todos', valor: null });
  });
});
