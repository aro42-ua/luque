/* El pegamento entre `Subida` —que habla con el Worker— y `Edicion` —que sabe
   colocar las piezas en el proyecto—, más lo que se le cuenta al estudio
   mientras tanto.

   Vive aquí y no en panel.js porque panel.js es el arranque, y desde el bloque
   3c lleva encima el enrutado de tres pantallas: con esto dentro cruzaba las
   300 líneas del criterio de aceptación 11. */
window.Subir = (function () {

  /* Criterio de aceptación 10: se dice cuáles quedaron fuera, una por una y
     con su motivo. Un «hubo errores» a secas obligaría a subirlas todas otra
     vez para averiguar cuál falló. */
  function contar(resultado) {
    var entraron = resultado.piezas.length + ' foto(s) subidas.';
    if (!resultado.fallos.length) return entraron + ' Recuerda guardar.';
    return entraron + ' No se pudieron subir: '
      + resultado.fallos.map(function (f) {
          return f.archivo + ' (' + f.motivo + ')';
        }).join('; ')
      + '. Recuerda guardar lo que sí ha entrado.';
  }

  /* `alTerminar(proyectoNuevo, aviso)`. No guarda: como todo lo demás de la
     pantalla de un proyecto, deja el borrador cambiado en memoria y el botón
     de guardar sigue siendo el del panel. */
  function aqui(els, proyecto, archivos, alTerminar) {
    els.progreso.textContent = 'Preparando ' + archivos.length + ' foto(s)…';
    window.Subida.subir(proyecto.id, archivos, function (paso) {
      /* El progreso importa porque las fotos van de una en una y un lote de
         treinta tarda: sin esto, el panel parece colgado justo cuando más
         trabajo está haciendo. */
      els.progreso.textContent = paso.hecho === paso.total
        ? ''
        : 'Subiendo ' + (paso.hecho + 1) + ' de ' + paso.total + ': ' + paso.archivo;
    }, function (resultado) {
      alTerminar(window.Edicion.anadir(proyecto, resultado.piezas), contar(resultado));
    });
  }

  return { aqui: aqui, contar: contar };
})();
