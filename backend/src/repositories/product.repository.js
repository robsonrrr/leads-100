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
}

