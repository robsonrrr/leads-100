# ✅ CHECKLIST INTEGRAÇÃO C-SUITE ECOSYSTEM & LEADS AGENT

## Sistema de Gestão de Leads - Rolemak

**Período:** Q1-Q2 2026  
**Status:** Em Andamento 🔄  
**Última atualização:** Janeiro 2026

---

## 🎯 Objetivo da Integração

> **Conectar o Leads Agent aos Agentes de IA do C-Suite Ecosystem** para decisões inteligentes de pricing, risco, vendas e mercado.

### Critérios de Sucesso

- [ ] Pricing Agent como autoridade de preços
- [ ] Risk Agent validando todos os pedidos
- [ ] Sales Co-Pilot auxiliando vendedores
- [ ] Market Intelligence informando decisões

---

## 🧱 BLOCO 0 — INFRAESTRUTURA BASE (PRÉ-REQUISITO)

### 0.1 Configuração de Rede

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 0.1.1 | Verificar conectividade entre containers leads-agent e c-suite | DevOps | ⬜ |
| 0.1.2 | Definir `CSUITE_PRICING_AGENT_URL` | Backend | ⬜ |
| 0.1.3 | Definir `CSUITE_SALES_AGENT_URL` | Backend | ⬜ |
| 0.1.4 | Definir `CSUITE_RISK_AGENT_URL` | Backend | ⬜ |
| 0.1.5 | Definir `CSUITE_MARKET_INTEL_URL` | Backend | ⬜ |

**Critério de Aceite:**
```
✅ Variáveis de ambiente configuradas
✅ Ping entre serviços funcionando
```

---

