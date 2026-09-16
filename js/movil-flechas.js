window.MovilFlechas = (function () {

  /* Las dos flechas laterales del visor móvil: la pista de que el portafolio
     sigue a los lados. Sólo el eje horizontal —cambiar de trabajo—, y no el
     vertical: las piezas de un trabajo ya las anuncian el contador y la tira
     de miniaturas, con palabras y sin ocupar sitio sobre la foto.

     Cada una se enciende sólo cuando hay trabajo por ese lado. Con las dos
     siempre puestas el indicio no diría nada; encendiéndose y apagándose dicen
     además por dónde vas del portafolio, y que en los extremos se acaba.

     Viven FUERA de `.mvisor-hud` a propósito, y es la decisión que sostiene
     todo el módulo: el HUD se duerme a los tres segundos, y a los tres
     segundos es justo cuando alguien que no sabe por dónde tirar se queda
     mirando la foto. Un indicio que desaparece en ese momento no resuelve el
     problema que viene a resolver.

     No son pulsables. Son un letrero, no un control: añadir dos dianas justo
     en la franja lateral que el navegador se reserva para su gesto de «atrás»
     es otra decisión, y no es la que se pidió. */

  /* La inversión, en el único sitio donde vive.

     `MovilRecorrido` habla en gestos del DEDO: 'izquierda' es «he deslizado a
     la izquierda» y trae el proyecto siguiente. Una flecha habla de dónde está
     el CONTENIDO, que es la convención de cualquier carrusel: el chevrón del
     borde derecho dice «hay trabajo por ahí», y para traerlo el dedo va al
     revés.

     Si esto viviera en quien pinta cada flecha, cada una podría equivocarse de
     signo por su cuenta, y ese es el error que no da error: se ve como que el
     visor señala hacia donde no hay nada. Es el mismo razonamiento que ya está
     escrito en `mover`, en js/movil-recorrido.js. */
  var CONTRARIO = {
    izquierda: 'derecha',
    derecha:   'izquierda'
  };

  /* Las claves de `refs` son POSICIONES en la pantalla: `refs.derecha` es el
     chevrón que está a la derecha y apunta a la derecha. Las de `salidas` son
     gestos. Por eso la tabla de arriba se lee siempre en el mismo sentido. */
  var refs = null;

  function init(elementos) {
    refs = elementos;
  }

  function pintar(salidas) {
    Object.keys(CONTRARIO).forEach(function (posicion) {
      var nodo = refs && refs[posicion];
      if (!nodo) return;
      nodo.hidden = !(salidas && salidas[CONTRARIO[posicion]]);
    });
  }

  return {
    CONTRARIO: CONTRARIO,
    init: init,
    pintar: pintar
  };
})();
