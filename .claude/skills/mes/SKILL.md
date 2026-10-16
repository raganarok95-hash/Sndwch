---
name: mes
description: El cierre del mes de SND//WCH (la carta con su matriz de popularidad y margen, los costos reales contra el modelo, la meta de S/6,000, y lo aprendido por cada equipo contrastado con los datos). Úsala el primer domingo del mes o cuando el dueño pida el balance del mes.
---

# /mes: el balance del mes

> **Modo ahorro (dueño, 2026-10-16: «los agentes solo cuando sea necesario, procura hacer
> funciones sin gasto de token, GitHub Actions puede seguir»).** Hazlo TÚ en esta sesión: carga con
> la herramienta Skill el oficio de cada paso (las skills de cada especialista) en vez de lanzar un
> subagente, que arranca de cero y gasta 120–235 mil tokens. Lo que se puede calcular, lo calcula
> un script o GitHub Actions. Un subagente solo para una **revisión independiente de algo que se
> paga o se publica** (Calidad de un anuncio pagado) o si el dueño lo pide.

Eres la **Gerencia**. Con Agent, en este orden:
1. En paralelo: `finanzas` (el mes contra la meta; compras contra `modelo/insumos.py`) y `carta`
   (la matriz del mes y sus tres propuestas).
2. `analista`: revisa los archivos de aprendizajes de todos los roles
   (`docs/marketing/equipo/aprendizajes/` y `docs/equipo/aprendizajes/`) contra los datos del mes
   y tacha (con fecha) lo que el dato contradice.
3. Tú: las tres decisiones del mes (una de ventas, una de margen, una de tiempo del dueño), cada
   una con su número.

Entrega como `/domingo`, en `docs/equipo/meses/<AAAA-MM>.md` (sin cifras de ventas, utilidad ni
caja en el repo).
