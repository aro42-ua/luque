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
