# Contexto de negocio, costos y modelo

Todo lo que afecta una decisión de precio, margen o marketing. Salió de `CLAUDE.md` el
2026-09-17 por tamaño.

**Léelo ANTES de tocar cualquier precio, receta, recompensa o cálculo de rentabilidad.**
No es material de referencia opcional: acá están los rendimientos de cocción, los precios
reales cotizados por el dueño y los supuestos de los que cuelga todo el modelo. Un cálculo
de margen hecho sin esto usa el precio del insumo crudo y sale ~1.85x optimista.

---

## Contexto de negocio (mantener actualizado — afecta toda decisión de precio/margen)

- **El negocio aún NO ha abierto** — fecha de apertura confirmada por el dueño 2026-08-01:
  **a más tardar la segunda semana de octubre de 2026** (movida desde el 7 de septiembre por
  trámites de permisos, confirmado por el dueño 2026-09-02 — los modelos de `modelo/` que
  arrancan en `date(2026, 9, 7)` quedan desfasados y hay que re-correrlos con la fecha nueva:
  el "mes 3" y el "mes 6" se mueven con ella). Todo lo que hay hoy en `orders`/`customers` en
  Supabase es data de prueba (unos 10 pedidos, 2 clientes) — NO representa ventas reales.
  Cualquier proyección financiera hecha antes del lanzamiento es una SIMULACIÓN basada en
  referencias/benchmarks, nunca un pronóstico con historial real — debe reconstruirse con
  datos reales apenas el negocio esté operando y haya volumen real que medir.
- **⚠ EL COSTEO IGNORABA LA MERMA DE COCCIÓN HASTA EL 2026-08-22 — no repitas el error.**
  Cuando compras 1 kg de carne cruda NO salen 1 kg de porciones. Rendimientos reales
  medidos contra referencias (ver `recetas/detalle-res.md` y `recetas/detalle-pollo.md`,
  con fuentes): **res 0.54** (limpieza 10% + cocción 40%), **pollo 0.64-0.69**,
  **res del corte laminado 0.567**. El costo real de la proteína terminada es **~1.85x**
  el que daba el cálculo anterior (85 g × precio/kg del insumo crudo). Costos por porción
  YA con merma: P01 S/3.15/S/6.30 · P02 S/2.47/S/4.95 · P03 S/2.49/S/4.97. Los de P04
  (atún ~S/4.82/S/9.64), P05 (embutido ~S/4.29/S/8.59) y P06 (albóndiga ~S/1.34/S/2.68)
  son **estimados sin cotizar**. Cualquier cálculo de margen parte de estos números, no
  del precio del insumo crudo.
  **⚠ El atún YA ESTÁ COTIZADO desde el 2026-09-04: S/4 la lata de 140 g, al por mayor**
  (dato del dueño). Eso es **S/43.96/kg escurrido** con la lectura conservadora (140 g de
  contenido neto, 65% de rendimiento al escurrir), contra los **S/67/kg investigados online**
  que usaba el modelo. La porción de 85 g de ensalada (68 g de atún + 17 g de mayonesa) pasa
  de **S/4.82 a S/3.25**, y la de 170 g de S/9.64 a S/6.50. **El atún deja de ser la proteína
  de peor margen del catálogo y pasa a estar sana en los dos tamaños** (42.0% y 41.7% contra
  51.3% y 51.9%). Su precio de venta NO se tocó: lo que cambió es el costo.
  **Confirmado por el dueño 2026-09-04: los 140 g son CONTENIDO NETO**, así que la lectura
  conservadora (S/43.96/kg escurrido) es la correcta y ya no hay incertidumbre acá.
- **Margen de insumos+empaque**: base de trabajo acordada con el dueño de 45% del precio
  de venta — deliberadamente conservador/alto a propósito. Un cálculo directo con precios
  reales de Perú investigados dio ~26-36% según el producto; el dueño pidió trabajar con
  45% dejando margen extra reservado para mejorar el empaque más adelante. Mano de obra =
  S/0 en los cálculos (el dueño arma los pedidos él mismo, sin planilla, mientras el
  volumen lo permita — esto deja de ser válido si el volumen crece lo suficiente como
  para necesitar contratar).
- **⚠ EL PAN SE COTIZA POR UNIDAD, NO POR KILO — precio real del proveedor confirmado por
  el dueño 2026-08-22.** **Pan sub S/2 la unidad**, y **el 15CM usa MEDIO pan** → S/1.00 el
  15CM, S/2.00 el 30CM. El análisis financiero venía usando un proxy de S/11/kg × 71 g =
  S/0.78 (15CM) / S/1.56 (30CM), o sea el pan estaba **28% subcosteado**. Ya recalculado en
  `MENU_FINANCIAL_ANALYSIS.md`. Efecto: contribución por pedido S/16.68 → **S/16.42**, y
  **BYO 30CM de res cruzó el techo de 45%** (43.7% → 45.6%), la única combinación del
  catálogo que lo hace. Los 5 Signatures siguen holgados en los dos tamaños.
  **Focaccia: S/13 la entera → 10 porciones de 15CM o 5 de 30CM** (medido por el dueño
  2026-09-03; hasta esa fecha el rendimiento faltaba y la focaccia no se podía costear).
  Costo del pan: **S/1.30 el 15CM y S/2.60 el 30CM**, contra S/1.00 y S/2.00 del pan sub →
  sobrecosto real **+S/0.30 y +S/0.60**. Quedó del lado malo de la sensibilidad que este
  archivo tenía anotada (empataba recién a 13 porciones).
  **El tipo de pan ya NO es una elección gratuita**: `BASE_SURCHARGE` (duplicado en
  `env.ts` y `src/app/01-*`, comparado por `npm run parity`) cobra **S/0.50 y S/1.00** por
  la focaccia — se cobra más que el sobrecosto a propósito, porque el error nunca puede
  caer del lado de subsidiar el pan. Tres detalles que no hay que romper, todos con prueba
  en `tests-api/recargo-pan.test.ts`:
  el recargo va **DENTRO de `basePrice`**, para que **R06** (15CM gratis) lo perdone entero
  en vez de dejar al cliente pagando S/0.50 por un sándwich anunciado como gratis;
  `sizeUpgradeDiff` incluye el salto de pan, para que **R03** (subir a 30CM gratis) también
  lo perdone; y **un pan sin fila en `BASE_SURCHARGE` cobra 0**, nunca un recargo inventado.
  Un **Signature no lleva recargo**: ahí la receta fija el pan, el cliente no lo elige.
  El monto se muestra en la tarjeta del pan **antes** de elegirlo, no en el carrito.
  ⚠ Esto NO cierra el hueco de margen del BYO: **BYO 30CM de res sigue en 45.6%** con pan
  sub, que es donde la focaccia nunca entró. Ese caso se arregla subiendo el BYO, decisión
  que el dueño todavía no ha tomado.
- **Precios de insumos (Perú, julio-agosto 2026)**: res ~S/20/kg, pollo ~S/17/kg,
  **embutido premium (jamón/paté/cabanossi) S/48/kg — precio real confirmado por el dueño
  2026-08-01** (reemplaza el estimado investigado online de S/50/kg usado hasta la v4 de
  `MENU_FINANCIAL_ANALYSIS.md`; la simulación financiera sigue sin recalcular con este
  número, ver ese documento), carne molida ~S/10/kg, queso ~S/35/kg.
  ⚠ **Este párrafo decía hasta el 2026-09-13 que «el atún sigue siendo el único insumo sin
  cotización propia confirmada» y que el análisis usa ~S/67/kg. Es FALSO desde el 2026-09-04**,
  y la contradicción vivía a cuarenta líneas de la sección de arriba que ya dice el precio
  real: **S/4 la lata de 140 g al por mayor = S/43.96/kg escurrido**, confirmado por el dueño.
  Quedan como estimados sin cotizar el rendimiento de P06 (albóndiga) y los precios de carne
  molida (~S/10/kg) y queso (~S/35/kg). Las bebidas caseras (infusiones)
  tienen margen bruto real 61-84%, mucho mejor que los sándwiches — no conviene agregar
  gaseosas embotelladas de reventa (peor margen a precios de delivery creíbles, además de
  diluir la diferenciación de marca que ya se buscó al retirar D01-D05 del catálogo).
