window.MovilBrillo = (function () {

  /* La foto se dibuja reducida a este lado antes de leerla. 64x64 son 4.096
     pixeles en vez de los 9.000.000 de una pieza de 3000x3000: el navegador
     hace el remuestreo, que es justo lo que se quiere —una media— y lo hace en
     el compositor en vez de en un bucle de JavaScript. */
  var LADO = 64;

  /* Cuanto del lado ocupa la zona que se mira en cada esquina. Un cuarto de 64
     son 16px del lienzo reducido, o sea la cuarta parte de la foto por lado.
     Es lo que hay DEBAJO de las esquinas del encuadre, que es lo que decide si
     se leen; la media de la foto entera responderia a otra pregunta y una foto
     de contraste alto —cielo blanco, primer plano negro— la responderia mal. */
  var ZONA = 0.25;

  /* Coeficientes de BT.709, los mismos del calculo de contraste de WCAG. La
     media plana de R, G y B no vale: el ojo no ve igual los tres canales, y un
     azul saturado saldria mas claro de lo que se ve.

     Cada canal se divide entre 255 ANTES de aplicar su coeficiente, no
     despues de sumarlos. Sumar primero y dividir una sola vez al final
     parece mas directo, pero un blanco puro (255,255,255) da entonces
     0.9999999999999999 en vez de 1: el redondeo de coma flotante de
     0.2126*255 + 0.7152*255 + 0.0722*255 no cae exacto en 255. Dividiendo
     cada canal por separado, blanco da 1 y negro da 0 sin resto. */
  function luminanciaDe(datos) {
    if (!datos || !datos.length) return null;
    var suma = 0, n = 0;
    for (var i = 0; i + 3 < datos.length; i += 4) {
      suma += 0.2126 * (datos[i] / 255) + 0.7152 * (datos[i + 1] / 255) + 0.0722 * (datos[i + 2] / 255);
      n++;
    }
    return n === 0 ? null : suma / n;
  }

  /* Un solo veredicto para las cuatro esquinas: dos negras y dos amarillas se
     leen como un fallo del sitio y no como una decision. Y si una sola zona no
     se pudo medir, el promedio de las otras tres contestaria a una pregunta
     distinta de la que se hizo, asi que se cae al halo. */
  function promedio(valores) {
    if (!valores || !valores.length) return null;
    var suma = 0;
    for (var i = 0; i < valores.length; i++) {
      var v = valores[i];
      if (typeof v !== 'number' || !isFinite(v)) return null;
      suma += v;
    }
    return suma / valores.length;
  }

  /* El unico sitio de todo el repositorio que toca un lienzo. Devuelve la
     funcion `medir` que `Brillo.decidir` lleva esperando desde el bloque 4c:
     alli se decidio recibirla como argumento para poder probar el camino de
     degradacion sin fotos, y esta es la implementacion de verdad.

     La guarda de `complete`/`naturalWidth` LANZA en vez de devolver null a
     proposito. `drawImage` con una imagen a medio cargar no lanza: no dibuja
     nada, y entonces `getImageData` devuelve un lienzo transparente cuya
     luminancia es 0 —«foto oscura»— y las esquinas saldrian amarillas con toda
     confianza sobre una foto de la que no se sabe nada. Lanzando, el caso cae
     donde tiene que caer: en el halo, y con aviso. */
  function medidorDe(img) {
    return function () {
      if (!img || !img.complete || !img.naturalWidth) {
        throw new Error('la foto todavia no esta cargada');
      }
      var lienzo = document.createElement('canvas');
      lienzo.width = LADO;
      lienzo.height = LADO;
      var ctx = lienzo.getContext('2d');
      ctx.drawImage(img, 0, 0, LADO, LADO);

      var z = Math.max(1, Math.round(LADO * ZONA));
      var esquinas = [[0, 0], [LADO - z, 0], [0, LADO - z], [LADO - z, LADO - z]];
      var medidas = esquinas.map(function (e) {
        return luminanciaDe(ctx.getImageData(e[0], e[1], z, z).data);
      });
      return promedio(medidas);
    };
  }

  /* `registrar` es opcional y quien pinta decide como avisa. Este modulo no
     escribe en consola por su cuenta: en `js/` no hay ni una llamada a
     `console`, y meterla aqui la colaria en el unico camino que se ejecuta en
     cada foto del recorrido. */
  function tratamientoDe(img, registrar) {
    return window.Brillo.decidir(medidorDe(img), registrar);
  }

  return {
    LADO: LADO, ZONA: ZONA,
    luminanciaDe: luminanciaDe, promedio: promedio, tratamientoDe: tratamientoDe
  };
})();
