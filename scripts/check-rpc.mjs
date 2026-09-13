#!/usr/bin/env node
// CHEQUEO DE RPC — que ninguna función `security definer` quede llamable con la anon key.
//
// POR QUÉ EXISTE. `CLAUDE.md` lo dice con todas las letras: *"Toda RPC `security definer`
// nueva necesita ese revoke: es el séptimo caso del mismo defecto en este repo."* Séptimo.
// El peor fue `record_cron_heartbeat`, que quedó ejecutable por cualquiera con la anon key
// —o sea que cualquiera podía escribir un latido falso y DEJAR MUDA la alarma de crons caídos
// justo mientras la automatización estaba caída.
//
// Una función `security definer` corre con los privilegios de quien la creó, saltándose RLS.
// Sin un `revoke`, Postgres la deja ejecutable por PUBLIC por defecto, y en Supabase eso
// incluye a `anon` — la llave que va escrita en el HTML de la app. El defecto NO produce
// ningún error: la función funciona igual de bien para el servidor. Solo que además funciona
// para todo el mundo.
//
// Se lee del REPO, no de la base: las migraciones están versionadas y la base está bloqueada
// por el proxy de este entorno. Un `drop function` posterior cierra el caso — una función que
// ya no existe no puede estar mal protegida.
//
// Correr con: npm run check:rpc   (dentro de `npm run verify`)

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'supabase/migrations';
const archivos = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

// Se recorre EN ORDEN de versión y se mantiene un estado por función, porque el historial es
// acumulativo: una función puede crearse sin revoke y arreglarse dos migraciones después, o
// crearse y borrarse. Mirar cada archivo por separado daría falsos positivos en los dos casos.
const estado = new Map(); // nombre -> { creadaEn, protegida, viva, aridad }

// Cuenta los argumentos de una firma a partir del paréntesis de apertura, emparejando
// paréntesis para no contar las comas de un `numeric(10,2)`. Hace falta porque este repo
// cambia firmas con el patrón `drop function vieja(...)` + `create or replace nueva(...)`:
// sin comparar la aridad, el drop de la sobrecausa vieja mataría a la que está viva.
function aridadDesde(sql, iParen) {
  let prof = 0;
  let comas = 0;
  let vacio = true;
  for (let i = iParen; i < sql.length; i++) {
    const c = sql[i];
    if (c === '(') { prof++; continue; }
    if (c === ')') { prof--; if (prof === 0) return vacio ? 0 : comas + 1; continue; }
    if (prof === 1 && c === ',') comas++;
    if (!/\s/.test(c)) vacio = false;
  }
  return -1; // firma sin cerrar: no se compara con nada
}

// ⚠ LOS EVENTOS SE APLICAN EN ORDEN DE APARICIÓN, no en tres pasadas por tipo. La primera
// versión procesaba todos los `create`, después todos los `revoke` y después todos los
// `drop` — y con eso un archivo que hace `drop` y vuelve a crear la función (el patrón normal
// para cambiarle la firma) quedaba marcado como MUERTA. Cuatro funciones vivas en producción
// —`reverse_referral_bonus`, `grant_referral_milestone`, `claim_monthly_challenge` y
// `finalize_order_customer_update`— desaparecían del chequeo sin decir nada.
//
// Eso es peor que no tener chequeo: un punto ciego en una verificación de seguridad da
// confianza falsa exactamente donde no la hay. Se detectó comparando el conteo del script
// contra `pg_proc` de la base real; sin ese cruce habría pasado.
for (const f of archivos) {
  const sql = readFileSync(join(DIR, f), 'utf8').toLowerCase();
  const eventos = [];

  // Los cuerpos de función van dentro de `$$ ... $$` y ahí adentro puede haber cualquier cosa.
  // Se parte por las sentencias `create function` y se mira el tramo de una a la siguiente.
  const marcas = [...sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?(\w+)"?\s*\(/g)];
  marcas.forEach((m, i) => {
    const tramo = sql.slice(m.index, i + 1 < marcas.length ? marcas[i + 1].index : sql.length);
    if (/security\s+definer/.test(tramo)) {
      eventos.push({ i: m.index, tipo: 'crea', fn: m[1], aridad: aridadDesde(sql, m.index + m[0].length - 1) });
    }
  });
  for (const m of sql.matchAll(/revoke\s+(?:all\s+(?:privileges\s+)?|execute\s+)?on\s+function\s+(?:public\.)?"?(\w+)"?/g)) {
    eventos.push({ i: m.index, tipo: 'protege', fn: m[1] });
  }
  for (const m of sql.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?"?(\w+)"?\s*(\()?/g)) {
    eventos.push({
      i: m.index,
      tipo: 'borra',
      fn: m[1],
      // Un drop sin paréntesis borra la función entera; uno con firma borra SOLO esa sobrecarga.
      aridad: m[2] ? aridadDesde(sql, m.index + m[0].length - 1) : null,
    });
  }
  // Un `grant execute` a anon/authenticated/public DESPUÉS del revoke lo deshace. Se reporta
  // igual que la ausencia de revoke: para quien llama, el efecto es el mismo.
  for (const m of sql.matchAll(/grant\s+execute\s+on\s+function\s+(?:public\.)?"?(\w+)"?[^;]*?\b(?:anon|authenticated|public)\b/g)) {
    eventos.push({ i: m.index, tipo: 'abre', fn: m[1] });
  }

  for (const ev of eventos.sort((a, b) => a.i - b.i)) {
    const prev = estado.get(ev.fn);
    if (ev.tipo === 'crea') {
      estado.set(ev.fn, {
        creadaEn: prev?.creadaEn || f, protegida: prev?.protegida || false, viva: true, aridad: ev.aridad,
      });
    } else if (prev) {
      if (ev.tipo === 'protege') prev.protegida = true;
      if (ev.tipo === 'abre') prev.protegida = false;
      // ⚠ Un drop CON firma solo mata a esa sobrecarga. `reverse_referral_bonus` y
      // `finalize_order_customer_update` viven hoy en producción justo así: una migración
      // creó la versión nueva y borró la vieja por su firma anterior. Sin comparar la
      // aridad, el chequeo las daba por muertas y dejaba de mirarlas — verificado contra
      // `pg_proc` de la base real el 2026-09-13, que es como se encontró.
      if (ev.tipo === 'borra' && (ev.aridad === null || ev.aridad === prev.aridad)) prev.viva = false;
    }
  }
}

const desprotegidas = [...estado.entries()].filter(([, e]) => e.viva && !e.protegida);
const vivas = [...estado.values()].filter((e) => e.viva).length;

if (desprotegidas.length) {
  console.error('✗ RPC `security definer` sin `revoke`:\n');
  for (const [nombre, e] of desprotegidas) {
    console.error(`  · ${nombre}()  — creada en ${e.creadaEn}`);
  }
  console.error('\n  Sin revoke, Postgres la deja ejecutable por PUBLIC, y en Supabase eso incluye');
  console.error('  a `anon`: la llave que va escrita en el HTML de la app. La función se salta RLS.');
  console.error('  Agrega a su migración:');
  console.error('    revoke execute on function <nombre>(<args>) from public, anon, authenticated;');
  process.exit(1);
}

console.log(`✓ RPC: ${vivas} funciones \`security definer\` vivas, todas con su revoke`);
