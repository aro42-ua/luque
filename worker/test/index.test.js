import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../src/index.js';

const entorno = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

test('una ruta desconocida devuelve 404', async () => {
  const r = await worker.fetch(new Request('https://x/nada'), entorno);
  assert.equal(r.status, 404);
});

test('salud responde 200 sin pedir identidad', async () => {
  const r = await worker.fetch(new Request('https://x/api/salud'), entorno);
  assert.equal(r.status, 200);
});
