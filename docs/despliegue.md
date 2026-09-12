# Cómo se despliega

La web está publicada en `https://lidialuque.com`. Dos piezas: un repositorio
privado en GitHub, `aro42-ua/luque`, que guarda el código, y un **Worker de
Cloudflare con recursos estáticos** — no un proyecto de Pages — que sirve el
sitio. El despliegue es un comando de `wrangler` que hay que ejecutar a mano
cada vez.

## `workers.dev` está apagado a propósito, y no hay que volver a encenderlo

El Worker se sigue llamando `luque` en Cloudflare, y hasta la Tarea 7 del
bloque 3b también respondía en `https://luque.angelrubioortiz2005.workers.dev`.
Esa dirección **ya no contesta**: `worker/estatico/wrangler.toml` fija
`workers_dev = false` y `preview_urls = false`, a propósito.

El motivo no es limpieza, es seguridad. Este mismo Worker sirve ahora `/panel`,
la única superficie de **escritura** del sitio. Cloudflare Access sólo puede
ponerse delante de un nombre de host de una zona propia —`lidialuque.com`— y
**no** de `workers.dev`, que es un dominio de Cloudflare. Con `workers.dev`
encendido, `/panel` seguiría alcanzable en
`luque.angelrubioortiz2005.workers.dev/panel` sin Access delante: un agujero
exacto en lo único que da permiso de escritura sobre el contenido del estudio.
Las Preview URLs se apagaron por lo mismo: cada versión desplegada estrena su
propio nombre de host, y ninguno estaría cubierto por la política de Access.

**Si alguna vez compruebas la URL vieja y ves que no responde, ese es el
comportamiento correcto — no un despliegue roto.** El arreglo no es volver a
encender `workers.dev`: sería reabrir el agujero que la Tarea 7 de este bloque
existe para cerrar. El sitio vive en `lidialuque.com`.

## Aviso: hubo una integración automática, y desplegó lo que no debía

Hasta el 2026-08-24 este documento afirmaba que «no hay integración automática
entre el repositorio y Cloudflare». **Era falso**, y conviene dejar escrito cómo
se descubrió, porque la creencia equivocada es lo que dejó pasar el problema.

Cloudflare tenía activado **Workers Builds** sobre este repositorio: en cada
empujón a GitHub construía y desplegaba el Worker del sitio. Al subir la rama
del bloque 3a se vio el efecto — la web pública pasó a servir código de una rama
**sin fusionar y sin revisar por nadie**. Se confirmó pidiendo un archivo que
sólo existía en esa rama, `js/reglas-contenido.js`: respondió `200` desde el
dominio público.

Se descubrió por un efecto colateral, no por el problema en sí: el bloque 3a
añade dos `wrangler.toml` —`worker/` y `worker/estatico/`— pero **ninguno en la
raíz**, que es donde Workers Builds ejecutaba `npx wrangler versions upload`. El
build empezó a fallar con `Missing entry-point to Worker script or to assets
directory`, y al investigar ese fallo apareció lo de verdad importante.

**Decisión del estudio: desconectar Workers Builds** y quedarse con el
despliegue manual que describe este documento. El motivo no es técnico sino de
control: publicar tiene que ser un gesto deliberado. Con `git archive` se decide
exactamente qué sale —el paso siguiente explica por qué eso importa— y ninguna
rama a medias llega al escaparate del estudio por el simple hecho de empujarla.

Si algún día se quiere volver a la publicación automática, dos condiciones: que
sólo despliegue desde `main`, y que las demás ramas no puedan tocar producción
ni siquiera con una versión de vista previa.

## Por qué es un Worker y no Cloudflare Pages

La especificación y las primeras versiones de este documento decían Cloudflare
Pages. No fue posible: al desplegar, `wrangler` contestó `The Pages project
"luque" does not exist`, y `wrangler pages project list` devolvió una lista
**vacía** — no hay ningún proyecto de Pages en la cuenta. Lo que el estudio
creó en el panel de Cloudflare es un Worker, no un proyecto de Pages. Cloudflare
está absorbiendo Pages dentro de Workers y empuja los proyectos nuevos hacia
ahí; por eso el panel no mostraba ninguna URL de Pages y ninguna dirección
`pages.dev` respondía.

Antes de desplegar así se comprobó en la documentación de Cloudflare que los
Workers con recursos estáticos soportan `_headers` y `_redirects` de forma
nativa, colocándolos en el directorio de recursos — la misma mecánica que
Pages. La salvedad que documenta Cloudflare es que esos archivos no se aplican
a respuestas generadas por código de Worker.

> **Esa salvedad ya no es hipotética: este Worker tiene código desde la Tarea
> 6, Paso 4 del bloque 3a.** `worker/estatico/index.js` le da un `fetch()`
> propio a este mismo Worker de recursos estáticos, para servir
> `/contenido.json` y `/img/*` desde R2 — es lo que publica el panel — y
> delegar todo lo demás en `entorno.ASSETS.fetch(peticion)`.
>
> **La salvedad de Cloudflare no llegó a morder, y no por suerte: por
> `run_worker_first` acotado a esas dos rutas.** `worker/estatico/wrangler.toml`
> fija `run_worker_first = ["/contenido.json", "/img/*"]`. Sin esto, Cloudflare
> serviría cualquier archivo estático que exista ANTES de invocar el Worker —y
> `contenido.json` existe como archivo estático, es el que trae el
> repositorio—, así que el código de este Worker no se llegaría a ejecutar
> nunca para esa ruta. Con `run_worker_first` acotado, **para cualquier otra
> ruta el Worker no se invoca en absoluto**: la petición la resuelve el
> enrutador de recursos estáticos exactamente como si este `fetch()` no
> existiera, `_redirects` incluido.
>
> **Verificado con `wrangler dev` en local** (no contra el servidor real: al
> escribirse esto la rama todavía no se había desplegado) con un directorio de
> recursos que incluía `_redirects` y archivos de prueba bajo `docs/`,
> `.claude/` y `worker/`:
> `GET /docs/estado-conocido.md`, `GET /.claude/launch.json` y
> `GET /worker/wrangler.toml` siguen devolviendo **302**. Y el propio
> `/contenido.json` responde el archivo estático del repositorio mientras R2
> no tiene nada publicado, y lo que hay en R2 en cuanto se publica una vez —
> las dos mitades de la Tarea 6, Paso 4 comprobadas end-to-end en local, sin
> tocar la cuenta de Cloudflare.
>
> **Quien despliegue esto por primera vez tiene que repetir esa misma
> comprobación contra el servidor real**, no darla por buena porque pasó en
> local: local y producción comparten el motor (workerd), pero no está de más
> confirmarlo donde importa.

**Quien vea esto y piense en "arreglarlo" volviendo a Pages: no hay proyecto
de Pages que recuperar.** La cuenta no tiene ninguno, y crear uno nuevo va
contra la dirección en la que Cloudflare está moviendo el producto.

