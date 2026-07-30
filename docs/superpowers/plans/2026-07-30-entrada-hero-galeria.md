# Entrada del hero a la galería — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el scroll de 200vh que baja del hero a la galería por un botón que, con las cuatro esquinas en L saltando a la cadencia del preloader, deja la galería a pantalla completa.

**Architecture:** La página deja de ser un documento con recorrido y pasa a ser dos estados fijos a pantalla completa que nunca coinciden. La secuencia se anima con una **animación** de CSS y `steps(1, end)`, no con transiciones, de modo que un único reloj de CSS gobierna los cuatro saltos y el JavaScript solo decide cuándo empieza y qué hacer al terminar.

**Tech Stack:** HTML, CSS y JavaScript sin transpilar. **Sin GSAP** al terminar: este trabajo lo elimina. Sin proceso de build.

## Global Constraints

- **Sin servidor y sin red.** La web debe funcionar abriendo `index.html` con doble clic **y sin conexión a internet**. Prohibido `fetch`, `import`/`export`, `type="module"` y cualquier etiqueta que apunte a un CDN.
- **No hay scroll.** El `body` no se desplaza en ningún estado.
- **Ningún archivo de `js/` supera las 300 líneas.**
- **Animar solo `transform`, `opacity`, `filter`, `color` y `background-color`.**
- **Nada de recursos externos referenciados desde el CSS.** Las formas van incrustadas en el marcado y se colorean con `currentColor`. Esta regla ya se rompió dos veces en este proyecto y las dos veces el fallo era invisible sirviendo por HTTP.
- **Idioma del código en español.**
- **Paleta fija:** amarillo `#FFFF00`, negro `#0a0a0a`, disponibles como `--yellow` y `--black`.
- **Cadencia de la secuencia:** cuatro pasos de 200 ms, 800 ms en total, con `steps(1, end)`.
- **`prefers-reduced-motion: reduce`** sustituye la secuencia por un fundido de 200 ms.

## Estructura de archivos

| Archivo | Qué cambia |
|---|---|
| `index.html` | Marcado del hero (botón y cuatro esquinas, fuera la etiqueta «Scroll»), fuera el espaciador, el pie se reescribe, fuera las dos etiquetas de GSAP y `registerPlugin`. |
| `css/luque.css` | Estados fijos, botón y esquinas del hero, fotogramas clave de la secuencia, galería y pie superpuestos, fuera `scroll-behavior` y `scrollLine`. |
| `js/hero.js` | Reescrito: sin GSAP, avance automático entre fases, botón, orquestación de la secuencia, salto en enlaces directos. |
| `js/galeria.js` | Fuera el `ScrollTrigger` del navbar y el `scrollIntoView`; entra `activar()`. |
| `js/visor.js` | Fuera el bloque que traía la galería a la vista al cerrar. |
| `tests/pruebas-hero.js` | Nuevo: cubre la única lógica pura de este trabajo. |
| `tests/test.html` | Dos etiquetas `<script>` más. |

No hace falta ningún módulo nuevo: `js/hero.js` tiene 92 líneas y termina en torno a 150.

## Punto de partida

- Marcado: hero en `index.html:205-226`, espaciador en `:232`, galería en `:237-247`, pie en `:299-302`, GSAP en `:307-308`, arranque en `:325-333`.
- Estilos: `scroll-behavior` en `css/luque.css:57`, `frameCycle` en `:183`, hero en `:202-290`, galería en `:353-392`, movimiento reducido en `:485-491`.
- Restos de scroll a eliminar: `js/galeria.js:265` y `js/visor.js:156`.
- El arnés pasa 46 pruebas. `js/visor.js` y `js/galeria.js` están en 298 líneas: este trabajo les quita código, no se lo añade.

---

### Task 1: El botón sustituye al scroll

Al terminar, el hero avanza solo entre sus dos fases y un botón lleva a la galería. Todavía sin animación de esquinas: el hero simplemente desaparece. La página sigue teniendo scroll; eso lo quita la Task 2.

**Files:**
- Modify: `index.html` (hero, espaciador, arranque)
- Modify: `css/luque.css` (botón del hero, fuera `.scroll-label` y `scrollLine`, fuera `.hero-spacer`)
- Modify: `js/hero.js`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `Hero.init()` sigue siendo el único punto de entrada. El hero se retira añadiendo `hidden` a `#hero` y la clase `galeria-activa` al `body`.

- [ ] **Step 1: Quitar la etiqueta «Scroll» y añadir el botón**

En `index.html`, dentro de `#heroIntro` (línea 211-214), borrar la línea:

```html
      <span class="scroll-label">Scroll</span>
```

Y dentro de `#heroMain`, después del `<div class="roles">`, añadir:

