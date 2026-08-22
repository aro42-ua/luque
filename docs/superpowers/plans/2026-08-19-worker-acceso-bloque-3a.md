# El Worker, R2 y Access — plan del bloque 3a

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** levantar la única pieza del proyecto con permisos de escritura —el
Worker— junto al almacenamiento (R2) y la puerta (Access), de modo que el panel
del bloque 3b tenga dónde guardar sin que exista todavía ninguna pantalla.

**Arquitectura:** un Worker de Cloudflare detrás de Cloudflare Access. Access
filtra por correo y adjunta un JWT; el Worker **vuelve a verificarlo** en cada
petición y no se fía de que Access ya lo hiciera. El borrador y el contenido son
dos objetos en R2, con un número de versión que evita que dos sesiones se pisen.
La lógica pura (identidad, versión, validación) vive separada de las ataduras de
Cloudflare, para poder probarla con Node sin desplegar nada.

**Tecnologías:** Workers (ESM, workerd), R2 con *binding* —sin credenciales—,
Cloudflare Access (JWT), Node 24 para las pruebas (`node --test`), `wrangler`
para desplegar.

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`
— léela entera, incluida la sección **Correcciones tras implementar los bloques
1 y 2**, que rectifica cuatro afirmaciones del documento original.

## Restricciones globales

- **Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.**
  Criterio de aceptación 11. Hoy `js/visor.js` está en 299: si una tarea te
  obliga a tocarlo, pártelo antes de escribir, no después.
- **`js/` sigue en ES5 estricto** y con el patrón `window.Nombre`: nada de
  `let`, `const`, arrow o módulos. **`worker/` no**: es ESM y puede usar
  JavaScript moderno.
- **El Worker no confía en Access.** Verifica firma, `aud`, `iss`, `exp` y
  correo en cada petición. Un tercer correo no llega ni al panel ni al Worker
  (criterio 5).
- **Publicar es atómico** (criterio 2 y 3): `contenido.json` sólo se escribe si
  el borrador entero es válido.
- **Nada de credenciales en el repositorio.** Ni claves de R2, ni el AUD de
  Access, ni correos. Van en variables y secretos de `wrangler`.
- Comentarios y mensajes de error **en castellano**, como el resto del proyecto.

---

## Dos desvíos de la especificación, razonados

Quien ejecute esto debe saber que son deliberados y por qué.

### 1. Las subidas no se firman: van por el Worker con un *binding* de R2

La especificación dice: «Firma subidas a R2, para que el navegador suba directo
sin que las claves pasen nunca por él». Esa frase se escribió suponiendo que se
subían los originales, «entre 20 y 50 MB».

Pero el panel **redimensiona antes de subir** (la propia especificación lo pide):
lo que sale del navegador son tres archivos de como mucho 2400×3000, unos 750 KB
el mayor. A ese tamaño, pasar por el Worker no tiene inconveniente —el límite de
cuerpo de petición son 100 MB— y **elimina las claves del problema entero**: un
*binding* de R2 no usa credenciales, así que no hay nada que firmar ni nada que
se pueda filtrar. Cumple el objetivo de la frase mejor que la frase.

Firmar con SigV4 en un Worker exigiría además implementarlo a mano o añadir una
dependencia, y este proyecto no tiene ninguna.

**Si el tamaño de subida creciera** —originales sin redimensionar, vídeo— habría
que volver a las URL firmadas. Queda escrito para que la decisión se pueda
revisar con su motivo delante.

### 2. La validación se escribe una vez y la usan los dos

La especificación dice que el Worker «valida con las mismas reglas que
`Contenido.validar`». *Las mismas reglas* escritas dos veces son dos reglas que
divergen: este proyecto ya lo ha vivido —el bloque 2 dejó el visor leyendo un
modelo que los demás habían dejado de usar, y nadie lo notó hasta abrir la web—.

Así que la Tarea 1 saca las reglas a un archivo que cargan **el navegador y el
Worker**, y no hay segunda copia. El precio es un pequeño refactor de
`js/contenido.js`: `validar` deja de leer `window.Datos.CATEGORIAS` por su
cuenta y lo recibe como argumento, porque en el Worker no hay `window`.

---

## Antes de empezar: lo que hace el estudio

**Esto no lo hace quien implementa.** Son cuentas y credenciales, y la
especificación es explícita: «Las crea el estudio: no creo cuentas ni introduzco
credenciales». Sin esto, las Tareas 2 a 6 se escriben y se prueban con Node,
pero no se despliegan.

1. **Instalar `wrangler`:** `npm install -g wrangler`. Node ya está (v24.19.0);
   `wrangler` hoy **no** está instalado.
2. **`wrangler login`** — abre el navegador contra la cuenta de Cloudflare.
3. **Crear el bucket de R2:** `wrangler r2 bucket create luque-contenido`.
4. **Configurar Cloudflare Access** sobre la ruta `/panel*` y sobre el Worker de
   la API, con una política que permita exactamente **dos correos**. Del panel
   de Access hacen falta dos datos para el paso siguiente:
   - el **AUD tag** de la aplicación,
   - el **dominio del equipo** (`<algo>.cloudflareaccess.com`).
5. **Pasarlos como configuración**, nunca al repositorio:
   ```
   wrangler secret put ACCESS_AUD
   wrangler secret put ACCESS_EQUIPO
   wrangler secret put CORREOS_AUTORIZADOS      # los dos, separados por comas
   ```

**Confirma las cifras de las capas gratuitas al hacerlo** (la especificación lo
pide: las suyas son de agosto de 2026 y no se dan por buenas).

---

## Estructura de archivos

| Archivo | De qué responde |
|---|---|
| `js/reglas-contenido.js` | **Nuevo.** Las reglas de validación, sin depender de `window`. Lo cargan el navegador y el Worker. |
| `js/contenido.js` | Se queda con pedir el archivo por red y delega la validación en el anterior. |
| `worker/src/index.js` | El enrutado y nada más: qué función atiende cada ruta. |
| `worker/src/identidad.js` | Verificar el JWT de Access y el correo. |
| `worker/src/almacen.js` | Leer y escribir en R2, con el control de versión. |
| `worker/src/publicar.js` | Validar el borrador entero y copiarlo sobre el contenido. |
| `worker/test/*.test.js` | Pruebas con `node --test`, sin desplegar. |
| `worker/wrangler.toml` | Configuración: *binding* de R2, rutas, variables. |

Cada archivo del Worker hace una cosa, y las tres primeras son lógica pura o
casi: se prueban sin red y sin Cloudflare.

---

### Tarea 1: Las reglas de validación, en un solo sitio

**Archivos:**
- Crear: `js/reglas-contenido.js`
- Modificar: `js/contenido.js`
- Modificar: `index.html`, `tests/test.html` (un `<script>` más, antes de `contenido.js`)
- Modificar: `tests/pruebas-contenido.js`

**Interfaces:**
- Produce: `window.ReglasContenido.validar(datos, categorias)` → array de
  strings con los problemas, vacío si todo bien. **Recibe las categorías**, no
  las busca: en el Worker no hay `window.Datos`.
- Consume: nada.

- [ ] **Paso 1: La prueba que falla**

Añade al principio de `tests/pruebas-contenido.js`:

```js
describe('ReglasContenido.validar', function () {
  prueba('recibe las categorías en vez de buscarlas', function () {
    var datos = { proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
                                 tipo: 'fotos', portada: 'p.jpg',
                                 piezas: [{ url: 'a.jpg' }] } ] };
    cierto(ReglasContenido.validar(datos, ['editorial']).length > 0);
    igual(ReglasContenido.validar(datos, ['inventada']), []);
  });
});
```

- [ ] **Paso 2: Comprueba que falla**

Pide el arnés al controlador. Esperado: `ReglasContenido is not defined`.

- [ ] **Paso 3: Crea `js/reglas-contenido.js`**

Es el cuerpo actual de `Contenido.validar`, con `cats` como parámetro.

**Sobre el envoltorio.** El archivo deja `ReglasContenido` en el objeto global,
y el Worker lo importa **por su efecto** y lo lee de ahí. Parece rodeo, pero es
lo único que funciona en los dos sitios, y está probado:

- Un envoltorio UMD con `module.exports` **no vale**. Con `"type": "module"` en
  `worker/package.json`, Node trata el `.js` como ESM, esa rama nunca se ejecuta
  y el `import` falla con *«does not provide an export named 'default'»*.
- `typeof self !== 'undefined' ? self : this` **tampoco**. En Node no hay `self`
  y en un módulo ESM `this` es `undefined`, así que revienta al asignar.

De ahí `window` con `globalThis` de reserva: `window` en el navegador,
`globalThis` en Node y en workerd. Sigue siendo ES5 válido —`globalThis` es un
global en tiempo de ejecución, no sintaxis nueva—, así que la restricción de
`js/` se respeta.

```js
/* Las reglas de validación, y sólo ellas. Viven aparte porque las usan dos
   sitios: el navegador antes de pintar, y el Worker antes de publicar. Escritas
   dos veces serían dos reglas que se separan sin que nadie se entere. */
