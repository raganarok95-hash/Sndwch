"""
SND//WCH — separación del logo a DOS TINTAS (verde + azul) para empaque.

POR QUÉ EXISTE. El logo original tiene más de doce colores, degradados y detalle fino
(flecos de lechuga, aros de cebolla, pepas de tomate). Eso es una ilustración, no un
archivo de imprenta: en papel manteca a dos tintas y a 2-4 cm de ancho, todo ese detalle
se convierte en una mancha y cada color extra es una plancha más que se paga.

QUÉ HACE. Reduce la imagen a un número CHICO de valores imprimibles:
    · verde 100%   — los contornos y la masa oscura
    · verde 50%    — el medio tono cálido (cara del lado izquierdo, pan)
    · azul 100%    — el pelaje frío del lado derecho
    · azul 45%     — el medio tono frío (cara del lado derecho)
    · papel        — sin tinta

Los tintes NO son colores nuevos: en imprenta a dos tintas son tramas del MISMO verde y del
MISMO azul. Por eso siguen siendo dos planchas y no cuatro.

CÓMO CLASIFICA, y por qué así. No parte la imagen por la mitad (eso seria imponerle una
geometria al dibujo). Clasifica por COLOR, que es lo que el dibujo ya dice:
    · lo muy oscuro va a verde solido, sea del lado que sea  -> conserva los contornos
    · lo frio (azul menos rojo alto) va a la familia azul
    · el resto va a la familia verde
Asi el sandwich, que cruza los dos lados, no queda partido.

El verde es el de la MARCA (#1E3932), no el del dibujo (#28402F): casi identicos, y usar el
de la marca hace que el empaque y la app sean el mismo verde. El azul sale medido del propio
archivo (#88C8E8).

Correr con:  python3 scripts/logo-dos-tintas.py <entrada.png> <carpeta-salida>
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

# [MEDIDO] verde de marca, el mismo de la app (src/shell.html, --sw-bg)
VERDE = (0x1E, 0x39, 0x32)
# [MEDIDO] azul muestreado del propio archivo del dueño
AZUL = (0x88, 0xC8, 0xE8)
# Azul más profundo, para papel kraft/manteca donde un celeste claro casi no se ve.
AZUL_HONDO = (0x2E, 0x7F, 0xB0)
PAPEL = (0xFF, 0xFF, 0xFF)

# Umbrales. Van acá arriba y con nombre porque son las tres perillas que hay que mover si la
# prueba de imprenta sale mal, y quien la mueva no tiene por qué leer el resto del archivo.
LUM_CONTORNO = 95      # por debajo de esto es contorno/masa oscura -> tinta sólida
LUM_MEDIO = 168        # entre contorno y esto -> medio tono; por encima -> papel
FRIO_MIN = 22          # (B - R) por encima de esto se considera del lado frío -> azul

# Tintes. La primera versión usaba verde al 50% y salió GRIS: el verde de marca es muy
# oscuro y desaturado, así que a media trama pierde el verde y solo queda el gris. A 28% sí
# se lee como verde claro. Es el tipo de error que solo se ve imprimiendo (o mirando el
# archivo con ojos de imprenta), nunca calculándolo.
TINTE_VERDE = 0.28
TINTE_AZUL = 0.34
# Suavizado previo. Sin esto, el degradado de la cara derecha se rompe en puntitos sueltos
# al cuantizar, y esos puntitos en imprenta salen como suciedad.
SUAVIZADO = 3


def mezcla(tinta, pct, fondo=PAPEL):
    """Simula una trama: la tinta al pct% sobre el papel. En imprenta esto es una trama de
    la MISMA plancha, no un color nuevo."""
    return tuple(round(f + (t - f) * pct) for t, f in zip(tinta, fondo))


def separar(entrada, salida, azul=AZUL, tintes=True):
    im = Image.open(entrada).convert("RGBA")
    if SUAVIZADO:
        alfa = im.getchannel("A")
        im = im.convert("RGB").filter(ImageFilter.MedianFilter(SUAVIZADO)).convert("RGBA")
        im.putalpha(alfa)
    w, h = im.size
    out = Image.new("RGB", (w, h), PAPEL)
    src = im.load()
    dst = out.load()

    verde_medio = mezcla(VERDE, TINTE_VERDE)
    azul_medio = mezcla(azul, TINTE_AZUL)

    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a < 128:
                continue                      # transparente -> papel
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            frio = b - r

            if lum < LUM_CONTORNO:
                dst[x, y] = VERDE             # contornos y masa oscura, siempre sólidos
            elif lum > LUM_MEDIO and frio < FRIO_MIN:
                dst[x, y] = PAPEL             # brillos cálidos -> papel, no tinta
            elif frio > FRIO_MIN:
                dst[x, y] = azul if (lum < LUM_MEDIO or not tintes) else azul_medio
            else:
                dst[x, y] = verde_medio if tintes else VERDE

    out.save(salida)
    return out


def linea_y_masas(entrada, salida, azul=AZUL_HONDO):
    """La vía que de verdad funciona a dos tintas: LÍNEA Y MASAS PLANAS, sin medios tonos.

    Por qué. El verde de marca (#1E3932) es muy oscuro y desaturado: cualquier trama suya
    sobre papel vira a GRIS, no a verde claro. Eso no se arregla moviendo el porcentaje — es
    una propiedad del color. Así que en vez de pelear con el medio tono, se elimina: lo
    oscuro es verde sólido, lo frío es azul sólido, y todo lo demás es PAPEL.

    El resultado se parece a la serigrafía de una polera, que es exactamente el lenguaje en
    el que estos personajes ya viven.
    """
    im = Image.open(entrada).convert("RGBA")
    if SUAVIZADO:
        alfa = im.getchannel("A")
        im = im.convert("RGB").filter(ImageFilter.MedianFilter(SUAVIZADO)).convert("RGBA")
        im.putalpha(alfa)
    w, h = im.size
    out = Image.new("RGB", (w, h), PAPEL)
    src, dst = im.load(), out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a < 128:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < LUM_CONTORNO:
                dst[x, y] = VERDE
            elif b - r > FRIO_MIN and lum < 242:
                # El techo va alto (242 y no 215) a proposito: los brillos que el dibujo
                # tiene DENTRO del pelaje azul son casi blancos, y dejarlos sin tinta abria
                # rayones blancos en medio de la masa azul que en imprenta se leen como
                # fallas de registro, no como brillos.
                dst[x, y] = azul
    out.save(salida)
    return out


def una_tinta(entrada, salida):
    """Versión a UNA sola tinta: lo más barato de imprimir y lo único que sobrevive en una
    bolsa chica. Todo lo que no es papel se vuelve verde sólido."""
    im = Image.open(entrada).convert("RGBA")
    w, h = im.size
    out = Image.new("RGB", (w, h), PAPEL)
    src, dst = im.load(), out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a < 128:
                continue
            if 0.299 * r + 0.587 * g + 0.114 * b < 168:
                dst[x, y] = VERDE
    out.save(salida)
    return out


def silueta(entrada, salida, tinta=VERDE, calar=False, umbral_calado=16):
    """SILUETA a una sola tinta: la forma sólida, sin medios tonos ni detalle tonal.

    Dos variantes, y la diferencia decide si el logo sobrevive:

    · PURA (calar=False) — toda la forma en tinta plena. Es lo más barato y lo más robusto
      de imprimir: una plancha, sin registro que pueda salir corrido. Pero pierde la cara
      entera: a este dibujo lo deja como una mancha con orejas.

    · CALADA (calar=True) — la misma forma sólida, pero los rasgos del dibujo (ojos,
      dientes, espiral, capas del sándwich) se dejan SIN tinta, o sea en papel. Sigue siendo
      UNA tinta, porque el papel no es un color: es la ausencia de tinta. Y así el
      personaje se sigue reconociendo.

      EL CALADO ES CONTRA EL ENTORNO LOCAL, NO CONTRA UN UMBRAL FIJO. Con un umbral fijo el
      resultado sale partido al medio: el lado izquierdo del dibujo es oscuro (pelaje verde,
      cara marrón) y no cala nada, el derecho es claro (pelaje celeste, cara rosa) y cala
      todo. Comparando cada píxel contra el promedio de su vecindario, un rasgo claro se
      detecta igual esté sobre fondo claro o sobre fondo oscuro — que es lo que hace que la
      cara izquierda y la derecha queden equilibradas.

    Se limpia la silueta con un filtro de mediana sobre el canal alfa: el archivo original
    trae motitas sueltas de un píxel que en imprenta salen como suciedad.
    """
    im = Image.open(entrada).convert("RGBA")
    alfa = im.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    alfa = alfa.filter(ImageFilter.MedianFilter(5))
    lum = im.convert("L")
    # El "entorno local": el mismo dibujo desenfocado. Un rasgo cala si es bastante más
    # claro que su vecindario, no si supera un número absoluto.
    entorno = lum.filter(ImageFilter.GaussianBlur(18))
    out = Image.new("RGB", im.size, PAPEL)
    dst, mask = out.load(), alfa.load()
    pl, pe = lum.load(), entorno.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if not mask[x, y]:
                continue
            if calar and pl[x, y] > pe[x, y] + umbral_calado:
                continue              # más claro que su entorno -> papel, sin tinta
            dst[x, y] = tinta
    out.save(salida)
    return out


def prueba_tamano(img, salida, ancho_mm=25, dpi=300):
    """La prueba que de verdad decide: reduce al tamaño REAL que va a tener en el empaque.
    Un logo se aprueba mirando esto, no mirando el archivo grande."""
    px = max(1, round(ancho_mm / 25.4 * dpi))
    chico = img.resize((px, round(px * img.height / img.width)), Image.LANCZOS)
    # Se vuelve a ampliar sin suavizar para poder VER qué se perdió al achicar.
    chico.resize((px * 4, chico.height * 4), Image.NEAREST).save(salida)
    return chico


if __name__ == "__main__":
    entrada = Path(sys.argv[1])
    carpeta = Path(sys.argv[2])
    carpeta.mkdir(parents=True, exist_ok=True)

    a = separar(entrada, carpeta / "logo-2tintas-azul-claro.png")
    b = separar(entrada, carpeta / "logo-2tintas-azul-hondo.png", azul=AZUL_HONDO)
    c = separar(entrada, carpeta / "logo-2tintas-planas.png", azul=AZUL_HONDO, tintes=False)
    d = una_tinta(entrada, carpeta / "logo-1tinta-verde.png")

    e = linea_y_masas(entrada, carpeta / "logo-2tintas-linea-y-masas.png")
    f = silueta(entrada, carpeta / "silueta-pura-verde.png")
    g_ = silueta(entrada, carpeta / "silueta-calada-verde.png", calar=True)
    prueba_tamano(f, carpeta / "prueba-25mm-silueta-pura.png")
    prueba_tamano(g_, carpeta / "prueba-25mm-silueta-calada.png")

    for img, nombre in ((a, "azul-claro"), (b, "azul-hondo"), (c, "planas"),
                        (d, "1tinta"), (e, "linea")):
        prueba_tamano(img, carpeta / f"prueba-25mm-{nombre}.png")

    print("Generado en", carpeta)
    for f in sorted(carpeta.iterdir()):
        print("  ", f.name)
