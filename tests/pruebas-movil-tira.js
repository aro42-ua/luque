/* La tira de miniaturas del visor móvil. Lo que se puede probar sin un dedo:
   cuántos botones se pintan, cuál queda marcado, y —la que más importa— que
   cambiar de pieza NO reconstruya la tira.

   Esa última no es una optimización con prueba de adorno: `pintar()` del visor
   vacía la escena en cada parada, y si la tira siguiera ese camino, cada
   deslizamiento tiraría las diez `<img>` de un proyecto y volvería a pedirlas,
   además de perder el desplazamiento horizontal que el dedo hubiera dejado
   puesto. Se fija por identidad de nodo, que es lo único que distingue
   «sigue siendo el mismo botón» de «es otro botón igual». */

describe('MovilTira', function () {

  var TIRA_MARCADO = '<div><nav id="tiraRaiz" hidden></nav></div>';

  var CON_FOTOS = {
    id: 'niebla',
    piezas: [{ url: 'a.jpg', miniatura: 'a-mini.jpg' },
             { url: 'b.jpg', miniatura: 'b-mini.jpg' },
             { url: 'c.jpg', miniatura: 'c-mini.jpg' }]
  };

  var OTRO = {
    id: 'bruma',
    piezas: [{ url: 'x.jpg', miniatura: 'x-mini.jpg' },
             { url: 'y.jpg', miniatura: 'y-mini.jpg' }]
  };

  var SIN_PIEZAS = { id: 'oleaje', piezas: [] };

  function conTira(fn) {
    return ArnesDom.conElemento(TIRA_MARCADO, function (caja) {
      var raiz = caja.querySelector('#tiraRaiz');
      var elegidas = [];
      MovilTira.init(raiz, function (n) { elegidas.push(n); });
      return fn(raiz, elegidas);
    });
  }

  function botones(raiz) { return raiz.querySelectorAll('button'); }

  function marcas(raiz) {
    return Array.prototype.map.call(botones(raiz), function (b) {
      return b.getAttribute('aria-current');
    });
  }

  prueba('pinta un botón por pieza', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      return botones(raiz).length;
    }), 3);
  });

  /* La miniatura y no la pieza entera: 8 KB contra 520 KB, y aquí se ve a
     52px. Pedir la grande sería descargar cinco megas para pintar una tira. */
  prueba('cada botón lleva la miniatura de su pieza', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      return Array.prototype.map.call(raiz.querySelectorAll('img'), function (i) {
        return i.getAttribute('src');
      });
    }), ['a-mini.jpg', 'b-mini.jpg', 'c-mini.jpg']);
  });

  prueba('marca la pieza actual y sólo ella', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 2);
      return marcas(raiz);
    }), [null, 'true', null]);
  });

  /* En la ficha no estás en ninguna pieza, así que marcar una mentiría sobre
     dónde estás — el mismo criterio que ya sigue el contador del HUD. */
  prueba('en la ficha no marca ninguna', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 'ficha');
      return marcas(raiz);
    }), [null, null, null]);
  });

  prueba('cambiar de pieza NO reconstruye la tira', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      var primero = botones(raiz)[0];
      MovilTira.pintar(CON_FOTOS, 3);
      return botones(raiz)[0] === primero;
    }), true);
  });

  prueba('cambiar de pieza sí mueve la marca', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      MovilTira.pintar(CON_FOTOS, 3);
      return marcas(raiz);
    }), [null, null, 'true']);
  });

  prueba('cambiar de proyecto sí reconstruye', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      MovilTira.pintar(OTRO, 1);
      return botones(raiz).length;
    }), 2);
  });

  /* Un proyecto de vídeo no tiene piezas. Una tira vacía ocuparía sitio sobre
     la foto sin decir nada. */
  prueba('un proyecto sin piezas deja la tira oculta y vacía', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(SIN_PIEZAS, null);
      return { oculta: raiz.hidden, botones: botones(raiz).length };
    }), { oculta: true, botones: 0 });
  });

  /* Ir de un vídeo a un proyecto de fotos tiene que volver a enseñar la tira:
     `hidden` se puso, así que hay que quitarlo. */
  prueba('volver a un proyecto con piezas vuelve a enseñar la tira', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(SIN_PIEZAS, null);
      MovilTira.pintar(CON_FOTOS, 1);
      return { oculta: raiz.hidden, botones: botones(raiz).length };
    }), { oculta: false, botones: 3 });
  });

  /* El número que se avisa es el de la PIEZA, desde 1, que es el que entiende
     el router y el que enseña el contador. Avisar el índice desde 0 abriría
     siempre la pieza anterior, y en la primera no abriría nada. */
  prueba('pulsar avisa el número de pieza, desde 1', function () {
    igual(conTira(function (raiz, elegidas) {
      MovilTira.pintar(CON_FOTOS, 1);
      botones(raiz)[2].click();
      return elegidas;
    }), [3]);
  });
});
