# La carta

> **Generado por `npm run hechos`** desde `supabase/functions/_shared/carta.ts` (la semilla). No se edita a mano: se regenera. Si algo de acá
> está mal, el error está en el código, no en esta ficha.

Todo en soles. 15CM y 30CM son los dos tamaños. «Doble» es lo que suma pedir doble proteína.

## Signatures (6 en la carta pública)

### Philly Cheesesteak ★ (la estrella: la que más deja por unidad)
- **Precio:** 15CM S/22.90 · 30CM S/32.90 · doble proteína +S/7 / +S/13.90
- **Receta:** pan Classic // White · Res // Laminada · vegetales: Cebolla // Salteada, Pimiento // Verde · salsas: — · queso: Cheddar
- **Cómo se vende:** Res laminada fina, salteada al momento con cebolla y pimiento, y cheddar fundido encima. Sin salsa: no le hace falta.

### Meatball Marinara
- **Precio:** 15CM S/21.90 · 30CM S/28.90 · doble proteína +S/6.90 / +S/13.90
- **Receta:** pan Classic // White · Albóndiga // Marinara · vegetales: Tomate // Fresco, Cebolla // Morada juliana · salsas: Oil & Vinegar // Classic · queso: Americano
- **Cómo se vende:** Para la noche en que ya decidiste que no vas a cocinar. Albóndigas hechas acá, cocidas dentro de su propia marinara, con queso americano derretido hasta el borde. Se come con las dos manos y con servilleta al lado.

### Turkey
- **Precio:** 15CM S/23.90 · 30CM S/34.90 · doble proteína +S/9 / +S/17
- **Receta:** pan Classic // White · Pavo // Horneado · vegetales: Lechuga // Fresca, Tomate // Fresco, Cebolla // Morada juliana, Pimiento // Verde · salsas: Oil & Vinegar // Classic · queso: no lleva
- **Cómo se vende:** Pavo horneado en lonjas finas, con lechuga, tomate, cebolla y pimiento, terminado con aceite y vinagre.

### Tuna Melt
- **Precio:** 15CM S/22.90 · 30CM S/36.90 · doble proteína +S/10.90 / +S/21.90
- **Receta:** pan Classic // White · Atún // House · vegetales: — · salsas: — · queso: Cheddar
- **Cómo se vende:** El Classic Tuna con cheddar fundido encima: atún en lascas gruesas, mayonesa y pimienta blanca, y el queso que lo junta todo.

### Italian Hoagie
- **Precio:** 15CM S/23.90 · 30CM S/33.90 · doble proteína +S/9.90 / +S/19.90
- **Receta:** pan Classic // White · Embutido // Italiano · vegetales: Lechuga // Fresca, Tomate // Fresco, Cebolla // Morada juliana, Pimiento // Verde · salsas: Oil & Vinegar // Classic · queso: Americano
- **Cómo se vende:** Embutidos italianos en pliegues, queso americano, lechuga, tomate, cebolla y pimiento, con oil & vinegar, como en los delis de siempre.

### Classic Tuna
- **Precio:** 15CM S/20.90 · 30CM S/34.90 · doble proteína +S/10.90 / +S/21.90
- **Receta:** pan Classic // White · Atún // House · vegetales: — · salsas: — · queso: no lleva
- **Cómo se vende:** Para comer en el escritorio con una mano, sin que se desarme entre bocado y bocado: no lleva nada suelto adentro. Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Nada más.

## Menú secreto (Reserve)
- Se desbloquea desde el pedido número **3** (el número real es editable desde el panel: `secret_signature.min_orders`).
- **Precio:** 15CM S/24.90 · 30CM S/30.90. No entra en «15CM gratis» ni en el sándwich del organizador.
- **Hacia afuera no se dice qué lleva.** Receta (solo interno): pan Focaccia // Artesanal · Pollo // Cajun · Jalapeño // Encurtido, Pimiento // Verde, Cebolla // Morada juliana · Spicy // Mayo, Picante // Miel.
- Lo que el cliente lee: «Solo para clientes iniciados. Una combinación que no está en ningún menú — te la ganaste a pedidos. No preguntes qué lleva. Pruébalo.»

## ARMA EL TUYO

El precio lo pone la proteína (más el recargo del pan, si tiene). Vegetales y queso no suman. Hasta
3 salsas; la salsa extra cuesta S/2.

