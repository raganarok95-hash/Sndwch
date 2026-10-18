# Cuánto podemos pagar por un cliente, cómo bajarlo y cómo hacer que Meta se pague (2026-10-18)

Dueño: «Ajústalo actualmente e investiga cómo reducir el precio por obtención de cliente. Segundo,
requiero una respuesta a si nos damos cuenta que el precio por cliente es más caro de lo que es
rentable: armemos el plan».

## 1 · Los dos techos (ajustados al precio del 16-oct)

El freno del panel compara lo que cuesta un cliente nuevo de Meta contra lo que deja. Desde hoy
calcula con la carta y el precio vigentes (`modelo/proyeccion.py`; antes usaba un modelo con la carta
vieja y aguantaba S/25 por cliente):

| techo | cuánto | qué significa |
|---|---|---|
| **Primer pedido** | **S/12.56** | lo que deja un pedido. Por debajo, el cliente se pagó solo el mismo día |
| **Cliente completo** | **S/22.70** | 2.41 pedidos por cliente (promedio del delivery) × S/12.56, recortado a 75% porque nuestra recompra todavía no está medida |

**Lo que esperamos de Meta**: con las tasas de agencia para Perú, un cliente cuesta entre S/10.51 y
S/25.23 (S/17.87 al costo medio); la simulación más conservadora da una mediana de S/35. O sea: lo
normal es quedar **entre los dos techos**: el cliente no se paga con el primer pedido y sí se paga
si vuelve. Por eso lo primero que se mide, después del costo, es **cuántos vuelven**.

## 2 · Cómo se baja el costo por cliente

El costo por cliente es `lo que cuesta mostrar el anuncio ÷ (cuántos tocan × cuántos de esos piden)`.
Cada palanca mueve una de las tres partes. En orden de lo que más mueve y menos cuesta:

| palanca | qué se hace | qué parte mueve | evidencia |
|---|---|---|---|
| **1. Más pedidos por visita (en la app)** | que quien llega desde el anuncio vea primero el sándwich del anuncio y su precio; pago en Yape sin cuenta; el premio del primer pedido a la vista | cuántos piden | es la parte que controlamos nosotros: pasar de 1.9% a 3% de compra baja el costo ~37% |
| **2. Muchas piezas distintas en un solo conjunto** | 6–10 anuncios realmente distintos (plato, momento, formato), no 3 conjuntos con 1 anuncio | cuánto cuesta mostrar | Meta (2025): el mismo gasto ordenado en 1 conjunto con más anuncios dio 16% menos costo y 17% más conversiones |
| **3. El plato con nombre, no la marca** | cada anuncio nombra un sándwich; carrusel con la carta | cuántos tocan | carruseles con platos y precio rinden más que la foto de marca (casos de agencia) |
| **4. Prueba social real** | reseñas y fotos de clientes desde la primera semana | cuántos tocan y piden | casos de restaurante: la foto real bajó el costo por pedido a la mitad frente a la foto de marca (agencia, no estudio) |
| **5. Solo donde y cuando se vende** | radio de la zona de reparto; 11:00–14:00 y 18:00–21:00; nunca lunes | cuánto cuesta mostrar | lo que se muestra fuera de zona o con la cocina cerrada es gasto puro |
| **6. Reconectar a quien ya visitó la app** | anuncio a los visitantes de sndwch.app de los últimos 14 días que no pidieron | todo | es el público más barato; el píxel y el CAPI ya están funcionando |
| **7. Optimizar por compra real** | el anuncio optimiza por «Compra» (CAPI), no por clics | cuántos piden | los clics baratos que no compran engañan al algoritmo |
| **8. Que cada cliente deje más** | bebida en combo, 30CM, pedido fijo, QR de la bolsa, referidos | sube el techo en vez de bajar el costo | el techo del cliente completo crece con cada pedido que vuelve |

**Canales que cuestan menos que Meta**, para no depender de él:

- **Referidos**: el cliente nuevo cuesta lo que cuesta el premio, S/7.65 (sándwich y bebida a costo). En restaurantes, un referido sale ~60% más barato que un cliente por anuncio y vuelve más.
- **Pedido en grupo**: un pedido de oficina trae 5 o más clientes nuevos de una vez; el costo de captarlos se reparte.
- **Rappi**: el primer mes no cobra comisión; su anuncio interno tiene su propia regla de corte (S/20 por pedido).
- **Orgánico**: el video del día, Google Maps y el QR de la bolsa. Cuestan tiempo, no plata.
- **Anuncios a WhatsApp**: en Perú una conversación desde un anuncio cuesta centavos (S/0.15–0.30, agencias). Vale una prueba chica si el cliente pide más fácil escribiendo que entrando a la app; se mide igual, por pedido.

