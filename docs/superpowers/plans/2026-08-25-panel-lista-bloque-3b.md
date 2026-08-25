# El panel y la lista de proyectos — plan del bloque 3b

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** la primera pantalla del panel. La fotógrafa entra, ve sus
proyectos, los crea, los borra y los reordena —**reordenar es componer**, porque
el orden de la lista *es* la composición de la galería— y guarda sin pisar el
trabajo de la otra persona.

**Arquitectura:** una aplicación estática servida en `/panel`, detrás de
Cloudflare Access, que habla con la API del bloque 3a por `fetch`. Mismo origen,
así que sin CORS. No comparte código con la galería: son dos aplicaciones con
problemas distintos, y mezclarlas engordaría unos módulos que ya rozan su
límite.

**Tecnologías:** HTML, CSS y JavaScript servidos tal cual, sin paso de
compilación. El arnés del navegador ya existente (`tests/test.html`) prueba la
lógica pura.

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`
— léela entera, incluida **Correcciones tras implementar los bloques 1 y 2**.

**Lo que ya existe y este bloque consume** (bloque 3a, fusionado y verificado
contra Cloudflare real):

| Ruta | Qué hace |
|---|---|
| `GET /api/borrador` | devuelve `{version, proyectos}`; la primera vez, `{version: 0, proyectos: []}` |
| `PUT /api/borrador` | guarda. **200** con la versión nueva; **409** si la versión no es la guardada; **400** si el cuerpo o la versión están mal formados |
| `POST /api/publicar?version=N` | valida y publica. Lo usa el bloque 3d, no éste |
| `window.ReglasContenido.validar(datos, categorias)` | las mismas reglas que aplica el Worker antes de publicar |

## Restricciones globales

- **Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.**
  Criterio de aceptación 11.
- **`panel/js/` va en ES5 estricto y patrón `window.Nombre`**, igual que `js/`.
  Ver la decisión 1.
- **Todo lo que se hace arrastrando se puede hacer con teclado.** Criterio de
  aceptación 6: el panel es operable de principio a fin sin ratón. El arrastrar
  y soltar es un atajo, nunca el único camino.
- **El panel se parece a LUQUE! pero no se comporta como la galería:** cursor
  del sistema, anillos de foco convencionales, sin lienzo espacial y sin
  esquinas volando. Comparte la tipografía y las variables de color, nada más.
- Se respeta `prefers-reduced-motion`.
- Comentarios, textos de interfaz y mensajes de error **en castellano**.
- **Nada de credenciales en el repositorio.**

---

## Tres decisiones, razonadas

### 1. `panel/js/` en ES5 y sin módulos, como `js/`

Es tentador estrenar módulos ES aquí: el panel es una aplicación nueva, servida
por HTTP, sin la restricción del doble clic que la especificación abandonó.

Se descarta por una razón concreta: **el arnés**. `tests/test.html` carga scripts
planos y lee globales, y es donde tiene que vivir la lógica pura de este bloque
—generar identificadores, reordenar—. Con módulos haría falta o un segundo arnés
o un paso de compilación, y el proyecto no tiene ninguno de los dos. El coste de
ES5 aquí es bajo: el techo de 300 líneas ya obliga a partir en piezas pequeñas,
que es lo que los módulos aportarían.

Revisable si algún día entra un paso de compilación por otro motivo.

### 2. El panel obliga a mudar la web pública a `lidialuque.com`

No es una decisión estética: es una consecuencia forzosa, y conviene verla antes
de empezar.

El panel tiene que estar detrás de Access, y **Access sólo actúa sobre nombres de
host de zonas propias** — no sobre `workers.dev`. El panel lo sirve el Worker de
recursos estáticos, que hoy responde en `luque.angelrubioortiz2005.workers.dev`
con `workers_dev` **activo** (comprobado: `worker/estatico/wrangler.toml` no lo
menciona, y por omisión queda encendido).

Si se añade sin más una ruta `lidialuque.com/panel*`, el mismo Worker seguiría
sirviendo `luque.angelrubioortiz2005.workers.dev/panel` **sin Access delante**:
un agujero exacto en la única superficie que da permiso de escritura sobre el
contenido. La Tarea 7 lo cierra moviendo el sitio al dominio y apagando
`workers.dev`, igual que hizo el bloque 3a con la API.

**Lo que esto NO significa.** Mudar de dominio no es anunciar la web. El
`robots.txt` y la cabecera `X-Robots-Tag: noindex` del bloque 1 **siguen puestos**
y no se tocan aquí: su propio comentario dice que se quitan los dos a la vez «el
día que la web se pueda anunciar», y ese día no es éste — hoy la galería tiene
doce proyectos de relleno y tipografías `-Trial`.

### 3. Qué se queda fuera de este bloque

- **La pantalla de un proyecto** —ficha, fotos, portada— es el bloque 3c.
- **Publicar** y el resumen de cambios es el bloque 3d.
- **Subir imágenes**: aquí no se sube ninguna. Un proyecto creado en este bloque
  nace sin fotos, y por eso **no se puede publicar todavía** — `Contenido.validar`
  exige piezas y portada. Es correcto: publicar es del 3d, y para entonces el 3c
  habrá dado forma de rellenarlas.
- **Borrar imágenes de R2.** Borrar un proyecto no borra sus imágenes: quedan
  huérfanas a propósito, para que un borrado accidental sea recuperable (lo dice
  la especificación). Limpiarlas es una acción aparte que ni siquiera tiene ruta
  todavía — el bloque 3a dejó anotado que hace falta un `DELETE /api/imagen`.

---

## Estructura de archivos

| Archivo | De qué responde |
|---|---|
| `panel/js/identificador.js` | Derivar el `id` de un título y decidir si vale. Lógica pura. |
| `panel/js/orden.js` | Mover un proyecto dentro de la lista. Lógica pura. |
| `panel/js/borrador.js` | Pedir el borrador, guardarlo, y el estado de conflicto. |
| `panel/js/lista.js` | Pintar la lista y sus acciones. |
| `panel/js/panel.js` | El arranque: quién llama a quién. |
| `panel/css/panel.css` | Estilos propios; comparte tipografía y color con la web. |
| `panel/index.html` | El marcado de la pantalla. |
| `tests/pruebas-identificador.js`, `tests/pruebas-orden.js` | En el arnés de siempre. |

Las dos primeras son lógica pura y se prueban sin red ni DOM. Las tres
siguientes tocan red o pantalla, y por eso se parten así: lo comprobable, aparte.

---

### Tarea 1: El identificador de un proyecto

**Archivos:**
- Crear: `panel/js/identificador.js`, `tests/pruebas-identificador.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Identificador.desde(titulo)` → cadena, y
  `window.Identificador.problema(id, idsExistentes, categorias)` → string con el
  motivo, o `null` si vale.
- Consume: nada.

**Por qué importa.** El `id` va en la URL pública (`#/bruma`), así que **se
genera una vez y se congela**: renombrar un proyecto no puede romper un enlace
que la fotógrafa ya mandó a un cliente. Y no puede chocar con el nombre de una
categoría, porque el enrutador da prioridad a la categoría y el proyecto se
volvería inalcanzable — eso ya lo comprueba `ReglasContenido.validar`, pero el
panel tiene que avisar **antes** de dejar crear, no después de guardar.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-identificador.js`:

```js
describe('Identificador.desde', function () {
  prueba('pasa a minúsculas y une con guiones', function () {
    igual(Identificador.desde('Bruma Marina'), 'bruma-marina');
  });

  prueba('quita los acentos, porque el id va en la URL', function () {
    igual(Identificador.desde('Sesión Fotográfica'), 'sesion-fotografica');
    igual(Identificador.desde('Ñandú'), 'nandu');
  });

  prueba('descarta lo que no sea letra o número', function () {
    igual(Identificador.desde('¡Bruma! (2025) — final'), 'bruma-2025-final');
  });

  prueba('no deja guiones sueltos en los extremos ni repetidos', function () {
    igual(Identificador.desde('  --Bruma...Marina--  '), 'bruma-marina');
  });

  prueba('un título sin nada aprovechable da cadena vacía', function () {
    igual(Identificador.desde('¡¿—!?'), '');
    igual(Identificador.desde(''), '');
    igual(Identificador.desde(null), '');
  });
});

