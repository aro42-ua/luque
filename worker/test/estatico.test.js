import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../estatico/index.js';
import { silenciarRegistro } from './apoyo-token.js';

/* Este Worker es el de los recursos estáticos ("luque"), no el de la API
   ("luque-api"): no hay identidad que comprobar, la web es pública. Lo único
   que hay que probar es el enrutado -- qué sale de R2, qué cae a los
   estáticos, y que borrador.json no sea alcanzable por ninguna ruta -- así
   que basta con un ALMACEN y un ASSETS simulados, sin red ni despliegue.

   Es además la única superficie pública del bloque 3a: todo lo demás está
   detrás de Access. Por eso se prueban también las cabeceras de cada
   respuesta propia, y no sólo el cuerpo y el estado. */

const ETAG = '"abc123"';

function almacenFalso(objetos = {}) {
  const leidas = [];
  return {
    leidas,
    async get(llave) {
      leidas.push(llave);
      const objeto = objetos[llave];
      if (!objeto) return null;
      if (objeto.revienta) throw new Error('R2 unavailable: connection reset');
      return {
        body: objeto.cuerpo,
        httpEtag: objeto.etag ?? ETAG,
        httpMetadata: { contentType: objeto.tipo }
      };
    }
  };
}

/* Un almacén que siempre falla, para el camino de H3. */
function almacenRoto() {
  return {
    leidas: [],
    async get(llave) {
      this.leidas.push(llave);
      throw new Error('R2 unavailable: connection reset');
    }
  };
}

function assetsFalso(respuesta = new Response('estatico', { status: 200 })) {
  const pedidas = [];
  return {
    pedidas,
    async fetch(peticion) {
      pedidas.push(new URL(peticion.url).pathname);
      return respuesta;
    }
  };
}

function entornoCon(almacen, assets) {
  return { ALMACEN: almacen, ASSETS: assets };
}

const conContenido = () => almacenFalso({
  'contenido.json': { cuerpo: '{"proyectos":[]}', tipo: 'application/json' }
});

test('contenido.json presente en R2 se sirve desde ahí, con su tipo', async () => {
  const almacen = conContenido();
  const assets = assetsFalso();

  const r = await worker.fetch(new Request('https://x/contenido.json'), entornoCon(almacen, assets));

  assert.equal(r.status, 200);
  assert.equal(await r.text(), '{"proyectos":[]}');
  assert.equal(r.headers.get('content-type'), 'application/json');
  assert.deepEqual(assets.pedidas, [], 'no hace falta caer a los estáticos si R2 ya tiene el objeto');
});

/* El porqué de la caída: en R2 todavía no hay ningún contenido.json publicado
   el día que este Worker se despliegue -- nadie ha pulsado "publicar"
   todavía --, y sin esta caída la web se quedaría en el estado vacío hasta la
   primera publicación. Sin esta prueba, quitar el `if` de la caída no lo
   notaría nada. */
test('contenido.json ausente en R2 cae a los archivos estáticos de siempre', async () => {
  const almacen = almacenFalso();
  const respuestaEstatica = new Response('{"proyectos":["del-repositorio"]}', { status: 200 });
  const assets = assetsFalso(respuestaEstatica);

  const r = await worker.fetch(new Request('https://x/contenido.json'), entornoCon(almacen, assets));

  assert.equal(r, respuestaEstatica, 'la respuesta es la que da ASSETS.fetch, no una reconstruida');
  assert.deepEqual(assets.pedidas, ['/contenido.json']);
  assert.deepEqual(almacen.leidas, ['contenido.json'], 'se intentó R2 antes de caer, no en vez de intentarlo');
});

test('una imagen presente en R2 se sirve desde ahí, con su tipo', async () => {
  const almacen = almacenFalso({ 'img/bruma-01.jpg': { cuerpo: 'bytes-de-la-imagen', tipo: 'image/jpeg' } });
  const assets = assetsFalso();

  const r = await worker.fetch(new Request('https://x/img/bruma-01.jpg'), entornoCon(almacen, assets));

  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'bytes-de-la-imagen');
  assert.equal(r.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual(assets.pedidas, []);
});

/* /img/* no tiene caída: no existe ningún archivo estático equivalente -- las
   imágenes las sube el panel directamente a R2 --, así que si el objeto no
   está ahí no está en ningún sitio. Cae a un 404 propio en vez de gastar una
   consulta a ASSETS que tampoco lo tiene. */
