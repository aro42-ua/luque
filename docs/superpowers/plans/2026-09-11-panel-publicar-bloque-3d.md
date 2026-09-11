# La pantalla de publicar — plan del bloque 3d

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos. Antes de decir «hecho»:
> `superpowers:verification-before-completion`.

**Depende del bloque 3c.** Este plan da por hechas `panel/js/rutas.js`,
`pantallas.js` y `window.Panel = { ir, hayCambios }`. No se empieza hasta que el
3c esté fusionado y en verde.

**Objetivo:** la tercera pantalla del panel. Antes de pulsar el botón que cambia
la web pública, el estudio ve **qué va a cambiar** —qué proyectos entran, cuáles
salen, cuáles se han tocado— y **qué falta** para que se pueda publicar.

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`,
sección **El contenido son dos archivos** y criterios de aceptación 2, 3 y 9.

**Lo que ya existe y este bloque consume:**

| Pieza | Qué hace |
|---|---|
| `POST /api/publicar?version=N` | valida y copia el borrador sobre el contenido. **200** `{version}`; **422** `{problemas}`; **409** `{error, guardada}`; **400** si falta la versión |
| `GET /contenido.json` | lo que la web pública lee hoy. Sin Access delante: es público |
| `window.Panel.hayCambios()` | si el borrador en memoria difiere del guardado |
| `window.ReglasContenido.validar` | las mismas reglas que aplica el Worker |

## Restricciones globales

Las mismas del 3c, y **una más que es de este bloque**: al otro lado del botón
está la web que ven los clientes de la fotógrafa. Todo lo que aquí se decida se
decide en esa dirección.

- Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.
- `panel/js/` en ES5 estricto y patrón `window.Nombre`.
- Textos en castellano.
- `publicacion.js` se prueba en el arnés del navegador doblando `fetch` dentro
  del iframe de `ArnesDom.conDocumento`, no con Node.

---

## Cuatro decisiones, razonadas

### 1. Se compara contra `/contenido.json` público, no contra una copia

Para decir «qué va a cambiar» hacen falta dos cosas: el borrador, que el panel
ya tiene, y **lo que hay publicado ahora mismo**. Esto último se pide a
`/contenido.json`, el mismo archivo que lee la web.

La alternativa —una ruta nueva en el Worker que devuelva el contenido— no aporta
nada y añade superficie: `contenido.json` ya es público por definición, y
pedirlo al mismo origen no necesita permisos. Que el panel lea exactamente lo
mismo que la web tiene además una ventaja: si la web ve algo raro, el panel ve
lo mismo.

Se pide con `cache: 'no-cache'`. Sin eso, el navegador serviría la copia en
caché y el resumen diría que no ha cambiado nada justo después de publicar.

### 2. No se publica con cambios sin guardar

Publicar es copiar `borrador.json` sobre `contenido.json`, y el Worker lee el
borrador **del servidor**. Lo que hay sin guardar en la pantalla no está ahí.

Si se dejara publicar con cambios pendientes, el estudio pulsaría el botón
mirando un resumen que incluye lo que acaba de escribir, y saldría publicado lo
de antes. El resumen sería mentira, y una mentira que sólo se descubre mirando
la web. Así que el botón se deshabilita y dice por qué.

### 3. Se pregunta siempre, aunque no haya nada que cambie

`confirm` antes de publicar, sin excepción. No es por si acaso: es la única
acción del panel que se ve desde fuera, y la única sin deshacer —republicar el
contenido anterior no es posible desde el panel, porque el borrador ya es el
nuevo—.

Un «no hay cambios, publico igual» es inofensivo y sigue preguntando: distinguir
casos aquí serían dos caminos, y el que se usa menos es el que se rompe.

### 4. Un 409 deshabilita el botón, igual que al guardar

Es exactamente el mismo problema que ya resolvió el 3b en `guardar()`: si el
botón sigue activo, volver a pulsarlo manda la misma versión vieja y el servidor
vuelve a contestar 409, en bucle. Y actualizar la versión al vuelo «arreglaría»
el segundo intento publicando por encima del trabajo de la otra persona sin que
el servidor lo vuelva a detectar.

La salida real es recargar, así que se deshabilita hasta entonces y el aviso lo
dice. Se copia el criterio a propósito, y el mensaje lo nombra: dos formas
distintas de tratar el mismo conflicto según qué botón se pulsó serían dos
formas de las que sólo una está probada.

---

## Estructura de archivos

| Archivo | De qué responde | Puro |
|---|---|---|
| `panel/js/cambios.js` | Comparar borrador y publicado, y decir qué cambia | sí |
| `panel/js/publicacion.js` | Pedir `/contenido.json` y `POST /api/publicar` | no |
| `panel/js/pantalla-publicar.js` | Pintar el resumen, lo que falta y el botón | no |

---

### Tarea 1: Qué cambia entre el borrador y lo publicado

**Archivos:**
- Crear: `panel/js/cambios.js`, `tests/pruebas-cambios.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Cambios.entre(borrador, publicado)` →
  `{ nuevos, retirados, tocados, movidos, hay }`.
- Consume: nada.

**Por qué importa.** Es lo único que hay entre el estudio y una web que cambia.
La especificación lo pide por su nombre —«qué ha cambiado desde la última
publicación»— y lo nombra en las pruebas que el arnés debe ampliar.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-cambios.js`:

