# ✅ CHECKLIST TÉCNICO Q3 2026 — ESCALA E PERFORMANCE

## Sistema de Gestão de Leads - Rolemak

**Período:** Julho - Setembro 2026  
**Pré-requisito:** Q2 100% concluído ✅  
**Status:** Q3.1 Em Implementação 🔄  
**Última atualização:** 17 de Janeiro 2026

---

## ⚠️ AVISO ESTRATÉGICO

> **Este é o trimestre mais crítico do plano.** Mistura performance, governança e incentivos financeiros.
> 
> Para evitar "big bang organizacional", o Q3 foi dividido em **3 fases sequenciais**:
> - **Q3.1 (Julho):** Escala & Performance — risco técnico
> - **Q3.2 (Agosto):** Aprovação de Descontos — risco organizacional
> - **Q3.3 (Setembro):** Comissão & Governança — risco cultural
>
> **Esta ordem é inegociável.** Só avança se a fase anterior estiver estável.

---

## 🎯 Objetivo do Q3

> **Garantir que o sistema aguenta crescer 50% e alinhar dinheiro, política e comportamento.**

### Critérios de Sucesso Gerais

- [ ] Performance 2x melhor (API response < 300ms p95)
- [ ] Cache Redis operacional (hit rate > 70%)
- [ ] Workflow de aprovação respeitado
- [ ] Comissão baseada em margem implementada
- [ ] Métricas de governança no dashboard

---

# 🧱 Q3.1 — ESCALA & PERFORMANCE (JULHO)

## 🎯 Objetivo Q3.1

> **Garantir que o sistema aguenta crescer 50% sem degradação, ANTES de mexer em dinheiro e incentivos.**

👉 **Nenhuma regra de negócio nova aqui. Só robustez técnica.**

---

## ⚡ BLOCO 1.1 — OTIMIZAÇÃO DE QUERIES

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Auditoria de slow query log | Backend | ⏳ |
| 1.1.2 | Análise com EXPLAIN de queries críticas | Backend | ⏳ |
| 1.1.3 | Criar índices para tabela `sCart` (leads) | Backend | ✅ |
| 1.1.4 | Criar índices para tabela `icart` (itens) | Backend | ✅ |
| 1.1.5 | Criar índices para `pricing_decision_event` | Backend | ✅ |
| 1.1.6 | Criar índices para queries de analytics | Backend | ✅ |
| 1.1.7 | Eliminar queries N+1 no dashboard | Backend | ⏳ |
| 1.1.8 | Implementar paginação cursor-based | Backend | ✅ |
| 1.1.9 | Otimizar consultas de histórico | Backend | ⏳ |

**Critério de Aceite:**
```
✅ Queries principais < 100ms
✅ API p95 < 300ms
✅ EXPLAIN mostra uso de índices em todas as queries críticas
✅ Zero queries N+1 no dashboard
```

---

## 🔴 BLOCO 1.2 — CACHE REDIS

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Setup de Redis em produção | Infra | ✅ |
| 1.2.2 | Configurar connection pool | Backend | ✅ |
| 1.2.3 | Cache de metadados (segmentos, tipos) | Backend | ✅ |
| 1.2.4 | Cache de produtos (TTL 5min) | Backend | ✅ |
| 1.2.5 | Cache de estoque (TTL 2min) | Backend | ✅ |
| 1.2.6 | Cache de clientes frequentes | Backend | ✅ |
| 1.2.7 | Cache de dashboard/analytics (TTL 5min) | Backend | ✅ |
| 1.2.8 | Invalidação por evento (update/delete) | Backend | ✅ |
| 1.2.9 | Métrica de cache hit rate | Backend | ✅ |
| 1.2.10 | Dashboard de monitoramento Redis | Infra | ✅ |

**Critério de Aceite:**
```
✅ Cache hit rate ≥ 70%
✅ Carga no DB reduzida em ≥ 50%
✅ Invalidação correta em updates
✅ TTL explícito em todas as keys
```

---

