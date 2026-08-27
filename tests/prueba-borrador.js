/* Prueba de `panel/js/borrador.js`. Se ejecuta desde la raíz del repositorio:
 *
 *     node tests/prueba-borrador.js
 *
 * Sale con código 0 si todo está en verde y con 1 si algo falla, así que sirve
 * tal cual como comprobación previa a un despliegue, igual que
 * `python tests/prueba_auditar_rutas.py`.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTA PRUEBA VIVE AQUÍ Y NO EN LOS OTROS DOS SITIOS
 *
 * `tests/test.html` no vale: es un arnés de navegador que carga scripts planos
 * y `borrador.js` no se puede ejercitar sin sustituir `fetch`. Ojo con el
 * nombre: los archivos `pruebas-*.js` (en plural) de este directorio SON los
 * que carga `test.html`. Éste se llama `prueba-` en singular a propósito,
 * igual que `prueba_auditar_rutas.py`, porque se ejecuta solo y por su cuenta.
 * Añadirlo a `test.html` rompería la página entera: aquí se usan `require` y
 * `vm`, que en un navegador no existen.
 *
 * `worker/test/` tampoco: es del Worker, corre con `node --test` y su
 * `package.json` declara `"type": "module"`. `borrador.js` es del panel, no del
 * Worker; meterlo ahí diría que pertenece a algo a lo que no pertenece, y quien
 * un día se llevara el Worker se llevaría de paso la única prueba del panel.
 *
 * Y `node --test` no se puede usar ni aquí: intercepta los rechazos de promesa
 * sin manejar y da la prueba por fallada aunque haya un `process.on(
 * 'unhandledRejection')` puesto — comprobado. Justo el escenario C1 depende de
 * que la excepción de quien llama SALGA como rechazo sin manejar, así que el
 * corredor tiene que ser de andar por casa, como el de `tests/arnes.js`.
 *
 * ---------------------------------------------------------------------------
 * QUÉ VIGILA, Y POR QUÉ CADA COSA
 *
 * Los tres defectos que esta prueba existe para que no vuelvan salieron de una
 * revisión, no de leer el código: los tres estaban a la vista y nadie los vio.
 *
 *   C1  `alTerminar` se llamaba DOS veces. El `.catch()` que colgaba del
 *       `.then()` capturaba también lo que lanzara el callback de quien llama,
 *       y lo volvía a invocar con un error de red inventado. Un fallo de
 *       pintado de la pantalla se leía como «no se ha podido cargar el
 *       contenido» y se buscaba en la red durante horas.
 *
 *   C2  Se enseñaban al usuario mensajes en inglés del motor —«Failed to
 *       fetch», «Unexpected token '<'»—. El caso que lo destapa es el más
 *       probable de todos: la sesión de Access caduca con el panel abierto y el
 *       servidor contesta la página de inicio de sesión, que es HTML y no JSON.
 *
 *   I3  `cargar` tiraba el `{error}` en castellano que el Worker sí manda y
 *       ponía el número del estado a secas.
 *
 *   R4  El aviso de «no se ha podido contactar con el servidor» nombraba una
 *       sola causa. En producción salió cuando lo que fallaba era la SESIÓN, y
 *       mandó a mirar el wifi a quien sólo tenía que volver a entrar. Los dos
 *       casos son indistinguibles desde aquí —lo explica `borrador.js`—, así
 *       que el mensaje nombra los dos y da primero la acción que arregla el
 *       frecuente. Y la acción NO es la misma en las dos funciones: a quien no
 *       pudo guardar no se le puede mandar recargar, que le borraría lo suyo.
 *
 * Cada comprobación de aquí CAE si se revierte su arreglo. Eso no se afirma: se
 * comprueba, y cualquiera lo puede repetir, porque se le puede pasar OTRO
 * archivo como argumento:
 *
 *     git show 0976b1d:panel/js/borrador.js > /tmp/viejo.js
 *     node tests/prueba-borrador.js /tmp/viejo.js
 *
 * Contra aquella versión pasan 17 comprobaciones y caen 35. Una prueba que pasa
 * con el código roto no es una prueba, y ésta es la forma de asegurarse de que
 * éstas no lo son.
 *
 * Con una salvedad que conviene saber, porque es la única de las 52 que NO cae
 * al revertir: C1d. Volver al `.catch()` colgando no la rompe, porque el
 * `.catch()` sólo dispara dos veces cuando lo que lanza es el manejador de
 * ÉXITO; en la rama de error ya llamaba una sola vez. C1d se queda porque
 * vigila la otra regresión, la del arreglo a medias: si alguien deja el
 * `.then(alBien, alMal)` y le cuelga además un `.catch()` detrás —que es el
 * apaño que parece razonable—, C1d es la que lo caza. Comprobado también.
 */
