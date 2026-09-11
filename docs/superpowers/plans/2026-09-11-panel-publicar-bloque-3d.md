# Publicar — plan del bloque 3d

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos.

**Objetivo:** la tercera pantalla del panel y el final del bloque 3. La
fotógrafa ve **qué cambia** respecto a lo que hoy enseña la web, ve **qué le
falta** al borrador para poder publicarse, y pulsa «Publicar». La web pública
cambia en ese momento y no antes (criterios de aceptación 2 y 3).

**Arquitectura:** la misma aplicación de `/panel`, sobre el enrutado y el
estado que dejó el bloque 3c. Lo publicado se lee de `/contenido.json` —la
misma ruta pública que pide la web—, la comparación con el borrador es una
función pura, y publicar es un `POST /api/publicar?version=N` (bloque 3a) con
los mismos cuatro finales que guardar. **Se publica lo guardado**, así que la
pantalla no deja publicar con cambios sin guardar.

**Tecnologías:** las del bloque 3c. ES5 y `window.Nombre` en `panel/js/`;
arnés de `tests/test.html`, con `ArnesDom.conDocumento` para lo que habla con
la red (doblando `fetch` en el iframe, como hizo `tests/pruebas-subida.js`).

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`,
secciones «El panel» (pantalla 3), «Errores y casos límite» (publicar es
atómico; un borrador inválido no se puede publicar) y «Pruebas» (el cálculo
de qué ha cambiado entre borrador y publicado).

**Requisito previo:** el plan del bloque 3c
(`docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md`) ejecutado
entero. Este plan usa `Rutas`, `Pantallas`, `Panel.ir`, `Panel.hayCambios`,
la `<section id="pantalla-publicar">` vacía y la estructura de
`tests/pruebas-panel.js` que dejó.

**Lo que ya existe y este bloque consume:**

| Pieza | Qué hace |
|---|---|
| `POST /api/publicar?version=N` | **200** `{version}` si publicó; **422** `{problemas: [...]}` si el borrador guardado no vale; **409** `{error, guardada}` si el servidor va por otra versión; **400** sin `?version`. Publica **el borrador guardado en R2**, no lo que mande el navegador. |
| `GET /contenido.json` | lo que ve un visitante: el de R2 si alguna vez se publicó; si no, el archivo versionado en el repositorio (Worker estático, bloque 3a). Ruta pública, sin Access. |
| `window.ReglasContenido.validar(datos, categorias)` | las mismas reglas que aplicará el Worker: avisar **antes** de mandar nada. |
| `window.Panel.hayCambios()` | si el trabajo difiere de lo último cargado o guardado. |
| `window.Pantallas`, `window.Rutas`, `window.Panel.ir` | del bloque 3c. |

## Restricciones globales

- **Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.**
  `panel/js/panel.js` sale del 3c cerca del techo: aquí sólo gana **seis
  líneas** (Tarea 4); todo lo demás va en módulos nuevos.
- **`panel/js/` en ES5 estricto y `window.Nombre`.**
- **Publicar es atómico y lo garantiza el Worker**, no el panel: aquí no se
  inventa ninguna comprobación que sustituya a la suya, sólo se adelanta la
  misma para avisar antes.
- **Publicar es una acción hacia fuera**: cambia la web pública. Pide
  confirmación siempre.
- Operable sin ratón; `prefers-reduced-motion`; textos en castellano; nada de
  credenciales en el repositorio.
- **Node** está en `C:\nvm4w\nodejs` (nvm para Windows, v24.21.0); si la
  terminal no lo ve, antepón esa carpeta al PATH de la sesión. Este plan no
  toca `worker/`, pero `cd worker && node --test` se corre igualmente al
  final de la Tarea 5 como comprobación de que nada del Worker se movió.

---

## Tres decisiones, razonadas

### 1. Se compara contra `/contenido.json`, no contra una copia guardada

Podría guardarse en R2 «la última versión publicada» y compararla con el
borrador. Pero lo que importa a quien publica es **qué va a cambiar para quien
mira la web**, y eso es exactamente lo que devuelve `/contenido.json` por su
ruta pública, con su caída al archivo del repositorio incluida. No hace falta
un segundo almacén ni una ruta nueva en el Worker.

Consecuencia: si `/contenido.json` no se puede leer (red caída), la pantalla
lo dice y **no** finge que todo es nuevo. Publicar sigue siendo posible, porque
publicar no depende de la comparación.

### 2. Con cambios sin guardar no se publica

`POST /api/publicar` publica el borrador **de R2**. Si el panel tiene cambios
sin guardar, lo que se publicaría no es lo que la fotógrafa está viendo. La
pantalla lo trata como el primer problema de la lista —«guarda antes de
publicar»— y deshabilita el botón hasta que se guarde. Es más claro que
guardar por ella sin que lo pida.

### 3. El conflicto deshabilita «Publicar», como deshabilita «Guardar»

Un 409 al publicar significa que la otra persona guardó después de que este
panel cargara. Publicar otra vez con la versión del servidor sería publicar
algo que esta persona no ha visto. Igual que en `guardar()` del bloque 3b: se
deshabilita y se pide recargar.

---

## Estructura de archivos

| Archivo | De qué responde |
|---|---|
| `panel/js/cambios.js` | Qué separa lo publicado del borrador, y cómo decirlo. **Puro.** |
| `panel/js/publicacion.js` | Leer lo publicado y publicar, con sus finales. Red. |
| `panel/js/pantalla-publicar.js` | La pantalla: listas de cambios y problemas, el botón. |
| `panel/js/panel.js` | Seis líneas: enrutar `#/publicar` y enganchar el contexto. |
| `panel/index.html`, `panel/css/panel.css` | El marcado de la sección y dos reglas. |
| `tests/pruebas-cambios.js`, `tests/pruebas-publicacion.js` | Nuevas. |
| `tests/pruebas-panel.js`, `tests/test.html` | Se amplían. |
| `docs/estado-conocido.md`, `docs/despliegue.md` | Lo que este bloque cierra. |

---

### Tarea 1: Qué ha cambiado entre lo publicado y el borrador

