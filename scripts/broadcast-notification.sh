#!/bin/bash
# =============================================================================
# Script para enviar notificação broadcast para todos os usuários do Leads Agent
# Uso: ./broadcast-notification.sh "Título" "Mensagem" [url]
# =============================================================================

set -e

API_BASE_URL="https://leads.vallery.com.br"
API_KEY="rolemak-leads-agent-2026"

# Credenciais (podem ser passadas via variáveis de ambiente)
USERNAME="${LEADS_USERNAME:-robsonrr@rolemak.com.br}"
PASSWORD="${LEADS_PASSWORD:-Best94364811082Job}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📢 Leads Agent - Broadcast Notification${NC}"
echo "=========================================="

# Verificar argumentos
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Uso: $0 \"Título\" \"Mensagem\" [url]${NC}"
    echo ""
    echo "Exemplos:"
    echo "  $0 \"🔔 Atualização\" \"Nova versão disponível\""
    # echo "  $0 \"📢 Manutenção\" \"Sistema em manutenção às 22h\" \"/\""
    exit 1
fi

TITLE="$1"
BODY="$2"
URL="${3:-/}"

echo ""
echo -e "${YELLOW}📋 Mensagem a enviar:${NC}"
echo "   Título: $TITLE"
echo "   Corpo:  $BODY"
echo "   URL:    $URL"
echo ""

# Passo 1: Fazer login inicial
echo -e "${YELLOW}🔐 Fazendo login...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$USERNAME\",
        \"password\": \"$PASSWORD\"
    }")

# Verificar se precisa de 2FA
if echo "$LOGIN_RESPONSE" | grep -q "requires2FA"; then
    echo -e "${YELLOW}🔑 2FA necessário. Digite o código do authenticator:${NC}"
    read -r TWO_FA_CODE
    
    # Login com 2FA
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$USERNAME\",
            \"password\": \"$PASSWORD\",
            \"twoFactorToken\": \"$TWO_FA_CODE\"
        }")
fi

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Erro ao obter token. Resposta:${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login bem-sucedido!${NC}"

# Passo 2: Enviar broadcast
echo ""
echo -e "${YELLOW}📤 Enviando broadcast...${NC}"

BROADCAST_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/notifications/broadcast" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"title\": \"$TITLE\",
        \"body\": \"$BODY\",
        \"url\": \"$URL\",
        \"category\": \"GENERAL\"
    }")

# Verificar resultado
if echo "$BROADCAST_RESPONSE" | grep -q '"success":true'; then
    TOTAL_USERS=$(echo "$BROADCAST_RESPONSE" | grep -o '"totalUsers":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Broadcast enviado com sucesso!${NC}"
    echo -e "   Usuários notificados: ${GREEN}$TOTAL_USERS${NC}"
else
    echo -e "${RED}❌ Erro ao enviar broadcast:${NC}"
    echo "$BROADCAST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BROADCAST_RESPONSE"
fi

echo ""
echo "=========================================="
