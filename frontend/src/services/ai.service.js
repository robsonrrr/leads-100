import api from './api';

/**
 * AI Service (Q2 2026)
 * Gerencia comunicação com o backend de IA
 */
const aiService = {
    /**
     * Envia mensagem para o chat
     */
    sendMessage: async (message, conversationId = null, context = {}) => {
        const response = await api.post('/v2/ai/chat', {
            message,
            conversationId,
            context
        });
        return response.data;
    },

    /**
     * Lista conversas do usuário
     */
    getConversations: async () => {
        const response = await api.get('/v2/ai/conversations');
        return response.data;
    },

    /**
     * Pega histórico de uma conversa
     */
    getMessages: async (conversationId) => {
        const response = await api.get(`/v2/ai/conversations/${conversationId}`);
        return response.data;
    },

    /**
     * Busca previsão de vendas
     */
    getForecast: async (params) => {
        const response = await api.get('/v2/ai/forecast', { params });
        return response.data;
    },

    /**
     * Busca risco de churn de um cliente (Q2 2026)
     */
    getChurnRisk: async (customerId) => {
        const response = await api.get('/v2/ai/churn-risk', { params: { customerId } });
        return response.data;
    },

    /**
     * Busca análise de desvio (previsto vs realizado)
     */
    getDeviation: async (params = {}) => {
        const response = await api.get('/v2/ai/deviation', { params });
        return response.data;
    },

    /**
     * Busca recomendações de produtos
     */
    getRecommendations: async (params = {}) => {
        const response = await api.get('/v2/ai/recommendations', { params });
        return response.data;
    },

    /**
     * Busca recomendação de desconto (Q2 2026)
     */
    getDiscountRecommendation: async (customerId, productId) => {
        const response = await api.get('/v2/ai/recommendations/discount', {
            params: { customerId, productId }
        });
        return response.data;
    }
};

export default aiService;