```js
describe('Cambios.entre', function () {
  function p(id, extra) {
    var base = { id: id, titulo: id, categoria: 'editorial', tipo: 'fotos',
                 ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/' + id + '-1500.jpg',
                 piezas: [{ url: '/img/' + id + '-3000.jpg' }] };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }
  function con(lista) { return { version: 1, proyectos: lista }; }

  prueba('sin diferencias no hay nada que publicar', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), con([p('a'), p('b')]));
    igual(r.hay, false);
    igual([r.nuevos, r.retirados, r.tocados, r.movidos], [[], [], [], []]);
  });

  prueba('un proyecto que sólo está en el borrador es nuevo', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), con([p('a')]));
    igual(r.nuevos, ['b']);
    igual(r.hay, true);
  });

  /* Criterio de aceptación 3: borrar un proyecto en el panel no lo quita de la
     web hasta que se publica. Aquí es donde eso se le enseña a quien publica,
     antes de que ocurra. */
  prueba('un proyecto que sólo está publicado se retira', function () {
    igual(Cambios.entre(con([p('a')]), con([p('a'), p('b')])).retirados, ['b']);
  });

  prueba('un proyecto con la ficha cambiada está tocado', function () {
    var r = Cambios.entre(con([p('a', { ficha: { anio: 2026, papel: 'DoP' } })]), con([p('a')]));
    igual(r.tocados, ['a']);
    igual(r.nuevos, []);
  });

  prueba('cambiar las fotos también es tocarlo', function () {
    var r = Cambios.entre(
      con([p('a', { piezas: [{ url: '/img/a-3000.jpg' }, { url: '/img/z-3000.jpg' }] })]),
      con([p('a')]));
    igual(r.tocados, ['a']);
  });

  /* Reordenar la lista ES recomponer la galería: el orden de la lista es lo
     que js/composicion.js convierte en la posición de cada proyecto en el
     lienzo. Un cambio de orden cambia la web aunque ningún proyecto cambie,
     y no decirlo sería esconder justo el cambio más visible. */
  prueba('cambiar el orden se cuenta aparte, y cuenta', function () {
    var r = Cambios.entre(con([p('b'), p('a')]), con([p('a'), p('b')]));
    igual(r.movidos, ['b', 'a']);
    igual(r.tocados, []);
    igual(r.hay, true);
  });

  /* Un proyecto nuevo desplaza a los de detrás, y eso NO es haberlos movido:
     decir «has movido seis proyectos» por haber añadido uno al principio
     convertiría el resumen en ruido. Sólo cuenta el orden relativo de los que
     están en los dos sitios. */
  prueba('añadir uno delante no cuenta como mover a los demás', function () {
    var r = Cambios.entre(con([p('z'), p('a'), p('b')]), con([p('a'), p('b')]));
    igual(r.nuevos, ['z']);
    igual(r.movidos, []);
  });

  prueba('publicar por primera vez es todo nuevo', function () {
    var r = Cambios.entre(con([p('a'), p('b')]), null);
    igual(r.nuevos, ['a', 'b']);
    igual(r.retirados, []);
    igual(r.hay, true);
  });

  /* Un contenido.json que no carga no puede hacer que el panel diga «no hay
     cambios»: eso invitaría a no publicar justo cuando la web está vacía. */
  prueba('un publicado mal formado se trata como vacío', function () {
    igual(Cambios.entre(con([p('a')]), { proyectos: 'esto no es una lista' }).nuevos, ['a']);
    igual(Cambios.entre(con([p('a')]), {}).nuevos, ['a']);
  });

  prueba('un borrador vacío retira todo', function () {
    var r = Cambios.entre(con([]), con([p('a')]));
    igual(r.retirados, ['a']);
    igual(r.hay, true);
  });

  /* La versión sube en cada guardado, así que siempre difiere de la
     publicada. Si contara como cambio, `hay` sería true siempre y el resumen
     no distinguiría nada. */
  prueba('la versión no es un cambio de contenido', function () {
    var a = con([p('a')]); a.version = 9;
    var b = con([p('a')]); b.version = 2;
    igual(Cambios.entre(a, b).hay, false);
  });

  /* `actualizado` es una marca de tiempo del modelo de datos: cambia sola y
     no se ve en la web. */
  prueba('la fecha de actualización tampoco', function () {
    var a = con([p('a')]); a.actualizado = '2026-09-11T10:00:00Z';
    var b = con([p('a')]); b.actualizado = '2026-01-01T10:00:00Z';
    igual(Cambios.entre(a, b).hay, false);
  });
});

describe('Cambios.resumir', function () {
  prueba('sin cambios lo dice con todas las letras', function () {
    igual(Cambios.resumir({ nuevos: [], retirados: [], tocados: [], movidos: [], hay: false }),
          'No hay ningún cambio pendiente de publicar.');
  });

  prueba('nombra los proyectos, no los cuenta', function () {
    var texto = Cambios.resumir({ nuevos: ['bruma'], retirados: ['arena'],
                                  tocados: ['niebla'], movidos: [], hay: true });
    cierto(texto.indexOf('bruma') !== -1, texto);
    cierto(texto.indexOf('arena') !== -1, texto);
    cierto(texto.indexOf('niebla') !== -1, texto);
  });

  /* Una lista vacía no se menciona: «se retiran: (ninguno)» es ruido en la
     única pantalla donde hay que leer con atención. */
  prueba('lo que no cambia no se menciona', function () {
    var texto = Cambios.resumir({ nuevos: ['bruma'], retirados: [], tocados: [],
                                  movidos: [], hay: true });
    igual(texto.indexOf('retir'), -1, texto);
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/cambios.js"></script>
```
```html
<script src="pruebas-cambios.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Cambios is not defined`.

- [ ] **Paso 3: Escribe `panel/js/cambios.js`**

