"""SND//WCH — el logo de los hermanos a UNA tinta, para sello de goma (2026-10-09).

Sale del avatar con fondo transparente (`img/marca/avatar-1024-transparente.png`), que trae la
cabeza ENTERA: `logo-hermanos.png` viene recortado de origen (el mechón y las puntas del pan tocan
el borde) y en el sello se veía cortado (dueño: «se ve algo cortado el logo»).

1. La silueta (canal alfa) se limpia de motas sueltas.
2. Umbral sobre la luminancia: lo oscuro (el pelaje de SANDO, los contornos, la espiral de WICHO)
   es tinta; lo claro es papel.
3. Un contorno de tinta alrededor de toda la silueta: la cabeza queda cerrada, como un escudo.
Sale negro sobre transparente (para la sellería) y en el verde de la tinta (para las maquetas).

Uso: python3 scripts/piezas/logo_a_sello.py
"""
from PIL import Image, ImageChops, ImageFilter

FUENTE = "img/marca/avatar-1024-transparente.png"
DESTINO = "docs/marketing/bolsa/sellos/logo-tinta.png"
UMBRAL = 100   # probado contra 95, 110 y 125: a 100 la cara de SANDO queda limpia y sin manchas
CONTORNO = 13  # px de borde alrededor de la silueta (a 9 cm de ancho, ~1.4 mm)
MOTA = 400     # manchas de menos píxeles que esto se borran


def sin_motas(capa: Image.Image, minimo: int) -> Image.Image:
    """Borra las manchas blancas (255) de menos de `minimo` píxeles, recorriéndolas con una pila."""
    capa = capa.copy()
    px, (w, h) = capa.load(), capa.size
    visto = bytearray(w * h)
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0] == 0 or visto[y0 * w + x0]:
                continue
            mancha, pila = [], [(x0, y0)]
            visto[y0 * w + x0] = 1
            while pila:
                x, y = pila.pop()
                mancha.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not visto[ny * w + nx]:
                        visto[ny * w + nx] = 1
                        pila.append((nx, ny))
            if len(mancha) < minimo:
                for x, y in mancha:
                    px[x, y] = 0
    return capa


im = Image.open(FUENTE).convert("RGBA")
silueta = sin_motas(im.getchannel("A").point(lambda v: 255 if v > 128 else 0), 5000)
fondo = Image.new("RGBA", im.size, (255, 255, 255, 255))
fondo.alpha_composite(im)
tinta = fondo.convert("L").point(lambda v: 255 if v < UMBRAL else 0)
tinta = ImageChops.multiply(tinta, silueta)
borde = ImageChops.subtract(silueta.filter(ImageFilter.MaxFilter(CONTORNO)), silueta)
tinta = sin_motas(ImageChops.lighter(tinta, borde).filter(ImageFilter.MedianFilter(5)), MOTA)

salida = Image.new("RGBA", im.size, (0, 0, 0, 0))
salida.putalpha(tinta)
salida = salida.crop(salida.getbbox())
salida.save(DESTINO)
verde = Image.new("RGBA", salida.size, (0x1E, 0x2B, 0x22, 255))
verde.putalpha(salida.getchannel("A"))
verde.save(DESTINO.replace(".png", "-verde.png"))
print(f"✓ {DESTINO} y su versión verde ({salida.width}×{salida.height})")
