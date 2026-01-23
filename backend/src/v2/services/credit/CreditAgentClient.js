/**
 * CreditAgentClient - Cliente para integração com o Credit Agent
 * 
 * Integração com o CSuite Credit Agent para avaliação de crédito
 * e aprovação de pedidos.
 * 
 * @version 1.0.0
 * @date 2026-01-23
 */

import axios from 'axios';
import https from 'https';
import logger from '../../../config/logger.js';

class CreditAgentClient {
    constructor() {
        this.baseUrl = process.env.CREDIT_API_URL || 'https://csuite.internut.com.br/credit';
        this.timeout = parseInt(process.env.CREDIT_API_TIMEOUT_MS, 10) || 5000;
        this.enabled = process.env.CREDIT_API_ENABLED !== 'false';
        this.apiKey = process.env.CREDIT_API_KEY || null;

        // Create HTTPS agent that accepts self-signed certs in dev
        const httpsAgent = new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        logger.info('CreditAgentClient: Initialized', {
            baseUrl: this.baseUrl,
            enabled: this.enabled,
            timeout: this.timeout,
            hasApiKey: !!this.apiKey
        });
    }

    /**
     * Adiciona headers de autenticação ao request
     * Suporta Bearer token (user auth) e X-API-Key (server-to-server)
     */
    _getAuthHeaders(authToken) {
        const headers = {};

        // Server-to-server: use API Key if available
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        // User auth: pass through Bearer token
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        return headers;
    }

    /**
     * Verifica se o Credit Agent está habilitado
     */
    isEnabled() {
        return this.enabled && !!this.baseUrl;
    }

