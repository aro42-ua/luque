(function () {
  var trabajo = null;      // { version, proyectos }
  var elLista, elAviso;

  function avisar(texto) { elAviso.textContent = texto; }

  function repintar() {
    window.Lista.pintar(elLista, trabajo.proyectos, function (desde, hasta) {
      trabajo.proyectos = window.Orden.mover(trabajo.proyectos, desde, hasta);
      repintar();
      avisar('Orden cambiado. Recuerda guardar.');
    }, function (id, titulo) {
      if (!window.confirm('¿Borrar «' + titulo + '»? No se puede deshacer sin recargar.')) return;
      trabajo.proyectos = trabajo.proyectos.filter(function (p) { return p.id !== id; });
      repintar();
      avisar('Proyecto borrado. Recuerda guardar.');
    });
  }

  function crear(titulo, categoria) {
    var id = window.Identificador.desde(titulo);
    var ids = trabajo.proyectos.map(function (p) { return p.id; });
    var problema = window.Identificador.problema(id, ids, window.ReglasContenido.CATEGORIAS);
    if (problema) return avisar(problema);

    /* Nace sin piezas ni portada a propósito: las pone el bloque 3c. Hasta
       entonces el borrador no se podrá publicar, y eso es correcto —publicar
       valida, y un proyecto sin fotos no es publicable—. */
    trabajo.proyectos.push({ id: id, titulo: titulo, categoria: categoria,
                             tipo: 'fotos', ficha: {}, piezas: [] });
    repintar();
    avisar('Proyecto «' + titulo + '» creado. Recuerda guardar.');
  }

  function guardar() {
    window.Borrador.guardar(trabajo, function (resultado, error) {
      if (error) return avisar(error);
      if (resultado.conflicto) {
        return avisar('Alguien ha guardado mientras editabas (el servidor va por la versión '
                      + resultado.guardada + '). Recarga la página para no perder su trabajo.');
      }
      trabajo.version = resultado.version;
      avisar('Guardado.');
    });
  }

  function init() {
    elLista = document.getElementById('lista');
    elAviso = document.getElementById('aviso');

    var select = document.getElementById('categoria');
    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      select.appendChild(o);
    });

    document.getElementById('nuevo').addEventListener('submit', function (e) {
      e.preventDefault();
      crear(document.getElementById('titulo').value.trim(), select.value);
      document.getElementById('titulo').value = '';
    });

    document.getElementById('guardar').addEventListener('click', guardar);

    window.Borrador.cargar(function (datos, error) {
      if (error) return avisar(error);
      trabajo = datos;
      repintar();
    });
  }

  init();
})();
