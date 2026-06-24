# Plan de Trabajo para Artify SENA PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Base:** copia experimental de Artify SENA  
> **Objetivo:** construir una variante full-stack con backend Node.js + Express y base de datos PostgreSQL  
> **Estado:** preparación inicial

---

## 1. Objetivo

Crear una variante del proyecto Artify con PostgreSQL para facilitar un despliegue full-stack en plataformas gratuitas o de bajo costo. Esta variante se trabaja por separado para no afectar el proyecto original basado en MySQL.

---

## 2. Alcance Inicial

La primera etapa consiste en:

- Conservar el frontend actual.
- Conservar el backend como punto de partida.
- Preparar carpeta de migración PostgreSQL.
- Mantener el script MySQL como referencia.
- Definir fases antes de reemplazar dependencias o consultas.

---

## 3. Fases de Migración

| Fase | Trabajo | Resultado esperado |
| --- | --- | --- |
| 1 | Preparar proyecto experimental | Copia aislada y documentada. |
| 2 | Crear esquema PostgreSQL | `database/postgresql/schema.sql`. |
| 3 | Cambiar conexión backend | Uso de `pg` y variables PostgreSQL. |
| 4 | Adaptar consultas | Placeholders, inserts y filas afectadas. |
| 5 | Adaptar pruebas | Suite automatizada con PostgreSQL. |
| 6 | Probar localmente | Registro, login, editor y analíticas funcionando. |
| 7 | Preparar despliegue | Render, Neon, Supabase u otra plataforma PostgreSQL. |

---

## 4. Decisiones Técnicas Pendientes

| Decisión | Recomendación inicial |
| --- | --- |
| Nombres de tablas | Mantener nombres equivalentes al modelo actual para reducir cambios. |
| Driver Node.js | Usar `pg`. |
| Variables de entorno | Priorizar `DATABASE_URL` para despliegue y conservar variables separadas si son útiles en local. |
| Frontend | Servirlo desde Express en el despliegue full-stack para usar una sola URL. |
| Datos iniciales | Usar datos mínimos, no migrar usuarios reales. |

---

## 5. Criterios de Aceptación

La migración se considerará funcional cuando:

1. PostgreSQL cargue el esquema sin errores.
2. El backend se conecte correctamente a PostgreSQL.
3. Registro y login funcionen.
4. Las sesiones se registren.
5. Las operaciones del editor se guarden.
6. La configuración de usuario se pueda leer y actualizar.
7. Las rutas de analíticas respondan.
8. `pnpm run check` pase.
9. `pnpm test` pase.
10. La aplicación pueda desplegarse con backend y base de datos.

