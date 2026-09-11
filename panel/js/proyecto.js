/* La pantalla de un proyecto: la ficha, la rejilla y la puerta de subida. Lo
   que NO hace es guardar — cambiar aquí cambia el borrador en memoria y avisa
   con `alCambiar`; el botón de guardar sigue siendo el del panel. Autoguardar
   sería más cómodo y peor: cada pulsación un PUT, cada PUT una versión, y dos
   sesiones abiertas mandándose conflictos por cambios a medio hacer. */
window.Proyecto = (function () {
  var CAMPOS = ['nombre', 'categoria', 'cliente', 'anio', 'papel', 'enlace'];

  function opciones(select, elegida) {
    select.innerHTML = '';
    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      if (c === elegida) o.selected = true;
      select.appendChild(o);
    });
  }

  /* El mismo criterio que `fichaDelFormulario` en panel.js: `cliente` y
     `enlace` sólo entran si están escritos. ReglasContenido.validar no los
     exige a propósito —Conejita Playboy no tiene cliente y los cuatro
     editoriales no tienen enlace—, y la forma de decir que no hay cliente es
     que la clave no esté. Guardar `cliente: ''` sería una segunda forma de
     decir lo mismo que además contesta que sí a quien pregunte. */
  function fichaDel(els) {
    var ficha = {};
    var cliente = els.cliente.value.trim();
    if (cliente) ficha.cliente = cliente;
    ficha.anio = Number(els.anio.value);
    ficha.papel = els.papel.value.trim();
    var enlace = els.enlace.value.trim();
    if (enlace) ficha.enlace = enlace;
    return ficha;
  }

  function conFicha(proyecto, els) {
    var nuevo = {};
    Object.keys(proyecto).forEach(function (k) { nuevo[k] = proyecto[k]; });
    /* El título cambia; el `id` NO se recalcula. Va en la URL pública, así que
       se congela al crear: renombrar un proyecto no puede romper un enlace que
       la fotógrafa ya mandó a un cliente. */
    nuevo.titulo = els.nombre.value.trim();
    nuevo.categoria = els.categoria.value;
    nuevo.ficha = fichaDel(els);
    return nuevo;
  }

  /* Los mismos problemas que diría el Worker con un 422 al publicar, pero
     dichos en la pantalla donde se arreglan. Enterarse aquí en vez de al
     publicar es la diferencia entre un aviso y un callejón sin salida. */
  function problemasDe(proyecto) {
    return window.ReglasContenido
      .validar({ proyectos: [proyecto] }, window.ReglasContenido.CATEGORIAS);
  }

  function archivosDe(e) {
    var t = e.dataTransfer || e.target;
    return (t && t.files) || [];
  }

  function pintar(els, proyecto, acciones) {
    var actual = proyecto;

    els.titulo.textContent = actual.titulo || actual.id;
    els.nombre.value = actual.titulo || '';
    opciones(els.categoria, actual.categoria);
    var ficha = actual.ficha || {};
    /* `|| ''` y no el valor a secas: un campo opcional que la ficha no trae
       pintaría «undefined» en la caja, y eso se guardaría tal cual al
       siguiente cambio. */
    els.cliente.value = ficha.cliente || '';
    els.anio.value = ficha.anio || '';
    els.papel.value = ficha.papel || '';
    els.enlace.value = ficha.enlace || '';

    var problemas = problemasDe(actual);
    els.problemas.textContent = problemas.length
      ? 'Para poder publicarlo le falta: ' + problemas.join('; ') + '.'
      : '';

    window.Fotos.pintar(els.fotos, actual, {
      alMover: function (desde, hasta) {
        acciones.alCambiar(window.Edicion.mover(actual, desde, hasta),
          { indice: hasta, accion: desde < hasta ? 'siguiente' : 'anterior' });
      },
      alQuitar: function (indice) {
        /* Se pregunta porque no hay deshacer dentro de la sesión y porque es
           lo único de esta pantalla que destruye trabajo. Los bytes siguen en
           R2 —quitar una foto no la borra del bucket, a propósito—, pero el
           estudio no tiene ninguna pantalla desde la que recuperarlos. */
        if (!window.confirm('¿Quitar la foto ' + (indice + 1) + ' de este proyecto?')) return;
        acciones.alCambiar(window.Edicion.quitar(actual, indice),
          { indice: Math.max(0, indice - 1), accion: 'siguiente' });
      },
      alMarcarPortada: function (indice) {
        acciones.alCambiar(window.Edicion.marcarPortada(actual, indice),
          { indice: indice, accion: 'quitar' });
      }
    });

    /* Se enganchan en cada pintado sobre nodos que NO se reconstruyen —vienen
       del HTML de la página, no de aquí—, así que hay que quitar el anterior o
       se apilarían. Se hace con la propiedad `on*` y no con addEventListener
       justamente por eso: asignar reemplaza. */
    CAMPOS.forEach(function (campo) {
      els[campo].oninput = function () { acciones.alCambiar(conFicha(actual, els)); };
      els[campo].onchange = els[campo].oninput;
    });

    els.archivos.onchange = function (e) {
      var fs = archivosDe(e);
      if (fs.length) acciones.alSubir(fs);
      /* Se vacía para que elegir el mismo archivo dos veces seguidas vuelva a
         disparar `change`: el navegador no lo emite si el valor no cambia. */
      els.archivos.value = '';
    };

    els.soltar.ondragover = function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      els.soltar.classList.add('soltar--encima');
    };
    els.soltar.ondragleave = function () {
      els.soltar.classList.remove('soltar--encima');
    };
    els.soltar.ondrop = function (e) {
      /* Sin esto el navegador abre la foto soltada en la pestaña, y el panel
         desaparece con los cambios sin guardar dentro. */
      e.preventDefault();
      els.soltar.classList.remove('soltar--encima');
      var fs = archivosDe(e);
      if (fs.length) acciones.alSubir(fs);
    };
  }

  /* Los nodos que `pintar` necesita, recogidos una sola vez. Vive aquí y no en
     panel.js por dos razones: es este archivo el que sabe qué nodos le hacen
     falta —si mañana añade un campo, se entera aquí y no allí—, y panel.js
     lleva encima el arranque de tres pantallas y no tiene sitio de sobra.
     Recibe el documento en vez de leer el global para poder recogerlo también
     desde un iframe, que es como lo prueba el arnés. */
  function recoger(d) {
    var nodos = { titulo: 'pTitulo', aviso: 'pAviso', nombre: 'pNombre',
                  categoria: 'pCategoria', cliente: 'pCliente', anio: 'pAnio',
                  papel: 'pPapel', enlace: 'pEnlace', soltar: 'pSoltar',
                  archivos: 'pArchivos', progreso: 'pProgreso', fotos: 'pFotos',
                  problemas: 'pProblemas' };
    var els = {};
    Object.keys(nodos).forEach(function (k) { els[k] = d.getElementById(nodos[k]); });
    return els;
  }

  return { pintar: pintar, recoger: recoger,
           fichaDel: fichaDel, problemasDe: problemasDe };
})();