test('una imagen ausente en R2 da 404 sin llegar a los estáticos', async () => {
  const almacen = almacenFalso();
  const assets = assetsFalso();

  const r = await worker.fetch(new Request('https://x/img/no-existe.jpg'), entornoCon(almacen, assets));

  assert.equal(r.status, 404);
  assert.deepEqual(assets.pedidas, [], 'una imagen que falta no es un archivo estático que probar');
});

/* La prueba que de verdad importa de esta tarea: borrador.json vive en el
   mismo bucket que contenido.json, y la lista de rutas que salen de R2 es
   explícita justo para que esto no sea alcanzable. Si algún día el código se
   generaliza a "cualquier ruta sale de R2 si existe la llave", esta prueba lo
   nota: el simulacro SÍ tiene el objeto y aun así no debe servirlo. */
test('borrador.json no es alcanzable aunque exista en R2', async () => {
  const almacen = almacenFalso({ 'borrador.json': { cuerpo: '{"version":9,"proyectos":["secreto"]}', tipo: 'application/json' } });
  const respuestaEstatica = new Response('No existe', { status: 404 });
  const assets = assetsFalso(respuestaEstatica);

  const r = await worker.fetch(new Request('https://x/borrador.json'), entornoCon(almacen, assets));

  assert.equal(r, respuestaEstatica);
  assert.deepEqual(almacen.leidas, [], 'ni siquiera se le pregunta a R2 por esta llave');
  assert.deepEqual(assets.pedidas, ['/borrador.json']);
});

/* La frontera de startsWith('/img/'). El comentario anterior de esta prueba
   prometía que `/imagenes/portada.jpg` la guardaba, y no la guardaba: el
   cuarto carácter ya no coincide, así que `'/imagenes'.startsWith('/img')` es
   false y ningún mutante del prefijo moría aquí. `/img` (sin barra) y
   `/imgx/foto.jpg` sí la guardan: los dos empiezan por `/img` y sólo se
   separan en el carácter siguiente, que es justo lo que distingue el
   prefijo. */
test('cualquier otra ruta va directa a los estáticos, sin tocar R2', async () => {
  for (const ruta of ['/', '/index.html', '/css/luque.css', '/js/galeria.js',
                      '/imagenes/portada.jpg', '/img', '/imgx/foto.jpg']) {
    const almacen = almacenFalso();
    const assets = assetsFalso();

    await worker.fetch(new Request(`https://x${ruta}`), entornoCon(almacen, assets));

    assert.deepEqual(almacen.leidas, [], `${ruta} no debería tocar R2`);
    assert.deepEqual(assets.pedidas, [ruta]);
  }
});

/* La petición que llega a ASSETS.fetch tiene que ser la original -- método,
   cabeceras, lo que sea -- y no una reconstruida a mano, porque ASSETS la usa
   para decidir cosas como el manejo de rangos o condicionales. */
test('lo que cae a los estáticos recibe la petición original, no una copia', async () => {
  const almacen = almacenFalso();
  let recibida = null;
  const assets = { async fetch(peticion) { recibida = peticion; return new Response('ok'); } };

  const original = new Request('https://x/index.html', { headers: { 'if-none-match': '"abc"' } });
  await worker.fetch(original, entornoCon(almacen, assets));

  assert.equal(recibida, original);
});

/* _headers cierra el sitio entero a los buscadores con X-Robots-Tag, pero esa
   regla no se aplica a lo que responde código de Worker -- es la misma
   salvedad que explica por qué _redirects podría dejar de aplicarse--, así
   que sin fijarla aquí a mano, contenido.json e img/* perderían el cierre a
   buscadores en cuanto se sirvieran desde R2. */
test('lo servido desde R2 sigue cerrado a buscadores', async () => {
  const almacen = almacenFalso({
    'contenido.json': { cuerpo: '{}', tipo: 'application/json' },
    'img/a.jpg': { cuerpo: 'x', tipo: 'image/jpeg' }
  });

  const rContenido = await worker.fetch(new Request('https://x/contenido.json'), entornoCon(almacen, assetsFalso()));
  const rImagen = await worker.fetch(new Request('https://x/img/a.jpg'), entornoCon(almacen, assetsFalso()));

  assert.equal(rContenido.headers.get('x-robots-tag'), 'noindex');
  assert.equal(rImagen.headers.get('x-robots-tag'), 'noindex');
});

