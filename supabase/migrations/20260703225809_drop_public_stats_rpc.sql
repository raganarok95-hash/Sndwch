-- Se eliminó la insignia de "prueba social" en el cliente (rating/estrellas no
-- ayuda a vender en un negocio de comida; el rating sigue siendo útil solo como
-- dato interno, ya visible en dashboard_aggregates para el admin) — esta función
-- ya no tiene ningún llamador.
drop function if exists public_stats();
