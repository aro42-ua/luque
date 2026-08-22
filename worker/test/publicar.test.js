import { test } from 'node:test';
import assert from 'node:assert';
import {
  problemasDelBorrador, nombreSeguro, publicar, CATEGORIAS as LA_DEL_WORKER
} from '../src/publicar.js';
import { ConflictoDeVersion } from '../src/almacen.js';
import worker from '../src/index.js';
import { generarPar, firmarToken, silenciarRegistro } from './apoyo-token.js';

const CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

/* La lista estuvo escrita tres veces: aquí, en `worker/src/index.js` y en
   `js/datos.js`. Una divergencia haría que el Worker rechace con 422 contenido
   que el navegador da por bueno, o al revés — el fallo del bloque 2 que motivó
   sacar estas reglas a un archivo común, repetido dentro del bloque que existe
   para eliminarlo. Aquí se conserva escrita a mano porque es el valor esperado
   de todas las pruebas del archivo; lo que se afirma es que el Worker no la
   copia, sino que la lee de donde la lee el navegador. */
test('el Worker usa la misma lista de categorías que el navegador', () => {
  assert.deepEqual(LA_DEL_WORKER, CATEGORIAS);
  assert.equal(LA_DEL_WORKER, globalThis.ReglasContenido.CATEGORIAS,
    'tiene que ser la misma lista, no otra con el mismo contenido');
});

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

/* I2 de la revisión: la línea 14 de reglas-contenido.js se protegía con
   `p &&` y la 15 no, así que un hueco en la lista lanzaba «Cannot read
   properties of null» y salía como 500 opaco en vez del 422 con el motivo.
   Es alcanzable porque guardarBorrador no valida lo que guarda. */
test('un hueco entre los proyectos da problemas, no una excepción', () => {
  for (const hueco of [null, undefined, 'bruma', 42]) {
    const b = { version: 1, proyectos: [hueco] };
    const problemas = problemasDelBorrador(b, CATEGORIAS);
    assert.ok(problemas.join(' ').includes('no es un proyecto'),
      `un ${JSON.stringify(hueco)} en la lista tiene que salir como problema`);
  }
});

/* Lo de aquí abajo toca el binding ALMACEN, que no existe en node --test: se
   simula con un mapa en memoria que ofrece el mismo get/put/head que usa R2,
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
      async head(llave) { return datos.has(llave) ? { key: llave } : null; },
      leido(llave) { return datos.has(llave) ? JSON.parse(datos.get(llave)) : null; }
    }
  };
}

test('publicar copia el borrador válido sobre el contenido', async () => {
  const b = { version: 2, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = almacenFalso(b);

  const resultado = await publicar(entorno, CATEGORIAS, 2);
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

  const resultado = await publicar(entorno, CATEGORIAS, 1);
  assert.ok(resultado.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null, 'contenido.json no debe tocarse');
});

test('un borrador vacío (nunca guardado) tampoco se publica', async () => {
  const entorno = almacenFalso();
  const resultado = await publicar(entorno, CATEGORIAS, 0);
  assert.ok(resultado.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

/* I7: publicar tenía lectura y escritura sin control de versión, mientras que
   guardarBorrador sí lo tenía. Un PUT que cayera en medio publicaba algo que
   el operador nunca dio por bueno. */
test('publicar una versión que no es la guardada choca y no escribe', async () => {
  const b = { version: 7, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = almacenFalso(b);

  await assert.rejects(() => publicar(entorno, CATEGORIAS, 5), ConflictoDeVersion);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null,
    'un choque de versión no puede dejar nada publicado');
});

/* -------------------------------------------------------------------------
   Las rutas completas, a través de index.js: la comprobación posicional de
   que quedan detrás de la identidad vive en index.test.js. Aquí se prueba lo
   que hace cada ruta una vez que la identidad ya pasó, por lo que hace falta
   un token válido — de ahí el archivo de apoyo compartido. */

const entornoBase = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

