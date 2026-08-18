# Despliegue (bloque 1) — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development
> (recomendado) o superpowers:executing-plans para implementar este plan tarea a
> tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** poner la web que ya existe en un servidor real —repositorio privado
en GitHub y Cloudflare Pages— sin cambiar ni una coma de su comportamiento.

**Arquitectura:** no se toca la web. Se añade lo que un servidor real exige y una
máquina de desarrollo no: una auditoría que detecte las rutas que sólo funcionan
porque Windows no distingue mayúsculas, cabeceras de caché, y una lista de
comprobación ejecutada contra la URL desplegada. El despliegue en sí es
configuración, no código.

**Herramientas:** Python 3.13 (ya instalado), gh 2.97.0 (instalado, **sin sesión
iniciada**), Cloudflare Pages. Sin Node en este bloque: `wrangler` no hace falta
hasta el bloque 3.

## Restricciones globales

- **La web pública no cambia de comportamiento en este bloque.** Ni un archivo de
  `js/`, `css/` ni `index.html` se modifica. Si algo hay que arreglar, se para y
  se decide; no se arregla de tapadillo dentro de una tarea de despliegue.
- Sin paso de compilación para la web pública. Se sirve tal cual está.
- Sin dependencias nuevas. La auditoría se escribe con la biblioteca estándar de
  Python, igual que el arnés se escribió sin Node.
- Comentarios, identificadores y mensajes en español.
- Ningún archivo de `js/`, `panel/js/` ni `worker/` supera las 300 líneas.
- **No creo cuentas ni introduzco credenciales.** Las tareas 4 y 5 tienen pasos
  que ejecuta el usuario; están marcados y no se pueden delegar a un subagente.

## Lo que NO entra en este bloque

- `contenido.json`, la composición por ranuras y la migración de los doce
  proyectos: bloque 2.
- El panel, Access y el Worker: bloque 3.
- Vimeo: bloque 4.
- Dominio propio. Se despliega en el subdominio de Pages; el dominio es una
  decisión del estudio y no bloquea nada.

---

## Antes de empezar: tres cosas que dependen del estudio

Estas no son tareas del plan. Son puertas.

**A. `gh auth login` con la cuenta `aro42-ua`.** Sin sesión no hay repositorio y
sin repositorio no hay Pages. Se ha pedido dos veces y sigue pendiente.

**B. Una cuenta de Cloudflare.** La crea el estudio.

**C. La licencia de las tipografías — LEER ESTO.** Los tres archivos son
`ABCFavorit-Regular-Trial.otf`, `ABCFavorit-Bold-Trial.otf` y
`ABCFavorit-BoldItalic-Trial.otf`. Las versiones **Trial** de ABC Favorit se
distribuyen para evaluación y su licencia habitualmente **no cubre el uso en un
sitio público**, menos aún el de un estudio comercial. Publicarlas las deja
además descargables desde la URL directa.

Esto no lo puede resolver un plan: hay que comprar la licencia web en Dinamo, o
sustituir la tipografía. **Mientras no esté resuelto, la tarea 5 despliega con
el sitio cerrado a los buscadores (tarea 2) y sin dominio público.** El bloque 1
se puede completar entero así; lo que no se debe hacer es anunciar la web.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `tests/auditar_rutas.py` (nuevo) | Recorre el marcado y el CSS, extrae cada recurso local y comprueba que existe **con las mayúsculas exactas**. Sin dependencias. |
| `tests/prueba_auditar_rutas.py` (nuevo) | Prueba del auditor contra un fixture con un fallo conocido. |
| `tests/fixtures-auditoria/` (nuevo) | El fixture: un HTML que referencia mal un archivo. |
| `_headers` (nuevo) | Cabeceras de Cloudflare Pages: caché de tipografías y de código. |
| `robots.txt` (nuevo) | Cierra el sitio a los buscadores mientras el contenido sea de relleno. |
| `docs/despliegue.md` (nuevo) | Cómo se despliega, qué pasos son manuales y por qué. |
| `docs/estado-conocido.md` (modificar) | Anotar el despliegue y la deuda de las tipografías. |

---

### Tarea 1: Auditor de rutas sensibles a mayúsculas

