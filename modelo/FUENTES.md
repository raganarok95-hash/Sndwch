# Parámetros con fuente — investigación del 2026-08-27

Salida de 5 agentes de investigación externa. **Regla que se les impuso**: ninguna cifra sin
URL citable; si no la encontraban, debían escribir "NO ENCONTRADO CON FUENTE" en vez de
rellenarla. Lo que sigue es solo la parte que pasó ese filtro.

**Advertencia de verificación (importante):** el proxy de red de este entorno bloqueó
`WebFetch` en casi todos estos dominios. Las cifras vienen de extractos de resultados de
búsqueda, **no de la lectura directa de cada página**. Antes de una decisión de plata
grande, abrir las URLs en un navegador normal.

---

## Los 3 números que el modelo realmente usa

| Parámetro | Valor | Fuente |
|---|---|---|
| P(2º pedido \| 1er pedido) | **22.6%** (77.4% nunca vuelve). Rango industria 22.6–40% | [Bloom Intelligence, 1,000+ locales, ene-2024 a oct-2025](https://bloomintelligence.com/blog/state-of-restaurant-guest-retention-2025/) |
| Pedidos totales de quien vuelve una 2ª vez | **6.93** | [Bloom Intelligence, guía 2026](https://bloomintelligence.com/blog/restaurant-customer-retention-2026-guide/) |
| Días entre pedidos, **canal propio** | **33.0** (agregadores 43.1) | [Paytronix 2025 vía Restaurant Dive](https://www.restaurantdive.com/news/paytronix-first-party-customers-tip-better-order-more-versus-third-party-aggregators/651565/) |

SND//WCH es canal propio: no está en Rappi ni PedidosYa. Por eso se usa 33 y no 43.1.

## Publicidad en Perú (de aquí sale el CAC)

| Parámetro | Valor | Fuente |
|---|---|---|
| CPM Meta, Perú, consumo masivo/restaurantes | **S/5 – S/12** | [ibo.pe 2026](https://ibo.pe/blog/publicidad-digital-en-peru-2026-costos-tendencias-y-plataformas-clave/) |
| CPC Meta, Perú, campañas de tráfico | S/0.20 – S/0.70 | ibo.pe (validación cruzada del CPM) |
| CTR, Restaurants & Food | **2.97%** | [get-ryze.ai](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026) / [Two Minute Reports](https://twominutereports.com/facebook-ads-benchmarks) |
| CVR, Food & Beverage | **1.89%** | mismas |
| IGV sobre el gasto de Meta en Perú | **+18%** | [Paradero Digital](https://www.paraderodigital.pe/publicidad-en-facebook-instagram-y-whatsapp-precios-y-costos/) |
| CPC Google Ads, restaurantes, Perú | S/0.40 – S/2.50 (−20/−40% en provincias) | [ads.com.pe](https://ads.com.pe/google-ads-precio/) |
| WhatsApp, costo por conversación (real, Perú) | S/0.27 – S/0.62 | Paradero Digital |

**Cadena aritmética del CAC:** CPM ÷ (1000 × CTR × CVR) × 1.18 → **S/10.51 a S/25.23**.
El CPC implícito (S/0.168–0.404) cae dentro del CPC medido por separado → los dos datos se
validan entre sí.

## Canal de oficinas

| Parámetro | Valor | Fuente |
|---|---|---|
| Frecuencia de pedidos de oficina | **81% semanal o más** | [ezCater](https://www.ezcater.com/lunchrush/restaurant/introduction-to-catering-how-big-is-the-opportunity/) |
| Quien probó un restaurante por comida pagada por su empleador y luego pidió por su cuenta | **70%** | [ezCater](https://www.ezcater.com/company/corporate-solutions/recurring-employee-meals/) |
| Organizaciones con programa de comidas recurrente | 43% (+17% vs 2024) | ezCater |

## Metodología de pronóstico sin historial

| Parámetro | Valor | Fuente |
|---|---|---|
| Sobreestimación media de pronósticos de **demanda** | **+106%** (210 proyectos; 9 de cada 10 sobreestimados) | [Flyvbjerg, Holm & Buhl, *JAPA* 71(2)](https://www.tandfonline.com/doi/abs/10.1080/01944360508976688) |
| Modelo correcto para compra repetida no contractual | **BG/NBD** | [Fader, Hardie & Lee 2005](http://brucehardie.com/papers/018/fader_et_al_mksc_05.pdf) |
| Curva de retención discreta (la que se usó, sobre índice de compra) | **sBG** | [Fader & Hardie, *JIM*](https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/Fader_hardie_jim_07.pdf) |
| Fracaso de restaurante independiente, año 1 | **17%** (vida mediana 3.75 años si ≤5 empleados) | [Luo & Stark 2014, microdatos BLS](https://arxiv.org/abs/1410.8603) |
| Fracaso año 1/2/3, acumulado 3 años | 26% / 19% / 14% → 59% | [Parsa et al. 2005, n=2,439](https://news.osu.edu/restaurant-failure-rate-much-lower-than-commonly-assumed-study-finds/) |
| Ganancia de combinar métodos de pronóstico | −12.5% de error (rango −3% a −24%) | [Armstrong, *Combining Forecasts*](https://marketing.wharton.upenn.edu/wp-content/uploads/2020/07/96-JSA-Combining-Forecasts.pdf) |
| Bass diffusion, promedios de 213 aplicaciones | p = 0.03 · q = 0.38 | [Sultan, Farley & Lehmann 1990](https://journals.sagepub.com/doi/abs/10.1177/002224379002700107) |

## Mercado de Trujillo

| Parámetro | Valor | Fuente |
|---|---|---|
| Provincia de Trujillo, 2026 | 1,233,854 hab. | INEI/Minsa vía comoes.pe |
| NSE de La Libertad **urbano** (personas) | AB 10.7% · C 33.5% · D 33.8% · E 22.0% | [APEIM 2020](https://apeim.com.pe/wp-content/uploads/2022/08/APEIM-NSE-2020.pdf) |
| Hogares con internet, Perú | 59.7% (III trim. 2025) | [INEI](https://m.inei.gob.pe/media/MenuRecursivo/boletines/tic-iii-trimestre_2025_1.pdf) |
| Gasto per cápita en comida **fuera del hogar** | S/110/mes (12.3% del gasto) | INEI/ENAHO 2024 vía La República |
| **Ticket promedio delivery, provincia** | **~S/15** (Lima ~S/19), dato de 2022 | [Rappi vía Gestión](https://gestion.pe/economia/empresas/rappi-peru-dos-nuevas-ciudades-donde-llegara-el-crecimiento-de-turbo-y-mas-cobertura-en-lima-delivery-plataformas-comida-noticia/) |
| Rappi Trujillo | 1,379 restaurantes · 48-50 en categoría Sándwiches | [Rappi](https://www.rappi.com.pe/trujillo/restaurantes/category/sandwiches) |
| Actividad de restaurantes, Perú (interanual) | dic-25 +4.22% · ene-26 +5.97% · feb-26 +7.29% | INEI |

**El ticket de S/15 es el contraste más incómodo y el supuesto más frágil del modelo:**
SND//WCH cobra S/20.90–34.90 por sándwich más S/6–15 de reparto. Si el CVR real fuera la
mitad del benchmark por ese precio, el CAC se duplica.

## Efecto del programa de fidelidad (ya está construido en la app)

| Parámetro | Valor | Fuente |
|---|---|---|
| Tasa de retorno: base vs. miembro de fidelidad | 7% → ~30% | [Toast, Regulars Report 2026](https://pos.toasttab.com/blog/data/regulars-report) |
| Frecuencia de visita | +20% global · **+22% a 90 días en LATAM** (200+ restaurantes) | [Restroworks](https://www.restroworks.com/blog/restaurant-loyalty-program-statistics/) · [Welcome Back](https://www.welcomeback.io/en/blog/how-to-increase-restaurant-visit-frequency) |

---

## LO QUE NO SE PUDO FUNDAMENTAR

No usar ninguno de estos como si fuera dato. Están acá para que una sesión futura no los
vuelva a buscar en vano ni los invente:

1. **Curva de recompra por número de pedido específica de delivery** (1→2, 2→3). Solo existe
   la de e-commerce genérico (27/45/54), con atribución contradictoria entre fuentes.
2. **Pedidos por usuario por mes en Perú.**
3. **Retención mensual / churn de restaurantes en Perú o Trujillo.**
4. **Costo por cuenta corporativa adquirida**, en cualquier moneda. Es el dato que falta para
   proyectar el canal de oficinas — solo puede salir de medirlo.
5. **Costo por cliente referido en negocios de comida** (el US$10-30 que circula es de B2B SaaS).
6. **Costo por conversión de degustación** en comida a domicilio.
7. **Tarifas de micro-influencers gastronómicos en Perú** y su conversión real.
8. **Hogares de Trujillo (cifra vigente)**; el único dato hallado es de 2006.
9. **NSE de la ciudad de Trujillo** y corte C1/C2 — solo hay APEIM departamental urbano, y
   la edición accesible es 2020 (base ENAHO 2019).
10. **Penetración de apps de delivery en Trujillo**, ticket local actualizado, y precios de
    la competencia sanguichera trujillana.
11. **Cualquier benchmark de un negocio de un solo operador sin local**, que es el caso real
    de SND//WCH. Todas las fuentes miden cadenas o plataformas.

## Sesgo conocido de las fuentes de retención

Bloom, Toast, Olo, Paytronix y Restroworks son **blogs de proveedores de tecnología para
restaurantes**, no estudios independientes: tienen interés comercial en que la retención
parezca un problema grave. Tratar como orden de magnitud, no como verdad. Las de
metodología (Flyvbjerg, Fader & Hardie, Luo & Stark, Parsa, Armstrong) sí son académicas.
