#!/bin/bash
# Script para testar todos os endpoints GET da API
# Uso: ./test-endpoints.sh <token>

TOKEN="$1"
BASE_URL="http://localhost:3002/api"

if [ -z "$TOKEN" ]; then
    echo "❌ Uso: ./test-endpoints.sh <token>"
    exit 1
fi

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0
TOTAL=0

test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    
    TOTAL=$((TOTAL + 1))
    
    response=$(curl -s -o /tmp/response.json -w "%{http_code}" \
        -X "$method" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint")
    
    if [ "$response" -ge 200 ] && [ "$response" -lt 400 ]; then
        echo -e "${GREEN}✅ [$response]${NC} $method $endpoint - $description"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ [$response]${NC} $method $endpoint - $description"
        # Mostrar erro
        head -c 200 /tmp/response.json 2>/dev/null
        echo ""
        FAILED=$((FAILED + 1))
    fi
}

echo "======================================"
echo "🧪 Testando endpoints da API"
echo "======================================"
echo ""

# Auth
echo -e "${YELLOW}📁 AUTH${NC}"
test_endpoint GET "/auth/me" "Dados do usuário atual"
echo ""

# Leads
echo -e "${YELLOW}📁 LEADS${NC}"
test_endpoint GET "/leads?page=1&limit=5" "Listar leads"
echo ""

# Customers
echo -e "${YELLOW}📁 CUSTOMERS${NC}"
test_endpoint GET "/customers?page=1&limit=5" "Listar clientes"
echo ""

# Products
echo -e "${YELLOW}📁 PRODUCTS${NC}"
test_endpoint GET "/products?page=1&limit=5" "Listar produtos"
echo ""

# Analytics V2
echo -e "${YELLOW}📁 ANALYTICS V2${NC}"
test_endpoint GET "/v2/analytics/summary" "Resumo executivo"
test_endpoint GET "/v2/analytics/penetration" "Métricas de penetração"
test_endpoint GET "/v2/analytics/penetration/history" "Histórico penetração"
test_endpoint GET "/v2/analytics/pipeline" "Métricas de pipeline"
test_endpoint GET "/v2/analytics/pipeline/weekly" "Pipeline semanal"
test_endpoint GET "/v2/analytics/pipeline/ranking" "Ranking pipeline"
test_endpoint GET "/v2/analytics/pipeline/alerts" "Alertas pipeline"
test_endpoint GET "/v2/analytics/inventory" "Visão estoque"
test_endpoint GET "/v2/analytics/inventory/low-turn" "Baixo giro"
test_endpoint GET "/v2/analytics/inventory/stockout-alerts" "Alertas ruptura"
test_endpoint GET "/v2/analytics/financial" "Métricas financeiras"
test_endpoint GET "/v2/analytics/goals/seller/1" "Metas vendedor 1"
test_endpoint GET "/v2/analytics/goals/ranking" "Ranking metas"
test_endpoint GET "/v2/analytics/replenishment" "Sugestões reposição"
echo ""

# Admin
echo -e "${YELLOW}📁 ADMIN${NC}"
test_endpoint GET "/admin/users?page=1&limit=5" "Listar usuários"
test_endpoint GET "/admin/users/1" "Detalhes usuário 1"
test_endpoint GET "/admin/stats" "Estatísticas admin"
test_endpoint GET "/admin/departments" "Listar departamentos"
test_endpoint GET "/admin/seller-phones" "Listar seller-phones"
test_endpoint GET "/admin/chatbot/config" "Config chatbot"
test_endpoint GET "/admin/logs?limit=10" "Logs de auditoria"
test_endpoint GET "/admin/logs/actions" "Tipos de ações"
test_endpoint GET "/admin/logs/stats" "Stats de logs"
echo ""

# Notifications
echo -e "${YELLOW}📁 NOTIFICATIONS${NC}"
test_endpoint GET "/notifications/list" "Listar notificações"
echo ""

# WhatsApp/Superbot
echo -e "${YELLOW}📁 WHATSAPP${NC}"
test_endpoint GET "/superbot/customers?page=1&limit=5" "Clientes Superbot"
echo ""

echo "======================================"
echo -e "📊 Resultado: ${GREEN}$PASSED passaram${NC}, ${RED}$FAILED falharam${NC} de $TOTAL"
echo "======================================"