Windows no distingue mayúsculas y el servidor de Cloudflare sí. Una referencia a
`JS/Galeria.js` funciona aquí y da 404 en producción. Es la clase de fallo que
este proyecto ya ha sufrido dos veces por otra vía —el SVG usado como máscara y
el `url()` dentro de una propiedad personalizada—: perfecto en local, roto fuera.

`os.path.exists` **no sirve**, porque hereda la insensibilidad del sistema de
archivos. Hay que listar el directorio y comparar el nombre exacto.

**Archivos:**
- Crear: `tests/auditar_rutas.py`
- Crear: `tests/prueba_auditar_rutas.py`
- Crear: `tests/fixtures-auditoria/pagina.html`, `tests/fixtures-auditoria/Recurso.svg`

**Interfaces:**
- Produce: `auditar(raiz)` → lista de cadenas con los problemas encontrados,
  vacía si no hay ninguno. La usan la tarea 6 y los bloques siguientes.

- [ ] **Paso 1: Crear el fixture con un fallo conocido**

`tests/fixtures-auditoria/Recurso.svg` (contenido irrelevante, basta con que exista):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>
```

`tests/fixtures-auditoria/pagina.html` — referencia el archivo con la caja
cambiada, y además uno que no existe:

```html
<!doctype html>
<html>
  <head><link rel="stylesheet" href="estilo.css"></head>
  <body><img src="recurso.svg" alt=""></body>
</html>
```

- [ ] **Paso 2: Escribir la prueba que falla**

`tests/prueba_auditar_rutas.py`:

```python
# -*- coding: utf-8 -*-
"""Prueba del auditor de rutas. Se ejecuta con: python tests/prueba_auditar_rutas.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auditar_rutas import auditar

FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures-auditoria')

def main():
    fallos = []
    problemas = auditar(FIXTURES)
    texto = '\n'.join(problemas)

    # 1) Detecta la caja equivocada: el archivo se llama Recurso.svg
    if 'recurso.svg' not in texto:
        fallos.append('no detecto la referencia con mayusculas equivocadas a recurso.svg')

    # 2) Detecta el archivo que no existe
    if 'estilo.css' not in texto:
        fallos.append('no detecto el recurso inexistente estilo.css')

    # 3) No inventa problemas: exactamente dos
    if len(problemas) != 2:
        fallos.append('esperaba 2 problemas y encontro %d: %s' % (len(problemas), problemas))

    if fallos:
        print('FALLA')
        for f in fallos:
            print('  - ' + f)
        sys.exit(1)
    print('OK: %d comprobaciones' % 3)

main()
```

- [ ] **Paso 3: Ejecutarla y comprobar que falla**

```bash
python tests/prueba_auditar_rutas.py
```

Esperado: `ModuleNotFoundError: No module named 'auditar_rutas'`.

- [ ] **Paso 4: Escribir el auditor**

`tests/auditar_rutas.py`:

```python
# -*- coding: utf-8 -*-
"""Comprueba que cada recurso local referenciado existe CON LAS MAYUSCULAS EXACTAS.

