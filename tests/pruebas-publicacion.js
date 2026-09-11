/* `Publicacion` habla por red, así que se carga dentro de un iframe con
   `fetch` doblado, igual que subida.js. */
describeAsync('Publicacion', function () {
  var MODULOS = ['../panel/js/publicacion.js'];

  function redFalsa(guion) {
    var llamadas = [];
    function doble(url, opciones) {
      llamadas.push({ url: url, metodo: (opciones && opciones.method) || 'GET',
                      cache: opciones && opciones.cache });
      var r = guion[llamadas.length] || { estado: 200, cuerpo: {} };
      if (r.corte) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        status: r.estado,
        text: function () {
          return Promise.resolve(r.texto !== undefined ? r.texto : JSON.stringify(r.cuerpo));
        }
      });
    }
    doble.llamadas = llamadas;
    return doble;
  }

  function con(guion, fn) {
    var red = redFalsa(guion);
    return window.ArnesDom.conDocumento({ scripts: MODULOS, globales: { fetch: red } },
      function (w) { return fn(w, red); });
  }

  function pedirPublicado(w) {
    return new Promise(function (ok) {
      w.Publicacion.publicado(function (datos, error) { ok({ datos: datos, error: error }); });
    });
  }

  function pedirPublicar(w, version) {
    return new Promise(function (ok) {
      w.Publicacion.publicar(version, function (r, error) { ok({ r: r, error: error }); });
    });
  }

  return con({ 1: { estado: 200, cuerpo: { version: 2, proyectos: [] } } }, function (w, red) {
    return pedirPublicado(w).then(function (res) {
      prueba('publicado trae lo que hay en la web', function () {
        igual(res.error, null);
        igual(res.datos.version, 2);
      });

      /* Sin no-cache, el navegador sirve la copia guardada y el resumen dice
         que no ha cambiado nada justo después de publicar. */
      prueba('se pide sin caché, y al mismo archivo que lee la web', function () {
        igual(red.llamadas[0].cache, 'no-cache');
        cierto(red.llamadas[0].url.indexOf('/contenido.json') !== -1, red.llamadas[0].url);
      });
    });
  }).then(function () {
    /* La web sin publicar todavía: contenido.json no existe. No es un error
       que haya que enseñar —es el primer día— y sale como publicado vacío. */
    return con({ 1: { estado: 404, texto: 'No existe esa ruta' } }, function (w) {
      return pedirPublicado(w).then(function (res) {
        prueba('un 404 es «todavía no se ha publicado nada», no un error', function () {
          igual(res.error, null);
          igual(res.datos, { proyectos: [] });
        });
      });
    });
  }).then(function () {
    return con({ 1: { corte: true } }, function (w) {
      return pedirPublicado(w).then(function (res) {
        prueba('la red caída sale como error en castellano', function () {
          igual(res.datos, null);
          cierto(res.error.indexOf('No se ha podido') !== -1, res.error);
        });
      });
    });
  }).then(function () {
    return con({ 1: { estado: 200, cuerpo: { version: 7 } } }, function (w, red) {
      return pedirPublicar(w, 7).then(function (res) {
        prueba('publicar manda POST con la versión', function () {
          igual(red.llamadas[0].metodo, 'POST');
          cierto(red.llamadas[0].url.indexOf('version=7') !== -1, red.llamadas[0].url);
        });

        prueba('un 200 devuelve la versión publicada', function () {
          igual(res.error, null);
          igual(res.r, { version: 7 });
        });
      });
    });
  }).then(function () {
    /* Un 422 no es un fallo del panel: es el Worker diciendo qué le falta al
       contenido. Vuelve como resultado y no como error, igual que el 409 en
       borrador.js, porque tiene salida —arreglarlo— y hay que enseñarlo
       entero. */
    return con({ 1: { estado: 422, cuerpo: { problemas: ['bruma: sin portada'] } } },
      function (w) {
        return pedirPublicar(w, 3).then(function (res) {
          prueba('un 422 vuelve con la lista de problemas, no como error', function () {
            igual(res.error, null);
            igual(res.r.problemas, ['bruma: sin portada']);
          });
        });
      });
  }).then(function () {
    return con({ 1: { estado: 409, cuerpo: { error: 'cambió mientras editabas', guardada: 9 } } },
      function (w) {
        return pedirPublicar(w, 3).then(function (res) {
          prueba('un 409 vuelve como conflicto, con la versión del servidor', function () {
            igual(res.error, null);
            igual(res.r.conflicto, true);
            igual(res.r.guardada, 9);
          });
        });
      });
  }).then(function () {
    return con({ 1: { estado: 500, cuerpo: { error: 'no se pudo publicar' } } }, function (w) {
      return pedirPublicar(w, 3).then(function (res) {
        /* El Worker manda su error en castellano y bien redactado: tirarlo
           para poner el número del estado perdería la única frase que
           explica qué pasó. Mismo criterio que `delServidor` en
           borrador.js. */
        prueba('un 500 enseña la frase del servidor', function () {
          igual(res.r, null);
          cierto(res.error.indexOf('no se pudo publicar') !== -1, res.error);
        });

        /* Lo primero que necesita saber quien ve fallar una publicación es si
           la web ha quedado a medias. No ha quedado: publicar es atómico. */
        prueba('y promete que la web no ha cambiado', function () {
          cierto(res.error.indexOf('no ha cambiado') !== -1, res.error);
        });
      });
    });
  }).then(function () {
    /* Access caducado contesta con la página de inicio de sesión, que no es
       JSON. Distinguirlo del resto es lo que permite decir «vuelve a entrar»
       en vez de «algo falló». */
    return con({ 1: { estado: 200, texto: '<!DOCTYPE html><html>…' } }, function (w) {
      return pedirPublicar(w, 3).then(function (res) {
        prueba('una respuesta que no es JSON se dice como sesión caducada', function () {
          igual(res.r, null);
          cierto(res.error.indexOf('sesión') !== -1, res.error);
        });
      });
    });
  }).then(function () {
    return con({ 1: { corte: true } }, function (w) {
      return pedirPublicar(w, 3).then(function (res) {
        /* La red caída y la sesión caducada son indistinguibles, igual que en
           borrador.js: Access redirige a otro origen y el navegador corta la
           redirección sin CORS, así que llega el mismo TypeError. */
        prueba('la red caída al publicar nombra las dos causas', function () {
          igual(res.r, null);
          cierto(res.error.indexOf('sesión') !== -1, res.error);
          cierto(res.error.indexOf('conexión') !== -1, res.error);
        });
      });
    });
  });
});
