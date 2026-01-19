# 🔐 Especificação Técnica: Pricing Agent

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026  
**Status:** Especificação para Implementação Q1 2026

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Schemas e Modelos de Dados](#3-schemas-e-modelos-de-dados)
4. [API Reference](#4-api-reference)
5. [Políticas de Preço](#5-políticas-de-preço)
6. [Workflows de Exceção](#6-workflows-de-exceção)
7. [Integração com CRM](#7-integração-com-crm)
8. [Métricas e Observabilidade](#8-métricas-e-observabilidade)
9. [Segurança e Auditoria](#9-segurança-e-auditoria)
10. [Guia de Implementação](#10-guia-de-implementação)

---

## 1. Visão Geral

### 1.1 O que é o Pricing Agent

O **Pricing Agent** é o componente central de **governança econômica** do sistema Leads Agent. Ele atua como **autoridade única** para todas as decisões que envolvem preço, desconto, margem e política comercial.

### 1.2 Princípios Fundamentais

> **"Toda ação que altera preço é uma decisão governada"**

- **AVALIAR** política → **APLICAR** preço → **REGISTRAR** decisão → **GOVERNAR** exceções

### 1.3 Responsabilidades

| Responsabilidade | Descrição |
|------------------|-----------|
| **Calcular preços** | Aplicar tabela base + políticas |
| **Validar descontos** | Verificar limites e autoridade |
| **Classificar risco** | Avaliar impacto econômico |
| **Registrar decisões** | Criar eventos auditáveis |
| **Gerenciar exceções** | Workflow de aprovação |
| **Congelar preços** | Price Freeze na conversão |

---

## 2. Arquitetura

### 2.1 Componentes

| Componente | Responsabilidade |
|------------|------------------|
| **Policy Engine** | Carrega e executa políticas de preço |
| **Price Calculator** | Calcula preço base + ajustes |
| **Risk Classifier** | Classifica risco econômico da decisão |
| **Decision Logger** | Registra PricingDecisionEvent |
| **Exception Handler** | Gerencia workflow de exceções |
| **Freeze Manager** | Controla imutabilidade pós-conversão |

---

## 3. Schemas e Modelos de Dados

### 3.1 PricingDecisionEvent (Core Schema)

```typescript
interface PricingDecisionEvent {
  // Identificação
  event_id: string;                    // UUID v4
  event_version: string;               // "1.0"
  event_timestamp: Date;               // ISO 8601
  
  // Origem
  source: "CRM" | "API" | "BATCH";
  action: PricingAction;
  
  // Contextos
  customer_context: CustomerContext;
  seller_context: SellerContext;
  transaction_context: TransactionContext;
  policy_context: PolicyContext;
  
  // Resultado
  pricing_result: PricingResult;
  
  // Classificação
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  compliance_status: "APPROVED" | "PENDING_APPROVAL" | "APPROVED_EXCEPTION" | "REJECTED" | "FROZEN";
  
  // Metadados
  metadata: EventMetadata;
}

type PricingAction = 
  | "ADD_ITEM"           // Inclusão de item no lead
  | "UPDATE_QTY"         // Alteração de quantidade
  | "APPLY_DISCOUNT"     // Aplicação de desconto
  | "CONVERT_ORDER"      // Conversão para pedido (freeze)
  | "EXCEPTION_REQUEST"  // Solicitação de exceção
  | "EXCEPTION_APPROVE"  // Aprovação de exceção
  | "EXCEPTION_REJECT";  // Rejeição de exceção
```

### 3.2 CustomerContext

```typescript
interface CustomerContext {
  customer_id: number;
  customer_code: string;
  segment: string;
  category: string;
  credit_status: "APPROVED" | "RESTRICTED" | "BLOCKED";
  credit_limit: number;
  credit_available: number;
  days_overdue: number;
  lifetime_value: number;
  churn_risk_score: number;
}
```

### 3.3 SellerContext

```typescript
interface SellerContext {
  seller_id: number;
  seller_name: string;
  level: number;
  segment: string;
  max_discount_percent: number;
  monthly_sales: number;
  monthly_target: number;
  exceptions_this_month: number;
}
```

### 3.4 PricingResult

```typescript
interface PricingResult {
  price_base: number;
  price_final: number;
  discount_total: number;
  discount_percent: number;
  margin_absolute: number;
  margin_percent: number;
  is_within_policy: boolean;
  requires_approval: boolean;
  is_frozen: boolean;
}
```

---

## 4. API Reference

### 4.1 Calcular Preço

```http
POST /api/pricing/calculate
```

**Request:**
```json
{
  "customer_id": 12345,
  "seller_id": 67,
  "items": [{ "product_id": 1001, "quantity": 10 }],
  "payment_condition": "30/60/90"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid",
    "items": [...],
    "compliance": {
      "status": "APPROVED",
      "risk_level": "LOW",
      "is_within_policy": true
    }
  }
}
```

### 4.2 Aplicar Desconto

```http
POST /api/pricing/discount
```

### 4.3 Simular Preço

```http
POST /api/pricing/simulate
```

### 4.4 Congelar Preço (Price Freeze)

```http
POST /api/pricing/freeze
```

### 4.5 Solicitar Exceção

```http
POST /api/pricing/exception/request
```

### 4.6 Aprovar/Rejeitar Exceção

```http
POST /api/pricing/exception/:id/decide
```

### 4.7 Obter Métricas

```http
GET /api/pricing/metrics
```

---

## 5. Políticas de Preço

### 5.1 Tipos de Política

| Tipo | Descrição |
|------|-----------|
| **MINIMUM_MARGIN** | Margem mínima por produto/categoria |
| **VOLUME_CURVE** | Descontos progressivos por quantidade |
| **DISCOUNT_LIMIT** | Limite de desconto por nível |
| **CREDIT_RESTRICTION** | Bloqueio por crédito |
| **CAMPAIGN** | Campanhas promocionais |

### 5.2 Exemplo de Política

```json
{
  "policy_id": "pol-margin-min-001",
  "policy_name": "Margem Mínima - Categoria A",
  "policy_type": "MINIMUM_MARGIN",
  "conditions": [
    { "field": "product.category", "operator": "eq", "value": "A" }
  ],
  "action": {
    "type": "SET_MARGIN",
    "value": 20.0,
    "params": { "enforcement": "BLOCK_IF_BELOW" }
  }
}
```

---

## 6. Workflows de Exceção

### 6.1 Níveis de Aprovação

| Desconto | Aprovador | Tempo Limite |
|----------|-----------|--------------|
| 5-10% | Gerente (Level 5) | 4 horas |
| 10-15% | Gerente (Level 5) | 4 horas |
| 15-20% | Diretor (Level 6) | 8 horas |
| > 20% | Diretor (Level 6) | 24 horas |

---

## 7. Integração com CRM

### 7.1 Pontos de Integração

| Evento CRM | Chamada Pricing Agent |
|------------|----------------------|
| Adicionar item | `POST /pricing/calculate` |
| Alterar quantidade | `POST /pricing/calculate` |
| Aplicar desconto | `POST /pricing/discount` |
| Converter pedido | `POST /pricing/freeze` |

---

## 8. Métricas e Observabilidade

### 8.1 KPIs

| Métrica | Fórmula | Meta |
|---------|---------|------|
| **Price Integrity Score** | Decisões OK / Total × 100 | > 85% |
| **Discount Drift** | Média(Aplicado - Ideal) | < 3% |
| **Approval Rate** | Aprovadas / Solicitadas × 100 | 60-80% |
| **Approval Pressure Index** | Tentativas / Total × 100 | < 15% |

---

## 9. Segurança e Auditoria

### 9.1 Controle de Acesso

| Endpoint | Nível Mínimo |
|----------|--------------|
| `/pricing/calculate` | 1 |
| `/pricing/exception/decide` | 5 |
| `/pricing/metrics` | 5 |

### 9.2 Retenção

- Eventos: 5 anos
- Métricas: 2 anos
- Logs: 90 dias

---

## 10. Guia de Implementação

### 10.1 Roadmap

| Fase | Semanas | Entregas |
|------|---------|----------|
| **Fundação** | 1-4 | Schemas, calculate, logging |
| **Políticas** | 5-8 | Policy Engine, discount |
| **Exceções** | 9-12 | Workflow, notificações |
| **Freeze** | 13-16 | Price Freeze, métricas |

---

## 📚 Documentação Relacionada

- [Plano de Melhoria 2026](./PLANO_MELHORIA_2026.md)
- [Manual do Agente IA](./MANUAL_AGENTE_IA.md)
- [Manual Técnico PO](./MANUAL_TECNICO_PO.md)

---

**© Rolemak - Sistema de Gestão de Leads**
