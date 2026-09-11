# El botón de ficha y la tira de miniaturas en el visor móvil — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea a tarea. Los pasos llevan casilla (`- [ ]`) para ir marcándolos.

**Meta:** Que en el visor móvil se pueda pedir la ficha de un trabajo con un botón, y saltar a cualquier pieza con una tira de miniaturas.

**Arquitectura:** Dos controles nuevos en el HUD del visor móvil. Ninguno de los dos pinta nada: los dos llaman a `Router.ir` y dejan que el suscriptor de siempre repinte, que es la regla que ya sostiene todo el visor. La decisión de a qué parada lleva el botón de ficha es una función pura nueva en `js/movil-recorrido.js`, el módulo dueño del eje vertical; la tira es un módulo nuevo, `js/movil-tira.js`, porque `js/movil-visor.js` ya está en 390 líneas.

**Tecnologías:** JavaScript ES5 sin librerías, IIFE con un `window.X` por módulo. CSS a mano en `css/luque.css`. Pruebas en `tests/test.html` con los arneses propios del repositorio (`tests/arnes.js` para lo puro, `tests/arnes-dom.js` para lo que toca el DOM).

**Spec:** `docs/superpowers/specs/2026-09-11-movil-ficha-y-tira-design.md`

## Restricciones globales

- **Sin dependencias externas.** Nada de `npm`, nada de CDN, nada de `url()` a un archivo externo desde el CSS. La regla está en `docs/estado-conocido.md`, sección «La regla que más veces se ha roto».
- **ES5.** Nada de `const`, `let`, arrow functions, template literals ni `class`. Todo el código del sitio es `var` y `function`. Mira cualquier `js/*.js` antes de escribir.
- **Techo de 300 líneas por archivo** en `js/`. `js/movil-visor.js` ya lo incumple (390) y este plan lo sube; eso se declara en la Tarea 5, no se esconde. Ningún archivo NUEVO puede pasar de 300.
- **Comentarios en castellano**, explicando el PORQUÉ y no el qué, en el tono de los ficheros de al lado. Un comentario que repite lo que hace la línea siguiente sobra.
- **`js/router.js` es la única fuente de verdad** sobre qué está abierto. Ningún control nuevo pinta por su cuenta: navega y deja que `MovilVisor.aplicar` repinte.
- **Los módulos puros no guardan estado entre llamadas.** `MovilRecorrido` recibe todo por argumento.
- **La trampa del arnés:** `prueba()` es SÍNCRONA. Si la función que le pasas devuelve una promesa, la prueba sale en verde sin comprobar nada. Ninguna prueba de este plan es asíncrona, así que no debe aparecer ni un `return` de promesa dentro de `prueba(...)`.
- **Un `<script>` nuevo va en DOS sitios**: `index.html` y `tests/test.html`. La suite en verde NO demuestra que esté en `index.html`, porque `tests/test.html` carga los suyos por su cuenta.

## Cómo se ejecutan las pruebas

Desde la raíz del repositorio, en una terminal aparte:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000/tests/test.html` en un navegador. La última línea del informe dice «N pasan, M fallan». Antes de empezar, apúntala: hoy son **491 comprobaciones** (medido el 2026-09-11 ejecutando la suite; `docs/estado-conocido.md` dice 468 y está desactualizado — corregirlo es parte de la Tarea 5).

Sin navegador a mano, la misma suite se ejecuta sin ventana y se lee de una
sola línea (el servidor tiene que estar levantado en otra terminal):

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu --no-sandbox --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:8000/tests/test.html" 2>/dev/null | grep -oE "[0-9]+ pasan, [0-9]+ fallan" | tail -1
```

Para ver QUÉ falla y no sólo cuántas, cambiar el `grep` final por
`grep -oE "FALLA[^<]*"`.

## Estructura de ficheros

| Fichero | Responsabilidad | Estado |
|---|---|---|
| `js/movil-recorrido.js` | El eje vertical: qué paradas tiene un proyecto y cómo se salta de una a otra. Puro. | se amplía con `alternarFicha` |
| `js/movil-hud.js` | Los controles sobre la foto: qué se enseña, cuándo se duerme. | gana el botón de ficha |
| `js/movil-tira.js` | La tira de miniaturas: construirla, marcar la actual, centrarla. | **nuevo** |
| `js/movil-visor.js` | El marco del visor móvil: el estado, el router, la escena, los gestos. | cablea los dos |
| `index.html` | El marcado y el orden de los `<script>`. | marcado nuevo |
| `css/luque.css` | Todo el estilo. | reglas nuevas |
| `tests/pruebas-movil-recorrido.js` | Pruebas de `MovilRecorrido`. | casos nuevos |
| `tests/pruebas-movil-hud.js` | Pruebas de `MovilHud`. | casos nuevos |
| `tests/pruebas-movil-visor.js` | Pruebas de `MovilVisor`. | casos nuevos |
| `tests/pruebas-movil-tira.js` | Pruebas de `MovilTira`. | **nuevo** |
| `tests/test.html` | El corredor de la suite. | dos `<script>` nuevos |
| `docs/estado-conocido.md` | Lo que conviene saber antes de tocar el código. | se actualiza |

---

## Tarea 1: `MovilRecorrido.alternarFicha`

La función pura que decide a qué parada lleva el botón. No toca el DOM, no conoce el router, no guarda nada.

**Ficheros:**
- Modificar: `js/movil-recorrido.js` (añadir la función y exportarla)
- Modificar: `tests/pruebas-movil-recorrido.js` (añadir una sección al final)

**Interfaces:**
- Consume: `paradasDe(orden, id)` y `en(proyecto, pieza)`, las dos ya privadas dentro de `js/movil-recorrido.js`.
- Produce: `MovilRecorrido.alternarFicha(estado, orden, recordada)` → `{proyecto, pieza}`.
  - `estado`: `{proyecto: string, pieza: number|null|'ficha'}`
  - `orden`: array de `{id: string, piezas: number}` — `piezas` es un NÚMERO, no un array
  - `recordada`: `number|null|undefined` — la última parada que no era la ficha
  - Devuelve un `{proyecto, pieza}` nuevo. Si el proyecto no está en `orden`, devuelve `estado` tal cual.

- [x] **Paso 1: Escribir las pruebas que fallan**

Al FINAL de `tests/pruebas-movil-recorrido.js`, dentro del `describe` que ya existe (justo antes del `});` final del fichero), añadir:

