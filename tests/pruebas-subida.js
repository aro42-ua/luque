describe('Subida.nombre', function () {
  prueba('junta id, archivo saneado, sello y medida', function () {
    igual(Subida.nombre('bruma', { name: 'Portada Final.JPG' }, '3000', 'm8q3x1'),
          'bruma-portada-final-m8q3x1-3000.jpg');
  });

  /* El nombre viaja a R2 como llave, y `nombreSeguro` del Worker lo volvería
     a sanear. Se sanea aquí para que lo que el panel cree haber subido y lo
     que R2 guarde sean la misma cadena: si no, la url que el panel se apunta
     en la pieza no sería la que responde. */
  prueba('los acentos y los espacios no llegan a R2', function () {
    igual(Subida.nombre('bruma', { name: 'Sesión de Otoño.jpeg' }, '250', 'ab12'),
          'bruma-sesion-de-otono-ab12-250.jpg');
  });

  /* Sin nombre utilizable queda un hueco entre guiones; «foto» lo llena para
     que la llave no acabe con dos guiones seguidos y siga siendo legible al
     mirar el bucket. */
  prueba('un archivo sin nombre aprovechable se llama foto', function () {
    igual(Subida.nombre('bruma', { name: '¿?.jpg' }, '3000', 'ab12'),
          'bruma-foto-ab12-3000.jpg');
    igual(Subida.nombre('bruma', {}, '3000', 'ab12'), 'bruma-foto-ab12-3000.jpg');
  });

  /* El Worker rechaza con 400 los nombres de más de 200 caracteres. Un
     nombre de archivo largo es normal al exportar por lotes, y morir en un
     400 opaco por eso sería desconcertante. */
  prueba('un nombre larguísimo se recorta', function () {
    var largo = { name: new Array(400).join('a') + '.jpg' };
    cierto(Subida.nombre('bruma', largo, '3000', 'ab12').length <= 200);
  });
});

describe('Subida.sello', function () {
  prueba('es corto y sólo lleva letras y números', function () {
    var s = Subida.sello();
    cierto(/^[a-z0-9]+$/.test(s), 'el sello era «' + s + '»');
    cierto(s.length <= 16);
  });

  /* No es criptográfico ni falta: sólo tiene que evitar que dos subidas del
     mismo estudio choquen. Mil seguidos sin repetir es de sobra para eso. */
  prueba('mil seguidos no se repiten', function () {
    var vistos = {}, i, s;
    for (i = 0; i < 1000; i++) {
      s = Subida.sello();
      cierto(!vistos[s], 'el sello «' + s + '» salió dos veces');
      vistos[s] = true;
    }
  });
});

/* `subir` habla por red, así que se carga dentro de un iframe con `fetch`
   doblado. Se dobla `fetch` y no `Imagenes`: probar la subida contra un doble
   de nuestra propia reducción comprobaría el doble. */
