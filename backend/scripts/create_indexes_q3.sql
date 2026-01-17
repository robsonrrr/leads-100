-- ============================================================
-- Q3.1 - PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Sistema de Gestão de Leads - Rolemak
-- Created: 2026-01-17
-- MySQL Version: 8.4.7
-- ============================================================

-- NOTA: Este script é IDEMPOTENTE - pode executar múltiplas vezes
-- Verifica se índice existe antes de criar

DELIMITER $$

-- ============================================================
-- PROCEDURE PARA CRIAR ÍNDICE SE NÃO EXISTIR
-- ============================================================
DROP PROCEDURE IF EXISTS create_index_if_not_exists$$

CREATE PROCEDURE create_index_if_not_exists(
    IN p_table_schema VARCHAR(64),
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_index_columns VARCHAR(512)
)
BEGIN
    DECLARE v_index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = p_table_schema
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;
    
    IF v_index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_schema, '.', p_table_name, ' (', p_index_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✅ Índice criado: ', p_index_name, ' em ', p_table_name) AS resultado;
    ELSE
        SELECT CONCAT('⏭️ Índice já existe: ', p_index_name, ' em ', p_table_name) AS resultado;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- ÍNDICES PARA TABELA sCart (Leads)
-- ============================================================

CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_cuser', 'cUser');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_customer', 'cCustomer');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_type', 'cType');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_dcart', 'dCart');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_user_dcart', 'cUser, dCart');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_orderweb', 'cOrderWeb');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_seller', 'cSeller');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_segment', 'cSegment');

-- ============================================================
-- ÍNDICES PARA TABELA icart (Itens do Lead)
-- ============================================================

CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_lead', 'cSCart');
CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_product', 'cProduct');
CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_scart_product', 'cSCart, cProduct');

-- ============================================================
-- ÍNDICES PARA TABELA clientes (Customers)
-- NOTA: A maioria dos índices já existe nesta tabela
-- Índices existentes: vendedor, estado, bloqueado, nome, cidade, 
--                     fantasia, email, status_crm, rfm, abc, etc.
-- ============================================================

-- Índices compostos adicionais para melhor performance
CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_vendedor_bloqueado', 'vendedor, bloqueado');
CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_vendedor_ativo', 'vendedor, ativo');
CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_status_crm_vendedor', 'status_crm, vendedor');

-- ============================================================
-- ÍNDICES PARA TABELA inv (Inventário/Produtos)
-- NOTA: A maioria dos índices já existe nesta tabela
-- Índices existentes: modelo, marca, idcf, codebar, seo, vip, etc.
-- ============================================================

-- Índices compostos adicionais para melhor performance
CALL create_index_if_not_exists('mak', 'inv', 'idx_inv_marca_modelo', 'marca, modelo');
CALL create_index_if_not_exists('mak', 'inv', 'idx_inv_habilitado_visivel', 'habilitado, visivel');

-- ============================================================
-- ÍNDICES PARA TABELA hoje (Pedidos)
-- NOTA: A maioria dos índices já existe nesta tabela
-- Índices existentes: vendedor, datae, idcli, data, nop, etc.
-- Cliente é idcli (não 'cliente')
-- ============================================================

-- Índices já existem - não criar:
-- idx_hoje_vendedor, idx_hoje_data, vendedor, idcli, datae, etc.

-- Índice composto adicional (se útil)
CALL create_index_if_not_exists('mak', 'hoje', 'idx_hoje_vendedor_datae', 'vendedor, datae');

-- ============================================================
-- ÍNDICES PARA TABELAS staging.* (SE EXISTIREM)
-- NOTA: Estas tabelas podem não existir em todos os ambientes
-- Descomentar conforme necessário
-- ============================================================

-- staging.audit_log
-- CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_user', 'user_id');
-- CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_action', 'action');
-- CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_resource', 'resource_type, resource_id');
-- CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_created', 'created_at');

-- staging.pricing_decision_event
-- CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_lead', 'lead_id');
-- CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_seller', 'seller_id');
-- CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_customer', 'customer_id');
-- CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_risk', 'risk_level');
-- CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_created', 'created_at');

-- staging.interactions
-- CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_customer', 'customer_id');
-- CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_user', 'user_id');
-- CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_followup', 'follow_up_date, follow_up_status');

-- staging.sales_goals
-- CALL create_index_if_not_exists('staging', 'sales_goals', 'idx_goals_seller', 'seller_id');
-- CALL create_index_if_not_exists('staging', 'sales_goals', 'idx_goals_period', 'year, month, seller_id');

-- ============================================================
-- LIMPEZA - Remover procedure temporária
-- ============================================================

DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- ============================================================
-- ANÁLISE DE TABELAS (MySQL 8.4)
-- Atualiza estatísticas para o otimizador de queries
-- ============================================================

ANALYZE TABLE mak.sCart;
ANALYZE TABLE mak.icart;
ANALYZE TABLE mak.clientes;
ANALYZE TABLE mak.inv;
ANALYZE TABLE mak.hoje;

-- ============================================================
-- VERIFICAÇÃO DE ÍNDICES CRIADOS
-- ============================================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA IN ('mak', 'staging')
  AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

SELECT '✅ Script de índices Q3.1 executado com sucesso!' AS status;
