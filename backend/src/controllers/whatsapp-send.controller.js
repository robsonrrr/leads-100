/**
 * WhatsApp Send Controller
 * 
 * Controller para envio de mensagens via WhatsApp
 * Integra com o serviço de API do WhatsApp Bot
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import { whatsAppBotAPIService } from '../services/whatsapp-bot-api.service.js';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * @swagger
 * tags:
 *   name: WhatsApp Send
 *   description: Envio de mensagens via WhatsApp
 */

export const WhatsAppSendController = {
    /**
     * @swagger
     * /api/whatsapp/send:
     *   post:
     *     tags: [WhatsApp Send]
     *     summary: Envia uma mensagem de texto via WhatsApp
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phone
     *               - message
     *             properties:
     *               phone:
     *                 type: string
     *                 description: Número de telefone (ex: 5511999999999)
     *               message:
     *                 type: string
     *                 description: Conteúdo da mensagem
     *               sessionId:
     *                 type: string
     *                 description: ID da sessão (opcional - usa sessão padrão do usuário)
     *               leadId:
     *                 type: integer
     *                 description: ID do lead para vincular (opcional)
     *               customerId:
     *                 type: integer
     *                 description: ID do cliente para vincular (opcional)
     *     responses:
     *       200:
     *         description: Mensagem enviada com sucesso
     *       400:
     *         description: Dados inválidos
     *       429:
     *         description: Rate limit excedido
     */
    async sendMessage(req, res) {
        try {
            const { phone, message, sessionId, leadId, customerId } = req.body;
            const userId = req.user.id;

            // Validações
            if (!phone) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PHONE', message: 'Número de telefone é obrigatório' }
                });
            }

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_MESSAGE', message: 'Mensagem é obrigatória' }
                });
            }

            if (message.length > 4096) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'MESSAGE_TOO_LONG', message: 'Mensagem excede 4096 caracteres' }
                });
            }

            // Validar formato do telefone
            if (!whatsAppBotAPIService.isValidPhone(phone)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PHONE_FORMAT', message: 'Formato de telefone inválido' }
                });
            }

            // Obter sessionId (do request ou padrão do usuário)
            const activeSessionId = sessionId || await WhatsAppSendController.getDefaultSessionForUser(userId);

            if (!activeSessionId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_SESSION', message: 'Nenhuma sessão WhatsApp disponível' }
                });
            }

            // Enviar mensagem
            const result = await whatsAppBotAPIService.sendMessage(activeSessionId, phone, message.trim());

            // Logar envio no banco de dados
            const logId = await WhatsAppSendController.logSentMessage({
                userId,
                sessionId: activeSessionId,
                phone,
                messageType: 'text',
                messageContent: message,
                leadId,
                customerId,
                status: 'sent',
                whatsappMessageId: result.messageId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            logger.info('WhatsApp message sent successfully', {
                userId,
                phone,
                sessionId: activeSessionId,
                messageId: result.messageId,
                logId
            });

            return res.json({
                success: true,
                data: {
                    ...result,
                    logId
                }
            });

        } catch (error) {
            logger.error('Failed to send WhatsApp message', {
                error: error.message,
                code: error.code,
                userId: req.user?.id,
                phone: req.body?.phone
            });

            // Se for erro da API do WhatsApp, retornar com status apropriado
            if (error.code?.startsWith('WHATSAPP_')) {
                return res.status(502).json({
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        details: error.details
                    }
                });
            }

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao enviar mensagem' }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/send/media:
     *   post:
     *     tags: [WhatsApp Send]
     *     summary: Envia uma mensagem com mídia via WhatsApp
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phone
     *               - mediaType
     *               - mediaUrl
     *             properties:
     *               phone:
     *                 type: string
     *               mediaType:
     *                 type: string
     *                 enum: [image, document, audio, video]
     *               mediaUrl:
     *                 type: string
     *               caption:
     *                 type: string
     *               filename:
     *                 type: string
     *               sessionId:
     *                 type: string
     *               leadId:
     *                 type: integer
     *     responses:
     *       200:
     *         description: Mídia enviada com sucesso
     */
    async sendMedia(req, res) {
        try {
            const { phone, mediaType, mediaUrl, caption, filename, sessionId, leadId, customerId } = req.body;
            const userId = req.user.id;

            // Validações
            if (!phone || !whatsAppBotAPIService.isValidPhone(phone)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PHONE', message: 'Número de telefone inválido' }
                });
            }

            if (!mediaType || !['image', 'document', 'audio', 'video'].includes(mediaType)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_MEDIA_TYPE', message: 'Tipo de mídia inválido' }
                });
            }

            if (!mediaUrl) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_MEDIA_URL', message: 'URL da mídia é obrigatória' }
                });
            }

            // Obter sessão
            const activeSessionId = sessionId || await WhatsAppSendController.getDefaultSessionForUser(userId);

            if (!activeSessionId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_SESSION', message: 'Nenhuma sessão WhatsApp disponível' }
                });
            }

            // Enviar mídia
            const result = await whatsAppBotAPIService.sendMedia(activeSessionId, phone, {
                type: mediaType,
                url: mediaUrl,
                caption: caption || '',
                filename: filename || null
            });

            // Logar envio
            const logId = await WhatsAppSendController.logSentMessage({
                userId,
                sessionId: activeSessionId,
                phone,
                messageType: mediaType,
                messageContent: caption,
                mediaUrl,
                mediaFilename: filename,
                leadId,
                customerId,
                status: 'sent',
                whatsappMessageId: result.messageId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            logger.info('WhatsApp media sent successfully', {
                userId,
                phone,
                mediaType,
                messageId: result.messageId
            });

            return res.json({
                success: true,
                data: {
                    ...result,
                    logId
                }
            });

        } catch (error) {
            logger.error('Failed to send WhatsApp media', {
                error: error.message,
                userId: req.user?.id
            });

            if (error.code?.startsWith('WHATSAPP_')) {
                return res.status(502).json({
                    success: false,
                    error: { code: error.code, message: error.message }
                });
            }

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao enviar mídia' }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/sessions:
     *   get:
     *     tags: [WhatsApp Send]
     *     summary: Lista sessões WhatsApp disponíveis para o usuário
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de sessões
     */
    async getSessions(req, res) {
        try {
            const userId = req.user.id;
            const userLevel = req.user.level || 0;

            // Obter sessões do WhatsApp Bot
            const allSessions = await whatsAppBotAPIService.getSessions();

            // Se for admin (level >= 80), retornar todas as sessões
            if (userLevel >= 80) {
                return res.json({
                    success: true,
                    data: {
                        sessions: allSessions,
                        defaultSessionId: allSessions.find(s => s.status === 'connected')?.id || null
                    }
                });
            }

            // Para usuários normais, filtrar apenas sessões autorizadas
            // Por enquanto, retornar todas as sessões conectadas
            // TODO: Implementar tabela whatsapp_user_sessions para controle mais fino
            const userSessions = allSessions.filter(s => s.status === 'connected');

            return res.json({
                success: true,
                data: {
                    sessions: userSessions,
                    defaultSessionId: userSessions[0]?.id || null
                }
            });

        } catch (error) {
            logger.error('Failed to get WhatsApp sessions', {
                error: error.message,
                userId: req.user?.id
            });

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro ao obter sessões' }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/sessions/{sessionId}/status:
     *   get:
     *     tags: [WhatsApp Send]
     *     summary: Obtém status de uma sessão específica
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Status da sessão
     */
    async getSessionStatus(req, res) {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_SESSION', message: 'ID da sessão é obrigatório' }
                });
            }

            const status = await whatsAppBotAPIService.getSessionStatus(sessionId);

            return res.json({
                success: true,
                data: status
            });

        } catch (error) {
            logger.error('Failed to get session status', {
                error: error.message,
                sessionId: req.params.sessionId
            });

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro ao obter status da sessão' }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/check-number/{phone}:
     *   get:
     *     tags: [WhatsApp Send]
     *     summary: Verifica se um número está no WhatsApp
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Resultado da verificação
     */
    async checkNumber(req, res) {
        try {
            const { phone } = req.params;
            const userId = req.user.id;

            if (!phone || !whatsAppBotAPIService.isValidPhone(phone)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PHONE', message: 'Número de telefone inválido' }
                });
            }

            const sessionId = await WhatsAppSendController.getDefaultSessionForUser(userId);

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_SESSION', message: 'Nenhuma sessão disponível' }
                });
            }

            const exists = await whatsAppBotAPIService.checkNumber(sessionId, phone);

            return res.json({
                success: true,
                data: {
                    phone,
                    exists,
                    formatted: whatsAppBotAPIService.formatPhone(phone)
                }
            });

        } catch (error) {
            logger.error('Failed to check WhatsApp number', {
                error: error.message,
                phone: req.params.phone
            });

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro ao verificar número' }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/sent-messages:
     *   get:
     *     tags: [WhatsApp Send]
     *     summary: Lista mensagens enviadas pelo usuário
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *       - in: query
     *         name: phone
     *         schema:
     *           type: string
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Lista de mensagens enviadas
     */
    async getSentMessages(req, res) {
        try {
            const userId = req.user.id;
            const userLevel = req.user.level || 0;
            const { page = 1, limit = 20, phone, startDate, endDate } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            let whereClause = 'WHERE 1=1';
            const params = [];

            // Se não for admin, filtrar apenas mensagens do próprio usuário
            if (userLevel < 80) {
                whereClause += ' AND user_id = ?';
                params.push(userId);
            }

            if (phone) {
                whereClause += ' AND phone_to LIKE ?';
                params.push(`%${phone}%`);
            }

            if (startDate) {
                whereClause += ' AND DATE(created_at) >= ?';
                params.push(startDate);
            }

            if (endDate) {
                whereClause += ' AND DATE(created_at) <= ?';
                params.push(endDate);
            }

            // Verificar se a tabela existe
            const db = getDatabase();
            const [tableCheck] = await db.query(`
                SELECT COUNT(*) as count FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = 'whatsapp_sent_messages_log'
            `);

            if (tableCheck[0].count === 0) {
                // Tabela não existe, retornar vazio
                return res.json({
                    success: true,
                    data: {
                        messages: [],
                        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
                    }
                });
            }

            const [messages] = await db.query(`
                SELECT 
                    id, user_id, session_id, phone_to, message_type, 
                    message_content, media_url, caption, lead_id, customer_id,
                    status, whatsapp_message_id, error_message, created_at, sent_at
                FROM whatsapp_sent_messages_log
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            const [countResult] = await db.query(`
                SELECT COUNT(*) as total FROM whatsapp_sent_messages_log ${whereClause}
            `, params);

            const total = countResult[0].total;

            return res.json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit))
                    }
                }
            });

        } catch (error) {
            logger.error('Failed to get sent messages', {
                error: error.message,
                userId: req.user?.id
            });

            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro ao obter mensagens enviadas' }
            });
        }
    },

    // ==================== HELPER METHODS ====================

    /**
     * Obtém a sessão padrão para um usuário
     * @param {number} userId - ID do usuário
     * @returns {Promise<string|null>} ID da sessão ou null
     */
    async getDefaultSessionForUser(userId) {
        try {
            // Primeiro, tentar obter sessão configurada para o usuário
            // TODO: Implementar tabela whatsapp_user_sessions

            // Por enquanto, retornar a primeira sessão conectada disponível
            const sessions = await whatsAppBotAPIService.getSessions();
            const connectedSession = sessions.find(s => s.status === 'connected' && s.isActive);

            return connectedSession?.id || null;
        } catch (error) {
            logger.error('Failed to get default session for user', {
                userId,
                error: error.message
            });
            return null;
        }
    },

    /**
     * Loga uma mensagem enviada no banco de dados
     * @param {Object} data - Dados da mensagem
     * @returns {Promise<number>} ID do log
     */
    async logSentMessage(data) {
        try {
            const db = getDatabase();

            // Verificar se a tabela existe
            const [tableCheck] = await db.query(`
                SELECT COUNT(*) as count FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = 'whatsapp_sent_messages_log'
            `);

            if (tableCheck[0].count === 0) {
                // Criar tabela se não existir
                await db.query(`
                    CREATE TABLE IF NOT EXISTS whatsapp_sent_messages_log (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        session_id VARCHAR(50) NOT NULL,
                        phone_to VARCHAR(20) NOT NULL,
                        message_type ENUM('text', 'image', 'document', 'audio', 'video', 'location', 'contact') NOT NULL DEFAULT 'text',
                        message_content TEXT,
                        media_url VARCHAR(500),
                        media_filename VARCHAR(255),
                        caption VARCHAR(1000),
                        lead_id INT,
                        customer_id INT,
                        template_id INT,
                        status ENUM('pending', 'sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'pending',
                        whatsapp_message_id VARCHAR(100),
                        error_message TEXT,
                        ip_address VARCHAR(45),
                        user_agent VARCHAR(500),
                        is_bulk BOOLEAN DEFAULT FALSE,
                        bulk_batch_id VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        sent_at TIMESTAMP NULL,
                        delivered_at TIMESTAMP NULL,
                        read_at TIMESTAMP NULL,
                        INDEX idx_user_date (user_id, created_at),
                        INDEX idx_phone (phone_to),
                        INDEX idx_status (status),
                        INDEX idx_lead (lead_id),
                        INDEX idx_created_at (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                logger.info('Created whatsapp_sent_messages_log table');
            }

            const [result] = await db.query(`
                INSERT INTO whatsapp_sent_messages_log 
                (user_id, session_id, phone_to, message_type, message_content, media_url, media_filename, caption, lead_id, customer_id, status, whatsapp_message_id, ip_address, user_agent, sent_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                data.userId,
                data.sessionId,
                data.phone,
                data.messageType || 'text',
                data.messageContent || null,
                data.mediaUrl || null,
                data.mediaFilename || null,
                data.caption || null,
                data.leadId || null,
                data.customerId || null,
                data.status || 'sent',
                data.whatsappMessageId || null,
                data.ipAddress || null,
                data.userAgent || null
            ]);

            return result.insertId;
        } catch (error) {
            logger.error('Failed to log sent message', {
                error: error.message,
                data
            });
            // Não falhar o envio se o log falhar
            return null;
        }
    }
};

export default WhatsAppSendController;
