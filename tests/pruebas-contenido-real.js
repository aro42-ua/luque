/* El contenido.json de verdad, no un ejemplo escrito a mano.

   Antes del bloque 2 el arnés comprobaba los doce proyectos reales, porque
   vivían dentro de js/datos.js y estaban ahí al cargar. Al mudarlos a un
   archivo que llega por red, esa comprobación se perdió sin sustituto: el
   arnés pasaba a examinar sólo ejemplos inventados en las propias pruebas.
   Esto la recupera, y de paso vigila lo que un ejemplo nunca habría cazado. */
describeAsync('El contenido real', function () {
  return fetch('../contenido.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('contenido.json respondió ' + r.status);
      return r.json();
    })
    .then(function (datos) {

      prueba('pasa su propia validación', function () {
        igual(Contenido.validar(datos), []);
      });

      prueba('trae algún proyecto', function () {
        cierto(datos.proyectos.length > 0, 'la lista está vacía');
      });

      var fotos = datos.proyectos.filter(function (p) { return p.tipo === 'fotos'; });

      /* Éste es el que faltaba el día que la galería empezó a pedir doce
         piezas a 2400×3000. Mientras la portada sea un archivo distinto de las
         piezas, no se puede volver a colar la de tamaño completo por descuido. */
      prueba('ninguna portada es una de las piezas', function () {
        fotos.forEach(function (p) {
          var urls = p.piezas.map(function (pieza) { return pieza.url; });
          cierto(urls.indexOf(p.portada) === -1,
                 p.id + ': la portada es la pieza a tamaño completo');
        });
      });

      prueba('cada pieza trae miniatura propia', function () {
        fotos.forEach(function (p) {
          p.piezas.forEach(function (pieza, i) {
            cierto(pieza.miniatura, p.id + ': la pieza n.º ' + (i + 1) + ' no trae miniatura');
            cierto(pieza.miniatura !== pieza.url,
                   p.id + ': la miniatura n.º ' + (i + 1) + ' es la pieza entera');
          });
        });
      });

      /* La web se sirve por https: una sola imagen por http la marca como no
         segura entera, y el navegador puede llegar a no pintarla. */
      prueba('todas las imágenes se piden por https', function () {
        datos.proyectos.forEach(function (p) {
          var urls = [p.portada, p.poster].concat(
            (p.piezas || []).map(function (x) { return x.url; }),
            (p.piezas || []).map(function (x) { return x.miniatura; })
          );
          urls.filter(Boolean).forEach(function (u) {
            cierto(u.indexOf('http://') !== 0, p.id + ': ' + u + ' no es https');
          });
        });
      });
    });
});
