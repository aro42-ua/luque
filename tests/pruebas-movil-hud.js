/* El HUD del visor móvil. Lo que se puede probar sin un dedo es: cómo se
   formatea el contador, qué se enseña en cada parada, y que el plazo de
   ocultado sea el que la spec decidió y no el del escritorio.

   El plazo se comprueba contra la CONSTANTE en vivo (`MovilHud.OCULTAR_TRAS`)
   y no contra un 3000 escrito a mano en cada prueba, para que las pruebas se
   adapten solas si el estudio pide otro plazo tras verlo en un móvil. La única
   que fija el número es la de abajo, que existe justamente para que cambiarlo
   sea una decisión y no un descuido. */

describe('MovilHud — el contador', function () {

  /* Dos cifras, igual que la rejilla de la portada y que el contador del
     escritorio: `02/08` y no `2/8`. Que no baile el ancho al pasar de la 9 a
     la 10 es la razón. */
  prueba('rellena con cero a la izquierda, en los dos lados', function () {
    igual(MovilHud.contador(2, 8), '02/08');
  });

  prueba('con dos cifras no rellena de más', function () {
    igual(MovilHud.contador(10, 12), '10/12');
  });

  /* La ficha es una parada del eje, pero no es una pieza: enseñar `06/05` allí
     sería mentir sobre dónde estás. */
  prueba('en la ficha no hay contador', function () {
    igual(MovilHud.contador('ficha', 8), '');
  });

  /* Un proyecto de vídeo tiene cero piezas y su parada es `null`. Un `00/00`
     no dice nada y ocupa sitio sobre la foto. */
  prueba('en el vídeo no hay contador', function () {
    igual(MovilHud.contador(null, 0), '');
  });
});

describe('MovilHud — el plazo de ocultado', function () {

  /* Esta prueba fija el NÚMERO, y es la única que lo hace. Existe para que
     cambiar el plazo sea una decisión deliberada y no un descuido: el
     escritorio oculta a los 2000 (`js/visor-chrome.js`, la constante
     `OCULTAR_TRAS`) y aquí son 3000, porque allí el chrome se despierta con
     cualquier movimiento del ratón —gratis y constante— y en táctil hay que
     tocar a propósito. */
  prueba('son 3 segundos, no los 2 del escritorio', function () {
    igual(MovilHud.OCULTAR_TRAS, 3000);
  });
});

describe('MovilHud — qué se enseña en cada parada', function () {

  var HUD_MARCADO =
    '<div>' +
    '  <div id="hudRaiz">' +
    '    <button id="hudCat" type="button"></button>' +
    '    <ul id="hudCats"></ul>' +
    '    <button id="hudCerrar" type="button"></button>' +
    '    <p id="hudTitulo"></p>' +
    '    <span id="hudContador"></span>' +
    '  </div>' +
    '</div>';

  var HUD_PROYECTO = {
    id: 'niebla', titulo: 'Niebla', categoria: 'foto-stills',
    piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }]
  };

  function conHud(fn) {
    return ArnesDom.conElemento(HUD_MARCADO, function (caja) {
      var antes = window.Datos;
      /* Las cuatro de verdad, copiadas de `js/reglas-contenido.js`, que es su
         única fuente. Inventarse una lista más corta aquí dejaría la prueba
         del desplegable contando un número que no es el de producción. */
      window.Datos = {
        CATEGORIAS: ['editorial', 'foto-stills', 'cortometraje', 'videoclip']
      };
      var refs = {
        raiz:     caja.querySelector('#hudRaiz'),
        cat:      caja.querySelector('#hudCat'),
        cats:     caja.querySelector('#hudCats'),
        cerrar:   caja.querySelector('#hudCerrar'),
        titulo:   caja.querySelector('#hudTitulo'),
        contador: caja.querySelector('#hudContador')
      };
      MovilHud.init(refs, function () {}, function () {});
      try { return fn(refs); } finally { window.Datos = antes; }
    });
  }

  prueba('el título es el del trabajo', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.titulo.textContent;
    }), 'Niebla');
  });

  /* La categoría se enseña con el guion cambiado por un espacio, igual que ya
     hace el escritorio en `VisorFicha.pintar`: `foto-stills` —la de
     `HUD_PROYECTO`, y la única de las cuatro de `js/reglas-contenido.js` que
     lleva guion— es un identificador de URL, no algo que se le enseñe a
     nadie. */
  prueba('la categoría se lee, no se enseña su identificador', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.cat.textContent;
    }), 'foto stills');
  });

  prueba('el contador dice en qué pieza estás', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.contador.textContent;
    }), '02/03');
  });

  prueba('el desplegable trae las cuatro categorías más «todos»', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.cats.querySelectorAll('button').length;
    }), 5);
  });

  /* Pintar dos veces no acumula: deslizar repinta el HUD en cada parada, y sin
     vaciar el desplegable crecería con cada gesto. */
  prueba('repintar no acumula categorías', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 1, 3);
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      MovilHud.pintar(HUD_PROYECTO, 3, 3);
      return refs.cats.querySelectorAll('button').length;
    }), 5);
  });

  /* Al pintar una parada nueva el HUD se despierta: acabas de moverte, así que
     quieres saber dónde has caído. El plazo vuelve a correr desde cero. */
  prueba('pintar despierta el HUD', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return { visible: MovilHud.visible(),
               clase: refs.raiz.classList.contains('dormido') };
    }), { visible: true, clase: false });
  });
});
