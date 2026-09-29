# La esfera de la portada móvil — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la rejilla de la portada móvil por una esfera de portadas que el dedo gira libremente, con la de delante en primer plano, sin tocar el escritorio ni el visor de dos ejes.

**Architecture:** Un módulo puro, `MovilEsfera` (reparto de Fibonacci, orientación con cuaterniones, inercia y muelle, proyección a pantalla), probado con números. Un módulo de cableado, `MovilGlobo`, que pinta las teselas, aplica la proyección con `transform` 2D + una inclinación por tesela y atiende puntero, rueda, teclado y la ruta. La puerta, el origen del vuelo del visor y el contacto se reenganchan a la esfera; la rejilla y el diagnóstico de toques se retiran.

**Tech Stack:** JavaScript de navegador sin build (IIFE colgados de `window`), CSS a mano, el arnés propio de `tests/arnes.js` + `tests/arnes-dom.js`.

**Spec:** `docs/superpowers/specs/2026-09-29-esfera-movil-design.md` — léela antes de empezar; este plan argumenta desde ella.

## Global Constraints

- Todo en **español**: código, comentarios, nombres de archivo, mensajes de commit.
- **Sin dependencias ni build.** Nada de WebGL, Three.js ni librerías de gestos.
- Módulos IIFE colgados de `window`. **El orden de los `<script>` importa**: todo módulo nuevo va en `index.html` **y** en `tests/test.html`, con el mismo orden relativo.
- **El escritorio no cambia.** Todo lo nuevo vive detrás de `body.es-movil` / `Movil.CONSULTA` (`max-width: 860px`).
- **El visor de dos ejes (`js/movil-visor.js`) no se toca.**
- **`contenido.json` no se edita a mano** (hay un hook que lo bloquea). Este plan no lo necesita.
- **En local toda foto da 404 y eso es lo correcto.** Nada visual que dependa de fotos se da por comprobado sin desplegar.
- **La marca es siempre `logo-luque.svg`**, nunca la palabra «LUQUE!» escrita.
- **No se despliega.** Subir a una rama no publica nada, y desplegar es un gesto manual de Ángel.
- Nunca `git stash` a secas (el stash se comparte entre worktrees).
- Comentarios con la densidad y el tono de los que ya hay: explican el porqué, no el qué.
- Commits terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Cómo se corre la suite:** desde la raíz del worktree, `python -m http.server 8765` y abrir `http://localhost:8765/tests/test.html`; la última línea dice `——— N pasan, M fallan ———`. Desde el panel Browser, el perfil `luque` de `.claude/launch.json`. Para leer el resultado sin mirar: `get_page_text` sobre esa pestaña y buscar `FALLA`. **La suite entera tiene que salir en verde** al final de cada tarea, no sólo las pruebas nuevas.

## Review Focus

1. **El primer toque tras cruzar la puerta, en táctil de verdad.** Con captura de puntero, el `pointerup` llega a la raíz y no al botón, y un `click` puede no llegar nunca (es el fallo que cazaba `diagnostico-toques.js`). Lo esperado: abre a la primera. Prueba en la Tarea 5 («un pointerup que llega a la raíz abre igual»).
2. **Un golpe de dedo muy rápido.** Dos eventos a 0,1 ms de distancia dan una velocidad absurda y la esfera giraría segundos como una peonza. Lo esperado: la velocidad tiene tope. Prueba en la Tarea 2 («la velocidad tiene tope»).
3. **Girar el teléfono o cambiar el tamaño de la ventana con la esfera quieta.** Lo esperado: las teselas se recolocan al tamaño nuevo sin perder qué trabajo está delante. Prueba en la Tarea 4 («redibujar usa las medidas nuevas y conserva la de delante»).
4. **Una categoría sin trabajos, o con uno solo.** Una ruta a una categoría que no existe (`#/categoria/cortometraje`) no puede lanzar ni dejar teselas de otra categoría. Pruebas en la Tarea 6.
5. **Llegar por un enlace a un trabajo y cerrar el visor.** Lo esperado: al cerrar, delante está ese trabajo y no el 01. Prueba en la Tarea 6 («al salir del visor trae delante el último trabajo abierto»).

---

## Mapa de archivos

| Archivo | Qué | Tarea |
|---|---|---|
| `js/movil-esfera.js` | **Nuevo.** Puro: reparto, cuaterniones, física, proyección, vecina, `numero`. | 1–3 |
| `tests/pruebas-movil-esfera.js` | **Nuevo.** Pruebas de lo anterior. | 1–3 |
| `js/movil-globo.js` | **Nuevo.** Cableado: teselas, dibujo, carga, gestos, ruta. | 4–6 |
| `tests/pruebas-movil-globo.js` | **Nuevo.** Pruebas DOM de lo anterior. | 4–6 |
| `tests/test.html` | Cargar los dos módulos y sus pruebas; retirar los de la rejilla. | 1, 4, 8 |
| `js/contacto.js`, `tests/pruebas-contacto.js` | El contacto vuelve a ser capa también en móvil. | 7 |
| `index.html` | Marcado de la esfera, scripts, arranque. | 8 |
| `css/luque.css` | Fuera la rejilla y el contacto en el recorrido; dentro la esfera. | 7, 8 |
| `js/movil-puerta.js`, `tests/pruebas-movil-puerta*.js` | La puerta descubre la esfera (renombrado). | 8 |
| `js/visor-origen.js` | Rama móvil → `MovilGlobo.elementoDe`. | 8 |
| `js/movil-hoja.js`, `tests/pruebas-movil-hoja-*.js`, `js/diagnostico-toques.js` | **Se borran.** | 8 |
| `js/ficha-dato.js` | Un comentario que nombra `.hoja-celda`. | 8 |
| `docs/estado-conocido.md`, `docs/comprobaciones-en-produccion.md` | Anotar la esfera y lo que queda por mirar en un teléfono. | 9 |

---

### Task 1: `MovilEsfera` — números, cuaterniones y reparto

**Files:**
- Create: `js/movil-esfera.js`
- Create: `tests/pruebas-movil-esfera.js`
- Modify: `tests/test.html` (dos líneas)

**Interfaces:**
- Consumes: nada.
- Produces (en `window.MovilEsfera`):
  - `numero(indice: number) → string` — dos cifras desde `'01'`.
  - `reparto(n: number) → Array<[x, y, z]>` — puntos unitarios; `x` derecha, `y` arriba, `z` hacia quien mira. Con n = 1 el único punto es `[0, 0, 1]`.
  - `rotar(q: [w,x,y,z], v: [x,y,z]) → [x,y,z]`
  - `mult(a, b) → q`, `arco(a: vec, b: vec) → q` (rotación de arco mínimo de `a` a `b`), `slerp(a, b, t) → q`, `distancia(a, b) → radianes`.
  - `FRENTE = [0, 0, 1]`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crea `tests/pruebas-movil-esfera.js`:

```js
/* MovilEsfera es puro —sin DOM y sin reloj—, así que se prueba con números.
   `cerca` compara con tolerancia: los cuaterniones acumulan errores de coma
   flotante del orden de 1e-12 y `igual` exigiría la igualdad exacta. */
describe('MovilEsfera — números, cuaterniones y reparto', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }
  function cercaVec(a, b, tol, msg) {
    for (var i = 0; i < b.length; i++) cerca(a[i], b[i], tol, msg);
  }
  function largo(v) { return Math.hypot(v[0], v[1], v[2]); }

  prueba('numero da dos cifras desde 01', function () {
    igual([MovilEsfera.numero(0), MovilEsfera.numero(8), MovilEsfera.numero(11)],
          ['01', '09', '12']);
  });

  prueba('reparto(0) está vacío', function () {
    igual(MovilEsfera.reparto(0), []);
  });

  prueba('reparto(1) deja el único punto delante', function () {
    var p = MovilEsfera.reparto(1);
    igual(p.length, 1);
    cercaVec(p[0], [0, 0, 1]);
  });

  prueba('reparto(n) da n puntos sobre la esfera unidad, sin repetir', function () {
    [8, 20].forEach(function (n) {
      var p = MovilEsfera.reparto(n);
      igual(p.length, n);
      p.forEach(function (v) { cerca(largo(v), 1, 1e-9, 'largo'); });
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          var d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]);
          cierto(d > 0.2, 'los puntos ' + i + ' y ' + j + ' casi coinciden (' + d + ')');
        }
      }
    });
  });

  prueba('rotar con la identidad no mueve nada', function () {
    cercaVec(MovilEsfera.rotar([1, 0, 0, 0], [0.3, 0.4, 0.5]), [0.3, 0.4, 0.5]);
  });

  prueba('arco lleva un punto al frente', function () {
    var a = [0.6, 0, 0.8];
    cercaVec(MovilEsfera.rotar(MovilEsfera.arco(a, MovilEsfera.FRENTE), a), [0, 0, 1]);
  });

  /* El caso degenerado: el punto está justo detrás. Sin la rama especial,
     el producto vectorial es cero y el cuaternión sale NaN. */
  prueba('arco lleva al frente un punto que está justo detrás', function () {
    var q = MovilEsfera.arco([0, 0, -1], MovilEsfera.FRENTE);
    cercaVec(MovilEsfera.rotar(q, [0, 0, -1]), [0, 0, 1]);
  });

  prueba('slerp va de un extremo al otro y distancia mide el ángulo', function () {
    var a = [1, 0, 0, 0];
    var b = MovilEsfera.arco([1, 0, 0], MovilEsfera.FRENTE);   // 90° sobre Y
    cerca(MovilEsfera.distancia(a, b), Math.PI / 2);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 0), a), 0);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 1), b), 0);
    cerca(MovilEsfera.distancia(MovilEsfera.slerp(a, b, 0.5), a), Math.PI / 4);
  });
});
```

En `tests/test.html`, añade el módulo detrás de `movil.js` y las pruebas detrás de `pruebas-movil.js`:

```html
<script src="../js/movil.js"></script>
<script src="../js/movil-esfera.js"></script>
```

```html
<script src="pruebas-movil.js"></script>
<script src="pruebas-movil-esfera.js"></script>
```

- [ ] **Step 2: Correr la suite y ver que falla**

Abre `http://localhost:8765/tests/test.html`. Esperado: la sección «MovilEsfera — números…» con `FALLA … MovilEsfera is not defined` (o la sección entera caída) y 404 de `movil-esfera.js` en la consola.

- [ ] **Step 3: Escribir el módulo**

Crea `js/movil-esfera.js`:

```js
window.MovilEsfera = (function () {

  /* La esfera de la portada móvil, en números. Puro: sin DOM y sin reloj —el
     tiempo entra como argumento, igual que en `js/movil-arrastre.js`—, así que
     todo lo que decide cómo gira se prueba sin un navegador que mueva nada.

     Convenio de ejes, el mismo en todo el módulo: `x` a la derecha, `y` hacia
     ARRIBA (al revés que la pantalla) y `z` hacia quien mira. El frente de la
     esfera es `[0, 0, 1]`. Los cuaterniones van como `[w, x, y, z]`. */

  var FRENTE = [0, 0, 1];
  var AUREO = Math.PI * (3 - Math.sqrt(5));

  /* Dos cifras, desde 01. Venía de `MovilHoja.numero`, que se retira con la
     rejilla: el número identifica el TRABAJO en la lista completa, no su
     sitio en la esfera, así que filtrar no lo cambia. */
  function numero(indice) {
    var n = indice + 1;
    return (n < 10 ? '0' : '') + n;
  }

  /* Espiral de Fibonacci: n puntos casi equidistantes sobre la esfera unidad.
     Se calcula del número de trabajos y no de una tabla, porque vendrán más
     y la esfera tiene que llenarse sola (decisión de Ángel, 2026-09-29).
     El ángulo empieza en 0 con coseno, así que con n = 1 el único punto cae
     justo delante y no hace falta girar nada. */
  function reparto(n) {
    var puntos = [];
    for (var i = 0; i < n; i++) {
      var y = 1 - 2 * (i + 0.5) / n;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var t = i * AUREO;
      puntos.push([Math.sin(t) * r, y, Math.cos(t) * r]);
    }
    return puntos;
  }

  function mult(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]
    ];
  }

  function normalizar(q) {
    var l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  }

  function eje(ax, ay, az, angulo) {
    var s = Math.sin(angulo / 2);
    return [Math.cos(angulo / 2), ax * s, ay * s, az * s];
  }

  function rotar(q, v) {
    var p = mult(mult(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]);
    return [p[1], p[2], p[3]];
  }

  function cruz(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /* La rotación de arco mínimo que lleva el vector unidad `a` al `b`. El
     caso opuesto (a = −b) va aparte: ahí el producto vectorial es cero, el
     eje queda indefinido y la fórmula general daría un cuaternión nulo, que
     al normalizar se convierte en NaN. Cualquier eje perpendicular sirve. */
  function arco(a, b) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    if (d > 0.999999) return [1, 0, 0, 0];
    if (d < -0.999999) {
      var c = Math.abs(a[0]) < 0.9 ? cruz(a, [1, 0, 0]) : cruz(a, [0, 1, 0]);
      var l = Math.hypot(c[0], c[1], c[2]);
      return [0, c[0] / l, c[1] / l, c[2] / l];
    }
    var x = cruz(a, b);
    return normalizar([1 + d, x[0], x[1], x[2]]);
  }

  function slerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = [-b[0], -b[1], -b[2], -b[3]]; d = -d; }
    if (d > 0.9995) {
      return normalizar([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t,
                         a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]);
    }
    var th = Math.acos(d);
    var s = Math.sin(th);
    var wa = Math.sin((1 - t) * th) / s;
    var wb = Math.sin(t * th) / s;
    return [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1],
            wa * a[2] + wb * b[2], wa * a[3] + wb * b[3]];
  }

  /* El ángulo de giro que separa dos orientaciones. `q` y `−q` son la misma,
     de ahí el valor absoluto. */
  function distancia(a, b) {
    var d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
    return 2 * Math.acos(Math.min(1, d));
  }

  return {
    FRENTE: FRENTE,
    numero: numero,
    reparto: reparto,
    mult: mult,
    normalizar: normalizar,
    eje: eje,
    rotar: rotar,
    arco: arco,
    slerp: slerp,
    distancia: distancia
  };
})();
```