```js
/* Qué cambia entre lo que se va a publicar y lo que hay publicado. Sin DOM y
   sin red: es lo único que hay entre el estudio y una web que cambia, así que
   es lo que más falta hace poder probar entero. */
window.Cambios = (function () {

  function proyectosDe(datos) {
    var lista = datos && datos.proyectos;
    /* Un contenido.json que no carga o llega mal formado se trata como vacío,
       no como «sin cambios»: decir que no hay nada que publicar cuando la web
       está vacía invitaría justo a no publicar. */
    return Object.prototype.toString.call(lista) === '[object Array]' ? lista : [];
  }

  function porId(lista) {
    var mapa = {};
    lista.forEach(function (p) { if (p && p.id) mapa[p.id] = p; });
    return mapa;
  }

  function ids(lista) {
    return lista.filter(function (p) { return p && p.id; })
                .map(function (p) { return p.id; });
  }

  /* La comparación es el JSON del proyecto entero: cualquier campo que cambie
     cuenta, incluidos los que hoy no existen. Comparar campo a campo sería una
     lista que hay que acordarse de ampliar cada vez que el modelo crezca, y de
     la que nadie se acuerda.

     Se ordenan las claves porque JSON.stringify respeta el orden de inserción,
     y {a,b} y {b,a} son el mismo proyecto: sin esto, editar la ficha y dejarla
     igual saldría como cambio. */
  function huella(valor) {
    if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
    if (Object.prototype.toString.call(valor) === '[object Array]') {
      return '[' + valor.map(huella).join(',') + ']';
    }
    return '{' + Object.keys(valor).sort().map(function (k) {
      return JSON.stringify(k) + ':' + huella(valor[k]);
    }).join(',') + '}';
  }

  function entre(borrador, publicado) {
    var deAca = proyectosDe(borrador);
    var deAlla = proyectosDe(publicado);
    var mapaAlla = porId(deAlla);
    var mapaAca = porId(deAca);

    var nuevos = [], tocados = [];
    deAca.forEach(function (p) {
      if (!p || !p.id) return;
      if (!mapaAlla[p.id]) return nuevos.push(p.id);
      if (huella(p) !== huella(mapaAlla[p.id])) tocados.push(p.id);
    });

    var retirados = ids(deAlla).filter(function (id) { return !mapaAca[id]; });

    /* Sólo el orden RELATIVO de los que están en los dos sitios. Un proyecto
       nuevo al principio desplaza a todos los de detrás, y decir «has movido
       seis» por haber añadido uno convertiría el resumen en ruido: lo que
       importa es si el estudio recolocó algo a mano. */
    var antes = ids(deAlla).filter(function (id) { return !!mapaAca[id]; });
    var ahora = ids(deAca).filter(function (id) { return !!mapaAlla[id]; });
    var movidos = huella(antes) === huella(ahora) ? [] : ahora;

    return {
      nuevos: nuevos, retirados: retirados, tocados: tocados, movidos: movidos,
      /* `version` y `actualizado` quedan fuera a propósito: la versión sube en
         cada guardado, así que siempre difiere de la publicada, y contarla
         haría que `hay` fuese true siempre. */
      hay: !!(nuevos.length || retirados.length || tocados.length || movidos.length)
    };
  }

  function trozo(etiqueta, lista) {
    return lista.length ? etiqueta + ': ' + lista.join(', ') + '.' : '';
  }

  /* Nombra los proyectos en vez de contarlos: «se retiran 3» obliga a
     adivinar cuáles, y esto se lee justo antes de cambiar la web. Lo que no
     cambia no se menciona — «se retiran: (ninguno)» es ruido en la única
     pantalla donde hay que leer con atención. */
  function resumir(cambios) {
    if (!cambios.hay) return 'No hay ningún cambio pendiente de publicar.';
    return [
      trozo('Entran', cambios.nuevos),
      trozo('Se retiran de la web', cambios.retirados),
      trozo('Cambian', cambios.tocados),
      cambios.movidos.length
        ? 'Cambia el orden, y con él la composición del lienzo: '
          + cambios.movidos.join(', ') + '.'
        : ''
    ].filter(function (t) { return !!t; }).join(' ');
  }

  return { entre: entre, resumir: resumir, huella: huella };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **quince** nuevas en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/cambios.js tests/
git commit -m "Decir qué cambia entre el borrador y lo publicado, nombrando los proyectos"
```

---

### Tarea 2: Pedir lo publicado y publicar

**Archivos:**
- Crear: `panel/js/publicacion.js`, `tests/pruebas-publicacion.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Publicacion.publicado(alTerminar)`,
  `window.Publicacion.publicar(version, alTerminar)`.
- Consume: nada.

**Por qué es su propio archivo.** Es la mitad del panel que habla por red, y va
donde vive el resto de eso. `borrador.js` ya tiene 170 líneas de mensajes bien
pensados; meter esto dentro lo acercaría al techo por nada.

