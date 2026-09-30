window.MovilFicha = (function () {

  /* El contenido de la ficha del visor móvil. Desde el visor premium
     (2026-09-30) va dentro de un panel que sube desde abajo sobre la foto
     (`js/movil-visor.js`, `montar`). Las filas son las mismas que enseña el
     escritorio en `VisorFicha.pintar` (js/visor-ficha.js), y con los mismos
     rótulos, porque es la misma ficha vista en otra pantalla.

     A diferencia de `VisorFicha`, este módulo no guarda referencias a un
     marcado fijo: sólo devuelve el nodo, sin `init` ni estado propio. */
  function de(p) {
    var caja = document.createElement('div');
    caja.className = 'mvisor-ficha';

    var h = document.createElement('h2');
    h.className = 'mvisor-ficha-titulo';
    h.textContent = p.titulo;
    caja.appendChild(h);

    var lista = document.createElement('dl');
    lista.className = 'mvisor-ficha-datos';
    /* Por `FichaDato.de`, igual que el escritorio y por el mismo motivo:
       el hueco se enseña, no se deja en blanco. */
    [['Cliente', FichaDato.de(p.ficha.cliente)],
     ['Año',     FichaDato.de(p.ficha.anio)],
     ['Papel',   FichaDato.de(p.ficha.papel)],
     ['Piezas',  FichaDato.de(p.piezas.length)]].forEach(function (f) {
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
       escritorio: el panel se rehace entero al cambiar de trabajo. */
    var boton = Plataforma.boton(p.ficha.enlace);
    if (boton) caja.appendChild(boton);

    return caja;
  }

  return { de: de };
})();
