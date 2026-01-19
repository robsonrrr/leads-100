# ✅ CHECKLIST DE IMPLEMENTAÇÃO — LEADS-AGENT (CSuite)

**Última Atualização:** 2026-01-19
**Versão Atual:** 1.7.7

Use isso como **lista de corte**: se algo não estiver marcado, o agente **não está pronto para rodar em produção**.

---

## 📊 Progresso Geral: 35%

```
[██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 35%
```

---

## 1️⃣ FUNDAMENTOS DE NEGÓCIO (obrigatório)

✅ Definir **missão oficial do Leads-Agent**
> "Converter leads em pedidos rentáveis, no menor tempo possível"

⬜ Definir **objetivo mensurável** (ex.: conversão, margem, tempo de ciclo)

✅ Definir **KPIs primários** (via Analytics V2)
* ✅ Win-rate → `PipelineService`
* ✅ Margem média → `FinancialService`
* ⬜ Tempo até preço
* ⬜ Tempo até fechamento
* ✅ Taxa de escalação humana → via notificações

✅ Definir **limites de autonomia**
* ✅ Pode negociar preço? até quanto? → `PolicyEngine` (5-20% por nível)
* ⬜ Pode oferecer prazo? até quanto?
* ⬜ Pode insistir quantas vezes?

⬜ Definir **quando o humano entra** (critérios claros)

---

## 2️⃣ MODELAGEM DE CRM (estado = decisão)

⬜ Criar **estados oficiais do lead**
* ⬜ NEW_LEAD
* ⬜ QUALIFYING
* ⬜ PRICE_REQUESTED
* ⬜ NEGOTIATING
* ⬜ WAITING_CUSTOMER
* ⬜ WAITING_INTERNAL
* ⬜ WON / LOST
* ⬜ SNOOZED

⬜ Definir **ações permitidas por estado**
⬜ Definir **transições válidas**
⬜ Criar **motivos obrigatórios para LOST / SNOOZE**

**Status:** 🔴 Lead states não implementados - sistema usa status genérico

---

## 3️⃣ INGESTÃO DE LEADS (entrada)

✅ Conectar canais:
* ✅ WhatsApp (via Superbot)
* ⬜ Formulário / Landing
* ⬜ Instagram / Social
* ✅ Manual (vendedor)

✅ Normalizar lead (nome, contato, produto, origem)
✅ Criar **Lead ID único**
⬜ Registrar `lead_source` como Memory Unit

**Status:** 🟢 60% implementado

---

## 4️⃣ QUALIFICAÇÃO AUTOMÁTICA

✅ Definir **sinais de intenção** (`superbot.service.js`)
* ✅ Produto citado (`PRODUCT_INQUIRY`)
* ⬜ Quantidade
* ⬜ Prazo/Urgência
* ⬜ Concorrente
* ✅ Histórico prévio (cliente vinculado)

⬜ Criar **Lead Score** (simples e auditável)
⬜ Definir **thresholds de esforço**
⬜ Registrar `intent_signal` em memória

**Implementado:**
```javascript
// INTENT_TYPES em superbot.service.js
PURCHASE_INTENT, QUOTE_REQUEST, PRODUCT_INQUIRY, COMPLAINT, etc.
```

**Status:** 🟡 30% - Detecção básica existe, score não

---

## 5️⃣ CSUITE MEMORY v2 (base do agente)

### Memory Units
⬜ Criar tabela `ctx_memory_unit`
⬜ Definir `memory_kind` oficiais:
* ⬜ intent_signal
* ⬜ objection
* ⬜ pricing_decision
* ⬜ policy_violation
* ⬜ preference
* ⬜ outcome

⬜ Definir `salience` e `ttl` padrão
⬜ Garantir **LGPD / redaction**

### Consolidação
⬜ Criar **Negotiation Summary (MT)**
⬜ Criar **Customer Sales Profile (LT)**
⬜ Automatizar consolidação por volume/tempo

