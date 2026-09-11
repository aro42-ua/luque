/* La pantalla de publicar: qué cambia, qué falta y el botón. Sólo pinta —la red
   es de publicacion.js— porque así se puede probar entera sin doblar nada, y lo
   que más falta hace comprobar aquí es justo lo que no se ve: que el botón esté
   apagado cuando tiene que estarlo. */
window.PantallaPublicar = (function () {

  /* Los mismos problemas que el Worker contestaría con un 422, dichos antes de
     pulsar. Se añade el del borrador vacío porque `validar` no lo da —lo pone
     `problemasDelBorrador` en el Worker— y publicar un borrador sin proyectos
     vaciaría la web entera. */
  function problemasDe(borrador) {
    var lista = (borrador && borrador.proyectos) || [];
    var problemas = window.ReglasContenido.validar(borrador, window.ReglasContenido.CATEGORIAS);
    if (!lista.length) problemas = problemas.concat(['no hay ningún proyecto que publicar']);
    return problemas;
  }

  function pintar(els, estado, acciones) {
    var cambios = window.Cambios.entre(estado.borrador, estado.publicado);
    els.cambios.textContent = window.Cambios.resumir(cambios);

    var problemas = problemasDe(estado.borrador);
    var impedimentos = [];
    /* Guardar va primero porque se arregla sin salir de esta pantalla: el
       botón de guardar está a la vista, mientras que corregir una ficha obliga
       a irse a otra pantalla y volver. */
    if (estado.hayCambiosSinGuardar) {
      impedimentos.push('tienes cambios sin guardar, y se publica lo guardado: '
        + 'guárdalos antes');
    }
    if (problemas.length) {
      impedimentos.push('el contenido no se puede publicar todavía — '
        + problemas.join('; '));
    }

    els.falta.textContent = impedimentos.length
      ? 'Antes de publicar: ' + impedimentos.join('. ') + '.'
      : '';
    els.aviso.textContent = estado.aviso || '';

    /* Sin cambios el botón NO se apaga: publicar lo mismo es inofensivo, y
       apagarlo obligaría a explicar la diferencia entre «no puedes» y «no hace
       falta». El resumen ya dice que no hay nada. */
    els.boton.disabled = !!(impedimentos.length || estado.bloqueado);

    /* `onclick` y no addEventListener: este nodo viene del HTML de la página y
       no se reconstruye al repintar, así que un oyente por pintado se apilaría
       y a la tercera visita un clic publicaría tres veces. Asignar reemplaza. */
    els.boton.onclick = function () { acciones.alPublicar(); };
  }

  return { pintar: pintar, problemasDe: problemasDe };
})();