var fs = require('fs');
var vm = require('vm');
var path = require('path');

var FUENTE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'panel', 'js', 'borrador.js');
var fuente = fs.readFileSync(FUENTE, 'utf8');

/* Los rechazos sin manejar son parte de lo que se comprueba, no un accidente:
   cuando el callback de quien llama lanza, esa excepción tiene que salir por
   aquí y no disfrazada de error de red. Con este oyente puesto, Node no tumba
   el proceso y podemos afirmar sobre ella. */
var sinManejar = [];
process.on('unhandledRejection', function (e) {
  sinManejar.push(e && e.message ? e.message : String(e));
});

/* Ninguna de estas cadenas puede llegar nunca a los ojos de la fotógrafa: son
   texto del motor, en inglés, o el rastro de un fallo de programación. Es el
   mismo defecto que el Worker ya cerró dos veces en su `fallo()`. */
var FUGAS = /Failed to fetch|Unexpected token|is not valid JSON|DOCTYPE|undefined|Cannot read propert/;

/* Todo lo que el módulo entrega como error a lo largo de la prueba se acumula
   aquí y se filtra al final. Así una rama de error que se añada mañana queda
   vigilada sin que nadie tenga que acordarse de vigilarla. */
var mensajesAlUsuario = [];

// ---------------------------------------------------------------- el corredor

var pasadas = 0;
var fallidas = 0;
var escenarios = 0;
var pendientes = [];

function comprobar(nombre, condicion, visto) {
  if (condicion) {
    pasadas++;
    console.log('  PASA   ' + nombre);
  } else {
    fallidas++;
    console.log('  FALLA  ' + nombre + '  — visto: ' + JSON.stringify(visto));
  }
}

/* `fn` recibe un montaje limpio y devuelve una promesa. Se encadenan de uno en
   uno para que la salida se lea en orden y para que ningún escenario vea el
   registro ni los rechazos del anterior. */
function escenario(nombre, guarda, fn) {
  escenarios++;
  pendientes.push(function () {
    console.log('\n' + nombre + '   [' + guarda + ']');
    sinManejar.length = 0;
    return Promise.resolve()
      .then(fn)
      .catch(function (e) {
        fallidas++;
        console.log('  FALLA  el escenario entero se cayó — ' + e.message);
      });
  });
}

/* Deja correr las microtareas pendientes de la cadena de promesas del módulo.
   Es lo que hace que «se llama una sola vez» signifique algo: sin esperar, la
   segunda llamada aún no habría ocurrido y la prueba pasaría en falso. */
function reposar() {
  return new Promise(function (r) { setTimeout(r, 20); });
}

// -------------------------------------------------------- el doble de `fetch`

function respuesta(estado, texto) {
  return {
    status: estado,
    ok: estado >= 200 && estado < 300,
    text: function () { return Promise.resolve(texto); },
    json: function () { return Promise.resolve(JSON.parse(texto)); }
  };
}

/* Carga `borrador.js` tal cual —sin tocarlo ni envolverlo— en un contexto
   aislado donde `fetch` y `console` son nuestros. Cada escenario monta el suyo,
   así que no arrastran estado. */
function montar(responder) {
  var registro = [];
  var peticiones = [];
  var caja = {
    window: {},
    fetch: function (url, opciones) {
      peticiones.push({ url: url, opciones: opciones || {} });
      return responder(url, opciones);
    },
    console: {
      error: function () {
        registro.push(Array.prototype.slice.call(arguments).join(' '));
      }
    }
  };
  vm.createContext(caja);
  vm.runInContext(fuente, caja, { filename: FUENTE });
  return { B: caja.window.Borrador, registro: registro, peticiones: peticiones };
}

