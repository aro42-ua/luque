# Los módulos puros del móvil — plan del bloque 4c

> **Para quien trabaje con subagentes:** SUB-SKILL OBLIGATORIA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los
> pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** construir las tres piezas de lógica pura del móvil —el recorrido
de dos ejes, el reconocedor de gestos y la decisión de brillo— probadas sin
navegador y sin un solo `document.`, para que el bloque siguiente sólo tenga
que pintarlas.

**Arquitectura:** la frontera es la que ya sigue el proyecto: `js/visor-estado.js`
son 78 líneas de máquina de estado con 13 pruebas, y `Lista.pintar` no tiene
ninguna porque construye DOM. Los tres módulos de aquí son funciones de estado a
estado: reciben lo que necesitan como argumento —incluida la lista de
proyectos—, no leen `window.Datos` ni el DOM, y devuelven objetos nuevos sin
tocar los que reciben. Ninguno se cablea a nada en este bloque: **al terminar,
el móvil sigue sin existir.**

**Stack:** JavaScript ES5 a mano, sin framework, sin build, sin gestor de
paquetes. Las pruebas corren en `tests/test.html` abierto en un navegador.

**Spec:** `docs/superpowers/specs/2026-08-28-movil-design.md`, secciones «Los
módulos nuevos» (líneas 182-211), «Lo que se construye» (22-57), «Cuando algo
falla» (263-273) y «Cómo se prueba» (296-312).

## Restricciones globales

- **ES5 en el navegador**: nada de `const`, `let`, flechas, clases, plantillas
  de cadena ni módulos ES. Patrón `window.Nombre` para exponer.
- **Techo de 300 líneas por archivo.**
- **Nada de credenciales en el repositorio.**
- Sin dependencias nuevas, sin paso de build.
- **Las piezas se numeran desde 1**, igual que el contador `02/08` que ve quien
  mira. No desde 0.
- **Nada de `document.`, `window.` ni `Math.random()` en los tres módulos.** Si
  un módulo necesita un dato del mundo, se le pasa como argumento. Es lo que los
  hace probables sin navegador, que es la razón entera de que existan.
- **Ninguna función modifica el estado que recibe.** Devuelven objetos nuevos.
  `visor-estado.js` tiene una prueba dedicada a esto; aquí también.
- **El escritorio no cambia.** Este bloque no toca `galeria*.js`, `visor*.js`,
  `hero.js`, `router.js` ni `composicion.js`. Si alguna tarea se ve obligada a
  tocarlos, **es señal de que algo se ha diseñado mal — para y avisa.**
- **Este bloque no pinta nada.** No se crea `movil-hoja.js`, ni
  `movil-visor.js`, ni `movil.js`, ni CSS, ni se toca `index.html`. Eso es el
  bloque siguiente. Aquí sólo entran los tres módulos y sus pruebas.

## De dónde salen las decisiones que ya vienen tomadas

No hace falta rediscutirlas; están aquí para que no se rediscutan.

1. **El eje vertical de un proyecto de vídeo tiene una sola parada antes de la
   ficha.** Seis de los doce proyectos son de vídeo y tienen `piezas: []`
   (comprobado sobre `contenido.json`: `reflejo`, `estatica`, `humo`, `ceniza`,
   `raiz`, `litoral`). La spec (líneas 45-50) lo razona: si el eje significara
   «más fotos», el gesto no haría nada en la mitad del portafolio, y un gesto
   que a veces responde y a veces no se siente roto.

2. **Se reutiliza el vocabulario de `pieza` que ya produce el router.**
   `js/router.js` devuelve `{tipo, valor, pieza}` donde `pieza` es `null`, un
   número desde 1, o la cadena `'ficha'`. El bloque 4b lo dejó analizado y
   transportado **sin un solo consumidor**. Este bloque es su primer
   consumidor, así que hablan el mismo idioma o no hablan.

3. **`null` significa «este proyecto, por su portada».** En un proyecto de
   fotos, esa portada es la primera pieza: la spec (líneas 258-261) pide carga
   progresiva y dice que la portada se enseña *mientras llega* la pieza, o sea
   como sustituta, no como parada propia. En uno de vídeo, `null` es el vídeo
   mismo, que sí es una parada porque no hay ninguna otra.

4. **Las series no dan la vuelta.** Ni el eje horizontal ni el vertical. Es la
   convención que ya sigue `visor-estado.js:37-38` («La serie NO da la vuelta:
   al llegar a la última pieza el avance se detiene, para que no se confunda
   dónde termina un proyecto») y la spec la repite para el horizontal: «que en
   el último proyecto deslizar a la derecha no salga al vacío».

## Aviso sobre las mutaciones que propone este plan

**Léelo antes de fiarte de las tablas de mutaciones.** En el bloque anterior,
quien escribió el plan —yo— propuso tres veces una tabla de mutaciones
afirmando que mataban todas las pruebas, y las tres veces el revisor trazó el
código y demostró que mataban menos de la mitad. Una vez ofrecí 4 mutaciones
para 13 pruebas; hacían falta 10.

Por eso, en este plan:

- Las mutaciones que se proponen en cada tarea son **un punto de partida sin
  verificar**, no una lista cerrada. Están marcadas como tales.
- **El criterio es por prueba, no por mutación**: no basta con que cada
  mutación ponga en rojo *alguna* prueba. Hace falta que **cada prueba muera
  ante alguna mutación**. Una prueba que sobrevive a todas las mutaciones que
  se te ocurran es una prueba que no comprueba nada, y hay que decirlo en el
  informe aunque el plan no lo hubiera previsto.
- Si una prueba no muere con ninguna mutación y **crees que es un mutante
  equivalente** —que no hay forma de romper el código que esa prueba detecte—,
  dilo en el informe con el razonamiento. No la borres ni la maquilles.

## Estructura de archivos

| Archivo | Responsabilidad | Qué le pasa aquí |
|---|---|---|
| `js/movil-recorrido.js` | El estado `{proyecto, pieza}` y las cuatro direcciones. La inteligencia de los dos ejes | **Se crea** |
| `js/movil-gestos.js` | De eventos de puntero a intenciones, con zona muerta | **Se crea** |
| `js/brillo.js` | El umbral de luminancia y el camino de degradación | **Se crea** |
| `tests/pruebas-movil-recorrido.js` | Sus pruebas | **Se crea** |
| `tests/pruebas-movil-gestos.js` | Sus pruebas | **Se crea** |
| `tests/pruebas-brillo.js` | Sus pruebas | **Se crea** |
| `tests/test.html` | El índice de la suite | **Se modifica**: seis líneas nuevas |
| `docs/estado-conocido.md` | Qué está probado y qué no | **Se modifica** en la Tarea 4 |

Ningún archivo existente de `js/` se toca. Los tres módulos no se cargan desde
`index.html` en este bloque: sólo desde `tests/test.html`. Nada del sitio los
llama todavía, y eso es correcto.

## Cómo se corren las pruebas

La suite del navegador necesita un servidor; con doble clic sobre el archivo no
vale.

```
python -m http.server 8820
```

y abrir `http://localhost:8820/tests/test.html`. Al pie sale
«——— N pasan, M fallan ———».

**Aviso: `python -m http.server` no manda `Cache-Control`, así que el navegador
cachea.** Antes de recargar, `fetch(url, {cache:'reload'})` sobre los archivos
que hayas cambiado. Si no, verás el resultado de la versión anterior y creerás
que tu cambio no hizo nada. Esto mordió dos veces en el bloque anterior: una
suite salió en rojo con el código bueno y otra en verde con el viejo.

Además, antes de cada commit:

```
node tests/prueba-borrador.js
python tests/auditar_rutas.py
```

**Punto de partida: 199 comprobaciones en verde.** Ese número está verificado
sobre `main` en `1091286`. **No te fíes de él: cuéntalas tú antes de empezar.**
En el bloque 4a el plan anunciaba 99 cuando eran 101, y quien lo cazó fue un
implementador que contó en vez de fiarse.

**Y un aviso sobre contar con `grep`:** `grep -c "prueba("` sobre
`tests/pruebas-*.js` da **201**, no 199. Dos de esas llamadas viven en
`tests/pruebas-arnes-dom.js`, en la rama de éxito de dos cargas diseñadas para
fallar, y nunca se ejecutan. El número que cuenta es el que imprime la suite al
pie.

---

## Tarea 1: `movil-recorrido.js` — los dos ejes

**Archivos:**
- Crear: `js/movil-recorrido.js`
- Crear: `tests/pruebas-movil-recorrido.js`
- Modificar: `tests/test.html` (dos líneas)

**Interfaces:**
- Consume: nada de otras tareas. Recibe `orden`, un array
  `[{id: 'bruma', piezas: 8}, …]` en el orden en que se ven en la rejilla, que
  quien lo llame construirá a partir de `Datos.PROYECTOS`. **Este módulo no
  conoce `Datos`.**
