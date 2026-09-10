// SND//WCH — scripts/check-sistema-visual
// Impide que el sistema visual siga creciendo por acumulación.
//
// ── POR QUÉ EXISTE ──
// Una revisión del 2026-09-10 midió el código y encontró **34 tamaños de letra distintos** y
// **13 radios de borde**. Once de esos valores se usan UNA SOLA VEZ. Eso no es una escala
// tipográfica: es sedimento. Y tener 20, 21 y 22 px a la vez no comunica jerarquía — nadie
// distingue 21 de 22, así que solo la enturbia.
//
// ⚠ ESTE CHEQUEO NO EXIGE CONSOLIDAR, EXIGE NO EMPEORAR. Prohibir de golpe todo lo que está
// fuera de la escala rompería el build y obligaría a un refactor de 30 pantallas en una
// sentada — que es exactamente cómo un chequeo así termina desactivado. Lo que hace es
// congelar lo que HAY: un valor que no estaba, falla; los que ya estaban, pasan.
//
// La lista solo ENCOGE: cada vez que alguien consolida, se borran de acá los valores que
// dejaron de usarse. Así la deuda se paga en el orden que convenga, pero nunca crece.
//
// Modo de fallo de lo que vigila: ninguno visible. Un `font-size:23px` nuevo no rompe nada,
// no da error y no se ve mal en su pantalla. Solo hace que el conjunto se parezca un poco
// menos a un sistema, y eso solo se nota cuando ya hay treinta.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'src/app');

// ── LO QUE HAY HOY ────────────────────────────────────────────────────────────────────
// Congelado el 2026-09-10 midiendo el código, no inventado. Un valor que NO esté acá es
// nuevo, y el chequeo lo señala por su nombre en vez de decir solo "hay uno más" — buscar a
// mano cuál de treinta y cinco es el nuevo es exactamente la fricción que hace que alguien
// suba el techo y siga.
//
// Al consolidar, se BORRAN de esta lista los valores que dejaron de usarse. Nunca se agregan
// para que pase.
const CONOCIDOS = {
  fontSize: ["6","7","8","8.5","9","10","10.5","11","12","13","14","15","16","17","18","19",
             "20","21","22","23","24","25","26","28","30","32","34","36","38","42","44","48","54","72"],
  borderRadius: ["2","3","4","5","6","7","8","10","12","14","16","20","999"],
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
for (const [prop, conocidos] of Object.entries(CONOCIDOS)) {
  const set = new Set(conocidos);
  const nuevos = [...vistos[prop].entries()]
    .filter(([v]) => !set.has(v))
    .map(([v, r]) => `${v}px — ${r.usos} uso${r.usos === 1 ? '' : 's'} en ${[...r.archivos].join(', ')}`);
  if (nuevos.length) {
    // Se ofrece el vecino más cercano: casi siempre el valor nuevo puede ser uno que ya
    // existe, y tenerlo delante ahorra la búsqueda.
    const cerca = [...vistos[prop].entries()]
      .filter(([v]) => set.has(v))
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
  console.error('✗ check:sistema — el sistema visual creció:\n');
  for (const p of problemas) console.error('  · ' + p + '\n');
  console.error(
    'Antes de subir el techo: mira si el valor nuevo puede ser uno que ya existe. Casi\n' +
      'siempre sí — 21px al lado de 20 y 22 no comunica nada que 20 no comunique ya.\n' +
      'Si de verdad hace falta, sube el techo en scripts/check-sistema-visual.mjs Y deja\n' +
      'escrito por qué, igual que con cualquier otra excepción de este repo.',
  );
  process.exit(1);
}

const resumen = Object.entries(CONOCIDOS)
  .map(([p, c]) => `${vistos[p].size} ${p} (de ${c.length} conocidos)`)
  .join(' · ');
console.log(`✓ check:sistema — ningún valor visual nuevo: ${resumen}`);
