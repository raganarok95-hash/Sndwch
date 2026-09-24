// SND//WCH — ESQUEMAS DE ENTRADA (2026-09-24)
//
// Un esquema describe la forma de un dato UNA sola vez y sirve para dos cosas a la vez:
//   · en el servidor, `leer()` valida lo que llegó por la red y lo devuelve ya normalizado;
//   · en los dos lados, `Tipo<typeof esquema>` es el tipo de TypeScript de ese dato.
// Así el tipo y la validación no pueden divergir: son la misma declaración.
//
// Es chico a propósito y sin dependencias: lo importan las edge functions (Deno) y el cliente
// (esbuild), jsr.io está bloqueado por el proxy, y lo que hace falta son siete formas.
//
// ⚠ NORMALIZA EN LA FRONTERA. Un id de dirección llega como número desde la base y como texto
// desde un onclick viejo (`12` y `'12'`): el esquema `idNumerico` acepta los dos y entrega
// SIEMPRE un número. Adentro nadie vuelve a preguntarse de qué tipo es.

export class ErrorDeEntrada extends Error {
  constructor(public ruta: string, mensaje: string) {
    super(mensaje);
  }
}

export type Esquema<T> = { leer(v: unknown, ruta?: string): T };
export type Tipo<E> = E extends Esquema<infer T> ? T : never;

const falla = (ruta: string, msg: string): never => {
  throw new ErrorDeEntrada(ruta, msg);
};

export function texto(opts: { min?: number; max?: number; mensaje?: string } = {}): Esquema<string> {
  const { min = 0, max = 10_000, mensaje } = opts;
  return {
    leer(v, ruta = '') {
      if (typeof v !== 'string') return falla(ruta, mensaje || `${ruta || 'El dato'} tiene que ser texto.`);
      const t = v.trim();
      if (t.length < min) return falla(ruta, mensaje || `Falta ${ruta || 'un dato'}.`);
      if (t.length > max) return falla(ruta, mensaje || `${ruta} es demasiado largo.`);
      return t;
    },
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(mensaje?: string): Esquema<string> {
  return {
    leer(v, ruta = '') {
      if (typeof v !== 'string' || !UUID.test(v.trim())) return falla(ruta, mensaje || `${ruta} no es válido.`);
      return v.trim();
    },
  };
}

export function entero(opts: { min?: number; max?: number; mensaje?: string } = {}): Esquema<number> {
  const { min = -Infinity, max = Infinity, mensaje } = opts;
  return {
    leer(v, ruta = '') {
      const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
      if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
        return falla(ruta, mensaje || `${ruta} no es válido.`);
      }
      return n;
    },
  };
}

/** Un id `bigint` de la base: llega como número o como texto de dígitos, sale número. */
export function idNumerico(mensaje?: string): Esquema<number> {
  return {
    leer(v, ruta = '') {
      const s = typeof v === 'number' ? String(v) : typeof v === 'string' ? v.trim() : '';
      if (!/^\d{1,15}$/.test(s)) return falla(ruta, mensaje || `${ruta} no es válido.`);
      return Number(s);
    },
  };
}

/** Ausente, null o false → false. Cualquier otra cosa que no sea true, rechazada. */
export function bandera(): Esquema<boolean> {
  return {
    leer(v, ruta = '') {
      if (v === undefined || v === null || v === false) return false;
      if (v === true) return true;
      return falla(ruta, `${ruta} tiene que ser sí o no.`);
    },
  };
}

/** Lo que TODAVÍA no tiene esquema propio. Queda a la vista, en vez de esconderse en un `any`. */
export function sinRevisar(): Esquema<unknown> {
  return { leer: (v) => v };
}

/** Ausente o null → null. */
export function nulable<T>(e: Esquema<T>): Esquema<T | null> {
  return { leer: (v, ruta = '') => (v === undefined || v === null || v === '' ? null : e.leer(v, ruta)) };
}

export function lista<T>(e: Esquema<T>, opts: { min?: number; max?: number; mensaje?: string } = {}): Esquema<T[]> {
  const { min = 0, max = 200, mensaje } = opts;
  return {
    leer(v, ruta = '') {
      if (!Array.isArray(v)) return falla(ruta, mensaje || `${ruta} tiene que ser una lista.`);
      if (v.length < min || v.length > max) return falla(ruta, mensaje || `${ruta} no tiene un largo válido.`);
      return v.map((x, i) => e.leer(x, `${ruta}[${i}]`));
    },
  };
}

type Forma = Record<string, Esquema<unknown>>;
type DeForma<F extends Forma> = { [K in keyof F]: Tipo<F[K]> };

/** Devuelve SOLO las claves declaradas: lo que el cliente mande de más no entra. */
export function objeto<F extends Forma>(forma: F): Esquema<DeForma<F>> & { forma: F } {
  return {
    forma,
    leer(v, ruta = '') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return falla(ruta, 'Datos inválidos.');
      const o = v as Record<string, unknown>;
      const r: Record<string, unknown> = {};
      for (const k of Object.keys(forma)) r[k] = forma[k]!.leer(o[k], ruta ? `${ruta}.${k}` : k);
      return r as DeForma<F>;
    },
  };
}
