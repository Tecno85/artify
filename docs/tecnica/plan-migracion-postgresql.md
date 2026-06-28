# Plan de Trabajo para Artify SENA PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Base:** copia experimental de Artify SENA  
> **Objetivo:** construir una variante full-stack con backend Node.js + Express y base de datos PostgreSQL  
> **Estado:** migración inicial funcional

---

## 1. Objetivo

En este plan organizo la migración de Artify hacia PostgreSQL para facilitar un despliegue full-stack en plataformas gratuitas o de bajo costo. Trabajo esta variante por separado para no afectar el proyecto original basado en MySQL.

---

## 2. Alcance Inicial

En la primera etapa defino el siguiente alcance:

- Conservo el frontend actual.
- Uso el backend existente como punto de partida.
- Preparo la carpeta de migración PostgreSQL.
- Mantengo el script MySQL como referencia histórica.
- Defino fases antes de reemplazar dependencias o consultas.

---

## 3. Fases de Migración

| Fase | Trabajo | Resultado esperado |
| --- | --- | --- |
| 1 | Preparo el proyecto experimental | Copia aislada y documentada. |
| 2 | Creo el esquema PostgreSQL | `database/postgresql/schema.sql`. |
| 3 | Cambio la conexión backend | Uso de `pg` y variables PostgreSQL. |
| 4 | Adapto consultas | Placeholders, inserts y filas afectadas. |
| 5 | Adapto pruebas | Suite automatizada con PostgreSQL. |
| 6 | Pruebo localmente | Registro, login, editor y analíticas funcionando. |
| 7 | Preparo despliegue | Netlify, Render y Neon PostgreSQL. |

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

Considero funcional la migración cuando:

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
