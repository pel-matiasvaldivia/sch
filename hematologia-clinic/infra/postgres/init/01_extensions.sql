-- Extensiones necesarias para la base de datos de Hematología
-- Este script se ejecuta automáticamente en el primer inicio del contenedor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- Búsqueda sin acentos (pacientes por apellido)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Búsqueda por similitud (trigrams)

-- Configurar búsqueda full-text en español argentino
-- Se usa para búsqueda de nombres y campos de texto libre
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'spanish_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
        ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
            ALTER MAPPING FOR hword, hword_part, word
            WITH unaccent, spanish_stem;
    END IF;
END
$$;
