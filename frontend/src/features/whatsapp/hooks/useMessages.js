/**
 * WhatsApp v2.0 - useMessages Hook
 * Hook para gerenciar mensagens com paginação
 */

import { useCallback, useEffect, useRef } from 'react'
import { useWhatsAppContext, ACTIONS } from '../context'
import { whatsappApi } from '../services'
import { PAGINATION } from '../utils/constants'

/**
 * Hook para gerenciar mensagens do WhatsApp
 */
export function useMessages() {
    const {
        state,
        dispatch,
        createAbortController,
        isRequestValid,
        setCurrentIds,
    } = useWhatsAppContext()

    // Ref para scroll management
    const previousScrollHeightRef = useRef(0)

    /**
     * Carrega mensagens de uma sessão
     * @param {string} sessionId - ID da sessão
     * @param {boolean} reset - Se true, limpa mensagens anteriores
     * @param {string} phone - Telefone do contato para filtrar mensagens
     */
    const loadMessages = useCallback(async (sessionId, reset = false, phone = null) => {
        if (!sessionId) return

        const controller = createAbortController('messages')

        // Atualizar ID atual para validação
        setCurrentIds({ sessionId })

        if (reset) {
            dispatch({ type: ACTIONS.CLEAR_MESSAGES })
        }

        dispatch({ type: ACTIONS.SET_MESSAGES_LOADING, payload: true })

        const offset = reset ? 0 : state.messagesOffset

        // Usar o telefone do contato selecionado se não foi passado explicitamente
        const contactPhone = phone || state.selectedContact?.phone_number || null

        try {
            const response = await whatsappApi.getMessages(
                sessionId,
                {
                    limit: PAGINATION.MESSAGES_PER_PAGE,
                    offset,
                    phone: contactPhone,
                },
                controller.signal
            )

            // Verificar se requisição ainda é válida
            if (!isRequestValid('messages', sessionId)) {
                console.log('Messages request outdated, discarding')
                return
            }

            const messages = response.data || []

            // Verificar se há mais mensagens
            if (messages.length < PAGINATION.MESSAGES_PER_PAGE) {
                dispatch({ type: ACTIONS.SET_MESSAGES_HAS_MORE, payload: false })
            }

            dispatch({
                type: reset ? ACTIONS.SET_MESSAGES : ACTIONS.APPEND_MESSAGES,
                payload: messages,
            })
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Messages request cancelled')
                return
            }

            dispatch({
                type: ACTIONS.SET_MESSAGES_ERROR,
                payload: error.message || 'Erro ao carregar mensagens',
            })
        }
    }, [dispatch, createAbortController, isRequestValid, setCurrentIds, state.messagesOffset, state.selectedContact?.phone_number])

    /**
     * Carrega mais mensagens (lazy loading)
     */
    const loadMore = useCallback(() => {
        if (state.messagesLoading || !state.messagesHasMore || !state.selectedSession?.session_id) {
            return
        }
        loadMessages(state.selectedSession.session_id, false)
    }, [
        state.messagesLoading,
        state.messagesHasMore,
        state.selectedSession?.session_id,
        loadMessages,
    ])

    /**
     * Agrupa mensagens por data
     */
    const groupedMessages = useCallback(() => {
        const messages = Array.isArray(state.messages) ? state.messages : []

        return messages.reduce((groups, message) => {
            const date = new Date(message.received_at).toDateString()
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(message)
            return groups
        }, {})
    }, [state.messages])

    // Carregar mensagens quando sessão mudar
    useEffect(() => {
        if (state.selectedSession?.session_id) {
            loadMessages(state.selectedSession.session_id, true)
        }
    }, [state.selectedSession?.session_id]) // NÃO incluir loadMessages para evitar loop

    return {
        messages: state.messages,
        loading: state.messagesLoading,
        error: state.messagesError,
        hasMore: state.messagesHasMore,
        offset: state.messagesOffset,

        // Computed
        groupedMessages,

        // Actions
        loadMessages,
        loadMore,

        // Helpers para scroll
        previousScrollHeightRef,
    }
}

export default useMessages