describeAsync('Subida.subir', function () {
  var MODULOS = ['../panel/js/identificador.js', '../panel/js/imagenes.js',
                 '../panel/js/subida.js'];

  /* 4x2 rojo, el mismo de pruebas-imagenes.js. */
  var PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGP4z8AARwzIHABvqgf5gNwAKAAAAABJRU5ErkJggg==';

  function unaFoto(nombre) {
    return fetch(PNG).then(function (r) { return r.blob(); }).then(function (b) {
      /* Un Blob con `name` encima, en vez de un File: a `subir` sólo le hace
         falta el nombre, y así la prueba no depende del constructor File. */
      b.name = nombre;
      return b;
    });
  }

  /* El doble de fetch. Apunta lo que se le pide y contesta lo que la prueba
     diga; por omisión, 200 con la url que el Worker devolvería. */
  function redFalsa(respuestas) {
    var llamadas = [];
    function doble(url) {
      var nombre = new URL(url, 'https://x/').searchParams.get('nombre');
      llamadas.push(nombre);
      var r = (respuestas || {})[llamadas.length] || { estado: 200 };
      if (r.corte) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        status: r.estado,
        text: function () {
          return Promise.resolve(JSON.stringify(
            r.estado === 200 ? { url: '/img/' + nombre } : { error: r.error || 'no' }));
        }
      });
    }
    doble.llamadas = llamadas;
    return doble;
  }

  function conRed(doble, fn) {
    return ArnesDom.conDocumento({ scripts: MODULOS, globales: { fetch: doble } },
      function (w) { return fn(w); });
  }

  function subir(w, archivos) {
    return new Promise(function (ok) {
      w.Subida.subir('bruma', archivos, function () {}, ok);
    });
  }

  return unaFoto('a.jpg').then(function (foto) {
    var red = redFalsa();
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        prueba('una foto son tres subidas: portada, pieza y miniatura', function () {
          igual(red.llamadas.length, 3);
        });

        prueba('la pieza apunta a las tres urls', function () {
          igual(r.piezas.length, 1);
          cierto(/-3000\.jpg$/.test(r.piezas[0].url), r.piezas[0].url);
          cierto(/-250\.jpg$/.test(r.piezas[0].miniatura), r.piezas[0].miniatura);
          cierto(/-1500\.jpg$/.test(r.piezas[0].portada), r.piezas[0].portada);
        });

        /* Las tres medidas de una misma foto comparten sello: si no, no se
           podría saber mirando el bucket qué tres archivos son la misma
           fotografía. */
        prueba('las tres medidas comparten sello', function () {
          var sellos = red.llamadas.map(function (n) {
            return n.replace(/-(?:1500|3000|250)\.jpg$/, '');
          });
          igual(sellos[0], sellos[1]);
          igual(sellos[1], sellos[2]);
        });

        prueba('sin fallos, la lista de fallos viene vacía', function () {
          igual(r.fallos, []);
        });
      });
    });
  }).then(function () {
    return Promise.all([unaFoto('a.jpg'), unaFoto('b.jpg')]);
  }).then(function (fotos) {
    /* La cuarta llamada es la primera medida de la segunda foto. Criterio de
       aceptación 10: la primera se completa y el panel dice cuál falló. */
    var red = redFalsa({ 4: { estado: 413, error: 'la imagen supera el tamaño máximo de 5 MB' } });
    return conRed(red, function (w) {
      return subir(w, fotos).then(function (r) {
        prueba('una subida que falla no arrastra a las demás', function () {
          igual(r.piezas.length, 1);
          igual(r.fallos.length, 1);
        });

        prueba('el fallo dice de qué archivo es y por qué', function () {
          igual(r.fallos[0].archivo, 'b.jpg');
          cierto(r.fallos[0].motivo.indexOf('5 MB') !== -1, r.fallos[0].motivo);
        });

        /* Una foto a medias no se apunta: si la pieza entrara con dos de sus
           tres urls, la galería o el visor pedirían un archivo que no está. */
        prueba('de la foto que falló no queda ninguna pieza', function () {
          cierto(r.piezas[0].url.indexOf('-a-') !== -1, r.piezas[0].url);
        });
      });
    });
  }).then(function () {
    return unaFoto('a.jpg');
  }).then(function (foto) {
    /* El 409 del Worker es «esa llave ya existe». La salida es otro sello, no
       rendirse: el Worker nunca pisa, así que el panel tiene que apartarse. */
    var red = redFalsa({ 1: { estado: 409, error: 'ya hay una imagen guardada' } });
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        prueba('un 409 se reintenta con otro sello y acaba entrando', function () {
          igual(r.fallos, []);
          igual(r.piezas.length, 1);
          igual(red.llamadas.length, 4);
          cierto(red.llamadas[0] !== red.llamadas[1], 'el sello no cambió');
        });
      });
    });
  }).then(function () {
    return unaFoto('a.jpg');
  }).then(function (foto) {
    var red = redFalsa({ 1: { corte: true } });
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        /* La red caída y la sesión caducada son indistinguibles desde aquí,
           igual que en borrador.js: lo que llega es el mismo TypeError. El
           mensaje nombra las dos y pone primero la acción que arregla la
           frecuente. */
        prueba('la red caída sale como fallo en castellano, no como excepción', function () {
          igual(r.piezas, []);
          igual(r.fallos.length, 1);
          cierto(r.fallos[0].motivo.indexOf('sesión') !== -1, r.fallos[0].motivo);
        });
      });
    });
  });
});
