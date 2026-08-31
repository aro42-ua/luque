# El segundo tramo del router — plan del bloque 4b

> **Para quien trabaje con subagentes:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los
> pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que las URLs del sitio lleven un segundo tramo opcional —
`#/bruma/3` abre la tercera foto de *bruma*, `#/bruma/ficha` abre su ficha— sin
cambiar ni un comportamiento del escritorio que ya está publicado.

**Arquitectura:** `js/router.js` tiene hoy 51 líneas y una sola función pura
(`parsearRuta`) con 10 pruebas; el resto —`ir`, `rutaActual`, `alCambiar`,
`init`— no tiene ninguna. Este bloque **extrae la decisión del historial a una
segunda función pura** (`decidir`) para que la regla nueva —empujar al cambiar
de proyecto, reemplazar al cambiar de foto— se pueda probar sin navegador y sin
tocar el historial del navegador. Lo que queda impuro son seis líneas de
cableado, y ésas se prueban con el arnés de DOM del bloque 4a.

**Stack:** JavaScript ES5 a mano, sin framework, sin build, sin gestor de
paquetes. Las pruebas corren en `tests/test.html` abierto en un navegador.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md`, secciones «Las
URLs llevan un segundo tramo» (líneas 220-248) y «Cómo se prueba» (296-312).

## Restricciones globales

- **ES5 en el navegador**: nada de `const`, `let`, flechas, clases, plantillas
  de cadena ni módulos ES. Patrón `window.Nombre` para exponer.
- **Techo de 300 líneas por archivo.**
- **Nada de credenciales en el repositorio.**
- Sin dependencias nuevas, sin paso de build.
- **Las piezas se numeran desde 1**, igual que el contador `02/08` que ve quien
  mira. No desde 0.
- **Un número fuera de rango o un tramo que no se entienda cae al proyecto por
  su portada**, no a la portada general: conserva lo que el enlace sí traía bien.
- **Se empuja historial al cambiar de proyecto y se reemplaza al cambiar de
  foto** (`pushState` frente a `replaceState`). Si cada deslizamiento empujara
  una entrada, salir de un proyecto de ocho fotos exigiría pulsar «atrás» ocho
  veces.
- **El escritorio no cambia de comportamiento en este bloque.** El campo `pieza`
  se analiza y se transporta, pero ningún consumidor de escritorio lo lee
  todavía. Cualquier diferencia visible en el escritorio es un defecto, no una
  mejora.

## Lo que ya se verificó empíricamente, para que nadie lo vuelva a descubrir

Estas tres cosas se comprobaron en un navegador real antes de escribir el plan.
No hace falta repetirlas; están aquí porque explican por qué el plan tiene la
forma que tiene.

1. **`history.replaceState` y `history.pushState` NO disparan `hashchange`.**
   Asignar `location.hash = '...'` sí, y además de forma **asíncrona**. Por eso
   `ir()` avisa a los suscriptores a mano en los caminos que usan `history`, y
   deja que el evento avise solo en el camino que asigna el hash. Esto ya lo
   hacía el código de hoy en la rama de `todos` (`js/router.js:23-24`); el
   bloque lo generaliza en vez de inventarlo.

2. **El historial de un iframe *es* el de la página que lo contiene.** Dos
   navegaciones dentro del iframe metieron dos entradas en el historial del
   padre, y quitar el iframe no las quita. Por eso la lógica del historial se
   extrae a una función pura: probarla con hashes de verdad rompería el botón
   «atrás» de quien corre la suite.

3. **`window.history` se puede sustituir dentro de un iframe con
   `Object.defineProperty`; `window.location` no** (`Cannot redefine property:
   location` — es *unforgeable*). De ahí que las pruebas de `ir()` doblen
   `history` y observen qué método se llamó con qué URL, en vez de navegar.

4. **`about:blank` no vale para esto, y una página de verdad sí.** Se probaron
   las dos:

   - Con `marco.src = 'about:blank#/bruma/1'` el hash llega bien, pero
     `history.replaceState` **lanza**: *«A history state object with URL
     `.../blank#/bruma/2` cannot be created in a document with origin
     `http://localhost:8765` and URL `about:blank#/bruma/1`»*. Un documento
     `about:blank` no tiene URL propia contra la que validar el cambio de
     estado. Además `d.open()/d.write()` borra el fragmento, porque
     `document.open()` navega a `about:blank` y se lo lleva por delante.
   - Con `marco.src = 'fijaciones/pagina-vacia.html#/bruma/1'` —un archivo de
     verdad, del mismo origen— **todo funciona y no cuesta nada**. Medido:
     `location.hash` llega valiendo `'#/bruma/1'`; la primera carga del iframe
     añade **0** entradas al historial; `replaceState` funciona, **cambia
     `location.hash` a `'#/bruma/2'`** y sigue sin añadir entradas; y los
     scripts cargan con `src` relativo, porque ahora el documento sí tiene URL
     propia desde la que resolver.

   Ese segundo camino es el que usa la Tarea 3, y tiene una consecuencia que
   simplifica todo: **no hace falta doblar `history`.** Se usa el de verdad, se
   observa `location.hash` y el delta de `history.length`, y así las pruebas
   comprueban comportamiento en vez de comprobar un doble.

## Estructura de archivos

| Archivo | Responsabilidad | Qué le pasa aquí |
|---|---|---|
| `js/router.js` | Traducir el fragmento de la URL a una intención, y aplicar los cambios de ruta | **Se modifica.** Gana el campo `pieza`, la función pura `decidir`, y `ir` pasa a tener un tercer argumento |
| `tests/pruebas-router.js` | Las pruebas puras del router | **Se modifica.** Las 10 de hoy se conservan; se amplían |
| `tests/pruebas-router-ir.js` | Las pruebas de la capa impura de `ir`, que necesitan un iframe | **Se crea** |
| `tests/test.html` | El índice de la suite del navegador | **Se modifica.** Una línea nueva |
| `docs/estado-conocido.md` | Qué está probado y qué no | **Se modifica** en la Tarea 4 |

`js/galeria.js`, `js/visor.js` y `js/hero.js` **no se tocan**. Leen `ruta.tipo` y
`ruta.valor`, que no cambian de forma ni de significado; el campo `pieza` es
nuevo y ellos lo ignoran. Esto es deliberado y es lo que mantiene el riesgo en
cero: si alguna tarea se ve obligada a tocarlos, **es señal de que algo se ha
diseñado mal — parad y avisad.**

## Cómo se corren las pruebas

La suite del navegador necesita un servidor; con doble clic sobre el archivo no
vale.

```
python -m http.server 8810
```

y abrir `http://localhost:8810/tests/test.html`. Al pie sale
«——— N pasan, M fallan ———».

**Aviso: `python -m http.server` no manda `Cache-Control`, así que el navegador
cachea.** Antes de recargar, `fetch(url, {cache:'reload'})` sobre los archivos
que hayas cambiado. Si no, verás el resultado de la versión anterior y creerás
que tu cambio no hizo nada.

Además, antes de cada commit:

```
node tests/prueba-borrador.js
python tests/auditar_rutas.py
```

**Punto de partida: 151 comprobaciones en verde.** Ese número está verificado
sobre `main` en `c3dd54d`. **No te fíes de él: cuéntalas tú antes de empezar.**
En el bloque anterior el plan anunciaba 99 cuando eran 101, y quien lo cazó fue
un implementador que contó en vez de fiarse.

---

## Tarea 1: El segundo tramo, en `parsearRuta`

