/* MovilAnimacion.claseDe es la mitad pura: del nombre de la intención del
   dedo (los mismos que usa MovilGestos y MovilRecorrido) a la clase CSS que
   hace que la pieza nueva entre desde el lado que toca. No necesita DOM. */
describe('MovilAnimacion.claseDe — del dedo a la clase de entrada', function () {

  /* La pareja completa, y con el razonamiento que deja escrito el comentario
     de js/movil-animacion.js: el dedo hacia la izquierda empuja el contenido
     hacia la izquierda, así que lo nuevo entra por la derecha. Igual en
     vertical. */
  prueba('izquierda entra desde la derecha', function () {
    igual(MovilAnimacion.claseDe('izquierda'), 'mvisor-entra-der');
  });

  prueba('derecha entra desde la izquierda', function () {
    igual(MovilAnimacion.claseDe('derecha'), 'mvisor-entra-izq');
  });

  prueba('arriba entra desde abajo', function () {
    igual(MovilAnimacion.claseDe('arriba'), 'mvisor-entra-abajo');
  });

  prueba('abajo entra desde arriba', function () {
    igual(MovilAnimacion.claseDe('abajo'), 'mvisor-entra-arriba');
  });

  /* Sin dirección —llegar por la URL, por el botón de atrás, o cualquier cosa
     que no sea una de las cuatro— no hay clase: `null` y no una cadena vacía,
     para que `aplicar` pueda distinguir «no animar» de «clase inválida» con
     un simple `if`. */
  prueba('sin intención no hay clase', function () {
    igual(MovilAnimacion.claseDe(null), null);
  });

  prueba('un toque tampoco tiene clase: no es una dirección del recorrido', function () {
    igual(MovilAnimacion.claseDe('toque'), null);
  });

  prueba('un pellizco tampoco', function () {
    igual(MovilAnimacion.claseDe('pellizco'), null);
  });
});

/* MovilAnimacion.aplicar sí toca el DOM: añade la clase al nodo, o no la
   añade. No necesita ArnesDom porque le basta un elemento suelto, sin montar
   en el documento. */
describe('MovilAnimacion.aplicar — la clase en el nodo', function () {

  prueba('añade la clase que corresponde a la intención', function () {
    var el = document.createElement('div');
    var original = window.matchMedia;
    try {
      window.matchMedia = function () { return { matches: false }; };
      MovilAnimacion.aplicar(el, 'izquierda');
    } finally {
      window.matchMedia = original;
    }
    igual(el.classList.contains('mvisor-entra-der'), true);
  });

  prueba('sin intención no toca la clase del nodo', function () {
    var el = document.createElement('div');
    MovilAnimacion.aplicar(el, null);
    igual(el.className, '');
  });

  /* El requisito no negociable del encargo: con movimiento reducido no hay
     deslizamiento. Se falsifica `matchMedia` por lo mismo que en
     pruebas-movil-puerta.js —la preferencia es del sistema operativo, y una
     prueba que dependa de ella falla en la máquina de otro sin que nadie haya
     tocado nada—, con el mismo `finally` para no envenenar lo que corra
     después. */
  prueba('con movimiento reducido no añade ninguna clase', function () {
    var el = document.createElement('div');
    var original = window.matchMedia;
    try {
      window.matchMedia = function () { return { matches: true }; };
      MovilAnimacion.aplicar(el, 'izquierda');
    } finally {
      window.matchMedia = original;
    }
    igual(el.className, '');
  });
});
