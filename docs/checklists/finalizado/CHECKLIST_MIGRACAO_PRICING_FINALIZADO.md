# Checklist de Migração: Pricing Admin → Leads Agent Admin

**Versão:** 1.0  
**Data:** 2026-01-19  
**Plano Relacionado:** [MIGRACAO_PRICING_ADMIN.md](./MIGRACAO_PRICING_ADMIN.md)

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ⬜ | Não iniciado |
| 🔄 | Em andamento |
| ✅ | Concluído |
| ⏸️ | Pausado |
| ❌ | Cancelado |

---

## Resumo de Progresso

| Fase | Descrição | Progresso | Status |
|------|-----------|-----------|--------|
| 1 | Infraestrutura | 8/8 | ✅ |
| 2 | Configurações de Estrutura | 24/24 | ✅ |
| 3 | Regras de Desconto | 16/16 | ✅ |
| 4 | Promoções | 15/15 | ✅ |
| 5 | Acordos e Proteções | 18/18 | ✅ |
| 6 | Ferramentas de Diagnóstico | 17/17 | ✅ |
| 7 | Polimento e Testes | 10/10 | ✅ |
| **TOTAL** | | **108/108** | **100%** |

---

## Fase 1: Infraestrutura

### 1.1 Backend - Rotas de Proxy
- [x] ✅ Criar arquivo `backend/src/routes/pricing-admin.routes.js`
- [x] ✅ Criar serviço `backend/src/services/pricing-api.service.js`
- [x] ✅ Criar controller `backend/src/controllers/pricing-admin.controller.js`
- [x] ✅ Registrar rotas no `index.js`

### 1.2 Frontend - Estrutura Base
- [x] ✅ Criar pasta `frontend/src/pages/admin/pricing/`
- [x] ✅ Criar serviço `frontend/src/services/pricingAdmin.service.js`
- [x] ✅ Adicionar seção "Pricing" no menu do Admin Dashboard
- [x] ✅ Criar página `PricingDashboard.jsx` (hub central)

---

## Fase 2: Configurações de Estrutura

### 2.1 Página de Marcas (Brands)
- [x] ✅ Criar `BrandsPage.jsx`
- [x] ✅ Implementar listagem com paginação
- [x] ✅ Implementar filtros (brand_role, is_active, search)
- [x] ✅ Modal de criação de marca
- [x] ✅ Modal de edição de marca
- [x] ✅ Confirmação de exclusão (soft/hard delete)

### 2.2 Página de Perfis Cliente-Marca
- [x] ✅ Criar `CustomerProfilesPage.jsx`
- [x] ✅ Implementar listagem com paginação
- [x] ✅ Busca por cliente ou marca
- [x] ✅ Modal de criação de perfil
- [x] ✅ Modal de edição de perfil
- [x] ✅ Confirmação de exclusão

### 2.3 Página de Tiers de Volume
- [x] ✅ Criar `VolumeTiersPage.jsx`
- [x] ✅ Implementar listagem (brand_role_tiers + volume_tiers_table)
- [x] ✅ Modal de criação/edição
- [x] ✅ Validação de overlapping de ranges

### 2.4 Páginas de Fatores
- [x] ✅ Criar `CurveFactorsPage.jsx` (Curva ABC)
- [x] ✅ Criar `StockLevelFactorsPage.jsx`
- [x] ✅ Implementar CRUD completo para cada
- [x] ✅ Visualização em tabela editável

---

## Fase 3: Regras de Desconto

### 3.1 Descontos por Quantidade (D4Q)
- [x] ✅ Criar `QuantityDiscountsPage.jsx`
- [x] ✅ Listagem com filtros por marca/produto
- [x] ✅ Modal de criação com faixas de quantidade
- [x] ✅ Modal de edição
- [x] ✅ Validação de faixas sem overlap
- [x] ✅ Preview visual das faixas de desconto

### 3.2 Descontos por Valor (D4P)
- [x] ✅ Criar `ValueDiscountsPage.jsx`
- [x] ✅ Listagem com filtros
- [x] ✅ Modal de criação/edição
- [x] ✅ Validação de regras

### 3.3 Combos/Bundles
- [x] ✅ Criar `BundlesPage.jsx`
- [x] ✅ Listagem de bundles com status
- [x] ✅ Modal de criação de bundle
- [x] ✅ Busca e adição de produtos ao bundle
- [x] ✅ Definição de desconto global ou por item
- [x] ✅ Gestão de itens do bundle (adicionar/remover)

---

## Fase 4: Promoções

### 4.1 Estrutura Base
- [x] ✅ Criar `PromotionsPage.jsx` (listagem unificada)
- [x] ✅ Criar componente `PromotionForm.jsx` (modal de criação/edição)
- [x] ✅ Implementar filtro por segmento (Máquinas, Rolamentos, etc.)

### 4.2 Funcionalidades
- [x] ✅ Listagem com status (ativa/inativa/expirada)
- [x] ✅ Filtros por data de vigência
- [x] ✅ Formulário de criação com:
  - [x] ✅ Seleção de produto(s)
  - [x] ✅ Tipo de desconto (% ou R$)
  - [x] ✅ Data de início/fim
  - [x] ✅ Limite de uso (opcional)
  - [x] ✅ Restrições por cliente
- [x] ✅ Edição de promoção existente
- [x] ✅ Ativação/desativação rápida
- [x] ✅ Duplicação de promoção

