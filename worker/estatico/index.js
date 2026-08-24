/* El Worker de los recursos estáticos ("luque") gana aquí su primer fetch()
   propio. Hasta la Tarea 6 era un Worker de recursos estáticos puro: sin
   código, `wrangler deploy --assets <dir>` bastaba. Pero publicar (Tarea 5)
   escribe `contenido.json` DENTRO del bucket de R2, y la web pública pide ese
   archivo por ruta relativa a los estáticos —lee el que está versionado en el
   repositorio, no el de R2—. Sin este archivo, publicar no cambiaba nada de
   lo que ve un visitante, y nadie servía las imágenes que sube el panel
   (`/img/*`). Este módulo cierra ese hueco: sirve esas dos cosas desde R2 y
   deja pasar el resto a los archivos estáticos de siempre.

   TODO lo que responde este archivo es superficie pública: es lo único del
   bloque 3a que no está detrás de Access. De ahí que cada respuesta propia
   lleve sus cabeceras a mano —`_headers` no se aplica a lo que genera código
   de Worker— y que el tipo de lo que sale de R2 no se herede del metadato. */

import { LLAVE_CONTENIDO } from '../src/almacen.js';
import { tipoDeImagen } from '../src/tipos-imagen.js';

const RUTA_CONTENIDO = `/${LLAVE_CONTENIDO}`;
const PREFIJO_IMAGEN = '/img/';

/* Sólo se lee. El enrutador de estáticos contesta 405 a lo demás, así que
   dejarlo pasar aquí era superficie gratis: `POST /contenido.json` y
   `DELETE /img/foto.jpg` respondían 200 con el cuerpo entero. */
const METODOS = ['GET', 'HEAD'];

/* `_headers` fija X-Robots-Tag para todo el sitio, pero NO se aplica a lo que
   responde código de Worker —la misma salvedad de Cloudflare que obliga a
   acotar `run_worker_first`—. Así que va en TODA respuesta propia, incluidos
   los 404, los 405 y los 502: si no, son agujeros en el cierre a buscadores
   que sólo se ven mirando cabecera por cabecera. */
function cabecerasPropias(extra = {}) {
  return { 'x-robots-tag': 'noindex', ...extra };
}

function esRutaDeImagen(ruta) {
  return ruta.startsWith(PREFIJO_IMAGEN);
}

/* Sólo estas dos formas de ruta salen de R2, y la lista es explícita a
   propósito: `borrador.json` vive en el mismo bucket que `contenido.json`, y
   un Worker "genérico" que sirviera cualquier llave del bucket por su nombre
   de ruta lo dejaría legible por quien adivinara la URL —el trabajo sin
   publicar del estudio, expuesto—. Al no estar `borrador.json` en esta lista,
   no hay código que lo alcance: cae a `ASSETS.fetch()`, donde tampoco existe,
   y responde el 404 de siempre. */
function esRutaDeR2(ruta) {
  return ruta === RUTA_CONTENIDO || esRutaDeImagen(ruta);
}

/* El tipo lo decide la RUTA, nunca el metadato del objeto. R2 tiene un
   segundo escritor además de `POST /api/imagen` —subidas a mano desde el
   panel de Cloudflare o `wrangler r2 object put`—, así que reenviar
   `httpMetadata.contentType` a ciegas permitía servir `text/html` desde
   `img/mal.jpg` y ejecutar su script en el origen público. `nosniff` cierra
   además el camino de que el navegador adivine un tipo distinto del que
   declaramos. */
function tipoQueSeSirve(ruta) {
  if (ruta === RUTA_CONTENIDO) return 'application/json';
  return tipoDeImagen(ruta, null);
}

/* Las imágenes son inmutables por construcción: `guardarImagen` responde 409
   en vez de sobrescribir, así que una URL de `/img/` siempre devuelve los
   mismos bytes y se puede cachear para siempre. `contenido.json` sí cambia
   con cada publicación, así que se revalida siempre —lo que no impide el 304,
   que es lo que ahorra el tráfico—. Sin esto, cada carga de la galería
   volvía a descargar cada foto entera: una invocación de Worker, una
   operación de Clase B y el egreso completo, en una web de fotografía. */
