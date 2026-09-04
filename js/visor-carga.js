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

  /* vistaPrevia: la URL de esta misma foto que el navegador YA tiene, para
     poder pintar algo en el acto en vez de esperar a la de tamaño completo.

     Existe por una medida, no por gusto. `VisorTransicion.volar` no arranca el
     vuelo hasta que la <img> de la escena está completa, y la foto entera es
     una URL que no está en ninguna caché: la rejilla enseña la portada y el
     visor pedía la pieza, misma foto y URL distinta. Medido el 2026-09-04 con
     CDP en móvil de verdad sobre `#/niebla`: 1371 ms hasta volar en frío
     contra 4 ms con la imagen ya descargada, con el arranque del vuelo pegado
     al final de la descarga (1371 contra 1362). El parón era la espera.

     De dónde sale la que ya está cargada, según la pieza:
       - la primera, de la portada que se está viendo en la celda pulsada;
       - las demás, de su miniatura, que la tira de abajo ya pidió.
     Sin ninguna de las dos devuelve null y todo sigue como antes. */
  function vistaPrevia(proyecto, indice) {
    var pieza = proyecto.piezas && proyecto.piezas[indice];
    var propia = pieza && pieza.miniatura;
    return (indice === 0 ? (proyecto.portadaUrl || propia) : propia) || null;
  }

  // pintar: crea la <img> de la pieza actual, la añade a la escena,
  // engancha el indicador de carga y precarga las piezas vecinas.
  // Sustituye por completo la rama de fotos de renderizar() en visor.js.
  function pintar(escena, proyecto, estado, lista) {
    var plena = lista[estado.indice];
    var previa = vistaPrevia(proyecto, estado.indice);
    var img = document.createElement('img');
    img.src = previa || plena;
    img.alt = proyecto.titulo + ', pieza ' + (estado.indice + 1) + ' de ' + estado.total;
    escena.appendChild(img);

    // Si el usuario cambia de pieza antes de que esta termine de cargar,
    // renderizar() vacía la escena y esta <img> queda huérfana: su
    // 'load'/'error', aunque llegue tarde, comprueba parentNode y no
    // toca el indicador de la pieza que esté mostrándose entonces.
    if (previa && previa !== plena) {
      relevar(img, plena);
    } else if (!img.complete) {
      marcar(true);
      img.addEventListener('load',  function () { if (img.parentNode) marcar(false); }, { once: true });
      img.addEventListener('error', function () { if (img.parentNode) marcar(false); }, { once: true });
    } else {
      marcar(false);
    }

    precargar(lista, estado.indice + 1);
    precargar(lista, estado.indice - 1);
  }

  /* relevar: descarga la foto entera por su cuenta y, cuando está lista, la
     pone en la <img> que ya se está viendo. El cambio no parpadea porque para
     entonces el navegador la tiene descargada y decodificada, y hasta que lo
     esté sigue enseñándose la previa.

     CONDICIÓN SOBRE EL CONTENIDO, no sobre este código: la previa y la plena
     tienen que ser la misma foto EN LA MISMA PROPORCIÓN. `.visor-escena img`
     usa `object-fit:contain` con `max-width/max-height:100%` (css/luque.css),
     así que la caja pintada la decide la proporción de la imagen: si las dos
     no coinciden, el relevo daría un salto a mitad del vuelo. En el contenido
     de relleno coinciden (portada 1200x1500 y pieza 2400x3000, las dos 4:5);
     quien genere los recortes de las fotos del estudio tiene que mantenerlo.

     El error no releva a propósito: dejar la previa buena en pantalla es mejor
     que cambiarla por una imagen rota. */
  function relevar(img, plena) {
    marcar(true);
    var grande = new Image();
    grande.addEventListener('load', function () {
      if (!img.parentNode) return;
      img.src = plena;
      marcar(false);
    }, { once: true });
    grande.addEventListener('error', function () {
      if (img.parentNode) marcar(false);
    }, { once: true });
    grande.src = plena;
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
