describe('Contenido.validar', function () {
  function base() {
    return {
      version: 1,
      proyectos: [
        { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
          portada: 0, ficha: {}, piezas: [{ url: 'a.jpg' }] }
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
                       tipo: 'fotos', portada: 0, ficha: {}, piezas: [{ url: 'b.jpg' }] });
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

  prueba('la portada tiene que apuntar a una pieza que existe', function () {
    var d = base();
    d.proyectos[0].portada = 3;
    cierto(Contenido.validar(d).length > 0);
  });

  prueba('un proyecto de video necesita poster', function () {
    var d = base();
    d.proyectos[0] = { id: 'humo', titulo: 'Humo', categoria: 'videoclip',
                       tipo: 'video', ficha: {}, vimeo: null };
    cierto(Contenido.validar(d).length > 0);
  });
});
