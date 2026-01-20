# ✅ Checklist de Integração: C-Suite Ecosystem & Leads Agent

**Última Atualização:** 2026-01-20
**Documento Relacionado:** [PLANO_INTEGRACAO_CSUITE_LEADS_AGENT.md](../planos/PLANO_INTEGRACAO_CSUITE_LEADS_AGENT.md)
**Progresso Geral:** 0%

---

## Resumo de Progresso

| Fase | Descrição | Status | Progresso |
|------|-----------|--------|-----------|
| 0 | Infraestrutura Base | 🔴 Não Iniciado | 0/6 |
| 1 | Motor de Precificação e Promoções | 🔴 Não Iniciado | 0/12 |
| 2 | Segurança Financeira e Risco | 🔴 Não Iniciado | 0/10 |
| 3 | Sales Co-Pilot | 🔴 Não Iniciado | 0/10 |
| 4 | Inteligência de Mercado | 🔴 Não Iniciado | 0/8 |
| 5 | Alinhamento Estratégico | 🔴 Não Iniciado | 0/8 |

---

## Fase 0: Infraestrutura Base (Gateway de Comunicação)
*Pré-requisito para todas as outras fases.*

### 0.1 Configuração de Rede
- [ ] Verificar conectividade entre containers/serviços do `leads-agent` e `c-suite`
- [ ] Definir variáveis de ambiente para URLs dos agentes C-Suite
  - [ ] `CSUITE_PRICING_AGENT_URL`
  - [ ] `CSUITE_SALES_AGENT_URL`
  - [ ] `CSUITE_RISK_AGENT_URL`
  - [ ] `CSUITE_MARKET_INTEL_URL`

### 0.2 Service Adapter (Backend)
- [ ] Criar `backend/src/services/csuite-adapter.service.js`
  - [ ] Método base para chamadas HTTP aos agentes
  - [ ] Tratamento de timeout e retry
  - [ ] Fallback quando agente estiver offline
  - [ ] Logging de todas as interações
- [ ] Criar testes unitários para o adapter

### 0.3 Autenticação Inter-Serviços
- [ ] Definir método de autenticação (API Key, JWT, mTLS)
- [ ] Implementar middleware de autenticação no adapter
- [ ] Configurar secrets/credentials de forma segura

---

## Fase 1: Motor de Precificação e Promoções
*Prioridade: 🔴 ALTA | Dependência: Fase 0, MIGRACAO_PRICING_ADMIN.md*

### 1.1 Mapeamento de API do Pricing Agent
- [ ] Documentar todos os endpoints disponíveis em `c-suite/agents/pricing`
  - [ ] `/health` - Health check
  - [ ] `/run` - Execução principal do agente
  - [ ] `/search/*` - Endpoints de busca
  - [ ] `/promotions/*` - Endpoints de promoções
- [ ] Documentar payload esperado e response schema
- [ ] Testar endpoints manualmente via curl/Postman

### 1.2 Backend: Integração de Quoting
- [ ] Criar `backend/src/services/pricing-agent.service.js`
  - [ ] Método `calculateOptimalPrice(customer, products, context)`
  - [ ] Método `getMaxDiscount(customer, product)`
  - [ ] Método `validatePromotion(promotionId, customer, cart)`
- [ ] Modificar `backend/src/controllers/pricing.controller.js`
  - [ ] Integrar chamada ao Pricing Agent no fluxo de cotação
  - [ ] Implementar cache de resultados (Redis, 5min TTL)
- [ ] Criar rota de fallback para preço estático caso agente esteja offline

### 1.3 Frontend: UI de Preço Inteligente
- [ ] Na tela de criação de orçamento:
  - [ ] Exibir "Preço Sugerido pela IA" com badge visual
  - [ ] Exibir "Desconto Máximo Permitido" calculado pelo agente
  - [ ] Exibir indicador de margem (verde/amarelo/vermelho)