- [ ] **Step 4: Correr la suite y ver que pasa**

Recarga `tests/test.html`. Esperado: las 8 pruebas de la sección en `PASA` y el resumen final sin fallos.

- [ ] **Step 5: Commit**

```bash
git add js/movil-esfera.js tests/pruebas-movil-esfera.js tests/test.html
git commit -m "Empezar MovilEsfera: reparto de Fibonacci y cuaterniones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `MovilEsfera` — orientación, inercia y muelle

**Files:**
- Modify: `js/movil-esfera.js`
- Modify: `tests/pruebas-movil-esfera.js`

**Interfaces:**
- Consumes: todo lo de la Tarea 1.
- Produces (en `window.MovilEsfera`). Un **estado** es `{ q: [w,x,y,z], vel: {h, v}, objetivo: q | null, animando: boolean }`; `vel.h` es el giro alrededor del eje vertical (lo que produce un arrastre horizontal) y `vel.v` alrededor del horizontal, en rad/ms.
  - `inicial(puntos) → estado` — con el punto 0 delante; con `puntos = []`, la identidad.
  - `delante(estado, puntos) → number` — índice del punto más cercano al frente; `-1` si no hay.
  - `traer(estado, punto) → estado` — al instante, sin animar.
  - `apuntar(estado, punto, reducido: boolean) → estado` — animado con el muelle; con `reducido`, igual que `traer`.
  - `arrastrar(estado, dx, dy, ancho, ms) → estado` — `dx`, `dy` en píxeles de pantalla (`dy` positivo = hacia abajo), `ms` desde la muestra anterior.
  - `soltar(estado, puntos, { reducido, msDesdeUltimo }) → estado`
  - `avanzar(estado, ms, puntos) → estado`
  - `VEL_MAX` (rad/ms).

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-esfera.js`:

```js
describe('MovilEsfera — orientación, inercia y muelle', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }
  function zDe(estado, punto) { return MovilEsfera.rotar(estado.q, punto)[2]; }

  /* Corre el reloj a 16 ms por paso hasta que la esfera se para, con tope:
     si no se para en 400 pasos (6,4 s) la prueba lo dice en vez de colgarse. */
  function hastaQuieta(estado, puntos) {
    for (var i = 0; i < 400 && estado.animando; i++) {
      estado = MovilEsfera.avanzar(estado, 16, puntos);
    }
    return { estado: estado, pasos: i };
  }

  var P8 = MovilEsfera.reparto(8);

  prueba('inicial deja el trabajo 01 delante', function () {
    var e = MovilEsfera.inicial(P8);
    cerca(zDe(e, P8[0]), 1);
    igual(MovilEsfera.delante(e, P8), 0);
    igual(e.animando, false);
  });

  prueba('sin puntos, inicial es la identidad y delante es -1', function () {
    var e = MovilEsfera.inicial([]);
    igual(e.q, [1, 0, 0, 0]);
    igual(MovilEsfera.delante(e, []), -1);
  });

  prueba('traer(k) deja k delante para todo k', function () {
    var e = MovilEsfera.inicial(P8);
    for (var k = 0; k < P8.length; k++) {
      e = MovilEsfera.traer(e, P8[k]);
      cerca(zDe(e, P8[k]), 1, 1e-6, 'k=' + k);
      igual(MovilEsfera.delante(e, P8), k);
    }
  });

  /* El sentido del gesto: arrastrar a la derecha lleva el punto de delante a
     la derecha; arrastrar hacia abajo lo lleva hacia abajo (y negativa). */
  prueba('arrastrar sigue al dedo en los dos ejes', function () {
    var e = MovilEsfera.inicial(P8);
    var der = MovilEsfera.rotar(MovilEsfera.arrastrar(e, 40, 0, 400, 16).q, P8[0]);
    var aba = MovilEsfera.rotar(MovilEsfera.arrastrar(e, 0, 40, 400, 16).q, P8[0]);
    cierto(der[0] > 0.1, 'derecha: x=' + der[0]);
    cierto(aba[1] < -0.1, 'abajo: y=' + aba[1]);
  });

  prueba('cruzar el ancho entero gira unos 180°', function () {
    var e = MovilEsfera.inicial(P8);
    var d = MovilEsfera.arrastrar(e, 400, 0, 400, 16);
    cerca(MovilEsfera.distancia(e.q, d.q), Math.PI, 1e-6);
  });

  /* Review Focus 2: dos muestras casi simultáneas darían una velocidad
     absurda y la esfera giraría segundos como una peonza. */
  prueba('la velocidad tiene tope', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 120, 90, 400, 0.01);
    cierto(Math.hypot(e.vel.h, e.vel.v) <= MovilEsfera.VEL_MAX + 1e-12,
           'vel=' + Math.hypot(e.vel.h, e.vel.v));
  });

  prueba('con ms = 0 la velocidad no se toca', function () {
    var e = MovilEsfera.inicial(P8);
    igual(MovilEsfera.arrastrar(e, 30, 0, 400, 0).vel, { h: 0, v: 0 });
  });

  prueba('al soltar con velocidad sigue girando, frena y se asienta', function () {
    var e = MovilEsfera.inicial(P8);
    e = MovilEsfera.arrastrar(e, 30, 5, 400, 16);
    e = MovilEsfera.arrastrar(e, 30, 5, 400, 16);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 10 });
    igual(e.animando, true);
    var r = hastaQuieta(e, P8);
    cierto(r.pasos < 400, 'no se paró');
    var k = MovilEsfera.delante(r.estado, P8);
    cerca(zDe(r.estado, P8[k]), 1, 1e-3, 'la de delante queda centrada');
  });

  prueba('al asentarse gana la más cercana al frente', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 25, 10, 400, 0);
    var esperada = MovilEsfera.delante(e, P8);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 500 });
    var r = hastaQuieta(e, P8);
    igual(MovilEsfera.delante(r.estado, P8), esperada);
    cerca(zDe(r.estado, P8[esperada]), 1, 1e-3);
  });

  /* Quien suelta el dedo tras dejarlo quieto no quiere inercia: la velocidad
     que quedaba apuntada es de antes de pararse. */
  prueba('soltar tras quedarse quieto no lanza la esfera', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 60, 0, 400, 16);
    e = MovilEsfera.soltar(e, P8, { reducido: false, msDesdeUltimo: 300 });
    igual(e.vel, { h: 0, v: 0 });
  });

  prueba('con movimiento reducido soltar asienta sin animar', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(P8), 60, 20, 400, 16);
    var k = MovilEsfera.delante(e, P8);
    e = MovilEsfera.soltar(e, P8, { reducido: true, msDesdeUltimo: 0 });
    igual(e.animando, false);
    cerca(zDe(e, P8[k]), 1, 1e-6);
  });

  prueba('apuntar anima hasta dejar el punto delante', function () {
    var e = MovilEsfera.apuntar(MovilEsfera.inicial(P8), P8[3], false);
    igual(e.animando, true);
    var r = hastaQuieta(e, P8);
    cierto(r.pasos < 400, 'no se paró');
    igual(MovilEsfera.delante(r.estado, P8), 3);
    cerca(zDe(r.estado, P8[3]), 1, 1e-3);
  });

  prueba('apuntar con movimiento reducido salta', function () {
    var e = MovilEsfera.apuntar(MovilEsfera.inicial(P8), P8[3], true);
    igual(e.animando, false);
    cerca(zDe(e, P8[3]), 1, 1e-6);
  });

  prueba('avanzar sobre una esfera quieta no la mueve', function () {
    var e = MovilEsfera.inicial(P8);
    igual(MovilEsfera.avanzar(e, 16, P8), e);
  });

  prueba('con un solo punto, arrastrar y soltar vuelve a dejarlo delante', function () {
    var p1 = MovilEsfera.reparto(1);
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial(p1), 80, 0, 400, 16);
    e = MovilEsfera.soltar(e, p1, { reducido: false, msDesdeUltimo: 10 });
    var r = hastaQuieta(e, p1);
    cerca(zDe(r.estado, p1[0]), 1, 1e-3);
  });

  prueba('sin puntos, soltar y avanzar no lanzan', function () {
    var e = MovilEsfera.arrastrar(MovilEsfera.inicial([]), 80, 0, 400, 16);
    e = MovilEsfera.soltar(e, [], { reducido: false, msDesdeUltimo: 10 });
    e = MovilEsfera.avanzar(e, 16, []);
    igual(e.animando, false);
  });
});
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: la sección nueva en `FALLA` con `MovilEsfera.inicial is not a function` (o la sección caída).

- [ ] **Step 3: Implementar**

En `js/movil-esfera.js`, detrás de `distancia` y antes del `return`, añade:

```js
  /* Los números del movimiento. Afinarlos es trabajo de teléfono, no de
     suite: las pruebas fijan la forma (frena, se para, gana la más cercana),
     no estos valores.
     - TAU_INERCIA: cuánto tarda la velocidad en caer a un 37 %. 325 ms es la
       constante que usa el desplazamiento de iOS, y se siente familiar.
     - TAU_MUELLE: lo mismo para el asiento en la portada; corto para que se
       note como un encaje y no como una segunda inercia.
     - VEL_MAX: tope de giro (Review Focus 2). 0,02 rad/ms son ~1,1° por ms,
       un golpe de dedo enérgico; por encima sólo hay ruido de muestreo.
     - QUIETO_MS: si el dedo lleva este tiempo parado al soltar, no se lanza. */
  var TAU_INERCIA = 325;
  var TAU_MUELLE = 90;
  var UMBRAL_VEL = 0.0004;
  var UMBRAL_ANG = 0.001;
  var VEL_MAX = 0.02;
  var QUIETO_MS = 80;
  var QUIETA = { h: 0, v: 0 };

  function estado(q, vel, objetivo, animando) {
    return { q: q, vel: vel, objetivo: objetivo, animando: animando };
  }

  /* Gira alrededor de los ejes de la PANTALLA y no de los de la esfera: por
     eso la rotación nueva se multiplica por la izquierda. Si se multiplicara
     por la derecha, tras medio giro arrastrar a la derecha movería la esfera
     hacia la izquierda. */
  function girar(q, h, v) {
    return normalizar(mult(mult(eje(1, 0, 0, v), eje(0, 1, 0, h)), q));
  }

  function delante(e, puntos) {
    var mejor = -1;
    var mejorZ = -Infinity;
    for (var i = 0; i < puntos.length; i++) {
      var z = rotar(e.q, puntos[i])[2];
      if (z > mejorZ) { mejorZ = z; mejor = i; }
    }
    return mejor;
  }

  function traer(e, punto) {
    var p = rotar(e.q, punto);
    return estado(normalizar(mult(arco(p, FRENTE), e.q)), QUIETA, null, false);
  }

  function inicial(puntos) {
    var e = estado([1, 0, 0, 0], QUIETA, null, false);
    return puntos.length ? traer(e, puntos[0]) : e;
  }

  function apuntar(e, punto, reducido) {
    if (reducido) return traer(e, punto);
    return estado(e.q, QUIETA, traer(e, punto).q, true);
  }

  function acotar(vel) {
    var r = Math.hypot(vel.h, vel.v);
    if (r <= VEL_MAX) return vel;
    return { h: vel.h * VEL_MAX / r, v: vel.v * VEL_MAX / r };
  }

  /* Cruzar el ancho entero gira media vuelta (π). La velocidad se suaviza
     con la anterior porque las muestras de un dedo vienen con ruido, y con
     `ms = 0` —dos eventos en el mismo instante— no se toca: dividir por cero
     da Infinity, y un Infinity en la velocidad es un NaN en la esfera. */
  function arrastrar(e, dx, dy, ancho, ms) {
    var k = Math.PI / Math.max(ancho, 1);
    var h = dx * k;
    var v = dy * k;
    var vel = e.vel;
    if (ms > 0) {
      vel = acotar({ h: 0.7 * h / ms + 0.3 * e.vel.h, v: 0.7 * v / ms + 0.3 * e.vel.v });
    }
    return estado(girar(e.q, h, v), vel, null, false);
  }

  function asentar(e, puntos) {
    var i = delante(e, puntos);
    var quieta = estado(e.q, QUIETA, null, false);
    return i < 0 ? quieta : traer(quieta, puntos[i]);
  }

  function soltar(e, puntos, opciones) {
    if (!puntos.length) return estado(e.q, QUIETA, null, false);
    if (opciones.reducido) return asentar(e, puntos);
    var vel = opciones.msDesdeUltimo > QUIETO_MS ? QUIETA : e.vel;
    return estado(e.q, vel, null, true);
  }

  /* Un paso del reloj. Dos fases: primero la inercia, que frena por
     rozamiento; cuando la velocidad cae bajo el umbral, se fija como objetivo
     la portada más cercana y el muelle la encaja. Termina siempre con una
     portada exactamente delante. */
  function avanzar(e, ms, puntos) {
    if (!e.animando) return e;
    if (!puntos.length) return estado(e.q, QUIETA, null, false);
    if (e.objetivo === null) {
      if (Math.hypot(e.vel.h, e.vel.v) > UMBRAL_VEL) {
        var f = Math.exp(-ms / TAU_INERCIA);
        return estado(girar(e.q, e.vel.h * ms, e.vel.v * ms),
                      { h: e.vel.h * f, v: e.vel.v * f }, null, true);
      }
      e = estado(e.q, QUIETA, asentar(e, puntos).q, true);
    }
    var q = slerp(e.q, e.objetivo, 1 - Math.exp(-ms / TAU_MUELLE));
    if (distancia(q, e.objetivo) < UMBRAL_ANG) return estado(e.objetivo, QUIETA, null, false);
    return estado(q, QUIETA, e.objetivo, true);
  }
