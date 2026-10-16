# Meta y lo presencial, medibles y probados (2026-10-15, noche)

Dueño: «Puede ser [los anuncios de Rappi, PedidosYa y Google], o darle otra vuelta a Meta y a las
presenciales, pero medibles y probadas».

- **Medible**: cada cliente queda contado con su origen. La app ya lo hace: guarda el `?src=` del
  enlace en cada pedido y en cada cliente nuevo.
- **Probada**: hay estudios de que funcionó en otro lado. Y además se prueba en chico, con una
  regla para cortar antes de gastar más.

Cifras ANTES de tu sueldo (como en `docs/META_6000.md`): `python3 modelo/meta_6000.py` (400
corridas). Aún no hay un solo pedido real. **Todo gasto es real y necesita tu sí.**

## La respuesta corta

1. **Meta: el problema no es cómo se prende, es cuánto cuesta un cliente.** Darle otra vuelta
   (una prueba que dé un número confiable y escalar apenas sale bien) sube el mes 3 en ~S/370,
   pero si el cliente cuesta ~S/36, la meta sigue en el mes 10. **Meta sola no basta.**
2. **Lo presencial sí mueve la meta, si lo hacen otros y se paga solo por resultado: embajadores.**
   Gente de Trujillo con su propio enlace que se lo pasa a su salón, su oficina, su equipo. S/5
   cuando su invitado nuevo recibe el primer pedido y S/5 más en el segundo. **Si no traen a nadie,
   no cuesta nada.** Tú no vas a ningún lado.
3. **Juntos**: embajadores + Meta → S/6,000 sostenidos desde el **mes 6**. Si además van los
   anuncios de Rappi, PedidosYa y Google → **mes 5**. Con un ayudante desde enero, **mes 6** y tú
   con ~5 horas a la semana.
4. **Si Meta sale caro, hay plan B sin Meta**: embajadores + los tres anuncios → **mes 6**.

## Meta, otra vuelta

**Primero, lo que lo bloquea hoy**: sin el Instagram vinculado a la página y sin los pasos C3–C5
(`docs/CONFIGURAR_META.md`), **la prueba no puede salir el 20** y el 17-nov no habrá número. Eso va
antes que todo lo demás.

| qué cambia | por qué | cómo se mide | tú |
|---|---|---|---|
| **La prueba, de S/350 a S/700** | Con S/350 llegan ~10 clientes y el número puede errar ±30%: un cliente de S/36 se puede leer como S/25 o como S/50, y se decide mal. Con S/700, ~20 clientes y ±22% | pedidos con origen `meta` | sí o no (S/350 más) |
| **Escalar el 17-nov si sale bien**, no el 1-dic | dos semanas antes; con la prueba de S/700, +S/370 en el mes 3 entre las dos | lo mismo | decidir ese día |
| **Anunciar el Reel que mejor funcionó gratis**, no una pieza nueva | llega ya probado por la gente (lo recomienda Meta; no hay un estudio independiente, por eso se mide) | un enlace por pieza: `src=meta-<pieza>`; se sabe qué pieza trajo **pedidos**, no solo clics | nada |
| **Solo la zona de reparto y las horas de comida** | no se paga por mostrárselo a quien no puede pedir | — | nada |
| **Volver a mostrárselo a quien entró y no pidió** (desde la 3.ª semana) | el píxel ya ve solo personas (lo arreglé hoy) | `src=meta-volver` | nada |
| Ya hecho: compras enviadas a Meta desde el servidor | Meta reporta ~13% menos costo por resultado (dato de Meta, no independiente) | — | — |

**Lo que no conviene**: comparar dos versiones del anuncio (A/B) en la prueba. Con ~20 clientes,
cada versión tendría ~10 y no se distinguen. El A/B sirve desde diciembre, con 50 o más clientes al
mes.

## Lo presencial, medible y probado

### Embajadores pagados por resultado (lo que recomiendo)