```html
      <button class="hero-boton" id="heroBoton" type="button">
        <span>Entrar</span>
        <i class="hero-boton-esq tl" aria-hidden="true"></i>
        <i class="hero-boton-esq tr" aria-hidden="true"></i>
        <i class="hero-boton-esq bl" aria-hidden="true"></i>
        <i class="hero-boton-esq br" aria-hidden="true"></i>
      </button>
```

- [ ] **Step 2: Borrar el espaciador**

En `index.html`, borrar el comentario y el div del espaciador (líneas 228-232), el bloque entero que empieza con `<!-- [NUEVO] Spacer de scroll` y termina con `<div class="hero-spacer" id="heroSpacer" aria-hidden="true"></div>`.

- [ ] **Step 3: Estilos del botón**

En `css/luque.css`, borrar las reglas `.hero-intro .scroll-label` y `.hero-intro .scroll-label::after` (líneas 242-259), el bloque `@keyframes scrollLine` (líneas 261-266) y la regla `.hero-spacer` (línea 219 y su bloque).

Añadir, junto al resto de reglas del hero:

```css
  /* El botón lleva las cuatro esquinas en L alrededor, igual que cada
     celda del navbar: es una versión pequeña del marco que está a punto
     de cerrarse cuando se pulsa. */
  .hero-boton{
    position:relative;
    margin-top:2.4rem;
    padding:10px 26px;
    border:none;
    background:none;
    color:var(--black);
    font:inherit;
    font-size:0.72rem;
    font-weight:700;
    letter-spacing:0.28em;
    text-transform:uppercase;
    cursor:none;
    opacity:0;
    transition:opacity 0.3s ease;
  }
  .hero-boton.visible{ opacity:1; }
  .hero-boton:hover{ opacity:0.55; }
  .hero-boton:focus-visible{ outline:none; }
  /* El foco agranda las esquinas con transform y no con width/height:
     animar propiedades de layout está prohibido por las restricciones. */
  .hero-boton:focus-visible .hero-boton-esq{ transform:scale(1.45); }

  .hero-boton-esq{
    position:absolute;
    width:11px; height:11px;
    border-color:currentColor;
    border-style:solid;
    border-width:0;
    transition:transform 0.2s ease;
  }
  .hero-boton-esq.tl{ top:0; left:0;     border-top-width:2px; border-left-width:2px; transform-origin:top left; }
  .hero-boton-esq.tr{ top:0; right:0;    border-top-width:2px; border-right-width:2px; transform-origin:top right; }
  .hero-boton-esq.bl{ bottom:0; left:0;  border-bottom-width:2px; border-left-width:2px; transform-origin:bottom left; }
  .hero-boton-esq.br{ bottom:0; right:0; border-bottom-width:2px; border-right-width:2px; transform-origin:bottom right; }
```

Cada esquina crece desde su propio anclaje, de modo que el marco se abre hacia fuera en lugar de desplazarse.

- [ ] **Step 4: Reescribir `js/hero.js`**

Sustituir el contenido íntegro del módulo por:

```js
window.Hero = (function () {
  var preloader = null;
  var heroEl = null;
  var intro = null;
  var principal = null;
  var boton = null;

  var MIN_PRELOADER = 1200;   // ms que el preloader se ve como mínimo
  var SOSTEN_FASE_A = 900;    // ms que se sostiene el logo de fin de carga
  var arranque = 0;

  function movimientoReducido() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* Retira el preloader respetando su tiempo mínimo y encadena la fase A. */
  function retirarPreloader() {
    var transcurrido = Date.now() - arranque;
    var restante = Math.max(0, MIN_PRELOADER - transcurrido);
    setTimeout(function () {
      preloader.classList.add('fuera');
      setTimeout(function () {
        preloader.style.display = 'none';
        document.body.classList.add('preloader-done');
        mostrarFaseA();
      }, 700);
    }, restante);
  }

  /* Fase A: el logo de fin de carga. Se sostiene y avanza sola. */
  function mostrarFaseA() {
    intro.classList.add('visible');
    setTimeout(mostrarFaseB, SOSTEN_FASE_A);
  }

  /* Fase B: el logotipo grande con los roles, y el botón debajo. */
  function mostrarFaseB() {
    intro.classList.remove('visible');
    principal.classList.add('visible');
    setTimeout(function () {
      boton.classList.add('visible');
      boton.focus();
    }, 400);
  }

  /* Retira el hero y deja la galería como estado activo. */
  function entrar() {
    heroEl.hidden = true;
    document.body.classList.add('galeria-activa');
  }

  function init() {
    preloader  = document.getElementById('preloader');
    heroEl     = document.getElementById('hero');
    intro      = document.getElementById('heroIntro');
    principal  = document.getElementById('heroMain');
    boton      = document.getElementById('heroBoton');

    boton.addEventListener('click', entrar);

    arranque = Date.now();
    window.addEventListener('load', retirarPreloader);
  }

  return { init: init };
})();
```

- [ ] **Step 5: Ajustar las clases de fase en el CSS**