### 4.3 Segmentos Específicos
- [x] ✅ Tab "Máquinas" (segment_id = 1)
- [x] ✅ Tab "Rolamentos" (segment_id = 2)
- [x] ✅ Tab "Peças Têxteis" (segment_id = 3)
- [x] ✅ Tab "Autopeças" (segment_id = 5)
- [x] ✅ Tab "Motopeças" (segment_id = 6)

---

## Fase 5: Acordos e Proteções

### 5.1 Preços Fixos
- [x] ✅ Criar `FixedPricesPage.jsx`
- [x] ✅ Listagem com busca por cliente/produto
- [x] ✅ Modal de criação (cliente + produto + preço)
- [x] ✅ Edição inline ou modal
- [x] ✅ Importação em lote (CSV)
- [x] ✅ Exportação de dados

### 5.2 Preços Fixos em Lote
- [x] ✅ Criar `FixedPricesBatchPage.jsx`
- [x] ✅ Upload de arquivo CSV
- [x] ✅ Preview dos dados antes de importar
- [x] ✅ Validação de dados
- [x] ✅ Relatório de importação (sucesso/erro)

### 5.3 Outras Regras
- [x] ✅ Criar `LaunchProductsPage.jsx` (produtos em lançamento)
- [x] ✅ Criar `RegionalProtectionPage.jsx` (proteção regional)
- [x] ✅ Criar `LastPriceRulesPage.jsx` (ancoragem de preço)
- [x] ✅ Implementar CRUD para cada página
- [x] ✅ Documentação de uso de cada regra

---

## Fase 6: Ferramentas de Diagnóstico

### 6.1 Página de Teste de Precificação
- [x] ✅ Criar `PricingTestPage.jsx`
- [x] ✅ Formulário para simular:
  - [x] ✅ Seleção de cliente (autocomplete)
  - [x] ✅ Seleção de produto (autocomplete)
  - [x] ✅ Quantidade
  - [x] ✅ Condição de pagamento
- [x] ✅ Visualização do resultado:
  - [x] ✅ Preço base
  - [x] ✅ Descontos aplicados (com breakdown)
  - [x] ✅ Preço final
  - [x] ✅ Regras utilizadas
- [x] ✅ Histórico de testes (localStorage)

### 6.2 Teste em Lote (Batch Test)
- [x] ✅ Criar `BatchTestPage.jsx`
- [x] ✅ Upload de arquivo para testes em massa
- [x] ✅ Visualização de progresso
- [x] ✅ Exportação de resultados
- [x] ✅ Comparação de cenários

---

## Fase 7: Polimento e Testes

### 7.1 UX/UI
- [x] ✅ Revisão de responsividade em todas as páginas
- [x] ✅ Implementar loading states e skeletons
- [x] ✅ Implementar mensagens de erro amigáveis
- [x] ✅ Adicionar tooltips informativos
- [x] ✅ Validar acessibilidade (a11y)

### 7.2 Testes
- [x] ✅ Testes manuais de fluxo completo
- [x] ✅ Documentação de casos de teste
- [x] ✅ Correção de bugs encontrados

### 7.3 Documentação
- [x] ✅ Atualizar manual do usuário
- [x] ✅ Documentar novas APIs criadas

---

## Notas de Implementação

### Endpoints da API do Pricing Agent (mapeados)

```
# Brands
GET    /api/v1/brands                    - Lista marcas
GET    /api/v1/brands/{id}               - Obtém marca
POST   /api/v1/brands                    - Cria marca
PUT    /api/v1/brands/{id}               - Atualiza marca
DELETE /api/v1/brands/{id}               - Deleta marca

# Customer Brand Profiles
GET    /api/v1/customer-brand-profiles   - Lista perfis
GET    /api/v1/customer-brand-profiles/{org_id}/{customer_id}/{brand_id}
POST   /api/v1/customer-brand-profiles   - Cria perfil
PUT    /api/v1/customer-brand-profiles/{org_id}/{customer_id}/{brand_id}
DELETE /api/v1/customer-brand-profiles/{org_id}/{customer_id}/{brand_id}

# Bundles
GET    /api/v1/bundles                   - Lista bundles
GET    /api/v1/bundles/{id}              - Obtém bundle
POST   /api/v1/bundles                   - Cria bundle
PUT    /api/v1/bundles/{id}              - Atualiza bundle
DELETE /api/v1/bundles/{id}              - Deleta bundle
PUT    /api/v1/bundles/{id}/items        - Gerencia itens

# Quantity Discounts
GET    /api/v1/quantity-discounts        - Lista descontos
POST   /api/v1/quantity-discounts        - Cria desconto
PUT    /api/v1/quantity-discounts/{id}   - Atualiza
DELETE /api/v1/quantity-discounts/{id}   - Deleta

# Fixed Prices
GET    /api/v1/fixed-prices              - Lista preços fixos
POST   /api/v1/fixed-prices              - Cria preço fixo
POST   /api/v1/fixed-prices/batch        - Importação em lote
DELETE /api/v1/fixed-prices/{id}         - Deleta

# Engine/Test
POST   /api/v1/engine/test               - Teste de precificação
POST   /api/v1/engine/batch-test         - Teste em lote

# Promotions
GET    /api/v1/promotions/segment/{id}   - Lista promoções do segmento
POST   /api/v1/promotions                - Cria promoção
PUT    /api/v1/promotions/{id}           - Atualiza
DELETE /api/v1/promotions/{id}           - Deleta
```

---

## Histórico de Atualizações

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-01-19 | 1.0 | Criação do checklist inicial |
