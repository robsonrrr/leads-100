import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Rotas do próprio usuário
router.get('/preferences', (req, res) => userController.getPreferences(req, res));
router.put('/preferences', (req, res) => userController.updatePreferences(req, res));

// Meta diária de leads (próprio usuário)
router.get('/daily-lead-progress', (req, res) => userController.getDailyLeadProgress(req, res));
router.put('/daily-lead-goal', (req, res) => userController.updateDailyLeadGoal(req, res));

// Rotas admin (gerenciar outros usuários) - requerem level >= 5
router.get('/admin/user/:userId/preferences', (req, res) => userController.getAdminUserPreferences(req, res));
router.put('/admin/user/:userId/daily-goal', (req, res) => userController.updateAdminUserDailyGoal(req, res));

export default router;
