# 🚀 CRM de Revenda - Leads Agent

## 📋 Visão Geral

Sistema CRM completo para canal de revenda B2B, focado nas necessidades do vendedor para gestão de carteira, leads e performance.

### Contexto do Negócio
- **Modelo**: B2B - Canal de Revenda
- **Clientes**: Empresas/revendedores pré-cadastrados no ERP (mak)
- **Vendedores**: Cada um com carteira de clientes definida
- **Fluxo**: Vendedor → Cliente → Cotação → Pedido

---

## ✅ Status: TODAS AS FASES CONCLUÍDAS

| Fase | Status | Data |
|------|--------|------|
| Fase 1: Visão do Vendedor | ✅ Concluída | 12/01/2025 |
| Fase 2: Histórico e Relacionamento | ✅ Concluída | 12-13/01/2025 |
| Fase 3: Inteligência e Alertas | ✅ Concluída | 13/01/2025 |
| Fase 4: Analytics e Metas | ✅ Concluída | 13/01/2025 |
| Fase 5: Catálogo de Produtos | ✅ Concluída (96%) | 17/01/2026 |

---

## 🎯 Funcionalidades Implementadas

### Fase 1: Visão do Vendedor

**Página Minha Carteira (`/customers`)**
- Listagem de clientes com cards
- Filtros por status (ativo/em risco/inativo) e busca
- Ordenação por último pedido, total ano/mês, nome, limite
- Paginação e modos de visualização (grid/lista)

**Dashboard com Métricas**
- Cards: Leads Abertos, Convertidos, Vendas no Mês, Clientes Ativos
- Variação percentual vs mês anterior

**Regras de Status do Cliente:**
- 🟢 **Ativo**: Comprou nos últimos 30 dias
- 🟡 **Em Risco**: Última compra entre 30-60 dias
- 🔴 **Inativo**: Sem compra há mais de 60 dias

---

### Fase 2: Histórico e Relacionamento

**Página Detalhes do Cliente (`/customers/:id`)**
- Dados cadastrais completos
- Métricas: Total ano, mês, lifetime, ticket médio, primeira/última compra
- Abas: Pedidos, Cotações, Produtos Frequentes

**Filtros para Gerentes (level > 4)**
- Filtrar por segmento de vendedor
- Filtrar por vendedor específico
- Ver carteira de todo um segmento

**APIs Implementadas:**
- `GET /api/customers/:id/orders` - Histórico de pedidos
- `GET /api/customers/:id/leads` - Cotações do cliente
- `GET /api/customers/:id/metrics` - Métricas consolidadas
- `GET /api/customers/:id/products` - Produtos mais comprados

---

### Fase 3: Inteligência e Alertas

**Widget de Alertas no Dashboard**
- 🔴 Clientes inativos (60+ dias sem compra)
- 🟡 Clientes em risco (30-60 dias sem compra)
- 📝 Cotações pendentes (7+ dias abertas)
- Links para ação rápida

**Widget de Clientes em Risco**
- Lista top 5 clientes em risco
- Dias desde última compra
- Botão para ligar (link tel:)
- Botão para nova cotação

**APIs Implementadas:**
- `GET /api/alerts/my-alerts` - Resumo de alertas
- `GET /api/alerts/at-risk-customers` - Lista clientes em risco
- `GET /api/alerts/pending-leads` - Cotações pendentes

---

### Fase 4: Analytics e Metas

**Página Analytics (`/analytics`)**
- Gráfico de Vendas por Mês (últimos 6 meses)
- Gráfico de Vendas por Dia da Semana
- Top 5 Clientes com barras de progresso
- Comparação Ano Atual vs Ano Anterior
- Cards: Vendas do ano, Pedidos, Ticket Médio, Clientes Ativos

**APIs Implementadas:**
- `GET /api/analytics/dashboard` - Dashboard completo
- `GET /api/analytics/top-customers` - Top clientes
- `GET /api/analytics/sales-by-period` - Vendas por período

---

### Funcionalidades Extras

**Registro de Interações**
- Timeline de interações no cliente (aba Interações)
- Tipos: Ligação, Visita, Email, WhatsApp, Reunião, Nota
- Criar, editar, excluir interações
- Agendar próxima ação (follow-up)

**Exportar Carteira**
- Botão "Exportar" na página Minha Carteira
- Gera arquivo CSV com todos os clientes
- Inclui: CNPJ, Nome, Cidade, Status, Último Pedido, Totais

**Sistema de Metas**
- Widget de progresso no Dashboard (meta mensal e anual)
- Página de gerenciamento de metas (`/goals`) para gerentes
- Tabela de progresso da equipe
- Criar/editar metas por vendedor
- Filtro por segmento e mês/ano

