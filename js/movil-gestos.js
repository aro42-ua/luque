window.MovilGestos = (function () {

  /* Por debajo de esto el dedo no se ha movido: es un toque. */
  var TOQUE = 10;

  /* El eje dominante tiene que recorrer al menos esto para que haya
     deslizamiento. Entre TOQUE y UMBRAL queda una franja a propósito en la que
     no pasa nada: un dedo que recorre 15px no quería tocar ni quería
     deslizar. */
  var UMBRAL = 24;

  /* Y tiene que superar al otro eje por este factor. Sin esto, un arrastre en
     diagonal elegiría dirección por un píxel de diferencia, y el gesto haría
     una cosa u otra según el temblor de la mano. */
  var DOMINIO = 1.6;

  function inicial() {
    return { dedos: 0, x0: 0, y0: 0, cancelado: false };
  }

  function copia(e) {
    return { dedos: e.dedos, x0: e.x0, y0: e.y0, cancelado: e.cancelado };
  }

  /* Un dedo toca la pantalla. El primero fija el origen; a partir del segundo
     el gesto deja de poder ser un deslizamiento —manda el pellizco— y lo sigue
     siendo hasta que se levanten todos, que es lo que la spec llama «el
     deslizamiento se cancela hasta soltar». */
  function presionar(estado, punto) {
    var e = copia(estado);
    e.dedos = e.dedos + 1;
    if (e.dedos === 1) { e.x0 = punto.x; e.y0 = punto.y; }
    else { e.cancelado = true; }
    return e;
  }

  /* La decisión, con el recorrido ya medido. El orden importa: primero se
     descarta el toque, luego el recorrido corto, luego la diagonal. Lo que
     sobrevive a los tres tiene dirección. */
  function intencionDe(dx, dy) {
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.sqrt(dx * dx + dy * dy) <= TOQUE) return 'toque';

    var dominante = Math.max(ax, ay), otro = Math.min(ax, ay);
    if (dominante < UMBRAL) return null;
    if (dominante < otro * DOMINIO) return null;

    if (ax >= ay) return dx < 0 ? 'izquierda' : 'derecha';
    return dy < 0 ? 'arriba' : 'abajo';
  }

  /* Se levanta un dedo. La intención sólo se decide cuando se levanta el
     ÚLTIMO: mientras quede alguno en pantalla el gesto no ha terminado. Al
     quedarse en cero se reinicia la cancelación, para que el primer pellizco
     de la sesión no envenene todos los deslizamientos siguientes. */
  function soltar(estado, punto) {
    if (estado.dedos === 0) return { estado: inicial(), intencion: null };

    var e = copia(estado);
    e.dedos = e.dedos - 1;
    if (e.dedos > 0) return { estado: e, intencion: null };

    var intencion = estado.cancelado
      ? 'pellizco'
      : intencionDe(punto.x - estado.x0, punto.y - estado.y0);
    return { estado: inicial(), intencion: intencion };
  }

  return {
    TOQUE: TOQUE, UMBRAL: UMBRAL, DOMINIO: DOMINIO,
    inicial: inicial, presionar: presionar, soltar: soltar
  };
})();
