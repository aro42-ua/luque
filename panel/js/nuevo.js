/* El formulario de crear un proyecto: la ficha que escribe, si el proyecto se
   puede crear, y cómo nace. Sin DOM propio —recibe los campos— y sin red.

   Salió de panel.js en el bloque 3d: panel.js es el arranque, y con el
   enrutado de tres pantallas encima cruzaba las 300 líneas del criterio de
   aceptación 11. Salir aquí además le sienta bien: esto es la pantalla de
   crear, hermana de proyecto.js, y no tiene nada que ver con quién llama a
   quién al arrancar.

   El comportamiento es el mismo del bloque 3b, y lo comprueban desde fuera las
   pruebas de pruebas-panel.js, que no se tocaron. */
window.Nuevo = (function () {

  /* `cliente` y `enlace` sólo entran si el estudio los ha escrito:
     ReglasContenido.validar no los exige a propósito —el porqué está escrito
     junto a esa comprobación, en js/reglas-contenido.js—, y la forma de decir
     que un trabajo no tiene cliente o no tiene vídeo es que la clave no esté.
     Guardar `cliente: ''` sería una segunda forma de decir lo mismo, y a quien
     pregunte si la ficha trae cliente le contestaría que sí.

     El año va como número porque así está escrito en contenido.json. */
  function ficha(els) {
    var f = {};
    var cliente = els.cliente.value.trim();
    if (cliente) f.cliente = cliente;
    f.anio = Number(els.anio.value);
    f.papel = els.papel.value.trim();
    var enlace = els.enlace.value.trim();
    if (enlace) f.enlace = enlace;
    return f;
  }

  /* Devuelve `{ proyecto }` o `{ problema }`, y no lanza ni avisa por su
     cuenta: quién enseña el problema y dónde es de quien llama. */
  function proyecto(proyectos, titulo, categoria, f) {
    var id = window.Identificador.desde(titulo);
    var ids = proyectos.map(function (p) { return p.id; });
    var problema = window.Identificador.problema(id, ids, window.ReglasContenido.CATEGORIAS);
    if (problema) return { problema: problema };

    /* El `required` del formulario ya frena al estudio, pero sólo por el
       camino del navegador. Se comprueba también aquí porque lo que hay al
       otro lado no tiene arreglo: sin año o sin papel el proyecto se guarda
       en el borrador y la publicación lo rechaza con un 422. */
    if (!f.anio || !f.papel) {
      return { problema: 'El año y el papel hacen falta para poder publicar.' };
    }

    /* Nace sin piezas ni portada: las pone la pantalla del proyecto, que es
       del bloque 3c. Hasta que tenga fotos no se puede publicar, y eso es
       correcto —publicar valida, y un proyecto sin fotos no es publicable—. */
    return { proyecto: { id: id, titulo: titulo, categoria: categoria,
                         tipo: 'fotos', ficha: f, piezas: [] } };
  }

  /* Se vacía el formulario entero, no sólo el título. Si los campos de la
     ficha se quedaran escritos, el siguiente proyecto nacería con el cliente y
     el papel del anterior, y eso no da error en ningún sitio: se publica y ya
     está. El precio es que un intento fallido —un identificador repetido—
     también los borra, que es lo que el título ya hacía antes. */
  function vaciar(els) {
    els.titulo.value = '';
    els.cliente.value = '';
    els.anio.value = '';
    els.papel.value = '';
    els.enlace.value = '';
  }

  return { ficha: ficha, proyecto: proyecto, vaciar: vaciar };
})();
