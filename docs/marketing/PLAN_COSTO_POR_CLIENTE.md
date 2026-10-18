# Cuánto podemos pagar por un cliente, cómo bajarlo y cómo conseguir clientes desde cero (2026-10-18)

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

**Los otros canales**, para que el negocio no dependa de uno solo:

- **Referidos**: el cliente nuevo cuesta lo que cuesta el premio, S/7.65 (sándwich y bebida a costo). Funciona desde el primer cliente que tengamos.
- **Pedido en grupo**: un pedido de oficina trae 5 o más clientes nuevos de una vez.
- **Tu red y embajadores**: el link del panel y el aviso en los grupos de las universidades.
- **Orgánico**: el video del día, TikTok y Google Maps. Cuestan tiempo, no plata.
- **Anuncios a WhatsApp**: en Perú una conversación desde un anuncio cuesta centavos (S/0.15–0.30, agencias). Vale una prueba chica.
- **Rappi y PedidosYa**: un complemento. Un local nuevo, sin calificaciones, puede no aparecer ni vender; no se cuenta con ellos hasta ver sus pedidos.

## 3 · Cómo conseguimos clientes desde cero

Dueño (2026-10-18): «Meta también puede o debe usarse para conseguir clientes, pero el negocio no
debe depender solo de Meta; no debemos restringir la publicidad a la recompra porque tenemos 0
clientes; no sobrevalores Rappi y PedidosYa, que puede ser que no nos traigan clientes».

**El punto de partida**: 0 clientes, 0 reseñas, 0 datos. Ningún canal está probado, así que
**todos arrancan a la vez** y cada uno se mide por los pedidos que trae (su `?src=`):

| canal | qué hace desde el día 1 |
|---|---|
| **Meta** | busca gente nueva en la zona de reparto, al almuerzo y a la cena, con S/700 el primer mes (~S/25 al día) y 6–10 anuncios distintos. Es búsqueda de clientes nuevos, no solo a quien ya visitó |
| **Tu red y embajadores** | el link del panel a tus contactos; el aviso en los grupos de la UCV, la UPAO y la UNT |
| **Referidos** | desde el primer cliente: cada uno puede invitar y los dos ganan |
| **Pedido en grupo** | un mensaje por WhatsApp a las oficinas cercanas, sin visitas |
| **Orgánico** | el video del día, TikTok y la ficha de Google |
| **Rappi y PedidosYa** | encendidos, sin contar con ellos |

**Cada lunes**: cuántos clientes nuevos trajo cada canal y cuánto costó cada uno. La plata se mueve
hacia lo que trae clientes más baratos, **sin apagar ningún canal el primer mes**: con tan pocos
pedidos, un canal que hoy no trae nada puede ser el que mejor rinde en la cuarta semana.

**Meta, cuándo se paga**: un cliente de Meta casi nunca se paga con su primer pedido (deja S/12.56);
se termina de pagar con los pedidos que vienen después. Por eso, además del costo, se mide si vuelve:

| un cliente cuesta | tiene que volver al menos una vez |
|---|---|
| S/20 | 2 de cada 10 |
| S/25 | 3 de cada 10 |
| S/30 | 4 de cada 10 (el promedio del delivery) |
| S/35 | 6 de cada 10 |

La recompra **no es condición para anunciar** (sin clientes no hay a quién volver a vender): es lo
que, con las semanas, dice si lo gastado se recuperó.

| costo por cliente en Meta | qué se hace |
|---|---|
| hasta S/12.56 | se paga con el primer pedido: subir 20% por semana (con tu sí) |
| S/12.56 a S/30 | seguir; medir a los 60 días si esos clientes volvieron |
| más de S/30 | corregir: piezas nuevas, zona y horario, lo que la app pierde entre la visita y el pago. Si a los 60 días esos clientes no devolvieron lo que costaron, bajar el presupuesto y pasar una parte a los canales que traen clientes más baratos, **sin dejar de buscar clientes nuevos** |

**La caja**: lo que se gasta en publicidad vuelve en semanas, no el mismo día. El presupuesto lo
fija lo que puedes adelantar sin apretarte: S/700 el primer mes en Meta. Nada se prende ni se sube
sin tu sí.

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
