/**
 * CSuite Offers Agent Routes
 * 
 * API routes for building and managing commercial offers
 * via the CSuite Offers Agent integration.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as offersService from '../services/offers.service.js';

const router = express.Router();

/**
 * @route POST /api/offers/build
 * @desc Build an offer for a customer
 * @access Protected
 */
router.post('/build', authenticateToken, async (req, res) => {
    try {
        const {
            segment,
            customerId,
            sellerId,
            goalCode,
            constraints,
            context
        } = req.body;

        // Validation
        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: 'customerId is required'
            });
        }

        // Use seller from auth if not provided
        const effectiveSellerId = sellerId || req.user?.sellerId || req.user?.id;

        const authToken = req.headers.authorization?.replace('Bearer ', '');

        const result = await offersService.buildOffer({
            segment: segment || 'machines',
            customerId: parseInt(customerId),
            sellerId: parseInt(effectiveSellerId),
            goalCode: goalCode || 'geral',
            constraints: constraints || {},
            context: {
                ...context,
                leadId: req.body.leadId || null,
                userId: req.user?.id
            }
        }, authToken);

        if (!result.success) {
            return res.status(result.statusCode || 400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error building offer:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * @route GET /api/offers/config
 * @desc Get available segments and goals
 * @access Protected
 */
router.get('/config', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            segments: [
                { code: 'machines', label: 'Máquinas', icon: '🔧' },
                { code: 'parts', label: 'Peças', icon: '⚙️' },
                { code: 'bearings', label: 'Rolamentos', icon: '🔩' },
                { code: 'autoparts', label: 'Autopeças', icon: '🚗' },
                { code: 'motoparts', label: 'Motopeças', icon: '🏍️' }
            ],
            goals: [
                { code: 'giro', label: 'Alto Giro', description: 'Produtos com alta velocidade de venda', icon: '🔄' },
                { code: 'ruptura', label: 'Ruptura', description: 'Itens que o cliente costuma comprar', icon: '📦' },
                { code: 'mix', label: 'Mix', description: 'Aumentar penetração de categorias', icon: '🎯' },
                { code: 'margem', label: 'Margem', description: 'Produtos com maior margem', icon: '💰' },
                { code: 'campanha', label: 'Campanha', description: 'Itens em promoção', icon: '🏷️' },
                { code: 'geral', label: 'Geral', description: 'Mix de estratégias', icon: '📊' }
            ]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/offers/health
 * @desc Health check for Offers Agent connection
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const result = await offersService.healthCheck();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

/**
 * @route GET /api/offers/today
 * @desc Get today's offers
 * @access Protected
 */
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        const result = await offersService.getTodayOffers(authToken);
        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error getting today offers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            offers: [],
            total: 0
        });
    }
});

/**
 * @route GET /api/offers/customer/:customerId
 * @desc Get offers for a customer
 * @access Protected
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit } = req.query;
        const authToken = req.headers.authorization?.replace('Bearer ', '');

        const result = await offersService.getCustomerOffers(
            parseInt(customerId),
            parseInt(limit) || 10,
            authToken
        );

        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error getting customer offers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            offers: [],
            total: 0
        });
    }
});

/**
 * @route POST /api/offers/:offerId/price
 * @desc Calculate prices for an offer
 * @access Protected
 */
router.post('/:offerId/price', authenticateToken, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { paymentTerm, installments } = req.body;
        const authToken = req.headers.authorization?.replace('Bearer ', '');

        const result = await offersService.priceOffer(offerId, {
            paymentTerm,
            installments
        }, authToken);

        if (!result.success) {
            return res.status(result.statusCode || 400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error pricing offer:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @route POST /api/offers/:offerId/credit
 * @desc Evaluate credit for an offer
 * @access Protected
 */
router.post('/:offerId/credit', authenticateToken, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { paymentTermsDays, installments } = req.body;
        const authToken = req.headers.authorization?.replace('Bearer ', '');

        const result = await offersService.evaluateCredit(offerId, {
            paymentTermsDays,
            installments
        }, authToken);

        if (!result.success) {
            return res.status(result.statusCode || 400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error evaluating credit:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/offers/:offerId
 * @desc Get offer by ID
 * @access Protected
 */
router.get('/:offerId', authenticateToken, async (req, res) => {
    try {
        const { offerId } = req.params;
        const authToken = req.headers.authorization?.replace('Bearer ', '');

        const result = await offersService.getOffer(offerId, authToken);

        if (!result.success) {
            return res.status(result.statusCode || 404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('[OffersRoutes] Error getting offer:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