## Sin paso de compilación

La web es HTML, CSS y JavaScript servidos tal cual: sin Node, sin npm, sin nada
que instalar en la máquina para que funcione la web en sí — sí hace falta Node
para instalar la herramienta de despliegue, `wrangler` (ver más abajo). No hay
comando de compilación ni directorio de salida distinto de la raíz del
repositorio: lo que se exporta y se sube **es** el sitio.

## Cómo se despliega, paso a paso

1. **Instalar `wrangler`:** `npm install -g wrangler`. Necesita Node en el
   PATH.
2. **Iniciar sesión:** `wrangler login`. Abre el navegador para autenticar
   contra Cloudflare, así que lo hace el estudio: es su cuenta y sus
   credenciales.
3. **Exportar el árbol versionado a un directorio temporal:**

   ```
   git archive main | tar -x -C <directorio-temporal>
   ```

   No se despliega el directorio de trabajo tal cual. El directorio de trabajo
   contiene `.superpowers/`, `.worktrees/` y `.wrangler/` — directorios de
   trabajo de las herramientas, no parte del sitio — y publicarlos filtraría
   planes internos y rutas locales. `git archive` exporta exactamente lo que
   está versionado en `main`, ni un archivo más ni uno menos. Es el mismo
   resultado que habría subido una integración automática con GitHub, sólo que
   aquí el paso se hace a mano.

   Si quieres saber cuántos archivos van a salir antes de desplegar:

   ```
   git archive main | tar -t | grep -v '/$' | wc -l
   ```

   **Desde PowerShell la tubería NO vale.** PowerShell pasa la salida de
   `git archive` por su propia tubería de objetos, como texto, y le rompe los
   bytes: `tar` recibe un archivo corrupto y escupe `Damaged tar archive (bad
   header checksum)` una y otra vez, extrae vacío o a medias, y `wrangler`
   despliega sin quejarse un directorio al que le faltan carpetas enteras. Pasó
   el 2026-09-11: el sitio contestaba 404 en `/panel`. Si el shell es
   PowerShell, se escribe el `.tar` a disco y se extrae desde ahí:

   ```powershell
   $tmp = Join-Path $env:TEMP ("luque-deploy-" + (Get-Date -Format yyyyMMdd-HHmm))
   New-Item -ItemType Directory -Path $tmp | Out-Null
   git archive main -o "$env:TEMP\luque.tar"
   tar -xf "$env:TEMP\luque.tar" -C $tmp
   ```

   `$tmp` se construye con `Join-Path` y no con lo que devuelve `New-Item`: en
   PowerShell 5, un `DirectoryInfo` se convierte a texto como **sólo el
   nombre**, sin la ruta, y `-C $tmp` apuntaría a una carpeta relativa que no
   existe.

   Antes de desplegar, comprobar que el directorio tiene lo que tiene que
   tener —unos 200 archivos, y `panel/index.html` entre ellos— y, en la salida
   de `wrangler deploy`, que la línea `Uploaded N files` diga un número de ese
   orden y no un puñado. Desde Git Bash o `cmd` la tubería es binaria de verdad
   y el comando de arriba sirve tal cual.
4. **Desplegar:**

   ```
   wrangler deploy --config worker/estatico/wrangler.toml --assets <directorio-temporal>
   ```

   Antes del bloque 3a esto era un Worker de recursos estáticos puro: sin
   `--config`, el nombre y la fecha de compatibilidad iban sueltos como flags
   (`--name luque --compatibility-date 2026-08-18`). Ahora hace falta
   `--config` porque el Worker tiene código y un *binding* de R2 —ver la
   sección del Worker de recursos estáticos, más abajo—, y **`wrangler deploy`
   no tiene una opción de línea de comandos para adjuntar un *binding* de R2**
   (comprobado con `wrangler deploy --help`: no existe `--r2` ni equivalente).
   El nombre (`luque`) y la fecha de compatibilidad viven ahora dentro de
   `worker/estatico/wrangler.toml`, así que no hace falta repetirlos en el
   comando. El directorio de recursos estáticos **sigue** pasando por
   `--assets` en el propio comando, y no en el archivo de configuración: es un
   directorio temporal que cambia en cada despliegue, y fijarlo en el archivo
   versionado ataría el despliegue a una ruta local de quien lo ejecutó la
   última vez.

## El Worker de recursos estáticos ya tiene código: qué sirve desde R2

`worker/estatico/index.js` (con su configuración en
`worker/estatico/wrangler.toml`) es el `fetch()` de **este mismo Worker**, el
que responde en `lidialuque.com` (`workers.dev` está apagado a propósito — ver
el aviso al principio de este documento). No confundir con
`worker/src/index.js`, que es el Worker de la API (`luque-api`) — son dos
Workers, dos despliegues, dos archivos de configuración, y sólo comparten el
bucket de R2.

**El hueco que cierra.** `POST /api/publicar` (Tarea 5) escribe
`contenido.json` dentro del bucket de R2, y `POST /api/imagen` guarda las
fotos bajo `img/` en ese mismo bucket. Pero `js/contenido.js` pide
`contenido.json` por ruta relativa a los archivos estáticos: sin este paso,
publicar no cambiaba nada de lo que veía un visitante, y nadie servía
`/img/*`. Lo encontró la revisión final de la Tarea 5 del bloque 3a, y quedó
escrito como una decisión razonada en el propio plan antes de implementarse.

**Qué sale de R2, y sólo eso:**

| Ruta | Si el objeto está en R2 | Si no está |
|---|---|---|
| `GET /contenido.json` | se sirve desde R2, con su `content-type` | **cae al archivo estático del repositorio** — ver más abajo |
| `GET /img/<nombre>` | se sirve desde R2, con su `content-type` | 404 propio, sin llegar a `ASSETS.fetch()` |
| cualquier otra ruta | — | va directa a `ASSETS.fetch()`; el Worker no la mira |

La lista es explícita a propósito: `borrador.json` vive en el mismo bucket
que `contenido.json`, y un enrutado genérico —"lo que exista en R2 con ese
nombre de ruta, se sirve"— lo dejaría legible por cualquiera que adivinara la
URL. Al no estar en la lista, no hay código que lo alcance: cae directo a
`ASSETS.fetch()`, donde tampoco existe, y responde el 404 de siempre.

