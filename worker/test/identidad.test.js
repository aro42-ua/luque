import { test } from 'node:test';
import assert from 'node:assert';
import { correoPermitido, reclamacionesValidas } from '../src/identidad.js';

const AHORA = 1_800_000_000;

test('sólo pasan los correos de la lista', () => {
  assert.equal(correoPermitido('a@x.com', 'a@x.com,b@x.com'), true);
  assert.equal(correoPermitido('b@x.com', 'a@x.com,b@x.com'), true);
  assert.equal(correoPermitido('c@x.com', 'a@x.com,b@x.com'), false);
});

test('no se cuela por mayusculas ni por espacios', () => {
  assert.equal(correoPermitido(' A@X.com ', 'a@x.com'), true);
});

test('un correo vacio no pasa aunque la lista tenga huecos', () => {
  assert.equal(correoPermitido('', 'a@x.com,,'), false);
  assert.equal(correoPermitido(undefined, 'a@x.com'), false);
});

test('rechaza un aud que no es el nuestro', () => {
  const r = { aud: ['otro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('rechaza un token caducado', () => {
  const r = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA - 1, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('rechaza un emisor que no es nuestro equipo', () => {
  const r = { aud: ['nuestro'], iss: 'https://otroequipo.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('acepta un token correcto', () => {
  const r = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.deepEqual(reclamacionesValidas(r, 'nuestro', 'eq', AHORA), []);
});
