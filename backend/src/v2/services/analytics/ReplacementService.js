import { getDatabase } from '../../../config/database.js';
import { CacheService } from '../../../services/cache.service.js';

export class ReplacementService {
    /**
     * Identifica oportunidades de reposição baseadas no histórico de consumo do cliente.
     * Foca em produtos recorrentes que teoricamente estão acabando no estoque do cliente.
     * 
     * @param {number} sellerId - ID do vendedor (opcional, para filtrar carteira)
     * @param {number} customerId - ID do cliente (opcional, para foco específico)
     */
    async getReplenishmentSuggestions(sellerId = null, customerId = null) {
        const db = getDatabase();
        const cacheKey = `replenishment:${sellerId || 'all'}:${customerId || 'all'}`;

        return CacheService.getOrSet(cacheKey, async () => {
            try {
                // Query para identificar padrão de consumo (Recorrência)
                // Usando colunas corretas da tabela Vendas_Historia
                let whereConditions = [];
                const params = [];

                if (sellerId) {
                    whereConditions.push('vh.VendedorID = ?');
                    params.push(sellerId);
                }
                if (customerId) {
                    whereConditions.push('vh.ClienteID = ?');
                    params.push(customerId);
                }

                const whereClause = whereConditions.length > 0
                    ? `AND ${whereConditions.join(' AND ')}`
                    : '';

                const query = `
                    SELECT 
                        vh.ClienteID,
                        vh.ClienteNome,
                        vh.ProdutoISBN as ProdutoID,
                        vh.ProdutoModelo,
                        vh.ProdutoMarca,
                        MAX(vh.DataVenda) as last_purchase_date,
                        SUM(vh.Quantidade) as total_qty_12m,
                        COUNT(DISTINCT MONTH(vh.DataVenda)) as buying_months,
                        AVG(vh.Quantidade) as avg_qty_per_purchase
                    FROM mak.Vendas_Historia vh
                    WHERE vh.DataVenda >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    ${whereClause}
                    GROUP BY vh.ClienteID, vh.ClienteNome, vh.ProdutoISBN, vh.ProdutoModelo, vh.ProdutoMarca
                    HAVING buying_months >= 2
                    ORDER BY last_purchase_date ASC
                    LIMIT 50
                `;

                const [rows] = await db.query(query, params);

                return rows.map(row => {
                    const daysSince = Math.round((Date.now() - new Date(row.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24));
                    const avgMonthly = row.total_qty_12m / 12;
                    const dailyRate = row.total_qty_12m / 365.0;
                    const estimatedCoverage = row.avg_qty_per_purchase / dailyRate;

                    return {
                        customerId: row.ClienteID,
                        customerName: row.ClienteNome,
                        productId: row.ProdutoID,
                        productName: `${row.ProdutoMarca} ${row.ProdutoModelo}`,
                        lastPurchaseDate: row.last_purchase_date,
                        avgQtyPerPurchase: Math.round(row.avg_qty_per_purchase),
                        avgMonthlyConsumption: avgMonthly.toFixed(1),
                        daysSinceLastPurchase: daysSince,
                        estimatedStockDays: Math.max(0, Math.round(estimatedCoverage - daysSince)),
                        urgency: this._calculateUrgency(daysSince, row.avg_qty_per_purchase, row.total_qty_12m)
                    };
                });
            } catch (error) {
                // Se der erro, retornar array vazio ao invés de quebrar
                console.error('ReplacementService error:', error.message);
                return [];
            }

        }, 3600); // Cache de 1 hora
    }

    _calculateUrgency(daysSince, lastQty, totalYear) {
        const dailyRate = totalYear / 365.0;
        const estimatedCoverageDays = lastQty / dailyRate;

        // Se já passou do tempo estimado de cobertura
        if (daysSince > estimatedCoverageDays) return 'CRITICA'; // Provavelmente sem estoque

        // Se está nos últimos 20% do estoque estimado
        if (daysSince > estimatedCoverageDays * 0.8) return 'ALTA';

        return 'MEDIA';
    }
}
