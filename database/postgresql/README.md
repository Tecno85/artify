# Migración PostgreSQL

Esta carpeta contiene los artefactos de trabajo para migrar Artify desde MySQL hacia PostgreSQL.

## Estado

Proyecto experimental creado a partir de `artify-sena`.

El backend ya cuenta con una migración inicial funcional a PostgreSQL mediante `pg`. El esquema y las pruebas automatizadas se validaron contra una instancia temporal de PostgreSQL.

## Archivos previstos

| Archivo | Propósito |
| --- | --- |
| `schema.sql` | Esquema PostgreSQL equivalente al modelo actual. |
| `seed.sql` | Datos mínimos para pruebas locales. |
| `queries.md` | Inventario de consultas adaptadas o pendientes. |

## Ejecución local prevista

```bash
createdb artify_db
psql -d artify_db -f database/postgresql/schema.sql
psql -d artify_db -f database/postgresql/seed.sql
```

## Reglas

- Mantener `database/artify_db.sql` como referencia del modelo MySQL original.
- No eliminar pruebas existentes durante la migración.
- Validar registro, login, sesiones, configuración, operaciones y analíticas antes de considerar completa la migración.
