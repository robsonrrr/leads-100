/**
 * Routes para Analytics (Gerentes)
 */
import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /analytics/team-metrics:
 *   get:
 *     summary: Métricas consolidadas da equipe
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/team-metrics', authenticateToken, analyticsController.getTeamMetrics);

router.get('/dashboard', authenticateToken, analyticsController.getDashboard);

router.get('/top-customers', authenticateToken, analyticsController.getTopCustomers);

router.get('/at-risk-customers', authenticateToken, analyticsController.getAtRiskCustomers);

router.get('/sales-by-period', authenticateToken, analyticsController.getSalesByPeriod);

router.get('/seller-summary', authenticateToken, analyticsController.getSellerSummary);

/**
 * @swagger
 * /analytics/seller-performance:
 *   get:
 *     summary: Performance por vendedor
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/seller-performance', authenticateToken, analyticsController.getSellerPerformance);

/**
 * @swagger
 * /analytics/sales-trend:
 *   get:
 *     summary: Tendência de vendas (últimos 6 meses)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sales-trend', authenticateToken, analyticsController.getSalesTrend);

/**
 * @swagger
 * /analytics/leads-metrics:
 *   get:
 *     summary: Métricas detalhadas de leads (total, conversão, funil, tendência)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leads-metrics', authenticateToken, analyticsController.getLeadsMetrics);

export default router;

