/* Sólo enruta. Cada ruta la atiende su módulo, para que este archivo se pueda
   leer entero de un vistazo y no crezca con cada cosa que se añada. */
import { identificar, FalloDeIdentidad } from './identidad.js';
import {
  leerBorrador, guardarBorrador, ConflictoDeVersion, VersionMalFormada
} from './almacen.js';
/* CATEGORIAS sale de `js/reglas-contenido.js`, que es lo que valida en los dos
   lados. Estuvo copiada aquí durante el bloque 3a. */
import { publicar, guardarImagen, CATEGORIAS } from './publicar.js';

/* Lo que sale de aquí se le enseña al cliente, así que sólo salen mensajes
   nuestros y en castellano. R2 y `JSON.parse` lanzan en inglés y con detalle
   interno («Unexpected token», «connection reset»), y sin un catch la
   excepción sale cruda del Worker en vez de como respuesta. El detalle se
   queda en el registro, que es donde sirve para diagnosticar. */
function fallo(estado, mensaje, e) {
  /* El detalle sólo se añade si aporta algo. Los fallos de identidad son los
     únicos que salen con su propio mensaje, así que sin esto el registro los
     escribiría dos veces seguidas y el mismo. */
  const detalle = e && e.message;
  console.error(detalle && detalle !== mensaje ? `${mensaje}: ${detalle}` : mensaje);
  return Response.json({ error: mensaje }, { status: estado });
}

/* Guardar y publicar chocan por la misma razón, así que responden igual: un
   solo sitio para que las dos formas no se separen con el tiempo. */
function conflicto(e) {
  return Response.json({ error: e.message, guardada: e.guardada }, { status: 409 });
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
           esto no es "no sé quién eres" sino "sé quién eres y no puedes".

           Éste era el único punto del archivo que no pasaba por `fallo()`, y
           reenviaba `e.message` a ciegas: bastaba un token bien firmado cuya
           reclamación `email` fuera un array para servir al cliente
           «reclamaciones.email.trim is not a function». Ahora sólo se enseña
           el mensaje si lo escribimos nosotros —eso es lo que marca
           FalloDeIdentidad—; cualquier otra cosa se registra y sale con
           mensaje propio, como el resto de las rutas. */
        return fallo(403,
          e instanceof FalloDeIdentidad ? e.message : 'no se pudo comprobar tu identidad', e);
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
        if (e instanceof ConflictoDeVersion) return conflicto(e);
        /* Y 400 cuando ni siquiera se puede saber si choca: una versión que no
           es un número no es un conflicto, y llamarlo conflicto le decía al
           panel que reintentara algo que no iba a colar nunca. */
        if (e instanceof VersionMalFormada) return fallo(400, e.message, e);
        return fallo(500, 'no se pudo guardar el borrador', e);
      }
    }

    /* El panel redimensiona antes de subir (a lo sumo unos 750 KB), así que
       pasar por el Worker con un binding de R2 no tiene coste apreciable y
       elimina las claves del problema entero: un binding no usa credenciales,
       así que no hay nada que firmar ni nada que se pueda filtrar. Lo que se
       acepta y lo que no lo decide `guardarImagen`. */
    if (ruta === '/api/imagen' && peticion.method === 'POST') {
      try {
        const { estado, cuerpo } = await guardarImagen(entorno, peticion);
        return Response.json(cuerpo, { status: estado });
      } catch (e) {
        return fallo(500, 'no se pudo guardar la imagen', e);
      }
    }

    if (ruta === '/api/publicar' && peticion.method === 'POST') {
      /* La versión es obligatoria: publicar sin decir qué se publica es
         justo el descuido contra el que sirve el control de versión. Se
         exige dígitos y no `Number()`, porque `Number(null)` y `Number('')`
         valen 0, que es una versión legítima. */
      const version = new URL(peticion.url).searchParams.get('version');
      if (!/^\d+$/.test(String(version))) {
        return Response.json(
          { error: 'falta la versión del borrador que se quiere publicar' }, { status: 400 }
        );
      }

      try {
        const resultado = await publicar(entorno, CATEGORIAS, Number(version));
        /* 422 y no 400: la petición está bien formada, lo que no se sostiene es
           el contenido que se quiere publicar. */
        return Response.json(resultado, { status: resultado.problemas ? 422 : 200 });
      } catch (e) {
        if (e instanceof ConflictoDeVersion) return conflicto(e);
        return fallo(500, 'no se pudo publicar', e);
      }
    }

    return new Response('No existe esa ruta', { status: 404 });
  }
};
