describe('parsearRuta', function () {
  var CATS = ['editorial', 'videoclip'];
  /* Las claves son los proyectos que existen; el valor, cuántas piezas tiene
     cada uno. `humo` es de vídeo: cero piezas, pero su ficha sigue existiendo. */
  var PIEZAS = { bruma: 8, humo: 0 };

  function r(f) { return Router.parsearRuta(f, CATS, PIEZAS); }

  prueba('sin fragmento devuelve todos', function () {
    igual(r(''), { tipo: 'todos', valor: null, pieza: null });
  });

  prueba('un fragmento vacío devuelve todos', function () {
    igual(r('#'), { tipo: 'todos', valor: null, pieza: null });
    igual(r('#/'), { tipo: 'todos', valor: null, pieza: null });
  });

  prueba('reconoce una categoría', function () {
    igual(r('#/editorial'), { tipo: 'categoria', valor: 'editorial', pieza: null });
  });

  prueba('reconoce un proyecto', function () {
    igual(r('#/bruma'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('tolera que falte la barra', function () {
    igual(r('#editorial'), { tipo: 'categoria', valor: 'editorial', pieza: null });
  });

  prueba('tolera que falte la almohadilla', function () {
    igual(r('bruma'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('la categoría gana al proyecto con el mismo nombre', function () {
    igual(Router.parsearRuta('#/editorial', ['editorial'], { editorial: 4 }),
          { tipo: 'categoria', valor: 'editorial', pieza: null });
  });

  prueba('un fragmento desconocido cae en todos', function () {
    igual(r('#/inventado'), { tipo: 'todos', valor: null, pieza: null });
  });

  prueba('ignora espacios sobrantes', function () {
    igual(r('#/  bruma  '), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('no se rompe con null ni undefined', function () {
    igual(r(null), { tipo: 'todos', valor: null, pieza: null });
    igual(r(undefined), { tipo: 'todos', valor: null, pieza: null });
  });

  prueba('una pieza numerada se entiende', function () {
    igual(r('#/bruma/3'), { tipo: 'proyecto', valor: 'bruma', pieza: 3 });
  });

  /* Se numeran desde 1 porque es lo que ve quien mira en el contador «02/08».
     Un índice desde 0 obligaría a sumar y restar uno en cada frontera, y esa
     es exactamente la clase de resta que se olvida en un sitio. */
  prueba('las piezas se numeran desde 1, así que 1 es la primera', function () {
    igual(r('#/bruma/1'), { tipo: 'proyecto', valor: 'bruma', pieza: 1 });
  });

  prueba('la última pieza cabe', function () {
    igual(r('#/bruma/8'), { tipo: 'proyecto', valor: 'bruma', pieza: 8 });
  });

  prueba('la ficha es un tramo con nombre, no un número', function () {
    igual(r('#/bruma/ficha'), { tipo: 'proyecto', valor: 'bruma', pieza: 'ficha' });
  });

  prueba('un número por encima del total cae a la portada del proyecto', function () {
    igual(r('#/bruma/9'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('el cero no es una pieza, porque se cuenta desde 1', function () {
    igual(r('#/bruma/0'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un negativo y un decimal tampoco son piezas', function () {
    igual(r('#/bruma/-2'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
    igual(r('#/bruma/2.5'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un tramo que no se entiende cae a la portada del proyecto', function () {
    igual(r('#/bruma/loquesea'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un tercer tramo invalida la pieza, no el proyecto', function () {
    igual(r('#/bruma/3/sobra'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  /* Un proyecto de vídeo tiene cero piezas: cualquier número se pasa de rango. */
  prueba('en un proyecto de vídeo ningún número es una pieza', function () {
    igual(r('#/humo/1'), { tipo: 'proyecto', valor: 'humo', pieza: null });
  });

  /* Pero la ficha sí: es el fondo del eje vertical y existe para los doce. */
  prueba('la ficha vale también en un proyecto de vídeo', function () {
    igual(r('#/humo/ficha'), { tipo: 'proyecto', valor: 'humo', pieza: 'ficha' });
  });

  /* Conserva lo que el enlace sí traía bien, en vez de tirarlo todo. */
  prueba('una categoría ignora el segundo tramo en vez de caer a todos', function () {
    igual(r('#/editorial/3'), { tipo: 'categoria', valor: 'editorial', pieza: null });
  });

  /* Sin `hasOwnProperty`, las claves del prototipo se tomarían por proyectos.
     Esta prueba muere si alguien cambia la comprobación por `in` o por un
     acceso directo al mapa. */
  prueba('una clave del prototipo no es un proyecto', function () {
    igual(r('#/constructor'), { tipo: 'todos', valor: null, pieza: null });
    igual(r('#/toString/1'), { tipo: 'todos', valor: null, pieza: null });
  });
});
