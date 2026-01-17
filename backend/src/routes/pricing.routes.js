import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import * as pricingController from '../controllers/pricing.controller.js';

const router = express.Router();

/**
 * @swagger
 * /pricing/calculate:
 *   post:
 *     summary: Calcula preço usando o serviço de pricing
 *     description: |
 *       Envia dados do produto e cliente para a API externa de pricing
 *       e retorna o preço calculado com desconto permitido.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PricingRequest'
 *     responses:
 *       200:
 *         description: Preço calculado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingResponse'
 *       400:
 *         description: Erro de validação dos parâmetros
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Serviço de pricing indisponível
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Pricing API unavailable
 */
router.post('/calculate', authenticateToken, pricingController.calculatePrice);

// Rotas de leitura - optionalAuth para acesso do frontend
router.get('/quantity-discounts', optionalAuth, pricingController.listQuantityDiscounts);
router.get('/launch-products', optionalAuth, pricingController.listLaunchProducts);
router.get('/customer-fixed-prices/:customerId', optionalAuth, pricingController.listCustomerFixedPrices);
router.get('/bundles', optionalAuth, pricingController.listBundles);

export default router;

