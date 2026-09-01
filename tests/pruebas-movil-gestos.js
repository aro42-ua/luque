describe('MovilGestos', function () {

  function p(x, y) { return { x: x, y: y }; }

  /* Un gesto de un solo dedo, de principio a fin. Devuelve la intención. */
  function gesto(desde, hasta) {
    var e = MovilGestos.presionar(MovilGestos.inicial(), desde);
    return MovilGestos.soltar(e, hasta).intencion;
  }

  // ---- Los deslizamientos -----------------------------------------

  prueba('arrastrar a la izquierda es un deslizamiento a la izquierda', function () {
    igual(gesto(p(200, 300), p(100, 300)), 'izquierda');
  });

  prueba('arrastrar a la derecha es un deslizamiento a la derecha', function () {
    igual(gesto(p(100, 300), p(200, 300)), 'derecha');
  });

  prueba('arrastrar hacia arriba es un deslizamiento hacia arriba', function () {
    igual(gesto(p(200, 400), p(200, 300)), 'arriba');
  });

  prueba('arrastrar hacia abajo es un deslizamiento hacia abajo', function () {
    igual(gesto(p(200, 300), p(200, 400)), 'abajo');
  });

  /* Los cuatro nombres son los que `MovilRecorrido.mover` acepta tal cual. Si
     alguien los cambia aquí, hay que cambiarlos allí, y esta prueba es lo que
     lo recuerda. */
  prueba('las cuatro intenciones se llaman como las direcciones de mover()', function () {
    var vistas = [gesto(p(200, 300), p(100, 300)), gesto(p(100, 300), p(200, 300)),
                  gesto(p(200, 400), p(200, 300)), gesto(p(200, 300), p(200, 400))];
    igual(vistas, ['izquierda', 'derecha', 'arriba', 'abajo']);
  });

  // ---- El toque ---------------------------------------------------

  prueba('presionar y soltar sin moverse es un toque', function () {
    igual(gesto(p(200, 300), p(200, 300)), 'toque');
  });

  prueba('un temblor de pocos píxeles sigue siendo un toque', function () {
    igual(gesto(p(200, 300), p(204, 297)), 'toque');
  });

  /* El radio del toque se mide con la hipotenusa, no con el eje mayor: 8px en
     cada eje son 11,3 de recorrido real, o sea más que TOQUE. Con un `max` en
     vez de una hipotenusa esto saldría 'toque' y el dedo habría recorrido más
     de lo que un toque permite. */
  prueba('el radio del toque es un círculo, no un cuadrado', function () {
    igual(gesto(p(200, 300), p(208, 308)), null);
  });

  // ---- La zona muerta ---------------------------------------------

  /* El caso literal de la spec, línea 197. Con dx=dy=12 el recorrido es 17px
     —más que TOQUE— pero el eje dominante es 12, menos que UMBRAL. No es ni
     toque ni deslizamiento: no es nada. */
  prueba('un arrastre de 12px en diagonal NO es un deslizamiento', function () {
    igual(gesto(p(200, 300), p(212, 312)), null);
  });

  prueba('un arrastre largo pero en diagonal exacta tampoco lo es', function () {
    igual(gesto(p(200, 300), p(300, 400)), null);
  });

  prueba('entre el toque y el umbral no pasa nada, ni siquiera un toque', function () {
    igual(gesto(p(200, 300), p(215, 300)), null);
  });

  /* El borde exacto, en los dos lados. Escrita contra `MovilGestos.UMBRAL` en
     vivo, así que no fija el número 24 —eso lo hace «los tres números están
     expuestos…», más abajo— sino la GEOMETRÍA relativa al umbral, sea cual
     sea: que `dominante < UMBRAL` sea estricto. Sin esto, mutar esa
     comparación a `<=` (el eje justo en el umbral deja de deslizar) no lo
     detectaría nada. Comprobado: mutar `UMBRAL` de 24 a 30 deja esta prueba en
     verde, porque se adapta sola; lo que sí la pone en rojo es mutar el propio
     `<` de la comparación. */
  prueba('justo en el umbral hay deslizamiento, justo por debajo no', function () {
    igual(gesto(p(200, 300), p(200 + MovilGestos.UMBRAL, 300)), 'derecha');
    igual(gesto(p(200, 300), p(200 + MovilGestos.UMBRAL - 1, 300)), null);
  });

  prueba('justo en el toque hay toque, justo por encima no', function () {
    igual(gesto(p(200, 300), p(200 + MovilGestos.TOQUE, 300)), 'toque');
    igual(gesto(p(200, 300), p(200 + MovilGestos.TOQUE + 1, 300)), null);
  });

  /* Un eje que apenas gana al otro no basta: hace falta que lo supere por
     DOMINIO. Aquí 60 contra 50 es 1,2 — no llega a 1,6 — y no vale, aunque
     los dos superen el umbral. */
  prueba('ganar por poco en un eje no basta para elegir dirección', function () {
    igual(gesto(p(200, 300), p(260, 350)), null);
  });

  prueba('ganar con holgura sí elige dirección', function () {
    igual(gesto(p(200, 300), p(300, 320)), 'derecha');
  });

  // ---- El pellizco ------------------------------------------------

  prueba('dos dedos a la vez son un pellizco, no un deslizamiento', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    e = MovilGestos.soltar(e, p(300, 300)).estado;
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'pellizco');
  });

  /* Lo que la spec llama «el deslizamiento se cancela hasta soltar»: el
     segundo dedo llega a mitad del arrastre y a partir de ahí ese gesto ya no
     puede ser un deslizamiento, aunque el dedo original acabe donde acabaría
     un deslizamiento perfecto. */
  prueba('un segundo dedo a mitad de arrastre cancela el deslizamiento', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(300, 300));
    e = MovilGestos.presionar(e, p(100, 300));
    e = MovilGestos.soltar(e, p(100, 300)).estado;
    // el dedo original acaba justo donde acabaría un deslizamiento perfecto
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'pellizco');
  });

  prueba('mientras quede un dedo en pantalla no hay intención todavía', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    var r = MovilGestos.soltar(e, p(300, 300));
    igual(r.intencion, null, 'con un dedo aún puesto no se decide nada');
    igual(MovilGestos.soltar(r.estado, p(100, 300)).intencion, 'pellizco');
  });

  /* Sin este reinicio, el primer pellizco de la sesión envenenaría todos los
     deslizamientos siguientes. */
  prueba('tras levantar todos los dedos, el siguiente gesto empieza limpio', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    e = MovilGestos.soltar(e, p(300, 300)).estado;
    e = MovilGestos.soltar(e, p(100, 300)).estado;
    e = MovilGestos.presionar(e, p(200, 300));
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'izquierda');
  });

  // ---- Higiene ----------------------------------------------------

  /* El punto no es cualquiera: (500,300) desde un origen de (0,0) sería un
     deslizamiento a la derecha en toda regla. Con un punto en diagonal la
     prueba pasaba igual sin el guardia, porque la diagonal ya devuelve null
     por su cuenta y tapaba el fallo. */
  prueba('soltar sin haber presionado no inventa una intención', function () {
    igual(MovilGestos.soltar(MovilGestos.inicial(), p(500, 300)).intencion, null);
  });

  prueba('ninguna función modifica el estado que recibe', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(200, 300));
    var copia = JSON.parse(JSON.stringify(e));
    MovilGestos.presionar(e, p(300, 300));
    MovilGestos.soltar(e, p(100, 300));
    igual(e, copia, 'el estado original ha cambiado');
  });

  prueba('los tres números están expuestos y son los que dice el plan', function () {
    igual(MovilGestos.TOQUE, 10);
    igual(MovilGestos.UMBRAL, 24);
    igual(MovilGestos.DOMINIO, 1.6);
  });
});
