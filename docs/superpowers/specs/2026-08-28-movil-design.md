# La versión móvil de LUQUE!

Diseño aprobado el 2026-08-28. Sustituye en móvil al lienzo espacial y al visor
de escritorio; no los toca.

## Por qué

El sitio se navega hoy con un lienzo de 120×102vw que se recorre moviendo el
ratón. En un móvil de 390px ese lienzo se mira por una ventana pequeña: las
cajas quedan en unos 70px y las etiquetas de categoría se recortan. Hay un
camino táctil desde el principio —`js/galeria-paneo.js:78`, arrastre directo con
inercia— así que **el problema no es que falte soporte, es que la metáfora
necesita una pantalla grande para existir.** Un espacio que se explora sólo se
siente explorable si cabe más de lo que se ve.

Lo que se conserva no es el lienzo. Es el **visor de una cámara**: las esquinas
en ángulo están en el cursor (`css/luque.css:140`), enmarcan cada categoría de la
barra y enmarcan el botón del hero. En escritorio el cursor encuadra aquello a lo
que apuntas. En móvil no hay cursor, así que **el encuadre se muda a la pantalla
entera**: el móvil pasa a ser la cámara.

## Lo que se construye

**Portada:** una rejilla irregular de dos columnas, desplazable, con los 12
trabajos. Cada uno lleva **sólo su número** —dos cifras amarillas con sombra,
arriba a la izquierda— y ninguna etiqueta encima. El número identifica el
trabajo, no su posición en pantalla: no cambia al filtrar. Antes de la rejilla
está el amarillo con LUQUE!, que **se va al deslizar hacia arriba, sin botón**:
el momento de marca se conserva y desaparece el peaje de un toque.

**El hero se ve una vez por visita, y no vuelve.** Desplazarse hacia arriba desde
lo alto de la rejilla no lo trae de vuelta: es una entrada, no una sección. Si
volviera, quien busque el principio de la rejilla se lo encontraría de nuevo cada
vez, y una puerta que se cruza dos veces deja de ser una puerta. Quien llegue por
un enlace profundo —`#/bruma`— **no lo ve en absoluto**: el enlace pedía un
trabajo concreto y anteponerle una portada sería desobedecerlo.

**Visor:** pantalla completa con el encuadre de cuatro esquinas y una rejilla de
dos ejes.

- **Horizontal** cambia de trabajo. 12 paradas.
- **Vertical** baja por las fotos del trabajo **hasta la ficha, que es el fondo
  del eje**.

Que la ficha esté al fondo no es decoración: **seis de los doce proyectos son de
vídeo y tienen `piezas: []`.** Si el eje vertical significara «más fotos», el
gesto no haría nada en la mitad del portafolio, y un gesto que a veces responde y
a veces no se siente roto. Significando «más sobre este trabajo», en un proyecto
de fotos bajas por sus imágenes hasta los créditos y en uno de vídeo llegas a los
créditos en un solo gesto. **El eje nunca se queda sin respuesta.**

**HUD:** pastillas amarillas con texto negro. Arriba, la categoría —tocarla
despliega las cuatro— y la equis para volver a la portada. Abajo, el título y el
contador `02/08`. **A los 3 segundos todo desaparece y queda la foto sola**; un
toque en cualquier sitio lo devuelve.

**Ampliar:** pellizcando con dos dedos, hasta los 2400px reales del archivo.

## Decisiones, y qué se descartó

### El texto va en negro, pero sobre amarillo

El amarillo suelto sobre una foto clara da 1,07:1 de contraste: ilegible. El
negro suelto sobre una foto oscura da ~1,2:1: **el mismo fallo, cambiado de
lado**. Como las fotos las sube el estudio, no se puede apostar por ninguno de
los dos.

La pastilla amarilla con texto negro da **17,6:1 pase lo que pase con la foto**,
porque el fondo del texto deja de ser la foto. No inventa lenguaje: es lo que ya
hace la barra de navegación de escritorio.

