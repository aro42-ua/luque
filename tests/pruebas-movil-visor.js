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

/* El marcado de las ocho referencias que `MovilVisor.init` exige desde la
   Tarea 4: la escena de siempre más las seis del HUD. Vive en un solo sitio
   porque los tres arneses de abajo (`conVisor` y los dos `conEscena`) lo
   necesitan igual, letra por letra. */
var MV_MARCADO =
  '<div><div id="mvRaiz" hidden><div id="mvEscena"></div>' +
  '<div id="mvHud"><button id="mvCat"></button><ul id="mvCats"></ul>' +
  '<button id="mvCerrar"></button><p id="mvTitulo"></p>' +
  '<span id="mvContador"></span></div></div></div>';

function mvRefsDesde(caja) {
  return {
    raiz:     caja.querySelector('#mvRaiz'),
    escena:   caja.querySelector('#mvEscena'),
    hud:      caja.querySelector('#mvHud'),
    cat:      caja.querySelector('#mvCat'),
    cats:     caja.querySelector('#mvCats'),
    cerrar:   caja.querySelector('#mvCerrar'),
    titulo:   caja.querySelector('#mvTitulo'),
    contador: caja.querySelector('#mvContador')
  };
}

/* Ayudante ÚNICO y compartido por `conVisor` y los dos `conEscena` de más
   abajo: construye las ocho referencias, llama a `MovilVisor.init` y falsea
   `window.Datos` con `porId` y `CATEGORIAS` —esta última porque desde la
   Tarea 4 `pintar()` llama a `MovilHud.pintar`, que la lee—.

   Antes de la Tarea 4 este cuerpo estaba copiado tres veces, una por cada
   arnés, con sólo dos referencias. Al ampliar `refs` a ocho se hizo evidente
   que una cuarta copia —la de este mismo bloque— habría sido la señal de que
   copiar ya no compensaba, así que se extrae aquí. */
