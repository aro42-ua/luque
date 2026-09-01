/* `js/galeria.js` no tiene más pruebas que ésta: el resto de su superficie
   —`construir`, `init`, `aplicarFiltro`...— necesita el escenario espacial
   entero (`GaleriaPaneo`, `GaleriaTeclado`, un `#spatialCanvas` medible) y
   nunca se ha montado en esta página de pruebas. `remedir()` es la
   excepción: su primera línea es una guarda que no toca nada del escenario,
   así que se puede comprobar sin construirlo.

   Lo que se fija es sólo esa guarda, con `stage`/`canvas` en su valor de
   partida —null, porque `Galeria.init()` no se llama en ningún otro sitio de
   la suite—: `remedir()` antes de inicializar no tiene que programar nada. */
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
});
