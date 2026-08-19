window.Contenido = (function () {
  var RUTA = 'contenido.json';

  /* Las reglas viven en reglas-contenido.js, que cargan tanto el navegador
     como el Worker: aquí sólo se les pasan las categorías, porque en el
     Worker no hay window.Datos. */
  function validar(datos) {
    return window.ReglasContenido.validar(datos, window.Datos.CATEGORIAS);
  }

  /* Pide el contenido y NUNCA lanza: el que llama recibe siempre una lista y,
     si algo fue mal, un motivo en castellano que se pueda enseñar en pantalla.
     Una galería a medias sería peor que una galería vacía y honesta. */
  function cargar(alTerminar) {
    fetch(RUTA, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('el servidor respondió ' + r.status);
        return r.json();
      })
      .then(function (datos) {
        var problemas = validar(datos);
        if (problemas.length) {
          alTerminar([], 'El contenido tiene errores: ' + problemas.join('; '));
        } else {
          alTerminar(datos.proyectos, null);
        }
      })
      .catch(function (e) {
        alTerminar([], 'No se ha podido cargar el contenido: ' + e.message);
      });
  }

  return { cargar: cargar, validar: validar, RUTA: RUTA };
})();
