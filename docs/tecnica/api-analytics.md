# API REST Analytics - Artify

Este módulo expone endpoints que ofrecen información agregada sobre el comportamiento de los usuarios. En esta variante los datos se consultan desde PostgreSQL mediante el backend Node.js + Express.

**Última actualización:** Julio 2026

---

## ¿Qué es esta API?

Esta API permite que un sistema externo obtenga datos agregados sobre cómo los usuarios de Artify editan imágenes. Los endpoints son públicos en la versión actual y devuelven conteos y porcentajes como valores numéricos.

**Escenario hipotético de uso:**

- Un e-commerce podría consultar qué filtros concentran una parte importante del uso.
- Con esos datos podría orientar recomendaciones internas de edición.
- Artify no incluye actualmente una integración con un e-commerce ni permite afirmar un impacto sobre ventas.

---

## Endpoints de Analytics

Los bloques JSON de esta sección son ejemplos ilustrativos del contrato de cada endpoint. Los valores, cantidades y marcas de tiempo no constituyen evidencia de una ejecución real y cambian según los datos almacenados en PostgreSQL.

### 1. Filtros Más Usados

**¿Qué hace?**

Devuelve exclusivamente los filtros visuales más usados por los usuarios de Artify. No mezcla recortes, rotaciones, conversiones ni descargas.

**URL:** `GET /api/v1/analytics/filtros-populares`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/filtros-populares

**Ejemplo ilustrativo de respuesta:**
```json
{
  "ok": true,
  "mensaje": "Top filtros utilizados",
  "data": {
    "filtros": [
      {
        "filtro": "Sepia",
        "usos": 5,
        "porcentaje": 50.00
      },
      {
        "filtro": "Blanco y Negro",
        "usos": 3,
        "porcentaje": 30.00
      },
      {
        "filtro": "Contraste",
        "usos": 2,
        "porcentaje": 20.00
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalFiltros": 3
  }
}
```

**¿Qué significan los campos?**

- `filtro` representa el nombre del filtro visual registrado en los parámetros de la operación.
- `usos` indica cuántas veces aparece esa operación.
- `porcentaje` indica qué proporción representa frente al total consultado.

**¿Cómo podría usarlo un sistema externo?**

Podría identificar qué operaciones son más frecuentes y orientar recomendaciones de edición.

---


### 2. Horarios de Edición

**¿Qué hace?**

Devuelve a qué horas del día se registran más operaciones de edición completadas.

**URL:** `GET /api/v1/analytics/horarios-edicion`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/horarios-edicion

**Ejemplo ilustrativo de respuesta:**
```json
{
  "ok": true,
  "mensaje": "Horarios pico de edición",
  "data": {
    "horarios": [
      {
        "hora": 9,
        "cantidad_ediciones": 7,
        "porcentaje": 58.33
      },
      {
        "hora": 10,
        "cantidad_ediciones": 4,
        "porcentaje": 33.33
      },
      {
        "hora": 15,
        "cantidad_ediciones": 1,
        "porcentaje": 8.33
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalHoras": 3
  }
}
```

**¿Qué significan los campos?**

- `hora` representa la hora del día en formato de 24 horas.
- `cantidad_ediciones` indica cuántas operaciones se registraron en esa hora.
- `porcentaje` indica qué proporción del total ocurrió en esa hora.

**¿Cómo podría usarlo un sistema externo?**

Podría identificar horarios de mayor actividad para planear soporte o acciones internas.

---

### 3. Formatos Preferidos

**¿Qué hace?**

Devuelve qué formato final se registra con mayor frecuencia al descargar una imagen editada.

**URL:** `GET /api/v1/analytics/formatos-preferidos`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/formatos-preferidos

**Ejemplo ilustrativo de respuesta:**
```json
{
  "ok": true,
  "mensaje": "Formatos más descargados",
  "data": {
    "formatos": [
      {
        "formato": "jpeg",
        "descargas": 8,
        "porcentaje": 100.00
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalFormatos": 1
  }
}
```

**¿Qué significan los campos?**

- `formato` representa la extensión del archivo.
- `descargas` indica cuántas descargas completadas fueron registradas en ese formato.
- `porcentaje` indica qué proporción del total corresponde a ese formato.

**¿Cómo podría usarlo un sistema externo?**

Podría usar esta información para definir recomendaciones sobre el formato de salida.

---

### 4. Tasa de Conversión

**¿Qué hace?**

Calcula qué porcentaje de las sesiones finalizadas tiene cambios guardados. El denominador incluye únicamente los registros donde `ses_estado_sesion = 'finalizada'`; no representa el número de usuarios ni el total de sesiones abiertas, pausadas o canceladas.

Para este indicador, una sesión se considera exitosa cuando está finalizada y `ses_cambios_guardados = true`. La descarga de la imagen marca los cambios como guardados y el cierre de la sesión establece su estado como `finalizada`.

**URL:** `GET /api/v1/analytics/tasa-conversion`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/tasa-conversion

**Ejemplo ilustrativo de respuesta:**
```json
{
  "ok": true,
  "mensaje": "Tasa de conversión de sesiones",
  "data": {
    "conversionData": {
      "tasa_conversion_porcentaje": 40,
      "total_sesiones": 5,
      "sesiones_exitosas": 2
    }
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z"
  }
}
```

**¿Qué significan los campos?**

- `tasa_conversion_porcentaje` indica el porcentaje de sesiones finalizadas que tienen `ses_cambios_guardados = true`.
- `total_sesiones` indica el total de sesiones con `ses_estado_sesion = 'finalizada'`.
- `sesiones_exitosas` indica cuántas de esas sesiones finalizadas tienen cambios guardados.

**¿Cómo podría usarlo un sistema externo?**

Podría usar una tasa baja como señal inicial para investigar posibles problemas de experiencia o abandono en el flujo de edición.

---

## Resumen: ¿Quién podría consumir estos datos?

Un sistema externo podría llamar a estos endpoints para entender:

- Qué ediciones usan los usuarios
- Cuándo editan
- Qué formatos prefieren
- Si realmente completan la tarea

**Resultado potencial:** un consumidor podría orientar recomendaciones o decisiones con base en los datos agregados devueltos por Artify. Los endpoints existen y son públicos en la versión actual, pero el repositorio no incluye un consumidor externo ni valida resultados comerciales.

---

**Creado por:** Iván Darío Madrid Daza
**Programa:** Análisis y Desarrollo de Software - SENA
**Fecha:** Julio 2026
