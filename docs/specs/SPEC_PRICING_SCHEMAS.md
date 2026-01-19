# 📐 Schemas Detalhados: Pricing Agent

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026

---

## 1. PricingDecisionEvent (Schema Completo)

```typescript
/**
 * Evento de decisão de preço - núcleo da memória econômica
 */
interface PricingDecisionEvent {
  // ═══════════════════════════════════════════════════════════
  // IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  event_id: string;                    // UUID v4
  event_version: string;               // "1.0"
  event_timestamp: Date;               // ISO 8601
  
  // ═══════════════════════════════════════════════════════════
  // ORIGEM
  // ═══════════════════════════════════════════════════════════
  source: "CRM" | "API" | "BATCH";
  action: PricingAction;
  
  // ═══════════════════════════════════════════════════════════
  // CONTEXTOS
  // ═══════════════════════════════════════════════════════════
  customer_context: CustomerContext;
  seller_context: SellerContext;
  transaction_context: TransactionContext;
  policy_context: PolicyContext;
  
  // ═══════════════════════════════════════════════════════════
  // RESULTADO
  // ═══════════════════════════════════════════════════════════
  pricing_result: PricingResult;
  
  // ═══════════════════════════════════════════════════════════
  // CLASSIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  risk_level: RiskLevel;
  compliance_status: ComplianceStatus;
  
  // ═══════════════════════════════════════════════════════════
  // METADADOS
  // ═══════════════════════════════════════════════════════════
  metadata: EventMetadata;
}
```

---

## 2. Enums e Types

```typescript
// ═══════════════════════════════════════════════════════════
// AÇÕES DE PRICING
// ═══════════════════════════════════════════════════════════
type PricingAction = 
  | "ADD_ITEM"           // Inclusão de item no lead
  | "UPDATE_QTY"         // Alteração de quantidade
  | "APPLY_DISCOUNT"     // Aplicação de desconto
  | "REMOVE_DISCOUNT"    // Remoção de desconto
  | "APPLY_CAMPAIGN"     // Aplicação de campanha
  | "SIMULATE"           // Simulação (não persiste)
  | "CONVERT_ORDER"      // Conversão para pedido (freeze)
  | "EXCEPTION_REQUEST"  // Solicitação de exceção
  | "EXCEPTION_APPROVE"  // Aprovação de exceção
  | "EXCEPTION_REJECT";  // Rejeição de exceção

// ═══════════════════════════════════════════════════════════
// NÍVEIS DE RISCO
// ═══════════════════════════════════════════════════════════
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ═══════════════════════════════════════════════════════════
// STATUS DE CONFORMIDADE
// ═══════════════════════════════════════════════════════════
type ComplianceStatus = 
  | "APPROVED"           // Dentro da política
  | "PENDING_APPROVAL"   // Aguardando aprovação
  | "APPROVED_EXCEPTION" // Aprovado como exceção
  | "REJECTED"           // Rejeitado
  | "FROZEN";            // Congelado (pós-conversão)

// ═══════════════════════════════════════════════════════════
// STATUS DE CRÉDITO
// ═══════════════════════════════════════════════════════════
type CreditStatus = 
  | "APPROVED"      // Crédito liberado
  | "RESTRICTED"    // Crédito restrito
  | "BLOCKED"       // Crédito bloqueado
  | "PENDING";      // Análise pendente
```

---

## 3. CustomerContext

```typescript
/**
 * Contexto do cliente no momento da decisão
 */
interface CustomerContext {
  // ═══════════════════════════════════════════════════════════
  // IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  customer_id: number;
  customer_code: string;           // Código no sistema legado
  customer_name: string;
  
  // ═══════════════════════════════════════════════════════════
  // SEGMENTAÇÃO
  // ═══════════════════════════════════════════════════════════
  segment: string;                 // Ex: "VAREJO", "ATACADO"
  category: string;                // Ex: "A", "B", "C"
  region: string;                  // Ex: "SUL", "SUDESTE"
  
  // ═══════════════════════════════════════════════════════════
  // RISCO DE CRÉDITO
  // ═══════════════════════════════════════════════════════════
  credit_status: CreditStatus;
  credit_limit: number;
  credit_available: number;
  days_overdue: number;
  
  // ═══════════════════════════════════════════════════════════
  // HISTÓRICO
  // ═══════════════════════════════════════════════════════════
  lifetime_value: number;          // Valor total histórico
  avg_ticket: number;              // Ticket médio
  purchase_frequency: number;      // Compras/mês
  last_purchase_date: Date | null;
  days_since_last_purchase: number;
  
  // ═══════════════════════════════════════════════════════════
  // RISCO DE CHURN
  // ═══════════════════════════════════════════════════════════
  churn_risk_score: number;        // 0-100
}
```

