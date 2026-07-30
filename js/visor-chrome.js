window.VisorChrome = (function () {
  var chrome = null, tira = null;
  var temporizador = null;
  var sobreLaTira = false;
  var OCULTAR_TRAS = 2000;
  var mantenerVisible = null; // predicado que inyecta js/visor.js: además de la
                               // tira, cuándo debe quedarse fijo (p.ej. ficha abierta)

  // init: cachea el chrome y la tira, y engancha los manejadores que la tira
  // necesita en exclusiva. mantenerVisible es un callback sin argumentos: si
  // devuelve true, despertar() no arma el temporizador de desvanecimiento.
  function init(elChrome, elTira, fnMantenerVisible) {
    chrome = elChrome; tira = elTira; mantenerVisible = fnMantenerVisible;
    tira.addEventListener('mouseenter', function () {
      sobreLaTira = true; chrome.classList.remove('oculto'); pararTemporizador();
    });
    tira.addEventListener('mouseleave', function () { sobreLaTira = false; despertar(); });
  }

  // despertar: muestra el chrome y reinicia la cuenta atrás para ocultarlo,
  // salvo que el cursor esté sobre la tira o el llamador pida quedarse fijo.
  function despertar() {
    chrome.classList.remove('oculto');
    pararTemporizador();
    if (sobreLaTira || (mantenerVisible && mantenerVisible())) return;
    temporizador = setTimeout(function () { chrome.classList.add('oculto'); }, OCULTAR_TRAS);
  }

  function pararTemporizador() { if (temporizador) { clearTimeout(temporizador); temporizador = null; } }

  // olvidarTira: al cerrar el visor no queda ratón real sobre la tira que
  // vaya a disparar mouseleave, así que hay que soltar la marca a mano.
  function olvidarTira() { sobreLaTira = false; }

  return {
    init: init,
    despertar: despertar,
    pararTemporizador: pararTemporizador,
    olvidarTira: olvidarTira
  };
})();
