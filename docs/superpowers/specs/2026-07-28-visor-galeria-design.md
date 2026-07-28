# Visor de proyecto y galería filtrable — LUQUE!

Fecha: 2026-07-28

## Objetivo

Hoy la galería espacial muestra doce fotos sueltas y hacer clic en ellas no lleva a
ninguna parte. Este diseño convierte cada foto en la portada de un proyecto que se
puede abrir, recorrer y examinar, y convierte el menú de categorías en un filtro que
de verdad recompone la galería.

Todo lo nuevo se construye con el vocabulario visual que la página ya tiene: las
cuatro esquinas en L del cursor y del navbar, el amarillo y el negro planos, el
kerning cerrado y la curva de movimiento `cubic-bezier(.2,.7,.2,1)`.

## Alcance

Dentro:

- Visor de proyecto a pantalla completa, con modo serie de imágenes y modo vídeo.
- Modo lupa dentro del visor, a resolución nativa.
- Ficha técnica desplegable.
- Filtrado real por categoría desde el navbar, con recomposición del lienzo.
- Enlaces directos por proyecto y por categoría.
- Carga diferida de imágenes.
- Navegación por teclado del lienzo y del visor.
- Separación del `index.html` monolítico en módulos.

Fuera, decidido explícitamente:

- Brújula o minimapa del lienzo.
- Modo hoja de contactos como vista alternativa de la galería.
- Comparar dos piezas lado a lado dentro del visor.
- Cualquier backend o CMS. El contenido vive en un archivo de datos.

## Arquitectura

### Estructura de archivos

`index.html` tiene hoy 1.094 líneas con estilos, marcado y cinco sistemas de
JavaScript mezclados. Añadirle el visor lo llevaría por encima de las 2.000. Se
separa en módulos con una responsabilidad cada uno:

```
index.html          marcado
css/luque.css       estilos
js/datos.js         la lista de proyectos
js/router.js        traduce la URL a estado y viceversa
js/galeria.js       lienzo espacial, paneo y filtrado
js/visor.js         el visor de proyecto
js/cursor.js        el cursor-visor y sus tres estados
js/hero.js          preloader y secuencia de entrada
```

Los módulos se cargan con etiquetas `<script src>` clásicas, sin `type="module"` ni
`fetch`. Esto es deliberado: la web debe seguir funcionando al abrir el `index.html`
con doble clic, sin servidor. Un JSON externo o los módulos ES lo impedirían por las
restricciones de origen del navegador sobre `file://`.

Dependencias entre módulos: `datos.js` no depende de nadie. `galeria.js` y `visor.js`
leen de `datos.js`. `router.js` es quien decide qué está abierto y avisa a los otros
dos. `cursor.js` expone el control de sus esquinas para que `visor.js` pueda tomarlas
prestadas durante la transición. `hero.js` es independiente del resto.

### Modelo de datos

Un único array en `js/datos.js`. Cada proyecto:

```js
{
  id: 'bruma',
  titulo: 'Bruma',
  categoria: 'editorial',
  portada: 'img/bruma/01.jpg',
  ficha: {
    cliente: 'Vogue ES',
    anio: 2025,
    camara: 'Alexa Mini',
    optica: 'Zeiss Super Speed'
  },
  piezas: ['img/bruma/01.jpg', 'img/bruma/02.jpg'],
  pos: { x: 88, y: 40, w: 17 }
}
```

- `id` es único y se usa en la URL.
- `categoria` es una de `foto-stills`, `editorial`, `videoclip`, `cortometraje`.
- `pos` está en unidades `vw` sobre el lienzo, igual que los valores escritos a mano
  hoy en el HTML.
- `piezas` y `video` son excluyentes. Un proyecto con `piezas` abre en modo serie; uno
  con `video: { src, poster }` abre en modo vídeo. Si un proyecto trae los dos, se
  ignora `video` y se registra un aviso en consola.

`pos` se mantiene escrito a mano y no calculado. La dispersión desordenada de las
fotos en el lienzo es una decisión de composición, no un resultado algorítmico.

La galería y el visor se construyen a partir de este array. No hay marcado de
proyectos escrito a mano en `index.html`.

### Enrutado

Un router mínimo sobre el fragmento de la URL, con dos formas:

- `#/<id-proyecto>` abre el visor sobre ese proyecto.
- `#/<categoria>` aplica el filtro de esa categoría.
- Sin fragmento, la galería completa sin filtro y sin visor.

