describe('Datos.establecer', function () {
  function proyectoDeFotos(id) {
    return { id: id, titulo: id, categoria: 'editorial',
             tipo: 'fotos', portada: 1,
             piezas: [{ url: 'a.jpg' }, { url: 'b.jpg' }] };
  }
  function proyectoDeVideo(id) {
    return { id: id, titulo: id, categoria: 'videoclip',
             tipo: 'video', poster: 'p.jpg', vimeo: null };
  }

  prueba('puebla PROYECTOS con lo que se le pasa', function () {
    Datos.establecer([proyectoDeFotos('a'), proyectoDeFotos('b')]);
    igual(Datos.PROYECTOS.length, 2);
  });

  prueba('resuelve portadaUrl a partir del índice de portada', function () {
    Datos.establecer([proyectoDeFotos('a')]);
    igual(Datos.PROYECTOS[0].portadaUrl, 'b.jpg');
  });

  prueba('en un proyecto de vídeo, portadaUrl es el poster', function () {
    Datos.establecer([proyectoDeVideo('humo')]);
    igual(Datos.PROYECTOS[0].portadaUrl, 'p.jpg');
  });

  prueba('una llamada posterior reemplaza a la anterior, no se acumula', function () {
    Datos.establecer([proyectoDeFotos('a'), proyectoDeFotos('b')]);
    Datos.establecer([proyectoDeFotos('c')]);
    igual(Datos.PROYECTOS.length, 1);
    igual(Datos.PROYECTOS[0].id, 'c');
  });

  prueba('porId y porCategoria trabajan sobre lo último establecido', function () {
    Datos.establecer([proyectoDeFotos('unico')]);
    igual(Datos.porId('unico').id, 'unico');
    igual(Datos.porCategoria('editorial').length, 1);
    igual(Datos.porId('no-existe'), null);
  });
});
