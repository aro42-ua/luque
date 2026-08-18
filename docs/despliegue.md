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

## Los pasos que hace el estudio

Dos cosas de este bloque las hace el estudio desde su propio navegador, no
Claude:

- **`gh auth login`.** Autenticar la cuenta `aro42-ua` contra GitHub. Es
  distinto de crear el repositorio: `gh repo create` lo ejecuta luego el
  controlador, pero necesita una sesión ya iniciada, y esa sesión sólo la
  puede abrir quien tiene las credenciales. Claude no introduce credenciales
  de nadie.
- **Crear la cuenta de Cloudflare** y autorizarla contra GitHub al montar el
  proyecto de Pages. Igual: es una cuenta del estudio, y Claude no crea
  cuentas.

Ambas están marcadas como tales en las tareas 4 y 5 del plan y no se delegan a
un subagente.

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