**Archivos:**
- Crear: `panel/js/cambios.js`, `tests/pruebas-cambios.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce:
  - `window.Cambios.calcular(publicados, borrador)` con dos listas de
    proyectos → `{nuevos: [{id, titulo}], borrados: [{id, titulo}],
    modificados: [{id, titulo, que: ['la ficha', …]}], reordenados: bool}`.
  - `window.Cambios.hayAlguno(cambios)` → booleano.
  - `window.Cambios.resumir(cambios)` → array de frases para la pantalla.
- Consume: nada.

**Por qué por id.** Es lo único de un proyecto que no cambia (se congela al
crearlo). Renombrar un proyecto tiene que salir como «cambia el título», no
como «uno borrado y uno nuevo».

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-cambios.js`:

```js
describe('Cambios.calcular', function () {
  function p(id, extra) {
    var base = { id: id, titulo: id.charAt(0).toUpperCase() + id.slice(1), categoria: 'editorial',
                 tipo: 'fotos', ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/' + id + '-1500.jpg',
                 piezas: [{ url: '/img/' + id + '-3000.jpg', miniatura: '/img/' + id + '-250.jpg' }] };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  prueba('sin diferencias, nada', function () {
    var c = Cambios.calcular([p('a'), p('b')], [p('a'), p('b')]);
    igual(c, { nuevos: [], borrados: [], modificados: [], reordenados: false });
    cierto(!Cambios.hayAlguno(c));
  });

  prueba('un proyecto que no estaba es nuevo', function () {
    igual(Cambios.calcular([p('a')], [p('a'), p('b')]).nuevos, [{ id: 'b', titulo: 'B' }]);
  });

  prueba('un proyecto que ya no está se retira', function () {
    igual(Cambios.calcular([p('a'), p('b')], [p('a')]).borrados, [{ id: 'b', titulo: 'B' }]);
  });

  /* Renombrar no es borrar y crear: el id es lo que ata las dos versiones. */
  prueba('cambiar el título es una modificación, no un borrado y un alta', function () {
    var c = Cambios.calcular([p('a')], [p('a', { titulo: 'Arena' })]);
    igual(c.nuevos, []);
    igual(c.borrados, []);
    igual(c.modificados, [{ id: 'a', titulo: 'Arena', que: ['el título'] }]);
  });

  prueba('dice qué partes cambian, en un orden fijo', function () {
    var c = Cambios.calcular([p('a')], [p('a', { categoria: 'videoclip', ficha: { anio: 2026, papel: 'DoP' },
      portada: '/img/otra-1500.jpg', piezas: [] })]);
    igual(c.modificados[0].que, ['la categoría', 'la ficha', 'la portada', 'las fotos']);
  });

  prueba('reordenar las fotos de un proyecto cuenta como cambiar las fotos', function () {
    var dos = [{ url: '/img/1.jpg' }, { url: '/img/2.jpg' }];
    var c = Cambios.calcular([p('a', { piezas: dos })], [p('a', { piezas: dos.slice().reverse() })]);
    igual(c.modificados[0].que, ['las fotos']);
  });

  /* Reordenar ES componer (bloque 3b): merece decirse aunque ningún
     proyecto haya cambiado por dentro. */
  prueba('cambiar el orden de la lista se dice aparte', function () {
    var c = Cambios.calcular([p('a'), p('b'), p('c')], [p('c'), p('a'), p('b')]);
    igual(c.modificados, []);
    igual(c.reordenados, true);
    cierto(Cambios.hayAlguno(c));
  });

  prueba('un alta o una baja no cuentan como reordenar si los demás siguen igual', function () {
    igual(Cambios.calcular([p('a'), p('b')], [p('a'), p('x'), p('b')]).reordenados, false);
    igual(Cambios.calcular([p('a'), p('b'), p('c')], [p('a'), p('c')]).reordenados, false);
  });

  prueba('nada publicado: todo es nuevo', function () {
    var c = Cambios.calcular([], [p('a'), p('b')]);
    igual(c.nuevos.map(function (x) { return x.id; }), ['a', 'b']);
    igual(c.reordenados, false);
  });

  prueba('no se rompe con huecos ni con listas ausentes', function () {
    igual(Cambios.calcular(null, [null, p('a')]).nuevos, [{ id: 'a', titulo: 'A' }]);
    igual(Cambios.calcular([p('a'), undefined], undefined).borrados, [{ id: 'a', titulo: 'A' }]);
  });
});

describe('Cambios.resumir', function () {
  prueba('una frase por cambio, en castellano', function () {
    igual(Cambios.resumir({
      nuevos: [{ id: 'a', titulo: 'Arena' }],
      borrados: [{ id: 'b', titulo: 'Bruma' }],
      modificados: [{ id: 'c', titulo: 'Cal', que: ['la ficha', 'las fotos'] }],
      reordenados: true
    }), ['Nuevo: Arena', 'Se retira: Bruma', 'Cambia Cal: la ficha, las fotos', 'El orden de la galería cambia']);
  });

  prueba('sin cambios, lista vacía', function () {
    igual(Cambios.resumir({ nuevos: [], borrados: [], modificados: [], reordenados: false }), []);
  });
});
```

En `tests/test.html`, tras `<script src="../panel/js/fotos.js">`:

```html
<script src="../panel/js/cambios.js"></script>
```

y tras `pruebas-fotos.js`:

```html
<script src="pruebas-cambios.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Sirve la raíz (`python -m http.server 8000`), abre
`http://localhost:8000/tests/test.html`. Esperado: `Cambios is not defined`.

- [ ] **Paso 3: Escribe `panel/js/cambios.js`**

