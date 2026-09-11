# -*- coding: utf-8 -*-
"""Pruebas de .claude/hooks/guardas.py.

El fallo de una guarda es silencioso -- deja pasar lo que tenia que parar --,
asi que conviene poder comprobarlo. Uso:  python tests/prueba_guardas.py
"""
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..'))
GUARDAS = os.path.join(RAIZ, '.claude', 'hooks', 'guardas.py')

W = 'worker/estatico/wrangler.toml'
API = 'worker/wrangler.toml'

# (nombre, herramienta, tool_input, se espera que deniegue)
CASOS = [
    ('contenido.json a mano', 'Edit',
     {'file_path': 'contenido.json', 'old_string': 'a', 'new_string': 'b'}, True),
    ('contenido.json por Write', 'Write',
     {'file_path': './contenido.json', 'content': '{}'}, True),
    ('proyectos.json es la fuente humana', 'Edit',
     {'file_path': 'herramientas/proyectos.json', 'old_string': 'a', 'new_string': 'b'}, False),

    ('workers_dev a true', 'Edit',
     {'file_path': W, 'old_string': 'workers_dev = false', 'new_string': 'workers_dev = true'}, True),
    ('preview_urls a true', 'Edit',
     {'file_path': W, 'old_string': 'preview_urls = false', 'new_string': 'preview_urls = true'}, True),
    ('borrar la linea reenciende igual', 'Edit',
     {'file_path': W, 'old_string': 'workers_dev = false\npreview_urls = false',
      'new_string': 'preview_urls = false'}, True),
    ('un Write que se come los dos flags', 'Write',
     {'file_path': W, 'content': 'name = "luque"\nmain = "index.js"\n'}, True),
    ('los mismos flags en el Worker de la API', 'Edit',
     {'file_path': API, 'old_string': 'workers_dev = false', 'new_string': 'workers_dev = true'}, True),

    ('un true dentro de un comentario no cuenta', 'Edit',
     {'file_path': W, 'old_string': 'workers_dev = false',
      'new_string': '# workers_dev = true, ni de broma\nworkers_dev = false'}, False),
    ('el resto del wrangler.toml se edita normal', 'Edit',
     {'file_path': W, 'old_string': 'compatibility_date = "2026-08-18"',
      'new_string': 'compatibility_date = "2026-09-11"'}, False),
    ('un Write que los conserva', 'Write',
     {'file_path': W, 'content': 'name = "luque"\nworkers_dev = false\npreview_urls = false\n'}, False),
    ('los modulos del sitio no los mira', 'Edit',
     {'file_path': 'js/visor.js', 'old_string': 'a', 'new_string': 'b'}, False),
]


def denegado(herramienta, entrada):
    p = subprocess.run(
        [sys.executable, GUARDAS],
        input=json.dumps({'tool_name': herramienta, 'tool_input': entrada}),
        capture_output=True, text=True, cwd=RAIZ)
    if not p.stdout.strip():
        return False
    salida = json.loads(p.stdout)['hookSpecificOutput']
    return salida['permissionDecision'] == 'deny'


def main():
    fallos = 0
    for nombre, herramienta, entrada, espera in CASOS:
        real = denegado(herramienta, entrada)
        bien = real == espera
        fallos += 0 if bien else 1
        print('%s | %s | %s' % ('  ok  ' if bien else ' FALLO',
                                'deniega' if real else ' pasa  ', nombre))

    # Un hook roto no puede bloquear el trabajo: ante basura, deja pasar.
    p = subprocess.run([sys.executable, GUARDAS], input='no soy json',
                       capture_output=True, text=True, cwd=RAIZ)
    bien = p.returncode == 0 and not p.stdout.strip()
    fallos += 0 if bien else 1
    print('%s | %s | con la entrada rota no estorba' % ('  ok  ' if bien else ' FALLO',
                                                        ' pasa  ' if bien else 'deniega'))

    print('\n%d comprobaciones, %d fallos' % (len(CASOS) + 1, fallos))
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.exit(main())
