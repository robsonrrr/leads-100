# ✅ CHECKLIST TÉCNICO — META 30.000 MÁQUINAS/ANO

## Sistema de Gestão de Leads - Rolemak

**Período:** 2026  
**Pré-requisito:** Q1 e Q2 completos (98%+)  
**Status:** Pronto para Iniciar 🚀  
**Última atualização:** Janeiro 2026

---

## 📋 Relação com Outros Documentos

| Documento | Foco | Relação |
|-----------|------|---------|
| [DECOMPOSICAO_ESTRATEGICA_30000.md](./DECOMPOSICAO_ESTRATEGICA_30000.md) | Estratégia e KPIs por executivo | **Origem dos requisitos** |
| [PLANO_MELHORIA_2026.md](./PLANO_MELHORIA_2026.md) | Melhorias gerais (IA, UX, Segurança) | **Complementar** (não duplicar) |
| [CHECKLIST_Q1_2026.md](./CHECKLIST_Q1_2026.md) | Pricing Agent e Segurança | **Concluído** ✅ |
| [CHECKLIST_Q2_2026.md](./CHECKLIST_Q2_2026.md) | IA Avançada (Chatbot, Previsões) | **Concluído** ✅ |

> ⚠️ Este checklist foca **exclusivamente** nos KPIs da meta 30k que **não estão cobertos** pelo PLANO_MELHORIA_2026.md

---

## 🎯 Objetivo Central

> **Atingir 30.000 máquinas/ano através de métricas e dashboards que permitam:**
> - Monitorar **Penetração Mensal** (KPI-mãe)
> - Garantir **Pipeline ≥ 3.000 máquinas/mês**
> - Manter **Giro de estoque ≥ 6x/ano**
> - Proteger **Margem bruta ≥ 25%**
> - Reduzir **Churn < 5%**

### Metas Derivadas

| Período | Meta de Máquinas | Pipeline Necessário |
|---------|------------------|---------------------|
| Anual | 30.000 | - |
| Mensal | 2.500 | ≥ 3.000 (60% conversão) |
| Semanal | ~625 | ~750 |

---

## ✅ FUNCIONALIDADES JÁ IMPLEMENTADAS (Q1/Q2)

As seguintes funcionalidades **já estão implementadas** e suportam a meta 30k:

| Funcionalidade | Serviço | Status |
|----------------|---------|--------|
| Previsão de Vendas (Forecast) | `ForecastService.js` | ✅ Q2 |
| Score de Churn | `ChurnService.js` | ✅ Q2 |
| Recomendação de Produtos | `RecommendationService.js` | ✅ Q2 |
| Chatbot IA | `AIGateway.js`, `AIService.js` | ✅ Q2 |
| Automação de Follow-ups | `AutomationEngine.js`, `Scheduler.js` | ✅ Q2 |
| Pricing Agent | `PricingAgent.js`, `PolicyEngine.js` | ✅ Q1 |
| Classificação de Risco | `RiskClassifier.js` | ✅ Q1 |
| Push Notifications | `push.service.js` | ✅ Q2 |
| Dashboard Customizável | Widgets Frontend | ✅ Q2 |

---

## 🆕 BLOCO 1 — MÉTRICAS DE PENETRAÇÃO (KPI-MÃE)

> **Responsáveis:** CEO, CRO  
> **KPI:** Penetração ≥ 2.5 revendas/vendedor/mês

### 1.1 Backend - Cálculo de Penetração

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Criar endpoint `/api/v2/analytics/penetration` | Backend | ✅ |
| 1.1.2 | Definir conceito de "revenda ativa" (comprou no mês) | Backend | ✅ |
| 1.1.3 | Calcular carteira total por vendedor | Backend | ✅ |
| 1.1.4 | Calcular revendas ativas por vendedor/mês | Backend | ✅ |
| 1.1.5 | Calcular taxa de penetração (ativas/carteira) | Backend | ✅ |
| 1.1.6 | Implementar histórico mensal de penetração | Backend | ✅ |

