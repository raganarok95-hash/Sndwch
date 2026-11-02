"""Lemon Tea y The Chai sobre la lata en alta de Cold Brew Tea (la foto real del dueño ya compuesta).

La lata es transparente y el sticker va impreso en crema: el color es el líquido. Por eso:
1. se borra el bloque del frente (frase en mono, nombre, ícono y sabor) rellenando cada columna con
   el líquido de arriba y de abajo (el color del líquido cambia con x, no con y);
2. se escribe el bloque nuevo en crema, centrado como en las otras tres (Anton, Instrument Serif
   cursiva y la frase en mono copiada de la lata original);
3. se devuelven encima las gotas de la lata original que no tocaban el texto viejo;
4. se cambia el color del líquido con Beer-Lambert: nuevo = (viejo)^k por canal, que deja el crema
   casi igual y respeta la luz de la foto. Las barras doradas y celestes del logo no se tocan.

Uso, desde la raíz del repo:
  FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) python3 docs/marketing/instagram-perfil/final/latas/hacer-lemon-chai.py
Escribe lata-lemon-tea.png y lata-chai.png en esta carpeta.
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__)) + '/'
D = tempfile.mkdtemp() + '/'
BASE = AQUI + 'lata-cold-brew.png'

X0, X1, Y0, Y1 = 322, 812, 672, 1978          # bloque del frente que se borra
CENTRO = 548                                     # centro del bloque en las tres latas
ABAJO = 1924                                     # el pie del bloque (el sabor no baja de acá)
CENTRO_Y = 1337                                  # el nombre va centrado a esta altura (BLOOM 1336, COLD BREW TEA 1337)
LARGO = 1177                                     # largo máximo del nombre
CAP_MAX = 425                                    # alto máximo de la letra del nombre (COOL)
SABOR_DESDE = 990                                # el sabor vive entre el ícono y el pie del nombre
REF = np.array([71, 29, 11], float)              # el centro del líquido de Cold Brew

ICONOS = {
    # rodaja de limón: cáscara, borde de la pulpa y gajos
    'limon': '<circle cx="50" cy="50" r="43"/><circle cx="50" cy="50" r="33"/>'
             + ''.join(f'<line x1="{50+7*np.cos(a):.1f}" y1="{50+7*np.sin(a):.1f}" x2="{50+28*np.cos(a):.1f}" y2="{50+28*np.sin(a):.1f}"/>'
                       for a in np.linspace(0, 2*np.pi, 7)[:-1] + np.pi/6),
    # anís estrellado: ocho vainas en punta y el centro
    'anis': ''.join(f'<path transform="rotate({45*i} 50 50)" d="M50 44 Q59 26 50 6 Q41 26 50 44 Z"/>' for i in range(8))
            + '<circle cx="50" cy="50" r="5"/>',
}

LATAS = {
    'lemon-tea': dict(nombre='LEMON TEA', sabor='Té negro y limón', icono='limon', centro=(176, 96, 20)),
    'chai': dict(nombre='CHAI', sabor='Especiado y aromático', icono='anis', centro=(122, 40, 18)),
}


def render(items):
    p = D + 'items.json'
    json.dump(items, open(p, 'w'))
    subprocess.run(['node', AQUI + 'texto.cjs', p, D], check=True, cwd=AQUI + '../../../../..')
    out = {}
    for it in items:
        al = np.array(Image.open(D + it['id'] + '.png'))[..., 3].astype(float) / 255
        ys, xs = np.nonzero(al > 0.02)
        out[it['id']] = al[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return out


def crema(x):
    """Color de la tinta crema según x (la luz de la foto la oscurece hacia la derecha)."""
    c = np.array([244.9, 239.3, 228.5]) + (np.clip(x, 250, 820) - 370)[..., None] * np.array([-0.054, -0.053, -0.052])
    return c


def pegar(img, alfa, x, y):
    h, w = alfa.shape
    xs = np.arange(x, x + w)
    c = crema(xs)[None, :, :]
    reg = img[y:y + h, x:x + w, :3]
    img[y:y + h, x:x + w, :3] = reg * (1 - alfa[..., None]) + c * alfa[..., None]


def componentes(m):
    """Etiquetas de componentes conexas (4 vecinos) sin scipy."""
    lab = np.zeros(m.shape, int); n = 0
    pts = np.argwhere(m)
    for y, x in pts:
        if lab[y, x]: continue
        n += 1; pila = [(y, x)]; lab[y, x] = n
        while pila:
            cy, cx = pila.pop()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; pila.append((yy, xx))
    return lab, n


def dilatar(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dy * dy + dx * dx <= r * r:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


orig = np.array(Image.open(BASE).convert('RGBA')).astype(float)
rgb = orig[..., :3]
L = rgb.mean(2); sat = rgb.max(2) - rgb.min(2)

# 1 · relleno por columna
arriba = np.median(rgb[672:740, X0:X1], axis=0)
abajo = np.median(rgb[1930:1980, X0:X1], axis=0)
ref = np.median(np.concatenate([rgb[672:740, X0:X1], rgb[1930:1980, X0:X1]]), axis=0)
# una gota grande en una de las dos franjas tiñe la columna entera: ahí manda la mediana de las dos
arriba = np.where((np.abs(arriba - ref).max(1) > 4)[:, None], ref, arriba)
abajo = np.where((np.abs(abajo - ref).max(1) > 4)[:, None], ref, abajo)
t = ((np.arange(Y0, Y1) - Y0) / (Y1 - Y0))[:, None, None]
relleno = arriba[None] * (1 - t) + abajo[None] * t

# las gotas: lo que difiere del relleno, lejos del texto viejo
bloque = rgb[Y0:Y1, X0:X1]
texto_viejo = dilatar((L[Y0:Y1, X0:X1] > 150) & (sat[Y0:Y1, X0:X1] < 80), 7)
dif = bloque - relleno
marca = np.abs(dif).max(2) > 7
lab, n = componentes(dilatar(marca, 2))
tocan = set(np.unique(lab[texto_viejo & (lab > 0)]))
gotas = np.isin(lab, [i for i in range(1, n + 1) if i not in tocan])
# la frase en mono de la lata original, como alfa
mono_box = (330, 388, 805, 1872)
bg_mono = relleno[mono_box[2] - Y0:mono_box[3] - Y0, mono_box[0] - X0:mono_box[1] - X0]
reg = rgb[mono_box[2]:mono_box[3], mono_box[0]:mono_box[1]]
cm = crema(np.arange(mono_box[0], mono_box[1]))[None]
alfa_mono = np.clip(((reg - bg_mono) / (cm - bg_mono)).mean(2), 0, 1)
alfa_mono[alfa_mono < 0.12] = 0
ys, xs = np.nonzero(alfa_mono > 0.3)
alfa_mono = alfa_mono[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
mono_y = mono_box[2] + ys.min()

for clave, c in LATAS.items():
    if len(sys.argv) > 1 and clave not in sys.argv[1:]: continue
    # tamaños
    m = render([{'id': 'n200', 'html': c['nombre'], 'css': 'font-family:Anton;font-size:200px'}])['n200']
    tam = min(200 * LARGO / m.shape[0], 200 * CAP_MAX / m.shape[1])
    s = render([{'id': 's100', 'html': c['sabor'], 'css': "font-family:'Instrument Serif';font-style:italic;font-size:100px;letter-spacing:.12em"}])['s100']
    tam_s = min(100, 100 * (ABAJO - SABOR_DESDE) / s.shape[0])
    A = render([
        {'id': 'nombre', 'html': c['nombre'], 'css': f'font-family:Anton;font-size:{tam:.1f}px'},
        {'id': 'sabor', 'html': c['sabor'], 'css': f"font-family:'Instrument Serif';font-style:italic;font-size:{tam_s:.1f}px;letter-spacing:.12em"},
        {'id': 'icono', 'giro': False, 'html': f'<svg width="175" height="175" viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">{ICONOS[c["icono"]]}</svg>'},
    ])
    an, ss, ic = A['nombre'], A['sabor'], A['icono']
    ancho = alfa_mono.shape[1] + 47 + an.shape[1] + 41 + ss.shape[1]
    x_mono = int(round(CENTRO - ancho / 2))
    x_nom = x_mono + alfa_mono.shape[1] + 47
    x_sab = x_nom + an.shape[1] + 41
    x_ico = x_nom + an.shape[1] + 18
    print(clave, 'tamaño', round(tam), 'alto', an.shape[1], 'sabor', round(tam_s), 'x', x_mono, x_nom, x_sab)

    img = orig.copy()
    img[Y0:Y1, X0:X1, :3] = relleno
    pegar(img, alfa_mono, x_mono, mono_y)
    pegar(img, an, x_nom, int(round(CENTRO_Y - an.shape[0] / 2)))
    centro_s = (SABOR_DESDE + ABAJO) / 2 + 5
    pegar(img, ss, x_sab, int(centro_s - ss.shape[0] / 2))
    pegar(img, ic, x_ico, int(850 - ic.shape[0] / 2))
    # las gotas, encima del texto (están por fuera de la lata)
    sub = img[Y0:Y1, X0:X1, :3]
    sub[gotas] = np.clip(sub[gotas] + dif[gotas], 0, 255)

    # 4 · color del líquido
    k = np.log(np.array(c['centro']) / 255) / np.log(REF / 255)
    nuevo = 255 * (np.clip(img[..., :3], 1, 255) / 255) ** k
    peso = np.clip((np.arange(img.shape[0]) - 322) / 10, 0, 1)[:, None, None] * np.ones((1, img.shape[1], 1))
    # barras del logo (dorada y celeste): no cambian
    lx0, lx1, ly0, ly1 = 440, 540, 360, 480
    zona = img[ly0:ly1, lx0:lx1, :3]
    barra = ((zona[..., 2] > zona[..., 0] + 30) | ((zona[..., 0] > 150) & (zona[..., 1] > 110) & (zona[..., 0] - zona[..., 2] > 60)))
    barra = dilatar(barra, 2)
    peso[ly0:ly1, lx0:lx1][barra] = 0
    img[..., :3] = img[..., :3] * (1 - peso) + nuevo * peso
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA')
    out.save(AQUI + f'lata-{clave}.png')
    print('listo', clave)
