(function () {
  var trabajo = null;      // { version, proyectos }
  var elLista, elAviso, elTitulo, elCategoria, elCrear, elGuardar;

  function avisar(texto) { elAviso.textContent = texto; }

  /* Activa o desactiva lo que necesita `trabajo` para funcionar. Se llama
     deshabilitado desde el arranque, antes de que Borrador.cargar resuelva:
     sin esto, el caso más probable en producción —la sesión de Access
     caducó de un día para otro— deja el formulario y "Guardar" activos
     delante de un `trabajo` que sigue siendo `null`, y la primera pulsación
     revienta con una excepción muda. Si `cargar` falla, se queda así:
     deshabilitado, con el aviso explicando por qué. */
  function activarControles(activo) {
    elTitulo.disabled = !activo;
    elCategoria.disabled = !activo;
    elCrear.disabled = !activo;
    elGuardar.disabled = !activo;
  }

  /* Tras un repintado los nodos del <ol> son todos nuevos —Lista.pintar hace
     innerHTML = '' y reconstruye—, así que el elemento que tenía el foco ya
     no existe y el navegador lo manda a <body>. Lo único que sobrevive al
     repintado es el `id` del proyecto, así que es lo que usamos para
     encontrar dónde debe volver el foco.

     `foco` es opcional:
       - { id: idProyecto, accion: 'subir'|'bajar'|'borrar' } para el botón
         de esa fila. Si ese botón ha quedado deshabilitado por llegar al
         extremo (subir en la primera fila, bajar en la última), se usa el
         otro botón de la misma fila, que sigue siendo útil.
       - { titulo: true } para el campo de título del formulario, cuando la
         lista se ha quedado vacía y no hay ninguna fila a la que volver. */
  function enfocarTrasRepintar(foco) {
    if (!foco) return;
    if (foco.titulo) {
      elTitulo.focus();
      return;
    }
    var fila = elLista.querySelector('[data-id="' + foco.id + '"]');
    if (!fila) return;
    var boton = fila.querySelector('[data-accion="' + foco.accion + '"]');
    if (boton && !boton.disabled) {
      boton.focus();
      return;
    }
    var otraAccion = foco.accion === 'subir' ? 'bajar' : 'subir';
    var alternativo = fila.querySelector('[data-accion="' + otraAccion + '"]');
    if (alternativo) alternativo.focus();
  }

  /* Tras borrar, decide a qué fila vuelve el foco: la que ahora ocupa la
     posición de la borrada, o la anterior si se borró la última. Si la
     lista se queda vacía no hay fila posible, y el foco va al título. */
  function focoTrasBorrar(indiceBorrado) {
    if (trabajo.proyectos.length === 0) return { titulo: true };
    var indice = Math.min(indiceBorrado, trabajo.proyectos.length - 1);
    return { id: trabajo.proyectos[indice].id, accion: 'borrar' };
  }

  function repintar(foco) {
    window.Lista.pintar(elLista, trabajo.proyectos, function (desde, hasta) {
      var id = trabajo.proyectos[desde].id;
      var accion = hasta < desde ? 'subir' : 'bajar';
      trabajo.proyectos = window.Orden.mover(trabajo.proyectos, desde, hasta);
      repintar({ id: id, accion: accion });
      avisar('Orden cambiado. Recuerda guardar.');
    }, function (id, titulo) {
      if (!window.confirm('¿Borrar «' + titulo + '»? No se puede deshacer sin recargar.')) return;
      var indice = -1, i;
      for (i = 0; i < trabajo.proyectos.length; i++) {
        if (trabajo.proyectos[i].id === id) { indice = i; break; }
      }
      trabajo.proyectos = trabajo.proyectos.filter(function (p) { return p.id !== id; });
      repintar(focoTrasBorrar(indice));
      avisar('Proyecto borrado. Recuerda guardar.');
    });
    enfocarTrasRepintar(foco);
  }

  function crear(titulo, categoria) {
    if (!trabajo) return;
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
    if (!trabajo) return;
    window.Borrador.guardar(trabajo, function (resultado, error) {
      if (error) return avisar(error);
      if (resultado.conflicto) {
        /* No basta con avisar: si "Guardar" sigue activo, volver a pulsarlo
           manda la misma versión vieja y el servidor vuelve a contestar 409,
           en bucle, sin más salida que recargar —que es justo la única
           salida real, así que se deshabilita hasta entonces—.

           Tampoco se actualiza `trabajo.version` al valor que devuelve el
           servidor: hacerlo dejaría que un segundo intento "tuviera éxito",
           pero ese éxito sería sobrescribir en silencio el trabajo de la
           otra persona sin que el servidor lo vuelva a detectar como
           conflicto. Recargar trae los datos de verdad, no sólo el número
           de versión. */
        elGuardar.disabled = true;
        return avisar('Alguien ha guardado mientras editabas (el servidor va por la versión '
          + resultado.guardada + '). Si guardaras ahora, sobrescribirías su trabajo: por eso '
          + '«Guardar» se ha desactivado. Recarga la página para ver lo último — recargar '
          + 'descarta los cambios que tú no hayas guardado todavía, así que cópialos antes si '
          + 'los necesitas.');
      }
      trabajo.version = resultado.version;
      avisar('Guardado.');
    });
  }

  function init() {
    elLista = document.getElementById('lista');
    elAviso = document.getElementById('aviso');
    elTitulo = document.getElementById('titulo');
    elCategoria = document.getElementById('categoria');
    elCrear = document.querySelector('#nuevo button[type="submit"]');
    elGuardar = document.getElementById('guardar');

    /* Deshabilitado desde el primer pintado: todavía no hay `trabajo`. */
    activarControles(false);

    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      elCategoria.appendChild(o);
    });

    document.getElementById('nuevo').addEventListener('submit', function (e) {
      e.preventDefault();
      crear(elTitulo.value.trim(), elCategoria.value);
      elTitulo.value = '';
    });

    elGuardar.addEventListener('click', guardar);

    window.Borrador.cargar(function (datos, error) {
      if (error) return avisar(error);
      trabajo = datos;
      activarControles(true);
      repintar();
    });
  }

  init();
})();