```

Y amplía el `return`:

```js
  return {
    FRENTE: FRENTE,
    VEL_MAX: VEL_MAX,
    numero: numero,
    reparto: reparto,
    mult: mult,
    normalizar: normalizar,
    eje: eje,
    rotar: rotar,
    arco: arco,
    slerp: slerp,
    distancia: distancia,
    inicial: inicial,
    delante: delante,
    traer: traer,
    apuntar: apuntar,
    arrastrar: arrastrar,
    soltar: soltar,
    avanzar: avanzar
  };
```

- [ ] **Step 4: Correr la suite y ver que pasa**

Esperado: las 16 pruebas nuevas en `PASA` y el resumen sin fallos.

- [ ] **Step 5: Commit**

```bash
git add js/movil-esfera.js tests/pruebas-movil-esfera.js
git commit -m "Dar a MovilEsfera el giro: arrastre, inercia y asiento en la portada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `MovilEsfera` — proyección y vecinas

**Files:**
- Modify: `js/movil-esfera.js`
- Modify: `tests/pruebas-movil-esfera.js`

**Interfaces:**
- Consumes: Tareas 1 y 2.
- Produces:
  - `geometria(medidas: {ancho, alto}) → { radio, tesela, cx, cy }` — `tesela` es el ANCHO en píxeles de la tesela de delante (el alto es `tesela * 1.25`, formato 4:5).
  - `proyectar(estado, puntos, medidas) → Array<{ x, y, escala, luz, z, inclinacion: {x, y}, visible }>` — un elemento por punto, en el mismo orden. `x`, `y`: centro en píxeles; `escala`: 1 delante; `luz`: 1 delante, 0,5 en el ecuador, 0,15 detrás; `z`: entero 0–1000 para `z-index`; `inclinacion` en grados (CSS `rotateY(inclinacion.y) rotateX(inclinacion.x)`); `visible`: está en el hemisferio de delante.
  - `vecina(estado, puntos, direccion: 'derecha'|'izquierda'|'arriba'|'abajo') → number` — índice; el de delante si no hay ninguna en esa dirección; `-1` sin puntos.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-esfera.js`:

```js
describe('MovilEsfera — proyección y vecinas', function () {

  function cerca(a, b, tol, msg) {
    if (Math.abs(a - b) > (tol || 1e-6)) {
      throw new Error((msg ? msg + ': ' : '') + 'esperaba ~' + b + ' y recibió ' + a);
    }
  }

  var P8 = MovilEsfera.reparto(8);
  var MEDIDAS = { ancho: 390, alto: 844 };

  prueba('la de delante va centrada, a escala 1 y con toda la luz', function () {
    var e = MovilEsfera.inicial(P8);
    var g = MovilEsfera.geometria(MEDIDAS);
    var p = MovilEsfera.proyectar(e, P8, MEDIDAS)[0];
    cerca(p.x, g.cx, 1e-6);
    cerca(p.y, g.cy, 1e-6);
    cerca(p.escala, 1, 1e-6);
    cerca(p.luz, 1, 1e-6);
    cerca(p.inclinacion.x, 0, 1e-4);
    cerca(p.inclinacion.y, 0, 1e-4);
    igual(p.visible, true);
    igual(p.z, 1000);
  });

  prueba('más atrás es más pequeña, más oscura y se pinta debajo', function () {
    var e = MovilEsfera.inicial(P8);
    var proy = MovilEsfera.proyectar(e, P8, MEDIDAS);
    var zs = P8.map(function (pt) { return MovilEsfera.rotar(e.q, pt)[2]; });
    var orden = zs.map(function (z, i) { return i; })
                  .sort(function (a, b) { return zs[b] - zs[a]; });
    for (var i = 1; i < orden.length; i++) {
      var antes = proy[orden[i - 1]];
      var ahora = proy[orden[i]];
      cierto(antes.escala >= ahora.escala, 'escala');
      cierto(antes.luz >= ahora.luz, 'luz');
      cierto(antes.z >= ahora.z, 'z');
    }
  });

  prueba('la luz vale 0,5 en el ecuador y 0,15 detrás', function () {
    var e = MovilEsfera.inicial([[0, 0, 1]]);
    var p = MovilEsfera.proyectar(e, [[1, 0, 0], [0, 0, -1]], MEDIDAS);
    cerca(p[0].luz, 0.5, 1e-6);
    cerca(p[1].luz, 0.15, 1e-6);
  });

  prueba('sólo el hemisferio de delante es visible', function () {
    var e = MovilEsfera.inicial(P8);
    MovilEsfera.proyectar(e, P8, MEDIDAS).forEach(function (p, i) {
      igual(p.visible, MovilEsfera.rotar(e.q, P8[i])[2] > 0, 'punto ' + i);
    });
  });

  /* Las teselas son siempre derechas: da igual cuánto giro haya acumulado
     la esfera (incluido el giro en el plano de la pantalla que dejan varios
     arrastres en diagonal), la que queda delante no se inclina. */
  prueba('la de delante no se inclina aunque la esfera acumule giro', function () {
    var e = MovilEsfera.inicial(P8);
    for (var i = 0; i < 12; i++) e = MovilEsfera.arrastrar(e, 37, -23, 390, 0);
    e = MovilEsfera.traer(e, P8[5]);
    var p = MovilEsfera.proyectar(e, P8, MEDIDAS)[5];
    cerca(p.inclinacion.x, 0, 1e-3);
    cerca(p.inclinacion.y, 0, 1e-3);
  });

  /* A la derecha, la cara mira a la derecha: rotateY positivo. Arriba, mira
     arriba: rotateX positivo (en CSS la y va hacia abajo, y rotateX(+) lleva
     la normal hacia arriba). */
  prueba('las de los lados se inclinan hacia fuera', function () {
    var e = MovilEsfera.inicial([[0, 0, 1]]);
    var d = Math.SQRT1_2;
    var p = MovilEsfera.proyectar(e, [[d, 0, d], [0, d, d]], MEDIDAS);
    cierto(p[0].inclinacion.y > 0, 'derecha: ' + p[0].inclinacion.y);
    cierto(p[0].x > MovilEsfera.geometria(MEDIDAS).cx, 'derecha x');
    cierto(p[1].inclinacion.x > 0, 'arriba: ' + p[1].inclinacion.x);
    cierto(p[1].y < MovilEsfera.geometria(MEDIDAS).cy, 'arriba y');
  });

  prueba('la tesela de delante mide lo mismo en vertical y en apaisado con el mismo lado corto', function () {
    var g1 = MovilEsfera.geometria({ ancho: 390, alto: 844 });
    var g2 = MovilEsfera.geometria({ ancho: 844, alto: 390 });
    cierto(g1.tesela > 0 && g2.tesela > 0, 'positivas');
    cierto(g2.tesela * 1.25 < 390, 'en apaisado la de delante cabe de alto');
  });

  prueba('proyectar sin puntos da una lista vacía', function () {
    igual(MovilEsfera.proyectar(MovilEsfera.inicial([]), [], MEDIDAS), []);
  });

  prueba('vecina en cada dirección cae hacia ese lado', function () {
    var e = MovilEsfera.inicial(P8);
    var dirs = { derecha: [1, 0], izquierda: [-1, 0], arriba: [0, 1], abajo: [0, -1] };
    Object.keys(dirs).forEach(function (nombre) {
      var j = MovilEsfera.vecina(e, P8, nombre);
      cierto(j !== 0, nombre + ': no encontró vecina');
      var p = MovilEsfera.rotar(e.q, P8[j]);
      var l = Math.hypot(p[0], p[1]);
      var cos = (p[0] * dirs[nombre][0] + p[1] * dirs[nombre][1]) / l;
      cierto(cos >= 0.5, nombre + ': coseno ' + cos);
    });
  });

  prueba('vecina con un punto es él mismo, y sin puntos -1', function () {
    var p1 = MovilEsfera.reparto(1);
    igual(MovilEsfera.vecina(MovilEsfera.inicial(p1), p1, 'derecha'), 0);
    igual(MovilEsfera.vecina(MovilEsfera.inicial([]), [], 'derecha'), -1);
  });
});
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: `MovilEsfera.geometria is not a function` en la sección nueva.

- [ ] **Step 3: Implementar**

En `js/movil-esfera.js`, detrás de `avanzar`, añade:

```js
  /* Dónde y cómo de grande. El lado de referencia es el corto, con el alto
     rebajado a tres cuartos para dejar sitio al pie: así en apaisado la
     tesela de delante (alto = 1,25 × ancho) sigue cabiendo. El centro va un
     poco por encima de la mitad por la misma razón.
     PERSPECTIVA es la distancia del ojo en radios: con 3, la de delante sale
     a 1,5 veces su tamaño plano y la de detrás a 0,75, o sea que la de
     detrás mide la mitad que la de delante. */
  var PERSPECTIVA = 3;

  function geometria(medidas) {
    var lado = Math.min(medidas.ancho, medidas.alto * 0.75);
    return {
      radio: lado * 0.62,
      tesela: lado * 0.56,
      cx: medidas.ancho / 2,
      cy: medidas.alto * 0.45
    };
  }

  function acotar1(n) { return Math.max(-1, Math.min(1, n)); }
  function grados(rad) { return rad * 180 / Math.PI; }

  /* La luz es lineal por tramos y no una curva: 1 delante, 0,5 en el
     ecuador, 0,15 detrás, que es lo que dice la spec, y se lee sin
     calculadora. La inclinación es la mitad del ángulo real de la cara:
     entera, las teselas del borde se verían de canto y dejarían de ser
     fotos. */
  function proyectar(e, puntos, medidas) {
    var g = geometria(medidas);
    var sFrente = PERSPECTIVA / (PERSPECTIVA - 1);
    return puntos.map(function (punto) {
      var p = rotar(e.q, punto);
      var s = PERSPECTIVA / (PERSPECTIVA - p[2]);
      return {
        x: g.cx + p[0] * g.radio * s,
        y: g.cy - p[1] * g.radio * s,
        escala: s / sFrente,
        luz: p[2] >= 0 ? 0.5 + 0.5 * p[2] : 0.5 + 0.35 * p[2],
        z: Math.round((acotar1(p[2]) + 1) * 500),
        inclinacion: {
          x: grados(Math.asin(acotar1(p[1]))) * 0.5,
          y: grados(Math.asin(acotar1(p[0]))) * 0.5
        },
        visible: p[2] > 0
      };
    });
  }

  var DIRECCIONES = {
    derecha: [1, 0], izquierda: [-1, 0], arriba: [0, 1], abajo: [0, -1]
  };

  /* La vecina en una dirección, para las flechas del teclado y la rueda con
     movimiento reducido: de las que caen dentro de un cono de 60° hacia ese
     lado, la más cercana al frente. Se aceptan también las de detrás: son la
     siguiente en esa dirección siguiendo la esfera. */
  function vecina(e, puntos, direccion) {
    var i = delante(e, puntos);
    var d = DIRECCIONES[direccion];
    if (i < 0 || !d) return i;
    var mejor = i;
    var mejorAngulo = Infinity;
    for (var j = 0; j < puntos.length; j++) {
      if (j === i) continue;
      var p = rotar(e.q, puntos[j]);
      var l = Math.hypot(p[0], p[1]);
      if (l < 1e-6) continue;
      if ((p[0] * d[0] + p[1] * d[1]) / l < 0.5) continue;
      var angulo = Math.acos(acotar1(p[2]));
      if (angulo < mejorAngulo) { mejorAngulo = angulo; mejor = j; }
    }
    return mejor;
  }
```

Y añade al `return`: `geometria: geometria, proyectar: proyectar, vecina: vecina`.

- [ ] **Step 4: Correr la suite y ver que pasa**

Esperado: las 10 pruebas nuevas en `PASA`; resumen sin fallos.

- [ ] **Step 5: Commit**

```bash
git add js/movil-esfera.js tests/pruebas-movil-esfera.js
git commit -m "Proyectar la esfera a pantalla y buscar la vecina de cada lado

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `MovilGlobo` — teselas, dibujo y carga

**Files:**
- Create: `js/movil-globo.js`
- Create: `tests/pruebas-movil-globo.js`
- Modify: `tests/test.html`

**Interfaces:**
- Consumes: `MovilEsfera.{numero, reparto, inicial, delante, proyectar, geometria}`.
- Produces (en `window.MovilGlobo`):
  - `init(nodos, proyectos, opciones) → instancia`. `nodos = { raiz, lista, titulo, meta }` (`raiz` es la `.esfera`, `lista` su `<ul>`, `titulo` y `meta` los dos `<span>` del pie). `proyectos` es la lista COMPLETA de `Datos.PROYECTOS` (cada uno con `id`, `titulo`, `categoria`, `portadaUrl`). `opciones = { alAbrir(id), fotograma(cb), reducido, medir() → {ancho, alto} }`; `fotograma` por omisión es `requestAnimationFrame`, `reducido` por omisión sale de `matchMedia('(prefers-reduced-motion: reduce)')`, `medir` por omisión es el `getBoundingClientRect` de `raiz`. Deja la instancia como la vigente del módulo.
  - La instancia: `delante() → id | null`, `estado() → estado de MovilEsfera`, `proyeccion() → Array<{id, x, luz, visible}>` (sólo las teselas en la esfera), `avanzar(ms)`, `redibujar()`.
  - Del módulo, sobre la vigente: `elementoDe(id) → HTMLButtonElement | null`, `redibujar()`.
  - `miniaturaDe(url) → url` — de `…-1500.jpg` a `…-250.jpg`; cualquier otra cosa, igual.
  - En el DOM: cada trabajo es `li.esfera-tesela[data-id][data-indice]` > `button.esfera-boton[aria-label]` > `img` + `span.esfera-velo` + `span.esfera-numero`. Las de detrás llevan `li.detras`, `button[aria-hidden=true][tabindex=-1]`. Foto fallida: `li.sin-foto`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crea `tests/pruebas-movil-globo.js`:

```js
/* La esfera en el DOM. Va sobre `ArnesDom.conElemento`, dentro del documento,
   para que medir y enfocar funcionen. Dos cosas se inyectan siempre:
   - `fotograma` que no hace nada: el reloj lo mueve la prueba con
     `g.avanzar(ms)`, así ninguna prueba depende de `requestAnimationFrame`.
   - `medir` fijo a un teléfono de 390×844, para que la geometría no dependa
     del tamaño de la caja del arnés. */
function globoProyectos() {
  return [
    { id: 'niebla',  titulo: 'Niebla',  categoria: 'editorial', portadaUrl: 'x-niebla-1500.jpg' },
    { id: 'bruma',   titulo: 'Bruma',   categoria: 'editorial', portadaUrl: 'x-bruma-1500.jpg' },
    { id: 'oleaje',  titulo: 'Oleaje',  categoria: 'videoclip', portadaUrl: 'x-oleaje-1500.jpg' },
    { id: 'reflejo', titulo: 'Reflejo', categoria: 'videoclip', portadaUrl: 'x-reflejo-1500.jpg' },
    { id: 'marea',   titulo: 'Marea',   categoria: 'editorial', portadaUrl: 'x-marea-1500.jpg' },
    { id: 'salitre', titulo: 'Salitre', categoria: 'videoclip', portadaUrl: 'x-salitre-1500.jpg' },
    { id: 'espuma',  titulo: 'Espuma',  categoria: 'editorial', portadaUrl: 'x-espuma-1500.jpg' },
    { id: 'resaca',  titulo: 'Resaca',  categoria: 'videoclip', portadaUrl: 'x-resaca-1500.jpg' }
  ];
}

var GLOBO_MARCO =
  '<div style="position:relative;width:390px;height:844px">' +
    '<div class="esfera" id="e"><ul id="l"></ul>' +
    '<p><span id="t"></span><span id="m"></span></p></div>' +
  '</div>';

function conGlobo(fn, opciones, lista) {
  return ArnesDom.conElemento(GLOBO_MARCO, function (marco) {
    var abiertos = [];
    var o = {
      alAbrir: function (id) { abiertos.push(id); },
      fotograma: function () {},
      reducido: false,
      medir: function () { return { ancho: 390, alto: 844 }; }
    };
    Object.keys(opciones || {}).forEach(function (k) { o[k] = opciones[k]; });
    var g = MovilGlobo.init({
      raiz: marco.querySelector('#e'),
      lista: marco.querySelector('#l'),
      titulo: marco.querySelector('#t'),
      meta: marco.querySelector('#m')
    }, lista || globoProyectos(), o);
    return fn(g, marco, abiertos);
  });
}

function teselaDe(marco, id) { return marco.querySelector('li.esfera-tesela[data-id="' + id + '"]'); }

function hastaQuieto(g) {
  for (var i = 0; i < 400 && g.estado().animando; i++) g.avanzar(16);
  return i;
}

describe('MovilGlobo — teselas, dibujo y carga', function () {

  prueba('miniaturaDe cambia la de 1500 por la de 250 y deja el resto', function () {
    igual([MovilGlobo.miniaturaDe('/img/a-portada-1500.jpg'),
           MovilGlobo.miniaturaDe('/img/a-1500.webp'),
           MovilGlobo.miniaturaDe('/img/poster.jpg')],
          ['/img/a-portada-250.jpg', '/img/a-250.webp', '/img/poster.jpg']);
  });

  prueba('pinta una tesela por trabajo, con su id, su índice y su etiqueta', function () {
    conGlobo(function (g, marco) {
      var lis = marco.querySelectorAll('li.esfera-tesela');
      igual(lis.length, 8);
      igual([lis[2].dataset.id, lis[2].dataset.indice], ['oleaje', '2']);
      igual(lis[2].querySelector('button').getAttribute('aria-label'),
            'Abrir el proyecto Oleaje');
      igual(lis[2].querySelector('.esfera-numero').textContent, '03');
    });
  });

  prueba('arranca con el 01 delante y el pie lo nombra', function () {
    conGlobo(function (g, marco) {
      igual(g.delante(), 'niebla');
      igual(marco.querySelector('#t').textContent, 'Niebla');
      igual(marco.querySelector('#m').textContent, 'editorial 01/08');
    });
  });

  prueba('la de delante pide la de 1500 con prioridad y las de detrás la de 250', function () {
    conGlobo(function (g, marco) {
      var img = teselaDe(marco, 'niebla').querySelector('img');
      igual(img.getAttribute('src'), 'x-niebla-1500.jpg');
      igual(img.getAttribute('fetchpriority'), 'high');
      var detras = marco.querySelector('li.esfera-tesela.detras');
      cierto(detras, 'con 8 alguna tiene que quedar detrás');
      cierto(/-250\.jpg$/.test(detras.querySelector('img').getAttribute('src')),
             detras.querySelector('img').getAttribute('src'));
    });
  });

  prueba('las de detrás no se tocan, no se tabulan y el lector no las lee', function () {
    conGlobo(function (g, marco) {
      var detras = marco.querySelector('li.esfera-tesela.detras');
      var b = detras.querySelector('button');
      igual([b.getAttribute('aria-hidden'), b.tabIndex], ['true', -1]);
      var alante = teselaDe(marco, 'niebla').querySelector('button');
      igual([alante.getAttribute('aria-hidden'), alante.tabIndex], [null, 0]);
    });
  });

  prueba('la de delante está más arriba en el orden y sin velo', function () {
    conGlobo(function (g, marco) {
      var alante = teselaDe(marco, 'niebla');
      var detras = marco.querySelector('li.esfera-tesela.detras');
      cierto(Number(alante.style.zIndex) > Number(detras.style.zIndex), 'z-index');
      igual(Number(alante.querySelector('.esfera-velo').style.opacity), 0);
      cierto(Number(detras.querySelector('.esfera-velo').style.opacity) > 0.5, 'velo detrás');
    });
  });

  prueba('una foto que falla deja la tesela marcada sin foto', function () {
    conGlobo(function (g, marco) {
      var li = teselaDe(marco, 'bruma');
      li.querySelector('img').dispatchEvent(new Event('error'));
      cierto(li.classList.contains('sin-foto'));
    });
  });

  prueba('elementoDe da el botón del trabajo, y null si no existe', function () {
    conGlobo(function (g, marco) {
      igual(MovilGlobo.elementoDe('bruma'),
            teselaDe(marco, 'bruma').querySelector('button'));
      igual(MovilGlobo.elementoDe('no-existe'), null);
    });
  });

  /* Review Focus 3: girar el teléfono. */
  prueba('redibujar usa las medidas nuevas y conserva la de delante', function () {
    var medidas = { ancho: 390, alto: 844 };
    conGlobo(function (g, marco) {
      var antes = teselaDe(marco, 'niebla').style.width;
      medidas = { ancho: 844, alto: 390 };
      MovilGlobo.redibujar();
      cierto(teselaDe(marco, 'niebla').style.width !== antes, 'no cambió de tamaño');
      igual(g.delante(), 'niebla');
    }, { medir: function () { return medidas; } });
  });

  prueba('sin trabajos no pinta teselas, no lanza y delante es null', function () {
    conGlobo(function (g, marco) {
      igual(marco.querySelectorAll('li').length, 0);
      igual(g.delante(), null);
      igual(marco.querySelector('#t').textContent, '');
      MovilGlobo.redibujar();
    }, {}, []);
  });
});
```

En `tests/test.html`, detrás de `movil-esfera.js`:

```html
<script src="../js/movil-globo.js"></script>
```

y detrás de `pruebas-movil-esfera.js`:

```html
<script src="pruebas-movil-globo.js"></script>
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: `MovilGlobo is not defined` en la sección nueva.

- [ ] **Step 3: Implementar**

Crea `js/movil-globo.js`:

```js
window.MovilGlobo = (function () {

  /* La esfera de la portada móvil en el DOM: pinta una tesela por trabajo,
     le aplica lo que calcula `MovilEsfera` (js/movil-esfera.js) y atiende el
     dedo, la rueda, el teclado y la ruta. Toda la matemática vive allí; aquí
     sólo se traduce a estilos y a eventos.

     Sustituye a la rejilla (`js/movil-hoja.js`, retirado el 2026-09-29). */

  /* Por encima de este brillo la tesela ya está lo bastante cerca del frente
     como para merecer la foto de 1500. Una vez cambiada no vuelve a la de
     250: la grande ya está en la caché y bajar sería gastar sin ganar nada. */
  var LUZ_GRANDE = 0.7;

  var actual = null;

  /* La portada llega en 1500; su miniatura de 250 sale del mismo nombre,
     que es el que fija `herramientas/derivar_imagenes.py`. Un póster de
     vídeo u otra ruta sin ese sufijo se queda como está: pedir la grande
     es peor que no tener miniatura, pero mejor que una ruta inventada. */
  function miniaturaDe(url) {
    return /-1500\.\w+$/.test(url) ? url.replace(/-1500\.(\w+)$/, '-250.$1') : url;
  }

  function init(nodos, proyectos, opciones) {
    actual = crear(nodos, proyectos, opciones || {});
    return actual;
  }

  function crear(nodos, proyectos, opciones) {
    var raiz = nodos.raiz;
    var lista = nodos.lista;
    var fotograma = opciones.fotograma || function (cb) { return window.requestAnimationFrame(cb); };
    var reducido = opciones.reducido !== undefined
      ? opciones.reducido
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var medir = opciones.medir || function () {
      var r = raiz.getBoundingClientRect();
      return { ancho: r.width, alto: r.height };
    };
    var alAbrir = opciones.alAbrir || function () {};

    var teselas = [];     // por índice en la lista COMPLETA
    var visibles = [];    // índices en la lista completa, en el orden de `puntos`
    var puntos = [];
    var estado = window.MovilEsfera.inicial([]);
    var categoria = null;
    var primeraGrande = true;

    function total() { return window.MovilEsfera.numero(proyectos.length - 1); }

    function pintar() {
      lista.innerHTML = '';
      teselas = proyectos.map(function (p, i) {
        var li = document.createElement('li');
        li.className = 'esfera-tesela';
        li.dataset.id = p.id;
        li.dataset.indice = String(i);

        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'esfera-boton';
        boton.setAttribute('aria-label', 'Abrir el proyecto ' + p.titulo);

        var img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        img.src = miniaturaDe(p.portadaUrl);
        /* Si la foto no llega, la tesela se queda en gris con su número: un
           hueco numerado se lee como «falta esa», no como «la web está rota».
           Cambiar a la grande quita la marca, por si la pequeña falló y la
           grande sí llega. */
        img.addEventListener('error', function () { li.classList.add('sin-foto'); });
        img.addEventListener('load', function () { li.classList.remove('sin-foto'); });

        var velo = document.createElement('span');
        velo.className = 'esfera-velo';

        var num = document.createElement('span');
        num.className = 'esfera-numero';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = window.MovilEsfera.numero(i);

        boton.appendChild(img);
        boton.appendChild(velo);
        boton.appendChild(num);
        li.appendChild(boton);
        lista.appendChild(li);
        return li;
      });
    }

    /* Rehace la esfera para una categoría (`null` = todas). Las de otras
       categorías salen con `hidden` y las que quedan se reparten por TODA la
       superficie, conservando su número de la lista completa. */
    function reconstruir(cat) {
      categoria = cat;
      visibles = [];
      proyectos.forEach(function (p, i) {
        var dentro = cat === null || p.categoria === cat;
        teselas[i].hidden = !dentro;
        if (dentro) visibles.push(i);
      });
      puntos = window.MovilEsfera.reparto(visibles.length);
      estado = window.MovilEsfera.inicial(puntos);
      dibujar();
      anunciar();
    }

    function cambiarAGrande(li, p) {
      var img = li.querySelector('img');
      if (img.dataset.grande) return;
      img.dataset.grande = '1';
      if (primeraGrande) {
        img.setAttribute('fetchpriority', 'high');
        primeraGrande = false;
      }
      img.src = p.portadaUrl;
    }

    function dibujar() {
      if (!visibles.length) return;
      var medidas = medir();
      var g = window.MovilEsfera.geometria(medidas);
      var ancho = g.tesela;
      var alto = g.tesela * 1.25;
      var proy = window.MovilEsfera.proyectar(estado, puntos, medidas);
      proy.forEach(function (pr, k) {
        var i = visibles[k];
        var li = teselas[i];
        li.style.width = ancho.toFixed(1) + 'px';
        li.style.height = alto.toFixed(1) + 'px';
        /* Todo en una escritura. `perspective()` dentro del propio `transform`
           da la curva a esta tesela sola, sin `preserve-3d` en el contenedor:
           en Safari de iPhone el 3D anidado parpadea y cruza capas. */
        li.style.transform =
          'translate3d(' + (pr.x - ancho / 2).toFixed(1) + 'px,' +
                           (pr.y - alto / 2).toFixed(1) + 'px,0) ' +
          'scale(' + pr.escala.toFixed(4) + ') ' +
          'perspective(' + Math.round(ancho * 3) + 'px) ' +
          'rotateY(' + pr.inclinacion.y.toFixed(2) + 'deg) ' +
          'rotateX(' + pr.inclinacion.x.toFixed(2) + 'deg)';
        li.style.zIndex = String(pr.z);
        li.querySelector('.esfera-velo').style.opacity = (1 - pr.luz).toFixed(3);

        var detras = !pr.visible;
        if (li.classList.contains('detras') !== detras || !li.dataset.pintada) {
          li.dataset.pintada = '1';
          li.classList.toggle('detras', detras);
          var b = li.querySelector('button');
          if (detras) { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
          else { b.removeAttribute('aria-hidden'); b.removeAttribute('tabindex'); }
        }
        if (pr.luz > LUZ_GRANDE) cambiarAGrande(li, proyectos[i]);
      });
    }

    function indiceDelante() {
      var k = window.MovilEsfera.delante(estado, puntos);
      return k < 0 ? -1 : visibles[k];
    }

    /* El pie cambia cuando la esfera se ASIENTA, no mientras gira: el
       movimiento ya lo pone el giro, y un título que parpadea con cada
       tesela que pasa no se puede leer. */
    function anunciar() {
      var i = indiceDelante();
      if (i < 0) {
        nodos.titulo.textContent = '';
        nodos.meta.textContent = '';
        return;
      }
      var p = proyectos[i];
      nodos.titulo.textContent = p.titulo;
      nodos.meta.textContent = p.categoria + ' ' + window.MovilEsfera.numero(i) + '/' + total();
    }

    function avanzar(ms) {
      estado = window.MovilEsfera.avanzar(estado, ms, puntos);
      dibujar();
      if (!estado.animando) anunciar();
    }

    function elementoDe(id) {
      for (var i = 0; i < proyectos.length; i++) {
        if (proyectos[i].id === id) return teselas[i].querySelector('button');
      }
      return null;
    }

    pintar();
    reconstruir(null);

    return {
      delante: function () { var i = indiceDelante(); return i < 0 ? null : proyectos[i].id; },
      estado: function () { return estado; },
      proyeccion: function () {
        return window.MovilEsfera.proyectar(estado, puntos, medir()).map(function (pr, k) {
          return { id: proyectos[visibles[k]].id, x: pr.x, luz: pr.luz, visible: pr.visible };
        });
      },
      avanzar: avanzar,
      redibujar: dibujar,
      elementoDe: elementoDe
    };
  }

  function elementoDe(id) { return actual ? actual.elementoDe(id) : null; }
  function redibujar() { if (actual) actual.redibujar(); }

  return {
    miniaturaDe: miniaturaDe,
    init: init,
    elementoDe: elementoDe,
    redibujar: redibujar
  };
})();
```

(`fotograma`, `reducido` y `alAbrir` aún no se usan: los consume la Tarea 5.)

- [ ] **Step 4: Correr la suite y ver que pasa**

Esperado: las 10 pruebas de la sección en `PASA`; el resto de la suite sigue en verde.

- [ ] **Step 5: Commit**

```bash
git add js/movil-globo.js tests/pruebas-movil-globo.js tests/test.html
git commit -m "Pintar la esfera: teselas, profundidad y carga por cercania al frente

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `MovilGlobo` — dedo, rueda y teclado

**Files:**
- Modify: `js/movil-globo.js`
- Modify: `tests/pruebas-movil-globo.js`

**Interfaces:**
- Consumes: Tarea 4, `MovilEsfera.{arrastrar, soltar, apuntar, vecina, traer}`.
- Produces: el comportamiento de puntero, rueda y teclado sobre `raiz`, con `alAbrir(id)` para abrir. Del módulo: `congelar()` y `descongelar()` sobre la instancia vigente (mientras está congelada, ni gestos ni animación).

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-globo.js`:

```js
describe('MovilGlobo — dedo, rueda y teclado', function () {

  function puntero(el, tipo, x, y) {
    el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true }));
  }
  function botonDe(marco, id) { return teselaDe(marco, id).querySelector('button'); }
  function lateralVisible(g) {
    var delante = g.delante();
    return g.proyeccion().filter(function (p) { return p.visible && p.id !== delante; })[0];
  }

  prueba('un toque en la de delante la abre', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual(abiertos, ['niebla']);
    });
  });

  /* Review Focus 1: con la captura de puntero, el `pointerup` llega a la
     raíz y no al botón. La tesela se decide en el `pointerdown`. */
  prueba('un pointerup que llega a la raíz abre igual', function () {
    conGlobo(function (g, marco, abiertos) {
      puntero(botonDe(marco, 'niebla'), 'pointerdown', 195, 380);
      puntero(marco.querySelector('#e'), 'pointerup', 196, 381);
      igual(abiertos, ['niebla']);
    });
  });

  prueba('un toque en una lateral no la abre: la trae delante', function () {
    conGlobo(function (g, marco, abiertos) {
      var lat = lateralVisible(g);
      cierto(lat, 'con 8 tiene que haber alguna lateral visible');
      var b = botonDe(marco, lat.id);
      puntero(b, 'pointerdown', 300, 300);
      puntero(b, 'pointerup', 300, 300);
      igual(abiertos, []);
      cierto(hastaQuieto(g) < 400, 'no se paró');
      igual(g.delante(), lat.id);
    });
  });

  prueba('arrastrar gira sin abrir, y al soltar se asienta en una portada', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      var antes = g.estado().q;
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 245, 380);
      puntero(b, 'pointermove', 320, 390);
      puntero(b, 'pointerup', 320, 390);
      igual(abiertos, []);
      cierto(MovilEsfera.distancia(antes, g.estado().q) > 0.3, 'no giró');
      cierto(hastaQuieto(g) < 400, 'no se paró');
      var alante = g.proyeccion().filter(function (p) { return p.id === g.delante(); })[0];
      cierto(Math.abs(alante.luz - 1) < 1e-3, 'la de delante no quedó centrada');
    });
  });

  prueba('un temblor por debajo del umbral sigue siendo un toque', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 199, 383);
      puntero(b, 'pointerup', 199, 383);
      igual(abiertos, ['niebla']);
    });
  });

  prueba('pointercancel no abre nunca', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointercancel', 195, 380);
      igual(abiertos, []);
    });
  });

  prueba('con movimiento reducido, soltar asienta sin animar', function () {
    conGlobo(function (g, marco) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 320, 380);
      puntero(b, 'pointerup', 320, 380);
      igual(g.estado().animando, false);
    }, { reducido: true });
  });

  /* Un clic de ratón o de dedo trae `detail` ≥ 1 y ya lo atendió el
     `pointerup`; sólo el de teclado (Intro, espacio) trae `detail` 0. */
  prueba('Intro sobre la de delante la abre; un clic de puntero no abre dos veces', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      igual(abiertos, []);
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      igual(abiertos, ['niebla']);
    });
  });

  prueba('la flecha derecha trae la vecina de la derecha', function () {
    conGlobo(function (g, marco) {
      var antes = g.proyeccion();
      var xDelante = antes.filter(function (p) { return p.id === 'niebla'; })[0].x;
      marco.querySelector('#e').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      var nueva = g.delante();
      cierto(nueva !== 'niebla', 'no cambió');
      var xNueva = antes.filter(function (p) { return p.id === nueva; })[0].x;
      cierto(xNueva > xDelante, 'la nueva no estaba a la derecha');
      igual(document.activeElement, botonDe(marco, nueva));
    }, { reducido: true });
  });

  prueba('la rueda gira la esfera', function () {
    conGlobo(function (g, marco) {
      var antes = g.estado().q;
      marco.querySelector('#e').dispatchEvent(
        new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
      cierto(MovilEsfera.distancia(antes, g.estado().q) > 0.01, 'no giró');
    });
  });

  prueba('congelada no atiende toques; al descongelar vuelve', function () {
    conGlobo(function (g, marco, abiertos) {
      var b = botonDe(marco, 'niebla');
      MovilGlobo.congelar();
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual(abiertos, []);
      MovilGlobo.descongelar();
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointerup', 195, 380);
      igual(abiertos, ['niebla']);
    });
  });

  prueba('con un solo trabajo, arrastrar y soltar vuelve a dejarlo delante', function () {
    conGlobo(function (g, marco) {
      var b = botonDe(marco, 'niebla');
      puntero(b, 'pointerdown', 195, 380);
      puntero(b, 'pointermove', 300, 380);
      puntero(b, 'pointerup', 300, 380);
      hastaQuieto(g);
      var p = g.proyeccion()[0];
      cierto(Math.abs(p.luz - 1) < 1e-3, 'luz ' + p.luz);
    }, {}, globoProyectos().slice(0, 1));
  });
});
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: las pruebas de toque y teclado en `FALLA` (nada abre) y `MovilGlobo.congelar is not a function`.

- [ ] **Step 3: Implementar**

En `js/movil-globo.js`, añade arriba, junto a `LUZ_GRANDE`:

```js
  /* Menos de esto entre el `pointerdown` y el `pointerup` es un toque, no un
     arrastre. 8 px absorben el temblor de un dedo sin tragarse un giro corto. */
  var UMBRAL_TOQUE = 8;
  /* Con un solo trabajo no hay a dónde girar: el arrastre se resiste y el
     muelle lo devuelve. */
  var RESISTENCIA_SOLO = 0.35;
