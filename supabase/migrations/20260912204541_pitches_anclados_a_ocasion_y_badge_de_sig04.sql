-- SND//WCH — los pitches dejan de describir el sándwich y nombran el MOMENTO (2026-09-12)
--
-- POR QUÉ. Los cinco pitches describían la receta: ingredientes, técnica, adjetivos. Nadie
-- compra "res mechada de cocción lenta" — compra *almuerzo que aguante la tarde* o *la noche
-- que ya no voy a cocinar*. Es el mismo cambio que ya se hizo con el brief semanal el
-- 2026-09-10 (`planContentCalendar` ancla cada tema a una ocasión con día y hora), llevado al
-- catálogo, que es donde el cliente decide.
--
-- CADA PITCH SE VERIFICÓ CONTRA LA RECETA VIGENTE DE ESTA MISMA TABLA, ingrediente por
-- ingrediente, y contra la descripción de cada componente en el catálogo. Ninguno nombra algo
-- que el sándwich no lleve.
--
-- ⚠ NINGUNO HACE UNA AFIRMACIÓN COMPARATIVA NI DE PRECIO, a propósito. Un pitch vive en esta
-- tabla y el dueño edita precios y recetas desde el panel: "el más caro de la carta" o "el
-- único sin toppings" serían ciertos hoy y falsos el día que mueva otra fila, sin que nada
-- avise — la misma trampa que los números escritos a mano en el contenido de marketing. Todo
-- lo que afirman es sobre SÍ MISMOS.
--
-- ⚠ EL BADGE DE SIG04 PASA DE "Cítrico" A "Sin vueltas", y esto es una CORRECCIÓN, no una
-- decisión de naming. La receta de THE FRESH quedó en atún escurrido + mayonesa + pimienta
-- (tops=[] y sauces=[]): la salsa de dijon/limón salió cuando el dueño reescribió la receta y
-- el badge se quedó prometiendo un cítrico que el sándwich no tiene. Su propio pitch ya lo
-- delataba ("Nada más"). Es reversible desde Admin // Catálogo en un toque si el dueño
-- prefiere otro rótulo, o si vuelve a entrar un cítrico a la receta.
--
-- APPEND-ONLY, como manda esta tabla: se INSERTA una fila nueva por item copiando todo lo
-- demás de la fila vigente (la de mayor id por item_id), nunca un UPDATE. El historial de
-- pitches anteriores queda gratis. Copiar con SELECT en vez de reescribir cada columna a mano
-- es deliberado: así un campo nuevo de la tabla no se pierde en silencio al republicar.

insert into catalog_items (
  item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces,
  price_15, price_30, fixed_cheese, cheese_optional, image_path, active, created_by
)
select
  c.item_id,
  c.name,
  c.subtitle,
  case c.item_id when 'SIG04' then 'Sin vueltas' else c.badge end,
  v.pitch,
  c.base, c.protein_id, c.tops, c.sauces,
  c.price_15, c.price_30, c.fixed_cheese, c.cheese_optional, c.image_path, c.active,
  'pitches-por-ocasion-2026-09-12'
from (
  select distinct on (item_id) * from catalog_items order by item_id, id desc
) c
join (values
  ('SIG01', 'El almuerzo que tiene que aguantar hasta la noche. Punta de pecho a fuego lento hasta que se deshace sola, con pepinillo encurtido que le corta la grasa a cada bocado. Si es tu primera vez acá, empieza por este.'),
  ('SIG02', 'Para la noche en que ya decidiste que no vas a cocinar. Albóndigas hechas acá, cocidas dentro de su propia marinara, con mozzarella derretida hasta el borde. Se come con las dos manos y con servilleta al lado.'),
  ('SIG03', 'El del viernes, cuando el día ya se acabó y te lo estás cobrando. Tres fiambres ahumados puestos en pliegues sobre focaccia, cheddar derretido y una BBQ espesa con miel y pimentón. De los que se quedan contigo.'),
  ('SIG04', 'Para comer en el escritorio con una mano, sin que se desarme entre bocado y bocado: no lleva nada suelto adentro. Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Nada más.'),
  ('SIG06', 'Para cuando ya te aburriste de lo de siempre. Muslo marinado toda la noche en sillao, jengibre y ajo, glaseado recién al armarlo, con maní tostado y pimiento curado en aceite. Dulce y salado en el mismo bocado.')
) as v(item_id, pitch) on v.item_id = c.item_id;
