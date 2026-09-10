describe('Composicion.disponer', function () {
  prueba('devuelve una posición por proyecto', function () {
    igual(Composicion.disponer(3, 'amplio').length, 3);
    igual(Composicion.disponer(12, 'amplio').length, 12);
    igual(Composicion.disponer(5, 'compacto').length, 5);
  });

  prueba('es determinista: dos llamadas dan lo mismo', function () {
    igual(Composicion.disponer(9, 'amplio'), Composicion.disponer(9, 'amplio'));
  });

  prueba('no depende de cuántos vengan detrás', function () {
    var pocos = Composicion.disponer(3, 'amplio');
    var muchos = Composicion.disponer(30, 'amplio');
    igual(pocos[0], muchos[0]);
    igual(pocos[2], muchos[2]);
  });

  /* 136 y 76, no 120 y 60: la rejilla mide 120 y 60, y lo que se suma son los
     8vw de margen por cada lado. Si alguien toca MARGEN tendrá que tocar estos
     dos números, y eso es lo que se quiere —que el valor esté fijado en algún
     sitio y no se pueda mover sin querer—. */
  prueba('el lienzo es la rejilla más el margen: 136vw el amplio y 76 el compacto', function () {
    igual(Composicion.tamano(12, 'amplio').ancho, 136);
    igual(Composicion.tamano(12, 'compacto').ancho, 76);
  });

  /* LO QUE SE ROMPIÓ EN PANTALLA: el compacto tenía la celda a 50 y el amplio
     a 30, así que al pulsar una categoría del menú cada foto se multiplicaba
     por 1,67 y las cajas crecían de golpe. Las dos celdas tienen que medir lo
     mismo; el número exacto lo fijan las dos pruebas de al lado. */
  prueba('filtrar no cambia el tamaño de las cajas: la celda es la misma en los dos modos', function () {
    for (var n = 1; n <= 40; n++) {
      var a = Composicion.disponer(n, 'amplio');
      var c = Composicion.disponer(n, 'compacto');
      for (var i = 0; i < n; i++) {
        igual(c[i].w, a[i].w);
      }
    }
  });

  /* Y lo que hace que la escala salga 1 clavada aunque el proyecto caiga en
     otro hueco: pedir su variante. Es lo que usa `Galeria.aplicarFiltro`. */
  prueba('con variantes, cada hueco se lleva la caja que se le pide', function () {
    var todas = Composicion.disponer(6, 'amplio');
    var revuelto = Composicion.disponer(3, 'compacto', [4, 0, 2]);
    igual(revuelto[0].w, todas[4].w);
    igual(revuelto[1].w, todas[0].w);
    igual(revuelto[2].w, todas[2].w);
  });

  /* Las variantes no pueden romper lo que garantiza la construcción: el alto
     de celda sale del máximo del ciclo y a lo ancho la caja más saliente ocupa
     0,78 de su celda, así que CUALQUIER variante cabe en CUALQUIER hueco. Se
     comprueba con los seis repartos peores —todos los huecos con la misma
     caja, una por cada caja del ciclo— en vez de con uno cualquiera. */
  prueba('con variantes repetidas nada se sale ni se solapa', function () {
   for (var v = 0; v < 6; v++) {
    for (var n = 2; n <= 40; n++) {
      var variantes = [];
      for (var k = 0; k < n; k++) variantes.push(v);
      var rs = Composicion.disponer(n, 'compacto', variantes);
      var t = Composicion.tamano(n, 'compacto');
      rs.forEach(function (r) {
        cierto(r.x >= 0 && r.x + r.w <= t.ancho + 0.001);
        cierto(r.y >= 0 && r.y + r.w * 1.25 <= t.alto + 0.001);
      });
      for (var i = 0; i < rs.length; i++) {
        for (var j = i + 1; j < rs.length; j++) {
          var a = rs[i], b = rs[j];
          cierto(a.x + a.w <= b.x + 0.001 || b.x + b.w <= a.x + 0.001 ||
                 a.y + a.w * 1.25 <= b.y + 0.001 || b.y + b.w * 1.25 <= a.y + 0.001,
                 'con ' + n + ' proyectos y la caja ' + v
                 + ' repetida se solapan la ' + i + ' y la ' + j);
        }
      }
    }
   }
  });

  /* Lo que se pidió: las fotos a la mitad. Se comprueba sobre la caja más
     grande del ciclo, que es la que no cabía entera bajo la barra. */
  prueba('la caja más grande del amplio cabe holgada en una pantalla', function () {
    var mayor = 0;
    Composicion.disponer(12, 'amplio').forEach(function (r) {
      if (r.w > mayor) mayor = r.w;
    });
    igual(mayor, 18.6);
    cierto(mayor * 1.25 < 25, 'de alto tiene que quedarse muy por debajo de un alto de pantalla');
  });

  prueba('el lienzo crece con el número de proyectos', function () {
    cierto(Composicion.tamano(24, 'amplio').alto > Composicion.tamano(6, 'amplio').alto);
  });

  prueba('un modo desconocido es un error, no un lienzo raro', function () {
    var hubo = false;
    try { Composicion.disponer(3, 'mediano'); } catch (e) { hubo = true; }
    cierto(hubo);
  });

  prueba('todo cabe dentro del lienzo', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 1; n <= 40; n++) {
        var t = Composicion.tamano(n, modo);
        Composicion.disponer(n, modo).forEach(function (r) {
          cierto(r.x >= 0);
          cierto(r.y >= 0);
          cierto(r.x + r.w <= t.ancho + 0.001);
          cierto(r.y + r.w * 1.25 <= t.alto + 0.001);
        });
      }
    });
  });

  /* La razón de ser del margen, y por qué se comprueba como propiedad y no
     mirando el número: una foto PEGADA al borde del lienzo sólo está entera en
     una única posición del paneo, así que hay que clavar el ratón en el píxel
     justo. Con aire por los cuatro lados tiene un rango de posiciones válidas.

     Se exige 5 y no 8 a propósito: 5 es un suelo, no el valor. Así, afinar
     MARGEN de 8 a 10 —que es plausible si alguien vuelve a medir la holgura—
     no rompe esta prueba, pero quitarlo de `disponer` o de `tamano` sí. El
     valor exacto lo fija la prueba de los 136vw, más arriba. */
  prueba('ninguna foto toca el borde: hay aire por los cuatro lados del lienzo', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 1; n <= 40; n++) {
        var t = Composicion.tamano(n, modo);
        Composicion.disponer(n, modo).forEach(function (r, i) {
          var donde = modo + ', ' + n + ' proyectos, caja ' + i + ': ';
          cierto(r.x >= 5, donde + 'pegada a la izquierda, x=' + r.x);
          cierto(r.y >= 5, donde + 'pegada arriba, y=' + r.y);
          cierto(t.ancho - (r.x + r.w) >= 5,
                 donde + 'pegada a la derecha, sobran ' + (t.ancho - (r.x + r.w)));
          cierto(t.alto - (r.y + r.w * 1.25) >= 5,
                 donde + 'pegada abajo, sobran ' + (t.alto - (r.y + r.w * 1.25)));
        });
      }
    });
  });

  prueba('NINGÚN par se solapa, con cualquier número de proyectos', function () {
    ['amplio', 'compacto'].forEach(function (modo) {
      for (var n = 2; n <= 40; n++) {
        var rs = Composicion.disponer(n, modo);
        for (var i = 0; i < rs.length; i++) {
          for (var j = i + 1; j < rs.length; j++) {
            var a = rs[i], b = rs[j];
            var separados =
              a.x + a.w <= b.x + 0.001 || b.x + b.w <= a.x + 0.001 ||
              a.y + a.w * 1.25 <= b.y + 0.001 || b.y + b.w * 1.25 <= a.y + 0.001;
            cierto(separados);
          }
        }
      }
    });
  });

  prueba('las cajas no son todas iguales: la composición es irregular', function () {
    var anchos = {};
    Composicion.disponer(12, 'amplio').forEach(function (r) { anchos[r.w] = true; });
    cierto(Object.keys(anchos).length >= 4);
  });
});
