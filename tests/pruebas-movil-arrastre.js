/* El arrastre de la hoja. Puro: sin DOM y sin reloj, así que no necesita el
   arnés de DOM. El tiempo entra como argumento en cada llamada — es lo que
   permite comprobar la velocidad sin falsificar `Date.now`, que sería fijar la
   implementación en vez del comportamiento. */
describe('MovilArrastre — la hoja bajo el dedo', function () {

  function p(y) { return { y: y }; }

  /* Apoya el dedo en y=500 en t=0 y recorre las muestras que se le pasen, cada
     una `[y, t]`. Devuelve el estado listo para soltar. */
  function arrastre(muestras) {
    var e = MovilArrastre.empezar(MovilArrastre.inicial(), p(500), 0);
    muestras.forEach(function (m) { e = MovilArrastre.mover(e, p(m[0]), m[1]); });
    return e;
  }

  /* El alto de ventana de referencia de este fichero. Con 800, el cuarto de
     pantalla son 200px levantados, o sea 210 de recorrido del dedo. */
  var ALTO = 800;

  // ---- El margen antes de moverse ---------------------------------

  prueba('la hoja no se mueve mientras el dedo no pase el margen', function () {
    igual([MovilArrastre.levantado(arrastre([[492, 10]])),
           MovilArrastre.levantado(arrastre([[490, 10]])),
           MovilArrastre.levantado(arrastre([[482, 10]]))],
          [0, 0, 8]);
  });

  /* Si el recorrido no se contara desde el margen sino desde el apoyo, la hoja
     pegaría un salto de 10px en el instante exacto en que lo cruza. */
  prueba('al cruzar el margen la hoja arranca desde cero, sin salto', function () {
    igual(MovilArrastre.levantado(arrastre([[489, 10]])), 1);
  });

  prueba('arrastrar hacia abajo no hunde la hoja', function () {
    igual([MovilArrastre.recorrido(arrastre([[560, 10]])),
           MovilArrastre.levantado(arrastre([[560, 10]]))],
          [0, 0]);
  });

  /* Esta prueba muere si alguien copia el 10 en vez de leerlo de MovilGestos,
     que es exactamente la mutación que se quiere impedir. */
  prueba('el margen sale de MovilGestos y no de una copia', function () {
    var original = MovilGestos.TOQUE;
    var conMargenGrande;
    try {
      MovilGestos.TOQUE = 40;
      conMargenGrande = MovilArrastre.levantado(arrastre([[470, 10]]));
    } finally {
      MovilGestos.TOQUE = original;
    }
    igual([conMargenGrande, MovilArrastre.levantado(arrastre([[470, 10]]))],
          [0, 20]);
  });

  // ---- La rama del golpe ------------------------------------------

  prueba('un golpe corto y rápido echa la puerta', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [470, 30]]), ALTO).salir, true);
  });

  /* Sin el mínimo de recorrido, un temblor de seis píxeles al apoyar el dedo
     —que es rapidísimo— echaría la puerta sin que nadie la empujara. */
  prueba('un golpe rápido pero por debajo del mínimo no la echa', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [480, 20]]), ALTO).salir, false);
  });

  /* El mínimo se mide contra el RECORRIDO del dedo, no contra lo levantado:
     son los 25 dip de recorrido del ViewPager de Android. Con 24 de recorrido
     lo levantado son 14, así que una implementación que compare lo levantado
     contra 24 devuelve false aquí y la prueba la caza. */
  prueba('el mínimo del golpe se mide contra el recorrido del dedo', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [476, 20]]), ALTO).salir, true);
  });

  prueba('un golpe lento no la echa aunque el recorrido llegue', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 100], [460, 600]]), ALTO).salir, false);
  });

  // ---- La rama de la posición -------------------------------------

  prueba('un arrastre largo y lento la echa aunque no haya golpe', function () {
    igual(MovilArrastre.soltar(arrastre([[400, 500], [280, 1000]]), ALTO).salir, true);
  });

  prueba('soltar por debajo de los dos umbrales devuelve la hoja', function () {
    igual(MovilArrastre.soltar(arrastre([[480, 100], [450, 600]]), ALTO).salir, false);
  });

  /* El alto entra como argumento y no se lee de `window`: una pantalla más
     corta tiene que echar la puerta con menos recorrido. */
  prueba('el cuarto de pantalla se mide contra el alto que se le pasa', function () {
    var e = arrastre([[400, 500], [290, 1000]]);   // 210 de recorrido, 200 levantados
    igual([MovilArrastre.soltar(e, ALTO).salir,
           MovilArrastre.soltar(e, 1600).salir],
          [true, false]);
  });

  // ---- Los bordes -------------------------------------------------

  /* Dos `pointermove` pueden llegar con el mismo `timeStamp`. Sin la guarda,
     eso divide por cero, la velocidad sale Infinity, supera cualquier umbral y
     la puerta se va con el dedo parado. */
  prueba('dos muestras en el mismo milisegundo no dividen por cero', function () {
    var e = arrastre([[490, 10], [400, 10]]);
    igual([MovilArrastre.velocidad(e), MovilArrastre.soltar(e, ALTO).salir],
          [0, false]);
  });

  prueba('soltar sin haber empezado no sale y no lanza', function () {
    igual(MovilArrastre.soltar(MovilArrastre.inicial(), ALTO).salir, false);
  });

  /* Un contenedor de alto cero hace que `alto * FRACCION` valga cero, y sin la
     guarda `lev > 0` de la implementación, `0 >= 0` sería cierto y la puerta se
     cruzaría con un arrastre hacia ABAJO, que no ha levantado nada. No es
     hipotético: en el arnés el hero es un `<div>` sin CSS y mide cero de alto,
     y en producción lo mide también durante el instante entre que el nodo entra
     en el documento y le llega la hoja de estilo. */
  prueba('con un alto de cero, arrastrar hacia abajo no echa la puerta', function () {
    igual(MovilArrastre.soltar(arrastre([[560, 10]]), 0).salir, false);
  });

  /* Sin esto, el gesto siguiente heredaría el origen del anterior y la hoja
     saldría con el primer movimiento. */
  prueba('soltar devuelve el estado a cero para el gesto siguiente', function () {
    var r = MovilArrastre.soltar(arrastre([[300, 200]]), ALTO);
    igual([r.estado.activo, r.estado.y0], [false, 0]);
  });

  prueba('mover sin haber empezado no toca el estado', function () {
    var e = MovilArrastre.inicial();
    igual(MovilArrastre.mover(e, p(100), 50), e);
  });

  /* La velocidad se mide entre las DOS ÚLTIMAS muestras y no sobre el gesto
     entero, y ésta es la prueba que separa las dos lecturas: el gesto completo
     recorre 210px en 1000ms (0,21 px/ms, por debajo del umbral), pero el
     remate son 30px en 20ms (1,5 px/ms). Quien promedie el gesto entero
     devuelve false aquí. */
  prueba('la velocidad es la del remate, no la media del gesto', function () {
    igual(MovilArrastre.velocidad(arrastre([[320, 980], [290, 1000]])), 1.5);
  });
});
