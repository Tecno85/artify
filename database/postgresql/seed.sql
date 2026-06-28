-- Datos mínimos de referencia para Artify SENA PostgreSQL.
-- Este registro permite verificar que el seed carga correctamente.
-- No corresponde a credenciales reales de acceso.
-- El acceso administrativo real usa ADMIN_USER y ADMIN_PASSWORD del entorno.

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
  'Referencia',
  'Migracion',
  '0000000000',
  '1990-01-01',
  'referencia.seed@artify.local',
  '$2b$10$hash_de_ejemplo_no_valido',
  'activo',
  'usuario'
) ON CONFLICT ("usr_correo") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('"USUARIO"', 'usr_id_usuario'),
  COALESCE((SELECT MAX("usr_id_usuario") FROM "USUARIO"), 1),
  true
);
