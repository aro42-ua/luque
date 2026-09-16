window.DiagnosticoToques = (function () {

  /* TEMPORAL. Este archivo existe para cazar UN fallo concreto y se borra en
     cuanto esté cazado: en la rejilla móvil, el primer toque sobre un proyecto
     tras cruzar la puerta no abre nada y el segundo sí. No se reproduce con
     ratón —sólo pasa en táctil de verdad—, así que la única forma de verlo es
     mirar, en el teléfono, dónde aterriza cada toque.

     Está dormido salvo que la URL traiga `?diag=1`. Sin esa marca no engancha
     ni un oyente, así que la web normal no se entera de que existe.

     Qué apunta, y por qué cada cosa:

     - `pointerdown`, `pointerup` y `click` por separado. Si el `down` y el
       `up` caen en elementos DISTINTOS, el navegador dispara el `click` sobre
       el ancestro común de los dos, que puede no ser el botón — y entonces el
       oyente de `movil-hoja.js` no corre y no pasa nada. Ese mecanismo ya lo
       he medido sobre el hero de esta misma web, así que no es una hipótesis
       de laboratorio.
     - `touchstart` y `touchend` además de los de puntero. Si llegan los de
       toque pero no los de puntero, el problema es de `touch-action`; si no
       llega ninguno, es que algo se come el gesto antes.
     - La PILA de elementos bajo el dedo (`elementsFromPoint`), no sólo el de
       arriba. Es lo que enseña qué hay tapando el botón, que es justo lo que
       no se puede adivinar desde fuera.
     - Los milisegundos desde que cargó la página, para ver si el toque perdido
       cae dentro de alguna transición. */

  var MARCA = 'diag=1';
  var CUANTOS = 14;

  var lineas = [], panel = null, t0 = 0;

  function activo() {
    return String(location.search).indexOf(MARCA) !== -1;
  }

  function nombre(n) {
    if (!n) return '—';
    if (n.nodeType !== 1) return String(n.nodeName || '?');
    var c = String(n.className || '').split(' ')[0];
    return n.tagName.toLowerCase() + (c ? '.' + c : '') + (n.id ? '#' + n.id : '');
  }

  /* Los tres o cuatro primeros de la pila, que es donde está la respuesta: si
     encima del botón hay algo, sale aquí y se acabó la discusión. */
  function pila(x, y) {
    if (!document.elementsFromPoint) return nombre(document.elementFromPoint(x, y));
    return document.elementsFromPoint(x, y).slice(0, 4).map(nombre).join(' < ');
  }

  function apuntar(texto) {
    lineas.push(texto);
    if (lineas.length > CUANTOS) lineas.shift();
    if (panel) panel.textContent = lineas.join('\n');
  }

  function ms() { return Math.round(performance.now() - t0); }

  function deToque(e) {
    var t = e.changedTouches && e.changedTouches[0];
    apuntar(ms() + ' ' + e.type + ' ' + (t ? Math.round(t.clientX) + ',' + Math.round(t.clientY) : '?') +
            ' → ' + nombre(e.target));
  }

  function dePuntero(e) {
    var x = Math.round(e.clientX), y = Math.round(e.clientY);
    var boton = e.target && e.target.closest ? e.target.closest('.hoja-boton') : null;
    apuntar(ms() + ' ' + e.type + ' ' + x + ',' + y +
            '\n   destino: ' + nombre(e.target) +
            '\n   ¿botón?: ' + (boton ? 'SÍ' : 'NO') +
            '\n   pila: ' + pila(x, y));
  }

  /* `pointer-events:none` en el panel, y no es un detalle: un panel que
     intercepta toques falsearía justo lo que viene a medir. */
  function pintarPanel() {
    panel = document.createElement('pre');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0',
      'max-height:46vh', 'overflow:auto',
      'margin:0', 'padding:8px 10px',
      'background:rgba(0,0,0,.88)', 'color:#ff0',
      'font:11px/1.35 ui-monospace,Menlo,Consolas,monospace',
      'white-space:pre-wrap', 'z-index:2147483647', 'pointer-events:none'
    ].join(';');
    panel.textContent = 'Diagnóstico de toques puesto. Cruza la puerta y pulsa un proyecto.';
    document.body.appendChild(panel);
  }

  function init() {
    if (!activo()) return;
    t0 = performance.now();
    pintarPanel();
    ['pointerdown', 'pointerup', 'click'].forEach(function (t) {
      document.addEventListener(t, dePuntero, true);
    });
    ['touchstart', 'touchend'].forEach(function (t) {
      document.addEventListener(t, deToque, { capture: true, passive: true });
    });
  }

  return { MARCA: MARCA, activo: activo, init: init };
})();