```js
window.Cambios = (function () {
  /* Qué partes de un proyecto se comparan, y cómo se nombran en pantalla. El
     orden es el de la frase. `tipo` no está porque hoy todo es 'fotos'; el
     día que cambie entra aquí. */
  var CAMPOS = [['titulo', 'el título'], ['categoria', 'la categoría'], ['ficha', 'la ficha'],
                ['portada', 'la portada'], ['piezas', 'las fotos']];

  function porId(lista) {
    var mapa = {};
    (lista || []).forEach(function (p) { if (p && p.id) mapa[p.id] = p; });
    return mapa;
  }

  /* Datos llanos: comparar su JSON es exacto, y reordenar las fotos de un
     proyecto cambia el JSON de `piezas`, que es lo que se quiere. */
  function iguales(a, b) {
    return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
  }

  function idsComunes(lista, otros) {
    return (lista || []).filter(function (p) { return p && p.id && otros[p.id]; })
      .map(function (p) { return p.id; });
  }

  /* Qué separa lo publicado del borrador. Se compara por id, que es lo único
     que no cambia —renombrar tiene que salir como «cambia el título», no
     como una baja y un alta—, y el orden se mira aparte porque reordenar ES
     componer y merece decirse aunque nada haya cambiado por dentro. */
  function calcular(publicados, borrador) {
    var antes = porId(publicados), despues = porId(borrador);
    var r = { nuevos: [], borrados: [], modificados: [], reordenados: false };

    (borrador || []).forEach(function (p) {
      if (!p || !p.id) return;
      var viejo = antes[p.id];
      if (!viejo) return r.nuevos.push({ id: p.id, titulo: p.titulo });
      var que = CAMPOS.filter(function (c) { return !iguales(viejo[c[0]], p[c[0]]); })
        .map(function (c) { return c[1]; });
      if (que.length) r.modificados.push({ id: p.id, titulo: p.titulo, que: que });
    });

    (publicados || []).forEach(function (p) {
      if (p && p.id && !despues[p.id]) r.borrados.push({ id: p.id, titulo: p.titulo });
    });

    /* Sólo los que están en las dos listas: un alta o una baja no reordenan
       a los demás. */
    r.reordenados = idsComunes(publicados, despues).join('\n') !== idsComunes(borrador, antes).join('\n');
    return r;
  }

  function hayAlguno(c) {
    return c.nuevos.length + c.borrados.length + c.modificados.length > 0 || c.reordenados;
  }

  function resumir(c) {
    var frases = [];
    c.nuevos.forEach(function (p) { frases.push('Nuevo: ' + p.titulo); });
    c.borrados.forEach(function (p) { frases.push('Se retira: ' + p.titulo); });
    c.modificados.forEach(function (p) { frases.push('Cambia ' + p.titulo + ': ' + p.que.join(', ')); });
    if (c.reordenados) frases.push('El orden de la galería cambia');
    return frases;
  }

  return { calcular: calcular, hayAlguno: hayAlguno, resumir: resumir };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Las doce en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/cambios.js tests/pruebas-cambios.js tests/test.html
git commit -m "Calcular que separa lo publicado del borrador, y decirlo en castellano"
```

---

### Tarea 2: Leer lo publicado y publicar

**Archivos:**
- Crear: `panel/js/publicacion.js`, `tests/pruebas-publicacion.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce:
  - `window.Publicacion.publicado(alTerminar)` → `alTerminar(proyectos, null)`
    con la lista publicada (vacía si el servidor da 404), o
    `alTerminar(null, texto)`.
  - `window.Publicacion.publicar(version, alTerminar)` →
    `alTerminar({version}, null)` | `alTerminar({problemas: [...]}, null)` |
    `alTerminar({conflicto: true, guardada: N}, null)` | `alTerminar(null,
    texto)`.
- Consume: `GET /contenido.json`, `POST /api/publicar`.

Los mismos finales que `Borrador.guardar`, y por el mismo motivo: el servidor
ya los distingue.

| Del servidor | Qué pasó | Qué debe leer quien publica |
|---|---|---|
| **200** `{version}` | publicado | «Publicado: la web muestra ya la versión N» |
| **422** `{problemas}` | el borrador guardado no vale | la lista de problemas del Worker |
| **409** `{guardada}` | la otra persona guardó después | conflicto, y «Publicar» se deshabilita |
| cuerpo que no es JSON | la sesión de Access caducó | «la sesión ha caducado…» |
| red caída | ni llegó | «no se ha podido contactar con el servidor» |

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-publicacion.js`:

```js
/* Habla con la red, así que se dobla `fetch` en la ventana del iframe antes
   de cargar el módulo (la técnica de pruebas-subida.js). */
describeAsync('Publicacion', function () {
  var MODULOS = ['../panel/js/publicacion.js'];

  function respuesta(estado, texto) {
    return Promise.resolve({
      status: estado,
      text: function () { return Promise.resolve(texto); },
      json: function () { return Promise.resolve(JSON.parse(texto)); }
    });
  }
  function servidor(contestar) {
    var registro = [];
    var doble = function (url, opciones) {
      registro.push({ url: String(url), metodo: (opciones && opciones.method) || 'GET' });
      return contestar(String(url), opciones);
    };
    doble.registro = registro;
    return doble;
  }
  function con(doble, fn) {
    return ArnesDom.conDocumento({ globales: { fetch: doble }, scripts: MODULOS }, fn);
  }
  function publicado(w) {
    return new Promise(function (ok) { w.Publicacion.publicado(function (l, e) { ok({ lista: l, error: e }); }); });
  }
  function publicar(w, version) {
    return new Promise(function (ok) { w.Publicacion.publicar(version, function (r, e) { ok({ r: r, error: e }); }); });
  }

  // ---- publicado ----------------------------------------------------

  var conContenido = servidor(function () {
    return respuesta(200, JSON.stringify({ version: 4, proyectos: [{ id: 'a', titulo: 'A' }] }));
  });
  return con(conContenido, function (w) {
    return publicado(w).then(function (r) {
      prueba('publicado pide /contenido.json sin caché y devuelve sus proyectos', function () {
        igual(r.error, null);
        igual(r.lista, [{ id: 'a', titulo: 'A' }]);
        cierto(conContenido.registro[0].url.indexOf('/contenido.json') !== -1, conContenido.registro[0].url);
      });
    });
  }).then(function () {
    return con(servidor(function () { return respuesta(404, 'No existe'); }), function (w) {
      return publicado(w).then(function (r) {
        prueba('un 404 es «nada publicado», no un error', function () {
          igual(r.error, null);
          igual(r.lista, []);
        });
      });
    });
  }).then(function () {
    return con(servidor(function () { return respuesta(200, '<!doctype html>'); }), function (w) {
      return publicado(w).then(function (r) {
        prueba('un contenido ilegible da error nuestro, sin el mensaje del motor', function () {
          igual(r.lista, null);
          cierto(r.error.indexOf('publicado') !== -1, r.error);
          cierto(!/unexpected|token|JSON/i.test(r.error), r.error);
        });
      });
    });
  }).then(function () {
    return con(servidor(function () { return Promise.reject(new TypeError('Failed to fetch')); }), function (w) {
      return publicado(w).then(function (r) {
        prueba('la red caída al leer lo publicado se dice en castellano', function () {
          igual(r.lista, null);
          cierto(r.error.indexOf('no se ha podido contactar') !== -1, r.error);
        });
      });
    });

  // ---- publicar -----------------------------------------------------

  }).then(function () {
    var bien = servidor(function () { return respuesta(200, JSON.stringify({ version: 7 })); });
    return con(bien, function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('publicar manda POST /api/publicar?version=N y devuelve la versión', function () {
          igual(r.error, null);
          igual(r.r, { version: 7 });
          igual(bien.registro[0].metodo, 'POST');
          cierto(bien.registro[0].url.indexOf('/api/publicar?version=7') !== -1, bien.registro[0].url);
        });
      });
    });
  }).then(function () {
    return con(servidor(function () {
      return respuesta(422, JSON.stringify({ problemas: ['bruma: sin piezas', 'bruma: sin portada'] }));
    }), function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('un 422 vuelve como resultado con los problemas del Worker', function () {
          igual(r.error, null);
          igual(r.r, { problemas: ['bruma: sin piezas', 'bruma: sin portada'] });
        });
      });
    });
  }).then(function () {
    return con(servidor(function () {
      return respuesta(409, JSON.stringify({ error: 'el contenido cambió mientras editabas…', guardada: 9 }));
    }), function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('un 409 vuelve como conflicto, con la versión del servidor', function () {
          igual(r.error, null);
          igual(r.r, { conflicto: true, guardada: 9 });
        });
      });
    });
  }).then(function () {
    return con(servidor(function () {
      return respuesta(500, JSON.stringify({ error: 'no se pudo publicar' }));
    }), function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('otro estado enseña el mensaje del Worker, que ya está en castellano', function () {
          igual(r.r, null);
          igual(r.error, 'No se ha podido publicar: no se pudo publicar.');
        });
      });
    });
  }).then(function () {
    return con(servidor(function () { return respuesta(200, '<html>Sign in</html>'); }), function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('un cuerpo que no es JSON al publicar es la sesión caducada', function () {
          igual(r.r, null);
          cierto(r.error.indexOf('sesión') !== -1, r.error);
        });
      });
    });
  }).then(function () {
    return con(servidor(function () { return Promise.reject(new TypeError('Failed to fetch')); }), function (w) {
      return publicar(w, 7).then(function (r) {
        prueba('la red caída al publicar se dice en castellano y sin el TypeError', function () {
          igual(r.r, null);
          cierto(r.error.indexOf('no se ha podido contactar') !== -1 && r.error.indexOf('Failed') === -1, r.error);
        });
      });
    });
  });
});
```

En `tests/test.html`, tras `cambios.js`:

```html
<script src="../panel/js/publicacion.js"></script>
```

(se carga aunque la prueba use su propio iframe, para que el auditor de rutas
y quien lea la lista de scripts vean el módulo entre los del panel), y tras
`pruebas-cambios.js`:

