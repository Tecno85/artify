# Requerimientos Funcionales de Artify

> **Proyecto:** Artify - Editor de Imágenes Web
> **Programa:** Análisis y Desarrollo de Software - SENA
> **Autor:** Iván Darío Madrid Daza
> **Fecha:** Mayo 2026

---

## 1. Objetivo del Documento

En este documento identifico los requerimientos funcionales principales de Artify. Estos requerimientos describen las acciones que el sistema debe permitir a los usuarios, administradores y visitantes, de acuerdo con el alcance actual del proyecto.

La finalidad es dejar una base clara para comprender qué funcionalidades ofrece Artify, cómo se relacionan con sus módulos principales y qué criterios permiten validar su cumplimiento.

---

## 2. Actores del Sistema

| Actor | Descripción |
| --- | --- |
| Visitante | Persona que accede a la página principal y puede dirigirse al registro o inicio de sesión. |
| Usuario registrado | Persona que tiene una cuenta, inicia sesión y utiliza el editor de imágenes. |
| Administrador | Usuario con rol administrativo que puede gestionar usuarios desde el panel de administración. |

---

## 3. Requerimientos Funcionales

| Código | Requerimiento | Actor | Prioridad |
| --- | --- | --- | --- |
| RF-01 | El sistema debe permitir el registro de nuevos usuarios. | Visitante | Alta |
| RF-02 | El sistema debe permitir el inicio de sesión con correo y contraseña. | Usuario registrado | Alta |
| RF-03 | El sistema debe redirigir al usuario según su rol después del inicio de sesión. | Usuario registrado / Administrador | Alta |
| RF-04 | El sistema debe proteger rutas y operaciones mediante token de autenticación. | Usuario registrado / Administrador | Alta |
| RF-05 | El sistema debe permitir cargar imágenes desde el navegador. | Usuario registrado | Alta |
| RF-06 | El sistema debe permitir recortar imágenes. | Usuario registrado | Media |
| RF-07 | El sistema debe permitir redimensionar imágenes. | Usuario registrado | Media |
| RF-08 | El sistema debe permitir rotar imágenes. | Usuario registrado | Media |
| RF-09 | El sistema debe permitir aplicar filtros visuales. | Usuario registrado | Media |
| RF-10 | El sistema debe permitir convertir imágenes a diferentes formatos. | Usuario registrado | Media |
| RF-11 | El sistema debe permitir descargar la imagen editada. | Usuario registrado | Alta |
| RF-12 | El sistema debe registrar sesiones de edición. | Usuario registrado | Alta |
| RF-13 | El sistema debe registrar operaciones realizadas sobre imágenes. | Usuario registrado | Media |
| RF-14 | El sistema debe permitir consultar y guardar configuraciones de usuario. | Usuario registrado | Media |
| RF-15 | El sistema debe permitir al administrador listar usuarios. | Administrador | Alta |
| RF-16 | El sistema debe permitir al administrador crear usuarios. | Administrador | Alta |
| RF-17 | El sistema debe permitir al administrador editar usuarios. | Administrador | Alta |
| RF-18 | El sistema debe permitir al administrador eliminar usuarios. | Administrador | Alta |
| RF-19 | El sistema debe exponer información de analíticas mediante API REST. | Usuario técnico / Sistema externo | Baja |

---

## 4. Detalle de Requerimientos

### RF-01 Registro de usuarios

El sistema debe permitir que un visitante cree una cuenta ingresando nombres, apellidos, cédula, fecha de nacimiento, correo electrónico y contraseña.

**Criterios de aceptación:**

- El sistema valida que los datos obligatorios estén completos.
- El sistema rechaza correos o cédulas duplicadas.
- La contraseña se almacena en la base de datos como hash generado con `bcrypt`.
- Al finalizar el registro correctamente, el sistema crea el usuario y permite continuar el flujo autenticado.

### RF-02 Inicio de sesión

El sistema debe permitir que un usuario registrado inicie sesión con correo electrónico y contraseña.

**Criterios de aceptación:**

- El sistema valida el formato del correo.
- El sistema compara la contraseña ingresada contra el hash almacenado.
- Si las credenciales son correctas, el sistema genera un token firmado.
- Si las credenciales son incorrectas, el sistema responde con un mensaje claro.

### RF-03 Redirección por rol

El sistema debe redirigir al usuario según el rol asociado a su cuenta.

**Criterios de aceptación:**

- Un usuario con rol `usuario` accede al editor.
- Un usuario con rol `admin` accede al panel administrativo.
- La información de sesión se conserva durante la navegación mediante `sessionStorage` y token de autenticación.

### RF-04 Protección de rutas

El sistema debe proteger las rutas privadas mediante token de autenticación y validación de permisos.

**Criterios de aceptación:**

- Las rutas protegidas rechazan solicitudes sin token.
- Las rutas protegidas rechazan tokens inválidos o expirados.
- Un usuario no puede acceder o modificar recursos de otro usuario.
- Las acciones administrativas requieren rol `admin`.

### RF-05 Carga de imágenes

El sistema debe permitir cargar imágenes desde el navegador mediante selector de archivos o arrastrar y soltar.

**Criterios de aceptación:**

- El sistema permite cargar imágenes compatibles.
- El sistema muestra la imagen en el área de edición.
- Al cargar una imagen se habilitan las herramientas principales del editor.

