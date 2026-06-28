# Plan de Trabajo para Artify SENA PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Base:** versión oficial con PostgreSQL
> **Objetivo:** documentar el proceso seguido para consolidar backend Node.js + Express y base de datos PostgreSQL
> **Estado:** migración completada y formalizada

---

## 1. Objetivo

En este documento registro el proceso seguido para consolidar Artify SENA PostgreSQL como versión oficial con backend Node.js + Express y base de datos PostgreSQL. El repositorio se mantiene separado del proyecto base anterior por trazabilidad histórica, no porque PostgreSQL sea una versión provisional.

---

## 2. Alcance Consolidado

El alcance consolidado de esta versión es:

- Conservo el frontend actual.
- Uso PostgreSQL como motor oficial de base de datos.
- Mantengo `database/postgresql/schema.sql` como esquema activo.
- Mantengo `database/artify_db.sql` solo como referencia histórica del modelo anterior.
- Documento despliegue full-stack con Netlify, Render y Neon.
- Valido backend, autenticación, analytics y despliegue con pruebas automatizadas.

---

## 3. Fases de Migración

| Fase | Trabajo | Resultado esperado |
| --- | --- | --- |
| 1 | Preparo el repositorio PostgreSQL | Repositorio separado por trazabilidad histórica. |
| 2 | Creo el esquema PostgreSQL | `database/postgresql/schema.sql`. |
| 3 | Cambio la conexión backend | Uso de `pg` y variables PostgreSQL. |
| 4 | Adapto consultas | Placeholders, inserts y filas afectadas. |
| 5 | Adapto pruebas | Suite automatizada con PostgreSQL. |
| 6 | Pruebo localmente | Registro, login, editor y analíticas funcionando. |
| 7 | Preparo despliegue | Netlify, Render y Neon PostgreSQL. |
| 8 | Formalizo PostgreSQL | Documentación y estado del proyecto presentan PostgreSQL como motor oficial. |

---

## 4. Decisiones Técnicas

| Decisión | Criterio aplicado |
| --- | --- |
| Nombres de tablas | Mantengo nombres equivalentes al modelo actual para reducir cambios. |
| Driver Node.js | Uso `pg`. |
| Variables de entorno | Priorizo `DATABASE_URL` para despliegue y conservo variables separadas si son útiles en local. |
| Frontend | Lo despliego como sitio estático y configuro `ARTIFY_API_URL` para conectar con el backend. |
| Datos iniciales | Uso datos mínimos de referencia y no migro usuarios reales. |

---

## 5. Criterios de Aceptación

Considero formalizada la versión PostgreSQL cuando:

1. Cargo el esquema PostgreSQL sin errores.
2. Conecto el backend correctamente a PostgreSQL.
3. Verifico que registro y login funcionen.
4. Confirmo que las sesiones se registren.
5. Confirmo que las operaciones del editor se guarden.
6. Verifico que la configuración de usuario se pueda leer y actualizar.
7. Confirmo que las rutas de analíticas respondan.
8. Ejecuto `pnpm run check` correctamente.
9. Ejecuto `pnpm test` correctamente.
10. Preparo la aplicación para desplegarse con backend y base de datos.
11. La documentación principal presenta PostgreSQL como motor oficial, no como experimento.