- Produce, para las tareas y bloques siguientes:
  - `MovilRecorrido.paradas(cuantasPiezas)` → array de paradas del eje vertical
  - `MovilRecorrido.inicial(orden)` → `{proyecto, pieza}`
  - `MovilRecorrido.desdeRuta(ruta, orden)` → `{proyecto, pieza}`
  - `MovilRecorrido.aRuta(estado)` → `{tipo, valor, pieza}`
  - `MovilRecorrido.mover(estado, gesto, orden)` → `{proyecto, pieza}`

`ruta` es exactamente lo que devuelve `Router.rutaActual()`: `{tipo, valor,
pieza}`, con `pieza` valiendo `null`, un número desde 1, o la cadena `'ficha'`.

### La decisión que hay que entender antes de escribir una línea

El eje vertical de un proyecto son sus **paradas**, de arriba abajo:

| Proyecto | Paradas |
|---|---|
| `bruma`, 8 piezas | `1, 2, 3, 4, 5, 6, 7, 8, 'ficha'` |
| `reflejo`, 0 piezas (vídeo) | `null, 'ficha'` |

`null` es «este proyecto por su portada», el mismo valor que usa el router
cuando la ruta no trae segundo tramo. En un proyecto de fotos la portada es una
imagen que se enseña *mientras carga* la pieza 1 (spec, líneas 258-261), no una
parada propia, así que `null` se normaliza a `1`. En uno de vídeo no hay piezas,
así que `null` **sí** es una parada: es el vídeo. De ahí que bajar llegue a la
ficha en un solo gesto, que es lo que la spec exige en las líneas 45-50.

Los nombres de los gestos son los del **dedo**, no los del contenido:
`'izquierda'` es «he deslizado a la izquierda» y trae el proyecto **siguiente**,
igual que pasar una página. `'arriba'` es «he deslizado hacia arriba» y baja una
parada, igual que desplazar. **La inversión vive en `mover` y en ningún otro
sitio**: si viviera en quien pinta, cada pantalla nueva podría equivocarse de
signo por su cuenta.

### «Que girar no mueva la posición»: qué parte se prueba aquí y qué parte no

La spec pide esa comprobación para este módulo (línea 302), y conviene ser
exacto sobre lo que este bloque puede demostrar y lo que no.

Girar el móvil no llama a `mover`. Lo que hace es rehacer la pantalla, y la
posición sobrevive **porque vive en un objeto `{proyecto, pieza}` que está
fuera del DOM**: quien repinta vuelve a leer el mismo estado. Ninguna prueba de
aquí puede ejercitar un giro, porque no hay nada que girar hasta el bloque que
pinta.

Lo que sí se prueba aquí es la mitad que le toca a este módulo: que **sólo** las
cuatro direcciones conocidas mueven el estado, y que cualquier otra cosa lo
devuelve intacto (`'un gesto que no se reconoce no mueve nada'`). Sin eso, un
evento espurio durante el giro podría desplazar la posición y el módulo sería
cómplice.

La otra mitad —que quien repinta lea el estado en vez de reconstruirlo— es del
bloque siguiente, y la Tarea 4 la deja anotada como no cubierta. **No inventes
aquí una prueba de giro:** cualquiera que escribas estaría comprobando tu propia
simulación, no el comportamiento.

- [ ] **Paso 1: Escribe las pruebas, que fallarán todas**

Crea `tests/pruebas-movil-recorrido.js` con esto tal cual:

```js
describe('MovilRecorrido', function () {

  /* Mezcla deliberada: dos proyectos de fotos con distinto número de piezas y
     dos de vídeo con cero, y uno de los de vídeo es el último de la lista. Así
     el borde del eje horizontal y el caso de las cero piezas caen en la misma
     fijación en vez de necesitar dos. */
  var ORDEN = [
    { id: 'niebla',  piezas: 6 },
    { id: 'bruma',   piezas: 8 },
    { id: 'reflejo', piezas: 0 },
    { id: 'litoral', piezas: 0 }
  ];

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  // ---- Las paradas del eje vertical -------------------------------

  prueba('un proyecto de fotos se recorre por sus piezas y acaba en la ficha', function () {
    igual(MovilRecorrido.paradas(3), [1, 2, 3, 'ficha']);
  });

  /* La razón de ser del diseño de dos ejes: seis de los doce proyectos son de
     vídeo. Si el eje vertical significara «más fotos», el gesto no haría nada
     en la mitad del portafolio. */
  prueba('un proyecto de vídeo tiene el propio vídeo y la ficha, nada más', function () {
    igual(MovilRecorrido.paradas(0), [null, 'ficha']);
  });

  prueba('las piezas se numeran desde 1, no desde 0', function () {
    igual(MovilRecorrido.paradas(2)[0], 1);
  });

  // ---- El estado inicial ------------------------------------------

  prueba('el estado inicial es el primer proyecto por su primera parada', function () {
    igual(MovilRecorrido.inicial(ORDEN), en('niebla', 1));
  });

  prueba('sin proyectos, el estado inicial no inventa ninguno', function () {
    igual(MovilRecorrido.inicial([]), en(null, null));
  });

  // ---- El eje vertical --------------------------------------------

  prueba('bajar en un proyecto de vídeo llega a la ficha en UN solo gesto', function () {
    igual(MovilRecorrido.mover(en('reflejo', null), 'arriba', ORDEN), en('reflejo', 'ficha'));
  });

  prueba('bajar en un proyecto de fotos pasa a la pieza siguiente', function () {
    igual(MovilRecorrido.mover(en('bruma', 3), 'arriba', ORDEN), en('bruma', 4));
  });

  prueba('la ficha está detrás de la última pieza, no antes', function () {
    igual(MovilRecorrido.mover(en('bruma', 8), 'arriba', ORDEN), en('bruma', 'ficha'));
  });

  prueba('la ficha es el fondo del eje: bajar desde ella no lleva a ningún sitio', function () {
    igual(MovilRecorrido.mover(en('bruma', 'ficha'), 'arriba', ORDEN), en('bruma', 'ficha'));
  });

  prueba('subir devuelve a la pieza anterior', function () {
    igual(MovilRecorrido.mover(en('bruma', 4), 'abajo', ORDEN), en('bruma', 3));
  });

  prueba('subir desde la primera parada no sale por arriba', function () {
    igual(MovilRecorrido.mover(en('bruma', 1), 'abajo', ORDEN), en('bruma', 1));
    igual(MovilRecorrido.mover(en('reflejo', null), 'abajo', ORDEN), en('reflejo', null));
  });

  /* «El eje nunca se queda sin respuesta» (spec, línea 50). Se comprueba sobre
     los cuatro proyectos, no sobre uno: es una propiedad de todos. */
  prueba('desde cualquier proyecto se llega a la ficha bajando', function () {
    ORDEN.forEach(function (p) {
      var e = en(p.id, MovilRecorrido.paradas(p.piezas)[0]);
      for (var i = 0; i < 20; i++) e = MovilRecorrido.mover(e, 'arriba', ORDEN);
      igual(e.pieza, 'ficha', 'en ' + p.id + ' no se llegó a la ficha');
    });
  });

  // ---- El eje horizontal ------------------------------------------

  prueba('deslizar a la izquierda trae el proyecto siguiente', function () {
    igual(MovilRecorrido.mover(en('niebla', 1), 'izquierda', ORDEN), en('bruma', 1));
  });

  prueba('deslizar a la derecha trae el anterior', function () {
    igual(MovilRecorrido.mover(en('bruma', 1), 'derecha', ORDEN), en('niebla', 1));
  });

  prueba('en el último proyecto, seguir hacia delante no sale al vacío', function () {
    igual(MovilRecorrido.mover(en('litoral', 'ficha'), 'izquierda', ORDEN), en('litoral', 'ficha'));
  });

  prueba('en el primero, seguir hacia atrás no sale al vacío', function () {
    igual(MovilRecorrido.mover(en('niebla', 4), 'derecha', ORDEN), en('niebla', 4));
  });

  /* Sin esto se podría acabar en la pieza 7 de un proyecto que tiene 5, o en
     una pieza numerada dentro de un vídeo que no tiene ninguna. */
  prueba('cambiar de proyecto empieza por la primera parada del nuevo', function () {
    igual(MovilRecorrido.mover(en('bruma', 7), 'izquierda', ORDEN), en('reflejo', null));
    igual(MovilRecorrido.mover(en('bruma', 'ficha'), 'derecha', ORDEN), en('niebla', 1));
  });

  // ---- El puente con el router ------------------------------------

  prueba('desdeRuta traduce una ruta con su pieza', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: 3 }, ORDEN),
          en('bruma', 3));
  });

  prueba('desdeRuta con la ficha la respeta', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: 'ficha' }, ORDEN),
          en('reflejo', 'ficha'));
  });

  prueba('una ruta sin segundo tramo abre por la primera parada', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: null }, ORDEN),
          en('bruma', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: null }, ORDEN),
          en('reflejo', null));
  });

  /* La regla de la spec (líneas 238-240): una pieza que no existe cae al
     proyecto por su portada, NO a la portada general. Conserva lo que el
     enlace sí traía bien. */
  prueba('una pieza fuera de rango cae al proyecto, no a la portada general', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'bruma', pieza: 99 }, ORDEN),
          en('bruma', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'reflejo', pieza: 2 }, ORDEN),
          en('reflejo', null));
  });

  prueba('una ruta que no es de proyecto da el estado inicial', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'todos', valor: null, pieza: null }, ORDEN),
          en('niebla', 1));
    igual(MovilRecorrido.desdeRuta({ tipo: 'categoria', valor: 'editorial', pieza: null }, ORDEN),
          en('niebla', 1));
  });

  prueba('un proyecto que no está en el orden da el estado inicial', function () {
    igual(MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'fantasma', pieza: 2 }, ORDEN),
          en('niebla', 1));
  });

  prueba('aRuta devuelve la forma exacta que entiende el router', function () {
    igual(MovilRecorrido.aRuta(en('bruma', 3)),
          { tipo: 'proyecto', valor: 'bruma', pieza: 3 });
    igual(MovilRecorrido.aRuta(en('reflejo', null)),
          { tipo: 'proyecto', valor: 'reflejo', pieza: null });
  });

  /* Ida y vuelta: lo que sale de aRuta tiene que volver a entrar por desdeRuta
     y dar lo mismo. Si alguna de las dos se desvía, la URL y la pantalla
     dejarían de decir lo mismo, y eso no se descubre hasta compartir un
     enlace. */
  prueba('aRuta y desdeRuta se deshacen la una a la otra', function () {
    [en('niebla', 1), en('bruma', 8), en('bruma', 'ficha'),
     en('reflejo', null), en('litoral', 'ficha')].forEach(function (e) {
      igual(MovilRecorrido.desdeRuta(MovilRecorrido.aRuta(e), ORDEN), e,
            'no sobrevivió la ida y vuelta: ' + JSON.stringify(e));
    });
  });

  // ---- Higiene ----------------------------------------------------

  prueba('un gesto que no se reconoce no mueve nada', function () {
    igual(MovilRecorrido.mover(en('bruma', 3), 'diagonal', ORDEN), en('bruma', 3));
    igual(MovilRecorrido.mover(en('bruma', 3), '', ORDEN), en('bruma', 3));
  });

  prueba('una pieza que no está en el eje no mueve nada', function () {
    igual(MovilRecorrido.mover(en('bruma', 99), 'arriba', ORDEN), en('bruma', 99));
    igual(MovilRecorrido.mover(en('reflejo', 3), 'abajo', ORDEN), en('reflejo', 3));
  });

  prueba('un proyecto que no está en el orden no se mueve', function () {
    igual(MovilRecorrido.mover(en('fantasma', 1), 'arriba', ORDEN), en('fantasma', 1));
  });

  /* Se comprueba DESPUÉS DE CADA llamada, no al final de las cuatro. Con una
     sola comprobación al final, una mutación que moviera `estado.pieza` se
     tapaba sola: 'arriba' la subía a 4 y 'abajo' la devolvía a 3, así que la
     prueba pasaba con el estado mutado dos veces. Medido, no supuesto. */
  prueba('ninguna función modifica el estado que recibe', function () {
    ['arriba', 'abajo', 'izquierda', 'derecha'].forEach(function (g) {
      var e = en('bruma', 3);
      MovilRecorrido.mover(e, g, ORDEN);
      igual(e, en('bruma', 3), 'mover(«' + g + '») cambió el estado que recibió');
    });
    var f = en('bruma', 3);
    MovilRecorrido.aRuta(f);
    igual(f, en('bruma', 3), 'aRuta cambió el estado que recibió');
  });

  /* Con su propia lista, no con ORDEN. Comparar ORDEN contra una copia tomada
     aquí no detecta nada: si otra prueba de más arriba ya lo hubiera
     estropeado, la copia saldría del estropicio. */
  prueba('tampoco modifica el orden que recibe', function () {
    var propio = [{ id: 'uno', piezas: 2 }, { id: 'dos', piezas: 0 }];
    var copia = JSON.parse(JSON.stringify(propio));
    MovilRecorrido.inicial(propio);
    MovilRecorrido.mover(en('uno', 1), 'izquierda', propio);
    MovilRecorrido.desdeRuta({ tipo: 'proyecto', valor: 'uno', pieza: 2 }, propio);
    igual(propio, copia, 'el orden original ha cambiado');
  });
});
```

