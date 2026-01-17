/**
 * Metrics Routes - Q3.1 Performance Monitoring
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import metricsController from '../controllers/metrics.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Performance and system metrics
 */

/**
 * @swagger
 * /metrics/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: System is healthy
 *       503:
 *         description: System is degraded
 */
router.get('/health', metricsController.healthCheck);

/**
 * @swagger
 * /metrics/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/performance', authenticateToken, metricsController.getPerformanceMetrics);

/**
 * @swagger
 * /metrics/cache:
 *   get:
 *     summary: Get cache metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache metrics from Redis
 */
router.get('/cache', authenticateToken, metricsController.getCacheMetrics);

/**
 * @swagger
 * /metrics/queries:
 *   get:
 *     summary: Get slow query analysis (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow query analysis
 *       403:
 *         description: Access denied
 */
router.get('/queries', authenticateToken, metricsController.getQueryMetrics);

/**
 * @swagger
 * /metrics/reset:
 *   post:
 *     summary: Reset metrics counters (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics reset successfully
 */
router.post('/reset', authenticateToken, metricsController.resetMetrics);

export default router;
