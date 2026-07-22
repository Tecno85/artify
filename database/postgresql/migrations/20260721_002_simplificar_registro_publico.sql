-- Permite registrar usuarios sin recopilar cédula ni fecha de nacimiento.
-- El panel administrativo puede conservar estos datos cuando estén disponibles.

ALTER TABLE "USUARIO"
  ALTER COLUMN "usr_cedula" DROP NOT NULL,
  ALTER COLUMN "usr_fecha_nacimiento" DROP NOT NULL;