**Fórmula:**
```
Penetração = Revendas que Compraram no Mês / Total de Revendas na Carteira
Meta: ≥ 2.5 por vendedor/mês
```

**Critério de Aceite:**
```
➡️ Penetração calculada por vendedor
➡️ Penetração consolidada da empresa
➡️ Comparativo com meta (2.5)
➡️ Histórico dos últimos 12 meses
```

---

### 1.2 Frontend - Widget de Penetração

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Criar componente `PenetrationWidget.jsx` | Frontend | ✅ |
| 1.2.2 | Exibir penetração atual vs meta (gauge chart) | Frontend | ✅ |
| 1.2.3 | Criar ranking de vendedores por penetração | Frontend | ✅ |
| 1.2.4 | Implementar gráfico de evolução mensal | Frontend | ✅ |
| 1.2.5 | Adicionar drill-down por vendedor | Frontend | ✅ |
| 1.2.6 | Exibir lista de revendas inativas (não compraram) | Frontend | ✅ |

**Critério de Aceite:**
```
➡️ CEO vê penetração geral da empresa
➡️ Gerentes veem penetração por vendedor
➡️ Vendedores veem própria penetração + lista de inativos
```

---

## 📊 BLOCO 2 — DASHBOARD DE PIPELINE (CRO)

> **Responsáveis:** CRO, CMO  
> **KPI:** Pipeline ≥ 3.000 máquinas/mês, Conversão ≥ 60%

### 2.1 Backend - Métricas de Pipeline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Criar endpoint `/api/v2/analytics/pipeline` | Backend | ✅ |
| 2.1.2 | Contar leads criados por período | Backend | ✅ |
| 2.1.3 | Contar leads convertidos (cType = 2) por período | Backend | ✅ |
| 2.1.4 | Somar quantidade de máquinas nos leads (qtd total) | Backend | ✅ |
| 2.1.5 | Calcular taxa de conversão (convertidos/criados) | Backend | ✅ |
| 2.1.6 | Comparar com meta (2.500 máquinas/mês) | Backend | ✅ |
| 2.1.7 | Calcular gap para atingir meta | Backend | ✅ |

**Critério de Aceite:**
```json
{
  "period": "2026-01",
  "leads_created": 180,
  "leads_converted": 108,
  "conversion_rate": 60,
  "machines_in_pipeline": 3200,
  "machines_sold": 2450,
  "target": 2500,
  "gap": 50,
  "status": "ON_TRACK"
}
```

---

### 2.2 Frontend - Widget de Pipeline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Criar componente `PipelineWidget.jsx` | Frontend | ✅ |
| 2.2.2 | Exibir funil visual (leads → conversão → máquinas) | Frontend | ✅ |
| 2.2.3 | Mostrar meta vs realizado com barra de progresso | Frontend | ✅ |
| 2.2.4 | Adicionar indicador de tendência (🔺🔻) | Frontend | ✅ |
| 2.2.5 | Implementar filtro por período (semana/mês/trimestre) | Frontend | ✅ |
| 2.2.6 | Exibir alerta quando gap > 20% | Frontend | ✅ |

**Critério de Aceite:**
```
➡️ Widget na home do dashboard
➡️ Verde (≥ meta), Amarelo (80-99%), Vermelho (< 80%)
➡️ Atualização automática
```

---

### 2.3 Alertas de Pipeline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Criar job diário de verificação de pipeline | Backend | ✅ |
| 2.3.2 | Alertar quando pipeline < 80% da meta semanal | Backend | ✅ |
| 2.3.3 | Notificar CRO/CMO via push notification | Backend | ✅ |
| 2.3.4 | Registrar alertas no log de auditoria | Backend | ✅ |

