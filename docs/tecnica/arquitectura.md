# Arquitectura Técnica de Artify

> **Proyecto:** Artify - Editor de Imágenes Web
> **Programa:** Análisis y Desarrollo de Software - SENA
> **Autor:** Iván Darío Madrid Daza
> **Fecha:** Mayo 2026

---

## 1. Objetivo del Documento

Este documento describe la arquitectura técnica de Artify, explicando cómo se organizan sus capas principales, qué responsabilidades tiene cada componente y cómo se comunican el frontend, el backend y la base de datos.

La finalidad es dejar una referencia clara para comprender, mantener y ampliar el proyecto sin perder la separación de responsabilidades.

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
                     │ mysql2
┌────────────────────▼────────────────────────────┐
│                 BASE DE DATOS                    │
│                 MySQL - artify_db                │
│  USUARIO, SESION_EDICION, OPERACION,            │
│  CONFIGURACION, IMAGEN                          │
└─────────────────────────────────────────────────┘
```

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

### Responsabilidades

- Mostrar formularios de registro e inicio de sesión.
- Guardar información de sesión en `sessionStorage`.
- Enviar el token de autenticación a rutas protegidas.
- Manipular imágenes en el navegador mediante Canvas API.
- Presentar el panel administrativo para usuarios con rol `admin`.

---

## 4. Capa Backend

El backend se encuentra en la carpeta `backend/` y está construido con Node.js y Express. Su responsabilidad es recibir solicitudes del frontend, validar datos, aplicar reglas de negocio, proteger rutas y comunicarse con MySQL.

### Componentes principales

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `backend/server.js` | Punto de entrada, middlewares globales, montaje de rutas y limpieza de sesiones. |
| `backend/config/` | Conexión a la base de datos. |
| `backend/routes/` | Definición de endpoints por módulo. |
| `backend/controllers/` | Lógica de negocio de cada recurso. |
| `backend/middlewares/` | Autenticación, autorización y control de acceso. |
| `backend/utils/` | Funciones reutilizables para token, validación y configuración. |
| `backend/tests/` | Pruebas automatizadas de integración. |

### Rutas principales

| Módulo | Archivo | Función |
| --- | --- | --- |
| Autenticación | `auth.routes.js` | Login, registro y login administrativo. |
| Configuración | `configuracion.routes.js` | Consulta y guardado de preferencias. |
| Sesiones | `sesion.routes.js` | Inicio y cierre de sesiones de edición. |
| Actividad | `actividad.routes.js` | Estadísticas, operaciones e imágenes. |
| Administración | `admin.routes.js` | CRUD de usuarios. |
| Analíticas | `analytics.routes.js` | Endpoints públicos de analíticas. |

---

## 5. Capa de Base de Datos

Artify utiliza MySQL como sistema de persistencia. La base de datos principal es `artify_db` y su script se encuentra en:

```text
database/artify_db.sql
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
- Las variables sensibles se cargan desde `.env` y no deben subirse al repositorio.

---

## 7. Flujo de Comunicación

El flujo normal de comunicación es:

```text
Usuario
  ↓
Frontend HTML/CSS/JS
  ↓ fetch HTTP
Backend Express
  ↓ mysql2
MySQL
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

Además, el backend incluye una tarea periódica que finaliza sesiones activas abandonadas con más de ocho horas de antigüedad. Esta tarea ayuda a mantener consistencia en la base de datos.

---

## 9. Gestión de Dependencias

El backend utiliza `pnpm` como gestor de paquetes oficial. El archivo de bloqueo principal es:

```text
backend/pnpm-lock.yaml
```

No se debe mezclar con `package-lock.json`, porque el proyecto ya está migrado a `pnpm`.

---

## 10. Criterios de Mantenimiento

Para mantener la arquitectura clara se deben respetar estas reglas:

- Mantener la separación entre frontend, backend y base de datos.
- Agregar nuevas rutas dentro de `backend/routes/`.
- Colocar reglas de negocio en `backend/controllers/`.
- Reutilizar validaciones y helpers desde `backend/utils/`.
- Proteger nuevas rutas privadas con los middlewares de autenticación.
- Actualizar esta documentación cuando cambien capas, módulos o flujos principales.
