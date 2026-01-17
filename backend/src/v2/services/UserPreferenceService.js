import { getDatabase } from '../../config/database.js';
import logger from '../../config/logger.js';

const db = () => getDatabase();

export class UserPreferenceService {
    async getPreferences(userId) {
        try {
            const [rows] = await db().execute(
                'SELECT * FROM user_preferences WHERE user_id = ?',
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
                    theme: 'light'
                };
            }

            const prefs = rows[0];
            // Garantir que dashboard_config é um objeto
            if (typeof prefs.dashboard_config === 'string') {
                prefs.dashboard_config = JSON.parse(prefs.dashboard_config);
            }

            return prefs;
        } catch (error) {
            logger.error('Error getting user preferences:', error);
            throw error;
        }
    }

    async updatePreferences(userId, data) {
        try {
            const { dashboard_config, theme } = data;
            const configStr = typeof dashboard_config === 'object' ? JSON.stringify(dashboard_config) : dashboard_config;

            await db().execute(
                `INSERT INTO user_preferences (user_id, dashboard_config, theme) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 dashboard_config = VALUES(dashboard_config), 
                 theme = VALUES(theme)`,
                [userId, configStr, theme || 'light']
            );

            return { success: true };
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            throw error;
        }
    }
}

export const userPreferenceService = new UserPreferenceService();
