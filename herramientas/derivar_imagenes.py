# -*- coding: utf-8 -*-
"""Deriva las tres medidas de la web a partir de los originales de camara.

NO toca los originales, NO sube nada. Escribe en img/, que esta en .gitignore
porque son megas generados: se sirven desde R2 en produccion y desde este
mismo directorio al probar en local.

Uso:  python herramientas/derivar_imagenes.py <directorio-de-originales>

Requiere Pillow. Es la unica dependencia del repositorio y vive aqui a
proposito: `herramientas/` no se despliega nunca. El SITIO sigue sin ninguna.
"""
import io, json, os, re, sys, unicodedata
from PIL import Image, ImageOps

# El lado largo, no una caja de proporcion fija. Ver la spec, seccion "La
# medida es el lado largo": el material real es 2:3, 3:2 y 16:9, y con una
# caja 4:5 las horizontales salian un 20% peor que las verticales.
MEDIDAS = [(1500, 82), (3000, 82), (250, 80)]
EXTENSIONES = ('.jpg', '.jpeg', '.png')

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ_REPO = os.path.normpath(os.path.join(AQUI, '..'))


def sin_acentos(s):
    """La o acentuada -> o. `nombreSeguro` del Worker convertiria cualquier
    no-ASCII en un guion y dejaria "Monstruaci-n"."""
    return ''.join(c for c in unicodedata.normalize('NFKD', s)
                   if not unicodedata.combining(c))


def llave(ruta_relativa):
    """Ruta relativa -> llave plana de R2, sin la extension.

    Misma regla que `nombreSeguro` en worker/src/publicar.js, mas
    transliteracion y minusculas. Se aplana la RUTA ENTERA y no solo el nombre
    del archivo: seis de los ocho proyectos llaman a su portada
    "ESTA PORTADA.jpg", asi que con el nombre solo colisionarian seis de ocho.

    Minusculas porque las llaves de R2 distinguen mayusculas, y este proyecto
    ya se quemo con eso en el bloque 1.
    """
    base = os.path.splitext(sin_acentos(ruta_relativa.replace(os.sep, '/')))[0]
    limpio = re.sub(r'[^a-zA-Z0-9._-]+', '-', base)
    limpio = re.sub(r'^[-.]+', '', limpio)
    return re.sub(r'-+', '-', limpio).strip('-').lower()


def medidas_de(tamano, lado):
    """(ancho, alto) que resultan de encajar `tamano` en un cuadrado de `lado`.

    Nunca agranda: una foto mas pequena que la caja se queda como esta.
    """
    ancho, alto = tamano
    if ancho <= lado and alto <= lado:
        return (ancho, alto)
    escala = float(lado) / max(ancho, alto)
    return (int(round(ancho * escala)), int(round(alto * escala)))


def derivar(origen, destino, lado, calidad):
    with Image.open(origen) as im:
        # La orientacion EXIF no es opcional: sin esto la mitad de los
        # verticales salen tumbados, porque la camara guarda el sensor en
        # horizontal y anota "girala" en el EXIF.
        im = ImageOps.exif_transpose(im)
        icc = im.info.get('icc_profile')
        if im.mode not in ('RGB', 'L'):
            im = im.convert('RGB')
        im = im.resize(medidas_de(im.size, lado), Image.LANCZOS)
        opciones = {'quality': calidad, 'optimize': True, 'progressive': True}
        if icc:
            opciones['icc_profile'] = icc
        im.save(destino, 'JPEG', **opciones)
        return im.size


def fotos_de(raiz, carpeta):
    """Las fotos de un proyecto, ordenadas por nombre.

    La portada la eligio la artista marcandola en el nombre del archivo
    ("ESTA PORTADA.jpg", "ESTE PORTADA.jpg"), y va la primera. El resto en
    orden alfabetico, que es como salen de la camara.
    """
    d = os.path.join(raiz, carpeta.replace('/', os.sep))
    nombres = [f for f in sorted(os.listdir(d))
               if os.path.splitext(f)[1].lower() in EXTENSIONES]
    portadas = [f for f in nombres if 'portada' in f.lower()]
    resto = [f for f in nombres if f not in portadas]
    return portadas + resto, portadas[0] if portadas else None


def leer_meta():
    """Los datos humanos de los ocho, escritos UNA vez y a mano."""
    with io.open(os.path.join(AQUI, 'proyectos.json'), encoding='utf-8') as f:
        return json.load(f)


def derivar_todo(raiz, meta, destino):
    """Deriva las tres medidas de cada foto de cada proyecto.

    Solo LEE de `raiz`. Todo lo que escribe cae dentro de `destino`.
    """
    if not os.path.isdir(destino):
        os.makedirs(destino)
    hechas = 0
    for p in meta['proyectos']:
        nombres, _ = fotos_de(raiz, p['carpeta'])
        relativa = p['carpeta'].replace('/', os.sep)
        for nombre in nombres:
            k = llave(os.path.join(relativa, nombre))
            origen = os.path.join(raiz, relativa, nombre)
            for lado, calidad in MEDIDAS:
                derivar(origen, os.path.join(destino, '%s-%d.jpg' % (k, lado)),
                        lado, calidad)
                hechas += 1
        sys.stdout.write('%-34s %2d fotos\n' % (p['id'], len(nombres)))
    return hechas


def main(argv):
    if len(argv) < 2:
        raise SystemExit(__doc__)
    raiz = argv[1]
    if not os.path.isdir(raiz):
        raise SystemExit('no existe el directorio de originales: %s' % raiz)
    meta = leer_meta()
    destino = os.path.join(RAIZ_REPO, 'img')
    hechas = derivar_todo(raiz, meta, destino)
    sys.stdout.write('%d archivos derivados en %s\n' % (hechas, destino))


if __name__ == '__main__':
    main(sys.argv)
