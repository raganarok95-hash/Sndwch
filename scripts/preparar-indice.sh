#!/usr/bin/env bash
# Deja el índice de búsqueda listo en un contenedor NUEVO — `bash scripts/preparar-indice.sh`.
#
# Cada sesión en la nube arranca en un contenedor limpio: el índice (.knowledge-rag/data) y el
# modelo (.knowledge-rag/models_cache, 2 GB) están ignorados por git y NO vienen con el repo.
# Este script es idempotente: instala solo lo que falta, baja el modelo solo si no está, y
# reindexa de forma incremental. Cuesta máquina (descarga + ~20-30 min de CPU), no tokens: se
# lanza en segundo plano al empezar la sesión. Mientras corre, docs/sesiones/ y docs/hechos/ se
# leen igual: son archivos, no dependen del índice.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"

if ! python3 -c "import mcp_server" 2>/dev/null; then
  echo "· instalando knowledge-rag"
  # El PyYAML del sistema (Debian) no se deja desinstalar: por eso --ignore-installed.
  pip install -q --ignore-installed PyYAML knowledge-rag
fi

MODELOS=".knowledge-rag/models_cache"
if [ -z "$(ls -A "$MODELOS" 2>/dev/null)" ]; then
  echo "· bajando el modelo (HuggingFace está bloqueado; Google Cloud Storage no)"
  mkdir -p "$MODELOS"
  curl -sSfL https://storage.googleapis.com/qdrant-fastembed/fast-multilingual-e5-large.tar.gz | tar -xz -C "$MODELOS"
fi

echo "· indexando (incremental, por tandas)"
nice -n 10 python3 scripts/indice.py
