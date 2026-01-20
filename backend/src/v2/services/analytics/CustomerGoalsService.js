import { getDatabase as db } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { CacheService } from '../../../services/cache.service.js';

/**
 * CustomerGoalsService - Metas por Cliente
 * 
 * Gerencia metas individuais de clientes baseadas na classificação ABC
 * 
 * ESTRATÉGIA DE CACHE:
 * - Dados ESTÁTICOS (30 min): customer_id, nome, cidade, classification, goal_2026
 * - Dados ANUAIS (10 min): sold_2026, gap, achievement_pct, last_purchase_date
 * - Dados REALTIME (sem cache): sold_month, is_active_month, penetration_month_pct
 */
class CustomerGoalsService {

    /**
     * Retorna metas de clientes de um vendedor
     * Combina dados estáticos (cache longo) + dados anuais (cache curto) + dados mensais (realtime)
     */
    async getBySeller(sellerId, options = {}) {
        const {
            year = new Date().getFullYear(),
            month = new Date().getMonth() + 1,
            classification = null,
            limit = 100,
            offset = 0,
            orderBy = 'penetration_priority',
            requestUserId = null,
            requestUserLevel = 0
        } = options;

        const startTime = Date.now();
        const database = db();

        logger.info('CustomerGoalsService: Getting goals by seller', { sellerId, year, month, orderBy });

        // === DADOS ESTÁTICOS (cache 30 min) ===
        // Lista de clientes com metas e classificações
        const staticData = await this._getStaticData(sellerId, { year, classification, limit, offset });

        // === DADOS REALTIME (sem cache) ===
        // Vendas do mês atual - CRÍTICO para penetração
        const realtimeData = await this._getRealtimeMonthlyData(sellerId, { year, month, classification, requestUserId, requestUserLevel }, database);

        // === DADOS ANUAIS (cache 10 min) ===
        // Vendas do ano, gap, achievement
        const annualData = await this._getAnnualData(sellerId, { year, classification }, database);

        // === MERGE DOS DADOS ===
        const customers = this._mergeCustomerData(staticData.customers, annualData.customerSales, realtimeData.customerMonthly);

        // Aplicar ordenação baseada em dados combinados
        const sortedCustomers = this._sortCustomers(customers, orderBy);

        // Calcular totais consolidados
        const totals = this._calculateTotals(staticData, annualData, realtimeData, classification);

        const queryTime = Date.now() - startTime;
        logger.info('CustomerGoalsService: Query completed', {
            sellerId,
            queryTimeMs: queryTime,
            customersCount: sortedCustomers.length,
            staticCacheHit: staticData.cacheHit,
            annualCacheHit: annualData.cacheHit
        });

        return {
            seller_id: sellerId,
            year: year,
            month: month,
            customers: sortedCustomers,
            summary: annualData.summary,
            totals: totals,
            _cache: {
                staticHit: staticData.cacheHit,
                annualHit: annualData.cacheHit,
                queryTimeMs: queryTime
            }
        };
    }

    /**
     * DADOS ESTÁTICOS - Cache 30 minutos
     * Dados que raramente mudam: clientes, metas, classificações
     */
    async _getStaticData(sellerId, options) {
        const { year, classification, limit, offset } = options;

        const cacheResult = await CacheService.getCustomerGoalsStatic(
            sellerId,
            { year, classification },
            async () => {
                const database = db();
                let classFilter = '';
                const queryParams = [sellerId, year];

                if (classification) {
                    classFilter = 'AND g.classification = ?';
                    queryParams.push(classification);
                }

                queryParams.push(limit, offset);

                const [results] = await database.query(`
                    SELECT 
                        g.customer_id,
                        c.nome as customer_name,
                        c.cidade as city,
                        c.estado as state,
                        g.classification,
                        g.sales_2025,
                        g.goal_units as goal_2026
                    FROM mak.customer_goals g
                    INNER JOIN mak.clientes c ON c.id = g.customer_id
                    WHERE g.seller_id = ? AND g.year = ?
                    ${classFilter}
                    ORDER BY g.goal_units DESC
                    LIMIT ? OFFSET ?
                `, queryParams);

                // Também buscar contagem total de clientes
                const [countResult] = await database.query(`
                    SELECT COUNT(*) as total
                    FROM mak.customer_goals g
                    WHERE g.seller_id = ? AND g.year = ?
                    ${classFilter}
                `, [sellerId, year, ...(classification ? [classification] : [])]);

                return {
                    customers: results,
                    totalCustomers: countResult[0]?.total || 0
                };
            }
        );

        return {
            customers: cacheResult.data.customers,
            totalCustomers: cacheResult.data.totalCustomers,
            cacheHit: cacheResult.cacheHit
        };
    }

