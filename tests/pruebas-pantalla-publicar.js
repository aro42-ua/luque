describe('PantallaPublicar.pintar', function () {
  var HTML =
    '<div><p id="qCambios"></p><p id="qFalta"></p>' +
    '<p id="qAviso" role="status" aria-live="polite"></p>' +
    '<button id="qPublicar" type="button">Publicar</button></div>';

  function elementos(c) {
    return { cambios: c.querySelector('#qCambios'), falta: c.querySelector('#qFalta'),
             aviso: c.querySelector('#qAviso'), boton: c.querySelector('#qPublicar') };
  }

  function p(id) {
    return { id: id, titulo: id, categoria: 'editorial', tipo: 'fotos',
             ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/' + id + '-1500.jpg',
             piezas: [{ url: '/img/' + id + '-3000.jpg' }] };
  }

  function estado(extra) {
    var base = { borrador: { version: 4, proyectos: [p('a')] },
                 publicado: { version: 3, proyectos: [] },
                 hayCambiosSinGuardar: false, aviso: '', bloqueado: false };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  function con(fn, e) {
    return window.ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      window.PantallaPublicar.pintar(els, e || estado(), { alPublicar: function () {} });
      return fn(els);
    });
  }

  prueba('enseña qué va a cambiar, con nombres', function () {
    con(function (els) {
      cierto(els.cambios.textContent.indexOf('a') !== -1, els.cambios.textContent);
    });
  });

  prueba('con todo en orden, el botón está activo', function () {
    con(function (els) { igual(els.boton.disabled, false); });
  });

  /* El Worker publica el borrador DEL SERVIDOR. Con cambios sin guardar, el
     resumen enseñaría lo que hay en pantalla y saldría publicado lo de antes
     — una mentira que sólo se descubre mirando la web. */
  prueba('con cambios sin guardar no se publica, y dice por qué', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
      cierto(els.falta.textContent.indexOf('guard') !== -1, els.falta.textContent);
    }, estado({ hayCambiosSinGuardar: true }));
  });

  /* Los mismos problemas que el Worker diría con un 422, dichos antes de
     pulsar. Enterarse después es enterarse en un callejón. */
  prueba('un borrador inválido no se publica, y dice qué le falta', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
      cierto(els.falta.textContent.indexOf('portada') !== -1, els.falta.textContent);
    }, estado({ borrador: { version: 4, proyectos: [
      { id: 'a', titulo: 'A', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, piezas: [{ url: '/img/a-3000.jpg' }] }] } }));
  });

  /* Un borrador vacío tampoco: el Worker lo rechaza con «no hay ningún
     proyecto que publicar», y publicar así vaciaría la web entera. */
  prueba('un borrador vacío no se publica', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
    }, estado({ borrador: { version: 4, proyectos: [] } }));
  });

  /* Sin cambios el botón se queda activo a propósito: publicar lo mismo es
     inofensivo, y deshabilitarlo obligaría a explicar la diferencia entre «no
     puedes» y «no hace falta». El resumen ya lo dice. */
  prueba('sin cambios el botón sigue activo, y el resumen lo dice', function () {
    con(function (els) {
      igual(els.boton.disabled, false);
      cierto(els.cambios.textContent.indexOf('ningún cambio') !== -1, els.cambios.textContent);
    }, estado({ publicado: { version: 3, proyectos: [p('a')] } }));
  });

  /* El mismo criterio que al guardar. Si el botón sigue activo, volver a
     pulsarlo manda la misma versión vieja y el servidor vuelve a contestar
     409, en bucle, sin más salida que recargar. */
  prueba('bloqueado tras un conflicto, el botón no vuelve', function () {
    con(function (els) { igual(els.boton.disabled, true); },
        estado({ bloqueado: true }));
  });

  prueba('el aviso se enseña donde se lee', function () {
    con(function (els) { igual(els.aviso.textContent, 'Publicado.'); },
        estado({ aviso: 'Publicado.' }));
  });

  prueba('pulsar llama a alPublicar', function () {
    var veces = 0;
    window.ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      window.PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      els.boton.click();
      igual(veces, 1);
    });
  });

  /* Repintar sobre nodos que vienen del HTML y no se reconstruyen apilaría un
     oyente por pintado, y a la tercera visita a la pantalla un clic
     publicaría tres veces. */
  prueba('repintar no apila el oyente del botón', function () {
    var veces = 0;
    window.ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      window.PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      window.PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      els.boton.click();
      igual(veces, 1);
    });
  });

  /* Guardar se dice antes que arreglar la ficha porque se arregla sin salir
     de esta pantalla: el botón de guardar está a la vista, y corregir una
     ficha obliga a irse a otra pantalla y volver. */
  prueba('si falta guardar y además falta contenido, guardar va primero', function () {
    con(function (els) {
      var texto = els.falta.textContent;
      cierto(texto.indexOf('guard') !== -1 && texto.indexOf('portada') !== -1, texto);
      cierto(texto.indexOf('guard') < texto.indexOf('portada'), texto);
    }, estado({ hayCambiosSinGuardar: true, borrador: { version: 4, proyectos: [
      { id: 'a', titulo: 'A', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, piezas: [{ url: '/img/a-3000.jpg' }] }] } }));
  });
});