Las fases se controlaban antes desde GSAP con opacidad en línea. Ahora se controlan con clases. En `css/luque.css`, sustituir la regla `.hero-intro` (línea 229) por una que empiece invisible y una clase que la muestre, y hacer lo mismo con `.hero-main`:

```css
  .hero-intro{
    position:absolute; inset:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:28px;
    opacity:0;
    transition:opacity 0.6s ease;
  }
  .hero-intro.visible{ opacity:1; }

  .hero-main{
    position:absolute; inset:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    opacity:0;
    transition:opacity 0.4s ease;
    text-align:center;
  }
  .hero-main.visible{ opacity:1; pointer-events:auto; }
```

Nota: la regla actual de `.hero-main` lleva `pointer-events:none` porque nadie podía pulsar nada en ella. Ahora contiene el botón, así que la clase `.visible` lo devuelve.

Añadir también la clase que retira el preloader, ya que deja de hacerlo GSAP:

```css
  #preloader{ transition:opacity 0.7s ease; }
  #preloader.fuera{ opacity:0; }
```

- [ ] **Step 6: Quitar los ScrollTrigger del hero del arranque**

Nada que tocar en `index.html` en este paso: los `ScrollTrigger` vivían dentro de `js/hero.js` y han desaparecido con la reescritura. `gsap.registerPlugin(ScrollTrigger)` sigue en el bloque de arranque y se queda hasta la Task 5, porque `js/galeria.js` aún usa un `ScrollTrigger`.

- [ ] **Step 7: Verificar a mano**

Abrir `index.html` y comprobar:

1. El preloader hace sus cuatro fotogramas y se desvanece.
2. Aparece el logo de fin de carga, se sostiene un momento y funde solo al logotipo grande con los roles.
3. Debajo de «Operadora de cámara» aparece el botón `ENTRAR` con sus cuatro esquinas.
4. El botón tiene el foco: pulsar `Enter` sin tocar el ratón funciona.
5. Al pulsarlo, el hero desaparece y se ve la galería.
6. La consola no muestra ningún error.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/hero.js
git commit -m "Sustituir el scroll del hero por un botón

Las dos fases del hero pasan a encadenarse solas con temporizadores en
lugar de con el scroll, y un botón debajo de los roles lleva a la
galería. Desaparecen el espaciador de 200vh, la línea de tiempo y el
anclaje de tres posiciones, y con ellos la etiqueta Scroll.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: La página deja de tener scroll

Al terminar, la galería es un estado fijo a pantalla completa con el lienzo ocupando el viewport entero, y la página no se desplaza en ningún caso.

**Files:**
- Modify: `index.html` (pie)
- Modify: `css/luque.css` (body, galería, escenario, título, pie, movimiento reducido)
- Modify: `js/galeria.js` (fuera el `ScrollTrigger` y el `scrollIntoView`; entra `activar()`)
- Modify: `js/visor.js` (fuera el bloque de `scrollIntoView`)

**Interfaces:**
- Consumes: la clase `galeria-activa` en el `body`, que pone la Task 1.
- Produces: `Galeria.activar()` — muestra el navbar y remide el lienzo. La galería queda oculta con `visibility:hidden` hasta que el `body` tiene `galeria-activa`.

- [ ] **Step 1: El pie pasa a ser una línea superpuesta**

En `index.html`, sustituir el bloque del pie (líneas 299-302) por:

```html
  <footer>
    LUQUE! · © 2026 — Estudio de fotografía y cine
  </footer>
```

- [ ] **Step 2: Los dos estados fijos**

En `css/luque.css`, borrar `html{ scroll-behavior:smooth; }` (línea 57) y la línea `html{ scroll-behavior:auto; }` del bloque de movimiento reducido (línea 490).

En la regla `body` que ya existe, cambiar `overflow-x:hidden;` por `overflow:hidden;`. No añadir una regla `body` nueva más abajo: habría dos declaraciones compitiendo y la última ganaría por orden, que es justo el tipo de cosa que luego nadie entiende.

**El apilamiento del hero ya está resuelto — no hay nada que hacer aquí.** Este plan situaba en esta tarea el cambio de `z-index` del hero, y era un error de secuenciación: la Task 1 es la que borra el espaciador y, por tanto, la que rompe el apilamiento. Se corrigió allí, en el commit `2cd8411`, dejando `.hero` en `z-index:600` — por encima del navbar (500) y por debajo del visor (900).

Al leer el CSS, `.hero` debe tener ya `z-index:600`. Si aparece `z-index:1`, algo ha ido mal antes de llegar aquí: **detenerse y reportarlo** en lugar de arreglarlo sobre la marcha.

Sustituir la regla `.gallery` (línea 353) por:

```css
  /* La galería es un estado fijo a pantalla completa, no una sección de
     un documento. Nace invisible para que el tabulador no la alcance
     mientras el hero está delante. */
  .gallery{
    position:fixed; inset:0;
    z-index:2;
    background:var(--yellow);
    visibility:hidden;
  }
  body.galeria-activa .gallery,
  body.entrando .gallery{ visibility:visible; }
```

