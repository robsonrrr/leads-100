import OpenAI from 'openai';
import Bottleneck from 'bottleneck';
import logger from '../../../config/logger.js';

/**
 * AIGateway - Ponto central de comunicação com LLMs (Q2 2026)
 * Responsável por rate limiting, seleção de modelo e controle de custos.
 */
class AIGateway {
    constructor() {
        // Configurar cliente OpenAI (pode ser substituído por Anthropic/Outros)
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder', // Fallback seguro
        });

        // Rate Limiter: Aumentado para suportar ARIA + UI (200 RPM)
        this.limiter = new Bottleneck({
            minTime: 30, // Mínimo 30ms entre requests (~33req/s)
            maxConcurrent: 10, // No máximo 10 requests simultâneos
            reservoir: 200, // 200 tokens iniciais
            reservoirRefreshAmount: 200, // Recarrega 200 tokens
            reservoirRefreshInterval: 60 * 1000 // A cada 60 segundos (200 RPM global)
        });

        // Modelo padrão - Custo x Benefício
        this.defaultModel = 'gpt-4-turbo-preview';

        // Cache simples em memória para perguntas frequentes (TTL 5 min)
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
    }

    /**
     * Envia mensagem para o LLM com controle de taxa e erro
     * @param {Array} messages - Histórico da conversa
     * @param {Object} options - Configurações (temperature, tools, userId)
     */
    async chatCompletion(messages, options = {}) {
        const userId = options.userId || 'system';
        const contextStr = JSON.stringify(messages);

        // 1. Verificar Cache (se habilitado e sem tools)
        if (options.useCache && !options.tools) {
            const cached = this.checkCache(contextStr);
            if (cached) {
                logger.info('AIGateway: Cache hit', { userId });
                return cached;
            }
        }

        // 2. Wrap com Rate Limiter
        return this.limiter.schedule(async () => {
            try {
                logger.info('AIGateway: Sending request to LLM', { userId, model: options.model || this.defaultModel });

                const params = {
                    model: options.model || this.defaultModel,
                    messages,
                    temperature: options.temperature || 0.5,
                    max_tokens: options.max_tokens || 1000,
                };

                if (options.tools) {
                    params.tools = options.tools;
                    params.tool_choice = 'auto';
                }

                const completion = await this.client.chat.completions.create(params);

                const responseMessage = completion.choices[0].message;
                const usage = completion.usage;

                // Logar uso de tokens (importante para custo)
                logger.info('AIGateway: Request completed', {
                    userId,
                    tokens_prompt: usage.prompt_tokens,
                    tokens_completion: usage.completion_tokens
                });

                // Salvar no cache se aplicável
                if (options.useCache && !options.tools) {
                    this.setCache(contextStr, responseMessage);
                }

                return {
                    role: 'assistant',
                    content: responseMessage.content,
                    tool_calls: responseMessage.tool_calls || null,
                    usage
                };

            } catch (error) {
                logger.error('AIGateway: Error calling LLM', { error: error.message, userId });

                // Tratamento de erro específico da OpenAI
                if (error.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }

                throw error;
            }
        });
    }

    checkCache(key) {
        if (!this.cache.has(key)) return null;
        const { timestamp, data } = this.cache.get(key);
        if (Date.now() - timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }
        return data;
    }

    setCache(key, data) {
        this.cache.set(key, { timestamp: Date.now(), data });
        // Limpeza simples se ficar muito grande
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
}

export const aiGateway = new AIGateway();
