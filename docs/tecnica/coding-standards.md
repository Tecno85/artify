# Estándares de Codificación — Proyecto Artify

> **Versión:** 1.0
> **Fecha:** Marzo 2026
> **Autor:** Iván Darío Madrid Daza
> **Programa:** Análisis y Desarrollo de Software — SENA

---

## Tabla de Contenidos

1. [Estructura y Organización de Archivos](#1-estructura-y-organización-de-archivos)
2. [Nomenclatura de Variables y Constantes](#2-nomenclatura-de-variables-y-constantes)
3. [Declaración de Funciones y Métodos](#3-declaración-de-funciones-y-métodos)
4. [Declaración de Clases y Objetos](#4-declaración-de-clases-y-objetos)
5. [Estándares HTML](#5-estándares-html)
6. [Estándares CSS](#6-estándares-css)
7. [Estándares JavaScript](#7-estándares-javascript)
8. [Estándares Node.js y Backend](#8-estándares-nodejs-y-backend)
9. [Estándares SQL y Base de Datos](#9-estándares-sql-y-base-de-datos)
10. [Convenciones para Comentarios](#10-convenciones-para-comentarios)
11. [Convenciones para Commits de Git](#11-convenciones-para-commits-de-git)

---

## 1. Estructura y Organización de Archivos

La estructura real y completa del repositorio vive en `CONTEXT.md`.
Aquí solo se conserva un mapa mínimo para entender los ejemplos de código:

```
Artify/
├── frontend/
└── backend/
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── routes/
    ├── utils/
    └── server.js
```

### Reglas de organización

- Cada archivo tiene una responsabilidad única y clara.
- Los archivos CSS y JS se organizan por página o componente: `admin.css`, `admin.js`, `editor.js`.
- Las imágenes y recursos estáticos siempre van en `frontend/assets/images/`.
- Los archivos de configuración sensibles como `.env` nunca se suben al repositorio.

---

## 2. Nomenclatura de Variables y Constantes

### Variables — camelCase

Se usa `camelCase` para todas las variables en JavaScript.

```javascript
// Ejemplo recomendado
let currentImage = null;
let zoomLevel = 100;
let cropMode = false;
let operationsHistory = [];

// Incorrecto
let CurrentImage = null;
let zoom_level = 100;
let CROPMODE = false;
```

### Constantes — UPPER_SNAKE_CASE

Las constantes que no cambian durante la ejecución se escriben en mayúsculas con guiones bajos.

```javascript
// Ejemplo recomendado - tomado de editor.js
const RESOLUCION_MINIMA_ANCHO = 1366;
const RESOLUCION_MINIMA_ALTO = 768;
const LOCAL_STORAGE_KEY = 'artify_no_mostrar_modal_resolucion';

// Incorrecto
const resolucionMinimaAncho = 1366;
const resolucionMinimaAlto = 768;
```

### Variables del DOM — camelCase descriptivo

```javascript
// Ejemplo recomendado - tomado de editor.js
let fileInput, btnSubir, btnDescargar, dropZone;
let btnRecortar, btnRedimensionar, btnRotar;
let btnDeshacer, btnRehacer;
let btnZoomIn, btnZoomOut, zoomLevelDisplay;

// Incorrecto
let fi, bs, bd, dz;
let b1, b2, b3;
```

### Variables del backend — camelCase

```javascript
// Ejemplo recomendado - tomado del backend modular
const { correo, password } = req.body;
const passwordValida = bcrypt.compareSync(password, usuario.usr_contrasena);
const queryAcceso = `UPDATE USUARIO SET ...`; // el adaptador cita la tabla antes de ejecutar en PostgreSQL

// Incorrecto
const { Correo, Password } = req.body;
const password_valida = bcrypt.compareSync(...);
```

### Parámetros de funciones — camelCase

```javascript
// Ejemplo recomendado
function sincronizarImagenYCanvas(callback) { ... }
function mostrarError(inputId, mensaje) { ... }
function renderizarTabla(usuarios) { ... }

// Incorrecto
function sincronizarImagenYCanvas(CallBack) { ... }
function mostrarError(InputId, Mensaje) { ... }
```

---

## 3. Declaración de Funciones y Métodos

### Funciones con nombre descriptivo — verbos en español

Todas las funciones usan verbos en español que describen claramente su acción.

```javascript
// Ejemplo recomendado - tomado de editor.js y admin.js
function sincronizarImagenYCanvas(callback) { ... }
function guardarEstadoEnHistorial() { ... }
function actualizarEstado(mensaje, tipo) { ... }
function registrarOperacion(tipo, descripcion) { ... }
function renderizarTabla(usuarios) { ... }
function actualizarEstadisticas(usuarios) { ... }
function cargarUsuarios() { ... }
function limpiarErrores() { ... }
function cerrarModal() { ... }
function formatearFecha(fechaStr) { ... }

// Incorrecto
function sync(cb) { ... }
function saveState() { ... }
function update(msg, t) { ... }
```

### Funciones asíncronas — async/await

```javascript
// Ejemplo recomendado - tomado de admin.js
async function cargarUsuarios() {
  try {
    const res  = await fetch(`${API}/api/admin/usuarios`);
    const data = await res.json();
    if (data.mensaje === 'ok') {
      renderizarTabla(data.usuarios);
    }
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
    mostrarNotificacion('error', 'Error al cargar los usuarios');
  }
}

// Incorrecto — mezclar promesas con async/await
async function cargarUsuarios() {
  fetch(`${API}/api/admin/usuarios`)
    .then(res => res.json())
    .then(data => { ... });
}
```

### Funciones de evento — addEventListener

```javascript
// Ejemplo recomendado - tomado de admin.js
document.getElementById('btnAdminLogin').addEventListener('click', async () => {
  const correo   = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  // ...
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  const termino = e.target.value.toLowerCase();
  // ...
});
```

### Funciones expuestas globalmente — window

Las funciones que se llaman desde HTML usan `window` para exponerlas globalmente.

```javascript
// Ejemplo recomendado - tomado de admin.js
window.abrirEditar = function(id) {
  const usuario = todosLosUsuarios.find(u => u.usr_id_usuario === id);
  // ...
};

window.abrirEliminar = function(id, nombre) {
  usuarioIdEliminar = id;
  // ...
};
```

---

## 4. Declaración de Clases y Objetos

### Objetos de configuración — camelCase

```javascript
// Ejemplo recomendado - tomado del backend modular
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 5432),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Ejemplo recomendado - tomado de editor.js
let cropArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};
```

### Objetos de respuesta del backend — camelCase

```javascript
// Ejemplo recomendado - tomado del backend modular
res.json({
  mensaje: 'Login exitoso',
  usuario: {
    id:        usuario.usr_id_usuario,
    nombres:   usuario.usr_nombres,
    apellidos: usuario.usr_apellidos,
    correo:    usuario.usr_correo,
    rol:       usuario.usr_rol,
  },
});
```

### Objetos de configuración por defecto

```javascript
// Ejemplo recomendado - tomado del backend modular
const configDefecto = JSON.stringify({
  notificaciones:  true,
  formatoDefecto:  'png',
  autoguardado:    false,
});
```

---

## 5. Estándares HTML

### Estructura base

```html
<!-- Ejemplo recomendado - tomado de admin.html -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Panel Admin — Artify</title>
    <link rel="icon" href="../assets/images/modx-icon.svg" type="image/svg" />
    <link rel="stylesheet" href="../assets/css/admin.css" />
  </head>
  <body>
    <!-- Contenido -->
    <script src="../assets/js/admin.js"></script>
  </body>
</html>
```

### Nomenclatura de IDs y clases — kebab-case

```html
<!-- Ejemplo recomendado - tomado de admin.html -->
<div class="admin-login-overlay" id="loginOverlay">
<div class="admin-login-card">
<div class="modal-overlay" id="modalUsuario">
<button class="btn-admin-login" id="btnAdminLogin">
<span class="error-message" id="adminEmail-error">

<!-- Incorrecto -->
<div class="adminLoginOverlay" id="login_overlay">
<div class="AdminLoginCard">
```

### Comentarios de secciones en HTML

```html
<!-- Ejemplo recomendado - tomado de admin.html -->
<!-- ===== LOGIN DEL ADMINISTRADOR ===== -->
<!-- ===== PANEL PRINCIPAL ===== -->
<!-- HEADER -->
<!-- SIDEBAR -->
<!-- CONTENIDO PRINCIPAL -->
<!-- TABLA DE USUARIOS -->
<!-- ===== MODAL AGREGAR / EDITAR USUARIO ===== -->
<!-- ===== MODAL CONFIRMAR ELIMINAR ===== -->
<!-- NOTIFICACIÓN -->
```

### Atributos semánticos

```html
<!-- Ejemplo recomendado - tomado de admin.html -->
<input type="email" id="adminEmail" placeholder="admin@artify.com" autocomplete="email" />
<input type="password" id="adminPassword" autocomplete="current-password" />
<button type="button" class="toggle-password" aria-label="Mostrar contraseña">
```

---

## 6. Estándares CSS

### Variables CSS — kebab-case en :root

```css
/* Ejemplo recomendado - tomado de admin.css */
:root {
  --bg:           #0a0a0a;
  --card:         #161616;
  --card2:        #1e1e1e;
  --primary:      #4ae3f4;
  --primary-dark: #469af3;
  --accent:       #28ffce;
  --text:         #f5f5f5;
  --text-muted:   #acabab;
  --font-head:    'Paytone One', sans-serif;
  --font-body:    'Inconsolata', monospace;
  --radius:       10px;
  --shadow:       0 4px 24px rgba(0, 0, 0, 0.4);
  --sidebar-width: 170px;
}
```

### Clases — kebab-case

```css
/* Ejemplo recomendado - tomado de admin.css */
.admin-login-overlay { ... }
.admin-login-card { ... }
.header-title { ... }
.btn-admin-login { ... }
.content-toolbar { ... }
.estado-badge { ... }
.estado-activo { ... }
.nav-section-title { ... }

/* Incorrecto */
.adminLoginOverlay { ... }
.AdminLoginCard { ... }
.headerTitle { ... }
```

### Organización de secciones en CSS

```css
/* Ejemplo recomendado - tomado de admin.css */
/* ========== VARIABLES ========== */
/* ========== RESET ========== */
/* ========== LOGIN OVERLAY ========== */
/* ========== FORM GROUPS ========== */
/* ========== BOTÓN LOGIN ========== */
/* ========== HEADER ========== */
/* ========== LAYOUT ========== */
/* ========== SIDEBAR ========== */
/* ========== CONTENIDO ========== */
/* ========== TABLA ========== */
/* ========== MODALES ========== */
/* ========== NOTIFICACIÓN ========== */
```

### Media queries para responsividad

```css
/* Ejemplo recomendado - tomado de admin.css */
@media (min-width: 1400px) {
  :root { --sidebar-width: 160px; }
  .admin-content { max-width: 100%; }
}

@media (min-width: 2560px) {
  body { font-size: 16px; }
  :root { --sidebar-width: 180px; }
}
```

---

## 7. Estándares JavaScript

### Organización de secciones

```javascript
// Ejemplo recomendado - tomado de editor.js y admin.js
// ========== VARIABLES GLOBALES ==========
// ========== ELEMENTOS DEL DOM ==========
// ========== CONSTANTES ==========
// ========== CONFIGURACIÓN ==========
// ========== UTILIDADES ==========
// ========== LÓGICA PRINCIPAL ==========
// ========== EVENTOS ==========
```

### Declaración de variables — let y const

```javascript
// Ejemplo recomendado
const API = 'http://localhost:3000';        // Valor que no cambia → const
let todosLosUsuarios = [];                  // Valor que cambia → let
let usuarioIdEliminar = null;
let modoEdicion = false;

// Incorrecto
var API = 'http://localhost:3000';          // Nunca usar var
var todosLosUsuarios = [];
```

### Manejo de errores — try/catch

```javascript
// Ejemplo recomendado - tomado de admin.js
try {
  const res  = await fetch(`${API}/api/admin/usuarios`);
  const data = await res.json();
  renderizarTabla(data.usuarios);
} catch (err) {
  console.error('Error al cargar usuarios:', err);
  mostrarNotificacion('error', 'Error al cargar los usuarios');
}
```

### Logs en consola — mensajes descriptivos

```javascript
// Ejemplo recomendado - tomado del backend modular y admin.js
console.log('Conectado a PostgreSQL correctamente');
console.log('Login exitoso para:', usuario.usr_nombres);
console.log('Rol:', usuario.usr_rol);
console.error('Error al conectar a PostgreSQL:', err.message);
console.warn('No se pudo actualizar último acceso:', err.message);
console.log('Datos recibidos desde el formulario:');
console.log('Redirigiendo al editor...');

// Incorrecto
console.log('connected');
console.log('ok');
console.log(err);
```

---

## 8. Estándares Node.js y Backend

### Organización de endpoints

```javascript
// Ejemplo recomendado - tomado del backend modular
// ========== DEPENDENCIAS ==========
// ========== CONFIGURACIÓN ==========
// ========== CONEXIÓN A POSTGRESQL ==========
// ========== ENDPOINT DE LOGIN ==========
// ========== ENDPOINT DE REGISTRO ==========
// ========== ENDPOINTS PANEL DE ADMINISTRACIÓN ==========
// ========== LIMPIEZA AUTOMÁTICA DE SESIONES INACTIVAS ==========
```

### Variables de entorno — process.env

```javascript
// Ejemplo recomendado - tomado del backend modular
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 5432),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Incorrecto — nunca hardcodear credenciales
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  user:     'postgres',
  password: 'mi_contrasena',
  database: 'artify_db',
});
```

### Respuestas del servidor — mensajes en español

```javascript
// Ejemplo recomendado - tomado del backend modular
return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
return res.status(500).json({ mensaje: 'Error en el servidor' });
return res.status(400).json({ mensaje: 'El correo o cédula ya está registrado' });
res.json({ mensaje: 'Login exitoso', usuario: { ... } });
res.json({ mensaje: 'Usuario agregado correctamente' });
res.json({ mensaje: 'Usuario editado correctamente' });
res.json({ mensaje: 'Usuario eliminado correctamente' });
```

### Estructura de callbacks de PostgreSQL

```javascript
// Ejemplo recomendado - tomado del backend modular
db.query(query, [params], (err, results) => {
  if (err) {
    console.error('Error en la consulta:', err.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
  // Lógica de éxito
  res.json({ mensaje: 'ok', datos: results });
});
```

---

## 9. Estándares SQL y Base de Datos

### Nombres de tablas — MAYÚSCULAS

```sql
-- Ejemplo recomendado en SQL directo para PostgreSQL
SELECT * FROM "USUARIO";
SELECT * FROM "SESION_EDICION";
SELECT * FROM "OPERACION";
SELECT * FROM "CONFIGURACION";
SELECT * FROM "IMAGEN";

-- Incorrecto
SELECT * FROM usuario;
SELECT * FROM sesion_edicion;
```

En los controladores heredados pueden aparecer tablas sin comillas porque `backend/config/db.js` cita automáticamente los nombres antes de ejecutar la consulta con `pg`.

### Nombres de columnas — prefijo de tabla + snake_case

Cada columna tiene un prefijo de dos o tres letras que identifica a qué tabla pertenece.

```sql
-- Ejemplo recomendado
-- Tabla USUARIO       → prefijo usr_
usr_id_usuario
usr_nombres
usr_apellidos
usr_cedula
usr_correo
usr_contrasena
usr_fecha_registro
usr_ultimo_acceso
usr_sesion_activa
usr_estado_usuario
usr_rol

-- Tabla SESION_EDICION → prefijo ses_
ses_id_sesion
ses_usr_id_usuario
ses_fecha_inicio
ses_fecha_fin
ses_estado_sesion

-- Tabla OPERACION      → prefijo opr_
opr_id_operacion
opr_usr_id_usuario
opr_ses_id_sesion
opr_tipo_operacion
opr_fecha_hora
```

### Consultas SQL — multilínea con indentación

```javascript
// Ejemplo recomendado para controladores que usan backend/config/db.js
const query = `
  SELECT usr_id_usuario, usr_nombres, usr_apellidos,
         usr_cedula, usr_correo, usr_estado_usuario, usr_rol
  FROM USUARIO
  ORDER BY usr_fecha_registro DESC
`;

const queryUpdate = `
  UPDATE USUARIO
  SET usr_ultimo_acceso = NOW(),
      usr_sesion_activa = true
  WHERE usr_id_usuario = ?
`;

// Incorrecto
const query = 'SELECT usr_id_usuario, usr_nombres, usr_apellidos, usr_cedula, usr_correo, usr_estado_usuario, usr_rol FROM USUARIO ORDER BY usr_fecha_registro DESC';
```

Estos ejemplos conservan tablas sin comillas porque pasan por `backend/config/db.js`. En SQL directo ejecutado desde `psql`, se deben usar comillas dobles:

```sql
SELECT "usr_id_usuario", "usr_correo"
FROM "USUARIO"
ORDER BY "usr_fecha_registro" DESC;
```

### Vistas — prefijo v_

```sql
-- Ejemplo recomendado - definido en PostgreSQL
CREATE VIEW "v_usuarios_activos" AS
SELECT u."usr_id_usuario",
       CONCAT(u."usr_nombres", ' ', u."usr_apellidos") AS "nombre_completo",
       u."usr_correo",
       ...
FROM "USUARIO" u
WHERE u."usr_estado_usuario" = 'activo';
```

---

## 10. Convenciones para Comentarios

### Comentarios de sección — separadores con =

```javascript
// Ejemplo recomendado - usado en todo el proyecto
// ========== VARIABLES GLOBALES ==========
// ========== ENDPOINTS PANEL DE ADMINISTRACIÓN ==========
// ========== LIMPIEZA AUTOMÁTICA DE SESIONES INACTIVAS ==========
```

```css
/* Ejemplo recomendado - usado en admin.css */
/* ========== VARIABLES ========== */
/* ========== HEADER ========== */
/* ========== TABLA ========== */
```

```html
<!-- Ejemplo recomendado - usado en admin.html -->
<!-- ===== LOGIN DEL ADMINISTRADOR ===== -->
<!-- ===== PANEL PRINCIPAL ===== -->
```

### Comentarios explicativos — antes del bloque

```javascript
// Ejemplo recomendado - tomado del backend modular
// Buscar usuario en la base de datos usando la capa de compatibilidad
const query = 'SELECT * FROM USUARIO WHERE usr_correo = ?';

// Validar contraseña con bcrypt
const passwordValida = bcrypt.compareSync(password, usuario.usr_contrasena);

// Crear configuración por defecto
const configDefecto = JSON.stringify({ ... });

// Eliminar registros relacionados primero usando la capa de compatibilidad
const queries = [
  'DELETE FROM IMAGEN WHERE img_usr_id_usuario = ?',
  'DELETE FROM OPERACION WHERE opr_usr_id_usuario = ?',
  ...
];
```

### Comentarios de cambios importantes

```javascript
// CAMBIO: Artify en blanco y más grande
// Sidebar más angosto
// Soporte para ultrawide y pantallas divididas
```

---

## 11. Convenciones para Commits de Git

### Formato — tipo(alcance): descripción

La descripción del commit debe escribirse en español. El tipo y el alcance conservan el formato de Conventional Commits.

```bash
# Ejemplo recomendado - commits reales del proyecto Artify
git commit -m "feat(registro): crear configuración por defecto automáticamente al registrar usuario"
git commit -m "feat(sesion): agregar control de inactividad y limpieza automática de sesiones"
git commit -m "feat(filtros): registrar operaciones de filtros en PostgreSQL"
git commit -m "feat(admin): agregar panel de administración con CRUD completo sobre tabla USUARIO"
git commit -m "feat(roles): redirigir al panel de admin o editor según rol del usuario en login"
git commit -m "fix(admin): eliminar registros relacionados antes de eliminar usuario"
git commit -m "fix(db): adaptar endpoints para OPERACION, IMAGEN y SESION_EDICION"
git commit -m "fix(sesion): corregir campos en cron job de limpieza de sesiones"
git commit -m "style(admin): mejorar estilos del panel para pantallas ultrawide"
```

### Tipos de commit

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de errores |
| `style` | Cambios de estilos CSS o formato |
| `refactor` | Reestructuración de código sin cambiar funcionalidad |
| `docs` | Cambios en documentación |
| `chore` | Tareas de mantenimiento |

---

*Documento generado para el proyecto Artify — SENA 2026*
