describe('MovilZoom', function () {

  /* `medidas.foto` y `medidas.marco` son iguales a propósito en toda esta
     sección: lo que se comprueba aquí es el pellizco y el paseo en sí, no de
     qué caja sale el acotado, e igualarlas aísla lo uno de lo otro. Acotar
     contra el MARCO —la pantalla— es justo lo que mantiene el borde de la
     foto pegado a ella; acotar contra la propia foto sin ampliar —el defecto
     que este cambio reemplaza— la habría dejado despegarse el ancho de las
     franjas que deja `object-fit: contain`. Esa distinción, con `foto` y
     `marco` DISTINTOS, tiene sus propias pruebas más abajo, en «El acotado
     mide contra el marco, no contra la foto». */
  var MEDIDAS = { foto: { ancho: 400, alto: 500 }, marco: { ancho: 400, alto: 500 } };

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

  /* Con los archivos de 2400px de ANCHO del contenido real —que es lo que
     `maxEscala` recibe, ver el comentario de TOPE mas arriba— y un movil de
     390px salen 6,15x, y a esa escala el gesto ya no tiene final util: la
     foto se pierde. */
  prueba('el tope no pasa de 6x aunque el archivo de para mas', function () {
    igual(MovilZoom.maxEscala(2400, 390), 6);
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
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 200, 4, MEDIDAS).escala, 2);
  });

  prueba('el pellizco no pasa del tope', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 100, 1000, 4, MEDIDAS).escala, 4);
  });

  /* Por debajo de 1 no se encoge: la foto ya esta encajada en la pantalla y
     empequenecerla dejaria un marco negro que nadie ha pedido. */
  prueba('juntar los dedos no encoge por debajo del encaje', function () {
    igual(MovilZoom.pellizcar(MovilZoom.inicial(), 200, 20, 4, MEDIDAS),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('una distancia de cero no mueve el estado ni lo ensucia', function () {
    var base = { escala: 2, x: 10, y: 10 };
    igual(MovilZoom.pellizcar(base, 0, 100, 4, MEDIDAS), base);
  });

  // ---- El paseo ---------------------------------------------------

  prueba('ampliada, el dedo pasea la foto', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 30, -40, MEDIDAS),
          { escala: 2, x: 30, y: -40 });
  });

  /* Con una pieza 2400x3000 pintada en una pantalla de 390x844 —`object-fit:
     contain`— la foto sale a 390x488: llena el ancho y deja franjas de alto.
     En el ancho, foto y marco COINCIDEN (390 y 390) y el acotado vale igual
     que la formula de siempre: al doble sobran 195 por lado. En el alto NO
     coinciden: al doble sobran (488*2-844)/2 = 66, muy lejos de los 244 que
     saldrian de medir contra la propia foto, (488*2-488)/2. Midiendo contra
     el MARCO es como el borde de la foto se queda pegado a el en los dos
     ejes, que es justo lo que promete el nombre de esta prueba. */
  var MARCO_MOVIL = { foto: { ancho: 390, alto: 488 }, marco: { ancho: 390, alto: 844 } };

  prueba('el paseo no despega el borde de la foto del marco', function () {
    igual(MovilZoom.arrastrar({ escala: 2, x: 0, y: 0 }, 9999, 9999, MARCO_MOVIL),
          { escala: 2, x: 195, y: 66 });
  });

  /* A 1,2x la foto (488 de alto) todavia cabe entera dentro del marco (844):
     488*1,2 = 585,6, menos que 844. No hay NADA que revelar por ese eje, asi
     que el maximo correcto es 0 y no los ~48px que saldrian de medir contra
     la propia foto —el defecto que este cambio corrige—. */
  prueba('a 1,2x la foto aun cabe entera de alto: no hay nada que pasear', function () {
    igual(MovilZoom.arrastrar({ escala: 1.2, x: 0, y: 0 }, 9999, 9999, MARCO_MOVIL),
          { escala: 1.2, x: 39, y: 0 });
  });

  prueba('sin ampliar el dedo no pasea: ese gesto es para navegar', function () {
    igual(MovilZoom.arrastrar(MovilZoom.inicial(), 50, 50, MEDIDAS),
          { escala: 1, x: 0, y: 0 });
  });

  prueba('volver al encaje olvida el paseo', function () {
    igual(MovilZoom.pellizcar({ escala: 3, x: 120, y: 90 }, 300, 10, 4, MEDIDAS),
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
