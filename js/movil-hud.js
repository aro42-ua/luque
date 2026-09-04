window.MovilHud = (function () {

  /* Tres segundos, y no los dos del escritorio (`js/visor-chrome.js`, la
     constante `OCULTAR_TRAS`). Allí el chrome se despierta con cualquier
     movimiento del ratón: gratis y constante. En táctil hay que tocar a
     propósito, así que despertar cuesta más y el plazo se alarga para
     compensar.

     `VisorChrome` no se generaliza para compartir esto, y es una decisión de la
     spec, no un descuido: su despertar está atado a `mouseenter`/`mouseleave`
     sobre la tira de miniaturas, que en móvil no existe. Tocar un módulo que
     funciona en producción para compartir un temporizador de tres líneas es mal
     negocio. Se duplica el temporizador y se escribe el motivo, que es éste. */
  var OCULTAR_TRAS = 3000;

  var refs = null, reloj = null, despierto = false;
  var alElegirCategoria = null, alCerrar = null;

  /* Dos cifras en los dos lados, igual que la rejilla de la portada: `02/08` y
     no `2/8`, para que el ancho no baile al pasar de la 9 a la 10.

     Devuelve cadena vacía en las dos paradas que no son una pieza: la ficha
     —donde `06/05` sería mentir sobre dónde estás— y el vídeo, que tiene cero
     piezas y donde un `00/00` no dice nada y ocupa sitio sobre la foto. */
  function contador(pieza, total) {
    if (typeof pieza !== 'number') return '';
    return dos(pieza) + '/' + dos(total);
  }

  function dos(n) { return (n < 10 ? '0' : '') + n; }

  function init(elementos, alCategoria, alCerrarVisor) {
    refs = elementos;
    alElegirCategoria = alCategoria;
    alCerrar = alCerrarVisor;
    refs.cerrar.addEventListener('click', function () { alCerrar(); });
    refs.cat.addEventListener('click', function () {
      refs.cats.hidden = !refs.cats.hidden;
      refs.cat.setAttribute('aria-expanded', refs.cats.hidden ? 'false' : 'true');
      despertar();
    });
  }

  function pintar(proyecto, pieza, total) {
    refs.titulo.textContent = proyecto.titulo;
    /* El guion cambiado por espacio, igual que ya hace `VisorFicha.pintar`
       (js/visor-ficha.js): `foto-fija` es un identificador de URL y no algo
       que se le enseñe a nadie. */
    refs.cat.textContent = proyecto.categoria.replace('-', ' ');
    refs.contador.textContent = contador(pieza, total);
    pintarCategorias();
    /* Al llegar a una parada nueva el HUD se despierta: acabas de moverte, así
       que quieres saber dónde has caído. El plazo vuelve a correr desde cero. */
    despertar();
  }

  /* Se vacía antes de rellenar: deslizar repinta el HUD en cada parada, y sin
     esto el desplegable crecería con cada gesto. */
  function pintarCategorias() {
    refs.cats.innerHTML = '';
    refs.cats.hidden = true;
    refs.cat.setAttribute('aria-expanded', 'false');
    var todas = ['todos'].concat(window.Datos.CATEGORIAS);
    todas.forEach(function (c) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mvisor-cat-opcion';
      b.textContent = c === 'todos' ? 'todos' : c.replace('-', ' ');
      b.addEventListener('click', function () { alElegirCategoria(c); });
      li.appendChild(b);
      refs.cats.appendChild(li);
    });
  }

  /* El plazo se reinicia entero en cada despertar. `clearTimeout` sobre `null`
     es inofensivo, así que no hace falta guarda. */
  function despertar() {
    despierto = true;
    refs.raiz.classList.remove('dormido');
    refs.raiz.setAttribute('aria-hidden', 'false');
    clearTimeout(reloj);
    reloj = setTimeout(dormir, OCULTAR_TRAS);
  }

  function dormir() {
    despierto = false;
    refs.raiz.classList.add('dormido');
    /* `aria-hidden` y no `hidden`: el HUD dormido sigue ocupando su sitio y se
       va con una transición de opacidad. Con `hidden` desaparecería de golpe y
       la transición no se vería. */
    refs.raiz.setAttribute('aria-hidden', 'true');
    refs.cats.hidden = true;
    refs.cat.setAttribute('aria-expanded', 'false');
  }

  function visible() { return despierto; }

  return {
    OCULTAR_TRAS: OCULTAR_TRAS,
    contador: contador,
    init: init,
    pintar: pintar,
    despertar: despertar,
    visible: visible
  };
})();