---

## 4. SellerContext

```typescript
/**
 * Contexto do vendedor no momento da decisão
 */
interface SellerContext {
  // ═══════════════════════════════════════════════════════════
  // IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  seller_id: number;
  seller_name: string;
  seller_code: string;
  
  // ═══════════════════════════════════════════════════════════
  // HIERARQUIA
  // ═══════════════════════════════════════════════════════════
  level: number;                   // 1-6
  segment: string;                 // Segmento do vendedor
  team_id: number | null;
  manager_id: number | null;
  
  // ═══════════════════════════════════════════════════════════
  // AUTORIDADE DE DESCONTO
  // ═══════════════════════════════════════════════════════════
  discount_authority: DiscountAuthority;
  max_discount_percent: number;    // Desconto máximo permitido
  
  // ═══════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════
  monthly_sales: number;
  monthly_target: number;
  target_achievement: number;      // % da meta
  
  // ═══════════════════════════════════════════════════════════
  // HISTÓRICO DE EXCEÇÕES
  // ═══════════════════════════════════════════════════════════
  exceptions_this_month: number;
  approval_rate: number;           // % de exceções aprovadas
}

interface DiscountAuthority {
  level: "NONE" | "LIMITED" | "STANDARD" | "EXTENDED" | "FULL";
  max_percent: number;
  max_absolute: number;
  requires_approval_above: number;
}
```

---

## 5. TransactionContext

```typescript
/**
 * Contexto da transação (lead/pedido)
 */
interface TransactionContext {
  // ═══════════════════════════════════════════════════════════
  // IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════
  lead_id: number | null;
  order_id: number | null;         // Preenchido após conversão
  cart_id: number;
  
  // ═══════════════════════════════════════════════════════════
  // ITENS
  // ═══════════════════════════════════════════════════════════
  items: TransactionItem[];
  total_items: number;
  total_quantity: number;
  
  // ═══════════════════════════════════════════════════════════
  // VALORES
  // ═══════════════════════════════════════════════════════════
  subtotal_gross: number;          // Subtotal bruto
  total_discounts: number;         // Total de descontos
  subtotal_net: number;            // Subtotal líquido
  total_taxes: number;             // Total de impostos
  total_freight: number;           // Frete
  grand_total: number;             // Total final
  
  // ═══════════════════════════════════════════════════════════
  // MARGENS
  // ═══════════════════════════════════════════════════════════
  total_cost: number;              // Custo total
  gross_margin: number;            // Margem bruta (R$)
  gross_margin_percent: number;    // Margem bruta (%)
  
  // ═══════════════════════════════════════════════════════════
  // CONDIÇÕES
  // ═══════════════════════════════════════════════════════════
  payment_condition: string;
  freight_type: string;
}

interface TransactionItem {
  item_id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  brand: string;
  category: string;
  
  quantity: number;
  unit_price_list: number;         // Preço de tabela
  unit_price_applied: number;      // Preço aplicado
  discount_percent: number;
  discount_absolute: number;
  
  unit_cost: number;
  margin_percent: number;
  
  total_gross: number;
  total_net: number;
}
```

---

## 6. PolicyContext

