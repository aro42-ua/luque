/* La rejilla de fotos de un proyecto. La aritmética del arrastre —traducir
   «soltar sobre esta celda, antes o después» a un índice, y no dejar pasar un
   NaN a Orden.mover— se reutiliza de lista.js, que la expone justamente para
   poder probarla. Escribirla otra vez serían dos aritméticas que se separan.

   Lo que sí es distinto es la geometría: la lista es vertical y decide por la
   mitad de ALTO; la rejilla es bidimensional y decide por la mitad de ANCHO. */
window.Fotos = (function () {
  var origenArrastre = null;
  var celdaMarcada = null;

  function desmarcar() {
    if (celdaMarcada) {
      celdaMarcada.classList.remove('celda--marca-antes', 'celda--marca-despues');
      celdaMarcada = null;
    }
  }

  function marcar(li, antes) {
    desmarcar();
    li.classList.add(antes ? 'celda--marca-antes' : 'celda--marca-despues');
    celdaMarcada = li;
  }

  /* Por el ancho, no por el alto: en una rejilla, lo que el ojo entiende como
     «antes de ésta» es la mitad izquierda de la celda. */
  function sueltaAntes(li, x) {
    var caja = li.getBoundingClientRect();
    return x < caja.left + caja.width / 2;
  }

  function boton(accion, texto, etiqueta, desactivado, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'celda-boton';
    b.textContent = texto;
    b.setAttribute('aria-label', etiqueta);
    b.dataset.accion = accion;
    b.disabled = !!desactivado;
    b.addEventListener('click', alPulsar);
    return b;
  }

  function celda(pieza, i, total, esPortada, acciones) {
    var li = document.createElement('li');
    li.className = 'celda' + (esPortada ? ' celda--portada' : '');
    li.dataset.indice = String(i);
    li.draggable = true;

    var img = document.createElement('img');
    /* La miniatura y no la pieza: la rejilla enseña varias a la vez, y pedir
       los 3000 px para verlos a 120 costaría un megabyte por foto. Es el mismo
       motivo por el que la tira del visor tiene su propia medida. */
    img.src = pieza.miniatura || pieza.url;
    /* Sin texto alternativo, un lector de pantalla lee la url. Con el número,
       al menos se sabe cuál de todas es. */
    img.alt = 'Foto ' + (i + 1) + ' de ' + total;
    img.className = 'celda-img';
    li.appendChild(img);

    /* Los cuatro botones son el camino principal, no un añadido: criterio de
       aceptación 6, el panel es operable de principio a fin sin ratón. El
       arrastrar y soltar de más abajo es el atajo. */
    li.appendChild(boton('anterior', '‹', 'Mover la foto ' + (i + 1) + ' hacia atrás',
      i === 0, function () { acciones.alMover(i, i - 1); }));
    li.appendChild(boton('siguiente', '›', 'Mover la foto ' + (i + 1) + ' hacia delante',
      i === total - 1, function () { acciones.alMover(i, i + 1); }));
    /* Marcar la que ya es portada no haría nada, y un botón que no hace nada
       tiene que decirlo antes de que lo pulsen. */
    li.appendChild(boton('portada', 'Portada', 'Hacer portada la foto ' + (i + 1),
      esPortada, function () { acciones.alMarcarPortada(i); }));
    li.appendChild(boton('quitar', 'Quitar', 'Quitar la foto ' + (i + 1),
      false, function () { acciones.alQuitar(i); }));

    li.addEventListener('dragstart', function (e) {
      var propio = window.Lista.indiceValido(li.dataset.indice);
      if (propio === null) { e.preventDefault(); return; }
      origenArrastre = propio;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(propio));
      li.classList.add('celda--arrastrando');
    });

    li.addEventListener('dragover', function (e) {
      if (origenArrastre === null) return;
      var destino = window.Lista.indiceValido(li.dataset.indice);
      if (destino === null || destino === origenArrastre) { desmarcar(); return; }
      e.preventDefault();               // obligatorio para que 'drop' llegue a disparar
      e.dataTransfer.dropEffect = 'move';
      marcar(li, sueltaAntes(li, e.clientX));
    });

    li.addEventListener('drop', function (e) {
      e.preventDefault();
      var origen = origenArrastre;
      var destino = window.Lista.indiceValido(li.dataset.indice);
      var antes = sueltaAntes(li, e.clientX);
      desmarcar();
      origenArrastre = null;
      // Índice no numérico o soltar sobre la propia celda: no se mueve nada.
      if (origen === null || destino === null || destino === origen) return;
      var hasta = window.Lista.calcularHasta(origen, destino, antes);
      if (hasta === origen) return;     // el hueco calculado es el que ya ocupaba
      acciones.alMover(origen, hasta);  // el mismo alMover que usan los botones
    });

    li.addEventListener('dragend', function () {
      li.classList.remove('celda--arrastrando');
      desmarcar();
      origenArrastre = null;
    });

    return li;
  }

  function pintar(contenedor, proyecto, acciones) {
    contenedor.innerHTML = '';
    /* Los nodos viejos desaparecen con el innerHTML de arriba: ninguna
       referencia a un arrastre o una marca anterior debe sobrevivirlos. */
    origenArrastre = null;
    celdaMarcada = null;
    var piezas = proyecto.piezas || [];
    var laPortada = window.Edicion.indiceDePortada(proyecto);
    piezas.forEach(function (pieza, i) {
      contenedor.appendChild(celda(pieza, i, piezas.length, i === laPortada, acciones));
    });
  }

  /* Lo mismo que Lista.enfocar y por lo mismo: tras repintar, los nodos son
     nuevos. El ancla aquí es el índice y no un id, porque una foto no tiene
     id — y como el índice es justo lo que cambia al mover, quien llama pasa el
     de DESPUÉS del movimiento. */
  function enfocar(contenedor, foco) {
    if (!foco) return;
    var li = contenedor.querySelector('[data-indice="' + foco.indice + '"]');
    if (!li) return;
    var b = li.querySelector('[data-accion="' + foco.accion + '"]');
    if (b && !b.disabled) { b.focus(); return; }
    var otra = foco.accion === 'anterior' ? 'siguiente' : 'anterior';
    var alternativo = li.querySelector('[data-accion="' + otra + '"]');
    if (alternativo && !alternativo.disabled) alternativo.focus();
  }

  return { pintar: pintar, enfocar: enfocar, sueltaAntes: sueltaAntes };
})();