function cacheDe(ruta) {
  return ruta === RUTA_CONTENIDO
    ? 'public, max-age=0, must-revalidate'
    : 'public, max-age=31536000, immutable';
}

async function servirDesdeR2(peticion, entorno, ruta) {
  const tipo = tipoQueSeSirve(ruta);
  /* Una llave con extensión fuera de la lista blanca (un .svg o un .html
     metidos a mano) no se sirve, y se responde 404 en vez de 415: es
     superficie pública, y que exista o no un objeto ahí dentro no es asunto
     de quien pregunta. */
  if (!tipo) return null;

  let objeto;
  try {
    objeto = await entorno.ALMACEN.get(ruta.slice(1));
  } catch (e) {
    /* Un fallo de R2 no es lo mismo que "no existe": `get()` devuelve null en
       el segundo caso y lanza en el primero. Sin este catch salía la página
       1101 de workerd —en inglés, sin X-Robots-Tag— en la ruta de datos de la
       portada. Se decide distinto según haya o no un plan B, y las dos ramas
       dejan rastro en el registro para que la caída sea distinguible de una
       primera publicación pendiente. */
    console.error(`R2 falló al leer ${ruta}: ${e && e.message}`);
    if (ruta === RUTA_CONTENIDO) return null;
    return new Response('No se ha podido leer la imagen', {
      status: 502, headers: cabecerasPropias({ 'content-type': 'text/plain; charset=utf-8' })
    });
  }

  if (!objeto) return null;

  const cabeceras = cabecerasPropias({
    'content-type': tipo,
    'cache-control': cacheDe(ruta),
    'x-content-type-options': 'nosniff'
  });
  /* `httpEtag` viene ya entrecomillado, que es como lo espera If-None-Match. */
  if (objeto.httpEtag) cabeceras.etag = objeto.httpEtag;

  /* El 304 se resuelve aquí y no con `onlyIf` en el `get` porque así la
     comparación queda a la vista y se puede probar sin simular la semántica
     condicional de R2. */
  if (objeto.httpEtag && peticion.headers.get('if-none-match') === objeto.httpEtag) {
    return new Response(null, { status: 304, headers: cabeceras });
  }

  return new Response(objeto.body, { headers: cabeceras });
}

export default {
  async fetch(peticion, entorno) {
    const ruta = new URL(peticion.url).pathname;

    if (esRutaDeR2(ruta)) {
      if (!METODOS.includes(peticion.method)) {
        return new Response('Método no permitido', {
          status: 405,
          headers: cabecerasPropias({
            allow: METODOS.join(', '), 'content-type': 'text/plain; charset=utf-8'
          })
        });
      }

      const respuesta = await servirDesdeR2(peticion, entorno, ruta);
      if (respuesta) return respuesta;

      /* Caída de vuelta a los estáticos, y sólo para /contenido.json. El día
         que este Worker se despliegue, en R2 todavía no hay ningún
         contenido.json publicado —nadie ha pulsado "publicar" todavía—, y sin
         esta caída la web se quedaría en el estado vacío hasta la primera
         publicación: justo el momento en que hace falta que siga funcionando
         igual que hoy. Con la caída, la transición es invisible —la web sigue
         sirviendo el contenido.json versionado en el repositorio— y en cuanto
         el estudio publique por primera vez, R2 manda.

         Vale también cuando R2 falla (ver el catch de arriba): hay un archivo
         perfectamente servible al lado, y para una web pública un contenido
         algo viejo es mejor que una página de error. Queda en el registro.

         /img/* no tiene caída ni falta que le hace: no existe ningún archivo
         estático equivalente —las imágenes las sube el panel directamente a
         R2—, así que si el objeto no está ahí no está en ningún sitio. */
      if (esRutaDeImagen(ruta)) {
        return new Response('No existe', {
          status: 404,
          headers: cabecerasPropias({ 'content-type': 'text/plain; charset=utf-8' })
        });
      }
    }

    return entorno.ASSETS.fetch(peticion);
  }
};
