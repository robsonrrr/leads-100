import express from 'express';
import {
    getPenetration,
    getPenetrationHistory,
    getInactiveCustomers,
    getPipeline,
    getWeeklyPipeline,
    getPipelineRanking,
    getPipelineAlerts,
    getExecutiveSummary,
    getInventoryOverview,
    getLowTurnProducts,
    getStockoutAlerts,
    getBundleSuggestions,
    getFinancialOverview,
    getCustomerGoalsBySeller,
    getCustomerGoal,
    getCustomerGoalsRanking
} from '../controllers/analytics.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Analytics Routes - Métricas da Meta 30.000 Máquinas/Ano
 * 
 * Todas as rotas requerem autenticação
 */

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// ====== PENETRAÇÃO ======

/**
 * @route GET /api/v2/analytics/penetration
 * @desc Retorna métricas de penetração mensal (KPI-mãe)
 * @query seller_id - ID do vendedor (opcional, se não informado retorna consolidado)
 * @query period - Período no formato YYYY-MM (opcional, default: mês atual)
 * @access Private
 */
router.get('/penetration', getPenetration);

/**
 * @route GET /api/v2/analytics/penetration/history
 * @desc Retorna histórico de penetração dos últimos N meses
 * @query seller_id - ID do vendedor (opcional)
 * @query months - Quantidade de meses (default: 12)
 * @access Private
 */
router.get('/penetration/history', getPenetrationHistory);

/**
 * @route GET /api/v2/analytics/penetration/inactive
 * @desc Retorna lista de clientes inativos (não compraram no período)
 * @query seller_id - ID do vendedor (obrigatório)
 * @query period - Período no formato YYYY-MM (opcional)
 * @access Private
 */
router.get('/penetration/inactive', getInactiveCustomers);

// ====== PIPELINE ======

/**
 * @route GET /api/v2/analytics/pipeline
 * @desc Retorna métricas de pipeline de vendas
 * @query seller_id - ID do vendedor (opcional)
 * @query period - Período no formato YYYY-MM (opcional)
 * @query granularity - 'day', 'week', 'month' (default: month)
 * @access Private
 */
router.get('/pipeline', getPipeline);

/**
 * @route GET /api/v2/analytics/pipeline/weekly
 * @desc Retorna pipeline semanal
 * @query seller_id - ID do vendedor (opcional)
 * @query weeks - Quantidade de semanas (default: 4)
 * @access Private
 */
router.get('/pipeline/weekly', getWeeklyPipeline);

/**
 * @route GET /api/v2/analytics/pipeline/ranking
 * @desc Retorna ranking de vendedores por performance
 * @query period - Período no formato YYYY-MM (opcional)
 * @access Private
 */
router.get('/pipeline/ranking', getPipelineRanking);

/**
 * @route GET /api/v2/analytics/pipeline/alerts
 * @desc Retorna alertas de pipeline (gap, conversão baixa, etc)
 * @access Private
 */
router.get('/pipeline/alerts', getPipelineAlerts);

// ====== RESUMO EXECUTIVO ======

/**
 * @route GET /api/v2/analytics/summary
 * @desc Retorna resumo executivo com todos os KPIs da meta 30k
 * @query period - Período no formato YYYY-MM (opcional)
 * @access Private
 */
router.get('/summary', getExecutiveSummary);

// ====== INVENTÁRIO (BLOCO 3) ======

/**
 * @route GET /api/v2/analytics/inventory
 * @desc Retorna visão geral do estoque de máquinas
 * @access Private
 */
router.get('/inventory', getInventoryOverview);

/**
 * @route GET /api/v2/analytics/inventory/low-turn
 * @desc Retorna produtos de baixo giro (cobertura > 90 dias)
 * @query limit - Número máximo de produtos (default: 50)
 * @query min_days - Mínimo de dias de cobertura (default: 90)
 * @query sort_by - Campo de ordenação (default: valor_total_fob)
 * @access Private
 */
router.get('/inventory/low-turn', getLowTurnProducts);

/**
 * @route GET /api/v2/analytics/inventory/stockout-alerts
 * @desc Retorna alertas de ruptura de estoque (S1-S5)
 * @access Private
 */
router.get('/inventory/stockout-alerts', getStockoutAlerts);

/**
 * @route GET /api/v2/analytics/inventory/bundles/suggest
 * @desc Retorna sugestões de bundles para produtos de baixo giro
 * @query limit - Número máximo de sugestões (default: 20)
 * @access Private
 */
router.get('/inventory/bundles/suggest', getBundleSuggestions);

// ====== FINANCEIRO (BLOCO 4) ======

/**
 * @route GET /api/v2/analytics/financial
 * @desc Retorna métricas financeiras (margem, risco)
 * @query period - Período no formato YYYY-MM (opcional)
 * @query segment - Segmento (default: machines)
 * @access Private
 */
router.get('/financial', getFinancialOverview);

// ====== METAS POR CLIENTE ======

/**
 * @route GET /api/v2/analytics/goals/seller/:sellerId
 * @desc Retorna metas de clientes de um vendedor
 * @access Private
 */
router.get('/goals/seller/:sellerId', getCustomerGoalsBySeller);

/**
 * @route GET /api/v2/analytics/goals/customer/:customerId
 * @desc Retorna meta de um cliente específico
 * @access Private
 */
router.get('/goals/customer/:customerId', getCustomerGoal);

/**
 * @route GET /api/v2/analytics/goals/ranking
 * @desc Retorna ranking de clientes por atingimento
 * @access Private
 */
router.get('/goals/ranking', getCustomerGoalsRanking);

export default router;
