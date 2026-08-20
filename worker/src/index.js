/* Sólo enruta. Cada ruta la atiende su módulo, para que este archivo se pueda
   leer entero de un vistazo y no crezca con cada cosa que se añada. */
import { identificar } from './identidad.js';
import { leerBorrador, guardarBorrador, ConflictoDeVersion } from './almacen.js';

/* Lo que sale de aquí se le enseña al cliente, así que sólo salen mensajes
   nuestros y en castellano. R2 y `JSON.parse` lanzan en inglés y con detalle
   interno («Unexpected token», «connection reset»), y sin un catch la
   excepción sale cruda del Worker en vez de como respuesta. El detalle se
   queda en el registro, que es donde sirve para diagnosticar. */
function fallo(estado, mensaje, e) {
  console.error(`${mensaje}:`, e && e.message);
  return Response.json({ error: mensaje }, { status: estado });
}

export default {
  async fetch(peticion, entorno) {
    const ruta = new URL(peticion.url).pathname;

    /* Salud no pide identidad a propósito: sirve para saber si el Worker está
       en pie sin necesidad de una sesión de Access. No revela nada. */
    if (ruta === '/api/salud') {
      return new Response(JSON.stringify({ bien: true }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    let identidad = null;
    if (ruta.startsWith('/api/')) {
      try {
        identidad = await identificar(peticion, entorno);
      } catch (e) {
        /* 403 y no 401: Access ya autenticó a quien llega hasta aquí, así que
           esto no es "no sé quién eres" sino "sé quién eres y no puedes". */
        return new Response(JSON.stringify({ error: e.message }), {
          status: 403, headers: { 'content-type': 'application/json' }
        });
      }
    }

    if (ruta === '/api/borrador' && peticion.method === 'GET') {
      try {
        return Response.json(await leerBorrador(entorno));
      } catch (e) {
        return fallo(500, 'no se pudo leer el borrador guardado', e);
      }
    }

    if (ruta === '/api/borrador' && peticion.method === 'PUT') {
      let datos;
      try {
        datos = await peticion.json();
      } catch (e) {
        /* 400 y no 500: lo que vino mal es la petición, no el servidor. El
           panel necesita distinguirlo para no reintentar lo que nunca va a
           colar. */
        return fallo(400, 'el cuerpo de la petición no es JSON válido', e);
      }

      try {
        return Response.json(await guardarBorrador(entorno, datos));
      } catch (e) {
        /* 409 es exactamente esto: la petición es válida, pero choca con el
           estado actual. El panel lo distingue de un error de verdad. */
        if (e instanceof ConflictoDeVersion) {
          return Response.json({ error: e.message, guardada: e.guardada }, { status: 409 });
        }
        return fallo(500, 'no se pudo guardar el borrador', e);
      }
    }

    return new Response('No existe esa ruta', { status: 404 });
  }
};
