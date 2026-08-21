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
#
# El (?<![\w-]) de url( no es adorno: sin el, el patron casa DENTRO de cualquier
# identificador que termine en "url", y el bloque 3a introdujo uno —base64url(—
# en las pruebas del Worker. El auditor pasaba entonces a reportar
# "JSON.stringify(reclamaciones" y "no soy json" como rutas rotas, salia con
# codigo 1 y dejaba en rojo una comprobacion previa al despliegue que nadie
# volveria a mirar. Se arregla la causa —exigir que "url(" no venga pegado a una
# letra, un digito, un guion bajo o un guion— y no se oculta ningun directorio:
# meter worker/ en IGNORADOS habria escondido codigo que el sitio si sirve.
PATRONES = [
    re.compile(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']'),
    re.compile(r'(?<![\w-])url\(\s*["\']?([^"\')]+)["\']?\s*\)'),
]

EXTENSIONES = ('.html', '.css', '.js')

IGNORADOS = ('.git', '.worktrees', '.superpowers', 'fixtures-auditoria')


# Esquemas que no apuntan a un archivo servido por el sitio. mailto: y tel: no
# se descargan nunca, asi que auditarlos daria un falso positivo seguro.
ESQUEMAS_EXTERNOS = ('http://', 'https://', 'data:', 'mailto:', 'tel:', 'javascript:')


def _es_local(ruta):
    """True si la referencia apunta a un archivo de este sitio.

    Las rutas absolutas de raiz (/css/luque.css) SI son locales: son validas en
    un servidor y hay que auditarlas. Quien las resuelve es auditar(), contra la
    raiz del sitio y no contra el directorio del archivo que las escribe.
    """
    if not ruta:
        return False
    ruta = ruta.strip()
    if not ruta or ruta.startswith('#'):
        return False
    # //otro-dominio/algo es relativo al protocolo, no a nuestra raiz. Se
    # comprueba antes que la ruta absoluta, que empieza por una sola barra.
    if ruta.startswith('//'):
        return False
    if ruta.lower().startswith(ESQUEMAS_EXTERNOS):
        return False
    return True


def _existe_con_caja_exacta(ruta_absoluta, raiz):
    """True solo si cada segmento del camino coincide en mayusculas y minusculas.

    Comprobar unicamente el nombre del archivo no basta: os.path.isdir del
    directorio padre hereda la insensibilidad de Windows, asi que "JS/galeria.js"
    pasaba por bueno cuando el directorio real es "js". Por eso se recorre el
    camino segmento a segmento desde la raiz auditada, listando cada nivel y
    exigiendo el nombre exacto.

    De la raiz hacia arriba no se comprueba nada: esa parte del camino la pone la
    maquina de desarrollo, no el repositorio, y no se despliega. Una referencia
    que se sale de la raiz (demasiados "..") no la puede servir el sitio, asi que
    cuenta como problema.
    """
    raiz = os.path.normpath(os.path.abspath(raiz))
    ruta_absoluta = os.path.normpath(os.path.abspath(ruta_absoluta))
    try:
        relativa = os.path.relpath(ruta_absoluta, raiz)
    except ValueError:
        return False  # otra unidad de disco: imposible que la sirva el sitio
    segmentos = [s for s in relativa.split(os.sep) if s and s != os.curdir]
    if not segmentos or os.pardir in segmentos:
        return False  # se sale de la raiz auditada, o es la raiz misma
    actual = raiz
    for segmento in segmentos:
        try:
            entradas = os.listdir(actual)
        except OSError:
            return False
        if segmento not in entradas:
            return False
        actual = os.path.join(actual, segmento)
    return True


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
                    if referencia.startswith('/'):
                        # Absoluta: cuelga de la raiz del sitio, no del archivo
                        destino = os.path.join(raiz, referencia.lstrip('/'))
                    else:
                        destino = os.path.join(actual, referencia)
                    if not _existe_con_caja_exacta(destino, raiz):
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