    /**
     * DADOS ANUAIS - Cache 10 minutos
     * Dados que mudam diariamente: sold_2026, gap, achievement, last_purchase_date
     */
    async _getAnnualData(sellerId, options, database) {
        const { year, classification } = options;

        const cacheResult = await CacheService.getCustomerGoalsAnnual(
            sellerId,
            { year, classification },
            async () => {
                let classFilter = '';
                const queryParams = [year, sellerId, year];

                if (classification) {
                    classFilter = 'AND g.classification = ?';
                    queryParams.push(classification);
                }

                // Vendas anuais por cliente
                const [salesResults] = await database.query(`
                    SELECT 
                        g.customer_id,
                        COALESCE(v.sold_2026, 0) as sold_2026,
                        vl.last_purchase_date,
                        g.goal_units - COALESCE(v.sold_2026, 0) as gap,
                        CASE WHEN g.goal_units > 0 
                            THEN ROUND(COALESCE(v.sold_2026, 0) / g.goal_units * 100, 0) 
                            ELSE 0 
                        END as achievement_pct
                    FROM mak.customer_goals g
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_2026
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = ? AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) v ON v.ClienteID = g.customer_id
                    LEFT JOIN (
                        SELECT ClienteID, MAX(DataVenda) as last_purchase_date
                        FROM mak.Vendas_Historia
                        WHERE ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) vl ON vl.ClienteID = g.customer_id
                    WHERE g.seller_id = ? AND g.year = ?
                    ${classFilter}
                `, queryParams);

                // Resumo por classificação
                const [summary] = await database.query(`
                    SELECT 
                        g.classification,
                        COUNT(*) as customers,
                        SUM(g.goal_units) as total_goal,
                        SUM(COALESCE(v.sold_2026, 0)) as total_sold,
                        ROUND(SUM(COALESCE(v.sold_2026, 0)) / SUM(g.goal_units) * 100, 0) as achievement_pct
                    FROM mak.customer_goals g
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_2026
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = ? AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) v ON v.ClienteID = g.customer_id
                    WHERE g.seller_id = ? AND g.year = ?
                    GROUP BY g.classification
                    ORDER BY g.classification
                `, [year, sellerId, year]);

                // Totais consolidados
                const [totalsRows] = await database.query(`
                    SELECT
                        SUM(g.goal_units) as total_goal,
                        SUM(COALESCE(v.sold_2026, 0)) as total_sold
                    FROM mak.customer_goals g
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_2026
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = ? AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) v ON v.ClienteID = g.customer_id
                    WHERE g.seller_id = ? AND g.year = ?
                    ${classFilter}
                `, [year, sellerId, year, ...(classification ? [classification] : [])]);

                // Mapear vendas por customer_id para merge rápido
                const customerSales = {};
                for (const row of salesResults) {
                    customerSales[row.customer_id] = {
                        sold_2026: row.sold_2026,
                        last_purchase_date: row.last_purchase_date,
                        gap: row.gap,
                        achievement_pct: row.achievement_pct
                    };
                }

                return {
                    customerSales,
                    summary,
                    totalGoal: parseInt(totalsRows[0]?.total_goal) || 0,
                    totalSold: parseInt(totalsRows[0]?.total_sold) || 0
                };
            }
        );

        return {
            customerSales: cacheResult.data.customerSales,
            summary: cacheResult.data.summary,
            totalGoal: cacheResult.data.totalGoal,
            totalSold: cacheResult.data.totalSold,
            cacheHit: cacheResult.cacheHit
        };
    }

