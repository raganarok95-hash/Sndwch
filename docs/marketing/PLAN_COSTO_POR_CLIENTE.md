# Cuánto podemos pagar por un cliente, cómo bajarlo y qué hacer si sale caro (2026-10-18)

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

## 3 · El plan si el cliente sale más caro de lo que deja

**Regla de lectura**: nada se decide antes de **14 días o 30 pedidos** del anuncio (antes, el número
de Meta es ruido). Se lee cada lunes, por pieza, con su `?src=`.

| semáforo | costo por cliente | qué se hace |
|---|---|---|
| **Verde** | hasta S/12.56 | se paga solo. Se sube el presupuesto 20% por semana mientras siga verde |
| **Amarillo** | S/12.56 a S/22.70 | se mantiene el presupuesto, no se sube. A los 30 días se mira cuántos volvieron: si vuelve menos de 4 de cada 10, pasa a rojo |
| **Rojo** | más de S/22.70 | dos rondas de corrección, de 7 días cada una, sin subir presupuesto (abajo). Si sigue rojo, se pausa |

**Las dos rondas de corrección** (en este orden, una cosa a la vez para saber qué funcionó):

1. **Semana 1 · la pieza**: se cambian los anuncios por otros distintos (palancas 2, 3 y 4) y se
   recorta a la zona y las horas que venden (palanca 5).
2. **Semana 2 · el público y la app**: todo el presupuesto a reconectar visitantes (palanca 6) y se
   arregla lo que la app pierda entre la visita y el pago (palanca 1).

**Si después de las dos sigue rojo**:

- Meta pasa a **solo reconectar visitantes**, con tope de S/5 al día. Nada de buscar gente nueva.
- La plata que quedaba de la prueba se mueve a lo que cuesta menos: el premio de referidos y del
  pedido en grupo, y el anuncio dentro de Rappi con su regla.
- **Se reintenta Meta en 30 días**, cuando haya fotos reales, reseñas y la recompra medida: las tres
  cosas que más bajan el costo y que el día 1 no existen.

**Lo que no cambia**: la prueba de Meta tiene un tope (S/700) y no se pasa sin tu sí; nada se prende
ni se sube solo.

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
