describe('Imagenes.caber', function () {
  /* Por el LADO LARGO, no por el alto: una foto apaisada y una vertical caben
     las dos en su cota, y ninguna se deforma. Criterio de aceptación 7. */
  prueba('una vertical se mide por su alto', function () {
    igual(Imagenes.caber(2000, 4000, 1000), { ancho: 500, alto: 1000 });
  });

  prueba('una apaisada se mide por su ancho', function () {
    igual(Imagenes.caber(4000, 2000, 1000), { ancho: 1000, alto: 500 });
  });

  prueba('una cuadrada cabe justa', function () {
    igual(Imagenes.caber(3000, 3000, 1000), { ancho: 1000, alto: 1000 });
  });

  /* Ampliar sería inventar píxeles: una miniatura subida por error saldría
     borrosa y pesando más que el original. */
  prueba('lo que ya cabe no se toca', function () {
    igual(Imagenes.caber(400, 300, 1000), { ancho: 400, alto: 300 });
  });

  /* Un canvas de 0 px lanza en varios navegadores, y una foto muy apaisada
     —un panorama de 8000x120 reducido a 250— da exactamente eso al redondear
     hacia abajo. El lado corto se queda en 1, que es feo pero es una imagen. */
  prueba('ningún lado baja de un píxel', function () {
    igual(Imagenes.caber(8000, 120, 250), { ancho: 250, alto: 4 });
    igual(Imagenes.caber(8000, 10, 250), { ancho: 250, alto: 1 });
  });

  prueba('medidas imposibles no devuelven NaN', function () {
    igual(Imagenes.caber(0, 0, 1000), { ancho: 1, alto: 1 });
  });
});

describe('Imagenes.MEDIDAS', function () {
  /* Las mismas tres de herramientas/derivar_imagenes.py. Lo que sube el panel
     tiene que ser indistinguible de lo que subió el script: si no, la web
     tendría dos clases de fotografía según quién la puso. */
  prueba('son las tres del script, con su sufijo', function () {
    igual(Imagenes.MEDIDAS, [
      { nombre: 'portada',   cota: 1500, sufijo: '1500' },
      { nombre: 'pieza',     cota: 3000, sufijo: '3000' },
      { nombre: 'miniatura', cota: 250,  sufijo: '250' }
    ]);
  });

  prueba('la calidad es la del script', function () {
    igual(Imagenes.CALIDAD, 0.82);
  });
});

/* `reducir` necesita el navegador de verdad: createImageBitmap y toBlob. Se le
   da un PNG de 4x2 en un data: URI, que para esta función es una fotografía
   como cualquier otra. */
describeAsync('Imagenes.reducir', function () {
  /* 4x2 rojo. Apaisado a propósito: así la reducción tiene que elegir el
     ancho como lado largo, y una implementación que mirase siempre el alto
     daría medidas distintas. */
  var PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGP4z8AARwzIHABvqgf5gNwAKAAAAABJRU5ErkJggg==';

  function comoArchivo() {
    return fetch(PNG).then(function (r) { return r.blob(); });
  }

  function reducido(cota) {
    return comoArchivo().then(function (blob) {
      return new Promise(function (ok, mal) {
        Imagenes.reducir(blob, cota, function (salida, error) {
          if (error) return mal(new Error(error));
          ok(salida);
        });
      });
    });
  }

  /* Se mide el resultado volviendo a decodificarlo: comprobar que `reducir`
     llamó a toBlob con los números correctos sería probar el doble. */
  function medir(blob) {
    return createImageBitmap(blob).then(function (mapa) {
      return { ancho: mapa.width, alto: mapa.height };
    });
  }

  return reducido(2).then(function (salida) {
    prueba('devuelve un JPEG', function () {
      igual(salida.type, 'image/jpeg');
    });
    return medir(salida);
  }).then(function (medida) {
    prueba('reduce por el lado largo y conserva la proporción', function () {
      igual(medida, { ancho: 2, alto: 1 });
    });
    return reducido(100);
  }).then(medir).then(function (medida) {
    prueba('una foto que ya cabe no se amplía', function () {
      igual(medida, { ancho: 4, alto: 2 });
    });
  }).then(function () {
    return new Promise(function (ok) {
      /* Un archivo que no es una imagen tiene que salir por el camino del
         error y en castellano, no como excepción suelta: quien sube diez
         fotos y una está corrupta necesita saber cuál. */
      Imagenes.reducir(new Blob(['esto no es una foto']), 100, function (salida, error) {
        prueba('un archivo que no es imagen da error en castellano', function () {
          igual(salida, null);
          cierto(error && error.indexOf('imagen') !== -1, 'decía: ' + error);
        });
        ok();
      });
    });
  });
});
