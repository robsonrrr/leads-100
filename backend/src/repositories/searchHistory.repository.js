import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * Repositório para histórico de buscas e produtos trending
 */
export class SearchHistoryRepository {

    /**
     * Registra uma busca do vendedor
     */
    async logSearch(sellerId, searchTerm, productId = null) {
        const query = `
      INSERT INTO seller_search_history (seller_id, search_term, product_id, searched_at)
      VALUES (?, ?, ?, NOW())
    `;
        await db().execute(query, [sellerId, searchTerm, productId]);
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
}

export default new SearchHistoryRepository();
