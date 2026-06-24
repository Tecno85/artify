# Inventario de Consultas para Migración PostgreSQL

Este archivo registra los ajustes principales que se deben realizar al migrar consultas desde `mysql2` hacia `pg`.

## Estado del esquema

El archivo `schema.sql` fue validado en una instancia temporal de PostgreSQL 15.18.

Resultado:

- 5 tablas creadas: `USUARIO`, `CONFIGURACION`, `IMAGEN`, `SESION_EDICION`, `OPERACION`.
- Vista creada: `v_usuarios_activos`.
- `seed.sql` insertó un usuario administrador de referencia.

## Cambios globales necesarios

| MySQL actual | PostgreSQL requerido |
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
| `backend/config/db.js` | Migrado | Usa `pg`, pool de PostgreSQL, placeholders adaptados y compatibilidad con callbacks existentes. |
| `backend/server.js` | Migrado | Ajusta limpieza automática de sesiones con intervalo compatible con PostgreSQL. |
| `backend/controllers/auth.controller.js` | Migrado | Registro, login, actualización de acceso e inserts con `RETURNING`. |
| `backend/controllers/sesion.controller.js` | Migrado | Inicio y cierre de sesiones con SQL compatible con PostgreSQL. |
| `backend/controllers/actividad.controller.js` | Migrado | Registro de operaciones e imágenes con `RETURNING`. |
| `backend/controllers/configuracion.controller.js` | Validado | Lectura y guardado de configuración JSON funcionan con `jsonb`. |
| `backend/controllers/admin.controller.js` | Migrado | CRUD administrativo compatible con la capa PostgreSQL. |
| `backend/controllers/analytics.controller.js` | Migrado | Agregaciones y funciones de fecha adaptadas. |
| `backend/tests/api.test.js` | Migrado | Suite automatizada ejecutada contra PostgreSQL temporal. |

## Decisión inicial

Mantener nombres de tablas y columnas equivalentes al modelo actual para reducir cambios funcionales. En PostgreSQL se usarán comillas dobles en consultas cuando se referencien tablas en mayúscula.
