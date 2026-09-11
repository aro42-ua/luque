# Comprobaciones en producción que nadie ha hecho todavía

Escrito el 2026-09-11. Es la lista única de lo que queda abierto en el
proyecto, y todo es de Ángel: ninguna prueba automática puede verlo porque
hace falta desplegar de verdad, una sesión de Access y, en dos de los cuatro
puntos, un teléfono en la mano. Junta las tablas manuales de los planes 3c y
3d con las dos cosas del móvil que `docs/estado-conocido.md` deja dichas como
«sin comprobar». No hay ningún bloque de código pendiente por detrás de esto.

Cada fila lleva casilla. Lo que no cuadre se anota al final, en «Lo que
salió distinto», y se vuelve a la tarea del plan que lo cubra.

## Antes de empezar

- [ ] **Fijar el commit.** `main` se mueve solo; apuntar aquí el que se
  despliega para que lo que se vea se pueda atribuir a algo:
  `git rev-parse --short origin/main` → `______`.
- [ ] **Desplegar** según `docs/despliegue.md`. Desde PowerShell, la tubería de
  `git archive | tar` rompe el archivo: escribir el `.tar` a disco.

  ```powershell
  $tmp = Join-Path $env:TEMP ("luque-deploy-" + (Get-Date -Format yyyyMMdd-HHmm))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  git archive main -o "$env:TEMP\luque.tar"
  tar -xf "$env:TEMP\luque.tar" -C $tmp
  wrangler deploy --config worker/estatico/wrangler.toml --assets $tmp
  ```

  Antes de pulsar, `$tmp` tiene unos 200 archivos y `panel/index.html` entre
  ellos; en la salida, `Uploaded N files` dice un número de ese orden.
- [ ] **El borrador dice lo mismo que la web.** Abrir `/panel`, entrar en
  Publicar: tiene que decir que no hay ningún cambio. Si no, alguien escribió
  `contenido.json` por fuera del panel y hay que sembrar el borrador antes de
  tocar nada, o la primera publicación vaciará la web:

  ```bash
  wrangler r2 object put luque-contenido/borrador.json --file contenido.json --content-type application/json --remote
  ```

- [ ] Tener a mano una foto de **40 MB**, una **hecha con el móvil de lado**,
  **diez** cualesquiera, y un **`.txt` renombrado a `.jpg`**.

Los ocho proyectos reales son `la-boquerona`, `la-rosa-roja-de-zamarrilla`,
`the-in-between`, `monstruacion`, `nuncaestuvetan-carmona`,
`tukatu-noche-absoluta`, `momento-magico` y `conejita-playboy`. Las tablas de
los planes citaban `bruma`, que era de relleno; aquí se usa `la-boquerona`.

## 1. La pantalla del proyecto (Tarea 9 del plan 3c)

Fuente: `docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md`.

| | # | Qué se mira | Qué tiene que pasar |
|---|---|---|---|
| [ ] | 1 | Abrir un proyecto desde la lista | Se ve su ficha escrita y sus fotos |
| [ ] | 2 | Recargar con `#/proyecto/la-boquerona` | Vuelve a la misma pantalla, no a la lista |
| [ ] | 3 | Soltar la foto de 40 MB | Sube en segundos, no en minutos |
| [ ] | 4 | Mirar el bucket tras esa subida | Tres archivos: `-1500`, `-3000`, `-250` |
| [ ] | 5 | Abrir el `-3000` a tamaño completo | El lado largo son 3000 px o menos, y la foto no está deformada |
| [ ] | 6 | Subir la foto hecha con el móvil de lado | Sale derecha, no tumbada |
| [ ] | 7 | Subir diez de golpe | Se ve el progreso y entran las diez |
| [ ] | 8 | Subir el `.txt` renombrado a `.jpg` | Dice cuál falló y las demás entran |
| [ ] | 9 | Arrastrar una foto sobre otra | Se reordena, y la marca amarilla aparece del lado correcto |
| [ ] | 10 | Repetir el 9 **sólo con teclado** | Se puede hacer entero: Tab hasta ‹ o ›, Enter |
| [ ] | 11 | Marcar otra portada, guardar y publicar | El lienzo enseña esa foto |
| [ ] | 12 | Quitar una foto y decir que no | No se quita |
| [ ] | 13 | Cambiar el título y guardar | El `id` de la URL no cambia |
| [ ] | 14 | Editar algo y cerrar la pestaña | El navegador avisa |
| [ ] | 15 | Editar algo, guardar, y cerrar | **No** avisa |
| [ ] | 16 | Todo lo anterior con `prefers-reduced-motion` puesto | Nada parpadea |

Las filas 3 a 8 dejan fotos de prueba en el bucket y en el borrador. Quitarlas
del proyecto antes de seguir; los archivos de `img/` se quedan, porque no
existe `DELETE /api/imagen` y eso está anotado como deuda desde el bloque 3a.

## 2. Publicar (Tarea 5 del plan 3d)

Fuente: `docs/superpowers/plans/2026-09-11-panel-publicar-bloque-3d.md`.
Cierra los criterios de aceptación 2, 3 y 9 del spec del panel.

