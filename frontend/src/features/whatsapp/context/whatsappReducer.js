/**
 * WhatsApp v2.0 - Reducer
 * Gerenciamento centralizado de estado
 */

// Action Types
export const ACTIONS = {
    // Contacts
    SET_CONTACTS: 'SET_CONTACTS',
    SET_CONTACTS_LOADING: 'SET_CONTACTS_LOADING',
    SET_CONTACTS_ERROR: 'SET_CONTACTS_ERROR',

    // Selected Contact
    SELECT_CONTACT: 'SELECT_CONTACT',
    CLEAR_CONTACT: 'CLEAR_CONTACT',

    // Conversations (sessions)
    SET_CONVERSATIONS: 'SET_CONVERSATIONS',
    SET_CONVERSATIONS_LOADING: 'SET_CONVERSATIONS_LOADING',
    SET_CONVERSATIONS_ERROR: 'SET_CONVERSATIONS_ERROR',

    // Selected Session
    SELECT_SESSION: 'SELECT_SESSION',
    CLEAR_SESSION: 'CLEAR_SESSION',

    // Messages
    SET_MESSAGES: 'SET_MESSAGES',
    APPEND_MESSAGES: 'APPEND_MESSAGES',
    SET_MESSAGES_LOADING: 'SET_MESSAGES_LOADING',
    SET_MESSAGES_ERROR: 'SET_MESSAGES_ERROR',
    CLEAR_MESSAGES: 'CLEAR_MESSAGES',
    SET_MESSAGES_HAS_MORE: 'SET_MESSAGES_HAS_MORE',

    // Stats
    SET_STATS: 'SET_STATS',

    // Filters
    SET_FILTER_SEARCH: 'SET_FILTER_SEARCH',
    SET_FILTER_SELLER: 'SET_FILTER_SELLER',
    SET_FILTER_DATE_RANGE: 'SET_FILTER_DATE_RANGE',
    CLEAR_FILTERS: 'CLEAR_FILTERS',

    // Global
    RESET_ALL: 'RESET_ALL',
}

// Initial State
export const initialState = {
    // Lista de contatos
    contacts: [],
    contactsLoading: false,
    contactsError: null,
    contactsTotal: 0,

    // Contato selecionado
    selectedContact: null,

    // Conversas do contato selecionado
    conversations: [],
    conversationsLoading: false,
    conversationsError: null,

    // Sessão selecionada
    selectedSession: null,

    // Mensagens da sessão selecionada
    messages: [],
    messagesLoading: false,
    messagesError: null,
    messagesHasMore: true,
    messagesOffset: 0,

    // Estatísticas do contato
    stats: null,

    // Filtros
    filters: {
        search: '',
        sellerId: null,
        dateRange: null,
    },
}

/**
 * Remove mensagens duplicadas baseado em id ou message_id
 * Também filtra mensagens de outras sessões se currentSessionId for fornecido
 * Mantém a primeira ocorrência de cada mensagem
 * @param {Array} messages - Lista de mensagens
 * @param {string} [currentSessionId] - ID da sessão atual (para filtrar)
 * @returns {Array} Lista sem duplicatas
 */
function deduplicateMessages(messages, currentSessionId = null) {
    if (!Array.isArray(messages) || messages.length === 0) return []

    const seen = new Set()

    return messages.filter(msg => {
        // Se temos um sessionId atual, ignorar mensagens de outras sessões
        if (currentSessionId && msg.session_id && msg.session_id !== currentSessionId) {
            console.warn('Mensagem de outra sessão ignorada:', msg.session_id, 'vs', currentSessionId)
            return false
        }

        // Usar id como chave primária (é a PK no banco)
        // Fallback para message_id ou hash se id não existir
        const key = msg.id
            ? `id_${msg.id}`
            : (msg.message_id
                ? `msgid_${msg.message_id}`
                : `hash_${msg.received_at}_${msg.sender_phone}_${(msg.message_text || '').slice(0, 30)}`)

        if (seen.has(key)) {
            return false // Duplicata - ignorar
        }
        seen.add(key)
        return true // Primeira ocorrência - manter
    })
}

/**
 * Reducer principal do WhatsApp
 */