```html
<script src="pruebas-publicacion.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: la sección cae entera al no poder cargar `publicacion.js`.

- [ ] **Paso 3: Escribe `panel/js/publicacion.js`**

```js
window.Publicacion = (function () {
  var RUTA_PUBLICADO = '/contenido.json';
  var RUTA_PUBLICAR = '/api/publicar';

  /* Los mismos avisos que borrador.js y subida.js, por el mismo motivo: lo
     que llega del motor está en inglés y no dice nada a quien publica. */
  var SIN_RED = 'no se ha podido contactar con el servidor';
  var SESION = 'la sesión ha caducado: vuelve a entrar en otra pestaña y repite';

  function Legible(mensaje) { this.mensaje = mensaje; }

  function motivo(e) {
    if (e instanceof Legible) return e.mensaje;
    console.error('Publicacion: la petición no llegó a completarse: ' + (e && e.message));
    return SIN_RED;
  }

  function leer(r) {
    return r.text().then(function (texto) {
      try {
        return { estado: r.status, cuerpo: JSON.parse(texto) };
      } catch (e) {
        console.error('Publicacion: el servidor respondió ' + r.status + ' con algo que no es JSON: '
          + String(texto).slice(0, 200));
        throw new Legible(SESION);
      }
    });
  }

  /* Lo que ve hoy un visitante. Es la misma ruta pública que pide la web, con
     su caída al archivo del repositorio incluida, así que la comparación es
     contra lo que de verdad se enseña. Un 404 —nunca se publicó y tampoco
     hay archivo estático— vale como «nada publicado», no como error. */
  function publicado(alTerminar) {
    fetch(RUTA_PUBLICADO, { cache: 'no-cache', credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 404) return { proyectos: [] };
        if (r.status !== 200) throw new Legible('el servidor respondió ' + r.status + ' al pedir lo publicado');
        return r.json().then(null, function () { throw new Legible('lo publicado no se ha podido leer'); });
      })
      .then(
        function (datos) { alTerminar((datos && datos.proyectos) || [], null); },
        /* Dos argumentos y no .catch(): que un fallo dentro de alTerminar no
           vuelva a llamarlo con un error de red inventado (borrador.js, C1). */
        function (e) { alTerminar(null, 'No se ha podido saber qué hay publicado: ' + motivo(e) + '.'); }
      );
  }

  /* Publica la versión GUARDADA `version`. Los finales, como al guardar:
     {version} si se publicó; {problemas} si el Worker rechazó el borrador
     (422); {conflicto, guardada} si el servidor va por otra versión (409);
     y error de texto para lo demás. */
  function publicar(version, alTerminar) {
    fetch(RUTA_PUBLICAR + '?version=' + encodeURIComponent(version), {
      method: 'POST', credentials: 'same-origin'
    })
      .then(leer)
      .then(function (res) {
        var cuerpo = res.cuerpo || {};
        if (res.estado === 200) return { version: cuerpo.version };
        if (res.estado === 422) return { problemas: cuerpo.problemas || [] };
        if (res.estado === 409) return { conflicto: true, guardada: cuerpo.guardada };
        console.error('Publicacion: POST respondió ' + res.estado + ': ' + cuerpo.error);
        throw new Legible(cuerpo.error || 'el servidor respondió ' + res.estado);
      })
      .then(
        function (r) { alTerminar(r, null); },
        function (e) { alTerminar(null, 'No se ha podido publicar: ' + motivo(e) + '.'); }
      );
  }

  return { publicado: publicado, publicar: publicar };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Las diez en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/publicacion.js tests/pruebas-publicacion.js tests/test.html
git commit -m "Leer lo publicado y publicar, distinguiendo los cuatro finales"
```

---

### Tarea 3: La pantalla de publicar

**Archivos:**
- Crear: `panel/js/pantalla-publicar.js`
- Modificar: `panel/index.html`, `panel/css/panel.css`

**Interfaces:**
- Produce: `window.PantallaPublicar.init(contexto)` con
  `contexto = {trabajo(), hayCambios(), avisar(texto)}`;
  `window.PantallaPublicar.mostrar()` (al entrar: consulta lo publicado y
  pinta) y `window.PantallaPublicar.pintar()` (repinta sin consultar; lo
  llama `panel.js` tras guardar).
- Consume: `Cambios`, `Publicacion`, `ReglasContenido`.

Sin prueba propia: se prueba entera desde `tests/pruebas-panel.js` en la
Tarea 4, con `Publicacion` doblada.

- [ ] **Paso 1: El marcado**

En `panel/index.html`, sustituye la sección vacía por:

```html
    <section id="pantalla-publicar" hidden>
      <h2 tabindex="-1">Publicar</h2>

      <p id="publicar-estado"></p>

      <h3>Qué cambia respecto a lo que hoy enseña la web</h3>
      <ul id="cambios" class="cambios"></ul>

      <h3 id="problemas-titulo" hidden>Antes hay que resolver</h3>
      <ul id="problemas" class="avisos" hidden></ul>

      <!-- Publicar copia el borrador GUARDADO sobre la web pública. El botón
           se deshabilita con cambios sin guardar y con problemas de validación,
           y pide confirmación siempre: es la única acción del panel que se ve
           fuera. -->
      <button id="publicar" type="button" disabled>Publicar</button>
    </section>
```

Y en la lista de `<script>`, entre `pantallas.js` y `panel.js`:

```html
  <script src="js/cambios.js"></script>
  <script src="js/publicacion.js"></script>
  <script src="js/pantalla-publicar.js"></script>
```

- [ ] **Paso 2: Los estilos**

En `panel/css/panel.css`, tras `.avisos{…}`:

```css
.cambios{
  list-style: none;
  margin-bottom: 1rem;
}
.cambios li::before{ content: '→ '; font-weight: 700; }

#publicar-estado{ margin-bottom: 1rem; }

/* El botón de publicar es el mismo negro que Guardar, pero más grande: es
   la acción que se ve fuera. */
#publicar{
  margin-top: 1rem;
  font-family: var(--ff);
  font-weight: 700;
  font-size: 1.15rem;
  padding: 0.8rem 1.75rem;
  border: 2px solid var(--black);
  border-radius: 4px;
  background: var(--black);
  color: var(--yellow);
  cursor: pointer;
}
#publicar:hover:not(:disabled){ background: var(--yellow); color: var(--black); }
#publicar:disabled{ opacity: 0.35; cursor: not-allowed; }
```

- [ ] **Paso 3: Escribe `panel/js/pantalla-publicar.js`**

```js
window.PantallaPublicar = (function () {
  var ctx;                  // { trabajo, hayCambios, avisar }
  var el = {};
  var publicados = null;    // la lista publicada, o null si no se ha podido leer
  var errorPublicado = null;
  var consultando = false;

  function lista(ul, textos) {
    ul.innerHTML = '';
    textos.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    ul.hidden = textos.length === 0;
  }

  /* Lo que impide publicar AHORA, en el orden en que hay que resolverlo.
     Con cambios sin guardar no se dice nada más: se publica lo guardado, y
     validar lo que hay en pantalla hablaría de otra cosa. */
  function problemasLocales() {
    var t = ctx.trabajo();
    if (!t) return ['Espera a que cargue el contenido.'];
    if (ctx.hayCambios()) return ['Hay cambios sin guardar. Guarda antes de publicar: se publica lo guardado.'];
    var problemas = window.ReglasContenido.validar(t, window.ReglasContenido.CATEGORIAS);
    if (!t.proyectos.length) problemas.push('no hay ningún proyecto que publicar');
    return problemas;
  }

  function pintar() {
    var t = ctx.trabajo();
    var problemas = problemasLocales();
    lista(el.problemas, problemas);
    el.problemasTitulo.hidden = problemas.length === 0;

    var frases;
    if (consultando) frases = ['Consultando lo que hay publicado…'];
    else if (errorPublicado) frases = [errorPublicado];
    else if (t && publicados) {
      var c = window.Cambios.calcular(publicados, t.proyectos);
      frases = window.Cambios.hayAlguno(c) ? window.Cambios.resumir(c)
                                           : ['Nada: el borrador y la web dicen lo mismo.'];
    } else frases = [];
    lista(el.cambios, frases);

    el.estado.textContent = t ? 'El borrador guardado va por la versión ' + t.version + '.' : '';
    el.publicar.disabled = consultando || !t || problemas.length > 0;
  }

  /* Al entrar en la pantalla: consulta lo publicado y pinta. La consulta
     puede fallar sin que publicar deje de ser posible: se dice y ya. */
  function mostrar() {
    consultando = true;
    publicados = null;
    errorPublicado = null;
    pintar();
    window.Publicacion.publicado(function (lista, error) {
      consultando = false;
      if (error) errorPublicado = error;
      else publicados = lista;
      pintar();
    });
  }

  function publicar() {
    var t = ctx.trabajo();
    if (!t || problemasLocales().length) return pintar();
    /* Confirmación siempre: es la única acción del panel que se ve fuera. */
    if (!window.confirm('¿Publicar la versión ' + t.version + '? La web pública cambiará en cuanto termine.')) return;
    el.publicar.disabled = true;
    window.Publicacion.publicar(t.version, function (r, error) {
      if (error) {
        ctx.avisar(error);
        return pintar();
      }
      if (r.problemas) {
        /* El Worker ha aplicado las mismas reglas y ha visto algo que aquí no
           se vio (o el borrador guardado no es el que se cree). Su lista
           manda: se enseña donde van los problemas y se deja reintentar. */
        lista(el.problemas, r.problemas);
        el.problemasTitulo.hidden = false;
        el.publicar.disabled = false;
        return ctx.avisar('El servidor no acepta el borrador: revisa la lista de problemas.');
      }
      if (r.conflicto) {
        /* Como en guardar(): publicar con la versión del servidor sería
           publicar algo que esta persona no ha visto. Se queda deshabilitado
           hasta recargar. */
        return ctx.avisar('Alguien ha guardado mientras tanto (el servidor va por la versión '
          + r.guardada + '). Recarga la página para ver lo último antes de publicar; recargar '
          + 'no pierde nada, porque aquí no había cambios sin guardar.');
      }
      ctx.avisar('Publicado: la web muestra ya la versión ' + r.version + '.');
      mostrar();   // lo publicado ha cambiado: se vuelve a consultar
    });
  }

  function init(contexto) {
    ctx = contexto;
    el.cambios = document.getElementById('cambios');
    el.problemas = document.getElementById('problemas');
    el.problemasTitulo = document.getElementById('problemas-titulo');
    el.publicar = document.getElementById('publicar');
    el.estado = document.getElementById('publicar-estado');
    el.publicar.addEventListener('click', publicar);
  }

  return { init: init, mostrar: mostrar, pintar: pintar };
})();
```

- [ ] **Paso 4: Comprueba y commitea**

```bash
wc -l panel/js/pantalla-publicar.js
python tests/auditar_rutas.py
git add panel/js/pantalla-publicar.js panel/index.html panel/css/panel.css
git commit -m "La pantalla de publicar: que cambia, que falta, y el boton"
```

---

### Tarea 4: Engancharla en `panel.js` y probarla entera

**Archivos:**
- Modificar: `panel/js/panel.js`, `tests/pruebas-panel.js`

**Interfaces:**
- Consume: `PantallaPublicar.init`, `.mostrar`, `.pintar`.
- Produce: nada nuevo hacia fuera.

- [ ] **Paso 1: Las pruebas que fallan**

En `tests/pruebas-panel.js`:

**(a)** En `HTML`, sustituye la sección vacía de publicar por:

```js
    '<section id="pantalla-publicar" hidden><h2 tabindex="-1">Publicar</h2>' +
    '<p id="publicar-estado"></p><ul id="cambios"></ul>' +
    '<h3 id="problemas-titulo" hidden></h3><ul id="problemas" hidden></ul>' +
    '<button id="publicar" type="button" disabled>Publicar</button></section>' +
