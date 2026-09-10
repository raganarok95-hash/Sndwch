#!/usr/bin/env python3
"""SND//WCH — comprueba que tratar_fotos.py no pueda estropear las fotos en silencio.

Los dos modos de fallo de ese script no lanzan ningún error, solo ensucian el resultado
un poco más cada vez:

 1. NO SER IDEMPOTENTE — si tratara la foto ya tratada en vez del original, cada corrida
    apilaría otra viñeta y otro grano. Nadie lo vería en la corrida en que ocurre.
 2. CERRAR EL ENCUADRE MÁS DE LO QUE LA FUENTE AGUANTA — cerrar tira píxeles, y con una
    foto chica el script empeoraría justo lo que vino a arreglar: se vería más borrosa
    a cambio de estar mejor encuadrada.

Uso:  python3 scripts/check_fotos.py
"""
import hashlib, importlib.util, os, sys, tempfile
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("tf", os.path.join(RAIZ, "scripts", "tratar_fotos.py"))
tf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tf)

fallos = []


def revisar(cond, msg):
    if not cond:
        fallos.append(msg)


# ── 1 · Tratar dos veces desde el original da bytes IDÉNTICOS ────────────────────────
with tempfile.TemporaryDirectory() as d:
    base = Image.open(os.path.join(RAIZ, "img", "fuente", "sig01.jpg"))
    firmas = []
    for i in range(2):
        p = os.path.join(d, f"{i}.jpg")
        tf.tratar(base).save(p, "JPEG", quality=tf.CALIDAD, optimize=True)
        firmas.append(hashlib.sha256(open(p, "rb").read()).hexdigest())
    revisar(firmas[0] == firmas[1],
            "tratar la misma foto dos veces da resultados distintos — el grano dejó de tener "
            "semilla fija, así que un diff ya no puede decir si una foto cambió de verdad")

# ── 2 · Tratar lo YA tratado se nota — o sea que leer de img/ sería un defecto real ──
with tempfile.TemporaryDirectory() as d:
    base = Image.open(os.path.join(RAIZ, "img", "fuente", "sig01.jpg"))
    una = tf.tratar(base)
    dos = tf.tratar(una)
    revisar(una.size != dos.size or una.tobytes()[:300] != dos.tobytes()[:300],
            "tratar una foto ya tratada no cambia nada — si eso fuera cierto el script sería "
            "idempotente por accidente y este chequeo no protegería nada")

# ── 3 · El zoom CEDE ante los píxeles ────────────────────────────────────────────────
revisar(tf.zoom_util(640) == 1.0,
        "una foto de 640 px se sigue cerrando: cerrar tira píxeles y la tarjeta ya pide 1050, "
        "así que quedaría MÁS borrosa de lo que estaba")
revisar(tf.zoom_util(1200) > 1.0,
        "una foto de 1200 px no cierra nada, desperdiciando resolución que sí hay")
revisar(tf.zoom_util(4000) == tf.ZOOM_MAX,
        "una foto enorme cierra más allá del tope y se come el pan por los extremos")
revisar(tf.zoom_util(1050) == 1.0,
        "justo en el ancho objetivo el zoom debe ser 1.0, no menos")

# ── 4 · El ratio del recorte es el de la tarjeta REAL ────────────────────────────────
# ⚠ Este número va ESCRITO ACÁ, medido aparte, y no leído de tf.RATIO. La primera versión
# comparaba el recorte contra la misma constante que lo produce: cambiar RATIO a 16/9 pasaba
# el chequeo sin protestar, porque el recorte obedecía al valor nuevo. Un chequeo que se
# mide contra sí mismo no protege nada.
#
# 350×236 CSS px es el tamaño real de la tarjeta a sangre, medido con el navegador sobre
# index.html. Si el diseño de esa tarjeta cambia, se vuelve a medir y se actualizan LOS DOS.
RATIO_MEDIDO = 350 / 236
revisar(abs(tf.RATIO - RATIO_MEDIDO) < 0.01,
        f"tf.RATIO ({tf.RATIO:.3f}) ya no es el de la tarjeta medida ({RATIO_MEDIDO:.3f}) — "
        "la foto se recortaría otra vez en el navegador, encima del recorte de acá")
recortada = tf.encuadrar(Image.new("RGB", (1600, 1100)))
revisar(abs(recortada.width / recortada.height - RATIO_MEDIDO) < 0.02,
        "el recorte no sale con el ratio de la tarjeta")

# ── 5 · Cada foto servida tiene su original guardado ─────────────────────────────────
servidas = {f for f in os.listdir(os.path.join(RAIZ, "img")) if f.startswith("sig") and f.endswith(".jpg")}
fuentes = set(os.listdir(os.path.join(RAIZ, "img", "fuente")))
huerfanas = servidas - fuentes
revisar(not huerfanas,
        f"estas fotos no tienen original en img/fuente/ y volver a correr el script las "
        f"dejaría sin tratar: {sorted(huerfanas)}")

if fallos:
    print("✗ check:fotos\n")
    for f in fallos:
        print("  · " + f)
    sys.exit(1)
print(f"✓ check:fotos — el tratamiento es idempotente, el zoom cede ante los píxeles "
      f"y las {len(servidas)} fotos tienen su original guardado")
