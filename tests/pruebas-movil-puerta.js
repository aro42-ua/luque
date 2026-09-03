/* El hero fundido: la puerta de entrada de la portada móvil. */
describe('MovilPuerta — el hero fundido', function () {

  var MARCO =
    '<div>' +
      '<div class="hoja-hero" id="h"></div>' +
      '<ol class="hoja-rejilla" id="r"></ol>' +
    '</div>';

  function conElHero(ruta, fn) {
    return ArnesDom.conElemento(MARCO, function (raiz) {
      var hero = raiz.querySelector('#h');
      var rejilla = raiz.querySelector('#r');
      MovilPuerta.entrada(hero, raiz, rejilla, ruta);
      return fn(hero, raiz, rejilla);
    });
  }

  function rutaPortada()  { return { tipo: 'todos', valor: null, pieza: null }; }
  function rutaProyecto() { return { tipo: 'proyecto', valor: 'bruma', pieza: 3 }; }
  function rutaCategoria(){ return { tipo: 'categoria', valor: 'editorial', pieza: null }; }

  /* Un deslizamiento hacia arriba de verdad: 90px de recorrido vertical, muy
     por encima de los 24 de MovilGestos.UMBRAL y sin componente horizontal que
     lo convierta en diagonal. Los eventos se sintetizan porque un navegador de
     escritorio no genera toques. */
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 300, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 210, bubbles: true }));
  }

  function deslizarAbajo(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 210, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 300, bubbles: true }));
  }

  prueba('en la portada, el hero se queda', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      return !MovilPuerta.heroIdo() && !hero.classList.contains('fuera');
    }), 'con la ruta vacía el hero tiene que verse');
  });

  /* «Quien llegue por un enlace profundo no lo ve en absoluto»: el enlace
     pedía un trabajo concreto y anteponerle una portada sería desobedecerlo. */
  prueba('un enlace a un proyecto se salta el hero', function () {
    cierto(conElHero(rutaProyecto(), function () {
      return MovilPuerta.heroIdo();
    }), 'con #/bruma/3 el hero no puede aparecer');
  });

  prueba('un enlace a una categoría también se lo salta', function () {
    cierto(conElHero(rutaCategoria(), function () {
      return MovilPuerta.heroIdo();
    }), 'con #/editorial el hero no puede aparecer');
  });

  /* El tercer valor fija que la retirada va DIFERIDA, y es lo único de la
     suite que lo distingue: en el instante siguiente al gesto la puerta ya
     está marcada como cruzada —`heroIdo()` y la clase `fuera`— pero el nodo
     TODAVÍA está en el documento, esperando su `setTimeout(SALIDA_MS)`.

     Sin esto, `cerrarPuerta` podría llamar a `quitarNodo()` en el acto y la
     suite entera seguiría en verde: la prueba asíncrona sólo mira después de
     esperar el fundido, así que no ve la diferencia. Y quitarlo en el acto es
     justo el defecto que el diferido existe para evitar — el comentario de
     `SALIDA_MS` lo dice: el nodo se iría «de golpe a mitad del fundido».

     Se busca con `raiz.querySelector` y no en `document`: la caja del arnés
     vive dentro del documento, pero lo que importa es este árbol. */
  prueba('deslizar hacia arriba se lleva el hero', function () {
    igual(conElHero(rutaPortada(), function (hero, raiz) {
      deslizarArriba(hero);
      return [MovilPuerta.heroIdo(), hero.classList.contains('fuera'),
              raiz.querySelector('.hoja-hero') !== null];
    }), [true, true, true]);
  });

  /* La spec dice «se va al deslizar hacia ARRIBA». Hacia abajo no es la
     puerta: sin esta prueba, cualquier deslizamiento la abriría. */
  prueba('deslizar hacia abajo no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarAbajo(hero);
      return !MovilPuerta.heroIdo() && !hero.classList.contains('fuera');
    }), 'hacia abajo no es el gesto');
  });

  /* Un toque tampoco: la spec dice «sin botón», y un toque que cerrara la
     puerta convertiría toda la pantalla en un botón. */
  prueba('un toque no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new PointerEvent('pointerdown',
        { clientX: 100, clientY: 300, bubbles: true }));
      hero.dispatchEvent(new PointerEvent('pointerup',
        { clientX: 102, clientY: 301, bubbles: true }));
      return !MovilPuerta.heroIdo();
    }), 'un toque no es un deslizamiento');
  });

  /* El interruptor es el ancho: por aquí pasa un escritorio de 700px con
     ratón y sin pantalla táctil. Sin la rueda se queda encerrado. */
  prueba('la rueda hacia abajo se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilPuerta.heroIdo();
    }), 'sin la rueda, una ventana estrecha con ratón no puede entrar');
  });

  prueba('la rueda hacia arriba no se lo lleva', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
      return !MovilPuerta.heroIdo();
    }), 'rodar hacia arriba no avanza');
  });

  /* Y sin el teclado se queda encerrado quien no usa ratón ni dedo. */
  prueba('el teclado también abre la puerta', function () {
    ['Enter', ' ', 'ArrowDown', 'PageDown', 'End'].forEach(function (tecla) {
      cierto(conElHero(rutaPortada(), function () {
        document.dispatchEvent(new KeyboardEvent('keydown',
          { key: tecla, bubbles: true }));
        return MovilPuerta.heroIdo();
      }), 'la tecla ' + tecla + ' tiene que abrir la puerta');
    });
  });

  prueba('una tecla cualquiera no la abre', function () {
    cierto(conElHero(rutaPortada(), function () {
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'a', bubbles: true }));
      return !MovilPuerta.heroIdo();
    }), 'escribir una letra no es cruzar la puerta');
  });

  /* La prueba que separa el diseño bueno de una sola bandera compartida por
     el módulo. `entrada()` deja vivo un oyente de teclado en `document`
     mientras su puerta no se cruce, y aquí se dejan dos a propósito: la
     entrada de fuera nunca cruza la suya, así que su oyente sigue escuchando
     cuando la de dentro —la vigente— entra en escena, y por ser la primera
     registrada atiende la tecla antes que ella.

     Lo que se mira NO es `heroIdo()`: con las dos versiones acaba valiendo
     `true`, y por eso el resto de pruebas de esta sección no distinguen una
     de otra. Se mira el hero y la rejilla de la entrada VIGENTE. Con `cerrada`
     local y `mia === generacion`, el oyente caduco cierra su propia puerta y
     el vigente llega a cerrar la suya. Con una bandera compartida, el caduco
     la pone y el vigente sale por la puerta de atrás sin tocar nada. */
  prueba('la tecla cierra la puerta de ahora, no la de una entrada anterior', function () {
    igual(conElHero(rutaPortada(), function () {
      return conElHero(rutaPortada(), function (hero, raiz, rejilla) {
        document.dispatchEvent(new KeyboardEvent('keydown',
          { key: 'Enter', bubbles: true }));
        return [MovilPuerta.heroIdo(), hero.classList.contains('fuera'),
                rejilla.getAttribute('aria-hidden')];
      });
    }), [true, true, null]);
  });

  prueba('cruzarla dos veces no lanza', function () {
    cierto(conElHero(rutaPortada(), function (hero) {
      deslizarArriba(hero);
      deslizarArriba(hero);
      hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      return MovilPuerta.heroIdo();
    }), 'el segundo gesto tiene que ser inofensivo');
  });

  /* Mientras el hero está delante, la rejilla no puede leerse por detrás, y la
     hoja lleva `con-hero` para que el CSS de la Tarea 6 no la deje
     desplazarse por detrás. Las dos marcas se ponen juntas al entrar y tienen
     que irse juntas al cruzar: una que se quedara puesta con el hero ya ido
     diría lo contrario de lo que pasa. */
  prueba('con el hero puesto, la rejilla queda oculta al lector', function () {
    igual(conElHero(rutaPortada(), function (hero, raiz, rejilla) {
      var antes = [rejilla.getAttribute('aria-hidden'),
                   raiz.classList.contains('con-hero')];
      deslizarArriba(hero);
      return [antes, [rejilla.getAttribute('aria-hidden'),
                      raiz.classList.contains('con-hero')]];
    }), [['true', true], [null, false]]);
  });
});
