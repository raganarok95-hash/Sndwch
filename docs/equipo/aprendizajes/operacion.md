# Aprendizajes · Operación

- **2026-10-16 · El inventario está en 0 en producción.** Se carga al abrir («Abro con N
  porciones»). Hasta tener historia, el plan del día sale de la proyección.
- **Siempre · El dueño no reparte.** Lo hace un tercero (50+ motorizados) avisado en un grupo de
  WhatsApp (`docs/NEGOCIO.md`). No se le vuelve a preguntar.
- **Siempre · El dueño trabaja en casa de 8:50 a 18:00 y arma él los pedidos.** El plan del día
  tiene que leerse en un minuto.
- **2026-10-16 · Plan de apertura (20-25 oct): lo que confirmó el dato.** `inventory` tiene 0
  filas: no hay umbrales ni `shelf_life_days` (al cargar, cada producto arranca en 3 días).
  «Abro con N» fija el stock (`admin-inventory-set-stock`) y no escribe la fecha de tanda: la
  alerta de caducidad solo funciona si la tanda se carga como «tanda». El panel descuenta 1 por
  sándwich: un 30CM gasta 2 porciones y cuenta 1; el doble suma 1. Rappi y PedidosYa no entran
  a la app, así que no descuentan nada. Solo hay recetas cargadas de res laminada, cebolla
  salteada y albóndiga: faltan pavo, atún, embutido y pollo cajún. `orders` tiene 4 filas, todas
  canceladas (prueba).
- **2026-10-16 · Lo que supone el modelo para la primera semana (no es dato).** ~1.1 pedidos al
  día (6-7 en la semana; rango 4-10) y ~2.0 al día desde el viernes 23 si Meta arranca (9 en la
  semana; rango 6-12); 69% serían de Rappi; 1.3 sándwiches por pedido; 80% en 15CM; mezcla
  pareja entre las cinco proteínas (no sabe que el Philly venda más); mismo ritmo todos los
  días y sin forma por hora (la hora pico 12-14 y 19-22 es el patrón nacional, no medido). Con
  tan pocos pedidos el plan es un piso para no agotar, no tandas completas. Se corrige con las
  primeras ventas reales.