Sustituir `.spatial-stage` (línea 369) para que ocupe todo:

```css
  .spatial-stage{
    position:absolute; inset:0;
    overflow:hidden;
    background:var(--yellow);
    touch-action:none;
  }
```

Y borrar del bloque `@media (max-width: 720px)` la línea que reduce el escenario, `\.spatial-stage{ height:78vh; }`, junto con la que ajustaba el relleno de `.gallery`: ambas dimensionaban una galería que ya no está en el flujo del documento.

- [ ] **Step 3: El título y el pie, superpuestos**

Sustituir `.gallery-intro` (línea 360) por una etiqueta en la esquina superior izquierda, con el mismo tratamiento que `.spatial-hint`:

```css
  .gallery-intro{
    position:absolute;
    left:6vw; top:14vh;   /* por debajo de la píldora del navbar */
    margin:0;
    font-size:0.72rem;
    font-weight:700;
    letter-spacing:0.15em;
    text-transform:uppercase;
    opacity:0.55;
    z-index:5;
    pointer-events:none;
  }
```

Y sustituir la regla `footer` por la línea superpuesta:

```css
  footer{
    position:fixed;
    left:6vw; bottom:5vh;
    z-index:3;
    color:var(--black);
    font-size:0.66rem;
    font-weight:500;
    letter-spacing:0.12em;
    opacity:0.45;
    pointer-events:none;
  }
  body:not(.galeria-activa) footer{ opacity:0; }
```

Va a la izquierda porque el centro inferior lo ocupa `.spatial-hint`, y desaparece mientras el hero está delante.

- [ ] **Step 4: El navbar deja de depender del scroll**

En `js/galeria.js`, borrar el bloque `ScrollTrigger.create({ ... })` que revela el navbar (empieza en la línea 182) y sustituirlo por nada: la revelación pasa a `activar()`.

Añadir al módulo, junto al resto de funciones:

```js
  /* Activa la galería como estado visible: muestra el navbar y remide el
     lienzo, porque hasta ahora estaba oculto y sus rectángulos valían cero. */
  function activar() {
    var navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.add('visible');
    measure();
  }
```

Exportarla en el objeto que devuelve el módulo.

- [ ] **Step 5: Quitar los dos restos de scroll**

En `js/galeria.js:265`, dentro del manejador de clic del navbar, borrar la línea:

```js
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
```

En `js/visor.js`, borrar el bloque que traía la galería a la vista al cerrar — las líneas que calculan `fueraDeVista` y llaman a `seccion.scrollIntoView(...)` (en torno a la línea 156), junto con su comentario. Dejar intacta la llamada `origen.focus({ preventScroll: true })` que viene después: sin scroll es inocua, y quitarla sería reabrir un fallo que costó encontrar.

- [ ] **Step 6: Llamar a `activar()` al entrar**

En `js/hero.js`, en la función `entrar()`, añadir la llamada:

```js
  function entrar() {
    heroEl.hidden = true;
    document.body.classList.add('galeria-activa');
    window.Galeria.activar();
  }
```

- [ ] **Step 7: Verificar a mano**

1. La página no se desplaza: rueda, flechas y barra espaciadora no mueven nada, ni en el hero ni en la galería.
2. Al pulsar `ENTRAR`, el lienzo ocupa la pantalla entera. No se ve ningún título encima empujándolo hacia abajo.
3. «Trabajo seleccionado» aparece como etiqueta pequeña arriba a la izquierda.
4. El pie se lee abajo a la izquierda, discreto, y no aparece mientras el hero está delante.
5. El navbar aparece al entrar en la galería, no antes.
6. Mover el ratón desplaza el lienzo con inercia, como siempre.
7. Pulsar una categoría filtra y recompone.
8. Abrir una foto y cerrarla funciona, y la foto vuelve a su hueco.
9. La consola no muestra ningún error.

El punto 6 es el que más fácilmente se rompe: el lienzo se mide con `getBoundingClientRect`, y mientras la galería estaba oculta esos rectángulos valían cero. Si el paneo no responde, el problema está en que `measure()` no se llamó tras hacerla visible.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/galeria.js js/visor.js js/hero.js
git commit -m "Convertir la galería en un estado fijo sin scroll

La página deja de ser un documento con recorrido: el body pasa a
overflow hidden y la galería a position fixed ocupando el viewport
entero. El título y el pie se superponen en las esquinas. El navbar
deja de aparecer por scroll y lo hace al activarse la galería, que
además remide el lienzo porque estaba oculto y medía cero.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: La secuencia de esquinas

Al terminar, pulsar el botón dispara los cuatro saltos y la galería aparece al final del cuarto. Es el corazón del trabajo.

**Files:**
- Modify: `index.html` (cuatro esquinas en el hero)
- Modify: `css/luque.css` (esquinas, fotogramas clave, movimiento reducido)
- Modify: `js/hero.js` (disparar la secuencia y rematar al terminar)

