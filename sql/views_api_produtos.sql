-- =====================================================
-- Views para API Leads Agent - Catálogo de Produtos
-- Schema: Ecommerce (compatível com produtos_ecommerce existente)
-- Criado em: 2026-01-17
-- =====================================================

-- =====================================================
-- 1. View para Listagem de Produtos (GET /api/products)
-- Otimizada para paginação e filtros (SEM estoque para performance)
-- Estoque deve ser buscado separadamente via /products/:id/stock
-- =====================================================
CREATE OR REPLACE VIEW Ecommerce.vw_produtos_listagem AS
SELECT 
    i.id,
    i.modelo,
    i.nome,
    i.description as descricao,
    i.marca,
    i.codebar,
    i.revenda as preco_tabela,
    i.custo,
    p.segmento,
    p.segmento_id,
    p.categoria,
    p.ncm,
    p.vip,
    -- URL da imagem
    CONCAT('https://img.rolemak.com.br/id/h180/', i.id, '.jpg') as imagem_url,
    -- Flags de status
    CASE WHEN i.revenda > 0 THEN 1 ELSE 0 END as tem_preco
FROM mak.inv i
LEFT JOIN mak.produtos p ON i.idcf = p.id
WHERE i.revenda > 0;  -- Apenas produtos com preço

-- =====================================================
-- 2. View para Detalhes do Produto (GET /api/products/:id/details)
-- Dados completos para modal de detalhes
-- =====================================================
CREATE OR REPLACE VIEW Ecommerce.vw_produto_detalhes AS
SELECT 
    -- Dados básicos
    i.id,
    i.modelo,
    i.nome,
    i.description as descricao,
    i.marca,
    i.codebar,
    i.revenda as preco_tabela,
    i.custo,
    
    -- Dados do ecommerce (se existir)
    COALESCE(pe.produtoNome, i.nome) as nome_catalogo,
    pe.produtoTitulo as titulo,
    pe.produtoDescricaoCurta as descricao_curta,
    pe.produtoCDescricao as descricao_completa,
    pe.produtoComplemento as complemento,
    pe.produtoKeywords as keywords,
    pe.produtoURLCatalogo as url_catalogo,
    pe.produtoURLVideo as url_video,
    
    -- Segmento e Categoria
    p.segmento,
    p.segmento_id,
    p.categoria,
    COALESCE(pe.segmentoNome, p.segmento) as segmento_nome,
    COALESCE(pe.categoriaNome, p.categoria) as categoria_nome,
    
    -- Dados fiscais
    p.ncm,
    
    -- Estoque total agregado
    COALESCE((
        SELECT SUM(e.estoque_disponivel) 
        FROM mak.produtos_estoque_por_unidades e 
        WHERE e.produto_id = i.id
    ), 0) as estoque_total,
    
    -- Flags ecommerce
    COALESCE(pe.produtoAtivo, 0) as ativo_ecommerce,
    COALESCE(pe.produtoFeature, 0) as destaque,
    COALESCE(pe.produtoVarejo, 0) as varejo,
    COALESCE(pe.produtoOutlet, 0) as outlet,
    COALESCE(pe.produtoArrivals, 0) as lancamento,
    
    -- Medidas (se disponíveis)
    pe.produtoMedidaDzao as medida_d,
    pe.produtoMedidaDzinho as medida_d2,
    pe.produtoMedidaB as medida_b,
    pe.produtoMedidaL as medida_l,
    
    -- Imagens
    CONCAT('https://img.rolemak.com.br/id/', i.id, '.jpg') as imagem_principal,
    CONCAT('https://img.rolemak.com.br/id/h180/', i.id, '.jpg') as imagem_thumb,
    CONCAT('https://img.rolemak.com.br/id/h480/', i.id, '.jpg') as imagem_media
    
FROM mak.inv i
LEFT JOIN mak.produtos p ON i.idcf = p.id
LEFT JOIN Ecommerce.produtos_ecommerce pe ON pe.id = i.id;

-- =====================================================
-- 3. View para Códigos Relacionados (similar/original)
-- Para exibir na página de detalhes
-- =====================================================
CREATE OR REPLACE VIEW Ecommerce.vw_produto_codigos AS
SELECT 
    cc.product_id,
    cc.type as tipo,  -- 1 = similar, 2 = original
    CASE cc.type 
        WHEN 1 THEN 'similar'
        WHEN 2 THEN 'original'
        ELSE 'outro'
    END as tipo_nome,
    COALESCE(sc.similar_code, oc.original_code) as codigo,
    COALESCE(sb.brand, ob.brand) as marca
