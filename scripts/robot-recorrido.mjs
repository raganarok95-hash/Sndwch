// SND//WCH — scripts/robot-recorrido
// LA CUENTA ROBOT DEL RECORRIDO DIARIO (Ezra, 2026-11-11, en la tarjeta: «Sí, solo de cliente»).
//
// Para que tests-real/recorrido.spec.ts revise la cuenta y los puntos de verdad hace falta entrar con una
// cuenta. Esta es una cuenta de CLIENTE (no está en admin_accounts: no entra al panel), sin pedidos, sin
// correo (no le llega ningún correo de campañas) y sin DNI inventado: la regla customers_dni_o_google se
// cumple con google_id = 'robot-recorrido', que no es un id real de Google.
//
// SU CLAVE NO SE GUARDA EN NINGÚN LADO. Cada corrida inventa un PIN nuevo dentro del runner de GitHub, se lo
// pone a la cuenta (la base guarda solo su hash) y se lo pasa al paso siguiente oculto en el registro. Así no
// hay un secreto más que cuidar ni que pueda filtrarse: el PIN de ayer ya no sirve hoy.
//
// Usa SUPABASE_ACCESS_TOKEN, el mismo secret de backup-db.yml y foto-del-esquema.yml.
import { randomInt } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF || 'rjosezuoyngiadunfzyn';
export const TELEFONO_ROBOT = '000000000'; // no es un número real de Perú (los celulares empiezan con 9)

if (!TOKEN) { console.error('✗ Falta SUPABASE_ACCESS_TOKEN.'); process.exit(1); }
const pin = Array.from({ length: 8 }, () => randomInt(10)).join('');
console.log(`::add-mask::${pin}`);

const sql = `insert into public.customers (phone, name, pin, google_id, notif_prefs)
  values ('${TELEFONO_ROBOT}', 'Robot del recorrido', extensions.crypt('${pin}', extensions.gen_salt('bf')), 'robot-recorrido', '{"promo": false, "pedido": false}'::jsonb)
  on conflict (phone) do update set pin = excluded.pin, failed_login_count = 0, locked_until = null
  returning phone, (select count(*) from public.admin_accounts a where a.phone = customers.phone) as es_admin;`;
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const filas = await r.json().catch(() => null);
if (!r.ok || !Array.isArray(filas) || !filas.length) { console.error('✗ No se pudo preparar la cuenta robot:', r.status, JSON.stringify(filas).slice(0, 300)); process.exit(1); }
// Si algún día alguien la hiciera administradora, el recorrido tendría la llave del panel: se detiene.
if (Number(filas[0].es_admin) > 0) { console.error('✗ La cuenta robot está en admin_accounts. Sácala de ahí.'); process.exit(1); }
if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `ROBOT_TELEFONO=${TELEFONO_ROBOT}\nROBOT_PIN=${pin}\n`);
console.log('✓ cuenta robot lista (PIN nuevo para esta corrida)');
