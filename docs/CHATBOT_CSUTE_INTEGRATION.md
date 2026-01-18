# 🔗 INTEGRAÇÃO CSUTE — CHATBOT DECISÓRIO

## Arquitetura de Integração com Policy Guardian & CSuite

**Versão:** 1.0
**Data:** 20 de Janeiro 2026

---

## 🎯 VISÃO GERAL

O chatbot deixa de ser um **sistema isolado** e se torna um **orquestrador inteligente** que:

- ✅ **Traduz linguagem humana** → intenção estruturada
- ✅ **Chama Policy Guardian** para validação e explicação
- ✅ **Executa ações** via CRM/Pricing Agent
- ✅ **Registra eventos** no CSuite (Context + Governance + Memory)
- ✅ **Fornece respostas** verbalizando risco e política

---

## 📐 ARQUITETURA GERAL

### Fluxo Completo de Decisão

```
[Usuário Humano]
        ↓
   [Chatbot Interface]
        ↓
[Intent + Context Resolver]
        ↓
     [Policy Guardian]
        ↓
[CRM Core / Pricing Agent / IA]
        ↓
   [Decision Event]
        ↓
[CSuite Context + Governance + Memory]
```

### Componentes Integrados

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CHATBOT       │    │  POLICY GUARDIAN │    │     CSUTE       │
│                 │    │                  │    │                 │
│ • NLP Engine    │◄──►│ • Rule Engine     │◄──►│ • Context       │
│ • Intent Router │    │ • Risk Calculator │    │ • Governance    │
│ • Response Gen  │    │ • Policy Explainer│    │ • Memory        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 ▼
                    ┌──────────────────────┐
                    │  BUSINESS SYSTEMS    │
                    │                      │
                    │ • CRM Core           │
                    │ • Pricing Agent      │
                    │ • Stock System       │
                    │ • Analytics Engine   │
                    └──────────────────────┘
```

---

## 🔄 PROTOCOLO DE INTEGRAÇÃO

### 1. Input Processing (Entrada)

**Usuário** → **Chatbot** → **Policy Guardian**

```json
{
  "protocol": "chatbot_decision_request",
  "version": "1.0",
  "timestamp": "2026-01-20T10:30:00Z",
  "tenant_id": "T1",
  "user_id": "U9",
  "role": "vendedor",
  "session_id": "S123",
  "intent": {
    "id": "DISCOUNT_APPROVE_REQUEST",
    "confidence": 0.95,
    "raw_input": "quero dar 12% desconto para cliente ABC",
    "entities": {
      "discount_percent": 12,
      "cliente_id": "ABC123",
      "lead_id": "L456"
    }
  },
  "context": {
    "current_lead": "L456",
    "cliente_history": "VIP_500k_year",
    "user_performance": "125pct_target"
  }
}
```

### 2. Policy Validation (Validação)

**Policy Guardian** → **Chatbot** (Resposta Síncrona)

```json
{
  "protocol": "policy_guardian_response",
  "request_id": "chatbot_decision_request_001",
  "timestamp": "2026-01-20T10:30:01Z",
  "verdict": "REQUIRE_APPROVAL",
  "risk_level": "HIGH",
  "policy_version": "v2026.01",
  "reasons": [
    "DISCOUNT_ABOVE_ROLE_LIMIT",
    "MARGIN_BELOW_MINIMUM"
  ],
  "economic_impact": {
    "original_margin": 25,
    "resulting_margin": 18,
    "gap_to_minimum": 2
  },
  "allowed_next_actions": [
    "REQUEST_APPROVAL",
    "SIMULATE_ALTERNATIVE",
    "CANCEL_REQUEST"
  ],
  "suggested_alternatives": [
    {
      "action": "ADJUST_DISCOUNT",
      "value": 9,
      "margin_result": 22,
      "justification": "Within policy limits"
    },
    {
      "action": "ADD_BUNDLE",
      "bundle_id": "TONER_KIT_2026",
      "additional_value": 1200,
      "margin_result": 21
    }
  ]
}
```

### 3. Action Execution (Execução)

**Chatbot** → **Business Systems** → **CSuite Events**

Se aprovado, executa e registra:

```json
{
  "protocol": "business_action_execution",
  "action_type": "DISCOUNT_APPLICATION",
  "parameters": {
    "lead_id": "L456",
    "discount_percent": 12,
    "justification": "Approved by manager - strategic client",
    "approval_reference": "A551"
  },
  "execution_context": {
    "user_id": "U9",
    "role": "vendedor",
    "policy_version": "v2026.01",
    "risk_level": "HIGH"
  }
}
```

### 4. Event Emission (Registro)

**Business Systems** → **CSuite** (Eventos Assíncronos)

```json
[
  {
    "event_type": "ChatInteractionEvent",
    "event_id": "chat-evt-789",
    "source": "chatbot",
    "data": {
      "interaction_id": "chat-001",
      "user_id": "U9",
      "intent": "DISCOUNT_APPROVE_REQUEST",
      "decision": "APPROVED",
      "risk_level": "HIGH"
    }
  },
  {
    "event_type": "PricingDecisionEvent",
    "event_id": "pricing-evt-790",
    "source": "pricing_agent",
    "data": {
      "lead_id": "L456",
      "original_price": 15000,
      "final_price": 13200,
      "discount_percent": 12,
      "margin_original": 25,
      "margin_final": 18,
      "policy_version": "v2026.01"
    }
  },
  {
    "event_type": "ApprovalEvent",
    "event_id": "approval-evt-791",
    "source": "governance_system",
    "data": {
      "approval_id": "A551",
      "type": "DISCOUNT_EXCEPTION",
      "requester_id": "U9",
      "approver_id": "M15",
      "decision": "APPROVED",
      "justification": "Strategic client retention",
      "economic_impact": {
        "margin_reduction": 7,
        "client_value": 500000
      }
    }
  }
]
```

---

## 🔧 CONTRATOS DE MENSAGEM

### ActionRequest (Solicitação de Ação)

```typescript
interface ActionRequest {
  protocol: "chatbot_decision_request";
  version: string;
  timestamp: Date;
  tenant_id: string;
  user_id: string;
  role: UserRole;
  session_id: string;

