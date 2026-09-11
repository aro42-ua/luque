window.MovilZoom = (function () {

  /* El tope natural es 1:1 con los pixeles del archivo —«hasta los pixeles
     reales» de la spec—, pero lo que `maxEscala` recibe es el ANCHO, y las
     piezas del contenido real son de 2400px de ancho contra los 390 que ronda
     un movil: 6,15x. A esa escala se ve un trozo de foto del tamano de una una
     y el gesto deja de servir para mirar.

     Se acota aqui y no en quien pinta, porque es una decision sobre el gesto y
     no sobre la pantalla. */
  var TOPE = 6;

  function inicial() { return { escala: 1, x: 0, y: 0 }; }

  function ampliado(estado) { return estado.escala > 1; }

  /* `natural` es el ancho del archivo y `pintado` el de la foto en pantalla.
     La guarda cubre a la <img> que aun no ha cargado (naturalWidth 0) y a la
     escena que aun no mide (clientWidth 0): sin ella saldria Infinity o NaN, y
     NaN no da error, sino un transform invalido y silencioso. */
  function maxEscala(natural, pintado) {
    if (!(natural > 0) || !(pintado > 0)) return 1;
    var veces = natural / pintado;
    if (veces < 1) return 1;
    return Math.min(veces, TOPE);
  }

  function distancia(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* Lo que sobra de la foto ampliada por fuera de la PANTALLA, por cada lado:
     el desplazamiento maximo antes de que el borde de la foto se despegue del
     marco y entre fondo negro. Se mide contra el marco y no contra la propia
     foto sin ampliar porque con `object-fit: contain` casi nunca son lo mismo:
     la foto llena un eje y deja franjas en el otro, y en ese otro medir contra
     la foto da un margen que no existe. Con una pieza 2400x3000 en una
     pantalla de 390x844 la foto se pinta a 390x488: a 1,2x sigue cabiendo
     entera de alto —no hay NADA que revelar, el maximo es 0— y medir contra la
     foto dejaria descentrarla 48px sobre franjas negras. */
  function margen(ladoFoto, escala, ladoMarco) {
    return Math.max(0, (ladoFoto * escala - ladoMarco) / 2);
  }

  function acotar(v, limite) {
    return Math.max(-limite, Math.min(limite, v));
  }

  /* `medidas` son las dos cajas que hacen falta para acotar y que NO coinciden:
     `foto` es la foto tal y como esta pintada y `marco` es la escena, o sea la
     pantalla. Entran como dato y no se preguntan al DOM aqui: este modulo es
     puro, y esa pureza es lo que deja probar el acotado sin navegador.

     El unico sitio donde se normaliza un estado, y por eso el unico que puede
     decidir que volver por debajo de 1 borra tambien el paseo: si no lo
     borrara, soltar la foto encajada la dejaria descentrada sin que nada
     explicara por que. */
  function encajar(estado, medidas) {
    if (estado.escala <= 1) return inicial();
    return {
      escala: estado.escala,
      x: acotar(estado.x, margen(medidas.foto.ancho, estado.escala, medidas.marco.ancho)),
      y: acotar(estado.y, margen(medidas.foto.alto, estado.escala, medidas.marco.alto))
    };
  }

  /* `base` es el estado con el que EMPEZO el pellizco, no el de la ultima
     llamada, y `d0` la distancia entre dedos en ese mismo instante. Acumulando
     sobre el estado anterior, cada `pointermove` multiplicaria otra vez y el
     mismo gesto daria escalas distintas segun cuantos eventos mandara el
     sistema —que es una cifra del navegador y del dispositivo, no del dedo. */
  function pellizcar(base, d0, d, max, medidas) {
    if (!(d0 > 0) || !(d > 0)) return base;
    var escala = base.escala * (d / d0);
    if (escala < 1) escala = 1;
    if (escala > max) escala = max;
    return encajar({ escala: escala, x: base.x, y: base.y }, medidas);
  }

  /* Sin ampliar devuelve el estado TAL CUAL, y eso es lo que le dice al visor
     que ese dedo no estaba paseando sino navegando. La decision de navegar o
     no la toma quien pinta preguntando por `ampliado`; aqui solo se garantiza
     que arrastrar sobre una foto encajada no puede moverla. */
  function arrastrar(estado, dx, dy, medidas) {
    if (!ampliado(estado)) return estado;
    return encajar({ escala: estado.escala, x: estado.x + dx, y: estado.y + dy }, medidas);
  }

  function transformar(estado) {
    return 'translate(' + estado.x + 'px, ' + estado.y + 'px) scale('
      + estado.escala + ')';
  }

  return {
    TOPE: TOPE,
    inicial: inicial, ampliado: ampliado, maxEscala: maxEscala,
    distancia: distancia, pellizcar: pellizcar, arrastrar: arrastrar,
    transformar: transformar
  };
})();
