/* `js/galeria.js` no tiene más pruebas que las de esta guarda: el resto de
   su superficie —`construir`, `aplicarFiltro`...— necesita el escenario
   espacial entero (`GaleriaPaneo`, `GaleriaTeclado`, un `#spatialCanvas`
   medible) y nunca se ha montado en esta página de pruebas. `remedir()` es
   la excepción: su primera línea es una guarda que no toca nada del
   escenario, así que se puede comprobar sin construirlo del todo.

   Dos pruebas y no una, porque la guarda tiene DOS variables y `||` no es lo
   mismo que `&&`: con `stage`/`canvas` los dos en null (nunca se llamó a
   `Galeria.init()`) las dos formas del operador dan el mismo resultado, así
   que esa combinación sola no distingue nada. Hace falta el otro caso —
   `stage` con nodo y `canvas` en null—, que SÍ se puede alcanzar: `init()`
   (`js/galeria.js`, las dos primeras asignaciones del cuerpo de `init`,
   sobre las líneas 211-212) asigna primero `stage` y `canvas`, y su propia
   guarda `if (!stage || !canvas) return;` —la de `init`, no la de
   `remedir`, que hoy tiene el texto idéntico— sólo corta DESPUÉS, así que
   un marcado con `#spatialStage` pero sin `#spatialCanvas` dentro de
   `init()` deja exactamente eso: `stage` con nodo, `canvas` en null. Con
   `&&` en la guarda de `remedir()`, ese estado NO cortaría, y
   `GaleriaPaneo.medir()` reventaría por su cuenta (`stage` sin inicializar
   en ese módulo, porque `GaleriaPaneo.init()` tampoco llegó a correr). */