| | # | Qué se mira | Qué tiene que pasar |
|---|---|---|---|
| [ ] | 1 | Entrar en Publicar sin tocar nada | Dice que no hay ningún cambio |
| [ ] | 2 | Cambiar una ficha, guardar, entrar | Nombra ese proyecto como cambiado |
| [ ] | 3 | Crear un proyecto sin fotos y entrar | Botón apagado, y dice que le faltan piezas y portada |
| [ ] | 4 | Cambiar algo y entrar **sin guardar** | Botón apagado, y dice que hay que guardar |
| [ ] | 5 | Guardar y volver a entrar | Botón encendido |
| [ ] | 6 | Pulsar y decir que no | No pasa nada |
| [ ] | 7 | Pulsar y decir que sí | Dice «Publicado» con la versión |
| [ ] | 8 | Abrir la web en otra pestaña y recargar | Se ve el cambio. **Criterio 2** |
| [ ] | 9 | Borrar un proyecto, guardar, **no publicar**, mirar la web | Sigue estando. **Criterio 3** |
| [ ] | 10 | Publicar, y mirar otra vez | Ya no está |
| [ ] | 11 | Reordenar, guardar, entrar en Publicar | Dice que cambia el orden y la composición |
| [ ] | 12 | Publicar y mirar el lienzo | Los proyectos están recolocados |
| [ ] | 13 | Dos pestañas: guardar en la A, publicar en la B | La B da el conflicto, apaga el botón y nombra la versión. **Criterio 9** |
| [ ] | 14 | Recargar la B y volver a publicar | Funciona |
| [ ] | 15 | Toda la pantalla **sólo con teclado** | Se llega al botón y se pulsa con Enter |
| [ ] | 16 | `https://lidialuque.com/borrador.json` desde una ventana sin sesión | 404. El borrador no es público |

Las filas 9 y 10 borran un proyecto real de la web. Hacerlo con el creado en
la fila 3, no con uno de los ocho. Antes de la fila 7, leer lo que la pantalla
dice que **se quita de la web**: si nombra proyectos que no se han tocado, no
es el momento de pulsar; es el aviso del borrador desincronizado de arriba.

Al terminar, marcar las casillas de la Tarea 5 en el plan del 3d: es el único
plan cuyo código está hecho y cuyas casillas siguen sin marcar.

## 3. El pellizco en un teléfono (bloque 4g)

Fuente: `docs/estado-conocido.md`, «Que el pellizco se sienta bien en un dedo
de verdad sigue sin comprobarse». Todo lo que cubren las pruebas son punteros
sintéticos; el tope de 6× y la vuelta al encaje se decidieron sobre el papel.
Se hace en la web pública, en un iPhone y, si se puede, en un Android.

| | # | Qué se mira | Qué tiene que pasar |
|---|---|---|---|
| [ ] | 1 | Abrir una foto en el visor y separar dos dedos | La foto amplía, y amplía **la foto**, no la página entera |
| [ ] | 2 | Seguir separando | Se para en el 1:1 con el archivo; con ninguna foto pasa de 6× |
| [ ] | 3 | Con la foto ampliada, arrastrar con un dedo | La foto se pasea; **no** cambia de parada |
| [ ] | 4 | Pasearla hasta el borde | Se frena en el borde de la pantalla, no deja negro por dentro |
| [ ] | 5 | Juntar los dedos por debajo del tamaño encajado y soltar | Vuelve al encaje, centrada |
| [ ] | 6 | Con la foto encajada, deslizar con un dedo | Cambia de parada, como antes del bloque |
| [ ] | 7 | Cambiar de parada tras ampliar | La nueva parada empieza encajada |
| [ ] | 8 | En la portada, sobre el amarillo, separar dos dedos | **Amplía**, y tirar hacia abajo sobre él **no** recarga |

Si la fila 8 falla, la sospechosa es `touch-action: pinch-zoom` sobre
`body.es-movil .hoja-hero` en `css/luque.css`, no el JavaScript. Si el tope o
la vuelta al encaje se sienten mal, el sitio es `TOPE` y `maxEscala` en
`js/movil-zoom.js`, y se decide con el teléfono delante.

## 4. El cuerpo bajo el visor móvil (`mvisor-abierto`)

Fuente: `docs/estado-conocido.md`, sección «Detalles menores aplazados».
`js/movil-visor.js` pone `mvisor-abierto` en `<body>` al abrir el visor y la
quita al cerrarlo, y **ninguna regla CSS la usa**. Lo natural sería bloquear el
desplazamiento del cuerpo, y se dejó sin decidir porque sólo se puede juzgar en
un teléfono. Esto no es una comprobación de que algo funcione: es tomar la
decisión.

| | # | Qué se mira | Qué se anota |
|---|---|---|---|
| [ ] | 1 | Abrir el visor desde media galería y deslizar verticalmente fuera de la foto | ¿Se mueve la galería por debajo? ¿Se nota? |
| [ ] | 2 | Cerrar el visor | ¿La galería sigue donde estaba, o ha saltado? |
| [ ] | 3 | Lo mismo con la barra de direcciones de Safari plegada y desplegada | ¿Cambia la altura del visor al abrir o al cerrar? |
| [ ] | 4 | Decidir | Bloquear el cuerpo (`overflow:hidden` sobre `body.mvisor-abierto`) o dejarlo como está |

Si se decide bloquear, va con la advertencia ya escrita: bloquear el cuerpo
cambia la posición de desplazamiento al cerrar y el comportamiento de la barra
de direcciones, y hay que volver a mirar las filas 2 y 3 después del cambio.
Si se decide dejarlo, quitar la clase de `js/movil-visor.js` o dejar dicho en
`docs/estado-conocido.md` que se queda a propósito sin reglas.

## Lo que salió distinto

Commit desplegado: `______`. Fecha: `______`.

| Punto | Fila | Qué pasó | Tarea del plan que lo cubre |
|---|---|---|---|
| | | | |
