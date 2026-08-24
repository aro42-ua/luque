# Cómo se despliega

La web está publicada en `https://luque.angelrubioortiz2005.workers.dev`. Dos
piezas: un repositorio privado en GitHub, `aro42-ua/luque`, que guarda el
código, y un **Worker de Cloudflare con recursos estáticos** — no un proyecto
de Pages — que sirve el sitio. No hay integración automática entre el
repositorio y Cloudflare: el despliegue es un comando de `wrangler` que hay
que ejecutar a mano cada vez.

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
> **Verificado con `wrangler dev` en local** (no contra el servidor real: la
> rama no se ha desplegado todavía) con un directorio de recursos que incluía
> `_redirects` y archivos de prueba bajo `docs/`, `.claude/` y `worker/`:
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
que responde en `luque.angelrubioortiz2005.workers.dev`. No confundir con
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

**Verificado con `wrangler dev` en local** (no contra el servidor real: la
rama no se ha desplegado todavía), con R2 emulado y un `contenido.json`
estático de prueba en el directorio de recursos:
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
nada, `https://luque.angelrubioortiz2005.workers.dev/docs/estado-conocido.md`
devolvería 200 a cualquiera — y ese archivo dice en texto plano que las
tipografías son versiones Trial sin licencia para uso público, a pocos clics
de los propios `.otf` descargables. `/.claude/launch.json` filtra además rutas
locales del tipo `C:/Users/...`. `robots.txt` y `X-Robots-Tag` no sirven aquí:
impiden **indexar**, no **acceder**.

`_redirects` cierra `/docs/*`, `/.claude/*` y `/worker/*`. Funciona aunque el
archivo exista: la documentación de Cloudflare dice que las reglas se aplican
*sin importar si un recurso casa con la petición*, así que el
redireccionamiento gana al archivo real. **Verificado contra el servidor real:**
`/docs/*` y `/.claude/*` devuelven 302 y sirven la portada, no el markdown ni el
JSON. `/worker/*` se añadió en el bloque 3a y **está sin verificar contra el
servidor**, porque la rama todavía no se ha desplegado.

**`/worker/*` es la lección que conviene no repetir.** El bloque 3a añadió un
directorio de primer nivel entero —el código del Worker de la API, sus pruebas
y `wrangler.toml` con el nombre del bucket— y nadie volvió a abrir este archivo
hasta la revisión final. `git archive` lo subía con todo lo demás. **Añadir un
directorio de primer nivel obliga a decidir aquí si se sirve o no**, porque el
valor por omisión es servirlo.

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
las 51 comprobaciones pasan **servidas desde Cloudflare**, con sus rutas, sus
tipos MIME y sus mayúsculas de verdad, y no sólo con doble clic en local. Es
justo lo que ninguna prueba en la máquina de desarrollo puede demostrar.
**Verificado:** las 51 pasan servidas desde
`https://luque.angelrubioortiz2005.workers.dev`.

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
python tests/pesar_imagenes.py
```

También desde la raíz, **antes de cada despliegue**. Baja por la red, así que
tarda unos segundos: por eso no está en el arnés del navegador, que tiene que
ser rápido y no fallar nunca por la conexión.

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

## Verificado en producción

**Todo lo de esta sección se comprobó ANTES de que este Worker tuviera
código** — antes de la Tarea 6, Paso 4 del bloque 3a. Sigue siendo cierto para
lo que prueba: el comportamiento de los recursos estáticos puros. Pero no
cubre nada de lo nuevo — `/contenido.json` y `/img/*` desde R2, la caída de
vuelta, `run_worker_first` — que sólo se ha verificado con `wrangler dev` en
**local** (sección de arriba), no contra el servidor real. **Quien despliegue
esta rama tiene que repetir ahí las comprobaciones de esa sección** antes de
dar el paso por bueno.

Comprobado contra `https://luque.angelrubioortiz2005.workers.dev` después de
desplegar:

- `/docs/*` y `/.claude/*` devuelven 302 y sirven la portada, no el markdown
  ni los archivos de configuración.
- `X-Robots-Tag: noindex` llega en todas las rutas probadas.
- Cabeceras de caché correctas: `no-cache` en `/`, `3600` en CSS y JS,
  `31536000, immutable` más `nosniff` en las tipografías.
- Tipos MIME correctos: `font/otf` en las tipografías, `text/css`,
  `text/javascript`, `image/svg+xml`.
- Las 51 pruebas del arnés (`tests/test.html`) pasan con el código servido
  desde Cloudflare.
- Los 21 recursos locales que referencian `index.html` y `css/luque.css`
  devuelven los 21 un 200: nada roto por el despliegue.

## La deuda de las tipografías

Los tres archivos son `ABCFavorit-Regular-Trial.otf`,
`ABCFavorit-Bold-Trial.otf` y `ABCFavorit-BoldItalic-Trial.otf`. Son versiones
**Trial**: se distribuyen para evaluación, y su licencia habitualmente **no
cubre un sitio público**, menos aún el de un estudio comercial. Publicarlas
además las deja descargables desde su URL directa — cualquiera que abra las
herramientas de red del navegador puede bajarse el archivo.

Esto no lo resuelve un desplegar: hay que comprar la licencia web en Dinamo o
sustituir la tipografía, y hacerlo **antes de anunciar la web**. Mientras no
esté resuelto, el sitio se despliega cerrado a los buscadores
(`robots.txt` y la cabecera `X-Robots-Tag: noindex`) y sin dominio propio. Es
deuda conocida, no un descuido, y queda anotada también en
`docs/estado-conocido.md`.
