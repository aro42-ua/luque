window.MovilGlobo = (function () {

  /* La esfera de la portada móvil en el DOM: pinta una tesela por trabajo,
     le aplica lo que calcula `MovilEsfera` (js/movil-esfera.js) y atiende el
     dedo, la rueda, el teclado y la ruta. Toda la matemática vive allí; aquí
     sólo se traduce a estilos y a eventos.

     Sustituye a la rejilla (`js/movil-hoja.js`, retirado el 2026-09-29). */

  /* Por encima de este brillo la tesela ya está lo bastante cerca del frente
     como para merecer la foto de 1500. Una vez cambiada no vuelve a la de
     250: la grande ya está en la caché y bajar sería gastar sin ganar nada. */
  var LUZ_GRANDE = 0.7;

  /* Menos de esto entre el `pointerdown` y el `pointerup` es un toque, no un
     arrastre. 8 px absorben el temblor de un dedo sin tragarse un giro corto. */
  var UMBRAL_TOQUE = 8;
  /* Con un solo trabajo no hay a dónde girar: el arrastre se resiste y el
     muelle lo devuelve. */
  var RESISTENCIA_SOLO = 0.35;

  var actual = null;

  /* La portada llega en 1500; su miniatura de 250 sale del mismo nombre,
     que es el que fija `herramientas/derivar_imagenes.py`. Un póster de
     vídeo u otra ruta sin ese sufijo se queda como está: pedir la grande
     es peor que no tener miniatura, pero mejor que una ruta inventada. */
  function miniaturaDe(url) {
    return /-1500\.\w+$/.test(url) ? url.replace(/-1500\.(\w+)$/, '-250.$1') : url;
  }

  function init(nodos, proyectos, opciones) {
    actual = crear(nodos, proyectos, opciones || {});
    return actual;
  }

  function crear(nodos, proyectos, opciones) {
    var raiz = nodos.raiz;
    var lista = nodos.lista;
    var fotograma = opciones.fotograma || function (cb) { return window.requestAnimationFrame(cb); };
    var reducido = opciones.reducido !== undefined
      ? opciones.reducido
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var medir = opciones.medir || function () {
      var r = raiz.getBoundingClientRect();
      return { ancho: r.width, alto: r.height };
    };
    var alAbrir = opciones.alAbrir || function () {};

    var teselas = [];     // por índice en la lista COMPLETA
    var ramas = [];       // ídem: la rama que va del centro a cada tesela
    var nudo = null;
    var visibles = [];    // índices en la lista completa, en el orden de `puntos`
    var puntos = [];
    var estado = window.MovilEsfera.inicial([]);
    var categoria = null;
    var primeraGrande = true;
    var gesto = null;
    var congelado = false;
    var pendiente = false;
    var ultimoT = null;
    var recordado = null;

    function total() { return window.MovilEsfera.numero(proyectos.length - 1); }

    /* Las ramas: del centro de la esfera, una línea hasta cada portada, y un
       nudo donde se juntan todas (petición de Ángel, 2026-09-29). Van en una
       capa hermana de la lista y SIN contexto de apilamiento propio, para que
       cada rama pueda colarse en el orden justo por debajo de su tesela
       (ver `dibujar`). Son dibujo, no contenido: fuera del lector. */
    function pintarRamas() {
      var vieja = raiz.querySelector('.esfera-ramas');
      if (vieja) vieja.parentNode.removeChild(vieja);
      var capa = document.createElement('div');
      capa.className = 'esfera-ramas';
      capa.setAttribute('aria-hidden', 'true');
      nudo = document.createElement('span');
      nudo.className = 'esfera-nudo';
      capa.appendChild(nudo);
      ramas = proyectos.map(function (p) {
        var r = document.createElement('span');
        r.className = 'esfera-rama';
        r.dataset.id = p.id;
        capa.appendChild(r);
        return r;
      });
      raiz.insertBefore(capa, lista);
    }

    function pintar() {
      pintarRamas();
      lista.innerHTML = '';
      teselas = proyectos.map(function (p, i) {
        var li = document.createElement('li');
        li.className = 'esfera-tesela';
        li.dataset.id = p.id;
        li.dataset.indice = String(i);

        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'esfera-boton';
        boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

        var img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        img.src = miniaturaDe(p.portadaUrl);
        /* Si la foto no llega, la tesela se queda en gris con su número: un
           hueco numerado se lee como «falta esa», no como «la web está rota».
           Cambiar a la grande quita la marca, por si la pequeña falló y la
           grande sí llega. */
        img.addEventListener('error', function () { li.classList.add('sin-foto'); });
        img.addEventListener('load', function () { li.classList.remove('sin-foto'); });

        var velo = document.createElement('span');
        velo.className = 'esfera-velo';

        var num = document.createElement('span');
        num.className = 'esfera-numero';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = window.MovilEsfera.numero(i);

        boton.appendChild(img);
        boton.appendChild(velo);
        boton.appendChild(num);
        li.appendChild(boton);
        lista.appendChild(li);
        return li;
      });
    }

    /* Rehace la esfera para una categoría (`null` = todas). Las de otras
       categorías salen con `hidden` y las que quedan se reparten por TODA la
       superficie, conservando su número de la lista completa. */
    function reconstruir(cat) {
      categoria = cat;
      visibles = [];
      proyectos.forEach(function (p, i) {
        var dentro = cat === null || p.categoria === cat;
        teselas[i].hidden = !dentro;
        ramas[i].hidden = !dentro;
        if (dentro) visibles.push(i);
      });
      nudo.hidden = !visibles.length;
      puntos = window.MovilEsfera.reparto(visibles.length);
      estado = window.MovilEsfera.inicial(puntos);
      dibujar();
      anunciar();
    }

    function cambiarAGrande(li, p) {
      var img = li.querySelector('img');
      if (img.dataset.grande) return;
      img.dataset.grande = '1';
      if (primeraGrande) {
        img.setAttribute('fetchpriority', 'high');
        primeraGrande = false;
      }
      img.src = p.portadaUrl;
    }

    function dibujar() {
      if (!visibles.length) return;
      var medidas = medir();
      /* Una raíz sin medidas es una esfera que todavía no se ve: en
         index.html `init` corre antes de que `Movil.init` ponga
         `body.es-movil`, con `.hoja` aún en `display:none`. Dibujar ahí
         dejaría todas las teselas a 0 px; se espera al `redibujar()` que
         llega cuando el lado móvil se enciende. */
      if (!medidas.ancho || !medidas.alto) return;
      var g = window.MovilEsfera.geometria(medidas);
      var ancho = g.tesela;
      var alto = g.tesela * 1.25;
      var proy = window.MovilEsfera.proyectar(estado, puntos, medidas);
      var centro = 'translate3d(' + g.cx.toFixed(1) + 'px,' + g.cy.toFixed(1) + 'px,0)';
      /* El nudo está en el centro de la esfera, o sea a media profundidad:
         el mismo `z` que tendría una tesela en el ecuador. */
      nudo.style.transform = centro;
      nudo.style.zIndex = '1000';
      proy.forEach(function (pr, k) {
        var i = visibles[k];
        var li = teselas[i];
        li.style.width = ancho.toFixed(1) + 'px';
        li.style.height = alto.toFixed(1) + 'px';
        /* Todo en una escritura. `perspective()` dentro del propio `transform`
           da la curva a esta tesela sola, sin `preserve-3d` en el contenedor:
           en Safari de iPhone el 3D anidado parpadea y cruza capas. */
        li.style.transform =
          'translate3d(' + (pr.x - ancho / 2).toFixed(1) + 'px,' +
                           (pr.y - alto / 2).toFixed(1) + 'px,0) ' +
          'scale(' + pr.escala.toFixed(4) + ') ' +
          'perspective(' + Math.round(ancho * 3) + 'px) ' +
          'rotateY(' + pr.inclinacion.y.toFixed(2) + 'deg) ' +
          'rotateX(' + pr.inclinacion.x.toFixed(2) + 'deg)';
        /* Pares para las ramas, impares para las teselas: así cada rama cae
           JUSTO por debajo de su tesela y por encima de todo lo que está más
           atrás, que es lo que hace que la rama de una portada de delante
           cruce por encima de las de detrás y se esconda bajo la suya. */
        li.style.zIndex = String(2 * pr.z + 1);
        li.querySelector('.esfera-velo').style.opacity = (1 - pr.luz).toFixed(3);

        var rama = ramas[i];
        var dx = pr.x - g.cx;
        var dy = pr.y - g.cy;
        rama.style.width = Math.hypot(dx, dy).toFixed(1) + 'px';
        rama.style.transform = centro + ' rotate(' + Math.atan2(dy, dx).toFixed(4) + 'rad)';
        rama.style.zIndex = String(2 * pr.z);
        rama.style.opacity = (0.7 * pr.luz).toFixed(3);

        var detras = !pr.visible;
        if (li.classList.contains('detras') !== detras || !li.dataset.pintada) {
          li.dataset.pintada = '1';
          li.classList.toggle('detras', detras);
          var b = li.querySelector('button');
          if (detras) { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
          else { b.removeAttribute('aria-hidden'); b.removeAttribute('tabindex'); }
        }
        if (pr.luz > LUZ_GRANDE) cambiarAGrande(li, proyectos[i]);
      });
    }

    function indiceDelante() {
      var k = window.MovilEsfera.delante(estado, puntos);
      return k < 0 ? -1 : visibles[k];
    }

    /* El pie cambia cuando la esfera se ASIENTA, no mientras gira: el
       movimiento ya lo pone el giro, y un título que parpadea con cada
       tesela que pasa no se puede leer. */
    function anunciar() {
      var i = indiceDelante();
      if (i < 0) {
        nodos.titulo.textContent = '';
        nodos.meta.textContent = '';
        return;
      }
      var p = proyectos[i];
      nodos.titulo.textContent = p.titulo;
      nodos.meta.textContent = p.categoria + ' ' + window.MovilEsfera.numero(i) + '/' + total();
    }

    function avanzar(ms) {
      estado = window.MovilEsfera.avanzar(estado, ms, puntos);
      dibujar();
      if (!estado.animando) anunciar();
    }

    /* El reloj sólo corre mientras hay movimiento: quieta, la esfera no gasta
       ni un fotograma. */
    function programar() {
      if (pendiente || congelado || !estado.animando) return;
      pendiente = true;
      fotograma(function (t) {
        pendiente = false;
        var ms = ultimoT === null ? 16 : Math.max(0, Math.min(64, t - ultimoT));
        ultimoT = t;
        avanzar(ms);
        if (estado.animando) programar();
        else ultimoT = null;
      });
    }

    function soltarAhora(msDesdeUltimo) {
      estado = window.MovilEsfera.soltar(estado, puntos,
        { reducido: reducido, msDesdeUltimo: msDesdeUltimo });
      dibujar();
      if (estado.animando) programar();
      else anunciar();
    }

    function llevarA(k) {
      estado = window.MovilEsfera.apuntar(estado, puntos[k], reducido);
      dibujar();
      if (estado.animando) programar();
      else anunciar();
    }

    /* Qué hace un toque sobre la tesela de índice `i` (lista completa): la
       de delante se abre; una lateral visible se trae delante, sin abrirla,
       para que nunca se abra por accidente algo que se veía pequeño y de
       lado; cualquier otra cosa (fondo, una de detrás) sólo asienta la
       esfera, por si el toque la pilló girando. */
    function tocar(i) {
      var k = visibles.indexOf(i);
      if (k < 0) { soltarAhora(Infinity); return; }
      if (i === indiceDelante()) {
        estado = window.MovilEsfera.traer(estado, puntos[k]);
        dibujar();
        anunciar();
        alAbrir(proyectos[i].id);
        return;
      }
      var pr = window.MovilEsfera.proyectar(estado, [puntos[k]], medir())[0];
      if (pr.visible) llevarA(k);
      else soltarAhora(Infinity);
    }

    function indiceDeEvento(e) {
      var li = e.target && e.target.closest ? e.target.closest('li.esfera-tesela') : null;
      return li && lista.contains(li) ? Number(li.dataset.indice) : -1;
    }

    /* El toque se decide con `pointerdown`/`pointerup` y NO con `click`, y la
       tesela sale del `pointerdown`. Es la lección de
       `js/diagnostico-toques.js` (retirado con la rejilla): si el `down` y el
       `up` caen en elementos distintos, el navegador manda el `click` al
       ancestro común y el botón no se entera. En una esfera que se mueve bajo
       el dedo eso pasaría a menudo; con la captura de abajo, el `up` llega
       SIEMPRE a la raíz. */
    /* Un gesto que empieza en un enlace o un botón que no es una tesela —la
       pastilla «Contacto», que vive dentro de la raíz— no es de la esfera.
       Sin esta guarda, la captura de abajo se quedaba el puntero y el clic
       nunca llegaba al enlace: medido en el panel, la pastilla no abría nada. */
    function esAjeno(e) {
      var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
      return !!el && !lista.contains(el);
    }

    /* El gesto es de UN dedo, el primero. Con dos, cada `pointermove`
       alternaba entre ellos y el delta pasaba a ser la distancia entre los
       dedos: la esfera daba tirones de lado a lado (revisión final). Los
       eventos de cualquier otro puntero se ignoran. */
    function esDelGesto(e) { return gesto !== null && e.pointerId === gesto.id; }

    raiz.addEventListener('pointerdown', function (e) {
      if (congelado || !visibles.length || esAjeno(e)) return;
      if (gesto !== null && e.pointerId !== gesto.id) return;
      /* `enMarcha`: la esfera giraba por inercia cuando llegó el dedo. Un
         toque así es para FRENARLA, como en cualquier lista con inercia, y
         no puede abrir la portada que pasaba por delante en ese instante. */
      gesto = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
                t: e.timeStamp, indice: indiceDeEvento(e), movido: false,
                enMarcha: estado.animando && estado.objetivo === null };
      /* Pillar la esfera en marcha la para, como una peonza bajo el dedo. */
      estado = { q: estado.q, vel: { h: 0, v: 0 }, objetivo: null, animando: false };
      try { raiz.setPointerCapture(e.pointerId); } catch (sinPunteroActivo) {}
    });

    raiz.addEventListener('pointermove', function (e) {
      if (!esDelGesto(e)) return;
      if (!gesto.movido &&
          Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0) < UMBRAL_TOQUE) return;
      gesto.movido = true;
      var f = visibles.length === 1 ? RESISTENCIA_SOLO : 1;
      estado = window.MovilEsfera.arrastrar(estado,
        (e.clientX - gesto.x) * f, (e.clientY - gesto.y) * f,
        medir().ancho, e.timeStamp - gesto.t);
      gesto.x = e.clientX;
      gesto.y = e.clientY;
      gesto.t = e.timeStamp;
      dibujar();
    });

    raiz.addEventListener('pointerup', function (e) {
      if (!esDelGesto(e)) return;
      var g = gesto;
      gesto = null;
      if (!g.movido && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < UMBRAL_TOQUE) {
        if (g.enMarcha) soltarAhora(Infinity);
        else tocar(g.indice);
        return;
      }
      soltarAhora(e.timeStamp - g.t);
    });

    /* Una llamada entrante o el gesto de sistema del borde se quedan el dedo:
       nunca es un toque, y la esfera tiene que asentarse igual. */
    raiz.addEventListener('pointercancel', function (e) {
      if (!esDelGesto(e)) return;
      gesto = null;
      soltarAhora(Infinity);
    });

    /* Sólo el clic de TECLADO (Intro o espacio sobre un botón) trae
       `detail` 0; el de dedo o ratón ya lo atendió `pointerup`. */
    lista.addEventListener('click', function (e) {
      if (e.detail !== 0 || congelado) return;
      var i = indiceDeEvento(e);
      if (i >= 0) tocar(i);
    });

    var TECLAS = { ArrowRight: 'derecha', ArrowLeft: 'izquierda',
                   ArrowUp: 'arriba', ArrowDown: 'abajo' };

    raiz.addEventListener('keydown', function (e) {
      var dir = TECLAS[e.key];
      if (!dir || congelado || !visibles.length) return;
      e.preventDefault();
      var k = window.MovilEsfera.vecina(estado, puntos, dir);
      if (k < 0) return;
      llevarA(k);
      teselas[visibles[k]].querySelector('button').focus({ preventScroll: true });
    });

    /* La rueda, para la ventana de escritorio estrechada: gira en vertical, y
       con mayúsculas en horizontal. Con movimiento reducido cada golpe salta
       a la vecina, porque girar un poco y volver al sitio sería movimiento
       sin resultado. */
    raiz.addEventListener('wheel', function (e) {
      if (congelado || !visibles.length) return;
      e.preventDefault();
      var dx = e.shiftKey ? -e.deltaY : -e.deltaX;
      var dy = e.shiftKey ? 0 : -e.deltaY;
      if (reducido) {
        var dir = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? 'derecha' : 'izquierda')
          : (dy < 0 ? 'abajo' : 'arriba');
        llevarA(window.MovilEsfera.vecina(estado, puntos, dir));
        return;
      }
      estado = window.MovilEsfera.arrastrar(estado, dx * 0.5, dy * 0.5, medir().ancho, 16);
      soltarAhora(0);
    }, { passive: false });

    function elementoDe(id) {
      for (var i = 0; i < proyectos.length; i++) {
        if (proyectos[i].id === id) return teselas[i].querySelector('button');
      }
      return null;
    }

    /* La misma regla que tenía `MovilHoja.filtrarDesdeRuta`: abrir un
       proyecto o la hoja de contacto no dice nada del filtro. Lo que sí hace
       abrir un proyecto es apuntarlo, porque el visor puede moverse de
       trabajo por su eje horizontal y al cerrar hay que dejar delante el
       ÚLTIMO, no el que se tocó.

       El foco se mueve sólo si ya estaba dentro de la esfera: es el caso del
       visor que al cerrar devuelve el foco a la tesela que lo abrió
       (js/movil-visor.js), y esta función corre DESPUÉS de aquélla porque
       index.html la suscribe después. Si el foco estaba en otro sitio, no se
       le roba. */
    function aplicar(ruta) {
      if (ruta.tipo === 'proyecto') { recordado = ruta.valor; return; }
      if (ruta.tipo === 'contacto') return;
      var cat = ruta.tipo === 'categoria' ? ruta.valor : null;
      if (cat !== categoria) reconstruir(cat);
      if (recordado === null) return;
      var id = recordado;
      recordado = null;
      var i = -1;
      for (var n = 0; n < proyectos.length; n++) if (proyectos[n].id === id) i = n;
      var k = visibles.indexOf(i);
      if (k < 0) return;
      var enfocado = raiz.contains(document.activeElement);
      estado = window.MovilEsfera.traer(estado, puntos[k]);
      dibujar();
      anunciar();
      if (enfocado) teselas[i].querySelector('button').focus({ preventScroll: true });
    }

    pintar();
    reconstruir(null);

    return {
      delante: function () { var i = indiceDelante(); return i < 0 ? null : proyectos[i].id; },
      estado: function () { return estado; },
      proyeccion: function () {
        return window.MovilEsfera.proyectar(estado, puntos, medir()).map(function (pr, k) {
          return { id: proyectos[visibles[k]].id, x: pr.x, y: pr.y, luz: pr.luz, visible: pr.visible };
        });
      },
      avanzar: avanzar,
      redibujar: dibujar,
      elementoDe: elementoDe,
      aplicar: aplicar,
      congelar: function () { congelado = true; gesto = null; },
      descongelar: function () { congelado = false; programar(); }
    };
  }

  function elementoDe(id) { return actual ? actual.elementoDe(id) : null; }
  function redibujar() { if (actual) actual.redibujar(); }
  function aplicar(ruta) { if (actual) actual.aplicar(ruta); }
  function congelar() { if (actual) actual.congelar(); }
  function descongelar() { if (actual) actual.descongelar(); }

  return {
    miniaturaDe: miniaturaDe,
    init: init,
    elementoDe: elementoDe,
    redibujar: redibujar,
    aplicar: aplicar,
    congelar: congelar,
    descongelar: descongelar
  };
})();
