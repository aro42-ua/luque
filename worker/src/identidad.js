/* Access ya filtra por correo antes de que la peticion llegue aqui. Esto lo
   vuelve a comprobar igualmente: si algun dia el Worker queda expuesto por una
   ruta que no pasa por Access, esta es la unica linea de defensa que queda.
   La especificacion lo pide expresamente. */

const MARGEN_RELOJ = 60;   // segundos de tolerancia entre relojes

export function correoPermitido(correo, lista) {
  if (!correo) return false;
  const limpio = String(correo).trim().toLowerCase();
  if (!limpio) return false;
  return String(lista || '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .includes(limpio);
}

export function reclamacionesValidas(reclamaciones, aud, equipo, ahora) {
  const problemas = [];
  if (!reclamaciones) return ['el token no trae reclamaciones'];

  const audiencias = [].concat(reclamaciones.aud || []);
  if (!audiencias.includes(aud)) problemas.push('el token no es para esta aplicación');

  if (reclamaciones.iss !== `https://${equipo}.cloudflareaccess.com`) {
    problemas.push('el token no lo emitió nuestro equipo');
  }

  /* El margen resta, no suma: un token que expira dentro de los próximos
     MARGEN_RELOJ segundos ya se trata como caducado. Si sumara, un token
     recién caducado quedaría "dentro del margen" y se aceptaría — justo el
     fallo que esta comprobación existe para evitar. Ante la duda, más
     estricto, no más laxo. */
  if (!reclamaciones.exp || reclamaciones.exp - MARGEN_RELOJ < ahora) {
    problemas.push('el token ha caducado');
  }

  if (!reclamaciones.email) problemas.push('el token no dice de quién es');

  return problemas;
}

let cacheClaves = null;

async function clavesDeAcceso(equipo) {
  if (cacheClaves) return cacheClaves;
  const r = await fetch(`https://${equipo}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('no se pudieron leer las claves de Access');
  cacheClaves = (await r.json()).keys;
  return cacheClaves;
}

/* Devuelve { correo } o lanza. Lanzar es lo correcto aqui: no hay un camino
   razonable "a medias" cuando la identidad no se puede establecer. */
export async function identificar(peticion, entorno) {
  const token = peticion.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('la petición no trae identidad de Access');

  const [cabecera, cuerpo, firma] = token.split('.');
  if (!firma) throw new Error('el token no tiene el formato esperado');

  const claves = await clavesDeAcceso(entorno.ACCESS_EQUIPO);
  const kid = JSON.parse(atob(cabecera.replace(/-/g, '+').replace(/_/g, '/'))).kid;
  const jwk = claves.find((k) => k.kid === kid);
  if (!jwk) throw new Error('el token viene firmado con una clave desconocida');

  const clave = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const bytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const valida = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', clave, bytes(firma), new TextEncoder().encode(`${cabecera}.${cuerpo}`)
  );
  if (!valida) throw new Error('la firma del token no es válida');

  const reclamaciones = JSON.parse(new TextDecoder().decode(bytes(cuerpo)));
  const problemas = reclamacionesValidas(
    reclamaciones, entorno.ACCESS_AUD, entorno.ACCESS_EQUIPO, Math.floor(Date.now() / 1000)
  );
  if (problemas.length) throw new Error(problemas.join('; '));

  if (!correoPermitido(reclamaciones.email, entorno.CORREOS_AUTORIZADOS)) {
    throw new Error('ese correo no tiene permiso');
  }

  return { correo: reclamaciones.email.trim().toLowerCase() };
}
