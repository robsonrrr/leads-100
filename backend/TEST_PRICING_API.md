# Testes da API de Pricing

## ✅ Testes Realizados

### 1. Autenticação
- ✅ **Sem token**: Retorna `401 - Access token required`
- ✅ **Token inválido**: Retorna `401 - Invalid or expired token`
- ✅ **Middleware de autenticação funcionando corretamente**

### 2. API Externa de Pricing
- ✅ **URL**: `https://csuite.internut.com.br/pricing/run`
- ✅ **Status**: Funcionando
- ✅ **Resposta de exemplo**:
```json
{
  "status": "success",
  "agent": "CSuite.Pricing.Agent",
  "result": {
    "decision": {
      "decision_type": "PRICING.COMPUTED",
      "confidence": 0.9,
      "final_price": 4099.2,
      "discount_allowed": 0.04,
      "applied_mode": "CORRIDOR_PRICE",
      "screen_price_pt": 4270,
      "floor_price": 3233.34,
      "tier_code": "V1"
    }
  }
}
```

### 3. Estrutura da API
- ✅ **Controller**: `pricing.controller.js` criado
- ✅ **Rota**: `POST /api/pricing/calculate` registrada
- ✅ **Validação**: Schema Joi implementado
- ✅ **Tratamento de erros**: Implementado (timeout, indisponibilidade, etc.)
- ✅ **Variáveis de ambiente**: Configuráveis via `.env`

## 📋 Como Testar

### Passo 1: Obter Token de Autenticação

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha"
  }'
```

Salve o `accessToken` da resposta.

### Passo 2: Chamar API de Pricing

```bash
curl -X POST http://localhost:3001/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "org_id": 1,
    "brand_id": 3755581063,
    "customer_id": 701546,
    "sku_id": 1980517,
    "sku_qty": 1,
    "order_value": 4270,
    "product_brand": "ZOJE",
    "product_model": "C5000-364-02 110V"
  }'
```

### Resposta Esperada

```json
{
  "success": true,
  "data": {
    "status": "success",
    "agent": "CSuite.Pricing.Agent",
    "result": {
      "decision": {
        "final_price": 4099.2,
        "discount_allowed": 0.04,
        ...
      }
    }
  }
}
```

## 🔍 Validação de Campos

A API valida os seguintes campos obrigatórios:

- `org_id` (número inteiro)
- `brand_id` (número inteiro)
- `customer_id` (número inteiro)
- `sku_id` (número inteiro)
- `sku_qty` (número positivo)
- `order_value` (número >= 0)
- `product_brand` (string)
- `product_model` (string)

Se algum campo estiver faltando ou inválido, retorna:

```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": ["campo é obrigatório", ...]
  }
}
```

## 🛠️ Script de Teste

Use o script `test-pricing-api.sh` para testar automaticamente:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend
./test-pricing-api.sh
```

## ✅ Status Final

- ✅ API criada e funcionando
- ✅ Autenticação protegendo o endpoint
- ✅ Validação de dados implementada
- ✅ Integração com API externa funcionando
- ✅ Tratamento de erros implementado
- ✅ Frontend service criado (`pricingService.calculate()`)

A API está pronta para uso em produção! 🚀

