window.MovilHoja = (function () {

  /* Las proporciones de la rejilla —alto = ancho x proporción—, en ciclo fijo
     y NO al azar. Dos motivos, y ninguno es estético: una portada que cambia
     entre dos cargas impide decir «la tercera de la izquierda» en una
     revisión, y un azar en el pintado haría que una prueba de igualdad fallara
     una vez de cada tantas sin que nadie sepa por qué. Irregular no quiere
     decir impredecible. */
  var PROPORCIONES = [1.25, 1, 1.5, 1, 1.5, 1.25];

  function proporcion(indice) {
    return PROPORCIONES[indice % PROPORCIONES.length];
  }

  /* Dos cifras, desde 01. El número identifica el TRABAJO y no su sitio en
     pantalla: sale del índice en la lista COMPLETA, así que filtrar por
     categoría no lo cambia. Quien llame a `pintar` con una lista ya filtrada
     rompe esa promesa sin que nada avise. */
  function numero(indice) {
    var n = indice + 1;
    return (n < 10 ? '0' : '') + n;
  }

  function celdaDe(p, indice, alAbrir) {
    var celda = document.createElement('li');
    celda.className = 'hoja-celda';
    celda.dataset.id = p.id;
    celda.dataset.cat = p.categoria;
    celda.style.setProperty('--proporcion', proporcion(indice));

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'hoja-boton';
    boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

    var img = document.createElement('img');
    /* `portadaUrl` y no `portada`: lo resuelve `Datos.establecer`
       (js/datos.js), que ya elige el póster en los proyectos de vídeo. */
    img.src = p.portadaUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    /* Si la foto no llega, el marco se queda con su número: un hueco numerado
       se lee como «falta esa», no como «la web está rota». La clase la usa el
       CSS para esconder la imagen rota; el número sobrevive solo, porque
       cuelga del botón y no de la imagen. */
    img.addEventListener('error', function () {
      celda.classList.add('sin-foto');
    });

    /* El número cuelga del BOTÓN, al lado de la imagen y no dentro: es lo que
       hace que sobreviva a una foto que no carga. */
    var num = document.createElement('span');
    num.className = 'hoja-numero';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = numero(indice);

    boton.appendChild(img);
    boton.appendChild(num);
    celda.appendChild(boton);

    boton.addEventListener('click', function () { alAbrir(p.id); });
    return celda;
  }

  /* `proyectos` es la lista COMPLETA, sin filtrar. El filtrado es cosa de
     `filtrar()`, que esconde en vez de repintar justamente para no renumerar. */
  function pintar(contenedor, proyectos, alAbrir) {
    contenedor.innerHTML = '';
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(celdaDe(p, i, alAbrir));
    });
  }

  /* Esconde en vez de repintar, y no es una optimización: los números salen
     del índice en la lista completa, así que repintar sólo con los de la
     categoría los renumeraría de 01 en adelante — justo lo que la spec
     prohíbe cuando dice que el número identifica el trabajo y no su sitio.

     `hidden` y no una clase: el atributo saca la celda del tabulador y del
     lector de pantalla a la vez, que es lo que hace falta. La Tarea 6 añade
     `.hoja-celda[hidden]{display:none}` porque la regla de rejilla que le da
     `display` a la celda ganaría al `display:none` del navegador. */
  function filtrar(contenedor, categoria) {
    var celdas = contenedor.querySelectorAll('li.hoja-celda');
    for (var i = 0; i < celdas.length; i++) {
      celdas[i].hidden = !(categoria === null || celdas[i].dataset.cat === categoria);
    }
  }

  return {
    PROPORCIONES: PROPORCIONES,
    proporcion: proporcion,
    numero: numero,
    filtrar: filtrar,
    pintar: pintar
  };
})();
