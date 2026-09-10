describe('MovilZoom', function () {

  /* La caja es la de la foto PINTADA, no la de la pantalla ni la del archivo:
     con `object-fit: contain` la foto deja franjas, y acotar contra la pantalla
     dejaría despegarse el borde justo el ancho de esas franjas. */
  var CAJA = { ancho: 400, alto: 500 };

  function p(x, y) { return { x: x, y: y }; }

  // ---- El punto de partida ----------------------------------------

  prueba('el estado inicial es el encaje: escala 1 y sin desplazar', function () {
    igual(MovilZoom.inicial(), { escala: 1, x: 0, y: 0 });
  });

  prueba('el encaje no cuenta como ampliado', function () {
    igual(MovilZoom.ampliado(MovilZoom.inicial()), false);
  });

  // ---- El tope ----------------------------------------------------

  /* «Hasta los píxeles reales del archivo» de la spec: el tope natural es
     cuántas veces cabe la foto pintada dentro del archivo. */
  prueba('el tope es 1:1 con los pixeles del archivo', function () {
    igual(MovilZoom.maxEscala(1200, 400), 3);
  });

  /* Con los archivos de 3000px del contenido real y un movil de 390px salen
     7,7x, y a esa escala el gesto no tiene final util: la foto se pierde. */
  prueba('el tope no pasa de 6x aunque el archivo de para mas', function () {
    igual(MovilZoom.maxEscala(3000, 390), 6);
  });

  prueba('una foto mas pequena que su caja no se puede ampliar', function () {
    igual(MovilZoom.maxEscala(200, 400), 1);
  });

  /* Una <img> sin cargar tiene naturalWidth 0, y una escena oculta mide 0 de
     ancho. Sin esta guarda saldria Infinity o NaN, y `Math.min(NaN, 6)` es NaN:
     la foto se quedaria con un transform invalido y sin un solo error. */
  prueba('medidas imposibles dan el tope 1, no NaN ni Infinity', function () {
    igual([MovilZoom.maxEscala(3000, 0), MovilZoom.maxEscala(0, 400)], [1, 1]);
  });

  // ---- El pellizco ------------------------------------------------

  prueba('separar los dedos al doble amplia al doble', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 200, 4, CAJA).escala, 2);
  });

  prueba('el pellizco no pasa del tope', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 1000, 4, CAJA).escala, 4);
  });

  /* Por debajo de 1 no se encoge: la foto ya esta encajada en la pantalla y
     empequenecerla dejaria un marco negro que nadie ha pedido. */
  prueba('juntar los dedos no encoge por debajo del encaje', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 200, 20, 4, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('una distancia de cero no mueve el estado ni lo ensucia', function () {
    var base = { escala: 2, x: 10, y: 10 };
    igual(MovilZoom.pellizcar(base, 0, 100, 4, CAJA), base);
  });

  // ---- El paseo ---------------------------------------------------

  prueba('ampliada, el dedo pasea la foto', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 30, -40, CAJA),
          { escala: 2, x: 30, y: -40 });
  });

  /* Al doble, sobra la mitad de la caja: 400*2-400 = 400, repartidos entre los
     dos lados son 200. Un dedo que empuje mas alla de eso despegaria el borde
     de la foto del marco, y el visor ensenaria fondo negro por un lado. */
  prueba('el paseo no despega el borde de la foto del marco', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 9999, 9999, CAJA),
          { escala: 2, x: 200, y: 250 });
  });

  prueba('sin ampliar el dedo no pasea: ese gesto es para navegar', function () {
    igual(MovilZoom.arrastrar(MovilZoom.inicial(), 50, 50, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('volver al encaje olvida el paseo', function () {
    igual(MovilZoom.pellizcar({ escala: 3, x: 120, y: 90 }, 300, 10, 4, CAJA),
          { escala: 1, x: 0, y: 0 });
  });

  // ---- Lo que consume quien pinta ---------------------------------

  prueba('la distancia entre dos dedos es la euclidea', function () {
    igual(MovilZoom.distancia(p(0, 0), p(3, 4)), 5);
  });

  /* El orden importa y es el que espera el CSS: primero traslada en pixeles
     sin escalar, luego escala. Al reves, el desplazamiento se multiplicaria
     por la escala y el acotado de arriba estaria midiendo otra cosa. */
  prueba('el transform traslada antes de escalar', function () {
    igual(MovilZoom.transformar({ escala: 2, x: 30, y: -40 }),
          'translate(30px, -40px) scale(2)');
  });
});
