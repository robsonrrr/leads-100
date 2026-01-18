/**
 * Superbot Service
 * 
 * Lógica de negócio para integração com Superbot
 * Análise de intenções, enriquecimento de contexto e criação automática de leads
 * 
 * @version 1.0
 * @date 2026-01-17
 */

import { SuperbotRepository } from '../repositories/superbot.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import logger from '../config/logger.js';

/**
 * Intenções detectáveis em mensagens
 */
export const SUPERBOT_INTENTS = {
    QUOTE_REQUEST: 'QUOTE_REQUEST',      // Pedido de cotação
    PRICE_CHECK: 'PRICE_CHECK',          // Consulta de preço
    STOCK_CHECK: 'STOCK_CHECK',          // Consulta de estoque
    ORDER_STATUS: 'ORDER_STATUS',        // Status do pedido
    COMPLAINT: 'COMPLAINT',              // Reclamação
    GENERAL_QUESTION: 'GENERAL_QUESTION', // Pergunta geral
    NEGOTIATION: 'NEGOTIATION',          // Negociação
    GREETING: 'GREETING',                // Saudação
    THANKS: 'THANKS',                    // Agradecimento
    UNKNOWN: 'UNKNOWN'                   // Desconhecido
};

/**
 * Sentimentos detectáveis
 */
export const SENTIMENT = {
    POSITIVE: 'positive',
    NEUTRAL: 'neutral',
    NEGATIVE: 'negative'
};

