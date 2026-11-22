# Mensajes para oficinas cercanas, listos para copiar (2026-11-22)

Para el frente 2 del `PLAN_INTEGRAL_2026-11-22.md`. La lista sale de `OFICINAS_CERCANAS.md`. Tú
decides si los mandas y a cuáles: el pedido en grupo es el pedido de cualquier cliente, no una
venta a empresas (dueño, 2026-08-27, `FUNCIONALIDADES.md`), así que esto es solo un aviso, no salir
a conseguir cuentas. Se mandan de noche, a recepción o a administración (WhatsApp o el teléfono
público), una sola vez.

Lo que promete sale del código: desde **5 sándwiches** en un mismo pedido en grupo, el 15CM más
barato va gratis (`organizadorDesde` en `_shared/dinero.ts`). Si ese número cambia, cambia el
mensaje.

## El mensaje

> Hola, buenas noches. Soy Ezra, de SND//WCH: sándwiches con pan de masa madre, a domicilio, a
> pocas cuadras de ustedes. Si en la oficina piden almuerzo juntos, cada uno puede agregar el suyo
> desde este enlace, sin crear cuenta, y se paga todo en un solo pedido. Desde 5 sándwiches, el
> más barato va de regalo:
> sndwch.app/?grupo=1&src=oficina-ENLACE
> Gracias, y buen provecho.

## El enlace de cada una (para saber cuál pidió)

| # | lugar | enlace |
|---|---|---|
| 1 | Sedalib | `sndwch.app/?grupo=1&src=oficina-sedalib` |
| 2 | Clínica Sánchez Ferrer | `sndwch.app/?grupo=1&src=oficina-sanchezferrer` |
| 3 | Interbank | `sndwch.app/?grupo=1&src=oficina-interbank` |
| 4 | BBVA | `sndwch.app/?grupo=1&src=oficina-bbva` |
| 5 | TV Cosmos | `sndwch.app/?grupo=1&src=oficina-cosmos` |
| 6 | Adecco | `sndwch.app/?grupo=1&src=oficina-adecco` |
| 7 | La Positiva | `sndwch.app/?grupo=1&src=oficina-lapositiva` |
| 8 | MGA Auditores | `sndwch.app/?grupo=1&src=oficina-mga` |
| 9 | RENIEC Buenos Aires | `sndwch.app/?grupo=1&src=oficina-reniec` |
| 10 | Tecsup | `sndwch.app/?grupo=1&src=oficina-tecsup` |

## Para tus contactos de WhatsApp (tu estado o mensaje personal)

> Ya abrimos SND//WCH 🥪 Sándwiches con pan de masa madre a domicilio en Trujillo. Si pides por
> primera vez desde aquí, la bebida va gratis: sndwch.app/?src=wa-ezra&codigo=DIRECTO

(La bebida gratis del primer pedido es el código `DIRECTO`, activo en la base; `?codigo=` hace que el checkout lo ofrezca ya escrito, `01-catalogo-y-estado.ts`; ver
`PAUTA_BARATA.md`.)