(function (raiz) {

  function validar(datos, categorias) {
    var problemas = [];
    if (!datos || Object.prototype.toString.call(datos.proyectos) !== '[object Array]') {
      return ['el contenido no trae una lista de proyectos'];
    }
    var cats = categorias || [];
    var vistos = {};
    datos.proyectos.forEach(function (p, i) {
      var donde = p && p.id ? p.id : 'el proyecto n.º ' + (i + 1);
      if (!p.id)      problemas.push(donde + ': sin identificador');
      if (!p.titulo)  problemas.push(donde + ': sin título');
      if (vistos[p.id]) problemas.push('identificador repetido: ' + p.id);
      vistos[p.id] = true;
      if (cats.indexOf(p.id) !== -1) problemas.push('el id choca con una categoría: ' + p.id);
      if (cats.indexOf(p.categoria) === -1) problemas.push(donde + ': categoría desconocida: ' + p.categoria);
      if (p.tipo === 'fotos') {
        if (!p.piezas || !p.piezas.length) problemas.push(donde + ': sin piezas');
        if (!p.portada) problemas.push(donde + ': sin portada');
        (p.piezas || []).forEach(function (pieza, j) {
          if (!pieza || !pieza.url) problemas.push(donde + ': la pieza n.º ' + (j + 1) + ' no trae url');
        });
      } else if (p.tipo === 'video') {
        if (!p.poster) problemas.push(donde + ': un proyecto de vídeo necesita poster');
      } else {
        problemas.push(donde + ': tipo desconocido: ' + p.tipo);
      }
    });
    return problemas;
  }

  raiz.ReglasContenido = { validar: validar };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Paso 3b: Comprueba AHORA que el Worker podrá cargarlo**

No lo dejes para la Tarea 5: si esto no funciona, el diseño de «las reglas en un
solo sitio» se cae entero y conviene saberlo antes de construir cinco tareas
encima.

```bash
cd worker && node --input-type=module -e "
  await import('../js/reglas-contenido.js');
  const r = globalThis.ReglasContenido;
  console.log(r.validar({proyectos:[]}, ['editorial']));
"
```

Esperado: imprime `[]`. Si dice `does not provide an export` o
`Cannot set properties of undefined`, el envoltorio está mal — vuelve al texto
de arriba.

- [ ] **Paso 4: `js/contenido.js` delega**

Sustituye toda su función `validar` por:

```js
  function validar(datos) {
    return window.ReglasContenido.validar(datos, window.Datos.CATEGORIAS);
  }
```

`cargar` no cambia. `Contenido.validar` mantiene su firma de un argumento, así
que **no hay que tocar ninguna de sus llamadas** ni las pruebas que ya existen.

- [ ] **Paso 5: Los `<script>`**

En `index.html` y en `tests/test.html`, `reglas-contenido.js` va **antes** de
`contenido.js`:

```html
<script src="js/reglas-contenido.js"></script>
<script src="js/contenido.js"></script>
```

- [ ] **Paso 6: Comprueba**

```bash
wc -l js/reglas-contenido.js js/contenido.js
python tests/auditar_rutas.py
```

Los dos por debajo de 300, auditor OK. Pide el arnés: las 61 anteriores **más**
la nueva, todas en verde. Que las viejas sigan pasando es la prueba de que el
refactor no cambió comportamiento.

- [ ] **Paso 7: Commit**

```bash
git add js/reglas-contenido.js js/contenido.js index.html tests/
git commit -m "Sacar las reglas de validacion a un archivo que usen los dos lados"
```

---

### Tarea 2: El esqueleto del Worker y su configuración

**Archivos:**
- Crear: `worker/wrangler.toml`, `worker/src/index.js`, `worker/package.json`
- Crear: `worker/test/index.test.js`

**Interfaces:**
- Produce: un Worker que responde `404` a lo desconocido y `200` a
  `GET /api/salud`, sin tocar R2 todavía.

- [ ] **Paso 1: La prueba que falla**

`worker/test/index.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../src/index.js';

const entorno = { CORREOS_AUTORIZADOS: 'a@x.com', ACCESS_AUD: 'aud', ACCESS_EQUIPO: 'eq' };

test('una ruta desconocida devuelve 404', async () => {
  const r = await worker.fetch(new Request('https://x/nada'), entorno);
  assert.equal(r.status, 404);
});

test('salud responde 200 sin pedir identidad', async () => {
  const r = await worker.fetch(new Request('https://x/api/salud'), entorno);
  assert.equal(r.status, 200);
});
```

- [ ] **Paso 2: Comprueba que falla**

```bash
cd worker && node --test
```

Esperado: falla al no encontrar `../src/index.js`.

- [ ] **Paso 3: `worker/package.json`**

```json
{
  "name": "luque-worker",
  "private": true,
  "type": "module"
}
```

- [ ] **Paso 4: `worker/src/index.js`**

```js
/* Sólo enruta. Cada ruta la atiende su módulo, para que este archivo se pueda
   leer entero de un vistazo y no crezca con cada cosa que se añada. */
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

    return new Response('No existe esa ruta', { status: 404 });
  }
};
```

- [ ] **Paso 5: Comprueba que pasa**

```bash
cd worker && node --test
```

Esperado: las dos en verde.

- [ ] **Paso 6: `worker/wrangler.toml`**

Sin secretos: aquí sólo va lo que puede estar en el repositorio.

```toml
name = "luque-api"
main = "src/index.js"
compatibility_date = "2026-08-19"

[[r2_buckets]]
binding = "ALMACEN"
bucket_name = "luque-contenido"
```

- [ ] **Paso 7: Commit**

```bash
git add worker/
git commit -m "Levantar el esqueleto del Worker con su ruta de salud"
```

---

### Tarea 3: Verificar la identidad que adjunta Access

**Archivos:**
- Crear: `worker/src/identidad.js`, `worker/test/identidad.test.js`
- Modificar: `worker/src/index.js`

**Interfaces:**
- Produce:
  - `correoPermitido(correo, listaSeparadaPorComas)` → booleano
  - `reclamacionesValidas(reclamaciones, aud, equipo, ahora)` → array de
    problemas, vacío si todo bien
  - `identificar(peticion, entorno)` → `{ correo }` o lanza `Error`

Se separa a propósito lo comprobable sin criptografía (`correoPermitido`,
`reclamacionesValidas`) de lo que necesita las claves públicas de Access. Así
la mayor parte se prueba con `node --test` sin red.

- [ ] **Paso 1: Las pruebas que fallan**

`worker/test/identidad.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { correoPermitido, reclamacionesValidas } from '../src/identidad.js';

const AHORA = 1_800_000_000;

test('sólo pasan los correos de la lista', () => {
  assert.equal(correoPermitido('a@x.com', 'a@x.com,b@x.com'), true);
  assert.equal(correoPermitido('b@x.com', 'a@x.com,b@x.com'), true);
  assert.equal(correoPermitido('c@x.com', 'a@x.com,b@x.com'), false);
});

test('no se cuela por mayusculas ni por espacios', () => {
  assert.equal(correoPermitido(' A@X.com ', 'a@x.com'), true);
});

test('un correo vacio no pasa aunque la lista tenga huecos', () => {
  assert.equal(correoPermitido('', 'a@x.com,,'), false);
  assert.equal(correoPermitido(undefined, 'a@x.com'), false);
});

test('rechaza un aud que no es el nuestro', () => {
  const r = { aud: ['otro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('rechaza un token caducado', () => {
  const r = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA - 1, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('rechaza un emisor que no es nuestro equipo', () => {
  const r = { aud: ['nuestro'], iss: 'https://otroequipo.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.ok(reclamacionesValidas(r, 'nuestro', 'eq', AHORA).length > 0);
});

test('acepta un token correcto', () => {
  const r = { aud: ['nuestro'], iss: 'https://eq.cloudflareaccess.com', exp: AHORA + 60, email: 'a@x.com' };
  assert.deepEqual(reclamacionesValidas(r, 'nuestro', 'eq', AHORA), []);
});
```

- [ ] **Paso 2: Comprueba que fallan**

```bash
cd worker && node --test
```

- [ ] **Paso 3: `worker/src/identidad.js`**

```js
/* Access ya filtra por correo antes de que la peticion llegue aqui. Esto lo
   vuelve a comprobar igualmente: si algun dia el Worker queda expuesto por una
   ruta que no pasa por Access, esta es la unica linea de defensa que queda.
   La especificacion lo pide expresamente. */

const MARGEN_RELOJ = 60;   // segundos de tolerancia entre relojes

export function correoPermitido(correo, lista) {
  if (!correo) return false;
  const limpio = String(correo).trim().toLowerCase();
  if (!limpio) return false;
  return String(lista || '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .includes(limpio);
}

export function reclamacionesValidas(reclamaciones, aud, equipo, ahora) {
  const problemas = [];
  if (!reclamaciones) return ['el token no trae reclamaciones'];

  const audiencias = [].concat(reclamaciones.aud || []);
  if (!audiencias.includes(aud)) problemas.push('el token no es para esta aplicación');

  if (reclamaciones.iss !== `https://${equipo}.cloudflareaccess.com`) {
    problemas.push('el token no lo emitió nuestro equipo');
  }

  if (!reclamaciones.exp || reclamaciones.exp + MARGEN_RELOJ < ahora) {
    problemas.push('el token ha caducado');
  }

  if (!reclamaciones.email) problemas.push('el token no dice de quién es');

  return problemas;
}
```

- [ ] **Paso 4: Comprueba que pasan**

```bash
cd worker && node --test
```

Esperado: las seis nuevas y las dos de la Tarea 2, en verde.

- [ ] **Paso 5: La verificación de la firma**

Añade al mismo archivo. Esto sí necesita red —las claves públicas de Access— y
por eso no tiene prueba unitaria: se comprueba desplegado, en la Tarea 6.

```js
let cacheClaves = null;

