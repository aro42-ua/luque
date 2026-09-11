# La pantalla del proyecto, para que se vea y se use bien

Diseño aprobado el 2026-09-11. Continúa `2026-08-17-panel-contenido-design.md`,
que sigue siendo la autoridad sobre qué es el panel; esto no cambia lo que la
pantalla del proyecto hace, sino cómo se ve y cómo se usa.

## Por qué

Ángel pidió «la página que tendrá Lidia para gestionar las imágenes de la
galería: añadir, suprimir, organizar». **Esa página ya existe**: es la pantalla
de un proyecto del bloque 3c, fusionada el 2026-09-11 en el PR #13. Añade
fotos por selector o soltándolas, las reduce en el navegador, las ordena
arrastrando o con ‹ ›, elige portada y las quita. Todo lo que el spec del panel
pedía está hecho y en verde.

Lo que no está es el diseño. Abierta con las diez fotos de `la-boquerona`:

- **El formulario de la ficha no tiene ni una regla de CSS.** Sólo las tiene el
  formulario de crear (`.nuevo`). Los seis campos del proyecto caen sueltos en
  línea, como texto corrido: «Título [ ] Categoría [ ] Harper's Bazaar Año
  2026 Papel DoP Enlace al vídeo…», partido por donde cae.
- **La portada es invisible.** `.celda--portada` pone el borde en amarillo…
  sobre una página amarilla. No se distingue cuál es.
- **Los cuatro botones de cada foto** van pegados, a tamaño del sistema, sin
  estilo.
- **Desde dentro de un proyecto no hay botón de guardar.** Editas, el panel
  dice «Cambiado. Recuerda guardar.», y para guardar hay que pulsar «Volver a
  los proyectos» y buscar el botón en la lista. Con diez fotos reordenadas
  desde un teléfono, es una trampa.

Y Lidia va a usar esta pantalla **desde el ordenador para subir y desde el
móvil para retocar** —reordenar, cambiar la portada, quitar una—. El panel no
tiene hoy ni una regla responsiva, y el arrastre nativo (`draggable`,
`dragstart`) que usa `fotos.js` no funciona con el dedo en Chrome de Android ni
de forma fiable en Safari de iOS. En el teléfono, los botones ‹ › no son el
atajo: son el único camino.

## Lo que se construye

### 1. La disposición, y dónde vive Guardar

La pantalla se ordena así, **conservando todos los `id` actuales**. Es lo que
mantiene vivas las pruebas —llevan una copia mínima del marcado con sólo los
`id`— y el JS, que enlaza por `id` (`Proyecto.recoger`) y por `data-accion`:

```
‹ Volver a los proyectos                        #pVolver, arriba, como hasta ahora
La Boquerona                                    #pTitulo

┌ La ficha ─────────────────────────────────┐
│ Título ······································ │
│ Categoría ·········  Año ················· │
│ Cliente ···········  Papel ··············· │
│ Enlace al vídeo ····························· │
└───────────────────────────────────────────┘

┌ Añadir fotos ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   #pSoltar
│   [ Elegir archivos ]  o suéltalas aquí    │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
Subiendo 3 de 10…                               #pProgreso

[foto] [foto] [foto] [foto]                     #pFotos
...
Para poder publicarlo le falta: …               #pProblemas

═══════════════════════════════════════════════
 Cambiado. Recuerda guardar.        [ Guardar ]   barra FIJA abajo — nueva
═══════════════════════════════════════════════
```

**La barra de abajo es la novedad de uso.** Es `position: sticky; bottom: 0`
dentro de la sección, y lleva dos cosas:

- **`#pAviso`**, que hoy está arriba. En un teléfono, mientras se ordena la
  rejilla, el aviso «Cambiado. Recuerda guardar.» queda fuera de la vista. En
  la barra está siempre. Se mueve el nodo; el `id`, el `role="status"` y el
  `aria-live` no cambian, así que `panel.js` no se entera.
