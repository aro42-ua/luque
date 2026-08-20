/* Se importa por su efecto: el archivo deja ReglasContenido en el objeto
   global, porque tiene que servir tambien al navegador, donde no hay modulos.
   Son las mismas reglas que usa la web; escribirlas otra vez aqui seria pedir
   que se separen. */
import '../../js/reglas-contenido.js';
import { LLAVE_BORRADOR, LLAVE_CONTENIDO, leerJson } from './almacen.js';

const reglas = globalThis.ReglasContenido;

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

/* Publicar es copiar el borrador sobre el contenido, y solo si esta entero.
   Se lee, se valida y se escribe una sola vez: no hay estado intermedio en el
   que la web pueda ver medio contenido. */
export async function publicar(entorno, categorias) {
  const borrador = await leerJson(entorno, LLAVE_BORRADOR);
  const problemas = problemasDelBorrador(borrador, categorias);
  if (problemas.length) return { problemas };

  await entorno.ALMACEN.put(LLAVE_CONTENIDO, JSON.stringify(borrador, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });
  return { version: borrador.version };
}
