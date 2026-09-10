# El contenido real de LUQUE!

Sustituir los doce proyectos de relleno por los ocho que Lidia Luque ha
entregado, servidos desde el bucket de R2 que el bloque 3a construyó y que
lleva desde entonces vacío.

Hasta hoy la web enseñaba fotos de `picsum.photos` con fichas inventadas. Todo
lo que se ha construido en nueve bloques —la galería componible, el visor, el
panel, el móvil de dos ejes— estaba probado contra contenido que no existía.
Este bloque mete el contenido de verdad, y al hacerlo descubre en qué se
equivocó el modelo de datos.

## Lo que se construye

**Ocho proyectos**, en dos de las cuatro categorías, con el orden y las
portadas que la artista eligió.

**Las imágenes servidas desde `lidialuque.com/img/...`**, mismo origen, en vez
de desde un tercero. 65 fotos por tres medidas cada una: 195 objetos, 43,7 MB.

**Una ficha que dice lo que la artista cuenta**, no lo que el esquema de
ejemplo suponía.

**Un botón que lleva al vídeo donde esté publicado**, en la pastilla amarilla
que el sitio ya usa, para los proyectos que apuntan a una plataforma externa.

**Una herramienta de derivación** que convierte originales de cámara en las
tres medidas de la web, para que esto se pueda repetir cada vez que Lidia
publique obra nueva.

## El material, medido

El portafolio entregado el 2026-09-10 son **65 fotos y dos `TEXTOS.docx`,
535,5 MB** de originales de cámara: JPEG de entre 4 y 25 MB, a resoluciones de
1920×1080 a 5760×3840, en vertical 2:3, horizontal 3:2 y 16:9.

| Categoría | Proyecto | Fotos | Año | Cliente | Papel |
|---|---|---:|---|---|---|
| editorial | La Boquerona | 10 | 2026 | Harper's Bazaar | DoP |
| editorial | La Rosa Roja de Zamarrilla | 9 | 2026 | Overdue Magazine, Issue 08 «Myth» | DoP |
| editorial | The In-Between | 10 | 2025 | New Wave Magazine | Gaffer |
| editorial | Monstruación | 9 | 2025 | Fashion Film | 1AC |
| videoclip | Nuncaestuvetan · Carmona | 6 | 2026 | — | Grabación y edición |
| videoclip | TUKATU · Noche absoluta ft. Alandes | 6 | 2025 | — | Gaffer |
| videoclip | Momento mágico · TG&SOA | 5 | 2026 | — | Grabación y edición |
| videoclip | Conejita Playboy | 10 | 2026 | — | Grabación y edición |

**Dos cosas las decidió la artista y no se tocan.** La portada de cada proyecto
va marcada en el nombre del archivo (`ESTA PORTADA.jpg`, `ESTE PORTADA.jpg`), y
los ocho la tienen. Y el orden va numerado del 1 al 4 en cada `TEXTOS.docx`, un
orden que **no** coincide con el alfabético de las carpetas. Como
`js/composicion.js` genera la galería desde el orden de la lista, respetar esa
numeración es respetar cómo quiere ella que se lea su trabajo.

## Decisiones, y qué se descartó

### Los originales no se suben a ninguna parte

535,5 MB son el archivo maestro del estudio. No van al repositorio —que se
despliega entero con `git archive`— ni a R2. Se quedan donde están, con la
copia de seguridad que el estudio tenga.

Lo que sube es lo derivado: **43,7 MB**, un 8% del original. Y no es una
optimización opcional. `TOPE_IMAGEN` en `worker/src/publicar.js` rechaza con un
413 cualquier imagen de más de 5 MB, así que **37 de las 65 fotos no entrarían**
aunque quisiéramos —contado, no estimado—. Y el bloque 2 ya se comió este fallo por el
otro lado: la galería acabó pidiendo las piezas a tamaño completo, 8,7 MB en
vez de 0,8, y por eso la portada volvió a tener imagen propia.

### La medida es el lado largo, no una caja de proporción fija

El presupuesto escrito en `docs/estado-conocido.md` da tres medidas —1200×1500,
2400×3000, 200×250— que suponen **fotos verticales 4:5**. Ninguna foto de Lidia
lo es.

