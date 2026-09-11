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

  /* Recibe el rectángulo ya medido y no el elemento: así es una función de tres
     valores llanos, sin DOM, y se puede comprobar con un objeto a mano. */
  function dentroDeLaCaja(caja, x, y) {
    return x >= caja.left && x <= caja.right && y >= caja.top && y <= caja.bottom;
  }

  /* `dragleave` burbujea, así que salir de un hijo hacia otro hijo de la misma
     fila —del <span> del título a un <button>, o de una fila a la de al lado—
     también llega al contenedor. Si se borrara la marca en cada uno de esos
     avisos, parpadearía durante todo el arrastre. Por eso no se mira DE dónde
     se sale sino A dónde se va: `relatedTarget` es el elemento al que se
     entra, y mientras siga dentro del <ol> no se ha salido de la lista.

     `relatedTarget` es `null` en varios casos reales —al salir de la ventana,
     y en algún navegador sin más—, y ahí `contains(null)` daría `false` y
     borraría la marca de más. La segunda comprobación, por coordenadas,
     cubre eso: si el puntero sigue sobre el rectángulo del <ol>, no se ha
     ido a ninguna parte. Salir de la ventana suele dar (0,0), que cae fuera
     y borra la marca, que es justo lo que se quiere. */
  function sigueDentroDeLaLista(contenedor, e) {
    if (e.relatedTarget) return contenedor.contains(e.relatedTarget);
    return dentroDeLaCaja(contenedor.getBoundingClientRect(), e.clientX, e.clientY);
  }

  /* El `dragleave` va aquí, en el <ol>, y no en cada <li>: sólo el contenedor
     ve el gesto de abandonar la lista entera. Puesto por fila, un puntero que
     se va al formulario de abajo dispara el `dragleave` de la última fila que
     pisó, pero ninguna fila sabe si el puntero ha aterrizado en otra fila o
     fuera de todo, que es la diferencia que importa.

     Se engancha una sola vez aunque `pintar` se llame muchas: el <ol> no lo
     crea `pintar` —viene del HTML y sobrevive al `innerHTML = ''`—, así que
     sin esta marca cada repintado apilaría un oyente más sobre el mismo
     nodo. */
  function vigilarSalidaDeLaLista(contenedor) {
    if (contenedor.dataset.vigilado === 'si') return;
    contenedor.dataset.vigilado = 'si';
    contenedor.addEventListener('dragleave', function (e) {
      if (sigueDentroDeLaLista(contenedor, e)) return;
      desmarcar();
    });
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

  /* Tras un repintado los nodos del <ol> son todos nuevos —`pintar` hace
     innerHTML = '' y reconstruye—, así que el elemento que tenía el foco ya no
     existe y el navegador lo manda a <body>. Lo único que sobrevive es el `id`
     del proyecto, así que es lo que se usa para saber dónde debe volver.

     `foco` es `{ id, accion }`, con accion 'subir' | 'bajar' | 'borrar'. Si ese
     botón ha quedado deshabilitado por llegar al extremo —subir en la primera
     fila, bajar en la última—, se usa el otro de la misma fila, que sigue
     siendo útil.

     Vivía en panel.js hasta el bloque 3c. Se mudó aquí porque lo que sabe es
     el marcado de una fila, que lo escribe este archivo, y porque panel.js
     necesitaba el sitio para el arranque de tres pantallas. */
  function enfocar(contenedor, foco) {
    if (!foco || !foco.id) return;
    var fila = contenedor.querySelector('[data-id="' + foco.id + '"]');
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

  function pintar(contenedor, proyectos, alMover, alBorrar) {
    vigilarSalidaDeLaLista(contenedor);
    contenedor.innerHTML = '';
    // Los nodos viejos desaparecen con el innerHTML de arriba: ninguna
    // referencia a un arrastre o una marca de la fila anterior debe sobrevivir.
    origenArrastre = null;
    filaMarcada = null;
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(fila(p, i, proyectos.length, alMover, alBorrar));
    });
  }

  /* `pintar` y `ETIQUETAS` son lo que usa el panel. Las tres de abajo se
     exponen sólo para poder probarlas: son las piezas sin DOM de este archivo
     y son justo donde vive la aritmética que puede corromper el orden en
     silencio —`Orden.mover` no se queja de un índice que no es un número, así
     que un `calcularHasta` mal calculado recolocaría la galería sin dar
     ningún error visible—. Se prueban en `tests/pruebas-lista.js`. */
  return { pintar: pintar, enfocar: enfocar, ETIQUETAS: ETIQUETAS,
           indiceValido: indiceValido, calcularHasta: calcularHasta,
           dentroDeLaCaja: dentroDeLaCaja };
})();
