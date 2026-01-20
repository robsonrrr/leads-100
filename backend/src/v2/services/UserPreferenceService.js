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
            // Meta padrão
            let goal = 50;

            // Tentar buscar meta personalizada do usuário
            try {
                const [rows] = await db().execute(
                    'SELECT daily_lead_goal FROM crm.user_preferences WHERE user_id = ?',
                    [userId]
                );
                if (rows.length > 0 && rows[0].daily_lead_goal) {
                    goal = rows[0].daily_lead_goal;
                }
            } catch (err) {
                // Coluna pode não existir ainda - usar padrão
                logger.warn('daily_lead_goal column may not exist, using default:', err.message);
            }

            // Contar leads criados hoje pelo usuário
            // Tabela: staging.staging_queries, coluna vendedor: cSeller, data: dCart
            const [countRows] = await db().execute(
                `SELECT COUNT(*) as count 
                 FROM staging.staging_queries 
                 WHERE cSeller = ? 
                 AND DATE(dCart) = CURDATE()`,
                [userId]
            );

            const created = countRows[0]?.count || 0;
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
}

export const userPreferenceService = new UserPreferenceService();

