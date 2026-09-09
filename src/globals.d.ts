// SND//WCH — ambientes globales
// Scripts externos cargados por <script> tags (Culqi, Leaflet) y propiedades ad-hoc que
// el propio app.ts cuelga de `window` para pasar datos entre pantallas sin una variable
// de módulo (ver finalizeOrderSuccess, doGPS, actRegister/sPWelcome) — declararlas aquí
// evita `any` disperso por todo el archivo sin cambiar ningún comportamiento en runtime.

declare var Culqi: any;
declare var L: any;
declare var google: any;

interface Window {
  webkitAudioContext?: typeof AudioContext;
  // Resultados vivos del buscador de direcciones del mapa (Nominatim). Cuelgan de
  // window porque el onclick de cada fila se arma como texto dentro del HTML.
  _addrHits?: any[];
  // Distrito que el reverse geocoding del pin reconoció, ya mapeado a un id de
  // DELIVERY_DISTRICTS. El pin es una señal más fuerte que el selector, así que
  // confirmMap lo prefiere por encima de adivinar el distrito del texto escrito.
  _mDistrict?: string;
  culqi?: any;
  _lastGuestName?: string;
  _lastGuestPhone?: string;
  _lastGuestEmail?: string;
  _lWaText?: string;
  _lTot?: number;
  // Puntos realmente otorgados por el pedido: el total SIN el delivery, que es
  // pass-through al motorizado y no genera puntos (ver finalizeAndInsertOrder).
  _lPoints?: number;
  _lChargeId?: string | null;
  _lRewardLabel?: string | null;
  _lPendingPayment?: boolean;
  _lPayMethod?: string;
  _lOrderCreatedAt?: number;
  _lRef?: string;
  _lRankUp?: string | null;
  // Desbloqueo del menú secreto — evento propio, independiente del rango. El umbral es
  // editable desde el panel admin y ya no coincide con ningún rango de RANKS.
  _lSecretUnlock?: boolean;
  _mLat?: number;
  _mLon?: number;
}