/* El callback que lanza. Es exactamente el bug de pintado que la Tarea 4 puede
   tener cualquier día: `panel.js` llama a `repintar()` dentro del callback de
   `cargar`, así que este escenario no es hipotético, es su camino de cada día. */
function queLanza(cesta) {
  return function (a, b) {
    cesta.push({ primero: a, segundo: b });
    var proyecto;
    return proyecto.nombre;          // TypeError a propósito
  };
}

function anotarError(texto) {
  if (typeof texto === 'string') mensajesAlUsuario.push(texto);
  return texto;
}

/* «Aparece `a`, aparece `b`, y `b` va después». Con `indexOf` a secas esto se
   escribiría `texto.indexOf(b) > texto.indexOf(a)`, que da un PASA falso
   cuando `a` no está: -1 es menor que cualquier posición. Exigir que los dos
   aparezcan es lo que hace que la comprobación signifique algo. */
function vaDespuesDe(texto, a, b) {
  var i = texto.indexOf(a);
  var j = texto.indexOf(b);
  return i !== -1 && j !== -1 && j > i;
}

// =============================================================================
// C1 — `alTerminar` se llama UNA sola vez, incluso si el callback lanza
// =============================================================================

escenario('C1a  cargar: el callback lanza en el caso bueno', 'C1', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(200, '{"version":1,"proyectos":[]}'));
  });
  var llamadas = [];
  m.B.cargar(queLanza(llamadas));
  return reposar().then(function () {
    llamadas.forEach(function (l, i) {
      console.log('    llamada #' + (i + 1) + '  ' + JSON.stringify(l));
    });
    comprobar('alTerminar se llama UNA sola vez', llamadas.length === 1, llamadas.length);
    comprobar('la única llamada es la buena',
      llamadas.length === 1 && llamadas[0].segundo === null
        && llamadas[0].primero.version === 1, llamadas[0]);
    comprobar('la excepción de quien llama sale como rechazo sin manejar, no disfrazada',
      sinManejar.length === 1 && /Cannot read propert/.test(sinManejar[0]), sinManejar);
  });
});

escenario('C1b  guardar: el callback lanza en el caso bueno', 'C1', function () {
  var m = montar(function () { return Promise.resolve(respuesta(200, '{"version":4}')); });
  var llamadas = [];
  m.B.guardar({ version: 3, proyectos: [] }, queLanza(llamadas));
  return reposar().then(function () {
    comprobar('alTerminar se llama UNA sola vez', llamadas.length === 1, llamadas.length);
    comprobar('la única llamada trae la versión nueva',
      llamadas.length === 1 && llamadas[0].segundo === null
        && llamadas[0].primero.version === 4, llamadas[0]);
  });
});

/* El más valioso de los cuatro: es el que la Tarea 4 usa para pintar el aviso
   de «alguien ha guardado mientras editabas», así que es el que más
   probablemente lance el día que ese aviso tenga un fallo. */
escenario('C1c  guardar: el callback lanza en el conflicto 409', 'C1', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(409, '{"error":"el contenido cambió","guardada":7}'));
  });
  var llamadas = [];
  m.B.guardar({ version: 3, proyectos: [] }, queLanza(llamadas));
  return reposar().then(function () {
    comprobar('alTerminar se llama UNA sola vez', llamadas.length === 1, llamadas.length);
    comprobar('el conflicto llega como RESULTADO y no como error',
      llamadas.length === 1 && llamadas[0].segundo === null
        && llamadas[0].primero.conflicto === true
        && llamadas[0].primero.guardada === 7, llamadas[0]);
  });
});

escenario('C1d  cargar: el callback lanza en la rama de error', 'C1', function () {
  var m = montar(function () { return Promise.reject(new TypeError('Failed to fetch')); });
  var llamadas = [];
  m.B.cargar(queLanza(llamadas));
  return reposar().then(function () {
    comprobar('alTerminar se llama UNA sola vez', llamadas.length === 1, llamadas.length);
    comprobar('lo que recibió es el error, no unos datos',
      llamadas.length === 1 && llamadas[0].primero === null, llamadas[0]);
  });
});

// =============================================================================
// C2 — nada en inglés en pantalla; el detalle, al registro
// =============================================================================

var PAGINA_DE_ACCESS =
  '<!DOCTYPE html><html><head><title>Sign in</title></head><body>Access</body></html>';

