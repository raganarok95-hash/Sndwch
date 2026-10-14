Retirado el 2026-10-14. El Estudio ya no usa a Claude con el MCP de Flow para generar: ese MCP
solo conocía `labs.google` y Flow se mudó a `flow.google.com`. Ahora genera
`scripts/estudio/flow.ps1` con gflow-cli, sin agente (dueño: «Autorizo usar gflow-cli con mi
cuenta de Google Flow y que el Estudio lo corra solo en mi laptop»). Las reglas que vivían aquí
(un encargo pendiente = sin `hecho/<id>/estado.json`; `v1.<ext>`, `v2.<ext>`…; el estado.json;
nunca comprar créditos; el video no se genera solo) siguen en `flow.ps1` y en
`docs/marketing/estudio/README.md`.
