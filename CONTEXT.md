# CONTEXT.md — Proyecto Artify

> Archivo de contexto para continuar el desarrollo.
> Última actualización: Julio 2026

---

## 1. ¿Qué es Artify?

Artify es una aplicación web de edición de imágenes con backend Node.js + Express y base de datos PostgreSQL. Conserva el frontend HTML, CSS y JavaScript Vanilla, y usa `pg` como conector PostgreSQL del backend.

PostgreSQL es el motor oficial de persistencia de esta versión.

**Estudiante:** Ivan Dario Madrid Daza
**GitHub:** https://github.com/Tecno85/artify

---

## 2. Stack Tecnológico

### Frontend

- HTML5, CSS3, JavaScript Vanilla.
- Canvas API para manipulación de imágenes.
- `sessionStorage` para manejo de sesión.
- `frontend/assets/js/config.js` para configurar la URL pública del backend en despliegues.
- Layout de escritorio con modos verticales compactos en inicio, login y editor para ventanas desde 1024 x 600 px; registro conserva scroll vertical por la extensión del formulario.
- El editor habilita sus controles sin esperar el arranque del backend; la sesión de edición y las preferencias se inicializan en segundo plano.
- La carga admite JPG, PNG y WebP de hasta 10 MB, 16 MP y 8192 px por lado para proteger la memoria usada por Canvas y los filtros.

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
- Este repositorio `artify` es la referencia oficial; la versión histórica del proyecto base se conserva fuera de este repositorio.

---

## 3. Estructura Principal

```text
artify/
├── README.md
├── CONTEXT.md
├── .env.example
├── .github/
│   └── workflows/
│       ├── backend-tests.yml
│       └── deploy-pages.yml
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
        ├── despliegue.md
        ├── plan-instalacion-artify.md
        ├── plan-mantenimiento-soporte-artify.md
        ├── plan-migracion-postgresql.md
        └── otros documentos heredados del proyecto base
```

---

## 4. Base de Datos

La base principal de esta variante es PostgreSQL. Los scripts activos se encuentran en:

- `database/postgresql/schema.sql`
- `database/postgresql/seed.sql`
- `database/postgresql/queries.md`

Los dumps históricos del motor anterior no forman parte del repositorio activo. La trazabilidad técnica se conserva en la documentación y los únicos scripts SQL versionados son los artefactos PostgreSQL de `database/postgresql/`.

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
- El backend incluye una capa de compatibilidad en `backend/config/db.js` para adaptar placeholders `?` a `$1`, `$2`, citar tablas en mayúscula y normalizar resultados como `insertId` y `affectedRows` para no romper controladores heredados.

---

## 5. Endpoints Implementados

### Salud del Servicio

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Verifica que el proceso Express esté activo sin depender de PostgreSQL. |
| GET | `/ready` | Verifica que el proceso Express pueda consultar PostgreSQL. |

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

El panel administrativo no tiene login independiente. El usuario entra por `/api/login`; si el usuario autenticado tiene `usr_rol = 'admin'`, el frontend lo redirige a `admin.html` y el backend autoriza el CRUD con el token JWT.

El login rechaza cuentas inactivas o suspendidas. En las rutas privadas, el backend vuelve a consultar el estado y el rol actuales del usuario para invalidar tokens de cuentas suspendidas, eliminadas o cuyo rol haya cambiado.

### Configuración de Usuario

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/configuracion/:id` | Consulta las preferencias del usuario autenticado. |
| POST | `/api/configuracion` | Guarda las preferencias del usuario autenticado. |

### Sesiones, Operaciones e Imágenes

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/sesion/iniciar` | Inicia sesión de edición. |
| POST | `/api/sesion/cerrar` | Cierra sesión de edición. |
| POST | `/api/operacion` | Registra operación de edición. |
| GET | `/api/operacion/total/:id` | Consulta el total de operaciones del usuario. |
| POST | `/api/imagen` | Registra imagen procesada. |
| GET | `/api/estadisticas/:id` | Estadísticas del usuario. |