export function whatsappReducer(state, action) {
    switch (action.type) {
        // ============================================
        // CONTACTS
        // ============================================
        case ACTIONS.SET_CONTACTS:
            return {
                ...state,
                contacts: action.payload.contacts || action.payload,
                contactsTotal: action.payload.total || action.payload.length,
                contactsLoading: false,
                contactsError: null,
            }

        case ACTIONS.SET_CONTACTS_LOADING:
            return {
                ...state,
                contactsLoading: action.payload,
            }

        case ACTIONS.SET_CONTACTS_ERROR:
            return {
                ...state,
                contactsError: action.payload,
                contactsLoading: false,
            }

        // ============================================
        // SELECTED CONTACT
        // ============================================
        case ACTIONS.SELECT_CONTACT:
            // Ao selecionar novo contato, limpar conversas e mensagens
            return {
                ...state,
                selectedContact: action.payload,
                conversations: [],
                conversationsLoading: false,
                conversationsError: null,
                selectedSession: null,
                messages: [],
                messagesLoading: false,
                messagesError: null,
                messagesHasMore: true,
                messagesOffset: 0,
                stats: null,
            }

        case ACTIONS.CLEAR_CONTACT:
            return {
                ...state,
                selectedContact: null,
                conversations: [],
                selectedSession: null,
                messages: [],
                stats: null,
            }

        // ============================================
        // CONVERSATIONS
        // ============================================
        case ACTIONS.SET_CONVERSATIONS:
            return {
                ...state,
                conversations: action.payload,
                conversationsLoading: false,
                conversationsError: null,
            }

        case ACTIONS.SET_CONVERSATIONS_LOADING:
            return {
                ...state,
                conversationsLoading: action.payload,
            }

        case ACTIONS.SET_CONVERSATIONS_ERROR:
            return {
                ...state,
                conversationsError: action.payload,
                conversationsLoading: false,
            }

        // ============================================
        // SELECTED SESSION
        // ============================================
        case ACTIONS.SELECT_SESSION:
            // Ao selecionar nova sessão, limpar mensagens
            return {
                ...state,
                selectedSession: action.payload,
                messages: [],
                messagesLoading: false,
                messagesError: null,
                messagesHasMore: true,
                messagesOffset: 0,
            }

        case ACTIONS.CLEAR_SESSION:
            return {
                ...state,
                selectedSession: null,
                messages: [],
                messagesHasMore: true,
                messagesOffset: 0,
            }

        // ============================================
        // MESSAGES
        // ============================================
        case ACTIONS.SET_MESSAGES: {
            // Passar sessionId atual para filtrar mensagens de outras sessões
            const currentSessionId = state.selectedSession?.session_id
            const dedupedMessages = deduplicateMessages(action.payload, currentSessionId)
            return {
                ...state,
                messages: dedupedMessages,
                messagesOffset: dedupedMessages.length,
                messagesLoading: false,
                messagesError: null,
            }
        }

        case ACTIONS.APPEND_MESSAGES: {
            // Prepend para lazy loading (mensagens antigas no topo)
            // Aplicar deduplicação para evitar mensagens repetidas
            const currentSessionId = state.selectedSession?.session_id
            const newMessages = Array.isArray(action.payload) ? [...action.payload].reverse() : []
            const combined = [...newMessages, ...state.messages]
            const dedupedMessages = deduplicateMessages(combined, currentSessionId)
            return {
                ...state,
                messages: dedupedMessages,
                messagesOffset: state.messagesOffset + action.payload.length,
                messagesLoading: false,
                messagesError: null,
            }
        }

        case ACTIONS.SET_MESSAGES_LOADING:
            return {
                ...state,
                messagesLoading: action.payload,
            }

        case ACTIONS.SET_MESSAGES_ERROR:
            return {
                ...state,
                messagesError: action.payload,
                messagesLoading: false,
            }

        case ACTIONS.CLEAR_MESSAGES:
            return {
                ...state,
                messages: [],
                messagesOffset: 0,
                messagesHasMore: true,
                messagesError: null,
            }

        case ACTIONS.SET_MESSAGES_HAS_MORE:
            return {
                ...state,
                messagesHasMore: action.payload,
            }

        // ============================================
        // STATS
        // ============================================
        case ACTIONS.SET_STATS:
            return {
                ...state,
                stats: action.payload,
            }

        // ============================================
        // FILTERS
        // ============================================
        case ACTIONS.SET_FILTER_SEARCH:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    search: action.payload,
                },
            }

        case ACTIONS.SET_FILTER_SELLER:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    sellerId: action.payload,
                },
            }

        case ACTIONS.SET_FILTER_DATE_RANGE:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    dateRange: action.payload,
                },
            }

        case ACTIONS.CLEAR_FILTERS:
            return {
                ...state,
                filters: initialState.filters,
            }

        // ============================================
        // GLOBAL
        // ============================================
        case ACTIONS.RESET_ALL:
            return initialState

        default:
            console.warn(`WhatsApp Reducer: Unknown action type: ${action.type}`)
            return state
    }
}
