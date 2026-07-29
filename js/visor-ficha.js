window.VisorFicha = (function () {
  var elFicha, elInfo, elCat, elTitulo, elDatos;

  // alAlternar: el manejador de js/visor.js que decide el estado y llama
  // de vuelta a aplicar(). Este módulo no conoce VisorEstado.
  function init(alAlternar) {
    elFicha  = document.getElementById('visorFicha');
    elInfo   = document.getElementById('visorInfo');
    elCat    = document.getElementById('fichaCat');
    elTitulo = document.getElementById('fichaTitulo');
    elDatos  = document.getElementById('fichaDatos');
    elInfo.addEventListener('click', alAlternar);
  }

  // Rellena el contenido del panel para el proyecto abierto. Se llama al
  // abrir el visor, antes de que la ficha pueda desplegarse con la tecla i.
  function pintar(proyecto, total) {
    elCat.textContent = proyecto.categoria.replace('-', ' ');
    elTitulo.textContent = proyecto.titulo;
    elDatos.innerHTML = '';
    var filas = [
      ['Cliente', proyecto.ficha.cliente],
      ['Año',     proyecto.ficha.anio],
      ['Cámara',  proyecto.ficha.camara],
      ['Óptica',  proyecto.ficha.optica],
      ['Piezas',  total]
    ];
    filas.forEach(function (f) {
      var fila = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd);
      elDatos.appendChild(fila);
    });
  }

  // Aplica el estado (abierta/recogida) a la clase que mueve el panel y la
  // escena, y a los atributos ARIA a juego. js/visor.js decide *cuándo*
  // cambia el estado; esta función es la única que toca el DOM para ello.
  function aplicar(raiz, abierta) {
    raiz.classList.toggle('ficha-abierta', abierta);
    elFicha.setAttribute('aria-hidden', abierta ? 'false' : 'true');
    elInfo.setAttribute('aria-expanded', abierta ? 'true' : 'false');
  }

  // Guarda de la tecla i: no hay campos de texto en esta página hoy, pero
  // si algún día los hay, la tecla no debe robarles la escritura.
  function esTeclaAlternar(e) {
    if (e.key !== 'i' && e.key !== 'I') return false;
    var el = document.activeElement;
    if (!el) return true;
    return el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !el.isContentEditable;
  }

  return { init: init, pintar: pintar, aplicar: aplicar, esTeclaAlternar: esTeclaAlternar };
})();
