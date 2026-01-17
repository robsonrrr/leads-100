#!/bin/bash

# Script para testar a API de pricing

API_URL="http://localhost:3001/api"
USERNAME="Robson Rebelo Reis"
PASSWORD="teste123"

echo "🧪 Testando API de Pricing"
echo "=========================="
echo ""

# 1. Fazer login
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login"
  echo "Resposta: $LOGIN_RESPONSE"
  echo ""
  echo "💡 Dica: Verifique as credenciais ou faça login manualmente"
  exit 1
fi

echo "✅ Login realizado com sucesso"
echo ""

# 2. Testar validação (campos faltando)
echo "2️⃣ Testando validação (campos obrigatórios)..."
VALIDATION_RESPONSE=$(curl -s -X POST "${API_URL}/pricing/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"org_id": 1}')

if echo "$VALIDATION_RESPONSE" | grep -q "Validation error"; then
  echo "✅ Validação funcionando corretamente"
else
  echo "⚠️ Validação pode não estar funcionando"
  echo "Resposta: $VALIDATION_RESPONSE"
fi
echo ""

# 3. Testar cálculo de preço completo
echo "3️⃣ Testando cálculo de preço completo..."
PRICING_RESPONSE=$(curl -s -X POST "${API_URL}/pricing/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "org_id": 1,
    "brand_id": 3755581063,
    "customer_id": 701546,
    "sku_id": 1980517,
    "sku_qty": 1,
    "order_value": 4270,
    "product_brand": "ZOJE",
    "product_model": "C5000-364-02 110V"
  }')

if echo "$PRICING_RESPONSE" | grep -q "success.*true"; then
  echo "✅ API de pricing funcionando!"
  echo ""
  echo "📊 Resposta:"
  echo "$PRICING_RESPONSE" | jq '.' 2>/dev/null || echo "$PRICING_RESPONSE"
else
  echo "❌ Erro na API de pricing"
  echo "Resposta: $PRICING_RESPONSE"
fi

echo ""
echo "✅ Teste concluído!"

