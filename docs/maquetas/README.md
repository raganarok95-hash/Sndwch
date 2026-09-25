# Maquetas aprobadas — cómo debe quedar cada pantalla, exactamente

**Estas imágenes no son referencia ni inspiración: son la especificación.** Una pantalla
aprobada se construye hasta que se vea como su PNG de acá (dueño, 2026-09-24: «las maquetas
no son referencias sino como debe quedar exactamente»).

Hasta hoy vivían solo en `/tmp` de un contenedor que se recicla: la especificación de todo el
front estaba a un reinicio de perderse, y de hecho cinco fuentes ya se habían perdido.

- `aprobadas/` — un PNG por pantalla aprobada (372×812, o 390×844 las del mundo).
- `fuentes/` — el HTML de donde sale cada una. Las imágenes que usan apuntan a `img/` del
  repo con rutas relativas, así que se abren desde acá tal cual.
- `scripts/render-maquetas.mjs` — vuelve a generar los PNG desde las fuentes. Probado:
  M2, M15 y M22 salen **idénticos píxel por píxel** a las capturas que se aprobaron.
- `npm run check:maquetas` — que cada PNG esté en esta tabla, cada fila tenga su PNG, y cada
  fuente citada exista.

**Regla: una aprobación nueva se guarda acá el mismo día** — la fuente en `fuentes/`, su fila
en `MAPA` de `scripts/render-maquetas.mjs`, el PNG en `aprobadas/` y su fila abajo. Si solo
vive en el chat o en `/tmp`, no existe.

## Índice

| pantalla | archivo | fuente | cómo quedó |
|---|---|---|---|
| 01 · Ficha de un Signature (SANDO) | `01-ficha-de-un-signature.png` | perdida — recorte de captura | «La pantalla de la ficha, me agrada para sando» |
| 06 · Pedido enviado | `06-pedido-enviado.png` | `p2.html` #3 | «Pedido ya está en la cocina, esa pantalla bien» |
| 06 A · la losa | `06A-pedido-enviado-la-losa.png` | `y1.html` #1 | «La losa, pero bien hecho» (2026-09-24) — **la vigente**: SANDO entero hasta la losa, sin la columna que le cortaba la cara |
| 23 · La comanda (cocina) | `23-la-comanda.png` | perdida — recorte de captura | «La comanda me gusta» |
| 29 · Tus puntos | `29-tus-puntos.png` | `v1.html` #1 | «Ok listo esa queda» |
| 29 · estado A · entra | `29-estado-a-entra.png` | `w1.html` #1 | la animación de la 29 |
| 29 · estado B · él llega | `29-estado-b-el-llega.png` | `w1.html` #2 | la animación de la 29 |
| 29 · estado C · sellada | `29-estado-c-sellada.png` | `w1.html` #3 | la animación de la 29 |
| 30 G · el carrito | `30G-el-carrito.png` | `h1.html` #1 | «Me encantó la pantalla 30 G» |
| 30 G2 · con la franja | `30G2-el-carrito-con-la-franja.png` | `y1.html` #3 | «con la franja aprobado pero con una mejor frase entre los hermanos» (2026-09-24) — **la vigente**; frase de la franja elegida: «Nosotros ya estamos. Falta tu sí» |
| 31 · Pagar con Yape | `31-pagar-con-yape.png` | `e1.html` #4 | «es la 31 código rehecho» (2026-09-24) — la cifra «son S/2.79 más» es de muestra y se calcula; el QR será el QR de Yape del dueño |
| 31 · Pago con tarjeta | `31-pago-con-tarjeta.png` | `y1.html` #4 | «las instrucciones de la tarjeta igual, están bien» + el pulgar |
| 32 · En camino | `32-en-camino.png` | perdida — recorte de captura | «22, aprobada» (era la 32) |
| 33 · Tus pedidos — solo la mitad de arriba | `33-tus-pedidos-mitad-de-arriba.png` | perdida — recorte de captura | arriba sí, la lista no — **la vigente es «los sellos»** |
| 34 · Dónde te lo dejamos | `34-donde-te-lo-dejamos.png` | `i1.html` #2 | «34 y bebidas de wicho aprobadas» |
| 35 · Algo salió mal | `35-algo-salio-mal.png` | perdida — recorte de captura | «25 también» (era la 35) — ⚠ el PNG trae el SANDO viejo; la pantalla se construye con el actual (sando2_cuerpo_b, la misma pose) |
| Bebidas · lado WICHO | `bebidas-lado-wicho.png` | `i1.html` #3 | «34 y bebidas de wicho aprobadas» |
| Bebidas · lado SANDO | `bebidas-lado-sando.png` | `w2.html` #6 | «Bebidas 3 aprobada» |
| Entrar | `entrar.png` | `w2.html` #2 | «entrar 2 aprobada» (corregida: se cortaba la cabeza de SANDO) |
| Tus pedidos · los sellos | `tus-pedidos-los-sellos.png` | `v2.html` #2 | «Tus pedidos me suena bien» — **trae «Pedir lo mismo» arriba** |
| Pedido grupal | `pedido-grupal.png` | `k1.html` #1 | «El pedido grupal, hermoso. Queda» (con logo) |
| Tarjeta de regalo | `tarjeta-de-regalo.png` | `k1.html` #4 | «Regalo C me gusta… y ya estamos» — producto retirado para la apertura |
| Plan semanal | `plan-semanal.png` | `j1.html` #4 | «Plan semanal muy bien» — producto retirado para la apertura |
| Ficha · versión WICHO | `ficha-version-wicho.png` | `l1.html` #1 | «Ficha versión wicho, aprobada» |
| Menú secreto · estructura | `menu-secreto-estructura.png` | `n2.html` #1 | estructura «perfecta» |
| Menú secreto · fondo | `menu-secreto-fondo.png` | `t2.html` #3 | «Secret 3 me gusta» |
| Tu cuenta | `tu-cuenta.png` | `l1.html` #3 | «Pantalla de tu cuenta, se aprueba» |
| Estado vacío (el patrón) | `estado-vacio.png` | `l1.html` #4 | «aprobada, pero sin logo» |
| Detalle de un pedido | `detalle-de-un-pedido.png` | `u2.html` #1 | «me agradan, aprobadas» |
| Tu pedido fijo | `tu-pedido-fijo.png` | `u2.html` #2 | «me agradan, aprobadas» |
| Lo legal | `lo-legal.png` | `u2.html` #3 | «me agradan, aprobadas» — fechas y datos fiscales los pone el dueño |
| Mundo WICHO (M22) | `mundo-wicho-M22.png` | `m14.html` #2 | «M22 wicho aprobada» |
| Mundo WICHO (M22) + el puente | `mundo-wicho-M22-con-puente.png` | `m22-con-puente.html` #2 | «esta bien pero no uses ese logo usa el logo actual y real» (2026-09-24) — **la vigente**: la fila «¿Prefieres que ya esté resuelto?» lleva al lado de SANDO, con el isotipo real. **Construida el 2026-09-25** (`sOBuild`, `.mw` en shell.html) |
| Mundo WICHO · los seis pasos del armador | `mundo-wicho-los-seis-pasos.png` | — (capturas de la app construida, `sOBuild` + `.mw`) | «Si, apruebo» (2026-09-25) — tamaño, pan, queso, vegetales y salsas en el mismo mundo que M22; el espacio libre bajo las piezas queda así |
| Mundo SANDO (M15) | `mundo-sando-M15.png` | `m8.html` #1 | «m15 sando» |
| La puerta (M2) | `la-puerta-M2.png` | `m.html` #2 | «m2 puerta» |

