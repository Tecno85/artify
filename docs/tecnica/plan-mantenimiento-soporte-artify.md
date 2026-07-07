# Plan de mantenimiento y soporte del software Artify SENA PostgreSQL

**Evidencia de desempeño:** Diseñar plan de mantenimiento y soporte del software. GA10-220501097-AA8-EV01  
**Proyecto formativo:** Artify SENA PostgreSQL - Editor de Imágenes Web  
**Aprendiz:** Iván Darío Madrid Daza  
**Programa:** Análisis y Desarrollo de Software - SENA  
**Fecha:** Julio de 2026  

![Ciclo de mantenimiento de Artify](./evidencias/mantenimiento-soporte/mantenimiento-ciclo-iso14764.svg)

## Resumen

En este documento diseño el plan de mantenimiento y soporte para Artify SENA PostgreSQL, una aplicación web full stack para edición básica de imágenes. Tomo como referencia la norma ISO/IEC/IEEE 14764, que organiza el mantenimiento de software dentro del ciclo de vida del producto y plantea actividades como implementación del proceso, análisis de modificaciones, implementación, aceptación, migración y retiro (Organización Internacional de Normalización [ISO], 2022).

Mi propósito es dejar definido cómo voy a prevenir fallos, cómo voy a corregir errores cuando aparezcan y cómo voy a conservar la trazabilidad técnica del proyecto. Para esto separo el mantenimiento en dos tipos principales: preventivo y correctivo. El mantenimiento preventivo busca evitar problemas antes de que afecten al usuario, mientras que el correctivo se activa cuando ya existe un error, incidente o comportamiento inesperado.

**Palabras clave:** mantenimiento de software, soporte técnico, ISO 14764, mantenimiento preventivo, mantenimiento correctivo, Artify.

## Descripción del sistema

Artify SENA PostgreSQL es una solución web orientada a la edición básica de imágenes desde el navegador. El sistema permite que una persona se registre, inicie sesión, cargue una imagen, aplique operaciones como recorte, redimensionamiento, rotación, filtros, zoom y conversión de formato, y luego descargue el resultado.

El proyecto está organizado en tres capas principales:

| Capa | Componentes | Responsabilidad |
| --- | --- | --- |
| Frontend | HTML5, CSS3, JavaScript Vanilla y Canvas API | Presentar la interfaz, permitir la edición de imágenes y consumir la API del backend. |
| Backend | Node.js, Express, middlewares, controladores y rutas REST | Procesar autenticación, sesiones, operaciones, configuración, administración y analíticas. |
| Base de datos | PostgreSQL | Persistir usuarios, configuraciones, imágenes, sesiones de edición y operaciones. |

Los módulos principales que debo mantener son:

- **Autenticación:** registro, inicio de sesión, token firmado y validación de rol.
- **Editor de imágenes:** carga de archivos, canvas, filtros, recorte, redimensionamiento, rotación, zoom, historial y descarga.
- **Panel administrativo:** gestión CRUD de usuarios y estadísticas básicas.
- **Sesiones y operaciones:** registro de actividad del usuario en PostgreSQL.
- **Analíticas:** endpoints para consultar filtros populares, horarios de edición, formatos preferidos y tasa de conversión.
- **Documentación y evidencias:** archivos en `docs/proyecto/` y `docs/tecnica/` que respaldan la entrega académica y técnica.

Como Artify maneja autenticación y datos de usuarios, el mantenimiento también debe cuidar la seguridad. Por eso incluyo revisión de dependencias, validación de rutas protegidas y control de vulnerabilidades frecuentes en aplicaciones web, tomando como apoyo recomendaciones generales como OWASP Top 10 (OWASP Foundation, 2021).

## Alcance del plan de mantenimiento

Este plan aplica a la variante actual del proyecto `artify-sena-postgresql`. No propongo cambiar la arquitectura base ni introducir frameworks nuevos. Mantengo la estructura existente del proyecto:

```text
frontend/
backend/
database/postgresql/
docs/
scripts/
```

El plan cubre:

- Código frontend.
- API backend.
- Base de datos PostgreSQL.
- Configuración de entorno.
- Pruebas automatizadas.
- Documentación técnica.
- Evidencias académicas.
- Despliegue del frontend, backend y base de datos.

El plan no cubre soporte comercial 24/7, infraestructura empresarial de alta disponibilidad ni almacenamiento externo de imágenes, porque esas funciones no hacen parte del alcance actual del proyecto.

## Objetivos del mantenimiento

Mi objetivo general es conservar Artify funcional, seguro, documentado y fácil de evolucionar durante su ciclo de vida académico y técnico.

