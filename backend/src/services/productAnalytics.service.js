import { getDatabase } from '../config/database.js';
import { CacheService } from './cache.service.js';

const db = () => getDatabase();

/**
 * Serviço de Analytics de Produtos
 * Métricas de vendas, buscas, conversão e margem
 */
class ProductAnalyticsService {

    /**
     * Produtos mais vendidos por período (8.1.1)
     * @param {Object} options - Opções de filtro
     * @param {string} options.period - 'day', 'week', 'month', 'year'
     * @param {number} options.limit - Limite de resultados
     * @param {number} options.sellerId - Filtrar por vendedor (opcional)
     */
    async getTopSelling(options = {}) {
        const { period = 'month', limit = 20, sellerId = null } = options;
        const cacheKey = `analytics:top_selling:${period}:${sellerId || 'all'}`;

        return CacheService.getOrSet(cacheKey, async () => {
            const dateFilter = this.getDateFilter(period);

            let query = `
        SELECT 
          ic.idproduto as product_id,
          i.modelo as model,
          i.marca as brand,
          i.nome as name,
          i.revenda as current_price,
          COUNT(DISTINCT h.id) as orders_count,
          SUM(ic.qtde) as total_quantity,
          SUM(ic.total) as total_revenue,
          AVG(ic.preco) as avg_price_sold
        FROM mak.icart ic
        INNER JOIN mak.hoje h ON ic.idcart = h.id
        INNER JOIN mak.inv i ON ic.idproduto = i.id
        WHERE h.data >= ?
          AND h.nop IN (27, 28, 51, 76)
      `;
            const params = [dateFilter];

            if (sellerId) {
                query += ' AND h.idvendedor = ?';
                params.push(sellerId);
            }

            query += `
        GROUP BY ic.idproduto, i.modelo, i.marca, i.nome, i.revenda
        ORDER BY total_quantity DESC
        LIMIT ?
      `;
            params.push(limit);

            const [rows] = await db().execute(query, params);

            return rows.map(row => ({
                productId: row.product_id,
                model: row.model,
                brand: row.brand,
                name: row.name,
                currentPrice: parseFloat(row.current_price) || 0,
                ordersCount: parseInt(row.orders_count) || 0,
                totalQuantity: parseInt(row.total_quantity) || 0,
                totalRevenue: parseFloat(row.total_revenue) || 0,
                avgPriceSold: parseFloat(row.avg_price_sold) || 0
            }));
        }, 600); // Cache 10 minutos
    }

    /**
     * Produtos mais buscados (8.1.2)
     * Usa a tabela seller_search_history
     */
    async getMostSearched(options = {}) {
        const { period = 'month', limit = 20 } = options;
        const cacheKey = `analytics:most_searched:${period}`;

        return CacheService.getOrSet(cacheKey, async () => {
            const dateFilter = this.getDateFilter(period);

            const [rows] = await db().execute(`
        SELECT 
          sh.product_id,
          i.modelo as model,
          i.marca as brand,
          i.nome as name,
          i.revenda as price,
          COUNT(*) as search_count,
          COUNT(DISTINCT sh.seller_id) as unique_sellers
        FROM seller_search_history sh
        INNER JOIN mak.inv i ON sh.product_id = i.id
        WHERE sh.searched_at >= ?
          AND sh.product_id IS NOT NULL
        GROUP BY sh.product_id, i.modelo, i.marca, i.nome, i.revenda
        ORDER BY search_count DESC
        LIMIT ?
      `, [dateFilter, limit]);

            return rows.map(row => ({
                productId: row.product_id,
                model: row.model,
                brand: row.brand,
                name: row.name,
                price: parseFloat(row.price) || 0,
                searchCount: parseInt(row.search_count) || 0,
                uniqueSellers: parseInt(row.unique_sellers) || 0
            }));
        }, 600);
    }

    /**
     * Taxa de conversão por produto (8.1.3)
     * Conversão = vendas / buscas
     */
    async getConversionRates(options = {}) {
        const { period = 'month', limit = 20, minSearches = 5 } = options;
        const cacheKey = `analytics:conversion:${period}`;

        return CacheService.getOrSet(cacheKey, async () => {
            const dateFilter = this.getDateFilter(period);

            // Buscar vendas e buscas separadamente e juntar
            const [salesData] = await db().execute(`
        SELECT 
          ic.idproduto as product_id,
          COUNT(DISTINCT h.id) as sales_count
        FROM mak.icart ic
        INNER JOIN mak.hoje h ON ic.idcart = h.id
        WHERE h.data >= ?
          AND h.nop IN (27, 28, 51, 76)
        GROUP BY ic.idproduto
      `, [dateFilter]);

            const [searchData] = await db().execute(`
        SELECT 
          product_id,
          COUNT(*) as search_count
        FROM seller_search_history
        WHERE searched_at >= ?
          AND product_id IS NOT NULL
        GROUP BY product_id
        HAVING search_count >= ?
      `, [dateFilter, minSearches]);

            // Criar mapa de vendas
            const salesMap = new Map();
            salesData.forEach(s => salesMap.set(s.product_id, s.sales_count));

            // Calcular conversão
            const conversions = searchData.map(s => ({
                productId: s.product_id,
                searchCount: parseInt(s.search_count),
                salesCount: parseInt(salesMap.get(s.product_id) || 0),
                conversionRate: salesMap.get(s.product_id)
                    ? (salesMap.get(s.product_id) / s.search_count * 100).toFixed(2)
                    : 0
            }));

            // Ordenar por taxa de conversão decrescente
            conversions.sort((a, b) => b.conversionRate - a.conversionRate);

            // Buscar info dos produtos
            const productIds = conversions.slice(0, limit).map(c => c.productId);
            if (productIds.length === 0) return [];

            const [products] = await db().execute(`
        SELECT id, modelo as model, marca as brand, nome as name, revenda as price
        FROM mak.inv
        WHERE id IN (${productIds.map(() => '?').join(',')})
      `, productIds);

            const productMap = new Map();
            products.forEach(p => productMap.set(p.id, p));

            return conversions.slice(0, limit).map(c => ({
                ...c,
                model: productMap.get(c.productId)?.model || '',
                brand: productMap.get(c.productId)?.brand || '',
                name: productMap.get(c.productId)?.name || '',
                price: parseFloat(productMap.get(c.productId)?.price) || 0
            }));
        }, 600);
    }

