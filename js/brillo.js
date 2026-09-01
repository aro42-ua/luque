window.Brillo = (function () {

  /* Luminancia de 0 (negro) a 1 (blanco). Por encima del umbral la foto es
     clara y pide esquinas oscuras; por debajo, al revés.

     Este módulo dice cómo es la FOTO, no de qué color van las esquinas. El
     color es cosa de quien pinta: si algún día el amarillo cambia de tono, no
     hay motivo para tocar esto. */
  var UMBRAL = 0.5;

  function tratamiento(luminancia) {
    return luminancia > UMBRAL ? 'claro' : 'oscuro';
  }

  function utilizable(v) {
    return typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1;
  }

  /* Avisa sin dejar que el aviso estropee nada. Si quien registra revienta, el
     fallo que se estaba tratando no puede quedar peor de lo que ya estaba. */
  function avisar(registrar, mensaje) {
    if (typeof registrar !== 'function') return;
    try { registrar(mensaje); } catch (e) { /* ni eso puede tumbar la decisión */ }
  }

  /* `medir` se pasa como argumento y no se llama a un lienzo aquí dentro, y no
     es por elegancia: medir de verdad obliga a dibujar la foto en un lienzo y
     leer el píxel, y hoy eso mancha el lienzo. No es que picsum no mande
     `Access-Control-Allow-Origin` —lo manda—: es que ningún `<img>` del sitio
     pide la foto en modo CORS (falta el atributo `crossorigin`), así que el
     navegador ni siquiera hace la petición con CORS y el lienzo queda
     manchado igual. `getImageData` lanza. Recibiendo la medición como
     función, el camino de degradación se puede ejercitar sin fotos reales,
     que es la única forma de probarlo hasta que el estudio suba las suyas.

     Devuelve 'halo' ante cualquier duda: sin medición, con una medición que
     lanza, o con un número que no sirve. El halo es feo al lado de lo
     automático y correcto siempre, que es la concesión que la spec eligió a
     propósito.

     `registrar` es la contramedida obligatoria de la spec: sin ella, el halo
     podría quedarse puesto meses en producción sin que nadie note que la
     medición nunca llegó a funcionar. */
  function decidir(medir, registrar) {
    if (typeof medir !== 'function') {
      avisar(registrar, 'Brillo: no hay forma de medir la luminancia; se usa el halo.');
      return 'halo';
    }

    var luminancia;
    try {
      luminancia = medir();
    } catch (e) {
      avisar(registrar, 'Brillo: no se pudo medir la luminancia (' + e.message
        + '); se usa el halo. Con fotos del mismo origen esto no debería pasar.');
      return 'halo';
    }

    if (!utilizable(luminancia)) {
      avisar(registrar, 'Brillo: la luminancia medida no sirve (' + luminancia
        + '); se usa el halo.');
      return 'halo';
    }

    return tratamiento(luminancia);
  }

  return { UMBRAL: UMBRAL, tratamiento: tratamiento, decidir: decidir };
})();
