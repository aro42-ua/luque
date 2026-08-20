/* Maquinaria de firmar tokens de Access para las pruebas: generar un par RSA
   de verdad, exportar la clave pública a JWK y ensamblar el JWT. La comparten
   identidad.test.js, index.test.js y publicar.test.js — escribirla tres veces
   era la señal de que tocaba sacarla de aquí (Tarea 5). */

export const base64url = (t) => Buffer.from(t).toString('base64url');

export async function generarPar(kid) {
  const par = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify']
  );
  const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
  return { privada: par.privateKey, jwk: { ...jwk, kid } };
}

export async function firmarToken(par, reclamaciones) {
  const cabecera = base64url(JSON.stringify({ alg: 'RS256', kid: par.jwk.kid }));
  const cuerpo = base64url(JSON.stringify(reclamaciones));
  const firma = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', par.privada, new TextEncoder().encode(`${cabecera}.${cuerpo}`)
  );
  return `${cabecera}.${cuerpo}.${Buffer.from(firma).toString('base64url')}`;
}

/* Silencia console.error durante una prueba y devuelve lo capturado, para
   comprobar que el detalle interno queda en el registro y no en la respuesta
   que ve el cliente. */
export function silenciarRegistro(t) {
  const original = console.error;
  const lineas = [];
  console.error = (...partes) => lineas.push(partes.join(' '));
  t.after(() => { console.error = original; });
  return lineas;
}
