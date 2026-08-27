window.Orden = (function () {
  function recortar(i, tope) {
    return Math.max(0, Math.min(i, tope));
  }

  /* Devuelve una lista nueva y no toca la que recibe: el panel compara la lista
     de trabajo contra la última guardada para saber si hay cambios pendientes,
     y eso deja de funcionar en cuanto alguien modifica la original. */
  function mover(lista, desde, hasta) {
    var copia = lista.slice();
    if (copia.length < 2) return copia;
    var origen = recortar(desde, copia.length - 1);
    var destino = recortar(hasta, copia.length - 1);
    if (origen === destino) return copia;
    var sacado = copia.splice(origen, 1)[0];
    copia.splice(destino, 0, sacado);
    return copia;
  }

  return { mover: mover };
})();
