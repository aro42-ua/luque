describe('MovilRecorrido', function () {

  /* Mezcla deliberada: dos proyectos de fotos con distinto número de piezas y
     dos de vídeo con cero, y uno de los de vídeo es el último de la lista. Así
     el borde del eje horizontal y el caso de las cero piezas caen en la misma
     fijación en vez de necesitar dos. */
  var ORDEN = [
    { id: 'niebla',  piezas: 6 },
    { id: 'bruma',   piezas: 8 },
    { id: 'reflejo', piezas: 0 },
    { id: 'litoral', piezas: 0 }
  ];

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  // ---- Las paradas del eje vertical -------------------------------

  prueba('un proyecto de fotos se recorre por sus piezas y acaba en la ficha', function () {
    igual(MovilRecorrido.paradas(3), [1, 2, 3, 'ficha']);
  });

  /* La razón de ser del diseño de dos ejes: seis de los doce proyectos son de
     vídeo. Si el eje vertical significara «más fotos», el gesto no haría nada
     en la mitad del portafolio. */
  prueba('un proyecto de vídeo tiene el propio vídeo y la ficha, nada más', function () {
    igual(MovilRecorrido.paradas(0), [null, 'ficha']);
  });

  prueba('las piezas se numeran desde 1, no desde 0', function () {
    igual(MovilRecorrido.paradas(2)[0], 1);
  });

  /* El borde exacto entre fotos y vídeo, sin fijar hasta ahora: la rejilla usa
     6, 8, 0 y 0 piezas, y ninguna prueba de `paradas` pasaba 1. Con
     `cuantasPiezas >= 1` mutado a `> 1` o a `>= 2`, `paradas(1)` da
     `[null, 'ficha']` en vez de `[1, 'ficha']` — un proyecto de una sola foto
     se trataría como vídeo. */
  prueba('un proyecto de una sola foto tiene una parada, no ninguna', function () {
    igual(MovilRecorrido.paradas(1), [1, 'ficha']);
  });

  // ---- El estado inicial ------------------------------------------

  prueba('el estado inicial es el primer proyecto por su primera parada', function () {
    igual(MovilRecorrido.inicial(ORDEN), en('niebla', 1));
  });

  /* En la rejilla `ORDEN` de arriba el primer proyecto siempre es de fotos, así
     que `paradas(orden[0].piezas)[0]` podría sustituirse por el literal `1`
     sin que ninguna prueba lo note. Con un vídeo primero, el literal estaría
     mal: la primera parada es `null`, no `1`. */
  prueba('cuando el primero de la rejilla es un vídeo, el inicial es su vídeo', function () {
    var conVideoPrimero = [{ id: 'reflejo', piezas: 0 }, { id: 'niebla', piezas: 6 }];
    igual(MovilRecorrido.inicial(conVideoPrimero), en('reflejo', null));
  });

  prueba('sin proyectos, el estado inicial no inventa ninguno', function () {
    igual(MovilRecorrido.inicial([]), en(null, null));
  });

  // ---- El eje vertical --------------------------------------------

  prueba('bajar en un proyecto de vídeo llega a la ficha en UN solo gesto', function () {
    igual(MovilRecorrido.mover(en('reflejo', null), 'arriba', ORDEN), en('reflejo', 'ficha'));
  });

  prueba('bajar en un proyecto de fotos pasa a la pieza siguiente', function () {
    igual(MovilRecorrido.mover(en('bruma', 3), 'arriba', ORDEN), en('bruma', 4));
  });

  prueba('la ficha está detrás de la última pieza, no antes', function () {
    igual(MovilRecorrido.mover(en('bruma', 8), 'arriba', ORDEN), en('bruma', 'ficha'));
  });

  prueba('la ficha es el fondo del eje: bajar desde ella no lleva a ningún sitio', function () {
    igual(MovilRecorrido.mover(en('bruma', 'ficha'), 'arriba', ORDEN), en('bruma', 'ficha'));
  });

  prueba('subir devuelve a la pieza anterior', function () {
    igual(MovilRecorrido.mover(en('bruma', 4), 'abajo', ORDEN), en('bruma', 3));
  });

  prueba('subir desde la primera parada no sale por arriba', function () {
    igual(MovilRecorrido.mover(en('bruma', 1), 'abajo', ORDEN), en('bruma', 1));
    igual(MovilRecorrido.mover(en('reflejo', null), 'abajo', ORDEN), en('reflejo', null));
  });

  /* «El eje nunca se queda sin respuesta» (spec, línea 50). Se comprueba sobre
     los cuatro proyectos, no sobre uno: es una propiedad de todos. */
  prueba('desde cualquier proyecto se llega a la ficha bajando', function () {
    ORDEN.forEach(function (p) {
      var e = en(p.id, MovilRecorrido.paradas(p.piezas)[0]);
      for (var i = 0; i < 20; i++) e = MovilRecorrido.mover(e, 'arriba', ORDEN);
      igual(e.pieza, 'ficha', 'en ' + p.id + ' no se llegó a la ficha');
    });
  });

  // ---- El eje horizontal ------------------------------------------

  prueba('deslizar a la izquierda trae el proyecto siguiente', function () {
    igual(MovilRecorrido.mover(en('niebla', 1), 'izquierda', ORDEN), en('bruma', 1));
  });

  prueba('deslizar a la derecha trae el anterior', function () {
    igual(MovilRecorrido.mover(en('bruma', 1), 'derecha', ORDEN), en('niebla', 1));
  });

  prueba('en el último proyecto, seguir hacia delante no sale al vacío', function () {
    igual(MovilRecorrido.mover(en('litoral', 'ficha'), 'izquierda', ORDEN), en('litoral', 'ficha'));
  });

  prueba('en el primero, seguir hacia atrás no sale al vacío', function () {
    igual(MovilRecorrido.mover(en('niebla', 4), 'derecha', ORDEN), en('niebla', 4));
  });

  /* Sin esto se podría acabar en la pieza 7 de un proyecto que tiene 5, o en
     una pieza numerada dentro de un vídeo que no tiene ninguna. */
  prueba('cambiar de proyecto empieza por la primera parada del nuevo', function () {
    igual(MovilRecorrido.mover(en('bruma', 7), 'izquierda', ORDEN), en('reflejo', null));
    igual(MovilRecorrido.mover(en('bruma', 'ficha'), 'derecha', ORDEN), en('niebla', 1));
  });

  // ---- El puente con el router ------------------------------------

  prueba('desdeRuta traduce una ruta con su pieza', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: 3 }, ORDEN),
          en('bruma', 3));
  });

  prueba('desdeRuta con la ficha la respeta', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: 'ficha' }, ORDEN),
          en('reflejo', 'ficha'));
  });

  prueba('una ruta sin segundo tramo abre por la primera parada', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: null }, ORDEN),
          en('bruma', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: null }, ORDEN),
          en('reflejo', null));
  });

  /* La regla de la spec (líneas 238-240): una pieza que no existe cae al
     proyecto por su portada, NO a la portada general. Conserva lo que el
     enlace sí traía bien. */
  prueba('una pieza fuera de rango cae al proyecto, no a la portada general', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: 99 }, ORDEN),
          en('bruma', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: 2 }, ORDEN),
          en('reflejo', null));
  });

  prueba('una ruta que no es de proyecto da el estado inicial', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'todos', valor: null, pieza: null }, ORDEN),
          en('niebla', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'categoria', valor: 'editorial', pieza: null }, ORDEN),
          en('niebla', 1));
  });

  prueba('un proyecto que no está en el orden da el estado inicial', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'fantasma', pieza: 2 }, ORDEN),
          en('niebla', 1));
  });

  prueba('aRuta devuelve la forma exacta que entiende el router', function () {
    igual(MovilRecorrido.aRuta(en('bruma', 3)),
          { tipo: 'proyecto', valor: 'bruma', pieza: 3 });
    igual(MovilRecorrido.aRuta(en('reflejo', null)),
          { tipo: 'proyecto', valor: 'reflejo', pieza: null });
  });

  /* Ida y vuelta: lo que sale de aRuta tiene que volver a entrar por desdeRuta
     y dar lo mismo. Si alguna de las dos se desvía, la URL y la pantalla
     dejarían de decir lo mismo, y eso no se descubre hasta compartir un
     enlace. */
  prueba('aRuta y desdeRuta se deshacen la una a la otra', function () {
    [en('niebla', 1), en('bruma', 8), en('bruma', 'ficha'),
     en('reflejo', null), en('litoral', 'ficha')].forEach(function (e) {
      igual(MovilRecorrido.desdeRuta(MovilRecorrido.aRuta(e), ORDEN), e,
            'no sobrevivió la ida y vuelta: ' + JSON.stringify(e));
    });
  });

  // ---- Higiene ----------------------------------------------------

  prueba('un gesto que no se reconoce no mueve nada', function () {
    igual(MovilRecorrido.mover(en('bruma', 3), 'diagonal', ORDEN), en('bruma', 3));
    igual(MovilRecorrido.mover(en('bruma', 3), '', ORDEN), en('bruma', 3));
  });

  prueba('una pieza que no está en el eje no mueve nada', function () {
    igual(MovilRecorrido.mover(en('bruma', 99), 'arriba', ORDEN), en('bruma', 99));
    igual(MovilRecorrido.mover(en('reflejo', 3), 'abajo', ORDEN), en('reflejo', 3));
  });

  prueba('un proyecto que no está en el orden no se mueve', function () {
    igual(MovilRecorrido.mover(en('fantasma', 1), 'arriba', ORDEN), en('fantasma', 1));
  });

  /* Se comprueba DESPUÉS DE CADA llamada, no al final de las cuatro. Con una
     sola comprobación al final, una mutación que moviera `estado.pieza` se
     tapaba sola: 'arriba' la subía a 4 y 'abajo' la devolvía a 3, así que la
     prueba pasaba con el estado mutado dos veces. Medido, no supuesto. */
  prueba('ninguna función modifica el estado que recibe', function () {
    ['arriba', 'abajo', 'izquierda', 'derecha'].forEach(function (g) {
      var e = en('bruma', 3);
      MovilRecorrido.mover(e, g, ORDEN);
      igual(e, en('bruma', 3), 'mover(«' + g + '») cambió el estado que recibió');
    });
    var f = en('bruma', 3);
    MovilRecorrido.aRuta(f);
    igual(f, en('bruma', 3), 'aRuta cambió el estado que recibió');
  });

  /* Con su propia lista, no con ORDEN. Comparar ORDEN contra una copia tomada
     aquí no detecta nada: si otra prueba de más arriba ya lo hubiera
     estropeado, la copia saldría del estropicio. */
  prueba('tampoco modifica el orden que recibe', function () {
    var propio = [{ id: 'uno', piezas: 2 }, { id: 'dos', piezas: 0 }];
    var copia = JSON.parse(JSON.stringify(propio));
    MovilRecorrido.inicial(propio);
    MovilRecorrido.mover(en('uno', 1), 'izquierda', propio);
    MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'uno', pieza: 2 }, propio);
    igual(propio, copia, 'el orden original ha cambiado');
  });

  // ---- El botón de ficha ------------------------------------------

  /* El botón de la Tarea 2 no decide nada por su cuenta: le pregunta aquí.
     La función es pura y recibe la pieza recordada como argumento, porque
     este módulo no guarda nada entre llamadas — quien recuerda es
     `MovilVisor`. */

  prueba('desde una pieza, el botón lleva a la ficha', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 3), ORDEN, null),
          en('bruma', 'ficha'));
  });

  prueba('desde la ficha, el botón vuelve a la pieza recordada', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 3),
          en('bruma', 3));
  });

  /* El caso del enlace en frío a `#/bruma/ficha`: nunca hubo pieza anterior,
     así que no hay nada que recordar. Se cae a la primera parada, que es lo
     que ya hace `desdeRuta` con una pieza que no existe: conserva el
     proyecto, que es lo que el enlace sí traía bien. */
  prueba('sin pieza recordada vuelve a la primera parada', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, null),
          en('bruma', 1));
  });

  /* `bruma` tiene 8 piezas. Una recordada de 9 sería basura —de una lista
     anterior, de una URL a mano— y llevaría a una parada que no existe. */
  prueba('una recordada que no es parada de ese proyecto se ignora', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 9),
          en('bruma', 1));
  });

  /* `indexOf('ficha')` NO es -1: 'ficha' es una parada del eje. Sin la guarda
     explícita, una recordada de 'ficha' devolvería la ficha estando ya en la
     ficha y el botón no haría nada, que es exactamente el callejón sin
     salida que este bloque viene a arreglar. */
  prueba('una recordada de «ficha» no deja el botón muerto', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 'ficha'),
          en('bruma', 1));
  });

  /* En un proyecto de vídeo la primera parada es `null` —el propio vídeo—, no
     la pieza 1, que no existe. */
  prueba('en un vídeo, volver de la ficha lleva al vídeo', function () {
    igual(MovilRecorrido.alternarFicha(en('reflejo', 'ficha'), ORDEN, null),
          en('reflejo', null));
  });

  prueba('un proyecto que no está en el orden no se mueve', function () {
    igual(MovilRecorrido.alternarFicha(en('fantasma', 2), ORDEN, null),
          en('fantasma', 2));
  });
});
