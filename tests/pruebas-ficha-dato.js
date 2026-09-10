/* El hueco de la ficha, que la spec del contenido real llama `######`.

   POR QUÉ EXISTE ESTE MÓDULO Y NO SON DOS LÍNEAS EN CADA FICHA. Las escriben
   dos sitios —`VisorFicha.pintar` en escritorio y `MovilFicha.de` en móvil— y
   es la MISMA ficha vista en dos pantallas. Escrita dos veces son dos
   convenciones que se separan sin que nadie se entere, que es el motivo por el
   que `Plataforma` existe y por el que `reglas-contenido.js` salió de los dos
   lados que lo copiaban.

   LO QUE ESTO NO ES. No es validación: `ReglasContenido` deja pasar a
   propósito una ficha sin `cliente`, porque Conejita Playboy no lo tiene y los
   cuatro editoriales no tienen `enlace`. Un dato que falta es contenido
   legítimo; `######` es cómo se ENSEÑA, no si se acepta. */
describe('FichaDato — el hueco de la ficha', function () {

  prueba('un dato presente sale tal cual', function () {
    igual(FichaDato.de("Harper's Bazaar"), "Harper's Bazaar");
  });

  prueba('un número sale como texto', function () {
    igual(FichaDato.de(2025), '2025');
  });

  /* Los tres huecos que se dan de verdad. `undefined` es el campo que no está
     en el JSON —los cuatro videoclips no traen `cliente`—; `null` y la cadena
     vacía son lo que puede dejar el formulario del panel, que sí pinta los
     cuatro campos aunque quien los rellene deje uno en blanco. */
  prueba('un campo ausente sale como el hueco', function () {
    igual(FichaDato.de(undefined), '######');
  });

  prueba('un nulo sale como el hueco', function () {
    igual(FichaDato.de(null), '######');
  });

  prueba('una cadena vacía sale como el hueco', function () {
    igual(FichaDato.de(''), '######');
  });

  prueba('sólo espacios es un hueco, no un dato', function () {
    igual(FichaDato.de('   '), '######');
  });

  /* La trampa de escribir esto con un `if (!valor)`. `Piezas` es una cuenta, y
     una cuenta puede valer cero; un proyecto sin piezas debe enseñar «0», que
     es un dato, y no `######`, que dice «no lo sabemos». Vale también para
     `anio`, que nunca es cero pero no tiene por qué ser esta función quien lo
     sepa. */
  prueba('el cero es un dato y no un hueco', function () {
    igual(FichaDato.de(0), '0');
  });
});

/* EL PUNTO CIEGO DEL PROYECTO, otra vez. `tests/test.html` carga sus propias
   etiquetas <script>: un módulo añadido aquí y olvidado en `index.html` da la
   suite entera en verde y un `TypeError` en producción. Está documentado en
   `docs/estado-conocido.md` y ya mordió una vez. Esto lo mira en la página de
   verdad, no en el arnés. Necesita servidor: bajo file:// el `fetch` no llega. */
describeAsync('FichaDato — llega a la página real', function () {
  return fetch('../index.html', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('index.html respondió ' + r.status);
      return r.text();
    })
    .then(function (html) {
      prueba('index.html carga js/ficha-dato.js', function () {
        cierto(html.indexOf('js/ficha-dato.js') !== -1,
               'index.html no nombra el módulo: la suite pasaría y el sitio no');
      });

      /* Va antes que sus dos consumidores o `FichaDato` no existe cuando
         pintan. El orden de las etiquetas es la única dependencia que este
         proyecto declara. */
      prueba('va antes que visor-ficha.js y que movil-ficha.js', function () {
        var yo = html.indexOf('js/ficha-dato.js');
        cierto(yo < html.indexOf('js/visor-ficha.js'), 'va después de visor-ficha.js');
        cierto(yo < html.indexOf('js/movil-ficha.js'), 'va después de movil-ficha.js');
      });
    });
});
