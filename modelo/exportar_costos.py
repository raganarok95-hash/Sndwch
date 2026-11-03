#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SND//WCH — exportar_costos: el costo de cada cosa de la carta, del modelo al servidor.

POR QUÉ EXISTE (2026-11-02, frente de Finanzas). El costo real de un sándwich vive en Python
(`modelo/insumos.py` → `rentabilidad_por_parte.py`), pero los cierres que le llegan al dueño
salen de las edge functions, que hasta hoy estimaban el costo como un 45% plano del precio
(`orderMargin`). Con un 45% plano la alerta de «pasó el techo» no puede sonar nunca: todo
cuesta exactamente el techo. Este archivo copia el costo de CADA producto, por tamaño, a
`supabase/functions/_shared/costos.ts`, que es lo que usa `_shared/finanzas.ts`.

No se reparte ni se inventa nada acá: se llama a `costo_sig()`, `costo_byo()` y
`costo_bebida()` del modelo, que ya pasan por `por_sandwich()` (check:costos).

Uso:
  python3 modelo/exportar_costos.py           # regenera _shared/costos.ts
  python3 modelo/exportar_costos.py --check   # falla si quedó viejo (lo corre check:costos)
"""
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import rentabilidad_por_parte as R  # noqa: E402

DESTINO = os.path.join(AQUI, "..", "supabase", "functions", "_shared", "costos.ts")
TAM = ("15", "30")
r2 = lambda x: round(float(x), 2)  # noqa: E731

# Todos los Signatures de la carta, incluido el secreto (R.SIG lo deja fuera porque cambia
# cada mes; pero si se vende, hay que poder costearlo).
SIG_TODOS = {s["id"]: (s["nombre"], s["pan"], s["prot"], list(s["vegetales"]), len(s["salsas"]), s.get("queso"), s["p15"], s["p30"])
             for s in R._CARTA["signatures"]}
PANES = [p["id"] for p in R._CARTA["panes"]]


def construir() -> dict:
    sig = {}
    for sid, fila in SIG_TODOS.items():
        prot = fila[2]
        if prot not in {**R.PROT_RETIRADA, **R.PROT}:
            continue
        sig[sid] = {
            "prot": prot,
            "costo": {t: r2(R.costo_sig(sid, i, SIG_TODOS)) for i, t in enumerate(TAM)},
            # Doble proteína = otra porción de la misma proteína.
            "doble": {t: r2({**R.PROT_RETIRADA, **R.PROT}[prot][i]) for i, t in enumerate(TAM)},
        }
    byo = {}
    for p in R.PROT:
        byo[p] = {
            "costo": {pan: {t: r2(R.costo_byo(p, i, pan)) for i, t in enumerate(TAM)} for pan in PANES if pan in R.PAN},
            "doble": {t: r2(R.PROT[p][i]) for i, t in enumerate(TAM)},
        }
    return {
        "techo": R.TECHO,
        "excepciones": {f"{c}|{t}": v for (c, t), v in R.TECHO_EXCEPCIONES.items()},
        "salsaExtra": {t: r2(R.SALSA[i]) for i, t in enumerate(TAM)},
        "sig": sig,
        "byo": byo,
        "bebida": {c: r2(R.costo_bebida(c)) for c in R.BEBIDA_INSUMO},
        "envaseBebida": R.ENVASE_BEBIDA,
        "empaquePorSandwich": R.EMPAQUE,
        "fuera": sorted(R.FUERA_DEL_ARMADOR),
    }


def texto() -> str:
    import json
    cuerpo = json.dumps(construir(), ensure_ascii=False, indent=1, sort_keys=True)
    return (
        "// GENERADO por `python3 modelo/exportar_costos.py`. NO se edita a mano: se regenera.\n"
        "// Costo de insumos + empaque de cada producto, en soles, del modelo (modelo/insumos.py →\n"
        "// rentabilidad_por_parte.py). Lo usa _shared/finanzas.ts. check:costos falla si quedó viejo.\n"
        f"export const COSTOS = {cuerpo} as const;\n"
    )


if __name__ == "__main__":
    nuevo = texto()
    if "--check" in sys.argv:
        viejo = open(DESTINO, encoding="utf-8").read() if os.path.exists(DESTINO) else ""
        if viejo != nuevo:
            print("✗ _shared/costos.ts quedó viejo: corre `python3 modelo/exportar_costos.py`")
            sys.exit(1)
        print("✓ _shared/costos.ts al día con el modelo")
    else:
        open(DESTINO, "w", encoding="utf-8").write(nuevo)
        print(f"✓ escrito {os.path.relpath(DESTINO)}")
