/* Qué sección se ve. Tan pequeño porque lo único que tiene que hacer bien es no
   dejar dos visibles a la vez ni ninguna: cualquiera de las dos cosas es una
   pantalla rota, y las dos son fáciles de escribir sin querer si cada pantalla
   se esconde a sí misma. */
window.Pantallas = (function () {

  /* `hidden` y no `display:none` por CSS: la propiedad quita el elemento
     también del árbol de accesibilidad y del recorrido con Tab, que es lo que
     hace falta —una pantalla escondida cuyos campos siguen tabulables es peor
     que no esconderla—. */
  function mostrar(nodos, pantalla) {
    Object.keys(nodos).forEach(function (nombre) {
      nodos[nombre].hidden = nombre !== pantalla;
    });
  }

  return { mostrar: mostrar };
})();
