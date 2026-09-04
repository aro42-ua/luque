/* Lo que se fija aquí es la conversión que `js/movil-recorrido.js` avisa por
   escrito que hace falta, en el comentario sobre `indiceDeProyecto`: en el
   `orden` que ese módulo consume, `piezas` es un NÚMERO —cuántas tiene el
   proyecto— y no el array que el mismo nombre designa en `contenido.json` y en
   `Datos.PROYECTOS`.

   Equivocarse no da error: `array >= 1` es `NaN >= 1`, o sea `false`, y
   `paradas()` trataría como vídeo a todo proyecto de fotos. El eje vertical
   dejaría de bajar por las fotos y bajaría directo a la ficha, en los doce
   trabajos, sin una sola excepción en consola. Por eso la conversión vive en
   una función con nombre y con prueba, y no suelta dentro de `init`. */

var MV_PROYECTOS = [
  { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial',
    tipo: 'foto',  piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] },
  { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'cortometraje',
    tipo: 'video', piezas: [] },
  { id: 'salitre', titulo: 'Salitre', categoria: 'editorial',
    tipo: 'video' }
];

describe('MovilVisor — el orden que consume MovilRecorrido', function () {

  prueba('convierte piezas a NÚMERO, que es lo que espera MovilRecorrido', function () {
    igual(MovilVisor.ordenDe(MV_PROYECTOS), [
      { id: 'niebla',  piezas: 3 },
      { id: 'oleaje',  piezas: 0 },
      { id: 'salitre', piezas: 0 }
    ]);
  });

  /* La red de seguridad de la conversión: un proyecto SIN el campo `piezas`
     —los de vídeo de `contenido.json` lo traen vacío, pero nada garantiza que
     esté— tiene que dar 0 y no `undefined`. Con `undefined`, `paradas()` haría
     `undefined >= 1`, que también es `false`, así que hoy acertaría por
     casualidad; se fija el 0 para que siga acertando cuando el criterio
     cambie. */
  prueba('un proyecto sin el campo piezas cuenta 0, no undefined', function () {
    igual(MovilVisor.ordenDe([{ id: 'x' }]), [{ id: 'x', piezas: 0 }]);
  });

  prueba('una lista vacía da un orden vacío, no revienta', function () {
    igual(MovilVisor.ordenDe([]), []);
  });

  /* Que el orden sea el de la lista es lo que hace que el eje horizontal
     recorra los trabajos en el mismo orden en que se ven en la rejilla. Si
     `ordenDe` reordenara, deslizar iría a un trabajo que no es el de al
     lado. */
  prueba('respeta el orden de la lista, que es el de la rejilla', function () {
    var ids = MovilVisor.ordenDe(MV_PROYECTOS).map(function (o) { return o.id; });
    igual(ids, ['niebla', 'oleaje', 'salitre']);
  });
});

/* `aplicar` toca el DOM y pregunta por `Movil.actual()`, así que necesita un
   contenedor y un lado. El contenedor lo da el arnés de DOM; el lado se falsea
   sustituyendo `window.Movil` y devolviéndolo al terminar.

   Se falsea en vez de llamar a `Movil.init` con una consulta de mentira porque
   `Movil.init` engancha un oyente `change` que no se puede desenganchar: cada
   prueba dejaría uno vivo, y la siguiente correría con los de todas las
   anteriores encima. */
describe('MovilVisor — abre y cierra según la ruta', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  function conVisor(fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var raiz = caja.querySelector('#mvRaiz');
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: raiz, escena: escena }, MV_PROYECTOS);
        try { return fn(raiz, escena); }
        finally { document.body.classList.remove('mvisor-abierto'); }
      });
  }

  var RUTA_NIEBLA = { tipo: 'proyecto', valor: 'niebla', pieza: null };
  var RUTA_TODOS  = { tipo: 'todos', valor: null, pieza: null };

  prueba('una ruta de proyecto abre el visor', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return raiz.hidden;
    }), false);
  });

  prueba('y deja el recorrido en la primera pieza de ese proyecto', function () {
    igual(conVisor(function () {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return MovilVisor.estado();
    }), { proyecto: 'niebla', pieza: 1 });
  });

  /* Un proyecto de vídeo no tiene piezas: su primera parada es `null`, la del
     propio vídeo. Que salga `null` y no 1 es lo que hace que bajar llegue a la
     ficha en un solo gesto, que es la razón entera de que el eje vertical
     signifique «más sobre este trabajo» y no «más fotos». */
  prueba('en un proyecto de vídeo la primera parada es el vídeo, no una pieza',
    function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return MovilVisor.estado();
    }), { proyecto: 'oleaje', pieza: null });
  });

  prueba('el segundo tramo de la ruta lleva a esa pieza', function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 3 });
      });
      return MovilVisor.estado();
    }), { proyecto: 'niebla', pieza: 3 });
  });

  prueba('una ruta que no es de proyecto lo cierra', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_NIEBLA);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      return { oculto: raiz.hidden, estado: MovilVisor.estado() };
    }), { oculto: true, estado: null });
  });

  /* La guarda de lado, que es la mitad móvil de la pareja: la otra mitad está
     en el suscriptor de `Visor.init` (js/visor.js). Sin las dos, los dos
     visores abrirían el mismo trabajo a la vez sobre la misma pantalla. */
  prueba('en escritorio no responde, aunque la ruta sea de proyecto', function () {
    igual(conVisor(function (raiz) {
      conLado('escritorio', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      return { oculto: raiz.hidden, estado: MovilVisor.estado() };
    }), { oculto: true, estado: null });
  });

  /* Cerrar dos veces seguidas pasa de verdad: llegar a la portada desde la
     portada avisa igual, porque `Router.decidir` devuelve 'avisar' cuando el
     hash no cambia. Tiene que ser inofensivo. */
  prueba('cerrar estando ya cerrado no rompe nada', function () {
    igual(conVisor(function (raiz) {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_TODOS);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      return raiz.hidden;
    }), true);
  });
});
