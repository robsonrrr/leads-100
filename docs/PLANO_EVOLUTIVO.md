# PLANO DO LEADS-AGENT (CSuite) - Atualizado

**Última Atualização:** 2026-01-19
**Versão Atual do App:** 1.7.6
**Progresso Geral:** ~35%

---

## Missão do Leads-Agent

> **Converter leads em pedidos rentáveis**, no menor tempo possível, respeitando políticas de preço, crédito e canal — aprendendo continuamente com resultados reais.

---

## 1️⃣ Escopo de Atuação (o que ele faz)

O Leads-Agent **não é só chatbot**. Ele é um **orquestrador comercial**.

### Ele é responsável por:

| Função | Status | Arquivo/Local |
|--------|--------|---------------|
| Qualificar leads | 🟡 Básico | `superbot.service.js` - analyzeIntentBasic |
| Detectar intenção real de compra | 🟢 Implementado | `INTENT_TYPES` no superbot.service |
| Orquestrar CRM | 🟡 Parcial | `lead.repository.js` |
| Orquestrar Pricing Agent | 🟢 Implementado | `v2/services/pricing/PricingAgent.js` |
| Orquestrar WhatsApp | 🟡 Básico | `superbot-*.service.js` |
| Decidir escalação para humano | 🟡 Via notificações | `notifications.service.js` |
| Aprender com resultados | 🔴 Não implementado | Requer Memory v2 |

---

## 2️⃣ Arquitetura Funcional (atual vs planejada)

