import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../src/index.js';
import { generarPar, firmarToken, silenciarRegistro } from './apoyo-token.js';

const entorno = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

test('una ruta desconocida devuelve 404', async () => {
  const r = await worker.fetch(new Request('https://x/nada'), entorno);
  assert.equal(r.status, 404);
});

test('salud responde 200 sin pedir identidad', async () => {
  const r = await worker.fetch(new Request('https://x/api/salud'), entorno);
  assert.equal(r.status, 200);
});

/* La comprobación de identidad es un `if` posicional, no una envoltura: una
   ruta añadida por encima de esa línea quedaría sin proteger y ninguna otra
   prueba lo notaría. Esta prueba es la que lo cierra para /api/borrador. */
test('borrador sin token de Access responde 403', async (t) => {
  silenciarRegistro(t);
  const r = await worker.fetch(new Request('https://x/api/borrador'), entorno);
  assert.equal(r.status, 403);
});

/* Mismo motivo, para las dos rutas de la Tarea 5: si `/api/imagen` o
   `/api/publicar` se colaran por encima de la comprobación de identidad,
   quedarían sin proteger y sólo una prueba posicional como ésta lo notaría.
   El resto del comportamiento de estas rutas se prueba en publicar.test.js. */
test('imagen sin token de Access responde 403', async (t) => {
  silenciarRegistro(t);
  const r = await worker.fetch(
    new Request('https://x/api/imagen?nombre=a.jpg', { method: 'POST' }), entorno
  );
  assert.equal(r.status, 403);
});

test('publicar sin token de Access responde 403', async (t) => {
  silenciarRegistro(t);
  const r = await worker.fetch(new Request('https://x/api/publicar', { method: 'POST' }), entorno);
  assert.equal(r.status, 403);
});

/* Lo que sigue prueba las rutas de /api/borrador, que sólo se alcanzan pasando
   la identidad. Se le pone delante un Access de mentira y se firma el token
   con una clave RSA de verdad, igual que en identidad.test.js: así la petición
   recorre el mismo camino que desplegada, puerta incluida.

   La clave se genera una sola vez para todo el archivo a propósito:
   `identidad.js` cachea las claves en su ámbito de módulo, así que una segunda
   clave con el mismo `kid` chocaría con la cacheada y estas pruebas fallarían
   por la firma en vez de por lo que quieren comprobar. */
const par = await generarPar('K1');

/* Ninguna prueba de este archivo necesita la red de verdad, así que el Access
   de mentira se deja puesto para todo el archivo. */
globalThis.fetch = async () => Response.json({ keys: [par.jwk] });

const TOKEN = await firmarToken(par, {
  aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
  exp: Math.floor(Date.now() / 1000) + 3600, email: 'a@x.com'
});

function peticionBorrador(metodo, cuerpo) {
  return new Request('https://x/api/borrador', {
    method: metodo,
    headers: { 'Cf-Access-Jwt-Assertion': TOKEN },
    body: cuerpo
  });
}

const entornoCon = (ALMACEN) => ({ ...entorno, ALMACEN });

const almacenVacio = () => ({
  async get() { return null; },
  async put() { }
});

test('con identidad válida, GET borrador devuelve el borrador vacío', async () => {
  const r = await worker.fetch(peticionBorrador('GET'), entornoCon(almacenVacio()));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { version: 0, proyectos: [] });
});

/* Los dos caminos de error que la revisión encontró sin cubrir. El defecto
   venía del patrón del brief: GET sin try/catch, y un `throw e` en PUT que
   relanzaba sin traducir todo lo que no fuera ConflictoDeVersion. */

test('un cuerpo que no es JSON da 400 con mensaje nuestro, no el de JSON.parse', async (t) => {
  const registro = silenciarRegistro(t);

  const r = await worker.fetch(peticionBorrador('PUT', 'esto no es json'), entornoCon(almacenVacio()));
  assert.equal(r.status, 400, 'la petición vino mal, no el servidor');

  const { error } = await r.json();
  assert.equal(error, 'el cuerpo de la petición no es JSON válido');
  assert.doesNotMatch(error, /Unexpected token|not valid JSON|SyntaxError/,
    'el mensaje de JSON.parse no puede llegar al cliente');
  assert.match(registro.join(' '), /JSON/, 'el detalle queda en el registro');
});

