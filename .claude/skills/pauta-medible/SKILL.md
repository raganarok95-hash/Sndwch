---
name: pauta-medible
description: Cómo maneja SND//WCH la publicidad pagada (Meta y los anuncios dentro de Rappi) medida por pedidos, con reglas de corte fijas y sin prender ni gastar nada sin el sí del dueño. Úsala para armar, leer o proponer cambios a una campaña de SND//WCH.
user-invocable: false
---

# Pauta medible

## Lo que existe (léelo antes de tocar nada)
- Meta: cuenta `1488138326460689`, página «Snd//wch» `1188463894356831`, píxel y CAPI
  `1410494047274081`. Campaña, conjunto y anuncios con sus ids en `docs/marketing/PAUTA_BARATA.md`
  (la prueba de S/700, aprobada por el dueño; arranca el viernes 23-oct **solo si aprueba las
  piezas finales**).
- Rappi: anuncio dentro de la app desde que pasen bien los primeros pedidos, S/10 al día, en el mes
  sin comisión (`docs/PLAN_DESDE_HOY.md` §1). Se maneja desde el portal de aliados: lo hace el
  dueño, con lo que tú le dejes listo.

## Lo que NUNCA haces
- **Prender** (`ads_activate_entity`), **programar** o **subir el presupuesto** de nada. Todo se
  crea y se deja **en pausa**. Lo prende el dueño con un sí explícito a esas piezas.
- Crear un anuncio con una pieza que no pasó las tres puertas (arte y calidad aprobadas).
- Borrar un anuncio: se renombra «NO ACTIVAR · <motivo>» y queda en pausa.

## Cómo se arma un anuncio (en pausa)
- La imagen se sube por URL (`raw.githubusercontent.com/.../main/...`: Meta sí la baja).
- 4:5 en el feed y 9:16 en historias y reels en **un solo anuncio**: `ads_create_ad` con un
  creativo `asset_feed_spec` y `asset_customization_rules` por ubicación (`optimization_type:
  "PLACEMENT"`). La «personalización por ubicación» de `ads_create_creative` no está habilitada
  en esta cuenta.
- Enlace con su origen: `https://sndwch.app/?src=meta-<pieza>`; botón «Pedir ahora».
- Identidad: la página. Cuando el Instagram esté en el Business (P40), se agrega su id.

## Las reglas de corte (se leen cada lunes, con el DATOS.md del Analista)
| señal | qué se propone |
|---|---|
| menos de 0.7% de clics después de 2,000 impresiones | cambiar la pieza |
| 14 días sin un solo pedido con su `?src=` | cambiar la pieza |
| costo por cliente hasta el techo del primer pedido (panel; hoy S/12.56) | verde: subir 20% por semana |
| entre ese techo y el del cliente completo (panel; hoy S/22.70) | amarillo: no subir; a los 30 días, si vuelve menos de 4 de cada 10, pasa a rojo |
| por encima del techo del cliente completo | rojo: dos rondas de corrección de 7 días; si sigue, solo reconectar visitantes con tope S/5/día (`docs/marketing/PLAN_COSTO_POR_CLIENTE.md`) |
| Rappi: menos de S/20 por pedido | sigue |
| Rappi: S/20–35 por pedido | bajar a S/5 al día |
| Rappi: más de S/35 por pedido | apagar |

Con menos de 30 pedidos no hay ganadora: se dice «todavía no se sabe» y se deja correr.

## La entrega: `docs/marketing/semanas/<lunes>/PAUTA.md`
Gasto, impresiones, CTR, pedidos y costo por cliente de cada pieza; qué sigue, qué se cambia y por
qué (citando la regla); qué se propone probar; y en «Para el dueño», cada sí que hace falta.
