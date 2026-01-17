-- MySQL Views para Popular Solr
-- Versão: MySQL 8.4.7
-- Criado em: 2026-01-17
-- Baseado nas consultas do CatalogController.php
-- Schema: catalog (principal), vallery (mak.*)

-- =====================================================
-- 1. View para Dados Básicos do Produto (Vallery)
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_produto_dados_basicos AS
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
CREATE OR REPLACE VIEW Catalogo.vw_catalogo_similar AS
SELECT 
    c.product_id,
    c.code as similarID,
    s.similar_code as similarCodigo,
    sb.id as similarMarcaPOID,
    sb.brand as similarMarca
FROM Catalogo.catalog_codes c 
LEFT JOIN Catalogo.auto_similar_codes s ON c.code = s.id 
LEFT JOIN Catalogo.auto_similar_brands sb ON s.similar_brand_id = sb.id 
WHERE c.type = 1;

-- =====================================================
-- 3. View para Códigos Originais
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_catalogo_original AS
SELECT 
    c.product_id,
    c.code as originalID,
    s.original_code as originalCodigo,
    sb.id as originalMarcaPOID,
    sb.brand as originalMarca
FROM Catalogo.catalog_codes c 
LEFT JOIN Catalogo.auto_original_codes s ON c.code = s.id 
LEFT JOIN Catalogo.auto_original_brands sb ON s.original_brand_id = sb.id 
WHERE c.type = 2;

-- =====================================================
-- 4. View para Características dos Produtos
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_catalogo_caracteristicas AS
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
FROM Catalogo.catalog_features cf 
LEFT JOIN Catalogo.features f ON cf.feature = f.id 
LEFT JOIN Catalogo.features_attributes a ON cf.attributes = a.id
ORDER BY cf.product_id, f.f_order;

-- =====================================================
-- 5. View para Aplicações em Motos
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_catalogo_motos AS
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
FROM Catalogo.auto_motos am
LEFT JOIN Catalogo.moto_cc mc ON am.cc = mc.id
LEFT JOIN Catalogo.moto_features mf ON am.feature = mf.id
LEFT JOIN Catalogo.moto_models ml ON am.model = ml.id
LEFT JOIN Catalogo.moto_models_sub ms ON am.submodel = ms.id
LEFT JOIN Catalogo.moto_obs mo ON am.obs = mo.id
LEFT JOIN Catalogo.moto_positions mp ON am.position = mp.id
LEFT JOIN Catalogo.moto_group mg ON am.group = mg.id
LEFT JOIN Catalogo.moto_group_sub mb ON am.subgroup = mb.id
LEFT JOIN Catalogo.moto_applications ma ON am.app = ma.id
LEFT JOIN Catalogo.auto_makers maker ON ml.maker_id = maker.id
ORDER BY am.product_id, maker.maker, ml.model, mc.cc;

-- =====================================================
-- 6. View para Aplicações em Carros
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_catalogo_carros AS
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
FROM Catalogo.catalog_aplication ca 
LEFT JOIN Catalogo.auto_types ty ON ca.type = ty.id
LEFT JOIN Catalogo.auto_makers ma ON ca.maker = ma.id
LEFT JOIN Catalogo.auto_models mo ON ca.model = mo.id
LEFT JOIN Catalogo.auto_local lo ON ca.local = lo.id
LEFT JOIN Catalogo.auto_years ye ON ca.year_start = ye.id
LEFT JOIN Catalogo.auto_years ya ON ca.year_end = ya.id
LEFT JOIN Catalogo.auto_motor2 m1 ON ca.motor2 = m1.id
LEFT JOIN Catalogo.auto_motor2 m2 ON ca.motor3 = m2.id
LEFT JOIN Catalogo.auto_motor2 m3 ON ca.valve = m3.id
LEFT JOIN Catalogo.auto_motor2 m4 ON ca.cc = m4.id
LEFT JOIN Catalogo.auto_motor2 m5 ON ca.air = m5.id
LEFT JOIN Catalogo.auto_motor2 m6 ON ca.abs = m6.id
LEFT JOIN Catalogo.auto_motor2 m7 ON ca.exchange = m7.id
LEFT JOIN Catalogo.auto_motor2 m8 ON ca.direction = m8.id
LEFT JOIN Catalogo.auto_motor2 m9 ON ca.fuel = m9.id
ORDER BY ca.product_id, ty.name, ma.maker, mo.model, m2.name, m3.name, ye.year;

