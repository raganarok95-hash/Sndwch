// SND//WCH — api / catalog
// Catálogo de productos (proteínas, signatures, bebidas/sides, recompensas) y toda la
// lógica de tasación/validación de un pedido — nunca confía en precios/etiquetas que
// reporte el cliente, todo se recalcula aquí a partir de estos datos.
import { sbGet } from "./db.ts";
import { ApiError } from "./types.ts";
import { computeRankName , baseSurcharge } from "./env.ts";

// Reestructurado en esta sesión — el original (R01-R06, fijado casi al inicio del
// proyecto) tenía 3 de 6 recompensas que cobraban puntos reales sin entregar ningún
// valor real a cambio (hallazgo de auditoría): R01 (topping extra) ya es gratis e
// ilimitado para todos desde hace tiempo, sin nada que "desbloquear"; R02 (4ta salsa)
// nunca tuvo implementado el descuento; R05 (bebida gratis) tampoco. R01 se retira (no
// hay ningún topping premium real que ofrecer sin inventar un ingrediente/costo que no
// existe). El resto queda repreciado contra el "tipo de cambio" real que ya usaban R04/
// R06 (~20-30 pts por cada sol de valor entregado, ver waiver real en deriveCart):
// R02 ahora perdona el cargo real de "SALSA EXTRA" (S/2) — antes de esto la recompensa
// no tenía ningún efecto en el precio. R03 (antes "SAUCE // SET", sin precio ni
// implementación en ningún lado) se reemplaza por "sube a 30CM gratis" — perdona la
// diferencia real p30-p15 del sándwich elegido. R05 ahora perdona el precio real de una
// bebida (S/3-6) en vez de no hacer nada.
//
// Puntos de R03/R04/R05/R06 subidos ~1.8x (R02 queda igual, ya estaba bien calibrada) —
// la "tasa de cambio" de arriba se fijó asumiendo un costo real de insumo de ~20-30% del
// valor perdonado. Con precios reales de Perú investigados después, el costo real de
// honrar cada canje resultó ser ~45% del valor perdonado (el insumo se gasta igual al
// preparar el producto "gratis", sin importar el margen nominal) — sin subir los puntos,
// cada canje le costaba al negocio bastante más de lo que su propio diseño asumía
// (hallazgo de auditoría financiera, ronda de recalibración de márgenes).
//
// R02 se deja deliberadamente por debajo de la "tasa de cambio" del resto (recalculando
// bajo el estándar de 45%, cuesta ~1.7-2.5x más por punto que R03-R06) — es una
// recompensa de bajo umbral a propósito, para dar un primer canje rápido a un cliente
// recién registrado, no un descuido de la recalibración (hallazgo de auditoría
// financiera de esta ronda, que pidió documentar la intención en vez de subirla).
//
// R03 subido de 270 a 320 pts (auditoría de menú, ronda posterior) — a 270 pts entregaba
// solo 33.75 pts/sol (270/S/8, el tope real de R03_FLAT_WAIVER más abajo), por debajo de
// la banda ~36-54 pts/sol que ya tienen R04-R06 tras la recalibración de arriba, sin
// ninguna razón documentada (a diferencia de R02, que sí está anotada como intencional).
// A 320 pts queda en 40 pts/sol, dentro de la banda — DEBE coincidir con RWDS.R03 en
// src/app.ts.
// R02/R03 renombrados para coincidir con RWDS en src/app.ts (antes "4TA // SALSA" y
// "SUBE A 30CM // GRATIS" — el cliente mostraba un nombre distinto en el checkout que
// el que terminaba guardado/mostrado en el historial y recibos, además de romper la
// convención sustantivo // sustantivo que sí siguen R04/R05/R06) — hallazgo de
// auditoría de copy, BAJO.
// TASA ÚNICA: 20 puntos por cada sol que perdona la recompensa (= 5% de retorno, porque
// los puntos se ganan 1 por sol gastado). R03 y R04 estaban en 40 y 53 pts/sol: por los
// mismos 320 puntos al cliente le convenía esperar a R06 y llevarse un sándwich entero,
// así que eran opciones muertas. Ver el detalle completo junto a RWDS en src/app.ts.
// DEBE coincidir con RWDS en src/app.ts — y estos puntos TAMBIÉN viven en `catalog_prices`
// (categoría 'reward'), que es la fuente real en runtime: loadCatalogPrices() los carga
// encima de estos literales, así que cambiar solo esto no cambia nada.
export const REWARDS: Record<string, { pts: number; label: string }> = {
  // ── PUNTOS RECALIBRADOS EL 2026-09-05: TODAS DEVUELVEN LO MISMO ───────────────────────
  //
  // Un punto se gana 1:1 por sol gastado, así que "puntos que cuesta" es literalmente "soles
  // que hay que gastar". Dividir lo que a NOSOTROS nos cuesta honrar el canje entre esos
  // puntos da el descuento efectivo que cada recompensa entrega. Estaba así de disparejo:
  //
  //     4ta salsa ......  40 pts, nos cuesta S/0.27  ->  devuelve 0.67%
  //     15CM gratis .... 400 pts, nos cuesta S/5.90  ->  devuelve 1.48%
  //     bebida gratis .. 120 pts, nos cuesta S/2.34  ->  devuelve 1.95%
  //     doble proteína . 120 pts, nos cuesta S/2.47  ->  devuelve 2.06%
  //     subir a 30CM ... 160 pts, nos cuesta S/4.61  ->  devuelve 2.88%
  //
  // Un FACTOR 4.3 entre la más barata y la más cara PARA EL NEGOCIO. Un cliente que mira los
  // números canjea siempre "subir a 30CM" y nunca las otras cuatro, que quedan de decorado —
  // y el programa termina pagando el canje más caro cada vez.
  //
  // Todo queda anclado en R06, que NO se puede mover: `REFERRER_REWARD_POINTS` debe valer
  // exactamente lo mismo y `npm run parity` lo verifica. Su tasa (1.48%) es la de referencia.
  // Dispersión resultante: de 4.3x a 1.2x.
  //
  // ⚠ Estos números son SEMILLA. La fuente en runtime es `catalog_prices` (categoría
  // `reward`), actualizada en la misma sesión — cambiar solo esta línea no cambia nada.
  R02: { pts: 20, label: "SALSA // EXTRA" },        // devuelve 1.33%
  R04: { pts: 160, label: "DOBLE // PROTEÍNA" },    // devuelve 1.54%
  R05: { pts: 160, label: "BEBIDA // GRATIS" },     // devuelve 1.46%
  R03: { pts: 320, label: "TAMAÑO // 30CM" },       // devuelve 1.44%
  R06: { pts: 400, label: "SÁNDWICH // GRATIS" },   // devuelve 1.48% — el ancla, no se mueve
};

// B02 (HERBS//CHEESE) retirado por decisión del dueño — posible reincorporación futura,
// ver el mismo cambio (con el detalle completo) en BASES en src/app.ts.
export const VALID_BASES = new Set(["B01", "B03"]);
// T08 (Apio) agregado 2026-08-08 (decisión del dueño, LLM Council de menú) — ver el mismo
// cambio en TOPS en src/app.ts.
// T07 (Giardiniera) fuera desde el 2026-08-22: se retiró con THE CHICAGO (SIG07), su
// único consumidor. Ver el comentario del retiro en SIG_DATA más abajo.
// T09 (Lechuga) agregado 2026-09-04 (decisión del dueño: igualar los gramajes al estándar
// de Subway). Era el único ingrediente de su set estándar que no existía en el catálogo, y
// además el de MAYOR volumen (21 g en el 6-inch) y el más barato por gramo — o sea lo que
// más hace que un sándwich se vea lleno, por lo que menos cuesta. Ver CAMINO_MENU.md §1.
export const VALID_TOPS = new Set(["T01", "T02", "T03", "T04", "T05", "T06", "T08", "T09"]);
// C01 renombrado de Americano a Mozzarella 2026-08-08 (decisión del dueño, LLM Council de
// menú) — precio real investigado (Braedt ~S/22.50/kg) similar o menor al proxy genérico
// de queso (S/35/kg) ya usado en MENU_FINANCIAL_ANALYSIS.md, y con mejor derretido que el
// Americano procesado que reemplaza — el id no cambia, solo el label (ver CHEESE en
// src/app.ts). C02 (Cheddar) se mantiene sin cambio.
export const VALID_CHEESE = new Set(["C01", "C02", "C03"]);
// S07 (RANCH) retirado por decisión del dueño — ver el mismo cambio en SAUCES en
// src/app.ts.
// Proteínas que NO admiten doble porción. El atún es la única (decisión del dueño
// 2026-08-21) y el número lo respalda: `pDbl` es un recargo PLANO pero la porción que
// agrega escala con el tamaño, así que en un 30CM se cobraban S/9 por 170g de atún que
// cuestan S/11.39 — la única operación del catálogo con margen NEGATIVO (−26.6%). El
// cliente ya no la ofrece (bandera `noDouble` en PROTS), pero el servidor tiene que
// rechazarla igual: nunca confía en lo que manda el cliente.
export const NO_DOUBLE_PROTS = new Set(["P04"]);