**Archivos:**
- Modificar: `js/router.js:4-18` (`parsearRuta` e `idsProyecto`)
- Modificar: `tests/pruebas-router.js` (las 10 de hoy y las nuevas)

**Interfaces:**
- Produce: `Router.parsearRuta(fragmento, categorias, piezasPorId)` →
  `{ tipo: 'todos'|'categoria'|'proyecto', valor: string|null, pieza: number|'ficha'|null }`.
  `piezasPorId` es un objeto `{ idProyecto: cuántasPiezasTiene }`, por ejemplo
  `{ bruma: 8, humo: 0 }`. Sus claves **son** la lista de proyectos válidos: el
  tercer parámetro de hoy (`ids`) desaparece porque era redundante.
- Consume: nada de otras tareas.

### El cambio de firma, y por qué

Hoy la firma es `parsearRuta(fragmento, categorias, ids)`. Para decidir si `3`
es una pieza válida de *bruma* hace falta saber cuántas piezas tiene *bruma*, y
esa información no está en `ids`. En vez de añadir un cuarto parámetro opcional
—que es una trampa: quien lo olvide se queda sin comprobación de rango y en
verde— se sustituye `ids` por el mapa, cuyas **claves son los ids**. Un
parámetro menos y ninguna forma de usarlo a medias.

El mapa se recorre con `hasOwnProperty`, no con `in` ni con acceso directo: sin
esa guarda, `#/constructor` y `#/toString` se tomarían por proyectos, porque esas
claves viven en el prototipo de cualquier objeto. Hay una prueba para eso.

### La tabla de rutas que hay que cumplir

| Fragmento | `tipo` | `valor` | `pieza` |
|---|---|---|---|
| *(vacío)*, `#`, `#/` | `todos` | `null` | `null` |
| `#/editorial` | `categoria` | `editorial` | `null` |
| `#/bruma` | `proyecto` | `bruma` | `null` |
| `#/bruma/1` | `proyecto` | `bruma` | `1` |
| `#/bruma/8` (tiene 8) | `proyecto` | `bruma` | `8` |
| `#/bruma/ficha` | `proyecto` | `bruma` | `'ficha'` |
| `#/bruma/9` (se pasa) | `proyecto` | `bruma` | `null` |
| `#/bruma/0` | `proyecto` | `bruma` | `null` |
| `#/bruma/-2`, `#/bruma/2.5` | `proyecto` | `bruma` | `null` |
| `#/bruma/loquesea` | `proyecto` | `bruma` | `null` |
| `#/bruma/3/sobra` | `proyecto` | `bruma` | `null` |
| `#/humo/1` (vídeo, 0 piezas) | `proyecto` | `humo` | `null` |
| `#/humo/ficha` | `proyecto` | `humo` | `'ficha'` |
| `#/editorial/3` | `categoria` | `editorial` | `null` |
| `#/inventado/3` | `todos` | `null` | `null` |

Tres reglas que salen de esa tabla y conviene decir en voz alta:

- **La ficha vale siempre**, incluso en un proyecto de vídeo que tiene cero
  piezas. Es el fondo del eje vertical y existe para los doce proyectos.
- **Una categoría ignora el segundo tramo** en vez de caer a `todos`: conserva
  lo que el enlace sí traía bien, que es la regla general de la spec.
- **Un tercer tramo invalida la pieza**, no la ruta entera. `#/bruma/3/sobra`
  abre *bruma* por su portada.

- [ ] **Paso 1: Escribe las pruebas nuevas, antes de tocar `js/router.js`**

Sustituye la cabecera de `tests/pruebas-router.js` (líneas 1-5) por esto:

```js
describe('parsearRuta', function () {
  var CATS = ['editorial', 'videoclip'];
  /* Las claves son los proyectos que existen; el valor, cuántas piezas tiene
     cada uno. `humo` es de vídeo: cero piezas, pero su ficha sigue existiendo. */
  var PIEZAS = { bruma: 8, humo: 0 };

  function r(f) { return Router.parsearRuta(f, CATS, PIEZAS); }
```

Las 10 pruebas que ya existen (líneas 7-48) **no se tocan salvo en una cosa**:
todas esperan `{ tipo: ..., valor: ... }` y ahora la respuesta trae un tercer
campo. Añádeles `pieza: null` al objeto esperado. Por ejemplo, la primera pasa
de esto:

```js
  prueba('sin fragmento devuelve todos', function () {
    igual(r(''), { tipo: 'todos', valor: null });
  });
```

a esto:

```js
  prueba('sin fragmento devuelve todos', function () {
    igual(r(''), { tipo: 'todos', valor: null, pieza: null });
  });
```

Haz lo mismo en las diez. Ojo con la de la línea 32-35, que llama a
`Router.parsearRuta` directamente en vez de usar el ayudante `r`: pásale el mapa
también.

```js
  prueba('la categoría gana al proyecto con el mismo nombre', function () {
    igual(Router.parsearRuta('#/editorial', ['editorial'], { editorial: 4 }),
          { tipo: 'categoria', valor: 'editorial', pieza: null });
  });
```

Y ahora añade estas trece al final, justo antes del `});` que cierra el
`describe`:

```js
  prueba('una pieza numerada se entiende', function () {
    igual(r('#/bruma/3'), { tipo: 'proyecto', valor: 'bruma', pieza: 3 });
  });

  /* Se numeran desde 1 porque es lo que ve quien mira en el contador «02/08».
     Un índice desde 0 obligaría a sumar y restar uno en cada frontera, y esa
     es exactamente la clase de resta que se olvida en un sitio. */
  prueba('las piezas se numeran desde 1, así que 1 es la primera', function () {
    igual(r('#/bruma/1'), { tipo: 'proyecto', valor: 'bruma', pieza: 1 });
  });

  prueba('la última pieza cabe', function () {
    igual(r('#/bruma/8'), { tipo: 'proyecto', valor: 'bruma', pieza: 8 });
  });

  prueba('la ficha es un tramo con nombre, no un número', function () {
    igual(r('#/bruma/ficha'), { tipo: 'proyecto', valor: 'bruma', pieza: 'ficha' });
  });

  prueba('un número por encima del total cae a la portada del proyecto', function () {
    igual(r('#/bruma/9'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('el cero no es una pieza, porque se cuenta desde 1', function () {
    igual(r('#/bruma/0'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un negativo y un decimal tampoco son piezas', function () {
    igual(r('#/bruma/-2'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
    igual(r('#/bruma/2.5'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un tramo que no se entiende cae a la portada del proyecto', function () {
    igual(r('#/bruma/loquesea'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  prueba('un tercer tramo invalida la pieza, no el proyecto', function () {
    igual(r('#/bruma/3/sobra'), { tipo: 'proyecto', valor: 'bruma', pieza: null });
  });

  /* Un proyecto de vídeo tiene cero piezas: cualquier número se pasa de rango. */
  prueba('en un proyecto de vídeo ningún número es una pieza', function () {
    igual(r('#/humo/1'), { tipo: 'proyecto', valor: 'humo', pieza: null });
  });

  /* Pero la ficha sí: es el fondo del eje vertical y existe para los doce. */
  prueba('la ficha vale también en un proyecto de vídeo', function () {
    igual(r('#/humo/ficha'), { tipo: 'proyecto', valor: 'humo', pieza: 'ficha' });
  });

  /* Conserva lo que el enlace sí traía bien, en vez de tirarlo todo. */
  prueba('una categoría ignora el segundo tramo en vez de caer a todos', function () {
    igual(r('#/editorial/3'), { tipo: 'categoria', valor: 'editorial', pieza: null });
  });

  /* Sin `hasOwnProperty`, las claves del prototipo se tomarían por proyectos.
     Esta prueba muere si alguien cambia la comprobación por `in` o por un
     acceso directo al mapa. */
  prueba('una clave del prototipo no es un proyecto', function () {
    igual(r('#/constructor'), { tipo: 'todos', valor: null, pieza: null });
    igual(r('#/toString/1'), { tipo: 'todos', valor: null, pieza: null });
  });
```