    /**
     * DADOS REALTIME - Cache muito curto (1 minuto)
     * Dados críticos: sold_month, is_active_month, penetration
     * Cache de 1 min é aceitável - vendedor não precisa de dados 100% realtime
     */
    async _getRealtimeMonthlyData(sellerId, options, database) {
        const { year, month, classification } = options;

        const cacheKey = `goals_monthly:${sellerId}:${year}:${month}:${classification || 'all'}`;

        // Cache de 1 minuto para dados "realtime" - performance vs precisão
        return CacheService.getOrSet(cacheKey, async () => {
            // Query única otimizada para buscar vendas mensais por cliente
            const queryParams = [year, month, sellerId, sellerId, year];
            let classFilter = '';

            if (classification) {
                classFilter = 'AND g.classification = ?';
                queryParams.push(classification);
            }

            // Query única que busca tudo de uma vez
            const [results] = await database.query(`
                SELECT 
                    g.customer_id,
                    COALESCE(vm.sold_month, 0) as sold_month
                FROM mak.customer_goals g
                LEFT JOIN (
                    SELECT ClienteID, SUM(Quantidade) as sold_month
                    FROM mak.Vendas_Historia
                    WHERE YEAR(DataVenda) = ? 
                      AND MONTH(DataVenda) = ? 
                      AND ProdutoSegmento = 'machines'
                      AND VendedorID = ?
                    GROUP BY ClienteID
                ) vm ON vm.ClienteID = g.customer_id
                WHERE g.seller_id = ? AND g.year = ?
                ${classFilter}
            `, queryParams);

            // Mapear e calcular totais em uma única passagem
            const customerMonthly = {};
            let totalCustomers = 0;
            let activeCustomersMonth = 0;
            let totalSoldMonth = 0;

            for (const row of results) {
                const soldMonth = parseInt(row.sold_month) || 0;
                customerMonthly[row.customer_id] = {
                    sold_month: soldMonth,
                    is_active_month: soldMonth > 0 ? 1 : 0
                };
                totalCustomers++;
                if (soldMonth > 0) {
                    activeCustomersMonth++;
                    totalSoldMonth += soldMonth;
                }
            }

            const penetrationMonthPct = totalCustomers > 0
                ? Math.round((activeCustomersMonth / totalCustomers) * 100)
                : 0;

            return {
                customerMonthly,
                totalCustomers,
                activeCustomersMonth,
                totalSoldMonth,
                penetrationMonthPct
            };
        }, 60); // Cache de 1 minuto
    }

    /**
     * Combina dados estáticos + anuais + mensais em um único array
     */
    _mergeCustomerData(staticCustomers, annualSales, monthlyData) {
        return staticCustomers.map(customer => {
            const annual = annualSales[customer.customer_id] || {};
            const monthly = monthlyData[customer.customer_id] || {};

            // Meta mensal = Meta anual / 11 (arredondado)
            // 11 meses porque janeiro já passou parcialmente ou dezembro tem menos trabalho
            const goalMonth = Math.round((customer.goal_2026 || 0) / 11);
            const soldMonth = monthly.sold_month || 0;
            const achievementMonthPct = goalMonth > 0
                ? Math.round((soldMonth / goalMonth) * 100)
                : 0;
            const gapMonth = goalMonth - soldMonth;

            return {
                ...customer,
                // Dados anuais (cache curto)
                sold_2026: annual.sold_2026 || 0,
                last_purchase_date: annual.last_purchase_date || null,
                gap: annual.gap || customer.goal_2026,
                achievement_pct: annual.achievement_pct || 0,
                // Dados mensais (realtime)
                sold_month: soldMonth,
                is_active_month: monthly.is_active_month || 0,
                // Meta mensal calculada (meta anual / 11)
                goal_month: goalMonth,
                achievement_month_pct: achievementMonthPct,
                gap_month: gapMonth
            };
        });
    }

    /**
     * Ordena clientes baseado no critério selecionado
     */
    _sortCustomers(customers, orderBy) {
        return [...customers].sort((a, b) => {
            if (orderBy === 'gap') {
                return (b.gap || 0) - (a.gap || 0);
            }
            if (orderBy === 'goal') {
                return (b.goal_2026 || 0) - (a.goal_2026 || 0);
            }
            if (orderBy === 'achievement') {
                return (b.achievement_pct || 0) - (a.achievement_pct || 0);
            }
            // penetration_priority: inativos primeiro, depois maior gap
            if (orderBy === 'penetration_priority') {
                // Primeiro: inativos no mês primeiro
                if (a.is_active_month !== b.is_active_month) {
                    return a.is_active_month - b.is_active_month;
                }
                // Segundo: maior gap
                if ((b.gap || 0) !== (a.gap || 0)) {
                    return (b.gap || 0) - (a.gap || 0);
                }
                // Terceiro: maior meta
                if ((b.goal_2026 || 0) !== (a.goal_2026 || 0)) {
                    return (b.goal_2026 || 0) - (a.goal_2026 || 0);
                }
                // Quarto: classificação A > B > C > I
                const classOrder = { 'A': 0, 'B': 1, 'C': 2, 'I': 3 };
                return (classOrder[a.classification] || 9) - (classOrder[b.classification] || 9);
            }
            return 0;
        });
    }

