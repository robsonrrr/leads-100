import express from 'express';
import { getActivePromotions } from '../controllers/promotions.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/promotions/active
 * @desc Busca todas as promoções ativas
 * @access Public (com optionalAuth para contexto)
 */
router.get('/active', optionalAuth, getActivePromotions);

export default router;

