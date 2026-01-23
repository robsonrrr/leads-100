/**
 * WhatsApp Service
 * 
 * Serviço para envio de mensagens via API WhatsApp
 */

import axios from 'axios';
import logger from '../config/logger.js';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://dev.whatsapp.internut.com.br/api';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

/**
 * Envia uma mensagem WhatsApp
 * @param {Object} params
 * @param {string} params.sellerPhone - Telefone do vendedor (sessão WhatsApp)
 * @param {string} params.customerPhone - Telefone do cliente destinatário
 * @param {string} params.message - Texto da mensagem
 * @param {string} [params.imageUrl] - URL da imagem (opcional)
 * @param {number} [params.leadId] - ID do lead para referência
 * @returns {Promise<Object>} Resposta da API
 */
export async function sendMessage({ sellerPhone, customerPhone, message, imageUrl = null, leadId = null }) {
    const formattedPhone = formatPhone(customerPhone);

    if (!formattedPhone) {
        throw new Error('Telefone do cliente inválido');
    }

    if (!sellerPhone) {
        throw new Error('Telefone do vendedor não configurado');
    }

    if (!WHATSAPP_API_TOKEN) {
        throw new Error('Token da API WhatsApp não configurado');
    }

    const url = `${WHATSAPP_API_URL}/sessions/${sellerPhone}/send`;

    const payload = {
        to: formattedPhone,
        message,
        ...(imageUrl && { image: imageUrl })
    };

    try {
        logger.info('Sending WhatsApp message', {
            sellerPhone,
            to: formattedPhone,
            leadId,
            messageLength: message?.length,
            hasImage: !!imageUrl,
            payload: JSON.stringify(payload) // Log do payload completo
        });

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
            },
            timeout: 30000
        });

        logger.info('WhatsApp message sent successfully', {
            sellerPhone,
            to: formattedPhone,
            leadId,
            status: response.status
        });

        return response.data;
    } catch (error) {
        logger.error('WhatsApp send failed', {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
            sellerPhone,
            to: formattedPhone,
            leadId
        });

        // Re-throw com mensagem mais amigável
        if (error.response?.status === 404) {
            throw new Error('Sessão WhatsApp do vendedor não encontrada');
        }
        if (error.response?.status === 401) {
            throw new Error('Token da API WhatsApp inválido');
        }
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Serviço WhatsApp indisponível');
        }

        throw error;
    }
}

/**
 * Formata telefone para padrão brasileiro (55DDDNUMERO)
 * @param {string} phone - Telefone a formatar
 * @returns {string|null} Telefone formatado ou null se inválido
 */
export function formatPhone(phone) {
    if (!phone) return null;

    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');

    // Se muito curto, inválido
    if (cleaned.length < 10) return null;

    // Adiciona 55 se não tiver código do país
    if (!cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }

    return cleaned;
}

export default { sendMessage, formatPhone };
