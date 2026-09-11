/* Lo que el panel necesita de la red para publicar: qué hay publicado ahora, y
   publicar. Aparte de borrador.js porque ése ya va por 170 líneas de mensajes
   bien pensados y no hay razón para acercarlo al techo.

   Mismo reparto que allí: mensaje nuestro y en castellano para quien publica,
   detalle del motor en el registro. `e.message` es texto del motor y en inglés
   —«Failed to fetch», «Unexpected token '<'»—, y no se le enseña a nadie. */
window.Publicacion = (function () {
  var RUTA_PUBLICAR = '/api/publicar';
  /* El mismo archivo que lee la web pública, y no una ruta nueva del Worker:
     contenido.json ya es público por definición, pedirlo al mismo origen no
     necesita permisos, y así el panel ve exactamente lo que ve la web. */
  var RUTA_PUBLICADO = '/contenido.json';

  /* La sesión caducada y la red caída son INDISTINGUIBLES aquí, por lo mismo
     que en borrador.js: cuando la sesión de Access ha caducado, Access no
     contesta sino que redirige a otro origen, y el navegador corta esa
     redirección por no llevar CORS. Lo que llega es un TypeError idéntico al
     del cable desenchufado. Por eso el mensaje nombra las dos causas y pone
     primero la acción que arregla la frecuente. */
  var SIN_RED = 'no se pudo contactar con el servidor. Puede que la sesión haya '
              + 'caducado: recarga la página. Si sigue igual, revisa la conexión';

  function registrar(que, detalle) {
    console.error('Publicacion: ' + que + (detalle ? ': ' + detalle : ''));
  }

  /* Se lee como texto y se parsea a mano, en vez de `r.json()`, para poder
     distinguir «el servidor mandó algo que no es JSON» —la página de inicio de
     sesión— de «el servidor mandó un error». `r.json()` funde los dos casos en
     un SyntaxError en inglés. */
  function leer(r) {
    return r.text().then(function (texto) {
      var cuerpo = null;
      try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = null; }
      return { estado: r.status, cuerpo: cuerpo, texto: texto };
    });
  }

  /* Excepción con el mensaje ya redactado por nosotros, para distinguirla del
     TypeError de la red, que sale con mensaje propio. */
  function Legible(mensaje) { this.mensaje = mensaje; }

  function causa(e) {
    return e instanceof Legible ? e.mensaje : SIN_RED;
  }

  function publicado(alTerminar) {
    /* `no-cache` no es opcional: sin él el navegador sirve la copia guardada y
       el resumen dice que no ha cambiado nada justo después de publicar. */
    fetch(RUTA_PUBLICADO, { cache: 'no-cache', credentials: 'same-origin' })
      .then(leer)
      .then(function (res) {
        /* Que contenido.json no exista es el primer día, no un fallo: la web
           todavía no se ha publicado nunca. Se contesta un publicado vacío
           para que el resumen diga «entran todos», que es la verdad. */
        if (res.estado === 404) return { proyectos: [] };
        if (res.estado === 200 && res.cuerpo) return res.cuerpo;
        registrar('GET contenido.json respondió ' + res.estado,
          String(res.texto).slice(0, 200));
        throw new Legible('el servidor respondió ' + res.estado);
      })
      .then(
        function (datos) { alTerminar(datos, null); },
        /* Dos argumentos y no un `.catch()` colgando, igual que en
           borrador.js: así este manejador no ve lo que lance `alTerminar`, y
           un fallo de pintado de quien llama no vuelve disfrazado de error de
           red —dos llamadas, la segunda mintiendo—. */
        function (e) {
          if (!(e instanceof Legible)) registrar('la petición no llegó a completarse', e && e.message);
          alTerminar(null, 'No se ha podido leer lo que hay publicado ahora mismo: '
            + causa(e) + '. Sin eso no se puede decir qué cambiaría.');
        }
      );
  }

  function publicar(version, alTerminar) {
    fetch(RUTA_PUBLICAR + '?version=' + encodeURIComponent(version), {
      method: 'POST', credentials: 'same-origin'
    })
      .then(leer)
      .then(function (res) {
        /* Sin cuerpo JSON es la página de inicio de sesión de Access. Aquí sí
           se puede decir con seguridad qué pasó, y por eso el mensaje no
           duda. */
        if (!res.cuerpo) {
          registrar('POST publicar respondió ' + res.estado + ' con algo que no es JSON',
            String(res.texto).slice(0, 200));
          throw new Legible('la sesión ha caducado: vuelve a entrar y repítelo');
        }
        if (res.estado === 200) return { version: res.cuerpo.version };
        /* 422 no es un fallo del panel: es el Worker diciendo qué le falta al
           contenido. Vuelve como resultado y no como error, igual que el 409,
           porque tiene salida —arreglarlo— y hay que enseñarlo entero. */
        if (res.estado === 422) return { problemas: res.cuerpo.problemas || [] };
        if (res.estado === 409) {
          return { conflicto: true, guardada: res.cuerpo.guardada };
        }
        registrar('POST publicar respondió ' + res.estado, res.cuerpo.error);
        /* El Worker redacta su error en castellano —un 500 dice «no se pudo
           publicar»—: tirarlo para poner el número del estado perdería la
           única frase que explica qué pasó. */
        throw new Legible(res.cuerpo.error || 'el servidor respondió ' + res.estado);
      })
      .then(
        function (resultado) { alTerminar(resultado, null); },
        function (e) {
          if (!(e instanceof Legible)) registrar('la petición no llegó a completarse', e && e.message);
          /* La promesa de que la web sigue igual va en el mismo mensaje: es lo
             primero que necesita saber quien ve fallar una publicación, y es
             verdad porque publicar es atómico —contenido.json se escribe una
             sola vez, y sólo si el borrador entero es válido—. */
          alTerminar(null, 'No se ha podido publicar: ' + causa(e)
            + '. Lo que hay en la web no ha cambiado.');
        }
      );
  }

  return { publicado: publicado, publicar: publicar,
           RUTA_PUBLICAR: RUTA_PUBLICAR, RUTA_PUBLICADO: RUTA_PUBLICADO };
})();
