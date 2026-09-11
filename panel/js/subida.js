/* Sube una fotografía en sus tres medidas. Reducir es de `imagenes.js`; aquí
   está el nombre que va a R2, el orden de las subidas y qué se hace cuando una
   falla. */
window.Subida = (function () {
  var RUTA = '/api/imagen';
  /* El Worker rechaza con 400 los nombres de más de 200 caracteres, y el
     nombre del archivo es sólo una parte de la llave. Este tope deja sitio de
     sobra para el id, el sello y el sufijo. */
  var TOPE_ARCHIVO = 120;
  /* Un 409 es «esa llave ya existe». Dos intentos más con sello nuevo es de
     sobra —el sello lleva la hora dentro— y pone un final a la recursión. */
  var REINTENTOS = 2;

  /* Mismo reparto que borrador.js: mensaje nuestro y en castellano para quien
     sube, detalle del motor en el registro. Y la misma advertencia — la sesión
     caducada y la red caída llegan aquí como el MISMO TypeError, porque Access
     redirige a otro origen y el navegador corta la redirección sin CORS. Por
     eso el mensaje nombra las dos y pone primero la que se arregla. */
  var SIN_RED = 'no se pudo contactar con el servidor. Puede que la sesión haya '
              + 'caducado: vuelve a entrar en otra pestaña. Si sigue igual, revisa la conexión';

  /* Un contador que sólo sube. Es lo que garantiza que dos sellos de ESTA
     página nunca sean iguales, y hace falta: la hora sola no basta —treinta
     fotos seguidas caen en el mismo milisegundo— y el azar solo tampoco.
     La primera versión de esto era hora + dos caracteres de azar, y la prueba
     de los mil sellos la tumbó en el acto: con 1296 valores posibles, mil
     sellos del mismo milisegundo colisionan casi seguro. */
  var siguiente = 0;

  /* No es criptográfico ni falta: sólo tiene que evitar que dos subidas
     choquen en la misma llave. El contador separa las de esta página, la hora
     separa dos cargas de la página, y el azar separa dos pestañas abiertas a
     la vez —que comparten hora y empiezan las dos a contar desde cero—. */
  function sello() {
    siguiente += 1;
    return Date.now().toString(36) + siguiente.toString(36)
      + Math.floor(Math.random() * 1296).toString(36);
  }

  function sinExtension(nombreArchivo) {
    var punto = String(nombreArchivo).lastIndexOf('.');
    return punto <= 0 ? String(nombreArchivo) : String(nombreArchivo).slice(0, punto);
  }

  /* Se sanea aquí, con el mismo `Identificador.desde` que saca el id de un
     título, para que lo que el panel cree haber subido y lo que R2 guarde sean
     la misma cadena. El Worker vuelve a sanear por su cuenta —no se fía del
     cliente, y hace bien—, pero si el panel mandara algo que el Worker
     transforma, la url que se apunta en la pieza no sería la que responde. */
  function nombre(id, archivo, sufijo, elSello) {
    var base = window.Identificador.desde(sinExtension((archivo && archivo.name) || ''));
    if (!base) base = 'foto';
    if (base.length > TOPE_ARCHIVO) base = base.slice(0, TOPE_ARCHIVO).replace(/-+$/, '');
    return id + '-' + base + '-' + elSello + '-' + sufijo + '.jpg';
  }

  function mandar(llave, blob) {
    return fetch(RUTA + '?nombre=' + encodeURIComponent(llave), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'image/jpeg' },
      body: blob
    }).then(function (r) {
      return r.text().then(function (texto) {
        var cuerpo;
        try {
          cuerpo = JSON.parse(texto);
        } catch (e) {
          console.error('Subida: el servidor respondió ' + r.status
            + ' con algo que no es JSON: ' + String(texto).slice(0, 200));
          throw { estado: r.status, motivo: 'la sesión ha caducado: vuelve a entrar' };
        }
        if (r.status === 200) return cuerpo.url;
        throw { estado: r.status,
                motivo: cuerpo.error || ('el servidor respondió ' + r.status) };
      });
    }, function (e) {
      console.error('Subida: la petición no llegó a completarse: ' + (e && e.message));
      throw { estado: 0, motivo: SIN_RED };
    });
  }

  /* Las tres medidas de una foto se suben con el MISMO sello: así, mirando el
     bucket, se sabe qué tres archivos son la misma fotografía. Un 409 en
     cualquiera de las tres reintenta las tres con sello nuevo, y no sólo la
     que chocó, justamente para no romper eso. */
  function unaFoto(id, archivo, elSello, quedan) {
    var urls = {};
    var cadena = window.Imagenes.MEDIDAS.reduce(function (antes, medida) {
      return antes.then(function () {
        return new Promise(function (ok, mal) {
          window.Imagenes.reducir(archivo, medida.cota, function (blob, error) {
            if (error) return mal({ estado: 0, motivo: error });
            ok(blob);
          });
        });
      }).then(function (blob) {
        return mandar(nombre(id, archivo, medida.sufijo, elSello), blob);
      }).then(function (url) {
        urls[medida.nombre] = url;
      });
    }, Promise.resolve());

    return cadena.then(function () {
      return { url: urls.pieza, miniatura: urls.miniatura, portada: urls.portada };
    }, function (fallo) {
      /* El Worker nunca pisa una llave que ya existe: contesta 409. La salida
         no es rendirse sino apartarse, que es para lo que existe el sello. */
      if (fallo && fallo.estado === 409 && quedan > 0) {
        return unaFoto(id, archivo, sello(), quedan - 1);
      }
      throw fallo;
    });
  }

  /* Una a una y no todas a la vez: treinta fotos en paralelo son treinta
     mapas de bits de 50 MB descodificados a la vez, y el navegador se queda
     sin memoria a la mitad. En serie, cada una se libera antes de la
     siguiente. La contrapartida es que tarda más, y por eso hay `alProgreso`.

     Criterio de aceptación 10: una que falla no arrastra a las demás. */
  function subir(id, archivos, alProgreso, alTerminar) {
    var lista = Array.prototype.slice.call(archivos || []);
    var piezas = [];
    var fallos = [];

    lista.reduce(function (antes, archivo, i) {
      return antes.then(function () {
        alProgreso({ hecho: i, total: lista.length, archivo: archivo.name || '' });
        return unaFoto(id, archivo, sello(), REINTENTOS).then(function (pieza) {
          piezas.push(pieza);
        }, function (fallo) {
          /* De una foto a medias no se apunta nada: una pieza con dos de sus
             tres urls haría que la galería o el visor pidieran un archivo que
             no está en el bucket. */
          fallos.push({ archivo: archivo.name || 'una foto',
                        motivo: (fallo && fallo.motivo) || 'no se pudo subir' });
        });
      });
    }, Promise.resolve()).then(function () {
      alProgreso({ hecho: lista.length, total: lista.length, archivo: '' });
      alTerminar({ piezas: piezas, fallos: fallos });
    });
  }

  return { subir: subir, nombre: nombre, sello: sello, RUTA: RUTA };
})();
