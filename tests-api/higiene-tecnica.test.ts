// Pruebas del lote E6 — las señales que avisan de algo que no produce ningún error.
//
// POR QUÉ EXISTEN. Todas las de este archivo comparten el mismo modo de fallo: **silencio**.
// Si `adminAccessAttempts` no cuenta bien, nadie recibe el aviso de que están intentando
// entrar a su panel; si `dbGrowth` se equivoca de umbral, la base topa los 500 MB y el
// negocio deja de tomar pedidos; si `latencyStats` mira el promedio, el p95 de 8 segundos
// que hace abandonar el checkout nunca aparece. Ninguna de esas cosas lanza una excepción
// que alguien pueda mirar después, y el typecheck no ve ninguna de ellas.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import {
  adminAccessAttempts,
  dbGrowth,
  latencyStats,
  staleAdmins,
  deliveryPerformance,
  repeatComplaints,
  retentionDigest,
} from "../supabase/functions/api/actions/admin.ts";

const intento = (src: string, phone = "900000099") => ({
  detail: { stage: "admin-login-failed", src, phone, reason: "pin-incorrecto" },
  created_at: "2026-09-10T18:00:00Z",
});

// ── #89 · Intentos de acceso contra la cuenta admin ─────────────────────────────────────

Deno.test("nadie intentando nada no dispara nada", () => {
  const r = adminAccessAttempts([]);
  assertEquals(r.total, 0);
  assertEquals(r.alert, false);
  assertEquals(r.reason, null);
});

Deno.test("equivocarse de PIN hasta que te bloquean NO es una alarma", () => {
  // El bloqueo corta a los 5 intentos. Una alarma que suena porque el dueño se equivocó de
  // PIN y esperó su bloqueo deja de mirarse antes del día que importa — es exactamente el
  // defecto que ya se corrigió en la alerta de rechazos de tarjeta.
  const r = adminAccessAttempts(Array.from({ length: 5 }, () => intento("aaa111")));
  assertEquals(r.total, 5);
  assertEquals(r.alert, false);
});

Deno.test("comerse dos bloqueos enteros en una hora sí lo es", () => {
  const r = adminAccessAttempts(Array.from({ length: 10 }, () => intento("aaa111")));
  assertEquals(r.alert, true);
  assertEquals(r.reason, "muchos-intentos");
  assertEquals(r.sources.length, 1);
});

Deno.test("pocos intentos repartidos entre varias conexiones también avisan", () => {
  // La FORMA, no el volumen: 6 intentos desde 3 conexiones distintas no es alguien
  // olvidadizo, es alguien rotando de red.
  const r = adminAccessAttempts([
    intento("aaa111"), intento("aaa111"),
    intento("bbb222"), intento("bbb222"),
    intento("ccc333"), intento("ccc333"),
  ]);
  assertEquals(r.alert, true);
  assertEquals(r.reason, "varias-fuentes");
  assertEquals(r.sources.length, 3);
});

Deno.test("cambiar de wifi a datos móviles no dispara la alarma", () => {
  // Dos huellas distintas las produce cualquiera saliendo de casa con el celular. Por eso
  // se piden TRES fuentes y no dos: con dos, esta alerta sonaría por vivir la vida normal.
  const r = adminAccessAttempts([intento("aaa111"), intento("aaa111"), intento("bbb222")]);
  assertEquals(r.alert, false);
});

Deno.test("la dispersión también exige un mínimo de intentos", () => {
  // 3 fuentes con 1 intento cada una es ruido: tres personas escribiendo mal el número una
  // vez. Sin este mínimo, la alerta sonaría por eso.
  const r = adminAccessAttempts([intento("a1"), intento("b2"), intento("c3")]);
  assertEquals(r.total, 3);
  assertEquals(r.alert, false);
});

Deno.test("las filas de debug_logs que no son intentos de acceso se ignoran", () => {
  // debug_logs es compartido: ahí van los tiempos de respuesta, las excepciones y los
  // eventos de Culqi. Contarlos como intentos fallidos dispararía la alarma todos los días.
  const r = adminAccessAttempts([
    { detail: { stage: "request-timing", ms: 4000 } } as never,
    { detail: { stage: "exception", action: "place-order" } } as never,
    { detail: null } as never,
    intento("aaa111"),
  ]);
  assertEquals(r.total, 1);
  assertEquals(r.alert, false);
});

// ── #97 · Espacio en la base ────────────────────────────────────────────────────────────

Deno.test("el aviso de espacio llega antes del tope, no al llegar", () => {
  // Topar el límite no degrada nada con aviso: la base pasa a solo lectura y el negocio deja
  // de tomar pedidos. Enterarse al 100% es enterarse cuando ya está cerrado.
  const limite = 500 * 1024 * 1024;
  assertEquals(dbGrowth(limite * 0.5, limite).warn, false);
  assertEquals(dbGrowth(limite * 0.7, limite).warn, true);
  assertEquals(dbGrowth(limite * 0.95, limite).usedPct, 0.95);
});

