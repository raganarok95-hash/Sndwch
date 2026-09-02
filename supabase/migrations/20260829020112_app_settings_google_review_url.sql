-- URL del perfil de Google Business del negocio, para invitar a dejar reseña después de
-- calificar un pedido. Va en app_settings y no en el código por dos motivos: es un dato
-- real del negocio que nadie puede inventar (misma regla que el RUC o la razón social), y
-- así se puede pegar desde el panel sin redesplegar el cliente — igual que META_PIXEL_ID.
--
-- Mientras esté NULL, la app no muestra nada: sin URL no hay a dónde mandar a nadie, y un
-- botón que no lleva a ninguna parte es peor que no tener botón.
alter table public.app_settings add column if not exists google_review_url text;

comment on column public.app_settings.google_review_url is
  'URL de reseña del perfil de Google Business. El enlace se ofrece a TODOS los clientes que califican, sin filtrar por nota: mostrarlo solo a los contentos es review gating y viola las políticas de Google.';