Son **30 llamadas a `prueba(`**. Cuéntalas tú: si te sale otro número, el que
manda es el tuyo, y dilo en el informe.

- [ ] **Paso 2: Engancha las pruebas a la suite y compruébalas en rojo**

En `tests/test.html`, añade `<script src="../js/movil-recorrido.js"></script>`
junto a los demás módulos de `js/` (después de `../js/visor-estado.js`) y
`<script src="pruebas-movil-recorrido.js"></script>` junto a las demás pruebas
(después de `pruebas-visor-estado.js`).

Arranca el servidor, abre la suite. Esperado: **30 en rojo**, todas con
`MovilRecorrido is not defined`. Si alguna sale verde antes de que el módulo
exista, esa prueba no comprueba nada — dilo.

- [ ] **Paso 3: Escribe el módulo**

Crea `js/movil-recorrido.js`:

```js
window.MovilRecorrido = (function () {

  /* Las paradas del eje vertical de un proyecto, de arriba abajo.

     Un proyecto de fotos se recorre por sus piezas y termina en la ficha. Uno
     de vídeo no tiene ninguna: su única parada antes de la ficha es el propio
     vídeo, que se representa con `null` —el mismo valor que usa el router
     cuando la ruta no trae segundo tramo—. Por eso «abajo» llega a los
     créditos en un solo gesto y el eje nunca se queda sin respuesta, que es
     justo lo que hace que el gesto no se sienta roto en la mitad del
     portafolio: seis de los doce proyectos son de vídeo. */
  function paradas(cuantasPiezas) {
    if (!(cuantasPiezas >= 1)) return [null, 'ficha'];
    var p = [];
    for (var i = 1; i <= cuantasPiezas; i++) p.push(i);
    p.push('ficha');
    return p;
  }

  function indiceDeProyecto(orden, id) {
    for (var i = 0; i < orden.length; i++) {
      if (orden[i].id === id) return i;
    }
    return -1;
  }

  function paradasDe(orden, id) {
    var i = indiceDeProyecto(orden, id);
    return i === -1 ? null : paradas(orden[i].piezas);
  }

  /* Recorta en vez de dar la vuelta, igual que `visor-estado.js:26-30`: al
     llegar al final la serie se detiene, para que no se confunda dónde
     termina. */
  function recortar(i, largo) {
    if (i < 0) return 0;
    if (i > largo - 1) return largo - 1;
    return i;
  }

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  function inicial(orden) {
    if (!orden || !orden.length) return en(null, null);
    return en(orden[0].id, paradas(orden[0].piezas)[0]);
  }

  /* De la ruta del router al estado del recorrido. `pieza` vale null, un
     número desde 1, o 'ficha'; cualquier otra cosa —una pieza que no existe,
     un proyecto que no está— cae al proyecto por su primera parada y no a la
     portada general, porque conserva lo que el enlace sí traía bien. */
  function desdeRuta(ruta, orden) {
    if (!ruta || ruta.tipo !== 'proyecto') return inicial(orden);
    var ps = paradasDe(orden, ruta.valor);
    if (!ps) return inicial(orden);
    /* `null` no necesita rama propia, y se comprobó: cae por el mismo camino
       que una pieza que no existe. En un proyecto de fotos `indexOf(null)` da
       -1 y sale la primera pieza; en uno de vídeo da 0 y sale `null`, que es
       la parada del vídeo. Que sean las dos cosas correctas no es suerte: es
       que `paradas()` ya puso `null` en el eje justo donde es una parada. */
    return en(ruta.valor, ps.indexOf(ruta.pieza) === -1 ? ps[0] : ruta.pieza);
  }

  function aRuta(estado) {
    if (!estado || estado.proyecto === null) {
      return { tipo: 'todos', valor: null, pieza: null };
    }
    return { tipo: 'proyecto', valor: estado.proyecto, pieza: estado.pieza };
  }

  /* Los nombres son los del DEDO, no los del contenido: 'izquierda' es «he
     deslizado a la izquierda» y trae el proyecto SIGUIENTE, igual que pasar
     una página; 'arriba' baja una parada, igual que desplazar.

     La inversión vive aquí y en ningún otro sitio. Si viviera en quien pinta,
     cada pantalla nueva podría equivocarse de signo por su cuenta, y ese es
     justo el error que no da error: se ve como que los gestos van al revés. */
  function mover(estado, gesto, orden) {
    var ps = paradasDe(orden, estado.proyecto);
    if (!ps) return estado;

    if (gesto === 'izquierda' || gesto === 'derecha') {
      var i = indiceDeProyecto(orden, estado.proyecto);
      var j = recortar(gesto === 'izquierda' ? i + 1 : i - 1, orden.length);
      if (j === i) return estado;
      return en(orden[j].id, paradas(orden[j].piezas)[0]);
    }

    if (gesto === 'arriba' || gesto === 'abajo') {
      var k = ps.indexOf(estado.pieza);
      if (k === -1) return estado;
      return en(estado.proyecto, ps[recortar(gesto === 'arriba' ? k + 1 : k - 1, ps.length)]);
    }

    return estado;
  }

  return {
    paradas: paradas,
    inicial: inicial,
    desdeRuta: desdeRuta,
    aRuta: aRuta,
    mover: mover
  };
})();
```

