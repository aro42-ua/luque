import { test } from 'node:test';
import assert from 'node:assert';
import { problemasDelBorrador, nombreSeguro, publicar } from '../src/publicar.js';
import worker from '../src/index.js';
import { generarPar, firmarToken } from './apoyo-token.js';

const CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

test('un borrador valido no da problemas', () => {
  const b = { version: 3, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg', miniatura: 'm.jpg' }] } ] };
  assert.deepEqual(problemasDelBorrador(b, CATEGORIAS), []);
});

test('un borrador sin proyectos no se publica', () => {
  assert.ok(problemasDelBorrador({ version: 1, proyectos: [] }, CATEGORIAS).length > 0);
});

test('usa las mismas reglas que el navegador', () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  assert.ok(problemasDelBorrador(b, CATEGORIAS).join(' ').includes('categoría desconocida'));
});

test('un nombre de archivo no puede escaparse de su carpeta', () => {
  assert.equal(nombreSeguro('../../secreto.json'), 'secreto.json');
  assert.equal(nombreSeguro('bruma/01.jpg'), 'bruma-01.jpg');
  assert.equal(nombreSeguro(''), null);
});

/* Aviso de la revisión de la Tarea 1: `ReglasContenido.validar` hace
   `categorias || []` por dentro, así que una lista ausente o mal formada no
   la hace lanzar, dice en silencio que todos los proyectos tienen categoría
   desconocida. Quien llama a `problemasDelBorrador` es el propio Worker (no
   el navegador), así que aquí se decidió fallar alto en vez de callar: un
   `CATEGORIAS` roto es un fallo de configuración, no un borrador inválido. */
test('si las categorías no llegan bien, falla en vez de callar', () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  assert.throws(() => problemasDelBorrador(b, undefined), /categorías/);
  assert.throws(() => problemasDelBorrador(b, null), /categorías/);
  assert.throws(() => problemasDelBorrador(b, []), /categorías/);
  assert.throws(() => problemasDelBorrador(b, 'editorial'), /categorías/);
});

/* Lo de aquí abajo toca el binding ALMACEN, que no existe en node --test: se
   simula con un mapa en memoria que ofrece el mismo get/put que usa R2,
   siguiendo el mismo patrón que almacen.test.js. */
function almacenFalso(inicial) {
  const datos = new Map();
  if (inicial) datos.set('borrador.json', JSON.stringify(inicial));
  return {
    ALMACEN: {
      async get(llave) {
        if (!datos.has(llave)) return null;
        const texto = datos.get(llave);
        return { async json() { return JSON.parse(texto); } };
      },
      async put(llave, texto) { datos.set(llave, texto); },
      leido(llave) { return datos.has(llave) ? JSON.parse(datos.get(llave)) : null; }
    }
  };
}

test('publicar copia el borrador válido sobre el contenido', async () => {
  const b = { version: 2, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = almacenFalso(b);

  const resultado = await publicar(entorno, CATEGORIAS);
  assert.deepEqual(resultado, { version: 2 });
  assert.deepEqual(entorno.ALMACEN.leido('contenido.json'), b);
});

/* El criterio de aceptación del bloque: publicar es atómico. Un borrador
   inválido no debe dejar nada escrito en contenido.json, ni parcial ni
   completo — lo que hay al otro lado es la web pública. */
test('publicar no escribe nada si el borrador no es válido', async () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = almacenFalso(b);

  const resultado = await publicar(entorno, CATEGORIAS);
  assert.ok(resultado.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null, 'contenido.json no debe tocarse');
});

test('un borrador vacío (nunca guardado) tampoco se publica', async () => {
  const entorno = almacenFalso();
  const resultado = await publicar(entorno, CATEGORIAS);
  assert.ok(resultado.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

/* -------------------------------------------------------------------------
   Las rutas completas, a través de index.js: la comprobación posicional de
   que quedan detrás de la identidad vive en index.test.js. Aquí se prueba lo
   que hace cada ruta una vez que la identidad ya pasó, por lo que hace falta
   un token válido — de ahí el archivo de apoyo compartido con identidad.test.js
   e index.test.js. */

const entornoBase = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

const par = await generarPar('K1');
globalThis.fetch = async () => Response.json({ keys: [par.jwk] });
const TOKEN = await firmarToken(par, {
  aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
  exp: Math.floor(Date.now() / 1000) + 3600, email: 'a@x.com'
});

function peticion(ruta, metodo, cuerpo) {
  return new Request(`https://x${ruta}`, {
    method: metodo,
    headers: { 'Cf-Access-Jwt-Assertion': TOKEN },
    body: cuerpo
  });
}

function silenciarRegistro(t) {
  const original = console.error;
  t.after(() => { console.error = original; });
  console.error = () => {};
}

test('POST /api/imagen sin nombre da 400', async () => {
  const r = await worker.fetch(peticion('/api/imagen', 'POST'), entornoBase);
  assert.equal(r.status, 400);
});

test('POST /api/imagen guarda el cuerpo bajo img/ y devuelve la url', async () => {
  const guardado = {};
  const entorno = {
    ...entornoBase,
    ALMACEN: {
      async put(llave, cuerpo, opciones) {
        guardado.llave = llave;
        guardado.tipo = opciones && opciones.httpMetadata && opciones.httpMetadata.contentType;
      }
    }
  };
  const r = await worker.fetch(
    peticion('/api/imagen?nombre=../../bruma/01.jpg', 'POST', 'contenido-de-la-imagen'),
    entorno
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { url: '/img/bruma-01.jpg' });
  assert.equal(guardado.llave, 'img/bruma-01.jpg');
});

test('POST /api/imagen da 500 en castellano si el almacén falla', async (t) => {
  silenciarRegistro(t);
  const entorno = {
    ...entornoBase,
    ALMACEN: { async put() { throw new Error('R2 unavailable: connection reset'); } }
  };
  const r = await worker.fetch(peticion('/api/imagen?nombre=a.jpg', 'POST', 'x'), entorno);
  assert.equal(r.status, 500);
  const { error } = await r.json();
  assert.equal(error, 'no se pudo guardar la imagen');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/);
});

test('POST /api/publicar con un borrador inválido da 422 y no publica', async () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticion('/api/publicar', 'POST'), entorno);
  assert.equal(r.status, 422);
  const cuerpo = await r.json();
  assert.ok(cuerpo.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

test('POST /api/publicar con un borrador válido da 200 y publica', async () => {
  const b = { version: 5, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticion('/api/publicar', 'POST'), entorno);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { version: 5 });
  assert.deepEqual(entorno.ALMACEN.leido('contenido.json'), b);
});

test('POST /api/publicar da 500 en castellano si el almacén falla al leer', async (t) => {
  silenciarRegistro(t);
  const entorno = {
    ...entornoBase,
    ALMACEN: { async get() { throw new Error('R2 unavailable: connection reset'); } }
  };
  const r = await worker.fetch(peticion('/api/publicar', 'POST'), entorno);
  assert.equal(r.status, 500);
  const { error } = await r.json();
  assert.equal(error, 'no se pudo publicar');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/);
});
