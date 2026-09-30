window.MovilCorona = (function () {

  /* La corona de fotos de la esfera (spec
     docs/superpowers/specs/2026-09-30-esfera-corona-design.md): al tocar la
     portada de delante, las fotos del trabajo salen de detrás y se colocan en
     una elipse a su alrededor. Este módulo sólo dice DÓNDE va cada una; es
     puro, como `MovilEsfera`, y lo cablea `js/movil-globo.js`.

     Todos los rectángulos van como centro y medidas, `{x, y, ancho, alto}`,
     en píxeles de la raíz de la esfera. */

  /* La portada encoge para dejar sitio a diez fotos en un teléfono. */
  var ENCOGIDA = 0.7;
  /* Ancho de cada foto respecto al de la portada encogida, acotado para que
     una foto nunca baje de lo que se toca con un dedo ni crezca de más en una
     pantalla ancha. */
  var PROPORCION_FOTO = 0.4;
  var FOTO_MIN = 48;
  var FOTO_MAX = 84;
  /* Hueco entre la portada y el borde de las fotos. */
  var HUECO = 14;
  var MARGEN = 16;

  function acotar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* Un marco y no una elipse, y está medido: con una elipse cuyos semiejes
     libraban la portada por los lados, las fotos de las diagonales pisaban
     sus esquinas (cinco fotos a 390×844, la tercera). Lo que se calcula es la
     «portada ampliada»: la encogida más el hueco más media foto por cada lado.
     Un centro de foto fuera de ella no puede tocar la portada, y en su borde
     la roza con el hueco exacto. Cada foto va en la dirección de su ángulo,
     justo en ese borde.

     Se empieza arriba (−π/2) y se avanza en el sentido de las agujas del
     reloj —en pantalla la y crece hacia abajo, así que es el ángulo
     creciente—. Si la pantalla no da para el marco entero, cada foto se acota
     a ella con el margen: en una muy pequeña pueden acercarse, pero nunca se
     salen. */
  function colocar(n, portada, medidas) {
    var encogida = {
      x: portada.x, y: portada.y,
      ancho: portada.ancho * ENCOGIDA, alto: portada.alto * ENCOGIDA
    };
    var ancho = acotar(encogida.ancho * PROPORCION_FOTO, FOTO_MIN, FOTO_MAX);
    var alto = ancho * 1.25;
    var mx = encogida.ancho / 2 + HUECO + ancho / 2;
    var my = encogida.alto / 2 + HUECO + alto / 2;
    var fotos = [];
    for (var k = 0; k < n; k++) {
      var a = -Math.PI / 2 + 2 * Math.PI * k / n;
      var c = Math.cos(a);
      var s = Math.sin(a);
      var t = Math.min(Math.abs(c) > 1e-9 ? mx / Math.abs(c) : Infinity,
                       Math.abs(s) > 1e-9 ? my / Math.abs(s) : Infinity);
      fotos.push({
        x: acotar(encogida.x + t * c, MARGEN + ancho / 2, medidas.ancho - MARGEN - ancho / 2),
        y: acotar(encogida.y + t * s, MARGEN + alto / 2, medidas.alto - MARGEN - alto / 2),
        ancho: ancho,
        alto: alto
      });
    }
    return { portada: encogida, fotos: fotos };
  }

  return {
    ENCOGIDA: ENCOGIDA,
    colocar: colocar
  };
})();
