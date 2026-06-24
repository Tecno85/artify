#  ![Logo del Proyecto](./frontend/assets/icons/modx.svg) Artify SENA PostgreSQL — Editor de Imágenes Web

<div align="center">

![Version](https://img.shields.io/badge/versión-2.0.0-4ae3f4?style=for-the-badge)
![Status](https://img.shields.io/badge/estado-activo-28ffce?style=for-the-badge)
![License](https://img.shields.io/badge/licencia-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-22.13+-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-en_migración-4169E1?style=for-the-badge&logo=postgresql)

**Artify SENA PostgreSQL** es una variante experimental de Artify para migrar el backend desde MySQL hacia PostgreSQL. Conserva el frontend HTML, CSS y JavaScript vanilla, y tiene como objetivo usar Node.js + Express + PostgreSQL en el backend.

Proyecto experimental local para migración a PostgreSQL

</div>

---

> **Estado de migración:** el frontend ya fue copiado desde Artify SENA. El backend aún conserva código MySQL heredado y será migrado por fases hacia PostgreSQL.

---

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso](#uso)
- [Pruebas](#pruebas)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Panel de Administración](#panel-de-administración)
- [Base de Datos](#base-de-datos)
- [Navegadores Soportados](#navegadores-soportados)
- [Documentación](#documentación)
- [Estándares de Codificación](#estándares-de-codificación)
- [Notas Importantes](#notas-importantes)
- [Autor](#autor)

---

## Características

### Frontend
- **Carga de imágenes** mediante drag & drop o selector de archivos
- **Recortar** con proporciones personalizables (libre, 1:1, 16:9, 4:3, 3:2)
- **Redimensionar** con opción de mantener proporción
- **Rotar** en ángulos de 90°, 180° y 270°
- **Filtros artísticos**: Blanco y Negro, Sepia, Brillo, Contraste
- **Convertir formato**: PNG, JPEG, WebP con ajuste de calidad
- **Deshacer/Rehacer** (historial de hasta 20 pasos)
- **Zoom** in/out (50% - 200%)
- **Descarga** con configuración personalizable
- **Tema oscuro** moderno y profesional

### Backend y Autenticación
- **Autenticación real** actualmente heredada de MySQL; pendiente migración a PostgreSQL
- **Sistema de roles**: administrador y usuario
- **Redirección automática** según el rol al iniciar sesión
- **Registro de operaciones** en base de datos
- **Control de sesiones** con cierre automático por inactividad
- **Configuración personalizada** por usuario; pendiente persistencia en PostgreSQL

### Panel de Administración
- **CRUD completo** sobre la tabla USUARIO
- **Búsqueda en tiempo real** de usuarios
- **Estadísticas** de usuarios activos e inactivos
- **Acceso protegido** con credenciales de administrador

---

## Tecnologías

### Frontend
| Tecnología | Uso |
|------------|-----|
| HTML5 | Estructura semántica |
| CSS3 | Diseño con variables CSS, Grid y Flexbox |
| JavaScript Vanilla | Lógica del editor con Canvas API |
| Canvas API | Manipulación de imágenes |
| SessionStorage | Gestión de sesión de usuario |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 22.13+ | Entorno de ejecución |
| Express | 5.2+ | Framework del servidor |
| PostgreSQL | Por definir | Base de datos relacional objetivo |
| pg | Por definir | Conector PostgreSQL para Node.js |
| bcryptjs | Latest | Encriptación de contraseñas |
| dotenv | Latest | Variables de entorno |
| cors | Latest | Control de acceso entre orígenes |
| pnpm | 11.1.1 | Gestor de paquetes del backend |

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  HTML + CSS + JavaScript (Canvas API)           │
│  Páginas: index, login, registro, editor, admin │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST API
┌────────────────────▼────────────────────────────┐
│                   BACKEND                        │
│      Node.js + Express modularizado             │
│  server.js monta middlewares, rutas y limpieza  │
│  Módulos: config, controllers, routes, utils    │
└────────────────────┬────────────────────────────┘
                     │ pg (objetivo de migración)
┌────────────────────▼────────────────────────────┐
│                 BASE DE DATOS                    │
│            PostgreSQL — artify_db               │
│  Tablas: USUARIO, SESION_EDICION, OPERACION,    │
│  CONFIGURACION, IMAGEN                          │
└─────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
Artify/
├── README.md                   # Documentación del proyecto
├── CONTEXT.md                  # Contexto técnico y estado actual
├── LICENSE                     # Licencia del proyecto
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
│
├── frontend/                   # Aplicación frontend organizada
│   ├── index.html              # Página principal
│   ├── pages/                  # Páginas HTML
│   │   ├── editor.html         # Editor de imágenes
│   │   ├── login.html          # Inicio de sesión
│   │   ├── registro.html       # Registro de usuario
│   │   └── admin.html          # Panel de administración
│   │
│   └── assets/                 # Recursos del proyecto
│       ├── css/                # Hojas de estilo
│       │   ├── admin.css
│       │   ├── editor.css
│       │   ├── index.css
│       │   ├── login.css
│       │   └── registro.css
│       │
│       ├── js/                 # Scripts JavaScript
│       │   ├── admin.js        # Lógica del panel de administración
│       │   ├── editor.js       # Lógica del editor
│       │   ├── login.js        # Lógica del login
│       │   └── registro.js     # Lógica del registro
│       │
│       ├── fonts/              # Fuentes tipográficas
│       │   ├── Inconsolata/
│       │   └── Paytone_One/
│       │
│       ├── icons/              # Iconos SVG
│       └── images/             # Imágenes del proyecto
│
├── backend/                    # Servidor Node.js modular
│   ├── config/                 # Conexión y configuración base
│   ├── controllers/            # Lógica de negocio por módulo
│   ├── middlewares/            # Autenticación y autorización
│   ├── routes/                 # Endpoints por dominio
│   ├── tests/                  # Pruebas automatizadas
│   ├── utils/                  # Helpers compartidos
│   ├── server.js               # Punto de arranque y montaje
│   ├── .env                    # Variables de entorno (no se sube a GitHub)
│   ├── package.json            # Scripts y dependencias del backend
│   └── pnpm-lock.yaml          # Lockfile de pnpm
│
├── database/                   # Base de datos del proyecto
│   └── artify_db.sql           # Script SQL completo
│
├── scripts/                    # Automatización
│   └── setup.sh                # Configuración inicial
│
├── docs/                       # Documentación del proyecto
│   ├── proyecto/
│   │   ├── descripcion-proyecto.md
│   │   ├── hardware-software-redes.md
│   │   ├── requerimientos-funcionales.md
│   │   └── evidencias/
│   ├── tecnica/
│   │   ├── arquitectura.md
│   │   ├── api-analytics.md
│   │   ├── base-datos.md
│   │   ├── coding-standards.md
│   │   ├── configuracion-servicios-artify.md
│   │   ├── despliegue.md
│   │   ├── plan-instalacion-artify.md
│   │   ├── plan-pruebas-autenticacion.md
│   │   ├── verificacion-hardware-artify.md
│   │   └── evidencias/
│
└── skills/                     # Skills instalables de Codex
    └── artify-sena/
        ├── SKILL.md            # Guía oficial de trabajo con Codex
        └── agents/openai.yaml  # Metadata del skill
```

---

## Requisitos Previos

Antes de instalar el proyecto asegúrate de tener:

- [Node.js](https://nodejs.org/) v22.13 o superior
- [pnpm](https://pnpm.io/) v11.1.1
- [PostgreSQL](https://www.postgresql.org/) versión estable
- [Git](https://git-scm.com/)
- Un servidor HTTP local (como `npx http-server`)

---

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repositorio-artify-sena-postgresql>
cd artify-sena-postgresql
```

### 2. Instalar dependencias del backend

```bash
cd backend
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` dentro de la carpeta `backend/` con este contenido:

```env
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/artify_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql
DB_NAME=artify_db
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=tu_contraseña_admin
TOKEN_SECRET=un_secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
```

### 4. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE artify_db;
```

El esquema PostgreSQL se preparará en `database/postgresql/schema.sql`. Mientras la migración esté en curso, `database/artify_db.sql` se conserva solo como referencia del modelo MySQL original.

### 5. Iniciar el backend

```bash
cd backend
pnpm start
```

Debes ver:
```
Conectado a PostgreSQL correctamente
🚀 Servidor corriendo en http://localhost:3000
```

### 6. Iniciar el frontend

En una terminal separada desde la raíz del proyecto:

```bash
npx http-server frontend -p 8080
```

### 7. Abrir en el navegador

```
http://127.0.0.1:8080
```

Si prefieres abrir archivos manualmente, usa `frontend/index.html`, pero para probar rutas y navegación es mejor servir la carpeta `frontend/` por HTTP.

---

## Uso

### Usuario normal
1. Abre `http://127.0.0.1:8080`
2. Regístrate en `frontend/pages/registro.html`
3. Inicia sesión en `frontend/pages/login.html`
4. El sistema te redirige automáticamente al editor
5. Edita tus imágenes y descárgalas

### Administrador
1. Inicia sesión con las credenciales de administrador
2. El sistema detecta el rol `admin` y redirige al panel
3. Gestiona todos los usuarios desde el panel de administración

---

## Pruebas

El backend incluye pruebas automatizadas de integración para autenticación, rutas protegidas y configuración básica.

```bash
cd backend
pnpm test
```

También puedes validar sintaxis del servidor con:

```bash
cd backend
pnpm run check
```

---

## Funcionalidades Principales

### Cargar Imagen
- **Drag & Drop** — Arrastra una imagen al área punteada
- **Selector de archivos** — Haz clic en "Subir Imagen"
- **Formatos soportados** — JPG, PNG, WebP
- **Tamaño máximo** — 10 MB

### Herramientas de Edición

#### Recortar
- Selecciona el área arrastrando sobre la imagen
- Proporciones: Libre, 1:1, 16:9, 4:3, 3:2
- Guías visuales de tercios incluidas

#### Redimensionar
- Ingresa nuevas dimensiones en píxeles
- Opción de mantener proporción automáticamente

#### Rotar
- Rotación rápida: 90°, 180°, 270°
- Ajuste automático de dimensiones del canvas

#### Filtros
- **Blanco y Negro** — Convierte a escala de grises
- **Sepia** — Efecto vintage
- **Brillo** — Ajusta luminosidad
- **Contraste** — Intensifica diferencias tonales
- Todos con intensidad ajustable (0-100%)

#### Convertir Formato
- Convierte entre PNG, JPEG y WebP
- Ajuste de calidad para JPEG/WebP

---

## Panel de Administración

El panel de administración implementa un **CRUD completo** sobre la tabla USUARIO que es la entidad fuerte no dependiente del modelo de datos.

| Operación | Descripción |
|-----------|-------------|
| **SELECT** | Lista todos los usuarios con búsqueda en tiempo real |
| **INSERT** | Agrega nuevos usuarios con validación de campos |
| **UPDATE** | Edita datos y estado de usuarios existentes |
| **DELETE** | Elimina usuarios con confirmación previa |

**Acceso:** Usuarios con rol `admin` son redirigidos automáticamente al panel al iniciar sesión.

---

## Base de Datos

### Tablas principales

```
artify_db
├── USUARIO           → Entidad fuerte — usuarios del sistema
├── SESION_EDICION    → Sesiones de edición por usuario
├── OPERACION         → Registro de operaciones realizadas
├── CONFIGURACION     → Configuración personalizada por usuario
└── IMAGEN            → Imágenes procesadas por usuario
```

### Vista disponible

```sql
-- Resumen de usuarios activos con estadísticas
SELECT * FROM v_usuarios_activos;
```

---


## Navegadores Soportados

| Navegador | Versión Mínima |
|-----------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Edge | 90+ |
| Safari | 14+ |
| Opera | 76+ |

> Requiere soporte para Canvas API y FileReader API.

---

## Documentación

La documentación del proyecto se encuentra organizada en la carpeta [`docs/`](./docs/) y se consulta directamente desde este README.

### Documentación del proyecto

- [Descripción del proyecto](./docs/proyecto/descripcion-proyecto.md)
- [Requerimientos funcionales](./docs/proyecto/requerimientos-funcionales.md)
- [Evidencia GA10 de hardware, software y redes](./docs/proyecto/hardware-software-redes.md)

### Documentación técnica

- [Arquitectura técnica](./docs/tecnica/arquitectura.md)
- [Base de datos](./docs/tecnica/base-datos.md)
- [Configuración de servicios, base de datos y software para Artify](./docs/tecnica/configuracion-servicios-artify.md)
- [Guía de despliegue y ejecución local](./docs/tecnica/despliegue.md)
- [Plan de instalación local de Artify](./docs/tecnica/plan-instalacion-artify.md)
- [Verificación de hardware para Artify](./docs/tecnica/verificacion-hardware-artify.md)
- [Alta disponibilidad y clústeres](./docs/tecnica/alta-disponibilidad-clusteres.md)
- [Plan de pruebas de autenticación](./docs/tecnica/plan-pruebas-autenticacion.md)
- [API de analíticas](./docs/tecnica/api-analytics.md)
- [Estándares de codificación](./docs/tecnica/coding-standards.md)

---

## Estándares de Codificación

Este proyecto sigue estándares de codificación documentados. Consulta el archivo [`docs/tecnica/coding-standards.md`](./docs/tecnica/coding-standards.md) para más detalles sobre:

- Nomenclatura de variables, constantes y parámetros
- Declaración de funciones y métodos
- Estándares para HTML, CSS, JavaScript y Node.js
- Convenciones para comentarios
- Estándares para consultas SQL
- Convenciones para commits de Git

---

## Notas Importantes

### Resolución Recomendada
- **Mínima:** 1366 x 768 px
- **Óptima:** 1920 x 1080 px o superior

### Consideraciones de Rendimiento
- Imágenes mayores a 8000x8000 px pueden causar lentitud
- Se recomienda usar imágenes de resolución razonable

### Seguridad
- Las contraseñas se encriptan con bcrypt antes de almacenarse
- Las credenciales de la base de datos se manejan con variables de entorno
- El archivo `.env` nunca se sube al repositorio

---

## Autor

**Ivan Dario Madrid Daza**
- GitHub: [@Tecno85](https://github.com/Tecno85)
- Email: tecno85@gmail.com
- Programa: Análisis y Desarrollo de Software — SENA

---

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## Roadmap Futuro

- [ ] Agregar pruebas automatizadas para frontend y ampliar cobertura backend
- [ ] Paginación en el historial de operaciones
- [ ] Más filtros avanzados (blur, sharpen, pixelate)
- [ ] Herramienta de texto sobre imágenes
- [ ] Exportación a PDF
- [ ] Procesamiento por lotes
- [ ] Despliegue en producción (Railway)
- [ ] Integración con servicios en la nube

---

<div align="center">

Hecho con HTML, CSS, JavaScript, Node.js y PostgreSQL

**[⬆ Volver arriba](#-artify--editor-de-imágenes-web)**

</div>