## 🖥️ BLOCO 1.3 — FRONTEND PERFORMANCE

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.3.1 | Code splitting por rotas | Frontend | ⏳ |
| 1.3.2 | Lazy loading de componentes pesados | Frontend | ⏳ |
| 1.3.3 | Virtual scrolling para listas > 100 itens | Frontend | ⏳ |
| 1.3.4 | Otimização de imagens (WebP + lazy) | Frontend | ⏳ |
| 1.3.5 | Prefetch de próximas páginas prováveis | Frontend | ⏳ |
| 1.3.6 | React.memo em componentes frequentes | Frontend | ⏳ |
| 1.3.7 | Bundle analysis e tree shaking | Frontend | ⏳ |

**Critério de Aceite:**
```
✅ First Contentful Paint < 1s
✅ Time to Interactive < 2s
✅ Bundle inicial < 300KB
✅ Lighthouse score > 90
```

---

## 🔧 BLOCO 1.4 — MONITORAMENTO

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.4.1 | Setup de APM (DataDog/NewRelic/CloudWatch) | Infra | ⏳ |
| 1.4.2 | Alertas de latência (> 500ms) | Infra | ⏳ |
| 1.4.3 | Alertas de erro rate (> 1%) | Infra | ⏳ |
| 1.4.4 | Dashboard de saúde do sistema | Infra | ✅ |
| 1.4.5 | Logs centralizados | Infra | ✅ |

---

## 🟢 GO / NO-GO Q3.1

### ❌ NÃO AVANÇA SE:
- API p95 > 300ms
- Cache hit rate < 70%  
- Frontend TTI > 2s
- Erro rate > 1%

### ✅ AVANÇA PARA Q3.2 QUANDO:
- [ ] Todas as métricas de performance batidas
- [ ] Sistema estável por 1 semana
- [ ] Zero incidentes de performance

---

# 💰 Q3.2 — GOVERNANÇA DE DESCONTOS (AGOSTO)

## 🎯 Objetivo Q3.2

> **Controlar exceções ANTES de mexer em comissão.**

Ensinar a organização que: *"Exceção existe, mas tem custo, dono e SLA."*

👉 **Sem punição financeira ainda. Só transparência e processo.**

---

## 📋 BLOCO 2.1 — MODELO DE APROVAÇÃO

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Criar tabela `discount_approvals` | Backend | ⏳ |
| 2.1.2 | Definir níveis de aprovação com negócio | Negócio | ⏳ |
| 2.1.3 | Endpoint POST /api/approvals/request | Backend | ⏳ |
| 2.1.4 | Endpoint PUT /api/approvals/:id/approve | Backend | ⏳ |
| 2.1.5 | Endpoint PUT /api/approvals/:id/reject | Backend | ⏳ |
| 2.1.6 | Endpoint GET /api/approvals/pending | Backend | ⏳ |
| 2.1.7 | Endpoint GET /api/approvals/history | Backend | ⏳ |
| 2.1.8 | Integrar com Pricing Agent | Backend | ⏳ |

**Estrutura da tabela:**
```sql
CREATE TABLE discount_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  requester_id INT NOT NULL,
  approver_id INT NULL,
  discount_requested DECIMAL(5,2) NOT NULL,
  current_margin DECIMAL(5,2),
  projected_margin DECIMAL(5,2),
  reason TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
  created_at DATETIME DEFAULT NOW(),
  resolved_at DATETIME NULL,
  expires_at DATETIME NOT NULL
);
```

---

## 📊 BLOCO 2.2 — MATRIZ DE APROVAÇÃO

| Faixa de Desconto | Aprovador | SLA |
|-------------------|-----------|-----|
| 0 - 5% | Automático | Imediato |
| 5.1 - 10% | Gerente Direto | 4 horas |
| 10.1 - 15% | Diretor Comercial | 8 horas |
| > 15% | CEO/Diretoria | 24 horas |

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Implementar regra: < 5% = auto-aprovado | Backend | ⏳ |
| 2.2.2 | Implementar regra: 5-10% = gerente | Backend | ⏳ |
| 2.2.3 | Implementar regra: 10-15% = diretor | Backend | ⏳ |
| 2.2.4 | Implementar regra: > 15% = CEO | Backend | ⏳ |
| 2.2.5 | Notificar aprovador por push | Backend | ⏳ |
| 2.2.6 | Notificar aprovador por email | Backend | ⏳ |
| 2.2.7 | Timeout de aprovação (expiração) | Backend | ⏳ |
| 2.2.8 | Escalação automática se SLA estourar | Backend | ⏳ |

