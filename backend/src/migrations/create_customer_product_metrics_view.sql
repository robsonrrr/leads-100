-- Migração Q2 2026: Métricas de Produtos por Cliente para Recomendações de Desconto
CREATE OR REPLACE VIEW staging.customer_product_metrics AS
SELECT 
    soi.customer_id as customerId,
    soi.sku as productId,
    i.modelo as productCode,
    i.nome as productName,
    COUNT(DISTINCT soi.order_id) as orders_count,
    SUM(soi.qty) as total_qty,
    MAX(soi.order_date_original) as lastOrderDate,
    AVG(soi.discount_pct) as avg_discount
FROM staging.staging_order_items soi
JOIN inv i ON soi.sku = i.id
GROUP BY soi.customer_id, soi.sku;
