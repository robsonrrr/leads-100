import { getDatabase } from '../config/database.js';
import { Product } from '../models/Product.js';
import { CacheService } from '../services/cache.service.js';

const db = () => getDatabase();

export class ProductRepository {
  /**
   * Busca produtos com filtros e paginação
   */
  async search(searchTerm = '', filters = {}, pagination = { page: 1, limit: 20 }) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const offset = (page - 1) * limit;

    // Gerar chave de cache baseada nos parâmetros
    const cacheKey = `${searchTerm}:${JSON.stringify(filters)}:${page}:${limit}`;

    // Tentar cache para buscas frequentes
    return CacheService.getProducts(cacheKey, async () => {
      // Tabela principal é inv, JOIN com produtos para segmento e NCM
      // JOIN com produtos_estoque para trazer estoque disponível
      // NOTA: Promoções são buscadas separadamente via API /promotions/active
      let query = `SELECT DISTINCT 
        i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
        p.segmento, p.segmento_id, p.categoria, p.ncm, p.red, p.cf, p.frete,
        p.icms, p.ipi, p.ii, p.pis, p.cofins, p.outras, p.nf, p.p_marca, p.p_qualidade,
        p.p_blindagem, p.p_embalagem, p.pc_contabil, p.vip, p.cclasstrib_padrao,
        COALESCE(e.total_disponivel, 0) as estoque
      FROM inv i 
      LEFT JOIN produtos p ON i.idcf = p.id 
      LEFT JOIN produtos_estoque e ON e.produto_id = i.id
      WHERE 1=1`;
      const params = [];

      // Busca por termo (ID, modelo, nome, descrição, categoria, NCM, segmento)
      if (searchTerm) {
        const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));

        if (isNumeric) {
          query += ` AND (
            i.id = ? OR
            i.modelo LIKE ? OR
            i.nome LIKE ? OR 
            i.description LIKE ? OR 
            p.categoria LIKE ? OR 
            p.ncm LIKE ? OR
            p.segmento LIKE ?
          )`;
          params.push(parseInt(searchTerm), `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        } else {
          query += ` AND (
            i.modelo LIKE ? OR
            i.nome LIKE ? OR 
            i.description LIKE ? OR 
            p.categoria LIKE ? OR 
            p.ncm LIKE ? OR
            p.segmento LIKE ?
          )`;
          const searchPattern = `%${searchTerm}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }
      }

      // Filtros adicionais
      if (filters.segment) {
        query += ' AND p.segmento = ?';
        params.push(filters.segment);
      }

      if (filters.segmentId) {
        query += ' AND p.segmento_id = ?';
        params.push(filters.segmentId);
      }

      if (filters.category) {
        query += ' AND p.categoria LIKE ?';
        params.push(`%${filters.category}%`);
      }

      if (filters.ncm) {
        query += ' AND p.ncm LIKE ?';
        params.push(`%${filters.ncm}%`);
      }

      // Ordenação por preço de revenda (maior para menor)
      query += ' ORDER BY i.revenda DESC, i.nome ASC';

      // Contar total antes de paginar
      const countQuery = query.replace(/SELECT DISTINCT[\s\S]*?FROM/, 'SELECT COUNT(DISTINCT i.id) as total FROM').replace(/ORDER BY.*$/, '');
      const countParams = params.slice();
      const [countResult] = await db().execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      // Paginação
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      query += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await db().execute(query, params);

      return {
        data: rows.map(row => new Product(row)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    });
  }