Los objetivos específicos son:

- Prevenir fallos mediante revisiones programadas de código, dependencias, base de datos y configuración.
- Corregir errores reportados con un flujo claro de diagnóstico, implementación, pruebas y aceptación.
- Mantener la coherencia entre código, base de datos y documentación.
- Reducir riesgos de seguridad asociados a autenticación, CORS, tokens, contraseñas y rutas protegidas.
- Conservar evidencias de cada intervención para facilitar seguimiento y evaluación.
- Planear migraciones y retiro de versiones antiguas sin perder datos ni trazabilidad.

## Tipos de mantenimiento

### Mantenimiento preventivo

El mantenimiento preventivo lo aplico antes de que ocurra una falla. En Artify consiste en revisar periódicamente dependencias, pruebas, base de datos, documentación, variables de entorno, rutas protegidas y comportamiento del editor.

Actividades preventivas principales:

| Actividad | Frecuencia | Evidencia esperada |
| --- | --- | --- |
| Ejecutar `pnpm run check` en backend | Cada cambio importante | Salida de consola sin errores de sintaxis. |
| Ejecutar `pnpm test` | Mensual o antes de entregar cambios | Resultado de pruebas automatizadas. |
| Revisar dependencias de Node.js | Mensual | Registro de versiones y riesgos encontrados. |
| Revisar variables `.env.example` | Trimestral | Confirmación de variables vigentes. |
| Verificar `schema.sql` y `seed.sql` | Trimestral | Confirmación de estructura activa de PostgreSQL. |
| Revisar documentación técnica | Mensual | Documentos actualizados frente al estado real. |
| Verificar login, editor y panel admin | Mensual | Lista de chequeo funcional. |
| Realizar respaldo de base de datos | Mensual o antes de migraciones | Archivo de respaldo identificado por fecha. |

### Mantenimiento correctivo

El mantenimiento correctivo lo aplico cuando ya existe un problema. Puede tratarse de un error visual, una ruta API que responde mal, una falla de autenticación, una consulta SQL incorrecta, una prueba rota o una documentación que contradice el comportamiento real del sistema.

![Flujo correctivo de Artify](./evidencias/mantenimiento-soporte/flujo-correctivo-artify.svg)

Actividades correctivas principales:

| Etapa | Acción |
| --- | --- |
| Registro del incidente | Describo el problema, fecha, módulo afectado y pasos para reproducir. |
| Diagnóstico | Identifico si el origen está en frontend, backend, base de datos, entorno o documentación. |
| Priorización | Clasifico el impacto como crítico, alto, medio o bajo. |
| Corrección | Implemento el cambio en una rama o conjunto de cambios controlado. |
| Pruebas | Ejecuto pruebas automatizadas y prueba manual dirigida. |
| Aceptación | Verifico que el error no se repita y que no se haya afectado otro módulo. |
| Documentación | Registro la causa, la solución y los archivos modificados. |

## Proceso de implementación

Para implementar el mantenimiento de Artify sigo un proceso ordenado, inspirado en ISO/IEC/IEEE 14764. Esta norma ubica el mantenimiento como un proceso formal del ciclo de vida del software, no como una actividad improvisada al final del desarrollo (ISO, 2022).

### Roles

Como aprendiz y responsable del proyecto, asumo los siguientes roles:

| Rol | Responsabilidad |
| --- | --- |
| Responsable técnico | Analizo, implemento, pruebo y documento los cambios. |
| Usuario de prueba | Valido que login, editor y panel administrativo funcionen como se espera. |
| Administrador del sistema | Reviso usuarios, configuración, base de datos y despliegue. |
| Documentador | Mantengo actualizados README, contexto técnico y evidencias. |

### Entradas del proceso

Las entradas que uso para iniciar una actividad de mantenimiento son:

- Reporte de error o necesidad de mejora.
- Resultado fallido de una prueba.
- Cambio requerido por la evidencia académica.
- Actualización de dependencia.
- Alerta de seguridad.
- Cambio en infraestructura de despliegue.
- Necesidad de migración de base de datos o configuración.

### Salidas del proceso

Las salidas que debe dejar cada mantenimiento son:

- Cambio de código, configuración, base de datos o documentación.
- Pruebas ejecutadas.
- Evidencia del resultado.
- Registro de archivos modificados.
- Criterio de aceptación cumplido.
- Nota de cierre del mantenimiento.

### Herramientas de apoyo

