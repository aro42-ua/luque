window.Lista = (function () {
  var ETIQUETAS = { 'foto-stills': 'Foto Stills', editorial: 'Editorial',
                    videoclip: 'Videoclip', cortometraje: 'Cortometraje' };

  /* Estado del arrastre en curso. Vive aquí, no en cada fila, porque sólo puede
     haber un arrastre a la vez y dragover/drop de la fila destino necesitan
     saber qué fila se levantó. `pintar` lo reinicia en cada repintado: los
     nodos viejos desaparecen y una referencia colgando no debe sobrevivirlos. */
  var origenArrastre = null;
  var filaMarcada = null;

  /* Interpreta `dataset.indice` como entero. Devuelve `null` si no lo es, en
     vez de dejar pasar un NaN: Orden.mover no se queja con un índice que no es
     un número —Math.max(0, NaN) da NaN, y splice(NaN, …) lo trata como 0— así
     que reordenaría en silencio con un índice mal calculado. Aquí se corta
     antes de llamar a alMover, no después. */
  function indiceValido(valor) {
    var n = parseInt(valor, 10);
    return isNaN(n) ? null : n;
  }

  function desmarcar() {
    if (filaMarcada) {
      filaMarcada.classList.remove('fila--marca-antes', 'fila--marca-despues');
      filaMarcada = null;
    }
  }

  function marcar(li, antes) {
    desmarcar();
    li.classList.add(antes ? 'fila--marca-antes' : 'fila--marca-despues');
    filaMarcada = li;
  }

  /* La mitad de la fila sobre la que está el puntero decide si se soltaría
     antes o después de ella. */
  function sueltaAntes(li, y) {
    var caja = li.getBoundingClientRect();
    return y < caja.top + caja.height / 2;
  }

  /* Traduce «fila origen» + «fila destino, antes o después de ella» al mismo
     índice final que ya entiende Orden.mover —el que ocupará la fila movida en
     la lista resultante—, que es exactamente lo que sus pruebas comprueban.
     Cuando el destino está por delante del origen no hace falta ajuste; cuando
     está por detrás, retirar la fila origen desplaza un hueco hacia atrás al
     resto, y hay que descontarlo. */
  function calcularHasta(origen, destino, antes) {
    if (antes) return destino < origen ? destino : destino - 1;
    return destino < origen ? destino + 1 : destino;
  }

  /* Cada proyecto trae sus dos botones de mover. El arrastrar y soltar de aquí
     abajo es un atajo con la API nativa (draggable/dragstart/dragover/drop)
     para quien use ratón, pero el camino principal siguen siendo estos
     botones: sin ratón se tiene que poder hacer todo, y con lector de
     pantalla también. */
  function fila(p, indice, total, alMover, alBorrar) {
    var li = document.createElement('li');
    li.className = 'fila';
    li.dataset.id = p.id;
    li.dataset.indice = String(indice);
    li.draggable = true;

    var nombre = document.createElement('span');
    nombre.className = 'fila-titulo';
    nombre.textContent = p.titulo + ' · ' + (ETIQUETAS[p.categoria] || p.categoria);

    var subir = document.createElement('button');
    subir.type = 'button';
    subir.className = 'fila-boton';
    subir.textContent = '↑';
    subir.setAttribute('aria-label', 'Subir ' + p.titulo);
    /* data-accion identifica el botón tras un repintado: panel.js lo usa para
       devolver el foco al mismo botón de la misma fila una vez que el <ol>
       entero se ha reconstruido y los nodos anteriores ya no existen. */
    subir.dataset.accion = 'subir';
    subir.disabled = indice === 0;
    subir.addEventListener('click', function () { alMover(indice, indice - 1); });

    var bajar = document.createElement('button');
    bajar.type = 'button';
    bajar.className = 'fila-boton';
    bajar.textContent = '↓';
    bajar.setAttribute('aria-label', 'Bajar ' + p.titulo);
    bajar.dataset.accion = 'bajar';
    bajar.disabled = indice === total - 1;
    bajar.addEventListener('click', function () { alMover(indice, indice + 1); });

    var borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'fila-boton fila-borrar';
    borrar.textContent = 'Borrar';
    borrar.setAttribute('aria-label', 'Borrar ' + p.titulo);
    borrar.dataset.accion = 'borrar';
    borrar.addEventListener('click', function () { alBorrar(p.id, p.titulo); });

    /* dragstart lee su propio índice del DOM, no de `indice`: por si el
       repintado ha quedado desincronizado con el cierre de esta función en
       algún caso no previsto, es la fuente de verdad la que se comprueba. */
    li.addEventListener('dragstart', function (e) {
      var propio = indiceValido(li.dataset.indice);
      if (propio === null) { e.preventDefault(); return; }
      origenArrastre = propio;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(propio));
      li.classList.add('fila--arrastrando');
    });

    li.addEventListener('dragover', function (e) {
      if (origenArrastre === null) return;
      var destino = indiceValido(li.dataset.indice);
      if (destino === null || destino === origenArrastre) { desmarcar(); return; }
      e.preventDefault();               // obligatorio para que 'drop' llegue a disparar
      e.dataTransfer.dropEffect = 'move';
      marcar(li, sueltaAntes(li, e.clientY));
    });

    li.addEventListener('drop', function (e) {
      e.preventDefault();
      var origen = origenArrastre;
      var destino = indiceValido(li.dataset.indice);
      var antes = sueltaAntes(li, e.clientY);
      desmarcar();
      origenArrastre = null;
      // Índice no numérico o soltar sobre la propia fila: no se mueve nada.
      if (origen === null || destino === null || destino === origen) return;
      var hasta = calcularHasta(origen, destino, antes);
      if (hasta === origen) return;     // el hueco calculado es el que ya ocupaba
      alMover(origen, hasta);           // el mismo alMover que usan subir y bajar
    });

    li.addEventListener('dragend', function () {
      li.classList.remove('fila--arrastrando');
      desmarcar();
      origenArrastre = null;
    });

    li.appendChild(nombre);
    li.appendChild(subir);
    li.appendChild(bajar);
    li.appendChild(borrar);
    return li;
  }

  function pintar(contenedor, proyectos, alMover, alBorrar) {
    contenedor.innerHTML = '';
    // Los nodos viejos desaparecen con el innerHTML de arriba: ninguna
    // referencia a un arrastre o una marca de la fila anterior debe sobrevivir.
    origenArrastre = null;
    filaMarcada = null;
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(fila(p, i, proyectos.length, alMover, alBorrar));
    });
  }

  return { pintar: pintar, ETIQUETAS: ETIQUETAS };
})();
