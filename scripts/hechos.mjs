// SND//WCH — scripts/hechos · `npm run hechos`
//
// Escribe docs/hechos/ DESDE EL CÓDIGO: la carta (`_shared/carta.ts`), las reglas del negocio
// (`_shared/reglas.ts`) y las del dinero (`_shared/dinero.ts`). Existe para el índice de búsqueda
// (2026-09-30): el índice devolvía números muertos de documentos viejos porque nadie los podía
// mantener al día a mano. Estas fichas no se editan: se regeneran. Si una dice algo falso, el
// error está en el código.
//
// ⚠ La carta es la SEMILLA. En producción mandan `catalog_prices`, `catalog_items` y
// `secret_signature`: la ficha trae al pie la consulta para comprobarlo.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARTA, etiqueta } from '../supabase/functions/_shared/carta.ts';
import * as R from '../supabase/functions/_shared/reglas.ts';
import { REGLAS } from '../supabase/functions/_shared/dinero.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(RAIZ, 'docs/hechos');
mkdirSync(DIR, { recursive: true });

const S = (n) => 'S/' + (Number.isInteger(n) ? n : n.toFixed(2));
const por = (xs) => Object.fromEntries(xs.map((x) => [x.id, x]));
const P = por(CARTA.proteinas), V = por(CARTA.vegetales), Q = por(CARTA.quesos), SA = por(CARTA.salsas), PA = por(CARTA.panes);
const nom = (m, id) => (m[id] ? etiqueta(m[id]) : id);
const lista = (m, ids) => (ids.length ? ids.map((i) => nom(m, i)).join(', ') : '—');
const CABEZA = (titulo, que) => `# ${titulo}

> **Generado por \`npm run hechos\`** desde ${que}. No se edita a mano: se regenera. Si algo de acá
> está mal, el error está en el código, no en esta ficha.
`;

// ── CARTA ──────────────────────────────────────────────────────────────────────────────
const sigs = CARTA.signatures.filter((s) => !s.secreto).sort((a, b) => a.orden - b.orden);
const secreto = CARTA.signatures.find((s) => s.secreto);
const armables = (xs) => xs.filter((x) => !x.soloSecreto && !x.soloEnSignature);
let c = CABEZA('La carta', '`supabase/functions/_shared/carta.ts` (la semilla)');
c += `
Todo en soles. 15CM y 30CM son los dos tamaños. «Doble» es lo que suma pedir doble proteína.

## Signatures (${sigs.length} en la carta pública)

`;
for (const s of sigs) {
  const p = P[s.prot];
  c += `### ${s.nombre}${s.estrella ? ' ★ (la estrella: la que más deja por unidad)' : ''}
- **Precio:** 15CM ${S(s.p15)} · 30CM ${S(s.p30)}${p && !p.sinDoble ? ` · doble proteína +${S(p.dbl15)} / +${S(p.dbl30)}` : ''}
- **Receta:** pan ${nom(PA, s.pan)} · ${nom(P, s.prot)} · vegetales: ${lista(V, s.vegetales)} · salsas: ${lista(SA, s.salsas)} · queso: ${s.queso ? nom(Q, s.queso) + (s.quesoOpcional ? ' (opcional)' : '') : 'no lleva'}
- **Cómo se vende:** ${s.pitch}

`;
}
if (secreto) {
  c += `## Menú secreto (${secreto.tipo})
- Se desbloquea desde el pedido número **${secreto.secreto.minPedidos}** (el número real es editable desde el panel: \`secret_signature.min_orders\`).
- **Precio:** 15CM ${S(secreto.p15)} · 30CM ${S(secreto.p30)}. No entra en «15CM gratis» ni en el sándwich del organizador.
- **Hacia afuera no se dice qué lleva.** Receta (solo interno): pan ${nom(PA, secreto.pan)} · ${nom(P, secreto.prot)} · ${lista(V, secreto.vegetales)} · ${lista(SA, secreto.salsas)}.
- Lo que el cliente lee: «${secreto.pitch}»

`;
}
c += `## ARMA EL TUYO

El precio lo pone la proteína (más el recargo del pan, si tiene). Vegetales y queso no suman. Hasta
3 salsas; la salsa extra cuesta ${S(REGLAS.salsaExtra)}.

**Panes:** ${CARTA.panes.map((b) => `${etiqueta(b)}${b.recargo ? ` (+${S(b.recargo.p15)} en 15CM, +${S(b.recargo.p30)} en 30CM)` : ' (sin recargo)'}`).join(' · ')}

| proteína | 15CM | 30CM | doble 15 | doble 30 | cómo es |
|---|---|---|---|---|---|
${armables(CARTA.proteinas).map((p) => `| ${etiqueta(p)} | ${S(p.p15)} | ${S(p.p30)} | +${S(p.dbl15)} | +${S(p.dbl30)} | ${p.desc} |`).join('\n')}

Proteínas que existen pero NO se eligen acá: ${CARTA.proteinas.filter((p) => p.soloSecreto || p.soloEnSignature).map((p) => `${etiqueta(p)} (${p.soloSecreto ? 'solo menú secreto' : 'solo dentro de su Signature'})`).join(', ') || '—'}.

**Vegetales:** ${armables(CARTA.vegetales).map((v) => `${etiqueta(v)} — ${v.desc}`).join(' · ')}

**Quesos:** ${CARTA.quesos.map((q) => `${q.nombre} — ${q.desc}`).join(' · ')}

**Salsas:** ${armables(CARTA.salsas).map((s) => `${etiqueta(s)}${s.picante ? ' (picante)' : ''} — ${s.desc}`).join(' · ')}

## Bebidas

Por cada par sándwich + bebida el pedido cuesta ${S(REGLAS.comboPorPar)} menos (el combo).

${CARTA.bebidas.map((b) => `- **${etiqueta(b)}** — ${S(b.precio)} sola · en combo el par ahorra ${S(REGLAS.comboPorPar)}. ${b.desc}`).join('\n')}

## Recompensas (se canjean con puntos)

| recompensa | puntos | qué perdona | tope |
|---|---|---|---|
${CARTA.recompensas.map((r) => `| ${r.nombre} ${r.sabor} | ${r.pts} | ${r.desc} | ${r.tope ? S(r.tope) : 'el monto entero'} |`).join('\n')}

## Comprobar contra la base (manda la base)

\`\`\`sql
select code, category, values from catalog_prices order by category, code;
select distinct on (item_id) item_id, name, price_15, price_30, active from catalog_items order by item_id, created_at desc;
select price_15, price_30, min_orders from secret_signature order by created_at desc limit 1;
\`\`\`
`;
writeFileSync(join(DIR, 'CARTA.md'), c);

