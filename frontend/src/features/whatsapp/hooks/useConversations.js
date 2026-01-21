/**
 * WhatsApp v2.0 - useConversations Hook
 * Hook para gerenciar conversas/sessões
 */

import { useCallback, useEffect } from 'react'
import { useWhatsAppContext, ACTIONS } from '../context'
import { whatsappApi } from '../services'

/**
 * Hook para gerenciar conversas do WhatsApp
 */
export function useConversations() {
    const {
        state,
        dispatch,
        createAbortController,
        isRequestValid,
        setCurrentIds,
    } = useWhatsAppContext()

    /**
     * Carrega conversas de um contato
     * @param {string} phone - Telefone do contato
     */
    const loadConversations = useCallback(async (phone) => {
        if (!phone) return

        const controller = createAbortController('conversations')

        // Atualizar ID atual para validação
        setCurrentIds({ contactPhone: phone })

        dispatch({ type: ACTIONS.SET_CONVERSATIONS_LOADING, payload: true })

        try {
            const response = await whatsappApi.getConversations(phone, { limit: 20 }, controller.signal)

            // Verificar se requisição ainda é válida
            if (!isRequestValid('conversations', phone)) {
                console.log('Conversations request outdated, discarding')
                return
            }

            const conversations = response.data?.conversations || response.data || []

            dispatch({
                type: ACTIONS.SET_CONVERSATIONS,
                payload: conversations,
            })

            // Auto-selecionar primeira sessão se houver
            if (conversations.length > 0) {
                dispatch({
                    type: ACTIONS.SELECT_SESSION,
                    payload: conversations[0],
                })
            }
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Conversations request cancelled')
                return
            }

            dispatch({
                type: ACTIONS.SET_CONVERSATIONS_ERROR,
                payload: error.message || 'Erro ao carregar conversas',
            })
        }
    }, [dispatch, createAbortController, isRequestValid, setCurrentIds])

    /**
     * Seleciona uma sessão/conversa
     * @param {Object} session - Sessão a selecionar
     */
    const selectSession = useCallback((session) => {
        dispatch({
            type: ACTIONS.SELECT_SESSION,
            payload: session,
        })
    }, [dispatch])

    /**
     * Limpa sessão selecionada
     */
    const clearSession = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_SESSION })
    }, [dispatch])

    // Carregar conversas quando contato selecionado mudar
    useEffect(() => {
        // Suporte a ambos os campos: phone e phone_number
        const contactPhone = state.selectedContact?.phone_number || state.selectedContact?.phone
        if (contactPhone) {
            loadConversations(contactPhone)
        }
    }, [state.selectedContact?.phone, state.selectedContact?.phone_number, loadConversations])

    return {
        conversations: state.conversations,
        loading: state.conversationsLoading,
        error: state.conversationsError,
        selectedSession: state.selectedSession,

        // Actions
        loadConversations,
        selectSession,
        clearSession,
    }
}

export default useConversations
