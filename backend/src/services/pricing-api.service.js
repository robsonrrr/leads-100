/**
 * Pricing API Service
 * 
 * Serviço para comunicação com a API do Pricing Agent (Python/FastAPI)
 * Este serviço atua como proxy para centralizar autenticação e logging
 */

import axios from 'axios';
import logger from '../config/logger.js';

// URL base do Pricing Agent API
const PRICING_API_URL = process.env.PRICING_API_URL || 'http://csuite-pricing-agent:8000';
const PRICING_API_KEY = process.env.PRICING_API_KEY || '';

// Cliente axios configurado para o Pricing Agent
const pricingClient = axios.create({
    baseURL: PRICING_API_URL,
    timeout: 30000, // 30 segundos
    headers: {
        'Content-Type': 'application/json',
        ...(PRICING_API_KEY && { 'X-API-Key': PRICING_API_KEY })
    }
});

// Interceptor para logging de requests
pricingClient.interceptors.request.use(
    (config) => {
        logger.debug('Pricing API Request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params
        });
        return config;
    },
    (error) => {
        logger.error('Pricing API Request Error', { error: error.message });
        return Promise.reject(error);
    }
);

// Interceptor para logging de responses
pricingClient.interceptors.response.use(
    (response) => {
        logger.debug('Pricing API Response', {
            status: response.status,
            url: response.config.url
        });
        return response;
    },
    (error) => {
        logger.error('Pricing API Response Error', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

// ============================================================================
// BRANDS
// ============================================================================

export async function listBrands(params = {}) {
    const response = await pricingClient.get('/api/v1/brands', { params });
    return response.data;
}

export async function getBrandById(brandId) {
    const response = await pricingClient.get(`/api/v1/brands/${brandId}`);
    return response.data;
}

export async function createBrand(brandData) {
    const response = await pricingClient.post('/api/v1/brands', brandData);
    return response.data;
}

export async function updateBrand(brandId, brandData) {
    const response = await pricingClient.put(`/api/v1/brands/${brandId}`, brandData);
    return response.data;
}

export async function deleteBrand(brandId, hardDelete = false) {
    const response = await pricingClient.delete(`/api/v1/brands/${brandId}`, {
        params: { hard_delete: hardDelete }
    });
    return response.data;
}

// ============================================================================
// CUSTOMER BRAND PROFILES
// ============================================================================

export async function listCustomerBrandProfiles(params = {}) {
    const response = await pricingClient.get('/api/v1/customer-brand-profiles', { params });
    return response.data;
}

export async function getCustomerBrandProfile(orgId, customerId, brandId) {
    const response = await pricingClient.get(
        `/api/v1/customer-brand-profiles/${orgId}/${customerId}/${brandId}`
    );
    return response.data;
}

export async function createCustomerBrandProfile(profileData) {
    const response = await pricingClient.post('/api/v1/customer-brand-profiles', profileData);
    return response.data;
}

export async function updateCustomerBrandProfile(orgId, customerId, brandId, profileData) {
    const response = await pricingClient.put(
        `/api/v1/customer-brand-profiles/${orgId}/${customerId}/${brandId}`,
        profileData
    );
    return response.data;
}

export async function deleteCustomerBrandProfile(orgId, customerId, brandId, hardDelete = false) {
    const response = await pricingClient.delete(
        `/api/v1/customer-brand-profiles/${orgId}/${customerId}/${brandId}`,
        { params: { hard_delete: hardDelete } }
    );
    return response.data;
}

// ============================================================================
// VOLUME TIERS
// ============================================================================

export async function listVolumeTiers(params = {}) {
    const response = await pricingClient.get('/api/v1/volume-tiers', { params });
    return response.data;
}

export async function createVolumeTier(tierData) {
    const response = await pricingClient.post('/api/v1/volume-tiers', tierData);
    return response.data;
}

export async function updateVolumeTier(tierId, tierData) {
    const response = await pricingClient.put(`/api/v1/volume-tiers/${tierId}`, tierData);
    return response.data;
}

export async function deleteVolumeTier(tierId) {
    const response = await pricingClient.delete(`/api/v1/volume-tiers/${tierId}`);
    return response.data;
}

// ============================================================================
// BRAND ROLE TIERS
// ============================================================================

export async function listBrandRoleTiers(params = {}) {
    const response = await pricingClient.get('/api/v1/brand-role-tiers', { params });
    return response.data;
}

export async function createBrandRoleTier(tierData) {
    const response = await pricingClient.post('/api/v1/brand-role-tiers', tierData);
    return response.data;
}

export async function updateBrandRoleTier(tierId, tierData) {
    const response = await pricingClient.put(`/api/v1/brand-role-tiers/${tierId}`, tierData);
    return response.data;
}

export async function deleteBrandRoleTier(tierId) {
    const response = await pricingClient.delete(`/api/v1/brand-role-tiers/${tierId}`);
    return response.data;
}

// ============================================================================
// CURVE FACTORS (Curva ABC)
// ============================================================================

export async function listCurveFactors(params = {}) {
    const response = await pricingClient.get('/api/v1/curve-factors', { params });
    return response.data;
}

export async function createCurveFactor(factorData) {
    const response = await pricingClient.post('/api/v1/curve-factors', factorData);
    return response.data;
}

export async function updateCurveFactor(curve, factorData) {
    const response = await pricingClient.put(`/api/v1/curve-factors/${curve}`, factorData);
    return response.data;
}

export async function deleteCurveFactor(curve) {
    const response = await pricingClient.delete(`/api/v1/curve-factors/${curve}`);
    return response.data;
}

// ============================================================================
// STOCK LEVEL FACTORS
// ============================================================================

export async function listStockLevelFactors(params = {}) {
    const response = await pricingClient.get('/api/v1/stock-level-factors', { params });
    return response.data;
}

export async function createStockLevelFactor(factorData) {
    const response = await pricingClient.post('/api/v1/stock-level-factors', factorData);
    return response.data;
}

export async function updateStockLevelFactor(level, factorData) {
    const response = await pricingClient.put(`/api/v1/stock-level-factors/${level}`, factorData);
    return response.data;
}

export async function deleteStockLevelFactor(level) {
    const response = await pricingClient.delete(`/api/v1/stock-level-factors/${level}`);
    return response.data;
}

// ============================================================================
// QUANTITY DISCOUNTS (D4Q)
// ============================================================================

export async function listQuantityDiscounts(params = {}) {
    const response = await pricingClient.get('/api/v1/quantity-discounts', { params });
    return response.data;
}

export async function getQuantityDiscountById(discountId) {
    const response = await pricingClient.get(`/api/v1/quantity-discounts/${discountId}`);
    return response.data;
}

export async function createQuantityDiscount(discountData) {
    const response = await pricingClient.post('/api/v1/quantity-discounts', discountData);
    return response.data;
}

export async function updateQuantityDiscount(discountId, discountData) {
    const response = await pricingClient.put(`/api/v1/quantity-discounts/${discountId}`, discountData);
    return response.data;
}

export async function deleteQuantityDiscount(discountId) {
    const response = await pricingClient.delete(`/api/v1/quantity-discounts/${discountId}`);
    return response.data;
}

// ============================================================================
// BUNDLES (Combos)
// ============================================================================

export async function listBundles(params = {}) {
    const response = await pricingClient.get('/api/v1/bundles', { params });
    return response.data;
}

export async function getBundleById(bundleId) {
    const response = await pricingClient.get(`/api/v1/bundles/${bundleId}`);
    return response.data;
}

export async function createBundle(bundleData) {
    const response = await pricingClient.post('/api/v1/bundles', bundleData);
    return response.data;
}

export async function updateBundle(bundleId, bundleData) {
    const response = await pricingClient.put(`/api/v1/bundles/${bundleId}`, bundleData);
    return response.data;
}

export async function deleteBundle(bundleId) {
    const response = await pricingClient.delete(`/api/v1/bundles/${bundleId}`);
    return response.data;
}

export async function manageBundleItems(bundleId, itemsData) {
    const response = await pricingClient.put(`/api/v1/bundles/${bundleId}/items`, itemsData);
    return response.data;
}

// ============================================================================
// FIXED PRICES (Preços Fixos)
// ============================================================================

export async function listFixedPrices(params = {}) {
    const response = await pricingClient.get('/api/v1/fixed-prices', { params });
    return response.data;
}

export async function getFixedPriceById(fixedPriceId) {
    const response = await pricingClient.get(`/api/v1/fixed-prices/${fixedPriceId}`);
    return response.data;
}

export async function createFixedPrice(fixedPriceData) {
    const response = await pricingClient.post('/api/v1/fixed-prices', fixedPriceData);
    return response.data;
}

export async function updateFixedPrice(fixedPriceId, fixedPriceData) {
    const response = await pricingClient.put(`/api/v1/fixed-prices/${fixedPriceId}`, fixedPriceData);
    return response.data;
}

export async function deleteFixedPrice(fixedPriceId) {
    const response = await pricingClient.delete(`/api/v1/fixed-prices/${fixedPriceId}`);
    return response.data;
}

export async function batchCreateFixedPrices(batchData) {
    const response = await pricingClient.post('/api/v1/fixed-prices/batch', batchData);
    return response.data;
}

// ============================================================================
// PROMOTIONS (Promoções por Segmento)
// ============================================================================

export async function listPromotionsBySegment(segmentId, params = {}) {
    const response = await pricingClient.get(`/api/v1/promotions/segment/${segmentId}`, { params });
    return response.data;
}

export async function getPromotionById(promotionId) {
    const response = await pricingClient.get(`/api/v1/promotions/${promotionId}`);
    return response.data;
}

export async function createPromotion(promotionData) {
    const response = await pricingClient.post('/api/v1/promotions', promotionData);
    return response.data;
}

export async function updatePromotion(promotionId, promotionData) {
    const response = await pricingClient.put(`/api/v1/promotions/${promotionId}`, promotionData);
    return response.data;
}

export async function deletePromotion(promotionId) {
    const response = await pricingClient.delete(`/api/v1/promotions/${promotionId}`);
    return response.data;
}

// ============================================================================
// ENGINE / TEST (Ferramentas de Diagnóstico)
// ============================================================================

export async function testPricing(testData) {
    const response = await pricingClient.post('/api/v1/engine/test', testData);
    return response.data;
}

export async function batchTestPricing(batchData) {
    const response = await pricingClient.post('/api/v1/engine/batch-test', batchData);
    return response.data;
}

// ============================================================================
// SEARCH (Busca de Produtos/Clientes)
// ============================================================================

export async function searchProducts(query, params = {}) {
    const response = await pricingClient.get('/api/v1/search/products', {
        params: { q: query, ...params }
    });
    return response.data;
}

export async function searchCustomers(query, params = {}) {
    const response = await pricingClient.get('/api/v1/search/customers', {
        params: { q: query, ...params }
    });
    return response.data;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck() {
    try {
        const response = await pricingClient.get('/health');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export default {
    // Brands
    listBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    // Customer Brand Profiles
    listCustomerBrandProfiles,
    getCustomerBrandProfile,
    createCustomerBrandProfile,
    updateCustomerBrandProfile,
    deleteCustomerBrandProfile,
    // Volume Tiers
    listVolumeTiers,
    createVolumeTier,
    updateVolumeTier,
    deleteVolumeTier,
    // Brand Role Tiers
    listBrandRoleTiers,
    createBrandRoleTier,
    updateBrandRoleTier,
    deleteBrandRoleTier,
    // Curve Factors
    listCurveFactors,
    createCurveFactor,
    updateCurveFactor,
    deleteCurveFactor,
    // Stock Level Factors
    listStockLevelFactors,
    createStockLevelFactor,
    updateStockLevelFactor,
    deleteStockLevelFactor,
    // Quantity Discounts
    listQuantityDiscounts,
    getQuantityDiscountById,
    createQuantityDiscount,
    updateQuantityDiscount,
    deleteQuantityDiscount,
    // Bundles
    listBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    manageBundleItems,
    // Fixed Prices
    listFixedPrices,
    getFixedPriceById,
    createFixedPrice,
    updateFixedPrice,
    deleteFixedPrice,
    batchCreateFixedPrices,
    // Promotions
    listPromotionsBySegment,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    // Engine/Test
    testPricing,
    batchTestPricing,
    // Search
    searchProducts,
    searchCustomers,
    // Health
    healthCheck
};
