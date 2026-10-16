// SND//WCH — datos/semana: lee producción y escribe la semana en números (2026-10-16).
//
// Corre en GitHub (.github/workflows/datos-semana.yml, domingo 21:20 de Lima): el proxy de las
// sesiones bloquea supabase.co. Escribe docs/marketing/semanas/<lunes>/DATOS-base.json en la
// carpeta de la semana que MIDE (lo planeado y lo que pasó quedan juntos). El Analista lo lee y
// escribe el DATOS.md con su lectura (skill medir-por-pedidos).
//
// Uso: node scripts/datos/semana.mjs [AAAA-MM-DD del lunes]   (SUPABASE_ACCESS_TOKEN)
import { mkdirSync, writeFileSync } from 'node:fs';
import { conectar, SB } from '../video-auto/produccion.mjs';
import { APERTURA } from '../video-auto/reglas-del-revisor.mjs';
import { resumirSemana, lunesDe } from './resumen.mjs';

// La semana que TERMINA: GitHub atrasa los crons hasta 9 h (AGENCIA.md §9), así que el domingo
// 23:15 puede correr el lunes temprano. Doce horas atrás sigue cayendo en la semana correcta.
const desde = process.argv[2] || lunesDe(new Date(Date.now() - 12 * 3600e3).toISOString());
const hasta = new Date(Date.parse(desde) + 7 * 864e5).toISOString().slice(0, 10);
// Medianoche de Lima = 05:00 UTC.
const ini = `${desde}T05:00:00Z`, fin = `${hasta}T05:00:00Z`;
const { pedir } = await conectar();
const q = (t, filtro) => pedir(`${SB}/rest/v1/${t}?${filtro}`);
const [pedidos, historia, visitas, gasto] = await Promise.all([
  q('orders', `created_at=gte.${ini}&created_at=lt.${fin}&select=created_at,total,payment_status,status,origen,customer_phone,group_code,recurring_id&limit=10000`),
  q('orders', `created_at=lt.${ini}&payment_status=eq.paid&select=customer_phone,payment_status,status&limit=50000`),
  q('visitas_por_origen', `dia=gte.${desde}&dia=lt.${hasta}&select=dia,src,visitas&limit=5000`),
  q('ad_spend', `spend_date=gte.${desde}&spend_date=lt.${hasta}&select=spend_date,platform,amount&limit=500`),
]);
const r = resumirSemana({ pedidos, historia, visitas, gasto, desde, apertura: APERTURA });
const dir = `docs/marketing/semanas/${desde}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/DATOS-base.json`, JSON.stringify({ ...r, generado: new Date().toISOString() }, null, 1) + '\n');
console.log(`${dir}/DATOS-base.json · ${r.pedidos} pedidos · ${r.clientesNuevos} nuevos${r.prueba ? ' · PRUEBA (antes de abrir)' : ''}`);
