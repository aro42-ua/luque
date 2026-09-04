window.MovilVisor = (function () {

  /* La conversión que `js/movil-recorrido.js` pide por escrito en el
     comentario sobre `indiceDeProyecto`: allí `piezas` es un NÚMERO, aquí
     arriba es un array. Equivocarse no da error —`array >= 1` es `NaN >= 1`,
     `false`— y trataría como vídeo a todo proyecto de fotos, sin que nada
     avise. Por eso la conversión tiene nombre, un solo sitio y prueba propia.

     El `|| 0` cubre al proyecto que llega sin el campo: hoy los de vídeo lo
     traen vacío, pero eso lo garantiza `contenido.json` y no este módulo. */
  function ordenDe(proyectos) {
    return proyectos.map(function (p) {
      return { id: p.id, piezas: (p.piezas && p.piezas.length) || 0 };
    });
  }

  var raiz = null, escena = null, orden = [], aqui = null;

  /* `estado` es `null` cuando el visor está cerrado, y `{proyecto, pieza}`
     cuando está abierto. No se usa el `{proyecto: null}` de
     `MovilRecorrido.inicial` para representar «cerrado»: ese valor significa
     «no hay ningún trabajo», que es otra cosa, y confundirlos dejaría el visor
     abierto sobre nada cuando la lista viniera vacía. */
  function estado() { return aqui; }

  function init(refs, proyectos) {
    raiz = refs.raiz;
    escena = refs.escena;
    orden = ordenDe(proyectos);
    aqui = null;
  }

  /* El suscriptor del router, y la guarda simétrica a la de `js/visor.js`. */
  function aplicar(ruta) {
    if (window.Movil.actual() !== 'movil') return;
    if (ruta.tipo !== 'proyecto') { cerrar(); return; }

    var nuevo = window.MovilRecorrido.desdeRuta(ruta, orden);
    if (nuevo.proyecto === null) { cerrar(); return; }

    aqui = nuevo;
    raiz.hidden = false;
    document.body.classList.add('mvisor-abierto');
    pintar();
  }

  function cerrar() {
    if (!aqui) return;
    aqui = null;
    raiz.hidden = true;
    document.body.classList.remove('mvisor-abierto');
    escena.innerHTML = '';
  }

  /* En la Tarea 2 esto pinta la pieza de verdad. Aquí sólo deja constancia de
     dónde estamos, que es lo que la Tarea 1 puede comprobar sin escena. */
  function pintar() {
    escena.dataset.proyecto = aqui.proyecto;
    escena.dataset.pieza = String(aqui.pieza);
  }

  return {
    ordenDe: ordenDe,
    init: init,
    aplicar: aplicar,
    estado: estado
  };
})();
