-- MySQL Views para Popular Solr
-- Versão: MySQL 8.4.7
-- Criado em: 2026-01-17
-- Baseado nas consultas do CatalogController.php
-- Schema: catalog (principal), vallery (mak.*)

-- =====================================================
-- 1. View para Dados Básicos do Produto (Vallery)
-- =====================================================
CREATE OR REPLACE VIEW vw_produto_dados_basicos AS
SELECT 
    inv.id as produto_id,
    inv.idcf,
    inv.modelo,
    inv.nome,
    inv.seo,
    inv.marca,
    inv.habilitado,
    inv.codebar,
    inv.embalagem,
    inv.origem as OrigemPOID,
    inv.st,
    inv.isento_st,
    inv.icms_antecipado,
    inv.vip,
    produtos.ncm
FROM mak.inv 
LEFT JOIN mak.produtos ON produtos.id = inv.idcf;

-- =====================================================
-- 2. View para Códigos Similares
-- =====================================================
CREATE OR REPLACE VIEW vw_catalogo_similar AS
SELECT 
    c.product_id,
    c.code as similarID,
    s.similar_code as similarCodigo,
    sb.id as similarMarcaPOID,
    sb.brand as similarMarca
FROM catalog.catalog_codes c 
LEFT JOIN catalog.auto_similar_codes s ON c.code = s.id 
LEFT JOIN catalog.auto_similar_brands sb ON s.similar_brand_id = sb.id 
WHERE c.type = 1;

-- =====================================================
-- 3. View para Códigos Originais
-- =====================================================
CREATE OR REPLACE VIEW vw_catalogo_original AS
SELECT 
    c.product_id,
    c.code as originalID,
    s.original_code as originalCodigo,
    sb.id as originalMarcaPOID,
    sb.brand as originalMarca
FROM catalog.catalog_codes c 
LEFT JOIN catalog.auto_original_codes s ON c.code = s.id 
LEFT JOIN catalog.auto_original_brands sb ON s.original_brand_id = sb.id 
WHERE c.type = 2;

-- =====================================================
-- 4. View para Características dos Produtos
-- =====================================================
CREATE OR REPLACE VIEW vw_catalogo_caracteristicas AS
SELECT 
    cf.product_id,
    cf.feature,
    cf.attributes,
    f.f_measure as caracteristicaMedida,
    f.f_seo as caracteristicaSEO,
    f.f_order as caracteristicaOrdem,
    f.f_name as caracteristicaNome,
    f.segments,
    a.attribute as atributoNome
FROM catalog.catalog_features cf 
LEFT JOIN catalog.features f ON cf.feature = f.id 
LEFT JOIN catalog.features_attributes a ON cf.attributes = a.id
ORDER BY cf.product_id, f.f_order;

-- =====================================================
-- 5. View para Aplicações em Motos
-- =====================================================
CREATE OR REPLACE VIEW vw_catalogo_motos AS
SELECT 
    am.product_id,
    am.id as moto_aplicacao_id,
    maker.maker,
    mc.cc as moto_cc,
    mf.feature as moto_feature,
    ml.model as moto_modelo,
    ms.name as moto_submodelo,
    mo.obs as moto_observacao,
    mp.name as moto_posicao,
    mg.name as moto_grupo,
    mb.name as moto_subgrupo,
    ma.name as moto_aplicacao,
    am.year,
    am.layout
FROM catalog.auto_motos am
LEFT JOIN catalog.moto_cc mc ON am.cc = mc.id
LEFT JOIN catalog.moto_features mf ON am.feature = mf.id
LEFT JOIN catalog.moto_models ml ON am.model = ml.id
LEFT JOIN catalog.moto_models_sub ms ON am.submodel = ms.id
LEFT JOIN catalog.moto_obs mo ON am.obs = mo.id
LEFT JOIN catalog.moto_positions mp ON am.position = mp.id
LEFT JOIN catalog.moto_group mg ON am.group = mg.id
LEFT JOIN catalog.moto_group_sub mb ON am.subgroup = mb.id
LEFT JOIN catalog.moto_applications ma ON am.app = ma.id
LEFT JOIN catalog.auto_makers maker ON ml.maker_id = maker.id
ORDER BY am.product_id, maker.maker, ml.model, mc.cc;

-- =====================================================
-- 6. View para Aplicações em Carros
-- =====================================================
CREATE OR REPLACE VIEW vw_catalogo_carros AS
SELECT 
    ca.product_id,
    ca.id as carro_aplicacao_id,
    ty.id as type_id,
    ty.name as tipo,
    ma.maker as montadora,
    mo.model as modelo,
    lo.local as localizacao,
    ye.year as ano_inicio,
    ya.year as ano_fim,
    m1.name as motor2,
    m2.name as motor3,
    m3.name as valvulas,
    m4.name as cilindrada,
    m5.name as ar,
    m6.name as abs,
    m7.name as cambio,
    m8.name as direcao,
    m9.name as combustivel,
    ca.feature2
