/**
 * Pricing Admin Controller
 * 
 * Controller para gerenciamento administrativo do Pricing Agent
 * Expõe endpoints proxy para as operações CRUD do sistema de precificação
 */

import * as pricingApiService from '../services/pricing-api.service.js';
import logger from '../config/logger.js';
import { auditLog } from '../services/auditLog.service.js';

// ============================================================================
// HELPER: Tratamento de erros padrão
// ============================================================================

function handleError(res, error, operation) {
    logger.error(`Pricing Admin Error: ${operation}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
    });

    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message || 'Erro interno do servidor';

    res.status(status).json({
        success: false,
        error: { message, operation }
    });
}

// ============================================================================
// BRANDS
// ============================================================================

export async function listBrands(req, res) {
    try {
        const result = await pricingApiService.listBrands(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listBrands');
    }
}

export async function getBrand(req, res) {
    try {
        const result = await pricingApiService.getBrandById(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getBrand');
    }
}

export async function createBrand(req, res) {
    try {
        const result = await pricingApiService.createBrand(req.body);
        await auditLog('pricing_admin', 'create_brand', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createBrand');
    }
}

export async function updateBrand(req, res) {
    try {
        const result = await pricingApiService.updateBrand(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_brand', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateBrand');
    }
}

export async function deleteBrand(req, res) {
    try {
        const hardDelete = req.query.hard_delete === 'true';
        const result = await pricingApiService.deleteBrand(req.params.id, hardDelete);
        await auditLog('pricing_admin', 'delete_brand', { id: req.params.id, hardDelete }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteBrand');
    }
}

// ============================================================================
// CUSTOMER BRAND PROFILES
// ============================================================================

export async function listCustomerBrandProfiles(req, res) {
    try {
        const result = await pricingApiService.listCustomerBrandProfiles(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listCustomerBrandProfiles');
    }
}

export async function getCustomerBrandProfile(req, res) {
    try {
        const { orgId, customerId, brandId } = req.params;
        const result = await pricingApiService.getCustomerBrandProfile(orgId, customerId, brandId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getCustomerBrandProfile');
    }
}

export async function createCustomerBrandProfile(req, res) {
    try {
        const result = await pricingApiService.createCustomerBrandProfile(req.body);
        await auditLog('pricing_admin', 'create_customer_brand_profile', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createCustomerBrandProfile');
    }
}

export async function updateCustomerBrandProfile(req, res) {
    try {
        const { orgId, customerId, brandId } = req.params;
        const result = await pricingApiService.updateCustomerBrandProfile(orgId, customerId, brandId, req.body);
        await auditLog('pricing_admin', 'update_customer_brand_profile', { orgId, customerId, brandId, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateCustomerBrandProfile');
    }
}

export async function deleteCustomerBrandProfile(req, res) {
    try {
        const { orgId, customerId, brandId } = req.params;
        const hardDelete = req.query.hard_delete === 'true';
        const result = await pricingApiService.deleteCustomerBrandProfile(orgId, customerId, brandId, hardDelete);
        await auditLog('pricing_admin', 'delete_customer_brand_profile', { orgId, customerId, brandId, hardDelete }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteCustomerBrandProfile');
    }
}

// ============================================================================
// VOLUME TIERS
// ============================================================================

export async function listVolumeTiers(req, res) {
    try {
        const result = await pricingApiService.listVolumeTiers(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listVolumeTiers');
    }
}

export async function createVolumeTier(req, res) {
    try {
        const result = await pricingApiService.createVolumeTier(req.body);
        await auditLog('pricing_admin', 'create_volume_tier', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createVolumeTier');
    }
}

export async function updateVolumeTier(req, res) {
    try {
        const result = await pricingApiService.updateVolumeTier(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_volume_tier', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateVolumeTier');
    }
}

export async function deleteVolumeTier(req, res) {
    try {
        const result = await pricingApiService.deleteVolumeTier(req.params.id);
        await auditLog('pricing_admin', 'delete_volume_tier', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteVolumeTier');
    }
}

// ============================================================================
// BRAND ROLE TIERS
// ============================================================================

export async function listBrandRoleTiers(req, res) {
    try {
        const result = await pricingApiService.listBrandRoleTiers(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listBrandRoleTiers');
    }
}

export async function createBrandRoleTier(req, res) {
    try {
        const result = await pricingApiService.createBrandRoleTier(req.body);
        await auditLog('pricing_admin', 'create_brand_role_tier', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createBrandRoleTier');
    }
}

export async function updateBrandRoleTier(req, res) {
    try {
        const result = await pricingApiService.updateBrandRoleTier(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_brand_role_tier', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateBrandRoleTier');
    }
}

export async function deleteBrandRoleTier(req, res) {
    try {
        const result = await pricingApiService.deleteBrandRoleTier(req.params.id);
        await auditLog('pricing_admin', 'delete_brand_role_tier', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteBrandRoleTier');
    }
}

// ============================================================================
// CURVE FACTORS
// ============================================================================

export async function listCurveFactors(req, res) {
    try {
        const result = await pricingApiService.listCurveFactors(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listCurveFactors');
    }
}

export async function createCurveFactor(req, res) {
    try {
        const result = await pricingApiService.createCurveFactor(req.body);
        await auditLog('pricing_admin', 'create_curve_factor', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createCurveFactor');
    }
}

export async function updateCurveFactor(req, res) {
    try {
        const result = await pricingApiService.updateCurveFactor(req.params.curve, req.body);
        await auditLog('pricing_admin', 'update_curve_factor', { curve: req.params.curve, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateCurveFactor');
    }
}

export async function deleteCurveFactor(req, res) {
    try {
        const result = await pricingApiService.deleteCurveFactor(req.params.curve);
        await auditLog('pricing_admin', 'delete_curve_factor', { curve: req.params.curve }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteCurveFactor');
    }
}

// ============================================================================
// STOCK LEVEL FACTORS
// ============================================================================

export async function listStockLevelFactors(req, res) {
    try {
        const result = await pricingApiService.listStockLevelFactors(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listStockLevelFactors');
    }
}

export async function createStockLevelFactor(req, res) {
    try {
        const result = await pricingApiService.createStockLevelFactor(req.body);
        await auditLog('pricing_admin', 'create_stock_level_factor', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createStockLevelFactor');
    }
}

export async function updateStockLevelFactor(req, res) {
    try {
        const result = await pricingApiService.updateStockLevelFactor(req.params.level, req.body);
        await auditLog('pricing_admin', 'update_stock_level_factor', { level: req.params.level, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateStockLevelFactor');
    }
}

export async function deleteStockLevelFactor(req, res) {
    try {
        const result = await pricingApiService.deleteStockLevelFactor(req.params.level);
        await auditLog('pricing_admin', 'delete_stock_level_factor', { level: req.params.level }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteStockLevelFactor');
    }
}

// ============================================================================
// QUANTITY DISCOUNTS
// ============================================================================

export async function listQuantityDiscounts(req, res) {
    try {
        const result = await pricingApiService.listQuantityDiscounts(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listQuantityDiscounts');
    }
}

export async function getQuantityDiscount(req, res) {
    try {
        const result = await pricingApiService.getQuantityDiscountById(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getQuantityDiscount');
    }
}

export async function createQuantityDiscount(req, res) {
    try {
        const result = await pricingApiService.createQuantityDiscount(req.body);
        await auditLog('pricing_admin', 'create_quantity_discount', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createQuantityDiscount');
    }
}

export async function updateQuantityDiscount(req, res) {
    try {
        const result = await pricingApiService.updateQuantityDiscount(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_quantity_discount', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateQuantityDiscount');
    }
}

export async function deleteQuantityDiscount(req, res) {
    try {
        const result = await pricingApiService.deleteQuantityDiscount(req.params.id);
        await auditLog('pricing_admin', 'delete_quantity_discount', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteQuantityDiscount');
    }
}

// ============================================================================
// BUNDLES
// ============================================================================

export async function listBundles(req, res) {
    try {
        const result = await pricingApiService.listBundles(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listBundles');
    }
}

export async function getBundle(req, res) {
    try {
        const result = await pricingApiService.getBundleById(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getBundle');
    }
}

export async function createBundle(req, res) {
    try {
        const result = await pricingApiService.createBundle(req.body);
        await auditLog('pricing_admin', 'create_bundle', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createBundle');
    }
}

export async function updateBundle(req, res) {
    try {
        const result = await pricingApiService.updateBundle(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_bundle', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateBundle');
    }
}

export async function deleteBundle(req, res) {
    try {
        const result = await pricingApiService.deleteBundle(req.params.id);
        await auditLog('pricing_admin', 'delete_bundle', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteBundle');
    }
}

export async function manageBundleItems(req, res) {
    try {
        const result = await pricingApiService.manageBundleItems(req.params.id, req.body);
        await auditLog('pricing_admin', 'manage_bundle_items', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'manageBundleItems');
    }
}

// ============================================================================
// FIXED PRICES
// ============================================================================

export async function listFixedPrices(req, res) {
    try {
        const result = await pricingApiService.listFixedPrices(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listFixedPrices');
    }
}

export async function getFixedPrice(req, res) {
    try {
        const result = await pricingApiService.getFixedPriceById(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getFixedPrice');
    }
}

export async function createFixedPrice(req, res) {
    try {
        const result = await pricingApiService.createFixedPrice(req.body);
        await auditLog('pricing_admin', 'create_fixed_price', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createFixedPrice');
    }
}

export async function updateFixedPrice(req, res) {
    try {
        const result = await pricingApiService.updateFixedPrice(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_fixed_price', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updateFixedPrice');
    }
}

export async function deleteFixedPrice(req, res) {
    try {
        const result = await pricingApiService.deleteFixedPrice(req.params.id);
        await auditLog('pricing_admin', 'delete_fixed_price', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deleteFixedPrice');
    }
}

export async function batchCreateFixedPrices(req, res) {
    try {
        const result = await pricingApiService.batchCreateFixedPrices(req.body);
        await auditLog('pricing_admin', 'batch_create_fixed_prices', { count: req.body?.prices?.length || 0 }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'batchCreateFixedPrices');
    }
}

// ============================================================================
// PROMOTIONS
// ============================================================================

export async function listPromotionsBySegment(req, res) {
    try {
        const result = await pricingApiService.listPromotionsBySegment(req.params.segmentId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'listPromotionsBySegment');
    }
}

export async function getPromotion(req, res) {
    try {
        const result = await pricingApiService.getPromotionById(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'getPromotion');
    }
}

export async function createPromotion(req, res) {
    try {
        const result = await pricingApiService.createPromotion(req.body);
        await auditLog('pricing_admin', 'create_promotion', { data: req.body }, req.user?.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'createPromotion');
    }
}

export async function updatePromotion(req, res) {
    try {
        const result = await pricingApiService.updatePromotion(req.params.id, req.body);
        await auditLog('pricing_admin', 'update_promotion', { id: req.params.id, data: req.body }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'updatePromotion');
    }
}

export async function deletePromotion(req, res) {
    try {
        const result = await pricingApiService.deletePromotion(req.params.id);
        await auditLog('pricing_admin', 'delete_promotion', { id: req.params.id }, req.user?.id);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'deletePromotion');
    }
}

// ============================================================================
// ENGINE / TEST
// ============================================================================

export async function testPricing(req, res) {
    try {
        const result = await pricingApiService.testPricing(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'testPricing');
    }
}

export async function batchTestPricing(req, res) {
    try {
        const result = await pricingApiService.batchTestPricing(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'batchTestPricing');
    }
}

// ============================================================================
// SEARCH
// ============================================================================

export async function searchProducts(req, res) {
    try {
        const result = await pricingApiService.searchProducts(req.query.q, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'searchProducts');
    }
}

export async function searchCustomers(req, res) {
    try {
        const result = await pricingApiService.searchCustomers(req.query.q, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error, 'searchCustomers');
    }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck(req, res) {
    try {
        const result = await pricingApiService.healthCheck();
        res.json({
            success: true,
            data: {
                pricingApi: result.success ? 'healthy' : 'unhealthy',
                details: result
            }
        });
    } catch (error) {
        handleError(res, error, 'healthCheck');
    }
}