escenario('C2a  cargar: la sesión de Access caducó y llega HTML', 'C2', function () {
  var m = montar(function () { return Promise.resolve(respuesta(200, PAGINA_DE_ACCESS)); });
  var recibido = null;
  m.B.cargar(function (d, e) { recibido = { datos: d, error: anotarError(e) }; });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    console.log('    registro: ' + JSON.stringify(m.registro));
    comprobar('datos es null', recibido.datos === null, recibido.datos);
    comprobar('el mensaje no trae inglés ni detalle del motor',
      !FUGAS.test(recibido.error), recibido.error);
    /* Aquí SÍ se sabe qué pasó —llegó la página de inicio de sesión—, así que
       el mensaje no tiene por qué dudar ni sacar a pasear la conexión. */
    comprobar('dice que la sesión ha caducado, sin dudar',
      /la sesi.n ha caducado/.test(recibido.error), recibido.error);
    comprobar('manda recargar, que al cargar no cuesta nada',
      /[Rr]ecarga la p.gina/.test(recibido.error), recibido.error);
    comprobar('no marea con la conexión cuando la causa se conoce',
      !/revisa la conexi.n/.test(recibido.error), recibido.error);
    comprobar('el DOCTYPE queda en console.error, que es donde sirve',
      m.registro.length === 1 && /DOCTYPE/.test(m.registro[0]), m.registro);
  });
});

escenario('C2b  guardar: la sesión de Access caducó y llega HTML', 'C2', function () {
  var m = montar(function () { return Promise.resolve(respuesta(200, PAGINA_DE_ACCESS)); });
  var recibido = null;
  m.B.guardar({ version: 1, proyectos: [] }, function (r, e) {
    recibido = { resultado: r, error: anotarError(e) };
  });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    comprobar('el mensaje no trae inglés', !FUGAS.test(recibido.error), recibido.error);
    comprobar('dice que la sesión ha caducado, sin dudar',
      /la sesi.n ha caducado/.test(recibido.error), recibido.error);
    comprobar('promete que no se ha perdido lo escrito',
      /Lo que has escrito sigue aqu/.test(recibido.error), recibido.error);
    /* La que más importa de este escenario: a quien no ha podido GUARDAR no se
       le puede mandar recargar. Recargar borraría justo lo que no se guardó. */
    comprobar('NO manda recargar: lo perdería todo',
      !/[Rr]ecarga la p.gina/.test(recibido.error), recibido.error);
    comprobar('le da la salida buena: otra pestaña y repetir',
      /otra pesta.a/.test(recibido.error) && /sin recargar/.test(recibido.error),
      recibido.error);
    comprobar('el detalle queda en el registro',
      m.registro.length === 1 && /DOCTYPE/.test(m.registro[0]), m.registro);
  });
});

/* Los dos escenarios que siguen mandan el MISMO error, y ése es justo el
   asunto. Cuando la sesión de Access caduca, Access redirige a
   `ffffffstudio.cloudflareaccess.com` —otro origen—, el navegador bloquea la
   redirección por falta de CORS, y lo que llega es un `TypeError` idéntico al
   de un cable desenchufado. Se vio en producción: el aviso decía «no se ha
   podido contactar con el servidor» y mandó a mirar el wifi a quien sólo tenía
   que volver a entrar. Como no se pueden separar, el mensaje nombra las dos
   causas y pone primero la acción que arregla la frecuente. */
var TYPEERROR_DE_ACCESS_O_DE_LA_RED = new TypeError('Failed to fetch');

