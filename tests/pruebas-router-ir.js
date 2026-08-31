/* Las pruebas de la capa impura de `ir`. Viven aparte de pruebas-router.js
   porque necesitan una página con URL de verdad: `ir` lee `location.hash` y
   llama a `history`, y ninguna de las dos cosas existe en una función pura.

   No se dobla `history`: se usa el de verdad. `replaceState` cambia el hash sin
   añadir entradas, así que se puede comprobar dónde acabó la URL y cuánto
   creció el historial, que es comportamiento — en vez de comprobar a quién se
   llamó, que sería comprobar un doble. */

describeAsync('Router.ir', function () {

  var MODULOS = ['../../js/reglas-contenido.js', '../../js/datos.js', '../../js/router.js'];

  var PROYECTOS = [
    { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
      ficha: {}, piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] },
    { id: 'humo', titulo: 'Humo', categoria: 'videoclip', tipo: 'video',
      ficha: {}, piezas: [] }
  ];

  /* Monta una página con el router cargado de verdad, partiendo del hash que se
     pida, y le pasa a `fn` la ventana, cuántas entradas tenía el historial al
     empezar, y la lista donde se van apuntando los avisos a los suscriptores. */
  function conRouter(hashDePartida, fn) {
    var avisos = [];
    return ArnesDom.conPagina({
      pagina: 'fijaciones/pagina-vacia.html',
      hash: hashDePartida,
      scripts: MODULOS
    }, function (w, d) {
      w.Datos.establecer(PROYECTOS.map(function (p) { return p; }));
      /* `init()` ANTES de suscribirse, y el orden importa por dos motivos.
         Uno: es quien registra el oyente de `hashchange`, sin el cual el
         camino de empujar —que asigna `location.hash`— no avisaría a nadie.
         Dos, la consecuencia concreta de hacerlo al revés: `init` avisa nada
         más arrancar, así que si nos suscribiéramos primero ese aviso de
         arranque entraría en `avisos` y TODAS las cuentas de `avisos.length`
         de este archivo valdrían uno más. */
      w.Router.init();
      w.Router.alCambiar(function (ruta) { avisos.push(ruta); });
      return fn(w, w.history.length, avisos);
    });
  }

  /* `location.hash = ...` dispara `hashchange` de forma asíncrona. Comprobar
     justo después de llamar a `ir` leería el estado de antes, y la prueba
     pasaría o fallaría por el motivo equivocado. */
  function trasElHashchange(w) {
    return new Promise(function (resolver) {
      var resuelto = false;
      w.addEventListener('hashchange', function () {
        if (!resuelto) { resuelto = true; resolver(); }
      });
      setTimeout(function () { if (!resuelto) { resuelto = true; resolver(); } }, 500);
    });
  }

  // ---- Cambiar de foto: reemplaza -----------------------------------

  return conRouter('#/bruma/1', function (w, largoInicial, avisos) {
    w.Router.ir('proyecto', 'bruma', 2);

    prueba('cambiar de foto no añade una entrada al historial', function () {
      igual(w.history.length, largoInicial);
    });

    prueba('y la URL pasa a la foto nueva', function () {
      igual(w.location.hash, '#/bruma/2');
    });

    /* replaceState no dispara `hashchange`, así que si `ir` no avisara a mano
       nadie se enteraría y la pantalla se quedaría en la foto anterior. Es el
       fallo más probable de esta función. */
    prueba('y avisa a mano con la ruta nueva, porque replaceState no lo hace', function () {
      igual(avisos.length, 1);
      igual(avisos[0].valor, 'bruma');
      igual(avisos[0].pieza, 2);
    });

  }).then(function () {

    // ---- La ficha, por el mismo camino ------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('proyecto', 'bruma', 'ficha');

      prueba('abrir la ficha del proyecto en el que ya estás tampoco añade entrada', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '#/bruma/ficha');
      });

      prueba('y el aviso lleva la ficha', function () {
        igual(avisos.length, 1);
        igual(avisos[0].pieza, 'ficha');
      });
    });

  }).then(function () {

    // ---- Ir a donde ya estás ----------------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('proyecto', 'bruma', 2);

      prueba('ir a donde ya estás no toca ni el historial ni la URL', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '#/bruma/2');
      });

      /* Sin este aviso, pulsar la categoría en la que ya estás dejaría la
         galería quieta. Es comportamiento de hoy y hay que conservarlo. */
      prueba('pero avisa igual, para que la pantalla se repinte', function () {
        igual(avisos.length, 1);
      });
    });

  }).then(function () {

    // ---- La portada general -----------------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('todos');

      prueba('volver a la portada deja la URL sin fragmento y no añade entrada', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '');
      });

      prueba('y avisa de que ya no hay filtro', function () {
        igual(avisos.length, 1);
        igual(avisos[0].tipo, 'todos');
      });
    });

  }).then(function () {

    // ---- El único escenario que navega de verdad --------------------

    /* Éste asigna `location.hash`, así que sí añade una entrada al historial
       del navegador de quien corre la suite: el historial de un iframe es el de
       su padre, y quitar el iframe no la devuelve. Por eso hay UN escenario de
       empujar y no tres, con las tres comprobaciones colgando de él.

       Medido: una corrida completa de la suite añade exactamente 1 entrada.
       No crece sin límite —Chrome topa `history.length` en unas 50 entradas
       por pestaña— pero sí ensucia el botón «atrás» de quien la corre. Y ojo
       al llegar a ese tope: `largoInicial + 1` deja de cumplirse cuando el
       historial ya no puede crecer, así que si esta prueba empieza a fallar
       sola tras muchas recargas seguidas, no has roto nada — abre una pestaña
       nueva y vuelve a correrla.

       Se hace con `ir('categoria', 'editorial')` —dos argumentos— porque así
       cubre de paso que llamarla como la llama el escritorio hoy
       (js/galeria.js:196-197, js/visor.js:41,129-130) no inventa una pieza. Si
       el tercer argumento fuera obligatorio, el escritorio no daría error:
       escribiría «#/editorial/undefined», que es peor. */
    return conRouter('#/bruma', function (w, largoInicial, avisos) {
      w.Router.ir('categoria', 'editorial');

      return trasElHashchange(w).then(function () {
        prueba('cambiar de sitio sí añade una entrada al historial', function () {
          igual(w.history.length, largoInicial + 1);
        });

        prueba('y la URL lleva la categoría', function () {
          igual(w.location.hash, '#/editorial');
        });

        /* La tercera aserción mira la URL y NO `avisos[0].pieza`, que es lo que
           parecía natural y no comprueba nada: la rama de categoría de
           `parsearRuta` devuelve `pieza: null` codificado a mano, sin mirar el
           segundo tramo, así que con «#/editorial/undefined» el aviso seguiría
           llevando `pieza: null` y la prueba pasaría con la pieza inventada
           puesta. Lo que puede romperse de verdad es la URL. */
        prueba('y llamarla con dos argumentos no inventa una pieza', function () {
          igual(avisos.length, 1);
          igual(avisos[0].tipo, 'categoria');
          cierto(w.location.hash.indexOf('undefined') === -1,
                 'se coló una pieza inventada en la URL: ' + w.location.hash);
        });
      });
    });
  });
});
