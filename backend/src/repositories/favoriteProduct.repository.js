import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * FavoriteProductRepository
 * Gerencia produtos favoritos dos vendedores
 */
export class FavoriteProductRepository {

    /**
     * Adiciona um produto aos favoritos do vendedor
     */
    async addFavorite(sellerId, productId) {
        try {
            const query = `
        INSERT INTO seller_favorite_products (seller_id, product_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE created_at = NOW()
      `;
            await db().execute(query, [sellerId, productId]);
            return true;
        } catch (error) {
            console.error('Erro ao adicionar favorito:', error);
            throw error;
        }
    }

    /**
     * Remove um produto dos favoritos do vendedor
     */
    async removeFavorite(sellerId, productId) {
        try {
            const query = `
        DELETE FROM seller_favorite_products 
        WHERE seller_id = ? AND product_id = ?
      `;
            const [result] = await db().execute(query, [sellerId, productId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            throw error;
        }
    }

    /**
     * Verifica se um produto é favorito do vendedor
     */
    async isFavorite(sellerId, productId) {
        try {
            const query = `
        SELECT 1 FROM seller_favorite_products 
        WHERE seller_id = ? AND product_id = ?
        LIMIT 1
      `;
            const [rows] = await db().execute(query, [sellerId, productId]);
            return rows.length > 0;
        } catch (error) {
            console.error('Erro ao verificar favorito:', error);
            return false;
        }
    }

    /**
     * Lista todos os produtos favoritos do vendedor
     */
    async getFavorites(sellerId, limit = 50) {
        try {
            const query = `
        SELECT 
          f.id as favorite_id,
          f.created_at as favorited_at,
          i.id, i.modelo, i.nome, i.description, i.codebar, i.marca, i.revenda, i.custo,
          p.segmento, p.categoria, p.ncm,
          COALESCE(e.total_disponivel, 0) as estoque
        FROM seller_favorite_products f
        INNER JOIN inv i ON i.id = f.product_id
        LEFT JOIN produtos p ON i.idcf = p.id
        LEFT JOIN produtos_estoque e ON e.produto_id = i.id
        WHERE f.seller_id = ?
        ORDER BY f.created_at DESC
        LIMIT ?
      `;
            const [rows] = await db().execute(query, [sellerId, limit]);

            return rows.map(row => ({
                id: row.id,
                model: row.modelo,
                name: row.nome,
                description: row.description,
                brand: row.marca,
                price: parseFloat(row.revenda) || 0,
                segment: row.segmento,
                category: row.categoria,
                ncm: row.ncm,
                stock: parseInt(row.estoque) || 0,
                favoriteId: row.favorite_id,
                favoritedAt: row.favorited_at
            }));
        } catch (error) {
            console.error('Erro ao listar favoritos:', error);
            throw error;
        }
    }

    /**
     * Verifica quais produtos de uma lista são favoritos do vendedor
     * Retorna Map<productId, true>
     */
    async checkFavorites(sellerId, productIds) {
        if (!productIds || productIds.length === 0) {
            return new Map();
        }

        try {
            const placeholders = productIds.map(() => '?').join(',');
            const query = `
        SELECT product_id FROM seller_favorite_products 
        WHERE seller_id = ? AND product_id IN (${placeholders})
      `;
            const [rows] = await db().execute(query, [sellerId, ...productIds]);

            const favoritesMap = new Map();
            rows.forEach(row => {
                favoritesMap.set(row.product_id, true);
            });

            return favoritesMap;
        } catch (error) {
            console.error('Erro ao verificar favoritos em lote:', error);
            return new Map();
        }
    }

    /**
     * Conta quantos favoritos o vendedor tem
     */
    async countFavorites(sellerId) {
        try {
            const query = `
        SELECT COUNT(*) as total FROM seller_favorite_products 
        WHERE seller_id = ?
      `;
            const [rows] = await db().execute(query, [sellerId]);
            return rows[0]?.total || 0;
        } catch (error) {
            console.error('Erro ao contar favoritos:', error);
            return 0;
        }
    }
}

export default new FavoriteProductRepository();
