import { penetrationService } from '../services/analytics/PenetrationService.js';
import { pipelineService } from '../services/analytics/PipelineService.js';
import { inventoryService } from '../services/analytics/InventoryService.js';
import { financialService } from '../services/analytics/FinancialService.js';
import { customerGoalsService } from '../services/analytics/CustomerGoalsService.js';
import { aiGovernanceService } from '../services/ai/AIGovernanceService.js';
import { executiveBriefService } from '../services/analytics/ExecutiveBriefService.js';
import logger from '../../config/logger.js';

/**
 * Analytics Controller - Endpoints para métricas da meta 30.000 máquinas/ano
 * 
 * Endpoints:
 * - GET /api/v2/analytics/penetration - Métricas de penetração
 * - GET /api/v2/analytics/penetration/history - Histórico de penetração
 * - GET /api/v2/analytics/penetration/inactive - Clientes inativos
 * - GET /api/v2/analytics/pipeline - Métricas de pipeline
 * - GET /api/v2/analytics/pipeline/weekly - Pipeline semanal
 * - GET /api/v2/analytics/pipeline/ranking - Ranking de vendedores
 * - GET /api/v2/analytics/pipeline/alerts - Alertas de pipeline
 * - GET /api/v2/analytics/summary - Resumo executivo
 */

/**
 * GET /api/v2/analytics/penetration
 * Retorna métricas de penetração mensal
 */
