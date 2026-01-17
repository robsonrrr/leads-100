# ✅ CHECKLIST TÉCNICO — METAS POR CLIENTE (PÁGINA DEDICADA)

## Sistema de Gestão de Leads - Rolemak

**Foco:** Vendedor (mês atual como padrão)  
**Objetivo:** Aumentar **penetração mensal** (mais clientes comprando no mês) e acelerar execução do vendedor  
**Página:** `/metas-por-cliente`  
**Última atualização:** Janeiro 2026

---

## 🎯 Objetivo Central

> Transformar “Metas por Cliente” em uma **lista de ataque do mês** para o vendedor:
> - Priorizar clientes **sem compra no mês**
> - Evidenciar **gap** e oportunidade
> - Permitir ação em 1 clique (abrir cliente / iniciar follow-up)

---

## 📌 Definições (Penetração)

**Penetração do mês (vendedor):**

```
Penetração = Clientes que compraram no mês / Total de clientes (com meta / na carteira definida)
```

**Critério operacional:**
- Cliente “ativo no mês” = `sold_month > 0`

---

## ✅ BLOCO 1 — BACKEND (DADOS PARA PENETRAÇÃO)

### 1.1 Endpoint Metas por Cliente com parâmetro de mês
- [ ] Adicionar suporte a `month` e `year` no endpoint:
  - `GET /api/v2/analytics/goals/seller/:sellerId?year=YYYY&month=MM&classification=A|B|C|I&limit=XX`

**Aceite:**
- `month` default = mês atual quando não informado
- `year` default = ano atual quando não informado

### 1.2 Retornar métricas mensais por cliente
- [ ] Incluir no payload de cada cliente:
  - [ ] `sold_month`
  - [ ] `last_purchase_date`
  - [ ] `is_active_month`

**Aceite:**
- `sold_month` reflete somente vendas do mês
- `is_active_month` é `true` quando `sold_month > 0`

### 1.3 Resumo de penetração no response
- [ ] Incluir no response (`totals` ou `summary`) agregados:
  - [ ] `penetration_month_pct`
  - [ ] `active_customers_month`
  - [ ] `total_customers`

**Aceite:**
- Percentual calculado corretamente
- Não retorna `NaN`/null sem fallback

### 1.4 Paginação e ordenação (preparar para lista grande)
- [ ] Suportar paginação:
  - [ ] `limit`
  - [ ] `offset` (ou `page`)
- [ ] Suportar ordenação:
  - [ ] `order_by` = `penetration_priority | gap | goal | achievement`

**Aceite:**
- 300+ clientes com resposta previsível e performance aceitável

---

## ✅ BLOCO 2 — FRONTEND (PÁGINA DEDICADA)

### 2.1 Página dedicada e acesso
- [x] Rota top-level `/metas-por-cliente`
- [x] Item no menu lateral “Metas por Cliente”

**Aceite:**
- Acessível sem passar pelo Dashboard

### 2.2 Controles do mês (mês atual como padrão)
- [ ] Seletor de `Mês` (default mês atual)
- [ ] Seletor de `Ano` (default ano atual)
- [ ] Botão `Atualizar`

**Aceite:**
- Ao abrir a página, carrega mês atual automaticamente

### 2.3 Cards (topo) focados em penetração
- [ ] Card: `Penetração do mês`
- [ ] Card: `Sem compra no mês`
- [ ] Card: `Compraram no mês`
- [ ] Card: `Meta vs Vendido (anual)` ou `Gap total`

**Aceite:**
- 1º bloco da página responde “como está a penetração agora?”

### 2.4 Filtros operacionais (lista de ataque)
- [ ] Filtro por `Classificação` (A/B/C/I)
- [ ] Filtro por `Status do mês`:
  - [ ] `Sem compra no mês`
  - [ ] `Comprou no mês`
- [ ] Filtro por `Gap`:
  - [ ] `Gap > 0`
  - [ ] `Meta atingida`
- [ ] Busca por `nome do cliente` (client-side)

**Aceite:**
- Em 10 segundos o vendedor monta “lista de ataque do mês”

### 2.5 Ordenação default “Prioridade Penetração”
- [ ] Default: `sold_month = 0` primeiro
- [ ] Depois: maior `gap`
- [ ] Depois: maior `goal`
- [ ] Depois: classe A > B > C > I

**Aceite:**
- O topo da lista sempre mostra os clientes mais urgentes para aumentar penetração

### 2.6 Tabela (colunas e ações)
- [ ] Colunas:
  - [ ] Cliente (nome + cidade/UF)
  - [ ] Classe
  - [ ] Comprou no mês (`sold_month`)
  - [ ] Última compra (`last_purchase_date`)
  - [ ] Meta
  - [ ] Vendido
  - [ ] Gap
  - [ ] Progresso (%)
- [ ] Ações por linha:
  - [ ] Abrir cliente (`/customers/:id`)
  - [ ] Iniciar follow-up (atalho)

**Aceite:**
- Vendedor consegue agir em 1 clique por cliente

### 2.7 Estados e mensagens
- [ ] Loading consistente
- [ ] Empty state (nenhum cliente encontrado)
- [ ] Erro com `Tentar novamente`

**Aceite:**
- Página nunca fica “em branco” sem explicação

---

## ✅ BLOCO 3 — PERFORMANCE & QUALIDADE

### 3.1 Cancelamento de requests
- [ ] Cancelar request anterior ao trocar filtros (evitar race)

### 3.2 Cache leve
- [ ] Cache por `(month, year, classification)` por 2–5 min

### 3.3 Telemetria (backend)
- [ ] Logar:
  - sellerId, year, month, classification, limit
  - tempo de query

**Aceite:**
- Diagnóstico de lentidão/erro sem adivinhação

---

## ✅ CRITÉRIO FINAL DE ACEITE (Go/No-Go)

- [ ] Página `/metas-por-cliente` abre e carrega o **mês atual**
- [ ] Exibe **penetração do mês** e quantos **não compraram no mês**
- [ ] Lista prioriza automaticamente **sem compra no mês**
- [ ] Cada cliente tem ação rápida (abrir + follow-up)
- [ ] Suporta carteira grande (paginação ou carregar mais)

