# 📊 COMPARATIVO: Plano Evolutivo x Situação Atual

**Data:** 2026-01-19
**Versão Atual:** 1.7.7

---

## 🎯 Resumo Executivo

| Categoria | Planejado | Implementado | Status |
|-----------|-----------|--------------|--------|
| CRM / Lead States | 9 estados | Sistema básico | 🟡 Parcial |
| Qualificação | Score automático | Não implementado | 🔴 Não |
| Memory v2 | Units + Consolidação | Não implementado | 🔴 Não |
| Pricing Agent | Orquestração completa | ✅ Implementado | 🟢 Sim |
| WhatsApp Engine | Estratégias + Templates | Análise básica | 🟡 Parcial |
| Follow-up | Inteligente + Scheduler | Não implementado | 🔴 Não |
| Autoevolução | Hipóteses + Learning | Não implementado | 🔴 Não |
| Policy Engine | Governança completa | ✅ Implementado | 🟢 Sim |

**Progresso Geral:** ~35%

---

## 1️⃣ FUNDAMENTOS DE NEGÓCIO

### ✅ Implementado:
- [x] KPIs básicos (via Analytics V2)
  - Pipeline Service
  - Penetration Service
  - Customer Goals Service
  - Financial Service
- [x] Limites de desconto por nível de vendedor (PolicyEngine)

### ⬜ Não Implementado:
- [ ] Missão oficial documentada no código
- [ ] Métricas específicas de win-rate, tempo de ciclo
- [ ] Limites claros de autonomia do agente
- [ ] Critérios claros de escalação humana

---

## 2️⃣ MODELAGEM CRM (Estados do Lead)

### ✅ Implementado:
- [x] CRUD completo de leads (`lead.repository.js`)
- [x] Campos: `status` (geral)
- [x] Histórico de alterações básico

### ⬜ Não Implementado (do plano):
- [ ] Estados específicos:
  - `NEW_LEAD`
  - `QUALIFYING`
  - `PRICE_REQUESTED`
  - `NEGOTIATING`
  - `WAITING_CUSTOMER`
  - `WAITING_INTERNAL`
  - `WON/LOST`
  - `SNOOZED`
- [ ] Transições válidas entre estados
- [ ] Ações permitidas por estado
- [ ] Motivos obrigatórios para LOST/SNOOZE

**Nota:** O sistema atual usa status simples (novo, aberto, fechado, etc.) sem o nível de granularidade e automação do plano.

---

## 3️⃣ INGESTÃO DE LEADS

### ✅ Implementado:
- [x] WhatsApp (via Superbot)
- [x] Manual (vendedor via frontend)
- [x] ID único de lead
- [x] Normalização básica

### ⬜ Não Implementado:
- [ ] Formulário / Landing integrado
- [ ] Instagram / Social
- [ ] `lead_source` como Memory Unit

---

## 4️⃣ QUALIFICAÇÃO AUTOMÁTICA

### ✅ Implementado:
- [x] Análise de intenção básica (`superbot.service.js`)
  - `INTENT_TYPES`: `PURCHASE_INTENT`, `QUOTE_REQUEST`, `COMPLAINT`, etc.
- [x] Análise de sentimento básica

### ⬜ Não Implementado:
- [ ] Lead Score numérico
- [ ] Thresholds de esforço
- [ ] `intent_signal` como Memory Unit
- [ ] Decisão automática baseada em score

---

## 5️⃣ CSUITE MEMORY v2

### 🔴 Não Implementado:
- [ ] Tabela `ctx_memory_unit`
- [ ] Memory Kinds:
  - `intent_signal`
  - `objection`
  - `pricing_decision`
  - `policy_violation`
  - `preference`
  - `outcome`
- [ ] Salience e TTL
- [ ] LGPD / Redaction
- [ ] Negotiation Summary (Medium Term)
- [ ] Customer Sales Profile (Long Term)
- [ ] Consolidação automática

**Nota:** Essa é a base do agente para aprendizado e contexto - **prioridade crítica**.

---

## 6️⃣ RETRIEVAL ORIENTADO A TAREFA

### 🔴 Não Implementado:
- [ ] Procedure `sp_mem_retrieve(task_code, lead_id)`
- [ ] Pacotes por tarefa:
  - `QUALIFY_LEAD`
  - `REQUEST_PRICE`
  - `NEGOTIATE`
  - `FOLLOW_UP`
  - `HANDOFF_HUMAN`
- [ ] Limite de tokens/payload

---

## 7️⃣ INTEGRAÇÃO COM PRICING AGENT

### ✅ Implementado:
- [x] **PricingAgent** completo (`v2/services/pricing/PricingAgent.js`)
- [x] **PolicyEngine** - Carrega políticas do banco
- [x] **PriceCalculator** - Cálculo de preços
- [x] **RiskClassifier** - Classificação de risco
- [x] **DecisionLogger** - Log de decisões
- [x] **ExceptionHandler** - Tratamento de exceções
- [x] **FreezeManager** - Congelamento de preços

### ⬜ Não Implementado:
- [ ] Contexto do lead no payload (`price_sensitivity`, `urgency`, `history`)
- [ ] Justificativa curta para mensagem WhatsApp

---

## 8️⃣ WHATSAPP STRATEGY ENGINE

