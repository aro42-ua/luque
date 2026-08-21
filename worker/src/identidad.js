/* Access ya filtra por correo antes de que la peticion llegue aqui. Esto lo
   vuelve a comprobar igualmente: si algun dia el Worker queda expuesto por una
   ruta que no pasa por Access, esta es la unica linea de defensa que queda.
   La especificacion lo pide expresamente. */

const MARGEN_RELOJ = 60;   // segundos de tolerancia entre relojes

/* Los mensajes que nacen aquí están escritos para enseñarse: dicen en
   castellano por qué no se pudo establecer la identidad, y el panel los
   necesita para distinguir «vuelve a entrar» de «pide permiso». Lo que NO nace
   aquí —un TypeError nuestro, un fallo de plataforma— sale en inglés y con
   detalle interno, que es justo lo que esta rama ha cerrado tres veces.
   Marcar los nuestros con una clase propia es lo que le permite a index.js
   distinguirlos, igual que ya hace con ConflictoDeVersion. Sin esto, index.js
   reenviaba `e.message` a ciegas y bastaba una reclamación `email` que fuera
   un array para servir «reclamaciones.email.trim is not a function». */
export class FalloDeIdentidad extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'FalloDeIdentidad';
  }
}

export function correoPermitido(correo, lista) {
  /* Exigir cadena, y no coaccionar con String(): `['a@x.com']` se convertía en
     `'a@x.com'` y **pasaba la lista blanca**. Es una confusión de tipos en la
     comprobación de autorización, no un descuido de formato: lo que Access
     firma es JSON, y en JSON `email` puede llegar siendo cualquier cosa. */
  if (typeof correo !== 'string') return false;
  const limpio = correo.trim().toLowerCase();
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

const ESPERA_REINTENTO = 10_000;   // milisegundos entre reintentos por rotación

let cacheClaves = null;
let momentoReintento = 0;

async function descargarClaves(equipo) {
  let r;
  try {
    r = await fetch(`https://${equipo}.cloudflareaccess.com/cdn-cgi/access/certs`);
  } catch (e) {
    /* Si la red falla, `fetch` lanza su propio mensaje en inglés («fetch
       failed»), y este error acaba servido al cliente. */
    console.error('No se pudo hablar con Access:', e.message);
    throw new FalloDeIdentidad('no se pudieron leer las claves de Access');
  }
  if (!r.ok) throw new FalloDeIdentidad('no se pudieron leer las claves de Access');

  let claves;
  try {
    claves = (await r.json()).keys;
  } catch (e) {
    console.error('Access devolvió unas claves ilegibles:', e.message);
    throw new FalloDeIdentidad('no se pudieron leer las claves de Access');
  }
  /* Se comprueba antes de cachear: una respuesta sin `keys` dejaría la caché
     valiendo `undefined` y el fallo saldría mucho después, como un error de
     plataforma en inglés servido al cliente. */
  if (!Array.isArray(claves) || !claves.length) {
    throw new FalloDeIdentidad('no se pudieron leer las claves de Access');
  }

  /* Sólo se cachea lo que sirve: si la descarga falla, la caché se queda
     vacía y la siguiente petición vuelve a intentarlo. */
  cacheClaves = claves;
  return claves;
}

async function clavesDeAcceso(equipo) {
  if (cacheClaves) return cacheClaves;
  return descargarClaves(equipo);
}

/* Access rota su clave de firma. Si el `kid` no está entre las cacheadas, lo
   más probable es que haya rotado, así que se vuelve a preguntar una vez: sin
   esto, una rotación deja al panel sin poder escribir hasta que se recicle el
   isolate, y el mensaje que se ve no señala al problema.
   Dos frenos para que un `kid` inventado no dispare una descarga por petición:
   sólo se reintenta si las claves venían de la caché —si se acaban de bajar en
   esta misma petición ya son las últimas— y nunca más de una vez cada
   ESPERA_REINTENTO. El primer reintento no espera, para que una rotación se
   recupere en la primera petición que la note. */
async function clavesTrasRotacion(equipo) {
  if (momentoReintento && Date.now() - momentoReintento < ESPERA_REINTENTO) return null;
  momentoReintento = Date.now();
  cacheClaves = null;
  try {
    return await descargarClaves(equipo);
  } catch (e) {
    /* Que Access no conteste ahora no cambia el diagnóstico: el token venía
       con una clave que no conocemos. El detalle se queda en el registro. */
    console.error('No se pudieron recargar las claves de Access:', e.message);
    return null;
  }
}

/* Lo que sale de aquí se le enseña al cliente, así que sólo salen mensajes
   nuestros y en castellano: `atob` y `JSON.parse` lanzan en inglés y con
   detalle interno («Invalid character», «Cannot read properties of null»).
   El detalle se queda en el registro, que es donde sirve para diagnosticar. */
function trozoDeToken(texto, queEs) {
  try {
    const valor = JSON.parse(new TextDecoder().decode(bytesDeBase64(texto)));
    if (!valor || typeof valor !== 'object') throw new Error('no es un objeto');
    return valor;
  } catch (e) {
    console.error(`No se pudo leer ${queEs} del token de Access:`, e.message);
    throw new FalloDeIdentidad(`el token trae ${queEs} ilegible`);
  }
}

function bytesDeBase64(s) {
  return Uint8Array.from(
    atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)
  );
}

/* Devuelve { correo } o lanza. Lanzar es lo correcto aqui: no hay un camino
   razonable "a medias" cuando la identidad no se puede establecer. */
export async function identificar(peticion, entorno) {
  const token = peticion.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new FalloDeIdentidad('la petición no trae identidad de Access');

  const [cabecera, cuerpo, firma] = token.split('.');
  if (!firma) throw new FalloDeIdentidad('el token no tiene el formato esperado');

  const veniaDeCache = cacheClaves !== null;
  const claves = await clavesDeAcceso(entorno.ACCESS_EQUIPO);
  const kid = trozoDeToken(cabecera, 'la cabecera').kid;

  let jwk = claves.find((k) => k.kid === kid);
  if (!jwk && veniaDeCache) {
    const renovadas = await clavesTrasRotacion(entorno.ACCESS_EQUIPO);
    if (renovadas) jwk = renovadas.find((k) => k.kid === kid);
  }
  if (!jwk) throw new FalloDeIdentidad('el token viene firmado con una clave desconocida');

  let valida = false;
  try {
    const clave = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    valida = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', clave, bytesDeBase64(firma),
      new TextEncoder().encode(`${cabecera}.${cuerpo}`)
    );
  } catch (e) {
    /* Una firma que ni siquiera se puede descodificar no es distinta, de cara
       a quien llama, de una firma que no cuadra: en ambos casos no se puede
       establecer la identidad. Lo que no puede es salir el error en inglés. */
    console.error('No se pudo comprobar la firma del token de Access:', e.message);
    throw new FalloDeIdentidad('la firma del token no se pudo comprobar');
  }
  if (!valida) throw new FalloDeIdentidad('la firma del token no es válida');

  const reclamaciones = trozoDeToken(cuerpo, 'el contenido');
  const problemas = reclamacionesValidas(
    reclamaciones, entorno.ACCESS_AUD, entorno.ACCESS_EQUIPO, Math.floor(Date.now() / 1000)
  );
  if (problemas.length) throw new FalloDeIdentidad(problemas.join('; '));

  if (!correoPermitido(reclamaciones.email, entorno.CORREOS_AUTORIZADOS)) {
    throw new FalloDeIdentidad('ese correo no tiene permiso');
  }

  return { correo: reclamaciones.email.trim().toLowerCase() };
}
