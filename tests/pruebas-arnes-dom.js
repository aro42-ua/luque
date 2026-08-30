describe('ArnesDom.conElemento', function () {

  prueba('pasa a fn el primer elemento del html', function () {
    var etiqueta = ArnesDom.conElemento('<ol id="x"></ol>', function (el) {
      return el.tagName;
    });
    igual(etiqueta, 'OL');
  });

  /* Los nodos de prueba tienen que estar DENTRO del documento, no sueltos:
     focus() no hace nada sobre un nodo desconectado y getBoundingClientRect()
     devuelve ceros. panel.js devuelve el foco tras repintar y lista.js mide la
     caja de la fila para decidir si se suelta antes o después, así que un nodo
     suelto daría verde sin comprobar nada de eso. */
  prueba('el elemento está conectado al documento mientras corre fn', function () {
    var conectado = ArnesDom.conElemento('<ol></ol>', function (el) {
      return document.contains(el);
    });
    cierto(conectado, 'sin esto, focus() y las medidas no funcionan');
  });

  prueba('tiene medidas reales, no ceros', function () {
    var ancho = ArnesDom.conElemento('<ol style="width:120px"></ol>', function (el) {
      return el.getBoundingClientRect().width;
    });
    cierto(ancho > 0, 'un nodo suelto mediría 0 y las pruebas de arrastre serían falsas');
  });

  prueba('se puede enfocar un botón de dentro', function () {
    var enfocado = ArnesDom.conElemento('<div><button id="b">x</button></div>', function (el) {
      var b = el.querySelector('#b');
      b.focus();
      return document.activeElement === b;
    });
    cierto(enfocado, 'sin esto no se puede probar la vuelta del foco de panel.js');
  });

  prueba('quita el contenedor al terminar', function () {
    ArnesDom.conElemento('<ol class="rastro"></ol>', function () {});
    igual(document.querySelectorAll('.rastro').length, 0);
  });

  /* La limpieza en `finally` es lo que impide que una prueba que falla deje
     basura en el documento y contamine a las siguientes. Se comprueba el
     mensaje del error, no sólo que "algo" se lanzó: un try/catch que atrapa
     cualquier error pasaría igual con ArnesDom sin definir, porque el
     ReferenceError también cae en el catch y el nodo cuya ausencia se mide
     nunca llegó a crearse. */
  prueba('quita el contenedor aunque fn lance', function () {
    var capturado = null;
    try {
      ArnesDom.conElemento('<ol class="rastro2"></ol>', function () {
        throw new Error('a propósito');
      });
    } catch (e) { capturado = e; }
    cierto(capturado !== null, 'el error tiene que propagarse, no tragarse');
    igual(capturado.message, 'a propósito');
    igual(document.querySelectorAll('.rastro2').length, 0);
  });

  prueba('devuelve lo que devuelve fn', function () {
    igual(ArnesDom.conElemento('<ol></ol>', function () { return 42; }), 42);
  });

  /* conElemento limpia el contenedor en cuanto fn RETORNA. Si fn devolviera
     una promesa, el nodo ya estaría desconectado cuando esa promesa
     resolviera, y getBoundingClientRect()/focus() dejarían de funcionar
     sobre él en silencio —los dos fallos exactos que este arnés existe para
     impedir—. Se elige lanzar en vez de esperar, para que conElemento siga
     siendo el nivel barato y síncrono; ver el comentario de arnes-dom.js. */
  prueba('lanza si fn devuelve una promesa, en vez de dejarla resolver sobre un nodo ya desconectado', function () {
    var capturado = null;
    try {
      ArnesDom.conElemento('<ol class="rastro3"></ol>', function () {
        return new Promise(function (ok) { ok(1); });
      });
    } catch (e) { capturado = e; }
    cierto(capturado !== null, 'conElemento tiene que rechazar una fn que devuelve una promesa');
    cierto(capturado.message.indexOf('conDocumento') !== -1,
           'el mensaje tiene que decir qué usar en su lugar: ' + capturado.message);
    igual(document.querySelectorAll('.rastro3').length, 0);
  });
});

/* describeAsync porque cargar scripts en un iframe es asíncrono. Ya existe en
   arnes.js: pinta el titular cuando llega el dato y el recuento final espera a
   que todas las secciones asíncronas terminen. */