```typescript
/**
 * Contexto da política aplicada
 */
interface PolicyContext {
  // ═══════════════════════════════════════════════════════════
  // VERSÃO DA POLÍTICA
  // ═══════════════════════════════════════════════════════════
  policy_version: string;          // Ex: "2026.01.15"
  policy_effective_date: Date;
  
  // ═══════════════════════════════════════════════════════════
  // POLÍTICAS APLICADAS
  // ═══════════════════════════════════════════════════════════
  applied_policies: AppliedPolicy[];
  
  // ═══════════════════════════════════════════════════════════
  // LIMITES VIGENTES
  // ═══════════════════════════════════════════════════════════
  limits: PolicyLimits;
  
  // ═══════════════════════════════════════════════════════════
  // CAMPANHAS ATIVAS
  // ═══════════════════════════════════════════════════════════
  active_campaigns: Campaign[];
}

interface AppliedPolicy {
  policy_id: string;
  policy_name: string;
  policy_type: PolicyType;
  priority: number;
  applied: boolean;
  impact: number;                  // Impacto no preço (R$)
  reason: string;
}

type PolicyType = 
  | "BASE_PRICE"          // Preço base
  | "VOLUME_CURVE"        // Curva de volume
  | "CUSTOMER_DISCOUNT"   // Desconto por cliente
  | "SEGMENT_DISCOUNT"    // Desconto por segmento
  | "CAMPAIGN"            // Campanha promocional
  | "MINIMUM_MARGIN"      // Margem mínima
  | "CREDIT_RESTRICTION"  // Restrição de crédito
  | "SPECIAL_CONDITION";  // Condição especial

interface PolicyLimits {
  min_margin_percent: number;
  max_discount_percent: number;
  max_discount_absolute: number;
  requires_approval_above: number;
}

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  discount_type: "PERCENT" | "ABSOLUTE" | "FIXED_PRICE";
  discount_value: number;
  valid_from: Date;
  valid_until: Date;
  applicable_products: string[];
}
```

---

## 7. PricingResult

```typescript
/**
 * Resultado da decisão de preço
 */
interface PricingResult {
  // ═══════════════════════════════════════════════════════════
  // PREÇO FINAL
  // ═══════════════════════════════════════════════════════════
  price_base: number;              // Preço de tabela
  price_final: number;             // Preço final aplicado
  
  // ═══════════════════════════════════════════════════════════
  // DESCONTOS
  // ═══════════════════════════════════════════════════════════
  discount_total: number;
  discount_percent: number;
  discount_breakdown: DiscountBreakdown[];
  
  // ═══════════════════════════════════════════════════════════
  // MARGEM
  // ═══════════════════════════════════════════════════════════
  margin_absolute: number;
  margin_percent: number;
  margin_vs_minimum: number;       // Diferença vs mínimo
  
  // ═══════════════════════════════════════════════════════════
  // COMPARATIVOS
  // ═══════════════════════════════════════════════════════════
  price_vs_list: number;           // % vs preço de tabela
  price_vs_average: number;        // % vs preço médio histórico
  
  // ═══════════════════════════════════════════════════════════
  // FLAGS
  // ═══════════════════════════════════════════════════════════
  is_within_policy: boolean;
  requires_approval: boolean;
  is_frozen: boolean;
}

interface DiscountBreakdown {
  source: string;                  // Ex: "VOLUME", "CAMPAIGN", "MANUAL"
  type: "PERCENT" | "ABSOLUTE";
  value: number;
  applied_value: number;
}
```

---

## 8. EventMetadata

```typescript
/**
 * Metadados do evento
 */
interface EventMetadata {
  // ═══════════════════════════════════════════════════════════
  // RASTREABILIDADE
  // ═══════════════════════════════════════════════════════════
  correlation_id: string;
  session_id: string;
  request_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // ORIGEM
  // ═══════════════════════════════════════════════════════════
  ip_address: string;
  user_agent: string;
  
  // ═══════════════════════════════════════════════════════════
  // TIMING
  // ═══════════════════════════════════════════════════════════
  processing_time_ms: number;
  
  // ═══════════════════════════════════════════════════════════
  // REFERÊNCIAS
  // ═══════════════════════════════════════════════════════════
  previous_event_id: string | null;
  parent_event_id: string | null;
  
  // ═══════════════════════════════════════════════════════════
  // AUDITORIA
  // ═══════════════════════════════════════════════════════════
  created_by: number;
  created_at: Date;
  
  // ═══════════════════════════════════════════════════════════
  // EXTRAS
  // ═══════════════════════════════════════════════════════════
  tags: string[];
  notes: string | null;
}
```

---

## 9. Schema SQL