## 3 · Meta como motor desde cero (dueño, 2026-10-18: «Meta sí debería usarse para obtener más clientes. Piensa que empezaremos de cero literalmente»)

**La idea**: un cliente de Meta no se paga con su primer pedido; se paga con los que vienen
después. Meta es una **inversión que se recupera en unos 60 días**, no un gasto que tiene que
pagarse el mismo día. Lo que decide si es rentable no es solo cuánto cuesta el cliente, sino
**cuántos vuelven**.

**Cuántos tienen que volver para que Meta se pague** (cada pedido deja S/12.56; de los que vuelven
una vez, 85% hace un tercero y 60% sigue, como el promedio del delivery):

| un cliente cuesta | pedidos que necesita hacer | cuántos tienen que volver al menos una vez |
|---|---|---|
| S/20 | 1.6 | 2 de cada 10 |
| S/25 | 2.0 | 3 de cada 10 |
| S/30 | 2.4 | 4 de cada 10 (el promedio del delivery) |
| **S/35** (lo que espera el modelo) | **2.8** | **6 de cada 10** |
| S/45 | 3.6 | 8 de cada 10 |

**Las cuatro etapas, desde cero:**

1. **Sembrar (semanas 1–4).** Meta con el tope de la prueba (S/700, ~S/25 al día), solo en la zona
   de reparto, a la hora del almuerzo y de la cena, optimizando por compra, con 6–10 anuncios
   distintos. Se acepta que el cliente cueste más que el primer pedido: se están comprando los
   primeros clientes, las primeras reseñas y los datos que el píxel necesita para aprender.
2. **Que cada cliente de Meta vuelva (desde el primer pedido).** Es la palanca que vuelve rentable
   a Meta, y ya está en la app: el QR de la bolsa (bebida gratis en el siguiente pedido por la web),
   puntos, el pedido fijo que se ofrece al segundo pedido, el aviso a quien dejó de pedir y el
   cumpleaños. La meta es que **6 de cada 10 vuelvan**: con eso, un cliente de S/35 se paga.
3. **Medir por tanda (cada lunes).** Los clientes que trajo Meta en cada semana se siguen 60 días:
   cuánto costaron y cuánto han dejado con todos sus pedidos. **Si una tanda ya devolvió lo que
   costó, Meta se paga y se sube el presupuesto 20% por semana.**
4. **Escalar con lo aprendido (desde ~100 compradores).** Públicos parecidos a los que ya compraron
   y anuncios a quienes visitaron la app: los dos bajan el costo por cliente.

**El semáforo, con Meta como motor:**

| costo por cliente | qué se hace |
|---|---|
| hasta S/12.56 | se paga con el primer pedido: subir 20% por semana |
| S/12.56 a S/30 | se paga si vuelven como el promedio: seguir y medir la tanda a los 60 días |
| más de S/30 | seguir solo si la tanda vuelve más que el promedio. Mientras tanto, corregir: piezas nuevas, zona y horario, la app (§2). Si a los 60 días la tanda no devolvió lo que costó, bajar a reconectar visitantes y reforzar referidos y grupo hasta corregir |

**La caja**: lo que se invierte en Meta vuelve en unos dos meses. Por eso el presupuesto lo fija lo
que puedes adelantar sin apretarte, no lo que rinde: S/700 el primer mes, y se sube solo cuando una
tanda ya devolvió su costo.

**Lo que no cambia**: nada se prende ni se sube sin tu sí.

## 4 · Fuentes

- Meta, consolidación de conjuntos (citado por Five Nine Strategy): https://fiveninestrategy.com/meta-andromeda-update-2025/
- Diversidad de piezas (Confect): https://confect.io/tactics/meta-andromeda-2026
- Delivery y Meta (Datalatte): https://datalatte.pro/blog/facebook-ads-restaurant-delivery-orders-guide
- Referidos en restaurantes (Regulr): https://regulr.ai/for/restaurants/referral-programs
- Click to WhatsApp en Perú (Paradero Digital): https://www.paraderodigital.pe/publicidad-en-facebook-instagram-y-whatsapp-precios-y-costos/
- Las tasas de Perú del modelo: `supabase/functions/api/env.ts` (bloque `CAC_TECHO`) y `modelo/proyeccion.py`.

Casi todas las cifras externas son de agencias y vendedores, no estudios controlados: sirven para
ordenar qué probar primero, no para prometer un resultado. El número que manda es el nuestro, medido
por pedido.