**La caída de `/contenido.json` a los estáticos, y por qué hace falta.** El
código de referencia del plan (Tarea 6, Paso 4) servía `/contenido.json`
**sin** esa caída: si R2 no tenía el objeto, devolvía 404 directamente. Eso
habría roto la web en el momento mismo de desplegar, porque **en R2 no hay
ningún `contenido.json` todavía** — nadie ha pulsado "publicar" — y la web se
habría quedado en un estado vacío hasta la primera publicación del estudio.
Con la caída, la transición es invisible: la web sigue sirviendo el
`contenido.json` versionado en el repositorio exactamente como hasta ahora, y
en cuanto el estudio publique por primera vez, R2 empieza a mandar sin volver
a desplegar nada. `/img/*` no tiene caída ni falta que le hace: no existe
ningún archivo estático equivalente —las imágenes las sube el panel
directamente a R2—, así que si el objeto no está ahí no está en ningún sitio.

**`run_worker_first` no es un detalle de rendimiento, es lo que hace que esto
funcione.** Por omisión, Cloudflare sirve un archivo estático que exista
*antes* de invocar el Worker — y `contenido.json` **sí** existe como archivo
estático, es el que trae el repositorio. Sin acotar `run_worker_first` a
`["/contenido.json", "/img/*"]` en `worker/estatico/wrangler.toml`, toda
petición a `/contenido.json` se habría resuelto contra el archivo del
repositorio directamente, y el código de este Worker no se habría llegado a
ejecutar nunca para esa ruta, publicara lo que publicara el estudio.

**Verificado con `wrangler dev` en local** (no contra el servidor real: al
escribirse esto la rama todavía no se había desplegado), con R2 emulado y un
`contenido.json` estático de prueba en el directorio de recursos:
- Sin nada publicado en R2: `GET /contenido.json` devuelve el archivo del
  repositorio.
- Tras `wrangler r2 object put luque-contenido/contenido.json --local ...`:
  la misma ruta devuelve el contenido de R2, con `content-type:
  application/json`.
- `GET /img/<nombre>` publicado en R2 devuelve sus bytes exactos con su
  `content-type`; sin publicar, 404.
- `GET /borrador.json` devuelve 404 **aunque el objeto exista en R2** —se
  subió a propósito para la prueba—: la ruta no está en la lista, así que ni
  se le pregunta a R2 por ella.
- Una ruta ajena a las dos (`/estilo.css` en la prueba) nunca invoca el
  `fetch()` de este Worker: la resuelve el enrutador de recursos estáticos
  directamente, como si el Worker no existiera.

**La misma salvedad se comió el cierre a buscadores, y se cerró también.**
`_headers` fija `X-Robots-Tag: noindex` para todo el sitio con la regla `/*`
(ver la sección de más abajo), pero esa regla tampoco se aplica a respuestas
generadas por código de Worker. Verificado con `wrangler dev`: antes de
corregirlo, `X-Robots-Tag` desaparecía de `/contenido.json` justo después de
la primera publicación —el sitio entero sigue cerrado a buscadores por dos
mecanismos independientes (ver "Cerrada a los buscadores" más abajo), y esto
habría roto uno de los dos para estas dos rutas sin ningún aviso—. Ahora
`worker/estatico/index.js` fija la cabecera a mano en las respuestas que
sirve desde R2, y la prueba `lo servido desde R2 sigue cerrado a buscadores`
(`worker/test/estatico.test.js`) lo cierra para que no se pueda perder otra
vez sin que algo se ponga en rojo.

## `_headers`: las reglas que casan se combinan, no se sustituyen

Un hecho de la documentación de Cloudflare que conviene tener escrito, porque
no es intuitivo y el propio archivo `_headers` de este repositorio queda
expuesto a él en cuanto alguien lo amplíe:

**Si dos reglas de `_headers` casan con la misma ruta y ambas fijan la misma
cabecera, Cloudflare no se queda con la última: concatena los valores
separados por coma.** No es una interpretación nuestra — está en su
documentación, y el propio ejemplo que usan para explicarlo es precisamente
`X-Robots-Tag`, la misma cabecera que fija este archivo.

Lo que confirma esa misma documentación, y conviene tener presente:

- Las reglas que casan **combinan** sus cabeceras; no gana una sola regla.
  `/*` y `/css/*` casan a la vez con `/css/luque.css`, y la respuesta lleva las
  cabeceras de las dos.
- El **orden de los bloques en el archivo es indiferente** para el resultado:
  todas las reglas que casan se aplican, se lean en el orden que se lean.
- `/*` casa también con subrutas, no sólo con archivos en la raíz:
  `/js/galeria.js` o `/css/luque.css` casan con `/*` igual que `/index.html`.

Hoy, en este `_headers`, no hay ninguna colisión: `X-Robots-Tag` sólo lo fija
la regla `/*`, y ninguna otra regla define una cabecera que ya defina otra.
Eso no es un accidente que vaya a durar solo: es la razón de dejarlo escrito
aquí. El día que alguien añada una segunda regla que fije `Cache-Control` o
`X-Robots-Tag` para una ruta que también case con una regla existente, el
resultado será un valor combinado — `"Cache-Control: no-cache, public,
max-age=3600"`, por ejemplo — sin ningún error ni aviso. El único síntoma es
inspeccionar la respuesta y ver una cabecera que no tiene sentido. Antes de
añadir una regla nueva, comprobar qué otras reglas ya casan con esa ruta y qué
cabeceras fijan.

## `_redirects`: qué no se publica, y qué sí a propósito

El árbol que exporta `git archive` es exactamente lo versionado, así que
**se sube todo lo versionado**, no sólo lo que enlaza `index.html`. Sin hacer
nada, `https://lidialuque.com/docs/estado-conocido.md`
devolvería 200 a cualquiera — y ese archivo dice en texto plano que las
tipografías son versiones Trial sin licencia para uso público, a pocos clics
de los propios archivos de fuente. `/.claude/launch.json` filtra además rutas
locales del tipo `C:/Users/...`. `robots.txt` y `X-Robots-Tag` no sirven aquí:
impiden **indexar**, no **acceder**.

`_redirects` cierra `/docs/*`, `/.claude/*`, `/worker/*` y `/herramientas/*`. Funciona aunque el
archivo exista: la documentación de Cloudflare dice que las reglas se aplican
*sin importar si un recurso casa con la petición*, así que el
redireccionamiento gana al archivo real. **Verificado contra el servidor real:**
`/docs/*` y `/.claude/*` devuelven 302 y sirven la portada, no el markdown ni el
JSON. `/worker/*` se añadió en el bloque 3a y quedó verificado en la Tarea 7 del
bloque 3b, ya contra `lidialuque.com`: también devuelve 302.

**`/worker/*` es la lección que conviene no repetir.** El bloque 3a añadió un
directorio de primer nivel entero —el código del Worker de la API, sus pruebas
y `wrangler.toml` con el nombre del bucket— y nadie volvió a abrir este archivo
hasta la revisión final. `git archive` lo subía con todo lo demás. **Añadir un
directorio de primer nivel obliga a decidir aquí si se sirve o no**, porque el
valor por omisión es servirlo.

