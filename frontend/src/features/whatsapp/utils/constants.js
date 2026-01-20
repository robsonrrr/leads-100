/**
 * WhatsApp v2.0 - Constants
 * Cores, labels e configurações
 */

// Cores para bolhas de mensagem
export const BUBBLE_COLORS = {
    incoming: {
        bg: '#ffffff',
        border: '#e0e0e0',
        shadow: '0 1px 0.5px rgba(0,0,0,0.1)',
    },
    outgoing: {
        bg: '#dcf8c6',
        border: '#a8d5a2',
        shadow: '0 1px 0.5px rgba(0,0,0,0.1)',
    },
    ai: {
        bg: '#e3f2fd',
        border: '#90caf9',
        icon: '#1976d2',
    },
}

// Fundo do chat (estilo WhatsApp)
export const CHAT_BACKGROUND = {
    bg: '#e5ddd5',
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'64\' height=\'64\' viewBox=\'0 0 64 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z\' fill=\'%23d7ccc8\' fill-opacity=\'0.3\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
}

// Cores de intenção
export const INTENT_COLORS = {
    QUOTE_REQUEST: '#4CAF50',
    PURCHASE_INTENT: '#2196F3',
    PRICE_CHECK: '#FF9800',
    STOCK_CHECK: '#9C27B0',
    COMPLAINT: '#F44336',
    ORDER_STATUS: '#00BCD4',
    NEGOTIATION: '#FFC107',
    GREETING: '#8BC34A',
    THANKS: '#4CAF50',
    GENERAL_QUESTION: '#607D8B',
    UNKNOWN: '#9E9E9E',
}

// Labels de intenção (português)
export const INTENT_LABELS = {
    QUOTE_REQUEST: 'Cotação',
    PURCHASE_INTENT: 'Intenção de Compra',
    PRICE_CHECK: 'Consulta de Preço',
    STOCK_CHECK: 'Consulta de Estoque',
    COMPLAINT: 'Reclamação',
    ORDER_STATUS: 'Status do Pedido',
    NEGOTIATION: 'Negociação',
    GREETING: 'Saudação',
    THANKS: 'Agradecimento',
    GENERAL_QUESTION: 'Pergunta Geral',
    UNKNOWN: 'Desconhecido',
}

// Configurações de paginação
export const PAGINATION = {
    MESSAGES_PER_PAGE: 50,
    CONTACTS_PER_PAGE: 50,
}

// Timeouts
export const TIMEOUTS = {
    SEARCH_DEBOUNCE: 300,
    API_TIMEOUT: 30000,
}
