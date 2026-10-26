# Datos · semana del 19 de octubre de 2026

> Escrito el lunes 2026-10-26 desde `DATOS-base.json` (generado 2026-10-26 10:04 UTC, `prueba: true`).
> En esta corrida no hay acceso a la base ni a Meta: no se pudo cruzar nada más que este archivo.

| qué | número |
|---|---|
| pedidos | 0 |
| clientes nuevos / que vuelven | 0 / 0 |
| visitas con origen | 105, todas `directo` |
| visitas con `src=ig-hist` | 0 registradas |
| gasto de pauta | sin dato (los anuncios están en pausa) |

**Lectura.** Cero pedidos es lo esperado: la app está en «Aún no abrimos» desde que la apertura se
movió a noviembre (2026-10-21). Las 105 visitas llegan sin origen: o las historias no salieron
(las que nombraban el día o invitaban a pedir no pasan `historias.mjs --final`), o se entró por el
perfil sin `?src=`. **No se puede atribuir nada a ninguna historia.**

**Lo que se aprende.** Los momentos siguen siendo hipótesis: sin pedidos no hay hora que los
confirme. Mientras dure la preapertura, lo que se puede medir es la **visita con origen** (`ig-hist`)
y los seguidores nuevos, no pedidos.
