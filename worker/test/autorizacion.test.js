import { test } from 'node:test';
import assert from 'node:assert';
import { identificar, correoPermitido } from '../src/identidad.js';
import worker from '../src/index.js';
import { generarPar, firmarToken, silenciarRegistro } from './apoyo-token.js';

/* Esto es el criterio de aceptación 5, y hasta la revisión final no lo probaba
   nadie. `identidad.test.js` ataca la criptografía —rotación de claves, kid
   desconocido, firma que no cuadra— y todas sus pruebas firman las mismas
   reclamaciones buenas. Es decir: se probaba lo difícil y se daba por hecho lo
   importante, que es *quién dice ser* el token. La revisión lo demostró
   sustituyendo por `if (false)` la lista blanca de correos y la comprobación
   entera de aud/iss/exp dentro de `identificar()`: las 60 pruebas seguían en
   verde con la puerta abierta de par en par.

   Por eso este archivo va aparte y no dentro de identidad.test.js: son dos
   asuntos distintos y el que faltaba merece verse solo. Todos los tokens de
   aquí van **bien firmados con la clave buena**; lo único que cambia son las
   reclamaciones. Si una de estas pruebas se pone verde por la firma, no está
   probando nada — de ahí la prueba de control del final. */

const ENTORNO = { CORREOS_AUTORIZADOS: 'a@x.com,b@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

const par = await generarPar('K1');
globalThis.fetch = async () => Response.json({ keys: [par.jwk] });

const ahora = () => Math.floor(Date.now() / 1000);

/* Las mismas reclamaciones buenas de siempre, con un solo campo estropeado.
   Escribirlas enteras en cada prueba escondería cuál es el campo que se ataca. */
function tokenCon(cambios) {
  return firmarToken(par, {
    aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
    exp: ahora() + 3600, email: 'a@x.com', ...cambios
  });
}

const peticionCon = (token) =>
  new Request('https://x/api/borrador', { headers: { 'Cf-Access-Jwt-Assertion': token } });

test('un correo que no está en la lista no entra, aunque el token sea bueno', async () => {
  const token = await tokenCon({ email: 'ajeno@x.com' });
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    { message: 'ese correo no tiene permiso' },
    'la firma es válida: lo que no vale es quién dice ser'
  );
});

test('un token emitido para otra aplicación no entra', async () => {
  const token = await tokenCon({ aud: ['otra-aplicacion'] });
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    /no es para esta aplicación/
  );
});

test('un token emitido por otro equipo no entra', async () => {
  const token = await tokenCon({ iss: 'https://otroequipo.cloudflareaccess.com' });
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    /no lo emitió nuestro equipo/
  );
});

test('un token caducado no entra', async () => {
  const token = await tokenCon({ exp: ahora() - 1 });
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    /ha caducado/
  );
});

test('un token sin correo no entra', async () => {
  const token = await tokenCon({ email: undefined });
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    /no dice de quién es/
  );
});

/* La prueba de control: si esta se pusiera roja, las cinco de arriba estarían
   rechazando por la firma o por la configuración y no por lo que dicen probar. */
test('el mismo token con un correo de la lista sí entra', async () => {
  assert.deepEqual(
    await identificar(peticionCon(await tokenCon({ email: 'b@x.com' })), ENTORNO),
    { correo: 'b@x.com' }
  );
});

/* El criterio 5 visto desde la puerta, que es como lo vería un atacante: no
   basta con que `identificar` lance, hace falta que la escritura no ocurra.
   Con la lista blanca desactivada, esto respondía 200 y dejaba el borrador
   escrito en el bucket. */
test('por la puerta, un correo ajeno no llega a escribir en el bucket', async (t) => {
  silenciarRegistro(t);
  const escrituras = [];
  const entorno = {
    ...ENTORNO,
    ALMACEN: {
      async get() { return null; },
      async put(llave) { escrituras.push(llave); }
    }
  };

  const r = await worker.fetch(new Request('https://x/api/borrador', {
    method: 'PUT',
    headers: { 'Cf-Access-Jwt-Assertion': await tokenCon({ email: 'ajeno@x.com' }) },
    body: JSON.stringify({ version: 0, proyectos: [] })
  }), entorno);

  assert.equal(r.status, 403, 'un correo ajeno no puede escribir');
  assert.equal((await r.json()).error, 'ese correo no tiene permiso');
  assert.deepEqual(escrituras, [], 'no puede quedar nada escrito en el bucket');
});

/* -------------------------------------------------------------------------
   R-4 de la revisión final, que es un doble fallo: `correoPermitido`
   coaccionaba con `String()`, así que `['a@x.com']` pasaba la lista blanca; y
   entonces `reclamaciones.email.trim()` reventaba y el TypeError salía tal cual
   al cliente, en inglés, por el único punto de index.js que no pasaba por
   `fallo()`. Se prueban los dos caminos por separado, porque cerrar uno solo
   dejaría el otro esperando al siguiente descuido. */

test('la lista blanca no acepta lo que no es una cadena', () => {
  /* Un array de un elemento es el caso que reprodujo la revisión: `String()`
     lo convertía en la cadena de dentro. Los demás cierran la familia. */
  assert.equal(correoPermitido(['a@x.com'], 'a@x.com'), false, 'un array no es un correo');
  assert.equal(correoPermitido({ toString: () => 'a@x.com' }, 'a@x.com'), false);
  assert.equal(correoPermitido(['a@x.com', 'b@x.com'], 'a@x.com,b@x.com'), false);
  assert.equal(correoPermitido(123, '123'), false);
  assert.equal(correoPermitido(true, 'true'), false);
  // Y lo de siempre sigue funcionando, para que no pase por rechazarlo todo.
  assert.equal(correoPermitido('a@x.com', 'a@x.com'), true);
});

test('un email que es un array da 403 en castellano, no un TypeError en inglés', async (t) => {
  const registro = silenciarRegistro(t);
  const r = await worker.fetch(
    peticionCon(await tokenCon({ email: ['a@x.com'] })),
    { ...ENTORNO, ALMACEN: { async get() { return null; } } }
  );
  assert.equal(r.status, 403);

  const { error } = await r.json();
  assert.equal(error, 'ese correo no tiene permiso');
  assert.doesNotMatch(error, /is not a function|TypeError|Cannot read properties/,
    'el mensaje de la plataforma no puede llegar al cliente');
  assert.equal(registro.length, 1, 'el detalle queda en el registro');
});

/* La confusión de tipos que hacía esto alcanzable ya está cerrada, así que aquí
   se provoca de la única forma que queda: un entorno sin configurar. Lo que se
   fija no es ese caso concreto, sino la regla — index.js no reenvía nunca un
   mensaje que no hayamos escrito nosotros. */
test('si identidad revienta con algo que no es suyo, tampoco sale en inglés', async (t) => {
  const registro = silenciarRegistro(t);
  const r = await worker.fetch(peticionCon(await tokenCon({})), undefined);
  assert.equal(r.status, 403);

  const { error } = await r.json();
  assert.equal(error, 'no se pudo comprobar tu identidad');
  assert.doesNotMatch(error, /Cannot read properties|undefined|TypeError/,
    'el mensaje de la plataforma no puede llegar al cliente');
  assert.match(registro.join(' '), /ACCESS_EQUIPO|undefined/, 'el diagnóstico no se pierde');
});
