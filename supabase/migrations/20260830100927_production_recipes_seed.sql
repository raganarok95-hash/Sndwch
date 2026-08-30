-- Semilla de production_recipes con las TRES recetas que RECETARIO.md documenta con
-- cantidades y tiempos reales: P01 (res), P02 (pollo teriyaki) y P06 (albóndiga + marinara).
--
-- Las otras (P03 cajún, P04 atún, P05 embutido, las salsas) NO se siembran a propósito. El
-- propio recetario marca cuáles están investigadas a fondo y cuáles son propuesta sin
-- cotizar; transcribir una cantidad que nadie midió la convertiría en un dato con aspecto de
-- medición, y este panel va a servir para comprar y cocinar. El dueño las carga desde la
-- pantalla cuando las tenga.
insert into public.production_recipes (recipe_code, name, yield_portions, portion_grams, ingredients, steps, notes, created_by)
values
(
  'P01', 'Res asada mechada', 38, 85,
  '[
    {"item":"Punta de pecho (brisket)","qty":6000,"unit":"g"},
    {"item":"Sal","qty":72,"unit":"g"},
    {"item":"Cebolla en juliana","qty":2,"unit":"unidades"},
    {"item":"Ajo","qty":1,"unit":"cabeza"},
    {"item":"Zanahoria","qty":2,"unit":"unidades"},
    {"item":"Pasta de tomate","qty":2,"unit":"cdas"}
  ]'::jsonb,
  '[
    {"label":"Limpiar y cortar en trozos de 600-800 g","minutes":20},
    {"label":"Sellar por tandas: marron oscuro, no dorado palido","minutes":15},
    {"label":"Base aromatica: cebolla, ajo, zanahoria, pasta de tomate","minutes":10},
    {"label":"Brasear en olla a presion desde que pita","minutes":55},
    {"label":"Reposo dentro de su caldo, tapado","minutes":30},
    {"label":"Deshilachar en el sentido de la fibra","minutes":20},
    {"label":"Reducir el caldo colado a fuego fuerte","minutes":20}
  ]'::jsonb,
  'Sal 12 g por kg de carne limpia (1.2%). Punto: el tenedor gira sin resistencia (~92-96 C). Reunir con 150-200 ml de caldo reducido por kg de mechado. Probar la sal EN FRIO. Detalle completo en RECETARIO.md.',
  'semilla'
),
(
  'P02', 'Pollo teriyaki', 32, 85,
  '[
    {"item":"Muslo deshuesado sin piel","qty":4000,"unit":"g"},
    {"item":"Sillao (marinada)","qty":320,"unit":"ml"},
    {"item":"Agua (marinada)","qty":320,"unit":"ml"},
    {"item":"Jengibre rallado (marinada)","qty":120,"unit":"g"},
    {"item":"Ajo picado (marinada)","qty":80,"unit":"g"},
    {"item":"Vinagre de arroz (marinada)","qty":120,"unit":"ml"},
    {"item":"Azucar rubia (marinada)","qty":80,"unit":"g"},
    {"item":"Sillao (glaseado)","qty":180,"unit":"ml"},
    {"item":"Azucar rubia (glaseado)","qty":240,"unit":"g"},
    {"item":"Vinagre de arroz (glaseado)","qty":100,"unit":"ml"},
    {"item":"Jengibre (glaseado)","qty":60,"unit":"g"},
    {"item":"Ajo muy fino (glaseado)","qty":32,"unit":"g"},
    {"item":"Agua (glaseado)","qty":240,"unit":"ml"},
    {"item":"Maicena","qty":20,"unit":"g"}
  ]'::jsonb,
  '[
    {"label":"Marinar (4-8 h, nunca mas de 12: se pone gomoso)","minutes":300},
    {"label":"Reducir el glaseado aparte","minutes":10},
    {"label":"Escurrir, descartar marinada y secar con papel","minutes":10},
    {"label":"Saltear en 8 tandas de 460 g, sin sobrecargar","minutes":40},
    {"label":"Glasear: apagar cuando huele a caramelo, no a quemado","minutes":4}
  ]'::jsonb,
  'La marinada NUNCA se sirve. El glaseado nunca toca pollo crudo. Reservar 150 ml de glaseado aparte. Nunca mas de 460 g por tanda de salteado. Verificar 74 C internos. Detalle completo en RECETARIO.md.',
  'semilla'
),
(
  'P06', 'Albondiga marinara', 30, 75,
  '[
    {"item":"Carne molida 15-20% grasa","qty":2000,"unit":"g"},
    {"item":"Pan del dia anterior sin corteza","qty":200,"unit":"g"},
    {"item":"Leche","qty":220,"unit":"ml"},
    {"item":"Huevo","qty":2,"unit":"unidades"},
    {"item":"Queso rallado","qty":100,"unit":"g"},
    {"item":"Ajo picado muy fino","qty":20,"unit":"g"},
    {"item":"Perejil picado","qty":25,"unit":"g"},
    {"item":"Sal","qty":24,"unit":"g"},
    {"item":"Pimienta negra","qty":4,"unit":"g"},
    {"item":"Oregano seco","qty":4,"unit":"g"},
    {"item":"Tomate pelado en lata (marinara)","qty":2500,"unit":"g"},
    {"item":"Aceite de oliva (marinara)","qty":100,"unit":"ml"},
    {"item":"Ajo (marinara)","qty":40,"unit":"g"},
    {"item":"Cebolla (marinara)","qty":200,"unit":"g"},
    {"item":"Sal (marinara)","qty":20,"unit":"g"}
  ]'::jsonb,
  '[
    {"label":"Remojar el pan en la leche hasta pasta","minutes":10},
    {"label":"Mezclar con la mano y POCO: amasar de mas da textura de salchicha","minutes":10},
    {"label":"Bolear a 25 g (90 unidades)","minutes":25},
    {"label":"Hornear a 200 C","minutes":17},
    {"label":"Sofreir ajo y cebolla, agregar tomate machacado a mano","minutes":10},
    {"label":"Reducir la marinara destapada a fuego bajo","minutes":45},
    {"label":"Terminar las albondigas dentro de la marinara caliente","minutes":15}
  ]'::jsonb,
  'La panade (pan en leche) no es relleno: es lo que mantiene la albondiga tierna. 15CM = 3 albondigas de 25 g; 30CM = 6. Punto de la marinara: la cuchara arrastrada por el fondo deja un camino que tarda en cerrarse. Detalle completo en RECETARIO.md.',
  'semilla'
);
