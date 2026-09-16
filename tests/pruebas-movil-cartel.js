/* El cartel del visor móvil. Lo que se puede comprobar sin fotos: qué pone,
   cuándo está puesto y cuándo se ha ido.

   El plazo se comprueba contra la CONSTANTE en vivo (`MovilCartel.DURACION`) y
   no esperando a que el reloj corra, igual que `pruebas-movil-hud.js` hace con
   `OCULTAR_TRAS`: una prueba que espera segundo y medio paga ese segundo y
   medio en cada pasada de la suite entera, y lo único que fijaría de más es
   que `setTimeout` funciona. */

describe('MovilCartel', function () {

  var MARCADO =
    '<div id="cartel" hidden><p id="cartelTexto"></p></div>';

  function con(fn) {
    return ArnesDom.conElemento(MARCADO, function (caja) {
      MovilCartel.init({ raiz: caja, texto: caja.querySelector('#cartelTexto') });
      /* Cada prueba empieza con el cartel retirado: el módulo guarda estado
         entre llamadas —el temporizador— y es el mismo objeto para toda la
         suite. Sin esto, el `setTimeout` que deja una prueba se dispararía en
         medio de la siguiente. */
      MovilCartel.retirar();
      return fn(caja);
    });
  }

  function estado(caja) {
    return {
      texto:  caja.querySelector('#cartelTexto').textContent,
      puesto: caja.classList.contains('puesto'),
      oculto: caja.hidden
    };
  }

  prueba('el plazo entero son 1480ms: 180 entrando, 900 puesto, 400 saliendo', function () {
    igual(MovilCartel.DURACION, 1480);
  });

  prueba('mostrar pone el título y destapa el cartel', function () {
    igual(con(function (caja) {
      MovilCartel.mostrar('La Boquerona');
      return estado(caja);
    }), { texto: 'La Boquerona', puesto: true, oculto: false });
  });

  /* Encadenar dos deslizamientos rápidos. Lo que se fija aquí es que el
     segundo cartel queda puesto con el nombre nuevo, y no que el primero lo
     haya dejado a medias. */
  prueba('un cartel encima de otro se queda con el título nuevo', function () {
    igual(con(function (caja) {
      MovilCartel.mostrar('La Boquerona');
      MovilCartel.mostrar('Monstruación');
      return estado(caja);
    }), { texto: 'Monstruación', puesto: true, oculto: false });
  });

  /* `hidden` Y sin la clase. Lo primero lo saca de en medio de la foto; lo
     segundo deja el nodo como lo encontró el primer `mostrar`, que es de lo
     que depende que la animación se relance la vez siguiente. */
  prueba('retirar lo oculta y le quita la clase', function () {
    igual(con(function (caja) {
      MovilCartel.mostrar('La Boquerona');
      MovilCartel.retirar();
      return estado(caja);
    }), { texto: 'La Boquerona', puesto: false, oculto: true });
  });

  prueba('retirado, se puede volver a mostrar', function () {
    igual(con(function (caja) {
      MovilCartel.mostrar('La Boquerona');
      MovilCartel.retirar();
      MovilCartel.mostrar('The In-Between');
      return estado(caja);
    }), { texto: 'The In-Between', puesto: true, oculto: false });
  });

  /* Retirar dos veces seguidas pasa de verdad: el visor puede cerrarse con el
     temporizador ya disparado. */
  prueba('retirar dos veces no se cae', function () {
    igual(con(function (caja) {
      MovilCartel.retirar();
      MovilCartel.retirar();
      return estado(caja).oculto;
    }), true);
  });
});
