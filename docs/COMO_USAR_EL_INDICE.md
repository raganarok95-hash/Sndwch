# Cómo trabajar con el índice (rag) sin perder nada y gastando menos

Escrito el 2026-09-30, a pedido del dueño: «ahorrar tokens sin perder nada».

## Dónde se van los tokens de verdad

| qué | cuánto pesa | qué hacer |
|---|---|---|
| **La conversación larga** | cada turno reenvía TODO lo anterior | cerrar el bloque, guardar memoria en el repo, **abrir sesión nueva** |
| `CLAUDE.md` | ~12 KB en cada turno | solo reglas; el relato va a `docs/` (ya se bajó de 48 KB a 12) |
| Leer archivos enteros | miles de líneas por lectura | buscar primero, leer solo el rango |
| Salidas largas (pruebas, logs) | todo lo impreso entra al contexto | redirigir a archivo, mirar solo el resumen |

El índice ahorra en la tercera fila. **La primera fila no la arregla el índice: la arregla guardar la
memoria en el repo y empezar de nuevo.** Una sesión nueva arranca con ~12 KB (CLAUDE.md) en vez de
cargar toda la historia, y encuentra lo que necesita por búsqueda.

## El flujo

### 1 · Al empezar una sesión
Cada sesión en la nube es un contenedor NUEVO: el índice y su modelo (2 GB) no vienen con el repo.
Primero se lanza, **en segundo plano**, lo que los deja listos (máquina, no tokens; ~20 min en CPU):
```
bash scripts/preparar-indice.sh      # idempotente: instala, baja el modelo y reindexa lo que falte
```
Mientras corre, la memoria se lee directo, sin índice: `ls docs/sesiones/` y leer la última
(`docs/sesiones/AAAA-MM-DD.md`). Con el índice listo:
```
npm run buscar -- --cat sesiones "estado actual y pendientes"
```
Y se sigue desde ahí.

### 2 · Antes de leer código o docs: buscar
```
npm run buscar -- --archivos "dónde se calcula el envío"     # solo QUÉ archivos (lo más barato)
npm run buscar -- "cómo se vincula un pedido de invitado" -- 3 # fragmentos, 3 resultados
npm run buscar -- --exacto "DELIVERY_MIN_FEE"                  # códigos, constantes, funciones
npm run buscar -- --cat hechos "precio del Philly"             # datos de negocio vigentes
```
Después se lee **solo el rango** que respondió (`sed -n a,bp` o `grep -n`). Un fragmento es un
puntero: antes de EDITAR se confirma leyendo el archivo, porque el índice puede ir un commit atrás.
Varias consultas en una llamada cargan el modelo una sola vez: `npm run buscar -- "a" "b" "c"`.

Categorías: `hechos` (carta, reglas, cálculos generados), `sesiones` (memoria), `docs`, `maquetas`,
`cliente` (`src/app`), `servidor` (`supabase/functions`), `modelo`, `scripts`.

### 3 · Los datos de negocio salen de `docs/hechos/`, nunca de un doc viejo
`CARTA.md`, `REGLAS.md` y `COMO_SE_CALCULA.md` los escribe `npm run hechos` desde
`_shared/carta.ts`, `reglas.ts` y `dinero.ts`. **Se regeneran cada vez que se toca uno de esos tres
archivos.** El precio que se cobra de verdad está en la base (`catalog_prices`, `catalog_items`,
`secret_signature`): la consulta para comprobarlo está al pie de `CARTA.md`.

### 4 · Al cerrar un bloque de trabajo: memoria en el repo
Escribir `docs/sesiones/AAAA-MM-DD.md` con:
- **Hecho** (con commits),
- **Decisiones del dueño con sus palabras** (lo que más se pierde al cerrar un chat),
- **Pendiente** en orden de prioridad,
- **Dónde quedó el código** (rama, sin commitear, pruebas rojas).

Commit + push. Recién entonces lo que pasó en el chat está a salvo: el contenedor se borra y el chat
no se indexa.

### 5 · Reindexar
```
npm run indice                     # docs/ (hechos, sesiones y el resto), incremental; en segundo plano
python3 scripts/indice.py --forzar # SOLO si cambió .knowledge-rag/config.yaml (exclusiones o categorías)
python3 scripts/indice.py --todo   # también el código: HORAS en CPU; casi nunca vale la pena
```
**El índice cubre `docs/`, no el código.** En CPU, indexar el repo entero no terminó en una hora;
para el código, `grep -n` es exacto y gratis. Lo que ahorra contexto es ubicar datos y memoria.
Tras commitear un bloque de docs o código. Cuesta máquina (~4 GB de RAM de pico, minutos), no tokens:
se lanza en segundo plano con `run_in_background` y no se mira su salida más que la última línea.

### 6 · Cuándo abrir sesión nueva
Con el contexto sobre ~60%: guardar la memoria (paso 4), commitear, y abrir sesión nueva.
Seguir en una conversación al 80% cuesta en cada turno lo que cuestan decenas de búsquedas.

## Qué NO está en el índice, a propósito

| fuera | por qué | cómo se consulta |
|---|---|---|
| `docs/historico/` | planes cerrados y predicciones v7–v13: números muertos que confundían las búsquedas | a mano, por nombre |
| `tests*`, `supabase/migrations` | repiten datos con otros nombres; el esquema vigente es `supabase/esquema-actual.sql` | `grep` |
| `CLAUDE.md`, `docs/MANUAL_DETALLADO.md` | CLAUDE.md ya va en cada turno; el manual es su copia larga | a mano |
| versiones viejas de `modelo/` | v7–v9, v13 y escenarios viejos (v10 y v11 siguen: los importan v14 y `comparativa_menu`) | a mano |
| la base de datos | el índice ve archivos, no filas | `mcp__Supabase__execute_sql` |

La lista exacta vive en `.knowledge-rag/config.yaml` (`exclude_patterns`).

## Lo que no hay que hacer
- Correr `knowledge-rag` a secas (crea carpetas en la raíz y se queda vigilando).
- Afirmar un dato de negocio desde un doc que no sea `docs/hechos/` o el código.
- Tomar un fragmento como verdad para editar sin leer el archivo.
- Imprimir la suite de pruebas entera en el chat (redirigir a archivo, guardar `$?`).
