# 📡 Contratos de API: Pricing Agent

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Base URL:** `/api/pricing`  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Autenticação](#2-autenticação)
3. [Endpoints](#3-endpoints)
4. [Schemas de Request/Response](#4-schemas)
5. [Códigos de Erro](#5-códigos-de-erro)
6. [Exemplos Completos](#6-exemplos-completos)

---

## 1. Visão Geral

### 1.1 Base URL

```
Produção:  https://leads.internut.com.br/api/pricing
Dev:       https://dev.office.internut.com.br/leads/modern/api/pricing
```

### 1.2 Content-Type

```
Content-Type: application/json
Accept: application/json
```

### 1.3 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/calculate` | Calcular preço para itens |
| POST | `/discount` | Aplicar desconto |
| POST | `/simulate` | Simular cenários de preço |
| POST | `/freeze` | Congelar preço (conversão) |
| POST | `/exception/request` | Solicitar exceção |
| POST | `/exception/:id/decide` | Aprovar/rejeitar exceção |
| GET | `/exception/:id` | Consultar exceção |
| GET | `/exceptions/pending` | Listar exceções pendentes |
| GET | `/history` | Histórico de decisões |
| GET | `/metrics` | Métricas de pricing |
| GET | `/policies` | Listar políticas ativas |

---

## 2. Autenticação

Todos os endpoints requerem autenticação via JWT Bearer Token.

```http
Authorization: Bearer <token>
```

### 2.1 Níveis de Acesso

| Endpoint | Nível Mínimo | Observação |
|----------|--------------|------------|
| POST `/calculate` | 1 | Todos os vendedores |
| POST `/discount` | 1 | Limitado pela autoridade |
| POST `/simulate` | 1 | Todos os vendedores |
| POST `/freeze` | 1 | Apenas próprios leads |
| POST `/exception/request` | 1 | Todos os vendedores |
| POST `/exception/:id/decide` | 5 | Apenas gerentes |
| GET `/exceptions/pending` | 5 | Apenas gerentes |
| GET `/history` | 1 | Filtrado por permissão |
| GET `/metrics` | 5 | Apenas gerentes |
| GET `/policies` | 5 | Apenas gerentes |

---

## 3. Endpoints

### 3.1 POST `/calculate`

Calcula o preço para um conjunto de itens, aplicando todas as políticas vigentes.

#### Request

```typescript
interface CalculateRequest {
  customer_id: number;           // ID do cliente
  seller_id?: number;            // ID do vendedor (default: usuário logado)
  items: CalculateItem[];        // Itens para calcular
  payment_condition?: string;    // Condição de pagamento
  freight_type?: string;         // Tipo de frete
  simulate_only?: boolean;       // Se true, não persiste evento
}

interface CalculateItem {
  product_id: number;
  quantity: number;
  unit_price_override?: number;  // Preço manual (requer autoridade)
}
```

#### Response

```typescript
interface CalculateResponse {
  success: boolean;
  data: {
    event_id: string;
    items: CalculatedItem[];
    summary: PricingSummary;
    compliance: ComplianceResult;
    policy_version: string;
  };
  error?: ErrorDetail;
}

interface CalculatedItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price_list: number;       // Preço de tabela
  unit_price_applied: number;    // Preço aplicado
  discount_percent: number;
  discount_absolute: number;
  total_gross: number;
  total_net: number;
  margin_percent: number;
  applied_policies: string[];    // Políticas aplicadas
}

interface PricingSummary {
  subtotal_gross: number;
  total_discounts: number;
  subtotal_net: number;
  total_taxes: number;
  total_freight: number;
  grand_total: number;
  gross_margin_percent: number;
  total_items: number;
  total_quantity: number;
}

interface ComplianceResult {
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_within_policy: boolean;
  requires_approval: boolean;
  violations?: Violation[];
}

interface Violation {
  type: string;
  message: string;
  limit: number;
  actual: number;
  policy_id: string;
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 12345,
    "items": [
      { "product_id": 1001, "quantity": 10 },
      { "product_id": 1002, "quantity": 5 }
    ],
    "payment_condition": "30/60/90"
  }'
```

---

### 3.2 POST `/discount`

Aplica um desconto a um evento de pricing existente.

#### Request

```typescript
interface DiscountRequest {
  event_id: string;              // ID do evento de pricing
  discount_type: 'PERCENT' | 'ABSOLUTE' | 'FIXED_PRICE';
  discount_value: number;        // Valor do desconto
  reason: string;                // Justificativa (obrigatório)
  apply_to: 'ALL' | string[];    // Aplicar a todos ou itens específicos
}
```

#### Response

```typescript
interface DiscountResponse {
  success: boolean;
  data: {
    event_id: string;            // Novo evento gerado
    previous_event_id: string;
    discount_applied: {
      type: string;
      value: number;
      effective_value: number;
    };
    new_totals: PricingSummary;
    compliance: ComplianceResult;
    exception?: ExceptionCreated;
  };
  error?: ErrorDetail;
}

interface ExceptionCreated {
  exception_id: string;
  status: 'PENDING';
  expires_at: string;
  approvers: Approver[];
}

interface Approver {
  id: number;
  name: string;
  level: number;
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/discount \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "discount_type": "PERCENT",
    "discount_value": 10,
    "reason": "Negociação comercial - cliente estratégico",
    "apply_to": "ALL"
  }'
```

---

### 3.3 POST `/simulate`

Simula diferentes cenários de desconto sem persistir.

#### Request

```typescript
interface SimulateRequest {
  customer_id: number;
  seller_id?: number;
  items: CalculateItem[];
  scenarios: SimulationScenario[];
}

interface SimulationScenario {
  discount_percent?: number;
  discount_absolute?: number;
  fixed_price?: number;
}
```

#### Response

```typescript
interface SimulateResponse {
  success: boolean;
  data: {
    base_price: number;
    base_margin: number;
    scenarios: ScenarioResult[];
    recommendation: Recommendation;
  };
}

interface ScenarioResult {
  scenario_index: number;
  discount_percent: number;
  final_price: number;
  margin_percent: number;
  compliance: 'APPROVED' | 'REQUIRES_APPROVAL' | 'REJECTED';
  risk_level: string;
}

interface Recommendation {
  max_discount_without_approval: number;
  optimal_discount: number;
  reason: string;
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/simulate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 12345,
    "items": [{ "product_id": 1001, "quantity": 10 }],
    "scenarios": [
      { "discount_percent": 5 },
      { "discount_percent": 10 },
      { "discount_percent": 15 }
    ]
  }'
```

---

### 3.4 POST `/freeze`

Congela o preço de um lead na conversão para pedido (Price Freeze).

#### Request

```typescript
interface FreezeRequest {
  lead_id: number;
  event_id: string;              // Último evento de pricing do lead
}
```

#### Response

```typescript
interface FreezeResponse {
  success: boolean;
  data: {
    event_id: string;            // Novo evento de freeze
    action: 'CONVERT_ORDER';
    freeze_status: {
      is_frozen: boolean;
      frozen_at: string;
      frozen_by: number;
      policy_version_frozen: string;
    };
    final_pricing: PricingSummary;
    message: string;
  };
  error?: ErrorDetail;
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/freeze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 98765,
    "event_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

---

### 3.5 POST `/exception/request`

Solicita aprovação para uma exceção de política.

#### Request

```typescript
interface ExceptionRequestBody {
  event_id: string;
  requested_discount: number;    // Desconto solicitado (%)
  requested_price?: number;      // Ou preço fixo solicitado
  reason: string;                // Justificativa detalhada
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attachments?: string[];        // URLs de anexos
}
```

#### Response

```typescript
interface ExceptionRequestResponse {
  success: boolean;
  data: {
    exception_id: string;
    status: 'PENDING';
    requested_at: string;
    expires_at: string;
    workflow: {
      current_step: number;
      total_steps: number;
      approvers: ApproverStatus[];
    };
    impact: {
      margin_loss: number;
      commission_reduction: number;
    };
  };
}

interface ApproverStatus {
  step: number;
  user_id: number;
  user_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notified_at: string;
  decided_at?: string;
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/exception/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "550e8400-e29b-41d4-a716-446655440001",
    "requested_discount": 15,
    "reason": "Cliente ameaçou ir para concorrência. Pedido estratégico de R$ 50.000.",
    "urgency": "HIGH"
  }'
```

---

### 3.6 POST `/exception/:id/decide`

Aprova ou rejeita uma exceção (apenas gerentes).

#### Request

```typescript
interface ExceptionDecideRequest {
  decision: 'APPROVE' | 'REJECT';
  approved_discount?: number;    // Pode ser menor que o solicitado
  notes?: string;
}
```

#### Response

```typescript
interface ExceptionDecideResponse {
  success: boolean;
  data: {
    exception_id: string;
    status: 'APPROVED' | 'REJECTED';
    decision: {
      decided_by: number;
      decided_at: string;
      approved_discount?: number;
      notes?: string;
    };
    new_event_id?: string;       // Se aprovado
    updated_pricing?: PricingSummary;
  };
}
```

#### Exemplo

```bash
curl -X POST https://leads.internut.com.br/api/pricing/exception/exc-789012/decide \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVE",
    "approved_discount": 12,
    "notes": "Aprovado com desconto reduzido. Margem mínima preservada."
  }'
```

---

### 3.7 GET `/exception/:id`

Consulta detalhes de uma exceção.

#### Response

```typescript
interface ExceptionDetailResponse {
  success: boolean;
  data: {
    exception_id: string;
    event_id: string;
    status: string;
    requested_by: UserInfo;
    requested_at: string;
    requested_discount: number;
    reason: string;
    urgency: string;
    violation_type: string;
    expires_at: string;
    approved_by?: UserInfo;
    approved_at?: string;
    approved_discount?: number;
    approval_notes?: string;
    margin_impact: number;
    commission_impact?: number;
    customer: CustomerInfo;
    seller: SellerInfo;
    pricing_summary: PricingSummary;
  };
}
```

---

### 3.8 GET `/exceptions/pending`

Lista exceções pendentes de aprovação (apenas gerentes).

#### Query Parameters

| Param | Tipo | Descrição |
|-------|------|-----------|
| `seller_id` | number | Filtrar por vendedor |
| `urgency` | string | Filtrar por urgência |
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 20) |

#### Response

```typescript
interface PendingExceptionsResponse {
  success: boolean;
  data: {
    exceptions: ExceptionSummary[];
    pagination: Pagination;
  };
}

interface ExceptionSummary {
  exception_id: string;
  event_id: string;
  status: string;
  requested_by: string;
  requested_at: string;
  requested_discount: number;
  urgency: string;
  expires_at: string;
  hours_until_expiry: number;
  customer_name: string;
  seller_name: string;
  margin_impact: number;
}
```

---

### 3.9 GET `/history`

Consulta histórico de decisões de preço.

#### Query Parameters

| Param | Tipo | Descrição |
|-------|------|-----------|
| `customer_id` | number | Filtrar por cliente |
| `seller_id` | number | Filtrar por vendedor |
| `lead_id` | number | Filtrar por lead |
| `order_id` | number | Filtrar por pedido |
| `action` | string | Filtrar por ação |
| `compliance_status` | string | Filtrar por status |
| `risk_level` | string | Filtrar por risco |
| `from_date` | string | Data inicial (YYYY-MM-DD) |
| `to_date` | string | Data final (YYYY-MM-DD) |
| `page` | number | Página |
| `limit` | number | Itens por página |

#### Response

```typescript
interface HistoryResponse {
  success: boolean;
  data: {
    events: EventSummary[];
    pagination: Pagination;
  };
}

interface EventSummary {
  event_id: string;
  event_timestamp: string;
  action: string;
  customer_id: number;
  customer_name: string;
  seller_id: number;
  seller_name: string;
  lead_id?: number;
  order_id?: number;
  price_base: number;
  price_final: number;
  discount_percent: number;
  margin_percent: number;
  risk_level: string;
  compliance_status: string;
  is_frozen: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
```

---

### 3.10 GET `/metrics`

Obtém métricas de pricing (apenas gerentes).

#### Query Parameters

| Param | Tipo | Descrição |
|-------|------|-----------|
| `seller_id` | number | Filtrar por vendedor |
| `segment` | string | Filtrar por segmento |
| `from_date` | string | Data inicial |
| `to_date` | string | Data final |
| `group_by` | string | Agrupar por: day, week, month, seller, segment |

#### Response

```typescript
interface MetricsResponse {
  success: boolean;
  data: {
    period: {
      from: string;
      to: string;
    };
    metrics: {
      price_integrity_score: number;
      discount_drift: number;
      approval_rate: number;
      approval_pressure_index: number;
      avg_margin_percent: number;
      risk_exposure_value: number;
      total_decisions: number;
      total_exceptions: number;
    };
    trends?: TrendData[];
    breakdown?: BreakdownData[];
  };
}

interface TrendData {
  date: string;
  price_integrity_score: number;
  approval_pressure_index: number;
  avg_margin_percent: number;
}

interface BreakdownData {
  dimension: string;             // seller_name ou segment
  dimension_id: number | string;
  price_integrity_score: number;
  approval_pressure_index: number;
  total_decisions: number;
}
```

---

### 3.11 GET `/policies`

Lista políticas de preço ativas (apenas gerentes).

#### Query Parameters

| Param | Tipo | Descrição |
|-------|------|-----------|
| `type` | string | Filtrar por tipo |
| `active_only` | boolean | Apenas ativas (default: true) |

#### Response

```typescript
interface PoliciesResponse {
  success: boolean;
  data: {
    policies: PolicySummary[];
    current_version: string;
  };
}

interface PolicySummary {
  policy_id: string;
  policy_code: string;
  policy_name: string;
  policy_type: string;
  policy_version: string;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  priority: number;
  description?: string;
}
```

---

## 4. Schemas Comuns

### 4.1 ErrorDetail

```typescript
interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}
```

### 4.2 UserInfo

```typescript
interface UserInfo {
  id: number;
  name: string;
  level: number;
}
```

### 4.3 CustomerInfo

```typescript
interface CustomerInfo {
  id: number;
  code: string;
  name: string;
  segment: string;
  credit_status: string;
}
```

### 4.4 SellerInfo

```typescript
interface SellerInfo {
  id: number;
  name: string;
  level: number;
  segment: string;
}
```

---

## 5. Códigos de Erro

### 5.1 Erros HTTP

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito de estado |
| 422 | Unprocessable Entity - Violação de regra |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

### 5.2 Códigos de Erro de Negócio

| Código | Descrição |
|--------|-----------|
| `PRICING_001` | Preço abaixo da margem mínima |
| `PRICING_002` | Desconto acima do limite permitido |
| `PRICING_003` | Cliente com crédito bloqueado |
| `PRICING_004` | Preço já congelado (frozen) |
| `PRICING_005` | Evento não encontrado |
| `PRICING_006` | Exceção já decidida |
| `PRICING_007` | Exceção expirada |
| `PRICING_008` | Sem autoridade para desconto |
| `PRICING_009` | Política não encontrada |
| `PRICING_010` | Lead não pertence ao vendedor |

### 5.3 Exemplo de Erro

```json
{
  "success": false,
  "error": {
    "code": "PRICING_001",
    "message": "Preço abaixo da margem mínima permitida",
    "details": {
      "min_margin_required": 20,
      "actual_margin": 15.5,
      "policy_id": "pol-margin-min-001"
    }
  }
}
```

---

## 6. Exemplos Completos

### 6.1 Fluxo Completo: Adicionar Item → Desconto → Exceção → Aprovar

```bash
# 1. Calcular preço inicial
curl -X POST /api/pricing/calculate \
  -d '{"customer_id": 12345, "items": [{"product_id": 1001, "quantity": 10}]}'

# Response: event_id = "evt-001", compliance = APPROVED

# 2. Aplicar desconto de 12%
curl -X POST /api/pricing/discount \
  -d '{"event_id": "evt-001", "discount_type": "PERCENT", "discount_value": 12, "reason": "Negociação", "apply_to": "ALL"}'

# Response: event_id = "evt-002", compliance = PENDING_APPROVAL, exception_id = "exc-001"

# 3. Gerente aprova com desconto reduzido
curl -X POST /api/pricing/exception/exc-001/decide \
  -d '{"decision": "APPROVE", "approved_discount": 10, "notes": "Aprovado com 10%"}'

# Response: new_event_id = "evt-003", status = APPROVED

# 4. Converter para pedido (freeze)
curl -X POST /api/pricing/freeze \
  -d '{"lead_id": 98765, "event_id": "evt-003"}'

# Response: is_frozen = true
```

### 6.2 Fluxo: Simulação antes de aplicar desconto

```bash
# 1. Simular cenários
curl -X POST /api/pricing/simulate \
  -d '{
    "customer_id": 12345,
    "items": [{"product_id": 1001, "quantity": 10}],
    "scenarios": [
      {"discount_percent": 5},
      {"discount_percent": 10},
      {"discount_percent": 15}
    ]
  }'

# Response:
# - 5%: APPROVED, margin 25%
# - 10%: APPROVED, margin 20%
# - 15%: REQUIRES_APPROVAL, margin 15%
# - recommendation: max_discount_without_approval = 10%
```

---

## 📚 Documentação Relacionada

- [Especificação Pricing Agent](./SPEC_PRICING_AGENT.md)
- [Schemas Detalhados](./SPEC_PRICING_SCHEMAS.md)
- [DDL do Banco de Dados](./DDL_PRICING_AGENT.sql)
- [Checklist Q1 2026](./CHECKLIST_Q1_2026.md)

---

**© Rolemak - Sistema de Gestão de Leads**