describe('Identificador.problema', function () {
  var CATS = ['foto-stills', 'editorial', 'videoclip', 'cortometraje'];

  prueba('un id nuevo y libre no da problema', function () {
    igual(Identificador.problema('bruma', ['arena'], CATS), null);
  });

  prueba('avisa si está vacío', function () {
    cierto(Identificador.problema('', [], CATS) !== null);
  });

  prueba('avisa si ya existe', function () {
    cierto(Identificador.problema('arena', ['arena'], CATS).indexOf('arena') !== -1);
  });

  /* El enrutador da prioridad a la categoría, así que un proyecto llamado
     igual que una categoría sería inalcanzable por su URL. */
  prueba('avisa si choca con una categoría', function () {
    cierto(Identificador.problema('editorial', [], CATS) !== null);
  });
});
```

Añade a `tests/test.html`, junto a los demás:

```html
<script src="../panel/js/identificador.js"></script>
```
```html
<script src="pruebas-identificador.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Pide el arnés al controlador. Esperado: `Identificador is not defined`.

- [ ] **Paso 3: Escribe `panel/js/identificador.js`**

```js
window.Identificador = (function () {
  /* El id viaja en la URL (#/bruma), así que se genera una vez y se congela:
     renombrar un proyecto no puede romper un enlace que la fotógrafa ya mandó
     a un cliente. De ahí que esto sea una función pura y sin sorpresas. */
  function desde(titulo) {
    return String(titulo || '')
      .normalize('NFD')                    // separa la letra de su tilde
      /* ATENCIÓN: el rango va escapado a propósito. Escrito con los caracteres
         combinantes literales se corrompe al copiarlo entre editores y el
         regex deja de casar en silencio — los acentos sobrevivirían al id. */
      .replace(/[\u0300-\u036f]/g, '')     // y descarta la tilde suelta
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')         // todo lo demás, separador
      .replace(/^-+|-+$/g, '');            // sin guiones colgando
  }

  function problema(id, idsExistentes, categorias) {
    if (!id) return 'El título no deja ningún identificador utilizable.';
    if (idsExistentes.indexOf(id) !== -1) {
      return 'Ya hay un proyecto con el identificador «' + id + '».';
    }
    /* El enrutador resuelve antes la categoría que el proyecto, así que uno
       llamado como una categoría no se podría abrir nunca por su URL. */
    if (categorias.indexOf(id) !== -1) {
      return '«' + id + '» es el nombre de una categoría y no puede serlo de un proyecto.';
    }
    return null;
  }

  return { desde: desde, problema: problema };
})();
```