- **`#pGuardar`**, un botón nuevo cableado al mismo `guardar()` de `panel.js`
  que ya sirve al `#guardar` de la lista. Se apaga y se enciende **a la vez**
  que aquél: al arrancar, hasta que llega el borrador; y tras un conflicto de
  versiones, donde el aviso dice que Guardar se ha desactivado y el botón tiene
  que parecerlo. `panel.js` gana una función `guardarActivo(activo)` que pone
  `disabled` en los dos, y las asignaciones sueltas a `elGuardar.disabled`
  pasan por ella.

El botón de la lista **se queda donde está**: desde la lista se sigue guardando
igual que hasta ahora.

### 2. La ficha

Los seis campos entran en un contenedor `.ficha`. **No se duplica CSS**: la
regla que hoy dice `.nuevo input, .nuevo select` gana el selector `.ficha input,
.ficha select`, y lo mismo la de `:disabled`. Etiqueta en negrita encima de
cada campo, como en el formulario de crear.

En pantalla ancha, dos columnas: Título y Enlace a lo ancho; Categoría y Año en
pareja; Cliente y Papel en pareja. Por debajo de 600px, una sola columna. Los
dos campos anchos llevan `grid-column: span 2`, así que en una columna no hay
nada que deshacer: el `span` sobre una rejilla de una columna no hace nada.

`#pTitulo` se estiliza como el `h1` de la lista, un escalón por debajo.

### 3. La zona de subir

Hoy es una línea de texto con un `input type="file"` a pelo. Pasa a ser una
zona con altura mínima, borde discontinuo negro de 2px y centrado:

- La etiqueta «Elegir archivos» (el `<label for="pArchivos">`) **con aspecto de
  botón**, el mismo que `#guardar`. El `input` sigue en el documento, oculto con
  el patrón de «visualmente escondido» —`position:absolute; width:1px;
  height:1px; overflow:hidden; clip…`— y **no** con `display:none`, que lo
  sacaría del tabulador. El anillo de foco cae sobre la etiqueta con
  `.soltar:focus-within`.
- «o suéltalas aquí» debajo, en cuerpo más pequeño.
- Al arrastrar encima (`.soltar--encima`, que ya pone `proyecto.js`), el borde
  pasa a continuo y el fondo a negro con el texto en amarillo: el mismo gesto
  de inversión que tienen los botones al pasar el ratón.

`#pProgreso` en negrita justo debajo de la zona.

### 4. La rejilla

**La celda pasa a ser negra con texto amarillo, como las filas de la lista.**
Es el lenguaje que el panel ya tiene, y las fotos destacan sobre negro. Dentro:

```
┌──────────────┐
│   [Portada]  │  etiqueta en la esquina, sólo en la portada
│    (foto)    │
│              │
├──────────────┤
│  ‹   3/10  › │  fila 1: mover, con el número visible
│ Portada Quitar│  fila 2
└──────────────┘
```

- **Botones de 44px de alto como mínimo**, siempre visibles: son el camino
  principal en táctil. Arrastrar sigue como atajo de ratón, con las marcas de
  inserción que ya hay (`celda--marca-antes/despues`, sombra interior
  amarilla, que sobre negro se ve).
- **El número «n/N» va entre ‹ y ›**, en un `<span class="celda-num">`, así se
  lee como un control de posición. Es lo que permite «mover la 7 antes de la
  4» en diez fotos casi iguales. Hoy el número sólo está en el `alt`. Son unas
  cinco líneas en `fotos.js`, y no tocan ni los botones ni sus `data-accion`.
- **La portada** lleva una etiqueta «Portada» en la esquina superior de la
  foto —un `<span class="celda-etiqueta">`, que también añade `fotos.js` sólo
  en esa celda— y un marco más grueso. Además el botón «Portada» va apagado en
  ella, que ya lo hace. Tres señales donde hoy no hay ninguna que se vea.
- Rejilla `repeat(auto-fill, minmax(160px, 1fr))` en ancho; **dos columnas**
  por debajo de 600px. A 375px eso deja celdas de unos 160px, donde caben
  «Portada» y «Quitar» uno al lado del otro a 44px de alto.