### 0.2 Service Adapter

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 0.2.1 | Criar `csuite-adapter.service.js` | Backend | ⬜ |
| 0.2.2 | Implementar método base para chamadas HTTP | Backend | ⬜ |
| 0.2.3 | Implementar tratamento de timeout e retry | Backend | ⬜ |
| 0.2.4 | Implementar fallback quando agente offline | Backend | ⬜ |
| 0.2.5 | Implementar logging de todas as interações | Backend | ⬜ |
| 0.2.6 | Criar testes unitários para o adapter | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Adapter funcionando com pelo menos um agente
➡️ Logs registrando todas as chamadas
```

---

### 0.3 Autenticação Inter-Serviços

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 0.3.1 | Definir método de autenticação (API Key, JWT, mTLS) | Backend | ⬜ |
| 0.3.2 | Implementar middleware de autenticação no adapter | Backend | ⬜ |
| 0.3.3 | Configurar secrets/credentials de forma segura | DevOps | ⬜ |

**Critério de Aceite:**
```
❌ Nenhuma chamada sem autenticação
✅ Credentials armazenadas em secrets
```

---

## 🏷️ BLOCO 1 — MOTOR DE PRECIFICAÇÃO E PROMOÇÕES

> **Prioridade:** 🔴 ALTA  
> **Dependência:** Bloco 0

### 1.1 Mapeamento de API do Pricing Agent

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Documentar endpoint `/health` | Backend | ⬜ |
| 1.1.2 | Documentar endpoint `/run` | Backend | ⬜ |
| 1.1.3 | Documentar endpoints `/search/*` | Backend | ⬜ |
| 1.1.4 | Documentar endpoints `/promotions/*` | Backend | ⬜ |
| 1.1.5 | Documentar payload esperado e response schema | Backend | ⬜ |
| 1.1.6 | Testar endpoints manualmente via curl/Postman | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Documentação completa da API
➡️ Todos os endpoints testados
```

---

### 1.2 Backend: Integração de Quoting

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Criar `pricing-agent.service.js` | Backend | ⬜ |
| 1.2.2 | Implementar `calculateOptimalPrice(customer, products, context)` | Backend | ⬜ |
| 1.2.3 | Implementar `getMaxDiscount(customer, product)` | Backend | ⬜ |
| 1.2.4 | Implementar `validatePromotion(promotionId, customer, cart)` | Backend | ⬜ |
| 1.2.5 | Integrar chamada ao Pricing Agent no fluxo de cotação | Backend | ⬜ |
| 1.2.6 | Implementar cache de resultados (Redis, 5min TTL) | Backend | ⬜ |
| 1.2.7 | Criar rota de fallback para preço estático | Backend | ⬜ |

**Critério de Aceite:**
```
✅ 90% das cotações usando preço do Pricing Agent
✅ Fallback funcionando sem erros
```

---

### 1.3 Frontend: UI de Preço Inteligente

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.3.1 | Exibir "Preço Sugerido pela IA" com badge visual | Frontend | ⬜ |
| 1.3.2 | Exibir "Desconto Máximo Permitido" | Frontend | ⬜ |
| 1.3.3 | Exibir indicador de margem (verde/amarelo/vermelho) | Frontend | ⬜ |
| 1.3.4 | Adicionar tooltip explicando lógica do preço | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Vendedor vê recomendação de IA ao criar cotação
➡️ UI clara e intuitiva
```

---

### 1.4 Validação de Promoções

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.4.1 | Criar endpoint `POST /api/pricing/validate-promotion` | Backend | ⬜ |
| 1.4.2 | Integrar com `promotions.py` do Pricing Agent | Backend | ⬜ |
| 1.4.3 | Validar promoção no frontend antes de aplicar | Frontend | ⬜ |
| 1.4.4 | Exibir mensagem clara se promoção for inválida | Frontend | ⬜ |

**Critério de Aceite:**
```
❌ Promoção inválida não é aplicada
✅ Feedback imediato ao usuário
```

---

### 1.5 Testes e Rollout

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.5.1 | Criar testes de integração end-to-end | Backend | ⬜ |
| 1.5.2 | Deploy em ambiente de staging | DevOps | ⬜ |
| 1.5.3 | Validar com time de vendas (piloto 2-3 usuários) | Produto | ⬜ |
| 1.5.4 | Rollout para produção (feature flag) | DevOps | ⬜ |

**Critério de Aceite:**
```
➡️ Time de vendas treinado
➡️ Feature flag permitindo rollback rápido
```

---

## 🔐 BLOCO 2 — SEGURANÇA FINANCEIRA E RISCO

> **Prioridade:** 🟡 MÉDIA  
> **Dependência:** Bloco 0

### 2.1 Mapeamento de API do Risk Agent

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Documentar endpoints disponíveis | Backend | ⬜ |
| 2.1.2 | Documentar `RISK.GREEN` - Aprovado | Backend | ⬜ |
| 2.1.3 | Documentar `RISK.YELLOW` - Requer aprovação | Backend | ⬜ |
| 2.1.4 | Documentar `RISK.RED` - Bloqueado | Backend | ⬜ |
| 2.1.5 | Entender critérios de risco (crédito, fraude, volume) | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Documentação completa dos níveis de risco
➡️ Critérios de decisão claros
```

---

### 2.2 Backend: Validação de Risco

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Criar `risk-agent.service.js` | Backend | ⬜ |
| 2.2.2 | Implementar `evaluateOrderRisk(customer, cart, total)` | Backend | ⬜ |
| 2.2.3 | Implementar `getCustomerRiskScore(customerId)` | Backend | ⬜ |
| 2.2.4 | Adicionar middleware de validação de risco | Backend | ⬜ |
| 2.2.5 | Retornar código de erro específico para bloqueio | Backend | ⬜ |

**Critério de Aceite:**
```
✅ 100% dos pedidos passando por validação de risco
✅ Zero pedidos de alto risco sem aprovação
```

---

### 2.3 Frontend: Feedback de Risco

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Exibir modal "Requer aprovação" para RISK.YELLOW | Frontend | ⬜ |
| 2.3.2 | Exibir alerta de bloqueio para RISK.RED | Frontend | ⬜ |
| 2.3.3 | Prosseguir normalmente para RISK.GREEN | Frontend | ⬜ |
| 2.3.4 | Criar página "Pedidos Pendentes de Aprovação" | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Fluxo de aprovação gerencial funcionando
➡️ UI clara sobre status do risco
```

---

### 2.4 Fluxo de Aprovação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.4.1 | Criar endpoint `POST /api/orders/:id/manager-approval` | Backend | ⬜ |
| 2.4.2 | Integrar com sistema de notificações | Backend | ⬜ |
| 2.4.3 | Registrar log de quem aprovou e quando | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Gerente notificado automaticamente
➡️ Auditoria completa de aprovações
```

---

## 🤖 BLOCO 3 — SALES CO-PILOT (INTELIGÊNCIA DE VENDAS)

> **Prioridade:** 🟡 MÉDIA  
> **Dependência:** Bloco 0

### 3.1 Mapeamento de API do Sales Agent

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Documentar endpoints disponíveis | Backend | ⬜ |
| 3.1.2 | Documentar `SALES.QUOTE` - Criar cotação | Backend | ⬜ |
| 3.1.3 | Documentar `SALES.FOLLOW_UP` - Agendar follow-up | Backend | ⬜ |
| 3.1.4 | Documentar `SALES.ESCALATION` - Escalar para humano | Backend | ⬜ |
| 3.1.5 | Entender inputs necessários (histórico, RFM) | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Documentação completa da API
➡️ Tipos de decisão mapeados
```

---

### 3.2 Backend: Serviço de Inteligência de Vendas

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Criar `sales-agent.service.js` | Backend | ⬜ |
| 3.2.2 | Implementar `getNextBestAction(leadId)` | Backend | ⬜ |
| 3.2.3 | Implementar `getLeadPriorityScore(leadId)` | Backend | ⬜ |
| 3.2.4 | Implementar `getConversionPrediction(leadId)` | Backend | ⬜ |
| 3.2.5 | Criar endpoint `GET /api/leads/:id/ai-insights` | Backend | ⬜ |
| 3.2.6 | Implementar cache de insights (Redis, 15min TTL) | Backend | ⬜ |

**Critério de Aceite:**
```
✅ AI Insights visível em 100% dos leads
✅ Score de propensão calculado
```

---

### 3.3 Frontend: Componente AI Insights

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Criar componente `<AIInsightsCard />` | Frontend | ⬜ |
| 3.3.2 | Exibir "Próxima Melhor Ação" com botão | Frontend | ⬜ |
| 3.3.3 | Exibir "Score de Propensão" com gauge visual | Frontend | ⬜ |
| 3.3.4 | Exibir histórico de interações resumido | Frontend | ⬜ |
| 3.3.5 | Integrar componente na página de detalhes do lead | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Feedback positivo do time de vendas
➡️ Insights claros e acionáveis
```

---

### 3.4 Priorização Inteligente de Leads

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.4.1 | Modificar listagem para ordenar por AI Score | Frontend | ⬜ |
| 3.4.2 | Adicionar filtro "Leads Quentes" (score > 70) | Frontend | ⬜ |
| 3.4.3 | Adicionar badge visual de temperatura (🔥/⚠️/❄️) | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Vendedores focam nos leads certos
➡️ Visualização intuitiva de prioridade
```

---

## 📊 BLOCO 4 — INTELIGÊNCIA DE MERCADO

> **Prioridade:** 🟢 BAIXA  
> **Dependência:** Bloco 0

### 4.1 Mapeamento de API do Market Intelligence

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Documentar endpoints disponíveis | Backend | ⬜ |
| 4.1.2 | Mapear dados de preços de concorrentes | Backend | ⬜ |
| 4.1.3 | Mapear dados de tendências de mercado | Backend | ⬜ |
| 4.1.4 | Mapear alertas de oportunidade | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Documentação completa
➡️ Dados disponíveis mapeados
```

---

### 4.2 Backend: Serviço de Market Data

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Criar `market-intel.service.js` | Backend | ⬜ |
| 4.2.2 | Implementar `getCompetitorPrices(productId)` | Backend | ⬜ |
| 4.2.3 | Implementar `getMarketTrends(category)` | Backend | ⬜ |
| 4.2.4 | Criar endpoint `GET /api/products/:id/market-insights` | Backend | ⬜ |
| 4.2.5 | Implementar cache agressivo (Redis, 1h TTL) | Backend | ⬜ |

**Critério de Aceite:**
```
✅ Dados de mercado visíveis nos principais produtos
✅ Atualização automática funcionando
```

---

### 4.3 Frontend: Dados de Mercado

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.3.1 | Adicionar seção "Inteligência de Mercado" na página do produto | Frontend | ⬜ |
| 4.3.2 | Exibir comparativo de preços com concorrentes (gráfico) | Frontend | ⬜ |
| 4.3.3 | Exibir tendência de demanda | Frontend | ⬜ |
| 4.3.4 | Exibir tooltip "Preço do concorrente" na cotação | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Vendedor informado sobre mercado
➡️ Dados visuais e claros
```

---

## 🎯 BLOCO 5 — ALINHAMENTO ESTRATÉGICO (TOP-DOWN)

> **Prioridade:** 🟢 BAIXA  
> **Dependência:** Bloco 0

### 5.1 Sistema de Diretrizes

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Criar schema para armazenar diretrizes | Backend | ⬜ |
| 5.1.2 | Criar endpoint `GET /api/strategic/directives` | Backend | ⬜ |
| 5.1.3 | Criar cron job para buscar novas diretrizes | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Diretrizes chegando em < 1 hora após publicação
➡️ Schema flexível para diferentes tipos
```

---

### 5.2 Backend: Integração com CEO/CRO Agents

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Criar `executive-agent.service.js` | Backend | ⬜ |
| 5.2.2 | Implementar `getActiveDirectives()` | Backend | ⬜ |
| 5.2.3 | Implementar `acknowledgeDirective(directiveId, userId)` | Backend | ⬜ |
| 5.2.4 | Integrar com sistema de notificações | Backend | ⬜ |

**Critério de Aceite:**
```
✅ 80%+ dos usuários visualizando diretrizes ativas
✅ Tracking de acknowledgment
```

---

### 5.3 Frontend: Banner de Diretrizes

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.3.1 | Criar componente `<StrategicDirectiveBanner />` | Frontend | ⬜ |
| 5.3.2 | Exibir no topo do dashboard principal | Frontend | ⬜ |
| 5.3.3 | Permitir "Entendi" para esconder temporariamente | Frontend | ⬜ |
| 5.3.4 | Destacar visualmente (cor diferenciada) | Frontend | ⬜ |
| 5.3.5 | Criar tipo de notificação "Strategic Alert" | Frontend | ⬜ |

**Critério de Aceite:**
```
➡️ Banner visível e não-intrusivo
➡️ Gestão pode medir alcance
```

---

### 5.4 Rastreamento de Conformidade

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.4.1 | Registrar quais usuários visualizaram cada diretiva | Backend | ⬜ |
| 5.4.2 | Criar relatório de "Alcance de Diretrizes" | Backend | ⬜ |

**Critério de Aceite:**
```
➡️ Relatório mostra % de visualização
➡️ Dados prontos para auditoria
```

---

## 🏁 DEFINIÇÃO DE "INTEGRAÇÃO COMPLETA"

O checklist **só está concluído** quando todas as afirmações forem verdadeiras:

| # | Afirmação | Status |
|---|-----------|--------|
| 1 | ✔️ Pricing Agent é autoridade única de preços | ⬜ |
| 2 | ✔️ Risk Agent valida 100% dos pedidos | ⬜ |
| 3 | ✔️ Sales Co-Pilot auxilia todos os vendedores | ⬜ |
| 4 | ✔️ Market Intelligence informa decisões | ⬜ |
| 5 | ✔️ Diretrizes estratégicas chegam aos usuários | ⬜ |
| 6 | ✔️ Autenticação inter-serviços segura | ⬜ |
| 7 | ✔️ Fallbacks funcionando para todos os agentes | ⬜ |

---

## 📅 CRONOGRAMA SUGERIDO

| Sprint | Bloco | Entregas |
|--------|-------|----------|
| **1-2** | Bloco 0 | Infraestrutura Base |
| **3-4** | Bloco 1.1-1.2 | Mapeamento e Backend Pricing |
| **5-6** | Bloco 1.3-1.5 | Frontend Pricing + Rollout |
| **7-8** | Bloco 2 | Risco e Aprovações |
| **9-10** | Bloco 3 | Sales Co-Pilot |
| **11-12** | Bloco 4-5 | Market Intel + Estratégico |

---

## 📊 PROGRESSO GERAL

| Bloco | Total | Concluído | % |
|-------|-------|-----------|---|
| 0. Infraestrutura Base | 14 | 0 | 0% |
| 1. Motor de Precificação | 26 | 0 | 0% |
| 2. Segurança e Risco | 16 | 0 | 0% |
| 3. Sales Co-Pilot | 19 | 0 | 0% |
| 4. Market Intelligence | 13 | 0 | 0% |
| 5. Alinhamento Estratégico | 14 | 0 | 0% |
| **TOTAL** | **102** | **0** | **0%** |

---

## 📚 Documentação Relacionada

- [Plano de Integração C-Suite](../planos/PLANO_INTEGRACAO_CSUITE_LEADS_AGENT.md)
- [Migração Pricing Admin](./MIGRACAO_PRICING_ADMIN.md)
- [Especificação Pricing Agent](./SPEC_PRICING_AGENT.md)
- [Manual do Agente IA](./MANUAL_AGENTE_IA.md)

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Integração C-Suite Ecosystem*
