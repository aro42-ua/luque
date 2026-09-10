/* El cableado del pellizco, que es lo unico de este bloque que no se puede
   probar sin DOM: hace falta que unos punteros de verdad entren por los
   oyentes de la raiz.

   Reutiliza `MV_MARCADO`, `mvRefsDesde` y `conLado` de
   `tests/pruebas-movil-visor.js`, que son globales porque los scripts del
   arnes comparten ventana. Por eso este archivo va DESPUES de aquel en
   test.html. */
describe('MovilVisor: el pellizco', function () {

  var MVZ_PROYECTO = [{
    id: 'niebla', titulo: 'Niebla', categoria: 'editorial', tipo: 'foto',
    portadaUrl: 'portada-niebla.jpg',
    ficha: { cliente: 'Estudio', anio: '2026', papel: 'Direccion de arte' },
    piezas: [{ url: 'pieza-1.jpg' }, { url: 'pieza-2.jpg' }]
  }];

  /* `conLado` se repite en cada sección de `pruebas-movil-visor.js` porque es
     local a cada `describe`, no global como `MV_MARCADO` y `conVisorSobre`.
     Copiarla es lo que hace el archivo de al lado y no hay motivo para
     apartarse: son cuatro líneas y sacarlas a un global obligaría a tocar seis
     secciones que hoy funcionan. */
  function conLado(lado, fn) {
    var antes = window.Movil;
    window.Movil = { actual: function () { return lado; } };
    try { return fn(); } finally { window.Movil = antes; }
  }

  /* Se apoya en `conVisorSobre`, que ya monta el marcado, llama a
     `MovilVisor.init` y falsea `window.Datos`. Lo único que añade es el
     `Router` de mentira: el de verdad escribe en `location.hash` del documento
     de las pruebas, y una sola llamada movería la URL del arnés y dejaría a las
     demás secciones empezando desde otra ruta. Aquí lo que se comprueba es
     justo si se le llama o no, así que basta con contar. */
  function conVisorYRouter(fn) {
    return conVisorSobre(MVZ_PROYECTO, function (refs) {
      var routerAntes = window.Router;
      var llamadas = [];
      window.Router = { ir: function (t, v, p) { llamadas.push([t, v, p]); } };
      try {
        conLado('movil', function () {
          MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 1 });
        });
        return fn(refs, llamadas);
      } finally {
        window.Router = routerAntes;
      }
    });
  }

  /* Una <img> sin cargar mide 0 de ancho natural, y `MovilZoom.maxEscala`
     devuelve entonces 1: sin falsear las medidas no habria nada que ampliar y
     todas las pruebas de abajo pasarian por el camino de «no se puede». Se
     define la propiedad sobre la instancia, que tapa el getter del prototipo. */
  function falsearMedidas(img, natural, pintado) {
    Object.defineProperty(img, 'naturalWidth', { value: natural, configurable: true });
    Object.defineProperty(img, 'clientWidth',  { value: pintado, configurable: true });
    Object.defineProperty(img, 'clientHeight', { value: pintado, configurable: true });
  }

  function dedo(el, tipo, id, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, {
      pointerId: id, clientX: x, clientY: y, bubbles: true
    }));
  }

  prueba('separar dos dedos amplia la foto', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      return refs.escena.querySelector('img').style.transform;
    }), 'translate(0px, 0px) scale(2)');
  });

  prueba('el pellizco no pasa del tope 1:1 del archivo', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 200, 300);
      dedo(refs.raiz, 'pointerdown', 2, 210, 300);
      dedo(refs.raiz, 'pointermove', 2, 1210, 300);
      return refs.escena.querySelector('img').style.transform;
    }), 'translate(0px, 0px) scale(3)');
  });

  /* La mitad que hace util el pellizco: ampliada, el dedo mira la esquina de
     la foto en vez de cambiar de parada. Sin esto, ampliar y querer moverse
     por la foto te saca de la pieza.

     El paseo es un gesto NUEVO, con los dos dedos del pellizco ya levantados:
     asi `MovilGestos` empieza limpio y ese dedo solo habria dado 'arriba' —o
     sea, habria navegado— si no fuera por la guarda. Paseando con el segundo
     dedo aun puesto, `MovilGestos` devolveria 'pellizco' y la prueba pasaria
     igual con la guarda quitada: no comprobaria nada. */
  prueba('ampliada, un dedo pasea la foto y no cambia de parada', function () {
    igual(conVisorYRouter(function (refs, llamadas) {
      var img = refs.escena.querySelector('img');
      falsearMedidas(img, 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 1, 300, 400);
      dedo(refs.raiz, 'pointermove', 1, 300, 200);
      dedo(refs.raiz, 'pointerup', 1, 300, 200);
      return { transform: img.style.transform, llamadas: llamadas.length };
    }), { transform: 'translate(0px, -200px) scale(2)', llamadas: 0 });
  });

  /* La otra mitad, que es la regresion que mas duele: si el pellizco dejara el
     visor sordo, el recorrido de dos ejes del bloque 4f se quedaria muerto y
     ninguna prueba de aquel bloque lo notaria.

     El gesto es VERTICAL porque el horizontal cambia de trabajo y aqui solo hay
     uno: deslizar a la izquierda se quedaria en la misma parada, `siguienteRuta`
     devolveria null y no habria llamada al router que contar, con guarda o sin
     ella. 'arriba' baja una parada —los nombres son los del DEDO, y la
     inversion vive en `movil-recorrido.js`—, asi que de la pieza 1 se va a la 2. */
  prueba('sin ampliar, el mismo deslizamiento sigue cambiando de parada', function () {
    igual(conVisorYRouter(function (refs, llamadas) {
      dedo(refs.raiz, 'pointerdown', 1, 300, 400);
      dedo(refs.raiz, 'pointerup', 1, 300, 200);
      return llamadas;
    }), [['proyecto', 'niebla', 2]]);
  });

  prueba('cambiar de parada devuelve la foto a su encaje', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs.escena.querySelector('img'), 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 1, 150, 300);
      conLado('movil', function () {
        MovilVisor.aplicar({ tipo: 'proyecto', valor: 'niebla', pieza: 2 });
      });
      return refs.escena.querySelector('img').style.transform;
    }), '');
  });
});
