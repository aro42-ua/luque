window.FichaDato = (function () {

  /* Seis almohadillas, y la spec del contenido real las escribe así. Es un
     hueco que se VE: una fila con el rótulo puesto y el valor en blanco se lee
     como «la web está rota», y `######` se lee como «este dato no lo tenemos».
     Es la misma idea que el número dentro del marco oscuro de la foto que no
     llega (`.hoja-celda.sin-foto`, en css/luque.css). */
  var HUECO = '######';

  /* Un dato de ficha, listo para meter en un `dd`.

     Devuelve SIEMPRE una cadena: quien llama escribe `dd.textContent = ...` y
     un `undefined` ahí deja el hueco mudo, sin nada que leer. Los cuatro
     videoclips de Lidia no traen `cliente` y los cuatro editoriales no traen
     `enlace`: son fichas legítimas, no contenido a medias, y `ReglasContenido`
     las acepta a propósito.

     El cero se comprueba aparte y no con un `if (!valor)`: `Piezas` es una
     cuenta y una cuenta puede valer cero. «0» es un dato; `######` dice que no
     se sabe, que no es lo mismo. */
  function de(valor) {
    if (valor === undefined || valor === null) return HUECO;
    var texto = String(valor);
    return texto.replace(/^\s+|\s+$/g, '') === '' ? HUECO : texto;
  }

  return { de: de, HUECO: HUECO };
})();
