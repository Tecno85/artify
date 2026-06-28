# Descripción del Proyecto Artify

> **Proyecto:** Artify - Editor de Imágenes Web
> **Programa:** Análisis y Desarrollo de Software - SENA
> **Autor:** Iván Darío Madrid Daza
> **Fecha:** Mayo 2026

---

## 1. Presentación del Proyecto

Artify es una aplicación web full stack orientada a la edición básica de imágenes desde el navegador. El proyecto integra una interfaz visual construida con HTML, CSS y JavaScript Vanilla, un backend desarrollado con Node.js y Express, y una base de datos PostgreSQL para persistir usuarios, sesiones, configuraciones y operaciones realizadas dentro del sistema.

Desarrollo Artify como proyecto académico del programa Análisis y Desarrollo de Software del SENA, con el propósito de aplicar conocimientos de maquetación web, programación frontend, construcción de servicios backend, autenticación, seguridad básica, persistencia de datos y organización profesional de un proyecto de software.

---

## 2. Problema o Necesidad

Muchas tareas de edición de imágenes no requieren herramientas complejas ni instalación de software especializado. En contextos académicos, personales o de trabajo ligero, un usuario puede necesitar recortar, redimensionar, rotar, aplicar filtros o convertir formatos de imagen de forma rápida desde el navegador.

Artify busca responder a esta necesidad mediante una solución web sencilla, accesible y organizada, que permita editar imágenes y, al mismo tiempo, registrar información relevante del uso del sistema mediante autenticación, sesiones y almacenamiento en base de datos.

---

## 3. Objetivo General

Desarrollar una aplicación web para la edición de imágenes que permita a los usuarios autenticarse, cargar imágenes, aplicar operaciones básicas de edición y gestionar su experiencia dentro del sistema mediante configuraciones, sesiones y registro de actividad.

---

## 4. Objetivos Específicos

- Implementar una interfaz web clara para cargar, visualizar y editar imágenes.
- Permitir operaciones como recorte, redimensionamiento, rotación, filtros, zoom, conversión de formato y descarga.
- Incorporar autenticación de usuarios con contraseñas protegidas mediante `bcrypt`.
- Gestionar roles de usuario y administrador.
- Registrar sesiones, operaciones y configuraciones en una base de datos PostgreSQL.
- Desarrollar un panel administrativo para consultar, crear, editar y eliminar usuarios.
- Mantener documentación técnica y funcional organizada para facilitar la entrega académica y la continuidad del proyecto.

---

## 5. Alcance del Proyecto

El alcance actual de Artify incluye:

- Registro e inicio de sesión de usuarios.
- Autenticación con token firmado desde el backend.
- Editor de imágenes con herramientas básicas de transformación.
- Persistencia de usuarios, configuraciones, sesiones, operaciones e imágenes en PostgreSQL.
- Panel de administración protegido por rol.
- API REST para funcionalidades internas y endpoints de analíticas.
- Pruebas automatizadas para el módulo de autenticación y rutas protegidas.
- Documentación del proyecto y documentación técnica separadas en la carpeta `docs/`.

No hacen parte del alcance actual funciones avanzadas como edición colaborativa en tiempo real, almacenamiento de archivos en la nube, inteligencia artificial para imágenes, pagos, integración con redes sociales o despliegue productivo en infraestructura externa.

---

## 6. Usuarios del Sistema

| Usuario | Descripción |
| --- | --- |
| Usuario registrado | Persona que crea una cuenta, inicia sesión y utiliza el editor de imágenes. |
| Administrador | Usuario con permisos para acceder al panel administrativo y gestionar registros de la tabla `USUARIO`. |
| Visitante | Persona que puede acceder a la página principal, pero debe registrarse o iniciar sesión para usar el editor. |

---

## 7. Módulos Principales

### 7.1 Módulo de autenticación

Permite registrar usuarios, iniciar sesión, validar credenciales y generar un token firmado para proteger rutas del sistema.

### 7.2 Módulo editor de imágenes

Permite cargar imágenes y aplicar operaciones como recorte, redimensionamiento, rotación, filtros, conversión de formato, zoom, deshacer, rehacer y descarga.

### 7.3 Módulo de configuración

Permite guardar preferencias del usuario, como calidad de exportación, formato por defecto, notificaciones y autoguardado.

### 7.4 Módulo de sesiones y operaciones

Registra sesiones de edición y operaciones realizadas por los usuarios para conservar trazabilidad dentro de la base de datos.

### 7.5 Módulo administrativo

Permite al administrador gestionar usuarios mediante operaciones CRUD y consultar estadísticas básicas.

### 7.6 Módulo de analíticas

Expone endpoints REST para consultar información agregada sobre filtros, horarios, formatos preferidos y tasa de conversión.

---

## 8. Tecnologías Utilizadas

| Capa | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript Vanilla |
| Edición de imágenes | Canvas API |
| Backend | Node.js, Express |
| Base de datos | PostgreSQL |
| Autenticación | Token firmado propio, `bcryptjs` |
| Gestor de paquetes | pnpm |
| Pruebas | Node Test Runner |
| Control de versiones | Git y GitHub |

---

## 9. Valor del Proyecto

Artify demuestra la integración de diferentes competencias del desarrollo de software en un producto funcional: interfaz gráfica, lógica de negocio, seguridad, base de datos, API REST, pruebas y documentación.

Desde el punto de vista académico, el proyecto permite evidenciar el proceso de análisis, construcción, validación y organización de una solución web. Desde el punto de vista de portafolio, muestra una aplicación full stack con funcionalidades reales, estructura clara y buenas prácticas progresivas de desarrollo.

---

## 10. Estado Actual

El proyecto se encuentra en estado activo. Actualmente cuenta con frontend funcional, backend modularizado, base de datos PostgreSQL, autenticación real, panel administrativo, pruebas automatizadas de autenticación y documentación organizada en:

- `docs/proyecto/`: documentación funcional y académica.
- `docs/tecnica/`: documentación técnica y manual técnico.

El desarrollo continúa con mejoras orientadas a ampliar pruebas, fortalecer documentación técnica, mejorar despliegue y mantener el proyecto listo para entrega académica y portafolio.