/* H4: al arreglo del noindex le faltaba este camino. El 404 propio de /img/*
   era la única respuesta del sitio que se escapaba del cierre a buscadores.
   Se comprueban de paso las otras dos respuestas propias del archivo. */
test('todas las respuestas propias llevan noindex, incluidos los errores', async (t) => {
  silenciarRegistro(t);

  const r404 = await worker.fetch(
    new Request('https://x/img/no-existe.jpg'), entornoCon(almacenFalso(), assetsFalso())
  );
  const r405 = await worker.fetch(
    new Request('https://x/contenido.json', { method: 'POST' }), entornoCon(conContenido(), assetsFalso())
  );
  const r502 = await worker.fetch(
    new Request('https://x/img/a.jpg'), entornoCon(almacenRoto(), assetsFalso())
  );

  assert.equal(r404.status, 404);
  assert.equal(r404.headers.get('x-robots-tag'), 'noindex', 'el 404 de /img/* se escapaba');
  assert.equal(r405.headers.get('x-robots-tag'), 'noindex');
  assert.equal(r502.headers.get('x-robots-tag'), 'noindex');
});

/* H2: el tipo lo decide la ruta, nunca el metadato. El bucket tiene un
   segundo escritor -- subidas a mano por el panel de Cloudflare o
   `wrangler r2 object put` --, así que un objeto con content-type mentiroso
   puede acabar dentro sin pasar por la lista blanca de /api/imagen. Servirlo
   a ciegas ejecutaba su script en el origen público. */
test('un content-type mentiroso en R2 no se reenvía al visitante', async () => {
  const almacen = almacenFalso({
    'img/mal.jpg': { cuerpo: '<script>alert(document.domain)</script>', tipo: 'text/html' }
  });

  const r = await worker.fetch(new Request('https://x/img/mal.jpg'), entornoCon(almacen, assetsFalso()));

  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/jpeg',
    'el tipo sale de la extensión de la ruta, no del metadato del objeto');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff',
    'sin nosniff el navegador puede adivinar un tipo distinto del declarado');
});

/* La decisión de dejar .svg fuera de la lista blanca vivía sólo en el Worker
   de la API. Ahora la comparten los dos, así que lo que se colara en el
   bucket por la puerta de atrás tampoco sale por aquí. */
test('una llave con extensión fuera de la lista blanca no se sirve', async () => {
  for (const [ruta, llave] of [['/img/a.svg', 'img/a.svg'], ['/img/a.html', 'img/a.html'],
                               ['/img/a.js', 'img/a.js'], ['/img/sin-extension', 'img/sin-extension']]) {
    const almacen = almacenFalso({ [llave]: { cuerpo: '<script>alert(1)</script>', tipo: 'image/jpeg' } });

    const r = await worker.fetch(new Request(`https://x${ruta}`), entornoCon(almacen, assetsFalso()));

    assert.equal(r.status, 404, `${ruta} no puede servirse aunque esté en el bucket`);
    assert.deepEqual(almacen.leidas, [], 'ni se le pregunta a R2: lo decide la extensión de la ruta');
  }
});

/* H1: las imágenes son inmutables por construcción -- guardarImagen responde
   409 en vez de sobrescribir --, así que se pueden cachear para siempre. Sin
   estas cabeceras, cada carga de la galería re-descargaba cada foto entera:
   invocación de Worker, operación de Clase B y egreso completo, en una web de
   fotografía. */
test('lo servido desde R2 lleva Cache-Control y ETag', async () => {
  const almacen = almacenFalso({
    'contenido.json': { cuerpo: '{}', tipo: 'application/json' },
    'img/a.jpg': { cuerpo: 'x', tipo: 'image/jpeg' }
  });

  const rContenido = await worker.fetch(new Request('https://x/contenido.json'), entornoCon(almacen, assetsFalso()));
  const rImagen = await worker.fetch(new Request('https://x/img/a.jpg'), entornoCon(almacen, assetsFalso()));

  assert.equal(rContenido.headers.get('cache-control'), 'public, max-age=0, must-revalidate',
    'contenido.json cambia con cada publicación: se revalida siempre');
  assert.equal(rImagen.headers.get('cache-control'), 'public, max-age=31536000, immutable',
    'una URL de /img/ siempre devuelve los mismos bytes');
  assert.equal(rContenido.headers.get('etag'), ETAG);
  assert.equal(rImagen.headers.get('etag'), ETAG);
});

