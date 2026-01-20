/**
 * Pricing Admin Routes
 * 
 * Rotas administrativas para gerenciamento do Pricing Agent
 * Todas as rotas requerem autenticação e nível de acesso >= 5 (Admin)
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as pricingAdminController from '../controllers/pricing-admin.controller.js';

const router = express.Router();

// Middleware para verificar nível de acesso admin (level >= 5)
const requireAdmin = (req, res, next) => {
    const userLevel = req.user?.level || req.user?.nivel || 0;
    if (userLevel < 5) {
        return res.status(403).json({
            success: false,
            error: { message: 'Acesso negado. Nível de administrador requerido.' }
        });
    }
    next();
};

// Aplicar autenticação e verificação de admin em todas as rotas
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * @swagger
 * /pricing-admin/health:
 *   get:
 *     summary: Verifica status da API do Pricing Agent
 *     tags: [Pricing Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da conexão com o Pricing Agent
 */
router.get('/health', pricingAdminController.healthCheck);

// ============================================================================
// BRANDS
// ============================================================================

/**
 * @swagger
 * /pricing-admin/brands:
 *   get:
 *     summary: Lista todas as marcas
 *     tags: [Pricing Admin - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Número de registros a pular
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros
 *       - in: query
 *         name: brand_role
 *         schema:
 *           type: string
 *         description: Filtrar por papel da marca
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou ID
 *     responses:
 *       200:
 *         description: Lista de marcas
 */
router.get('/brands', pricingAdminController.listBrands);

/**
 * @swagger
 * /pricing-admin/brands/{id}:
 *   get:
 *     summary: Obtém uma marca por ID
 *     tags: [Pricing Admin - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes da marca
 */
router.get('/brands/:id', pricingAdminController.getBrand);

/**
 * @swagger
 * /pricing-admin/brands:
 *   post:
 *     summary: Cria uma nova marca
 *     tags: [Pricing Admin - Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand_id
 *               - brand_name
 *               - brand_role
 *               - supplier_term_profile
 *             properties:
 *               brand_id:
 *                 type: integer
 *               brand_name:
 *                 type: string
 *               brand_role:
 *                 type: string
 *                 enum: [principal, secondary_target, tertiary_flexible]
 *               supplier_term_profile:
 *                 type: string
 *                 enum: [short, medium, long]
 *               anchor_ref_pct:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Marca criada
 */
router.post('/brands', pricingAdminController.createBrand);

/**
 * @swagger
 * /pricing-admin/brands/{id}:
 *   put:
 *     summary: Atualiza uma marca
 *     tags: [Pricing Admin - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marca atualizada
 */
router.put('/brands/:id', pricingAdminController.updateBrand);

/**
 * @swagger
 * /pricing-admin/brands/{id}:
 *   delete:
 *     summary: Remove uma marca
 *     tags: [Pricing Admin - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: hard_delete
 *         schema:
 *           type: boolean
 *         description: Se true, remove fisicamente
 *     responses:
 *       200:
 *         description: Marca removida
 */
router.delete('/brands/:id', pricingAdminController.deleteBrand);

// ============================================================================
// CUSTOMER BRAND PROFILES
// ============================================================================

router.get('/customer-brand-profiles', pricingAdminController.listCustomerBrandProfiles);
router.get('/customer-brand-profiles/:orgId/:customerId/:brandId', pricingAdminController.getCustomerBrandProfile);
router.post('/customer-brand-profiles', pricingAdminController.createCustomerBrandProfile);
router.put('/customer-brand-profiles/:orgId/:customerId/:brandId', pricingAdminController.updateCustomerBrandProfile);
router.delete('/customer-brand-profiles/:orgId/:customerId/:brandId', pricingAdminController.deleteCustomerBrandProfile);

// ============================================================================
// VOLUME TIERS
// ============================================================================

