import { getDatabase } from '../../config/database.js';
import logger from '../../config/logger.js';

const db = () => getDatabase();

export class UserPreferenceService {
    async getPreferences(userId) {
        try {
            const [rows] = await db().execute(
                'SELECT * FROM crm.user_preferences WHERE user_id = ?',
                [userId]
            );

            if (rows.length === 0) {
                // Configuração padrão se não existir
                return {
                    user_id: userId,
                    dashboard_config: {
                        widgets: [
                            { id: 'executive-summary', enabled: true, order: 0 },
                            { id: 'penetration', enabled: true, order: 1 },
                            { id: 'pipeline', enabled: true, order: 2 },
                            { id: 'customer-goals', enabled: true, order: 3 },
                            { id: 'ranking', enabled: true, order: 4 },
                            { id: 'metrics-cards', enabled: true, order: 5 },
                            { id: 'forecast', enabled: true, order: 6 },
                            { id: 'deviation', enabled: true, order: 7 },
                            { id: 'risk', enabled: true, order: 8 },
                            { id: 'inventory', enabled: true, order: 9 },
                            { id: 'followups', enabled: true, order: 10 },
                            { id: 'alerts', enabled: true, order: 11 },
                            { id: 'manager-metrics', enabled: true, order: 12 },
                            { id: 'goals', enabled: true, order: 13 }
                        ],
                        layout: 'default'
                    },
                    theme: 'light',
                    daily_lead_goal: 50
                };
            }

            const prefs = rows[0];
            // Garantir que dashboard_config é um objeto
            if (typeof prefs.dashboard_config === 'string') {
                prefs.dashboard_config = JSON.parse(prefs.dashboard_config);
            }

            // Garantir que daily_lead_goal existe
            if (!prefs.daily_lead_goal) {
                prefs.daily_lead_goal = 50;
            }

            return prefs;
        } catch (error) {
            logger.error('Error getting user preferences:', error);
            throw error;
        }
    }

    async updatePreferences(userId, data) {
        try {
            const { dashboard_config, theme, daily_lead_goal } = data;
            const configStr = typeof dashboard_config === 'object' ? JSON.stringify(dashboard_config) : dashboard_config;

            await db().execute(
                `INSERT INTO crm.user_preferences (user_id, dashboard_config, theme, daily_lead_goal) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 dashboard_config = COALESCE(VALUES(dashboard_config), dashboard_config), 
                 theme = COALESCE(VALUES(theme), theme),
                 daily_lead_goal = COALESCE(VALUES(daily_lead_goal), daily_lead_goal)`,
                [userId, configStr, theme || 'light', daily_lead_goal || 50]
            );

            return { success: true };
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            throw error;
        }
    }

    async updateDailyLeadGoal(userId, goal) {
        try {
            await db().execute(
                `INSERT INTO crm.user_preferences (user_id, daily_lead_goal) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 daily_lead_goal = VALUES(daily_lead_goal)`,
                [userId, goal]
            );

            return { success: true, goal };
        } catch (error) {
            logger.error('Error updating daily lead goal:', error);
            throw error;
        }
    }

    async getDailyLeadProgress(userId) {
        try {
            // Cache key para evitar consultas repetidas
            const cacheKey = `daily-lead-progress:${userId}`;

            // Query otimizada: combina busca de meta e contagem em uma única consulta
            // Usa range de datas (CURDATE() to CURDATE() + 1) para aproveitar índice em dCart
            const [rows] = await db().execute(
                `SELECT 
                    COALESCE(up.daily_lead_goal, 50) as goal,
                    (
                        SELECT COUNT(*) 
                        FROM staging.staging_queries sq
                        WHERE sq.cSeller = ? 
                        AND sq.dCart >= CURDATE() 
                        AND sq.dCart < CURDATE() + INTERVAL 1 DAY
                    ) as created
                FROM (SELECT 1) dummy
                LEFT JOIN crm.user_preferences up ON up.user_id = ?`,
                [userId, userId]
            );

            const goal = rows[0]?.goal || 50;
            const created = rows[0]?.created || 0;
            const percentage = goal > 0 ? Math.round((created / goal) * 100) : 0;

            return {
                goal,
                created,
                remaining: Math.max(0, goal - created),
                percentage,
                completed: created >= goal
            };
        } catch (error) {
            logger.error('Error getting daily lead progress:', error);
            throw error;
        }
    }