Deno.test("un tamaño imposible no inventa un porcentaje", () => {
  assertEquals(dbGrowth(NaN).usedBytes, 0);
  assertEquals(dbGrowth(-5).usedBytes, 0);
  assertEquals(dbGrowth(NaN).warn, false);
});

// ── #98 · Latencia ──────────────────────────────────────────────────────────────────────

Deno.test("sin peticiones lentas no hay latencia que reportar (ni un 0 que engañe)", () => {
  // Un 0 se leería como "responde instantáneo". El `null` dice lo que pasa: no hay muestra.
  const r = latencyStats([]);
  assertEquals(r.samples, 0);
  assertEquals(r.p95, null);
  assertEquals(r.warn, false);
});

Deno.test("una petición lentísima entre muchas rápidas SÍ aparece", () => {
  // Es todo el punto de usar p95 y no promedio: el promedio de estas es ~1400 ms y no
  // dispararía nada, mientras hay clientes esperando 9 segundos en el checkout.
  const filas = [
    ...Array.from({ length: 19 }, () => ({ detail: { ms: 1300 } })),
    { detail: { ms: 9000 } },
  ];
  const r = latencyStats(filas);
  assertEquals(r.samples, 20);
  assertEquals(r.worst, 9000);
  assertEquals(r.p95, 9000);
  assertEquals(r.warn, true);
});

Deno.test("filas sin duración no cuentan como peticiones de 0 ms", () => {
  const r = latencyStats([{ detail: { ms: 2000 } }, { detail: {} }, { detail: null }]);
  assertEquals(r.samples, 1);
  assertEquals(r.p50, 2000);
});

// ── #88 · Cuentas admin abandonadas ─────────────────────────────────────────────────────

const AHORA = Date.parse("2026-09-10T12:00:00Z");
const haceDias = (d: number) => new Date(AHORA - d * 86400000).toISOString();

Deno.test("una cuenta admin usada esta semana no se marca", () => {
  assertEquals(staleAdmins([{ phone: "900000099", name: "Dueño", last_login_at: haceDias(3) }], AHORA).length, 0);
});

Deno.test("una cuenta que nunca entró es la señal más fuerte, no la más débil", () => {
  // `null` es lo que deja una cuenta creada y nunca usada. Tratarlo como "sin dato, no
  // molestar" dejaría fuera justo la cuenta que nadie recuerda haber creado.
  const r = staleAdmins([{ phone: "900000077", name: "Ex ayudante", last_login_at: null }], AHORA);
  assertEquals(r.length, 1);
  assertEquals(r[0].neverLoggedIn, true);
  assertEquals(r[0].daysSince, null);
});

Deno.test("las abandonadas salen primero y las nunca usadas antes que todas", () => {
  const r = staleAdmins([
    { phone: "1", last_login_at: haceDias(70) },
    { phone: "2", last_login_at: null },
    { phone: "3", last_login_at: haceDias(200) },
    { phone: "4", last_login_at: haceDias(2) },
  ], AHORA);
  assertEquals(r.map((a) => a.phone).join(","), "2,3,1");
});

// ── #78 · Entrega prometida contra entrega real ─────────────────────────────────────────

Deno.test("sin hora de entrega registrada no se inventa un cumplimiento", () => {
  // El caso real del primer mes: `delivered_at` lo escribe el link que abre quien reparte.
  // Rellenar los que faltan con la hora actual daría un porcentaje inventado.
  const r = deliveryPerformance([{ ref: "A", created_at: "2026-09-10T18:00:00Z", delivered_at: null }], 40);
  assertEquals(r.delivered, 1);
  assertEquals(r.measured, 0);
  assertEquals(r.onTimePct, null);
  assertEquals(r.p90Minutes, null);
});

Deno.test("el p90 muestra la cola que el promedio esconde", () => {
  // Nueve entregas de 30 minutos y una de 180: el promedio dice 45 y suena aceptable.
  const base = "2026-09-10T18:00:00Z";
  const mas = (min: number) => new Date(Date.parse(base) + min * 60000).toISOString();
  const filas = [
    ...Array.from({ length: 9 }, (_, i) => ({ ref: "R" + i, created_at: base, delivered_at: mas(30), eta_minutes: 40 })),
    { ref: "TARDE", created_at: base, delivered_at: mas(180), eta_minutes: 40 },
  ];
  const r = deliveryPerformance(filas, 40);
  assertEquals(r.measured, 10);
  assertEquals(r.onTime, 9);
  assertEquals(r.avgMinutes, 45);
  assertEquals(r.p90Minutes, 180);
  assertEquals(r.worst[0].ref, "TARDE");
});

Deno.test("un pedido sin ETA propia se mide contra la promesa por defecto", () => {
  const r = deliveryPerformance(
    [{ ref: "A", created_at: "2026-09-10T18:00:00Z", delivered_at: "2026-09-10T18:35:00Z" }],
    40,
  );
  assertEquals(r.worst[0].promised, 40);
  assertEquals(r.onTime, 1);
});