**Critério de Aceite:**
```
⚠️ Pipeline < 600 máquinas/semana = Alerta AMARELO
🔴 Pipeline < 500 máquinas/semana = Alerta VERMELHO → Escalar CRO/CMO
```

---

## 📦 BLOCO 3 — GESTÃO DE ESTOQUE (COO)

> **Responsáveis:** COO  
> **KPI:** Giro ≥ 6x/ano, BAIXO_GIRO < 15%, Rupturas S4-S5 = 0

### 3.1 Detecção de Low-Turn

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Criar endpoint `/api/v2/analytics/inventory/low-turn` | Backend | ✅ |
| 3.1.2 | Calcular dias em estoque por produto | Backend | ✅ |
| 3.1.3 | Classificar produtos por giro (via p_machines view) | Backend | ✅ |
| 3.1.4 | Calcular % de estoque em cada categoria | Backend | ✅ |
| 3.1.5 | Calcular giro de estoque anualizado | Backend | ✅ |

**Classificação de Giro:**
| Dias em Estoque | Classificação | Meta % |
|-----------------|---------------|--------|
| 0-30 dias | ALTO_GIRO | - |
| 31-60 dias | MÉDIO_GIRO | - |
| 61-90 dias | BAIXO_GIRO | < 15% |
| > 90 dias | SEM_GIRO | < 5% |

---

### 3.2 Sugestão Automática de Bundles

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Criar endpoint `/api/v2/analytics/inventory/bundles/suggest` | Backend | ✅ |
| 3.2.2 | Identificar produtos em BAIXO_GIRO ou SEM_GIRO | Backend | ✅ |
| 3.2.3 | Buscar produtos complementares de ALTO_GIRO | Backend | ✅ |
| 3.2.4 | Calcular desconto sugerido (5-15% baseado em cobertura) | Backend | ✅ |
| 3.2.5 | Gerar sugestão de bundle com economia para cliente | Backend | ✅ |
| 3.2.6 | Registrar bundles sugeridos (meta: 184/mês) | Backend | ✅ |

**Meta:** ≥ 184 bundles gerados/mês

**Critério de Aceite:**
```json
{
  "bundle_id": "B-2026-001",
  "low_turn_product": { "id": 123, "name": "Máquina X", "days_in_stock": 95 },
  "complement_product": { "id": 456, "name": "Acessório Y" },
  "suggested_discount": 8.5,
  "customer_savings": 450.00,
  "compliant_with_policy": true
}
```

---

### 3.3 Alertas de Ruptura (S1-S5)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Criar endpoint `/api/v2/analytics/inventory/stockout-alerts` | Backend | ✅ |
| 3.3.2 | Monitorar estoque crítico (via p_machines status_estoque) | Backend | ✅ |
| 3.3.3 | Classificar rupturas por severidade (S1-S5) | Backend | ✅ |
| 3.3.4 | Identificar pedidos pendentes afetados | Backend | ✅ |
| 3.3.5 | Sugerir produtos substitutos | Backend | ✅ |
| 3.3.6 | Notificar COO em rupturas S4-S5 | Backend | ✅ |

**Classificação de Ruptura:**
| Nível | Critério | Ação |
|-------|----------|------|
| S1 | Estoque < 20% da média | Monitorar |
| S2 | Estoque < 10% da média | Alertar compras |
| S3 | Estoque zerado, sem pedidos | Reabastecer |
| S4 | Estoque zerado, pedidos pendentes | **URGENTE** |
| S5 | Ruptura afeta cliente estratégico | **MÁXIMA PRIORIDADE** |

**Meta:** Rupturas S4-S5 = 0

---

