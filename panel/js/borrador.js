window.Borrador = (function () {
  var RUTA = '/api/borrador';

  /* Nunca lanza: quien llama recibe siempre un error en castellano que se pueda
     enseñar. Un panel que se queda mudo delante de un fallo es peor que uno que
     dice "no se ha podido": la fotógrafa necesita saber si su trabajo está a
     salvo o no.

     Y lo que se le enseña lo escribimos nosotros. `e.message` no vale: es texto
     del motor y en inglés —«Failed to fetch», «Unexpected token '<'»—. El
     detalle técnico se queda en `console.error`, que es donde sirve para
     diagnosticar. Es el mismo reparto que hace `fallo()` en el Worker
     (worker/src/index.js): mensaje nuestro fuera, detalle ajeno al registro. */

  var SIN_RED = 'no se ha podido contactar con el servidor';
  /* El caso más probable de todos: alguien deja el panel abierto, la sesión de
     Access caduca, y al volver el servidor contesta la página de inicio de
     sesión, que es HTML y no JSON. Decir «Unexpected token '<'» sería esconder
     lo único que le sirve a quien lo lee: que vuelva a entrar. */
  var SESION = 'la sesión pudo haber caducado: vuelve a iniciar sesión y repítelo';

  /* Excepción con el mensaje ya redactado por nosotros. Se distingue de
     cualquier otra, que sale con mensaje propio y detalle sólo en el registro. */
  function Legible(mensaje) { this.mensaje = mensaje; }

  function registrar(que, detalle) {
    console.error('Borrador: ' + que + (detalle ? ': ' + detalle : ''));
  }

  function frase(texto) {
    return /[.!?]$/.test(texto) ? texto : texto + '.';
  }

  /* Se lee como texto y se parsea a mano, en vez de llamar a `r.json()`, para
     poder distinguir «el servidor mandó algo que no es JSON» —sesión caducada—
     de «el servidor mandó un error». `r.json()` funde los dos casos en un
     SyntaxError en inglés. */
  function leer(r) {
    return r.text().then(function (texto) {
      try {
        return { estado: r.status, cuerpo: JSON.parse(texto) };
      } catch (e) {
        registrar('el servidor respondió ' + r.status + ' con algo que no es JSON',
          String(texto).slice(0, 200));
        throw new Legible(SESION);
      }
    });
  }

  /* El Worker manda `{error}` en castellano y bien redactado —un 500 al leer
     dice «no se pudo leer el borrador guardado»—: tirarlo para poner el número
     del estado sería perder la única frase que explica qué pasó. */
  function delServidor(metodo, res) {
    registrar(metodo + ' respondió ' + res.estado, res.cuerpo.error);
    return new Legible(res.cuerpo.error || 'el servidor respondió ' + res.estado);
  }

  function motivo(e) {
    if (e instanceof Legible) return frase(e.mensaje);
    /* Ni llegó, o se cortó a mitad. Lo único que hay que saber fuera. */
    registrar('la petición no llegó a completarse', e && e.message);
    return frase(SIN_RED);
  }

  function cargar(alTerminar) {
    fetch(RUTA, { cache: 'no-cache', credentials: 'same-origin' })
      .then(leer)
      .then(function (res) {
        if (res.estado === 200) return res.cuerpo;
        throw delServidor('GET', { estado: res.estado, cuerpo: res.cuerpo || {} });
      })
      .then(
        function (datos) { alTerminar(datos, null); },
        /* Dos argumentos y no un `.catch()` colgando: así este manejador NO ve
           lo que lance `alTerminar`. Con el catch, un fallo de pintado de quien
           llama volvía a invocar su propio callback con un error de red
           inventado —dos llamadas, la segunda mintiendo—, y se buscaba en la
           red durante horas un bug que estaba en la pantalla. */
        function (e) {
          alTerminar(null, 'No se ha podido cargar el contenido: ' + motivo(e));
        }
      );
  }

  function guardar(datos, alTerminar) {
    fetch(RUTA, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(leer)
      .then(function (res) {
        var cuerpo = res.cuerpo || {};
        if (res.estado === 200) return { version: cuerpo.version };
        /* 409 no es un error del que guarda: es que el otro llegó antes. Se
           distingue del 400 porque tiene salida —recargar y repetir— mientras
           que un 400 significa que el panel mandó algo mal formado. Por eso
           vuelve como resultado y no como error. */
        if (res.estado === 409) {
          return { conflicto: true, guardada: cuerpo.guardada };
        }
        /* Un 400 es un fallo nuestro, no de quien escribe: `delServidor` lo
           deja en el registro además de avisar, que es lo que hace falta para
           poder arreglarlo. */
        throw delServidor('PUT', { estado: res.estado, cuerpo: cuerpo });
      })
      .then(
        function (resultado) { alTerminar(resultado, null); },
        /* Igual que en `cargar`, y aquí importa el doble: la cola promete que
           lo escrito sigue estando, que es lo primero que necesita saber quien
           acaba de ver fallar un guardado. */
        function (e) {
          alTerminar(null, 'No se ha podido guardar: ' + motivo(e)
            + ' Lo que has escrito sigue aquí.');
        }
      );
  }

  return { cargar: cargar, guardar: guardar, RUTA: RUTA };
})();
