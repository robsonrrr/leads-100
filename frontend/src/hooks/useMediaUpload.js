/**
 * useMediaUpload Hook
 * 
 * Hook para upload e envio de mídia via WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import { useState, useCallback } from 'react';
import { whatsappSendService } from '../services/whatsapp-send.service';

/**
 * Hook para upload de mídia WhatsApp
 * @param {Object} options - Opções do hook
 * @returns {Object} Estado e funções de upload
 */
export function useMediaUpload(options = {}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [lastUploadedMedia, setLastUploadedMedia] = useState(null);

    /**
     * Converte arquivo para base64
     */
    const fileToBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }, []);

    /**
     * Upload de arquivo para URL externa (se necessário)
     * Por enquanto, retorna URL local ou base64
     */
    const uploadToStorage = useCallback(async (file) => {
        // Simulação de progresso
        setProgress(10);

        // Converter para base64 (para envio direto)
        // Em produção, você pode fazer upload para S3 e retornar a URL
        const base64 = await fileToBase64(file);

        setProgress(50);

        // Retornar a URL (ou base64 data URL)
        return base64;
    }, [fileToBase64]);

    /**
     * Envia mídia via WhatsApp
     * @param {string} phone - Número de telefone
     * @param {Object} media - Objeto com file, type e caption
     * @param {Object} sendOptions - Opções adicionais
     * @returns {Promise<Object>} Resultado do envio
     */
    const sendMedia = useCallback(async (phone, media, sendOptions = {}) => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // 1. Upload do arquivo
            setProgress(10);
            const mediaUrl = await uploadToStorage(media.file);
            setProgress(60);

            // 2. Enviar via API
            const result = await whatsappSendService.sendMedia(phone, {
                type: media.type,
                url: mediaUrl,
                caption: media.caption || '',
                filename: media.file.name
            }, {
                ...options,
                ...sendOptions
            });

            setProgress(100);

            if (result.success) {
                const uploadedMedia = {
                    id: result.data?.messageId || Date.now(),
                    phone,
                    type: media.type,
                    filename: media.file.name,
                    caption: media.caption,
                    url: mediaUrl,
                    status: 'sent',
                    timestamp: new Date().toISOString(),
                    ...result.data
                };

                setLastUploadedMedia(uploadedMedia);

                // Callback de sucesso
                if (options.onSuccess) {
                    options.onSuccess(uploadedMedia);
                }

                return { success: true, data: uploadedMedia };
            } else {
                throw new Error(result.error?.message || 'Falha ao enviar mídia');
            }
        } catch (err) {
            const errorObj = {
                code: err.response?.data?.error?.code || 'UPLOAD_ERROR',
                message: err.response?.data?.error?.message || err.message || 'Erro ao enviar mídia'
            };

            setError(errorObj);

            // Callback de erro
            if (options.onError) {
                options.onError(errorObj);
            }

            return { success: false, error: errorObj };
        } finally {
            setUploading(false);
            // Manter o progress em 100 por um momento antes de resetar
            setTimeout(() => setProgress(0), 500);
        }
    }, [options, uploadToStorage]);

    /**
     * Limpa o erro
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Reseta o estado
     */
    const reset = useCallback(() => {
        setUploading(false);
        setProgress(0);
        setError(null);
        setLastUploadedMedia(null);
    }, []);

    return {
        // Estado
        uploading,
        progress,
        error,
        lastUploadedMedia,

        // Funções
        sendMedia,
        clearError,
        reset
    };
}

export default useMediaUpload;
