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

  /* `medir` se pasa como argumento y no se llama a un lienzo aquí dentro. El
     motivo original era que las fotos venían de picsum y el lienzo se manchaba
     —ningún `<img>` del sitio las pedía en modo CORS—, así que la medición de
     verdad no podía ni escribirse. Eso se acabó: desde el contenido real las
     rutas de `contenido.json` son relativas (`/img/…`), o sea del mismo
     origen, y un lienzo con una imagen del mismo origen no se mancha. El
     medidor de verdad vive en `js/movil-brillo.js` desde el bloque 4g.

     La inyección se mantiene por lo que resultó ser su mejor razón: este
     módulo decide, y decidir se prueba sin navegador. El camino de
     degradación —lo que pasa cuando medir falla— se ejercita con una función
     sintética que lanza, y eso seguirá haciendo falta el día que una foto
     llegue de otro sitio.

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