**Cómo se prueba.** Doblando `fetch` en el iframe, igual que `subida.js`.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-publicacion.js`:

```js
describeAsync('Publicacion', function () {
  var MODULOS = ['../panel/js/publicacion.js'];

  function redFalsa(guion) {
    var llamadas = [];
    function doble(url, opciones) {
      llamadas.push({ url: url, metodo: (opciones && opciones.method) || 'GET',
                      cache: opciones && opciones.cache });
      var r = guion[llamadas.length] || { estado: 200, cuerpo: {} };
      if (r.corte) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        status: r.estado,
        text: function () {
          return Promise.resolve(r.texto !== undefined ? r.texto : JSON.stringify(r.cuerpo));
        }
      });
    }
    doble.llamadas = llamadas;
    return doble;
  }

  function con(guion, fn) {
    var red = redFalsa(guion);
    return ArnesDom.conDocumento({ scripts: MODULOS, globales: { fetch: red } },
      function (w) { return fn(w, red); });
  }

  function pedirPublicado(w) {
    return new Promise(function (ok) {
      w.Publicacion.publicado(function (datos, error) { ok({ datos: datos, error: error }); });
    });
  }

  function pedirPublicar(w, version) {
    return new Promise(function (ok) {
      w.Publicacion.publicar(version, function (r, error) { ok({ r: r, error: error }); });
    });
  }

  return con({ 1: { estado: 200, cuerpo: { version: 2, proyectos: [] } } }, function (w, red) {
    return pedirPublicado(w).then(function (res) {
      prueba('publicado trae lo que hay en la web', function () {
        igual(res.error, null);
        igual(res.datos.version, 2);
      });

      /* Sin no-cache, el navegador sirve la copia guardada y el resumen dice
         que no ha cambiado nada justo después de publicar. */
      prueba('se pide sin caché, y al mismo archivo que lee la web', function () {
        igual(red.llamadas[0].cache, 'no-cache');
        cierto(red.llamadas[0].url.indexOf('/contenido.json') !== -1, red.llamadas[0].url);
      });
    });
  }).then(function () {
    /* La web sin publicar todavía: contenido.json no existe. No es un error
       que haya que enseñar —es el primer día— y sale como publicado vacío. */
    return con({ 1: { estado: 404, texto: 'No existe esa ruta' } }, function (w) {
      return pedirPublicado(w).then(function (res) {
        prueba('un 404 es «todavía no se ha publicado nada», no un error', function () {
          igual(res.error, null);
          igual(res.datos, { proyectos: [] });
        });
      });
    });
  }).then(function () {
    return con({ 1: { corte: true } }, function (w) {
      return pedirPublicado(w).then(function (res) {
        prueba('la red caída sale como error en castellano', function () {
          igual(res.datos, null);
          cierto(res.error.indexOf('no se ha podido') !== -1, res.error);
        });
      });
    });
  }).then(function () {
    return con({ 1: { estado: 200, cuerpo: { version: 7 } } }, function (w, red) {
      return pedirPublicar(w, 7).then(function (res) {
        prueba('publicar manda POST con la versión', function () {
          igual(red.llamadas[0].metodo, 'POST');
          cierto(red.llamadas[0].url.indexOf('version=7') !== -1, red.llamadas[0].url);
        });

        prueba('un 200 devuelve la versión publicada', function () {
          igual(res.error, null);
          igual(res.r, { version: 7 });
        });
      });
    });
  }).then(function () {
    /* Un 422 no es un fallo del panel: es el Worker diciendo qué le falta al
       contenido. Vuelve como resultado y no como error, igual que el 409 en
       borrador.js, porque tiene salida —arreglarlo— y hay que enseñarlo
       entero. */
    return con({ 1: { estado: 422, cuerpo: { problemas: ['bruma: sin portada'] } } },
      function (w) {
        return pedirPublicar(w, 3).then(function (res) {
          prueba('un 422 vuelve con la lista de problemas, no como error', function () {
            igual(res.error, null);
            igual(res.r.problemas, ['bruma: sin portada']);
          });
        });
      });
  }).then(function () {
    return con({ 1: { estado: 409, cuerpo: { error: 'cambió mientras editabas', guardada: 9 } } },
      function (w) {
        return pedirPublicar(w, 3).then(function (res) {
          prueba('un 409 vuelve como conflicto, con la versión del servidor', function () {
            igual(res.error, null);
            igual(res.r.conflicto, true);
            igual(res.r.guardada, 9);
          });
        });
      });
  }).then(function () {
    return con({ 1: { estado: 500, cuerpo: { error: 'no se pudo publicar' } } }, function (w) {
      return pedirPublicar(w, 3).then(function (res) {
        /* El Worker manda su error en castellano y bien redactado: tirarlo
           para poner el número del estado perdería la única frase que
           explica qué pasó. Mismo criterio que `delServidor` en
           borrador.js. */
        prueba('un 500 enseña la frase del servidor', function () {
          igual(res.r, null);
          cierto(res.error.indexOf('no se pudo publicar') !== -1, res.error);
        });
      });
    });
  }).then(function () {
    /* Access caducado contesta con la página de inicio de sesión, que no es
       JSON. Distinguirlo del resto es lo que permite decir «vuelve a entrar»
       en vez de «algo falló». */
    return con({ 1: { estado: 200, texto: '<!DOCTYPE html><html>…' } }, function (w) {
      return pedirPublicar(w, 3).then(function (res) {
        prueba('una respuesta que no es JSON se dice como sesión caducada', function () {
          igual(res.r, null);
          cierto(res.error.indexOf('sesión') !== -1, res.error);
        });
      });
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="pruebas-publicacion.js"></script>
```

`publicacion.js` **no** hace falta en `test.html` fuera del iframe: sólo se
ejercita dentro de `conDocumento`, como `subida.js`.

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Publicacion is not defined` dentro del iframe.

- [ ] **Paso 3: Escribe `panel/js/publicacion.js`**

```js
/* Lo que el panel necesita de la red para publicar: qué hay publicado ahora, y
   publicar. Aparte de borrador.js porque ése ya va por 170 líneas de mensajes
   bien pensados y no hay razón para acercarlo al techo.

   Mismo reparto que allí: mensaje nuestro y en castellano para quien publica,
   detalle del motor en el registro. `e.message` es texto del motor y en inglés
   —«Failed to fetch», «Unexpected token '<'»—, y no se le enseña a nadie. */
window.Publicacion = (function () {
  var RUTA_PUBLICAR = '/api/publicar';
  /* El mismo archivo que lee la web pública, y no una ruta nueva del Worker:
     contenido.json ya es público por definición, pedirlo al mismo origen no
     necesita permisos, y así el panel ve exactamente lo que ve la web. */
  var RUTA_PUBLICADO = '/contenido.json';

  function registrar(que, detalle) {
    console.error('Publicacion: ' + que + (detalle ? ': ' + detalle : ''));
  }

  function leer(r) {
    return r.text().then(function (texto) {
      try {
        return { estado: r.status, cuerpo: JSON.parse(texto), texto: texto };
      } catch (e) {
        return { estado: r.status, cuerpo: null, texto: texto };
      }
    });
  }

  function publicado(alTerminar) {
    /* `no-cache` no es opcional: sin él el navegador sirve la copia guardada y
       el resumen dice que no ha cambiado nada justo después de publicar. */
    fetch(RUTA_PUBLICADO, { cache: 'no-cache', credentials: 'same-origin' })
      .then(leer)
      .then(function (res) {
        /* Que contenido.json no exista es el primer día, no un fallo: la web
           todavía no se ha publicado nunca. Se contesta un publicado vacío
           para que el resumen diga «entran todos», que es la verdad. */
        if (res.estado === 404) return { proyectos: [] };
        if (res.estado === 200 && res.cuerpo) return res.cuerpo;
        registrar('GET contenido.json respondió ' + res.estado,
          String(res.texto).slice(0, 200));
        throw new Error('no se ha podido leer lo que hay publicado');
      })
      .then(
        function (datos) { alTerminar(datos, null); },
        /* Dos argumentos y no un `.catch()` colgando, igual que en
           borrador.js: así este manejador no ve lo que lance `alTerminar`, y
           un fallo de pintado de quien llama no vuelve disfrazado de error de
           red. */
        function (e) {
          registrar('no se pudo leer lo publicado', e && e.message);
          alTerminar(null, 'No se ha podido leer lo que hay publicado ahora mismo: '
            + 'sin eso no se puede decir qué cambiaría. Recarga la página.');
        }
      );
  }

  function publicar(version, alTerminar) {
    fetch(RUTA_PUBLICAR + '?version=' + encodeURIComponent(version), {
      method: 'POST', credentials: 'same-origin'
    })
      .then(leer)
      .then(function (res) {
        /* Sin cuerpo JSON es la página de inicio de sesión de Access. Aquí sí
           se puede decir con seguridad qué pasó, y por eso el mensaje no
           duda. */
        if (!res.cuerpo) {
          registrar('POST publicar respondió ' + res.estado + ' con algo que no es JSON',
            String(res.texto).slice(0, 200));
          throw new Error('la sesión ha caducado: vuelve a entrar y repítelo');
        }
        if (res.estado === 200) return { version: res.cuerpo.version };
        /* 422 no es un fallo del panel: es el Worker diciendo qué le falta al
           contenido. Vuelve como resultado y no como error, igual que el 409,
           porque tiene salida —arreglarlo— y hay que enseñarlo entero. */
        if (res.estado === 422) return { problemas: res.cuerpo.problemas || [] };
        if (res.estado === 409) {
          return { conflicto: true, guardada: res.cuerpo.guardada };
        }
        registrar('POST publicar respondió ' + res.estado, res.cuerpo.error);
        /* El Worker redacta su error en castellano —un 500 dice «no se pudo
           publicar»—: tirarlo para poner el número del estado perdería la
           única frase que explica qué pasó. */
        throw new Error(res.cuerpo.error || 'el servidor respondió ' + res.estado);
      })
      .then(
        function (resultado) { alTerminar(resultado, null); },
        function (e) {
          if (!(e instanceof Error)) e = new Error(String(e));
          /* Ni llegó, o se cortó, o Access redirigió fuera del origen: los
             tres son el mismo TypeError y no hay forma de separarlos. Los
             mensajes nuestros ya vienen redactados y pasan tal cual. */
          var nuestro = e.message && e.message.indexOf('Failed') === -1
                        && e.message.indexOf('fetch') === -1;
          if (!nuestro) registrar('la petición no llegó a completarse', e.message);
          alTerminar(null, 'No se ha podido publicar: '
            + (nuestro ? e.message
                       : 'no se pudo contactar con el servidor. Puede que la sesión haya '
                       + 'caducado: recarga la página. Si sigue igual, revisa la conexión')
            + '. Nada de lo publicado ha cambiado.');
        }
      );
  }

  return { publicado: publicado, publicar: publicar,
           RUTA_PUBLICAR: RUTA_PUBLICAR, RUTA_PUBLICADO: RUTA_PUBLICADO };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **diez** nuevas en verde. Necesita servidor.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/publicacion.js tests/
git commit -m "Pedir lo publicado y publicar, distinguiendo el 422 y el 409 de un fallo"
```

---

### Tarea 3: La pantalla de publicar

**Archivos:**
- Crear: `panel/js/pantalla-publicar.js`, `tests/pruebas-pantalla-publicar.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.PantallaPublicar.pintar(els, estado, acciones)`.
- Consume: `window.Cambios`, `window.ReglasContenido`.

**Por qué el pintado va aparte de la red.** `pintar` es una función de un estado
a una pantalla: recibe el borrador, lo publicado y lo que haya pasado, y decide
qué se ve. Así se puede probar entera sin doblar nada, que es donde está el
riesgo de verdad —un botón activo cuando no debería—.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-pantalla-publicar.js`:

```js
describe('PantallaPublicar.pintar', function () {
  var HTML =
    '<div><p id="qCambios"></p><p id="qFalta"></p>' +
    '<p id="qAviso" role="status" aria-live="polite"></p>' +
    '<button id="qPublicar" type="button">Publicar</button></div>';

  function elementos(c) {
    return { cambios: c.querySelector('#qCambios'), falta: c.querySelector('#qFalta'),
             aviso: c.querySelector('#qAviso'), boton: c.querySelector('#qPublicar') };
  }

  function p(id) {
    return { id: id, titulo: id, categoria: 'editorial', tipo: 'fotos',
             ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/' + id + '-1500.jpg',
             piezas: [{ url: '/img/' + id + '-3000.jpg' }] };
  }

  function estado(extra) {
    var base = { borrador: { version: 4, proyectos: [p('a')] },
                 publicado: { version: 3, proyectos: [] },
                 hayCambiosSinGuardar: false, aviso: '', bloqueado: false };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  function con(fn, e) {
    return ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      PantallaPublicar.pintar(els, e || estado(), { alPublicar: function () {} });
      return fn(els);
    });
  }

  prueba('enseña qué va a cambiar, con nombres', function () {
    con(function (els) { cierto(els.cambios.textContent.indexOf('a') !== -1,
      els.cambios.textContent); });
  });

  prueba('con todo en orden, el botón está activo', function () {
    con(function (els) { igual(els.boton.disabled, false); });
  });

  /* Decisión 2: el Worker publica el borrador DEL SERVIDOR. Con cambios sin
     guardar, el resumen enseñaría lo que hay en pantalla y saldría publicado
     lo de antes — una mentira que sólo se descubre mirando la web. */
  prueba('con cambios sin guardar no se publica, y dice por qué', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
      cierto(els.falta.textContent.indexOf('guard') !== -1, els.falta.textContent);
    }, estado({ hayCambiosSinGuardar: true }));
  });

  /* Los mismos problemas que el Worker diría con un 422, dichos antes de
     pulsar. Enterarse después es enterarse en un callejón. */
  prueba('un borrador inválido no se publica, y dice qué le falta', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
      cierto(els.falta.textContent.indexOf('portada') !== -1, els.falta.textContent);
    }, estado({ borrador: { version: 4, proyectos: [
      { id: 'a', titulo: 'A', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, piezas: [{ url: '/img/a-3000.jpg' }] }] } }));
  });

  /* Un borrador vacío tampoco: el Worker lo rechaza con «no hay ningún
     proyecto que publicar», y publicar así vaciaría la web entera. */
  prueba('un borrador vacío no se publica', function () {
    con(function (els) {
      igual(els.boton.disabled, true);
    }, estado({ borrador: { version: 4, proyectos: [] } }));
  });

  /* Sin cambios el botón se queda activo a propósito: publicar lo mismo es
     inofensivo, y deshabilitarlo obligaría a explicar la diferencia entre «no
     puedes» y «no hace falta». El resumen ya lo dice. */
  prueba('sin cambios el botón sigue activo, y el resumen lo dice', function () {
    con(function (els) {
      igual(els.boton.disabled, false);
      cierto(els.cambios.textContent.indexOf('ningún cambio') !== -1, els.cambios.textContent);
    }, estado({ publicado: { version: 3, proyectos: [p('a')] } }));
  });

  /* Decisión 4: el mismo criterio que al guardar. Si el botón sigue activo,
     volver a pulsarlo manda la misma versión vieja y el servidor vuelve a
     contestar 409, en bucle, sin más salida que recargar. */
  prueba('bloqueado tras un conflicto, el botón no vuelve', function () {
    con(function (els) { igual(els.boton.disabled, true); },
        estado({ bloqueado: true }));
  });

  prueba('el aviso se enseña donde se lee', function () {
    con(function (els) { igual(els.aviso.textContent, 'Publicado.'); },
        estado({ aviso: 'Publicado.' }));
  });

  prueba('pulsar llama a alPublicar', function () {
    var veces = 0;
    ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      els.boton.click();
      igual(veces, 1);
    });
  });

  /* Repintar sobre nodos que vienen del HTML y no se reconstruyen apilaría un
     oyente por pintado, y a la tercera visita a la pantalla un clic
     publicaría tres veces. */
  prueba('repintar no apila el oyente del botón', function () {
    var veces = 0;
    ArnesDom.conElemento(HTML, function (c) {
      var els = elementos(c);
      PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      PantallaPublicar.pintar(els, estado(), { alPublicar: function () { veces++; } });
      els.boton.click();
      igual(veces, 1);
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/pantalla-publicar.js"></script>
```
```html
<script src="pruebas-pantalla-publicar.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `PantallaPublicar is not defined`.

- [ ] **Paso 3: Escribe `panel/js/pantalla-publicar.js`**

```js
/* La pantalla de publicar: qué cambia, qué falta y el botón. Sólo pinta —la red
   es de publicacion.js— porque así se puede probar entera sin doblar nada, y lo
   que más falta hace comprobar aquí es justo lo que no se ve: que el botón esté
   apagado cuando tiene que estarlo. */
window.PantallaPublicar = (function () {

  /* Los mismos problemas que el Worker contestaría con un 422, dichos antes de
     pulsar. Se añade el del borrador vacío porque `validar` no lo da —lo pone
     `problemasDelBorrador` en el Worker— y publicar un borrador sin proyectos
     vaciaría la web entera. */
  function problemasDe(borrador) {
    var lista = (borrador && borrador.proyectos) || [];
    var problemas = window.ReglasContenido.validar(borrador, window.ReglasContenido.CATEGORIAS);
    if (!lista.length) problemas = problemas.concat(['no hay ningún proyecto que publicar']);
    return problemas;
  }

  function pintar(els, estado, acciones) {
    var cambios = window.Cambios.entre(estado.borrador, estado.publicado);
    els.cambios.textContent = window.Cambios.resumir(cambios);

    var problemas = problemasDe(estado.borrador);
    var impedimentos = [];
    /* Primero lo que se arregla sin salir de aquí: guardar es un botón que ya
       está en pantalla, y arreglar una ficha es irse a otra. */
    if (estado.hayCambiosSinGuardar) {
      impedimentos.push('tienes cambios sin guardar, y se publica lo guardado: '
        + 'guárdalos antes');
    }
    if (problemas.length) {
      impedimentos.push('el contenido no se puede publicar todavía — '
        + problemas.join('; '));
    }

    els.falta.textContent = impedimentos.length
      ? 'Antes de publicar: ' + impedimentos.join('. ') + '.'
      : '';
    els.aviso.textContent = estado.aviso || '';

    /* Sin cambios el botón NO se apaga: publicar lo mismo es inofensivo, y
       apagarlo obligaría a explicar la diferencia entre «no puedes» y «no hace
       falta». El resumen ya dice que no hay nada. */
    els.boton.disabled = !!(impedimentos.length || estado.bloqueado);

    /* `onclick` y no addEventListener: este nodo viene del HTML de la página y
       no se reconstruye al repintar, así que un oyente por pintado se apilaría
       y a la tercera visita un clic publicaría tres veces. Asignar reemplaza. */
    els.boton.onclick = function () { acciones.alPublicar(); };
  }

  return { pintar: pintar, problemasDe: problemasDe };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **diez** nuevas en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/pantalla-publicar.js tests/
git commit -m "Pintar qué cambia y qué falta, y apagar el botón cuando publicar mentiría"
```

---

### Tarea 4: Engancharla al panel

**Archivos:**
- Modificar: `panel/index.html`, `panel/css/panel.css`, `panel/js/panel.js`,
  `tests/pruebas-panel.js`

**Interfaces:**
- Consume: `window.PantallaPublicar`, `window.Publicacion`, `window.Panel.ir`.

- [ ] **Paso 1: Las pruebas que fallan**

Añade a `tests/pruebas-panel.js`. `HTML` crece con la sección de publicar y
`MODULOS` con los tres archivos nuevos; el doble de `Publicacion` se inyecta como
global, igual que el de `Borrador`.

```js
describeAsync('panel.js · publicar', function () {

  function publicacionFalsa(o) {
    var opciones = o || {};
    var doble = {
      publicados: [],
      publicado: function (cb) { cb(opciones.publicado || { proyectos: [] }, null); },
      publicar: function (version, cb) {
        doble.publicados.push(version);
        cb(opciones.respuesta || { version: version }, opciones.error || null);
      }
    };
    return doble;
  }

  function listo() {
    return { version: 4, proyectos: [
      { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/a-1500.jpg',
        piezas: [{ url: '/img/a-3000.jpg' }] } ] };
  }

  function conPanel(opciones, fn) {
    var pub = publicacionFalsa(opciones.publicacion);
    return ArnesDom.conDocumento({
      html: HTML, scripts: MODULOS,
      globales: { Borrador: borradorFalso({ datos: opciones.datos }),
                  Publicacion: pub,
                  confirm: opciones.confirm || function () { return true; } }
    }, function (w, d) { return fn(w, d, pub); });
  }

  return conPanel({ datos: listo() }, function (w, d, pub) {
    w.Panel.ir('publicar');

    prueba('la pantalla de publicar se ve y las otras no', function () {
      igual(d.getElementById('pantallaPublicar').hidden, false);
      igual(d.getElementById('pantallaLista').hidden, true);
    });

    prueba('el resumen dice que entra el proyecto', function () {
      cierto(d.getElementById('qCambios').textContent.indexOf('bruma') !== -1,
        d.getElementById('qCambios').textContent);
    });

    prueba('publicar manda la versión del borrador guardado', function () {
      d.getElementById('qPublicar').click();
      igual(pub.publicados, [4]);
    });

    prueba('y lo dice cuando sale bien', function () {
      cierto(d.getElementById('qAviso').textContent.indexOf('ublicad') !== -1,
        d.getElementById('qAviso').textContent);
    });
  }).then(function () {
    /* Decisión 3: se pregunta SIEMPRE. Es la única acción del panel que se ve
       desde fuera y la única sin deshacer. */
    return conPanel({ datos: listo(), confirm: function () { return false; } },
      function (w, d, pub) {
        w.Panel.ir('publicar');
        d.getElementById('qPublicar').click();
        prueba('si se dice que no, no se publica', function () {
          igual(pub.publicados, []);
        });
      });
  }).then(function () {
    return conPanel({ datos: listo(),
                      publicacion: { respuesta: { conflicto: true, guardada: 9 } } },
      function (w, d) {
        w.Panel.ir('publicar');
        d.getElementById('qPublicar').click();
        /* Decisión 4: el mismo criterio que al guardar. Reintentar mandaría la
           misma versión vieja y volvería a chocar, en bucle. */
        prueba('un conflicto apaga el botón hasta recargar', function () {
          igual(d.getElementById('qPublicar').disabled, true);
        });
        prueba('y el aviso dice por dónde va el servidor', function () {
          cierto(d.getElementById('qAviso').textContent.indexOf('9') !== -1,
            d.getElementById('qAviso').textContent);
        });
      });
  }).then(function () {
    return conPanel({ datos: listo(),
                      publicacion: { respuesta: { problemas: ['bruma: sin portada'] } } },
      function (w, d) {
        w.Panel.ir('publicar');
        d.getElementById('qPublicar').click();
        /* Un 422 que el panel no había previsto —porque valida con las mismas
           reglas, pero el Worker manda— se enseña entero. Que el botón siga
           activo es lo correcto: se arregla y se reintenta. */
        prueba('un 422 se enseña con sus problemas', function () {
          cierto(d.getElementById('qAviso').textContent.indexOf('sin portada') !== -1,
            d.getElementById('qAviso').textContent);
          igual(d.getElementById('qPublicar').disabled, false);
        });
      });
  });
});
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: la pantalla de publicar no existe.

- [ ] **Paso 3: El marcado y el código**

En `panel/index.html`:

```html
    <section id="pantallaPublicar" hidden>
      <button id="qVolver" type="button">‹ Volver a los proyectos</button>
      <h2>Publicar</h2>
      <!-- La frase va en el marcado y no en el JS porque no cambia nunca, y
           porque es lo que hay que leer antes que ninguna otra cosa de esta
           pantalla. -->
      <p class="publicar-que-es">Publicar copia lo guardado sobre la web que
        ven los clientes. No se puede deshacer desde aquí.</p>
      <p id="qCambios" class="publicar-cambios"></p>
      <p id="qFalta" class="problemas"></p>
      <p id="qAviso" role="status" aria-live="polite" class="aviso"></p>
      <button id="qPublicar" type="button">Publicar ahora</button>
    </section>
```

Y el enlace desde la lista, junto al botón de guardar:

```html
    <button id="irAPublicar" type="button">Publicar…</button>
```

Los scripts nuevos, después de `lista.js` y antes de `panel.js`:

```html
  <script src="js/cambios.js"></script>
  <script src="js/publicacion.js"></script>
  <script src="js/pantalla-publicar.js"></script>
```

En `panel/js/panel.js`, la rama de `ir` y el manejador. Si esto le hace cruzar
las 300 líneas, lo que sale a su propio archivo es este bloque entero, no los
comentarios:

```js
  var publicado = null, avisoPublicar = '', bloqueadoPublicar = false;

  function repintarPublicar() {
    window.PantallaPublicar.pintar(elsPublicar, {
      borrador: trabajo, publicado: publicado,
      hayCambiosSinGuardar: hayCambios(),
      aviso: avisoPublicar, bloqueado: bloqueadoPublicar
    }, { alPublicar: publicarAhora });
  }

  function publicarAhora() {
    /* Se pregunta siempre, sin distinguir casos: es la única acción del panel
       que se ve desde fuera y la única sin deshacer. Distinguir casos serían
       dos caminos, y el que se usa menos es el que se rompe. */
    if (!window.confirm('Se va a copiar lo guardado sobre la web pública. '
        + '¿Publicar ahora?')) return;

    avisoPublicar = 'Publicando…';
    repintarPublicar();
    window.Publicacion.publicar(trabajo.version, function (r, error) {
      if (error) { avisoPublicar = error; return repintarPublicar(); }
      if (r.conflicto) {
        /* El mismo criterio que al guardar, y por el mismo motivo: reintentar
           mandaría la misma versión vieja, el servidor volvería a contestar
           409, y así en bucle. Tampoco se actualiza la versión al vuelo: eso
           haría que el segundo intento "funcionara" publicando por encima del
           trabajo de la otra persona. */
        bloqueadoPublicar = true;
        avisoPublicar = 'Alguien ha guardado mientras mirabas esto (el servidor va por la '
          + 'versión ' + r.guardada + '). Publicar ahora pondría en la web algo que no es '
          + 'lo que estás viendo: por eso el botón se ha desactivado. Recarga la página.';
        return repintarPublicar();
      }
      if (r.problemas) {
        /* El panel valida con las mismas reglas, así que llegar aquí significa
           que se le escapó algo. Se enseña entero: es la lista del Worker, que
           es quien manda. */
        avisoPublicar = 'El servidor no ha podido publicarlo: ' + r.problemas.join('; ') + '.';
        return repintarPublicar();
      }
      /* Lo publicado pasa a ser lo que se acaba de mandar, sin volver a pedir
         contenido.json: en la red de Cloudflare la copia recién escrita puede
         tardar en verse, y volver a pedirla diría que todavía falta por
         publicar justo lo que se acaba de publicar. */
      publicado = JSON.parse(JSON.stringify(trabajo));
      avisoPublicar = 'Publicado. La web ya enseña esto (versión ' + r.version + ').';
      repintarPublicar();
    });
  }
```

Y en `ir`, la rama nueva. Lo publicado se pide **cada vez que se entra**: entre
dos visitas puede haber publicado la otra persona.

```js
    if (pantalla === 'publicar') {
      abierto = null;
      window.Pantallas.mostrar(pantallas, 'pantallaPublicar');
      location.hash = window.Rutas.hacia('publicar');
      avisoPublicar = '';
      repintarPublicar();
      return window.Publicacion.publicado(function (datos, error) {
        publicado = datos;
        if (error) avisoPublicar = error;
        repintarPublicar();
      });
    }
```

En `panel/css/panel.css`:

```css
/* La frase que explica qué hace el botón se lee antes que nada: es la única
   pantalla del panel donde una pulsación cambia lo que ven los clientes. */
.publicar-que-es { border-left: 3px solid #FFFF00; padding-left: .75rem; }
.publicar-cambios { white-space: pre-line; }
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **ocho** nuevas en verde, y las anteriores intactas.

```bash
wc -l panel/js/*.js
```

Ninguno pasa de 300.

- [ ] **Paso 5: Commit**

```bash
git add panel/ tests/
git commit -m "Enganchar publicar al panel, preguntando siempre y apagando el botón tras un choque"
```

---

### Tarea 5: Comprobación manual, desplegada

**Esta tarea la ejecuta Ángel, no el asistente.** Despliegue:

```bash
git archive HEAD | tar -x -C <tmp>
wrangler deploy --config worker/estatico/wrangler.toml --assets <tmp>
```

| # | Qué se mira | Qué tiene que pasar |
|---|---|---|
| 1 | Entrar en Publicar sin tocar nada | Dice que no hay ningún cambio |
| 2 | Cambiar una ficha, guardar, entrar | Nombra ese proyecto como cambiado |
| 3 | Crear un proyecto sin fotos y entrar | Botón apagado, y dice que le faltan piezas y portada |
| 4 | Cambiar algo y entrar **sin guardar** | Botón apagado, y dice que hay que guardar |
| 5 | Guardar y volver a entrar | Botón encendido |
| 6 | Pulsar y decir que no | No pasa nada |
| 7 | Pulsar y decir que sí | Dice «Publicado» con la versión |
| 8 | Abrir la web en otra pestaña y recargar | Se ve el cambio. **Criterio de aceptación 2** |
| 9 | Borrar un proyecto, guardar, **no publicar**, mirar la web | Sigue estando. **Criterio de aceptación 3** |
| 10 | Publicar, y mirar otra vez | Ya no está |
| 11 | Reordenar, guardar, entrar en Publicar | Dice que cambia el orden y la composición |
| 12 | Publicar y mirar el lienzo | Los proyectos están recolocados |
| 13 | Dos pestañas: guardar en la A, publicar en la B | La B da el conflicto, apaga el botón y nombra la versión. **Criterio de aceptación 9** |
| 14 | Recargar la B y volver a publicar | Funciona |
| 15 | Toda la pantalla **sólo con teclado** | Se llega al botón y se pulsa con Enter |

- [ ] **Paso 1: Desplegar y recorrer la tabla**
- [ ] **Paso 2: Anotar lo que no cuadre y volver a la tarea que lo cubra**

---

### Tarea 6: Verificación antes de decir «hecho»

- [ ] **Paso 1: `superpowers:verification-before-completion`**

- [ ] **Paso 2: Las tres suites**

```bash
node tests/prueba-borrador.js          # 52/52
cd worker && node --test               # 101/101
# y el arnés del navegador, en verde entero
```

- [ ] **Paso 3: El techo de líneas**

```bash
wc -l js/*.js panel/js/*.js worker/src/*.js worker/estatico/*.js | sort -rn | head -20
```

- [ ] **Paso 4: Los criterios de aceptación que cierra este bloque**

| # | Criterio | Dónde se comprueba |
|---|---|---|
| 2 | Un proyecto creado aparece en la web **después** de publicar | Tarea 5, fila 8 |
| 3 | Borrar no lo quita de la web hasta publicar | Tarea 5, fila 9 |
| 9 | Dos sesiones a la vez: la segunda recibe un conflicto y no pierde nada | Tarea 5, fila 13, y `pruebas-panel.js · publicar` |

- [ ] **Paso 5: Commit final, si quedó algo suelto**

---

## Lo que queda fuera, y sigue quedando

- **El vídeo por Vimeo** es el bloque 4. Aquí `tipo: 'video'` sigue sin
  crearse desde el panel.
- **Despublicar** no existe: el borrador ya es el nuevo, así que republicar el
  contenido anterior pediría guardar un histórico, y eso es una decisión de
  diseño que nadie ha tomado.
- **Limpiar las imágenes huérfanas** de R2 sigue sin ruta. El bloque 3a lo dejó
  anotado: hace falta un `DELETE /api/imagen`.