const par = await generarPar('K1');
globalThis.fetch = async () => Response.json({ keys: [par.jwk] });
const TOKEN = await firmarToken(par, {
  aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
  exp: Math.floor(Date.now() / 1000) + 3600, email: 'a@x.com'
});

const peticionPublicar = (consulta) =>
  new Request(`https://x/api/publicar${consulta}`, {
    method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': TOKEN }
  });

test('POST /api/publicar con un borrador inválido da 422 y no publica', async () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticionPublicar('?version=1'), entorno);
  assert.equal(r.status, 422);
  const cuerpo = await r.json();
  assert.ok(cuerpo.problemas.length > 0);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

/* I2 visto desde fuera: el contrato es «un borrador inválido devuelve
   problemas», y un hueco en la lista lo rompía con un 500 opaco. */
test('POST /api/publicar con un hueco en proyectos da 422, no 500', async () => {
  const entorno = { ...entornoBase, ...almacenFalso({ version: 1, proyectos: [null] }) };

  const r = await worker.fetch(peticionPublicar('?version=1'), entorno);
  assert.equal(r.status, 422, 'un borrador inválido se contesta, no revienta');
  const cuerpo = await r.json();
  assert.ok(cuerpo.problemas.join(' ').includes('no es un proyecto'));
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

test('POST /api/publicar con un borrador válido da 200 y publica', async () => {
  const b = { version: 5, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticionPublicar('?version=5'), entorno);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { version: 5 });
  assert.deepEqual(entorno.ALMACEN.leido('contenido.json'), b);
});

/* C-3: el callejón sin salida. `?version=` siempre llega como Number, así que
   un borrador guardado con `version: "3"` no se podía publicar nunca más —el
   409 decía «va por la versión 3 y tú traes la 3»— y arreglarlo pedía editar
   R2 a mano. Se normaliza al leer, y el `"3"` no se propaga a contenido.json. */
test('un borrador guardado con la versión como cadena se puede publicar', async () => {
  const b = { version: '3', proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticionPublicar('?version=3'), entorno);
  assert.equal(r.status, 200, 'no puede quedar impublicable para siempre');
  assert.deepEqual(await r.json(), { version: 3 });
  assert.strictEqual(entorno.ALMACEN.leido('contenido.json').version, 3,
    'lo publicado lleva un número, no la cadena');
});

test('POST /api/publicar sin decir la versión da 400', async () => {
  const b = { version: 5, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };

  for (const consulta of ['', '?version=', '?version=abc', '?version=-1']) {
    const entorno = { ...entornoBase, ...almacenFalso(b) };
    const r = await worker.fetch(peticionPublicar(consulta), entorno);
    assert.equal(r.status, 400, `«${consulta}» no dice qué versión se publica`);
    assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
  }
});

test('POST /api/publicar con una versión vieja da 409, igual que guardar', async () => {
  const b = { version: 7, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  const entorno = { ...entornoBase, ...almacenFalso(b) };

  const r = await worker.fetch(peticionPublicar('?version=5'), entorno);
  assert.equal(r.status, 409, 'no es un error del servidor: choca con el estado');

  const cuerpo = await r.json();
  assert.equal(cuerpo.guardada, 7, 'la misma forma que el conflicto al guardar');
  assert.match(cuerpo.error, /cambió mientras editabas/);
  assert.equal(entorno.ALMACEN.leido('contenido.json'), null);
});

test('POST /api/publicar da 500 en castellano si el almacén falla al leer', async (t) => {
  const registro = silenciarRegistro(t);
  const entorno = {
    ...entornoBase,
    ALMACEN: { async get() { throw new Error('R2 unavailable: connection reset'); } }
  };
  const r = await worker.fetch(peticionPublicar('?version=1'), entorno);
  assert.equal(r.status, 500);

  const { error } = await r.json();
  assert.equal(error, 'no se pudo publicar');
  assert.doesNotMatch(error, /R2 unavailable|connection reset/,
    'el error de R2 no puede llegar al cliente');
  assert.match(registro.join(' '), /connection reset/, 'el detalle queda en el registro');
});
