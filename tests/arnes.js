(function (global) {
  var salida = null;
  var pasadas = 0;
  var fallidas = 0;

  function asegurarSalida() {
    if (!salida) salida = document.getElementById('salida');
    return salida;
  }

  var pendientes = [];

  function titular(nombre) {
    var h = document.createElement('h2');
    h.textContent = nombre;
    asegurarSalida().appendChild(h);
  }

  function describe(nombre, fn) {
    titular(nombre);
    fn();
  }

  /* Para lo que hay que ir a buscar antes de poder comprobarlo, como el
     contenido.json de verdad. La `fn` devuelve una promesa; sus `prueba()` son
     síncronas igual que las demás, sólo que se ejecutan cuando el dato llega.
     El titular se pinta también entonces, para que no quede huérfano arriba. */
  function describeAsync(nombre, fn) {
    pendientes.push(
      Promise.resolve()
        .then(function () { titular(nombre); return fn(); })
        .catch(function (e) {
          prueba('la sección entera se cayó', function () { throw e; });
        })
    );
  }

  function prueba(nombre, fn) {
    var linea = document.createElement('div');
    try {
      fn();
      linea.className = 'ok';
      linea.textContent = 'PASA   ' + nombre;
      pasadas++;
    } catch (e) {
      linea.className = 'fallo';
      linea.textContent = 'FALLA  ' + nombre + ' — ' + e.message;
      fallidas++;
    }
    asegurarSalida().appendChild(linea);
  }

  /* NO QUITES ESTE `replacer` PARA «SIMPLIFICAR». Es lo único que impide que
     `igual` dé por buenas comparaciones que no lo son.

     `JSON.stringify` no sabe escribir los números que no son finitos y los
     convierte en `null`:

         JSON.stringify(NaN)       -> "null"
         JSON.stringify(Infinity)  -> "null"
         JSON.stringify(-Infinity) -> "null"
         JSON.stringify(null)      -> "null"

     Con un `stringify` a secas, `igual(NaN, null)` PASA. Y eso pone en verde
     justo la prueba que más importa: la que comprueba que una función devuelve
     `null` cuando no hay resultado. Si el código empezara a devolver `NaN` por
     una cuenta rota, la prueba seguiría en verde y nadie se enteraría — un NaN
     no da error, sólo resultados equivocados (`Math.max(0, NaN)` es NaN, y
     `splice(NaN, …)` lo trata como 0, así que reordena en silencio).

     No es hipotético: una prueba de `Lista.indiceValido` escrita con `igual`
     pasaba con la función devolviendo NaN, y sólo se descubrió al mutarla a
     propósito para ver si la prueba caía. No cayó.

     El `replacer` se aplica también dentro de arrays y objetos, que es donde
     nadie miraría: `[NaN]` y `[null]` colisionaban igual.

     Queda un hueco teórico: si alguien comparase contra la cadena literal
     '<NaN>'. Nadie lo hace, y cerrarlo pediría un comparador propio en vez de
     JSON. Hay pruebas en pruebas-arnes.js que caen si esto se revierte. */
  function representar(clave, valor) {
    if (typeof valor === 'number' && !isFinite(valor)) return '<' + String(valor) + '>';
    return valor;
  }

  function igual(actual, esperado, mensaje) {
    var a = JSON.stringify(actual, representar);
    var e = JSON.stringify(esperado, representar);
    if (a !== e) {
      throw new Error((mensaje ? mensaje + ': ' : '') + 'esperaba ' + e + ' y recibió ' + a);
    }
  }

  function cierto(valor, mensaje) {
    if (!valor) throw new Error(mensaje || 'esperaba un valor verdadero');
  }

  /* El recuento se pinta cuando han terminado también las secciones que
     esperan a la red: si se pintara antes, diría un número que no es el final
     y el que lo lea se quedará con él. */
  function resumen() {
    return Promise.all(pendientes).then(function () {
      var p = document.createElement('p');
      p.className = fallidas === 0 ? 'ok' : 'fallo';
      p.textContent = '——— ' + pasadas + ' pasan, ' + fallidas + ' fallan ———';
      asegurarSalida().appendChild(p);
    });
  }

  global.Arnes = { describe: describe, describeAsync: describeAsync, prueba: prueba,
                   igual: igual, cierto: cierto, resumen: resumen };
  global.describe = describe;
  global.describeAsync = describeAsync;
  global.prueba = prueba;
  global.igual = igual;
  global.cierto = cierto;
})(window);
