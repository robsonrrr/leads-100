#!/bin/bash
# =============================================================================
# Script para enviar notificação para um usuário específico do Leads Agent
# Uso: ./send-notification.sh <user_id> "Título" "Mensagem" [url]
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

echo -e "${GREEN}📨 Leads Agent - Send Notification${NC}"
echo "=========================================="

# Verificar argumentos
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo -e "${YELLOW}Uso: $0 <user_id> \"Título\" \"Mensagem\" [url]${NC}"
    echo ""
    echo "Exemplos:"
    echo "  $0 107 \"🔔 Alerta\" \"Você tem um novo lead\""
    echo "  $0 107 \"📢 Meta\" \"Você atingiu 80% da meta\" \"/metas-por-cliente\""
    exit 1
fi

USER_ID="$1"
TITLE="$2"
BODY="$3"
URL="${4:-/}"

echo ""
echo -e "${YELLOW}📋 Mensagem a enviar:${NC}"
echo "   Usuário: $USER_ID"
echo "   Título:  $TITLE"
echo "   Corpo:   $BODY"
echo "   URL:     $URL"
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

# Passo 2: Enviar notificação
echo ""
echo -e "${YELLOW}📤 Enviando notificação...${NC}"

SEND_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/notifications/send" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"userId\": $USER_ID,
        \"title\": \"$TITLE\",
        \"body\": \"$BODY\",
        \"url\": \"$URL\",
        \"category\": \"GENERAL\"
    }")

# Verificar resultado
if echo "$SEND_RESPONSE" | grep -q '"sent":true'; then
    echo -e "${GREEN}✅ Notificação enviada com sucesso para usuário $USER_ID!${NC}"
elif echo "$SEND_RESPONSE" | grep -q '"sent":false'; then
    REASON=$(echo "$SEND_RESPONSE" | grep -o '"reason":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}⚠️ Notificação não enviada. Motivo: $REASON${NC}"
else
    echo -e "${RED}❌ Erro:${NC}"
    echo "$SEND_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SEND_RESPONSE"
fi

echo ""
echo "=========================================="
