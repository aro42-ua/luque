# El tacto del móvil — bloque 4e

> **Para trabajadores agénticos:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendada) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los
> pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que los tres sitios donde el móvil responde al soltar en vez de
responder mientras pasen a responder mientras, y que del panel informativo se
pueda salir.

**Arquitectura:** un módulo puro nuevo (`js/movil-arrastre.js`) decide, sin DOM
y sin reloj, cuánto se ha levantado la hoja y si al soltar se va o vuelve. La
puerta del hero sale de `js/movil-hoja.js` a `js/movil-puerta.js` porque el
fichero no cabe en el techo de 300 líneas, y es allí donde se cablea el
arrastre. En paralelo, `js/visor.js` deja de preguntarle el origen del vuelo
siempre a la galería de escritorio y se lo pregunta a la portada que está
puesta, y el panel de la ficha gana una salida visible por debajo de 860px.

**Tecnologías:** HTML, CSS y JavaScript ES5 a mano. Sin framework, sin paso de
compilación, sin gestor de paquetes y sin dependencias. Las pruebas son
`tests/test.html` abierto en un navegador.

**Spec:** `docs/superpowers/specs/2026-09-03-tacto-movil-design.md`

## Restricciones globales

Copiadas de la sección «Restricciones globales» de la spec. Los requisitos de
cada tarea las incluyen implícitamente.

- **ES5 a mano.** Sin framework, sin paso de compilación, sin gestor de paquetes
  y sin dependencias. `var`, `function`, nada de `const`, `let` ni flechas.
- **Todo en español**, incluidos los comentarios y los nombres.
- **El escritorio no se mueve.** Es el único camino que hoy funciona en
  producción. Cualquier cambio que lo toque se verifica aparte.
- **Nada de credenciales en el repositorio.**
- **Los comentarios no pueden afirmar lo que el código no hace.** Una cita a otro
  fichero se ancla a su sección o a su función, nunca solo a un número de línea.
- **Ningún fichero pasa de 300 líneas.**
- **Una medición que no se ha hecho se llama «razonada», no «medida».**

## Cómo se corren las pruebas

Desde la raíz del repositorio:

```bash
python -m http.server 8000
```

y abrir `http://127.0.0.1:8000/tests/test.html`. El resumen sale al final de la
página con la forma `N pasan, M fallan`.

**Punto de partida: 325 pasan, 0 fallan.**

Cuatro avisos que ya costaron tiempo en el bloque anterior y están desarrollados
en `docs/estado-conocido.md`:

1. **Con Chrome headless hace falta `--virtual-time-budget=15000`** además de
   `--dump-dom`. Sin él el DOM se vuelca en el evento `load`, antes de que se
   resuelvan las promesas de `describeAsync`, y el recuento sale bajo y falso o
   ni siquiera aparece la línea de resumen.
2. **`python -m http.server` no manda `Cache-Control`.** Recargar y ver lo de
   antes es la caché, no tu cambio.
3. **Windows deja bindear dos veces el mismo puerto sin dar error.** Verifica con
   `curl` contra qué estás midiendo antes de creerte una medición.
4. **Chrome headless es `no-preference` por defecto, sin `--force-prefers-reduced-motion`.** Esto
   importa mucho en este bloque: quien quiera medir la rama de movimiento reducido debe
   activarla a propósito con esa bandera; sin ella se mide la rama normal.

---

### Tarea 1: El módulo puro del arrastre

**Ficheros:**
- Crear: `js/movil-arrastre.js`
- Crear: `tests/pruebas-movil-arrastre.js`
- Modificar: `tests/test.html` (dos etiquetas `<script>`)

**Interfaces:**
- Consume: `window.MovilGestos.TOQUE` (vale 10) y `window.MovilGestos.UMBRAL`
  (vale 24), de `js/movil-gestos.js`. Se leen **dentro de las funciones**, nunca
  al definir el módulo.
- Produce: `window.MovilArrastre` con `FRACCION` (0.25), `VELOCIDAD` (0.4),
  `inicial()`, `empezar(estado, punto, ahora)`, `mover(estado, punto, ahora)`,
  `recorrido(estado)`, `levantado(estado)`, `velocidad(estado)` y
  `soltar(estado, alto)` → `{ estado, salir }`. `punto` es `{ y: Number }` y
  `ahora` son milisegundos. La Tarea 3 los consume.

- [ ] **Paso 1: escribir las pruebas que fallan**

Crear `tests/pruebas-movil-arrastre.js`:

