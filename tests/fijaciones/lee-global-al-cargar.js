/* Fijación del arnés de DOM. Existe para una sola cosa: leer un global
   DURANTE su propia carga, que es exactamente lo que hace panel/js/panel.js
   cuando llama a Borrador.cargar() en su última línea.

   Sin un script así, la prueba del orden de `conDocumento` no prueba nada: con
   `scripts: []` la cadena de promesas se resuelve sin ejecutar nada por medio,
   así que mover la inyección de globales a después de cargar los scripts
   dejaría las pruebas igual de verdes.

   Si el global no está puesto cuando esto corre, se deja rastro en
   `fijacionSeEjecutoSinGlobal` en vez de sólo reventar: así la prueba que
   falla puede decir que el orden se rompió, y no limitarse a que una marca no
   apareció. */
(function () {
  if (typeof window.Testigo === 'undefined') {
    window.fijacionSeEjecutoSinGlobal = true;
    return;
  }
  window.Testigo.visto = true;
})();
