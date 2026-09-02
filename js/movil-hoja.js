window.MovilHoja = (function () {

  /* Las proporciones de la rejilla —alto = ancho x proporción—, en ciclo fijo
     y NO al azar. Dos motivos, y ninguno es estético: una portada que cambia
     entre dos cargas impide decir «la tercera de la izquierda» en una
     revisión, y un azar en el pintado haría que una prueba de igualdad fallara
     una vez de cada tantas sin que nadie sepa por qué. Irregular no quiere
     decir impredecible. */
  var PROPORCIONES = [1.25, 1, 1.5, 1, 1.5, 1.25];

  function proporcion(indice) {
    return PROPORCIONES[indice % PROPORCIONES.length];
  }

  /* Dos cifras, desde 01. El número identifica el TRABAJO y no su sitio en
     pantalla: sale del índice en la lista COMPLETA, así que filtrar por
     categoría no lo cambia. Quien llame a `pintar` con una lista ya filtrada
     rompe esa promesa sin que nada avise. */
  function numero(indice) {
    var n = indice + 1;
    return (n < 10 ? '0' : '') + n;
  }

  function celdaDe(p, indice, alAbrir) {
    var celda = document.createElement('li');
    celda.className = 'hoja-celda';
    celda.dataset.id = p.id;
    celda.dataset.cat = p.categoria;
    celda.style.setProperty('--proporcion', proporcion(indice));

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'hoja-boton';
    boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

    var img = document.createElement('img');
    /* `portadaUrl` y no `portada`: lo resuelve `Datos.establecer`
       (js/datos.js), que ya elige el póster en los proyectos de vídeo. */
    img.src = p.portadaUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    /* Si la foto no llega, el marco se queda con su número: un hueco numerado
       se lee como «falta esa», no como «la web está rota». Quien esconde la
       imagen rota es la regla `.hoja-celda.sin-foto img` de css/luque.css, ya
       escrita; el número sobrevive solo, porque cuelga del botón y no de la
       imagen. */
    img.addEventListener('error', function () {
      celda.classList.add('sin-foto');
    });

    /* El número cuelga del BOTÓN, al lado de la imagen y no dentro: es lo que
       hace que sobreviva a una foto que no carga. */
    var num = document.createElement('span');
    num.className = 'hoja-numero';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = numero(indice);

    boton.appendChild(img);
    boton.appendChild(num);
    celda.appendChild(boton);

    boton.addEventListener('click', function () { alAbrir(p.id); });
    return celda;
  }

  /* `proyectos` es la lista COMPLETA, sin filtrar. El filtrado es cosa de
     `filtrar()`, que esconde en vez de repintar justamente para no renumerar. */
  function pintar(contenedor, proyectos, alAbrir) {
    contenedor.innerHTML = '';
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(celdaDe(p, i, alAbrir));
    });
  }

  /* Esconde en vez de repintar, y no es una optimización: los números salen
     del índice en la lista completa, así que repintar sólo con los de la
     categoría los renumeraría de 01 en adelante — justo lo que la spec
     prohíbe cuando dice que el número identifica el trabajo y no su sitio.

     `hidden` y no una clase: el atributo saca la celda del tabulador y del
     lector de pantalla a la vez, que es lo que hace falta. Esconderla es cosa
     de la hoja del navegador, que ya le da `display:none` a todo lo que lleve
     `hidden`; css/luque.css repite la regla como blindaje —el porqué está
     escrito allí, sobre `.hoja-celda[hidden]`— y no porque hoy haga falta. */
  function filtrar(contenedor, categoria) {
    var celdas = contenedor.querySelectorAll('li.hoja-celda');
    for (var i = 0; i < celdas.length; i++) {
      celdas[i].hidden = !(categoria === null || celdas[i].dataset.cat === categoria);
    }
  }

  /* ----------------------------------------------------------------
     EL HERO FUNDIDO
     El amarillo con LUQUE! que hay antes de la rejilla. Se va al deslizar
     hacia arriba, sin botón, y no vuelve.
     ---------------------------------------------------------------- */

  /* Cuánto se espera antes de quitar el nodo. No tiene que CASAR con la
     transición de `.hoja-hero` en css/luque.css: tiene que ser mayor o igual,
     que no es lo mismo. Si fuera menor, el nodo desaparecería de golpe a mitad
     del fundido. Hoy la rama normal dura exactamente estos 380ms y la de
     movimiento reducido baja a 200, así que las dos caben. El porqué está
     desarrollado en el CSS, sobre `.hoja-hero`. */
  var SALIDA_MS = 380;

  var ido = false;

  /* Cuál de las llamadas a `entrada()` es la vigente. En producción sólo hay
     una y esto sobra; en la suite hay muchas seguidas, y sin este número las
     de antes pisarían a la de ahora. El porqué exacto está en `cerrarPuerta`. */
  var generacion = 0;

  function heroIdo() { return ido; }

  function entrada(hero, hoja, rejilla, ruta) {
    var mia = ++generacion;
    var cerrada = false;
    ido = false;

    function quitarNodo() {
      if (hero.parentNode) hero.parentNode.removeChild(hero);
    }

    /* Quien llega por un enlace a un trabajo concreto no quiere una portada:
       el enlace pedía ese trabajo y anteponerle una portada sería
       desobedecerlo. La regla ya está escrita y probada en
       `Hero.debeSaltarse` (js/hero.js); se reutiliza en vez de copiarla,
       porque dos copias de una regla es como empezó la deuda que pagó
       `js/reglas-contenido.js`. */
    if (window.Hero.debeSaltarse(ruta)) {
      ido = true;
      quitarNodo();
      return;
    }

    hoja.classList.add('con-hero');
    rejilla.setAttribute('aria-hidden', 'true');

    /* La puerta se cruza una vez.

       `cerrada` es LOCAL y `ido` es del módulo, y la diferencia sostiene el
       aislamiento entre pruebas. Cada llamada que NO se salta el hero suscribe
       un oyente de teclado en `document`, y sólo se da de baja al cruzar la
       puerta; las que salen por el `return` temprano del enlace profundo no
       llegan a suscribir ninguno. En la suite hay 19 llamadas a `entrada()`, de
       las que 17 suscriben oyente (contadas instrumentando `entrada` y
       `addEventListener` sobre la suite entera; el conteo está en el informe de
       la Tarea 4, no estimado a ojo).

       El escenario que este diseño impide: con una sola bandera compartida por
       el módulo, el oyente de una prueba anterior atendería la tecla de la
       prueba de ahora, pondría la bandera, y la entrada vigente saldría por la
       guarda sin que su propio hero se hubiera movido — la prueba pasaría en
       verde por el motivo equivocado.

       Ese fallo sólo aparece si se revierten LAS DOS piezas a la vez, y de las
       dos quien manda es `mia === generacion`: es lo que impide que una entrada
       caducada escriba en el estado del módulo, así que basta con él para que
       ningún oyente viejo toque lo que `heroIdo()` responde. `cerrada` local es
       la otra mitad: con ella cada oyente cierra sólo SU puerta, de modo que la
       entrada vigente corre su `cerrarPuerta` entera y llega a mover su hero
       aunque otro oyente se le haya adelantado.

       Quien lo fija es la prueba «la tecla cierra la puerta de ahora, no la de
       una entrada anterior», y mira el hero y la rejilla de la entrada vigente
       y NO `heroIdo()`, que acaba valiendo `true` con las dos versiones. */
    function cerrarPuerta() {
      /* Quitar esta guarda es un mutante equivalente, y no hay prueba que lo
         cace a propósito. Llamar dos veces al cuerpo tiene siete efectos, y
         seis son idempotentes por definición del API: `classList.add('fuera')`
         y `classList.remove('con-hero')` operan sobre un conjunto,
         `removeEventListener` de un oyente ya dado de baja y `removeAttribute`
         de un atributo ausente son no-ops silenciosos, y `cerrada = true` e
         `ido = true` reescriben `true` sobre `true`. El séptimo sólo programa
         un `setTimeout(quitarNodo)` de más, que se desactiva solo con la guarda
         de `parentNode` de `quitarNodo`. No queda nada observable que una
         prueba pueda fijar sin falsificar `window.setTimeout`, que sería fijar
         la implementación en vez del comportamiento.

         La guarda se queda igualmente porque expresa la invariante «la puerta
         se cruza una vez» para el próximo efecto que alguien añada aquí dentro,
         que no tiene por qué ser idempotente. */
      if (cerrada) return;
      cerrada = true;
      document.removeEventListener('keydown', alTeclado);
      if (mia === generacion) ido = true;
      hero.classList.add('fuera');
      /* Se quita al cruzar, y no sólo se pone al entrar: el CSS de la Tarea 6
         le da el significado «mientras el hero está delante, la rejilla no se
         desplaza por detrás», y dejarla puesta con el hero ya ido diría lo
         contrario de lo que pasa. */
      hoja.classList.remove('con-hero');
      rejilla.removeAttribute('aria-hidden');
      /* El nodo se QUITA, no se esconde: escondido seguiría siendo alcanzable
         con el tabulador y un lector de pantalla lo leería por detrás de una
         rejilla que ya está delante. */
      setTimeout(quitarNodo, SALIDA_MS);
    }

    /* TRES FORMAS DE CRUZAR LA PUERTA, y las tres hacen falta.
       El interruptor es el ANCHO y no el dedo (js/movil.js): por esta portada
       pasa una ventana de escritorio estrechada a 700px, con ratón y teclado y
       SIN pantalla táctil. Sin la rueda y sin el teclado, esa ventana se queda
       encerrada en el amarillo sin forma de salir. */

    /* 1. El dedo. `MovilGestos` es quien decide si un arrastre fue un
          deslizamiento: aquí no se mide nada, sólo se le pasan los puntos. */
    var gesto = window.MovilGestos.inicial();
    hero.addEventListener('pointerdown', function (e) {
      gesto = window.MovilGestos.presionar(gesto, { x: e.clientX, y: e.clientY });
    });
    hero.addEventListener('pointerup', function (e) {
      var r = window.MovilGestos.soltar(gesto, { x: e.clientX, y: e.clientY });
      gesto = r.estado;
      /* 'arriba' en MovilGestos es el DEDO subiendo (`dy < 0`), que es
         literalmente lo que pide la spec: «se va al deslizar hacia arriba». */
      if (r.intencion === 'arriba') cerrarPuerta();
    });

    /* 2. La rueda, para el ratón de una ventana estrecha. */
    hero.addEventListener('wheel', function (e) {
      if (e.deltaY > 0) cerrarPuerta();
    }, { passive: true });

    /* 3. El teclado, para quien no usa ni dedo ni ratón. Va en `document` y no
          en el hero para no depender de que el hero tenga el foco: no es un
          botón y no debe pedirlo. Se da de baja al cerrar, que es lo que
          impide que se acumulen. */
    function alTeclado(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' ||
          e.key === 'PageDown' || e.key === 'End') {
        cerrarPuerta();
      }
    }
    document.addEventListener('keydown', alTeclado);
  }

  return {
    PROPORCIONES: PROPORCIONES,
    /* Se exporta para que una prueba pueda esperar lo que dura el fundido sin
       adivinarlo, y para que el CSS mida su transición contra este número en
       vez de contra una copia suya. */
    SALIDA_MS: SALIDA_MS,
    proporcion: proporcion,
    numero: numero,
    filtrar: filtrar,
    entrada: entrada,
    heroIdo: heroIdo,
    pintar: pintar
  };
})();