-- =====================================================
-- 7. View Consolidada para Solr (Produto Completo) - MySQL 8.4.7
-- Nota: MySQL não suporta FILTER (WHERE), usamos subqueries
-- =====================================================
CREATE OR REPLACE VIEW Catalogo.vw_solr_produto_completo AS
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
    
    -- Códigos similares (subquery agregada)
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', vs.similarID,
                    'codigo', COALESCE(vs.similarCodigo, ''),
                    'marca', COALESCE(vs.similarMarca, '')
                )
            ),
            JSON_ARRAY()
        )
        FROM Catalogo.vw_catalogo_similar vs 
        WHERE vs.product_id = pdb.produto_id AND vs.similarID IS NOT NULL
    ) as codigos_similares,
    
    -- Códigos originais (subquery agregada)
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', vo.originalID,
                    'codigo', COALESCE(vo.originalCodigo, ''),
                    'marca', COALESCE(vo.originalMarca, '')
                )
            ),
            JSON_ARRAY()
        )
        FROM Catalogo.vw_catalogo_original vo 
        WHERE vo.product_id = pdb.produto_id AND vo.originalID IS NOT NULL
    ) as codigos_originais,
    
    -- Características (subquery agregada)
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'seo', COALESCE(vc.caracteristicaSEO, ''),
                    'nome', COALESCE(vc.caracteristicaNome, ''),
                    'atributo', COALESCE(vc.atributoNome, ''),
                    'ordem', COALESCE(vc.caracteristicaOrdem, 0),
                    'medida', COALESCE(vc.caracteristicaMedida, ''),
                    'segmento', COALESCE(vc.segments, 0)
                )
            ),
            JSON_ARRAY()
        )
        FROM Catalogo.vw_catalogo_caracteristicas vc 
        WHERE vc.product_id = pdb.produto_id AND vc.caracteristicaSEO IS NOT NULL
    ) as caracteristicas,
    
    -- Aplicações em motos (subquery agregada)
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'maker', COALESCE(vm.maker, ''),
                    'modelo', COALESCE(vm.moto_modelo, ''),
                    'cc', COALESCE(vm.moto_cc, ''),
                    'feature', COALESCE(vm.moto_feature, ''),
                    'submodelo', COALESCE(vm.moto_submodelo, ''),
                    'posicao', COALESCE(vm.moto_posicao, ''),
                    'grupo', COALESCE(vm.moto_grupo, ''),
                    'subgrupo', COALESCE(vm.moto_subgrupo, ''),
                    'aplicacao', COALESCE(vm.moto_aplicacao, ''),
                    'ano', COALESCE(vm.year, ''),
                    'layout', COALESCE(vm.layout, '')
                )
            ),
            JSON_ARRAY()
        )
        FROM Catalogo.vw_catalogo_motos vm 
        WHERE vm.product_id = pdb.produto_id AND vm.maker IS NOT NULL
    ) as aplicacoes_motos,
    
    -- Aplicações em carros (subquery agregada)
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'montadora', COALESCE(vca.montadora, ''),
                    'modelo', COALESCE(vca.modelo, ''),
                    'tipo', COALESCE(vca.tipo, ''),
                    'localizacao', COALESCE(vca.localizacao, ''),
                    'ano_inicio', COALESCE(vca.ano_inicio, ''),
                    'ano_fim', COALESCE(vca.ano_fim, ''),
                    'motor2', COALESCE(vca.motor2, ''),
                    'motor3', COALESCE(vca.motor3, ''),
                    'valvulas', COALESCE(vca.valvulas, ''),
                    'cilindrada', COALESCE(vca.cilindrada, ''),
                    'ar', COALESCE(vca.ar, ''),
                    'abs', COALESCE(vca.abs, ''),
                    'cambio', COALESCE(vca.cambio, ''),
                    'direcao', COALESCE(vca.direcao, ''),
                    'combustivel', COALESCE(vca.combustivel, ''),
                    'feature2', COALESCE(vca.feature2, '')
                )
            ),
            JSON_ARRAY()
        )
        FROM Catalogo.vw_catalogo_carros vca 
        WHERE vca.product_id = pdb.produto_id AND vca.montadora IS NOT NULL
    ) as aplicacoes_carros
    
FROM Catalogo.vw_produto_dados_basicos pdb;

-- =====================================================
-- 8. Views para Consultas Específicas (Otimizadas)
-- =====================================================

-- View para produtos por segmento
CREATE OR REPLACE VIEW Catalogo.vw_solr_produtos_segmento AS
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
FROM Catalogo.vw_solr_produto_completo p
JOIN Catalogo.catalog c ON p.produto_id = c.product_id;

-- View para produtos ativos
CREATE OR REPLACE VIEW Catalogo.vw_solr_produtos_ativos AS
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
FROM Catalogo.vw_solr_produto_completo p
JOIN Catalogo.catalog c ON p.produto_id = c.product_id
WHERE p.habilitado = 1;

-- =====================================================
-- 9. Índices Recomendados para Performance (MySQL 8.4.7)
-- =====================================================

