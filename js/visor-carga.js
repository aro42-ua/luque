window.VisorCarga = (function () {
  var raiz = null;

  // init: cachea la raíz del visor, cuya clase 'cargando' enciende el
  // overlay vía CSS. js/visor.js decide *cuándo* se pinta una pieza;
  // este módulo sabe *cómo* pintar la <img> y el indicador que la cubre.
  function init(elRaiz) { raiz = elRaiz; }

  function marcar(si) { raiz.classList.toggle('cargando', si); }

  // limpiar: apaga el indicador incondicionalmente. renderizar() lo
  // llama antes de decidir la rama: una navegación directa de una foto
  // a medio cargar hacia un vídeo dejaría el indicador clavado encima.
  function limpiar() { marcar(false); }

  // pintar: crea la <img> de la pieza actual, la añade a la escena,
  // engancha el indicador de carga y precarga las piezas vecinas.
  // Sustituye por completo la rama de fotos de renderizar() en visor.js.
  function pintar(escena, proyecto, estado, lista) {
    var img = document.createElement('img');
    img.src = lista[estado.indice];
    img.alt = proyecto.titulo + ', pieza ' + (estado.indice + 1) + ' de ' + estado.total;
    escena.appendChild(img);

    // Si el usuario cambia de pieza antes de que esta termine de cargar,
    // renderizar() vacía la escena y esta <img> queda huérfana: su
    // 'load'/'error', aunque llegue tarde, comprueba parentNode y no
    // toca el indicador de la pieza que esté mostrándose entonces.
    if (!img.complete) {
      marcar(true);
      img.addEventListener('load',  function () { if (img.parentNode) marcar(false); }, { once: true });
      img.addEventListener('error', function () { if (img.parentNode) marcar(false); }, { once: true });
    } else {
      marcar(false);
    }

    precargar(lista, estado.indice + 1);
    precargar(lista, estado.indice - 1);
  }

  // precargar: dispara la descarga de una pieza vecina sin insertarla en
  // el DOM, para que navegar se sienta instantáneo. Índices fuera de
  // rango se ignoran sin más.
  function precargar(lista, indice) {
    if (indice < 0 || indice >= lista.length) return;
    var i = new Image();
    i.src = lista[indice];
  }

  return { init: init, pintar: pintar, limpiar: limpiar };
})();