FROM catalog.catalog_aplication ca 
LEFT JOIN catalog.auto_types ty ON ca.type = ty.id
LEFT JOIN catalog.auto_makers ma ON ca.maker = ma.id
LEFT JOIN catalog.auto_models mo ON ca.model = mo.id
LEFT JOIN catalog.auto_local lo ON ca.local = lo.id
LEFT JOIN catalog.auto_years ye ON ca.year_start = ye.id
LEFT JOIN catalog.auto_years ya ON ca.year_end = ya.id
LEFT JOIN catalog.auto_motor2 m1 ON ca.motor2 = m1.id
LEFT JOIN catalog.auto_motor2 m2 ON ca.motor3 = m2.id
LEFT JOIN catalog.auto_motor2 m3 ON ca.valve = m3.id
LEFT JOIN catalog.auto_motor2 m4 ON ca.cc = m4.id
LEFT JOIN catalog.auto_motor2 m5 ON ca.air = m5.id
LEFT JOIN catalog.auto_motor2 m6 ON ca.abs = m6.id
LEFT JOIN catalog.auto_motor2 m7 ON ca.exchange = m7.id
LEFT JOIN catalog.auto_motor2 m8 ON ca.direction = m8.id
LEFT JOIN catalog.auto_motor2 m9 ON ca.fuel = m9.id
ORDER BY ca.product_id, ty.name, ma.maker, mo.model, m2.name, m3.name, ye.year;

-- =====================================================
-- 7. View Consolidada para Solr (Produto Completo) - MySQL 8.4.7
-- =====================================================
CREATE OR REPLACE VIEW vw_solr_produto_completo AS
SELECT 
    -- Dados básicos
    pdb.produto_id,
    pdb.modelo,
    pdb.nome,
    pdb.seo,
    pdb.marca,
    pdb.ncm,
    pdb.habilitado,
    pdb.codebar,
    pdb.embalagem,
    pdb.OrigemPOID,
    pdb.st,
    pdb.isento_st,
    pdb.icms_antecipado,
    pdb.vip,
    
    -- Códigos similares (agregados como JSON array)
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', similarID,
                'codigo', COALESCE(similarCodigo, ''),
                'marca', COALESCE(similarMarca, '')
            )
        ) FILTER (WHERE similarID IS NOT NULL),
        JSON_ARRAY()
    ) as codigos_similares,
    
    -- Códigos originais (agregados como JSON array)
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', originalID,
                'codigo', COALESCE(originalCodigo, ''),
                'marca', COALESCE(originalMarca, '')
            )
        ) FILTER (WHERE originalID IS NOT NULL),
        JSON_ARRAY()
    ) as codigos_originais,
    
    -- Características (agregadas como JSON array)
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'seo', COALESCE(caracteristicaSEO, ''),
                'nome', COALESCE(caracteristicaNome, ''),
                'atributo', COALESCE(atributoNome, ''),
                'ordem', COALESCE(caracteristicaOrdem, 0),
                'medida', COALESCE(caracteristicaMedida, ''),
                'segmento', COALESCE(segments, 0)
            )
        ) FILTER (WHERE caracteristicaSEO IS NOT NULL),
        JSON_ARRAY()
    ) as caracteristicas,
    
    -- Aplicações em motos (agregadas como JSON array)
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'maker', COALESCE(maker, ''),
                'modelo', COALESCE(moto_modelo, ''),
                'cc', COALESCE(moto_cc, ''),
                'feature', COALESCE(moto_feature, ''),
                'submodelo', COALESCE(moto_submodelo, ''),
                'posicao', COALESCE(moto_posicao, ''),
                'grupo', COALESCE(moto_grupo, ''),
                'subgrupo', COALESCE(moto_subgrupo, ''),
                'aplicacao', COALESCE(moto_aplicacao, ''),
                'ano', COALESCE(am.year, ''),
                'layout', COALESCE(am.layout, '')
            )
        ) FILTER (WHERE maker IS NOT NULL),
        JSON_ARRAY()
    ) as aplicacoes_motos,
    
    -- Aplicações em carros (agregadas como JSON array)
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'montadora', COALESCE(montadora, ''),
                'modelo', COALESCE(modelo, ''),
                'tipo', COALESCE(tipo, ''),
                'localizacao', COALESCE(localizacao, ''),
                'ano_inicio', COALESCE(ano_inicio, ''),
                'ano_fim', COALESCE(ano_fim, ''),
                'motor2', COALESCE(motor2, ''),
                'motor3', COALESCE(motor3, ''),
                'valvulas', COALESCE(valvulas, ''),
                'cilindrada', COALESCE(cilindrada, ''),
                'ar', COALESCE(ar, ''),
                'abs', COALESCE(abs, ''),
                'cambio', COALESCE(cambio, ''),
                'direcao', COALESCE(direcao, ''),
                'combustivel', COALESCE(combustivel, ''),
                'feature2', COALESCE(feature2, '')
            )
        ) FILTER (WHERE montadora IS NOT NULL),
        JSON_ARRAY()
    ) as aplicacoes_carros
    
