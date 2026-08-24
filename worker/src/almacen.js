const LLAVE_BORRADOR = 'borrador.json';
const LLAVE_CONTENIDO = 'contenido.json';

/* Dos personas y unas pocas ediciones al ano: no hace falta una base de datos,
   pero si hace falta que la segunda en guardar no pise a la primera sin
   enterarse. El numero de version es todo el mecanismo. */
export class ConflictoDeVersion extends Error {
  constructor(guardada, entrante) {
    super(`el contenido cambió mientras editabas: en el servidor va por la versión ${guardada} y tú traes la ${entrante}`);
    this.name = 'ConflictoDeVersion';
    this.guardada = guardada;
    this.entrante = entrante;
  }
}

/* Un campo de formulario del panel manda `"3"` y no `3`. Con la comparación
   estricta de abajo, eso chocaba contra la versión guardada y el 409 enseñaba
   dos números iguales: «va por la versión 3 y tú traes la 3». Y si el `"3"`
   llegaba a guardarse, el borrador quedaba IMPUBLICABLE PARA SIEMPRE sin tocar
   R2 a mano, porque la versión que trae `?version=` siempre es un `Number`.
   Así que se lee como versión lo que se pueda leer como versión, y lo que no,
   se rechaza diciendo por qué: un cuerpo mal formado no es un conflicto. */
export function comoVersion(valor) {
  const numero = typeof valor === 'string' && /^\d+$/.test(valor.trim())
    ? Number(valor)
    : valor;
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

/* 400 y no 409: la petición vino mal, no choca con nada. Distinguirlo importa
   porque el panel reintenta los 409 —recargar y volver a guardar los arregla—
   y reintentar esto no lo arreglaría nunca. */
export class VersionMalFormada extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'VersionMalFormada';
  }
}

/* Lo que trae la petición es de quien llama, así que se comprueba entero: sin
   la primera guarda, un cuerpo `null` o `0` valía como «versión 0», coincidía
   con el bucket virgen y se guardaba un borrador sin `proyectos` con un 200
   por delante. Y un cuerpo `[]` o `123` salía como 409, que le decía al panel
   que reintentara algo que nunca iba a colar. */
function versionEntrante(entrante) {
  if (!entrante || typeof entrante !== 'object' || Array.isArray(entrante)) {
    throw new VersionMalFormada('el borrador tiene que ser un objeto que diga de qué versión parte');
  }
  const version = comoVersion(entrante.version);
  if (version === null) {
    throw new VersionMalFormada(entrante.version === undefined
      ? 'el borrador tiene que decir de qué versión parte'
      : `la versión del borrador tiene que ser un número entero, y llegó «${String(entrante.version)}»`);
  }
  return version;
}

/* Lo guardado es nuestro, así que se normaliza en vez de rechazarlo: un `"3"`
   ahí sólo puede venir de un guardado anterior a esta comprobación o de una
   edición a mano del bucket, y dejar el borrador atascado por eso sería
   convertir un descuido viejo en una pérdida de trabajo. Lo que no se pueda
   leer como versión sí es un borrador roto, y se dice. */
export function versionGuardada(borrador) {
  if (!borrador) return 0;
  const version = comoVersion(borrador.version);
  if (version === null) throw new Error('el borrador guardado tiene una versión ilegible');
  return version;
}

export function siguienteVersion(guardado, entrante) {
  const traida = versionEntrante(entrante);
  const actual = versionGuardada(guardado);
  if (traida !== actual) throw new ConflictoDeVersion(actual, traida);
  return { version: actual + 1 };
}

async function leerJson(entorno, llave) {
  const objeto = await entorno.ALMACEN.get(llave);
  return objeto ? await objeto.json() : null;
}

export async function leerBorrador(entorno) {
  return (await leerJson(entorno, LLAVE_BORRADOR)) || { version: 0, proyectos: [] };
}

export async function guardarBorrador(entorno, datos) {
  const guardado = await leerJson(entorno, LLAVE_BORRADOR);
  const { version } = siguienteVersion(guardado, datos);
  const nuevo = { ...datos, version };
  await entorno.ALMACEN.put(LLAVE_BORRADOR, JSON.stringify(nuevo, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });
  return { version };
}

export { LLAVE_BORRADOR, LLAVE_CONTENIDO, leerJson };

