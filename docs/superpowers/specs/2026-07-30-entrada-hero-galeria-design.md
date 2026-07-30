# Entrada del hero a la galería — LUQUE!

Fecha: 2026-07-30

## Objetivo

Hoy se baja del hero a la galería con el scroll: 200vh de recorrido en los que
primero un logo funde en otro y después la galería sube y cubre el hero. Ese
gesto trata la galería como si fuera un documento que se lee, cuando es un
espacio que se explora, y por el camino la deja verse cortada.

Se sustituye por un botón. Al pulsarlo, las cuatro esquinas en L del sitio
encuadran el logotipo y lo sueltan, y la galería aparece a pantalla completa de
una vez.

## Alcance

Dentro:

- El botón de entrada y la secuencia de esquinas a saltos.
- Eliminar el scroll de la página por completo: la web pasa a ser dos estados a
  pantalla completa, nunca un documento con recorrido.
- Recolocar el título de la galería y el pie, que hoy dependen de ese recorrido.
- Eliminar GSAP y sus dos etiquetas de CDN.

Fuera, decidido explícitamente:

- Volver al hero desde la galería. Ver «La vuelta» más abajo.
- Que las fotos entren escalonadas en lugar de a la vez.
- Cualquier cambio en el visor de proyecto, el filtrado o la lupa.

## Arquitectura

### Lo que se borra

- `#heroSpacer`, los 200vh que reservaban el recorrido.
- La línea de tiempo `heroTimeline` y su `ScrollTrigger`.
- El `ScrollTrigger` de anclaje a tres posiciones.
- El `ScrollTrigger` que revelaba el navbar en `js/galeria.js`.
- `.scroll-label` y su animación `scrollLine`, en marcado y estilos.
- `scroll-behavior: smooth` en `html`.
- En `js/visor.js`, el bloque que traía la galería a la vista al cerrar tras un
  enlace directo (`js/visor.js:156`). Existía porque el usuario acababa en el
  hero; sin scroll, el problema no puede darse.
- En `js/galeria.js`, el `scrollIntoView` del manejador de clic del navbar
  (`js/galeria.js:265`), por el mismo motivo: ya no hay adónde desplazarse.

Las llamadas `focus({ preventScroll: true })` que quedan en `js/visor.js`,
`js/visor-transicion.js` y `js/galeria-teclado.js` se conservan. Sin scroll son
inocuas, y quitarlas sería reabrir la puerta a un fallo que costó encontrar.

### Lo que se elimina de dependencias

GSAP queda reducido, tras los borrados anteriores, a dos fundidos del preloader
en `js/hero.js`. Ambos se reescriben con transiciones de CSS y se eliminan:

- Las dos etiquetas `<script>` que cargan `gsap.min.js` y `ScrollTrigger.min.js`
  desde `cdnjs.cloudflare.com`.
- La llamada `gsap.registerPlugin(ScrollTrigger)` del bloque de arranque.

Efecto secundario buscado: la web deja de tener ninguna dependencia de red.
Hasta ahora, abrir `index.html` con doble clic **sin conexión** daba una página
muerta. Al terminar este trabajo, funcionará sin internet.

### Los dos estados

```
[ hero    ]  position:fixed, inset 0, z-index por encima de la galería
[ galería ]  position:fixed, inset 0, el lienzo ocupa el viewport entero
```

Nunca están activos a la vez. El `body` pasa a `overflow:hidden` de forma
permanente: no hay documento que recorrer.

`.spatial-stage` pasa de `height:100vh` a ocupar el alto disponible de la galería
fija. La variante de móvil, hoy `height:78vh`, se elimina: el escenario ocupa
todo también en pantallas pequeñas.

### Lo que se recoloca

- `.gallery-intro` («Trabajo seleccionado») deja de ser un bloque sobre el lienzo
  y pasa a etiqueta superpuesta en la esquina superior izquierda del escenario,
  con el mismo tratamiento tipográfico que `.spatial-hint`.
- El `<footer>` sigue siendo un `<footer>` en el marcado, pero se presenta como
  una línea fina superpuesta en la esquina inferior izquierda:
  `LUQUE! · © 2026 — Estudio de fotografía y cine`, en negro sobre amarillo. Va a
  la izquierda porque el centro inferior lo ocupa `.spatial-hint`. No aparece en
  el hero.
- El navbar, que hoy aparece por scroll, aparece al activarse la galería.

## La secuencia

### Antes del botón

1. El preloader hace su animación de cuatro fotogramas, con el mínimo actual de
   1200 ms, y se desvanece en 700 ms.
2. Aparece `fin-de-carga.svg` (fase A) con un fundido de 600 ms.
3. Esa fase se sostiene **900 ms**.
4. Funde a la fase B —logotipo grande y roles— en **400 ms**.
5. El botón entra con un fundido de 300 ms y recibe el foco.

Los pasos 2 a 5 son fundidos, no saltos: es la marca asentándose, un momento
distinto del de la entrada.

### El disparo

Cuatro pasos de **200 ms**, 800 ms en total. Es la cadencia del preloader: sus
`0.8s` divididos en cuatro fotogramas.

| Paso | Qué ocurre |
|---|---|
| 0 | Las cuatro esquinas descansan en las esquinas del viewport, con margen de 22 px, el mismo que usa el visor. |
| 1 | Saltan hacia dentro **solo dos**, la diagonal superior-izquierda e inferior-derecha. |
| 2 | Saltan las otras dos. Las cuatro quedan ceñidas al logotipo: es el fotograma de foco conseguido. |
| 3 | Las cuatro salen de golpe más allá de los bordes, el logotipo desaparece y las doce fotos entran de una vez. |