  intent: {
    id: IntentId;
    confidence: number;
    raw_input: string;
    entities: Record<string, any>;
  };

  context: {
    current_lead?: string;
    current_customer?: string;
    user_performance?: UserPerformance;
    business_context?: BusinessContext;
  };
}
```

### PolicyResponse (Resposta da Política)

```typescript
interface PolicyResponse {
  protocol: "policy_guardian_response";
  request_id: string;
  timestamp: Date;
  verdict: "ALLOW" | "CONFIRM" | "REQUIRE_APPROVAL" | "BLOCK";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  policy_version: string;
  reasons: PolicyViolationReason[];
  economic_impact: EconomicImpact;
  allowed_next_actions: AllowedAction[];
  suggested_alternatives?: AlternativeAction[];
}
```

### DecisionEvent (Evento de Decisão)

```typescript
interface DecisionEvent {
  event_type: "ChatInteractionEvent" | "PricingDecisionEvent" | "ApprovalEvent";
  event_id: string;
  source: "chatbot" | "pricing_agent" | "governance_system";
  timestamp: Date;
  tenant_id: string;

  data: {
    // Event-specific data
    [key: string]: any;
  };

  metadata: {
    user_id: string;
    role: UserRole;
    session_id: string;
    policy_version: string;
    risk_level: RiskLevel;
  };
}
```

---

## 📊 RESPONSABILIDADES POR COMPONENTE

### Chatbot Responsibilities
- ✅ **Input Processing**: NLP → Intent + Entities
- ✅ **Context Injection**: Usuário + Cliente + Lead atual
- ✅ **Policy Consultation**: Enviar ActionRequest ao Policy Guardian
- ✅ **Action Routing**: Executar ações permitidas
- ✅ **Response Formatting**: Estruturar resposta com risco + política
- ✅ **Event Emission**: Disparar eventos para CSuite

### Policy Guardian Responsibilities
- ✅ **Rule Evaluation**: Validar contra política vigente
- ✅ **Risk Calculation**: Calcular nível de risco econômico
- ✅ **Impact Analysis**: Quantificar impacto na margem
- ✅ **Alternative Generation**: Sugerir opções seguras
- ✅ **Explanation Generation**: Verbalizar violações e razões

### CSuite Responsibilities
- ✅ **Context Storage**: Manter histórico conversacional
- ✅ **Governance Tracking**: Registrar aprovações e exceções
- ✅ **Memory Building**: Aprender padrões de decisão
- ✅ **Analytics Feeding**: Alimentar dashboards e relatórios
- ✅ **Audit Trail**: Prover rastreabilidade completa

---

## 🚦 FLUXOS POR TIPO DE DECISÃO

### Fluxo 1: Ação LOW Risk (Permitida)

```
Usuário → Chatbot → Policy Guardian → [ALLOW] → Execute → Success Response
                                      ↓
                                   CSuite Events
```

### Fluxo 2: Ação MEDIUM Risk (Confirmação)

```
Usuário → Chatbot → Policy Guardian → [CONFIRM] → Ask Confirmation → Execute → Success Response
                                      ↓
                                   CSuite Events
```

### Fluxo 3: Ação HIGH Risk (Aprovação)

```
Usuário → Chatbot → Policy Guardian → [REQUIRE_APPROVAL] → Create Approval → Notify Manager
                                      ↓
                                   Manager Review → Approve/Reject → Execute/Deny → Response
                                      ↓
                                   CSuite Events
```

### Fluxo 4: Ação CRITICAL (Bloqueada)

```
Usuário → Chatbot → Policy Guardian → [BLOCK] → Block Response + Alternatives
                                      ↓
                                   CSuite Events (Audit Only)
