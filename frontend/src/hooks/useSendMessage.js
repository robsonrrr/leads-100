/**
 * useSendMessage Hook
 * 
 * Hook para envio de mensagens WhatsApp com gerenciamento de estado
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import { useState, useCallback } from 'react';
import { whatsappSendService } from '../services/whatsapp-send.service';

/**
 * Hook para envio de mensagens WhatsApp
 * @param {Object} options - Opções do hook
 * @returns {Object} Estado e funções de envio
 */
export function useSendMessage(options = {}) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [lastSentMessage, setLastSentMessage] = useState(null);
    const [sendHistory, setSendHistory] = useState([]);

    /**
     * Envia uma mensagem de texto
     * @param {string} phone - Número de telefone
     * @param {string} message - Conteúdo da mensagem
     * @param {Object} sendOptions - Opções adicionais
     * @returns {Promise<Object>} Resultado do envio
     */
    const sendMessage = useCallback(async (phone, message, sendOptions = {}) => {
        setSending(true);
        setError(null);

        try {
            const result = await whatsappSendService.sendMessage(phone, message, {
                ...options,
                ...sendOptions
            });

            if (result.success) {
                const sentMessage = {
                    id: result.data.messageId || Date.now(),
                    phone,
                    message,
                    type: 'text',
                    status: 'sent',
                    timestamp: new Date().toISOString(),
                    ...result.data
                };

                setLastSentMessage(sentMessage);
                setSendHistory(prev => [sentMessage, ...prev].slice(0, 50));

                // Callback de sucesso
                if (options.onSuccess) {
                    options.onSuccess(sentMessage);
                }

                return { success: true, data: sentMessage };
            } else {
                throw new Error(result.error?.message || 'Falha ao enviar mensagem');
            }
        } catch (err) {
            const errorObj = {
                code: err.response?.data?.error?.code || 'SEND_ERROR',
                message: err.response?.data?.error?.message || err.message || 'Erro ao enviar mensagem'
            };

            setError(errorObj);

            // Callback de erro
            if (options.onError) {
                options.onError(errorObj);
            }

            return { success: false, error: errorObj };
        } finally {
            setSending(false);
        }
    }, [options]);

    /**
     * Envia uma mensagem com mídia
     * @param {string} phone - Número de telefone
     * @param {Object} media - Dados da mídia
     * @param {Object} sendOptions - Opções adicionais
     * @returns {Promise<Object>} Resultado do envio
     */
    const sendMedia = useCallback(async (phone, media, sendOptions = {}) => {
        setSending(true);
        setError(null);

        try {
            const result = await whatsappSendService.sendMedia(phone, media, {
                ...options,
                ...sendOptions
            });

            if (result.success) {
                const sentMessage = {
                    id: result.data.messageId || Date.now(),
                    phone,
                    type: media.type,
                    mediaUrl: media.url,
                    caption: media.caption,
                    status: 'sent',
                    timestamp: new Date().toISOString(),
                    ...result.data
                };

                setLastSentMessage(sentMessage);
                setSendHistory(prev => [sentMessage, ...prev].slice(0, 50));

                if (options.onSuccess) {
                    options.onSuccess(sentMessage);
                }

                return { success: true, data: sentMessage };
            } else {
                throw new Error(result.error?.message || 'Falha ao enviar mídia');
            }
        } catch (err) {
            const errorObj = {
                code: err.response?.data?.error?.code || 'MEDIA_ERROR',
                message: err.response?.data?.error?.message || err.message || 'Erro ao enviar mídia'
            };

            setError(errorObj);

            if (options.onError) {
                options.onError(errorObj);
            }

            return { success: false, error: errorObj };
        } finally {
            setSending(false);
        }
    }, [options]);

    /**
     * Limpa o erro
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Limpa o histórico de envios
     */
    const clearHistory = useCallback(() => {
        setSendHistory([]);
        setLastSentMessage(null);
    }, []);

    return {
        // Estado
        sending,
        error,
        lastSentMessage,
        sendHistory,

        // Funções
        sendMessage,
        sendMedia,
        clearError,
        clearHistory
    };
}

export default useSendMessage;
