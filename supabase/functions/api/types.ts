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

// Antes cada acción que recibe un correo (actRegister, actSubmitComplaint) repetía su
// propia copia de este regex — dos copias que inevitablemente terminarían divergiendo
// (hallazgo de la auditoría de código).
const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
