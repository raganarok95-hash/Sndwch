// P08 (PAVO // HORNEADO) — la 4ta proteína de ARMA EL TUYO, y la única del catálogo cuyo
// precio se fijó contra un costo SIN merma de cocción.
//
// POR QUÉ EXISTE ESTE ARCHIVO. El armador había quedado con TRES proteínas al salir res y
// embutido por rentabilidad (2026-09-05). El pavo entra el 2026-09-06 y lo que lo hace viable
// es estructural, no una cotización afortunada: es FIAMBRE, así que 1 kg comprado es 1 kg
// servido. Todas las demás pierden en la olla —res 0.54, pollo 0.64-0.69— y por eso su costo
// real por porción es ~1.85x el del insumo crudo. Es lo que permite que una proteína más cara
// por kilo que la res (S/44.20 contra S/20) salga MÁS BARATA por sándwich.
//
// SU MODO DE FALLO ES SILENCIO. Si alguien "redondea" el precio hacia abajo, o copia el pDbl
// de otra proteína —el defecto exacto que ya obligó a partir `pDbl` en dos y a corregir P06—,
// nada revienta: el typecheck sigue verde, el pedido se cobra, y el negocio simplemente vende
// por encima del techo de 45% de costo sin enterarse. Por eso lo que se fija acá es la
// ARITMÉTICA del margen, no que la función no tire.
//
// jsr.io está bloqueado por el proxy, así que el assert va acá adentro (ver CLAUDE.md).
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
import { priceCartItem, PROT_PRICE, PROT_LABEL, SIG_ONLY_PROTS, VAULT_ONLY_PROTS, dblFee } from "../supabase/functions/api/catalog.ts";

// [WEB] S/43.75/kg es el precio RETAIL de jamón de pavo Braedt en Metro/Vivanda; se costea a
// S/44.20 por conservador. Al por mayor debería estar por debajo, así que el error de esta
// prueba cae del lado seguro: si el dueño consigue mejor precio, el margen real es MAYOR que
// el que se verifica acá, nunca menor.
const PAVO_KG = 44.20;
const GRAMOS = { "15": 85, "30": 170 } as const;
// Piso fijo del armador (pan + queso + vegetales + salsas + empaque), sin la proteína.
// Sale de RENTABILIDAD_POR_PARTE.md, el mismo número con el que se costearon las otras.
const PISO = { "15": 3.35, "30": 5.41 } as const;
// El techo de costo de insumos+empaque acordado con el dueño. Es un TECHO, no una meta.
const TECHO = 0.45;

const armarPavo = (size: "15" | "30", doble = false) =>
  priceCartItem({
    type: "byo", base: "B01", prot: "P08", tops: [], sauces: ["S01"],
    size, qty: 1, doubleProt: doble,
  });

Deno.test("el pavo SÍ se puede armar en ARMA EL TUYO", () => {
  // Es la mitad del punto: entró para devolverle una cuarta opción al armador. Si alguien lo
  // marcara sigOnly o vaultOnly por inercia, desaparecería de la pantalla sin ningún error.
  assert(!SIG_ONLY_PROTS.has("P08"), "el pavo quedó marcado como exclusivo de Signature");
  assert(!VAULT_ONLY_PROTS.has("P08"), "el pavo quedó marcado como exclusivo del menú secreto");
  for (const size of ["15", "30"] as const) {
    assert(armarPavo(size).unitPrice > 0, `el pavo ${size}CM no se puede armar`);
  }
});

Deno.test("el armador vuelve a tener cuatro proteínas", () => {
  // El archivo de al lado (proteinas-fuera-del-armador) fija el PISO de esta cuenta. Acá se
  // fija que el pavo es efectivamente quien lo levanta, y no otra cosa que se coló.
  const armables = Object.keys(PROT_PRICE)
    .filter((p) => !SIG_ONLY_PROTS.has(p) && !VAULT_ONLY_PROTS.has(p));
  assert(armables.includes("P08"), "el pavo no está entre las proteínas armables");
  assert(armables.length >= 4, `el armador quedó con ${armables.length} proteínas`);
});

Deno.test("el pavo no pasa el techo de 45% en NINGUNO de los dos tamaños", () => {
  // El 30CM es donde el armador se rompía: pan y proteína se duplican pero el precio no. Por
  // eso se comprueban los dos y no solo el 15CM, que es el que más se vende.
  for (const size of ["15", "30"] as const) {
    const precio = size === "15" ? PROT_PRICE.P08.p15 : PROT_PRICE.P08.p30;
    const costo = PISO[size] + PAVO_KG * GRAMOS[size] / 1000;
    const pct = costo / precio;
    assert(
      pct <= TECHO,
      `pavo ${size}CM: costo S/${costo.toFixed(2)} sobre precio S/${precio.toFixed(2)} = ` +
      `${(pct * 100).toFixed(1)}%, por encima del techo de ${TECHO * 100}%`,
    );
  }
});

Deno.test("la doble porción de pavo tampoco pasa el techo", () => {
  // ⚠ ESTE ES EL DEFECTO QUE YA SE COMETIÓ DOS VECES. `pDbl` cobra una porción EXTRA de
  // proteína, así que su costo es la proteína sola (sin piso: el pan, los vegetales y el
  // empaque ya se pagaron en la línea base). Copiar el pDbl de otra proteína, o dejar el
  // mismo número en los dos tamaños, es exactamente lo que pasó con P06 y con el doble de
  // atún — y en los dos casos se descubrió meses después, sin que nada fallara.
  for (const size of ["15", "30"] as const) {
    const recargo = dblFee(PROT_PRICE.P08, size);
    const costo = PAVO_KG * GRAMOS[size] / 1000;
    assert(
      costo / recargo <= TECHO,
      `doble de pavo ${size}CM: costo S/${costo.toFixed(2)} sobre recargo S/${recargo.toFixed(2)} = ` +
      `${(costo / recargo * 100).toFixed(1)}%`,
    );
  }
});

Deno.test("el recargo del doble escala con el tamaño", () => {
  // La porción que agrega el doble se duplica de 15CM a 30CM. Un recargo plano entre tamaños
  // es el defecto de P06, que estuvo vivo desde agosto hasta el 2026-09-05 sin que nada lo
  // señalara. No se exige exactamente el doble —el redondeo a precios enteros lo impide—,
  // sino que al menos crezca proporcionalmente a la porción.
  const r15 = dblFee(PROT_PRICE.P08, "15");
  const r30 = dblFee(PROT_PRICE.P08, "30");
  assert(r30 >= r15 * 1.8, `el doble de 30CM (S/${r30}) no escaló contra el de 15CM (S/${r15})`);
});

Deno.test("el pavo se llama en español, como el resto del catálogo interno", () => {
  // Res/Pollo/Atún/Embutido/Albóndiga ya están 100% en español; "Oven Roasted" habría sido el
  // mismo defecto que obligó a renombrar MEATBALL a ALBÓNDIGA. Nada falla si se mezcla: solo
  // queda una lista en dos idiomas que el cliente lee en el recibo.
  assert(PROT_LABEL.P08 === "PAVO // HORNEADO", `el pavo se llama ${PROT_LABEL.P08}`);
});
