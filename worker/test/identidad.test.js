import { test } from 'node:test';
import assert from 'node:assert';
import { correoPermitido, reclamacionesValidas } from '../src/identidad.js';
import { base64url, generarPar, firmarToken, silenciarRegistro } from './apoyo-token.js';

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
  const r = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA + 3600, email: 'a@x.com' };
  assert.deepEqual(reclamacionesValidas(r, 'nuestro', 'eq', AHORA), []);
});

/* La frontera es a proposito: con exp = AHORA + 60 y un margen de anticipacion
   de 60 segundos, exp - margen == ahora, y la comprobacion es `< ahora` (no
   `<=`), asi que justo en el borde el token TODAVIA se acepta. Un segundo
   menos de vida y ya no: exp = AHORA + 59 cae del lado caducado. Se deja
   escrito para que el comportamiento elegido en la frontera no cambie sin
   querer al tocar la comprobacion. */
test('en la frontera exacta del margen el token se acepta, un segundo antes no', () => {
  const base = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', email: 'a@x.com' };
  assert.deepEqual(
    reclamacionesValidas({ ...base, exp: AHORA + 60 }, 'nuestro', 'eq', AHORA), [],
    'exp - margen == ahora: todavia no ha caducado'
  );
  assert.ok(
    reclamacionesValidas({ ...base, exp: AHORA + 59 }, 'nuestro', 'eq', AHORA).length > 0,
    'un segundo menos de vida y ya cae del lado caducado'
  );
});

/* Lo que sigue prueba `identificar`, que en la Tarea 3 se dejó sin prueba por
   necesitar red. No hace falta red: se le pone delante un Access de mentira y
   se firman los tokens con claves RSA de verdad, así que la firma se comprueba
   igual que desplegada. Lo que sigue sin probarse aquí es hablar con el Access
   real, que es lo que mira la Tarea 6. */

const ENTORNO = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

function reclamacionesBuenas() {
  return {
    aud: ['aud'], iss: 'https://eq.cloudflareaccess.com',
    exp: Math.floor(Date.now() / 1000) + 3600, email: 'a@x.com'
  };
}

const parDeClaves = generarPar;

function tokenFirmadoCon(par, reclamaciones = reclamacionesBuenas()) {
  return firmarToken(par, reclamaciones);
}

const peticionCon = (token) =>
  new Request('https://x/api/publicar', { headers: { 'Cf-Access-Jwt-Assertion': token } });

/* Cada prueba estrena el módulo: la caché de claves vive en su ámbito y si no
   se aísla, una prueba se apoyaría en lo que dejó la anterior. */
let version = 0;
const moduloNuevo = () => import(`../src/identidad.js?v=${++version}`);

/* Access de mentira: sirve `respuestas[n]` a la n-ésima descarga y se queda en
   la última. Devuelve el contador para poder afirmar cuántas veces se preguntó. */
function accessQueSirve(respuestas, t) {
  const original = globalThis.fetch;
  const cuenta = { descargas: 0 };
  globalThis.fetch = async () => {
    const cual = Math.min(cuenta.descargas++, respuestas.length - 1);
    return new Response(JSON.stringify(respuestas[cual]), {
      status: 200, headers: { 'content-type': 'application/json' }
    });
  };
  t.after(() => { globalThis.fetch = original; });
  return cuenta;
}

test('una rotacion de claves en Access no deja la escritura muerta', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  const k2 = await parDeClaves('K2');
  const cuenta = accessQueSirve([{ keys: [k1.jwk] }, { keys: [k2.jwk] }], t);

  const antes = await identificar(peticionCon(await tokenFirmadoCon(k1)), ENTORNO);
  assert.deepEqual(antes, { correo: 'a@x.com' });
  assert.equal(cuenta.descargas, 1, 'la primera petición llena la caché');

  // Access rota su clave de firma: el token siguiente ya viene con K2.
  const despues = await identificar(peticionCon(await tokenFirmadoCon(k2)), ENTORNO);
  assert.deepEqual(despues, { correo: 'a@x.com' }, 'tras rotar, sigue pudiéndose escribir');
  assert.equal(cuenta.descargas, 2, 'volvió a preguntar por las claves');
});

test('un kid desconocido no descarga las claves en cada peticion', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  const ajena = await parDeClaves('NUNCA-VISTA');
  const cuenta = accessQueSirve([{ keys: [k1.jwk] }], t);
  silenciarRegistro(t);

  await identificar(peticionCon(await tokenFirmadoCon(k1)), ENTORNO);
  assert.equal(cuenta.descargas, 1);

  const token = await tokenFirmadoCon(ajena);
  for (let i = 0; i < 3; i++) {
    await assert.rejects(
      () => identificar(peticionCon(token), ENTORNO),
      /clave desconocida/, 'un kid que no existe se sigue rechazando'
    );
  }
  assert.equal(cuenta.descargas, 2, 'un solo reintento, no uno por petición');
});

test('un token ilegible no filtra el error interno ni en ingles', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  accessQueSirve([{ keys: [k1.jwk] }], t);
  const registro = silenciarRegistro(t);

  // Los tres los obtuvo la revisión mandando cabeceras mal formadas.
  const malas = ['!!!.b.c', `${base64url('no soy json')}.b.c`, 'bnVsbA.b.c'];
  for (const mala of malas) {
    await assert.rejects(() => identificar(peticionCon(mala), ENTORNO), (e) => {
      assert.equal(e.message, 'el token trae la cabecera ilegible');
      assert.doesNotMatch(e.message, /Invalid character|Unexpected token|Cannot read properties/);
      return true;
    });
  }
  assert.equal(registro.length, malas.length, 'el detalle queda en el registro');
  assert.match(registro[0], /Invalid character/, 'el diagnóstico no se pierde');
});

test('una firma ilegible tampoco filtra el error interno', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  accessQueSirve([{ keys: [k1.jwk] }], t);
  silenciarRegistro(t);

  const bueno = await tokenFirmadoCon(k1);
  const [cabecera, cuerpo] = bueno.split('.');
  await assert.rejects(
    () => identificar(peticionCon(`${cabecera}.${cuerpo}.!!!`), ENTORNO),
    { message: 'la firma del token no se pudo comprobar' }
  );
});

test('una firma que no cuadra se rechaza', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  const otra = await parDeClaves('K1');   // mismo kid, clave distinta
  accessQueSirve([{ keys: [k1.jwk] }], t);

  const token = await tokenFirmadoCon(otra);
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    { message: 'la firma del token no es válida' }
  );
});

test('si la red falla, tampoco sale el mensaje de fetch en ingles', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  t.after(() => { globalThis.fetch = original; });
  const registro = silenciarRegistro(t);

  const token = await tokenFirmadoCon(k1);
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    { message: 'no se pudieron leer las claves de Access' }
  );
  assert.match(registro[0], /fetch failed/, 'el detalle queda en el registro');
});

test('unas claves sin el campo keys no envenenan la cache', async (t) => {
  const { identificar } = await moduloNuevo();
  const k1 = await parDeClaves('K1');
  const cuenta = accessQueSirve([{ sin: 'keys' }, { keys: [k1.jwk] }], t);

  const token = await tokenFirmadoCon(k1);
  await assert.rejects(
    () => identificar(peticionCon(token), ENTORNO),
    { message: 'no se pudieron leer las claves de Access' }
  );
  // La siguiente vuelve a intentarlo y funciona.
  const r = await identificar(peticionCon(await tokenFirmadoCon(k1)), ENTORNO);
  assert.deepEqual(r, { correo: 'a@x.com' });
  assert.equal(cuenta.descargas, 2);
});
