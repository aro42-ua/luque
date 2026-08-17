# Panel de contenido y despliegue — LUQUE!

Fecha: 2026-08-17

## Objetivo

Hoy el contenido de la web está escrito a mano en `js/datos.js`: doce proyectos
con sus coordenadas, sus fichas y sus fotos, todos de relleno. Publicar un
trabajo nuevo exige editar JavaScript, y eso deja a la fotógrafa dependiendo de
alguien que sepa hacerlo.

Se despliega la web y se le añade un panel de administración donde el estudio
—el creador y la fotógrafa— crea proyectos, sube y ordena fotografías y edita
las fichas, sin tocar código.

## La restricción que se abandona

**La web deja de funcionar abriendo `index.html` con doble clic y sin
conexión.** Conviene dejarlo escrito con todas las letras, porque contradice las
restricciones globales de los planes del 28 y el 30 de julio, y porque por
respetarla se rechazaron `fetch`, los módulos ES, GSAP y un SVG usado como
máscara de CSS. Quien lea el repositorio dentro de un año necesita saber que el
cambio fue deliberado y de qué fecha es.

Nació porque no había Node ni npm en la máquina, no porque el estudio lo
necesitara. Con la web hospedada deja de tener sentido.

Lo que **sí** se conserva: la web pública sigue siendo un paquete estático que
no habla con ninguna base de datos. Pide un archivo de contenido al arrancar; el
resto de lo que viaja por red son recursos —las imágenes y, sólo en los
proyectos de vídeo, el reproductor de Vimeo—.

Durante el diseño afirmé que esta arquitectura «recupera casi entero el doble
clic sin conexión, y lo único remoto serían las imágenes». Era falso: el archivo
de contenido también viaja por red y bajo `file://` un `fetch` está bloqueado.
Queda corregido aquí para que la afirmación no sobreviva en ninguna parte.

## Alcance

Dentro:

- Desplegar la web pública en Cloudflare Pages.
- Un panel de administración con autenticación para dos personas.
- Crear y borrar proyectos.
- Subir, borrar y ordenar fotografías; elegir cuál es la portada.
- Editar la ficha técnica y el enlace de Vimeo.
- Publicar: pasar el borrador a producción.
- Sustituir las coordenadas escritas a mano por una composición generada.
- Enlazar el vídeo desde Vimeo conservando el reproductor propio.

Fuera, decidido explícitamente:

- **El compositor visual** para mover y redimensionar proyectos arrastrándolos
  sobre el lienzo real. Se quiere, pero en una segunda entrega; hasta entonces
  la composición sale del orden de la lista.
- **Gestionar categorías.** La barra superior es un SVG dibujado a mano con
  cuatro celdas de geometría exacta; una quinta obliga a redibujarla.
- **Subir archivos de vídeo.** El vídeo vive en Vimeo.
- Estadísticas, SEO, formulario de contacto, varios idiomas.

## Arquitectura

Cuatro piezas y **ninguna base de datos**:

```
Cloudflare Pages     la web pública + /panel
Cloudflare Access    deja entrar al panel sólo a dos correos
Worker               el único código con permisos de escritura
R2                   borrador.json · contenido.json · las imágenes
```

### Por qué Cloudflare

Una web de fotografías es tráfico de salida, y ahí la diferencia es decisiva:
R2 no cobra salida y Pages sirve sin límite de ancho de banda, mientras que la
capa gratuita de Supabase topa en 5 GB al mes y pausa el proyecto tras siete
días sin actividad — dos modos de fallo silenciosos y totales para el escaparate
de un estudio.

Las cifras de las capas gratuitas son de agosto de 2026 y **se confirman al
implementar**, no se dan por buenas.

Contrapartida aceptada: `wrangler`, el CLI de Cloudflare, necesita Node, que no
está instalado. Se instala con `winget`.

### Dónde vive cada cosa