describe('Galeria.remedir — la guarda antes de inicializar', function () {

  /* No basta con "no lanza": `requestAnimationFrame` con una función válida
     nunca lanza, la llame quien la llame. Lo que distingue a la guarda es que
     NO se llegue a programar el fotograma; por eso se espía en vez de
     comprobar sólo la ausencia de excepción. */
  prueba('sin galeria inicializada, remedir no programa ningún fotograma', function () {
    var llamadas = 0;
    var original = window.requestAnimationFrame;
    window.requestAnimationFrame = function () { llamadas++; };
    try {
      Galeria.remedir();
    } finally {
      window.requestAnimationFrame = original;
    }
    igual(llamadas, 0);
  });

  /* Mata el mutante `||` → `&&` de la guarda (js/galeria.js): con `&&`, este
     escenario NO cortaría y `remedir()` programaría un fotograma que no debe
     programar. No hace falta llegar a ejecutar ese fotograma —ni falsificar
     `GaleriaPaneo`, que ni siquiera se carga en esta página (`tests/test.html`
     carga `../js/galeria.js` y no `../js/galeria-paneo.js`; ver su lista de
     `<script>`, sobre las líneas 27-30)— porque espiar
     `requestAnimationFrame` ya distingue las dos formas del operador sin
     necesidad de que el fotograma llegue a correr.

     `Galeria.init()` deja aquí el estado que hace falta y se para sola: con
     `#spatialCanvas` ausente, la guarda DE `init` (`js/galeria.js`, la
     línea siguiente a las dos asignaciones del cuerpo de `init`, sobre la
     línea 213 — ojo, no la guarda de `remedir`, sobre la 204, que tiene el
     texto exacto igual) corta antes de llamar a `GaleriaPaneo.init()`, así
     que no hace falta que `GaleriaPaneo` exista para que este montaje sea
     seguro. Nota: esto deja `Galeria` con `stage`/`canvas` mutados para el
     resto de la suite —no hay forma de «desinicializarla»—, y por eso esta
     prueba va DESPUÉS de la de arriba, que necesita el estado limpio de
     partida. */
  prueba('con stage pero sin canvas, remedir tampoco programa ningún fotograma', function () {
    ArnesDom.conElemento('<div id="spatialStage"></div>', function () {
      Galeria.init();

      var llamadas = 0;
      var original = window.requestAnimationFrame;
      window.requestAnimationFrame = function () { llamadas++; };
      try {
        Galeria.remedir();
      } finally {
        window.requestAnimationFrame = original;
      }
      igual(llamadas, 0);
    });
  });

  /* La rama que hace el trabajo, que hasta ahora no cubría nadie: con
     `stage` Y `canvas` puestos, `remedir()` tiene que PROGRAMAR un fotograma
     —no medir en el acto— y ese fotograma tiene que llamar a
     `GaleriaPaneo.medir()`.

     Es lo que distingue el `requestAnimationFrame` de una llamada síncrona,
     y sin esta prueba esa diferencia no la fijaba nada: sustituirlo por
     `window.GaleriaPaneo.medir()` a secas dejaba la suite entera en verde
     (medido). Las otras dos pruebas de arriba no pueden cazarlo porque las
     dos se paran en la guarda y las dos esperan CERO fotogramas: un espía
     que cuenta cero sigue contando cero si la línea espiada desaparece.

     Aquí sí hay que falsificar `GaleriaPaneo` y `GaleriaTeclado`: con los dos
     nodos presentes, `Galeria.init()` ya no se para en su guarda y llama a
     `GaleriaPaneo.init()` y a `GaleriaTeclado.init()`, y ninguno de los dos
     ficheros se carga en esta página (ver tests/test.html). El doble de
     `medir` sirve además para comprobar que el fotograma programado hace el
     trabajo, y no sólo que se programó.

     Va la ÚLTIMA de las tres, y su residuo es MAYOR que el de la anterior,
     no el mismo: al pasar la guarda de `init` —que es justo lo que esta
     prueba busca— se ejecuta el resto del cuerpo de `init`, así que además
     de dejar `stage`/`canvas` apuntando a nodos ya desconectados
     (`ArnesDom.conElemento` los retira en su `finally`) deja colgados un
     `focusin` sobre ese `stage`, un suscriptor de `Router.alCambiar`, un
     `keydown` en `document`, y `porElemento`/`anchoBase` poblados por
     `construir()`. La prueba anterior no dejaba nada de eso porque salía
     por la guarda antes de llegar. No hay forma de «desinicializar» el
     módulo, así que el residuo se queda.

     Hoy es inocuo, y está medido, no supuesto: el `Router` de esta página
     no arranca nunca —`Router.init()` sólo se llama dentro de los iframes
     de `tests/pruebas-router-ir.js`, sobre la línea 39—, así que el
     suscriptor no se invoca jamás; y el `keydown` sale por
     `categoria !== null` con `categoria` en `null`. Comprobado además
     moviendo esta sección al final de `tests/test.html`: el recuento no se
     mueve (324/0 en las dos posiciones), y al terminar la suite
     `categoriaActiva` es `null`, `document.body.className` está vacío y no
     queda ninguna `.arnes-dom-caja` viva.

     Lo que sí queda es una trampa cargada para el futuro: a partir de aquí
     `Galeria.remedir()` ya no corta en su guarda y programa un fotograma
     que llamaría a `window.GaleriaPaneo.medir()` con `GaleriaPaneo` de
     vuelta a `undefined`. No lanza de forma síncrona (medido), así que el
     fallo se iría al fotograma, fuera de cualquier `prueba()` — si alguien
     añade pruebas de `Galeria` detrás, que empiece por aquí. */
  prueba('con stage y canvas, remedir programa un fotograma que mide', function () {
    var paneoOriginal = window.GaleriaPaneo;
    var tecladoOriginal = window.GaleriaTeclado;
    var rafOriginal = window.requestAnimationFrame;
    var medidas = 0;
    var programadas = [];
    try {
      window.GaleriaPaneo = {
        init: function () {},
        medir: function () { medidas++; }
      };
      window.GaleriaTeclado = { init: function () {} };

      ArnesDom.conElemento(
        '<div><div id="spatialStage"><div id="spatialCanvas"></div></div></div>',
        function () {
          Galeria.init();

          window.requestAnimationFrame = function (fn) { programadas.push(fn); };
          Galeria.remedir();

          /* Programado, y exactamente uno: con una llamada síncrona serían
             cero programados y una medida ya hecha aquí mismo. */
          igual(programadas.length, 1);
          igual(medidas, 0);

          /* Y lo que se programó es el trabajo de verdad, no un hueco. */
          programadas[0]();
          igual(medidas, 1);
        }
      );
    } finally {
      window.requestAnimationFrame = rafOriginal;
      window.GaleriaPaneo = paneoOriginal;
      window.GaleriaTeclado = tecladoOriginal;
    }
  });
});
