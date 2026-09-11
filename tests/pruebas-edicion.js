describe('Edicion.portadaDe', function () {
  prueba('usa la portada guardada si la pieza la trae', function () {
    igual(Edicion.portadaDe({ url: '/img/x-3000.jpg', portada: '/img/otra-1500.jpg' }),
          '/img/otra-1500.jpg');
  });

  /* Las 65 piezas del contenido real son {url, miniatura} y nada más: se
     subieron con herramientas/derivar_imagenes.py, antes de que el panel
     supiera subir. Para ellas la portada se deduce del sufijo. */
  prueba('deduce el -1500 del -3000 en las piezas antiguas', function () {
    igual(Edicion.portadaDe({ url: '/img/editorial-la-boquerona-esta-portada-3000.jpg' }),
          '/img/editorial-la-boquerona-esta-portada-1500.jpg');
  });

  /* Sólo el sufijo final, y sólo si está: un «-3000» en medio del nombre es
     parte del nombre, no la medida. */
  prueba('sólo sustituye el sufijo del final', function () {
    igual(Edicion.portadaDe({ url: '/img/serie-3000-metros-3000.jpg' }),
          '/img/serie-3000-metros-1500.jpg');
  });

  prueba('sin nada de donde deducir, devuelve null', function () {
    igual(Edicion.portadaDe({ url: '/img/suelta.jpg' }), null);
    igual(Edicion.portadaDe(null), null);
  });
});

describe('Edicion.indiceDePortada', function () {
  function proyecto() {
    return { portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }] };
  }

  prueba('encuentra la pieza que es la portada', function () {
    igual(Edicion.indiceDePortada(proyecto()), 1);
  });

  prueba('una portada que no es de ninguna pieza da -1', function () {
    igual(Edicion.indiceDePortada({ portada: '/img/z-1500.jpg', piezas: [] }), -1);
  });

  prueba('sin portada da -1', function () {
    igual(Edicion.indiceDePortada({ piezas: [{ url: '/img/a-3000.jpg' }] }), -1);
  });
});

describe('Edicion.mover', function () {
  function proyecto() {
    return { portada: '/img/c-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }, { url: '/img/c-3000.jpg' }] };
  }

  prueba('cambia el orden de las piezas', function () {
    igual(Edicion.mover(proyecto(), 2, 0).piezas.map(function (p) { return p.url; }),
          ['/img/c-3000.jpg', '/img/a-3000.jpg', '/img/b-3000.jpg']);
  });

  /* Mover no es elegir: la portada sigue siendo la misma fotografía aunque
     ahora esté en otro sitio. */
  prueba('la portada sigue siendo la misma foto', function () {
    igual(Edicion.mover(proyecto(), 2, 0).portada, '/img/c-1500.jpg');
  });

  prueba('no toca el proyecto que recibe', function () {
    var p = proyecto();
    Edicion.mover(p, 2, 0);
    igual(p.piezas[0].url, '/img/a-3000.jpg');
  });
});

describe('Edicion.quitar', function () {
  function proyecto() {
    return { portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }, { url: '/img/c-3000.jpg' }] };
  }

  prueba('quita la pieza que se le dice', function () {
    igual(Edicion.quitar(proyecto(), 0).piezas.map(function (p) { return p.url; }),
          ['/img/b-3000.jpg', '/img/c-3000.jpg']);
  });

  prueba('quitar otra no toca la portada', function () {
    igual(Edicion.quitar(proyecto(), 0).portada, '/img/b-1500.jpg');
  });

  /* El fallo que este módulo existe para impedir: sin recalcular, el proyecto
     se queda con una portada que ya no es de ninguna pieza. `validar` la da
     por buena —sólo mira que haya portada— y la web enseña una foto que el
     visor ya no tiene. */
  prueba('quitar la portada la pasa a la primera que quede', function () {
    igual(Edicion.quitar(proyecto(), 1).portada, '/img/a-1500.jpg');
  });

  prueba('quitar la última pieza deja el proyecto sin portada', function () {
    var uno = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    var r = Edicion.quitar(uno, 0);
    igual(r.piezas, []);
    igual(r.portada, null);
  });

  prueba('un índice que no existe no cambia nada', function () {
    igual(Edicion.quitar(proyecto(), 9).piezas.length, 3);
    igual(Edicion.quitar(proyecto(), -1).piezas.length, 3);
  });

  prueba('no toca el proyecto que recibe', function () {
    var p = proyecto();
    Edicion.quitar(p, 1);
    igual(p.piezas.length, 3);
  });
});

describe('Edicion.marcarPortada', function () {
  function proyecto() {
    return { portada: '/img/a-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' },
      { url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }] };
  }

  prueba('la portada pasa a ser la de esa pieza', function () {
    igual(Edicion.marcarPortada(proyecto(), 1).portada, '/img/b-1500.jpg');
  });

  prueba('un índice que no existe no cambia nada', function () {
    igual(Edicion.marcarPortada(proyecto(), 9).portada, '/img/a-1500.jpg');
  });

  /* Una pieza de la que no se puede sacar portada no se puede marcar: dejar
     `portada: null` haría impublicable el proyecto sin decir por qué. */
  prueba('una pieza sin portada deducible no se marca', function () {
    var raro = { portada: '/img/a-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/suelta.jpg' }] };
    igual(Edicion.marcarPortada(raro, 1).portada, '/img/a-1500.jpg');
  });
});

describe('Edicion.anadir', function () {
  prueba('añade al final', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, [{ url: '/img/b-3000.jpg' }]).piezas.length, 2);
  });

  /* La primera foto de un proyecto recién creado es su portada sin que nadie
     lo pida: un proyecto sin portada no se publica, y pedir un clic más para
     algo que no tiene alternativa sería un trámite. */
  prueba('la primera foto de un proyecto vacío se hace portada', function () {
    var p = { portada: null, piezas: [] };
    var r = Edicion.anadir(p, [{ url: '/img/a-3000.jpg', portada: '/img/a-1500.jpg' },
                               { url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }]);
    igual(r.portada, '/img/a-1500.jpg');
  });

  prueba('si ya había portada, no se cambia', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, [{ url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }]).portada,
          '/img/a-1500.jpg');
  });

  prueba('añadir nada no cambia nada', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, []).piezas.length, 1);
  });
});
