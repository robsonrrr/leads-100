-- Tabela para armazenar produtos favoritos dos vendedores
-- Cada vendedor pode ter sua lista de produtos favoritos
CREATE TABLE IF NOT EXISTS seller_favorite_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL COMMENT 'ID do vendedor (cUser)',
  product_id INT NOT NULL COMMENT 'ID do produto (inv.id)',
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY uk_seller_product (seller_id, product_id),
  INDEX idx_seller (seller_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Produtos favoritos dos vendedores';

-- Exemplo de uso:
-- INSERT INTO seller_favorite_products (seller_id, product_id) VALUES (12345, 1979575);
-- DELETE FROM seller_favorite_products WHERE seller_id = 12345 AND product_id = 1979575;
-- SELECT * FROM seller_favorite_products WHERE seller_id = 12345;
