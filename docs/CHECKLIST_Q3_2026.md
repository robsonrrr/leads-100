# ✅ CHECKLIST TÉCNICO Q3 2026 — ESCALA E PERFORMANCE

## Sistema de Gestão de Leads - Rolemak

**Período:** Julho - Setembro 2026  
**Pré-requisito:** Q2 100% concluído ✅  
**Status:** Planejado ⏳  
**Última atualização:** 17 de Janeiro 2026

---

## 🎯 Objetivo do Q3

> **Otimizar performance, implementar integrações críticas e escalar a plataforma para suportar crescimento de 50% em vendas.**

### Critérios de Sucesso

- [ ] Performance 2x melhor (API response < 300ms p95)
- [ ] Workflow de aprovação de descontos funcionando
- [ ] Comissionamento automático implementado
- [ ] Relatórios agendados por email
- [ ] Cache Redis operacional
- [ ] Métricas de integridade de preço no dashboard

---

## ⚡ BLOCO 1 — OTIMIZAÇÃO DE PERFORMANCE

### 1.1 Otimização de Queries

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Análise de queries lentas (EXPLAIN) | Backend | ⏳ |
| 1.1.2 | Criar índices para tabelas principais | Backend | ⏳ |
| 1.1.3 | Otimizar queries de listagem de leads | Backend | ⏳ |
| 1.1.4 | Otimizar queries de analytics/dashboard | Backend | ⏳ |
| 1.1.5 | Implementar paginação cursor-based | Backend | ⏳ |
| 1.1.6 | Otimizar consultas de histórico | Backend | ⏳ |

**Critério de Aceite:**
```
➡️ Queries principais < 100ms
➡️ EXPLAIN mostra uso de índices
➡️ Paginação eficiente para listas grandes
```

---

### 1.2 Cache Redis

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Setup de Redis em produção | Infra | ⏳ |
| 1.2.2 | Implementar cache de metadados | Backend | ⏳ |
| 1.2.3 | Cache de produtos/estoque (TTL 5min) | Backend | ⏳ |
| 1.2.4 | Cache de clientes frequentes | Backend | ⏳ |
| 1.2.5 | Cache de dashboard/analytics | Backend | ⏳ |
| 1.2.6 | Invalidação inteligente de cache | Backend | ⏳ |
| 1.2.7 | Monitoramento de hit rate | Backend | ⏳ |

**Critério de Aceite:**
```
➡️ Cache hit rate > 70%
➡️ Redução de 50% na carga do DB
➡️ Invalidação correta em updates
```

---

### 1.3 Otimização de Frontend

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.3.1 | Code splitting por rotas | Frontend | ⏳ |
| 1.3.2 | Lazy loading de componentes pesados | Frontend | ⏳ |
| 1.3.3 | Virtual scrolling para listas grandes | Frontend | ⏳ |
| 1.3.4 | Otimização de imagens (WebP) | Frontend | ⏳ |
| 1.3.5 | Prefetch de próximas páginas | Frontend | ⏳ |
| 1.3.6 | Memoization agressiva (React.memo) | Frontend | ⏳ |

**Critério de Aceite:**
```
➡️ First Contentful Paint < 1s
➡️ Time to Interactive < 2s
➡️ Bundle inicial < 300KB
```

---

## 💰 BLOCO 2 — WORKFLOW DE APROVAÇÃO DE DESCONTOS

### 2.1 Backend - Modelo de Aprovação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Criar tabela `discount_approvals` | Backend | ⏳ |
| 2.1.2 | Definir níveis de aprovação | Backend | ⏳ |
| 2.1.3 | Endpoint POST /api/approvals/request | Backend | ⏳ |
| 2.1.4 | Endpoint PUT /api/approvals/:id/approve | Backend | ⏳ |
| 2.1.5 | Endpoint PUT /api/approvals/:id/reject | Backend | ⏳ |
| 2.1.6 | Endpoint GET /api/approvals/pending | Backend | ⏳ |
| 2.1.7 | Integrar com Pricing Agent | Backend | ⏳ |

