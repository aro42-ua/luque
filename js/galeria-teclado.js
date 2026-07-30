window.GaleriaTeclado = (function () {
  var stage = null;
  var centrarEn = null;

  // Los proyectos filtrados fuera quedan con la clase 'apagado' y con
  // tabindex="-1" (ver aplicarFiltro en galeria.js); se comprueban las
  // dos cosas para no depender de que ninguna de ellas quede desincronizada.
  function focosNavegables() {
    return Array.prototype.filter.call(stage.querySelectorAll('.proj'), function (el) {
      return !el.classList.contains('apagado') && el.tabIndex !== -1;
    });
  }

  // El navegador no da forma de vetar el scroll del documento que hace al
  // llevar el foco a un elemento fuera de la vista (medido: hasta 295px de
  // salto permanente). Por eso el tabulador se gestiona a mano dentro de
  // la galería: se mueve el foco con preventScroll y es el propio módulo
  // quien centra el lienzo con centrarEn, que recibe de galeria.js sin
  // conocer nada de cómo panea.
  function alPulsarTecla(e) {
    if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;

    var focos = focosNavegables();
    var actual = focos.indexOf(document.activeElement);
    if (actual === -1) return;   // el foco no está en un proyecto: que decida el navegador

    var siguiente = actual + (e.shiftKey ? -1 : 1);
    // En los extremos no se intercepta: hay que poder salir de la galería
    // tabulando hacia el resto de la página.
    if (siguiente < 0 || siguiente >= focos.length) return;

    e.preventDefault();
    focos[siguiente].focus({ preventScroll: true });
    centrarEn(focos[siguiente]);
  }

  // init: se llama desde galeria.js con el escenario y su propio centrarEn,
  // así este módulo no necesita saber nada del paneo del lienzo.
  function init(elStage, fnCentrarEn) {
    stage = elStage;
    centrarEn = fnCentrarEn;
    stage.addEventListener('keydown', alPulsarTecla);
  }

  return { init: init };
})();
