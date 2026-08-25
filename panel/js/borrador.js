window.Borrador = (function () {
  var RUTA = '/api/borrador';

  /* Nunca lanza: quien llama recibe siempre un error en castellano que se pueda
     enseñar. Un panel que se queda mudo delante de un fallo es peor que uno que
     dice "no se ha podido": la fotógrafa necesita saber si su trabajo está a
     salvo o no. */
  function cargar(alTerminar) {
    fetch(RUTA, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('el servidor respondió ' + r.status);
        return r.json();
      })
      .then(function (datos) { alTerminar(datos, null); })
      .catch(function (e) {
        alTerminar(null, 'No se ha podido cargar el contenido: ' + e.message);
      });
  }

  function guardar(datos, alTerminar) {
    fetch(RUTA, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(function (r) {
        return r.json().then(function (cuerpo) { return { estado: r.status, cuerpo: cuerpo }; });
      })
      .then(function (res) {
        if (res.estado === 200) return alTerminar({ version: res.cuerpo.version }, null);
        /* 409 no es un error del que guarda: es que el otro llegó antes. Se
           distingue del 400 porque tiene salida —recargar y repetir— mientras
           que un 400 significa que el panel mandó algo mal formado. */
        if (res.estado === 409) {
          return alTerminar({ conflicto: true, guardada: res.cuerpo.guardada }, null);
        }
        alTerminar(null, res.cuerpo.error || 'No se ha podido guardar.');
      })
      .catch(function (e) {
        alTerminar(null, 'No se ha podido guardar: ' + e.message);
      });
  }

  return { cargar: cargar, guardar: guardar, RUTA: RUTA };
})();
