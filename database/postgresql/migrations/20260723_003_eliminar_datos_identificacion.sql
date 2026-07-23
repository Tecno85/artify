-- Elimina datos personales que Artify no necesita para operar.
-- IF EXISTS mantiene la migración compatible con instalaciones nuevas.

ALTER TABLE "USUARIO"
  DROP COLUMN IF EXISTS "usr_cedula",
  DROP COLUMN IF EXISTS "usr_fecha_nacimiento";
