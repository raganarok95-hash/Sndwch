de: automatizaciones
para: app
estado: hecha
para-cuando: 2026-11-18
---
Ezra (2026-11-10): «Todo debe funcionar en automático» y «sí dale luz verde a todo».
1. **Stock mínimo en la app.** Que cuando un insumo baje de su mínimo llegue un aviso al dueño y se sume solo a la lista de compras. Los mínimos los tiene Operativo en `docs/operacion/OPERATIVO.md`: pídele los números con una entrega en `operativo/`.
2. **Un recorrido diario más largo.** Que `tests-real/recorrido.spec.ts` revise también la cuenta, los puntos y el panel, sin crear pedidos.
3. **La historia «hoy hay» de las 11:00.** Marketing necesita saber qué hay en stock a esa hora (una acción o un dato que pueda leer). Coordínalo con `marketing/2026-11-10-historia-hoy-hay.md`.

---
**App, 2026-11-10:**
- 3 · **Hecho.** `node scripts/hoy-hay.mjs` devuelve en JSON qué Signatures hay hoy (activo y con su proteína en
  stock), cuáles están agotados, si hoy se abre y el horario. Lee producción como un cliente, sin secretos (corre
  en GitHub). Si no hay inventario cargado sale `ok: false`: la historia no se publica con esa lista.
  Avisado a Marketing.
- 1 · **Porciones:** el aviso ya existe (push «Stock bajo» al cruzar el umbral) y Operativo dio los umbrales.
  Falta ponerlos en la base: no me dejaron cambiar producción sin el sí de Ezra (Q13). El SQL:
  `insert into inventory (product_code, product_name, in_stock, stock_qty, low_stock_threshold, shelf_life_days)
  values ('P09','Res // Laminada',true,null,2,3), ('P06','Albóndiga // Marinara',true,null,1,3),
  ('P04','Atún // House',true,null,1,3), ('P08','Pavo // Horneado',true,null,1,3),
  ('P05','Embutido // Italiano',true,null,1,3) on conflict (product_code) do update set
  low_stock_threshold = excluded.low_stock_threshold, shelf_life_days = excluded.shelf_life_days;`
  Ojo: hoy el celular de Ezra no tiene activados los avisos (0 suscripciones), así que el push no le llega.
  **Insumos crudos y lista de compras:** la app no los cuenta; es una pantalla nueva del panel. Va con maqueta
  antes de código (pendiente).
- 2 · **Recorrido más largo:** sin una cuenta no se puede entrar a la cuenta, los puntos ni el panel reales.
  Espera Q14. Lo que sí se agregó hoy: el recorrido avisa si la tienda toma pedidos antes de abrir.

**App, 2026-11-11:** hecho. Umbrales de Operativo en la base (Ezra: «Sí, ponlos»). El recorrido diario entra con
una cuenta robot de cliente (`000000000`, sin panel, sin correo; PIN nuevo en cada corrida dentro de GitHub) y revisa
que la cuenta abra con sus puntos (run 43016277202, en verde). Queda aparte la pantalla de insumos crudos y lista de
compras: va con maqueta.
