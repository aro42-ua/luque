window.MovilCarrusel = (function () {

  /* La física del visor móvil (spec
     docs/superpowers/specs/2026-09-30-visor-premium-design.md): cuánto se
     mueve la foto con el dedo, adónde va al soltar, cuánto tarda en llegar, y
     los dos gestos verticales —bajar para cerrar, subir para la ficha—. Puro,
     como `MovilEsfera` y `MovilZoom`: `js/movil-visor.js` lo cablea.

     Convención de todo el módulo: `dx`, `dy` son lo que se ha movido el dedo
     desde que se apoyó (dy positivo = hacia abajo) y `v` su velocidad en
     px/ms, con el mismo signo. */

  /* Hasta que el dedo no recorre esto, no se sabe qué gesto es. */
  var UMBRAL_EJE = 10;
  /* Pasa a la vecina con un tercio largo del ancho, o con un golpe. */
  var PASO = 0.3;
  var VEL_PASO = 0.45;
  /* En el primer o el último extremo, el arrastre se resiste como una goma. */
  var RESISTENCIA = 0.35;
  /* Bajar para cerrar: el progreso llega a 1 a medio alto, la foto encoge
     hasta el 75 %, y se cierra pasado un 15 % del alto o con un golpe. */
  var CIERRE_TOTAL = 0.5;
  var ESCALA_MIN = 0.75;
  var CIERRE = 0.15;
  var VEL_CIERRE = 0.5;
  /* Subir para la ficha. */
  var FICHA_TOTAL = 0.6;
  var FICHA = 0.2;
  var VEL_FICHA = 0.5;
  /* La animación de asentar: nunca más corta que un parpadeo ni más larga de
     lo que tarda en sentirse lenta. */
  var DUR_MIN = 180;
  var DUR_MAX = 380;

  function acotar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function eje(dx, dy) {
    if (Math.hypot(dx, dy) < UMBRAL_EJE) return null;
    return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  }

  /* Hacia fuera de la serie —antes de la primera, después de la última— el
     dedo mueve la foto un 35 % de lo que se mueve él. */
  function arrastre(dx, ancho, indice, total) {
    var alPrincipio = indice <= 0 && dx > 0;
    var alFinal = indice >= total - 1 && dx < 0;
    return (alPrincipio || alFinal) ? dx * RESISTENCIA : dx;
  }

  /* Arrastrar a la IZQUIERDA (dx negativo) trae la siguiente. Si hay un golpe
     claro manda su sentido, aunque contradiga a la distancia: quien lanza
     hacia la derecha tras haber arrastrado a la izquierda ha cambiado de
     idea, y el golpe es lo último que dijo. */
  function destino(dx, v, ancho, indice, total) {
    var paso = 0;
    if (Math.abs(v) > VEL_PASO) paso = v < 0 ? 1 : -1;
    else if (dx < -ancho * PASO) paso = 1;
    else if (dx > ancho * PASO) paso = -1;
    return acotar(indice + paso, 0, Math.max(0, total - 1));
  }

  /* Lo que falta recorrer a la velocidad que traía el dedo, con algo de margen
     para que la curva decelere; acotado a [180, 380] ms. */
  function duracion(distancia, v) {
    var t = Math.abs(distancia) / Math.max(Math.abs(v), 1) * 1.5;
    return Math.round(acotar(t, DUR_MIN, DUR_MAX));
  }

  function cierre(dy, alto) {
    var p = acotar(dy / (alto * CIERRE_TOTAL), 0, 1);
    return { progreso: p, escala: 1 - (1 - ESCALA_MIN) * p, fondo: 1 - p };
  }

  function seCierra(dy, v, alto) {
    return dy > 0 && (dy > alto * CIERRE || v > VEL_CIERRE);
  }

  function ficha(dy, alto) {
    return acotar(-dy / (alto * FICHA_TOTAL), 0, 1);
  }

  function seAbreFicha(dy, v, alto) {
    return dy < 0 && (-dy > alto * FICHA || v < -VEL_FICHA);
  }

  /* El estado de `MovilZoom` ({escala, x, y}, con `translate(x,y) scale(e)`
     desde el centro) que deja el punto tocado `p` donde estaba:
     c + (x,y) + e·(p − c) = p  ⇒  (x,y) = (p − c)·(1 − e). */
  function dobleToque(p, centro, escala) {
    return {
      escala: escala,
      x: (p.x - centro.x) * (1 - escala),
      y: (p.y - centro.y) * (1 - escala)
    };
  }

  return {
    eje: eje,
    arrastre: arrastre,
    destino: destino,
    duracion: duracion,
    cierre: cierre,
    seCierra: seCierra,
    ficha: ficha,
    seAbreFicha: seAbreFicha,
    dobleToque: dobleToque
  };
})();
