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

# ── 5 · El perfil de proteína NO vuelve a cerrar el encuadre ─────────────────────────
# Las de proteína ya vienen recortadas al sujeto en la fuente, y cada una necesitaba su
# propio recorte (fuera el mantel a cuadros, las aceitunas, el fondo turquesa). Un zoom
# automático encima se comería la proteína en vez de la escenografía, que ya no está.
revisar(tf.PERFILES["prot"]["zoom"] == 1.0,
        "el perfil de proteína volvió a cerrar el encuadre: recortaría la carne, no el fondo")
revisar(abs(tf.PERFILES["prot"]["ratio"] - 1.0) < 1e-9,
        "las fotos de proteína dejaron de ser cuadradas — se usan a la vez en la miniatura de "
        "56x56 y en el hero de 190 px, y el cuadrado es lo único que sirve en los dos")
cuadrada = tf.encuadrar(Image.new("RGB", (1600, 1600)), 1.0, 1050, 1.0)
revisar(cuadrada.size == (1600, 1600),
        f"el encuadre cuadrado ya no deja la foto intacta: salió {cuadrada.size}")

# ── 6 · Bajar al ancho objetivo nunca SUBE ───────────────────────────────────────────
# Las 8 de Signature vienen a 640 px, por debajo del objetivo. Si `ajustar` las estirara,
# inventaría píxeles y engordaría el archivo sin ganar un solo detalle.
revisar(tf.ajustar(Image.new("RGB", (640, 432)), 1050).size == (640, 432),
        "una foto más chica que el objetivo se está estirando: eso inventa píxeles")
revisar(tf.ajustar(Image.new("RGB", (1600, 1600)), 1050).size == (1050, 1050),
        "una foto más grande que el objetivo no se está bajando: el cliente descargaría de más")

# ── 7 · Cada foto servida tiene su original guardado ─────────────────────────────────
# Se mira por NOMBRE BASE, no por nombre de archivo: desde el 2026-09-17 las de proteína
# salen en .webp desde una fuente .jpg, así que comparar los nombres completos daría por
# huérfanas a las seis.
IMG = os.path.join(RAIZ, "img")
servidas = {f for f in os.listdir(IMG)
            if (f.startswith("sig") or f.startswith("prot_")) and f.endswith((".jpg", ".webp"))}
fuentes = {os.path.splitext(f)[0] for f in os.listdir(os.path.join(IMG, "fuente"))}
huerfanas = {f for f in servidas if os.path.splitext(f)[0] not in fuentes}
revisar(not huerfanas,
        f"estas fotos no tienen original en img/fuente/ y volver a correr el script las "
        f"dejaría sin tratar: {sorted(huerfanas)}")

# ── 8 · Y no quedó ningún archivo viejo del formato anterior ─────────────────────────
# Al pasar las de proteína a .webp, un .jpg olvidado no rompe nada y no lo ve nadie: la app
# sirve el .webp y el .jpg se queda de peso muerto en el repo para siempre.
sobrantes = {f for f in os.listdir(IMG)
             if f.startswith("prot_") and not f.endswith(tf.PERFILES["prot"]["ext"])}
revisar(not sobrantes,
        f"quedaron fotos de proteína en un formato que la app ya no sirve: {sorted(sobrantes)}")

if fallos:
    print("✗ check:fotos\n")
    for f in fallos:
        print("  · " + f)
    sys.exit(1)
print(f"✓ check:fotos — el tratamiento es idempotente, el zoom cede ante los píxeles "
      f"y las {len(servidas)} fotos tienen su original guardado")
