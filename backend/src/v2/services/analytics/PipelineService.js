import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

/**
 * PipelineService - Calcula métricas de pipeline de vendas
 * Meta: >= 3.000 máquinas/mês no pipeline, >= 60% conversão
 * 
 * Pipeline = Leads em aberto + Leads convertidos no período
 * Conversão = Leads convertidos / Leads criados
 */
export class PipelineService {

    /**
     * Calcula métricas de pipeline para um período
     * @param {Object} options - Opções de cálculo
     * @param {string} options.period - Período no formato 'YYYY-MM' (opcional)
     * @param {number} options.sellerId - ID do vendedor (opcional)
     * @param {string} options.granularity - 'day', 'week', 'month' (default: month)
     * @param {string} options.segment - 'machines', 'bearings', 'auto', etc (default: machines)
     * @returns {Object} Métricas de pipeline
     */
    async calculate(options = {}) {
        const {
            period = null,
            sellerId = null,
            granularity = 'month',
            segment = 'machines'
        } = options;

        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);

        logger.info('PipelineService: Calculating pipeline', { sellerId, period: targetPeriod, granularity, segment });

        try {
            const database = db();

            // Buscar vendedores do segmento
            const [segmentSellers] = await database.execute(`
                SELECT id FROM rolemak_users 
                WHERE blocked = 0 AND depto = 'VENDAS' AND segmento = ?
            `, [segment]);

            const segmentSellerIds = segmentSellers.map(s => s.id);
            if (segmentSellerIds.length === 0) {
                return this.getEmptyResult(targetPeriod, segment);
            }

            // Construir filtros
            let sellerFilter = '';
            const sellerIdsStr = segmentSellerIds.join(',');

            if (sellerId) {
                // Se vendedor específico foi passado, verificar se é do segmento
                if (!segmentSellerIds.includes(sellerId)) {
                    return this.getEmptyResult(targetPeriod, segment);
                }
                sellerFilter = 'AND s.cSeller = ?';
            } else {
                // Filtrar apenas por vendedores do segmento
                sellerFilter = `AND s.cSeller IN (${sellerIdsStr})`;
            }

            // 1. Leads criados no período (apenas vendedores do segmento)
            const [createdResult] = await database.execute(`
        SELECT 
          COUNT(*) as leads_created,
          COALESCE(SUM(
            (SELECT COALESCE(SUM(i.qProduct), 0) FROM mak.icart i WHERE i.cSCart = s.cSCart)
          ), 0) as machines_in_leads
        FROM mak.sCart s
        WHERE YEAR(s.dCart) = ? AND MONTH(s.dCart) = ?
        ${sellerId ? 'AND s.cSeller = ?' : `AND s.cSeller IN (${sellerIdsStr})`}
      `, sellerId ? [year, month, sellerId] : [year, month]);

            // 2. Leads convertidos no período (cType = 2)
            const [convertedResult] = await database.execute(`
        SELECT 
          COUNT(*) as leads_converted,
          COALESCE(SUM(
            (SELECT COALESCE(SUM(i.qProduct), 0) FROM mak.icart i WHERE i.cSCart = s.cSCart)
          ), 0) as machines_converted
        FROM mak.sCart s
        WHERE YEAR(s.dCart) = ? AND MONTH(s.dCart) = ?
          AND s.cType = 2
        ${sellerId ? 'AND s.cSeller = ?' : `AND s.cSeller IN (${sellerIdsStr})`}
      `, sellerId ? [year, month, sellerId] : [year, month]);

            // 3. Vendas reais (usando view Vendas_Historia - filtra por segmento de PRODUTO)
            const [ordersResult] = await database.execute(`
        SELECT 
          COUNT(DISTINCT PedidoID) as orders_count,
          COALESCE(SUM(Quantidade), 0) as machines_sold,
          COALESCE(SUM(ValorBase), 0) as total_revenue,
          COALESCE(SUM(CustoTotal), 0) as total_cost,
          COALESCE(SUM(ValorBase) - SUM(CustoTotal), 0) as gross_margin
        FROM mak.Vendas_Historia
        WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
          AND ProdutoSegmento = ?
        ${sellerId ? 'AND VendedorID = ?' : `AND VendedorID IN (${sellerIdsStr})`}
      `, sellerId ? [year, month, segment, sellerId] : [year, month, segment]);

            // 4. Leads em aberto (pipeline ativo) - apenas vendedores do segmento
            const [openResult] = await database.execute(`
        SELECT 
          COUNT(*) as leads_open,
          COALESCE(SUM(
            (SELECT COALESCE(SUM(i.qProduct), 0) FROM mak.icart i WHERE i.cSCart = s.cSCart)
          ), 0) as machines_in_pipeline
        FROM mak.sCart s
        WHERE s.cType = 1
        ${sellerId ? 'AND s.cSeller = ?' : `AND s.cSeller IN (${sellerIdsStr})`}
      `, sellerId ? [sellerId] : []);

            // Extrair valores
            const leadsCreated = createdResult[0]?.leads_created || 0;
            const leadsConverted = convertedResult[0]?.leads_converted || 0;
            const machinesConverted = convertedResult[0]?.machines_converted || 0;
            // Agora usando view Vendas_Historia - dados precisos de máquinas
            const machinesSold = parseInt(ordersResult[0]?.machines_sold) || 0;
            const totalRevenue = parseFloat(ordersResult[0]?.total_revenue) || 0;
            const totalCost = parseFloat(ordersResult[0]?.total_cost) || 0;
            const grossMargin = parseFloat(ordersResult[0]?.gross_margin) || 0;
            const leadsOpen = openResult[0]?.leads_open || 0;
            const machinesInPipeline = openResult[0]?.machines_in_pipeline || 0;

            // Calcular métricas
            const conversionRate = leadsCreated > 0
                ? Math.round((leadsConverted / leadsCreated) * 100)
                : 0;

            // Buscar metas da tabela seller_goals
            let targetMachines = 2500; // Default: meta total da equipe

            if (sellerId) {
                // Meta individual do vendedor
                const [goalResult] = await database.execute(`
                    SELECT ROUND(goal_units / 12, 0) as monthly_goal
                    FROM mak.seller_goals 
                    WHERE seller_id = ? AND segment = ? AND year = ? AND month IS NULL
                `, [sellerId, segment, year]);
                targetMachines = goalResult[0]?.monthly_goal || 250; // Default: 250 se não encontrar
            } else {
                // Meta total da equipe para o segmento
                const [teamGoalResult] = await database.execute(`
                    SELECT ROUND(SUM(goal_units) / 12, 0) as monthly_goal
                    FROM mak.seller_goals 
                    WHERE segment = ? AND year = ? AND month IS NULL
                `, [segment, year]);
                targetMachines = teamGoalResult[0]?.monthly_goal || 2500;
            }

            const targetPipeline = Math.round(targetMachines * 1.2); // Pipeline = 120% da meta
            const targetConversion = 60; // 60%

            const machinesGap = targetMachines - machinesSold;
            const pipelineGap = targetPipeline - machinesInPipeline;
            const conversionGap = targetConversion - conversionRate;

            // Determinar status
            const machinesStatus = this.getStatus(machinesSold, targetMachines);
            const pipelineStatus = this.getStatus(machinesInPipeline, targetPipeline);
            const conversionStatus = this.getStatus(conversionRate, targetConversion);

            // Status geral (o pior dos três)
            const statusPriority = { 'CRITICAL': 0, 'WARNING': 1, 'ON_TARGET': 2 };
            const overallStatus = [machinesStatus, pipelineStatus, conversionStatus]
                .sort((a, b) => statusPriority[a] - statusPriority[b])[0];

            // Calcular projeção baseada nos dias do mês
            const daysInMonth = new Date(year, month, 0).getDate();
            const today = new Date();
            const dayOfMonth = today.getMonth() + 1 === month && today.getFullYear() === year
                ? today.getDate()
                : daysInMonth;

            const projectedMachines = dayOfMonth > 0
                ? Math.round((machinesSold / dayOfMonth) * daysInMonth)
                : 0;

            return {
                period: targetPeriod,
                segment: segment,
                seller_id: sellerId,
                granularity: granularity,
                sellers_count: segmentSellerIds.length,

                // Métricas principais
                metrics: {
                    leads_created: leadsCreated,
                    leads_converted: leadsConverted,
                    leads_open: leadsOpen,
                    conversion_rate: conversionRate,
                    machines_in_pipeline: machinesInPipeline,
                    machines_sold: machinesSold,
                    total_revenue: totalRevenue,
                    total_cost: totalCost,
                    gross_margin: grossMargin,
                    margin_percent: totalRevenue > 0 ? Math.round((grossMargin / totalRevenue) * 100) : 0,
                    projected_machines: projectedMachines
                },

                // Metas e gaps
                targets: {
                    machines_monthly: targetMachines,
                    pipeline_minimum: targetPipeline,
                    conversion_rate: targetConversion
                },

                gaps: {
                    machines: machinesGap,
                    pipeline: pipelineGap,
                    conversion: conversionGap
                },

                // Status
                status: {
                    overall: overallStatus,
                    machines: machinesStatus,
                    pipeline: pipelineStatus,
                    conversion: conversionStatus
                },

                // Achievement percentages
                achievement: {
                    machines_percent: Math.round((machinesSold / targetMachines) * 100),
                    pipeline_percent: Math.round((machinesInPipeline / targetPipeline) * 100),
                    conversion_percent: Math.round((conversionRate / targetConversion) * 100)
                },

                // Dias restantes e velocidade necessária
                forecast: {
                    days_elapsed: dayOfMonth,
                    days_remaining: daysInMonth - dayOfMonth,
                    daily_rate: dayOfMonth > 0 ? Math.round(machinesSold / dayOfMonth) : 0,
                    required_daily_rate: daysInMonth - dayOfMonth > 0
                        ? Math.round(machinesGap / (daysInMonth - dayOfMonth))
                        : 0,
                    on_track: projectedMachines >= targetMachines
                }
            };
        } catch (error) {
            logger.error('PipelineService: Error calculating pipeline', { error: error.message });
            throw error;
        }
    }

    /**
     * Retorna pipeline semanal
     */
    async getWeeklyPipeline(options = {}) {
        const { sellerId = null, weeks = 4 } = options;
        const database = db();

        logger.info('PipelineService: Getting weekly pipeline', { sellerId, weeks });

        const weeklyData = [];
        const today = new Date();

        for (let i = 0; i < weeks; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const startStr = weekStart.toISOString().split('T')[0];
            const endStr = weekEnd.toISOString().split('T')[0];

            // Máquinas vendidas na semana (usando view Vendas_Historia)
            const [result] = await database.execute(`
        SELECT 
          COUNT(DISTINCT PedidoID) as orders,
          COALESCE(SUM(Quantidade), 0) as machines,
          COALESCE(SUM(ValorBase), 0) as revenue
        FROM mak.Vendas_Historia
        WHERE DataVenda BETWEEN ? AND ?
          AND ProdutoSegmento = 'machines'
        ${sellerId ? 'AND VendedorID = ?' : ''}
      `, sellerId ? [startStr, endStr, sellerId] : [startStr, endStr]);

            const machines = result[0]?.machines || 0;
            const weekTarget = 625; // 2500 / 4 semanas

            weeklyData.push({
                week: weeks - i,
                start_date: startStr,
                end_date: endStr,
                orders: result[0]?.orders || 0,
                machines: machines,
                target: weekTarget,
                gap: weekTarget - machines,
                achievement_percent: Math.round((machines / weekTarget) * 100),
                status: this.getStatus(machines, weekTarget)
            });
        }

        return {
            seller_id: sellerId,
            weeks: weeklyData.reverse()
        };
    }

    /**
     * Retorna ranking de vendedores por performance de pipeline
     */
    async getSellerRanking(period = null) {
        const database = db();
        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);

        logger.info('PipelineService: Getting seller ranking', { period: targetPeriod });

        const [results] = await database.execute(`
      SELECT 
        u.id as seller_id,
        COALESCE(u.nick, u.user) as seller_name,
        COALESCE(v.orders_count, 0) as orders_count,
        COALESCE(v.machines_sold, 0) as machines_sold,
        COALESCE(v.total_revenue, 0) as total_revenue,
        COALESCE(v.gross_margin, 0) as gross_margin,
        (
          SELECT COUNT(*) 
          FROM mak.sCart s 
          WHERE s.cSeller = u.id 
            AND YEAR(s.dCart) = ? AND MONTH(s.dCart) = ?
        ) as leads_created,
        (
          SELECT COUNT(*) 
          FROM mak.sCart s 
          WHERE s.cSeller = u.id 
            AND s.cType = 2
            AND YEAR(s.dCart) = ? AND MONTH(s.dCart) = ?
        ) as leads_converted
      FROM rolemak_users u
      LEFT JOIN (
        SELECT 
          VendedorID,
          COUNT(DISTINCT PedidoID) as orders_count,
          SUM(Quantidade) as machines_sold,
          SUM(ValorBase) as total_revenue,
          SUM(ValorBase) - SUM(CustoTotal) as gross_margin
        FROM mak.Vendas_Historia
        WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
          AND ProdutoSegmento = 'machines'
        GROUP BY VendedorID
      ) v ON v.VendedorID = u.id
      WHERE u.blocked = 0 AND u.depto = 'VENDAS'
      ORDER BY machines_sold DESC
    `, [year, month, year, month, year, month]);

        // Buscar metas individuais de cada vendedor
        const [goals] = await database.execute(`
            SELECT seller_id, ROUND(goal_units / 12, 0) as monthly_goal
            FROM mak.seller_goals 
            WHERE segment = 'machines' AND year = ? AND month IS NULL
        `, [year]);

        const goalsMap = {};
        goals.forEach(g => {
            goalsMap[g.seller_id] = g.monthly_goal;
        });

        return {
            period: targetPeriod,
            ranking: results.map((r, index) => {
                const sellerTarget = goalsMap[r.seller_id] || 250; // Default: 250 se não tiver meta
                return {
                    rank: index + 1,
                    seller_id: r.seller_id,
                    seller_name: r.seller_name,
                    machines_sold: r.machines_sold,
                    orders_count: r.orders_count,
                    total_revenue: parseFloat(r.total_revenue) || 0,
                    gross_margin: parseFloat(r.gross_margin) || 0,
                    leads_created: r.leads_created,
                    leads_converted: r.leads_converted,
                    conversion_rate: r.leads_created > 0
                        ? Math.round((r.leads_converted / r.leads_created) * 100)
                        : 0,
                    target: sellerTarget,
                    gap: sellerTarget - r.machines_sold,
                    achievement_percent: Math.round((r.machines_sold / sellerTarget) * 100),
                    status: this.getStatus(r.machines_sold, sellerTarget)
                };
            })
        };
    }

    /**
     * Verifica se precisa alertar sobre pipeline baixo
     */
    async checkAlerts() {
        const data = await this.calculate();
        const alerts = [];

        // Alerta de máquinas vendidas
        if (data.status.machines === 'CRITICAL') {
            alerts.push({
                type: 'MACHINES_CRITICAL',
                severity: 'HIGH',
                message: `Máquinas vendidas: ${data.metrics.machines_sold} (meta: ${data.targets.machines_monthly})`,
                gap: data.gaps.machines
            });
        } else if (data.status.machines === 'WARNING') {
            alerts.push({
                type: 'MACHINES_WARNING',
                severity: 'MEDIUM',
                message: `Máquinas vendidas abaixo do esperado: ${data.metrics.machines_sold}`,
                gap: data.gaps.machines
            });
        }

        // Alerta de pipeline
        if (data.status.pipeline === 'CRITICAL') {
            alerts.push({
                type: 'PIPELINE_CRITICAL',
                severity: 'HIGH',
                message: `Pipeline insuficiente: ${data.metrics.machines_in_pipeline} (mínimo: ${data.targets.pipeline_minimum})`,
                gap: data.gaps.pipeline
            });
        }

        // Alerta de conversão
        if (data.status.conversion === 'CRITICAL') {
            alerts.push({
                type: 'CONVERSION_CRITICAL',
                severity: 'MEDIUM',
                message: `Taxa de conversão baixa: ${data.metrics.conversion_rate}% (meta: ${data.targets.conversion_rate}%)`,
                gap: data.gaps.conversion
            });
        }

        return {
            has_alerts: alerts.length > 0,
            alerts_count: alerts.length,
            alerts: alerts
        };
    }

    /**
     * Determina status baseado no valor vs meta
     */
    getStatus(value, target) {
        const ratio = value / target;
        if (ratio >= 1) return 'ON_TARGET';
        if (ratio >= 0.8) return 'WARNING';
        return 'CRITICAL';
    }

    /**
     * Retorna o período atual no formato YYYY-MM
     */
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Retorna resultado vazio (quando não há dados para o segmento)
     */
    getEmptyResult(period, segment) {
        return {
            period: period,
            segment: segment,
            seller_id: null,
            granularity: 'month',
            sellers_count: 0,
            metrics: {
                leads_created: 0,
                leads_converted: 0,
                leads_open: 0,
                conversion_rate: 0,
                machines_in_pipeline: 0,
                machines_sold: 0,
                total_revenue: 0,
                total_cost: 0,
                gross_margin: 0,
                margin_percent: 0,
                projected_machines: 0
            },
            targets: {
                machines_monthly: 2500,
                pipeline_minimum: 3000,
                conversion_rate: 60
            },
            gaps: { machines: 2500, pipeline: 3000, conversion: 60 },
            achievement: { machines_percent: 0, pipeline_percent: 0, conversion_percent: 0 },
            status: { machines: 'CRITICAL', pipeline: 'CRITICAL', conversion: 'CRITICAL' },
            forecast: { days_passed: 0, days_remaining: 30, daily_rate: 0, required_daily_rate: 83, projected_machines: 0, on_track: false },
            message: `Nenhum vendedor encontrado para o segmento "${segment}"`
        };
    }
}

export const pipelineService = new PipelineService();