```

Dentro de `crear`, detrás de `var primeraGrande = true;`:

```js
    var gesto = null;
    var congelado = false;
    var pendiente = false;
    var ultimoT = null;
```

Dentro de `crear`, detrás de la función `avanzar`, añade:

```js
    /* El reloj sólo corre mientras hay movimiento: quieta, la esfera no gasta
       ni un fotograma. */
    function programar() {
      if (pendiente || congelado || !estado.animando) return;
      pendiente = true;
      fotograma(function (t) {
        pendiente = false;
        var ms = ultimoT === null ? 16 : Math.max(0, Math.min(64, t - ultimoT));
        ultimoT = t;
        avanzar(ms);
        if (estado.animando) programar();
        else ultimoT = null;
      });
    }

    function soltarAhora(msDesdeUltimo) {
      estado = window.MovilEsfera.soltar(estado, puntos,
        { reducido: reducido, msDesdeUltimo: msDesdeUltimo });
      dibujar();
      if (estado.animando) programar();
      else anunciar();
    }

    function llevarA(k) {
      estado = window.MovilEsfera.apuntar(estado, puntos[k], reducido);
      dibujar();
      if (estado.animando) programar();
      else anunciar();
    }

    /* Qué hace un toque sobre la tesela de índice `i` (lista completa): la
       de delante se abre; una lateral visible se trae delante, sin abrirla,
       para que nunca se abra por accidente algo que se veía pequeño y de
       lado; cualquier otra cosa (fondo, una de detrás) sólo asienta la
       esfera, por si el toque la pilló girando. */
    function tocar(i) {
      var k = visibles.indexOf(i);
      if (k < 0) { soltarAhora(Infinity); return; }
      if (i === indiceDelante()) {
        estado = window.MovilEsfera.traer(estado, puntos[k]);
        dibujar();
        anunciar();
        alAbrir(proyectos[i].id);
        return;
      }
      var pr = window.MovilEsfera.proyectar(estado, [puntos[k]], medir())[0];
      if (pr.visible) llevarA(k);
      else soltarAhora(Infinity);
    }

    function indiceDeEvento(e) {
      var li = e.target && e.target.closest ? e.target.closest('li.esfera-tesela') : null;
      return li && lista.contains(li) ? Number(li.dataset.indice) : -1;
    }

    /* El toque se decide con `pointerdown`/`pointerup` y NO con `click`, y la
       tesela sale del `pointerdown`. Es la lección de
       `js/diagnostico-toques.js` (retirado con la rejilla): si el `down` y el
       `up` caen en elementos distintos, el navegador manda el `click` al
       ancestro común y el botón no se entera. En una esfera que se mueve bajo
       el dedo eso pasaría a menudo; con la captura de abajo, el `up` llega
       SIEMPRE a la raíz. */
    raiz.addEventListener('pointerdown', function (e) {
      if (congelado || !visibles.length) return;
      gesto = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
                t: e.timeStamp, indice: indiceDeEvento(e), movido: false };
      /* Pillar la esfera en marcha la para, como una peonza bajo el dedo. */
      estado = { q: estado.q, vel: { h: 0, v: 0 }, objetivo: null, animando: false };
      try { raiz.setPointerCapture(e.pointerId); } catch (sinPunteroActivo) {}
    });

    raiz.addEventListener('pointermove', function (e) {
      if (!gesto) return;
      if (!gesto.movido &&
          Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0) < UMBRAL_TOQUE) return;
      gesto.movido = true;
      var f = visibles.length === 1 ? RESISTENCIA_SOLO : 1;
      estado = window.MovilEsfera.arrastrar(estado,
        (e.clientX - gesto.x) * f, (e.clientY - gesto.y) * f,
        medir().ancho, e.timeStamp - gesto.t);
      gesto.x = e.clientX;
      gesto.y = e.clientY;
      gesto.t = e.timeStamp;
      dibujar();
    });

    raiz.addEventListener('pointerup', function (e) {
      if (!gesto) return;
      var g = gesto;
      gesto = null;
      if (!g.movido && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < UMBRAL_TOQUE) {
        tocar(g.indice);
        return;
      }
      soltarAhora(e.timeStamp - g.t);
    });

    /* Una llamada entrante o el gesto de sistema del borde se quedan el dedo:
       nunca es un toque, y la esfera tiene que asentarse igual. */
    raiz.addEventListener('pointercancel', function () {
      if (!gesto) return;
      gesto = null;
      soltarAhora(Infinity);
    });

    /* Sólo el clic de TECLADO (Intro o espacio sobre un botón) trae
       `detail` 0; el de dedo o ratón ya lo atendió `pointerup`. */
    lista.addEventListener('click', function (e) {
      if (e.detail !== 0 || congelado) return;
      var i = indiceDeEvento(e);
      if (i >= 0) tocar(i);
    });

    var TECLAS = { ArrowRight: 'derecha', ArrowLeft: 'izquierda',
                   ArrowUp: 'arriba', ArrowDown: 'abajo' };

    raiz.addEventListener('keydown', function (e) {
      var dir = TECLAS[e.key];
      if (!dir || congelado || !visibles.length) return;
      e.preventDefault();
      var k = window.MovilEsfera.vecina(estado, puntos, dir);
      if (k < 0) return;
      llevarA(k);
      teselas[visibles[k]].querySelector('button').focus({ preventScroll: true });
    });

    /* La rueda, para la ventana de escritorio estrechada: gira en vertical, y
       con mayúsculas en horizontal. Con movimiento reducido cada golpe salta
       a la vecina, porque girar un poco y volver al sitio sería movimiento
       sin resultado. */
    raiz.addEventListener('wheel', function (e) {
      if (congelado || !visibles.length) return;
      e.preventDefault();
      var dx = e.shiftKey ? -e.deltaY : -e.deltaX;
      var dy = e.shiftKey ? 0 : -e.deltaY;
      if (reducido) {
        var dir = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? 'derecha' : 'izquierda')
          : (dy < 0 ? 'abajo' : 'arriba');
        llevarA(window.MovilEsfera.vecina(estado, puntos, dir));
        return;
      }
      estado = window.MovilEsfera.arrastrar(estado, dx * 0.5, dy * 0.5, medir().ancho, 16);
      soltarAhora(0);
    }, { passive: false });
```

Amplía el objeto que devuelve `crear`:

```js
      congelar: function () { congelado = true; gesto = null; },
      descongelar: function () { congelado = false; programar(); }
```

Y en el módulo:

```js
  function congelar() { if (actual) actual.congelar(); }
  function descongelar() { if (actual) actual.descongelar(); }
```

añadiendo `congelar: congelar, descongelar: descongelar` al `return` del módulo.

Comprobación de la rueda con movimiento reducido: rueda abajo (`deltaY > 0`) es `dy < 0`, como arrastrar hacia arriba; arrastrar hacia arriba sube la de delante y trae la de abajo, así que la vecina es `'abajo'`. Así está escrito.

- [ ] **Step 4: Correr la suite y ver que pasa**

Esperado: las 12 pruebas nuevas en `PASA` y todo lo demás en verde. Si «la flecha derecha…» falla en el foco, comprueba que la caja del arnés está en el documento (`ArnesDom.conElemento` lo garantiza) y que la tesela nueva no ha quedado con `tabindex=-1`: con `reducido: true`, `llevarA` dibuja antes de enfocar.

- [ ] **Step 5: Commit**

```bash
git add js/movil-globo.js tests/pruebas-movil-globo.js
git commit -m "Girar la esfera con el dedo, la rueda y las flechas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `MovilGlobo` — la ruta: filtro y vuelta del visor

**Files:**
- Modify: `js/movil-globo.js`
- Modify: `tests/pruebas-movil-globo.js`

**Interfaces:**
- Consumes: Tareas 4 y 5. Las rutas del Router son `{ tipo: 'todos'|'categoria'|'proyecto'|'contacto', valor, pieza }`.
- Produces: `MovilGlobo.aplicar(ruta)` sobre la instancia vigente.
  - `proyecto`: apunta `ruta.valor` como el último trabajo abierto. No mueve nada (el visor tapa la esfera).
  - `contacto`: no hace nada.
  - `todos` / `categoria`: si la categoría cambió, reconstruye la esfera con esa categoría (la primera portada delante); si había un trabajo apuntado y está en la esfera, lo trae delante sin animar, y si el foco estaba dentro de la esfera, se lo da a su botón.

- [ ] **Step 1: Escribir las pruebas que fallan**

Añade al final de `tests/pruebas-movil-globo.js`:

```js
describe('MovilGlobo — la ruta', function () {

  var TODOS = { tipo: 'todos', valor: null, pieza: null };
  function categoria(c) { return { tipo: 'categoria', valor: c, pieza: null }; }
  function proyecto(id) { return { tipo: 'proyecto', valor: id, pieza: 1 }; }
  function enLaEsfera(marco) {
    return Array.prototype.filter.call(marco.querySelectorAll('li.esfera-tesela'),
      function (li) { return !li.hidden; }).map(function (li) { return li.dataset.id; });
  }

  prueba('una categoría deja sólo las suyas y conserva los números', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(enLaEsfera(marco), ['oleaje', 'reflejo', 'salitre', 'resaca']);
      igual(teselaDe(marco, 'oleaje').querySelector('.esfera-numero').textContent, '03');
      igual(g.delante(), 'oleaje');
      igual(marco.querySelector('#m').textContent, 'videoclip 03/08');
    });
  });

  prueba('las de la categoría se reparten por toda la esfera', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.proyeccion().length, 4);
    });
  });

  prueba('volver a todos las devuelve todas', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      MovilGlobo.aplicar(TODOS);
      igual(enLaEsfera(marco).length, 8);
    });
  });

  /* Review Focus 4. */
  prueba('una categoría sin trabajos deja la esfera vacía sin lanzar', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('cortometraje'));
      igual(enLaEsfera(marco), []);
      igual(g.delante(), null);
      igual(marco.querySelector('#t').textContent, '');
    });
  });

  prueba('una categoría con un solo trabajo lo deja delante', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.delante(), 'oleaje');
    }, {}, globoProyectos().slice(0, 3));
  });

  prueba('abrir un proyecto no toca el filtro ni la esfera', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      var q = g.estado().q;
      MovilGlobo.aplicar(proyecto('reflejo'));
      igual(enLaEsfera(marco).length, 4);
      igual(g.estado().q, q);
    });
  });

  prueba('el contacto no toca el filtro', function () {
    conGlobo(function (g, marco) {
      MovilGlobo.aplicar(categoria('videoclip'));
      MovilGlobo.aplicar({ tipo: 'contacto', valor: null, pieza: null });
      igual(enLaEsfera(marco).length, 4);
    });
  });

  /* Review Focus 5: quien llega por un enlace a un trabajo, o se mueve de
     trabajo dentro del visor, al cerrar lo encuentra delante. */
  prueba('al salir del visor trae delante el último trabajo abierto', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(proyecto('bruma'));
      MovilGlobo.aplicar(proyecto('marea'));
      MovilGlobo.aplicar(TODOS);
      igual(g.delante(), 'marea');
      igual(g.estado().animando, false);
    });
  });

  prueba('si el último abierto no es de la categoría, delante queda la primera', function () {
    conGlobo(function (g) {
      MovilGlobo.aplicar(proyecto('bruma'));
      MovilGlobo.aplicar(categoria('videoclip'));
      igual(g.delante(), 'oleaje');
    });
  });

  prueba('al volver, si el foco estaba en la esfera pasa a la de delante', function () {
    conGlobo(function (g, marco) {
      teselaDe(marco, 'niebla').querySelector('button').focus();
      MovilGlobo.aplicar(proyecto('marea'));
      MovilGlobo.aplicar(TODOS);
      igual(document.activeElement, teselaDe(marco, 'marea').querySelector('button'));
    });
  });
});
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: `MovilGlobo.aplicar is not a function`.

- [ ] **Step 3: Implementar**

Dentro de `crear`, junto a las demás variables:

```js
    var recordado = null;