- [ ] Adicionar tooltip explicando lógica do preço sugerido

### 1.4 Validação de Promoções
- [ ] Criar endpoint `POST /api/pricing/validate-promotion`
- [ ] Integrar com `promotions.py` do Pricing Agent
- [ ] No frontend, validar promoção antes de aplicar ao carrinho
- [ ] Exibir mensagem clara se promoção for inválida para o cliente

### 1.5 Testes e Rollout
- [ ] Criar testes de integração end-to-end
- [ ] Deploy em ambiente de staging
- [ ] Validar com time de vendas (piloto com 2-3 usuários)
- [ ] Rollout para produção (feature flag)

---

## Fase 2: Segurança Financeira e Risco
*Prioridade: 🟡 MÉDIA | Dependência: Fase 0*

### 2.1 Mapeamento de API do Risk Agent
- [ ] Documentar endpoints disponíveis em `c-suite/agents/risk`
- [ ] Documentar tipos de decisão:
  - [ ] `RISK.GREEN` - Aprovado
  - [ ] `RISK.YELLOW` - Requer aprovação
  - [ ] `RISK.RED` - Bloqueado
- [ ] Entender critérios de risco (crédito, fraude, volume)

### 2.2 Backend: Validação de Risco
- [ ] Criar `backend/src/services/risk-agent.service.js`
  - [ ] Método `evaluateOrderRisk(customer, cart, total)`
  - [ ] Método `getCustomerRiskScore(customerId)`
- [ ] Modificar `backend/src/routes/orders.routes.js`
  - [ ] Adicionar middleware de validação de risco antes de criar pedido
  - [ ] Retornar código de erro específico para bloqueio de risco

### 2.3 Frontend: Feedback de Risco
- [ ] Na tela de checkout:
  - [ ] Se `RISK.YELLOW`: Exibir modal "Pedido requer aprovação gerencial"
  - [ ] Se `RISK.RED`: Exibir alerta de bloqueio com motivo
  - [ ] Se `RISK.GREEN`: Prosseguir normalmente
- [ ] Criar página de "Pedidos Pendentes de Aprovação" para gerentes

### 2.4 Fluxo de Aprovação
- [ ] Criar endpoint `POST /api/orders/:id/manager-approval`
- [ ] Integrar com sistema de notificações para alertar gerente
- [ ] Registrar log de quem aprovou e quando

---

## Fase 3: Sales Co-Pilot (Inteligência de Vendas)
*Prioridade: 🟡 MÉDIA | Dependência: Fase 0*

### 3.1 Mapeamento de API do Sales Agent
- [ ] Documentar endpoints disponíveis em `c-suite/agents/sales`
- [ ] Documentar tipos de decisão:
  - [ ] `SALES.QUOTE` - Criar cotação
  - [ ] `SALES.FOLLOW_UP` - Agendar follow-up
  - [ ] `SALES.ESCALATION` - Escalar para humano
- [ ] Entender inputs necessários (histórico, interações, RFM)

### 3.2 Backend: Serviço de Inteligência de Vendas
- [ ] Criar `backend/src/services/sales-agent.service.js`
  - [ ] Método `getNextBestAction(leadId)`
  - [ ] Método `getLeadPriorityScore(leadId)`
  - [ ] Método `getConversionPrediction(leadId)`
- [ ] Criar endpoint `GET /api/leads/:id/ai-insights`
- [ ] Implementar cache de insights (Redis, 15min TTL)

### 3.3 Frontend: Componente AI Insights
- [ ] Criar componente `<AIInsightsCard />` para Lead Dashboard
  - [ ] Exibir "Próxima Melhor Ação" com botão de ação
  - [ ] Exibir "Score de Propensão" com gauge visual
  - [ ] Exibir histórico de interações resumido
- [ ] Integrar componente na página de detalhes do lead