// S09 vuelve al catálogo (decisión del dueño 2026-08-21) después de haberse retirado el
// mismo día junto con The Ember (SIG08), que era su único consumidor. Vuelve CAMBIADA:
// ahora lleva ají y es picante. Eso resuelve de paso el hueco más grave que encontró el
// council de salsas — las 2 únicas salsas picantes (S02, S12) son exclusivas del menú
// secreto, así que ARMA EL TUYO no tenía NINGUNA opción picante para el público general,
// en un negocio de comida en Perú. S09 es ahora esa opción.
// S13 (Au Jus) fuera desde el 2026-08-22: salía de la cocción de P07 y solo se servía en
// THE CHICAGO (SIG07); los dos se retiraron.
export const VALID_SAUCES = new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S08", "S09", "S10", "S11", "S12"]);
// P04/P05 p30 subido (22→25, 26→30) — el salto de precio 15CM→30CM era un monto fijo
// por proteína sin importar su costo real; el atún y el embutido italiano cuestan casi
// el doble por kilo que pollo/res, así que duplicar su porción a 30CM subía el costo
// real bastante más de lo que el precio fijo alcanzaba a cubrir (hallazgo de costeo real
// con precios de insumos de Perú). Mismo criterio en pDbl de P04: en el momento de esta
// decisión, se creía que atún (~S/38/kg) costaba igual que el embutido italiano de P05
// (~S/38/kg, pDbl:9) pero antes cobraba solo S/5 — menos que P01/P02 (pollo/res, más
// baratos) — subido a 9 para igualar a P05.
// NOTA (corregida en la re-auditoría de 10 agentes, BAJO — comentario desactualizado, sin
// cambio de precio): esa paridad de costo ya NO es cierta. CLAUDE.md/MENU_FINANCIAL_ANALYSIS.md
// documentan atún a ~S/67/kg (investigado online, sin cotización real todavía) y embutido a
// S/48/kg (precio real confirmado por el dueño, 2026-08-01) — ~40% de diferencia, no
// paridad. El precio de venta se deja igual a propósito (pDbl:9 en ambos), pero eso ahora
// significa que la doble proteína de atún en BYO rinde bastante menos margen que la de
// embutido con el mismo precio — ver MENU_FINANCIAL_ANALYSIS.md §2.2 (36.7% vs 52.8%).
// P04 p15/p30 subidos otra vez (14/25→16/30, análisis financiero de otra sesión) —
// con el mismo costo real por kilo que P05, el atún BYO rentaba solo 46.4%/44.0% contra
// el objetivo del negocio (~55% margen), mientras P05 con costo idéntico ya rentaba
// 53.1%/53.3% a este mismo precio. THE FRESH (SIG04) no se toca — su precio vive aparte
// en SIG_DATA y ya rentaba sano; el problema era solo la proteína suelta en BUILD YOUR
// OWN. DEBE coincidir con PROTS en src/app.ts.
// `pDbl` es el recargo de doble proteína en 15CM y `pDbl30` el de 30CM. Antes había UN
// solo `pDbl` plano para los dos tamaños y eso cobraba mal: la porción que agrega el doble
// escala con el tamaño (85 g en 15CM, 170 g en 30CM) pero el recargo no. Con los costos
// reales YA CON MERMA del recetario (2026-08-22), el doble en 30CM costaba más de lo que
// cobraba en 3 de 4 proteínas: res S/6.30 de insumo por S/6 cobrados (105%), embutido
// S/8.59 por S/9 (95%), pollo S/4.95 por S/6 (83%). Es el mismo defecto que ya había
// obligado a apagar el doble de atún (NO_DOUBLE_PROTS), solo que ahí se apagó el producto
// en vez de corregir la estructura.
// Se sube SOLO donde el costo pasaba el techo de 45%: P06 se queda en 6/6 porque ya estaba
// sano (22% y 45%) — el 45% es un techo, no una meta a la que haya que subir.
// DEBEN coincidir con PROTS en src/app.ts.
// +S/2 en TODOS los p30 el 2026-09-04 (decisión del dueño). El 30CM es donde el ARMA EL
// TUYO se rompía: el pan y la proteína se duplican pero el precio solo subía S/8, así que el
// piso fijo (S/6.40 a 30CM) se comía el margen. Con esto res 30CM baja de 55.5% a 51.0% y
// pollo de 51.8% a 47.5% — todavía sobre el techo, pero el dueño eligió S/2 y no los S/5.32
// que harían falta para llevar res exactamente al 45%: una subida así en el producto de
// ticket alto, en un negocio que aún no abre, cuesta más de lo que el techo vale.
// ⚠ Un cambio de precio NO está terminado hasta que `catalog_prices` lo refleje.
export const PROT_PRICE: Record<string, { p15: number; p30: number; pDbl: number; pDbl30: number }> = {
  P01: { p15: 14.9, p30: 24.9, pDbl: 7, pDbl30: 14 },
  P02: { p15: 13.9, p30: 23.9, pDbl: 6, pDbl30: 11 },
  // P03 sube igual que los demás por coherencia de la tabla, aunque no tiene efecto público:
  // es vaultOnly, así que no se puede pedir por ARMA EL TUYO.
  P03: { p15: 13.9, p30: 23.9, pDbl: 6, pDbl30: 11 },
  P04: { p15: 16.9, p30: 32.9, pDbl: 10.9, pDbl30: 21.9 },
  P05: { p15: 16.9, p30: 32.9, pDbl: 9.9, pDbl30: 19.9 },
  // pDbl bajado de 7 a 6 — carne molida (~S/10/kg) es el insumo más barato del catálogo,
  // no tenía sentido que costara más que la doble proteína de res/pollo (P01/P02,
  // pDbl:6, insumos 2-4x más caros por kilo). DEBE coincidir con PROTS.P06 en src/app.ts.
  // pDbl30 corregido de 6 a 12 el 2026-09-05: era la única proteína cuyo doble costaba lo
  // mismo en los dos tamaños. Ver el comentario largo en PROTS.P06 (src/app/01-*).
  P06: { p15: 14.9, p30: 26.9, pDbl: 6, pDbl30: 12 },
  // P08 (PAVO // HORNEADO) entra el 2026-09-06 (decisión del dueño). Es la 4ta proteína del
  // armador, que había quedado con TRES al salir res y embutido por rentabilidad.
  //
  // ⚠ LO QUE LA HACE VIABLE ES QUE NO TIENE MERMA DE COCCIÓN. Es fiambre: 1 kg comprado es
  // 1 kg servido. Todas las demás pierden en la olla —res 0.54, pollo 0.64-0.69— así que su
  // costo real por porción es ~1.85x el del insumo crudo. Acá el precio del insumo ES el
  // costo de la porción, y por eso una proteína a S/44.20/kg (más cara por kilo que la res a
  // S/20) sale más barata por sándwich que la res.
  //   85 g × S/44.20/kg = S/3.76 · 170 g = S/7.51
  // Con el piso fijo del armador (S/3.35 en 15CM, S/5.41 en 30CM) el precio que deja el costo
  // exactamente en el techo de 45% es 2.222 × (piso + proteína): S/15.79 y S/28.72. Se cobra
  // S/15.90 y S/28.90 por la convención de .90 — 44.7% de costo en LOS DOS tamaños.
  //
  // [WEB] S/43.75/kg es el precio RETAIL de jamón de pavo Braedt en Metro/Vivanda; se costea
  // a S/44.20 por conservador. Al por mayor (Makro Trujillo) debería estar por debajo, así
  // que el error cae del lado seguro. Falta cotización propia del dueño.
  //
  // pDbl 9 / pDbl30 17: la porción que agrega cuesta S/3.76 y S/7.51, o sea 41.8% y 44.2%.
  // Se calcularon contra el costo REAL de la porción extra, no copiando el de otra proteína —
  // que es el defecto que ya obligó a partir `pDbl` en dos y a corregir P06.
  // DEBE coincidir con PROTS.P08 en src/app/01-*.
  P08: { p15: 15.9, p30: 28.9, pDbl: 9, pDbl30: 17 },
  // P07 (RES // CHICAGO) fuera desde el 2026-08-22 — se retiró con SIG07, su único
  // consumidor. Para restaurarlo: P07: { p15: 14.9, p30: 22.9, pDbl: 6 }.
};
// Proteína/toppings/salsas exclusivas del sándwich secreto — no se pueden pedir por
// BUILD YOUR OWN aunque sigan en PROT_PRICE/VALID_TOPS/VALID_SAUCES (deriveCart/
// deriveOrder las siguen necesitando para tasar SIG05). Es lo que hace que el precio del
// menú secreto sea justificable: no existe forma de armar el mismo sándwich más barato
// fuera de él. Antes eran Sets fijos en código (solo Pollo Cajún/Jalapeño/Spicy Mayo/
// Picante Miel, hardcodeados); desde la rotación mensual del sándwich secreto (decisión
// del dueño, 2026-08-10) el contenido de estos 3 Sets se recalcula en cada
// loadSecretSignature() a partir de `vault_only_ids` de la fila vigente en la tabla
// `secret_signature` — mutables (.clear()/.add()) en vez de literales para que ese
// refresco funcione sin reasignar el binding que ya importan otros módulos.
export const VAULT_ONLY_PROTS = new Set(["P03"]);
export const VAULT_ONLY_TOPS = new Set(["T04"]);
export const VAULT_ONLY_SAUCES = new Set(["S02", "S12"]);
// Nombre del sándwich secreto vigente (ej. "Reserva de Agosto") — separado de
// SIG_LABEL.SIG05 porque ese trae pegado el sufijo " // RESERVE" usado en notificaciones/
// recibos, mientras que este es el nombre "limpio" que se muestra en la tarjeta del
// cliente (ver secretSig.n en src/app.ts). `let` en vez de `const` porque
// loadSecretSignature() lo reasigna en cada refresco (a diferencia de los Sets de
// arriba, un string no se puede mutar in-place).
export let SECRET_SIGNATURE_NAME = "Menú secreto";
// Ingredientes exclusivos de un signature PÚBLICO (no del menú secreto, que usa los
// VAULT_ONLY_* de arriba): existen en PROT_PRICE/VALID_TOPS/VALID_SAUCES para que
// SIG_DATA/priceCartItem puedan tasar ese Signature, pero no son seleccionables por BUILD
// YOUR OWN (ver priceByoBuild más abajo).
// Los tres quedan VACÍOS desde el 2026-08-22, cuando se retiró THE CHICAGO (SIG07) —
// era el único Signature público con ingredientes exclusivos (S13 Au Jus, T07
// Giardiniera, P07 corte Chicago). El mecanismo se queda intacto a propósito: es el
// mismo que va a hacer falta cuando SIG07 vuelva, o cuando aparezca otro Signature con
// un ingrediente propio.
export const SIG_ONLY_SAUCES = new Set<string>([]);
// T08 (Apio) pasa a SIG-ONLY el 2026-09-04 (decisión del dueño: sacarlo de ARMA EL TUYO).
// NO se borra del catálogo: THE FRESH (SIG04) lo lleva, y es su ÚNICO elemento crocante —
// entró ahí el 2026-08-08 justamente porque el pimiento curado no aportaba crocancia y la
// receta quedaba sin ninguna. Borrarlo dejaría a ese Signature sin la textura por la que se
// eligió. `sigOnly` es exactamente el mecanismo para esto: el cliente no lo ve en el
// armador, la receta lo sigue usando, y deriveCart lo sigue tasando.
// T02 (Pepinillo) se suma el 2026-09-05: el dueño lo cambia por LECHUGA (T09) en ARMA EL
// TUYO. No se borra — SIG01 (The Original) y SIG03 (The Smoke) lo llevan en su receta.
export const SIG_ONLY_TOPS = new Set<string>(["T08", "T02"]);
// P01 (Res) y P05 (Embutido) salen de ARMA EL TUYO el 2026-09-05 (decisión del dueño), por
// RENTABILIDAD y no por producto. Cada una se pasaba del techo de 45% de costo en un tamaño:
//   · Res 30CM ....... 47.6%  (el 15CM estaba en 44.2%)
//   · Embutido 15CM .. 45.7%  (el 30CM estaba en 43.0%)
// Son las dos únicas del armador que lo cruzaban. Ver RENTABILIDAD_POR_PARTE.md.
//
// NO se borran, por lo mismo que el apio: THE ORIGINAL (SIG01) lleva P01 y THE SMOKE (SIG03)
// lleva P05. En una receta cerrada el costo está calculado y las dos rinden — el problema es
// el armador de elección libre, donde el cliente combina el tamaño caro con el pan caro y
// nadie costeó esa combinación. `sigOnly` es exactamente ese mecanismo.
//
// ⚠ CONSECUENCIA A NO OLVIDAR: con estas dos fuera, ARMA EL TUYO queda con TRES proteínas
// visibles (P02 pollo teriyaki, P04 atún, P06 albóndiga), porque P03 es exclusiva del menú
// secreto. Tres es poco para una sección cuyo argumento entero es que tú eliges — si vuelve
// a haber margen (proveedor más barato, o subir el precio), lo primero que hay que revisar
// es devolver P01 acá.
export const SIG_ONLY_PROTS = new Set<string>(["P01", "P05"]);
// Signatures de menú secreto/premium ("RESERVE" en el tag del cliente) — excluidas de
// R06 ("SÁNDWICH 15CM // GRATIS") para que esa recompensa no pueda gamearse eligiendo el
// Signature más caro disponible (SIG05, el menú secreto, S/24.90) muy por encima del
// resto del catálogo — mismo criterio que R03_FLAT_WAIVER. SIG07 salió de este Set al
// retirarse del catálogo el 2026-08-22.
export const RESERVE_SIGS = new Set(["SIG05"]);
// Recargo de doble proteína del tamaño pedido. Único punto donde se decide pDbl vs
// pDbl30 en el servidor — si agregas un cálculo nuevo de doble proteína, pásalo por acá.
// DEBE coincidir con dblFee() en src/app.ts.
export function dblFee(pr: { pDbl: number; pDbl30: number } | undefined, size: "15" | "30"): number {
  if (!pr) return 0;
  return size === "30" ? pr.pDbl30 : pr.pDbl;
}
// Contenido editable de cada Signature público (nombre, subtítulo, badge, pitch, foto y
// si está activo). Antes esto vivía SOLO en el array SIGS de src/app.ts, o sea que cambiar
// el nombre o el texto de un sándwich exigía editar el cliente y redesplegar. Ahora la fila
// vigente de `catalog_items` lo sobreescribe, igual que loadSecretSignature() ya hace con
// SIG05, y el cliente lo recibe resuelto por `get-catalog`.
//
// Estos literales son SEMILLA: valen para el primer arranque de cada instancia y como
// respaldo si la base no responde. Nunca edites acá para cambiar el menú — eso se hace
// desde Admin // Catálogo // Signatures.
export const SIG_CONTENT: Record<string, { n: string; s: string; badge: string; pitch: string; img: string | null; active: boolean }> = {
  SIG01: { n: "The Original", s: "Signature", badge: "Clásico", pitch: "", img: "img/sig01.jpg", active: true },
  SIG02: { n: "The Marinara", s: "Signature", badge: "Italiano", pitch: "", img: "img/sig02.jpg", active: true },
  SIG03: { n: "The Smoke", s: "Signature", badge: "Ahumado", pitch: "", img: "img/sig03.jpg", active: true },
  SIG04: { n: "The Fresh", s: "Signature", badge: "Cítrico", pitch: "", img: "img/sig04.jpg", active: true },
  SIG06: { n: "The Teriyaki", s: "Signature", badge: "Asiático", pitch: "", img: "img/sig06.jpg", active: true },
};
export const SIG_DATA: Record<string, { base: string; prot: string; tops: string[]; sauces: string[]; p15: number; p30: number; cheeseOptional?: boolean; fixedCheese?: string }> = {
  // Precio de curaduría (2026-08-08, decisión del dueño tras auditoría financiera/LLM
  // Council): revierte el criterio anterior de "premio S/0 a 30CM frente a BUILD YOUR
  // OWN" documentado en los comentarios de abajo — SIG01/02/03/06 p30 y SIG04 p15+p30
  // quedaban EXACTAMENTE igualados al precio de armar la misma proteína+tamaño por BYO
  // (priceByoBuild cobra directo PROT_PRICE[prot].p15/p30, sin sumar nada por curaduría).
  // +S/2 solo en los puntos exactos de paridad — DEBE coincidir con SIGS en src/app.ts.
  SIG01: { base: "B01", prot: "P01", tops: ["T01", "T02", "T03"], sauces: ["S01", "S04"], p15: 20.9, p30: 26.9 },
  // RANCH (antes S07) ya no existe en el catálogo — esta receta ya venía sin ella (ver
  // mismo cambio en src/app.ts, DEBE coincidir).
  // Queso corregido de OPCIONAL a FIJO 2026-08-08 (decisión del dueño, LLM Council de
  // menú — investigación real confirmó que el queso derretido es un componente
  // estructural del plato en sus comparables exitosos, "melted mozzarella is what makes
  // a Meatball Sub", no un extra). fixedCheese:'C01' (Mozzarella, ver VALID_CHEESE arriba)
  // se agrega siempre a ingredientsPerUnit en priceSigBuild, sin depender de que el
  // cliente lo pida. Sin cambio de precio (costo real ~S/0.39-0.77/unidad, confirmado por
  // el dueño que no amerita subir S/19/26). base movida de B02 (retirado) a B01 — DEBE
  // coincidir con SIGS en src/app.ts.
  SIG02: { base: "B01", prot: "P06", tops: ["T01", "T03", "T05"], sauces: ["S06"], p15: 21.9, p30: 28.9, fixedCheese: "C01" },
  // TERIYAKI (S08) retirada esta sesión — perfil asiático ajeno a "fiambres italianos"
  // (ver mismo cambio en src/app.ts, DEBE coincidir).
  // p30 subido de 26 a 30 (mismo motivo que P05 en PROT_PRICE arriba: el embutido
  // italiano cuesta casi el doble por kilo que pollo/res, duplicar su porción a 30CM
  // costaba más de lo que el precio fijo anterior cubría) — mantiene el criterio de
  // premio S/0 a 30CM frente a armarlo en BUILD YOUR OWN.
  // Queso FIJO agregado 2026-08-08 (mismo criterio y misma sesión que SIG02 arriba) —
  // fixedCheese:'C02' (Cheddar), comparable exitoso investigado (Firehouse "Smokehouse
  // Beef & Cheddar Brisket") combina ahumado+BBQ+cheddar derretido como estándar de la
  // categoría. Sin cambio de precio.
  SIG03: { base: "B03", prot: "P05", tops: ["T03", "T02", "T01"], sauces: ["S03"], p15: 23.9, p30: 34.9, fixedCheese: "C02" },
  // p30 subido de 22 a 25 (mismo motivo — atún cuesta casi el doble por kilo que pollo,
  // ver PROT_PRICE.P04) — mantiene el criterio de premio S/0 a 30CM ya aceptado para
  // THE ORIGINAL/THE MARINARA/THE SMOKE.
  // p30 subido de 25 a 30 — se nos escapó actualizar este Signature cuando P04 (atún)
  // subió su p30 de 25 a 30; DEBE coincidir con SIGS.SIG04 en src/app.ts.
  // Receta corregida 2026-08-08 (decisión del dueño, LLM Council de naming/sabor): se
  // quita el Aioli (S01, segunda base cremosa que duplicaba la mayonesa ya incluida en
  // P04 "Atún premium con mayonesa clásica") y se agrega un chorrito de limón real — el
  // badge CÍTRICO ahora se sostiene con un ingrediente cítrico directo en vez de depender
  // del limón que llevaba el Aioli. El limón es un ingrediente de preparación, no una
  // salsa seleccionable — no tiene entrada en VALID_SAUCES/SIG_ONLY_SAUCES arriba, solo
  // vive en el pitch de SIGS.SIG04 en src/app.ts (confirmado con el dueño 2026-08-08).
  // Mantiene la mostaza Dijon (S11). Pimiento (T06) reemplazado por Apio (T08) 2026-08-08
  // (decisión del dueño, LLM Council de menú) — el pimiento curado no aportaba crocancia
  // real, dejando la receta con un solo elemento crocante. DEBE coincidir con SIGS.SIG04
  // en src/app.ts.
  // T08 (Apio) sale de la receta el 2026-09-05 (decisión del dueño). Semilla alineada con
  // catalog_items, que es la fuente vigente — ver 20260905183956_the_fresh_sin_apio.sql.
  SIG04: { base: "B01", prot: "P04", tops: [], sauces: [], p15: 20.9, p30: 34.9 },
  // p30 bajado de 22 a 21 (decisión del dueño) — quedaba S/1 por encima de armarlo en
  // BUILD YOUR OWN (P02 cuesta S/21 a 30CM), rompiendo por poco el criterio de premio
  // S/0 a 30CM ya aplicado a THE ORIGINAL/THE MARINARA/THE SMOKE/THE FRESH.
  // Pepinillo (T02) quitado 2026-08-08 (decisión explícita del dueño, mismo cambio que
  // SIGS.SIG06 en src/app.ts) — queda Tomate+Pimiento. El riesgo de "doble dulce"
  // (teriyaki+satay) que el pepinillo mitigaba sin querer queda sin cortar, documentado
  // a propósito, sin reemplazo agregado sin pedido explícito del dueño.
  SIG06: { base: "B01", prot: "P02", tops: ["T01", "T06"], sauces: ["S10", "S05"], p15: 19.9, p30: 25.9 },
  // SIG07 (THE CHICAGO) retirado del catálogo de apertura el 2026-08-22 por costo de
  // producción, no por el producto — ver el comentario completo en SIGS de src/app.ts.
  // Para restaurarlo:
  //   SIG07: { base: "B01", prot: "P07", tops: ["T07"], sauces: ["S13"], p15: 22, p30: 29.9 },
  // más P07 en PROT_PRICE/PROT_LABEL/SIG_ONLY_PROTS, T07 en VALID_TOPS/TOP_LABEL/
  // SIG_ONLY_TOPS, S13 en VALID_SAUCES/SAUCE_LABEL/SIG_ONLY_SAUCES, SIG_LABEL.SIG07 y
  // SIG07 en RESERVE_SIGS.
  // Menú secreto — ver SIG_GATES. Nunca aparece en el menú público; solo un cliente que
  // ya alcanzó el rango exigido lo ve/puede pedirlo (ver sigGateError). Valores de abajo
  // son solo el respaldo inicial/semilla — desde la rotación mensual (decisión del dueño,
  // 2026-08-10) loadSecretSignature() los sobreescribe en cada refresco con la fila
  // vigente de la tabla `secret_signature` (ver esa función más abajo), igual que
  // loadCatalogPrices() ya hace con los precios. No editar este literal para cambiar el
  // sándwich del mes — eso se hace desde el panel admin.
  SIG05: { base: "B03", prot: "P03", tops: ["T04", "T06", "T03"], sauces: ["S02", "S12"], p15: 24.9, p30: 30.9 },
};
// Sabores con acceso restringido — hoy solo el menú secreto (permanente), pero el mismo
// campo earlyAccessUntil sirve para abrir un Signature nuevo antes al Círculo Interno y
// recién después a todos (poner una fecha ISO ahí en vez de dejarlo indefinido). Se
// compara contra customers.total_orders de la SESIÓN que hace el pedido — un invitado
// (sin sesión) nunca puede pedirlos, sin importar qué diga el carrito.
// Bajado de 15 a 5 pedidos (decisión de negocio) para que el menú secreto se desbloquee
// mucho antes en la vida del cliente — DEBE coincidir con SIG05.minOrders en src/app.ts.
// minOrders también admin-editable por fila desde la rotación mensual — ver
// loadSecretSignature(), que sobreescribe SIG_GATES.SIG05.minOrders igual que sobreescribe
// SIG_DATA.SIG05 arriba.
export const SIG_GATES: Record<string, { minOrders: number; earlyAccessUntil?: string }> = {
  // Bajado 15 → 5 → 3 pedidos (el paso a 3 es del 2026-08-26). SEMILLA únicamente: el valor
  // real vive en `secret_signature.min_orders` y loadSecretSignature() lo sobreescribe en
  // cada refresco, así que se edita desde Admin // Menú secreto sin desplegar nada.
  SIG05: { minOrders: 3 },
};
export function sigGateError(sigId: string, totalOrders: number): string | null {
  const gate = SIG_GATES[sigId];
  if (!gate) return null;
  if (gate.earlyAccessUntil && Date.now() >= new Date(gate.earlyAccessUntil).getTime()) return null;
  if (totalOrders >= gate.minOrders) return null;
  // El nombre de rango se deriva de RANKS (computeRankName) en vez de estar escrito a
  // mano acá — antes decía "Círculo Interno" fijo, que dejó de ser cierto en cuanto el
  // umbral bajó a 5 pedidos (ese número corresponde a "INICIADO", no a Círculo Interno).
  return `Ese sabor es exclusivo de ${computeRankName(gate.minOrders)} — sigue pidiendo para desbloquearlo.`;
}
// Variantes de temporada real — hoy no hay ninguna (THE EMBER se retiró antes de abrir:
// era THE ORIGINAL con otra salsa, misma proteína, S/4 menos, y su chimichurri de piña
// era la salsa más lenta del catálogo para el Signature de menor precio). El mecanismo se
// conserva porque la próxima edición limitada solo tiene que agregar una línea acá — a
// diferencia de SIG_GATES (acceso que se ABRE con el tiempo/rango), esto es acceso que
// se CIERRA en una fecha fija. Vencido el `until`, el ítem deja de poder pedirse aunque
// alguien arme el request a mano contra la API sin pasar por la UI (que ya lo oculta,
// ver sigAvailable() en src/app.ts) — el servidor es quien de verdad lo rechaza.
export const SIG_AVAILABILITY: Record<string, { until: string }> = {};
export function sigAvailabilityError(sigId: string): string | null {
  const avail = SIG_AVAILABILITY[sigId];
  if (!avail) return null;
  if (Date.now() < new Date(avail.until + "T23:59:59").getTime()) return null;
  return "Ese sabor fue una edición de temporada y ya no está disponible.";
}
// Usado por actPrepareOrder/actPlaceOrder ANTES de reservar inventario o cobrar — un
// carrito con un sabor restringido para quien lo manda se rechaza igual que un producto
// agotado, nunca solo se "ignora" el ítem en silencio.
export function assertCartGatesAllowed(rawItems: any, totalOrders: number): void {
  if (!Array.isArray(rawItems)) return;
  for (const it of rawItems) {
    if (it && it.type === "sig" && typeof it.sigId === "string") {
      const err = sigGateError(it.sigId, totalOrders) || sigAvailabilityError(it.sigId);
      if (err) throw new ApiError(err, 403);
    }
  }
}
// D01-D05 (chicha morada, inca kola, agua, papas, galleta) se retiraron del catálogo a
// pedido del dueño — solo era reventa de botellas/paquetes sin nada distinto a lo que
// vende cualquier otro local. Pedidos viejos que ya tenían estos códigos en su
// items[] siguen mostrando bien (ver statItemLabel/statUnitPrice más abajo, y el
// try/catch en restockOrderItems de orders.ts que ya contemplaba ítems legados que no
// encajan en el catálogo actual) — solo dejan de poder pedirse de nuevo.
// PRECIOS +S/2 (y +S/3 en el chai) el 2026-08-22, decisión del dueño. El margen de
// 61-84% que el negocio venía usando para las bebidas costeaba SOLO el insumo, nunca el
// envase: con una botella con tapa a rosca a ~S/1 (estimado, falta cotizar) el margen real
// era 56-66%. El chai lleva +S/3 porque es el único con costo de insumo alto de verdad.
// DEBEN coincidir con SIDES en src/app.ts.
//
// D09 (THE SPICE // CHAI) sale del menú el 2026-09-06, decisión del dueño. El número lo
// respalda: costeado por BOTELLA DE MEDIO LITRO —que es el envase real, no el vaso de 300 ml
// que suponía el recetario— el chai queda en 42.5% de costo contra 19-32% de las tres
// infusiones. Es la única bebida cerca del techo de 45%, y la única cuyo insumo caro no es
// la infusión sino la LECHE: media botella de chai es media botella de un insumo que se
// compra, mientras que en las otras tres el 99% del volumen es agua.
// Además era la única con un insumo que no se puede stockear (ver RECETARIO.md PARTE 4).
// Para restaurarlo: D09 acá y en SIDE_LABEL, la entrada en SIDES (src/app/01-*), y una fila
// `('D09','side','{"price":9}')` en catalog_prices.
export const SIDE_PRICE: Record<string, number> = { D06: 6, D07: 5, D08: 6 };
export const SIDE_LABEL: Record<string, string> = {
  // Catálogo de bebidas de la casa — sin jugos a propósito (decisión de negocio: los
  // jugos ya los vende cualquier juguería del barrio, esto busca diferenciarse).
  D06: "THE BLOOM // HIBISCUS",
  D07: "THE MIDNIGHT // BREW",
  D08: "THE COOL // MINT",
};
// "BUILD" se renombró a "SIGNATURE" (hallazgo de auditoría UX, CRÍTICO) — chocaba con el
// modo "BUILD YOUR OWN" del cliente. DEBE coincidir con el tag `s` de SIGS en src/app.ts.
// SIG02 renombrado de "THE MEATBALL" a "THE MARINARA" 2026-08-08 (decisión del dueño, LLM
// Council de naming/sabor) — "The Meatball" (inglés) repetía el mismo ingrediente que su
// propia proteína interna ya muestra en español ("ALBÓNDIGA // MARINARA", ver PROT_LABEL
// abajo), bilingüismo visible en la misma tarjeta. "Marinara" es un préstamo ya usado
// igual en español e inglés (la salsa italiana), evita la traducción duplicada y sigue
// encajando con el badge "Italiano". DEBE coincidir con SIGS.SIG02 en src/app.ts.
export const SIG_LABEL: Record<string, string> = {
  SIG01: "THE ORIGINAL // SIGNATURE",
  SIG02: "THE MARINARA // SIGNATURE",
  SIG03: "THE SMOKE // SIGNATURE",
  SIG04: "THE FRESH // SIGNATURE",
  SIG05: "MENÚ SECRETO // RESERVE",
  SIG06: "THE TERIYAKI // SIGNATURE",
};
// Antes cambiar un precio requería editar el mismo número en 2 lugares (index.html Y
// esta función) y redesplegar ambos — ver migración create_catalog_prices_table. Esto
// sobreescribe los números hardcodeados de arriba con lo que haya en la tabla, dejando
// nombres/ingredientes/composición sin tocar (siguen siendo criterio de un developer,
// cambian con mucha menos frecuencia). Se llama al inicio de cada acción sensible al
// precio — a esta escala de negocio, un round-trip extra por pedido es aceptable frente
// a la simplicidad de no tener que cachear/invalidar nada.
export async function loadCatalogPrices(): Promise<void> {
  try {
    const rows = await sbGet("catalog_prices", "select=code,category,values");
    for (const row of rows) {
      const v = row.values || {};
      if (row.category === "protein" && PROT_PRICE[row.code]) {
        if (typeof v.p15 === "number") PROT_PRICE[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") PROT_PRICE[row.code].p30 = v.p30;
        if (typeof v.pDbl === "number") PROT_PRICE[row.code].pDbl = v.pDbl;
        if (typeof v.pDbl30 === "number") PROT_PRICE[row.code].pDbl30 = v.pDbl30;
      } else if (row.category === "sig" && SIG_DATA[row.code]) {
        if (typeof v.p15 === "number") SIG_DATA[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") SIG_DATA[row.code].p30 = v.p30;
      } else if (row.category === "side" && row.code in SIDE_PRICE) {
        if (typeof v.price === "number") SIDE_PRICE[row.code] = v.price;
      } else if (row.category === "reward" && REWARDS[row.code]) {
        if (typeof v.pts === "number") REWARDS[row.code].pts = v.pts;
      }
    }
  } catch (e) {
    // Si falla, seguimos con los valores hardcodeados de arriba como respaldo — nunca
    // debe bloquear un pedido por un problema leyendo la tabla de precios.
    console.error("loadCatalogPrices failed:", e);
  }
  // Se llama DESPUÉS del bucle de catalog_prices a propósito: para los Signatures,
  // `catalog_items` es la fuente única y gana. Las filas de categoría 'sig' de
  // catalog_prices se borraron en la misma migración, y el editor viejo de precios ahora
  // rechaza esa categoría — si no, habría dos sitios fijando el mismo precio y uno
  // ganando en silencio, que es justo el defecto que esto viene a eliminar.
  await loadCatalogItems();
  await loadSecretSignature();
}
// Signatures públicos editables desde el panel admin (2026-08-27). Antes, cambiar un
// sándwich del menú exigía tocar SEIS lugares: SIGS (src/app.ts), SIG_DATA, SIG_LABEL,
// SIG_IMG, la tabla catalog_prices y los documentos de receta/costeo. Ahora la fila más
// reciente de `catalog_items` para cada item_id sobreescribe los cuatro primeros de una
// sola vez, con el mismo patrón append-only que ya usa el menú secreto.
export async function loadCatalogItems(): Promise<void> {
  try {
    // Se piden TODAS las filas ordenadas por id descendente y se conserva la primera de
    // cada item_id: es la vigente. Hacerlo en una sola consulta evita N llamadas (una por
    // Signature) en una función que corre en cada refresco de catálogo.
    const rows = await sbGet("catalog_items", "select=*&order=id.desc");
    const vistos = new Set<string>();
    for (const row of rows) {
      const id = String(row.item_id || "");
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      // SIG05 tiene su propia tabla y su propio ciclo: si alguien insertara una fila acá
      // con ese id, loadSecretSignature() la pisaría después y el resultado sería
      // impredecible. Se ignora explícitamente en vez de dejarlo al orden de las llamadas.
      if (id === "SIG05") continue;
      const tops = Array.isArray(row.tops) ? row.tops : [];
      const sauces = Array.isArray(row.sauces) ? row.sauces : [];
      SIG_DATA[id] = {
        base: String(row.base),
        prot: String(row.protein_id),
        tops,
        sauces,
        p15: Number(row.price_15),
        p30: Number(row.price_30),
        ...(row.fixed_cheese ? { fixedCheese: String(row.fixed_cheese) } : {}),
        ...(row.cheese_optional ? { cheeseOptional: true } : {}),
      };
      const nombre = String(row.name || "").trim();
      const sub = String(row.subtitle || "Signature").trim();
      SIG_CONTENT[id] = {
        n: nombre,
        s: sub,
        badge: String(row.badge || "").trim(),
        pitch: String(row.pitch || "").trim(),
        img: row.image_path ? String(row.image_path) : null,
        active: row.active !== false,
      };
      SIG_LABEL[id] = `${nombre.toUpperCase()} // ${sub.toUpperCase()}`;
    }
  } catch (e) {
    // Mismo criterio que loadCatalogPrices/loadSecretSignature: si la tabla no responde se
    // sigue con lo que haya en memoria (el literal en el primer arranque, o la última
    // carga buena) en vez de bloquear un pedido.
    console.error("loadCatalogItems failed:", e);
  }
}
// Sándwich secreto con rotación mensual (decisión del dueño, 2026-08-10 — reemplaza el
// "THE VAULT" fijo que existía hasta esa fecha). Antes SIG_DATA.SIG05/SIG_GATES.SIG05/
// VAULT_ONLY_* eran literales de código: cambiar el sándwich del mes exigía editar 2
// archivos (este + src/app.ts) y redesplegar. Ahora la fila más reciente de la tabla
// `secret_signature` (una por cada vez que el admin publica un cambio, nunca se
// actualiza in-place — historial gratis) sobreescribe esos mismos objetos en memoria,
// llamada siempre junto a loadCatalogPrices() arriba para que los 9 call sites
// existentes de esa función la recojan sin tocarlos uno por uno.
export async function loadSecretSignature(): Promise<void> {
  try {
    const rows = await sbGet("secret_signature", "select=*&order=id.desc&limit=1");
    const row = rows[0];
    if (!row) return;
    SIG_DATA.SIG05 = {
      base: row.base,
      prot: row.protein_id,
      tops: Array.isArray(row.tops) ? row.tops : [],
      sauces: Array.isArray(row.sauces) ? row.sauces : [],
      p15: Number(row.price_15),
      p30: Number(row.price_30),
    };
    SECRET_SIGNATURE_NAME = String(row.name || "").trim() || "Menú secreto";
    SIG_LABEL.SIG05 = `${SECRET_SIGNATURE_NAME.toUpperCase()} // RESERVE`;
    SIG_GATES.SIG05 = { minOrders: Number(row.min_orders) || 5 };
    // vault_only_ids es una lista plana de ids (proteína y/o tops y/o salsas) que este
    // ciclo quiere reservados solo para el menú secreto — se reparte en los 3 Sets según
    // a qué categoría pertenece cada id, en vez de que el admin tenga que llenar 3 campos
    // separados sabiendo de memoria en qué categoría cae cada ingrediente.
    const vaultOnlyIds: string[] = Array.isArray(row.vault_only_ids) ? row.vault_only_ids : [];
    VAULT_ONLY_PROTS.clear();
    VAULT_ONLY_TOPS.clear();
    VAULT_ONLY_SAUCES.clear();
    for (const id of vaultOnlyIds) {
      if (id === row.protein_id) VAULT_ONLY_PROTS.add(id);
      else if (SIG_DATA.SIG05.tops.includes(id)) VAULT_ONLY_TOPS.add(id);
      else if (SIG_DATA.SIG05.sauces.includes(id)) VAULT_ONLY_SAUCES.add(id);
    }
  } catch (e) {
    // Igual que loadCatalogPrices: si falla, seguimos con SIG_DATA.SIG05/SIG_GATES.SIG05/
    // VAULT_ONLY_* como estén en memoria (el literal de arriba en el primer arranque de
    // cada instancia, o la última fila cargada con éxito) en vez de bloquear un pedido.
    console.error("loadSecretSignature failed:", e);
  }
}
// P01 corregido de "ASADO // RES" a "RES // ASADO" — rompía la convención genérico+estilo
// del resto (Pollo/Cajún, Atún/House, Albóndiga/Marinara) — DEBE coincidir con PROTS.P01
// en src/app.ts.
// Etiquetas de pan/toppings/salsas. El servidor solo necesitaba los ids para tasar y
// descontar inventario, así que hasta ahora los nombres legibles vivían únicamente en el
// cliente — pero la generación automática de guiones de video (actions/video.ts) construye
// el prompt a partir de la receta REAL, y "T03" no le dice nada a un modelo de video.
// DEBEN coincidir con BASES/TOPS/SAUCES en src/app.ts, mismo criterio que PROT_LABEL.
export const BASE_LABEL: Record<string, string> = {
  B01: "Classic // White",
  B03: "Focaccia // Artesanal",
};
export const TOP_LABEL: Record<string, string> = {
  T01: "Tomate // Fresco",
  T02: "Pepinillo // Encurtido",
  T03: "Cebolla // Morada juliana",
  T04: "Jalapeño // Encurtido",
  T05: "Aceituna // Negra en rodajas",
  T06: "Pimiento // Curado",
  T08: "Apio // Picado",
  T09: "Lechuga // Fresca",
};
export const SAUCE_LABEL: Record<string, string> = {
  S01: "Aioli // Signature",
  S02: "Spicy // Mayo",
  S03: "Smoke // BBQ",
  S04: "Honey // Mustard",
  S05: "SNDWCH // Special",
  S06: "Oil & Vinegar // Classic",
  S08: "Teriyaki // Glaze",
  S09: "Chimichurri // Piña y Ají",
  S10: "Peanut // Satay",
  S11: "Mostaza // Dijon",
  S12: "Picante // Miel",
};

export const PROT_LABEL: Record<string, string> = {
  P01: "RES // ASADO",
  P02: "POLLO // TERIYAKI",
  P03: "POLLO // CAJUN",
  P04: "ATÚN // HOUSE",
  P05: "EMBUTIDO // ITALIANO",
  // P06 corregido de "MEATBALL // MARINARA" a "ALBÓNDIGA // MARINARA" — único nombre en
  // inglés entre las 6 proteínas, ni coincidía con su propia descripción en español —
  // DEBE coincidir con PROTS.P06 en src/app.ts.
  P06: "ALBÓNDIGA // MARINARA",
  // "Horneado" y no "Oven Roasted": el resto del catálogo interno ya está 100% en español
  // (Res/Pollo/Atún/Embutido/Albóndiga) y mezclar idiomas en la misma lista es el defecto que
  // obligó a renombrar MEATBALL. DEBE coincidir con PROTS.P08 en src/app/01-*.
  P08: "PAVO // HORNEADO",
};

// priced es el PricedBuild completo (tipo definido más abajo) — antes esta función solo
// recibía basePrice/dblSurcharge sueltos, así que solo podía implementar R04/R06 y dejaba
// R02/R03/R05 siempre en 0, además de aplicar R04 SIN el tope anti-abuso (R04_FLAT_WAIVER)
// que sí protege a deriveCart (hallazgo de la re-auditoría de 10 agentes, BAJO: hoy sin
// impacto real en dinero porque el único llamador, actFavoritesAdd/deriveOrder, descarta
// este precio y solo lo usa para validar que el build es armable — pero heredaba un
// descuento sin tope si algún día se reutiliza para tasar un pedido real). Ahora replica
// exactamente el mismo cálculo (con los mismos topes) que deriveCart usa para el pedido
// real, una sola fuente de verdad en vez de dos implementaciones que podían divergir.
export function rewardWaiver(rewardId: string | null, b: any, priced: PricedBuild): number {
  if (!rewardId) return 0;
  const reward = REWARDS[rewardId];
  if (!reward) throw new ApiError("Recompensa inválida.");
  if (rewardId === "R04" && !b.doubleProt) throw new ApiError("Selecciona doble proteína para usar esta recompensa.", 400);
  if (rewardId === "R06" && b.size !== "15") throw new ApiError("Esta recompensa solo es válida en tamaño 15CM.", 400);
  return rewardId === "R02" ? priced.sauceSurcharge
    : rewardId === "R03" ? Math.min(priced.sizeUpgradeDiff, R03_FLAT_WAIVER)
    : rewardId === "R04" ? Math.min(priced.dblSurcharge, R04_FLAT_WAIVER)
    : rewardId === "R05" ? Math.min(priced.basePrice, R05_FLAT_WAIVER)
    : rewardId === "R06" ? priced.basePrice
    : 0;
}

type PricedBuild = {
  basePrice: number;
  dblSurcharge: number;
  sauceSurcharge: number;
  // Diferencia real p30-p15 de este mismo producto — solo tiene sentido cuando size es
  // "15" (¿cuánto costaría subir ESTE sándwich a 30CM?) y cuando esa diferencia es
  // positiva; queda en 0 si ya es 30CM o si el producto cobra lo mismo en ambos tamaños
  // (hoy ningún ítem del catálogo). Usado por R03 ("SUBE A 30CM // GRATIS", ver deriveCart).
  sizeUpgradeDiff: number;
  ingredientsPerUnit: string[];
  label: string;
};

// Tasación/validación de UN sándwich (signature o build-your-own), sin qty ni tipo de
// carrito — deriveOrder (favoritos, un solo build) y priceCartItem (una línea de
// carrito) repetían este mismo cálculo carácter por carácter, cada uno con su propia
// copia (hallazgo de la auditoría de código).
function priceSigBuild(sigId: string, size: "15" | "30", doubleProt: boolean, extraSauce: boolean, cheese: string | null = null): PricedBuild {
  const sig = SIG_DATA[sigId];
  if (!sig) throw new ApiError("Signature inválida.");
  // `active:false` se guardaba en SIG_CONTENT pero NINGÚN camino de tasación lo miraba, así
  // que retirar un Signature desde el panel lo sacaba de la carta y nada más: se seguía
  // pudiendo pedir por llamada directa a la API, desde un favorito o repitiendo un pedido
  // viejo. Retirar algo tiene que retirarlo de verdad.
  if (SIG_CONTENT[sigId] && SIG_CONTENT[sigId].active === false) {
    throw new ApiError("Ese Signature ya no está disponible.", 400);
  }
  const protInfo = PROT_PRICE[sig.prot];
  const basePrice = size === "15" ? sig.p15 : sig.p30;
  if (doubleProt && NO_DOUBLE_PROTS.has(sig ? sig.prot : "")) throw new ApiError("Esa proteína no admite doble porción.");
  const dblSurcharge = doubleProt ? dblFee(protInfo, size) : 0;
  const sizeUpgradeDiff = size === "15" ? Math.max(0, sig.p30 - sig.p15) : 0;
  const ingredientsPerUnit = [sig.base, sig.prot, ...sig.tops, ...sig.sauces];
  if (doubleProt) ingredientsPerUnit.push(sig.prot);
  // Queso fijo (hoy SIG02 Mozzarella, SIG03 Cheddar) — parte de la receta, no depende de
  // que el cliente lo pida ni de qué mande en `cheese`. Se agrega siempre a
  // ingredientsPerUnit para que el descuento de inventario/costo real lo refleje.
  if (sig.fixedCheese) ingredientsPerUnit.push(sig.fixedCheese);
  // Queso opcional y gratis (igual que en BUILD YOUR OWN) — para Signatures que lo
  // declaren en el futuro (hoy ninguno usa cheeseOptional). Se ignora silenciosamente si
  // un cliente lo manda para un Signature que no lo permite, en vez de lanzar un error
  // por un campo inofensivo.
  if (cheese && sig.cheeseOptional) {
    if (!VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
    ingredientsPerUnit.push(cheese);
  }
  // Igual que en BUILD YOUR OWN: la salsa extra es una porción doble de una de las
  // salsas ya incluidas en la receta del Signature, no una salsa nueva sin especificar —
  // antes no se descontaba ningún ingrediente real por este cargo de S/2 (hallazgo de
  // auditoría financiera).
  //
  // El "todas tienen al menos una salsa" que este código asumía dejó de ser un invariante
  // cuando SIG05 pasó a ser dinámico (tabla secret_signature, rotación mensual): una
  // receta publicada con `sauces: []` hacía `sig.sauces[-1]` → undefined, que igual se
  // empujaba a ingredientsPerUnit (SKU fantasma en la lista de preparación y en el
  // descuento de inventario) mientras se cobraban S/2 por una salsa que no existe
  // (hallazgo de auditoría). actAdminSecretSignatureSet ahora exige al menos una salsa al
  // publicar, pero esto queda como defensa para cualquier fila ya guardada sin salsas: sin
  // salsas no hay nada que duplicar, así que no se cobra ni se descuenta nada.
  const canExtraSauce = extraSauce && sig.sauces.length > 0;
  if (canExtraSauce) ingredientsPerUnit.push(sig.sauces[sig.sauces.length - 1]);
  return { basePrice, dblSurcharge, sauceSurcharge: canExtraSauce ? 2 : 0, sizeUpgradeDiff, ingredientsPerUnit, label: SIG_LABEL[sigId] || sigId };
}
function priceByoBuild(
  base: string, prot: string, cheese: string | null, tops: string[], sauces: string[],
  size: "15" | "30", doubleProt: boolean, extraSauce: boolean,
): PricedBuild {
  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.");
  const protInfo = PROT_PRICE[prot];
  if (!protInfo || VAULT_ONLY_PROTS.has(prot) || SIG_ONLY_PROTS.has(prot)) throw new ApiError("Proteína inválida.");
  if (cheese && !VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
  // A diferencia de sauces (tope de 3), toppings no tiene tope de negocio ("Sin límite,
  // elige los que quieras" en el builder) — el tope real es "cada topping válido, como
  // máximo una vez", igual que hace el toggle del cliente (nunca push-duplicado). Sin
  // este chequeo, un cliente podía mandar el mismo topping miles de veces y cada
  // repetición se sumaba a ingredientsPerUnit, multiplicado por qty (hasta 20), sin tope
  // — una sola línea de carrito reservaba/descontaba miles de unidades de inventario de
  // ese topping por el precio de un sándwich normal (hallazgo de auditoría de QA).
  if (tops.length > VALID_TOPS.size || new Set(tops).size !== tops.length || tops.some((t) => !VALID_TOPS.has(t) || VAULT_ONLY_TOPS.has(t) || SIG_ONLY_TOPS.has(t))) throw new ApiError("Topping inválido.");
  if (sauces.length > 3 || sauces.some((s) => !VALID_SAUCES.has(s) || SIG_ONLY_SAUCES.has(s) || VAULT_ONLY_SAUCES.has(s))) throw new ApiError("Salsa inválida.");
  // "Extra" implica más de una salsa que ya elegiste — sin esto, un cliente podía pedir
  // SALSA EXTRA con 0 salsas base seleccionadas, lo cual no descontaba ningún ingrediente
  // real de inventario (el cargo de S/2 no mapeaba a ninguna salsa concreta) y además
  // dejaba a R02 ("4TA SALSA GRATIS") canjeable sin haber llegado siquiera a una 3ra
  // salsa (hallazgo de auditoría financiera).
  if (extraSauce && !sauces.length) throw new ApiError("Selecciona al menos una salsa antes de pedir salsa extra.");
  // El recargo del pan va DENTRO de basePrice, no como un cargo aparte: así fluye solo por
  // unitPrice, por el total esperado y por R06 (que perdona el 15CM entero — si el recargo
  // quedara fuera, la recompensa dejaría al cliente pagando S/0.50 por un sándwich "gratis").
  const panExtra = baseSurcharge(base, size);
  const basePrice = (size === "15" ? protInfo.p15 : protInfo.p30) + panExtra;
  if (doubleProt && NO_DOUBLE_PROTS.has(prot)) throw new ApiError("Esa proteína no admite doble porción.");
  const dblSurcharge = doubleProt ? dblFee(protInfo, size) : 0;
  // R03 sube un 15CM a 30CM gratis, así que la diferencia que perdona tiene que incluir
  // TAMBIÉN el salto del pan (la focaccia de 30CM cuesta más que la de 15CM). Sin esto, un
  // cliente con focaccia canjeaba el upgrade y seguía debiendo la diferencia del pan.
  const sizeUpgradeDiff = size === "15"
    ? Math.max(0, (protInfo.p30 + baseSurcharge(base, "30")) - (protInfo.p15 + baseSurcharge(base, "15")))
    : 0;
  const ingredientsPerUnit = [base, prot, ...tops, ...(cheese ? [cheese] : []), ...sauces];
  if (doubleProt) ingredientsPerUnit.push(prot);
  // La salsa extra es una porción doble de una salsa ya elegida (no una salsa nueva sin
  // especificar) — se descuenta del inventario real de esa misma salsa.
  if (extraSauce) ingredientsPerUnit.push(sauces[sauces.length - 1]);
  return { basePrice, dblSurcharge, sauceSurcharge: extraSauce ? EXTRA_SAUCE_PRICE : 0, sizeUpgradeDiff, ingredientsPerUnit, label: PROT_LABEL[prot] || prot };
}

// Valida y tasa un solo build (signature o build-your-own) — usado para favoritos,
// que por ahora solo guardan UN sándwich (no un carrito completo).
export function deriveOrder(b: any): { ingredients: string[]; expectedTotal: number } {
  const size = b.size === "15" ? "15" : b.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!b.doubleProt;
  const extraSauce = !!b.extraSauce;
  const rewardId = b.rewardId ? String(b.rewardId) : null;

  const priced = b.mode === "sig"
    ? priceSigBuild(String(b.sigId || ""), size, doubleProt, extraSauce, b.cheese ? String(b.cheese) : null)
    : priceByoBuild(
      String(b.base || ""), String(b.prot || ""), b.cheese ? String(b.cheese) : null,
      Array.isArray(b.tops) ? b.tops.filter((x: any) => typeof x === "string") : [],
      Array.isArray(b.sauces) ? b.sauces.filter((x: any) => typeof x === "string") : [],
      size, doubleProt, extraSauce,
    );
  const waiver = rewardWaiver(rewardId, b, priced);
  return {
    ingredients: priced.ingredientsPerUnit,
    expectedTotal: Math.max(0, priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge - waiver),
  };
}

export function buildFromOrder(b: any): Record<string, unknown> {
  if (b.mode === "sig") {
    return { mode: "sig", sigId: b.sigId, size: b.size, doubleProt: !!b.doubleProt, extraSauce: !!b.extraSauce };
  }
  return {
    mode: "byo",
    base: b.base,
    prot: b.prot,
    tops: Array.isArray(b.tops) ? b.tops : [],
    cheese: b.cheese || null,
    sauces: Array.isArray(b.sauces) ? b.sauces : [],
    size: b.size,
    doubleProt: !!b.doubleProt,
    extraSauce: !!b.extraSauce,
  };
}

export function validateQty(q: any): number {
  const n = parseInt(q, 10);
  if (!n || n < 1 || n > 20) throw new ApiError("Cantidad inválida.");
  return n;
}

export type PricedItem = {
  item: Record<string, unknown>;
  qty: number;
  unitPrice: number;
  basePrice: number;
  dblSurcharge: number;
  sauceSurcharge: number;
  sizeUpgradeDiff: number;
  ingredientsPerUnit: string[];
  label: string;
  eligibleR02: boolean;
  eligibleR03: boolean;
  eligibleR04: boolean;
  eligibleR05: boolean;
  eligibleR06: boolean;
};

// Tasa y valida UNA línea del carrito (sándwich signature/build o bebida/side).
// Nunca confía en el precio/etiqueta que reporte el cliente — todo se recalcula aquí
// a partir de los catálogos del servidor.
export function priceCartItem(raw: any): PricedItem {
  const qty = validateQty(raw?.qty);

  if (raw?.type === "side") {
    const code = String(raw.code || "");
    const price = SIDE_PRICE[code];
    if (price == null) throw new ApiError("Bebida/side inválido.");
    return {
      item: { type: "side", code, qty },
      qty,
      unitPrice: price,
      basePrice: price,
      dblSurcharge: 0,
      sauceSurcharge: 0,
      sizeUpgradeDiff: 0,
      ingredientsPerUnit: [code],
      label: SIDE_LABEL[code] || code,
      eligibleR02: false,
      eligibleR03: false,
      eligibleR04: false,
      // Una bebida/side es lo único elegible para R05 ("BEBIDA // GRATIS") — un
      // sándwich nunca lo es, sin importar tamaño o proteína.
      eligibleR05: true,
      eligibleR06: false,
    };
  }

  const size = raw?.size === "15" ? "15" : raw?.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!raw?.doubleProt;
  const extraSauce = !!raw?.extraSauce;
  // Nota libre del cliente para este producto (ej. "sin cebolla") — puramente
  // informativa para cocina, no afecta precio/ingredientes ni se valida.
  const note = raw?.note ? String(raw.note).trim().slice(0, 140) || null : null;

  if (raw?.type === "sig") {
    // Queso opcional y gratis, solo válido para los Signatures que lo declaran
    // (SIG_DATA[sigId].cheeseOptional, hoy ninguno — ver fixedCheese para SIG02/SIG03,
    // que va siempre sin depender de este campo) — priceSigBuild ya ignora
    // silenciosamente cheese si el Signature no lo permite.
    const cheese = raw.cheese ? String(raw.cheese) : null;
    const priced = priceSigBuild(String(raw.sigId || ""), size, doubleProt, extraSauce, cheese);
    return {
      // `snapIngredients`: foto de la composición REAL al momento de pedir. A diferencia de
      // BUILD YOUR OWN (que guarda base/prot/tops/sauces en el propio ítem, así que
      // re-derivarlo siempre da lo mismo), un Signature guarda solo su `sigId` y su receta
      // vive en SIG_DATA — y SIG_DATA.SIG05 CAMBIA cada mes (menú secreto con rotación,
      // tabla secret_signature). Sin esta foto, cancelar/reponer un pedido viejo del menú
      // secreto después de una rotación restituía al inventario los ingredientes del
      // sándwich secreto de ESTE mes, no los del que de verdad se vendió — corrompiendo el
      // stock en silencio (hallazgo de auditoría). restockOrderItems la prefiere cuando
      // existe y solo re-deriva para pedidos legados anteriores a este cambio.
      item: { type: "sig", sigId: raw.sigId, size, doubleProt, extraSauce, cheese, note, qty, snapIngredients: priced.ingredientsPerUnit },
      qty,
      unitPrice: priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge,
      basePrice: priced.basePrice,
      dblSurcharge: priced.dblSurcharge,
      sauceSurcharge: priced.sauceSurcharge,
      sizeUpgradeDiff: priced.sizeUpgradeDiff,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      // R02 ("4TA // SALSA") perdona el cargo real de SALSA EXTRA — solo elegible si
      // el cliente ya activó ese extra pagado en esta línea (mismo criterio que R04
      // exige doubleProt activado: la recompensa perdona un cargo que el cliente ya
      // pidió, no lo agrega de la nada).
      eligibleR02: extraSauce,
      eligibleR03: priced.sizeUpgradeDiff > 0,
      eligibleR04: doubleProt,
      eligibleR05: false,
      // Excluye Signatures RESERVE (hoy solo SIG05) para que R06 no pueda gamearse eligiendo
      // el sándwich más caro del catálogo — ver comentario de RESERVE_SIGS arriba.
      eligibleR06: size === "15" && !RESERVE_SIGS.has(String(raw.sigId || "")),
    };
  }

  if (raw?.type === "byo") {
    const base = String(raw.base || "");
    const prot = String(raw.prot || "");
    const cheese = raw.cheese ? String(raw.cheese) : null;
    const tops: string[] = Array.isArray(raw.tops) ? raw.tops.filter((x: any) => typeof x === "string") : [];
    const sauces: string[] = Array.isArray(raw.sauces) ? raw.sauces.filter((x: any) => typeof x === "string") : [];
    const priced = priceByoBuild(base, prot, cheese, tops, sauces, size, doubleProt, extraSauce);
    return {
      item: { type: "byo", base, prot, cheese, tops, sauces, size, doubleProt, extraSauce, note, qty },
      qty,
      unitPrice: priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge,
      basePrice: priced.basePrice,
      dblSurcharge: priced.dblSurcharge,
      sauceSurcharge: priced.sauceSurcharge,
      sizeUpgradeDiff: priced.sizeUpgradeDiff,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      // A diferencia de un Signature (salsas fijas de receta, "extra" siempre es de
      // verdad extra), en BUILD YOUR OWN el cliente elige sus propias salsas (tope 3) —
      // R02 ("4TA SALSA GRATIS") solo tiene sentido real si ya llegó al tope de 3 antes
      // de pagar por una 4ta (hallazgo de auditoría financiera: antes calificaba incluso
      // con 0 salsas base seleccionadas).
      eligibleR02: extraSauce && sauces.length === 3,
      eligibleR03: priced.sizeUpgradeDiff > 0,
      eligibleR04: doubleProt,
      eligibleR05: false,
      eligibleR06: size === "15",
    };
  }

  throw new ApiError("Tipo de producto inválido.");
}

// R02 (perdona SALSA EXTRA) solo aplica a una línea que ya activó ese extra pagado; R03
// (sube a 30CM gratis) solo a una línea 15CM cuya versión 30CM cueste más; R04 (doble
// proteína gratis) solo a una línea con doble proteína activada; R05 (bebida gratis)
// solo a una línea de bebida/side; R06 (15CM gratis) solo a una línea 15CM. El servidor
// recalcula esto de forma independiente al índice que el cliente crea haber elegido.
export function findRewardTargetIndex(priced: PricedItem[], rewardId: string): number {
  if (rewardId === "R02") return priced.findIndex((p) => p.eligibleR02);
  if (rewardId === "R03") return priced.findIndex((p) => p.eligibleR03);
  if (rewardId === "R04") return priced.findIndex((p) => p.eligibleR04);
  if (rewardId === "R05") return priced.findIndex((p) => p.eligibleR05);
  if (rewardId === "R06") return priced.findIndex((p) => p.eligibleR06);
  return priced.length ? 0 : -1;
}

// Combo sándwich (Signature o Build Your Own) + bebida: S/2 menos que pedir ambos por
// separado, una vez por cada par sándwich+bebida en el carrito. Bajado de S/3 a S/2 — a
// S/3 el combo dejaba THE MIDNIGHT (D07, la bebida más barata, también S/3)
// completamente GRATIS con cualquier sándwich, a cualquier hora del día — a diferencia
// de la promo de hora valle (bebida gratis de verdad), que el negocio decidió a
// propósito limitar a la ventana de baja demanda porque regalar margen fuera de esa
// ventana no es "casi puro margen incremental" (ver isOffPeakDrinkPromoActiveLima más
// abajo; hallazgo de auditoría financiera). DEBE coincidir con COMBO_DISCOUNT_PER_PAIR
// en src/app.ts (ese lado solo calcula el estimado que ve el cliente antes de pagar;
// este es el que de verdad determina cuánto se cobra).
// Bajado de S/2 a S/1 el 2026-08-22 (decisión del dueño, misma ronda que la subida de
// bebidas). A S/2 el combo se comía entre el 58% y el 118% de lo que deja una bebida ya
// contado el envase — THE MIDNIGHT en combo dejaba −S/0.31, o sea que el par sándwich+
// bebida rendía MENOS que el sándwich solo. Y a diferencia de la promo de hora valle (que
// sí puede crear un pedido que no existía), este descuento se le aplica a alguien que YA
// decidió comprar la bebida: es margen regalado, no adquisición.
const COMBO_DISCOUNT_PER_PAIR = 1;

// Tope plano de R03 ("SUBE A 30CM // GRATIS") — antes perdonaba la diferencia p30-p15
// EXACTA de la proteína elegida (S/8 en P01/P02/P04, pero S/10 en P05/P06), lo que
// dejaba al cliente elegir la proteína más cara para maximizar el valor de la
// recompensa muy por encima de lo que sus mismos puntos (150) valen en el resto del
// programa (hallazgo de auditoría de rentabilidad). Ahora siempre perdona como máximo
// el valor de "un pan de 15CM" estándar (S/8, el caso mayoritario) sin importar qué
// proteína se elija — DEBE coincidir con R03_FLAT_WAIVER en src/app.ts.
//
// Revisado de nuevo esta sesión (auditoría de menú, tras la subida de precio de Atún/
// Embutido): el diff real p30-p15 de P04/P05 ahora es S/14 (antes menor), muy por encima
// de este tope de S/8 — pero mantener el tope SIN subir es justo lo que evita que
// canjear R03 con la proteína más cara valga más que con la mayoritaria; subirlo a 14
// deshiría exactamente el anti-abuso documentado arriba. No hay cambio: el tope sigue
// protegiendo el margen (el cliente sigue pagando la diferencia sobre S/8), no
// perdiéndolo. Mismo razonamiento en R04_FLAT_WAIVER abajo.
const R03_FLAT_WAIVER = 8;

// Mismo criterio que R03_FLAT_WAIVER: R04 ("DOBLE PROTEÍNA // GRATIS") perdonaba antes el
// pDbl EXACTO de la proteína elegida (S/5-9 según proteína), dejando elegir la más cara
// (P04/P05, S/9 tras la recalibración de costo real) para maximizar el valor de una
// recompensa de 320 pts muy por encima del resto. Se topa al valor mayoritario (S/6,
// P01/P02) — DEBE coincidir con R04_FLAT_WAIVER en src/app.ts. Revisado de nuevo esta
// sesión junto con R03_FLAT_WAIVER arriba — mismo veredicto, sin cambio.
const R04_FLAT_WAIVER = 6;
// R05 ("BEBIDA // GRATIS") perdonaba antes el precio completo de la bebida elegida
// (S/3-6), permitiendo elegir siempre THE SPICE (S/6, la más cara) para maximizar el
// valor de la recompensa. Se topa al mismo valor ya establecido para la promo de hora
// valle (OFFPEAK_DRINK_PROMO_CAP=4) — incluso fuera de esa ventana, una bebida gratis no
// debería valer más que en la ventana en la que el negocio ya la regala gratis. DEBE
// coincidir con R05_FLAT_WAIVER en src/app.ts.
// Subido de 4 a 6 el 2026-08-22, junto con la subida de precio de las bebidas. NO es
// generosidad nueva: es lo que mantiene cierto el nombre de la recompensa. Con las bebidas
// a S/5-9 y el tope en S/4, "BEBIDA // GRATIS" habría dejado de cubrir una sola bebida del
// catálogo — la misma clase de promesa falsa que ya obligó a retirar los badges MÁS PEDIDO
// y EDICIÓN LIMITADA. A S/6 cubre entero THE MIDNIGHT/THE BLOOM/THE COOL y deja THE SPICE
// parcial, la misma relación que había antes con el tope en S/4. Los puntos de R05 NO
// cambian (120): a S/6 de tope quedan en 20 pts/sol, justo donde ya está R06.
const R05_FLAT_WAIVER = 6;

// Bebida gratis (hasta S/4) de 2pm a 6pm hora Lima, la ventana de menor demanda entre el
// almuerzo y la cena (ver PEAK_HOURS_LIMA en orders.ts: [12,14] y [19,21]) — el costo
// marginal de atender un pedido en esa franja es prácticamente el mismo con o sin este
// descuento (cocina ya está montada), así que regalar la bebida más barata del carrito es
// casi puro margen incremental si convierte un pedido que hoy no existe. El tope de S/4
// evita que alguien elija la bebida más cara (S/6) y aun así se la regalemos completa.
// DEBE coincidir con OFFPEAK_DRINK_PROMO_HOURS_LIMA en src/app.ts (ese lado solo informa
// al cliente antes de pagar; este es el que de verdad aplica el descuento).
//
// La ventana empieza a las 15:00 y no a las 14:00 (corregido 2026-08-15). El supuesto de
// que "2pm ya es valle" venía de nuestra propia tabla PEAK_HOURS_LIMA, no de datos del
// mercado peruano: en Perú el almuerzo por delivery se estira hasta cerca de las 16:00
// (PedidosYa reporta un pico de pedidos entre 13:00 y 16:00). Regalar la bebida a las
// 14:00 no crea un pedido que no existía — descuenta uno que igual iba a entrar, que es
// exactamente lo que esta promo NO debe hacer. Empezar a las 15:00 recorta la parte de
// la ventana que se solapa con demanda real sin tocar la franja verdaderamente muerta
// (16:00-18:00).
// ⚠ LA BEBIDA GRATIS DE HORA VALLE SE RETIRA EL 2026-09-05 (decisión del dueño), y la
// ventana vacía es la forma de apagarla: `isOffPeakDrinkPromoActiveLima` devuelve false
// siempre, el descuento queda en 0 y todo lo de abajo sigue funcionando sin ramas muertas.
//
// POR QUÉ SE RETIRA. Era la ÚNICA operación del catálogo con contribución NEGATIVA. Regalar
// una bebida de hasta S/6 cuesta ~S/2.34 de insumo y devuelve S/0: la contribución media de
// una bebida pasaba de +S/3.97 a −S/1.79. El argumento original —"en valle el costo marginal
// es casi cero, así que es margen incremental si CREA un pedido que no existía"— nunca se
// midió, y mientras tanto el descuento también se lo llevaban los pedidos que igual iban a
// entrar. Ver RENTABILIDAD_POR_PARTE.md.
//
// El mecanismo NO se borra: la ventana es un dato, así que volver a prenderla es poner las
// horas de vuelta acá y en el cliente. Lo que sí hay que hacer si se reactiva es medir si de
// verdad crea pedidos nuevos, que es la única forma en que se paga sola.
const OFFPEAK_DRINK_PROMO_HOURS_LIMA: [number, number][] = [];
// Subido de 4 a 6 el 2026-08-22 por el mismo motivo que R05_FLAT_WAIVER: con las bebidas
// a S/5-9, un tope de S/4 dejaba de regalar "la bebida" para pasar a regalar un pedazo.
const OFFPEAK_DRINK_PROMO_CAP = 6;

// INCENTIVO AL ORGANIZADOR DE PEDIDO GRUPAL (2026-08-22).
// El canal de oficinas es el de mejor economía del negocio: un pedido de 6 sándwiches
// contribuye casi lo mismo que 6 pedidos individuales pero cuesta UN cliente en vez de
// seis. El cuello de botella del negocio no es la cocina ni el mercado: es adquirir
// clientes, y el dueño no puede salir a vender puerta a puerta porque sus mañanas están
// cocinando. Este incentivo convierte al cliente en el vendedor: quien junta al grupo se
// lleva un sándwich gratis, y con eso el negocio compra una cuenta de oficina entera por
// el costo de insumo de un solo sándwich contra lo que cuesta la misma cuenta por
// publicidad. Los números, ya con fuente (ver PREDICCION_V7.md): pedido grupal S/1.19 por
// persona, referido S/7.65, Meta Ads en Perú S/10.51-25.23. El "~S/128-141" que decía este
// comentario hasta el 2026-08-27 no tenía ninguna fuente y estaba entre 5 y 13 veces por
// encima del costo real — no lo reintroduzcas.
//
// Se perdona el 15CM MÁS BARATO del carrito, no "el del organizador": el organizador paga
// la cuenta completa, así que económicamente es lo mismo y evita tener que adivinar cuál
// de las líneas del grupo es suya (en el carrito cerrado todas vienen mezcladas con una
// nota "De: <nombre>"). Además así la promesa es literal y verificable.
//
// Usa la misma elegibilidad que R06 (`eligibleR06`: 15CM y no RESERVE) para que no se
// pueda gamear con el menú secreto, y se excluye del conteo de combo igual que R06 — si
// no, el combo terminaría regalando también la bebida emparejada con un sándwich que ya
// es gratis (es exactamente el bug que ya se corrigió una vez para R06).
export const ORGANIZER_FREE_MIN_SANDWICHES = 5;

// Recargo por SALSA EXTRA. Era el único precio del catálogo que vivía como literal `2`
// suelto — 4 veces acá y 5 en src/app.ts — y además el único que NO se puede editar desde
// `catalog_prices`. Cambiarlo en un solo lado rompía todo checkout que lo usara, sin que
// nada avisara: `npm run parity` no podía vigilar un número sin nombre.
export const EXTRA_SAUCE_PRICE = 2;
// Antes esto siempre miraba la hora en la que llegaba el request, sin importar que el
// pedido fuera "para más tarde" (scheduledFor) — un pedido armado a las 3pm (hora valle)
// pero programado para entregarse a las 8pm (hora pico, ver PEAK_HOURS_LIMA en
// orders.ts) igual regalaba la bebida, aunque la cocina la fuera a preparar en hora
// pico, que es la justificación completa de este descuento (hallazgo de auditoría de
// rentabilidad). Ahora evalúa la hora en la que de verdad se va a preparar el pedido.
function isOffPeakDrinkPromoActiveLima(refDate: Date): boolean {
  const limaHour = new Date(refDate.getTime() - 5 * 3600000).getUTCHours();
  return OFFPEAK_DRINK_PROMO_HOURS_LIMA.some(([start, end]) => limaHour >= start && limaHour < end);
}

export function deriveCart(
  rawItems: any,
  rewardId: string | null,
  scheduledFor?: string | null,
  // Solo lo pasa en true quien ya VERIFICÓ contra la base que este carrito viene de un
  // pedido grupal cerrado por esta misma sesión y que todavía no se cobró (ver
  // organizerFreeSandwichApplies en actions/group.ts). Nunca se toma del cuerpo del
  // request: el cliente no puede declararse acreedor de un descuento.
  organizerFreeSandwich = false,
): { ingredients: string[]; expectedTotal: number; sanitizedItems: Record<string, unknown>[] } {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new ApiError("El carrito está vacío.", 400);
  if (rawItems.length > 30) throw new ApiError("Demasiados productos en el carrito.", 400);

  const priced = rawItems.map(priceCartItem);
  const totalQty = priced.reduce((s, p) => s + p.qty, 0);
  if (totalQty > 100) throw new ApiError("Cantidad total del carrito demasiado alta.", 400);

  let total = priced.reduce((s, p) => s + p.unitPrice * p.qty, 0);
  const ingredients: string[] = [];
  priced.forEach((p) => {
    for (let i = 0; i < p.qty; i++) ingredients.push(...p.ingredientsPerUnit);
  });

  // La recompensa se resuelve ANTES de combo/hora valle (no después, como antes) — R05
  // y R06 regalan una unidad COMPLETA (una bebida entera o un sándwich 15CM entero), a
  // diferencia de R02/R03/R04 que solo perdonan un extra parcial sobre un producto que
  // se sigue cobrando. Si esa unidad completa sigue contando para combo/hora valle,
  // esos dos mecanismos terminan regalando TAMBIÉN la otra mitad del par sobre algo que
  // ya es gratis — ej. sándwich 15CM (S/25) + bebida (S/3): combo -S/3, reward -S/25,
  // total S/0 — la bebida quedaba gratis de rebote. Hallazgo de auditoría de
  // rentabilidad, confirmado en vivo justo el día que se reestructuraron R02-R06.
  let rewardTargetIdx = -1;
  let reward: { pts: number; label: string } | null = null;
  if (rewardId) {
    reward = REWARDS[rewardId];
    if (!reward) throw new ApiError("Recompensa inválida.");
    rewardTargetIdx = findRewardTargetIndex(priced, rewardId);
    if (rewardTargetIdx < 0) throw new ApiError("No tienes ningún producto elegible para esta recompensa en tu carrito.", 400);
  }
  const fullyWaivedSandwich = rewardId === "R06" && rewardTargetIdx >= 0 && priced[rewardTargetIdx].item.type !== "side";
  const fullyWaivedSide = rewardId === "R05" && rewardTargetIdx >= 0 && priced[rewardTargetIdx].item.type === "side";

  let sandwichQty = priced.filter((p) => p.item.type !== "side").reduce((s, p) => s + p.qty, 0);
  let sideQty = priced.filter((p) => p.item.type === "side").reduce((s, p) => s + p.qty, 0);
  // El umbral del organizador se mide sobre los sándwiches que el cliente REALMENTE pidió,
  // antes de descontar la unidad que regala R06. Restar R06 primero hacía que un grupo de
  // 5 con la recompensa canjeada cayera a 4 y perdiera el sándwich del organizador solo en
  // el servidor: el cliente descontaba los dos y el checkout se rechazaba por total que no
  // coincide. Es también lo que ya miden organizerFreeSandwichApplies y la pantalla del
  // grupo, así que las tres cuentas quedan alineadas.
  const sandwichQtyForOrganizerGate = sandwichQty;
  if (fullyWaivedSandwich) sandwichQty -= 1;
  if (fullyWaivedSide) sideQty -= 1;

  // Incentivo al organizador: el 15CM más barato va gratis a partir de
  // ORGANIZER_FREE_MIN_SANDWICHES sándwiches. Se resuelve acá arriba, junto con la
  // recompensa, porque también regala una unidad COMPLETA y por lo tanto esa unidad no
  // puede seguir contando para el combo.
  let organizerWaivedIdx = -1;
  if (organizerFreeSandwich && sandwichQtyForOrganizerGate >= ORGANIZER_FREE_MIN_SANDWICHES) {
    let best = Infinity;
    priced.forEach((p, idx) => {
      if (idx === rewardTargetIdx) return; // no se apila con R06 sobre la misma línea
      if (!p.eligibleR06) return;          // misma elegibilidad: 15CM y no RESERVE
      if (p.basePrice < best) { best = p.basePrice; organizerWaivedIdx = idx; }
    });
    if (organizerWaivedIdx >= 0) sandwichQty -= 1;
  }
  const comboCount = Math.min(sandwichQty, sideQty);
  const comboDiscount = comboCount * COMBO_DISCOUNT_PER_PAIR;

  let offPeakDrinkDiscount = 0;
  const refDate = scheduledFor ? new Date(scheduledFor) : new Date();
  if (isOffPeakDrinkPromoActiveLima(isNaN(refDate.getTime()) ? new Date() : refDate)) {
    const sidePrices = priced.flatMap((p, idx) => {
      if (p.item.type !== "side") return [];
      const qty = fullyWaivedSide && idx === rewardTargetIdx ? p.qty - 1 : p.qty;
      return Array(Math.max(0, qty)).fill(p.unitPrice);
    });
    if (sidePrices.length) {
      offPeakDrinkDiscount = Math.min(Math.min(...sidePrices), OFFPEAK_DRINK_PROMO_CAP);
    }
  }

  // Antes combo y hora valle se aplicaban los DOS a la vez sobre el mismo pedido
  // (sándwich+bebida en la ventana de hora valle podía perder S/3+S/4=S/7 sin usar
  // ningún punto) — con el margen real de insumos confirmado (~45-52%), apilar ambos
  // llegaba a comerse una fracción grande de la utilidad de ese pedido. Ninguno de los
  // dos deja de existir, pero ya no se suman: solo se aplica el mayor de los dos
  // (hallazgo de auditoría de rentabilidad, decisión del dueño) — DEBE coincidir con el
  // mismo criterio en src/app.ts.
  const stackedDiscount = Math.max(comboDiscount, offPeakDrinkDiscount);
  total = Math.max(0, total - stackedDiscount);

  if (organizerWaivedIdx >= 0) {
    total = Math.max(0, total - priced[organizerWaivedIdx].basePrice);
  }

  if (rewardId && reward) {
    const target = priced[rewardTargetIdx];
    const waiver = rewardId === "R02" ? target.sauceSurcharge
      : rewardId === "R03" ? Math.min(target.sizeUpgradeDiff, R03_FLAT_WAIVER)
      : rewardId === "R04" ? Math.min(target.dblSurcharge, R04_FLAT_WAIVER)
      : rewardId === "R05" ? Math.min(target.basePrice, R05_FLAT_WAIVER)
      : rewardId === "R06" ? target.basePrice
      : 0;
    total = Math.max(0, total - waiver);
  }

  return { ingredients, expectedTotal: total, sanitizedItems: priced.map((p) => p.item) };
}

// Precio aproximado de una línea de carrito YA guardada en un pedido — usado solo para
// atribuir ingresos por producto en el dashboard (no revalida nada, los pedidos ya
// pasaron por deriveCart al crearse).
export function statUnitPrice(it: any): number {
  try {
    if (it.type === "side") return SIDE_PRICE[it.code] || 0;
    const size = it.size;
    if (it.type === "sig") {
      const sig = SIG_DATA[it.sigId];
      if (!sig) return 0;
      const pr = PROT_PRICE[sig.prot];
      const base = size === "15" ? sig.p15 : sig.p30;
      return base + (it.doubleProt ? dblFee(pr, size) : 0) + (it.extraSauce ? 2 : 0);
    }
    const pr2 = PROT_PRICE[it.prot];
    if (!pr2) return 0;
    const base2 = size === "15" ? pr2.p15 : pr2.p30;
    return base2 + (it.doubleProt ? dblFee(pr2, size) : 0) + (it.extraSauce ? 2 : 0);
  } catch (e) {
    // Los códigos de producto desconocidos ya devuelven 0 explícitamente arriba (ítems
    // legados) — si esto revienta es por algo inesperado (ej. it no es un objeto), y
    // antes quedaba completamente silencioso, sin ningún rastro de que el dashboard
    // estaba subestimando ingresos para ese pedido (hallazgo de la re-auditoría de
    // código).
    console.error("statUnitPrice failed for item:", it, e);
    return 0;
  }
}
export function statItemLabel(it: any): string {
  if (it.type === "side") return SIDE_LABEL[it.code] || it.code || "otro";
  if (it.type === "sig") return SIG_LABEL[it.sigId] || it.sigId || "otro";
  return PROT_LABEL[it.prot] || it.prot || "otro";
}

// Antes actDashboardStats y actAdminRangeReport (admin.ts) repetían la misma agregación
// de "producto -> {count, revenue}" carácter por carácter, cada uno con su propio límite
// de resultados (hallazgo de la auditoría de código) — este helper la centraliza.
export function buildTopProducts(orders: any[], limit: number): { name: string; count: number; revenue: number }[] {
  const productMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o: any) => {
    if (Array.isArray(o.items) && o.items.length) {
      o.items.forEach((it: any) => {
        const key = statItemLabel(it);
        const qty = it.qty || 1;
        if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
        productMap[key].count += qty;
        productMap[key].revenue += statUnitPrice(it) * qty;
      });
      return;
    }
    const key = o.product_key || (o.summary || "").split(" S/")[0].split("·")[0].trim() || "otro";
    if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
    productMap[key].count += 1;
    productMap[key].revenue += o.total || 0;
  });
  return Object.entries(productMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