```js
/* El arrastre de la hoja. Puro: sin DOM y sin reloj, así que no necesita el
   arnés de DOM. El tiempo entra como argumento en cada llamada — es lo que
   permite comprobar la velocidad sin falsificar `Date.now`, que sería fijar la
   implementación en vez del comportamiento. */
describe('MovilArrastre — la hoja bajo el dedo', function () {

  function p(y) { return { y: y }; }

  /* Apoya el dedo en y=500 en t=0 y recorre las muestras que se le pasen, cada
     una `[y, t]`. Devuelve el estado listo para soltar. */
  function arrastre(muestras) {
    var e = MovilArrastre.empezar(MovilArrastre.inicial(), p(500), 0);
    muestras.forEach(function (m) { e = MovilArrastre.mover(e, p(m[0]), m[1]); });
    return e;
  }

  /* El alto de ventana de referencia de este fichero. Con 800, el cuarto de
     pantalla son 200px levantados, o sea 210 de recorrido del dedo. */
  var ALTO = 800;

  // ---- El margen antes de moverse ---------------------------------

  prueba('la hoja no se mueve mientras el dedo no pase el margen', function () {
    igual([MovilArrastre.levantado(arrastre([[492, 10]])),
           MovilArrastre.levantado(arrastre([[490, 10]])),
           MovilArrastre.levantado(arrastre([[482, 10]]))],
          [0, 0, 8]);
  });

  /* Si el recorrido no se contara desde el margen sino desde el apoyo, la hoja
     pegaría un salto de 10px en el instante exacto en que lo cruza. */
  prueba('al cruzar el margen la hoja arranca desde cero, sin salto', function () {
    igual(MovilArrastre.levantado(arrastre([[489, 10]])), 1);
  });

  prueba('arrastrar hacia abajo no hunde la hoja', function () {
    igual([MovilArrastre.recorrido(arrastre([[560, 10]])),
           MovilArrastre.levantado(arrastre([[560, 10]]))],
          [0, 0]);
  });

  /* Esta prueba muere si alguien copia el 10 en vez de leerlo de MovilGestos,
     que es exactamente la mutación que se quiere impedir. */
  prueba('el margen sale de MovilGestos y no de una copia', function () {
    var original = MovilGestos.TOQUE;
    var conMargenGrande;
    try {
      MovilGestos.TOQUE = 40;
      conMargenGrande = MovilArrastre.levantado(arrastre([[470, 10]]));
    } finally {
      MovilGestos.TOQUE = original;
    }
    igual([conMargenGrande, MovilArrastre.levantado(arrastre([[470, 10]]))],
          [0, 20]);
  });

  // ---- La rama del golpe ------------------------------------------

  prueba('un golpe corto y rápido echa la puerta', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [470, 30]]), ALTO).salir, true);
  });

  /* Sin el mínimo de recorrido, un temblor de seis píxeles al apoyar el dedo
     —que es rapidísimo— echaría la puerta sin que nadie la empujara. */
  prueba('un golpe rápido pero por debajo del mínimo no la echa', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [480, 20]]), ALTO).salir, false);
  });

  /* El mínimo se mide contra el RECORRIDO del dedo, no contra lo levantado:
     son los 25 dip de recorrido del ViewPager de Android. Con 24 de recorrido
     lo levantado son 14, así que una implementación que compare lo levantado
     contra 24 devuelve false aquí y la prueba la caza. */
  prueba('el mínimo del golpe se mide contra el recorrido del dedo', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 10], [476, 20]]), ALTO).salir, true);
  });

  prueba('un golpe lento no la echa aunque el recorrido llegue', function () {
    igual(MovilArrastre.soltar(arrastre([[490, 100], [460, 600]]), ALTO).salir, false);
  });

  // ---- La rama de la posición -------------------------------------

  prueba('un arrastre largo y lento la echa aunque no haya golpe', function () {
    igual(MovilArrastre.soltar(arrastre([[400, 500], [280, 1000]]), ALTO).salir, true);
  });

  prueba('soltar por debajo de los dos umbrales devuelve la hoja', function () {
    igual(MovilArrastre.soltar(arrastre([[480, 100], [450, 600]]), ALTO).salir, false);
  });

  /* El alto entra como argumento y no se lee de `window`: una pantalla más
     corta tiene que echar la puerta con menos recorrido. */
  prueba('el cuarto de pantalla se mide contra el alto que se le pasa', function () {
    var e = arrastre([[400, 500], [290, 1000]]);   // 210 de recorrido, 200 levantados
    igual([MovilArrastre.soltar(e, ALTO).salir,
           MovilArrastre.soltar(e, 1600).salir],
          [true, false]);
  });

  // ---- Los bordes -------------------------------------------------

  /* Dos `pointermove` pueden llegar con el mismo `timeStamp`. Sin la guarda,
     eso divide por cero, la velocidad sale Infinity, supera cualquier umbral y
     la puerta se va con el dedo parado. */
  prueba('dos muestras en el mismo milisegundo no dividen por cero', function () {
    var e = arrastre([[490, 10], [400, 10]]);
    igual([MovilArrastre.velocidad(e), MovilArrastre.soltar(e, ALTO).salir],
          [0, false]);
  });

  prueba('soltar sin haber empezado no sale y no lanza', function () {
    igual(MovilArrastre.soltar(MovilArrastre.inicial(), ALTO).salir, false);
  });

  /* Un contenedor de alto cero hace que `alto * FRACCION` valga cero, y sin la
     guarda `lev > 0` de la implementación, `0 >= 0` sería cierto y la puerta se
     cruzaría con un arrastre hacia ABAJO, que no ha levantado nada. No es
     hipotético: en el arnés el hero es un `<div>` sin CSS y mide cero de alto,
     y en producción lo mide también durante el instante entre que el nodo entra
     en el documento y le llega la hoja de estilo. */
  prueba('con un alto de cero, arrastrar hacia abajo no echa la puerta', function () {
    igual(MovilArrastre.soltar(arrastre([[560, 10]]), 0).salir, false);
  });

  /* Sin esto, el gesto siguiente heredaría el origen del anterior y la hoja
     saldría con el primer movimiento. */
  prueba('soltar devuelve el estado a cero para el gesto siguiente', function () {
    var r = MovilArrastre.soltar(arrastre([[300, 200]]), ALTO);
    igual([r.estado.activo, r.estado.y0], [false, 0]);
  });

  prueba('mover sin haber empezado no toca el estado', function () {
    var e = MovilArrastre.inicial();
    igual(MovilArrastre.mover(e, p(100), 50), e);
  });

  /* La velocidad se mide entre las DOS ÚLTIMAS muestras y no sobre el gesto
     entero, y ésta es la prueba que separa las dos lecturas: el gesto completo
     recorre 210px en 1000ms (0,21 px/ms, por debajo del umbral), pero el
     remate son 30px en 20ms (1,5 px/ms). Quien promedie el gesto entero
     devuelve false aquí. */
  prueba('la velocidad es la del remate, no la media del gesto', function () {
    igual(MovilArrastre.velocidad(arrastre([[320, 980], [290, 1000]])), 1.5);
  });
});
```

- [ ] **Paso 2: enlazar las pruebas y verlas fallar**

En `tests/test.html`, añadir la carga del módulo justo después de la de
`movil-gestos.js`:

```html
<script src="../js/movil-arrastre.js"></script>
```

y la de las pruebas justo después de `pruebas-movil-gestos.js`:

```html
<script src="pruebas-movil-arrastre.js"></script>
```

Recargar `tests/test.html`. Esperado: la sección «MovilArrastre — la hoja bajo
el dedo» aparece en rojo con **17 fallos**, todos por
`MovilArrastre is not defined`.

- [ ] **Paso 3: escribir el módulo**

Crear `js/movil-arrastre.js`:

```js
window.MovilArrastre = (function () {

  /* Qué fracción de la pantalla hay que levantar para que la hoja se vaya sola,
     sin golpe. 0,25 y no el 0,4f del `determineTargetPage` del `ViewPager` de
     Android, del que sale el resto de esta regla: allí la decisión es un cambio
     de página, donde equivocarse te lleva a otro sitio; aquí es una puerta que
     se cruza una vez y no vuelve, y equivocarse por exceso te ahorra un
     amarillo que era el destino de todos modos. La procedencia de los cuatro
     números está en la sección «De dónde se copiaron los números» de
     docs/superpowers/specs/2026-09-03-tacto-movil-design.md. */
  var FRACCION = 0.25;

  /* px/ms. Es el `MIN_FLING_VELOCITY` de Android —400 dip/s— trasladado a
     píxeles CSS, que en un teléfono son casi la misma unidad: 1 dip ≈ 1,04 px
     CSS. Hammer.js usa 0,3 para lo mismo. */
  var VELOCIDAD = 0.4;

  /* Los otros dos umbrales NO se declaran aquí, y no es un descuido: ya están
     en `MovilGestos` con estos valores y significando exactamente esto.
     `TOQUE` (10) es «por debajo de esto el dedo no se ha movido», que es el
     margen antes de que la hoja arranque; `UMBRAL` (24) es «el eje dominante
     tiene que recorrer al menos esto», que es el mínimo del golpe. Dos copias
     de un umbral son dos sitios donde cambiarlo y uno donde olvidarse.

     Se leen DENTRO de las funciones y no al definir el módulo, para no imponer
     ningún orden de carga entre dos módulos que por lo demás no se conocen. */
  function margen()        { return window.MovilGestos.TOQUE; }
  function minimoDelGolpe() { return window.MovilGestos.UMBRAL; }

  function inicial() {
    return { activo: false, y0: 0, y: 0, t: 0, yPrevio: 0, tPrevio: 0 };
  }

  function empezar(estado, punto, ahora) {
    return { activo: true, y0: punto.y, y: punto.y, t: ahora,
             yPrevio: punto.y, tPrevio: ahora };
  }

  /* Guarda la muestra anterior además de la de ahora, y nada más. Es a
     propósito lo MENOS que hace falta: la velocidad se mide entre las dos
     últimas muestras y no sobre el gesto entero, porque quien arrastra despacio
     y remata con un golpe seco sí quiere salir, y quien arranca rápido y se
     para a medias no. Promediando el gesto, los dos salen al revés. */
  function mover(estado, punto, ahora) {
    if (!estado.activo) return estado;
    return { activo: true, y0: estado.y0, y: punto.y, t: ahora,
             yPrevio: estado.y, tPrevio: estado.t };
  }

  /* Lo que ha recorrido el DEDO hacia arriba. Nunca negativo: arrastrar hacia
     abajo no hunde la hoja, la deja en su sitio. */
  function recorrido(estado) {
    return Math.max(0, estado.y0 - estado.y);
  }

  /* Lo que se ha levantado la HOJA, que es el recorrido menos el margen.

     La resta no es cosmética: sin ella la hoja daría un salto de diez píxeles
     en el instante exacto en que el dedo cruza el margen. */
  function levantado(estado) {
    return Math.max(0, recorrido(estado) - margen());
  }

  /* px/ms hacia arriba entre las dos últimas muestras.

     La guarda de `dt <= 0` no es defensiva por si acaso: dos `pointermove`
     pueden llegar con el mismo `timeStamp`, porque el reloj de los eventos
     tiene resolución limitada. Sin la guarda eso divide por cero, la velocidad
     sale `Infinity`, supera cualquier umbral, y la puerta se va con el dedo
     parado. */
  function velocidad(estado) {
    var dt = estado.t - estado.tPrevio;
    if (dt <= 0) return 0;
    return (estado.yPrevio - estado.y) / dt;
  }

  /* `alto` es el alto de la ventana en píxeles CSS, y lo pasa quien llama: este
     módulo no lee `window`.

     Dos ramas, y en este orden, que es la forma del `determineTargetPage` del
     `ViewPager` de Android y no sólo sus números. Primero manda el golpe, que
     necesita recorrido Y velocidad —las dos, con `&&`, no una cualquiera—; y si
     no hubo golpe, manda la posición. Como resultado las dos ramas son un `o`,
     pero el `y` de dentro de la primera es lo que impide que un temblor rápido
     o un arrastre lentísimo de dos centímetros cuenten como golpe.

     El mínimo del golpe se compara contra el RECORRIDO y la fracción contra lo
     LEVANTADO. Son diez píxeles de diferencia sobre umbrales de veinte y de
     doscientos, así que no cambia lo que hace; se escribe porque los 25 dip de
     Android son recorrido del dedo y la fracción es lo que el ojo ve, y quien
     lo lea después no debería tener que deducir cuál era la intención. */
  function soltar(estado, alto) {
    if (!estado.activo) return { estado: inicial(), salir: false };

    var golpe = recorrido(estado) >= minimoDelGolpe() &&
                velocidad(estado) >= VELOCIDAD;

    /* El `lev > 0` de la segunda rama no sobra, aunque parezca implicado por la
       comparación de al lado. Con un `alto` de cero —el hero antes de que le
       llegue la hoja de estilo, y el `<div>` pelado del arnés— `alto * FRACCION`
       vale cero, y entonces `0 >= 0` es cierto: la puerta se cruzaría con un
       arrastre hacia ABAJO, que no ha levantado nada. */
    var lev = levantado(estado);

    return { estado: inicial(),
             salir: golpe || (lev > 0 && lev >= alto * FRACCION) };
  }

  return {
    FRACCION: FRACCION,
    VELOCIDAD: VELOCIDAD,
    inicial: inicial,
    empezar: empezar,
    mover: mover,
    recorrido: recorrido,
    levantado: levantado,
    velocidad: velocidad,
    soltar: soltar
  };
})();
```

- [ ] **Paso 4: correr las pruebas**

Recargar `tests/test.html`. Esperado: **342 pasan, 0 fallan** (325 + 17).

- [ ] **Paso 5: commit**

```bash
git add js/movil-arrastre.js tests/pruebas-movil-arrastre.js tests/test.html
git commit -m "Decidir el arrastre de la hoja en un modulo puro"
```

---

### Tarea 2: Sacar la puerta a su propio fichero

Mudanza pura, **sin ningún cambio de comportamiento**. Se hace antes de cablear
el arrastre para que el cableado nazca ya en su sitio, y sola para que se pueda
revisar como lo que es: un movimiento de texto.

**Ficheros:**
- Crear: `js/movil-puerta.js`
- Modificar: `js/movil-hoja.js` (quitar la sección «EL HERO FUNDIDO» entera)
- Renombrar: `tests/pruebas-movil-hoja-hero.js` → `tests/pruebas-movil-puerta.js`
- Renombrar: `tests/pruebas-movil-hoja-hero-async.js` → `tests/pruebas-movil-puerta-async.js`
- Modificar: `tests/test.html`, `index.html`

**Interfaces:**
- Produce: `window.MovilPuerta` con `SALIDA_MS` (380),
  `entrada(hero, hoja, rejilla, ruta)` y `heroIdo()`. Son las mismas tres cosas
  que hoy exporta `MovilHoja`, con el mismo comportamiento; sólo cambia el
  nombre del objeto. La Tarea 3 modifica `entrada`.
- `window.MovilHoja` deja de exportar `SALIDA_MS`, `entrada` y `heroIdo`, y
  conserva `PROPORCIONES`, `proporcion`, `numero`, `pintar`, `filtrar` y
  `filtrarDesdeRuta`.

- [ ] **Paso 1: mover el código**

Crear `js/movil-puerta.js` con esta cabecera y, debajo, **el bloque completo que
hoy ocupa desde el comentario `EL HERO FUNDIDO` hasta el final de `entrada()` en
`js/movil-hoja.js`**, sin tocar una palabra de sus comentarios:

```js
window.MovilPuerta = (function () {

  /* La puerta del hero: el amarillo con LUQUE! que hay delante de la rejilla y
     que se cruza una vez por visita.

     Vivía en `js/movil-hoja.js` hasta el bloque 4e, y salió de allí porque el
     cableado del arrastre no cabía bajo el techo de 300 líneas. La división no
     es sólo aritmética: una rejilla numerada y una puerta que se cruza una vez
     son dos responsabilidades, y sólo estaban juntas por haberse escrito en el
     mismo bloque. */

  // Aquí va, CORTADO Y PEGADO sin reescribir una palabra, todo lo que hoy hay
  // en js/movil-hoja.js desde el comentario de bloque que empieza por
  // «EL HERO FUNDIDO» hasta la llave que cierra `entrada()`. Son cinco cosas y
  // en este orden: la constante SALIDA_MS con su comentario, la variable `ido`,
  // la variable `generacion` con su comentario, la función `heroIdo` y la
  // función `entrada` entera.

  return {
    SALIDA_MS: SALIDA_MS,
    entrada: entrada,
    heroIdo: heroIdo
  };
})();
```

**No reescribas ni «mejores» esos comentarios al moverlos.** Varios explican
decisiones que costaron rondas de revisión enteras —el porqué de `cerrada` local
frente a `ido` de módulo, los dos mutantes equivalentes documentados—, y esta
tarea es una mudanza, no una reescritura. Un diff de esta tarea que toque el
texto de un comentario es un diff que hay que revisar dos veces.

**Un detalle que sí hay que cambiar:** el comentario de `SALIDA_MS` dice que el
CSS mide su transición contra este número. Sigue siendo cierto, pero el fichero
al que apunta el lector ya no es el mismo; si cita `js/movil-hoja.js` por su
nombre, esa cita pasa a ser falsa y hay que corregirla. Es el único cambio de
texto permitido en este paso.

Borrar de `js/movil-hoja.js` esa misma sección y las tres entradas
correspondientes de su `return`.

- [ ] **Paso 2: actualizar quien lo llama**

En `index.html`:

- línea ~504: `window.MovilHoja.entrada(` → `window.MovilPuerta.entrada(`
- añadir `<script src="js/movil-puerta.js"></script>` **después** de la de
  `js/movil-hoja.js`
- tres comentarios citan el nombre viejo y quedarían mintiendo: los de las
  líneas ~287, ~448 y ~463. Cambiar `MovilHoja.entrada` por
  `MovilPuerta.entrada` y `js/movil-hoja.js` por `js/movil-puerta.js` en ellos.

Verificar que no queda ninguno:

```bash
grep -rn "MovilHoja\.\(entrada\|heroIdo\|SALIDA_MS\)" --include=*.js --include=*.html .
```

Esperado: sin resultados.

- [ ] **Paso 3: mover las pruebas**

```bash
git mv tests/pruebas-movil-hoja-hero.js tests/pruebas-movil-puerta.js
git mv tests/pruebas-movil-hoja-hero-async.js tests/pruebas-movil-puerta-async.js
```

Dentro de los dos ficheros, sustituir `MovilHoja.` por `MovilPuerta.` y cambiar
el nombre del `describe`:

- `'MovilHoja — el hero fundido'` → `'MovilPuerta — el hero fundido'`
- `'MovilHoja — el hero se va del documento al cruzar'` →
  `'MovilPuerta — el hero se va del documento al cruzar'`

En `tests/test.html`, añadir `<script src="../js/movil-puerta.js"></script>`
después de la de `movil-hoja.js`, y renombrar las dos etiquetas de pruebas
(`pruebas-movil-hoja-hero.js` → `pruebas-movil-puerta.js`,
`pruebas-movil-hoja-hero-async.js` → `pruebas-movil-puerta-async.js`).

- [ ] **Paso 4: correr las pruebas**

Recargar `tests/test.html`. Esperado: **342 pasan, 0 fallan** — exactamente el
mismo número que al terminar la Tarea 1. **Un número distinto significa que la
mudanza no fue pura y hay que averiguar por qué antes de seguir**, no ajustar la
cuenta.

Comprobar además el techo de líneas:

```bash
wc -l js/movil-hoja.js js/movil-puerta.js
```

Esperado: los dos por debajo de 300, y `movil-hoja.js` alrededor de 105.

- [ ] **Paso 5: commit**

```bash
git add -A js/movil-hoja.js js/movil-puerta.js index.html tests/
git commit -m "Sacar la puerta del hero de movil-hoja.js a su propio fichero"
```

---

### Tarea 3: La hoja sigue al dedo

**Ficheros:**
- Modificar: `js/movil-puerta.js` (la sección «TRES FORMAS DE CRUZAR LA PUERTA»)
- Modificar: `css/luque.css` (`body.es-movil .hoja-hero`, `.hoja-hero.fuera`, y
  el bloque `@media (prefers-reduced-motion: reduce)` del final)
- Modificar: `tests/pruebas-movil-puerta.js` (una prueba nueva)

**Interfaces:**
- Consume: `window.MovilArrastre` de la Tarea 1, con la firma completa que
  aparece en el bloque «Interfaces» de aquella tarea.
- Sigue produciendo: `MovilPuerta.entrada(hero, hoja, rejilla, ruta)`,
  `heroIdo()` y `SALIDA_MS`, sin cambios de firma.

- [ ] **Paso 1: sustituir el cableado del dedo**

En `js/movil-puerta.js`, dentro de `entrada()`, **la sección 1 de «TRES FORMAS
DE CRUZAR LA PUERTA» —los dos oyentes `pointerdown` y `pointerup` que hoy usan
`MovilGestos`— se sustituye entera** por esto. Las secciones 2 (la rueda) y 3
(el teclado) **no se tocan**, y su comentario de cabecera sigue siendo cierto
palabra por palabra: la única de las tres que cambia es la primera, que pasa de
decidir al soltar a conducir el movimiento.

