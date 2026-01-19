# 📋 PLANO DAILY TASKS (Lista do Dia do Vendedor)

## Sistema de Tarefas Diárias OODA-driven — Leads Agent

**Versão:** 1.2 (Patch B + C)  
**Criado em:** 18 de Janeiro 2026  
**Atualizado:** 18 de Janeiro 2026  
**Status:** Planejamento 📝

---

## 🆕 Changelog

### v1.2 (Patch C)

| Componente | Mudança |
|------------|---------|
| **FKs** | Todas as FKs agora usam prefixo `staging.` (cross-schema safety) |
| **event_ts** | Documentação clara de `signal_ts` como base para SLA |
| **Scheduler** | Decisão operacional: **on-login with cache** (default) |
| **RBAC** | Regras explícitas: seller vê só suas tasks, gerente (level≥4) vê equipe |

### v1.1 (Patch B)

| Componente | Mudança |
|------------|---------|
| **Observability** | Novas tabelas `sales_raw_signal` e `sales_signal_feature` |
| **Orientation** | Campos `orientation_ver`, `orientation_sources_json`, `computed_at` |
| **Task** | Status `BACKLOG`, campo `dedup_key`, `outcome_reason_code` |
| **Taxonomia** | Nova tabela `sales_outcome_reason` com 13 reasons padronizados |
| **Rules Schema** | Formato padronizado para `conditions_json` e `scoring_json` |

---

## ⚙️ Decisões Operacionais (Hard Rules)

### 1. Scheduler: On-Login with Cache (Default)

```
Estratégia escolhida: Gerar tasks no primeiro acesso do dia, com cache de 24h.

Fluxo:
1. Vendedor faz login
2. Sistema verifica se já existe run para (seller_id, run_date = hoje)
3. Se NÃO existe: 
   - Dispara TaskEngine.generate(sellerId)
   - Cria run no banco
   - Retorna tasks geradas
4. Se existe:
   - Retorna tasks do cache (sales_task)
   
Vantagens:
- Evita pico às 08:00
- Vendedor vê tasks imediatamente
- Idempotente por design (uq_run_seller_date)

Alternativa (futuro):
- Cron job às 06:00 gerando para todos (worker queue)
```

### 2. RBAC: Quem Vê o Quê

| Level | Papel | Acesso |
|-------|-------|--------|
| 1-3 | Vendedor | Apenas suas próprias tasks |
| 4 | Supervisor | Suas tasks + equipe (team_id) |
| 5-6 | Gerente/Admin | Todas as tasks + admin de regras |

```javascript
// Implementar no repository/controller:
const getTasksFilter = (user) => {
  if (user.level >= 5) return {}; // sem filtro
  if (user.level === 4) return { team_id: user.team_id }; // equipe
  return { seller_id: user.id }; // só próprias
};
```

### 3. Outcome Obrigatório

```
Ao fechar task (status = DONE):
- outcome_code: OBRIGATÓRIO (WON/LOST/NO_RESPONSE/ESCALATED/DEFERRED)
- outcome_reason_code: OBRIGATÓRIO se LOST ou ESCALATED
- outcome_note: OPCIONAL (recomendado)

UI deve bloquear "Confirmar" se campos obrigatórios estiverem vazios.
```

### 4. SLA Calculation

```
sla_due_at = signal_ts + sla_hours (da regra)

Exemplo:
- Regra REPLY_WHATSAPP: sla_hours = 2
- Última mensagem do cliente: 2026-01-18 10:30:00
- signal_ts = 2026-01-18 10:30:00
- sla_due_at = 2026-01-18 12:30:00

NUNCA usar created_at da task para SLA.
```

---

## 🎯 Objetivo

> **Criar uma lista diária de tarefas priorizadas para cada vendedor**, gerada automaticamente com base em dados reais (leads, conversas WhatsApp, orçamentos, clientes em risco), seguindo a metodologia OODA Loop (Observe → Orient → Decide → Act).

**Benefícios esperados:**
- ✅ Vendedor sabe exatamente o que fazer ao começar o dia
- ✅ Priorização inteligente (não desperdiça tempo em tarefas erradas)
- ✅ Reduz leads "esquecidos" e SLA estourado
- ✅ Aumenta conversão sem queimar margem
- ✅ **Telemetria auditável** para melhoria contínua do sistema
- ✅ **Observabilidade** completa (debug de "por que essa task nasceu?")

