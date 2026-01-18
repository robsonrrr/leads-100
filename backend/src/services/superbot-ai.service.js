/**
 * Superbot OpenAI Integration Service
 * 
 * Usa OpenAI GPT para análise avançada de intenção e extração de entidades
 * nas mensagens do WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import OpenAI from 'openai';
import { CacheService } from './cache.service.js';
import logger from '../config/logger.js';

// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Cache TTL para análises (evitar chamadas repetidas)
const CACHE_TTL = 3600; // 1 hora

// Intenções disponíveis
export const INTENTS = {
    QUOTE_REQUEST: 'QUOTE_REQUEST',           // Pedido de cotação
    PRICE_CHECK: 'PRICE_CHECK',               // Consulta de preço
    STOCK_CHECK: 'STOCK_CHECK',               // Consulta de estoque
    ORDER_STATUS: 'ORDER_STATUS',             // Status do pedido
    COMPLAINT: 'COMPLAINT',                   // Reclamação
    GENERAL_QUESTION: 'GENERAL_QUESTION',     // Pergunta geral
    NEGOTIATION: 'NEGOTIATION',               // Negociação de desconto
    PRODUCT_INFO: 'PRODUCT_INFO',             // Informação sobre produto
    PURCHASE_INTENT: 'PURCHASE_INTENT',       // Intenção de compra
    RETURN_REQUEST: 'RETURN_REQUEST',         // Solicitação de devolução
    TECHNICAL_SUPPORT: 'TECHNICAL_SUPPORT',   // Suporte técnico
    GREETING: 'GREETING',                     // Saudação
    THANKS: 'THANKS',                         // Agradecimento
    GOODBYE: 'GOODBYE',                       // Despedida
    UNKNOWN: 'UNKNOWN'                        // Desconhecido
};

// Prompt de sistema para análise de intenção
const SYSTEM_PROMPT = `Você é um assistente especializado em análise de mensagens de clientes de uma distribuidora de rolamentos e peças industriais (Rolemak).

Sua tarefa é analisar mensagens de clientes do WhatsApp e identificar:
1. A INTENÇÃO principal da mensagem
2. As ENTIDADES mencionadas (produtos, quantidades, valores, datas)
3. O SENTIMENTO geral (positivo, neutro, negativo)
4. A URGÊNCIA percebida (baixa, média, alta)

INTENÇÕES DISPONÍVEIS:
- QUOTE_REQUEST: Cliente pedindo cotação/orçamento
- PRICE_CHECK: Consulta de preço específico
- STOCK_CHECK: Verificação de disponibilidade/estoque
- ORDER_STATUS: Pergunta sobre status de pedido
- COMPLAINT: Reclamação ou insatisfação
- GENERAL_QUESTION: Perguntas gerais
- NEGOTIATION: Pedido de desconto ou negociação
- PRODUCT_INFO: Pedido de informações técnicas sobre produto
- PURCHASE_INTENT: Expressa intenção clara de comprar
- RETURN_REQUEST: Solicitação de devolução ou troca
- TECHNICAL_SUPPORT: Problema técnico com produto
- GREETING: Apenas saudação (oi, bom dia)
- THANKS: Agradecimento
- GOODBYE: Despedida
- UNKNOWN: Não foi possível identificar

PRODUTOS COMUNS:
- Rolamentos (6204, 6205, 6206, etc.)
- Correias (A, B, C, etc.)
- Retentores
- Mancais
- Polias
- Acoplamentos

RESPONDA SEMPRE EM JSON com o seguinte formato:
{
  "intent": "NOME_DA_INTENCAO",
  "confidence": 0.0 a 1.0,
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "medium" | "high",
  "entities": {
    "products": [{"query": "texto do produto", "quantity": numero ou null}],
    "values": ["R$ X,XX"],
    "dates": ["data mencionada"],
    "order_numbers": ["numero do pedido"]
  },
  "summary": "Resumo em uma frase do que o cliente quer"
}`;

export const SuperbotAIService = {
    /**
     * Analisa a intenção de uma mensagem usando OpenAI
     */
    async analyzeIntent(message, options = {}) {
        const {
            useCache = true,
            contextMessages = [],
            customerName = null
        } = options;

        if (!message || message.trim().length < 2) {
            return {
                intent: INTENTS.UNKNOWN,
                confidence: 0,
                sentiment: 'neutral',
                urgency: 'low',
                entities: {},
                summary: 'Mensagem vazia ou muito curta'
            };
        }

        // Verificar cache
        const cacheKey = `superbot:ai:intent:${Buffer.from(message).toString('base64').slice(0, 50)}`;
        if (useCache) {
            const cached = await CacheService.get(cacheKey);
            if (cached) {
                logger.debug('Cache hit para análise de intenção');
                return cached;
            }
        }

        try {
            // Construir contexto
            let userMessage = message;

            if (contextMessages.length > 0) {
                const contextStr = contextMessages
                    .slice(-5) // Últimas 5 mensagens de contexto
                    .map((m, i) => `[${m.direction}] ${m.text}`)
                    .join('\n');
                userMessage = `CONTEXTO DAS MENSAGENS ANTERIORES:\n${contextStr}\n\nMENSAGEM ATUAL PARA ANALISAR:\n${message}`;
            }

            if (customerName) {
                userMessage = `[Cliente: ${customerName}]\n\n${userMessage}`;
            }

            // Chamar OpenAI
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                max_tokens: 500,
                response_format: { type: 'json_object' }
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('Resposta vazia da OpenAI');
            }

            const result = JSON.parse(responseText);

            // Validar e normalizar resultado
            const normalizedResult = {
                intent: INTENTS[result.intent] || INTENTS.UNKNOWN,
                confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
                sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment)
                    ? result.sentiment
                    : 'neutral',
                urgency: ['low', 'medium', 'high'].includes(result.urgency)
                    ? result.urgency
                    : 'low',
                entities: {
                    products: Array.isArray(result.entities?.products) ? result.entities.products : [],
                    values: Array.isArray(result.entities?.values) ? result.entities.values : [],
                    dates: Array.isArray(result.entities?.dates) ? result.entities.dates : [],
                    order_numbers: Array.isArray(result.entities?.order_numbers) ? result.entities.order_numbers : []
                },
                summary: result.summary || 'Análise concluída',
                tokens_used: completion.usage?.total_tokens || 0,
                model: completion.model,
                analyzed_at: new Date().toISOString()
            };

            // Salvar no cache
            if (useCache) {
                await CacheService.set(cacheKey, normalizedResult, CACHE_TTL);
            }

            logger.info('Análise de intenção concluída', {
                intent: normalizedResult.intent,
                confidence: normalizedResult.confidence,
                tokens: normalizedResult.tokens_used
            });

            return normalizedResult;
        } catch (error) {
            logger.error('Erro na análise de intenção com OpenAI', {
                error: error.message,
                message: message.substring(0, 100)
            });

            // Fallback para análise básica
            return this.analyzeIntentBasic(message);
        }
    },

    /**
     * Análise básica de intenção (fallback sem IA)
     */
    analyzeIntentBasic(message) {
        if (!message) {
            return { intent: INTENTS.UNKNOWN, confidence: 0, sentiment: 'neutral', urgency: 'low' };
        }

        const text = message.toLowerCase().trim();

        // Padrões de intenção
        const patterns = {
            [INTENTS.QUOTE_REQUEST]: [
                /cota[çc][aã]o/i, /or[çc]amento/i, /preciso de \d+/i, /quero comprar/i,
                /fazer pedido/i, /me passa.*valor/i, /voc[êe]s tem/i
            ],
            [INTENTS.PRICE_CHECK]: [
                /pre[çc]o/i, /quanto.*custa/i, /qual.*valor/i, /tabela/i
            ],
            [INTENTS.STOCK_CHECK]: [
                /estoque/i, /tem dispon[íi]vel/i, /disponibilidade/i
            ],
            [INTENTS.ORDER_STATUS]: [
                /meu pedido/i, /status.*pedido/i, /onde est[áa]/i, /quando chega/i,
                /previs[aã]o.*entrega/i, /rastrear/i
            ],
            [INTENTS.COMPLAINT]: [
                /reclama[çc][aã]o/i, /problema/i, /defeito/i, /n[aã]o funciona/i,
                /insatisfeito/i, /errado/i, /absurdo/i
            ],
            [INTENTS.NEGOTIATION]: [
                /desconto/i, /negociar/i, /melhor pre[çc]o/i, /condi[çc][aã]o especial/i
            ],
            [INTENTS.PURCHASE_INTENT]: [
                /quero \d+/i, /preciso.*urgente/i, /fechar.*pedido/i, /confirma.*pedido/i
            ],
            [INTENTS.GREETING]: [
                /^(oi|ol[áa]|bom dia|boa tarde|boa noite|e a[íi])\b/i
            ],
            [INTENTS.THANKS]: [
                /obrigad[oa]/i, /valeu/i, /agrade[çc]o/i
            ],
            [INTENTS.GOODBYE]: [
                /tchau/i, /at[ée] mais/i, /at[ée] logo/i
            ]
        };

        for (const [intent, regexList] of Object.entries(patterns)) {
            for (const regex of regexList) {
                if (regex.test(text)) {
                    return {
                        intent,
                        confidence: 0.7,
                        sentiment: intent === INTENTS.COMPLAINT ? 'negative' : 'neutral',
                        urgency: intent === INTENTS.PURCHASE_INTENT ? 'high' : 'low',
                        entities: {},
                        summary: 'Análise básica (fallback)'
                    };
                }
            }
        }

        return {
            intent: INTENTS.GENERAL_QUESTION,
            confidence: 0.5,
            sentiment: 'neutral',
            urgency: 'low',
            entities: {},
            summary: 'Não foi possível determinar intenção específica'
        };
    },

    /**
     * Analisa múltiplas mensagens para determinar intenção geral da conversa
     */
    async analyzeConversation(messages, options = {}) {
        if (!messages || messages.length === 0) {
            return {
                intent: INTENTS.UNKNOWN,
                confidence: 0,
                sentiment: 'neutral',
                summary: 'Nenhuma mensagem para analisar'
            };
        }

        // Filtrar apenas mensagens incoming (do cliente)
        const clientMessages = messages
            .filter(m => m.direction === 'incoming' && m.message_text)
            .slice(-10); // Últimas 10

        if (clientMessages.length === 0) {
            return {
                intent: INTENTS.UNKNOWN,
                confidence: 0,
                sentiment: 'neutral',
                summary: 'Nenhuma mensagem do cliente encontrada'
            };
        }

        // Concatenar mensagens
        const combinedText = clientMessages
            .map(m => m.message_text)
            .join('\n---\n');

        // Usar análise de intenção com contexto
        return await this.analyzeIntent(combinedText, {
            useCache: false, // Não cachear análise de conversa
            ...options
        });
    },

    /**
     * Detecta se a mensagem indica intenção de compra
     */
    async detectPurchaseIntent(message, options = {}) {
        const analysis = await this.analyzeIntent(message, options);

        const purchaseIntents = [
            INTENTS.QUOTE_REQUEST,
            INTENTS.PURCHASE_INTENT,
            INTENTS.PRICE_CHECK
        ];

        return {
            is_purchase_intent: purchaseIntents.includes(analysis.intent),
            intent: analysis.intent,
            confidence: analysis.confidence,
            products: analysis.entities?.products || [],
            should_create_lead: purchaseIntents.includes(analysis.intent) && analysis.confidence >= 0.7
        };
    },

    /**
     * Gera resumo da conversa para contexto do chatbot
     */
    async generateConversationSummary(messages, options = {}) {
        if (!messages || messages.length === 0) {
            return null;
        }

        const conversationText = messages
            .slice(-20)
            .map(m => `[${m.direction === 'incoming' ? 'Cliente' : 'Bot'}] ${m.message_text || '[mídia]'}`)
            .join('\n');

        try {
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente que resume conversas de WhatsApp entre clientes e uma empresa de rolamentos. Faça um resumo conciso focando em: o que o cliente quer, produtos mencionados, e qualquer problema relatado.'
                    },
                    {
                        role: 'user',
                        content: `Resuma esta conversa em no máximo 3 frases:\n\n${conversationText}`
                    }
                ],
                temperature: 0.5,
                max_tokens: 200
            });

            return {
                summary: completion.choices[0]?.message?.content || 'Não foi possível gerar resumo',
                messages_analyzed: messages.length,
                generated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Erro ao gerar resumo da conversa', { error: error.message });
            return null;
        }
    },

    /**
     * Extrai produtos mencionados em uma mensagem
     */
    async extractProducts(message) {
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Extraia produtos de rolamentos/peças industriais mencionados na mensagem. 
            Retorne JSON: {"products": [{"name": "nome", "code": "código se houver", "quantity": numero ou null}]}`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.2,
                max_tokens: 300,
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(completion.choices[0]?.message?.content || '{"products": []}');
            return result.products || [];
        } catch (error) {
            logger.error('Erro ao extrair produtos', { error: error.message });
            return [];
        }
    },

    /**
     * Verifica se a chave API está configurada
     */
    isConfigured() {
        return !!process.env.OPENAI_API_KEY;
    }
};

export default SuperbotAIService;
