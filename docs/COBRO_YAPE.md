# Cobrar con Yape sin confirmar a mano (2026-09-23)

El dueño pidió: *«ver bien el cobro por medio de Yape como cobro principal, que sigue sin
automatizarse; debemos ver una forma gratis, o mira si Culqi me da la opción de pagar por
Yape y si cobra un porcentaje»*.

**Estado:** análisis. Nada de esto está programado. Se implementa cuando el dueño elija.

## ⚠ Corrección del dueño (2026-09-23): la vía de la notificación NO sirve

El dueño trabaja en Yape y lo aclaró: **Yape no notifica todas las operaciones**, así que
confirmar leyendo la notificación del celular dejaría pagos sin confirmar en silencio.
Quedan descartadas por lo mismo las vías A, B y D de abajo (Yape personal, Yape Empresa y
Plin Negocios con esa técnica). Lo que queda:

- **Yape dentro de Culqi** (automático, con comisión): ya integrado en el código; el dueño no
  ve la opción en su cuenta, así que hay que pedirle a Culqi que la active.
- **Yape personal manual** (gratis): usa Yape personal en Android. Se puede abaratar la
  revisión pidiendo al cliente el código de seguridad de 3 dígitos en vez de la captura, para
  que el dueño lo busque en sus movimientos.

Lo de abajo se conserva como registro del análisis, no como recomendación vigente.

**Confirmado por el dueño (2026-09-23): Culqi cobra 3.44% por Yape.** Decisión: no programar
el código de 3 dígitos; se conserva el Yape manual tal como está hasta encontrar otra vía.

## Cómo funciona hoy

Yape es el método por defecto desde el 2026-09-03 (`manualPayMethod='yape'`). El cliente
yapea al número del negocio, sube la captura, y el pedido queda `pending` hasta que el dueño
lo confirma **mirando su cuenta**. El lector de comprobantes (Tesseract, gratis) ayuda pero
no confirma: una captura se edita en dos minutos. Si nadie confirma, un cron lo cancela.

El costo de hoy no es plata: es el tiempo del dueño en cada pedido, y el pedido que se enfría
mientras nadie mira el celular.

## Las cuatro vías, con su costo real por pedido

Ticket de referencia: S/25 y S/30 (sándwich + reparto).

| vía | comisión | por pedido de S/25 | de S/30 | ¿automático? | qué le pide al cliente |
|---|---|---|---|---|---|
| **A · Yape personal + confirmación por notificación** | **0%** | **S/0** | **S/0** | sí (con respaldo manual) | yapear y escribir 3 dígitos |
| B · Yape Empresa (con RUC) + la misma confirmación | 2.95% | S/0.74 | S/0.89 | sí | igual que A |
| C · Yape **dentro de Culqi** (ya integrado) | 3.44% + IGV ≈ 4.06% | S/1.01 | S/1.22 | sí, del todo | abrir Yape → «código de aprobación» → pegarlo (vence en 2 min) |
| D · Plin Negocios | 0% | S/0 | S/0 | con la misma técnica que A | pagar por Plin (o Yape → Plin interoperable) |

⚠ **La cifra de Culqi no pude confirmarla en su página**: el proxy de este entorno bloquea
`culqi.com`, `ayuda.culqi.com` y `docs.culqi.com`. Lo que dicen los resultados del buscador
(incluidos fragmentos del propio sitio de Culqi) es 3.44% + IGV para billeteras, y uno agrega
**+ US$0.20** en ventas online. Si esos US$0.20 aplican, C cuesta ≈ S/1.9–2.1 por pedido
(7–8%). **El número definitivo está en tu CulqiPanel**, en el detalle de comisión de
cualquier cargo.

## Recomendación: A como principal, C como respaldo automático

**A cuesta cero y le quita al dueño casi todas las confirmaciones.** C ya está programado y
solo necesita que Culqi lo active en la cuenta, pero cobra en cada pedido y le pide al
cliente un paso incómodo (el código de aprobación vence en dos minutos). Las dos pueden
convivir: A como camino principal «Recomendado», C dentro de «Tarjeta» para quien prefiere
no escribir nada.

### Cómo funcionaría A

La idea: la confirmación no sale de lo que dice el cliente (una captura), sale de lo que
dice **el propio Yape en el celular del negocio**.

1. El cliente elige Yape y yapea el monto exacto al número del negocio.
2. Desde abril de 2025, Yape muestra un **código de seguridad de 3 dígitos** en la pantalla
   de confirmación de quien paga **y en la notificación de quien recibe**. El cliente escribe
   esos 3 dígitos en la app (en lugar de subir la captura; la captura queda como respaldo).
3. En el celular Android del negocio, **MacroDroid** (gratis, usa 1 de sus 5 macros) detecta
   la notificación de Yape y la manda tal cual a una acción nueva del servidor, con una clave.
4. El servidor lee monto y código, busca un pedido Yape pendiente con **ese monto, ese código
   y creado en los últimos minutos**, y lo marca pagado por el mismo camino que la
   confirmación manual (el mismo reclamo atómico `payment_status=neq.paid`).
5. Si no hay una coincidencia exacta y única, **no adivina**: el pedido queda en la bandeja de
   siempre para confirmar a mano. El panel muestra qué se confirmó solo y con qué notificación.

Por qué es más seguro que hoy: una captura la fabrica el cliente; la notificación la genera
Yape en el teléfono del dueño. Y el código de 3 dígitos impide que alguien reclame como suyo
el yapeo de otra persona del mismo monto.