**Estrutura de Aprovação:**
```javascript
{
  id: number,
  leadId: number,
  requesterId: number,
  approverId: number | null,
  discountRequested: number, // %
  currentMargin: number,
  projectedMargin: number,
  reason: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  createdAt: datetime,
  resolvedAt: datetime | null
}
```

---

### 2.2 Regras de Aprovação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Definir matriz de aprovação por desconto | Negócio | ⏳ |
| 2.2.2 | Implementar regra: < 5% = auto-aprovado | Backend | ⏳ |
| 2.2.3 | Implementar regra: 5-10% = gerente | Backend | ⏳ |
| 2.2.4 | Implementar regra: 10-15% = diretor | Backend | ⏳ |
| 2.2.5 | Implementar regra: > 15% = CEO | Backend | ⏳ |
| 2.2.6 | Notificar aprovador por push/email | Backend | ⏳ |
| 2.2.7 | Timeout de aprovação (24h) | Backend | ⏳ |

**Matriz de Aprovação:**
```
| Desconto    | Aprovador        | SLA      |
|-------------|------------------|----------|
| 0-5%        | Automático       | Imediato |
| 5.1-10%     | Gerente Direto   | 4 horas  |
| 10.1-15%    | Diretor Comercial| 8 horas  |
| > 15%       | CEO/Diretoria    | 24 horas |
```

---

### 2.3 Frontend - Interface de Aprovação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Componente ApprovalRequestDialog | Frontend | ⏳ |
| 2.3.2 | Página de aprovações pendentes | Frontend | ⏳ |
| 2.3.3 | Widget de aprovações no dashboard | Frontend | ⏳ |
| 2.3.4 | Notificação visual de pendências | Frontend | ⏳ |
| 2.3.5 | Histórico de aprovações por lead | Frontend | ⏳ |
| 2.3.6 | Mobile-friendly approval flow | Frontend | ⏳ |

**Critério de Aceite:**
```
➡️ Vendedor pode solicitar aprovação
➡️ Gerente recebe notificação push
➡️ Aprovação/rejeição em 1 clique
➡️ Histórico completo de aprovações
```

---

## 💵 BLOCO 3 — COMISSIONAMENTO AUTOMÁTICO

### 3.1 Modelo de Comissão

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Criar tabela `commission_rules` | Backend | ⏳ |
| 3.1.2 | Criar tabela `commissions` | Backend | ⏳ |
| 3.1.3 | Definir regras base de comissão | Negócio | ⏳ |
| 3.1.4 | Implementar cálculo por segmento | Backend | ⏳ |
| 3.1.5 | Implementar cálculo por margem | Backend | ⏳ |
| 3.1.6 | Implementar bônus por meta atingida | Backend | ⏳ |

**Estrutura de Regra:**
```javascript
{
  id: number,
  segment: string,
  baseRate: number, // % base
  marginBonus: number, // % extra por margem
  goalBonus: number, // % extra por meta
  minMargin: number, // margem mínima para comissão
  validFrom: date,
  validTo: date | null
}
```

---

### 3.2 Cálculo e Relatórios

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Endpoint GET /api/commissions/calculate | Backend | ⏳ |
| 3.2.2 | Endpoint GET /api/commissions/report | Backend | ⏳ |
| 3.2.3 | Cálculo diário automático (cron) | Backend | ⏳ |
| 3.2.4 | Relatório mensal por vendedor | Backend | ⏳ |
| 3.2.5 | Exportação para integração com folha | Backend | ⏳ |
| 3.2.6 | Dashboard de comissões | Frontend | ⏳ |

**Fórmula Base:**
```
Comissão = ValorPedido × TaxaBase × FatorMargem × FatorMeta

Onde:
- TaxaBase = % definido por segmento
- FatorMargem = 1 + (MargemReal - MargemMinima) × 0.1
- FatorMeta = 1.2 se meta atingida, 1.0 caso contrário
```

