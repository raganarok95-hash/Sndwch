# El pedido grupal: está construido entero, y está escondido

Pregunta del dueño (2026-09-23): *«los pedidos por el enlace directo, el pedido en conjunto,
¿está implementado el proceso? No veo que le hayamos puesto amor ni resaltado, y según era lo
que más dinero nos daba.»*

Las tres partes de la pregunta tienen respuesta distinta: **sí está implementado**, **sí es lo
que más deja**, y **no, no está resaltado**. Y al revisarlo apareció algo peor que no estar
resaltado.

---

## 1 · Sí está implementado, y completo

| pieza | estado |
|---|---|
| Crear el grupo y su código | `create-group-order` |
| Abrirlo con el enlace | `get-group-order` |
| **Que cualquiera agregue lo suyo SIN tener cuenta** | `add-group-item` |
| Cerrarlo y pagarlo todo junto por el checkout normal | `close-group-order` |
| Cancelarlo | `cancel-group-order` |
| **Incentivo del organizador** | desde 5 sándwiches, **el 15CM más barato va gratis** |
| Pantalla | aprobada por el dueño («El pedido grupal, hermoso. Queda») |

Está bien hecho hasta en los detalles: el código evita `0/O` y `1/I/L` porque se comparte
de palabra; el envío se reparte entre todos; el menú secreto no se puede colar por esta vía;
y el incentivo cuenta **unidades** y no filas, porque contar filas rechazaba justo el pedido
que el incentivo busca atraer.

**No hay nada que construir. Lo que falta es que exista para el cliente.**

---

## 2 · Sí es lo que más deja, y por mucho

Con las constantes del propio modelo (`modelo/gen_docs.py`), un grupo son **6 sándwiches en
un solo pedido**:

| | contribución |
|---|---|
| Pedido normal | S/16.42 |
| **Pedido grupal** (menú de hoy) | **S/91.02** — 5.5× |
| **Pedido grupal** (menú v4) | **S/101.67** — 6.2× |

**Un solo pedido grupal al día deja +S/2 217 al mes** sobre lo que dejarían pedidos normales.

**Y no es porque el margen por sándwich sea mejor: es el mismo.** Son seis sándwiches que se
mueven en **una** operación — un delivery, un cobro, una coordinación, un viaje. Para una
cocina de una sola persona, el cuello de botella nunca fue el margen: es el tiempo.

⚠ **Lo que NO hay que concluir de esto.** El dueño ya corrigió esto una vez (2026-08-27):
**no es un canal B2B y nadie va a salir a conseguir oficinas.** El propio modelo lo dice en
una línea: *«el pedido grupal no trae clientes: hace que los que ya tienes valgan más»*. La
palanca no es conseguir empresas, es que al cliente que YA tienes se le ocurra usarlo.

---

## 3 · El problema que encontré, que es peor que no estar resaltado

**El grupo se cierra solo a los 15 minutos.** `GROUP_ORDER_WINDOW_MINUTES = 15`.

Pasados los 15 minutos, quien intente agregar lo suyo recibe *«Este pedido grupal ya se
cerró»*. **No hay aviso antes, no hay botón de extender, y no se puede reabrir.**

Ahora piensa en cómo pasa esto de verdad: alguien manda el link al grupo de WhatsApp de la
oficina, y hay que esperar a que cinco personas lo vean, lo abran, elijan y confirmen.
**Quince minutos no alcanzan casi nunca.** El que llega a los 18 minutos no encuentra un
pedido a medio llenar: encuentra uno muerto.

**Es el peor modo de fallo posible aplicado al pedido de mayor valor del negocio**, y encaja
exactamente con el patrón que este repo persigue: no revienta nada, no hay error en ningún
log, solo deja de entrar el pedido que más deja. Y sin ventas reales todavía, nadie se iba a
enterar.

---

## 4 · Ponerle amor: las cuatro cosas, en orden de lo que valen

### 4.1 · La ventana (lo primero, y no es opinable)
De 15 minutos a **algo que aguante una coordinación real** — 60 minutos como piso. Y dos
cosas más que hoy no existen:
- **Avisarle al organizador** cuando falten pocos minutos, no cerrarle el pedido en silencio.
- **Dejar extender** desde la pantalla del grupo mientras esté abierto.

### 4.2 · El momento en que se ofrece
Hoy vive en el **home**, como una puerta más entre cuatro, al lado de «Tus favoritos». Un
pedido que vale 6× no puede estar ahí.

**Y el home es el momento equivocado**, no solo el lugar. «¿Y si pido para todos?» no se le
ocurre a nadie antes de elegir nada: se le ocurre **en el carrito**, cuando ya hay un sándwich
y está viendo el envío. Ahí es donde tiene que aparecer.

### 4.3 · El incentivo, que hoy es invisible
Desde 5 sándwiches, **el 15CM más barato va gratis**. Es una razón fuerte para organizar, y
**no se anuncia en ninguna parte antes de llegar a 5**. Debería decirse:
- al crear el grupo — «a partir del quinto, uno va gratis»;
- **mientras se llena** — «van 3; con 2 más, uno es gratis».

Eso convierte una lista de items en una barra de progreso con premio, que es la diferencia
entre un grupo que se llena y uno que se queda en tres.

### 4.4 · Que el enlace se vea como algo que se comparte
El enlace ya se arma bien (`location.origin + '?group=' + código`). Lo que falta es que
compartirlo sea un gesto de un toque con un texto ya escrito, porque el canal real es WhatsApp
y ahí lo que se pega es texto.

---

## 5 · Lo que NO hay que tocar

- El código sin `0/O` ni `1/I/L`: se dicta de palabra.
- Que se pueda agregar **sin cuenta**: es lo que hace que el link funcione. Pedir registro a
  cinco personas para sumar un sándwich mata el pedido entero.
- Que el incentivo cuente **unidades y no filas**.
- Que ante cualquier duda el incentivo **no regale nada**: un fallo de red no puede volverse
  un descuento que el negocio no decidió.
