"""SND//WCH — las referencias de los personajes para Flow (scripts/estudio/flow.ps1, 2026-10-14).

Cada hermano contra SU referencia (CLAUDE.md): SANDO = img/sando2_frente.png, WICHO =
img/wicho_rie.png. Flow aplana el alfa contra negro y ese negro sale como manchas
(docs/MANUAL_DETALLADO.md), así que van SIN transparencia: fondo blanco plano, al doble y con aire.

Uso: python3 scripts/estudio/referencias.py   (escribe docs/marketing/estudio/referencias/)
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
SALIDA = RAIZ / 'docs/marketing/estudio/referencias'
PERSONAJES = {'sando': 'img/sando2_frente.png', 'wicho': 'img/wicho_rie.png'}

SALIDA.mkdir(parents=True, exist_ok=True)
for nombre, fuente in PERSONAJES.items():
    im = Image.open(RAIZ / fuente).convert('RGBA')
    im = im.crop(im.getbbox())
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    lado = int(max(im.size) * 1.12)
    lienzo = Image.new('RGBA', (lado, lado), (255, 255, 255, 255))
    lienzo.alpha_composite(im, ((lado - im.width) // 2, (lado - im.height) // 2))
    lienzo.convert('RGB').save(SALIDA / f'{nombre}.png', optimize=True)
    print(nombre, lienzo.size)
