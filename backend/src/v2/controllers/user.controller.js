import { userPreferenceService } from '../services/UserPreferenceService.js';
import { CacheService } from '../../services/cache.service.js';
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

    async getDailyLeadProgress(req, res) {
        try {
            const userId = req.user?.id ?? req.user?.userId;
            const cacheKey = `daily-lead-progress:${userId}`;

            // Tentar buscar do cache (TTL 30s)
            const cached = await CacheService.get(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached });
            }

            const progress = await userPreferenceService.getDailyLeadProgress(userId);

            // Cachear por 30 segundos
            await CacheService.set(cacheKey, progress, 30);

            res.json({ success: true, data: progress });
        } catch (error) {
            logger.error('Controller Error - getDailyLeadProgress:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao buscar progresso diário' } });
        }
    }

    async updateDailyLeadGoal(req, res) {
        try {
            const userId = req.user?.id ?? req.user?.userId;
            const { goal } = req.body;

            if (!goal || goal < 1 || goal > 500) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Meta deve ser entre 1 e 500' }
                });
            }

            const result = await userPreferenceService.updateDailyLeadGoal(userId, goal);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Controller Error - updateDailyLeadGoal:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao atualizar meta diária' } });
        }
    }

    // ========================================
    // Admin Methods (gerenciar outros usuários)
    // ========================================

    async getAdminUserPreferences(req, res) {
        try {
            // Verificar se é admin (level >= 5)
            const userLevel = req.user?.level ?? 0;
            if (userLevel < 5) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Acesso negado. Requer nível 5 ou superior.' }
                });
            }

            const targetUserId = parseInt(req.params.userId);
            if (isNaN(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'ID de usuário inválido' }
                });
            }

            const prefs = await userPreferenceService.getPreferences(targetUserId);
            res.json({ success: true, data: prefs });
        } catch (error) {
            logger.error('Controller Error - getAdminUserPreferences:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao buscar preferências do usuário' } });
        }
    }

    async updateAdminUserDailyGoal(req, res) {
        try {
            // Verificar se é admin (level >= 5)
            const userLevel = req.user?.level ?? 0;
            if (userLevel < 5) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Acesso negado. Requer nível 5 ou superior.' }
                });
            }

            const targetUserId = parseInt(req.params.userId);
            if (isNaN(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'ID de usuário inválido' }
                });
            }

            const { goal } = req.body;

            if (!goal || goal < 1 || goal > 500) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Meta deve ser entre 1 e 500' }
                });
            }

            const result = await userPreferenceService.updateDailyLeadGoal(targetUserId, goal);
            logger.info(`Admin ${req.user.userId} updated daily goal for user ${targetUserId}: ${goal}`);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Controller Error - updateAdminUserDailyGoal:', error);
            res.status(500).json({ success: false, error: { message: 'Erro ao atualizar meta diária do usuário' } });
        }
    }
}

export const userController = new UserController();