### 3.4 Frontend - Widget de Estoque

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.4.1 | Criar componente `InventoryHealthWidget.jsx` | Frontend | ✅ |
| 3.4.2 | Exibir giro de estoque (gauge: meta 6x/ano) | Frontend | ✅ |
| 3.4.3 | Mostrar % de produtos em BAIXO_GIRO | Frontend | ✅ |
| 3.4.4 | Listar alertas de ruptura ativos | Frontend | ✅ |
| 3.4.5 | Exibir bundles sugeridos do dia | Frontend | ✅ |
| 3.4.6 | Ação rápida "Criar Lead com Bundle" | Frontend | ✅ |

---

## 💰 BLOCO 4 — GESTÃO FINANCEIRA (CFO)

> **Responsáveis:** CFO  
> **KPI:** Margem ≥ 25%, DSO ≤ 45 dias, Crédito ≤ R$ 50M

### 4.1 Dashboard de Margem (Expandir RiskClassifier)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Criar endpoint `/api/v2/analytics/margin` | Backend | ✅ |
| 4.1.2 | Calcular margem bruta consolidada | Backend | ✅ |
| 4.1.3 | Calcular margem por vendedor/segmento | Backend | ✅ |
| 4.1.4 | Integrar distribuição de risco (LOW/MEDIUM/HIGH/CRITICAL) | Backend | ✅ |
| 4.1.5 | Alertar quando margem média < 25% | Backend | ✅ |

**Critério de Aceite:**
```
➡️ Margem bruta calculada em tempo real
➡️ Distribuição de risco por vendedor
➡️ Alerta quando margem < 25%
```

---

### 4.2 Cálculo de DSO (Days Sales Outstanding)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Criar endpoint `/api/v2/analytics/dso` | Backend | ✅ |
| 4.2.2 | Calcular DSO médio da empresa | Backend | ✅ |
| 4.2.3 | Calcular DSO por cliente | Backend | ✅ |
| 4.2.4 | Calcular DSO por vendedor | Backend | ✅ |
| 4.2.5 | Alertar quando DSO > 45 dias | Backend | ✅ |

**Fórmula:**
```
DSO = (Contas a Receber / Vendas) × Dias no Período
Meta: ≤ 45 dias
```

---

### 4.3 Validação de Limite de Crédito

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.3.1 | Criar endpoint `/api/v2/customers/:id/credit-status` | Backend | ✅ |
| 4.3.2 | Buscar limite de crédito do cliente | Backend | ✅ |
| 4.3.3 | Calcular crédito utilizado (pedidos em aberto) | Backend | ✅ |
| 4.3.4 | Calcular crédito disponível | Backend | ✅ |
| 4.3.5 | Bloquear conversão se ultrapassa limite | Backend | ✅ |
| 4.3.6 | Exibir crédito disponível no LeadDetailPage | Frontend | ✅ |

**Critério de Aceite:**
```
➡️ Limite validado antes da conversão
➡️ Violações de crédito < 2% dos pedidos
```

---

### 4.4 Frontend - Widget Financeiro

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.4.1 | Criar componente `FinancialHealthWidget.jsx` | Frontend | ✅ |
| 4.4.2 | Exibir margem bruta vs meta (25%) | Frontend | ✅ |
| 4.4.3 | Exibir DSO vs meta (45 dias) | Frontend | ✅ |
| 4.4.4 | Mostrar distribuição de risco (pie chart) | Frontend | ✅ |
| 4.4.5 | Listar clientes com crédito bloqueado | Frontend | ✅ |

---

## 🤖 BLOCO 5 — GOVERNANÇA DE IA (CAIO)

> **Responsáveis:** CAIO  
> **KPI:** Performance ≥ 90%, Drift < 5%

### 5.1 Monitoramento de Performance

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Criar endpoint `/api/v2/ai/model-performance` | Backend | ✅ |
| 5.1.2 | Medir CTR das recomendações | Backend | ✅ |
| 5.1.3 | Medir taxa de conversão das recomendações | Backend | ✅ |
| 5.1.4 | Calcular acurácia do forecast vs realizado | Backend | ✅ |
| 5.1.5 | Calcular acurácia do churn score | Backend | ✅ |