describeAsync('ArnesDom.conDocumento', function () {

  var HTML = '<main><ol id="lista"></ol><button id="b">x</button></main>';

  /* Sin scripts: esto sólo comprueba que los globales llegan a la ventana del
     iframe. Que lleguen ANTES de que corra el primer script se prueba más
     abajo, con una fijación de verdad; con `scripts: []` la cadena se resuelve
     sin ejecutar nada por medio y el orden no se ejercita. */
  return ArnesDom.conDocumento({
    html: HTML,
    globales: { Testigo: { visto: false } },
    scripts: []
  }, function (w, d) {

    prueba('el html llega al documento del iframe', function () {
      cierto(d.getElementById('lista') !== null);
    });

    prueba('los globales están puestos en la ventana del iframe', function () {
      cierto(w.Testigo && w.Testigo.visto === false);
    });

    prueba('el documento del iframe no es el de las pruebas', function () {
      cierto(d !== document, 'si fueran el mismo, no habría aislamiento ninguno');
    });

  }).then(function () {

    /* La que más importa, y la única que ejercita el orden: la fijación lee
       `Testigo` durante su propia carga, igual que panel.js llama a
       Borrador.cargar() en la suya. Si los globales se inyectaran después de
       cargar los scripts, la fijación no encontraría nada que marcar y esto se
       pondría en rojo. */
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Testigo: { visto: false } },
      scripts: ['fijaciones/lee-global-al-cargar.js']
    }, function (w) {

      prueba('los globales están puestos ANTES de que corra el primer script', function () {
        cierto(!w.fijacionSeEjecutoSinGlobal,
          'la fijación corrió sin Testigo: los globales se inyectaron tarde');
        cierto(w.Testigo.visto === true,
          'la fijación no llegó a marcar Testigo durante su carga');
      });

    });

  }).then(function () {

    /* «quita el iframe al terminar» comprobaba antes un recuento global de
       `.arnes-dom-caja` en todo el documento. Desde que pruebas-panel.js abre
       diez iframes propios de forma asíncrona, esa cuenta ve basura ajena —el
       iframe de otra sección, que sigue abierto en ese instante— y sale en
       rojo por turnos, entre 0 y 2 fallos según el orden de ejecución.

       Se captura el nodo exacto que crea ESTA llamada —`w.frameElement` es el
       <iframe> y su padre es la «caja» que `conDocumento` añade al
       documento— y se comprueba que ESE nodo, no «ningún nodo en la
       página», desapareció. Es más estricta, no menos: identifica el nodo en
       vez de confiar en un recuento agregado que otra sección puede alterar. */
    var laCaja;
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Marca: 1 },
      scripts: []
    }, function (w) {
      laCaja = w.frameElement.parentNode;
      return true;
    }).then(function (r) {
      prueba('quita el iframe al terminar', function () {
        cierto(!document.contains(laCaja), 'la caja de este iframe seguía en el documento');
      });
      return r;
    });

  }).then(function () {

    prueba('no contamina la ventana de las pruebas', function () {
      igual(typeof window.Testigo, 'undefined');
      igual(typeof window.Marca, 'undefined');
    });

    /* Si un script no carga, el error tiene que decir qué hacer. El caso real
       es abrir test.html con doble clic: bajo file:// puede que el navegador
       no deje al iframe cargar scripts, y sin este mensaje el fallo parecería
       un error del código que se está probando. */

    /* Aquí `fn` nunca llega a ejecutarse —el script falla antes de que se
       llame—, así que no hay manera de capturar la caja desde dentro como
       arriba. `conDocumento` crea la caja y el <iframe> de forma síncrona, al
       principio, antes de cualquier operación asíncrona (ver
       tests/arnes-dom.js): capturar el nodo justo después de llamar, en el
       mismo turno de JS y sin ningún `await`/`.then` de por medio, es seguro
       aunque otras secciones tengan iframes propios abiertos a la vez —nada
       puede colarse entre estas dos líneas—. */
    var antesDeLlamar = document.querySelectorAll('.arnes-dom-caja').length;
    var promesaError = ArnesDom.conDocumento({
      html: HTML, globales: {}, scripts: ['no-existe-a-proposito.js']
    }, function () { return 'no debería llegar aquí'; });
    var todasTrasLlamar = document.querySelectorAll('.arnes-dom-caja');
    var cajaDelError = todasTrasLlamar.length === antesDeLlamar + 1
      ? todasTrasLlamar[todasTrasLlamar.length - 1] : null;

    return promesaError
      .then(function (r) {
        prueba('un script que no carga es un error', function () {
          cierto(false, 'tenía que haber fallado y devolvió ' + r);
        });
      }, function (e) {
        prueba('un script que no carga da un error que nombra el archivo', function () {
          cierto(e.message.indexOf('no-existe-a-proposito.js') !== -1, e.message);
        });
        prueba('y sugiere el servidor, que es la causa probable', function () {
          cierto(e.message.toLowerCase().indexOf('servidor') !== -1, e.message);
        });
        prueba('y limpia el iframe aunque haya fallado', function () {
          cierto(cajaDelError !== null, 'no se pudo identificar la caja de esta llamada');
          cierto(!document.contains(cajaDelError), 'la caja de este iframe seguía en el documento');
        });
      });
  });
});
