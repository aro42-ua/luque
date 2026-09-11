/* Qué cambia entre lo que se va a publicar y lo que hay publicado. Sin DOM y
   sin red: es lo único que hay entre el estudio y una web que cambia, así que
   es lo que más falta hace poder probar entero. */
window.Cambios = (function () {

  function proyectosDe(datos) {
    var lista = datos && datos.proyectos;
    /* Un contenido.json que no carga o llega mal formado se trata como vacío,
       no como «sin cambios»: decir que no hay nada que publicar cuando la web
       está vacía invitaría justo a no publicar. */
    return Object.prototype.toString.call(lista) === '[object Array]' ? lista : [];
  }

  function porId(lista) {
    var mapa = {};
    lista.forEach(function (p) { if (p && p.id) mapa[p.id] = p; });
    return mapa;
  }

  function ids(lista) {
    return lista.filter(function (p) { return p && p.id; })
                .map(function (p) { return p.id; });
  }

  /* La comparación es el proyecto entero: cualquier campo que cambie cuenta,
     incluidos los que hoy no existen. Comparar campo a campo sería una lista
     que hay que acordarse de ampliar cada vez que el modelo crezca, y de la
     que nadie se acuerda.

     Las claves se ordenan porque JSON.stringify respeta el orden de
     inserción, y {a,b} y {b,a} son el mismo proyecto. No es teórico: la
     pantalla de un proyecto reconstruye la ficha en su propio orden cada vez
     que se escribe en ella, así que sin esto un proyecto saldría «cambiado»
     por haberlo abierto. */
  function huella(valor) {
    if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
    if (Object.prototype.toString.call(valor) === '[object Array]') {
      return '[' + valor.map(huella).join(',') + ']';
    }
    return '{' + Object.keys(valor).sort().map(function (k) {
      return JSON.stringify(k) + ':' + huella(valor[k]);
    }).join(',') + '}';
  }

  function entre(borrador, publicado) {
    var deAca = proyectosDe(borrador);
    var deAlla = proyectosDe(publicado);
    var mapaAlla = porId(deAlla);
    var mapaAca = porId(deAca);

    var nuevos = [], tocados = [];
    deAca.forEach(function (p) {
      if (!p || !p.id) return;
      if (!mapaAlla[p.id]) return nuevos.push(p.id);
      if (huella(p) !== huella(mapaAlla[p.id])) tocados.push(p.id);
    });

    var retirados = ids(deAlla).filter(function (id) { return !mapaAca[id]; });

    /* Sólo el orden RELATIVO de los que están en los dos sitios. Un proyecto
       nuevo al principio desplaza a todos los de detrás, y decir «has movido
       seis» por haber añadido uno convertiría el resumen en ruido: lo que
       importa es si el estudio recolocó algo a mano. */
    var antes = ids(deAlla).filter(function (id) { return !!mapaAca[id]; });
    var ahora = ids(deAca).filter(function (id) { return !!mapaAlla[id]; });
    var movidos = huella(antes) === huella(ahora) ? [] : ahora;

    return {
      nuevos: nuevos, retirados: retirados, tocados: tocados, movidos: movidos,
      /* `version` y `actualizado` quedan fuera a propósito: la versión sube en
         cada guardado, así que siempre difiere de la publicada, y contarla
         haría que `hay` fuese true siempre. */
      hay: !!(nuevos.length || retirados.length || tocados.length || movidos.length)
    };
  }

  function trozo(etiqueta, lista) {
    return lista.length ? etiqueta + ': ' + lista.join(', ') + '.' : '';
  }

  /* Nombra los proyectos en vez de contarlos: «se retiran 3» obliga a
     adivinar cuáles, y esto se lee justo antes de cambiar la web. Lo que no
     cambia no se menciona — «se retiran: (ninguno)» es ruido en la única
     pantalla donde hay que leer con atención. */
  function resumir(cambios) {
    if (!cambios.hay) return 'No hay ningún cambio pendiente de publicar.';
    return [
      trozo('Entran', cambios.nuevos),
      trozo('Se quitan de la web', cambios.retirados),
      trozo('Cambian', cambios.tocados),
      cambios.movidos.length
        ? 'Cambia el orden, y con él la composición del lienzo: '
          + cambios.movidos.join(', ') + '.'
        : ''
    ].filter(function (t) { return !!t; }).join(' ');
  }

  return { entre: entre, resumir: resumir, huella: huella };
})();
