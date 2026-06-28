#!/bin/bash

# ==============================================
# ARTIFY POSTGRESQL - CONFIGURACIÓN INICIAL
# ==============================================
# Este script prepara dependencias y plantilla .env.
# La base PostgreSQL se crea y carga manualmente.

echo "Iniciando configuración de Artify SENA PostgreSQL..."
echo ""

# PASO 1: Instalar dependencias del backend
echo "Paso 1: Instalando dependencias de Node.js..."
cd backend
pnpm install

if [ $? -eq 0 ]; then
  echo "Dependencias instaladas correctamente"
else
  echo "Error al instalar dependencias"
  exit 1
fi

echo ""

# PASO 2: Crear archivo .env
echo "Paso 2: Creando archivo .env..."
if [ ! -f .env ]; then
  cp ../.env.example .env
  echo "Archivo .env creado. Edita backend/.env con tus datos locales."
else
  echo "El archivo .env ya existe"
fi

echo ""

# PASO 3: Información sobre la BD
echo "Paso 3: Base de datos PostgreSQL"
echo "IMPORTANTE: Debes crear la base de datos y cargar los scripts manualmente:"
echo "schema.sql reinicializa objetos; úsalo en base nueva o con respaldo previo."
echo ""
echo "Desde esta carpeta backend:"
echo "  createdb artify_db"
echo "  psql -d artify_db -f ../database/postgresql/schema.sql"
echo "  psql -d artify_db -f ../database/postgresql/seed.sql"
echo "  psql -d artify_db -c '\\dt'"
echo "  psql -d artify_db -c '\\dv'"
echo ""

# PASO 4: Instrucciones finales
echo "========================================="
echo "Setup completado"
echo "========================================="
echo ""
echo "Proximos pasos desde esta carpeta backend:"
echo "1. Edita .env con tus datos"
echo "2. Crea y carga la base de datos:"
echo "   Nota: schema.sql elimina y recrea los objetos del proyecto."
echo "   createdb artify_db"
echo "   psql -d artify_db -f ../database/postgresql/schema.sql"
echo "   psql -d artify_db -f ../database/postgresql/seed.sql"
echo "   psql -d artify_db -c '\\dt'"
echo "   psql -d artify_db -c '\\dv'"
echo "3. Inicia el servidor: pnpm start"
echo ""
echo "Listo para desarrollar."
