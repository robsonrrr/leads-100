#!/bin/bash
# Script para rebuild do frontend com base path correto

APP_PATH="/home/ubuntu/environment/Office/Apps/inProduction/leads-agent"
HOST_DOMAIN="dev.office.internut.com.br"
PATH_PREFIX="/leads/modern"

echo "🔨 Rebuilding frontend com base path correto..."

cd ${APP_PATH}/frontend

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist
rm -rf node_modules/.vite

# Configurar variáveis de ambiente
export VITE_API_URL=https://${HOST_DOMAIN}${PATH_PREFIX}/api
export VITE_BASE_PATH=${PATH_PREFIX}/

echo "📦 Instalando dependências..."
npm install

echo "🏗️ Building com base path: ${VITE_BASE_PATH}"
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: Build falhou!"
    exit 1
fi

echo "✅ Build concluído!"
echo ""
echo "📄 Verificando paths no index.html:"
grep -o 'src="[^"]*"' dist/index.html | head -3
grep -o 'href="[^"]*"' dist/index.html | head -3

echo ""
echo "🔄 Atualizando serviço Docker..."
docker service update --force leads-agent-frontend

echo ""
echo "✅ Frontend atualizado com sucesso!"
echo "🌐 Acesse: https://${HOST_DOMAIN}${PATH_PREFIX}"
echo ""
echo "💡 Dica: Se as mudanças não aparecerem, limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"