---

### 3.3 Interface de Comissões

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Página /commissions para vendedor | Frontend | ⏳ |
| 3.3.2 | Detalhamento por pedido | Frontend | ⏳ |
| 3.3.3 | Projeção de comissão no lead | Frontend | ⏳ |
| 3.3.4 | Comparativo mensal | Frontend | ⏳ |
| 3.3.5 | Exportação para Excel | Frontend | ⏳ |

**Critério de Aceite:**
```
➡️ Vendedor vê comissão estimada no lead
➡️ Relatório mensal automático
➡️ Cálculo considera margem real
➡️ Exportação para RH/Financeiro
```

---

## 📧 BLOCO 4 — RELATÓRIOS AGENDADOS

### 4.1 Infraestrutura de Agendamento

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Criar tabela `scheduled_reports` | Backend | ⏳ |
| 4.1.2 | Implementar job scheduler (cron) | Backend | ⏳ |
| 4.1.3 | Fila de processamento de relatórios | Backend | ⏳ |
| 4.1.4 | Geração assíncrona de PDFs | Backend | ⏳ |
| 4.1.5 | Envio de email com anexo | Backend | ⏳ |

**Tipos de Relatório:**
```
- Vendas Diárias (07:00)
- Resumo Semanal (segunda 08:00)
- Fechamento Mensal (dia 1 às 09:00)
- Metas vs Realizados (diário 18:00)
- Leads Pendentes (diário 09:00)
```

---

### 4.2 Templates de Relatório

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Template: Vendas do Dia | Backend | ⏳ |
| 4.2.2 | Template: Resumo Semanal | Backend | ⏳ |
| 4.2.3 | Template: Metas vs Realizado | Backend | ⏳ |
| 4.2.4 | Template: Leads Pendentes | Backend | ⏳ |
| 4.2.5 | Template: Clientes em Risco | Backend | ⏳ |
| 4.2.6 | Template: Comissões do Mês | Backend | ⏳ |

---

### 4.3 Interface de Agendamento

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.3.1 | Página /reports/scheduled | Frontend | ⏳ |
| 4.3.2 | Formulário de agendamento | Frontend | ⏳ |
| 4.3.3 | Lista de relatórios agendados | Frontend | ⏳ |
| 4.3.4 | Histórico de envios | Frontend | ⏳ |
| 4.3.5 | Preview antes de agendar | Frontend | ⏳ |

**Critério de Aceite:**
```
➡️ Usuário pode agendar qualquer relatório
➡️ Email chega no horário configurado
➡️ PDF/Excel anexado corretamente
➡️ Histórico de envios disponível
```

---

## 📊 BLOCO 5 — MÉTRICAS DE INTEGRIDADE DE PREÇO

### 5.1 Coleta de Dados

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Criar tabela `pricing_metrics` | Backend | ⏳ |
| 5.1.2 | Coletar Price Integrity Score diário | Backend | ⏳ |
| 5.1.3 | Coletar Discount Drift | Backend | ⏳ |
| 5.1.4 | Coletar Approval Rate | Backend | ⏳ |
| 5.1.5 | Coletar Approval Pressure Index | Backend | ⏳ |
| 5.1.6 | Coletar Risk Exposure | Backend | ⏳ |

**Métricas:**
```
| Métrica                  | Descrição                           |
|--------------------------|-------------------------------------|
| Price Integrity Score    | % de pedidos dentro da política     |
| Discount Drift           | Diferença média vs preço ideal      |
| Approval Rate            | % de exceções aprovadas             |
| Approval Pressure Index  | % de tentativas de sair da política |
| Margem Realizada         | Margem pós-negociação               |
| Risk Exposure            | Valor vendido sob exceção           |
```

---

