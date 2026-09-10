window.VisorFicha = (function () {
  var elFicha, elInfo, elCerrar, elCat, elTitulo, elDatos, elEnlace;

  // alAlternar: el manejador de js/visor.js que decide el estado y llama
  // de vuelta a aplicar(). Este módulo no conoce VisorEstado.
  function init(alAlternar) {
    elFicha  = document.getElementById('visorFicha');
    elInfo   = document.getElementById('visorInfo');
    elCerrar = document.getElementById('fichaCerrar');
    elCat    = document.getElementById('fichaCat');
    elTitulo = document.getElementById('fichaTitulo');
    elDatos  = document.getElementById('fichaDatos');
    elEnlace = document.getElementById('fichaEnlace');
    elInfo.addEventListener('click', alAlternar);
    // El mismo manejador que el botón «Ficha»: alAlternar decide el estado
    // mirándolo, así que desde el panel abierto lo cierra. Dos botones para
    // una acción, y una sola función que la hace.
    elCerrar.addEventListener('click', alAlternar);
  }

  // Rellena el contenido del panel para el proyecto abierto. Se llama al
  // abrir el visor, antes de que la ficha pueda desplegarse con la tecla i.
  function pintar(proyecto, total) {
    elCat.textContent = proyecto.categoria.replace('-', ' ');
    elTitulo.textContent = proyecto.titulo;
    elDatos.innerHTML = '';
    /* Por `FichaDato.de` y no en crudo: los cuatro videoclips no traen
       `cliente`, y un `dd` vacío se lee como «la web está rota» en vez de
       como «este dato no lo tenemos». La misma función la usa la ficha móvil,
       que es esta misma ficha en otra pantalla. */
    var filas = [
      ['Cliente', FichaDato.de(proyecto.ficha.cliente)],
      ['Año',     FichaDato.de(proyecto.ficha.anio)],
      ['Papel',   FichaDato.de(proyecto.ficha.papel)],
      ['Piezas',  FichaDato.de(total)]
    ];
    filas.forEach(function (f) {
      var fila = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd);
      elDatos.appendChild(fila);
    });
    /* Se vacía antes de pintar: `pintar` se llama en cada parada y el
       contenedor es fijo, así que sin esto pasar de un videoclip a otro
       dejaría los dos botones puestos, con el de arriba apuntando al
       vídeo anterior. */
    elEnlace.innerHTML = '';
    var boton = Plataforma.boton(proyecto.ficha.enlace);
    if (boton) elEnlace.appendChild(boton);
  }

  // Aplica el estado (abierta/recogida) a la clase que mueve el panel y la
  // escena, y a los atributos ARIA a juego. js/visor.js decide *cuándo*
  // cambia el estado; esta función es la única que toca el DOM para ello.
  function aplicar(raiz, abierta) {
    raiz.classList.toggle('ficha-abierta', abierta);
    elFicha.setAttribute('aria-hidden', abierta ? 'false' : 'true');
    elInfo.setAttribute('aria-expanded', abierta ? 'true' : 'false');
  }

  // Guarda genérica para atajos de una letra (i de ficha, l de lupa): no hay
  // campos de texto en esta página hoy, pero si algún día los hay, la tecla
  // no debe robarles la escritura. tecla llega en minúscula.
  function esTeclaAlternar(e, tecla) {
    if (e.key !== tecla && e.key !== tecla.toUpperCase()) return false;
    var el = document.activeElement;
    if (!el) return true;
    return el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !el.isContentEditable;
  }

  return { init: init, pintar: pintar, aplicar: aplicar, esTeclaAlternar: esTeclaAlternar };
})();