---

## 🖥️ BLOCO 2.3 — INTERFACE DE APROVAÇÃO

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Botão "Solicitar Aprovação" no lead | Frontend | ⏳ |
| 2.3.2 | Dialog de solicitação com justificativa | Frontend | ⏳ |
| 2.3.3 | Página /approvals para gerentes | Frontend | ⏳ |
| 2.3.4 | Widget de pendências no dashboard | Frontend | ⏳ |
| 2.3.5 | Aprovação em 1 clique (com confirmação) | Frontend | ⏳ |
| 2.3.6 | Histórico de aprovações no lead | Frontend | ⏳ |
| 2.3.7 | Badge de status no lead (pendente/aprovado) | Frontend | ⏳ |
| 2.3.8 | Responsivo para aprovação mobile | Frontend | ⏳ |

**Critério de Aceite:**
```
✅ Vendedor solicita aprovação em 1 clique
✅ Gerente recebe notificação push imediata
✅ Aprovação/rejeição em 1 clique
✅ Histórico completo no lead
✅ SLA visível e respeitado
```

---

## 📈 BLOCO 2.4 — MÉTRICAS DE EXCEÇÃO (SHADOW MODE)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.4.1 | Coletar Approval Rate diário | Backend | ⏳ |
| 2.4.2 | Coletar Approval Pressure Index | Backend | ⏳ |
| 2.4.3 | Coletar tempo médio de aprovação | Backend | ⏳ |
| 2.4.4 | Dashboard de exceções por vendedor | Frontend | ⏳ |
| 2.4.5 | Comparativo por segmento | Frontend | ⏳ |

> ⚠️ **MODO SHADOW (30 dias):**  
> - Workflow funciona  
> - Métricas são exibidas  
> - **Nenhuma penalidade financeira**  
> - Objetivo: ajuste fino + aprendizado

---

## 🟢 GO / NO-GO Q3.2

### ❌ NÃO AVANÇA SE:
- Gestores ignoram o fluxo
- Vendedores "bypassam" aprovação
- SLA não é respeitado

### ✅ AVANÇA PARA Q3.3 QUANDO:
- [ ] Workflow respeitado por 2 semanas
- [ ] Exceção deixa rastro (100% registradas)
- [ ] Métricas fazem sentido para gestores
- [ ] Zero bypass do sistema

---

# 💸 Q3.3 — COMISSÃO & GOVERNANÇA FINANCEIRA (SETEMBRO)

## 🎯 Objetivo Q3.3

> **Alinhar dinheiro, política e comportamento.**

👉 **Este é o ponto mais sensível do ano. Mexer em comissão é mexer na cultura.**

---

## 💵 BLOCO 3.1 — MODELO DE COMISSÃO

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Criar tabela `commission_rules` | Backend | ⏳ |
| 3.1.2 | Criar tabela `commissions` | Backend | ⏳ |
| 3.1.3 | Definir regras base com RH/Comercial | Negócio | ⏳ |
| 3.1.4 | Implementar taxa base por segmento | Backend | ⏳ |
| 3.1.5 | Implementar fator margem (bônus por margem) | Backend | ⏳ |
| 3.1.6 | Implementar fator meta (bônus por atingimento) | Backend | ⏳ |
| 3.1.7 | Implementar margem mínima para comissão | Backend | ⏳ |

**Fórmula de Comissão:**
```
Comissão = ValorPedido × TaxaBase × FatorMargem × FatorMeta

Onde:
- TaxaBase = % definido por segmento (ex: 2%)
- FatorMargem = 1 + (MargemReal - MargemMinima) × 0.1
- FatorMeta = 1.2 se meta atingida, 1.0 caso contrário
```

