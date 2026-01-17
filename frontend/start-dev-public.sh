#!/bin/bash
# Script para iniciar o dev server com acesso público
# Uso: ./start-dev-public.sh

cd "$(dirname "$0")"

echo "🚀 Iniciando servidor de desenvolvimento com acesso público..."
echo "📦 Verificando dependências..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

# Configurar variáveis de ambiente para acesso público
export VITE_HMR_HOST="18.229.23.153"
export VITE_API_URL="https://dev.office.internut.com.br/leads/modern/api"

echo ""
echo "🌐 Servidor será acessível em:"
echo "   http://18.229.23.153:5173"
echo "   http://localhost:5173"
echo ""
echo "🔄 Hot reload está ativo!"
echo "⚠️  Certifique-se de que a porta 5173 está aberta no firewall"
echo ""

# Verificar se a porta está aberta
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "5173"; then
        echo "✅ Porta 5173 está configurada no firewall"
    else
        echo "⚠️  Porta 5173 pode não estar aberta. Execute: sudo ufw allow 5173/tcp"
    fi
fi

echo ""
echo "🚀 Iniciando servidor..."
echo ""

# Rodar o dev server
npm run dev