```js
  // ---- El botón de ficha ------------------------------------------

  /* El botón de la Tarea 2 no decide nada por su cuenta: le pregunta aquí.
     La función es pura y recibe la pieza recordada como argumento, porque
     este módulo no guarda nada entre llamadas — quien recuerda es
     `MovilVisor`. */

  prueba('desde una pieza, el botón lleva a la ficha', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 3), ORDEN, null),
          en('bruma', 'ficha'));
  });

  prueba('desde la ficha, el botón vuelve a la pieza recordada', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 3),
          en('bruma', 3));
  });

  /* El caso del enlace en frío a `#/bruma/ficha`: nunca hubo pieza anterior,
     así que no hay nada que recordar. Se cae a la primera parada, que es lo
     que ya hace `desdeRuta` con una pieza que no existe: conserva el
     proyecto, que es lo que el enlace sí traía bien. */
  prueba('sin pieza recordada vuelve a la primera parada', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, null),
          en('bruma', 1));
  });

  /* `bruma` tiene 8 piezas. Una recordada de 9 sería basura —de una lista
     anterior, de una URL a mano— y llevaría a una parada que no existe. */
  prueba('una recordada que no es parada de ese proyecto se ignora', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 9),
          en('bruma', 1));
  });

  /* `indexOf('ficha')` NO es -1: 'ficha' es una parada del eje. Sin la guarda
     explícita, una recordada de 'ficha' devolvería la ficha estando ya en la
     ficha y el botón no haría nada, que es exactamente el callejón sin
     salida que este bloque viene a arreglar. */
  prueba('una recordada de «ficha» no deja el botón muerto', function () {
    igual(MovilRecorrido.alternarFicha(en('bruma', 'ficha'), ORDEN, 'ficha'),
          en('bruma', 1));
  });

  /* En un proyecto de vídeo la primera parada es `null` —el propio vídeo—, no
     la pieza 1, que no existe. */
  prueba('en un vídeo, volver de la ficha lleva al vídeo', function () {
    igual(MovilRecorrido.alternarFicha(en('reflejo', 'ficha'), ORDEN, null),
          en('reflejo', null));
  });

  prueba('un proyecto que no está en el orden no se mueve', function () {
    igual(MovilRecorrido.alternarFicha(en('fantasma', 2), ORDEN, null),
          en('fantasma', 2));
  });
```

- [x] **Paso 2: Ejecutar para verificar que fallan**

Recargar `http://localhost:8000/tests/test.html`.
Esperado: siete líneas nuevas en rojo en la sección `MovilRecorrido`, todas con `MovilRecorrido.alternarFicha is not a function`.

- [x] **Paso 3: Escribir la implementación mínima**

En `js/movil-recorrido.js`, después de la función `mover` y antes del `return`, añadir:

```js
  /* El atajo del botón de ficha. La ficha es la ÚLTIMA parada del eje, así que
     llegar a ella deslizando cuesta tantos gestos como piezas tenga el
     proyecto: diez en `la-boquerona`. Esto la pone a un toque, en los dos
     sentidos.

     `recordada` llega de fuera porque este módulo es puro y no guarda nada
     entre llamadas; quien la recuerda es `MovilVisor`.

     La guarda contra `recordada === 'ficha'` no es paranoia: `indexOf('ficha')`
     NO es -1, porque 'ficha' es una parada del eje como cualquier otra. Sin
     ella, volver de la ficha devolvería la ficha y el botón quedaría muerto
     justo en el sitio donde más hace falta. */
  function alternarFicha(estado, orden, recordada) {
    var ps = paradasDe(orden, estado.proyecto);
    if (!ps) return estado;
    if (estado.pieza !== 'ficha') return en(estado.proyecto, 'ficha');
    var valida = recordada !== 'ficha' && ps.indexOf(recordada) !== -1;
    return en(estado.proyecto, valida ? recordada : ps[0]);
  }
```

Y añadir `alternarFicha: alternarFicha,` al objeto que devuelve el módulo, después de `mover: mover` (añadiendo la coma que haga falta).

- [x] **Paso 4: Ejecutar para verificar que pasan**

Recargar `http://localhost:8000/tests/test.html`.
Esperado: las siete en verde, y el total sube de 491 a **498 pasan, 0 fallan**.

- [x] **Paso 5: Commit**

```bash
git add js/movil-recorrido.js tests/pruebas-movil-recorrido.js
git commit -m "MovilRecorrido.alternarFicha: el atajo a la ficha y la vuelta"
```

---

## Tarea 2: El botón de ficha, de punta a punta

Va entera porque el botón no sirve de nada a medias: el marcado, el módulo que lo escucha, el cableado que decide a dónde lleva y el estilo son un solo entregable que un revisor acepta o rechaza junto.

**Ficheros:**
- Modificar: `index.html` (el `<button>` nuevo y la referencia en `MovilVisor.init`)
- Modificar: `css/luque.css` (la pastilla nueva entra en las reglas que ya existen)
- Modificar: `js/movil-hud.js` (la referencia, el oyente y el `aria-pressed`)
- Modificar: `js/movil-visor.js` (`piezaRecordada` y el cuarto callback)
- Modificar: `tests/pruebas-movil-hud.js` (marcado y pruebas)
- Modificar: `tests/pruebas-movil-visor.js` (marcado y pruebas)

**Interfaces:**
- Consume: `MovilRecorrido.alternarFicha(estado, orden, recordada)` de la Tarea 1. `MovilRecorrido.aRuta(estado)` → `{tipo, valor, pieza}`, que ya existe. `Router.ir(tipo, valor, pieza)`.
- Produce:
  - `MovilHud.init(elementos, alCategoria, alCerrarVisor, alFicha)` — **cuarto argumento nuevo, obligatorio**, función sin argumentos.
  - `elementos` gana una clave obligatoria: `ficha`, el `<button>`.
  - `MovilVisor.init(refs, proyectos)` — `refs` gana la clave `ficha`. Pasa de ocho referencias a nueve.

- [x] **Paso 1: Escribir las pruebas que fallan — el HUD**

En `tests/pruebas-movil-hud.js`, en `HUD_MARCADO`, añadir el botón **después** de la línea de `hudCats` y antes de la de `hudCerrar`:

```js
    '    <button id="hudFicha" type="button" aria-pressed="false"></button>' +
```

En el objeto `refs` de `conHud`, añadir después de la línea de `cats`:

```js
        ficha:    caja.querySelector('#hudFicha'),
```

Y sustituir la línea `MovilHud.init(refs, function () {}, function () {});` por:

```js
      var avisos = [];
      MovilHud.init(refs, function () {}, function () {},
                    function () { avisos.push('ficha'); });
      refs.avisos = avisos;
```

Luego, al final del mismo `describe`, añadir:

```js
  /* El botón se llama «Ficha» siempre; lo que cambia es `aria-pressed`, igual
     que el desplegable de al lado usa `aria-expanded`. Cambiar el rótulo
     haría bailar el ancho de la pastilla en cada parada. */
  prueba('en una pieza, el botón de ficha no está pulsado', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      return refs.ficha.getAttribute('aria-pressed');
    }), 'false');
  });

  prueba('en la ficha, el botón de ficha está pulsado', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 'ficha', 3);
      return refs.ficha.getAttribute('aria-pressed');
    }), 'true');
  });

  /* Un proyecto de vídeo para en `null`, que no es la ficha. */
  prueba('en el vídeo, el botón de ficha no está pulsado', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, null, 0);
      return refs.ficha.getAttribute('aria-pressed');
    }), 'false');
  });

  /* El HUD no decide a dónde lleva el botón: avisa, y `MovilVisor` decide. */
  prueba('pulsar el botón de ficha avisa a quien cableó el HUD', function () {
    igual(conHud(function (refs) {
      MovilHud.pintar(HUD_PROYECTO, 2, 3);
      refs.ficha.click();
      return refs.avisos;
    }), ['ficha']);
  });
```

- [x] **Paso 2: Ejecutar para verificar que fallan**

Recargar `http://localhost:8000/tests/test.html`.
Esperado: rojo en la sección `MovilHud` (las cuatro nuevas), y además **la sección `MovilVisor` en rojo**, porque `MovilVisor.init` llama a `MovilHud.init` sin el cuarto callback y sin `refs.ficha`. Los dos rojos son esperados; el primero lo cierra el Paso 3 y el segundo el Paso 6.

- [x] **Paso 3: Escribir la implementación — el HUD**

En `js/movil-hud.js`, sustituir la línea de las variables de callback por:

```js
  var alElegirCategoria = null, alCerrar = null, alFicha = null;
```

Sustituir `init` entero por:

```js
  function init(elementos, alCategoria, alCerrarVisor, alPedirFicha) {
    refs = elementos;
    alElegirCategoria = alCategoria;
    alCerrar = alCerrarVisor;
    alFicha = alPedirFicha;
    refs.cerrar.addEventListener('click', function () { alCerrar(); });
    /* El botón avisa y nada más. A qué parada lleva lo decide
       `MovilRecorrido.alternarFicha`, y quién la llama es `MovilVisor`: este
       módulo no conoce el recorrido ni el router, igual que no los conoce para
       el desplegable de categorías. */
    refs.ficha.addEventListener('click', function () { alFicha(); });
    refs.cat.addEventListener('click', function () {
      refs.cats.hidden = !refs.cats.hidden;
      refs.cat.setAttribute('aria-expanded', refs.cats.hidden ? 'false' : 'true');
      despertar();
    });
  }
```

En `pintar`, después de la línea del contador, añadir:

```js
    /* `aria-pressed` y no un cambio de rótulo: el botón se llama «Ficha»
       siempre, así la pastilla no cambia de ancho al entrar y salir. Es lo
       mismo que hace el desplegable de al lado con `aria-expanded`. */
    refs.ficha.setAttribute('aria-pressed', pieza === 'ficha' ? 'true' : 'false');
```

- [x] **Paso 4: Escribir las pruebas que fallan — el visor**

En `tests/pruebas-movil-visor.js`, en `MV_MARCADO`, añadir el botón después de `<ul id="mvCats"></ul>` y antes de `<button id="mvCerrar"></button>`:

```js
  '<button id="mvFicha" aria-pressed="false"></button>' +
```

En `mvRefsDesde`, añadir después de la línea de `cats`:

```js
    ficha:    caja.querySelector('#mvFicha'),
```

Y al final del fichero, una sección nueva:

```js
/* El botón de ficha cableado: lo que se fija aquí no es a dónde lleva —eso es
   de `MovilRecorrido.alternarFicha` y tiene sus propias pruebas— sino que
   `MovilVisor` recuerde la pieza correcta y llame al router con ella. */
describe('MovilVisor — el botón de ficha', function () {

  function conRuta(ruta, fn) {
    return conVisorSobre(MV_PROYECTOS, function (refs) {
      var antesMovil = window.Movil, antesRouter = window.Router;
      var ido = [];
      window.Movil = { actual: function () { return 'movil'; } };
      window.Router = { ir: function (t, v, p) { ido.push([t, v, p]); } };
      try {
        MovilVisor.aplicar(ruta);
        return fn(refs, ido);
      } finally {
        window.Movil = antesMovil;
        window.Router = antesRouter;
      }
    });
  }

  function enProyecto(valor, pieza) {
    return { tipo: 'proyecto', valor: valor, pieza: pieza };
  }

  prueba('desde la pieza 2, el botón pide la ficha', function () {
    igual(conRuta(enProyecto('niebla', 2), function (refs, ido) {
      refs.ficha.click();
      return ido;
    }), [['proyecto', 'niebla', 'ficha']]);
  });

  /* La razón de ser de `piezaRecordada`: volver donde estabas y no al
     principio. Se llega a la ficha por el router, igual que llegaría un
     deslizamiento, para que la prueba recorra el mismo camino que el dedo. */
  prueba('desde la ficha, el botón vuelve a la pieza de la que saliste', function () {
    igual(conRuta(enProyecto('niebla', 2), function (refs, ido) {
      MovilVisor.aplicar(enProyecto('niebla', 'ficha'));
      refs.ficha.click();
      return ido;
    }), [['proyecto', 'niebla', 2]]);
  });

  /* El enlace en frío: se entra directamente por la ficha, así que no hay
     pieza que recordar y se cae a la primera. */
  prueba('entrando por la ficha, el botón lleva a la primera pieza', function () {
    igual(conRuta(enProyecto('niebla', 'ficha'), function (refs, ido) {
      refs.ficha.click();
      return ido;
    }), [['proyecto', 'niebla', 1]]);
  });

  /* Lo que recuerda es de ESTE proyecto. Sin olvidar al cambiar, salir de la
     pieza 3 de `niebla`, pasar a `oleaje` y pedir su ficha te devolvería a una
     pieza 3 que en `oleaje` no existe. */
  prueba('cambiar de proyecto olvida la pieza recordada', function () {
    igual(conRuta(enProyecto('niebla', 3), function (refs, ido) {
      MovilVisor.aplicar(enProyecto('oleaje', null));
      MovilVisor.aplicar(enProyecto('oleaje', 'ficha'));
      refs.ficha.click();
      return ido;
    }), [['proyecto', 'oleaje', null]]);
  });

  prueba('el botón no hace nada con el visor cerrado', function () {
    igual(conRuta({ tipo: 'todos', valor: null, pieza: null }, function (refs, ido) {
      refs.ficha.click();
      return ido;
    }), []);
  });
});
```