### RF-06 Recorte de imágenes

El sistema debe permitir recortar imágenes con diferentes proporciones.

**Criterios de aceptación:**

- El usuario puede activar el modo de recorte.
- El usuario puede seleccionar proporciones como libre, 1:1, 16:9, 4:3 o 3:2.
- El sistema aplica el recorte sobre la imagen cargada.

### RF-07 Redimensionamiento de imágenes

El sistema debe permitir cambiar el ancho y alto de una imagen.

**Criterios de aceptación:**

- El usuario puede ingresar nuevas dimensiones.
- El sistema permite mantener la proporción cuando corresponde.
- La imagen se actualiza con las dimensiones indicadas.

### RF-08 Rotación de imágenes

El sistema debe permitir rotar la imagen en ángulos predefinidos.

**Criterios de aceptación:**

- El usuario puede aplicar rotaciones de 90, 180 o 270 grados.
- La vista de la imagen se actualiza después de aplicar la rotación.

### RF-09 Filtros visuales

El sistema debe permitir aplicar filtros artísticos a la imagen.

**Criterios de aceptación:**

- El usuario puede aplicar filtros como blanco y negro, sepia, brillo y contraste.
- El sistema permite ajustar la intensidad del filtro cuando aplique.
- El filtro se refleja visualmente sobre la imagen.

### RF-10 Conversión de formato

El sistema debe permitir convertir la imagen a diferentes formatos de salida.

**Criterios de aceptación:**

- El usuario puede seleccionar formatos como PNG, JPEG o WebP.
- El sistema permite configurar calidad para formatos que lo soporten.
- La imagen puede descargarse en el formato seleccionado.

### RF-11 Descarga de imagen editada

El sistema debe permitir descargar la imagen resultante después de la edición.

**Criterios de aceptación:**

- El botón de descarga se habilita cuando existe una imagen cargada.
- El archivo descargado refleja las operaciones aplicadas.
- El sistema respeta la configuración de formato y calidad seleccionada.

### RF-12 Registro de sesiones de edición

El sistema debe registrar sesiones de edición asociadas al usuario autenticado.

**Criterios de aceptación:**

- Al iniciar el uso del editor, el sistema registra una sesión.
- Al cerrar o finalizar la sesión, el sistema actualiza su estado.
- El sistema puede cerrar sesiones abandonadas por inactividad.

### RF-13 Registro de operaciones

El sistema debe registrar operaciones realizadas por el usuario durante la edición.

**Criterios de aceptación:**

- El sistema registra el tipo de operación realizada.
- La operación queda asociada al usuario y a la sesión correspondiente.
- El sistema evita registrar operaciones sobre sesiones que no pertenecen al usuario.

### RF-14 Configuración personalizada

El sistema debe permitir consultar y guardar preferencias del usuario.

**Criterios de aceptación:**

- El usuario puede consultar su configuración guardada.
- El usuario puede guardar preferencias como formato por defecto, calidad, notificaciones y autoguardado.
- El sistema conserva la configuración en la base de datos.

### RF-15 Listar usuarios

El sistema debe permitir que el administrador consulte los usuarios registrados.

**Criterios de aceptación:**

- Solo un administrador autenticado puede acceder al listado.
- El sistema muestra información relevante de los usuarios.
- El panel permite búsqueda en tiempo real.

### RF-16 Crear usuarios desde administración

El sistema debe permitir que el administrador cree usuarios desde el panel administrativo.

**Criterios de aceptación:**

- El formulario valida los datos requeridos.
- El sistema evita crear registros duplicados por correo o cédula.
- La contraseña se almacena protegida mediante hash.

### RF-17 Editar usuarios

El sistema debe permitir que el administrador actualice datos de usuarios existentes.

**Criterios de aceptación:**

- El administrador puede modificar datos personales y estado del usuario.
- El sistema valida los datos antes de guardar.
- Los cambios se reflejan en la tabla `USUARIO`.

### RF-18 Eliminar usuarios

El sistema debe permitir que el administrador elimine usuarios.

**Criterios de aceptación:**

- El sistema solicita confirmación antes de eliminar.
- El sistema elimina primero la información dependiente para conservar integridad referencial.
- El usuario eliminado deja de aparecer en el listado administrativo.

### RF-19 API de analíticas

El sistema debe exponer endpoints REST para consultar información agregada del uso de Artify.

**Criterios de aceptación:**

- La API permite consultar filtros populares.
- La API permite consultar horarios de edición.
- La API permite consultar formatos preferidos.
- La API permite consultar tasa de conversión.

---

## 5. Requerimientos Fuera del Alcance Actual

Por ahora no se contemplan como parte del alcance funcional:

- Edición colaborativa en tiempo real.
- Almacenamiento de imágenes en servicios externos.
- Recuperación de contraseña por correo electrónico.
- Integración con pagos o suscripciones.
- Publicación directa en redes sociales.
- Funciones de inteligencia artificial para generación o mejora de imágenes.

---

## 6. Relación con las Pruebas

Los requerimientos relacionados con autenticación, registro, inicio de sesión, tokens, rutas protegidas y acceso a recursos de usuario se validan mediante pruebas automatizadas en el backend.

El plan específico de pruebas del módulo de autenticación se encuentra en:

```text
docs/tecnica/plan-pruebas-autenticacion.md
```