> **Aprobado y construido (2026-10-16, dueño: «Sí, amé los embajadores»).** Panel → Marketing →
> **Embajadores**: el aviso para reclutar listo para copiar, «Crear su enlace» (nombre y celular),
> y por cada uno su enlace con sus reglas para mandárselas por WhatsApp, cuánto trajo y cuánto se
> le debe, con el botón «Ya le pagué S/… por Yape». Lo que se debe lo calcula el servidor de los
> pedidos (`comisionesDeEmbajadores`, `_shared/dinero.ts`; prueba en `tests-api/embajadores.test.ts`).
>
> **Para empezar**: (1) copia el aviso del panel y publícalo en 3–4 grupos de Facebook de la UCV,
> la UPAO y la UNT y en una bolsa de trabajo gratis; (2) a quien te escriba, créale su enlace y
> mándale la tarjeta «Su enlace y sus reglas»; (3) cada semana, paga lo que diga el panel y toca
> «Ya le pagué».

- **Qué es**: personas de Trujillo que comparten su enlace donde ya están: universitarios (la César
  Vallejo está a 1.2 km del punto de despacho, la UPAO a 1.5 km), alguien de una oficina, de un
  equipo de fútbol, de un gimnasio. **Lo presencial lo hacen ellos.**
- **Cuánto**: S/5 cuando su invitado **nuevo** (un teléfono que nunca había pedido) recibe su
  primer pedido y S/5 más cuando hace el segundo. Como la mitad no vuelve, sale **~S/8 por
  cliente**; en Meta, ~S/36–44. Pagar la mitad en el segundo pedido también protege de pedidos
  falsos: uno falso cuesta un sándwich pagado, y dos ya no le conviene a nadie.
- **Medible**: cada uno con su enlace `sndwch.app/?src=emb-<nombre>` y su QR (lo muestran desde el
  celular). La app ya guarda de dónde vino cada cliente. Lo que falta programar, cuando digas sí:
  una sección del panel que diga cada semana cuánto se le debe a cada uno.
- **Probado**: un cliente que llega recomendado vale **16% más** y se va **18% más lento** (Schmitt,
  Skiera y Van den Bulte, *Journal of Marketing*, 2011, en un banco alemán). Apps de delivery
  universitarias (EnvoyNow, OrderUp) crecieron con embajadores a comisión, pero **no publicaron
  cifras**: por eso se prueba en chico, y como se paga por resultado, la prueba no cuesta si falla.
- **Reclutarlos sin conocer a nadie**: un aviso en los grupos de Facebook de las universidades de
  Trujillo y en bolsas de trabajo gratis. Tú eliges por WhatsApp (~2 h, una vez). Hay que reclutar
  ~15 para que queden ~5 activos: la mayoría no trae a nadie.
- **Tu tiempo**: ~2 h una vez; ~15 min a la semana para pagarles por Yape lo que diga el panel.
- **Reglas para ellos**: si lo publican en redes, marcarlo como publicidad (INDECOPI pide que la
  publicidad pagada se identifique; a confirmar el detalle); nada de precios ni promesas propias,
  solo el enlace; nada de *spam*.
- **Prueba y regla de corte**: 4 semanas desde el 15-nov. Si los activos traen menos de 2 clientes
  al mes cada uno, se cierra (habrá costado casi nada).
- **Supuesto del modelo**: 5 activos × 6 clientes nuevos al mes cada uno [SUPUESTO]. Si traen la
  cuarta parte (3 × 3), la meta igual llega en el mes 6 con todo lo demás.

### Degustaciones (probadas; después del mes 6, por tu regla)

- **Probado**: en un estudio con seis bases de datos de ventas (Chandukala, Dotson y Liu, *Journal
  of Retailing*), dar a probar subió las ventas en el momento y por semanas, más que cualquier
  exhibición.
- **Medible**: cada bocado con su QR propio (`src=degus-<lugar>`).
- **Quién**: un embajador, pagado por el día, o tú un fin de semana libre.
- No está en las cifras: es para después del mes 6, salvo que decidas adelantarlo.

