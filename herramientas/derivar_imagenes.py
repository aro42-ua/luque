# -*- coding: utf-8 -*-
"""Deriva las tres medidas de la web a partir de los originales de camara.

NO toca los originales, NO sube nada. Escribe en img/, que esta en .gitignore
porque son megas generados: se sirven desde R2 en produccion y desde este
mismo directorio al probar en local.

Uso:  python herramientas/derivar_imagenes.py <originales>
      python herramientas/derivar_imagenes.py <originales> --contenido

Sin bandera deriva las imagenes a img/; con --contenido escribe
contenido.json a partir de lo que ya hay en disco.

Requiere Pillow. Es la unica dependencia del repositorio y vive aqui a
proposito: `herramientas/` no se despliega nunca. El SITIO sigue sin ninguna.
"""
import glob, io, json, os, re, sys, unicodedata
from PIL import Image, ImageOps

# El lado largo, no una caja de proporcion fija. Ver la spec, seccion "La
# medida es el lado largo": el material real es 2:3, 3:2 y 16:9, y con una
# caja 4:5 las horizontales salian un 20% peor que las verticales.
MEDIDAS = [(1500, 82), (3000, 82), (250, 80)]

# Las franjas negras. Quince capturas de video de los videoclips traen bandas
# negras de lado a lado -video vertical metido en un cuadro 16:9, sobre todo-,
# y dentro del visor se ven como bordes negros. Se recortan del ORIGINAL al
# derivar, y la pieza recortada sale con OTRA llave (sufijo -r): el Worker sirve
# /img/* como inmutable con un ano de cache, asi que pisar la llave vieja no
# llegaria a quien ya la tuviera guardada.
UMBRAL_NEGRO = 32     # de 255: por debajo, el pixel cuenta como negro
FRANJA_MINIMA = 4     # px: menos que esto es compresion, no una banda
RESTO_MINIMO = 0.5    # la caja tiene que conservar al menos la mitad por eje
SUFIJO_RECORTE = '-r'
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


def franjas_negras(im):
    """Cuantas filas/columnas seguidas desde cada borde son negras DE LADO A
    LADO. Con que un solo pixel de la fila supere el umbral, la franja acaba."""
    g = im.convert('L')
    w, h = g.size

    def cuenta(lado):
        n = 0
        for i in range(h if lado in ('arriba', 'abajo') else w):
            caja = {'arriba': (0, i, w, i + 1), 'abajo': (0, h - 1 - i, w, h - i),
                    'izq': (i, 0, i + 1, h), 'der': (w - 1 - i, 0, w - i, h)}[lado]
            if max(g.crop(caja).getdata()) > UMBRAL_NEGRO:
                break
            n += 1
        return n

    return {l: cuenta(l) for l in ('arriba', 'abajo', 'izq', 'der')}


def caja_sin_franjas(im):
    """La caja (izq, arriba, der, abajo) que deja fuera las franjas negras.

    Una franja de menos de FRANJA_MINIMA no cuenta. Y si el recorte se comiera
    mas de la mitad de un eje -un fotograma casi negro, un fundido-, no se
    recorta nada: mejor la foto tal cual que un sello de veinte pixeles.
    """
    w, h = im.size
    f = {k: (v if v >= FRANJA_MINIMA else 0) for k, v in franjas_negras(im).items()}
    caja = (f['izq'], f['arriba'], w - f['der'], h - f['abajo'])
    ancho, alto = caja[2] - caja[0], caja[3] - caja[1]
    if ancho < w * RESTO_MINIMO or alto < h * RESTO_MINIMO:
        return (0, 0, w, h)
    return caja


def abrir_derecha(origen):
    """El original con la orientacion EXIF aplicada. Sin esto la mitad de los
    verticales salen tumbados: la camara guarda el sensor en horizontal y anota
    "girala" en el EXIF."""
    return ImageOps.exif_transpose(Image.open(origen))


