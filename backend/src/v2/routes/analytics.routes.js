import express from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { optionalAuth, authenticateToken as auth } from '../../middleware/auth.js';
import * as analyticsV2 from '../controllers/analytics.controller.js';

const router = express.Router();
const analyticsController = new AnalyticsController();

// ============================================
// PENETRAÇÃO
// ============================================

/**
 * @swagger
 * /api/v2/analytics/penetration:
 *   get:
 *     summary: Métricas de penetração
 *     tags: [Analytics V2]
 */
router.get('/penetration', auth, analyticsV2.getPenetration);

/**
 * @swagger
 * /api/v2/analytics/penetration/history:
 *   get:
 *     summary: Histórico de penetração
 *     tags: [Analytics V2]
 */
router.get('/penetration/history', auth, analyticsV2.getPenetrationHistory);

/**
 * @swagger
 * /api/v2/analytics/penetration/inactive:
 *   get:
 *     summary: Clientes inativos
 *     tags: [Analytics V2]
 */
router.get('/penetration/inactive', auth, analyticsV2.getInactiveCustomers);

// ============================================
// PIPELINE
// ============================================

/**
 * @swagger
 * /api/v2/analytics/pipeline:
 *   get:
 *     summary: Métricas de pipeline
 *     tags: [Analytics V2]
 */
router.get('/pipeline', auth, analyticsV2.getPipeline);

/**
 * @swagger
 * /api/v2/analytics/pipeline/weekly:
 *   get:
 *     summary: Pipeline semanal
 *     tags: [Analytics V2]
 */
router.get('/pipeline/weekly', auth, analyticsV2.getWeeklyPipeline);

/**
 * @swagger
 * /api/v2/analytics/pipeline/ranking:
 *   get:
 *     summary: Ranking de vendedores
 *     tags: [Analytics V2]
 */
router.get('/pipeline/ranking', auth, analyticsV2.getPipelineRanking);

/**
 * @swagger
 * /api/v2/analytics/pipeline/alerts:
 *   get:
 *     summary: Alertas de pipeline
 *     tags: [Analytics V2]
 */
router.get('/pipeline/alerts', auth, analyticsV2.getPipelineAlerts);

// ============================================
// RESUMO EXECUTIVO
// ============================================

/**
 * @swagger
 * /api/v2/analytics/summary:
 *   get:
 *     summary: Resumo executivo com KPIs
 *     tags: [Analytics V2]
 */
router.get('/summary', auth, analyticsV2.getExecutiveSummary);

// ============================================
// INVENTÁRIO
// ============================================

/**
 * @swagger
 * /api/v2/analytics/inventory:
 *   get:
 *     summary: Visão geral do estoque
 *     tags: [Analytics V2]
 */
router.get('/inventory', auth, analyticsV2.getInventoryOverview);

/**
 * @swagger
 * /api/v2/analytics/inventory/low-turn:
 *   get:
 *     summary: Produtos de baixo giro
 *     tags: [Analytics V2]
 */
router.get('/inventory/low-turn', auth, analyticsV2.getLowTurnProducts);

/**
 * @swagger
 * /api/v2/analytics/inventory/stockout-alerts:
 *   get:
 *     summary: Alertas de ruptura
 *     tags: [Analytics V2]
 */
router.get('/inventory/stockout-alerts', auth, analyticsV2.getStockoutAlerts);

/**
 * @swagger
 * /api/v2/analytics/inventory/bundles/suggest:
 *   get:
 *     summary: Sugestões de bundles
 *     tags: [Analytics V2]
 */
router.get('/inventory/bundles/suggest', auth, analyticsV2.getBundleSuggestions);

// ============================================
// FINANCEIRO
// ============================================

/**
 * @swagger
 * /api/v2/analytics/financial:
 *   get:
 *     summary: Métricas financeiras
 *     tags: [Analytics V2]
 */
router.get('/financial', auth, analyticsV2.getFinancialOverview);

// ============================================
// METAS (do AnalyticsController original)
// ============================================

/**
 * @swagger
 * /api/v2/analytics/goals/seller/{sellerId}:
 *   get:
 *     summary: Metas de clientes por vendedor
 *     tags: [Analytics V2]
 */
router.get('/goals/seller/:sellerId', auth, analyticsController.getCustomerGoalsBySeller);

/**
 * @swagger
 * /api/v2/analytics/goals/customer/{customerId}:
 *   get:
 *     summary: Meta individual do cliente
 *     tags: [Analytics V2]
 */
router.get('/goals/customer/:customerId', auth, analyticsController.getCustomerGoal);

/**
 * @swagger
 * /api/v2/analytics/goals/ranking:
 *   get:
 *     summary: Ranking de metas
 *     tags: [Analytics V2]
 */
router.get('/goals/ranking', auth, analyticsController.getCustomerGoalsRanking);

/**
 * @swagger
 * /api/v2/analytics/replenishment:
 *   get:
 *     summary: Sugestões de reposição de estoque
 *     tags: [Analytics V2]
 */
router.get('/replenishment', auth, analyticsController.getReplenishmentSuggestions);

export default router;
