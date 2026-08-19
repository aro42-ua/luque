window.Datos = (function () {
  var CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

  var PROYECTOS = [];

  /* Los proyectos ya no viven aquí: llegan de contenido.json. Este módulo pasa
     de contenerlos a custodiarlos, que es lo que permite que el panel de
     administración los cambie sin tocar código. */
  function establecer(proyectos) {
    PROYECTOS.length = 0;
    proyectos.forEach(function (p) { PROYECTOS.push(p); });
    /* La portada tiene imagen propia, más ligera que las piezas: se resuelve
       una sola vez aquí para que el resto del sitio siga leyendo p.portadaUrl. */
    PROYECTOS.forEach(function (p) {
      p.portadaUrl = (p.tipo === 'video') ? p.poster : p.portada;
    });
  }

  function porId(id) {
    for (var i = 0; i < PROYECTOS.length; i++) {
      if (PROYECTOS[i].id === id) return PROYECTOS[i];
    }
    return null;
  }

  function porCategoria(categoria) {
    return PROYECTOS.filter(function (p) { return p.categoria === categoria; });
  }

  return {
    CATEGORIAS: CATEGORIAS,
    PROYECTOS: PROYECTOS,
    establecer: establecer,
    porId: porId,
    porCategoria: porCategoria
  };
})();
