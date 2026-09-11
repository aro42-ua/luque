/* Reducir la fotografía ANTES de subirla. Un original ronda entre 20 y 50 MB;
   lo que sale de aquí no llega al megabyte. Así no hay procesado de imagen en
   el servidor ni subidas de 50 MB desde una conexión doméstica. */
window.Imagenes = (function () {

  /* Las mismas tres medidas y la misma calidad que
     herramientas/derivar_imagenes.py, que fue quien generó las 65 piezas del
     contenido real. Lo que suba el panel tiene que ser indistinguible de
     aquello: si no, la web tendría dos clases de fotografía según quién la
     puso. El sufijo es lo que acaba en el nombre del archivo, y es de lo que
     Edicion.portadaDe deduce la portada de las piezas antiguas. */
  var MEDIDAS = [
    { nombre: 'portada',   cota: 1500, sufijo: '1500' },
    { nombre: 'pieza',     cota: 3000, sufijo: '3000' },
    { nombre: 'miniatura', cota: 250,  sufijo: '250' }
  ];
  var CALIDAD = 0.82;

  /* La cota es del LADO LARGO, no del alto. Una foto apaisada y una vertical
     caben las dos sin deformarse, que es el criterio de aceptación 7: «la
     proporción original se conserva siempre». */
  function caber(ancho, alto, cota) {
    var a = Number(ancho) > 0 ? Number(ancho) : 1;
    var b = Number(alto) > 0 ? Number(alto) : 1;
    var largo = Math.max(a, b);
    /* Ampliar sería inventar píxeles: una foto pequeña saldría borrosa y
       pesando más que el original. */
    var factor = largo <= cota ? 1 : cota / largo;
    return {
      /* Nunca por debajo de 1: un canvas de 0 px lanza en varios navegadores,
         y un panorama de 8000x120 reducido a 250 da exactamente eso. */
      ancho: Math.max(1, Math.round(a * factor)),
      alto: Math.max(1, Math.round(b * factor))
    };
  }

  /* `imageOrientation: 'from-image'` no es un adorno: sin él, una foto hecha
     con el móvil de lado —que lleva su orientación en los metadatos EXIF y no
     en los píxeles— se sube tumbada, y el panel no tiene ninguna pantalla
     donde girarla. Con él, el mapa de bits llega ya derecho y el canvas
     escribe lo que se ve. */
  function reducir(archivo, cota, alTerminar) {
    var listo = false;
    function terminar(blob, error) {
      if (listo) return;
      listo = true;
      alTerminar(blob, error);
    }

    /* Lo que se le enseña al estudio lo escribimos nosotros, igual que en
       borrador.js: `e.message` aquí es del motor y en inglés. El detalle
       técnico se queda en el registro, que es donde sirve. */
    function fallar(que, e) {
      console.error('Imagenes: ' + que + (e && e.message ? ': ' + e.message : ''));
      terminar(null, 'no se ha podido leer «' + ((archivo && archivo.name) || 'la imagen')
        + '»: puede que no sea una imagen o que esté dañada');
    }

    var promesa;
    try {
      promesa = createImageBitmap(archivo, { imageOrientation: 'from-image' });
    } catch (e) {
      return fallar('createImageBitmap lanzó al llamarla', e);
    }

    promesa.then(function (mapa) {
      var medida = caber(mapa.width, mapa.height, cota);
      var lienzo = document.createElement('canvas');
      lienzo.width = medida.ancho;
      lienzo.height = medida.alto;
      lienzo.getContext('2d').drawImage(mapa, 0, 0, medida.ancho, medida.alto);
      /* close() libera el mapa de bits en cuanto está dibujado. Subir treinta
         fotos de 50 MB sin soltarlos deja al navegador quedándose sin memoria
         a la mitad, y eso se ve como una subida que se para sin decir nada. */
      if (mapa.close) mapa.close();
      lienzo.toBlob(function (blob) {
        if (!blob) return fallar('toBlob devolvió null', null);
        terminar(blob, null);
      }, 'image/jpeg', CALIDAD);
    }, function (e) {
      fallar('createImageBitmap rechazó', e);
    });
  }

  return { MEDIDAS: MEDIDAS, CALIDAD: CALIDAD, caber: caber, reducir: reducir };
})();
