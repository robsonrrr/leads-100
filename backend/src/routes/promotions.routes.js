import express from 'express';
import { getActivePromotions } from '../controllers/promotions.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/promotions/active
 * @desc Busca todas as promoções ativas
 * @access Private
 */
router.get('/active', authenticateToken, getActivePromotions);

export default router;
