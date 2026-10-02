# Lo que el rediseño dejó sin botón — análisis (2026-10-02)

Dueño: «2 y 3 chau, el 4 y 5 analízamelos… el 6 ¿qué era? 7 analiza cuánto nos sirve, visión de
negocio y ventas». 2 (regalar crédito) y 3 (vista de la escalera) ya se borraron.

## 4 · Aviso de poco stock en el armador
- **Hoy:** la tabla `inventory` está VACÍA (0 filas). El aviso («quedan 3», «puede no alcanzar
  para doble») nunca podría mostrarse: no hay datos. El servidor ya descuenta stock por pedido
  (`reserve_inventory`) y marca agotado — pero solo si alguien cargó la cantidad.
- **Viabilidad:** el código es lo de menos; el costo real es que el dueño cuente stock. Sin eso, 0.
- **Máxima expresión, por fases:**
  1. **Agotado de un toque** en Cocina abierta (sin contar nada): la proteína o el pan que se
     acabó deja de venderse al instante. Evita lo caro: vender lo que no hay → cancelar → devolver.
  2. **«Abro con N porciones»** por proteína al abrir (3–6 números al día). El servidor descuenta
     solo con cada pedido; el cliente ve «Quedan 3» (escasez honesta, sube conversión) y se
     bloquea el doble si no alcanza; al dueño le llega el aviso de poco stock (cron que ya existe).
  3. Con compras cargadas (`ingredient_purchases`), sugerir cuánto preparar mañana.
- **Recomendación:** fase 1 ya; fase 2 solo si el dueño se compromete a cargar el número al abrir.

## 5 · Lector de comprobantes de Yape en el panel
- **Hoy:** el cliente puede subir su captura (opcional) tras «Ya pagué». En el panel, «Ver la
  captura» abre la imagen y la lee sola (Tesseract en el navegador, gratis); el servidor compara el
  MONTO con el pedido y detecta si ese NÚMERO DE OPERACIÓN ya respaldó otro pedido. **El resultado
  se calcula y no se muestra** (`receiptOcrHTML` sin conectar). Capturas subidas hasta hoy: 0.
- **Límite (decisión del dueño, 23-09):** no confirma solo — una captura se edita en dos minutos y
  Yape no notifica todo. Sirve para confirmar en segundos en vez de minutos, y para atajar el
  fraude más común: la MISMA captura usada en dos pedidos.
- **Máxima expresión:**
  1. Mostrar el veredicto en la tarjeta de Cocina: ✓ «S/27.90 · operación nueva», ✗ «monto no
     cuadra», ⚠ «esta operación ya pagó el pedido X».
  2. Leerla apenas llega (no al tocar «Ver»): el veredicto ya está cuando el dueño mira.
  3. Pedir la captura en la misma pantalla de «Ya pagué» («súbela y entra más rápido»): sin
     capturas el lector no sirve.
  4. Medir con las primeras capturas reales qué tanto acierta Tesseract con Yape.
- **Recomendación:** 1+2+3. Costo S/0; el código existe; es conectar y mostrar.

## 6 · Selección en lote del panel
Casillas en cada pedido + una barra para pasar varios al mismo estado de un toque (p. ej., 5 a
«En camino» cuando el motorizado se los lleva juntos). Cocina abierta ya tiene un botón por
tarjeta. Con el volumen de apertura no hace falta; sirve si salen varios pedidos juntos.

## 7 · «Arma uno parecido» desde un Signature
- Precargaba el armador con las piezas del Signature para cambiarlo.
- **Negocio:** cada Signature deja ~S/5.50 más que un armado (`NEGOCIO.md`). Esta función empuja
  al revés de la meta de mezcla: convierte Signatures en armados.
- El motivo real para usarla (no me gusta un ingrediente) ya lo cubre «Quitar ingredientes» de la
  ficha (#102), que mantiene el precio y el margen del Signature.
- **Recomendación:** borrarla. Lo que sí vende es el puente contrario (armado → Signature), que
  ya existe debajo de los panes.
