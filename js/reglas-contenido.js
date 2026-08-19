/* Las reglas de validación, y sólo ellas. Viven aparte porque las usan dos
   sitios: el navegador antes de pintar, y el Worker antes de publicar. Escritas
   dos veces serían dos reglas que se separan sin que nadie se entere. */
(function (raiz) {

  function validar(datos, categorias) {
    var problemas = [];
    if (!datos || Object.prototype.toString.call(datos.proyectos) !== '[object Array]') {
      return ['el contenido no trae una lista de proyectos'];
    }
    var cats = categorias || [];
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

  raiz.ReglasContenido = { validar: validar };
})(typeof window !== 'undefined' ? window : globalThis);