| Herramienta | Uso dentro del mantenimiento |
| --- | --- |
| Git y GitHub | Control de versiones, ramas, commits y revisión de cambios. |
| pnpm | Gestión de dependencias del backend. |
| Node Test Runner | Ejecución de pruebas automatizadas. |
| PostgreSQL | Verificación de esquema, datos y consultas. |
| README y CONTEXT | Trazabilidad técnica del estado actual. |
| GitHub Pull Requests | Revisión y discusión de cambios antes de integrarlos. |

Las solicitudes de cambio y revisión mediante pull requests ayudan a discutir modificaciones antes de unirlas a la rama principal, lo cual mejora la trazabilidad del mantenimiento (GitHub, 2026a).

## Análisis de modificación y problemas

Antes de modificar Artify, analizo el problema para evitar cambios innecesarios o incompletos. Este análisis me permite diferenciar si estoy frente a un error, una mejora preventiva, una deuda técnica, una actualización de seguridad o una migración.

### Clasificación del problema

| Tipo | Ejemplo en Artify | Tipo de mantenimiento |
| --- | --- | --- |
| Error funcional | El login no redirige al editor después de autenticarse. | Correctivo |
| Error visual | El panel admin se desborda en pantallas pequeñas. | Correctivo |
| Error de datos | Una operación no se registra en PostgreSQL. | Correctivo |
| Riesgo de seguridad | Dependencia vulnerable o token mal configurado. | Preventivo o correctivo |
| Mejora de pruebas | Agregar pruebas para rutas de administración. | Preventivo |
| Actualización documental | README no refleja una ruta nueva. | Preventivo |
| Migración | Cambiar proveedor de base de datos o actualizar PostgreSQL. | Preventivo planificado |

### Criterios de prioridad

Uso cuatro niveles de prioridad:

| Prioridad | Criterio | Tiempo objetivo de atención |
| --- | --- | --- |
| Crítica | Impide iniciar sesión, editar imágenes o expone datos sensibles. | Mismo día |
| Alta | Afecta una función principal, pero existe una alternativa temporal. | 1 a 2 días |
| Media | Afecta una función secundaria o documentación importante. | 3 a 5 días |
| Baja | Mejora menor, ajuste visual o limpieza técnica sin impacto directo. | Próximo ciclo preventivo |

### Análisis de impacto

Antes de implementar una modificación reviso:

- Archivos afectados.
- Rutas API relacionadas.
- Tablas de PostgreSQL involucradas.
- Pruebas existentes que cubren el cambio.
- Riesgo sobre autenticación y autorización.
- Impacto en la documentación.
- Impacto en despliegue.

Por ejemplo, si modifico `/api/login`, no solo debo revisar `auth.controller.js`; también debo verificar `login.js`, redirección por rol, estructura de respuesta, token y pruebas de autenticación.

## Implementación de la modificación

Cuando ya entiendo el problema, ejecuto la modificación siguiendo pasos controlados.

### Flujo de trabajo

1. Registro el problema o necesidad de mantenimiento.
2. Reproduzco el comportamiento actual.
3. Identifico archivos y módulos afectados.
4. Creo o separo el cambio de forma controlada.
5. Implemento la modificación mínima necesaria.
6. Ejecuto validaciones.
7. Actualizo documentación si el comportamiento cambia.
8. Reviso el resultado.
9. Cierro el mantenimiento con evidencia.

### Reglas para modificar código

- Mantengo JavaScript Vanilla en frontend.
- Mantengo Node.js, Express y `pg` en backend.
- No cambio contratos API sin revisar frontend y pruebas.
- Valido datos en backend aunque el frontend también valide.
- No subo archivos `.env` reales.
- Mantengo los nombres de tablas y columnas PostgreSQL usados por el proyecto.
- Documento cualquier cambio que afecte instalación, despliegue o uso.

### Pruebas mínimas por tipo de cambio

| Cambio | Validación mínima |
| --- | --- |
| Backend | `cd backend && pnpm run check` |
| Autenticación o rutas protegidas | `cd backend && pnpm test` |
| Base de datos | Revisar `schema.sql`, `seed.sql` y consultas afectadas |
| Frontend | Prueba manual en navegador sobre login, editor o admin |
| Documentación | Revisar enlaces, rutas y coherencia con el estado real |
| Despliegue | Probar `/health` y consumo real de API desde frontend |

### Control de seguridad

Para cambios relacionados con seguridad, reviso especialmente:

- Contraseñas protegidas con `bcryptjs`.
- Token firmado desde backend.
- Rutas protegidas por autenticación.
- Acceso de administrador solo con rol `admin`.
- CORS configurado por entorno.
- Mensajes de error sin filtración de datos sensibles.
- Dependencias actualizadas.