router.get('/volume-tiers', pricingAdminController.listVolumeTiers);
router.post('/volume-tiers', pricingAdminController.createVolumeTier);
router.put('/volume-tiers/:id', pricingAdminController.updateVolumeTier);
router.delete('/volume-tiers/:id', pricingAdminController.deleteVolumeTier);

// ============================================================================
// BRAND ROLE TIERS
// ============================================================================

router.get('/brand-role-tiers', pricingAdminController.listBrandRoleTiers);
router.post('/brand-role-tiers', pricingAdminController.createBrandRoleTier);
router.put('/brand-role-tiers/:id', pricingAdminController.updateBrandRoleTier);
router.delete('/brand-role-tiers/:id', pricingAdminController.deleteBrandRoleTier);

// ============================================================================
// CURVE FACTORS
// ============================================================================

router.get('/curve-factors', pricingAdminController.listCurveFactors);
router.post('/curve-factors', pricingAdminController.createCurveFactor);
router.put('/curve-factors/:curve', pricingAdminController.updateCurveFactor);
router.delete('/curve-factors/:curve', pricingAdminController.deleteCurveFactor);

// ============================================================================
// STOCK LEVEL FACTORS
// ============================================================================

router.get('/stock-level-factors', pricingAdminController.listStockLevelFactors);
router.post('/stock-level-factors', pricingAdminController.createStockLevelFactor);
router.put('/stock-level-factors/:level', pricingAdminController.updateStockLevelFactor);
router.delete('/stock-level-factors/:level', pricingAdminController.deleteStockLevelFactor);

// ============================================================================
// QUANTITY DISCOUNTS (D4Q)
// ============================================================================

router.get('/quantity-discounts', pricingAdminController.listQuantityDiscounts);
router.get('/quantity-discounts/:id', pricingAdminController.getQuantityDiscount);
router.post('/quantity-discounts', pricingAdminController.createQuantityDiscount);
router.put('/quantity-discounts/:id', pricingAdminController.updateQuantityDiscount);
router.delete('/quantity-discounts/:id', pricingAdminController.deleteQuantityDiscount);

// ============================================================================
// BUNDLES
// ============================================================================

router.get('/bundles', pricingAdminController.listBundles);
router.get('/bundles/:id', pricingAdminController.getBundle);
router.post('/bundles', pricingAdminController.createBundle);
router.put('/bundles/:id', pricingAdminController.updateBundle);
router.delete('/bundles/:id', pricingAdminController.deleteBundle);
router.put('/bundles/:id/items', pricingAdminController.manageBundleItems);

// ============================================================================
// FIXED PRICES
// ============================================================================

router.get('/fixed-prices', pricingAdminController.listFixedPrices);
router.get('/fixed-prices/:id', pricingAdminController.getFixedPrice);
router.post('/fixed-prices', pricingAdminController.createFixedPrice);
router.put('/fixed-prices/:id', pricingAdminController.updateFixedPrice);
router.delete('/fixed-prices/:id', pricingAdminController.deleteFixedPrice);
router.post('/fixed-prices/batch', pricingAdminController.batchCreateFixedPrices);

// ============================================================================
// PROMOTIONS
// ============================================================================

router.get('/promotions/segment/:segmentId', pricingAdminController.listPromotionsBySegment);
router.get('/promotions/:id', pricingAdminController.getPromotion);
router.post('/promotions', pricingAdminController.createPromotion);
router.put('/promotions/:id', pricingAdminController.updatePromotion);
router.delete('/promotions/:id', pricingAdminController.deletePromotion);

// ============================================================================
// ENGINE / TEST
// ============================================================================

router.post('/engine/test', pricingAdminController.testPricing);
router.post('/engine/batch-test', pricingAdminController.batchTestPricing);

// ============================================================================
// SEARCH
// ============================================================================

router.get('/search/products', pricingAdminController.searchProducts);
router.get('/search/customers', pricingAdminController.searchCustomers);

export default router;