**Y pasó otra vez.** El bloque del contenido real creó `herramientas/` —la
herramienta que deriva las tres medidas y `proyectos.json`— y tampoco volvió
aquí; se cerró al ir a desplegar, no al crearlo. Dos veces con la misma piedra:
la advertencia de arriba está escrita en mayúsculas en `_redirects` y aun así
no basta. Quien añada el tercero, que empiece por este archivo.

**Se devuelve un 302, no un 404, y no es una preferencia:** el archivo
`_redirects` de Cloudflare **no admite el 404**. Los únicos códigos válidos
son 301, 302, 303, 307 y 308 —más 200, que actúa como proxy—, y la propia
tabla de compatibilidad de la documentación usa `/blog/* /blog/404.html 404`
como ejemplo de lo que **no** funciona. Quien venga a «arreglar» el 302
poniendo un 404 se encontrará con una regla que Cloudflare descarta y con
`docs/` otra vez servido. Un 404 de verdad exigiría escribir código de
Worker, es decir, dejar de servir el sitio como recursos estáticos puros: no
compensa. Se elige 302 sobre 301 porque un 301 se queda cacheado en los
navegadores y sería doloroso de revertir.

### `/tests/*` sigue accesible, y es deliberado

**Decisión tomada a conciencia, no un descuido.** `tests/` no contiene nada
sensible: son el arnés y sus pruebas, el mismo código que ya es público en el
repositorio del sitio. A cambio, dejarlo accesible permite la verificación más
valiosa del despliegue: abrir la ruta de pruebas en la URL real y comprobar que
las comprobaciones pasan **servidas desde Cloudflare**, con sus rutas, sus
tipos MIME y sus mayúsculas de verdad, y no sólo con doble clic en local. Es
justo lo que ninguna prueba en la máquina de desarrollo puede demostrar.
**Verificado (antes de la Tarea 7 del bloque 3b, contra la URL de
`workers.dev` que hoy está apagada):** las 51 pasaban servidas desde
`https://luque.angelrubioortiz2005.workers.dev`. Falta repetir esta misma
comprobación contra `https://lidialuque.com/tests/test` — ver «Verificado en
producción» más abajo.

Al pedir `/tests/test.html` (con la extensión) el servidor responde 307 hacia
`/tests/test`, sin ella. Es la normalización de extensiones que hacen los
Workers con recursos estáticos, no un fallo: conviene abrir la ruta sin
`.html`, o dejar que el navegador siga la redirección. Lo mismo le pasa a
`/index.html`, que redirige con 307 a `/`.

Si algún día se cierra, hay que sustituir esa verificación por otra
equivalente, no dejarla sin más.

## Cerrada a los buscadores: hacen falta los dos, y no son lo mismo

El sitio está cerrado por dos mecanismos distintos, y **ninguno es redundante
con el otro**. Quien quite uno creyendo que el otro lo cubre se queda sin la
mitad de la protección y no se entera:

- **`robots.txt` impide RASTREAR.** Le pide al buscador que no descargue las
  páginas.
- **`X-Robots-Tag: noindex`, que fija `_headers`, impide INDEXAR.** Le prohíbe
  listar la URL en sus resultados.

La diferencia importa porque un buscador puede listar una URL que nunca ha
leído. Basta un enlace externo, una mención o un sitemap ajeno para que
descubra la dirección: `robots.txt` le impide entrar a leerla, pero no le
impide publicar la URL desnuda. Sin la cabecera, la web puede aparecer en un
buscador aunque el rastreador haya obedecido.

Los dos se quitan **a la vez**, el día que la web se pueda anunciar. Quitar
sólo uno no es medio gesto: es dejarse una puerta abierta.

## Antes de desplegar: el auditor de rutas

```
python tests/auditar_rutas.py
```

Se ejecuta desde la raíz del repositorio, **antes de cada despliegue**. Su
propia prueba, que comprueba que el auditor detecta lo que dice detectar:

```
python tests/prueba_auditar_rutas.py
```

**Qué comprueba:** que cada recurso local referenciado desde el marcado y el
CSS —los `src=`, los `href=` y los `url()`— existe con las mayúsculas exactas.

**Por qué existe:** Windows no distingue mayúsculas y el servidor de
Cloudflare sí. Una referencia escrita `JS/Galeria.js` cuando el archivo se
llama `js/galeria.js` funciona perfectamente en la máquina de desarrollo y da
un 404 en producción. Es un fallo silencioso: en local no hay nada que mirar
que lo delate.

**Por qué no vale lo obvio:** `os.path.exists` no sirve, porque hereda esa
misma insensibilidad y contestaría que el archivo existe. Por eso el auditor
lista el directorio padre y compara el nombre exacto contra lo que hay dentro.

## Antes de desplegar: el peso de las imágenes

```
python -m http.server 8010
python tests/pesar_imagenes.py --origen http://localhost:8010
```

También desde la raíz, **antes de cada despliegue**. Baja por la red, así que
tarda unos segundos: por eso no está en el arnés del navegador, que tiene que
ser rápido y no fallar nunca por la conexión.

**`--origen` no es opcional desde el contenido real.** Las URLs de
`contenido.json` son relativas (`/img/...`), así que sin origen no hay nada que
pedir; se dice en vez de fallar raro. Contra el servidor local mide las
imágenes de `img/`, que son bit a bit las que se suben a R2. Para medir lo que
hay publicado de verdad: `--origen https://lidialuque.com`.

Medido el 2026-09-10 con los ocho proyectos reales: **1,14 MB de un
presupuesto de 3**, código de salida 0.

**Qué comprueba:** lo que pesa cada superficie. La galería tiene presupuesto
—3 MB— porque se carga **entera** al entrar y es lo que espera quien llega por
primera vez. Las piezas del visor no lo tienen y no deben tenerlo: son la
calidad que vende un estudio de fotografía, se piden de una en una y sólo
cuando alguien abre un proyecto. Sale con código 1 si la galería se pasa.

**Por qué existe:** el bloque 2 dejó la galería pidiendo 8,7 MB al entrar
—doce piezas a 2400×3000— donde antes pedía 0,8, y nada saltó. Ni el arnés, ni
el auditor, ni una revisión completa de la rama lo vieron: todos miraban si el
código era correcto, y lo era. Lo encontró el estudio abriendo la página. Esto
es lo que faltaba.

## Subir las imágenes derivadas a R2

**Esto no lo ejecuta ninguna tarea ni ningún agente: es un acto manual de
Ángel, con la sesión de wrangler ya iniciada.** Aquí está escrito el
procedimiento, nada más.

Con `img/` ya generado por `herramientas/derivar_imagenes.py` —195 archivos,
43,7 MB—:

```bash
for f in img/*.jpg; do
  llave="luque-contenido/img/$(basename "$f")"
  npx wrangler r2 object put "$llave" --file "$f" --content-type image/jpeg --remote
done
```

