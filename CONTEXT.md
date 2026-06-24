# CONTEXT.md — Proyecto Artify

> Archivo de contexto para continuar el desarrollo.
> Última actualización: Mayo 2026

---

## 1. ¿Qué es Artify?

Artify es un editor de imágenes web full stack desarrollado como proyecto académico del programa **Análisis y Desarrollo de Software del SENA (Colombia)**.

**Estudiante:** Ivan Dario Madrid Daza
**GitHub:** https://github.com/Tecno85/artify-sena

Permite a los usuarios editar imágenes directamente en el navegador con autenticación real, gestión de sesiones, panel de administración y **API REST para consumo de terceros**.

---

## 2. Stack Tecnológico

### Frontend
- HTML5, CSS3, JavaScript Vanilla
- Canvas API para manipulación de imágenes
- SessionStorage para manejo de sesión

### Backend
| Componente | Tecnología | Puerto | Estado            |
| ---------- | ---------- | ------ | ----------------- |
| Servidor   | Node.js    | 3000   | Oficial y único |
| Framework  | Express.js | 3000   | Oficial y único |
| BD         | MySQL 8.0+ | 3306   | Oficial y único |
| Paquetes   | pnpm 11.1.1 | backend | Oficial y único |

### Control de versiones
- Git + GitHub
- Convención: Ramas feature + Pull Requests
- Commits convencionales (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)

---

## 3. Estructura del Proyecto

```
Artify/
├── README.md
├── LICENSE
├── CONTEXT.md              # Este archivo
├── .gitignore
├── .env.example            # Plantilla de variables de entorno
│
├── frontend/
│   ├── index.html
│   ├── pages/
│   │   ├── editor.html     # Editor de imágenes
│   │   ├── login.html      # Inicio de sesión
│   │   ├── registro.html   # Registro de usuario
│   │   └── admin.html      # Panel de administración CRUD
│   └── assets/
│       ├── css/            # admin.css, editor.css, login.css, registro.css, index.css
│       └── js/             # auth.js, admin.js, editor.js, login.js, registro.js
│
├── backend/                # Node.js + Express modular (puerto 3000)
│   ├── config/             # Configuración de conexión a MySQL
│   ├── controllers/        # Lógica por recurso
│   ├── middlewares/        # Tokens, roles y validaciones de acceso
│   ├── routes/             # Endpoints por dominio
│   ├── utils/              # Helpers de token y configuración
│   ├── server.js           # Arranque del servidor y montaje de rutas
│   ├── .env
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── database/
│   └── artify_db.sql       # Script SQL completo
│
├── scripts/                # Automatización
│   └── setup.sh            # Script de configuración inicial
│
├── docs/
│   ├── proyecto/
│   │   ├── descripcion-proyecto.md
│   │   └── requerimientos-funcionales.md
│   ├── tecnica/
│   │   ├── arquitectura.md        # Arquitectura técnica del sistema
│   │   ├── api-analytics.md       # Documentación API REST Analytics
│   │   ├── base-datos.md          # Modelo y estructura de MySQL
│   │   ├── coding-standards.md    # Estándares Node.js + JavaScript
│   │   ├── despliegue.md          # Ejecución local y despliegue técnico
│   │   └── plan-pruebas-autenticacion.md
│
└── skills/
    └── artify-sena/
        ├── SKILL.md               # Skill oficial de trabajo con Codex
        └── agents/openai.yaml     # Metadata del skill
```

---

## 4. Base de Datos

### Tablas de `artify_db`

```sql
-- Entidad fuerte no dependiente
USUARIO (
  usr_id_usuario      INT PK AUTO_INCREMENT,
  usr_nombres         VARCHAR(100),
  usr_apellidos       VARCHAR(100),
  usr_cedula          VARCHAR(20) UNIQUE,
  usr_fecha_nacimiento DATE,
  usr_correo          VARCHAR(150) UNIQUE,
  usr_contrasena      VARCHAR(255),    -- encriptada con bcrypt
  usr_fecha_registro  DATETIME,
  usr_ultimo_acceso   DATETIME,
  usr_sesion_activa   TINYINT(1),
  usr_estado_usuario  ENUM('activo','inactivo','suspendido'),
  usr_rol             ENUM('usuario','admin')
)

-- Tablas dependientes de USUARIO
SESION_EDICION   → ses_usr_id_usuario FK → USUARIO
OPERACION        → opr_usr_id_usuario FK → USUARIO
IMAGEN           → img_usr_id_usuario FK → USUARIO
CONFIGURACION    → cfg_usr_id_usuario FK → USUARIO (UNIQUE)

-- Vista
v_usuarios_activos → resumen de USUARIO + IMAGEN + SESION_EDICION
```

### Convención de nombres en BD
- Tablas en MAYÚSCULAS: `USUARIO`, `SESION_EDICION`
- Columnas con prefijo de tabla: `usr_`, `ses_`, `opr_`, `img_`, `cfg_`

---

## 5. Endpoints Implementados

### Autenticación
| Método | Ruta            | Descripción                                                |
| ------ | --------------- | ---------------------------------------------------------- |
| POST   | `/api/login`    | Login con bcrypt. Devuelve usuario autenticado y token     |
| POST   | `/api/registro` | Registro con bcrypt                                        |

