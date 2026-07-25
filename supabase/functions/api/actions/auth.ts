// SND//WCH — api / actions/auth
// Registro, login, verificación de sesión, cierre de sesión en todos los dispositivos,
// borrado de cuenta y recuperación de PIN.
import { REFERRAL_BONUS_POINTS, WELCOME_BONUS_POINTS, TOKEN_TTL_SECONDS, GOOGLE_CLIENT_ID } from "../env.ts";
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError, isValidEmail } from "../types.ts";
import {
  signToken, safeCustomer, verifyToken, verifyActiveSession, requireSession, fetchIsAdmin,
  loginLockoutRemainingMinutes, registerLoginFailure, resetLoginAttempts,
} from "../session.ts";
import { sendRecoveryEmail, maskEmail } from "../email.ts";

// Verifica un id_token de Google Identity Services contra el propio endpoint de Google
// (tokeninfo) en vez de validar la firma RS256/JWKS localmente — mismo criterio que
// verifyCulqiCharge (orders.ts): confiar en que el proveedor ya validó su propio token es
// más simple y no menos seguro que reimplementar la verificación de firma acá. El `aud`
// debe coincidir con GOOGLE_CLIENT_ID para asegurar que el token fue emitido para ESTA
// app y no para otra que también use Sign in with Google.
async function verifyGoogleIdToken(idToken: string): Promise<{ sub: string; email: string | null; name: string | null } | null> {
  if (!GOOGLE_CLIENT_ID || !idToken) return null;
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (data.aud !== GOOGLE_CLIENT_ID || !data.sub) return null;
    return { sub: String(data.sub), email: data.email ? String(data.email) : null, name: data.name ? String(data.name) : null };
  } catch {
    return null;
  }
}

// Entrada de "Continuar con Google": si el sub de Google ya está vinculado a una cuenta,
// inicia sesión directo; si no, NO crea cuenta acá — devuelve needsRegistration para que
// el cliente complete nombre/teléfono/PIN/DNI en el formulario normal (ver actRegister),
// que es donde de verdad se exige el DNI. Google nunca reemplaza ese registro, solo lo
// pre-llena con nombre/correo.
export async function actGoogleAuth(b: any) {
  const idToken = String(b.idToken || "").trim();
  if (!idToken) throw new ApiError("Falta el token de Google.");
  const info = await verifyGoogleIdToken(idToken);
  if (!info) throw new ApiError("No se pudo verificar tu cuenta de Google. Intenta de nuevo.", 401);

  const rows = await sbGet("customers", `google_id=eq.${encodeURIComponent(info.sub)}`);
  if (rows.length) {
    const row = rows[0];
    const isAdmin = await fetchIsAdmin(row.phone);
    const token = await signToken({ phone: row.phone, isAdmin, exp: Date.now() / 1000 + TOKEN_TTL_SECONDS, v: row.session_version || 1 });
    return { customer: safeCustomer(row), isAdmin, token };
  }
  return { needsRegistration: true, prefill: { name: info.name || "", email: info.email || "" } };
}

