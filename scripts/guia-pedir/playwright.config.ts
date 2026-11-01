import { defineConfig } from '@playwright/test';
// Solo para sacar las capturas de la guía «Cómo pedir» (no es una prueba: no corre en la suite).
export default defineConfig({
  testDir: '.',
  reporter: 'list',
  timeout: 120000,
  use: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' },
  },
});