**`--remote` NO ES OPCIONAL, y omitirlo no da ningún error.** Sin él,
`wrangler r2 object put` escribe en el almacén LOCAL simulado —`.wrangler/`, al
lado del `wrangler.toml` que se use— y el bucket no se entera. La subida dice
«Upload complete» las 195 veces.

Lo peor no es eso: **`wrangler r2 object get` también es local por omisión**, así
que una verificación que lea de vuelta lo que se acaba de escribir sale perfecta
comparando la copia local consigo misma. Pasó el 2026-09-10: 195 archivos
«subidos» y «verificados byte a byte», y en R2 no había ni uno. Lo delató el
sitio real, que seguía contestando 404.

**La verificación buena es por HTTPS contra el dominio**, porque mide lo que
recibe un navegador de verdad y no puede salir bien por accidente:

```bash
u=https://lidialuque.com/img/<llave>.jpg
curl -s -o /dev/null -w "%{http_code} %{size_download} %{content_type}" "$u"
```

Tiene que dar `200`, los bytes exactos del archivo local y `image/jpeg`.

**Al volver a derivar, subir sólo lo que falta.** Una pasada nueva de la
herramienta puede cambiar llaves —las piezas recortadas llevan `-r`— y regenera
las 195; no hace falta subir las 195. Comprobar primero cada llave por HTTPS
(`200` y los bytes exactos) y subir sólo las que no estén: así la subida es
repetible y no pisa nada. Las llaves que dejan de nombrarse se quedan en el
bucket; no hacen daño y borrarlas es otra decisión.

**Con wrangler y no con `rclone`**, y no por gusto: wrangler reutiliza la
sesión ya iniciada, mientras que `rclone` exigiría crear fichas de API S3 de
R2, o sea **credenciales nuevas que guardar**. La regla de este repositorio es
que aquí no entran credenciales.

**Cuidado con una cosa, porque es fácil creer lo contrario.** El Worker
rechaza con 409 una imagen cuya llave ya existe, en vez de pisarla
(`guardarImagen`, en `worker/src/publicar.js`): protege al panel de perder una
foto publicada cuando dos nombres distintos colapsan en la misma llave al
sanearlos. **Ese 409 no cubre esta subida.** `wrangler r2 object put` habla
con el bucket directamente y no pasa por el Worker, así que **sí sobrescribe,
y en silencio**. Quien suba dos veces la misma llave con archivos distintos se
queda con el segundo y sin aviso.

En la práctica no muerde, porque las llaves las genera `llave()` a partir de
la ruta del original y son estables: volver a subir escribe lo mismo encima de
lo mismo. Muerde si se cambia una foto conservando su nombre.

## Sembrar el borrador con lo publicado

**El panel edita `borrador.json`, y publicar copia el borrador SOBRE
`contenido.json`.** Son dos archivos de R2, y nada los sincroniza en el otro
sentido: lo que se escriba en `contenido.json` por fuera del panel —con
`wrangler r2 object put`, o el archivo estático del repositorio al que el
Worker cae cuando R2 no tiene ninguno— **no aparece en el borrador**.

Pasó el 2026-09-11, el primer día con la pantalla de un proyecto. El contenido
real entró en el escaparate el 2026-09-10 escribiendo `contenido.json` (ver la
sección de esa fecha), y el borrador se quedó con lo que dejaron las pruebas
del bloque 3b: proyectos sin fotos. Al abrir un proyecto en el panel no había
ninguna foto; al subir una y publicar, ese borrador se copió sobre
`contenido.json` y **la web se quedó con una sola foto**. Las 65 no se
perdieron —publicar sólo escribe `contenido.json`, y nada borra de `img/`—,
pero la web dejó de nombrarlas.

**Siempre que `contenido.json` se escriba por fuera del panel, hay que
sembrar el borrador con lo mismo:**

```bash
wrangler r2 object put luque-contenido/borrador.json --file contenido.json --content-type application/json --remote
```

Vale cualquier versión: el Worker lee la que haya guardada y el panel parte de
ella. Con `--remote`, por lo dicho dos secciones más arriba. Tras sembrarlo, el
panel enseña los proyectos con sus fotos y la pantalla de publicar dice «No hay
ningún cambio pendiente», que es la comprobación de que los dos archivos vuelven
a decir lo mismo.

Para deshacer una publicación que haya vaciado la web, el mismo comando sobre
`contenido.json`, con el archivo bueno como origen. El del repositorio es el que
se desplegó el 2026-09-10 y vale como copia de seguridad hasta que el panel sea
la única fuente.

**La pantalla de publicar avisa de esto antes de que ocurra**: lista lo que
entra, lo que cambia y lo que **se quita de la web**, con los nombres. Si dice
que se quitan siete proyectos y sólo se ha tocado uno, no es el momento de
pulsar.

## Los pasos que hace el estudio

Estas cosas las hace el estudio desde su propio navegador o su propia sesión,
no Claude:

- **`gh auth login`.** Autenticar la cuenta `aro42-ua` contra GitHub. Es
  distinto de crear el repositorio: `gh repo create` lo puede ejecutar luego el
  controlador, pero necesita una sesión ya iniciada, y esa sesión sólo la
  puede abrir quien tiene las credenciales. Claude no introduce credenciales
  de nadie.
- **Crear la cuenta de Cloudflare.** Es una cuenta del estudio, y Claude no
  crea cuentas.
- **`wrangler login`**, descrito en el paso 2 de más arriba. Abre el navegador
  para autenticar la sesión de despliegue; por eso lo tiene que hacer quien
  tiene las credenciales de la cuenta.
- **Configurar Cloudflare Access**, desde el panel de Zero Trust y con la sesión
  del estudio. Aquí hay una regla que se aprendió rompiéndola, y va justo debajo.

## Access: UNA sola aplicación para `/api` y `/panel`

**`lidialuque.com` tiene que estar cubierto por una única aplicación de Access,
con las dos rutas dentro.** No dos aplicaciones, una por ruta.

Se probó con dos —una para la API y otra para el panel— y **rompió el panel**.
El motivo: `CF_Authorization` es **una sola cookie por host**. Al entrar en
`/panel`, Access la reemitía para la aplicación del panel, con **el AUD del
panel**; con eso la sesión de la API quedaba invalidada, y la primera llamada
del panel a `/api/borrador` se iba contra Access en vez de contra el Worker.

Lo que se ve cuando pasa, y por qué despista:

> «No se ha podido cargar el contenido: no se ha podido contactar con el
> servidor…»

**Ese aviso, en el panel, no significa que la red falle.** Significa casi
siempre que Access está mal configurado. Access redirige a
`ffffffstudio.cloudflareaccess.com`, que es otro origen; el navegador bloquea
esa redirección porque no lleva CORS, y `fetch` sólo llega a ver un `TypeError`
idéntico al de un cable desenchufado. El panel no puede distinguirlos —por eso
su mensaje nombra las dos causas—, pero quien despliega sí: **si el panel carga
y la lista no, mira Access antes que el wifi.**

