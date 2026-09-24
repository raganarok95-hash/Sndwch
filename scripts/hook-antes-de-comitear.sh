#!/usr/bin/env bash
# SND//WCH — hook de Claude Code: verificar ANTES DE COMITEAR, y solo entonces (2026-09-24).
#
# Claude Code le pasa por stdin el JSON del comando que va a correr. Este script mira ese
# comando y corre `npm run verify:rapido` solo si es un `git commit`.
#
# Por qué existe: el filtro `"if": "Bash(git commit *)"` de .claude/settings.json no se estaba
# respetando, y la verificación completa (~16 s) corría antes de CADA comando Bash —un `ls`, un
# `diff`—. A mitad de un cambio, con algo todavía rojo, bloqueaba hasta el comando que servía
# para ver qué estaba rojo. Decidir acá, mirando el comando real, no depende de ese filtro.
set -u
entrada="$(cat)"
comando="$(printf '%s' "$entrada" | node -e '
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  try { process.stdout.write(String(JSON.parse(s).tool_input?.command ?? "")); } catch { /* sin comando */ }
});
')"

case "$comando" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

cd /home/user/Sndwch || exit 0
export PATH="/opt/node22/bin:$PATH"
if ! npm run verify:rapido; then
  echo 'npm run verify:rapido falló — commit bloqueado. Revisa la salida arriba antes de reintentar.' >&2
  exit 2
fi
