# Cómo se prueba acá (2026-10-01)

Reglas cortas en `CLAUDE.md`; acá el porqué y el cómo. Nacieron de la pregunta del dueño
«¿Por qué las pruebas buscan texto y no funciones?» y de que cada cambio de copy («Seguir» →
«Mandarme el código», «CONFIRMAR //», «¡Listo!…») rompía pruebas que no probaban ese texto.

## Cuándo se escribe una prueba

Solo si el error sería **silencioso** y costaría dinero, datos, lo legal o el acceso (regla del
dueño). Lo visual se mira en el celular y lo revisa `scripts/sitio-real.mjs` contra sndwch.app.
Los servicios externos (Google Maps, ingreso con Google, Culqi) **no se prueban con mocks
locales**: se prueban en `sitio-real`, que corre en GitHub tras cada publicación.

## Cómo se escribe

1. **Cabecera**: qué promete el flujo y cuál es su modo de fallo silencioso (ver
   `tests/entrar-o-crear.spec.ts`).
2. **Buscar por función.** El botón que dispara una acción lleva `data-accion="verbo-objeto"`
   (`pedir-codigo`, `verificar-codigo`, `crear-cuenta`, `entrar-con-pin`, `con-google`). Los
   campos se buscan por id (`#l-email`). Un rol sin nombre (`getByRole('dialog')`) también vale.
   Nunca `getByText`, `text=`, `:has-text` ni `getByRole(…, { name })`.
3. **Afirmar el efecto, no la estructura**: qué llamada salió y con qué cuerpo, qué pantalla
   quedó, qué estado guardó. No «hay 3 divs» ni «dice tal frase».
4. **Nada de esperas fijas**: `expect(...).toBeVisible()` o `expect.poll`, nunca `waitForTimeout`.
5. **Una hora fija** se pone con `page.clock.setFixedTime()` dentro del test.
6. **Productos**: se piden a la carta (`tests/carta.ts`), nunca se nombran.

## Cómo se da por buena

- **Inyectar el defecto**: romper a mano la línea que la prueba dice cuidar y verla fallar.
  Ojo con elegir el defecto equivocado: en `entrar-o-crear`, quitar `atab='reg'` NO la rompía
  porque el paso lo decide `authProof`; el defecto real era no guardar la prueba del correo.
- **Un error que reporta el dueño se reproduce primero** (en prueba o en el sitio real) y
  recién después se arregla; si no se pudo reproducir, se dice.
- La suite completa tarda 1–2 min; se corre una vez antes de mergear (`npm run test:estado`).

## Lo heredado

`check:pruebas-por-funcion` es un trinquete: `tests/POR_TEXTO.txt` guarda cuántos selectores por
texto y esperas fijas tiene cada archivo (115 y 13 el 2026-10-01). Un archivo no puede subir y
uno nuevo arranca en cero. **Al tocar una prueba vieja, se migran sus selectores** y se baja la
línea base con `node scripts/check-pruebas-por-funcion.mjs --anotar`.

## Proceso de cada cambio

1. Concepto antes que código, si cambia lo que el cliente ve.
2. Código + `data-accion` en los botones nuevos.
3. Prueba solo si aplica (arriba), con defecto inyectado.
4. `npm run verify:rapido` y `npm run test:estado` redirigidos a archivo, guardando `$?`.
5. Commit, push, merge `--no-ff` a `main`, y revisar `deploy-api` y `sitio-real` en GitHub.