```
index.html  css/  js/      la web pública, como hasta ahora
panel/                     el panel: su propio index.html, css y js
worker/                    el Worker y su configuración
tests/                     el arnés, ampliado
```

El panel **no comparte código con la web**: son dos aplicaciones con problemas
distintos. Comparten la hoja de tipografías y las variables de color, y nada
más. Mezclarlas engordaría los módulos de la galería, que ya rozan su límite
—`galeria.js` va por 294 líneas de 300—.

El límite de 300 líneas por archivo se aplica también a `panel/js/` y a
`worker/`.

### El contenido son dos archivos

`borrador.json` es lo que el panel edita libremente. `contenido.json` es lo que
lee la web. **Publicar es copiar el primero sobre el segundo.**

No hay base de datos porque no hace falta: dos personas y unas pocas ediciones
al año. Cada archivo lleva un número de `version` que sube en cada guardado; si
al guardar la versión del servidor no es la que el panel leyó, el guardado se
rechaza y el panel avisa en lugar de pisar el trabajo del otro.

### El Worker

Es el único componente con credenciales. Hace tres cosas:

- Firma subidas a R2, para que el navegador suba directo sin que las claves
  pasen nunca por él.
- Escribe `borrador.json` comprobando el número de versión.
- Publica: valida el borrador entero y sólo entonces lo copia sobre
  `contenido.json`.

Va detrás de Cloudflare Access, así que sólo llegan a él los dos correos
autorizados. **El Worker no confía en eso**: vuelve a verificar la identidad que
Access le adjunta en cada petición.

## El modelo de datos

```json
{
  "version": 7,
  "actualizado": "2026-08-17T12:00:00Z",
  "proyectos": [
    {
      "id": "bruma",
      "titulo": "Bruma",
      "categoria": "editorial",
      "ficha": { "cliente": "Vogue ES", "anio": 2025,
                 "camara": "Alexa Mini", "optica": "Zeiss Super Speed" },
      "portada": "img/bruma/portada.jpg",
      "tipo": "fotos",
      "piezas": [ { "url": "img/bruma/01.jpg", "ancho": 2400, "alto": 3000 } ]
    }
  ]
}
```

**Desaparece `pos:{x,y,w}`.** La posición de cada proyecto en el lienzo sale de
la ranura que le corresponde por su índice en la lista. El orden de la lista
**es** la composición.

**El `id` se genera del título una sola vez y se congela.** Va en la URL
(`#/bruma`), así que renombrar un proyecto no puede romper un enlace que la
fotógrafa ya haya mandado a un cliente. Al crearlo, el panel lo deriva del
título, comprueba que no se repita y que no choque con el nombre de una
categoría — esa comprobación ya existe en `validarDatos`.

**La portada es una de las piezas, elegida.** Hoy se deduce de la primera foto;
pasa a ser una decisión de quien publica.

**`tipo`** vale `fotos` o `video`. Los de `fotos` llevan `piezas`; los de
`video` llevan `vimeo` con el identificador, y su portada se descarga de Vimeo
una sola vez al publicar y se guarda en R2. La galería no consulta a Vimeo en
cada visita.

Los doce proyectos actuales son de relleno, así que la migración consiste en
sembrar el borrador con ellos.

## La composición

Hoy conviven dos sistemas: las coordenadas a mano de `datos.js` y las ranuras
generadas de `js/layout-filtrado.js`. Se quedan en uno solo, el generado, porque
el panel no puede pedirle a nadie que invente coordenadas que no se solapen.

**Esto cambiará el aspecto del lienzo sin filtrar** respecto al actual. Es
consecuencia aceptada, no efecto secundario: se decidió a sabiendas de que la
composición a mano se pierde hasta que llegue el compositor visual.

El patrón de ranuras debe conservar la irregularidad que hace que el espacio se
sienta explorable y no tabulado, y garantizar que dos proyectos nunca se
solapen sea cual sea su número.