Encajando dentro de una caja 2400×3000 sin recortar, una vertical 2:3 topa por
el alto y sale 2000×3000, pero una horizontal 3:2 topa por el ancho y sale
2400×1600: **un 20% menos de lado largo para las horizontales, sin ninguna
razón**. La medida pasa a ser el lado largo —3000, 1500 y 250—, con lo que
todas las fotos valen lo mismo mire donde mire la cámara.

**Se descartó recortar todo a 4:5**, que daría una rejilla uniforme y es lo que
el diseño original suponía. Recortar el encuadre de una fotógrafa no es una
decisión de quien escribe el código, y las horizontales 3:2 y 16:9 perderían
casi la mitad de la imagen.

### La ficha pasa a ser cliente / año / papel / enlace

El esquema de ejemplo pedía `cliente`, `anio`, `camara` y `optica`. **En los
ocho proyectos reales no hay un solo dato de cámara ni de óptica.** En cambio
hay uno que el esquema no contemplaba y que aparece en los ocho: **el papel de
Lidia en el rodaje** —DoP, Gaffer, 1AC, «grabación y edición al completo»—, que
es lo que ella eligió contar de su propio trabajo.

Un esquema que pide cuatro datos y recibe dos no es un esquema, es una ficha
medio vacía. Se ajusta al material:

| Campo | De dónde sale | Falta en | Si falta |
|---|---|---|---|
| `cliente` | la publicación o el artista | Conejita Playboy | `######` |
| `anio` | el año entre paréntesis | ninguno | `######` |
| `papel` | el crédito de rodaje | ninguno | `######` |
| `enlace` | la URL del vídeo | los cuatro editoriales | no se pinta el botón |

`enlace` se comporta distinto que los otros tres a propósito, y por eso lleva su
propia columna: los tres primeros son **datos** y un dato que falta se marca,
mientras que `enlace` es **un control** y un control que no lleva a ninguna parte
se omite en vez de enseñarse apagado. Ver «Los vídeos no se reproducen».

**Se descartó conservar `camara` y `optica` vacíos** a la espera de que Lidia
los rellene. Un campo que nadie ha pedido y nadie ha rellenado no es una puerta
abierta al futuro: es una ficha que sale con dos huecos el primer día. Si algún
día los datos técnicos importan, añadir un campo es más barato que explicar por
qué llevan un año en blanco.

**Consecuencia para el bloque 4g.** La spec del móvil justificaba la convención
`######` diciendo que «hoy no hay ningún guion que sustituir: los 48 campos de
ficha están rellenos». Deja de ser cierto en cuanto entra este bloque:
**Conejita Playboy no trae cliente**, así que la convención pasa de hipotética a
visible el primer día.

Es **un** hueco, no muchos, y conviene decirlo con precisión: el `enlace` que
falta en los cuatro editoriales no produce ninguno, porque un control ausente se
omite en lugar de marcarse. Un hueco basta para que la convención tenga que
existir y estar probada, pero no hay que exagerar el número: el que lea esto
dentro de seis meses merece la cifra real.

### Los vídeos no se reproducen: se enlazan con un botón propio

Tres de los cuatro proyectos de videoclip traen enlace, y los tres a YouTube.
El reproductor no los admite: `js/visor-video.js`, en su función de pintado,
asigna la URL a un `<video>` nativo, que sólo acepta la dirección de un archivo
de vídeo. Una página de YouTube puesta ahí no reproduce nada.

Los cuatro proyectos de videoclip se publican como **galería de fotogramas**,
que es exactamente lo que las carpetas traen —stills y fotogramas del rodaje—,
y el vídeo se alcanza con **un botón que lleva a la plataforma donde está
publicado**.

**El botón es la pastilla amarilla que el sitio ya tiene.** No se inventa un
lenguaje: `css/luque.css` la usa dos veces —la navbar fija del escritorio y las
pastillas del HUD móvil— y el propio CSS razona por qué, con los 17,6:1 de
contraste del negro sobre `--yellow`. Un botón nuevo con otro aspecto sería un
tercer lenguaje en una web que tiene uno.

Cuatro cosas que lo definen:

- **Es un `<a>`, no un `<button>`.** Lleva a otro sitio; un botón promete una
  acción dentro de la página. Con `<a>` funcionan el clic central, «abrir en
  pestaña nueva» y el lector de pantalla, que anuncia enlace y no botón.
