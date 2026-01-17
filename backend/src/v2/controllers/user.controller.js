import { userPreferenceService } from '../services/UserPreferenceService.js';
import logger from '../../config/logger.js';

export class UserController {
    async getPreferences(req, res) {
        try {
            const userId = req.user?.id ?? req.user?.userId;
            const prefs = await userPreferenceService.getPreferences(userId);
            res.json({ success: true, data: prefs });
        } catch (error) {
            logger.error('Controller Error - getPreferences:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao buscar preferências' } });
        }
    }

    async updatePreferences(req, res) {
        try {
            const userId = req.user?.id ?? req.user?.userId;
            const result = await userPreferenceService.updatePreferences(userId, req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Controller Error - updatePreferences:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao atualizar preferências' } });
        }
    }
}

export const userController = new UserController();