**Interfaces:**
- Consumes: `Galeria.activar()` de la Task 2, y las clases `entrando` / `galeria-activa` del `body`.
- Produces: nada nuevo hacia fuera.

- [ ] **Step 1: Las cuatro esquinas en el marcado**

En `index.html`, dentro de `<section class="hero" id="hero">` y **antes** de `#heroIntro`, añadir:

```html
    <span class="hero-esquina tl" aria-hidden="true"><i></i></span>
    <span class="hero-esquina tr" aria-hidden="true"><i></i></span>
    <span class="hero-esquina bl" aria-hidden="true"><i></i></span>
    <span class="hero-esquina br" aria-hidden="true"><i></i></span>
```

El espejado va en el hijo `<i>` y no en el elemento exterior. Esto no es cosmético: el exterior recibe el `transform` de la animación, y si llevara encima un `scaleX(-1)` propio, la animación se lo llevaría por delante. Es exactamente la corrección que hubo que hacer en las esquinas del visor.

- [ ] **Step 2: Dibujar las esquinas**

En `css/luque.css`, junto al resto de reglas del hero:

```css
  /* Las esquinas del hero son un tercer juego, propio de este componente:
     no son las del cursor ni las del visor. Van dibujadas con bordes y se
     colorean con currentColor, nunca cargadas como recurso externo. */
  .hero-esquina{
    position:absolute;
    width:26px; height:26px;
    z-index:3;
    pointer-events:none;
    color:var(--black);
  }
  .hero-esquina i{
    position:absolute; inset:0;
    display:block;
  }
  .hero-esquina i::before,
  .hero-esquina i::after{
    content:'';
    position:absolute;
    background:currentColor;
  }
  .hero-esquina i::before{ top:0; left:0; width:100%; height:3px; }
  .hero-esquina i::after{  top:0; left:0; width:3px;  height:100%; }

  .hero-esquina.tl{ top:22px;    left:22px;  }
  .hero-esquina.tr{ top:22px;    right:22px; }
  .hero-esquina.bl{ bottom:22px; left:22px;  }
  .hero-esquina.br{ bottom:22px; right:22px; }

  .hero-esquina.tr i{ transform:scaleX(-1); }
  .hero-esquina.bl i{ transform:scaleY(-1); }
  .hero-esquina.br i{ transform:scale(-1,-1); }
```

- [ ] **Step 3: Los fotogramas clave de la secuencia**

Cuatro juegos, uno por esquina, porque no todas se mueven en el mismo paso. Los `calc` restan los 22 px del reposo para que el encuadre caiga exactamente en la fracción de viewport indicada.

```css
  /* Cuatro pasos de 200 ms con steps(1, end): cada tramo sostiene su valor
     inicial y salta al siguiente, igual que frameCycle en el preloader.
       0-25 %  reposo, en las esquinas del viewport
       25-50 % saltan SOLO la diagonal tl/br: parece un autofoco tanteando
       50-75 % saltan las otras dos; las cuatro ciñen el logotipo
       75-100 % salen fuera del viewport */
  @keyframes entradaTL{
    0%        { transform:translate(0, 0); }
    25%       { transform:translate(calc(10vw - 22px), calc(15vh - 22px)); }
    50%       { transform:translate(calc(20vw - 22px), calc(30vh - 22px)); }
    75%, 100% { transform:translate(calc(-14vw - 22px), calc(-20vh - 22px)); }
  }
  @keyframes entradaBR{
    0%        { transform:translate(0, 0); }
    25%       { transform:translate(calc(-10vw + 22px), calc(-15vh + 22px)); }
    50%       { transform:translate(calc(-20vw + 22px), calc(-30vh + 22px)); }
    75%, 100% { transform:translate(calc(14vw + 22px), calc(20vh + 22px)); }
  }
  @keyframes entradaTR{
    0%, 25%   { transform:translate(0, 0); }
    50%       { transform:translate(calc(-20vw + 22px), calc(30vh - 22px)); }
    75%, 100% { transform:translate(calc(14vw + 22px), calc(-20vh - 22px)); }
  }
  @keyframes entradaBL{
    0%, 25%   { transform:translate(0, 0); }
    50%       { transform:translate(calc(20vw - 22px), calc(-30vh + 22px)); }
    75%, 100% { transform:translate(calc(-14vw - 22px), calc(20vh + 22px)); }
  }

  /* El contenido del hero se corta en el mismo paso en que las esquinas
     salen, y el fondo del hero se vuelve transparente para descubrir la
     galería, que ya es amarilla: por eso el amarillo nunca se interrumpe
     y lo único que cambia es que el logotipo se va y llegan las fotos. */
  @keyframes entradaContenido{
    0%, 50%   { opacity:1; }
    75%, 100% { opacity:0; }
  }
  @keyframes entradaFondo{
    0%, 50%   { background-color:var(--yellow); }
    75%, 100% { background-color:transparent; }
  }

  .hero.saliendo{ animation:entradaFondo 0.8s steps(1, end) forwards; }
  .hero.saliendo .hero-intro,
  .hero.saliendo .hero-main{ animation:entradaContenido 0.8s steps(1, end) forwards; }
  .hero.saliendo .hero-esquina.tl{ animation:entradaTL 0.8s steps(1, end) forwards; }
  .hero.saliendo .hero-esquina.tr{ animation:entradaTR 0.8s steps(1, end) forwards; }
  .hero.saliendo .hero-esquina.bl{ animation:entradaBL 0.8s steps(1, end) forwards; }
  .hero.saliendo .hero-esquina.br{ animation:entradaBR 0.8s steps(1, end) forwards; }
```

