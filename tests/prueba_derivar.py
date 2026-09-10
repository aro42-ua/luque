# -*- coding: utf-8 -*-
"""Pruebas de las partes puras de la herramienta de derivacion.

Aparte del arnes del navegador y por el mismo motivo que
`tests/pesar_imagenes.py`: esto es Python y se lanza a mano.
"""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', 'herramientas'))
from derivar_imagenes import llave, medidas_de


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


if __name__ == '__main__':
    unittest.main()