- [x] **Paso 5: Ejecutar para verificar que fallan**

Recargar. Esperado: la sección `MovilHud` ya en verde (el Paso 3 la cerró), y las cinco nuevas de `MovilVisor` en rojo — la primera porque `MovilHud.init` recibe `alFicha` en `undefined` y pulsar lanza `alFicha is not a function`.

- [x] **Paso 6: Escribir la implementación — el visor**

En `js/movil-visor.js`, junto a la declaración de `direccionPendiente`, añadir:

```js
  /* La última parada que NO era la ficha, para que el botón de ficha devuelva
     a donde estabas y no al principio. Se olvida al cambiar de proyecto: la
     pieza 3 de un trabajo no es la pieza 3 de otro, y en un proyecto de vídeo
     no existe.

     Vive aquí y no en `MovilRecorrido` porque aquél es puro y no guarda nada
     entre llamadas; se le pasa como argumento. */
  var piezaRecordada = null;
```

En `init`, junto a la línea `aqui = null;`, añadir:

```js
    piezaRecordada = null;
```

En `aplicar`, justo ANTES de la línea `aqui = nuevo;`, añadir:

```js
    if (!aqui || aqui.proyecto !== nuevo.proyecto) piezaRecordada = null;
    if (nuevo.pieza !== 'ficha') piezaRecordada = nuevo.pieza;
```

En `cerrar`, junto a la línea `aqui = null;`, añadir:

```js
    piezaRecordada = null;
```

En `init`, en la llamada a `window.MovilHud.init`, añadir `ficha: refs.ficha,` al objeto de referencias (después de `cats`), y un cuarto callback después del de cerrar. La llamada termina hoy así:

```js
    }, function () {
      window.Router.ir('todos', null);
    });
```

y pasa a terminar así:

```js
    }, function () {
      window.Router.ir('todos', null);
    }, function () {
      /* El botón no pinta: navega, igual que un deslizamiento, y el suscriptor
         de siempre repinta. Es lo que impide que la pantalla diga una cosa y la
         URL otra.

         La dirección se pone a mano porque pulsar no es un dedo, pero la ficha
         está ABAJO del eje y eso el recorrido ya lo enseñó en cada gesto: ir a
         la ficha entra como si se hubiera deslizado «arriba» y volver como
         «abajo». Sin esto la parada aparecería de golpe y el botón
         contradiría el modelo espacial del eje. */
      if (!aqui) return;
      var destino = window.MovilRecorrido.alternarFicha(aqui, orden, piezaRecordada);
      if (destino.pieza === aqui.pieza) return;
      direccionPendiente = (destino.pieza === 'ficha') ? 'arriba' : 'abajo';
      var ruta = window.MovilRecorrido.aRuta(destino);
      window.Router.ir(ruta.tipo, ruta.valor, ruta.pieza);
    });
```

- [x] **Paso 7: Ejecutar para verificar que pasan**

Recargar. Esperado: **507 pasan, 0 fallan** (498 + 4 del HUD + 5 del visor).

- [x] **Paso 8: El marcado y el estilo**

En `index.html`, dentro de `.mvisor-hud-arriba`, entre el `<ul id="movilVisorCats">` y el botón de cerrar:

```html
        <button class="mvisor-ficha-boton" id="movilVisorFicha" type="button"
                aria-pressed="false">Ficha</button>
```

En la llamada a `window.MovilVisor.init` (sobre la línea 523), añadir después de la línea de `cats`:

```js
      ficha:    document.getElementById('movilVisorFicha'),
```

El comentario HTML de encima del bloque `.mvisor` (sobre la línea 351) dice hoy «aquí no hay tira de miniaturas, ni lupa, ni línea de progreso». Deja de ser cierto en la Tarea 4, así que se corrige ya. Sustituir esa frase por:

```
       aquí no hay lupa —la amplía el pellizco— ni línea de progreso, la tira
       de miniaturas es otra y hay dos ejes de deslizamiento.
```

En `css/luque.css`, añadir `.mvisor-ficha-boton` a las DOS listas de selectores que dan forma a las pastillas: la que empieza en `body.es-movil .mvisor-cat,` sobre la línea 1523 (la del fondo amarillo, que acaba en `.mvisor-cat-opcion`) y la que empieza igual sobre la 1537 (la de la forma pulsable). En las dos, añadir una línea más al final de la lista de selectores:

```css
body.es-movil .mvisor-ficha-boton,
```

- [x] **Paso 9: Comprobar en el navegador**

Abrir `http://localhost:8000/` con la ventana estrechada por debajo de 860px y recargar. Tocar un trabajo, y comprobar a ojo:
- La pastilla «Ficha» sale entre la categoría y la ✕, con el mismo aspecto amarillo.
- Pulsarla enseña la ficha, y la URL pasa a `#/<id>/ficha`.
- Volver a pulsarla devuelve a la misma pieza de la que saliste.
- Las tres pastillas de arriba no se pisan.

- [x] **Paso 10: Commit**

```bash
git add index.html css/luque.css js/movil-hud.js js/movil-visor.js tests/pruebas-movil-hud.js tests/pruebas-movil-visor.js
git commit -m "El boton de ficha del visor movil"
```

---

## Tarea 3: El módulo de la tira

El módulo solo, sin cablear. Construye la tira, marca la pieza actual y la centra; no conoce el router ni el visor.

**Ficheros:**
- Crear: `js/movil-tira.js`
- Crear: `tests/pruebas-movil-tira.js`
- Modificar: `tests/test.html` (dos `<script>`)

**Interfaces:**
- Consume: nada de otros módulos. Recibe el proyecto ya buscado.
- Produce:
  - `MovilTira.init(elRaiz, alElegirPieza)` — `elRaiz` es un `<nav>`; `alElegirPieza` es `function (numero)` con el número de pieza **desde 1**.
  - `MovilTira.pintar(proyecto, pieza)` — `proyecto` es el objeto de `contenido.json` (necesita `id` y `piezas[]` con `miniatura` y `url`); `pieza` es `number|null|'ficha'`.

- [x] **Paso 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-movil-tira.js` con:

```js
/* La tira de miniaturas del visor móvil. Lo que se puede probar sin un dedo:
   cuántos botones se pintan, cuál queda marcado, y —la que más importa— que
   cambiar de pieza NO reconstruya la tira.

   Esa última no es una optimización con prueba de adorno: `pintar()` del visor
   vacía la escena en cada parada, y si la tira siguiera ese camino, cada
   deslizamiento tiraría las diez `<img>` de un proyecto y volvería a pedirlas,
   además de perder el desplazamiento horizontal que el dedo hubiera dejado
   puesto. Se fija por identidad de nodo, que es lo único que distingue
   «sigue siendo el mismo botón» de «es otro botón igual». */

