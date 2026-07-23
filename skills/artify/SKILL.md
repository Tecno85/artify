---
name: artify
description: "Mantener y mejorar Artify en código, interfaz, editor de imágenes, backend, API, autenticación, administración, PostgreSQL, pruebas, documentación, despliegue y evidencias académicas. Usar siempre que Codex analice, modifique, pruebe, documente o prepare entregas de este repositorio, incluso ante solicitudes generales de revisión o pulido."
---

# Artify

## Preparar El Trabajo

Resolver todas las rutas desde la raíz del repositorio Artify, no desde la copia instalada del skill. Confirmar la raíz por la presencia conjunta de `CONTEXT.md`, `README.md`, `frontend/` y `backend/`; pedir la ubicación antes de modificar archivos si no está disponible.

Leer siempre `CONTEXT.md` para conocer estructura, decisiones vigentes y estado real. Leer `README.md` para instalación, uso o navegación documental, y `docs/tecnica/coding-standards.md` para estilo o convenciones. No duplicar en el skill endpoints, cifras de pruebas, estructura completa ni datos volátiles que deban consultarse en el repositorio.

Antes de modificar:

1. Revisar `git status` y, en archivos coincidentes, el diff existente.
2. Distinguir los cambios preexistentes del usuario de los cambios propios de la tarea.
3. Preservar los cambios ajenos: no restaurarlos, sobrescribirlos, reformatearlos ni incorporarlos automáticamente al alcance.
4. Realizar ediciones mínimas compatibles; consultar si no es posible separar con seguridad cambios coincidentes.

## Clasificar Y Enrutar

Identificar todos los dominios afectados antes de actuar y leer completas únicamente las referencias aplicables:

- Backend, API, controladores, autenticación, autorización, administración, analytics o secretos: [references/backend-seguridad.md](references/backend-seguridad.md).
- HTML, CSS, JavaScript del navegador, autenticación frontend, panel administrativo, editor Canvas o accesibilidad: [references/frontend-editor-accesibilidad.md](references/frontend-editor-accesibilidad.md).
- PostgreSQL, esquema, consultas, datos semilla, migraciones, respaldo o `backend/config/db.js`: [references/base-datos-migraciones.md](references/base-datos-migraciones.md).
- Documentación funcional o técnica, manuales, capturas, diagramas y evidencias académicas: [references/documentacion-evidencias.md](references/documentacion-evidencias.md).
- Pruebas, revisión final, entrega, estado de Git o commits sugeridos: [references/validacion-cierre.md](references/validacion-cierre.md).

Leer varias referencias cuando la tarea sea transversal. Si durante el trabajo aparece un dominio no detectado inicialmente, detener la modificación, leer su referencia y revisar el impacto antes de continuar.

## Resolver Ambigüedad

Ante una solicitud amplia, breve o incompleta:

1. Inspeccionar primero los archivos y dependencias relacionados sin modificar.
2. Inferir los dominios afectados a partir del comportamiento, las rutas y los contratos existentes.
3. Leer todas las referencias razonablemente aplicables.
4. Elegir la interpretación más conservadora que cumpla la intención sin ampliar materialmente el alcance.
5. Consultar al usuario solo si las alternativas producen comportamientos sustancialmente diferentes, requieren nueva autoridad o implican una decisión de producto no recuperable del repositorio.

## Reglas Transversales

- Mantener HTML, CSS y JavaScript Vanilla en frontend; Node.js con Express en backend; PostgreSQL mediante `pg`; y `pnpm` en `backend/`.
- No introducir frameworks frontend, TypeScript, bundlers, ORMs ni cambios grandes de arquitectura sin aprobación explícita.
- Preservar la separación entre `frontend/`, `backend/`, `database/`, `docs/`, `scripts/` y `skills/`.
- Usar nombres y textos en español cuando el archivo existente esté en español.
- Hacer cambios pequeños, trazables y enfocados; evitar reescrituras amplias.
- Validar siempre en backend aunque el frontend también valide, y renderizar de forma segura los datos externos.
- Mantener implementado y futuro separados; no presentar funciones planeadas como existentes.
- Actualizar `CONTEXT.md` cuando cambie el estado real. Actualizar el índice documental de `README.md` solo al agregar, eliminar o reubicar documentos relevantes.
- Contrastar código, pruebas y documentación cuando cambie un comportamiento; modificar únicamente las fuentes cuya información quede desactualizada.
- No ejecutar `git commit` ni `git push` salvo solicitud explícita.

## Comprobar El Impacto

Antes de finalizar, reclasificar el cambio y comprobar como mínimo:

- Contrato API: backend, consumidores frontend y pruebas.
- Autenticación o roles: backend, almacenamiento de sesión, redirecciones y pruebas.
- Esquema PostgreSQL: migración, esquema inicial, datos semilla, controladores, pruebas y documentación de datos.
- Interfaz visible: accesibilidad, pruebas frontend, manuales y capturas que representen el estado anterior.
- Editor: Canvas, historial, persistencia, operaciones, descarga y documentación relacionada.

Aplicar la validación y el cierre descritos en `references/validacion-cierre.md` cuando la tarea deje cambios o requiera una evaluación verificable.

## Mantener El Skill

Tratar `skills/artify/` como fuente de verdad versionada. Después de modificarla, ejecutar el validador oficial, comprobar `agents/openai.yaml`, sincronizar la copia instalada en `${CODEX_HOME:-$HOME/.codex}/skills/artify/` cuando exista y verificar que ambas carpetas sean idénticas. Solicitar autorización si la copia instalada está fuera de las rutas editables.
