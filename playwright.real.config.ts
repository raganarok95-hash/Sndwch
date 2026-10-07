import { defineConfig, devices } from '@playwright/test';

// El recorrido contra el sitio real (tests-real/). Corre en GitHub (.github/workflows/recorrido-real.yml):
// el proxy de las sesiones bloquea sndwch.app.
export default defineConfig({
  testDir: './tests-real',
  timeout: 180000,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: process.env.SITIO || 'https://sndwch.app',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    // En GitHub se usa el Chromium que instala Playwright; en una sesión, el del contenedor.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
});