    /**
     * Margem média por produto (8.1.4)
     * Margem = (preço venda - custo) / preço venda * 100
     */
    async getAverageMargins(options = {}) {
        const { period = 'month', limit = 20, minSales = 3 } = options;
        const cacheKey = `analytics:margins:${period}`;

        return CacheService.getOrSet(cacheKey, async () => {
            const dateFilter = this.getDateFilter(period);

            const [rows] = await db().execute(`
        SELECT 
          ic.idproduto as product_id,
          i.modelo as model,
          i.marca as brand,
          i.nome as name,
          i.custo as cost,
          AVG(ic.preco) as avg_sell_price,
          COUNT(DISTINCT h.id) as sales_count,
          SUM(ic.qtde) as total_quantity,
          AVG((ic.preco - i.custo) / NULLIF(ic.preco, 0) * 100) as avg_margin_percent
        FROM mak.icart ic
        INNER JOIN mak.hoje h ON ic.idcart = h.id
        INNER JOIN mak.inv i ON ic.idproduto = i.id
        WHERE h.data >= ?
          AND h.nop IN (27, 28, 51, 76)
          AND i.custo > 0
        GROUP BY ic.idproduto, i.modelo, i.marca, i.nome, i.custo
        HAVING sales_count >= ?
        ORDER BY avg_margin_percent DESC
        LIMIT ?
      `, [dateFilter, minSales, limit]);

            return rows.map(row => ({
                productId: row.product_id,
                model: row.model,
                brand: row.brand,
                name: row.name,
                cost: parseFloat(row.cost) || 0,
                avgSellPrice: parseFloat(row.avg_sell_price) || 0,
                salesCount: parseInt(row.sales_count) || 0,
                totalQuantity: parseInt(row.total_quantity) || 0,
                avgMarginPercent: parseFloat(row.avg_margin_percent) || 0
            }));
        }, 600);
    }

    /**
     * Dashboard consolidado de performance (8.1.5)
     */
    async getDashboard(options = {}) {
        const { period = 'month', sellerId = null } = options;

        const [topSelling, mostSearched, conversions, margins] = await Promise.all([
            this.getTopSelling({ period, limit: 10, sellerId }),
            this.getMostSearched({ period, limit: 10 }),
            this.getConversionRates({ period, limit: 10 }),
            this.getAverageMargins({ period, limit: 10 })
        ]);

        // Calcular métricas gerais
        const totalRevenue = topSelling.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalQuantity = topSelling.reduce((sum, p) => sum + p.totalQuantity, 0);
        const totalOrders = topSelling.reduce((sum, p) => sum + p.ordersCount, 0);
        const avgMargin = margins.length > 0
            ? margins.reduce((sum, p) => sum + p.avgMarginPercent, 0) / margins.length
            : 0;

        return {
            period,
            summary: {
                totalRevenue,
                totalQuantity,
                totalOrders,
                avgMarginPercent: parseFloat(avgMargin.toFixed(2)),
                topProductsCount: topSelling.length
            },
            topSelling,
            mostSearched,
            bestConversion: conversions,
            bestMargins: margins
        };
    }

    /**
     * Calcula a data de início baseada no período
     */
    getDateFilter(period) {
        const now = new Date();
        switch (period) {
            case 'day':
                return new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
            case 'week':
                now.setDate(now.getDate() - 7);
                return now.toISOString().split('T')[0];
            case 'month':
                now.setMonth(now.getMonth() - 1);
                return now.toISOString().split('T')[0];
            case 'quarter':
                now.setMonth(now.getMonth() - 3);
                return now.toISOString().split('T')[0];
            case 'year':
                now.setFullYear(now.getFullYear() - 1);
                return now.toISOString().split('T')[0];
            default:
                now.setMonth(now.getMonth() - 1);
                return now.toISOString().split('T')[0];
        }
    }
}

export default new ProductAnalyticsService();