El fragmento se compara primero contra los cuatro nombres de categoría y solo después
contra los identificadores de proyecto. Ningún `id` puede coincidir con un nombre de
categoría; `datos.js` lo comprueba al arrancar y avisa por consola si ocurre.

Los enlaces del navbar pasan a apuntar a `#/editorial` y equivalentes. El router es la
única fuente de verdad sobre qué está abierto: la galería y el visor reaccionan a sus
cambios, nunca se llaman entre sí directamente. Abrir la web con un fragmento de
proyecto salta el hero y muestra el visor ya montado, sin animación de apertura, ya
que no hay una foto de origen desde la que crecer.

## La galería

### Filtrado

Al pulsar una categoría del navbar:

1. Los proyectos que no pertenecen se desvanecen y dejan de recibir el ratón.
2. Los que quedan viajan a una composición compacta que cabe en poco más de una
   pantalla.
3. Los límites de paneo del lienzo se contraen para ajustarse a esa composición.

La composición compacta se genera a partir de una tabla fija de posiciones
asimétricas definida en `galeria.js`, asignadas por orden. No es aleatoria: dos
visitas a la misma categoría dan el mismo resultado. Con hasta seis proyectos por
categoría hay posición para todos; a partir del séptimo la tabla se repite desplazada
hacia abajo y el lienzo crece en vertical.

Volver a pulsar la categoría activa devuelve a todos a su posición de `pos` y restaura
los límites originales. `Esc` hace lo mismo, pero solo cuando el visor está cerrado:
mientras el visor está abierto es él quien consume la tecla.

La celda activa del navbar se marca invirtiendo el relleno de sus esquinas en L, que
ya están dibujadas en el SVG. No se añade ningún elemento nuevo al navbar.

### Teclado

El lienzo es alcanzable con tabulación y cada proyecto es un elemento enfocable.
Al enfocar un proyecto con el teclado, el lienzo se desplaza para centrarlo, usando la
misma animación que ya usa la navegación por categorías. `Enter` abre el visor.

### Carga de imágenes

Las portadas del lienzo llevan `loading="lazy"`. Las piezas interiores de cada serie
no se cargan hasta que se abre el visor.

## El visor

### Marco

Escenario negro a pantalla completa, por encima de todo. El navbar se oculta mientras
el visor está abierto. Las cuatro esquinas en L, en amarillo, ancladas a las esquinas
del viewport.

- Arriba a la izquierda: título del proyecto y categoría.
- Arriba a la derecha: contador de posición en la serie y cierre.
- Abajo: la tira de negativo con las miniaturas de la serie. La pieza activa va
  enmarcada por unas esquinas más pequeñas.

La imagen se muestra al mayor tamaño que quepa respetando márgenes, sin recortar.

### Interfaz que se retira

A los dos segundos sin movimiento de ratón ni pulsaciones, todo lo que no es la foto
se desvanece. Vuelve con cualquier movimiento o tecla. La imagen nunca se atenúa.
El temporizador se detiene mientras el puntero está sobre la tira de negativo.

### Controles

| Acción | Entrada |
|---|---|
| Anterior / siguiente | Flechas izquierda y derecha, o rueda |
| Saltar a una pieza | Clic en su miniatura |
| Entrar y salir de lupa | Clic sobre la foto |
| Ficha técnica | Tecla `i` |
| Cerrar | `Esc`, o el cierre de arriba a la derecha |

`Esc` se resuelve por capas, de dentro afuera: primero sale de la lupa, si no hay lupa
cierra la ficha, y si tampoco hay ficha cierra el visor.

Al llegar al final de la serie no se salta al principio: el avance simplemente se
detiene. Encadenar series distintas confundiría sobre dónde termina un proyecto.

### Lupa

Un clic sobre la foto la lleva a su resolución nativa y permite arrastrarla para
recorrerla. El cursor abandona el modo encuadre y vuelve a su tamaño pequeño: vuelve a
enfocar.

Un solo nivel de aumento, sin rueda ni porcentajes. O se ve la composición o se ve el
grano. Si la imagen a resolución nativa es más pequeña que el hueco disponible, la
lupa no se activa y el clic no hace nada.

### Ficha técnica

La tecla `i` despliega desde la izquierda un panel amarillo con cliente, año, cámara y
óptica, de unos 340 px. La foto se recoloca dentro del espacio restante en lugar de
quedar tapada. Se pulsa otra vez y se retira. Nunca aparece por defecto.

### Modo vídeo