    /**
     * Busca progresso diário de vendas de máquinas (meta mensal / dias úteis restantes)
     * - level < 4: mostra progresso do próprio vendedor
     * - level >= 4: mostra total do segmento máquinas
     */
    async getDailyMachinesProgress(userId, userLevel) {
        try {
            const isManager = (userLevel || 0) >= 4;

            // Calcular dias úteis restantes no mês (aproximado: dias totais - dia atual)
            const today = new Date();
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const daysRemainingInMonth = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);

            let query;
            let params;

            if (isManager) {
                // Gerente: total de TODAS as metas de máquinas (todos os vendedores)
                query = `
                    SELECT 
                        COALESCE(SUM(g.goal_units), 0) as total_goal,
                        COALESCE(SUM(v.sold_year), 0) as sold_year,
                        COALESCE(SUM(vm.sold_month), 0) as sold_month,
                        ROUND(COALESCE(SUM(g.goal_units), 0) / 11) as goal_month
                    FROM mak.customer_goals g
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_year
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = YEAR(CURDATE()) AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) v ON v.ClienteID = g.customer_id
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_month
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = YEAR(CURDATE()) 
                          AND MONTH(DataVenda) = MONTH(CURDATE()) 
                          AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) vm ON vm.ClienteID = g.customer_id
                    WHERE g.year = YEAR(CURDATE())
                `;
                params = [];
            } else {
                // Vendedor: próprios clientes
                query = `
                    SELECT 
                        COALESCE(SUM(g.goal_units), 0) as total_goal,
                        COALESCE(SUM(v.sold_year), 0) as sold_year,
                        COALESCE(SUM(vm.sold_month), 0) as sold_month,
                        ROUND(COALESCE(SUM(g.goal_units), 0) / 11) as goal_month
                    FROM mak.customer_goals g
                    INNER JOIN clientes c ON c.id = g.customer_id
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_year
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = YEAR(CURDATE()) AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) v ON v.ClienteID = g.customer_id
                    LEFT JOIN (
                        SELECT ClienteID, SUM(Quantidade) as sold_month
                        FROM mak.Vendas_Historia
                        WHERE YEAR(DataVenda) = YEAR(CURDATE()) 
                          AND MONTH(DataVenda) = MONTH(CURDATE()) 
                          AND ProdutoSegmento = 'machines'
                        GROUP BY ClienteID
                    ) vm ON vm.ClienteID = g.customer_id
                    WHERE g.year = YEAR(CURDATE())
                      AND c.vendedor = ?
                `;
                params = [userId];
            }

            const [rows] = await db().execute(query, params);
            const row = rows[0] || {};

            const goalMonth = parseInt(row.goal_month) || 0;
            const soldMonth = parseInt(row.sold_month) || 0;
            const remaining = Math.max(0, goalMonth - soldMonth);
            const dailyGoal = Math.ceil(remaining / daysRemainingInMonth);
            const percentage = goalMonth > 0 ? Math.round((soldMonth / goalMonth) * 100) : 0;

            return {
                goalMonth,
                soldMonth,
                remaining,
                dailyGoal, // Meta diária sugerida
                percentage,
                completed: soldMonth >= goalMonth,
                isManager,
                daysRemaining: daysRemainingInMonth
            };
        } catch (error) {
            logger.error('Error getting daily machines progress:', error);
            throw error;
        }
    }
}

export const userPreferenceService = new UserPreferenceService();