```js
    /* 1. El dedo, que ahora LEVANTA la hoja en vez de limitarse a decidir
          cuando se va. La regla —golpe o posición— vive entera en
          `js/movil-arrastre.js`; aquí no se mide nada, sólo se le pasan los
          puntos y el tiempo del evento, y se pinta lo que responda. */
    var arrastre = window.MovilArrastre.inicial();

    /* Quien pidió menos movimiento no arrastra la hoja con el dedo: la decisión
       al soltar es la misma para todos, y lo que se suprime es el pintado
       continuo. Se lee una vez por entrada y no en cada `pointermove`, que
       serían decenas de consultas por gesto. */
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* El alto sale de `getBoundingClientRect` del propio hero y NO de
       `window.innerHeight`. Dos motivos, y el segundo está medido: el hero es
       `position:fixed; inset:0`, así que su alto ES el de la ventana; y
       `innerWidth`/`innerHeight` mienten bajo emulación de móvil en Chrome
       headless —está documentado en docs/estado-conocido.md— mientras que
       `getBoundingClientRect` sale correcto. Se mide al soltar y no al empezar,
       para que girar el teléfono a mitad de arrastre no decida con el alto de
       antes. */
    function altoDeLaVentana() { return hero.getBoundingClientRect().height; }

    function pintarArrastre() {
      hero.style.transition = 'none';
      hero.style.transform =
        'translateY(-' + window.MovilArrastre.levantado(arrastre) + 'px)';
    }

    /* Deja el elemento sin estilo en línea, y hace falta en las DOS ramas de
       soltar: el estilo en línea gana a cualquier clase, así que un `transform`
       olvidado clava la hoja a medio camino y ya no la mueve ni `.fuera` ni el
       reposo.

       Y hay que llamarla ANTES de `cerrarPuerta()`, no después, aunque parezca
       que eso devuelve la hoja a su sitio de un salto. No lo hace: al quitar el
       estilo en línea y añadir la clase sin forzar ningún reflujo entre medias,
       el navegador calcula el estilo una sola vez, y la transición arranca
       desde el `translateY` que hay pintado ahora hasta el `-100%` de `.fuera`.
       Un `offsetHeight` colado entre las dos líneas sí rompería esto. */
    function limpiarEstilo() {
      hero.style.transition = '';
      hero.style.transform = '';
    }

    hero.addEventListener('pointerdown', function (e) {
      arrastre = window.MovilArrastre.empezar(arrastre, { y: e.clientY }, e.timeStamp);
      /* Sin capturar el puntero, sacar el dedo del hero mata el arrastre a
         mitad y la hoja se queda donde estuviera. */
      if (hero.setPointerCapture) hero.setPointerCapture(e.pointerId);
    });

    hero.addEventListener('pointermove', function (e) {
      if (!arrastre.activo) return;
      arrastre = window.MovilArrastre.mover(arrastre, { y: e.clientY }, e.timeStamp);
      if (!reducido) pintarArrastre();
    });

    /* El punto del propio `pointerup` entra como una muestra más ANTES de
       soltar, y no es cosmético: un navegador siempre manda un `pointermove`
       justo antes de levantar el dedo, pero un evento sintetizado —los de la
       suite— puede no mandarlo, y entonces el estado se habría quedado en el
       punto de apoyo y el recorrido saldría cero. Alimentarlo aquí hace que la
       decisión use la última posición real pase lo que pase. */
    function alSoltar(e) {
      if (!arrastre.activo) return;
      arrastre = window.MovilArrastre.mover(arrastre, { y: e.clientY }, e.timeStamp);
      var r = window.MovilArrastre.soltar(arrastre, altoDeLaVentana());
      arrastre = r.estado;
      limpiarEstilo();
      if (r.salir) cerrarPuerta();
    }

    hero.addEventListener('pointerup', alSoltar);
    /* `pointercancel` llega cuando el navegador se queda el gesto: una llamada
       entrante, el gesto de sistema del borde de la pantalla. Sin esta rama la
       hoja se quedaría levantada para siempre con el dedo ya fuera. */
    hero.addEventListener('pointercancel', alSoltar);
```

- [ ] **Paso 2: el CSS**

En `css/luque.css`, la regla `body.es-movil .hoja-hero` pasa a:

```css
body.es-movil .hoja-hero{
  position:fixed; inset:0; z-index:10;
  background:var(--yellow);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:22px;
  padding:0 24px;
  transition:transform 380ms ease;
  /* Sin esto el navegador se queda el gesto vertical antes de que llegue a
     `pointermove`, y en Chrome de Android eso significa el «tirar para
     recargar». El `overscroll-behavior-y:contain` que hay más arriba está en
     `.hoja` y no cubre este caso. */
  touch-action:none;
}
```

(La transición pierde `opacity`, que ya no cambia en la rama normal.)

Y `.hoja-hero.fuera`:

```css
/* Se sale por arriba entera, continuando el movimiento que el dedo empezó. Ya
   no se desvanece: una hoja de papel no se transparenta al levantarla. */
.hoja-hero.fuera{
  transform:translateY(-100%);
  pointer-events:none;
}
```

**En el bloque `@media (prefers-reduced-motion: reduce)` del final hay que
añadir el `opacity:0` explícito**, y esto es lo más fácil de olvidar de toda la
tarea:

```css
  body.es-movil .hoja-hero{ transition:opacity 0.2s ease; }
  /* El `opacity:0` se escribe AQUÍ desde el bloque 4e. Antes lo heredaba de
     `.hoja-hero.fuera`, que ya no lo lleva porque la salida normal dejó de ser
     un fundido. Sin esta línea, un teléfono con movimiento reducido se queda
     con el hero VISIBLE y quieto hasta que el nodo se retira solo: una pantalla
     muerta de 380ms que ninguna prueba de la suite ve. */
  body.es-movil .hoja-hero.fuera{ transform:none; opacity:0; }
```

- [ ] **Paso 3: arreglar los ayudantes de las pruebas que ya existen**

**Éste es el paso que se olvida y cuesta media tarea de depuración.**
`tests/pruebas-movil-puerta.js` sintetiza los gestos con dos ayudantes que hoy
mandan **`pointerdown` y `pointerup`, sin ningún `pointermove` en medio**:

```js
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 300, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 210, bubbles: true }));
  }
```

Eso valía cuando `MovilGestos` decidía comparando el punto de apoyo con el de
soltar. Con el arrastre hay que mandar el movimiento, porque un gesto sin
movimiento es lo que es: un dedo que no se movió. Los dos ayudantes pasan a:

```js
  /* Un deslizamiento hacia arriba de verdad: 90px de recorrido vertical, muy
     por encima de los 24 de `MovilGestos.UMBRAL` —que `MovilArrastre` reutiliza
     como mínimo del golpe— y sin componente horizontal.

     El `pointermove` del medio es obligatorio desde el bloque 4e y no es
     decorativo: el navegador siempre manda uno antes de levantar el dedo, pero
     un evento sintetizado no, y sin él la hoja nunca se habría movido. */
  function deslizarArriba(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 300, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointermove',
      { clientX: 100, clientY: 240, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 210, bubbles: true }));
  }

  function deslizarAbajo(el) {
    el.dispatchEvent(new PointerEvent('pointerdown',
      { clientX: 100, clientY: 210, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointermove',
      { clientX: 100, clientY: 270, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup',
      { clientX: 100, clientY: 300, bubbles: true }));
  }
```

**Y el marco tiene que tener alto.** Hoy es un `<div>` pelado, y sin CSS mide
cero, así que la rama de la posición compararía contra `0 * 0.25`. Añadir un
alto explícito al `#h` del `MARCO` de ese fichero:

```js
  var MARCO =
    '<div>' +
      '<div class="hoja-hero" id="h" style="height:800px"></div>' +
      '<ol class="hoja-rejilla" id="r"></ol>' +
    '</div>';
```

