window.Datos = (function () {
  var CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

  function serie(semilla, cuantas) {
    var piezas = [];
    for (var i = 1; i <= cuantas; i++) {
      piezas.push('https://picsum.photos/seed/' + semilla + i + '/2400/3000');
    }
    return piezas;
  }

  var PROYECTOS = [
    { id:'niebla',   titulo:'Niebla',   categoria:'foto-stills',  pos:{x:4,   y:8,   w:20},
      ficha:{cliente:'Personal',   anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      piezas: serie('luque1', 6) },
    { id:'arena',    titulo:'Arena',    categoria:'foto-stills',  pos:{x:30,  y:55,  w:16},
      ficha:{cliente:'Personal',   anio:2024, camara:'Alexa Mini', optica:'Cooke S4'},
      piezas: serie('luque2', 5) },
    { id:'vidrio',   titulo:'Vidrio',   categoria:'foto-stills',  pos:{x:58,  y:14,  w:19},
      ficha:{cliente:'Personal',   anio:2024, camara:'Sony FX3',   optica:'Zeiss Super Speed'},
      piezas: serie('luque3', 7) },

    { id:'bruma',    titulo:'Bruma',    categoria:'editorial',    pos:{x:88,  y:40,  w:17},
      ficha:{cliente:'Vogue ES',   anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      piezas: serie('luque4', 8) },
    { id:'salitre',  titulo:'Salitre',  categoria:'editorial',    pos:{x:118, y:70,  w:20},
      ficha:{cliente:'Neo2',       anio:2025, camara:'Sony FX3',   optica:'Sigma Art'},
      piezas: serie('luque5', 6) },
    { id:'oleaje',   titulo:'Oleaje',   categoria:'editorial',    pos:{x:148, y:10,  w:16},
      ficha:{cliente:'Metal',      anio:2023, camara:'Alexa Mini', optica:'Cooke S4'},
      piezas: serie('luque6', 5) },

    { id:'reflejo',  titulo:'Reflejo',  categoria:'videoclip',    pos:{x:176, y:48,  w:19},
      ficha:{cliente:'Amaia',      anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      video: { src:'video/reflejo.mp4', poster:'https://picsum.photos/seed/luque7/1600/900' } },
    { id:'estatica', titulo:'Estática', categoria:'videoclip',    pos:{x:8,   y:95,  w:18},
      ficha:{cliente:'Rusowsky',   anio:2024, camara:'Sony FX3',   optica:'Sigma Art'},
      video: { src:'video/estatica.mp4', poster:'https://picsum.photos/seed/luque8/1600/900' } },
    { id:'humo',     titulo:'Humo',     categoria:'videoclip',    pos:{x:206, y:85,  w:17},
      ficha:{cliente:'Ralphie',    anio:2024, camara:'Alexa Mini', optica:'Cooke S4'},
      video: { src:'video/humo.mp4', poster:'https://picsum.photos/seed/luque9/1600/900' } },

    { id:'ceniza',   titulo:'Ceniza',   categoria:'cortometraje', pos:{x:46,  y:100, w:20},
      ficha:{cliente:'ECAM',       anio:2025, camara:'Alexa Mini', optica:'Zeiss Super Speed'},
      video: { src:'video/ceniza.mp4', poster:'https://picsum.photos/seed/luque10/1600/900' } },
    { id:'raiz',     titulo:'Raíz',     categoria:'cortometraje', pos:{x:96,  y:120, w:16},
      ficha:{cliente:'Autofinanciado', anio:2023, camara:'Sony FX3', optica:'Sigma Art'},
      video: { src:'video/raiz.mp4', poster:'https://picsum.photos/seed/luque11/1600/900' } },
    { id:'litoral',  titulo:'Litoral',  categoria:'cortometraje', pos:{x:168, y:110, w:19},
      ficha:{cliente:'Canal Sur',  anio:2022, camara:'Alexa Mini', optica:'Cooke S4'},
      video: { src:'video/litoral.mp4', poster:'https://picsum.photos/seed/luque12/1600/900' } }
  ];

  // Las portadas se solicitan a 800x1000 porque solo aparecen pequeñas en la galería,
  // mientras que las piezas se solicitan a 2400x3000 para que la lupa tenga recorrido.
  // Todo es relleno hasta que lleguen las fotografías reales del estudio.
  PROYECTOS.forEach(function (p) {
    if (!p.portada) {
      if (p.piezas) {
        var primeraPieza = p.piezas[0];
        var match = primeraPieza.match(/seed\/([^/]+)\//);
        if (match && match[1]) {
          p.portada = 'https://picsum.photos/seed/' + match[1] + '/800/1000';
        } else {
          p.portada = primeraPieza;
        }
      } else {
        p.portada = p.video.poster;
      }
    }
  });

  function validarDatos(proyectos, categorias) {
    var problemas = [];
    var vistos = {};
    proyectos.forEach(function (p) {
      if (vistos[p.id]) problemas.push('id duplicado: ' + p.id);
      vistos[p.id] = true;
      if (categorias.indexOf(p.id) !== -1) problemas.push('el id choca con una categoría: ' + p.id);
      if (categorias.indexOf(p.categoria) === -1) problemas.push('categoría desconocida en ' + p.id + ': ' + p.categoria);
      if (p.piezas && p.video) problemas.push('piezas y video a la vez en ' + p.id);
      if (!p.piezas && !p.video) problemas.push('sin piezas ni video: ' + p.id);
    });
    return problemas;
  }

  function porId(id) {
    for (var i = 0; i < PROYECTOS.length; i++) {
      if (PROYECTOS[i].id === id) return PROYECTOS[i];
    }
    return null;
  }

  function porCategoria(categoria) {
    return PROYECTOS.filter(function (p) { return p.categoria === categoria; });
  }

  return {
    CATEGORIAS: CATEGORIAS,
    PROYECTOS: PROYECTOS,
    validarDatos: validarDatos,
    porId: porId,
    porCategoria: porCategoria
  };
})();