- **Abre fuera**, con `target="_blank"` y `rel="noopener noreferrer"`. `noopener`
  no es opcional: sin él la página de destino recibe una referencia a la
  nuestra y puede redirigirla.
- **Dice a dónde va**, y el nombre de la plataforma **se deduce del anfitrión de
  la URL**, no se guarda en `contenido.json`. Un campo `plataforma` escrito a
  mano puede contradecir al `enlace` que tiene al lado, y una frase que el dato
  de al lado desmiente es el fallo característico de este proyecto. La etiqueta
  queda «Ver en YouTube», o «Ver el vídeo» si el anfitrión no se reconoce.
- **Sin logotipo de la plataforma.** La restricción global dice que no hay
  recursos externos referenciados desde el CSS, porque bajo `file://` el
  navegador los bloquea. Si hace falta una forma —una flecha de «sale fuera»—
  va incrustada en el marcado y se colorea con `currentColor`, como el resto.

El botón vive donde vive la ficha, y por tanto aparece **en el escritorio y en
el móvil**: `js/visor-ficha.js` y `js/movil-ficha.js`. En un proyecto sin
`enlace` no se pinta nada —ni el botón ni un hueco—, que es distinto de un campo
de ficha vacío: un dato que falta se marca con `######`, pero un botón que no
lleva a ninguna parte no se enseña apagado, se omite.

**Se descartó incrustar un `<iframe>` de YouTube.** Sería lo más barato, pero
mete un recurso de terceros en una web que hoy no tiene ninguno, con el rastreo
de Google detrás, y trae un reproductor con aspecto ajeno al del sitio.
**Se descartó subirlos a Vimeo**, que conservaría el `<video>` nativo y el
control del aspecto, porque exige que el estudio cree una cuenta y vuelva a
subir los vídeos, y eso no está en la mano de este bloque.
**Se descartó el enlace como fila de texto más de la ficha**, que era la primera
propuesta: una URL de YouTube en una lista de datos técnicos se lee como un dato
más y no como «aquí está la pieza». Es el trabajo de la artista; merece un
control propio.

**Consecuencia: `js/visor-video.js` se queda sin ningún consumidor**, igual que
`Brillo`. En este proyecto eso no es un detalle: es exactamente la situación que
`docs/estado-conocido.md` existe para registrar, y la rama `tipo === 'video'`
de `ReglasContenido.validar` queda sin contenido que validar.

### Las cuatro categorías se quedan, aunque dos estén vacías

`ReglasContenido.CATEGORIAS` declara `foto-stills`, `editorial`, `videoclip` y
`cortometraje`. El material real sólo llena dos.

Se conservan las cuatro. Lidia todavía no ha entregado cortometraje ni
foto-stills, y las entregará: son el trabajo que el estudio hace, no una lista
provisional. Quitarlas ahora obligaría a volver a añadirlas —con su prueba, su
validación y su barra de filtros— dentro de unos meses.

Queda por decidir **qué se ve al pulsar una categoría sin proyectos**. Ver
«Lo que hay que preguntarle a Lidia».

### Las llaves de R2 son planas, en minúscula y sin acentos

`nombreSeguro` en `worker/src/publicar.js` sustituye por guiones todo lo que no
sea `[a-zA-Z0-9._-]`, y no hay carpetas: **`bruma/01.jpg` y `bruma-01.jpg` dan
la misma llave**, y la segunda subida recibe un 409 en vez de sobrescribir.

La llave se construye aplanando la ruta relativa completa dentro del portafolio,
no sólo el nombre del archivo. Es imprescindible: seis de los ocho proyectos
tienen su portada llamada `ESTA PORTADA.jpg` o `ESTE PORTADA.jpg`, así que **con
sólo el nombre del archivo colisionarían seis de las ocho portadas**. Con la
ruta completa hay 65 llaves distintas y cero colisiones, comprobado.

Dos añadidos sobre la regla del Worker:

- **Minúsculas.** Las llaves de R2 distinguen mayúsculas, y este proyecto ya se
  quemó con eso: el auditor de rutas del bloque 1 existe por ese motivo.
- **Sin acentos.** `nombreSeguro` convertiría `Monstruación` en `Monstruaci-n`,
  porque la `ó` no es ASCII. Se translitera antes de aplicar la regla.

Las llaves quedan como `img/<ruta-aplanada>-<lado>.jpg`, por ejemplo
`img/editorial-monstruacion-esta-portada-3000.jpg`.