**Sobre `normalize`:** existe desde ES6 pero es un método de tiempo de ejecución,
no sintaxis, así que no rompe la restricción de ES5. Lo soportan todos los
navegadores que este proyecto contempla.

- [ ] **Paso 4: Comprueba que pasa**

Arnés otra vez: las nueve nuevas en verde y las anteriores intactas.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/identificador.js tests/
git commit -m "Derivar el identificador de un proyecto y decidir si vale"
```

---

### Tarea 2: Reordenar la lista

**Archivos:**
- Crear: `panel/js/orden.js`, `tests/pruebas-orden.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Orden.mover(lista, desde, hasta)` → **lista nueva**, sin
  modificar la que recibe.
- Consume: nada.

**Por qué es lógica pura y no un detalle de la interfaz.** Reordenar **es
componer**: el orden de la lista es lo que `js/composicion.js` convierte en la
posición de cada proyecto en el lienzo. Que sea una función pura permite
probarla entera sin arrastrar nada con el ratón, que es justo lo que no se puede
automatizar aquí.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-orden.js`:

```js
describe('Orden.mover', function () {
  function lista() { return ['a', 'b', 'c', 'd']; }

  prueba('mueve hacia abajo', function () {
    igual(Orden.mover(lista(), 0, 2), ['b', 'c', 'a', 'd']);
  });

  prueba('mueve hacia arriba', function () {
    igual(Orden.mover(lista(), 3, 1), ['a', 'd', 'b', 'c']);
  });

  prueba('mover a la misma posición no cambia nada', function () {
    igual(Orden.mover(lista(), 2, 2), ['a', 'b', 'c', 'd']);
  });

  /* La lista que se recibe no se toca: quien la pasó puede seguir usándola
     para comparar contra lo guardado y saber si hay cambios sin guardar. */
  prueba('no modifica la lista que recibe', function () {
    var original = lista();
    Orden.mover(original, 0, 3);
    igual(original, ['a', 'b', 'c', 'd']);
  });

  prueba('recorta los índices fuera de rango en vez de romperse', function () {
    igual(Orden.mover(lista(), 0, 99), ['b', 'c', 'd', 'a']);
    igual(Orden.mover(lista(), -5, 1), ['b', 'a', 'c', 'd']);
  });

  prueba('una lista de uno o de ninguno no se rompe', function () {
    igual(Orden.mover(['solo'], 0, 1), ['solo']);
    igual(Orden.mover([], 0, 1), []);
  });
});
```

