window.Rutas = (function () {

  /* Devuelve siempre un objeto nuevo: quien lo reciba puede guardárselo sin
     miedo a que la siguiente llamada le cambie el de antes por debajo. */
  function lista() { return { pantalla: 'lista', id: null }; }

  /* decodeURIComponent lanza con un escape mal formado («%», «%zz»). Un
     fragmento mal pegado no puede tirar el panel entero, así que se trata
     como lo que es: una dirección que no se reconoce. */
  function descodificar(trozo) {
    try {
      return decodeURIComponent(trozo);
    } catch (e) {
      return null;
    }
  }

  function leer(hash) {
    var texto = String(hash == null ? '' : hash);
    /* Se quitan el «#» y la «/» de delante, y también la de detrás: los
       navegadores y los gestores de enlaces añaden barras finales al copiar
       una dirección, y no significan nada distinto. */
    var cuerpo = texto.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '');
    if (!cuerpo) return lista();

    var trozos = cuerpo.split('/');
    if (trozos[0] === 'publicar' && trozos.length === 1) {
      return { pantalla: 'publicar', id: null };
    }
    if (trozos[0] === 'proyecto' && trozos.length === 2) {
      var id = descodificar(trozos[1]);
      if (!id) return lista();
      return { pantalla: 'proyecto', id: id };
    }
    return lista();
  }

  function hacia(pantalla, id) {
    if (pantalla === 'proyecto') return '#/proyecto/' + encodeURIComponent(id);
    if (pantalla === 'publicar') return '#/publicar';
    return '#/';
  }

  return { leer: leer, hacia: hacia };
})();