**Panes:** Classic // White (sin recargo) · Focaccia // Artesanal (+S/0.50 en 15CM, +S/1 en 30CM)

| proteína | 15CM | 30CM | doble 15 | doble 30 | cómo es |
|---|---|---|---|---|---|
| Atún // House | S/23.90 | S/35.90 | +S/10.90 | +S/21.90 | En lascas gruesas, nunca hecho pasta. La mayonesa justa y pimienta blanca. |
| Albóndiga // Marinara | S/23.90 | S/35.90 | +S/6.90 | +S/13.90 | Albóndigas chicas hechas acá, cocidas dentro de su propia marinara. |
| Pavo // Horneado | S/24.90 | S/36.90 | +S/9 | +S/17 | Lonjas de un milímetro puestas en pliegues, laminadas el mismo día. |
| Res // Laminada | S/23.90 | S/35.90 | +S/7 | +S/13.90 | Laminada fina y salteada al momento. |

Proteínas que existen pero NO se eligen acá: Pollo // Cajun (solo menú secreto), Embutido // Italiano (solo dentro de su Signature).

**Vegetales:** Tomate // Fresco — En rodajas gruesas, cortado el mismo día. · Cebolla // Morada juliana — En pluma fina y cruda. Dulce al entrar, con filo al final. · Jalapeño // Encurtido — Picor limpio y corto, del que no tapa lo demás. · Pickles // Encurtidos — Pepinillo encurtido en rodajas: ácido y crocante. · Pepinillo // Fresco — En rodajas finas, frío. Agua y crujido. · Pimiento // Verde — Fresco, en tiras finas. Crujiente, con su punto amargo. · Lechuga // Fresca — En tiras y fría. Es lo que hace crujir los bordes.

**Quesos:** Americano — Se funde parejo y cubre todo, de borde a borde. · Cheddar — Curado y salado. No se pierde debajo de la carne.

**Salsas:** Aioli // Signature — Ajo y limón sobre base cremosa. Suave: va con todo. · Smoke // BBQ — Ahumada y espesa, con miel y pimentón. La más contundente. · Honey // Mustard — Miel y mostaza suave. Dulce que corta, no que empalaga. · SNDWCH // Special — Salada y umami, imposible de ubicar. No decimos qué lleva. · Oil & Vinegar // Classic — Aceite de oliva y vinagre. Lo que vuelve italiano a un sándwich. · Teriyaki // Glaze — Soja, jengibre y azúcar reducidos hasta que brillan. · Chimichurri // Piña y Ají (picante) — Piña asada y ají. Dulce y ahumada de entrada, con picor al final. · Peanut // Satay — Maní tostado con soya y jengibre. Espesa y tostada. · Mostaza // Dijon — Ácida y filosa. Sin una gota de dulce.

## Bebidas

Por cada par sándwich + bebida el pedido cuesta S/1 menos (el combo).

- **The Bloom // Hibiscus** — S/6 sola · en combo el par ahorra S/1. Flor de jamaica en infusión con un toque de canela, servida helada. Ácida, floral y sin una gota de jugo.
- **The Midnight // Brew** — S/5 sola · en combo el par ahorra S/1. Té negro reposado en frío toda la noche. Suave, sin amargor, con el punch justo de cafeína.
- **The Cool // Mint** — S/6 sola · en combo el par ahorra S/1. Hierba luisa y menta fresca en infusión helada. Ligera, aromática, el break perfecto entre bocado y bocado.

## Recompensas (se canjean con puntos)

| recompensa | puntos | qué perdona | tope |
|---|---|---|---|
| Salsa Extra | 20 | Perdona el cargo de la salsa extra | el monto entero |
| Doble Proteína | 160 | Doble proteína gratis | S/6 |
| Bebida Gratis | 160 | Bebida a elección | S/6 |
| Tamaño 30CM | 320 | Tu sándwich 15CM sube a 30CM gratis | S/8 |
| Sándwich Gratis | 400 | Sándwich 15CM gratis — no aplica al menú secreto | el monto entero |

## Comprobar contra la base (manda la base)

```sql
select code, category, values from catalog_prices order by category, code;
select distinct on (item_id) item_id, name, price_15, price_30, active from catalog_items order by item_id, created_at desc;
select price_15, price_30, min_orders from secret_signature order by created_at desc limit 1;
```