Se descartó un velo blanco degradado: funciona, pero blanquea el borde de todas
las fotos —lo que un estudio de fotografía no quiere— y mete en la paleta un
color que no está.

### Las esquinas se adaptan al brillo de la foto

Negras sobre foto clara, amarillas sobre foto oscura, midiendo la luminancia al
cargar.

**Con el contenido actual esto no puede funcionar, y está comprobado.** Medir
obliga a dibujar la foto en un lienzo y leer el píxel; `picsum.photos` no manda
`Access-Control-Allow-Origin` (comprobado sobre la respuesta final, tras la
redirección 302), así que el lienzo queda manchado y `getImageData` lanza una
excepción de seguridad. Con las fotos reales del estudio servidas desde
`lidialuque.com` vía R2 —mismo origen— funcionará.

Por eso **degrada en vez de romperse**: si el brillo no se puede medir, las
esquinas llevan un halo oscuro tenue, legible sobre cualquier fondo. Feo al lado
de lo automático; correcto siempre.

*El riesgo de esto:* que el halo se quede puesto meses en producción porque nadie
note que la medición nunca llegó a funcionar. **Contramedida obligatoria:** el
fallo se registra, y `docs/estado-conocido.md` dice que esta función está sin
verificar hasta que entren las fotos reales.

### La portada es una rejilla irregular, no una hoja de contactos

Se valoró una hoja de contactos clásica —los 12 numerados en una rejilla densa
con la perforación del carrete—. Da la vista de conjunto que el lienzo daba, pero
deja cada foto en 65px: **más pequeñas que las cajas que acabábamos de doblar de
tamaño en el commit `9092bf8`**, y por el mismo motivo por el que se doblaron.
Se conserva de ella el numerado.

También se valoró una tira por categoría. Separa el trabajo de cámara del de
fotografía, que a un cliente le importa, pero nunca enseña el conjunto y mete dos
gestos distintos en la misma pantalla.

### La categoría desaparece de la portada

Consecuencia de llevar sólo el número: desde la rejilla no se distingue un
editorial de un corto. **Las categorías viven en el HUD del visor**, en la
pastilla desplegable de arriba, que es donde ya hacía falta un control.

### Ampliar es pellizcar, no la lupa

La lupa de escritorio (`js/visor-lupa.js:48`) escucha `pointerdown`/`pointermove`
con `setPointerCapture`: en táctil eso es «mantén y arrastra», que es el mismo
dedo que necesita el deslizamiento. **En móvil no hay lupa.** Pellizcar es el
gesto que nadie tiene que aprender y da acercamiento continuo, no un salto fijo.

### El ocultado es a 3 segundos, no a 2

El escritorio oculta a los 2 (`js/visor-chrome.js:5`, `OCULTAR_TRAS = 2000`), pero
allí el chrome se despierta con cualquier movimiento del ratón: gratis y
constante. **En táctil hay que tocar a propósito**, así que despertar cuesta más
y el plazo se alarga para compensar.

**`VisorChrome` no se generaliza.** Su despertar está atado a `mouseenter` y
`mouseleave` sobre la tira de miniaturas, que en móvil no existe, y el plazo es
distinto. Tocar un módulo que funciona en producción para compartir un
temporizador de tres líneas es mal negocio: se duplica el temporizador y se
escribe el motivo en el código.

### Cuando falta un dato de la ficha se escribe `######`

Toque de identidad del estudio.

**Precisión sobre el punto de partida:** hoy no hay ningún guion que sustituir.
`js/visor-ficha.js:31` hace `dd.textContent = f[1]` a pelo, y los 48 campos de
ficha de `contenido.json` están rellenos. Si uno llegara vacío hoy saldría un
hueco en blanco. Esto no cambia una convención: **decide una que no existía**, y
hará falta en cuanto el panel deje editar los campos de la ficha.

Dos consecuencias:

- **Vale también para el escritorio.** Un toque de identidad que sólo aparece en
  el móvil no es identidad, es inconsistencia.
- **Se ve `######` y se anuncia «dato no disponible».** Leído tal cual por un
  lector de pantalla, `######` es ruido. La marca se conserva sin dejar a nadie
  fuera.

## Arquitectura

### Misma página, misma URL, mismos datos

Nada de un `/m` aparte. El motivo está pagado ya: `js/reglas-contenido.js` existe
porque la lista de categorías estaba copiada en dos sitios y podían divergir.
Duplicar `datos.js`, `router.js` y `contenido.js` recrearía ese riesgo
multiplicado. Y un enlace que el estudio mande desde el móvil tiene que abrir el
mismo sitio en el ordenador de quien lo recibe.

| Capa | Qué pasa |
|---|---|
| `contenido.js`, `datos.js`, `reglas-contenido.js` | Intactos. No saben en qué dispositivo están |
| `router.js` | Se le añade un segundo tramo (ver abajo) |
| `galeria*.js`, `visor*.js` | Intactos. Siguen siendo el escritorio |
| `movil-*.js` | La otra forma de pintar los mismos datos |
| Worker, despliegue, `noindex`, auditor de rutas | No se tocan |

### El interruptor es el ancho, no el dedo

`(max-width: 860px)`. Una ventana de escritorio estrechada a 700px tampoco puede
alojar un lienzo de 120vw: **el problema es el espacio, no el puntero.** El tipo
de puntero decide otra cosa —qué gestos se enganchan—. Un portátil táctil ancho
sigue siendo escritorio.

Al girar el móvil o redimensionar, la consulta cambia de lado y la galería se
reconstruye con los datos que ya están en memoria: sin recargar y sin perder la
posición.

### Los módulos nuevos

La frontera es la que ya sigue el código: `js/visor-estado.js` son 78 líneas de
máquina de estado con 13 pruebas; `Lista.pintar` no tiene ninguna porque
construye DOM. **Lo puro se separa de lo que toca el DOM para que lo puro se
pueda probar.**

Lógica pura:

- **`js/movil-recorrido.js`** — el corazón. Guarda `{proyecto, pieza}` y responde
  a `mover('izquierda'|'derecha'|'arriba'|'abajo')`. Sabe que un proyecto de
  vídeo tiene cero piezas y que bajar lleva a la ficha. Toda la inteligencia de
  los dos ejes, sin un solo `document.`
- **`js/movil-gestos.js`** — convierte eventos de puntero en intenciones:
  `izquierda`, `abajo`, `toque`, `pellizco`. Aislado se puede comprobar que un
  arrastre de 12px en diagonal no es un deslizamiento.
- **`js/brillo.js`** — dado un valor de luminancia decide `claro` u `oscuro`. La
  medición es impura; el umbral y el camino de degradación no.

Tocan el DOM:

- **`js/movil-hoja.js`** — la portada: rejilla irregular, numerada, con el hero
  fundido encima.
- **`js/movil-visor.js`** — el marco, el HUD y el ocultado a los 3 s.

Y **`js/movil.js`**, el interruptor: mira la consulta de medios, llama a un lado o
a otro, y reconstruye al cruzar el umbral.

Todos por debajo del techo de 300 líneas, con el patrón `window.Nombre` de ES5
que usa el resto de `js/`.

## El flujo de datos

El arranque bifurca en un solo punto. `contenido.js` pide el JSON →
`reglas-contenido.js` lo valida → `datos.js` puebla `PROYECTOS`. Idéntico en los
dos dispositivos. Al final, `movil.js` llama a `Galeria.construir()` o a
`MovilHoja.pintar()`. **Nada aguas arriba sabe que existe un móvil.**

### Las URLs llevan un segundo tramo

