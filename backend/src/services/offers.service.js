/**
 * CSuite Offers Agent Integration Service
 * 
 * Integrates leads-agent with the CSuite Offers Agent for building
 * commercial offers based on customer context and sales goals.
 * 
 * Flow: Leads-Agent → Offers Agent → Pricing Agent → Credit Agent
 */

const axios = require('axios');

// Use console for logging (compatible with CommonJS)
const logger = {
    info: (...args) => console.log('[OffersService]', ...args),
    error: (...args) => console.error('[OffersService]', ...args),
    warn: (...args) => console.warn('[OffersService]', ...args),
};

// Configuration
const OFFERS_API_URL = process.env.OFFERS_API_URL || 'https://csuite.internut.com.br/offers';
const OFFERS_API_TIMEOUT = parseInt(process.env.OFFERS_API_TIMEOUT_MS) || 10000;

// Create axios instance for Offers Agent
const offersClient = axios.create({
    baseURL: OFFERS_API_URL,
    timeout: OFFERS_API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor for logging
offersClient.interceptors.request.use(
    (config) => {
        logger.info(`[OffersService] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        logger.error('[OffersService] Request error:', error.message);
        return Promise.reject(error);
    }
);

// Response interceptor for logging
offersClient.interceptors.response.use(
    (response) => {
        logger.info(`[OffersService] Response: ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        logger.error(`[OffersService] Response error: ${error.response?.status || error.code} - ${error.message}`);
        return Promise.reject(error);
    }
);

/**
 * Segment mapping from leads-agent to offers agent
 */
const SEGMENT_MAPPING = {
    'maquinas': 'machines',
    'machines': 'machines',
    'pecas': 'parts',
    'parts': 'parts',
    'rolamentos': 'bearings',
    'bearings': 'bearings',
    'autopecas': 'autoparts',
    'autoparts': 'autoparts',
    'motopecas': 'motoparts',
    'motoparts': 'motoparts',
};

/**
 * Goal mapping from UI to offers agent
 */
const GOAL_MAPPING = {
    'giro': 'giro',           // High turnover products
    'ruptura': 'ruptura',     // Products customer usually buys
    'mix': 'mix',             // Products to increase penetration
    'margem': 'margem',       // High margin products
    'campanha': 'campanha',   // Campaign/promotion products
    'geral': 'general',       // Mix of strategies
};

/**
 * Build an offer for a customer
 * 
 * @param {Object} params - Offer build parameters
 * @param {string} params.segment - Product segment (machines, parts, etc.)
 * @param {number} params.customerId - Customer ID
 * @param {number} params.sellerId - Seller ID
 * @param {string} params.goalCode - Goal code (giro, ruptura, mix, margem, campanha, geral)
 * @param {Object} params.constraints - Optional constraints (maxItems, brands, etc.)
 * @param {Object} params.context - Optional context (campaignId, etc.)
 * @param {string} authToken - Auth token for the request
 * @returns {Promise<Object>} Offer build response
 */
async function buildOffer({
    segment,
    customerId,
    sellerId,
    goalCode = 'geral',
    constraints = {},
    context = {}
}, authToken) {
    try {
        // Map segment to offers agent format
        const mappedSegment = SEGMENT_MAPPING[segment?.toLowerCase()] || 'machines';
        const mappedGoal = GOAL_MAPPING[goalCode?.toLowerCase()] || 'general';

        const payload = {
            segment: mappedSegment,
            customer_id: customerId,
            seller_id: sellerId,
            goal_code: mappedGoal,
            constraints: {
                max_items: constraints.maxItems || 10,
                brands: constraints.brands || [],
                ...constraints
            },
            context: {
                campaign_id: context.campaignId || null,
                source: 'leads-agent',
                ...context
            }
        };

        logger.info(`[OffersService] Building offer for customer ${customerId}, segment: ${mappedSegment}, goal: ${mappedGoal}`);

        const response = await offersClient.post('/v1/offers/build', payload, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        const result = response.data;

        return {
            success: true,
            offerId: result.offer_id,
            requestId: result.request_id,
            segment: result.segment,
            outcome: result.outcome,
            reasons: result.reasons || [],
            conditions: result.conditions,
            bundles: result.bundles?.bundles || [],
            whatsappText: result.whatsapp_text,
            handoff: result.handoff
        };
    } catch (error) {
        logger.error(`[OffersService] Error building offer: ${error.message}`);

        if (error.response) {
            return {
                success: false,
                error: error.response.data?.detail || error.response.data?.error || 'Build failed',
                statusCode: error.response.status
            };
        }

        return {
            success: false,
            error: error.message || 'Connection error',
            statusCode: 500
        };
    }
}

/**
 * Get offer by ID
 * 
 * @param {string} offerId - Offer ID
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} Offer details
 */
async function getOffer(offerId, authToken) {
    try {
        const response = await offersClient.get(`/v1/offers/${offerId}`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        return {
            success: true,
            offer: response.data.offer
        };
    } catch (error) {
        logger.error(`[OffersService] Error getting offer ${offerId}: ${error.message}`);

        if (error.response?.status === 404) {
            return {
                success: false,
                error: 'Offer not found',
                statusCode: 404
            };
        }

        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status || 500
        };
    }
}

/**
 * Get offers for a customer
 * 
 * @param {number} customerId - Customer ID
 * @param {number} limit - Max offers to return
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} List of offers
 */
async function getCustomerOffers(customerId, limit = 10, authToken) {
    try {
        const response = await offersClient.get(`/v1/offers/customer/${customerId}`, {
            params: { limit },
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        return {
            success: true,
            offers: response.data.offers || [],
            total: response.data.total || 0
        };
    } catch (error) {
        logger.error(`[OffersService] Error getting customer offers: ${error.message}`);

        return {
            success: false,
            error: error.message,
            offers: [],
            total: 0
        };
    }
}

/**
 * Get today's offers
 * 
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} List of today's offers
 */
async function getTodayOffers(authToken) {
    try {
        const response = await offersClient.get('/v1/offers/today', {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        return {
            success: true,
            offers: response.data.offers || [],
            total: response.data.total || 0
        };
    } catch (error) {
        logger.error(`[OffersService] Error getting today offers: ${error.message}`);

        return {
            success: false,
            error: error.message,
            offers: [],
            total: 0
        };
    }
}

/**
 * Calculate prices for an offer (via Pricing Agent)
 * 
 * @param {string} offerId - Offer ID
 * @param {Object} options - Pricing options
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} Pricing result
 */
async function priceOffer(offerId, options = {}, authToken) {
    try {
        const response = await offersClient.post(`/v1/offers/${offerId}/price`, {
            payment_term: options.paymentTerm || 'standard',
            installments: options.installments || null
        }, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        const result = response.data;

        return {
            success: true,
            offerId: result.offer_id,
            pricingStatus: result.pricing_status,
            pricingTotal: result.pricing_total,
            itemsPriced: result.items_priced,
            itemsError: result.items_error,
            items: result.items || [],
            pricedAt: result.priced_at
        };
    } catch (error) {
        logger.error(`[OffersService] Error pricing offer ${offerId}: ${error.message}`);

        return {
            success: false,
            error: error.response?.data?.detail || error.message,
            statusCode: error.response?.status || 500
        };
    }
}

/**
 * Evaluate credit for an offer (via Credit Agent)
 * 
 * @param {string} offerId - Offer ID
 * @param {Object} options - Credit options
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} Credit evaluation result
 */
async function evaluateCredit(offerId, options = {}, authToken) {
    try {
        const response = await offersClient.post(`/v1/offers/${offerId}/credit`, {
            payment_terms_days: options.paymentTermsDays || 30,
            installments: options.installments || 1
        }, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        const result = response.data;

        return {
            success: result.status === 'success',
            offerId: result.offer_id,
            creditOutcome: result.credit_outcome,
            approvedAmount: result.approved_amount,
            conditions: result.conditions,
            reasons: result.reasons || [],
            riskGrade: result.risk_grade,
            riskScore: result.risk_score,
            evaluatedAt: result.evaluated_at,
            error: result.error
        };
    } catch (error) {
        logger.error(`[OffersService] Error evaluating credit for offer ${offerId}: ${error.message}`);

        return {
            success: false,
            error: error.response?.data?.detail || error.message,
            statusCode: error.response?.status || 500
        };
    }
}

/**
 * Health check for Offers Agent
 * 
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
    try {
        const response = await offersClient.get('/health', { timeout: 5000 });
        return {
            success: true,
            status: response.data.status || 'ok',
            version: response.data.version
        };
    } catch (error) {
        return {
            success: false,
            status: 'error',
            error: error.message
        };
    }
}

module.exports = {
    buildOffer,
    getOffer,
    getCustomerOffers,
    getTodayOffers,
    priceOffer,
    evaluateCredit,
    healthCheck,
    // Constants for UI
    SEGMENT_MAPPING,
    GOAL_MAPPING
};
