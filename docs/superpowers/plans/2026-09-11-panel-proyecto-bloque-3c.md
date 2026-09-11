# La pantalla de un proyecto — plan del bloque 3c

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usa
> `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans` para implementarlo tarea a tarea. Los pasos
> llevan casilla (`- [ ]`) para ir marcándolos. Antes de decir «hecho»:
> `superpowers:verification-before-completion`.

**Objetivo:** la segunda pantalla del panel. Se abre un proyecto y se ve su
ficha, su portada y sus fotos: se suben arrastrando o con el selector, se
ordenan, se elige cuál es la portada y se quitan. Las fotos se reducen **en el
navegador** antes de subir, en las tres medidas que la web usa.

**Arquitectura:** la misma aplicación estática de `/panel`, detrás de Access,
hablando con la API del bloque 3a. Lo que cambia es que ahora hay **más de una
pantalla**, y eso pide un enrutador propio.

**Especificación:** `docs/superpowers/specs/2026-08-17-panel-contenido-design.md`
— léela entera, incluidas **Correcciones tras implementar los bloques 1 y 2**
(la corrección 2 es la que dice que son tres medidas y no dos).

**Lo que ya existe y este bloque consume:**

| Pieza | Qué hace |
|---|---|
| `GET /api/borrador` | devuelve `{version, proyectos}` |
| `PUT /api/borrador` | guarda; **409** si la versión no es la guardada |
| `POST /api/imagen?nombre=N` | guarda los bytes en R2 y devuelve `{url}`. **409** si ese nombre ya existe —nunca pisa—, **413** si pasa de 5 MB, **415** si no es jpg/png/webp/avif/gif |
| `window.Borrador.cargar/guardar` | el cliente de esa API, con sus mensajes en castellano |
| `window.Orden.mover(lista, desde, hasta)` | mover un elemento de sitio, devolviendo lista nueva |
| `window.Identificador.desde(titulo)` | sanear un texto a `a-z0-9-` |
| `window.Lista.pintar(...)` | la lista de proyectos, con su arrastre y sus botones |
| `window.ReglasContenido.validar` | las reglas que aplica el Worker antes de publicar |

## Restricciones globales

- **Ningún archivo de `js/`, `panel/js/` ni `worker/` pasa de 300 líneas.**
  Criterio de aceptación 11. `panel/js/panel.js` va por 209 y este bloque le
  añade trabajo: la Tarea 5 existe para que no lo cruce.
- **`panel/js/` va en ES5 estricto y patrón `window.Nombre`.** El arnés
  (`tests/test.html`) carga scripts planos y lee globales; con módulos ES haría
  falta un segundo arnés o un paso de compilación, y no hay ninguno de los dos.
- **Todo lo que se hace arrastrando se puede hacer con teclado.** Criterio de
  aceptación 6. Vale para la rejilla de fotos igual que valió para la lista.
- **Ninguna imagen sale deformada.** Criterio de aceptación 7: las medidas son
  cotas, y la proporción original se conserva siempre.
- Se respeta `prefers-reduced-motion`.
- Comentarios, textos de interfaz y mensajes de error **en castellano**.
- **No se copia `js/reglas-contenido.js` al panel.** Se carga desde `../js/`,
  como ya hace `panel/index.html`. Duplicarlo reabriría el agujero del 3a.
- Los módulos que hablan por red (`subida.js`) **se prueban en el arnés del
  navegador doblando `fetch` dentro del iframe de `ArnesDom.conDocumento`**, no
  con Node. El Worker tiene sus propias pruebas y no es lo que se prueba aquí.

---

## Siete decisiones, razonadas

### 1. Tres medidas por foto, por el lado largo

`herramientas/derivar_imagenes.py` ya generó así las 65 piezas del contenido
real, y lo que sube el panel tiene que ser indistinguible de lo que subió el
script: si no, la web tendría dos clases de fotografía según quién la puso.

| Medida | Cota del lado largo | Dónde se ve |
|---|---|---|
| portada | 1500 px | la galería, doce a la vez |
| pieza | 3000 px | el visor, y es lo único a calidad completa |
| miniatura | 250 px | la tira del visor, a 52 px |

Calidad JPEG **0,82**, la misma del script. Y **por el lado largo**, no por
alto: una foto apaisada y una vertical caben las dos en su cota sin que ninguna
se deforme, que es el criterio de aceptación 7.

La reducción la hace `createImageBitmap(archivo, { imageOrientation: 'from-image' })`
y luego `canvas.toBlob`. El `imageOrientation` no es un adorno: sin él, una foto
con orientación EXIF —cualquiera hecha con el móvil de lado— se sube tumbada, y
el estudio no tiene forma de arreglarlo desde el panel.

### 2. Cada pieza subida guarda también su `portada`

Las piezas del contenido real son `{url, miniatura}`. Las que suba el panel
serán `{url, miniatura, portada}`: un campo nuevo y **aditivo**, que nadie más
lee y que no invalida nada ya guardado.

Hace falta porque elegir la portada es elegir *una pieza*, y de una pieza hay
que poder sacar su versión de 1500 px. Para las 65 antiguas, que no lo traen,
`Edicion.portadaDe` lo deduce del sufijo: `-3000.jpg` → `-1500.jpg`. Deducirlo
siempre habría sido más corto, pero ata el panel a que el nombre del archivo
nunca cambie; guardarlo cuando se sabe y deducirlo sólo cuando no, deja esa
atadura como lo que es: una compatibilidad con lo viejo, no un contrato.

### 3. El nombre en R2 lleva un sello, porque el Worker no pisa

`POST /api/imagen` contesta **409** si la llave ya existe, a propósito: dejar
pasar la segunda subida perdería una imagen ya publicada. La consecuencia es que
el panel no puede mandar dos veces el mismo nombre, y sí lo haría —subir dos
veces `portada.jpg` desde dos proyectos es lo más normal del mundo—.

    <id>-<archivo saneado>-<sello base36>-<medida>.jpg
    bruma-portada-m8q3x1-3000.jpg

El sello sale de `Date.now()` más un azar corto. No es criptográfico ni falta:
sólo tiene que evitar el choque de dos subidas del mismo estudio, y ante un 409
la salida es reintentar con otro sello, que es exactamente lo que hace
`Subida.subir`.

### 4. Una sola página, tres pantallas por fragmento

`#/` la lista, `#/proyecto/<id>` un proyecto, `#/publicar` (bloque 3d). Un
fragmento y no rutas de verdad porque el Worker de recursos estáticos sirve
`panel/index.html` y nada más: cualquier otra ruta daría 404 al recargar.

`panel/js/rutas.js` lee el fragmento y `panel/js/pantallas.js` decide qué se
enseña. `panel.js` expone `window.Panel = { ir, hayCambios }` como costura para
las pruebas: sin ella no hay forma de pedirle desde fuera que cambie de pantalla
—es una IIFE que no devuelve nada— y las pruebas tendrían que simular eventos de
`hashchange`, que es probar el navegador.

### 5. El vídeo no se implementa aquí

`tipo: 'video'` es del bloque 4. En este bloque el vídeo es `ficha.enlace`, que
ya existe desde el 3b y ya se edita. La rejilla de fotos se enseña para
`tipo: 'fotos'`, que es lo que crea el panel.

### 6. Los cambios no se guardan solos

Editar la ficha o mover una foto cambia el borrador **en memoria**; guardar
sigue siendo explícito, como en el 3b. Y salir de la pantalla con cambios sin
guardar avisa: `window.Panel.hayCambios` es lo que lo sabe.

Autoguardar sería más cómodo y peor: cada pulsación sería un PUT, cada PUT sube
la versión, y dos sesiones abiertas se estarían mandando conflictos todo el rato
por cambios que nadie ha terminado de hacer.

### 7. Qué se queda fuera

- **Publicar** y el resumen de cambios: bloque 3d.
- **Borrar de R2.** Quitar una foto de un proyecto la quita del borrador; los
  bytes se quedan huérfanos en el bucket, a propósito, para que un descuido sea
  recuperable. Lo dice la especificación, y no hay ruta `DELETE /api/imagen`.
- **Recortar, girar o retocar.** El panel reduce y sube; lo demás es Lightroom.
- **Reordenar proyectos desde esta pantalla.** Eso es la lista, y ya está hecho.

---

## Estructura de archivos

| Archivo | De qué responde | Puro |
|---|---|---|
| `panel/js/rutas.js` | Leer el fragmento y decir qué pantalla es | sí |
| `panel/js/edicion.js` | Mover, quitar y marcar portada sobre un proyecto | sí |
| `panel/js/imagenes.js` | Las tres medidas, la cota y la reducción con canvas | mitad |
| `panel/js/subida.js` | Nombres, `POST /api/imagen`, reintento y fallos | no |
| `panel/js/fotos.js` | Pintar la rejilla y sus acciones | no |
| `panel/js/proyecto.js` | La pantalla entera de un proyecto | no |
| `panel/js/pantallas.js` | Qué pantalla se enseña y cuál se esconde | no |

`panel/js/lista.js` recibe `enfocar`, que hoy vive en `panel.js` (Tarea 5).

---

### Tarea 1: El fragmento dice qué pantalla es

**Archivos:**
- Crear: `panel/js/rutas.js`, `tests/pruebas-rutas-panel.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Rutas.leer(hash)` → `{pantalla, id}`.
  `window.Rutas.hacia(pantalla, id)` → la cadena de fragmento.
- Consume: nada.

**Por qué importa.** Es lo único que convierte una cadena que escribe cualquiera
en la barra de direcciones en una decisión del panel. Un fragmento raro no puede
dejar la pantalla en blanco: se cae a la lista, que siempre existe.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-rutas-panel.js`:

```js
/* Se llama pruebas-rutas-panel.js y no pruebas-rutas.js para que no se
   confunda con el enrutador de la web pública (js/router.js), que resuelve
   otro problema —categorías y proyectos del lienzo— y ya tiene dos archivos
   de pruebas. */
