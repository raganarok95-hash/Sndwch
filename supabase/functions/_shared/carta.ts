// SND//WCH — _shared/carta
// LA CARTA, UNA SOLA VEZ (2026-09-24).
//
// Hasta hoy la carta estaba escrita tres veces: en el cliente (`src/app/01-*`: PROTS, SIGS…),
// en el servidor (`api/catalog.ts`: PROT_PRICE, SIG_DATA, las etiquetas, los VALID_*) y en el
// modelo de Python. Las tres se sincronizaban con expresiones regulares (`parity.mjs`,
// `check_costos.py`), y la carta v4 lo mostró: cambiar el menú rompió decenas de pruebas y
// chequeos sin que cambiara ninguna regla del negocio. Ahora cliente y servidor importan este
// objeto, igual que el dinero (`_shared/dinero.ts`), y el modelo lee su exportación a JSON
// (`modelo/carta.json`, que `npm run check:carta` mantiene al día).
//
// ⚠ ESTO ES LA SEMILLA, NO EL PRECIO REAL. En producción mandan `catalog_prices` (precios de
// proteínas y bebidas), `catalog_items` (los Signatures públicos, editables desde el panel) y
// `secret_signature` (el menú secreto). Este objeto es el primer render y el respaldo si la base
// no responde. Un cambio de precio acá no está terminado hasta que la base lo refleje.
//
// ⚠ LA LÓGICA PREGUNTA POR PROPIEDADES, NUNCA POR CÓDIGOS. «¿Es el menú secreto?» se contesta
// con `secreto`, no comparando con "SIG05"; el orden de la carta es `orden`, no una lista de
// códigos. Así la próxima carta cambia datos, no código.

/** Pan. */
/** Pan. `recargo`: lo que suma por tamaño, DENTRO del precio base del sándwich (así lo perdonan
 *  enteros el sándwich gratis y la subida a 30CM). Sin `recargo`, no suma nada. Es uno de los
 *  precios que NO viven en `catalog_prices`. */
export type Pan = { id: string; nombre: string; sabor: string; desc: string; recargo?: { p15: number; p30: number } };

/** Proteína. `dbl15`/`dbl30`: recargo de doble porción en cada tamaño (la porción escala). */
export type Proteina = {
  id: string;
  nombre: string;
  sabor: string;
  desc: string;
  p15: number;
  p30: number;
  dbl15: number;
  dbl30: number;
  /** Solo existe dentro del menú secreto. */
  soloSecreto?: boolean;
  /** Vive en un Signature pero no se puede elegir en ARMA EL TUYO. */
  soloEnSignature?: boolean;
  sinDoble?: boolean;
  sinDoble30?: boolean;
  foto?: string;
};

/** Vegetal (topping). */
export type Vegetal = {
  id: string;
  nombre: string;
  sabor: string;
  desc: string;
  soloSecreto?: boolean;
  soloEnSignature?: boolean;
  picante?: boolean;
};

export type Queso = { id: string; nombre: string; desc: string };

export type Salsa = {
  id: string;
  nombre: string;
  sabor: string;
  desc: string;
  picante?: boolean;
  soloSecreto?: boolean;
  soloEnSignature?: boolean;
};

export type Bebida = { id: string; nombre: string; sabor: string; precio: number; desc: string; icono: string; foto?: string };

export type Signature = {
  id: string;
  nombre: string;
  /** «Signature» o «Reserve»: el segundo nombre que se lee debajo. */
  tipo: "Signature" | "Reserve";
  pitch: string;
  pan: string;
  prot: string;
  vegetales: string[];
  salsas: string[];
  p15: number;
  p30: number;
  /** Queso que lleva siempre. */
  queso?: string;
  /** El cliente puede quitarle o elegirle el queso. */
  quesoOpcional?: boolean;
  foto?: string;
  /** Posición en la carta (de menor a mayor). */
  orden: number;
  /** El que se recomienda primero: el que más deja por unidad. */
  estrella?: boolean;
  /** Menú secreto: se desbloquea con pedidos y su contenido real vive en `secret_signature`. */
  secreto?: { minPedidos: number };
};

/**
 * Qué perdona una recompensa. El dinero decide por esto, nunca por el código:
 * · `salsa`    — el cargo de la salsa extra de una línea que ya la pidió.
 * · `subir30`  — la diferencia de subir un 15CM a 30CM (con `tope`).
 * · `doble`    — el recargo de doble proteína de una línea que ya lo pidió (con `tope`).
 * · `bebida`   — una bebida (con `tope`).
 * · `sandwich` — un 15CM entero, salvo el menú secreto.
 */
