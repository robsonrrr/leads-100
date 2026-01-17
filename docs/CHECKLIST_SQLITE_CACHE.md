# Checklist: Cache Local SQLite (PWA/Offline)

## 📋 Visão Geral

Implementação de cache local usando SQLite (via sql.js) para permitir funcionamento offline e buscas ultra-rápidas no Leads Agent.

**Objetivo:** Permitir que vendedores acessem catálogo, clientes e leads mesmo sem internet.

---

## 🗄️ 1. INFRAESTRUTURA

### 1.1 Setup do sql.js no Frontend

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Instalar dependência sql.js | Frontend | ✅ |
| 1.1.2 | Criar wrapper SQLiteService | Frontend | ✅ |
| 1.1.3 | Configurar WASM para sql.js | Frontend | ✅ |
| 1.1.4 | Persistir DB no IndexedDB | Frontend | ✅ |
| 1.1.5 | Criar migrations/versioning | Frontend | ✅ |

### 1.2 Sincronização

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Endpoint de sync incremental (delta) | Backend | ⏳ |
| 1.2.2 | Controle de timestamp última sync | Frontend | ✅ |
| 1.2.3 | Background sync com Service Worker | Frontend | ⏳ |
| 1.2.4 | Indicador visual de sincronização | Frontend | ✅ |
| 1.2.5 | Resolução de conflitos (servidor ganha) | Backend | ⏳ |

---

## 📦 2. CACHE DE PRODUTOS

### 2.1 Dados a Cachear (Estáticos)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Tabela: products (id, model, brand, name, description) | Frontend | ✅ |
| 2.1.2 | Tabela: segments (id, name, seo) | Frontend | ✅ |
| 2.1.3 | Tabela: categories (id, name, segment_id) | Frontend | ✅ |
| 2.1.4 | Tabela: product_images (product_id, url, order) | Frontend | ⏳ |
| 2.1.5 | Índices para busca (model, brand, name) | Frontend | ✅ |

### 2.2 Dados NÃO Cachear (Real-Time)

| Dado | Motivo | Estratégia |
|------|--------|------------|
| **Estoque** | Muda constantemente | Sempre API |
| **Preço final** | Depende de promoções/cliente | Validar na conversão |
| **Disponibilidade** | Depende de local | Sempre API |

### 2.3 Sync de Produtos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Endpoint: GET /api/sync/products?since=timestamp | Backend | ✅ |
| 2.3.2 | Retornar apenas produtos alterados desde X | Backend | ✅ |
| 2.3.3 | Incluir flag de deleted para soft-delete | Backend | ✅ |
| 2.3.4 | Sync inicial (bulk) em background | Frontend | ✅ |
| 2.3.5 | Sync incremental a cada 15 min | Frontend | ✅ |

### 2.4 Busca Offline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.4.1 | Busca por modelo (LIKE) | Frontend | ✅ |
| 2.4.2 | Filtro por segmento | Frontend | ✅ |
| 2.4.3 | Filtro por categoria | Frontend | ✅ |
| 2.4.4 | Filtro por marca | Frontend | ✅ |
| 2.4.5 | Ordenação (nome, modelo) | Frontend | ✅ |
| 2.4.6 | Paginação local | Frontend | ✅ |

---

## 👥 3. CACHE DE CLIENTES

### 3.1 Dados a Cachear

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Tabela: customers (id, name, cnpj, city, state) | Frontend | ✅ |
| 3.1.2 | Tabela: customer_contacts (id, customer_id, phone, email) | Frontend | ✅ |
| 3.1.3 | Tabela: customer_addresses (id, customer_id, address) | Frontend | ⏳ |
| 3.1.4 | Índices para busca (name, cnpj, city) | Frontend | ✅ |
| 3.1.5 | Apenas clientes da carteira do vendedor | Frontend | ✅ |

### 3.2 Sync de Clientes

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Endpoint: GET /api/sync/customers?since=timestamp | Backend | ✅ |
| 3.2.2 | Filtrar por seller_id (apenas sua carteira) | Backend | ✅ |
| 3.2.3 | Incluir dados de contato e endereço | Backend | ✅ |
| 3.2.4 | Sync inicial em background | Frontend | ✅ |
| 3.2.5 | Sync incremental a cada 30 min | Frontend | ✅ |

### 3.3 Dados NÃO Cachear

| Dado | Motivo | Estratégia |
|------|--------|------------|
| **Limite de crédito** | Financeiro, time real | Sempre API |
| **Títulos abertos** | Financeiro, time real | Sempre API |
| **Último pedido** | Pode mudar frequentemente | API on-demand |

