/**
 * Routes para Relatórios PDF
 */
import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Lista tipos de relatórios disponíveis
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, reportsController.getReportTypes);

/**
 * @swagger
 * /reports/portfolio:
 *   get:
 *     summary: Relatório de Carteira de Clientes (PDF)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/portfolio', authenticateToken, reportsController.getPortfolioReport);

/**
 * @swagger
 * /reports/leads:
 *   get:
 *     summary: Relatório de Leads Abertos (PDF)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leads', authenticateToken, reportsController.getLeadsReport);

/**
 * @swagger
 * /reports/performance:
 *   get:
 *     summary: Relatório de Performance (PDF) - Gerentes
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/performance', authenticateToken, reportsController.getPerformanceReport);

/**
 * @swagger
 * /reports/goals:
 *   get:
 *     summary: Relatório de Metas (PDF) - Gerentes
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/goals', authenticateToken, reportsController.getGoalsReport);

export default router;
