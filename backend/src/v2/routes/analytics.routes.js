import express from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { optionalAuth, authenticateToken as auth } from '../../middleware/auth.js';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Rotas de Analytics V2

/**
 * @swagger
 * /api/v2/analytics/goals/seller/{sellerId}:
 *   get:
 *     summary: Metas de clientes por vendedor
 *     tags: [Analytics V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de clientes e suas metas
 */
router.get('/goals/seller/:sellerId', auth, analyticsController.getCustomerGoalsBySeller);

/**
 * @swagger
 * /api/v2/analytics/goals/customer/{customerId}:
 *   get:
 *     summary: Meta individual do cliente
 *     tags: [Analytics V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados da meta do cliente
 */
router.get('/goals/customer/:customerId', auth, analyticsController.getCustomerGoal);

/**
 * @swagger
 * /api/v2/analytics/goals/ranking:
 *   get:
 *     summary: Ranking de metas
 *     tags: [Analytics V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranking dos clientes
 */
router.get('/goals/ranking', auth, analyticsController.getCustomerGoalsRanking);

/**
 * @swagger
 * /api/v2/analytics/replenishment:
 *   get:
 *     summary: Sugestões de reposição de estoque
 *     description: Identifica produtos que estão acabando no estoque do cliente baseado no histórico de consumo
 *     tags: [Analytics V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente específico
 *     responses:
 *       200:
 *         description: Lista de sugestões
 */
router.get('/replenishment', auth, analyticsController.getReplenishmentSuggestions);

export default router;
