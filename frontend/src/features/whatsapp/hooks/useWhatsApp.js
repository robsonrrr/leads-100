/**
 * WhatsApp v2.0 - useWhatsApp Hook
 * Hook principal que combina todos os outros hooks
 */

import { useEffect } from 'react'
import { useWhatsAppContext, ACTIONS } from '../context'
import { useContacts } from './useContacts'
import { useConversations } from './useConversations'
import { useMessages } from './useMessages'
import { useStats } from './useStats'

/**
 * Hook principal do WhatsApp
 * Combina todos os hooks e fornece acesso unificado
 */
export function useWhatsApp() {
    const { state, dispatch, cancelAllRequests } = useWhatsAppContext()

    // Hooks individuais
    const contacts = useContacts()
    const conversations = useConversations()
    const messages = useMessages()
    const stats = useStats()

    /**
     * Reset completo do estado
     */
    const reset = () => {
        cancelAllRequests()
        dispatch({ type: ACTIONS.RESET_ALL })
    }

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            cancelAllRequests()
        }
    }, [cancelAllRequests])

    return {
        // Estado completo (para debug)
        state,

        // Contacts
        contacts: contacts.contacts,
        contactsLoading: contacts.loading,
        contactsError: contacts.error,
        selectedContact: contacts.selectedContact,
        loadContacts: contacts.loadContacts,
        loadMyContacts: contacts.loadMyContacts,
        selectContact: contacts.selectContact,
        clearContact: contacts.clearContact,

        // Filters
        filters: contacts.filters,
        setSearchFilter: contacts.setSearchFilter,
        setSellerFilter: contacts.setSellerFilter,

        // Conversations
        conversations: conversations.conversations,
        conversationsLoading: conversations.loading,
        conversationsError: conversations.error,
        selectedSession: conversations.selectedSession,
        loadConversations: conversations.loadConversations,
        selectSession: conversations.selectSession,
        clearSession: conversations.clearSession,

        // Messages
        messages: messages.messages,
        messagesLoading: messages.loading,
        messagesError: messages.error,
        messagesHasMore: messages.hasMore,
        groupedMessages: messages.groupedMessages,
        loadMessages: messages.loadMessages,
        loadMoreMessages: messages.loadMore,

        // Stats
        stats: stats.stats,
        loadStats: stats.loadStats,

        // Global
        reset,
    }
}

export default useWhatsApp
