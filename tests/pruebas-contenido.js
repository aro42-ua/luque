describe('Contenido.validar', function () {
  function base() {
    return {
      version: 1,
      proyectos: [
        { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
          portada: 'portada.jpg', ficha: {},
          piezas: [{ url: 'a.jpg', miniatura: 'a-min.jpg' }] }
      ]
    };
  }

  prueba('un contenido correcto no da problemas', function () {
    igual(Contenido.validar(base()), []);
  });

  prueba('exige que haya lista de proyectos', function () {
    cierto(Contenido.validar({ version: 1 }).length > 0);
    cierto(Contenido.validar(null).length > 0);
  });

  /* Una lista vacía es contenido legítimo —un estudio que aún no ha subido
     nada—, no un JSON mal formado. Quien avisa de que no hay nada que enseñar
     es index.html, con su propia frase; aquí no hay nada que reprochar. */
  prueba('una lista vacía no es un error de validación', function () {
    igual(Contenido.validar({ version: 1, proyectos: [] }), []);
  });

  prueba('detecta identificadores repetidos', function () {
    var d = base();
    d.proyectos.push({ id: 'bruma', titulo: 'Otro', categoria: 'editorial',
                       tipo: 'fotos', portada: 'otra.jpg', ficha: {}, piezas: [{ url: 'b.jpg' }] });
    cierto(Contenido.validar(d).join(' ').indexOf('bruma') !== -1);
  });

  prueba('rechaza un id que choca con una categoría', function () {
    var d = base();
    d.proyectos[0].id = 'editorial';
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('rechaza una categoría desconocida', function () {
    var d = base();
    d.proyectos[0].categoria = 'pintura';
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de fotos sin piezas es un problema', function () {
    var d = base();
    d.proyectos[0].piezas = [];
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de fotos sin portada es un problema', function () {
    var d = base();
    delete d.proyectos[0].portada;
    cierto(Contenido.validar(d).length > 0);
  });

  /* La portada es su propia imagen y no una de las piezas: la galería enseña
     doce a la vez, así que pedirlas a tamaño completo costaba once veces más. */
  prueba('la portada no tiene por qué estar entre las piezas', function () {
    igual(Contenido.validar(base()), []);
  });

  prueba('una pieza sin url es un problema', function () {
    var d = base();
    d.proyectos[0].piezas = [{ miniatura: 'solo-min.jpg' }];
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de video necesita poster', function () {
    var d = base();
    d.proyectos[0] = { id: 'humo', titulo: 'Humo', categoria: 'videoclip',
                       tipo: 'video', ficha: {}, vimeo: null };
    cierto(Contenido.validar(d).length > 0);
  });
});
