import { getDatabase as db } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { creditAgentClient } from '../credit/CreditAgentClient.js';

/**
 * FinancialService - Métricas Financeiras (CFO)
 * 
 * KPIs:
 * - Margem Bruta >= 25%
 * - DSO <= 45 dias
 * - Crédito <= R$ 50M
 */
class FinancialService {

    /**
     * Retorna overview financeiro completo (margem + DSO)
     */
    async getOverview(options = {}) {
        const {
            period = null,
            segment = 'machines'
        } = options;

        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);

        logger.info('FinancialService: Getting financial overview', { period: targetPeriod, segment });

        try {
            const database = db();

            // 1. Margem bruta consolidada
            const [marginResult] = await database.execute(`
                SELECT 
                    SUM(ValorBase) as total_revenue,
                    SUM(CustoTotal) as total_cost,
                    SUM(ValorBase) - SUM(CustoTotal) as gross_margin,
                    SUM(DescontoValor) as total_discounts,
                    AVG(DescontoPct) * 100 as avg_discount_pct,
                    COUNT(DISTINCT PedidoID) as orders_count
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
                    AND VendedorID IN (
                        SELECT id FROM rolemak_users WHERE segmento = ? AND blocked = 0
                    )
            `, [year, month, segment, segment]);

            const revenue = parseFloat(marginResult[0]?.total_revenue) || 0;
            const cost = parseFloat(marginResult[0]?.total_cost) || 0;
            const grossMargin = parseFloat(marginResult[0]?.gross_margin) || 0;
            const marginPercent = revenue > 0 ? Math.round((grossMargin / revenue) * 1000) / 10 : 0;
            const totalDiscounts = parseFloat(marginResult[0]?.total_discounts) || 0;
            const avgDiscountPct = parseFloat(marginResult[0]?.avg_discount_pct) || 0;

            // 2. Margem por vendedor
            const [marginBySeller] = await database.execute(`
                SELECT 
                    VendedorID as seller_id,
                    VendedorApelido as seller_name,
                    SUM(ValorBase) as revenue,
                    SUM(CustoTotal) as cost,
                    SUM(ValorBase) - SUM(CustoTotal) as gross_margin,
                    ROUND(((SUM(ValorBase) - SUM(CustoTotal)) / SUM(ValorBase)) * 100, 1) as margin_pct
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
                    AND VendedorID IN (
                        SELECT id FROM rolemak_users WHERE segmento = ? AND blocked = 0
                    )
                GROUP BY VendedorID, VendedorApelido
                ORDER BY margin_pct DESC
            `, [year, month, segment, segment]);

            // 3. Classificar vendedores por risco de margem
            const sellersWithRisk = marginBySeller.map(s => ({
                seller_id: s.seller_id,
                seller_name: s.seller_name,
                revenue: parseFloat(s.revenue) || 0,
                gross_margin: parseFloat(s.gross_margin) || 0,
                margin_pct: parseFloat(s.margin_pct) || 0,
                risk: this.getMarginRisk(parseFloat(s.margin_pct) || 0)
            }));

            // 4. Distribuição de risco
            const riskDistribution = {
                LOW: sellersWithRisk.filter(s => s.risk === 'LOW').length,
                MEDIUM: sellersWithRisk.filter(s => s.risk === 'MEDIUM').length,
                HIGH: sellersWithRisk.filter(s => s.risk === 'HIGH').length,
                CRITICAL: sellersWithRisk.filter(s => s.risk === 'CRITICAL').length
            };

            // 5. DSO Calculation
            const dsoData = await this.getDSO({ period: targetPeriod, segment });

            // KPIs
            const marginTarget = 25;
            const dsoTarget = 45;
            const marginStatus = marginPercent >= marginTarget ? 'ON_TARGET' :
                marginPercent >= 20 ? 'WARNING' : 'CRITICAL';
            const dsoStatus = dsoData.company_dso <= dsoTarget ? 'ON_TARGET' :
                dsoData.company_dso <= 60 ? 'WARNING' : 'CRITICAL';

            // Overall status
            const statusPriority = { 'CRITICAL': 0, 'WARNING': 1, 'ON_TARGET': 2 };
            const overallStatus = [marginStatus, dsoStatus]
                .sort((a, b) => statusPriority[a] - statusPriority[b])[0];

            return {
                period: targetPeriod,
                segment: segment,
                overall_status: overallStatus,

                kpis: {
                    margin: {
                        current: marginPercent,
                        target: marginTarget,
                        status: marginStatus,
                        achievement_percent: Math.round((marginPercent / marginTarget) * 100)
                    },
                    dso: {
                        current: dsoData.company_dso,
                        target: dsoTarget,
                        status: dsoStatus,
                        achievement_percent: dsoData.company_dso > 0 ? Math.round((dsoTarget / dsoData.company_dso) * 100) : 100
                    }
                },

                summary: {
                    total_revenue: revenue,
                    total_cost: cost,
                    gross_margin: grossMargin,
                    margin_percent: marginPercent,
                    total_discounts: totalDiscounts,
                    avg_discount_percent: Math.round(avgDiscountPct * 10) / 10,
                    orders_count: marginResult[0]?.orders_count || 0,
                    receivables: dsoData.total_receivables,
                    dso_days: dsoData.company_dso
                },

                by_seller: sellersWithRisk,
                risk_distribution: riskDistribution,
                dso_by_seller: dsoData.by_seller,

                alerts: [
                    ...sellersWithRisk
                        .filter(s => s.risk === 'CRITICAL' || s.risk === 'HIGH')
                        .map(s => ({
                            type: 'LOW_MARGIN',
                            severity: s.risk,
                            seller_id: s.seller_id,
                            seller_name: s.seller_name,
                            margin_pct: s.margin_pct,
                            message: `${s.seller_name}: margem de ${s.margin_pct}% (meta: ${marginTarget}%)`
                        })),
                    ...(dsoData.company_dso > dsoTarget ? [{
                        type: 'HIGH_DSO',
                        severity: dsoData.company_dso > 60 ? 'CRITICAL' : 'WARNING',
                        dso: dsoData.company_dso,
                        message: `DSO de ${dsoData.company_dso} dias (meta: ${dsoTarget} dias)`
                    }] : [])
                ]
            };
        } catch (error) {
            logger.error('FinancialService: Error getting overview', { error: error.message });
            throw error;
        }
    }

    /**
     * Calcula DSO (Days Sales Outstanding)
     * DSO = (Contas a Receber / Vendas) × Dias no Período
     */
    async getDSO(options = {}) {
        const {
            period = null,
            segment = 'machines',
            customerId = null,
            sellerId = null
        } = options;

        const targetPeriod = period || this.getCurrentPeriod();
        const [year, month] = targetPeriod.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();

        logger.info('FinancialService: Calculating DSO', { period: targetPeriod, segment });

        try {
            const database = db();

            // Total de vendas no período
            let salesQuery = `
                SELECT 
                    SUM(ValorBase) as total_sales
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
            `;
            const salesParams = [year, month, segment];

            if (customerId) {
                salesQuery += ` AND ClienteID = ?`;
                salesParams.push(customerId);
            }
            if (sellerId) {
                salesQuery += ` AND VendedorID = ?`;
                salesParams.push(sellerId);
            }

            const [salesResult] = await database.execute(salesQuery, salesParams);
            const totalSales = parseFloat(salesResult[0]?.total_sales) || 0;

            // Simular contas a receber (em produção, virá de tabela de Contas a Receber)
            // Por enquanto, estimamos como 30-40% das vendas do período
            const estimatedReceivables = totalSales * 0.35;

            // Calcular DSO
            const companyDSO = totalSales > 0 ? Math.round((estimatedReceivables / totalSales) * daysInMonth) : 0;

            // DSO por vendedor
            const [dsoBySellerResult] = await database.execute(`
                SELECT 
                    VendedorID as seller_id,
                    VendedorApelido as seller_name,
                    SUM(ValorBase) as sales
                FROM mak.Vendas_Historia
                WHERE YEAR(DataVenda) = ? AND MONTH(DataVenda) = ?
                    AND ProdutoSegmento = ?
                GROUP BY VendedorID, VendedorApelido
                ORDER BY sales DESC
            `, [year, month, segment]);

            const dsoBySeller = dsoBySellerResult.map(s => {
                const sellerSales = parseFloat(s.sales) || 0;
                const sellerReceivables = sellerSales * (0.30 + Math.random() * 0.15); // Simulação
                const sellerDSO = sellerSales > 0 ? Math.round((sellerReceivables / sellerSales) * daysInMonth) : 0;
                return {
                    seller_id: s.seller_id,
                    seller_name: s.seller_name,
                    sales: sellerSales,
                    receivables: sellerReceivables,
                    dso: sellerDSO,
                    status: sellerDSO <= 45 ? 'ON_TARGET' : sellerDSO <= 60 ? 'WARNING' : 'CRITICAL'
                };
            });

            return {
                period: targetPeriod,
                segment: segment,
                company_dso: companyDSO,
                target_dso: 45,
                total_sales: totalSales,
                total_receivables: estimatedReceivables,
                by_seller: dsoBySeller,
                status: companyDSO <= 45 ? 'ON_TARGET' : companyDSO <= 60 ? 'WARNING' : 'CRITICAL'
            };
        } catch (error) {
            logger.error('FinancialService: Error calculating DSO', { error: error.message });
            throw error;
        }
    }

    /**
     * Retorna status de crédito de um cliente
     * 
     * Estratégia híbrida:
     * 1. Tenta obter do Credit Agent (fonte primária se habilitado)
     * 2. Fallback para consulta local ao banco de dados
     * 
     * @param {number|string} customerId - ID do cliente
     * @param {string} authToken - Token de autenticação (opcional)
     * @returns {Promise<Object>} Status de crédito do cliente
     */
    async getCreditStatus(customerId, authToken = null) {
        logger.info('FinancialService: Getting credit status', { customerId });

        // 1. Tentar obter do Credit Agent
        if (creditAgentClient.isEnabled()) {
            const agentResult = await creditAgentClient.getCustomerProfile(customerId, authToken);

            if (agentResult.success && agentResult.data) {
                logger.info('FinancialService: Credit status from Credit Agent', {
                    customerId,
                    source: 'credit_agent',
                    riskGrade: agentResult.data.risk_grade
                });

                return {
                    customer_id: agentResult.data.customer_id,
                    customer_name: null, // Credit Agent não retorna nome
                    credit_limit: agentResult.data.credit_limit,
                    credit_used: agentResult.data.credit_used,
                    credit_available: agentResult.data.credit_available,
                    overdue_days: agentResult.data.days_past_due_max,
                    status: agentResult.data.status,
                    can_convert: agentResult.data.can_convert,
                    message: agentResult.data.message,
                    // Campos extras do Credit Agent
                    risk_grade: agentResult.data.risk_grade,
                    risk_score: agentResult.data.risk_score,
                    is_blocked: agentResult.data.is_blocked,
                    is_new_customer: agentResult.data.is_new_customer,
                    last_review_at: agentResult.data.last_review_at,
                    source: 'credit_agent'
                };
            }

            logger.warn('FinancialService: Credit Agent unavailable, falling back to local DB', {
                customerId,
                error: agentResult.error
            });
        }

        // 2. Fallback para consulta local (view v_clientes_credito_real)
        try {
            const database = db();

            // Buscar limite de crédito do cliente da view que calcula saldo da tabela cheques
            const [customerResult] = await database.execute(`
                SELECT 
                    v.cliente_id AS ClienteID,
                    v.nome AS NomeCliente,
                    v.limite_credito AS LimiteCredito,
                    v.credito_utilizado AS SaldoDevedor,
                    v.credito_disponivel AS CreditoDisponivel,
                    v.dias_atraso_max AS DiasAtraso,
                    v.bloqueado,
                    v.risk_grade
                FROM mak.v_clientes_credito_real v
                WHERE v.cliente_id = ?
            `, [customerId]);

            if (customerResult.length === 0) {
                // Cliente não encontrado - retornar status padrão
                return {
                    customer_id: customerId,
                    credit_limit: 0,
                    credit_used: 0,
                    credit_available: 0,
                    overdue_days: 0,
                    status: 'PENDING',
                    can_convert: true,
                    message: 'Cliente não encontrado',
                    source: 'local_db'
                };
            }

            const customer = customerResult[0];
            const creditLimit = parseFloat(customer.LimiteCredito) || 0;
            const creditUsed = parseFloat(customer.SaldoDevedor) || 0;
            const overdueDays = parseInt(customer.DiasAtraso) || 0;
            const creditAvailable = Math.max(creditLimit - creditUsed, 0);
            const isBlocked = customer.bloqueado === 1 || customer.bloqueado === '1';

            // Determinar status
            let status = 'OK';
            let canConvert = true;
            let message = 'Crédito disponível';

            if (isBlocked) {
                status = 'BLOCKED';
                canConvert = false;
                message = 'Cliente bloqueado';
            } else if (creditAvailable <= 0 && creditLimit > 0) {
                status = 'LIMIT_EXCEEDED';
                canConvert = false;
                message = 'Limite de crédito excedido';
            } else if (creditLimit > 0 && creditAvailable < creditLimit * 0.2) {
                status = 'LOW_CREDIT';
                canConvert = true;
                message = 'Crédito disponível baixo';
            } else if (creditLimit === 0) {
                status = 'OK';
                canConvert = true;
                message = 'Sem limite definido';
            }

            // Mapear risk para risk_grade
            const riskGradeMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };

            return {
                customer_id: customerId,
                customer_name: customer.NomeCliente,
                credit_limit: creditLimit,
                credit_used: creditUsed,
                credit_available: creditAvailable,
                overdue_days: overdueDays,
                status: status,
                can_convert: canConvert,
                message: message,
                risk_grade: customer.risk_grade || 'NA',
                risk_score: null,
                is_blocked: isBlocked,
                source: 'local_db'
            };
        } catch (error) {
            logger.warn('FinancialService: Error getting credit status from local DB', { error: error.message });
            // Retornar status padrão se houver erro
            return {
                customer_id: customerId,
                credit_limit: 50000,
                credit_used: 0,
                credit_available: 50000,
                overdue_days: 0,
                status: 'OK',
                can_convert: true,
                message: 'Crédito disponível (padrão)',
                source: 'fallback'
            };
        }
    }

    /**
     * Avalia crédito para um pedido via Credit Agent
     * 
     * @param {Object} options - Opções de avaliação
     * @param {string} authToken - Token de autenticação
     * @returns {Promise<Object>} Resultado da avaliação
     */
    async evaluateCreditForOrder(options, authToken = null) {
        const {
            customerId,
            orderId,
            orderTotal,
            termsDays = 30,
            installments = 1,
            downPaymentPct = 0,
            pricingStatus = 'OK',
            marginOk = true,
            policyRefs = [],
            pricingDecisionLogId = null
        } = options;

        logger.info('FinancialService: Evaluating credit for order', { customerId, orderId, orderTotal });

        // Se Credit Agent está habilitado, usa API
        if (creditAgentClient.isEnabled()) {
            // Primeiro, obter perfil do cliente
            const customerProfile = await this.getCreditStatus(customerId, authToken);

            // Montar payload
            const payload = creditAgentClient.buildEvaluationPayload({
                customerId,
                customerRiskGrade: customerProfile.risk_grade || 'NA',
                customerRiskScore: customerProfile.risk_score || 0,
                creditLimit: customerProfile.credit_limit || 0,
                creditUsed: customerProfile.credit_used || 0,
                daysPastDueMax: customerProfile.overdue_days || 0,
                isBlocked: customerProfile.is_blocked || false,
                isNewCustomer: customerProfile.is_new_customer || false,
                orderId,
                orderTotal,
                termsDays,
                installments,
                downPaymentPct,
                pricingStatus,
                marginOk,
                policyRefs,
                pricingDecisionLogId
            });

            const evalResult = await creditAgentClient.evaluateCredit(payload, authToken);

            if (evalResult.success && evalResult.data) {
                const outcome = evalResult.data.outcome;
                const reasons = evalResult.data.reasons || [];

                // Se o Policy Engine falhou, usar lógica local como fallback
                const policyEngineFailed = reasons.includes('POLICY_ENGINE_ERROR') ||
                    reasons.includes('policy_engine_unavailable');

                if (policyEngineFailed) {
                    logger.warn('FinancialService: Policy Engine failed, using local credit logic', {
                        originalOutcome: outcome,
                        reasons
                    });

                    // Usar lógica local baseada no perfil do cliente
                    let localOutcome = 'ALLOW';
                    let localReasons = [];

                    if (customerProfile.is_blocked || customerProfile.status === 'BLOCKED') {
                        localOutcome = 'DENY';
                        localReasons.push('Cliente bloqueado');
                    } else if (orderTotal > customerProfile.credit_available) {
                        localOutcome = 'DENY';
                        localReasons.push(`Valor do pedido (R$ ${orderTotal.toLocaleString('pt-BR')}) excede crédito disponível (R$ ${customerProfile.credit_available.toLocaleString('pt-BR')})`);
                    } else if (customerProfile.status === 'LOW_CREDIT') {
                        localOutcome = 'RECOMMEND';
                        localReasons.push('Crédito disponível baixo');
                    }

                    return {
                        success: true,
                        source: 'local_fallback',
                        outcome: localOutcome,
                        approved_amount: localOutcome === 'ALLOW' || localOutcome === 'RECOMMEND' ? orderTotal : null,
                        conditions: null,
                        reasons: localReasons,
                        risk_grade: customerProfile.risk_grade || 'NA',
                        risk_score: customerProfile.risk_score || 0,
                        customer_profile: customerProfile
                    };
                }

                // Policy Engine respondeu corretamente
                return {
                    success: true,
                    source: 'credit_agent',
                    outcome: evalResult.data.outcome,
                    approved_amount: evalResult.data.approved_amount,
                    conditions: evalResult.data.conditions,
                    reasons: evalResult.data.reasons,
                    risk_grade: evalResult.data.risk_grade,
                    risk_score: evalResult.data.risk_score,
                    customer_profile: customerProfile
                };
            }

            logger.warn('FinancialService: Credit Agent evaluation failed, using local logic', {
                error: evalResult.error
            });
        }

        // Fallback: lógica local simples
        const creditStatus = await this.getCreditStatus(customerId, authToken);

        let outcome = 'ALLOW';
        let reasons = [];

        if (creditStatus.is_blocked || creditStatus.status === 'BLOCKED') {
            outcome = 'DENY';
            reasons.push('Cliente bloqueado por inadimplência');
        } else if (creditStatus.status === 'LIMIT_EXCEEDED') {
            outcome = 'DENY';
            reasons.push('Limite de crédito excedido');
        } else if (orderTotal > creditStatus.credit_available) {
            outcome = 'ESCALATE';
            reasons.push(`Valor do pedido (${orderTotal}) excede crédito disponível (${creditStatus.credit_available})`);
        } else if (creditStatus.status === 'LOW_CREDIT') {
            outcome = 'RECOMMEND';
            reasons.push('Crédito disponível baixo - considerar entrada');
        }

        return {
            success: true,
            source: 'local_fallback',
            outcome,
            approved_amount: outcome === 'ALLOW' || outcome === 'RECOMMEND' ? orderTotal : null,
            conditions: null,
            reasons,
            risk_grade: creditStatus.risk_grade || 'NA',
            risk_score: creditStatus.risk_score || 0,
            customer_profile: creditStatus
        };
    }

    /**
     * Obtém clientes de alto risco via Credit Agent
     * 
     * @param {string} authToken - Token de autenticação
     * @returns {Promise<Object>} Lista de clientes de risco
     */
    async getRiskyCustomers(authToken = null) {
        logger.info('FinancialService: Getting risky customers');

        if (creditAgentClient.isEnabled()) {
            const result = await creditAgentClient.getRiskyCustomers(authToken);

            if (result.success && result.data) {
                return {
                    success: true,
                    source: 'credit_agent',
                    customers: result.data.customers,
                    count: result.data.count
                };
            }
        }

        // Fallback para blocked credits local
        const blockedCredits = await this.getBlockedCredits(100);

        return {
            success: true,
            source: 'local_db',
            customers: blockedCredits.customers,
            count: blockedCredits.count
        };
    }

    /**
     * Retorna clientes com crédito bloqueado
     */
    async getBlockedCredits(limit = 50) {
        logger.info('FinancialService: Getting blocked credits');

        try {
            const database = db();

            const [results] = await database.execute(`
                SELECT 
                    ClienteID as customer_id,
                    NomeCliente as customer_name,
                    LimiteCredito as credit_limit,
                    SaldoDevedor as credit_used,
                    DiasAtraso as overdue_days
                FROM mak.v_clientes_credito
                WHERE SaldoDevedor > LimiteCredito OR DiasAtraso > 30
                ORDER BY DiasAtraso DESC, SaldoDevedor DESC
                LIMIT ?
            `, [limit]);

            return {
                count: results.length,
                customers: results.map(c => ({
                    customer_id: c.customer_id,
                    customer_name: c.customer_name,
                    credit_limit: parseFloat(c.credit_limit) || 0,
                    credit_used: parseFloat(c.credit_used) || 0,
                    overdue_days: parseInt(c.overdue_days) || 0,
                    status: c.overdue_days > 30 ? 'BLOCKED_OVERDUE' : 'BLOCKED_LIMIT'
                }))
            };
        } catch (error) {
            logger.warn('FinancialService: Error getting blocked credits', { error: error.message });
            return { count: 0, customers: [] };
        }
    }

    /**
     * Verifica se pode converter lead baseado no crédito
     */
    async validateCreditForConversion(customerId, orderValue) {
        const creditStatus = await this.getCreditStatus(customerId);

        if (!creditStatus.can_convert) {
            return {
                allowed: false,
                reason: creditStatus.message,
                credit_status: creditStatus
            };
        }

        if (orderValue > creditStatus.credit_available) {
            return {
                allowed: false,
                reason: `Valor do pedido (R$ ${orderValue.toLocaleString('pt-BR')}) excede crédito disponível (R$ ${creditStatus.credit_available.toLocaleString('pt-BR')})`,
                credit_status: creditStatus
            };
        }

        return {
            allowed: true,
            reason: 'Crédito aprovado',
            credit_status: creditStatus
        };
    }

    /**
     * Verifica alertas financeiros para notificação
     */
    async checkAlerts() {
        const overview = await this.getOverview();

        return {
            has_alerts: overview.alerts.length > 0,
            alerts_count: overview.alerts.length,
            margin_status: overview.kpis.margin.status,
            dso_status: overview.kpis.dso.status,
            overall_status: overview.overall_status,
            alerts: overview.alerts
        };
    }

    /**
     * Classifica risco baseado na margem
     */
    getMarginRisk(marginPct) {
        if (marginPct >= 30) return 'LOW';
        if (marginPct >= 25) return 'MEDIUM';
        if (marginPct >= 20) return 'HIGH';
        return 'CRITICAL';
    }

    /**
     * Retorna período atual
     */
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

export const financialService = new FinancialService();

