/**
 * WhatsApp Send Service
 * 
 * Serviço frontend para envio de mensagens via WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import api from './api';

/**
 * Serviço de envio de mensagens WhatsApp
 */
export const whatsappSendService = {
    /**
     * Envia uma mensagem de texto
     * @param {string} phone - Número de telefone
     * @param {string} message - Conteúdo da mensagem
     * @param {Object} options - Opções adicionais
     * @returns {Promise<Object>} Resultado do envio
     */
    async sendMessage(phone, message, options = {}) {
        const response = await api.post('/whatsapp/send', {
            phone,
            message,
            sessionId: options.sessionId,
            leadId: options.leadId,
            customerId: options.customerId
        });
        return response.data;
    },

    /**
     * Envia uma mensagem com mídia
     * @param {string} phone - Número de telefone
     * @param {Object} media - Dados da mídia
     * @param {Object} options - Opções adicionais
     * @returns {Promise<Object>} Resultado do envio
     */
    async sendMedia(phone, media, options = {}) {
        const response = await api.post('/whatsapp/send/media', {
            phone,
            mediaType: media.type,
            mediaUrl: media.url,
            caption: media.caption,
            filename: media.filename,
            sessionId: options.sessionId,
            leadId: options.leadId,
            customerId: options.customerId
        });
        return response.data;
    },

    /**
     * Lista sessões WhatsApp disponíveis
     * @returns {Promise<Object>} Lista de sessões
     */
    async getSessions() {
        const response = await api.get('/whatsapp/sessions');
        return response.data;
    },

    /**
     * Obtém status de uma sessão
     * @param {string} sessionId - ID da sessão
     * @returns {Promise<Object>} Status da sessão
     */
    async getSessionStatus(sessionId) {
        const response = await api.get(`/whatsapp/sessions/${sessionId}/status`);
        return response.data;
    },

    /**
     * Verifica se um número está no WhatsApp
     * @param {string} phone - Número de telefone
     * @returns {Promise<Object>} Resultado da verificação
     */
    async checkNumber(phone) {
        const response = await api.get(`/whatsapp/check-number/${phone}`);
        return response.data;
    },

    /**
     * Lista mensagens enviadas
     * @param {Object} params - Parâmetros de busca
     * @returns {Promise<Object>} Lista de mensagens
     */
    async getSentMessages(params = {}) {
        const response = await api.get('/whatsapp/sent-messages', { params });
        return response.data;
    },

    /**
     * Formata número de telefone para exibição
     * @param {string} phone - Número de telefone
     * @returns {string} Número formatado
     */
    formatPhoneDisplay(phone) {
        if (!phone) return '';

        // Remover caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');

        // Se for número brasileiro completo
        if (cleaned.startsWith('55') && cleaned.length >= 12) {
            const ddd = cleaned.slice(2, 4);
            const number = cleaned.slice(4);

            if (number.length === 9) {
                return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
            } else if (number.length === 8) {
                return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
            }
        }

        return phone;
    },

    /**
     * Valida formato de telefone
     * @param {string} phone - Número de telefone
     * @returns {boolean} Se é válido
     */
    isValidPhone(phone) {
        if (!phone) return false;
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 13;
    }
};

export default whatsappSendService;