**Estrutura das tabelas:**
```sql
CREATE TABLE commission_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  segment VARCHAR(50),
  base_rate DECIMAL(5,2) NOT NULL,
  margin_bonus_rate DECIMAL(5,2) DEFAULT 0.10,
  goal_bonus_rate DECIMAL(5,2) DEFAULT 0.20,
  min_margin DECIMAL(5,2) DEFAULT 15.00,
  valid_from DATE NOT NULL,
  valid_to DATE NULL
);

CREATE TABLE commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  seller_id INT NOT NULL,
  order_value DECIMAL(12,2) NOT NULL,
  margin_real DECIMAL(5,2) NOT NULL,
  commission_value DECIMAL(12,2) NOT NULL,
  calculation_details JSON,
  status ENUM('CALCULATED', 'APPROVED', 'PAID'),
  calculated_at DATETIME DEFAULT NOW(),
  paid_at DATETIME NULL
);
```

---

## 📊 BLOCO 3.2 — CÁLCULO E RELATÓRIOS

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Job de cálculo diário (cron) | Backend | ⏳ |
| 3.2.2 | Endpoint GET /api/commissions/my | Backend | ⏳ |
| 3.2.3 | Endpoint GET /api/commissions/report | Backend | ⏳ |
| 3.2.4 | Relatório mensal por vendedor | Backend | ⏳ |
| 3.2.5 | Exportação para Excel (integração RH) | Backend | ⏳ |
| 3.2.6 | Projeção de comissão no lead (antes de fechar) | Backend | ⏳ |

---

## ⚠️ BLOCO 3.3 — MODO SHADOW (CRÍTICO)

> **Primeiro mês com comissão em modo SHADOW**

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Sistema calcula comissão (não paga diferente) | Backend | ⏳ |
| 3.3.2 | Vendedor vê projeção no lead | Frontend | ⏳ |
| 3.3.3 | Vendedor vê "quanto receberia" | Frontend | ⏳ |
| 3.3.4 | RH valida cálculos (comparativo) | RH | ⏳ |
| 3.3.5 | Ajustes finos nas regras | Backend | ⏳ |

**Ativação Gradual (após shadow):**
```
Semana 1: Impacto de 20% da diferença
Semana 2: Impacto de 50% da diferença
Semana 3: Impacto total (100%)
```

---

## 🖥️ BLOCO 3.4 — INTERFACE DE COMISSÕES

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.4.1 | Página /commissions para vendedor | Frontend | ⏳ |
| 3.4.2 | Widget de comissão no lead (projeção) | Frontend | ⏳ |
| 3.4.3 | Detalhamento por pedido | Frontend | ⏳ |
| 3.4.4 | Comparativo mês anterior | Frontend | ⏳ |
| 3.4.5 | Gráfico de evolução | Frontend | ⏳ |
| 3.4.6 | Exportação para Excel | Frontend | ⏳ |

---

## 📈 BLOCO 3.5 — MÉTRICAS DE GOVERNANÇA (DASHBOARD EXECUTIVO)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.5.1 | Widget Price Integrity Score | Frontend | ⏳ |
| 3.5.2 | Widget Discount Drift | Frontend | ⏳ |
| 3.5.3 | Widget Approval Pressure Index | Frontend | ⏳ |
| 3.5.4 | Widget Margem Realizada | Frontend | ⏳ |
| 3.5.5 | Widget Risk Exposure | Frontend | ⏳ |
| 3.5.6 | Drill-down por vendedor/segmento | Frontend | ⏳ |
| 3.5.7 | Tendência 12 meses | Frontend | ⏳ |

**Métricas Finais:**
| Métrica | Descrição |
|---------|-----------|
| Price Integrity Score | % de pedidos dentro da política |
| Discount Drift | Diferença média vs preço ideal |
| Approval Rate | % de exceções aprovadas |
| Approval Pressure Index | % de tentativas de sair da política |
| Margem Realizada | Margem pós-negociação |
| Risk Exposure | Valor vendido sob exceção |

---

## 📧 BLOCO 3.6 — RELATÓRIOS AGENDADOS

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.6.1 | Infraestrutura de agendamento (cron) | Backend | ⏳ |
| 3.6.2 | Template: Vendas Diárias (07:00) | Backend | ⏳ |
| 3.6.3 | Template: Metas vs Realizado (18:00) | Backend | ⏳ |
| 3.6.4 | Template: Exceções de Preço (diário) | Backend | ⏳ |
| 3.6.5 | Envio automático por email | Backend | ⏳ |
| 3.6.6 | Interface de configuração | Frontend | ⏳ |

