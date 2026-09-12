window.Router = (function () {
  var suscriptores = [];

  /* Deja un fragmento en su forma canónica, sin almohadilla, sin barra inicial
     y sin espacios alrededor. El mismo sitio puede llegar escrito de varias
     formas —'#/bruma', '#bruma', 'bruma', con espacios de más— según quién
     construya el enlace, así que todo el router lo compara ya normalizado:
     tanto al leer la ruta como al decidir si ya se está donde se quiere ir. */
  function normalizar(fragmento) {
    return String(fragmento == null ? '' : fragmento).replace(/^#/, '').replace(/^\//, '').trim();
  }

  /* La ruta tiene como mucho dos tramos: `#/bruma/3`. El primero dice qué se
     abre; el segundo, dónde se está dentro de eso. `piezasPorId` mapea cada
     proyecto que existe con cuántas piezas tiene, y sus claves son la lista de
     proyectos válidos: separarlas en dos parámetros dejaba abierta la puerta a
     llamar con uno y sin el otro. */
  function parsearRuta(fragmento, categorias, piezasPorId) {
    var limpio = normalizar(fragmento);
    if (!limpio) return { tipo: 'todos', valor: null, pieza: null };

    var tramos = limpio.split('/');
    var cabeza = tramos[0].trim();

    if (categorias.indexOf(cabeza) !== -1) {
      /* Una categoría no tiene piezas. Si el enlace trae un segundo tramo se
         ignora, en vez de tirar la ruta entera: conserva lo que sí traía bien. */
      return { tipo: 'categoria', valor: cabeza, pieza: null };
    }

    /* La hoja de contacto es una palabra reservada, detrás de las categorías
       y delante de los proyectos: un proyecto que se llamara `contacto`
       quedaría tapado, y es preferible a que un enlace de contacto abra un
       trabajo. Tampoco tiene piezas: un segundo tramo se ignora, como en las
       categorías. */
    if (cabeza === 'contacto') return { tipo: 'contacto', valor: null, pieza: null };

    /* `hasOwnProperty` y no `in`: sin esto, `#/constructor` y `#/toString`
       pasarían por proyectos, porque esas claves están en el prototipo de
       cualquier objeto. */
    if (Object.prototype.hasOwnProperty.call(piezasPorId, cabeza)) {
      return { tipo: 'proyecto', valor: cabeza,
               pieza: parsearPieza(tramos, piezasPorId[cabeza]) };
    }

    return { tipo: 'todos', valor: null, pieza: null };
  }

  /* Devuelve el número de pieza (desde 1), la cadena 'ficha', o null si el
     tramo no se entiende o se sale de rango. Null significa «este proyecto,
     por su portada»: el fallo menos destructivo, porque conserva el proyecto
     que el enlace sí acertó. */
  function parsearPieza(tramos, cuantasPiezas) {
    if (tramos.length !== 2) return null;      // ni un solo tramo, ni tres
    var cola = tramos[1].trim();
    if (cola === 'ficha') return 'ficha';      // vale incluso con cero piezas
    if (!/^[0-9]+$/.test(cola)) return null;   // descarta '', '-2', '2.5', 'abc'
    var n = Number(cola);
    if (n < 1 || n > cuantasPiezas) return null;
    return n;
  }

  /* Construye el fragmento que le corresponde a un destino. La portada general
     no tiene fragmento: se va a la URL desnuda. */
  function hashDe(destino) {
    if (destino.tipo === 'todos') return '';
    if (destino.tipo === 'contacto') return '#/contacto';
    var h = '#/' + destino.valor;
    if (destino.tipo === 'proyecto' && destino.pieza != null) h += '/' + destino.pieza;
    return h;
  }

  /* Decide qué hacer con el historial al ir a `destino` estando en
     `hashActual`. Es puro a propósito: la regla de empujar-o-reemplazar es lo
     que hace que salir de un proyecto de ocho fotos cueste un «atrás» y no
     ocho, y probarla navegando de verdad ensuciaría el historial del navegador
     de quien corre las pruebas — el historial de un iframe es el de su padre. */
  function decidir(hashActual, destino) {
    var hash = hashDe(destino);

    if (normalizar(hashActual) === normalizar(hash)) {
      return { accion: 'avisar', hash: hash };
    }

    /* Moverse dentro del mismo proyecto —otra foto, o la ficha— reemplaza. */
    var actual = normalizar(hashActual).split('/');
    if (destino.tipo === 'proyecto' && actual[0] === destino.valor) {
      return { accion: 'reemplazar', hash: hash };
    }

    /* La portada general reemplaza, que es lo que ya hacía el router antes de
       este bloque. Se conserva a propósito: cambiarlo sería tocar el
       escritorio publicado, y este bloque no hace eso. */
    if (destino.tipo === 'todos') {
      return { accion: 'reemplazar', hash: hash };
    }

    return { accion: 'empujar', hash: hash };
  }

  function piezasPorId() {
    var mapa = {};
    window.Datos.PROYECTOS.forEach(function (p) {
      mapa[p.id] = (p.piezas && p.piezas.length) || 0;
    });
    return mapa;
  }

  function rutaActual() {
    return parsearRuta(location.hash, window.Datos.CATEGORIAS, piezasPorId());
  }

  /* La capa impura, y a propósito nada más que eso: la decisión está en
     `decidir`, que es pura y está cubierta. Aquí sólo se aplica.

     Los dos caminos avisan de forma distinta y no es un descuido:
     `location.hash = ...` dispara `hashchange`, que ya está suscrito en `init`
     y llama a `avisar` solo —de forma asíncrona—. `history.replaceState` no
     dispara nada, así que ahí hay que avisar a mano. */
  function ir(tipo, valor, pieza) {
    var plan = decidir(location.hash, {
      tipo: tipo,
      valor: valor,
      /* NO lo cambies por `pieza || null`, que es la simplificación evidente:
         con `||`, la pieza `0` se convertiría en `null` y el destino perdería
         el tramo. Hoy `0` no es una pieza válida —se cuenta desde 1—, así que
         la suite entera pasa igual con `||` y nadie se enteraría; pero esa
         coerción es justo la que sobrevive a un cambio de criterio y falla dos
         bloques después. El escritorio llama a `ir` con dos argumentos
         (js/galeria.js, el clic del menú de categorías en Galeria.init, sobre
         las líneas 231-232; js/visor.js:41,129-130), y esta línea normaliza
         ese `undefined` a `null` para que el destino que ve `decidir` sea
         siempre canónico. Comprobado: `hashDe` toleraría el `undefined` tal
         cual, porque `undefined != null` es false y el tramo no se añade
         igualmente; no es esa la razón de la línea, la razón es el `||`. */
      pieza: pieza === undefined ? null : pieza
    });

    if (plan.accion === 'empujar') {
      location.hash = plan.hash;
      return;
    }
    if (plan.accion === 'reemplazar') {
      history.replaceState(null, '', location.pathname + location.search + plan.hash);
    }
    avisar();
  }

  function avisar() {
    var ruta = rutaActual();
    suscriptores.forEach(function (fn) { fn(ruta); });
  }

  function alCambiar(fn) { suscriptores.push(fn); }

  function init() {
    window.addEventListener('hashchange', avisar);
    avisar();
  }

  return {
    parsearRuta: parsearRuta,
    decidir: decidir,
    rutaActual: rutaActual,
    ir: ir,
    alCambiar: alCambiar,
    init: init
  };
})();
