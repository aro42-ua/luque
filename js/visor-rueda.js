window.VisorRueda = (function () {

  /* La rueda del visor de escritorio, leída como GESTOS y no como eventos.

     Un trackpad no manda "una muesca": manda una ráfaga de `wheel` con deltas
     pequeños y una inercia que sigue sola. Tratar cada evento como una pieza
     —lo que hacía `alRodar` en js/visor.js— saltaba nueve piezas en un solo
     gesto, medido. Y un pellizco de zoom llega en Chrome/Edge como `wheel` con
     `ctrlKey:true`: eso es querer ampliar, no pasar página.

     Dos reglas, una por aparato. RATÓN: cada muesca es un paso, siempre
     (decidido por Ángel el 2026-09-11); se reconoce por el tamaño, porque el
     ratón habla en saltos de ~100 px y el trackpad en unidades. TRACKPAD: los
     deltas pequeños se acumulan hasta UMBRAL, se da UN paso y el gesto queda
     bloqueado hasta que la rueda calle SILENCIO_MS. Un salto grande que llega
     en medio de una ráfaga bloqueada es un pico de la inercia, no una muesca.
     El precio conocido: un manotazo muy fuerte al trackpad puede empezar por
     encima de MUESCA y contar como muesca.

     `paso` es pura y recibe el reloj: tests/pruebas-visor-rueda.js reproduce
     una ráfaga entera sin esperar. */
  var UMBRAL = 50;        // px acumulados que completan un gesto de trackpad
  var MUESCA = 80;        // px en UN evento: es una muesca de ratón (Chrome da 100)
  var SILENCIO_MS = 150;  // sin eventos durante esto, el gesto ha terminado

  function inicial() {
    /* `ultimo` a null y no a -Infinity: significa "aún no ha rodado", y
       sobrevive a un JSON.stringify, que es como lo comparan las pruebas. */
    return { acumulado: 0, bloqueado: false, ultimo: null };
  }

  /* -> { estado, paso } con paso en -1, 0 o 1. Nunca toca `estado`. */
  function paso(estado, e, ahora) {
    var dy = e.deltaY || 0, dx = e.deltaX || 0;
    /* ctrlKey es el pellizco; deltaX dominante es desplazarse de lado; y un
       deltaY de cero no es "atrás", que es en lo que caía el `> 0` de antes. */
    if (e.ctrlKey || !dy || Math.abs(dx) > Math.abs(dy)) {
      return { estado: estado, paso: 0 };
    }
    var sigue = estado.ultimo !== null && (ahora - estado.ultimo) <= SILENCIO_MS;
    var bloqueado = sigue && estado.bloqueado;
    /* La muesca: deltaMode 1 (líneas) y 2 (páginas) no hablan en píxeles y un
       evento ya es un gesto; en píxeles, un salto de MUESCA o más. Salvo que
       llegue dentro de una ráfaga ya bloqueada: entonces es un pico de ésta. */
    var muesca = (e.deltaMode !== 0 || Math.abs(dy) >= MUESCA) && !bloqueado;
    if (muesca) {
      return { estado: { acumulado: 0, bloqueado: false, ultimo: ahora },
               paso: dy > 0 ? 1 : -1 };
    }
    var acumulado = (sigue ? estado.acumulado : 0) + dy;
    var dar = !bloqueado && Math.abs(acumulado) >= UMBRAL;
    return {
      estado: { acumulado: dar ? 0 : acumulado,
                bloqueado: bloqueado || dar, ultimo: ahora },
      paso: dar ? (acumulado > 0 ? 1 : -1) : 0
    };
  }

  return { inicial: inicial, paso: paso,
           UMBRAL: UMBRAL, MUESCA: MUESCA, SILENCIO_MS: SILENCIO_MS };
})();
