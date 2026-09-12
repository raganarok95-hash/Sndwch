#!/usr/bin/env python3
"""Revisa un PNG de personaje ANTES de que entre a img/.

Los tres defectos que llegaron a produccion no se ven mirando el archivo en un
visor con fondo blanco -- se ven al componerlo sobre los fondos REALES de la app,
que hoy son cuatro y no uno:

    verde  #1E3932  lado de SANDO      (:root)
    azul   #102430  lado de WICHO      (:root[data-lado="wicho"])
    crema  #F3EEE1  panel admin claro  (.admin-light)
    negro  #000000  panel admin oscuro (.admin-dark)

El halo del recorte es BLANCO, asi que sobre blanco es invisible. Ese es
exactamente el motivo por el que nadie lo vio: se estaba mirando sobre el unico
fondo donde no se nota.

Uso:  python3 scripts/check_personaje.py img/wicho_cuerpo.png [...]

Escribe una hoja de contacto <nombre>_check.jpg al lado de cada archivo y avisa
de lo que encuentra. Devuelve 1 si algo falla.
"""
import sys

import numpy as np
from PIL import Image

FONDOS = [("verde", (30, 57, 50)), ("azul", (16, 36, 48)),
          ("crema", (243, 238, 225)), ("negro", (0, 0, 0))]

LADO_MINIMO = 2048   # la tarjeta pide 1050 px reales y el reel 1080
FRANJA = 0.82        # donde vive la sombra de piso; la cara nunca esta ahi
PLANO = 0.030        # desviacion del brillo por debajo de la cual es mancha


def caja(x, r):
    p = np.pad(x, r + 1, mode="edge")
    s = p.cumsum(0).cumsum(1)
    n = 2 * r + 1
    a = s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]
    return a[: x.shape[0], : x.shape[1]] / (n * n)


def revisar(ruta):
    im = Image.open(ruta).convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    fallas = []

    largo = max(im.size)
    if largo < LADO_MINIMO:
        fallas.append(f"resolucion {im.size[0]}x{im.size[1]}: el lado largo tiene {largo} px "
                      f"y hacen falta {LADO_MINIMO} (la tarjeta ocupa 1050 px reales, el reel 1080)")

    opaco = alpha >= 250
    if not opaco.any():
        fallas.append("no hay un solo pixel opaco: el alfa vino roto")
        return fallas, None

    # halo: pixeles de borde CLAROS pegados al vacio. Sobre fondo oscuro brillan.
    borde = (alpha > 0) & (alpha < 250)
    if borde.any():
        lum_borde = rgb[borde].max(1) / 255
        claros = int((lum_borde > 0.80).sum())
        if claros > borde.sum() * 0.25:
            fallas.append(f"halo de recorte: {claros} de {int(borde.sum())} pixeles de borde son "
                          f"claros. Se recorto contra fondo blanco y se va a ver sobre verde, "
                          f"azul y negro")

    # sombra de piso: mancha PLANA, palida y opaca en la franja de abajo
    lum = rgb.max(2) / 255
    mx, mn = rgb.max(2) / 255, rgb.min(2) / 255
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    desv = np.sqrt(np.maximum(caja(lum * lum, 5) - caja(lum, 5) ** 2, 0))
    banda = np.zeros_like(lum, bool)
    banda[int(lum.shape[0] * FRANJA):, :] = True
    mancha = (lum >= 0.68) & (sat <= 0.28) & (desv <= PLANO) & banda & (alpha > 200)
    if mancha.sum() > lum.size * 0.004:
        fallas.append(f"sombra de piso: {int(mancha.sum())} pixeles de mancha plana y palida "
                      f"abajo. NO se puede quitar despues -- la sombra y la suela de la "
                      f"zapatilla son el mismo color (medido). Hay que volver a pedir la imagen")

    # hoja de contacto sobre los cuatro fondos reales
    ancho = 420
    alto = int(im.height * ancho / im.width)
    chico = im.resize((ancho, alto), Image.LANCZOS)
    hoja = Image.new("RGB", (ancho * len(FONDOS), alto))
    for i, (_, c) in enumerate(FONDOS):
        capa = Image.new("RGBA", (ancho, alto), c + (255,))
        capa.alpha_composite(chico)
        hoja.paste(capa.convert("RGB"), (i * ancho, 0))
    salida = ruta.rsplit(".", 1)[0] + "_check.jpg"
    hoja.save(salida, quality=92)
    return fallas, salida


def main(rutas):
    malas = 0
    for r in rutas:
        fallas, hoja = revisar(r)
        print(f"\n{r}")
        if hoja:
            print(f"  hoja de contacto: {hoja}  (verde | azul | crema | negro)")
        if fallas:
            malas += 1
            for f in fallas:
                print(f"  FALLA: {f}")
        else:
            print("  sin fallas detectadas -- igual MIRA la hoja de contacto: "
                  "el ojo ve cosas que ninguna metrica")
    return 1 if malas else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1:]))