- [ ] **Paso 4: Las 30 en verde, y la suite entera también**

Recarga con la caché limpia (`fetch(url, {cache:'reload'})` sobre los archivos
que has tocado, y sólo entonces recarga). Esperado: **229 pasan, 0 fallan**
(199 + 30). Comprueba el número; si no cuadra, cuenta antes de tocar nada.

- [ ] **Paso 5: Comprueba que las pruebas no son de mentira**

**Lee el aviso sobre mutaciones de la cabecera de este plan antes de empezar.**
Las de abajo son un punto de partida **sin verificar**, no una lista cerrada.
El criterio es **por prueba**: cada una de las 30 tiene que morir ante alguna
mutación. Rompe el módulo a propósito, una mutación cada vez, y anota cuáles
caen.

| # | Mutación | Dónde | Mata |
|---|---|---|---|
| 1 | `if (!(cuantasPiezas >= 1))` → `if (cuantasPiezas < 0)` | `paradas` | 6 |
| 2 | `for (var i = 1; i <= cuantasPiezas; i++)` → `for (var i = 0; i < cuantasPiezas; i++)` | `paradas` | 13 |
| 3 | `return [null, 'ficha'];` → `return ['ficha'];` | `paradas` | 6 |
| 4 | `if (i < 0) return 0;` → `return largo - 1;` | `recortar` | 2 |
| 5 | `if (i > largo - 1)` → `if (i > largo)` | `recortar` | 3 |
| 6 | `i + 1` ↔ `i - 1` (eje horizontal) | `mover` | 5 |
| 7 | `k + 1` ↔ `k - 1` (eje vertical) | `mover` | 7 |
| 8 | `paradas(orden[j].piezas)[0]` → `estado.pieza` | `mover` | 1 |
| 9 | `ps.indexOf(ruta.pieza) === -1 ? ps[0] : ruta.pieza` → `ruta.pieza` | `desdeRuta` | 2 |
| 10 | `ruta.tipo !== 'proyecto'` → `ruta.tipo === 'proyecto'` | `desdeRuta` | 5 |
| 11 | `paradas(orden[0].piezas)[0]` → `'ficha'` | `inicial` | 3 |
| 12 | `pieza: estado.pieza` → `pieza: null` | `aRuta` | 2 |
| 13 | `p.push('ficha')` → `p.unshift('ficha')` | `paradas` | 14 |
| 14 | `if (j === i) return estado;` borrado | `mover` | 2 |
| 15 | `if (k === -1) return estado;` borrado | `mover` | 1 |
| 16 | `if (!ps) return inicial(orden);` borrado | `desdeRuta` | 1 |
| 17 | `if (!ps) return estado;` borrado | `mover` | 1 |
| 18 | `if (!orden || !orden.length)` borrado | `inicial` | 1 |
| 19 | el `return estado` final → cae al eje vertical | `mover` | 1 |
| 20 | devolver `estado` mutado en vez de uno nuevo | `mover` | 1 |
| 21 | ordenar `orden` dentro de la función | `inicial` | 9 |

**Resultado verificado: las 30 pruebas mueren.** Ninguna sobrevive a las 21
mutaciones. Se comprobó ejecutando el módulo y las pruebas de este plan en Node
antes de escribirlo, con las mutaciones aplicadas una a una. Aun así, **no te
fíes**: reprodúcelo. Si en tu ejecución alguna sobrevive, es que el código que
has escrito no es el de aquí, y eso es información.

Apunta en el informe qué mutación mató a qué pruebas, y **si alguna de las 30
sobrevive a todas**. Si sobrevive alguna, di si crees que es un mutante
equivalente y por qué, o si la prueba está mal escrita. No la borres ni la
maquilles.

- [ ] **Paso 6: Commit**

```
node tests/prueba-borrador.js
python tests/auditar_rutas.py
```

Los dos en verde antes de commitear. Mensaje en castellano, sin acentos en la
línea de asunto y sin comillas invertidas (una comilla invertida dentro de un
`-m` se ejecuta como comando: usa `git commit -F -` con un heredoc entre
comillas simples). Que explique **por qué** el eje vertical de un vídeo tiene
dos paradas, no que se ha añadido un módulo.

---

## Tarea 2: `movil-gestos.js` — de dedos a intenciones

**Archivos:**
- Crear: `js/movil-gestos.js`
- Crear: `tests/pruebas-movil-gestos.js`
- Modificar: `tests/test.html` (dos líneas)

**Interfaces:**
- Consume: nada. Es independiente de la Tarea 1 — no importa el orden en que se
  hagan. Las intenciones que produce (`'izquierda'`, `'derecha'`, `'arriba'`,
  `'abajo'`) son **exactamente** los nombres que `MovilRecorrido.mover` acepta
  como segundo argumento, para que quien las una no tenga que traducir.
- Produce:
  - `MovilGestos.inicial()` → estado del reconocedor
  - `MovilGestos.presionar(estado, punto)` → estado
  - `MovilGestos.soltar(estado, punto)` → `{estado, intencion}`
  - `MovilGestos.UMBRAL`, `MovilGestos.TOQUE`, `MovilGestos.DOMINIO` → los tres
    números, expuestos para que las pruebas no los repitan a mano

`punto` es `{x, y}` en píxeles. **No es un `PointerEvent`**: quien escuche los
eventos le pasará `{x: e.clientX, y: e.clientY}`. Ese es el corte que hace que
esto se pueda probar sin navegador y sin fabricar eventos.

### Por qué un reconocedor con estado y no una función suelta

La spec pide dos cosas que una función de `(inicio, fin)` no puede dar:

- **«Dos dedos en pantalla → manda el pellizco; el deslizamiento se cancela
  hasta soltar»** (línea 271). «Hasta soltar» es memoria: el segundo dedo puede
  aparecer a mitad del arrastre, y a partir de ahí ese gesto ya no es un
  deslizamiento por mucho que el dedo original acabe donde acabe.
- **La zona muerta** (línea 270): «arrastre corto o diagonal — no es un
  deslizamiento».

Así que son tres funciones sobre un estado pequeño, al estilo de
`visor-estado.js`.

### Los tres números, y de dónde salen

| Nombre | Valor | Qué decide |
|---|---|---|
| `TOQUE` | 10 px | Por debajo de esto el dedo no se ha movido: es un toque |
| `UMBRAL` | 24 px | El eje dominante tiene que recorrer al menos esto para ser un deslizamiento |
| `DOMINIO` | 1.6 | El eje dominante tiene que superar al otro por este factor; si no, es diagonal y no vale |

La spec pone un caso concreto que estos números tienen que resolver: **«un
arrastre de 12px en diagonal no es un deslizamiento»** (línea 197). Con
`dx = dy = 12`: el recorrido total es 17 px, o sea más que `TOQUE`, así que no
es un toque; y el eje dominante es 12, menor que `UMBRAL`, así que tampoco es
un deslizamiento. Cae en la zona muerta y no produce intención. Hay una prueba
que fija exactamente ese caso.

Entre `TOQUE` y `UMBRAL` hay una franja a propósito —de 10 a 24 px— donde no
pasa nada. Un dedo que se mueve 15 px no quería tocar ni quería deslizar.

- [ ] **Paso 1: Escribe las pruebas, que fallarán todas**

Crea `tests/pruebas-movil-gestos.js` con esto tal cual:

```js
describe('MovilGestos', function () {

  function p(x, y) { return { x: x, y: y }; }

  /* Un gesto de un solo dedo, de principio a fin. Devuelve la intención. */
  function gesto(desde, hasta) {
    var e = MovilGestos.presionar(MovilGestos.inicial(), desde);
    return MovilGestos.soltar(e, hasta).intencion;
  }

  // ---- Los deslizamientos -----------------------------------------

  prueba('arrastrar a la izquierda es un deslizamiento a la izquierda', function () {
    igual(gesto(p(200, 300), p(100, 300)), 'izquierda');
  });

  prueba('arrastrar a la derecha es un deslizamiento a la derecha', function () {
    igual(gesto(p(100, 300), p(200, 300)), 'derecha');
  });

  prueba('arrastrar hacia arriba es un deslizamiento hacia arriba', function () {
    igual(gesto(p(200, 400), p(200, 300)), 'arriba');
  });

  prueba('arrastrar hacia abajo es un deslizamiento hacia abajo', function () {
    igual(gesto(p(200, 300), p(200, 400)), 'abajo');
  });

  /* Los cuatro nombres son los que `MovilRecorrido.mover` acepta tal cual. Si
     alguien los cambia aquí, hay que cambiarlos allí, y esta prueba es lo que
     lo recuerda. */
  prueba('las cuatro intenciones se llaman como las direcciones de mover()', function () {
    var vistas = [gesto(p(200, 300), p(100, 300)), gesto(p(100, 300), p(200, 300)),
                  gesto(p(200, 400), p(200, 300)), gesto(p(200, 300), p(200, 400))];
    igual(vistas, ['izquierda', 'derecha', 'arriba', 'abajo']);
  });

  // ---- El toque ---------------------------------------------------

  prueba('presionar y soltar sin moverse es un toque', function () {
    igual(gesto(p(200, 300), p(200, 300)), 'toque');
  });

  prueba('un temblor de pocos píxeles sigue siendo un toque', function () {
    igual(gesto(p(200, 300), p(204, 297)), 'toque');
  });

  /* El radio del toque se mide con la hipotenusa, no con el eje mayor: 8px en
     cada eje son 11,3 de recorrido real, o sea más que TOQUE. Con un `max` en
     vez de una hipotenusa esto saldría 'toque' y el dedo habría recorrido más
     de lo que un toque permite. */
  prueba('el radio del toque es un círculo, no un cuadrado', function () {
    igual(gesto(p(200, 300), p(208, 308)), null);
  });

  // ---- La zona muerta ---------------------------------------------

  /* El caso literal de la spec, línea 197. Con dx=dy=12 el recorrido es 17px
     —más que TOQUE— pero el eje dominante es 12, menos que UMBRAL. No es ni
     toque ni deslizamiento: no es nada. */
  prueba('un arrastre de 12px en diagonal NO es un deslizamiento', function () {
    igual(gesto(p(200, 300), p(212, 312)), null);
  });

  prueba('un arrastre largo pero en diagonal exacta tampoco lo es', function () {
    igual(gesto(p(200, 300), p(300, 400)), null);
  });

  prueba('entre el toque y el umbral no pasa nada, ni siquiera un toque', function () {
    igual(gesto(p(200, 300), p(215, 300)), null);
  });

  /* El borde exacto, en los dos lados. Sin esto, cambiar UMBRAL de 24 a 30
     dejaría la suite en verde. */
  prueba('justo en el umbral hay deslizamiento, justo por debajo no', function () {
    igual(gesto(p(200, 300), p(200 + MovilGestos.UMBRAL, 300)), 'derecha');
    igual(gesto(p(200, 300), p(200 + MovilGestos.UMBRAL - 1, 300)), null);
  });

  prueba('justo en el toque hay toque, justo por encima no', function () {
    igual(gesto(p(200, 300), p(200 + MovilGestos.TOQUE, 300)), 'toque');
    igual(gesto(p(200, 300), p(200 + MovilGestos.TOQUE + 1, 300)), null);
  });

  /* Un eje que apenas gana al otro no basta: hace falta que lo supere por
     DOMINIO. Aquí 60 contra 50 es 1,2 — no llega a 1,6 — y no vale, aunque
     los dos superen el umbral. */
  prueba('ganar por poco en un eje no basta para elegir dirección', function () {
    igual(gesto(p(200, 300), p(260, 350)), null);
  });

  prueba('ganar con holgura sí elige dirección', function () {
    igual(gesto(p(200, 300), p(300, 320)), 'derecha');
  });

  // ---- El pellizco ------------------------------------------------

  prueba('dos dedos a la vez son un pellizco, no un deslizamiento', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    e = MovilGestos.soltar(e, p(300, 300)).estado;
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'pellizco');
  });

  /* Lo que la spec llama «el deslizamiento se cancela hasta soltar»: el
     segundo dedo llega a mitad del arrastre y a partir de ahí ese gesto ya no
     puede ser un deslizamiento, aunque el dedo original acabe donde acabaría
     un deslizamiento perfecto. */
  prueba('un segundo dedo a mitad de arrastre cancela el deslizamiento', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(300, 300));
    e = MovilGestos.presionar(e, p(100, 300));
    e = MovilGestos.soltar(e, p(100, 300)).estado;
    // el dedo original acaba justo donde acabaría un deslizamiento perfecto
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'pellizco');
  });

  prueba('mientras quede un dedo en pantalla no hay intención todavía', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    var r = MovilGestos.soltar(e, p(300, 300));
    igual(r.intencion, null, 'con un dedo aún puesto no se decide nada');
    igual(MovilGestos.soltar(r.estado, p(100, 300)).intencion, 'pellizco');
  });

  /* Sin este reinicio, el primer pellizco de la sesión envenenaría todos los
     deslizamientos siguientes. */
  prueba('tras levantar todos los dedos, el siguiente gesto empieza limpio', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(100, 300));
    e = MovilGestos.presionar(e, p(300, 300));
    e = MovilGestos.soltar(e, p(300, 300)).estado;
    e = MovilGestos.soltar(e, p(100, 300)).estado;
    e = MovilGestos.presionar(e, p(200, 300));
    igual(MovilGestos.soltar(e, p(100, 300)).intencion, 'izquierda');
  });

  // ---- Higiene ----------------------------------------------------

  /* El punto no es cualquiera: (500,300) desde un origen de (0,0) sería un
     deslizamiento a la derecha en toda regla. Con un punto en diagonal la
     prueba pasaba igual sin el guardia, porque la diagonal ya devuelve null
     por su cuenta y tapaba el fallo. */
  prueba('soltar sin haber presionado no inventa una intención', function () {
    igual(MovilGestos.soltar(MovilGestos.inicial(), p(500, 300)).intencion, null);
  });

  prueba('ninguna función modifica el estado que recibe', function () {
    var e = MovilGestos.presionar(MovilGestos.inicial(), p(200, 300));
    var copia = JSON.parse(JSON.stringify(e));
    MovilGestos.presionar(e, p(300, 300));
    MovilGestos.soltar(e, p(100, 300));
    igual(e, copia, 'el estado original ha cambiado');
  });

  prueba('los tres números están expuestos y son los que dice el plan', function () {
    igual(MovilGestos.TOQUE, 10);
    igual(MovilGestos.UMBRAL, 24);
    igual(MovilGestos.DOMINIO, 1.6);
  });
});
```

- [ ] **Paso 2: Cuenta las pruebas, engánchalas y compruébalas en rojo**

**Cuenta tú las llamadas a `prueba(`** de ese archivo antes de seguir. Quien
escribió este plan se equivocó contando las de la Tarea 1 —dijo 26 y eran 29—,
así que el número que manda es el tuyo. Apúntalo en el informe.

En `tests/test.html`, añade `<script src="../js/movil-gestos.js"></script>`
después de `../js/movil-recorrido.js` (o después de `../js/visor-estado.js` si
la Tarea 1 no está hecha todavía) y
`<script src="pruebas-movil-gestos.js"></script>` junto a las demás pruebas.

Abre la suite. Esperado: todas las nuevas en rojo con `MovilGestos is not
defined`. Si alguna sale verde antes de que el módulo exista, esa prueba no
comprueba nada — dilo.

- [ ] **Paso 3: Escribe el módulo**

Crea `js/movil-gestos.js`:

```js
window.MovilGestos = (function () {

  /* Por debajo de esto el dedo no se ha movido: es un toque. */
  var TOQUE = 10;

  /* El eje dominante tiene que recorrer al menos esto para que haya
     deslizamiento. Entre TOQUE y UMBRAL queda una franja a propósito en la que
     no pasa nada: un dedo que recorre 15px no quería tocar ni quería
     deslizar. */
  var UMBRAL = 24;

  /* Y tiene que superar al otro eje por este factor. Sin esto, un arrastre en
     diagonal elegiría dirección por un píxel de diferencia, y el gesto haría
     una cosa u otra según el temblor de la mano. */
  var DOMINIO = 1.6;

  function inicial() {
    return { dedos: 0, x0: 0, y0: 0, cancelado: false };
  }

  function copia(e) {
    return { dedos: e.dedos, x0: e.x0, y0: e.y0, cancelado: e.cancelado };
  }

  /* Un dedo toca la pantalla. El primero fija el origen; a partir del segundo
     el gesto deja de poder ser un deslizamiento —manda el pellizco— y lo sigue
     siendo hasta que se levanten todos, que es lo que la spec llama «el
     deslizamiento se cancela hasta soltar». */
  function presionar(estado, punto) {
    var e = copia(estado);
    e.dedos = e.dedos + 1;
    if (e.dedos === 1) { e.x0 = punto.x; e.y0 = punto.y; }
    else { e.cancelado = true; }
    return e;
  }

  /* La decisión, con el recorrido ya medido. El orden importa: primero se
     descarta el toque, luego el recorrido corto, luego la diagonal. Lo que
     sobrevive a los tres tiene dirección. */
  function intencionDe(dx, dy) {
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.sqrt(dx * dx + dy * dy) <= TOQUE) return 'toque';

    var dominante = Math.max(ax, ay), otro = Math.min(ax, ay);
    if (dominante < UMBRAL) return null;
    if (dominante < otro * DOMINIO) return null;

    if (ax >= ay) return dx < 0 ? 'izquierda' : 'derecha';
    return dy < 0 ? 'arriba' : 'abajo';
  }

  /* Se levanta un dedo. La intención sólo se decide cuando se levanta el
     ÚLTIMO: mientras quede alguno en pantalla el gesto no ha terminado. Al
     quedarse en cero se reinicia la cancelación, para que el primer pellizco
     de la sesión no envenene todos los deslizamientos siguientes. */
  function soltar(estado, punto) {
    if (estado.dedos === 0) return { estado: inicial(), intencion: null };

    var e = copia(estado);
    e.dedos = e.dedos - 1;
    if (e.dedos > 0) return { estado: e, intencion: null };

    var intencion = estado.cancelado
      ? 'pellizco'
      : intencionDe(punto.x - estado.x0, punto.y - estado.y0);
    return { estado: inicial(), intencion: intencion };
  }

  return {
    TOQUE: TOQUE, UMBRAL: UMBRAL, DOMINIO: DOMINIO,
    inicial: inicial, presionar: presionar, soltar: soltar
  };
})();
```

