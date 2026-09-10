// SND//WCH — EL BRIEF SEMANAL SE ANCLA A UNA OCASIÓN, Y NO PROMETE LO QUE NO EXISTE
//
// Dos defectos reales que este archivo protege, los dos con modo de fallo SILENCIOSO:
//
// 1. EL TEXTO PROMETÍA UNA PROMO RETIRADA. Decía cuatro veces "en hora valle tu bebida sale
//    gratis" — y la hora valle se retiró por tener contribución negativa, así que
//    `OFFPEAK_DRINK_PROMO_HOURS_LIMA` quedó vacío y no se aplica nunca. El dueño copia eso a
//    Instagram y WhatsApp: es una promesa pública falsa, y nada iba a avisar jamás porque es
//    texto y no cálculo.
//
// 2. LOS BORRADORES CAÍAN EN EL DÍA EN QUE SE TOCÓ EL BOTÓN. El generador sumaba 7 días
//    desde esa fecha, así que generar un domingo dejaba el calendario entero en domingo — y
//    un post de "almuerzo de oficina" un domingo no le habla a nadie.

import { marketingContent, planContentCalendar } from "../supabase/functions/api/actions/admin.ts";

function assertEquals(a: unknown, b: unknown, msg?: string) {
  if (a !== b) throw new Error(msg || `esperaba ${JSON.stringify(b)}, llegó ${JSON.stringify(a)}`);
}
function assert(c: unknown, msg: string) {
  if (!c) throw new Error(msg);
}

Deno.test("ningún texto promete la hora valle mientras la promo esté apagada", () => {
  for (const t of marketingContent()) {
    for (const [campo, txt] of Object.entries({ whatsapp: t.whatsapp, caption: t.caption, video: t.videoIdea })) {
      assert(
        !/hora valle/i.test(String(txt)),
        `el tema "${t.theme}" promete la hora valle en su ${campo}, y esa promo está retirada — ` +
        `es un texto que el dueño copia a Instagram`,
      );
    }
  }
});

// El combo SÍ existe. Su descuento bajó de S/2 a S/1 y nadie revisó los textos, así que
// ahora se interpola: si vuelve a moverse, el texto lo sigue solo.
Deno.test("el descuento del combo se interpola, no se escribe", () => {
  const combo = marketingContent().find((t) => t.theme === "COMBO");
  assert(!!combo, "desapareció el tema del combo");
  assert(/S\/1\b/.test(combo!.whatsapp), "el whatsapp del combo no nombra el descuento real");
  assert(!/S\/2\b/.test(combo!.whatsapp + combo!.caption), "quedó el descuento viejo de S/2 escrito");
});

Deno.test("los 8 temas tienen ocasión, con día y hora", () => {
  const temas = marketingContent();
  assertEquals(temas.length, 8);
  for (const t of temas) {
    assert(!!t.ocasion, `el tema "${t.theme}" no tiene ocasión — no dice a quién le habla`);
    assert(t.ocasion.momento.length > 8, `la ocasión de "${t.theme}" no describe un momento`);
    assert(t.ocasion.dow >= 0 && t.ocasion.dow <= 6, `día de semana inválido en "${t.theme}"`);
    assert(t.ocasion.hora >= 6 && t.ocasion.hora <= 23, `hora poco creíble en "${t.theme}"`);
  }
});

// El corazón del cambio: la fecha se mueve al día que la ocasión pide.
Deno.test("el borrador cae en el día de la semana de su ocasión, no en el día que se generó", () => {
  const temas = marketingContent();
  // 2026-09-13 es un DOMINGO. Antes, generar ese día dejaba las 8 semanas en domingo.
  const salida = planContentCalendar("2026-09-13", 8, temas, 0, new Set());
  assert(salida.length > 0, "no generó nada");
  const dows = new Set<number>();
  for (let i = 0; i < salida.length; i++) {
    const tema = temas[i % temas.length];
    const dow = new Date(salida[i].scheduled_date + "T12:00:00Z").getUTCDay();
    dows.add(dow);
    assertEquals(
      dow, tema.ocasion.dow,
      `"${tema.theme}" quedó en el día ${dow} y su ocasión pide el ${tema.ocasion.dow}`,
    );
  }
  assert(dows.size > 1, "las 8 semanas cayeron en el mismo día — la ocasión no movió nada");
});

// Nunca hacia atrás: correr una fecha al pasado puede dejarla antes de hoy, y un borrador
// para ayer no sirve para nada.
Deno.test("la fecha se adelanta al día de la ocasión, nunca se atrasa", () => {
  const temas = marketingContent();
  for (const inicio of ["2026-09-13", "2026-09-16", "2026-09-19"]) {
    const salida = planContentCalendar(inicio, 8, temas, 0, new Set());
    for (const e of salida) {
      assert(
        e.scheduled_date >= inicio,
        `un borrador quedó en ${e.scheduled_date}, antes de la fecha de inicio ${inicio}`,
      );
    }
  }
});

// La ocasión tiene que LLEGAR al borrador: es lo primero que el dueño lee, y sin ella
// "COMBO" no dice a quién le habla ni cuándo publicarlo.
Deno.test("el título del borrador lleva el momento y cuándo publicarlo", () => {
  const salida = planContentCalendar("2026-09-13", 3, marketingContent(), 0, new Set());
  for (const e of salida) {
    assert(e.title.includes("·"), `el título "${e.title}" no trae la ocasión`);
    assert(/\d{1,2}:00/.test(e.title), `el título "${e.title}" no dice a qué hora publicar`);
  }
});
