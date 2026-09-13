// KILL SWITCH DE PROMOCIONES — dónde vive el corte, y qué NO apaga.
//
// POR QUÉ EXISTE. El dueño lo pidió como un freno "por si en su momento fallas o no lo
// detienes": un código promocional que se filtra, o una campaña que nadie apagó a tiempo,
// descuenta sin techo hasta que alguien entra a la lista y desactiva los códigos UNO POR UNO
// desde el celular. El interruptor los apaga todos de golpe.
//
// MODO DE FALLO: QUE NO CORTE. Si alguien mueve el guard a la pantalla, o lo pone después de
// leer el código, nada revienta — el panel muestra el interruptor abajo y los descuentos
// siguen aplicándose. Un kill switch que no corta es peor que no tenerlo, porque se confía
// en él.
//
// Estas pruebas miran el CÓDIGO FUENTE a propósito. `computePromoDiscount` toca la base en su
// primera línea útil, así que no se puede ejercitar sin Supabase; lo que sí se puede fijar —y
// es lo que de verdad importa— es DÓNDE está el corte y QUÉ quedó explícitamente fuera.
//
// Correr con: npm run test:api
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

const orders = await Deno.readTextFile(new URL("../supabase/functions/api/actions/orders.ts", import.meta.url));
const hours = await Deno.readTextFile(new URL("../supabase/functions/api/actions/hours.ts", import.meta.url));

Deno.test("el corte está DENTRO de computePromoDiscount, que es el único camino a un descuento", () => {
  const i = orders.indexOf("async function computePromoDiscount");
  assert(i > 0, "no se encontró computePromoDiscount — esta prueba quedó ciega");
  const fin = orders.indexOf("\n}", i);
  const cuerpo = orders.slice(i, fin);
  assert(cuerpo.includes("promosKilled()"), "computePromoDiscount ya no consulta el interruptor");
});

Deno.test("el corte va ANTES de leer el código en la base, no después", () => {
  const i = orders.indexOf("async function computePromoDiscount");
  const cuerpo = orders.slice(i, orders.indexOf("\n}", i));
  const guard = cuerpo.indexOf("promosKilled()");
  const lectura = cuerpo.indexOf('sbGet("promo_codes"');
  assert(guard > 0 && lectura > 0, "no se encontraron las dos referencias");
  // Si el guard fuera después, cada intento con el interruptor abajo seguiría consultando la
  // base para nada — y peor, invitaría a que alguien "aproveche" la fila ya leída.
  assert(guard < lectura, "el interruptor se comprueba DESPUÉS de leer el código: ponlo antes");
});

Deno.test("si la base falla, las promociones NO se apagan solas", () => {
  const i = hours.indexOf("export async function promosKilled");
  assert(i > 0, "no se encontró promosKilled — esta prueba quedó ciega");
  const cuerpo = hours.slice(i, hours.indexOf("\n}", i));
  assert(cuerpo.includes("catch"), "promosKilled tiene que tolerar un fallo de consulta");
  assert(/catch[\s\S]*return false/.test(cuerpo),
    "ante un fallo de base tiene que devolver false: un error de red apagando las promociones "
    + "de todos los clientes a la vez sería un incidente peor, y silencioso");
});

Deno.test("⚠ NO apaga lo que el cliente YA SE GANÓ — ese es el límite y no se mueve", () => {
  // Recompensas por puntos, crédito interno, bonos de referido y el sándwich del organizador
  // son derechos adquiridos: apagarlos no sería frenar una campaña, sería romper una promesa.
  // Si algún día alguien mete el guard en la tasación de recompensas, esta prueba lo caza.
  const catalog = Deno.readTextFileSync(new URL("../supabase/functions/api/catalog.ts", import.meta.url));
  assertEquals(catalog.includes("promosKilled"), false,
    "el interruptor llegó a la tasación del catálogo: apagaría recompensas ya ganadas");
  const group = Deno.readTextFileSync(new URL("../supabase/functions/api/actions/group.ts", import.meta.url));
  assertEquals(group.includes("promosKilled"), false,
    "el interruptor llegó al pedido grupal: quitaría el sándwich que el organizador ya se ganó");
});

Deno.test("el estado viaja al cliente SOLO como cortesía, nunca como la autorización", () => {
  assert(hours.includes("promosKilled: !!settings"), "get-store-hours ya no informa el estado");
  // Y el corte real sigue viviendo en el servidor: si esta prueba y la primera pasan a la vez,
  // el cliente esconde el campo Y el servidor rechaza. Una sola de las dos no alcanza.
  assert(orders.includes("promosKilled()"), "el corte del servidor desapareció");
});

Deno.test("se guarda la HORA, no un booleano, para poder decir cuánto lleva apagado", () => {
  const admin = Deno.readTextFileSync(new URL("../supabase/functions/api/actions/admin.ts", import.meta.url));
  assert(admin.includes("promos_killed_at"), "no se encontró la columna de la hora");
  // Un kill switch tiene el modo de fallo INVERSO al de la pausa de tienda: aquél no puede
  // quedarse encendido, éste no puede quedarse apagado y olvidado. La hora es lo único que
  // permite avisarlo.
  assert(admin.includes("promos_killed_by"), "no se guarda quién lo bajó");
});
