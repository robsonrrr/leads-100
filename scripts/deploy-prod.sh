#!/bin/bash
# ============================================
# Deploy Leads-Agent para Produção
# ============================================
# Constrói as imagens, exporta e envia para a máquina de produção

set -e

# Configuração
PROD_IP="56.125.213.37"
KEY_PATH="/home/ec2-user/enviroment/apps/c-suite-ecosystem/deployment/mak.pem"
LEADS_PATH="/home/ec2-user/enviroment/apps/c-suite-ecosystem/leads-agent"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ============================================
echo ""
log "=========================================="
log "🚀 Deploy Leads-Agent para PRODUÇÃO"
log "=========================================="
echo ""
log "Servidor: $PROD_IP"
log "Key: $KEY_PATH"
echo ""

# Verificar se a chave existe
if [ ! -f "$KEY_PATH" ]; then
    error "Chave SSH não encontrada: $KEY_PATH"
fi

# 1. Construir Backend
log "📦 [1/5] Construindo Backend..."
cd "$LEADS_PATH"
docker build --no-cache -t leads-backend:latest -f docker/Dockerfile.backend.prod .
success "Backend construído!"

# 2. Construir Frontend
log "📦 [2/5] Construindo Frontend..."
docker build --no-cache -t leads-frontend:latest -f docker/Dockerfile.frontend.prod .
success "Frontend construído!"

# 3. Exportar imagens
log "💾 [3/5] Exportando imagens..."
mkdir -p /tmp/docker-images
docker save leads-backend:latest | gzip > /tmp/docker-images/leads-backend-deploy.tar.gz
docker save leads-frontend:latest | gzip > /tmp/docker-images/leads-frontend-deploy.tar.gz
success "Imagens exportadas!"
ls -lh /tmp/docker-images/leads-*-deploy.tar.gz

# 4. Transferir para produção
log "🚀 [4/5] Transferindo para produção..."
scp -i "$KEY_PATH" \
    /tmp/docker-images/leads-backend-deploy.tar.gz \
    /tmp/docker-images/leads-frontend-deploy.tar.gz \
    ec2-user@$PROD_IP:/tmp/
success "Imagens transferidas!"

# 5. Carregar e atualizar serviços
log "🔄 [5/5] Atualizando serviços na produção..."
ssh -i "$KEY_PATH" ec2-user@$PROD_IP << 'REMOTE_DEPLOY'
#!/bin/bash
set -e

echo "[deploy] Carregando leads-backend..."
gunzip -c /tmp/leads-backend-deploy.tar.gz | docker load

echo "[deploy] Carregando leads-frontend..."
gunzip -c /tmp/leads-frontend-deploy.tar.gz | docker load

echo "[deploy] Atualizando serviço leads-backend..."
docker service update --force vallery_leads-backend

echo "[deploy] Atualizando serviço leads-frontend..."
docker service update --force vallery_leads-frontend

echo "[deploy] Limpando arquivos temporários..."
rm -f /tmp/leads-*-deploy.tar.gz

echo "[deploy] Status dos serviços:"
docker service ls | grep vallery_leads
REMOTE_DEPLOY

success "Deploy concluído!"

# Limpeza local
log "🧹 Limpando arquivos temporários locais..."
rm -f /tmp/docker-images/leads-*-deploy.tar.gz

# ============================================
echo ""
success "=========================================="
success "🎉 Deploy Leads-Agent FINALIZADO!"
success "=========================================="
echo ""
echo "📋 URLs de produção:"
echo "   Frontend: https://leads.vallery.com.br"
echo "   API:      https://leads.vallery.com.br/api/health"
echo ""
