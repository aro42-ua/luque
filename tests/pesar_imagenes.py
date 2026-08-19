# -*- coding: utf-8 -*-
"""Mide lo que pesa cada superficie de la web y avisa si la entrada se dispara.

Por que no esta en el arnes del navegador: esto baja por la red y tarda
segundos. Un arnes lento o que a veces falla por la conexion deja de creerse, y
entonces no lo ejecuta nadie. Esto se lanza a mano antes de desplegar.

Que vigila. La galeria carga TODAS las portadas de golpe al entrar, asi que es
la unica superficie con presupuesto: es lo que espera quien llega por primera
vez. El bloque 2 la dejo en 8,7 MB sin que saltara ninguna alarma, porque al
migrar el contenido las portadas pasaron a ser las piezas a tamano completo.

Las piezas del visor NO tienen presupuesto y no deben tenerlo: son la calidad
que un estudio de fotografia vende, se piden de una en una y solo cuando
alguien abre un proyecto. Aqui solo se informan.

Uso:  python tests/pesar_imagenes.py
Sale con codigo 1 si la galeria pasa del presupuesto.
"""
import json
import os
import sys

try:                                   # py3
    from urllib.request import urlopen, Request
    from urllib.error import URLError, HTTPError
except ImportError:                    # py2
    from urllib2 import urlopen, Request, URLError, HTTPError

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENIDO = os.path.join(RAIZ, 'contenido.json')

# Lo que tarda una conexion mala en la entrada. 3 MB ya es generoso para doce
# portadas; si se supera, casi seguro es que alguien enchufo las piezas.
PRESUPUESTO_GALERIA = 3 * 1024 * 1024

MB = 1024.0 * 1024.0


def pesar(url):
    """Devuelve los bytes que anuncia la cabecera, sin bajarse el cuerpo.

    picsum contesta 405 a HEAD, asi que hay que pedir GET; pero leyendo solo
    Content-Length y cerrando, el cuerpo no llega a transferirse entero.
    """
    try:
        respuesta = urlopen(Request(url), timeout=30)
    except (URLError, HTTPError) as e:
        return None, str(e)
    try:
        largo = respuesta.headers.get('Content-Length')
        if largo is None:
            return None, 'sin Content-Length'
        return int(largo), None
    finally:
        respuesta.close()


def main():
    with open(CONTENIDO) as f:
        datos = json.load(f)

    proyectos = datos['proyectos']
    problemas = []

    # --- La galeria: todo esto se pide al entrar ---
    entrada = []
    for p in proyectos:
        url = p.get('poster') if p.get('tipo') == 'video' else p.get('portada')
        if url:
            entrada.append((p['id'], url))

    print('LA GALERIA (se carga entera al entrar)')
    total_entrada = 0
    for id_, url in entrada:
        bytes_, error = pesar(url)
        if error:
            problemas.append('%s: no se pudo pesar la portada (%s)' % (id_, error))
            print('  %-14s  ?          %s' % (id_, error))
            continue
        total_entrada += bytes_
        print('  %-14s  %7.1f KB' % (id_, bytes_ / 1024.0))
    print('  %-14s  %7.2f MB   (presupuesto %.0f MB)'
          % ('TOTAL', total_entrada / MB, PRESUPUESTO_GALERIA / MB))

    # --- La tira de miniaturas: por proyecto, solo al abrirlo ---
    print('')
    print('LA TIRA DEL VISOR (por proyecto, al abrirlo)')
    peor_tira = (0, None)
    for p in proyectos:
        if p.get('tipo') != 'fotos':
            continue
        suma = 0
        for i, pieza in enumerate(p.get('piezas', [])):
            url = pieza.get('miniatura')
            if not url:
                problemas.append('%s: la pieza n.o %d no trae miniatura' % (p['id'], i + 1))
                continue
            bytes_, error = pesar(url)
            if error:
                problemas.append('%s: no se pudo pesar una miniatura (%s)' % (p['id'], error))
                continue
            suma += bytes_
        print('  %-14s  %7.1f KB   (%d piezas)' % (p['id'], suma / 1024.0, len(p.get('piezas', []))))
        if suma > peor_tira[0]:
            peor_tira = (suma, p['id'])

    # --- Las piezas: calidad a proposito, sin presupuesto ---
    print('')
    print('UNA PIEZA DEL VISOR (de una en una; sin presupuesto, es la calidad)')
    mayor = (0, None)
    for p in proyectos:
        for pieza in p.get('piezas', []):
            bytes_, error = pesar(pieza['url'])
            if error:
                continue
            if bytes_ > mayor[0]:
                mayor = (bytes_, p['id'])
    if mayor[1]:
        print('  la mas pesada: %.1f KB  (%s)' % (mayor[0] / 1024.0, mayor[1]))

    print('')
    for problema in problemas:
        print('PROBLEMA: %s' % problema)

    if total_entrada > PRESUPUESTO_GALERIA:
        print('FALLA: la galeria pide %.2f MB al entrar, y el presupuesto es %.0f MB.'
              % (total_entrada / MB, PRESUPUESTO_GALERIA / MB))
        print('       Comprueba que "portada" no sea una de las piezas a tamano completo.')
        return 1

    if problemas:
        print('FALLA: hay imagenes que no se han podido pesar o que faltan.')
        return 1

    print('OK: la galeria pide %.2f MB al entrar, dentro del presupuesto.'
          % (total_entrada / MB))
    return 0


if __name__ == '__main__':
    sys.exit(main())
