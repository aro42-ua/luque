# -*- coding: utf-8 -*-
"""Pruebas de las partes puras de la herramienta de derivacion.

Aparte del arnes del navegador y por el mismo motivo que
`tests/pesar_imagenes.py`: esto es Python y se lanza a mano.
"""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', 'herramientas'))
from derivar_imagenes import (llave, medidas_de, franjas_negras, caja_sin_franjas,
                              se_recorta)
from PIL import Image


class PruebaLlave(unittest.TestCase):

    def test_aplana_la_ruta_entera(self):
        self.assertEqual(llave(os.path.join('EDITORIAL', 'La Boquerona',
                                            'IMG_5637.JPG')),
                         'editorial-la-boquerona-img_5637')

    def test_translitera_los_acentos(self):
        """nombreSeguro del Worker convertiria la o acentuada en un guion."""
        self.assertEqual(llave(os.path.join('EDITORIAL', 'Monstruacio\u0301n',
                                            'a.jpg')),
                         'editorial-monstruacion-a')

    def test_seis_portadas_con_el_mismo_nombre_no_colisionan(self):
        """Seis de los ocho proyectos llaman a su portada ESTA PORTADA.jpg.
        Con solo el nombre del archivo colisionarian seis de ocho."""
        a = llave(os.path.join('EDITORIAL', 'La Boquerona', 'ESTA PORTADA.jpg'))
        b = llave(os.path.join('VIDEOCLIP', 'TUKATU', 'ESTA PORTADA.jpg'))
        self.assertNotEqual(a, b)

    def test_todo_en_minusculas(self):
        """Las llaves de R2 distinguen mayusculas y este proyecto ya se quemo
        con eso: el auditor de rutas del bloque 1 existe por ese motivo."""
        self.assertEqual(llave('A/B.JPG'), 'a-b')


class PruebaMedidas(unittest.TestCase):
    """La medida es EL LADO LARGO, no una caja de proporcion fija."""

    def test_una_vertical_topa_por_el_alto(self):
        self.assertEqual(medidas_de((4000, 6000), 3000), (2000, 3000))

    def test_una_horizontal_topa_por_el_ancho(self):
        """Con una caja 2400x3000 esta se quedaba en 2400x1600: un 20% menos
        de lado largo que una vertical, sin ninguna razon."""
        self.assertEqual(medidas_de((5760, 3840), 3000), (3000, 2000))

    def test_una_foto_mas_pequena_que_la_caja_no_se_agranda(self):
        self.assertEqual(medidas_de((800, 600), 3000), (800, 600))


def con_franjas(ancho, alto, arriba=0, abajo=0, izq=0, der=0, gris=128):
    """Un rectangulo gris con franjas negras del grosor pedido en cada borde."""
    im = Image.new('RGB', (ancho, alto), (0, 0, 0))
    im.paste((gris, gris, gris), (izq, arriba, ancho - der, alto - abajo))
    return im


class PruebaFranjas(unittest.TestCase):
    """Quince capturas de video de los videoclips traen bandas negras de lado a
    lado: video vertical metido en un cuadro 16:9, sobre todo. Se recortan al
    derivar, del original y no del derivado."""

    def test_mide_las_cuatro_franjas(self):
        im = con_franjas(400, 300, arriba=10, abajo=0, izq=60, der=60)
        self.assertEqual(franjas_negras(im),
                         {'arriba': 10, 'abajo': 0, 'izq': 60, 'der': 60})

    def test_una_franja_de_menos_de_cuatro_pixeles_no_cuenta(self):
        """Un borde de dos pixeles oscuros es compresion, no una banda."""
        im = con_franjas(400, 300, izq=2)
        self.assertEqual(caja_sin_franjas(im), (0, 0, 400, 300))

    def test_la_caja_quita_solo_las_franjas(self):
        im = con_franjas(400, 300, arriba=10, izq=60, der=60)
        self.assertEqual(caja_sin_franjas(im), (60, 10, 340, 300))

    def test_una_foto_oscura_entera_no_se_recorta_a_nada(self):
        """Un fotograma casi negro -un fundido- tiene 'franjas' por los cuatro
        lados que se comen la imagen entera. Ahi no se recorta: se deja tal cual
        antes que devolver una caja vacia o un sello de veinte pixeles."""
        im = Image.new('RGB', (400, 300), (5, 5, 5))
        self.assertEqual(caja_sin_franjas(im), (0, 0, 400, 300))

    def test_gris_oscuro_pero_no_negro_no_es_franja(self):
        """El umbral es 32 de 255. Un cielo de noche a 40 no es una banda."""
        im = con_franjas(400, 300, arriba=50, gris=200)
        im.paste((40, 40, 40), (0, 0, 400, 50))
        self.assertEqual(caja_sin_franjas(im), (0, 0, 400, 300))


class PruebaExclusion(unittest.TestCase):
    """Los rotulos de Conejita Playboy (1.1.11 y 1.1.3) tienen franja negra de
    verdad, pero recortarla se lleva parte del titulo. Lidia los encuadro asi.
    La lista `sin_recorte` del proyecto, en proyectos.json, los deja enteros."""

    def test_una_pieza_en_sin_recorte_no_se_recorta(self):
        p = {'sin_recorte': ['1.1.11_1.1.11.jpg']}
        self.assertFalse(se_recorta('1.1.11_1.1.11.jpg', p))

    def test_las_demas_si(self):
        p = {'sin_recorte': ['1.1.11_1.1.11.jpg']}
        self.assertTrue(se_recorta('1.1.6_1.1.6.jpg', p))

    def test_un_proyecto_sin_lista_recorta_todo(self):
        self.assertTrue(se_recorta('a.jpg', {}))


if __name__ == '__main__':
    unittest.main()
