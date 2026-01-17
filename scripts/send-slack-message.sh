#!/bin/bash
# =============================================================================
# Script para enviar mensagem para Slack - Q3.1
# Uso: ./send-slack-message.sh "Mensagem" [canal] [emoji]
# =============================================================================

set -e

# Webhook URL do Slack (pode ser passado via variável de ambiente)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}💬 Leads Agent - Slack Message Sender${NC}"
echo "=========================================="

# Tentar carregar .env se existir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ] && [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo -e "${YELLOW}📁 Carregando configuração de $ENV_FILE${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Verificar se temos o webhook
if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo -e "${RED}❌ SLACK_WEBHOOK_URL não configurada!${NC}"
    echo ""
    echo "Configure via:"
    echo "  1. Variável de ambiente: export SLACK_WEBHOOK_URL='https://hooks.slack.com/...'"
    echo "  2. Arquivo .env na raiz do projeto"
    exit 1
fi

# Verificar argumentos
if [ -z "$1" ]; then
    echo -e "${YELLOW}Uso: $0 \"Mensagem\" [canal] [emoji]${NC}"
    echo ""
    echo "Exemplos:"
    echo "  $0 \"Deploy concluído com sucesso!\""
    echo "  $0 \"Sistema em manutenção\" \"#operacoes\""
    echo "  $0 \"Alerta de performance\" \"#alerts\" \":warning:\""
    echo ""
    echo "Opções predefinidas:"
    echo "  --test       Envia mensagem de teste"
    echo "  --deploy     Notifica deploy concluído"
    echo "  --manutencao Notifica manutenção programada"
    echo "  --alerta     Envia alerta genérico"
    exit 1
fi

# Opções predefinidas
case "$1" in
    --test)
        MESSAGE="🔔 *Teste de conexão Slack*\nMensagem enviada em: $(date '+%d/%m/%Y %H:%M:%S')\nServidor: $(hostname)"
        CHANNEL="${2:-#alerts-performance}"
        EMOJI=":robot_face:"
        ;;
    --deploy)
        MESSAGE="🚀 *Deploy Concluído*\n✅ Leads Agent atualizado com sucesso!\n📅 $(date '+%d/%m/%Y %H:%M:%S')"
        CHANNEL="${2:-#deploys}"
        EMOJI=":rocket:"
        ;;
    --manutencao)
        MESSAGE="🔧 *Manutenção Programada*\n⚠️ Sistema entrará em manutenção em breve.\n📅 $(date '+%d/%m/%Y %H:%M:%S')"
        CHANNEL="${2:-#operacoes}"
        EMOJI=":wrench:"
        ;;
    --alerta)
        MESSAGE="⚠️ *Alerta*\n${2:-Verifique o sistema}\n📅 $(date '+%d/%m/%Y %H:%M:%S')"
        CHANNEL="${3:-#alerts-critical}"
        EMOJI=":warning:"
        ;;
    *)
        MESSAGE="$1"
        CHANNEL="${2:-#alerts-performance}"
        EMOJI="${3:-:robot_face:}"
        ;;
esac

echo ""
echo -e "${YELLOW}📋 Mensagem a enviar:${NC}"
echo -e "   Texto:  $MESSAGE"
echo -e "   Canal:  $CHANNEL"
echo -e "   Emoji:  $EMOJI"
echo ""

# Preparar payload JSON
PAYLOAD=$(cat <<EOF
{
    "channel": "$CHANNEL",
    "username": "Leads Agent Bot",
    "icon_emoji": "$EMOJI",
    "text": "$MESSAGE"
}
EOF
)

# Enviar para Slack
echo -e "${YELLOW}📤 Enviando para Slack...${NC}"

RESPONSE=$(curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Verificar resultado
if [ "$RESPONSE" = "ok" ]; then
    echo -e "${GREEN}✅ Mensagem enviada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao enviar mensagem:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "=========================================="
