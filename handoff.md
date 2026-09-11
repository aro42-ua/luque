# Handoff — panel de LUQUE!, estado tras los bloques 3c y 3d

Escrito el 2026-09-11. Sustituye a una versión anterior de este mismo archivo
que daba los bloques 3c y 3d por hacer: **ya están hechos y fusionados en
`main`**, y esta nota lo recoge para que nadie los vuelva a planificar.

## Qué pasó

Dos sesiones trabajaron a la vez sobre lo mismo. Una, en el worktree
`bloques-3c-3d-6acff7`, escribió planes para el 3c y el 3d. Otra, desde
`main`, escribió planes con **los mismos nombres de archivo**, los ejecutó,
los fusionó (PR #13) y siguió con un bloque de diseño de la pantalla del
proyecto (PR #15, #16, #17). Al abrir el PR del worktree, Git vio los dos
planes añadidos por ambos lados con contenido distinto: conflicto add/add.

Se resolvió quedándose con los planes de `main`, que son los que se ejecutaron
y anotan al final lo que salió distinto. Los del worktree se descartaron; no
aportaban nada que no estuviera ya hecho.

## Estado real (comprobado contra `origin/main` el 2026-09-11)

- `panel/js/` tiene las tres pantallas: `rutas.js`, `pantallas.js`,
  `proyecto.js`, `fotos.js`, `edicion.js`, `imagenes.js`, `subida.js`,
  `subir.js`, `cambios.js`, `publicacion.js`, `pantalla-publicar.js`,
  `publicar.js`, `nuevo.js`, además de los cinco del 3b.
- La suite del navegador va por **673** comprobaciones (según
  `docs/estado-conocido.md`); se sirve con `python -m http.server 8000` y se
  abre `tests/test.html`.
- Las fixtures del Worker ya llevan `ficha` (`1ef5450`): `cd worker && node
  --test` debería estar en verde. Node está en `C:\nvm4w\nodejs` (nvm para
  Windows); si la terminal no lo ve, antepón esa carpeta al PATH.
- `docs/estado-conocido.md`, sección «El panel tiene tres pantallas (bloques
  3c y 3d)» y la siguiente, «La pantalla del proyecto, vestida», son la
  referencia de lo que hay y de sus trampas (por ejemplo: un nodo nuevo que
  `panel.js` busque al arrancar va también en la constante `HTML` de
  `tests/pruebas-panel.js`, o la sección entera del panel cae en el iframe).

## Lo que sigue pendiente

Dos comprobaciones manuales **en producción, y son de Ángel**, no del
asistente (hace falta desplegar con `wrangler` y una sesión de Access):

1. **Tarea 9 del plan 3c** (`docs/superpowers/plans/2026-09-11-panel-proyecto-bloque-3c.md`):
   16 puntos, entre ellos subir un original de 40 MB, una foto vertical que
   salga vertical, la rejilla con teclado solo, cambiar la portada.
2. **Tarea 5 del plan 3d** (`…-panel-publicar-bloque-3d.md`): publicar de
   verdad, ver el cambio en la web pública, el 409 con dos pestañas, y que
   `borrador.json` siga dando 404.

El plan del 3d conserva sus casillas sin marcar aunque el código esté hecho;
marcarlas al hacer esas comprobaciones sería lo limpio.

## Sobre este worktree y su PR

La rama `claude/bloques-3c-3d-6acff7` sólo aporta este archivo. Si no se
quiere un `handoff.md` en la raíz del repositorio —no hay ningún otro—, lo
correcto es cerrar el PR sin fusionar y borrar la rama. Si se fusiona, este
archivo es lo único que entra.