async function clavesDeAcceso(equipo) {
  if (cacheClaves) return cacheClaves;
  const r = await fetch(`https://${equipo}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('no se pudieron leer las claves de Access');
  cacheClaves = (await r.json()).keys;
  return cacheClaves;
}

/* Devuelve { correo } o lanza. Lanzar es lo correcto aqui: no hay un camino
   razonable "a medias" cuando la identidad no se puede establecer. */
export async function identificar(peticion, entorno) {
  const token = peticion.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('la petición no trae identidad de Access');

  const [cabecera, cuerpo, firma] = token.split('.');
  if (!firma) throw new Error('el token no tiene el formato esperado');

  const claves = await clavesDeAcceso(entorno.ACCESS_EQUIPO);
  const kid = JSON.parse(atob(cabecera.replace(/-/g, '+').replace(/_/g, '/'))).kid;
  const jwk = claves.find((k) => k.kid === kid);
  if (!jwk) throw new Error('el token viene firmado con una clave desconocida');

  const clave = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const bytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const valida = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', clave, bytes(firma), new TextEncoder().encode(`${cabecera}.${cuerpo}`)
  );
  if (!valida) throw new Error('la firma del token no es válida');

  const reclamaciones = JSON.parse(new TextDecoder().decode(bytes(cuerpo)));
  const problemas = reclamacionesValidas(
    reclamaciones, entorno.ACCESS_AUD, entorno.ACCESS_EQUIPO, Math.floor(Date.now() / 1000)
  );
  if (problemas.length) throw new Error(problemas.join('; '));

  if (!correoPermitido(reclamaciones.email, entorno.CORREOS_AUTORIZADOS)) {
    throw new Error('ese correo no tiene permiso');
  }

  return { correo: reclamaciones.email.trim().toLowerCase() };
}
```

- [ ] **Paso 6: Engánchalo en `index.js`**

Toda ruta bajo `/api/` que no sea `/api/salud` pasa por aquí:

```js
import { identificar } from './identidad.js';

// dentro de fetch(), tras la comprobación de /api/salud:
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
```

**No cuelgues la identidad de `peticion`.** `Request` es un objeto de la
plataforma y en workerd no admite propiedades nuevas: `peticion.identidad = …`
funcionaría en las pruebas con Node y fallaría desplegado. Pásala como variable
a quien la necesite.

- [ ] **Paso 7: Commit**

```bash
git add worker/
git commit -m "Verificar en el Worker la identidad que adjunta Access"
```

---

### Tarea 4: El borrador en R2, con control de versión

**Archivos:**
- Crear: `worker/src/almacen.js`, `worker/test/almacen.test.js`
- Modificar: `worker/src/index.js`

**Interfaces:**
- Produce:
  - `siguienteVersion(guardado, entrante)` → `{ version }` o lanza `ConflictoDeVersion`
  - `leerBorrador(entorno)` → objeto (uno vacío la primera vez)
  - `guardarBorrador(entorno, datos)` → `{ version }`
- Consume: el *binding* `ALMACEN` de `wrangler.toml`.

- [ ] **Paso 1: Las pruebas que fallan**

`worker/test/almacen.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { siguienteVersion, ConflictoDeVersion } from '../src/almacen.js';

test('la version sube de uno en uno', () => {
  assert.deepEqual(siguienteVersion({ version: 4 }, { version: 4 }), { version: 5 });
});

test('el primer guardado parte de cero', () => {
  assert.deepEqual(siguienteVersion(null, { version: 0 }), { version: 1 });
});

test('guardar sobre una version vieja es conflicto', () => {
  assert.throws(
    () => siguienteVersion({ version: 7 }, { version: 5 }),
    ConflictoDeVersion
  );
});

test('el conflicto dice las dos versiones, para poder avisar bien', () => {
  try {
    siguienteVersion({ version: 7 }, { version: 5 });
    assert.fail('tenia que haber lanzado');
  } catch (e) {
    assert.equal(e.guardada, 7);
    assert.equal(e.entrante, 5);
  }
});
```

- [ ] **Paso 2: Comprueba que fallan**

```bash
cd worker && node --test
```

- [ ] **Paso 3: `worker/src/almacen.js`**

```js
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
```

- [ ] **Paso 4: Comprueba que pasan**

```bash
cd worker && node --test
```

- [ ] **Paso 5: Las rutas en `index.js`**

```js
import { leerBorrador, guardarBorrador, ConflictoDeVersion } from './almacen.js';

// dentro de fetch(), tras la comprobación de identidad:
    if (ruta === '/api/borrador' && peticion.method === 'GET') {
      return Response.json(await leerBorrador(entorno));
    }

    if (ruta === '/api/borrador' && peticion.method === 'PUT') {
      try {
        return Response.json(await guardarBorrador(entorno, await peticion.json()));
      } catch (e) {
        /* 409 es exactamente esto: la peticion es valida, pero choca con el
           estado actual. El panel lo distingue de un error de verdad. */
        if (e instanceof ConflictoDeVersion) {
          return Response.json({ error: e.message, guardada: e.guardada }, { status: 409 });
        }
        throw e;
      }
    }
```

- [ ] **Paso 6: Commit**

```bash
git add worker/
git commit -m "Guardar el borrador en R2 rechazando los guardados que chocan"
```

---

### Tarea 5: Subir imágenes y publicar

**Archivos:**
- Crear: `worker/src/publicar.js`, `worker/test/publicar.test.js`
- Modificar: `worker/src/index.js`, `worker/wrangler.toml`
- Copiar: `js/reglas-contenido.js` **no**: se importa (ver abajo)

**Interfaces:**
- Produce:
  - `POST /api/imagen?nombre=…` → `{ url }`, guarda el cuerpo en R2
  - `POST /api/publicar?version=<n>` → `{ version }` (200) o `{ problemas: [...] }`
    (422). `?version` es obligatoria: sin ella, o si no son dígitos, da 400 —no
    422— porque ni siquiera se puede saber si choca con lo guardado.

- [ ] **Paso 1: La prueba que falla**

`worker/test/publicar.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { problemasDelBorrador, nombreSeguro } from '../src/publicar.js';

const CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

test('un borrador valido no da problemas', () => {
  const b = { version: 3, proyectos: [ { id: 'bruma', titulo: 'Bruma', categoria: 'editorial',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg', miniatura: 'm.jpg' }] } ] };
  assert.deepEqual(problemasDelBorrador(b, CATEGORIAS), []);
});

test('un borrador sin proyectos no se publica', () => {
  assert.ok(problemasDelBorrador({ version: 1, proyectos: [] }, CATEGORIAS).length > 0);
});

test('usa las mismas reglas que el navegador', () => {
  const b = { version: 1, proyectos: [ { id: 'x', titulo: 'X', categoria: 'inventada',
    tipo: 'fotos', portada: 'p.jpg', piezas: [{ url: 'a.jpg' }] } ] };
  assert.ok(problemasDelBorrador(b, CATEGORIAS).join(' ').includes('categoría desconocida'));
});

test('un nombre de archivo no puede escaparse de su carpeta', () => {
  assert.equal(nombreSeguro('../../secreto.json'), 'secreto.json');
  assert.equal(nombreSeguro('bruma/01.jpg'), 'bruma-01.jpg');
  assert.equal(nombreSeguro(''), null);
});
```

- [ ] **Paso 2: Comprueba que fallan**

```bash
cd worker && node --test
```

- [ ] **Paso 3: `worker/src/publicar.js`**

```js
/* Se importa por su efecto: el archivo deja ReglasContenido en el objeto
   global, porque tiene que servir tambien al navegador, donde no hay modulos.
   Son las mismas reglas que usa la web; escribirlas otra vez aqui seria pedir
   que se separen. */
import '../../js/reglas-contenido.js';
import { LLAVE_BORRADOR, LLAVE_CONTENIDO, leerJson } from './almacen.js';

const reglas = globalThis.ReglasContenido;

export function problemasDelBorrador(borrador, categorias) {
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
```

- [ ] **Paso 4: Comprueba que pasan**

```bash
cd worker && node --test
```

- [ ] **Paso 5: Las rutas en `index.js`**

```js
import { publicar, nombreSeguro } from './publicar.js';

const CATEGORIAS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

// dentro de fetch():
    if (ruta === '/api/imagen' && peticion.method === 'POST') {
      const nombre = nombreSeguro(new URL(peticion.url).searchParams.get('nombre'));
      if (!nombre) return Response.json({ error: 'falta el nombre del archivo' }, { status: 400 });
      await entorno.ALMACEN.put(`img/${nombre}`, peticion.body, {
        httpMetadata: { contentType: peticion.headers.get('content-type') || 'image/jpeg' }
      });
      return Response.json({ url: `/img/${nombre}` });
    }

    if (ruta === '/api/publicar' && peticion.method === 'POST') {
      const resultado = await publicar(entorno, CATEGORIAS);
      /* 422 y no 400: la peticion esta bien formada, lo que no se sostiene es
         el contenido que se quiere publicar. */
      return Response.json(resultado, { status: resultado.problemas ? 422 : 200 });
    }
```

- [ ] **Paso 6: Commit**

```bash
git add worker/
git commit -m "Subir imagenes y publicar el borrador de una sola vez"
```

---

### Tarea 6: Desplegarlo y comprobarlo de verdad

Nada de esto se puede comprobar con `node --test`: hacen falta Access y R2 de
verdad. **Un rechazo de identidad que nadie ha visto rechazar no está
comprobado.**

- [ ] **Paso 1: Despliega**

```bash
cd worker && wrangler deploy
```

- [ ] **Paso 2: Comprueba lo que debe funcionar**

Desde el navegador del estudio, con sesión de Access iniciada:

| Prueba | Esperado |
|---|---|
| `GET /api/salud` | `200 {"bien":true}` |
| `GET /api/borrador` | `200` con `{version: 0, proyectos: []}` la primera vez |
| `PUT /api/borrador` con `version: 0` | `200 {"version":1}` |
| `PUT /api/borrador` otra vez con `version: 0` | **`409`** y el mensaje del conflicto |
| `POST /api/publicar?version=1` con el borrador vacío | **`422`** y `problemas` |
| `POST /api/publicar` sin `?version` | **`400`**, no 422: `?version` es obligatoria (ver Tarea 5, Interfaces) |

- [ ] **Paso 3: Comprueba lo que NO debe funcionar** — criterio de aceptación 5

Esto es lo que de verdad importa de esta tarea:

1. **Un tercer correo no entra.** Que el estudio pida a alguien ajeno a los dos
   autorizados que abra la URL del Worker. Esperado: Access no le deja pasar.
2. **Sin Access no se pasa tampoco.** `curl https://<worker>/api/borrador` sin
   cookie ni cabecera. Esperado: **403**, y en el cuerpo «la petición no trae
   identidad de Access» — que es el Worker hablando, no Access.

   Si esto devuelve `200`, el Worker está expuesto y **hay que parar**: es el
   riesgo que la especificación señala («un fallo aquí no rompe una animación:
   expone la escritura del contenido»).
3. **Un token de otra aplicación no vale.** Si el estudio tiene otra aplicación
   en Access, prueba con su cookie. Esperado: 403 por el `aud`.

- [ ] **Paso 4: Anota lo aprendido**

En `docs/despliegue.md`, la sección del Worker de la API: cómo se despliega, qué
secretos necesita y qué devuelve cada ruta. Y **las cifras reales de las capas
gratuitas** que hayas confirmado, con su fecha — la especificación pide no dar
por buenas las de agosto de 2026.

- [ ] **Paso 5: Commit**

```bash
git add docs/despliegue.md
git commit -m "Documentar el Worker de la API y lo que cobran las capas gratuitas"
```

---

## Lo que este plan deja preparado y no usa

El bloque 3b (el panel y la lista de proyectos) encuentra ya hechas:

- `GET /api/borrador` y `PUT /api/borrador` con conflicto por versión.
- `POST /api/imagen` para subir un archivo ya redimensionado.
- `POST /api/publicar`, que valida y copia.
- `window.ReglasContenido.validar(datos, categorias)`, que el panel usará para
  avisar **antes** de mandar nada.

## Quién consume lo que aquí se toca

El bloque 2 dejó tres huecos —el visor sin migrar, la carrera del preloader y el
peso de las portadas— y los tres se veían mirando a los consumidores, no a los
productores. Antes de dar por buena cada tarea de este plan, comprueba:

| Lo que cambia | Quién lo lee |
|---|---|
| `Contenido.validar` (Tarea 1) | `index.html` en el arranque, `tests/pruebas-contenido.js`, `tests/pruebas-contenido-real.js` |
| `js/reglas-contenido.js` (Tarea 1) | el navegador **y** `worker/src/publicar.js`: un cambio aquí toca los dos |
| El orden de los `<script>` (Tarea 1) | `index.html` y `tests/test.html`, los dos |
| `contenido.json` en R2 (Tarea 5) | la web pública entera, que lo pide al arrancar |
