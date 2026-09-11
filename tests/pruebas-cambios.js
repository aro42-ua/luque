describe('Cambios.entre', function () {
  function p(id, extra) {
    var base = { id: id, titulo: id, categoria: 'editorial', tipo: 'fotos',
                 ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/' + id + '-1500.jpg',
                 piezas: [{ url: '/img/' + id + '-3000.jpg' }] };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }
  function con(lista) { return { version: 1, proyectos: lista }; }

  prueba('sin diferencias no hay nada que publicar', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), con([p('a'), p('b')]));
    igual(r.hay, false);
    igual([r.nuevos, r.retirados, r.tocados, r.movidos], [[], [], [], []]);
  });

  prueba('un proyecto que sólo está en el borrador es nuevo', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), con([p('a')]));
    igual(r.nuevos, ['b']);
    igual(r.hay, true);
  });

  /* Criterio de aceptación 3: borrar un proyecto en el panel no lo quita de la
     web hasta que se publica. Aquí es donde eso se le enseña a quien publica,
     antes de que ocurra. */
  prueba('un proyecto que sólo está publicado se retira', function () {
    igual(Cambios.entre(con([p('a')]), con([p('a'), p('b')])).retirados, ['b']);
  });

  prueba('un proyecto con la ficha cambiada está tocado', function () {
    var r = Cambios.entre(con([p('a', { ficha: { anio: 2026, papel: 'DoP' } })]), con([p('a')]));
    igual(r.tocados, ['a']);
    igual(r.nuevos, []);
  });

  prueba('cambiar las fotos también es tocarlo', function () {
    var r = Cambios.entre(
      con([p('a', { piezas: [{ url: '/img/a-3000.jpg' }, { url: '/img/z-3000.jpg' }] })]),
      con([p('a')]));
    igual(r.tocados, ['a']);
  });

  /* Reordenar la lista ES recomponer la galería: el orden de la lista es lo
     que js/composicion.js convierte en la posición de cada proyecto en el
     lienzo. Un cambio de orden cambia la web aunque ningún proyecto cambie,
     y no decirlo sería esconder justo el cambio más visible. */
  prueba('cambiar el orden se cuenta aparte, y cuenta', function () {
    var r = Cambios.entre(con([p('b'), p('a')]), con([p('a'), p('b')]));
    igual(r.movidos, ['b', 'a']);
    igual(r.tocados, []);
    igual(r.hay, true);
  });

  /* Un proyecto nuevo desplaza a los de detrás, y eso NO es haberlos movido:
     decir «has movido seis proyectos» por haber añadido uno al principio
     convertiría el resumen en ruido. Sólo cuenta el orden relativo de los que
     están en los dos sitios. */
  prueba('añadir uno delante no cuenta como mover a los demás', function () {
    var r = Cambios.entre(con([p('z'), p('a'), p('b')]), con([p('a'), p('b')]));
    igual(r.nuevos, ['z']);
    igual(r.movidos, []);
  });

  prueba('publicar por primera vez es todo nuevo', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), null);
    igual(r.nuevos, ['a', 'b']);
    igual(r.retirados, []);
    igual(r.hay, true);
  });

  /* Un contenido.json que no carga no puede hacer que el panel diga «no hay
     cambios»: eso invitaría a no publicar justo cuando la web está vacía. */
  prueba('un publicado mal formado se trata como vacío', function () {
    igual(Cambios.entre(con([p('a')]), { proyectos: 'esto no es una lista' }).nuevos, ['a']);
    igual(Cambios.entre(con([p('a')]), {}).nuevos, ['a']);
  });

  prueba('un borrador vacío retira todo', function () {
    var r = Cambios.entre(con([]), con([p('a')]));
    igual(r.retirados, ['a']);
    igual(r.hay, true);
  });

  /* La versión sube en cada guardado, así que siempre difiere de la
     publicada. Si contara como cambio, `hay` sería true siempre y el resumen
     no distinguiría nada. */
  prueba('la versión no es un cambio de contenido', function () {
    var a = con([p('a')]); a.version = 9;
    var b = con([p('a')]); b.version = 2;
    igual(Cambios.entre(a, b).hay, false);
  });

  /* `actualizado` es una marca de tiempo del modelo de datos: cambia sola y
     no se ve en la web. */
  prueba('la fecha de actualización tampoco', function () {
    var a = con([p('a')]); a.actualizado = '2026-09-11T10:00:00Z';
    var b = con([p('a')]); b.actualizado = '2026-01-01T10:00:00Z';
    igual(Cambios.entre(a, b).hay, false);
  });

  /* JSON.stringify respeta el orden de inserción, así que sin ordenar las
     claves el mismo proyecto escrito en otro orden saldría como cambiado.
     Pasa de verdad: la pantalla de un proyecto reconstruye la ficha en su
     propio orden cada vez que se escribe en ella. */
  prueba('el mismo proyecto con las claves en otro orden no está tocado', function () {
    var uno = { id: 'a', titulo: 'a', categoria: 'editorial', tipo: 'fotos',
                ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/a-1500.jpg',
                piezas: [{ url: '/img/a-3000.jpg' }] };
    var otro = { piezas: [{ url: '/img/a-3000.jpg' }], portada: '/img/a-1500.jpg',
                 ficha: { papel: 'DoP', anio: 2025 }, tipo: 'fotos',
                 categoria: 'editorial', titulo: 'a', id: 'a' };
    igual(Cambios.entre(con([uno]), con([otro])).tocados, []);
  });
});

describe('Cambios.resumir', function () {
  prueba('sin cambios lo dice con todas las letras', function () {
    igual(Cambios.resumir({ nuevos: [], retirados: [], tocados: [], movidos: [], hay: false }),
          'No hay ningún cambio pendiente de publicar.');
  });

  prueba('nombra los proyectos, no los cuenta', function () {
    var texto = Cambios.resumir({ nuevos: ['bruma'], retirados: ['arena'],
                                  tocados: ['niebla'], movidos: [], hay: true });
    cierto(texto.indexOf('bruma') !== -1, texto);
    cierto(texto.indexOf('arena') !== -1, texto);
    cierto(texto.indexOf('niebla') !== -1, texto);
  });

  /* Una lista vacía no se menciona: «se retiran: (ninguno)» es ruido en la
     única pantalla donde hay que leer con atención. */
  prueba('lo que no cambia no se menciona', function () {
    var texto = Cambios.resumir({ nuevos: ['bruma'], retirados: [], tocados: [],
                                  movidos: [], hay: true });
    igual(texto.indexOf('retir'), -1, texto);
  });
});