```

**(b)** En `MODULOS`, entre `pantallas.js` y `panel.js`:

```js
                 '../panel/js/cambios.js', '../panel/js/pantalla-publicar.js',
```

(`publicacion.js` no: se dobla, porque habla con la red.)

**(c)** Un doble de `Publicacion` junto a `subidaFalsa`:

```js
  /* El doble de Publicacion. `publicados` es lo que devuelve /contenido.json;
     `respuesta` lo que contesta POST /api/publicar. Responde en el acto. */
  function publicacionFalsa(opciones) {
    var o = opciones || {};
    var doble = {
      pedidas: [],
      publicado: function (cb) {
        if (o.errorAlLeer) return cb(null, o.errorAlLeer);
        cb(o.publicados || [], null);
      },
      publicar: function (version, cb) {
        doble.pedidas.push(version);
        cb(o.respuesta || { version: version }, o.errorAlPublicar || null);
      }
    };
    return doble;
  }
```

**(d)** `conPanel` gana el quinto argumento:

```js
  function conPanel(doble, fn, confirmar, subida, publicacion) {
    return ArnesDom.conDocumento({
      html: HTML,
      globales: { Borrador: doble, Subida: subida || subidaFalsa({}, 'sin red'),
                  Publicacion: publicacion || publicacionFalsa({}),
                  confirm: confirmar || function () { return true; } },
      scripts: MODULOS
    }, fn);
  }