**Widget de Follow-ups**
- Lista de próximas ações agendadas no Dashboard
- Indicador de atrasados (badge vermelho no menu)
- Navegação direta para cliente ao clicar
- Atualização automática a cada 5 minutos

**Ranking de Vendedores (Gamificação)**
- Top 10 vendedores no Dashboard (apenas gerentes)
- Medalhas 🥇🥈🥉 para os 3 primeiros
- Alternância entre ranking mensal e anual
- Percentual de meta atingida
- Destaque para o vendedor logado

**Dashboard do Gerente**
- Métricas consolidadas da equipe (vendas, pedidos, clientes)
- Comparação com mês anterior (variação %)
- Leads abertos e valor total
- Clientes em risco e vendedores ativos
- Filtro por segmento

**Relatórios PDF**
- Página de relatórios (`/reports`)
- Carteira de Clientes (PDF)
- Leads Abertos (PDF)
- Performance da Equipe (PDF) - gerentes
- Metas Anuais (PDF) - gerentes
- Filtros por segmento e vendedor

**Página de Promoções (`/promotions`)**
- Promoções ativas com tabela detalhada
- Filtro por segmento para gerentes
- Informações: SKU, Marca, Modelo, Preço Original/Promo, Desconto, Estoque, Tempo

**Menu de Navegação**
- Dashboard (Leads)
- Minha Carteira
- Analytics
- Promoções
- Produtos
- Novo Lead

---

### Fase 5: Catálogo de Produtos (17/01/2026)

**Página de Produtos (`/products`)**
- Grid/Lista de produtos com visualização híbrida
- Filtros: segmento, categoria, marca, preço, estoque
- Ordenação: estoque, preço, nome
- Favoritos do vendedor
- Filtro de promoções

**Modal de Detalhes do Produto**
- Galeria de imagens com zoom
- Gráfico de histórico de preços (12 meses)
- Estoque por depósito/unidade
- Preços: tabela, sugerido, margem
- Produtos relacionados, acessórios, comprados juntos

**Autocomplete de Produtos**
- Seção "Meus Favoritos" com badge ⭐
- Seção "Usados Recentemente" com badge
- Badges de promoção, lançamento, preço fixo
- Preview com imagem, preço, estoque

**Scanner de Código de Barras**
- Acesso à câmera (BarcodeDetector API)
- Entrada manual como fallback
- Busca por EAN/UPC/Code128

**Comparador de Produtos**
- Selecionar até 4 produtos
- Tabela comparativa lado a lado
- Destaque de diferenças
- Ícone de melhor valor (preço/estoque)

**Analytics de Produtos**
- Produtos mais vendidos por período
- Produtos mais buscados
- Taxa de conversão (busca → venda)
- Margem média por produto
- Dashboard consolidado

**Otimizações Mobile**
- Layout responsivo (2 colunas mobile)
- Swipe para navegar imagens
- Touch-friendly (44x44px targets)
- Sticky search bar

**APIs Implementadas (Produtos):**
- `GET /api/products/search` - Busca de produtos
- `GET /api/products/:id/details` - Detalhes completos
- `GET /api/products/:id/stock-by-warehouse` - Estoque por unidade
- `GET /api/products/:id/price-history` - Histórico de preços
- `GET /api/products/:id/replenishment` - Previsão de reposição
- `GET /api/products/:id/related` - Produtos relacionados
- `GET /api/products/barcode/:barcode` - Busca por código de barras
- `GET /api/products/favorites` - Favoritos do vendedor
- `GET /api/products/recent` - Produtos recentes (max 20)
- `GET /api/products/delivery-time` - Tempo de entrega por UF
- `GET /api/products/analytics/dashboard` - Dashboard de métricas
- `GET /api/products/analytics/top-selling` - Mais vendidos
- `GET /api/products/analytics/most-searched` - Mais buscados
- `GET /api/products/analytics/conversion-rates` - Taxa de conversão
- `GET /api/products/analytics/margins` - Margem média

---

## 📁 Estrutura de Arquivos

### Frontend
```
frontend/src/
├── pages/
│   ├── DashboardPage.jsx        # Dashboard de Leads
│   ├── MyCustomersPage.jsx      # Minha Carteira
│   ├── CustomerDetailPage.jsx   # Detalhes do Cliente
│   ├── AnalyticsPage.jsx        # Relatórios e Gráficos
│   ├── PromotionsPage.jsx       # Promoções Ativas
│   └── ...
├── components/
│   ├── MetricsCards.jsx         # Cards de métricas
│   ├── CustomerCard.jsx         # Card de cliente
│   ├── AlertsWidget.jsx         # Widget de alertas
│   ├── AtRiskCustomers.jsx      # Clientes em risco
│   ├── ActivePromotions.jsx     # Tabela de promoções
│   └── Layout.jsx               # Menu lateral
└── services/
    └── api.js                   # Serviços de API
```

