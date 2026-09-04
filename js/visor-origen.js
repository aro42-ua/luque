window.VisorOrigen = (function () {

  /* De dónde sale el vuelo de la foto: a qué elemento de la portada se le pide
     el rectángulo desde el que crece el lienzo al abrir, y al que vuelve al
     cerrar.

     Vive fuera de `js/visor.js` porque aquel fichero estaba a una línea del
     techo de 300 y cualquier añadido lo desbordaba. La división no es sólo
     aritmética, igual que la de `js/movil-puerta.js` en este mismo bloque:
     «qué portada está puesta» es una pregunta distinta de «cómo se anima el
     visor», y sólo estaban juntas por haberse escrito en el mismo sitio.

     Hasta el bloque 4e se le preguntaba siempre a `Galeria`, y en un móvil eso
     salía mal de una forma que no daba error: `Galeria.init()` se llama también
     en móvil, así que devolvía un botón de verdad — pero uno que vive dentro de
     `.gallery`, apagado por la regla `body.es-movil .gallery{display:none}` de
     css/luque.css. El rectángulo de un elemento con `display:none` es todo
     ceros, así que la foto volaba desde un punto en la esquina superior
     izquierda, que es lo que se veía como «aparece de la nada».

     OJO con esa regla, porque es la que despistó a la primera versión de este
     módulo: quien la enciende NO es el CSS por su cuenta, sino la clase
     `es-movil` que pone JavaScript desde la rama `movil` de `Movil.init`
     (index.html). O sea que no está activa desde el primer byte, sino desde que
     alguien decide el lado. De ahí la exigencia de abajo.

     Ésta es la primera y única vez que el visor sabe que existe un móvil. Se
     acepta a propósito: hay exactamente dos portadas y `js/movil.js` ya es el
     sitio del proyecto donde se pregunta en qué mundo estamos. Si algún día hay
     una tercera, éste es el punto donde conviene invertir la dependencia y que
     la portada activa se registre. */

  /* EXIGE que el lado ya esté decidido y `body.es-movil` aplicado antes del
     primer aviso del Router. No es un detalle de arranque: `Router.init()`
     avisa a sus suscriptores de forma SÍNCRONA, y uno de ellos abre el visor,
     así que un enlace en frío a un trabajo (`index.html#/niebla`, el caso
     normal de quien llega desde un enlace compartido en el móvil) pasa por aquí
     ANTES que cualquier cosa que se cablee después.

     Con `Movil.init` corriendo después de `Router.init`, como estaba hasta la
     ronda de arreglos de la Tarea 4, `Movil.actual()` valía `null` en ese
     instante y esto se iba por la rama de escritorio: el defecto original,
     intacto, justo por donde más gente entra. Medido entonces: `elementoDe` se
     llamaba cero veces y el vuelo salía de un rectángulo fuera de pantalla.

     Y no vale con consultar aquí la media query cuando `actual()` sea `null`:
     en ese mismo instante `body.es-movil` tampoco estaría puesto, `.hoja`
     seguiría en `display:none` y la celda devolvería un rectángulo en ceros —
     el mismo defecto con otro disfraz. Lo que hace falta es que el lado esté
     decidido Y aplicado, y eso sólo lo garantiza el orden de arranque. */
  function elemento(id) {
    if (window.Movil.actual() === 'movil') {
      return window.MovilHoja.elementoDe(document.getElementById('hojaRejilla'), id);
    }
    return window.Galeria.elementoDe(id);
  }

  return { elemento: elemento };
})();
