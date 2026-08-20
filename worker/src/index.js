/* Sólo enruta. Cada ruta la atiende su módulo, para que este archivo se pueda
   leer entero de un vistazo y no crezca con cada cosa que se añada. */
import { identificar } from './identidad.js';
import { leerBorrador, guardarBorrador, ConflictoDeVersion } from './almacen.js';

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
      return Response.json(await leerBorrador(entorno));
    }

    if (ruta === '/api/borrador' && peticion.method === 'PUT') {
      try {
        return Response.json(await guardarBorrador(entorno, await peticion.json()));
      } catch (e) {
        /* 409 es exactamente esto: la petición es válida, pero choca con el
           estado actual. El panel lo distingue de un error de verdad. */
        if (e instanceof ConflictoDeVersion) {
          return Response.json({ error: e.message, guardada: e.guardada }, { status: 409 });
        }
        throw e;
      }
    }

    return new Response('No existe esa ruta', { status: 404 });
  }
};