escenario('C2c  guardar: Access redirigió fuera, o se cayó la red', 'C2', function () {
  var m = montar(function () { return Promise.reject(TYPEERROR_DE_ACCESS_O_DE_LA_RED); });
  var recibido = null;
  m.B.guardar({ version: 1, proyectos: [] }, function (r, e) {
    recibido = { resultado: r, error: anotarError(e) };
  });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    console.log('    registro: ' + JSON.stringify(m.registro));
    comprobar('el mensaje no trae inglés', !FUGAS.test(recibido.error), recibido.error);
    comprobar('dice que no se ha podido contactar con el servidor',
      /no se ha podido contactar con el servidor/.test(recibido.error), recibido.error);
    /* Las dos causas, porque no se pueden distinguir. Nombrar sólo la conexión
       fue exactamente el fallo que se vio en producción. */
    comprobar('nombra también la sesión, no sólo la conexión',
      /[Pp]uede que la sesi.n haya caducado/.test(recibido.error), recibido.error);
    comprobar('menciona la conexión, pero la última',
      vaDespuesDe(recibido.error, 'sesión haya caducado', 'revisa la conexi'),
      recibido.error);
    comprobar('promete que no se ha perdido lo escrito',
      /Lo que has escrito sigue aqu/.test(recibido.error), recibido.error);
    comprobar('NO manda recargar: lo perdería todo',
      !/[Rr]ecarga la p.gina/.test(recibido.error), recibido.error);
    comprobar('le da la salida buena: otra pestaña y repetir',
      /otra pesta.a/.test(recibido.error) && /sin recargar/.test(recibido.error),
      recibido.error);
    comprobar('«Failed to fetch» sólo en el registro',
      m.registro.length === 1 && /Failed to fetch/.test(m.registro[0]), m.registro);
  });
});

/* El caso exacto que se vio en producción: el panel arrancó sin sesión válida
   para la API y el aviso hablaba sólo de la conexión. */
escenario('C2d  cargar: Access redirigió fuera, o se cayó la red', 'C2', function () {
  var m = montar(function () { return Promise.reject(TYPEERROR_DE_ACCESS_O_DE_LA_RED); });
  var recibido = null;
  m.B.cargar(function (d, e) { recibido = { datos: d, error: anotarError(e) }; });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    comprobar('el mensaje no trae inglés', !FUGAS.test(recibido.error), recibido.error);
    comprobar('datos es null', recibido.datos === null, recibido.datos);
    comprobar('nombra también la sesión, no sólo la conexión',
      /[Pp]uede que la sesi.n haya caducado/.test(recibido.error), recibido.error);
    comprobar('da la acción que arregla lo frecuente: recargar',
      /[Rr]ecarga la p.gina para volver a entrar/.test(recibido.error), recibido.error);
    comprobar('menciona la conexión, pero la última',
      vaDespuesDe(recibido.error, 'recarga la página', 'revisa la conexi'),
      recibido.error);
  });
});

// =============================================================================
// I3 — `cargar` enseña el mensaje que el Worker sí manda
// =============================================================================

escenario('I3a  cargar: 500 del Worker con {error} en castellano', 'I3', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(500, '{"error":"no se pudo leer el borrador guardado"}'));
  });
  var recibido = null;
  m.B.cargar(function (d, e) { recibido = { datos: d, error: anotarError(e) }; });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    comprobar('el mensaje del Worker llega entero al usuario',
      /no se pudo leer el borrador guardado/.test(recibido.error), recibido.error);
    comprobar('ya no se arma «el servidor respondió 500» a secas',
      !/contenido: el servidor respondi. 500/.test(recibido.error), recibido.error);
    comprobar('el 500 queda registrado', m.registro.length === 1, m.registro);
  });
});

escenario('I3b  cargar: un error sin {error} en el cuerpo', 'I3', function () {
  var m = montar(function () { return Promise.resolve(respuesta(503, '{}')); });
  var recibido = null;
  m.B.cargar(function (d, e) { recibido = { datos: d, error: anotarError(e) }; });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    comprobar('el respaldo es castellano y va bien puntuado',
      /el servidor respondi. 503\.$/.test(recibido.error), recibido.error);
  });
});

// =============================================================================
// Los cuatro finales, y la sesión que viaja
// =============================================================================

escenario('F0  cargar: el caso bueno', 'contrato', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(200, '{"version":3,"proyectos":[{"id":"bruma"}]}'));
  });
  var recibido = null;
  m.B.cargar(function (d, e) { recibido = { datos: d, error: e }; });
  return reposar().then(function () {
    comprobar('error null y datos completos',
      recibido.error === null && recibido.datos.version === 3
        && recibido.datos.proyectos[0].id === 'bruma', recibido);
    comprobar('un caso bueno no ensucia el registro', m.registro.length === 0, m.registro);
  });
});