```

Dentro de `crear`, detrás de `elementoDe`:

```js
    /* La misma regla que tenía `MovilHoja.filtrarDesdeRuta`: abrir un
       proyecto o la hoja de contacto no dice nada del filtro. Lo que sí hace
       abrir un proyecto es apuntarlo, porque el visor puede moverse de
       trabajo por su eje horizontal y al cerrar hay que dejar delante el
       ÚLTIMO, no el que se tocó.

       El foco se mueve sólo si ya estaba dentro de la esfera: es el caso del
       visor que al cerrar devuelve el foco a la tesela que lo abrió
       (js/movil-visor.js), y esta función corre DESPUÉS de aquélla porque
       index.html la suscribe después. Si el foco estaba en otro sitio, no se
       le roba. */
    function aplicar(ruta) {
      if (ruta.tipo === 'proyecto') { recordado = ruta.valor; return; }
      if (ruta.tipo === 'contacto') return;
      var cat = ruta.tipo === 'categoria' ? ruta.valor : null;
      if (cat !== categoria) reconstruir(cat);
      if (recordado === null) return;
      var id = recordado;
      recordado = null;
      var i = -1;
      for (var n = 0; n < proyectos.length; n++) if (proyectos[n].id === id) i = n;
      var k = visibles.indexOf(i);
      if (k < 0) return;
      var enfocado = raiz.contains(document.activeElement);
      estado = window.MovilEsfera.traer(estado, puntos[k]);
      dibujar();
      anunciar();
      if (enfocado) teselas[i].querySelector('button').focus({ preventScroll: true });
    }
```

Añade `aplicar: aplicar` al objeto que devuelve `crear`, y al módulo:

```js
  function aplicar(ruta) { if (actual) actual.aplicar(ruta); }
```

con `aplicar: aplicar` en su `return`.

- [ ] **Step 4: Correr la suite y ver que pasa**

Esperado: las 10 pruebas nuevas en `PASA`; todo en verde.

- [ ] **Step 5: Commit**

```bash
git add js/movil-globo.js tests/pruebas-movil-globo.js
git commit -m "Hacer que la esfera siga la ruta: filtro y vuelta del visor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: El contacto vuelve a ser capa en el móvil

**Files:**
- Modify: `js/contacto.js`
- Modify: `tests/pruebas-contacto.js` (desde el comentario «El lado móvil…», sobre la línea 106, hasta la prueba «cruzar a móvil con la hoja abierta la desmonta», inclusive)
- Modify: `css/luque.css` (bloque «EN EL MÓVIL NO ES UNA HOJA», sobre las líneas 850–876)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `Contacto` sin `colocar`. `preparar(nodo, { congelar, descongelar })` (sin `hoja`). `#/contacto` abre la capa en los dos lados. La Tarea 8 quita las llamadas a `Contacto.colocar` de `index.html` y pasa a `congelar` también `MovilGlobo.congelar`.

- [ ] **Step 1: Cambiar las pruebas**

En `tests/pruebas-contacto.js`, borra el comentario «El lado móvil: la sección se muda…», `MARCADO_MOVIL`, `conLados` y las cuatro pruebas que los usan («en el móvil la sección se cuelga al final…», «al volver a escritorio la sección vuelve…», «en el móvil la ruta de contacto no abre ninguna capa», «cruzar a móvil con la hoja abierta la desmonta»). Deja «sin preparar no hace nada ni lanza». En su lugar, delante de esa última, añade:

```js
  /* Desde la esfera (2026-09-29) el móvil no tiene recorrido que bajar: el
     contacto es la misma capa que en escritorio, y `colocar` ya no existe. */
  prueba('ya no hay colocar: la capa es la misma en los dos lados', function () {
    igual(typeof Contacto.colocar, 'undefined');
  });
```

- [ ] **Step 2: Correr la suite y ver que falla**

Esperado: `FALLA  ya no hay colocar…` (hoy `colocar` es una función).

- [ ] **Step 3: Simplificar `js/contacto.js`**

1. Sustituye el párrafo «En el MÓVIL no es una hoja: es el final del recorrido…» del comentario de cabecera por:

```js
     En el MÓVIL es la MISMA capa, abierta desde la pastilla «Contacto» que
     flota sobre la esfera (index.html, `.esfera-contacto`). Hasta el
     2026-09-29 se mudaba al pie de la rejilla, porque la portada era scroll;
     la esfera ocupa la pantalla entera y ya no hay pie al que bajar.
```

2. Borra las variables `lado` y `sitioOriginal`.
3. En `preparar`, borra `ganchos.hoja = null;`, la línea `if (opciones.hoja) ganchos.hoja = opciones.hoja;`, `lado = 'escritorio';` y la asignación de `sitioOriginal`. Cambia la última frase de su comentario («`opciones.hoja` es el contenedor móvil…») por nada.
4. Borra la función `colocar` entera con su comentario.
5. En `aplicar`, borra el bloque `if (lado === 'movil') { … }` con su comentario.
6. En `init`, quita `hoja: document.getElementById('hoja'),` y la frase «`Movil.init` también corre antes, así que `colocar` ya ha decidido el lado.» del último comentario.
7. En el `return`, quita `colocar: colocar,`.

- [ ] **Step 4: Quitar el CSS del contacto dentro del recorrido**

En `css/luque.css`, sustituye el bloque que empieza en `/* EN EL MÓVIL NO ES UNA HOJA: …` y acaba en `body.es-movil .contacto-volver{ display:none; }` por:

```css
  /* En el móvil es la misma capa que en escritorio (js/contacto.js). Sólo
     cambian los tamaños: el titular y el correo se ajustan al ancho de un
     teléfono. «Volver a los trabajos» se queda visible: en un teléfono no hay
     Escape ni barra, y es la única salida. */
  body.es-movil .contacto{ padding:88px 24px calc(48px + env(safe-area-inset-bottom)); }
  body.es-movil .contacto-titulo{ font-size:clamp(2.4rem, 13vw, 4rem); }
  body.es-movil .contacto-correo{ margin-left:-12px; padding:10px 12px; font-size:clamp(1.15rem, 5.4vw, 1.6rem); }
  body.es-movil .contacto-datos{ max-width:none; }
```

- [ ] **Step 5: Correr la suite y ver que pasa**

Esperado: la sección de contacto en verde. **Atención:** `index.html` todavía llama a `Contacto.colocar`; eso no lo ve la suite y lo arregla la Tarea 8. No abras la web entre esta tarea y la siguiente esperando que funcione.

- [ ] **Step 6: Commit**

```bash
git add js/contacto.js tests/pruebas-contacto.js css/luque.css
git commit -m "Devolver al contacto movil su forma de capa

La esfera ocupa la pantalla entera y ya no hay pie de recorrido al que
mudar la seccion. index.html deja de llamar a colocar en la tarea
siguiente.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Enchufar la esfera y retirar la rejilla

**Files:**
- Modify: `index.html` (sección `.hoja`, sobre las líneas 206–250; scripts, sobre 460–520; arranque, sobre 530–720)
- Modify: `tests/test.html`
- Modify: `css/luque.css` (bloques `PORTADA MÓVIL — la hoja` y de la rejilla, sobre 1270–1385)
- Modify: `js/movil-puerta.js`, `tests/pruebas-movil-puerta.js`, `tests/pruebas-movil-puerta-async.js`
- Modify: `js/visor-origen.js`
- Modify: `js/ficha-dato.js` (un comentario)
- Delete: `js/movil-hoja.js`, `tests/pruebas-movil-hoja-rejilla.js`, `tests/pruebas-movil-hoja-filtrar.js`, `js/diagnostico-toques.js`

**Interfaces:**
- Consumes: `MovilGlobo.{init, aplicar, elementoDe, redibujar, congelar, descongelar}`, `Contacto` sin `colocar`.
- Produces: la web móvil con la esfera. En el DOM: `#esfera` (`.esfera`), `#esferaLista`, `#esferaTitulo`, `#esferaMeta`, `a.esfera-contacto[href="#/contacto"]`.

- [ ] **Step 1: La puerta descubre la esfera**

En `js/movil-puerta.js`, renombra el tercer parámetro de `entrada` de `rejilla` a `esfera` (firma, `setAttribute`, `removeAttribute`) y, en los comentarios, «la rejilla» por «la esfera» donde se refiera a lo que hay detrás de la puerta. La primera línea del comentario de cabecera queda: «La puerta del hero: el amarillo con LUQUE! que hay delante de la esfera y que se cruza una vez por visita.»

En `tests/pruebas-movil-puerta.js` y `tests/pruebas-movil-puerta-async.js`, cambia `'<ol class="hoja-rejilla" id="r"></ol>'` por `'<div class="esfera" id="r"></div>'` (y lo mismo con `id="ra"`), y renombra la variable `rejilla` a `esfera` y «la rejilla» a «la esfera» en nombres de prueba y comentarios. El comportamiento no cambia.

Corre la suite: las pruebas de la puerta siguen en verde.

- [ ] **Step 2: El origen del vuelo del visor**

En `js/visor-origen.js`, la rama móvil pasa a ser:

```js
    if (window.Movil.actual() === 'movil') {
      return window.MovilGlobo.elementoDe(id);
    }
```

y en el comentario de cabecera, donde dice que el móvil pregunta a la rejilla, que pregunte a la esfera (`js/movil-globo.js`). En el comentario largo, «la celda devolvería un rectángulo en ceros» pasa a «la tesela devolvería…».

- [ ] **Step 3: El marcado**

En `index.html`, sustituye `<ol class="hoja-rejilla" id="hojaRejilla"></ol>` y el comentario que le sigue (el de `Contacto.colocar`) por:

```html
    <!-- La esfera (js/movil-globo.js): una tesela por trabajo, que el dedo
         gira en cualquier dirección. Sustituye a la rejilla desde el
         2026-09-29 (docs/superpowers/specs/2026-09-29-esfera-movil-design.md).
         El pie nombra la portada de delante y cambia al asentarse; la
         pastilla abre la misma capa de contacto que en escritorio. -->
    <div class="esfera" id="esfera">
      <ul class="esfera-lista" id="esferaLista" aria-label="Trabajos"></ul>
      <p class="esfera-pie" aria-live="polite">
        <span class="esfera-titulo" id="esferaTitulo"></span>
        <span class="esfera-meta" id="esferaMeta"></span>
      </p>
      <a class="esfera-contacto" href="#/contacto">Contacto</a>
    </div>
```

En el comentario de la sección `LA HOJA DE CONTACTO`, cambia «En el móvil, `Contacto.colocar` la mueve al pie de la portada (`.hoja`) y es una sección más del recorrido, sin ruta.» por «En el móvil es la misma capa, abierta desde la pastilla de la esfera.»

- [ ] **Step 4: Los scripts**

En `index.html`:
- Cambia `<script src="js/movil-hoja.js"></script>` por:

```html
  <script src="js/movil-esfera.js"></script>
  <!-- Va DETRÁS de movil-esfera.js, que usa en todo lo que calcula, y
       ANTES del script de arranque. Sin él, `window.MovilGlobo` es undefined
       y el arranque lanza antes de `Router.init()`. -->
  <script src="js/movil-globo.js"></script>
```

