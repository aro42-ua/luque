window.VisorFoco = (function () {

  /* El envolvente de foco del visor: que el tabulador dé vueltas DENTRO del
     diálogo en vez de escaparse a lo que hay detrás.

     Vive fuera de `js/visor.js` desde la ronda de arreglos de la revisión
     final del bloque 4e, y es la tercera mudanza de este tipo en el mismo
     bloque —`js/movil-puerta.js` salió de `js/movil-hoja.js`, y
     `js/visor-origen.js` salió de aquí mismo—, las tres por lo mismo y con
     el mismo criterio.

     La razón inmediata fue el techo de 300 líneas: `js/visor.js` estaba en
     299 y el arreglo del envolvente pedía explicar POR QUÉ mira dos cosas y
     no una. Eso cabía comprimido en una sola línea de 408 caracteres —el
     resto del proyecto envuelve la prosa cerca de las 80— y no cabía escrito
     como se escribe aquí. Comprimir la prosa para caber no es caber: es
     dejar el fichero lleno y el porqué ilegible para el siguiente.

     Y la división no es sólo aritmética, como en las otras dos. «Quién es
     enfocable ahora mismo» es una pregunta de la PANTALLA —qué está
     pintado, qué está escondido y de qué manera— y no del visor.
     `js/visor.js` decide CUÁNDO se atrapa el foco; esto sabe A QUIÉN. No
     conoce el estado del visor, ni la ficha, ni la lupa: recibe la raíz del
     diálogo y el evento, y nada más. */

  /* QUIÉN CUENTA COMO FOCO. Los `<button>` habilitados del diálogo, más la
     línea de tiempo del vídeo, que no es un botón pero es enfocable
     (`role="slider"` con `tabindex="0"`; el marcado de `#visorLinea` está en
     index.html).

     Y de ésos, sólo los que se ven, que es la parte que cuesta: hay DOS
     formas de esconder y cada comprobación ve una sola.

     - `offsetParent` se anula con `display:none`. Así cae la línea de tiempo
       cuando el proyecto es de fotos, y así caía —por accidente, no por
       diseño— el botón de cerrar la ficha en escritorio.
     - `visibility:hidden` NO anula `offsetParent`. El elemento sigue
       teniendo caja, sigue midiendo, y sigue apareciendo en esta lista. Pero
       el navegador no lo enfoca nunca.

     Un elemento inenfocable aquí dentro no es un detalle. Si cae el último,
     la condición `document.activeElement === ultimo` de abajo es
     INALCANZABLE: el evento sale sin consumir y el Tab se lleva el foco
     fuera del `role="dialog" aria-modal="true"`, a los botones que están
     detrás. Es lo que pasaba a ≤860px, donde `css/luque.css` esconde la
     ficha cerrada con `visibility:hidden` y le devuelve el `display:block` a
     su botón de cerrar: medido con Tab nativo, el foco acababa en la rejilla
     de la portada móvil. Lo cubre `tests/pruebas-visor-foco.js`.

     `visibility` se hereda, así que basta preguntársela al propio elemento;
     no hay que subir hasta el panel que la declara. */
  function enfocables(raiz) {
    return Array.prototype.filter.call(
      raiz.querySelectorAll('button:not([disabled]), [role="slider"]'),
      function (el) {
        return el.offsetParent !== null &&
               getComputedStyle(el).visibility !== 'hidden';
      });
  }

  /* Cierra el ciclo por los dos extremos. `raiz` es el diálogo y `e` es el
     `keydown` del Tab, que ya viene filtrado por quien llama.

     Si no hay ningún foco, el evento se deja pasar sin tocarlo: sin nadie a
     quien dárselo, consumirlo dejaría el tabulador muerto en vez de
     atrapado. */
  function atrapar(raiz, e) {
    var focos = enfocables(raiz);
    if (!focos.length) return;
    var primero = focos[0], ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  return { atrapar: atrapar };
})();