**Métricas:**
| Modelo | Métrica | Meta |
|--------|---------|------|
| Recomendações | CTR | ≥ 5% |
| Recomendações | Conversão | ≥ 15% |
| Forecast | MAPE | < 15% |
| Churn | AUC-ROC | > 0.75 |

---

### 5.2 Detecção de Drift

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Criar serviço `DriftDetectionService.js` | Backend | ✅ |
| 5.2.2 | Comparar performance atual vs baseline (30 dias) | Backend | ✅ |
| 5.2.3 | Detectar degradação > 5% | Backend | ✅ |
| 5.2.4 | Alertar CAIO quando drift detectado | Backend | ✅ |
| 5.2.5 | Sugerir re-treinamento automático | Backend | ✅ |

---

### 5.3 Frontend - Dashboard de IA

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.3.1 | Criar página `AIGovernancePage.jsx` | Frontend | ✅ |
| 5.3.2 | Exibir performance de cada modelo | Frontend | ✅ |
| 5.3.3 | Mostrar alertas de drift | Frontend | ✅ |
| 5.3.4 | Exibir histórico de performance | Frontend | ✅ |
| 5.3.5 | Rota: `/ai-governance` | Frontend | ✅ |

---

## 📋 BLOCO 6 — BRIEF EXECUTIVO DIÁRIO (CEO)

> **Responsáveis:** CEO  
> **KPI:** Briefs enviados todo dia às 8h

### 6.1 Geração de Brief

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Criar serviço `ExecutiveBriefService.js` | Backend | ✅ |
| 6.1.2 | Coletar todos os KPIs (Penetração, Pipeline, Margem, etc.) | Backend | ✅ |
| 6.1.3 | Comparar Actual vs Target para cada KPI | Backend | ✅ |
| 6.1.4 | Gerar insights com IA (usar AIGateway) | Backend | ✅ |
| 6.1.5 | Formatar brief em HTML (email-friendly) | Backend | ✅ |
| 6.1.6 | Agendar envio diário às 8h (Scheduler) | Backend | ✅ |

**Exemplo de Brief:**
```
📊 BRIEF EXECUTIVO - 15/01/2026

🎯 PENETRAÇÃO: 2.3 ⚠️ (meta: 2.5) - Gap: 8%
📈 PIPELINE: 2.800 máquinas ⚠️ (meta: 3.000) - Gap: 7%
💰 MARGEM: 26.5% ✅ (meta: 25%)
📦 GIRO: 5.8x ⚠️ (meta: 6x)
🔴 RUPTURAS S4-S5: 0 ✅

💡 INSIGHTS:
- 3 vendedores abaixo da meta de penetração
- Produto X em ruptura iminente (estoque 5 dias)
- Bundles sugeridos: 12 (meta diária: 6)
```

---

### 6.2 Envio e Notificação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Enviar brief por email para CEO/CRO | Backend | ✅ |
| 6.2.2 | Enviar push notification com resumo | Backend | ✅ |
| 6.2.3 | Registrar briefs enviados no log | Backend | ✅ |
| 6.2.4 | Permitir configurar horário de envio | Backend | ✅ |

---

## 🧪 BLOCO 7 — TESTES E VALIDAÇÃO

### 7.1 Testes de KPIs

| # | Teste | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 7.1.1 | Penetração calculada corretamente | Fórmula validada | ✅ |
| 7.1.2 | Pipeline soma máquinas de todos os leads | Total correto | ✅ |
| 7.1.3 | Produtos low-turn detectados | > 60 dias aparece | ✅ |
| 7.1.4 | Bundles respeitam PRICE_FLOOR | Nunca viola política | ✅ |
| 7.1.5 | Ruptura S4-S5 gera alerta | Push enviado | ✅ |
| 7.1.6 | Margem calculada corretamente | Match com RiskClassifier | ✅ |
| 7.1.7 | DSO calculado por cliente | Dias corretos | ✅ |
| 7.1.8 | Crédito bloqueia conversão | Lead não converte | ✅ |
| 7.1.9 | Brief enviado às 8h | Email recebido | ✅ |