    /**
     * GET /credit/health - Verifica saúde do serviço
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                status: response.data?.status || 'ok',
                data: response.data
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Health check failed', { error: error.message });
            return {
                success: false,
                status: 'unavailable',
                error: error.message
            };
        }
    }

    /**
     * GET /credit/v1/customer/{customer_id} - Obtém perfil de crédito do cliente
     * 
     * @param {number|string} customerId - ID do cliente
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Perfil de crédito do cliente
     */
    async getCustomerProfile(customerId, authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping getCustomerProfile');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            logger.info('CreditAgentClient: Getting customer profile', { customerId });

            const response = await this.client.get(`/v1/customer/${customerId}`, {
                headers: this._getAuthHeaders(authToken)
            });

            logger.info('CreditAgentClient: Customer profile retrieved', {
                customerId,
                riskGrade: response.data?.risk_grade,
                isBlocked: response.data?.is_blocked
            });

            return {
                success: true,
                source: 'credit_agent',
                data: {
                    customer_id: response.data.customer_id,
                    risk_grade: response.data.risk_grade || 'NA',
                    risk_score: response.data.risk_score || 0,
                    credit_limit: response.data.credit_limit || 0,
                    credit_used: response.data.credit_used || 0,
                    credit_available: response.data.available_limit || 0,
                    days_past_due_max: response.data.days_past_due_max || 0,
                    is_blocked: response.data.is_blocked || false,
                    is_new_customer: response.data.is_new_customer || false,
                    last_review_at: response.data.last_review_at,
                    // Mapeamento para compatibilidade com FinancialService
                    status: response.data.is_blocked ? 'BLOCKED' :
                        response.data.available_limit <= 0 ? 'LIMIT_EXCEEDED' :
                            response.data.available_limit < response.data.credit_limit * 0.2 ? 'LOW_CREDIT' : 'OK',
                    can_convert: !response.data.is_blocked && response.data.available_limit > 0,
                    message: response.data.is_blocked ? 'Cliente bloqueado' :
                        response.data.available_limit <= 0 ? 'Limite excedido' : 'Crédito disponível'
                }
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to get customer profile', {
                customerId,
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * POST /credit/v1/evaluate - Avalia crédito para um pedido
     * 
     * @param {Object} payload - Payload completo de avaliação
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Resultado da avaliação (ALLOW|RECOMMEND|ESCALATE|DENY)
     */
    async evaluateCredit(payload, authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping evaluateCredit');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            const orderId = payload?.order?.order_id;
            const customerId = payload?.customer?.customer_id;

            logger.info('CreditAgentClient: Evaluating credit', { orderId, customerId });

            const response = await this.client.post('/v1/evaluate', { payload }, {
                headers: this._getAuthHeaders(authToken)
            });

            logger.info('CreditAgentClient: Credit evaluated', {
                orderId,
                customerId,
                outcome: response.data?.outcome,
                approvedAmount: response.data?.approved_amount
            });

            return {
                success: true,
                source: 'credit_agent',
                data: {
                    order_id: response.data.order_id,
                    customer_id: response.data.customer_id,
                    outcome: response.data.outcome, // ALLOW | RECOMMEND | ESCALATE | DENY
                    approved_amount: response.data.approved_amount,
                    conditions: response.data.conditions,
                    reasons: response.data.reasons || [],
                    risk_grade: response.data.risk_grade || 'NA',
                    risk_score: response.data.risk_score || 0,
                    policy_engine_raw: response.data.policy_engine_raw,
                    recorded_at: response.data.recorded_at
                }
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to evaluate credit', {
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * POST /credit/v1/request - Armazena snapshot do pedido
     * 
     * @param {Object} payload - Payload do pedido
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Confirmação de armazenamento
     */
    async storeOrderRequest(payload, authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping storeOrderRequest');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            const orderId = payload?.order?.order_id;

            logger.info('CreditAgentClient: Storing order request', { orderId });

            const response = await this.client.post('/v1/request', payload, {
                headers: this._getAuthHeaders(authToken)
            });

            return {
                success: true,
                source: 'credit_agent',
                data: {
                    order_id: response.data.order_id,
                    customer_id: response.data.customer_id,
                    stored: response.data.stored,
                    stored_at: response.data.stored_at
                }
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to store order request', {
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * GET /credit/v1/decision/{order_id} - Consulta decisão de um pedido
     * 
     * @param {string} orderId - ID do pedido
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Decisão de crédito do pedido
     */
    async getDecision(orderId, authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping getDecision');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            logger.info('CreditAgentClient: Getting decision', { orderId });

            const response = await this.client.get(`/v1/decision/${orderId}`, {
                headers: this._getAuthHeaders(authToken)
            });

            return {
                success: true,
                source: 'credit_agent',
                data: response.data
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to get decision', {
                orderId,
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * GET /credit/v1/decisions/today - Obtém decisões de hoje
     * 
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Lista de decisões de hoje
     */
    async getTodayDecisions(authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping getTodayDecisions');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            logger.info('CreditAgentClient: Getting today decisions');

            const response = await this.client.get('/v1/decisions/today', {
                headers: this._getAuthHeaders(authToken)
            });

            return {
                success: true,
                source: 'credit_agent',
                data: {
                    decisions: response.data.decisions || [],
                    count: response.data.count || 0
                }
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to get today decisions', {
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * GET /credit/v1/risky-customers - Obtém clientes de alto risco
     * 
     * @param {string} authToken - Token JWT para autenticação
     * @returns {Promise<Object>} Lista de clientes de risco
     */
    async getRiskyCustomers(authToken = null) {
        if (!this.isEnabled()) {
            logger.debug('CreditAgentClient: Disabled, skipping getRiskyCustomers');
            return { success: false, source: 'disabled', data: null };
        }

        try {
            logger.info('CreditAgentClient: Getting risky customers');

            const response = await this.client.get('/v1/risky-customers', {
                headers: this._getAuthHeaders(authToken)
            });

            return {
                success: true,
                source: 'credit_agent',
                data: {
                    customers: response.data.customers || [],
                    count: response.data.count || 0
                }
            };
        } catch (error) {
            logger.warn('CreditAgentClient: Failed to get risky customers', {
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                source: 'credit_agent',
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    /**
     * Monta payload completo para avaliação de crédito
     * 
     * @param {Object} options - Opções para montar o payload
     * @returns {Object} Payload no formato esperado pelo Credit Agent
     */
    buildEvaluationPayload({
        customerId,
        customerRiskGrade = 'NA',
        customerRiskScore = 0,
        creditLimit = 0,
        creditUsed = 0,
        daysPastDueMax = 0,
        isBlocked = false,
        isNewCustomer = false,
        orderId,
        orderTotal,
        currency = 'BRL',
        termsDays = 30,
        installments = 1,
        downPaymentPct = 0,
        pricingStatus = 'OK',
        marginOk = true,
        policyRefs = [],
        pricingDecisionLogId = null,
        createdBy = 'leads-agent'
    }) {
        return {
            customer: {
                customer_id: customerId,
                risk_grade: customerRiskGrade,
                risk_score: customerRiskScore,
                credit_limit: creditLimit,
                credit_used: creditUsed,
                days_past_due_max: daysPastDueMax,
                is_blocked: isBlocked,
                is_new_customer: isNewCustomer
            },
            order: {
                order_id: orderId,
                order_total: orderTotal,
                currency: currency
            },
            payment: {
                terms_days: termsDays,
                installments: installments,
                down_payment_pct: downPaymentPct
            },
            pricing: {
                status: pricingStatus,
                margin_ok: marginOk,
                policy_refs: policyRefs,
                decision_log_id: pricingDecisionLogId
            },
            created_by: createdBy
        };
    }
}

// Singleton instance
export const creditAgentClient = new CreditAgentClient();

export default CreditAgentClient;