export async function actRegister(b: any) {
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const pin = String(b.pin || "").trim();
  const email = b.email ? String(b.email).trim() : null;
  const dni = String(b.dni || "").trim();
  const bday = String(b.bday || "").trim();
  const referredBy = b.referredBy ? String(b.referredBy).trim() : null;
  // Si el registro viene de "Continuar con Google" (ver actGoogleAuth), el cliente manda
  // de vuelta el MISMO id_token que ya se verificó ahí — se vuelve a verificar acá (nunca
  // se confía en un google_id que mande el cliente directamente) para no depender de que
  // ambas llamadas ocurran en la misma sesión de servidor. DNI/teléfono/PIN se validan
  // exactamente igual que cualquier otro registro; esto solo añade el vínculo de cuenta.
  let googleId: string | null = null;
  if (b.googleIdToken) {
    const info = await verifyGoogleIdToken(String(b.googleIdToken).trim());
    if (!info) throw new ApiError("Tu sesión de Google expiró. Vuelve a intentar con el botón de Google.", 401);
    googleId = info.sub;
  }
  // Origen de campaña paga (?src=... en el link del anuncio, ver captura en el cliente) —
  // distinto de referredBy (referido entre clientes). Se acota a 60 caracteres porque es
  // texto que viene de un query param, nunca algo que el negocio necesite validar contra
  // una lista fija de canales.
  const acquisitionSource = b.acquisitionSource ? String(b.acquisitionSource).trim().slice(0, 60) : null;

  if (!name || !phone || pin.length < 4) throw new ApiError("Completa nombre, teléfono y PIN (mínimo 4 dígitos).");
  // Mismo mínimo que ya exige el teléfono de CONTACTO en el checkout del lado cliente
  // (src/app.ts, doOrder) — el teléfono de CUENTA (login + código de referido) no
  // validaba ningún formato en ningún lado, ni cliente ni servidor (hallazgo de auditoría
  // UX, ALTO).
  if (phone.replace(/\D/g, "").length < 6) throw new ApiError("Ingresa un teléfono válido.");
  if (!/^\d{8}$/.test(dni)) throw new ApiError("DNI es obligatorio y debe tener 8 dígitos.");
  // Obligatoria (antes opcional) — ver el mismo cambio en doReg/sPAuth (src/app.ts): sin
  // esto, actRecover (recuperar PIN) nunca podía coincidir contra una cuenta con
  // birthday=null, dejándola sin ninguna vía de recuperación (hallazgo de auditoría UX,
  // CRÍTICO).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bday)) throw new ApiError("Fecha de nacimiento es obligatoria y debe ser válida.");
  if (email && !isValidEmail(email)) throw new ApiError("Correo inválido.");

  // Antes eran 2 consultas secuenciales a la misma tabla — un solo `or=()` cubre ambos
  // chequeos de duplicado en un round-trip. El lookup de referido no depende de este
  // resultado, así que corre en paralelo en vez de después.
  const dupeFilter = googleId
    ? `or=(phone.eq.${encodeURIComponent(phone)},dni.eq.${encodeURIComponent(dni)},google_id.eq.${encodeURIComponent(googleId)})&select=phone,dni,google_id`
    : `or=(phone.eq.${encodeURIComponent(phone)},dni.eq.${encodeURIComponent(dni)})&select=phone,dni,google_id`;
  const [dupes, referrerRows] = await Promise.all([
    sbGet("customers", dupeFilter),
    referredBy && referredBy !== phone
      ? sbGet("customers", `referral_code=eq.${encodeURIComponent(referredBy)}&select=phone`)
      : Promise.resolve([]),
  ]);
  if (dupes.some((c: any) => c.phone === phone)) throw new ApiError("Ya existe una cuenta con ese teléfono.", 409);
  if (dupes.some((c: any) => c.dni === dni)) throw new ApiError("Ya existe una cuenta con ese DNI.", 409);
  if (googleId && dupes.some((c: any) => c.google_id === googleId)) throw new ApiError("Esa cuenta de Google ya está vinculada a otro cliente.", 409);

  let referredByValid: string | null = null;
  if (referrerRows.length) referredByValid = referrerRows[0].phone;

  const hashed = await rpc("hash_pin", { plain: pin });
  const rows = await sbInsert("customers", {
    phone,
    name,
    pin: hashed,
    email,
    dni,
    birthday: bday,
    points: WELCOME_BONUS_POINTS,
    pending_points: 0,
    total_orders: 0,
    total_redeemed: 0,
    referral_code: phone,
    referred_by: referredByValid,
    acquisition_source: acquisitionSource,
    google_id: googleId,
  });
  let customer = safeCustomer(rows[0]);
  // Bono de bienvenida para TODO registro nuevo (antes solo quien llegaba con un código de
  // referido recibía puntos al crear cuenta) — se registra en el historial igual que
  // cualquier otro ingreso de puntos, no solo se suma en silencio.
  await sbInsert("transactions", {
    customer_phone: phone,
    type: "earn_confirmed",
    points: WELCOME_BONUS_POINTS,
    description: "Bono de bienvenida",
    confirmed: true,
  });

  // Vincula el pedido de invitado que originó este registro (botón "CREAR CUENTA Y GANAR
  // PUNTOS POR ESTE PEDIDO" en la confirmación) — antes esto solo creaba la cuenta sin
  // tocar el pedido, así que el cliente nunca recibía los puntos que la propia app le
  // prometía. El `ref` (incluye un componente aleatorio, ver oref() en el cliente) es la
  // misma prueba de acceso que ya usan my-orders/submit-rating para invitados, y el filtro
  // customer_phone=is.null evita "robar" un pedido que ya tiene dueño.
  const claimOrderRef = b.claimOrderRef ? String(b.claimOrderRef).trim().slice(0, 40) : null;
  if (claimOrderRef) {
    try {
      const orderRows = await sbGet(
        "orders",
        `ref=eq.${encodeURIComponent(claimOrderRef)}&customer_phone=is.null&select=id,ref,total,payment_status,customer_address`,
      );
      const order = orderRows[0];
      if (order) {
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { customer_phone: phone });
        if (order.payment_status === "paid") {
          // El pedido de invitado ya estaba pagado (tarjeta) y nunca pasó por
          // finalize_order_customer_update en su momento (no había phone/custRow) — se
          // otorgan los puntos retroactivamente ahora que se sabe a quién pertenece. Si en
          // cambio quedó "pending" (Yape/Plin), basta con haber asignado customer_phone:
          // confirmManualPayment ya funciona sola cuando el admin confirme el pago.
          const updated = await rpc("finalize_order_customer_update", {
            p_phone: phone,
            p_points_delta: order.total,
            p_credit_delta: 0,
            p_total_orders_delta: 1,
            p_last_address: order.customer_address,
            p_total_redeemed_delta: 0,
            p_referrer_phone: referredByValid,
            p_referral_bonus: referredByValid ? REFERRAL_BONUS_POINTS : 0,
          });
          customer = safeCustomer(updated);
          const claimAuditInserts: Promise<unknown>[] = [
            sbInsert("transactions", {
              customer_phone: phone,
              type: "earn_confirmed",
              points: order.total,
              description: "Pedido SND//WCH (vinculado tras crear cuenta)",
              order_ref: order.ref,
              confirmed: true,
            }),
          ];
          if (referredByValid) {
            claimAuditInserts.push(sbInsert("transactions", { customer_phone: phone, type: "earn_confirmed", points: REFERRAL_BONUS_POINTS, description: "Bono por referido", confirmed: true }));
            claimAuditInserts.push(sbInsert("transactions", { customer_phone: referredByValid, type: "earn_confirmed", points: REFERRAL_BONUS_POINTS, description: "Bono por invitar a " + name, confirmed: true }));
          }
          await Promise.all(claimAuditInserts);
        }
      }
    } catch (e) {
      // Vincular el pedido es un plus — nunca debe hacer fallar la creación de la cuenta.
      console.error("claimOrderRef failed:", e);
    }
  }

  const token = await signToken({ phone, isAdmin: false, exp: Date.now() / 1000 + TOKEN_TTL_SECONDS, v: rows[0].session_version || 1 });
  return { customer, isAdmin: false, token };
}

