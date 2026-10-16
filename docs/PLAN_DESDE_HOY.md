# El plan desde hoy: anuncios pensados, Rappi primero y lo demás del negocio (2026-10-16)

Dueño: «Podríamos comenzar en el punto 4 primero en PedidosYa o en Rappi. Aún no lo programes. Hay
que mejorar el marketing, pensar bien los anuncios, planearlos desde hoy. Mejora todo lo demás del
negocio, donde ajustamos, qué más hacemos».

## Lo que queda decidido hoy

- **Meta sigue en pausa, sin programar.** La campaña de S/700 está armada (`marketing/PAUTA_BARATA.md`);
  no se prende hasta que apruebes los anuncios mejorados de abajo.
- **El punto 4 empieza por Rappi, no por PedidosYa ni Google.** Por qué:
  1. **El primer mes Rappi no te cobra comisión** (tu acuerdo con ellos; `modelo/proyeccion.py`,
     `rappi_comision`). Cada pedido que traiga un anuncio ese mes te deja el margen entero.
  2. Rappi abre contigo el 20; PedidosYa todavía tiene el alta por terminar.
  3. Rappi vende anuncios dentro de la app en Perú a escala: más de 1,200 acuerdos con 150 marcas
     entre 2022 y 2023 y ~860 campañas solo en agosto de 2023 ([Gestión](https://gestion.pe/economia/empresas/rappi-apps-de-delivery-publicidad-el-otro-negocio-de-rappi-que-va-mas-alla-del-delivery-y-crece-a-ritmo-vertiginoso-noticia/)).
  - No encontré una cifra pública de quién tiene más usuarios en Trujillo; PedidosYa se mide
    después, con el número de Rappi en la mano.

## 1 · Rappi primero

**Antes del anuncio, la vitrina.** Un anuncio manda gente a tu tienda en Rappi; si la tienda se ve
pobre, se paga el clic y no hay pedido. Una sola vez, ~1 hora (tú, en el portal de aliados):

| qué | cómo |
|---|---|
| Nombres | los mismos de la carta (Philly Cheesesteak, Meatball Marinara, Turkey, Tuna Melt, Italian Hoagie, Classic Tuna) |
| Descripciones | la primera frase de «Cómo se vende» de cada uno (`docs/hechos/CARTA.md`); que diga qué lleva |
| Orden | el Philly primero (es la estrella y la foto que mejor calza), después el resto |
| Precios | los de la web + 10% (tu decisión del 9-oct) |
| Combo | sándwich + bebida, como en la web |
| Fotos | la del Philly (`img/sig09.jpg`) calza con la receta; **las demás son de stock y no calzan del todo** (ver §3). Súbelas por ahora y cámbialas por las tuyas apenas las tengas |
| Horario | martes a domingo, 11:00 a 22:00, igual que la web |
| Aceptar rápido | el celular o tablet de Rappi con sonido; aceptar en menos de 2 minutos (pesa en el orden de la lista) |

**El anuncio dentro de Rappi**:
- **Cuándo**: desde que pasen bien los primeros 2–3 pedidos de Rappi (objetivo: jueves 22) hasta el
  último día del mes sin comisión (confirma esa fecha en el portal: se cuenta desde tu activación).
- **Cuánto**: S/10 al día (~S/280 en ese mes). Es gasto real: se prende con tu sí ese día.
- **Dónde**: portal de aliados → marketing/anuncios. Si no aparece, se lo pides a tu ejecutivo de
  Rappi: no encontré cómo funciona en Perú por autoservicio.
- **Cómo se mide**: el panel de Rappi dice cuánto gastaste y cuántos pedidos trajo el anuncio. Cada
  lunes: menos de S/20 por pedido, sigue; S/20–35, baja a S/5 al día; más de S/35, se apaga.
- **PedidosYa**: al terminar el mes de Rappi, con su número. Google, después.

## 2 · Los anuncios de Meta, pensados

### Lo que la evidencia sí dice, y lo que no

Lo que se sostiene es poco y es práctica de agencias, no estudios: **la comida en los primeros
~2 segundos, video vertical, texto en pantalla** (mucha gente ve sin sonido), y **comida real**,
no un anuncio pulido. No encontré un estudio que mida qué vende más en un anuncio de comida. Por
eso los anuncios no se adivinan: se prueban 3–4 a la vez, Meta reparte el presupuesto y **cada
uno se mide por los pedidos que trae** (su enlace `src=meta-<pieza>`), no por los «me gusta».

### Las piezas

| pieza | qué prueba | estado |
|---|---|---|
| **Philly** (foto) | el producto: la foto calza con la receta | lista, en pausa |
| **«¿Pides para la oficina?»** (WICHO) | el pedido en grupo: un pedido grande en vez de uno chico | lista, en pausa |
| **La carta** (carrusel) | el menú con precios | **retirada de la prueba**: muestra el Turkey con pepino, el Tuna Melt abierto y el Meatball con otro queso. Un anuncio pagado que promete lo que no llega es lo que sanciona INDECOPI. Vuelve con fotos que calcen |
| **El sándwich en movimiento** (video vertical, 8–10 s) | la comida real: el corte, el queso | **falta**: 2–3 clips tuyos de 10 s armando los primeros pedidos (el celular parado, sin posar). Yo los edito con el texto y el precio, que salen de la carta |
| **«Hoy no cocinas»** (cena) | la ocasión de la noche | la armo cuando tengamos la foto real del Meatball |

### El calendario

| cuándo | qué | quién |
|---|---|---|
| hoy a domingo 19 | revisas las vistas previas del Philly y la oficina | tú, 5 min |
| martes 20 a jueves 22 | abres **sin Meta**: se comprueba que la operación aguanta; grabas los clips | tú |
| jueves 22 | edito el video y te lo mando para aprobar | yo |
| **viernes 23** (aprobado: «Meta sí me sirve») | Meta arranca con las 4 piezas nuevas (`docs/marketing/anuncios/`): S/700 hasta el jueves 19-nov; el video entra después | tu sí a las piezas |
| cada lunes | qué pieza trae pedidos; la peor se cambia por una nueva | yo te lo traigo, tú decides |
| desde la semana 3 | volver a mostrárselo a quien entró y no pidió (las audiencias ya existen) | yo, con tu sí |
| viernes 20-nov | el número: cuánto costó cada cliente → cuánto poner en diciembre | tú |

**Reglas de corte**: una pieza con menos de 0.7% de clics después de 2,000 vistas se cambia. A los
14 días, la que no trajo ningún pedido se cambia. Más de S/45 por cliente al cierre: no se escala.

## 3 · Lo demás del negocio

### Lo que arreglé hoy

- **El total del carrito sin dirección.** Si el cliente movía el mapa y lo cerraba sin confirmar, el
  carrito le sumaba el envío pero seguía diciendo «Sin envío» y «S/30.90 + envío» (un Philly de
  S/22.90). No cobraba de más, porque para pagar se pide la dirección, pero el precio se veía
  inflado justo antes de pagar. Ahora sin dirección muestra solo la comida.

### Lo que encontré

- **Las fotos son de stock y no todas calzan con la receta** (anotado en `img/fuente/FUENTES.md`):
  el Philly sí; el Turkey trae pepino, el Tuna Melt es abierto sobre pan tostado, el Meatball trae
  otro queso. Para la app es una aproximación anotada; **para un anuncio pagado no sirve**. Es lo
  que más mejora la venta en las apps y en Meta: **una foto real de cada uno** (6 fotos, una tarde)
  o, si prefieres, imágenes generadas **fieles a la receta** (lo permites desde el 7-oct). Tú
  decides cuál; yo las trato y las subo.
- **El inventario está en 0** en producción: se carga al abrir («Abro con N porciones»).
- **Instagram sigue sin vincular**: los anuncios ya no dependen de eso, pero las publicaciones sí.

### Lo que más mueve antes del martes (todo tuyo)

| # | qué | por qué |
|---|---|---|
| 1 | **Las notificaciones en el celular con el que atiendes** (P38: Administrar → Este celular) | sin sonido, un pedido se queda sin atender y no te enteras |
| 2 | **Un pedido de prueba completo el domingo** (pagar, armar, que lo lleve un motorizado) | lo primero que falla en un negocio nuevo es la operación, no la app |
| 3 | **La vitrina de Rappi** (§1) | es tu canal más grande del primer mes |
| 4 | **Instagram vinculado** (P40) | las publicaciones y los Reels gratis |
| 5 | **El aviso de embajadores** (P49, ya está en el panel) | clientes que vuelven más, pagados por resultado |
| 6 | **Avisar a tu gente el martes** con el enlace de lanzamiento (panel → Avísale a tu gente) | los primeros pedidos y las primeras reseñas |

## Fuentes

- Anuncios de Rappi en Perú: [Gestión](https://gestion.pe/economia/empresas/rappi-apps-de-delivery-publicidad-el-otro-negocio-de-rappi-que-va-mas-alla-del-delivery-y-crece-a-ritmo-vertiginoso-noticia/).
- Alta en Rappi: [Crehana](https://www.crehana.com/pe/blog/negocios/alta-negocio-en-rappi).
- Práctica de anuncios en video (agencias, no estudios): [Straight North](https://www.straightnorth.com/blog/meta-ads-creative-best-practices-that-convert/),
  [Bestever](https://www.bestever.ai/post/ad-creative-guidelines).
