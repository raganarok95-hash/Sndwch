# Las reglas del negocio

> **Generado por `npm run hechos`** desde `supabase/functions/_shared/reglas.ts` y `dinero.ts`. No se edita a mano: se regenera. Si algo de acá
> está mal, el error está en el código, no en esta ficha.

## Puntos
- Cada pedido da **1 punto por sol de comida**, redondeado (el envío no cuenta).
- Bono de bienvenida: **40 puntos**.
- Reto: 3 pedidos → 50 puntos. Descubrimiento: 3 sabores distintos → 50 puntos.
- Rangos por pedidos: NUEVO (0) → REGULAR (1) → INICIADO (5) → CÍRCULO INTERNO (15) → MESA FUNDADORA (30). El menú secreto se explica en PEDIDOS, nunca por rango.

## Referidos
- El invitado recibe **160 puntos** (lo que cuesta una bebida) y quien invita **400** (lo que cuesta un 15CM). Se derivan de la carta: si cambia el precio en puntos, cambia el bono.
- Escalera de quien invita: 3 referidos → una bebida de la casa gratis (160 pts) · 5 referidos → otro sándwich 15CM gratis (400 pts) · 10 referidos → dos sándwiches 15CM gratis (800 pts).

## Horario y cocina
- Abre: domingo 11–22 h · lunes cerrado · martes 11–22 h · miércoles 11–22 h · jueves 11–22 h · viernes 11–22 h · sábado 11–22 h (hora de Lima).
- Máximo **10 pedidos por hora** (la cuenta vive en `api/capacidad.ts`). Cola: 5 min por pedido.
- Llegada que se promete con la cocina vacía: **25–40 min**.
- Notas que avisan a cocina: alergi, alérgi, intoleran, celiac, celíac, gluten, lactosa, diabet.

## Envío
- Por distancia: km en línea recta × 1.3 (factor de ruta) × S/2 por km, mínimo S/5, redondeado hacia ARRIBA al medio sol. Es pass-through: todo va al motorizado.
- Sin tope de distancia ni zonas excluidas: manda la distancia (dueño, 2026-09-30).
- Sin coordenadas cae a zona: Cerca del local S/6 · Distancia media S/8 · Lejos S/12 · Muy lejos S/15.

## Pago
- Yape por defecto (sin recargo). Con tarjeta (Culqi) el ENVÍO se cobra ÷ (1 − 0.055) para que la comisión no se coma lo del motorizado; la comisión sobre la comida la absorbe el margen.
- Reportar un problema: hasta **48 h** después de la entrega.
- Un pedido lleva **al menos un sándwich**: las bebidas se ven y se entra a ellas directo, pero no se paga un pedido de solo bebidas (dueño, 2026-09-30; `assertTraeSandwich` en `api/actions/orders.ts`).

## Descuentos del dinero (`dinero.ts`)
- Combo: −S/1 por cada par sándwich + bebida.
- Salsa extra: +S/2.
- Pedido grupal: el organizador se lleva gratis el 15CM más barato desde **5 sándwiches**.
- Bebida gratis de hora valle: **retirada** (no nombrarla en ningún texto).

## Fuera de la apertura
Plan Semanal (S/95 → S/100 de crédito) y tarjeta de regalo (S/10–S/500): el código existe, la apertura no los ofrece.