---

## 📊 Análise do Estado Atual

### ✅ O que JÁ EXISTE no Leads Agent (pode ser reaproveitado):

| Componente | Descrição | Localização |
|------------|-----------|-------------|
| **ChurnService** | Calcula risco de churn por cliente | `backend/src/v2/services/analytics/ChurnService.js` |
| **PipelineService** | Métricas de pipeline, alertas, ranking | `backend/src/v2/services/analytics/PipelineService.js` |
| **PenetrationService** | Clientes inativos, penetração mensal | `backend/src/v2/services/analytics/PenetrationService.js` |
| **CustomerGoalsService** | Metas por cliente, atingimento | `backend/src/v2/services/analytics/CustomerGoalsService.js` |
| **ForecastService** | Previsão de vendas por IA | `backend/src/v2/services/analytics/ForecastService.js` |
| **RecommendationService** | Sugestão de produtos | `backend/src/v2/services/analytics/RecommendationService.js` |
| **Lead Repository** | CRUD de leads com filtros | `backend/src/repositories/lead.repository.js` |
| **Superbot (WhatsApp)** | Mensagens, histórico de conversas | `backend/src/services/superbot*.js` |
| **Alerts Service** | Sistema de alertas existente | `backend/src/services/alert.service.js` |
| **Notifications Service** | Push/Toast notifications | `backend/src/services/notifications.service.js` |
| **Cache Service** | Redis cache | `backend/src/services/cache.service.js` |
| **AuditLog Service** | Log de ações (telemetria) | `backend/src/services/auditLog.service.js` |

### ✅ Frontend já tem:

| Componente | Descrição |
|------------|-----------|
| **DashboardPage** | Dashboard customizável com widgets |
| **FollowUpsWidget** | Lista de follow-ups |
| **AlertsWidget** | Alertas operacionais |
| **AtRiskCustomers** | Clientes em risco |
| **GoalProgressWidget** | Progresso de metas |
| **PipelineWidget** | Pipeline de vendas |

### ⚠️ O que FALTA implementar:

| Componente | Descrição |
|------------|-----------|
| **Task Engine** | Motor de geração de tarefas diárias (OODA completo) |
| **Raw Signal Collector** | Coleta e dedup de sinais brutos (black box) |
| **Feature Calculator** | Normalização de sinais em features |
| **Orientation Service** | Snapshots versionados com proveniência |
| **Rules Engine** | Motor de regras com schema padronizado |
| **Daily Task Page** | Página dedicada para lista do dia |
| **Outcome Dialog** | UI para fechar tasks com reason codes |
| **Guardrails** | Políticas de proteção (sem desconto, etc) |

---

## 🏗️ Arquitetura Proposta v1.1 (com Observability)

### Fluxo OODA Completo