### 7.2 Testes de Integração

| # | Teste | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 7.2.1 | Widgets carregam dados dos endpoints | Dados exibidos | ✅ |
| 7.2.2 | Alertas chegam via push | Notificação recebida | ✅ |
| 7.2.3 | Dashboard CEO consolida todos os KPIs | Tudo visível | ✅ |

---

## 🏁 DEFINIÇÃO DE "META 30K SUPORTADA"

O checklist **só está concluído** quando todas as afirmações forem verdadeiras:

| # | Afirmação | Status |
|---|-----------|--------|
| 1 | ✔️ Métrica de Penetração calculada e exibida | ✅ |
| 2 | ✔️ Dashboard de Pipeline com meta 3.000 | ✅ |
| 3 | ✔️ Alertas de pipeline disparando | ✅ |
| 4 | ✔️ Produtos low-turn identificados | ✅ |
| 5 | ✔️ Bundles sendo sugeridos automaticamente | ✅ |
| 6 | ✔️ Alertas de ruptura S4-S5 funcionando | ✅ |
| 7 | ✔️ Margem e DSO calculados | ✅ |
| 8 | ✔️ Limite de crédito validado na conversão | ✅ |
| 9 | ✔️ Governança de IA monitorada | ✅ |
| 10 | ✔️ Brief executivo sendo enviado diariamente | ✅ |

---

## 📅 CRONOGRAMA SUGERIDO

| Sprint | Bloco | Entregas | Duração |
|--------|-------|----------|---------|
| **1** | Bloco 1 | Métricas de Penetração | 1 semana |
| **2** | Bloco 2 | Dashboard de Pipeline | 1 semana |
| **3** | Bloco 3.1-3.2 | Low-Turn e Bundles | 1 semana |
| **4** | Bloco 3.3-3.4 | Rupturas e Widget | 1 semana |
| **5** | Bloco 4.1-4.2 | Margem e DSO | 1 semana |
| **6** | Bloco 4.3-4.4 | Crédito e Widget | 1 semana |
| **7** | Bloco 5 | Governança IA | 1 semana |
| **8** | Bloco 6-7 | Brief Executivo + Testes | 1 semana |

**Duração Total Estimada:** 8 semanas (~2 meses)

---

## 📊 PROGRESSO GERAL

| Bloco | Tarefas | Concluído | % |
|-------|---------|-----------|---|
| 1. Métricas de Penetração | 12 | 12 | 100% |
| 2. Dashboard de Pipeline | 14 | 14 | 100% |
| 3. Gestão de Estoque | 20 | 20 | 100% |
| 4. Gestão Financeira | 16 | 16 | 100% |
| 5. Governança de IA | 15 | 15 | 100% |
| 6. Brief Executivo | 10 | 10 | 100% |
| 7. Testes | 12 | 12 | 100% |
| **TOTAL** | **99** | **99** | **100%** ✅ |

---

## 🔑 MAPEAMENTO DE RESPONSÁVEIS (Executivos)

| Executivo | Blocos | KPI Principal |
|-----------|--------|---------------|
| **CEO** | 1, 6 | Penetração ≥ 2.5 |
| **CRO** | 1, 2 | Pipeline ≥ 3.000, Conversão ≥ 60% |
| **COO** | 3 | Giro ≥ 6x, Rupturas S4-S5 = 0 |
| **CFO** | 4 | Margem ≥ 25%, DSO ≤ 45 |
| **CAIO** | 5 | Performance IA ≥ 90%, Drift < 5% |

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Meta 30.000 Máquinas/Ano*

**Última atualização:** 2026-01-15  
**Próxima revisão:** 2026-02-15
