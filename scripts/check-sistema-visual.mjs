// SND//WCH — scripts/check-sistema-visual
// Impide que el sistema visual siga creciendo por acumulación.
//
// ── POR QUÉ EXISTE ──
// Una revisión del 2026-09-10 midió el código y encontró **34 tamaños de letra distintos** y
// **13 radios de borde**. Once de esos valores se usan UNA SOLA VEZ. Eso no es una escala
// tipográfica: es sedimento. Y tener 20, 21 y 22 px a la vez no comunica jerarquía — nadie
// distingue 21 de 22, así que solo la enturbia.
//
// Ahora que la consolidación está hecha, este chequeo la SOSTIENE: un valor fuera de la
// escala falla, señalado por su nombre y su archivo, con el vecino que ya existe sugerido.
// Sin esto, la escala vuelve a 34 valores en unos meses — nadie agrega un tamaño nuevo a
// propósito, se agrega porque en ese momento "se veía mejor así".
//
// Modo de fallo de lo que vigila: ninguno visible. Un `font-size:23px` nuevo no rompe nada,
// no da error y no se ve mal en su pantalla. Solo hace que el conjunto se parezca un poco
// menos a un sistema, y eso solo se nota cuando ya hay treinta.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'src/app');

// ── LA ESCALA ─────────────────────────────────────────────────────────────────────────
// Consolidada el 2026-09-11: de 34 tamaños de letra a 11 y de 13 radios a 6, migrando 522
// usos. Ya no es "lo que hay congelado": es una ESCALA, y lo que no esté en ella falla.
//
// ⚠ SE CONSTRUYÓ SOBRE EL USO REAL, no sobre un ratio elegido a ojo: los valores con
// cientos de usos son anclas y arrastran a sus vecinos, no al revés.
//
// ⚠ Y EN EMPATE, SUBE. Un valor a la misma distancia de dos pasos va al MAYOR. La primera
// versión hacía lo contrario y el cuerpo de texto bajaba de 12 a 11px: consistencia ganada
// a cambio de legibilidad, en una app de comida que se usa en un celular. Con esta regla
// 415 usos suben de tamaño y solo 74 bajan. **El texto que lee el cliente nunca puede
// achicarse por un refactor interno.**
//
// Los tres pasos grandes (40/56/72) son display —el hero del wordmark, el número de puntos,
// el check de entrega confirmada— y no pertenecen a la escala de texto: están acá para que
// tampoco crezcan sin querer, no porque se usen seguido.
const ESCALA = {
  fontSize: [8, 9, 11, 13, 15, 18, 22, 28, 40, 56, 72],
  borderRadius: [4, 8, 10, 12, 20, 999],
};

const PROPS = {
  fontSize: /font-size:([\d.]+)px/g,
  borderRadius: /border-radius:([\d.]+)px/g,
};

const vistos = { fontSize: new Map(), borderRadius: new Map() };
for (const f of readdirSync(APP).filter((x) => x.endsWith('.ts'))) {
  const src = readFileSync(join(APP, f), 'utf8');
  for (const [prop, re] of Object.entries(PROPS)) {
    for (const m of src.matchAll(re)) {
      const v = m[1];
      const reg = vistos[prop].get(v) || { usos: 0, archivos: new Set() };
      reg.usos++;
      reg.archivos.add(f);
      vistos[prop].set(v, reg);
    }
  }
}

const problemas = [];
for (const [prop, conocidos] of Object.entries(ESCALA)) {
  const set = new Set(conocidos);
  const nuevos = [...vistos[prop].entries()]
    .filter(([v]) => !set.has(Number(v)))
    .map(([v, r]) => `${v}px — ${r.usos} uso${r.usos === 1 ? '' : 's'} en ${[...r.archivos].join(', ')}`);
  if (nuevos.length) {
    // Se ofrece el vecino más cercano: casi siempre el valor nuevo puede ser uno que ya
    // existe, y tenerlo delante ahorra la búsqueda.
    const cerca = [...vistos[prop].entries()]
      .filter(([v]) => set.has(Number(v)))
      .map(([v, r]) => ({ v: Number(v), usos: r.usos }));
    const sugerir = (v) => {
      const n = Number(v);
      const c = cerca.filter((x) => x.usos >= 5).sort((a, b) => Math.abs(a.v - n) - Math.abs(b.v - n))[0];
      return c ? ` → ¿puede ser ${c.v}px, que ya se usa ${c.usos} veces?` : '';
    };
    problemas.push(
      `${prop}: ${nuevos.length} valor(es) que no estaban:\n      · ` +
        nuevos.map((t) => t + sugerir(t.split('px')[0])).join('\n      · '),
    );
  }
}

if (problemas.length) {
  console.error('✗ check:sistema — hay valores fuera de la escala:\n');
  for (const p of problemas) console.error('  · ' + p + '\n');
  console.error(
    'Casi siempre el valor nuevo puede ser uno de la escala: 21px al lado de 20 y 22 no\n' +
      'comunica nada que 22 no comunique ya, y un texto 1px más chico no es una decisión de\n' +
      'diseño, es ruido.\n\n' +
      'Si de verdad hace falta un paso nuevo, agrégalo a ESCALA en este archivo Y deja escrito\n' +
      'por qué — pero antes mira si el paso que buscas ya existe con otro nombre. La escala se\n' +
      'construyó sobre el uso real de 1070 declaraciones; que falte algo es poco probable.',
  );
  process.exit(1);
}

const resumen = Object.entries(ESCALA)
  .map(([p, c]) => `${vistos[p].size}/${c.length} ${p}`)
  .join(' · ');
console.log(`✓ check:sistema — todo dentro de la escala (${resumen})`);