export async function actLogin(b: any) {
  const phone = String(b.phone || "").trim();
  const pin = String(b.pin || "").trim();
  if (!phone || !pin) throw new ApiError("Ingresa teléfono y PIN.");

  // El chequeo de bloqueo va ANTES de saber si la cuenta existe, y con el mismo mensaje
  // para ambos casos — así un teléfono sin cuenta y uno con cuenta bloqueada responden
  // idéntico (ver el comentario en loginLockoutRemainingMinutes).
  const remaining = await loginLockoutRemainingMinutes(phone);
  if (remaining !== null) throw new ApiError(`Demasiados intentos fallidos. Intenta de nuevo en ${remaining} min.`, 429);

  // customers y admin_accounts no dependen entre sí (ambos solo necesitan `phone`) — se
  // piden juntos y el resultado de admin_accounts simplemente no se usa si el login falla.
  const [rows, isAdminEarly] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(phone)}`),
    fetchIsAdmin(phone),
  ]);
  if (!rows.length) {
    await registerLoginFailure(phone);
    throw new ApiError("Teléfono o PIN incorrecto.", 401);
  }
  const row = rows[0];
  const ok = await rpc("verify_pin", { p_phone: phone, plain: pin });
  if (!ok) {
    await registerLoginFailure(phone);
    throw new ApiError("Teléfono o PIN incorrecto.", 401);
  }
  await resetLoginAttempts(phone);
  const token = await signToken({ phone, isAdmin: isAdminEarly, exp: Date.now() / 1000 + TOKEN_TTL_SECONDS, v: row.session_version || 1 });
  return { customer: safeCustomer(row), isAdmin: isAdminEarly, token };
}

export async function actSessionCheck(b: any) {
  // Igual que requireAdmin: verifyToken es local (sin I/O), así que customers y
  // admin_accounts pueden pedirse en paralelo en vez de en serie.
  const payload = await verifyToken(b.token);
  if (!payload) return { valid: false };
  const [rows, isAdmin] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(payload.phone)}`),
    fetchIsAdmin(payload.phone),
  ]);
  const row = rows[0];
  if (!row || (row.session_version || 1) !== (payload.v || 1)) return { valid: false };
  return { valid: true, customer: safeCustomer(row), isAdmin };
}

export async function actLogoutEverywhere(b: any) {
  // verifyActiveSession ya trae la fila de customers — reusarla evita pedirla de nuevo.
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  const current = active.row.session_version || 1;
  await sbUpdate("customers", `phone=eq.${encodeURIComponent(active.payload.phone)}`, { session_version: current + 1 });
  return { success: true };
}

