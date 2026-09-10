/* MovilFicha.de es pura de cara al DOM: no lee el arnés, no toca la escena,
   sólo construye el nodo a partir del proyecto que se le pasa. Por eso estas
   pruebas no necesitan ArnesDom: basta con mirar el nodo que devuelve.

   `pruebas-movil-visor.js` ya comprueba, a través de `MovilVisor.aplicar`,
   que la parada 'ficha' pinta ESTE nodo en la escena; lo que se fija aquí es
   el contenido del nodo en sí, sin pasar por el visor entero. */
describe('MovilFicha — el marcado de la ficha técnica', function () {

  var PROYECTO = {
    titulo: 'Niebla',
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Dirección de arte' },
    piezas: [{ url: 'a' }, { url: 'b' }]
  };

  function proyecto(enlace) {
    return {
      titulo: 'X', piezas: [{}, {}, {}],
      ficha: { cliente: 'C', anio: 2026, papel: 'Gaffer', enlace: enlace }
    };
  }

  prueba('devuelve un <div class="mvisor-ficha">', function () {
    var caja = MovilFicha.de(PROYECTO);
    igual([caja.tagName, caja.className], ['DIV', 'mvisor-ficha']);
  });

  prueba('el título de la ficha es el título del proyecto', function () {
    var caja = MovilFicha.de(PROYECTO);
    igual(caja.querySelector('.mvisor-ficha-titulo').textContent, 'Niebla');
  });

  /* Los rótulos son los mismos que los del escritorio a propósito: es la
     misma ficha vista en otra pantalla, no otra ficha. */
  prueba('la ficha movil ensena las mismas cuatro filas', function () {
    var dt = MovilFicha.de(proyecto(null)).querySelectorAll('dt');
    igual(dt.length, 4);
    igual(dt[2].textContent, 'Papel');
  });

  prueba('con enlace aparece el boton, y abre fuera', function () {
    var a = MovilFicha.de(proyecto('https://youtu.be/x')).querySelector('a');
    igual(a.textContent, 'Ver en YouTube');
    igual(a.getAttribute('rel'), 'noopener noreferrer');
  });

  prueba('sin enlace no hay boton', function () {
    igual(MovilFicha.de(proyecto(null)).querySelector('a'), null);
  });
});