GitHub ofrece mecanismos para revisar y automatizar actualizaciones de dependencias, lo cual es útil para mantener el proyecto con menor exposición a vulnerabilidades conocidas (GitHub, 2026b).

## Aceptación y revisión del mantenimiento

Un mantenimiento no queda cerrado solo porque el código haya cambiado. Yo lo considero aceptado cuando el problema queda resuelto, el sistema sigue funcionando y existe evidencia de la revisión.

### Criterios de aceptación

| Criterio | Descripción |
| --- | --- |
| Funcionalidad | La función corregida o mantenida opera como se espera. |
| No regresión | No se rompe login, editor, admin, API o base de datos. |
| Pruebas | Se ejecutan las pruebas aplicables y se registran resultados. |
| Seguridad | No se introducen credenciales, tokens o datos sensibles al repositorio. |
| Documentación | README, CONTEXT o docs se actualizan cuando corresponde. |
| Trazabilidad | El cambio queda identificado por fecha, archivos y motivo. |

### Lista de chequeo de aceptación

- [ ] El problema fue reproducido o la actividad preventiva fue justificada.
- [ ] Se identificó el módulo afectado.
- [ ] La modificación fue implementada.
- [ ] Se ejecutaron las pruebas aplicables.
- [ ] Se revisó el comportamiento manualmente si aplica.
- [ ] Se actualizó documentación cuando fue necesario.
- [ ] Se registró el cierre del mantenimiento.

### Revisión posterior

Después de cerrar una modificación importante, hago una revisión posterior para aprender del caso. En esa revisión respondo:

- ¿Cuál fue la causa principal?
- ¿El problema se pudo prevenir?
- ¿Hace falta agregar una prueba?
- ¿Hace falta mejorar documentación?
- ¿El cambio afectó despliegue, base de datos o seguridad?

## Migración

La migración es el proceso mediante el cual muevo Artify de una versión, entorno o tecnología hacia otra, cuidando que los usuarios y datos no se pierdan.

En Artify pueden existir estos escenarios de migración:

| Escenario | Ejemplo |
| --- | --- |
| Migración de base de datos | Pasar de una instancia local PostgreSQL a Neon. |
| Migración de backend | Mover el servicio Node.js a otro proveedor. |
| Migración de frontend | Cambiar configuración de Netlify o URL pública de API. |
| Migración de versión | Actualizar Node.js, Express o PostgreSQL. |
| Migración documental | Reorganizar evidencias sin perder trazabilidad. |

### Plan de migración

Cuando tenga que migrar Artify, seguiré estos pasos:

1. Identifico el motivo de la migración.
2. Hago respaldo de la base de datos.
3. Documento el estado inicial.
4. Preparo el nuevo entorno.
5. Cargo esquema y datos.
6. Configuro variables de entorno.
7. Pruebo `/health`, login, editor y panel admin.
8. Comparo resultados antes y después.
9. Dejo documentado el cambio.

### Riesgos de migración

| Riesgo | Control |
| --- | --- |
| Pérdida de datos | Respaldo previo y prueba de restauración. |
| Variables incorrectas | Revisión de `.env.example` y configuración del proveedor. |
| Error de CORS | Validar `CORS_ORIGIN` con la URL real del frontend. |
| Incompatibilidad de versión | Verificar versiones de Node.js, pnpm y PostgreSQL. |
| Caída temporal | Planear ventana de mantenimiento. |

La documentación de MDN sobre Canvas API es importante para este proyecto porque el editor depende del canvas del navegador para manipular imágenes; por eso, en una migración de frontend debo comprobar que el comportamiento del canvas siga siendo compatible con los navegadores objetivo (MDN Web Docs, 2026).

## Retiro

El retiro ocurre cuando una versión, módulo, servicio o documentación deja de usarse. No significa borrar sin control, sino cerrar de manera ordenada.

En Artify puedo aplicar retiro en estos casos:

- Versión antigua del backend.
- Script SQL anterior.
- Documento reemplazado por una versión nueva.
- Configuración de despliegue que ya no se usa.
- Recurso visual o archivo estático obsoleto.
- Rama de Git que ya fue integrada.

### Proceso de retiro

1. Confirmo que el elemento ya no se usa.
2. Reviso dependencias o referencias internas.
3. Hago respaldo si contiene información útil.
4. Actualizo documentación e índice.
5. Elimino o archivo el elemento.
6. Verifico que el proyecto siga funcionando.
7. Registro la decisión.

### Criterios para retirar un componente

