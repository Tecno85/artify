-- Línea base no destructiva del esquema funcional existente.
-- El ejecutor envuelve este archivo en una transacción y registra su versión.

DO $$
BEGIN
  IF to_regclass('"USUARIO"') IS NULL
    OR to_regclass('"CONFIGURACION"') IS NULL
    OR to_regclass('"IMAGEN"') IS NULL
    OR to_regclass('"SESION_EDICION"') IS NULL
    OR to_regclass('"OPERACION"') IS NULL
    OR to_regclass('"v_usuarios_activos"') IS NULL THEN
    RAISE EXCEPTION 'El esquema inicial de Artify está incompleto';
  END IF;
END
$$;