### La herramienta de derivación entra al repositorio

Lidia va a publicar más obra, y entonces habrá que derivar otra vez. Una
herramienta que vive en un directorio temporal es una herramienta que no existe
la segunda vez.

**Esto roza una restricción global del proyecto: «sin dependencias, sin build,
sin npm».** La herramienta usa Pillow, que es una dependencia. La lectura que
esta spec adopta es que la restricción vincula **al sitio** —lo que se sirve al
navegador, que seguirá sin una sola dependencia— y no a las herramientas
locales que nunca se despliegan. `tests/pesar_imagenes.py` sentó el precedente
de herramienta en Python, aunque se limitó a la biblioteca estándar; aquí no se
puede, porque redimensionar un JPEG sin una librería de imagen no es razonable.

La herramienta **nunca escribe sobre los originales** y nunca sube nada: deriva
a un directorio de trabajo y ahí acaba su trabajo. Subir es un paso aparte y
manual, por el mismo motivo por el que desplegar lo es.

## Arquitectura

Nada aguas arriba de `contenido.json` se entera de este bloque. La galería, el
visor, el router, el móvil y el panel ya leen de ahí y les da igual de dónde
salgan las URLs. Lo que cambia son tres cosas, en tres capas que no se conocen
entre sí:

**1. Derivar** — `herramientas/derivar_imagenes.py`, nuevo. Lee los originales,
escribe tres JPEG por foto en un directorio de trabajo, e informa de pesos
contra el presupuesto. Respeta la orientación EXIF —sin eso la mitad de los
verticales salen tumbados— y conserva el perfil de color incrustado.

**2. Subir** — `npx wrangler r2 object put` en bucle sobre el directorio de
trabajo, documentado en `docs/despliegue.md`. Se elige wrangler y no `rclone`
porque wrangler reutiliza la sesión que ya se usa para desplegar: **`rclone`
exigiría crear fichas de API S3 de R2, o sea credenciales nuevas que guardar**,
y la restricción global dice que no hay credenciales en el repositorio.

**3. Describir** — `contenido.json` reescrito, y con él el esquema de la ficha
en los cuatro sitios que lo tocan:

| Archivo | Qué cambia |
|---|---|
| `js/reglas-contenido.js` | la validación de los campos de ficha |
| `js/visor-ficha.js` | las filas que pinta `pintar()`, y el botón del vídeo |
| `js/movil-ficha.js` | lo mismo en el móvil |
| `css/luque.css` | el botón, reutilizando la pastilla amarilla existente |
| `panel/` | los campos del formulario de edición |

`js/reglas-contenido.js` es el sitio correcto para la regla porque ya lo es:
existe precisamente para que el navegador y el Worker no validen distinto, que
fue el fallo del bloque 2.

## El flujo de datos

```
originales (fuera del repo, 535,5 MB)
  -> derivar_imagenes.py
      -> directorio de trabajo: 195 JPEG, 43,7 MB
          -> wrangler r2 object put -> R2, bajo img/
                                        -> el Worker sirve /img/*, inmutable
contenido.json (rutas relativas /img/...)
  -> Datos -> Galeria / Visor / MovilVisor
```

Las rutas en `contenido.json` son **relativas**: `/img/...`, no
`https://lidialuque.com/img/...`. Así el sitio sigue funcionando servido desde
`python -m http.server` en la red local, que es como se prueba en un móvil real,
y **son mismo origen**, que es lo que desbloquea la medición del brillo del
bloque 4g.

## Cuando algo falla

| Fallo | Qué pasa |
|---|---|
| Una llave de `img/` no existe en R2 | el Worker responde 404; no hay caída a estáticos para imágenes, sólo para `contenido.json` |
| R2 no responde | 502 con texto propio, y queda registrado |
| Un campo de ficha vacío | se escribe `######` y se anuncia «dato no disponible» (bloque 4g) |
| Un proyecto sin `enlace` | el botón no se pinta, y no deja hueco |
| Un `enlace` a un anfitrión desconocido | el botón dice «Ver el vídeo» en vez de nombrar la plataforma |
| Una imagen derivada pasa de 5 MB | la API la rechaza con 413; hoy ninguna se acerca, la mayor son 1.668 KB |
| Un original que Pillow no puede abrir | la herramienta lo informa y sigue con los demás; no aborta el lote |