- [ ] **Paso 4: Todas en verde, y la suite entera también**

Recarga con la caché limpia. Esperado: **251 pasan, 0 fallan** si la Tarea 1 ya está hecha (229 + 22),
o **221** si haces ésta antes (199 + 22). Son **22 llamadas a `prueba(`**. Comprueba el
número y apúntalo.

**Comprueba a mano estos tres casos antes de seguir**, porque son los que la
spec fija con números y los que más fácil se rompen sin que se note:

1. `gesto(p(200,300), p(212,312))` → `null` (el arrastre diagonal de 12px)
2. `gesto(p(200,300), p(224,300))` → `'derecha'` (justo en el umbral)
3. `gesto(p(200,300), p(223,300))` → `null` (un píxel por debajo)

- [ ] **Paso 5: Comprueba que las pruebas no son de mentira**

**Lee el aviso sobre mutaciones de la cabecera de este plan.** Las de abajo son
un punto de partida **sin verificar**. El criterio es **por prueba**: cada una
tiene que morir ante alguna mutación.

| # | Mutación | Dónde | Mata |
|---|---|---|---|
| 1 | `TOQUE = 10` → `TOQUE = 30` | constantes | 6 |
| 2 | `UMBRAL = 24` → `UMBRAL = 12` | constantes | 2 |
| 3 | `DOMINIO = 1.6` → `DOMINIO = 1` | constantes | 3 |
| 4 | `<= TOQUE` → `< TOQUE` | `intencionDe` | 1 |
| 5 | `dominante < UMBRAL` → `dominante <= UMBRAL` | `intencionDe` | 1 |
| 6 | `if (dominante < otro * DOMINIO) return null;` borrado | `intencionDe` | 2 |
| 7 | `dx < 0 ? 'izquierda' : 'derecha'` invertido | `intencionDe` | 6 |
| 8 | `dy < 0 ? 'arriba' : 'abajo'` invertido | `intencionDe` | 3 |
| 9 | `else { e.cancelado = true; }` borrado | `presionar` | 3 |
| 10 | `if (e.dedos === 1)` → `if (e.dedos >= 1)` | `presionar` | 3 |
| 11 | `if (e.dedos > 0) return {…, intencion: null};` borrado | `soltar` | 3 |
| 12 | `return { estado: inicial(), … }` → `{ estado: e, … }` | `soltar` | 1 |
| 13 | `estado.cancelado ? 'pellizco' : …` → siempre la rama derecha | `soltar` | 3 |
| 14 | `Math.sqrt(dx*dx + dy*dy)` → `Math.max(ax, ay)` | `intencionDe` | 1 |
| 15 | `if (estado.dedos === 0) return …` borrado | `soltar` | 1 |
| 16 | `var e = copia(estado);` → `var e = estado;` | `presionar` | 1 |
| 17 | `return 'toque';` → `return null;` | `intencionDe` | 3 |

**Resultado verificado: las 22 pruebas mueren.** Ninguna sobrevive a las 17
mutaciones. Comprobado ejecutando módulo y pruebas en Node antes de escribir el
plan.

**Un mutante equivalente encontrado, y se deja dicho para que no lo busques:**
cambiar `if (ax >= ay)` por `if (ax > ay)` **no mata ninguna prueba, y es
correcto que no la mate**. Los dos sólo se diferencian cuando `ax === ay`
exactamente —la diagonal perfecta— y ese caso ya ha devuelto `null` tres líneas
antes, en la regla de `DOMINIO`. No escribas una prueba para eso: no hay
comportamiento que fijar.

Apunta qué mutación mató a qué pruebas y **si alguna prueba sobrevive a todas**.

- [ ] **Paso 6: Commit**

`node tests/prueba-borrador.js` y `python tests/auditar_rutas.py` en verde
antes de commitear. Mensaje en castellano, sin acentos en la línea de asunto y
sin comillas invertidas. Que diga por qué hay una franja muerta entre el toque
y el umbral, no que se ha añadido un reconocedor.

---

## Tarea 3: `brillo.js` — el umbral y, sobre todo, la caída elegante

**Archivos:**
- Crear: `js/brillo.js`
- Crear: `tests/pruebas-brillo.js`
- Modificar: `tests/test.html` (dos líneas)

**Interfaces:**
- Consume: nada. Independiente de las Tareas 1 y 2.
- Produce:
  - `Brillo.UMBRAL` → el número, expuesto para que las pruebas no lo repitan
  - `Brillo.tratamiento(luminancia)` → `'claro'` | `'oscuro'`
  - `Brillo.decidir(medir, registrar)` → `'claro'` | `'oscuro'` | `'halo'`

`luminancia` es un número de 0 a 1. `medir` es una función **sin argumentos**
que devuelve esa luminancia y que **puede lanzar**. `registrar` es una función
opcional que recibe un mensaje; sirve para que el fallo quede anotado sin que
este módulo sepa qué es una consola.

### Por qué esta tarea importa más de lo que parece

La spec dedica un apartado entero a esto (líneas 76-95) y termina con una frase
que hay que leer dos veces:

> *El riesgo de esto:* que el halo se quede puesto meses en producción porque
> nadie note que la medición nunca llegó a funcionar. **Contramedida
> obligatoria:** el fallo se registra, y `docs/estado-conocido.md` dice que esta
> función está sin verificar hasta que entren las fotos reales.

O sea: **el camino que se va a usar de verdad hoy es el de degradación**, no el
automático. Medir la luminancia obliga a dibujar la foto en un lienzo y leer el
píxel, y `picsum.photos` —de donde salen las fotos de relleno de hoy— no manda
`Access-Control-Allow-Origin`, así que el lienzo queda manchado y
`getImageData` lanza una excepción de seguridad. Está comprobado sobre la
respuesta final, tras la redirección 302.

Por eso el módulo se parte en dos: `tratamiento` decide el umbral, y `decidir`
envuelve la medición y **atrapa lo que lance**. Que `medir` sea un argumento y
no una llamada a `canvas` dentro es lo que permite ejercitar el camino de
degradación sin fotos reales, que es literalmente lo que la spec pide en la
línea 307: «**es la única forma de ejercitar el camino de degradación sin las
fotos reales**».

`registrar` es la contramedida obligatoria hecha comprobable. Si el registro
fuera un `console.warn` dentro del módulo, no habría forma de probar que se
llama, y la spec teme exactamente eso: que el fallo pase desapercibido.

### El umbral

`UMBRAL = 0.5`, sobre luminancia de 0 (negro) a 1 (blanco). Una foto **clara**
(luminancia alta) pide esquinas **negras**; una oscura las pide amarillas. Este
módulo devuelve cómo es la foto —`'claro'` u `'oscuro'`—, no de qué color van
las esquinas: el color es cosa de quien pinta. Mezclar las dos cosas obligaría
a cambiar este módulo si algún día el amarillo cambia de tono.

- [ ] **Paso 1: Escribe las pruebas, que fallarán todas**

Crea `tests/pruebas-brillo.js` con esto tal cual:

