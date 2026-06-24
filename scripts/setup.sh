#!/bin/bash

# ========================================
# ARTIFY - SCRIPT DE CONFIGURACIÓN INICIAL
# ========================================
# Este script configura el proyecto automáticamente
# para nuevos desarrolladores

echo "🚀 Iniciando configuración de Artify..."
echo ""

# PASO 1: Instalar dependencias del backend
echo "📦 Paso 1: Instalando dependencias de Node.js..."
cd backend
pnpm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencias instaladas correctamente"
else
  echo "❌ Error al instalar dependencias"
  exit 1
fi

echo ""

# PASO 2: Crear archivo .env
echo "📝 Paso 2: Creando archivo .env..."
if [ ! -f .env ]; then
  cp ../.env.example .env
  echo "✅ Archivo .env creado (edítalo con tus datos)"
else
  echo "ℹ️ El archivo .env ya existe"
fi

echo ""

# PASO 3: Información sobre la BD
echo "📊 Paso 3: Base de datos"
echo "⚠️ IMPORTANTE: Debes crear la BD manualmente:"
echo ""
echo "En terminal MySQL:"
echo "  mysql -u root -p < ../database/artify_db.sql"
echo ""
echo "O si tienes MySQL en PATH:"
echo "  mysql -u root -p artify_db < ../database/artify_db.sql"
echo ""

# PASO 4: Instrucciones finales
echo "========================================="
echo "✅ Setup completado"
echo "========================================="
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita backend/.env con tus datos"
echo "2. Importa la BD: mysql -u root -p < database/artify_db.sql"
echo "3. Inicia el servidor: pnpm start"
echo ""
echo "¡Listo para desarrollar! 🎉"