---

## 📋 4. CACHE DE LEADS (RASCUNHOS)

### 4.1 Leads Offline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Tabela: leads_draft (local, não sincronizado) | Frontend | ✅ |
| 4.1.2 | Tabela: lead_items_draft (itens do carrinho) | Frontend | ✅ |
| 4.1.3 | Salvar automaticamente ao editar | Frontend | ✅ |
| 4.1.4 | Indicador "Não salvo na nuvem" | Frontend | ⏳ |
| 4.1.5 | Sincronizar quando voltar online | Frontend | ✅ |

### 4.2 Fila de Sincronização

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Tabela: sync_queue (action, data, status) | Frontend | ✅ |
| 4.2.2 | Adicionar operações pendentes à fila | Frontend | ✅ |
| 4.2.3 | Processar fila quando online | Frontend | ✅ |
| 4.2.4 | Retry com backoff exponencial | Frontend | ⏳ |
| 4.2.5 | Notificar usuário de erros de sync | Frontend | ⏳ |

---

## 🔧 5. INTEGRAÇÃO COM APP

### 5.1 Hook useOfflineData

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Criar hook useOfflineProducts() | Frontend | ✅ |
| 5.1.2 | Criar hook useOfflineCustomers() | Frontend | ✅ |
| 5.1.3 | Criar hook useOfflineLeads() | Frontend | ✅ |
| 5.1.4 | Priorizar cache, fallback para API | Frontend | ✅ |
| 5.1.5 | Retornar flag isOffline para UI | Frontend | ✅ |

### 5.2 UI Offline

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Banner "Modo Offline" no header | Frontend | ✅ |
| 5.2.2 | Desabilitar ações que precisam de API | Frontend | ⏳ |
| 5.2.3 | Badge em itens não sincronizados | Frontend | ✅ |
| 5.2.4 | Botão "Sincronizar Agora" | Frontend | ✅ |
| 5.2.5 | Contador de itens pendentes | Frontend | ✅ |

---

## 📊 6. LIMITAÇÕES E EDGE CASES

### 6.1 Limites de Armazenamento

| Navegador | Limite IndexedDB | Estratégia |
|-----------|------------------|------------|
| Chrome | 80% do disco | OK para uso normal |
| Safari | 1GB | Limitar dados |
| Firefox | 50% do disco | OK para uso normal |

### 6.2 Tratamento de Erros

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Detectar quota exceeded | Frontend | ✅ |
| 6.2.2 | Limpar dados antigos (LRU) | Frontend | ✅ |
| 6.2.3 | Fallback para API se cache falhar | Frontend | ✅ |
| 6.2.4 | Log de erros de sync | Frontend | ✅ |

---

## 📈 7. MÉTRICAS E MONITORAMENTO

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1 | Tempo de busca offline vs online | Frontend | ✅ |
| 7.2 | Quantidade de dados cacheados | Frontend | ✅ |
| 7.3 | Frequência de uso offline | Frontend | ⏳ |
| 7.4 | Taxa de sucesso de sync | Frontend | ⏳ |

---

## 📝 Resumo de Tarefas

| Categoria | Total | Concluídas | Pendentes |
|-----------|-------|------------|-----------|
| 1. Infraestrutura | 10 | 7 | 3 |
| 2. Produtos | 16 | 15 | 1 |
| 3. Clientes | 10 | 9 | 1 |
| 4. Leads | 10 | 7 | 3 |
| 5. Integração | 10 | 9 | 1 |
| 6. Limites | 4 | 4 | 0 |
| 7. Métricas | 4 | 2 | 2 |
| **TOTAL** | **64** | **53** | **11** |

---

## 🚀 Ordem de Implementação Sugerida

1. **Fase 1 - Setup** (1-2 dias)
   - Infraestrutura sql.js
   - Wrapper SQLiteService

2. **Fase 2 - Produtos** (2-3 dias)
   - Cache de catálogo
   - Busca offline

3. **Fase 3 - Clientes** (1-2 dias)
   - Cache da carteira
   - Busca offline

4. **Fase 4 - Leads Offline** (2-3 dias)
   - Rascunhos locais
   - Fila de sincronização

5. **Fase 5 - Polish** (1-2 dias)
   - UI offline
   - Métricas

**Tempo total estimado:** 7-12 dias

---

*Criado em: 2026-01-17*
*Última atualização: 2026-01-17*