```js
describe('Brillo', function () {

  function siempre(v) { return function () { return v; }; }
  function lanza(mensaje) {
    return function () { throw new Error(mensaje); };
  }

  // ---- El umbral --------------------------------------------------

  prueba('una foto clara pide el tratamiento de foto clara', function () {
    igual(Brillo.tratamiento(0.9), 'claro');
  });

  prueba('una foto oscura pide el de foto oscura', function () {
    igual(Brillo.tratamiento(0.1), 'oscuro');
  });

  /* El borde exacto, en los dos lados. */
  prueba('justo en el umbral cuenta como oscuro, justo por encima como claro', function () {
    igual(Brillo.tratamiento(Brillo.UMBRAL), 'oscuro');
    igual(Brillo.tratamiento(Brillo.UMBRAL + 0.01), 'claro');
  });

  /* Con números a pelo, y no con `Brillo.UMBRAL`. La prueba de arriba sola no
     fija el valor: al escribirse contra la constante, mover el umbral de 0,5 a
     0,8 movía también la prueba y la suite seguía en verde. Comprobado con una
     mutación, no supuesto. */
  prueba('el umbral está en la mitad, y eso queda fijado aquí', function () {
    igual(Brillo.UMBRAL, 0.5);
    igual(Brillo.tratamiento(0.6), 'claro');
    igual(Brillo.tratamiento(0.4), 'oscuro');
  });

  prueba('los extremos no se salen de los dos tratamientos', function () {
    igual(Brillo.tratamiento(0), 'oscuro');
    igual(Brillo.tratamiento(1), 'claro');
  });

  // ---- La medición que sale bien ----------------------------------

  prueba('decidir usa lo que devuelve la medición', function () {
    igual(Brillo.decidir(siempre(0.9)), 'claro');
    igual(Brillo.decidir(siempre(0.1)), 'oscuro');
  });

  prueba('cuando la medición sale bien no se registra nada', function () {
    var avisos = [];
    Brillo.decidir(siempre(0.9), function (m) { avisos.push(m); });
    igual(avisos.length, 0);
  });

  // ---- La caída elegante, que es el camino que se usa HOY ----------

  /* El caso real de hoy: `getImageData` lanza una excepción de seguridad
     porque el lienzo quedó manchado por una imagen de otro origen. El módulo
     tiene que devolver el tratamiento seguro, no propagar. */
  prueba('un lienzo manchado da el halo en vez de propagar la excepción', function () {
    igual(Brillo.decidir(lanza('The operation is insecure.')), 'halo');
  });

  prueba('cualquier otro fallo de la medición también cae al halo', function () {
    igual(Brillo.decidir(lanza('lo que sea')), 'halo');
    igual(Brillo.decidir(function () { return null; }), 'halo');
    igual(Brillo.decidir(function () { return NaN; }), 'halo');
  });

  prueba('una luminancia fuera de 0..1 no se cree: cae al halo', function () {
    igual(Brillo.decidir(siempre(-0.2)), 'halo');
    igual(Brillo.decidir(siempre(1.5)), 'halo');
  });

  prueba('si no hay función de medir, cae al halo sin romperse', function () {
    igual(Brillo.decidir(null), 'halo');
    igual(Brillo.decidir(undefined), 'halo');
  });

  // ---- La contramedida obligatoria de la spec ----------------------

  /* La spec (líneas 92-95) teme que el halo se quede puesto meses en
     producción sin que nadie note que la medición nunca funcionó. El registro
     es la contramedida, y por eso se inyecta: si fuera un console.warn dentro
     del módulo no habría forma de comprobar que se llama. */
  prueba('el fallo se registra, que es la contramedida que pide la spec', function () {
    var avisos = [];
    Brillo.decidir(lanza('The operation is insecure.'), function (m) { avisos.push(m); });
    igual(avisos.length, 1, 'el fallo tiene que quedar anotado');
  });

  prueba('el registro dice qué pasó, no sólo que pasó algo', function () {
    var avisos = [];
    Brillo.decidir(lanza('The operation is insecure.'), function (m) { avisos.push(m); });
    cierto(avisos[0].indexOf('insecure') !== -1,
           'el mensaje original tiene que llegar entero: ' + avisos[0]);
    cierto(avisos[0].toLowerCase().indexOf('halo') !== -1,
           'y tiene que decir qué se hizo en su lugar: ' + avisos[0]);
  });

  prueba('una luminancia inservible también se registra', function () {
    var avisos = [];
    Brillo.decidir(siempre(NaN), function (m) { avisos.push(m); });
    igual(avisos.length, 1, 'un número que no vale es tan fallo como una excepción');
  });

  /* Registrar no puede ser obligatorio: quien llame puede no querer ruido, y
     un módulo que revienta por no recibir un argumento opcional es peor que el
     fallo que venía a tratar. */
  prueba('sin función de registro, decidir sigue funcionando', function () {
    igual(Brillo.decidir(lanza('vaya')), 'halo');
    igual(Brillo.decidir(lanza('vaya'), null), 'halo');
  });

  prueba('si el registro falla, no se lleva por delante la decisión', function () {
    igual(Brillo.decidir(lanza('vaya'), lanza('y el registro también falla')), 'halo');
  });
});
```

- [ ] **Paso 2: Cuenta, engancha y comprueba en rojo**

**Cuenta tú las llamadas a `prueba(`.** En la Tarea 1 quien escribió este plan
dijo 26 y eran 29; el número que manda es el tuyo.

En `tests/test.html`: `<script src="../js/brillo.js"></script>` con los demás
módulos y `<script src="pruebas-brillo.js"></script>` con las demás pruebas.

Abre la suite. Todas las nuevas en rojo con `Brillo is not defined`.

- [ ] **Paso 3: Escribe el módulo**

Crea `js/brillo.js`:

```js
window.Brillo = (function () {

  /* Luminancia de 0 (negro) a 1 (blanco). Por encima del umbral la foto es
     clara y pide esquinas oscuras; por debajo, al revés.

     Este módulo dice cómo es la FOTO, no de qué color van las esquinas. El
     color es cosa de quien pinta: si algún día el amarillo cambia de tono, no
     hay motivo para tocar esto. */
  var UMBRAL = 0.5;

  function tratamiento(luminancia) {
    return luminancia > UMBRAL ? 'claro' : 'oscuro';
  }

  function utilizable(v) {
    return typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1;
  }

  /* Avisa sin dejar que el aviso estropee nada. Si quien registra revienta, el
     fallo que se estaba tratando no puede quedar peor de lo que ya estaba. */
  function avisar(registrar, mensaje) {
    if (typeof registrar !== 'function') return;
    try { registrar(mensaje); } catch (e) { /* ni eso puede tumbar la decisión */ }
  }

  /* `medir` se pasa como argumento y no se llama a un lienzo aquí dentro, y no
     es por elegancia: medir de verdad obliga a dibujar la foto en un lienzo y
     leer el píxel, y con las fotos de relleno de hoy —servidas desde otro
     origen, sin Access-Control-Allow-Origin— el lienzo queda manchado y
     `getImageData` lanza. Recibiendo la medición como función, el camino de
     degradación se puede ejercitar sin fotos reales, que es la única forma de
     probarlo hasta que el estudio suba las suyas.

     Devuelve 'halo' ante cualquier duda: sin medición, con una medición que
     lanza, o con un número que no sirve. El halo es feo al lado de lo
     automático y correcto siempre, que es la concesión que la spec eligió a
     propósito.

     `registrar` es la contramedida obligatoria de la spec: sin ella, el halo
     podría quedarse puesto meses en producción sin que nadie note que la
     medición nunca llegó a funcionar. */
  function decidir(medir, registrar) {
    if (typeof medir !== 'function') {
      avisar(registrar, 'Brillo: no hay forma de medir la luminancia; se usa el halo.');
      return 'halo';
    }

    var luminancia;
    try {
      luminancia = medir();
    } catch (e) {
      avisar(registrar, 'Brillo: no se pudo medir la luminancia (' + e.message
        + '); se usa el halo. Con fotos del mismo origen esto no debería pasar.');
      return 'halo';
    }

    if (!utilizable(luminancia)) {
      avisar(registrar, 'Brillo: la luminancia medida no sirve (' + luminancia
        + '); se usa el halo.');
      return 'halo';
    }

    return tratamiento(luminancia);
  }

  return { UMBRAL: UMBRAL, tratamiento: tratamiento, decidir: decidir };
})();
```

- [ ] **Paso 4: Todas en verde**

Recarga con la caché limpia. Apunta el total y compáralo con el que traías.

- [ ] **Paso 5: Comprueba que las pruebas no son de mentira**

Estas mutaciones **están verificadas**: se ejecutaron el módulo y las pruebas
de arriba en Node, con cada mutación aplicada por separado. La primera versión
de esta tabla la escribí de memoria y **cinco pruebas sobrevivían**; los
números de abajo son los de la ejecución, no los de mi cabeza.

| # | Mutación | Dónde | Mata |
|---|---|---|---|
| 1 | `UMBRAL = 0.5` → `UMBRAL = 0.8` | constantes | 1 |
| 2 | `luminancia > UMBRAL` → `>=` | `tratamiento` | 1 |
| 3 | `? 'claro' : 'oscuro'` invertido | `tratamiento` | 5 |
| 4 | `&& v >= 0 && v <= 1` borrado | `utilizable` | 1 |
| 5 | `typeof v === 'number' &&` borrado | `utilizable` | 1 |
| 6 | el `try/catch` de `medir()` quitado, que propague | `decidir` | 6 |
| 7 | `if (!utilizable(luminancia))` desactivado | `decidir` | 3 |
| 8 | el `avisar` de la excepción desactivado | `decidir` | 2 |
| 9 | el `avisar` de la luminancia inservible desactivado | `decidir` | 1 |
| 10 | la guarda **y** el `try` de `avisar` quitados a la vez | `avisar` | 6 |
| 11 | el mensaje pierde `e.message` | `decidir` | 1 |
| 12 | el mensaje pierde la palabra «halo» | `decidir` | 1 |
| 13 | `avisar` se llama también en el camino bueno | `decidir` | 1 |

