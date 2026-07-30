(function (global) {
  var salida = null;
  var pasadas = 0;
  var fallidas = 0;

  function asegurarSalida() {
    if (!salida) salida = document.getElementById('salida');
    return salida;
  }

  function describe(nombre, fn) {
    var h = document.createElement('h2');
    h.textContent = nombre;
    asegurarSalida().appendChild(h);
    fn();
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

  function resumen() {
    var p = document.createElement('p');
    p.className = fallidas === 0 ? 'ok' : 'fallo';
    p.textContent = '——— ' + pasadas + ' pasan, ' + fallidas + ' fallan ———';
    asegurarSalida().appendChild(p);
  }

  global.Arnes = { describe: describe, prueba: prueba, igual: igual, cierto: cierto, resumen: resumen };
  global.describe = describe;
  global.prueba = prueba;
  global.igual = igual;
  global.cierto = cierto;
})(window);