| Criterio | Aplicación |
| --- | --- |
| Obsolescencia | El componente ya fue reemplazado. |
| Riesgo | El componente genera vulnerabilidad o confusión. |
| Duplicidad | Existe otro archivo que cumple la misma función. |
| Incompatibilidad | Ya no funciona con la versión actual del proyecto. |
| Cierre académico | La evidencia o documento ya fue entregado y archivado. |

## Cronograma de mantenimiento

El siguiente cronograma organiza las actividades preventivas durante seis meses y deja el mantenimiento correctivo disponible bajo demanda.

![Cronograma de mantenimiento de Artify](./evidencias/mantenimiento-soporte/cronograma-mantenimiento-artify.svg)

| Actividad | Mes 1 | Mes 2 | Mes 3 | Mes 4 | Mes 5 | Mes 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Revisar dependencias backend | X |  | X |  | X | X |
| Respaldar base de datos | X | X | X | X | X | X |
| Ejecutar pruebas API | X |  | X |  | X | X |
| Revisar seguridad y CORS | X |  |  | X |  | X |
| Actualizar documentación | X |  | X |  | X | X |
| Verificar frontend manualmente | X | X | X | X | X | X |
| Revisar despliegue y `/health` | X | X | X | X | X | X |
| Atender correctivos | Según reporte | Según reporte | Según reporte | Según reporte | Según reporte | Según reporte |

## Matriz de responsabilidades

| Actividad | Responsable | Soporte | Evidencia |
| --- | --- | --- | --- |
| Revisión de código | Aprendiz | Git/GitHub | Diff o commit |
| Pruebas backend | Aprendiz | Node Test Runner | Resultado `pnpm test` |
| Revisión frontend | Aprendiz | Navegador | Captura o lista de chequeo |
| Respaldo PostgreSQL | Aprendiz | `pg_dump` o herramienta equivalente | Archivo de respaldo |
| Actualización documental | Aprendiz | Markdown | Documento actualizado |
| Aceptación del cambio | Aprendiz | Lista de chequeo | Registro de cierre |

## Formato de registro de mantenimiento

Para dejar trazabilidad, usaré el siguiente formato cada vez que realice una actividad de mantenimiento:

```text
ID:
Fecha:
Tipo de mantenimiento: Preventivo / Correctivo
Modulo afectado:
Descripcion:
Causa identificada:
Archivos modificados:
Pruebas ejecutadas:
Resultado:
Responsable:
Estado: Abierto / En revision / Cerrado
Observaciones:
```

## Indicadores de seguimiento

Para evaluar si el mantenimiento está funcionando, usaré estos indicadores:

| Indicador | Meta |
| --- | --- |
| Pruebas automatizadas exitosas | 100 % antes de entregar cambios importantes |
| Incidentes críticos abiertos | 0 |
| Documentos técnicos desactualizados | 0 en cada cierre mensual |
| Respaldos realizados | 1 mensual como mínimo |
| Tiempo de atención de incidentes críticos | Mismo día |
| Variables sensibles publicadas por error | 0 |

## Conclusiones

Con este plan dejo definido cómo voy a mantener Artify SENA PostgreSQL de forma ordenada. La norma ISO/IEC/IEEE 14764 me sirve como guía porque no reduce el mantenimiento a corregir errores, sino que lo entiende como un proceso completo que incluye análisis, implementación, aceptación, migración y retiro.

En mi proyecto, el mantenimiento preventivo es clave para evitar fallos en autenticación, dependencias, base de datos y documentación. El mantenimiento correctivo me permite responder de forma clara cuando algo falla, sin improvisar ni cambiar archivos al azar.

Este plan también me ayuda a trabajar con más disciplina: cada cambio debe tener causa, análisis, prueba, aceptación y evidencia. Así Artify no solo queda como una aplicación funcional, sino como un proyecto mantenible y preparado para futuras entregas académicas o mejoras técnicas.

## Referencias

GitHub. (2026a). *Acerca de las solicitudes de incorporación de cambios*. Documentación de GitHub. https://docs.github.com/es/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests

GitHub. (2026b). *Acerca de las actualizaciones de seguridad de Dependabot*. Documentación de GitHub. https://docs.github.com/es/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates

MDN Web Docs. (2026). *Canvas API*. https://developer.mozilla.org/es/docs/Web/API/Canvas_API

Organización Internacional de Normalización. (2022). *ISO/IEC/IEEE 14764:2022 Ingeniería de software - Procesos del ciclo de vida del software - Mantenimiento*. https://www.iso.org/es/contents/data/standard/08/07/80710.html

OWASP Foundation. (2021). *OWASP Top 10:2021*. https://owasp.org/Top10/es/