test('si el almacén falla al leer, GET da 500 en castellano', async (t) => {
  const registro = silenciarRegistro(t);
  const roto = {
    async get() { throw new Error('R2 unavailable: connection reset'); },
    async put() { }
  };

  const r = await worker.fetch(peticionBorrador('GET'), entornoCon(roto));
  assert.equal(r.status, 500);

  const { error } = await r.json();
  assert.equal(error, 'no se pudo leer el borrador guardado');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/,
    'el error de R2 no puede llegar al cliente');
  assert.match(registro.join(' '), /connection reset/, 'el detalle queda en el registro');
});

test('si el almacén falla al escribir, PUT da 500 en castellano', async (t) => {
  const registro = silenciarRegistro(t);
  const roto = {
    async get() { return null; },
    async put() { throw new Error('R2 unavailable: connection reset'); }
  };

  const r = await worker.fetch(
    peticionBorrador('PUT', JSON.stringify({ version: 0, proyectos: [] })), entornoCon(roto)
  );
  assert.equal(r.status, 500);

  const { error } = await r.json();
  assert.equal(error, 'no se pudo guardar el borrador');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/,
    'el error de R2 no puede llegar al cliente');
  assert.match(registro.join(' '), /connection reset/, 'el detalle queda en el registro');
});

/* C-3 visto desde la puerta. Un `<input>` del panel manda `"3"` y no `3`: eso
   daba un 409 que enseñaba dos números iguales, y si el `"3"` llegaba a
   guardarse el borrador quedaba impublicable para siempre. Ahora se normaliza
   lo que se puede leer como versión, y lo que no se rechaza con 400 —no con
   409— porque un 409 le dice al panel que reintente. */
test('la versión como cadena se guarda igual y no da un conflicto falso', async () => {
  const escrito = [];
  const entorno = entornoCon({
    async get() { return null; },
    async put(llave, texto) { escrito.push(JSON.parse(texto)); }
  });

  const r = await worker.fetch(
    peticionBorrador('PUT', JSON.stringify({ version: '0', proyectos: [] })), entorno
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { version: 1 });
  assert.equal(escrito[0].version, 1, 'lo guardado es un número, no una cadena');
});

test('una versión que no es un número da 400 y no 409', async (t) => {
  const registro = silenciarRegistro(t);

  for (const cuerpo of ['{"version":"tres","proyectos":[]}', '{"version":3.5}',
                        '{"proyectos":[]}', 'null', '0', '[]', '"hola"']) {
    const escrito = [];
    const entorno = entornoCon({
      async get() { return null; },
      async put(llave, texto) { escrito.push(texto); }
    });

    const r = await worker.fetch(peticionBorrador('PUT', cuerpo), entorno);
    assert.equal(r.status, 400, `«${cuerpo}» no es un conflicto, es una petición mal hecha`);

    const { error } = await r.json();
    assert.match(error, /borrador|versión/, 'el mensaje tiene que explicar qué falta');
    assert.doesNotMatch(error, /cambió mientras editabas/);
    assert.deepEqual(escrito, [], 'un cuerpo que no se entiende no puede escribir nada');
  }
  assert.ok(registro.length > 0, 'el detalle queda en el registro');
});

/* El 409 se comprueba aquí porque el catch que lo distingue se acaba de
   reestructurar: si un día cae en el 500 genérico, el panel dejaría de poder
   avisar del choque y esta prueba es la que lo nota. */
test('un guardado que choca sigue dando 409 y no 500', async () => {
  const conVersionCuatro = {
    async get() { return { async json() { return { version: 4, proyectos: [] }; } }; },
    async put() { }
  };

  const r = await worker.fetch(
    peticionBorrador('PUT', JSON.stringify({ version: 1, proyectos: [] })), entornoCon(conVersionCuatro)
  );
  assert.equal(r.status, 409);

  const cuerpo = await r.json();
  assert.equal(cuerpo.guardada, 4);
  assert.match(cuerpo.error, /cambió mientras editabas/);
});
