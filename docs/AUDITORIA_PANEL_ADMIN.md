# El panel admin en un celular de gama baja

Fecha: 2026-09-12. Contexto que cambia todo el análisis: **el dueño va a usar un celular
aparte, de gama baja, dedicado a operar mientras la tienda está abierta.** No es "el panel
también funciona en móvil" — es el único dispositivo, en la cocina, con las manos ocupadas.

Todo lo que sigue está **medido renderizando las pantallas reales** a 360×640 (viewport CSS
típico de gama baja, DPR 2), no estimado. El medidor está en el scratchpad de la sesión.

---

## 0 · El defecto grave, ya corregido en este mismo cambio

**El modo cocina se anclaba a la POSICIÓN del pedido en la lista, no a su identidad.**

El poll trae pedidos cada 25 s y `sortedActiveOrders()` los ordena por prioridad, así que uno
nuevo puede meterse delante del que está en pantalla. Medido en vivo:

```
antes:   Cliente ROSA    botón → updateStatus('ROSA','EN CAMINO')
entra un pedido nuevo sin pagar
después: Cliente NUEVO   botón → confirmAndAdvance('NUEVO')
```

Mismo sitio de la pantalla, mismo tamaño, mismo color. Con el dedo ya bajando, el dueño
creía marcar EN CAMINO el pedido de Rosa y en realidad **confirmaba el pago Yape de un
pedido que nunca miró contra su cuenta**. Es exactamente lo que el lector de comprobantes
existe para no hacer solo: *leer el comprobante no es confirmar el pago*.

Corregido: el foco se ancla al `id`. Un pedido que se mete delante **se anuncia en una
banda tocable** ("1 pedido entró antes que este — ver →") en vez de robarle la pantalla.
Esconderlo sería peor que el salto: quien cocina tiene que enterarse de lo urgente y decidir
él cuándo mirarlo. `tests/modo-cocina-ancla.spec.ts` (3) lo fija, verificado inyectando el
defecto: 2 de 3 pruebas fallan al volver a `ao[focusIdx]`.

---

## 1 · Lo que está BIEN y no hay que tocar

Conviene decirlo antes de la lista de problemas, porque el modo cocina está bien pensado:

- **Un pedido a la vez, con la acción principal en una barra fija abajo.** Es la decisión
  correcta para una mano.
- **Los tamaños de letra están bien**: el grueso del texto vive en 15–17 px y el nombre del
  cliente en 28 px. Nada por debajo de 15 px en el cuerpo.
- **Una sola zona táctil por debajo de 44×44** en toda la pantalla (el enlace secundario
  "solo confirmar el pago", de 20 px de alto). El resto cumple WCAG 2.5.5.
- **Sin desborde horizontal** a 360 px.
- **El poll no repinta a lo tonto**: compara `ordersSig()` y solo llama a `render()` si algo
  cambió, y preserva el scroll. En un celular lento eso importa mucho.
- **El poll corre también en modo cocina** (se arregló antes): un pedido nuevo suena.

---

## 2 · Lo medido, en orden de cuánto estorba

### 2.1 Un pedido ocupa 1 239 px en una ventana útil de 429 px

| | px |
|---|---|
| alto del viewport | 640 |
| barra superior ("← Salir / Modo // cocina") | 44 |
| barra de navegación ("‹ Pedido 1 de 4 ›") | 56 |
| barra fija inferior (acción principal) | **111** |
| **ventana útil real** | **429** |
| **alto del contenido de un pedido** | **1 239** |

**Son casi 3 pantallas de scroll para ver un pedido.** Y la captura lo enseña: la barra fija
corta la receta a media palabra, en "Proteína:" del 30CM — **sin ninguna señal de que haya
más abajo**. El corte parece el borde de la tarjeta.

Peor: **el 40% de la altura se gasta antes de la primera palabra útil.** Lo que hay arriba de
la receta es el rótulo "Modo // cocina", el nombre del cliente en 28 px y
"SND-1000 · S/45.80 · hace 12 min". Para *armar* el sándwich, nada de eso sirve: el nombre y
el monto sirven para *entregar*, que es un momento distinto.

### 2.2 El home del panel mide 4 600 px y tiene 53 controles

Son **7,2 pantallas de scroll** y 34 pantallas registradas en `ADMIN_SCREENS`. Para un
celular dedicado a operar, eso es todo ruido: mientras la tienda está abierta hacen falta
cuatro cosas —la cola, confirmar un pago, marcar un insumo agotado, ver la salud— y las otras
30 pantallas (marketing, calendario, recetas, modelo, cohortes, auditoría) son trabajo de
escritorio que se hace con la tienda cerrada.

### 2.3 La pantalla se apaga sola y hay que desbloquearla con las manos sucias

**No existe ninguna llamada a la Wake Lock API en todo el repo** (verificado con grep).
En un celular dedicado, apoyado en la mesada, la pantalla se apaga en 30 s–1 min. Cada aviso
de pedido nuevo obliga a desbloquear con las manos grasosas.

