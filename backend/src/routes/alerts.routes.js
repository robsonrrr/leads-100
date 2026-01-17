/**
 * Routes para sistema de alertas do CRM
 */
import { Router } from 'express';
import * as alertsController from '../controllers/alerts.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /alerts/my-alerts:
 *   get:
 *     summary: Obtém alertas do vendedor
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: ID do vendedor (apenas para gerentes)
 *       - in: query
 *         name: sellerSegmento
 *         schema:
 *           type: string
 *         description: Segmento do vendedor (apenas para gerentes)
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
router.get('/my-alerts', authenticateToken, alertsController.getMyAlerts);

/**
 * @swagger
 * /alerts/at-risk-customers:
 *   get:
 *     summary: Obtém clientes em risco
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Quantidade de clientes
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: ID do vendedor (apenas para gerentes)
 *       - in: query
 *         name: sellerSegmento
 *         schema:
 *           type: string
 *         description: Segmento do vendedor (apenas para gerentes)
 *     responses:
 *       200:
 *         description: Lista de clientes em risco
 */
router.get('/at-risk-customers', authenticateToken, alertsController.getAtRiskCustomersList);

/**
 * @swagger
 * /alerts/pending-leads:
 *   get:
 *     summary: Obtém cotações pendentes (mais de 7 dias)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Quantidade de cotações
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: ID do vendedor (apenas para gerentes)
 *       - in: query
 *         name: sellerSegmento
 *         schema:
 *           type: string
 *         description: Segmento do vendedor (apenas para gerentes)
 *     responses:
 *       200:
 *         description: Lista de cotações pendentes
 */
router.get('/pending-leads', authenticateToken, alertsController.getPendingLeadsList);

export default router;
