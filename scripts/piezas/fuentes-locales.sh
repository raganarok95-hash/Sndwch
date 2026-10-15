#!/usr/bin/env bash
# SND//WCH — piezas/fuentes-locales: las fuentes de la marca en archivos locales, para montar piezas
# en una sesión de la nube (docs/ENTORNO.md, «Fuentes de Google al renderizar maquetas»). Ahí el
# Chromium no carga fonts.googleapis.com (sale la letra de respaldo y historias.mjs se corta a
# propósito), pero curl sí llega. Baja el CSS con un user-agent de Chrome, baja cada .woff2 y deja
# un CSS que apunta a file://. Escribe la ruta del CSS: úsala como FUENTES_CSS.
#
#   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node scripts/piezas/historias.mjs …
set -euo pipefail
DIR="${1:-${TMPDIR:-/tmp}/sndwch-fuentes}"
mkdir -p "$DIR"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
# Las mismas familias y pesos que pide historias.mjs cuando no hay FUENTES_CSS.
URL='https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;800&family=IBM+Plex+Mono:wght@500;600&family=Instrument+Serif:ital@1&display=block'
css=$(curl -fsS --max-time 30 -A "$UA" "$URL")
n=0
while read -r remota; do
  n=$((n + 1))
  curl -fsS --max-time 30 -o "$DIR/f$n.woff2" "$remota"
  css=${css//"$remota"/"file://$DIR/f$n.woff2"}
done < <(grep -o 'https://fonts.gstatic.com/[^)]*\.woff2' <<<"$css" | sort -u)
[ "$n" -gt 0 ] || { echo "fuentes-locales: el CSS de Google no trajo ninguna fuente" >&2; exit 1; }
printf '%s\n' "$css" > "$DIR/local.css"
echo "$DIR/local.css"
