-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO - METAS POR CLIENTE
-- Execute este script no MySQL para melhorar performance
-- =====================================================

-- Índice composto na Vendas_Historia para queries de metas
-- Esta é a query mais pesada do sistema
CREATE INDEX IF NOT EXISTS idx_vendas_historia_goals 
ON mak.Vendas_Historia (VendedorID, DataVenda, ProdutoSegmento, ClienteID, Quantidade);

-- Índice alternativo se o acima não funcionar (versão MySQL < 8)
-- CREATE INDEX idx_vendas_historia_vendedor_data 
-- ON mak.Vendas_Historia (VendedorID, DataVenda);

-- Índice na customer_goals para busca rápida por vendedor
CREATE INDEX IF NOT EXISTS idx_customer_goals_seller_year 
ON mak.customer_goals (seller_id, year, classification);

-- Verificar índices existentes
SHOW INDEX FROM mak.Vendas_Historia;
SHOW INDEX FROM mak.customer_goals;
