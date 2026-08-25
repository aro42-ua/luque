window.Lista = (function () {
  var ETIQUETAS = { 'foto-stills': 'Foto Stills', editorial: 'Editorial',
                    videoclip: 'Videoclip', cortometraje: 'Cortometraje' };

  /* Cada proyecto trae sus dos botones de mover. El arrastrar y soltar llega en
     la Tarea 5 como atajo, pero esto es el camino principal: sin ratón se tiene
     que poder hacer todo, y con lector de pantalla también. */
  function fila(p, indice, total, alMover, alBorrar) {
    var li = document.createElement('li');
    li.className = 'fila';
    li.dataset.id = p.id;

    var nombre = document.createElement('span');
    nombre.className = 'fila-titulo';
    nombre.textContent = p.titulo + ' · ' + (ETIQUETAS[p.categoria] || p.categoria);

    var subir = document.createElement('button');
    subir.type = 'button';
    subir.className = 'fila-boton';
    subir.textContent = '↑';
    subir.setAttribute('aria-label', 'Subir ' + p.titulo);
    subir.disabled = indice === 0;
    subir.addEventListener('click', function () { alMover(indice, indice - 1); });

    var bajar = document.createElement('button');
    bajar.type = 'button';
    bajar.className = 'fila-boton';
    bajar.textContent = '↓';
    bajar.setAttribute('aria-label', 'Bajar ' + p.titulo);
    bajar.disabled = indice === total - 1;
    bajar.addEventListener('click', function () { alMover(indice, indice + 1); });

    var borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'fila-boton fila-borrar';
    borrar.textContent = 'Borrar';
    borrar.setAttribute('aria-label', 'Borrar ' + p.titulo);
    borrar.addEventListener('click', function () { alBorrar(p.id, p.titulo); });

    li.appendChild(nombre);
    li.appendChild(subir);
    li.appendChild(bajar);
    li.appendChild(borrar);
    return li;
  }

  function pintar(contenedor, proyectos, alMover, alBorrar) {
    contenedor.innerHTML = '';
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(fila(p, i, proyectos.length, alMover, alBorrar));
    });
  }

  return { pintar: pintar, ETIQUETAS: ETIQUETAS };
})();
