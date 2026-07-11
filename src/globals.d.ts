// SND//WCH — ambientes globales
// Scripts externos cargados por <script> tags (Culqi, Leaflet) y propiedades ad-hoc que
// el propio app.ts cuelga de `window` para pasar datos entre pantallas sin una variable
// de módulo (ver finalizeOrderSuccess, doGPS, actRegister/sPWelcome) — declararlas aquí
// evita `any` disperso por todo el archivo sin cambiar ningún comportamiento en runtime.

declare var Culqi: any;
declare var L: any;

interface Window {
  webkitAudioContext?: typeof AudioContext;
  culqi?: any;
  _lastGuestName?: string;
  _lastGuestPhone?: string;
  _lastGuestEmail?: string;
  _lWaText?: string;
  _lTot?: number;
  _lRef?: string;
  _lChargeId?: string | null;
  _lRewardLabel?: string | null;
  _lPendingPayment?: boolean;
  _lPayMethod?: string;
  _mHint?: string;
  _mLat?: number;
  _mLon?: number;
}