### API REST Analytics

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/analytics/filtros-populares` | Top filtros más usados. |
| GET | `/api/v1/analytics/horarios-edicion` | Horas pico de edición. |
| GET | `/api/v1/analytics/formatos-preferidos` | Formatos de imagen más descargados. |
| GET | `/api/v1/analytics/tasa-conversion` | Porcentaje de sesiones con cambios guardados. |

Los filtros se agrupan por el nombre real guardado en los parámetros de la operación. Los formatos se calculan a partir de descargas registradas, y una descarga correcta marca `ses_cambios_guardados = true` en su sesión.

---

## 6. Variables de Entorno

### Backend Node.js

```env
# Para despliegues administrados:
# DATABASE_URL=postgresql://usuario:contrasena@host:5432/artify_db?sslmode=require

# Para instalación local:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contrasena_postgresql
DB_NAME=artify_db
TOKEN_SECRET=cambia_este_valor_por_un_secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080
```

`DATABASE_URL` es la variable principal para despliegues como Render o Neon y permanece comentada en la configuración local. Para ejecutar Artify localmente uso `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

`CORS_ORIGIN` controla los orígenes autorizados para consumir el backend. En desarrollo puede contener varios orígenes separados por coma; en producción debe apuntar al frontend publicado.

### Frontend desplegado

```env
ARTIFY_API_URL=https://url-del-backend
```

Notas:

- El archivo `.env` real no se sube a GitHub.
- `.env.example` está en la raíz del proyecto como plantilla.
- Para despliegue, GitHub Actions y Render reciben variables desde sus paneles de configuración.

---

## 7. Validación Actual

La versión PostgreSQL fue validada con:

- Carga de `database/postgresql/schema.sql`.
- Carga de `database/postgresql/seed.sql`.
- Creación de 5 tablas y la vista `v_usuarios_activos`.
- Integridad referencial con cascadas PostgreSQL, checks de valores no negativos e índices para analytics.
- Login con mensaje genérico ante credenciales inválidas, límite de intentos y CORS configurable por entorno.
- Endpoint de salud `GET /health` para verificación de despliegue.
- `pnpm run check`.
- `pnpm test` contra una instancia temporal de PostgreSQL.
- Guardia previa a las pruebas: exige `NODE_ENV=test`, confirmación explícita,
  base terminada en `_test` y autorización adicional para hosts remotos.
- Resultado de pruebas automatizadas: 18/18 correctas.
- Validación previa de tamaño, megapíxeles y dimensiones antes de asignar una imagen al Canvas.
- Auditoría de dependencias de producción sin vulnerabilidades conocidas.
- Flujo de GitHub Actions para ejecutar PostgreSQL, sintaxis y pruebas en `push` o `pull_request`.

---

## 8. Despliegue

La guía del despliegue público se encuentra en:

```text
docs/tecnica/despliegue.md
```

La instalación y ejecución local se documentan en `docs/tecnica/plan-instalacion-artify.md`.

Enfoque recomendado:

- GitHub Pages para frontend estático.
- Render para backend Node.js.
- Neon PostgreSQL para base de datos.
- Health check público: `GET /health`.
- En producción se recomienda usar `DATABASE_URL`, `TOKEN_SECRET`, `NODE_VERSION`, `NODE_ENV` y `CORS_ORIGIN`.
- `schema.sql` elimina y recrea objetos; solo se ejecuta para carga inicial o reinicio controlado con respaldo previo.

### Despliegue público validado

Validación técnica realizada el 13 de julio de 2026:

| Servicio | URL |
| --- | --- |
| Frontend GitHub Pages | `https://tecno85.github.io/artify/` |
| Backend Render | `https://artify-sena-postgresql.onrender.com` |

Estado validado:

- GitHub Pages responde HTTP `200`.
- `frontend/assets/js/config.js` publicado contiene `ARTIFY_API_URL=https://artify-sena-postgresql.onrender.com`.
- Render responde `GET /health` con `ok: true` y `entorno: production`.
- Analytics responde `ok: true`.
- El CSS publicado conserva el ajuste reciente de fondo principal negro.
- CORS permite el origen `https://tecno85.github.io`.
- Cada `push` a `main` publica `frontend/` mediante `.github/workflows/deploy-pages.yml`.

Variables cruzadas requeridas:

```env
# GitHub Actions: variable del repositorio
ARTIFY_API_URL=https://artify-sena-postgresql.onrender.com

# Render
CORS_ORIGIN=https://tecno85.github.io
```

---

## 9. Notas Importantes

- Las contraseñas de usuarios se guardan con bcrypt.
- Las respuestas de login no diferencian si falló el correo o la contraseña.
- El acceso administrativo usa el login principal con un usuario de base de datos cuyo `usr_rol` sea `admin`.
- El `seed.sql` no debe interpretarse como credenciales reales de acceso.
- La versión histórica del proyecto base se conserva fuera de este repositorio.
- Este repositorio debe mantenerse como referencia oficial de Artify con PostgreSQL.

---

## 10. Historial Reciente

- [2026-06-24] Inicio de la consolidación del proyecto con PostgreSQL.
- [2026-06-24] Creación del esquema inicial PostgreSQL.
- [2026-06-24] Migración del backend hacia PostgreSQL mediante `pg`.
- [2026-06-24] Preparación de configuración frontend para despliegue con `ARTIFY_API_URL`.
- [2026-06-27] Verificación completa de la migración con PostgreSQL temporal y pruebas automatizadas.
- [2026-06-28] Formalización de PostgreSQL como motor oficial de esta versión.
- [2026-07-04] Validación inicial del despliegue público full-stack y documentación del proceso replicable para evidencia en video.
- [2026-07-07] Renombrado del repositorio y carpeta local a `artify`.
- [2026-07-08] Documentación de plan de migración y respaldo de datos de Artify con referencia en ISO 27001 para evidencia GA10-220501097-AA9.
- [2026-07-09] Revalidación del despliegue público y corrección de URLs operativas.
- [2026-07-09] Corrección de estado de cuentas, sesiones, descargas, analytics, validaciones y cobertura automatizada.
- [2026-07-09] Ajuste responsive del editor para portátiles de 1366 x 768 y validación por tamaño útil de ventana.
- [2026-07-09] Ajuste responsive de inicio para portátiles con poca altura útil; login y registro conservan su diseño original.
- [2026-07-10] Vista previa de filtros al mover su control, escalas neutras específicas y confirmación única en historial y PostgreSQL.
- [2026-07-11] Responsive por altura del login sin scroll en condiciones normales y header alineado con inicio; registro conserva desplazamiento vertical.
- [2026-07-12] Migración del frontend a GitHub Pages mediante GitHub Actions, con Render y Neon como servicios de backend y datos.
- [2026-07-13] Revisión integral y alineación de la documentación con el despliegue, las pruebas y el comportamiento actuales.
- [2026-07-13] Consolidación de la instalación local en `plan-instalacion-artify.md` y del despliegue público en `despliegue.md`.
- [2026-07-13] Reestructuración del plan local con preparación separada para Windows y macOS, flujo común y configuración `DB_*` sin `DATABASE_URL` activa.
- [2026-07-13] Protección de la suite de integración para impedir mutaciones sobre bases de producción o mal identificadas.
- [2026-07-13] Retiro del dump histórico del estado actual del repositorio para conservar únicamente artefactos PostgreSQL y datos de referencia controlados.
- [2026-07-13] Inicio no bloqueante del editor, límites seguros de imagen y corrección de mensajes accesibles en el registro.

---

*Proyecto Artify — Análisis y Desarrollo de Software — SENA 2026*
*Estudiante: Ivan Dario Madrid Daza*
