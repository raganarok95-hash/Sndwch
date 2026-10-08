# Google Business: la ficha de SND//WCH, lista para pegar (2026-10-07)

Dueño: «hazlo tú lo de Google Business». Revisión del mismo día (`scripts/ficha-google.mjs`): la
ficha **no aparece** en ninguna búsqueda; para «SND//WCH Trujillo» Google muestra solo a la
competencia (La Casera: 4.4 ★ con 532 reseñas; Don Pacho; King Sandwich; Xinona; Centrica).

## Lo único que Google exige que hagas tú (≈10 minutos)
Google solo deja crear y verificar una ficha **con la cuenta del dueño** y un código o una
videollamada suya. Nadie más puede hacerlo por ti. En business.google.com → «Agregar empresa»:
pega los campos de abajo tal cual, elige verificar, y cuando esté verificada **agrégame como
administrador** (Configuración → Personas y acceso) con el correo del negocio. Desde ahí lo
manejan las rutinas: publicaciones, fotos y respuestas a reseñas.

## Los campos (todo sale de la app; nada inventado)
| campo | valor |
|---|---|
| Nombre | SND//WCH |
| Categoría principal | Tienda de sándwiches |
| Categorías secundarias | Servicio de entrega de comida a domicilio · Restaurante de comida para llevar |
| Tipo | **Empresa de área de servicio** (solo delivery; sin dirección pública: no se muestra la cocina) |
| Área de servicio | Trujillo (el envío se cobra por distancia, como en la app) |
| Horario | Martes a domingo 11:00–22:00 · Lunes cerrado |
| Sitio web / enlace para pedir | https://sndwch.app/?src=google |
| Teléfono | El WhatsApp del negocio que usa la app |
| Apertura | 20 de octubre de 2026 (movida del 13 el 2026-10-08) |

**Descripción** (750 caracteres máx.):
> Sándwiches armados al momento, para delivery en Trujillo. Pide un Signature —el Philly
> Cheesesteak, el Meatball Marinara, el Turkey, el Italian Hoagie y más— o arma el tuyo paso a
> paso: pan, proteína, queso, vegetales y salsas. Pagas con Yape o tarjeta desde sndwch.app, sin
> descargar nada. Pide en grupo para la oficina: con varios sándwiches, el de quien organiza sale
> gratis. Hay un menú secreto que se desbloquea pidiendo.

(Los nombres de la descripción son los de la carta de hoy; si cambia la carta, la rutina la
actualiza. La regla del grupo no lleva el número a propósito: el número vive en el código.)

**Atributos**: entrega a domicilio · para llevar · pagos con tarjeta · pagos móviles (Yape).

## Fotos (todas reales, de `img/`)
Logo (`img/marca/`), portada (la del Philly), y una por Signature (`img/sigNN.jpg`). Google
premia fichas con 10+ fotos; hay 26 tratadas.

## Lo que se automatiza después de verificar
1. Con el **Place ID**, el enlace de reseña entra a la app y al WhatsApp de cada entrega.
2. Publicación semanal (el Signature de la semana, novedades) desde la rutina del Publicador.
3. Respuesta a cada reseña en menos de 24 h (Comunidad), con las reglas de la marca.
4. Pedido de acceso a la API de Google Business (unos días) para que todo pase por código.