Con una sola aplicación hay un solo AUD y una sola cookie, y `ACCESS_AUD` —el
secreto del Worker de la API— sigue valiendo sin tocarlo.

## Verificado en producción

**Todo lo de esta sección se comprobó ANTES de que este Worker tuviera
código** — antes de la Tarea 6, Paso 4 del bloque 3a — **y antes de que el
sitio se mudara a `lidialuque.com`** — antes de la Tarea 7 del bloque 3b. Sigue
siendo cierto para lo que prueba: el comportamiento de los recursos estáticos
puros. Pero no cubre lo nuevo, y conviene separar qué está y qué no:

- **`/contenido.json` y `/img/*` desde R2, la caída de vuelta al archivo
  estático y `run_worker_first`: sólo verificados con `wrangler dev` en
  local** (sección de arriba), nunca contra el servidor real.
- **El dominio propio con Access delante sí está verificado en producción**,
  en la Tarea 7 del bloque 3b: `lidialuque.com/panel` y `/api/*` cubiertos por
  la misma aplicación de Access, un tercer correo rechazado, tokens falsificados
  devueltos con 403, y el conflicto de versión reproducido con dos sesiones.

### Despliegue del bloque 4 completo (2026-09-04)

Versión `49189f00-7ae9-45ac-8a7c-7442052f40d8`, desde `main` en `9b07e82`, con
`git archive` a un directorio temporal: 131 archivos, y comprobado antes de
subir que no salían `.superpowers/`, `.worktrees/`, `.wrangler/` ni `.git/`.
Auditor de rutas OK y `pesar_imagenes.py` OK (la galería pide 2,08 MB de un
presupuesto de 3).

**Es el primer despliegue con la experiencia móvil.** Antes de éste, lo
publicado era el sitio del bloque 3b: `js/movil-hoja.js` daba **404** en
producción. Ahora da 200, igual que `movil-puerta.js`, `movil-arrastre.js`,
`movil-recorrido.js`, `visor-carga.js` y `visor-foco.js`.

Repetido lo de siempre y todo en su sitio: `robots.txt` 200 y
`x-robots-tag: noindex` en `/`; `docs/estado-conocido.md`, `.claude/launch.json`
y `worker/estatico/wrangler.toml` en 302 a la portada; `/panel`,
`/panel/css/panel.css` y `/api/borrador` en 302 a Access;
`luque.angelrubioortiz2005.workers.dev/panel` en 404. Tipos MIME y caché
correctos: `font/otf` con `31536000, immutable` y `nosniff` en las tipografías,
`text/css` y `text/javascript` con `3600`, `application/json` en
`contenido.json`.

#### La suite NO se puede pasar entera desde producción, y es correcto

Ejecutada contra `https://lidialuque.com/tests/test.html`: **298 pasan, 44
fallan** — donde en local son 362 y 0. (Repetida el 2026-09-10 tras el
despliegue del contenido real: **393 pasan, 44 fallan**, donde en local son 464
y 0. Los 44 son los mismos y por lo mismo.)

**Los 44 son, sin una sola excepción, los tres módulos del panel**:
`Identificador`, `Orden` y `Lista`, más las 20 comprobaciones que ni llegan a
registrarse. La causa está comprobada, no supuesta: `/panel/js/*.js` devuelve
**302 al login de Access**, así que `tests/test.html` recibe la página de
acceso en vez del JavaScript. Los archivos no protegidos —`tests/arnes.js`,
`js/datos.js`— dan 200 y sus pruebas pasan.

**Nada del sitio público falla servido desde Cloudflare.** Esto cierra la
comprobación que quedaba pendiente desde agosto, y con un matiz que hay que
saber: **no se puede cerrar del todo, por diseño**. `/tests/*` es accesible a
propósito, pero `/panel/*` está tras Access a propósito también, y las pruebas
del panel importan de ahí. La cifra que vale como «todo en verde» es la local;
la de producción vale para lo que prueba, que es que el código del sitio
público funciona servido de verdad. Si algún día en producción falla algo que
NO sea del panel, eso sí es un problema.

### Repetido contra `https://lidialuque.com` al fusionar el bloque 3b (2026-08-27)

Tras `wrangler deploy` de `main` ya fusionada (versión
`59bbaf63-d822-428e-9695-52ea411b84e6`), comprobado con `curl` contra el dominio
real:

- `/` → **200**, `Content-Type: text/html`, `Cache-Control: no-cache`,
  `x-robots-tag: noindex`.
- `/robots.txt` → **200**. Mudar de dominio no ha anunciado la web.
- `/docs/estado-conocido.md`, `/.claude/launch.json` y
  `/worker/estatico/wrangler.toml` → **302** a la portada. El último importa
  más que los otros dos: es el archivo que lleva el nombre del bucket de R2.
- `/panel` **y también `/panel/css/panel.css`** → **302** a
  `ffffffstudio.cloudflareaccess.com`. Que el CSS redirija igual que el HTML es
  la comprobación que hace falta: significa que Access cubre el subárbol entero
  y no sólo la página.
- `/api/borrador` → **302** al mismo Access. Los dos Workers conviven en el
  dominio con la misma sesión, que es lo que evita el CORS entre panel y API.
- `luque.angelrubioortiz2005.workers.dev/panel` → **404**. Sigue apagado.
- `/contenido.json` → **200**, `application/json`, con `noindex`.
- `/tests/test` → **200**.

**Lo que sigue sin repetirse contra el dominio nuevo**, porque necesita un
navegador o una lista de recursos que `curl` no recorre solo: que las 99 pruebas
del arnés pasen servidas desde Cloudflare, las cabeceras de caché y los tipos
MIME de CSS, JS y tipografías, y los 21 recursos locales de la portada.

### Comprobaciones anteriores, contra la URL vieja

Comprobado contra `https://luque.angelrubioortiz2005.workers.dev` después de
desplegar — **la URL que sirvió esta comprobación está retirada hoy**:
`workers.dev` se apagó en la Tarea 7 del bloque 3b (ver el aviso al principio
de este documento), así que estos puntos hay que volver a comprobarlos contra
`https://lidialuque.com`:

- `/docs/*` y `/.claude/*` devuelven 302 y sirven la portada, no el markdown
  ni los archivos de configuración.
- `X-Robots-Tag: noindex` llega en todas las rutas probadas.
- Cabeceras de caché correctas: `no-cache` en `/`, `3600` en CSS y JS,
  `31536000, immutable` más `nosniff` en las tipografías.
- Tipos MIME correctos: `font/otf` en las tipografías, `text/css`,
  `text/javascript`, `image/svg+xml`.