export type TipoRecompensa = "salsa" | "subir30" | "doble" | "bebida" | "sandwich";

export type Recompensa = {
  id: string;
  tipo: TipoRecompensa;
  /** Puntos que cuesta. SEMILLA: el valor real vive en `catalog_prices` (categoría reward). */
  pts: number;
  nombre: string;
  sabor: string;
  desc: string;
  /** Máximo que perdona, en soles. Sin tope, perdona el monto entero. */
  tope?: number;
};

export type Carta = {
  panes: Pan[];
  proteinas: Proteina[];
  vegetales: Vegetal[];
  quesos: Queso[];
  salsas: Salsa[];
  bebidas: Bebida[];
  signatures: Signature[];
  recompensas: Recompensa[];
};

export const CARTA: Carta = {
  // Todas devuelven ~1.3-1.5% de lo que se gasta para conseguirlas: una tasa pareja, anclada en
  // el 15CM gratis (ver docs/NEGOCIO.md). Los topes existen porque sin ellos elegir la proteína o
  // la bebida más cara maximizaba el valor de los mismos puntos.
  recompensas: [
    { id: "R02", tipo: "salsa", pts: 20, nombre: "Salsa", sabor: "Extra", desc: "Perdona el cargo de la salsa extra" },
    { id: "R04", tipo: "doble", pts: 160, nombre: "Doble", sabor: "Proteína", desc: "Doble proteína gratis", tope: 6 },
    { id: "R05", tipo: "bebida", pts: 160, nombre: "Bebida", sabor: "Gratis", desc: "Bebida a elección", tope: 6 },
    { id: "R03", tipo: "subir30", pts: 320, nombre: "Tamaño", sabor: "30CM", desc: "Tu sándwich 15CM sube a 30CM gratis", tope: 8 },
    { id: "R06", tipo: "sandwich", pts: 400, nombre: "Sándwich", sabor: "Gratis", desc: "Sándwich 15CM gratis — no aplica al menú secreto" },
  ],
  panes: [
    { id: "B01", nombre: "Classic", sabor: "White", desc: "Miga suave y corteza fina. No pelea con el relleno, lo sostiene." },
    { id: "B03", nombre: "Focaccia", sabor: "Artesanal", desc: "Aceite de oliva en la masa y sal gruesa arriba. Más aromática y más densa.", recargo: { p15: 0.5, p30: 1 } },
  ],
  // El doble escala con el tamaño (85 g en 15CM, 170 g en 30CM): por eso son dos recargos.
  // Precios y doble de la v4 (docs/MENU_CLASICOS_USA.md, modelo/rentabilidad_por_parte.py).
  proteinas: [
    { id: "P03", nombre: "Pollo", sabor: "Cajun", desc: "Pechuga deshilachada con la mezcla cajún de la casa. Calor seco, no picante de salsa.", p15: 13.9, p30: 23.9, dbl15: 6, dbl30: 11, soloSecreto: true },
    { id: "P04", nombre: "Atún", sabor: "House", desc: "En lascas gruesas, nunca hecho pasta. La mayonesa justa y pimienta blanca.", p15: 16.9, p30: 32.9, dbl15: 10.9, dbl30: 21.9, foto: "img/prot_p04.webp" },
    { id: "P05", nombre: "Embutido", sabor: "Italiano", desc: "Tres fiambres ahumados laminados finos y puestos en pliegues, nunca planos.", p15: 16.9, p30: 32.9, dbl15: 9.9, dbl30: 19.9, soloEnSignature: true, foto: "img/prot_p05.webp" },
    { id: "P06", nombre: "Albóndiga", sabor: "Marinara", desc: "Albóndigas chicas hechas acá, cocidas dentro de su propia marinara.", p15: 14.9, p30: 26.9, dbl15: 6, dbl30: 12, foto: "img/prot_p06.webp" },
    { id: "P08", nombre: "Pavo", sabor: "Horneado", desc: "Lonjas de un milímetro puestas en pliegues, laminadas el mismo día.", p15: 15.9, p30: 28.9, dbl15: 9, dbl30: 17, foto: "img/prot_p08.webp" },
    { id: "P09", nombre: "Res", sabor: "Laminada", desc: "Laminada fina y salteada al momento.", p15: 12.9, p30: 22.9, dbl15: 7, dbl30: 13 },
  ],
  vegetales: [
    { id: "T01", nombre: "Tomate", sabor: "Fresco", desc: "En rodajas gruesas, cortado el mismo día." },
    { id: "T03", nombre: "Cebolla", sabor: "Morada juliana", desc: "En pluma fina y cruda. Dulce al entrar, con filo al final." },
    { id: "T04", nombre: "Jalapeño", sabor: "Encurtido", desc: "Picor limpio y corto, del que no tapa lo demás.", soloSecreto: true },
    { id: "T05", nombre: "Aceituna", sabor: "Negra en rodajas", desc: "Salada, con un fondo amargo que despierta el resto." },
    { id: "T06", nombre: "Pimiento", sabor: "Curado", desc: "Curado en aceite: dulce, ahumado y sin nada de agua." },
    { id: "T09", nombre: "Lechuga", sabor: "Fresca", desc: "En tiras y fría. Es lo que hace crujir los bordes." },
    { id: "T10", nombre: "Cebolla", sabor: "Salteada", desc: "Blanca, salteada junto con la res.", soloEnSignature: true },
  ],
  quesos: [
    { id: "C01", nombre: "Mozzarella", desc: "Se derrite hasta el borde y estira al morder." },
    { id: "C02", nombre: "Cheddar", desc: "Curado y salado. No se pierde debajo de la carne." },
    { id: "C03", nombre: "Edam", desc: "Cremoso y discreto. El que no tapa nada." },
  ],
  salsas: [
    { id: "S01", nombre: "Aioli", sabor: "Signature", desc: "Ajo y limón sobre base cremosa. Suave: va con todo." },
    { id: "S02", nombre: "Spicy", sabor: "Mayo", desc: "Cremosa al entrar. El calor llega después, y se queda.", picante: true, soloSecreto: true },
    { id: "S03", nombre: "Smoke", sabor: "BBQ", desc: "Ahumada y espesa, con miel y pimentón. La más contundente." },
    { id: "S04", nombre: "Honey", sabor: "Mustard", desc: "Miel y mostaza suave. Dulce que corta, no que empalaga." },
    { id: "S05", nombre: "SNDWCH", sabor: "Special", desc: "Salada y umami, imposible de ubicar. No decimos qué lleva." },
    { id: "S06", nombre: "Oil & Vinegar", sabor: "Classic", desc: "Aceite de oliva y vinagre. Lo que vuelve italiano a un sándwich." },
    { id: "S08", nombre: "Teriyaki", sabor: "Glaze", desc: "Soja, jengibre y azúcar reducidos hasta que brillan." },
    { id: "S09", nombre: "Chimichurri", sabor: "Piña y Ají", desc: "Piña asada y ají. Dulce y ahumada de entrada, con picor al final.", picante: true },
    { id: "S10", nombre: "Peanut", sabor: "Satay", desc: "Maní tostado con soya y jengibre. Espesa y tostada." },
    { id: "S11", nombre: "Mostaza", sabor: "Dijon", desc: "Ácida y filosa. Sin una gota de dulce." },
    { id: "S12", nombre: "Picante", sabor: "Miel", desc: "Primero la miel. Después el golpe.", picante: true, soloSecreto: true },
  ],
  bebidas: [
    { id: "D06", nombre: "The Bloom", sabor: "Hibiscus", precio: 6, desc: "Flor de jamaica en infusión con un toque de canela, servida helada. Ácida, floral y sin una gota de jugo.", icono: "flor", foto: "img/drink_d06.jpg" },
    { id: "D07", nombre: "The Midnight", sabor: "Brew", precio: 5, desc: "Té negro reposado en frío toda la noche. Suave, sin amargor, con el punch justo de cafeína.", icono: "moon", foto: "img/drink_d07.jpg" },
    { id: "D08", nombre: "The Cool", sabor: "Mint", precio: 6, desc: "Hierba luisa y menta fresca en infusión helada. Ligera, aromática, el break perfecto entre bocado y bocado.", icono: "hoja", foto: "img/drink_d08.jpg" },
  ],
  // Orden de la carta v4: la estrella primero (Philly, la mayor contribución por unidad), y
  // después alternando lo caliente y lo frío para que la carta no se lea como dos bloques.
  signatures: [
    { id: "SIG09", nombre: "Philly Cheesesteak", tipo: "Signature", orden: 1, estrella: true, pan: "B01", prot: "P09", vegetales: ["T10", "T06"], salsas: [], p15: 22.9, p30: 32.9, queso: "C02", foto: "img/sig09.jpg",
      pitch: "Res laminada fina, salteada al momento con cebolla y pimiento, y cheddar fundido encima. Sin salsa: no le hace falta." },
    { id: "SIG02", nombre: "Meatball Marinara", tipo: "Signature", orden: 2, pan: "B01", prot: "P06", vegetales: ["T01", "T03", "T05"], salsas: ["S06"], p15: 21.9, p30: 28.9, queso: "C01", foto: "img/sig02.jpg",
      pitch: "Para la noche en que ya decidiste que no vas a cocinar. Albóndigas hechas acá, cocidas dentro de su propia marinara, con mozzarella derretida hasta el borde. Se come con las dos manos y con servilleta al lado." },
    { id: "SIG10", nombre: "Turkey", tipo: "Signature", orden: 3, pan: "B01", prot: "P08", vegetales: ["T09", "T01", "T03", "T06"], salsas: ["S06"], p15: 23.9, p30: 34.9, foto: "img/sig10.jpg",
      pitch: "Pavo horneado en lonjas finas, con lechuga, tomate, cebolla y pimiento, terminado con aceite y vinagre." },
    { id: "SIG12", nombre: "Tuna Melt", tipo: "Signature", orden: 4, pan: "B01", prot: "P04", vegetales: [], salsas: [], p15: 22.9, p30: 36.9, queso: "C02", foto: "img/sig12.jpg",
      pitch: "El Classic Tuna con cheddar fundido encima: atún en lascas gruesas, mayonesa y pimienta blanca, y el queso que lo junta todo." },
    { id: "SIG11", nombre: "Italian Hoagie", tipo: "Signature", orden: 5, pan: "B01", prot: "P05", vegetales: ["T09", "T01", "T03", "T06"], salsas: ["S06"], p15: 23.9, p30: 33.9, queso: "C01", foto: "img/sig11.jpg",
      pitch: "Embutidos italianos en pliegues, mozzarella, lechuga, tomate, cebolla y pimiento, con oil & vinegar, como en los delis de siempre." },
    { id: "SIG04", nombre: "Classic Tuna", tipo: "Signature", orden: 6, pan: "B01", prot: "P04", vegetales: [], salsas: [], p15: 20.9, p30: 34.9, foto: "img/sig04.jpg",
      pitch: "Para comer en el escritorio con una mano, sin que se desarme entre bocado y bocado: no lleva nada suelto adentro. Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Nada más." },
    { id: "SIG05", nombre: "Menú secreto", tipo: "Reserve", orden: 99, secreto: { minPedidos: 3 }, pan: "B03", prot: "P03", vegetales: ["T04", "T06", "T03"], salsas: ["S02", "S12"], p15: 24.9, p30: 30.9, foto: "img/sig05.jpg",
      pitch: "Solo para clientes iniciados. Una combinación que no está en ningún menú — te la ganaste a pedidos. No preguntes qué lleva. Pruébalo." },
  ],
};