// Borrado de cuenta a pedido del cliente (antes no existía ningún camino para esto —
// solo un borrado manual del dueño en la base de datos). Pide el PIN de nuevo (no solo
// el token de sesión) para que un token filtrado/robado no baste para una acción
// irreversible. Los pedidos/transacciones/calificaciones se ANONIMIZAN en vez de
// borrarse — el negocio conserva sus cifras de ventas/historial, pero sin ningún dato
// que identifique a esta persona; lo estrictamente personal (direcciones, favoritos,
// suscripciones push, movimientos de crédito) sí se borra por completo.
export async function actDeleteAccount(b: any) {
  const s = await requireSession(b.token);
  const pin = String(b.pin || "").trim();
  if (!pin) throw new ApiError("Ingresa tu PIN para confirmar.", 400);
  const ok = await rpc("verify_pin", { p_phone: s.phone, plain: pin });
  if (!ok) throw new ApiError("PIN incorrecto.", 401);

  await Promise.all([
    sbDelete("saved_addresses", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("favorites", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("push_subscriptions", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("credit_ledger", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    // transactions.customer_phone es NOT NULL + FK a customers.phone — a diferencia de
    // orders/ratings (ambas nullable) no se puede anonimizar con null, así que el ledger
    // personal se borra por completo en vez de conservarse sin identificar (mismo criterio
    // que direcciones/favoritos: es dato estrictamente personal, no una cifra de negocio).
    sbDelete("transactions", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    // Antes esta era la única tabla con datos personales (nombre/correo/dirección) que
    // actDeleteAccount no tocaba — una reserva de pago vieja (ya consumida/expirada/
    // cancelada) podía dejar esos datos vivos indefinidamente después de que el cliente
    // pidió borrar su cuenta (hallazgo de la re-auditoría legal/datos). Se borra por
    // completo, igual que direcciones/favoritos: es dato estrictamente personal.
    sbDelete("pending_charges", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbUpdate("orders", `customer_phone=eq.${encodeURIComponent(s.phone)}`, {
      customer_phone: null,
      customer_name: "Cuenta eliminada",
      customer_email: null,
      customer_address: "Eliminada",
    }),
    sbUpdate("ratings", `customer_phone=eq.${encodeURIComponent(s.phone)}`, { customer_phone: null }),
  ]);
  await sbDelete("customers", `phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

// Compara dos fechas de nacimiento tolerando que estén guardadas en formatos distintos
// (YYYY-MM-DD, el que manda el cliente hoy, vs. DD/MM/AAAA, el que quedó guardado en
// cuentas creadas antes de ese cambio) — antes esto era un === estricto de strings, que
// bloqueaba la recuperación de cuentas viejas aunque el cliente ingresara la fecha
// correcta, porque nunca coincidían byte a byte.
function birthdaysMatch(stored: string, input: string): boolean {
  if (!stored || !input) return false;
  if (stored === input) return true;
  const norm = (s: string): string | null => {
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return null;
  };
  const a = norm(stored);
  const c = norm(input);
  return !!a && !!c && a === c;
}

export async function actRecover(b: any) {
  const phone = String(b.phone || "").trim();
  const dni = String(b.dni || "").trim();
  const bday = String(b.bday || "").trim();
  if (!phone || !dni || !bday) throw new ApiError("Completa teléfono, DNI y fecha de nacimiento.");

  // Mismo mecanismo de bloqueo por teléfono que actLogin (comparten la tabla
  // login_attempts) — el chequeo va antes de saber si la cuenta existe, y responde
  // idéntico en ambos casos.
  const remaining = await loginLockoutRemainingMinutes(phone);
  if (remaining !== null) throw new ApiError(`Demasiados intentos fallidos. Intenta de nuevo en ${remaining} min.`, 429);

  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}`);
  if (!rows.length) {
    await registerLoginFailure(phone);
    throw new ApiError("No encontramos una cuenta con esos datos exactos.", 404);
  }
  const row = rows[0];
  const match = row.dni === dni && birthdaysMatch(row.birthday, bday);
  if (!match) {
    await registerLoginFailure(phone);
    throw new ApiError("No encontramos una cuenta con esos datos exactos.", 404);
  }
  await resetLoginAttempts(phone);
  const newPin = String(Math.floor(1000 + Math.random() * 9000));
  const hashed = await rpc("hash_pin", { plain: newPin });
  await sbUpdate("customers", `phone=eq.${encodeURIComponent(phone)}`, { pin: hashed, session_version: (row.session_version || 1) + 1 });
  // DNI + fecha de nacimiento no son secretos fuertes (a veces se filtran/son semi-públicos
  // en Perú) — si el cliente tiene correo registrado, el PIN nuevo se manda ahí en vez de
  // devolverlo aquí, para que quien solo tenga esos dos datos no pueda ver el PIN
  // directamente en la respuesta. Sin correo en el perfil no hay otro canal disponible
  // todavía, así que se mantiene el comportamiento anterior (mostrarlo en la app).
  if (row.email) {
    const sent = await sendRecoveryEmail(row.email, row.name, newPin);
    if (sent) return { success: true, name: row.name, emailSent: true, emailMasked: maskEmail(row.email) };
  }
  return { success: true, newPin, name: row.name, emailSent: false };
}
