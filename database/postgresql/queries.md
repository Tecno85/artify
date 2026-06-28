# Inventario de Consultas para Migración PostgreSQL

Este archivo registra los ajustes principales que se deben realizar al adaptar consultas heredadas hacia `pg`.

## Estado del esquema

El archivo `schema.sql` fue validado en una instancia temporal de PostgreSQL 15.18.

Resultado:

- 5 tablas creadas: `USUARIO`, `CONFIGURACION`, `IMAGEN`, `SESION_EDICION`, `OPERACION`.
- Vista creada: `v_usuarios_activos`.
- Relaciones dependientes con `ON DELETE CASCADE`, `ON DELETE SET NULL` donde corresponde y checks para métricas no negativas.
- Índices de apoyo para analytics sobre operaciones completadas, formatos activos y sesiones finalizadas.
- `seed.sql` insertó un usuario de referencia sin credenciales reales de acceso.

## Cambios globales necesarios

| Consulta anterior | PostgreSQL requerido |
| --- | --- |
| Placeholder `?` | Placeholder `$1`, `$2`, `$3` |
| `result.insertId` | `RETURNING columna_id` |
| `result.affectedRows` | `result.rowCount` |
| `NOW()` | `CURRENT_TIMESTAMP` o `NOW()` |
| `DATE_SUB(NOW(), INTERVAL 8 HOUR)` | `CURRENT_TIMESTAMP - INTERVAL '8 hours'` |
| `HOUR(fecha)` | `EXTRACT(HOUR FROM fecha)` |
| `tinyint(1)` | `boolean` |
| `json` | `jsonb` |

## Archivos Migrados en la Primera Iteración

| Archivo | Estado | Motivo |
| --- | --- | --- |
| `backend/config/db.js` | Migrado | Usa `pg`, pool de PostgreSQL, placeholders adaptados fuera de literales SQL y compatibilidad con callbacks existentes. |
| `backend/server.js` | Migrado | Ajusta limpieza automática de sesiones, CORS configurable y cabeceras básicas de seguridad. |
| `backend/controllers/auth.controller.js` | Migrado | Registro transaccional, login con mensaje genérico, actualización de acceso e inserts con `RETURNING`. |
| `backend/controllers/sesion.controller.js` | Migrado | Inicio y cierre de sesiones con SQL compatible con PostgreSQL. |
| `backend/controllers/actividad.controller.js` | Migrado | Registro transaccional de operaciones, orden secuencial por sesión, conteos numéricos e imágenes con `RETURNING`. |
| `backend/controllers/configuracion.controller.js` | Validado | Lectura y guardado de configuración JSON funcionan con `jsonb`. |
| `backend/controllers/admin.controller.js` | Migrado | CRUD administrativo compatible con la capa PostgreSQL y creación transaccional de usuarios. |
| `backend/controllers/analytics.controller.js` | Migrado | Agregaciones, funciones de fecha y casts para devolver conteos/porcentajes numéricos. |
| `backend/tests/api.test.js` | Migrado | Suite automatizada ejecutada contra PostgreSQL temporal. |

## Decisión inicial

Mantener nombres de tablas y columnas equivalentes al modelo actual para reducir cambios funcionales. En PostgreSQL se usan comillas dobles en SQL directo cuando se referencian tablas en mayúscula. En el backend, `backend/config/db.js` conserva una capa de compatibilidad que adapta placeholders `?` a `$1`, `$2` y cita nombres de tablas antes de ejecutar las consultas con `pg`.
