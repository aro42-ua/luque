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

  prueba('un proyecto que no existe cae en todos, aunque traiga segundo tramo', function () {
    igual(r('#/inventado/3'), { tipo: 'todos', valor: null, pieza: null });
  });

  /* Sin `hasOwnProperty`, las claves del prototipo se tomarían por proyectos.
     Esta prueba muere si alguien cambia la comprobación por `in` o por un
     acceso directo al mapa. */
  prueba('una clave del prototipo no es un proyecto', function () {
    igual(r('#/constructor'), { tipo: 'todos', valor: null, pieza: null });
    igual(r('#/toString/1'), { tipo: 'todos', valor: null, pieza: null });
  });
});

describe('decidir', function () {
  function d(hashActual, tipo, valor, pieza) {
    return Router.decidir(hashActual, { tipo: tipo, valor: valor, pieza: pieza });
  }

  // ---- El hash que se construye ------------------------------------

  prueba('la portada general no tiene hash', function () {
    igual(d('#/bruma', 'todos', null, null).hash, '');
  });

  prueba('una categoría es un solo tramo', function () {
    igual(d('', 'categoria', 'editorial', null).hash, '#/editorial');
  });

  prueba('un proyecto sin pieza es un solo tramo', function () {
    igual(d('', 'proyecto', 'bruma', null).hash, '#/bruma');
  });

  prueba('un proyecto con pieza lleva el número en el segundo tramo', function () {
    igual(d('', 'proyecto', 'bruma', 3).hash, '#/bruma/3');
  });

  prueba('la ficha va en el segundo tramo como palabra', function () {
    igual(d('', 'proyecto', 'bruma', 'ficha').hash, '#/bruma/ficha');
  });

  // ---- Qué se hace con el historial --------------------------------

  /* La regla que existe este bloque para traer: si cada deslizamiento empujara
     una entrada, salir de un proyecto de ocho fotos exigiría ocho «atrás». */
  prueba('cambiar de foto dentro del mismo proyecto reemplaza', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 4).accion, 'reemplazar');
  });

  prueba('y también al abrir la ficha del proyecto en el que ya estás', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 'ficha').accion, 'reemplazar');
  });

  prueba('y al volver de la ficha a una foto', function () {
    igual(d('#/bruma/ficha', 'proyecto', 'bruma', 2).accion, 'reemplazar');
  });

  /* En cambio cambiar de proyecto sí empuja: es el salto que quien mira espera
     poder deshacer con «atrás». */
  prueba('cambiar de proyecto empuja', function () {
    igual(d('#/bruma/3', 'proyecto', 'humo', null).accion, 'empujar');
  });

  prueba('entrar en un proyecto desde la portada empuja', function () {
    igual(d('', 'proyecto', 'bruma', null).accion, 'empujar');
  });

  prueba('filtrar por categoría empuja', function () {
    igual(d('', 'categoria', 'editorial', null).accion, 'empujar');
  });

  /* Esto no es nuevo: es lo que hace hoy js/router.js:23, y se prueba aquí
     porque hasta ahora no lo cubría nada. */
  prueba('volver a la portada general reemplaza, como hoy', function () {
    igual(d('#/bruma', 'todos', null, null).accion, 'reemplazar');
  });

  /* Tampoco es nuevo: js/router.js:27-28. Sin esta rama, pulsar la categoría
     en la que ya estás no avisaría a nadie y la galería se quedaría quieta. */
  prueba('ir a donde ya estás no toca el historial, sólo avisa', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 3).accion, 'avisar');
    igual(d('#/editorial', 'categoria', 'editorial', null).accion, 'avisar');
  });

  prueba('y estar ya en la portada general también sólo avisa', function () {
    igual(d('', 'todos', null, null).accion, 'avisar');
  });

  /* El hash de verdad puede venir sin barra o con espacios; comparar en crudo
     haría que «ya estoy aquí» fallara y se empujara una entrada de más. */
  prueba('comparar dónde estás no depende de cómo esté escrito el hash', function () {
    igual(d('#bruma', 'proyecto', 'bruma', null).accion, 'avisar');
    igual(d('bruma', 'proyecto', 'bruma', null).accion, 'avisar');
  });
});