export async function getPenetration(req, res) {
    try {
        const { seller_id, period } = req.query;

        const data = await penetrationService.calculate({
            sellerId: seller_id ? parseInt(seller_id) : null,
            period: period || null
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting penetration', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get penetration metrics',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/penetration/history
 * Retorna histórico de penetração
 */
export async function getPenetrationHistory(req, res) {
    try {
        const { seller_id, months } = req.query;

        const data = await penetrationService.getHistory(
            seller_id ? parseInt(seller_id) : null,
            months ? parseInt(months) : 12
        );

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting penetration history', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get penetration history',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/penetration/inactive
 * Retorna lista de clientes inativos (não compraram no período)
 */
export async function getInactiveCustomers(req, res) {
    try {
        const { seller_id, period } = req.query;

        if (!seller_id) {
            return res.status(400).json({
                success: false,
                error: 'seller_id is required'
            });
        }

        const data = await penetrationService.getInactiveCustomers(
            parseInt(seller_id),
            period || null
        );

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting inactive customers', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get inactive customers',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/pipeline
 * Retorna métricas de pipeline de vendas
 */
export async function getPipeline(req, res) {
    try {
        const { seller_id, period, granularity, segment } = req.query;

        const data = await pipelineService.calculate({
            sellerId: seller_id ? parseInt(seller_id) : null,
            period: period || null,
            granularity: granularity || 'month',
            segment: segment || 'machines'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting pipeline', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get pipeline metrics',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/pipeline/weekly
 * Retorna pipeline semanal
 */
export async function getWeeklyPipeline(req, res) {
    try {
        const { seller_id, weeks } = req.query;

        const data = await pipelineService.getWeeklyPipeline({
            sellerId: seller_id ? parseInt(seller_id) : null,
            weeks: weeks ? parseInt(weeks) : 4
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting weekly pipeline', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get weekly pipeline',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/pipeline/ranking
 * Retorna ranking de vendedores por performance
 */
export async function getPipelineRanking(req, res) {
    try {
        const { period } = req.query;

        const data = await pipelineService.getSellerRanking(period || null);

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting pipeline ranking', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get pipeline ranking',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/pipeline/alerts
 * Retorna alertas de pipeline
 */
export async function getPipelineAlerts(req, res) {
    try {
        const data = await pipelineService.checkAlerts();

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting pipeline alerts', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get pipeline alerts',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/summary
 * Retorna resumo executivo com todos os KPIs da meta 30k
 */
export async function getExecutiveSummary(req, res) {
    try {
        const { period, segment } = req.query;
        const targetSegment = segment || 'machines';

        // Buscar todas as métricas em paralelo (filtradas por segmento)
        const [penetration, pipeline] = await Promise.all([
            penetrationService.calculate({ period, segment: targetSegment }),
            pipelineService.calculate({ period, segment: targetSegment })
        ]);

        // Consolidar KPIs
        const kpis = {
            penetration: {
                current: penetration.summary?.overall_penetration || penetration.metrics?.penetration_rate || 0,
                target: 2.5,
                status: penetration.status,
                achievement_percent: penetration.summary?.achievement_percent || penetration.metrics?.achievement_percent || 0
            },
            machines_sold: {
                current: pipeline.metrics.machines_sold,
                target: pipeline.targets.machines_monthly,
                gap: pipeline.gaps.machines,
                status: pipeline.status.machines,
                achievement_percent: pipeline.achievement.machines_percent,
                projected: pipeline.forecast.projected_machines || pipeline.metrics.machines_sold
            },
            pipeline: {
                current: pipeline.metrics.machines_in_pipeline,
                target: pipeline.targets.pipeline_minimum,
                gap: pipeline.gaps.pipeline,
                status: pipeline.status.pipeline,
                achievement_percent: pipeline.achievement.pipeline_percent
            },
            conversion: {
                current: pipeline.metrics.conversion_rate,
                target: pipeline.targets.conversion_rate,
                gap: pipeline.gaps.conversion,
                status: pipeline.status.conversion,
                achievement_percent: pipeline.achievement.conversion_percent
            }
        };

        // Determinar status geral
        const statuses = [
            kpis.penetration.status,
            kpis.machines_sold.status,
            kpis.pipeline.status,
            kpis.conversion.status
        ];

        const criticalCount = statuses.filter(s => s === 'CRITICAL').length;
        const warningCount = statuses.filter(s => s === 'WARNING').length;

        let overallStatus = 'ON_TARGET';
        if (criticalCount > 0) overallStatus = 'CRITICAL';
        else if (warningCount > 0) overallStatus = 'WARNING';

        // Gerar insights
        const insights = [];

        if (kpis.penetration.status !== 'ON_TARGET') {
            insights.push({
                type: 'PENETRATION',
                severity: kpis.penetration.status,
                message: `Penetração em ${kpis.penetration.current} (meta: ${kpis.penetration.target})`
            });
        }

        if (kpis.machines_sold.status !== 'ON_TARGET') {
            insights.push({
                type: 'MACHINES',
                severity: kpis.machines_sold.status,
                message: `${kpis.machines_sold.gap} máquinas faltando para meta do mês`
            });
        }

        if (kpis.pipeline.status !== 'ON_TARGET') {
            insights.push({
                type: 'PIPELINE',
                severity: kpis.pipeline.status,
                message: `Pipeline insuficiente: ${kpis.pipeline.current} máquinas (mínimo: ${kpis.pipeline.target})`
            });
        }

        if (!pipeline.forecast.on_track) {
            insights.push({
                type: 'FORECAST',
                severity: 'WARNING',
                message: `Projeção: ${pipeline.forecast.projected_machines} máquinas (abaixo da meta)`
            });
        }

        res.json({
            success: true,
            data: {
                period: pipeline.period,
                overall_status: overallStatus,
                kpis: kpis,
                forecast: pipeline.forecast,
                insights: insights,
                sellers_summary: penetration.summary ? {
                    total: penetration.summary.total_sellers,
                    on_target: penetration.summary.sellers_on_target,
                    warning: penetration.summary.sellers_warning,
                    critical: penetration.summary.sellers_critical
                } : null
            }
        });
    } catch (error) {
        logger.error('Analytics: Error getting executive summary', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get executive summary',
            message: error.message
        });
    }
}

// =====================================================
// BLOCO 3 - GESTÃO DE ESTOQUE (COO)
// =====================================================

/**
 * GET /api/v2/analytics/inventory
 * Retorna visão geral do estoque de máquinas
 */
export async function getInventoryOverview(req, res) {
    try {
        const data = await inventoryService.getOverview();

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting inventory overview', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get inventory overview',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/inventory/low-turn
 * Retorna produtos de baixo giro
 */
export async function getLowTurnProducts(req, res) {
    try {
        const { limit, min_days, sort_by } = req.query;

        const data = await inventoryService.getLowTurnProducts({
            limit: limit ? parseInt(limit) : 50,
            minDays: min_days ? parseInt(min_days) : 90,
            sortBy: sort_by || 'valor_total_fob'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting low-turn products', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get low-turn products',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/inventory/stockout-alerts
 * Retorna alertas de ruptura de estoque
 */
export async function getStockoutAlerts(req, res) {
    try {
        const data = await inventoryService.getStockoutAlerts();

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting stockout alerts', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get stockout alerts',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/inventory/bundles/suggest
 * Retorna sugestões de bundles para produtos de baixo giro
 */
export async function getBundleSuggestions(req, res) {
    try {
        const { limit } = req.query;

        const data = await inventoryService.suggestBundles({
            limit: limit ? parseInt(limit) : 20
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting bundle suggestions', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get bundle suggestions',
            message: error.message
        });
    }
}

// =====================================================
// BLOCO 4 - GESTÃO FINANCEIRA (CFO)
// =====================================================

/**
 * GET /api/v2/analytics/financial
 * Retorna métricas financeiras (margem, risco)
 */
export async function getFinancialOverview(req, res) {
    try {
        const { period, segment } = req.query;

        const data = await financialService.getOverview({
            period: period || null,
            segment: segment || 'machines'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting financial overview', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get financial overview',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/margin
 * Retorna métricas de margem (alias para financial overview focado em margem)
 */
export async function getMargin(req, res) {
    try {
        const { period, segment } = req.query;

        const data = await financialService.getOverview({
            period: period || null,
            segment: segment || 'machines'
        });

        // Retornar focado em margem
        res.json({
            success: true,
            data: {
                period: data.period,
                segment: data.segment,
                margin: data.kpis.margin,
                summary: {
                    total_revenue: data.summary.total_revenue,
                    total_cost: data.summary.total_cost,
                    gross_margin: data.summary.gross_margin,
                    margin_percent: data.summary.margin_percent,
                    avg_discount_percent: data.summary.avg_discount_percent
                },
                by_seller: data.by_seller,
                risk_distribution: data.risk_distribution,
                alerts: data.alerts.filter(a => a.type === 'LOW_MARGIN')
            }
        });
    } catch (error) {
        logger.error('Analytics: Error getting margin', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get margin metrics',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/dso
 * Retorna DSO (Days Sales Outstanding)
 */
export async function getDSO(req, res) {
    try {
        const { period, segment, customer_id, seller_id } = req.query;

        const data = await financialService.getDSO({
            period: period || null,
            segment: segment || 'machines',
            customerId: customer_id ? parseInt(customer_id) : null,
            sellerId: seller_id ? parseInt(seller_id) : null
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting DSO', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get DSO metrics',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/credit/:customerId
 * Retorna status de crédito de um cliente
 */
export async function getCreditStatus(req, res) {
    try {
        const { customerId } = req.params;

        const data = await financialService.getCreditStatus(parseInt(customerId));

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting credit status', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get credit status',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/credit/blocked
 * Retorna lista de clientes com crédito bloqueado
 */
export async function getBlockedCredits(req, res) {
    try {
        const { limit } = req.query;

        const data = await financialService.getBlockedCredits(
            limit ? parseInt(limit) : 50
        );

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting blocked credits', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get blocked credits',
            message: error.message
        });
    }
}

/**
 * POST /api/v2/analytics/credit/evaluate
 * Avalia crédito para um pedido via Credit Agent
 */
export async function evaluateCreditForOrder(req, res) {
    try {
        const {
            customer_id,
            order_id,
            order_total,
            terms_days,
            installments,
            down_payment_pct,
            pricing_status,
            margin_ok,
            policy_refs,
            pricing_decision_log_id
        } = req.body;

        if (!customer_id || !order_id || order_total === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customer_id, order_id, order_total'
            });
        }

        // Obter token de autenticação do request
        const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

        const data = await financialService.evaluateCreditForOrder({
            customerId: customer_id,
            orderId: order_id,
            orderTotal: parseFloat(order_total),
            termsDays: terms_days ? parseInt(terms_days) : 30,
            installments: installments ? parseInt(installments) : 1,
            downPaymentPct: down_payment_pct ? parseFloat(down_payment_pct) : 0,
            pricingStatus: pricing_status || 'OK',
            marginOk: margin_ok !== false,
            policyRefs: policy_refs || [],
            pricingDecisionLogId: pricing_decision_log_id || null
        }, authToken);

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error evaluating credit', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate credit',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/credit/risky-customers
 * Retorna clientes de alto risco via Credit Agent
 */
export async function getRiskyCustomers(req, res) {
    try {
        const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

        const data = await financialService.getRiskyCustomers(authToken);

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting risky customers', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get risky customers',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/credit/health
 * Verifica saúde da integração com Credit Agent
 */
export async function getCreditAgentHealth(req, res) {
    try {
        const { creditAgentClient } = await import('../services/credit/CreditAgentClient.js');

        const health = await creditAgentClient.healthCheck();

        res.json({
            success: true,
            data: {
                credit_agent: {
                    enabled: creditAgentClient.isEnabled(),
                    base_url: creditAgentClient.baseUrl,
                    ...health
                }
            }
        });
    } catch (error) {
        logger.error('Analytics: Error checking Credit Agent health', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to check Credit Agent health',
            message: error.message
        });
    }
}

// =====================================================
// METAS POR CLIENTE
// =====================================================

/**
 * GET /api/v2/analytics/goals/seller/:sellerId
 * Retorna metas de clientes de um vendedor
 */
export async function getCustomerGoalsBySeller(req, res) {
    try {
        const { sellerId } = req.params;
        const { year, month, classification, limit, offset, order_by } = req.query;

        const requestUserId = req.user?.userId ?? req.user?.id;
        const requestUserLevel = req.user?.level ?? 0;

        // Segurança: vendedores (level <= 1) só podem consultar seu próprio sellerId
        if ((requestUserLevel || 0) <= 1 && requestUserId && parseInt(sellerId) !== parseInt(requestUserId)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Sem permissão para ver metas de outro vendedor'
            });
        }

        const data = await customerGoalsService.getBySeller(parseInt(sellerId), {
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined,
            classification: classification || null,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0,
            orderBy: order_by || 'penetration_priority',
            requestUserId,
            requestUserLevel
        });

        // Headers de cache para debug
        if (data._cache) {
            res.set('X-Cache-Static', data._cache.staticHit ? 'HIT' : 'MISS');
            res.set('X-Cache-Annual', data._cache.annualHit ? 'HIT' : 'MISS');
            res.set('X-Query-Time-Ms', String(data._cache.queryTimeMs));
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting customer goals', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get customer goals',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/goals/customer/:customerId
 * Retorna meta de um cliente específico
 */
export async function getCustomerGoal(req, res) {
    try {
        const { customerId } = req.params;
        const { year } = req.query;

        const data = await customerGoalsService.getByCustomer(
            parseInt(customerId),
            year ? parseInt(year) : null
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Customer goal not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting customer goal', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get customer goal',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/analytics/goals/ranking
 * Retorna ranking de clientes por atingimento de meta
 */
export async function getCustomerGoalsRanking(req, res) {
    try {
        const { seller_id, year, limit, order_by } = req.query;

        const data = await customerGoalsService.getRanking({
            sellerId: seller_id ? parseInt(seller_id) : null,
            year: year ? parseInt(year) : undefined,
            limit: limit ? parseInt(limit) : 50,
            orderBy: order_by || 'achievement'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Analytics: Error getting customer goals ranking', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get customer goals ranking',
            message: error.message
        });
    }
}

// =====================================================
// BLOCO 5 - GOVERNANÇA DE IA (CAIO)
// =====================================================

/**
 * GET /api/v2/ai/model-performance
 * Retorna performance de todos os modelos de IA
 */
export async function getModelPerformance(req, res) {
    try {
        const { days } = req.query;

        const data = await aiGovernanceService.getModelPerformance({
            days: days ? parseInt(days) : 30
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('AI Governance: Error getting model performance', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get model performance',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/ai/drift-detection
 * Detecta drift nos modelos
 */
export async function getDriftDetection(req, res) {
    try {
        const { days, baseline_days } = req.query;

        const data = await aiGovernanceService.detectDrift({
            days: days ? parseInt(days) : 7,
            baselineDays: baseline_days ? parseInt(baseline_days) : 90
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('AI Governance: Error detecting drift', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to detect drift',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/ai/performance-history
 * Retorna histórico de performance dos modelos
 */
export async function getPerformanceHistory(req, res) {
    try {
        const { days, granularity } = req.query;

        const data = await aiGovernanceService.getPerformanceHistory({
            days: days ? parseInt(days) : 90,
            granularity: granularity || 'week'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('AI Governance: Error getting performance history', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get performance history',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/ai/alerts
 * Retorna alertas de IA (performance + drift)
 */
export async function getAIAlerts(req, res) {
    try {
        const data = await aiGovernanceService.checkAlerts();

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('AI Governance: Error getting AI alerts', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get AI alerts',
            message: error.message
        });
    }
}

// =====================================================
// BLOCO 6 - BRIEF EXECUTIVO DIÁRIO (CEO)
// =====================================================

/**
 * GET /api/v2/brief/generate
 * Gera brief executivo
 */
export async function generateBrief(req, res) {
    try {
        const { format } = req.query;

        const data = await executiveBriefService.generateBrief({
            format: format || 'json'
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Brief: Error generating brief', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to generate brief',
            message: error.message
        });
    }
}

/**
 * POST /api/v2/brief/send
 * Envia brief por email e push notification
 */
export async function sendBrief(req, res) {
    try {
        const { recipients, send_email = true, send_push = true } = req.body;

        const results = { email: null, push: null };

        if (send_email) {
            results.email = await executiveBriefService.sendBriefByEmail(recipients);
        }

        if (send_push) {
            results.push = await executiveBriefService.sendBriefPushNotification();
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Brief: Error sending brief', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to send brief',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/brief/history
 * Retorna histórico de briefs enviados
 */
export async function getBriefHistory(req, res) {
    try {
        const { limit } = req.query;

        const data = await executiveBriefService.getBriefHistory(
            limit ? parseInt(limit) : 30
        );

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Brief: Error getting history', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get brief history',
            message: error.message
        });
    }
}

/**
 * GET /api/v2/brief/config
 * Retorna configuração de envio de briefs
 */
export async function getBriefConfig(req, res) {
    try {
        const config = executiveBriefService.getConfig();

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('Brief: Error getting config', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get config',
            message: error.message
        });
    }
}

/**
 * PUT /api/v2/brief/config
 * Atualiza configuração de envio de briefs
 */
export async function updateBriefConfig(req, res) {
    try {
        const newConfig = req.body;

        const config = executiveBriefService.updateConfig(newConfig);

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('Brief: Error updating config', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to update config',
            message: error.message
        });
    }
}
