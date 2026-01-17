-- ============================================================
-- Q3.1 - PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Sistema de Gestão de Leads - Rolemak
-- Created: 2026-01-17
-- ============================================================

-- ============================================================
-- ÍNDICES PARA TABELA sCart (Leads)
-- ============================================================

-- Índice para busca por vendedor (queries frequentes de listagem)
CREATE INDEX IF NOT EXISTS idx_scart_cuser ON mak.sCart(cUser);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_scart_customer ON mak.sCart(cCustomer);

-- Índice para filtros por tipo e status
CREATE INDEX IF NOT EXISTS idx_scart_type ON mak.sCart(cType);

-- Índice composto para ordenação por data (very frequent)
CREATE INDEX IF NOT EXISTS idx_scart_created ON mak.sCart(cCreated DESC);

-- Índice composto para queries de listagem (vendedor + data)
CREATE INDEX IF NOT EXISTS idx_scart_user_created ON mak.sCart(cUser, cCreated DESC);

-- Índice para busca por pedido convertido
CREATE INDEX IF NOT EXISTS idx_scart_orderweb ON mak.sCart(orderWeb);

-- Índice para filtros de período (analytics)
CREATE INDEX IF NOT EXISTS idx_scart_date_range ON mak.sCart(cCreated, cUser);

-- ============================================================
-- ÍNDICES PARA TABELA icart (Itens do Lead)
-- ============================================================

-- Índice para busca por lead (join frequente)
CREATE INDEX IF NOT EXISTS idx_icart_lead ON mak.icart(cCart);

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_icart_product ON mak.icart(cProduct);

-- Índice composto para cálculos de total
CREATE INDEX IF NOT EXISTS idx_icart_cart_product ON mak.icart(cCart, cProduct);

-- ============================================================
-- ÍNDICES PARA TABELA clientes (Customers)
-- ============================================================

-- Índice para busca textual por nome
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON mak.clientes(nome(100));

-- Índice para busca por vendedor
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor ON mak.clientes(vendedor);

-- Índice para busca por cidade/estado
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON mak.clientes(cidade(50));
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON mak.clientes(estado);

-- Índice para filtro de status
CREATE INDEX IF NOT EXISTS idx_clientes_status ON mak.clientes(status);

-- Índice composto para listagem de carteira
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_nome ON mak.clientes(vendedor, nome(50));

-- ============================================================
-- ÍNDICES PARA TABELA produtos (Products)
-- ============================================================

-- Índice para busca por modelo (SKU)
CREATE INDEX IF NOT EXISTS idx_produtos_modelo ON mak.produtos(modelo);

-- Índice para busca textual
CREATE INDEX IF NOT EXISTS idx_produtos_descricao ON mak.produtos(descricao(100));

-- Índice para filtro por marca
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON mak.produtos(marca);

-- ============================================================
-- ÍNDICES PARA TABELA inv (Inventário)
-- ============================================================

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_inv_produto ON mak.inv(codigo);

-- ============================================================
-- ÍNDICES PARA TABELA hoje (Pedidos)
-- ============================================================

-- Índice para busca por vendedor
CREATE INDEX IF NOT EXISTS idx_hoje_vendedor ON mak.hoje(vendedor);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_hoje_cliente ON mak.hoje(cliente);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_hoje_data ON mak.hoje(data DESC);

-- Índice composto para analytics
CREATE INDEX IF NOT EXISTS idx_hoje_vendedor_data ON mak.hoje(vendedor, data DESC);

-- ============================================================
-- ÍNDICES PARA TABELA staging.audit_log
-- ============================================================

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_audit_user ON staging.audit_log(user_id);

-- Índice para busca por ação
CREATE INDEX IF NOT EXISTS idx_audit_action ON staging.audit_log(action);

-- Índice para busca por recurso
CREATE INDEX IF NOT EXISTS idx_audit_resource ON staging.audit_log(resource_type, resource_id);

-- Índice para ordenação temporal
CREATE INDEX IF NOT EXISTS idx_audit_created ON staging.audit_log(created_at DESC);

-- ============================================================
-- ÍNDICES PARA TABELA staging.pricing_decision_event
-- ============================================================

-- Índice para busca por lead
CREATE INDEX IF NOT EXISTS idx_pde_lead ON staging.pricing_decision_event(lead_id);

-- Índice para busca por vendedor
CREATE INDEX IF NOT EXISTS idx_pde_seller ON staging.pricing_decision_event(seller_id);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_pde_customer ON staging.pricing_decision_event(customer_id);

-- Índice para filtro de risco
CREATE INDEX IF NOT EXISTS idx_pde_risk ON staging.pricing_decision_event(risk_level);

-- Índice temporal
CREATE INDEX IF NOT EXISTS idx_pde_created ON staging.pricing_decision_event(created_at DESC);

-- ============================================================
-- ÍNDICES PARA TABELA staging.interactions
-- ============================================================

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON staging.interactions(customer_id);

-- Índice para busca por vendedor
CREATE INDEX IF NOT EXISTS idx_interactions_user ON staging.interactions(user_id);

-- Índice para follow-ups pendentes
CREATE INDEX IF NOT EXISTS idx_interactions_followup ON staging.interactions(follow_up_date, follow_up_status);

-- ============================================================
-- ÍNDICES PARA TABELA staging.sales_goals
-- ============================================================

-- Índice para busca por vendedor
CREATE INDEX IF NOT EXISTS idx_goals_seller ON staging.sales_goals(seller_id);

-- Índice composto para período
CREATE INDEX IF NOT EXISTS idx_goals_period ON staging.sales_goals(year, month, seller_id);

-- ============================================================
-- ANÁLISE DE ÍNDICES EXISTENTES
-- Execute separadamente para verificar índices criados
-- ============================================================

-- SHOW INDEX FROM mak.sCart;
-- SHOW INDEX FROM mak.icart;
-- SHOW INDEX FROM mak.clientes;
-- SHOW INDEX FROM mak.produtos;
-- SHOW INDEX FROM mak.hoje;
-- SHOW INDEX FROM staging.audit_log;

-- ============================================================
-- ESTATÍSTICAS E OTIMIZAÇÃO
-- Execute após criar índices
-- ============================================================

-- ANALYZE TABLE mak.sCart;
-- ANALYZE TABLE mak.icart;
-- ANALYZE TABLE mak.clientes;
-- ANALYZE TABLE mak.produtos;
-- ANALYZE TABLE mak.inv;
-- ANALYZE TABLE mak.hoje;
-- ANALYZE TABLE staging.audit_log;
-- ANALYZE TABLE staging.pricing_decision_event;
-- ANALYZE TABLE staging.interactions;
-- ANALYZE TABLE staging.sales_goals;