Añade sus dos `<script>` a `tests/test.html`, como en la Tarea 1.

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Orden is not defined`.

- [ ] **Paso 3: Escribe `panel/js/orden.js`**

```js
window.Orden = (function () {
  function recortar(i, tope) {
    return Math.max(0, Math.min(i, tope));
  }

  /* Devuelve una lista nueva y no toca la que recibe: el panel compara la lista
     de trabajo contra la última guardada para saber si hay cambios pendientes,
     y eso deja de funcionar en cuanto alguien modifica la original. */
  function mover(lista, desde, hasta) {
    var copia = lista.slice();
    if (copia.length < 2) return copia;
    var origen = recortar(desde, copia.length - 1);
    var destino = recortar(hasta, copia.length - 1);
    if (origen === destino) return copia;
    var sacado = copia.splice(origen, 1)[0];
    copia.splice(destino, 0, sacado);
    return copia;
  }

  return { mover: mover };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

- [ ] **Paso 5: Commit**

```bash
git add panel/js/orden.js tests/
git commit -m "Mover un proyecto dentro de la lista sin tocar la original"
```

---

### Tarea 3: El borrador: pedirlo, guardarlo, y el conflicto

**Archivos:**
- Crear: `panel/js/borrador.js`

**Interfaces:**
- Produce:
  - `window.Borrador.cargar(alTerminar)` → `alTerminar(datos, error)`; `datos`
    es `{version, proyectos}` o `null`.
  - `window.Borrador.guardar(datos, alTerminar)` → `alTerminar(resultado, error)`.
    `resultado` es `{version}` en el caso bueno, o `{conflicto: true, guardada: N}`
    si el servidor ya iba por otra versión.
- Consume: `GET` y `PUT /api/borrador` del bloque 3a.

**Los tres finales que hay que distinguir**, porque el servidor ya los distingue
y sería un desperdicio juntarlos en pantalla:

| Del servidor | Qué pasó | Qué debe leer quien publica |
|---|---|---|
| **409** | la otra persona guardó mientras tanto | «Alguien ha guardado mientras editabas» + ofrecer recargar |
| **400** | el cuerpo o la versión iban mal formados | es un fallo del panel, no del usuario: avisar y registrar |
| red caída | ni siquiera se llegó | «No se ha podido guardar» y **no** perder lo escrito |

- [ ] **Paso 1: Escribe `panel/js/borrador.js`**

```js
window.Borrador = (function () {
  var RUTA = '/api/borrador';

  /* Nunca lanza: quien llama recibe siempre un error en castellano que se pueda
     enseñar. Un panel que se queda mudo delante de un fallo es peor que uno que
     dice "no se ha podido": la fotógrafa necesita saber si su trabajo está a
     salvo o no. */
  function cargar(alTerminar) {
    fetch(RUTA, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('el servidor respondió ' + r.status);
        return r.json();
      })
      .then(function (datos) { alTerminar(datos, null); })
      .catch(function (e) {
        alTerminar(null, 'No se ha podido cargar el contenido: ' + e.message);
      });
  }

  function guardar(datos, alTerminar) {
    fetch(RUTA, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(function (r) {
        return r.json().then(function (cuerpo) { return { estado: r.status, cuerpo: cuerpo }; });
      })
      .then(function (res) {
        if (res.estado === 200) return alTerminar({ version: res.cuerpo.version }, null);
        /* 409 no es un error del que guarda: es que el otro llegó antes. Se
           distingue del 400 porque tiene salida —recargar y repetir— mientras
           que un 400 significa que el panel mandó algo mal formado. */
        if (res.estado === 409) {
          return alTerminar({ conflicto: true, guardada: res.cuerpo.guardada }, null);
        }
        alTerminar(null, res.cuerpo.error || 'No se ha podido guardar.');
      })
      .catch(function (e) {
        alTerminar(null, 'No se ha podido guardar: ' + e.message);
      });
  }

  return { cargar: cargar, guardar: guardar, RUTA: RUTA };
})();
```

- [ ] **Paso 2: Comprueba**

```bash
wc -l panel/js/borrador.js
python tests/auditar_rutas.py
```

Pide al controlador que compruebe en el navegador, con sesión de Access
iniciada, que `Borrador.cargar` trae el borrador y que `Borrador.guardar`
devuelve conflicto al mandar una versión vieja. **Es la primera vez que el panel
habla con la API de verdad: si eso no funciona, las tareas siguientes construyen
sobre arena.**

- [ ] **Paso 3: Commit**

```bash
git add panel/js/borrador.js
git commit -m "Pedir y guardar el borrador distinguiendo el conflicto del fallo"
```

---

### Tarea 4: La pantalla y la lista

**Archivos:**
- Crear: `panel/index.html`, `panel/css/panel.css`, `panel/js/lista.js`,
  `panel/js/panel.js`

**Interfaces:**
- Consume: `Borrador`, `Identificador`, `Orden`.
- Produce: la pantalla.

**Estética.** Comparte con la web la tipografía ABC Favorit y las variables de
color —amarillo y negro—, **y nada más**. Cursor del sistema, anillos de foco
convencionales, sin lienzo espacial. Se parece a LUQUE!, se comporta como una
herramienta.

- [ ] **Paso 1: `panel/index.html`**

Marcado mínimo, con etiquetas reales y una región que anuncie los cambios:

```html
<main class="panel">
  <h1>Proyectos</h1>

  <p id="aviso" role="status" aria-live="polite" class="aviso"></p>

  <ol id="lista" class="lista"></ol>

  <form id="nuevo" class="nuevo">
    <label for="titulo">Título del proyecto nuevo</label>
    <input id="titulo" name="titulo" type="text" autocomplete="off" required>
    <label for="categoria">Categoría</label>
    <select id="categoria" name="categoria"></select>
    <button type="submit">Crear</button>
  </form>

  <button id="guardar" type="button">Guardar</button>
</main>
```

`role="status"` con `aria-live="polite"` es lo que hace que un lector de
pantalla anuncie «guardado» o el conflicto sin robar el foco.

Y los `<script>`, **en este orden**, porque `panel.js` lee
`window.ReglasContenido.CATEGORIAS` al arrancar y los demás módulos tienen que
existir antes:

```html
<script src="../js/reglas-contenido.js"></script>
<script src="js/identificador.js"></script>
<script src="js/orden.js"></script>
<script src="js/borrador.js"></script>
<script src="js/lista.js"></script>
<script src="js/panel.js"></script>
```

`reglas-contenido.js` se carga desde `js/` de la web, no se copia: es el mismo
archivo que usan la galería y el Worker, y tener la lista de categorías en un
solo sitio fue justamente lo que cerró el bloque 3a. **Cópialo aquí y habrás
reabierto ese agujero.**

- [ ] **Paso 2: `panel/js/lista.js`** — pintar y las acciones

Cada fila lleva **su equivalente de teclado**, que es criterio de aceptación:

```js
window.Lista = (function () {
  var ETIQUETAS = { 'foto-stills': 'Foto Stills', editorial: 'Editorial',
                    videoclip: 'Videoclip', cortometraje: 'Cortometraje' };

  /* Cada proyecto trae sus dos botones de mover. El arrastrar y soltar llega en
     la Tarea 5 como atajo, pero esto es el camino principal: sin ratón se tiene
     que poder hacer todo, y con lector de pantalla también. */
  function fila(p, indice, total, alMover, alBorrar) {
    var li = document.createElement('li');
    li.className = 'fila';
    li.dataset.id = p.id;

    var nombre = document.createElement('span');
    nombre.className = 'fila-titulo';
    nombre.textContent = p.titulo + ' · ' + (ETIQUETAS[p.categoria] || p.categoria);

    var subir = document.createElement('button');
    subir.type = 'button';
    subir.textContent = '↑';
    subir.setAttribute('aria-label', 'Subir ' + p.titulo);
    subir.disabled = indice === 0;
    subir.addEventListener('click', function () { alMover(indice, indice - 1); });

    var bajar = document.createElement('button');
    bajar.type = 'button';
    bajar.textContent = '↓';
    bajar.setAttribute('aria-label', 'Bajar ' + p.titulo);
    bajar.disabled = indice === total - 1;
    bajar.addEventListener('click', function () { alMover(indice, indice + 1); });

    var borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.textContent = 'Borrar';
    borrar.setAttribute('aria-label', 'Borrar ' + p.titulo);
    borrar.addEventListener('click', function () { alBorrar(p.id, p.titulo); });

    li.appendChild(nombre);
    li.appendChild(subir);
    li.appendChild(bajar);
    li.appendChild(borrar);
    return li;
  }

  function pintar(contenedor, proyectos, alMover, alBorrar) {
    contenedor.innerHTML = '';
    proyectos.forEach(function (p, i) {
      contenedor.appendChild(fila(p, i, proyectos.length, alMover, alBorrar));
    });
  }

  return { pintar: pintar, ETIQUETAS: ETIQUETAS };
})();
```

- [ ] **Paso 3: `panel/js/panel.js`** — el arranque y el estado

Aquí vive la lista de trabajo, el aviso, y las tres acciones. **Borrar pide
confirmación**: es destructivo y no hay deshacer hasta que se recargue.

```js
(function () {
  var trabajo = null;      // { version, proyectos }
  var elLista, elAviso;

  function avisar(texto) { elAviso.textContent = texto; }

  function repintar() {
    window.Lista.pintar(elLista, trabajo.proyectos, function (desde, hasta) {
      trabajo.proyectos = window.Orden.mover(trabajo.proyectos, desde, hasta);
      repintar();
      avisar('Orden cambiado. Recuerda guardar.');
    }, function (id, titulo) {
      if (!window.confirm('¿Borrar «' + titulo + '»? No se puede deshacer sin recargar.')) return;
      trabajo.proyectos = trabajo.proyectos.filter(function (p) { return p.id !== id; });
      repintar();
      avisar('Proyecto borrado. Recuerda guardar.');
    });
  }

  function crear(titulo, categoria) {
    var id = window.Identificador.desde(titulo);
    var ids = trabajo.proyectos.map(function (p) { return p.id; });
    var problema = window.Identificador.problema(id, ids, window.ReglasContenido.CATEGORIAS);
    if (problema) return avisar(problema);

    /* Nace sin piezas ni portada a propósito: las pone el bloque 3c. Hasta
       entonces el borrador no se podrá publicar, y eso es correcto —publicar
       valida, y un proyecto sin fotos no es publicable—. */
    trabajo.proyectos.push({ id: id, titulo: titulo, categoria: categoria,
                             tipo: 'fotos', ficha: {}, piezas: [] });
    repintar();
    avisar('Proyecto «' + titulo + '» creado. Recuerda guardar.');
  }

  function guardar() {
    window.Borrador.guardar(trabajo, function (resultado, error) {
      if (error) return avisar(error);
      if (resultado.conflicto) {
        return avisar('Alguien ha guardado mientras editabas (el servidor va por la versión '
                      + resultado.guardada + '). Recarga la página para no perder su trabajo.');
      }
      trabajo.version = resultado.version;
      avisar('Guardado.');
    });
  }

  function init() {
    elLista = document.getElementById('lista');
    elAviso = document.getElementById('aviso');

    var select = document.getElementById('categoria');
    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      select.appendChild(o);
    });

    document.getElementById('nuevo').addEventListener('submit', function (e) {
      e.preventDefault();
      crear(document.getElementById('titulo').value.trim(), select.value);
      document.getElementById('titulo').value = '';
    });

    document.getElementById('guardar').addEventListener('click', guardar);

    window.Borrador.cargar(function (datos, error) {
      if (error) return avisar(error);
      trabajo = datos;
      repintar();
    });
  }

  init();
})();
```

- [ ] **Paso 4: `panel/css/panel.css`**

Comparte las variables de color y la tipografía con `css/luque.css` —cópialas,
no importes la hoja entera: la galería trae reglas de lienzo espacial que aquí
estorban—. Y respeta `prefers-reduced-motion` en cualquier transición.

- [ ] **Paso 5: Comprueba**

```bash
wc -l panel/js/*.js
python tests/auditar_rutas.py
```

Pide al controlador, con sesión de Access: crear un proyecto, reordenarlo con
los botones, borrarlo, guardar, y **recargar para confirmar que lo guardado
persiste**. Y que todo eso se puede hacer **sólo con el teclado**.

- [ ] **Paso 6: Commit**

```bash
git add panel/
git commit -m "Pintar la lista de proyectos y sus acciones de crear, mover y borrar"
```

---

### Tarea 5: Arrastrar y soltar, como atajo

**Archivos:**
- Modificar: `panel/js/lista.js`, `panel/css/panel.css`

**Interfaces:** ninguna nueva. Reutiliza `Orden.mover`.

**Lo que no puede pasar:** que arrastrar sea el único camino. Los botones de la
Tarea 4 se quedan, no se sustituyen. Esto es un atajo para quien use ratón.

- [ ] **Paso 1: Hazlo con la API nativa**

`draggable="true"` en cada fila y los eventos `dragstart`, `dragover`, `drop`.
Sin biblioteca: el proyecto no tiene dependencias y no va a estrenar una para
esto.

Al soltar, calcula el índice de destino y llama al **mismo** `alMover(desde,
hasta)` que ya usan los botones. Toda la lógica ya está probada en la Tarea 2.

- [ ] **Paso 2: Que se vea dónde va a caer**

Una marca de inserción en CSS. Con `prefers-reduced-motion` no se anima; sólo
aparece.

- [ ] **Paso 3: Comprueba**

Pide al controlador: arrastrar una fila y confirmar que el orden queda igual que
si se hubiera hecho con los botones. Y que **los botones siguen funcionando**.

- [ ] **Paso 4: Commit**

```bash
git add panel/
git commit -m "Arrastrar para reordenar, sin quitar el camino de teclado"
```

---

### Tarea 6: Que la galería se componga en el orden guardado

**Archivos:**
- Modificar: `tests/pruebas-orden.js` (una prueba más)

**Por qué esta tarea existe.** El criterio de aceptación 4 dice: «Reordenar la
lista en el panel recompone la galería, y ningún par de proyectos se solapa con
ningún número de proyectos». La segunda mitad ya la garantiza
`js/composicion.js` desde el bloque 2. La primera **no la comprueba nadie**: es
una promesa de dos piezas que nunca se han mirado juntas, y este proyecto ya se
llevó tres sustos por exactamente eso.

- [ ] **Paso 1: La prueba que lo ata**

```js
describe('Reordenar es componer', function () {
  /* El orden de la lista ES la composición: js/composicion.js reparte las
     ranuras por índice. Si alguien cambiara Orden.mover, la galería se
     recompondría sin que ninguna prueba de las dos piezas por separado se
     enterara — cada una seguiría siendo correcta por su cuenta. */
  function ranuraDe(lista, id) {
    var ranuras = window.Composicion.disponer(lista.length, 'amplio');
    return ranuras[lista.indexOf(id)];
  }

  prueba('mover un proyecto le cambia la ranura, y le da la del que ocupaba su sitio', function () {
    var antes = ['a', 'b', 'c', 'd'];
    var despues = window.Orden.mover(antes, 0, 3);
    igual(despues, ['b', 'c', 'd', 'a']);

    /* 'a' tenía la primera ranura y pasa a tener la cuarta: la misma que antes
       ocupaba 'd'. Son ranuras distintas —si no, mover no significaría nada—. */
    igual(ranuraDe(despues, 'a'), ranuraDe(antes, 'd'));
    cierto(ranuraDe(antes, 'a').x !== ranuraDe(despues, 'a').x ||
           ranuraDe(antes, 'a').y !== ranuraDe(despues, 'a').y,
           'si la ranura no cambia, reordenar no recompone nada');
  });

  prueba('lo que no se mueve conserva su ranura', function () {
    var antes = ['a', 'b', 'c', 'd'];
    var despues = window.Orden.mover(antes, 2, 3);   // sólo se cruzan c y d
    igual(ranuraDe(despues, 'a'), ranuraDe(antes, 'a'));
    igual(ranuraDe(despues, 'b'), ranuraDe(antes, 'b'));
  });
});
```

**Verifica que esta prueba no es vacua**, porque es la única que ata las dos
piezas: cambia `Orden.mover` para que devuelva la lista sin tocar y comprueba
que se pone en rojo. Si sigue en verde, no está comprobando lo que dice.

- [ ] **Paso 2: Comprueba y commitea**

```bash
git add tests/pruebas-orden.js
git commit -m "Atar que reordenar en el panel recompone la galeria"
```

---

### Tarea 7: Servirlo y ponerlo detrás de Access

**Archivos:**
- Modificar: `worker/estatico/wrangler.toml`, `_redirects`, `docs/despliegue.md`

**Esto cierra el agujero de la decisión 2.** Hasta aquí el panel es código sin
servir; esta tarea lo publica, y lo publica **protegido**.

- [ ] **Paso 1: El sitio se muda al dominio y apaga `workers.dev`**

En `worker/estatico/wrangler.toml`, con el mismo cuidado de orden que enseñó el
bloque 3a —en TOML, lo que va tras `[[routes]]` pertenece a esa tabla, así que
los ajustes globales van **antes**—:

```toml
workers_dev = false
preview_urls = false

[[routes]]
pattern = "lidialuque.com/*"
zone_name = "lidialuque.com"
```

**Sin `workers_dev = false` esta tarea no sirve de nada**: el panel seguiría
alcanzable en `luque.angelrubioortiz2005.workers.dev/panel`, donde Access no
llega.

- [ ] **Paso 2: Comprueba antes de desplegar**

```bash
python tests/auditar_rutas.py
git archive HEAD | tar -t | grep '^panel/' | head
```

- [ ] **Paso 3: Despliega (lo hace el controlador)**

```
git archive main | tar -x -C <directorio-temporal>
wrangler deploy --config worker/estatico/wrangler.toml --assets <directorio-temporal>
```

- [ ] **Paso 4: El estudio añade Access sobre `/panel`**

En Zero Trust → Access → Applications → *Add an application* → Self-hosted:

| Campo | Valor |
|---|---|
| Domain | `lidialuque.com` |
| Path | `panel` |
| Policy | Allow → Emails → **los dos correos** |

**El AUD de esta aplicación es distinto del de la API.** Da igual: el panel no
verifica tokens, sólo necesita que Access lo tape. Los secretos del Worker de la
API **no se tocan**.

- [ ] **Paso 5: Comprueba lo que NO debe funcionar**

Esto es lo que de verdad importa de la tarea:

| Prueba | Esperado |
|---|---|
| `https://luque.angelrubioortiz2005.workers.dev/panel` | **no responde**: `workers.dev` apagado |
| `lidialuque.com/panel` sin sesión | redirige a Access |
| `lidialuque.com/panel` con un tercer correo | **no pasa de Access** |
| `lidialuque.com/` | la web pública, como siempre |
| `lidialuque.com/robots.txt` | sigue con `Disallow: /` |
| Cabecera `X-Robots-Tag` en la portada | sigue diciendo `noindex` |

Las dos últimas filas no son adorno: **mudar de dominio no es anunciar la web**,
y el cierre a buscadores tiene que sobrevivir a la mudanza.

- [ ] **Paso 6: Documenta y commitea**

En `docs/despliegue.md`: que el sitio vive ahora en `lidialuque.com`, que
`workers.dev` está apagado **y por qué**, y que hay una segunda aplicación de
Access sobre `/panel`.

```bash
git add worker/estatico/wrangler.toml _redirects docs/despliegue.md
git commit -m "Servir el panel en el dominio propio y detras de Access"
```

---

## Quién consume lo que aquí se toca

Los bloques anteriores dejaron tres huecos y los tres se veían mirando a los
consumidores, no a los productores. Antes de dar por buena cada tarea:

| Lo que cambia | Quién lo lee |
|---|---|
| `tests/test.html` (Tareas 1, 2) | el arnés entero; el orden de los `<script>` importa |
| `Orden.mover` (Tarea 2) | `panel/js/panel.js` **y** la composición de la galería, vía el orden de la lista |
| `PUT /api/borrador` (Tarea 3) | el Worker del bloque 3a: sus tres respuestas ya están fijadas por sus pruebas |
| `worker/estatico/wrangler.toml` (Tarea 7) | **la web pública entera**: un error aquí la deja sin servir |
| `workers_dev` (Tarea 7) | cualquier enlace a `workers.dev` que el estudio haya compartido dejará de funcionar |

## Lo que este bloque deja preparado y no usa

- `Identificador.desde` y `.problema`, que el bloque 3c necesita al renombrar.
- `Orden.mover`, que el 3c reutiliza para ordenar las fotos dentro de un proyecto.
- El patrón de `Borrador.guardar` con sus tres finales, que el 3d repite para
  publicar.