- **Gramajes de toppings al estándar de Subway desde el 2026-09-04** (decisión del dueño).
  Entró **T09 Lechuga** (21 g), que era el único ingrediente del set estándar de Subway que no
  existía en el catálogo — y el de mayor volumen al menor costo por gramo, o sea lo que más
  hace que un sándwich se vea lleno por lo que menos cuesta. Tomate subió de 25 a 35 g;
  aceituna, pimiento, cebolla y apio bajaron a su nivel de Subway. **Total 92 g contra 94 g
  antes: el cambio cuesta dos céntimos MENOS.** No fue una decisión de costo sino de reparto.
  La carne ya estaba al nivel (85 g/170 g contra los ~80-90 g que implican los 24-26 g de
  proteína del 6-inch de Subway). **La lechuga NO se agregó a ninguna receta de Signature** —
  entró solo al catálogo de ARMA EL TUYO, donde el cliente elige; meterla en una receta
  cerrada es una decisión de producto que el dueño no ha tomado.
  ⚠ **Subway no cobra las salsas: son gratis e ilimitadas.** Nosotros incluimos 3 y cobramos
  la 4ta a S/2. Cualquier propuesta de cortar la 3ra salsa va EN CONTRA de la paridad con
  Subway, no a favor — decidirlo es del dueño, pero no se puede presentar como "igualar".
  **El queso sigue GRATIS** (decisión del dueño 2026-09-04, tras verse el número: cuesta
  S/0.39 en 15CM y S/0.77 en 30CM, y sale entero del margen).
- **El doble de atún vuelve ENTERO (2026-09-12, decisión del dueño en dos pasos).** Se había
  apagado el 2026-08-21 por DOS motivos. El de MARGEN estaba muerto desde el día siguiente:
  decía «en 30CM se cobraban S/9 por 170 g de atún que cuestan S/11.39», y las dos mitades
  cambiaron —`pDbl` se partió en `pDbl`/`pDbl30` AL DÍA SIGUIENTE y el atún se cotizó el
  2026-09-04 a S/43.96/kg en vez de S/67. Hoy deja ~70% en los dos tamaños. El FÍSICO —«170 g
  de ensalada en un pan de 30CM se desarma»— lo revisó el dueño y lo aprobó, así que el 30CM
  también se prendió. De ahí **dos conjuntos**: `NO_DOUBLE_PROTS` (ningún tamaño) y
  `NO_DOUBLE_30_PROTS` (solo 30CM), **los dos vacíos hoy**. No se borran: el mecanismo cuesta
  nada mantenerlo y mucho reconstruirlo, y hay una prueba que lo ejercita con una lista
  poblada a mano — un mecanismo sin usuarios es el que se rompe sin que nadie se entere. `npm run parity` compara los dos y `assertDoubleAllowed`
  es el único punto de corte del servidor — antes la condición estaba repetida palabra por
  palabra en las dos rutas de tasación. Probado en `tests-api/doble-proteina.test.ts` (7).
  **Lección para el próximo apagón de producto: un motivo escrito en un comentario caduca.**
  Este llevaba tres semanas muerto y nadie volvió a mirarlo porque apagar algo no produce
  ningún error — solo deja de entrar plata.