/** «Res // Laminada»: el nombre de dos partes con el que se muestra y se imprime un ítem. */
export function etiqueta(x: { nombre: string; sabor?: string; tipo?: string }): string {
  const segunda = x.sabor ?? x.tipo ?? "";
  return segunda ? `${x.nombre} // ${segunda}` : x.nombre;
}

/** Signatures públicos (sin el secreto), en el orden de la carta. */
export function signaturesDeLaCarta(c: Carta = CARTA): Signature[] {
  return c.signatures.filter((s) => !s.secreto).sort((a, b) => a.orden - b.orden);
}

/** El Signature del menú secreto, si la carta tiene uno. */
export function signatureSecreto(c: Carta = CARTA): Signature | undefined {
  return c.signatures.find((s) => s.secreto);
}

/**
 * La ranura del menú secreto: el id bajo el que el servidor guarda lo que carga de
 * `secret_signature`. Sale de la carta (la Signature con `secreto`), no de un literal.
 */
export const ID_SECRETO: string = (() => {
  const s = signatureSecreto();
  if (!s) throw new Error("La carta no tiene menú secreto: ninguna Signature lleva `secreto`.");
  return s.id;
})();

/** ¿Es el menú secreto? Por propiedad, nunca comparando con un código. */
export function esSecreto(id: string, c: Carta = CARTA): boolean {
  return !!c.signatures.find((s) => s.id === id)?.secreto;
}

/** La recompensa de ese tipo en la carta (la primera, si hubiera más de una). */
export function recompensaDeTipo(tipo: TipoRecompensa, c: Carta = CARTA): Recompensa | undefined {
  return c.recompensas.find((r) => r.tipo === tipo);
}

const porId = <T extends { id: string }>(xs: T[]): Record<string, T> => Object.fromEntries(xs.map((x) => [x.id, x]));
export const idsDe = <T extends { id: string }>(xs: T[], cond: (x: T) => boolean = () => true): string[] => xs.filter(cond).map((x) => x.id);
export { porId };
