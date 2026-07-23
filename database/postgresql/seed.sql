-- Datos mínimos de referencia para Artify.
-- Este registro permite verificar que el seed carga correctamente.
-- No corresponde a credenciales reales de acceso.
-- El acceso administrativo se realiza desde el login principal con un usuario
-- de la tabla "USUARIO" cuyo campo "usr_rol" sea 'admin'.

INSERT INTO "USUARIO" (
  "usr_id_usuario",
  "usr_nombres",
  "usr_apellidos",
  "usr_correo",
  "usr_contrasena",
  "usr_estado_usuario",
  "usr_rol"
) VALUES (
  1,
  'Referencia',
  'Migracion',
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