`js/router.js:4` sólo entiende un nivel: `#/editorial` o `#/bruma`; lo que no
reconoce cae a `todos`. Se le añade un segundo tramo opcional para la pieza:
`#/bruma/3`. Así se puede enlazar una foto concreta, y el escritorio podrá
aprovecharlo.

Forma exacta de las rutas, para que no queden a interpretación:

| Ruta | Qué abre |
|---|---|
| *(vacía)* | La portada con los 12 |
| `#/editorial` | La portada **filtrada** a esa categoría. La rejilla enseña sólo sus trabajos; los números no cambian |
| `#/bruma` | El visor en `bruma`, por su portada |
| `#/bruma/3` | El visor en `bruma`, **tercera pieza** |
| `#/bruma/ficha` | El visor en `bruma`, con la ficha abierta — el fondo del eje vertical |

**Las piezas se numeran desde 1**, igual que el contador `02/08` que ve quien mira.
Un número fuera de rango o un tramo que no se entienda cae al proyecto por su
portada, no a la portada general: es el fallo menos destructivo de los dos, porque
conserva lo que el enlace sí traía bien.

**La trampa, y el requisito que sale de ella:** si cada deslizamiento empujara
una entrada al historial, salir de un proyecto de ocho fotos exigiría pulsar
«atrás» ocho veces. Por tanto: **se empuja historial al cambiar de proyecto y se
reemplaza al cambiar de foto** (`pushState` frente a `replaceState`).

Es código compartido con el escritorio. **Sus pruebas se amplían antes de
tocarlo.**

### Las imágenes

| | Tamaño | En móvil |
|---|---|---|
| `portada` | 1200×1500 (167 KB) | La rejilla de la portada |
| `piezas[].url` | 2400×3000 (746 KB) | El visor y el pellizco |
| `piezas[].miniatura` | 200×250 (19 KB) | **Sin usar**: no hay tira de miniaturas |

De ahí un requisito: **carga progresiva.** Al entrar en un proyecto la portada ya
está en caché porque venías de verla en la rejilla; se muestra esa mientras llega
la de 746 KB y se cambia al terminar. Sin eso, cada deslizamiento en 4G es un
segundo de negro.

## Cuando algo falla

| Qué pasa | Qué se ve |
|---|---|
| El JSON no carga | El mismo aviso que hoy; no se inventa uno nuevo |
| Una foto de la rejilla no carga | Su marco se queda, con su número. Un hueco numerado se lee como «falta esa», no como «la web está rota» |
| No se puede medir el brillo | Esquinas con halo oscuro. Se registra |
| Arrastre corto o diagonal | No es un deslizamiento. Zona muerta explícita |
| Dos dedos en pantalla | Manda el pellizco; el deslizamiento se cancela hasta soltar |
| El Vimeo no carga | El póster con un enlace a Vimeo, no un rectángulo negro |
| Se gira el móvil dentro del visor | Se conserva la posición: mismo proyecto, misma foto |

## Dos cosas del sistema operativo

No salen del código de este repositorio sino del comportamiento de los móviles, y
están aquí para que no se descubran con el trabajo hecho.

**El deslizamiento horizontal choca con el «atrás» del navegador.** En Safari de
iOS, arrastrar desde el borde izquierdo hacia dentro vuelve a la página anterior,
y no se puede desactivar desde la web; en Chrome de Android ocurre en los dos
bordes. Un deslizamiento que empiece en los ~20px del borde se lo queda el
navegador.

No es fatal —es con lo que vive cualquier carrusel de la web— pero obliga a que
ningún control quede en esa franja y a **probarlo en un iPhone de verdad**: en un
navegador de escritorio encogido esto no ocurre, y daríamos por bueno algo que
falla en el dispositivo real.

**Tirar hacia abajo recarga la página.** El gesto «foto anterior» empezando
arriba dispara el *pull-to-refresh* de Chrome. Se apaga con
`overscroll-behavior-y: contain`, pero hay que ponerlo a propósito: por omisión,
la web se recarga en mitad del recorrido.

## Cómo se prueba