- [ ] **Paso 2: Corre la suite y comprueba que se pone roja**

```
python -m http.server 8810
```
y abre `http://localhost:8810/tests/test.html`.

**Esperado: rojas las 13 nuevas y las 10 viejas** — las viejas porque ahora
esperan un campo `pieza` que el código todavía no devuelve, y las nuevas porque
el segundo tramo no existe.

**Pega la salida cruda en tu informe.** Si alguna de las 13 nuevas sale verde
antes de implementar nada, esa prueba no comprueba lo que dice y hay que
arreglarla antes de seguir: en el bloque anterior aparecieron nueve pruebas que
prometían más de lo que comprobaban, y ésta es la forma barata de cazarlas.

- [ ] **Paso 3: Implementa el segundo tramo**

En `js/router.js`, sustituye `parsearRuta` e `idsProyecto` (líneas 4-14) por
esto:

```js
  /* La ruta tiene como mucho dos tramos: `#/bruma/3`. El primero dice qué se
     abre; el segundo, dónde se está dentro de eso. `piezasPorId` mapea cada
     proyecto que existe con cuántas piezas tiene, y sus claves son la lista de
     proyectos válidos: separarlas en dos parámetros dejaba abierta la puerta a
     llamar con uno y sin el otro. */
  function parsearRuta(fragmento, categorias, piezasPorId) {
    var limpio = String(fragmento == null ? '' : fragmento).replace(/^#/, '').replace(/^\//, '').trim();
    if (!limpio) return { tipo: 'todos', valor: null, pieza: null };

    var tramos = limpio.split('/');
    var cabeza = tramos[0].trim();

    if (categorias.indexOf(cabeza) !== -1) {
      /* Una categoría no tiene piezas. Si el enlace trae un segundo tramo se
         ignora, en vez de tirar la ruta entera: conserva lo que sí traía bien. */
      return { tipo: 'categoria', valor: cabeza, pieza: null };
    }

    /* `hasOwnProperty` y no `in`: sin esto, `#/constructor` y `#/toString`
       pasarían por proyectos, porque esas claves están en el prototipo de
       cualquier objeto. */
    if (Object.prototype.hasOwnProperty.call(piezasPorId, cabeza)) {
      return { tipo: 'proyecto', valor: cabeza,
               pieza: parsearPieza(tramos, piezasPorId[cabeza]) };
    }

    return { tipo: 'todos', valor: null, pieza: null };
  }

  /* Devuelve el número de pieza (desde 1), la cadena 'ficha', o null si el
     tramo no se entiende o se sale de rango. Null significa «este proyecto,
     por su portada»: el fallo menos destructivo, porque conserva el proyecto
     que el enlace sí acertó. */
  function parsearPieza(tramos, cuantasPiezas) {
    if (tramos.length !== 2) return null;      // ni un solo tramo, ni tres
    var cola = tramos[1].trim();
    if (cola === 'ficha') return 'ficha';      // vale incluso con cero piezas
    if (!/^[0-9]+$/.test(cola)) return null;   // descarta '', '-2', '2.5', 'abc'
    var n = Number(cola);
    if (n < 1 || n > cuantasPiezas) return null;
    return n;
  }

  function piezasPorId() {
    var mapa = {};
    window.Datos.PROYECTOS.forEach(function (p) {
      mapa[p.id] = (p.piezas && p.piezas.length) || 0;
    });
    return mapa;
  }
```

Y cambia `rutaActual` (líneas 16-18) para que pase el mapa:

```js
  function rutaActual() {
    return parsearRuta(location.hash, window.Datos.CATEGORIAS, piezasPorId());
  }
```

`idsProyecto` desaparece: el mapa lo sustituye. Comprueba con una búsqueda que
no queda ninguna llamada a esa función antes de borrarla.

- [ ] **Paso 4: Corre la suite y comprueba que se pone verde**

Recarga con `fetch(url, {cache:'reload'})` primero. **Esperado: 164 pasan, 0
fallan** (151 + 13). Cuenta tú el total en vez de fiarte de mi aritmética.

Pega la salida cruda.

- [ ] **Paso 5: Comprueba que las pruebas no son de mentira**

Rompe el código a propósito, una rotura cada vez, deshaciéndola antes de la
siguiente. El criterio **no** es «cada rotura pone alguna prueba en rojo» —eso
es un umbral flojo que se cumple sin cubrir casi nada—: es **que cada una de las
13 nuevas caiga ante alguna rotura**. Si alguna sobrevive a todas, esa prueba no
comprueba lo que su nombre dice.

Roturas sugeridas, que entre las cuatro deberían tumbarlas todas:

1. En `parsearPieza`, cambia `if (n < 1 || n > cuantasPiezas)` por
   `if (n < 0 || n > cuantasPiezas)` — debe morir «el cero no es una pieza».
2. Quita la línea `if (tramos.length !== 2) return null;` — debe morir «un
   tercer tramo invalida la pieza».
3. Cambia `Object.prototype.hasOwnProperty.call(piezasPorId, cabeza)` por
   `piezasPorId[cabeza] !== undefined` — debe morir «una clave del prototipo no
   es un proyecto».
4. Mueve la comprobación de `ficha` a después de la de rango — debe morir «la
   ficha vale también en un proyecto de vídeo».

Pega la salida cruda de cada rotura. Después de la última, comprueba con
`git diff js/router.js` que no queda nada de las roturas.

Si alguna de las 13 sobrevive a las cuatro, dilo en el informe con el nombre de
la prueba y propón la rotura que sí la mataría.

- [ ] **Paso 6: Commit**

```bash
git add js/router.js tests/pruebas-router.js
git commit -m "Entender el segundo tramo de la ruta: la pieza

Las URLs pasan a poder decir en que foto de un proyecto se esta:
#/bruma/3 abre la tercera, #/bruma/ficha abre su ficha. Un numero
fuera de rango o un tramo que no se entienda cae al proyecto por su
portada, que es el fallo menos destructivo: conserva el proyecto que
el enlace si acerto.

El tercer parametro pasa de ser la lista de ids a un mapa de id a
cuantas piezas tiene, porque para juzgar si 3 es una pieza valida de
bruma hace falta saber cuantas tiene. Sus claves siguen siendo la
lista de proyectos, asi que es un parametro menos, no uno mas."
```

---

## Tarea 2: `decidir`, la regla del historial como función pura

**Archivos:**
- Modificar: `js/router.js` (añadir `decidir` y exponerla)
- Modificar: `tests/pruebas-router.js` (un `describe` nuevo al final)

**Interfaces:**
- Consume: la forma `{ tipo, valor, pieza }` que produce la Tarea 1.
- Produce: `Router.decidir(hashActual, destino)` → `{ accion: 'empujar'|'reemplazar'|'avisar', hash: string }`.
  `destino` es un `{ tipo, valor, pieza }`. `hash` es el fragmento completo con
  almohadilla (`'#/bruma/3'`) o la cadena vacía para la portada general.

### Por qué esto es una función aparte

La regla del historial es la parte de este bloque que puede arruinar la
experiencia —salir de un proyecto de ocho fotos pulsando «atrás» ocho veces— y
es imposible de probar donde vive hoy: para ejercitarla haría falta navegar de
verdad, y **el historial de un iframe es el del navegador de quien corre las
pruebas**, así que la suite le rompería el botón «atrás».

Separada, es aritmética de cadenas: entra el hash actual y a dónde se quiere ir,
sale qué hacer. Ni `location`, ni `history`, ni `document`. Es el mismo corte que
`js/visor-estado.js`, que son 78 líneas de máquina de estado con 13 pruebas
mientras el visor que la usa no tiene ninguna.

### Las reglas, y cuáles son nuevas

| Situación | Acción | ¿Nueva? |
|---|---|---|
| El destino es la portada general (`todos`) | `reemplazar` a `''` | No: es lo que hace hoy `js/router.js:23` |
| El hash de destino es igual al actual | `avisar` | No: `js/router.js:27-28` |
| Mismo proyecto, distinta pieza | `reemplazar` | **Sí** |
| Cualquier otro cambio | `empujar` | No: hoy es `location.hash = ...` |

**Sólo una fila es nueva.** Las otras tres describen lo que el router ya hace, y
están en la tabla para que se prueben: hoy no las cubre nada, y son las que
podrían romper el escritorio publicado.

- [ ] **Paso 1: Escribe las pruebas, antes de escribir `decidir`**

Añade al final de `tests/pruebas-router.js`, después del `});` que cierra el
`describe` de `parsearRuta`:

```js
describe('decidir', function () {
  function d(hashActual, tipo, valor, pieza) {
    return Router.decidir(hashActual, { tipo: tipo, valor: valor, pieza: pieza });
  }

  // ---- El hash que se construye ------------------------------------

  prueba('la portada general no tiene hash', function () {
    igual(d('#/bruma', 'todos', null, null).hash, '');
  });

  prueba('una categoría es un solo tramo', function () {
    igual(d('', 'categoria', 'editorial', null).hash, '#/editorial');
  });

  prueba('un proyecto sin pieza es un solo tramo', function () {
    igual(d('', 'proyecto', 'bruma', null).hash, '#/bruma');
  });

  prueba('un proyecto con pieza lleva el número en el segundo tramo', function () {
    igual(d('', 'proyecto', 'bruma', 3).hash, '#/bruma/3');
  });

  prueba('la ficha va en el segundo tramo como palabra', function () {
    igual(d('', 'proyecto', 'bruma', 'ficha').hash, '#/bruma/ficha');
  });

  // ---- Qué se hace con el historial --------------------------------

  /* La regla que existe este bloque para traer: si cada deslizamiento empujara
     una entrada, salir de un proyecto de ocho fotos exigiría ocho «atrás». */
  prueba('cambiar de foto dentro del mismo proyecto reemplaza', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 4).accion, 'reemplazar');
  });

  prueba('y también al abrir la ficha del proyecto en el que ya estás', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 'ficha').accion, 'reemplazar');
  });

  prueba('y al volver de la ficha a una foto', function () {
    igual(d('#/bruma/ficha', 'proyecto', 'bruma', 2).accion, 'reemplazar');
  });

  /* En cambio cambiar de proyecto sí empuja: es el salto que quien mira espera
     poder deshacer con «atrás». */
  prueba('cambiar de proyecto empuja', function () {
    igual(d('#/bruma/3', 'proyecto', 'humo', null).accion, 'empujar');
  });

  prueba('entrar en un proyecto desde la portada empuja', function () {
    igual(d('', 'proyecto', 'bruma', null).accion, 'empujar');
  });

  prueba('filtrar por categoría empuja', function () {
    igual(d('', 'categoria', 'editorial', null).accion, 'empujar');
  });

  /* Esto no es nuevo: es lo que hace hoy js/router.js:23, y se prueba aquí
     porque hasta ahora no lo cubría nada. */
  prueba('volver a la portada general reemplaza, como hoy', function () {
    igual(d('#/bruma', 'todos', null, null).accion, 'reemplazar');
  });

  /* Tampoco es nuevo: js/router.js:27-28. Sin esta rama, pulsar la categoría
     en la que ya estás no avisaría a nadie y la galería se quedaría quieta. */
  prueba('ir a donde ya estás no toca el historial, sólo avisa', function () {
    igual(d('#/bruma/3', 'proyecto', 'bruma', 3).accion, 'avisar');
    igual(d('#/editorial', 'categoria', 'editorial', null).accion, 'avisar');
  });

  prueba('y estar ya en la portada general también sólo avisa', function () {
    igual(d('', 'todos', null, null).accion, 'avisar');
  });

  /* El hash de verdad puede venir sin barra o con espacios; comparar en crudo
     haría que «ya estoy aquí» fallara y se empujara una entrada de más. */
  prueba('comparar dónde estás no depende de cómo esté escrito el hash', function () {
    igual(d('#bruma', 'proyecto', 'bruma', null).accion, 'avisar');
    igual(d('bruma', 'proyecto', 'bruma', null).accion, 'avisar');
  });
});
```

- [ ] **Paso 2: Corre la suite y comprueba que se pone roja**

**Esperado: las 15 nuevas en rojo**, con un error del estilo «Router.decidir is
not a function». Pega la salida cruda.

- [ ] **Paso 3: Implementa `decidir`**

Añade a `js/router.js`, después de `parsearPieza`:

```js
  /* Construye el fragmento que le corresponde a un destino. La portada general
     no tiene fragmento: se va a la URL desnuda. */
  function hashDe(destino) {
    if (destino.tipo === 'todos') return '';
    var h = '#/' + destino.valor;
    if (destino.tipo === 'proyecto' && destino.pieza != null) h += '/' + destino.pieza;
    return h;
  }

  /* Normaliza un fragmento para poder compararlo: el hash real puede llegar
     como '#/bruma', '#bruma' o 'bruma' según quién lo escriba. Sin esto,
     «¿ya estoy donde quiero ir?» daría que no y se empujaría una entrada de
     más cada vez. */
  function normalizar(hash) {
    return String(hash == null ? '' : hash).replace(/^#/, '').replace(/^\//, '').trim();
  }

  /* Decide qué hacer con el historial al ir a `destino` estando en
     `hashActual`. Es puro a propósito: la regla de empujar-o-reemplazar es lo
     que hace que salir de un proyecto de ocho fotos cueste un «atrás» y no
     ocho, y probarla navegando de verdad ensuciaría el historial del navegador
     de quien corre las pruebas — el historial de un iframe es el de su padre. */
  function decidir(hashActual, destino) {
    var hash = hashDe(destino);

    if (normalizar(hashActual) === normalizar(hash)) {
      return { accion: 'avisar', hash: hash };
    }

    /* Moverse dentro del mismo proyecto —otra foto, o la ficha— reemplaza. */
    var actual = normalizar(hashActual).split('/');
    if (destino.tipo === 'proyecto' && actual[0] === destino.valor) {
      return { accion: 'reemplazar', hash: hash };
    }

    /* La portada general reemplaza, que es lo que ya hacía el router antes de
       este bloque. Se conserva a propósito: cambiarlo sería tocar el
       escritorio publicado, y este bloque no hace eso. */
    if (destino.tipo === 'todos') {
      return { accion: 'reemplazar', hash: hash };
    }

    return { accion: 'empujar', hash: hash };
  }
```

Y añádela al objeto que se devuelve, al final del archivo:

```js
  return {
    parsearRuta: parsearRuta,
    decidir: decidir,
    rutaActual: rutaActual,
    ir: ir,
    alCambiar: alCambiar,
    init: init
  };
```

- [ ] **Paso 4: Corre la suite y comprueba que se pone verde**

**Esperado: 179 pasan, 0 fallan** (164 + 15). Cuenta tú. Pega la salida cruda.

- [ ] **Paso 5: Comprueba que las pruebas no son de mentira**

Mismo criterio que la Tarea 1: **cada una de las 15 nuevas tiene que caer ante
alguna rotura.** Roturas sugeridas:

1. Quita la rama de `reemplazar` del mismo proyecto — debe morir «cambiar de
   foto dentro del mismo proyecto reemplaza» y sus dos hermanas.
2. Cambia `normalizar(hashActual) === normalizar(hash)` por
   `hashActual === hash` — debe morir «comparar dónde estás no depende de cómo
   esté escrito el hash».
3. En `hashDe`, quita el `&& destino.pieza != null` — debe morir «un proyecto
   sin pieza es un solo tramo».
4. Cambia la rama de `todos` para que devuelva `empujar` — debe morir «volver a
   la portada general reemplaza, como hoy».

Pega la salida cruda de cada una y confirma con `git diff js/router.js` que
quedan deshechas.

**Cuidado con un enmascaramiento**: si haces dos roturas a la vez, la de
`normalizar` y la del mismo proyecto se tapan entre sí (sin normalizar, la
comparación de proyecto también falla, y el resultado coincide por casualidad).
Hazlas de una en una. En el bloque anterior este mismo efecto dio por buena una
prueba que no lo era.

- [ ] **Paso 6: Commit**

```bash
git add js/router.js tests/pruebas-router.js
git commit -m "Sacar la regla del historial a una funcion pura

Si cada deslizamiento empujara una entrada al historial, salir de un
proyecto de ocho fotos exigiria pulsar «atras» ocho veces. La regla
—empujar al cambiar de proyecto, reemplazar al cambiar de foto— vive
ahora en `decidir`, que no toca ni location ni history.

Esta aparte porque probarla donde vivia era imposible sin navegar de
verdad, y el historial de un iframe es el del navegador de quien corre
las pruebas: la suite le romperia el boton «atras». Asi son quince
comprobaciones de aritmetica de cadenas.

Tres de las cuatro reglas ya las cumplia el router; se prueban aqui
porque hasta hoy no las cubria nada, y son las que podrian romper el
escritorio ya publicado."
```

---

## Tarea 3: Cablear `ir()`, y probarlo por primera vez

**Archivos:**
- Modificar: `js/router.js:20-30` (`ir`)
- Modificar: `tests/arnes-dom.js` (una función nueva: `conPagina`)
- Crear: `tests/fijaciones/pagina-vacia.html`
- Crear: `tests/pruebas-router-ir.js`
- Modificar: `tests/pruebas-arnes-dom.js` (las pruebas de `conPagina`)
- Modificar: `tests/test.html` (una línea)

**Interfaces:**
- Consume: `Router.decidir` de la Tarea 2.
- Produce: `Router.ir(tipo, valor, pieza)`. El tercer parámetro es opcional:
  `Router.ir('categoria', 'editorial')` sigue funcionando igual que hoy, que es
  como lo llaman `js/galeria.js:196-197` y `js/visor.js:41,129-130`.
- Produce: `ArnesDom.conPagina({ pagina, hash, scripts }, fn)` → promesa. Carga
  un archivo HTML de verdad en un iframe, con el fragmento que se le pida, y le
  añade los scripts indicados antes de llamar a `fn(w, d)`.

### Lo que hace especial a esta tarea

`ir()` no tiene ni una prueba desde que existe, y es la función que toca el
historial del navegador. Cubrirla es la primera vez que el arnés del bloque 4a
se usa sobre código de producción, así que **si el arnés tiene un hueco, sale
aquí**. Si te topas con uno, dilo en el informe en vez de rodearlo: es
información que vale más que la prueba que ibas a escribir.

La técnica está verificada entera en un navegador real y está descrita en el
apartado «Lo que ya se verificó empíricamente» de arriba. Lo esencial:

- El iframe carga **un archivo HTML de verdad** (`fijaciones/pagina-vacia.html`)
  con el fragmento en el `src`, fijado **antes** de insertarlo. `about:blank`
  no vale: ahí `replaceState` lanza.
- **No se dobla `history`.** Se usa el de verdad. `replaceState` funciona,
  cambia `location.hash` y no añade entradas, así que las pruebas comprueban
  comportamiento —dónde acabó la URL, cuánto creció el historial— en vez de
  comprobar un doble.
- **Montar el escenario cuesta cero entradas de historial**, medido.

**El único camino que sí navega es el de `empujar`**, porque asigna
`location.hash` de verdad — y no se puede evitar sin dejar de probarlo. Eso mete
una entrada en el historial del navegador de quien corre la suite, y quitar el
iframe no la quita. Por eso **hay un solo escenario de `empujar`** en todo el
archivo, con tres comprobaciones colgando de él, en vez de tres escenarios.
**Mide cuántas entradas añade una corrida completa** y ponlo en el informe con
el número real; la Tarea 4 lo documenta.

- [ ] **Paso 1: Amplía el arnés con `conPagina`**

`ArnesDom.conDocumento` **escribe** el documento con `d.write`, y eso aquí no
sirve: `document.open()` navega a `about:blank` y se lleva el fragmento por
delante. Hace falta una hermana que **cargue** una página en vez de escribirla.

**No toques `conDocumento`.** De él dependen las 21 pruebas de `panel.js` que el
bloque 4a acaba de dejar en verde; cambiarlo obligaría a revalidarlas todas. Que
haya dos formas de montar un documento es deuda asumida a conciencia — deja
escrito en un comentario por qué son dos, para que quien llegue después no
intente unificarlas sin saber lo que rompe.

Crea primero la página que se va a cargar, `tests/fijaciones/pagina-vacia.html`:

```html
<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><title>fijación: página vacía</title></head>
<body></body>
</html>
```

Está vacía a propósito: lo único que aporta es **ser un archivo de verdad, del
mismo origen**, para que el documento del iframe tenga una URL propia. Sin eso
`history.replaceState` lanza y `ir()` no se puede probar.

Después añade `conPagina` a `tests/arnes-dom.js`, junto a `conDocumento`,
reutilizando `caja()` como hacen las demás. La forma verificada es ésta; ajústala
al estilo del archivo:

```js
  /* Hermana de `conDocumento` para cuando el código bajo prueba mira la URL.
     `conDocumento` escribe el documento con `d.write`, y eso no sirve aquí por
     dos motivos comprobados: `document.open()` navega a about:blank y borra el
     fragmento, y sobre un documento about:blank `history.replaceState` lanza
     («cannot be created in a document with origin ... and URL about:blank»).
     Cargando un archivo de verdad, el documento tiene URL propia: el hash
     llega, replaceState funciona, y la primera carga del iframe no añade
     ninguna entrada al historial.

     Las dos conviven a propósito. No las unifiques sin revalidar las 21
     pruebas de panel.js, que dependen del camino de `conDocumento`. */
  function conPagina(opciones, fn) {
    var c = caja();
    var marco = document.createElement('iframe');
    marco.src = opciones.pagina + (opciones.hash || '');   // el hash, ANTES de insertar
    c.appendChild(marco);

    function limpiar() { if (c.parentNode) c.parentNode.removeChild(c); }

    return new Promise(function (resolver, rechazar) {
      marco.onload = function () { resolver(); };
      marco.onerror = function () {
        rechazar(new Error('No se pudo cargar «' + opciones.pagina + '». '
          + 'Si has abierto test.html con doble clic, arráncalo con un servidor: '
          + 'python -m http.server'));
      };
    }).then(function () {
      var d = marco.contentDocument, w = marco.contentWindow;
      var pendientes = (opciones.scripts || []).slice();

      function siguiente() {
        if (!pendientes.length) return Promise.resolve(fn(w, d));
        var ruta = pendientes.shift();
        return new Promise(function (res, rech) {
          var s = d.createElement('script');
          s.src = ruta;
          s.onload = function () { res(); };
          s.onerror = function () {
            rech(new Error('No se pudo cargar «' + ruta + '» dentro del iframe. '
              + 'Arranca un servidor: python -m http.server'));
          };
          d.head.appendChild(s);
        }).then(siguiente);
      }
      return siguiente();
    }).then(function (r) { limpiar(); return r; },
            function (e) { limpiar(); throw e; });
  }
```

Y añádela al objeto que devuelve el arnés, junto a `conElemento` y
`conDocumento`.

Las rutas de `scripts` son **relativas a la página cargada**, no a `test.html`:
desde `tests/fijaciones/pagina-vacia.html`, `js/router.js` es
`'../../js/router.js'`. Es distinto de `conDocumento` —que usa un `<base>`— y
hay que decirlo en el comentario, porque es justo la clase de diferencia que se
descubre con media hora perdida.

Añade sus dos pruebas al final de `tests/pruebas-arnes-dom.js`, en el estilo de
las que ya hay:

```js
describeAsync('ArnesDom.conPagina', function () {

  return ArnesDom.conPagina({
    pagina: 'fijaciones/pagina-vacia.html',
    hash: '#/bruma/3',
    scripts: ['../../js/reglas-contenido.js']
  }, function (w, d) {

    /* Sin esto no se puede probar nada que mire la URL, que es la razón de que
       esta función exista. */
    prueba('el fragmento llega al iframe', function () {
      igual(w.location.hash, '#/bruma/3');
    });

    /* Y sin URL propia, `replaceState` lanza: es la diferencia entre cargar un
       archivo de verdad y escribir sobre about:blank. */
    prueba('y el documento tiene URL propia, así que replaceState no lanza', function () {
      w.history.replaceState(null, '', w.location.pathname + '#/bruma/4');
      igual(w.location.hash, '#/bruma/4');
    });

    prueba('los scripts se cargan de verdad dentro del iframe', function () {
      igual(typeof w.ReglasContenido, 'object');
    });

    laCaja = w.frameElement.parentNode;   // el <iframe> vive dentro de la caja
    return true;
  }).then(function () {
    /* Se comprueba que desapareció ESE nodo, no que no queda ninguno en la
       página. Un recuento global (`querySelectorAll('.arnes-dom-caja').length`)
       ve los iframes de otras secciones asíncronas y sale en rojo por turnos:
       exactamente la carrera que hubo que arreglar en el bloque 4a. */
    prueba('y quita del documento la caja que creó, no «alguna caja»', function () {
      cierto(!document.contains(laCaja), 'la caja de conPagina se quedó en el documento');
    });
  });
});
```

Declara `var laCaja;` antes del `return ArnesDom.conPagina(`, como hace la
sección de `conDocumento` en ese mismo archivo.

- [ ] **Paso 2: Escribe las pruebas de `ir`, antes de tocarlo**

Crea `tests/pruebas-router-ir.js`:

```js
/* Las pruebas de la capa impura de `ir`. Viven aparte de pruebas-router.js
   porque necesitan una página con URL de verdad: `ir` lee `location.hash` y
   llama a `history`, y ninguna de las dos cosas existe en una función pura.

   No se dobla `history`: se usa el de verdad. `replaceState` cambia el hash sin
   añadir entradas, así que se puede comprobar dónde acabó la URL y cuánto
   creció el historial, que es comportamiento — en vez de comprobar a quién se
   llamó, que sería comprobar un doble. */

describeAsync('Router.ir', function () {

  var MODULOS = ['../../js/reglas-contenido.js', '../../js/datos.js', '../../js/router.js'];

  var PROYECTOS = [
    { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
      ficha: {}, piezas: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] },
    { id: 'humo', titulo: 'Humo', categoria: 'videoclip', tipo: 'video',
      ficha: {}, piezas: [] }
  ];

  /* Monta una página con el router cargado de verdad, partiendo del hash que se
     pida, y le pasa a `fn` la ventana, cuántas entradas tenía el historial al
     empezar, y la lista donde se van apuntando los avisos a los suscriptores. */
  function conRouter(hashDePartida, fn) {
    var avisos = [];
    return ArnesDom.conPagina({
      pagina: 'fijaciones/pagina-vacia.html',
      hash: hashDePartida,
      scripts: MODULOS
    }, function (w, d) {
      w.Datos.establecer(PROYECTOS.map(function (p) { return p; }));
      /* `init()` ANTES de suscribirse, y el orden importa: es quien registra el
         oyente de `hashchange`, sin el cual el camino de empujar —que asigna
         `location.hash`— no avisaría a nadie. Se llama antes porque `init`
         avisa nada más arrancar, y así ese primer aviso no ensucia la cuenta. */
      w.Router.init();
      w.Router.alCambiar(function (ruta) { avisos.push(ruta); });
      return fn(w, w.history.length, avisos);
    });
  }

  /* `location.hash = ...` dispara `hashchange` de forma asíncrona. Comprobar
     justo después de llamar a `ir` leería el estado de antes, y la prueba
     pasaría o fallaría por el motivo equivocado. */
  function trasElHashchange(w) {
    return new Promise(function (resolver) {
      var resuelto = false;
      w.addEventListener('hashchange', function () {
        if (!resuelto) { resuelto = true; resolver(); }
      });
      setTimeout(function () { if (!resuelto) { resuelto = true; resolver(); } }, 500);
    });
  }

  // ---- Cambiar de foto: reemplaza -----------------------------------

  return conRouter('#/bruma/1', function (w, largoInicial, avisos) {
    w.Router.ir('proyecto', 'bruma', 2);

    prueba('cambiar de foto no añade una entrada al historial', function () {
      igual(w.history.length, largoInicial);
    });

    prueba('y la URL pasa a la foto nueva', function () {
      igual(w.location.hash, '#/bruma/2');
    });

    /* replaceState no dispara `hashchange`, así que si `ir` no avisara a mano
       nadie se enteraría y la pantalla se quedaría en la foto anterior. Es el
       fallo más probable de esta función. */
    prueba('y avisa a mano con la ruta nueva, porque replaceState no lo hace', function () {
      igual(avisos.length, 1);
      igual(avisos[0].valor, 'bruma');
      igual(avisos[0].pieza, 2);
    });

  }).then(function () {

    // ---- La ficha, por el mismo camino ------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('proyecto', 'bruma', 'ficha');

      prueba('abrir la ficha del proyecto en el que ya estás tampoco añade entrada', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '#/bruma/ficha');
      });

      prueba('y el aviso lleva la ficha', function () {
        igual(avisos.length, 1);
        igual(avisos[0].pieza, 'ficha');
      });
    });

  }).then(function () {

    // ---- Ir a donde ya estás ----------------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('proyecto', 'bruma', 2);

      prueba('ir a donde ya estás no toca ni el historial ni la URL', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '#/bruma/2');
      });

      /* Sin este aviso, pulsar la categoría en la que ya estás dejaría la
         galería quieta. Es comportamiento de hoy y hay que conservarlo. */
      prueba('pero avisa igual, para que la pantalla se repinte', function () {
        igual(avisos.length, 1);
      });
    });

  }).then(function () {

    // ---- La portada general -----------------------------------------

    return conRouter('#/bruma/2', function (w, largoInicial, avisos) {
      w.Router.ir('todos');

      prueba('volver a la portada deja la URL sin fragmento y no añade entrada', function () {
        igual(w.history.length, largoInicial);
        igual(w.location.hash, '');
      });

      prueba('y avisa de que ya no hay filtro', function () {
        igual(avisos.length, 1);
        igual(avisos[0].tipo, 'todos');
      });
    });

  }).then(function () {

    // ---- El único escenario que navega de verdad --------------------

    /* Éste asigna `location.hash`, así que sí añade una entrada al historial
       del navegador de quien corre la suite: el historial de un iframe es el de
       su padre, y quitar el iframe no la devuelve. Por eso hay UN escenario de
       empujar y no tres, con las tres comprobaciones colgando de él.

       Se hace con `ir('categoria', 'editorial')` —dos argumentos— porque así
       cubre de paso que llamarla como la llama el escritorio hoy
       (js/galeria.js:196-197, js/visor.js:41,129-130) no inventa una pieza. Si
       el tercer argumento fuera obligatorio, el escritorio no daría error:
       escribiría «#/editorial/undefined», que es peor. */
    return conRouter('#/bruma', function (w, largoInicial, avisos) {
      w.Router.ir('categoria', 'editorial');

      return trasElHashchange(w).then(function () {
        prueba('cambiar de sitio sí añade una entrada al historial', function () {
          igual(w.history.length, largoInicial + 1);
        });

        prueba('y la URL lleva la categoría', function () {
          igual(w.location.hash, '#/editorial');
        });

        prueba('y llamarla con dos argumentos no inventa una pieza', function () {
          igual(avisos.length, 1);
          igual(avisos[0].tipo, 'categoria');
          igual(avisos[0].pieza, null);
        });
      });
    });
  });
});
```

Añade la línea a `tests/test.html`, junto a las demás pruebas:

```html
<script src="pruebas-router-ir.js"></script>
```

- [ ] **Paso 3: Corre la suite y comprueba que se pone roja**

**Esperado: en rojo las 12 de `ir` y las 4 de `conPagina`.** Pega la salida
cruda. Si alguna sale verde antes de tocar `ir`, esa prueba no comprueba lo que
su nombre dice y hay que arreglarla antes de seguir.

- [ ] **Paso 4: Reescribe `ir`**

Sustituye `ir` (`js/router.js:20-30`) por esto:

```js
  /* La capa impura, y a propósito nada más que eso: la decisión está en
     `decidir`, que es pura y está cubierta. Aquí sólo se aplica.

     Los dos caminos avisan de forma distinta y no es un descuido:
     `location.hash = ...` dispara `hashchange`, que ya está suscrito en `init`
     y llama a `avisar` solo —de forma asíncrona—. `history.replaceState` no
     dispara nada, así que ahí hay que avisar a mano. */
  function ir(tipo, valor, pieza) {
    var plan = decidir(location.hash, {
      tipo: tipo,
      valor: valor,
      pieza: pieza === undefined ? null : pieza
    });

    if (plan.accion === 'empujar') {
      location.hash = plan.hash;
      return;
    }
    if (plan.accion === 'reemplazar') {
      history.replaceState(null, '', location.pathname + location.search + plan.hash);
    }
    avisar();
  }
