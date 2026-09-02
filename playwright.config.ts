import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    // Traza y captura SOLO cuando un test falla. Sin esto, una falla que solo ocurre en CI
    // es indiagnosticable: el 2026-08-22 `weekly-plan.spec.ts` falló en el runner de GitHub
    // y pasó 12 de 12 veces en local, y no había con qué averiguar por qué — el
    // error-context.md que dejó Playwright no incluye ni DOM ni red. La traza sí trae
    // snapshots del DOM paso a paso, las peticiones de red y la consola, que es
    // exactamente lo que hace falta para una carrera de temporización.
    // No cuesta nada en verde: no se genera ningún archivo cuando el test pasa.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    },
  },
});
