/* El Worker de los recursos estáticos ("luque") gana aquí su primer fetch()
   propio. Hasta la Tarea 6 era un Worker de recursos estáticos puro: sin
   código, `wrangler deploy --assets <dir>` bastaba. Pero publicar (Tarea 5)
   escribe `contenido.json` DENTRO del bucket de R2, y la web pública pide ese
   archivo por ruta relativa a los estáticos —lee el que está versionado en el
   repositorio, no el de R2—. Sin este archivo, publicar no cambiaba nada de
   lo que ve un visitante, y nadie servía las imágenes que sube el panel
   (`/img/*`). Este módulo cierra ese hueco: sirve esas dos cosas desde R2 y
   deja pasar el resto a los archivos estáticos de siempre. */

import { LLAVE_CONTENIDO } from '../src/almacen.js';

const RUTA_CONTENIDO = `/${LLAVE_CONTENIDO}`;

function esRutaDeImagen(ruta) {
  return ruta.startsWith('/img/');
}

/* Sólo estas dos formas de ruta salen de R2, y la lista es explícita a
   propósito: `borrador.json` vive en el mismo bucket que `contenido.json`, y
   un Worker "genérico" que sirviera cualquier llave del bucket por su nombre
   de ruta lo dejaría legible por quien adivinara la URL —el trabajo sin
   publicar del estudio, expuesto—. Al no estar `borrador.json` en esta lista,
   no hay código que lo alcance: cae directo a `ASSETS.fetch()`, donde tampoco
   existe, y responde el 404 de siempre. */
function esRutaDeR2(ruta) {
  return ruta === RUTA_CONTENIDO || esRutaDeImagen(ruta);
}

export default {
  async fetch(peticion, entorno) {
    const ruta = new URL(peticion.url).pathname;

    if (esRutaDeR2(ruta)) {
      const objeto = await entorno.ALMACEN.get(ruta.slice(1));

      if (objeto) {
        return new Response(objeto.body, {
          headers: {
            'content-type': objeto.httpMetadata?.contentType || 'application/octet-stream'
          }
        });
      }

      /* Caída de vuelta a los estáticos, y sólo para /contenido.json. El día
         que este Worker se despliegue, en R2 todavía no hay ningún
         contenido.json publicado —nadie ha pulsado "publicar" todavía—, y sin
         esta caída la web se quedaría en el estado vacío hasta la primera
         publicación: justo el momento en que hace falta que siga funcionando
         igual que hoy. Con la caída, la transición es invisible —la web sigue
         sirviendo el contenido.json versionado en el repositorio— y en cuanto
         el estudio publique por primera vez, R2 manda, porque a partir de ahí
         `entorno.ALMACEN.get()` ya encuentra el objeto y este `if` ni se
         plantea la caída.

         /img/* no tiene caída ni falta que le hace: no existe ningún archivo
         estático equivalente —las imágenes las sube el panel directamente a
         R2—, así que si el objeto no está ahí no está en ningún sitio. */
      if (esRutaDeImagen(ruta)) {
        return new Response('No existe', { status: 404 });
      }
    }

    return entorno.ASSETS.fetch(peticion);
  }
};