  /**
   * Busca um produto por ID (com cache)
   */
  async findById(id) {
    return CacheService.getProduct(id, async () => {
      const query = `SELECT 
        i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
        p.segmento, p.segmento_id, p.categoria, p.ncm, p.red, p.cf, p.frete,
        p.icms, p.ipi, p.ii, p.pis, p.cofins, p.outras, p.nf, p.p_marca, p.p_qualidade,
        p.p_blindagem, p.p_embalagem, p.pc_contabil, p.vip, p.cclasstrib_padrao,
        COALESCE(e.total_disponivel, 0) as estoque
      FROM inv i 
      LEFT JOIN produtos p ON i.idcf = p.id 
      LEFT JOIN produtos_estoque e ON e.produto_id = i.id
      WHERE i.id = ?`;
      const [rows] = await db().execute(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new Product(rows[0]);
    });
  }

  /**
   * Busca múltiplos produtos por IDs (elimina N+1)
   * @param {Array<number>} ids - Array de IDs de produtos
   * @returns {Map<number, Product>} Mapa de ID -> Produto
   */
  async findByIds(ids) {
    if (!ids || ids.length === 0) {
      return new Map();
    }

    // Remover duplicatas e valores inválidos
    const uniqueIds = [...new Set(ids.filter(id => id != null))];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    // Criar placeholders para IN clause
    const placeholders = uniqueIds.map(() => '?').join(',');

    const query = `SELECT 
      i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
      p.segmento, p.segmento_id, p.categoria, p.ncm, p.red, p.cf, p.frete,
      p.icms, p.ipi, p.ii, p.pis, p.cofins, p.outras, p.nf, p.p_marca, p.p_qualidade,
      p.p_blindagem, p.p_embalagem, p.pc_contabil, p.vip, p.cclasstrib_padrao
    FROM inv i 
    LEFT JOIN produtos p ON i.idcf = p.id 
    WHERE i.id IN (${placeholders})`;

    const [rows] = await db().execute(query, uniqueIds);

    // Converter para Map para acesso O(1)
    const productMap = new Map();
    for (const row of rows) {
      productMap.set(row.id, new Product(row));
    }

    return productMap;
  }

  /**
   * Busca produtos por categoria
   */
  async findByCategory(category, limit = 50) {
    const limitInt = parseInt(limit);
    const query = `
      SELECT 
        i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
        p.segmento, p.segmento_id, p.categoria, p.ncm, p.red, p.cf, p.frete,
        p.icms, p.ipi, p.ii, p.pis, p.cofins, p.outras, p.nf, p.p_marca, p.p_qualidade,
        p.p_blindagem, p.p_embalagem, p.pc_contabil, p.vip, p.cclasstrib_padrao
      FROM inv i 
      LEFT JOIN produtos p ON i.idcf = p.id 
      WHERE p.categoria = ? 
      ORDER BY i.revenda DESC, i.nome ASC
      LIMIT ${limitInt}
    `;
    const [rows] = await db().execute(query, [category]);
    return rows.map(row => new Product(row));
  }

  /**
   * Busca produtos por segmento
   */
  async findBySegment(segment, limit = 50) {
    const limitInt = parseInt(limit);
    const query = `
      SELECT 
        i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
        p.segmento, p.segmento_id, p.categoria, p.ncm, p.red, p.cf, p.frete,
        p.icms, p.ipi, p.ii, p.pis, p.cofins, p.outras, p.nf, p.p_marca, p.p_qualidade,
        p.p_blindagem, p.p_embalagem, p.pc_contabil, p.vip, p.cclasstrib_padrao
      FROM inv i 
      LEFT JOIN produtos p ON i.idcf = p.id 
      WHERE p.segmento = ? 
      ORDER BY i.revenda DESC, i.nome ASC
      LIMIT ${limitInt}
    `;
    const [rows] = await db().execute(query, [segment]);
    return rows.map(row => new Product(row));
  }

  /**
   * Lista categorias disponíveis
   */
  async getCategories() {
    const query = `
      SELECT DISTINCT categoria, COUNT(*) as count 
      FROM produtos 
      WHERE categoria IS NOT NULL AND categoria != ''
      GROUP BY categoria 
      ORDER BY categoria ASC
    `;
    const [rows] = await db().execute(query);
    return rows;
  }

  /**
   * Lista segmentos disponíveis
   */
  async getSegments() {
    const query = `
      SELECT DISTINCT segmento, segmento_id, COUNT(*) as count 
      FROM produtos 
      WHERE segmento IS NOT NULL AND segmento != ''
      GROUP BY segmento, segmento_id 
      ORDER BY segmento ASC
    `;
    const [rows] = await db().execute(query);
    return rows;
  }

  /**
   * Busca dados enriquecidos do produto para modal de detalhes
   * Usa a view Ecommerce.produtos_ecommerce para dados completos
   */
  async findEnrichedById(id) {
    try {
      const query = `
        SELECT 
          pe.id,
          pe.produtoModelo as modelo,
          pe.produtoNome as nome,
          pe.produtoNomeOriginal as nomeOriginal,
          pe.produtoTitulo as titulo,
          pe.produtoDescricaoCurta as descricaoCurta,
          pe.produtoCDescricao as descricaoCompleta,
          pe.produtoComplemento as complemento,
          pe.produtoRevendedor as textoRevendedor,
          pe.produtoConsumidor as textoConsumidor,
          pe.produtoMarca as marca,
          pe.produtoOrigem as origem,
          pe.produtoEmbalagem as embalagem,
          pe.produtoPeso as peso,
          pe.produtoKeywords as keywords,
          pe.produtoURLCatalogo as urlCatalogo,
          pe.produtoURLVideo as urlVideo,
          pe.segmentoNome as segmento,
          pe.segmentoTitulo as segmentoTitulo,
          pe.categoriaNome as categoria,
          pe.categoriaTitulo as categoriaTitulo,
          pe.produtoAtivo as ativo,
          pe.produtoFeature as destaque,
          pe.produtoVarejo as varejo,
          pe.produtoOutlet as outlet,
          pe.produtoArrivals as lancamento,
          pe.produtoMedidaDzao as medidaD,
          pe.produtoMedidaDzinho as medidaD2,
          pe.produtoMedidaB as medidaB,
          pe.produtoMedidaDM as medidaDM,
          pe.produtoMedidaL as medidaL,
          pe.produtoMedidaFW as medidaFW,
          pe.produtoMedidaNDE as medidaNDE,
          pe.produtoMedidaNDI as medidaNDI,
          pe.produtoMedidaLayout as medidaLayout,
          i.revenda as preco,
          i.custo,
          COALESCE(e.total_disponivel, 0) as estoque,
          p.ncm
        FROM Ecommerce.produtos_ecommerce pe
        INNER JOIN inv i ON i.id = pe.id
        LEFT JOIN produtos p ON i.idcf = p.id
        LEFT JOIN produtos_estoque e ON e.produto_id = i.id
        WHERE pe.id = ?
        LIMIT 1
      `;
      const [rows] = await db().execute(query, [id]);

      if (rows.length === 0) {
        // Fallback para dados básicos se não estiver no catálogo ecommerce
        const basicProduct = await this.findById(id);
        if (basicProduct) {
          return {
            id: basicProduct.id,
            modelo: basicProduct.modelo,
            nome: basicProduct.nome,
            nomeOriginal: basicProduct.nome,
            descricaoCurta: basicProduct.descricao,
            marca: basicProduct.marca,
            origem: null,
            segmento: basicProduct.segmento,
            categoria: basicProduct.categoria,
            preco: basicProduct.revenda,
            estoque: basicProduct.estoque,
            ncm: basicProduct.ncm,
            isBasicData: true
          };
        }
        return null;
      }

      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar dados enriquecidos:', error);
      // Fallback silencioso para dados básicos
      return this.findById(id).then(p => p ? {
        id: p.id,
        modelo: p.modelo,
        nome: p.nome,
        marca: p.marca,
        preco: p.revenda,
        estoque: p.estoque,
        isBasicData: true
      } : null);
    }
  }
}

