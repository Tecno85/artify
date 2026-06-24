-- Datos mínimos para pruebas locales de Artify SENA PostgreSQL.
-- La contraseña del administrador es solo un hash de ejemplo heredado.

INSERT INTO "USUARIO" (
  "usr_id_usuario",
  "usr_nombres",
  "usr_apellidos",
  "usr_cedula",
  "usr_fecha_nacimiento",
  "usr_correo",
  "usr_contrasena",
  "usr_estado_usuario",
  "usr_rol"
) VALUES (
  1,
  'Admin',
  'Artify',
  '0000000000',
  '1990-01-01',
  'admin@artify.com',
  '$2b$10$hash_de_ejemplo_no_valido',
  'activo',
  'admin'
) ON CONFLICT ("usr_correo") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('"USUARIO"', 'usr_id_usuario'),
  COALESCE((SELECT MAX("usr_id_usuario") FROM "USUARIO"), 1),
  true
);
