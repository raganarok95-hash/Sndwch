#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check:costos — que ningún número de dinero entre al modelo sin unidad, sin origen y sin
estado, y que un costo por PEDIDO no se pueda sumar por SÁNDWICH.

POR QUÉ EXISTE. El empaque se costeó al doble durante dos meses. No fue descuido de nadie:
era un float con un comentario, y **todos los chequeos del repo comparan dos copias de un
número**. `parity` compara cliente contra servidor. `check:precios` compara lo mostrado
contra lo cobrado. `test:api` compara el cálculo contra lo esperado. Un número que está solo,
y mal, coincide consigo mismo y pasa los doce chequeos.

Este mira otra cosa: no si dos copias coinciden, sino si **un número puede justificarse**.

Cada chequeo se verificó inyectándole el defecto que caza — con `--probar` los rompe a
propósito uno por uno y falla si alguno no se da cuenta.
"""
import os
import re
import sys
import datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "modelo"))
import insumos as I  # noqa: E402

HOY = datetime.date.today()
fallos, avisos = [], []


def falla(q, d):
    fallos.append((q, d))


# ── 1 · Toda ficha declara sus cinco campos, con valores válidos ──────────────────────
def c1_fichas():
    unidades = {I.SANDWICH, I.PEDIDO, I.KG, I.PORCION}
    estados = {I.COTIZADO, I.ESTIMADO, I.SIN_COTIZAR}
    for nombre, ins in I.TODAS.items():
        if ins.unidad not in unidades:
            falla(nombre, f"unidad {ins.unidad!r} no es una de {sorted(unidades)}")
        if ins.estado not in estados:
            falla(nombre, f"estado {ins.estado!r} no es uno de {sorted(estados)}")
        if not (ins.fuente or "").strip():
            falla(nombre, "no dice de dónde salió el número (campo `fuente` vacío)")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", ins.fecha or ""):
            falla(nombre, f"fecha {ins.fecha!r} no es AAAA-MM-DD — sin fecha no se sabe si "
                          f"el precio sigue vigente")
        if ins.unidad == I.PORCION and not isinstance(ins.valor, tuple):
            falla(nombre, "unidad PORCION exige un par (15CM, 30CM), no un número suelto")


# ── 2 · La trampa del empaque tiene que seguir siendo una excepción, no un silencio ───
def c2_guarda_de_unidad():
    try:
        I.por_sandwich(I.BOLSA_KRAFT)
    except ValueError:
        return
    falla("por_sandwich", "dejó sumar un costo POR PEDIDO sin decir cuántos sándwiches "
                          "trae el pedido. Ese es EL defecto del empaque: si esto no "
                          "revienta, el chequeo entero no sirve")


# ── 3 · El costo de cada porción se tiene que poder reproducir ────────────────────────
# Cuando no reconcilia, va acá con su motivo. La lista es la deuda, no la excusa: lo que
# importa es que no CREZCA sin que alguien lo decida.
SIN_RECONCILIAR = {
    "P02": "el rendimiento documentado del pollo (0.64-0.69) da S/2.17 y el modelo usa "
           "S/2.47. Sobrecostea S/0.30 — conservador, pero sin explicación escrita",
    "P03": "igual que P02: mismo insumo, mismo rendimiento, misma diferencia",
    "P05": "nunca se documentó un rendimiento. Es fiambre, así que debería ser 1.00 "
           "(S/4.08) y el modelo usa S/4.29",
    "P06": "nunca se documentó un rendimiento NI se cotizó la carne molida, y es la "
           "proteína del producto más rentable del menú",
}


def c3_porciones():
    for code, (en_uso, _) in ((c, (v[0], v[1])) for c, v in I.PORCION_EN_USO.items()):
        der = I.porcion_derivada(code)
        reconcilia = der is not None and abs(der[0] - en_uso) < 0.02
        if reconcilia and code in SIN_RECONCILIAR:
            falla(code, "ya reconcilia y sigue en SIN_RECONCILIAR — sácalo de la lista, "
                        "una deuda saldada que queda anotada hace que nadie lea la lista")
        if not reconcilia and code not in SIN_RECONCILIAR:
            falla(code, f"el costo de la porción (S/{en_uso:.2f}) NO sale de precio/kg x "
                        f"gramaje / rendimiento. Documenta el rendimiento o anótalo en "
                        f"SIN_RECONCILIAR con su motivo")


# ── 4 · Lo que el modelo cree que se cobra tiene que ser lo que el servidor cobra ─────
def c4_contra_el_servidor():
    # Desde el 2026-09-24 el servidor cobra con `_shared/carta.ts`, y `modelo/carta.json` es su
    # exportación (`check:carta` la mantiene al día). Antes esto leía PROT_PRICE de catalog.ts
    # con una regex que quedaba ciega cada vez que cambiaba el formato.
    import json
    carta = json.load(open(os.path.join(RAIZ, "modelo/carta.json"), encoding="utf-8"))
    servidor = {p["id"]: (p["p15"], p["p30"], p["dbl15"], p["dbl30"]) for p in carta.get("proteinas", [])}
    if not servidor:
        falla("carta.json", "no trae proteínas — este chequeo estaría pasando sin comparar nada")
        return
    import rentabilidad_por_parte as R
    for code, precios in R.BYO.items():
        if code not in servidor:
            falla(code, "el modelo lo tasa y la carta no lo tiene")
        elif tuple(round(x, 2) for x in precios) != tuple(round(x, 2) for x in servidor[code]):
            falla(code, f"el modelo cree que se cobra {precios} y la carta cobra {servidor[code]}")
    for code in servidor:
        if code not in R.BYO:
            avisos.append((code, "la carta lo cobra y el modelo de costos lo ignora"))
        if code not in R.PROT:
            falla(code, "la carta lo vende y el modelo no sabe cuánto cuesta (falta en PROT)")


# ── 5 · Lo que falta cotizar se dice en voz alta, no se olvida ────────────────────────
VEJEZ_DIAS = 120


def c5_deuda():
    for nombre, ins in sorted(I.TODAS.items()):
        if ins.estado == I.SIN_COTIZAR:
            avisos.append((nombre, f"SIN COTIZAR — {ins.fuente[:70]}"))
        elif ins.estado == I.ESTIMADO:
            dias = (HOY - datetime.date.fromisoformat(ins.fecha)).days
            if dias > VEJEZ_DIAS:
                avisos.append((nombre, f"estimado de hace {dias} días, nunca confirmado"))


CHEQUEOS = [("fichas completas", c1_fichas), ("guarda de unidad", c2_guarda_de_unidad),
            ("porciones reproducibles", c3_porciones),
            ("modelo vs. servidor", c4_contra_el_servidor), ("deuda de cotización", c5_deuda)]


def correr():
    del fallos[:], avisos[:]
    for _, fn in CHEQUEOS:
        fn()
    return list(fallos), list(avisos)


# ── El chequeo del chequeo ────────────────────────────────────────────────────────────
# Un chequeo que nunca vio el defecto que dice cazar no es un chequeo, es una decoración
# que da confianza falsa justo donde no la hay. Con `--probar` se le rompe cada cosa a
# propósito y tiene que señalarla; si alguna pasa, esto falla.
def probar():
    import copy
    casos = []

    def caso(nombre, romper, esperado):
        casos.append((nombre, romper, esperado))

    # El insumo sobre el que se inyectan los defectos sale del propio modelo, no se escribe: uno
    # que el servidor cobra y cuya porción reconcilia. Con un código fijo, retirar ese producto
    # de la carta rompía el --probar sin que nada del chequeo hubiera cambiado (pasó con P01).
    R0 = __import__("rentabilidad_por_parte")
    X = next(c for c in R0.BYO if c in I.PORCION_EN_USO and c not in SIN_RECONCILIAR
             and I.porcion_derivada(c) is not None)

    caso("una ficha sin unidad válida",
         lambda: I.TODAS.__setitem__("PAPEL_MANTECA",
                 I.PAPEL_MANTECA._replace(unidad="cajita")), "PAPEL_MANTECA")
    caso("una ficha sin decir de dónde salió",
         lambda: I.TODAS.__setitem__("CEBOLLA_KG", I.CEBOLLA_KG._replace(fuente="  ")),
         "CEBOLLA_KG")
    caso("una ficha con la fecha inventada",
         lambda: I.TODAS.__setitem__("STICKER", I.STICKER._replace(fecha="ayer")), "STICKER")
    caso("la guarda de unidad desactivada (EL defecto del empaque)",
         lambda: setattr(I, "por_sandwich", lambda ins, sand_por_pedido=None, i=0: 0.0),
         "por_sandwich")
    caso("una porción que deja de reproducirse y nadie la anotó",
         lambda: I.PORCION_EN_USO.__setitem__(X, (9.99, 19.98)), X)
    caso("una deuda saldada que se quedó pegada en la lista",
         lambda: SIN_RECONCILIAR.__setitem__(X, "motivo que ya no aplica"), X)
    caso("el modelo tasando un precio que el servidor no cobra",
         lambda: __import__("rentabilidad_por_parte").BYO.__setitem__(X, (1, 2, 3, 4)),
         X)
    caso("una proteína de la carta sin costo en el modelo",
         lambda: __import__("rentabilidad_por_parte").PROT.pop(X), X)

    guardado = (dict(I.TODAS), dict(I.PORCION_EN_USO), dict(SIN_RECONCILIAR),
                I.por_sandwich, dict(__import__("rentabilidad_por_parte").BYO),
                dict(__import__("rentabilidad_por_parte").PROT))
    malos = []
    for nombre, romper, esperado in casos:
        I.TODAS.clear(); I.TODAS.update(copy.copy(guardado[0]))
        I.PORCION_EN_USO.clear(); I.PORCION_EN_USO.update(copy.copy(guardado[1]))
        SIN_RECONCILIAR.clear(); SIN_RECONCILIAR.update(copy.copy(guardado[2]))
        I.por_sandwich = guardado[3]
        R = __import__("rentabilidad_por_parte"); R.BYO.clear(); R.BYO.update(copy.copy(guardado[4]))
        R.PROT.clear(); R.PROT.update(copy.copy(guardado[5]))
        romper()
        f, _ = correr()
        visto = any(esperado == q for q, _ in f)
        print(f"  {'✓' if visto else '✗'} {nombre}")
        if not visto:
            malos.append(nombre)
    I.TODAS.clear(); I.TODAS.update(guardado[0])
    I.PORCION_EN_USO.clear(); I.PORCION_EN_USO.update(guardado[1])
    SIN_RECONCILIAR.clear(); SIN_RECONCILIAR.update(guardado[2])
    I.por_sandwich = guardado[3]
    R = __import__("rentabilidad_por_parte"); R.BYO.clear(); R.BYO.update(guardado[4])
    R.PROT.clear(); R.PROT.update(guardado[5])
    return malos


if __name__ == "__main__" and "--probar" in sys.argv:
    print("\n  Rompiendo el modelo a propósito, una cosa por vez:\n")
    malos = probar()
    if malos:
        print(f"\n  ✗ {len(malos)} defecto(s) pasaron sin que nadie los viera.\n")
        sys.exit(1)
    print("\n  OK — los ocho defectos fueron señalados.\n")
    sys.exit(0)

if __name__ == "__main__":
    f, a = correr()
    print("\n  check:costos — que ningún número de dinero entre sin unidad, origen ni estado\n")
    for nombre, det in a:
        print(f"  · {nombre}: {det}")
    if a:
        print()
    for nombre, det in f:
        print(f"  ✗ {nombre}: {det}")
    if f:
        print(f"\n  {len(f)} problema(s).\n")
        sys.exit(1)
    print(f"  OK — {len(I.TODAS)} fichas, las 5 comprobaciones pasan"
          f" ({len(a)} cosa(s) anotadas arriba, ninguna bloquea).\n")
