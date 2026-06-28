# CONTEXT.md — Proyecto Artify SENA PostgreSQL

> Archivo de contexto para continuar el desarrollo.
> Última actualización: Junio 2026

---

## 1. ¿Qué es Artify SENA PostgreSQL?

Artify SENA PostgreSQL es una variante separada del proyecto Artify SENA. Su objetivo es conservar el frontend HTML, CSS y JavaScript Vanilla, y adaptar el backend Node.js + Express para trabajar con PostgreSQL en lugar de MySQL.

Esta variante se creó para facilitar un despliegue full-stack de prueba en la web, con frontend estático, backend Node.js y base de datos PostgreSQL.

**Estudiante:** Ivan Dario Madrid Daza
**GitHub:** https://github.com/Tecno85/artify-sena-postgresql

---

## 2. Stack Tecnológico

### Frontend

- HTML5, CSS3, JavaScript Vanilla.
- Canvas API para manipulación de imágenes.
- SessionStorage para manejo de sesión.
- `frontend/assets/js/config.js` para configurar la URL pública del backend en despliegues.

### Backend

| Componente | Tecnología | Puerto | Estado |
| --- | --- | --- | --- |
| Servidor | Node.js | 3000 | Oficial en esta variante |
| Framework | Express.js | 3000 | Oficial en esta variante |
| Base de datos | PostgreSQL 15+ recomendado | 5432 | Oficial en esta variante |
| Conector Node.js | `pg` | backend | Oficial en esta variante |
| Gestor backend | pnpm 11.1.1 | backend | Oficial en esta variante |

### Control de versiones

- Git + GitHub.
- Commits convencionales (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Proyecto separado de `artify-sena` para no afectar la versión MySQL original.

---

## 3. Estructura Principal

```text
artify-sena-postgresql/
├── README.md
├── CONTEXT.md
├── .env.example
├── netlify.toml
│
├── frontend/
│   ├── index.html
│   ├── pages/
│   │   ├── editor.html
│   │   ├── login.html
│   │   ├── registro.html
│   │   └── admin.html
│   └── assets/
│       ├── css/
│       ├── js/
│       │   ├── config.js
│       │   ├── config.example.js
│       │   ├── auth.js
│       │   ├── editor.js
│       │   ├── login.js
│       │   ├── registro.js
│       │   └── admin.js
│       ├── icons/
│       └── images/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── tests/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── database/
│   ├── artify_db.sql
│   └── postgresql/
│       ├── README.md
│       ├── schema.sql
│       ├── seed.sql
│       └── queries.md
│
├── scripts/
│   ├── setup.sh
│   └── write-frontend-config.js
│
└── docs/
    └── tecnica/
        ├── despliegue-fullstack-postgresql.md
        ├── plan-migracion-postgresql.md
        └── otros documentos heredados del proyecto base
```

---

## 4. Base de Datos

La base principal de esta variante es PostgreSQL. Los scripts activos se encuentran en:

- `database/postgresql/schema.sql`
- `database/postgresql/seed.sql`
- `database/postgresql/queries.md`

El archivo `database/artify_db.sql` se conserva solo como referencia del modelo MySQL original.

### Objetos principales

```sql
USUARIO
CONFIGURACION
IMAGEN
SESION_EDICION
OPERACION
v_usuarios_activos
```

### Convenciones

- Las tablas conservan nombres en mayúscula para reducir cambios frente al proyecto original.
- Las columnas conservan prefijos: `usr_`, `ses_`, `opr_`, `img_`, `cfg_`.
- En PostgreSQL las tablas en mayúscula se referencian con comillas dobles.
- El backend incluye una capa de compatibilidad en `backend/config/db.js` para adaptar placeholders `?`, nombres de tablas y resultados esperados por controladores heredados.

---

## 5. Endpoints Implementados

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/login` | Login con bcrypt. Devuelve usuario autenticado y token. |
| POST | `/api/registro` | Registro con bcrypt. |

### Panel de Administración

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/admin/usuarios` | Lista todos los usuarios. |
| POST | `/api/admin/usuario` | Agrega usuario nuevo. |
| PUT | `/api/admin/usuario/:id` | Edita usuario por ID. |
| DELETE | `/api/admin/usuario/:id` | Elimina usuario y datos dependientes. |
| POST | `/api/admin/login` | Login del panel admin con token. |

### Sesiones, Operaciones e Imágenes

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/sesion/iniciar` | Inicia sesión de edición. |
| POST | `/api/sesion/cerrar` | Cierra sesión de edición. |
| POST | `/api/operacion` | Registra operación de edición. |
| POST | `/api/imagen` | Registra imagen procesada. |
| GET | `/api/estadisticas/:id` | Estadísticas del usuario. |

### API REST Analytics

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/analytics/filtros-populares` | Top filtros más usados. |
| GET | `/api/v1/analytics/horarios-edicion` | Horas pico de edición. |
| GET | `/api/v1/analytics/formatos-preferidos` | Formatos de imagen más descargados. |
| GET | `/api/v1/analytics/tasa-conversion` | Porcentaje de sesiones con cambios guardados. |

---

## 6. Variables de Entorno

### Backend Node.js

```env
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/artify_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contrasena_postgresql
DB_NAME=artify_db
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=tu_contrasena_admin
TOKEN_SECRET=cambia_este_valor_por_un_secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
```

### Frontend desplegado

```env
ARTIFY_API_URL=https://url-del-backend
```

Notas:

- El archivo `.env` real no se sube a GitHub.
- `.env.example` está en la raíz del proyecto como plantilla.
- Para despliegue, Render/Netlify deben recibir variables desde sus paneles de configuración.

---

## 7. Validación Actual

La migración inicial fue validada con:

- Carga de `database/postgresql/schema.sql`.
- Carga de `database/postgresql/seed.sql`.
- Creación de 5 tablas y la vista `v_usuarios_activos`.
- `pnpm run check`.
- `pnpm test` contra una instancia temporal de PostgreSQL.
- Resultado de pruebas automatizadas: 12/12 correctas.

---

## 8. Despliegue

La guía de despliegue full-stack se encuentra en:

```text
docs/tecnica/despliegue-fullstack-postgresql.md
```

Enfoque recomendado:

- Netlify para frontend estático.
- Render para backend Node.js.
- Neon PostgreSQL para base de datos.

---

## 9. Notas Importantes

- Las contraseñas de usuarios se guardan con bcrypt.
- El login administrativo usa `ADMIN_USER` y `ADMIN_PASSWORD` desde variables de entorno.
- El `seed.sql` no debe interpretarse como credenciales reales de acceso.
- La versión MySQL original se conserva en el repositorio `artify-sena`.
- Esta variante debe mantenerse separada para evitar mezclar motores de base de datos.

---

## 10. Historial Reciente

- [2026-06-24] Creación del proyecto separado `artify-sena-postgresql`.
- [2026-06-24] Creación del esquema inicial PostgreSQL.
- [2026-06-24] Migración inicial del backend desde `mysql2` hacia `pg`.
- [2026-06-24] Preparación de configuración frontend para despliegue con `ARTIFY_API_URL`.
- [2026-06-27] Verificación completa de la migración con PostgreSQL temporal y pruebas automatizadas.

---

*Proyecto Artify SENA PostgreSQL — Análisis y Desarrollo de Software — SENA 2026*
*Estudiante: Ivan Dario Madrid Daza*