```

Fíjate en dos cosas al escribirlo:

- **`pieza === undefined ? null : pieza`** y no `pieza || null`: con `||`, la
  pieza `0` se convertiría en `null`. Hoy `0` nunca es una pieza válida, pero
  esa clase de coerción es exactamente la que sobrevive a un cambio de criterio
  y falla dos bloques después.
- **`plan.hash` vacío no deja `#` colgando**: para la portada general
  `plan.hash` es `''`, así que `pathname + search + ''` es la URL desnuda, que
  es lo que hacía el código de hoy.

Y desaparece la línea `var destino = (tipo === 'todos') ? ' ' : '#/' + valor;`,
que construía una cadena de un solo espacio que nunca se usaba en esa rama.

- [ ] **Paso 5: Corre la suite y comprueba que se pone verde**

**Esperado: 195 pasan, 0 fallan** (179 + 12 de `ir` + 4 de `conPagina`).
Cuenta tú en vez de fiarte de mi aritmética.

Pega la salida cruda.

- [ ] **Paso 6: Comprueba que las pruebas no son de mentira**

Cada una de las 12 de `ir` tiene que caer ante alguna rotura. Sugeridas:

1. Quita el `avisar()` final — debe morir «avisa a los suscriptores a mano».
2. Cambia `pieza === undefined ? null : pieza` por `pieza || null` y prueba con
   `ir('proyecto','bruma',0)` — argumenta en el informe si esto lo caza alguna
   prueba actual; **si no lo caza ninguna, dilo** en vez de añadir una prueba
   por tu cuenta: es una decisión de alcance y la toma quien controla el plan.
