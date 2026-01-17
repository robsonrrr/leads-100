import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { CacheService } from '../../../services/cache.service.js';

const db = () => getDatabase();

/**
 * PenetrationService - Calcula métricas de penetração mensal
 * KPI-mãe da meta 30.000 máquinas/ano
 * 
 * Penetração = Revendas que Compraram no Mês / Total de Revendas na Carteira
 * Meta: >= 2.5 revendas/vendedor/mês
 * 
 * CACHE: 5 minutos para dados consolidados
 */
export class PenetrationService {

    /**
     * Calcula a penetração para um período específico
     * @param {Object} options - Opções de cálculo
     * @param {number} options.sellerId - ID do vendedor (opcional, se não informado calcula para todos)
     * @param {string} options.period - Período no formato 'YYYY-MM' (opcional, default: mês atual)
     * @returns {Object} Métricas de penetração
     */
    async calculate(options = {}) {
        const {
            sellerId = null,
            period = null,
            segment = 'machines'
        } = options;

        // Determina o período (default: mês atual)
        const targetPeriod = period || this.getCurrentPeriod();
        const cacheKey = `penetration:${targetPeriod}:${segment}:${sellerId || 'all'}`;

        // Cache de 5 minutos para penetração
        return CacheService.getOrSet(cacheKey, async () => {
            const [year, month] = targetPeriod.split('-').map(Number);

            logger.info('PenetrationService: Calculating penetration', { sellerId, period: targetPeriod, segment });

            try {
                // Se sellerId informado, calcula só para ele
                if (sellerId) {
                    return await this.calculateForSeller(sellerId, year, month, segment);
                }

                // Caso contrário, calcula para todos os vendedores do segmento
                return await this.calculateForAllSellers(year, month, segment);
            } catch (error) {
                logger.error('PenetrationService: Error calculating penetration', { error: error.message });
                throw error;
            }
        }, 300); // 5 minutos
    }

