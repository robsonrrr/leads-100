/**
 * WhatsApp Live Service
 * 
 * Serviço para conexão em tempo real com o WhatsApp Bot via SSE
 * Permite receber mensagens, status e eventos em tempo real
 * 
 * @version 1.0
 * @date 2026-01-24
 */

// URL do WhatsApp Bot API
const WHATSAPP_BOT_URL = import.meta.env.VITE_WHATSAPP_BOT_URL || 'https://dev.whatsapp.internut.com.br';

/**
 * Classe para gerenciar conexão SSE com o WhatsApp Bot
 */
class WhatsAppLiveConnection {
    constructor() {
        this.eventSource = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.clientId = null;
        this.isConnected = false;
        this.sessionId = null;
        this.phone = null;
    }

    /**
     * Conecta ao stream SSE
     * @param {Object} options - Opções de conexão
     * @param {string} options.sessionId - ID da sessão WhatsApp
     * @param {string} options.phone - Telefone para filtrar mensagens
     * @returns {Promise<boolean>} - Se conectou com sucesso
     */
    connect(options = {}) {
        return new Promise((resolve, reject) => {
            if (this.eventSource) {
                this.disconnect();
            }

            const { sessionId = '', phone = '' } = options;
            this.sessionId = sessionId;
            this.phone = phone;

            const params = new URLSearchParams();
            if (sessionId) params.append('session_id', sessionId);
            if (phone) params.append('phone', phone);

            const url = `${WHATSAPP_BOT_URL}/api/v1/stream?${params.toString()}`;

            console.log('[WhatsApp Live] Connecting to:', url);

            try {
                this.eventSource = new EventSource(url);

                // Evento de conexão estabelecida
                this.eventSource.addEventListener('connected', (event) => {
                    const data = JSON.parse(event.data);
                    this.clientId = data.client_id;
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('[WhatsApp Live] Connected:', data);
                    this.emit('connected', data);
                    resolve(true);
                });

                // Evento de nova mensagem
                this.eventSource.addEventListener('new_message', (event) => {
                    const data = JSON.parse(event.data);
                    console.log('[WhatsApp Live] New message:', data);
                    this.emit('new_message', data);
                });

                // Evento de status de mensagem
                this.eventSource.addEventListener('message_status', (event) => {
                    const data = JSON.parse(event.data);
                    console.log('[WhatsApp Live] Message status:', data);
                    this.emit('message_status', data);
                });

                // Evento de presença (online/offline)
                this.eventSource.addEventListener('presence', (event) => {
                    const data = JSON.parse(event.data);
                    console.log('[WhatsApp Live] Presence:', data);
                    this.emit('presence', data);
                });

                // Evento de digitação
                this.eventSource.addEventListener('typing', (event) => {
                    const data = JSON.parse(event.data);
                    console.log('[WhatsApp Live] Typing:', data);
                    this.emit('typing', data);
                });

                // Heartbeat
                this.eventSource.addEventListener('heartbeat', (event) => {
                    // Silencioso, apenas para manter conexão
                    this.emit('heartbeat', JSON.parse(event.data));
                });

                // Erro de conexão
                this.eventSource.onerror = (error) => {
                    console.error('[WhatsApp Live] Connection error:', error);
                    this.isConnected = false;
                    this.emit('error', error);

                    // Tentar reconectar
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
                        console.log(`[WhatsApp Live] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

                        setTimeout(() => {
                            this.connect(options);
                        }, delay);
                    } else {
                        this.emit('max_reconnect_reached', { attempts: this.reconnectAttempts });
                    }
                };

            } catch (error) {
                console.error('[WhatsApp Live] Failed to create EventSource:', error);
                reject(error);
            }
        });
    }

    /**
     * Desconecta do stream SSE
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.isConnected = false;
            this.clientId = null;
            console.log('[WhatsApp Live] Disconnected');
            this.emit('disconnected', {});
        }
    }

    /**
     * Adiciona listener para um tipo de evento
     * @param {string} event - Tipo de evento
     * @param {Function} callback - Callback a ser chamado
     * @returns {Function} - Função para remover o listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Retorna função para remover listener
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Remove listener de um evento
     * @param {string} event - Tipo de evento
     * @param {Function} callback - Callback a ser removido
     */
    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }

    /**
     * Emite evento para todos os listeners
     * @param {string} event - Tipo de evento
     * @param {*} data - Dados do evento
     */
    emit(event, data) {
        this.listeners.get(event)?.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[WhatsApp Live] Error in listener for ${event}:`, error);
            }
        });
    }

    /**
     * Retorna status da conexão
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            clientId: this.clientId,
            sessionId: this.sessionId,
            phone: this.phone,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Instância singleton
let liveConnectionInstance = null;

/**
 * Obtém instância singleton da conexão live
 * @returns {WhatsAppLiveConnection}
 */
export function getLiveConnection() {
    if (!liveConnectionInstance) {
        liveConnectionInstance = new WhatsAppLiveConnection();
    }
    return liveConnectionInstance;
}

/**
 * Conecta ao stream de eventos
 * @param {Object} options - Opções de conexão
 * @returns {Promise<WhatsAppLiveConnection>}
 */
export async function connectLive(options = {}) {
    const connection = getLiveConnection();
    await connection.connect(options);
    return connection;
}

/**
 * Desconecta do stream
 */
export function disconnectLive() {
    const connection = getLiveConnection();
    connection.disconnect();
}

/**
 * Adiciona listener para eventos
 * @param {string} event - Tipo de evento
 * @param {Function} callback - Callback
 * @returns {Function} - Função para remover listener
 */
export function onLiveEvent(event, callback) {
    const connection = getLiveConnection();
    return connection.on(event, callback);
}

/**
 * Verifica se suporta SSE
 * @returns {boolean}
 */
export function supportsSSE() {
    return typeof EventSource !== 'undefined';
}

export default {
    getLiveConnection,
    connectLive,
    disconnectLive,
    onLiveEvent,
    supportsSSE
};
