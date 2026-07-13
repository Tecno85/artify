#  ![Logo del Proyecto](./frontend/assets/icons/modx.svg) Artify — Editor de Imágenes Web

<div align="center">

![Status](https://img.shields.io/badge/estado-activo-28ffce?style=for-the-badge)
![License](https://img.shields.io/badge/licencia-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-22.13+-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-oficial-4169E1?style=for-the-badge&logo=postgresql)

**Artify** es una aplicación web de edición de imágenes con backend Node.js + Express y base de datos PostgreSQL. Conserva el frontend HTML, CSS y JavaScript vanilla, y usa `pg` como conector PostgreSQL en el backend.

PostgreSQL es el motor oficial de base de datos del proyecto.

</div>

---

> **Estado del proyecto:** PostgreSQL es el motor oficial de esta versión. El backend, el esquema, las pruebas, la documentación y el flujo de despliegue están alineados con PostgreSQL.

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
- [Despliegue](#despliegue)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Panel de Administración](#panel-de-administración)
- [Base de Datos](#base-de-datos)
- [Navegadores Objetivo](#navegadores-objetivo)
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
- **Filtros artísticos**: Blanco y Negro, Sepia, Brillo y Contraste, con vista previa al mover el control, escalas neutras por filtro y confirmación explícita
- **Convertir formato**: PNG, JPEG, WebP con ajuste de calidad
- **Deshacer/Rehacer** (historial de hasta 20 pasos)
- **Zoom** in/out (50% - 200%)
- **Descarga** con configuración personalizable
- **Tema oscuro** moderno y profesional

### Backend y Autenticación
- **Autenticación real** conectada a PostgreSQL mediante el paquete `pg`
- **Sistema de roles**: administrador y usuario
- **Redirección automática** según el rol al iniciar sesión
- **Registro de operaciones** en base de datos
- **Control de sesiones** con cierre explícito y limpieza automática de sesiones activas con más de ocho horas desde su inicio
- **Configuración personalizada** persistida en PostgreSQL

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
| `sessionStorage` | Gestión de sesión de usuario |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 22.13+ | Entorno de ejecución |
| Express | 5.2.1 | Framework del servidor |
| PostgreSQL | 15 o superior | Base de datos relacional |
| pg | 8.16.3 | Conector PostgreSQL para Node.js |
| bcryptjs | 3.0.3 | Hash de contraseñas |
| dotenv | 17.3.1 | Variables de entorno |
| cors | 2.8.6 | Control de acceso entre orígenes |
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
                     │ pg
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
├── .github/
│   └── workflows/
│       ├── backend-tests.yml # Integración continua del backend
│       └── deploy-pages.yml  # Despliegue del frontend
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
│   ├── artify_db.sql           # Referencia del modelo anterior
│   └── postgresql/
│       ├── schema.sql          # Esquema PostgreSQL activo
│       ├── seed.sql            # Datos mínimos de referencia
│       └── queries.md          # Inventario de ajustes de consultas
│
├── scripts/                    # Automatización
│   ├── setup.sh                # Configuración inicial heredada
│   └── write-frontend-config.js # Configuración de API para despliegue
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
    └── artify/
        ├── SKILL.md            # Guía oficial de trabajo con Codex
        └── agents/openai.yaml  # Metadata del skill
```

---

## Requisitos Previos

Para ejecutar Artify localmente se requiere:

- [Node.js](https://nodejs.org/) v22.13 o superior
- [pnpm](https://pnpm.io/) v11.1.1
- [PostgreSQL](https://www.postgresql.org/) 15 o superior
- [Git](https://git-scm.com/)
- Un navegador moderno

---

## Instalación y Configuración

El procedimiento completo y verificable para Windows y macOS se encuentra en el [Plan de instalación local de Artify](./docs/tecnica/plan-instalacion-artify.md).

La guía incluye:

- preparación de Node.js, pnpm, Git y PostgreSQL por sistema operativo;
- configuración local de `backend/.env`;
- creación y carga de `artify_db`;
- inicio del backend y del frontend;
- validación de `/health`, `/ready`, pruebas y flujo funcional;
- solución de problemas frecuentes.

---

## Uso

### Usuario normal
1. Abre `http://127.0.0.1:8080`
2. Selecciona **Registrarse** o abre `http://127.0.0.1:8080/pages/registro.html`
3. Después abre **Iniciar sesión** o `http://127.0.0.1:8080/pages/login.html`
4. El sistema te redirige automáticamente al editor
5. Edita tus imágenes y descárgalas

### Administrador
1. Inicia sesión con las credenciales de administrador
2. El sistema detecta el rol `admin` y redirige al panel
3. Gestiona todos los usuarios desde el panel de administración

---

## Pruebas

El backend incluye 18 pruebas automatizadas de integración para autenticación, rutas protegidas, sesiones, configuración, imágenes y analytics.

```bash
cd backend
pnpm test
```

> **Importante:** la suite crea, actualiza y elimina datos temporales. Debe ejecutarse únicamente contra `artify_db` local o una base exclusiva de pruebas. Nunca se debe usar `pnpm test` con `DATABASE_URL` apuntando a Neon o a producción.

También puedes validar sintaxis del servidor con:

```bash
cd backend
pnpm run check
```

GitHub Actions ejecuta automáticamente PostgreSQL, la validación de sintaxis y las pruebas en cada `push` a `main` y en cada pull request.

---

## Despliegue

Esta variante está preparada para separar frontend y backend:

- El frontend se publica como sitio estático en GitHub Pages.
- El backend se publica como servicio Node.js en Render.
- La base de datos se aloja en Neon mediante una URL PostgreSQL segura.

Despliegue público vigente:

```text
https://tecno85.github.io/artify/
```

Cada `push` a `main` ejecuta `.github/workflows/deploy-pages.yml` y publica la carpeta `frontend/`.

### Variable para conectar frontend y backend

El frontend carga `frontend/assets/js/config.js` antes de `auth.js`. En local este archivo deja la API vacía para que el sistema use el mismo protocolo y hostname del frontend en el puerto `3000`; por ejemplo, al abrir `http://127.0.0.1:8080`, la API local será `http://127.0.0.1:3000`.

GitHub Actions genera el archivo durante el despliegue mediante `scripts/write-frontend-config.js`. Para apuntar el frontend al backend desplegado, se define `ARTIFY_API_URL` como variable del repositorio en **Settings > Secrets and variables > Actions > Variables**:

```env
ARTIFY_API_URL=https://url-del-backend
```

Ejemplo:

```env
ARTIFY_API_URL=https://artify-sena-postgresql.onrender.com
```

No se deben incluir barras finales en la URL. El frontend construye las rutas agregando `/api/...`.

### Variables del backend

En producción, el backend debe recibir las variables desde el panel del proveedor. Para Render con Neon, la configuración mínima recomendada es:

```env
DATABASE_URL=postgresql://usuario:contrasena@host/dbname?sslmode=require
TOKEN_SECRET=secreto_largo_y_seguro
NODE_VERSION=22.13.0
NODE_ENV=production
CORS_ORIGIN=https://tecno85.github.io
```

Para despliegues, `DATABASE_URL` es la variable principal. Las variables separadas `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` se mantienen como soporte local o para configuraciones donde no se use una cadena completa.

`CORS_ORIGIN` define qué frontend puede consumir el backend. En desarrollo puede incluir varios orígenes separados por coma. En producción debe apuntar a la URL pública real del frontend.

Render asigna el puerto del servicio mediante `PORT`; normalmente no es necesario declararlo manualmente. Para health checks o monitoreo básico, el backend expone:

```text
https://url-del-backend.onrender.com/health
```

Para comprobar además que PostgreSQL está disponible, se puede consultar `GET /ready`.

La carga de `database/postgresql/schema.sql` es para aprovisionamiento inicial o reinicio controlado: ese archivo elimina y recrea los objetos del proyecto. Antes de ejecutarlo sobre una base con datos útiles, se debe hacer respaldo.

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
- Blanco y Negro y Sepia usan una intensidad de 0 a 100%; Brillo y Contraste usan una escala de -100 a 100 con valor neutro en 0

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

El acceso administrativo usa el mismo login principal de la aplicación. Para habilitar un administrador, primero registro el usuario desde la interfaz y luego promuevo su rol en PostgreSQL:

**Windows - PowerShell, desde la raíz del proyecto:**

```powershell
psql -h localhost -U postgres -d artify_db -v "correo=admin@artify.com" -f database/postgresql/promote-admin.sql
```

**macOS - Terminal, desde la raíz del proyecto:**

```bash
psql -h localhost -U postgres -d artify_db -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql
```

Reemplazo `postgres` si mi instalación local usa otro rol PostgreSQL.

En un despliegue con Neon uso la cadena `DATABASE_URL` solo para esta promoción controlada:

**Windows - PowerShell:**

```powershell
psql "$env:DATABASE_URL" -v "correo=admin@artify.com" -f database/postgresql/promote-admin.sql
```

**macOS - Terminal:**

```bash
psql "$DATABASE_URL" -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql
```

Después de esa promoción, el usuario ingresa desde `login.html`. Si su rol es `admin`, el frontend lo envía al CRUD; si su rol es `usuario`, lo envía al editor.

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
SELECT * FROM "v_usuarios_activos";
```

---


## Navegadores Objetivo

| Navegador | Cobertura objetivo |
|-----------|--------------------|
| Chrome | Versión estable actual |
| Firefox | Versión estable actual |
| Edge | Versión estable actual |
| Safari | Versión estable actual |

> Artify requiere Canvas API y FileReader API. Los flujos principales deben validarse manualmente en versiones actuales; el proyecto no declara todavía versiones mínimas certificadas por una matriz formal de compatibilidad.

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
- [Guía de despliegue público](./docs/tecnica/despliegue.md)
- [Plan de migración a PostgreSQL](./docs/tecnica/plan-migracion-postgresql.md)
- [Plan de instalación local de Artify](./docs/tecnica/plan-instalacion-artify.md)
- [Plan de mantenimiento y soporte de Artify](./docs/tecnica/plan-mantenimiento-soporte-artify.md)
- [Plan de migración y respaldo de datos con referencia en ISO 27001](./docs/tecnica/plan-respaldo-datos-iso27001-artify.md)
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
- **Ventana útil mínima:** 1024 x 600 px
- **Portátiles de 1366 x 768:** inicio y editor activan modos compactos para aprovechar la altura disponible del navegador
- **Óptima:** 1920 x 1080 px o superior

### Consideraciones de Rendimiento
- El editor limita cada archivo cargado a 10 MB
- El rendimiento también depende de las dimensiones en píxeles, la memoria disponible y la capacidad del dispositivo; no existe un límite fijo de dimensiones implementado

### Seguridad
- Las contraseñas se almacenan como hash bcrypt y nunca en texto plano
- Las credenciales de la base de datos se manejan con variables de entorno
- El login usa un mensaje genérico para credenciales inválidas y limita intentos repetidos
- Las cuentas inactivas, suspendidas o eliminadas no pueden usar tokens anteriores
- En producción el backend restringe CORS mediante `CORS_ORIGIN`
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
- [x] Despliegue full-stack con frontend estático, backend Node.js y PostgreSQL
- [x] Integración con GitHub Pages, Render y Neon

---

<div align="center">

Hecho con HTML, CSS, JavaScript, Node.js y PostgreSQL

**[⬆ Volver arriba](#-artify--editor-de-imágenes-web)**

</div>
