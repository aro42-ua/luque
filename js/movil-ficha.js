window.MovilFicha = (function () {

  /* La ficha es el FONDO del eje vertical, no un panel que se despliega encima:
     por eso `js/movil-visor.js` la pinta en la misma escena y sustituye a la
     foto. Las cuatro filas son las mismas que enseña el escritorio en
     `VisorFicha.pintar` (js/visor-ficha.js), y con los mismos rótulos, porque
     es la misma ficha vista en otra pantalla.

     A diferencia de `VisorFicha`, este módulo no guarda referencias a un
     marcado fijo: la escena móvil se vacía y se reconstruye en cada parada
     (`pintar`, en movil-visor.js), así que aquí sólo hace falta una función
     que devuelva el nodo, sin `init` ni estado propio. */
  function de(p) {
    var caja = document.createElement('div');
    caja.className = 'mvisor-ficha';

    var h = document.createElement('h2');
    h.className = 'mvisor-ficha-titulo';
    h.textContent = p.titulo;
    caja.appendChild(h);

    var lista = document.createElement('dl');
    lista.className = 'mvisor-ficha-datos';
    [['Cliente', p.ficha.cliente],
     ['Año',     p.ficha.anio],
     ['Papel',   p.ficha.papel],
     ['Piezas',  p.piezas.length]].forEach(function (f) {
      var fila = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd);
      lista.appendChild(fila);
    });
    caja.appendChild(lista);

    /* El mismo boton que el escritorio, del mismo sitio: `Plataforma.boton`
       existe para que el `rel="noopener noreferrer"` no esté escrito dos
       veces. Aquí no hace falta vaciar nada antes, a diferencia del
       escritorio: la escena móvil se reconstruye entera en cada parada. */
    var boton = Plataforma.boton(p.ficha.enlace);
    if (boton) caja.appendChild(boton);

    return caja;
  }

  return { de: de };
})();
