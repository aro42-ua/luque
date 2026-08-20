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

export function siguienteVersion(guardado, entrante) {
  const actual = guardado ? guardado.version : 0;
  const traida = entrante ? entrante.version : 0;
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
