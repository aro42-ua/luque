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

  /* Desde la Tarea 2, `pintar` le pide el proyecto entero a `window.Datos`.
     Este bloque sólo comprueba `estado()` y `raiz.hidden`, no lo que se pinta,
     pero `pintar` corre igual y revienta si `Datos.porId` no está: se falsea
     con la misma lista de la prueba para no depender del contenido real. */
  function conVisor(fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var raiz = caja.querySelector('#mvRaiz');
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: raiz, escena: escena }, MV_PROYECTOS);
        var antes = window.Datos;
        window.Datos = {
          porId: function (id) {
            for (var i = 0; i < MV_PROYECTOS.length; i++) {
              if (MV_PROYECTOS[i].id === id) return MV_PROYECTOS[i];
            }
            return null;
          }
        };
        try { return fn(raiz, escena); }
        finally {
          window.Datos = antes;
          document.body.classList.remove('mvisor-abierto');
        }
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

describe('MovilVisor — qué pinta cada parada del eje', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* Estos proyectos llevan `portadaUrl` porque es lo que `Datos.establecer`
     resuelve y lo que la rejilla ya tiene cargado; es la vista previa de la
     carga progresiva. Se usan URLs de mentira y no `data:` porque aquí no se
     espera a ningún evento de carga: sólo se mira QUÉ se pide primero. */
  var MV_CON_FOTOS = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', camara: 'Mamiya', optica: '80mm' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  function conEscena(proyectos, fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var raiz = caja.querySelector('#mvRaiz');
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: raiz, escena: escena }, proyectos);
        /* `Datos.porId` es a quien `pintar` le pide el proyecto entero, porque
           `orden` sólo guarda `{id, piezas}`. Se falsea sobre la lista de la
           prueba para no depender del contenido real. */
        var antes = window.Datos;
        window.Datos = {
          porId: function (id) {
            for (var i = 0; i < proyectos.length; i++) {
              if (proyectos[i].id === id) return proyectos[i];
            }
            return null;
          }
        };
        try { return fn(escena); }
        finally {
          window.Datos = antes;
          document.body.classList.remove('mvisor-abierto');
        }
      });
  }

  /* La mitad que importa de la carga progresiva: lo PRIMERO que se pide es la
     portada, que la rejilla ya tiene descargada. Medido el 2026-09-04 sobre el
     visor de escritorio: pedir la pieza entera de primeras eran 1371 ms de
     espera contra 4 ms con la imagen ya en caché. */
  prueba('la foto arranca con la portada, que la rejilla ya tiene cargada', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
      });
      return escena.querySelector('img').getAttribute('src');
    }), 'portada-niebla.jpg');
  });

  prueba('la foto lleva texto alternativo con el trabajo y la pieza', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return escena.querySelector('img').alt;
    }), 'Niebla, pieza 2 de 2');
  });

  /* La ficha es el FONDO del eje vertical, no un panel aparte, así que se pinta
     en la misma escena y sustituye a la foto. */
  prueba('la parada ficha pinta la ficha técnica, no una foto', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return { fichas: escena.querySelectorAll('.mvisor-ficha').length,
               fotos:  escena.querySelectorAll('img').length };
    }), { fichas: 1, fotos: 0 });
  });

  prueba('la ficha lleva los cuatro campos y el recuento de piezas', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      var dts = escena.querySelectorAll('dt');
      var out = [];
      for (var i = 0; i < dts.length; i++) out.push(dts[i].textContent);
      return out;
    }), ['Cliente', 'Año', 'Cámara', 'Óptica', 'Piezas']);
  });

  /* Cambiar de parada VACÍA la escena antes de pintar. Sin esto, deslizar
     acumularía una <img> encima de otra y la memoria crecería con cada gesto. */
  prueba('cambiar de parada no acumula nodos en la escena', function () {
    igual(conEscena(MV_CON_FOTOS, function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 'ficha' });
      });
      return escena.childNodes.length;
    }), 1);
  });
});

describe('MovilVisor — el proyecto de vídeo', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* `vimeo: null` es el estado REAL de los seis proyectos de vídeo de
     `contenido.json` hasta que el estudio suba los suyos, así que el camino de
     degradación es hoy el camino normal y merece prueba antes que el otro. */
  var MV_VIDEO = [{
    id: 'oleaje', titulo: 'Oleaje', categoria: 'cortometraje', tipo: 'video',
    portadaUrl: 'poster-oleaje.jpg', vimeo: null,
    ficha: { cliente: 'Estudio', anio: '2026', camara: 'Arri', optica: '35mm' },
    piezas: []
  }];

  function conEscena(fn) {
    return ArnesDom.conElemento(
      '<div><div id="mvRaiz" hidden><div id="mvEscena"></div></div></div>',
      function (caja) {
        var escena = caja.querySelector('#mvEscena');
        MovilVisor.init({ raiz: caja.querySelector('#mvRaiz'), escena: escena },
                        MV_VIDEO);
        var antes = window.Datos;
        window.Datos = { porId: function () { return MV_VIDEO[0]; } };
        try { return fn(escena); }
        finally {
          window.Datos = antes;
          document.body.classList.remove('mvisor-abierto');
        }
      });
  }

  prueba('sin vimeo se ve el póster, no un rectángulo negro', function () {
    igual(conEscena(function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return escena.querySelector('img').getAttribute('src');
    }), 'poster-oleaje.jpg');
  });

  prueba('y no se cuela ningún iframe cuando no hay vídeo que enseñar', function () {
    igual(conEscena(function (escena) {
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'oleaje', pieza: null });
      });
      return escena.querySelectorAll('iframe').length;
    }), 0);
  });
});
