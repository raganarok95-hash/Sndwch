#!/usr/bin/env python3
"""Actualiza el índice de búsqueda del repo (knowledge-rag) — `npm run indice`.

Incremental: compara fecha y tamaño de cada archivo contra lo ya indexado y solo procesa lo nuevo
o cambiado. El índice vive en .knowledge-rag/data (ignorado por git). Ver docs/ENTORNO.md: el
proxy bloquea HuggingFace, así que corre con HF_HUB_OFFLINE=1 y el modelo ya bajado.

EN TANDAS (2026-09-25). Todo el repo de una vez muere por memoria en el contenedor (`Killed`,
137): cada carpeta de TANDAS se indexa por separado y los embeddings se calculan de a LOTE
fragmentos, no de a 500. Una tanda que muere no se lleva a las demás, y al volver a correr solo
se procesa lo que quedó pendiente. `--tanda docs` corre una sola.

La poda de archivos borrados (lo que ya no existe en el repo) solo se hace en la corrida
completa sin --tanda: podar con la lista de UNA carpeta borraría del índice todas las demás.

⚠ Nunca correr `knowledge-rag` a secas: sin KNOWLEDGE_RAG_DIR arranca con la configuración por
defecto, crea data/ y documents/ en la raíz del repo y se queda vigilando cambios.
"""
import json, os, resource, sys, time
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("KNOWLEDGE_RAG_DIR", os.path.join(RAIZ, ".knowledge-rag"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
from pathlib import Path  # noqa: E402
from mcp_server import server  # noqa: E402
from mcp_server.config import config  # noqa: E402

TANDAS = ["docs", "src", "supabase/functions", "tests", "tests-api", "tests-e2e", "scripts", "modelo", "supabase/migrations"]
LOTE = 32


def arg(nombre):
    return sys.argv[sys.argv.index(nombre) + 1] if nombre in sys.argv else None


config.batch_size = int(arg("--lote") or LOTE)
forzar = "--forzar" in sys.argv
orq = server.get_orchestrator()
leer_todo = orq.parser.parse_directory
podar = orq._prune_orphan_documents


def indexar(carpeta):
    t = time.time()
    if carpeta:
        orq.parser.parse_directory = lambda directory=None: leer_todo(Path(RAIZ) / carpeta)
        orq._prune_orphan_documents = lambda documents, stats: None
    else:
        orq.parser.parse_directory = leer_todo
        orq._prune_orphan_documents = podar
    res = orq.index_all(force=forzar)
    res["tanda"] = carpeta or "(el resto del repo, con poda)"
    res["segundos"] = round(time.time() - t)
    res["memoria_max_mb"] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss // 1024
    print(json.dumps({k: res[k] for k in ("tanda", "total_files", "indexed", "updated", "skipped", "deleted", "errors", "segundos", "memoria_max_mb") if k in res}, ensure_ascii=False), flush=True)


sola = arg("--tanda")
if sola:
    indexar(sola)
else:
    for c in TANDAS:
        indexar(c)
    # Lo que no cae en ninguna carpeta (raíz, docs sueltos) y la poda de lo borrado. A esta
    # altura casi todo ya está al día, así que esta pasada solo procesa lo que falta.
    indexar(None)
