\set ON_ERROR_STOP on

-- Promueve a administrador un usuario ya registrado en Artify.
-- Uso:
-- psql "$DATABASE_URL" -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql

UPDATE "USUARIO"
SET "usr_rol" = 'admin'
WHERE "usr_correo" = :'correo';

SELECT
  "usr_id_usuario",
  "usr_correo",
  "usr_estado_usuario",
  "usr_rol"
FROM "USUARIO"
WHERE "usr_correo" = :'correo';