- [ ] **Step 4: Movimiento reducido**

En el bloque `@media (prefers-reduced-motion: reduce)` de `css/luque.css`, añadir:

```css
    .hero.saliendo,
    .hero.saliendo .hero-intro,
    .hero.saliendo .hero-main,
    .hero.saliendo .hero-esquina{ animation:none; }
    .hero.saliendo{ opacity:0; transition:opacity 0.2s ease; }
```

- [ ] **Step 5: Disparar la secuencia desde `js/hero.js`**

Sustituir la función `entrar()` por:

```js
  /* Pulsar el botón dispara la secuencia. La galería se hace visible ya,
     aunque esté tapada por el hero opaco, para que al volverse transparente
     el fondo en el paso 3 no haya nada que montar: solo aparece. */
  function entrar() {
    if (saliendo) return;
    saliendo = true;
    boton.disabled = true;
    document.body.classList.add('entrando');

    if (movimientoReducido()) {
      heroEl.classList.add('saliendo');
      setTimeout(rematarEntrada, 200);
      return;
    }

    heroEl.addEventListener('animationend', function alTerminar(e) {
      if (e.target !== heroEl) return;   // solo la del propio hero, no las de los hijos
      heroEl.removeEventListener('animationend', alTerminar);
      rematarEntrada();
    });
    heroEl.classList.add('saliendo');
  }

  function rematarEntrada() {
    heroEl.hidden = true;
    document.body.classList.remove('entrando');
    document.body.classList.add('galeria-activa');
    window.Galeria.activar();
  }
```

Y declarar la bandera junto al resto de variables del módulo:

```js
  var saliendo = false;
```

La guarda `if (saliendo) return;` importa: sin ella, dos pulsaciones rápidas encadenarían dos secuencias sobre el mismo elemento.

El filtro `if (e.target !== heroEl) return;` también: `animationend` burbujea desde las esquinas y el contenido, que terminan a la vez, así que sin él `rematarEntrada` se llamaría seis veces.

- [ ] **Step 6: Verificar a mano**

1. Al pulsar `ENTRAR`, las cuatro esquinas hacen cuatro saltos discretos, no un deslizamiento.
2. En el segundo salto se mueven solo dos esquinas, en diagonal.
3. En el tercero las cuatro ciñen el logotipo.
4. En el cuarto salen fuera, el logotipo desaparece y las doce fotos aparecen de golpe.
5. El fondo amarillo no parpadea ni se interrumpe en ningún momento de los 800 ms.
6. Pulsar el botón dos veces seguidas muy rápido no encadena dos secuencias.
7. Con movimiento reducido activado en el sistema: no hay saltos, solo un fundido corto.
8. Después de entrar, el lienzo se desplaza con el ratón con normalidad.

- [ ] **Step 7: Commit**

```bash
git add index.html css/luque.css js/hero.js
git commit -m "Añadir la secuencia de esquinas de la entrada

Cuatro saltos de 200 ms con steps(1, end), la misma cadencia que el
preloader: las esquinas tantean, ciñen el logotipo y salen fuera. En
ese último paso el contenido del hero se corta y su fondo se vuelve
transparente, de modo que el amarillo nunca se interrumpe y lo único
que cambia es que el logotipo se va y llegan las fotos.

Se anima con animaciones y no con transiciones a propósito: arrancan al
añadirse la clase, sin el reflujo forzado que necesitaron el filtrado y
el visor.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Los enlaces directos se saltan el hero

Al terminar, abrir `#/bruma` o `#/editorial` lleva directamente a la galería, sin rótulo ni botón. Es la única lógica pura de este trabajo, así que lleva pruebas.

**Files:**
- Create: `tests/pruebas-hero.js`
- Modify: `tests/test.html`
- Modify: `js/hero.js`

