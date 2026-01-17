import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * Repositório para histórico de buscas e produtos trending
 */
export class SearchHistoryRepository {

  /**
   * Registra uma busca do vendedor
   */
  async logSearch(sellerId, searchTerm, productId = null, resultsCount = 0, filters = null) {
    const query = `
      INSERT INTO seller_search_history (seller_id, search_term, product_id, searched_at, results_count, filters_json)
      VALUES (?, ?, ?, NOW(), ?, ?)
    `;
    const filtersStr = filters ? JSON.stringify(filters) : null;
    await db().execute(query, [sellerId, searchTerm, productId, resultsCount, filtersStr]);
  }

  /**
   * Busca histórico de buscas do vendedor (últimas 20)
   */
  async getSellerHistory(sellerId, limit = 20) {
    const query = `
      SELECT DISTINCT search_term, MAX(searched_at) as last_searched
      FROM seller_search_history
      WHERE seller_id = ?
        AND search_term IS NOT NULL
        AND search_term != ''
      GROUP BY search_term
      ORDER BY last_searched DESC
      LIMIT ?
    `;
    const [rows] = await db().execute(query, [sellerId, limit]);
    return rows;
  }

  /**
   * Busca produtos mais buscados (trending) nos últimos 7 dias
   */
  async getTrendingProducts(limit = 10) {
    const query = `
      SELECT 
        sh.product_id,
        p.modelo as model,
        p.marca as brand,
        p.descricao as name,
        p.preco_tabela as price,
        COUNT(*) as search_count
      FROM seller_search_history sh
      INNER JOIN mak.produtos p ON sh.product_id = p.id
      WHERE sh.searched_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND sh.product_id IS NOT NULL
      GROUP BY sh.product_id, p.modelo, p.marca, p.descricao, p.preco_tabela
      ORDER BY search_count DESC
      LIMIT ?
    `;
    const [rows] = await db().execute(query, [limit]);
    return rows;
  }

  /**
   * Busca termos mais buscados (trending) nos últimos 7 dias
   */
  async getTrendingTerms(limit = 10) {
    const query = `
      SELECT 
        search_term,
        COUNT(*) as search_count,
        COUNT(DISTINCT seller_id) as unique_sellers
      FROM seller_search_history
      WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND search_term IS NOT NULL
        AND search_term != ''
      GROUP BY search_term
      ORDER BY search_count DESC
      LIMIT ?
    `;
    const [rows] = await db().execute(query, [limit]);
    return rows;
  }

  /**
   * Busca produtos recentes do vendedor (últimos 20 produtos únicos)
   * Item 3.2.1-3.2.4 do Checklist Produtos
   */
  async getRecentProducts(sellerId, limit = 20) {
    const query = `
      SELECT DISTINCT
        sh.product_id as id,
        i.modelo as model,
        i.marca as brand,
        i.nome as name,
        i.revenda as price,
        MAX(sh.searched_at) as last_used
      FROM seller_search_history sh
      INNER JOIN mak.inv i ON sh.product_id = i.id
      WHERE sh.seller_id = ?
        AND sh.product_id IS NOT NULL
        AND i.revenda > 0
      GROUP BY sh.product_id, i.modelo, i.marca, i.nome, i.revenda
      ORDER BY last_used DESC
      LIMIT ?
    `;
    const [rows] = await db().execute(query, [sellerId, limit]);
    return rows;
  }
}

export default new SearchHistoryRepository();
