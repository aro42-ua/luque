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

/* La comprobación de identidad es un `if` posicional, no una envoltura: una
   ruta añadida por encima de esa línea quedaría sin proteger y ninguna otra
   prueba lo notaría. Esta prueba es la que lo cierra para /api/borrador. */
test('borrador sin token de Access responde 403', async () => {
  const r = await worker.fetch(new Request('https://x/api/borrador'), entorno);
  assert.equal(r.status, 403);
});