## El vídeo

La fotógrafa pega un enlace de Vimeo. Se conserva **la línea de tiempo propia**
de `js/visor-video.js` —las marcas en L amarillas, operables con teclado—
controlando el reproductor de Vimeo con su API en lugar de la etiqueta `video`.
Se descarta el `iframe` con la interfaz de Vimeo: rompería el amarillo y negro.

Consecuencia aceptada: el visor de vídeo pasa a depender de que cargue un script
de Vimeo. Es la primera dependencia de red de terceros que se admite en el
proyecto, y sólo afecta a los proyectos de vídeo.

## El panel

Tres pantallas:

1. **Los proyectos.** La lista completa, arrastrar para reordenar —que es
   componer—, crear y borrar.
2. **Un proyecto.** Título, categoría, los cuatro campos de la ficha, el enlace
   de Vimeo si es de vídeo, y la rejilla de fotos: soltar para subir, arrastrar
   para ordenar, borrar, marcar la portada.
3. **Publicar.** Qué ha cambiado desde la última publicación, y el botón.

### Las imágenes se redimensionan en el navegador

Un original ronda entre 20 y 50 MB. El panel genera dos tamaños **antes de
subir**, tomando como referencia los que usa la web hoy:

- **800 × 1000** como máximo para la portada en la galería.
- **2400 × 3000** como máximo para la pieza, que es lo que le da recorrido a la
  lupa.

Son **cotas, no medidas exactas**: se reduce hasta caber en esa caja
**conservando la proporción original**, y una foto apaisada saldrá con otras
cifras. Deformar la fotografía de alguien para cuadrar un número sería
inaceptable, y el sitio ya está preparado para ello: la portada se recorta con
`object-fit:cover` dentro de un marco 4:5 y la pieza se muestra entera con
`object-fit:contain`. Por eso cada pieza guarda su `ancho` y su `alto` reales.

Así no hay procesado de imagen en el servidor ni subidas de 50 MB desde una
conexión doméstica.

### Estética

El panel comparte la tipografía ABC Favorit y el amarillo y negro del sitio,
**pero no sus gestos**: cursor del sistema, anillos de foco convencionales, sin
lienzo espacial y sin esquinas volando. `cursor:none` mientras se arrastran
fotografías sería hostil. Se parece a LUQUE!, se comporta como una herramienta.

## Accesibilidad

- **Todo lo que se hace arrastrando se puede hacer con teclado.** Reordenar
  proyectos y fotos tiene su equivalente explícito; el arrastrar y soltar es un
  atajo, nunca el único camino.
- Toda subida ofrece un selector de archivos además de soltar.
- Los formularios llevan etiquetas reales y los errores se anuncian.
- Se respeta `prefers-reduced-motion`.

Es la misma vara de medir que ya se aplicó al visor, donde la línea de tiempo
tuvo que hacerse operable con teclado.

## Errores y casos límite

- **Publicar es atómico.** `contenido.json` se escribe sólo después de que todas
  las imágenes estén confirmadas en R2. Una publicación a medias no existe.
- **Una subida que falla no arrastra a las demás.** Cada archivo se reintenta
  por separado y el panel dice cuáles quedaron fuera.
- **Conflicto de versión.** Si dos sesiones editan a la vez, la segunda en
  guardar recibe un rechazo y un aviso, no un pisotón.
- **Borrar un proyecto no borra sus imágenes de R2.** Quedan huérfanas a
  propósito, para que un borrado accidental sea recuperable. Limpiarlas es una
  acción aparte y explícita.
- **Un borrador inválido no se puede publicar.** El Worker valida con las mismas
  reglas que `validarDatos` y devuelve la lista de problemas.
- **Si `contenido.json` no carga**, la web muestra un estado vacío honesto, no
  una galería rota a medias.

## Pruebas

