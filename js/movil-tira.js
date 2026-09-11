window.MovilTira = (function () {

  /* La tira de miniaturas del visor móvil. Es el equivalente de `#visorTira`
     del escritorio (`construirTira`, en js/visor.js), pero no se comparte
     código con él: aquél vive en un marco que no se vacía, se despierta con
     `mouseenter` y mide con el ratón encima, que en un dedo no existe.
     Treinta líneas de aquí salen más baratas que un módulo con un `if` de lado
     dentro.

     No vive dentro de `js/movil-visor.js` porque ese fichero ya está muy por
     encima del techo de 300 líneas del repositorio. */

  var raiz = null, alElegir = null;

  /* De qué proyecto es la tira que hay puesta. Es lo que permite repintar la
     marca sin reconstruir: el visor llama a `pintar` en CADA parada, y
     reconstruir en cada una tiraría las <img> ya descargadas para volver a
     pedirlas. (No es que además se perdería el desplazamiento horizontal que
     el dedo hubiera dejado puesto: `marcar` llama a `centrar` en cada parada
     y le sobrescribe `scrollLeft` justo después, así que ese desplazamiento
     se pierde igual, se reconstruya o no. La razón que sostiene esto es sólo
     la de las <img>.) */
  var proyectoPuesto = null;

  function init(elRaiz, alElegirPieza) {
    raiz = elRaiz;
    alElegir = alElegirPieza;
    proyectoPuesto = null;
  }

  function pintar(proyecto, pieza) {
    var piezas = (proyecto && proyecto.piezas) || [];
    if (!piezas.length) {
      raiz.innerHTML = '';
      raiz.hidden = true;
      proyectoPuesto = null;
      return;
    }
    if (proyecto.id !== proyectoPuesto) {
      construir(piezas);
      proyectoPuesto = proyecto.id;
    }
    raiz.hidden = false;
    marcar(pieza);
  }

  function construir(piezas) {
    raiz.innerHTML = '';
    piezas.forEach(function (p, i) {
      var numero = i + 1;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Pieza ' + numero + ' de ' + piezas.length);
      var img = document.createElement('img');
      /* La miniatura (250px de lado largo, 8 KB) y no la pieza (3000px,
         520 KB): aquí se ve a 52px. Las tres medidas de cada foto existen
         justamente para que cada sitio pida la suya. */
      img.src = p.miniatura || p.url;
      /* `alt` vacío a propósito: el botón ya se nombra con `aria-label`, y una
         descripción encima repetiría lo mismo dos veces al lector de
         pantalla. */
      img.alt = '';
      img.decoding = 'async';
      b.appendChild(img);
      /* El número de la PIEZA, desde 1, que es el que entiende el router y el
         que enseña el contador. Con el índice desde 0, pulsar la primera no
         abriría nada y las demás abrirían la anterior. */
      b.addEventListener('click', function () { alElegir(numero); });
      raiz.appendChild(b);
    });
  }

  /* `aria-current` se QUITA en vez de ponerse a 'false': un `aria-current`
     presente con cualquier valor distinto de 'false' cuenta como puesto, y
     dejar el atributo suelto invita a leerlo como booleano. En la ficha y en
     el vídeo no se marca ninguna, porque no estás en una pieza. */
  function marcar(pieza) {
    Array.prototype.forEach.call(raiz.children, function (b, i) {
      if (i + 1 === pieza) {
        b.setAttribute('aria-current', 'true');
        centrar(b);
      } else {
        b.removeAttribute('aria-current');
      }
    });
  }

  /* Se escribe `scrollLeft` de la tira y NO se usa `scrollIntoView`: aquél
     sólo puede mover la tira, y éste puede además desplazar el documento
     entero si el navegador decide que hace falta. Dentro de un visor a
     pantalla completa eso se ve como que la página da un salto sin que nadie
     la haya tocado.

     Se mide contra la caja de la TIRA y no con `offsetLeft`: el `offsetParent`
     de una miniatura no es la tira, que es `position:static`, sino el HUD, que
     es absoluto — medido, eso metia un desfase constante de 24px, el padding
     lateral del HUD (la octava miniatura daba `offsetLeft` 430 estando en
     realidad a 406 de la tira). */
  function centrar(b) {
    var caja = b.getBoundingClientRect(), marco = raiz.getBoundingClientRect();
    raiz.scrollLeft += (caja.left - marco.left) - (marco.width - caja.width) / 2;
  }

  return { init: init, pintar: pintar };
})();
