#!/usr/bin/env python3
"""SND//WCH — un mismo tratamiento para las 8 fotos de Signature.

── POR QUÉ EXISTE ──
El dueño reportó que la app "parece un agregado a la web antigua cuando es una
reconstrucción del front". La causa no era el diseño: las 8 fotos de Signature vienen de
8 sesiones fotográficas ajenas distintas — una sobre tabla oscura con luz cálida dura,
otra sobre plato gris con luz fría, otra sobre fondo blanco de estudio con una botella,
otra sobre mantel estampado. Puestas en fila sobre el mismo verde se leen como resultados
de una búsqueda de imágenes, porque es literalmente lo que son.

⚠ LO QUE LAS UNIFICA ES EL ENCUADRE, NO EL COLOR. Se probó primero solo con viraje de
color y casi no se notaba: ningún filtro arregla que una foto tenga una botella de estudio
y otra un mantel. Cerrando el encuadre la escenografía sale del cuadro y queda pan y
relleno, que es lo único que las ocho de verdad comparten. El color viene después, a
terminar de pegarlas.

── POR QUÉ LEE DE img/fuente/ ──
Para ser IDEMPOTENTE. Aplicar viñeta y grano sobre una foto que ya los tiene la degrada
(doble viñeta, doble grano), y ese defecto no da ningún error: solo va ensuciando la foto
cada vez que alguien corre el script "por si acaso". Partiendo siempre del original eso no
puede pasar, y además deja re-ajustar los parámetros sin volver a conseguir las fotos.

Uso:  python3 scripts/tratar_fotos.py
"""
import os, random, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(RAIZ, "img", "fuente")
DESTINO = os.path.join(RAIZ, "img")

# El ratio NO está escrito a ojo: se midió el elemento real en el navegador — la tarjeta a
# sangre es de 350×236 CSS px. Si el diseño de esa tarjeta cambia, este número cambia con
# él o las fotos vuelven a recortarse mal.
RATIO = 350 / 236

# Acercamiento del encuadre. 1.34 es lo que hace desaparecer el plato, el mantel y la
# botella sin llegar a cortar el pan por los extremos.
#
# ⚠ PERO EL ZOOM CEDE ANTE LOS PÍXELES, y ese es el guardarraíl que evita que este script
# empeore lo que vino a arreglar. Cerrar el encuadre TIRA píxeles: una foto de 640 px de
# ancho cerrada a 1.34 queda en 477, y la tarjeta pide 1050 reales — o sea que ganaría
# unificación a cambio de MÁS estiramiento del que ya tenía. El zoom se recorta solo hasta
# donde la fuente aguante, y si no aguanta nada se queda en 1.0 (solo recorte al ratio).
# Con fotos grandes de verdad se cierra entero y no cuesta nada.
ZOOM_MAX = 1.34
ANCHO_OBJETIVO = 1050   # lo que la tarjeta ocupa en un celular a DPR 3, medido en el navegador

# El centro de interés está un pelo ARRIBA del centro geométrico: en las 8 fotos el
# sándwich se apoya en algo, así que el tercio inferior es superficie y no producto.
SESGO_VERTICAL = 0.92

SATURACION = 0.68     # ocho paletas distintas chocan sobre todo por el color
CONTRASTE = 1.18
VIRAJE = 0.34         # mezcla hacia la paleta: sombras al verde del fondo, luces al dorado
SOMBRA_MARCA = (0x1E, 0x2B, 0x22)
LUZ_MARCA = (0xE9, 0xC9, 0x8A)
VINETA = 0.40         # cuánto se oscurecen los bordes
GRANO = 0.055         # textura compartida — poca, pero es la que termina de unificarlas
CALIDAD = 88


def zoom_util(w):
    """Cuánto se puede cerrar sin bajar del ancho que la pantalla pide."""
    return max(1.0, min(ZOOM_MAX, w / ANCHO_OBJETIVO))