// ── REGLAS ─────────────────────────────────────────────────────────────────────────────
const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
let r = CABEZA('Las reglas del negocio', '`supabase/functions/_shared/reglas.ts` y `dinero.ts`');
r += `
## Puntos
- Cada pedido da **1 punto por sol de comida**, redondeado (el envío no cuenta).
- Bono de bienvenida: **${R.WELCOME_BONUS_POINTS} puntos**.
- Reto: ${R.CHALLENGE_TARGET_ORDERS} pedidos → ${R.CHALLENGE_BONUS_POINTS} puntos. Descubrimiento: ${R.DISCOVERY_TARGET_FLAVORS} sabores distintos → ${R.DISCOVERY_BONUS_POINTS} puntos.
- Rangos por pedidos: ${R.RANKS.map((x) => `${x.name} (${x.minOrders})`).join(' → ')}. El menú secreto se explica en PEDIDOS, nunca por rango.

## Referidos
- El invitado recibe **${R.REFERRAL_BONUS_POINTS} puntos** (lo que cuesta una bebida) y quien invita **${R.REFERRER_REWARD_POINTS}** (lo que cuesta un 15CM). Se derivan de la carta: si cambia el precio en puntos, cambia el bono.
- Escalera de quien invita: ${R.REFERRAL_MILESTONES.map((m) => `${m.count} referidos → ${m.label} (${m.points} pts)`).join(' · ')}.

## Horario y cocina
- Abre: ${R.STORE_HOURS.map((h, i) => `${dias[i]} ${h ? `${h[0]}–${h[1]} h` : 'cerrado'}`).join(' · ')} (hora de Lima).
- Máximo **${R.MAX_ORDERS_PER_HOUR} pedidos por hora** (la cuenta vive en \`api/capacidad.ts\`). Cola: ${R.QUEUE_MINUTES_PER_ORDER} min por pedido.
- Llegada que se promete con la cocina vacía: **${R.ESTIMATED_DELIVERY_RANGE[0]}–${R.ESTIMATED_DELIVERY_RANGE[1]} min**.
- Notas que avisan a cocina: ${R.NOTE_ALERT_WORDS.join(', ')}.

## Envío
- Por distancia: km en línea recta × ${R.DELIVERY_ROAD_FACTOR} (factor de ruta) × ${S(R.DELIVERY_KM_RATE)} por km, mínimo ${S(R.DELIVERY_MIN_FEE)}, redondeado hacia ARRIBA al medio sol. Es pass-through: todo va al motorizado.
- Sin tope de distancia${R.DELIVERY_EXCLUDED_ZONES.length ? '. No se entrega en: ' + R.DELIVERY_EXCLUDED_ZONES.join(', ') : ' ni zonas excluidas: manda la distancia'} (dueño, 2026-09-30).
- Sin coordenadas cae a zona: ${R.ZONAS_DE_ENVIO.map((z) => `${z.nombre} ${S(z.precio)}`).join(' · ')}.

## Pago
- Yape por defecto (sin recargo). Con tarjeta (Culqi) el ENVÍO se cobra ÷ (1 − ${R.CULQI_FEE_RATE}) para que la comisión no se coma lo del motorizado; la comisión sobre la comida la absorbe el margen.
- Reportar un problema: hasta **${R.REPORTE_PLAZO_HORAS} h** después de la entrega.

## Descuentos del dinero (\`dinero.ts\`)
- Combo: −${S(REGLAS.comboPorPar)} por cada par sándwich + bebida.
- Salsa extra: +${S(REGLAS.salsaExtra)}.
- Pedido grupal: el organizador se lleva gratis el 15CM más barato desde **${REGLAS.organizadorDesde} sándwiches**.
- Bebida gratis de hora valle: ${REGLAS.valleHorasLima.length ? 'ACTIVA' : '**retirada** (no nombrarla en ningún texto)'}.

## Fuera de la apertura
Plan Semanal (${S(R.WEEKLY_PLAN_PRICE)} → ${S(R.WEEKLY_PLAN_CREDIT)} de crédito) y tarjeta de regalo (${S(R.GIFT_CARD_AMOUNT_MIN)}–${S(R.GIFT_CARD_AMOUNT_MAX)}): el código existe, la apertura no los ofrece.
`;
writeFileSync(join(DIR, 'REGLAS.md'), r);