### Lo presencial que sigue descartado

- **Volantes**: tu decisión.
- **Tú visitando oficinas o bares**: no hay tiempo. Si quieres que pase, lo hace un embajador.
- **Ferias de emprendedores**: piden tus fines de semana, un permiso y equipo, y no hay estudios.

## Las cifras

| | mes 3 | mes 6 | mes 12 | S/6,000 sostenidos desde | llega en el mes 12 (de 100 casos) | tus horas a la semana, mes 6 |
|---|---|---|---|---|---|---|
| Meta sola, cliente a ~S/36 (el plan de antes) | S/2,328 | S/4,364 | S/6,551 | mes 10 | 55 | ~20 |
| Meta, otra vuelta, cliente a ~S/36 | S/2,697 | S/4,581 | S/6,601 | mes 10 | 56 | ~20 |
| embajadores, sin Meta | S/3,107 | S/4,396 | S/6,142 | mes 12 | 52 | ~17 |
| **embajadores + Meta otra vuelta** | S/3,482 | **S/6,522** | S/8,414 | **mes 6** | 81 | ~24 |
| embajadores + los tres anuncios (S/800), **sin Meta** | S/3,646 | S/6,030 | S/8,145 | mes 6 | 89 | ~21 |
| **todo: embajadores + S/800 + Meta otra vuelta** | S/4,324 | **S/7,720** | S/9,718 | **mes 5** | 96 | ~28 |
| todo + ayudante desde el 16-ene (pasa de ~20 pedidos al día) | S/4,241 | S/6,995 | S/9,924 | mes 6 | 86 | **~5** |
| todo, si los embajadores traen la cuarta parte (3 × 3) | S/3,582 | S/6,699 | S/8,482 | mes 6 | 84 | ~26 |
| todo, si la recompra no mejora | S/2,761 | S/5,211 | S/6,551 | mes 8 | 64 | ~23 |

**Las horas**: con todo y sin ayudante, en el mes 6 serían ~27 pedidos al día, ~28 horas tuyas a
la semana, además del banco. Por eso el ayudante entra en enero, cuando se pase de ~20 pedidos al
día: la meta sigue en el mes 6 y lo tuyo baja a comprar y llevar el panel.

**Lo que más pesa sigue siendo que vuelvan**: sin eso, todo junto llega recién en el mes 8.

## Lo que decides tú

| # | decisión | gasto | si dices sí, yo |
|---|---|---|---|
| 1 | **Ya**: vincular Instagram y los pasos C3–C5 | ninguno | armo la prueba en pausa para que la prendas |
| 2 | Embajadores | ~S/8 por cliente que llega; nada si no llega nadie | programo la sección de pagos del panel y escribo el aviso para reclutar |
| 3 | La prueba de Meta de S/700 en vez de S/350 | +S/350 | la armo con un enlace por pieza |
| 4 | Los anuncios de Rappi, PedidosYa y Google (P46, `docs/OTRA_PUBLICIDAD.md`) | S/800 al mes | la guía y la configuración de Google |
| 5 | En enero: el ayudante, si se pasa de ~20 pedidos al día | ~S/1,400 al mes | — |

## Fuentes

- Referidos: [Schmitt, Skiera y Van den Bulte (2011), *Referral Programs and Customer Value*](https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/Schmitt-Skiera-vandenBulte-2011-Referral-Programs-Customer-Value.pdf).
- Degustaciones: [Universidad de Wisconsin, sobre Chandukala, Dotson y Liu](https://business.wisc.edu/news/good-news-for-retailers-and-grocery-store-snackers-in-store-product-sampling-builds-long-term-sales/).
- Embajadores en apps universitarias: [OrderUp en VCU](https://commonwealthtimes.org/2016/04/18/orderup-popularizes-on-vcu-campus/),
  [EnvoyNow](https://www.trendhunter.com/trends/envoynow).
- Meta: [Meta Blueprint, API de conversiones](https://bep.facebookblueprint.com/student/path/514683/activity/466137).