Con 800 de alto, el cuarto de pantalla son 200px, así que los 90px de
`deslizarArriba` **no** cruzan por posición: cruzan por golpe, que es lo que
tienen que comprobar. Si alguna de las pruebas que ya existen se pone roja tras
este cambio, **léela antes de tocarla**: puede estar diciendo algo cierto que el
cableado nuevo rompió.

- [ ] **Paso 4: la prueba del arrastre continuo**

Añadir a `tests/pruebas-movil-puerta.js`, usando su `conElHero` y su
`rutaPortada()`:

```js
  /* Lo único de esta tarea que la suite puede ver: que la hoja se mueve
     MIENTRAS el dedo se mueve, no al soltar. Que se sienta bien es una
     comprobación humana, y que `touch-action` impida el tirón de recarga no se
     puede comprobar sin un teléfono.

     No se afirma el valor exacto del `transform` a propósito: eso ataría la
     prueba a la unidad y al formato que el navegador elija al serializar el
     estilo en línea. Lo que se fija es el comportamiento — antes de moverse no
     hay nada, después sí. */
  /* `window.matchMedia` se falsifica, y no por comodidad: sin eso esta prueba
     diría cosas distintas según el navegador que la corra. Chrome headless
     declara `prefers-reduced-motion: reduce` POR DEFECTO, y un compañero que
     tenga la preferencia puesta en su sistema la vería fallar sola. Una prueba
     que depende del entorno no fija comportamiento, sólo hace ruido.

     El `finally` es obligatorio: dejar `matchMedia` falsificado envenenaría
     todo lo que corra después en la misma página. */
  prueba('la hoja se levanta mientras el dedo arrastra, no al soltar', function () {
    var original = window.matchMedia;
    var estilos;
    try {
      window.matchMedia = function () { return { matches: false }; };
      estilos = conElHero(rutaPortada(), function (hero) {
        var alApoyar;
        hero.dispatchEvent(new PointerEvent('pointerdown',
          { clientX: 100, clientY: 300, bubbles: true }));
        alApoyar = hero.style.transform;
        hero.dispatchEvent(new PointerEvent('pointermove',
          { clientX: 100, clientY: 240, bubbles: true }));
        return [alApoyar, hero.style.transform.indexOf('translateY') !== -1];
      });
    } finally {
      window.matchMedia = original;
    }
    igual(estilos, ['', true]);
  });

  /* La otra mitad de la misma decisión, y hace falta las dos: con la
     preferencia puesta el dedo NO arrastra nada. Sin esta prueba, una
     implementación que ignore `prefers-reduced-motion` y pinte siempre pasa
     la de arriba y nadie se entera. */
  prueba('con movimiento reducido el dedo no arrastra la hoja', function () {
    var original = window.matchMedia;
    var transform;
    try {
      window.matchMedia = function () { return { matches: true }; };
      transform = conElHero(rutaPortada(), function (hero) {
        hero.dispatchEvent(new PointerEvent('pointerdown',
          { clientX: 100, clientY: 300, bubbles: true }));
        hero.dispatchEvent(new PointerEvent('pointermove',
          { clientX: 100, clientY: 240, bubbles: true }));
        return hero.style.transform;
      });
    } finally {
      window.matchMedia = original;
    }
    igual(transform, '');
  });
```

**Cuidado con una cosa al falsificar `matchMedia`:** `MovilPuerta.entrada` lo
lee **una vez por entrada**, no en cada `pointermove`, así que la falsificación
tiene que estar puesta **antes** de llamar a `conElHero` — que es quien llama a
`entrada`. Ponerla después no hace nada y la prueba pasaría por el motivo
equivocado.

Estas dos pruebas suman **2**, no 1.

- [ ] **Paso 5: correr las pruebas**

Recargar `tests/test.html`. Esperado: **344 pasan, 0 fallan** (342 + 2).

Si al medir con Chrome headless el hero aparece desvanecido en vez de deslizado,
**no es un fallo**: es que Chrome headless declara `prefers-reduced-motion:
reduce` por defecto y estás midiendo la otra rama. Emula `no-preference` a
propósito.

- [ ] **Paso 6: commit**

```bash
git add js/movil-puerta.js css/luque.css tests/pruebas-movil-puerta.js
git commit -m "Levantar la hoja con el dedo en vez de decidir solo al soltar"
```

---

### Tarea 4: El vuelo sale de la miniatura que se tocó

**Ficheros:**
- Modificar: `js/movil-hoja.js` (una función nueva)
- Modificar: `js/visor.js` (la línea que hoy pregunta a `Galeria`)
- Modificar: `tests/pruebas-movil-hoja-rejilla.js` (pruebas nuevas)

**Interfaces:**
- Produce: `MovilHoja.elementoDe(contenedor, id)` → el `button.hoja-boton` de esa
  celda, o `null` si no está.

- [ ] **Paso 1: escribir las pruebas que fallan**

Añadir a `tests/pruebas-movil-hoja-rejilla.js`, dentro de su `describe` y
usando el `conRejilla` que ese fichero ya tiene:

```js
  /* Devuelve el BOTÓN y no el `<li>`, y no es un detalle: al cerrar el visor,
     `js/visor.js` le hace `focus()` al elemento que lo abrió, y un `<li>` no
     recibe foco. Devolver la celda dejaría el foco en el `body` al volver. */
  prueba('elementoDe devuelve el botón de esa celda', function () {
    return conRejilla(function (ol) {
      var el = MovilHoja.elementoDe(ol, 'bruma');
      return [el.tagName, el.className, el.parentNode.dataset.id];
    }, ['BUTTON', 'hoja-boton', 'bruma']);
  });

  /* El visor pregunta por cualquier id, también por uno que la rejilla no
     tenga. Devolver `null` es lo que hace que caiga en su rama sin vuelo en vez
     de reventar. */
  prueba('elementoDe devuelve null si ese trabajo no está', function () {
    return conRejilla(function (ol) {
      return MovilHoja.elementoDe(ol, 'no-existe');
    }, null);
  });

  /* Filtrar esconde con `hidden`, no borra. Una celda escondida sigue teniendo
     su sitio y su rectángulo vale cero, así que el visor debe poder
     encontrarla; quien decide qué hacer con un rectángulo en ceros es el
     visor, no esto. */
  prueba('elementoDe encuentra también una celda escondida por el filtro', function () {
    return conRejilla(function (ol) {
      MovilHoja.filtrar(ol, 'videoclip');
      return MovilHoja.elementoDe(ol, 'bruma') !== null;
    }, true);
  });
```

**Nota:** `conRejilla` y la forma de afirmar son las de ese fichero; los ids
(`'bruma'`) tienen que salir de los proyectos que su ayudante `proyectos()`
monta. Míralos antes de escribir y usa los que haya, no inventes.

- [ ] **Paso 2: verlas fallar**