    /**
     * Calcula totais consolidados
     */
    _calculateTotals(staticData, annualData, realtimeData, classification) {
        return {
            customers: staticData.customers.length,
            total_customers: realtimeData.totalCustomers,
            total_goal: annualData.totalGoal,
            total_sold: annualData.totalSold,
            total_sold_month: realtimeData.totalSoldMonth,
            active_customers_month: realtimeData.activeCustomersMonth,
            penetration_month_pct: realtimeData.penetrationMonthPct
        };
    }

    /**
     * Retorna meta de um cliente específico
     */
    async getByCustomer(customerId, year = null) {
        const targetYear = year || new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const database = db();

        const [results] = await database.query(`
            SELECT 
                g.customer_id,
                c.nome as customer_name,
                c.cidade as city,
                u.nick as seller_name,
                g.seller_id,
                g.classification,
                g.sales_2025,
                g.goal_units as goal_2026,
                ROUND(g.goal_units / 11) as goal_month,
                COALESCE(v.sold_2026, 0) as sold_2026,
                COALESCE(vm.sold_month, 0) as sold_month,
                g.goal_units - COALESCE(v.sold_2026, 0) as gap,
                ROUND(g.goal_units / 11) - COALESCE(vm.sold_month, 0) as gap_month,
                CASE WHEN g.goal_units > 0 
                    THEN ROUND(COALESCE(v.sold_2026, 0) / g.goal_units * 100, 0) 
                    ELSE 0 
                END as achievement_pct,
                CASE WHEN ROUND(g.goal_units / 11) > 0 
                    THEN ROUND(COALESCE(vm.sold_month, 0) / ROUND(g.goal_units / 11) * 100, 0) 
                    ELSE 0 
                END as achievement_month_pct
            FROM mak.customer_goals g
            INNER JOIN mak.clientes c ON c.id = g.customer_id
            INNER JOIN rolemak_users u ON u.id = g.seller_id
            LEFT JOIN (
                SELECT ClienteID, SUM(Quantidade) as sold_2026
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND ProdutoSegmento = 'machines'
                GROUP BY ClienteID
            ) v ON v.ClienteID = g.customer_id
            LEFT JOIN (
                SELECT ClienteID, SUM(Quantidade) as sold_month
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ? AND ProdutoSegmento = 'machines'
                GROUP BY ClienteID
            ) vm ON vm.ClienteID = g.customer_id
            WHERE g.customer_id = ? AND g.year = ?
        `, [targetYear, targetYear, currentMonth, customerId, targetYear]);

        return results[0] || null;
    }

    /**
     * Retorna ranking de clientes por atingimento de meta
     */
    async getRanking(options = {}) {
        const {
            sellerId = null,
            year = new Date().getFullYear(),
            limit = 50,
            orderBy = 'achievement' // 'achievement', 'gap', 'goal'
        } = options;

        const database = db();

        let sellerFilter = '';
        const queryParams = [year, year];

        if (sellerId) {
            sellerFilter = 'AND g.seller_id = ?';
            queryParams.push(sellerId);
        }

        queryParams.push(limit);

        const orderClause = orderBy === 'gap' ? 'gap DESC' :
            orderBy === 'goal' ? 'goal_2026 DESC' :
                'achievement_pct DESC';

        const [results] = await database.query(`
            SELECT 
                g.customer_id,
                c.nome as customer_name,
                u.nick as seller_name,
                g.classification,
                g.goal_units as goal_2026,
                COALESCE(v.sold_2026, 0) as sold_2026,
                g.goal_units - COALESCE(v.sold_2026, 0) as gap,
                CASE WHEN g.goal_units > 0 
                    THEN ROUND(COALESCE(v.sold_2026, 0) / g.goal_units * 100, 0) 
                    ELSE 0 
                END as achievement_pct
            FROM mak.customer_goals g
            INNER JOIN mak.clientes c ON c.id = g.customer_id
            INNER JOIN rolemak_users u ON u.id = g.seller_id
            LEFT JOIN (
                SELECT ClienteID, SUM(Quantidade) as sold_2026
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND ProdutoSegmento = 'machines'
                GROUP BY ClienteID
            ) v ON v.ClienteID = g.customer_id
            WHERE g.year = ? ${sellerFilter}
            ORDER BY ${orderClause}
            LIMIT ?
        `, queryParams);

        return {
            year: year,
            seller_id: sellerId,
            ranking: results
        };
    }
}

export const customerGoalsService = new CustomerGoalsService();
