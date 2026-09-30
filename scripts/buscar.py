#!/usr/bin/env python3
"""Busca en el índice del repo (knowledge-rag) — `npm run buscar -- "consulta" [n]`.

Existe para AHORRAR CRÉDITOS (2026-09-30): en vez de leer archivos enteros para encontrar un
dato, se le pregunta al índice y se leen solo los fragmentos que responden, con su archivo de
origen. Búsqueda híbrida (semántica + palabras). Varias consultas en una sola carga del modelo:
`npm run buscar -- "margen signature" "costo empaque" -- 4`.

Opciones (antes de las consultas):
  --cat hechos     solo esa categoría (hechos, sesiones, docs, maquetas, cliente, servidor, modelo, scripts)
  --exacto         prioriza las palabras exactas (códigos, nombres de función, constantes)
  --archivos       solo dice QUÉ archivos responden, sin fragmentos: lo más barato para ubicarse
Ver docs/COMO_USAR_EL_INDICE.md.

⚠ Nunca correr `knowledge-rag` a secas (ver scripts/indice.py).
"""
import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("KNOWLEDGE_RAG_DIR", os.path.join(RAIZ, ".knowledge-rag"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
import io, contextlib  # noqa: E402

args = sys.argv[1:]
n = 5
cat = None
alpha = 0.5
solo_archivos = False
if "--cat" in args:
    i = args.index("--cat"); cat = args[i + 1]; del args[i:i + 2]
if "--exacto" in args:
    args.remove("--exacto"); alpha = 0.0
if "--archivos" in args:
    args.remove("--archivos"); solo_archivos = True
if "--" in args:
    i = args.index("--")
    n = int(args[i + 1]) if i + 1 < len(args) else n
    args = args[:i]
if not args:
    print('Uso: npm run buscar -- "consulta" ["otra consulta"] [-- cantidad]')
    sys.exit(1)

# La librería imprime avisos (GPU, modelo) al cargar: se callan para no gastar la salida.
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    from mcp_server import server  # noqa: E402
    orq = server.get_orchestrator()

for q in args:
    print(f"\n### {q}")
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        res = orq.query(q, max_results=n, category_filter=cat, hybrid_alpha=alpha)
    vistos = set()
    for r in res:
        src = str(r.get("source") or r.get("metadata", {}).get("source", "")).replace(RAIZ + "/", "")
        if solo_archivos:
            if src not in vistos:
                vistos.add(src); print(f"- {src}")
            continue
        txt = " ".join(str(r.get("content", "")).split())
        print(f"- {src} · {round(float(r.get('score', 0)), 3)}\n  {txt[:600]}")