```
┌──────────────────────────────────────────────────────────────┐
│                    SCHEDULER (Diário 08:00)                   │
│         ou API /api/v2/tasks/generate (on-demand)             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. OBSERVE: Coletar Sinais Brutos                             │
│ ─────────────────────────────────                             │
│ Saída: sales_raw_signal (black box, dedup por hash)           │
│ ───────────────────────────────────────────────               │
│ • CRM: Leads abertos (Lead Repository)                        │
│ • WHATSAPP: Mensagens não respondidas (Superbot)              │
│ • ERP: Orçamentos (staging.staging_queries)                   │
│ • AGENT: Recomendações de IA                                  │
│ • CHURN: Scores de churn (ChurnService)                       │
│ • GOAL: Metas (CustomerGoalsService)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. NORMALIZE: Calcular Features                               │
│ ───────────────────────────────                               │
│ Saída: sales_signal_feature (features padronizadas)           │
│ ───────────────────────────────────────────────               │
│ Feature keys fixas (enum):                                    │
│ • INBOUND_UNREPLIED_HOURS, LEAD_AGE_DAYS                      │
│ • QUOTE_AGE_DAYS, CHURN_RISK_SCORE                            │
│ • GOAL_PROGRESS_PCT, DAYS_INACTIVE                            │
│ • AI_RECOMMENDATION_CONFIDENCE, etc.                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. ORIENT: Contexto do Cliente (Orientation Snapshot)         │
│ ──────────────────────────────────────────────────            │
│ Saída: sales_orientation_snapshot (versionado + sources)      │
│ ───────────────────────────────────────────────               │
│ orientation_json:                                             │
│ {                                                             │
│   "client_mode": "strategic",                                 │
│   "urgency": "high",                                          │
│   "price_sensitivity": "medium",                              │
│   "churn_risk": 0.72,                                         │
│   "goal_progress": 45.5                                       │
│ }                                                             │
│ orientation_sources_json:                                     │
│ {                                                             │
│   "features": ["CHURN_RISK_SCORE","GOAL_PROGRESS_PCT"],       │
│   "signals": ["CHURN","GOAL"],                                │
│   "service_versions": {"ChurnService":"1.0"}                  │
│ }                                                             │
│ orientation_ver: 1 (versão do modelo/heurística)              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. DECIDE: Gerar Tarefas com Regras                           │
│ ────────────────────────────────                              │
│ Entrada: features + orientation + sales_task_rule             │
│ Saída: candidatos de tasks com score e "why"                  │
│ ───────────────────────────────────────────────               │
│ Cada task gerada carrega em recommended_json:                 │
│ {                                                             │
│   "why": ["INBOUND_UNREPLIED_HOURS>=1","churn_risk>=0.5"],    │
│   "rule_id": 1,                                               │
│   "signals": ["WHATSAPP_INBOUND"],                            │
│   "features": {"INBOUND_UNREPLIED_HOURS": 3.2}                │
│ }                                                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. GUARDRAILS: Filtrar, Proteger e Backlog                    │
│ ──────────────────────────────────────────                    │
│ • Max 3 CRITICAL + 5 OPPORTUNITY + 3 HYGIENE (OPEN)           │
│ • Overflow → status BACKLOG (não perde sinal)                 │
│ • Dedup por dedup_key (idempotência)                          │
│ • guardrail_json: { do_not, requires, escalate_to }           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. ACT: Publicar Lista do Dia                                 │
│ ──────────────────────────                                    │
│ • Salvar no banco (sales_task com dedup_key)                  │
│ • Notificar vendedor (push/app)                               │
│ • Disponibilizar no Dashboard (widget + página)               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. TELEMETRY: Feedback Loop                                   │
│ ────────────────────────                                      │
│ • sales_task_action_log (toda ação logada)                    │
│ • outcome_code: WON / LOST / NO_RESPONSE / ESCALATED          │
│ • outcome_reason_code: PRICE / DEADLINE / NO_STOCK / etc.     │
│ • vw_sales_rule_drift: detecta regras perdendo performance    │
│ • vw_sales_outcome_analysis: análise de outcomes              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos (Novos)

### Backend

```
backend/src/
├── v2/
│   ├── controllers/
│   │   └── tasks.controller.js          # NOVO - Endpoints de tasks
│   ├── routes/
│   │   └── tasks.routes.js              # NOVO - Rotas /api/v2/tasks
│   ├── services/
│   │   └── tasks/
│   │       ├── TaskEngine.js            # NOVO - Orquestrador OODA
│   │       ├── SignalCollector.js       # NOVO - OBSERVE (raw signals)
│   │       ├── FeatureCalculator.js     # NOVO - NORMALIZE (features)
│   │       ├── OrientationService.js    # NOVO - ORIENT (snapshots)
│   │       ├── RulesEngine.js           # NOVO - DECIDE (regras)
│   │       └── Guardrails.js            # NOVO - Limites + BACKLOG
│   └── repositories/
│       └── tasks.repository.js          # NOVO - CRUD de tasks
├── migrations/
│   └── create_sales_tasks.sql           # ATUALIZADO v1.1 (Patch B)
```

### Frontend

```
frontend/src/
├── pages/
│   └── DailyTasksPage.jsx               # NOVO - Página principal
├── components/
│   ├── TaskCard.jsx                     # NOVO - Card de tarefa com "why"
│   ├── TaskBuckets.jsx                  # NOVO - Abas CRITICAL/OPP/HYGIENE
│   ├── TaskOutcomeDialog.jsx            # NOVO - Outcome + reason codes
│   ├── GuardrailChips.jsx               # NOVO - Chips de do_not/requires
│   └── DailyTasksWidget.jsx             # NOVO - Widget para Dashboard
├── services/
│   └── tasks.service.js                 # NOVO - API client
```

---

## 🗄️ DDL v1.1 - Modelo de Dados Completo

> Arquivo: `backend/src/migrations/create_sales_tasks.sql`

### Tabelas (8 tabelas)

| Tabela | Propósito |
|--------|-----------|
| `sales_task_run` | Um run por vendedor/dia |
| `sales_raw_signal` | **OBSERVE**: sinais brutos com dedup |
| `sales_signal_feature` | **NORMALIZE**: features calculadas |
| `sales_orientation_snapshot` | **ORIENT**: contexto versionado |
| `sales_task_rule` | Regras configuráveis |
| `sales_outcome_reason` | Taxonomia de reasons |
| `sales_task` | Tasks finais (com BACKLOG) |
| `sales_task_action_log` | Telemetria de ações |

### Views (6 views)

| View | Propósito |
|------|-----------|
| `vw_sales_tasks_today` | Lista do dia (exceto BACKLOG) |
| `vw_sales_task_sla_breaches` | SLA estourado |
| `vw_sales_task_performance` | Performance 14d |
| `vw_sales_task_backlog` | Overflow para calibração |
| `vw_sales_outcome_analysis` | Análise de outcomes |
| `vw_sales_rule_drift` | Detecção de drift por regra |

---

## 📊 Feature Keys Suportadas

> Conjunto inicial de feature keys (enum) para o motor de regras.

### WHATSAPP
| Key | Descrição |
|-----|-----------|
| `INBOUND_UNREPLIED_HOURS` | Horas desde última msg do cliente sem resposta |
| `INBOUND_UNREPLIED_COUNT` | Qtd de mensagens não respondidas |

### LEADS
| Key | Descrição |
|-----|-----------|
| `LEAD_AGE_DAYS` | Dias desde criação do lead |
| `LEAD_IS_HOT` | 1 se hot, 0 caso contrário |
| `LEAD_TOTAL_VALUE` | Valor total do lead |

### QUOTES
| Key | Descrição |
|-----|-----------|
| `QUOTE_AGE_DAYS` | Dias desde criação |
| `QUOTE_TOTAL_VALUE` | Valor total |

### GOALS
| Key | Descrição |
|-----|-----------|
| `GOAL_PROGRESS_PCT` | Progresso da meta em % |
| `GOAL_VALUE` | Valor absoluto da meta |

### CUSTOMER
| Key | Descrição |
|-----|-----------|
| `CHURN_RISK_SCORE` | Score de churn (0-1) |
| `DAYS_INACTIVE` | Dias desde última compra |
| `LAST_ORDER_VALUE` | Valor da última compra |
| `DAYS_SINCE_CONTEXT_UPDATE` | Dias desde última atualização |

### AI
| Key | Descrição |
|-----|-----------|
| `AI_RECOMMENDATION_CONFIDENCE` | Confiança da recomendação |

---

## 📋 Outcome Reason Codes (Taxonomia)

| Code | Label | Uso |
|------|-------|-----|
| `PRICE` | Preço | LOST |
| `DEADLINE` | Prazo | LOST |
| `NO_STOCK` | Sem estoque | LOST, DEFERRED |
| `CREDIT` | Crédito | LOST, ESCALATED |
| `SPEC` | Especificação | LOST |
| `COMPETITOR` | Concorrência | LOST |
| `NO_REPLY` | Sem resposta | NO_RESPONSE |
| `CHANNEL` | Canal | ESCALATED |
| `APPROVED` | Aprovado | WON |
| `UPSELL` | Upsell | WON |
| `REPEAT` | Recompra | WON |
| `WAITING` | Aguardando | DEFERRED |
| `OTHER` | Outro | Todos |

---

## 📋 Schema Padronizado para Regras

### conditions_json

```json
{
  "requires_any_feature": ["INBOUND_UNREPLIED_HOURS", "LEAD_AGE_DAYS"],
  "feature_min": {"INBOUND_UNREPLIED_HOURS": 1},
  "feature_max": {"LEAD_AGE_DAYS": 7},
  "requires_orient": [
    {"path": "$.client_mode", "in": ["anchor", "strategic"]}
  ]
}
```

### scoring_json

```json
{
  "add_if_feature": [
    {"key": "INBOUND_UNREPLIED_HOURS", "min": 4, "points": 15}
  ],
  "add_if_orient": [
    {"path": "$.churn_risk", "min": 0.5, "points": 20},
    {"path": "$.client_mode", "in": ["anchor"], "points": 15}
  ]
}
```

### guardrail_json

```json
{
  "do_not": ["Dar desconto sem aprovação"],
  "requires": ["stock_check", "pricing_approval"],
  "escalate_to": "pricing_agent"
}
```

---

## 🖥️ Endpoints da API

### Endpoints Principais

```
POST   /api/v2/tasks/generate         # Gera tasks do dia para um vendedor
GET    /api/v2/tasks/today            # Lista tasks do dia do usuário logado
GET    /api/v2/tasks/today/:sellerId  # Lista tasks de um vendedor (p/ gerente)
GET    /api/v2/tasks/:taskId          # Detalhes de uma task
PATCH  /api/v2/tasks/:taskId/start    # Marcar como IN_PROGRESS
PATCH  /api/v2/tasks/:taskId/done     # Marcar como DONE + outcome + reason
PATCH  /api/v2/tasks/:taskId/snooze   # Adiar task
GET    /api/v2/tasks/stats            # Estatísticas de completion
GET    /api/v2/tasks/backlog          # Ver backlog (overflow)
```

### Endpoints Admin

```
GET    /api/v2/tasks/rules            # Listar regras
POST   /api/v2/tasks/rules            # Criar regra
PUT    /api/v2/tasks/rules/:ruleId    # Atualizar regra
GET    /api/v2/tasks/outcomes         # Listar reason codes
GET    /api/v2/tasks/drift            # Ver drift de regras
```

---

## 🎨 UI/UX - Daily Tasks Page

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Seu Dia                                   [Refresh] [?]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔥 CRÍTICAS (3)                                    ⚠️   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📱 Responder WhatsApp — Artefatos Têxteis  [P: 95]  │ │ │
│ │ │ SLA: 45min restantes  •  🏢 âncora  •  ⚠️ churn     │ │ │
│ │ │                                                     │ │ │
│ │ │ 💡 "Defender preço, oferecer prazo alternativo"     │ │ │
│ │ │ ❌ Não: desconto sem aprovação                      │ │ │
│ │ │                                                     │ │ │
│ │ │ Por quê: WhatsApp sem resposta há 3h + churn alto   │ │ │
│ │ │                                                     │ │ │
│ │ │ [Responder] [Ver Histórico] [Escalar para Pricing]  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 OPORTUNIDADES (5)                                    │ │
│ │ ... (cards similares)                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧹 HIGIENE (3)                                          │ │
│ │ ... (cards menores, checklist)                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ CONCLUÍDAS: 4 de 11  •  36%  |  📦 BACKLOG: 7        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Outcome Dialog (ao fechar task)

```
┌─────────────────────────────────────────────────────────────┐
│ Fechar Tarefa                                          [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Resultado:                                                  │
│ ○ ✅ Ganhou (WON)                                           │
│ ○ ❌ Perdeu (LOST)                                          │
│ ○ 📭 Sem resposta (NO_RESPONSE)                             │
│ ○ ↗️ Escalado (ESCALATED)                                   │
│ ○ ⏰ Adiado (DEFERRED)                                      │
│                                                             │
│ Motivo: [dropdown com reason codes]                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Preço                                                   │ │
│ │ Prazo                                                   │ │
│ │ Sem estoque                                             │ │
│ │ Crédito                                                 │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Nota (opcional):                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Cliente vai avaliar e retorna amanhã                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Cancelar] [Confirmar]         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 KPIs e Métricas

