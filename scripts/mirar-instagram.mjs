// SND//WCH — scripts/mirar-instagram: cómo se ve el Instagram del negocio, como lo ve un cliente
// sin cuenta. Corre en GitHub (.github/workflows/mirar-instagram.yml): el proxy de las sesiones de
// Claude bloquea instagram.com. Deja en ./instagram/ capturas del perfil (celular), los datos
// públicos (bio, contadores, publicaciones, destacadas) y las miniaturas de las publicaciones.
// Solo LEE: no inicia sesión, no publica, no sigue a nadie.
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const USUARIO = process.env.IG_USUARIO || 'snd__wch';
const OUT = 'instagram';
mkdirSync(`${OUT}/posts`, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-PE' });
const p = await ctx.newPage();
const resumen = { usuario: USUARIO, fecha: new Date().toISOString(), notas: [] };

// 1 · Los datos públicos, por el mismo pedido que hace la web de Instagram.
try {
  const r = await p.request.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${USUARIO}`, {
    headers: { 'x-ig-app-id': '936619743392459' },
  });
  resumen.estado_api = r.status();
  if (r.ok()) {
    const u = (await r.json())?.data?.user || {};
    resumen.perfil = {
      nombre: u.full_name, bio: u.biography, enlace: u.external_url, enlaces: (u.bio_links || []).map((l) => l.url),
      categoria: u.category_name, seguidores: u.edge_followed_by?.count, siguiendo: u.edge_follow?.count,
      publicaciones: u.edge_owner_to_timeline_media?.count, destacadas: u.highlight_reel_count,
      es_empresa: u.is_business_account, privada: u.is_private, foto: u.profile_pic_url_hd,
    };
    const edges = u.edge_owner_to_timeline_media?.edges || [];
    resumen.posts = [];
    for (const [i, { node: n }] of edges.entries()) {
      const post = {
        orden: i + 1, tipo: n.__typename, es_video: n.is_video, fecha: new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10),
        texto: n.edge_media_to_caption?.edges?.[0]?.node?.text || '', likes: n.edge_liked_by?.count, comentarios: n.edge_media_to_comment?.count,
        vistas: n.video_view_count, codigo: n.shortcode, fijado: !!n.pinned_for_users?.length,
      };
      resumen.posts.push(post);
      try {
        const img = await p.request.get(n.display_url);
        if (img.ok()) writeFileSync(`${OUT}/posts/${String(i + 1).padStart(2, '0')}.jpg`, await img.body());
      } catch (e) { resumen.notas.push(`miniatura ${i + 1}: ${e.message}`); }
    }
    if (u.profile_pic_url_hd) {
      try { const f = await p.request.get(u.profile_pic_url_hd); if (f.ok()) writeFileSync(`${OUT}/foto-perfil.jpg`, await f.body()); } catch {}
    }
  }
} catch (e) { resumen.notas.push('api: ' + e.message); }

// 2 · La pantalla, como la ve un cliente en el celular.
try {
  await p.goto(`https://www.instagram.com/${USUARIO}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${OUT}/perfil-con-avisos.png` });
  // El aviso de «inicia sesión» tapa el perfil: se cierra si se puede.
  for (const t of ['Ahora no', 'Not now', 'Cerrar', 'Close']) {
    const x = p.getByRole('button', { name: t }).first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {});
  }
  await p.keyboard.press('Escape').catch(() => {});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/perfil.png` });
  await p.screenshot({ path: `${OUT}/perfil-completo.png`, fullPage: true });
  resumen.titulo_pagina = await p.title();
  resumen.texto_visible = (await p.locator('body').innerText()).slice(0, 3000);
} catch (e) { resumen.notas.push('pantalla: ' + e.message); }

writeFileSync(`${OUT}/resumen.json`, JSON.stringify(resumen, null, 2));
console.log(JSON.stringify({ ...resumen, texto_visible: undefined }, null, 2));
await b.close();
