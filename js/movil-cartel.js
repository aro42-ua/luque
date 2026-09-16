window.MovilCartel = (function () {

  /* El cartel del visor móvil: el nombre del trabajo, grande y centrado, cuando
     acabas de entrar en uno.

     Es lo que hace que cambiar de trabajo se note. Sin él, el salto horizontal
     se parece demasiado a pasar de foto: entra una imagen deslizándose de lado
     y el único aviso de que es OTRO trabajo es la pastilla del título, abajo a
     la izquierda, pequeña y a tres segundos de dormirse. Con él, el salto tiene
     un momento propio que no se puede confundir con nada.

     Sale al cambiar de trabajo y NO al cambiar de pieza dentro del mismo. Quien
     distingue las dos cosas es `MovilVisor`, que es el único que sabe de dónde
     viene la parada; este módulo sólo sabe enseñar y retirar. */

  /* El plazo entero, fundidos incluidos: 180 de entrada, 900 aguantando y 400
     de salida. Se fija aquí y se reparte en css/luque.css —la animación tiene
     que sumar exactamente esto, o el cartel se queda puesto sin opacidad o
     desaparece de golpe a media transición—. Igual que `MovilHud.OCULTAR_TRAS`,
     se prueba contra la constante y no contra el reloj. */
  var DURACION = 1480;

  var raiz = null, texto = null, reloj = null;

  function init(elementos) {
    raiz = elementos.raiz;
    texto = elementos.texto;
  }

  function mostrar(titulo) {
    if (!raiz) return;
    texto.textContent = titulo;
    raiz.hidden = false;
    /* Quitar, forzar el reflujo y volver a poner. Sin el reflujo del medio, el
       navegador junta las dos escrituras de clase en un solo recalculo, no ve
       ningún cambio y la animación NO se relanza: encadenar dos deslizamientos
       rápidos dejaría el segundo cartel puesto sin entrar, con el nombre nuevo
       apareciendo de golpe sobre un velo que ya estaba. Leer `offsetWidth` es
       la forma barata y de siempre de pedir ese recalculo. */
    raiz.classList.remove('puesto');
    void raiz.offsetWidth;
    raiz.classList.add('puesto');
    /* El plazo se reinicia entero. `clearTimeout` sobre `null` es inofensivo,
       así que no hace falta guarda. */
    clearTimeout(reloj);
    reloj = setTimeout(retirar, DURACION);
  }

  /* `hidden` y no sólo la clase: el cartel retirado no debe quedarse encima de
     la foto interceptando nada ni ocupando sitio en el árbol de accesibilidad.
     La clase se quita también, para que el próximo `mostrar` encuentre el nodo
     como lo encontró el primero. */
  function retirar() {
    if (!raiz) return;
    clearTimeout(reloj);
    reloj = null;
    raiz.classList.remove('puesto');
    raiz.hidden = true;
  }

  return {
    DURACION: DURACION,
    init: init,
    mostrar: mostrar,
    retirar: retirar
  };
})();
