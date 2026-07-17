-- Optimiza la consulta paginada del historial de operaciones por usuario.

CREATE INDEX IF NOT EXISTS "idx_operacion_usuario_fecha"
  ON "OPERACION" (
    "opr_usr_id_usuario",
    "opr_fecha_hora" DESC,
    "opr_id_operacion" DESC
  );
