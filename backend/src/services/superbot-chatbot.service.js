/**
 * Superbot Chatbot Integration Service
 * 
 * Serviço para integração do WhatsApp com o chatbot decisório
 * Fornece contexto enriquecido, registro de eventos e validação de políticas
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import { getDatabase } from '../config/database.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { SuperbotRepository } from '../repositories/superbot.repository.js';
import { SuperbotAIService } from './superbot-ai.service.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export const SuperbotChatbotService = {
    /**
     * Obtém contexto completo do cliente WhatsApp para o chatbot
     * Inclui: histórico de conversas, estatísticas, intenções detectadas, dados do cliente
     */
    async getEnrichedContext(phone, options = {}) {
        const {
            maxMessages = 10,
            includeSummary = true,
            includeStats = true,
            includeSentiment = true
        } = options;

        const cacheKey = `superbot:chatbot:context:${phone}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        try {
            // 1. Buscar cliente e dados vinculados
            const customer = await SuperbotRepository.findCustomerByPhone(phone);

            // 2. Buscar últimas mensagens
            const [messages] = await db().query(`
        SELECT 
          m.message_text,
          m.direction,
          m.message_type,
          m.received_at
        FROM superbot.messages m
        WHERE m.sender_phone = ? OR m.recipient_phone = ?
        ORDER BY m.received_at DESC
        LIMIT ?
      `, [phone, phone, maxMessages]);

            // Inverter para ordem cronológica
            const recentMessages = messages.reverse();

            // 3. Buscar estatísticas
            let stats = null;
            if (includeStats) {
                const [statsResult] = await db().query(`
          SELECT 
            COUNT(*) as total_messages,
            COUNT(DISTINCT session_id) as total_sessions,
            MIN(received_at) as first_contact,
            MAX(received_at) as last_contact,
            SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as messages_received,
            SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as messages_sent
          FROM superbot.messages
          WHERE sender_phone = ? OR recipient_phone = ?
        `, [phone, phone]);
                stats = statsResult[0];
            }

            // 4. Buscar dados do cliente vinculado (se existir)
            let linkedCustomer = null;
            const links = await SuperbotRepository.getCustomerLinks(customer?.id);
            if (links.length > 0) {
                const link = links[0];
                const [customerData] = await db().query(`
          SELECT 
            c.id,
            c.nome,
            c.cnpj,
            c.fone,
            c.email,
            c.vendedor,
            u.nick as seller_name,
            (SELECT COUNT(*) FROM mak.sCart WHERE cliente = c.id AND status >= 40) as total_orders,
            (SELECT SUM(total) FROM mak.sCart WHERE cliente = c.id AND status >= 40) as total_revenue
          FROM mak.clientes c
          LEFT JOIN mak.users u ON u.id = c.vendedor
          WHERE c.id = ?
        `, [link.leads_customer_id]);
                linkedCustomer = customerData[0] || null;
            }

            // 5. Gerar resumo com IA (se habilitado)
            let summary = null;
            let sentiment = null;
            if (includeSummary && recentMessages.length > 0) {
                try {
                    const conversationText = recentMessages
                        .map(m => `${m.direction === 'incoming' ? 'Cliente' : 'Bot'}: ${m.message_text}`)
                        .join('\n');

                    const analysis = await SuperbotAIService.analyzeConversation(conversationText);
                    summary = analysis.summary || null;
                    sentiment = analysis.sentiment || null;
                } catch (e) {
                    logger.warn('Erro ao gerar resumo da conversa', { error: e.message });
                }
            }

            // 6. Detectar intenções recentes
            let recentIntents = [];
            try {
                if (recentMessages.length > 0) {
                    const lastMessage = recentMessages[recentMessages.length - 1];
                    if (lastMessage.direction === 'incoming') {
                        const intentAnalysis = await SuperbotAIService.analyzeIntent(lastMessage.message_text);
                        recentIntents.push({
                            message: lastMessage.message_text.substring(0, 100),
                            intent: intentAnalysis.intent,
                            confidence: intentAnalysis.confidence
                        });
                    }
                }
            } catch (e) {
                // Silencioso
            }

            const context = {
                customer: {
                    phone,
                    name: customer?.name || customer?.push_name || null,
                    whatsapp_id: customer?.jid || null,
                    is_known: !!customer
                },
                linked_customer: linkedCustomer ? {
                    id: linkedCustomer.id,
                    name: linkedCustomer.nome,
                    cnpj: linkedCustomer.cnpj,
                    seller_name: linkedCustomer.seller_name,
                    total_orders: linkedCustomer.total_orders || 0,
                    total_revenue: linkedCustomer.total_revenue || 0
                } : null,
                conversation: {
                    messages: recentMessages.map(m => ({
                        role: m.direction === 'incoming' ? 'user' : 'assistant',
                        content: m.message_text,
                        timestamp: m.received_at
                    })),
                    summary,
                    sentiment,
                    total_in_context: recentMessages.length
                },
                stats: stats ? {
                    total_messages: stats.total_messages,
                    total_sessions: stats.total_sessions,
                    first_contact: stats.first_contact,
                    last_contact: stats.last_contact,
                    engagement_ratio: stats.messages_received > 0
                        ? (stats.messages_sent / stats.messages_received).toFixed(2)
                        : 0
                } : null,
                intents: recentIntents,
                metadata: {
                    generated_at: new Date().toISOString(),
                    channel: 'whatsapp',
                    source: 'superbot'
                }
            };

            // Cache por 2 minutos
            await cacheSet(cacheKey, context, 120);

            return context;
        } catch (error) {
            logger.error('Erro ao obter contexto enriquecido', { error: error.message, phone });
            throw error;
        }
    },

    /**
     * Registra evento de interação do WhatsApp para analytics
     */
    async logInteractionEvent(data) {
        const {
            userId,
            phone,
            sessionId,
            messageText,
            intent,
            confidence,
            entities = {},
            toolName = null,
            toolResult = null,
            status = 'OK'
        } = data;

        try {
            const [result] = await db().query(`
        INSERT INTO chat_interaction_event (
          tenant_id,
          user_id,
          conversation_id,
          channel,
          role,
          message_text,
          intent_key,
          confidence,
          entities_json,
          tool_name,
          tool_result_json,
          status,
          created_at
        ) VALUES (1, ?, ?, 'whatsapp', 'USER', ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
                userId,
                sessionId,
                messageText?.substring(0, 1000),
                intent,
                confidence,
                JSON.stringify(entities),
                toolName,
                toolResult ? JSON.stringify(toolResult) : null,
                status
            ]);

            logger.info('Evento de interação WhatsApp registrado', {
                id: result.insertId,
                phone,
                intent
            });

            return result.insertId;
        } catch (error) {
            // Tabela pode não existir - log e continua
            logger.warn('Não foi possível registrar evento de interação', { error: error.message });
            return null;
        }
    },

    /**
     * Valida desconto solicitado via WhatsApp
     * Usa as mesmas regras do Policy Guardian do chatbot
     */
    async validateDiscount(phone, discountRequest) {
        const { productId, requestedDiscount, quantity = 1 } = discountRequest;

        try {
            // Buscar cliente vinculado
            const customer = await SuperbotRepository.findCustomerByPhone(phone);
            const links = await SuperbotRepository.getCustomerLinks(customer?.id);

            if (!links.length) {
                return {
                    approved: false,
                    reason: 'Cliente não vinculado a cadastro. Não é possível calcular desconto.',
                    max_allowed: 0
                };
            }

            const leadsCustomerId = links[0].leads_customer_id;

            // Buscar regras de desconto do cliente/produto
            const [policies] = await db().query(`
        SELECT 
          pp.max_discount,
          pp.requires_approval,
          pp.approval_level,
          c.limite_desconto as customer_discount_limit
        FROM mak.clientes c
        LEFT JOIN staging.product_policies pp ON pp.product_id = ?
        WHERE c.id = ?
      `, [productId, leadsCustomerId]);

            const policy = policies[0];

            if (!policy) {
                return {
                    approved: false,
                    reason: 'Política de desconto não encontrada.',
                    max_allowed: 0
                };
            }

            const maxAllowed = Math.min(
                policy.max_discount || 10,
                policy.customer_discount_limit || 15
            );

            if (requestedDiscount <= maxAllowed) {
                return {
                    approved: true,
                    reason: `Desconto de ${requestedDiscount}% aprovado automaticamente.`,
                    max_allowed: maxAllowed,
                    requires_approval: false
                };
            }

            if (policy.requires_approval) {
                return {
                    approved: false,
                    reason: `Desconto de ${requestedDiscount}% requer aprovação. Máximo automático: ${maxAllowed}%.`,
                    max_allowed: maxAllowed,
                    requires_approval: true,
                    approval_level: policy.approval_level
                };
            }

            return {
                approved: false,
                reason: `Desconto máximo permitido: ${maxAllowed}%. Solicitado: ${requestedDiscount}%.`,
                max_allowed: maxAllowed,
                requires_approval: false
            };
        } catch (error) {
            logger.error('Erro ao validar desconto', { error: error.message });
            return {
                approved: false,
                reason: 'Erro ao validar desconto.',
                max_allowed: 0,
                error: error.message
            };
        }
    },

    /**
     * Formata contexto para prompt do chatbot
     */
    formatContextForPrompt(context) {
        let prompt = '';

        // Dados do cliente
        if (context.customer?.is_known) {
            prompt += `\n## Dados do Cliente WhatsApp\n`;
            prompt += `- Nome: ${context.customer.name || 'Não informado'}\n`;
            prompt += `- Telefone: ${context.customer.phone}\n`;
        }

        // Cliente vinculado
        if (context.linked_customer) {
            prompt += `\n## Cliente Cadastrado\n`;
            prompt += `- Nome: ${context.linked_customer.name}\n`;
            prompt += `- CNPJ: ${context.linked_customer.cnpj || 'N/A'}\n`;
            prompt += `- Vendedor: ${context.linked_customer.seller_name || 'N/A'}\n`;
            prompt += `- Total de Pedidos: ${context.linked_customer.total_orders}\n`;
            prompt += `- Faturamento Total: R$ ${(context.linked_customer.total_revenue || 0).toLocaleString('pt-BR')}\n`;
        }

        // Estatísticas
        if (context.stats) {
            prompt += `\n## Estatísticas de Interação\n`;
            prompt += `- Total de mensagens: ${context.stats.total_messages}\n`;
            prompt += `- Total de sessões: ${context.stats.total_sessions}\n`;
            prompt += `- Primeiro contato: ${context.stats.first_contact}\n`;
            prompt += `- Último contato: ${context.stats.last_contact}\n`;
        }

        // Resumo da conversa
        if (context.conversation?.summary) {
            prompt += `\n## Resumo da Conversa\n`;
            prompt += context.conversation.summary + '\n';
        }

        // Sentimento
        if (context.conversation?.sentiment) {
            prompt += `\n## Análise de Sentimento\n`;
            prompt += `- Sentimento: ${context.conversation.sentiment}\n`;
        }

        // Intenções detectadas
        if (context.intents?.length > 0) {
            prompt += `\n## Intenções Detectadas\n`;
            context.intents.forEach(i => {
                prompt += `- ${i.intent} (${(i.confidence * 100).toFixed(0)}%)\n`;
            });
        }

        // Histórico de mensagens
        if (context.conversation?.messages?.length > 0) {
            prompt += `\n## Últimas Mensagens\n`;
            context.conversation.messages.forEach(m => {
                const role = m.role === 'user' ? 'Cliente' : 'Assistente';
                prompt += `[${role}]: ${m.content}\n`;
            });
        }

        return prompt;
    }
};

export default SuperbotChatbotService;