### 3.4 Priorização Inteligente de Leads
- [ ] Modificar listagem de leads para ordenar por AI Score
- [ ] Adicionar filtro "Leads Quentes" (score > 70)
- [ ] Adicionar badge visual de temperatura do lead (🔥/⚠️/❄️)

---

## Fase 4: Inteligência de Mercado
*Prioridade: 🟢 BAIXA | Dependência: Fase 0*

### 4.1 Mapeamento de API do Market Intelligence
- [ ] Documentar endpoints disponíveis em `csuite-market-intelligence`
- [ ] Entender dados disponíveis:
  - [ ] Preços de concorrentes
  - [ ] Tendências de mercado
  - [ ] Alertas de oportunidade

### 4.2 Backend: Serviço de Market Data
- [ ] Criar `backend/src/services/market-intel.service.js`
  - [ ] Método `getCompetitorPrices(productId)`
  - [ ] Método `getMarketTrends(category)`
- [ ] Criar endpoint `GET /api/products/:id/market-insights`
- [ ] Implementar cache agressivo (Redis, 1h TTL)

### 4.3 Frontend: Dados de Mercado
- [ ] Na página de detalhes do produto:
  - [ ] Adicionar seção "Inteligência de Mercado"
  - [ ] Exibir comparativo de preços com concorrentes (gráfico)
  - [ ] Exibir tendência de demanda
- [ ] Na tela de cotação:
  - [ ] Exibir tooltip "Preço do concorrente: R$ X"

---

## Fase 5: Alinhamento Estratégico (Top-Down)
*Prioridade: 🟢 BAIXA | Dependência: Fase 0*

### 5.1 Sistema de Diretrizes
- [ ] Criar schema para armazenar diretrizes dos agentes CEO/CRO
- [ ] Criar endpoint `GET /api/strategic/directives`
- [ ] Criar cron job para buscar novas diretrizes periodicamente

### 5.2 Backend: Integração com CEO/CRO Agents
- [ ] Criar `backend/src/services/executive-agent.service.js`
  - [ ] Método `getActiveDirectives()`
  - [ ] Método `acknowledgeDirective(directiveId, userId)`
- [ ] Integrar com sistema de notificações existente

### 5.3 Frontend: Banner de Diretrizes
- [ ] Criar componente `<StrategicDirectiveBanner />`
  - [ ] Exibir no topo do dashboard principal
  - [ ] Permitir "Entendi" para esconder temporariamente
  - [ ] Destacar visualmente (cor diferenciada)
- [ ] Criar tipo de notificação "Strategic Alert" no sistema de notificações

### 5.4 Rastreamento de Conformidade
- [ ] Registrar quais usuários visualizaram cada diretiva
- [ ] Criar relatório de "Alcance de Diretrizes" para gestão

---

## Critérios de Conclusão por Fase

### Fase 0 - Infraestrutura
- ✅ Adapter funcionando com pelo menos um agente
- ✅ Autenticação inter-serviços configurada
- ✅ Logs centralizados funcionando

### Fase 1 - Precificação
- ✅ 90% das cotações usando preço do Pricing Agent
- ✅ Fallback funcionando sem erros
- ✅ Time de vendas treinado

### Fase 2 - Risco
- ✅ 100% dos pedidos passando por validação de risco
- ✅ Fluxo de aprovação gerencial funcionando
- ✅ Zero pedidos de alto risco passando sem aprovação

### Fase 3 - Sales Co-Pilot
- ✅ AI Insights visível em 100% dos leads
- ✅ Score de propensão calculado para todos leads ativos
- ✅ Feedback positivo do time de vendas

### Fase 4 - Market Intelligence
- ✅ Dados de mercado visíveis nos principais produtos
- ✅ Atualização de dados funcionando automaticamente

### Fase 5 - Estratégico
- ✅ Diretrizes chegando em < 1 hora após publicação
- ✅ 80%+ dos usuários visualizando diretrivas ativas

---

## Notas e Observações

*Espaço para anotações durante a implementação.*

---