// ── CÓMO SE CALCULA ──────────────────────────────────────────────────────────────────────
let k = CABEZA('Cómo se calcula el dinero', '`_shared/dinero.ts`, `api/actions/orders.ts` y `modelo/`');
k += `
## Lo que paga el cliente (en este orden, en céntimos enteros)
1. **Cada línea** = precio base (Signature, o proteína + recargo del pan) + doble proteína + salsa extra (${S(REGLAS.salsaExtra)}). Bebida = su precio.
2. **Subtotal** = Σ línea × cantidad.
3. **Combo**: −${S(REGLAS.comboPorPar)} × min(sándwiches, bebidas). La recompensa de sándwich o de bebida saca esa unidad de la cuenta del combo.
4. **Organizador** (pedido grupal con ≥ ${REGLAS.organizadorDesde} sándwiches): −el 15CM más barato.
5. **Recompensa**: −lo que perdona (con su tope).
6. **Envío** aparte (ver REGLAS.md), ajustado si paga con tarjeta. Código promocional aparte.
7. **Puntos que da** = round(total de comida), sin envío.

Fuente única: \`resolverCarrito()\` en \`_shared/dinero.ts\`. El cliente muestra con la misma función
(\`cartDesglose()\`); una regla de precio nueva va ahí y en ningún otro sitio.

## Lo que le queda al negocio
- **Costo de ingredientes por sándwich**: \`modelo/insumos.py\` — cada insumo con valor, unidad, estado
  (COTIZADO/ESTIMADO/SIN_COTIZAR), fuente y fecha, convertido SOLO por \`por_sandwich()\`.
- **Techo**: el costo de ingredientes no pasa del **45%** del precio. Parte por parte:
  \`python3 modelo/rentabilidad_por_parte.py\`.
- **Contribución por pedido** = comida cobrada − ingredientes − empaque (por PEDIDO, no por sándwich) −
  comisión de tarjeta si aplica. El envío no deja margen (pass-through).
- **Recompensas**: todas devuelven ~1.3–1.5% de lo gastado para ganarlas (tasa pareja anclada en el 15CM gratis).

## Conseguir clientes
- **CAC = CPM ÷ (1000 × CTR × CVR) × 1.18** (IGV). El CAC baja en proporción a lo que suben CTR y CVR;
  la conversión de la app es la única de las tres que controla el negocio.
- El referido cuesta lo que se regala en puntos (${R.REFERRAL_BONUS_POINTS} + ${R.REFERRER_REWARD_POINTS}); mezclarlo con el pagado baja el CAC combinado.
- Techo de CAC por valor de vida del cliente, no por primer pedido: \`docs/CAMPANA_DE_ANUNCIOS.md\`.

## Proyección
\`python3 modelo/modelo_v14.py\` (usa v11 y \`comparativa_menu.py\`). Es SIMULACIÓN: la tienda no ha
abierto, no hay un solo pedido real. Supuestos y resultados: \`PREDICCION_V14.md\` y \`docs/NEGOCIO.md\`.
`;
writeFileSync(join(DIR, 'COMO_SE_CALCULA.md'), k);

