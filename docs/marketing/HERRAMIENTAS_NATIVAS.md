# Salsas y herramientas propias de SND//WCH (2026-11-12)

Ezra, 2026-11-12: «Quiero ver por favor cuantas salsas tenemos actualmente… aparte de promocionar eso, ¿qué más
herramientas nativas de retención, marketing, etc tenemos en el app o en el negocio? Nombra todas».
Fuente: `_shared/carta.ts`, `docs/hechos/REGLAS.md` (generado del código) y `docs/FUNCIONALIDADES.md`.

## Las salsas (sin las del menú secreto): 6

| salsa | cómo es (carta) |
|---|---|
| Mayonesa americana | La clásica: cremosa y suave. Va con todo. |
| Mayonesa light | La misma mayonesa, en su versión ligera. |
| Ketchup americano | Tomate, dulce y ácido a la vez. |
| Honey Mustard | Miel y mostaza suave. Dulce que corta, no que empalaga. |
| Oil & Vinegar | Aceite de oliva y vinagre (va en el Turkey y el Italian Hoagie). |
| Chimichurri de piña y ají (picante) | Piña asada y ají. Dulce y ahumada de entrada, con picor al final. |

La salsa extra cuesta lo que diga `REGLAS.salsaExtra` (hoy S/2). El Philly, el Meatball, el Tuna Melt y el Classic
Tuna no llevan salsa de fábrica. Las 2 del menú secreto no se nombran.

## Retención (que vuelvan)

1. **Puntos**: 1 por sol de comida; se canjean por salsa extra, subir a 30CM, doble proteína, bebida o un 15CM.
2. **Bono de bienvenida** al crear cuenta.
3. **Reto del mes** (3 pedidos) y **reto de descubrimiento** (3 Signatures distintos): puntos extra.
4. **Rangos** por pedidos (NUEVO → MESA FUNDADORA): solo reconocimiento.
5. **Menú secreto**: se desbloquea a los 3 pedidos y rota cada mes.
6. **Avisos push automáticos**: segundo pedido, carrito y pago sin terminar, reto sin reclamar, hora pico sin
   pedir, quien nunca pidió (3 etapas), quien dejó de pedir, aniversario de cuenta, crédito sin usar,
   después de una cancelación, y el **resumen del mes** («pediste N veces, tu favorito fue X»).
7. **Cumpleaños** (`birthday-bonus`) y **volver a quien dejó de pedir** (`winback-campaign`).
8. **Favoritos y direcciones guardadas**: repetir el pedido en un toque.
9. **«Avísame cuando vuelva»** para un Signature agotado.
10. **Calificación después de la entrega** y **reportar un problema** (48 h).

## Crecimiento (que traigan gente)

11. **Referidos**: el invitado y quien invita ganan puntos, con escalera de premios (3, 5 y 10 referidos).
12. **Pedido grupal**: un enlace, cada uno agrega su sándwich sin cuenta; desde 5 sándwiches el 15CM más barato va
    gratis para quien organiza.
13. **QR de la tarjeta de la bolsa** (`?grupo=1`): abre un pedido grupal.
14. **QR distinto en cada lata** (`?src=lata-<sabor>`), cuando existan las latas.
15. **Embajadores pagados por resultado**: enlace propio, se les paga por el primer y el segundo pedido que traen.
16. **Regalar saldo** a otro cliente.

## Venta en el pedido

17. **Combo**: sándwich + bebida, −S/1.
18. **Subir a 30CM** y **doble proteína** desde el mismo plato.
19. **Pedido programado** para más tarde.

## Medición y pauta

20. **Enlaces con origen** (`?src=`): cada pieza, anuncio, QR y embajador mide sus pedidos.
21. **Píxel de Meta y API de conversiones**.
22. **La semana en números** (domingo) y el **informe de cohortes** (día 1 de cada mes).
23. **Instagram conectado**: publica feed, reels e historias programadas (con el sí de Ezra).

## Existen en el código pero la apertura no los ofrece

- **Plan semanal** (pagas S/95, recibes S/100 de saldo) y **tarjeta de regalo**.
- La bebida gratis de hora valle está retirada y no se nombra.
