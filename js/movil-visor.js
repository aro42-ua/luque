window.MovilVisor = (function () {

  /* La conversión que `js/movil-recorrido.js` pide por escrito en el
     comentario sobre `indiceDeProyecto`: allí `piezas` es un NÚMERO, aquí
     arriba es un array. Equivocarse no da error —`array >= 1` es `NaN >= 1`,
     `false`— y trataría como vídeo a todo proyecto de fotos, sin que nada
     avise. Por eso la conversión tiene nombre, un solo sitio y prueba propia.

     El `|| 0` cubre al proyecto que llega sin el campo: hoy los de vídeo lo
     traen vacío, pero eso lo garantiza `contenido.json` y no este módulo. */
  function ordenDe(proyectos) {
    return proyectos.map(function (p) {
      return { id: p.id, piezas: (p.piezas && p.piezas.length) || 0 };
    });
  }

  var raiz = null, escena = null, orden = [], aqui = null;

  /* `estado` es `null` cuando el visor está cerrado, y `{proyecto, pieza}`
     cuando está abierto. No se usa el `{proyecto: null}` de
     `MovilRecorrido.inicial` para representar «cerrado»: ese valor significa
     «no hay ningún trabajo», que es otra cosa, y confundirlos dejaría el visor
     abierto sobre nada cuando la lista viniera vacía. */
  function estado() { return aqui; }

  function init(refs, proyectos) {
    raiz = refs.raiz;
    escena = refs.escena;
    orden = ordenDe(proyectos);
    aqui = null;
    engancharGestos();
  }

  /* El suscriptor del router, y la guarda simétrica a la de `js/visor.js`. */
  function aplicar(ruta) {
    if (window.Movil.actual() !== 'movil') return;
    if (ruta.tipo !== 'proyecto') { cerrar(); return; }

    var nuevo = window.MovilRecorrido.desdeRuta(ruta, orden);
    if (nuevo.proyecto === null) { cerrar(); return; }

    aqui = nuevo;
    raiz.hidden = false;
    document.body.classList.add('mvisor-abierto');
    pintar();
  }

  function cerrar() {
    if (!aqui) return;
    aqui = null;
    raiz.hidden = true;
    document.body.classList.remove('mvisor-abierto');
    escena.innerHTML = '';
  }

  /* Vacía la escena antes de cada parada: sin esto, deslizar acumularía una
     <img> encima de otra y la memoria crecería con cada gesto. */
  function pintar() {
    var p = window.Datos.porId(aqui.proyecto);
    if (!p) { cerrar(); return; }

    escena.innerHTML = '';
    if (aqui.pieza === 'ficha')     escena.appendChild(fichaDe(p));
    else if (aqui.pieza === null)   escena.appendChild(videoDe(p));
    else                            escena.appendChild(fotoDe(p, aqui.pieza));
  }

  /* La foto, con carga progresiva. Se pinta primero la PORTADA —que la rejilla
     ya tiene descargada, porque venías de verla— y se cambia a la pieza entera
     cuando llega. Medido el 2026-09-04 sobre el visor de escritorio en móvil:
     pedir la pieza de primeras eran 1371 ms hasta ver algo, contra 4 ms con la
     imagen ya en caché. Sin esto, cada deslizamiento en 4G es un segundo de
     negro.

     CONDICIÓN SOBRE EL CONTENIDO, no sobre este código: la portada y la pieza
     tienen que ser la misma foto EN LA MISMA PROPORCIÓN. La escena usa
     `object-fit:contain` (css/luque.css), así que la caja pintada la decide la
     proporción de la imagen: si no coinciden, el cambio da un salto. En el
     relleno coinciden (las dos 4:5); quien genere los recortes de las fotos del
     estudio tiene que mantenerlo.

     No se reutiliza `js/visor-carga.js`, que hace esto mismo para el
     escritorio: aquel módulo guarda su raíz en una variable de módulo, y
     llamarlo desde aquí la reapuntaría al marco móvil, dejando el indicador del
     escritorio atado a un elemento que ya no se ve en cuanto se cruza el umbral
     de ancho con el visor abierto. Quince líneas repetidas salen más baratas
     que un fallo que sólo aparece girando una tableta. */
  function fotoDe(p, numero) {
    var plena = p.piezas[numero - 1].url;
    var img = document.createElement('img');
    img.className = 'mvisor-foto';
    img.src = p.portadaUrl || plena;
    img.alt = p.titulo + ', pieza ' + numero + ' de ' + p.piezas.length;
    img.decoding = 'async';
    if (p.portadaUrl && p.portadaUrl !== plena) relevar(img, plena);
    return img;
  }

  /* Cambia a la foto entera cuando está descargada y decodificada, así que el
     cambio no parpadea. El fallo NO releva a propósito: dejar la portada buena
     en pantalla es mejor que cambiarla por una imagen rota. Y comprueba
     `parentNode` porque el dedo puede haber deslizado a otra parada mientras
     tanto, y esta <img> ya no estar en ninguna escena. */
  function relevar(img, plena) {
    var grande = new Image();
    grande.addEventListener('load', function () {
      if (img.parentNode) img.src = plena;
    }, { once: true });
    grande.src = plena;
  }

  /* Sin `vimeo` se enseña el póster y no un rectángulo negro, que es lo que la
     spec pide en «Cuando algo falla». Hoy es el camino NORMAL y no el de
     excepción: los seis proyectos de vídeo de `contenido.json` llevan
     `vimeo: null` hasta que el estudio suba los suyos. */
  function videoDe(p) {
    if (!p.vimeo) {
      var poster = document.createElement('img');
      poster.className = 'mvisor-foto';
      poster.src = p.portadaUrl;
      poster.alt = p.titulo + ', fotograma del vídeo';
      poster.decoding = 'async';
      return poster;
    }
    var marco = document.createElement('iframe');
    marco.className = 'mvisor-video';
    marco.src = 'https://player.vimeo.com/video/' + p.vimeo;
    marco.title = p.titulo;
    marco.setAttribute('allow', 'fullscreen; picture-in-picture');
    marco.setAttribute('allowfullscreen', '');
    return marco;
  }

  /* La ficha es el FONDO del eje vertical, no un panel que se despliega encima:
     por eso se pinta en la misma escena y sustituye a la foto. Las cinco filas
     son las mismas que enseña el escritorio en `VisorFicha.pintar`
     (js/visor-ficha.js), y con los mismos rótulos, porque es la misma ficha
     vista en otra pantalla. */
  function fichaDe(p) {
    var caja = document.createElement('div');
    caja.className = 'mvisor-ficha';

    var h = document.createElement('h2');
    h.className = 'mvisor-ficha-titulo';
    h.textContent = p.titulo;
    caja.appendChild(h);

    var lista = document.createElement('dl');
    lista.className = 'mvisor-ficha-datos';
    [['Cliente', p.ficha.cliente],
     ['Año',     p.ficha.anio],
     ['Cámara',  p.ficha.camara],
     ['Óptica',  p.ficha.optica],
     ['Piezas',  p.piezas.length]].forEach(function (f) {
      var fila = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd);
      lista.appendChild(fila);
    });
    caja.appendChild(lista);
    return caja;
  }

  /* Del dedo a la ruta. Devuelve `null` cuando la intención no mueve —el toque,
     el pellizco, la zona muerta, y el borde de la serie— para no llamar al
     router sin necesidad: `Router.decidir` trataría ese destino como «avisar» y
     volveríamos a pintar la misma parada por nada.

     Este módulo NO invierte las direcciones. `MovilRecorrido.mover` lleva
     escrito que los nombres son los del DEDO y que la inversión vive allí y en
     ningún otro sitio, porque si viviera en quien pinta, cada pantalla nueva
     podría equivocarse de signo por su cuenta. Si algún día los gestos se
     sienten al revés, el sitio donde mirar es `movil-recorrido.js`. */
  function siguienteRuta(aqui, intencion, orden) {
    if (!aqui) return null;
    if (intencion !== 'izquierda' && intencion !== 'derecha'
        && intencion !== 'arriba' && intencion !== 'abajo') return null;

    var destino = window.MovilRecorrido.mover(aqui, intencion, orden);
    if (destino.proyecto === aqui.proyecto && destino.pieza === aqui.pieza) {
      return null;
    }
    return window.MovilRecorrido.aRuta(destino);
  }

  var gesto = null;

  /* Los oyentes van en la RAÍZ y no en la escena: la escena la vacía `pintar`
     en cada parada, así que un oyente puesto allí se iría con el primer
     deslizamiento y el segundo no haría nada. La raíz sobrevive a todo el
     recorrido.

     `pointer*` y no `touch*`: es lo que ya usa el resto del móvil
     (`js/movil-puerta.js`) y lo que permite probar el gesto con un ratón en el
     escritorio mientras se desarrolla.

     `pointercancel` cuenta como soltar. El sistema lo dispara cuando se lleva
     el gesto —una llamada entrante, el gesto de «atrás» del navegador desde el
     borde— y sin tratarlo el contador de dedos de `MovilGestos` se quedaría en
     uno para siempre, dejando el visor sordo hasta recargar. */
  function engancharGestos() {
    gesto = window.MovilGestos.inicial();

    raiz.addEventListener('pointerdown', function (e) {
      gesto = window.MovilGestos.presionar(gesto, { x: e.clientX, y: e.clientY });
    });

    raiz.addEventListener('pointerup', function (e) {
      soltarEn(e);
    });

    raiz.addEventListener('pointercancel', function (e) {
      soltarEn(e);
    });
  }

  function soltarEn(e) {
    var r = window.MovilGestos.soltar(gesto, { x: e.clientX, y: e.clientY });
    gesto = r.estado;
    if (r.intencion === null) return;

    /* En la Tarea 4 el toque despierta el HUD. Aquí se consume sin hacer nada,
       que es lo correcto mientras no haya HUD que despertar. */
    var ruta = siguienteRuta(aqui, r.intencion, orden);
    if (!ruta) return;
    window.Router.ir(ruta.tipo, ruta.valor, ruta.pieza);
  }

  return {
    ordenDe: ordenDe,
    init: init,
    aplicar: aplicar,
    estado: estado,
    siguienteRuta: siguienteRuta
  };
})();