    /**
     * Calcula penetração para um vendedor específico
     * @param {number} sellerId - ID do vendedor
     * @param {number} year - Ano
     * @param {number} month - Mês
     * @param {string} segment - Segmento (machines, bearings, etc)
     */
    async calculateForSeller(sellerId, year, month, segment = 'machines') {
        const database = db();

        // 1. Total de revendas na carteira do vendedor
        const [portfolioResult] = await database.execute(`
      SELECT COUNT(DISTINCT id) as total_customers
      FROM mak.clientes
      WHERE vendedor = ?
        AND tipo = 'R'
        AND ativo = 1
    `, [sellerId]);

        const totalCustomers = portfolioResult[0]?.total_customers || 0;

        // 2. Revendas que compraram no mês (pedidos reais em hoje)
        const [activeResult] = await database.execute(`
      SELECT COUNT(DISTINCT h.idcli) as active_customers
      FROM mak.hoje h
      WHERE h.vendedor = ?
        AND YEAR(h.data) = ?
        AND MONTH(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
    `, [sellerId, year, month]);

        const activeCustomers = activeResult[0]?.active_customers || 0;

        // 3. Buscar nome do vendedor
        const [sellerResult] = await database.execute(`
      SELECT id, COALESCE(nick, user) as name FROM rolemak_users WHERE id = ?
    `, [sellerId]);

        const sellerName = sellerResult[0]?.name || `Vendedor ${sellerId}`;

        // Calcular taxa de penetração
        const penetrationRate = totalCustomers > 0
            ? Math.round((activeCustomers / totalCustomers) * 100) / 100
            : 0;

        const target = 2.5;
        const gap = Math.round((target - penetrationRate) * 100) / 100;
        const status = penetrationRate >= target ? 'ON_TARGET' : (penetrationRate >= target * 0.8 ? 'WARNING' : 'CRITICAL');

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            seller: {
                id: sellerId,
                name: sellerName
            },
            metrics: {
                total_customers: totalCustomers,
                active_customers: activeCustomers,
                penetration_rate: penetrationRate,
                target: target,
                gap: gap,
                achievement_percent: totalCustomers > 0 ? Math.round((penetrationRate / target) * 100) : 0
            },
            status: status,
            inactive_customers_count: totalCustomers - activeCustomers
        };
    }

    /**
     * Calcula penetração para todos os vendedores do segmento
     */
    async calculateForAllSellers(year, month, segment = 'machines') {
        const database = db();

        // 1. Listar todos os vendedores ativos DO SEGMENTO
        const [sellers] = await database.execute(`
      SELECT DISTINCT u.id, COALESCE(u.nick, u.user) as name
      FROM rolemak_users u
      INNER JOIN mak.clientes c ON c.vendedor = u.id
      WHERE u.blocked = 0 AND u.depto = 'VENDAS' AND u.segmento = ?
      ORDER BY name
    `, [segment]);

        // 2. Calcular penetração para cada vendedor
        const sellersMetrics = [];
        let totalPortfolio = 0;
        let totalActive = 0;

        for (const seller of sellers) {
            const sellerData = await this.calculateForSeller(seller.id, year, month, segment);
            sellersMetrics.push(sellerData);
            totalPortfolio += sellerData.metrics.total_customers;
            totalActive += sellerData.metrics.active_customers;
        }

        // 3. Calcular métricas consolidadas
        const overallPenetration = totalPortfolio > 0
            ? Math.round((totalActive / totalPortfolio) * 100) / 100
            : 0;

        const target = 2.5;
        const gap = Math.round((target - overallPenetration) * 100) / 100;
        const status = overallPenetration >= target ? 'ON_TARGET' : (overallPenetration >= target * 0.8 ? 'WARNING' : 'CRITICAL');

        // 4. Ranking por penetração
        const ranking = sellersMetrics
            .sort((a, b) => b.metrics.penetration_rate - a.metrics.penetration_rate)
            .map((s, index) => ({
                rank: index + 1,
                seller_id: s.seller.id,
                seller_name: s.seller.name,
                penetration_rate: s.metrics.penetration_rate,
                status: s.status
            }));

        // 5. Vendedores abaixo da meta
        const belowTarget = sellersMetrics.filter(s => s.status !== 'ON_TARGET');

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            summary: {
                total_sellers: sellers.length,
                total_portfolio: totalPortfolio,
                total_active: totalActive,
                overall_penetration: overallPenetration,
                target: target,
                gap: gap,
                achievement_percent: Math.round((overallPenetration / target) * 100),
                sellers_on_target: sellersMetrics.filter(s => s.status === 'ON_TARGET').length,
                sellers_warning: sellersMetrics.filter(s => s.status === 'WARNING').length,
                sellers_critical: sellersMetrics.filter(s => s.status === 'CRITICAL').length
            },
            status: status,
            ranking: ranking.slice(0, 10), // Top 10
            below_target: belowTarget.map(s => ({
                seller_id: s.seller.id,
                seller_name: s.seller.name,
                penetration_rate: s.metrics.penetration_rate,
                gap: s.metrics.gap,
                inactive_customers: s.inactive_customers_count
            })),
            sellers: sellersMetrics
        };
    }

    /**
     * Busca clientes inativos (não compraram no período)
     */
    async getInactiveCustomers(sellerId, period = null) {
        const database = db();
        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);

        logger.info('PenetrationService: Getting inactive customers', { sellerId, period: targetPeriod });

        // Clientes da carteira que NÃO compraram no mês
        const [results] = await database.execute(`
      SELECT 
        c.id,
        c.fantasia,
        c.razao,
        c.cidade,
        c.estado,
        c.email,
        c.telefone,
        (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0) as last_order_date,
        DATEDIFF(CURDATE(), (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0)) as days_since_last_order
      FROM mak.clientes c
      WHERE c.vendedor = ?
        AND c.tipo = 'R'
        AND c.ativo = 1
        AND c.id NOT IN (
          SELECT DISTINCT h.idcli 
          FROM mak.hoje h 
          WHERE h.vendedor = ?
            AND YEAR(h.data) = ?
            AND MONTH(h.data) = ?
            AND h.valor > 0
            AND h.nop IN (27, 28, 51, 76)
        )
      ORDER BY days_since_last_order DESC
      LIMIT 50
    `, [sellerId, sellerId, year, month]);

        return {
            period: targetPeriod,
            seller_id: sellerId,
            inactive_count: results.length,
            customers: results.map(c => ({
                id: c.id,
                name: c.fantasia || c.razao,
                city: c.cidade,
                state: c.estado,
                email: c.email,
                phone: c.telefone,
                last_order_date: c.last_order_date,
                days_since_last_order: c.days_since_last_order || null,
                urgency: this.classifyUrgency(c.days_since_last_order)
            }))
        };
    }

    /**
     * Retorna histórico de penetração dos últimos N meses
     */
    async getHistory(sellerId = null, months = 12) {
        const history = [];
        const today = new Date();

        for (let i = 0; i < months; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            try {
                const data = await this.calculate({ sellerId, period });

                if (sellerId) {
                    history.push({
                        period: period,
                        penetration_rate: data.metrics.penetration_rate,
                        active_customers: data.metrics.active_customers,
                        total_customers: data.metrics.total_customers,
                        status: data.status
                    });
                } else {
                    history.push({
                        period: period,
                        penetration_rate: data.summary.overall_penetration,
                        active_customers: data.summary.total_active,
                        total_customers: data.summary.total_portfolio,
                        sellers_on_target: data.summary.sellers_on_target,
                        status: data.status
                    });
                }
            } catch (error) {
                logger.warn('PenetrationService: Error getting history for period', { period, error: error.message });
            }
        }

        return {
            seller_id: sellerId,
            months: months,
            history: history.reverse() // Ordem cronológica
        };
    }

    /**
     * Classifica urgência de contato baseado nos dias sem compra
     */
    classifyUrgency(daysSinceLastOrder) {
        if (!daysSinceLastOrder) return 'NEW';
        if (daysSinceLastOrder <= 30) return 'OK';
        if (daysSinceLastOrder <= 45) return 'ATTENTION';
        if (daysSinceLastOrder <= 60) return 'WARNING';
        return 'CRITICAL';
    }

    /**
     * Retorna o período atual no formato YYYY-MM
     */
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

export const penetrationService = new PenetrationService();
