describe('Identificador.desde', function () {
  prueba('pasa a minúsculas y une con guiones', function () {
    igual(Identificador.desde('Bruma Marina'), 'bruma-marina');
  });

  prueba('quita los acentos, porque el id va en la URL', function () {
    igual(Identificador.desde('Sesión Fotográfica'), 'sesion-fotografica');
    igual(Identificador.desde('Ñandú'), 'nandu');
  });

  prueba('descarta lo que no sea letra o número', function () {
    igual(Identificador.desde('¡Bruma! (2025) — final'), 'bruma-2025-final');
  });

  prueba('no deja guiones sueltos en los extremos ni repetidos', function () {
    igual(Identificador.desde('  --Bruma...Marina--  '), 'bruma-marina');
  });

  prueba('un título sin nada aprovechable da cadena vacía', function () {
    igual(Identificador.desde('¡¿—!?'), '');
    igual(Identificador.desde(''), '');
    igual(Identificador.desde(null), '');
  });
});

describe('Identificador.problema', function () {
  var CATS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

  prueba('un id nuevo y libre no da problema', function () {
    /* Igual que en pruebas-datos.js: «no hay problema» es null exacto, y se
       comprueba por identidad. Con `igual` a secas —antes del `replacer` de
       arnes.js— esta línea habría pasado también con un NaN o un Infinity. */
    cierto(Identificador.problema('bruma', ['arena'], CATS) === null,
           'un id libre y nuevo no da problema: null exacto');
  });

  prueba('avisa si está vacío', function () {
    cierto(Identificador.problema('', [], CATS) !== null);
  });

  prueba('avisa si ya existe', function () {
    cierto(Identificador.problema('arena', ['arena'], CATS).indexOf('arena') !== -1);
  });

  /* El enrutador da prioridad a la categoría, así que un proyecto llamado
     igual que una categoría sería inalcanzable por su URL. */
  prueba('avisa si choca con una categoría', function () {
    cierto(Identificador.problema('editorial', [], CATS) !== null);
  });
});
