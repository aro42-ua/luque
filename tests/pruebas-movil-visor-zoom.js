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
     define la propiedad sobre la instancia, que tapa el getter del prototipo.

     Falsea TAMBIEN el tamano del marco (`escena`), y no solo el de la foto:
     `test.html` no carga ningun CSS, asi que sin esto `escena.clientWidth`/
     `clientHeight` saldrian de un layout sin estilos que no dice nada sobre
     la pantalla real. Y los cuatro tamanos son parametros independientes
     —foto y marco puestos a cuadrados anularian justo la diferencia que el
     acotado del paseo existe para respetar (ver `js/movil-zoom.js`,
     comentario de `margen`)—, asi que quien llama puede pedir foto y marco NO
     cuadrados y distintos entre si. Cuando no se piden, cada uno cae en el
     anterior: `fotoAlto` en `fotoAncho`, `marcoAncho` en `fotoAncho` y
     `marcoAlto` en `fotoAlto`, que reproduce el caso cuadrado de las pruebas
     que no dependen de esta distincion. */
  function falsearMedidas(refs, natural, fotoAncho, fotoAlto, marcoAncho, marcoAlto) {
    if (fotoAlto == null) fotoAlto = fotoAncho;
    if (marcoAncho == null) marcoAncho = fotoAncho;
    if (marcoAlto == null) marcoAlto = fotoAlto;
    var img = refs.escena.querySelector('img');
    Object.defineProperty(img, 'naturalWidth', { value: natural, configurable: true });
    Object.defineProperty(img, 'clientWidth',  { value: fotoAncho, configurable: true });
    Object.defineProperty(img, 'clientHeight', { value: fotoAlto, configurable: true });
    Object.defineProperty(refs.escena, 'clientWidth',  { value: marcoAncho, configurable: true });
    Object.defineProperty(refs.escena, 'clientHeight', { value: marcoAlto, configurable: true });
    return img;
  }

  function dedo(el, tipo, id, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, {
      pointerId: id, clientX: x, clientY: y, bubbles: true
    }));
  }

  prueba('separar dos dedos amplia la foto', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs, 1200, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      return refs.escena.querySelector('img').style.transform;
    }), 'translate(0px, 0px) scale(2)');
  });

  prueba('el pellizco no pasa del tope 1:1 del archivo', function () {
    igual(conVisorYRouter(function (refs) {
      falsearMedidas(refs, 1200, 400);
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
  /* Foto y marco NO cuadrados a proposito, con los numeros reales de la spec:
     una pieza 2400x3000 en una pantalla de 390x844 se pinta a 390x488. En el
     ancho coinciden (390 y 390) y el paseo se acota igual que antes; en el
     alto NO —488 contra 844—, y ahi el maximo correcto al doble es
     (488*2-844)/2 = 66, muy lejos de los 200 que saldrian de medir contra la
     propia foto (488*2-488)/2 = 244... salvo el redondeo de la caja cuadrada
     que esta prueba usaba antes, que dejaba pasar el defecto: con una escena
     tambien cuadrada, foto y marco eran la misma caja y el error se anulaba
     solo. Arrastrar 9999 hacia arriba tiene que pararse en 66 y no mas alla. */
  prueba('ampliada, un dedo pasea la foto y no cambia de parada', function () {
    igual(conVisorYRouter(function (refs, llamadas) {
      var img = falsearMedidas(refs, 1200, 390, 488, 390, 844);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);
      dedo(refs.raiz, 'pointermove', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 2, 350, 300);
      dedo(refs.raiz, 'pointerup', 1, 150, 300);
      dedo(refs.raiz, 'pointerdown', 1, 300, 400);
      dedo(refs.raiz, 'pointermove', 1, 300, 200);
      dedo(refs.raiz, 'pointerup', 1, 300, 200);
      return { transform: img.style.transform, llamadas: llamadas.length };
    }), { transform: 'translate(0px, -66px) scale(2)', llamadas: 0 });
  });

  /* La regresion del pulgar o la palma que se apoyan: con tres dedos en la
     pantalla, levantar uno de los dos que formaban la pareja original deja
     dos dedos que nunca midieron `d0` juntos. Sin recongelar `base`/`d0` al
     cambiar la pareja (ver `refrescarPar` en `js/movil-visor.js`), el
     siguiente `pointermove` usa el `d0` de la pareja VIEJA sobre la posicion
     de la pareja NUEVA.

     Aqui: A@150 y B@250 (d0=100) pellizcan hasta B@450 (escala 3). Entra
     C@470 —un tercer dedo, tope 2000/400=5— y se levanta A: quedan B@450 y
     C@470, que se recongelan con base=zoom (escala 3) y d0=distancia(B,C)=20.
     C se mueve a 490 (d=40): escala = 3*(40/20) = 6, acotada al tope 5. Sin
     el recongelado, `base`/`d0` seguirian siendo los de A y B —ya sin A en
     escena— y el pellizco se quedaria sordo a este movimiento: la escala se
     quedaria clavada en 3 en vez de subir a 5. */
  prueba('un tercer dedo que se apoya y se retira no deja sordo el pellizco', function () {
    igual(conVisorYRouter(function (refs) {
      var img = falsearMedidas(refs, 2000, 400);
      dedo(refs.raiz, 'pointerdown', 1, 150, 300);   // A
      dedo(refs.raiz, 'pointerdown', 2, 250, 300);   // B: pareja A/B, d0=100
      dedo(refs.raiz, 'pointermove', 2, 450, 300);   // B a 450: escala 3
      dedo(refs.raiz, 'pointerdown', 3, 470, 300);   // C se apoya: tres dedos
      dedo(refs.raiz, 'pointerup', 1, 150, 300);     // se levanta A: quedan B, C
      dedo(refs.raiz, 'pointermove', 3, 490, 300);   // C se mueve: la pareja B/C
      return img.style.transform;                    // ya deberia haberse recongelado
    }), 'translate(0px, 0px) scale(5)');
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
      falsearMedidas(refs, 1200, 400);
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
