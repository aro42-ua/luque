import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../estatico/index.js';

/* Este Worker es el de los recursos estáticos ("luque"), no el de la API
   ("luque-api"): no hay identidad que comprobar, la web es pública. Lo único
   que hay que probar es el enrutado -- qué sale de R2, qué cae a los
   estáticos, y que borrador.json no sea alcanzable por ninguna ruta -- así
   que basta con un ALMACEN y un ASSETS simulados, sin red ni despliegue. */

function almacenFalso(objetos = {}) {
  const leidas = [];
  return {
    leidas,
    async get(llave) {
      leidas.push(llave);
      const objeto = objetos[llave];
      if (!objeto) return null;
      return {
        body: objeto.cuerpo,
        httpMetadata: { contentType: objeto.tipo }
      };
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

test('contenido.json presente en R2 se sirve desde ahí, con su tipo', async () => {
  const almacen = almacenFalso({ 'contenido.json': { cuerpo: '{"proyectos":[]}', tipo: 'application/json' } });
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

test('cualquier otra ruta va directa a los estáticos, sin tocar R2', async () => {
  for (const ruta of ['/', '/index.html', '/css/luque.css', '/js/galeria.js', '/imagenes/portada.jpg']) {
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
