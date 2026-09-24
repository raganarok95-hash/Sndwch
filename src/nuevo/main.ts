// LA ENTRADA DE LA BASE NUEVA (2026-09-24).
//
// esbuild empaqueta este archivo y todo lo que importa en un solo script que corre ANTES que el
// código viejo (ver scripts/build.mjs). Lo único que deja en `window` es este registro: el
// router viejo le pregunta si una pantalla ya migró y, si es así, le entrega un contenedor para
// que la pinte. Nada más de lo nuevo es global.
import { abrir as abrirFijo, pantallaFijo } from './pantallas/fijo';

export type PantallaNueva = { pintar(el: HTMLElement): void };

const registro: { pantallas: Record<string, PantallaNueva>; fijo: { abrir: (id?: string) => Promise<void> } } = {
  pantallas: { p_recurring: pantallaFijo },
  fijo: { abrir: abrirFijo },
};

(window as unknown as { __sndNuevo: typeof registro }).__sndNuevo = registro;