Windows no distingue mayusculas y el servidor de Cloudflare si, asi que una
referencia mal escrita funciona en local y da 404 en produccion. os.path.exists
no vale para esto: hereda la insensibilidad del sistema de archivos. Hay que
listar el directorio padre y comparar el nombre exacto.
"""
import os
import re

# src="..." y href="..." del marcado, y url(...) del CSS
PATRONES = [
    re.compile(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']'),
    re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)'),
]

EXTENSIONES = ('.html', '.css', '.js')

IGNORADOS = ('.git', '.worktrees', '.superpowers', 'fixtures-auditoria')


def _es_local(ruta):
    if not ruta or ruta.startswith('#') or ruta.startswith('data:'):
        return False
    if ruta.startswith('http://') or ruta.startswith('https://') or ruta.startswith('//'):
        return False
    return True


def _existe_con_caja_exacta(ruta_absoluta):
    """True solo si cada segmento del camino coincide en mayusculas y minusculas."""
    ruta_absoluta = os.path.normpath(ruta_absoluta)
    padre, nombre = os.path.split(ruta_absoluta)
    if not os.path.isdir(padre):
        return False
    try:
        return nombre in os.listdir(padre)
    except OSError:
        return False


def auditar(raiz):
    """Devuelve una lista de problemas. Vacia si todo esta bien."""
    problemas = []
    for actual, directorios, archivos in os.walk(raiz):
        # fixtures-auditoria contiene errores DELIBERADOS para probar este
        # auditor, asi que se salta al recorrer el repositorio. Cuando la
        # prueba lo audita, se lo pasa como raiz y os.walk empieza dentro:
        # no es un subdirectorio y esta exclusion no llega a aplicarse.
        directorios[:] = [d for d in directorios
                          if d not in IGNORADOS]
        for archivo in sorted(archivos):
            if not archivo.endswith(EXTENSIONES):
                continue
            camino = os.path.join(actual, archivo)
            with open(camino, 'r', encoding='utf-8', errors='replace') as f:
                texto = f.read()
            for patron in PATRONES:
                for referencia in patron.findall(texto):
                    referencia = referencia.split('?')[0].split('#')[0]
                    if not _es_local(referencia):
                        continue
                    destino = os.path.join(actual, referencia)
                    if not _existe_con_caja_exacta(destino):
                        problemas.append('%s -> %s (no existe o no coincide en mayusculas)'
                                         % (os.path.relpath(camino, raiz), referencia))
    return problemas


if __name__ == '__main__':
    import sys
    raiz = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    encontrados = auditar(raiz)
    if encontrados:
        print('PROBLEMAS DE RUTAS (%d):' % len(encontrados))
        for p in encontrados:
            print('  - ' + p)
        sys.exit(1)
    print('OK: todas las rutas locales existen con las mayusculas exactas')
```

- [ ] **Paso 5: Ejecutar la prueba y comprobar que pasa**

```bash
python tests/prueba_auditar_rutas.py
```

Esperado: `OK: 3 comprobaciones`.

- [ ] **Paso 6: Ejecutar el auditor contra el repositorio real**

```bash
python tests/auditar_rutas.py
```

Esperado: `OK: todas las rutas locales existen con las mayusculas exactas`.

**Si aparece algún problema, PARAR y avisar.** La restricción global dice que la
web no se toca en este bloque; un fallo de rutas es una decisión, no un arreglo
silencioso dentro de una tarea de despliegue.

- [ ] **Paso 7: Commit**

```bash
git add tests/auditar_rutas.py tests/prueba_auditar_rutas.py tests/fixtures-auditoria
git commit -m "Auditar que las rutas locales existen con las mayusculas exactas

Windows no distingue mayusculas y el servidor de Cloudflare si, asi que una
referencia mal escrita funciona en local y da 404 en produccion. os.path.exists
hereda esa insensibilidad, asi que el auditor lista el directorio padre y
compara el nombre exacto."
```

---

### Tarea 2: Cabeceras y cierre a buscadores

**Archivos:**
- Crear: `_headers`
- Crear: `robots.txt`

**Interfaces:**
- Produce: dos archivos estáticos que Cloudflare Pages lee del raíz del
  despliegue. Los verifica la tarea 6 contra la URL real.

**Esta tarea no tiene prueba local que valga.** `_headers` sólo lo interpreta
Cloudflare, así que comprobarlo aquí sería comprobar que un archivo de texto
tiene el texto que acabamos de escribir. Su verificación de verdad está en la
tarea 6, contra la respuesta del servidor. Se deja dicho en lugar de fingir una
prueba.

- [ ] **Paso 1: Escribir `_headers`**

```
# Las tipografias no cambian nunca: se cachean un año.
/*.otf
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

# El codigo si cambia: una hora, para que una correccion llegue el mismo dia.
/css/*
  Cache-Control: public, max-age=3600
/js/*
  Cache-Control: public, max-age=3600

# El marcado nunca se cachea: es quien decide que version del resto se pide.
/index.html
  Cache-Control: no-cache
```

- [ ] **Paso 2: Escribir `robots.txt`**

```
# Los doce proyectos son de relleno y las tipografias son de prueba.
# Hasta que entren los trabajos reales y su licencia, la web no se indexa.
# Quitar este archivo es el gesto deliberado de "ya se puede anunciar".
User-agent: *
Disallow: /
```

- [ ] **Paso 3: Comprobar que el auditor sigue en verde**

```bash
python tests/auditar_rutas.py
```

Esperado: `OK`. (Los archivos nuevos no referencian recursos, pero el auditor
recorre el árbol entero y conviene saber que no se ha roto nada.)

- [ ] **Paso 4: Commit**

```bash
git add _headers robots.txt
git commit -m "Anadir cabeceras de cache y cerrar la web a los buscadores

Las tipografias se cachean un año porque no cambian; el codigo, una hora. El
marcado no se cachea: es quien decide que version del resto se pide.

robots.txt cierra el sitio mientras los proyectos sean de relleno y las
tipografias sean versiones de prueba. Borrarlo es el gesto deliberado de decir
que la web ya se puede anunciar."
```

---

### Tarea 3: Documentar el despliegue

**Archivos:**
- Crear: `docs/despliegue.md`
- Modificar: `docs/estado-conocido.md`

**Interfaces:**
- Produce: `docs/despliegue.md`, al que apuntan las tareas 4 y 5.

- [ ] **Paso 1: Escribir `docs/despliegue.md`**

Debe contener, con este contenido y en español:

- **Qué es cada cosa:** el repositorio privado `aro42-ua/luque` en GitHub y un
  proyecto de Cloudflare Pages conectado a su rama `main`. Cada empuje a `main`
  despliega.
- **Que no hay paso de compilación.** En la configuración de Pages: comando de
  compilación **vacío** y directorio de salida **`/`** (la raíz del repositorio).
  Es el error más fácil de cometer, porque Pages ofrece por defecto plantillas
  con compilación.
- **Los pasos manuales y por qué lo son:** `gh auth login` y la creación de la
  cuenta de Cloudflare los hace el estudio. Claude no crea cuentas ni introduce
  credenciales.
- **Cómo se verifica un despliegue:** apuntar a la tarea 6 de este plan.
- **La deuda de las tipografías**, con las tres advertencias de la sección
  «Antes de empezar».

- [ ] **Paso 2: Anotar en `docs/estado-conocido.md`**

Añadir, en la voz del resto del archivo, dos hechos:

1. La web está desplegada en Cloudflare Pages desde `main`, cerrada a los
   buscadores por `robots.txt`, y las fotos siguen siendo de picsum.
2. **Las tres tipografías son versiones Trial y su licencia probablemente no
   cubre el uso público.** Hay que comprar la licencia web o sustituirlas antes
   de anunciar la web. Es deuda conocida, no un descuido.

- [ ] **Paso 3: Commit**

```bash
git add docs/despliegue.md docs/estado-conocido.md
git commit -m "Documentar como se despliega y la deuda de las tipografias"
```

---

### Tarea 4: Subir el repositorio a GitHub

> **CONTROLADOR + USUARIO.** No delegable a un subagente: requiere una sesión
> autenticada. Claude no introduce credenciales.

- [ ] **Paso 1 (USUARIO): iniciar sesión**

En una terminal nueva:

```
gh auth login
```

GitHub.com · HTTPS · autenticar git con las credenciales de GitHub: sí ·
iniciar sesión con el navegador. Con la cuenta **`aro42-ua`**.

- [ ] **Paso 2: Verificar la sesión**

```bash
gh auth status
```

Esperado: sesión activa en github.com como `aro42-ua`.

- [ ] **Paso 3: Comprobar que el árbol está limpio y las pruebas en verde**

```bash
git status --short
python tests/auditar_rutas.py
```

Esperado: sin salida en el primero, `OK` en el segundo. El arnés del navegador
(`tests/test.html`, 51 pruebas) lo ejecuta el controlador con el servidor de
Python y Claude Preview.

- [ ] **Paso 4: Crear el repositorio privado y subir**

```bash
gh repo create luque --private --source=. --remote=origin --push
```

- [ ] **Paso 5: Verificar que es privado de verdad y que subió todo**

```bash
gh repo view aro42-ua/luque --json name,visibility,defaultBranchRef
git ls-remote --heads origin
git log --oneline -1 origin/main
```

Esperado: `"visibility": "PRIVATE"`, una rama `main`, y el mismo commit que
`HEAD` local.

---

### Tarea 5: Conectar Cloudflare Pages

> **CONTROLADOR + USUARIO.** La cuenta y la autorización a GitHub las hace el
> estudio desde el navegador.

- [ ] **Paso 1 (USUARIO): crear la cuenta de Cloudflare** y entrar en el panel.

- [ ] **Paso 2 (USUARIO): crear el proyecto de Pages**

Workers & Pages → Create → Pages → Connect to Git → autorizar GitHub y elegir
**sólo** el repositorio `aro42-ua/luque` → rama de producción `main`.

**Configuración de compilación —el paso donde se falla—:**

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | *(vacío)* |
| Build output directory | `/` |

- [ ] **Paso 3 (USUARIO): pasar la URL del despliegue**, del tipo
  `https://luque-xxx.pages.dev`.

- [ ] **Paso 4: Comprobar que responde**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://<URL>/
```

Esperado: `200`.

---

### Tarea 6: Verificación de regresión contra la URL desplegada

> **CONTROLADOR.** Es la tarea que justifica todo el bloque: comprobar que la web
> desplegada se comporta igual que en local.

**Interfaces:**
- Consume: la URL de la tarea 5; `auditar()` de la tarea 1; los archivos de la
  tarea 2.

- [ ] **Paso 1: Cada recurso responde 200 y con el tipo correcto**

Para las tres tipografías, `css/luque.css`, los 16 archivos de `js/` y los dos
SVG, comprobar el código de estado y `content-type`. Las `.otf` deben llegar con
un tipo de fuente, no como `application/octet-stream` mal servido.

- [ ] **Paso 2: Las cabeceras de la tarea 2 llegan**

```bash
curl -sSI https://<URL>/ABCFavorit-Regular-Trial.otf | grep -i cache-control
curl -sSI https://<URL>/index.html | grep -i cache-control
curl -sS  https://<URL>/robots.txt
```

Esperado: un año e `immutable` en la tipografía, `no-cache` en el marcado, y el
`Disallow: /` del `robots.txt`.

- [ ] **Paso 3: El arnés pasa 51/51 servido desde Cloudflare**

Abrir `https://<URL>/tests/test.html` en el navegador de previsualización.
Esperado: `51 pasan, 0 fallan`.

- [ ] **Paso 4: La secuencia completa, medida y no mirada**

Con el navegador apuntando a la URL desplegada, y **forzando revalidación de
caché antes de medir** —una caché rancia ha falseado cinco mediciones en este
proyecto—, comprobar:

1. El preloader hace sus cuatro fotogramas y se retira.
2. Las dos fases del hero se encadenan y aparece `ENTRAR`.
3. Al pulsarlo, la esquina TL recorre los cuatro pasos. **Control barato: si
   sigue en `22,22` pasados 300 ms, el clic no ha hecho nada y la medición no
   vale.**
4. `.hero-intro` se mantiene a `0.00` durante toda la secuencia (el defecto que
   encontró el estudio y se corrigió en `b3293b0`).
5. Al terminar: hero oculto, `galeria-activa`, navbar visible, foco en
   `SECTION#gallery`.
6. Filtrar por una categoría recompone el lienzo y marca la celda.
7. Abrir un proyecto, la lupa arrastra, `Esc` devuelve el foco a su foto.
8. La tipografía que se pinta es ABC Favorit y no una sustituta: comprobar con
   `document.fonts.check('700 1rem "ABC Favorit"')`.

- [ ] **Paso 5: Comprobar la consola y la red**

Cero errores en consola. En la pestaña de red, los únicos dominios externos
deben ser el de Pages y `picsum.photos`.

- [ ] **Paso 6: Anotar el resultado**

Añadir a `docs/estado-conocido.md` la URL desplegada y la fecha de la
verificación. Commit y empuje.

---

## Autorrevisión de este plan

- **Cobertura:** el bloque 1 de la especificación pide repositorio en GitHub
  (tarea 4) y Pages sirviendo la web actual (tarea 5), verificado (tarea 6). Las
  tareas 1 a 3 son lo que un servidor real exige y una máquina de desarrollo no.
- **Sin marcadores:** todo el código está escrito; no hay «implementar después».
- **Coherencia de nombres:** `auditar(raiz)` se define en la tarea 1 y se usa con
  ese nombre en las tareas 2, 4 y 6. El archivo es `auditar_rutas.py` con guion
  bajo, no guion, porque la prueba lo importa como módulo.
- **Riesgo asumido conscientemente:** la tarea 2 no tiene prueba local y se dice
  en voz alta en lugar de inventar una.
- **Fuera de alcance detectado y no colado:** el auditor podría además avisar de
  recursos huérfanos y de los `.mp4` que no existen. No se hace: la restricción
  global dice que este bloque no toca la web, y ampliar el auditor invita a
  «arreglar» de paso lo que encuentre.