3. Cambia `location.pathname + location.search + plan.hash` por `plan.hash` a
   secas — debe morir «volver a la portada deja la URL sin fragmento».
4. Haz que `empujar` use `replaceState` en vez de asignar el hash — debe morir
   «cambiar de sitio sí añade una entrada al historial».
5. Haz que `reemplazar` asigne `location.hash` en vez de usar `replaceState` —
   deben morir las tres pruebas de «no añade una entrada al historial». Ésta es
   la rotura que importa: es el defecto que dejaría salir de un proyecto de ocho
   fotos a base de ocho «atrás», y es la razón de ser del bloque.

Pega la salida cruda de cada una y confirma que quedan deshechas.

- [ ] **Paso 7: Mide el coste en historial**

En la consola del navegador, con la suite recién cargada:

```js
history.length
```

Recarga la suite entera y vuelve a mirarlo. **Anota la diferencia en el
informe con el número real**, no con una estimación. Es el dato que la Tarea 4
va a documentar.

- [ ] **Paso 8: Commit**

Dos commits, porque son dos cosas: el arnés primero, el router después.

```bash
git add tests/arnes-dom.js tests/fijaciones/pagina-vacia.html tests/pruebas-arnes-dom.js
git commit -m "Anadir al arnes la forma de cargar una pagina con su hash

`conDocumento` escribe el documento, y eso borra el fragmento de la
URL: document.open() navega a about:blank y se lo lleva. Y sobre un
documento about:blank, history.replaceState lanza. Asi que para probar
codigo que mira la URL hace falta cargar un archivo de verdad, no
escribir uno.

Conviven las dos a proposito: unificarlas obligaria a revalidar las 21
pruebas de panel.js, que dependen del camino de conDocumento."

git add js/router.js tests/pruebas-router-ir.js tests/test.html
git commit -m "Cablear ir() a la decision, y cubrirla por primera vez

`ir` no tenia ni una prueba desde que existe, y es la funcion que toca
el historial del navegador. Ahora solo aplica lo que `decidir` decide:
seis lineas.

Los dos caminos avisan distinto a proposito. Asignar location.hash
dispara hashchange, que ya esta suscrito y avisa solo. replaceState no
dispara nada, asi que ahi se avisa a mano; sin eso, cambiar de foto no
repintaria la pantalla y se quedaria en la anterior.

Las pruebas doblan `history` dentro del iframe —se puede— y no tocan
`location` —no se puede, es unforgeable—. La unica que navega de
verdad es la de empujar, y por eso hay una sola: el historial de un
iframe es el del navegador de quien corre la suite.

Desaparece de paso una cadena de un solo espacio que se construia para
la portada general y no se usaba en esa rama."
```

