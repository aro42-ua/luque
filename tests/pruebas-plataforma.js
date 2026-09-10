describe('Plataforma', function () {

  // ---- Deducir el nombre --------------------------------------------

  prueba('reconoce los dos anfitriones de YouTube', function () {
    igual(Plataforma.nombreDe('https://youtu.be/IcFvvXAZMqs'), 'YouTube');
    igual(Plataforma.nombreDe('https://www.youtube.com/watch?v=abc'), 'YouTube');
  });

  prueba('reconoce Vimeo', function () {
    igual(Plataforma.nombreDe('https://vimeo.com/123456'), 'Vimeo');
  });

  /* Un anfitrión desconocido no es un error: es una plataforma que todavía no
     está en la lista. El botón tiene que seguir llevando a alguna parte. */
  prueba('un anfitrion desconocido no tiene nombre, pero no revienta', function () {
    igual(Plataforma.nombreDe('https://filmin.es/algo'), null);
  });

  prueba('lo que no es una URL no tiene nombre', function () {
    igual(Plataforma.nombreDe(''), null);
    igual(Plataforma.nombreDe(null), null);
    igual(Plataforma.nombreDe('vete a saber'), null);
  });

  /* El anfitrion se compara ENTERO, no por trozos: sin esto,
     "youtube.com.malo.example" pasaria por YouTube. */
  prueba('un anfitrion que solo CONTIENE el nombre no cuenta', function () {
    igual(Plataforma.nombreDe('https://youtube.com.malo.example/x'), null);
  });

  // ---- La etiqueta ---------------------------------------------------

  prueba('la etiqueta nombra la plataforma cuando se conoce', function () {
    igual(Plataforma.etiquetaDe('https://youtu.be/x'), 'Ver en YouTube');
  });

  prueba('y cae en algo generico cuando no', function () {
    igual(Plataforma.etiquetaDe('https://filmin.es/x'), 'Ver el vídeo');
  });

  // ---- El botón ------------------------------------------------------

  prueba('sin enlace no hay boton, y no hay hueco', function () {
    igual(Plataforma.boton(''), null);
    igual(Plataforma.boton(null), null);
  });

  prueba('el boton es un enlace, no un boton', function () {
    igual(Plataforma.boton('https://youtu.be/x').tagName, 'A');
  });

  prueba('el boton lleva a donde dice el enlace y se ve lo que dice', function () {
    var a = Plataforma.boton('https://youtu.be/x');
    igual(a.getAttribute('href'), 'https://youtu.be/x');
    igual(a.textContent, 'Ver en YouTube');
  });

  /* Esto es una comprobacion de SEGURIDAD, no de estilo. Sin `noopener`, la
     pagina de destino recibe una referencia a la nuestra por window.opener y
     puede redirigirla. Se prueba en vez de confiarlo a la revision. */
  prueba('el boton abre fuera y corta la referencia a esta pagina', function () {
    var a = Plataforma.boton('https://youtu.be/x');
    igual(a.getAttribute('target'), '_blank');
    igual(a.getAttribute('rel'), 'noopener noreferrer');
  });

  prueba('el boton lleva la clase de la pastilla amarilla', function () {
    igual(Plataforma.boton('https://youtu.be/x').className, 'pastilla-enlace');
  });
});
