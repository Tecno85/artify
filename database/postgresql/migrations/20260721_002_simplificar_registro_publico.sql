-- Compatibilidad para instalaciones creadas antes de la simplificación del registro.
-- Las comprobaciones permiten ejecutar el historial sobre el esquema actual, donde
-- estos campos ya no existen.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'USUARIO'
      AND column_name = 'usr_cedula'
  ) THEN
    ALTER TABLE "USUARIO" ALTER COLUMN "usr_cedula" DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'USUARIO'
      AND column_name = 'usr_fecha_nacimiento'
  ) THEN
    ALTER TABLE "USUARIO" ALTER COLUMN "usr_fecha_nacimiento" DROP NOT NULL;
  END IF;
END
$$;
