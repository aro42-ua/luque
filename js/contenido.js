window.Contenido = (function () {
  var RUTA = 'contenido.json';

  function validar(datos) {
    var problemas = [];
    if (!datos || Object.prototype.toString.call(datos.proyectos) !== '[object Array]') {
      return ['el contenido no trae una lista de proyectos'];
    }
    var cats = window.Datos.CATEGORIAS;
    var vistos = {};
    datos.proyectos.forEach(function (p, i) {
      var donde = p && p.id ? p.id : 'el proyecto n.º ' + (i + 1);
      if (!p.id)      problemas.push(donde + ': sin identificador');
      if (!p.titulo)  problemas.push(donde + ': sin título');
      if (vistos[p.id]) problemas.push('identificador repetido: ' + p.id);
      vistos[p.id] = true;
      if (cats.indexOf(p.id) !== -1) problemas.push('el id choca con una categoría: ' + p.id);
      if (cats.indexOf(p.categoria) === -1) problemas.push(donde + ': categoría desconocida: ' + p.categoria);
      if (p.tipo === 'fotos') {
        if (!p.piezas || !p.piezas.length) problemas.push(donde + ': sin piezas');
        /* La portada es su propia imagen, más pequeña: la galería enseña doce a
           la vez y pedirlas a tamaño completo cuesta once veces más. La calidad
           se reserva para piezas[].url, que es lo que abre el visor. */
        if (!p.portada) problemas.push(donde + ': sin portada');
        (p.piezas || []).forEach(function (pieza, j) {
          if (!pieza || !pieza.url) problemas.push(donde + ': la pieza n.º ' + (j + 1) + ' no trae url');
        });
      } else if (p.tipo === 'video') {
        if (!p.poster) problemas.push(donde + ': un proyecto de vídeo necesita poster');
      } else {
        problemas.push(donde + ': tipo desconocido: ' + p.tipo);
      }
    });
    return problemas;
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