- **El apio (T08) está RETIRADO del catálogo desde el 2026-09-12** (decisión del dueño: "chau
  al apio"). Su historia es la advertencia: salió de ARMA EL TUYO el 2026-09-04 marcándolo
  `sigOnly` **porque THE FRESH lo llevaba**, y al día siguiente esa receta pasó a atún
  escurrido + mayonesa + pimienta con `tops:[]`. Desde entonces era un insumo que había que
  comprar, lavar y picar al momento **para cero pedidos posibles**, y nadie se enteró en una
  semana — un ingrediente inalcanzable no produce ningún error.
  **Regla que sale de esto: `sigOnly` sin consumidor no restringe, INHABILITA.** Al sacar un
  ingrediente del armador hay que verificar que alguna receta lo use, y al cambiar una receta
  hay que verificar que no deje huérfano a nada. `tests/menu-exclusivity-toppings-sauces.spec.ts`
  lo comprueba solo ahora: lee `SIGS` y falla nombrando cualquier `sigOnly` que ningún
  Signature use (verificado inyectando el defecto con la lechuga).
  El mecanismo `sigOnly` sigue vivo y con consumidores reales — T02 (Pepinillo), P01 (Res) y
  P05 (Embutido) — así que **la anotación de tipo explícita no se borra "porque nadie la usa"**.
- **NO habrá opciones vegetarianas** (decisión del dueño, 2026-09-12), aunque la proteína siga
  siendo obligatoria en ARMA EL TUYO. No proponerlas de nuevo como hueco de catálogo.
- **+S/2 en el 30CM de las 6 proteínas de ARMA EL TUYO (2026-09-04, decisión del dueño).**
  Quedan: Res 24.90 · Pollo teriyaki 23.90 · Pollo cajún 23.90 · Atún 32.90 · Embutido 32.90 ·
  Albóndiga 26.90. El 30CM era donde el BYO se rompía: pan y proteína se duplican pero el
  precio solo subía S/8, así que el piso fijo (S/6.40 a 30CM) se comía el margen. El dueño
  eligió S/2 y no los S/5.32 que harían falta para llevar res exactamente al 45%. **Aplicado en
  código Y en `catalog_prices`** (migración `20260904025131_subir_p30_byo_dos_soles`).
  **Por qué se pasaban pollo y embutido, que es la pregunta que lo destrabó:** el precio que
  cada proteína necesita en 15CM es `S/8.56 + 2.22 × (costo de la proteína)`. El pollo se
  pasaba por 14-19 CÉNTIMOS porque su precio es el más bajo del catálogo y el piso fijo se come
  el 27.7% antes de la proteína; el embutido se pasa por S/1.19 porque su costo es el MÁS ALTO
  de todos (S/4.29 = S/48/kg real) y se cobra igual que el atún, que ahora cuesta S/3.25 — una
  paridad heredada de cuando se creía que ambos costaban ~S/38/kg.
- **NO habrá acompañamientos de comida — decisión del dueño 2026-08-15.** Nada de papas
  fritas, nachos, ni ningún side sólido. El único "acompañamiento" del catálogo son las 4
  bebidas de la casa (que en el código viven bajo `SIDES`/`SIDE_PRICE` por razones
  históricas — ese nombre NO significa que exista o vaya a existir comida de
  acompañamiento). Cualquier análisis futuro que proponga subir el ticket con un side de
  comida está proponiendo algo ya descartado: la palanca equivalente es la bebida, que
  además tiene mejor margen.
- **Empaque: papel manteca brandeado premium + bolsa — confirmado por el dueño
  2026-08-15.** NO se presupuesta aparte ni se suma al costo: el 45% de insumos+empaque
  se fijó deliberadamente por encima del costo real calculado (~26-36%) justamente para
  financiar esto. Ya está dentro del número.
  ⚠ **EL EMPAQUE COSTEADO ERA EL DOBLE DEL REAL, Y NADIE PODÍA VERLO PORQUE ERA UN NÚMERO
  SUELTO (2026-09-23).** El modelo costeaba **S/1.30 por sándwich**, descrito como "papel
  manteca + bolsa, punto medio S/1.10-1.50". Ese S/1.10 salía de `MENU_FINANCIAL_ANALYSIS.md`
  §1, donde dice literalmente **"Empaque/PEDIDO"** y sumaba **caja de fibra de caña
  (S/0.48-0.605) + bolsa + servilleta + sticker**. O sea arrastraba dos errores a la vez:
  **incluía una caja que el empaque real no lleva**, y **era por pedido mientras el modelo lo
  cobraba por sándwich** (el papel es uno por sándwich, pero la bolsa es una por pedido).
  Precios reales conocidos hoy:

  | parte | precio | estado | por |
  |---|---|---|---|
  | papel manteca | **S/0.075** | **COTIZADO dueño 2026-09-23** — S/150 los 2 millares, S/85 el millar | sándwich |
  | bolsa kraft delivery | S/0.35 | cotizado Bio Pack (Lima); el dueño la está recotizando en Trujillo | pedido |
  | sticker | ~S/0.10 | **SIN COTIZAR** — el dueño lo está cotizando; rango normal S/0.04-0.15 | pedido |
  | | **~S/0.53** | por PEDIDO | |

  Eso es **S/0.78 menos por sándwich** que lo costeado, aun en el peor caso (un solo sándwich
  por pedido, o sea la bolsa entera a cada uno): **+S/465/mes a 600 sándwiches**, sin cambiar
  un ingrediente. Con 2 sándwiches por pedido son +S/600.
  **El modelo sigue costeando S/1.30 a propósito** mientras falten las dos cotizaciones:
  equivocarse hacia arriba en un costo es seguro, hacia abajo no. Pero ya no es un literal —
  `modelo/rentabilidad_por_parte.py` lo tiene partido en `PAPEL_MANTECA`, `BOLSA_KRAFT` y
  `STICKER`, cada uno con su estado, para que el próximo que lo lea vea de qué está hecho.
  **Conviene comprar los 2 millares**: S/20 de ahorro por S/65 más de desembolso, con un papel
  que no caduca — a 600 sándwiches/mes son 3.3 meses de stock.
- **Hipótesis (del dueño, 2026-08-15, explícitamente NO una decisión): el 15CM sería el
  tamaño dominante.** Analizada con el modelo v5 y respaldada por el propio producto (la
  app etiqueta 30CM como "Para compartir" y 15CM como "Para uno"; el delivery individual
  es un comensal). Estimación de trabajo: 75-85% de los pedidos en 15CM. Consecuencia
  práctica para cualquier decisión de precio: **si el 15CM es el 80% del negocio, el
  precio de 15CM ES el precio del negocio** — SIG06 a S/17 y las proteínas BYO a S/13-14
  gobiernan la caja mucho más que los precios de 30CM. Rango de sensibilidad medido:
  90% en 15CM → contribución S/10.27/pedido; 60% en 15CM → S/11.71 (21% de diferencia).
  No dar por sentado el número: reemplazarlo con la mezcla real apenas haya ventas
  (`retention_report` ya devuelve `attach.size30Pct`).
- **Precios con DECIMALES desde 2026-08-15 (.90) — la app se construyó asumiendo enteros.**
  Decisión del dueño: +S/0.90 plano sobre cada precio de sándwich (Signatures y proteínas
  BYO); bebidas y adicionales (pDbl, salsa extra) sin cambio. Excepción decidida aparte:
  SIG07 THE CHICAGO (ya retirado, ver arriba), que cobraba S/25 en 15CM y 30CM (el cliente pedía el doble sin pagar
  extra) → **15CM S/22 · 30CM S/29.90**. Consecuencia técnica: la aritmética de punto
  flotante empezó a producir basura visible (18.90 − 3 + 8.47 = 24.369999999999997, y ese
  número se le mostraba al cliente y se mandaba al servidor). Se agregaron `money()` y
  `pz()` en `src/app.ts`: **todo cálculo de dinero pasa por `money()` y todo total visible
  por `pz()`**. Si agregas un cálculo o un display de precio nuevo, úsalos — el servidor
  compara con `Math.round(total*100)` y tolera el ruido, pero el cliente no.
- **Bono de referido asimétrico (decisión del dueño 2026-08-15, recalibrado 2026-08-20)**:
  quien INVITA recibe `REFERRER_REWARD_POINTS = 400` (= un 15CM gratis: DEBE valer siempre
  lo mismo que R06 en `REWARDS`, y el chequeo `npm run parity` ahora lo verifica). El
  invitado recibe `REFERRAL_BONUS_POINTS` (= una bebida gratis, R05 — **160 desde el
  2026-09-13**, ver su propia sección), subido desde 50
  el 2026-08-20 porque él es quien tiene que decidir comprar y S/1.25 no le dicen nada a
  alguien que nunca pidió. Antes ambos recibían 50 (≈S/1.25, el 5% del ticket, muy debajo
  del 10-25% que mueve la aguja). **Los 720/50 que decía esta sección hasta el 2026-08-20
  eran valores muertos**: R06 bajó a 400 el 2026-08-15 y el doc no lo siguió. Las RPC
  `finalize_order_customer_update` y `reverse_referral_bonus` recibieron un parámetro nuevo
  `p_referrer_bonus` para esto — **la reversión por cancelación tiene que descontar el monto
  de cada lado por separado**, con el parámetro único anterior se devolvían 50 de los 400
  otorgados y quedaban 350 puntos regalados por un pedido que nunca existió.
  **Escalera de referidos (#55, 2026-08-30)**: encima de los 400 planos por CADA referido
  convertido, hay un premio extra al 3.º (**160** pts = bebida — eran 120 hasta el
  2026-09-13, ver su sección), 5.º (400 = otro 15CM) y 10.º
  (800 = dos 15CM). Los escalones viven en `REFERRAL_MILESTONES` (`env.ts`) y **están
  duplicados en `src/app/01-*` solo para pintarlos**, con `npm run parity` verificando los
  dos lados — el cliente nunca suma puntos. Quién decide qué escalón toca es
  `nextReferralMilestone()` (cálculo puro, probado en `tests-api/escalera-referidos.test.ts`,
  incluido un test que falla si la escalera llega a costar más que el CAC más bajo medido de
  Meta); quién lo escribe es la RPC `grant_referral_milestone`, cuyo
  `referral_milestone_granted < p_tier` en el WHERE es lo que impide pagarlo dos veces si dos
  referidos convierten en el mismo segundo. Esa columna es **monotónica a propósito**: una
  cancelación baja `total_referrals` pero NO devuelve el escalón, porque los puntos pueden
  estar ya canjeados y quitarlos dejaría el saldo en negativo; lo que sí impide es volver a
  cobrarlo al recuperar el conteo.
- **Método de trabajo real del dueño (confirmado 2026-08-15) — no asumir otro.** (1) **Nunca
  reparte**: el motorizado siempre es aparte y lo paga el cliente (ver punto siguiente).
  (2) **Cocina por TANDAS 1-2 veces por semana** — proteínas, salsas y vegetales quedan
  listos; en hora de servicio cada pedido es solo **armar** el sándwich (~4-5 min con todo
  en mise en place), no cocinar desde cero. (3) Cocina **solo**, sin ayudante.
  Consecuencia: el techo de capacidad NO es el de "una persona cocinando cada pedido"
  (~9/día) sino mucho más alto (~40+/día); el cuello de botella real es la demanda, no la
  cocina. `MAX_ORDERS_PER_HOUR` en `orders.ts` se subió de 6 a 10 por esto. Cualquier
  modelo de capacidad futuro parte de acá.
- **Costos fijos mensuales: menos de S/500 — opera desde casa** (confirmado por el dueño
  2026-08-15). Sin alquiler de local. Los S/950 que usó el modelo v5 eran una estimación a
  ojo y estaban altos por casi el doble.
- **Distrito y zona de precio son DOS cosas distintas en el checkout (desde 2026-08-28).**
  El **distrito** (`DELIVERY_DISTRICTS` en `src/app.ts`) es obligatorio y decide si el
  pedido se puede entregar: los que están fuera de cobertura salen listados pero
  deshabilitados ("todavía no llegamos aquí"), y el distrito elegido se ADJUNTA al texto de
  la dirección que va al servidor (no hay columna propia; el motorizado igual lo necesita
  impreso). La **zona de precio ya no existe desde el 2026-09-02** — el envío se cobra por
  distancia real (ver abajo); `DELIVERY_PRICE_ZONES`/`DELIVERY_ZONE_FEES` sobreviven SOLO
  como respaldo del servidor para un cliente sin coordenadas. Antes la cobertura se adivinaba buscando el nombre del distrito dentro del
  texto libre de la dirección: quien no lo escribía pasaba sin querer y quien sí lo escribía
  se enteraba recién al tocar PAGAR. Ese substring (`DELIVERY_EXCLUDED_ZONES`, duplicado en
  `src/app.ts` y `env.ts`) sigue siendo **la única defensa real** — `assertAddressAllowed`
  en el servidor no ve el selector — así que recortar cobertura exige tocar los DOS lados,
  no solo marcar `out:true` en la lista de distritos.
- **El delivery se cobra por DISTANCIA REAL desde el 2026-09-02, no por zona.** El reparto
  lo hace un tercero con 50+ motorizados, coordinado por un grupo de WhatsApp, que cobra
  **S/2 por kilómetro** (dato del dueño). Hasta esa fecha la app cobraba un monto plano por
  ZONA **que elegía el propio cliente** en un desplegable, con `media` (S/8) por defecto: el
  cliente elegía su propio precio de envío y elegir el más barato no le costaba nada. El pin
  del mapa existía pero **solo AVISABA** del desajuste, y su texto llegaba a decir "puede que
  el motorizado te pida la diferencia al llegar" — una promesa sobre lo que haría un tercero.
  El dueño creía que la app ya cobraba por distancia; no lo hacía.
  Ahora: `km cobrables = haversine(pin, local) × DELIVERY_ROAD_FACTOR` y
  `tarifa = techo(max(DELIVERY_MIN_FEE, km × DELIVERY_KM_RATE) al medio sol)`. Las cuatro
  constantes más `STORE_LAT`/`STORE_LON` están duplicadas cliente/servidor y las compara
  `npm run parity` — si se desajustan, el cliente muestra un monto y el servidor cobra otro,
  y la diferencia sale del bolsillo del dueño al pagarle al motorizado.
  Detalles que no hay que romper: **el redondeo va hacia ARRIBA** (el error nunca puede caer
  del lado de quedarse corto, porque el delivery no tiene margen del que salga la
  diferencia); **`billableKm` devuelve `null` y nunca 0** cuando no puede medir (un 0 le
  cobraría el mínimo a alguien a 10 km); **el pin se pide una sola vez por dirección**
  (`saved_addresses.lat/lon` ya existían y `pickAddr` las restaura — si la dirección guardada
  no las tiene, se LIMPIAN, porque cobrar la distancia de la dirección anterior es el peor
  error posible acá); y **el servidor cae al cobro por zona si no recibe coordenadas**, a
  propósito, para que un shell viejo servido por un service worker desactualizado pueda pagar
  igual en vez de encontrarse el checkout roto.
  **`DELIVERY_MIN_FEE = 5`** es el mínimo real que el grupo de motorizados le cobra al dueño
  por un viaje corto (confirmado 2026-09-02): por debajo de 2.5 km la tarifa la fija ese piso
  y no los kilómetros. `orders.delivery_km` guarda los km cobrados para poder comparar contra lo que
  el motorizado cobró ese día.
  El monto se cobra dentro del mismo pago del pedido; el dueño le paga al motorizado con ese
  dinero. El negocio no gana ni subsidia el
  reparto. En pagos con tarjeta el fee se "engorda" por `CULQI_FEE_RATE` para que la
  comisión de Culqi no se coma el pass-through. **Error real cometido 2026-08-15**: el
  modelo financiero v5 metió al motorizado como costo fijo de S/1,100/mes y al reparto
  como pérdida de S/0.60/pedido, tomando eso de la sección "opciones de reparto" del
  informe de un agente en vez de leer `env.ts` donde ya estaba resuelto. Eso inventó un
  "valle del motorizado" inexistente y convirtió una meta alcanzable (S/3,000 netos en el
  mes 6, 74% de probabilidad) en imposible (mes 8). Corregido en v5.1. Antes de modelar
  cualquier costo operativo, revisar si el código ya lo resuelve.
- **Comisión de pago (Culqi/tarjeta)**: nunca se restaba del margen antes de esta sesión
  de análisis — estimar ~4-5.5% efectivo sobre pagos con tarjeta en cualquier cálculo de
  rentabilidad. Yape/Plin manual no paga esta comisión — es ahorro real, no solo
  preferencia operativa.
- **Yape/Plin es el MÉTODO DE PAGO POR DEFECTO desde el 2026-09-03** (`manualPayMethod`
  arranca en `'yape'`, no en `null`). Antes arrancaba en null, que es TARJETA: quien no
  tocaba el selector terminaba en Culqi pagando 5.5%. **El default no es un detalle de
  interfaz — es el que elige la mayoría, porque la mayoría no elige.** Al volumen del plan,
  mover el reparto tarjeta/Yape del 60% al 30% vale ~S/487/mes sin adquirir a nadie, y es
  la única de las tres fugas de margen que además le cuesta MENOS al cliente: el recargo de
  delivery engordado (`deliveryFeeAmount`) desaparece. Es un default, no un embudo: la
  tarjeta sigue a un tap, con su razón escrita al lado ("Automático") y el aviso del
  recargo. Lo que hay que cuidar al tocar esto (todo con prueba en
  `tests/yape-por-defecto.spec.ts`, cuyo modo de fallo es **silencio**: si alguien devuelve
  el estado inicial a `null` nada revienta, el negocio solo vuelve a pagar comisión):
  el botón de Yape muestra el ahorro **hipotético** de la tarjeta y por eso NO puede
  calcularse con `deliveryFeeAmount()`, que ya no engorda nada cuando Yape está elegido;
  y prender/apagar el crédito interno pasa por `toggleCredit()`, que **devuelve** el default
  al apagarse — el `manualPayMethod=null` que había escrito dentro del `onclick` dejaba al
  cliente en tarjeta después de dos taps en una casilla que quedó desmarcada.
  El costo real de este default lo paga el dueño en tiempo: cada pago manual hay que
  confirmarlo contra la cuenta (abaratado por el lector de comprobantes #28 —que NO confirma
  el pago, solo lo lee— y la confirmación por lotes del panel).
- **Subida de margen del 2026-08-22 (decisión del dueño, ya aplicada en código Y en
  `catalog_prices`).** Se hizo DESPUÉS de recostear todo el menú con la merma real; los 5
  Signatures ya cumplían el techo de 45% y esta subida es para ganar margen, no para tapar
  un hueco. Cuatro cambios:
  1. **+S/2 en los 5 Signatures**, en AMBOS tamaños (subir solo uno habría cambiado el
     valor de R03, que perdona la diferencia p30-p15). Quedan: The Original 20.90/26.90 ·
     The Marinara 21.90/28.90 · The Smoke 23.90/34.90 · The Fresh 20.90/34.90 ·
     The Teriyaki 19.90/25.90. **Las proteínas de ARMA EL TUYO NO se tocaron** — el dueño
     autorizó los Signatures, no el BYO. Consecuencia a vigilar: las combinaciones más
     ajustadas del catálogo ahora son BYO 30CM de res (43.7%) y de atún (43.2%).
  2. **`pDbl` deja de ser plano**: ahora hay `pDbl` (15CM) y `pDbl30` (30CM). El recargo
     no escalaba con la porción que agrega, así que en 30CM costaba más de lo que cobraba
     en 3 de 4 proteínas (res 105%, embutido 95%, pollo 83% del precio). Es el MISMO
     defecto que ya había obligado a apagar el doble de atún (`noDouble`), solo que ahí se
     apagó el producto en vez de corregir la estructura. Se subió solo donde pasaba el 45%.
  3. **Bebidas +S/2 (y +S/3 el chai)**: 6/5/6/9. El margen de 61-84% que se venía usando
     costeaba SOLO el insumo, nunca el envase. **El envase ya está COTIZADO Y COMPRADO
     (dueño 2026-09-05): S/138 por 200 unidades = S/0.69 la botella**, bastante menos que el
     ~S/1 que se venía estimando. **Y el tamaño ya está decidido: MEDIO LITRO** (dueño
     2026-09-06) — antes se costeaba contra un vaso de 350 ml que nunca se eligió, o sea 43%
     menos bebida. Ver "Las bebidas se costean por medio litro" más abajo.
  4. **Combo bajado de S/2 a S/1** y **topes de bebida gratis (R05_FLAT_WAIVER y
     OFFPEAK_DRINK_PROMO_CAP) subidos de 4 a 6**. Lo primero porque a S/2 el combo se comía
     del 58% al 118% de lo que deja una bebida (THE MIDNIGHT en combo dejaba −S/0.31); lo
     segundo porque con bebidas a S/5-9 un tope de S/4 dejaba "BEBIDA // GRATIS" sin cubrir
     una sola bebida del catálogo — promesa falsa, la misma clase que ya obligó a retirar
     los badges MÁS PEDIDO y EDICIÓN LIMITADA. Los puntos de R05 NO cambian (120): a S/6 de
     tope quedan en 20 pts/sol, justo donde ya está R06.
  **Efecto medido**: contribución neta por pedido **S/13.82 → S/16.68** (+21%), asumiendo
  mezcla 80% en 15CM, 25% de pedidos con bebida y 60% pagando con tarjeta.
  **Pendiente detectado y NO resuelto**: la "tasa de cambio" del programa de puntos quedó
  invertida — R03 cuesta 40 pts/sol y R04 53 pts/sol, contra 20 pts/sol de R05 y R06. Las
  recompensas caras salen más baratas en puntos que las baratas. Revisar con datos reales.
- **Programa de puntos**: recompensas (R02-R06 en `catalog.ts`) recalibradas para que el
  costo real de honrar cada canje sea consistente con el 45% de insumos de arriba — si
  ese % cambia de nuevo (ej. con datos reales de proveedor), estos puntos deberían
  revisarse también. La tarjeta de regalo (`GIFT_CARD_POINTS_PER_SOL` en
  `customer.ts`/`app.ts`) usa el mismo criterio (40 pts/sol) y debe recalibrarse junto.

## Las bebidas se costean POR MEDIO LITRO, y el envase es la mitad del costo (2026-09-06)

El tamaño del vaso era la decisión pendiente que bloqueaba el costeo, y la resolvió el envase
comprado: **medio litro**. Con eso y los S/0.69 de la botella, `modelo/costo_bebidas.py` deriva
el insumo de las tandas del `RECETARIO.md` con el origen de cada precio por kilo etiquetado
(`[WEB]`, `[ESTIMADO]`), en vez del número por vaso escrito a mano que se venía usando.

| bebida | precio | insumo | envase | costo | costo % |
|---|---|---|---|---|---|
| The Cool // Mint | S/6 | S/0.48 | S/0.69 | S/1.17 | 19.4% |
| The Midnight // Brew | S/5 | S/0.72 | S/0.69 | S/1.41 | 28.2% |
| The Bloom // Hibiscus | S/6 | S/1.20 | S/0.69 | S/1.89 | 31.5% |

**El envase no escala con el volumen y el insumo sí**, así que pasar de 350 ml a medio litro
sube el costo mucho menos de lo que parece (The Cool: +2.4 puntos por 43% más de bebida). Es la
palanca más barata de valor percibido que tiene el negocio. Y por lo mismo, cualquier bebida
futura hay que costearla **por botella**, nunca con un porcentaje plano: The Bloom cuesta 2.5x lo
que The Cool y las dos se venden a S/6.

**EL CHAI (D09) SALIÓ DEL MENÚ** (decisión del dueño 2026-09-06). A medio litro quedaba en
**42.5%** de costo, la única bebida cerca del techo — y por un motivo que ninguna cotización
arregla: **media botella de chai es media botella de LECHE**, un insumo que se compra, mientras
que en las tres infusiones el volumen es agua. La receta queda completa en `RECETARIO.md` PARTE 4.
Consecuencia a no perder de vista: con el chai fuera, la bebida más cara vale S/6, que es
exactamente `R05_FLAT_WAIVER`. **El tope de R05 no recorta nada hoy y sigue haciendo falta** —
`tests-api/carrito.test.ts` lo fija sobre todo `SIDE_PRICE`, así que una bebida cara futura entra
sola a la prueba en vez de quedar fuera en silencio.

## El precio por kilo de una proteína no dice nada hasta dividirlo por el rendimiento (2026-09-06)

**PAVO (P08) entra a ARMA EL TUYO a S/15.90 / S/28.90** (decisión del dueño), devolviéndolo a
cuatro proteínas después de que res y embutido salieran por rentabilidad el 2026-09-05.

Lo que lo hace viable es estructural: **es fiambre, así que NO tiene merma de cocción**. Un kilo
comprado es un kilo servido, mientras que res rinde 0.54 y pollo 0.64-0.69 y su costo real por
porción termina siendo ~1.85x el del insumo crudo. Por eso el pavo, que cuesta **más del doble
por kilo que la res** (S/44.20 contra S/20), sale **más barato por sándwich**. 85 g = S/3.76 y
170 g = S/7.51 → **44.7% de costo en los dos tamaños**, justo debajo del techo.

La fórmula que usa el armador: `precio = 2.222 × (piso fijo + costo de la proteína)`, con el piso
en S/3.35 (15CM) y S/5.41 (30CM). `pDbl 9 / pDbl30 17` se calcularon contra el costo REAL de la
porción extra (41.8% y 44.2%), **no copiando el de otra proteína** — que es el defecto que ya
obligó a partir `pDbl` en dos y a corregir P06.

**COTIZADO Y CONFIRMADO (dueño, 2026-09-12): el precio al por mayor es el MISMO, S/44.20/kg.**
Se derivaba del *retail* de Braedt en Metro/Vivanda (S/43.75/kg) y quedaba como el número más
frágil del catálogo — el pavo entró a 44.7% de costo, a tres décimas del techo, así que
cualquier sorpresa lo pasaba. Ya no hay sorpresa: el 44.7% es real.
Dato que conviene no perder si algún día hay que renegociar: **Sigma Alimentos es dueño de
Braedt, Otto Kunz y La Segoviana a la vez**, así que entre esas tres no hay competencia real de
precio. Los independientes son San Fernando y Laive; Makro tiene local en Trujillo.

**Ningún Signature lleva pavo.** Meterlo en una receta cerrada es una decisión de producto que el
dueño no ha tomado. Tampoco pasa por el ciclo de tandas: no hay nada que cocinar, enfriar ni
conservar, así que queda fuera de la alerta de caducidad de tanda.

Con esto, `modelo/rentabilidad_por_parte.py` reporta por primera vez **"Nada pasa el techo"** en
todo el catálogo.

## Las tres palancas del modelo: medidas, no supuestas (2026-09-06)

`PREDICCION_V12.md` concluye que la meta de **S/5,000 netos sostenidos NO se alcanza con más
publicidad** —a S/20,000/mes el resultado empeora— sino con tres números. Ninguno estaba
medido: el modelo los ASUME y mover cualquiera unos puntos cambia la conclusión entera.

| palanca | el modelo asume | por qué importa |
|---|---|---|
| mezcla ARMA EL TUYO | 50% | un Signature deja ~S/5.50 más que un armado |
| attach de bebida | 25% | +15 puntos valen ~S/0.48 por pedido, sin adquirir a nadie |
| referidos por 100 pedidos | 6 | la ÚNICA que convierte "no llega nunca" en "sostiene desde feb-27" |

**Ahora se miden.** `retention_report` devuelve un bloque `palancas` con las tres, y la
pantalla **Admin // Marketing // Las tres palancas** las enseña contra lo que el modelo asume.
Dos detalles que no hay que romper: la salvaguarda de fiabilidad (mínimo 20 pedidos) va
**ARRIBA** de las cifras y no al pie, y donde no hay dato va un **guion, nunca un 0** — un 0 se
lee como "medimos y dio cero". La mezcla se cuenta en **UNIDADES y no en pedidos**: un pedido
puede llevar un Signature y un armado a la vez.

**Los supuestos del modelo viven en `MODELO_SUPUESTOS` (`env.ts`) y viajan al cliente desde el
servidor**, nunca escritos en la pantalla. `npm run parity` los compara contra el Python
(`FRAC_BYO`/`DRINK_ATTACH` en `modelo/comparativa_menu.py`, `VIRAL` en
`modelo/modelo_v11_metas.py`) — es el único chequeo del script que cruza lenguajes, y la única
defensa contra que la pantalla mida contra una meta que el modelo ya movió.

### ⚠ `actAdminRetentionReport` estaba importada y NUNCA registrada

El reporte de cohortes —que este archivo llama "el mejor dato del panel"— no era alcanzable
desde la app: solo lo veía el correo mensual, que llama al RPC por su cuenta. Modo de fallo
puro silencio: la importación compila y `deno check` no marca un import sin usar dentro de un
objeto. Ya está en `ACTIONS`. **Al agregar una acción nueva, registrarla es un paso aparte de
importarla** — y desde el 2026-09-13 sí avisa algo: `npm run check:acciones`, verificado
inyectando exactamente este defecto (quitarle la línea de `ACTIONS` a `admin-retention-report`).

### Lo que se empujó, y lo que deliberadamente no

- **Referido**: la invitación estaba DOBLEMENTE condicionada — solo si el cliente calificaba, y
  solo en el render inmediato tras hacerlo. Calificar es opcional, así que el momento de mayor
  intención quedaba sin usar. Ahora aparece en los tres estados de un pedido entregado, y
  **debajo** del formulario de calificación, que sigue primero y sin tocar: la calificación
  tiene valor propio (testimonios, y enterarse de un problema) y cambiarla de sitio sería
  canjear una cosa por otra en vez de sumar. Los dos bonos se interpolan de las constantes.
- **Bebida**: el mecanismo ya estaba bien construido (empujón en los dos flujos, con
  descripción y de un toque). Lo único débil era el título, que encabezaba con el ahorro de
  S/1 —el combo bajó de S/2 y nadie revisó el texto— sobre un producto de S/5-6. Ahora
  encabeza con el producto y nombra el descuento de segundo.
- **Mezcla**: el menú YA abre en Signatures (`homeTab='sig'`), así que el empujón estructural
  existía. Se agregó un puente desde ARMA EL TUYO hacia el Signature recomendado, **debajo** de
  la lista de panes: quien tocó esa pestaña ya eligió armar el suyo, y cortarle el paso al
  entrar sería un obstáculo. **NO se degradó ARMA EL TUYO para mover la mezcla** — es la mitad
  de la identidad de la marca (los dos hermanos), y esconderlo o encarecerlo rompería el
  producto para ganar céntimos. `tests/palancas-del-modelo.spec.ts` fija las dos cosas a la vez.

**Lo que sigue sin medirse y decide igual de fuerte: el CAC real.** Sale de blogs de agencia,
no de medición propia, y todo el modelo cuelga de él. Se mide poniendo los secrets de Meta
(`docs/CONFIGURAR_META.md`) — es el bloqueo número uno del negocio.

## El techo de CAC es el del CLIENTE, no el del primer pedido (2026-09-13)

**Corrección del dueño**: la publicidad es **reinversión** y no debe limitar hasta S/10,000; y
**"mano de obra = S/0" deja de ser regla** — tiene que haber sueldo para él, y a futuro se
puede contratar.

El freno comparaba el CAC contra S/13.63, que es lo que deja **un solo pedido**. El CAC de Meta
arranca por encima de eso en todo el rango, así que el freno **cortaba siempre** y el negocio se
quedaba sin su único canal de adquisición — el modelo lo mostró clavado en −S/500 para siempre.

`cacTechoValorVida()` (`env.ts`) usa lo que deja el cliente COMPLETO. Lo que no hay que romper:

- **La cadena de reórdenes es explícita, no un ajuste opaco.** [FUENTE propia 2026-09-13]
  Genesys, delivery: solo el **45%** vuelve a pedir; de esos, **85%** hace un tercero; después,
  **60%** sigue. Da **2.41 pedidos por cliente**. El modelo heredado daba 2.20 por un ajuste sBG
  sobre otras fuentes — **dos derivaciones independientes dentro del 10%**.
- **`confianzaValorVida` (0.75) recorta a propósito**: la repetición de ESTE negocio no está
  medida. Con 1.0 se le cree entero a un dato prestado.
- **Los DOS techos viajan al cliente y los dos se muestran.** El de vida contesta "¿se paga si
  vuelve como vuelve la industria?"; el del primer pedido, "¿ya se pagó hoy?". Colapsarlos
  escondería cuál se contestó.
- **El freno sigue cortando** cuando ni el valor de vida alcanza. Reinvertir no es gastar a ciegas.

### ⚠ Y el CAC heredado estaba 36% subestimado

[FUENTE propia] Benchmarks 2026: CTR **1.85%** (Alimentos y Bebidas) a **2.97%** (Restaurantes),
CVR **1.54%** a **1.89%**. El modelo v11 tomó **el extremo optimista de los dos a la vez**, y
como el CAC es inversamente proporcional a ambos, el error se MULTIPLICA: el medio real es
**S/24.27**, no S/17.87. Y el CPM tiene un rango de 1:9 entre fuentes (agencia peruana S/5-12 vs
mercados emergentes ≈S/11-45), así que **el CAC medio queda en el filo del techo nuevo**.

### ⚠ UN LANZAMIENTO NO ES UN RITMO — defecto real que introdujo la palanca del mes 3

La simulación midió que lo único que mueve el mes 3 es **avisarle a la red personal**: 200
personas hacen que P(S/3,000 netos en diciembre) pase de 1.2% a 44.7%, y **más publicidad lo
EMPEORA** (a S/8,000 sale peor que a S/0: el gasto se resta hoy y el cliente devuelve en su
segundo pedido, cinco semanas después).

Pero esas 200 caen dentro de la ventana de la línea base y ninguna trae referidor, así que el
promedio simple las leía como **10 clientes orgánicos por día para siempre** — y meses después
el freno restaba ese ritmo inventado, los atribuibles daban 0 y el veredicto era
`sin-incrementales`: **la publicidad apagada por una fiesta de apertura.** Se cierra por dos
vías y las dos hacen falta:

1. **Promedio recortado por arriba** (`ritmoRecortado`, descarta el 20% de días más altos). No
   depende de que nadie etiquete nada, que es su virtud. Su costo va declarado: a volumen bajo
   baja la base unas centésimas, y una base más baja da un CAC más barato — la dirección
   peligrosa. Se acepta porque es de centésimas contra un error de 10 a 3.
2. **`FUENTES_DE_RAFAGA`**: lo que llega marcado como lanzamiento no cuenta como orgánico. El
   mecanismo de atribución **ya existía** (`?src=` → `acquisition_source`): no hubo que construir
   nada, solo usarlo.

**"Avísale a tu gente"** es el primer bloque de Admin // Marketing (antes estaba escondido tras
el rótulo "Contenido semanal", que el dueño no tiene por qué abrir en la semana de apertura), y
**va ANTES del `return` de error de esa pantalla**: no depende del brief semanal, así que un
fallo cargando otra cosa no puede hacer desaparecer la palanca que más mueve los primeros tres
meses.

Ver `PREDICCION_V14.md` para el plan completo y `modelo/modelo_v14.py` para el motor.

## Cinco métodos de predicción, y por qué uno solo no alcanzaba (2026-09-13)

Los modelos v7 a v12 eran **el mismo esqueleto** con entradas distintas: simulación estructural
de abajo hacia arriba con Monte Carlo encima. Si el esqueleto está mal, 20,000 corridas lo
repiten 20,000 veces con una barra de error preciosa alrededor de un número equivocado. En la
competencia M4, **12 de los 17 modelos más precisos usaban combinación**, y el promedio simple
de métodos heterogéneos resulta difícil de batir. `modelo/metodos_de_prediccion.py` contrasta
cinco (`PREDICCION_V13.md`).

Lo que cambió de conclusión, y no por afinar entradas:

- **P(S/5,000 netos en el mes 3) = 0.0% en las 12 combinaciones.** No es de marketing: en
  dic-26 el negocio lleva 2.5 meses abierto. Sale del retrocálculo, que es aritmética.
- **⚠ EL MOTOR NO TENÍA CANAL ORGÁNICO Y NADIE LO HABÍA DICHO.** En el v11
  `nuevos = comprados + referidos`: nadie encuentra el negocio por Google, por el QR de la
  bolsa ni porque un amigo le contó sin usar el código. Es un supuesto fortísimo, **pesimista**,
  y estaba invisible. Ahora es un parámetro que se RECORRE — y es justo lo que mide la ventana
  sin publicidad.
- **Dos métodos independientes convergen dentro del 8%** (cohortes y difusión de Bass) una vez
  alineado el ritmo orgánico. Eso no valida el número: valida que **toda la respuesta cuelga de
  ese único parámetro sin medir**.
- **Con cero orgánico el negocio se queda clavado en −S/500 para siempre.** No pierde más
  porque el freno corta la publicidad; no gana nada porque no le queda motor. Eso no es un
  fallo del freno, es el diagnóstico: **este negocio no tiene motor de crecimiento aparte de lo
  orgánico y los referidos.**
- **S/10,000 es otro negocio**: cabe en una persona (29.6 ped/día) solo SIN publicidad; con
  pauta pasa al techo físico y obliga a contratar, rompiendo el supuesto "mano de obra = S/0"
  que sostiene todo el costeo del menú.
- **Faltaban dos cosas que nunca estuvieron en ningún modelo**: multiplicar por P(el negocio
  sigue abierto) —clase de referencia, vista de afuera— y el **punto único de falla**: el dueño
  solo, sin reemplazo, 20 días caídos al año valen S/673/mes contra la meta de S/10,000.

⚠ **Dos errores propios al implementar Bass, que conviene no repetir**: los coeficientes
publicados (Sultan/Farley/Lehmann) son **anuales** y la primera versión los aplicó
mensualmente, dando S/267,336 de neto en el mes 12 con diez empleados; y **Bass modela la
adopción de una CATEGORÍA, no la cuota de un vendedor** — poner M = todo el mercado asume 100%
de cuota. De ese método se toma **la forma, nunca el nivel**: lo que viaja es la razón
**q/p = 13**, o sea que el boca a boca pesa trece veces la adopción espontánea.

## La línea base orgánica: el dato que solo se puede medir UNA VEZ (2026-09-13)

El CAC del freno contaba como captado por publicidad **a todo cliente nuevo sin referidor** —
incluido el que llegó por el QR de la bolsa, por Google o porque un amigo le contó sin usar el
código. El repo ya lo advertía en la pantalla, pero advertir no arregla el número. Y la
dirección del error importa: Gordon, Zettelmeyer, Bhargava y Chapsky (*Marketing Science*, 15
experimentos en Facebook, 500 millones de observaciones) demostraron que **la atribución
observacional exagera el efecto de la publicidad**; trabajos posteriores lo cuantificaron en
factores de **2 a 5 veces**. Un CAC exagerado a la baja es justo el que hace escalar un canal
que pierde plata.

`lineaBaseOrganica()` (`actions/admin.ts`) mide cuántos clientes entraban **antes del primer
sol gastado**, y `cacFreno` resta ese ritmo antes de dividir. Lo que no hay que romper:

- **La ventana se deriva sola** del primer `ad_spend` con `amount > 0`, nunca de un campo que
  alguien tenga que acordarse de llenar. Una fila cargada en 0 es un día sin campaña, no el
  arranque: tomarla como corte cerraría la ventana antes de tiempo y en silencio.
- **Son los 28 días ANTERIORES al primer gasto, no "desde el primer cliente".** Una cuenta de
  prueba creada hace medio año estiraría el denominador y dejaría la base cerca de cero — la
  dirección peligrosa. Y 28 son los mismos del periodo de medición, así que las dos ventanas
  tienen la misma mezcla de días de semana.
- **Exige 14 días y 10 clientes.** Por debajo, `porDia` es ruido, y restar ruido no mejora una
  medición: la ensucia donde nadie puede verlo. El número se reporta igual para que la pantalla
  diga cuánto falta.
- **Los atribuibles se redondean hacia ABAJO** (`Math.floor`): el error nunca puede acreditarle
  a la publicidad un cliente que iba a venir igual.
- **El margen `1/√n` se calcula sobre los ATRIBUIBLES**, no sobre el total. Restar la base y
  después reclamar la precisión del número grande sería quedarse con lo bueno de las dos cuentas.
- **Con base fiable, el CAC ES el ajustado**; `cacPiso` queda al lado como el extremo optimista.
  Mostrarlos como equivalentes dejaría elegir cuál creer, y en una pantalla que existe para
  frenar el gasto siempre se elegiría el barato. Y la advertencia de arriba **cambia**: seguir
  diciendo "es el mejor caso" después de restar la base pide desconfianza del número más
  verdadero que hay, y eso desgasta la pantalla igual que exagerar.
- **`sin-incrementales` es un veredicto propio** y no se confunde con `sin-conversiones`: acá el
  negocio SÍ sumó clientes, y el hallazgo —que no los trajo la publicidad— es el incómodo. Es
  fiable sin pedir mínimo estadístico: no es una medición imprecisa, es el resultado.
- **`alert-cac-brake` usa la MISMA línea base.** Si la alerta midiera sin restarla sonaría más
  tarde que el panel, o no sonaría, sobre exactamente el mismo día.
- **Sin gasto, la pantalla NO está vacía: está midiendo.** Ese estado era un hueco ("sin gasto
  cargado" y nada más) y es el periodo más valioso de medición del negocio. Ahora es la tarjeta
  titular, con lo que falta en días y clientes, y con la frase de que después no se reconstruye.

### Y el gasto se carga A MANO, así que olvidarse ABARATA el CAC

Todo el freno divide gasto ÷ clientes, y el numerador lo transcribe el dueño del panel de Meta.
Olvidarse tres días deja el numerador corto mientras el denominador sigue creciendo: **el costo
por cliente sale más barato de lo que es y el freno se queda en verde.** La pantalla se ve
perfecta; solo que miente, y hacia el lado que hace escalar.

`gastoDesactualizado()` (cálculo puro) avisa a los **3 días** — uno o dos de atraso son vida
normal en un negocio donde el dueño cocina, y avisar ahí convertiría la alerta en ruido. Va en
la pantalla **arriba de todo lo demás** (es el único aviso que invalida el número entero, no
solo su precisión) y en `alert-cac-brake`, con **su propio límite de frecuencia**: compartir el
de `cac-brake` haría que un día con las dos condiciones mandara solo una, y cuál se perdería
sería impredecible. **Sin ninguna carga NO está desactualizado**: está sin empezar, que es el
estado de la línea base y ya tiene su veredicto — confundirlos haría sonar la alarma todos los
días desde antes de que exista la primera campaña.

Consecuencia de calendario, y es una decisión del dueño ya tomada: **el negocio abre sin gastar
un sol en anuncios durante al menos 14 días.** La campaña arranca después.
Probado en `tests-api/freno-cac.test.ts` y `tests/freno-de-cac.spec.ts`, los dos verificados
inyectando los defectos (no restar la base, el margen sobre el total, aceptar una base corta,
redondear hacia arriba, y las dos mitades de la pantalla).

## El freno por techo de CAC (2026-09-12)

Todo `PREDICCION_V12.md` cuelga de un CAC que **nadie midió**: sale de tasas de agencia y da un
rango de **S/10.51 a S/25.23**, que es la distancia entre "la publicidad sostiene el negocio" y
"lo desangra". Y el número que obliga a que esto exista: al CPM medio el CAC es **S/17.87**
contra una contribución de primer pedido de **S/13.63**. O sea que al precio medio de la
subasta **un cliente comprado no se paga con su primer pedido** — se recupera solo si vuelve, y
la repetición todavía no está medida.

- **`ad_spend`** guarda el gasto diario, cargado a mano desde Admin // Marketing // Freno de
  CAC. Leerlo de Meta por API exigiría el permiso `ads_read` y un token de facturación viviendo
  en el servidor; transcribir un número al día sale más barato y no falla en silencio.
  **`unique(spend_date, platform)`**: cargar el mismo día lo CORRIGE, no lo suma — duplicarlo
  daría un CAC al doble, que es el error que empuja a apagar una campaña sana.
- **El techo se DERIVA** (`cacTechoPrimerPedido()` en `env.ts`), nunca se escribe. Es la
  contribución menos el overhead. Se eligió el PRIMER pedido y no el valor de vida a propósito:
  un techo con repetición exige asumir cuántas veces vuelve alguien, y eso hoy es fe.
- **`npm run parity` verifica las cuatro constantes CORRIENDO `modelo/modelo_v11.py`**, no
  comparando contra una copia — `CONTRIB_PEDIDO` allá no es un literal, lo calcula el modelo a
  partir del catálogo. Es el segundo chequeo del script que cruza lenguajes.
  ⚠ **Y corre el Python con `-B` y `PYTHONPYCACHEPREFIX` a un directorio temporal.** Sin eso el
  chequeo compara contra un modelo VIEJO y no se entera: Python valida su bytecode por
  (mtime, tamaño) del fuente, así que cambiar `0.50` por `0.85` —mismo número de bytes— dentro
  del mismo segundo deja la caché dándose por válida. **Pasó de verdad al probar el chequeo.**
- **El CAC que se muestra es un PISO, no el real**, y el rótulo va PEGADO al número, no al pie:
  cuenta como captado por publicidad a todo cliente nuevo sin referidor, y ahí adentro también
  está el orgánico. Con más gente en el reparto sale más barato de lo que es — para un freno
  esa es la dirección peligrosa. La lectura correcta: **si hasta ese número optimista pasa el
  techo, el real lo pasa seguro.**
- **No suena por debajo del mínimo de aprendizaje de Meta** (50 conversiones cada 7 días,
  escalado al periodo). Avisar ahí empujaría a apagar la campaña justo antes de que empiece a
  funcionar, y ese error además parece prudencia.
- **Gastar y no captar a nadie tiene veredicto propio** (`sin-conversiones`), no se confunde con
  "sin datos": `gasto/0` daría Infinity o NaN y los dos se pintan mal. No es ausencia de
  información, es información pésima.
- `alert-cac-brake` (cron diario, 09:05 hora Lima) es lo que lo vuelve un FRENO y no una
  pantalla que hay que acordarse de abrir — el mismo defecto que ya tenía el reporte de
  cohortes.
- La campaña lista para aprobar está en **`docs/CAMPANA_DE_ANUNCIOS.md`**, con cada cifra
  derivada del modelo. Su conclusión: **salir de la fase de aprendizaje cuesta entre S/2,285 y
  S/3,885 al mes, o sea 4.6 a 7.8 veces TODOS los costos fijos del negocio (S/500)**. Por eso
  la primera campaña se aprueba para MEDIR, no para vender: su entregable es el CAC real.

Probado en `tests-api/freno-cac.test.ts` (11) y `tests/freno-de-cac.spec.ts` (6), los dos
verificados inyectando los defectos. **Dos de esas pruebas nacieron ciegas y hay que saber por
qué**: una comparaba la función del techo contra la misma fórmula que la produce (así que
`return 13.63;` la pasaba entera), y otra comprobaba que el body contuviera un guion —lo cumple
cualquier página con un texto largo— en vez de mirar la cifra. Un chequeo que se mide contra sí
mismo no protege nada.

## La maquinaria de marketing, con la evidencia delante (2026-09-12)

Cuatro investigaciones externas (retención, adquisición orgánica, Meta Ads con presupuesto
chico, referidos) en `docs/MAQUINARIA_DE_MARKETING.md`, cada cifra etiquetada [CAUSAL] /
[BENCHMARK] / [OPINIÓN]. **Casi todo lo publicado sobre marketing de restaurantes lo escribe
quien vende software de marketing para restaurantes** — las cuatro investigaciones lo marcaron
solas. Y hay un hueco real: **no existe un solo estudio de recompra de delivery en Perú a
nivel de restaurante individual.**

Lo que cambia prioridades, y NO es opinión:

- **Las primeras 50 reseñas de Google valen más que el programa de referidos.** Luca (HBS,
  regresión discontinua sobre datos fiscales): **+1 estrella = +5-9% de ingresos**, efecto
  **solo en independientes**, y **50% más fuerte pasadas las 50 reseñas**. Apareció por
  separado en DOS de las cuatro investigaciones. **Hoy la app pide calificación tras la entrega
  y esa calificación se queda adentro: nadie pide nunca una reseña de Google.** Es el hueco más
  caro detectado.
- **NO subir el bono de referido — considerar bajarlo.** Wolters/Schulze/Gedenk (*Marketing
  Science* 2020, experimento de campo con 160,000 clientes): premios más grandes traen **más
  referidos y menos rentables**. Y premiar solo al INVITADO rindió parecido a un premio de dos
  lados que costaba el doble.
- **El 50.3% de las segundas compras cae dentro de los 30 días** y la conversión se desploma
  después del día 45.
  ⚠ **Corregido el 2026-09-13 leyendo el código**: este archivo decía que `remind-second-order`
  toca esa ventana "una sola vez, día 7-10", y **son DOS toques ya construidos** —
  `bounce-back-first-order` a las 20-48 h (con la bebida de regalo) y el recordatorio de día
  7-10—. La versión vieja invitaba a agregar un tercer envío que no hace falta: la ventana
  temprana, que es la que la evidencia señala, ya está cubierta. Lo que sí queda sin tocar son
  los **días 11 a 30**, y para eso no encontré evidencia de que un push más ayude — más avisos
  no es mejor, y este repo ya limita a `MAX_PUSH_PER_RUN` por algo.
- **El descuento recurrente entrena a esperar descuento** (estudio de cupones de Alibaba): baja
  el precio de referencia y sube la sensibilidad al precio **incluso en vendedores que no
  promocionan**. Es el respaldo de que el combo y las recompensas NO son descuentos
  recurrentes, y de que el kill switch exista.
- **Progreso regalado** (Nunes & Drèze 2006, causal): 2 sellos regalados de 10 contra 8 desde
  cero — mismo esfuerzo real — dan **34% contra 19%** de canje. ⚠ **El efecto desaparece si no
  das una RAZÓN del regalo.**
- **Escalones sin barra de progreso son teatro** (Ko & Song, Cornell 2025, restaurantes). Acá
  ya está bien: `REFERRAL_MILESTONES` vive en el cliente justamente para pintarlo.
- **El 84% del compartir ocurre en canales privados** (WhatsApp/DM): el referido nunca se va a
  ver en un dashboard.
- **Hashtags: teatro.** Mosseri (CEO de Instagram) lo dijo explícito. Instagram orgánico con
  cuenta chica alcanza ~9.8% → unas 20 personas por post; comida tiene 0.23% de engagement, de
  los más bajos. **TikTok es la apuesta asimétrica** porque no depende de seguidores.
- **La difusión de WhatsApp SOLO llega a quien te guardó el número** (política de la
  plataforma): es canal de RETENCIÓN, nunca de adquisición.

### El MCP oficial de Meta Ads SÍ está conectado (corrige lo que decía este archivo)

Verificado el 2026-09-12: `mcp__Meta_Ads__*` responde. Cuenta **221839797**, ACTIVA, en
**soles**, presupuesto diario mínimo **S/3.39** — y **`has_payment_method: false`**, así que
hoy no puede gastar. Esto corrige la nota de 2026-08-11 que lo daba por no conectado.
**Sigue sin haber ninguna skill de marketing** en los registros (confirmado de nuevo).

## El freno de CAC y el kill switch de promociones (2026-09-12)

El detalle técnico está más arriba, en su propia sección. Dos cosas que no hay que romper y
que salieron de la investigación:

- **La fiabilidad del CAC se decide con el INTERVALO, no con un umbral.** La primera versión
  usaba el mínimo de aprendizaje de Meta (50 conversiones/7 días → 200 en 28 días) y eso dejaba
  el freno **mudo para siempre**: a S/40/día entran ~75 clientes en 28 días. Ahora se calcula
  el margen `1/√n` (Poisson: ±32% con 10 conversiones, ±20% con 25, ±14% con 50) y solo se
  declara accionable cuando el intervalo cae ENTERO de un lado del techo. La estadística decide
  cuántas conversiones hacen falta, no una constante. El umbral de Meta se sigue reportando
  como CONTEXTO ("este CAC es el de arranque y puede mejorar solo").
- **El kill switch tiene el modo de fallo INVERSO al de la pausa de tienda.** La pausa se
  reanuda sola contra el reloj porque olvidarla encendida cierra el negocio; éste **no se
  auto-revierte nunca** porque si lo bajaste por un código filtrado, que se encienda solo es lo
  peor posible. Por eso guarda la **HORA** y no un booleano: el panel dice "llevas 9 días sin
  promociones", que es lo único que impide que se quede abajo para siempre.
  **NO apaga lo que el cliente ya se ganó** (recompensas, crédito, referidos, sándwich del
  organizador) ni el combo (es estructura de carta: apagarlo haría que el cliente vea un precio
  y se le cobre otro). `tests-api/kill-switch-promociones.test.ts` fija ese límite.