def encuadrar(im):
    w, h = im.size
    z = zoom_util(w)
    cw, ch = w / z, w / z / RATIO
    if ch > h:
        ch = h / z
        cw = ch * RATIO
    x = (w - cw) / 2
    y = (h - ch) / 2 * SESGO_VERTICAL
    return im.crop((int(x), int(y), int(x + cw), int(y + ch)))


def virar(im):
    """Mezcla la foto hacia la paleta usando una LUT por canal.

    Con un bucle en Python esto tarda segundos por foto y minutos cuando lleguen las
    versiones grandes (las de hoy son de 640 px y se estiran 64% en pantalla, así que van a
    reemplazarse). La LUT hace el mismo cálculo dentro de Pillow, en C.
    """
    luz = im.convert("L")
    lut = []
    for canal, (s, l) in enumerate(zip(SOMBRA_MARCA, LUZ_MARCA)):
        lut += [int(s + (l - s) * (i / 255)) for i in range(256)]
    teñida = luz.convert("RGB")
    teñida = Image.merge("RGB", [
        luz.point(lut[c * 256:(c + 1) * 256]) for c in range(3)
    ])
    return Image.blend(im, teñida, VIRAJE)


def vinetear(im):
    w, h = im.size
    mascara = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mascara).ellipse(
        [-w * 0.14, -h * 0.20, w * 1.14, h * 1.20], fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(min(w, h) * 0.20))
    return Image.composite(im, ImageEnhance.Brightness(im).enhance(VINETA), mascara)


def granular(im):
    w, h = im.size
    # Semilla fija: el grano tiene que ser el MISMO patrón en las ocho, o cada foto trae su
    # propia textura y volvemos al problema que este script resuelve. Y hace que correr el
    # script dos veces produzca bytes idénticos, que es lo que permite ver en un diff si
    # una foto cambió de verdad.
    random.seed(7)
    ruido = Image.frombytes("L", (w, h), bytes(
        random.randint(115, 140) for _ in range(w * h)))
    return Image.blend(im, ruido.convert("RGB"), GRANO)


def tratar(im):
    im = encuadrar(im.convert("RGB"))
    im = ImageEnhance.Color(im).enhance(SATURACION)
    im = ImageEnhance.Contrast(im).enhance(CONTRASTE)
    return granular(vinetear(virar(im)))


def main():
    if not os.path.isdir(FUENTE):
        print(f"✗ No existe {FUENTE}. Los originales sin tratar van ahí.", file=sys.stderr)
        return 1
    archivos = sorted(f for f in os.listdir(FUENTE) if f.lower().endswith((".jpg", ".jpeg")))
    if not archivos:
        print(f"✗ {FUENTE} está vacío.", file=sys.stderr)
        return 1
    for nombre in archivos:
        origen = Image.open(os.path.join(FUENTE, nombre))
        salida = tratar(origen)
        salida.save(os.path.join(DESTINO, nombre), "JPEG", quality=CALIDAD, optimize=True)
        # Se avisa cuando la foto no da los píxeles que la pantalla pide: la tarjeta ocupa
        # 1050 px reales en un celular a DPR 3, así que menos que eso se ve blando por más
        # tratamiento que se le aplique.
        z = zoom_util(origen.size[0])
        if salida.width < ANCHO_OBJETIVO:
            aviso = f"  ⚠ le faltan píxeles: se estirará {ANCHO_OBJETIVO / salida.width:.2f}x"
            if z < ZOOM_MAX:
                aviso += f" — y el encuadre solo pudo cerrar a {z:.2f} de {ZOOM_MAX}"
        else:
            aviso = ""
        print(f"  · {nombre}: {origen.size[0]}×{origen.size[1]} → {salida.size[0]}×{salida.size[1]}{aviso}")
    print(f"✓ {len(archivos)} fotos tratadas desde img/fuente/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