function conVisorSobre(proyectos, fn) {
  return ArnesDom.conElemento(MV_MARCADO, function (caja) {
    var refs = mvRefsDesde(caja);
    MovilVisor.init(refs, proyectos);
    var antes = window.Datos;
    window.Datos = {
      /* Las cuatro de verdad y en el orden en que las declara
         `js/reglas-contenido.js`, que es su única fuente. El ejemplo del plan
         traía una `foto-fija` que no existe; dejarla aquí, con
         `pruebas-movil-hud.js` usando las buenas al lado, invitaba a escribir
         mañana una prueba contra una categoría inventada. */
      CATEGORIAS: ['foto-stills', 'editorial', 'videoclip', 'cortometraje'],
      porId: function (id) {
        for (var i = 0; i < proyectos.length; i++) {
          if (proyectos[i].id === id) return proyectos[i];
        }
        return null;
      }
    };
    try { return fn(refs); }
    finally {
      window.Datos = antes;
      document.body.classList.remove('mvisor-abierto');
    }
  });
}

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

  /* Desde la Tarea 2, `pintar` le pide el proyecto entero a `window.Datos`, y
     desde la Tarea 4 también pinta el HUD, que necesita las seis referencias
     nuevas y `Datos.CATEGORIAS`. Este bloque sólo comprueba `estado()` y
     `raiz.hidden`, no lo que se pinta, pero `pintar` corre igual y revienta si
     falta cualquiera de las dos cosas. Ver `conVisorSobre`, arriba. */
  function conVisor(fn) {
    return conVisorSobre(MV_PROYECTOS, function (refs) {
      return fn(refs.raiz, refs.escena);
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
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Dirección de arte' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  /* `Datos.porId` es a quien `pintar` le pide el proyecto entero, porque
     `orden` sólo guarda `{id, piezas}`; `Datos.CATEGORIAS` es lo que desde la
     Tarea 4 lee `MovilHud.pintar`. Las dos las falsea `conVisorSobre`, arriba,
     sobre la lista de la prueba, para no depender del contenido real. */
  function conEscena(proyectos, fn) {
    return conVisorSobre(proyectos, function (refs) { return fn(refs.escena); });
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
    }), ['Cliente', 'Año', 'Papel', 'Piezas']);
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
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Dirección de fotografía' },
    piezas: []
  }];

  /* Mismo ayudante compartido que las dos secciones de arriba. `porId` sale
     igual de `conVisorSobre` buscando en `MV_VIDEO`, así que ya no hace falta
     el atajo `function () { return MV_VIDEO[0]; }` que tenía este bloque. */
  function conEscena(fn) {
    return conVisorSobre(MV_VIDEO, function (refs) { return fn(refs.escena); });
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

describe('MovilVisor — del dedo a la ruta', function () {

  var MV_ORDEN = [
    { id: 'niebla',  piezas: 3 },
    { id: 'oleaje',  piezas: 0 },
    { id: 'salitre', piezas: 2 }
  ];

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  /* Deslizar a la izquierda trae el trabajo SIGUIENTE: los nombres son los del
     dedo, no los del contenido, y la inversión vive en `MovilRecorrido.mover`.
     Aquí sólo se comprueba que este módulo no la duplique ni la deshaga. */
  prueba('deslizar a la izquierda lleva al trabajo siguiente, por su portada',
    function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'izquierda', MV_ORDEN),
          { tipo: 'proyecto', valor: 'oleaje', pieza: null });
  });

  prueba('deslizar arriba baja una parada dentro del mismo trabajo', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'arriba', MV_ORDEN),
          { tipo: 'proyecto', valor: 'niebla', pieza: 2 });
  });

  /* En un proyecto de vídeo la única parada antes de la ficha es el propio
     vídeo, así que bajar llega a los créditos en UN gesto. Es la razón entera
     de que el eje vertical signifique «más sobre este trabajo»: seis de los
     doce proyectos son de vídeo, y un eje que significara «más fotos» no haría
     nada en la mitad del portafolio. */
  prueba('en un vídeo, bajar llega a la ficha en un solo gesto', function () {
    igual(MovilVisor.siguienteRuta(en('oleaje', null), 'arriba', MV_ORDEN),
          { tipo: 'proyecto', valor: 'oleaje', pieza: 'ficha' });
  });

  /* Recortar en vez de dar la vuelta: al llegar al final la serie se detiene,
     para que no se confunda dónde termina. `mover` devuelve el MISMO estado, y
     este módulo lo traduce a `null` para no llamar al router sin necesidad. */
  prueba('en el último trabajo, seguir deslizando no sale al vacío', function () {
    igual(MovilVisor.siguienteRuta(en('salitre', 1), 'izquierda', MV_ORDEN), null);
  });

  prueba('en la primera parada, subir no sale del trabajo', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'abajo', MV_ORDEN), null);
  });

  /* El toque no navega: en la Tarea 4 despierta el HUD. Lo que no puede es
     moverse por la rejilla, porque entonces sería imposible volver a encender
     el HUD sin cambiar de foto. */
  prueba('un toque no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'toque', MV_ORDEN), null);
  });

  /* El pellizco se recibe y no mueve. Este bloque no amplía —eso es el 4g—,
     pero lo que no puede pasar es que se cuele como deslizamiento y cambie de
     trabajo mientras alguien intenta ampliar. */
  prueba('un pellizco no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), 'pellizco', MV_ORDEN), null);
  });

  /* `MovilGestos.soltar` devuelve `null` para la zona muerta: el arrastre corto
     o diagonal que no quiso tocar ni quiso deslizar. */
  prueba('la zona muerta no mueve el recorrido', function () {
    igual(MovilVisor.siguienteRuta(en('niebla', 1), null, MV_ORDEN), null);
  });

  prueba('con el visor cerrado no hay ruta a la que ir', function () {
    igual(MovilVisor.siguienteRuta(null, 'izquierda', MV_ORDEN), null);
  });
});

/* El hallazgo de la revisión final del bloque 4f: `#movilVisor` se declara
   `role="dialog" aria-modal="true"` en index.html, pero hasta esta ronda
   `MovilVisor` no tocaba el foco para nada. Sin envolvente el tabulador se
   escapaba a la rejilla de detrás; sin foco de entrada el diálogo se abría
   sin que el teclado supiera que había pasado nada; y sin devolución el foco
   se perdía en el `<body>` al cerrar.

   El envolvente se reutiliza de `window.VisorFoco.atrapar` (js/visor-foco.js),
   que ya sabe A QUIÉN se puede enfocar; aquí sólo se comprueba CUÁNDO se
   engancha y CUÁNDO se suelta, que es lo que le toca a este módulo. Por eso
   estas pruebas espían `VisorFoco.atrapar` en vez de reconstruir su lista de
   enfocables: reconstruirla aquí sería duplicar lo que ya prueba
   `tests/pruebas-visor-foco.js` bajo otro nombre.

   Necesita `window.VisorFoco` de verdad y no un doble: test.html lo carga
   ahora antes de `js/movil-visor.js`, en el mismo orden relativo que ya usa
   index.html (ver el comentario de esa línea en tests/test.html). */
