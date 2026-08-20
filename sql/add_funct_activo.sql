-- Agregar columna a funct para soportar eliminación lógica.
ALTER TABLE funct ADD COLUMN activo TINYINT(1) DEFAULT 1 AFTER name;
