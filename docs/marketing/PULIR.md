# Pulir el marketing automático (2026-10-15)

Dueño: «¿Qué más hacer, cómo pulir nuestro marketing automático haciendo que sea 100% efectivo y
atractivo?».

«100% efectivo» no existe; lo que sí existe es **medir cada pieza por los pedidos que trae** y
quedarse con lo que trae. Pero antes de pulir, hay que hacer que **salga**: verificado hoy contra
producción y contra Meta, **el marketing automático no ha publicado nunca nada**.

## Lo que encontré (verificado hoy, no supuesto)

| | estado | qué significa |
|---|---|---|
| Publicaciones hechas | **0** (22 imágenes y 10 videos en borrador, 3 programadas) | nunca salió nada |
| Token de la página «Snd//wch» | ✓ | el sistema sí puede hablar con la página |
| **Instagram vinculado a la página** | **✗** («la página no tiene un Instagram profesional vinculado») | **no se puede publicar en Instagram**: es el error que te salió al vincular |
| **Página e Instagram en la cuenta de anuncios** (`1488138326460689`) | **✗ ninguna** | **la prueba de Meta del 20 no puede salir** |
| Historias de la semana de apertura | **1 de 7** lista | las otras 6 dicen «faltan imágenes de Flow, no sale» |
| El video del día (un Reel por día) | listo; el Revisor lo aprueba desde el 20 | va a fallar al publicar mientras no esté el Instagram |
| Píxel de Meta | recibía **solo eventos de nuestros robots** | **arreglado hoy** |
| Publicación que falla | se reintentaba cada 15 min **sin avisar a nadie** | **arreglado hoy**: te avisa |
| Compras al píxel desde el servidor (CAPI) | ✓ | listo |

## Lo que arreglé hoy

1. **El píxel ya no aprende de un robot.** El recorrido de cada mañana y el chequeo tras cada
   publicación cargaban el sitio con el píxel prendido: los únicos eventos de los últimos 7 días
   (visitas, «agregar al carrito», «iniciar pago») eran de ellos. Meta usa esos eventos para
   decidir a quién mostrarle los anuncios. Los dos robots ya no cargan el píxel.
2. **Si una publicación falla, te enteras.** Antes el sistema la reintentaba cada 15 minutos en
   silencio. Ahora te llega un aviso (al celular, o al correo si no lo tienes activado) como
   máximo una vez cada 12 horas, con el motivo.

## Lo que te toca a ti (sin esto no sale nada)

1. **Vincular Instagram a la página** (te dio «error inesperado»). Prueba en este orden:
   - Desde la app de Instagram: **Editar perfil → Página → Conectar** y elige «Snd//wch».
   - Si falla: en Instagram, **Configuración → Tipo de cuenta** y confirma que es **Empresa** (no
     personal ni creador); después, otra vez.
   - Si sigue: desde la computadora, [Configuración del negocio](https://business.facebook.com/settings)
     → Cuentas de Instagram → Agregar → «Conectar tu cuenta» (paso **C2** de
     `docs/CONFIGURAR_META.md`).
   - Cuando quede, avísame: corro el chequeo y publico una pieza de prueba.
2. **La página en la cuenta de anuncios, tus permisos y el método de pago**: pasos **C3, C4 y C5**
   de `docs/CONFIGURAR_META.md` (~15 minutos). Sin esto, el 17 de noviembre no hay número de Meta
   y el plan de S/6,000 se queda sin su palanca más grande.
3. **Las imágenes de Flow para la semana del 20**: correr la rutina del Estudio en tu laptop
   (`sndwch-flow` o `flow-chrome.ps1`). Si no llega, la semana sale solo con los Reels.

## Lo que lo hace más efectivo (por orden de impacto)

1. **Reels primero, historias después.** Con 0 seguidores, **las historias no las ve nadie**: solo
   las ven tus seguidores. Lo que llega a gente nueva son los **Reels** (y TikTok). El sistema ya
   hace un Reel por día con las fotos reales de la carta; ese es el motor de las primeras
   semanas. Las historias ganan peso cuando haya seguidores.
2. **Comida real en movimiento.** Lo que más vende comida en video es verla de verdad: el pan
   abriéndose, el queso, el corte. El panel ya tiene «subir un clip crudo» y el sistema lo edita.
   Opcional y de cero esfuerzo extra: el celular en un trípode grabando mientras armas un pedido,
   2 o 3 clips de 10 segundos por semana.
3. **Medir cada canal por pedidos, no por *likes*.** Cada enlace lleva su origen: `ig-bio`, `tiktok`,
   `google`, `meta`. El correo del domingo ya dice de dónde vino cada pedido. Lo que en dos semanas
   no trae pedidos, se cambia. *«¿Cómo nos conociste?»: descartado (dueño: «eso ya es muy invasivo»).* Los
   anuncios de Rappi y PedidosYa se miden en su propio panel; Google, con `?src=google-ads`
   (`docs/OTRA_PUBLICIDAD.md`).
4. **La prueba de Meta, bien armada** (cuando esté el paso 2): los 2–3 Reels que mejor funcionen
   gratis como anuncio, Trujillo, a las horas de almuerzo y cena, y medida por pedidos con origen
   `meta`. Con presupuesto chico no conviene optimizar a «compra» (Meta necesita ~50 compras por
   semana para aprender): se optimiza a visitas y se mide por pedidos. Yo la armo en pausa y la
   prendes tú.
5. **Volver a mostrarle el anuncio a quien entró y no pidió**, desde la tercera semana: ahora que el
   píxel ve solo a personas, ese público sirve.
6. **TikTok** con los mismos Reels (abrir la cuenta: tú, 5 minutos).

## Lo que lo hace más atractivo

- **El primer segundo decide**: el sándwich, no el logo. Los Reels abren con la comida.
- **El precio en pantalla** (sale de la carta, nunca escrito a mano) y **cómo pedir** al final.
- **La serie de los hermanos** (`BIBLIA_DE_LA_SERIE.md`) para que se reconozca la marca.
- **La Dirección de arte** revisa cada imagen antes de publicar (ya corre): nada sale si el
  sándwich no se parece al real.
