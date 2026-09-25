#!/usr/bin/env python3
"""Actualiza el índice de búsqueda del repo (knowledge-rag) — `npm run indice`.

Incremental: compara fecha y tamaño de cada archivo contra lo ya indexado y solo procesa lo nuevo
o cambiado. El índice vive en .knowledge-rag/data (ignorado por git). Ver docs/ENTORNO.md: el
proxy bloquea HuggingFace, así que corre con HF_HUB_OFFLINE=1 y el modelo ya bajado.

⚠ Nunca correr `knowledge-rag` a secas: sin KNOWLEDGE_RAG_DIR arranca con la configuración por
defecto, crea data/ y documents/ en la raíz del repo y se queda vigilando cambios.
"""
import json, os, sys, time
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("KNOWLEDGE_RAG_DIR", os.path.join(RAIZ, ".knowledge-rag"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
from mcp_server import server  # noqa: E402

t = time.time()
orq = server.get_orchestrator()
res = orq.index_all(force="--forzar" in sys.argv)
res["segundos"] = round(time.time() - t)
print(json.dumps(res, ensure_ascii=False, indent=1))