- Las 51 pruebas que tenía entonces el arnés (`tests/test.html`) pasaban con el
  código servido desde Cloudflare. Hoy son 99: el bloque 3b añadió las del
  panel, y esta comprobación está pendiente de repetirse.
- Los 21 recursos locales que referencian `index.html` y `css/luque.css`
  devuelven los 21 un 200: nada roto por el despliegue.

## La deuda de las tipografías (saldada el 2026-09-12)

Hasta el 2026-09-12 el sitio publicaba tres versiones **Trial** de ABC Favorit
(`ABCFavorit-Regular-Trial.otf`, `-Bold-` y `-BoldItalic-`), que se
distribuyen para evaluación y no cubren un sitio público. Se sustituyeron por
**Space Grotesk**, bajo SIL Open Font License 1.1: un solo archivo variable,
`SpaceGrotesk-Variable.woff2`, con la licencia al lado en
`SpaceGrotesk-OFL.txt`. Los `.otf` de Favorit ya no están en el repositorio,
así que el siguiente despliegue deja de servirlos. En producción hay que
comprobar que `/SpaceGrotesk-Variable.woff2` responde 200 con
`content-type: font/woff2` y que las tres URL viejas de los `.otf` dan 404.

El cierre a buscadores (`robots.txt` y `X-Robots-Tag: noindex`) sigue puesto,
pero ya no lo justifica la tipografía. Abrirlo es una decisión aparte, anotada
en `docs/estado-conocido.md`.

## Despliegue del bloque 4f sin fusionar (2026-09-05)

Versión `f8dc8786-04be-4031-8021-ad75552a032f`. **Es el primer despliegue que no
sale de `main`**: el árbol viene de `git archive visor-movil-4f`, la rama del
bloque 4f, para que Ángel pueda probar el visor móvil de dos ejes en su teléfono
antes de decidir si el bloque entra en `main`.

Conviene ser explícito sobre por qué esto no contradice la sección de arriba
sobre Workers Builds. Lo que se desconectó el 2026-08-24 no fue «desplegar una
rama», fue **desplegar sin que nadie lo decidiera**: cualquier empujón a GitHub
publicaba, y así llegó al escaparate una rama sin fusionar y sin revisar. Aquí
la rama trae sus seis tareas revisadas una a una, una revisión final de conjunto
y 407 comprobaciones en verde, y el despliegue lo pidió el estudio en el momento
y para un fin concreto. La condición que aquel día se escribió —«que ninguna
rama a medias llegue al escaparate por el simple hecho de empujarla»— se sigue
cumpliendo: empujar no despliega nada.

Lo que sí deja esta decisión es una **divergencia temporal**: producción va por
delante de `main`. Se cierra fusionando el bloque cuando la prueba en el móvil
lo apruebe. Mientras dure, `main` no es lo que sirve `lidialuque.com`.

Comprobado tras desplegar, contra el dominio real:

- 136 archivos en el árbol exportado; ni `.superpowers/`, ni `.worktrees/`, ni
  `.wrangler/` (`wrangler` subió 11 archivos, 123 ya estaban).
- `js/movil-visor.js`, `js/movil-hud.js`, `js/movil-recorrido.js` y
  `js/visor-foco.js` responden `200`.
- El `index.html` publicado carga `js/movil-recorrido.js`, que es la etiqueta
  que faltaba y que la suite no puede vigilar.
- El sitio **sigue cerrado a buscadores**: `robots.txt` con `Disallow: /` y la
  cabecera `x-robots-tag: noindex` en la respuesta.

## La divergencia, cerrada (2026-09-09)

La sección de arriba dejaba una divergencia abierta y hay que decir que ya no
existe, porque una frase que el repositorio contradice es el fallo característico
de este proyecto.

Entre medias hubo un segundo despliegue desde la misma rama, versión
`c02cde37-9019-430f-b47c-d5e2cc69f70b`, 140 archivos: la animación de entrada de
la pieza al deslizar, que fue lo único que la prueba en el teléfono de Ángel
encontró mal. Con ella la suite quedó en 422 comprobaciones.

El bloque 4f está **fusionado en `main`**. `main` vuelve a contener todo lo que
sirve `lidialuque.com`; el despliegue que hay en el escaparate salió del commit
`4da242b`, que ahora está dentro de la historia de `main`. No hace falta volver
a desplegar para cerrar la divergencia: el código servido y el fusionado son el
mismo.

Lo que sigue igual: **empujar a GitHub no despliega nada**. El despliegue es a
mano y lo decide el estudio en el momento.

## El contenido real, en el escaparate (2026-09-10)

**Desplegado el commit `775f32a` de `main`**, versión
`2f0a6291-3fc1-4e9f-bb81-89e1bb04af81`, 150 archivos. Es el primer despliegue
con el trabajo de Lidia: se acabaron los doce proyectos de picsum.

Antes del despliegue, las **195 imágenes derivadas subidas a R2 con `--remote`**,
y ahí está la lección de esta ronda, escrita arriba en su sección: la primera
tanda se subió sin ese flag, fue a parar al almacén local y **la verificación
salió perfecta leyendo esa misma copia local**. En R2 no había nada. Lo delató el
sitio real con un 404.

Comprobado después contra `https://lidialuque.com`, que es lo único que no se
puede engañar solo:

- **Las 195 imágenes**: `200`, los bytes exactos del archivo local y
  `image/jpeg`, una por una. Cero discrepancias.
- **`/contenido.json`**: 8 proyectos y 65 piezas, en el orden de Lidia.
- **La galería**: las ocho portadas cargan con su tamaño real, medido en el
  navegador con `naturalWidth`, no mirando una captura.
- **El arnés**: 393 pasan, 44 fallan. Los 44 son, otra vez, los tres módulos del
  panel tras Access; **nada del sitio público falla**.
- **Las rutas cerradas**: `/docs/*`, `/.claude/*`, `/worker/*` y el nuevo
  `/herramientas/*` dan 302.

`/herramientas/*` se cerró **al ir a desplegar y no al crearlo**, que es tarde.
Es la segunda vez que un directorio de primer nivel se cuela hasta aquí; la
advertencia en mayúsculas de `_redirects` no bastó.

Sigue **cerrada a los buscadores**, y ahora por un solo motivo: las tipografías
siguen siendo Trial. El del contenido de relleno dejó de valer.

## La hoja de contacto, en el escaparate (2026-09-12)

**Desplegado el commit `29dfeb1` de `main`** (fusión del PR #26), versión
`e2c03b3a-954d-4237-a67b-f33967f5c18d`: 16 archivos subidos nuevos y 174 ya en
Cloudflare, sobre un export de 192 archivos con `panel/index.html` dentro.
Lleva el PR #25 (la barra crece: categorías a 1,2 rem con área de clic de
42 px) y el PR #26 (la hoja de contacto, `#/contacto`, `js/contacto.js`;
«Contacto» solo en la esquina derecha de la barra, con el rol «Dirección de
fotografía» retirado de la barra a petición de Ángel; en el móvil el enlace va
al pie de la rejilla).