---

## Tarea 4: Comprobar que el escritorio no se ha movido, y documentarlo

**Archivos:**
- Modificar: `docs/estado-conocido.md`
- No se toca ningún `.js`

**Interfaces:**
- Consume: todo lo anterior. No produce nada que consuma otra tarea.

### Por qué es una tarea y no un paso

Las tres tareas anteriores prueban el router contra sí mismo. Ninguna prueba que
`js/galeria.js`, `js/visor.js` y `js/hero.js` —que llaman a `ir` y leen
`rutaActual`— siguen funcionando, porque esos tres no tienen cobertura y este
bloque no se la va a dar. La red de seguridad aquí es **mirar el sitio de
verdad**, y eso merece su propia puerta.

- [ ] **Paso 1: Comprueba las cuatro rutas de consumo a mano**

Levanta el sitio (`python -m http.server 8810`, abre
`http://localhost:8810/index.html`) y recorre esta lista. Anota en el informe
**qué viste** en cada una, no sólo que la hiciste:

1. **Filtrar por categoría** (`js/galeria.js:196-197`): pulsa una categoría de
   la barra. La URL pasa a `#/editorial`, el lienzo se recompone. Pulsa la misma
   otra vez: vuelve a todos y la URL se queda desnuda.
2. **Abrir un proyecto** (`js/visor.js:41`): pulsa una tarjeta. La URL pasa a
   `#/bruma`, el visor abre ese proyecto.