describe('MovilVisor — el foco del diálogo (VisorFoco)', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  var RUTA_NIEBLA = { tipo: 'proyecto', valor: 'niebla', pieza: null };
  var RUTA_TODOS  = { tipo: 'todos', valor: null, pieza: null };

  function conVisor(fn) {
    return conVisorSobre(MV_PROYECTOS, fn);
  }

  function tabular(shift) {
    var e = new KeyboardEvent('keydown',
      { key: 'Tab', shiftKey: !!shift, bubbles: true, cancelable: true });
    document.dispatchEvent(e);
    return e.defaultPrevented;
  }

  prueba('al abrir, el foco entra en el diálogo por el botón de cerrar', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      var dentro = document.activeElement === refs.cerrar;
      conLado('movil', function () { MovilVisor.aplicar(RUTA_TODOS); });
      return dentro;
    }), true);
  });

  prueba('con el foco en el último control, el Tab da la vuelta al primero', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      refs.cerrar.focus();
      var consumido = tabular(false);
      var r = { consumido: consumido, foco: document.activeElement === refs.cat };
      conLado('movil', function () { MovilVisor.aplicar(RUTA_TODOS); });
      return r;
    }), { consumido: true, foco: true });
  });

  prueba('con el foco en el primer control, Shift+Tab da la vuelta al último', function () {
    igual(conVisor(function (refs) {
      conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
      refs.cat.focus();
      var consumido = tabular(true);
      var r = { consumido: consumido, foco: document.activeElement === refs.cerrar };
      conLado('movil', function () { MovilVisor.aplicar(RUTA_TODOS); });
      return r;
    }), { consumido: true, foco: true });
  });

  /* La devolución no depende de la rejilla ni de `VisorOrigen`: guarda quien
     tenía el foco justo antes de abrir —normalmente el botón que se tocó— y
     se lo devuelve al cerrar. Es el mismo patrón que ya usa `js/visor.js`
     con `elementoQueAbrio`, pero sin acoplarse a cuál de las dos portadas
     abrió el visor, que es justo lo que decide `js/visor-origen.js` para el
     escritorio y que aquí no hace falta preguntar. */
  prueba('al cerrar, el foco vuelve a quien lo tenía antes de abrir', function () {
    igual(conVisor(function () {
      var externo = document.createElement('button');
      document.body.appendChild(externo);
      try {
        externo.focus();
        conLado('movil', function () {
          MovilVisor.aplicar(RUTA_NIEBLA);
          MovilVisor.aplicar(RUTA_TODOS);
        });
        return document.activeElement === externo;
      } finally {
        document.body.removeChild(externo);
      }
    }), true);
  });

  prueba('al cerrar, el foco no se pierde en el <body>', function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_NIEBLA);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      return document.activeElement === document.body;
    }), false);
  });

  /* El oyente tiene que sobrevivir exactamente mientras el diálogo está
     abierto: ni un tic menos —el Tab del punto anterior no se atraparía— ni
     uno más —seguiría atrapando el Tab del resto de la página después de
     cerrar, que es el fallo que el propio encargo llama «peor que el que
     arreglas»—. Las dos pruebas de abajo espían `VisorFoco.atrapar` en vez de
     mirar el resultado del Tab, porque tras cerrar `raiz` queda oculto y
     `atrapar` no encontraría a nadie que enfocar aunque siguiera enganchado:
     sin el espía, un oyente que sobreviviera al cierre pasaría la prueba
     igual, por la razón equivocada. */
  prueba('abrir engancha el oyente: el Tab SÍ llama a VisorFoco.atrapar', function () {
    igual(conVisor(function () {
      var antes = window.VisorFoco.atrapar;
      var llamadas = 0;
      window.VisorFoco.atrapar = function () { llamadas++; };
      try {
        conLado('movil', function () { MovilVisor.aplicar(RUTA_NIEBLA); });
        tabular(false);
      } finally {
        window.VisorFoco.atrapar = antes;
        conLado('movil', function () { MovilVisor.aplicar(RUTA_TODOS); });
      }
      return llamadas;
    }), 1);
  });

  prueba('cerrar desengancha el oyente: el Tab deja de llamar a VisorFoco.atrapar',
    function () {
    igual(conVisor(function () {
      conLado('movil', function () {
        MovilVisor.aplicar(RUTA_NIEBLA);
        MovilVisor.aplicar(RUTA_TODOS);
      });
      var antes = window.VisorFoco.atrapar;
      var llamadas = 0;
      window.VisorFoco.atrapar = function () { llamadas++; };
      try { tabular(false); } finally { window.VisorFoco.atrapar = antes; }
      return llamadas;
    }), 0);
  });
});

