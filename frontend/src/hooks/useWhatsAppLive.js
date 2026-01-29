/**
 * useWhatsAppLive Hook
 * 
 * Hook React para gerenciar conexão em tempo real com WhatsApp
 * Combina histórico do banco de dados com atualizações em tempo real
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLiveConnection, supportsSSE } from '../services/whatsapp-live.service';
import { superbotService } from '../services/superbot.service';

/**
 * Hook para conexão live com WhatsApp
 * @param {Object} options - Opções
 * @param {string} options.phone - Telefone do contato
 * @param {string} options.sessionId - ID da sessão (opcional)
 * @param {boolean} options.autoConnect - Conectar automaticamente (default: true)
 * @param {boolean} options.loadHistory - Carregar histórico inicial (default: true)
 * @param {number} options.historyLimit - Limite de mensagens históricas (default: 50)
 */
export function useWhatsAppLive(options = {}) {
    const {
        phone = null,
        sessionId = null,
        autoConnect = true,
        loadHistory = true,
        historyLimit = 50
    } = options;

    // State
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [presence, setPresence] = useState({ status: 'unknown', lastSeen: null });
    const [isTyping, setIsTyping] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    // Refs
    const connectionRef = useRef(null);
    const unsubscribersRef = useRef([]);

    /**
     * Carrega histórico de mensagens do banco de dados
     */
    const loadHistoryMessages = useCallback(async () => {
        if (!phone) return;

        setIsLoading(true);
        setError(null);

        try {
            // Buscar conversas
            const conversationsRes = await superbotService.getConversations(phone, {
                limit: historyLimit,
                days: 30
            });

            if (conversationsRes?.data?.success && conversationsRes.data.data?.conversations?.length > 0) {
                // Pegar a sessão mais recente
                const latestSession = conversationsRes.data.data.conversations[0];

                // Buscar mensagens dessa sessão
                const messagesRes = await superbotService.getMessages(latestSession.session_id, {
                    limit: historyLimit
                });

                if (messagesRes?.data?.success && messagesRes.data.data) {
                    const messagesList = messagesRes.data.data || [];

                    // Ordenar por timestamp
                    const sortedMessages = messagesList.sort((a, b) => {
                        const dateA = new Date(a.received_at || a.timestamp);
                        const dateB = new Date(b.received_at || b.timestamp);
                        return dateA - dateB;
                    });

                    setMessages(sortedMessages);
                }
            }
        } catch (err) {
            console.error('[useWhatsAppLive] Error loading history:', err);
            setError('Erro ao carregar histórico');
        } finally {
            setIsLoading(false);
        }
    }, [phone, historyLimit]);

    /**
     * Conecta ao stream de eventos
     */
    const connect = useCallback(async () => {
        if (!supportsSSE()) {
            setError('Seu navegador não suporta conexões em tempo real');
            return;
        }

        // Se já está conectado, não reconectar
        if (connectionRef.current?.isConnected) {
            console.log('[useWhatsAppLive] Already connected');
            return;
        }

        setConnectionStatus('connecting');

        try {
            const connection = getLiveConnection();
            connectionRef.current = connection;

            // IMPORTANTE: Registrar listeners ANTES de conectar
            // para garantir que o evento 'connected' seja capturado
            const unsub1 = connection.on('connected', (data) => {
                console.log('[useWhatsAppLive] Connected event received:', data);
                setIsConnected(true);
                setConnectionStatus('connected');
                setError(null);
            });

            const unsub2 = connection.on('new_message', (message) => {
                console.log('[useWhatsAppLive] New message received:', message);
                // Adicionar nova mensagem ao final
                setMessages(prev => {
                    // Verificar se mensagem já existe (deduplicação)
                    const exists = prev.some(m =>
                        m.message_id === message.message_id ||
                        m.id === message.id
                    );
                    if (exists) return prev;
                    return [...prev, message];
                });
            });

            const unsub3 = connection.on('message_status', (data) => {
                // Atualizar status de mensagem existente
                setMessages(prev => prev.map(m => {
                    if (m.message_id === data.message_id) {
                        return { ...m, status: data.status };
                    }
                    return m;
                }));
            });

            const unsub4 = connection.on('presence', (data) => {
                if (data.phone === phone || phone === '*') {
                    setPresence({
                        status: data.presence,
                        lastSeen: data.last_seen
                    });
                }
            });

            const unsub5 = connection.on('typing', (data) => {
                if (data.phone === phone || phone === '*') {
                    setIsTyping(data.is_typing);

                    // Auto-clear typing após 5 segundos
                    if (data.is_typing) {
                        setTimeout(() => setIsTyping(false), 5000);
                    }
                }
            });

            const unsub6 = connection.on('error', (err) => {
                console.error('[useWhatsAppLive] Connection error:', err);
                setConnectionStatus('error');
            });

            const unsub7 = connection.on('disconnected', () => {
                console.log('[useWhatsAppLive] Disconnected');
                setIsConnected(false);
                setConnectionStatus('disconnected');
            });

            // Guardar unsubscribers para cleanup
            unsubscribersRef.current = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7];

            // AGORA conectar (depois de registrar os listeners)
            console.log('[useWhatsAppLive] Connecting to SSE with phone:', phone);
            await connection.connect({ phone, sessionId });

        } catch (err) {
            console.error('[useWhatsAppLive] Connect error:', err);
            setError('Erro ao conectar');
            setConnectionStatus('error');
        }
    }, [phone, sessionId]);

    /**
     * Desconecta do stream
     */
    const disconnect = useCallback(() => {
        // Remover listeners
        unsubscribersRef.current.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        unsubscribersRef.current = [];

        // Desconectar
        if (connectionRef.current) {
            connectionRef.current.disconnect();
            connectionRef.current = null;
        }

        setIsConnected(false);
        setConnectionStatus('disconnected');
    }, []);

    /**
     * Adiciona mensagem localmente (otimistic update)
     */
    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, {
            ...message,
            id: `local-${Date.now()}`,
            status: 'sending',
            received_at: new Date().toISOString()
        }]);
    }, []);

    /**
     * Atualiza status de mensagem local
     */
    const updateMessageStatus = useCallback((messageId, status) => {
        setMessages(prev => prev.map(m => {
            if (m.id === messageId || m.message_id === messageId) {
                return { ...m, status };
            }
            return m;
        }));
    }, []);

    /**
     * Limpa mensagens
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Efeito: carregar histórico ao mudar phone
    useEffect(() => {
        if (loadHistory && phone) {
            loadHistoryMessages();
        }
    }, [phone, loadHistory, loadHistoryMessages]);

    // Efeito: conectar automaticamente
    useEffect(() => {
        if (autoConnect && phone) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, phone, connect, disconnect]);

    return {
        // State
        messages,
        isConnected,
        isLoading,
        error,
        presence,
        isTyping,
        connectionStatus,

        // Actions
        connect,
        disconnect,
        loadHistoryMessages,
        addMessage,
        updateMessageStatus,
        clearMessages,

        // Helpers
        hasMessages: messages.length > 0,
        messageCount: messages.length,
        supportsLive: supportsSSE()
    };
}

export default useWhatsAppLive;
