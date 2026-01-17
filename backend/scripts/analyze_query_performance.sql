-- ============================================================
-- Q3.1 - QUERY PERFORMANCE ANALYSIS
-- Sistema de Gestão de Leads - Rolemak
-- Created: 2026-01-17
-- MySQL Version: 8.4.7
-- ============================================================

-- ============================================================
-- 1. QUERIES CRÍTICAS DO SISTEMA (ANALISAR COM EXPLAIN)
-- ============================================================

-- Execute cada EXPLAIN e verifique se usa índices

-- 1.1 Listagem de leads por vendedor (mais comum)
EXPLAIN ANALYZE
SELECT s.*, c.nome as customer_nome
FROM mak.sCart s
LEFT JOIN mak.clientes c ON s.cCustomer = c.id
WHERE s.cSeller = 123  -- substitua pelo ID do vendedor
  AND s.cType = 1
ORDER BY s.dCart DESC
LIMIT 20;

-- 1.2 Busca de itens do lead
EXPLAIN ANALYZE
SELECT i.*, inv.modelo, inv.marca, inv.nome
FROM mak.icart i
LEFT JOIN mak.inv inv ON i.cProduct = inv.id
WHERE i.cSCart = 12345;  -- substitua pelo ID do lead

-- 1.3 Listagem de clientes por vendedor
EXPLAIN ANALYZE
SELECT *
FROM mak.clientes
WHERE vendedor = 123
  AND bloqueado = 0
  AND ativo = 1
ORDER BY nome
LIMIT 50;

-- 1.4 Busca de produtos
EXPLAIN ANALYZE
SELECT *
FROM mak.inv
WHERE marca = 'SKF'
  AND habilitado = '1'
  AND visivel = '1'
ORDER BY modelo
LIMIT 20;

-- 1.5 Pedidos por vendedor e período
EXPLAIN ANALYZE
SELECT *
FROM mak.hoje
WHERE vendedor = 123
  AND datae BETWEEN '2026-01-01' AND '2026-01-31'
ORDER BY datae DESC;

-- ============================================================
-- 2. ANÁLISE DE SLOW QUERIES
-- ============================================================

-- Verificar se slow query log está habilitado
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- Para habilitar slow query log (executar como admin):
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 1;  -- queries > 1 segundo

-- ============================================================
-- 3. ESTATÍSTICAS DOS ÍNDICES
-- ============================================================

-- 3.1 Ver todos os índices criados pelo Q3.1
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
    INDEX_TYPE,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mak'
  AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE, CARDINALITY
ORDER BY TABLE_NAME, INDEX_NAME;

-- 3.2 Verificar uso de índices (se performance_schema habilitado)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME,
    COUNT_FETCH as reads,
    COUNT_INSERT + COUNT_UPDATE + COUNT_DELETE as writes
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA = 'mak'
  AND INDEX_NAME IS NOT NULL
  AND INDEX_NAME LIKE 'idx_%'
ORDER BY COUNT_FETCH DESC;

-- ============================================================
-- 4. TOP QUERIES MAIS LENTAS (MySQL 8.4)
-- ============================================================

SELECT 
    SUBSTRING(DIGEST_TEXT, 1, 100) as query_preview,
    COUNT_STAR as executions,
    ROUND(AVG_TIMER_WAIT/1000000000, 2) as avg_ms,
    ROUND(MAX_TIMER_WAIT/1000000000, 2) as max_ms,
    ROUND(SUM_TIMER_WAIT/1000000000, 2) as total_ms,
    SUM_ROWS_EXAMINED as rows_examined,
    SUM_ROWS_SENT as rows_sent
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'mak'
  AND AVG_TIMER_WAIT > 100000000  -- > 100ms
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 20;

-- ============================================================
-- 5. VERIFICAR TABLE SCANS (full table scans)
-- ============================================================

SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ as total_reads,
    COUNT_FETCH as index_reads,
    (COUNT_READ - COUNT_FETCH) as full_scans
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA = 'mak'
  AND (COUNT_READ - COUNT_FETCH) > 0
ORDER BY (COUNT_READ - COUNT_FETCH) DESC
LIMIT 20;

-- ============================================================
-- 6. RECOMENDAÇÕES DE ÍNDICES AUSENTES
-- ============================================================

-- Queries que fazem full table scan frequentemente
-- precisam de índices nas colunas WHERE e ORDER BY

-- Checklist para cada query:
-- 1. Executar EXPLAIN
-- 2. Verificar coluna "key" (deve mostrar nome do índice)
-- 3. Verificar "type" (deve ser ref, range, const - NÃO "ALL")
-- 4. Verificar "rows" (deve ser menor que o total da tabela)
-- 5. Verificar "Extra" (evitar "Using filesort", "Using temporary")

-- ============================================================
-- 7. METAS DE PERFORMANCE Q3.1
-- ============================================================

-- Metas:
-- ✅ API p95 < 300ms
-- ✅ Queries principais < 100ms
-- ✅ Zero full table scans em queries frequentes
-- ✅ Cache hit rate > 70% (Redis)

-- ============================================================
-- 8. TABELAS PARA ANALYZE (atualizar estatísticas)
-- ============================================================

-- Executar periodicamente para manter estatísticas atualizadas
ANALYZE TABLE mak.sCart;
ANALYZE TABLE mak.icart;
ANALYZE TABLE mak.clientes;
ANALYZE TABLE mak.inv;
ANALYZE TABLE mak.hoje;

SELECT '✅ Script de análise de performance executado!' AS status;
