import { test } from 'node:test';
import assert from 'node:assert';
import { tipoDeImagen, TOPE_IMAGEN } from '../src/publicar.js';
import worker from '../src/index.js';
import { generarPar, firmarToken, silenciarRegistro } from './apoyo-token.js';

/* La ruta de subida se prueba aparte de publicar.test.js porque son dos
   asuntos distintos —lo que entra al bucket y lo que sale a la web— y juntos
   dejaban un archivo demasiado largo para leerlo de un vistazo. */

test('la extensión decide el tipo, y sólo las de imagen', () => {
  assert.equal(tipoDeImagen('a.jpg', null), 'image/jpeg');
  assert.equal(tipoDeImagen('a.JPEG', null), 'image/jpeg');
  assert.equal(tipoDeImagen('a.png', 'image/png'), 'image/png');
  assert.equal(tipoDeImagen('a.webp', null), 'image/webp');
  assert.equal(tipoDeImagen('a.avif', null), 'image/avif');
  assert.equal(tipoDeImagen('a.gif', null), 'image/gif');

  /* Lo que la revisión usó para colar HTML en el bucket. */
  assert.equal(tipoDeImagen('perfil.html', 'text/html'), null);
  assert.equal(tipoDeImagen('a.svg', 'image/svg+xml'), null, 'un SVG lleva script dentro');
  assert.equal(tipoDeImagen('a.json', 'application/json'), null);
  assert.equal(tipoDeImagen('sin-extension', 'image/jpeg'), null);
  assert.equal(tipoDeImagen('', null), null);
});

test('un content-type que contradice a la extensión no pasa', () => {
  assert.equal(tipoDeImagen('perfil.jpg', 'text/html'), null);
  assert.equal(tipoDeImagen('a.png', 'image/jpeg'), null);
  /* El parámetro sobrante no cuenta, y image/jpg se acepta como sinónimo. */
  assert.equal(tipoDeImagen('a.jpg', 'image/jpeg; charset=binary'), 'image/jpeg');
  assert.equal(tipoDeImagen('a.jpg', 'image/jpg'), 'image/jpeg');
});

const entornoBase = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

const par = await generarPar('K1');
globalThis.fetch = async () => Response.json({ keys: [par.jwk] });
const TOKEN = await firmarToken(par, {
  aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
  exp: Math.floor(Date.now() / 1000) + 3600, email: 'a@x.com'
});

function subir(consulta, cuerpo, cabeceras = {}) {
  return new Request(`https://x/api/imagen${consulta}`, {
    method: 'POST',
    headers: { 'Cf-Access-Jwt-Assertion': TOKEN, ...cabeceras },
    body: cuerpo
  });
}

/* Bucket falso con el get/put/head de R2 y memoria de lo escrito, para poder
   afirmar que una subida rechazada no dejó nada dentro. */
function bucketFalso(existentes = []) {
  const datos = new Map(existentes.map((llave) => [llave, { bytes: 1 }]));
  return {
    ALMACEN: {
      async head(llave) { return datos.get(llave) || null; },
      async put(llave, cuerpo, opciones) {
        datos.set(llave, {
          bytes: cuerpo.byteLength,
          tipo: opciones && opciones.httpMetadata && opciones.httpMetadata.contentType
        });
      },
      async get(llave) { return datos.get(llave) || null; },
      guardado(llave) { return datos.get(llave) || null; },
      get cuantos() { return datos.size; }
    }
  };
}

test('POST /api/imagen sin nombre da 400', async () => {
  const entorno = { ...entornoBase, ...bucketFalso() };
  const r = await worker.fetch(subir('', 'x', { 'content-type': 'image/jpeg' }), entorno);
  assert.equal(r.status, 400);
  assert.equal(entorno.ALMACEN.cuantos, 0);
});

test('POST /api/imagen guarda el cuerpo bajo img/ y devuelve la url', async () => {
  const entorno = { ...entornoBase, ...bucketFalso() };
  const r = await worker.fetch(
    subir('?nombre=../../bruma/01.jpg', 'contenido-de-la-imagen', { 'content-type': 'image/jpeg' }),
    entorno
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { url: '/img/bruma-01.jpg' });

  const guardado = entorno.ALMACEN.guardado('img/bruma-01.jpg');
  assert.ok(guardado, 'la llave saneada es la que se escribe');
  assert.equal(guardado.tipo, 'image/jpeg');
});

/* I1: el tipo que se guarda sale de la extensión, nunca de lo que declara
   quien sube. Si un día se aceptara el declarado, esta prueba lo caza.
   El cuerpo va como Uint8Array a propósito: un cuerpo de texto haría que
   `Request` pusiera `content-type: text/plain` por su cuenta, y entonces la
   prueba estaría midiendo una discrepancia en vez de la ausencia de tipo. */
test('sin content-type, el tipo guardado lo decide la extensión', async () => {
  const entorno = { ...entornoBase, ...bucketFalso() };
  const r = await worker.fetch(subir('?nombre=a.png', new Uint8Array([1, 2, 3])), entorno);
  assert.equal(r.status, 200);
  assert.equal(entorno.ALMACEN.guardado('img/a.png').tipo, 'image/png');
});

