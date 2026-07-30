describe('validarDatos', function () {
  var CATS = ['foto-stills', 'editorial'];

  function base(extra) {
    var p = { id: 'uno', titulo: 'Uno', categoria: 'editorial', portada: 'a.jpg',
              piezas: ['a.jpg'], pos: { x: 1, y: 1, w: 10 } };
    for (var k in extra) p[k] = extra[k];
    return p;
  }

  prueba('un proyecto correcto no da problemas', function () {
    igual(Datos.validarDatos([base()], CATS), []);
  });

  prueba('detecta identificadores duplicados', function () {
    var r = Datos.validarDatos([base(), base()], CATS);
    igual(r.length, 1);
    cierto(r[0].indexOf('duplicado') !== -1, 'debería mencionar el duplicado');
  });

  prueba('detecta un id que choca con una categoría', function () {
    var r = Datos.validarDatos([base({ id: 'editorial' })], CATS);
    cierto(r[0].indexOf('choca') !== -1, 'debería avisar del choque');
  });

  prueba('detecta una categoría desconocida', function () {
    var r = Datos.validarDatos([base({ categoria: 'boda' })], CATS);
    cierto(r[0].indexOf('desconocida') !== -1, 'debería avisar de la categoría');
  });

  prueba('detecta piezas y video a la vez', function () {
    var r = Datos.validarDatos([base({ video: { src: 'v.mp4' } })], CATS);
    cierto(r[0].indexOf('a la vez') !== -1, 'debería avisar del conflicto');
  });

  prueba('detecta un proyecto sin piezas ni video', function () {
    var p = base();
    delete p.piezas;
    var r = Datos.validarDatos([p], CATS);
    cierto(r[0].indexOf('sin piezas') !== -1, 'debería avisar de que está vacío');
  });
});

describe('Los datos reales', function () {
  prueba('no tienen ningún problema', function () {
    igual(Datos.validarDatos(Datos.PROYECTOS, Datos.CATEGORIAS), []);
  });

  prueba('hay doce proyectos', function () {
    igual(Datos.PROYECTOS.length, 12);
  });

  prueba('hay tres por categoría', function () {
    Datos.CATEGORIAS.forEach(function (c) {
      igual(Datos.porCategoria(c).length, 3, c);
    });
  });

  prueba('porId encuentra y devuelve null si no existe', function () {
    igual(Datos.porId(Datos.PROYECTOS[0].id).id, Datos.PROYECTOS[0].id);
    igual(Datos.porId('no-existe'), null);
  });
});