**Interfaces:**
- Consumes: `Router.parsearRuta(fragmento, categorias, ids)` de `js/router.js`, que devuelve `{ tipo, valor }` con `tipo` en `'todos' | 'categoria' | 'proyecto'`.
- Produces: `Hero.debeSaltarse(ruta)` → booleano.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/pruebas-hero.js`:

```js
describe('Hero.debeSaltarse', function () {
  prueba('un proyecto se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'proyecto', valor: 'bruma' }), true);
  });

  prueba('una categoría se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'categoria', valor: 'editorial' }), true);
  });

  prueba('sin ruta se muestra el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'todos', valor: null }), false);
  });

  prueba('no se rompe sin argumento', function () {
    igual(Hero.debeSaltarse(undefined), false);
    igual(Hero.debeSaltarse(null), false);
  });

  prueba('un tipo desconocido no se salta el hero', function () {
    igual(Hero.debeSaltarse({ tipo: 'inventado', valor: 'x' }), false);
  });
});
```

- [ ] **Step 2: Añadir los scripts al arnés y comprobar que fallan**

En `tests/test.html`, añadir `<script src="../js/hero.js"></script>` junto a los otros módulos y `<script src="pruebas-hero.js"></script>` junto a los otros archivos de pruebas, antes de la llamada a `window.Arnes.resumen()`.

Abrir `tests/test.html`.
Esperado: las cinco pruebas nuevas fallan con `Hero.debeSaltarse is not a function`.

- [ ] **Step 3: Implementar y exportar la función**

En `js/hero.js`, añadir junto al resto de funciones:

```js
  /* Quien llega por un enlace a un trabajo concreto no quiere una portada:
     el preloader hace su trabajo y de ahí se pasa directo a la galería. */
  function debeSaltarse(ruta) {
    if (!ruta) return false;
    return ruta.tipo === 'proyecto' || ruta.tipo === 'categoria';
  }
```

Y exportarla: `return { init: init, debeSaltarse: debeSaltarse };`

- [ ] **Step 4: Comprobar que las pruebas pasan**

Abrir `tests/test.html`.
Esperado: `——— 51 pasan, 0 fallan ———`.

- [ ] **Step 5: Usarla al retirar el preloader**

En `js/hero.js`, dentro de `retirarPreloader()`, sustituir la llamada a `mostrarFaseA()` por una bifurcación:

```js
        if (debeSaltarse(window.Router.rutaActual())) rematarEntrada();
        else mostrarFaseA();
```

Se reutiliza `rematarEntrada()` en lugar de repetir sus líneas: es exactamente el mismo desenlace, solo que sin secuencia previa. Quitar la clase `entrando` allí dentro es inocuo en esta rama, porque nunca llegó a ponerse.

`Router.rutaActual()` lee `location.hash` y consulta `window.Datos`, así que hay que llamarla aquí y no antes: en el momento del arranque todos los módulos ya están cargados, pero esta llamada ocurre además después del `load`, de modo que no hay ninguna duda.

- [ ] **Step 6: El foco al entrar**

El foco no debe ir a un proyecto: la galería tiene un manejador de `focusin` que centra el lienzo sobre el proyecto enfocado, así que enfocar uno al entrar desplazaría el lienzo de su reposo justo en el fotograma en que aparece.

En `index.html`, añadir `tabindex="-1"` a la sección de la galería:

```html
  <section class="gallery" id="gallery" tabindex="-1">
```

Y en `css/luque.css`, evitar que ese foco dibuje un contorno:

```css
  .gallery:focus{ outline:none; }
```

En `js/hero.js`, añadir el foco como última línea de `rematarEntrada()`. Al reutilizarla el paso 5 para los enlaces directos, con tocarla una vez quedan cubiertos los dos caminos:

```js
    document.getElementById('gallery').focus({ preventScroll: true });
```

- [ ] **Step 7: Verificar a mano**

1. `tests/test.html` da `——— 51 pasan, 0 fallan ———`.
2. Abrir `index.html#/bruma`: tras el preloader aparece la galería con el visor de Bruma ya abierto. No hay rótulo ni botón en ningún momento.
3. Abrir `index.html#/editorial`: tras el preloader aparece la galería ya filtrada.
4. Abrir `index.html` sin fragmento: aparece el hero completo con su botón.
5. Entrar por el botón y comprobar que el lienzo se queda **centrado**, sin desplazarse solo.
6. Tras entrar, la primera pulsación de `Tab` lleva al navbar, no a un proyecto.
7. Estando en la galería, pulsar `Esc` para quitar un filtro no resucita el hero.

- [ ] **Step 8: Commit**