```

**(e)** Al final de la cadena, tras el bloque de «quitar pide confirmación»:

```js
  }).then(function () {

    // ---- Publicar -------------------------------------------------------

    function publicable() {
      var t = dosProyectos();
      t.proyectos.forEach(function (p) {
        p.tipo = 'fotos';
        p.ficha = { anio: 2025, papel: 'DoP' };
        p.portada = '/img/' + p.id + '-1500.jpg';
        p.piezas = [{ url: '/img/' + p.id + '-3000.jpg', miniatura: '/img/' + p.id + '-250.jpg' }];
      });
      return t;
    }
    function textos(d, selector) {
      return [].map.call(d.querySelectorAll(selector), function (li) { return li.textContent; });
    }

    var web = publicacionFalsa({ publicados: [publicable().proyectos[0]] });   // sólo niebla publicada
    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      w.Panel.ir('#/publicar');
      prueba('ir a publicar enseña su pantalla y consulta lo publicado', function () {
        igual(d.getElementById('pantalla-publicar').hidden, false);
        igual(textos(d, '#cambios li'), ['Nuevo: Arena']);
      });
      prueba('con el borrador guardado y válido, Publicar está activo y no hay problemas', function () {
        igual(d.getElementById('publicar').disabled, false);
        igual(d.getElementById('problemas').hidden, true);
        cierto(d.getElementById('publicar-estado').textContent.indexOf('versión 3') !== -1);
      });

      d.getElementById('publicar').click();
      prueba('publicar pide la versión guardada y lo dice', function () {
        igual(web.pedidas, [3]);
        cierto(d.getElementById('aviso').textContent.indexOf('Publicado') !== -1, d.getElementById('aviso').textContent);
      });
    }, null, null, web);

  }).then(function () {

    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      /* Se edita algo sin guardar y se va a publicar. */
      w.Panel.ir('#/proyecto/niebla');
      cambiarCampo(w, d, 'proyecto-titulo', 'Niebla espesa');
      w.Panel.ir('#/publicar');
      prueba('con cambios sin guardar, Publicar se deshabilita y se dice por qué', function () {
        igual(d.getElementById('publicar').disabled, true);
        cierto(textos(d, '#problemas li')[0].indexOf('sin guardar') !== -1, textos(d, '#problemas li').join(' | '));
      });

      d.getElementById('guardar').click();
      prueba('guardar desde ahí repinta y vuelve a activar Publicar', function () {
        igual(d.getElementById('publicar').disabled, false);
        igual(d.getElementById('problemas').hidden, true);
        /* Primero los nuevos, luego los que cambian: el orden de Cambios.resumir. */
        igual(textos(d, '#cambios li'), ['Nuevo: Arena', 'Cambia Niebla espesa: el título']);
      });
    }, null, null, publicacionFalsa({ publicados: [publicable().proyectos[0]] }));

  }).then(function () {

    /* dosProyectos() trae los proyectos sin fotos ni ficha completa: no vale.
       Ojo: `arena` es tipo 'video' ahí, así que de ella lo que dice validar
       es que le falta el póster, no las piezas. */
    return conPanel(borradorFalso({ datos: dosProyectos() }), function (w, d) {
      w.Panel.ir('#/publicar');
      prueba('un borrador que no valida deshabilita Publicar y lista lo que falta, con las reglas del Worker', function () {
        igual(d.getElementById('publicar').disabled, true);
        var p = textos(d, '#problemas li');
        cierto(p.indexOf('niebla: sin piezas') !== -1, p.join(' | '));
        cierto(p.indexOf('arena: un proyecto de vídeo necesita poster') !== -1, p.join(' | '));
      });
    });

  }).then(function () {

    var pide = publicacionFalsa({ publicados: [] });
    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      w.Panel.ir('#/publicar');
      d.getElementById('publicar').click();
      prueba('si se cancela la confirmación no se publica', function () {
        igual(pide.pedidas, []);
      });
    }, function () { return false; }, null, pide);

  }).then(function () {

    var rechaza = publicacionFalsa({ publicados: [], respuesta: { problemas: ['bruma: la ficha no trae año'] } });
    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      w.Panel.ir('#/publicar');
      d.getElementById('publicar').click();
      prueba('un 422 enseña los problemas del Worker y deja reintentar', function () {
        igual(textos(d, '#problemas li'), ['bruma: la ficha no trae año']);
        igual(d.getElementById('publicar').disabled, false);
        cierto(d.getElementById('aviso').textContent.indexOf('no acepta') !== -1);
      });
    }, null, null, rechaza);

  }).then(function () {

    var choca = publicacionFalsa({ publicados: [], respuesta: { conflicto: true, guardada: 9 } });
    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      w.Panel.ir('#/publicar');
      d.getElementById('publicar').click();
      prueba('un conflicto deshabilita Publicar y dice la versión del servidor y que hay que recargar', function () {
        igual(d.getElementById('publicar').disabled, true);
        var t = d.getElementById('aviso').textContent;
        cierto(t.indexOf('9') !== -1 && t.toLowerCase().indexOf('recarga') !== -1, t);
      });
    }, null, null, choca);

  }).then(function () {

    return conPanel(borradorFalso({ datos: publicable() }), function (w, d) {
      w.Panel.ir('#/publicar');
      prueba('si no se puede leer lo publicado, se dice y Publicar sigue activo', function () {
        igual(textos(d, '#cambios li'), ['No se ha podido saber qué hay publicado: no se ha podido contactar con el servidor.']);
        igual(d.getElementById('publicar').disabled, false);
      });
    }, null, null, publicacionFalsa({ errorAlLeer: 'No se ha podido saber qué hay publicado: no se ha podido contactar con el servidor.' }));
  });
```

- [ ] **Paso 2: Comprueba que falla**

Recarga. Esperado: la sección «panel.js» cae entera (no puede cargar
`pantalla-publicar.js` desde el `MODULOS` nuevo hasta que exista, y con él,
`ir('#/publicar')` no pinta nada porque `panel.js` no enruta esa pantalla).

- [ ] **Paso 3: Las seis líneas de `panel.js`**

En `enrutar`, tras el bloque de `proyecto` y antes de
`window.Pantallas.mostrar(r.pantalla)`:

```js
    if (r.pantalla === 'publicar') window.PantallaPublicar.mostrar();
```

En `init`, justo después de `window.Proyecto.init({…})`:

```js
    window.PantallaPublicar.init({
      trabajo: function () { return trabajo; }, hayCambios: hayCambios, avisar: avisar
    });
```

Y en `guardar`, tras `avisar('Guardado.');`:

```js
      /* Si se guardó desde la pantalla de publicar, lo que impedía publicar
         acaba de desaparecer: se repinta para que el botón se active. */
      if (window.Pantallas.visible() === 'publicar') window.PantallaPublicar.pintar();
```

- [ ] **Paso 4: Comprueba que pasa**

Recarga: las 41 anteriores de «panel.js» en verde y las 10 nuevas también. Y:

```bash
wc -l panel/js/panel.js
python tests/auditar_rutas.py
```

`panel.js` por debajo de 300.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/panel.js tests/pruebas-panel.js
git commit -m "Enrutar la pantalla de publicar y probarla entera con el panel"
```

---

### Tarea 5: Publicar de verdad

**Lo hace el controlador**, desplegado y con sesión de Access, igual que la
Tarea 9 del bloque 3c:

```
git archive HEAD | tar -x -C <directorio-temporal>
wrangler deploy --config worker/estatico/wrangler.toml --assets <directorio-temporal>
```

**Antes de pulsar «Publicar» por primera vez, una advertencia que no está en
ninguna prueba:** hoy la web sirve el `contenido.json` **del repositorio**
porque R2 nunca ha tenido uno. El borrador de R2 lo sembró el bloque 3b y ha
recibido las pruebas del 3c: **comprueba en la pantalla de publicar que la
lista de cambios dice lo que esperas antes de confirmar**. Si el borrador de
R2 no es el contenido real de Lidia, lo primero es dejarlo como
`contenido.json` del repositorio (copiar los ocho proyectos al borrador desde
el panel no tiene botón: se hace con `wrangler r2 object put
luque-contenido/borrador.json --file contenido.json` **poniendo `version`
igual a la que devuelva `GET /api/borrador`**, y recargando el panel).