```
                           ARQUITETURA ATUAL
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Inbound (WhatsApp via Superbot)                               │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Leads-Agent                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Superbot Service │  │ Lead Repository │               │   │
│  │  │ ✅ Implementado   │  │ ✅ Implementado  │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Pricing Agent   │  │ Notifications   │               │   │
│  │  │ ✅ Completo      │  │ ✅ Implementado  │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Memory v2       │  │ Learning Loop   │               │   │
│  │  │ 🔴 NÃO EXISTE    │  │ 🔴 NÃO EXISTE    │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Follow-up Sched │  │ WhatsApp Engine │               │   │
│  │  │ 🔴 NÃO EXISTE    │  │ 🟡 PARCIAL       │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Estados do Lead - ATUAL vs PLANEJADO

### Status Atual (sistema legado):
O sistema atual não usa estados agênticos. Leads são tratados como registros simples com status genérico.

### Estados Planejados a Implementar:

| Estado | Descrição | Prioridade |
|--------|-----------|------------|
| `NEW_LEAD` | Lead recém-criado | 🔴 Alta |
| `QUALIFYING` | Em processo de qualificação | 🔴 Alta |
| `PRICE_REQUESTED` | Cliente pediu preço | 🔴 Alta |
| `NEGOTIATING` | Em negociação ativa | 🟡 Média |
| `WAITING_CUSTOMER` | Aguardando resposta do cliente | 🟡 Média |
| `WAITING_INTERNAL` | Aguardando preço/crédito/estoque | 🟡 Média |
| `WON` | Convertido em pedido | 🔴 Alta |
| `LOST` | Perdido (com motivo) | 🔴 Alta |
| `SNOOZED` | Adiado (com data) | 🟢 Baixa |

👉 Cada estado **define qual memória buscar**, **qual ação é permitida** e **qual follow-up é válido**.

---

## 4️⃣ Memory v2 - A IMPLEMENTAR

### Status: 🔴 NÃO IMPLEMENTADO

Esta é a **base do agente** para contexto e aprendizado. Prioridade crítica.

### Memory Units a criar

| Kind | Descrição | Tabela |
|------|-----------|--------|
| `intent_signal` | Sinal de intenção detectado | `ctx_memory_unit` |
| `price_sensitivity` | Sensibilidade a preço | `ctx_memory_unit` |
| `preferred_terms` | Preferência (prazo, frete) | `ctx_memory_unit` |
| `objection` | Objeção registrada | `ctx_memory_unit` |
| `pricing_decision` | Decisão de preço tomada | `ctx_memory_unit` |
| `policy_violation` | Violação de política | `ctx_memory_unit` |
| `outcome` | Resultado (ganhou/perdeu) | `ctx_memory_unit` |

### Consolidações automáticas a implementar:
- **Negotiation Summary (MT)** → "Cliente pediu X, reclamou de Y, aceitou Z"
- **Customer Sales Profile (LT)** → sensível a preço / prazo / prazo de entrega

---

## 5️⃣ Qualificação de Lead - SITUAÇÃO ATUAL

### ✅ Já Implementado:

```javascript
// Em superbot.service.js
export const INTENT_TYPES = {
    GREETING: 'GREETING',
    PURCHASE_INTENT: 'PURCHASE_INTENT',    // ✅ Detecta intenção de compra
    QUOTE_REQUEST: 'QUOTE_REQUEST',        // ✅ Detecta pedido de cotação
    PRODUCT_INQUIRY: 'PRODUCT_INQUIRY',    // ✅ Consulta de produto
    COMPLAINT: 'COMPLAINT',                // ✅ Detecta reclamação
    SUPPORT_REQUEST: 'SUPPORT_REQUEST',
    ORDER_STATUS: 'ORDER_STATUS',
    UNKNOWN: 'UNKNOWN'
};
```

### 🔴 A Implementar:

| Feature | Descrição |
|---------|-----------|
| Lead Score | Pontuação numérica (0-100) |
| Thresholds | Definir limiares de esforço |
| Auto-routing | Decisão automática baseada em score |

---

## 6️⃣ Integração com Pricing Agent - ✅ IMPLEMENTADO

### Componentes Existentes (`v2/services/pricing/`):

| Componente | Arquivo | Status |
|------------|---------|--------|
| **PricingAgent** | `PricingAgent.js` | ✅ Completo |
| **PolicyEngine** | `PolicyEngine.js` | ✅ Completo |
| **PriceCalculator** | `PriceCalculator.js` | ✅ Completo |
| **RiskClassifier** | `RiskClassifier.js` | ✅ Completo |
| **DecisionLogger** | `DecisionLogger.js` | ✅ Completo |
| **ExceptionHandler** | `ExceptionHandler.js` | ✅ Completo |
| **FreezeManager** | `FreezeManager.js` | ✅ Completo |

### Políticas Implementadas (Q1 2026):
- Margem mínima: 20%
- Desconto máximo por nível:
  - Level 1: 5%
  - Level 2: 7%
  - Level 3: 10%
  - Level 4: 12%
  - Level 5: 15%
  - Level 6: 20%

### 🟡 A Melhorar:
- Adicionar contexto do lead no payload (`price_sensitivity`, `urgency`, `history`)
- Gerar justificativa curta para mensagem WhatsApp

---

## 7️⃣ WhatsApp Strategy Engine - SITUAÇÃO ATUAL

### ✅ Já Implementado:

| Feature | Arquivo | Descrição |
|---------|---------|-----------|
| Análise de intenção | `superbot.service.js` | `analyzeIntentBasic()` |
| Análise de sentimento | `superbot.service.js` | `analyzeSentimentBasic()` |
| Contexto enriquecido | `superbot.service.js` | `getEnrichedContext()` |
| Vinculação vendedor | `superbot.repository.js` | `seller_phones` |
| Notificações | `notifications.service.js` | Push para vendedor |
| Chatbot básico | `superbot-chatbot.service.js` | Respostas automáticas |

### 🔴 A Implementar:

| Estratégia | Descrição |
|------------|-----------|
| `DIRECT_PRICE` | Enviar preço direto |
| `VALUE_FIRST` | Destacar valor antes do preço |
| `SCARCITY` | Usar urgência/escassez |
| `SOCIAL_PROOF` | Prova social |
| `CONDITION_ANCHOR` | Âncora de condições |
| `HUMAN_HANDOFF` | Transferir para humano |

Cada estratégia precisa:
- Template base
- Variações (curta, média, áudio)
- Contexto onde funciona melhor

---

## 8️⃣ Follow-up Inteligente - 🔴 NÃO IMPLEMENTADO

### A Criar:

| Regra | Descrição |
|-------|-----------|
| Limite de follow-ups | Máximo N follow-ups automáticos |
| Intervalos mínimos | Não enviar antes de X horas |
| Valor novo obrigatório | Cada follow-up deve agregar valor |
| Vinculação a promessa | Referenciar última promessa/pendência |
| Anti-spam | Nunca repetir mesma mensagem |

Exemplo de follow-up inteligente:
> "Ontem falamos do preço. Hoje envio **opção com prazo melhor** que pode ajudar no caixa."

---

## 9️⃣ Escalação para Humano - SITUAÇÃO ATUAL

### ✅ Já Implementado:
- Notificações push para vendedor
- Priorização por urgência/sentimento
- Badge de notificações não lidas

### 🔴 A Implementar:

| Feature | Descrição |
|---------|-----------|
| Critérios automáticos | Risco, exceção, cliente estratégico |
| Pacote de handoff | Resumo + objeções + próxima ação |
| Regras de timeout | Escalar após N dias sem resposta |

---

## 🔁 10️⃣ Autoevolução - 🔴 NÃO IMPLEMENTADO

### Tabelas a Criar:

```sql
-- Hipóteses testáveis
CREATE TABLE agent_hypothesis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hypothesis_type VARCHAR(50),  -- 'approach', 'timing', 'strategy'
    hypothesis_name VARCHAR(100),
    config JSON,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    q_score DECIMAL(5,3) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Log de ações do agente
