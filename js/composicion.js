window.Composicion = (function () {
  /* Las fotos son 4:5, así que el alto de una caja es su ancho por 1,25.
     El resto del sitio da esa proporción por supuesta (.proj usa
     aspect-ratio:4/5), así que aquí no se inventa: se respeta. */
  var PROPORCION = 1.25;

  /* La irregularidad es lo que hace que el espacio se sienta explorable y no
     tabulado. Sale de estas tres listas, que se recorren cíclicamente: nada de
     Math.random(), porque la composición tiene que ser idéntica en cada carga.
     Son fracciones del ancho y del alto de la celda. */
  var ANCHOS  = [0.62, 0.50, 0.56, 0.44, 0.60, 0.48];
  var SESGO_X = [0.06, 0.28, 0.14, 0.34, 0.02, 0.22];
  var SESGO_Y = [0.10, 0.02, 0.26, 0.14, 0.32, 0.06];

  /* El ancho de celda se partió por la mitad (60 -> 30 y 50 -> 25): con las
     celdas anteriores, la caja más grande del ciclo medía 0,62 x 60 = 37,2vw
     de ancho y por tanto 46,5vw de alto, que en una pantalla de 1080 son casi
     900px — más de lo que queda visible bajo la barra. La foto más grande era
     justo la que no se podía ver entera.

     amplio: el lienzo que se recorre con el ratón. 4 x 30 = 120vw. Se
     mantienen las 4 columnas a propósito: partiendo sólo la celda, el lienzo
     queda a mitad de escala EXACTA —misma proporción, misma composición, todo
     al 50%— y sigue sin caber en la pantalla, que es lo que mantiene el gesto
     de explorar. Con 12 proyectos: 120 x 102vw, la misma forma que los
     240 x 201vw de antes.

     compacto: la vista filtrada SE QUEDA COMO ESTABA, 2 x 50 = 100vw, y no es
     un olvido. Se probaron las dos formas de encogerla y las dos salen mal por
     la misma razón —una categoría trae hoy 3 proyectos, y con tan pocos la
     rejilla se queda sin filas:
       - 2 x 25 = 50vw: más estrecho que la pantalla. Ahí el paneo no centra el
         lienzo, `minX = Math.min(0, stageW - canvasW)` (galeria-paneo.js) da 0
         y lo deja pegado a la izquierda con media pantalla amarilla.
       - 4 x 25 = 100vw: el ancho vuelve, pero 3 proyectos entran en UNA fila y
         el lienzo queda en 100 x 28vw, una tira pegada al borde de arriba,
         medio tapada por la barra, con el resto de la pantalla vacío.
     Con 2 columnas, 3 proyectos hacen 2 filas y la composición se sostiene.
     Cuando entren los trabajos de verdad y una categoría traiga ocho o diez,
     merece la pena volver aquí: entonces sí habrá filas que repartir. */
  var MODOS = {
    amplio:   { columnas: 4, anchoCelda: 30 },
    compacto: { columnas: 2, anchoCelda: 50 }
  };

  /* Aire alrededor de toda la composición, en vw. Sin él, las fotos de los
     bordes quedaban pegadas al borde del lienzo, y una foto pegada al borde
     sólo está entera en UNA posición exacta del paneo: había que clavar el
     ratón en el píxel justo. Con margen, esa foto tiene un rango de posiciones
     válidas, no un punto.

     8 y no más, y el número está medido, no elegido a ojo. La holgura —qué
     porcentaje de posiciones del ratón muestran entera la foto más difícil— no
     crece indefinidamente con el margen, porque el margen agranda el lienzo y
     eso agranda el recorrido del paneo. Con el STRENGTH=2 de
     galeria-paneo.js sale así:

         margen:    0     4     6     8    10    12    15    20    25  (vw)
         holgura: 8,7  11,6  12,7  13,3  12,9  12,4  11,7  10,6   9,7  (%)

     8vw es el máximo. A partir de ahí se paga lienzo sin ganar comodidad.
     Si alguien cambia STRENGTH, este óptimo se mueve: vuelve a medirlo. */
  var MARGEN = 8;

  /* El alto de celda no se elige a ojo: se calcula para que la caja más alta
     que puede caer en una celda quepa dentro con su sesgo incluido. Así el no
     solape es una propiedad de la construcción y no algo que haya que vigilar
     cada vez que alguien toque las listas de arriba. */
  function altoDeCelda(anchoCelda) {
    var maximo = 0;
    for (var i = 0; i < ANCHOS.length; i++) {
      var necesario = anchoCelda * ANCHOS[i] * PROPORCION / (1 - SESGO_Y[i]);
      if (necesario > maximo) maximo = necesario;
    }
    return Math.ceil(maximo);
  }

  function config(modo) {
    var m = MODOS[modo];
    if (!m) throw new Error('Modo de composición desconocido: ' + modo);
    return { columnas: m.columnas, anchoCelda: m.anchoCelda, altoCelda: altoDeCelda(m.anchoCelda) };
  }

  function disponer(cantidad, modo) {
    var c = config(modo);
    var salida = [];
    for (var i = 0; i < cantidad; i++) {
      var v = i % ANCHOS.length;
      var columna = i % c.columnas;
      var fila = Math.floor(i / c.columnas);
      salida.push({
        x: MARGEN + columna * c.anchoCelda + c.anchoCelda * SESGO_X[v],
        y: MARGEN + fila    * c.altoCelda  + c.altoCelda  * SESGO_Y[v],
        w: c.anchoCelda * ANCHOS[v]
      });
    }
    return salida;
  }

  /* El lienzo es la rejilla MÁS el margen por los dos lados de cada eje. Las
     dos mitades del margen tienen que moverse juntas —aquí y en `disponer`—:
     si sólo crece el lienzo, el aire se va todo al lado derecho y abajo; si
     sólo se desplazan las cajas, se salen por ese mismo lado. */
  function tamano(cantidad, modo) {
    var c = config(modo);
    var filas = Math.max(1, Math.ceil(cantidad / c.columnas));
    return { ancho: c.columnas * c.anchoCelda + 2 * MARGEN,
             alto:  filas      * c.altoCelda  + 2 * MARGEN };
  }

  return { disponer: disponer, tamano: tamano };
})();