- Anillo de foco amarillo dentro de la celda negra, la misma regla que
  `.fila :focus-visible` y por el mismo motivo: un contorno negro sobre negro
  no se ve.
- `celda--arrastrando` (opacidad 0,4) se queda, y la regla global de
  `prefers-reduced-motion` ya lo cubre.

La confirmación al quitar (`confirm()`) no cambia.

### 5. Responsivo

`@media (max-width: 600px)`: el `.panel` estrecha su relleno lateral; `.ficha`
pasa a una columna; `.fotos` a dos; la barra fija añade
`padding-bottom: env(safe-area-inset-bottom)` para no quedar bajo la barra de
gestos del sistema. Los 44px de los botones no son sólo del móvil: son la
medida en todas partes, para no tener dos rejillas.

## Lo que se prueba y lo que no

**Se añade prueba de lo que es JS:**

- que pulsar `#pGuardar` llama a `Borrador.guardar` con el mismo borrador que
  `#guardar`;
- que tras un conflicto de versiones **los dos** botones quedan apagados, y
  que al arrancar, antes de que llegue el borrador, también;
- que cada celda enseña su «n/N», y que sólo la portada lleva la etiqueta.

**La copia del marcado de `tests/pruebas-panel.js` gana `#pGuardar`.** Sin
eso, `panel.js` lo buscaría al arrancar, no lo encontraría y la sección entera
del panel caería. Es una trampa conocida de este arnés: la suite en verde no
demuestra que `panel/index.html` tenga el nodo, porque las pruebas llevan el
suyo.

**No se puede probar nada del CSS.** `tests/test.html` no carga
`panel/css/panel.css`, así que lo que sigue sólo lo puede mirar quien lo abra:

1. Que la barra fija no tape la última fila de fotos al llegar abajo.
2. Que en un teléfono de 375px quepan dos columnas con los cuatro botones
   pulsables sin acertar de milagro.
3. Que la portada se distinga a un golpe de vista, con fotos claras y oscuras.
4. Que la zona de soltar se entienda como tal sin leerla.
5. Que el foco con Tab se vea en cada botón de la celda negra.

Va a la misma lista de comprobaciones en producción que el bloque 3c dejó a
Ángel (`docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md`, Tarea
9), no a una aparte.

## Los ficheros

| Fichero | Qué le pasa |
|---|---|
| `panel/index.html` | la estructura de la pantalla del proyecto: `.ficha`, la zona de subir, la barra, `#pGuardar`. Ningún `id` cambia |
| `panel/css/panel.css` | las reglas de la pantalla del proyecto, la barra, la rejilla nueva y el `@media` |
| `panel/js/panel.js` | `guardarActivo`, y el segundo botón (+~10 líneas; queda en ~277) |
| `panel/js/fotos.js` | `celda-num` y `celda-etiqueta` (+~6) |
| `tests/pruebas-panel.js` | `#pGuardar` en la copia del marcado, y las pruebas del botón |
| `tests/pruebas-proyecto.js` | la prueba del «n/N» y de la etiqueta de portada |
| `docs/estado-conocido.md` | la sección de este bloque, y **la de los bloques 3c y 3d, que el PR #13 no escribió** |

## Lo que este bloque NO hace

- **No cambia lo que la pantalla hace.** Añadir, quitar, ordenar, portada y la
  ficha se comportan exactamente igual; el arrastre nativo se queda tal cual.
- **No hace arrastre táctil.** Sustituir el `draggable` nativo por un arrastre
  con `pointer*` que funcione con el dedo es el enfoque C que se descartó:
  reescribe `fotos.js`, rehace el criterio de teclado y el repositorio ya pagó
  dos veces la interacción entre `touch-action` y los gestos. Se hará si Lidia,
  tras usar esto, dice que ordenar con ‹ › desde el móvil le sabe a poco.
- **No toca la lista ni la pantalla de publicar.** Comparten lenguaje con esto,
  pero rediseñarlas es otro alcance que Ángel dejó fuera a propósito.
- **No añade funciones**: ni pie por foto, ni selección múltiple, ni recorte,
  ni mover fotos entre proyectos. Ninguna se ha pedido.
