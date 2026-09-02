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
   (js/galeria.js) asigna primero `stage` y `canvas` (líneas 200-201) y su
   propia guarda `if (!stage || !canvas) return;` sólo corta DESPUÉS, así que
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
     `GaleriaPaneo`, que ni siquiera se carga en esta página (ver
     tests/test.html:27-30)— porque espiar `requestAnimationFrame` ya
     distingue las dos formas del operador sin necesidad de que el fotograma
     llegue a correr.

     `Galeria.init()` deja aquí el estado que hace falta y se para sola: con
     `#spatialCanvas` ausente, su propia guarda (js/galeria.js:202) corta
     antes de llamar a `GaleriaPaneo.init()`, así que no hace falta que
     `GaleriaPaneo` exista para que este montaje sea seguro. Nota: esto deja
     `Galeria` con `stage`/`canvas` mutados para el resto de la suite —no hay
     forma de «desinicializarla»—, y por eso esta prueba va DESPUÉS de la de
     arriba, que necesita el estado limpio de partida. */
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
});