test('If-None-Match con el etag real devuelve 304 y sin cuerpo', async () => {
  const almacen = almacenFalso({ 'img/a.jpg': { cuerpo: 'bytes', tipo: 'image/jpeg' } });

  const r = await worker.fetch(
    new Request('https://x/img/a.jpg', { headers: { 'if-none-match': ETAG } }),
    entornoCon(almacen, assetsFalso())
  );

  assert.equal(r.status, 304);
  assert.equal(await r.text(), '', 'un 304 no lleva cuerpo: es justo lo que ahorra');
  assert.equal(r.headers.get('etag'), ETAG);
  assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
});

test('If-None-Match con un etag viejo devuelve el cuerpo entero', async () => {
  const almacen = almacenFalso({ 'img/a.jpg': { cuerpo: 'bytes', tipo: 'image/jpeg' } });

  const r = await worker.fetch(
    new Request('https://x/img/a.jpg', { headers: { 'if-none-match': '"otro"' } }),
    entornoCon(almacen, assetsFalso())
  );

  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'bytes');
});

/* H3: `get()` devuelve null si no existe y LANZA si el almacén falla. Sin
   capturarlo salía la página 1101 de workerd, en inglés y sin X-Robots-Tag,
   en la ruta de datos de la portada. Las dos ramas dejan rastro en el
   registro para que un fallo de R2 sea distinguible de una primera
   publicación pendiente, que llega al mismo sitio por otro camino. */
test('si R2 falla al leer contenido.json, se cae al estático y queda en el registro', async (t) => {
  const registro = silenciarRegistro(t);
  const respuestaEstatica = new Response('{"proyectos":["del-repositorio"]}', { status: 200 });
  const assets = assetsFalso(respuestaEstatica);

  const r = await worker.fetch(new Request('https://x/contenido.json'), entornoCon(almacenRoto(), assets));

  assert.equal(r, respuestaEstatica, 'hay un archivo servible al lado: mejor eso que una página de error');
  assert.match(registro.join(' '), /connection reset/, 'el fallo de R2 tiene que quedar registrado');
});

test('si R2 falla al leer una imagen, da 502 en castellano y no una página en inglés', async (t) => {
  const registro = silenciarRegistro(t);

  const r = await worker.fetch(new Request('https://x/img/a.jpg'), entornoCon(almacenRoto(), assetsFalso()));

  assert.equal(r.status, 502, 'no hay plan B para una imagen: el fallo se dice');
  const cuerpo = await r.text();
  assert.match(cuerpo, /No se ha podido leer la imagen/);
  assert.doesNotMatch(cuerpo, /R2 unavailable|connection reset/,
    'el error de R2 no puede llegar al cliente');
  assert.match(registro.join(' '), /connection reset/, 'el detalle queda en el registro');
});

/* H5: el enrutador de estáticos contesta 405 a lo que no sea lectura, así que
   dejarlo pasar aquí era superficie gratis. No había riesgo de escritura
   -- el Worker sólo llama a get() --, pero POST /contenido.json devolvía 200
   con el cuerpo entero. */
test('a las rutas de R2 sólo se les puede pedir lectura', async () => {
  for (const metodo of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    const almacen = conContenido();
    const r = await worker.fetch(
      new Request('https://x/contenido.json', { method: metodo }), entornoCon(almacen, assetsFalso())
    );

    assert.equal(r.status, 405, `${metodo} no es una lectura`);
    assert.equal(r.headers.get('allow'), 'GET, HEAD');
    assert.deepEqual(almacen.leidas, [], 'no se llega a tocar R2');
  }
});

test('HEAD sigue siendo una lectura válida', async () => {
  const almacen = almacenFalso({ 'img/a.jpg': { cuerpo: 'bytes', tipo: 'image/jpeg' } });

  const r = await worker.fetch(
    new Request('https://x/img/a.jpg', { method: 'HEAD' }), entornoCon(almacen, assetsFalso())
  );

  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/jpeg');
});