/* I1, el caso que borraba en silencio: un POST sin cuerpo llegaba a R2 como
   `null`, creaba un objeto de 0 bytes y respondía 200 — es decir, machacaba
   una imagen ya publicada sin decir nada. */
test('POST /api/imagen sin cuerpo da 400 y no escribe nada', async () => {
  for (const cuerpo of [null, '']) {
    const entorno = { ...entornoBase, ...bucketFalso() };
    const r = await worker.fetch(
      subir('?nombre=a.jpg', cuerpo, { 'content-type': 'image/jpeg' }), entorno
    );
    assert.equal(r.status, 400, 'un cuerpo vacío no es una imagen');
    assert.equal(entorno.ALMACEN.cuantos, 0, 'no puede quedar un objeto de 0 bytes');
  }
});

test('un cuerpo vacío no puede borrar una imagen ya publicada', async () => {
  const entorno = { ...entornoBase, ...bucketFalso(['img/bruma-01.jpg']) };
  const r = await worker.fetch(
    subir('?nombre=bruma-01.jpg', null, { 'content-type': 'image/jpeg' }), entorno
  );
  assert.ok(r.status >= 400, 'no puede responder 200');
  assert.equal(entorno.ALMACEN.guardado('img/bruma-01.jpg').bytes, 1,
    'la imagen que ya estaba sigue intacta');
});

/* I1: sin lista blanca, esto dejaba HTML —y por tanto JavaScript— alojado en
   el dominio desde el que la Tarea 6 va a servir img/. */
test('POST /api/imagen que no es una imagen da 415 y no escribe nada', async () => {
  const casos = [
    ['?nombre=perfil.html', 'text/html'],
    ['?nombre=a.svg', 'image/svg+xml'],
    ['?nombre=a.js', 'application/javascript'],
    ['?nombre=perfil.jpg', 'text/html']
  ];
  for (const [consulta, tipo] of casos) {
    const entorno = { ...entornoBase, ...bucketFalso() };
    const r = await worker.fetch(subir(consulta, '<script>alert(1)</script>', { 'content-type': tipo }), entorno);
    assert.equal(r.status, 415, `${consulta} con ${tipo} no puede entrar`);
    assert.equal(entorno.ALMACEN.cuantos, 0);
  }
});

/* I1: nada limitaba por debajo de los 100 MB que aceptaría el Worker. */
test('POST /api/imagen demasiado grande da 413 y no escribe nada', async () => {
  const entorno = { ...entornoBase, ...bucketFalso() };
  const grande = new Uint8Array(TOPE_IMAGEN + 1);
  const r = await worker.fetch(
    subir('?nombre=a.jpg', grande, { 'content-type': 'image/jpeg' }), entorno
  );
  assert.equal(r.status, 413);
  assert.equal(entorno.ALMACEN.cuantos, 0);
});

test('un Content-Length exagerado se corta antes de leer el cuerpo', async () => {
  const entorno = { ...entornoBase, ...bucketFalso() };
  const r = await worker.fetch(
    subir('?nombre=a.jpg', 'x', { 'content-type': 'image/jpeg', 'content-length': String(TOPE_IMAGEN + 1) }),
    entorno
  );
  assert.equal(r.status, 413);
  assert.equal(entorno.ALMACEN.cuantos, 0);
});

/* I5: `bruma/01.jpg` y `bruma-01.jpg` colapsan en la misma llave al sanear,
   así que dejar pasar la segunda subida perdería una imagen ya publicada sin
   que nadie se entere. Se rechaza en vez de sobrescribir. */
test('subir encima de una imagen existente da 409 y no la pisa', async () => {
  const entorno = { ...entornoBase, ...bucketFalso(['img/bruma-01.jpg']) };
  const r = await worker.fetch(
    subir('?nombre=bruma/01.jpg', 'otra-imagen-distinta', { 'content-type': 'image/jpeg' }),
    entorno
  );
  assert.equal(r.status, 409);
  assert.match((await r.json()).error, /ya hay una imagen/);
  assert.equal(entorno.ALMACEN.guardado('img/bruma-01.jpg').bytes, 1, 'la original no se tocó');
});

test('POST /api/imagen da 500 en castellano si el almacén falla', async (t) => {
  const registro = silenciarRegistro(t);
  const entorno = {
    ...entornoBase,
    ALMACEN: {
      async head() { return null; },
      async put() { throw new Error('R2 unavailable: connection reset'); }
    }
  };
  const r = await worker.fetch(subir('?nombre=a.jpg', 'x', { 'content-type': 'image/jpeg' }), entorno);
  assert.equal(r.status, 500);

  const { error } = await r.json();
  assert.equal(error, 'no se pudo guardar la imagen');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/,
    'el error de R2 no puede llegar al cliente');
  assert.match(registro.join(' '), /connection reset/, 'el detalle queda en el registro');
});
