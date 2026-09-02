import { test, expect } from '@playwright/test';
import { gotoApp, OPEN_ALL_DAY_HOURS } from './helpers';

// #23 / #24 / #16 — Capacidad por franja y estimado de entrega que mira la cola.
//
// El tope por hora existía SOLO en el servidor (`assertHourCapacity`): el cliente ofrecía
// todas las franjas por igual y el rechazo llegaba al tocar PAGAR, con el sándwich armado
// y la dirección escrita. Es el mismo defecto que ya obligó a poner el selector de
// distrito — la restricción existía y la única forma de descubrirla era chocar con ella.
//
// Y el estimado que se ve antes de pagar era un rango fijo (25-40 min) ciego a la cola: con
// pedidos por delante prometía lo mismo que con la cocina vacía. Un ETA que miente es la
// causa directa de una calificación de 1 estrella.
//
// La "reapertura automática" (#24) no se prueba como un evento porque no lo es: la
// capacidad se calcula en vivo contra la hora actual, así que una franja deja de estar
// llena sola cuando el reloj la pasa. Lo que sí se fija acá es que no queda ningún estado
// pegajoso — sin `fullHours` del servidor no se apaga nada.

// Hora fija dentro de cada test: la capacidad se compara por INICIO DE HORA, así que sin
// reloj fijo la franja marcada como llena se movería sola a mitad de prueba.
const HOY_14 = new Date();
HOY_14.setHours(14, 5, 0, 0);

function inicioDeHora(h: number) {
  const d = new Date(HOY_14);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

const horas = (extra: Record<string, unknown>) => ({
  'get-store-hours': { hours: OPEN_ALL_DAY_HOURS, businessLaunched: true, ...extra },
});

async function armarSandwich(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await page.locator('#o-nom').fill('Cliente Capacidad');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Jr. Pizarro 456, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
}

test('el estimado de entrega suma la cola, no promete la cocina vacía', async ({ page }) => {
  await page.clock.setFixedTime(HOY_14);
  // 3 pedidos por delante × 5 min = +15 sobre el rango base 25-40.
  await gotoApp(page, horas({ queueAhead: 3, queueMinutesPerOrder: 5, maxPerHour: 10, fullHours: [] }));
  await expect(page.locator('text=/40-55 min/').first()).toBeVisible();
});

test('sin cola, el estimado es exactamente el de siempre', async ({ page }) => {
  await page.clock.setFixedTime(HOY_14);
  await gotoApp(page, horas({ queueAhead: 0, fullHours: [] }));
  await expect(page.locator('text=/25-40 min/').first()).toBeVisible();
});

test('si el servidor no manda capacidad, no se infla nada ni se apaga nada', async ({ page }) => {
  // El peor caso de una respuesta incompleta tiene que ser volver al comportamiento
  // anterior, nunca inventar una demora ni bloquear franjas que sí están libres.
  await page.clock.setFixedTime(HOY_14);
  await gotoApp(page, horas({}));
  await expect(page.locator('text=/25-40 min/').first()).toBeVisible();
  await armarSandwich(page);
  await page.locator('[onclick*="scheduleMode=\'later\'"]').click();
  await expect(page.locator('div[title="Esa hora ya está llena"]')).toHaveCount(0);
});

test('una franja llena se muestra tachada y no se puede elegir', async ({ page }) => {
  await page.clock.setFixedTime(HOY_14);
  await gotoApp(page, horas({ queueAhead: 0, fullHours: [inicioDeHora(16)] }));
  await armarSandwich(page);
  await page.locator('[onclick*="scheduleMode=\'later\'"]').click();

  // La franja llena se sigue MOSTRANDO (esconderla dejaría un hueco inexplicable en la
  // lista de horas), pero apagada, tachada y sin onclick.
  const llena = page.locator('div[title="Esa hora ya está llena"]').filter({ hasText: '16:00' });
  await expect(llena).toHaveCount(1);
  await expect(llena).toHaveAttribute('style', /line-through/);
  await expect(llena).not.toHaveAttribute('onclick', /./);

  // Y se explica por qué, en vez de dejar al cliente adivinando.
  await expect(page.locator('text=/ya están completas/')).toBeVisible();

  // Otra hora del mismo día sigue siendo elegible: la capacidad es por franja, no un
  // apagón de la tienda entera.
  await expect(page.locator('[onclick*="pickSchedSlot(\'17:00\')"]')).toHaveCount(1);
});

test('la franja llena no queda preseleccionada por defecto', async ({ page }) => {
  // Si el default cayera en una hora llena, el cliente la pagaría sin haberla elegido y el
  // servidor lo rechazaría con la tarjeta ya metida.
  await page.clock.setFixedTime(HOY_14);
  await gotoApp(page, horas({ queueAhead: 0, fullHours: [inicioDeHora(14), inicioDeHora(15)] }));
  await armarSandwich(page);
  await page.locator('[onclick*="scheduleMode=\'later\'"]').click();
  const elegido = await page.locator('#o-sched').inputValue();
  expect(elegido).toBeTruthy();
  expect(new Date(elegido).getHours()).toBeGreaterThanOrEqual(16);
});

test('un pedido AHORA con la hora actual llena avisa antes de la pantalla de pago', async ({ page }) => {
  await page.clock.setFixedTime(HOY_14);
  const calls = await gotoApp(page, horas({ queueAhead: 0, fullHours: [inicioDeHora(14)] }));
  await armarSandwich(page);
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();

  // #25 — El mensaje no solo dice que no se puede: NOMBRA la siguiente franja libre y la
  // deja a un toque. Rechazar sin alternativa manda al cliente a adivinar cuándo volver, y
  // la mayoría no vuelve.
  await expect(page.locator('#o-err')).toContainText('Esta hora ya está completa');
  await expect(page.locator('#o-err')).toContainText('La más cercana libre es');
  await expect(page.locator('#o-alt-slot button')).toBeVisible();
  // Y sobre todo: el pedido NUNCA se manda. Antes esto llegaba al servidor y volvía 409.
  expect(calls.filter((c) => c.action === 'place-order')).toHaveLength(0);

  // El botón no es decorativo: deja el pedido programado en esa franja, listo para pagar.
  await page.locator('#o-alt-slot button').click();
  await expect(page.locator('#o-sched')).toHaveCount(1);
  const elegido = await page.locator('#o-sched').inputValue();
  expect(elegido).toBeTruthy();
});
