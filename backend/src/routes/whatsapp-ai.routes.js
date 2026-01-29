/**
 * WhatsApp AI Routes
 * 
 * Rotas para endpoints de IA do WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import WhatsAppAIController from '../controllers/whatsapp-ai.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter para endpoints de IA (mais restritivo devido ao custo)
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 requisições por minuto
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de requisições de IA atingido. Aguarde 1 minuto.'
        }
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    standardHeaders: true,
    legacyHeaders: false
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route GET /api/whatsapp/ai/intents
 * @desc Lista tipos de intenção disponíveis para sugestões
 * @access Private
 */
router.get('/intents', WhatsAppAIController.getIntents);

/**
 * @route POST /api/whatsapp/ai/suggest
 * @desc Gera sugestões de mensagens usando IA
 * @access Private
 */
router.post('/suggest', aiRateLimiter, WhatsAppAIController.getSuggestions);

/**
 * @route POST /api/whatsapp/ai/compose
 * @desc Compõe uma mensagem completa usando IA
 * @access Private
 */
router.post('/compose', aiRateLimiter, WhatsAppAIController.composeMessage);

export default router;
