import express from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { optionalAuth, auth } from '../../middleware/auth.js';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Rotas de Analytics V2

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
