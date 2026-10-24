# El público de las bebidas, y si empata con el de los sándwiches (2026-10-24)

Dueño: «Trabajemos en el público objetivo de las bebidas. Que creo que sí empata con los
sándwiches».

**Respuesta corta: sí empata, en casi todo.** Las latas se venden en el mismo pedido, por el mismo
canal y en los mismos momentos que los sándwiches. Hay dos lugares donde no empata, y en esos dos
están los clientes nuevos que pueden traer las bebidas.

Todo esto es hipótesis hasta que lleguen los primeros pedidos; abajo está cómo se mide.

---

## 1 · Quién es, con datos

| dato | qué dice | fuente |
|---|---|---|
| **Quién pide delivery** | 5.8 millones de usuarios únicos de apps de reparto, el 37% de la población urbana de 15 a 64 años. Piden por comodidad (86%) y por ahorrar tiempo (53%) | IPE 2025, en Gestión |
| **Quién toma té listo** | se concentra en la generación Z y los millennials. Se toma en oficinas, universidades y gimnasios | Tetra Pak Perú en Gestión (jun-2026); AmericaMalls (jun-2026) |
| **A quién le importa el azúcar** | el 70% dice que «Alto en azúcar» es el octógono que más le preocupa, y el 28% dejó de comprar casi todo lo que lleva octógonos | Ipsos Perú, feb-2025 |
| **Con qué se acompaña hoy la comida** | las gaseosas lideran las bebidas sin alcohol (44% en 2017). Una tesis de la PUCP propone justamente bebidas caseras envasadas para el almuerzo, en lugar de la gaseosa | Kantar en Perú Retail; tesis PUCP 2024 |

**Lo que no encontré:** cuántos pedidos de delivery en el Perú llevan bebida. Ese número lo da
nuestra propia app en las primeras semanas.

---

## 2 · Dónde empata y dónde no

| momento (del concepto del negocio) | ¿empata? | el papel de la lata |
|---|---|---|
| **El almuerzo de oficina** (mar–vie, 12:00–14:30) | **sí, el más fuerte** | Reemplaza a la gaseosa del almuerzo. El té listo ya se toma en oficinas. Las que tienen té (Lemon Tea, The Chai, Cold Brew Tea) ayudan a seguir la tarde |
| **La noche sin ganas de cocinar** (19:00–22:00) | **sí** | The Bloom y The Cool no llevan cafeína (jamaica, hierba luisa y menta): son las de la noche |
| **La juntada o el partido** (vie–dom, noche) | **sí, en cantidad** | Varias latas por pedido, y el brillo sale en las fotos y en los videos del grupo |
| **El antojo de la tarde** (16:00–18:00) | **a medias** | Alguien que no quiere un sándwich, pero sí algo helado: **bebidas solas desde 2** |
| **Las tiendas, más adelante** (cafés, bodegas) | **no** | Quien compra una lata en una tienda nunca pidió un sándwich. El QR de atrás («¿Otra? Pídela con tu sándwich») lo trae a la app |

**Dónde están los clientes nuevos:** en las dos últimas filas.
- **La tarde:** el público del té listo (jóvenes, oficinas y universidades) toma bebidas a esa
  hora.
- **Las tiendas:** el QR de la lata es la puerta de entrada.

---

## 3 · Qué cambia en la publicidad

| qué hago | cómo impacta en ventas | por qué | en qué me baso | ¿Perú? | cómo lo mido |
|---|---|---|---|---|---|
| **No se arma un público aparte en Meta para las bebidas** | No parte el presupuesto en dos grupos chicos | La regla de la campaña es amplia: de 18 a 60 años, sin intereses. Cada filtro encarece el costo por mil | `docs/CAMPANA_DE_ANUNCIOS.md` | sí, es nuestra regla | costo por pedido |
| **La lata va dentro de los anuncios del sándwich**: el sándwich, y a su lado la lata con el brillo girando | Sube el ticket del pedido sin pagar otra campaña | El movimiento del brillo da algo vivo en los primeros 2 segundos. Cada bebida que se suma es ticket sin costo de captación | `ingenieria-de-carta`; regla de los 2 segundos de `video-sndwch` | — | % de pedidos de sándwich con bebida |
| **En la noche se muestran The Bloom y The Cool** | Que la bebida de la noche no quite el sueño | No llevan cafeína | la receta | — | qué bebidas salen después de las 19:00 |
| **Un anuncio solo de bebidas, para la tarde, como prueba** (más adelante) | Puede traer clientes que hoy no piden sándwich | Es el público del té listo | Tetra Pak Perú (2026) | sí | pedidos de solo bebidas, con `?src=` propio |
| **El QR de la lata** | Trae a la app a quien la compró en una tienda | El QR ya es costumbre en el Perú: los pagos con QR crecieron 74% en 2025 | América TV, con datos de 2025 | sí | escaneos de `?src=lata-*` |

**Es una apuesta, sin estudio:** que la lata en el anuncio del sándwich suba el ticket sin bajar los
clics. Se prueba barato con dos versiones del mismo anuncio (con lata y sin lata), con el mismo
presupuesto, una semana.

---

## 4 · Qué se mide desde el primer día

1. **% de pedidos de sándwich con al menos una bebida.** Es el número principal. No hay un dato
   del Perú con qué compararlo: las primeras 4 semanas dan la base.
2. **Pedidos de solo bebidas** (desde 2) y a qué hora llegan.
3. **Cuál bebida por momento:** almuerzo, tarde y noche.
4. **Escaneos del QR** de cada lata (`?src=lata-bloom`, etc.).
5. **Cold Brew Tea:** su participación en las bebidas (meta: 14% en 4 semanas, ver
   `docs/BEBIDAS_PRODUCTO.md` §19).

---

## Fuentes
- [Gestión: usuarios de apps de reparto (IPE, 2025)](https://gestion.pe/economia/usuarios-de-plataformas-digitales-se-sextuplican-desde-2020-esto-aportan-a-economia-de-peru-noticia/)
- [Gestión: 4 de cada 10 jóvenes toman té listo a diario (Tetra Pak Perú, 2026)](https://gestion.pe/economia/mercado-de-bebidas-4-de-cada-10-jovenes-consumen-a-diario-te-listo-para-tomar-noticia/)
- [AmericaMalls: el té listo conquista a las nuevas generaciones (2026)](https://americaretail-malls.com/paises/peru/te-listo-para-tomar-conquista-nuevas-generaciones/)
- [Perú Retail: consumo de agua embotellada y gaseosas (Kantar)](https://www.peru-retail.com/consumo-agua-embotellada-gaseosas/)
- [Tesis PUCP: bebidas caseras peruanas para almuerzos (2024)](https://tesis.pucp.edu.pe/items/2a8ff7f0-7957-4797-9a71-ca39de6a263b)
- [América TV: los pagos con QR crecieron 74% en 2025](https://www.americatv.com.pe/noticias/util-e-interesante/sin-efectivo-como-pagos-digitales-estan-transformando-dia-dia-peru-n520887)
- Ipsos Perú, feb-2025, el octógono que más preocupa: ya citado en `.claude/skills/por-que-vende/SKILL.md`.
