// SND//WCH — _shared/paleta
// Los colores de la app para lo que NO puede leer las variables CSS de `src/shell.html`:
// los correos (un cliente de correo no resuelve `var(--sw-x)`), el prompt de video y
// cualquier HTML que arme el servidor.
//
// POR QUÉ EXISTE (2026-09-24). El front se rehízo con una paleta casi negra el 2026-09-16 y
// todos los correos siguieron saliendo en el verde de la app anterior: 45 colores escritos a
// mano en siete funciones, y `check:colores` solo miraba `src/`. El cliente abría la app en
// una marca y recibía el correo en otra.
//
// Cada clave es el nombre del token de `shell.html` sin el `--sw-` (el bloque `:root`, el lado
// de SANDO), y `check:colores` compara valor por valor: si el token cambia allá y no acá, falla.
// `oro` es la barra de SANDO del «//» (`.wm-mark i:first-child`), que no tiene token propio.
export const PALETA = {
  bg: "#0F1A14",
  card: "#16241D",
  card2: "#122019",
  border: "#25382D",
  text: "#FFFFFF",
  "text-body": "#EFEDE4",
  "text-muted": "#9DA096",
  "text-muted2": "#868A7E",
  "text-muted3": "#73776C",
  ok: "#25D366",
  warn: "#ffa500",
  danger: "#ff8888",
  oro: "#CBA258",
  sky: "#8CC8EC",
} as const;
