import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as pricingController from '../controllers/pricing.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

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
router.post('/calculate', pricingController.calculatePrice);

router.get('/quantity-discounts', pricingController.listQuantityDiscounts);

router.get('/launch-products', pricingController.listLaunchProducts);

export default router;