// ── PROMPTS PARA OTRA IA ─────────────────────────────────────────────────────────────────
// A pedido del dueño (2026-09-30): si se acaban los créditos, poder seguir el marketing, el menú y
// las cuentas con otra IA. Cada prompt es autocontenido: se copia entero y se pega.
let costos = '';
try {
  costos = execFileSync('python3', ['modelo/rentabilidad_por_parte.py'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
} catch (e) {
  costos = '(no se pudo correr modelo/rentabilidad_por_parte.py: ' + String(e.message).split('\n')[0] + ')';
}
const MARCA = `SND//WCH es una sandwichería SOLO delivery en Trujillo, Perú, con pedidos por su propia app web.
Abre a más tardar la segunda semana de octubre de 2026: todavía no hay clientes ni ventas reales.
- El «//» del nombre es el CORTE DEL PAN: dos barras paralelas del mismo tamaño. Nunca se cambia su forma.
- La marca la llevan dos hermanos ilustrados: SANDO (bomber oliva con forro naranja, ojos de párpado
  pesado, tranquilo; es el lado de los Signatures) y WICHO (ojos en espiral, polo con curvas de nivel,
  rosa durazno y lila, sonrisa abierta; es el lado de ARMA EL TUYO).
- NO tiene identidad trujillana ni regional: nada de Chan Chan, Chimú, Moche ni referencias a la ciudad
  en la estética o en los nombres.
- Se habla de «tú», en español neutro peruano. Nunca voseo («vos», «tenés»).
- Toda cifra que se publique tiene que ser la real de abajo. No prometer nada que no esté acá: la bebida
  gratis de hora valle está RETIRADA; el Plan Semanal y la tarjeta de regalo NO se ofrecen en la apertura.
- El menú secreto nunca revela qué lleva.`;
const PR = CABEZA('Prompts para otra IA', 'las fichas de esta carpeta y `modelo/rentabilidad_por_parte.py`') + `
Tres prompts autocontenidos. Se copia uno ENTERO (desde «Eres…» hasta el final de su bloque) y se pega
en la otra IA. Los datos se regeneran con \`npm run hechos\`: si pasó tiempo, regenerar antes de copiar.

---

## 1 · Marketing

Eres el estratega de marketing de SND//WCH. Te paso todo lo que es verdad hoy; no inventes nada que no
esté acá (ni precios, ni promociones, ni ingredientes). Si te falta un dato, pregúntamelo.

${MARCA}

${c.replace(/^# La carta[\s\S]*?\n## Signatures/m, '## Signatures').replace(/## Comprobar contra la base[\s\S]*$/, '').replace(/\*\*Receta \(solo interno\)[^\n]*|Receta \(solo interno\):[^\n]*/g, '')}
${r.replace(/^# [^\n]*\n\n>[^\n]*\n>[^\n]*\n/, '')}
Lo que quiero de ti: [escribe acá el pedido: calendario de publicaciones, guiones de reels, copies de
anuncios, mensajes de WhatsApp…]. Cada pieza debe decir qué producto o mecánica usa y con qué cifra.

---

## 2 · El menú en detalle

Eres el jefe de cocina y de carta de SND//WCH. Esta es la carta completa y vigente, con recetas,
precios y cómo se describe cada cosa. Úsala tal cual; no agregues ingredientes que no estén.

${MARCA}

${c.replace(/^# La carta[\s\S]*?\n## Signatures/m, '## Signatures').replace(/## Comprobar contra la base[\s\S]*$/, '')}
Lo que quiero de ti: [p. ej. fichas de cocina, descripciones para la carta impresa, propuestas de
nuevos Signatures que respeten el techo de costo de 45%…].

---

## 3 · Los cálculos financieros

Eres el analista financiero de SND//WCH. Todo es SIMULACIÓN: la tienda no ha abierto. Explica cada
supuesto que uses y marca cuáles son cotizados y cuáles estimados.

${k.replace(/^# [^\n]*\n\n>[^\n]*\n>[^\n]*\n/, '')}
${r.replace(/^# [^\n]*\n\n>[^\n]*\n>[^\n]*\n/, '')}
### Costos de hoy, parte por parte (salida de \`modelo/rentabilidad_por_parte.py\`)

\`\`\`
${costos.trim()}
\`\`\`

Lo que quiero de ti: [p. ej. punto de equilibrio mensual, cuánto puedo pagar por cliente nuevo,
qué pasa si sube el pollo 20%…]. Muestra las fórmulas y los números, paso a paso.
`;
writeFileSync(join(DIR, 'PROMPTS_OTRA_IA.md'), PR);

console.log('docs/hechos: CARTA.md, REGLAS.md, COMO_SE_CALCULA.md, PROMPTS_OTRA_IA.md');
