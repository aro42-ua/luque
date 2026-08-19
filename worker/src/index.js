/* Sólo enruta. Cada ruta la atiende su módulo, para que este archivo se pueda
   leer entero de un vistazo y no crezca con cada cosa que se añada. */
import { identificar } from './identidad.js';

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

    return new Response('No existe esa ruta', { status: 404 });
  }
};