**Status:** 🔴 0% - CRÍTICO - Base do agente não existe

---

## 6️⃣ RETRIEVAL ORIENTADO A TAREFA

⬜ Criar `sp_mem_retrieve(task_code, lead_id)`
⬜ Definir pacotes por tarefa:
* ⬜ QUALIFY_LEAD
* ⬜ REQUEST_PRICE
* ⬜ NEGOTIATE
* ⬜ FOLLOW_UP
* ⬜ HANDOFF_HUMAN

⬜ Garantir **limite de tokens / payload**

**Status:** 🔴 0% - Depende da Memory v2

---

## 7️⃣ INTEGRAÇÃO COM PRICING AGENT

✅ Definir **gatilhos para chamar pricing**
✅ Definir payload mínimo:
* ✅ SKU
* ✅ Quantidade
* ✅ Cliente
* ⬜ Contexto do lead (`price_sensitivity`, `urgency`)

✅ Receber:
* ✅ preço
* ✅ margem
* ✅ risco
* ⬜ justificativa curta

✅ Validar com Policy Guardian (`PolicyEngine.js`)
✅ Registrar decisão como `DecisionLogger`

**Arquivos Implementados:**
```
v2/services/pricing/
├── PricingAgent.js     ✅
├── PolicyEngine.js     ✅
├── PriceCalculator.js  ✅
├── RiskClassifier.js   ✅
├── DecisionLogger.js   ✅
├── ExceptionHandler.js ✅
└── FreezeManager.js    ✅
```

**Status:** 🟢 90% - Completo, falta contexto do lead

---

## 8️⃣ WHATSAPP STRATEGY ENGINE

⬜ Criar **estratégias oficiais**
* ⬜ DIRECT_PRICE
* ⬜ VALUE_FIRST
* ⬜ SCARCITY
* ⬜ SOCIAL_PROOF
* ⬜ CONDITION_ANCHOR
* ⬜ HUMAN_HANDOFF

⬜ Criar **templates por estratégia**
⬜ Criar variações (texto curto / longo / áudio)
⬜ Proibir repetição literal
✅ Logar toda mensagem enviada (`superbot.messages`)

**Implementado:**
```javascript
// superbot.service.js
✅ analyzeIntentBasic()
✅ analyzeSentimentBasic()
✅ getEnrichedContext()
✅ Vinculação vendedor-telefone
```

**Status:** 🟡 40% - Análise OK, estratégias não

---

## 9️⃣ FOLLOW-UP INTELIGENTE

⬜ Definir **limite de follow-ups automáticos**
⬜ Definir **intervalos mínimos**
⬜ Exigir "valor novo" em cada follow-up
⬜ Vincular follow-up a:
* ⬜ promessa
* ⬜ pendência
* ⬜ decisão anterior

⬜ Registrar follow-up como Memory Unit

**Status:** 🔴 0% - Não implementado

---

## 🔁 10️⃣ AUTOEVOLUÇÃO (mínimo viável)

⬜ Criar tabela `agent_hypothesis`
⬜ Criar tabela `agent_action_log`
⬜ Criar tabela `agent_outcome`

⬜ Definir **hipóteses testáveis**
* ⬜ abordagem
* ⬜ timing
* ⬜ estratégia

⬜ Definir **outcomes**
* ⬜ resposta
* ⬜ win/loss
* ⬜ margem
* ⬜ tempo de ciclo

⬜ Criar ranking simples (Q-score / bandit)
⬜ Atualizar pesos com base em outcome

**Status:** 🔴 0% - Não implementado

---

## 11️⃣ ESCALAÇÃO HUMANA

✅ Definir critérios de escalação (parcial):
* ✅ risco (via sentiment)
* ⬜ exceção
* ⬜ cliente estratégico
* ⬜ conflito

⬜ Criar **pacote de handoff**:
* ⬜ resumo da negociação
* ⬜ preço validado
* ⬜ objeções
* ⬜ próxima ação sugerida

