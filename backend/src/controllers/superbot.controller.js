/**
 * Superbot Controller
 * 
 * Endpoints REST para integração com Superbot
 * 
 * @version 1.0
 * @date 2026-01-17
 */

import { SuperbotService, SUPERBOT_INTENTS, SENTIMENT } from '../services/superbot.service.js';
import { SuperbotAIService, INTENTS as AI_INTENTS } from '../services/superbot-ai.service.js';
import { SuperbotAnalyticsRepository } from '../repositories/superbot-analytics.repository.js';
import { SuperbotRepository } from '../repositories/superbot.repository.js';
import { SuperbotChatbotService } from '../services/superbot-chatbot.service.js';
import logger from '../config/logger.js';

/**
 * @swagger
 * tags:
 *   name: Superbot
 *   description: Integração com sistema de conversas WhatsApp (Superbot)
 */

export const SuperbotController = {
    /**
     * @swagger
     * /api/superbot/customers/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Busca cliente do Superbot por telefone
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *         description: Número de telefone (qualquer formato)
     *     responses:
     *       200:
     *         description: Cliente encontrado
     *       404:
     *         description: Cliente não encontrado
     */
    async getCustomerByPhone(req, res) {
        try {
            const { phone } = req.params;

            if (!phone || phone.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'Telefone inválido. Mínimo 8 dígitos.'
                });
            }

            const customer = await SuperbotService.findCustomerByPhone(phone);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado no Superbot'
                });
            }

            res.json({
                success: true,
                data: customer
            });
        } catch (error) {
            logger.error('Erro ao buscar cliente Superbot', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar cliente'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/customers:
     *   get:
     *     tags: [Superbot]
     *     summary: Lista clientes do Superbot
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
     *         name: search
     *         schema:
     *           type: string
     *         description: Busca por nome ou telefone
     *     responses:
     *       200:
     *         description: Lista de clientes
     */
    async listCustomers(req, res) {
        try {
            const { page = 1, limit = 20, search = '', sellerPhones = '' } = req.query;

            // Se sellerPhones for passado, converter para array
            const sellerPhonesArray = sellerPhones
                ? sellerPhones.split(',').map(p => p.trim()).filter(Boolean)
                : null;

            const result = await SuperbotService.listCustomers({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                sellerPhones: sellerPhonesArray
            });

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Erro ao listar clientes Superbot', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao listar clientes'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/conversations/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém histórico de conversas de um cliente
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: days
     *         schema:
     *           type: integer
     *           default: 30
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *     responses:
     *       200:
     *         description: Histórico de conversas
     */
    async getConversations(req, res) {
        try {
            const { phone } = req.params;
            const { days = 30, limit = 50 } = req.query;

            const result = await SuperbotService.getConversationHistory(phone, {
                days: parseInt(days),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao buscar conversas', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar conversas'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/messages/{sessionId}:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém mensagens de uma sessão
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *     responses:
     *       200:
     *         description: Mensagens da sessão
     */
    async getMessages(req, res) {
        try {
            const { sessionId } = req.params;
            const { page = 1, limit = 50, phone = null } = req.query;

            const result = await SuperbotService.getSessionMessages(sessionId, {
                page: parseInt(page),
                limit: parseInt(limit),
                phone: phone || null
            });

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar mensagens'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/stats/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém estatísticas de um cliente
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Estatísticas do cliente
     */
    async getStats(req, res) {
        try {
            const { phone } = req.params;

            const result = await SuperbotService.getCustomerStats(phone);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao buscar estatísticas', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/transcriptions/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém transcrições de áudio de um cliente
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: days
     *         schema:
     *           type: integer
     *           default: 30
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *     responses:
     *       200:
     *         description: Transcrições de áudio
     */
    async getTranscriptions(req, res) {
        try {
            const { phone } = req.params;
            const { days = 30, limit = 50 } = req.query;

            const result = await SuperbotService.getTranscriptions(phone, {
                days: parseInt(days),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (error) {
            logger.error('Erro ao buscar transcrições', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar transcrições'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/sentiment/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Analisa sentimento de um cliente
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: days
     *         schema:
     *           type: integer
     *           default: 30
     *     responses:
     *       200:
     *         description: Análise de sentimento
     */
    async getSentiment(req, res) {
        try {
            const { phone } = req.params;
            const { days = 30 } = req.query;

            const result = await SuperbotService.analyzeCustomerSentiment(phone, {
                days: parseInt(days)
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao analisar sentimento', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao analisar sentimento'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/analyze-intent:
     *   post:
     *     tags: [Superbot]
     *     summary: Analisa intenção de uma mensagem
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               message:
     *                 type: string
     *                 description: Texto da mensagem
     *               phone:
     *                 type: string
     *                 description: Telefone do remetente (opcional, para contexto)
     *     responses:
     *       200:
     *         description: Análise de intenção
     */
    async analyzeIntent(req, res) {
        try {
            const { message, phone } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Mensagem é obrigatória'
                });
            }

            const intentAnalysis = SuperbotService.analyzeIntentBasic(message);
            const sentimentAnalysis = SuperbotService.analyzeSentimentBasic(message);

            // Se phone foi fornecido, buscar contexto adicional
            let context = null;
            if (phone) {
                try {
                    const linkedCustomer = await SuperbotService.findLinkedLeadsCustomer(phone);
                    if (linkedCustomer) {
                        context = {
                            has_linked_customer: true,
                            customer_name: linkedCustomer.leads_customer?.nome,
                            seller_name: linkedCustomer.link?.seller_name
                        };
                    }
                } catch (e) {
                    // Ignorar erro de contexto
                }
            }

            res.json({
                success: true,
                data: {
                    intent: intentAnalysis,
                    sentiment: sentimentAnalysis,
                    context,
                    available_intents: Object.keys(SUPERBOT_INTENTS),
                    ai_available: SuperbotAIService.isConfigured()
                }
            });
        } catch (error) {
            logger.error('Erro ao analisar intenção', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao analisar intenção'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/analyze-intent-ai:
     *   post:
     *     tags: [Superbot]
     *     summary: Analisa intenção de uma mensagem usando OpenAI GPT
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *                 description: Texto da mensagem
     *               phone:
     *                 type: string
     *                 description: Telefone do remetente (para contexto)
     *               useCache:
     *                 type: boolean
     *                 default: true
     *                 description: Se deve usar cache de análises anteriores
     *     responses:
     *       200:
     *         description: Análise de intenção com IA
     */
    async analyzeIntentAI(req, res) {
        try {
            const { message, phone, useCache = true } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Mensagem é obrigatória'
                });
            }

            if (!SuperbotAIService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    error: 'Serviço de IA não configurado. Configure OPENAI_API_KEY.'
                });
            }

            // Buscar contexto se phone fornecido
            let contextMessages = [];
            let customerName = null;

            if (phone) {
                try {
                    const linkedCustomer = await SuperbotService.findLinkedLeadsCustomer(phone);
                    if (linkedCustomer) {
                        customerName = linkedCustomer.leads_customer?.nome;
                    }

                    // Buscar últimas mensagens para contexto
                    const { SuperbotRepository } = await import('../repositories/superbot.repository.js');
                    const recentMessages = await SuperbotRepository.getMessagesByPhone(phone, { days: 1, limit: 5 });
                    contextMessages = recentMessages.map(m => ({
                        direction: m.direction,
                        text: m.message_text || m.transcription_text || '[mídia]'
                    }));
                } catch (e) {
                    logger.warn('Erro ao buscar contexto para análise IA', { error: e.message });
                }
            }

            // Analisar com IA
            const analysis = await SuperbotAIService.analyzeIntent(message, {
                useCache,
                contextMessages,
                customerName
            });

            res.json({
                success: true,
                data: {
                    ...analysis,
                    customer_name: customerName,
                    context_messages_used: contextMessages.length,
                    available_intents: Object.keys(AI_INTENTS)
                }
            });
        } catch (error) {
            logger.error('Erro ao analisar intenção com IA', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao analisar intenção com IA'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/detect-purchase-intent:
     *   post:
     *     tags: [Superbot]
     *     summary: Detecta se a mensagem tem intenção de compra
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     responses:
     *       200:
     *         description: Resultado da detecção
     */
    async detectPurchaseIntent(req, res) {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Mensagem é obrigatória'
                });
            }

            if (!SuperbotAIService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    error: 'Serviço de IA não configurado'
                });
            }

            const result = await SuperbotAIService.detectPurchaseIntent(message);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao detectar intenção de compra', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao detectar intenção de compra'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/extract-products:
     *   post:
     *     tags: [Superbot]
     *     summary: Extrai produtos mencionados em uma mensagem
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     responses:
     *       200:
     *         description: Produtos extraídos
     */
    async extractProducts(req, res) {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Mensagem é obrigatória'
                });
            }

            if (!SuperbotAIService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    error: 'Serviço de IA não configurado'
                });
            }

            const products = await SuperbotAIService.extractProducts(message);

            res.json({
                success: true,
                data: {
                    products,
                    count: products.length
                }
            });
        } catch (error) {
            logger.error('Erro ao extrair produtos', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao extrair produtos'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/context/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém contexto enriquecido para chatbot
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Contexto enriquecido
     */
    async getContext(req, res) {
        try {
            const { phone } = req.params;

            const result = await SuperbotService.getEnrichedContext(phone);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao gerar contexto', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao gerar contexto'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/suggested-links:
     *   get:
     *     tags: [Superbot]
     *     summary: Lista sugestões de links entre clientes
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: minConfidence
     *         schema:
     *           type: integer
     *           default: 50
     *     responses:
     *       200:
     *         description: Sugestões de links
     */
    async getSuggestedLinks(req, res) {
        try {
            const { limit = 50, minConfidence = 50 } = req.query;

            const result = await SuperbotService.getSuggestedLinks({
                limit: parseInt(limit),
                minConfidence: parseInt(minConfidence)
            });

            res.json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (error) {
            logger.error('Erro ao buscar sugestões de links', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar sugestões'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/link:
     *   post:
     *     tags: [Superbot]
     *     summary: Cria vínculo entre cliente Superbot e leads-agent
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - superbotCustomerId
     *               - leadsCustomerId
     *             properties:
     *               superbotCustomerId:
     *                 type: integer
     *               leadsCustomerId:
     *                 type: integer
     *               confidenceScore:
     *                 type: number
     *               verified:
     *                 type: boolean
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Link criado
     */
    async createLink(req, res) {
        try {
            const { superbotCustomerId, leadsCustomerId, confidenceScore, verified, notes } = req.body;

            if (!superbotCustomerId || !leadsCustomerId) {
                return res.status(400).json({
                    success: false,
                    error: 'superbotCustomerId e leadsCustomerId são obrigatórios'
                });
            }

            const result = await SuperbotService.linkCustomers(
                superbotCustomerId,
                leadsCustomerId,
                {
                    linkedBy: req.user?.id,
                    confidenceScore: confidenceScore || 0,
                    verified: verified || false,
                    notes
                }
            );

            res.json({
                success: true,
                data: result,
                message: 'Vínculo criado com sucesso'
            });
        } catch (error) {
            logger.error('Erro ao criar link', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message || 'Erro ao criar vínculo'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/link:
     *   delete:
     *     tags: [Superbot]
     *     summary: Remove vínculo entre clientes
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - superbotCustomerId
     *               - leadsCustomerId
     *             properties:
     *               superbotCustomerId:
     *                 type: integer
     *               leadsCustomerId:
     *                 type: integer
     *     responses:
     *       200:
     *         description: Link removido
     */
    async removeLink(req, res) {
        try {
            const { superbotCustomerId, leadsCustomerId } = req.body;

            if (!superbotCustomerId || !leadsCustomerId) {
                return res.status(400).json({
                    success: false,
                    error: 'superbotCustomerId e leadsCustomerId são obrigatórios'
                });
            }

            await SuperbotService.unlinkCustomers(superbotCustomerId, leadsCustomerId);

            res.json({
                success: true,
                message: 'Vínculo removido com sucesso'
            });
        } catch (error) {
            logger.error('Erro ao remover link', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message || 'Erro ao remover vínculo'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/linked-customer/{phone}:
     *   get:
     *     tags: [Superbot]
     *     summary: Busca cliente leads-agent vinculado a um telefone
     *     parameters:
     *       - in: path
     *         name: phone
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Cliente vinculado
     *       404:
     *         description: Nenhum vínculo encontrado
     */
    async getLinkedCustomer(req, res) {
        try {
            const { phone } = req.params;

            const result = await SuperbotService.findLinkedLeadsCustomer(phone);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Nenhum cliente leads-agent vinculado a este telefone'
                });
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao buscar cliente vinculado', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar cliente vinculado'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/webhook:
     *   post:
     *     tags: [Superbot]
     *     summary: Recebe mensagens do Superbot em tempo real
     *     description: Endpoint para webhook do Superbot. Processa mensagens e detecta intenções.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               message_id:
     *                 type: string
     *               session_id:
     *                 type: string
     *               sender_phone:
     *                 type: string
     *               recipient_phone:
     *                 type: string
     *               message_text:
     *                 type: string
     *               message_type:
     *                 type: string
     *               direction:
     *                 type: string
     *                 enum: [incoming, outgoing]
     *               timestamp:
     *                 type: string
     *               media_url:
     *                 type: string
     *               transcription:
     *                 type: string
     *     responses:
     *       200:
     *         description: Mensagem processada
     *       401:
     *         description: Assinatura inválida
     */
    async receiveWebhook(req, res) {
        try {
            const { SuperbotWebhookService } = await import('../services/superbot-webhook.service.js');

            // Validar assinatura (opcional em desenvolvimento)
            const signature = req.headers['x-superbot-signature'];
            if (process.env.NODE_ENV === 'production') {
                if (!SuperbotWebhookService.validateSignature(req.body, signature)) {
                    logger.warn('Webhook: assinatura inválida', {
                        ip: req.ip,
                        signature: signature?.substring(0, 20)
                    });
                    return res.status(401).json({
                        success: false,
                        error: 'Assinatura inválida'
                    });
                }
            }

            // Processar mensagem
            const result = await SuperbotWebhookService.processIncomingMessage(req.body);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro no webhook', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao processar webhook'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/webhook/status:
     *   get:
     *     tags: [Superbot]
     *     summary: Obtém status do webhook
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Status do webhook
     */
    async getWebhookStatus(req, res) {
        try {
            const { SuperbotWebhookService } = await import('../services/superbot-webhook.service.js');

            const stats = await SuperbotWebhookService.getStats();

            res.json({
                success: true,
                data: {
                    ...stats,
                    webhook_url: `${req.protocol}://${req.get('host')}/api/superbot/webhook`,
                    status: 'active'
                }
            });
        } catch (error) {
            logger.error('Erro ao obter status do webhook', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao obter status'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/webhook/process-queue:
     *   post:
     *     tags: [Superbot]
     *     summary: Processa fila de mensagens pendentes
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Fila processada
     */
    async processWebhookQueue(req, res) {
        try {
            const { SuperbotWebhookService } = await import('../services/superbot-webhook.service.js');

            const result = await SuperbotWebhookService.processQueue();

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao processar fila do webhook', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao processar fila'
            });
        }
    },

    /**
     * @swagger
     * /api/superbot/webhook/test:
     *   post:
     *     tags: [Superbot]
     *     summary: Testa o webhook com uma mensagem simulada
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message_text
     *             properties:
     *               message_text:
     *                 type: string
     *               sender_phone:
     *                 type: string
     *                 default: "5511999999999"
     *     responses:
     *       200:
     *         description: Resultado do teste
     */
    async testWebhook(req, res) {
        try {
            const { SuperbotWebhookService } = await import('../services/superbot-webhook.service.js');

            const { message_text, sender_phone = '5511999999999' } = req.body;

            if (!message_text) {
                return res.status(400).json({
                    success: false,
                    error: 'message_text é obrigatório'
                });
            }

            // Simular payload do webhook
            const payload = {
                message_id: `test-${Date.now()}`,
                session_id: `test-session-${Date.now()}`,
                sender_phone,
                recipient_phone: '551133331536',
                message_text,
                message_type: 'text',
                direction: 'incoming',
                timestamp: new Date().toISOString()
            };

            const result = await SuperbotWebhookService.processIncomingMessage(payload);

            res.json({
                success: true,
                test_mode: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro no teste do webhook', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao testar webhook'
            });
        }
    },

    // ============================================
    // CHATBOT INTEGRATION ENDPOINTS
    // ============================================

    /**
     * GET /api/superbot/chatbot/context/:phone
     * Retorna contexto enriquecido para o chatbot
     */
    async getChatbotContext(req, res) {
        try {
            const { phone } = req.params;
            const {
                max_messages = 10,
                include_summary = true,
                include_stats = true,
                include_sentiment = true
            } = req.query;

            const context = await SuperbotChatbotService.getEnrichedContext(phone, {
                maxMessages: parseInt(max_messages),
                includeSummary: include_summary === 'true',
                includeStats: include_stats === 'true',
                includeSentiment: include_sentiment === 'true'
            });

            res.json({
                success: true,
                data: context
            });
        } catch (error) {
            logger.error('Erro ao buscar contexto do chatbot', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar contexto'
            });
        }
    },

    /**
     * GET /api/superbot/chatbot/prompt/:phone
     * Retorna contexto formatado como prompt para IA
     */
    async getChatbotPrompt(req, res) {
        try {
            const { phone } = req.params;
            const { max_messages = 10 } = req.query;

            const context = await SuperbotChatbotService.getEnrichedContext(phone, {
                maxMessages: parseInt(max_messages),
                includeSummary: true,
                includeStats: true,
                includeSentiment: true
            });

            const prompt = SuperbotChatbotService.formatContextForPrompt(context);

            res.json({
                success: true,
                data: {
                    prompt,
                    context_summary: {
                        customer_name: context.customer?.name,
                        is_linked: !!context.linked_customer,
                        message_count: context.conversation?.total_in_context,
                        sentiment: context.conversation?.sentiment,
                        recent_intents: context.intents?.map(i => i.intent)
                    }
                }
            });
        } catch (error) {
            logger.error('Erro ao gerar prompt do chatbot', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao gerar prompt'
            });
        }
    },

    /**
     * POST /api/superbot/chatbot/validate-discount
     * Valida desconto solicitado via WhatsApp
     */
    async validateDiscount(req, res) {
        try {
            const { phone, product_id, discount, quantity = 1 } = req.body;

            if (!phone || !product_id || discount === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'phone, product_id e discount são obrigatórios'
                });
            }

            const result = await SuperbotChatbotService.validateDiscount(phone, {
                productId: product_id,
                requestedDiscount: parseFloat(discount),
                quantity: parseInt(quantity)
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao validar desconto', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao validar desconto'
            });
        }
    },

    /**
     * POST /api/superbot/chatbot/log-event
     * Registra evento de interação WhatsApp
     */
    async logChatbotEvent(req, res) {
        try {
            const {
                phone,
                session_id,
                message_text,
                intent,
                confidence,
                entities = {},
                tool_name = null,
                tool_result = null,
                status = 'OK'
            } = req.body;

            const userId = req.user?.id;

            const eventId = await SuperbotChatbotService.logInteractionEvent({
                userId,
                phone,
                sessionId: session_id,
                messageText: message_text,
                intent,
                confidence,
                entities,
                toolName: tool_name,
                toolResult: tool_result,
                status
            });

            res.json({
                success: true,
                data: { event_id: eventId }
            });
        } catch (error) {
            logger.error('Erro ao registrar evento', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao registrar evento'
            });
        }
    },

    // ============================================
    // ANALYTICS ENDPOINTS
    // ============================================

    /**
     * GET /api/superbot/analytics/summary
     * Retorna resumo geral de WhatsApp
     */
    async getAnalyticsSummary(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getSummary({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar resumo analytics', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar resumo'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/messages-by-day
     * Retorna mensagens por dia
     */
    async getMessagesByDay(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getMessagesByDay({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar mensagens por dia', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar mensagens por dia'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/messages-by-hour
     * Retorna distribuição de mensagens por hora
     */
    async getMessagesByHour(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getMessagesByHour({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar mensagens por hora', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar mensagens por hora'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/top-customers
     * Retorna top clientes por mensagens
     */
    async getTopCustomers(req, res) {
        try {
            const { days = 30, limit = 10 } = req.query;
            const data = await SuperbotAnalyticsRepository.getTopCustomers({
                days: parseInt(days),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar top clientes', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar top clientes'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/intents
     * Retorna distribuição de intenções detectadas
     */
    async getIntentDistribution(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getIntentDistribution({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar distribuição de intenções', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar intenções'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/conversion
     * Retorna métricas de conversão
     */
    async getConversionMetrics(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getConversionMetrics({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar métricas de conversão', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar métricas de conversão'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/response
     * Retorna métricas de tempo de resposta
     */
    async getResponseMetrics(req, res) {
        try {
            const { days = 30 } = req.query;
            const data = await SuperbotAnalyticsRepository.getResponseMetrics({ days: parseInt(days) });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Erro ao buscar métricas de resposta', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar métricas de resposta'
            });
        }
    },

    /**
     * GET /api/superbot/analytics/dashboard
     * Retorna todos os dados do dashboard em uma única chamada
     */
    async getDashboard(req, res) {
        try {
            const { days = 30 } = req.query;
            const daysInt = parseInt(days);

            // Buscar todos os dados em paralelo
            const [summary, messagesByDay, messagesByHour, topCustomers, intents, conversion, response] = await Promise.all([
                SuperbotAnalyticsRepository.getSummary({ days: daysInt }),
                SuperbotAnalyticsRepository.getMessagesByDay({ days: daysInt }),
                SuperbotAnalyticsRepository.getMessagesByHour({ days: daysInt }),
                SuperbotAnalyticsRepository.getTopCustomers({ days: daysInt, limit: 5 }),
                SuperbotAnalyticsRepository.getIntentDistribution({ days: daysInt }),
                SuperbotAnalyticsRepository.getConversionMetrics({ days: daysInt }),
                SuperbotAnalyticsRepository.getResponseMetrics({ days: daysInt })
            ]);

            res.json({
                success: true,
                data: {
                    summary,
                    messagesByDay,
                    messagesByHour,
                    topCustomers,
                    intents,
                    conversion,
                    response,
                    period_days: daysInt,
                    generated_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Erro ao buscar dashboard', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar dashboard'
            });
        }
    },

    // ==========================================
    // SELLER PHONES - Gerenciar telefones de vendedores
    // ==========================================

    /**
     * Lista todos os telefones de vendedores
     */
    async listSellerPhones(req, res) {
        try {
            const phones = await SuperbotService.listSellerPhones();
            res.json({
                success: true,
                data: phones
            });
        } catch (error) {
            logger.error('Erro ao listar telefones de vendedores', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao listar telefones de vendedores'
            });
        }
    },

    /**
     * Busca telefones de um vendedor específico
     */
    async getSellerPhones(req, res) {
        try {
            const { userId } = req.params;
            const phones = await SuperbotService.getSellerPhones(userId);
            res.json({
                success: true,
                data: phones
            });
        } catch (error) {
            logger.error('Erro ao buscar telefones do vendedor', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar telefones do vendedor'
            });
        }
    },

    /**
     * Adiciona telefone a um vendedor
     */
    async addSellerPhone(req, res) {
        try {
            const { userId, phoneNumber, phoneName, isPrimary } = req.body;

            if (!userId || !phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'userId e phoneNumber são obrigatórios'
                });
            }

            const result = await SuperbotService.addSellerPhone(userId, phoneNumber, {
                phoneName,
                isPrimary: isPrimary || false
            });

            res.json({
                success: true,
                message: 'Telefone vinculado ao vendedor',
                data: result
            });
        } catch (error) {
            logger.error('Erro ao adicionar telefone de vendedor', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar telefone de vendedor'
            });
        }
    },

    /**
     * Remove telefone de vendedor
     */
    async removeSellerPhone(req, res) {
        try {
            const { phoneNumber } = req.params;
            const removed = await SuperbotService.removeSellerPhone(phoneNumber);

            if (removed) {
                res.json({
                    success: true,
                    message: 'Telefone removido do vendedor'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Telefone não encontrado'
                });
            }
        } catch (error) {
            logger.error('Erro ao remover telefone de vendedor', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao remover telefone de vendedor'
            });
        }
    },

    /**
     * Lista clientes filtrados por vendedor (para usuários level < 4)
     */
    async listCustomersBySeller(req, res) {
        try {
            // NOTA: O JWT usa 'userId', não 'id'
            const userId = req.user?.userId;
            const userLevel = req.user?.level || 0;

            // DEBUG LOG
            logger.info('🔍 listCustomersBySeller chamado', {
                userId,
                userLevel,
                userNick: req.user?.username,
                shouldFilter: userLevel < 4
            });

            // Se level >= 4, retorna todos
            if (userLevel >= 4) {
                logger.info('📊 Usuário admin - retornando todos os clientes');
                const { page = 1, limit = 20, search = '' } = req.query;
                const result = await SuperbotService.listCustomers({ page: parseInt(page), limit: parseInt(limit), search });
                return res.json({ success: true, ...result });
            }

            // Se level < 4, filtra por vendedor
            logger.info('🔒 Usuário vendedor - filtrando por telefones');
            const { page = 1, limit = 20, search = '' } = req.query;
            const result = await SuperbotService.listCustomersBySeller(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                search
            });

            logger.info('✅ Resultado filtrado', {
                total: result.total,
                sellerPhones: result.sellerPhones
            });

            res.json({
                success: true,
                ...result,
                filtered_by_seller: true
            });
        } catch (error) {
            logger.error('Erro ao listar clientes por vendedor', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao listar clientes por vendedor'
            });
        }
    },

    /**
     * Busca vendedor pelo telefone do bot
     */
    async getSellerByPhone(req, res) {
        try {
            const { phone } = req.params;
            const seller = await SuperbotService.getSellerByPhone(phone);

            if (seller) {
                res.json({
                    success: true,
                    data: seller
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Vendedor não encontrado para este telefone'
                });
            }
        } catch (error) {
            logger.error('Erro ao buscar vendedor por telefone', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar vendedor por telefone'
            });
        }
    },

    // ==========================================
    // LID (Linked ID) Management - WhatsApp Business API
    // ==========================================

    /**
     * GET /api/superbot/lid/stats
     * Retorna estatísticas de LIDs no sistema
     */
    async getLidStats(req, res) {
        try {
            const stats = await SuperbotRepository.getLidStats();
            res.json({
                success: true,
                data: {
                    ...stats,
                    description: 'LIDs são identificadores usados pelo WhatsApp Business API quando clientes contactam via Facebook/Instagram ads'
                }
            });
        } catch (error) {
            logger.error('Erro ao buscar estatísticas de LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas de LID'
            });
        }
    },

    /**
     * GET /api/superbot/lid/mappings
     * Lista todos os mapeamentos LID -> telefone
     */
    async listLidMappings(req, res) {
        try {
            const { page = 1, limit = 50, verified, search } = req.query;

            const result = await SuperbotRepository.listLidMappings({
                page: parseInt(page),
                limit: parseInt(limit),
                verified: verified === 'true' ? true : verified === 'false' ? false : null,
                search
            });

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            logger.error('Erro ao listar mapeamentos LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao listar mapeamentos LID'
            });
        }
    },

    /**
     * GET /api/superbot/lid/resolve/:lid
     * Resolve um LID para o número de telefone real
     */
    async resolveLid(req, res) {
        try {
            const { lid } = req.params;

            const mapping = await SuperbotRepository.resolveLid(lid);

            if (mapping) {
                res.json({
                    success: true,
                    data: {
                        lid,
                        phone_number: mapping.phone_number,
                        push_name: mapping.push_name,
                        confidence: mapping.confidence,
                        is_verified: mapping.is_verified,
                        match_method: mapping.match_method
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Nenhum mapeamento encontrado para este LID',
                    lid,
                    is_lid: SuperbotRepository.isLinkedId(lid)
                });
            }
        } catch (error) {
            logger.error('Erro ao resolver LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao resolver LID'
            });
        }
    },

    /**
     * POST /api/superbot/lid/mappings
     * Cria ou atualiza mapeamento LID -> telefone
     */
    async createLidMapping(req, res) {
        try {
            const { lid, phone_number, push_name, customer_name, confidence, is_verified } = req.body;

            if (!lid || !phone_number) {
                return res.status(400).json({
                    success: false,
                    error: 'lid e phone_number são obrigatórios'
                });
            }

            // Verificar se o lid é realmente um LID
            if (!SuperbotRepository.isLinkedId(lid)) {
                return res.status(400).json({
                    success: false,
                    error: 'O valor fornecido não parece ser um LID válido (13-15 dígitos, não começa com 55)'
                });
            }

            const result = await SuperbotRepository.createLidMapping(lid, phone_number, {
                pushName: push_name,
                customerName: customer_name,
                confidence: confidence || 1.0,
                matchMethod: 'manual',
                isVerified: is_verified || true,
                verifiedBy: req.user?.userId
            });

            res.json({
                success: true,
                message: 'Mapeamento LID criado/atualizado com sucesso',
                data: {
                    lid,
                    phone_number,
                    affected_rows: result.affectedRows
                }
            });
        } catch (error) {
            logger.error('Erro ao criar mapeamento LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao criar mapeamento LID'
            });
        }
    },

    /**
     * DELETE /api/superbot/lid/mappings/:lid
     * Remove mapeamento LID
     */
    async deleteLidMapping(req, res) {
        try {
            const { lid } = req.params;

            const deleted = await SuperbotRepository.deleteLidMapping(lid);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Mapeamento LID removido com sucesso'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Mapeamento não encontrado'
                });
            }
        } catch (error) {
            logger.error('Erro ao remover mapeamento LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao remover mapeamento LID'
            });
        }
    },

    /**
     * GET /api/superbot/lid/potential-mappings
     * Encontra potenciais mapeamentos baseados em push_name
     */
    async findPotentialLidMappings(req, res) {
        try {
            const mappings = await SuperbotRepository.findPotentialLidMappings();

            res.json({
                success: true,
                data: mappings,
                count: mappings.length,
                description: 'Potenciais mapeamentos encontrados baseados em push_name igual entre LID e telefone real'
            });
        } catch (error) {
            logger.error('Erro ao buscar potenciais mapeamentos LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar potenciais mapeamentos'
            });
        }
    },

    /**
     * GET /api/superbot/lid/check/:phone
     * Verifica se um número é LID
     */
    async checkIsLid(req, res) {
        try {
            const { phone } = req.params;

            const isLid = SuperbotRepository.isLinkedId(phone);
            let mapping = null;

            if (isLid) {
                mapping = await SuperbotRepository.resolveLid(phone);
            }

            res.json({
                success: true,
                data: {
                    phone,
                    is_lid: isLid,
                    has_mapping: !!mapping,
                    mapped_phone: mapping?.phone_number || null,
                    mapping_confidence: mapping?.confidence || null,
                    description: isLid
                        ? 'Este é um Linked ID (LID) do WhatsApp Business API'
                        : 'Este parece ser um número de telefone normal'
                }
            });
        } catch (error) {
            logger.error('Erro ao verificar LID', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao verificar LID'
            });
        }
    }
};

export default SuperbotController;