- [ ] **Paso 1: Lo que debe funcionar**

| Prueba | Esperado |
|---|---|
| Entrar en `#/publicar` con el borrador igual que la web | «Nada: el borrador y la web dicen lo mismo», botón activo |
| Cambiar un título en `#/proyecto/…`, ir a Publicar sin guardar | botón deshabilitado, «Hay cambios sin guardar» |
| Guardar desde ahí | botón activo, «Cambia <título>: el título» |
| Pulsar Publicar y **cancelar** | nada cambia; `GET lidialuque.com/contenido.json` sigue igual |
| Pulsar Publicar y confirmar | «Publicado: la web muestra ya la versión N»; la lista vuelve a «Nada» |
| `GET lidialuque.com/contenido.json` | trae el título nuevo, y la cabecera `cache-control: public, max-age=0, must-revalidate` |
| Abrir la web pública en otra pestaña | el título nuevo en la ficha del visor (criterio 2) |
| Borrar un proyecto en el panel, Guardar, **no** publicar | la web lo sigue enseñando (criterio 3); Publicar lo lista como «Se retira» |
| Volver a crearlo… o recargar sin guardar | — |
| Un proyecto nuevo **sin fotos**, Guardar, ir a Publicar | botón deshabilitado, «<id>: sin piezas», «<id>: sin portada» |
| Subirle una foto, Guardar, Publicar | publica; la web enseña el proyecto nuevo con su portada |

- [ ] **Paso 2: El conflicto de verdad** (criterio 9)

Dos pestañas con el panel. En la A, cambia algo y Guarda. En la B —que cargó
antes— ve a Publicar y pulsa: esperado, **409**: el aviso con la versión del
servidor, «Publicar» deshabilitado, y `contenido.json` sin cambiar.

- [ ] **Paso 3: Sin ratón**

Tab hasta el enlace «Publicar» de la cabecera, Enter: el foco en el título
«Publicar». Tab hasta el botón, Enter: el `confirm` del navegador se maneja
con el teclado. Esc lo cancela.

- [ ] **Paso 4: Lo que NO debe pasar**

| Prueba | Esperado |
|---|---|
| `POST lidialuque.com/api/publicar?version=1` con `curl` sin cookie | **403**, «la petición no trae identidad de Access» |
| `GET lidialuque.com/borrador.json` | 404 |
| `robots.txt` y `X-Robots-Tag` | siguen cerrando la web a buscadores; publicar no es anunciar |

- [ ] **Paso 5: Si Node está en el PATH**

```bash
cd worker && node --test
```

Esperado: todo en verde, sin cambios: este bloque no toca el Worker. Si Node
no está, sáltalo y dilo en el commit de la Tarea 6.

---

### Tarea 6: Dejarlo escrito y cerrar el bloque 3

**Archivos:**
- Modificar: `docs/estado-conocido.md`, `docs/despliegue.md`,
  `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`

- [ ] **Paso 1: `docs/estado-conocido.md`**

En la sección del panel que abrió el bloque 3c:

- Que **publicar existe** y qué hace: `POST /api/publicar?version=N` sobre
  el borrador guardado; que la comparación es contra `/contenido.json` por su
  ruta pública, y por qué (decisión 1); que con cambios sin guardar no se
  publica (decisión 2).
- **La primera publicación real**: fecha, versión, y que desde entonces la
  web sirve el `contenido.json` de R2 y **el del repositorio ya no manda**.
  `herramientas/derivar_imagenes.py --contenido` sigue sirviendo para
  regenerarlo en local, pero lo que ve el visitante lo decide el panel. Esto
  cambia lo que dice hoy la sección «El contenido» («`contenido.json` no se
  edita a mano: lo genera…»): corrígela.
- Recuento del arnés actualizado, con fecha.

- [ ] **Paso 2: `docs/despliegue.md`**

Que publicar no requiere despliegue —es el panel—, y cómo dejar el borrador
de R2 como el archivo del repositorio si alguna vez hiciera falta (el
`wrangler r2 object put` de la Tarea 5, con la advertencia de `version`).

- [ ] **Paso 3: La especificación**

Añade al principio de la spec, bajo «Correcciones tras implementar los bloques
1 y 2», una nota **«Cerrado el bloque 3 (2026-09-…)»** de cinco líneas: los
cuatro sub-bloques (3a Worker, 3b lista, 3c proyecto, 3d publicar), que el
criterio 1 se cumple desde el 3d (todo el contenido sale de `contenido.json`
publicado desde el panel), y que el tipo `video` con Vimeo queda para el
bloque 4 (decisión 4 del plan 3c).

- [ ] **Paso 4: Commit**

```bash
git add docs/
git commit -m "Documentar publicar y cerrar el bloque 3 del panel"
```

---

## Quién consume lo que aquí se toca

| Lo que cambia | Quién lo lee |
|---|---|
| `contenido.json` en R2 (Tarea 5, al publicar) | **la web pública entera**, en cuanto se publica: `js/contenido.js` lo pide al arrancar |
| `Panel.hayCambios` | `PantallaPublicar.problemasLocales`: si `fijarGuardado` dejara de llamarse tras guardar, publicar quedaría deshabilitado para siempre |
| `guardar()` en `panel.js` | ahora repinta la pantalla de publicar si está visible |
| `tests/pruebas-panel.js` | su `HTML` y `MODULOS` tienen que ir a la par de `panel/index.html`, otra vez |
| `Cambios.CAMPOS` | si un bloque futuro añade un campo al proyecto y no lo lista ahí, cambiarlo no saldrá en «qué cambia» |

## Lo que este bloque deja preparado y no usa

- Nada nuevo hacia fuera. Cierra el bloque 3.
- Deuda anotada: no hay `DELETE /api/imagen` ni limpieza de huérfanos; el
  recorte de franjas negras sólo lo hace la herramienta; el tipo `video`
  espera al bloque 4.
