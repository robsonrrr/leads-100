/**
 * Pricing Admin Service
 * 
 * Serviço para comunicação com as APIs administrativas do Pricing Agent
 */

const API_BASE = '/api/pricing-admin';

// Helper para fazer requisições com tratamento de erro
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Erro na requisição');
    }

    return data;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkHealth() {
    return apiRequest('/health');
}

// ============================================================================
// BRANDS
// ============================================================================

export async function listBrands(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/brands${queryString ? `?${queryString}` : ''}`);
}

export async function getBrand(id) {
    return apiRequest(`/brands/${id}`);
}

export async function createBrand(brandData) {
    return apiRequest('/brands', {
        method: 'POST',
        body: JSON.stringify(brandData),
    });
}

export async function updateBrand(id, brandData) {
    return apiRequest(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify(brandData),
    });
}

export async function deleteBrand(id, hardDelete = false) {
    return apiRequest(`/brands/${id}?hard_delete=${hardDelete}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// CUSTOMER BRAND PROFILES
// ============================================================================

export async function listCustomerBrandProfiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/customer-brand-profiles${queryString ? `?${queryString}` : ''}`);
}

export async function getCustomerBrandProfile(orgId, customerId, brandId) {
    return apiRequest(`/customer-brand-profiles/${orgId}/${customerId}/${brandId}`);
}

export async function createCustomerBrandProfile(profileData) {
    return apiRequest('/customer-brand-profiles', {
        method: 'POST',
        body: JSON.stringify(profileData),
    });
}

export async function updateCustomerBrandProfile(orgId, customerId, brandId, profileData) {
    return apiRequest(`/customer-brand-profiles/${orgId}/${customerId}/${brandId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
}

export async function deleteCustomerBrandProfile(orgId, customerId, brandId, hardDelete = false) {
    return apiRequest(`/customer-brand-profiles/${orgId}/${customerId}/${brandId}?hard_delete=${hardDelete}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// VOLUME TIERS
// ============================================================================

export async function listVolumeTiers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/volume-tiers${queryString ? `?${queryString}` : ''}`);
}

export async function createVolumeTier(tierData) {
    return apiRequest('/volume-tiers', {
        method: 'POST',
        body: JSON.stringify(tierData),
    });
}

export async function updateVolumeTier(id, tierData) {
    return apiRequest(`/volume-tiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tierData),
    });
}

export async function deleteVolumeTier(id) {
    return apiRequest(`/volume-tiers/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// BRAND ROLE TIERS
// ============================================================================

export async function listBrandRoleTiers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/brand-role-tiers${queryString ? `?${queryString}` : ''}`);
}

export async function createBrandRoleTier(tierData) {
    return apiRequest('/brand-role-tiers', {
        method: 'POST',
        body: JSON.stringify(tierData),
    });
}

export async function updateBrandRoleTier(id, tierData) {
    return apiRequest(`/brand-role-tiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tierData),
    });
}

export async function deleteBrandRoleTier(id) {
    return apiRequest(`/brand-role-tiers/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// CURVE FACTORS
// ============================================================================

export async function listCurveFactors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/curve-factors${queryString ? `?${queryString}` : ''}`);
}

export async function createCurveFactor(factorData) {
    return apiRequest('/curve-factors', {
        method: 'POST',
        body: JSON.stringify(factorData),
    });
}

export async function updateCurveFactor(curve, factorData) {
    return apiRequest(`/curve-factors/${curve}`, {
        method: 'PUT',
        body: JSON.stringify(factorData),
    });
}

export async function deleteCurveFactor(curve) {
    return apiRequest(`/curve-factors/${curve}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// STOCK LEVEL FACTORS
// ============================================================================

export async function listStockLevelFactors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/stock-level-factors${queryString ? `?${queryString}` : ''}`);
}

export async function createStockLevelFactor(factorData) {
    return apiRequest('/stock-level-factors', {
        method: 'POST',
        body: JSON.stringify(factorData),
    });
}

export async function updateStockLevelFactor(level, factorData) {
    return apiRequest(`/stock-level-factors/${level}`, {
        method: 'PUT',
        body: JSON.stringify(factorData),
    });
}

export async function deleteStockLevelFactor(level) {
    return apiRequest(`/stock-level-factors/${level}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// QUANTITY DISCOUNTS (D4Q)
// ============================================================================

export async function listQuantityDiscounts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/quantity-discounts${queryString ? `?${queryString}` : ''}`);
}

