# Backend, API Y Seguridad

Leer esta referencia al trabajar en `backend/controllers/`, `backend/routes/`, `backend/middlewares/`, `backend/utils/`, `backend/server.js`, autenticación, administración, analytics, contratos API, variables de entorno o seguridad HTTP.

## Arquitectura Y Contratos

- Usar `pnpm` dentro de `backend/`; no mezclar gestores ni generar lockfiles alternos.
- Mantener rutas para endpoints, controladores para lógica, middlewares para autenticación y autorización, y utils para helpers compartidos.
- Consultar `CONTEXT.md` y las pruebas antes de cambiar rutas o respuestas; no duplicar listas de endpoints aquí.
- Revisar frontend y pruebas antes de cambiar campos de respuesta como `mensaje`, `usuario`, `token`, `usuarios` o `estadisticas`.
- Centralizar una validación repetida en un helper cuando reduzca duplicación sin ocultar reglas específicas del dominio.
- Rechazar IDs malformados y payloads inválidos antes de consultar o modificar datos.

## Seguridad

- Validar en backend aunque el frontend valide.
- Conservar contraseñas con bcrypt, tokens firmados por backend y autorización por rol o propietario.
- Volver a comprobar estado y rol vigentes cuando la ruta privada dependa de ellos.
- Mantener `.env` fuera del repositorio y actualizar `.env.example` cuando cambien variables requeridas.
- No exponer secretos, tokens, cadenas de conexión ni datos personales en código, documentación, comandos capturados, logs o evidencias.
- Mantener respuestas uniformes y evitar revelar detalles internos innecesarios.

## Impacto Obligatorio

- Al cambiar autenticación, revisar almacenamiento temporal y recordado, expiración, redirección por rol y pruebas negativas.
- Al cambiar administración, revisar autorización, CRUD, estados de cuenta, renderizado seguro y manejo de tablas vacías.
- Al cambiar analytics, revisar consultas con y sin datos, significado de las métricas, contratos frontend y documentación técnica.
- Al cambiar variables o arranque, revisar `.env.example`, validaciones de configuración, `/health`, `/ready` y documentación de despliegue.