**Implementado:**
```javascript
// notifications.service.js
✅ notifyWhatsAppMessage() - prioriza por sentiment/intent
✅ Push notifications para vendedor
```

**Status:** 🟡 30% - Notificação OK, handoff estruturado não

---

## 12️⃣ GOVERNANÇA E AUDITORIA

✅ Integrar Policy Guardian (`PolicyEngine.js`)
✅ Logar toda decisão relevante (`DecisionLogger.js`)
✅ Registrar:
* ✅ contexto usado
* ✅ regra aplicada
* ⬜ outcome posterior

⬜ Criar trilha de auditoria por lead
⬜ Criar rollback de estratégias

**Implementado:**
```javascript
// services/auditLog.service.js
✅ logLogin()
✅ logEvent()
// v2/services/pricing/DecisionLogger.js
✅ log pricing decisions
```

**Status:** 🟢 70% - Governança OK, auditoria por lead não

---

## 13️⃣ MONITORAMENTO & KPIs

✅ Dashboard Leads-Agent (via Analytics V2):
* ✅ conversão por etapa → `PipelineService`
* ✅ margem por lead → `FinancialService`
* ⬜ tempo médio de ciclo
* ⬜ escalations
* ⬜ custo por lead

✅ Alertas (parcial):
* ⬜ queda de conversão
* ⬜ aumento de override/reject
* ⬜ follow-up excessivo

**Implementado:**
```
v2/services/analytics/
├── PipelineService.js      ✅
├── PenetrationService.js   ✅
├── ChurnService.js         ✅
├── CustomerGoalsService.js ✅
├── FinancialService.js     ✅
├── InventoryService.js     ✅
└── RecommendationService.js ✅
```

**Status:** 🟢 60% - Analytics OK, alertas específicos não

---

## 14️⃣ TESTES ANTES DE PRODUÇÃO

⬜ Testar:
* ⬜ lead simples
* ⬜ lead complexo
* ⬜ lead perdido
* ⬜ lead estratégico

⬜ Simular:
* ⬜ falha de pricing
* ⬜ política violada
* ⬜ silêncio do cliente

⬜ Validar:
* ⬜ mensagens
* ⬜ decisões
* ⬜ auditoria

**Status:** 🔴 Testes de agente não implementados

---

## 15️⃣ GO-LIVE

⬜ Ativar autonomia em **nível assistido**
⬜ Monitorar primeiros 14 dias
⬜ Congelar autoevolução no início
⬜ Liberar aprendizado progressivamente

**Status:** 🔴 Agente não está em produção autônoma

---

## 📊 RESUMO POR STATUS

| Status | Quantidade | Porcentagem |
|--------|------------|-------------|
| ✅ Implementado | ~35 itens | 35% |
| 🟡 Parcial | ~15 itens | 15% |
| ⬜ Não Implementado | ~50 itens | 50% |

---

## 🎯 PRÓXIMOS PASSOS PRIORIZADOS

### Semana 1-2: Memory v2 (CRÍTICO)
```sql
CREATE TABLE ctx_memory_unit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50),  -- 'lead', 'customer', 'seller'
    entity_id INT,
    memory_kind VARCHAR(50),
    content TEXT,
    salience DECIMAL(3,2) DEFAULT 1.0,
    ttl_days INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_kind (memory_kind)
);
```

### Semana 3-4: Lead States
- Criar coluna `agent_state` na tabela leads
- Implementar transições de estado
- Criar triggers para ações automáticas

### Semana 5-6: Follow-up Scheduler
- Tabela de follow-ups agendados
- Worker para processar fila
- Regras de anti-spam

---

## 🧠 REGRA DE OURO

> **Se não gera outcome, não aprende.
> Se não tem política, não decide.
> Se não tem memória, repete erro.**

---

*Atualizado automaticamente em 2026-01-19 - Versão 1.7.7*