Es el arreglo con mejor relación esfuerzo/beneficio de toda esta lista: `navigator.wakeLock`
tiene soporte en Chrome Android desde hace años, degrada solo (un `try/catch` y ya), y hay
que re-pedirlo al volver de segundo plano porque el sistema lo suelta.

### 2.4 Un ingrediente retirado hace desaparecer la línea — o el sándwich entero

`fn(arr, id)` devuelve **cadena vacía** cuando no encuentra el id, y `itemRecipeLines()`
empuja igual la línea. Resultado: **"Pan:" seguido de nada.** Y si el Signature entero no
está en `SIGS`, `itemRecipeLines()` devuelve `[]` y `orderRecipeHTML()` **omite el bloque
completo**: un pedido que se ve sin receta.

No es hipotético. El repo ya retiró `P07` (res laminada), `T07` (giardiniera), `D09` (chai) y
`SIG07`/`SIG08`. Un pedido programado hecho antes de un retiro, o el historial, cae justo
ahí. En la pantalla que dice **qué cocinar**, un ingrediente que desaparece en silencio es el
peor modo de fallo posible.

---

## 3 · Propuesta — un "modo servicio" de verdad

No es rehacer el panel. Es reconocer que hay **dos usos distintos** y que hoy comparten
pantalla: operar con la tienda abierta, y administrar con la tienda cerrada.

**Nada de esto está implementado.** Son propuestas a cerrar antes de escribir código.

### a) Que el pedido entre en una pantalla

Mover arriba lo que sirve para armar y abajo lo que sirve para entregar:

1. estado + **receta** (lo primero, sin nada encima)
2. avisos que bloquean (pago sin confirmar, programado, recompensa)
3. dirección, mapa, referencia, ticket, WhatsApp
4. cancelar

Y fundir las dos barras superiores en una sola (44 px en vez de 100), con el contador de
pedidos dentro. Solo eso devuelve **56 px** y el rótulo "Modo // cocina" —que no dice nada
que el dueño no sepa— deja de gastar una franja.

### b) Un degradado al pie de la barra fija

Que se vea que hay más abajo. Hoy el corte es limpio y parece el final.

### c) Wake Lock mientras el modo cocina esté abierto

Con su `try/catch`, re-pidiéndolo en `visibilitychange`, y **soltándolo al salir** — dejar la
pantalla encendida toda la noche quemaría la batería del celular dedicado.

### d) Que la receta NUNCA calle un ingrediente

Si `fn()` no encuentra el id, escribir el id crudo (`Pan: B04 (?)`) en vez de nada, y si el
Signature no está, decir "receta no disponible — llama al cliente" en vez de omitir el
bloque. Un dato que falta se dice; no se borra.

### e) Un home de servicio: 4 accesos, no 53

Cuando la tienda está **abierta**, el panel abre en una pantalla con cuatro botones grandes
—Cocina · Pagos por confirmar · Inventario · Salud— y un enlace "todo el panel →" al pie. Con
la tienda cerrada, el home completo de siempre. El horario ya se sabe (`storeStatus()`), así
que no hace falta ningún interruptor nuevo.

### f) Entrar directo al modo cocina

Hoy hay que pasar por 4 600 px de home. Si la app abre con sesión de admin y la tienda
abierta, el modo cocina debería ser la primera pantalla.

---

## 4 · Lo que NO propongo, y por qué

- **Subir todavía más los tamaños de letra.** Ya están bien (15–17 px). Agrandar más
  empeoraría el problema real, que es que el pedido no entra en la pantalla.
- **Cambiar la paleta del panel.** Negro puro + ámbar es una decisión ya tomada ("modo cocina
  de una mano") y el contraste cumple.
- **Sacar pantallas del panel.** Las 34 sirven; lo que hay que cambiar es cuáles se ven
  mientras se cocina, no cuáles existen.
- **Bajar el poll de 25 s.** Está bien: más seguido gasta datos y batería en un celular de
  gama baja, y menos seguido enfría la cola.

---

## 5 · Orden sugerido

| # | qué | por qué primero |
|---|---|---|
| 1 | ~~Anclar el foco al id~~ | **hecho** — podía confirmar un pago que nadie miró |
| 2 | Wake Lock | más beneficio por menos código de toda la lista |
| 3 | Que la receta no calle un ingrediente | es la pantalla que dice qué cocinar |
| 4 | Reordenar la pantalla + fundir las barras | devuelve 56 px y saca la receta del fondo |
| 5 | Degradado al pie | que se vea que hay más |
| 6 | Home de servicio con 4 accesos | el cambio más grande, y el que más depende de gusto |
| 7 | Entrar directo a cocina | depende de 6 |

Del 2 al 7 no se toca nada hasta que el dueño cierre la dirección.
