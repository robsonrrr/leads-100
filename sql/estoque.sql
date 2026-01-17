-- ============================================================================
-- View: produtos_estoque_por_unidades
-- Description: Normalized view of product inventory by warehouse unit
-- Shows one row per product per warehouse with unit name from Emitentes
-- Warehouses: 109, 370, 613, 613_TTD, 885, 966
-- EmitentePOID mapping: mak_0109->1, mak_0370->3, mak_0613->6, mak_0885->8, mak_0966->9
-- ============================================================================

CREATE OR REPLACE
ALGORITHM = UNDEFINED
DEFINER = `robsonrr`@`%`
SQL SECURITY DEFINER
VIEW `produtos_estoque_por_unidades` AS

-- Warehouse 109 -> EmitentePOID = 1
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    109 AS unidade_id,
    COALESCE(emitente.Fantasia, 'Unidade 109') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e109.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e109.EstoqueReservado, 0) AS estoque_reservado,
    COALESCE(e109.EstoqueTemporario, 0) AS estoque_temporario,
    COALESCE(e109.EstoqueInconsistente, 0) AS estoque_inconsistente,
    (
        COALESCE(e109.EstoqueDisponivel, 0) +
        COALESCE(e109.EstoqueReservado, 0) +
        COALESCE(e109.EstoqueTemporario, 0) +
        COALESCE(e109.EstoqueInconsistente, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0109.Estoque AS e109 ON e109.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 1
WHERE COALESCE(e109.EstoqueDisponivel, 0) > 0 OR COALESCE(e109.EstoqueReservado, 0) > 0

UNION ALL

-- Warehouse 370 -> EmitentePOID = 3
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    370 AS unidade_id,
    COALESCE(emitente.Fantasia, 'Unidade 370') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e370.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e370.EstoqueReservado, 0) AS estoque_reservado,
    COALESCE(e370.EstoqueTemporario, 0) AS estoque_temporario,
    COALESCE(e370.EstoqueInconsistente, 0) AS estoque_inconsistente,
    (
        COALESCE(e370.EstoqueDisponivel, 0) +
        COALESCE(e370.EstoqueReservado, 0) +
        COALESCE(e370.EstoqueTemporario, 0) +
        COALESCE(e370.EstoqueInconsistente, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0370.Estoque AS e370 ON e370.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 3
WHERE COALESCE(e370.EstoqueDisponivel, 0) > 0 OR COALESCE(e370.EstoqueReservado, 0) > 0

UNION ALL

-- Warehouse 613 -> EmitentePOID = 6
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    613 AS unidade_id,
    COALESCE(emitente.Fantasia, 'Unidade 613') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e613.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e613.EstoqueReservado, 0) AS estoque_reservado,
    COALESCE(e613.EstoqueTemporario, 0) AS estoque_temporario,
    COALESCE(e613.EstoqueInconsistente, 0) AS estoque_inconsistente,
    (
        COALESCE(e613.EstoqueDisponivel, 0) +
        COALESCE(e613.EstoqueReservado, 0) +
        COALESCE(e613.EstoqueTemporario, 0) +
        COALESCE(e613.EstoqueInconsistente, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0613.Estoque AS e613 ON e613.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 6
WHERE COALESCE(e613.EstoqueDisponivel, 0) > 0 OR COALESCE(e613.EstoqueReservado, 0) > 0

UNION ALL

-- Warehouse 613 TTD -> EmitentePOID = 6
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    6131 AS unidade_id,
    CONCAT(COALESCE(emitente.Fantasia, 'Unidade 613'), ' TTD') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e613_ttd.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e613_ttd.EstoqueReservado, 0) AS estoque_reservado,
    0 AS estoque_temporario,
    0 AS estoque_inconsistente,
    (
        COALESCE(e613_ttd.EstoqueDisponivel, 0) +
        COALESCE(e613_ttd.EstoqueReservado, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0613.Estoque_TTD_1 AS e613_ttd ON e613_ttd.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 6
WHERE COALESCE(e613_ttd.EstoqueDisponivel, 0) > 0 OR COALESCE(e613_ttd.EstoqueReservado, 0) > 0

UNION ALL

-- Warehouse 885 -> EmitentePOID = 8
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    885 AS unidade_id,
    COALESCE(emitente.Fantasia, 'Unidade 885') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e885.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e885.EstoqueReservado, 0) AS estoque_reservado,
    COALESCE(e885.EstoqueTemporario, 0) AS estoque_temporario,
    COALESCE(e885.EstoqueInconsistente, 0) AS estoque_inconsistente,
    (
        COALESCE(e885.EstoqueDisponivel, 0) +
        COALESCE(e885.EstoqueReservado, 0) +
        COALESCE(e885.EstoqueTemporario, 0) +
        COALESCE(e885.EstoqueInconsistente, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0885.Estoque AS e885 ON e885.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 8
WHERE COALESCE(e885.EstoqueDisponivel, 0) > 0 OR COALESCE(e885.EstoqueReservado, 0) > 0

UNION ALL

-- Warehouse 966 -> EmitentePOID = 9
SELECT
    produto.id AS produto_id,
    produto.modelo AS produto_modelo,
    segmento.segmento AS segmento,
    966 AS unidade_id,
    COALESCE(emitente.Fantasia, 'Unidade 966') AS unidade_fantasia,
    COALESCE(emitente.UF, '') AS unidade_uf,
    COALESCE(e966.EstoqueDisponivel, 0) AS estoque_disponivel,
    COALESCE(e966.EstoqueReservado, 0) AS estoque_reservado,
    COALESCE(e966.EstoqueTemporario, 0) AS estoque_temporario,
    COALESCE(e966.EstoqueInconsistente, 0) AS estoque_inconsistente,
    (
        COALESCE(e966.EstoqueDisponivel, 0) +
        COALESCE(e966.EstoqueReservado, 0) +
        COALESCE(e966.EstoqueTemporario, 0) +
        COALESCE(e966.EstoqueInconsistente, 0)
    ) AS estoque_total
FROM inv AS produto
LEFT JOIN produtos AS segmento ON segmento.id = produto.idcf
LEFT JOIN mak_0966.Estoque AS e966 ON e966.ProdutoPOID = produto.id
LEFT JOIN mak.Emitentes AS emitente ON emitente.EmitentePOID = 9
WHERE COALESCE(e966.EstoqueDisponivel, 0) > 0 OR COALESCE(e966.EstoqueReservado, 0) > 0;

-- ============================================================================
-- Mapeamento Schema -> EmitentePOID
-- ============================================================================
-- mak_0109 -> 1
-- mak_0370 -> 3
-- mak_0613 -> 6
-- mak_0885 -> 8
-- mak_0966 -> 9
-- mak_1008 -> 10 (exemplo)
-- ============================================================================

-- ============================================================================
-- Example Queries
-- ============================================================================
-- Get all stock by warehouse for a product:
-- SELECT * FROM mak.produtos_estoque_por_unidades WHERE produto_id = 12345;

-- Get stock summary by warehouse:
-- SELECT unidade_fantasia, SUM(estoque_disponivel) as total
-- FROM mak.produtos_estoque_por_unidades
-- GROUP BY unidade_id, unidade_fantasia;

-- Get products with stock in a specific warehouse:
-- SELECT * FROM mak.produtos_estoque_por_unidades WHERE unidade_id = 613;