### Panel de Administración (CRUD sobre USUARIO)
| Método | Ruta                     | Descripción               |
| ------ | ------------------------ | ------------------------- |
| GET    | `/api/admin/usuarios`    | Lista todos los usuarios  |
| POST   | `/api/admin/usuario`     | Agrega usuario nuevo      |
| PUT    | `/api/admin/usuario/:id` | Edita usuario por ID      |
| DELETE | `/api/admin/usuario/:id` | Elimina usuario (cascada) |
| POST   | `/api/admin/login`       | Login del panel admin con token |

### Sesiones y Operaciones
| Método | Ruta                    | Descripción                   |
| ------ | ----------------------- | ----------------------------- |
| POST   | `/api/sesion/iniciar`   | Inicia sesión de edición      |
| POST   | `/api/sesion/cerrar`    | Cierra sesión de edición      |
| POST   | `/api/operacion`        | Registra operación de edición |
| POST   | `/api/imagen`           | Registra imagen procesada     |
| GET    | `/api/estadisticas/:id` | Estadísticas del usuario      |

### API REST Analytics (Nuevos - v1.0)
| Método | Ruta                                    | Descripción                        |
| ------ | --------------------------------------- | ---------------------------------- |
| GET    | `/api/v1/analytics/filtros-populares`   | Top filtros más usados             |
| GET    | `/api/v1/analytics/horarios-edicion`    | Horas pico de edición              |
| GET    | `/api/v1/analytics/formatos-preferidos` | Formatos de imagen más descargados |
| GET    | `/api/v1/analytics/tasa-conversion`     | % sesiones con cambios guardados   |

---

## 6. Funcionalidades Implementadas

### Autenticación y roles
- Registro con bcrypt
- Login con validación bcrypt
- Tokens firmados por backend para rutas protegidas
- Redirección por rol: `admin` → `admin.html`, `usuario` → `editor.html`
- Control de sesión activa
- Cierre automático de sesiones inactivas (cron job, 8h límite)

### Editor de imágenes
- Drag & drop para subir imágenes
- Recortar con proporciones (libre, 1:1, 16:9, 4:3, 3:2)
- Redimensionar con bloqueo de proporción
- Rotar (90°, 180°, 270°)
- Filtros: Blanco y Negro, Sepia, Brillo, Contraste, Convertir
- Deshacer/Rehacer (hasta 20 pasos)
- Zoom 50%-200%
- Registro de operaciones en MySQL

### Panel de administración
- Login protegido con credenciales en `.env`
- CRUD completo sobre tabla USUARIO
- Búsqueda en tiempo real
- Estadísticas de usuarios activos/inactivos
- Columna de rol (admin/usuario)

### API REST Analytics
- 4 endpoints de analytics (filtros, horarios, formatos, conversión)
- Documentación completa en `docs/tecnica/api-analytics.md`
- Respuestas en formato JSON estructurado
- Código completamente comentado
- Versión v1 (permite futuras versiones sin conflictos)

---

## 7. Lógica Funcional Principal

La lógica funcional del proyecto es la **redirección por rol después del login**:

```javascript
// frontend/assets/js/login.js
if (data.usuario.rol === 'admin') {
  window.location.href = './admin.html';  // Va a frontend/pages/admin.html
} else {
  window.location.href = './editor.html'; // Va a frontend/pages/editor.html
}
```

---

## 8. Variables de Entorno

### Backend Node.js (`backend/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=contraseña
DB_NAME=artify_db
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=contraseña_admin
TOKEN_SECRET=secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
```

### Importante
- El archivo `.env` **NUNCA** se sube a GitHub
- Usar `.env.example` como plantilla
- Cada dev crea su propio `.env` local

---

## 9. Operación Local

- Para instalación y arranque, consulta `README.md`.
- Este archivo solo mantiene la referencia del estado actual del proyecto y de los endpoints activos.
- Las pruebas rápidas recomendadas son:
  - login usuario
  - login admin
  - eliminación de usuario desde admin
  - analytics públicas sin token

---

## 10. Versionamiento con Git

- Se usa flujo con ramas `feature/*` y Pull Requests.
- Los commits siguen la convención `tipo(scope): descripción`.

---

## 11. Notas Importantes

- Las contraseñas siempre se encriptan con **bcrypt**
- La eliminación de usuarios se ejecuta en **transacción** y en este orden: OPERACION → SESION_EDICION → IMAGEN → CONFIGURACION → USUARIO
- El backend oficial es **Node.js + Express modular**
- Las tablas usan MAYÚSCULAS por convención del instructor del SENA
- Todos los endpoints tienen comentarios detallados en el código
- La API REST Analytics es consumible por e-commerce externos

---

## 12. Historial de Cambios Recientes

- [2026-04-22] Reorganización de estructura del proyecto
- [2026-04-22] Modularización del backend y protección de rutas con token
- [2026-04-22] Creación de API REST Analytics (4 endpoints)
- [2026-04-22] Creación de scripts de automatización (setup.sh)
- [2026-04-21] Normalización de comentarios en backend modular y auth frontend
- [2026-04-20] Creación de documentación api-analytics.md

---

*Proyecto Artify — Análisis y Desarrollo de Software — SENA 2026*
*Estudiante: Ivan Dario Madrid Daza*
