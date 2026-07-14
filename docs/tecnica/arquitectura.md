# Arquitectura Técnica de Artify

> **Proyecto:** Artify
> **Programa:** Análisis y Desarrollo de Software - SENA
> **Autor:** Iván Darío Madrid Daza
> **Fecha:** Junio 2026
> **Última actualización:** Julio 2026

---

## 1. Objetivo del Documento

En este documento describo la arquitectura técnica de Artify. Explico cómo organizo sus capas principales, qué responsabilidad tiene cada componente y cómo se comunican el frontend, el backend y la base de datos PostgreSQL.

---

## 2. Vista General

Artify utiliza una arquitectura web full stack organizada en tres capas principales:

```text
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  HTML + CSS + JavaScript Vanilla + Canvas API   │
│  Páginas: index, login, registro, editor, admin │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST API
┌────────────────────▼────────────────────────────┐
│                    BACKEND                       │
│  Node.js + Express modularizado                 │
│  Rutas, controladores, middlewares y utilidades │
└────────────────────┬────────────────────────────┘
                     │ pg
┌────────────────────▼────────────────────────────┐
│                 BASE DE DATOS                    │
│              PostgreSQL - artify_db             │
│  USUARIO, SESION_EDICION, OPERACION,            │
│  CONFIGURACION, IMAGEN                          │
└─────────────────────────────────────────────────┘
```

---

### Arquitectura desplegada

| Capa | Servicio actual | Comunicación |
| --- | --- | --- |
| Frontend | GitHub Pages | Publica los archivos estáticos de `frontend/` por HTTPS. |
| Backend | Render | Expone la API Node.js por HTTPS y restringe orígenes mediante `CORS_ORIGIN`. |
| Base de datos | Neon | Recibe conexiones PostgreSQL exclusivamente desde el backend mediante `DATABASE_URL`. |

La URL del backend no queda fija en el código fuente: el workflow de GitHub Pages genera `frontend/assets/js/config.js` con la variable de repositorio `ARTIFY_API_URL`. Esta distribución separa responsabilidades, pero no implementa por sí sola redundancia, clústeres ni conmutación por error.

---

## 3. Capa Frontend

El frontend se encuentra en la carpeta `frontend/` y está construido con HTML, CSS y JavaScript Vanilla. Su responsabilidad es presentar la interfaz visual, capturar las acciones del usuario y comunicarse con el backend mediante peticiones HTTP.

### Componentes principales

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `frontend/index.html` | Página principal del proyecto. |
| `frontend/pages/login.html` | Pantalla de inicio de sesión. |
| `frontend/pages/registro.html` | Pantalla de registro de usuarios. |
| `frontend/pages/editor.html` | Editor de imágenes. |
| `frontend/pages/admin.html` | Panel administrativo. |
| `frontend/assets/css/` | Estilos visuales de cada pantalla. |
| `frontend/assets/js/` | Lógica del frontend y consumo de API. |
| `frontend/assets/js/config.js` | Configuración de la URL del backend para despliegues. |

### Responsabilidades

- Mostrar formularios de registro e inicio de sesión.
- Guardar información de sesión en `sessionStorage`.
- Enviar el token de autenticación a rutas protegidas.
- Manipular imágenes en el navegador mediante Canvas API.
- Presentar el panel administrativo para usuarios con rol `admin`.

---

## 4. Capa Backend

El backend se encuentra en la carpeta `backend/` y está construido con Node.js y Express. Su responsabilidad es recibir solicitudes del frontend, validar datos, aplicar reglas de negocio, proteger rutas y comunicarse con PostgreSQL mediante `pg`.

### Componentes principales

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `backend/server.js` | Punto de entrada, validación inicial de seguridad, montaje de rutas, limpieza de sesiones y cierre controlado del proceso. |
| `backend/config/db.js` | Conexión PostgreSQL con límite de conexiones, tiempos máximos de espera y compatibilidad con consultas heredadas. |
| `backend/routes/` | Definición de endpoints por módulo. |
| `backend/controllers/` | Lógica de negocio de cada recurso. |
| `backend/middlewares/` | Autenticación, autorización y control de acceso. |
| `backend/utils/` | Funciones reutilizables para token, validación y configuración. |
| `backend/tests/` | Pruebas automatizadas unitarias y de integración. |

### Rutas principales

| Módulo | Archivo | Función |
| --- | --- | --- |
| Autenticación | `auth.routes.js` | Login principal, registro y emisión de token con rol. |
| Configuración | `configuracion.routes.js` | Consulta y guardado de preferencias. |
| Sesiones | `sesion.routes.js` | Inicio y cierre de sesiones de edición. |
| Actividad | `actividad.routes.js` | Estadísticas, operaciones e imágenes. |
| Administración | `admin.routes.js` | CRUD de usuarios. |
| Analíticas | `analytics.routes.js` | Endpoints públicos de analíticas. |
| Salud | `server.js` | `GET /health` para verificación de disponibilidad del proceso Express. |
| Disponibilidad | `server.js` | `GET /ready` para comprobar la conexión real con PostgreSQL. |