### Para o Vendedor

| Métrica | Meta | Descrição |
|---------|------|-----------|
| Completion Rate | > 80% | % de tasks DONE / (total - BACKLOG) |
| SLA Compliance | > 90% | % de tasks feitas antes do SLA |
| Win Rate CRITICAL | > 50% | % de WON em tasks críticas |
| Tempo médio por task | < 15min | Tempo entre START e DONE |

### Para o Gestor

| Métrica | Descrição |
|---------|-----------|
| Tasks geradas por vendedor | Volume de trabalho distribuído |
| SLA breaches por vendedor | Quem está atrasando |
| Outcome distribution | WON/LOST/NO_RESPONSE por tipo |
| **Reason distribution** | PRICE/DEADLINE/NO_STOCK por tipo |
| **Drift detection** | Regras com win_rate em queda |
| **Backlog size** | Quantidade de tasks em overflow |

---

## 📅 Cronograma de Implementação

### Fase 1 - MVP Backend (4-5 dias)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1.1 | Rodar DDL v1.1 (8 tabelas + views) | 🔴 Alta |
| 1.2 | Criar SignalCollector.js (OBSERVE) | 🔴 Alta |
| 1.3 | Criar FeatureCalculator.js (NORMALIZE) | 🔴 Alta |
| 1.4 | Criar OrientationService.js (ORIENT) | 🔴 Alta |
| 1.5 | Criar RulesEngine.js (DECIDE) | 🔴 Alta |
| 1.6 | Criar TaskEngine.js (orquestrador) | 🔴 Alta |
| 1.7 | Criar tasks.repository.js | 🔴 Alta |
| 1.8 | Criar tasks.controller.js + routes | 🔴 Alta |

