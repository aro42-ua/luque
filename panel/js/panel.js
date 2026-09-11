(function () {
  var trabajo = null;      // { version, proyectos }
  var elLista, elAviso, elTitulo, elCategoria, elCrear, elGuardar;
  var elCliente, elAnio, elPapel, elEnlace;
  /* Las secciones por nombre, el índice del proyecto abierto, y una copia en
     texto de lo último que el servidor confirmó. */
  var pantallas, elsProyecto, abierto = null, guardado = null;
  /* La pantalla de publicar, que se guarda su propio estado: lo que hay en la
     web ahora, el aviso, y si un choque de version dejo el boton apagado. */
  var publicar;

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
    elCliente.disabled = !activo;
    elAnio.disabled = !activo;
    elPapel.disabled = !activo;
    elEnlace.disabled = !activo;
    elCrear.disabled = !activo;
    elGuardar.disabled = !activo;
  }

  /* Dónde vuelve el foco tras un repintado. Lo que sabe del marcado de una
     fila —[data-id], [data-accion]— se mudó a `Lista.enfocar` en el bloque 3c,
     que es quien escribe ese marcado.

     El caso `{ titulo: true }` se queda aquí a propósito: es del formulario de
     este archivo, y la lista no tiene por qué saber que existe un campo de
     título. Se usa cuando la lista se ha quedado vacía y no hay ninguna fila a
     la que volver. */
  function enfocarTrasRepintar(foco) {
    if (!foco) return;
    if (foco.titulo) {
      elTitulo.focus();
      return;
    }
    window.Lista.enfocar(elLista, foco);
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
    }, function (id) { ir('proyecto', id); });
    enfocarTrasRepintar(foco);
  }

  /* Lo que el aviso de salir necesita saber. Se compara contra una copia de lo
     último que el servidor confirmó, y no con un booleano: un booleano diría
     que hay cambios después de tocar algo y devolverlo a como estaba, y el
     estudio se llevaría un aviso de salida por un cambio que no existe. */
  function hayCambios() {
    return !!trabajo && JSON.stringify(trabajo) !== guardado;
  }

  function buscar(id) {
    for (var i = 0; i < trabajo.proyectos.length; i++) {
      if (trabajo.proyectos[i].id === id) return i;
    }
    return -1;
  }

  function pintarProyecto(indice, foco) {
    abierto = indice;
    window.Proyecto.pintar(elsProyecto, trabajo.proyectos[indice], {
      alCambiar: function (nuevo, focoFotos) {
        trabajo.proyectos[indice] = nuevo;
        pintarProyecto(indice, focoFotos);
        avisar('Cambiado. Recuerda guardar.');
      },
      alSubir: function (archivos) {
        window.Subir.aqui(elsProyecto, trabajo.proyectos[indice], archivos,
          function (nuevo, texto) {
            trabajo.proyectos[indice] = nuevo;
            pintarProyecto(indice);
            avisar(texto);
          });
      }
    });
    window.Fotos.enfocar(elsProyecto.fotos, foco);
  }

  function ir(pantalla, id) {
    if (!trabajo) return;
    if (pantalla === 'publicar') {
      abierto = null;
      window.Pantallas.mostrar(pantallas, 'pantallaPublicar');
      location.hash = window.Rutas.hacia('publicar');
      return publicar.entrar();
    }
    if (pantalla === 'proyecto') {
      var indice = buscar(id);
      /* Un id que no está no puede dejar en pantalla el encabezado de otro
         proyecto: se vuelve a la lista y se dice cuál se buscaba. */
      if (indice === -1) {
        window.Pantallas.mostrar(pantallas, 'pantallaLista');
        location.hash = window.Rutas.hacia('lista');
        repintar();
        return avisar('No hay ningún proyecto con el identificador «' + id + '».');
      }
      window.Pantallas.mostrar(pantallas, 'pantallaProyecto');
      location.hash = window.Rutas.hacia('proyecto', id);
      return pintarProyecto(indice);
    }
    abierto = null;
    window.Pantallas.mostrar(pantallas, 'pantallaLista');
    location.hash = window.Rutas.hacia('lista');
    repintar();
  }

  /* Los campos del formulario de crear, con los nombres que espera Nuevo. */
  function camposNuevo() {
    return { titulo: elTitulo, cliente: elCliente, anio: elAnio,
             papel: elPapel, enlace: elEnlace };
  }

  function crear(titulo, categoria) {
    if (!trabajo) return;
    var r = window.Nuevo.proyecto(trabajo.proyectos, titulo, categoria,
                                  window.Nuevo.ficha(camposNuevo()));
    if (r.problema) return avisar(r.problema);
    trabajo.proyectos.push(r.proyecto);
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
      guardado = JSON.stringify(trabajo);
      avisar('Guardado.');
    });
  }

  function init() {
    elLista = document.getElementById('lista');
    elAviso = document.getElementById('aviso');
    elTitulo = document.getElementById('titulo');
    elCategoria = document.getElementById('categoria');
    elCliente = document.getElementById('fichaCliente');
    elAnio = document.getElementById('fichaAnio');
    elPapel = document.getElementById('fichaPapel');
    elEnlace = document.getElementById('fichaEnlace');
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
      window.Nuevo.vaciar(camposNuevo());
    });

    elGuardar.addEventListener('click', guardar);

    pantallas = { pantallaLista: document.getElementById('pantallaLista'),
                  pantallaProyecto: document.getElementById('pantallaProyecto'),
                  pantallaPublicar: document.getElementById('pantallaPublicar') };
    publicar = window.Publicar.crear(
      { cambios: document.getElementById('qCambios'),
        falta: document.getElementById('qFalta'),
        aviso: document.getElementById('qAviso'),
        boton: document.getElementById('qPublicar') },
      function () { return trabajo; }, hayCambios);
    document.getElementById('irAPublicar')
      .addEventListener('click', function () { ir('publicar'); });
    document.getElementById('qVolver')
      .addEventListener('click', function () { ir('lista'); });
    elsProyecto = window.Proyecto.recoger(document);
    document.getElementById('pVolver')
      .addEventListener('click', function () { ir('lista'); });

    /* El aviso de salir con cambios sin guardar. No se puede escribir el
       texto: los navegadores enseñan el suyo desde hace años, y lo único que
       se controla es si aparece o no. */
    window.addEventListener('beforeunload', function (e) {
      if (!hayCambios()) return;
      e.preventDefault();
      e.returnValue = '';
    });

    window.addEventListener('hashchange', function () {
      var destino = window.Rutas.leer(location.hash);
      ir(destino.pantalla, destino.id);
    });

    /* La costura para las pruebas, y de paso para la consola: panel.js es una
       IIFE que no devuelve nada, así que sin esto no hay forma de pedirle
       desde fuera que cambie de pantalla —habría que simular eventos de
       hashchange, que es probar el navegador y no el panel—. */
    window.Panel = { ir: ir, hayCambios: hayCambios };

    window.Borrador.cargar(function (datos, error) {
      if (error) return avisar(error);
      trabajo = datos;
      guardado = JSON.stringify(trabajo);
      activarControles(true);
      /* Se arranca donde diga el fragmento, no siempre en la lista: recargar
         con #/proyecto/bruma tiene que volver al mismo sitio, que es lo que
         hace compartible la dirección. */
      var destino = window.Rutas.leer(location.hash);
      ir(destino.pantalla, destino.id);
    });
  }

  init();
})();
