"""SND//WCH — texturas para la simulación 3D de la bolsa (scripts/piezas/simular-bolsa/): kraft
periódico, los sellos en tinta y el sticker partido en el precorte. Uso: texturas.py <repo> <salida>"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)

# ── Kraft: ruido periódico (FFT) estirado en vertical = fibra ─────────────────────────────
def kraft(n=1024, base=(194, 148, 104), seed=1):
    r = np.random.default_rng(seed)
    w = r.standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    # fibras: poca frecuencia en y (largas en vertical), más en x
    filt = 1.0 / (1e-4 + (fx * 1.0) ** 2 + (fy * 9.0) ** 2) ** 0.55
    f = np.real(np.fft.ifft2(np.fft.fft2(w) * filt))
    f = (f - f.mean()) / f.std()
    g = r.standard_normal((n, n))
    g = np.real(np.fft.ifft2(np.fft.fft2(g) / (1e-3 + fx ** 2 + fy ** 2) ** 0.9)); g = (g - g.mean()) / g.std()
    m = 1 + 0.035 * f + 0.03 * g
    a = np.clip(np.array(base)[None, None, :] * m[:, :, None], 0, 255).astype(np.uint8)
    return Image.fromarray(a, 'RGB')

kraft().save(f'{OUT}/kraft.png')
kraft(base=(186, 140, 97), seed=2).save(f'{OUT}/kraft-dorso.png')

# ── Sellos: negro sobre blanco → tinta verde casi negra con alfa y algo de falla ─────────
TINTA = (30, 43, 34)
for nombre in ['7-cabecera-156x32', '7-pie-156x111']:
    im = Image.open(f'{REPO}/docs/marketing/bolsa/sellos/{nombre}.png').convert('L')
    L = np.asarray(im).astype(np.float32) / 255.0
    a = 1.0 - L
    h, w = a.shape
    falla = rng.standard_normal((h // 6 + 1, w // 6 + 1))
    falla = np.asarray(Image.fromarray(((falla - falla.min()) / np.ptp(falla) * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)) / 255.0
    a = np.clip(a * (0.80 + 0.22 * falla), 0, 1) * 0.92
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = TINTA
    rgba[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(f'{OUT}/{nombre}.png')

# ── Sticker 7×7: se recorta al corte, esquinas de 4 mm, y se parte en el precorte ─────────
LADO, FRANJA, SANGRA = 70, 11, 3
st = Image.open(f'{REPO}/docs/marketing/stickers/5-cierre-qr-70x70.png').convert('RGBA')
k = st.size[0] / (LADO + 2 * SANGRA)
st = st.crop((round(SANGRA * k), round(SANGRA * k), round((SANGRA + LADO) * k), round((SANGRA + LADO) * k)))
n = st.size[0]
mask = Image.new('L', (n, n), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, n - 1, n - 1), radius=round(4 * k), fill=255)
st.putalpha(mask)
st.save(f'{OUT}/sticker.png')
corte = round(FRANJA * k)
arriba, abajo = st.crop((0, 0, n, corte)), st.crop((0, corte, n, n))
arriba.save(f'{OUT}/sticker-franja.png'); abajo.save(f'{OUT}/sticker-cuerpo.png')

# Rasgado: el micro-perforado deja dientitos; un poco de papel blanco asoma en el borde.
def rasgar(im, borde):  # borde: 'abajo' o 'arriba'
    im = im.copy(); w, h = im.size
    a = np.asarray(im.split()[-1]).copy()
    paso = max(2, round(1.0 * k))
    for x in range(w):
        d = int(abs(np.sin(x / paso * np.pi)) * 0.35 * k + rng.random() * 0.25 * k)
        if borde == 'abajo': a[h - d:, x] = 0
        else: a[:d, x] = 0
    im.putalpha(Image.fromarray(a))
    # filo blanco del papel
    rgb = np.asarray(im).copy()
    for x in range(w):
        col = rgb[:, x, 3]
        ys = np.where(col > 0)[0]
        if len(ys) == 0: continue
        y = ys.max() if borde == 'abajo' else ys.min()
        for dy in range(round(0.25 * k)):
            yy = y - dy if borde == 'abajo' else y + dy
            if 0 <= yy < h: rgb[yy, x, :3] = (236, 232, 222)
    return Image.fromarray(rgb, 'RGBA')

rasgar(arriba, 'abajo').save(f'{OUT}/sticker-franja-rota.png')
rasgar(abajo, 'arriba').save(f'{OUT}/sticker-cuerpo-roto.png')
print('px/mm del sticker:', round(k, 2))
