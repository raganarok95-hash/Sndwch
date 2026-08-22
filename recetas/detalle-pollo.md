# PROTEÍNAS DE POLLO — P02 Teriyaki y P03 Cajún

Recetario operativo SND//WCH · redactado 2026-08-21 · para cocina de casa, una sola persona,
tandas 1-2 veces por semana.

Base: `BRIEF.md` (catálogo real extraído de `src/app.ts` y `supabase/functions/api/catalog.ts`).
Todo dato de fuente externa va citado. Todo dato que NO está confirmado por el dueño va marcado
como **SUPUESTO** o mandado a "Preguntas abiertas" al final. No hay ningún dato inventado
presentado como hecho.

---

## 0. EL HALLAZGO MÁS IMPORTANTE DE ESTE DOCUMENTO

**El costeo actual del negocio usa S/17/kg de pollo. El pollo cocido y porcionado que sale de la
cocina cuesta ~S/29/kg, no S/17/kg.** La merma (limpieza + pérdida de agua al cocinar) se come el
31-36% del peso comprado, y ese peso perdido ya se pagó.

| | P02 Teriyaki | P03 Cajún |
|---|---|---|
| Pollo crudo comprado | S/17.00/kg | S/17.00/kg |
| Rendimiento neto (limpieza × cocción) | 0.69 | 0.644 |
| Insumos de sazón/salsa (por kg crudo) | S/3.07 | S/1.84 |
| **Costo real por kg de producto terminado** | **S/29.09** | **S/29.25** |
| Costo porción 85 g (15CM) | **S/2.47** | **S/2.49** |
| Costo porción 170 g (30CM) | **S/4.95** | **S/4.97** |

**Buena noticia: el objetivo de 45% se sostiene igual, en las dos recetas, en todos los tamaños.**
El colchón que dio el dueño al fijar 45% (contra un costo real calculado de ~26-36%) absorbe la
merma sin problema. El detalle completo está en la §3.

**Mala noticia, y es concreta:** hay dos puntos donde el colchón casi desaparece y conviene saberlo
antes de abrir — el 30CM de SIG06 y la opción "doble proteína" en 30CM. Ver §3.4 y §3.5.

---

## 1. DE DÓNDE SALEN LOS NÚMEROS DE MERMA (metodología, con fuentes)

La merma del pollo tiene **dos etapas** y el costeo del negocio hoy no considera ninguna de las dos.

### 1.1 Merma de limpieza (antes de cocinar)
Recorte de grasa, tendones, cartílago y goteo al descongelar/manipular.