Desplegado desde Git Bash con la tubería `git archive origin/main | tar -x`,
que ahí sí es binaria; el directorio temporal, en `/c/Users/.../Temp/`.

Comprobado después contra `https://lidialuque.com` con `curl -A Mozilla/5.0` y
una query de cache-bust —no con la pestaña del navegador, que guarda `/css` y
`/js` una hora—:

- **`/`**: el `index.html` vivo lleva `.navbar-contacto` y ya no lleva
  `.navbar-rol`.
- **`/js/contacto.js`**: `200`, 6.397 bytes. **`/css/luque.css`**: incluye las
  reglas de `.contacto`.
- **`/contenido.json`**: sigue en la versión 7 con los ocho proyectos; el
  despliegue no lo toca.
- **Las rutas cerradas**: `/docs/*`, `/.claude/*`, `/worker/*` y
  `/herramientas/*` dan 302.

**Pendiente, y público desde este despliegue:** el correo, el Instagram y el
Vimeo del marcado de la hoja (`hola@lidialuque.com`, `@lidialuque`,
`vimeo.com/lidialuque`) son suposiciones sobre el dominio, no datos
confirmados con Lidia. Se cambian en `index.html`, y sólo ahí. La hoja sobre
fotos reales y en un teléfono sigue sin verse: es de la lista manual de
`docs/comprobaciones-en-produccion.md`.

Sigue **cerrada a los buscadores** por las tipografías Trial.

### Los datos reales de la hoja (2026-09-12, después)

**Desplegado el commit `f1a107e` de `main`** (fusión del PR #28), versión
`08ea8394-7563-49b7-80e5-0fcb41ade566`: 3 archivos nuevos, 187 ya subidos.
La hoja de contacto lleva ya el correo y el teléfono que dio Ángel
(`lidia.luque.rea@gmail.com`, `644 970 369`, con `mailto:` y `tel:`);
Instagram y Vimeo salieron por no estar confirmados. Comprobado contra
`https://lidialuque.com` con cache-bust: el `index.html` vivo lleva los dos
datos nuevos, ninguno de los supuestos, y `/panel` y `/docs/*` siguen dando
302. Con esto, lo pendiente de la entrada anterior queda cerrado.

### El Instagram en la hoja (2026-09-12, tercero)

**Desplegado el commit `6b268c8` de `main`** (fusión del PR #30), versión
`624695ac-0fbd-4835-9a92-795948257614`: 3 archivos nuevos, 187 ya subidos.
La hoja de contacto añade la fila de Instagram, `@luque.rea`, que dio Ángel.
Comprobado contra `https://lidialuque.com` con cache-bust: el `index.html`
vivo lleva el enlace a `instagram.com/luque.rea` junto al correo y el
teléfono, y `/panel` y `/docs/*` siguen dando 302.

### Space Grotesk y el logotipo en SVG (2026-09-12, quinto)

**Desplegado el commit `d8eb25c` de `main`**, versión
`47ea59c9-bd2a-4f32-bab7-fb7cda15cbc4`, 194 archivos. Entran los PR #34 y #35
—Space Grotesk en vez de las tres ABC Favorit Trial, y el logotipo del navbar
y del pie como SVG original en línea— y tres correcciones que salieron al
preparar el despliegue.

Comprobado contra `https://lidialuque.com` con cache-bust:
`/SpaceGrotesk-Variable.woff2` da 200 con `font/woff2`, 49.252 bytes y
`max-age=31536000, immutable`; las tres URL de los `.otf` de Favorit dan 404;
`/SpaceGrotesk-OFL.txt` da 200, que es **obligatorio**, no un descuido; la
hoja viva declara `Space Grotesk`; el `index.html` vivo lleva `navbar-logo` y
`pie-logo`; la cabecera `x-robots-tag: noindex` sigue puesta; las ocho
portadas cargan; `/panel` sigue dando 302 a Access. En el navegador, con la
hoja forzada, el logo sale amarillo en la barra (18×61) y negro en el pie
(8×27), y la consola está limpia.

**Lo que hubo que corregir sobre la marcha, y por qué importa:**

1. **`pruebas-tipografia/` habría contestado 200.** Es utillaje de diseño. Se
   cerró con 302 en `_redirects`, como `docs/`, `worker/` y `herramientas/`.
   Es la tercera vez que un directorio de primer nivel llega hasta aquí: el
   `_redirects` se mira al añadirlo, no al desplegar.
2. **La tipografía nueva perdió la caché de un año.** La regla era `/*.otf`, y
   el `.woff2` cayó en el `/*` general —`max-age=0, must-revalidate`—, o sea
   una petición condicional por visita. Hicieron falta dos despliegues:
   `177cf67` lo arregló con `/*.woff2`. **Al cambiar la extensión de un
   recurso hay que mirar `_headers`.**
3. **`CLAUDE.md`, `handoff.md` y `.gitignore` contestaban 200** desde mucho
   antes, y se cerraron con 302 a petición de Ángel. `_redirects` cubría los
   directorios pero nunca los archivos sueltos de la raíz.

**La suite servida desde producción no da 699 en verde, y no es un fallo del
despliegue.** `/tests/test.html` redirige con 307 a `/tests/test` (Cloudflare
Assets quita la extensión) y la página carga bien, pero los 16
`<script src="../panel/js/*.js">` que el arnés necesita están **detrás de
Access**: contestan 302 y el navegador no los ejecuta. Salen 471 en verde y
161 en rojo, y el propio arnés lo dice —«El arnés no pudo cargar
`../panel/js/identificador.js`»—. Las 161 son todas del panel. Para ver la
suite entera en verde hay que abrirla en local, o con una sesión de Access
abierta en el navegador. Conviene no volver a diagnosticar esto desde cero.

### El contacto al pie de la portada móvil (2026-09-12, cuarto)

**Desplegado el commit `da6b4a5` de `main`** (fusión del PR #32), versión
`ad68a82c-4bcd-4907-a8da-e56b6cfb5246`: 6 archivos nuevos, 184 ya subidos.
En el móvil el contacto deja de ser un enlace y una página aparte: la misma
sección `#contacto` se muda al pie de la rejilla (`Contacto.colocar`, desde
las dos ramas de `Movil.init`) y es el final del recorrido, debajo de las
imágenes; fuera el enlace del pie y el aspa. Decisión de Ángel. Comprobado
contra `https://lidialuque.com` con cache-bust: el `index.html` vivo llama a
`Contacto.colocar` y ya no lleva `.hoja-contacto`, `js/contacto.js` sirve la
función `colocar`, la hoja de estilos lleva `body.es-movil .hoja .contacto`,
y `/panel` sigue dando 302. La suite quedó en 699 pruebas en verde.
