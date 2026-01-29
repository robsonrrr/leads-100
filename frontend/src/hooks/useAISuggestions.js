/**
 * useAISuggestions Hook
 * 
 * Hook React para gerenciar sugestões de IA do WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as whatsappAIService from '../services/whatsapp-ai.service';

/**
 * Hook para gerenciar sugestões de IA
 * @param {Object} options - Opções do hook
 * @param {string} options.phone - Telefone do destinatário
 * @param {number} options.leadId - ID do lead
 * @param {number} options.customerId - ID do cliente
 * @param {boolean} options.autoLoad - Carregar sugestões automaticamente
 * @param {string} options.defaultIntent - Intent padrão para sugestões
 * @returns {Object} Estado e handlers das sugestões
 */
export function useAISuggestions(options = {}) {
    const {
        phone = null,
        leadId = null,
        customerId = null,
        autoLoad = false,
        defaultIntent = null
    } = options;

    // State
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [intent, setIntent] = useState(defaultIntent);
    const [intents, setIntents] = useState([]);
    const [lastGenerated, setLastGenerated] = useState(null);

    // Refs
    const abortControllerRef = useRef(null);
    const lastContextRef = useRef({ phone, leadId, customerId, intent });

    /**
     * Carrega a lista de intents disponíveis
     */
    const loadIntents = useCallback(async () => {
        try {
            const response = await whatsappAIService.getIntents();
            if (response.success) {
                setIntents(response.data.intents);
            }
        } catch (err) {
            console.warn('Failed to load intents:', err);
            // Usar intents padrão do serviço
            setIntents([
                { id: 'greeting', label: 'Saudação', description: 'Iniciar conversa', icon: '👋' },
                { id: 'follow_up', label: 'Follow-up', description: 'Retomar contato', icon: '📞' },
                { id: 'offer_discount', label: 'Oferta', description: 'Oferecer desconto', icon: '💰' },
                { id: 'send_proposal', label: 'Proposta', description: 'Enviar proposta', icon: '📄' },
                { id: 'close_deal', label: 'Fechamento', description: 'Fechar negócio', icon: '🤝' },
                { id: 'objection', label: 'Objeção', description: 'Contornar objeção', icon: '🎯' },
                { id: 'payment', label: 'Pagamento', description: 'Tratar pagamento', icon: '💳' },
                { id: 'shipping', label: 'Entrega', description: 'Informar entrega', icon: '🚚' }
            ]);
        }
    }, []);

    /**
     * Gera novas sugestões
     */
    const generateSuggestions = useCallback(async (additionalParams = {}) => {
        // Cancelar requisição anterior
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const params = {
            phone: additionalParams.phone || phone,
            leadId: additionalParams.leadId || leadId,
            customerId: additionalParams.customerId || customerId,
            intent: additionalParams.intent || intent,
            context: additionalParams.context,
            lastMessages: additionalParams.lastMessages
        };

        // Validar se há contexto suficiente
        if (!params.phone && !params.leadId && !params.customerId) {
            setError('É necessário um telefone, lead ou cliente para gerar sugestões');
            return [];
        }

        setLoading(true);
        setError(null);

        try {
            const response = await whatsappAIService.getSuggestions(params);

            if (response.success) {
                setSuggestions(response.data.suggestions);
                setLastGenerated(response.data.generatedAt);
                lastContextRef.current = { ...params };
                return response.data.suggestions;
            } else {
                throw new Error(response.error?.message || 'Erro ao gerar sugestões');
            }
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return [];
            }

            const errorMessage = err.response?.data?.error?.message || err.message || 'Erro ao gerar sugestões';
            setError(errorMessage);
            console.error('Failed to generate suggestions:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [phone, leadId, customerId, intent]);

    /**
     * Regenera sugestões com novo intent
     */
    const regenerateWithIntent = useCallback(async (newIntent) => {
        setIntent(newIntent);
        return generateSuggestions({ intent: newIntent });
    }, [generateSuggestions]);

    /**
     * Limpa sugestões
     */
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setError(null);
        setLastGenerated(null);
    }, []);

    /**
     * Seleciona uma sugestão (retorna o texto)
     */
    const selectSuggestion = useCallback((suggestion) => {
        if (!suggestion) return '';

        // Log de uso para analytics
        console.log('AI suggestion selected:', {
            intent: suggestion.intent,
            confidence: suggestion.confidence,
            id: suggestion.id
        });

        return suggestion.text;
    }, []);

    /**
     * Compõe uma mensagem completa
     */
    const composeMessage = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await whatsappAIService.composeMessage({
                phone: params.phone || phone,
                leadId: params.leadId || leadId,
                customerId: params.customerId || customerId,
                template: params.template,
                variables: params.variables,
                tone: params.tone || 'friendly'
            });

            if (response.success) {
                return {
                    success: true,
                    message: response.data.message,
                    subject: response.data.subject
                };
            } else {
                throw new Error(response.error?.message || 'Erro ao compor mensagem');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || err.message || 'Erro ao compor mensagem';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [phone, leadId, customerId]);

    // Carregar intents ao montar
    useEffect(() => {
        loadIntents();
    }, [loadIntents]);

    // Carregar sugestões automaticamente se autoLoad
    useEffect(() => {
        if (autoLoad && (phone || leadId || customerId)) {
            generateSuggestions();
        }
    }, [autoLoad]); // Apenas na montagem

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        // State
        suggestions,
        loading,
        error,
        intent,
        intents,
        lastGenerated,

        // Actions
        generateSuggestions,
        regenerateWithIntent,
        clearSuggestions,
        selectSuggestion,
        setIntent,
        composeMessage,

        // Helpers
        hasSuggestions: suggestions.length > 0,
        hasContext: !!(phone || leadId || customerId)
    };
}

export default useAISuggestions;
