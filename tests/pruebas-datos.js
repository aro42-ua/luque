describe('Datos.establecer', function () {
  function proyectoDeFotos(id) {
    return { id: id, titulo: id, categoria: 'editorial',
             tipo: 'fotos', portada: 'portada.jpg',
             piezas: [{ url: 'a.jpg', miniatura: 'a-min.jpg' },
                      { url: 'b.jpg', miniatura: 'b-min.jpg' }] };
  }
  function proyectoDeVideo(id) {
    return { id: id, titulo: id, categoria: 'videoclip',
             tipo: 'video', poster: 'p.jpg', vimeo: null };
  }

  /* La lista de categorías estuvo copiada en datos.js y en el Worker. Ahora la
     custodia reglas-contenido.js, que es el archivo que usan los dos lados: si
     divergieran, el Worker rechazaría con 422 contenido que el navegador da por
     bueno. Se comprueba la identidad y no el contenido, porque dos copias con
     el mismo contenido es exactamente el estado que esto viene a impedir. */
  prueba('CATEGORIAS es la lista de ReglasContenido, no una copia', function () {
    cierto(Datos.CATEGORIAS === ReglasContenido.CATEGORIAS,
           'Datos.CATEGORIAS tiene que ser la misma lista que usa el Worker');
    igual(Datos.CATEGORIAS, ['foto-stills', 'editorial', 'videoclip', 'cortometraje']);
  });

  prueba('puebla PROYECTOS con lo que se le pasa', function () {
    Datos.establecer([proyectoDeFotos('a'), proyectoDeFotos('b')]);
    igual(Datos.PROYECTOS.length, 2);
  });

  /* La portada tiene imagen propia, más ligera: no es ninguna de las piezas,
     que se reservan a tamaño completo para el visor. */
  prueba('portadaUrl es la portada, no una pieza', function () {
    Datos.establecer([proyectoDeFotos('a')]);
    igual(Datos.PROYECTOS[0].portadaUrl, 'portada.jpg');
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
    /* Identidad estricta y no `igual`: «no hay proyecto» es un contrato de
       identidad, no de cómo se serializa. `igual` ya distingue el NaN del
       null desde que arnes.js lleva su `replacer`, así que aquí valdría; se
       deja en `===` porque es lo que la función promete, literalmente. */
    cierto(Datos.porId('no-existe') === null,
           'porId de un id que no existe tiene que dar null exacto');
  });

  function proyectoValido(extra) {
    var p = {
      id: 'x', titulo: 'X', categoria: 'editorial', tipo: 'fotos',
      portada: '/img/x-1500.jpg',
      piezas: [{ url: '/img/x-3000.jpg' }],
      ficha: { cliente: 'C', anio: 2026, papel: 'DoP' }
    };
    if (extra) { for (var k in extra) p.ficha[k] = extra[k]; }
    return { proyectos: [p] };
  }

  prueba('una ficha con cliente, ano y papel vale', function () {
    igual(ReglasContenido.validar(
      proyectoValido(), ReglasContenido.CATEGORIAS).length, 0);
  });

  /* El papel es lo que la artista eligio contar de su trabajo: si falta, la
     ficha no dice nada del proyecto. */
  prueba('sin papel no vale', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.papel;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });

  prueba('sin ano tampoco', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.anio;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });

  /* Conejita Playboy no trae cliente, y es contenido legitimo: sale como
     ###### en la ficha, no como un error de publicacion. */
  prueba('sin cliente SI vale: sale como ###### y no es un fallo', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha.cliente;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 0);
  });

  /* El enlace es un control, no un dato: la ficha base no lo trae y vale
     (lo prueba la primera comprobacion de este bloque), y anadirlo tampoco
     puede invalidarla. Esta comprueba el segundo caso, que es el nuevo. */
  prueba('con enlace tambien vale: es un control, no un dato', function () {
    igual(ReglasContenido.validar(
      proyectoValido({ enlace: 'https://vimeo.com/1' }),
      ReglasContenido.CATEGORIAS).length, 0);
  });

  /* Sin la ficha entera no se puede pintar nada, y `p.ficha.papel` lanzaria. */
  prueba('sin ficha no vale, y no revienta la validacion', function () {
    var d = proyectoValido();
    delete d.proyectos[0].ficha;
    igual(ReglasContenido.validar(d, ReglasContenido.CATEGORIAS).length, 1);
  });
});
