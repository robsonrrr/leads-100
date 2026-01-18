/**
 * Superbot Service - Frontend API
 * 
 * Serviço para integração com WhatsApp via Superbot
 * Histórico de conversas, análise de intenção e criação de leads
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import api from './api'

export const superbotService = {
    // ============================================
    // CLIENTES
    // ============================================

    /**
     * Lista clientes do Superbot
     */
    getCustomers: (params) => api.get('/superbot/customers', { params }),

    /**
     * Busca cliente por telefone
     */
    getCustomerByPhone: (phone) => api.get(`/superbot/customers/${phone}`),

    /**
     * Busca cliente leads-agent vinculado a um telefone
     */
    getLinkedCustomer: (phone) => api.get(`/superbot/linked-customer/${phone}`),

    // ============================================
    // CONVERSAS E MENSAGENS
    // ============================================

    /**
     * Obtém histórico de conversas de um cliente
     */
    getConversations: (phone, params) => api.get(`/superbot/conversations/${phone}`, { params }),

    /**
     * Obtém mensagens de uma sessão
     */
    getMessages: (sessionId, params) => api.get(`/superbot/messages/${sessionId}`, { params }),

    /**
     * Obtém transcrições de áudio
     */
    getTranscriptions: (phone, params) => api.get(`/superbot/transcriptions/${phone}`, { params }),

    // ============================================
    // ESTATÍSTICAS E CONTEXTO
    // ============================================

    /**
     * Obtém estatísticas de um cliente
     */
    getStats: (phone) => api.get(`/superbot/stats/${phone}`),

    /**
     * Obtém análise de sentimento
     */
    getSentiment: (phone, params) => api.get(`/superbot/sentiment/${phone}`, { params }),

    /**
     * Obtém contexto enriquecido para chatbot
     */
    getContext: (phone) => api.get(`/superbot/context/${phone}`),

    // ============================================
    // ANÁLISE DE INTENÇÃO
    // ============================================

    /**
     * Analisa intenção de uma mensagem (básico)
     */
    analyzeIntent: (message, phone = null) =>
        api.post('/superbot/analyze-intent', { message, phone }),

    /**
     * Analisa intenção com IA (OpenAI)
     */
    analyzeIntentAI: (message, phone = null, useCache = true) =>
        api.post('/superbot/analyze-intent-ai', { message, phone, useCache }),

    /**
     * Detecta intenção de compra
     */
    detectPurchaseIntent: (message) =>
        api.post('/superbot/detect-purchase-intent', { message }),

    /**
     * Extrai produtos mencionados
     */
    extractProducts: (message) =>
        api.post('/superbot/extract-products', { message }),

    // ============================================
    // VINCULAÇÃO DE CLIENTES
    // ============================================

    /**
     * Lista sugestões de links entre clientes
     */
    getSuggestedLinks: (params) => api.get('/superbot/suggested-links', { params }),

    /**
     * Cria vínculo entre clientes
     */
    createLink: (superbotCustomerId, leadsCustomerId, options = {}) =>
        api.post('/superbot/link', {
            superbotCustomerId,
            leadsCustomerId,
            ...options
        }),

    /**
     * Remove vínculo entre clientes
     */
    removeLink: (superbotCustomerId, leadsCustomerId) =>
        api.delete('/superbot/link', {
            data: { superbotCustomerId, leadsCustomerId }
        }),

    // ============================================
    // WEBHOOK
    // ============================================

    /**
     * Obtém status do webhook
     */
    getWebhookStatus: () => api.get('/superbot/webhook/status'),

    /**
     * Testa o webhook
     */
    testWebhook: (message, senderPhone = '5511999999999') =>
        api.post('/superbot/webhook/test', { message_text: message, sender_phone: senderPhone }),

    /**
     * Processa fila de mensagens pendentes
     */
    processQueue: () => api.post('/superbot/webhook/process-queue'),

    // ============================================
    // ANALYTICS
    // ============================================

    /**
     * Obtém dashboard completo de analytics
     */
    getDashboard: (days = 30) => api.get('/superbot/analytics/dashboard', { params: { days } }),

    /**
     * Obtém resumo geral
     */
    getAnalyticsSummary: (days = 30) => api.get('/superbot/analytics/summary', { params: { days } }),

    /**
     * Obtém mensagens por dia
     */
    getMessagesByDay: (days = 30) => api.get('/superbot/analytics/messages-by-day', { params: { days } }),

    /**
     * Obtém distribuição por hora
     */
    getMessagesByHour: (days = 30) => api.get('/superbot/analytics/messages-by-hour', { params: { days } }),

    /**
     * Obtém top clientes
     */
    getTopCustomers: (days = 30, limit = 10) => api.get('/superbot/analytics/top-customers', { params: { days, limit } }),

    /**
     * Obtém distribuição de intenções
     */
    getIntentDistribution: (days = 30) => api.get('/superbot/analytics/intents', { params: { days } }),

    /**
     * Obtém métricas de conversão
     */
    getConversionMetrics: (days = 30) => api.get('/superbot/analytics/conversion', { params: { days } }),

    /**
     * Obtém métricas de tempo de resposta
     */
    getResponseMetrics: (days = 30) => api.get('/superbot/analytics/response', { params: { days } }),

    // ============================================
    // SELLER PHONES - Telefones de vendedores
    // ============================================

    /**
     * Lista todos os telefones de vendedores
     */
    getSellerPhones: () => api.get('/superbot/seller-phones'),

    /**
     * Busca telefones de um vendedor específico
     */
    getSellerPhonesByUser: (userId) => api.get(`/superbot/seller-phones/user/${userId}`),

    /**
     * Adiciona telefone a um vendedor
     */
    addSellerPhone: (userId, phoneNumber, phoneName = null, isPrimary = false) =>
        api.post('/superbot/seller-phones', { userId, phoneNumber, phoneName, isPrimary }),

    /**
     * Remove telefone de vendedor
     */
    removeSellerPhone: (phoneNumber) => api.delete(`/superbot/seller-phones/${phoneNumber}`),

    /**
     * Busca vendedor pelo telefone do bot
     */
    getSellerByPhone: (phone) => api.get(`/superbot/seller-phones/seller/${phone}`),

    /**
     * Lista clientes do vendedor logado (filtrado por level)
     */
    getMyCustomers: (params) => api.get('/superbot/my-customers', { params }),
}

export default superbotService
