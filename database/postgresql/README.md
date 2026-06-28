# Migración PostgreSQL

Esta carpeta contiene los artefactos de trabajo para ejecutar Artify con PostgreSQL.

## Estado

Proyecto experimental creado a partir de `artify-sena`.

El backend ya cuenta con una migración funcional a PostgreSQL mediante `pg`. El esquema incluye reglas de integridad, cascadas, checks e índices de apoyo para analytics. Las pruebas automatizadas se validan contra PostgreSQL.

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

Verificación:

```sql
\l
\c artify_db
\dt
\dv
```

## Reglas

- Mantener `database/postgresql/schema.sql` como esquema activo de la variante PostgreSQL.
- Recordar que `schema.sql` crea objetos dentro de una base existente; la base se crea antes con `createdb artify_db` o desde el proveedor elegido.
- Ejecutar `schema.sql` solo para carga inicial o reinicio controlado, porque elimina y vuelve a crear tablas y vista del proyecto.
- Tratar `seed.sql` como datos mínimos de referencia, no como credenciales reales ni usuario administrador válido.
- Conservar las cascadas y restricciones `CHECK` cuando se agreguen nuevas relaciones o campos numéricos.
- Mantener índices coherentes con los endpoints de analytics antes de agregar nuevas consultas agregadas.
- No eliminar pruebas existentes durante la migración.
- Validar registro, login, sesiones, configuración, operaciones y analíticas antes de considerar completa la migración.