FROM vw_produto_dados_basicos pdb
LEFT JOIN vw_catalogo_similar vs ON pdb.produto_id = vs.product_id
LEFT JOIN vw_catalogo_original vo ON pdb.produto_id = vo.product_id
LEFT JOIN vw_catalogo_caracteristicas vc ON pdb.produto_id = vc.product_id
LEFT JOIN vw_catalogo_motos vm ON pdb.produto_id = vm.product_id
LEFT JOIN vw_catalogo_carros vca ON pdb.produto_id = vca.product_id
GROUP BY pdb.produto_id, pdb.modelo, pdb.nome, pdb.seo, pdb.marca, pdb.ncm, 
         pdb.habilitado, pdb.codebar, pdb.embalagem, pdb.OrigemPOID, pdb.st, 
         pdb.isento_st, pdb.icms_antecipado, pdb.vip;

-- =====================================================
-- 8. Views para Consultas Específicas (Otimizadas)
-- =====================================================

-- View para produtos por segmento
CREATE OR REPLACE VIEW vw_solr_produtos_segmento AS
SELECT 
    p.*,
    c.segmentoPOID,
    c.categoriaPOID,
    c.catalogoPOID,
    -- Extrair dados do JSON do catalog map para compatibilidade
    JSON_UNQUOTE(JSON_EXTRACT(c.map, '$.catalogoMap.descriptions.name')) as produtoNomeCatalogo,
    JSON_UNQUOTE(JSON_EXTRACT(c.map, '$.catalogoMap.descriptions.resume')) as produtoDescricaoCurta,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.active') = 1 THEN 1 
        ELSE 0 
    END as produtoAtivo,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.feature') = 1 THEN 1 
        ELSE 0 
    END as produtoDestaque,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.retail') = 1 THEN 1 
        ELSE 0 
    END as produtoVarejo,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.outlet') = 1 THEN 1 
        ELSE 0 
    END as produtoOutlet,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.arrivals') = 1 THEN 1 
        ELSE 0 
    END as produtoArrivals
FROM vw_solr_produto_completo p
JOIN catalog.catalog c ON p.produto_id = c.product_id;

-- View para produtos ativos
CREATE OR REPLACE VIEW vw_solr_produtos_ativos AS
SELECT 
    p.*,
    c.segmentoPOID,
    c.categoriaPOID,
    c.catalogoPOID,
    -- Extrair dados do JSON do catalog map para compatibilidade
    JSON_UNQUOTE(JSON_EXTRACT(c.map, '$.catalogoMap.descriptions.name')) as produtoNomeCatalogo,
    JSON_UNQUOTE(JSON_EXTRACT(c.map, '$.catalogoMap.descriptions.resume')) as produtoDescricaoCurta,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.active') = 1 THEN 1 
        ELSE 0 
    END as produtoAtivo,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.feature') = 1 THEN 1 
        ELSE 0 
    END as produtoDestaque,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.retail') = 1 THEN 1 
        ELSE 0 
    END as produtoVarejo,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.outlet') = 1 THEN 1 
        ELSE 0 
    END as produtoOutlet,
    CASE 
        WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.arrivals') = 1 THEN 1 
        ELSE 0 
    END as produtoArrivals
FROM vw_solr_produto_completo p
JOIN catalog.catalog c ON p.produto_id = c.product_id
WHERE p.habilitado = 1;

-- =====================================================
-- 9. Índices Recomendados para Performance (MySQL 8.4.7)
-- =====================================================

