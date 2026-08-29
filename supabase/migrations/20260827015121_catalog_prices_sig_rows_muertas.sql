-- Segunda mitad de la migración catalog_items: las filas 'sig' de catalog_prices quedan
-- muertas porque loadCatalogItems() corre después y sobreescribe esos mismos precios.
-- Dejarlas sería reintroducir el problema que esta migración elimina: dos fuentes para el
-- mismo número, con una ganando en silencio.
delete from catalog_prices where category = 'sig';