describe('MovilTira', function () {

  var TIRA_MARCADO = '<div><nav id="tiraRaiz" hidden></nav></div>';

  var CON_FOTOS = {
    id: 'niebla',
    piezas: [{ url: 'a.jpg', miniatura: 'a-mini.jpg' },
             { url: 'b.jpg', miniatura: 'b-mini.jpg' },
             { url: 'c.jpg', miniatura: 'c-mini.jpg' }]
  };

  var OTRO = {
    id: 'bruma',
    piezas: [{ url: 'x.jpg', miniatura: 'x-mini.jpg' },
             { url: 'y.jpg', miniatura: 'y-mini.jpg' }]
  };

  var SIN_PIEZAS = { id: 'oleaje', piezas: [] };

  function conTira(fn) {
    return ArnesDom.conElemento(TIRA_MARCADO, function (caja) {
      var raiz = caja.querySelector('#tiraRaiz');
      var elegidas = [];
      MovilTira.init(raiz, function (n) { elegidas.push(n); });
      return fn(raiz, elegidas);
    });
  }

  function botones(raiz) { return raiz.querySelectorAll('button'); }

  function marcas(raiz) {
    return Array.prototype.map.call(botones(raiz), function (b) {
      return b.getAttribute('aria-current');
    });
  }

  prueba('pinta un botón por pieza', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      return botones(raiz).length;
    }), 3);
  });

  /* La miniatura y no la pieza entera: 8 KB contra 520 KB, y aquí se ve a
     52px. Pedir la grande sería descargar cinco megas para pintar una tira. */
  prueba('cada botón lleva la miniatura de su pieza', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      return Array.prototype.map.call(raiz.querySelectorAll('img'), function (i) {
        return i.getAttribute('src');
      });
    }), ['a-mini.jpg', 'b-mini.jpg', 'c-mini.jpg']);
  });

  prueba('marca la pieza actual y sólo ella', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 2);
      return marcas(raiz);
    }), [null, 'true', null]);
  });

  /* En la ficha no estás en ninguna pieza, así que marcar una mentiría sobre
     dónde estás — el mismo criterio que ya sigue el contador del HUD. */
  prueba('en la ficha no marca ninguna', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 'ficha');
      return marcas(raiz);
    }), [null, null, null]);
  });

  prueba('cambiar de pieza NO reconstruye la tira', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      var primero = botones(raiz)[0];
      MovilTira.pintar(CON_FOTOS, 3);
      return botones(raiz)[0] === primero;
    }), true);
  });

  prueba('cambiar de pieza sí mueve la marca', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      MovilTira.pintar(CON_FOTOS, 3);
      return marcas(raiz);
    }), [null, null, 'true']);
  });

  prueba('cambiar de proyecto sí reconstruye', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(CON_FOTOS, 1);
      MovilTira.pintar(OTRO, 1);
      return botones(raiz).length;
    }), 2);
  });

  /* Un proyecto de vídeo no tiene piezas. Una tira vacía ocuparía sitio sobre
     la foto sin decir nada. */
  prueba('un proyecto sin piezas deja la tira oculta y vacía', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(SIN_PIEZAS, null);
      return { oculta: raiz.hidden, botones: botones(raiz).length };
    }), { oculta: true, botones: 0 });
  });

  /* Ir de un vídeo a un proyecto de fotos tiene que volver a enseñar la tira:
     `hidden` se puso, así que hay que quitarlo. */
  prueba('volver a un proyecto con piezas vuelve a enseñar la tira', function () {
    igual(conTira(function (raiz) {
      MovilTira.pintar(SIN_PIEZAS, null);
      MovilTira.pintar(CON_FOTOS, 1);
      return { oculta: raiz.hidden, botones: botones(raiz).length };
    }), { oculta: false, botones: 3 });
  });

  /* El número que se avisa es el de la PIEZA, desde 1, que es el que entiende
     el router y el que enseña el contador. Avisar el índice desde 0 abriría
     siempre la pieza anterior, y en la primera no abriría nada. */
  prueba('pulsar avisa el número de pieza, desde 1', function () {
    igual(conTira(function (raiz, elegidas) {
      MovilTira.pintar(CON_FOTOS, 1);
      botones(raiz)[2].click();
      return elegidas;
    }), [3]);
  });
});
```

- [x] **Paso 2: Enganchar el fichero nuevo a la suite**

En `tests/test.html`, añadir el módulo justo después de la línea de `../js/movil-animacion.js` (sobre la 56):

```html
<script src="../js/movil-tira.js"></script>
```

y las pruebas después de la línea de `pruebas-movil-animacion.js` (sobre la 117):

```html
<script src="pruebas-movil-tira.js"></script>
```

- [x] **Paso 3: Ejecutar para verificar que fallan**

Recargar. Esperado: diez líneas en rojo bajo el titular `MovilTira`, con `MovilTira is not defined`.

- [x] **Paso 4: Escribir la implementación**

Crear `js/movil-tira.js`:

```js
window.MovilTira = (function () {

  /* La tira de miniaturas del visor móvil. Es el equivalente de `#visorTira`
     del escritorio (`construirTira`, en js/visor.js), pero no se comparte
     código con él: aquél vive en un marco que no se vacía, se despierta con
     `mouseenter` y mide con el ratón encima, que en un dedo no existe.
     Treinta líneas de aquí salen más baratas que un módulo con un `if` de lado
     dentro.

     No vive dentro de `js/movil-visor.js` porque ese fichero ya está muy por
     encima del techo de 300 líneas del repositorio. */

  var raiz = null, alElegir = null;

  /* De qué proyecto es la tira que hay puesta. Es lo que permite repintar la
     marca sin reconstruir: el visor llama a `pintar` en CADA parada, y
     reconstruir en cada una tiraría las <img> ya descargadas para volver a
     pedirlas, además de perder el desplazamiento horizontal que el dedo
     hubiera dejado puesto. */
  var proyectoPuesto = null;

  function init(elRaiz, alElegirPieza) {
    raiz = elRaiz;
    alElegir = alElegirPieza;
    proyectoPuesto = null;
  }

  function pintar(proyecto, pieza) {
    var piezas = (proyecto && proyecto.piezas) || [];
    if (!piezas.length) {
      raiz.innerHTML = '';
      raiz.hidden = true;
      proyectoPuesto = null;
      return;
    }
    if (proyecto.id !== proyectoPuesto) {
      construir(piezas);
      proyectoPuesto = proyecto.id;
    }
    raiz.hidden = false;
    marcar(pieza);
  }

  function construir(piezas) {
    raiz.innerHTML = '';
    piezas.forEach(function (p, i) {
      var numero = i + 1;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Pieza ' + numero + ' de ' + piezas.length);
      var img = document.createElement('img');
      /* La miniatura (250px de lado largo, 8 KB) y no la pieza (3000px,
         520 KB): aquí se ve a 52px. Las tres medidas de cada foto existen
         justamente para que cada sitio pida la suya. */
      img.src = p.miniatura || p.url;
      /* `alt` vacío a propósito: el botón ya se nombra con `aria-label`, y una
         descripción encima repetiría lo mismo dos veces al lector de
         pantalla. */
      img.alt = '';
      img.decoding = 'async';
      b.appendChild(img);
      /* El número de la PIEZA, desde 1, que es el que entiende el router y el
         que enseña el contador. Con el índice desde 0, pulsar la primera no
         abriría nada y las demás abrirían la anterior. */
      b.addEventListener('click', function () { alElegir(numero); });
      raiz.appendChild(b);
    });
  }

  /* `aria-current` se QUITA en vez de ponerse a 'false': un `aria-current`
     presente con cualquier valor distinto de 'false' cuenta como puesto, y
     dejar el atributo suelto invita a leerlo como booleano. En la ficha y en
     el vídeo no se marca ninguna, porque no estás en una pieza. */
  function marcar(pieza) {
    Array.prototype.forEach.call(raiz.children, function (b, i) {
      if (i + 1 === pieza) {
        b.setAttribute('aria-current', 'true');
        centrar(b);
      } else {
        b.removeAttribute('aria-current');
      }
    });
  }

  /* Se escribe `scrollLeft` de la tira y NO se usa `scrollIntoView`: aquél
     sólo puede mover la tira, y éste puede además desplazar el documento
     entero si el navegador decide que hace falta. Dentro de un visor a
     pantalla completa eso se ve como que la página da un salto sin que nadie
     la haya tocado. */
  function centrar(b) {
    raiz.scrollLeft = b.offsetLeft - (raiz.clientWidth - b.offsetWidth) / 2;
  }

  return { init: init, pintar: pintar };
})();
```

- [x] **Paso 5: Ejecutar para verificar que pasan**

Recargar. Esperado: **517 pasan, 0 fallan** (507 + 10).

- [x] **Paso 6: Commit**

```bash
git add js/movil-tira.js tests/pruebas-movil-tira.js tests/test.html
git commit -m "MovilTira: la tira de miniaturas del visor movil, sin cablear"
```

---

## Tarea 4: Cablear la tira

El marcado, el estilo y las reglas del CSS que hay que contradecir para que el dedo llegue a la tira.

**Ficheros:**
- Modificar: `index.html` (el `<nav>`, el `<script>`, la referencia)
- Modificar: `css/luque.css` (la tira, la fila de abajo, el HUD dormido)
- Modificar: `js/movil-visor.js` (dos llamadas)
- Modificar: `tests/pruebas-movil-visor.js` (marcado y dos pruebas)

**Interfaces:**
- Consume: `MovilTira.init(elRaiz, alElegirPieza)` y `MovilTira.pintar(proyecto, pieza)` de la Tarea 3.
- Produce: `MovilVisor.init(refs, proyectos)` — `refs` gana la clave `tira`. Pasa de nueve referencias a diez.

- [x] **Paso 1: Escribir las pruebas que fallan**

En `tests/pruebas-movil-visor.js`, en `MV_MARCADO`, añadir la tira **dentro** del HUD, después del `<span id="mvContador"></span>`:

```js
  '<nav id="mvTira" hidden></nav>' +
