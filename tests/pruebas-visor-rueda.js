/* La rueda del visor de escritorio, convertida en gestos.

   EL DEFECTO, medido el 2026-09-11 en local: 20 eventos `wheel` seguidos con
   deltaY:3 -lo que suelta un trackpad en una sola inercia- saltaban NUEVE
   piezas, y un desplazamiento puramente horizontal (deltaX:40, deltaY:0)
   también cambiaba de pieza, porque `deltaY > 0` falso caía en "anterior". Un
   pellizco de zoom en Chrome/Edge llega como una ráfaga de `wheel` con
   `ctrlKey:true`: cada evento era una pieza. Ángel lo vio como "las imágenes
   pasan solas hacia la derecha o izquierda" al hacer zoom con el trackpad.

   `VisorRueda.paso(estado, evento, ahora)` es pura: recibe el reloj y devuelve
   {estado, paso} con paso en -1, 0 o 1. Así se prueba una ráfaga entera sin
   esperar de verdad. */
describe('VisorRueda — un paso por gesto', function () {

  function ev(deltaY, extra) {
    var e = { deltaY: deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false };
    Object.keys(extra || {}).forEach(function (k) { e[k] = extra[k]; });
    return e;
  }

  /* Reproduce una secuencia y devuelve los pasos no nulos, con su instante. */
  function rafaga(eventos) {
    var estado = VisorRueda.inicial();
    var pasos = [];
    eventos.forEach(function (par) {
      var r = VisorRueda.paso(estado, par[0], par[1]);
      estado = r.estado;
      if (r.paso) pasos.push(r.paso);
    });
    return pasos;
  }

  prueba('una muesca de ratón es un paso inmediato', function () {
    igual(rafaga([[ev(100), 0]]), [1]);
  });

  /* Ángel lo decidió el 2026-09-11: una pieza por muesca SIEMPRE, vayan
     rápidas o no. La agrupación por gesto es para el trackpad, no para el
     ratón. */
  prueba('tres muescas en 80ms son tres pasos', function () {
    igual(rafaga([[ev(100), 0], [ev(100), 40], [ev(100), 80]]), [1, 1, 1]);
  });

  /* Lo que distingue una muesca de un delta de trackpad es el tamaño: el
     ratón habla en saltos de 100, el trackpad en unidades. Un salto grande
     que llega EN MEDIO de una ráfaga de deltas pequeños ya bloqueada es parte
     de esa ráfaga -un pico de la inercia-, no una muesca. */
  prueba('un pico grande dentro de una ráfaga bloqueada no salta', function () {
    var evs = [];
    for (var i = 0; i < 20; i++) evs.push([ev(3), i * 16]);
    evs.push([ev(90), 20 * 16]);
    igual(rafaga(evs), [1]);
  });

  prueba('tres muescas separadas por el silencio son tres pasos', function () {
    var s = VisorRueda.SILENCIO_MS + 1;
    igual(rafaga([[ev(100), 0], [ev(100), s], [ev(100), 2 * s]]), [1, 1, 1]);
  });

  prueba('hacia arriba es un paso atrás', function () {
    igual(rafaga([[ev(-100), 0]]), [-1]);
  });

  /* El caso que dolía. Veinte deltas de 3 en 16ms cada uno: un solo gesto. */
  prueba('una inercia de trackpad es UN paso, no nueve', function () {
    var evs = [];
    for (var i = 0; i < 20; i++) evs.push([ev(3), i * 16]);
    igual(rafaga(evs), [1]);
  });

  prueba('los deltas pequeños se acumulan hasta el umbral', function () {
    /* 3+3+3 = 9 no llega; hace falta sumar UMBRAL. */
    igual(rafaga([[ev(3), 0], [ev(3), 16], [ev(3), 32]]), []);
  });

  prueba('tras el silencio, el siguiente gesto vuelve a contar', function () {
    var evs = [];
    for (var i = 0; i < 20; i++) evs.push([ev(3), i * 16]);
    var t = 20 * 16 + VisorRueda.SILENCIO_MS + 1;
    for (var j = 0; j < 20; j++) evs.push([ev(3), t + j * 16]);
    igual(rafaga(evs), [1, 1]);
  });

  /* Chrome y Edge mandan el pellizco del trackpad como wheel con ctrlKey.
     Eso es intención de zoom, no de pasar página. */
  prueba('el pellizco (ctrlKey) no cambia de pieza', function () {
    igual(rafaga([[ev(100, { ctrlKey: true }), 0],
                  [ev(-100, { ctrlKey: true }), 20]]), []);
  });

  prueba('un desplazamiento horizontal no cambia de pieza', function () {
    igual(rafaga([[ev(0, { deltaX: 40 }), 0], [ev(5, { deltaX: 60 }), 20]]), []);
  });

  prueba('deltaY cero no es "atrás"', function () {
    igual(rafaga([[ev(0), 0]]), []);
  });

  /* deltaMode 1 (líneas) y 2 (páginas) son ruedas que no hablan en píxeles:
     un evento ya es un gesto entero. */
  prueba('en modo líneas o páginas, un evento es un paso', function () {
    igual(rafaga([[ev(3, { deltaMode: 1 }), 0],
                  [ev(1, { deltaMode: 2 }), 500]]), [1, 1]);
  });

  prueba('no modifica el estado que recibe', function () {
    var e = VisorRueda.inicial();
    var copia = JSON.parse(JSON.stringify(e));
    VisorRueda.paso(e, ev(100), 0);
    igual(e, copia);
  });
});

/* EL PUNTO CIEGO, otra vez: un módulo que test.html carga y index.html no
   da la suite en verde y un TypeError en producción. Necesita servidor. */
describeAsync('VisorRueda — llega a la página real', function () {
  return fetch('../index.html', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('index.html respondió ' + r.status);
      return r.text();
    })
    .then(function (html) {
      prueba('index.html carga js/visor-rueda.js antes que visor.js', function () {
        var yo = html.indexOf('js/visor-rueda.js');
        cierto(yo !== -1, 'index.html no nombra el módulo');
        cierto(yo < html.indexOf('js/visor.js"'), 'va después de visor.js');
      });
    });
});
