import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — api
// Punto único de acceso a datos sensibles (clientes, pedidos, transacciones, cuentas admin).
// Usa la SERVICE_ROLE key (nunca expuesta al navegador) porque esas tablas ahora tienen
// RLS activado sin políticas para anon — solo este endpoint (o el dueño desde el dashboard
// de Supabase) puede leer o escribir en ellas.
//
// Este archivo es solo el entrypoint (CORS + tabla de acciones + el handler HTTP): la
// lógica en sí vive repartida en módulos por responsabilidad (env/db/session/catalog/
// logging/push/email + un archivo por grupo de acciones en ./actions/). Antes todo esto
// vivía en un único archivo de ~2000 líneas — dividirlo no cambia ningún comportamiento,
// solo hace más fácil ubicar y tocar una sola pieza sin tener que releer todo el archivo.

import { actPing } from "./actions/health.ts";
import { actGetCatalog, actAdminCatalogSetPrice } from "./actions/catalog.ts";
import {
  actRegister, actLogin, actSessionCheck, actLogoutEverywhere, actDeleteAccount, actRecover,
} from "./actions/auth.ts";
import {
  actPrepareOrder, actPlaceOrder, actMyOrders, actMyHistory, actAdminOrders, actAdminUpdateStatus,
  actAdminBulkUpdateStatus, actAdminConfirmPayment, actAdminCancelOrder, actCancelMyOrder,
  actExpireStaleManualPayments, actAlertStuckOrders, actExpirePendingCharges,
  actAlertScheduledOrders, actReconcileCulqiCharges, actRemindLowStock,
} from "./actions/orders.ts";
import {
  actAddressesList, actAddressesAdd, actAddressesDelete,
  actFavoritesList, actFavoritesAdd, actFavoritesDelete,
  actSubmitRating, actClaimChallenge, actCreditGift, actCreditLookup,
  actPushSubscribe, actPushUnsubscribe, actRemindUnclaimedChallenge, actRemindPeakHour,
  actPrepareCreditPurchase, actConfirmCreditPurchase, actExpirePendingCreditPurchases,
} from "./actions/customer.ts";
import {
  actAdminManualPoints, actAdminAccountsList, actAdminAccountsAdd, actAdminAccountsDelete,
  actAdminInventoryToggle, actAdminInventorySetStock, actAdminExportOrders, actAdminExportCustomers,
  actDashboardStats, actAdminCustomerDetail, actAdminSearchOrders, actAdminAuditLog,
  actAdminRangeReport, actAdminRatingsList,
} from "./actions/admin.ts";
import { actGetStoreHours, actAdminSetStoreHours } from "./actions/hours.ts";
import {
  actSubmitComplaint, actAdminListComplaints, actAdminRespondComplaint, actAlertComplaintDeadlines,
} from "./actions/complaints.ts";
import { ApiError } from "./types.ts";
import { debugLog } from "./logging.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

const ACTIONS: Record<string, (b: any) => Promise<unknown>> = {
  ping: actPing,
  "get-catalog": actGetCatalog,
  register: actRegister,
  login: actLogin,
  "session-check": actSessionCheck,
  recover: actRecover,
  "logout-everywhere": actLogoutEverywhere,
  "delete-account": actDeleteAccount,
  "prepare-order": actPrepareOrder,
  "place-order": actPlaceOrder,
  "my-orders": actMyOrders,
  "my-history": actMyHistory,
  "addresses-list": actAddressesList,
  "addresses-add": actAddressesAdd,
  "addresses-delete": actAddressesDelete,
  "favorites-list": actFavoritesList,
  "favorites-add": actFavoritesAdd,
  "favorites-delete": actFavoritesDelete,
  "submit-rating": actSubmitRating,
  "claim-challenge": actClaimChallenge,
  "credit-gift": actCreditGift,
  "credit-lookup": actCreditLookup,
  "admin-orders": actAdminOrders,
  "admin-update-status": actAdminUpdateStatus,
  "admin-bulk-update-status": actAdminBulkUpdateStatus,
  "admin-confirm-payment": actAdminConfirmPayment,
  "admin-cancel-order": actAdminCancelOrder,
  "cancel-my-order": actCancelMyOrder,
  "expire-stale-manual-payments": actExpireStaleManualPayments,
  "alert-stuck-orders": actAlertStuckOrders,
  "expire-pending-charges": actExpirePendingCharges,
  "alert-scheduled-orders": actAlertScheduledOrders,
  "reconcile-culqi-charges": actReconcileCulqiCharges,
  "remind-low-stock": actRemindLowStock,
  "admin-manual-points": actAdminManualPoints,
  "admin-accounts-list": actAdminAccountsList,
  "admin-accounts-add": actAdminAccountsAdd,
  "admin-accounts-delete": actAdminAccountsDelete,
  "admin-inventory-toggle": actAdminInventoryToggle,
  "admin-inventory-set-stock": actAdminInventorySetStock,
  "admin-catalog-set-price": actAdminCatalogSetPrice,
  "dashboard-stats": actDashboardStats,
  "export-orders": actAdminExportOrders,
  "export-customers": actAdminExportCustomers,
  "push-subscribe": actPushSubscribe,
  "push-unsubscribe": actPushUnsubscribe,
  "admin-customer-detail": actAdminCustomerDetail,
  "admin-search-orders": actAdminSearchOrders,
  "admin-audit-log": actAdminAuditLog,
  "admin-range-report": actAdminRangeReport,
  "admin-ratings-list": actAdminRatingsList,
  "get-store-hours": actGetStoreHours,
  "admin-set-store-hours": actAdminSetStoreHours,
  "submit-complaint": actSubmitComplaint,
  "admin-list-complaints": actAdminListComplaints,
  "admin-respond-complaint": actAdminRespondComplaint,
  "alert-complaint-deadlines": actAlertComplaintDeadlines,
  "remind-unclaimed-challenge": actRemindUnclaimedChallenge,
  "remind-peak-hour": actRemindPeakHour,
  "prepare-credit-purchase": actPrepareCreditPurchase,
  "confirm-credit-purchase": actConfirmCreditPurchase,
  "expire-pending-credit-purchases": actExpirePendingCreditPurchases,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const action = String(body?.action || "");
  const handler = ACTIONS[action];
  if (!handler) return json({ error: "Acción desconocida: " + action }, 400);

  try {
    const result = await handler(body);
    return json(result);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    await debugLog({ stage: "exception", action, error: String(e) });
    return json({ error: "Error interno del servidor." }, 500);
  }
});