### Fase 2 - Frontend MVP (3 dias)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 2.1 | Criar DailyTasksPage.jsx | 🔴 Alta |
| 2.2 | Criar TaskCard.jsx (com why + guardrails) | 🔴 Alta |
| 2.3 | Criar TaskOutcomeDialog.jsx | 🔴 Alta |
| 2.4 | Criar tasks.service.js | 🔴 Alta |
| 2.5 | Adicionar rota /tasks no menu | 🔴 Alta |

### Fase 3 - Refinamentos (2-3 dias)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 3.1 | DailyTasksWidget para Dashboard | 🟡 Média |
| 3.2 | Notificações push | 🟡 Média |
| 3.3 | Backlog viewer | 🟡 Média |
| 3.4 | Admin page para regras | 🟢 Baixa |
| 3.5 | Scheduler (cron/on-login) | 🟢 Baixa |

### Fase 4 - Observabilidade (ongoing)

| # | Tarefa |
|---|--------|
| 4.1 | Dashboard de drift por regra |
| 4.2 | Análise de outcomes por reason |
| 4.3 | Calibração de limites via backlog |
| 4.4 | Integração com Pricing Agent |

---

## ✅ Critérios de Aceite (MVP)

```
✅ Vendedor vê lista de tarefas do dia ao acessar /tasks
✅ Tarefas categorizadas em CRITICAL / OPPORTUNITY / HYGIENE
✅ Máximo 3+5+3 tarefas visíveis (resto em BACKLOG)
✅ Cada tarefa tem: título, SLA, recomendação, "por quê", guardrails
✅ Vendedor pode marcar task como DONE com outcome + reason code
✅ Gestor pode ver tasks de sua equipe
✅ Tarefas são geradas a partir de dados reais (leads, WhatsApp, clientes)
✅ raw_signals e features são gravados (debug possível)
✅ orientation_snapshot é versionado com sources
✅ Performance: página carrega em < 2s
```

---

## ⚠️ Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Schema staging com cargas pesadas | Índices bem definidos; avaliar schema próprio se necessário |
| Pico às 08:00 para todos vendedores | Gerar on-login com cache do dia; ou fila de jobs |
| WhatsApp "unanswered" é sutil | Regra objetiva: última msg do cliente sem resposta do seller por X horas |
| Regras mal calibradas | Backlog permite ver overflow; drift view alerta sobre regras fracas |
| Outcomes genéricos demais | Reason codes padronizados; campo obrigatório no dialog |

---

## 🎯 Próximos Passos Imediatos

1. ⬜ **Rodar DDL** v1.1 no banco staging
2. ⬜ **Implementar** SignalCollector.js (integrar com 3 fontes iniciais)
3. ⬜ **Implementar** FeatureCalculator.js (10 features iniciais)
4. ⬜ **Implementar** OrientationService.js
5. ⬜ **Implementar** RulesEngine.js com schema padronizado
6. ⬜ **Testar** fluxo end-to-end para 1 vendedor

---

**© Rolemak - Sistema de Gestão de Leads**  
*Plano Daily Tasks v1.1 (Patch B) - Atualizado em 18/01/2026*