```

En `mvRefsDesde`, añadir la clave nueva al final (poniendo la coma que falte en la línea anterior):

```js
    tira:     caja.querySelector('#mvTira')
```

Y en el `describe('MovilVisor — el botón de ficha', ...)` que creó la Tarea 2, añadir al final:

```js
  /* La tira se pinta en cada parada, igual que el HUD, y pulsar una miniatura
     lleva al router con el número de pieza. Que no reconstruya en cada parada
     lo fija `tests/pruebas-movil-tira.js`; aquí sólo se comprueba el cable. */
  prueba('la tira se pinta con las piezas del trabajo abierto', function () {
    igual(conRuta(enProyecto('niebla', 2), function (refs) {
      return refs.tira.querySelectorAll('button').length;
    }), 3);
  });

  prueba('pulsar una miniatura navega a esa pieza', function () {
    igual(conRuta(enProyecto('niebla', 2), function (refs, ido) {
      refs.tira.querySelectorAll('button')[2].click();
      return ido;
    }), [['proyecto', 'niebla', 3]]);
  });
```

- [x] **Paso 2: Ejecutar para verificar que fallan**

Recargar. Esperado: las dos nuevas en rojo — la primera porque la tira tiene cero botones, la segunda con un TypeError al pulsar sobre `undefined`.

- [x] **Paso 3: Escribir el cableado**

En `js/movil-visor.js`, dentro de `init`, después de la llamada a `window.MovilHud.init(...)` y antes de `engancharGestos();`:

```js
    /* La tira navega, no pinta, igual que el botón de ficha y que un
       deslizamiento. `aqui` se lee en el momento del toque y no se captura al
       cablear: la tira sigue puesta mientras cambias de parada. */
    window.MovilTira.init(refs.tira, function (n) {
      if (!aqui) return;
      window.Router.ir('proyecto', aqui.proyecto, n);
    });
```

En `pintar`, después de la línea de `window.MovilHud.pintar(...)`:

```js
    window.MovilTira.pintar(p, aqui.pieza);
```

- [x] **Paso 4: Ejecutar para verificar que pasan**

Recargar. Esperado: **519 pasan, 0 fallan**.

- [x] **Paso 5: El marcado**

En `index.html`, sustituir el bloque `.mvisor-hud-abajo` entero por:

```html
      <div class="mvisor-hud-abajo">
        <!-- La tira va DENTRO del HUD, así que se duerme con él a los 3
             segundos. Su `touch-action` y su `pointer-events` se los devuelve
             `css/luque.css` a mano: el visor los tiene apagados para que los
             dos ejes los interprete js/movil-gestos.js. -->
        <nav class="mvisor-tira" id="movilVisorTira"
             aria-label="Piezas del trabajo" hidden></nav>
        <div class="mvisor-hud-pie">
          <p class="mvisor-titulo" id="movilVisorTitulo"></p>
          <span class="mvisor-contador" id="movilVisorContador"></span>
        </div>
      </div>
```

En la llamada a `window.MovilVisor.init`, añadir la referencia nueva al final del objeto (poniendo la coma que falte en la línea de `contador`):

```js
      tira:     document.getElementById('movilVisorTira')