FROM Catalogo.catalog_codes cc
LEFT JOIN Catalogo.auto_similar_codes sc ON cc.type = 1 AND cc.code = sc.id
LEFT JOIN Catalogo.auto_similar_brands sb ON sc.similar_brand_id = sb.id
LEFT JOIN Catalogo.auto_original_codes oc ON cc.type = 2 AND cc.code = oc.id
LEFT JOIN Catalogo.auto_original_brands ob ON oc.original_brand_id = ob.id
ORDER BY cc.product_id, cc.type;

-- =====================================================
-- 4. View para Aplicações do Produto (carros/motos)
-- Simplificada para exibição
-- =====================================================
CREATE OR REPLACE VIEW Ecommerce.vw_produto_aplicacoes AS
SELECT 
    product_id,
    'CARRO' as tipo_veiculo,
    montadora,
    modelo,
    ano_inicio,
    ano_fim,
    motor2 as motor,
    tipo as categoria_veiculo,
    localizacao as posicao
FROM Catalogo.vw_catalogo_carros
UNION ALL
SELECT 
    product_id,
    'MOTO' as tipo_veiculo,
    maker as montadora,
    moto_modelo as modelo,
    year as ano_inicio,
    year as ano_fim,
    moto_cc as motor,
    moto_grupo as categoria_veiculo,
    moto_posicao as posicao
FROM Catalogo.vw_catalogo_motos;

-- =====================================================
-- 5. View para Segmentos e Categorias (filtros)
-- =====================================================
CREATE OR REPLACE VIEW Ecommerce.vw_segmentos_categorias AS
SELECT DISTINCT
    p.segmento,
    p.segmento_id,
    p.categoria,
    COUNT(DISTINCT i.id) as total_produtos
FROM mak.produtos p
INNER JOIN mak.inv i ON i.idcf = p.id
WHERE i.revenda > 0
GROUP BY p.segmento, p.segmento_id, p.categoria
ORDER BY p.segmento, p.categoria;

-- =====================================================
-- 6. View para Produtos em Promoção
-- NOTA: Tabela mak.promocao_lista não existe atualmente
-- Descomentar quando a tabela for criada
-- =====================================================
/*
CREATE OR REPLACE VIEW Ecommerce.vw_produtos_promocao AS
SELECT 
    pl.produto_id as id,
    i.modelo,
    i.nome,
    i.marca,
    i.revenda as preco_original,
    pl.preco as preco_promocao,
    ROUND((1 - pl.preco / i.revenda) * 100, 0) as desconto_percentual,
    pl.data_inicio,
    pl.data_fim,
    CONCAT('https://img.rolemak.com.br/id/h180/', pl.produto_id, '.jpg') as imagem_url
FROM mak.promocao_lista pl
INNER JOIN mak.inv i ON i.id = pl.produto_id
INNER JOIN mak.promocao_cabecalho pc ON pc.id = pl.promocao_id
WHERE pc.ativo = 1
  AND CURDATE() BETWEEN COALESCE(pl.data_inicio, '2000-01-01') 
                    AND COALESCE(pl.data_fim, '2099-12-31');
*/

-- =====================================================
-- Exemplos de uso:
-- =====================================================
/*
-- Listagem paginada:
SELECT * FROM Ecommerce.vw_produtos_listagem 
WHERE segmento = 'ROLAMENTOS'
ORDER BY preco_tabela DESC
LIMIT 20 OFFSET 0;

-- Detalhes do produto:
SELECT * FROM Ecommerce.vw_produto_detalhes WHERE id = 12345;

-- Códigos do produto:
SELECT * FROM Ecommerce.vw_produto_codigos WHERE product_id = 12345;

-- Aplicações do produto:
SELECT * FROM Ecommerce.vw_produto_aplicacoes WHERE product_id = 12345;

-- Segmentos disponíveis:
SELECT segmento, SUM(total_produtos) as total 
FROM Ecommerce.vw_segmentos_categorias 
GROUP BY segmento, segmento_id 
ORDER BY segmento;

-- Produtos em promoção:
SELECT * FROM Ecommerce.vw_produtos_promocao LIMIT 10;
*/
