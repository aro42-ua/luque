/* Segundo arnés, para lo que toca el DOM. El de al lado (`arnes.js`) prueba
   funciones puras; éste da el terreno donde ejercitar código que construye
   nodos, mueve el foco y mide cajas.

   Dos niveles porque son dos problemas distintos:
     - `conElemento`, para lo que recibe su contenedor como parámetro
       —`Lista.pintar(contenedor, …)`—, que se prueba con un nodo y ya está.
     - `conDocumento`, para lo que no expone nada y se ejecuta al cargarse
       —`panel/js/panel.js` es una IIFE que llama a init() en su última línea—,
       que hay que cargar dentro de un iframe con sus dependencias ya puestas. */
window.ArnesDom = (function () {

  /* El contenedor va DENTRO del documento, no suelto: focus() no hace nada
     sobre un nodo desconectado y getBoundingClientRect() devuelve ceros. Se
     esconde moviéndolo fuera de la pantalla y NO con display:none, que sí
     rompería el foco y las medidas —que es justo lo que venimos a probar—. */
  function caja() {
    var c = document.createElement('div');
    c.className = 'arnes-dom-caja';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:400px';
    document.body.appendChild(c);
    return c;
  }

  function esThenable(v) {
    return v && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function';
  }

  function conElemento(html, fn) {
    var c = caja();
    c.innerHTML = html;
    /* finally y no un remove() al final: si fn lanza, el contenedor tiene que
       desaparecer igual. Si no, una prueba en rojo deja basura en el documento
       y las siguientes empiezan sucias, que es peor que el fallo original.

       El removeChild va con guarda, no a pelo: si fn ya movió o quitó el
       contenedor, un removeChild sin comprobar lanzaría un TypeError que
       taparía el error de verdad que venía de fn. */
    try {
      var r = fn(c.firstElementChild, c);
      /* Se lanza si fn devuelve un thenable, en vez de esperarlo. Un
         finally limpia en cuanto fn RETORNA: si fn devolviera una promesa,
         el nodo ya estaría desconectado cuando esa promesa resolviera, y
         getBoundingClientRect()/focus() dejarían de funcionar sobre
         él —los dos fallos exactos que este arnés existe para impedir—, en
         silencio, porque la promesa "resuelve bien" aunque mida sobre un
         nodo muerto. Se elige lanzar y no esperar (que es lo que hace
         conDocumento) para que conElemento siga siendo el nivel barato:
         síncrono y sin coste de promesa, que es su razón de existir frente
         al nivel caro. El precio es que quien lo use mal con async se lleva
         un error claro en vez de un arreglo automático que además dejaría a
         quien llama sin saber si tiene que encadenar un .then() o no. */
      if (esThenable(r)) {
        throw new Error('conElemento es síncrono; fn no puede devolver una '
          + 'promesa. Si necesitas esperar, usa conDocumento o resuélvela '
          + 'dentro de fn antes de devolver.');
      }
      return r;
    } finally {
      if (c.parentNode) c.parentNode.removeChild(c);
    }
  }

  /* El iframe se escribe a mano, así que no tiene una URL propia desde la que
     resolver los `src` relativos. Se le da la carpeta de test.html, que sirve
     igual servida por http que abierta con doble clic. */
  function carpetaDeLasPruebas() {
    return new URL('.', location.href).href;
  }

  function unScript(d, src) {
    return new Promise(function (ok, mal) {
      var s = d.createElement('script');
      s.src = src;
      s.onload = function () { ok(); };
      s.onerror = function () {
        mal(new Error('El arnés no pudo cargar «' + src + '». Si has abierto '
          + 'test.html con doble clic, esta sección necesita un servidor: '
          + 'arráncalo con «python -m http.server» y abre /tests/test.html.'));
      };
      d.body.appendChild(s);
    });
  }

  function conDocumento(opciones, fn) {
    var c = caja();
    var marco = document.createElement('iframe');
    marco.style.cssText = 'width:600px;height:400px;border:0';
    c.appendChild(marco);

    function limpiar() { if (c.parentNode) c.parentNode.removeChild(c); }

    var d = marco.contentDocument;
    var w = marco.contentWindow;

    /* Este prólogo es síncrono, y antes vivía fuera de todo try: si
       marco.contentDocument saliera null —un iframe con sandbox, o algún
       navegador bajo file://—, d.open() lanzaría de forma síncrona, la caja
       se quedaría colgada en el documento y conDocumento incumpliría su
       propio contrato de devolver SIEMPRE una promesa. Quien lo llame fuera
       de un .then() se llevaría una excepción que ninguna sección
       describeAsync captura, y eso se ve como pruebas que sencillamente no
       aparecen. Ahora el prólogo también rechaza, y limpia la caja que ya se
       había creado. */
    try {
      d.open();
      d.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">'
        + '<base href="' + carpetaDeLasPruebas() + '"></head><body>'
        + (opciones.html || '') + '</body></html>');
      d.close();

      /* Antes de cargar un solo script: panel.js llama a Borrador.cargar() en
         su propia carga, así que un doble inyectado después llegaría tarde. */
      var globales = opciones.globales || {};
      Object.keys(globales).forEach(function (k) { w[k] = globales[k]; });
    } catch (e) {
      limpiar();
      return Promise.reject(e);
    }

    var cadena = (opciones.scripts || []).reduce(function (antes, src) {
      return antes.then(function () { return unScript(d, src); });
    }, Promise.resolve());

    /* La forma de dos argumentos y no .catch(): así el fallo de `fn` no se
       confunde con el fallo de la limpieza, y el error original se relanza tal
       cual en vez de envolverse. */
    return cadena
      .then(function () { return fn(w, d); })
      .then(function (r) { limpiar(); return r; },
            function (e) { limpiar(); throw e; });
  }

  return { conElemento: conElemento, conDocumento: conDocumento };
})();
