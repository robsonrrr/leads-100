#!/bin/bash
# Script para rodar o dev server do frontend diretamente (sem Docker)
# Uso: ./dev-server.sh

cd "$(dirname "$0")"

echo "🚀 Iniciando servidor de desenvolvimento do frontend..."
echo "📦 Verificando dependências..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

# Verificar se o backend está rodando
echo "🔍 Verificando se o backend está acessível..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend detectado em http://localhost:3001"
    export VITE_API_URL="http://localhost:3001/api"
elif curl -s https://dev.office.internut.com.br/leads/modern/api/health > /dev/null 2>&1; then
    echo "✅ Backend detectado em https://dev.office.internut.com.br/leads/modern/api"
    export VITE_API_URL="https://dev.office.internut.com.br/leads/modern/api"
else
    echo "⚠️  Backend não detectado. Usando padrão: http://localhost:3001/api"
    export VITE_API_URL="http://localhost:3001/api"
fi

echo ""
echo "🌐 Servidor de desenvolvimento será iniciado em:"
echo "   http://localhost:5173"
echo ""
echo "💡 Para acessar de outra máquina, use:"
echo "   http://$(hostname -I | awk '{print $1}'):5173"
echo ""
echo "🔄 Hot reload está ativo - alterações serão refletidas automaticamente!"
echo ""

# Rodar o dev server
npm run dev

