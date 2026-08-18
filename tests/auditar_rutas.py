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
