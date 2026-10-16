---
name: crecer-sin-pauta
description: Las palancas de crecimiento de SND//WCH que no son pauta (embajadores, referidos, pedido en grupo, pedido fijo, volver a quien dejó de pedir, cumpleaños, el QR de la bolsa) y cómo se miden. Úsala para proponer o revisar acciones de crecimiento y recompra de SND//WCH.
user-invocable: false
---

# Crecer sin pauta

La pauta trae al primero; esto hace que vuelva y que traiga a otro, que cuesta mucho menos
(referidos: Schmitt, Skiera y Van den Bulte, 2011, clientes más valiosos y que se quedan más).
**Todo esto ya existe en la app**: el trabajo es usarlo bien, no construir otra cosa.

| palanca | dónde está | qué se mide |
|---|---|---|
| **Embajadores** (pagados por resultado: por el 1.º y el 2.º pedido de cada invitado) | panel → Embajadores; las cifras en `REGLAS` de `_shared/dinero.ts` | invitados que piden; que vuelven; lo pagado |
| **Referidos** de clientes (ambos lados ganan) | la app; el premio se deriva con `loQueGanaElInvitado()` | pedidos con referido |
| **Pedido en grupo** (quien organiza se lleva un premio) | la app (`?grupo=1`); el mínimo es `organizadorDesde` | pedidos con `group_code` |
| **Pedido fijo** (se ofrece al terminar el 2.º pedido) | la app | pedidos con `recurring_id` |
| **Volver** (quien dejó de pedir) | `winback-campaign` | pedidos de los contactados |
| **Cumpleaños** | `birthday-bonus` | canjes |
| **El QR de la bolsa** (bebida gratis) | `docs/marketing/PAUTA_BARATA.md` | pedidos con su origen |

## Reglas
- Las cifras de cada premio se leen del código (`docs/hechos/REGLAS.md`); nunca se escriben.
- Un premio nuevo o un cambio de premio toca el margen: va al dueño con su costo
  (`docs/NEGOCIO.md`, antes de tocar recompensas).
- No se manda nada masivo (WhatsApp, correo) sin el sí del dueño; nada de listas compradas.
- El aviso para reclutar embajadores ya está en el panel; el especialista propone a quién y
  cuándo, el dueño lo manda.

## La entrega
Cada semana, en `docs/marketing/semanas/<lunes>/CRECER.md`: qué palanca trajo más pedidos (con el
número del Analista), la que no se está usando y una sola propuesta concreta para la semana.
