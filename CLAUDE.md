# LUQUE! — notas para el asistente

La web del estudio de Lidia Luque, publicada en `https://lidialuque.com`. Sitio
estático **sin build y sin dependencias**: HTML, CSS y JavaScript de navegador
que se sirven tal cual. Detrás hay un Worker de Cloudflare (`worker/`) con un
bucket R2 y Cloudflare Access delante de `/panel`, la única superficie de
escritura del sitio.

El código, los comentarios, los nombres de archivo y la documentación están en
**español**. Lo nuevo también.

## Cómo se prueba

- **La suite del navegador** (~673 comprobaciones): `python -m http.server 8765`
  desde la raíz y abrir `tests/test.html`. Arnés propio (`tests/arnes.js`), no
  hay corredor de pruebas. También está el perfil `luque` de
  `.claude/launch.json` para levantarlo desde el panel Browser.
- **El Worker**: `cd worker && node --test`. Es lo único comprobable sin
  navegador ni despliegue, y tarda segundos. Node vive en `C:\nvm4w\nodejs`; si
  la terminal no lo ve, antepón esa carpeta al PATH.
- **Las herramientas de Python**: `python tests/prueba_derivar.py`,
  `python tests/prueba_auditar_rutas.py`, `python tests/prueba_guardas.py`
  (esta última comprueba las guardas de `.claude/hooks/`).

## Las reglas duras

**`contenido.json` no se edita a mano.** Lo genera
`python herramientas/derivar_imagenes.py <originales> --contenido` mezclando los
datos humanos de `herramientas/proyectos.json` con las fotos que hay en disco.
La fuente humana —textos, fichas, orden de la galería— es `proyectos.json`. Hay
un hook que bloquea Edit y Write sobre el archivo generado. Después de derivar,
pasa `tests/auditar_rutas.py`: una ruta mal escrita sigue siendo una ruta válida
y la validación no la atrapa.

**Las fotos no están en el repositorio.** `img/` está en `.gitignore` — son
decenas de MB derivados, y en producción los sirve R2. **En local, toda foto da
404 y eso es lo correcto.** Nada visual que dependa de las fotos se puede dar
por comprobado sin desplegar.

**Desplegar es un gesto manual.** No hay integración automática: Workers Builds
se desconectó a propósito el 2026-08-24 después de publicar una rama sin
fusionar. El procedimiento está en `docs/despliegue.md`, y el guion completo —con
el `.tar` a disco, porque la tubería de PowerShell rompe el archivo— en
`docs/comprobaciones-en-produccion.md`. **Subir a `main` no publica nada.**

**`workers_dev = false` y `preview_urls = false` son seguridad, no limpieza.**
Access sólo puede ponerse delante de un nombre de host de `lidialuque.com`, no
de `workers.dev`. Si compruebas la URL vieja y no responde, ese es el
comportamiento correcto. No las vuelvas a encender: hay un hook que bloquea
los cambios que las reenciendan, incluido borrar la línea (el valor por
omisión de las dos es `true`). El resto de `wrangler.toml` se edita normal.

**Antes de publicar desde el panel, comprueba que el borrador coincide con la
web.** Publicar copia `borrador.json` sobre `contenido.json`. Si alguien escribió
`contenido.json` por fuera del panel, el borrador está viejo y la primera
publicación vacía la web — ha pasado dos veces. Se siembra con:

```bash
wrangler r2 object put luque-contenido/borrador.json --file contenido.json --content-type application/json --remote
```

## Cómo está hecho el código

Módulos IIFE que cuelgan de `window` (`window.Galeria`, `window.VisorEstado`…),
sin `import` ni bundler. **El orden de los `<script>` importa**: si añades un
módulo o cambias una dependencia, va en `index.html` *y* en `tests/test.html`,
con el mismo orden relativo. Varios comentarios de `test.html` explican por qué
una línea concreta está donde está; respétalos.

Si `panel/js/panel.js` busca un nodo nuevo al arrancar, ese nodo va también en la
constante `HTML` de `tests/pruebas-panel.js`, o la sección entera del panel se
cae dentro del iframe.

## Trabajar en paralelo

Suele haber varias sesiones a la vez y **`main` se mueve solo**: al desplegar,
fija el commit (`git rev-parse --short origin/main`) y anótalo. El stash está
compartido entre worktrees: nunca `git stash` a secas.

## Dónde mirar antes de tocar

- `docs/estado-conocido.md` — decisiones tomadas y trampas conocidas. Es largo;
  búscalo por sección antes de rediseñar nada.
- `docs/comprobaciones-en-produccion.md` — lo único que queda abierto, y es todo
  manual, de Ángel, con despliegue y sesión de Access por delante.
- `docs/despliegue.md`, `docs/superpowers/specs/` y `docs/superpowers/plans/`.