```

Y el `<script>`, ANTES de `js/movil-visor.js`. El comentario que hay hoy justo encima de `<script src="js/movil-visor.js"></script>` habla de `MovilBrillo.tratamientoDe` y de un encuadre de cuatro esquinas que ya no existen —`Brillo` se retiró el 2026-09-11—, así que se sustituye entero por:

```html
  <!-- Va ANTES de movil-visor.js, que lo usa en `init()` para cablear la tira
       y en `pintar()` para repintarla. Sin esta línea `window.MovilTira` es
       undefined y abrir el visor lanza un TypeError. La suite no puede cazarlo
       porque tests/test.html carga sus scripts por su cuenta. -->
  <script src="js/movil-tira.js"></script>
  <script src="js/movil-visor.js"></script>
```

- [x] **Paso 6: El estilo**

En `css/luque.css`, en la regla que empieza `body.es-movil .mvisor-hud-arriba,` (sobre la línea 1513), cambiar el segundo selector de `.mvisor-hud-abajo` a `.mvisor-hud-pie`, y añadir justo debajo:

```css
/* La fila de abajo pasa a ser una columna: la tira encima, el título y el
   contador debajo, en su propia fila (`.mvisor-hud-pie`). */
body.es-movil .mvisor-hud-abajo{
  display:flex; flex-direction:column; gap:.6rem;
}
```

Sustituir la regla `body.es-movil .mvisor-hud.dormido{ opacity:0; }` (sobre la 1511) por:

```css
/* El HUD dormido no se ve Y no se puede pulsar. `opacity:0` a secas NO quita
   el elemento del alcance del dedo: las pastillas seguían siendo pulsables
   sin verse, y con una tira de diez miniaturas eso pasa de rareza a trampa —
   tocar para despertar el HUD abriría una pieza al azar.

   El `pointer-events` va en los DESCENDIENTES y no sólo en el contenedor: el
   contenedor ya lo tiene en `none`, y un hijo con `auto` —que es como las
   pastillas recuperan el dedo— lo recibe igual por mucho que el padre diga
   `none`. Con el toque fuera de alcance cae en la raíz del visor, que es
   justamente quien despierta el HUD (`soltarEn`, la rama del toque).

   No se usa `visibility:hidden`, que además sacaría del tabulador: no
   interpola, salta, y se llevaría por delante la transición de opacidad de
   0,35s. Es el mismo razonamiento, con el mismo precio, que ya está escrito
   para `.visor-ficha` en el escritorio. */
body.es-movil .mvisor-hud.dormido{ opacity:0; }
body.es-movil .mvisor-hud.dormido *{ pointer-events:none; }
```

Y al final del bloque del HUD, antes de la media query de `prefers-reduced-motion`, añadir:

```css
/* ── La tira de miniaturas ─────────────────────────────────────────────────
   Tres reglas del visor la dejarían muerta, y las tres se contradicen AQUÍ y
   sólo aquí:

   - `.mvisor` lleva `touch-action:none` para que los dos ejes los interprete
     js/movil-gestos.js. Eso apaga también el desplazamiento de la tira.
     `pan-x` devuelve un solo eje y deja el resto declinado.
   - `.mvisor-hud` es `pointer-events:none` para que el deslizamiento lo
     atraviese; cada control lo recupera por su cuenta, y la tira también.
   - `overscroll-behavior-x:contain` para que llegar al final de la tira no se
     encadene con el gesto de «atrás» del navegador.

   La barra de desplazamiento se esconde en los dos motores: en un teléfono no
   se usa con el ratón y ocuparía alto sobre la foto. */
body.es-movil .mvisor-tira{
  display:flex; gap:6px;
  overflow-x:auto;
  overscroll-behavior-x:contain;
  touch-action:pan-x;
  pointer-events:auto;
  scrollbar-width:none;
}
body.es-movil .mvisor-tira[hidden]{ display:none; }
body.es-movil .mvisor-tira::-webkit-scrollbar{ display:none; }

body.es-movil .mvisor-tira button{
  flex:0 0 auto;
  width:52px; height:52px;
  padding:0; border:0; background:none;
  cursor:pointer;
  outline:2px solid transparent;
  outline-offset:2px;
}

body.es-movil .mvisor-tira img{
  display:block;
  width:100%; height:100%;
  object-fit:cover;
}

/* La actual se marca con un contorno y NO atenuando las demás: bajarle la
   opacidad a las otras nueve para destacar una las hace ilegibles todas, y la
   tira deja de servir para elegir. */
body.es-movil .mvisor-tira button[aria-current="true"]{
  outline-color:var(--yellow);
}
```

- [x] **Paso 7: Comprobar en el navegador**

Recargar `http://localhost:8000/tests/test.html` — siguen **519 pasan, 0 fallan**; el CSS no lo ve la suite.

Abrir `http://localhost:8000/` estrechado bajo 860px, tocar un trabajo y comprobar a ojo:
- La tira sale bajo el título, con una miniatura por pieza y la actual con contorno amarillo.
- Deslizar la foto cambia de pieza y la marca se mueve, sin que las miniaturas parpadeen.
- Pulsar una miniatura salta a esa pieza.
- A los 3 segundos el HUD se duerme y **tocar donde estaba una miniatura despierta el HUD en vez de abrir esa pieza**.
- En un proyecto de vídeo no sale tira. Hoy los ocho proyectos son de fotos, así que esto no se puede ver sin falsear `piezas: []` en `contenido.json` a mano y deshacerlo después. Lo cubre `tests/pruebas-movil-tira.js`; si se prefiere no tocar el contenido, se deja para cuando el estudio suba los vídeos.

- [x] **Paso 8: Commit**

```bash
git add index.html css/luque.css js/movil-visor.js tests/pruebas-movil-visor.js
git commit -m "Cablear la tira de miniaturas en el visor movil"
```

---

## Tarea 5: Lo que hay que dejar escrito

`docs/estado-conocido.md` es lo que la próxima mano lee antes de tocar el código. Dos cosas de este bloque no se deducen del código y tienen que estar ahí: por qué `movil-visor.js` sigue creciendo, y qué queda sin poder comprobar.

**Ficheros:**
- Modificar: `docs/estado-conocido.md`

- [x] **Paso 1: Medir**

```bash
wc -l js/movil-visor.js js/movil-tira.js js/movil-hud.js js/movil-recorrido.js
```

Apuntar el número de `js/movil-visor.js`: el plan lo esperaba en torno a 420, y el que va al documento es el real.

- [x] **Paso 2: Contar las pruebas**

Recargar `http://localhost:8000/tests/test.html` y apuntar la línea final. Se esperan **519 pasan, 0 fallan**, frente a las 491 de antes del bloque.

