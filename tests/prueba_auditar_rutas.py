# -*- coding: utf-8 -*-
"""Prueba del auditor de rutas. Se ejecuta con: python tests/prueba_auditar_rutas.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auditar_rutas import auditar

FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures-auditoria')

COMPROBACIONES = 6


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

    # 3) Detecta la caja equivocada en un SEGMENTO DE DIRECTORIO. El directorio
    #    real es js/ y el archivo galeria.js existe con su nombre exacto, asi
    #    que comprobar solo el ultimo segmento deja pasar "JS/galeria.js".
    if 'JS/galeria.js' not in texto:
        fallos.append('no detecto el directorio con mayusculas equivocadas en JS/galeria.js')

    # 4) Una ruta absoluta de raiz valida NO es un problema: se resuelve contra
    #    la raiz auditada, no contra el directorio del archivo que la escribe.
    if '/Recurso.svg' in texto:
        fallos.append('reporto como problema la ruta absoluta valida /Recurso.svg')

    # 5) mailto: y tel: no son recursos servidos y no se auditan
    if 'mailto:' in texto or 'tel:' in texto:
        fallos.append('reporto como problema un mailto: o un tel:')

    # 6) No inventa problemas: exactamente tres
    if len(problemas) != 3:
        fallos.append('esperaba 3 problemas y encontro %d: %s' % (len(problemas), problemas))

    if fallos:
        print('FALLA')
        for f in fallos:
            print('  - ' + f)
        sys.exit(1)
    print('OK: %d comprobaciones' % COMPROBACIONES)


main()
