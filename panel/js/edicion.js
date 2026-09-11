/* Las reglas de editar las piezas de un proyecto, sin DOM y sin red. Aquí vive
   lo que puede corromper el contenido en silencio —quitar la pieza que era la
   portada—, así que aquí es donde se puede probar entero. */
window.Edicion = (function () {

  /* Las piezas que sube el panel traen su propia `portada`, que es un campo
     nuevo y aditivo. Las 65 del contenido real no la traen: se subieron con
     herramientas/derivar_imagenes.py y son {url, miniatura}. Para ésas se
     deduce del sufijo, que el script escribió con la medida del lado largo.

     Se prefiere guardarla y deducir sólo cuando falta, en vez de deducir
     siempre: deducir siempre ataría el panel a que el nombre del archivo no
     cambie nunca, y esto es compatibilidad con lo viejo, no un contrato. */
  function portadaDe(pieza) {
    if (!pieza) return null;
    if (pieza.portada) return pieza.portada;
    var url = String(pieza.url || '');
    /* Sólo el sufijo del final: un «-3000» en medio del nombre es parte del
       nombre. Sin el ancla, «serie-3000-metros-3000.jpg» se estropearía por
       el primero. */
    if (!/-3000\.jpg$/.test(url)) return null;
    return url.replace(/-3000\.jpg$/, '-1500.jpg');
  }

  function copiar(proyecto, piezas, portada) {
    var nuevo = {};
    Object.keys(proyecto).forEach(function (k) { nuevo[k] = proyecto[k]; });
    nuevo.piezas = piezas;
    nuevo.portada = portada;
    return nuevo;
  }

  function piezasDe(proyecto) {
    return (proyecto && proyecto.piezas) || [];
  }

  function enRango(piezas, indice) {
    return indice >= 0 && indice < piezas.length;
  }

  function indiceDePortada(proyecto) {
    var piezas = piezasDe(proyecto);
    var portada = proyecto && proyecto.portada;
    if (!portada) return -1;
    for (var i = 0; i < piezas.length; i++) {
      if (portadaDe(piezas[i]) === portada) return i;
    }
    return -1;
  }

  /* Mover no es elegir: la fotografía de portada sigue siendo la misma
     aunque ahora ocupe otro sitio en la rejilla. */
  function mover(proyecto, desde, hasta) {
    return copiar(proyecto, window.Orden.mover(piezasDe(proyecto), desde, hasta),
                  proyecto.portada || null);
  }

  function quitar(proyecto, indice) {
    var piezas = piezasDe(proyecto);
    if (!enRango(piezas, indice)) {
      return copiar(proyecto, piezas.slice(), proyecto.portada || null);
    }

    var eraLaPortada = indiceDePortada(proyecto) === indice;
    var quedan = piezas.slice(0, indice).concat(piezas.slice(indice + 1));
    if (!eraLaPortada) return copiar(proyecto, quedan, proyecto.portada || null);

    /* La portada se recalcula porque si no el proyecto se queda apuntando a
       una imagen que ya no es de ninguna de sus piezas. `validar` sólo mira
       que HAYA portada, así que eso se publica sin queja y la galería enseña
       una foto que el visor ya no tiene. */
    return copiar(proyecto, quedan, quedan.length ? portadaDe(quedan[0]) : null);
  }

  function marcarPortada(proyecto, indice) {
    var piezas = piezasDe(proyecto);
    if (!enRango(piezas, indice)) {
      return copiar(proyecto, piezas.slice(), proyecto.portada || null);
    }
    var nueva = portadaDe(piezas[indice]);
    /* Sin portada deducible no se marca: dejar `portada: null` volvería el
       proyecto impublicable sin decirle a nadie por qué. */
    if (!nueva) return copiar(proyecto, piezas.slice(), proyecto.portada || null);
    return copiar(proyecto, piezas.slice(), nueva);
  }

  function anadir(proyecto, nuevas) {
    var piezas = piezasDe(proyecto).concat(nuevas || []);
    var portada = proyecto.portada || null;
    /* La primera foto de un proyecto vacío se hace portada sola: sin portada
       no se publica, y no hay ninguna otra candidata que elegir. */
    if (!portada && piezas.length) portada = portadaDe(piezas[0]);
    return copiar(proyecto, piezas, portada);
  }

  return { portadaDe: portadaDe, indiceDePortada: indiceDePortada,
           mover: mover, quitar: quitar, marcarPortada: marcarPortada,
           anadir: anadir };
})();