export async function getQuantityDiscount(id) {
    return apiRequest(`/quantity-discounts/${id}`);
}

export async function createQuantityDiscount(discountData) {
    return apiRequest('/quantity-discounts', {
        method: 'POST',
        body: JSON.stringify(discountData),
    });
}

export async function updateQuantityDiscount(id, discountData) {
    return apiRequest(`/quantity-discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(discountData),
    });
}

export async function deleteQuantityDiscount(id) {
    return apiRequest(`/quantity-discounts/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// BUNDLES
// ============================================================================

export async function listBundles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/bundles${queryString ? `?${queryString}` : ''}`);
}

export async function getBundle(id) {
    return apiRequest(`/bundles/${id}`);
}

export async function createBundle(bundleData) {
    return apiRequest('/bundles', {
        method: 'POST',
        body: JSON.stringify(bundleData),
    });
}

export async function updateBundle(id, bundleData) {
    return apiRequest(`/bundles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bundleData),
    });
}

export async function deleteBundle(id) {
    return apiRequest(`/bundles/${id}`, {
        method: 'DELETE',
    });
}

export async function manageBundleItems(id, itemsData) {
    return apiRequest(`/bundles/${id}/items`, {
        method: 'PUT',
        body: JSON.stringify(itemsData),
    });
}

// ============================================================================
// FIXED PRICES
// ============================================================================

export async function listFixedPrices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/fixed-prices${queryString ? `?${queryString}` : ''}`);
}

export async function getFixedPrice(id) {
    return apiRequest(`/fixed-prices/${id}`);
}

export async function createFixedPrice(fixedPriceData) {
    return apiRequest('/fixed-prices', {
        method: 'POST',
        body: JSON.stringify(fixedPriceData),
    });
}

export async function updateFixedPrice(id, fixedPriceData) {
    return apiRequest(`/fixed-prices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fixedPriceData),
    });
}

export async function deleteFixedPrice(id) {
    return apiRequest(`/fixed-prices/${id}`, {
        method: 'DELETE',
    });
}

export async function batchCreateFixedPrices(batchData) {
    return apiRequest('/fixed-prices/batch', {
        method: 'POST',
        body: JSON.stringify(batchData),
    });
}

// ============================================================================
// PROMOTIONS
// ============================================================================

export async function listPromotionsBySegment(segmentId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/promotions/segment/${segmentId}${queryString ? `?${queryString}` : ''}`);
}

export async function getPromotion(id) {
    return apiRequest(`/promotions/${id}`);
}

export async function createPromotion(promotionData) {
    return apiRequest('/promotions', {
        method: 'POST',
        body: JSON.stringify(promotionData),
    });
}

export async function updatePromotion(id, promotionData) {
    return apiRequest(`/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(promotionData),
    });
}

export async function deletePromotion(id) {
    return apiRequest(`/promotions/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// ENGINE / TEST
// ============================================================================

export async function testPricing(testData) {
    return apiRequest('/engine/test', {
        method: 'POST',
        body: JSON.stringify(testData),
    });
}

export async function batchTestPricing(batchData) {
    return apiRequest('/engine/batch-test', {
        method: 'POST',
        body: JSON.stringify(batchData),
    });
}

// ============================================================================
// SEARCH
// ============================================================================

export async function searchProducts(query, params = {}) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return apiRequest(`/search/products?${searchParams.toString()}`);
}

export async function searchCustomers(query, params = {}) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return apiRequest(`/search/customers?${searchParams.toString()}`);
}

// Export all functions as default object
export default {
    checkHealth,
    // Brands
    listBrands,
    getBrand,
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
    getQuantityDiscount,
    createQuantityDiscount,
    updateQuantityDiscount,
    deleteQuantityDiscount,
    // Bundles
    listBundles,
    getBundle,
    createBundle,
    updateBundle,
    deleteBundle,
    manageBundleItems,
    // Fixed Prices
    listFixedPrices,
    getFixedPrice,
    createFixedPrice,
    updateFixedPrice,
    deleteFixedPrice,
    batchCreateFixedPrices,
    // Promotions
    listPromotionsBySegment,
    getPromotion,
    createPromotion,
    updatePromotion,
    deletePromotion,
    // Engine/Test
    testPricing,
    batchTestPricing,
    // Search
    searchProducts,
    searchCustomers,
};