CREATE TABLE agent_action_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT,
    hypothesis_id INT,
    action_type VARCHAR(50),
    action_data JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Outcomes para aprendizado
CREATE TABLE agent_outcome (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_log_id INT,
    outcome_type VARCHAR(50),  -- 'response', 'win', 'loss', 'margin'
    outcome_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Learning Loop:
1. Registrar ação + hipótese
2. Observar outcome
3. Atualizar Q-score
4. Rankear estratégias por segmento

---

## 11️⃣ Guardrails (não negociáveis) - ✅ IMPLEMENTADO

### PolicyEngine valida:
- ✅ Preço (margem mínima)
- ✅ Desconto (por nível)
- ✅ Crédito (status do cliente)

### Auditoria:
- ✅ DecisionLogger registra decisões
- ✅ AuditLog Service para ações do sistema

---

## 12️⃣ Roadmap de Implementação ATUALIZADO

### ✅ Fase 0 - Já Concluído (Atual)
- ✅ CRM básico de leads
- ✅ Pricing Agent completo
- ✅ Integração Superbot/WhatsApp
- ✅ Analytics V2 (Pipeline, Penetração, Metas)
- ✅ Notificações em tempo real
- ✅ Policy Engine
- ✅ Filtro de produtos por segmento

### 🔴 Fase 1 - Fundação (Próximos 30 dias)
| Task | Prioridade | Esforço |
|------|------------|---------|
| Memory v2 (tabelas + API) | 🔴 Crítica | 5 dias |
| Estados de Lead agênticos | 🔴 Crítica | 3 dias |
| Retrieval por tarefa | 🔴 Alta | 3 dias |
| Lead Score básico | 🟡 Média | 2 dias |

### 🟡 Fase 2 - Automação (60 dias)
| Task | Prioridade | Esforço |
|------|------------|---------|
| Estratégias WhatsApp | 🔴 Alta | 5 dias |
| Follow-up Scheduler | 🔴 Alta | 5 dias |
| Templates de mensagem | 🟡 Média | 3 dias |
| Escalação estruturada | 🟡 Média | 3 dias |

### 🟢 Fase 3 - Inteligência (90 dias)
| Task | Prioridade | Esforço |
|------|------------|---------|
| Hipóteses e outcomes | 🟡 Média | 5 dias |
| Learning loop (bandit) | 🟡 Média | 5 dias |
| Dashboard do agente | 🟢 Baixa | 3 dias |
| Playbooks auto-atualizados | 🟢 Baixa | 5 dias |

---

## 📊 Métricas de Progresso

```
COBERTURA ATUAL POR ÁREA

├─ CRM/Estados........... [████░░░░░░] 40%  → Fase 1
├─ Ingestão.............. [██████░░░░] 60%  ✓ OK
├─ Qualificação.......... [███░░░░░░░] 30%  → Fase 1
├─ Memory v2............. [░░░░░░░░░░] 0%   → CRÍTICO
├─ Retrieval............. [░░░░░░░░░░] 0%   → Fase 1
├─ Pricing Agent......... [█████████░] 90%  ✓ OK
├─ WhatsApp Engine....... [████░░░░░░] 40%  → Fase 2
├─ Follow-up............. [░░░░░░░░░░] 0%   → Fase 2
├─ Autoevolução.......... [░░░░░░░░░░] 0%   → Fase 3
├─ Escalação............. [███░░░░░░░] 30%  → Fase 2
├─ Governança............ [███████░░░] 70%  ✓ OK
└─ Monitoramento......... [██████░░░░] 60%  ✓ OK

TOTAL: 35%
```

---

## Frase-chave do Leads-Agent

> **Ele não conversa. Ele conduz negociações com memória, política e aprendizado.**

---

## Arquivos-Chave do Projeto

| Área | Arquivos |
|------|----------|
| **Pricing** | `v2/services/pricing/*` |
| **WhatsApp** | `services/superbot*.js` |
| **Notificações** | `services/notifications.service.js` |
| **Analytics** | `v2/services/analytics/*` |
| **Leads** | `repositories/lead.repository.js` |
| **Produtos** | `repositories/product.repository.js` |

---

*Atualizado automaticamente em 2026-01-19 - Versão 1.7.6*
