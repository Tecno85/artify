# Migraciones PostgreSQL

Esta carpeta contiene cambios incrementales que actualizan una base existente sin ejecutar nuevamente `schema.sql`.

## Reglas

- El nombre usa `AAAAMMDD_NNN_descripcion.sql`.
- Cada migración debe ser pequeña, reversible cuando sea posible y no debe incluir `BEGIN` ni `COMMIT`.
- El ejecutor aplica cada archivo dentro de una transacción.
- La tabla técnica `MIGRACION_ESQUEMA` registra las versiones aplicadas.
- `schema.sql` continúa siendo únicamente para instalaciones nuevas o reinicios controlados.
- Antes de aplicar una migración remota debo crear y verificar un respaldo.

## Consultar el plan

Desde la raíz del repositorio:

```bash
node scripts/ejecutar-migraciones.js
```

Este comando solo muestra los archivos disponibles y no modifica PostgreSQL.

## Aplicar localmente

```bash
node scripts/ejecutar-migraciones.js --apply
```

La configuración se toma de `backend/.env`. Para un host remoto también se exige una confirmación explícita:

```bash
ALLOW_REMOTE_MIGRATIONS=true node scripts/ejecutar-migraciones.js --apply
```

La confirmación no sustituye el respaldo ni la revisión del SQL.