- Borra el comentario «TEMPORAL, para cazar el fallo del primer toque…», `<script src="js/diagnostico-toques.js"></script>`, y en el script de arranque el comentario «TEMPORAL, y va lo PRIMERO…» con `window.DiagnosticoToques.init();`.
- Borra en el comentario de `movil-arrastre.js` «, la rejilla oculta detrás,» → «, la esfera oculta detrás,».

En `tests/test.html`, borra `<script src="../js/movil-hoja.js"></script>`, `<script src="pruebas-movil-hoja-rejilla.js"></script>` y `<script src="pruebas-movil-hoja-filtrar.js"></script>`.

Borra los archivos:

```bash
git rm js/movil-hoja.js tests/pruebas-movil-hoja-rejilla.js tests/pruebas-movil-hoja-filtrar.js js/diagnostico-toques.js
```

- [ ] **Step 5: El arranque**

En el script de arranque de `index.html`, sustituye el bloque que va desde `var rejilla = document.getElementById('hojaRejilla');` hasta el cierre de su `window.Router.alCambiar(...)` por:

```js
    var esfera = document.getElementById('esfera');
    window.MovilGlobo.init({
      raiz:   esfera,
      lista:  document.getElementById('esferaLista'),
      titulo: document.getElementById('esferaTitulo'),
      meta:   document.getElementById('esferaMeta')
    }, window.Datos.PROYECTOS, {
      alAbrir: function (id) { window.Router.ir('proyecto', id); }
    });
    /* Girar el teléfono cambia el lado corto: las teselas se recolocan sin
       perder cuál está delante. */
    window.addEventListener('resize', function () { window.MovilGlobo.redibujar(); });
```

Deja el comentario largo de encima (el de «tiene que pintarse y suscribirse ANTES de `Router.init()`»), cambiando «La portada móvil se construye siempre» por «La esfera móvil se construye siempre».

Justo DETRÁS del `window.Router.alCambiar(function (ruta) { window.MovilVisor.aplicar(ruta); });`, añade:

```js
    /* DETRÁS del visor y no delante: al cerrar, el visor devuelve el foco a
       la tesela que lo abrió, y la esfera tiene que correr después para
       trasladarlo a la que deja delante —el visor pudo moverse de trabajo—.
       Sigue estando antes de `Router.init()`, que es lo que hace falta para
       el aviso de la ruta inicial. */
    window.Router.alCambiar(function (ruta) {
      window.MovilGlobo.aplicar(ruta);
    });
```

En `Movil.init`, borra las dos líneas `window.Contacto.colocar('movil');` y `window.Contacto.colocar('escritorio');`.

En `MovilPuerta.entrada(...)`, cambia el tercer argumento `rejilla` por `esfera`.

En `js/contacto.js`, `init`, pasa a la esfera también el congelado:

```js
      congelar:    function () { window.Galeria.congelar(); window.MovilGlobo.congelar(); },
      descongelar: function () { window.Galeria.descongelar(); window.MovilGlobo.descongelar(); }
```

Busca restos:

```bash
grep -rn "hojaRejilla\|MovilHoja\|hoja-rejilla\|hoja-celda\|hoja-boton\|DiagnosticoToques\|Contacto.colocar" index.html js tests css
```

Esperado: sólo comentarios de historia en `docs/`, ninguno en `index.html`, `js/`, `tests/` ni `css/`, salvo el de `js/ficha-dato.js`: cambia allí `.hoja-celda.sin-foto` por `.esfera-tesela.sin-foto`.

- [ ] **Step 6: El CSS de la esfera**

En `css/luque.css`:

1. En `body.es-movil .hoja{ … }` (bloque «PORTADA MÓVIL — la hoja»), cambia `overflow-y:auto;` y `-webkit-overflow-scrolling:touch;` por `overflow:hidden;`, y `background:var(--yellow);` por `background:var(--black);`. Deja `overscroll-behavior-y:contain` con su comentario. Añade al comentario: «Desde la esfera (2026-09-29) la hoja ya no se desplaza: el dedo gira la esfera, y el negro es el fondo sobre el que sólo brillan las fotos.»
2. Borra `body.es-movil .hoja.con-hero{ overflow:hidden; }` con su comentario (la hoja ya no se desplaza nunca).
3. Sustituye `body.es-movil .hoja.con-hero .hoja-rejilla{ visibility:hidden; }` por `body.es-movil .hoja.con-hero .esfera{ visibility:hidden; }`, y en su comentario «la rejilla» por «la esfera».
4. Borra desde `.hoja-rejilla{` hasta `.hoja-boton:focus-visible{ … }` inclusive (reglas y comentarios de la rejilla), y pon en su lugar:

```css
/* ------------------------------------------------------------
   LA ESFERA — ver js/movil-globo.js y js/movil-esfera.js
   Cada tesela se coloca con un solo `transform` que calcula el JS; aquí
   sólo va lo que no se mueve. `touch-action:none` es OBLIGATORIO: sin él
   el navegador se queda el arrastre para desplazar o ampliar la página y
   la esfera no gira.
------------------------------------------------------------ */
.esfera{
  position:absolute; inset:0;
  touch-action:none;
  -webkit-user-select:none; user-select:none;
  -webkit-tap-highlight-color:transparent;
}
.esfera-lista{ list-style:none; margin:0; padding:0; position:absolute; inset:0; }
.esfera-tesela{
  position:absolute; left:0; top:0;
  transform-origin:50% 50%;
  will-change:transform;
}
.esfera-tesela[hidden]{ display:none; }
.esfera-tesela.detras{ pointer-events:none; }
.esfera-boton{
  display:block; width:100%; height:100%; padding:0; border:0;
  position:relative; overflow:hidden;
  background:var(--grey-dark);
  cursor:pointer;
}
.esfera-boton img{
  display:block; width:100%; height:100%;
  object-fit:cover;
  pointer-events:none;
  -webkit-user-drag:none;
}
/* La profundidad es un velo negro con opacidad, no `filter`: un filtro
   sobre ocho imágenes en movimiento es lo que da tirones en un teléfono. */
.esfera-velo{ position:absolute; inset:0; background:var(--black); pointer-events:none; }
/* El número sólo se ve cuando falta la foto: un hueco numerado se lee
   como «falta esa». Con foto, quien nombra el trabajo es el pie. */
.esfera-numero{
  display:none;
  position:absolute; top:8px; left:10px;
  font-size:1.45rem; font-weight:700; line-height:1;
  letter-spacing:var(--kerning);
  color:var(--yellow);
  pointer-events:none;
}
.esfera-tesela.sin-foto img{ display:none; }
.esfera-tesela.sin-foto .esfera-numero{ display:block; }
.esfera-boton:focus-visible{ outline:3px solid var(--yellow); outline-offset:3px; }

/* El pie y la pastilla van por encima de cualquier tesela: el `z-index` de
   las teselas llega a 1000. 24px a los lados, como tenía la rejilla, para no
   caer en la franja del gesto de «atrás». */
.esfera-pie{
  position:absolute; left:24px; right:24px;
  bottom:calc(28px + env(safe-area-inset-bottom));
  margin:0;
  z-index:1001;
  color:var(--yellow);
  pointer-events:none;
}
.esfera-titulo{
  display:block;
  font-size:clamp(1.9rem, 9vw, 3rem); font-weight:700;
  line-height:0.95; letter-spacing:var(--kerning);
}
.esfera-meta{ display:block; margin-top:.5rem; font-size:.9rem; opacity:.75; }
.esfera-contacto{
  position:absolute; right:24px;
  top:calc(20px + env(safe-area-inset-top));
  z-index:1002;
  background:var(--yellow); color:var(--black);
  padding:.4rem .8rem; line-height:1.2;
  font:inherit; text-decoration:none;
}
/* El mismo halo que las pastillas del visor: lleva el blanco a 48px de
   alto sin cambiar lo que se ve. */
.esfera-contacto::before{ content:""; position:absolute; inset:-8px -4px; }
.esfera-contacto:focus-visible{ outline:2px solid var(--yellow); outline-offset:4px; }
body.es-movil .hoja .galeria-vacia{
  position:absolute; left:24px; right:24px; top:40%;
  color:var(--yellow);
}
```

(Si `.galeria-vacia`, sobre la línea 602, ya pone `color` o `position` con más especificidad, ajusta esta última regla hasta que el aviso se lea en amarillo sobre negro en el panel.)

- [ ] **Step 7: Correr la suite**

Esperado: todo en verde; ninguna referencia a `MovilHoja` en la consola de `tests/test.html`.

- [ ] **Step 8: Mirarlo en el panel del navegador**

Levanta el perfil `luque` (`preview_start` con `name: "luque"`), `resize_window` con `preset: "mobile"`, recarga y comprueba:
1. La consola sin errores (`read_console_messages` con `onlyErrors`); los 404 de `/img/` son lo esperado.
2. La puerta amarilla está delante; al cruzarla (Intro) aparece la esfera sobre negro, con la de delante centrada y el pie «La Boquerona / editorial 01/08».
3. Arrastrar con `left_click_drag` gira la esfera, y al soltar se asienta con una portada centrada y el pie cambia.
4. Las teselas se curvan hacia fuera (las de la derecha giradas hacia la derecha). Si se ven abiertas hacia dentro, el signo está mal en `MovilEsfera.proyectar`; corrígelo allí y en su prueba.
5. Un toque en la de delante abre el visor; cerrarlo deja delante ese trabajo.
6. La pastilla «Contacto» abre la capa amarilla, y «Volver a los trabajos» la cierra.
7. `resize_window` con `preset: "desktop"`: el escritorio se ve exactamente como antes.

Haz una captura de la esfera (`computer` → `screenshot`) para enseñársela a Ángel. Vuelve a `preset: "desktop"` al acabar.

- [ ] **Step 9: Commit**

```bash
git add -A index.html tests css js
git commit -m "Poner la esfera en la portada movil y retirar la rejilla

Salen movil-hoja.js y sus pruebas, y el diagnostico de toques, cuyo
fallo vivia en la rejilla. El contacto se abre desde una pastilla fija.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Anotarlo

**Files:**
- Modify: `docs/estado-conocido.md`
- Modify: `docs/comprobaciones-en-produccion.md`

- [ ] **Step 1: `docs/estado-conocido.md`**

1. Al principio de la sección «La portada móvil (bloque 4d) y el visor móvil (bloque 4f)», añade un párrafo: «**Desde el 2026-09-29 la portada móvil ya no es una rejilla: es una esfera** (`js/movil-esfera.js` + `js/movil-globo.js`, spec `docs/superpowers/specs/2026-09-29-esfera-movil-design.md`). Lo que esta sección cuenta de `MovilHoja` es historia.»
2. En la sección «Sin explicar: el primer toque de la rejilla móvil…», añade al final: «**Cerrado el 2026-09-29 sin cazarlo**: la rejilla y `js/diagnostico-toques.js` se retiraron con la llegada de la esfera. La esfera decide el toque con `pointerdown`/`pointerup` y captura de puntero, que es justo lo que el diagnóstico apuntaba como sospechoso; si el fallo vuelve en la esfera, empezar por ahí.»
3. Añade una sección nueva al final, «## La esfera de la portada móvil (2026-09-29)», con: los dos módulos y quién hace qué; que los números del movimiento (`TAU_INERCIA`, `TAU_MUELLE`, `VEL_MAX`, `PERSPECTIVA`, `LUZ_GRANDE`) se afinan en un teléfono y no en la suite; que `MovilGlobo.aplicar` se suscribe DETRÁS de `MovilVisor.aplicar` a propósito (el foco); que el contacto volvió a ser capa en móvil y `Contacto.colocar` ya no existe; y que las categorías reparten de nuevo la esfera y conservan los números (decisión tomada al escribir la spec, pendiente de que Ángel la vea en su teléfono).

- [ ] **Step 2: `docs/comprobaciones-en-produccion.md`**

Añade un apartado «Esfera móvil» con lo que sólo se ve desplegado, cada punto como casilla:
- Las portadas reales sobre la esfera: ¿se leen, se ven bien recortadas a 4:5, el velo oscurece lo justo?
- Fluidez del giro e inercia en el teléfono de Ángel; si da tirones, bajar primero `PERSPECTIVA`/inclinación y luego el número de teselas a 1500.
- Que el primer toque tras cruzar la puerta abre a la primera.
- Que arrastrar la esfera no recarga la página (pull-to-refresh) ni la desplaza.
- La pastilla «Contacto» y «Volver a los trabajos» en el teléfono.

- [ ] **Step 3: Commit**

```bash
git add docs/estado-conocido.md docs/comprobaciones-en-produccion.md
git commit -m "Anotar la esfera movil y lo que queda por mirar en un telefono

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
