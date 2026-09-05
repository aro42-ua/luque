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

  var raiz = null, escena = null, orden = [], aqui = null, elCerrar = null;

  /* Quién tenía el foco justo antes de abrir —normalmente el botón de la
     rejilla que se tocó—, para devolvérselo al cerrar. No se pregunta a
     `js/visor-origen.js`, que hace lo mismo para el escritorio: aquél
     necesita saber DE QUÉ portada salió el visor, y aquí no hace falta,
     porque lo que estuviera enfocado antes de abrir ya es la respuesta. */
  var elFocoDeAntes = null;

  /* `estado` es `null` cuando el visor está cerrado, y `{proyecto, pieza}`
     cuando está abierto. No se usa el `{proyecto: null}` de
     `MovilRecorrido.inicial` para representar «cerrado»: ese valor significa
     «no hay ningún trabajo», que es otra cosa, y confundirlos dejaría el visor
     abierto sobre nada cuando la lista viniera vacía. */
  function estado() { return aqui; }

  function init(refs, proyectos) {
    raiz = refs.raiz;
    escena = refs.escena;
    elCerrar = refs.cerrar;
    orden = ordenDe(proyectos);
    aqui = null;
    window.MovilHud.init({
      raiz:     refs.hud,
      cat:      refs.cat,
      cats:     refs.cats,
      cerrar:   refs.cerrar,
      titulo:   refs.titulo,
      contador: refs.contador
    }, function (categoria) {
      /* Elegir una categoría cierra el visor y deja la portada filtrada: es
         una petición sobre QUÉ trabajos ver, y contestarla sin salir del
         trabajo abierto dejaría la pantalla diciendo una cosa y la URL otra. */
      if (categoria === 'todos') window.Router.ir('todos', null);
      else window.Router.ir('categoria', categoria);
    }, function () {
      window.Router.ir('todos', null);
    });
    engancharGestos();
  }

  /* El suscriptor del router, y la guarda simétrica a la de `js/visor.js`.
     `abriendo` distingue ENTRAR al visor de moverse dentro de él ya abierto
     —deslizar una pieza, cambiar de trabajo—: sólo la primera pide foco
     inicial y engancha el tabulador; lo segundo pintaría de nuevo la escena
     pero no debe arrancarle el foco a quien esté navegando con teclado. */
  function aplicar(ruta) {
    if (window.Movil.actual() !== 'movil') return;
    if (ruta.tipo !== 'proyecto') { cerrar(); return; }

    var nuevo = window.MovilRecorrido.desdeRuta(ruta, orden);
    if (nuevo.proyecto === null) { cerrar(); return; }

    var abriendo = (aqui === null);
    if (abriendo) elFocoDeAntes = document.activeElement;

    aqui = nuevo;
    raiz.hidden = false;
    /* `mvisor-abierto` es un gancho de estado que HOY ningún CSS usa. Se
       nombra igual que `visor-abierto` del escritorio, que sí tiene reglas
       —esconde la barra de navegación—, así que conviene decirlo aquí y no
       dejar que se dé por hecho. El candidato natural es bloquear el
       desplazamiento del cuerpo mientras el visor está abierto; está sin
       decidir porque eso cambia cosas —la posición de desplazamiento al
       cerrar, la barra de direcciones— que sólo se pueden juzgar en un
       teléfono de verdad, y esa comprobación está pendiente. */
    document.body.classList.add('mvisor-abierto');
    pintar();
    if (abriendo) {
      document.addEventListener('keydown', alTeclado);
      elCerrar.focus({ preventScroll: true });
    }
  }

  /* A QUIÉN se puede enfocar lo decide `window.VisorFoco.atrapar`
     (js/visor-foco.js); aquí sólo se le pasa la raíz y el evento, igual que
     hace `js/visor.js`. */
  function alTeclado(e) {
    if (e.key === 'Tab') window.VisorFoco.atrapar(raiz, e);
  }

  function cerrar() {
    if (!aqui) return;
    aqui = null;
    raiz.hidden = true;
    document.body.classList.remove('mvisor-abierto');
    escena.innerHTML = '';
    document.removeEventListener('keydown', alTeclado);
    /* Devuelve el foco a quien lo tenía antes de abrir, y no si ese elemento
       ya salió del documento —la rejilla pudo repintarse mientras el visor
       estaba abierto—: `focus()` sobre un nodo huérfano no hace nada por su
       cuenta, pero más vale no depender de ese silencio. */
    if (elFocoDeAntes && document.contains(elFocoDeAntes)) {
      elFocoDeAntes.focus({ preventScroll: true });
    }
    elFocoDeAntes = null;
  }

  /* Vacía la escena antes de cada parada: sin esto, deslizar acumularía una
     <img> encima de otra y la memoria crecería con cada gesto. */
  function pintar() {
    var p = window.Datos.porId(aqui.proyecto);
    if (!p) { cerrar(); return; }

    escena.innerHTML = '';
    if (aqui.pieza === 'ficha')     escena.appendChild(window.MovilFicha.de(p));
    else if (aqui.pieza === null)   escena.appendChild(videoDe(p));
    else                            escena.appendChild(fotoDe(p, aqui.pieza));
    window.MovilHud.pintar(p, aqui.pieza, p.piezas.length);
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

    /* El toque despierta el HUD y no navega. Que no navegue es lo que hace
       posible volver a encenderlo sin cambiar de foto. */
    if (r.intencion === 'toque') { window.MovilHud.despertar(); return; }

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