```bash
git add index.html css/luque.css js/hero.js tests/pruebas-hero.js tests/test.html
git commit -m "Saltarse el hero en los enlaces directos

Quien abre un enlace a un proyecto o a una categoría no quiere una
portada: tras el preloader se pasa directo a la galería. El foco al
entrar va a la sección, no al primer proyecto, porque la galería centra
el lienzo sobre lo que recibe el foco y eso movería el lienzo justo en
el fotograma en que aparece.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Eliminar GSAP

Al terminar, la web no carga nada de la red y funciona con doble clic sin conexión.

**Files:**
- Modify: `index.html` (dos etiquetas de CDN y `registerPlugin`)
- Modify: `js/galeria.js` (comprobar que no queda ningún uso)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada nuevo.

- [ ] **Step 1: Comprobar que no queda ningún uso**

Antes de borrar nada, verificar que las Tasks 1 y 2 se llevaron todos los usos:

```bash
grep -n "gsap\.\|ScrollTrigger" js/*.js index.html
```

Esperado: solo las dos etiquetas `<script>` de `index.html` y la línea `gsap.registerPlugin(ScrollTrigger);` del bloque de arranque. Si aparece cualquier otra cosa, **detenerse y reportarlo**: significa que quedó un uso vivo y borrar las etiquetas rompería la web.

- [ ] **Step 2: Borrar las etiquetas y el registro**

En `index.html`, borrar el comentario `LIBRARIES` y las dos líneas:

```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

Y en el bloque de arranque, borrar la línea:

```js
  gsap.registerPlugin(ScrollTrigger);
```

- [ ] **Step 3: Verificar sin red**

Este es el paso que importa y no se puede hacer sirviendo por HTTP.

1. Abrir `index.html` con doble clic.
2. En las herramientas del navegador, pestaña Red, comprobar que **no hay ninguna petición a un dominio externo**. Todo debe ser `file://`.
3. Desconectar el wifi y volver a abrirlo con doble clic. La web debe funcionar por completo: preloader, hero, botón, entrada, galería, filtrado y visor.
4. Comprobar que la tipografía sigue siendo ABC Favorit y no una de reserva.
5. Comprobar el límite de líneas, que este trabajo hace crecer `js/hero.js` y encoger los otros dos:

```bash
wc -l js/*.js | sort -n
```

Esperado: ningún archivo por encima de 300.

- [ ] **Step 4: Actualizar el estado conocido**

En `docs/estado-conocido.md`, la sección «Dos cosas que dependen de la red» tiene un párrafo sobre GSAP que ha dejado de ser cierto. Sustituir ese párrafo por:

```markdown
**Ya no hay ninguna dependencia de red.** GSAP se eliminó al rehacer la entrada
del hero: solo quedaba usándose para dos fundidos del preloader, que ahora son
transiciones de CSS. La web funciona abriéndola con doble clic sin conexión.
```

Y renombrar el encabezado de la sección a «Una cosa que conviene saber», dejando dentro solo el párrafo de las fuentes.

- [ ] **Step 5: Commit**

```bash
git add index.html docs/estado-conocido.md
git commit -m "Eliminar GSAP y la última dependencia de red

Tras quitar el scroll, GSAP solo servía para dos fundidos del preloader,
que ahora son transiciones de CSS. Con sus dos etiquetas de CDN se va la
única dependencia externa que quedaba: la web funciona abriéndola con
doble clic y sin conexión a internet.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Notas del repaso del plan

**Una clase que nace inerte.** La Task 1 añade `galeria-activa` al `body` sin que esa clase haga todavía nada: quien revise esa tarea aislada la verá como código muerto. Cobra sentido en la Task 2, donde es lo que hace visible la galería. Es deliberado, y así el estado que la Task 1 deja ya es el correcto cuando llega la 2.

**El orden importa y no es negociable.** La Task 5 borra GSAP, pero las Tasks 1 y 2 son las que retiran sus usos. Ejecutar la 5 antes dejaría la web sin preloader ni navbar. El paso 1 de la Task 5 existe precisamente para detectar ese error antes de causarlo.

**Lo que el arnés puede ver de este trabajo es muy poco.** Solo `debeSaltarse` es lógica pura. Todo lo demás —los cuatro saltos, el corte de las fotos, que el amarillo no se interrumpa— es movimiento, y el navegador headless del arnés tiene la página en `document.hidden`, lo que congela animaciones y transiciones por completo. La verificación real de este trabajo es humana.

**Lo que sí se puede comprobar sin ver el movimiento:** que la página no tenga scroll, que las clases y los fotogramas clave existan y estén bien escritos, que `animationend` remate una sola vez, que los enlaces directos salten el hero, que el foco acabe donde debe, y que no quede ninguna petición externa.

**El riesgo que más vigilaría** es el paso 4 de la Task 2: la galería nace con `visibility:hidden` y sus rectángulos miden cero mientras está oculta. Todo el paneo del lienzo se calcula con `getBoundingClientRect`. Si `activar()` no llama a `measure()` después de hacerla visible, la galería aparece pero no se puede explorar, y el síntoma —un lienzo quieto— no se parece en nada a la causa.

**Una decisión que dejé fuera a propósito.** El botón «atrás» del navegador saca del sitio en lugar de devolver al hero. Arreglarlo requiere empujar una entrada al historial y escuchar `popstate`, y los casos límite de rutas ya han causado tres defectos en este proyecto. Si más adelante se quiere, es un añadido aislado que no toca nada de lo de aquí.

