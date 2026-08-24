/* La lista blanca de formatos de imagen, y sólo ella. Vive aparte porque la
   usan los dos Workers y por motivos opuestos:

   - `publicar.js` (API) decide con ella QUÉ ENTRA al bucket.
   - `estatico/index.js` decide con ella CON QUÉ TIPO SALE lo que ya está
     dentro.

   Estuvo sólo en el primero, y la revisión de la Tarea 6 enseñó por qué no
   basta: el bucket tiene un segundo escritor —subidas a mano desde el panel
   de Cloudflare o `wrangler r2 object put`, que el propio docs/despliegue.md
   enseña a usar—, así que la puerta de entrada no cubre todo lo que puede
   acabar guardado. Un `img/mal.jpg` con `content-type: text/html` metido a
   mano se servía tal cual y ejecutaba su script en el origen público. Con la
   lista aquí, el que sirve los bytes decide el tipo por su cuenta y no se fía
   del metadato. */

const TIPOS_POR_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', avif: 'image/avif', gif: 'image/gif'
};

/* `image/jpg` no existe en el registro de tipos, pero lo mandan bastantes
   herramientas: se acepta como sinónimo para no dar un 415 desconcertante. */
const SINONIMOS = { 'image/jpg': 'image/jpeg' };

/* `.svg` queda fuera a propósito, aunque sea una imagen: puede llevar
   `<script>` dentro, y el objetivo es justamente que no se pueda alojar
   JavaScript en el dominio del estudio. */
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
