#!/bin/bash
# Script para watch mode usando Vite build --watch
# Mais eficiente para ambiente de teste remoto

APP_PATH="/home/ubuntu/environment/Office/Apps/inProduction/leads-agent"
HOST_DOMAIN="dev.office.internut.com.br"
PATH_PREFIX="/leads/modern"

echo "👀 Iniciando watch mode com Vite..."
echo "📁 Monitorando: ${APP_PATH}/frontend/src"
echo "🔄 Rebuild automático ativado"
echo ""
echo "💡 Pressione Ctrl+C para parar"
echo ""

cd ${APP_PATH}/frontend

# Configurar variáveis de ambiente
export VITE_API_URL=https://${HOST_DOMAIN}${PATH_PREFIX}/api
export VITE_BASE_PATH=${PATH_PREFIX}/
export NODE_ENV=production

# Função para atualizar serviço Docker
update_service() {
    echo "🔄 Atualizando serviço Docker..."
    docker service update --force leads-agent-frontend > /dev/null 2>&1
    echo "✅ Serviço atualizado! ($(date +%H:%M:%S))"
}

# Primeiro build
echo "🏗️ Fazendo build inicial..."
npm run build

if [ $? -eq 0 ] && [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build inicial concluído!"
    update_service
    echo ""
    echo "👀 Iniciando watch mode..."
    echo ""
    
    # Usar Vite build --watch (mais eficiente)
    # O Vite vai monitorar mudanças e fazer rebuild automaticamente
    # Usar um loop que monitora mudanças no dist após cada rebuild
    LAST_BUILD_TIME=$(stat -c %Y dist/index.html 2>/dev/null || stat -f %m dist/index.html 2>/dev/null || echo 0)
    
    # Executar build:watch em background e monitorar mudanças
    npm run build:watch 2>&1 | while IFS= read -r line; do
        echo "$line"
        # Quando o build terminar, dist/index.html será atualizado
        if [ -f "dist/index.html" ]; then
            CURRENT_BUILD_TIME=$(stat -c %Y dist/index.html 2>/dev/null || stat -f %m dist/index.html 2>/dev/null || echo 0)
            if [ "$CURRENT_BUILD_TIME" != "$LAST_BUILD_TIME" ]; then
                LAST_BUILD_TIME=$CURRENT_BUILD_TIME
                sleep 1  # Aguardar build completar
                update_service
            fi
        fi
    done
else
    echo "❌ Erro no build inicial!"
    exit 1
fi