def derivar(origen, destino, lado, calidad, caja=None):
    with abrir_derecha(origen) as im:
        icc = im.info.get('icc_profile')
        if caja:
            im = im.crop(caja)
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
    # img/ es exactamente la salida de UNA pasada. Un archivo de una pasada
    # anterior que se quedara ahi -una pieza que hoy se recorta y ayer no-
    # enganaria a `contenido()`, que decide la llave mirando el disco.
    for viejo in glob.glob(os.path.join(destino, '*.jpg')):
        os.remove(viejo)
    hechas = 0
    for p in meta['proyectos']:
        nombres, _ = fotos_de(raiz, p['carpeta'])
        relativa = p['carpeta'].replace('/', os.sep)
        recortadas = 0
        for nombre in nombres:
            k = llave(os.path.join(relativa, nombre))
            origen = os.path.join(raiz, relativa, nombre)
            # La caja se calcula UNA vez por foto, no una por medida: la
            # exploracion fila a fila del original es lo caro.
            with abrir_derecha(origen) as im:
                caja = caja_sin_franjas(im)
                recortada = caja != (0, 0) + im.size
            if recortada:
                k += SUFIJO_RECORTE
                recortadas += 1
            for lado, calidad in MEDIDAS:
                derivar(origen, os.path.join(destino, '%s-%d.jpg' % (k, lado)),
                        lado, calidad, caja if recortada else None)
                hechas += 1
        sys.stdout.write('%-34s %2d fotos, %d recortadas\n'
                         % (p['id'], len(nombres), recortadas))
    return hechas


def llave_en_disco(k):
    """La llave con la que la foto esta de verdad en img/: con -r si esa pasada
    la recorto. Se mira el disco y no se recalcula, porque contenido.json
    describe lo que hay, y lo que hay lo decidio `derivar_todo`."""
    if os.path.exists(os.path.join(RAIZ_REPO, 'img', k + SUFIJO_RECORTE + '-3000.jpg')):
        return k + SUFIJO_RECORTE
    if not os.path.exists(os.path.join(RAIZ_REPO, 'img', k + '-3000.jpg')):
        raise SystemExit('%s no esta derivada en img/: deriva antes de describir' % k)
    return k


def contenido(raiz, meta):
    """Mezcla los datos humanos con lo que hay en disco.

    Las rutas son RELATIVAS -/img/...- y no absolutas: asi el sitio funciona
    servido por `python -m http.server` en la red local, que es como se prueba
    en un movil real, y son mismo origen, que es lo que permite medir el brillo
    (bloque 4g) sin que el lienzo se manche.
    """
    salida = []
    for p in meta['proyectos']:
        nombres, portada = fotos_de(raiz, p['carpeta'])
        if not portada:
            raise SystemExit('%s no tiene portada marcada' % p['carpeta'])
        relativa = p['carpeta'].replace('/', os.sep)
        k = lambda f: llave_en_disco(llave(os.path.join(relativa, f)))
        salida.append({
            'id': p['id'], 'titulo': p['titulo'],
            'categoria': p['categoria'], 'tipo': p['tipo'],
            'ficha': p['ficha'],
            'portada': '/img/%s-1500.jpg' % k(portada),
            'piezas': [{'url': '/img/%s-3000.jpg' % k(f),
                        'miniatura': '/img/%s-250.jpg' % k(f)}
                       for f in nombres]
        })
    return {'version': 2, 'proyectos': salida}


def escribir_contenido(raiz, meta):
    """Escribe contenido.json en la raiz del repositorio, ya formateado."""
    datos = contenido(raiz, meta)
    destino = os.path.join(RAIZ_REPO, 'contenido.json')
    with io.open(destino, 'w', encoding='utf-8') as f:
        f.write(json.dumps(datos, ensure_ascii=False, indent=2))
        f.write(u'\n')
    piezas = sum(len(p['piezas']) for p in datos['proyectos'])
    sys.stdout.write('%d proyectos y %d piezas en %s\n'
                     % (len(datos['proyectos']), piezas, destino))


def main(argv):
    if len(argv) < 2:
        raise SystemExit(__doc__)
    raiz = argv[1]
    if not os.path.isdir(raiz):
        raise SystemExit('no existe el directorio de originales: %s' % raiz)
    meta = leer_meta()
    # Con --contenido solo describe lo que ya hay en disco. Derivar
    # tarda minuto y medio y describir es instantaneo; obligar a lo
    # primero para conseguir lo segundo invita a no regenerar el JSON.
    if '--contenido' in argv:
        escribir_contenido(raiz, meta)
        return
    destino = os.path.join(RAIZ_REPO, 'img')
    hechas = derivar_todo(raiz, meta, destino)
    sys.stdout.write('%d archivos derivados en %s\n' % (hechas, destino))


if __name__ == '__main__':
    main(sys.argv)
