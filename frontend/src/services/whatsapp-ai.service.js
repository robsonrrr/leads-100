/**
 * WhatsApp AI Service
 * 
 * Serviço para integração com endpoints de IA do WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import api from './api';

/**
 * Gera sugestões de mensagens usando IA
 * @param {Object} params - Parâmetros para geração
 * @param {string} params.phone - Telefone do destinatário
 * @param {number} params.leadId - ID do lead
 * @param {number} params.customerId - ID do cliente
 * @param {Array} params.lastMessages - Últimas mensagens
 * @param {string} params.context - Contexto adicional
 * @param {string} params.intent - Intenção (greeting, follow_up, etc)
 * @returns {Promise<Object>} Sugestões geradas
 */
export async function getSuggestions(params) {
    const response = await api.post('/whatsapp/ai/suggest', params);
    return response.data;
}

/**
 * Compõe uma mensagem completa usando IA
 * @param {Object} params - Parâmetros para composição
 * @param {string} params.phone - Telefone do destinatário
 * @param {number} params.leadId - ID do lead
 * @param {number} params.customerId - ID do cliente
 * @param {string} params.template - Template base
 * @param {Object} params.variables - Variáveis
 * @param {string} params.tone - Tom da mensagem
 * @returns {Promise<Object>} Mensagem composta
 */
export async function composeMessage(params) {
    const response = await api.post('/whatsapp/ai/compose', params);
    return response.data;
}

/**
 * Obtém lista de intents disponíveis
 * @returns {Promise<Object>} Lista de intents
 */
export async function getIntents() {
    const response = await api.get('/whatsapp/ai/intents');
    return response.data;
}

/**
 * Tipos de intenção disponíveis (para uso offline)
 */
export const INTENT_TYPES = {
    GREETING: 'greeting',
    FOLLOW_UP: 'follow_up',
    OFFER_DISCOUNT: 'offer_discount',
    SEND_PROPOSAL: 'send_proposal',
    CLOSE_DEAL: 'close_deal',
    OBJECTION: 'objection',
    PAYMENT: 'payment',
    SHIPPING: 'shipping'
};

/**
 * Labels dos intents em português
 */
export const INTENT_LABELS = {
    greeting: 'Saudação',
    follow_up: 'Follow-up',
    offer_discount: 'Oferta',
    send_proposal: 'Proposta',
    close_deal: 'Fechamento',
    objection: 'Objeção',
    payment: 'Pagamento',
    shipping: 'Entrega'
};

/**
 * Ícones dos intents
 */
export const INTENT_ICONS = {
    greeting: '👋',
    follow_up: '📞',
    offer_discount: '💰',
    send_proposal: '📄',
    close_deal: '🤝',
    objection: '🎯',
    payment: '💳',
    shipping: '🚚'
};

export default {
    getSuggestions,
    composeMessage,
    getIntents,
    INTENT_TYPES,
    INTENT_LABELS,
    INTENT_ICONS
};
