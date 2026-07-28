window.Router = (function () {
  var suscriptores = [];

  function parsearRuta(fragmento, categorias, ids) {
    var limpio = String(fragmento == null ? '' : fragmento).replace(/^#/, '').replace(/^\//, '').trim();
    if (!limpio) return { tipo: 'todos', valor: null };
    if (categorias.indexOf(limpio) !== -1) return { tipo: 'categoria', valor: limpio };
    if (ids.indexOf(limpio) !== -1) return { tipo: 'proyecto', valor: limpio };
    return { tipo: 'todos', valor: null };
  }

  function idsProyecto() {
    return window.Datos.PROYECTOS.map(function (p) { return p.id; });
  }

  function rutaActual() {
    return parsearRuta(location.hash, window.Datos.CATEGORIAS, idsProyecto());
  }

  function ir(tipo, valor) {
    var destino = (tipo === 'todos') ? ' ' : '#/' + valor;
    if (tipo === 'todos') {
      history.replaceState(null, '', location.pathname + location.search);
      avisar();
    } else if (location.hash !== destino) {
      location.hash = destino;
    } else {
      avisar();
    }
  }

  function avisar() {
    var ruta = rutaActual();
    suscriptores.forEach(function (fn) { fn(ruta); });
  }

  function alCambiar(fn) { suscriptores.push(fn); }

  function init() {
    window.addEventListener('hashchange', avisar);
    avisar();
  }

  return {
    parsearRuta: parsearRuta,
    rutaActual: rutaActual,
    ir: ir,
    alCambiar: alCambiar,
    init: init
  };
})();
