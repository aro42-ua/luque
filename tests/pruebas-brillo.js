describe('Brillo', function () {

  function siempre(v) { return function () { return v; }; }
  function lanza(mensaje) {
    return function () { throw new Error(mensaje); };
  }

  // ---- El umbral --------------------------------------------------

  prueba('una foto clara pide el tratamiento de foto clara', function () {
    igual(Brillo.tratamiento(0.9), 'claro');
  });

  prueba('una foto oscura pide el de foto oscura', function () {
    igual(Brillo.tratamiento(0.1), 'oscuro');
  });

  /* El borde exacto, en los dos lados. */
  prueba('justo en el umbral cuenta como oscuro, justo por encima como claro', function () {
    igual(Brillo.tratamiento(Brillo.UMBRAL), 'oscuro');
    igual(Brillo.tratamiento(Brillo.UMBRAL + 0.01), 'claro');
  });

  /* Con números a pelo, y no con `Brillo.UMBRAL`. La prueba de arriba sola no
     fija el valor: al escribirse contra la constante, mover el umbral de 0,5 a
     0,8 movía también la prueba y la suite seguía en verde. Comprobado con una
     mutación, no supuesto. */
  prueba('el umbral está en la mitad, y eso queda fijado aquí', function () {
    igual(Brillo.UMBRAL, 0.5);
    igual(Brillo.tratamiento(0.6), 'claro');
    igual(Brillo.tratamiento(0.4), 'oscuro');
  });

  prueba('los extremos no se salen de los dos tratamientos', function () {
    igual(Brillo.tratamiento(0), 'oscuro');
    igual(Brillo.tratamiento(1), 'claro');
  });

  // ---- La medición que sale bien ----------------------------------

  prueba('decidir usa lo que devuelve la medición', function () {
    igual(Brillo.decidir(siempre(0.9)), 'claro');
    igual(Brillo.decidir(siempre(0.1)), 'oscuro');
  });

  prueba('cuando la medición sale bien no se registra nada', function () {
    var avisos = [];
    Brillo.decidir(siempre(0.9), function (m) { avisos.push(m); });
    igual(avisos.length, 0);
  });

  // ---- La caída elegante, que es el camino que se usa HOY ----------

  /* El caso real de hoy: `getImageData` lanza una excepción de seguridad
     porque el lienzo quedó manchado por una imagen de otro origen. El módulo
     tiene que devolver el tratamiento seguro, no propagar. */
  prueba('un lienzo manchado da el halo en vez de propagar la excepción', function () {
    igual(Brillo.decidir(lanza('The operation is insecure.')), 'halo');
  });

  prueba('cualquier otro fallo de la medición también cae al halo', function () {
    igual(Brillo.decidir(lanza('lo que sea')), 'halo');
    igual(Brillo.decidir(function () { return null; }), 'halo');
    igual(Brillo.decidir(function () { return NaN; }), 'halo');
  });

  prueba('una luminancia fuera de 0..1 no se cree: cae al halo', function () {
    igual(Brillo.decidir(siempre(-0.2)), 'halo');
    igual(Brillo.decidir(siempre(1.5)), 'halo');
  });

  prueba('si no hay función de medir, cae al halo sin romperse', function () {
    igual(Brillo.decidir(null), 'halo');
    igual(Brillo.decidir(undefined), 'halo');
  });

  // ---- La contramedida obligatoria de la spec ----------------------

  /* La spec (líneas 92-95) teme que el halo se quede puesto meses en
     producción sin que nadie note que la medición nunca funcionó. El registro
     es la contramedida, y por eso se inyecta: si fuera un console.warn dentro
     del módulo no habría forma de comprobar que se llama. */
  prueba('el fallo se registra, que es la contramedida que pide la spec', function () {
    var avisos = [];
    Brillo.decidir(lanza('The operation is insecure.'), function (m) { avisos.push(m); });
    igual(avisos.length, 1, 'el fallo tiene que quedar anotado');
  });

  prueba('el registro dice qué pasó, no sólo que pasó algo', function () {
    var avisos = [];
    Brillo.decidir(lanza('The operation is insecure.'), function (m) { avisos.push(m); });
    cierto(avisos[0].indexOf('insecure') !== -1,
           'el mensaje original tiene que llegar entero: ' + avisos[0]);
    cierto(avisos[0].toLowerCase().indexOf('halo') !== -1,
           'y tiene que decir qué se hizo en su lugar: ' + avisos[0]);
  });

  prueba('una luminancia inservible también se registra', function () {
    var avisos = [];
    Brillo.decidir(siempre(NaN), function (m) { avisos.push(m); });
    igual(avisos.length, 1, 'un número que no vale es tan fallo como una excepción');
  });

  /* Registrar no puede ser obligatorio: quien llame puede no querer ruido, y
     un módulo que revienta por no recibir un argumento opcional es peor que el
     fallo que venía a tratar. */
  prueba('sin función de registro, decidir sigue funcionando', function () {
    igual(Brillo.decidir(lanza('vaya')), 'halo');
    igual(Brillo.decidir(lanza('vaya'), null), 'halo');
  });

  prueba('si el registro falla, no se lleva por delante la decisión', function () {
    igual(Brillo.decidir(lanza('vaya'), lanza('y el registro también falla')), 'halo');
  });
});