Deno.test("una entrega con horas al revés se descarta en vez de dar minutos negativos", () => {
  const r = deliveryPerformance(
    [{ ref: "A", created_at: "2026-09-10T19:00:00Z", delivered_at: "2026-09-10T18:00:00Z" }],
    40,
  );
  assertEquals(r.measured, 0);
});

// ── #77 · Queja repetida ────────────────────────────────────────────────────────────────

Deno.test("un solo reclamo no es un reincidente", () => {
  assertEquals(repeatComplaints([{ consumer_phone: "9", consumer_name: "Ana", claim_code: "R-1" }]).length, 0);
});

Deno.test("se agrupa por teléfono y no por nombre", () => {
  // Dos "Juan Pérez" distintos aparecerían como un reincidente si se agrupara por nombre, y
  // eso mandaría a buscar un problema de proceso donde no lo hay.
  const r = repeatComplaints([
    { consumer_phone: "111", consumer_name: "Juan Pérez", claim_code: "R-1", created_at: "2026-09-01" },
    { consumer_phone: "222", consumer_name: "Juan Pérez", claim_code: "R-2", created_at: "2026-09-02" },
  ]);
  assertEquals(r.length, 0);
});

Deno.test("el mismo teléfono dos veces sí sale, con sus dos códigos", () => {
  const r = repeatComplaints([
    { consumer_phone: "111", consumer_name: "Ana", kind: "reclamo", claim_code: "R-1", created_at: "2026-09-01" },
    { consumer_phone: "111", consumer_name: "Ana", kind: "queja", claim_code: "R-2", created_at: "2026-09-05" },
  ]);
  assertEquals(r.length, 1);
  assertEquals(r[0].count, 2);
  assertEquals(r[0].codes.join(","), "R-1,R-2");
  assertEquals(r[0].lastAt, "2026-09-05");
});

Deno.test("un reclamo sin teléfono no se agrupa con otro sin teléfono", () => {
  // Sin teléfono no hay forma de saber si es la misma persona; juntarlos inventaría un
  // reincidente que no existe.
  const r = repeatComplaints([
    { consumer_phone: null, consumer_name: "Anónimo", claim_code: "R-1" },
    { consumer_phone: "", consumer_name: "Otro", claim_code: "R-2" },
  ]);
  assertEquals(r.length, 0);
});

// ── #94 · El resumen del reporte de cohortes ────────────────────────────────────────────

const reporte = (customers: number, extra: Record<string, unknown> = {}) => ({
  overall: { customers, repeatRatePct: 33.3 },
  rolling30: { active: 10, returningPct: 40 },
  daysToSecond: { median: 12.5, n: 8 },
  margin: { orders: 50, perOrder: 16.68 },
  segments: { enRiesgo: 4 },
  ...extra,
});

Deno.test("con pocos clientes el resumen dice PRIMERO que no se fíe", () => {
  // Con 12 clientes, "el 33% volvió" son 4 personas: mover una cambia el número 8 puntos.
  // Un porcentaje así no es una medición, y el aspecto de dato es lo que hace que se le crea.
  const d = retentionDigest(reporte(12));
  assertEquals(d.reliable, false);
  assertEquals(d.headline, "Todavía no hay clientes suficientes para medir retención.");
  assertEquals(typeof d.reason === "string" && d.reason.includes("12"), true);
});

Deno.test("con base suficiente el titular es el número que decide", () => {
  const d = retentionDigest(reporte(120));
  assertEquals(d.reliable, true);
  assertEquals(d.reason, null);
  assertEquals(d.repeatRatePct, 33.3);
  assertEquals(d.headline, "33.3% de tus clientes hizo un segundo pedido.");
});

Deno.test("sin segundos pedidos que medir, la mediana de días no se manda", () => {
  // El RPC devuelve 0 cuando no hay ninguno, y "vuelven a los 0 días" diría exactamente lo
  // contrario de la verdad.
  const d = retentionDigest(reporte(120, { daysToSecond: { median: 0, n: 0 } }));
  assertEquals(d.daysToSecondMedian, null);
});

Deno.test("sin pedidos en la ventana no se reporta una contribución de S/0", () => {
  const d = retentionDigest(reporte(120, { margin: { orders: 0, perOrder: 0 } }));
  assertEquals(d.contributionPerOrder, null);
});

Deno.test("sin clientes activos el 0% de repetición no se presenta como medición", () => {
  const d = retentionDigest(reporte(120, { rolling30: { active: 0, returningPct: 0 } }));
  assertEquals(d.rolling30Pct, null);
});

Deno.test("un reporte vacío o roto no revienta el envío del mes", () => {
  // El correo sale igual: quedarse sin mandar nada porque el RPC vino raro es el mismo
  // silencio que este ítem existe para romper.
  const d = retentionDigest(null);
  assertEquals(d.customers, 0);
  assertEquals(d.reliable, false);
  assertEquals(d.repeatRatePct, null);
  assertEquals(d.atRisk, 0);
});
