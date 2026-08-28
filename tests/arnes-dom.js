/* Segundo arnés, para lo que toca el DOM. El de al lado (`arnes.js`) prueba
   funciones puras; éste da el terreno donde ejercitar código que construye
   nodos, mueve el foco y mide cajas.

   Dos niveles porque son dos problemas distintos:
     - `conElemento`, para lo que recibe su contenedor como parámetro
       —`Lista.pintar(contenedor, …)`—, que se prueba con un nodo y ya está.
     - `conDocumento`, para lo que no expone nada y se ejecuta al cargarse
       —`panel/js/panel.js` es una IIFE que llama a init() en su última línea—,
       que hay que cargar dentro de un iframe con sus dependencias ya puestas. */
window.ArnesDom = (function () {

  /* El contenedor va DENTRO del documento, no suelto: focus() no hace nada
     sobre un nodo desconectado y getBoundingClientRect() devuelve ceros. Se
     esconde moviéndolo fuera de la pantalla y NO con display:none, que sí
     rompería el foco y las medidas —que es justo lo que venimos a probar—. */
  function caja() {
    var c = document.createElement('div');
    c.className = 'arnes-dom-caja';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:400px';
    document.body.appendChild(c);
    return c;
  }

  function conElemento(html, fn) {
    var c = caja();
    c.innerHTML = html;
    /* finally y no un remove() al final: si fn lanza, el contenedor tiene que
       desaparecer igual. Si no, una prueba en rojo deja basura en el documento
       y las siguientes empiezan sucias, que es peor que el fallo original. */
    try {
      return fn(c.firstElementChild, c);
    } finally {
      c.parentNode.removeChild(c);
    }
  }

  return { conElemento: conElemento };
})();
