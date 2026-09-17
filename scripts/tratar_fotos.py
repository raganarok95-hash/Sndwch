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

# ── DOS FAMILIAS DE FOTO, DOS ENCUADRES ────────────────────────────────────────────────
# Las de Signature son una tarjeta a sangre horizontal. Las de PROTEÍNA se usan en DOS
# sitios a la vez con formas distintas: la miniatura de 56×56 de la lista del armador y el
# hero de 190 px de alto de la pantalla de confirmación. Lo único que sirve para las dos es
# un CUADRADO — `object-fit:cover` recorta el sobrante en cada sitio sin deformar nada.
#
# ⚠ Y SU ZOOM ES 1.0, no 1.34. El zoom automático existe para sacar del cuadro la
# escenografía de una foto ajena; en las de proteína esa escenografía ya no está, porque el
# recorte al sujeto (fuera el mantel a cuadros, las aceitunas, el fondo turquesa) se hizo al
# guardar la fuente, y cada una necesitaba su propio encuadre. Cerrar OTRA VEZ acá se
# comería la proteína en vez del mantel.
# El FORMATO también cambia por familia. Un cuadrado de 1050 px tiene 4x los píxeles de la
# tarjeta de Signature (640×432), y en JPEG las seis juntas pesaban 1.3 MB — que es lo que
# el cliente descarga de golpe al abrir ARMA EL TUYO, porque las seis miniaturas se ven a la
# vez. En WebP las mismas seis pesan ~600 KB SIN perder un píxel. No es una apuesta: la
# pantalla de entrada ya sirve a los dos hermanos en .webp, así que el formato ya era
# requisito duro de la app antes de esto.
PERFILES = {
    "sig":  {"ratio": RATIO, "ancho": ANCHO_OBJETIVO, "zoom": ZOOM_MAX, "fmt": "JPEG", "ext": ".jpg"},
    "prot": {"ratio": 1.0,   "ancho": ANCHO_OBJETIVO, "zoom": 1.0,      "fmt": "WEBP", "ext": ".webp"},
}


def perfil(nombre):
    return PERFILES["prot"] if nombre.startswith("prot_") else PERFILES["sig"]


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
CALIDAD_WEBP = 80     # WebP a 80 se ve como JPEG 88 y pesa la mitad


def zoom_util(w, ancho=ANCHO_OBJETIVO, zmax=ZOOM_MAX):
    """Cuánto se puede cerrar sin bajar del ancho que la pantalla pide."""
    return max(1.0, min(zmax, w / ancho))


def encuadrar(im, ratio=RATIO, ancho=ANCHO_OBJETIVO, zmax=ZOOM_MAX):
    w, h = im.size
    z = zoom_util(w, ancho, zmax)
    cw, ch = w / z, w / z / ratio
    if ch > h:
        ch = h / z
        cw = ch * ratio
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


def ajustar(im, ancho):
    """Baja al ancho que la pantalla pide. NUNCA sube.

    Las 8 fotos de Signature vienen a 640 px — por debajo del objetivo — así que acá no les
    pasa nada; subirlas solo inventaría píxeles y engordaría el archivo. Las de proteína sí
    vienen grandes, y sin este paso el archivo servido saldría de 1600 px y ~600 KB por una
    tarjeta que ocupa 1050. Va ANTES del grano a propósito: el grano se mezcla por píxel, y
    aplicarlo antes de reducir lo dejaría más fino en unas fotos que en otras — justo la
    textura distinta que este script existe para eliminar.
    """
    if im.width <= ancho:
        return im
    return im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)


def tratar(im, ratio=RATIO, ancho=ANCHO_OBJETIVO, zmax=ZOOM_MAX):
    im = ajustar(encuadrar(im.convert("RGB"), ratio, ancho, zmax), ancho)
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
        pf = perfil(nombre)
        salida = tratar(origen, pf["ratio"], pf["ancho"], pf["zoom"])
        destino = os.path.splitext(nombre)[0] + pf["ext"]
        if pf["fmt"] == "WEBP":
            salida.save(os.path.join(DESTINO, destino), "WEBP", quality=CALIDAD_WEBP, method=6)
        else:
            salida.save(os.path.join(DESTINO, destino), "JPEG", quality=CALIDAD, optimize=True)
        # Se avisa cuando la foto no da los píxeles que la pantalla pide: la tarjeta ocupa
        # 1050 px reales en un celular a DPR 3, así que menos que eso se ve blando por más
        # tratamiento que se le aplique.
        z = zoom_util(origen.size[0], pf["ancho"], pf["zoom"])
        if salida.width < pf["ancho"]:
            aviso = f"  ⚠ le faltan píxeles: se estirará {pf['ancho'] / salida.width:.2f}x"
            if z < pf["zoom"]:
                aviso += f" — y el encuadre solo pudo cerrar a {z:.2f} de {pf['zoom']}"
        else:
            aviso = ""
        peso = os.path.getsize(os.path.join(DESTINO, destino)) // 1024
        print(f"  · {nombre} → {destino}: {origen.size[0]}×{origen.size[1]} → "
              f"{salida.size[0]}×{salida.size[1]}, {peso} KB{aviso}")
    print(f"✓ {len(archivos)} fotos tratadas desde img/fuente/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