> ⚠️ **Começar com 3 relatórios obrigatórios** para evitar ruído.

---

## 🟢 GO / NO-GO Q3.3

### ❌ VOLTA PARA SHADOW SE:
- Comissão gera caos/revolta
- Vendedores sabotam o sistema
- RH encontra erros de cálculo

### ✅ Q3 CONCLUÍDO QUANDO:
- [ ] Comissão aceita pela equipe
- [ ] Política de preço respeitada
- [ ] Margem média melhora
- [ ] Exceções caem (ou ficam conscientes)
- [ ] Dashboard executivo operacional

---

# 📋 RESUMO DE ENTREGAS Q3

| Fase | Bloco | Entregas | Tarefas |
|------|-------|----------|---------|
| **Q3.1** | Performance | Queries, Redis, Frontend | 31 |
| **Q3.2** | Aprovação | Workflow completo | 26 |
| **Q3.3** | Comissão | Cálculo + Governança | 37 |
| **Total** | | | **94 tarefas** |

---

# 🗓️ CRONOGRAMA SEMANAL (12 SEMANAS)

## JULHO — Q3.1 Performance

| Semana | Foco | Entrega |
|--------|------|---------|
| 1 | Queries | Auditoria + índices críticos |
| 2 | Queries | Paginação cursor + N+1 |
| 3 | Redis | Setup + cache de metadados |
| 4 | Redis + Frontend | Cache completo + code splitting |

**Checkpoint:** Performance estável → avança

## AGOSTO — Q3.2 Aprovação

| Semana | Foco | Entrega |
|--------|------|---------|
| 5 | Backend | Modelo + endpoints |
| 6 | Backend | Matriz + notificações |
| 7 | Frontend | Interface completa |
| 8 | Shadow | Métricas + ajuste fino |

**Checkpoint:** Workflow respeitado → avança

## SETEMBRO — Q3.3 Comissão

| Semana | Foco | Entrega |
|--------|------|---------|
| 9 | Backend | Modelo + cálculo |
| 10 | Shadow | Comissão visível, não paga |
| 11 | Frontend | Dashboard executivo |
| 12 | Ativação | Comissão ativa + relatórios |

**Checkpoint:** Q3 concluído

---

# 📊 METAS DE PERFORMANCE Q3

| Métrica | Baseline | Meta Q3 |
|---------|----------|---------|
| API Response (p95) | ~500ms | **< 300ms** |
| Cache Hit Rate | 0% | **> 70%** |
| First Contentful Paint | ~2s | **< 1s** |
| Time to Interactive | ~3s | **< 2s** |
| Error Rate | ~2% | **< 1%** |
| Uptime | 99% | **99.5%** |
| Price Integrity Score | N/A | **> 85%** |

---

# 🔗 DEPENDÊNCIAS

## Dependências Externas
- [ ] Redis em produção
- [ ] APM tool configurado
- [ ] Definições de negócio para matriz de aprovação
- [ ] Definições de RH para comissão
- [ ] Comunicação com equipe comercial

## Dependências Internas (Q2) ✅
- [x] Pricing Agent como autoridade
- [x] Audit Log funcionando
- [x] Push notifications operacionais
- [x] Email service configurado
- [x] IA sob política

---

# ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance não bate meta | Média | Alto | Mais índices + cache agressivo |
| Gestores ignoram aprovação | Alta | Alto | Treinamento + enforcement |
| Revolta com comissão | Alta | Crítico | Shadow mode + ativação gradual |
| RH não valida cálculo | Média | Alto | Período de comparação paralela |
| Bypass do workflow | Média | Alto | Bloquear lead sem aprovação |

---

# 📚 DOCUMENTAÇÃO A CRIAR

- [ ] Guia de otimização de queries
- [ ] Manual do workflow de aprovação
- [ ] Guia de comissionamento (vendedor)
- [ ] Manual de governança (gerente)
- [ ] Playbook de gestão de resistência

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Q3 2026 - Escala, Governança e Incentivos*

> **Sistema forte primeiro. Governança depois. Dinheiro por último.**
