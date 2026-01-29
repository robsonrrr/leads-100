/**
 * WhatsApp AI Controller
 * 
 * Controller para endpoints de IA do WhatsApp
 * - Sugestões de mensagens
 * - Composição automática de mensagens
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import { aiSuggestionService } from '../services/ai-suggestion.service.js';
import logger from '../config/logger.js';

export const WhatsAppAIController = {
    /**
     * @swagger
     * /api/whatsapp/ai/suggest:
     *   post:
     *     tags: [WhatsApp AI]
     *     summary: Gera sugestões de mensagens usando IA
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               phone:
     *                 type: string
     *                 description: Telefone do destinatário
     *               leadId:
     *                 type: integer
     *                 description: ID do lead para contexto
     *               customerId:
     *                 type: integer
     *                 description: ID do cliente para contexto
     *               lastMessages:
     *                 type: array
     *                 description: Últimas mensagens da conversa
     *               context:
     *                 type: string
     *                 description: Contexto adicional para a IA
     *               intent:
     *                 type: string
     *                 enum: [greeting, follow_up, offer_discount, send_proposal, close_deal, objection, payment, shipping]
     *                 description: Intenção da mensagem
     *     responses:
     *       200:
     *         description: Sugestões geradas com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     suggestions:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                           text:
     *                             type: string
     *                           intent:
     *                             type: string
     *                           confidence:
     *                             type: number
     *                           shortLabel:
     *                             type: string
     */
    async getSuggestions(req, res) {
        try {
            const { phone, leadId, customerId, lastMessages, context, intent } = req.body;
            const userId = req.user.id;

            // Validação básica
            if (!phone && !leadId && !customerId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_CONTEXT',
                        message: 'É necessário fornecer phone, leadId ou customerId para gerar sugestões'
                    }
                });
            }

            // Validar intent se fornecido
            const validIntents = ['greeting', 'follow_up', 'offer_discount', 'send_proposal', 'close_deal', 'objection', 'payment', 'shipping'];
            if (intent && !validIntents.includes(intent)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_INTENT',
                        message: `Intent inválido. Valores aceitos: ${validIntents.join(', ')}`
                    }
                });
            }

            // Gerar sugestões
            const suggestions = await aiSuggestionService.generateSuggestions({
                phone,
                leadId,
                customerId,
                lastMessages,
                context,
                intent
            });

            logger.info('AI suggestions requested', {
                userId,
                phone,
                leadId,
                intent,
                suggestionsCount: suggestions.length
            });

            return res.json({
                success: true,
                data: {
                    suggestions,
                    generatedAt: new Date().toISOString(),
                    context: {
                        phone,
                        leadId,
                        customerId,
                        intent
                    }
                }
            });

        } catch (error) {
            logger.error('Failed to get AI suggestions', {
                error: error.message,
                userId: req.user?.id
            });

            return res.status(500).json({
                success: false,
                error: {
                    code: 'AI_ERROR',
                    message: 'Erro ao gerar sugestões de IA'
                }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/ai/compose:
     *   post:
     *     tags: [WhatsApp AI]
     *     summary: Compõe uma mensagem completa usando IA
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               phone:
     *                 type: string
     *               leadId:
     *                 type: integer
     *               customerId:
     *                 type: integer
     *               template:
     *                 type: string
     *                 description: Template base para a mensagem
     *               variables:
     *                 type: object
     *                 description: Variáveis para substituir no template
     *               tone:
     *                 type: string
     *                 enum: [formal, friendly, urgent, casual]
     *                 description: Tom da mensagem
     *     responses:
     *       200:
     *         description: Mensagem composta com sucesso
     */
    async composeMessage(req, res) {
        try {
            const { phone, leadId, customerId, template, variables, tone } = req.body;
            const userId = req.user.id;

            // Validação básica
            if (!phone && !leadId && !customerId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_CONTEXT',
                        message: 'É necessário fornecer phone, leadId ou customerId para compor mensagem'
                    }
                });
            }

            // Compor mensagem
            const result = await aiSuggestionService.composeMessage({
                phone,
                leadId,
                customerId,
                template,
                variables,
                tone
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: {
                        code: 'COMPOSE_ERROR',
                        message: result.error || 'Erro ao compor mensagem'
                    }
                });
            }

            logger.info('AI message composed', {
                userId,
                phone,
                leadId,
                hasTemplate: !!template
            });

            return res.json({
                success: true,
                data: {
                    message: result.message,
                    subject: result.subject,
                    tokensUsed: result.tokensUsed,
                    composedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Failed to compose AI message', {
                error: error.message,
                userId: req.user?.id
            });

            return res.status(500).json({
                success: false,
                error: {
                    code: 'AI_ERROR',
                    message: 'Erro ao compor mensagem com IA'
                }
            });
        }
    },

    /**
     * @swagger
     * /api/whatsapp/ai/intents:
     *   get:
     *     tags: [WhatsApp AI]
     *     summary: Lista os tipos de intenção disponíveis
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de intents disponíveis
     */
    async getIntents(req, res) {
        try {
            const intents = [
                { id: 'greeting', label: 'Saudação', description: 'Iniciar conversa', icon: '👋' },
                { id: 'follow_up', label: 'Follow-up', description: 'Retomar contato', icon: '📞' },
                { id: 'offer_discount', label: 'Oferta', description: 'Oferecer desconto', icon: '💰' },
                { id: 'send_proposal', label: 'Proposta', description: 'Enviar proposta', icon: '📄' },
                { id: 'close_deal', label: 'Fechamento', description: 'Fechar negócio', icon: '🤝' },
                { id: 'objection', label: 'Objeção', description: 'Contornar objeção', icon: '🎯' },
                { id: 'payment', label: 'Pagamento', description: 'Tratar pagamento', icon: '💳' },
                { id: 'shipping', label: 'Entrega', description: 'Informar entrega', icon: '🚚' }
            ];

            return res.json({
                success: true,
                data: { intents }
            });
        } catch (error) {
            logger.error('Failed to get intents', { error: error.message });
            return res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro interno' }
            });
        }
    }
};

export default WhatsAppAIController;
