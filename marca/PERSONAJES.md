# SND//WCH — SANDO y WICHO

Los dos hermanos son el eje de la identidad y de la interfaz. Este archivo es el
**inventario real** de lo que existe hoy y lo que falta, para que ninguna sesión invente una
pose que no tiene ni prometa una animación que no se puede dibujar.

> **Los nombres son provisionales** (dueño, 2026-09-10). Lo que no es provisional es la
> regla: uno lleva **SND** y el otro **WCH**, porque juntos son el wordmark desplegado —
> SANDO // WICHO = SND//WCH.

---

## Quién es quién

| | **SANDO** | **WICHO** |
|---|---|---|
| color | verde bosque `#26443C` | celeste `#8CC8EC` |
| ojo | párpado caído | **espiral morada** `#C4A6D2` |
| qué ES | los **Signatures** — la receta cerrada | **ARMA EL TUYO** — tú eliges |
| ritmo | mide antes de moverse | se lanza |
| dónde manda | Signatures, tus pedidos, el panel | armador, bebidas, recompensas, favoritos, pedido fijo, tarjeta de regalo, pedido grupal |

La división no es decorativa: **verde = lo que ya está decidido, celeste = donde eliges tú.**
Si una pantalla nueva no cae claramente de un lado, es señal de que no sabemos qué le
estamos pidiendo al cliente en ella.

**Quién manda en cada pantalla se decide en UN solo sitio**: `LADO_WICHO` en `src/app/02-*`.
Hasta el 2026-09-10 WICHO tenía DOS pantallas de unas cuarenta —la app era verde con dos
excepciones— y el dueño pidió explícitamente "que estén mitad a mitad los colores en toda la
web". Las que se sumaron no se eligieron para llegar a una cuota: cada una es literalmente
una pantalla donde el cliente decide algo.

⚠ **El panel de administración es de SANDO siempre**, aunque el dueño esté eligiendo cosas
todo el rato: no es una pantalla de cliente y el celeste ahí no significaría nada.

---

## Lo que existe hoy en `img/`

| archivo | quién | qué es | dónde se usa |
|---|---|---|---|
| `sando.png` | SANDO | mitad izquierda del logo original | — |
| `wicho.png` | WICHO | mitad derecha del logo original | — |
| `sando_cuerpo.png` | SANDO | cuerpo entero, casaca, sándwich en la boca | menú, lado Signatures |
| `wicho_cuerpo.png` | WICHO | cuerpo entero, de pie | menú, lado ARMA EL TUYO (en reposo) |
| `wicho_saluda.png` | WICHO | cuerpo entero saludando | menú, lado ARMA EL TUYO (activo) |
| `wicho_grita.png` | WICHO | cara, gritando | — |
| `wicho_rie.png` | WICHO | cara, riendo | — |
| `sando_saluda.png` | SANDO | cuerpo entero saludando | banda del hermano, cuando ya elegiste |
| `sando_sonrie.png` | SANDO | cara, sonriendo | **pedido confirmado** |
| `sando_serio.png` | SANDO | busto de frente, sándwich en la boca | — |
| `sando_piensa.png` | SANDO | cara, mano en el mentón | — |
| `sando_mira.png` | SANDO | cara, mirando hacia arriba | — |
| `sando_grita.png` | SANDO | cara, gritando | — |

Además, los dos cuerpos aparecen en la **banda del hermano** (`CAB()`, encabezando la lista
de Signatures y el armador) y en los **estados vacíos** (`VACIO()` — sin favoritos, sin
pedidos, sin direcciones, sin pedido fijo), que es donde el dueño pidió que estuvieran
presentes en toda la web. El estado vacío es además el sitio más honesto para ponerlos: es
una pantalla que no tiene ningún dato que mostrar, así que el hermano no le quita espacio a
nada.

⚠ Las dos imágenes de cuerpo entero miden 640 px de alto pero **distinto ancho** (WICHO 448,
SANDO 302). Se escalan siempre por ALTURA: con un ancho fijo, SANDO sale casi 50% más alto
que su hermano y la banda cambia de tamaño según de quién sea la pantalla.

`sando.png` y `wicho.png` **no son dibujos nuevos**: son el logo del dueño partido por su
costura central. Los otros cinco los generó el dueño aparte.

---

## El desbalance se cerró el 2026-09-10

Hasta esa fecha **de SANDO había UNA sola pose** contra cuatro de WICHO, y eso desbalanceaba
la interfaz entera: WICHO podía reaccionar y SANDO no tenía con qué. Estaba anotado acá como
algo que **solo el dueño podía destrabar**, porque una pose nueva es dibujo nuevo —igual que
el RUC o una foto real de producto— y recortar, escalar o espejar las que había no cuenta.

Lo destrabó: mandó **seis poses de SANDO**. Con eso:

- La **banda del hermano** (`CAB()`) ya funciona igual para los dos: en reposo va el cuerpo,
  y cuando el cliente elige algo el hermano **saluda**. Antes eso solo podía hacerlo WICHO.
- El **pedido confirmado** —que este archivo tenía como el hueco número uno, "el momento de
  mayor satisfacción del flujo y no tiene cara"— ahora lo recibe **SANDO sonriendo**. Va él
  y no WICHO aunque el sándwich se haya armado del lado celeste: ahí ya no se elige nada,
  está decidido y en marcha, que es exactamente su territorio.
  ⚠ Con un pago manual **pendiente** no aparece. Todavía falta que el dueño confirme contra
  su cuenta, así que el gesto sería una mentira pequeña; ahí se queda el wordmark.

**Lo que sigue faltando:** una pose de WICHO de cuerpo entero *señalando*, y poses de SANDO
en las situaciones que hoy usan cara suelta (`serio`, `piensa`, `mira`, `grita` están
guardadas pero todavía sin sitio en la interfaz — están inventariadas arriba para que la
próxima sesión sepa que existen en vez de pedirlas de nuevo).

**Lo único animable sin dibujo nuevo sigue siendo lo que es GEOMETRÍA**: el ojo espiral de
WICHO se redibuja en SVG (`SPIRAL()` en `src/app/02-*`) y gira de verdad. Por eso el
indicador de carga de la app es su ojo. El asentimiento (`.sw-nudge`) es lo mismo en
espíritu: movimiento sobre el dibujo real, nunca un dibujo inventado.

## Cómo se agrega una pose nueva

1. El dueño manda la imagen.
2. Se recorta el fondo blanco a transparencia y se ajusta a 640 px de lado mayor.
3. Va a `img/<quien>_<que hace>.png`, en minúsculas y sin acentos.
4. **Se agrega a la tabla de arriba**, con dónde se usa. Una pose sin fila acá es una pose
   que la próxima sesión no sabe que existe.

---

## Lo que NO hay que hacer

- **Espejar a un hermano para "crear" una pose.** SANDO mira a su derecha por diseño; el
  espejo lo manda a mirar fuera de la pantalla.
- **Pintar el `//` grande entre los dos.** Se intentó y el dueño lo retiró: el wordmark ya
  lleva el suyo arriba, y repetirlo en la misma pantalla lo vuelve ruido. **Los hermanos
  SON la división** — no hace falta dibujarla.
- **Usar el morado de la espiral de adorno.** Tiene un trabajo: lo que sorprende (carga,
  menú secreto, desbloqueos). En cuanto se use por bonito deja de significar algo.
