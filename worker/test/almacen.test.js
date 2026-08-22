import { test } from 'node:test';
import assert from 'node:assert';
import {
  siguienteVersion, ConflictoDeVersion, VersionMalFormada, comoVersion,
  leerBorrador, guardarBorrador
} from '../src/almacen.js';

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

/* C-3 de la revisión final. Un campo de formulario del panel manda `"3"` y no
   `3`, y con la comparación estricta eso daba un 409 que enseñaba dos números
   iguales —«va por la versión 3 y tú traes la 3»— y, si el `"3"` llegaba a
   guardarse, dejaba el borrador impublicable para siempre. */

test('una version escrita como cadena de digitos se lee como numero', () => {
  assert.equal(comoVersion('3'), 3);
  assert.equal(comoVersion(' 3 '), 3);
  assert.equal(comoVersion('0'), 0);
  assert.equal(comoVersion(7), 7);
});

test('lo que no es una version no se hace pasar por una', () => {
  for (const valor of ['abc', '3.5', '-1', '', ' ', '0x10', 3.5, -1, null,
                       undefined, [], {}, true, NaN, Infinity]) {
    assert.equal(comoVersion(valor), null, `${JSON.stringify(valor)} no es una versión`);
  }
});

test('la version como cadena no choca contra la guardada', () => {
  assert.deepEqual(siguienteVersion(null, { version: '0' }), { version: 1 },
    'el primer guardado desde un campo de formulario tiene que colar');
  assert.deepEqual(siguienteVersion({ version: 4 }, { version: '4' }), { version: 5 });
});

/* El callejón sin salida: un `"3"` ya guardado. La versión que trae `?version=`
   siempre es un Number, así que sin normalizar lo guardado no habría forma de
   publicar ni de volver a guardar ese borrador sin editar R2 a mano. */
test('un borrador ya guardado con la version como cadena no queda atascado', () => {
  assert.deepEqual(siguienteVersion({ version: '3' }, { version: 3 }), { version: 4 });
});

test('una version que no es un numero es peticion mal hecha, no conflicto', () => {
  for (const cuerpo of [{ version: 'tres' }, { version: 3.5 }, { version: -1 },
                        { version: [3] }, { proyectos: [] }, null, 0, 'hola', []]) {
    assert.throws(
      () => siguienteVersion({ version: 3 }, cuerpo),
      VersionMalFormada,
      `${JSON.stringify(cuerpo)} no es un conflicto de versión`
    );
  }
});

test('el mensaje de la version mal formada dice que pasa y no ensena dos numeros iguales', () => {
  try {
    siguienteVersion({ version: 3 }, { version: '3.0' });
    assert.fail('tenia que haber lanzado');
  } catch (e) {
    assert.match(e.message, /número entero/);
    assert.doesNotMatch(e.message, /cambió mientras editabas/);
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