- [x] **Paso 3: Escribir**

En la sección «Estructura» de `docs/estado-conocido.md`, donde hoy dice que la única excepción al techo de 300 líneas es `js/visor.js` con 303, añadir a continuación (sustituyendo `NNN` por el número medido en el Paso 1):

```
**Y desde el bloque de la ficha y la tira, `js/movil-visor.js`: NNN.** Ya
estaba en 390 antes de este bloque —el pellizco del 4g lo dejó así— y el
cableado de los dos controles nuevos lo sube. Se decidió **no partirlo en este
bloque**: la spec lo declara fuera de alcance y sacó la tira a
`js/movil-tira.js` precisamente para no añadirle más. Quien lo toque a
continuación tiene que partirlo antes de añadir nada; el candidato evidente es
el pellizco —`zoom`, `base`, `punteros`, `refrescarPar`, `medidasDelPaseo`,
`pintarZoom`—, que son unas ochenta líneas con estado propio y ninguna
relación con el router.
```

Y añadir una sección nueva, después de la del visor móvil de dos ejes:

```
## El botón de ficha y la tira (bloque de la ficha y la tira)

**La ficha ya se puede pedir.** Hasta este bloque `js/movil-ficha.js` existía y
se pintaba, pero la única forma de llegar era deslizar hasta el final del eje
vertical: diez gestos en `la-boquerona`. Ahora hay una pastilla «Ficha» en el
HUD que llama a `MovilRecorrido.alternarFicha`, la función pura que decide a
qué parada lleva en cada sentido. **Quien recuerda la pieza de la que saliste
es `MovilVisor` (`piezaRecordada`), no `MovilRecorrido`**, que es puro y la
recibe como argumento.

La guarda que menos se ve y más importa de `alternarFicha`: `indexOf('ficha')`
NO es -1, porque 'ficha' es una parada del eje como cualquier otra. Sin tratar
ese caso aparte, una recordada de 'ficha' devolvería la ficha estando ya en la
ficha y el botón quedaría muerto. Tiene prueba propia.

**La tira de miniaturas vive en `js/movil-tira.js` y no comparte código con la
del escritorio.** Aquélla (`construirTira`, en `js/visor.js`) se despierta con
`mouseenter` y mide con el ratón encima, que en un dedo no existe.

**Tres reglas del CSS del visor la habrían dejado muerta**, y las tres se
contradicen en `.mvisor-tira` y sólo ahí: el `touch-action:none` de `.mvisor`
(se devuelve `pan-x`), el `pointer-events:none` de `.mvisor-hud` (se devuelve
`auto`) y el encadenado del desplazamiento con el gesto de «atrás» al llegar al
final (`overscroll-behavior-x:contain`).

**Y destapó un defecto que ya estaba:** `.mvisor-hud.dormido` sólo ponía
`opacity:0`, así que las pastillas del HUD dormido se podían pulsar sin verse.
Con una tira de miniaturas eso pasaba de rareza a trampa. Corregido con
`body.es-movil .mvisor-hud.dormido *{ pointer-events:none; }` — **en los
descendientes, no en el contenedor**: el contenedor ya lo tenía en `none` y un
hijo con `auto` lo recibe igual por mucho que el padre diga lo contrario. Con
el toque fuera de alcance cae en la raíz del visor, que es quien despierta el
HUD.

**`MovilTira.pintar` se llama en CADA parada pero sólo reconstruye al cambiar
de proyecto.** No es una optimización opcional: reconstruir en cada
deslizamiento tiraría las diez `<img>` ya descargadas para volver a pedirlas, y
perdería el desplazamiento horizontal que el dedo hubiera dejado puesto. Lo
fija `tests/pruebas-movil-tira.js` por identidad de nodo, que es lo único que
distingue «sigue siendo el mismo botón» de «es otro botón igual».

**`MovilTira.centrar` escribe `scrollLeft` y no usa `scrollIntoView`**, a
propósito: aquél sólo puede mover la tira, y éste puede además desplazar el
documento entero. Dentro de un visor a pantalla completa eso se ve como que la
página salta sola.

### Lo que la suite no puede certificar de este bloque

No hay pruebas de CSS computado ni de gesto táctil, así que esto sólo lo puede
juzgar quien lo mire en un teléfono de verdad:

1. Que `touch-action:pan-x` baste para que Chrome de Android desplace la tira
   con el dedo, estando dentro de un contenedor con `touch-action:none`.
2. Que arrastrar la tira no se cuele como cambio de proyecto. El cable que
   debería impedirlo NO es un `stopPropagation` —la spec lo proponía y al
   escribir el plan se decidió dejarlo fuera; el porqué está en el propio plan,
   en su apartado final—. Si en el teléfono resulta que sí se cuela, el arreglo
   es añadirlo al `pointerdown` de la tira.
3. Si una tira de miniaturas sobre la foto se siente útil o se siente como que
   tapa el trabajo. Es un estudio de fotografía: los píxeles que tapan la foto
   se pagan caros, y esta decisión es de Lidia y de Ángel.
4. Que el botón de ficha esté donde la mano lo busca, y que las tres pastillas
   de arriba no se aprieten en un teléfono estrecho.
```

En la sección «Cómo se prueba», actualizar el número de comprobaciones —dice 468 y ya antes de este bloque eran 491— al medido en el Paso 2, y nombrar el fichero de pruebas nuevo (`tests/pruebas-movil-tira.js`).

- [x] **Paso 4: Commit**

```bash
git add docs/estado-conocido.md
git commit -m "Estado conocido: el boton de ficha y la tira del visor movil"
```

---

## Aviso sobre el `stopPropagation` que la spec pedía y este plan no pone

La spec dice que la tira necesita `stopPropagation()` en su `pointerdown` para que arrastrarla no se lea como «proyecto siguiente». **Este plan no lo implementa**, y conviene saber por qué antes de ejecutarlo.

Con `touch-action:pan-x`, el navegador se queda el gesto horizontal en cuanto lo reconoce y dispara `pointercancel` sobre el visor, así que `MovilGestos` no llega a ver el recorrido completo. Añadir además `stopPropagation()` tendría un precio propio: el `pointerdown` de la tira no llegaría a la raíz, y el contador de dedos del pellizco (`punteros`, en `js/movil-visor.js`) se desincronizaría si un dedo baja sobre la tira y el otro sobre la foto.

Se deja fuera, apuntado como comprobación pendiente en el teléfono. **Si al probarlo en un móvil real arrastrar la tira cambia de trabajo, el arreglo es añadir el `stopPropagation()`** en el `pointerdown` de `MovilTira.init` y volver a probar el pellizco.
