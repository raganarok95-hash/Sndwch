// SND//WCH — api / types
// Tipos y la clase de error compartidos entre todos los módulos del backend.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type SessionPayload = { phone: string; isAdmin: boolean; exp: number; v: number };
