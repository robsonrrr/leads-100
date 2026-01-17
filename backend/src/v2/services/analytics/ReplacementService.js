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
            // Query para identificar padrão de consumo (Recorrência)
            // Consideramos apenas vendas dos últimos 12 meses
            let query = `
        WITH ConsumptionStats AS (
            SELECT 
                vh.ClienteID,
                vh.ProdutoID,
                MAX(vh.DataVenda) as last_purchase_date,
                SUM(vh.Quantidade) as total_qty_12m,
                COUNT(DISTINCT MONTH(vh.DataVenda)) as buying_months,
                (SELECT Quantidade FROM mak.Vendas_Historia vh2 
                 WHERE vh2.ClienteID = vh.ClienteID AND vh2.ProdutoID = vh.ProdutoID 
                 ORDER BY DataVenda DESC LIMIT 1) as last_purchase_qty
            FROM mak.Vendas_Historia vh
            WHERE vh.DataVenda >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${sellerId ? 'AND vh.VendedorID = ?' : ''}
            ${customerId ? 'AND vh.ClienteID = ?' : ''}
            GROUP BY vh.ClienteID, vh.ProdutoID
            HAVING buying_months >= 3 -- Apenas produtos comprados em 3+ meses diferentes
        )
        SELECT 
            cs.*,
            p.modelo,
            p.nome,
            (cs.total_qty_12m / 12) as avg_monthly_consumption,
            DATEDIFF(NOW(), cs.last_purchase_date) as days_since_last_purchase
        FROM ConsumptionStats cs
        JOIN mak.inv p ON p.id = cs.ProdutoID -- Usando tabela inv para detalhes
        WHERE 
            -- Lógica de Reposição:
            -- Se dias desde compra > (ultima qtd / media diaria) - margem de segurança
            -- Simplificado: Se dias desde compra > 0.8 * (ultima qtd / (total_12m / 365))
            DATEDIFF(NOW(), cs.last_purchase_date) >= 
            (0.8 * (cs.last_purchase_qty / (cs.total_qty_12m / 365.0)))
        ORDER BY days_since_last_purchase DESC
        LIMIT 50;
      `;

            const params = [];
            if (sellerId) params.push(sellerId);
            if (customerId) params.push(customerId);

            const [rows] = await db.query(query, params);

            return rows.map(row => ({
                customerId: row.ClienteID,
                productId: row.ProdutoID,
                productName: row.modelo || row.nome,
                lastPurchaseDate: row.last_purchase_date,
                lastPurchaseQty: row.last_purchase_qty,
                avgMonthlyConsumption: parseFloat(row.avg_monthly_consumption).toFixed(1),
                daysSinceLastPurchase: row.days_since_last_purchase,
                estimatedStockDays: Math.round(row.last_purchase_qty / (row.total_qty_12m / 365.0)) - row.days_since_last_purchase,
                urgency: this._calculateUrgency(row.days_since_last_purchase, row.last_purchase_qty, row.total_qty_12m)
            }));

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