```

---

## 🔄 CICLO DE APRENDIZADO

### 1. Data Collection (Coleta)
- Todas as interações → ChatInteractionEvent
- Todas as decisões → DecisionEvent
- Todos os riscos → RiskAnalysisEvent

### 2. Pattern Recognition (Reconhecimento)
- IA identifica padrões de risco por perfil
- Agrupa decisões similares por contexto
- Detecta comportamentos fora do padrão

### 3. Model Enhancement (Melhoria)
- Policy Guardian aprende com aprovações/rejeições
- Chatbot adapta explicações baseadas em feedback
- CSuite Memory constrói perfis de decisão

### 4. Continuous Optimization (Otimização)
- Thresholds de risco recalibrados automaticamente
- Sugestões de política otimizadas
- Interfaces adaptadas por padrão de uso

---

## 📊 MÉTRICAS DE INTEGRAÇÃO

### Performance Técnica
- **Latência Total**: < 2s para decisões LOW/MEDIUM
- **Disponibilidade**: 99.9% uptime Policy Guardian
- **Precisão**: > 95% acurácia Policy Guardian
- **Throughput**: 1000+ decisões/minuto

### Qualidade de Decisão
- **Policy Compliance**: > 98% aderência automática
- **Risk Accuracy**: > 92% precisão de classificação
- **Approval Efficiency**: < 4h tempo médio aprovação
- **User Satisfaction**: > 4.5/5 em todos perfis

### Impacto de Negócio
- **Margin Protection**: +15% margem protegida vs baseline
- **Decision Speed**: +200% velocidade de decisão crítica
- **Audit Coverage**: 100% decisões rastreadas
- **Exception Reduction**: -25% exceções recorrentes

---

## 🔧 IMPLEMENTAÇÃO PRÁTICA

### Componentes Técnicos Necessários

```typescript
// Core Interfaces
interface ChatbotCore {
  processIntent(input: string): Promise<IntentData>
  consultPolicy(request: ActionRequest): Promise<PolicyResponse>
  executeAction(action: ActionData): Promise<ExecutionResult>
  formatResponse(decision: DecisionData): StructuredResponse
  emitEvents(events: DecisionEvent[]): Promise<void>
}

interface PolicyGuardian {
  evaluate(request: ActionRequest): Promise<PolicyResponse>
  calculateRisk(action: ActionData, context: ContextData): RiskLevel
  explainViolation(violation: PolicyViolation): ExplanationData
  suggestAlternatives(action: ActionData): AlternativeAction[]
}

interface CSuiteIntegration {
  storeContext(event: ChatInteractionEvent): Promise<void>
  trackGovernance(event: ApprovalEvent): Promise<void>
  updateMemory(pattern: DecisionPattern): Promise<void>
  queryAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult>
}
```

### Configuração de Integração

```yaml
integration:
  policy_guardian:
    endpoint: "https://policy-guardian.csuite.internal/api/v1/evaluate"
    timeout_ms: 1000
    retry_count: 3
    circuit_breaker: true

  csuite_events:
    context_sink: "csuite_context.ctx_event"
    governance_sink: "csuite_governance.approval_events"
    pricing_sink: "csuite_pricing.pricing_decision_events"
    batch_size: 10
    flush_interval_ms: 5000

  business_systems:
    crm_core: "crm.internal/api/v2"
    pricing_agent: "pricing.internal/api/v1"
    stock_system: "stock.internal/api/v1"
```

---

## 🎯 PRÓXIMOS PASSOS DE IMPLEMENTAÇÃO

### Fase 1: Core Integration (2 semanas)
- [ ] Implementar interfaces ActionRequest/PolicyResponse
- [ ] Integrar Policy Guardian endpoint
- [ ] Configurar event emission para CSuite
- [ ] Testes unitários de integração

### Fase 2: Business Logic (3 semanas)
- [ ] Implementar lógica de risco por perfil
- [ ] Criar fluxo de aprovações assíncronas
- [ ] Desenvolver templates de resposta
- [ ] Integração com CRM/Pricing existentes

### Fase 3: Learning & Optimization (2 semanas)
- [ ] Implementar ciclo de aprendizado
- [ ] Otimização de performance
- [ ] A/B testing de respostas
- [ ] Dashboard de integração

### Fase 4: Production & Monitoring (1 semana)
- [ ] Deploy em produção
- [ ] Configuração de monitoring
- [ ] Documentação completa
- [ ] Plano de rollback

---

## 🚨 CONTINGÊNCIAS

### Policy Guardian Indisponível
- **Fallback**: Modo "read-only" - só consultas, sem ações
- **Comunicação**: Notificar usuários sobre modo degradado
- **Recuperação**: Cache local de regras críticas

### CSuite Events com Falha
- **Fallback**: Persistir localmente e retry assíncrono
- **Queue**: RabbitMQ para garantir entrega eventual
- **Monitoring**: Alertas quando queue > threshold

### Latência Excessiva
- **Circuit Breaker**: Desabilitar integrações problemáticas
- **Caching**: Cache de decisões similares (TTL curto)
- **Optimization**: Compressão de payloads

---

**© Rolemak - Sistema de Gestão de Leads**  
*Integração CSuite - Chatbot Decisório v1.0*