## Cómo se prueba

**La suite actual va a romperse, y eso es lo que se quiere.** Hay fixtures
repartidas por `tests/` que construyen proyectos con `camara` y `optica`.
Cambiar el esquema las tumba, y cada fallo señala un sitio que hay que tocar:
son la red que este proyecto tiene puesta para exactamente esto. La suite
arranca en 422 comprobaciones en verde.

Lo que se añade:

- **Que `validar` rechace un proyecto sin `papel`** y acepte uno sin `cliente`
  y sin `enlace`, que son los dos campos que legítimamente faltan.
- **Que una ficha con un campo vacío pinte `######`**, en escritorio y en móvil.
  Es la costura entre este bloque y el 4g.
- **Que el botón del vídeo sólo se pinte cuando hay `enlace`**, y que no deje
  hueco cuando no lo hay. Las dos mitades: un proyecto con enlace y otro sin él.
- **Que el botón salga con `rel="noopener noreferrer"`.** Es una comprobación de
  seguridad, no de estilo, y por eso se prueba en vez de confiarse a la revisión.
- **Que el nombre de la plataforma se deduzca del anfitrión**: `youtu.be` y
  `youtube.com` dan «Ver en YouTube», y un anfitrión desconocido cae en «Ver el
  vídeo» sin romperse. La deducción es una función pura y se prueba sin DOM.
- **Que las llaves derivadas no colisionen**: una prueba de la función de
  aplanado, con los seis nombres de portada repetidos como caso.
- **Que la orientación EXIF se respeta**: un JPEG de prueba con la marca de
  giro puesta, comprobando que sale con el alto y el ancho intercambiados.
- **`tests/pesar_imagenes.py` apuntando a las URLs reales** en vez de a picsum.
  Su presupuesto de galería sigue en 3 MB; las ocho portadas suman 1.169 KB, un
  38%.

Lo que **no** se puede probar en el arnés y hay que mirar con los ojos: si las
fotos se ven como Lidia quiere que se vean. La hoja de contactos de lo derivado
existe para eso.

## Lo que queda fuera

- **El bloque 4g** —el pellizco, las esquinas que se adaptan al brillo, el
  encuadre de cuatro esquinas—. Este bloque le prepara el terreno sirviendo las
  fotos desde el mismo origen, pero no lo empieza.
- **Quitar el `noindex` y el `robots.txt`.** Se quitan los dos a la vez, y no
  el día que entre el contenido real, sino el día que además haya licencias de
  las tipografías. Entra contenido; no se anuncia la web.
- **Reproducir vídeo.** Decidido arriba.
- **Rellenar `cortometraje` y `foto-stills`.** No hay material.

## Lo que no se puede verificar todavía

1. **Que el sitio publicado sirva estas imágenes.** Requiere desplegar, y
   desplegar es a mano y con permiso explícito. Hasta entonces sólo se prueba en
   local contra el directorio de trabajo.
2. **Que las esquinas del brillo funcionen con estas fotos.** Es del 4g, pero
   este bloque es el que lo hace posible por primera vez, y conviene comprobarlo
   en cuanto se pueda: llevaba desde el bloque 4c sin poderse ejercitar.

## Lo que hay que preguntarle a Lidia

Tres cosas que esta spec propone pero no decide, porque no le corresponden:

1. **Los títulos definitivos.** El `TEXTOS.docx` escribe `THE IN-BET-WEEN`,
   que parece un guion de más sobre `The In-Between` de la carpeta. Y las
   carpetas de videoclip llevan el título corto —`TUKATU`— mientras el texto
   trae el completo —`TUKATU · Noche absoluta ft. Alandes`—. Esta spec propone
   los del texto, que son los que ella escribió a propósito.

2. **Dónde va cada proyecto.** `Monstruación` está archivado en EDITORIAL pero
   su propio texto lo llama *fashion film*; `Conejita Playboy` está en VIDEOCLIP
   pero su texto dice «un vídeo de transiciones». Esta spec los deja donde ella
   los puso, porque colocarlos es criterio suyo.

3. **Qué se ve al pulsar una categoría vacía.** Una rejilla en blanco es un
   fallo aparente. Esta spec no elige entre un texto breve en la voz del sitio
   y ocultar el filtro hasta que tenga contenido.
