import { getDatabase as db } from '../../../config/database.js';
import logger from '../../../config/logger.js';

/**
 * FinancialService - Métricas Financeiras (CFO)
 * 
 * KPIs:
 * - Margem Bruta >= 25%
 * - DSO <= 45 dias
 * - Crédito <= R$ 50M
 */
class FinancialService {

    /**
     * Retorna overview financeiro
     */
    async getOverview(options = {}) {
        const {
            period = null,
            segment = 'machines'
        } = options;

        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);

        logger.info('FinancialService: Getting financial overview', { period: targetPeriod, segment });

        try {
            const database = db();

            // 1. Margem bruta consolidada
            const [marginResult] = await database.execute(`
                SELECT 
                    SUM(ValorBase) as total_revenue,
                    SUM(CustoTotal) as total_cost,
                    SUM(ValorBase) - SUM(CustoTotal) as gross_margin,
                    SUM(DescontoValor) as total_discounts,
                    AVG(DescontoPct) * 100 as avg_discount_pct,
                    COUNT(DISTINCT PedidoID) as orders_count
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
                    AND VendedorID IN (
                        SELECT id FROM rolemak_users WHERE segmento = ? AND blocked = 0
                    )
            `, [year, month, segment, segment]);

            const revenue = parseFloat(marginResult[0]?.total_revenue) || 0;
            const cost = parseFloat(marginResult[0]?.total_cost) || 0;
            const grossMargin = parseFloat(marginResult[0]?.gross_margin) || 0;
            const marginPercent = revenue > 0 ? Math.round((grossMargin / revenue) * 1000) / 10 : 0;
            const totalDiscounts = parseFloat(marginResult[0]?.total_discounts) || 0;
            const avgDiscountPct = parseFloat(marginResult[0]?.avg_discount_pct) || 0;

            // 2. Margem por vendedor
            const [marginBySeller] = await database.execute(`
                SELECT 
                    VendedorID as seller_id,
                    VendedorApelido as seller_name,
                    SUM(ValorBase) as revenue,
                    SUM(CustoTotal) as cost,
                    SUM(ValorBase) - SUM(CustoTotal) as gross_margin,
                    ROUND(((SUM(ValorBase) - SUM(CustoTotal)) / SUM(ValorBase)) * 100, 1) as margin_pct
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
                    AND VendedorID IN (
                        SELECT id FROM rolemak_users WHERE segmento = ? AND blocked = 0
                    )
                GROUP BY VendedorID, VendedorApelido
                ORDER BY margin_pct DESC
            `, [year, month, segment, segment]);

            // 3. Classificar vendedores por risco de margem
            const sellersWithRisk = marginBySeller.map(s => ({
                seller_id: s.seller_id,
                seller_name: s.seller_name,
                revenue: parseFloat(s.revenue) || 0,
                gross_margin: parseFloat(s.gross_margin) || 0,
                margin_pct: parseFloat(s.margin_pct) || 0,
                risk: this.getMarginRisk(parseFloat(s.margin_pct) || 0)
            }));

            // 4. Distribuição de risco
            const riskDistribution = {
                LOW: sellersWithRisk.filter(s => s.risk === 'LOW').length,
                MEDIUM: sellersWithRisk.filter(s => s.risk === 'MEDIUM').length,
                HIGH: sellersWithRisk.filter(s => s.risk === 'HIGH').length,
                CRITICAL: sellersWithRisk.filter(s => s.risk === 'CRITICAL').length
            };

            // KPIs
            const marginTarget = 25;
            const marginStatus = marginPercent >= marginTarget ? 'ON_TARGET' :
                marginPercent >= 20 ? 'WARNING' : 'CRITICAL';

            return {
                period: targetPeriod,
                segment: segment,

                kpis: {
                    margin: {
                        current: marginPercent,
                        target: marginTarget,
                        status: marginStatus,
                        achievement_percent: Math.round((marginPercent / marginTarget) * 100)
                    }
                },

                summary: {
                    total_revenue: revenue,
                    total_cost: cost,
                    gross_margin: grossMargin,
                    margin_percent: marginPercent,
                    total_discounts: totalDiscounts,
                    avg_discount_percent: Math.round(avgDiscountPct * 10) / 10,
                    orders_count: marginResult[0]?.orders_count || 0
                },

                by_seller: sellersWithRisk,
                risk_distribution: riskDistribution,

                alerts: sellersWithRisk
                    .filter(s => s.risk === 'CRITICAL' || s.risk === 'HIGH')
                    .map(s => ({
                        type: 'LOW_MARGIN',
                        severity: s.risk,
                        seller_id: s.seller_id,
                        seller_name: s.seller_name,
                        margin_pct: s.margin_pct,
                        message: `${s.seller_name}: margem de ${s.margin_pct}% (meta: ${marginTarget}%)`
                    }))
            };
        } catch (error) {
            logger.error('FinancialService: Error getting overview', { error: error.message });
            throw error;
        }
    }

    /**
     * Classifica risco baseado na margem
     */
    getMarginRisk(marginPct) {
        if (marginPct >= 30) return 'LOW';
        if (marginPct >= 25) return 'MEDIUM';
        if (marginPct >= 20) return 'HIGH';
        return 'CRITICAL';
    }

    /**
     * Retorna período atual
     */
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

export const financialService = new FinancialService();