3. **Cerrar el visor** (`js/visor.js:129-130`): con una categoría activa, abre
   un proyecto y ciérralo. Tiene que volver **a la categoría**, no a todos.
4. **El hero** (`js/hero.js:33`): recarga con `#/bruma` en la URL. La entrada se
   salta y se ve el proyecto directamente.
5. **El botón «atrás»**: filtra por categoría, abre un proyecto, y pulsa atrás
   dos veces. Tiene que deshacer los dos pasos.
6. **Una ruta con segundo tramo** (`#/bruma/3`): en el escritorio tiene que
   abrir *bruma* **por su portada**, no dar error ni pantalla en blanco. El
   escritorio todavía no lee `pieza`, y eso es lo esperado en este bloque.

**Si alguna de las seis se comporta distinto que antes del bloque, para y
avisa.** La restricción global dice que el escritorio no cambia; una diferencia
es un defecto, no una mejora. Para comparar contra el estado anterior:
`git stash` o un `git worktree` sobre `c3dd54d`.

- [ ] **Paso 2: Corre la suite entera tres veces seguidas**

Tiene que dar el mismo número las tres. La suite se volvió determinista en el
bloque 4a y hay que confirmar que sigue siéndolo tras meterle una sección
asíncrona nueva: la anterior introdujo una carrera justo así.