### ✅ Implementado:
- [x] Análise de intenção (`analyzeIntentBasic`)
- [x] Análise de sentimento (`analyzeSentimentBasic`)
- [x] Contexto enriquecido (`getEnrichedContext`)
- [x] Vinculação vendedor-telefone
- [x] Notificações de mensagens importantes
- [x] Chatbot básico (`superbot-chatbot.service.js`)

### ⬜ Não Implementado:
- [ ] Estratégias oficiais:
  - `DIRECT_PRICE`
  - `VALUE_FIRST`
  - `SCARCITY`
  - `SOCIAL_PROOF`
  - `CONDITION_ANCHOR`
  - `HUMAN_HANDOFF`
- [ ] Templates por estratégia
- [ ] Variações (texto curto/longo/áudio)
- [ ] Proibição de repetição literal

---

## 9️⃣ FOLLOW-UP INTELIGENTE

### 🔴 Não Implementado:
- [ ] Limite de follow-ups automáticos
- [ ] Intervalos mínimos
- [ ] "Valor novo" em cada follow-up
- [ ] Vinculação a promessa/pendência
- [ ] Scheduler automático

---

## 🔁 10️⃣ AUTOEVOLUÇÃO

### 🔴 Não Implementado:
- [ ] Tabela `agent_hypothesis`
- [ ] Tabela `agent_action_log`
- [ ] Tabela `agent_outcome`
- [ ] Hipóteses testáveis
- [ ] Multi-armed bandit / Q-score
- [ ] Atualização automática de pesos

---

## 11️⃣ ESCALAÇÃO HUMANA

### 🟡 Parcialmente Implementado:
- [x] Notificações para vendedores (`notifications.service.js`)
- [x] Priorização por urgência/sentimento

### ⬜ Não Implementado:
- [ ] Critérios automáticos de escalação
- [ ] Pacote de handoff estruturado:
  - Resumo da negociação
  - Preço validado
  - Objeções
  - Próxima ação sugerida

---

## 12️⃣ GOVERNANÇA E AUDITORIA

### ✅ Implementado:
- [x] **PolicyEngine** - Validação de políticas
- [x] **DecisionLogger** - Log de decisões de preço
- [x] **AuditLog Service** - Log de ações do sistema
- [x] Limites por nível de vendedor

### ⬜ Não Implementado:
- [ ] Trilha de auditoria por lead
- [ ] Rollback de estratégias

---

## 13️⃣ MONITORAMENTO & KPIs

### ✅ Implementado:
- [x] Analytics V2:
  - Pipeline (meta 30K máquinas)
  - Penetração
  - Churn / At-Risk
  - Customer Goals
  - Inventory
  - Financial
- [x] Alertas básicos
- [x] Dashboard vendedor/gerente

### ⬜ Não Implementado:
- [ ] Dashboard específico do Leads-Agent
- [ ] Alertas de queda de conversão
- [ ] Custo por lead

---

## 📊 Diagrama de Cobertura

```
PLANO EVOLUTIVO - COBERTURA ATUAL

[██████████████████████████░░░░░░░░░░░░░░░░░░░░░░] 35%

Legenda:
█ = Implementado
░ = Não Implementado

Detalhamento por área:
├─ CRM/Estados........... [████░░░░░░] 40%
├─ Ingestão.............. [██████░░░░] 60%
├─ Qualificação.......... [███░░░░░░░] 30%
├─ Memory v2............. [░░░░░░░░░░] 0%
├─ Retrieval............. [░░░░░░░░░░] 0%
├─ Pricing Agent......... [█████████░] 90%
├─ WhatsApp Engine....... [████░░░░░░] 40%
├─ Follow-up............. [░░░░░░░░░░] 0%
├─ Autoevolução.......... [░░░░░░░░░░] 0%
├─ Escalação............. [███░░░░░░░] 30%
├─ Governança............ [███████░░░] 70%
└─ Monitoramento......... [██████░░░░] 60%
```

---

## 🎯 Prioridades Recomendadas para Próxima Fase

### Fase 1 - Fundação (Alta Prioridade)
1. **Memory v2** - Base para todo o aprendizado do agente
2. **Estados de Lead** - Transformar CRM acompanhar modelo agêntico
3. **Retrieval por Tarefa** - Dar contexto inteligente ao agente

### Fase 2 - Automação
4. **Qualificação Automática** - Lead Score
5. **Follow-up Scheduler** - Automação de cadência
6. **Estratégias WhatsApp** - Templates e variações

### Fase 3 - Inteligência
7. **Autoevolução** - Hipóteses e learning loop
8. **Escalação Estruturada** - Handoff inteligente
9. **Dashboard do Agente** - KPIs específicos

---

## 📝 Notas Técnicas

### Arquivos-Chave Existentes:
- `backend/src/v2/services/pricing/` - Pricing Agent completo
- `backend/src/services/superbot*.js` - Integração WhatsApp
- `backend/src/services/notifications.service.js` - Notificações
- `backend/src/v2/services/analytics/` - Analytics V2

### Tabelas Existentes:
- `leads` - Leads básicos
- `lead_items` - Itens do lead
- `pricing_policies` - Políticas de preço
- `user_notifications` - Notificações

### Tabelas a Criar:
- `ctx_memory_unit` - Memory Units
- `agent_hypothesis` - Hipóteses
- `agent_action_log` - Log de ações
- `agent_outcome` - Outcomes
- `whatsapp_strategies` - Estratégias
- `whatsapp_templates` - Templates

---

*Documento gerado automaticamente em 2026-01-19*