/* La animación de entrada del bloque 4f: quién decide la CLASE es
   MovilAnimacion.claseDe, ya probada sola en pruebas-movil-animacion.js; lo
   que le toca fijar a este módulo es CUÁNDO se la pasa a `MovilAnimacion.
   aplicar` — que es tras un deslizamiento de verdad, y sólo una vez.

   `window.Router` se falsea, y no por comodidad: `soltarEn` llama a
   `Router.ir` de verdad, y el router real de esta misma página cambiaría
   `location.hash`, contaminando el historial y el estado de todas las
   pruebas que corren después en el mismo documento. Falsearlo deja capturar
   la ruta que pide el gesto sin tocar nada fuera de esta prueba, y la
   llamada a `MovilVisor.aplicar` con esa ruta hace a mano lo que el
   suscriptor real del router haría al recibirla. */
describe('MovilVisor — la animación de entrada tras un deslizamiento', function () {

  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  var MV_CON_VIDEO = [
    { id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
      piezas: [{ url: 'a' }, { url: 'b' }] },
    { id: 'oleaje', titulo: 'Oleaje', categoria: 'cortometraje', tipo: 'video',
      piezas: [] }
  ];

  /* Simula UN deslizamiento real de verdad de principio a fin: dispara los
     eventos de puntero sobre la raíz, deja que `soltarEn` decida la
     intención con `MovilGestos`, y hace a mano lo que el router real haría
     al recibir la ruta que `soltarEn` le pide —llamar de vuelta a
     `MovilVisor.aplicar`—, sin tocar `location.hash`. Devuelve la ruta
     capturada por si la prueba la necesita. */
  function deslizarIzquierda(raiz) {
    var antesRouter = window.Router;
    var capturada = null;
    window.Router = { ir: function (tipo, valor, pieza) {
      capturada = { tipo: tipo, valor: valor, pieza: pieza };
    } };
    try {
      raiz.dispatchEvent(new PointerEvent('pointerdown',
        { clientX: 200, clientY: 100, bubbles: true }));
      raiz.dispatchEvent(new PointerEvent('pointerup',
        { clientX: 120, clientY: 100, bubbles: true }));
    } finally {
      window.Router = antesRouter;
    }
    if (capturada) MovilVisor.aplicar(capturada);
    return capturada;
  }

  prueba('un deslizamiento real anima la pieza nueva con la clase de esa dirección',
    function () {
    igual(conVisorSobre(MV_CON_VIDEO, function (refs) {
      return conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        var ruta = deslizarIzquierda(refs.raiz);
        return {
          fueAOleaje: ruta && ruta.valor === 'oleaje',
          animada: refs.escena.firstChild.classList.contains('mvisor-entra-der')
        };
      });
    }), { fueAOleaje: true, animada: true });
  });

  /* El cuidado del encargo: la dirección se consume UNA vez. Llegar a la
     parada siguiente por otra vía —aquí, una `MovilVisor.aplicar` directa,
     que es exactamente lo que hace el suscriptor del router al entrar por la
     URL o al volver con el botón de atrás— no puede heredar la animación del
     deslizamiento anterior. */
  prueba('la parada siguiente, sin gesto detrás, no hereda la animación', function () {
    igual(conVisorSobre(MV_CON_VIDEO, function (refs) {
      return conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        deslizarIzquierda(refs.raiz);
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
        return refs.escena.firstChild.className;
      });
    }), 'mvisor-foto');
  });
});
