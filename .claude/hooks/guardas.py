# -*- coding: utf-8 -*-
"""Guardas de PreToolUse sobre Edit/Write. Dos, y las dos son de las que
cuestan caras cuando se saltan.

1. `contenido.json` no se edita a mano: lo genera
   `herramientas/derivar_imagenes.py --contenido` mezclando los datos humanos
   de `herramientas/proyectos.json` con las fotos que hay en disco. Lo que se
   escriba ahi a mano desaparece en la siguiente derivacion.

2. Los `wrangler.toml` de `worker/` se pueden editar -- fechas de
   compatibilidad, rutas, bindings --, pero NO para reencender `workers_dev`
   ni `preview_urls`. Estan apagados porque Cloudflare Access solo cubre
   nombres de host de lidialuque.com, y con ellos encendidos /panel -- la
   unica superficie de escritura del sitio -- queda alcanzable sin nada
   delante. Ver docs/despliegue.md. Ojo: el valor por omision de los dos es
   `true`, asi que BORRAR la linea reenciende tanto como escribir `true`; esta
   guarda cubre las dos formas.

Lee el JSON de la herramienta por la entrada estandar. Si algo va mal, deja
pasar: un hook roto no puede bloquear el trabajo.
"""
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
# .claude/hooks/ -> .claude/ -> raiz del repositorio (o del worktree).
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))

INTERRUPTORES = ('workers_dev', 'preview_urls')


def norma(ruta):
    return os.path.normcase(os.path.normpath(ruta))


CONTENIDO = norma(os.path.join(RAIZ, 'contenido.json'))
WRANGLERS = (
    norma(os.path.join(RAIZ, 'worker', 'wrangler.toml')),
    norma(os.path.join(RAIZ, 'worker', 'estatico', 'wrangler.toml')),
)

MOTIVO_CONTENIDO = (
    'contenido.json no se edita a mano: lo genera\n'
    '  python herramientas/derivar_imagenes.py <originales> --contenido\n'
    'mezclando herramientas/proyectos.json con las fotos que hay en disco, '
    'asi que cualquier cambio escrito aqui se pierde en la siguiente '
    'derivacion.\n\n'
    'Para cambiar textos, fichas u orden: edita herramientas/proyectos.json '
    '(esa si es la fuente humana) y vuelve a derivar. Despues pasa '
    'tests/auditar_rutas.py, porque una ruta mal escrita valida igual.\n\n'
    'Si de verdad hace falta escribirlo a mano, hazlo desde Bash '
    '(el hook solo cubre Edit y Write) y di por que.'
)


def motivo_wrangler(flag, como):
    return (
        'Este cambio %s `%s`, y apagarlo no es opcional.\n\n'
        'Cloudflare Access solo puede ponerse delante de un nombre de host de '
        'lidialuque.com, no de workers.dev ni de las Preview URLs, que estrenan '
        'un host por version desplegada. Con cualquiera de los dos encendido, '
        '/panel -- la unica superficie de ESCRITURA sobre el contenido del '
        'estudio -- queda alcanzable sin Access delante.\n\n'
        'El valor por omision es `true`: borrar la linea reenciende igual que '
        'escribir `true`. Deja `%s = false` en su sitio, por encima de '
        '[[routes]].\n\n'
        'El razonamiento completo esta en docs/despliegue.md, seccion '
        '"workers.dev esta apagado a proposito". Si aun asi hay que cambiarlo, '
        'hazlo desde Bash y di por que.'
    ) % (como, flag, flag)


def enciende(flag, viejo, nuevo):
    """Devuelve como se reenciende `flag`, o None si el cambio no lo toca.

    `viejo` es el texto que se sustituye (None en un Write, donde se compara
    contra el archivo en disco). `nuevo` es el texto que entra.
    """
    puesto_a_true = re.compile(r'^\s*%s\s*=\s*true' % flag, re.MULTILINE)
    mencionado = re.compile(r'^\s*%s\s*=' % flag, re.MULTILINE)

    if nuevo and puesto_a_true.search(nuevo):
        return 'pone a true'
    if viejo and mencionado.search(viejo) and not mencionado.search(nuevo or ''):
        return 'borra la linea'
    return None


def leer(ruta):
    try:
        with open(ruta, encoding='utf-8') as f:
            return f.read()
    except OSError:
        return ''


def destino(herramienta):
    for clave in ('file_path', 'notebook_path', 'path'):
        valor = herramienta.get(clave)
        if isinstance(valor, str) and valor:
            return valor
    return None


def revisar(nombre, herramienta, ruta):
    if ruta == CONTENIDO:
        return MOTIVO_CONTENIDO

    if ruta in WRANGLERS:
        if nombre == 'Write':
            # Un Write reemplaza el archivo entero: se compara con lo que hay.
            viejo, nuevo = leer(ruta), herramienta.get('content') or ''
        else:
            viejo = herramienta.get('old_string') or ''
            nuevo = herramienta.get('new_string') or ''
        for flag in INTERRUPTORES:
            como = enciende(flag, viejo, nuevo)
            if como:
                return motivo_wrangler(flag, como)

    return None


def main():
    try:
        entrada = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0

    herramienta = entrada.get('tool_input') or {}
    if not isinstance(herramienta, dict):
        return 0

    ruta = destino(herramienta)
    if not ruta:
        return 0
    if not os.path.isabs(ruta):
        ruta = os.path.join(os.getcwd(), ruta)

    motivo = revisar(entrada.get('tool_name'), herramienta, norma(ruta))
    if not motivo:
        return 0

    json.dump({
        'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'permissionDecision': 'deny',
            'permissionDecisionReason': motivo,
        }
    }, sys.stdout)
    return 0


if __name__ == '__main__':
    sys.exit(main())