### Lo que A necesita del dueño

- **Un Android** con la cuenta de Yape del negocio, notificaciones de Yape activadas y la
  batería sin restricción para MacroDroid. **iPhone no sirve**: iOS no deja que una app lea
  las notificaciones de otra.
- **Un yapeo de prueba** (S/1) para copiar el texto exacto de la notificación. El formato no
  se inventa: se fija con uno real.
- Decidir entre **Yape personal (0%)** y **Yape Empresa (2.95%)**. Yape personal recibe hasta
  **5 UIT al mes = S/27,500 en 2026** (≈ 900 pedidos de S/30). Pasado eso, hace falta Yape
  Empresa o repartir con Plin.

### Riesgos de A, y qué pasa en cada uno

| si… | pasa… |
|---|---|
| el celular está apagado o sin datos | los pedidos esperan en la bandeja manual, como hoy. No se pierde nada. |
| Yape cambia el texto de su notificación | el servidor no la entiende, lo anota y **avisa al dueño**; todo cae a manual. |
| Android cierra MacroDroid para ahorrar batería | lo mismo; por eso la batería va sin restricción. |
| se filtra la clave del celular | solo podría confirmar pedidos que coincidan en monto, código y ventana, y queda rastro. La clave se cambia desde el panel. |
| dos pedidos iguales en el mismo minuto | el código de 3 dígitos los separa; si aun así coinciden, no confirma ninguno y los deja a mano. |

## ⚠ Hallazgo aparte: la comisión de la TARJETA puede estar mal en el modelo

Según los mismos resultados, Culqi aplica una **comisión mínima de S/3.50 a pagos con tarjeta
menores de S/87.72** en CulqiOnline y CulqiLink. El código y el modelo usan
`CULQI_FEE_RATE = 5.5%`. Si el mínimo aplica a esta cuenta, un pedido de S/30 con tarjeta
paga **S/3.50 (11.7%), no S/1.65**. El recargo que ve el cliente solo «engorda» el reparto
(`deliveryFeeAmount`); la comisión sobre la comida la absorbe el margen, y el modelo la
calcula al 5.5%. La diferencia —≈ S/1.85 por pedido con tarjeta— saldría del margen sin que
ningún número del modelo la muestre.

**Esto hay que verificarlo antes de abrir**, en el CulqiPanel, con un cargo real de monto
chico. Si se confirma, cambia el precio del camino de tarjeta y refuerza la recomendación de
arriba.

## Preguntas para el dueño

1. ¿Qué celular quedaría en el local, Android o iPhone?
2. ¿Yape personal (0%, tope S/27,500/mes) o Yape Empresa (2.95%)?
3. ¿Culqi ya activó Yape en tu cuenta? (El código tiene `yape:true`, pero la última vez que se
   miró el widget solo mostraba tarjeta.)
4. ¿Qué comisión muestra tu CulqiPanel en un cargo con tarjeta de monto chico?

## Fuentes

- Comisión de Culqi para Yape y el mínimo de S/3.50: [Culqi](https://culqi.com/),
  [CulqiOnline](https://culqi.com/productos/online-pasarela-de-pagos/),
  [¿Cuál es la comisión de CulqiOnline?](https://ayuda.culqi.com/portal/es/kb/articles/cual-es-la-comision-de-culqionline),
  [Precios Culqi](https://culqi.com/precios/),
  [Pasarelas de pago en Perú 2026 (Riqra)](https://blog.riqra.com/posts/pasarelas-pago-online-peru)
- Yape por Culqi con código de aprobación: [Cargos Únicos - Yape (docs Culqi)](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape)
- Yape Empresa 2.95%: [¿Yape Empresa tiene algún costo?](https://www.yape.com.pe/preguntas-frecuentes/yape-empresa/yape-empresa-tiene-algun-costo),
  [Infobae](https://www.infobae.com/peru/2024/04/10/si-usas-yape-en-tu-negocio-solo-pagaras-comision-en-este-caso-cuanto-te-cobraran/)
- Límite de 5 UIT al mes: [Infobae](https://www.infobae.com/peru/2025/01/02/yape-nuevo-monto-limite-que-puedes-recibir-al-mes-tras-vigencia-de-la-uit-2025/);
  UIT 2026 = S/5,500: [MEF](https://www.gob.pe/institucion/mef/noticias/1314665-mef-establece-en-s-5500-el-valor-de-la-uit-para-el-ano-2026)
- Código de seguridad en la notificación del receptor: [El Comercio](https://elcomercio.pe/respuestas/tramites/asi-funciona-el-codigo-de-seguridad-de-yape-para-evitar-los-falsos-yapeos-tdpe-noticia/),
  [Infobae](https://www.infobae.com/peru/2025/04/01/yape-implementa-codigo-de-seguridad-que-combate-yapeos-falsos-en-nueva-actualizacion/)
- Plin Negocios sin comisión: [BBVA](https://www.bbva.pe/blog/billetera-digital/afiliar-negocios-plin-bbva.html),
  [Interbank](https://interbank.pe/canales-digitales/plin/plin-negocios)
- MacroDroid gratis (5 macros, acción HTTP): [Google Play](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid),
  [Wiki: HTTP Request](https://wiki.macrodroid.com/wiki/index.php?title=Action%3A_HTTP_Request)