describe('Rutas.leer', function () {
  prueba('el fragmento vacío es la lista', function () {
    igual(Rutas.leer(''), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/'), { pantalla: 'lista', id: null });
  });

  prueba('un proyecto trae su id', function () {
    igual(Rutas.leer('#/proyecto/bruma'), { pantalla: 'proyecto', id: 'bruma' });
  });

  prueba('publicar no trae id', function () {
    igual(Rutas.leer('#/publicar'), { pantalla: 'publicar', id: null });
  });

  /* La barra final la añaden los navegadores y algunos gestores de enlaces al
     copiar. Que «#/publicar/» dejara la pantalla en blanco sería un fallo que
     sólo aparece al compartir una dirección. */
  prueba('la barra final sobra y no cambia nada', function () {
    igual(Rutas.leer('#/publicar/'), { pantalla: 'publicar', id: null });
    igual(Rutas.leer('#/proyecto/bruma/'), { pantalla: 'proyecto', id: 'bruma' });
  });

  /* Un id vacío no es un proyecto: no hay ninguno que buscar, y enseñar la
     pantalla de proyecto sin proyecto sería una pantalla rota. */
  prueba('un proyecto sin id se cae a la lista', function () {
    igual(Rutas.leer('#/proyecto'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/proyecto/'), { pantalla: 'lista', id: null });
  });

  prueba('lo que no se reconoce se cae a la lista', function () {
    igual(Rutas.leer('#/inventado'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/proyecto/a/b'), { pantalla: 'lista', id: null });
    igual(Rutas.leer(null), { pantalla: 'lista', id: null });
  });

  /* El id llega codificado si alguien copia la dirección desde el navegador.
     Sin descodificar, un id con caracteres escapados no casaría con ninguno
     del borrador y la pantalla diría «no existe» de un proyecto que sí está.
     Los ids que genera Identificador.desde son a-z0-9- y nunca se escapan,
     así que esto cubre lo que llega de fuera, no lo que produce el panel. */
  prueba('el id llega descodificado', function () {
    igual(Rutas.leer('#/proyecto/bru%2Dma'), { pantalla: 'proyecto', id: 'bru-ma' });
  });

  /* Un porcentaje suelto hace lanzar a decodeURIComponent. Que el panel
     entero reviente por una dirección mal pegada sería desproporcionado. */
  prueba('un escape mal formado no revienta', function () {
    igual(Rutas.leer('#/proyecto/%'), { pantalla: 'lista', id: null });
  });
});

describe('Rutas.hacia', function () {
  prueba('compone los tres destinos', function () {
    igual(Rutas.hacia('lista'), '#/');
    igual(Rutas.hacia('proyecto', 'bruma'), '#/proyecto/bruma');
    igual(Rutas.hacia('publicar'), '#/publicar');
  });

  /* Ida y vuelta: lo que compone `hacia` lo tiene que entender `leer`. Es la
     comprobación que impide que las dos se separen con el tiempo. */
  prueba('lo que compone hacia lo entiende leer', function () {
    igual(Rutas.leer(Rutas.hacia('proyecto', 'bruma')),
          { pantalla: 'proyecto', id: 'bruma' });
    igual(Rutas.leer(Rutas.hacia('publicar')),
          { pantalla: 'publicar', id: null });
  });
});
```

Añade a `tests/test.html`, junto a los demás:

```html
<script src="../panel/js/rutas.js"></script>
```
```html
<script src="pruebas-rutas-panel.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Arranca el arnés (`python -m http.server 8000` desde la raíz del worktree y abre
`http://localhost:8000/tests/test.html`). Esperado: `Rutas is not defined`.

- [ ] **Paso 3: Escribe `panel/js/rutas.js`**

```js
window.Rutas = (function () {
  var LISTA = { pantalla: 'lista', id: null };

  /* Devuelve siempre un objeto nuevo: quien lo reciba puede guardárselo sin
     miedo a que la siguiente llamada le cambie el de antes por debajo. */
  function lista() { return { pantalla: 'lista', id: null }; }

  /* decodeURIComponent lanza con un escape mal formado («%», «%zz»). Un
     fragmento mal pegado no puede tirar el panel entero, así que se trata
     como lo que es: una dirección que no se reconoce. */
  function descodificar(trozo) {
    try {
      return decodeURIComponent(trozo);
    } catch (e) {
      return null;
    }
  }

  function leer(hash) {
    var texto = String(hash == null ? '' : hash);
    /* Se quitan el «#» y la «/» de delante, y también la de detrás: los
       navegadores y los gestores de enlaces añaden barras finales al copiar
       una dirección, y no significan nada distinto. */
    var cuerpo = texto.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '');
    if (!cuerpo) return lista();

    var trozos = cuerpo.split('/');
    if (trozos[0] === 'publicar' && trozos.length === 1) {
      return { pantalla: 'publicar', id: null };
    }
    if (trozos[0] === 'proyecto' && trozos.length === 2) {
      var id = descodificar(trozos[1]);
      if (!id) return lista();
      return { pantalla: 'proyecto', id: id };
    }
    return lista();
  }

  function hacia(pantalla, id) {
    if (pantalla === 'proyecto') return '#/proyecto/' + encodeURIComponent(id);
    if (pantalla === 'publicar') return '#/publicar';
    return '#/';
  }

  return { leer: leer, hacia: hacia, LISTA: LISTA };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés otra vez: las **diez** nuevas en verde y las anteriores intactas.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/rutas.js tests/
git commit -m "Leer del fragmento qué pantalla del panel toca"
```

---

### Tarea 2: Editar las piezas de un proyecto

**Archivos:**
- Crear: `panel/js/edicion.js`, `tests/pruebas-edicion.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Edicion.portadaDe(pieza)`,
  `Edicion.indiceDePortada(proyecto)`, `Edicion.mover(proyecto, desde, hasta)`,
  `Edicion.quitar(proyecto, indice)`, `Edicion.marcarPortada(proyecto, indice)`,
  `Edicion.anadir(proyecto, piezas)`. Todas devuelven **proyecto nuevo**.
- Consume: `window.Orden.mover`.

**Por qué es lógica pura y no un detalle de la interfaz.** Aquí vive la regla
que puede corromper el contenido en silencio: **quitar la pieza que era la
portada**. Si no se recalcula, el proyecto se queda con una `portada` que apunta
a una imagen que ya no está entre sus piezas —válida para
`ReglasContenido.validar`, que sólo mira que haya `portada`—, se publica, y la
galería enseña una foto que el visor ya no tiene.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-edicion.js`:

```js
describe('Edicion.portadaDe', function () {
  prueba('usa la portada guardada si la pieza la trae', function () {
    igual(Edicion.portadaDe({ url: '/img/x-3000.jpg', portada: '/img/otra-1500.jpg' }),
          '/img/otra-1500.jpg');
  });

  /* Las 65 piezas del contenido real son {url, miniatura} y nada más: se
     subieron con herramientas/derivar_imagenes.py, antes de que el panel
     supiera subir. Para ellas la portada se deduce del sufijo. */
  prueba('deduce el -1500 del -3000 en las piezas antiguas', function () {
    igual(Edicion.portadaDe({ url: '/img/editorial-la-boquerona-esta-portada-3000.jpg' }),
          '/img/editorial-la-boquerona-esta-portada-1500.jpg');
  });

  /* Sólo el sufijo final, y sólo si está: un «-3000» en medio del nombre es
     parte del nombre, no la medida. */
  prueba('sólo sustituye el sufijo del final', function () {
    igual(Edicion.portadaDe({ url: '/img/serie-3000-metros-3000.jpg' }),
          '/img/serie-3000-metros-1500.jpg');
  });

  prueba('sin nada de donde deducir, devuelve null', function () {
    igual(Edicion.portadaDe({ url: '/img/suelta.jpg' }), null);
    igual(Edicion.portadaDe(null), null);
  });
});

describe('Edicion.indiceDePortada', function () {
  function proyecto() {
    return { portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }] };
  }

  prueba('encuentra la pieza que es la portada', function () {
    igual(Edicion.indiceDePortada(proyecto()), 1);
  });

  prueba('una portada que no es de ninguna pieza da -1', function () {
    igual(Edicion.indiceDePortada({ portada: '/img/z-1500.jpg', piezas: [] }), -1);
  });

  prueba('sin portada da -1', function () {
    igual(Edicion.indiceDePortada({ piezas: [{ url: '/img/a-3000.jpg' }] }), -1);
  });
});

describe('Edicion.mover', function () {
  function proyecto() {
    return { portada: '/img/c-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }, { url: '/img/c-3000.jpg' }] };
  }

  prueba('cambia el orden de las piezas', function () {
    igual(Edicion.mover(proyecto(), 2, 0).piezas.map(function (p) { return p.url; }),
          ['/img/c-3000.jpg', '/img/a-3000.jpg', '/img/b-3000.jpg']);
  });

  /* Mover no es elegir: la portada sigue siendo la misma fotografía aunque
     ahora esté en otro sitio. */
  prueba('la portada sigue siendo la misma foto', function () {
    igual(Edicion.mover(proyecto(), 2, 0).portada, '/img/c-1500.jpg');
  });

  prueba('no toca el proyecto que recibe', function () {
    var p = proyecto();
    Edicion.mover(p, 2, 0);
    igual(p.piezas[0].url, '/img/a-3000.jpg');
  });
});

describe('Edicion.quitar', function () {
  function proyecto() {
    return { portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/b-3000.jpg' }, { url: '/img/c-3000.jpg' }] };
  }

  prueba('quita la pieza que se le dice', function () {
    igual(Edicion.quitar(proyecto(), 0).piezas.map(function (p) { return p.url; }),
          ['/img/b-3000.jpg', '/img/c-3000.jpg']);
  });

  prueba('quitar otra no toca la portada', function () {
    igual(Edicion.quitar(proyecto(), 0).portada, '/img/b-1500.jpg');
  });

  /* El fallo que este módulo existe para impedir: sin recalcular, el proyecto
     se queda con una portada que ya no es de ninguna pieza. `validar` la da
     por buena —sólo mira que haya portada— y la web enseña una foto que el
     visor ya no tiene. */
  prueba('quitar la portada la pasa a la primera que quede', function () {
    igual(Edicion.quitar(proyecto(), 1).portada, '/img/a-1500.jpg');
  });

  prueba('quitar la última pieza deja el proyecto sin portada', function () {
    var uno = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    var r = Edicion.quitar(uno, 0);
    igual(r.piezas, []);
    igual(r.portada, null);
  });

  prueba('un índice que no existe no cambia nada', function () {
    igual(Edicion.quitar(proyecto(), 9).piezas.length, 3);
    igual(Edicion.quitar(proyecto(), -1).piezas.length, 3);
  });

  prueba('no toca el proyecto que recibe', function () {
    var p = proyecto();
    Edicion.quitar(p, 1);
    igual(p.piezas.length, 3);
  });
});

describe('Edicion.marcarPortada', function () {
  function proyecto() {
    return { portada: '/img/a-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' },
      { url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }] };
  }

  prueba('la portada pasa a ser la de esa pieza', function () {
    igual(Edicion.marcarPortada(proyecto(), 1).portada, '/img/b-1500.jpg');
  });

  prueba('un índice que no existe no cambia nada', function () {
    igual(Edicion.marcarPortada(proyecto(), 9).portada, '/img/a-1500.jpg');
  });

  /* Una pieza de la que no se puede sacar portada no se puede marcar: dejar
     `portada: null` haría impublicable el proyecto sin decir por qué. */
  prueba('una pieza sin portada deducible no se marca', function () {
    var raro = { portada: '/img/a-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg' }, { url: '/img/suelta.jpg' }] };
    igual(Edicion.marcarPortada(raro, 1).portada, '/img/a-1500.jpg');
  });
});

