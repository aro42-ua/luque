/* Lo que se fija aquí es POR QUÉ el visor tardaba en abrirse en el móvil.

   `VisorTransicion.volar` no arranca el vuelo hasta que la <img> de la escena
   está completa (`js/visor-transicion.js`, el `if (el.complete)` del final).
   Mientras esa <img> pidiera la foto a tamaño completo —una URL que no está en
   ninguna caché, porque la rejilla muestra otra distinta—, el vuelo esperaba a
   la red entera antes de mover un píxel. Medido el 2026-09-04 con CDP en móvil
   de verdad sobre `#/niebla`: 1371 ms hasta volar en frío contra 4 ms con la
   imagen ya descargada, y el arranque pegado al final de la descarga (1371
   contra 1362). El retardo era la espera, no otra cosa.

   El arreglo es pintar primero una URL que el navegador YA tiene —la portada
   que se está viendo en la celda, o la miniatura de la tira— y cambiar a la
   grande por debajo cuando llegue. Estas pruebas fijan las dos mitades: cuál
   se pide primero, y que la grande acabe puesta.

   Van con `data:` y no con rutas de fichero: así no hay red que esperar ni
   servidor del que depender, y las dos URLs se pueden comparar tal cual. Son
   dos GIF de 1x1 distintos y ambos válidos (42 bytes, cabecera GIF89a), para
   que `load` dispare de verdad en la prueba del relevo. */

var VC_PREVIA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
var VC_PLENA  = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function vcProyecto(conPortada, conMiniatura) {
  return {
    titulo: 'Niebla',
    portadaUrl: conPortada ? VC_PREVIA : null,
    piezas: [
      { url: VC_PLENA, miniatura: null },
      { url: VC_PLENA, miniatura: conMiniatura ? VC_PREVIA : null }
    ]
  };
}

function vcLista(proyecto) {
  return proyecto.piezas.map(function (p) { return p.url; });
}

/* VisorCarga.init guarda la raíz cuya clase 'cargando' enciende el indicador.
   Sin llamarlo, `marcar` reventaría sobre null. La raíz es un div de usar y
   tirar: aquí no se juzga el indicador, sólo que pintar() no dependa de él. */
function vcInit() {
  var r = document.createElement('div');
  VisorCarga.init(r);
  return r;
}

describe('VisorCarga — se pinta primero lo que ya está en pantalla', function () {

  function pintarEn(proyecto, indice) {
    return ArnesDom.conElemento('<div></div>', function (escena) {
      vcInit();
      VisorCarga.pintar(escena, proyecto, { indice: indice, total: proyecto.piezas.length },
                        vcLista(proyecto));
      return escena.querySelector('img').getAttribute('src');
    });
  }

  prueba('la primera pieza se pinta con la portada, que la celda ya tiene cargada', function () {
    igual(pintarEn(vcProyecto(true, false), 0), VC_PREVIA);
  });

  prueba('una pieza posterior se pinta con su miniatura, que la tira ya tiene cargada', function () {
    igual(pintarEn(vcProyecto(false, true), 1), VC_PREVIA);
  });

  /* La red de seguridad del cambio: sin nada previo que enseñar, el
     comportamiento tiene que ser el de siempre —pedir la foto entera— y no
     una <img> sin src o con la cadena "null". */
  prueba('sin portada ni miniatura se pide la foto entera, como antes', function () {
    igual(pintarEn(vcProyecto(false, false), 0), VC_PLENA);
  });

  prueba('el texto alternativo no cambia con la vista previa', function () {
    igual(ArnesDom.conElemento('<div></div>', function (escena) {
      var p = vcProyecto(true, false);
      vcInit();
      VisorCarga.pintar(escena, p, { indice: 0, total: 2 }, vcLista(p));
      return escena.querySelector('img').alt;
    }), 'Niebla, pieza 1 de 2');
  });
});

describeAsync('VisorCarga — la foto grande releva a la vista previa', function () {

  function caja() {
    var c = document.createElement('div');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:400px';
    document.body.appendChild(c);
    return c;
  }

  /* Espera a que el src cambie en vez de dormir un plazo fijo: con `data:` el
     'load' llega en el siguiente tick, pero clavar un número aquí sería una
     prueba que pasa por suerte. Si no cambia nunca, se rinde y devuelve lo que
     haya, y la comparación de abajo enseña el fallo de verdad. */
  function esperarSrc(img, esperado, ms) {
    var limite = ms || 2000;
    var t0 = Date.now();
    return new Promise(function (res) {
      (function mirar() {
        if (img.getAttribute('src') === esperado || Date.now() - t0 > limite) {
          res(img.getAttribute('src'));
          return;
        }
        setTimeout(mirar, 10);
      })();
    });
  }

  prueba('cuando la grande termina de cargar, sustituye a la previa', function () {
    var c = caja();
    var p = vcProyecto(true, false);
    vcInit();
    VisorCarga.pintar(c, p, { indice: 0, total: 2 }, vcLista(p));
    var img = c.querySelector('img');
    igual(img.getAttribute('src'), VC_PREVIA, 'arranca con la previa');
    return esperarSrc(img, VC_PLENA).then(function (src) {
      c.parentNode && c.parentNode.removeChild(c);
      igual(src, VC_PLENA);
    });
  });

  /* El mismo guardián que ya tenía el indicador de carga: si el usuario cambia
     de pieza antes de que la grande llegue, renderizar() vacía la escena y esta
     <img> queda huérfana. Su relevo, aunque llegue tarde, no debe tocarla. */
  prueba('si la escena se vació antes, la huérfana no se releva', function () {
    var c = caja();
    var p = vcProyecto(true, false);
    vcInit();
    VisorCarga.pintar(c, p, { indice: 0, total: 2 }, vcLista(p));
    var img = c.querySelector('img');
    c.removeChild(img);
    return esperarSrc(img, VC_PLENA, 250).then(function (src) {
      c.parentNode && c.parentNode.removeChild(c);
      igual(src, VC_PREVIA);
    });
  });
});
