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

/**
 * @swagger
 * /api/v2/analytics/margin:
 *   get:
 *     summary: Métricas de margem bruta
 *     tags: [Analytics V2]
 */
router.get('/margin', auth, analyticsV2.getMargin);

/**
 * @swagger
 * /api/v2/analytics/dso:
 *   get:
 *     summary: DSO (Days Sales Outstanding)
 *     tags: [Analytics V2]
 */
router.get('/dso', auth, analyticsV2.getDSO);

/**
 * @swagger
 * /api/v2/analytics/credit/blocked:
 *   get:
 *     summary: Clientes com crédito bloqueado
 *     tags: [Analytics V2]
 */
router.get('/credit/blocked', auth, analyticsV2.getBlockedCredits);

/**
 * @swagger
 * /api/v2/analytics/credit/health:
 *   get:
 *     summary: Verifica saúde da integração com Credit Agent
 *     tags: [Credit Agent]
 */
router.get('/credit/health', auth, analyticsV2.getCreditAgentHealth);

/**
 * @swagger
 * /api/v2/analytics/credit/evaluate:
 *   post:
 *     summary: Avalia crédito para um pedido via Credit Agent
 *     tags: [Credit Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - order_id
 *               - order_total
 *             properties:
 *               customer_id:
 *                 type: integer
 *               order_id:
 *                 type: string
 *               order_total:
 *                 type: number
 *               terms_days:
 *                 type: integer
 *                 default: 30
 *               installments:
 *                 type: integer
 *                 default: 1
 *               down_payment_pct:
 *                 type: number
 *                 default: 0
 */
router.post('/credit/evaluate', auth, analyticsV2.evaluateCreditForOrder);

/**
 * @swagger
 * /api/v2/analytics/credit/risky-customers:
 *   get:
 *     summary: Clientes de alto risco via Credit Agent
 *     tags: [Credit Agent]
 */
router.get('/credit/risky-customers', auth, analyticsV2.getRiskyCustomers);

/**
 * @swagger
 * /api/v2/analytics/credit/{customerId}:
 *   get:
 *     summary: Status de crédito de um cliente
 *     tags: [Analytics V2]
 */
router.get('/credit/:customerId', auth, analyticsV2.getCreditStatus);

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

// ============================================
// GOVERNANÇA DE IA (Bloco 5)
// ============================================

/**
 * @swagger
 * /api/v2/ai/model-performance:
 *   get:
 *     summary: Performance dos modelos de IA
 *     tags: [AI Governance]
 */
router.get('/ai/model-performance', auth, analyticsV2.getModelPerformance);

/**
 * @swagger
 * /api/v2/ai/drift-detection:
 *   get:
 *     summary: Detecção de drift nos modelos
 *     tags: [AI Governance]
 */
router.get('/ai/drift-detection', auth, analyticsV2.getDriftDetection);

/**
 * @swagger
 * /api/v2/ai/performance-history:
 *   get:
 *     summary: Histórico de performance dos modelos
 *     tags: [AI Governance]
 */
router.get('/ai/performance-history', auth, analyticsV2.getPerformanceHistory);

/**
 * @swagger
 * /api/v2/ai/alerts:
 *   get:
 *     summary: Alertas de IA
 *     tags: [AI Governance]
 */
router.get('/ai/alerts', auth, analyticsV2.getAIAlerts);

// ============================================
// BRIEF EXECUTIVO (Bloco 6)
// ============================================

/**
 * @swagger
 * /api/v2/brief/generate:
 *   get:
 *     summary: Gera brief executivo
 *     tags: [Executive Brief]
 */
router.get('/brief/generate', auth, analyticsV2.generateBrief);

/**
 * @swagger
 * /api/v2/brief/send:
 *   post:
 *     summary: Envia brief por email e push
 *     tags: [Executive Brief]
 */
router.post('/brief/send', auth, analyticsV2.sendBrief);

/**
 * @swagger
 * /api/v2/brief/history:
 *   get:
 *     summary: Histórico de briefs enviados
 *     tags: [Executive Brief]
 */
router.get('/brief/history', auth, analyticsV2.getBriefHistory);

/**
 * @swagger
 * /api/v2/brief/config:
 *   get:
 *     summary: Configuração de envio de briefs
 *     tags: [Executive Brief]
 */
router.get('/brief/config', auth, analyticsV2.getBriefConfig);

/**
 * @swagger
 * /api/v2/brief/config:
 *   put:
 *     summary: Atualiza configuração de envio
 *     tags: [Executive Brief]
 */
router.put('/brief/config', auth, analyticsV2.updateBriefConfig);

export default router;
