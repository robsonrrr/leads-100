-- ============================================================================
-- View: produtos_estoque
-- Description: Consolidated view of product inventory across all warehouses
-- Warehouses: 109, 370, 613, 613_TTD, 885, 966
-- ============================================================================

CREATE OR REPLACE
ALGORITHM = UNDEFINED
DEFINER = `robsonrr`@`%`
SQL SECURITY DEFINER
VIEW `produtos_estoque` AS

SELECT
    -- ========================================================================
    -- Product Information
    -- ========================================================================
    produto.id                          AS produto_id,
    produto.modelo                      AS produto_modelo,
    segmento.segmento                   AS segmento,

    -- ========================================================================
    -- Warehouse 109 (mak_0109)
    -- ========================================================================
    COALESCE(e109.EstoqueDisponivel, 0)     AS e09_disponivel,
    COALESCE(e109.EstoqueReservado, 0)      AS e09_reservado,
    COALESCE(e109.EstoqueTemporario, 0)     AS e09_temporario,
    COALESCE(e109.EstoqueInconsistente, 0)  AS e09_inconsistente,
    (
        COALESCE(e109.EstoqueDisponivel, 0) +
        COALESCE(e109.EstoqueReservado, 0) +
        COALESCE(e109.EstoqueTemporario, 0) +
        COALESCE(e109.EstoqueInconsistente, 0)
    )                                       AS e09_total,

    -- ========================================================================
    -- Warehouse 370 (mak_0370)
    -- ========================================================================
    COALESCE(e370.EstoqueDisponivel, 0)     AS e70_disponivel,
    COALESCE(e370.EstoqueReservado, 0)      AS e70_reservado,
    COALESCE(e370.EstoqueTemporario, 0)     AS e70_temporario,
    COALESCE(e370.EstoqueInconsistente, 0)  AS e70_inconsistente,
    (
        COALESCE(e370.EstoqueDisponivel, 0) +
        COALESCE(e370.EstoqueReservado, 0) +
        COALESCE(e370.EstoqueTemporario, 0) +
        COALESCE(e370.EstoqueInconsistente, 0)
    )                                       AS e70_total,

    -- ========================================================================
    -- Warehouse 613 (mak_0613)
    -- ========================================================================
    COALESCE(e613.EstoqueDisponivel, 0)     AS e13_disponivel,
    COALESCE(e613.EstoqueReservado, 0)      AS e13_reservado,
    COALESCE(e613.EstoqueTemporario, 0)     AS e13_temporario,
    COALESCE(e613.EstoqueInconsistente, 0)  AS e13_inconsistente,
    (
        COALESCE(e613.EstoqueDisponivel, 0) +
        COALESCE(e613.EstoqueReservado, 0) +
        COALESCE(e613.EstoqueTemporario, 0) +
        COALESCE(e613.EstoqueInconsistente, 0)
    )                                       AS e13_total,

    -- ========================================================================
    -- Warehouse 613 TTD (mak_0613 - TTD variant)
    -- ========================================================================
    COALESCE(e613_ttd.EstoqueDisponivel, 0) AS e13_ttd_disponivel,
    COALESCE(e613_ttd.EstoqueReservado, 0)  AS e13_ttd_reservado,
    (
        COALESCE(e613_ttd.EstoqueDisponivel, 0) +
        COALESCE(e613_ttd.EstoqueReservado, 0)
    )                                       AS e13_ttd_total,

    -- ========================================================================
    -- Warehouse 885 (mak_0885)
    -- ========================================================================
    COALESCE(e885.EstoqueDisponivel, 0)     AS e85_disponivel,
    COALESCE(e885.EstoqueReservado, 0)      AS e85_reservado,
    COALESCE(e885.EstoqueTemporario, 0)     AS e85_temporario,
    COALESCE(e885.EstoqueInconsistente, 0)  AS e85_inconsistente,
    (
        COALESCE(e885.EstoqueDisponivel, 0) +
        COALESCE(e885.EstoqueReservado, 0) +
        COALESCE(e885.EstoqueTemporario, 0) +
        COALESCE(e885.EstoqueInconsistente, 0)
    )                                       AS e85_total,

    -- ========================================================================
    -- Warehouse 966 (mak_0966)
    -- ========================================================================
    COALESCE(e966.EstoqueDisponivel, 0)     AS e66_disponivel,
    COALESCE(e966.EstoqueReservado, 0)      AS e66_reservado,
    COALESCE(e966.EstoqueTemporario, 0)     AS e66_temporario,
    COALESCE(e966.EstoqueInconsistente, 0)  AS e66_inconsistente,
    (
        COALESCE(e966.EstoqueDisponivel, 0) +
        COALESCE(e966.EstoqueReservado, 0) +
        COALESCE(e966.EstoqueTemporario, 0) +
        COALESCE(e966.EstoqueInconsistente, 0)
    )                                       AS e66_total,

    -- ========================================================================
    -- Grand Total (All Warehouses Combined)
    -- Includes: Disponivel + Reservado + Temporario (excludes Inconsistente)
    -- ========================================================================
    (
        -- Disponivel (Available)
        COALESCE(e109.EstoqueDisponivel, 0) +
        COALESCE(e370.EstoqueDisponivel, 0) +
        COALESCE(e613.EstoqueDisponivel, 0) +
        COALESCE(e613_ttd.EstoqueDisponivel, 0) +
        COALESCE(e885.EstoqueDisponivel, 0) +
        COALESCE(e966.EstoqueDisponivel, 0) +
        -- Reservado (Reserved)
        COALESCE(e109.EstoqueReservado, 0) +
        COALESCE(e370.EstoqueReservado, 0) +
        COALESCE(e613.EstoqueReservado, 0) +
        COALESCE(e613_ttd.EstoqueReservado, 0) +
        COALESCE(e885.EstoqueReservado, 0) +
        COALESCE(e966.EstoqueReservado, 0) +
        -- Temporario (Temporary)
        COALESCE(e109.EstoqueTemporario, 0) +
        COALESCE(e370.EstoqueTemporario, 0) +
        COALESCE(e613.EstoqueTemporario, 0) +
        COALESCE(e885.EstoqueTemporario, 0) +
        COALESCE(e966.EstoqueTemporario, 0)
    )                                       AS total_disponivel

-- ============================================================================
-- FROM Clause with JOINs
-- ============================================================================
FROM
    inv AS produto

-- Product segment information
LEFT JOIN produtos AS segmento
    ON segmento.id = produto.idcf

-- Warehouse 109
LEFT JOIN mak_0109.Estoque AS e109
    ON e109.ProdutoPOID = produto.id

-- Warehouse 370
LEFT JOIN mak_0370.Estoque AS e370
    ON e370.ProdutoPOID = produto.id

-- Warehouse 613
LEFT JOIN mak_0613.Estoque AS e613
    ON e613.ProdutoPOID = produto.id

-- Warehouse 613 TTD
LEFT JOIN mak_0613.Estoque_TTD_1 AS e613_ttd
    ON e613_ttd.ProdutoPOID = produto.id

-- Warehouse 885
LEFT JOIN mak_0885.Estoque AS e885
    ON e885.ProdutoPOID = produto.id

-- Warehouse 966
LEFT JOIN mak_0966.Estoque AS e966
    ON e966.ProdutoPOID = produto.id;

-- ============================================================================
-- Example Query
-- ============================================================================
-- SELECT * FROM mak.produtos_estoque;
-- SELECT * FROM mak.produtos_estoque WHERE total_disponivel > 0;
-- SELECT * FROM mak.produtos_estoque WHERE produto_modelo LIKE '%MODEL%';
