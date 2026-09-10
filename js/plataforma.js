window.Plataforma = (function () {

  /* El anfitrión, y no la URL entera, porque es la única parte que no puede
     falsificar quien escribe el enlace en el panel: el camino y la consulta
     los pone quien quiera. */
  var NOMBRES = {
    'youtu.be': 'YouTube',
    'youtube.com': 'YouTube',
    'www.youtube.com': 'YouTube',
    'vimeo.com': 'Vimeo',
    'www.vimeo.com': 'Vimeo'
  };

  /* A mano y no con `new URL()`, y no por nostalgia: `new URL` lanza ante una
     cadena que no sea una URL, y aquí lo que llega es un campo de texto que
     rellena una persona. Devolver null es la respuesta correcta a "esto no es
     una dirección", y envolverlo en un try/catch para conseguir lo mismo sería
     más código que la expresión. */
  function anfitrionDe(url) {
    var m = /^https?:\/\/([^\/?#]+)/i.exec(String(url || ''));
    if (!m) return null;
    /* El puerto fuera: `youtu.be:443` es el mismo anfitrión. */
    return m[1].split(':')[0].toLowerCase();
  }

  /* La comparación es contra el anfitrión ENTERO. Con un `indexOf` bastaba
     `youtube.com.malo.example` para hacerse pasar por YouTube, que es la forma
     clásica de este fallo. */
  function nombreDe(url) {
    var a = anfitrionDe(url);
    return (a && NOMBRES[a]) || null;
  }

  function etiquetaDe(url) {
    var n = nombreDe(url);
    return n ? 'Ver en ' + n : 'Ver el vídeo';
  }

  /* Toca el DOM, a diferencia de las dos de arriba, y vive aquí a propósito:
     `rel="noopener noreferrer"` tiene que estar escrito UNA vez. Repetido en
     `visor-ficha.js` y en `movil-ficha.js` serían dos copias que se separan, y
     la que se separe se lleva por delante una garantía de seguridad, no un
     detalle de estilo. */
  function boton(url) {
    if (!url) return null;
    var a = document.createElement('a');
    a.className = 'pastilla-enlace';
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = etiquetaDe(url);
    return a;
  }

  return { nombreDe: nombreDe, etiquetaDe: etiquetaDe, boton: boton };
})();