-- Índices para as views principais
CREATE INDEX IF NOT EXISTS idx_catalog_codes_product_type ON catalog.catalog_codes(product_id, type);
CREATE INDEX IF NOT EXISTS idx_catalog_features_product ON catalog.catalog_features(product_id);
CREATE INDEX IF NOT EXISTS idx_auto_motos_product ON catalog.auto_motos(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_aplication_product ON catalog.catalog_aplication(product_id);
CREATE INDEX IF NOT EXISTS idx_mak_inv_id ON mak.inv(id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_id ON catalog.catalog(product_id);

-- Índices funcionais para performance em JSON (MySQL 8.0+)
CREATE INDEX IF NOT EXISTS idx_catalog_map_ecommerce_active ON catalog.catalog((JSON_EXTRACT(map, '$.catalogoMap.ecommerce.active')));
CREATE INDEX IF NOT EXISTS idx_catalog_map_descriptions_name ON catalog.catalog((JSON_UNQUOTE(JSON_EXTRACT(map, '$.catalogoMap.descriptions.name'))));

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_catalog_segmento_categoria ON catalog.catalog(segmentoPOID, categoriaPOID);
CREATE INDEX IF NOT EXISTS idx_catalog_codes_type_code ON catalog.catalog_codes(type, code);

-- =====================================================
-- 10. Views Adicionais para MySQL 8.4.7 (Window Functions)
-- =====================================================

-- View com ranking de produtos por segmento
CREATE OR REPLACE VIEW vw_solr_ranking_segmento AS
SELECT 
    p.*,
    c.segmentoPOID,
    c.categoriaPOID,
    c.catalogoPOID,
    ROW_NUMBER() OVER (PARTITION BY c.segmentoPOID, c.categoriaPOID ORDER BY p.modelo) as ranking_categoria,
    ROW_NUMBER() OVER (PARTITION BY c.segmentoPOID ORDER BY p.modelo) as ranking_segmento,
    COUNT(*) OVER (PARTITION BY c.segmentoPOID, c.categoriaPOID) as total_categoria,
    COUNT(*) OVER (PARTITION BY c.segmentoPOID) as total_segmento
FROM vw_solr_produto_completo p
JOIN catalog.catalog c ON p.produto_id = c.product_id
WHERE p.habilitado = 1;

-- View com estatísticas por segmento
CREATE OR REPLACE VIEW vw_solr_stats_segmento AS
SELECT 
    c.segmentoPOID,
    COUNT(*) as total_produtos,
    SUM(CASE WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.active') = 1 THEN 1 ELSE 0 END) as produtos_ativos,
    SUM(CASE WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.feature') = 1 THEN 1 ELSE 0 END) as produtos_destaque,
    AVG(LENGTH(p.modelo)) as avg_modelo_length,
    MAX(p.modelo) as ultimo_modelo,
    MIN(p.modelo) as primeiro_modelo
FROM catalog.catalog c
JOIN vw_produto_dados_basicos p ON c.product_id = p.produto_id
GROUP BY c.segmentoPOID;

-- =====================================================
-- 11. Exemplos de Uso das Views (MySQL 8.4.7)
-- =====================================================

/*
-- Para obter dados completos de um produto específico:
SELECT * FROM vw_solr_produto_completo WHERE produto_id = 12345;

-- Para obter produtos de um segmento específico com dados JSON:
SELECT 
    produto_id, 
    modelo, 
    marca,
    JSON_EXTRACT(codigos_similares, '$[0].codigo') as primeiro_similar,
    JSON_LENGTH(caracteristicas) as qtd_caracteristicas
FROM vw_solr_produtos_segmento 
WHERE segmentoPOID = 5;

-- Para obter produtos ativos para sincronização:
SELECT * FROM vw_solr_produtos_ativos WHERE produtoAtivo = 1;

-- Para obter ranking de produtos:
SELECT * FROM vw_solr_ranking_segmento WHERE ranking_categoria <= 10;

-- Para obter estatísticas do segmento:
SELECT * FROM vw_solr_stats_segmento WHERE segmentoPOID = 5;

-- Para buscar produtos por características específicas:
SELECT 
    produto_id,
    modelo,
    caracteristica
FROM vw_solr_produto_completo p
JOIN JSON_TABLE(p.caracteristicas, '$[*]' COLUMNS (
    caracteristica VARCHAR(255) PATH '$.seo',
    atributo VARCHAR(255) PATH '$.atributo'
)) AS jt
WHERE jt.caracteristica LIKE '%dimensao%';

-- Para buscar aplicações específicas:
SELECT 
    produto_id,
    modelo,
    aplicacao
FROM vw_solr_produto_completo p
JOIN JSON_TABLE(p.aplicacoes_carros, '$[*]' COLUMNS (
    montadora VARCHAR(255) PATH '$.montadora',
    modelo_carro VARCHAR(255) PATH '$.modelo',
    ano_inicio VARCHAR(50) PATH '$.ano_inicio'
)) AS jt
WHERE jt.montadora = 'Volkswagen';
*/
