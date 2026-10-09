"""SND//WCH — el logo de los hermanos a UNA tinta, para sello de goma (2026-10-09).

Umbral sobre la luminancia: lo oscuro (el pelaje de SANDO, los contornos, la espiral de WICHO) es
tinta; lo claro es papel. Se limpian las motas sueltas. Sale negro sobre transparente, que es lo
que pide la sellería (y lo que usa stickers.mjs para la maqueta).

Uso: python3 scripts/piezas/logo_a_sello.py
"""
from PIL import Image, ImageFilter

FUENTE = "img/marca/logo-hermanos.png"
DESTINO = "docs/marketing/bolsa/sellos/logo-tinta.png"
UMBRAL = 105  # probado contra 70: a 105 se conservan la ceja de SANDO y la espiral de WICHO

im = Image.open(FUENTE).convert("RGBA")
fondo = Image.new("RGBA", im.size, (255, 255, 255, 255))
fondo.alpha_composite(im)
tinta = fondo.convert("L").point(lambda v: 255 if v < UMBRAL else 0).filter(ImageFilter.MedianFilter(5))
# Motas sueltas (manchas de menos de MOTA píxeles que no tocan el dibujo): se borran recorriendo
# cada mancha con una pila, sin depender de scipy.
MOTA = 400
px, (W, H) = tinta.load(), tinta.size
visto = bytearray(W * H)
for y0 in range(H):
    for x0 in range(W):
        if px[x0, y0] == 0 or visto[y0 * W + x0]:
            continue
        mancha, pila = [], [(x0, y0)]
        visto[y0 * W + x0] = 1
        while pila:
            x, y = pila.pop()
            mancha.append((x, y))
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H and px[nx, ny] and not visto[ny * W + nx]:
                    visto[ny * W + nx] = 1
                    pila.append((nx, ny))
        if len(mancha) < MOTA:
            for x, y in mancha:
                px[x, y] = 0
salida = Image.new("RGBA", im.size, (0, 0, 0, 0))
salida.putalpha(tinta)
salida = salida.crop(salida.getbbox())
salida.save(DESTINO)
# La misma forma en la tinta de la bolsa (verde casi negro), para las maquetas.
verde = Image.new("RGBA", salida.size, (0x1E, 0x2B, 0x22, 255))
verde.putalpha(salida.getchannel("A"))
verde.save(DESTINO.replace(".png", "-verde.png"))
print(f"✓ {DESTINO} y su versión verde ({salida.width}×{salida.height})")
