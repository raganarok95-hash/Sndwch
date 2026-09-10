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
| dónde manda | todo el resto de la app | armador y bebidas |

La división no es decorativa: **verde = lo que ya está decidido, celeste = donde eliges tú.**
Si una pantalla nueva no cae claramente de un lado, es señal de que no sabemos qué le
estamos pidiendo al cliente en ella.

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

`sando.png` y `wicho.png` **no son dibujos nuevos**: son el logo del dueño partido por su
costura central. Los otros cinco los generó el dueño aparte.

---

## ⚠ Lo que NO existe, y por qué importa

**De SANDO solo hay UNA pose.** WICHO tiene cuatro. Eso desbalancea la interfaz: WICHO puede
reaccionar (saluda al tocarlo) y SANDO no tiene con qué. Faltan, en orden de utilidad:

1. **SANDO aprobando** — para cuando el pedido se confirma. Hoy ese momento no tiene cara.
2. **SANDO de cara**, como los dos de WICHO, para bocadillos y avisos.
3. **SANDO señalando** — el equivalente del saludo de WICHO.

**Ninguna de esas se puede fabricar desde acá.** Son dibujo nuevo, igual que el RUC, la razón
social o las fotos reales de producto: **las encarga el dueño**. Recortar, escalar o espejar
las que hay no cuenta — un personaje espejado deja de mirar hacia donde debe.

**Lo único que sí se puede animar sin inventar nada es lo que es GEOMETRÍA**: el ojo espiral
de WICHO se redibuja en SVG (`SPIRAL()` en `src/app/02-*`) y gira de verdad. Por eso el
indicador de carga de la app es su ojo: es la única animación de personaje que no depende de
que alguien dibuje otro cuadro.

---

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