El mismo marco exacto. El reproductor ocupa el hueco de la foto y la tira inferior
pasa a ser la línea de tiempo, con las mismas esquinas marcando la posición actual.
Sin controles nativos del navegador: espacio o clic para reproducir y pausar, y
arrastre sobre la línea para buscar. La ficha técnica y el cierre funcionan igual.

### Estado de carga

Mientras una pieza carga se muestra la secuencia de cuatro fotogramas del preloader,
en amarillo sobre negro. Los símbolos SVG ya existen en el archivo y se reutilizan sin
dibujar nada nuevo.

Al abrir un proyecto se precargan la pieza actual y la siguiente. Al navegar, se
precarga la siguiente en la dirección del movimiento.

## La transición

Los estados de reposo y encuadre del cursor ya existen. Lo nuevo empieza al hacer
clic.

### Apertura

1. Se captura el rectángulo actual de la `<img>` del proyecto.
2. Esa misma `<img>` se promociona a posición fija sobre ese rectángulo. No se crea un
   duplicado: es la misma imagen la que viaja.
3. El escenario negro entra por opacidad, por detrás de la foto.
4. La foto crece hasta su posición final mientras su `grayscale(35%)` baja a cero.
5. Las cuatro esquinas del cursor, ya ancladas a la foto, dejan de seguir al ratón y
   viajan a las esquinas del viewport, cambiando de negro a amarillo por el camino.
6. Cuando la foto aterriza, y solo entonces, entra la interfaz: título, contador y
   tira de negativo.

Duración total 620 ms, con la curva `cubic-bezier(.2,.7,.2,1)` que la página ya usa.

### Cierre

El mismo camino al revés. El rectángulo de destino se recalcula en el momento de
cerrar, no se guarda el de la apertura.

Para que ese destino no se mueva bajo los pies, el lienzo espacial se congela mientras
el visor está abierto: deja de responder al ratón y retoma exactamente donde estaba al
cerrarse.

### Casos aparte

- **Táctil.** No hay cursor, así que las esquinas no viajan: aparecen ya colocadas
  cuando la foto termina de crecer.
- **Movimiento reducido.** Con `prefers-reduced-motion: reduce`, toda la secuencia se
  sustituye por un fundido de 200 ms sin desplazamiento ni escalado.
- **Entrada por URL.** Abrir directamente `#/bruma` monta el visor sin animación, ya
  que no hay foto de origen.

## Accesibilidad

- El visor es un diálogo modal: recibe el foco al abrirse, lo atrapa mientras está
  abierto y lo devuelve al proyecto de origen al cerrarse.
- Todo lo operable con ratón lo es con teclado, incluido el arrastre de la lupa, que
  responde a las flechas.
- Las imágenes toman su texto alternativo del título del proyecto y su posición en la
  serie.
- La tira de negativo es una lista de botones, no de imágenes decorativas.

## Riesgos

**La lupa con imágenes muy grandes.** Una foto de 6.000 px a resolución nativa puede
consumir memoria de forma notable en portátiles modestos. Se mitiga cargando la
versión de resolución completa solo al entrar en lupa, y liberándola al salir.

**La recomposición del filtrado.** Animar doce elementos de posición a la vez puede
ir a tirones si coincide con la carga de imágenes. Se mitiga animando únicamente
`transform`, nunca `left` y `top`, y desactivando el paneo durante la recomposición.

**El congelado del lienzo.** Si el visor se cerrase sin descongelar, la galería
quedaría muerta al ratón. El descongelado va en el mismo punto que devuelve el foco,
de modo que ambos ocurren o ninguno.

## Criterios de aceptación

1. Hacer clic en cualquier proyecto abre el visor con la transición descrita, y
   cerrarlo devuelve la foto a su sitio exacto en el lienzo.
2. Añadir un proyecto nuevo consiste en añadir un objeto a `js/datos.js` y nada más.
3. Pulsar una categoría desvanece el resto y recompone el lienzo; volver a pulsarla lo
   restaura.
4. `luque.com/#/bruma` abre la web con el visor de ese proyecto ya montado.
5. La web sigue funcionando abriendo `index.html` con doble clic, sin servidor.
6. El visor completo es operable solo con teclado, y `Esc` sale capa a capa.
7. Con `prefers-reduced-motion: reduce` no hay desplazamientos ni escalados.
8. Ningún archivo de `js/` supera las 300 líneas. `visor.js` es el candidato más
   probable a rebasarlas; si ocurre, la lupa sale a `js/visor-lupa.js`.
