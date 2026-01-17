import express from 'express';
import * as pricingController from '../controllers/pricing.v2.controller.js';

const router = express.Router();

/**
 * @api {post} /api/v2/pricing/calculate Calcular Preço
 */
router.post('/calculate', pricingController.calculatePrice);

/**
 * @api {post} /api/v2/pricing/discount Aplicar Desconto
 */
router.post('/discount', pricingController.applyDiscount);

/**
 * @api {post} /api/v2/pricing/simulate Simular Preço
 */
router.post('/simulate', pricingController.simulatePrice);

/**
 * @api {post} /api/v2/pricing/freeze Congelar Preço (Price Freeze)
 */
router.post('/freeze', pricingController.freezePrice);

/**
 * @api {post} /api/v2/pricing/exception/request Solicitar Exceção
 */
router.post('/exception/request', pricingController.requestException);

/**
 * @api {post} /api/v2/pricing/exception/:id/decide Aprovar/Rejeitar Exceção
 */
router.post('/exception/:id/decide', pricingController.decideException);

/**
 * @api {get} /api/v2/pricing/metrics Obter Métricas
 */
router.get('/metrics', pricingController.getMetrics);

export default router;