Que en el paso 1 se muevan solo dos es lo que hace que la secuencia parezca un
autofoco tanteando en lugar de una animación.

Las fotos **cortan, no se desvanecen**. Un fundido traicionaría el ritmo: todo lo
demás en la secuencia es mecánico y discreto. Si al verlo en un navegador real
resulta demasiado brusco, la salida acordada es repartirlo en dos pasos, seis
fotos y seis, pero no se implementa de entrada.

El fondo amarillo no se interrumpe en ningún momento de los 800 ms. No hay
barrido ni capa que llegue: solo cambia qué hay encima del amarillo. Por eso la
galería no puede verse cortada — nunca está entrando.

### Cómo se anima

Con una **animación** de CSS y `steps(1, end)`, no con transiciones. Las cuatro
posiciones son fotogramas clave al 0, 25, 50 y 75 %.

Esto no es un detalle de estilo. Las dos veces que este proyecto se rompió con
movimiento fue por añadir una clase con `transition` y cambiar la propiedad
animada en el mismo tick, de modo que el navegador fundía ambos cambios en un
solo recálculo y la transición nunca arrancaba. Las animaciones no tienen ese
problema: arrancan al añadirse la clase, sin necesidad de forzar un reflujo.

### Movimiento reducido

Con `prefers-reduced-motion: reduce` se salta la secuencia entera: fundido de
200 ms del hero a la galería, sin saltos ni desplazamientos.

## El botón

Va en la fase B, **debajo de los roles**, que es donde la página se detiene y
espera una decisión. La fase A no lo lleva: dura un instante y avanza sola.

Se dibuja con las cuatro esquinas en L alrededor, igual que cada celda del
navbar. El botón es así una versión pequeña del marco que está a punto de
cerrarse.

Texto: **`ENTRAR`**, en mayúsculas con tracking amplio, como el resto de
etiquetas del sitio.

Recibe el foco al aparecer, así que quien navegue con teclado solo tiene que
pulsar `Enter`. Es un `<button>` real.

## Enlaces directos y la vuelta

**Los enlaces directos se saltan el hero.** Si la URL trae un proyecto o una
categoría (`#/bruma`, `#/editorial`), el preloader hace su trabajo y de ahí se
pasa directamente a la galería, sin fase A, sin fase B y sin botón. Quien recibe
un enlace a un trabajo concreto no quiere una portada.

**El hero no vuelve nunca.** Una vez retirado, navegar a `#/` o pulsar `Esc`
para quitar un filtro no lo resucita. Es un rótulo de entrada, no un destino.

Consecuencia aceptada: el botón «atrás» del navegador saca del sitio en lugar de
devolver al hero. Se descarta empujar una entrada al historial para evitarlo,
porque obligaría a tocar el enrutado y los casos límite de rutas ya han causado
tres defectos en este proyecto.

## Accesibilidad

- El botón es un `<button>` real, enfocado automáticamente al aparecer.
- Las cuatro esquinas del hero son decorativas: `aria-hidden="true"`.
- La secuencia respeta `prefers-reduced-motion`.
- Al entrar, el foco pasa al **contenedor de la galería**, que recibe
  `tabindex="-1"` para poder recibirlo sin entrar en el orden de tabulación.

  El foco **no** va al primer proyecto, aunque sería lo primero que uno piensa.
  La galería tiene un manejador de `focusin` que centra el lienzo sobre el
  proyecto enfocado, así que enfocar un proyecto al entrar desplazaría el lienzo
  de su posición de reposo justo en el fotograma en que acaba de aparecer.
  Poniendo el foco en el contenedor, la galería aterriza centrada y la primera
  pulsación de `Tab` lleva al navbar y de ahí a los proyectos.

## Riesgos

**El corte de las doce fotos.** Es la decisión más arriesgada y solo se puede
juzgar mirándola. La mitigación está acordada de antemano: repartir la entrada
en dos pasos de seis.

**Las esquinas del hero no son las del cursor ni las del visor.** Son un tercer
juego, propio de este componente. Van incrustadas como SVG en el marcado y se
colorean con `currentColor`, nunca cargadas como recurso externo desde el CSS:
esa vía ya dejó el cursor invisible bajo `file://` en una ocasión.

**Quitar GSAP toca el preloader**, que es lo primero que ve cualquier visitante.
Si los fundidos reescritos fallan, la web parece rota desde el primer segundo. Se
verifica antes que nada.

## Criterios de aceptación

1. La página no tiene scroll en ningún estado: el `body` no se desplaza ni con
   rueda, ni con teclado, ni con barra espaciadora.
2. Al pulsar `ENTRAR`, las cuatro esquinas recorren los cuatro pasos y la galería
   queda a pantalla completa, sin verse cortada en ningún fotograma.
3. El fondo amarillo no se interrumpe durante la transición.
4. Con `prefers-reduced-motion: reduce` no hay saltos: solo un fundido.
5. `#/bruma` y `#/editorial` abren directamente en la galería, sin hero.
6. El navbar aparece al entrar en la galería, no antes.
7. `index.html` abierto con doble clic **y sin conexión a internet** funciona por
   completo: no queda ninguna etiqueta que apunte a un CDN.
8. El botón se puede usar solo con teclado, y tras entrar el lienzo permanece en
   su posición de reposo: el foco va al contenedor, no a un proyecto.
9. Ningún archivo de `js/` supera las 300 líneas.