export const SuperbotService = {
    /**
     * Busca cliente do Superbot por telefone com informações enriquecidas
     */
    async findCustomerByPhone(phone) {
        try {
            const superbotCustomer = await SuperbotRepository.findCustomerByPhone(phone);

            if (!superbotCustomer) {
                return null;
            }

            // Buscar vínculo com leads-agent
            const links = await SuperbotRepository.getCustomerLinks(superbotCustomer.id);

            // Buscar estatísticas
            const stats = await SuperbotRepository.getCustomerStats(phone);

            return {
                ...superbotCustomer,
                links,
                stats,
                has_linked_customer: links.length > 0
            };
        } catch (error) {
            logger.error('Erro ao buscar cliente Superbot', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Lista clientes do Superbot com paginação e filtros
     */
    async listCustomers(options = {}) {
        try {
            return await SuperbotRepository.listCustomers(options);
        } catch (error) {
            logger.error('Erro ao listar clientes Superbot', { error: error.message });
            throw error;
        }
    },

    /**
     * Obtém histórico de conversas de um cliente
     */
    async getConversationHistory(phone, options = {}) {
        try {
            const customer = await SuperbotRepository.findCustomerByPhone(phone);
            const conversations = await SuperbotRepository.getConversations(phone, options);
            const stats = await SuperbotRepository.getCustomerStats(phone);

            return {
                customer,
                conversations,
                stats,
                summary: {
                    total_conversations: conversations.length,
                    total_messages: stats.total_messages,
                    last_contact: stats.last_message_at,
                    first_contact: stats.first_message_at
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar histórico de conversas', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Obtém mensagens de uma sessão específica
     */
    async getSessionMessages(sessionId, options = {}) {
        try {
            return await SuperbotRepository.getMessagesBySession(sessionId, options);
        } catch (error) {
            logger.error('Erro ao buscar mensagens da sessão', { sessionId, error: error.message });
            throw error;
        }
    },

    /**
     * Obtém estatísticas completas de um cliente
     */
    async getCustomerStats(phone) {
        try {
            const customer = await SuperbotRepository.findCustomerByPhone(phone);
            const stats = await SuperbotRepository.getCustomerStats(phone);
            const recentConversations = await SuperbotRepository.getConversations(phone, { days: 7 });

            return {
                customer,
                stats,
                recent_activity: {
                    conversations_last_7_days: recentConversations.length,
                    messages_last_7_days: recentConversations.reduce((sum, c) => sum + c.messages_count, 0)
                },
                engagement_level: this.calculateEngagementLevel(stats)
            };
        } catch (error) {
            logger.error('Erro ao buscar estatísticas do cliente', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Calcula nível de engajamento baseado em estatísticas
     */
    calculateEngagementLevel(stats) {
        if (!stats || !stats.total_messages) {
            return { level: 'none', score: 0 };
        }

        const now = new Date();
        const lastMessage = new Date(stats.last_message_at);
        const daysSinceLastMessage = Math.floor((now - lastMessage) / (1000 * 60 * 60 * 24));

        let score = 0;

        // Frequência de mensagens
        if (stats.avg_messages_per_session >= 10) score += 30;
        else if (stats.avg_messages_per_session >= 5) score += 20;
        else score += 10;

        // Recência
        if (daysSinceLastMessage <= 7) score += 40;
        else if (daysSinceLastMessage <= 30) score += 25;
        else if (daysSinceLastMessage <= 90) score += 10;

        // Volume total
        if (stats.total_sessions >= 10) score += 30;
        else if (stats.total_sessions >= 5) score += 20;
        else score += 10;

        let level;
        if (score >= 80) level = 'high';
        else if (score >= 50) level = 'medium';
        else if (score >= 20) level = 'low';
        else level = 'minimal';

        return { level, score, days_since_last_contact: daysSinceLastMessage };
    },

    /**
     * Obtém transcrições de áudio de um cliente
     */
    async getTranscriptions(phone, options = {}) {
        try {
            return await SuperbotRepository.getTranscriptions(phone, options);
        } catch (error) {
            logger.error('Erro ao buscar transcrições', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Busca sugestões de links entre clientes Superbot e leads-agent
     */
    async getSuggestedLinks(options = {}) {
        try {
            return await SuperbotRepository.findPotentialLinks(options);
        } catch (error) {
            logger.error('Erro ao buscar sugestões de links', { error: error.message });
            throw error;
        }
    },

    /**
     * Cria vínculo entre cliente Superbot e cliente leads-agent
     */
    async linkCustomers(superbotCustomerId, leadsCustomerId, options = {}) {
        try {
            // Verificar se cliente Superbot existe
            const superbotCustomer = await SuperbotRepository.getCustomerById(superbotCustomerId);
            if (!superbotCustomer) {
                throw new Error('Cliente Superbot não encontrado');
            }

            // Verificar se cliente leads-agent existe
            const leadsCustomer = await CustomerRepository.findById(leadsCustomerId);
            if (!leadsCustomer) {
                throw new Error('Cliente leads-agent não encontrado');
            }

            // Criar link
            await SuperbotRepository.createLink(superbotCustomerId, leadsCustomerId, options);

            logger.info('Link criado entre clientes', {
                superbotCustomerId,
                leadsCustomerId,
                superbotPhone: superbotCustomer.phone_number,
                leadsName: leadsCustomer.nome
            });

            return {
                success: true,
                superbot_customer: superbotCustomer,
                leads_customer: leadsCustomer
            };
        } catch (error) {
            logger.error('Erro ao vincular clientes', {
                superbotCustomerId,
                leadsCustomerId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Remove vínculo entre clientes
     */
    async unlinkCustomers(superbotCustomerId, leadsCustomerId) {
        try {
            const removed = await SuperbotRepository.removeLink(superbotCustomerId, leadsCustomerId);

            if (!removed) {
                throw new Error('Vínculo não encontrado');
            }

            logger.info('Link removido entre clientes', { superbotCustomerId, leadsCustomerId });
            return { success: true };
        } catch (error) {
            logger.error('Erro ao remover vínculo', {
                superbotCustomerId,
                leadsCustomerId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Busca cliente leads-agent vinculado a um cliente Superbot
     */
    async findLinkedLeadsCustomer(phone) {
        try {
            const superbotCustomer = await SuperbotRepository.findCustomerByPhone(phone);
            if (!superbotCustomer) {
                return null;
            }

            const links = await SuperbotRepository.getCustomerLinks(superbotCustomer.id);
            if (links.length === 0) {
                return null;
            }

            // Retornar o link verificado com maior confiança
            const bestLink = links.sort((a, b) => {
                if (a.verified !== b.verified) return b.verified ? 1 : -1;
                return b.confidence_score - a.confidence_score;
            })[0];

            const leadsCustomer = await CustomerRepository.findById(bestLink.leads_customer_id);

            return {
                superbot_customer: superbotCustomer,
                leads_customer: leadsCustomer,
                link: bestLink
            };
        } catch (error) {
            logger.error('Erro ao buscar cliente leads vinculado', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Analisa intenção de uma mensagem (básico, sem IA)
     * Para análise completa com IA, usar análise assíncrona
     */
    analyzeIntentBasic(messageText) {
        if (!messageText) {
            return { intent: SUPERBOT_INTENTS.UNKNOWN, confidence: 0 };
        }

        const text = messageText.toLowerCase().trim();

        // Padrões de intenção
        const patterns = {
            [SUPERBOT_INTENTS.QUOTE_REQUEST]: [
                /cota[çc][aã]o/i,
                /preciso de (\d+|um|uma|alguns)/i,
                /quero comprar/i,
                /fazer pedido/i,
                /quanto custa/i,
                /qual o pre[çc]o/i,
                /me passa o valor/i,
                /voc[êe]s tem/i
            ],
            [SUPERBOT_INTENTS.PRICE_CHECK]: [
                /pre[çc]o/i,
                /valor/i,
                /quanto/i,
                /tabela/i
            ],
            [SUPERBOT_INTENTS.STOCK_CHECK]: [
                /estoque/i,
                /tem dispon[íi]vel/i,
                /tem em estoque/i,
                /disponibilidade/i
            ],
            [SUPERBOT_INTENTS.ORDER_STATUS]: [
                /status.*pedido/i,
                /meu pedido/i,
                /onde está/i,
                /previs[aã]o de entrega/i,
                /quando chega/i
            ],
            [SUPERBOT_INTENTS.COMPLAINT]: [
                /reclama[çc][aã]o/i,
                /problema/i,
                /defeito/i,
                /n[aã]o funciona/i,
                /insatisfeito/i,
                /errado/i
            ],
            [SUPERBOT_INTENTS.NEGOTIATION]: [
                /desconto/i,
                /negociar/i,
                /melhor pre[çc]o/i,
                /condi[çc][aã]o especial/i,
                /baixar o valor/i
            ],
            [SUPERBOT_INTENTS.GREETING]: [
                /^(oi|ol[áa]|bom dia|boa tarde|boa noite|e a[íi])/i
            ],
            [SUPERBOT_INTENTS.THANKS]: [
                /obrigad[oa]/i,
                /valeu/i,
                /agrade[çc]o/i
            ]
        };

        // Verificar cada padrão
        for (const [intent, regexList] of Object.entries(patterns)) {
            for (const regex of regexList) {
                if (regex.test(text)) {
                    // Confiança baseada no tamanho do match
                    const match = text.match(regex);
                    const confidence = match ? Math.min(0.95, 0.7 + (match[0].length / text.length) * 0.3) : 0.7;

                    return {
                        intent,
                        confidence: Math.round(confidence * 100) / 100,
                        matched_pattern: regex.toString()
                    };
                }
            }
        }

        return {
            intent: SUPERBOT_INTENTS.GENERAL_QUESTION,
            confidence: 0.5
        };
    },

    /**
     * Analisa sentimento de uma mensagem (básico)
     */
    analyzeSentimentBasic(messageText) {
        if (!messageText) {
            return { sentiment: SENTIMENT.NEUTRAL, score: 0 };
        }

        const text = messageText.toLowerCase();

        const positiveWords = [
            'obrigado', 'obrigada', 'excelente', 'ótimo', 'perfeito',
            'maravilhoso', 'adorei', 'amei', 'parabéns', 'satisfeito',
            'recomendo', 'agradeço', 'top', 'show'
        ];

        const negativeWords = [
            'ruim', 'péssimo', 'horrível', 'problema', 'defeito',
            'insatisfeito', 'decepcionado', 'absurdo', 'vergonha',
            'nunca mais', 'não funciona', 'errado', 'atraso'
        ];

        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of positiveWords) {
            if (text.includes(word)) positiveCount++;
        }

        for (const word of negativeWords) {
            if (text.includes(word)) negativeCount++;
        }

        const score = positiveCount - negativeCount;

        if (score > 0) {
            return { sentiment: SENTIMENT.POSITIVE, score: Math.min(score * 0.3, 1) };
        } else if (score < 0) {
            return { sentiment: SENTIMENT.NEGATIVE, score: Math.max(score * 0.3, -1) };
        }

        return { sentiment: SENTIMENT.NEUTRAL, score: 0 };
    },

    /**
     * Analisa sentimento geral de um cliente baseado em histórico
     */
    async analyzeCustomerSentiment(phone, options = {}) {
        try {
            const { days = 30, limit = 50 } = options;

            const messages = await SuperbotRepository.getMessagesByPhone(phone, {
                days,
                limit,
                direction: 'incoming'
            });

            if (messages.length === 0) {
                return {
                    sentiment: SENTIMENT.NEUTRAL,
                    score: 0,
                    confidence: 0,
                    analyzed_messages: 0
                };
            }

            let totalScore = 0;
            let analyzedCount = 0;

            for (const message of messages) {
                const text = message.message_text || message.transcription_text;
                if (text) {
                    const analysis = this.analyzeSentimentBasic(text);
                    totalScore += analysis.score;
                    analyzedCount++;
                }
            }

            const avgScore = analyzedCount > 0 ? totalScore / analyzedCount : 0;

            let sentiment;
            if (avgScore > 0.2) sentiment = SENTIMENT.POSITIVE;
            else if (avgScore < -0.2) sentiment = SENTIMENT.NEGATIVE;
            else sentiment = SENTIMENT.NEUTRAL;

            return {
                sentiment,
                score: Math.round(avgScore * 100) / 100,
                confidence: Math.min(0.5 + (analyzedCount / 50) * 0.5, 0.95),
                analyzed_messages: analyzedCount,
                total_messages: messages.length
            };
        } catch (error) {
            logger.error('Erro ao analisar sentimento do cliente', { phone, error: error.message });
            throw error;
        }
    },

    /**
     * Obtém contexto enriquecido para uso no chatbot
     */
    async getEnrichedContext(phone) {
        try {
            const customer = await this.findCustomerByPhone(phone);
            if (!customer) {
                return null;
            }

            const [
                conversations,
                sentiment,
                transcriptions
            ] = await Promise.all([
                SuperbotRepository.getConversations(phone, { days: 7, limit: 10 }),
                this.analyzeCustomerSentiment(phone, { days: 30 }),
                SuperbotRepository.getTranscriptions(phone, { days: 7, limit: 5 })
            ]);

            // Resumo das últimas mensagens
            const recentMessages = await SuperbotRepository.getMessagesByPhone(phone, {
                days: 7,
                limit: 20
            });

            const messagesSummary = recentMessages
                .filter(m => m.message_text || m.transcription_text)
                .slice(0, 10)
                .map(m => ({
                    direction: m.direction,
                    text: (m.message_text || m.transcription_text).substring(0, 200),
                    timestamp: m.received_at
                }));

            return {
                customer,
                recent_conversations: conversations.length,
                sentiment,
                last_messages: messagesSummary,
                transcriptions_available: transcriptions.length,
                context_generated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Erro ao gerar contexto enriquecido', { phone, error: error.message });
            throw error;
        }
    },

    // ==========================================
    // SELLER PHONES - Vincular telefones a vendedores
    // ==========================================

    /**
     * Lista todos os telefones de vendedores
     */
    async listSellerPhones() {
        try {
            return await SuperbotRepository.listSellerPhones();
        } catch (error) {
            logger.error('Erro ao listar telefones de vendedores', { error: error.message });
            throw error;
        }
    },

    /**
     * Busca telefones de um vendedor específico
     */
    async getSellerPhones(userId) {
        try {
            return await SuperbotRepository.getSellerPhones(userId);
        } catch (error) {
            logger.error('Erro ao buscar telefones do vendedor', { userId, error: error.message });
            throw error;
        }
    },

    /**
     * Adiciona telefone a um vendedor
     */
    async addSellerPhone(userId, phoneNumber, options = {}) {
        try {
            const result = await SuperbotRepository.addSellerPhone(userId, phoneNumber, options);
            logger.info('Telefone vinculado ao vendedor', { userId, phoneNumber });
            return result;
        } catch (error) {
            logger.error('Erro ao adicionar telefone de vendedor', { userId, phoneNumber, error: error.message });
            throw error;
        }
    },

    /**
     * Remove telefone de vendedor
     */
    async removeSellerPhone(phoneNumber) {
        try {
            const removed = await SuperbotRepository.removeSellerPhone(phoneNumber);
            if (removed) {
                logger.info('Telefone removido de vendedor', { phoneNumber });
            }
            return removed;
        } catch (error) {
            logger.error('Erro ao remover telefone de vendedor', { phoneNumber, error: error.message });
            throw error;
        }
    },

    /**
     * Busca vendedor pelo telefone do bot
     */
    async getSellerByPhone(phoneNumber) {
        try {
            return await SuperbotRepository.getSellerByPhone(phoneNumber);
        } catch (error) {
            logger.error('Erro ao buscar vendedor por telefone', { phoneNumber, error: error.message });
            throw error;
        }
    },

    /**
     * Lista clientes filtrados por vendedor (para usuários level < 4)
     */
    async listCustomersBySeller(userId, options = {}) {
        try {
            return await SuperbotRepository.listCustomersBySeller(userId, options);
        } catch (error) {
            logger.error('Erro ao listar clientes por vendedor', { userId, error: error.message });
            throw error;
        }
    },

    /**
     * Busca mensagens filtradas por vendedor
     */
    async getMessagesBySeller(userId, options = {}) {
        try {
            return await SuperbotRepository.getMessagesBySeller(userId, options);
        } catch (error) {
            logger.error('Erro ao buscar mensagens por vendedor', { userId, error: error.message });
            throw error;
        }
    }
};

export default SuperbotService;
