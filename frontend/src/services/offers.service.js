/**
 * CSuite Offers Service
 * 
 * Frontend service for building and managing commercial offers
 * via the CSuite Offers Agent integration.
 */

import api from './api';

/**
 * Build an offer for a customer
 * @param {Object} params - Build parameters
 * @returns {Promise<Object>} Offer build response
 */
export const buildOffer = async ({
    segment = 'machines',
    customerId,
    sellerId,
    goalCode = 'geral',
    constraints = {},
    context = {},
    leadId = null
}) => {
    const response = await api.post('/offers/build', {
        segment,
        customerId,
        sellerId,
        goalCode,
        constraints,
        context,
        leadId
    });
    return response.data;
};

/**
 * Get offer by ID
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} Offer details
 */
export const getOffer = async (offerId) => {
    const response = await api.get(`/offers/${offerId}`);
    return response.data;
};

/**
 * Get offers for a customer
 * @param {number} customerId - Customer ID
 * @param {number} limit - Max offers to return
 * @returns {Promise<Object>} List of offers
 */
export const getCustomerOffers = async (customerId, limit = 10) => {
    const response = await api.get(`/offers/customer/${customerId}`, {
        params: { limit }
    });
    return response.data;
};

/**
 * Get today's offers
 * @returns {Promise<Object>} List of today's offers
 */
export const getTodayOffers = async () => {
    const response = await api.get('/offers/today');
    return response.data;
};

/**
 * Calculate prices for an offer (via Pricing Agent)
 * @param {string} offerId - Offer ID
 * @param {Object} options - Pricing options
 * @returns {Promise<Object>} Pricing result
 */
export const priceOffer = async (offerId, options = {}) => {
    const response = await api.post(`/offers/${offerId}/price`, {
        paymentTerm: options.paymentTerm || 'standard',
        installments: options.installments || null
    });
    return response.data;
};

/**
 * Evaluate credit for an offer (via Credit Agent)
 * @param {string} offerId - Offer ID
 * @param {Object} options - Credit options
 * @returns {Promise<Object>} Credit evaluation result
 */
export const evaluateCredit = async (offerId, options = {}) => {
    const response = await api.post(`/offers/${offerId}/credit`, {
        paymentTermsDays: options.paymentTermsDays || 30,
        installments: options.installments || 1
    });
    return response.data;
};

/**
 * Get available segments and goals configuration
 * @returns {Promise<Object>} Configuration object
 */
export const getConfig = async () => {
    const response = await api.get('/offers/config');
    return response.data;
};

/**
 * Health check for Offers Agent
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
    const response = await api.get('/offers/health');
    return response.data;
};

// Export all as default object
const offersService = {
    buildOffer,
    getOffer,
    getCustomerOffers,
    getTodayOffers,
    priceOffer,
    evaluateCredit,
    getConfig,
    healthCheck
};

export default offersService;
