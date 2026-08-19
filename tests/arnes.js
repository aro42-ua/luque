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

  function igual(actual, esperado, mensaje) {
    var a = JSON.stringify(actual);
    var e = JSON.stringify(esperado);
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
