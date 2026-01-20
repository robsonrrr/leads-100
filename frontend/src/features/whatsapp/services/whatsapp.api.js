/**
 * WhatsApp v2.0 - API Service
 * Serviço de API com AbortController obrigatório
 */

import api from '../../../services/api'
import { PAGINATION } from '../utils/constants'

/**
 * Classe para gerenciar chamadas de API do WhatsApp
 * Todas as chamadas suportam cancelamento via AbortController
 */
class WhatsAppAPI {
    /**
     * Lista contatos/clientes do WhatsApp
     * @param {Object} params - Parâmetros de busca
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getContacts(params = {}, signal) {
        const response = await api.get('/superbot/customers', {
            params: {
                limit: params.limit || PAGINATION.CONTACTS_PER_PAGE,
                offset: params.offset || 0,
                search: params.search || undefined,
                sellerId: params.sellerId || undefined,
                ...params,
            },
            signal,
        })
        return response.data
    }

    /**
     * Busca contatos do vendedor logado
     * @param {Object} params - Parâmetros
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getMyContacts(params = {}, signal) {
        const response = await api.get('/superbot/my-customers', {
            params: {
                limit: params.limit || PAGINATION.CONTACTS_PER_PAGE,
                offset: params.offset || 0,
                ...params,
            },
            signal,
        })
        return response.data
    }

    /**
     * Busca um contato por telefone
     * @param {string} phone - Telefone
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getContactByPhone(phone, signal) {
        const response = await api.get(`/superbot/customers/${phone}`, { signal })
        return response.data
    }

    /**
     * Busca conversas (sessões) de um contato
     * @param {string} phone - Telefone do contato
     * @param {Object} params - Parâmetros
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getConversations(phone, params = {}, signal) {
        const response = await api.get(`/superbot/conversations/${phone}`, {
            params: {
                limit: params.limit || 20,
                ...params,
            },
            signal,
        })
        return response.data
    }

    /**
     * Busca mensagens de uma sessão
     * @param {string} sessionId - ID da sessão
     * @param {Object} params - Parâmetros de paginação
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getMessages(sessionId, params = {}, signal) {
        const response = await api.get(`/superbot/messages/${sessionId}`, {
            params: {
                limit: params.limit || PAGINATION.MESSAGES_PER_PAGE,
                offset: params.offset || 0,
                ...params,
            },
            signal,
        })
        return response.data
    }

    /**
     * Busca estatísticas de um contato
     * @param {string} phone - Telefone
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getStats(phone, signal) {
        const response = await api.get(`/superbot/stats/${phone}`, { signal })
        return response.data
    }

    /**
     * Busca análise de sentimento
     * @param {string} phone - Telefone
     * @param {Object} params - Parâmetros
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getSentiment(phone, params = {}, signal) {
        const response = await api.get(`/superbot/sentiment/${phone}`, {
            params,
            signal,
        })
        return response.data
    }

    /**
     * Busca cliente Leads-Agent vinculado
     * @param {string} phone - Telefone
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getLinkedCustomer(phone, signal) {
        const response = await api.get(`/superbot/linked-customer/${phone}`, { signal })
        return response.data
    }

    /**
     * Cria vínculo entre cliente Superbot e Leads-Agent
     * @param {string} superbotCustomerId - ID do cliente Superbot
     * @param {string} leadsCustomerId - ID do cliente Leads-Agent
     * @param {Object} options - Opções adicionais
     */
    async createLink(superbotCustomerId, leadsCustomerId, options = {}) {
        const response = await api.post('/superbot/link', {
            superbotCustomerId,
            leadsCustomerId,
            ...options,
        })
        return response.data
    }

    /**
     * Remove vínculo entre clientes
     * @param {string} superbotCustomerId - ID do cliente Superbot
     * @param {string} leadsCustomerId - ID do cliente Leads-Agent
     */
    async removeLink(superbotCustomerId, leadsCustomerId) {
        const response = await api.delete('/superbot/link', {
            data: { superbotCustomerId, leadsCustomerId },
        })
        return response.data
    }

    /**
     * Analisa intenção de uma mensagem
     * @param {string} message - Texto da mensagem
     * @param {string} phone - Telefone (opcional)
     */
    async analyzeIntent(message, phone = null) {
        const response = await api.post('/superbot/analyze-intent', { message, phone })
        return response.data
    }

    /**
     * Busca status do webhook
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getWebhookStatus(signal) {
        const response = await api.get('/superbot/webhook/status', { signal })
        return response.data
    }

    /**
     * Lista telefones de vendedores
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getSellerPhones(signal) {
        const response = await api.get('/superbot/seller-phones', { signal })
        return response.data
    }

    /**
     * Busca vendedor por telefone do bot
     * @param {string} phone - Telefone
     * @param {AbortSignal} signal - Sinal para cancelamento
     */
    async getSellerByPhone(phone, signal) {
        const response = await api.get(`/superbot/seller-phones/seller/${phone}`, { signal })
        return response.data
    }
}

// Exportar instância singleton
export const whatsappApi = new WhatsAppAPI()
export default whatsappApi