Pega los tres resultados.

- [ ] **Paso 3: Documenta lo que queda sin cubrir**

En `docs/estado-conocido.md`, en la sección que lista lo que no está probado,
añade con honestidad:

- **`galeria.js`, `visor.js` y `hero.js` siguen sin cobertura.** Llaman a `ir`
  y leen `rutaActual`, así que un cambio en el router los afecta y ninguna
  prueba lo diría. En este bloque se comprobaron a mano, una vez, con la lista
  de seis del Paso 1.
- **El escritorio no lee el campo `pieza`.** `#/bruma/3` abre *bruma* por su
  portada en escritorio. Es deliberado: la spec dice que «el escritorio podrá
  aprovecharlo», en futuro, y hacerlo aquí habría cambiado comportamiento
  publicado.
- **La suite añade N entradas al historial del navegador por corrida** — pon el
  número que mediste en la Tarea 3, Paso 6. Viene de la única prueba que navega
  de verdad, y no se puede evitar sin dejar de cubrir ese camino: el historial
  de un iframe es el de su padre.

**No escribas nada que no hayas comprobado.** En el bloque anterior, tres
párrafos de este mismo archivo describían un estado del código que ya había
cambiado, y el peor de ellos daba permiso por escrito para ignorar un rojo de
verdad.

- [ ] **Paso 4: Commit**

```bash
git add docs/estado-conocido.md
git commit -m "Anotar que el escritorio se comprobo a mano, y con que lista

galeria.js, visor.js y hero.js llaman al router y no tienen cobertura;
lo unico que dice que siguen funcionando es haberlos mirado. Queda
escrita la lista exacta de seis comprobaciones, para que la siguiente
persona repita la misma y no una parecida.

Queda escrito tambien que el escritorio no lee el campo `pieza`
todavia, para que #/bruma/3 abriendo la portada no se lea como un fallo."
```

---

## Autorrevisión del plan

**Cobertura de la spec.** La sección «Las URLs llevan un segundo tramo»
(líneas 220-248) tiene cinco requisitos y cada uno tiene tarea: la tabla de
rutas (T1), la numeración desde 1 (T1), el fallo que cae al proyecto por su
portada (T1), la regla `pushState`/`replaceState` (T2 y T3), y «sus pruebas se
amplían antes de tocarlo» (los pasos 1-2 de T1, T2 y T3 son todos rojo-antes-de-
verde). La línea 308 pide «sus 10 pruebas actuales más las del segundo tramo y
la regla del historial»: las 10 se conservan y se les añade el campo nuevo.

**Lo que este plan deja fuera a propósito**, y no es un olvido:

- **`movil-recorrido.js`, `movil-gestos.js` y `brillo.js`** son el paso 3 de la
  spec y van al bloque 4c. Se separaron del router porque el router es el único
  código compartido con el escritorio publicado y merece su propia puerta de
  revisión.
- **`alCambiar` e `init` siguen sin pruebas propias.** `alCambiar` queda
  ejercitado de refilón por las pruebas de `ir` (que se suscriben para contar
  avisos); `init` no. Cubrir `init` exige el evento `hashchange` de verdad
  dentro del iframe, que es el camino que ensucia el historial. Queda anotado.
- **El escritorio no aprovecha el segundo tramo.** Es una decisión, no una
  carencia, y está en las restricciones globales.

**Recuento previsto:** 151 → 164 (T1) → 179 (T2) → 195 (T3, que son 12 de `ir`
más 4 de `conPagina`). **Cuéntalas en vez de fiarte:** en el
bloque anterior el plan se equivocó dos veces en esto y las dos las cazó quien
contó, no quien se fio.

**Riesgo que hay que vigilar.** La Tarea 3 amplía `tests/arnes-dom.js`, que es
el entregable del bloque anterior y del que dependen 151 comprobaciones. La
receta está verificada en un navegador real y el camino existente no se toca,
pero **el implementador de la Tarea 3 es quien más cerca está de romper algo
ajeno a su tarea**. Si al ampliarlo se ve obligado a cambiar el camino que ya
existe, eso deja de ser su tarea: que pare y avise.

**Una cosa que este plan da por buena sin comprobar.** Que ninguna de las 151
pruebas actuales dependa de que `parsearRuta` tenga exactamente dos campos en su
respuesta. Busqué los consumidores de `Router` y son cuatro, todos leyendo
`.tipo` y `.valor` — pero no leí las 151 pruebas una a una. Si la Tarea 1 se
encuentra alguna comparación de objeto completo fuera de `pruebas-router.js`,
que la arregle y lo diga.
