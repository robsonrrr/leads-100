/**
 * WhatsApp Send Routes
 * 
 * Rotas para envio de mensagens via WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import WhatsAppSendController from '../controllers/whatsapp-send.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter específico para envio de mensagens
const sendMessageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 mensagens por minuto
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de envio atingido. Aguarde 1 minuto.'
        }
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para envio de mídia (mais restritivo)
const sendMediaLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 mídias por minuto
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de envio de mídia atingido. Aguarde 1 minuto.'
        }
    },
    keyGenerator: (req) => req.user?.id || req.ip
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route POST /api/whatsapp/send
 * @desc Envia uma mensagem de texto
 * @access Private
 */
router.post('/send', sendMessageLimiter, WhatsAppSendController.sendMessage);

/**
 * @route POST /api/whatsapp/send/media
 * @desc Envia uma mensagem com mídia
 * @access Private
 */
router.post('/send/media', sendMediaLimiter, WhatsAppSendController.sendMedia);

/**
 * @route GET /api/whatsapp/sessions
 * @desc Lista sessões disponíveis para o usuário
 * @access Private
 */
router.get('/sessions', WhatsAppSendController.getSessions);

/**
 * @route GET /api/whatsapp/sessions/:sessionId/status
 * @desc Obtém status de uma sessão específica
 * @access Private
 */
router.get('/sessions/:sessionId/status', WhatsAppSendController.getSessionStatus);

/**
 * @route GET /api/whatsapp/check-number/:phone
 * @desc Verifica se um número está no WhatsApp
 * @access Private
 */
router.get('/check-number/:phone', WhatsAppSendController.checkNumber);

/**
 * @route GET /api/whatsapp/sent-messages
 * @desc Lista mensagens enviadas pelo usuário
 * @access Private
 */
router.get('/sent-messages', WhatsAppSendController.getSentMessages);

export default router;
