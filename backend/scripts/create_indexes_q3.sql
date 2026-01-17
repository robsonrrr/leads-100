-- ============================================================
-- Q3.1 - PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Sistema de Gestão de Leads - Rolemak
-- Created: 2026-01-17
-- MySQL Version: 8.4.7
-- ============================================================

-- NOTA: MySQL 8 não suporta "CREATE INDEX IF NOT EXISTS"
-- Este script usa DROP INDEX IF EXISTS antes de criar
-- Execute com cuidado em produção

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
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_created', 'cCreated DESC');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_user_created', 'cUser, cCreated DESC');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_orderweb', 'orderWeb');
CALL create_index_if_not_exists('mak', 'sCart', 'idx_scart_date_range', 'cCreated, cUser');

-- ============================================================
-- ÍNDICES PARA TABELA icart (Itens do Lead)
-- ============================================================

CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_lead', 'cCart');
CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_product', 'cProduct');
CALL create_index_if_not_exists('mak', 'icart', 'idx_icart_cart_product', 'cCart, cProduct');

-- ============================================================
-- ÍNDICES PARA TABELA clientes (Customers)
-- ============================================================

CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_vendedor', 'vendedor');
CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_estado', 'estado');
CALL create_index_if_not_exists('mak', 'clientes', 'idx_clientes_status', 'status');

-- Índices com prefixo para campos TEXT/VARCHAR longos
-- MySQL 8.4 suporta functional indexes, mas para compatibilidade usamos prefix
DELIMITER $$
DROP PROCEDURE IF EXISTS create_prefix_index$$
CREATE PROCEDURE create_prefix_index(
    IN p_table_schema VARCHAR(64),
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_prefix_length INT
)
BEGIN
    DECLARE v_index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = p_table_schema
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;
    
    IF v_index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_schema, '.', p_table_name, ' (', p_column_name, '(', p_prefix_length, '))');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✅ Índice criado: ', p_index_name) AS resultado;
    ELSE
        SELECT CONCAT('⏭️ Índice já existe: ', p_index_name) AS resultado;
    END IF;
END$$
DELIMITER ;

CALL create_prefix_index('mak', 'clientes', 'idx_clientes_nome', 'nome', 100);
CALL create_prefix_index('mak', 'clientes', 'idx_clientes_cidade', 'cidade', 50);

-- ============================================================
-- ÍNDICES PARA TABELA produtos (Products)
-- ============================================================

CALL create_index_if_not_exists('mak', 'produtos', 'idx_produtos_modelo', 'modelo');
CALL create_index_if_not_exists('mak', 'produtos', 'idx_produtos_marca', 'marca');
CALL create_prefix_index('mak', 'produtos', 'idx_produtos_descricao', 'descricao', 100);

-- ============================================================
-- ÍNDICES PARA TABELA inv (Inventário)
-- ============================================================

CALL create_index_if_not_exists('mak', 'inv', 'idx_inv_produto', 'codigo');

-- ============================================================
-- ÍNDICES PARA TABELA hoje (Pedidos)
-- ============================================================

CALL create_index_if_not_exists('mak', 'hoje', 'idx_hoje_vendedor', 'vendedor');
CALL create_index_if_not_exists('mak', 'hoje', 'idx_hoje_cliente', 'cliente');
CALL create_index_if_not_exists('mak', 'hoje', 'idx_hoje_data', 'data DESC');
CALL create_index_if_not_exists('mak', 'hoje', 'idx_hoje_vendedor_data', 'vendedor, data DESC');

-- ============================================================
-- ÍNDICES PARA TABELA staging.audit_log
-- ============================================================

CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_user', 'user_id');
CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_action', 'action');
CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_resource', 'resource_type, resource_id');
CALL create_index_if_not_exists('staging', 'audit_log', 'idx_audit_created', 'created_at DESC');

-- ============================================================
-- ÍNDICES PARA TABELA staging.pricing_decision_event
-- ============================================================

CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_lead', 'lead_id');
CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_seller', 'seller_id');
CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_customer', 'customer_id');
CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_risk', 'risk_level');
CALL create_index_if_not_exists('staging', 'pricing_decision_event', 'idx_pde_created', 'created_at DESC');

-- ============================================================
-- ÍNDICES PARA TABELA staging.interactions
-- ============================================================

CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_customer', 'customer_id');
CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_user', 'user_id');
CALL create_index_if_not_exists('staging', 'interactions', 'idx_interactions_followup', 'follow_up_date, follow_up_status');

-- ============================================================
-- ÍNDICES PARA TABELA staging.sales_goals
-- ============================================================

CALL create_index_if_not_exists('staging', 'sales_goals', 'idx_goals_seller', 'seller_id');
CALL create_index_if_not_exists('staging', 'sales_goals', 'idx_goals_period', 'year, month, seller_id');

-- ============================================================
-- LIMPEZA - Remover procedures temporárias
-- ============================================================

DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DROP PROCEDURE IF EXISTS create_prefix_index;

-- ============================================================
-- ANÁLISE DE TABELAS (MySQL 8.4 usa ANALYZE TABLE)
-- Atualiza estatísticas para o otimizador de queries
-- ============================================================

ANALYZE TABLE mak.sCart;
ANALYZE TABLE mak.icart;
ANALYZE TABLE mak.clientes;
ANALYZE TABLE mak.produtos;
ANALYZE TABLE mak.inv;
ANALYZE TABLE mak.hoje;

-- Tabelas staging (se existirem)
-- ANALYZE TABLE staging.audit_log;
-- ANALYZE TABLE staging.pricing_decision_event;
-- ANALYZE TABLE staging.interactions;
-- ANALYZE TABLE staging.sales_goals;

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

-- ============================================================
-- ESTATÍSTICAS DE PERFORMANCE (MySQL 8.4)
-- ============================================================

-- Verificar queries lentas (se performance_schema estiver habilitado)
/*
SELECT 
    DIGEST_TEXT,
    COUNT_STAR as executions,
    ROUND(AVG_TIMER_WAIT/1000000000, 2) as avg_ms,
    ROUND(MAX_TIMER_WAIT/1000000000, 2) as max_ms,
    ROUND(SUM_TIMER_WAIT/1000000000, 2) as total_ms
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME IN ('mak', 'staging')
  AND AVG_TIMER_WAIT > 100000000 -- > 100ms
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 20;
*/

-- Verificar uso de índices (MySQL 8.4)
/*
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME,
    COUNT_FETCH as rows_fetched,
    COUNT_INSERT + COUNT_UPDATE + COUNT_DELETE as modifications
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA IN ('mak', 'staging')
  AND INDEX_NAME IS NOT NULL
  AND INDEX_NAME != 'PRIMARY'
ORDER BY COUNT_FETCH DESC
LIMIT 20;
*/

SELECT '✅ Script de índices Q3.1 executado com sucesso!' AS status;