### Backend
```
backend/src/
├── controllers/
│   ├── customers.controller.js  # Carteira e clientes
│   ├── analytics.controller.js  # Métricas e relatórios
│   ├── alerts.controller.js     # Sistema de alertas
│   └── leads.controller.js      # Gestão de leads
├── repositories/
│   ├── customer.repository.js   # Queries de clientes
│   └── lead.repository.js       # Queries de leads
└── routes/
    ├── customers.routes.js
    ├── analytics.routes.js
    └── alerts.routes.js
```

---

## 🔧 Tecnologias Utilizadas

### Frontend
- React 18 + Vite
- Material-UI (MUI)
- Redux Toolkit
- Recharts (gráficos)
- React Router DOM

### Backend
- Node.js + Express
- MySQL (ERP mak)
- Redis (cache)
- JWT (autenticação)

---

## 📊 APIs Disponíveis

### Customers
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/customers/my-portfolio` | Carteira do vendedor |
| `GET /api/customers/my-portfolio/summary` | Resumo da carteira |
| `GET /api/customers/sellers` | Lista de vendedores |
| `GET /api/customers/sellers/segments` | Segmentos de vendedores |
| `GET /api/customers/:id` | Dados do cliente |
| `GET /api/customers/:id/orders` | Pedidos do cliente |
| `GET /api/customers/:id/leads` | Cotações do cliente |
| `GET /api/customers/:id/metrics` | Métricas do cliente |
| `GET /api/customers/:id/products` | Produtos frequentes |

### Analytics
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/analytics/seller-summary` | Resumo do vendedor |
| `GET /api/analytics/dashboard` | Dashboard completo |
| `GET /api/analytics/top-customers` | Top clientes |
| `GET /api/analytics/sales-by-period` | Vendas por período |

### Alerts
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/alerts/my-alerts` | Alertas do vendedor |
| `GET /api/alerts/at-risk-customers` | Clientes em risco |
| `GET /api/alerts/pending-leads` | Cotações pendentes |

### Interactions
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/interactions/customer/:id` | Lista interações do cliente |
| `POST /api/interactions` | Criar nova interação |
| `PUT /api/interactions/:id` | Atualizar interação |
| `DELETE /api/interactions/:id` | Excluir interação |
| `GET /api/interactions/follow-ups` | Próximas ações agendadas |

### Goals (Metas)
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/goals/my-progress` | Meu progresso vs meta |
| `GET /api/goals/team-progress` | Progresso da equipe (gerentes) |
| `GET /api/goals/seller/:id` | Metas de um vendedor |
| `GET /api/goals` | Listar todas as metas (gerentes) |
| `POST /api/goals` | Criar meta (gerentes) |
| `PUT /api/goals/:id` | Atualizar meta (gerentes) |
| `DELETE /api/goals/:id` | Excluir meta (gerentes) |

### Reports (Relatórios PDF)
| Endpoint | Descrição |
|----------|-----------|
| `GET /api/reports` | Listar tipos de relatórios |
| `GET /api/reports/portfolio` | Relatório Carteira (PDF) |
| `GET /api/reports/leads` | Relatório Leads (PDF) |
| `GET /api/reports/performance` | Relatório Performance (PDF) |
| `GET /api/reports/goals` | Relatório Metas (PDF) |

---

## 🔐 Níveis de Acesso

| Level | Perfil | Permissões |
|-------|--------|------------|
| 1-4 | Vendedor | Ver apenas sua carteira e métricas |
| 5+ | Gerente | Ver carteiras de outros vendedores, filtrar por segmento |

---

## 📈 Regras de Negócio

### Filtro de Pedidos de Vendas
Apenas pedidos com `nop IN (27, 28, 51, 76)` são considerados vendas nas métricas.

### Cálculo de Status do Cliente
- **Ativo**: `MAX(data_pedido) >= CURDATE() - 30 dias`
- **Em Risco**: `MAX(data_pedido) BETWEEN CURDATE() - 60 dias AND CURDATE() - 30 dias`
- **Inativo**: `MAX(data_pedido) < CURDATE() - 60 dias OR NULL`

---

## 🚀 Deploy

**URL de Produção:** https://leads.internut.com.br/

**Serviços Docker:**
- `leads-internut-frontend`
- `leads-internut-backend`

---

*Documento atualizado em: 17/01/2026*
*Versão: 3.0 - CRM Completo + Catálogo de Produtos*