Al arnés del navegador (`tests/test.html`, hoy 99 comprobaciones) entran:

- **`movil-recorrido.js`** — que en un proyecto de vídeo bajar lleve a la ficha en
  un paso; que en el último proyecto deslizar a la derecha no salga al vacío; que
  girar no mueva la posición.
- **`movil-gestos.js`** — la zona muerta; que dos dedos cancelen el deslizamiento
  en curso.
- **`brillo.js`** — el umbral, y **que un lienzo manchado devuelva el tratamiento
  seguro en vez de propagar la excepción**. Es la única forma de ejercitar el
  camino de degradación sin las fotos reales.
- **`router.js`** — sus 10 pruebas actuales más las del segundo tramo y la regla
  del historial, escritas antes de tocarlo.

Y la comprobación de que las pruebas no son de mentira: romper cada módulo a
propósito y contar cuántas se ponen en rojo.

### El arnés de DOM entra en este trabajo

`movil-hoja.js` y `movil-visor.js` tocan el DOM, así que caerían donde ya están
`Lista.pintar` y `panel/js/panel.js`: sin cobertura.

Cuando esa deuda se aplazó al bloque 3c, el argumento era que el arnés se
diseñara una sola vez, al existir la segunda pantalla. **Con estos dos módulos
serían cuatro sitios sin cobertura, y el argumento se da la vuelta:** conviene
construir el arnés dentro de este trabajo y saldar de paso lo que ya se debía.

### Lo que sólo puede juzgar el estudio, en un móvil real

El tacto de los gestos, si 3 segundos es el plazo correcto, si el pellizco
responde como se espera, y si el ocultado se siente elegante o se siente como que
la web se apaga sola. Ninguna prueba puede decirlo.

## Fuera de alcance

- **`/panel`.** Es la herramienta de trabajo del estudio, no la web pública.
  Adaptarla es otro problema con otras prioridades.
- **El escritorio.** No cambia nada salvo el segundo tramo del router y la
  convención `######` de la ficha, que se comparten a propósito.
- **Quitar el `noindex`.** Sigue atado a que entren los trabajos reales y las
  tipografías con licencia, no a este trabajo.

## Riesgos abiertos

1. **Las esquinas automáticas no se pueden verificar hasta que haya fotos propias
   servidas desde `lidialuque.com`.** Hasta entonces sólo se comprueba el camino
   de degradación.
2. **El arnés de DOM es trabajo nuevo de tamaño desconocido** y este diseño lo
   convierte en requisito. Si resulta mucho más caro de lo previsto, la decisión
   de meterlo aquí hay que revisarla en voz alta, no en silencio.
3. **El deslizamiento en los bordes** depende de comportamiento del sistema que
   no controlamos y que cambia entre versiones de iOS y Android.

## Sobre el tamaño de esto

Este documento describe un trabajo grande: la entrada, la portada, el visor de
dos ejes, el reconocedor de gestos, el brillo, el segundo tramo del router, la
convención `######` en los dos dispositivos y un arnés de DOM que hoy no existe.

**No es un solo bloque de implementación y no debe planificarse como tal.** El
plan que salga de aquí tiene que partirlo, y hay un orden que se impone solo:

1. **El arnés de DOM primero.** Es lo que permite probar todo lo demás, y salda
   la deuda de `Lista.pintar` y `panel/js/panel.js` que ya existe.
2. **El segundo tramo del router**, con sus pruebas ampliadas antes de tocarlo.
   Es código compartido: si se rompe, se rompe el escritorio.
3. **Lo puro**: recorrido, gestos, brillo. Se prueban sin navegador.
4. **Lo que pinta**: hoja, visor, hero fundido.
5. **La convención `######`**, que es pequeña y toca los dos dispositivos.

Los pasos 1 y 2 no producen nada visible en el móvil. Conviene saberlo antes de
empezar, para que su falta de resultado aparente no se lea como falta de avance.