---

## 5. Capa de Base de Datos

Artify utiliza PostgreSQL como sistema de persistencia. El esquema activo se encuentra en:

```text
database/postgresql/schema.sql
```

### Tablas principales

| Tabla | Responsabilidad |
| --- | --- |
| `USUARIO` | Usuarios, credenciales, rol, estado y último acceso. |
| `CONFIGURACION` | Preferencias personalizadas del usuario. |
| `SESION_EDICION` | Sesiones de trabajo dentro del editor. |
| `OPERACION` | Registro de operaciones realizadas por el usuario. |
| `IMAGEN` | Metadatos de imágenes procesadas. |

La tabla `USUARIO` funciona como entidad principal. Las tablas `CONFIGURACION`, `SESION_EDICION`, `OPERACION` e `IMAGEN` dependen de ella mediante claves foráneas.

---

## 6. Seguridad y Autenticación

La autenticación de Artify se apoya en correo, contraseña, `bcryptjs` y un token firmado generado por el backend.

### Flujo general

1. El usuario envía correo y contraseña desde el frontend.
2. El backend valida el formato de los datos.
3. El backend busca el usuario en la tabla `USUARIO`.
4. La contraseña ingresada se compara contra el hash almacenado con `bcrypt`.
5. Si las credenciales son válidas, el backend genera un token firmado.
6. El frontend guarda el token y lo envía en rutas protegidas.
7. Los middlewares verifican token, rol y pertenencia del recurso solicitado.

### Medidas aplicadas

- Las contraseñas se almacenan como hash, no como texto plano.
- Las rutas privadas requieren encabezado `Authorization: Bearer <token>`.
- El backend valida que un usuario no acceda a recursos de otro usuario.
- Las acciones administrativas requieren rol `admin`.
- El estado y el rol se consultan nuevamente en PostgreSQL para cada ruta privada.
- Las variables sensibles se cargan desde `.env` y no deben subirse al repositorio.
- En producción, `TOKEN_SECRET` debe existir, tener al menos 32 caracteres y no usar el valor de ejemplo; esta validación ocurre antes de abrir conexiones o aceptar solicitudes.
- La firma recibida y la firma esperada del token se comparan en tiempo constante para evitar comparaciones sensibles directas.
- El pool de PostgreSQL limita conexiones y tiempos de espera para que una consulta o conexión bloqueada no deje ocupado el backend indefinidamente.
- Al recibir `SIGTERM` o `SIGINT`, el backend deja de aceptar solicitudes, detiene sus tareas periódicas y cierra el pool de PostgreSQL antes de terminar.

---

## 7. Flujo de Comunicación

El flujo normal de comunicación es:

```text
Usuario
  ↓
Frontend HTML/CSS/JS
  ↓ fetch HTTP
Backend Express
  ↓ pg
PostgreSQL
  ↓ respuesta
Backend Express
  ↓ JSON
Frontend
  ↓
Interfaz actualizada
```

El frontend no accede directamente a la base de datos. Todas las operaciones persistentes pasan por el backend.

---

## 8. Gestión de Sesiones y Actividad

Cuando un usuario autenticado utiliza el editor, el sistema puede registrar sesiones de edición y operaciones realizadas. Esto permite conservar trazabilidad básica del uso del sistema.

Además, el backend incluye una tarea periódica que finaliza las sesiones que continúan activas cuando han transcurrido más de ocho horas desde `ses_fecha_inicio`. La regla se basa en la antigüedad de la sesión, no en la medición de eventos de actividad del usuario, y ayuda a mantener consistencia en la base de datos.

---

## 9. Gestión de Dependencias

El backend utiliza `pnpm` como gestor de paquetes oficial. El archivo de bloqueo principal es:

```text
backend/pnpm-lock.yaml
```

No se debe mezclar con `package-lock.json`, porque el proyecto ya está migrado a `pnpm`.

---

## 10. Criterios de Mantenimiento

Para mantener la arquitectura clara considero estas reglas:

- Mantener la separación entre frontend, backend y base de datos.
- Agregar nuevas rutas dentro de `backend/routes/`.
- Colocar reglas de negocio en `backend/controllers/`.
- Reutilizar validaciones y helpers desde `backend/utils/`.
- Proteger nuevas rutas privadas con los middlewares de autenticación.
- Actualizar esta documentación cuando cambien capas, módulos o flujos principales.