describe('Edicion.anadir', function () {
  prueba('añade al final', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, [{ url: '/img/b-3000.jpg' }]).piezas.length, 2);
  });

  /* La primera foto de un proyecto recién creado es su portada sin que nadie
     lo pida: un proyecto sin portada no se publica, y pedir un clic más para
     algo que no tiene alternativa sería un trámite. */
  prueba('la primera foto de un proyecto vacío se hace portada', function () {
    var p = { portada: null, piezas: [] };
    var r = Edicion.anadir(p, [{ url: '/img/a-3000.jpg', portada: '/img/a-1500.jpg' },
                               { url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }]);
    igual(r.portada, '/img/a-1500.jpg');
  });

  prueba('si ya había portada, no se cambia', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, [{ url: '/img/b-3000.jpg', portada: '/img/b-1500.jpg' }]).portada,
          '/img/a-1500.jpg');
  });

  prueba('añadir nada no cambia nada', function () {
    var p = { portada: '/img/a-1500.jpg', piezas: [{ url: '/img/a-3000.jpg' }] };
    igual(Edicion.anadir(p, []).piezas.length, 1);
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/edicion.js"></script>
```
```html
<script src="pruebas-edicion.js"></script>
```

`edicion.js` va **después** de `orden.js`, que ya está en el arnés: lo usa para
mover.

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Edicion is not defined`.

- [ ] **Paso 3: Escribe `panel/js/edicion.js`**

```js
/* Las reglas de editar las piezas de un proyecto, sin DOM y sin red. Aquí vive
   lo que puede corromper el contenido en silencio —quitar la pieza que era la
   portada—, así que aquí es donde se puede probar entero. */
window.Edicion = (function () {

  /* Las piezas que sube el panel traen su propia `portada`, que es un campo
     nuevo y aditivo. Las 65 del contenido real no la traen: se subieron con
     herramientas/derivar_imagenes.py y son {url, miniatura}. Para ésas se
     deduce del sufijo, que el script escribió con la medida del lado largo.

     Se prefiere guardarla y deducir sólo cuando falta, en vez de deducir
     siempre: deducir siempre ataría el panel a que el nombre del archivo no
     cambie nunca, y esto es compatibilidad con lo viejo, no un contrato. */
  function portadaDe(pieza) {
    if (!pieza) return null;
    if (pieza.portada) return pieza.portada;
    var url = String(pieza.url || '');
    /* Sólo el sufijo del final: un «-3000» en medio del nombre es parte del
       nombre. Sin el ancla, «serie-3000-metros-3000.jpg» se estropearía por
       el primero. */
    if (!/-3000\.jpg$/.test(url)) return null;
    return url.replace(/-3000\.jpg$/, '-1500.jpg');
  }

  function copiar(proyecto, piezas, portada) {
    var nuevo = {};
    Object.keys(proyecto).forEach(function (k) { nuevo[k] = proyecto[k]; });
    nuevo.piezas = piezas;
    nuevo.portada = portada;
    return nuevo;
  }

  function piezasDe(proyecto) {
    return (proyecto && proyecto.piezas) || [];
  }

  function enRango(piezas, indice) {
    return indice >= 0 && indice < piezas.length;
  }

  function indiceDePortada(proyecto) {
    var piezas = piezasDe(proyecto);
    var portada = proyecto && proyecto.portada;
    if (!portada) return -1;
    for (var i = 0; i < piezas.length; i++) {
      if (portadaDe(piezas[i]) === portada) return i;
    }
    return -1;
  }

  /* Mover no es elegir: la fotografía de portada sigue siendo la misma
     aunque ahora ocupe otro sitio en la rejilla. */
  function mover(proyecto, desde, hasta) {
    return copiar(proyecto, window.Orden.mover(piezasDe(proyecto), desde, hasta),
                  proyecto.portada || null);
  }

  function quitar(proyecto, indice) {
    var piezas = piezasDe(proyecto);
    if (!enRango(piezas, indice)) return copiar(proyecto, piezas.slice(), proyecto.portada || null);

    var eraLaPortada = indiceDePortada(proyecto) === indice;
    var quedan = piezas.slice(0, indice).concat(piezas.slice(indice + 1));
    if (!eraLaPortada) return copiar(proyecto, quedan, proyecto.portada || null);

    /* La portada se recalcula porque si no el proyecto se queda apuntando a
       una imagen que ya no es de ninguna de sus piezas. `validar` sólo mira
       que HAYA portada, así que eso se publica sin queja y la galería enseña
       una foto que el visor ya no tiene. */
    return copiar(proyecto, quedan, quedan.length ? portadaDe(quedan[0]) : null);
  }

  function marcarPortada(proyecto, indice) {
    var piezas = piezasDe(proyecto);
    if (!enRango(piezas, indice)) return copiar(proyecto, piezas.slice(), proyecto.portada || null);
    var nueva = portadaDe(piezas[indice]);
    /* Sin portada deducible no se marca: dejar `portada: null` volvería el
       proyecto impublicable sin decirle a nadie por qué. */
    if (!nueva) return copiar(proyecto, piezas.slice(), proyecto.portada || null);
    return copiar(proyecto, piezas.slice(), nueva);
  }

  function anadir(proyecto, nuevas) {
    var piezas = piezasDe(proyecto).concat(nuevas || []);
    var portada = proyecto.portada || null;
    /* La primera foto de un proyecto vacío se hace portada sola: sin portada
       no se publica, y no hay ninguna otra candidata que elegir. */
    if (!portada && piezas.length) portada = portadaDe(piezas[0]);
    return copiar(proyecto, piezas, portada);
  }

  return { portadaDe: portadaDe, indiceDePortada: indiceDePortada,
           mover: mover, quitar: quitar, marcarPortada: marcarPortada,
           anadir: anadir };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **veintitrés** nuevas en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/edicion.js tests/
git commit -m "Mover, quitar y elegir portada sin dejar el proyecto apuntando a una foto que ya no está"
```

---

### Tarea 3: Reducir la fotografía en el navegador

**Archivos:**
- Crear: `panel/js/imagenes.js`, `tests/pruebas-imagenes.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Imagenes.MEDIDAS`, `Imagenes.CALIDAD`,
  `Imagenes.caber(ancho, alto, cota)` → `{ancho, alto}`,
  `Imagenes.reducir(archivo, cota, alTerminar)` → `alTerminar(blob, error)`.
- Consume: nada.

**Por qué importa.** Es el criterio de aceptación 7 entero: ninguna imagen
supera su cota y ninguna sale deformada. `caber` es donde vive esa aritmética, y
es pura, así que se prueba sin cargar ni una foto.

`reducir` sí necesita el navegador (`createImageBitmap`, `canvas.toBlob`) y se
prueba con un PNG diminuto en un `data:` URI, que es una fotografía de verdad
por lo que a esta función respecta.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-imagenes.js`:

```js
describe('Imagenes.caber', function () {
  /* Por el LADO LARGO, no por el alto: una foto apaisada y una vertical caben
     las dos en su cota, y ninguna se deforma. Criterio de aceptación 7. */
  prueba('una vertical se mide por su alto', function () {
    igual(Imagenes.caber(2000, 4000, 1000), { ancho: 500, alto: 1000 });
  });

  prueba('una apaisada se mide por su ancho', function () {
    igual(Imagenes.caber(4000, 2000, 1000), { ancho: 1000, alto: 500 });
  });

  prueba('una cuadrada cabe justa', function () {
    igual(Imagenes.caber(3000, 3000, 1000), { ancho: 1000, alto: 1000 });
  });

  /* Ampliar sería inventar píxeles: una miniatura subida por error saldría
     borrosa y pesando más que el original. */
  prueba('lo que ya cabe no se toca', function () {
    igual(Imagenes.caber(400, 300, 1000), { ancho: 400, alto: 300 });
  });

  /* Un canvas de 0 px lanza en varios navegadores, y una foto muy apaisada
     —un panorama de 8000x120 reducido a 250— da exactamente eso al redondear
     hacia abajo. El lado corto se queda en 1, que es feo pero es una imagen. */
  prueba('ningún lado baja de un píxel', function () {
    igual(Imagenes.caber(8000, 120, 250), { ancho: 250, alto: 4 });
    igual(Imagenes.caber(8000, 10, 250), { ancho: 250, alto: 1 });
  });

  prueba('medidas imposibles no devuelven NaN', function () {
    igual(Imagenes.caber(0, 0, 1000), { ancho: 1, alto: 1 });
  });
});

describe('Imagenes.MEDIDAS', function () {
  /* Las mismas tres de herramientas/derivar_imagenes.py. Lo que sube el panel
     tiene que ser indistinguible de lo que subió el script: si no, la web
     tendría dos clases de fotografía según quién la puso. */
  prueba('son las tres del script, con su sufijo', function () {
    igual(Imagenes.MEDIDAS, [
      { nombre: 'portada',   cota: 1500, sufijo: '1500' },
      { nombre: 'pieza',     cota: 3000, sufijo: '3000' },
      { nombre: 'miniatura', cota: 250,  sufijo: '250' }
    ]);
  });

  prueba('la calidad es la del script', function () {
    igual(Imagenes.CALIDAD, 0.82);
  });
});

/* `reducir` necesita el navegador de verdad: createImageBitmap y toBlob. Se le
   da un PNG de 4x2 en un data: URI, que para esta función es una fotografía
   como cualquier otra. */
describeAsync('Imagenes.reducir', function () {
  /* 4x2 rojo. Apaisado a propósito: así la reducción tiene que elegir el
     ancho como lado largo, y una implementación que mirase siempre el alto
     daría medidas distintas. */
  var PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGP4z8AARwzIHABvqgf5gNwAKAAAAABJRU5ErkJggg==';

  function comoArchivo() {
    return fetch(PNG).then(function (r) { return r.blob(); });
  }

  function reducido(cota) {
    return comoArchivo().then(function (blob) {
      return new Promise(function (ok, mal) {
        Imagenes.reducir(blob, cota, function (salida, error) {
          if (error) return mal(new Error(error));
          ok(salida);
        });
      });
    });
  }

  /* Se mide el resultado volviendo a decodificarlo: comprobar que `reducir`
     llamó a toBlob con los números correctos sería probar el doble. */
  function medir(blob) {
    return createImageBitmap(blob).then(function (mapa) {
      return { ancho: mapa.width, alto: mapa.height };
    });
  }

  return reducido(2).then(function (salida) {
    prueba('devuelve un JPEG', function () {
      igual(salida.type, 'image/jpeg');
    });
    return medir(salida);
  }).then(function (medida) {
    prueba('reduce por el lado largo y conserva la proporción', function () {
      igual(medida, { ancho: 2, alto: 1 });
    });
    return reducido(100);
  }).then(medir).then(function (medida) {
    prueba('una foto que ya cabe no se amplía', function () {
      igual(medida, { ancho: 4, alto: 2 });
    });
  }).then(function () {
    return new Promise(function (ok) {
      /* Un archivo que no es una imagen tiene que salir por el camino del
         error y en castellano, no como excepción suelta: quien sube diez
         fotos y una está corrupta necesita saber cuál. */
      Imagenes.reducir(new Blob(['esto no es una foto']), 100, function (salida, error) {
        prueba('un archivo que no es imagen da error en castellano', function () {
          igual(salida, null);
          cierto(error && error.indexOf('imagen') !== -1);
        });
        ok();
      });
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/imagenes.js"></script>
```
```html
<script src="pruebas-imagenes.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Imagenes is not defined`.

- [ ] **Paso 3: Escribe `panel/js/imagenes.js`**

```js
/* Reducir la fotografía ANTES de subirla. Un original ronda entre 20 y 50 MB;
   lo que sale de aquí no llega al megabyte. Así no hay procesado de imagen en
   el servidor ni subidas de 50 MB desde una conexión doméstica. */
window.Imagenes = (function () {

  /* Las mismas tres medidas y la misma calidad que
     herramientas/derivar_imagenes.py, que fue quien generó las 65 piezas del
     contenido real. Lo que suba el panel tiene que ser indistinguible de
     aquello: si no, la web tendría dos clases de fotografía según quién la
     puso. El sufijo es lo que acaba en el nombre del archivo, y es de lo que
     Edicion.portadaDe deduce la portada de las piezas antiguas. */
  var MEDIDAS = [
    { nombre: 'portada',   cota: 1500, sufijo: '1500' },
    { nombre: 'pieza',     cota: 3000, sufijo: '3000' },
    { nombre: 'miniatura', cota: 250,  sufijo: '250' }
  ];
  var CALIDAD = 0.82;

  /* La cota es del LADO LARGO, no del alto. Una foto apaisada y una vertical
     caben las dos sin deformarse, que es el criterio de aceptación 7: «la
     proporción original se conserva siempre». */
  function caber(ancho, alto, cota) {
    var a = Number(ancho) > 0 ? Number(ancho) : 1;
    var b = Number(alto) > 0 ? Number(alto) : 1;
    var largo = Math.max(a, b);
    /* Ampliar sería inventar píxeles: una foto pequeña saldría borrosa y
       pesando más que el original. */
    var factor = largo <= cota ? 1 : cota / largo;
    return {
      /* Nunca por debajo de 1: un canvas de 0 px lanza en varios navegadores,
         y un panorama de 8000x120 reducido a 250 da exactamente eso. */
      ancho: Math.max(1, Math.round(a * factor)),
      alto: Math.max(1, Math.round(b * factor))
    };
  }

  /* `imageOrientation: 'from-image'` no es un adorno: sin él, una foto hecha
     con el móvil de lado —que lleva su orientación en los metadatos EXIF y no
     en los píxeles— se sube tumbada, y el panel no tiene ninguna pantalla
     donde girarla. Con él, el mapa de bits llega ya derecho y el canvas
     escribe lo que se ve. */
  function reducir(archivo, cota, alTerminar) {
    var listo = false;
    function terminar(blob, error) {
      if (listo) return;
      listo = true;
      alTerminar(blob, error);
    }

    /* Lo que se le enseña al estudio lo escribimos nosotros, igual que en
       borrador.js: `e.message` aquí es del motor y en inglés. El detalle
       técnico se queda en el registro, que es donde sirve. */
    function fallar(que, e) {
      console.error('Imagenes: ' + que + (e && e.message ? ': ' + e.message : ''));
      terminar(null, 'no se ha podido leer «' + (archivo.name || 'la imagen')
        + '»: puede que no sea una imagen o que esté dañada');
    }

    var promesa;
    try {
      promesa = createImageBitmap(archivo, { imageOrientation: 'from-image' });
    } catch (e) {
      return fallar('createImageBitmap lanzó al llamarla', e);
    }

    promesa.then(function (mapa) {
      var medida = caber(mapa.width, mapa.height, cota);
      var lienzo = document.createElement('canvas');
      lienzo.width = medida.ancho;
      lienzo.height = medida.alto;
      lienzo.getContext('2d').drawImage(mapa, 0, 0, medida.ancho, medida.alto);
      /* close() libera el mapa de bits en cuanto está dibujado. Subir treinta
         fotos de 50 MB sin soltarlos deja al navegador quedándose sin memoria
         a la mitad, y eso se ve como una subida que se para sin decir nada. */
      if (mapa.close) mapa.close();
      lienzo.toBlob(function (blob) {
        if (!blob) return fallar('toBlob devolvió null', null);
        terminar(blob, null);
      }, 'image/jpeg', CALIDAD);
    }, function (e) {
      fallar('createImageBitmap rechazó', e);
    });
  }

  return { MEDIDAS: MEDIDAS, CALIDAD: CALIDAD, caber: caber, reducir: reducir };
})();
```

**Sobre `createImageBitmap` y ES5:** es una función del entorno, no sintaxis, así
que no rompe la restricción. La soportan todos los navegadores que este proyecto
contempla; el panel, además, lo usan dos personas con navegador actual.

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **doce** nuevas en verde (ocho síncronas y cuatro de la sección
asíncrona).

- [ ] **Paso 5: Commit**

```bash
git add panel/js/imagenes.js tests/
git commit -m "Reducir la foto en el navegador a las tres medidas del script, sin deformarla"
```

---

### Tarea 4: Subir las tres medidas

**Archivos:**
- Crear: `panel/js/subida.js`, `tests/pruebas-subida.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Subida.sello()`, `Subida.nombre(id, archivo, sufijo, sello)`,
  `Subida.subir(id, archivos, alProgreso, alTerminar)` →
  `alTerminar({piezas, fallos})`.
- Consume: `window.Imagenes`, `window.Identificador.desde`.

**Por qué importa.** Es el criterio de aceptación 10: si una subida de varias
falla, las demás se completan y el panel dice cuál falló. Y es donde vive el
sello del nombre, que es lo que impide el 409 del Worker.

**Cómo se prueba.** Este módulo habla por red, así que se prueba en el arnés del
navegador **doblando `fetch` dentro del iframe** de `ArnesDom.conDocumento`, no
con Node. Doblar `fetch` y no `Subida` entera es el mismo criterio que usa
`pruebas-panel.js`: se dobla lo que sale de la aplicación, no sus propias piezas.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-subida.js`:

```js
describe('Subida.nombre', function () {
  prueba('junta id, archivo saneado, sello y medida', function () {
    igual(Subida.nombre('bruma', { name: 'Portada Final.JPG' }, '3000', 'm8q3x1'),
          'bruma-portada-final-m8q3x1-3000.jpg');
  });

  /* El nombre viaja a R2 como llave, y `nombreSeguro` del Worker lo volvería
     a sanear. Se sanea aquí para que lo que el panel cree haber subido y lo
     que R2 guarde sean la misma cadena: si no, la url que el panel se apunta
     en la pieza no sería la que responde. */
  prueba('los acentos y los espacios no llegan a R2', function () {
    igual(Subida.nombre('bruma', { name: 'Sesión de Otoño.jpeg' }, '250', 'ab12'),
          'bruma-sesion-de-otono-ab12-250.jpg');
  });

  /* Sin nombre utilizable queda un hueco entre guiones; «foto» lo llena para
     que la llave no acabe con dos guiones seguidos y siga siendo legible al
     mirar el bucket. */
  prueba('un archivo sin nombre aprovechable se llama foto', function () {
    igual(Subida.nombre('bruma', { name: '¿?.jpg' }, '3000', 'ab12'),
          'bruma-foto-ab12-3000.jpg');
    igual(Subida.nombre('bruma', {}, '3000', 'ab12'), 'bruma-foto-ab12-3000.jpg');
  });

  /* El Worker rechaza con 400 los nombres de más de 200 caracteres. Un
     nombre de archivo largo es normal al exportar por lotes, y morir en un
     400 opaco por eso sería desconcertante. */
  prueba('un nombre larguísimo se recorta', function () {
    var largo = { name: new Array(400).join('a') + '.jpg' };
    cierto(Subida.nombre('bruma', largo, '3000', 'ab12').length <= 200);
  });
});

describe('Subida.sello', function () {
  prueba('es corto y sólo lleva letras y números', function () {
    var s = Subida.sello();
    cierto(/^[a-z0-9]+$/.test(s), 'el sello era «' + s + '»');
    cierto(s.length <= 16);
  });

  /* No es criptográfico ni falta: sólo tiene que evitar que dos subidas del
     mismo estudio choquen. Mil seguidos sin repetir es de sobra para eso. */
  prueba('mil seguidos no se repiten', function () {
    var vistos = {}, i, s;
    for (i = 0; i < 1000; i++) {
      s = Subida.sello();
      cierto(!vistos[s], 'el sello «' + s + '» salió dos veces');
      vistos[s] = true;
    }
  });
});

/* `subir` habla por red, así que se carga dentro de un iframe con `fetch`
   doblado. Se dobla `fetch` y no `Imagenes`: probar la subida contra un doble
   de nuestra propia reducción comprobaría el doble. */
describeAsync('Subida.subir', function () {
  var MODULOS = ['../panel/js/identificador.js', '../panel/js/imagenes.js',
                 '../panel/js/subida.js'];

  /* 4x2 rojo, el mismo de pruebas-imagenes.js. */
  var PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGP4z8AARwzIHABvqgf5gNwAKAAAAABJRU5ErkJggg==';

  function unaFoto(nombre) {
    return fetch(PNG).then(function (r) { return r.blob(); }).then(function (b) {
      /* Un Blob con `name` encima, en vez de un File: el constructor de File
         no está en todos los navegadores donde sí está Blob, y a `subir` sólo
         le hace falta el nombre. */
      b.name = nombre;
      return b;
    });
  }

  /* El doble de fetch. Apunta lo que se le pide y contesta lo que la prueba
     diga; por omisión, 200 con la url que el Worker devolvería. */
  function redFalsa(respuestas) {
    var llamadas = [];
    function doble(url) {
      var nombre = new URL(url, 'https://x/').searchParams.get('nombre');
      llamadas.push(nombre);
      var r = (respuestas || {})[llamadas.length] || { estado: 200 };
      if (r.corte) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        status: r.estado,
        text: function () {
          return Promise.resolve(JSON.stringify(
            r.estado === 200 ? { url: '/img/' + nombre } : { error: r.error || 'no' }));
        }
      });
    }
    doble.llamadas = llamadas;
    return doble;
  }

  function conRed(doble, fn) {
    return ArnesDom.conDocumento({ scripts: MODULOS, globales: { fetch: doble } },
      function (w) { return fn(w); });
  }

  function subir(w, archivos) {
    return new Promise(function (ok) {
      w.Subida.subir('bruma', archivos, function () {}, ok);
    });
  }

  return unaFoto('a.jpg').then(function (foto) {
    var red = redFalsa();
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        prueba('una foto son tres subidas: portada, pieza y miniatura', function () {
          igual(red.llamadas.length, 3);
        });

        prueba('la pieza apunta a las tres urls', function () {
          igual(r.piezas.length, 1);
          cierto(/-3000\.jpg$/.test(r.piezas[0].url), r.piezas[0].url);
          cierto(/-250\.jpg$/.test(r.piezas[0].miniatura), r.piezas[0].miniatura);
          cierto(/-1500\.jpg$/.test(r.piezas[0].portada), r.piezas[0].portada);
        });

        /* Las tres medidas de una misma foto comparten sello: si no, no se
           podría saber mirando el bucket qué tres archivos son la misma
           fotografía. */
        prueba('las tres medidas comparten sello', function () {
          var sellos = red.llamadas.map(function (n) {
            return n.replace(/-(?:1500|3000|250)\.jpg$/, '');
          });
          igual(sellos[0], sellos[1]);
          igual(sellos[1], sellos[2]);
        });

        prueba('sin fallos, la lista de fallos viene vacía', function () {
          igual(r.fallos, []);
        });
      });
    });
  }).then(function () {
    return Promise.all([unaFoto('a.jpg'), unaFoto('b.jpg')]);
  }).then(function (fotos) {
    /* La cuarta llamada es la primera medida de la segunda foto. Criterio de
       aceptación 10: la primera se completa y el panel dice cuál falló. */
    var red = redFalsa({ 4: { estado: 413, error: 'la imagen supera el tamaño máximo de 5 MB' } });
    return conRed(red, function (w) {
      return subir(w, fotos).then(function (r) {
        prueba('una subida que falla no arrastra a las demás', function () {
          igual(r.piezas.length, 1);
          igual(r.fallos.length, 1);
        });

        prueba('el fallo dice de qué archivo es y por qué', function () {
          igual(r.fallos[0].archivo, 'b.jpg');
          cierto(r.fallos[0].motivo.indexOf('5 MB') !== -1, r.fallos[0].motivo);
        });

        /* Una foto a medias no se apunta: si la pieza entrara con dos de sus
           tres urls, la galería o el visor pedirían un archivo que no está. */
        prueba('de la foto que falló no queda ninguna pieza', function () {
          cierto(r.piezas[0].url.indexOf('-a-') !== -1, r.piezas[0].url);
        });
      });
    });
  }).then(function () {
    return unaFoto('a.jpg');
  }).then(function (foto) {
    /* El 409 del Worker es «esa llave ya existe». La salida es otro sello, no
       rendirse: el Worker nunca pisa, así que el panel tiene que apartarse. */
    var red = redFalsa({ 1: { estado: 409, error: 'ya hay una imagen guardada' } });
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        prueba('un 409 se reintenta con otro sello y acaba entrando', function () {
          igual(r.fallos, []);
          igual(r.piezas.length, 1);
          cierto(red.llamadas.length === 4, 'llamadas: ' + red.llamadas.length);
          cierto(red.llamadas[0] !== red.llamadas[1], 'el sello no cambió');
        });
      });
    });
  }).then(function () {
    return unaFoto('a.jpg');
  }).then(function (foto) {
    var red = redFalsa({ 1: { corte: true } });
    return conRed(red, function (w) {
      return subir(w, [foto]).then(function (r) {
        /* La red caída y la sesión caducada son indistinguibles desde aquí,
           igual que en borrador.js: lo que llega es el mismo TypeError. El
           mensaje nombra las dos y pone primero la acción que arregla la
           frecuente. */
        prueba('la red caída sale como fallo en castellano, no como excepción', function () {
          igual(r.piezas, []);
          igual(r.fallos.length, 1);
          cierto(r.fallos[0].motivo.indexOf('sesión') !== -1, r.fallos[0].motivo);
        });
      });
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/subida.js"></script>
```
```html
<script src="pruebas-subida.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Subida is not defined`.

- [ ] **Paso 3: Escribe `panel/js/subida.js`**

```js
/* Sube una fotografía en sus tres medidas. Reducir es de `imagenes.js`; aquí
   está el nombre que va a R2, el orden de las subidas y qué se hace cuando una
   falla. */
window.Subida = (function () {
  var RUTA = '/api/imagen';
  /* El Worker rechaza con 400 los nombres de más de 200 caracteres, y el
     nombre del archivo es sólo una parte de la llave. Este tope deja sitio de
     sobra para el id, el sello y el sufijo. */
  var TOPE_ARCHIVO = 120;
  /* Un 409 es «esa llave ya existe». Dos intentos más con sello nuevo es de
     sobra —el sello lleva la hora dentro— y pone un final a la recursión. */
  var REINTENTOS = 2;

  /* No es criptográfico ni falta: sólo tiene que evitar que dos subidas del
     mismo estudio choquen en la misma llave. La hora da el grueso y el azar
     separa dos subidas del mismo milisegundo. */
  function sello() {
    return Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  }

  function sinExtension(nombre) {
    var punto = String(nombre).lastIndexOf('.');
    return punto <= 0 ? String(nombre) : String(nombre).slice(0, punto);
  }

  /* Se sanea aquí, con el mismo `Identificador.desde` que saca el id de un
     título, para que lo que el panel cree haber subido y lo que R2 guarde sean
     la misma cadena. El Worker vuelve a sanear por su cuenta —no se fía del
     cliente, y hace bien—, pero si el panel mandara algo que el Worker
     transforma, la url que se apunta en la pieza no sería la que responde. */
  function nombre(id, archivo, sufijo, elSello) {
    var base = window.Identificador.desde(sinExtension((archivo && archivo.name) || ''));
    if (!base) base = 'foto';
    if (base.length > TOPE_ARCHIVO) base = base.slice(0, TOPE_ARCHIVO).replace(/-+$/, '');
    return id + '-' + base + '-' + elSello + '-' + sufijo + '.jpg';
  }

  /* Mismo reparto que borrador.js: mensaje nuestro y en castellano para quien
     sube, detalle del motor en el registro. Y la misma advertencia — la sesión
     caducada y la red caída llegan aquí como el MISMO TypeError, porque Access
     redirige a otro origen y el navegador corta la redirección sin CORS. Por
     eso el mensaje nombra las dos y pone primero la que se arregla. */
  var SIN_RED = 'no se pudo contactar con el servidor. Puede que la sesión haya '
              + 'caducado: vuelve a entrar en otra pestaña. Si sigue igual, revisa la conexión';

  function mandar(llave, blob) {
    return fetch(RUTA + '?nombre=' + encodeURIComponent(llave), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'image/jpeg' },
      body: blob
    }).then(function (r) {
      return r.text().then(function (texto) {
        var cuerpo;
        try {
          cuerpo = JSON.parse(texto);
        } catch (e) {
          console.error('Subida: el servidor respondió ' + r.status
            + ' con algo que no es JSON: ' + String(texto).slice(0, 200));
          throw { estado: r.status, motivo: 'la sesión ha caducado: vuelve a entrar' };
        }
        if (r.status === 200) return cuerpo.url;
        throw { estado: r.status, motivo: cuerpo.error || ('el servidor respondió ' + r.status) };
      });
    }, function (e) {
      console.error('Subida: la petición no llegó a completarse: ' + (e && e.message));
      throw { estado: 0, motivo: SIN_RED };
    });
  }

  /* Las tres medidas de una foto se suben con el MISMO sello: así, mirando el
     bucket, se sabe qué tres archivos son la misma fotografía. Un 409 en
     cualquiera de las tres reintenta las tres con sello nuevo, y no sólo la
     que chocó, justamente para no romper eso. */
  function unaFoto(id, archivo, elSello, quedan) {
    var urls = {};
    var cadena = window.Imagenes.MEDIDAS.reduce(function (antes, medida) {
      return antes.then(function () {
        return new Promise(function (ok, mal) {
          window.Imagenes.reducir(archivo, medida.cota, function (blob, error) {
            if (error) return mal({ estado: 0, motivo: error });
            ok(blob);
          });
        });
      }).then(function (blob) {
        return mandar(nombre(id, archivo, medida.sufijo, elSello), blob);
      }).then(function (url) {
        urls[medida.nombre] = url;
      });
    }, Promise.resolve());

    return cadena.then(function () {
      return { url: urls.pieza, miniatura: urls.miniatura, portada: urls.portada };
    }, function (fallo) {
      /* El Worker nunca pisa una llave que ya existe: contesta 409. La salida
         no es rendirse sino apartarse, que es para lo que existe el sello. */
      if (fallo && fallo.estado === 409 && quedan > 0) {
        return unaFoto(id, archivo, sello(), quedan - 1);
      }
      throw fallo;
    });
  }

  /* Una a una y no todas a la vez: treinta fotos en paralelo son treinta
     mapas de bits de 50 MB descodificados a la vez, y el navegador se queda
     sin memoria a la mitad. En serie, cada una se libera antes de la
     siguiente. La contrapartida es que tarda más, y por eso hay `alProgreso`.

     Criterio de aceptación 10: una que falla no arrastra a las demás. */
  function subir(id, archivos, alProgreso, alTerminar) {
    var lista = Array.prototype.slice.call(archivos || []);
    var piezas = [];
    var fallos = [];

    lista.reduce(function (antes, archivo, i) {
      return antes.then(function () {
        alProgreso({ hecho: i, total: lista.length, archivo: archivo.name || '' });
        return unaFoto(id, archivo, sello(), REINTENTOS).then(function (pieza) {
          piezas.push(pieza);
        }, function (fallo) {
          /* De una foto a medias no se apunta nada: una pieza con dos de sus
             tres urls haría que la galería o el visor pidieran un archivo que
             no está en el bucket. */
          fallos.push({ archivo: archivo.name || 'una foto',
                        motivo: (fallo && fallo.motivo) || 'no se pudo subir' });
        });
      });
    }, Promise.resolve()).then(function () {
      alProgreso({ hecho: lista.length, total: lista.length, archivo: '' });
      alTerminar({ piezas: piezas, fallos: fallos });
    });
  }

  return { subir: subir, nombre: nombre, sello: sello, RUTA: RUTA };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **quince** nuevas en verde (seis síncronas y nueve de la sección
asíncrona). Esta sección **necesita servidor**: `conDocumento` carga scripts en
un iframe.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/subida.js tests/
git commit -m "Subir las tres medidas con sello propio, y que una que falla no arrastre a las demás"
```

---

### Tarea 5: `enfocarTrasRepintar` se muda a `Lista.enfocar`

**Archivos:**
- Modificar: `panel/js/lista.js`, `panel/js/panel.js`, `tests/pruebas-lista.js`

**Interfaces:**
- Produce: `window.Lista.enfocar(contenedor, foco)`.
- Consume: nada.

**Por qué esta tarea existe.** `panel.js` va por 209 líneas de 300, y las tareas
7 y 8 le añaden el arranque de tres pantallas. `enfocarTrasRepintar` son 17
líneas que además **no son del arranque**: saben del marcado de una fila
—`[data-id]`, `[data-accion]`—, que es cosa de `lista.js`. Están en `panel.js`
por cómo creció el 3b, no porque sea su sitio.

Se mueve **antes** de que haga falta, no después: mudar código con el archivo ya
desbordado obliga a hacer dos cosas a la vez y a no saber cuál rompió qué.

Es una mudanza, no un cambio: el comportamiento tiene que quedar idéntico, y las
28 pruebas de `pruebas-panel.js` que lo ejercitan a través del panel son las que
lo comprueban. No se tocan.

- [ ] **Paso 1: La prueba que falla**

Añade a `tests/pruebas-lista.js`, en una sección nueva:

```js
/* `enfocar` vivía en panel.js hasta el bloque 3c. Se muda aquí porque sabe del
   marcado de una fila —[data-id], [data-accion]—, que es de este archivo, y
   porque panel.js necesita el sitio para el arranque de tres pantallas.
   Estas pruebas son nuevas: antes sólo se ejercitaba a través del panel
   entero, en pruebas-panel.js, que sigue comprobando lo mismo desde fuera. */
describe('Lista.enfocar', function () {
  var HTML =
    '<ol>' +
    '<li data-id="uno"><button data-accion="subir" disabled>↑</button>' +
    '<button data-accion="bajar">↓</button><button data-accion="borrar">Borrar</button></li>' +
    '<li data-id="dos"><button data-accion="subir">↑</button>' +
    '<button data-accion="bajar" disabled>↓</button><button data-accion="borrar">Borrar</button></li>' +
    '</ol>';

  function conLista(fn) {
    return ArnesDom.conElemento(HTML, function (ol) { return fn(ol); });
  }

  prueba('sin foco no mueve nada', function () {
    conLista(function (ol) {
      Lista.enfocar(ol, null);
      igual(document.activeElement.tagName, 'BODY');
    });
  });

  prueba('enfoca el botón que se le pide', function () {
    conLista(function (ol) {
      Lista.enfocar(ol, { id: 'uno', accion: 'borrar' });
      igual(document.activeElement.dataset.accion, 'borrar');
    });
  });

  /* El botón que se acaba de pulsar suele quedar deshabilitado justo después
     —subir en la primera fila, bajar en la última—, y el foco iría a <body>.
     El otro botón de la misma fila sigue siendo útil y está al lado. */
  prueba('si el botón quedó deshabilitado, usa el otro de la fila', function () {
    conLista(function (ol) {
      Lista.enfocar(ol, { id: 'uno', accion: 'subir' });
      igual(document.activeElement.dataset.accion, 'bajar');
    });
  });

  prueba('una fila que ya no existe no revienta', function () {
    conLista(function (ol) {
      Lista.enfocar(ol, { id: 'fantasma', accion: 'subir' });
      igual(document.activeElement.tagName, 'BODY');
    });
  });
});
```

Y una sección más para lo que `panel.js` conserva:

```js
/* `{titulo: true}` NO se muda: es del formulario del panel, no de la lista, y
   `enfocar` no tiene por qué saber que existe un campo de título. panel.js lo
   resuelve antes de llamar. Se comprueba desde fuera en pruebas-panel.js, con
   la prueba «el foco va al título cuando la lista se queda vacía». */
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Lista.enfocar is not a function`.

- [ ] **Paso 3: Muda el código**

En `panel/js/lista.js`, añade antes de `pintar`:

```js
  /* Tras un repintado los nodos del <ol> son todos nuevos —`pintar` hace
     innerHTML = '' y reconstruye—, así que el elemento que tenía el foco ya no
     existe y el navegador lo manda a <body>. Lo único que sobrevive es el `id`
     del proyecto, así que es lo que se usa para saber dónde debe volver.

     `foco` es `{ id, accion }`, con accion 'subir' | 'bajar' | 'borrar'. Si ese
     botón ha quedado deshabilitado por llegar al extremo —subir en la primera
     fila, bajar en la última—, se usa el otro de la misma fila, que sigue
     siendo útil.

     Vivía en panel.js hasta el bloque 3c. Se mudó aquí porque lo que sabe es
     el marcado de una fila, que lo escribe este archivo, y porque panel.js
     necesitaba el sitio. */
  function enfocar(contenedor, foco) {
    if (!foco || !foco.id) return;
    var fila = contenedor.querySelector('[data-id="' + foco.id + '"]');
    if (!fila) return;
    var boton = fila.querySelector('[data-accion="' + foco.accion + '"]');
    if (boton && !boton.disabled) {
      boton.focus();
      return;
    }
    var otraAccion = foco.accion === 'subir' ? 'bajar' : 'subir';
    var alternativo = fila.querySelector('[data-accion="' + otraAccion + '"]');
    if (alternativo) alternativo.focus();
  }
```

Añádela al objeto que devuelve el módulo:

```js
  return { pintar: pintar, enfocar: enfocar, ETIQUETAS: ETIQUETAS,
           indiceValido: indiceValido, calcularHasta: calcularHasta,
           dentroDeLaCaja: dentroDeLaCaja };
```

En `panel/js/panel.js`, borra `enfocarTrasRepintar` entera y déjala en:

```js
  /* El caso del título se resuelve aquí y no en Lista.enfocar: es del
     formulario de este archivo, y la lista no tiene por qué saber que existe
     un campo de título. Lo demás es de la lista y vive con ella. */
  function enfocarTrasRepintar(foco) {
    if (!foco) return;
    if (foco.titulo) {
      elTitulo.focus();
      return;
    }
    window.Lista.enfocar(elLista, foco);
  }
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **cuatro** nuevas en verde y, sobre todo, **las 21 de
`pruebas-panel.js` intactas**. Si alguna de ésas cae, la mudanza cambió algo:
vuelve atrás antes de seguir.

Comprueba también el recuento de líneas:

```bash
wc -l panel/js/lista.js panel/js/panel.js
```

Ninguno pasa de 300.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/lista.js panel/js/panel.js tests/
git commit -m "Mudar el foco tras repintar a lista.js, que es quien sabe del marcado de una fila"
```

---

### Tarea 6: La rejilla de fotos

**Archivos:**
- Crear: `panel/js/fotos.js`, `tests/pruebas-fotos.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Fotos.pintar(contenedor, proyecto, acciones)` con
  `acciones = { alMover, alQuitar, alMarcarPortada }`;
  `window.Fotos.enfocar(contenedor, foco)`.
- Consume: `window.Edicion.portadaDe`, `window.Edicion.indiceDePortada`,
  `window.Lista.calcularHasta`, `window.Lista.indiceValido`.

**Por qué reutiliza la aritmética de `lista.js`.** `calcularHasta` e
`indiceValido` resuelven exactamente el mismo problema aquí: traducir «soltar
sobre esta celda, antes o después» a un índice, y no dejar pasar un NaN a
`Orden.mover`. Están expuestas desde el 3b **para poder probarlas**, y
escribirlas otra vez sería tener dos aritméticas que se separan.

Lo que sí cambia es la geometría: la lista es vertical y decide por la mitad de
alto; la rejilla es bidimensional y decide por la mitad de **ancho**.

**Accesibilidad.** Cada foto lleva sus cuatro botones —anterior, siguiente,
portada, quitar—, y el arrastre es el atajo. Criterio de aceptación 6.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-fotos.js`:

```js
describe('Fotos.pintar', function () {
  function proyecto() {
    return { id: 'bruma', portada: '/img/b-1500.jpg', piezas: [
      { url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg', portada: '/img/a-1500.jpg' },
      { url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg', portada: '/img/b-1500.jpg' },
      { url: '/img/c-3000.jpg', miniatura: '/img/c-250.jpg', portada: '/img/c-1500.jpg' }
    ] };
  }

  function nada() { return { alMover: function () {}, alQuitar: function () {},
                             alMarcarPortada: function () {} }; }

  function conRejilla(fn, acciones) {
    return ArnesDom.conElemento('<ol></ol>', function (ol) {
      Fotos.pintar(ol, proyecto(), acciones || nada());
      return fn(ol);
    });
  }

  prueba('una celda por pieza', function () {
    conRejilla(function (ol) { igual(ol.children.length, 3); });
  });

  /* La miniatura y no la pieza: la rejilla enseña varias a la vez, y pedir
     ahí los 3000 px costaría un megabyte por foto para verla a 120. Es el
     mismo motivo por el que la tira del visor tiene su propia medida. */
  prueba('cada celda enseña la miniatura, no la pieza', function () {
    conRejilla(function (ol) {
      igual(ol.querySelector('img').getAttribute('src'), '/img/a-250.jpg');
    });
  });

  /* Sin texto alternativo, un lector de pantalla lee la url. Con el número,
     al menos se sabe cuál de las tres es. */
  prueba('cada imagen dice qué número de foto es', function () {
    conRejilla(function (ol) {
      igual(ol.querySelector('img').getAttribute('alt'), 'Foto 1 de 3');
    });
  });

  prueba('la celda de la portada se marca', function () {
    conRejilla(function (ol) {
      igual(ol.children[1].classList.contains('celda--portada'), true);
      igual(ol.children[0].classList.contains('celda--portada'), false);
    });
  });

  /* Criterio de aceptación 6: todo lo que se hace arrastrando se hace con
     teclado. Cuatro botones por celda, y todos con etiqueta. */
  prueba('cada celda trae sus cuatro botones', function () {
    conRejilla(function (ol) {
      var acciones = Array.prototype.map.call(
        ol.children[0].querySelectorAll('button'),
        function (b) { return b.dataset.accion; });
      igual(acciones, ['anterior', 'siguiente', 'portada', 'quitar']);
    });
  });

  prueba('los botones dicen de qué foto son', function () {
    conRejilla(function (ol) {
      igual(ol.children[0].querySelector('[data-accion="quitar"]')
        .getAttribute('aria-label'), 'Quitar la foto 1');
    });
  });

  prueba('la primera no puede ir hacia atrás y la última hacia delante', function () {
    conRejilla(function (ol) {
      igual(ol.children[0].querySelector('[data-accion="anterior"]').disabled, true);
      igual(ol.children[2].querySelector('[data-accion="siguiente"]').disabled, true);
      igual(ol.children[1].querySelector('[data-accion="anterior"]').disabled, false);
    });
  });

  /* Marcar como portada la que ya lo es no hace nada, y un botón que no hace
     nada tiene que decirlo antes de que lo pulsen. */
  prueba('la portada no se puede volver a marcar', function () {
    conRejilla(function (ol) {
      igual(ol.children[1].querySelector('[data-accion="portada"]').disabled, true);
      igual(ol.children[0].querySelector('[data-accion="portada"]').disabled, false);
    });
  });

  prueba('los botones de mover llaman con los dos índices', function () {
    var movidos = [];
    conRejilla(function (ol) {
      ol.children[1].querySelector('[data-accion="siguiente"]').click();
      igual(movidos, [[1, 2]]);
    }, { alMover: function (d, h) { movidos.push([d, h]); },
         alQuitar: function () {}, alMarcarPortada: function () {} });
  });

  prueba('quitar llama con el índice', function () {
    var quitados = [];
    conRejilla(function (ol) {
      ol.children[2].querySelector('[data-accion="quitar"]').click();
      igual(quitados, [2]);
    }, { alMover: function () {}, alQuitar: function (i) { quitados.push(i); },
         alMarcarPortada: function () {} });
  });

  prueba('marcar portada llama con el índice', function () {
    var marcados = [];
    conRejilla(function (ol) {
      ol.children[0].querySelector('[data-accion="portada"]').click();
      igual(marcados, [0]);
    }, { alMover: function () {}, alQuitar: function () {},
         alMarcarPortada: function (i) { marcados.push(i); } });
  });

  prueba('repintar no apila celdas', function () {
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      Fotos.pintar(ol, proyecto(), nada());
      Fotos.pintar(ol, proyecto(), nada());
      igual(ol.children.length, 3);
    });
  });

  prueba('un proyecto sin fotos deja la rejilla vacía', function () {
    ArnesDom.conElemento('<ol></ol>', function (ol) {
      Fotos.pintar(ol, { id: 'x', portada: null, piezas: [] }, nada());
      igual(ol.children.length, 0);
    });
  });
});

describe('Fotos.enfocar', function () {
  /* El mismo problema que Lista.enfocar y por el mismo motivo: tras repintar,
     los nodos son nuevos. Aquí el ancla es el índice y no el id, porque una
     foto no tiene id — y el índice es justamente lo que cambia al mover, así
     que quien llama pasa el índice de DESPUÉS del movimiento. */
  var HTML =
    '<ol><li data-indice="0"><button data-accion="anterior" disabled>‹</button>' +
    '<button data-accion="siguiente">›</button></li>' +
    '<li data-indice="1"><button data-accion="anterior">‹</button>' +
    '<button data-accion="siguiente" disabled>›</button></li></ol>';

  prueba('enfoca el botón de la celda que se le pide', function () {
    ArnesDom.conElemento(HTML, function (ol) {
      Fotos.enfocar(ol, { indice: 1, accion: 'anterior' });
      igual(document.activeElement.dataset.accion, 'anterior');
    });
  });

  prueba('si quedó deshabilitado, usa el contrario de la misma celda', function () {
    ArnesDom.conElemento(HTML, function (ol) {
      Fotos.enfocar(ol, { indice: 0, accion: 'anterior' });
      igual(document.activeElement.dataset.accion, 'siguiente');
    });
  });

  prueba('una celda que ya no existe no revienta', function () {
    ArnesDom.conElemento(HTML, function (ol) {
      Fotos.enfocar(ol, { indice: 9, accion: 'anterior' });
      igual(document.activeElement.tagName, 'BODY');
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/fotos.js"></script>
```
```html
<script src="pruebas-fotos.js"></script>
```

`fotos.js` va después de `lista.js` y `edicion.js`: usa las dos.

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Fotos is not defined`.

- [ ] **Paso 3: Escribe `panel/js/fotos.js`**

```js
/* La rejilla de fotos de un proyecto. La aritmética del arrastre —traducir
   «soltar sobre esta celda, antes o después» a un índice, y no dejar pasar un
   NaN a Orden.mover— se reutiliza de lista.js, que la expone justamente para
   poder probarla. Escribirla otra vez serían dos aritméticas que se separan.

   Lo que sí es distinto es la geometría: la lista es vertical y decide por la
   mitad de ALTO; la rejilla es bidimensional y decide por la mitad de ANCHO. */
window.Fotos = (function () {
  var origenArrastre = null;
  var celdaMarcada = null;

  function desmarcar() {
    if (celdaMarcada) {
      celdaMarcada.classList.remove('celda--marca-antes', 'celda--marca-despues');
      celdaMarcada = null;
    }
  }

  function marcar(li, antes) {
    desmarcar();
    li.classList.add(antes ? 'celda--marca-antes' : 'celda--marca-despues');
    celdaMarcada = li;
  }

  /* Por el ancho, no por el alto: en una rejilla, lo que el ojo entiende como
     «antes de ésta» es la mitad izquierda de la celda. */
  function sueltaAntes(li, x) {
    var caja = li.getBoundingClientRect();
    return x < caja.left + caja.width / 2;
  }

  function boton(accion, texto, etiqueta, desactivado, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'celda-boton';
    b.textContent = texto;
    b.setAttribute('aria-label', etiqueta);
    b.dataset.accion = accion;
    b.disabled = !!desactivado;
    b.addEventListener('click', alPulsar);
    return b;
  }

  function celda(pieza, i, total, esPortada, acciones) {
    var li = document.createElement('li');
    li.className = 'celda' + (esPortada ? ' celda--portada' : '');
    li.dataset.indice = String(i);
    li.draggable = true;

    var img = document.createElement('img');
    /* La miniatura y no la pieza: la rejilla enseña varias a la vez, y pedir
       los 3000 px para verlos a 120 costaría un megabyte por foto. Es el mismo
       motivo por el que la tira del visor tiene su propia medida. */
    img.src = pieza.miniatura || pieza.url;
    img.alt = 'Foto ' + (i + 1) + ' de ' + total;
    img.className = 'celda-img';
    li.appendChild(img);

    /* Los cuatro botones son el camino principal, no un añadido: criterio de
       aceptación 6, el panel es operable de principio a fin sin ratón. El
       arrastrar y soltar de más abajo es el atajo. */
    li.appendChild(boton('anterior', '‹', 'Mover la foto ' + (i + 1) + ' hacia atrás',
      i === 0, function () { acciones.alMover(i, i - 1); }));
    li.appendChild(boton('siguiente', '›', 'Mover la foto ' + (i + 1) + ' hacia delante',
      i === total - 1, function () { acciones.alMover(i, i + 1); }));
    /* Marcar la que ya es portada no haría nada, y un botón que no hace nada
       tiene que decirlo antes de que lo pulsen. */
    li.appendChild(boton('portada', 'Portada', 'Hacer portada la foto ' + (i + 1),
      esPortada, function () { acciones.alMarcarPortada(i); }));
    li.appendChild(boton('quitar', 'Quitar', 'Quitar la foto ' + (i + 1),
      false, function () { acciones.alQuitar(i); }));

    li.addEventListener('dragstart', function (e) {
      var propio = window.Lista.indiceValido(li.dataset.indice);
      if (propio === null) { e.preventDefault(); return; }
      origenArrastre = propio;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(propio));
      li.classList.add('celda--arrastrando');
    });

    li.addEventListener('dragover', function (e) {
      if (origenArrastre === null) return;
      var destino = window.Lista.indiceValido(li.dataset.indice);
      if (destino === null || destino === origenArrastre) { desmarcar(); return; }
      e.preventDefault();               // obligatorio para que 'drop' llegue a disparar
      e.dataTransfer.dropEffect = 'move';
      marcar(li, sueltaAntes(li, e.clientX));
    });

    li.addEventListener('drop', function (e) {
      e.preventDefault();
      var origen = origenArrastre;
      var destino = window.Lista.indiceValido(li.dataset.indice);
      var antes = sueltaAntes(li, e.clientX);
      desmarcar();
      origenArrastre = null;
      if (origen === null || destino === null || destino === origen) return;
      var hasta = window.Lista.calcularHasta(origen, destino, antes);
      if (hasta === origen) return;
      acciones.alMover(origen, hasta);  // el mismo alMover que usan los botones
    });

    li.addEventListener('dragend', function () {
      li.classList.remove('celda--arrastrando');
      desmarcar();
      origenArrastre = null;
    });

    return li;
  }

  function pintar(contenedor, proyecto, acciones) {
    contenedor.innerHTML = '';
    /* Los nodos viejos desaparecen con el innerHTML: ninguna referencia a un
       arrastre o una marca anterior debe sobrevivirlos. */
    origenArrastre = null;
    celdaMarcada = null;
    var piezas = proyecto.piezas || [];
    var laPortada = window.Edicion.indiceDePortada(proyecto);
    piezas.forEach(function (pieza, i) {
      contenedor.appendChild(celda(pieza, i, piezas.length, i === laPortada, acciones));
    });
  }

  /* Lo mismo que Lista.enfocar y por lo mismo: tras repintar, los nodos son
     nuevos. El ancla aquí es el índice y no un id, porque una foto no tiene
     id — y como el índice es justo lo que cambia al mover, quien llama pasa el
     de DESPUÉS del movimiento. */
  function enfocar(contenedor, foco) {
    if (!foco) return;
    var li = contenedor.querySelector('[data-indice="' + foco.indice + '"]');
    if (!li) return;
    var b = li.querySelector('[data-accion="' + foco.accion + '"]');
    if (b && !b.disabled) { b.focus(); return; }
    var otra = foco.accion === 'anterior' ? 'siguiente' : 'anterior';
    var alternativo = li.querySelector('[data-accion="' + otra + '"]');
    if (alternativo && !alternativo.disabled) alternativo.focus();
  }

  return { pintar: pintar, enfocar: enfocar, sueltaAntes: sueltaAntes };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **dieciséis** nuevas en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/fotos.js tests/
git commit -m "Pintar la rejilla de fotos, con teclado antes que arrastre"
```

---

### Tarea 7: La pantalla de un proyecto

**Archivos:**
- Crear: `panel/js/proyecto.js`, `tests/pruebas-proyecto.js`
- Modificar: `tests/test.html`

**Interfaces:**
- Produce: `window.Proyecto.pintar(elementos, proyecto, acciones)` con
  `acciones = { alCambiar, alSubir, alVolver }`; `Proyecto.fichaDel(elementos)`.
- Consume: `window.Fotos`, `window.Edicion`, `window.Subida`,
  `window.ReglasContenido`.

**Por qué está separada de `fotos.js`.** `fotos.js` pinta la rejilla y no sabe
nada del borrador; esto es lo que junta la ficha, la rejilla y la subida, y
decide qué se le dice al estudio. Juntarlo todo pasaría de 300 líneas.

**Lo que esta pantalla NO hace:** guardar. Cambiar aquí cambia el borrador en
memoria y avisa con `alCambiar`; el botón de guardar sigue siendo el del panel.
Ver la decisión 6.

- [ ] **Paso 1: Las pruebas que fallan**

Crea `tests/pruebas-proyecto.js`:

```js
describe('Proyecto.pintar', function () {
  var HTML =
    '<div>' +
    '<h2 id="pTitulo"></h2><p id="pAviso" role="status" aria-live="polite"></p>' +
    '<input id="pNombre" type="text"><select id="pCategoria"></select>' +
    '<input id="pCliente" type="text"><input id="pAnio" type="number">' +
    '<input id="pPapel" type="text"><input id="pEnlace" type="url">' +
    '<div id="pSoltar"><input id="pArchivos" type="file" multiple></div>' +
    '<ol id="pFotos"></ol><p id="pProblemas"></p>' +
    '</div>';

  function elementos(d) {
    return { titulo: d.querySelector('#pTitulo'), aviso: d.querySelector('#pAviso'),
             nombre: d.querySelector('#pNombre'), categoria: d.querySelector('#pCategoria'),
             cliente: d.querySelector('#pCliente'), anio: d.querySelector('#pAnio'),
             papel: d.querySelector('#pPapel'), enlace: d.querySelector('#pEnlace'),
             soltar: d.querySelector('#pSoltar'), archivos: d.querySelector('#pArchivos'),
             fotos: d.querySelector('#pFotos'), problemas: d.querySelector('#pProblemas') };
  }

  function proyecto() {
    return { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
             ficha: { cliente: 'Vogue ES', anio: 2025, papel: 'DoP' },
             portada: '/img/a-1500.jpg',
             piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg',
                        portada: '/img/a-1500.jpg' }] };
  }

  function nada() { return { alCambiar: function () {}, alSubir: function () {},
                             alVolver: function () {} }; }

  function conPantalla(fn, p, acciones) {
    return ArnesDom.conElemento(HTML, function (caja) {
      var els = elementos(caja);
      Proyecto.pintar(els, p || proyecto(), acciones || nada());
      return fn(els, caja);
    });
  }

  prueba('el encabezado dice qué proyecto es', function () {
    conPantalla(function (els) { igual(els.titulo.textContent, 'Bruma'); });
  });

  prueba('la ficha llega escrita en el formulario', function () {
    conPantalla(function (els) {
      igual(els.nombre.value, 'Bruma');
      igual(els.cliente.value, 'Vogue ES');
      igual(els.anio.value, '2025');
      igual(els.papel.value, 'DoP');
    });
  });

  /* Un campo opcional que no está en la ficha se pinta vacío, no como
     «undefined». Es lo que pasaría al leer directamente ficha.enlace de un
     editorial, que no tiene. */
  prueba('un campo que la ficha no trae sale vacío', function () {
    conPantalla(function (els) { igual(els.enlace.value, ''); });
  });

  prueba('la categoría trae sus cuatro opciones y la suya elegida', function () {
    conPantalla(function (els) {
      igual(els.categoria.options.length, 4);
      igual(els.categoria.value, 'editorial');
    });
  });

  prueba('la rejilla pinta las fotos', function () {
    conPantalla(function (els) { igual(els.fotos.children.length, 1); });
  });

  /* Escribir en la ficha cambia el borrador en memoria, no guarda. El
     borrador se guarda con el botón de siempre. Ver la decisión 6. */
  prueba('escribir en la ficha avisa con el proyecto nuevo', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.papel.value = 'Fotografía';
      els.papel.dispatchEvent(new Event('input', { bubbles: true }));
      igual(cambios.length, 1);
      igual(cambios[0].ficha.papel, 'Fotografía');
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  /* El título sí se puede cambiar; el id NO se recalcula. Va en la URL
     pública, así que se congela al crear: renombrar no puede romper un
     enlace que la fotógrafa ya mandó a un cliente. */
  prueba('cambiar el título no cambia el identificador', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.nombre.value = 'Bruma Marina';
      els.nombre.dispatchEvent(new Event('input', { bubbles: true }));
      igual(cambios[0].titulo, 'Bruma Marina');
      igual(cambios[0].id, 'bruma');
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  /* `cliente` y `enlace` vacíos salen de la ficha en vez de guardarse como
     cadena vacía, igual que hace panel.js al crear: la forma de decir que un
     trabajo no tiene cliente es que la clave no esté. */
  prueba('vaciar un campo opcional lo quita de la ficha', function () {
    var cambios = [];
    conPantalla(function (els) {
      els.cliente.value = '';
      els.cliente.dispatchEvent(new Event('input', { bubbles: true }));
      igual(Object.prototype.hasOwnProperty.call(cambios[0].ficha, 'cliente'), false);
    }, null, { alCambiar: function (p) { cambios.push(p); },
               alSubir: function () {}, alVolver: function () {} });
  });

  prueba('mover una foto avisa con el proyecto reordenado', function () {
    var dos = proyecto();
    dos.piezas.push({ url: '/img/b-3000.jpg', miniatura: '/img/b-250.jpg',
                      portada: '/img/b-1500.jpg' });
    var cambios = [];
    conPantalla(function (els) {
      els.fotos.children[0].querySelector('[data-accion="siguiente"]').click();
      igual(cambios[0].piezas[0].url, '/img/b-3000.jpg');
    }, dos, { alCambiar: function (p) { cambios.push(p); },
              alSubir: function () {}, alVolver: function () {} });
  });

  /* Quitar una foto es irreversible dentro de la sesión —no hay deshacer— y
     además es lo único de esta pantalla que destruye trabajo. Se pregunta,
     igual que se pregunta al borrar un proyecto. */
  prueba('quitar una foto pregunta antes', function () {
    var cambios = [], preguntado = false;
    var confirmDeVerdad = window.confirm;
    window.confirm = function () { preguntado = true; return false; };
    try {
      conPantalla(function (els) {
        els.fotos.children[0].querySelector('[data-accion="quitar"]').click();
        igual(preguntado, true);
        igual(cambios.length, 0, 'si se dice que no, no se quita');
      }, null, { alCambiar: function (p) { cambios.push(p); },
                 alSubir: function () {}, alVolver: function () {} });
    } finally {
      window.confirm = confirmDeVerdad;
    }
  });

  /* Los problemas se enseñan ANTES de intentar publicar, que es donde el
     Worker los diría con un 422. Enterarse en la pantalla donde se arreglan
     es la diferencia entre un aviso y un callejón. */
  prueba('un proyecto sin fotos dice qué le falta para publicarse', function () {
    conPantalla(function (els) {
      cierto(els.problemas.textContent.indexOf('piezas') !== -1
          || els.problemas.textContent.indexOf('fotos') !== -1,
        'decía: ' + els.problemas.textContent);
    }, { id: 'x', titulo: 'X', categoria: 'editorial', tipo: 'fotos',
         ficha: { anio: 2025, papel: 'DoP' }, portada: null, piezas: [] });
  });

  prueba('un proyecto completo no enseña problemas', function () {
    conPantalla(function (els) { igual(els.problemas.textContent, ''); });
  });

  prueba('elegir archivos llama a alSubir con ellos', function () {
    var subidos = [];
    conPantalla(function (els) {
      /* No se puede poner `files` en un input desde una prueba, así que se
         emite el evento y se mira que la pantalla pregunte por los archivos
         del input — que es lo que hace en producción. */
      Object.defineProperty(els.archivos, 'files', { value: ['a', 'b'] });
      els.archivos.dispatchEvent(new Event('change', { bubbles: true }));
      igual(subidos.length, 1);
      igual(subidos[0].length, 2);
    }, null, { alCambiar: function () {}, alVolver: function () {},
               alSubir: function (fs) { subidos.push(fs); } });
  });

  prueba('soltar archivos encima llama a alSubir', function () {
    var subidos = [];
    conPantalla(function (els) {
      var e = new Event('drop', { bubbles: true, cancelable: true });
      e.dataTransfer = { files: ['a'] };
      els.soltar.dispatchEvent(e);
      igual(subidos.length, 1);
    }, null, { alCambiar: function () {}, alVolver: function () {},
               alSubir: function (fs) { subidos.push(fs); } });
  });

  /* Sin esto, el navegador abre la foto soltada en la pestaña y el panel
     desaparece con los cambios sin guardar dentro. */
  prueba('soltar no deja que el navegador abra la foto', function () {
    conPantalla(function (els) {
      var e = new Event('drop', { bubbles: true, cancelable: true });
      e.dataTransfer = { files: ['a'] };
      els.soltar.dispatchEvent(e);
      igual(e.defaultPrevented, true);
    });
  });
});
```

Añade a `tests/test.html`:

```html
<script src="../panel/js/proyecto.js"></script>
```
```html
<script src="pruebas-proyecto.js"></script>
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Proyecto is not defined`.

- [ ] **Paso 3: Escribe `panel/js/proyecto.js`**

```js
/* La pantalla de un proyecto: la ficha, la rejilla y la puerta de subida. Lo
   que NO hace es guardar — cambiar aquí cambia el borrador en memoria y avisa
   con `alCambiar`; el botón de guardar sigue siendo el del panel. Autoguardar
   sería más cómodo y peor: cada pulsación un PUT, cada PUT una versión, y dos
   sesiones abiertas mandándose conflictos por cambios a medio hacer. */
window.Proyecto = (function () {

  function opciones(select, elegida) {
    select.innerHTML = '';
    window.ReglasContenido.CATEGORIAS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = window.Lista.ETIQUETAS[c] || c;
      if (c === elegida) o.selected = true;
      select.appendChild(o);
    });
  }

  /* El mismo criterio que `fichaDelFormulario` en panel.js: `cliente` y
     `enlace` sólo entran si están escritos. ReglasContenido.validar no los
     exige a propósito —Conejita Playboy no tiene cliente y los cuatro
     editoriales no tienen enlace—, y la forma de decir que no hay cliente es
     que la clave no esté. Guardar `cliente: ''` sería una segunda forma de
     decir lo mismo que además contesta que sí a quien pregunte. */
  function fichaDel(els) {
    var ficha = {};
    var cliente = els.cliente.value.trim();
    if (cliente) ficha.cliente = cliente;
    ficha.anio = Number(els.anio.value);
    ficha.papel = els.papel.value.trim();
    var enlace = els.enlace.value.trim();
    if (enlace) ficha.enlace = enlace;
    return ficha;
  }

  function conFicha(proyecto, els) {
    var nuevo = {};
    Object.keys(proyecto).forEach(function (k) { nuevo[k] = proyecto[k]; });
    /* El título cambia; el `id` NO se recalcula. Va en la URL pública, así que
       se congela al crear: renombrar un proyecto no puede romper un enlace que
       la fotógrafa ya mandó a un cliente. */
    nuevo.titulo = els.nombre.value.trim();
    nuevo.categoria = els.categoria.value;
    nuevo.ficha = fichaDel(els);
    return nuevo;
  }

  /* Los mismos problemas que diría el Worker con un 422 al publicar, pero
     dichos en la pantalla donde se arreglan. Enterarse aquí en vez de al
     publicar es la diferencia entre un aviso y un callejón sin salida. */
  function problemasDe(proyecto) {
    return window.ReglasContenido
      .validar({ proyectos: [proyecto] }, window.ReglasContenido.CATEGORIAS);
  }

  function archivosDe(e) {
    var t = e.dataTransfer || e.target;
    return (t && t.files) || [];
  }

  function pintar(els, proyecto, acciones) {
    var actual = proyecto;

    els.titulo.textContent = actual.titulo || actual.id;
    els.nombre.value = actual.titulo || '';
    opciones(els.categoria, actual.categoria);
    var ficha = actual.ficha || {};
    /* `|| ''` y no el valor a secas: un campo opcional que la ficha no trae
       pintaría «undefined» en la caja, y eso se guardaría tal cual al
       siguiente cambio. */
    els.cliente.value = ficha.cliente || '';
    els.anio.value = ficha.anio || '';
    els.papel.value = ficha.papel || '';
    els.enlace.value = ficha.enlace || '';

    var problemas = problemasDe(actual);
    els.problemas.textContent = problemas.length
      ? 'Para poder publicarlo le falta: ' + problemas.join('; ') + '.'
      : '';

    window.Fotos.pintar(els.fotos, actual, {
      alMover: function (desde, hasta) {
        acciones.alCambiar(window.Edicion.mover(actual, desde, hasta),
                           { indice: hasta, accion: desde < hasta ? 'siguiente' : 'anterior' });
      },
      alQuitar: function (indice) {
        /* Se pregunta porque no hay deshacer dentro de la sesión y porque es
           lo único de esta pantalla que destruye trabajo. Los bytes siguen en
           R2 —quitar una foto no la borra del bucket, a propósito—, pero el
           estudio no tiene ninguna pantalla desde la que recuperarlos. */
        if (!window.confirm('¿Quitar la foto ' + (indice + 1) + ' de este proyecto?')) return;
        acciones.alCambiar(window.Edicion.quitar(actual, indice),
                           { indice: Math.max(0, indice - 1), accion: 'siguiente' });
      },
      alMarcarPortada: function (indice) {
        acciones.alCambiar(window.Edicion.marcarPortada(actual, indice),
                           { indice: indice, accion: 'quitar' });
      }
    });

    /* Se enganchan en cada pintado sobre nodos que NO se reconstruyen —vienen
       del HTML de la página, no de aquí—, así que hay que quitar el anterior o
       se apilarían. Se hace con la propiedad `on*` y no con addEventListener
       justamente por eso: asignar reemplaza. */
    ['nombre', 'categoria', 'cliente', 'anio', 'papel', 'enlace'].forEach(function (campo) {
      els[campo].oninput = function () { acciones.alCambiar(conFicha(actual, els)); };
      els[campo].onchange = els[campo].oninput;
    });

    els.archivos.onchange = function (e) {
      var fs = archivosDe(e);
      if (fs.length) acciones.alSubir(fs);
      /* Se vacía para que elegir el mismo archivo dos veces seguidas vuelva a
         disparar `change`: el navegador no lo emite si el valor no cambia. */
      els.archivos.value = '';
    };

    els.soltar.ondragover = function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      els.soltar.classList.add('soltar--encima');
    };
    els.soltar.ondragleave = function () { els.soltar.classList.remove('soltar--encima'); };
    els.soltar.ondrop = function (e) {
      /* Sin esto el navegador abre la foto soltada en la pestaña, y el panel
         desaparece con los cambios sin guardar dentro. */
      e.preventDefault();
      els.soltar.classList.remove('soltar--encima');
      var fs = archivosDe(e);
      if (fs.length) acciones.alSubir(fs);
    };
  }

  return { pintar: pintar, fichaDel: fichaDel, problemasDe: problemasDe };
})();
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **quince** nuevas en verde.

- [ ] **Paso 5: Commit**

```bash
git add panel/js/proyecto.js tests/
git commit -m "La pantalla de un proyecto: ficha, rejilla y puerta de subida"
```

---

### Tarea 8: Tres pantallas en una página

**Archivos:**
- Crear: `panel/js/pantallas.js`
- Modificar: `panel/index.html`, `panel/css/panel.css`, `panel/js/panel.js`,
  `tests/pruebas-panel.js`, `tests/test.html`

**Interfaces:**
- Produce: `window.Pantallas.mostrar(nodos, pantalla)`,
  `window.Panel = { ir, hayCambios }`.
- Consume: `window.Rutas`, `window.Proyecto`, `window.Subida`.

**Por qué `window.Panel`.** `panel.js` es una IIFE que no devuelve nada, así que
desde fuera no hay forma de pedirle que cambie de pantalla: las pruebas
tendrían que simular `hashchange`, que es probar el navegador. `Panel.ir` es la
costura, y `Panel.hayCambios` es lo que el aviso de salir necesita saber.

- [ ] **Paso 1: Las pruebas que fallan**

Añade a `tests/pruebas-panel.js` una sección nueva. El `HTML` de ese archivo
tiene que crecer con el marcado de la pantalla de proyecto y el de publicar
—dos `<section>` más—, y `MODULOS` con los siete archivos nuevos.

```js
/* Las tres pantallas, desde fuera: se pide un destino con Panel.ir y se mira
   qué sección queda visible. Se ejercita el panel entero dentro del iframe,
   con Borrador doblado, igual que el resto de este archivo. */
describeAsync('panel.js · tres pantallas', function () {

  function unProyecto() {
    return { version: 3, proyectos: [
      { id: 'bruma', titulo: 'Bruma', categoria: 'editorial', tipo: 'fotos',
        ficha: { anio: 2025, papel: 'DoP' }, portada: '/img/a-1500.jpg',
        piezas: [{ url: '/img/a-3000.jpg', miniatura: '/img/a-250.jpg',
                   portada: '/img/a-1500.jpg' }] } ] };
  }

  function visible(d, cual) {
    return !d.getElementById(cual).hidden;
  }

  function conPanel(datos, fn) {
    return ArnesDom.conDocumento({
      html: HTML, scripts: MODULOS,
      globales: { Borrador: borradorFalso({ datos: datos }) }
    }, fn);
  }

  return conPanel(unProyecto(), function (w, d) {
    prueba('arranca en la lista', function () {
      igual(visible(d, 'pantallaLista'), true);
      igual(visible(d, 'pantallaProyecto'), false);
    });

    prueba('ir a un proyecto enseña su pantalla y esconde la lista', function () {
      w.Panel.ir('proyecto', 'bruma');
      igual(visible(d, 'pantallaProyecto'), true);
      igual(visible(d, 'pantallaLista'), false);
      igual(d.getElementById('pTitulo').textContent, 'Bruma');
    });

    /* El fragmento se actualiza para que la dirección sea compartible y el
       botón de atrás del navegador haga lo que se espera. */
    prueba('el fragmento sigue a la pantalla', function () {
      igual(w.location.hash, '#/proyecto/bruma');
    });

    prueba('volver a la lista la enseña otra vez', function () {
      w.Panel.ir('lista');
      igual(visible(d, 'pantallaLista'), true);
      igual(visible(d, 'pantallaProyecto'), false);
    });

    /* Un id que no está en el borrador no puede dejar una pantalla en blanco
       con el encabezado del proyecto anterior. */
    prueba('un proyecto que no existe vuelve a la lista y lo dice', function () {
      w.Panel.ir('proyecto', 'fantasma');
      igual(visible(d, 'pantallaLista'), true);
      cierto(d.getElementById('aviso').textContent.indexOf('fantasma') !== -1,
        'decía: ' + d.getElementById('aviso').textContent);
    });
  }).then(function () {
    return conPanel(unProyecto(), function (w, d) {
      prueba('cada fila de la lista abre su proyecto', function () {
        d.querySelector('[data-accion="abrir"]').click();
        igual(visible(d, 'pantallaProyecto'), true);
      });

      /* hayCambios es lo que el aviso de salir necesita saber. Nada más
         cargar no hay ninguno: el borrador de la pantalla es el del
         servidor. */
      prueba('recién cargado no hay cambios pendientes', function () {
        igual(w.Panel.hayCambios(), false);
      });

      prueba('editar la ficha deja cambios pendientes', function () {
        var papel = d.getElementById('pPapel');
        papel.value = 'Fotografía';
        papel.dispatchEvent(new w.Event('input', { bubbles: true }));
        igual(w.Panel.hayCambios(), true);
      });

      /* El cambio tiene que estar en el borrador que se mandaría, no sólo en
         la caja de texto: si la pantalla escribiera en una copia suya, el
         estudio vería su cambio y guardaría el de antes. */
      prueba('el cambio llega al borrador que se guarda', function () {
        d.getElementById('guardar').click();
        var guardado = w.Borrador.guardadas[0];
        igual(guardado.proyectos[0].ficha.papel, 'Fotografía');
      });
    });
  });
});
```

- [ ] **Paso 2: Comprueba que falla**

Esperado: `Cannot read properties of undefined (reading 'ir')`.

- [ ] **Paso 3: El marcado, los estilos y el código**

En `panel/index.html`, envuelve lo que ya hay en `<section id="pantallaLista">` y
añade la del proyecto. Los scripts nuevos van en orden de dependencia:

```html
    <section id="pantallaProyecto" hidden>
      <button id="pVolver" type="button">‹ Volver a los proyectos</button>
      <h2 id="pTitulo"></h2>
      <p id="pAviso" role="status" aria-live="polite" class="aviso"></p>

      <label for="pNombre">Título</label>
      <input id="pNombre" type="text" autocomplete="off">

      <label for="pCategoria">Categoría</label>
      <select id="pCategoria"></select>

      <label for="pCliente">Cliente (opcional)</label>
      <input id="pCliente" type="text" autocomplete="off">

      <label for="pAnio">Año</label>
      <input id="pAnio" type="number">

      <label for="pPapel">Papel</label>
      <input id="pPapel" type="text" autocomplete="off">

      <label for="pEnlace">Enlace al vídeo (opcional)</label>
      <input id="pEnlace" type="url" placeholder="https://vimeo.com/…">

      <!-- El selector de archivos va SIEMPRE, no sólo como alternativa a
           soltar: la especificación lo pide («toda subida ofrece un selector
           de archivos además de soltar») y soltar no existe con teclado. -->
      <div id="pSoltar" class="soltar">
        <label for="pArchivos">Añadir fotos</label>
        <input id="pArchivos" type="file" accept="image/*" multiple>
        <p class="soltar-pista">También puedes soltarlas aquí.</p>
      </div>

      <p id="pProgreso" role="status" aria-live="polite"></p>
      <ol id="pFotos" class="fotos"></ol>
      <p id="pProblemas" class="problemas"></p>
    </section>
```

```html
  <script src="../js/reglas-contenido.js"></script>
  <script src="js/identificador.js"></script>
  <script src="js/orden.js"></script>
  <script src="js/rutas.js"></script>
  <script src="js/edicion.js"></script>
  <script src="js/imagenes.js"></script>
  <script src="js/subida.js"></script>
  <script src="js/borrador.js"></script>
  <script src="js/lista.js"></script>
  <script src="js/fotos.js"></script>
  <script src="js/proyecto.js"></script>
  <script src="js/pantallas.js"></script>
  <script src="js/panel.js"></script>
```

Crea `panel/js/pantallas.js`:

```js
/* Qué sección se ve. Tan pequeño porque lo único que tiene que hacer bien es no
   dejar dos visibles a la vez ni ninguna: cualquiera de las dos cosas es una
   pantalla rota, y las dos son fáciles de escribir sin querer si cada pantalla
   se esconde a sí misma. */
window.Pantallas = (function () {
  /* `hidden` y no `display:none` por CSS: la propiedad quita el elemento
     también del árbol de accesibilidad y del recorrido con Tab, que es lo que
     hace falta —una pantalla escondida cuyos campos siguen tabulables es peor
     que no esconderla—. */
  function mostrar(nodos, pantalla) {
    Object.keys(nodos).forEach(function (nombre) {
      nodos[nombre].hidden = nombre !== pantalla;
    });
  }

  return { mostrar: mostrar };
})();
```

En `panel/js/panel.js`, añade el enrutado. Lo esencial:

```js
  var pantallas, elsProyecto, abierto = null;
  /* La copia de lo último que el servidor confirmó. Comparar contra ella es lo
     que distingue «hay cambios sin guardar» de «se ha tocado algo y se ha
     vuelto a dejar como estaba», que es lo que haría un simple booleano. */
  var guardado = null;

  function hayCambios() {
    return !!trabajo && JSON.stringify(trabajo) !== guardado;
  }

  function buscar(id) {
    for (var i = 0; i < trabajo.proyectos.length; i++) {
      if (trabajo.proyectos[i].id === id) return i;
    }
    return -1;
  }

  function pintarProyecto(indice, foco) {
    abierto = indice;
    window.Proyecto.pintar(elsProyecto, trabajo.proyectos[indice], {
      alCambiar: function (nuevo, focoFotos) {
        trabajo.proyectos[indice] = nuevo;
        pintarProyecto(indice, focoFotos);
        avisar('Cambiado. Recuerda guardar.');
      },
      alSubir: subir
    });
    window.Fotos.enfocar(elsProyecto.fotos, foco);
  }

  function ir(pantalla, id) {
    if (pantalla === 'proyecto') {
      var indice = buscar(id);
      /* Un id que no está no puede dejar la pantalla del proyecto anterior
         con el encabezado de otro: se vuelve a la lista y se dice cuál era. */
      if (indice === -1) {
        window.Pantallas.mostrar(pantallas, 'pantallaLista');
        location.hash = window.Rutas.hacia('lista');
        return avisar('No hay ningún proyecto con el identificador «' + id + '».');
      }
      window.Pantallas.mostrar(pantallas, 'pantallaProyecto');
      location.hash = window.Rutas.hacia('proyecto', id);
      return pintarProyecto(indice);
    }
    abierto = null;
    window.Pantallas.mostrar(pantallas, 'pantallaLista');
    location.hash = window.Rutas.hacia('lista');
    repintar();
  }

  /* El aviso de salir con cambios sin guardar. No se puede escribir el texto:
     los navegadores enseñan el suyo desde hace años, y lo único que se
     controla es si aparece o no. */
  window.addEventListener('beforeunload', function (e) {
    if (!hayCambios()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  window.addEventListener('hashchange', function () {
    var destino = window.Rutas.leer(location.hash);
    ir(destino.pantalla, destino.id);
  });

  window.Panel = { ir: ir, hayCambios: hayCambios };
```

Y la subida, que es lo que junta `Subida` con `Edicion`:

```js
  function subir(archivos) {
    var indice = abierto;
    elsProyecto.progreso.textContent = 'Preparando ' + archivos.length + ' foto(s)…';
    window.Subida.subir(trabajo.proyectos[indice].id, archivos, function (paso) {
      elsProyecto.progreso.textContent = paso.hecho === paso.total
        ? '' : 'Subiendo ' + (paso.hecho + 1) + ' de ' + paso.total + ': ' + paso.archivo;
    }, function (r) {
      trabajo.proyectos[indice] = window.Edicion.anadir(trabajo.proyectos[indice], r.piezas);
      pintarProyecto(indice);
      /* Criterio de aceptación 10: se dice cuáles quedaron fuera, una por una
         y con su motivo. Un «hubo errores» obligaría a subirlas todas otra
         vez para averiguar cuál falló. */
      if (!r.fallos.length) {
        return avisar(r.piezas.length + ' foto(s) subidas. Recuerda guardar.');
      }
      avisar(r.piezas.length + ' foto(s) subidas. No se pudieron subir: '
        + r.fallos.map(function (f) { return f.archivo + ' (' + f.motivo + ')'; }).join('; ')
        + '. Recuerda guardar lo que sí ha entrado.');
    });
  }
```

En `guardar()`, tras el 200, actualiza la referencia:

```js
      trabajo.version = resultado.version;
      guardado = JSON.stringify(trabajo);
      avisar('Guardado.');
```

Y en `Borrador.cargar`, al recibir los datos:

```js
      trabajo = datos;
      guardado = JSON.stringify(trabajo);
```

En `lista.js`, cada fila necesita su botón de abrir:

```js
    var abrir = document.createElement('button');
    abrir.type = 'button';
    abrir.className = 'fila-boton';
    abrir.textContent = 'Abrir';
    abrir.setAttribute('aria-label', 'Abrir ' + p.titulo);
    abrir.dataset.accion = 'abrir';
    abrir.addEventListener('click', function () { alAbrir(p.id); });
```

`pintar` y `fila` reciben `alAbrir` como quinto parámetro, y `panel.js` le pasa
`function (id) { ir('proyecto', id); }`.

En `panel/css/panel.css`, la rejilla y la zona de soltar. Nada de gestos: cursor
del sistema y anillos de foco convencionales, como el resto del panel.

```css
.fotos { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
         gap: .75rem; list-style: none; padding: 0; }
.celda { border: 1px solid #333; padding: .4rem; }
.celda--portada { border-color: #FFFF00; }
.celda-img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
/* La misma proporción y el mismo recorte que la galería: lo que se ve aquí es
   lo que se verá en el lienzo, y elegir portada mirando otra cosa sería elegir
   a ciegas. */
.celda--marca-antes { box-shadow: inset 3px 0 0 #FFFF00; }
.celda--marca-despues { box-shadow: inset -3px 0 0 #FFFF00; }
.soltar { border: 1px dashed #555; padding: 1rem; }
.soltar--encima { border-color: #FFFF00; }
.problemas:not(:empty) { color: #FF5555; }

/* La opacidad del arrastre es la única animación de esta pantalla, y también
   se apaga: la especificación pide respetar prefers-reduced-motion, y un
   parpadeo al arrastrar treinta fotos es exactamente lo que molesta a quien lo
   tiene puesto. */
.celda--arrastrando { opacity: .4; transition: opacity .12s; }
@media (prefers-reduced-motion: reduce) {
  .celda--arrastrando { transition: none; }
}
```

- [ ] **Paso 4: Comprueba que pasa**

Arnés: las **nueve** nuevas en verde, las 28 de `pruebas-panel.js` intactas, y
el total del arnés por encima de las 468 de antes de este bloque.

```bash
wc -l panel/js/*.js
```

Ninguno pasa de 300. Si `panel.js` los cruza, lo que sale es `subir` a su propio
archivo, no acortar comentarios.

- [ ] **Paso 5: Commit**

```bash
git add panel/ tests/
git commit -m "Tres pantallas en una página, con el fragmento como dirección"
```

---

### Tarea 9: Comprobación manual, desplegada

**Esta tarea la ejecuta Ángel, no el asistente.** Despliegue:

```bash
git archive HEAD | tar -x -C <tmp>
wrangler deploy --config worker/estatico/wrangler.toml --assets <tmp>
```

Lo que sigue necesitando ojos humanos, porque ninguna prueba lo puede ver:

| # | Qué se mira | Qué tiene que pasar |
|---|---|---|
| 1 | Abrir un proyecto desde la lista | Se ve su ficha escrita y sus fotos |
| 2 | Recargar con `#/proyecto/bruma` | Vuelve a la misma pantalla, no a la lista |
| 3 | Soltar una foto de 40 MB | Sube en segundos, no en minutos |
| 4 | Mirar el bucket tras esa subida | Tres archivos: `-1500`, `-3000`, `-250` |
| 5 | Abrir el `-3000` a tamaño completo | El lado largo son 3000 px o menos, y la foto no está deformada |
| 6 | Subir una foto hecha con el móvil de lado | Sale derecha, no tumbada |
| 7 | Subir diez de golpe | Se ve el progreso y entran las diez |
| 8 | Subir un `.txt` renombrado a `.jpg` | Dice cuál falló y las demás entran |
| 9 | Arrastrar una foto sobre otra | Se reordena, y la marca amarilla aparece del lado correcto |
| 10 | Repetir el 9 **sólo con teclado** | Se puede hacer entero: Tab hasta ‹ o ›, Enter |
| 11 | Marcar otra portada y guardar y publicar | El lienzo enseña esa foto |
| 12 | Quitar una foto y decir que no | No se quita |
| 13 | Cambiar el título y guardar | El `id` de la URL no cambia |
| 14 | Editar algo y cerrar la pestaña | El navegador avisa |
| 15 | Editar algo, guardar, y cerrar | **No** avisa |
| 16 | Todo lo anterior con `prefers-reduced-motion` puesto | Nada parpadea |

- [ ] **Paso 1: Desplegar y recorrer la tabla**
- [ ] **Paso 2: Anotar lo que no cuadre y volver a la tarea que lo cubra**

---

### Tarea 10: Verificación antes de decir «hecho»

- [ ] **Paso 1: `superpowers:verification-before-completion`**

- [ ] **Paso 2: Las tres suites**

```bash
node tests/prueba-borrador.js          # 52/52
cd worker && node --test               # 101/101
# y el arnés del navegador, en verde entero
```

- [ ] **Paso 3: El techo de líneas, que es criterio de aceptación**

```bash
wc -l js/*.js panel/js/*.js worker/src/*.js worker/estatico/*.js | sort -rn | head -20
```

Ninguno pasa de 300.

- [ ] **Paso 4: Que no se haya colado una copia de las reglas**

```bash
ls panel/js/reglas-contenido.js   # no debe existir
```

- [ ] **Paso 5: Commit final, si quedó algo suelto**

---

## Lo que este bloque deja preparado para el 3d

- `window.Panel.ir('publicar')` ya es un destino que `Rutas` entiende; falta la
  pantalla.
- `window.Panel.hayCambios()` es lo que el 3d necesita para no publicar con
  cambios sin guardar.
- `Proyecto.problemasDe` es la misma validación que el 3d enseñará para todo el
  borrador en vez de para un proyecto.
