/* Se importa por su efecto: el archivo deja ReglasContenido en el objeto
   global, porque tiene que servir tambien al navegador, donde no hay modulos.
   Son las mismas reglas que usa la web; escribirlas otra vez aqui seria pedir
   que se separen. */
import '../../js/reglas-contenido.js';
import { LLAVE_BORRADOR, LLAVE_CONTENIDO, leerJson, ConflictoDeVersion } from './almacen.js';

const reglas = globalThis.ReglasContenido;

/* La misma lista que usa el navegador, y no una copia. Estuvo escrita también
   en `index.js`, con un comentario que reconocía el duplicado: el pretexto era
   que `datos.js` cuelga de `window` sin el guardián de `globalThis`, pero la
   lista no tenía por qué vivir en `datos.js`. Ahora la custodia
   `reglas-contenido.js`, que es este mismo archivo que ya se importa aquí por
   su efecto, y `datos.js` la lee de ahí. Se reexporta desde aquí en vez de
   volver a importar el archivo desde `index.js` para que sólo un sitio del
   Worker sepa del guardián dual. */
export const CATEGORIAS = reglas.CATEGORIAS;

export function problemasDelBorrador(borrador, categorias) {
  /* Revisión de la Tarea 1: `ReglasContenido.validar` hace `categorias || []`
     por dentro, así que una lista ausente o mal formada no la hace lanzar:
     dice en silencio que todos los proyectos tienen categoría desconocida, y
     quien publica ve un 422 que no explica que el fallo es de configuración
     y no del contenido. Aquí se prefiere fallar alto y claro, porque quien
     llama a esta función es el propio Worker, no un tercero al que haya que
     tratar con guante. */
  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error('la lista de categorías no está configurada: no se puede validar el borrador');
  }

  const problemas = reglas.validar(borrador, categorias);
  if (borrador && Array.isArray(borrador.proyectos) && borrador.proyectos.length === 0) {
    problemas.push('no hay ningún proyecto que publicar');
  }
  return problemas;
}

/* Lo que llega del navegador no manda sobre donde se escribe: sin esto, un
   nombre con ../ podria sobrescribir contenido.json desde la ruta de subida. */
export function nombreSeguro(nombre) {
  const limpio = String(nombre || '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+/, '');
  return limpio || null;
}

/* Lista blanca de formatos, y el tipo que se guarda lo decide la extensión,
   nunca lo que declara quien sube. Sin esto, `?nombre=perfil.html` con
   `content-type: text/html` deja HTML —y por tanto JavaScript— alojado en el
   bucket, que es el dominio desde el que la Tarea 6 va a servir img/. */
const TIPOS_POR_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', avif: 'image/avif', gif: 'image/gif'
};

/* `image/jpg` no existe en el registro de tipos, pero lo mandan bastantes
   herramientas: se acepta como sinónimo para no dar un 415 desconcertante. */
const SINONIMOS = { 'image/jpg': 'image/jpeg' };

/* El panel sube imágenes ya redimensionadas —la mayor ronda los 750 KB—, así
   que 5 MB dejan margen de sobra y ponen un techo muy por debajo de los
   100 MB que el Worker aceptaría por defecto. */
export const TOPE_IMAGEN = 5 * 1024 * 1024;

export function tipoDeImagen(nombre, tipoDeclarado) {
  const punto = String(nombre || '').lastIndexOf('.');
  const extension = punto === -1 ? '' : String(nombre).slice(punto + 1).toLowerCase();
  const esperado = TIPOS_POR_EXTENSION[extension];
  if (!esperado) return null;

  /* El content-type puede faltar (lo suple la extensión); lo que no puede es
     contradecirla, porque entonces uno de los dos miente y no sabemos cuál. */
  const bruto = String(tipoDeclarado || '').split(';')[0].trim().toLowerCase();
  if (!bruto) return esperado;
  return (SINONIMOS[bruto] || bruto) === esperado ? esperado : null;
}

/* Devuelve `{ estado, cuerpo }` en vez de una Response para que index.js siga
   siendo sólo el enrutador. Los fallos de R2 salen como excepción y los
   traduce el `fallo()` de index.js, como en el resto de rutas. */
export async function guardarImagen(entorno, peticion) {
  const url = new URL(peticion.url);
  const nombre = nombreSeguro(url.searchParams.get('nombre'));
  if (!nombre) return { estado: 400, cuerpo: { error: 'falta el nombre del archivo' } };

  const tipo = tipoDeImagen(nombre, peticion.headers.get('content-type'));
  if (!tipo) {
    return { estado: 415, cuerpo: { error:
      'sólo se aceptan imágenes jpg, png, webp, avif o gif, y la extensión tiene que coincidir con el tipo declarado' } };
  }

  /* El Content-Length se mira antes de leer el cuerpo, para no traerse a
     memoria una subida que ya se sabe que sobra. Puede faltar o mentir, así
     que después se vuelve a medir lo que de verdad llegó. */
  const anunciado = Number(peticion.headers.get('content-length'));
  if (Number.isFinite(anunciado) && anunciado > TOPE_IMAGEN) {
    return { estado: 413, cuerpo: { error: 'la imagen supera el tamaño máximo de 5 MB' } };
  }

  const bytes = await peticion.arrayBuffer();
  /* Un cuerpo ausente o vacío llegaba a R2 como un objeto de 0 bytes y
     respondía 200: es decir, borraba en silencio una imagen ya publicada. */
  if (bytes.byteLength === 0) {
    return { estado: 400, cuerpo: { error: 'la petición no trae ninguna imagen' } };
  }
  if (bytes.byteLength > TOPE_IMAGEN) {
    return { estado: 413, cuerpo: { error: 'la imagen supera el tamaño máximo de 5 MB' } };
  }

  /* Se rechaza en vez de sobrescribir. Los nombres colapsan al sanearlos
     (`bruma/01.jpg` y `bruma-01.jpg` dan la misma llave), así que dejar pasar
     la segunda subida perdería una imagen ya publicada sin que nadie se
     entere: mejor un 409 y que el panel elija otro nombre. */
  const llave = `img/${nombre}`;
  if (await entorno.ALMACEN.head(llave)) {
    return { estado: 409, cuerpo: { error: `ya hay una imagen guardada como ${nombre}: elige otro nombre` } };
  }

  await entorno.ALMACEN.put(llave, bytes, { httpMetadata: { contentType: tipo } });
  return { estado: 200, cuerpo: { url: `/${llave}` } };
}

/* Publicar es copiar el borrador sobre el contenido, y solo si esta entero.
   Se lee, se valida y se escribe una sola vez: no hay estado intermedio en el
   que la web pueda ver medio contenido. */
export async function publicar(entorno, categorias, versionEsperada) {
  const borrador = await leerJson(entorno, LLAVE_BORRADOR);

  /* El mismo control de versión que guardarBorrador, y por el mismo motivo:
     sin esto, un PUT /api/borrador que caiga entre esta lectura y la
     escritura publicaría un borrador que el operador nunca dio por bueno, y
     el 200 le devolvería una versión que no es la que creía publicar.
     Se reutiliza ConflictoDeVersion para que el panel reciba exactamente la
     misma forma de respuesta que cuando choca al guardar. */
  const guardada = borrador ? borrador.version : 0;
  if (versionEsperada !== guardada) throw new ConflictoDeVersion(guardada, versionEsperada);

  const problemas = problemasDelBorrador(borrador, categorias);
  if (problemas.length) return { problemas };

  await entorno.ALMACEN.put(LLAVE_CONTENIDO, JSON.stringify(borrador, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });
  return { version: borrador.version };
}
