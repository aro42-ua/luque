window.MovilArrastre = (function () {

  /* Qué fracción de la pantalla hay que levantar para que la hoja se vaya sola,
     sin golpe. 0,25 y no el 0,4f del `determineTargetPage` del `ViewPager` de
     Android, del que sale el resto de esta regla: allí la decisión es un cambio
     de página, donde equivocarse te lleva a otro sitio; aquí es una puerta que
     se cruza una vez y no vuelve, y equivocarse por exceso te ahorra un
     amarillo que era el destino de todos modos. La procedencia de los cuatro
     números está en la sección «De dónde se copiaron los números» de
     docs/superpowers/specs/2026-09-03-tacto-movil-design.md. */
  var FRACCION = 0.25;

  /* px/ms. Es el `MIN_FLING_VELOCITY` de Android —400 dip/s— trasladado a
     píxeles CSS, que en un teléfono son casi la misma unidad: 1 dip ≈ 1,04 px
     CSS. Hammer.js usa 0,3 para lo mismo. */
  var VELOCIDAD = 0.4;

  /* Los otros dos umbrales NO se declaran aquí, y no es un descuido: ya están
     en `MovilGestos` con estos valores y significando exactamente esto.
     `TOQUE` (10) es «por debajo de esto el dedo no se ha movido», que es el
     margen antes de que la hoja arranque; `UMBRAL` (24) es «el eje dominante
     tiene que recorrer al menos esto», que es el mínimo del golpe. Dos copias
     de un umbral son dos sitios donde cambiarlo y uno donde olvidarse.

     Se leen DENTRO de las funciones y no al definir el módulo, para no imponer
     ningún orden de carga entre dos módulos que por lo demás no se conocen. */
  function margen()        { return window.MovilGestos.TOQUE; }
  function minimoDelGolpe() { return window.MovilGestos.UMBRAL; }

  function inicial() {
    return { activo: false, y0: 0, y: 0, t: 0, yPrevio: 0, tPrevio: 0 };
  }

  function empezar(estado, punto, ahora) {
    return { activo: true, y0: punto.y, y: punto.y, t: ahora,
             yPrevio: punto.y, tPrevio: ahora };
  }

  /* Guarda la muestra anterior además de la de ahora, y nada más. Es a
     propósito lo MENOS que hace falta: la velocidad se mide entre las dos
     últimas muestras y no sobre el gesto entero, porque quien arrastra despacio
     y remata con un golpe seco sí quiere salir, y quien arranca rápido y se
     para a medias no. Promediando el gesto, los dos salen al revés. */
  function mover(estado, punto, ahora) {
    if (!estado.activo) return estado;
    return { activo: true, y0: estado.y0, y: punto.y, t: ahora,
             yPrevio: estado.y, tPrevio: estado.t };
  }

  /* Lo que ha recorrido el DEDO hacia arriba. Nunca negativo: arrastrar hacia
     abajo no hunde la hoja, la deja en su sitio. */
  function recorrido(estado) {
    return Math.max(0, estado.y0 - estado.y);
  }

  /* Lo que se ha levantado la HOJA, que es el recorrido menos el margen.

     La resta no es cosmética: sin ella la hoja daría un salto de diez píxeles
     en el instante exacto en que el dedo cruza el margen. */
  function levantado(estado) {
    return Math.max(0, recorrido(estado) - margen());
  }

  /* px/ms hacia arriba entre las dos últimas muestras.

     La guarda de `dt <= 0` no es defensiva por si acaso: dos `pointermove`
     pueden llegar con el mismo `timeStamp`, porque el reloj de los eventos
     tiene resolución limitada. Sin la guarda eso divide por cero, la velocidad
     sale `Infinity`, supera cualquier umbral, y la puerta se va con el dedo
     parado. */
  function velocidad(estado) {
    var dt = estado.t - estado.tPrevio;
    if (dt <= 0) return 0;
    return (estado.yPrevio - estado.y) / dt;
  }

  /* `alto` es el alto de la ventana en píxeles CSS, y lo pasa quien llama: este
     módulo no lee `window`.

     Dos ramas, y en este orden, que es la forma del `determineTargetPage` del
     `ViewPager` de Android y no sólo sus números. Primero manda el golpe, que
     necesita recorrido Y velocidad —las dos, con `&&`, no una cualquiera—; y si
     no hubo golpe, manda la posición. Como resultado las dos ramas son un `o`,
     pero el `y` de dentro de la primera es lo que impide que un temblor rápido
     o un arrastre lentísimo de dos centímetros cuenten como golpe.

     El mínimo del golpe se compara contra el RECORRIDO y la fracción contra lo
     LEVANTADO. Son diez píxeles de diferencia sobre umbrales de veinte y de
     doscientos, así que no cambia lo que hace; se escribe porque los 25 dip de
     Android son recorrido del dedo y la fracción es lo que el ojo ve, y quien
     lo lea después no debería tener que deducir cuál era la intención. */
  function soltar(estado, alto) {
    if (!estado.activo) return { estado: inicial(), salir: false };

    var golpe = recorrido(estado) >= minimoDelGolpe() &&
                velocidad(estado) >= VELOCIDAD;

    /* El `lev > 0` de la segunda rama no sobra, aunque parezca implicado por la
       comparación de al lado. Con un `alto` de cero —el hero antes de que le
       llegue la hoja de estilo, y el `<div>` pelado del arnés— `alto * FRACCION`
       vale cero, y entonces `0 >= 0` es cierto: la puerta se cruzaría con un
       arrastre hacia ABAJO, que no ha levantado nada. */
    var lev = levantado(estado);

    return { estado: inicial(),
             salir: golpe || (lev > 0 && lev >= alto * FRACCION) };
  }

  return {
    FRACCION: FRACCION,
    VELOCIDAD: VELOCIDAD,
    inicial: inicial,
    empezar: empezar,
    mover: mover,
    recorrido: recorrido,
    levantado: levantado,
    velocidad: velocidad,
    soltar: soltar
  };
})();
