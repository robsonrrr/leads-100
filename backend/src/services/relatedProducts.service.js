import { getDatabase } from '../config/database.js';
import { CacheService } from './cache.service.js';

const db = () => getDatabase();

/**
 * Serviço de Produtos Relacionados
 * Cross-sell, Up-sell, Acessórios e Comprados Juntos
 */
class RelatedProductsService {

    /**
     * Busca produtos relacionados por categoria/segmento (6.1.1)
     * Algoritmo: mesma categoria + faixa de preço similar
     */
    async getRelatedProducts(productId, limit = 8) {
        const cacheKey = `related:${productId}`;

        return CacheService.getOrSet(cacheKey, async () => {
            try {
                // Primeiro, buscar info do produto atual
                const [productInfo] = await db().execute(`
          SELECT p.categoria, p.segmento, p.segmento_id, i.revenda, i.marca
          FROM mak.produtos p
          INNER JOIN mak.inv i ON p.id = i.idcf
          WHERE i.id = ?
        `, [productId]);

                if (!productInfo.length) return [];

                const product = productInfo[0];
                const priceMin = product.revenda * 0.5;
                const priceMax = product.revenda * 2;

                // Buscar produtos da mesma categoria com preço similar
                const [related] = await db().execute(`
          SELECT DISTINCT
            i.id,
            i.modelo as model,
            i.marca as brand,
            i.nome as name,
            i.revenda as price,
            p.categoria as category,
            'category' as relation_type
          FROM mak.inv i
          LEFT JOIN mak.produtos p ON i.idcf = p.id
          WHERE p.categoria = ?
            AND i.id != ?
            AND i.revenda > 0
            AND i.revenda BETWEEN ? AND ?
          ORDER BY ABS(i.revenda - ?) ASC
          LIMIT ?
        `, [product.categoria, productId, priceMin, priceMax, product.revenda, limit]);

                return related;
            } catch (error) {
                console.error('Erro getRelatedProducts:', error);
                return [];
            }
        }, 1800); // Cache 30 minutos
    }

    /**
     * Busca acessórios e complementos (6.1.4)
     * Baseado em relações pré-definidas ou mesma marca
     */
    async getAccessories(productId, limit = 6) {
        const cacheKey = `accessories:${productId}`;

        return CacheService.getOrSet(cacheKey, async () => {
            try {
                // Buscar inf do produto
                const [productInfo] = await db().execute(`
          SELECT i.marca, p.segmento, p.segmento_id
          FROM mak.inv i
          LEFT JOIN mak.produtos p ON i.idcf = p.id
          WHERE i.id = ?
        `, [productId]);

                if (!productInfo.length) return [];

                const product = productInfo[0];

                // Buscar acessórios da mesma marca em outros segmentos
                const [accessories] = await db().execute(`
          SELECT DISTINCT
            i.id,
            i.modelo as model,
            i.marca as brand,
            i.nome as name,
            i.revenda as price,
            p.segmento,
            'accessory' as relation_type
          FROM mak.inv i
          LEFT JOIN mak.produtos p ON i.idcf = p.id
          WHERE i.marca = ?
            AND i.id != ?
            AND p.segmento_id != ?
            AND i.revenda > 0
            AND i.revenda < 500  -- Acessórios geralmente são mais baratos
          ORDER BY RAND()
          LIMIT ?
        `, [product.marca, productId, product.segmento_id || 0, limit]);

                return accessories;
            } catch (error) {
                console.error('Erro getAccessories:', error);
                return [];
            }
        }, 1800);
    }

    /**
     * Busca produtos comprados juntos (6.1.5)
     * Baseado em histórico de vendas: itens que aparecem juntos nos mesmos pedidos
     */
    async getBoughtTogether(productId, limit = 5) {
        const cacheKey = `bought_together:${productId}`;

        return CacheService.getOrSet(cacheKey, async () => {
            try {
                // Buscar produtos que aparecem nos mesmos pedidos
                const [boughtTogether] = await db().execute(`
          SELECT 
            i2.id,
            i.modelo as model,
            i.marca as brand,
            i.nome as name,
            i.revenda as price,
            COUNT(*) as frequency,
            'bought_together' as relation_type
          FROM mak.icart ic1
          INNER JOIN mak.icart ic2 ON ic1.idcart = ic2.idcart AND ic1.idproduto != ic2.idproduto
          INNER JOIN mak.inv i ON ic2.idproduto = i.id
          INNER JOIN mak.hoje h ON ic1.idcart = h.id
          WHERE ic1.idproduto = ?
            AND h.data >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND h.nop IN (27, 28, 51, 76)
            AND i.revenda > 0
          GROUP BY ic2.idproduto, i.modelo, i.marca, i.nome, i.revenda
          ORDER BY frequency DESC
          LIMIT ?
        `, [productId, limit]);

                // Mapear id corretamente
                return boughtTogether.map(item => ({
                    ...item,
                    id: item.id
                }));
            } catch (error) {
                console.error('Erro getBoughtTogether:', error);
                return [];
            }
        }, 3600); // Cache 1 hora
    }

    /**
     * Agregação de todos os produtos relacionados (endpoint principal)
     */
    async getAllRelated(productId) {
        const [related, accessories, boughtTogether] = await Promise.all([
            this.getRelatedProducts(productId, 6),
            this.getAccessories(productId, 4),
            this.getBoughtTogether(productId, 4)
        ]);

        return {
            related,
            accessories,
            boughtTogether,
            totalSuggestions: related.length + accessories.length + boughtTogether.length
        };
    }
}

export default new RelatedProductsService();
