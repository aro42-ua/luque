window.MovilAnimacion = (function () {

  /* Del gesto a la clase de entrada. El encargo lo deja escrito y no es una
     inversión gratuita: «si el dedo va hacia la izquierda, la foto nueva
     viene de la derecha, porque el contenido se mueve en el sentido del
     dedo». Pensado con calma: al arrastrar hacia la izquierda, lo que se ve
     en pantalla se desplaza hacia la izquierda —como si empujaras la pieza
     actual fuera por ese lado—, así que la pieza que entra lo hace por el
     lado CONTRARIO, el derecho. Iguales por parejas, y con el mismo
     razonamiento en vertical: arriba trae la entrada desde abajo, abajo la
     trae desde arriba. `MovilRecorrido.mover` ya avisa de que estos nombres
     son los del dedo y no los de la navegación; aquí no se reinterpretan,
     sólo se traduce el mismo nombre a de dónde entra el contenido. */
  var CLASES = {
    izquierda: 'mvisor-entra-der',
    derecha:   'mvisor-entra-izq',
    arriba:    'mvisor-entra-abajo',
    abajo:     'mvisor-entra-arriba'
  };

  /* Pura a propósito, y con prueba propia: `null` para cualquier cosa que no
     sea una de las cuatro direcciones del dedo —incluida la ausencia de
     dirección, que es el caso de llegar por la URL o el botón de atrás—, para
     que quien la llama no tenga que conocer la lista de intenciones válidas
     de `MovilGestos`. */
  function claseDe(intencion) {
    return CLASES[intencion] || null;
  }

  /* La parte que toca el DOM. No añade nada si no hay dirección —parada sin
     gesto detrás— ni si el sistema pide menos movimiento: en ese caso el
     nodo aparece ya en su sitio, sin deslizamiento, que es lo que pide
     `prefers-reduced-motion: reduce` y lo que ya hace el resto del proyecto
     (comparar con `js/movil-puerta.js`). Se consulta `matchMedia` en cada
     llamada y no una vez al cargar: la preferencia puede cambiar mientras la
     página está abierta, y este módulo no la cachea por su cuenta. */
  function aplicar(el, intencion) {
    var clase = claseDe(intencion);
    if (!clase) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add(clase);
  }

  return { claseDe: claseDe, aplicar: aplicar };
})();
