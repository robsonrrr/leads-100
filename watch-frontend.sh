#!/bin/bash
# Script para watch mode - rebuild automático quando arquivos mudam
# Para ambiente de teste remoto

APP_PATH="/home/ubuntu/environment/Office/Apps/inProduction/leads-agent"
HOST_DOMAIN="dev.office.internut.com.br"
PATH_PREFIX="/leads/modern"

echo "👀 Iniciando watch mode para frontend..."
echo "📁 Monitorando: ${APP_PATH}/frontend/src"
echo "🔄 Rebuild automático ativado"
echo ""
echo "💡 Pressione Ctrl+C para parar"
echo ""

cd ${APP_PATH}/frontend

# Configurar variáveis de ambiente
export VITE_API_URL=https://${HOST_DOMAIN}${PATH_PREFIX}/api
export VITE_BASE_PATH=${PATH_PREFIX}/

# Função para fazer rebuild e atualizar serviço
rebuild_and_update() {
    echo ""
    echo "🔨 Detectada mudança - fazendo rebuild..."
    
    # Build
    npm run build
    
    if [ $? -eq 0 ] && [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo "✅ Build concluído!"
        echo "🔄 Atualizando serviço Docker..."
        docker service update --force leads-agent-frontend > /dev/null 2>&1
        echo "✅ Serviço atualizado! ($(date +%H:%M:%S))"
    else
        echo "❌ Erro no build!"
    fi
}

# Primeiro build
echo "🏗️ Fazendo build inicial..."
rebuild_and_update

# Monitorar mudanças nos arquivos fonte
echo ""
echo "👀 Monitorando mudanças..."

# Usar inotifywait se disponível (Linux)
if command -v inotifywait &> /dev/null; then
    while true; do
        inotifywait -r -e modify,create,delete,move \
            --exclude 'node_modules|dist|\.git' \
            ${APP_PATH}/frontend/src 2>/dev/null
        
        if [ $? -eq 0 ]; then
            rebuild_and_update
        fi
    done
# Fallback: usar polling com find (menos eficiente mas funciona em qualquer sistema)
else
    echo "⚠️  inotifywait não encontrado, usando polling (verifica a cada 5 segundos)..."
    LAST_CHECK=$(find ${APP_PATH}/frontend/src -type f -exec stat -c %Y {} \; | sort -n | tail -1)
    
    while true; do
        sleep 5
        CURRENT_CHECK=$(find ${APP_PATH}/frontend/src -type f -exec stat -c %Y {} \; | sort -n | tail -1)
        
        if [ "$CURRENT_CHECK" != "$LAST_CHECK" ]; then
            LAST_CHECK=$CURRENT_CHECK
            rebuild_and_update
        fi
    done
fi

