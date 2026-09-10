/* El hero deslizante: la puerta de entrada de la portada móvil. */
describe('MovilPuerta — el hero deslizante', function () {

  /* El alto del `#h` es load-bearing: `MovilArrastre` compara lo levantado
     contra un cuarto de él, así que un `<div>` pelado —que mide cero— haría
     que la puerta se cruzara con cualquier arrastre, incluso hacia abajo, por
     la rama degenerada que `js/movil-arrastre.js` documenta como trampa. Con
     800px el umbral de la posición son 200 de verdad, y es contra ese número
     contra el que está calibrado `deslizarArriba`. */
  var MARCO =
    '<div>' +
      '<div class="hoja-hero" id="h" style="height:800px"></div>' +
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

  /* Un deslizamiento hacia arriba que cruza la puerta por POSICIÓN, no por
     golpe: 400px de recorrido contra el marco de 800, muy por encima del
     cuarto de pantalla —200px— que pide `MovilArrastre.FRACCION`.

     Cruzar por posición no es una preferencia, es lo único que se puede
     sintetizar. La rama del golpe necesita velocidad; la velocidad sale de
     `timeStamp`; y `Event.timeStamp` se fija al CONSTRUIR el evento, es de
     sólo lectura, y Chrome lo cuantiza a 100 µs. Construir el `pointermove`,
     despacharlo y construir el `pointerup` cabe en el mismo cubo el 97% de
     las veces —medido, 500 intentos—, así que `dt` sale 0, la velocidad sale
     0 —`MovilArrastre` lo hace a propósito para no dividir por cero— y el
     golpe no dispara. Un ayudante que cruzara por golpe deja la suite roja
     una de cada tres corridas, que es exactamente lo que pasó al escribirlo
     así en la primera versión de esta tarea.

     La rama del golpe NO se queda sin cubrir: está probada a fondo en
     `tests/pruebas-movil-arrastre.js`, donde el instante es un parámetro de la
     función en vez de un reloj que no se puede fijar. Aquí lo que hace falta
     es CRUZAR.

     El `pointermove` del medio es obligatorio desde el bloque 4e: sin él el
     gesto es un dedo que no se movió y la hoja nunca se levanta. */
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 780, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointermove',
      { clientX: 100, clientY: 400, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 380, bubbles: true }));
  }

  function deslizarAbajo(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 210, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointermove',
      { clientX: 100, clientY: 270, bubbles: true }));
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
     esperar la salida, así que no ve la diferencia. Y quitarlo en el acto es
     justo el defecto que el diferido existe para evitar — el comentario de
     `SALIDA_MS` lo dice: el nodo se iría «de golpe a mitad de la salida».

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

  /* Lo único de esta tarea que la suite puede ver: que la hoja se mueve
     MIENTRAS el dedo se mueve, no al soltar. Que se sienta bien es una
     comprobación humana, y que `touch-action` impida el tirón de recarga no se
     puede comprobar sin un teléfono.

     No se afirma el valor exacto del `transform` a propósito: eso ataría la
     prueba a la unidad y al formato que el navegador elija al serializar el
     estilo en línea. Lo que se fija es el comportamiento — antes de moverse no
     hay nada, después sí. */
  /* `window.matchMedia` se falsifica, y no por comodidad: sin eso esta prueba
     diría cosas distintas según DÓNDE se corra. La preferencia es del sistema
     operativo, así que un compañero que la tenga puesta —o un portátil en modo
     de ahorro— vería fallar esta prueba sin haber tocado nada. Una prueba que
     depende del entorno no fija comportamiento, sólo hace ruido.

     Que conste medido, porque circula lo contrario: este Chrome headless NO
     declara `reduce` por defecto —`matchMedia('(prefers-reduced-motion:
     reduce)').matches` da `false`, y para medir la otra rama hay que pasarle
     `--force-prefers-reduced-motion`—. O sea que hoy la prueba pasaría igual
     sin falsificar nada; se falsifica para que siga pasando en la máquina de
     quien no tenga esa suerte.

     El `finally` es obligatorio: dejar `matchMedia` falsificado envenenaría
     todo lo que corra después en la misma página. */
  prueba('la hoja se levanta mientras el dedo arrastra, no al soltar', function () {
    var original = window.matchMedia;
    var estilos;
    try {
      window.matchMedia = function () { return { matches: false }; };
      estilos = conElHero(rutaPortada(), function (hero) {
        var alApoyar;
        hero.dispatchEvent(new PointerEvent('pointerdown',
          { clientX: 100, clientY: 300, bubbles: true }));
        alApoyar = hero.style.transform;
        hero.dispatchEvent(new PointerEvent('pointermove',
          { clientX: 100, clientY: 240, bubbles: true }));
        return [alApoyar, hero.style.transform.indexOf('translateY') !== -1];
      });
    } finally {
      window.matchMedia = original;
    }
    igual(estilos, ['', true]);
  });

  /* La otra mitad de la misma decisión, y hace falta las dos: con la
     preferencia puesta el dedo NO arrastra nada. Sin esta prueba, una
     implementación que ignore `prefers-reduced-motion` y pinte siempre pasa
     la de arriba y nadie se entera. */
  prueba('con movimiento reducido el dedo no arrastra la hoja', function () {
    var original = window.matchMedia;
    var transform;
    try {
      window.matchMedia = function () { return { matches: true }; };
      transform = conElHero(rutaPortada(), function (hero) {
        hero.dispatchEvent(new PointerEvent('pointerdown',
          { clientX: 100, clientY: 300, bubbles: true }));
        hero.dispatchEvent(new PointerEvent('pointermove',
          { clientX: 100, clientY: 240, bubbles: true }));
        return hero.style.transform;
      });
    } finally {
      window.matchMedia = original;
    }
    igual(transform, '');
  });

  /* Las dos de abajo NECESITAN la rama de movimiento reducido apagada, y no por
     gusto: con `reduce` puesta el dedo no pinta nada, así que no habría estilo
     en línea que limpiar y las dos pasarían sin ejercitar la línea que vienen a
     fijar. Se falsifica `matchMedia` por lo mismo que en las dos de arriba —la
     preferencia es del sistema operativo, y una prueba que dependa de ella
     falla en la máquina de otro sin que nadie haya tocado nada— y con el mismo
     `finally`, que si se queda puesto envenena todo lo que corra después. */
  function sinMovimientoReducido(fn) {
    var original = window.matchMedia;
    try {
      window.matchMedia = function () { return { matches: false }; };
      return fn();
    } finally {
      window.matchMedia = original;
    }
  }

  /* `limpiarEstilo()` dentro de `alSoltar` (js/movil-puerta.js) era un mutante
     silencioso: quitándola, la suite entera seguía en verde —medido: 347 pasan,
     0 fallan— y en un navegador de verdad la hoja se quedaba CLAVADA en el
     `translateY` donde estuviera el dedo, porque el estilo en línea gana a
     cualquier clase. O sea que el defecto que este bloque venía a arreglar
     volvía entero, y peor, sin una sola prueba en rojo.

     El hueco era de mirada, no de escenario: las quince pruebas de esta puerta
     miran el `transform` DURANTE el `pointermove` y ninguna lo miraba DESPUÉS
     de soltar. Estas dos cubren las dos mitades del gesto, que son las dos que
     el comentario de `limpiarEstilo` promete.

     El primer valor de la primera no es decorativo: comprueba que el estilo
     llegó a pintarse. Sin él, una implementación que no pintara nunca las
     pasaría las dos sin haber hecho nada. */
  prueba('al soltar a medias, la hoja vuelve: no queda estilo en línea que la clave', function () {
    igual(sinMovimientoReducido(function () {
      return conElHero(rutaPortada(), function (hero) {
        hero.dispatchEvent(new PointerEvent('pointerdown',
          { clientX: 100, clientY: 300, bubbles: true }));
        hero.dispatchEvent(new PointerEvent('pointermove',
          { clientX: 100, clientY: 240, bubbles: true }));
        var arrastrando = hero.style.transform.indexOf('translateY') !== -1;
        hero.dispatchEvent(new PointerEvent('pointerup',
          { clientX: 100, clientY: 240, bubbles: true }));
        return [arrastrando, hero.style.transform, hero.style.transition,
                MovilPuerta.heroIdo()];
      });
    }), [true, '', '', false]);
  });

  /* Y al CRUZAR tampoco queda: es lo que deja que la transición de `.fuera`
     arranque desde donde está el dedo. Con el estilo puesto, `translateY(-370px)`
     le gana a la clase y la hoja se congela ahí hasta que el nodo desaparece de
     golpe a los 380ms. */
  prueba('y al cruzar tampoco, para que la salida arranque desde donde está el dedo', function () {
    igual(sinMovimientoReducido(function () {
      return conElHero(rutaPortada(), function (hero) {
        deslizarArriba(hero);
        return [hero.style.transform, hero.style.transition,
                hero.classList.contains('fuera')];
      });
    }), ['', '', true]);
  });
});
