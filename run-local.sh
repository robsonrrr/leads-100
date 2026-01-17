#!/bin/bash

# Script para rodar o leads-agent localmente sem Docker
# Inicia backend e frontend em terminais separados

APP_PATH="/home/ubuntu/environment/Office/Apps/inProduction/leads-agent"
BACKEND_PATH="${APP_PATH}/backend"
FRONTEND_PATH="${APP_PATH}/frontend"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Leads Agent localmente${NC}"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado${NC}"
    exit 1
fi

# Verificar se o arquivo .env existe no backend
if [ ! -f "${BACKEND_PATH}/.env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado em ${BACKEND_PATH}${NC}"
    echo -e "${YELLOW}   Criando .env com valores padrão...${NC}"
    cat > "${BACKEND_PATH}/.env" << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=vallery.catmgckfixum.sa-east-1.rds.amazonaws.com
DB_USER=robsonrr
DB_PASSWORD=Best94364811082
DB_NAME=mak
DB_PORT=3306

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
DOCKER_ENV=false

# JWT Configuration
JWT_SECRET=leads-agent-secret-key-change-in-production-2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Pricing API Configuration
PRICING_API_URL=https://csuite.internut.com.br/pricing/run
PRICING_API_KEY=eff0bf9efe8238b433f2587153c0c8209c4737e6a56fa90018308500678cafd5
EOF
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"
    pkill -f "nodemon.*index.js" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo -e "${GREEN}✅ Serviços parados${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Função para liberar porta se estiver em uso
free_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠️  Porta $port está em uso, liberando...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 1
        # Verificar novamente
        if lsof -ti:$port >/dev/null 2>&1; then
            echo -e "${RED}❌ Não foi possível liberar a porta $port${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Porta $port liberada${NC}"
        fi
    fi
}

# Liberar portas se estiverem em uso
free_port 3001
free_port 5173

# Instalar dependências do backend se necessário
if [ ! -d "${BACKEND_PATH}/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependências do backend...${NC}"
    cd "${BACKEND_PATH}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências do backend${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
fi

# Instalar dependências do frontend se necessário
if [ ! -d "${FRONTEND_PATH}/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependências do frontend...${NC}"
    cd "${FRONTEND_PATH}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências do frontend${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
fi

# Detectar IP da máquina
# Tentar pegar IP público primeiro, senão usar IP privado
HOST_IP=$(hostname -I | awk '{print $1}')

# Se for IP privado (10.x, 172.x, 192.x), usar IP público conhecido
if [[ "$HOST_IP" =~ ^10\. ]] || [[ "$HOST_IP" =~ ^172\. ]] || [[ "$HOST_IP" =~ ^192\.168\. ]]; then
    HOST_IP="18.229.23.153"
fi

# Se não conseguir detectar, usar o IP padrão do ambiente
if [ -z "$HOST_IP" ] || [ "$HOST_IP" == "127.0.0.1" ]; then
    HOST_IP="18.229.23.153"
fi

# Configurar variáveis de ambiente do frontend
export VITE_API_URL=http://${HOST_IP}:3001/api
export VITE_BASE_PATH=/
export VITE_HMR_HOST=${HOST_IP}

echo ""
echo -e "${GREEN}✅ Tudo pronto!${NC}"
echo ""
echo -e "${BLUE}📝 URLs:${NC}"
echo -e "   Backend:  ${GREEN}http://${HOST_IP}:3001${NC} (ou http://localhost:3001)"
echo -e "   Frontend: ${GREEN}http://${HOST_IP}:5173${NC} (ou http://localhost:5173)"
echo -e "   API:      ${GREEN}http://${HOST_IP}:3001/api${NC}"
echo ""
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar todos os serviços${NC}"
echo ""

# Iniciar backend em background
echo -e "${BLUE}🔧 Iniciando backend...${NC}"
cd "${BACKEND_PATH}"
npx nodemon src/index.js > /tmp/leads-agent-backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Verificar se o backend iniciou
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Erro ao iniciar backend${NC}"
    echo -e "${YELLOW}   Verifique os logs: tail -f /tmp/leads-agent-backend.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"

# Aguardar backend estar pronto
echo -e "${BLUE}⏳ Aguardando backend estar pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend pronto!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend não respondeu após 30 segundos${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Iniciar frontend
echo -e "${BLUE}🎨 Iniciando frontend...${NC}"
cd "${FRONTEND_PATH}"
npm run dev > /tmp/leads-agent-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Verificar se o frontend iniciou
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Erro ao iniciar frontend${NC}"
    echo -e "${YELLOW}   Verifique os logs: tail -f /tmp/leads-agent-frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
echo ""

# Mostrar logs
echo -e "${BLUE}📋 Logs:${NC}"
echo -e "   Backend:  ${YELLOW}tail -f /tmp/leads-agent-backend.log${NC}"
echo -e "   Frontend: ${YELLOW}tail -f /tmp/leads-agent-frontend.log${NC}"
echo ""

# Aguardar até receber sinal de parada
echo -e "${GREEN}✅ Aplicação rodando!${NC}"
echo -e "${YELLOW}   Pressione Ctrl+C para parar${NC}"
echo ""

# Manter script rodando e monitorar processos
while true; do
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend parou inesperadamente${NC}"
        cleanup
    fi
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Frontend parou inesperadamente${NC}"
        cleanup
    fi
    sleep 2
done