## Lo que todavía no tiene maqueta aprobada

- Nada por ahora: todo lo mostrado está decidido.

## Qué prometen y qué existe

Ver `FUNCIONES_PROMETIDAS.md`: cada promesa de cada maqueta contra el código y la base.

## SANDO es siempre el actual

El SANDO actual son `sando2_frente`, `_sonrie`, `_mira`, `_perfil`, `_ladea`, `_asoma`,
`_pulgar`, `_cuerpo` y `_cuerpo_forro`. Los del dibujo viejo se borraron del repo el
2026-09-24 (ver `img/fuente/FUENTES.md`) — incluidos cinco que llevaban «2» sin ser el actual.

Donde una maqueta dibujaba a SANDO comiendo de cuerpo entero (06, 31 Yape, M15, 35) va
`sando2_cuerpo_forro`, con las manos en los bolsillos y sin sándwich. **Aprobado así por el
dueño** («con las manos en los bolsillos es correcto… no es necesario el sando comiendo»):
no se pide ninguna pose nueva. ⚠ No se reemplaza por un busto: se probó y el dueño lo
rechazó porque rompía las pantallas ya aprobadas.

Las cinco maquetas sin fuente (01, 23, 32, 33, 35) no se pueden volver a renderizar: si su PNG
trae el SANDO viejo, la pantalla se construye con el actual igual. El logo NO cambia
(CLAUDE.md). `npm run check:maquetas` falla si el SANDO viejo vuelve a aparecer.

## Datos de muestra dentro de las maquetas

Nombres de clientes, direcciones, precios y el nombre del sándwich secreto de las maquetas
son **de muestra**. Al construir, cada cifra y cada nombre sale del código o de la base
(CLAUDE.md: un número escrito a mano es una promesa que se va a romper). La maqueta manda en
la forma, no en los datos.
