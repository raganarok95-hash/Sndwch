# SND//WCH — los dos sellos de la bolsa (7-cabecera 156×32 y 7-pie 156×111, comprados el 2026-10-15) como UN sticker,
# porque no llegaron ni las kraft ni los sellos (dueño, 2026-11-11: «genera igual lo que íbamos a hacer con los
# sellos, como stickers»). Mismo arte, misma distancia entre los dos (1 cm), a una tinta verde casi negro #1E2B22.
# Sticker de 10 × 10 cm, esquinas de 4 mm, con 3 mm de sangrado. Uso: python3 scripts/piezas/sello-a-sticker.py <carpeta>
import sys
from PIL import Image, ImageDraw
OUT = sys.argv[1] if len(sys.argv) > 1 else 'docs/marketing/stickers-apertura'
S = 'docs/marketing/bolsa/sellos/'
DPI = 600; mm = lambda x: round(x * DPI / 25.4)
LADO, SANGRA, RADIO, MARGEN = 100, 3, 4, 5
TINTA, PAPEL = (0x1E, 0x2B, 0x22), (255, 255, 255)
cab = Image.open(S + '7-cabecera-156x32.png').convert('L'); pie = Image.open(S + '7-pie-156x111.png').convert('L')
k = cab.width / 156  # px por mm del arte original
arte = Image.new('L', (cab.width, cab.height + round(10 * k) + pie.height), 255)
arte.paste(cab, (0, 0)); arte.paste(pie, (0, cab.height + round(10 * k)))
util = LADO - 2 * MARGEN
esc = min(mm(util) / arte.width, mm(util) / arte.height)
arte = arte.resize((round(arte.width * esc), round(arte.height * esc)), Image.LANCZOS)
total = mm(LADO + 2 * SANGRA)
lienzo = Image.new('RGB', (total, total), PAPEL)
tinta = Image.new('RGB', arte.size, TINTA)
mascara = arte.point(lambda v: 255 - v)  # lo negro del sello es la tinta
lienzo.paste(tinta, ((total - arte.width) // 2, (total - arte.height) // 2), mascara)
lienzo.save(f'{OUT}/sticker-sello-10x10cm.pdf', resolution=DPI)
# vista: solo la medida de corte, con las esquinas redondeadas
corte = lienzo.crop((mm(SANGRA), mm(SANGRA), mm(SANGRA + LADO), mm(SANGRA + LADO)))
m = Image.new('L', corte.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, corte.width - 1, corte.height - 1), mm(RADIO), fill=255)
v = Image.new('RGBA', corte.size, (0, 0, 0, 0)); v.paste(corte, (0, 0), m); v.thumbnail((1400, 1400)); v.save(f'{OUT}/sticker-sello-10x10cm.png')
print('listo', OUT, 'arte', round(arte.width / DPI * 25.4, 1), '×', round(arte.height / DPI * 25.4, 1), 'mm')
