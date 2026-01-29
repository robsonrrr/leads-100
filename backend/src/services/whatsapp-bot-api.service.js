/**
 * WhatsApp Bot API Service
 * 
 * Serviço para comunicação com a API do WhatsApp Bot (Go)
 * Responsável por enviar mensagens via WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import axios from 'axios';
import logger from '../config/logger.js';

class WhatsAppBotAPIService {
    constructor() {
        this.baseUrl = process.env.WHATSAPP_API_URL || 'https://dev.whatsapp.internut.com.br/api';
        this.token = process.env.WHATSAPP_API_TOKEN;
        this.timeout = parseInt(process.env.WHATSAPP_API_TIMEOUT_MS || '10000');

        // Criar instância axios com configurações padrão
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        });

        // Interceptor para logging
        this.client.interceptors.request.use(
            (config) => {
                logger.debug('WhatsApp API Request', {
                    method: config.method,
                    url: config.url,
                    data: config.data
                });
                return config;
            },
            (error) => {
                logger.error('WhatsApp API Request Error', { error: error.message });
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                logger.debug('WhatsApp API Response', {
                    status: response.status,
                    data: response.data
                });
                return response;
            },
            (error) => {
                logger.error('WhatsApp API Response Error', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Envia uma mensagem de texto
     * @param {string} sessionId - ID da sessão do WhatsApp
     * @param {string} phone - Número de telefone (formato: 5511999999999)
     * @param {string} message - Conteúdo da mensagem
     * @returns {Promise<Object>} Resultado do envio
     */
    async sendMessage(sessionId, phone, message) {
        try {
            // Formatar telefone (remover caracteres especiais)
            const formattedPhone = this.formatPhone(phone);

            // Construir JID (WhatsApp ID)
            const jid = `${formattedPhone}@s.whatsapp.net`;

            logger.info('Sending WhatsApp message', {
                sessionId,
                phone: formattedPhone,
                messageLength: message.length
            });

            const response = await this.client.post(`/sessions/${sessionId}/send`, {
                jid,
                message
            });

            return {
                success: true,
                messageId: response.data?.messageId || response.data?.message_id,
                status: 'sent',
                phone: formattedPhone,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to send WhatsApp message', {
                sessionId,
                phone,
                error: error.message,
                response: error.response?.data
            });

            throw {
                code: 'WHATSAPP_SEND_ERROR',
                message: error.response?.data?.message || error.message || 'Falha ao enviar mensagem',
                details: error.response?.data
            };
        }
    }

    /**
     * Envia uma mensagem com mídia
     * @param {string} sessionId - ID da sessão
     * @param {string} phone - Número de telefone
     * @param {Object} media - Objeto com informações da mídia
     * @returns {Promise<Object>} Resultado do envio
     */
    async sendMedia(sessionId, phone, media) {
        try {
            const formattedPhone = this.formatPhone(phone);
            const jid = `${formattedPhone}@s.whatsapp.net`;

            logger.info('Sending WhatsApp media', {
                sessionId,
                phone: formattedPhone,
                mediaType: media.type,
                hasCaption: !!media.caption
            });

            const response = await this.client.post(`/sessions/${sessionId}/send/enhanced`, {
                jid,
                type: media.type, // image, document, audio, video
                url: media.url,
                caption: media.caption || '',
                filename: media.filename || null
            });

            return {
                success: true,
                messageId: response.data?.messageId || response.data?.message_id,
                status: 'sent',
                phone: formattedPhone,
                mediaUrl: media.url,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to send WhatsApp media', {
                sessionId,
                phone,
                mediaType: media.type,
                error: error.message
            });

            throw {
                code: 'WHATSAPP_MEDIA_ERROR',
                message: error.response?.data?.message || error.message || 'Falha ao enviar mídia',
                details: error.response?.data
            };
        }
    }

    /**
     * Lista todas as sessões disponíveis
     * @returns {Promise<Array>} Lista de sessões
     */
    async getSessions() {
        try {
            const response = await this.client.get('/sessions');

            const sessions = response.data?.sessions || response.data || [];

            return sessions.map(session => ({
                id: session.id || session.session_id,
                name: session.name || session.session_name || session.id,
                phone: session.phone || session.phone_number,
                status: session.status || (session.is_connected ? 'connected' : 'disconnected'),
                isActive: session.is_active !== false,
                isCollected: session.is_collected || false,
                lastSeen: session.last_seen || session.updated_at
            }));
        } catch (error) {
            logger.error('Failed to get WhatsApp sessions', {
                error: error.message
            });

            throw {
                code: 'WHATSAPP_SESSIONS_ERROR',
                message: 'Falha ao obter sessões do WhatsApp',
                details: error.response?.data
            };
        }
    }

    /**
     * Obtém status de uma sessão específica
     * @param {string} sessionId - ID da sessão
     * @returns {Promise<Object>} Status da sessão
     */
    async getSessionStatus(sessionId) {
        try {
            const response = await this.client.get(`/sessions/${sessionId}/status`);

            return {
                id: sessionId,
                status: response.data?.status || 'unknown',
                isConnected: response.data?.is_connected || response.data?.status === 'connected',
                phone: response.data?.phone,
                name: response.data?.name,
                pushName: response.data?.push_name,
                lastActivity: response.data?.last_activity
            };
        } catch (error) {
            logger.error('Failed to get session status', {
                sessionId,
                error: error.message
            });

            // Se a sessão não existir, retornar status desconectado
            if (error.response?.status === 404) {
                return {
                    id: sessionId,
                    status: 'not_found',
                    isConnected: false
                };
            }

            throw {
                code: 'WHATSAPP_SESSION_STATUS_ERROR',
                message: 'Falha ao obter status da sessão',
                details: error.response?.data
            };
        }
    }

    /**
     * Verifica se um número está no WhatsApp
     * @param {string} sessionId - ID da sessão
     * @param {string} phone - Número de telefone
     * @returns {Promise<boolean>} Se o número está no WhatsApp
     */
    async checkNumber(sessionId, phone) {
        try {
            const formattedPhone = this.formatPhone(phone);
            const response = await this.client.get(`/sessions/${sessionId}/check/${formattedPhone}`);

            return response.data?.exists || response.data?.on_whatsapp || false;
        } catch (error) {
            logger.warn('Failed to check WhatsApp number', {
                sessionId,
                phone,
                error: error.message
            });

            // Em caso de erro, assumir que o número existe
            return true;
        }
    }

    /**
     * Formata número de telefone para padrão brasileiro
     * Remove caracteres especiais e adiciona código do país se necessário
     * @param {string} phone - Número de telefone
     * @returns {string} Número formatado
     */
    formatPhone(phone) {
        if (!phone) {
            throw new Error('Número de telefone é obrigatório');
        }

        // Remover todos os caracteres não numéricos
        let formatted = phone.toString().replace(/\D/g, '');

        // Se começar com 0, remover
        if (formatted.startsWith('0')) {
            formatted = formatted.slice(1);
        }

        // Se não tiver código do país (55), adicionar
        if (!formatted.startsWith('55') && formatted.length <= 11) {
            formatted = '55' + formatted;
        }

        // Validar tamanho (deve ter 12 ou 13 dígitos)
        if (formatted.length < 12 || formatted.length > 13) {
            throw new Error(`Número de telefone inválido: ${phone}`);
        }

        return formatted;
    }

    /**
     * Valida formato de telefone
     * @param {string} phone - Número de telefone
     * @returns {boolean} Se é válido
     */
    isValidPhone(phone) {
        try {
            this.formatPhone(phone);
            return true;
        } catch {
            return false;
        }
    }
}

// Exportar instância singleton
export const whatsAppBotAPIService = new WhatsAppBotAPIService();
export default whatsAppBotAPIService;
