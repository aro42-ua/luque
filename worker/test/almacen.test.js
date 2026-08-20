import { test } from 'node:test';
import assert from 'node:assert';
import { siguienteVersion, ConflictoDeVersion, leerBorrador, guardarBorrador } from '../src/almacen.js';

test('la version sube de uno en uno', () => {
  assert.deepEqual(siguienteVersion({ version: 4 }, { version: 4 }), { version: 5 });
});

test('el primer guardado parte de cero', () => {
  assert.deepEqual(siguienteVersion(null, { version: 0 }), { version: 1 });
});

test('guardar sobre una version vieja es conflicto', () => {
  assert.throws(
    () => siguienteVersion({ version: 7 }, { version: 5 }),
    ConflictoDeVersion
  );
});

test('el conflicto dice las dos versiones, para poder avisar bien', () => {
  try {
    siguienteVersion({ version: 7 }, { version: 5 });
    assert.fail('tenia que haber lanzado');
  } catch (e) {
    assert.equal(e.guardada, 7);
    assert.equal(e.entrante, 5);
  }
});

/* Lo de aqui abajo toca el binding ALMACEN, que no existe en node --test: se
   simula con un mapa en memoria que ofrece el mismo get/put que usa R2. */
function almacenFalso() {
  const datos = new Map();
  return {
    ALMACEN: {
      async get(llave) {
        if (!datos.has(llave)) return null;
        const texto = datos.get(llave);
        return { async json() { return JSON.parse(texto); } };
      },
      async put(llave, texto) {
        datos.set(llave, texto);
      }
    }
  };
}

test('leer el borrador la primera vez da uno vacio', async () => {
  const entorno = almacenFalso();
  assert.deepEqual(await leerBorrador(entorno), { version: 0, proyectos: [] });
});

test('guardar sube la version y el siguiente leer la ve', async () => {
  const entorno = almacenFalso();
  const primero = await guardarBorrador(entorno, { version: 0, proyectos: [] });
  assert.deepEqual(primero, { version: 1 });

  const leido = await leerBorrador(entorno);
  assert.equal(leido.version, 1);

  const segundo = await guardarBorrador(entorno, { version: 1, proyectos: ['a'] });
  assert.deepEqual(segundo, { version: 2 });
});

test('guardar con una version vieja lanza y no toca lo guardado', async () => {
  const entorno = almacenFalso();
  await guardarBorrador(entorno, { version: 0, proyectos: [] });

  await assert.rejects(
    () => guardarBorrador(entorno, { version: 0, proyectos: ['pisando'] }),
    ConflictoDeVersion
  );

  const leido = await leerBorrador(entorno);
  assert.equal(leido.version, 1, 'el guardado que chocó no debe haber escrito nada');
});
