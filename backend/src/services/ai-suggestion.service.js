/**
 * AI Suggestion Service
 * 
 * Serviço para geração de sugestões de mensagens usando IA (OpenAI)
 * Integra contexto do lead, histórico de mensagens e perfil do cliente
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import OpenAI from 'openai';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

class AISuggestionService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.WHATSAPP_AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
        this.maxContextMessages = 10; // Últimas 10 mensagens para contexto
        this.cacheEnabled = true;
        this.cacheTTL = 5 * 60 * 1000; // 5 minutos
        this.suggestionCache = new Map();
    }

    /**
     * Gera sugestões de mensagem baseadas no contexto
     * @param {Object} params - Parâmetros para geração
     * @param {string} params.phone - Telefone do destinatário
     * @param {number} params.leadId - ID do lead (opcional)
     * @param {number} params.customerId - ID do cliente (opcional)
     * @param {Array} params.lastMessages - Últimas mensagens (opcional)
     * @param {string} params.context - Contexto adicional (opcional)
     * @param {string} params.intent - Intenção da mensagem (opcional)
     * @returns {Promise<Array>} Lista de sugestões
     */
    async generateSuggestions(params) {
        const { phone, leadId, customerId, lastMessages, context, intent } = params;

        try {
            // Verificar cache
            const cacheKey = this.getCacheKey(params);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug('AI suggestion cache hit', { cacheKey });
                return cached;
            }

            // Construir contexto completo
            const fullContext = await this.buildContext({
                phone,
                leadId,
                customerId,
                lastMessages,
                additionalContext: context
            });

            // Gerar prompt baseado na intenção
            const systemPrompt = this.buildSystemPrompt(intent);
            const userPrompt = this.buildUserPrompt(fullContext, intent);

            // Chamar OpenAI
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: 'json_object' }
            });

            // Parsear resposta
            const responseContent = completion.choices[0]?.message?.content;
            const suggestions = this.parseResponse(responseContent);

            // Cachear resultado
            this.setCache(cacheKey, suggestions);

            // Log métricas
            logger.info('AI suggestions generated', {
                phone,
                leadId,
                suggestionsCount: suggestions.length,
                model: this.model,
                tokensUsed: completion.usage?.total_tokens
            });

            return suggestions;

        } catch (error) {
            logger.error('Failed to generate AI suggestions', {
                error: error.message,
                phone,
                leadId
            });

            // Retornar sugestões padrão em caso de erro
            return this.getDefaultSuggestions(intent);
        }
    }

    /**
     * Constrói contexto completo para a IA
     */
    async buildContext({ phone, leadId, customerId, lastMessages, additionalContext }) {
        const context = {
            phone,
            timestamp: new Date().toISOString(),
            additionalContext: additionalContext || null
        };

        // Buscar dados do lead
        if (leadId) {
            context.lead = await this.getLeadContext(leadId);
        }

        // Buscar dados do cliente
        if (customerId) {
            context.customer = await this.getCustomerContext(customerId);
        } else if (context.lead?.customerId) {
            context.customer = await this.getCustomerContext(context.lead.customerId);
        }

        // Histórico de mensagens
        if (lastMessages && lastMessages.length > 0) {
            context.recentMessages = lastMessages.slice(-this.maxContextMessages);
        } else if (phone) {
            context.recentMessages = await this.getRecentMessages(phone);
        }

        return context;
    }

    /**
     * Obtém contexto do lead
     */
    async getLeadContext(leadId) {
        try {
            const db = getDatabase();
            const [leads] = await db.query(`
                SELECT 
                    l.id,
                    l.tipo_lead,
                    l.status,
                    l.valor_total,
                    l.data_cadastro,
                    l.ultima_atualizacao,
                    l.origem,
                    l.observacoes,
                    c.nome as customer_name,
                    c.id as customer_id,
                    c.fone as customer_phone,
                    c.email as customer_email,
                    c.cidade as customer_city,
                    c.uf as customer_state,
                    u.nome as seller_name
                FROM mak.leads l
                LEFT JOIN mak.clientes c ON l.customer_id = c.id
                LEFT JOIN mak.usuarios u ON l.vendedor_id = u.id
                WHERE l.id = ?
                LIMIT 1
            `, [leadId]);

            if (leads.length === 0) return null;

            const lead = leads[0];

            // Buscar produtos do lead
            const [products] = await db.query(`
                SELECT 
                    lp.quantidade,
                    lp.valor_unitario,
                    lp.valor_total,
                    p.codigo,
                    p.descricao
                FROM mak.lead_produtos lp
                LEFT JOIN mak.produtos p ON lp.produto_id = p.id
                WHERE lp.lead_id = ?
                LIMIT 10
            `, [leadId]);

            return {
                id: lead.id,
                type: lead.tipo_lead,
                status: lead.status,
                totalValue: lead.valor_total,
                createdAt: lead.data_cadastro,
                updatedAt: lead.ultima_atualizacao,
                origin: lead.origem,
                notes: lead.observacoes,
                customerId: lead.customer_id,
                customerName: lead.customer_name,
                customerCity: lead.customer_city,
                customerState: lead.customer_state,
                sellerName: lead.seller_name,
                products: products.map(p => ({
                    code: p.codigo,
                    description: p.descricao,
                    quantity: p.quantidade,
                    unitPrice: p.valor_unitario,
                    totalPrice: p.valor_total
                }))
            };
        } catch (error) {
            logger.error('Failed to get lead context', { leadId, error: error.message });
            return null;
        }
    }

    /**
     * Obtém contexto do cliente
     */
    async getCustomerContext(customerId) {
        try {
            const db = getDatabase();
            const [customers] = await db.query(`
                SELECT 
                    c.id,
                    c.nome,
                    c.fantasia,
                    c.cnpj,
                    c.email,
                    c.fone,
                    c.cidade,
                    c.uf,
                    c.segmento,
                    c.data_cadastro,
                    c.ultima_compra,
                    (SELECT COUNT(*) FROM mak.pedidos WHERE cliente_id = c.id) as total_orders,
                    (SELECT SUM(valor_total) FROM mak.pedidos WHERE cliente_id = c.id AND status = 'FATURADO') as total_purchased
                FROM mak.clientes c
                WHERE c.id = ?
                LIMIT 1
            `, [customerId]);

            if (customers.length === 0) return null;

            const customer = customers[0];
            return {
                id: customer.id,
                name: customer.nome,
                tradeName: customer.fantasia,
                document: customer.cnpj,
                email: customer.email,
                phone: customer.fone,
                city: customer.cidade,
                state: customer.uf,
                segment: customer.segmento,
                registeredAt: customer.data_cadastro,
                lastPurchase: customer.ultima_compra,
                totalOrders: customer.total_orders || 0,
                totalPurchased: customer.total_purchased || 0
            };
        } catch (error) {
            logger.error('Failed to get customer context', { customerId, error: error.message });
            return null;
        }
    }

    /**
     * Obtém mensagens recentes do superbot
     */
    async getRecentMessages(phone) {
        try {
            const db = getDatabase();

            // Formatar telefone para busca
            const cleanPhone = phone.replace(/\D/g, '');
            const phonePatterns = [
                cleanPhone,
                `55${cleanPhone}`,
                cleanPhone.replace(/^55/, '')
            ];

            const placeholders = phonePatterns.map(() => '?').join(',');

            const [messages] = await db.query(`
                SELECT 
                    m.body as content,
                    m.timestamp,
                    m.from_me,
                    m.ia as is_ai,
                    m.type as message_type
                FROM superbot.messages m
                WHERE (
                    m.sender_phone IN (${placeholders})
                    OR m.receiver_phone IN (${placeholders})
                )
                ORDER BY m.timestamp DESC
                LIMIT ?
            `, [...phonePatterns, ...phonePatterns, this.maxContextMessages]);

            return messages.map(m => ({
                content: m.content,
                timestamp: m.timestamp,
                isFromMe: m.from_me,
                isAI: m.is_ai,
                type: m.message_type
            })).reverse(); // Ordenar do mais antigo para o mais recente
        } catch (error) {
            logger.error('Failed to get recent messages', { phone, error: error.message });
            return [];
        }
    }

    /**
     * Constrói o prompt do sistema
     */
    buildSystemPrompt(intent) {
        const basePrompt = `Você é um assistente de vendas especializado em ajudar vendedores a escrever mensagens WhatsApp eficazes para clientes.

Sua função é gerar sugestões de mensagens que sejam:
- Profissionais mas amigáveis
- Personalizadas com base no contexto do cliente
- Objetivas e diretas
- Apropriadas para WhatsApp (mensagens curtas e claras)
- Em português brasileiro

Responda SEMPRE no formato JSON com a seguinte estrutura:
{
    "suggestions": [
        {
            "text": "Texto da mensagem sugerida",
            "intent": "tipo_da_intencao",
            "confidence": 0.95,
            "shortLabel": "Rótulo curto para o botão"
        }
    ]
}

Gere entre 2 e 4 sugestões variadas.`;

        const intentPrompts = {
            greeting: `\nFOCO: Gere mensagens de saudação e abertura de conversa.`,
            follow_up: `\nFOCO: Gere mensagens de follow-up para retomar contato com o cliente.`,
            offer_discount: `\nFOCO: Gere mensagens oferecendo condições especiais ou descontos.`,
            send_proposal: `\nFOCO: Gere mensagens para enviar ou acompanhar propostas comerciais.`,
            close_deal: `\nFOCO: Gere mensagens para fechar negociação e confirmar pedido.`,
            objection: `\nFOCO: Gere mensagens para contornar objeções de preço ou prazo.`,
            payment: `\nFOCO: Gere mensagens sobre pagamento, cobrança ou condições de pagamento.`,
            shipping: `\nFOCO: Gere mensagens sobre entrega, prazo de envio ou logística.`
        };

        return basePrompt + (intentPrompts[intent] || '');
    }

    /**
     * Constrói o prompt do usuário
     */
    buildUserPrompt(context, intent) {
        let prompt = 'Gere sugestões de mensagens WhatsApp com base no seguinte contexto:\n\n';

        // Adicionar contexto do cliente
        if (context.customer) {
            prompt += `## CLIENTE\n`;
            prompt += `- Nome: ${context.customer.name || 'Não informado'}\n`;
            prompt += `- Cidade: ${context.customer.city || 'Não informada'}/${context.customer.state || ''}\n`;
            prompt += `- Segmento: ${context.customer.segment || 'Não informado'}\n`;
            prompt += `- Total de pedidos: ${context.customer.totalOrders}\n`;
            prompt += `- Total comprado: R$ ${(context.customer.totalPurchased || 0).toLocaleString('pt-BR')}\n`;

            if (context.customer.lastPurchase) {
                const lastPurchase = new Date(context.customer.lastPurchase);
                const daysSince = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));
                prompt += `- Última compra: há ${daysSince} dias\n`;
            }
            prompt += '\n';
        }

        // Adicionar contexto do lead
        if (context.lead) {
            prompt += `## LEAD/NEGOCIAÇÃO ATUAL\n`;
            prompt += `- Status: ${context.lead.status || 'Não definido'}\n`;
            prompt += `- Tipo: ${context.lead.type || 'Não definido'}\n`;
            prompt += `- Valor total: R$ ${(context.lead.totalValue || 0).toLocaleString('pt-BR')}\n`;
            prompt += `- Origem: ${context.lead.origin || 'Não informada'}\n`;

            if (context.lead.products && context.lead.products.length > 0) {
                prompt += `- Produtos de interesse:\n`;
                context.lead.products.slice(0, 5).forEach(p => {
                    prompt += `  * ${p.description} (${p.quantity}x R$ ${p.unitPrice?.toLocaleString('pt-BR') || '0'})\n`;
                });
            }

            if (context.lead.notes) {
                prompt += `- Observações: ${context.lead.notes.substring(0, 200)}\n`;
            }
            prompt += '\n';
        }

        // Adicionar histórico de mensagens
        if (context.recentMessages && context.recentMessages.length > 0) {
            prompt += `## ÚLTIMAS MENSAGENS DA CONVERSA\n`;
            context.recentMessages.slice(-5).forEach(m => {
                const sender = m.isFromMe ? 'VENDEDOR' : 'CLIENTE';
                const aiTag = m.isAI ? ' [IA]' : '';
                prompt += `[${sender}${aiTag}]: ${m.content?.substring(0, 200) || '...'}\n`;
            });
            prompt += '\n';
        }

        // Adicionar contexto adicional
        if (context.additionalContext) {
            prompt += `## CONTEXTO ADICIONAL\n`;
            prompt += context.additionalContext + '\n\n';
        }

        // Instruções específicas por intenção
        if (intent) {
            prompt += `## OBJETIVO\n`;
            prompt += `A mensagem deve focar em: ${this.getIntentDescription(intent)}\n\n`;
        }

        prompt += `Gere as sugestões de mensagens:`;

        return prompt;
    }

    /**
     * Retorna descrição da intenção
     */
    getIntentDescription(intent) {
        const descriptions = {
            greeting: 'Iniciar conversa de forma amigável',
            follow_up: 'Retomar contato e verificar interesse',
            offer_discount: 'Oferecer condições especiais para fechar negócio',
            send_proposal: 'Enviar ou dar seguimento a proposta comercial',
            close_deal: 'Confirmar pedido e fechar venda',
            objection: 'Contornar objeções do cliente',
            payment: 'Tratar questões de pagamento',
            shipping: 'Informar sobre entrega e logística'
        };
        return descriptions[intent] || intent;
    }

    /**
     * Parseia a resposta da OpenAI
     */
    parseResponse(responseContent) {
        try {
            const parsed = JSON.parse(responseContent);

            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                throw new Error('Invalid response format');
            }

            return parsed.suggestions.map((s, index) => ({
                id: `suggestion-${Date.now()}-${index}`,
                text: s.text || '',
                intent: s.intent || 'general',
                confidence: Math.min(1, Math.max(0, s.confidence || 0.8)),
                shortLabel: s.shortLabel || this.generateShortLabel(s.text || ''),
                generatedAt: new Date().toISOString()
            }));
        } catch (error) {
            logger.error('Failed to parse AI response', { error: error.message, responseContent });
            return this.getDefaultSuggestions();
        }
    }

    /**
     * Gera um rótulo curto para a sugestão
     */
    generateShortLabel(text) {
        if (text.length <= 30) return text;
        return text.substring(0, 27) + '...';
    }

    /**
     * Retorna sugestões padrão em caso de erro
     */
    getDefaultSuggestions(intent) {
        const defaults = {
            greeting: [
                { text: 'Olá! Tudo bem? Vi que você demonstrou interesse em nossos produtos. Posso ajudar?', intent: 'greeting', confidence: 0.7, shortLabel: 'Saudação inicial' },
                { text: 'Bom dia! 👋 Sou da equipe comercial. Gostaria de saber mais sobre nossas ofertas?', intent: 'greeting', confidence: 0.7, shortLabel: 'Apresentação' }
            ],
            follow_up: [
                { text: 'Olá! Passando para ver se teve oportunidade de analisar nossa proposta. Alguma dúvida?', intent: 'follow_up', confidence: 0.7, shortLabel: 'Retomar contato' },
                { text: 'Oi! Como ficou aquela negociação que conversamos? Posso ajudar com algo?', intent: 'follow_up', confidence: 0.7, shortLabel: 'Verificar status' }
            ],
            offer_discount: [
                { text: 'Tenho uma condição especial para fecharmos hoje! Posso compartilhar os detalhes?', intent: 'offer_discount', confidence: 0.7, shortLabel: 'Oferta especial' },
                { text: 'Consegui uma aprovação especial para sua negociação. Vamos conversar?', intent: 'offer_discount', confidence: 0.7, shortLabel: 'Desconto aprovado' }
            ],
            default: [
                { text: 'Olá! Como posso ajudar você hoje?', intent: 'general', confidence: 0.6, shortLabel: 'Como ajudar?' },
                { text: 'Oi! Estou à disposição para qualquer dúvida.', intent: 'general', confidence: 0.6, shortLabel: 'À disposição' },
                { text: 'Bom dia! Tem novidades sobre nosso assunto?', intent: 'general', confidence: 0.6, shortLabel: 'Novidades?' }
            ]
        };

        const suggestions = defaults[intent] || defaults.default;
        return suggestions.map((s, i) => ({
            id: `default-${Date.now()}-${i}`,
            ...s,
            generatedAt: new Date().toISOString()
        }));
    }

    /**
     * Gera chave de cache
     */
    getCacheKey(params) {
        const parts = [
            params.phone || '',
            params.leadId || '',
            params.customerId || '',
            params.intent || '',
            params.context || ''
        ];
        return parts.join('|');
    }

    /**
     * Obtém do cache
     */
    getFromCache(key) {
        if (!this.cacheEnabled) return null;

        const cached = this.suggestionCache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.suggestionCache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Salva no cache
     */
    setCache(key, data) {
        if (!this.cacheEnabled) return;

        this.suggestionCache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limpar cache antigo periodicamente
        if (this.suggestionCache.size > 1000) {
            this.cleanOldCache();
        }
    }

    /**
     * Limpa cache antigo
     */
    cleanOldCache() {
        const now = Date.now();
        for (const [key, value] of this.suggestionCache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.suggestionCache.delete(key);
            }
        }
    }

    /**
     * Compõe uma mensagem completa com base nos parâmetros
     * @param {Object} params - Parâmetros para composição
     * @returns {Promise<Object>} Mensagem composta
     */
    async composeMessage(params) {
        const { phone, leadId, customerId, template, variables, tone } = params;

        try {
            const context = await this.buildContext({ phone, leadId, customerId });

            const systemPrompt = `Você é um assistente especializado em composição de mensagens comerciais para WhatsApp.
Escreva uma mensagem única, personalizada e profissional.
Tom: ${tone || 'profissional e amigável'}
Responda no formato JSON: { "message": "texto da mensagem", "subject": "assunto resumido" }`;

            const userPrompt = template
                ? `Template base: "${template}"\nVariáveis disponíveis: ${JSON.stringify(variables || {})}\n\nContexto:\n${JSON.stringify(context, null, 2)}\n\nGere a mensagem personalizada:`
                : `Contexto:\n${JSON.stringify(context, null, 2)}\n\nGere uma mensagem adequada para este cliente:`;

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: 'json_object' }
            });

            const response = JSON.parse(completion.choices[0]?.message?.content || '{}');

            return {
                success: true,
                message: response.message || '',
                subject: response.subject || '',
                tokensUsed: completion.usage?.total_tokens || 0
            };

        } catch (error) {
            logger.error('Failed to compose message', { error: error.message });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Exportar instância singleton
export const aiSuggestionService = new AISuggestionService();
export default aiSuggestionService;