El arnés actual (`tests/test.html`, 51 pruebas, ES5, sin Node) cubre la lógica
pura y se amplía con: generación y unicidad de identificadores, validación del
borrador, el patrón de ranuras —incluido que nunca se solapen— y el cálculo de
qué ha cambiado entre borrador y publicado.

Con Node instalado, el Worker tiene sus propias pruebas: verificación de
identidad, rechazo por versión y atomicidad de la publicación.

Lo que sigue necesitando ojos humanos: si la composición generada se ve bien.

## Riesgos

**El aspecto del lienzo cambia.** Es el riesgo estético de este trabajo y sólo
se juzga mirándolo. Si la composición generada empeora lo que hay, la salida es
adelantar el compositor visual en lugar de maquillar el patrón de ranuras.

**El panel es la primera superficie con autenticación del proyecto.** Todo lo
anterior era una web sin estado. Un fallo aquí no rompe una animación: expone la
escritura del contenido. Por eso el Worker vuelve a verificar la identidad que
ya filtró Access.

**El vídeo depende ahora de un tercero.** Si Vimeo cambia su API, el reproductor
propio deja de funcionar. El coste de la alternativa —alojar varios gigas de
vídeo— se juzgó mayor.

**Las cifras de las capas gratuitas cambian.** Las de aquí son de agosto de 2026
y se confirman al implementar.

## Requisitos previos

- Instalar Node con `winget` (lo necesita `wrangler`).
- Terminar `gh auth login`: el repositorio todavía no está en GitHub, y Pages
  despliega desde ahí.
- Una cuenta de Cloudflare y otra de Vimeo. **Las crea el estudio**: no creo
  cuentas ni introduzco credenciales.

## Criterios de aceptación

1. La web pública no contiene ningún proyecto escrito a mano: todo su contenido
   sale de `contenido.json`.
2. Un proyecto creado en el panel aparece en la web **después** de publicar, y
   no antes.
3. Borrar un proyecto en el panel no lo quita de la web hasta que se publica.
4. Reordenar la lista en el panel recompone la galería, y ningún par de
   proyectos se solapa con ningún número de proyectos.
5. Un tercer correo, ajeno a los dos autorizados, no llega al panel ni al
   Worker.
6. Todo lo que se hace arrastrando se puede hacer con teclado, y el panel es
   operable de principio a fin sin ratón.
7. Ninguna imagen subida a R2 supera su cota —800 × 1000 las portadas,
   2400 × 3000 las piezas— y ninguna sale deformada: la proporción original se
   conserva siempre.
8. Un proyecto de vídeo se reproduce con la línea de tiempo propia del visor, no
   con la interfaz de Vimeo.
9. Con dos sesiones editando a la vez, la segunda en guardar recibe un conflicto
   y no pierde nada la primera.
10. Si una subida de varias falla, las demás se completan y el panel dice cuál
    falló.
11. Ningún archivo de `js/`, `panel/js/` ni `worker/` supera las 300 líneas.

## Sobre el tamaño de este trabajo

Esto no cabe en un solo plan de implementación, y conviene decirlo antes de
escribir ninguno. Son cuatro bloques con dependencias claras entre ellos:

1. **Desplegar lo que ya existe.** Repositorio en GitHub, Pages sirviendo la web
   actual. Entregable por sí solo y sin riesgo para nada de lo construido.
2. **El contenido deja de estar escrito a mano.** `contenido.json`, la
   composición generada por ranuras y la migración de los doce proyectos de
   relleno. Aquí es donde cambia el aspecto del lienzo, así que es el bloque que
   necesita ojos humanos.
3. **El panel.** Access, el Worker, las tres pantallas, las subidas y publicar.
   El grueso del trabajo.
4. **El vídeo por Vimeo**, controlando el reproductor propio con su API.

Cada bloque tendrá su propio plan y su propia rama. El orden no es negociable:
el 3 no tiene dónde escribir sin el 2, y el 2 no se puede probar de verdad sin
el 1.