**Resultado verificado: las 16 pruebas mueren.** Ninguna sobrevive. Se comprobó
ejecutando módulo y pruebas en Node con cada mutación aplicada por separado.

**Dos cosas que la verificación destapó, y que te ahorran el rato:**

1. **De la guarda y el `try` de `avisar`, sólo la guarda es un mutante
   equivalente — el `try` no.** Verificado por separado, no en conjunto:
   quitar sólo la guarda no mata ninguna prueba (sin ella, llamar a un
   `registrar` que no es una función lanza un `TypeError` y el `try` se lo
   traga; el resultado —nada registrado— es idéntico). Pero quitar sólo el
   `try` **sí mata una**: «si el registro falla, no se lleva por delante la
   decisión». Ahí `registrar` **es** una función —sólo que lanza—, así que la
   guarda (`typeof registrar !== 'function'`) no llega a actuar y la excepción
   se propaga sin nada que la atrape. La mutación que mata las seis de golpe es
   **quitar las dos a la vez** (la número 10): con la guarda sola quitada nadie
   nota nada; con el `try` solo quitado ya cae una; combinadas, caen las seis
   porque además de ese caso se suman los que sí dependían de la guarda para no
   lanzar. Se deja anotado para que nadie borre el `try` «porque no está
   cubierto» — si lo está, sólo que no por una mutación que lo aísla del todo.

2. **`if (typeof medir !== 'function')` es un mutante equivalente.** Quitarlo no
   mata ninguna prueba, y está bien que no la mate: sin esa guarda, llamar a
   `null()` lanza un `TypeError` que cae en el mismo `catch`, así que el
   resultado —`'halo'`, registrado— es idéntico. Lo único que cambia es el
   texto del aviso, que pasa a ser «medir is not a function» en vez de una
   frase escrita para quien la lea. Se conserva por el mensaje, no por el
   comportamiento. **No escribas una prueba para esto.**

Aun así, **reprodúcelo**: si en tu ejecución alguna sobrevive, el código que
has escrito no es el de aquí, y eso es información.

- [ ] **Paso 6: Commit**

`node tests/prueba-borrador.js` y `python tests/auditar_rutas.py` en verde.
Mensaje en castellano, sin acentos en la línea de asunto y sin comillas
invertidas. Que diga **por qué la medición se recibe como argumento** —que es
lo único que permite probar la degradación sin las fotos reales—, no que se ha
añadido un módulo de brillo.

---

## Tarea 4: Dejar escrito lo que se sabe y lo que no

**Archivos:**
- Modificar: `docs/estado-conocido.md`
- No se toca ningún `.js`

**Interfaces:**
- Consume: las tres tareas anteriores. No produce nada que consuma otra tarea.

### Por qué es una tarea y no un paso al final de la Tarea 3

Porque una de las cosas que hay que escribir **la exige la spec como
contramedida obligatoria**, con esas palabras (líneas 92-95): el camino
automático del brillo no se puede verificar hasta que el estudio suba sus fotos,
y si eso no queda escrito, el halo puede quedarse puesto meses en producción sin
que nadie note que la medición nunca llegó a funcionar. Eso no es documentación
de cortesía: es la mitad de la decisión de diseño.

Y porque el bloque anterior de este proyecto dejó en este mismo archivo un
párrafo que afirmaba que `hero.js` no tenía ni una prueba cuando tenía cinco,
**en el commit que venía a documentar honestamente lo no cubierto**. Este
archivo se gana la confianza o no sirve para nada.

- [ ] **Paso 1: Corre la suite entera tres veces seguidas**

Tiene que dar el mismo número las tres. Pega los tres resultados en el informe.
La suite se volvió determinista en el bloque 4a y hay que confirmar que lo
sigue siendo; el bloque 4b metió una sección asíncrona nueva y hubo que
revisarlo entonces.

Apunta también el número final. Si has hecho las tres tareas, deberían ser
**199 + 30 + 22 + 16 = 267**. **Cuéntalo, no lo copies**: quien escribió este
plan se equivocó contando las pruebas de la Tarea 1 —dijo 26 y eran 29— y sólo
lo cazó ejecutándolas.

- [ ] **Paso 2: Escribe en `docs/estado-conocido.md`, sección «Cómo se prueba»**

Actualiza el recuento de la primera línea al número que hayas medido, y el
aviso del `grep` que hay justo debajo (hoy dice que `grep -c "prueba("` da 201
frente a las 199 que imprime la suite; esa diferencia de dos se mantiene, así
que el nuevo número del grep es el tuyo más dos).

Añade a la lista de lo que la suite cubre una línea por módulo, diciendo **qué
comprueba cada uno**, no sólo que existe. Por ejemplo, para el recorrido: que
en un proyecto de vídeo bajar llega a la ficha en un solo gesto, que en el
último proyecto seguir hacia delante no sale al vacío, y que la ida y vuelta
entre la ruta del router y el estado no pierde nada.

- [ ] **Paso 3: Escribe lo que NO está cubierto, que es lo que de verdad importa**

En la sección de lo que sigue sin cubrirse, añade estas tres cosas. **Escríbelas
con tus palabras y con los números que hayas medido tú**, no copies estas
frases si no las has comprobado:

1. **El camino automático del brillo no se puede verificar todavía, y hasta que
   se verifique el sitio usará siempre el halo.** Medir la luminancia obliga a
   dibujar la foto en un lienzo y leer el píxel; las fotos de relleno de hoy
   vienen de otro origen sin `Access-Control-Allow-Origin`, así que el lienzo
   queda manchado y `getImageData` lanza. Lo que está probado es **la caída**:
   que ante esa excepción se devuelve `'halo'` y el fallo se registra. Lo que
   **no** está probado es que con fotos propias servidas desde
   `lidialuque.com` la medición dé un número correcto. Esto es la contramedida
   que la spec pide por escrito en sus líneas 92-95: sin esta anotación, el
   halo puede quedarse puesto meses sin que nadie lo note.

2. **Los tres módulos no los llama nadie todavía.** `movil-recorrido.js`,
   `movil-gestos.js` y `brillo.js` sólo se cargan desde `tests/test.html`;
   `index.html` no los conoce. Es deliberado: el bloque 4c construye lo puro y
   el siguiente lo cablea. Mientras tanto, **el móvil sigue viendo exactamente
   lo mismo que antes**, y una prueba en verde aquí no dice nada sobre lo que
   se ve en un teléfono.

3. **Que girar el móvil no mueva la posición está probado a medias.** Lo que
   este bloque garantiza es que sólo las cuatro direcciones conocidas mueven el
   estado: cualquier otra cosa lo devuelve intacto. Lo que **no** está probado
   —porque todavía no existe— es que quien repinta tras el giro vuelva a leer
   ese estado en vez de reconstruirlo desde cero. Eso es del bloque que pinta, y
   hasta entonces el requisito de la spec (línea 302) está cubierto sólo por su
   mitad.

4. **Lo que ninguna prueba de éstas puede decir**, y que sólo puede juzgar el
   estudio en un móvil de verdad (spec, líneas 324-328): si los umbrales de
   gesto tienen el tacto correcto —que 24px sea el punto justo entre «no me
   responde» y «se me dispara solo»—, y si el eje vertical se siente natural o
   se siente como que el teléfono se resiste. Los números de `movil-gestos.js`
   están elegidos para resolver el caso que la spec fija —12px en diagonal no
   es un deslizamiento— pero **ese caso no valida el tacto, sólo la geometría.**

- [ ] **Paso 4: Repasa lo que ya había escrito, por si este bloque lo ha dejado desfasado**

Lee la sección «Detalles menores aplazados» y la de lo no cubierto **enteras**,
no sólo lo que acabas de añadir. Si alguna entrada describe un estado del
código que estas tres tareas han cambiado, arréglala o bórrala.

Esto no es celo: en el bloque anterior esa lista tenía una entrada ya saldada
—una variable inútil de `router.js` que el propio bloque había eliminado— y una
lista de deuda con una entrada falsa deja de merecer confianza entera.

**No escribas nada que no hayas comprobado.**

- [ ] **Paso 5: Commit**

```
node tests/prueba-borrador.js
python tests/auditar_rutas.py
```

Los dos en verde. Mensaje en castellano, sin acentos en la línea de asunto y
sin comillas invertidas. Que diga que queda anotado **que el brillo automático
está sin verificar y por qué**, no que se ha actualizado la documentación.

---

## Al terminar las cuatro

El bloque está hecho cuando:

- La suite da el mismo número tres veces seguidas, y ese número está escrito en
  `docs/estado-conocido.md`.
- **Ninguna prueba de las nuevas sobrevive a todas las mutaciones de su tarea**,
  o las que sobreviven están explicadas como mutantes equivalentes en el
  informe, con el razonamiento.
- `index.html` no ha cambiado, y `git diff` no toca ningún `js/` que no sea uno
  de los tres nuevos.
- El móvil sigue sin existir. **Eso es el éxito de este bloque, no su fracaso**
  — conviene decirlo en voz alta porque un bloque entero sin resultado visible
  se lee como falta de avance, y la spec avisa de ello en su última línea.