-- Índices para as views principais
CREATE INDEX IF NOT EXISTS idx_catalog_codes_product_type ON Catalogo.catalog_codes(product_id, type);
CREATE INDEX IF NOT EXISTS idx_catalog_features_product ON Catalogo.catalog_features(product_id);
CREATE INDEX IF NOT EXISTS idx_auto_motos_product ON Catalogo.auto_motos(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_aplication_product ON Catalogo.catalog_aplication(product_id);
CREATE INDEX IF NOT EXISTS idx_mak_inv_id ON mak.inv(id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_id ON Catalogo.catalog(product_id);

-- Índices funcionais para performance em JSON (MySQL 8.0+)
CREATE INDEX IF NOT EXISTS idx_catalog_map_ecommerce_active ON Catalogo.catalog((JSON_EXTRACT(map, '$.catalogoMap.ecommerce.active')));
CREATE INDEX IF NOT EXISTS idx_catalog_map_descriptions_name ON Catalogo.catalog((JSON_UNQUOTE(JSON_EXTRACT(map, '$.catalogoMap.descriptions.name'))));

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_catalog_segmento_categoria ON Catalogo.catalog(segmentoPOID, categoriaPOID);
CREATE INDEX IF NOT EXISTS idx_catalog_codes_type_code ON Catalogo.catalog_codes(type, code);

-- =====================================================
-- 10. Views Adicionais para MySQL 8.4.7 (Window Functions)
-- =====================================================

-- View com ranking de produtos por segmento
CREATE OR REPLACE VIEW Catalogo.vw_solr_ranking_segmento AS
SELECT 
    p.*,
    c.segmentoPOID,
    c.categoriaPOID,
    c.catalogoPOID,
    ROW_NUMBER() OVER (PARTITION BY c.segmentoPOID, c.categoriaPOID ORDER BY p.modelo) as ranking_categoria,
    ROW_NUMBER() OVER (PARTITION BY c.segmentoPOID ORDER BY p.modelo) as ranking_segmento,
    COUNT(*) OVER (PARTITION BY c.segmentoPOID, c.categoriaPOID) as total_categoria,
    COUNT(*) OVER (PARTITION BY c.segmentoPOID) as total_segmento
FROM Catalogo.vw_solr_produto_completo p
JOIN Catalogo.catalog c ON p.produto_id = c.product_id
WHERE p.habilitado = 1;

-- View com estatísticas por segmento
CREATE OR REPLACE VIEW Catalogo.vw_solr_stats_segmento AS
SELECT 
    c.segmentoPOID,
    COUNT(*) as total_produtos,
    SUM(CASE WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.active') = 1 THEN 1 ELSE 0 END) as produtos_ativos,
    SUM(CASE WHEN JSON_EXTRACT(c.map, '$.catalogoMap.ecommerce.feature') = 1 THEN 1 ELSE 0 END) as produtos_destaque,
    AVG(LENGTH(p.modelo)) as avg_modelo_length,
    MAX(p.modelo) as ultimo_modelo,
    MIN(p.modelo) as primeiro_modelo
FROM Catalogo.catalog c
JOIN Catalogo.vw_produto_dados_basicos p ON c.product_id = p.produto_id
GROUP BY c.segmentoPOID;

-- =====================================================
-- 11. Exemplos de Uso das Views (MySQL 8.4.7)
-- =====================================================

/*
-- Para obter dados completos de um produto específico:
SELECT * FROM Catalogo.vw_solr_produto_completo WHERE produto_id = 12345;

-- Para obter produtos de um segmento específico com dados JSON:
SELECT 
    produto_id, 
    modelo, 
    marca,
    JSON_EXTRACT(codigos_similares, '$[0].codigo') as primeiro_similar,
    JSON_LENGTH(caracteristicas) as qtd_caracteristicas
FROM Catalogo.vw_solr_produtos_segmento 
WHERE segmentoPOID = 5;

-- Para obter produtos ativos para sincronização:
SELECT * FROM Catalogo.vw_solr_produtos_ativos WHERE produtoAtivo = 1;

-- Para obter ranking de produtos:
SELECT * FROM Catalogo.vw_solr_ranking_segmento WHERE ranking_categoria <= 10;

-- Para obter estatísticas do segmento:
SELECT * FROM Catalogo.vw_solr_stats_segmento WHERE segmentoPOID = 5;

-- Para buscar produtos por características específicas:
SELECT 
    produto_id,
    modelo,
    caracteristica
FROM Catalogo.vw_solr_produto_completo p
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
FROM Catalogo.vw_solr_produto_completo p
JOIN JSON_TABLE(p.aplicacoes_carros, '$[*]' COLUMNS (
    montadora VARCHAR(255) PATH '$.montadora',
    modelo_carro VARCHAR(255) PATH '$.modelo',
    ano_inicio VARCHAR(50) PATH '$.ano_inicio'
)) AS jt
WHERE jt.montadora = 'Volkswagen';
*/
