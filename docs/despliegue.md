# Cómo se despliega

Dos piezas, nada más. Un repositorio privado en GitHub, `aro42-ua/luque`, y un
proyecto de Cloudflare Pages conectado a su rama `main`. Cada empuje a `main`
dispara un despliegue nuevo; no hay un tercer sistema ni un paso intermedio.

## Sin paso de compilación

La web es HTML, CSS y JavaScript servidos tal cual: sin Node, sin npm, sin nada
que instalar en la máquina para que funcione. En la configuración de Pages eso
se traduce en dos campos:

| Campo | Valor |
|---|---|
| Build command | *(vacío)* |
| Build output directory | `/` |

Es el paso donde es más fácil equivocarse, porque Pages ofrece por defecto
plantillas pensadas para proyectos que sí compilan (React, Next, Hugo...) y
sugiere un comando y un directorio de salida (`dist`, `build`...) que aquí no
existen. Si se acepta esa sugerencia, el despliegue construye contra un
directorio que nunca se genera y sirve un sitio vacío o directamente falla. La
raíz del repositorio **es** el sitio; el directorio de salida es `/`.

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

## Los pasos que hace el estudio

Dos pasos de este bloque los hace el estudio desde su propio navegador, no
Claude:

- **`gh auth login`**, para crear el repositorio en GitHub. Requiere una
  sesión autenticada de verdad; Claude no introduce credenciales de nadie.
- **Crear la cuenta de Cloudflare** y el proyecto de Pages. Igual: es una
  cuenta del estudio, y crearla o autorizarla no es algo que se delegue.

Ambos están marcados como tales en las tareas 4 y 5 del plan y no se ejecutan
desde un subagente.

## Cómo se verifica un despliegue

La lista de comprobación completa —que cada recurso responde con el tipo
correcto, que las cabeceras de caché llegan, que el arnés de pruebas pasa
51/51 servido desde Cloudflare, y la secuencia visual completa medida contra
la URL real— es la tarea 6 del plan de este bloque
(`docs/superpowers/plans/2026-08-18-despliegue-bloque-1.md`). No se repite
aquí para no tener dos copias que se puedan desincronizar.

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
