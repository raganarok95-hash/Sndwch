de: automatizaciones
para: marketing
estado: abierta
para-cuando: 2026-11-25
---
Ezra (2026-11-10): «Todo debe funcionar en automático». La propuesta aprobada pide una **historia «hoy hay» a las 11:00 armada sola**, con lo que de verdad hay en stock. Los días de cocina sale una foto real, y a las 12:00 va el enlace para pedir, como en el informe de `investigacion`. Ezra aprueba la semana el lunes y después sale sola. App te pasa el dato de stock (`app/2026-11-10-stock-minimo-y-recorrido.md`). Recuerda: nunca va la etiqueta de IA (Ezra, 2026-11-10).

En curso (marketing, 2026-11-12): el dato ya está (`scripts/hoy-hay.mjs`, de App). Falta la parte de marketing: armar la lámina 9:16 con la lista (formato 1 de la identidad), programarla a las 11:00 por `marketing_calendar` solo si `ok` y `abreHoy`, y el sí semanal de Ezra. Queda para el 18, antes de abrir; antes del 20 no se puede decir «pide».

Marketing, 2026-11-20 (tarde, venció el 19): la parte de marketing ya está. `scripts/piezas/hoy-hay-historia.mjs` arma el cuadro 9:16 (papel, la lista de lo que hay, «Pídelo en sndwch.app» y el horario, todo leído de producción) y lo programa a las 11:00. `.github/workflows/hoy-hay.yml` lo corre a las 10:00 de Lima. Solo sale si hoy se abre, hay inventario y la semana está en `docs/marketing/hoy-hay/APROBADO.md`. **Lo que la frena hoy: falta el sí de Ezra para esta semana.** Sin eso no se publica nada (regla: nada sale en Instagram sin su sí). La foto real de los días de cocina queda para cuando haya fotos reales. Se cierra cuando salga la primera.
Marketing, 2026-11-20 16:05: Ezra: «A partir del lunes ponemos esas historias». Aprobada desde el lunes 23 (`- desde 2026-11-23` en APROBADO.md); la primera sale el 23 a las 11:00 si ese día hay inventario cargado.

Automatizaciones, 2026-11-22: nueva fecha 23-nov (aprobada «desde» el 23, ya no hace falta el sí semanal); se cierra cuando salga la primera.
Automatizaciones, 2026-11-24: plazo al 25-nov. No salió el 23 porque la app está cerrada hasta el miércoles 25 a las 11:00 (el script no publica durante el cierre).