escenario('F1  guardar 200: devuelve la versión nueva', 'contrato', function () {
  var m = montar(function () { return Promise.resolve(respuesta(200, '{"version":9}')); });
  var recibido = null;
  m.B.guardar({ version: 8, proyectos: [] }, function (r, e) {
    recibido = { resultado: r, error: e };
  });
  return reposar().then(function () {
    comprobar('resultado {version:9} y error null',
      recibido.error === null && recibido.resultado.version === 9, recibido);
    comprobar('un guardado bueno no ensucia el registro', m.registro.length === 0, m.registro);
  });
});

escenario('F2  guardar 409: el conflicto es un resultado, no un error', 'contrato', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(409,
      '{"error":"el contenido cambió mientras editabas","guardada":12}'));
  });
  var recibido = null;
  m.B.guardar({ version: 8, proyectos: [] }, function (r, e) {
    recibido = { resultado: r, error: e };
  });
  return reposar().then(function () {
    comprobar('error null, conflicto true y la versión que hay guardada',
      recibido.error === null && recibido.resultado.conflicto === true
        && recibido.resultado.guardada === 12, recibido);
    comprobar('un conflicto no ensucia el registro: no es un fallo nuestro',
      m.registro.length === 0, m.registro);
  });
});

escenario('F3  guardar 400: es fallo del panel, se avisa Y se registra', 'contrato', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(400,
      '{"error":"el cuerpo de la petición no es JSON válido"}'));
  });
  var recibido = null;
  m.B.guardar({ version: 'x', proyectos: [] }, function (r, e) {
    recibido = { resultado: r, error: anotarError(e) };
  });
  return reposar().then(function () {
    console.log('    error   : ' + recibido.error);
    console.log('    registro: ' + JSON.stringify(m.registro));
    comprobar('resultado null', recibido.resultado === null, recibido.resultado);
    comprobar('el mensaje del servidor llega entero',
      /el cuerpo de la petición no es JSON válido/.test(recibido.error), recibido.error);
    comprobar('el 400 queda registrado para poder arreglarlo',
      m.registro.length === 1 && /PUT respondi. 400/.test(m.registro[0]), m.registro);
    comprobar('la frase queda bien puntuada al pegarle la cola',
      /v.lido\. Lo que has escrito sigue aqu/.test(recibido.error), recibido.error);
  });
});

escenario('CR  la sesión de Access viaja en las dos peticiones', 'credentials', function () {
  var m = montar(function () {
    return Promise.resolve(respuesta(200, '{"version":1,"proyectos":[]}'));
  });
  m.B.cargar(function () {});
  m.B.guardar({ version: 1, proyectos: [] }, function () {});
  return reposar().then(function () {
    console.log('    ' + JSON.stringify(m.peticiones.map(function (p) {
      return { metodo: p.opciones.method || 'GET', credentials: p.opciones.credentials };
    })));
    comprobar('el GET lleva credentials same-origin',
      m.peticiones[0].opciones.credentials === 'same-origin', m.peticiones[0].opciones);
    comprobar('el PUT lleva credentials same-origin',
      m.peticiones[1].opciones.credentials === 'same-origin', m.peticiones[1].opciones);
    comprobar('las dos van a /api/borrador',
      m.peticiones[0].url === '/api/borrador' && m.peticiones[1].url === '/api/borrador'
        && m.B.RUTA === '/api/borrador', m.peticiones.map(function (p) { return p.url; }));
  });
});

// =============================================================================

pendientes.reduce(function (cadena, p) { return cadena.then(p); }, Promise.resolve())
  .then(function () {
    console.log('\nRED DE SEGURIDAD   [C2]');
    /* Vale para las ramas de error de hoy y para las que se añadan mañana. */
    var sucios = mensajesAlUsuario.filter(function (t) { return FUGAS.test(t); });
    comprobar('ninguno de los ' + mensajesAlUsuario.length
      + ' mensajes al usuario se le escapa en inglés', sucios.length === 0, sucios);

    console.log('\n' + escenarios + ' escenarios, ' + (pasadas + fallidas)
      + ' comprobaciones: ' + pasadas + ' pasan, ' + fallidas + ' fallan.');
    console.log(fallidas === 0 ? 'TODO EN VERDE' : 'HAY COMPROBACIONES EN ROJO');
    process.exit(fallidas === 0 ? 0 : 1);
  });
