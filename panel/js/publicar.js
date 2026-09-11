/* Lo que hace falta para publicar desde el panel: el estado de esa pantalla
   —qué hay en la web ahora, qué se está avisando, y si un choque de versión ha
   dejado el botón apagado— y qué pasa al pulsar.

   Vive aquí y no en panel.js porque panel.js es el arranque y ya lleva encima
   el enrutado de tres pantallas: con esto dentro cruzaba las 300 líneas del
   criterio de aceptación 11. Pintar es de pantalla-publicar.js y hablar con el
   servidor es de publicacion.js; esto es lo que los junta. */
window.Publicar = (function () {

  /* `leerBorrador` y `hayCambios` se reciben como funciones y no como valores
     porque el borrador cambia por debajo —se edita en otra pantalla, se
     guarda— y una copia tomada al crear esto estaría vieja en el momento que
     más importa: justo antes de pulsar el botón. */
  function crear(els, leerBorrador, hayCambios) {
    var publicado = null;
    var aviso = '';
    var bloqueado = false;

    function repintar() {
      window.PantallaPublicar.pintar(els, {
        borrador: leerBorrador(), publicado: publicado,
        hayCambiosSinGuardar: hayCambios(),
        aviso: aviso, bloqueado: bloqueado
      }, { alPublicar: ahora });
    }

    function ahora() {
      /* Se pregunta siempre, sin distinguir casos: es la única acción del
         panel que se ve desde fuera y la única sin deshacer —republicar lo
         anterior no se puede desde aquí, porque el borrador ya es el nuevo—.
         Distinguir casos serían dos caminos, y el que se usa menos es el que
         se rompe. */
      if (!window.confirm('Se va a copiar lo guardado sobre la web pública. '
          + '¿Publicar ahora?')) return;

      var trabajo = leerBorrador();
      aviso = 'Publicando…';
      repintar();
      window.Publicacion.publicar(trabajo.version, function (r, error) {
        if (error) { aviso = error; return repintar(); }
        if (r.conflicto) {
          /* El mismo criterio que al guardar, y por el mismo motivo:
             reintentar mandaría la misma versión vieja, el servidor volvería a
             contestar 409, y así en bucle. Tampoco se actualiza la versión al
             vuelo: eso haría que el segundo intento «funcionara» publicando
             por encima del trabajo de la otra persona sin que el servidor lo
             vuelva a detectar como conflicto. */
          bloqueado = true;
          aviso = 'Alguien ha guardado mientras mirabas esto (el servidor va por la '
            + 'versión ' + r.guardada + '). Publicar ahora pondría en la web algo que no es '
            + 'lo que estás viendo: por eso el botón se ha desactivado. Recarga la página.';
          return repintar();
        }
        if (r.problemas) {
          /* El panel valida con las mismas reglas, así que llegar aquí
             significa que se le escapó algo. Se enseña entera: es la lista del
             Worker, que es quien manda. */
          aviso = 'El servidor no ha podido publicarlo: ' + r.problemas.join('; ') + '.';
          return repintar();
        }
        /* Lo publicado pasa a ser lo que se acaba de mandar, sin volver a
           pedir contenido.json: en la red de Cloudflare la copia recién
           escrita puede tardar en verse, y volver a pedirla diría que queda
           por publicar justo lo que se acaba de publicar. */
        publicado = JSON.parse(JSON.stringify(trabajo));
        aviso = 'Publicado. La web ya enseña esto (versión ' + r.version + ').';
        repintar();
      });
    }

    /* Lo publicado se pide CADA VEZ que se entra: entre dos visitas puede
       haber publicado la otra persona, y un resumen calculado contra lo de
       hace media hora diría que entra algo que ya está. */
    function entrar() {
      aviso = '';
      repintar();
      window.Publicacion.publicado(function (datos, error) {
        publicado = datos;
        if (error) aviso = error;
        repintar();
      });
    }

    return { entrar: entrar, repintar: repintar };
  }

  return { crear: crear };
})();