Recargar. Esperado: **3 fallos** por `MovilHoja.elementoDe is not a function`.

- [ ] **Paso 3: implementar**

En `js/movil-hoja.js`, junto a `filtrar`:

```js
  /* Qué elemento representa a un trabajo en la rejilla. Es la pregunta que el
     visor le hace a la portada antes de volar una foto desde su miniatura, y
     tiene el mismo nombre que `Galeria.elementoDe` (js/galeria.js) porque es la
     misma pregunta.

     Lo que NO comparte con aquélla es la firma: aquélla guarda un mapa de
     módulo y recibe sólo el id; ésta recibe el contenedor, como el resto de
     `MovilHoja` —`pintar`, `filtrar`—. Mantener este módulo sin estado vale más
     que las dos firmas iguales.

     Devuelve el BOTÓN y no el `<li>`: al cerrar, el visor le hace `focus()` al
     elemento que lo abrió, y un `<li>` no lo recibe. */
  function elementoDe(contenedor, id) {
    var celda = contenedor.querySelector('li.hoja-celda[data-id="' + id + '"]');
    return celda ? celda.querySelector('button.hoja-boton') : null;
  }
```

y añadir `elementoDe: elementoDe,` al `return`.

- [ ] **Paso 4: cablear el visor**

En `js/visor.js`, la línea de `abrir()` que hoy dice

```js
    proyecto = p; elementoQueAbrio = window.Galeria.elementoDe(id);
```

pasa a llamar a una función privada nueva, declarada junto a
`movimientoReducido()`:

```js
  /* A quién se le pregunta de dónde sale el vuelo de la foto.

     Hasta el bloque 4e se le preguntaba siempre a `Galeria`, y en un móvil eso
     salía mal de una forma que no daba error: `Galeria.init()` se llama también
     en móvil, así que devolvía un botón de verdad — pero uno que vive dentro de
     `.gallery`, al que el CSS móvil le pone `display:none`. El rectángulo de un
     elemento con `display:none` es todo ceros, así que la foto volaba desde un
     punto en la esquina superior izquierda, que es lo que se veía como
     «aparece de la nada».

     Ésta es la primera y única vez que el visor sabe que existe un móvil. Se
     acepta a propósito: hay exactamente dos portadas y `js/movil.js` ya es el
     sitio del proyecto donde se pregunta en qué mundo estamos. Si algún día hay
     una tercera, éste es el punto donde conviene invertir la dependencia y que
     la portada activa se registre. */
  function elementoQueAbre(id) {
    if (window.Movil.actual() === 'movil') {
      return window.MovilHoja.elementoDe(document.getElementById('hojaRejilla'), id);
    }
    return window.Galeria.elementoDe(id);
  }
```

quedando la línea de `abrir()` como:

```js
    proyecto = p; elementoQueAbrio = elementoQueAbre(id);
```

`cerrarSinTocarLaRuta()` no se toca: ya usa `elementoQueAbrio`, así que el vuelo
de vuelta queda arreglado por el mismo cambio.

- [ ] **Paso 5: correr las pruebas**

Recargar. Esperado: **347 pasan, 0 fallan**.

- [ ] **Paso 6: comprobar que el escritorio no se ha movido**

Con el servidor en marcha, abrir `http://127.0.0.1:8000/` en una ventana **ancha**
y comprobar a mano: al pulsar un trabajo, la foto sale volando desde su caja del
lienzo, y al cerrar vuelve a ella. Es el camino que hoy funciona en producción y
esta tarea le ha tocado la línea que lo decide.

- [ ] **Paso 7: commit**

```bash
git add js/movil-hoja.js js/visor.js tests/pruebas-movil-hoja-rejilla.js
git commit -m "Preguntarle el origen del vuelo a la portada que esta puesta"
```

---

### Tarea 5: La salida del panel informativo

**Ficheros:**
- Modificar: `index.html` (el botón dentro de `#visorFicha`)
- Modificar: `js/visor-ficha.js` (`init` y `aplicar`)
- Modificar: `css/luque.css` (el bloque `@media (max-width: 860px)` del visor)

**Interfaces:**
- `VisorFicha.init(alAlternar)` mantiene su firma: el botón nuevo se suscribe al
  mismo `alAlternar` que el botón «Ficha».

- [ ] **Paso 1: medir el defecto antes de arreglarlo**

Esto se hace primero y su resultado se escribe en el informe. Con el servidor en
marcha, en una ventana de **390px de ancho**, abrir un trabajo, desplegar la
ficha, y comprobar en las herramientas del navegador **qué elemento hay en el
punto donde está el botón «Ficha»**:

```js
document.elementFromPoint(
  document.getElementById('visorInfo').getBoundingClientRect().left + 5,
  document.getElementById('visorInfo').getBoundingClientRect().top + 5
);
```

La spec afirma —razonándolo desde el CSS, sin haberlo medido— que ahí aparece el
panel y no el botón, y que lo mismo pasa con la equis de cerrar el visor.
**Anota lo que salga de verdad.** Si sale el botón, la causa es otra y hay que
volver a diagnosticar antes de tocar nada.

- [ ] **Paso 2: el botón**

En `index.html`, dentro de `<aside class="visor-ficha" id="visorFicha" ...>` y
como primer hijo:

```html
      <button class="visor-ficha-cerrar" id="fichaCerrar" type="button"
              aria-label="Cerrar la ficha">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.4L5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12z"/>
        </svg>
      </button>
```

(Es el mismo trazado que la equis de `#visorCerrar`, unas líneas más arriba en
este mismo fichero: la misma forma para la misma acción.)

- [ ] **Paso 3: suscribirlo**

En `js/visor-ficha.js`, dentro de `init`:

```js
    elFicha  = document.getElementById('visorFicha');
    elCerrar = document.getElementById('fichaCerrar');
    // ... el resto igual ...
    elInfo.addEventListener('click', alAlternar);
    /* El mismo manejador que el botón «Ficha»: `alAlternar` decide el estado
       mirándolo, así que desde el panel abierto lo cierra. Dos botones para una
       acción, y una sola función que la hace. */
    elCerrar.addEventListener('click', alAlternar);
```

declarando `elCerrar` en el `var` de arriba del módulo.

- [ ] **Paso 4: el CSS, con la trampa del tabulador**

En `css/luque.css`, dentro del `@media (max-width: 860px)` que ya contiene
`.visor-ficha{ width:100%; }`:

```css
  .visor-ficha-cerrar{
    position:absolute; top:18px; right:18px;
    width:44px; height:44px;
    border:none; background:none; padding:0;
    color:var(--black);
    cursor:pointer;
  }
  .visor-ficha-cerrar svg{ width:100%; height:100%; fill:currentColor; }
```

Fíjate en que la regla del `@media` **empieza con `display:block`**: el caso
base apaga el botón y el `@media` lo enciende, así que sin esa línea no aparece
nunca:

```css
  .visor-ficha-cerrar{
    display:block;
    position:absolute; top:18px; right:18px;
    /* ...el resto, como arriba... */
  }
```

Y **fuera del `@media`**, junto a la regla `.visor-ficha`:

```css
/* En escritorio no existe: la cabecera se ve entera y un segundo control para
   cerrar lo mismo es ruido. */
.visor-ficha-cerrar{ display:none; }

/* El panel cerrado sigue RENDERIZADO —`translateX(-100%)` lo saca de la vista
   pero no del documento—, y `aria-hidden` NO saca del orden de tabulación. Sin
   esto, el botón de arriba es alcanzable con el tabulador estando el panel
   fuera de la pantalla, y pulsarlo abre un panel que no se ve: es la misma
   trampa que el bloque 4d cerró en la rejilla de la portada móvil.

   El RETARDO de la transición es la mitad no evidente. `visibility` no
   interpola, salta; sin retardarla hasta el final, el panel se volvería
   invisible en el primer fotograma y su deslizamiento de salida —esos 0,45s que
   la regla de al lado se molesta en animar— no se vería nunca. Con el retardo,
   sale deslizándose y sólo entonces desaparece del tabulador.

   La rama abierta pone el retardo a cero: al abrir tiene que ser visible YA,
   o el deslizamiento de entrada tampoco se vería. */
.visor-ficha{
  visibility:hidden;
  transition:transform 0.45s cubic-bezier(.2,.7,.2,1), visibility 0s 0.45s;
}
.visor.ficha-abierta .visor-ficha{
  visibility:visible;
  transition:transform 0.45s cubic-bezier(.2,.7,.2,1), visibility 0s 0s;
}
```

**Ojo:** la regla `.visor-ficha` que ya existe declara su propia `transition`
de `transform`. No añadas una segunda declaración: **modifica la que hay**, o la
última gana y te quedas sin saber cuál está actuando.

- [ ] **Paso 5: comprobar a mano las cuatro cosas**

No hay prueba automática para nada de esto —no hay pruebas de CSS computado en
este repositorio—, así que se comprueba en el navegador y **se escribe el
resultado de cada una en el informe**:

1. A 390px, con la ficha abierta, la equis del panel se ve y la cierra.
2. A 390px, con la ficha **cerrada**, tabular desde el principio **no** cae
   nunca en «Cerrar la ficha».
3. A 1280px, el panel se comporta exactamente como antes y la equis nueva **no**
   aparece.
4. A 1280px, la ficha abierta sigue dejando visible la cabecera y el botón
   «Ficha» sigue cerrándola.

- [ ] **Paso 6: correr las pruebas**

Recargar `tests/test.html`. Esperado: **347 pasan, 0 fallan** — el mismo número
que en la Tarea 4, porque esta tarea no añade pruebas. Un número **menor**
significa que el `visibility:hidden` rompió algo del visor que sí estaba
cubierto.

- [ ] **Paso 7: commit**

```bash
git add index.html js/visor-ficha.js css/luque.css
git commit -m "Dar al panel informativo una salida visible en el movil"
```

---

### Tarea 6: Medir lo que se dio por razonado, y dejarlo escrito

**Ficheros:**
- Modificar: `docs/estado-conocido.md`

- [ ] **Paso 1: medir el vuelo desde la miniatura**

Con el servidor en marcha y **antes de nada, comprobando con `curl` contra qué
se mide**, en una ventana de 390px de ancho:

```js
// Con la rejilla móvil pintada y el hero ya cruzado:
var boton = document.querySelector('#hojaRejilla li.hoja-celda button.hoja-boton');
JSON.stringify(boton.getBoundingClientRect());
// Y, para contraste, el equivalente de escritorio que se usaba antes:
JSON.stringify(window.Galeria.elementoDe(
  boton.parentNode.dataset.id).getBoundingClientRect());
```

Lo que la spec afirma sin haberlo medido es que el segundo sale todo ceros.
**Anota los dos rectángulos de verdad**, y si el segundo no sale en ceros, dilo:
significa que el diagnóstico de la spec era falso aunque el arreglo funcione.

- [ ] **Paso 2: escribir la sección nueva**

En `docs/estado-conocido.md`, sustituir la sección «Lo que encontró la
comprobación en el teléfono (trabajo del bloque 4e)» por lo que ha pasado de
verdad, con:

- Los tres defectos, marcados como resueltos, y **con las causas ya medidas**
  sustituyendo a las razonadas. Donde una medición contradiga lo que se razonó,
  se dice que se contradijo; no se reescribe la historia.
- **Los cuatro umbrales del arrastre y su procedencia** —`ViewPager` de Android,
  Hammer.js, Swiper.js— con el aviso de que `dip` y píxel CSS no se convierten
  por la definición de 1/160 frente a 1/96, que daría 15px, sino que en un
  teléfono son casi la misma unidad.
- **Que `MovilGestos.TOQUE` y `MovilGestos.UMBRAL` son ahora compartidos** con
  `MovilArrastre`, y que cambiarlos mueve dos comportamientos, no uno.
- **Que la puerta vive en `js/movil-puerta.js`** desde este bloque, para que las
  búsquedas por «hero» en `movil-hoja.js` no salgan vacías y confundan.
- **Qué sigue sin poder certificar la suite:** el aspecto del panel, el
  `touch-action`, y que el arrastre se sienta bien.

- [ ] **Paso 3: poner al día lo que este bloque movió**

Repasar el documento entero buscando lo que las seis tareas han dejado obsoleto:
el recuento de comprobaciones (325 → el que salga), los nombres de los ficheros
de prueba que se renombraron en la Tarea 2, y **cualquier cita a
`js/movil-hoja.js` que ahora apunte a código que está en `js/movil-puerta.js`**.

```bash
grep -rn "movil-hoja" docs/ js/ index.html tests/
```

Cada resultado se mira uno por uno: si habla de la rejilla, se queda; si habla
del hero o de la puerta, se cambia.

- [ ] **Paso 4: commit**

```bash
git add docs/estado-conocido.md
git commit -m "Registrar lo medido del bloque 4e y donde vive ahora la puerta"
```

---

## Al terminar

Correr la suite completa una última vez sobre el árbol que se va a integrar, con
el servidor verificado por `curl` antes de creerse el resultado, y además:

```bash
node tests/prueba-borrador.js
python tests/auditar_rutas.py
python tests/prueba_auditar_rutas.py
```

Después, `superpowers:finishing-a-development-branch`. **La integración la
decide Ángel: no fusionar, no subir y no desplegar sin que lo pida en el
momento.** `main` lleva más de cien commits sin publicar nunca, y si Cloudflare
Pages sigue conectado al repositorio, subir equivale a desplegar — con las
fuentes de prueba y los proyectos de relleno todavía dentro.