```sql
-- ═══════════════════════════════════════════════════════════
-- TABELA: pricing_decision_events
-- ═══════════════════════════════════════════════════════════
CREATE TABLE pricing_decision_events (
    event_id VARCHAR(36) PRIMARY KEY,
    event_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    event_timestamp DATETIME(3) NOT NULL,
    
    -- Origem
    source ENUM('CRM', 'API', 'BATCH') NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    -- Referências
    customer_id INT NOT NULL,
    seller_id INT NOT NULL,
    lead_id INT NULL,
    order_id INT NULL,
    cart_id INT NOT NULL,
    
    -- Política
    policy_version VARCHAR(20) NOT NULL,
    
    -- Resultado
    price_base DECIMAL(15,2) NOT NULL,
    price_final DECIMAL(15,2) NOT NULL,
    discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    margin_absolute DECIMAL(15,2) NOT NULL,
    margin_percent DECIMAL(5,2) NOT NULL,
    
    -- Classificação
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    compliance_status ENUM('APPROVED', 'PENDING_APPROVAL', 
                          'APPROVED_EXCEPTION', 'REJECTED', 'FROZEN') NOT NULL,
    
    -- Flags
    is_within_policy BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Contextos (JSON)
    customer_context JSON NOT NULL,
    seller_context JSON NOT NULL,
    transaction_context JSON NOT NULL,
    policy_context JSON NOT NULL,
    pricing_result JSON NOT NULL,
    metadata JSON NOT NULL,
    
    -- Auditoria
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_by INT NOT NULL,
    
    -- Índices
    INDEX idx_customer (customer_id),
    INDEX idx_seller (seller_id),
    INDEX idx_lead (lead_id),
    INDEX idx_timestamp (event_timestamp),
    INDEX idx_compliance (compliance_status),
    INDEX idx_frozen (is_frozen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- TABELA: pricing_policies
-- ═══════════════════════════════════════════════════════════
CREATE TABLE pricing_policies (
    policy_id VARCHAR(36) PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    config JSON NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 100,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    
    INDEX idx_type (policy_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- TABELA: pricing_exceptions
-- ═══════════════════════════════════════════════════════════
CREATE TABLE pricing_exceptions (
    exception_id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL,
    
    -- Solicitação
    requested_by INT NOT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_discount DECIMAL(5,2) NOT NULL,
    requested_reason TEXT NOT NULL,
    
    -- Aprovação
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approved_discount DECIMAL(5,2) NULL,
    approval_notes TEXT NULL,
    
    -- Expiração
    expires_at DATETIME NOT NULL,
    
    -- Impacto
    margin_impact DECIMAL(15,2) NOT NULL,
    commission_impact DECIMAL(5,2) NULL,
    
    INDEX idx_event (event_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (event_id) REFERENCES pricing_decision_events(event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- TABELA: pricing_metrics_daily
-- ═══════════════════════════════════════════════════════════
CREATE TABLE pricing_metrics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    seller_id INT NULL,
    segment VARCHAR(50) NULL,
    
    -- Métricas
    total_decisions INT NOT NULL DEFAULT 0,
    decisions_within_policy INT NOT NULL DEFAULT 0,
    price_integrity_score DECIMAL(5,2) NOT NULL DEFAULT 100,
    avg_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_drift DECIMAL(5,2) NOT NULL DEFAULT 0,
    exception_attempts INT NOT NULL DEFAULT 0,
    approval_pressure_index DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    risk_exposure_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_date_seller (metric_date, seller_id, segment),
    INDEX idx_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 10. Exemplo de Evento Completo

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_version": "1.0",
  "event_timestamp": "2026-01-15T14:30:00.000Z",
  "source": "CRM",
  "action": "APPLY_DISCOUNT",
  
  "customer_context": {
    "customer_id": 12345,
    "customer_code": "CLI-12345",
    "customer_name": "Empresa ABC Ltda",
    "segment": "VAREJO",
    "category": "A",
    "region": "SUDESTE",
    "credit_status": "APPROVED",
    "credit_limit": 50000.00,
    "credit_available": 35000.00,
    "days_overdue": 0,
    "lifetime_value": 250000.00,
    "avg_ticket": 5000.00,
    "purchase_frequency": 2.5,
    "last_purchase_date": "2026-01-05",
    "days_since_last_purchase": 10,
    "churn_risk_score": 15
  },
  
  "seller_context": {
    "seller_id": 67,
    "seller_name": "João Silva",
    "seller_code": "VEND-067",
    "level": 3,
    "segment": "VAREJO",
    "team_id": 5,
    "manager_id": 12,
    "discount_authority": {
      "level": "LIMITED",
      "max_percent": 10,
      "max_absolute": 500,
      "requires_approval_above": 10
    },
    "max_discount_percent": 10,
    "monthly_sales": 85000.00,
    "monthly_target": 100000.00,
    "target_achievement": 85,
    "exceptions_this_month": 2,
    "approval_rate": 75
  },
  
  "transaction_context": {
    "lead_id": 98765,
    "order_id": null,
    "cart_id": 98765,
    "items": [
      {
        "item_id": 1,
        "product_id": 1001,
        "product_code": "PROD-1001",
        "product_name": "Produto Premium",
        "brand": "Marca A",
        "category": "Categoria 1",
        "quantity": 10,
        "unit_price_list": 100.00,
        "unit_price_applied": 88.00,
        "discount_percent": 12,
        "discount_absolute": 12.00,
        "unit_cost": 65.00,
        "margin_percent": 26.1,
        "total_gross": 1000.00,
        "total_net": 880.00
      }
    ],
    "total_items": 1,
    "total_quantity": 10,
    "subtotal_gross": 1000.00,
    "total_discounts": 120.00,
    "subtotal_net": 880.00,
    "total_taxes": 158.40,
    "total_freight": 50.00,
    "grand_total": 1088.40,
    "total_cost": 650.00,
    "gross_margin": 230.00,
    "gross_margin_percent": 26.1,
    "payment_condition": "30/60/90",
    "freight_type": "CIF"
  },
  
  "policy_context": {
    "policy_version": "2026.01.15",
    "policy_effective_date": "2026-01-15",
    "applied_policies": [
      {
        "policy_id": "pol-base-001",
        "policy_name": "Preço Base",
        "policy_type": "BASE_PRICE",
        "priority": 20,
        "applied": true,
        "impact": 0,
        "reason": "Preço de tabela aplicado"
      },
      {
        "policy_id": "pol-volume-001",
        "policy_name": "Desconto Volume",
        "policy_type": "VOLUME_CURVE",
        "priority": 50,
        "applied": true,
        "impact": -30.00,
        "reason": "Quantidade 10 = 3% desconto"
      }
    ],
    "limits": {
      "min_margin_percent": 20,
      "max_discount_percent": 15,
      "max_discount_absolute": 1000,
      "requires_approval_above": 10
    },
    "active_campaigns": []
  },
  
  "pricing_result": {
    "price_base": 1000.00,
    "price_final": 880.00,
    "discount_total": 120.00,
    "discount_percent": 12,
    "discount_breakdown": [
      { "source": "VOLUME", "type": "PERCENT", "value": 3, "applied_value": 30.00 },
      { "source": "MANUAL", "type": "PERCENT", "value": 9, "applied_value": 90.00 }
    ],
    "margin_absolute": 230.00,
    "margin_percent": 26.1,
    "margin_vs_minimum": 6.1,
    "price_vs_list": -12,
    "price_vs_average": -5,
    "is_within_policy": false,
    "requires_approval": true,
    "is_frozen": false
  },
  
  "risk_level": "MEDIUM",
  "compliance_status": "PENDING_APPROVAL",
  
  "metadata": {
    "correlation_id": "corr-abc123",
    "session_id": "sess-xyz789",
    "request_id": "req-def456",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0",
    "processing_time_ms": 45,
    "previous_event_id": "550e8400-e29b-41d4-a716-446655439999",
    "parent_event_id": null,
    "created_by": 67,
    "created_at": "2026-01-15T14:30:00.000Z",
    "tags": ["desconto_manual", "cliente_a"],
    "notes": "Desconto solicitado para fechar negociação"
  }
}
```

---

## 📚 Documentação Relacionada

- [Especificação Pricing Agent](./SPEC_PRICING_AGENT.md)
- [Plano de Melhoria 2026](./PLANO_MELHORIA_2026.md)
- [Manual do Agente IA](./MANUAL_AGENTE_IA.md)

---

**© Rolemak - Sistema de Gestão de Leads**
