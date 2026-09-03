/* «Una puerta que se cruza dos veces deja de ser una puerta»: el nodo se quita
   del documento, no se esconde, porque escondido seguiría siendo alcanzable
   con el tabulador y un lector de pantalla lo leería por detrás de una rejilla
   que ya está delante.

   Va en `describeAsync` y con el contenedor montado a mano, no sobre
   `ArnesDom.conElemento`: la retirada ocurre en un `setTimeout(SALIDA_MS)`
   dentro de `cerrarPuerta`, y `conElemento` es síncrono a propósito —retira su
   caja en cuanto `fn` retorna—, así que a los 380ms ya no habría documento que
   mirar. Lo que se fija aquí es que CRUZAR la puerta acaba quitando el nodo;
   antes esto se llamaba a mano por una puerta trasera de la API y la prueba
   pasaba con el `setTimeout` borrado.

   Fichero aparte y no dentro de pruebas-movil-puerta.js: es la única
   sección de las cuatro en que se partió la antigua pruebas-movil-hoja.js que
   usa `describeAsync` en vez de `describe`, y separarla evita mezclar el
   montaje manual del contenedor con el `ArnesDom.conElemento` síncrono que
   usa el resto de la suite del hero. */
describeAsync('MovilPuerta — el hero se va del documento al cruzar', function () {

  /* Fuera de pantalla y NO con display:none, igual que `ArnesDom.caja`: el
     nodo tiene que estar vivo dentro del documento para que quitarlo signifique
     algo. */
  function caja() {
    var c = document.createElement('div');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:400px';
    document.body.appendChild(c);
    return c;
  }

  /* Margen holgado sobre el fundido: lo que se comprueba es que el nodo acaba
     yéndose, no cuándo exactamente. */
  function esperar(ms) {
    return new Promise(function (ok) { setTimeout(ok, ms); });
  }

  var raiz = caja();
  /* El alto explícito NO es decoración. Sin él el `#ha` mide cero, y entonces
     el cuarto de pantalla contra el que `MovilArrastre` compara la posición
     vale cero también: la puerta se cruzaba por la rama degenerada que
     `js/movil-arrastre.js` documenta como trampa —cualquier levantada mayor
     que cero supera un umbral de cero—, o sea pasaba por accidente. Con 800px
     el umbral son 200 de verdad y el gesto de abajo tiene que ganárselo. */
  raiz.innerHTML =
    '<div class="hoja-hero" id="ha" style="height:800px"></div>' +
    '<ol class="hoja-rejilla" id="ra"></ol>';

  var hero = raiz.querySelector('#ha');
  var rejilla = raiz.querySelector('#ra');

  MovilPuerta.entrada(hero, raiz, rejilla, { tipo: 'todos', valor: null, pieza: null });

  /* Cruza por POSICIÓN —400px de recorrido contra los 200 del cuarto de
     pantalla— y no por golpe, por el mismo motivo que el `deslizarArriba` de
     pruebas-movil-puerta.js: `timeStamp` es de sólo lectura y se fija al
     construir el evento, así que la velocidad de un gesto sintetizado sale
     cero casi siempre. El `pointermove` del medio hace falta para que haya
     gesto: sin él el dedo no se movió. */
  hero.dispatchEvent(new PointerEvent('pointerdown',
    { clientX: 100, clientY: 780, bubbles: true }));
  hero.dispatchEvent(new PointerEvent('pointermove',
    { clientX: 100, clientY: 400, bubbles: true }));
  hero.dispatchEvent(new PointerEvent('pointerup',
    { clientX: 100, clientY: 380, bubbles: true }));

  /* La limpieza va en las dos ramas del `then`, no sólo en la buena: una
     prueba en rojo que dejara la caja colgada ensuciaría el documento de las
     siguientes. */
  return esperar(MovilPuerta.SALIDA_MS + 250).then(function () {
    var sigue = raiz.querySelector('.hoja-hero') !== null;

    prueba('cruzada la puerta, el nodo se va del documento', function () {
      cierto(!sigue,
        'el hero tiene que salir del documento, no quedarse escondido');
    });
  }).then(function (r) {
    if (raiz.parentNode) raiz.parentNode.removeChild(raiz);
    return r;
  }, function (e) {
    if (raiz.parentNode) raiz.parentNode.removeChild(raiz);
    throw e;
  });
});
