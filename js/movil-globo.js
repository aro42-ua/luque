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
    var visibles = [];    // índices en la lista completa, en el orden de `puntos`
    var puntos = [];
    var estado = window.MovilEsfera.inicial([]);
    var categoria = null;
    var primeraGrande = true;

    function total() { return window.MovilEsfera.numero(proyectos.length - 1); }

    function pintar() {
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
        if (dentro) visibles.push(i);
      });
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
      var g = window.MovilEsfera.geometria(medidas);
      var ancho = g.tesela;
      var alto = g.tesela * 1.25;
      var proy = window.MovilEsfera.proyectar(estado, puntos, medidas);
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
        li.style.zIndex = String(pr.z);
        li.querySelector('.esfera-velo').style.opacity = (1 - pr.luz).toFixed(3);

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

    function elementoDe(id) {
      for (var i = 0; i < proyectos.length; i++) {
        if (proyectos[i].id === id) return teselas[i].querySelector('button');
      }
      return null;
    }

    pintar();
    reconstruir(null);

    return {
      delante: function () { var i = indiceDelante(); return i < 0 ? null : proyectos[i].id; },
      estado: function () { return estado; },
      proyeccion: function () {
        return window.MovilEsfera.proyectar(estado, puntos, medir()).map(function (pr, k) {
          return { id: proyectos[visibles[k]].id, x: pr.x, luz: pr.luz, visible: pr.visible };
        });
      },
      avanzar: avanzar,
      redibujar: dibujar,
      elementoDe: elementoDe
    };
  }

  function elementoDe(id) { return actual ? actual.elementoDe(id) : null; }
  function redibujar() { if (actual) actual.redibujar(); }

  return {
    miniaturaDe: miniaturaDe,
    init: init,
    elementoDe: elementoDe,
    redibujar: redibujar
  };
})();
