// SND//WCH — api / entrada
// La frontera: lo que llega por la red se valida contra el contrato (_shared/contrato.ts) ANTES
// de tocar ninguna acción. Vive aparte de index.ts —que arranca el servidor al importarse—
// para poder probarlo solo (tests-api/contrato.test.ts).
import { CONTRATO, type Accion } from "../_shared/contrato.ts";
import { ErrorDeEntrada } from "../_shared/esquema.ts";
import { ApiError } from "./types.ts";

export function tieneContrato(accion: string): accion is Accion {
  return Object.prototype.hasOwnProperty.call(CONTRATO, accion);
}

/** Lo que recibe la acción: SOLO los campos del contrato, ya normalizados, más la IP. Una acción
 *  sin contrato todavía recibe el cuerpo tal cual (y lo sigue validando a mano). */
export function validarEntrada(accion: string, cuerpo: Record<string, unknown>, ip: string): Record<string, unknown> {
  if (!tieneContrato(accion)) return { ...cuerpo, _ip: ip };
  try {
    const leido = CONTRATO[accion].entrada.leer(cuerpo) as Record<string, unknown>;
    return { ...leido, _ip: ip };
  } catch (err) {
    if (err instanceof ErrorDeEntrada) throw new ApiError(err.message, 400);
    throw err;
  }
}
