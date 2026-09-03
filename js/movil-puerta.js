window.MovilPuerta = (function () {

  /* La puerta del hero: el amarillo con LUQUE! que hay delante de la rejilla y
     que se cruza una vez por visita.

     Vivía en `js/movil-hoja.js` hasta el bloque 4e, y salió de allí porque el
     cableado del arrastre no cabía bajo el techo de 300 líneas. La división no
     es sólo aritmética: una rejilla numerada y una puerta que se cruza una vez
     son dos responsabilidades, y sólo estaban juntas por haberse escrito en el
     mismo bloque. */

  /* Cuánto se espera antes de quitar el nodo. No tiene que CASAR con la
     transición de `.hoja-hero` en css/luque.css: tiene que ser mayor o igual,
     que no es lo mismo. Si fuera menor, el nodo desaparecería de golpe a
     mitad de la salida —el deslizamiento en la rama normal, el fundido en
     movimiento reducido—. Hoy la rama normal dura exactamente estos 380ms y
     la de movimiento reducido baja a 200, así que las dos caben. El porqué
     está desarrollado en el CSS, sobre `.hoja-hero`. */
  var SALIDA_MS = 380;

  var ido = false;

  /* Cuál de las llamadas a `entrada()` es la vigente. En producción sólo hay
     una y esto sobra; en la suite hay muchas seguidas, y sin este número las
     de antes pisarían a la de ahora. El porqué exacto está en `cerrarPuerta`. */
  var generacion = 0;

  function heroIdo() { return ido; }

  function entrada(hero, hoja, rejilla, ruta) {
    var mia = ++generacion;
    var cerrada = false;
    ido = false;

    function quitarNodo() {
      if (hero.parentNode) hero.parentNode.removeChild(hero);
    }

    /* Quien llega por un enlace a un trabajo concreto no quiere una portada:
       el enlace pedía ese trabajo y anteponerle una portada sería
       desobedecerlo. La regla ya está escrita y probada en
       `Hero.debeSaltarse` (js/hero.js); se reutiliza en vez de copiarla,
       porque dos copias de una regla es como empezó la deuda que pagó
       `js/reglas-contenido.js`. */
    if (window.Hero.debeSaltarse(ruta)) {
      ido = true;
      quitarNodo();
      return;
    }

    hoja.classList.add('con-hero');
    rejilla.setAttribute('aria-hidden', 'true');

    /* La puerta se cruza una vez.

       `cerrada` es LOCAL y `ido` es del módulo, y la diferencia sostiene el
       aislamiento entre pruebas. Cada llamada que NO se salta el hero suscribe
       un oyente de teclado en `document`, y sólo se da de baja al cruzar la
       puerta; las que salen por el `return` temprano del enlace profundo no
       llegan a suscribir ninguno. En la suite hay 19 llamadas a `entrada()`, de
       las que 17 suscriben oyente (contadas instrumentando `entrada` y
       `addEventListener` sobre la suite entera; el conteo está en el informe de
       la Tarea 4, no estimado a ojo).

       El escenario que este diseño impide: con una sola bandera compartida por
       el módulo, el oyente de una prueba anterior atendería la tecla de la
       prueba de ahora, pondría la bandera, y la entrada vigente saldría por la
       guarda sin que su propio hero se hubiera movido — la prueba pasaría en
       verde por el motivo equivocado.

       Ese fallo sólo aparece si se revierten LAS DOS piezas a la vez, y de las
       dos quien manda es `mia === generacion`: es lo que impide que una entrada
       caducada escriba en el estado del módulo, así que basta con él para que
       ningún oyente viejo toque lo que `heroIdo()` responde. `cerrada` local es
       la otra mitad: con ella cada oyente cierra sólo SU puerta, de modo que la
       entrada vigente corre su `cerrarPuerta` entera y llega a mover su hero
       aunque otro oyente se le haya adelantado.

       Quien lo fija es la prueba «la tecla cierra la puerta de ahora, no la de
       una entrada anterior», y mira el hero y la rejilla de la entrada vigente
       y NO `heroIdo()`, que acaba valiendo `true` con las dos versiones. */
    function cerrarPuerta() {
      /* Quitar esta guarda es un mutante equivalente, y no hay prueba que lo
         cace a propósito. Llamar dos veces al cuerpo tiene siete efectos, y
         seis son idempotentes por definición del API: `classList.add('fuera')`
         y `classList.remove('con-hero')` operan sobre un conjunto,
         `removeEventListener` de un oyente ya dado de baja y `removeAttribute`
         de un atributo ausente son no-ops silenciosos, y `cerrada = true` e
         `ido = true` reescriben `true` sobre `true`. El séptimo sólo programa
         un `setTimeout(quitarNodo)` de más, que se desactiva solo con la guarda
         de `parentNode` de `quitarNodo`. No queda nada observable que una
         prueba pueda fijar sin falsificar `window.setTimeout`, que sería fijar
         la implementación en vez del comportamiento.

         La guarda se queda igualmente porque expresa la invariante «la puerta
         se cruza una vez» para el próximo efecto que alguien añada aquí dentro,
         que no tiene por qué ser idempotente. */
      if (cerrada) return;
      cerrada = true;
      document.removeEventListener('keydown', alTeclado);
      if (mia === generacion) ido = true;
      hero.classList.add('fuera');
      /* Se quita al cruzar, y no sólo se pone al entrar: el CSS de la Tarea 6
         le da el significado «mientras el hero está delante, la rejilla no se
         desplaza por detrás», y dejarla puesta con el hero ya ido diría lo
         contrario de lo que pasa. */
      hoja.classList.remove('con-hero');
      rejilla.removeAttribute('aria-hidden');
      /* El nodo se QUITA, no se esconde: escondido seguiría siendo alcanzable
         con el tabulador y un lector de pantalla lo leería por detrás de una
         rejilla que ya está delante. */
      setTimeout(quitarNodo, SALIDA_MS);
    }

    /* TRES FORMAS DE CRUZAR LA PUERTA, y las tres hacen falta.
       El interruptor es el ANCHO y no el dedo (js/movil.js): por esta portada
       pasa una ventana de escritorio estrechada a 700px, con ratón y teclado y
       SIN pantalla táctil. Sin la rueda y sin el teclado, esa ventana se queda
       encerrada en el amarillo sin forma de salir. */

    /* 1. El dedo, que ahora LEVANTA la hoja en vez de limitarse a decidir
          cuando se va. La regla —golpe o posición— vive entera en
          `js/movil-arrastre.js`; aquí no se mide nada, sólo se le pasan los
          puntos y el tiempo del evento, y se pinta lo que responda. */
    var arrastre = window.MovilArrastre.inicial();

    /* Quien pidió menos movimiento no arrastra la hoja con el dedo: la decisión
       al soltar es la misma para todos, y lo que se suprime es el pintado
       continuo. Se lee una vez por entrada y no en cada `pointermove`, que
       serían decenas de consultas por gesto. */
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* El alto sale de `getBoundingClientRect` del propio hero y NO de
       `window.innerHeight`. Dos motivos, y el segundo está medido: el hero es
       `position:fixed; inset:0`, así que su alto ES el de la ventana; y
       `innerWidth`/`innerHeight` mienten bajo emulación de móvil en Chrome
       headless —está documentado en docs/estado-conocido.md— mientras que
       `getBoundingClientRect` sale correcto. Se mide al soltar y no al empezar,
       para que girar el teléfono a mitad de arrastre no decida con el alto de
       antes. */
    function altoDeLaVentana() { return hero.getBoundingClientRect().height; }

    function pintarArrastre() {
      hero.style.transition = 'none';
      hero.style.transform =
        'translateY(-' + window.MovilArrastre.levantado(arrastre) + 'px)';
    }

    /* Deja el elemento sin estilo en línea, y hace falta en las DOS ramas de
       soltar: el estilo en línea gana a cualquier clase, así que un `transform`
       olvidado clava la hoja a medio camino y ya no la mueve ni `.fuera` ni el
       reposo.

       Y hay que llamarla ANTES de `cerrarPuerta()`, no después, aunque parezca
       que eso devuelve la hoja a su sitio de un salto. No lo hace: al quitar el
       estilo en línea y añadir la clase sin forzar ningún reflujo entre medias,
       el navegador calcula el estilo una sola vez, y la transición arranca
       desde el `translateY` que hay pintado ahora hasta el `-100%` de `.fuera`.
       Un `offsetHeight` colado entre las dos líneas sí rompería esto. */
    function limpiarEstilo() {
      hero.style.transition = '';
      hero.style.transform = '';
    }

    hero.addEventListener('pointerdown', function (e) {
      /* El estado se apunta ANTES de capturar, y el orden de estas dos líneas
         es load-bearing: la captura de abajo LANZA con los eventos de la
         suite, y si se invirtieran, la excepción saldría del oyente antes de
         apuntar nada y el arrastre se rompería entero en silencio. */
      arrastre = window.MovilArrastre.empezar(arrastre, { y: e.clientY }, e.timeStamp);
      /* Sin capturar el puntero, sacar el dedo del hero mata el arrastre a
         mitad y la hoja se queda donde estuviera.

         Va en `try` porque `setPointerCapture` lanza `NotFoundError` cuando el
         `pointerId` no es el de un puntero ACTIVO, y la spec obliga a que
         lance. Un `new PointerEvent(...)` sin `pointerId` trae el 0, que no es
         ningún puntero de verdad, así que todos los gestos sintetizados de la
         suite pasan por aquí lanzando —medido: «No active pointer with the
         given id is found»—. Comprobar que el método existe no bastaba:
         existe, y aun así lanza. Hoy no pone nada en rojo sólo porque el arnés
         no instala `window.onerror`; el día que alguien añada ese portón, la
         suite entera se caería por esto.

         Se traga sin más: no poder capturar el puntero no rompe el arrastre,
         sólo lo deja sin la red de seguir al dedo fuera del hero, que es justo
         lo que un puntero que no existe no necesita. */
      try {
        hero.setPointerCapture(e.pointerId);
      } catch (sinPunteroActivo) {}
    });

    hero.addEventListener('pointermove', function (e) {
      if (!arrastre.activo) return;
      arrastre = window.MovilArrastre.mover(arrastre, { y: e.clientY }, e.timeStamp);
      if (!reducido) pintarArrastre();
    });

    /* El punto del propio `pointerup` entra como una muestra más ANTES de
       soltar, y no es cosmético: en un arrastre de verdad el navegador manda
       un `pointermove` justo antes de levantar el dedo —no siempre: un toque
       limpio da `pointerdown` y `pointerup` a secas—, y un evento sintetizado
       puede no mandarlo nunca. Sin esta muestra el estado se habría quedado en
       el punto de apoyo y el recorrido saldría cero. Alimentarlo aquí hace que
       la decisión use la última posición real pase lo que pase. */
    function alSoltar(e) {
      if (!arrastre.activo) return;
      arrastre = window.MovilArrastre.mover(arrastre, { y: e.clientY }, e.timeStamp);
      var r = window.MovilArrastre.soltar(arrastre, altoDeLaVentana());
      arrastre = r.estado;
      limpiarEstilo();
      if (r.salir) cerrarPuerta();
    }

    hero.addEventListener('pointerup', alSoltar);
    /* `pointercancel` llega cuando el navegador se queda el gesto: una llamada
       entrante, el gesto de sistema del borde de la pantalla. Sin esta rama la
       hoja se quedaría levantada para siempre con el dedo ya fuera. */
    hero.addEventListener('pointercancel', alSoltar);

    /* 2. La rueda, para el ratón de una ventana estrecha. */
    hero.addEventListener('wheel', function (e) {
      if (e.deltaY > 0) cerrarPuerta();
    }, { passive: true });

    /* 3. El teclado, para quien no usa ni dedo ni ratón. Va en `document` y no
          en el hero para no depender de que el hero tenga el foco: no es un
          botón y no debe pedirlo. Se da de baja al cerrar, que es lo que
          impide que se acumulen. */
    function alTeclado(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' ||
          e.key === 'PageDown' || e.key === 'End') {
        cerrarPuerta();
      }
    }
    document.addEventListener('keydown', alTeclado);
  }

  return {
    /* Se exporta para que una prueba pueda esperar lo que dura la salida sin
       adivinarlo, y para que el CSS mida su transición contra este número en
       vez de contra una copia suya. */
    SALIDA_MS: SALIDA_MS,
    entrada: entrada,
    heroIdo: heroIdo
  };
})();
