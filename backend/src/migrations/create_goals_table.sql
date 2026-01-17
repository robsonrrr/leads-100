-- Tabela de Metas de Vendedores
-- Schema: staging

CREATE TABLE IF NOT EXISTS staging.seller_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    year INT NOT NULL,
    month INT NULL,  -- NULL = meta anual, 1-12 = meta mensal
    target_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_orders INT NULL,
    notes VARCHAR(255) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_seller_period (seller_id, year, month),
    INDEX idx_seller_id (seller_id),
    INDEX idx_year_month (year, month)
);

-- Tipos de metas:
-- month = NULL: Meta anual
-- month = 1-12: Meta mensal
