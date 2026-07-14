-- Unifica las calidades persistidas con las tres opciones visibles del editor.

UPDATE "CONFIGURACION"
SET "cfg_calidad_exportacion" = 'alta'
WHERE "cfg_calidad_exportacion" = 'maxima';

DO $$
DECLARE
  restriccion record;
BEGIN
  FOR restriccion IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = '"CONFIGURACION"'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%cfg_calidad_exportacion%'
  LOOP
    EXECUTE format(
      'ALTER TABLE "CONFIGURACION" DROP CONSTRAINT %I',
      restriccion.conname
    );
  END LOOP;
END
$$;

ALTER TABLE "CONFIGURACION"
ADD CONSTRAINT "configuracion_calidad_exportacion_check"
CHECK ("cfg_calidad_exportacion" IN ('baja', 'media', 'alta'));
