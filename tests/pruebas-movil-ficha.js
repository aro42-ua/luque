/* MovilFicha.de es pura de cara al DOM: no lee el arnés, no toca la escena,
   sólo construye el nodo a partir del proyecto que se le pasa. Por eso estas
   pruebas no necesitan ArnesDom: basta con mirar el nodo que devuelve.

   `pruebas-movil-visor.js` ya comprueba, a través de `MovilVisor.aplicar`,
   que la parada 'ficha' pinta ESTE nodo en la escena; lo que se fija aquí es
   el contenido del nodo en sí, sin pasar por el visor entero. */
describe('MovilFicha — el marcado de la ficha técnica', function () {

  var PROYECTO = {
    titulo: 'Niebla',
    ficha: { cliente: 'Estudio', anio: '2026', camara: 'Mamiya', optica: '80mm' },
    piezas: [{ url: 'a' }, { url: 'b' }]
  };

  prueba('devuelve un <div class="mvisor-ficha">', function () {
    var caja = MovilFicha.de(PROYECTO);
    igual([caja.tagName, caja.className], ['DIV', 'mvisor-ficha']);
  });

  prueba('el título de la ficha es el título del proyecto', function () {
    var caja = MovilFicha.de(PROYECTO);
    igual(caja.querySelector('.mvisor-ficha-titulo').textContent, 'Niebla');
  });

  prueba('las cinco filas van en el orden de siempre, con el recuento de piezas',
    function () {
    var caja = MovilFicha.de(PROYECTO);
    var dts = caja.querySelectorAll('dt');
    var dds = caja.querySelectorAll('dd');
    var etiquetas = [], valores = [];
    for (var i = 0; i < dts.length; i++) {
      etiquetas.push(dts[i].textContent);
      valores.push(dds[i].textContent);
    }
    igual(etiquetas, ['Cliente', 'Año', 'Cámara', 'Óptica', 'Piezas']);
    igual(valores, ['Estudio', '2026', 'Mamiya', '80mm', '2']);
  });
});