- Pechuga ya deshuesada: rendimiento **90-95%** ([Cárnicas Ismael](https://www.carnicas-ismael.com/noticias/rendimiento-mermas-carne-restaurantes-como-calcular/)) → uso **5%** de merma.
- Muslo/pierna deshuesada sin piel: tiene más grasa intramuscular y tendones que hay que sacar → uso **8%** de merma. (Estimación propia por analogía; no encontré una cifra publicada específica para pierna deshuesada peruana. **Verificar pesando la primera tanda.**)

### 1.2 Merma de cocción (la grande, la que nadie cuenta)
- Rango general publicado para pechuga: **15% a 40%** según punto de cocción; "término medio" pierde ~20%, bien cocido ~35% ([Todos los Hechos](https://todosloshechos.es/cual-es-la-merma-de-la-pechuga-de-pollo)).
- Rango práctico de cocina profesional: **20-30%** de encogimiento en la mayoría de métodos ([Weigh School](https://weighschool.com/chicken-thigh-weights-calories/) y foros de cocina de volumen: [BBQ Brethren, rendimientos reales de muslo deshuesado](https://www.bbq-brethren.com/threads/boneless-skinless-thighs-yield-numbers.217070/)).
- Para **pollo deshilachado (pulled chicken)** específicamente, cocineros de volumen reportan rendimientos de **62.5% a 75%** del peso crudo — es decir 25-37.5% de merma ([BBQ Brethren](https://www.bbq-brethren.com/threads/chicken-thigh-yield.231075/)).
- El **USDA Table of Cooking Yields for Meat and Poultry, Release 2** es la referencia formal ([PDF](https://www.ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf)). **No pude descargarla: el proxy de red de este entorno la bloquea (403).** Los valores que uso vienen de las fuentes secundarias de arriba, que caen dentro del rango que esa tabla publica (factor de retención medio para pollo asado: 71%, [USDA Retention Factors Rel. 6](https://www.ars.usda.gov/arsuserfiles/80400530/pdf/retn06.pdf)).

### 1.3 La salazón previa baja la merma — y es gratis
Dato con impacto directo en el costo: el pollo salado antes de cocinar pierde **7% de humedad de
cocción contra 18% sin salar** (America's Test Kitchen, vía [Smoke Fire Grill](https://www.smokefiregrill.ca/blog/brining-chicken-what-a-salt-water-bath-really-doesand-whether-you-need-it)); el salado en seco (dry brine) da **~12% menos pérdida de peso cocido** que el pollo sin salar ([Spice Basics](https://spice.alibaba.com/spice-basics/how-to-dry-brine-a-chicken-the-ultimate-guide-for-flavor-loving-foodies)).

Traducido a plata: **salar con 12-24 h de anticipación no cuesta nada y recupera varios puntos de
rendimiento.** Por eso las dos recetas de abajo empiezan con un paso de salado previo, y por eso
mis números de merma (25% para P02, 30% para P03) están en la mitad baja del rango publicado en vez
de en la alta. Si el dueño se salta el salado previo, los costos de la §0 suben ~10%.

### 1.4 Números que uso, y por qué

| | Limpieza | Cocción | Rendimiento neto | Justificación |
|---|---|---|---|---|
| **P02** muslo en tiras, salteado fuerte, con marinada salada | 8% | 25% | **0.690** | Marinada de sillao = salmuera; salteado corto; muslo tiene grasa que compensa |
| **P03** muslo braseado y deshilachado | 8% | 30% | **0.644** | Deshilachar exige llevar el colágeno a ~85°C, eso cuesta más agua |
| P03 alternativa: pechuga braseada | 5% | 38% | 0.589 | La pechuga magra pierde más y no tiene grasa que la rescate |
| P03 alternativa: pechuga pochada suave 72-75°C | 5% | 25% | 0.713 | Cocción suave = menos contracción, pero sin sellado ni fondo |

**Estos números se validan en la primera tanda real pesando crudo y cocido.** Es una balanza y dos
minutos. Si el resultado real difiere en más de 5 puntos, hay que rehacer la §3.

---

## 2. EL CORTE QUE HAY QUE COMPRAR EN TRUJILLO

### 2.1 Situación real del precio del pollo en Perú, 2026
El pollo **subió sostenidamente durante 2026** — no es un insumo estable:
- Pollo entero eviscerado en mercados minoristas de Lima: hasta **S/12.94/kg** en marzo 2026, "el nivel más alto de las últimas semanas" ([Infobae](https://www.infobae.com/peru/2026/03/28/precio-del-pollo-en-lima-y-callao-hoy-cuanto-cuesta-el-kilo-y-por-que-esta-subiendo-en-2026/)).
- Pollo en pie en centros de distribución: **S/8.10/kg** (Midagri, misma nota).
- El kilo supera los S/12 y sostenidamente al alza ([Infobae, marzo 2026](https://www.infobae.com/peru/2026/03/20/el-kilo-de-pollo-supera-los-s-12-y-familias-gastan-hasta-s-60-diarios-en-mercados-de-lima-para-cocinar/)).
- **En Trujillo (La Hermelinda) el precio es más volátil y más bajo en los pisos**: hay reportes de caídas a **S/4-7/kg** ([Sol TV Perú](https://soltvperu.com/precio-pollo-trujillo-baja-4-soles/), [Sol TV, estabilización](https://soltvperu.com/trujillo-precio-pollo-hermelinda/)). Esos son precios de pollo entero en un piso de mercado, no el precio normal de un corte deshuesado.

**Conclusión honesta: no pude confirmar por búsqueda el precio de hoy de un corte deshuesado
específico en Trujillo.** Los sitios de Tottus/Plaza Vea/Metro no exponen el precio en resultados de
búsqueda y el proxy bloquea la navegación directa. **El S/17/kg del brief lo tomo como dado, pero es
un número que el dueño tiene que confirmar en su propio proveedor, y aclarar si es entero o
deshuesado** (ver Preguntas Abiertas).

### 2.2 ¿Deshuesar en casa o comprar deshuesado? — la regla de decisión
De un pollo entero **eviscerado**, la carne deshuesada y sin piel rinde aproximadamente **50-55%**
del peso comprado (el hueso, la piel, la grasa y el goteo se llevan el resto; ver [rendimientos de
deshuese de aves, Engormix](https://www.engormix.com/avicultura/articulos/pruebas-rendimiento-deshuese-aves-t27469.htm) y la nota de que "un pollo entero suele tener 25-30% de merma" solo de limpieza básica, [Cárnicas Ismael](https://www.carnicas-ismael.com/noticias/rendimiento-mermas-carne-restaurantes-como-calcular/)).

**Regla práctica, usa esto en el mercado:**

> Comprar entero y deshuesar tú mismo conviene solo si
> **precio del entero < 0.52 × precio del deshuesado.**
> Con deshuesado a S/17/kg, el entero tiene que estar **por debajo de S/8.84/kg**.

- Entero a **S/12-13/kg** (precio normal) → deshuesado equivalente **S/23-25/kg**. **No conviene**: es peor que comprar deshuesado a S/17, y encima te cuesta ~40 min de trabajo por pollo.
- Entero a **S/7/kg** (piso de La Hermelinda) → deshuesado equivalente **S/13.5/kg**. **Sí conviene**, ahorra ~20%.

Pero ojo con el segundo costo: deshuesar 8 kg de pollo son ~2 horas de trabajo del dueño, y el dueño
es el único recurso de la operación. A 40 pedidos/día su tiempo no es gratis. **Recomendación: comprar
deshuesado por defecto, y deshuesar en casa solo cuando el entero esté en el piso del mercado y haya
tiempo muerto.** Como beneficio secundario, si deshuesa, la carcasa da caldo de pollo gratis que
sirve como líquido de braseado de P03 (baja el costo de esa receta).

### 2.3 P02 — Pollo // Teriyaki: **MUSLO / PIERNA DESHUESADA SIN PIEL**

**Recomendación: muslo o pierna deshuesada sin piel, cortada en tiras de 1.5 cm × 6 cm.**

Razones, en orden de peso:
1. **El teriyaki japonés clásico se hace con muslo (*momo*), no con pechuga.** No es una concesión de costo, es la versión correcta del plato.
2. **Sobrevive el ciclo congelar-descongelar-recalentar; la pechuga no.** Los muslos "aguantan mejor los braseados y el calor alto porque su grasa y tejido conectivo mantienen la carne húmeda, mientras la pechuga se seca y se pone fibrosa" ([Weigh School](https://weighschool.com/chicken-thigh-weights-calories/), [ThermoWorks](https://blog.thermoworks.com/chicken/chicken-breasts-vs-thighs/)). Esto es *el* factor decisivo para un negocio que sirve proteína pre-hecha.
3. **Perdona errores.** Una persona sola salteando 8 tandas seguidas se va a pasar de cocción en alguna. Con muslo eso significa "un poco más hecho"; con pechuga significa "seco y desechable".
4. **El código no obliga nada.** P02 dice "Tiras marinadas en teriyaki" — no menciona corte. **Cambiar a muslo no requiere tocar el catálogo.**

**Descartado: pechuga.** Más cara por kilo, pierde más agua, y es la que peor tolera el recalentado.
El único argumento a favor sería una expectativa de "pechuga = premium" que el texto del catálogo no
está prometiendo.

### 2.4 P03 — Pollo // Cajún: el código dice "Pechuga deshilachada" y eso hay que discutirlo

**PROPUESTA AL DUEÑO (no una decisión tomada): cambiar P03 de pechuga a muslo/pierna deshuesada.**

P03 es la proteína del sándwich más caro del catálogo (SIG05, S/24.90 / S/30.90) y **deshilachada es
la forma de servir pollo que más fácil se seca**. Si un cliente paga S/30.90 y le llega pollo
deshilachado seco, ese es el peor resultado posible del catálogo entero.

Comparación con los tres caminos reales, con costo calculado (detalle en §1.4):

| Camino | Rendimiento | Costo/kg cocido | Textura tras congelar+recalentar | Sellado cajún |
|---|---|---|---|---|
| **A. Muslo deshuesado braseado** (recomendado) | 0.644 | **S/29.25** | Jugoso, perdona | Sí, sellado fuerte |
| B. Pechuga braseada (mismo método) | 0.589 | **S/34.53** (+18%) | Seca y fibrosa | Sí |
| C. Pechuga pochada suave 72-75°C | 0.713 | **S/28.55** | Aceptable en frío, seca al recalentar | **No** — sin sellado ni fondo |

(B y C asumen pechuga deshuesada a **S/18.50/kg**, ~10% sobre el precio de la pierna. **SUPUESTO**,
sin cotización confirmada.)

Lectura: la pechuga braseada es **el peor camino en las dos dimensiones a la vez** — 18% más cara y
peor textura. La pechuga pochada sale barata pero te quita el sellado, que es justo donde vive el
sabor cajún (el cajún es un rub que necesita costra; sin costra queda a pollo hervido con polvo
encima).

**Si el dueño aprueba el cambio a muslo, hay que decidir si se actualiza el texto del catálogo**
("Pechuga deshilachada, condimento cajún" → p. ej. "Pollo deshilachado, condimento cajún"). Es un
cambio de una línea en `catalog.ts` **y** en la tabla `secret_signature` de Supabase, porque SIG05
lee su composición de ahí (ver CLAUDE.md: el literal del código es solo semilla). Si prefiere no
tocar el texto público, el camino C (pechuga pochada) es el que menos daño hace, pero entonces el
sándwich pierde la costra cajún y hay que asumirlo.

---

## 3. COSTEO COMPLETO CON MERMA — ¿se sostiene el 45%?

### 3.1 Precios de insumos usados
Confirmados por el dueño / en el brief: pollo S/17/kg · vegetales S/4/kg · pan S/9-13/kg · empaque S/1.10/pedido.

**ESTIMADOS MÍOS, sin cotización confirmada** (marcados así a propósito — si el dueño los corrige,
la tabla cambia): sillao S/8/L · vinagre de arroz S/12/L · azúcar rubia S/4.50/kg · jengibre
S/9/kg · ajo S/12/kg · aceite S/12/L · maicena S/8/kg · mezcla de especias secas ~S/30/kg ·
caldo/base de braseado ~S/1.30/kg de carne · pan focaccia S/13/kg · salsa satay de maní S/25/kg ·
salsa base mayonesa S/18/kg · salsa picante-miel S/28/kg · jalapeño encurtido S/22/kg · pimiento
curado S/12/kg.

### 3.2 Costo de la proteína terminada

**P02 Teriyaki** — insumos de sazón por kg de carne cruda:

| Insumo | Cantidad /kg crudo | Costo |
|---|---|---|
| Marinada (se descarta): sillao 80 ml, agua 80 ml, jengibre 30 g, ajo 20 g, vinagre de arroz 30 ml, azúcar 20 g | — | S/1.60 |
| Glaseado (fresco, nunca tocó pollo crudo): sillao 45 ml, azúcar rubia 50 g, vinagre de arroz 25 ml, jengibre 15 g, ajo 8 g, maicena 5 g | — | S/1.17 |
| Aceite para saltear | 25 ml | S/0.30 |
| **Total sazón** | | **S/3.07** |

→ (17.00 + 3.07) / 0.690 = **S/29.09 por kg de producto terminado**
→ 85 g = **S/2.47** · 170 g = **S/4.95**

(Conservador a propósito: **no cuento el peso que el glaseado le devuelve al producto** (~8-10%). Si
lo contara, el costo bajaría a ~S/26.4/kg. Prefiero equivocarme del lado caro.)

**P03 Cajún** — insumos de sazón por kg de carne cruda:

| Insumo | Cantidad /kg crudo | Costo |
|---|---|---|
| Sal fina (salado previo) | 6 g | S/0.01 |
| Mezcla cajún (§5.2) | 18 g | S/0.54 |
| Líquido de braseado: caldo 200 ml, cebolla 60 g, ajo 10 g, aceite 20 ml | — | S/1.29 |
| **Total sazón** | | **S/1.84** |

→ (17.00 + 1.84) / 0.644 = **S/29.25 por kg de producto terminado**
→ 85 g = **S/2.49** · 170 g = **S/4.97**

### 3.3 Sándwich completo vs. el 45%

| Producto | PVP | Costo insumos+empaque | % del PVP | ¿≤45%? |
|---|---|---|---|---|
| **SIG06 The Teriyaki 15CM** | S/17.90 | S/5.43 | **30.3%** | ✅ holgado |
| **SIG06 The Teriyaki 30CM** | S/23.90 | S/9.76 | **40.8%** | ⚠️ pasa, poco colchón |
| **SIG05 Menú secreto 15CM** | S/24.90 | S/5.96 | **23.9%** | ✅ el mejor del catálogo |
| **SIG05 Menú secreto 30CM** | S/30.90 | S/10.81 | **35.0%** | ✅ holgado |
| BYO P02 15CM | S/13.90 | S/4.97 | **35.8%** | ✅ |
| BYO P02 30CM | S/21.90 | S/8.85 | **40.4%** | ⚠️ poco colchón |

Desglose de SIG06 15CM: pan B01 71 g S/0.78 · P02 85 g S/2.47 · tomate 40 g S/0.16 · pimiento curado
25 g S/0.30 · satay 14 g S/0.35 · S05 14 g S/0.27 · empaque S/1.10.

Desglose de SIG05 15CM: focaccia 71 g S/0.92 · P03 85 g S/2.49 · jalapeño 20 g S/0.44 · pimiento
20 g S/0.24 · cebolla 25 g S/0.13 · spicy mayo 14 g S/0.25 · picante-miel 14 g S/0.39 · empaque S/1.10.

**Veredicto: el 45% se sostiene en las dos recetas, en los cuatro tamaños, YA CON la merma cargada.**
El margen extra que el dueño se reservó (45% declarado contra 26-36% calculado) es exactamente lo
que absorbe la merma. Sin ese colchón, este documento diría otra cosa.

### 3.4 Dónde se rompe: precio de quiebre del pollo
El pollo peruano subió durante todo 2026. Si sigue subiendo:

> **SIG06 30CM y BYO P02 30CM cruzan el 45% cuando el pollo deshuesado pasa de S/21.06/kg.**
> Hoy el supuesto es S/17. El margen de seguridad es de **~24% de subida**.
>
> SIG05 30CM cruza el 45% recién a **S/28.71/kg** de pollo. Margen: **69%**. Ese sándwich no corre riesgo.

Recomendación operativa: **anotar el precio pagado por kilo en cada compra.** Cuando pase de S/21,
SIG06 30CM deja de cumplir el objetivo de margen y hay que decidir precio (recordar la trampa del
CLAUDE.md: cambiar el literal en `catalog.ts` **no** cambia el precio real, hay que actualizar
`catalog_prices` en la misma sesión).

### 3.5 El problema del "doble proteína" en 30CM
El upcharge de doble proteína es **+S/6 fijo** en los dos tamaños. Pero el costo no es fijo:

| | Ingreso extra | Costo extra | Costo como % del ingreso extra |
|---|---|---|---|
| Doble en 15CM (+85 g) | S/6.00 | S/2.47 | 41.2% ✅ |
| **Doble en 30CM (+170 g)** | S/6.00 | S/4.95 | **82.5%** 🚩 |

**Un doble de pollo en 30CM deja S/1.05 de contribución bruta antes de comisión de pago.** Con Culqi
(~4-5.5%) queda prácticamente en cero. No es una emergencia — es un add-on opcional, no el producto
principal — pero es un dato que el dueño no tiene y que merece una decisión (subir el doble en 30CM,
o aceptarlo como un gesto de generosidad hacia el cliente que pide doble). **No lo cambio yo, es una
decisión de precio.**

---

## 4. P02 — POLLO // TERIYAKI

> Código: "Tiras marinadas en teriyaki" · SIG06 The Teriyaki (S/17.90 / S/23.90) · pitch: "Pollo
> teriyaki **caramelizado**" · toppings T01 tomate + T06 pimiento curado · salsas S10 satay de maní +
> S05 SNDWCH Special.
>
> **El problema de diseño: SIG06 no lleva salsa teriyaki (S08).** El sabor teriyaki tiene que venir
> entero de la proteína. La receta está construida para eso: la proteína sale de cocina ya glaseada,
> no solo marinada.

### 4.1 Rendimiento y tiempo de la tanda

**Tanda base: 4.0 kg de muslo/pierna deshuesada sin piel.**

| Etapa | Peso |
|---|---|
| Comprado | 4.00 kg |
| Después de limpiar (−8%) | 3.68 kg |
| Después de saltear (−25%) | 2.76 kg |
| Con glaseado adherido (+~7%) | ~2.95 kg |
| **Porciones servibles** | **32 de 85 g** (o 16 de 170 g, o mezcla) — con ~0.2 kg de margen |

**Tiempo:**

| Bloque | Activo | Pasivo |
|---|---|---|
| Limpiar y cortar tiras (4 kg) | 35 min | — |
| Preparar marinada + mezclar | 10 min | — |
| Marinar en refrigeración | — | 4-8 h |
| Preparar glaseado (aparte, mientras marina) | 15 min | — |
| Saltear en 8 tandas de 460 g | 60 min | — |
| Glasear y reducir sobre la carne | 15 min | — |
| Enfriado rápido en bandejas | 5 min | 40 min |
| Porcionar, envasar, rotular, congelar | 25 min | — |
| **Total** | **~2 h 45 min activo** | **~5 h pasivo** |

Se hace cómodamente en un día: marinar en la mañana, cocinar en la tarde. O marinar la noche antes.

### 4.2 Marinada — 4.0 kg (se descarta después, nunca se cocina ni se sirve)

| Ingrediente | Cantidad |
|---|---|
| Sillao (salsa de soya) | 320 ml |
| Agua | 320 ml |
| Jengibre fresco rallado | 120 g |
| Ajo picado fino | 80 g |
| Vinagre de arroz | 120 ml |
| Azúcar rubia | 80 g |

Mezclar hasta disolver el azúcar. Sumergir las tiras. Refrigerar **4-8 h** (no más de 12: el sillao
empieza a "curar" la superficie y la textura se pone gomosa).

**Está diluida a propósito.** Una marinada de sillao puro deja el producto final a ~2.6% de sal —
incomible. Diluida al 50% y con la mayor parte descartada, la marinada aporta perfume (jengibre,
ajo, umami) y una salazón de base, y el resto de la sal llega con el glaseado, que sí se puede medir.

### 4.3 Glaseado — 4.0 kg (se prepara APARTE, nunca toca pollo crudo)

| Ingrediente | Cantidad |
|---|---|
| Sillao | 180 ml |
| Azúcar rubia | 200 g |
| Vinagre de arroz | 100 ml |
| Azúcar extra (sustituto de mirin) | 40 g |
| Jengibre rallado | 60 g |
| Ajo picado muy fino | 32 g |
| Agua | 240 ml |
| Maicena | 20 g (disuelta en 60 ml de agua fría) |

Sobre **mirin**: el teriyaki auténtico usa sillao + sake + mirin + azúcar en proporción 2:2:2:1
([Just One Cookbook](https://www.justonecookbook.com/teriyaki-sauce/), [Chopstick Chronicles](https://www.chopstickchronicles.com/basic-teriyaki-sauce/)). Si no consigues mirin en Trujillo, el
sustituto validado es **1 cda de vinagre de arroz + ½ cda de azúcar = 1 cda de mirin** ([Ingredient
Substitutes](https://www.ingredientsubstitutes.com/mirin-substitute/teriyaki-sauce), [Pantry
Professor](https://pantryprofessor.com/substitute/mirin/)). La fórmula de arriba ya lleva ese
sustituto incorporado. **Si consigue mirin real, reemplaza los 100 ml de vinagre + 40 g de azúcar
por 140 ml de mirin.**

**Preparación (15 min):** todo menos la maicena en una olla, hervir, bajar a fuego medio-bajo,
reducir **8-10 min** hasta que cubra el reverso de una cuchara. Agregar la maicena disuelta,
1 minuto más, apagar. Debe quedar **jarabe fluido, no gel** — el teriyaki auténtico es más líquido
que el americano ([Wok With Sam](https://wokwithsam.com/authentic-japanese-teriyaki-sauce-recipe/)).

**Reservar 150 ml del glaseado en un frasco aparte, en refrigeración.** Ese es el "glaseado de
servicio" de la §4.6. No es opcional.

### 4.4 Salteado — cómo lograr caramelización real sin quemar el azúcar

**El dato técnico que gobierna todo este paso:** el Maillard (el dorado sabroso de la proteína)
arranca alrededor de **140-150°C**, y la caramelización del azúcar corre entre **150°C y 180-200°C**;
**por encima de ~200°C el azúcar se quema en segundos** ([FireBoard](https://www.fireboard.com/blog/what-is-caramelization/), [Food Republic](https://www.foodrepublic.com/1294310/real-difference-between-maillard-reaction-caramelization/)). La sacarosa carameliza a 170°C, la fructosa desde 105°C.

Esa ventana es angosta, y por eso **el orden importa: primero se dora el pollo solo, después entra
el azúcar.** Si metes el pollo con el glaseado dulce desde el principio, el azúcar se quema antes de
que el pollo se dore, y sale amargo.

**Procedimiento, 8 tandas de 460 g:**

1. **Escurre bien** las tiras en un colador, 10 min. Descarta la marinada. **Seca con papel** — el
   pollo mojado hierve en vez de dorarse (no llega a los 140°C necesarios).
2. Sartén grande o plancha a **fuego alto**, 20 ml de aceite. Espera a que humee ligeramente.
3. **Nunca más de 460 g por tanda.** Sobrecargar la sartén baja la temperatura, el pollo suelta agua
   y se hierve. Este es el error #1 de este paso.
4. Extiende las tiras en una capa, **NO las muevas 2 minutos**. Voltea. **2 minutos más.** Buscas
   manchas doradas oscuras, no dorado parejo.
5. Retira a una bandeja. Repite las 8 tandas. Limpia la sartén si se está quemando el fondo.
6. **Recién ahora el glaseado.** Devuelve todo el pollo a la sartén (en 2-3 cargas si no cabe), baja
   a **fuego medio**, agrega el glaseado (todo menos los 150 ml reservados).
7. **Mueve constante 3-4 min.** El glaseado va a burbujear, espesar y pegarse a las tiras. Va a
   verse brillante y oscuro. **Apaga en el momento en que empieza a oler a caramelo, no cuando
   empieza a oler a quemado.** Entre esos dos olores hay ~30 segundos.
8. Verifica **74°C internos** en la tira más gruesa (§4.7).

### 4.5 ⚠️ LA CARAMELIZACIÓN NO SOBREVIVE EL CONGELADO. Esto es un problema real del producto.

**Dilo así de claro, porque es cierto:** la **costra** caramelizada — esa textura crujiente-pegajosa
del teriyaki recién salteado — **no sobrevive el ciclo congelar → descongelar → recalentar.** Los
cristales de hielo rompen la estructura de la superficie y, al descongelar, el agua migra de vuelta
hacia afuera. Lo que sacas del congelador es pollo teriyaki **tierno y glaseado**, no **caramelizado**.

Lo que **sí** sobrevive intacto: **el sabor.** Los compuestos de Maillard y de caramelización ya
formados son moléculas estables; no se "descongelan" ni se revierten. El sándwich va a saber a
teriyaki caramelizado. Lo que se pierde es la textura de la costra.

**Y el pitch del catálogo dice "Pollo teriyaki caramelizado".** O sea que si no haces nada, el
producto entrega el 70% de lo que promete.

**Solución: reglaseado de 90 segundos en el armado.** Convierte el problema en una ventaja.

Ahí es donde entran los **150 ml de glaseado reservados** de la §4.3. Al armar cada pedido:

1. Sartén/plancha ya caliente en la estación de armado (fuego medio-alto).
2. Echa la porción de pollo (85 o 170 g) **ya descongelada, del refrigerador**.
3. Agrega **1 cucharadita (~7 ml) del glaseado fresco reservado**.
4. **60-90 segundos moviendo.** El glaseado fresco carameliza *en ese momento*, sobre el pollo, y
   crea costra nueva.
5. Al pan, directo, caliente.

**Costo operativo real de esta decisión:** una sartén ocupada durante el servicio y +90 s por pedido.
El brief dice que armar un pedido toma 4-5 min con mise en place; esto lo lleva a ~6 min. A 40
pedidos/día son **+60 min de servicio al día**. **No es gratis y el dueño tiene que decidirlo.**

**Si NO acepta el paso de 90 s**, entonces el producto es "teriyaki tierno y glaseado" y el pitch
debería cambiar — "caramelizado" pasaría a ser una promesa que el producto no cumple, y en un
delivery donde el cliente ya pagó, esa brecha es reclamos. **Es decisión del dueño, no mía**, pero
es una de las dos y no hay tercera.

### 4.6 Congelado y recalentado

- **Formato:** bolsas ziploc planas de **340 g** (= 4 porciones de 85 g = 2 de 170 g), aplastadas a
  ~1.5 cm de espesor. Con el glaseado adentro — el glaseado protege contra la quemadura de congelador.
- Sacar todo el aire. **Rotular: "P02 TERIYAKI · [fecha] · 340 g".**
- **Vida útil:** el pollo cocido en salsa aguanta **4-6 meses congelado** ([iProfesional](https://www.iprofesional.com/salud/386747-cuanto-tiempo-puede-permanecer-el-pollo-cocido-en-la-heladera), [Tu Hogar](https://www.tuhogar.com/es-mx/recetas/tecnicas-de-cocina/cuanto-dura-cada-tipo-de-comida-congelada)). **Límite operativo que propongo: 30 días.** Con tandas 1-2 veces por semana la rotación real es de 7-14 días; los 30 días son solo el techo para que nada se olvide al fondo.
- **Descongelado:** **siempre en refrigeración**, la noche anterior. Nunca en el mostrador. Una bolsa plana de 340 g se descongela en ~8 h a 4°C.
- Una vez descongelada, la bolsa es el stock del día. **Máximo 48 h en refrigeración.** (USDA da 3-4 días para pollo cocido refrigerado, [FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety); 48 h es margen de seguridad propio.)
- **NUNCA recongelar** una porción descongelada. ([Fácil y Casero](https://facilycasero.com/congelar-pollo/))
- **Recalentado en servicio:** el reglaseado de la §4.5. Ese paso *es* el recalentado. Verificar que
  llega a **74°C**.

### 4.7 Control de calidad de P02, sin instrumentos

- **Glaseado listo:** cubre el reverso de una cuchara y deja una línea limpia al pasar el dedo. Si
  chorrea como agua, faltó reducción; si se agrieta al enfriar, se pasó.
- **Punto del salteado:** corta la tira más gruesa a lo largo. **Cero rosado, cero jugo rosado.**
- **Sal:** la proteína sola tiene que saber **claramente más salada de lo que quieres el sándwich
  final** — va a compartir el pan con tomate, pimiento y dos salsas. Si sabe "bien" sola, el sándwich
  va a saber insípido. Objetivo ~1.2-1.4% de sal en el producto terminado.
- **Prueba de tanda:** de cada tanda, congela una porción de más. A las 48 h descongélala,
  reglaséala y cómetela en un sándwich armado completo. Es el único test que mide el producto que el
  cliente recibe, no el que sale de la sartén.

---

## 5. P03 — POLLO // CAJÚN

> Código: "Pechuga deshilachada, condimento cajún" · exclusiva del menú secreto SIG05
> (S/24.90 / S/30.90 — el sándwich más caro del catálogo) · toppings T04 jalapeño encurtido +
> T06 pimiento curado + T03 cebolla morada · salsas S02 Spicy Mayo + S12 Picante Miel.
>
> **Recordatorio de §2.4:** propongo cambiar de pechuga a muslo deshuesado. La receta de abajo está
> escrita para muslo; al final de la sección está el ajuste si el dueño prefiere quedarse con pechuga.

### 5.1 Rendimiento y tiempo de la tanda

**Tanda base: 4.0 kg de muslo/pierna deshuesada sin piel.**

| Etapa | Peso |
|---|---|
| Comprado | 4.00 kg |
| Después de limpiar (−8%) | 3.68 kg |
| Después de brasear y deshilachar (−30%) | 2.58 kg |
| Con líquido de braseado reintegrado (+~5%) | ~2.70 kg |
| **Porciones servibles** | **30 de 85 g** (o 15 de 170 g) — con ~0.15 kg de margen |

| Bloque | Activo | Pasivo |
|---|---|---|
| Limpiar, salar (dry brine) | 30 min | — |
| Reposo salado en refrigeración | — | 12-24 h |
| Sazonar con la mezcla cajún | 10 min | — |
| Sellar en 6 tandas | 30 min | — |
| Brasear tapado a fuego bajo (o horno 160°C) | 10 min | 50-60 min |
| Reposo antes de deshilachar | — | 15 min |
| Deshilachar 2.6 kg con dos tenedores | 30 min | — |
| Reducir el líquido y reintegrar | 15 min | — |
| Enfriado rápido | 5 min | 40 min |
| Porcionar, envasar, rotular, congelar | 25 min | — |
| **Total** | **~2 h 35 min activo** | **~14-16 h pasivo** (mayormente de noche) |

### 5.2 La mezcla cajún — en gramos, calibrada para paladar peruano

**Se hace en casa. No se compra.**

Razones: (a) el "sazonador cajún" listo en Perú es producto importado de tienda especializada,
caro (~S/25-40 por 100 g) y de abastecimiento irregular; (b) hacerla cuesta ~S/6 por 200 g de
materia prima; (c) el punto de picante hay que poder ajustarlo, y un frasco comprado no se ajusta.

**Fórmula de referencia (cajún estándar norteamericano)**, para saber de dónde parto:
3 cda páprika, 2 cda ajo en polvo, 2 cda sal, 1 cda cayena, 1 cda cebolla en polvo, 1 cda orégano,
1 cda tomillo, 1 cda pimienta negra ([Gimme Delicious](https://gimmedelicious.com/cajun-seasoning/), [Culinary Hill](https://www.culinaryhill.com/homemade-cajun-seasoning/)). Convertido a gramos, la
cayena sale **~5.4% de la mezcla**. Eso es fuerte para un cliente peruano promedio.

**MEZCLA SND//WCH — lote de 200 g (pesar en balanza, no medir en cucharas):**

| Ingrediente | Gramos | % |
|---|---|---|
| Páprika / pimentón dulce (ahumado si consigues) | 62 g | 31.0% |
| Ají panca molido | 25 g | 12.5% |
| Ajo en polvo | 30 g | 15.0% |
| Sal fina | 30 g | 15.0% |
| Cebolla en polvo | 20 g | 10.0% |
| Pimienta negra molida | 14 g | 7.0% |
| Orégano seco (frotado entre los dedos) | 8 g | 4.0% |
| Tomillo seco | 6 g | 3.0% |
| **Cayena molida** | **5 g** | **2.5%** |
| **Total** | **200 g** | |

**Dosis: 18 g de mezcla por kg de carne cruda.** Tanda de 4 kg = **72 g de mezcla**.
Un lote de 200 g alcanza para ~11 kg de pollo crudo = ~2.8 tandas.

**Las tres decisiones de calibración, explicadas:**

1. **Cayena bajada de 5.4% a 2.5% — la mitad del picante estándar.** No es timidez: **SIG05 ya lleva
   tres fuentes de picante encima** (jalapeño encurtido T04, Spicy Mayo S02, Picante-Miel S12). Si la
   proteína también viene con picante de cajún completo, el sándwich se vuelve un sándwich de picante
   y deja de ser un sándwich de pollo. La proteína aporta **calor de fondo**; el golpe lo dan las
   salsas.
2. **Entra ají panca molido (25 g).** Es peruano, se consigue en cualquier mercado de Trujillo, casi
   no pica, y aporta color rojo profundo y un ahumado afrutado que es exactamente el registro del
   cajún. Es la mejor pieza local disponible: reemplaza parte de la páprika y sube la profundidad sin
   subir el picante.
3. **La sal de la mezcla NO es toda la sal.** Los 30 g de sal en 200 g de mezcla aportan solo
   **2.7 g de sal por kg de carne** a la dosis de 18 g/kg — muy poco para un dry brine. Por eso el
   salado previo va **aparte** (§5.3), con 6 g/kg. **Total: ~8.7 g de sal por kg = 0.87%**, que es el
   rango correcto para una proteína de sándwich.

**Cuánto pica de verdad, en criollo:** la cayena llega a ~40,000 SHU; a 2.5% de la mezcla y 18 g/kg,
la proteína sola queda en **2 de 5** — se siente un calor claro en la lengua que se va rápido, sin
llegar a molestar. **El sándwich completo, con las tres salsas y el jalapeño, llega a ~3.5 de 5:**
picante de verdad, pero no un reto. Para referencia local, el rocoto arranca en 50,000 SHU y puede
llegar a 250,000, y el ají limo va de 15,000 a 30,000 ([How to Peru](https://howtoperu.com/aji-chili-peppers-in-peruvian-cuisine/), [Specialty Produce](https://specialtyproduce.com/produce/Aji_Limo_Rojo_Chile_Pepper_16990.php)) — esto está muy por debajo de un ají limo entero.

**Advertencia honesta:** el poder de la cayena varía enormemente entre marcas y lotes, y calcular
SHU de un plato terminado a partir del SHU del ingrediente no es confiable. **Estos 5 g son un punto
de partida a calibrar, no un número final.** Prueba de calibración obligatoria antes de abrir: haz
100 g de mezcla, sazona 300 g de pollo, arma un SIG05 completo y dáselo a probar a 3 personas que no
sean tú (el dueño ya está acostumbrado a su propia comida). **Si dos de tres dicen "está bien pero le
falta", subes la cayena a 7 g. Si uno dice "muy picante", la bajas a 3 g.** Es una prueba de S/8.

**Si no consigues cayena molida en Trujillo**: ají limo molido o ají charapita molido sirven, pero
son considerablemente más picantes por gramo — arranca con **3 g en vez de 5** y sube desde ahí.

### 5.3 Procedimiento — 4.0 kg

**Día 1 (30 min activo):**
1. Limpia el pollo: saca grasa amarilla visible, tendones y cartílago. Pesa lo limpio (~3.68 kg) y
   **anótalo** — con eso validas la merma real de tu proveedor.
2. **Salado previo (dry brine): 6 g de sal fina por kg limpio = 22 g para 3.68 kg.** Espolvorea
   parejo por las dos caras, sin frotar fuerte.
3. Bandeja, **destapada o cubierta con papel absorbente**, refrigerador, **12-24 h**. Sin tapar sella
   la superficie y ayuda a que después dore.
   *(Este paso solo cuesta tiempo y recupera ~12% de peso cocido — ver §1.3.)*

**Día 2 (2 h activo + 1 h de horno):**

4. Saca el pollo 20 min antes. **Seca con papel.** Sazona con **72 g de mezcla cajún**, frotando bien
   por las dos caras.
5. **Sellado, 6 tandas de ~610 g.** Sartén de fondo grueso u olla ancha a **fuego alto**, 20 ml de
   aceite por tanda. **3 min por lado, sin mover.** Buscas costra oscura, casi al borde de lo
   quemado — ahí vive el sabor cajún. Reserva.
   *No sobrecargues: si el pollo suelta agua y se pone gris en vez de dorarse, la sartén estaba fría
   o había demasiado.*
6. **Fondo:** en la misma olla, sofríe **240 g de cebolla picada + 40 g de ajo** en la grasa del
   sellado, 5 min, raspando el fondo pegado. Ese fondo pegado (*fond*) es la mitad del sabor —
   no lo tires.
7. **Braseado:** devuelve todo el pollo. Agrega **800 ml de caldo de pollo** (o agua si no tienes).
   El líquido debe llegar a **la mitad de la altura** del pollo, no cubrirlo. Tapa.
   - **En olla, fuego bajo: 50-60 min.** Debe hacer "blup" cada 2-3 segundos, no hervir a borbotones.
   - **En horno a 160°C: 55-65 min.**
8. **Punto:** el pollo está listo cuando **se deshilacha solo con dos tenedores, sin resistencia.** Si
   tienes que forzarlo, le faltan 10-15 min. Verifica **74°C mínimo** (§6).
9. Saca el pollo a una bandeja. **Reposo 15 min.** Deshilacha en tiras gruesas — **no lo hagas polvo**,
   quieres hebras reconocibles que se sientan en el sándwich.
10. **Reduce el líquido** que quedó en la olla a fuego medio, hasta ~350 ml. **Reintegra 250 ml al
    pollo deshilachado y mezcla.** Vuelve a probar de sal.
11. **⭐ Los 100 ml restantes van a una cubetera de hielo, cubos de ~15 g, al congelador.**
    Ese es el "jugo de servicio" de la §5.5. Es lo que evita que el deshilachado salga seco al
    recalentar. **No te lo saltes.**

### 5.4 Congelado

- **Formato:** bolsas ziploc planas de **340 g** (4 porciones de 85 g), aplastadas a ~1.5 cm.
- **Con su líquido**, no escurrido — la humedad es lo que lo salva.
- Rotular: **"P03 CAJÚN · [fecha] · 340 g"**.
- Aparte, la bolsa de cubos de jugo, rotulada **"P03 JUGO · [fecha]"**.
- **Vida útil:** mismo criterio que P02 — 4-6 meses de límite de seguridad, **30 días de límite
  operativo propio**.

### 5.5 Recalentado en servicio — el paso que define este sándwich

El pollo deshilachado es **la forma de proteína que más rápido se seca al recalentar.** Recalentado
mal, un SIG05 de S/30.90 llega como pollo seco con salsa encima.

**Método (2 min):**
1. Sartén a fuego medio-bajo, **tapada**.
2. Porción de pollo (85 o 170 g) **ya descongelada en refrigeración**.
3. **1 cubo de jugo (15 g) por cada 85 g de pollo.** Si no tienes, 15 ml de caldo o agua.
4. **Tapa. 2 minutos.** Remueve una vez a la mitad.

El principio está documentado: recalentar el pollo **dentro de su salsa o con líquido, tapado**,
recupera humedad; el vapor atrapado es lo que impide que se desjugue ([Cocina Delirante](https://www.cocinadelirante.com/tips/como-evitar-que-el-pollo-quede-seco), [El Comercio](https://elcomercio.pe/mag/respuestas/dia-del-pollo-a-la-brasa-trucos-caseros-como-recalentar-para-que-no-quede-seco-cocina-nnda-nnni-noticia/)).

**Microondas como plan B:** tapado, con el cubo de jugo, **45-60 s al 70% de potencia**, remover,
20 s más. Nunca a potencia máxima destapado — ahí es donde queda gomoso.

**LO QUE NO SE HACE NUNCA:** recalentar el deshilachado en sartén seca. En 60 segundos queda paja.

### 5.6 Si el dueño prefiere quedarse con PECHUGA

Ajustes mínimos para no arruinarlo:
- **No lo bracees.** La pechuga braseada a 85°C queda fibrosa. Usa **pochado suave**: agua o caldo a
  **72-75°C** (burbujas finas en el fondo, sin romper la superficie), **18-22 min** hasta 74°C
  internos.
- **Sella igual antes** (3 min por lado) para tener la costra cajún. El sellado es lo que salva el
  camino de la pechuga.
- **Deshilacha en caliente**, apenas puedas manipularla. Fría no se deshilacha, se corta.
- **Sube el líquido reintegrado a 350 ml** en vez de 250 — la pechuga necesita más.
- Costo: **S/28.55/kg cocido** (85 g = S/2.43). Comparable al muslo.
- **La pega real:** el sellado se ablanda al brasear/pochar y la textura de la pechuga deshilachada
  al recalentar es notablemente peor que la del muslo. Es un camino viable, no un camino bueno.

---

## 6. SEGURIDAD DEL POLLO

**El pollo es la proteína de mayor riesgo microbiológico del catálogo, y el ciclo
cocinar → enfriar → congelar → descongelar → recalentar es exactamente donde se producen los
brotes.** Esta sección no es opcional.

### 6.1 Temperatura interna objetivo
- **74°C (165°F) mínimo en el punto más grueso.** Es el estándar USDA para todo pollo — pechuga,
  muslo, alas, molido — y es el punto donde la Salmonella muere de forma instantánea ([FSIS/USDA](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/chicken-farm-table)).
- La norma peruana coincide: **carnes y aves cocidas a no menos de 74°C** (NTS MINSA/DIGESA, [RM 822-2018-MINSA](https://www.digesa.minsa.gob.pe/NormasLegales/Normas/RM_822-2018-MINSA.pdf), [RM 308-2012](https://www.digesa.minsa.gob.pe/norma_consulta/rm-308-2012.pdf)).
- **Recalentado: también 74°C.** No es "que salga caliente", es 74°C.
- Para P03 en particular, el braseado va a llegar a 85-90°C de todas formas — es lo que exige el
  colágeno para poder deshilacharse. Ahí el 74°C se cumple con margen.

### 6.2 Enfriado rápido — el paso donde más gente falla
- **Norma peruana: los alimentos preparados no se exponen a temperatura ambiente más de 2 horas**
  durante el enfriado; refrigeración por debajo de **5°C**, congelación a **−18°C** (NTS
  MINSA/DIGESA, fuentes de arriba).
- USDA: los sobrantes **se refrigeran dentro de las 2 horas** de cocinados ([FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety)).
- Por qué importa en números: con un tiempo de duplicación bacteriana de 20 min, en 2 h pasas de
  poco a >4,000 células/g; en 4 h a >65,000; en 6 h a más de 1 millón ([Reencle](https://reencle.co/blogs/news/how-long-can-cooked-chicken-sit-out)).

**Cómo se hace en cocina de casa, con lo que hay:**
1. **Extiende el pollo en bandejas, capa de máximo 2 cm.** Una olla de 3 kg de pollo caliente tarda
   4-6 h en enfriarse en el refrigerador — eso es zona de peligro pura. Extendido en bandejas,
   40 min.
2. **Baño maría inverso:** bandeja o bolsa sellada sobre agua con hielo, removiendo. Corta el tiempo
   a la mitad.
3. **Ya en bolsa plana de 1.5 cm**, al refrigerador hasta que esté frío al tacto, **y recién ahí al
   congelador.** Meter comida caliente al congelador sube la temperatura de todo lo que ya está
   adentro. ([Fácil y Casero](https://facilycasero.com/congelar-pollo/))
4. **Objetivo: de 60°C a 5°C en menos de 2 horas.**

### 6.3 Lo que NO se hace, nunca

| ❌ | Por qué |
|---|---|
| Descongelar en el mostrador / al sol | La superficie entra en zona de peligro horas antes de que el centro se descongele |
| Recongelar pollo que ya se descongeló | Riesgo de intoxicación alimentaria ([iProfesional](https://www.iprofesional.com/salud/386747-cuanto-tiempo-puede-permanecer-el-pollo-cocido-en-la-heladera)) |
| Usar la marinada del pollo crudo para glasear o servir | Contiene jugo de pollo crudo. Por eso el glaseado de P02 se hace **aparte** |
| Meter la olla entera caliente al refrigerador | Tarda horas en enfriar y calienta el resto del refrigerador |
| Guiarse por "los jugos salen claros" | Es un indicador conocido por poco confiable. No sustituye 74°C medidos |
| Misma tabla / mismo cuchillo para pollo crudo y para armar sándwiches | Contaminación cruzada. **Tabla exclusiva para pollo crudo, de color distinto** |
| Probar la sal metiendo la cuchara y volviéndola a meter | Con pollo, no |

### 6.4 Trazabilidad mínima (2 minutos por tanda)
Un cuaderno en la cocina. Por tanda: **fecha · proteína · kg crudos comprados · kg limpios ·
kg cocidos · nº de bolsas · proveedor.** Sirve para tres cosas a la vez: (a) validar la merma real
contra los números de este documento, (b) rastrear el origen si algo sale mal, (c) tener el dato
real de costo por kilo en vez del supuesto.

---

## 7. PUNTO DE CONTROL DE CALIDAD — ¿hace falta un termómetro?

### 7.1 Sí. Cómpralo. Y aquí está la justificación del gasto.

Para todas las demás proteínas del catálogo hay señales visuales aceptables. **Para el pollo no.**
El estándar sanitario, tanto de USDA como de DIGESA Perú, está escrito **en grados** (74°C), y la
señal visual clásica ("los jugos salen claros") es reconocidamente poco confiable. No hay forma de
cumplir el estándar sin medir.

**Costo: una sonda digital de cocina en Perú está en el orden de S/25-70** (rango estimado, **el
dueño debe confirmar el precio real** en Sodimac, Mercado Libre PE o tiendas de menaje de Trujillo —
no lo pude verificar por búsqueda). Eso es **menos que el margen de 3 sándwiches**, contra un
negocio con costos fijos de menos de S/500/mes y una apertura en 17 días.

El riesgo del otro lado no es económico: es un caso de salmonelosis en la primera semana de un
negocio de delivery que vive de reseñas y de WhatsApp. **Es el gasto más fácil de justificar del
proyecto entero.**

**Cómo usarla bien:** medir en el punto más grueso, sin tocar la sartén ni el hueso. En P02, la tira
más gorda de la última tanda salteada. En P03, el trozo del centro de la olla. **Una medición por
tanda, no por pieza.**

### 7.2 Controles sin instrumentos (complementan el termómetro, no lo reemplazan)

| Control | P02 Teriyaki | P03 Cajún |
|---|---|---|
| **Cocción** | Corte a lo largo de la tira más gruesa: cero rosado, cero jugo rosado | Se deshilacha solo con dos tenedores, **sin fuerza**. Si hay que forzar, faltan 10-15 min |
| **Sazón/glaseado** | El glaseado cubre el reverso de la cuchara y deja línea limpia al dedo | El líquido reducido debe napar, no chorrear |
| **Sal** | Sabe más salado sola de lo que quieres el sándwich | Igual — comparte pan con 3 elementos más |
| **Enfriado** | A los 45 min la bolsa plana debe sentirse fría al tacto **en el centro**. Si sigue tibia, el sistema falló: capa muy gruesa o mucho volumen por bandeja | Igual |
| **Color** | Caoba brillante. Si está negro-mate, se quemó el azúcar (amargo) — tanda perdida | Rojo-ladrillo del páprika + ají panca. Si está pálido, faltó rub o faltó sellado |
| **Prueba de producto** | Sándwich completo armado con proteína descongelada de 48 h, no recién salteada | Igual. **Este es el único test que mide lo que el cliente recibe** |

### 7.3 Pesar es el otro instrumento indispensable
**Balanza de cocina con precisión de 1 g.** No es opcional en este recetario:
- La mezcla cajún está especificada en gramos porque en cucharas no es reproducible.
- La porción de 85/170 g es la base del costeo entero. A ojo, la variación es de ±20 g, que sobre
  85 g es ±23% del costo de la proteína.
- Sin pesar crudo y cocido, no puedes validar la merma real y todos los números de la §3 quedan como
  supuestos para siempre.

**Pregunta abierta: ¿el dueño ya tiene balanza de 1 g?** Si no, es el segundo gasto a justificar.

---

## 8. COHERENCIA CON EL CATÁLOGO — ¿entrega lo que promete?

### P02 / SIG06 The Teriyaki

| Lo que promete | ¿Lo entrega? |
|---|---|
| Código: "Tiras marinadas en teriyaki" | ✅ Sí. Tiras, marinadas, teriyaki. Literal. |
| Pitch: "Pollo teriyaki **caramelizado**" | ⚠️ **Solo con el reglaseado de 90 s en el armado (§4.5).** Sin ese paso, es "glaseado", no "caramelizado". |
| Badge "Asiático" | ✅ Sillao + jengibre + mirin/sustituto es teriyaki reconocible. |
| Sabor teriyaki sin salsa teriyaki (S08 no está en la receta) | ✅ **Resuelto por diseño.** El glaseado va reducido **sobre** la proteína, no servido encima. La proteína llega al pan con el teriyaki adentro. |
| Convive con S10 satay de maní + S05 Special | ✅ Maní + soya + jengibre (S10) es el mismo eje de sabor. **Riesgo a vigilar: dulzor apilado.** El glaseado lleva 250 g de azúcar por 4 kg y el satay también es dulce. Si al probar el sándwich completo sale empalagoso, la palanca es bajar el azúcar del glaseado a 200 g, **no** cambiar el satay. |
| Toppings T01 tomate + T06 pimiento curado | ✅ El tomate fresco corta el dulce. Funciona. |

### P03 / SIG05 Menú secreto

| Lo que promete | ¿Lo entrega? |
|---|---|
| Código: "Pechuga deshilachada, condimento cajún" | ⚠️ **"Deshilachada" sí, "condimento cajún" sí, "pechuga" solo si el dueño rechaza mi propuesta de §2.4.** Si aprueba el cambio a muslo, **hay que actualizar el texto en `catalog.ts` Y en la tabla `secret_signature`.** |
| Ser el sándwich más caro (S/24.90 / S/30.90) | ✅ Con muslo braseado y jugo de servicio. ❌ Con pechuga recalentada en seco. **Ese es el riesgo real: el precio es alto y el deshilachado es frágil.** |
| Badge "Secreto" / desbloqueo por rango INICIADO | ✅ Neutral a la receta. |
| Convive con T04 jalapeño + S02 spicy mayo + S12 picante-miel | ✅ **Por eso bajé la cayena a la mitad.** El cajún al 5.4% estándar habría hecho un sándwich de puro picante. |
| "Condimento cajún" reconocible | ✅ Páprika + ajo + cebolla + orégano + tomillo + pimienta + cayena es cajún de manual. El ají panca es una adición local que suma sin desviar. |
| Ingredientes exclusivos del menú secreto | ✅ P03 y T04 son exclusivos del ciclo. La mezcla cajún también se puede tratar como exclusiva. |

---

## 9. RIESGOS REALES

1. **El precio del pollo en Perú viene subiendo todo 2026** ([Infobae](https://www.infobae.com/peru/2026/03/28/precio-del-pollo-en-lima-y-callao-hoy-cuanto-cuesta-el-kilo-y-por-que-esta-subiendo-en-2026/)). Todo el costeo cuelga de S/17/kg. **SIG06 30CM y BYO P02 30CM cruzan el 45% cuando el pollo pasa de S/21.06/kg** — un 24% de subida. No es improbable en 12 meses.

2. **El S/17/kg no está confirmado y no se sabe si es entero o deshuesado.** Si es *entero*, el deshuesado real cuesta ~S/32/kg y **todos los números de este documento están mal por ~85%**. Es la pregunta #1 de la §10.

3. **La caramelización de P02 no sobrevive el congelado.** Es un hecho físico, no un problema de ejecución. Se resuelve con +90 s por pedido, o se resuelve cambiando el pitch. No hay tercera opción, y las dos tienen costo.

4. **El pollo deshilachado se seca — y P03 va en el sándwich de S/30.90.** Si el dueño se salta los cubos de jugo de servicio (§5.3 paso 11), el sándwich más caro del catálogo llega seco.

5. **El pollo es el mayor riesgo microbiológico del negocio, y el proceso elegido (cocinar → enfriar → congelar → descongelar → recalentar) tiene cinco puntos de falla, no uno.** El enfriado rápido es donde más fácil se rompe en cocina de casa sin abatidor.

6. **Los precios de especias, sillao, vinagre de arroz, salsas y focaccia son estimaciones mías, no cotizaciones.** Si están 30% arriba, SIG06 30CM se acerca al 45%. Hay que cotizarlos antes de dar el margen por bueno.

7. **Doble proteína en 30CM tiene 82.5% de costo sobre el ingreso extra.** Casi cero contribución después de comisión de pago.

8. **No sé qué congelador tiene el dueño.** Dos tandas de pollo son ~5.7 kg de producto congelado, y hay 7 proteínas en el catálogo. El volumen total puede no caber en un congelador doméstico. **Si no cabe, todo el modelo de tandas 1-2x/semana se cae** y es un problema estructural, no de receta.

9. **Cambiar P03 a muslo requiere tocar `catalog.ts` Y `secret_signature` en Supabase** (SIG05 lee de la tabla, el literal del código es solo semilla — CLAUDE.md). Cambiar solo el código no cambiaría nada visible, exactamente la misma trampa que ya costó 3 semanas con los precios.

10. **La calibración de picante de P03 no está validada con un paladar real.** Los 5 g de cayena son un punto de partida razonado, no un número probado. La prueba de la §5.2 cuesta S/8 y hay que hacerla.

11. **La marinada descartada de P02 es costo hundido: S/1.60 por kg de carne = S/6.40 por tanda.** Está contemplado en el costeo, pero es plata que se va al desagüe. Reducir la dilución para "aprovecharla" haría el producto incomible de salado — no es una optimización disponible.

12. **Todos los rendimientos de merma son de fuentes secundarias.** La tabla oficial del USDA está bloqueada por el proxy de este entorno. Se validan pesando la primera tanda; hasta entonces son estimaciones bien fundadas, no mediciones.

---

## 10. PREGUNTAS ABIERTAS PARA EL DUEÑO

**Ninguna de estas está respondida. No asumas la respuesta.**

### Sobre el insumo y el costo
1. **¿El S/17/kg de pollo es de pollo ENTERO o de un corte DESHUESADO?** Es la pregunta que más impacto tiene en todo este documento.
2. ¿Dónde compras el pollo hoy — La Hermelinda, supermercado, una avícola, un proveedor mayorista? ¿Tienes precio por volumen?
3. ¿Cuánto cuesta hoy, en tu proveedor, el kilo de: pollo entero eviscerado · pierna/muslo deshuesado sin piel · pechuga deshuesada?
4. ¿Estás dispuesto a deshuesar pollo entero cuando el precio esté en el piso (regla de §2.2: entero por debajo de S/8.84/kg), o prefieres pagar el deshuesado siempre y no gastar el tiempo?

### Sobre P03 y el catálogo
5. **¿Apruebas cambiar P03 de pechuga a muslo/pierna deshuesada?** (18% más barato y mucho mejor textura tras congelar — §2.4)
6. Si lo apruebas: **¿actualizamos el texto "Pechuga deshilachada" en `catalog.ts` y en `secret_signature`, o lo dejamos como está?**
7. Si NO lo apruebas: ¿aceptas el camino de pechuga pochada (§5.6), sabiendo que la costra cajún se debilita?

### Sobre P02 y el servicio
8. **¿Aceptas el paso de reglaseado de 90 segundos en el armado de cada SIG06?** Es lo único que hace que "caramelizado" sea cierto. Cuesta ~+60 min de servicio al día a 40 pedidos.
9. Si no lo aceptas: **¿autorizas cambiar el pitch de "Pollo teriyaki caramelizado" a algo que el producto sí cumpla** ("teriyaki glaseado", "teriyaki tierno en su glaseado")?

### Sobre ingredientes que no sé si consigues
10. ¿Consigues **mirin** en Trujillo, o vamos con el sustituto (vinagre de arroz + azúcar)?
11. ¿Consigues **vinagre de arroz**? Si no, ¿usamos vinagre blanco (cambia el perfil, más agresivo)?
12. ¿Qué **marca de sillao** usas? El contenido de sal varía mucho entre marcas y afecta directo la salinidad final.
13. ¿Consigues **páprika ahumada** (pimentón de la Vera o similar), o solo páprika normal? El ahumado suma bastante al cajún.
14. ¿Consigues **cayena molida**? Si no, ¿qué ají molido tienes a mano (limo, charapita, panca)?
15. ¿Consigues **cebolla en polvo** y **ajo en polvo** de calidad decente, o solo los sazonadores mixtos de bodega?
16. ¿Prefieres **hacer la mezcla cajún** (9 ingredientes, ~S/6 por 200 g) o **comprarla hecha** (más cara, abastecimiento irregular, sin control del picante)?

### Sobre equipo — esto define si las recetas son ejecutables tal cual
17. **¿Tienes termómetro de cocina?** Si no, ¿autorizas el gasto (~S/25-70, a confirmar precio real)? Sin él no se puede cumplir el estándar sanitario del pollo.
18. **¿Tienes balanza de cocina con precisión de 1 g?** Sin ella, la mezcla cajún en gramos y las porciones de 85/170 g no son ejecutables.
19. ¿Tienes **horno**? Cambia el braseado de P03 (olla tapada 50-60 min vs. horno 160°C 55-65 min).
20. ¿Qué tan grande es tu **sartén/plancha más grande**? Las tandas de 460 g (P02) y 610 g (P03) asumen una superficie amplia. Con una sartén chica, el número de tandas se duplica y el tiempo también.
21. **¿Qué congelador tienes y cuántos litros?** Ver riesgo #8 — puede ser un límite estructural.
22. ¿Tienes **cubetera de hielo** libre para los cubos de jugo de P03? Es literalmente lo que salva ese sándwich.
23. ¿Tienes **tabla de corte exclusiva para pollo crudo**, separada de la de armado?

### Sobre calibración y volumen
24. **¿Qué tan picante quieres realmente SIG05?** Necesito tu paladar, no puedo calibrarlo desde acá. La prueba de la §5.2 cuesta S/8 y 30 minutos.
25. ¿Cuántos pedidos por semana estimas en el mes 1? Las tandas de 4 kg (32 y 30 porciones) son una propuesta, no un dato — si esperas 15 pedidos la primera semana, las tandas deberían ser de 2 kg para no congelar producto que se va a quedar.
26. ¿Qué proporción esperas de 15CM vs 30CM? La hipótesis del negocio es 75-85% en 15CM; si sale al revés, el costo por porción sube y el 30CM de SIG06 es el que aprieta.
