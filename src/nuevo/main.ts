// LA ENTRADA DE LA BASE NUEVA (2026-09-24).
//
// esbuild empaqueta este archivo y todo lo que importa en un solo script que corre ANTES que el
// código viejo (ver scripts/build.mjs). Lo único que deja en `window` es este registro: el
// router viejo le pregunta si una pantalla ya migró y, si es así, le entrega un contenedor para
// que la pinte. También deja el DINERO: el cliente viejo calcula precios con el mismo módulo
// que el servidor (ver dinero.ts). Nada más de lo nuevo es global.
import { dinero } from './dinero';
import { abrir as abrirFijo, pantallaFijo } from './pantallas/fijo';

export type PantallaNueva = { pintar(el: HTMLElement): void };

const registro: {
  pantallas: Record<string, PantallaNueva>;
  fijo: { abrir: (id?: string) => Promise<void> };
  dinero: typeof dinero;
} = {
  pantallas: { p_recurring: pantallaFijo },
  fijo: { abrir: abrirFijo },
  dinero,
};

(window as unknown as { __sndNuevo: typeof registro }).__sndNuevo = registro;
