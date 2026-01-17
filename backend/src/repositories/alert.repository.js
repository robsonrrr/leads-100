import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export class AlertRepository {
    async create(data) {
        const { userId, type, category, title, description, referenceId } = data;
        try {
            const [result] = await db().execute(`
                INSERT INTO staging.alerts 
                    (user_id, type, category, title, description, reference_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, type, category, title, description, referenceId]);

            return { id: result.insertId, ...data };
        } catch (error) {
            logger.error('Error creating alert:', error);
            throw error;
        }
    }

    async findByUserId(userId, params = {}) {
        const { isRead, limit = 50 } = params;
        try {
            let query = 'SELECT * FROM staging.alerts WHERE user_id = ?';
            const queryParams = [userId];

            if (isRead !== undefined) {
                query += ' AND is_read = ?';
                queryParams.push(isRead ? 1 : 0);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            queryParams.push(limit);

            const [rows] = await db().execute(query, queryParams);
            return rows;
        } catch (error) {
            logger.error('Error finding alerts:', error);
            throw error;
        }
    }

    async markAsRead(id) {
        await db().execute('UPDATE staging.alerts SET is_read = 1 WHERE id = ?', [id]);
    }
}

export const alertRepository = new AlertRepository();