### 5.2 Dashboard de Governança

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Widget Price Integrity Score | Frontend | ⏳ |
| 5.2.2 | Widget Discount Drift | Frontend | ⏳ |
| 5.2.3 | Widget Approval Pressure | Frontend | ⏳ |
| 5.2.4 | Comparativo por vendedor | Frontend | ⏳ |
| 5.2.5 | Comparativo por segmento | Frontend | ⏳ |
| 5.2.6 | Tendência mensal | Frontend | ⏳ |

**Critério de Aceite:**
```
➡️ Dashboard gerencial com KPIs de preço
➡️ Drill-down por vendedor/segmento
➡️ Alertas para desvios críticos
➡️ Histórico de 12 meses
```

---

## 🔧 BLOCO 6 — INFRAESTRUTURA E MONITORAMENTO

### 6.1 Monitoramento e Alertas

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Setup de APM (DataDog/NewRelic) | Infra | ⏳ |
| 6.1.2 | Alertas de latência (> 500ms) | Infra | ⏳ |
| 6.1.3 | Alertas de erro rate (> 1%) | Infra | ⏳ |
| 6.1.4 | Dashboard de saúde do sistema | Infra | ⏳ |
| 6.1.5 | Logs centralizados (ELK/CloudWatch) | Infra | ⏳ |
| 6.1.6 | Métricas de negócio em tempo real | Backend | ⏳ |

---

### 6.2 Escalabilidade

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Avaliar auto-scaling | Infra | ⏳ |
| 6.2.2 | Load balancer configurado | Infra | ⏳ |
| 6.2.3 | Read replicas para MySQL | Infra | ⏳ |
| 6.2.4 | CDN para assets estáticos | Infra | ⏳ |
| 6.2.5 | Backup automatizado | Infra | ⏳ |

---

## 📋 RESUMO DE ENTREGAS Q3

| Bloco | Entregas | Tarefas |
|-------|----------|---------|
| 1. Performance | Queries otimizadas, Cache Redis, Frontend otimizado | 19 |
| 2. Aprovação | Workflow completo de aprovação de descontos | 20 |
| 3. Comissões | Cálculo automático e relatórios | 17 |
| 4. Relatórios | Agendamento e envio automático | 15 |
| 5. Métricas | KPIs de governança de preço | 12 |
| 6. Infra | Monitoramento e escalabilidade | 11 |
| **Total** | | **94 tarefas** |

---

## 🗓️ CRONOGRAMA SUGERIDO

| Semana | Bloco Principal | Entregas |
|--------|-----------------|----------|
| 1-2 | Performance | Queries otimizadas, índices |
| 3-4 | Performance | Cache Redis operacional |
| 5-6 | Aprovação | Workflow de descontos |
| 7-8 | Comissões | Cálculo automático |
| 9-10 | Relatórios | Agendamento funcionando |
| 11-12 | Métricas + Infra | Dashboard de governança |

---

## 📊 METAS DE PERFORMANCE

| Métrica | Atual | Meta Q3 |
|---------|-------|---------|
| API Response (p95) | ~500ms | < 300ms |
| Time to Interactive | ~3s | < 2s |
| Cache Hit Rate | 0% | > 70% |
| Error Rate | ~2% | < 1% |
| Uptime | 99% | 99.5% |

---

## 🔗 DEPENDÊNCIAS

### Dependências Externas
- [ ] Redis em produção
- [ ] APM tool configurado
- [ ] Definições de negócio para comissões
- [ ] Matriz de aprovação definida

### Dependências Internas (Q2)
- [x] Audit Log funcionando
- [x] Pricing Agent como autoridade
- [x] Push notifications operacionais
- [x] Email service configurado

---

## 📚 DOCUMENTAÇÃO A CRIAR

- [ ] Guia de otimização de queries
- [ ] Documentação do workflow de aprovação
- [ ] Manual de comissionamento
- [ ] Guia de relatórios agendados
- [ ] Dashboard de métricas (manual do gerente)

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Q3 2026 - Escala e Performance*
